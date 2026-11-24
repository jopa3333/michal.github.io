import { describe, expect, it } from 'vitest';
import {
  DRIVE_FILE_NAME,
  downloadBackupFile,
  fetchUserInfo,
  findBackupFile,
  uploadBackupFile,
} from '../../src/gdrive.js';
import { buildBackupPayload } from '../../src/logic.js';

const TOKEN = 'test-token-123';

function jsonResponse(status, data) {
  return {
    ok: status >= 200 && status < 300,
    status,
    json: async () => data,
    text: async () => JSON.stringify(data),
  };
}

describe('gdrive: findBackupFile', () => {
  it('zwraca plik kopii z Drive', async () => {
    const calls = [];
    const fakeFetch = (url, options) => {
      calls.push({ url, options });
      return Promise.resolve(jsonResponse(200, { files: [{ id: 'file_9', modifiedTime: '2026-01-02T10:00:00Z' }] }));
    };
    const file = await findBackupFile(TOKEN, fakeFetch);
    expect(file).toEqual({ id: 'file_9', modifiedTime: '2026-01-02T10:00:00Z' });
    expect(calls[0].url).toContain('https://www.googleapis.com/drive/v3/files');
    expect(decodeURIComponent(calls[0].url)).toContain(`name = '${DRIVE_FILE_NAME}'`);
    expect(calls[0].options.headers.Authorization).toBe(`Bearer ${TOKEN}`);
  });

  it('zwraca null, gdy na Drive nie ma jeszcze kopii', async () => {
    const fakeFetch = () => Promise.resolve(jsonResponse(200, { files: [] }));
    expect(await findBackupFile(TOKEN, fakeFetch)).toBeNull();
  });

  it('rzuca błąd przy odpowiedzi innej niż 2xx', async () => {
    const fakeFetch = () => Promise.resolve(jsonResponse(401, {}));
    await expect(findBackupFile(TOKEN, fakeFetch)).rejects.toThrow('drive list 401');
  });
});

describe('gdrive: uploadBackupFile', () => {
  const content = JSON.stringify({ version: 'trening2026_1.1', history: [] });

  it('tworzy nowy plik multipart z poprawną nazwą', async () => {
    const calls = [];
    const fakeFetch = (url, options) => {
      calls.push({ url, options });
      return Promise.resolve(jsonResponse(200, { id: 'file_new' }));
    };
    const result = await uploadBackupFile(TOKEN, { fileId: null, content }, fakeFetch);
    expect(result.id).toBe('file_new');
    expect(calls[0].url).toBe('https://www.googleapis.com/upload/drive/v3/files?uploadType=multipart&fields=id');
    expect(calls[0].options.method).toBe('POST');
    expect(calls[0].options.body).toContain(DRIVE_FILE_NAME);
    expect(calls[0].options.body).toContain('trening2026_1.1');
  });

  it('nadpisuje istniejący plik przez PATCH uploadType=media', async () => {
    const calls = [];
    const fakeFetch = (url, options) => {
      calls.push({ url, options });
      return Promise.resolve(jsonResponse(200, { id: 'file_old' }));
    };
    await uploadBackupFile(TOKEN, { fileId: 'file_old', content }, fakeFetch);
    expect(calls[0].url).toBe('https://www.googleapis.com/upload/drive/v3/files/file_old?uploadType=media');
    expect(calls[0].options.method).toBe('PATCH');
    expect(calls[0].options.body).toBe(content);
  });

  it('rzuca błąd, gdy Drive odrzuci upload', async () => {
    const fakeFetch = () => Promise.resolve(jsonResponse(500, {}));
    await expect(uploadBackupFile(TOKEN, { fileId: null, content }, fakeFetch)).rejects.toThrow('drive upload 500');
  });
});

describe('gdrive: downloadBackupFile i fetchUserInfo', () => {
  it('pobiera i parsuje kopię z Drive', async () => {
    const payload = { version: 'trening2026_1.1', plan: {}, history: [{ week: 1 }] };
    const fakeFetch = () => Promise.resolve(jsonResponse(200, payload));
    expect(await downloadBackupFile(TOKEN, 'f1', fakeFetch)).toEqual(payload);
  });

  it('fetchUserInfo zwraca e-mail i imię', async () => {
    const fakeFetch = () => Promise.resolve(jsonResponse(200, { email: 'jan@example.com', name: 'Jan' }));
    expect(await fetchUserInfo(TOKEN, fakeFetch)).toEqual({ email: 'jan@example.com', name: 'Jan' });
  });
});

describe('logic: buildBackupPayload', () => {
  it('buduje pełną kopię w formacie pliku JSON', () => {
    const settings = { activePlanId: 'plan_default', currentWeek: 3 };
    const plan = { A: { exercises: [] } };
    const savedPlans = [{ id: 'plan_default', workouts: plan }];
    const history = [{ week: 1, totalVolume: 1000 }];
    const payload = buildBackupPayload({ settings, plan, savedPlans, history }, '2026-11-23T20:00:00.000Z');
    expect(payload).toEqual({
      version: 'trening2026_1.1',
      exportDate: '2026-11-23T20:00:00.000Z',
      settings,
      plan,
      savedPlans,
      history,
    });
  });

  it('nie mutuje danych wejściowych przy budowie kopii', () => {
    const history = [{ week: 1 }];
    const payload = buildBackupPayload({ settings: {}, plan: {}, savedPlans: [], history });
    payload.history.push({ week: 2 });
    expect(history).toEqual([{ week: 1 }]);
  });
});
