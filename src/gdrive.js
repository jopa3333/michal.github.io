// ============================================================
// Kopia w chmurze — Google Drive przez Google Identity Services.
// Logowanie działa bez własnego serwera: token dostaje przeglądarka
// (implicit flow), zakres ograniczony do drive.file — apka widzi tylko
// pliki, które sama utworzyła ("trening2026_backup.json").
// ============================================================

export const DRIVE_FILE_NAME = 'trening2026_backup.json';
export const DRIVE_SCOPES = 'openid email profile https://www.googleapis.com/auth/drive.file';

// Identyfikator klienta OAuth tej aplikacji (Google Cloud Console → Credentials).
// To nie jest sekret — identyfikatory klienta stron WWW są jawne i widoczne
// w kodzie każdej aplikacji z „Zaloguj z Google". Logowanie i tak działa tylko
// z domen zarejestrowanych w „Authorized JavaScript origins".
export const CLIENT_ID = '219879683829-d1t3a48du6b9cpnrurbn0tbapeb0pqqp.apps.googleusercontent.com';

const GIS_SRC = 'https://accounts.google.com/gsi/client';
let gisPromise = null;

// Wczytuje bibliotekę Google Identity Services dopiero przy pierwszym
// logowaniu — startup apki zostaje lekki.
export function loadGis() {
  if (typeof window === 'undefined') return Promise.reject(new Error('Brak window'));
  if (window.google && window.google.accounts && window.google.accounts.oauth2) return Promise.resolve();
  if (gisPromise) return gisPromise;
  gisPromise = new Promise((resolve, reject) => {
    const script = document.createElement('script');
    script.src = GIS_SRC;
    script.async = true;
    script.onload = () => resolve();
    script.onerror = () => {
      gisPromise = null;
      reject(new Error('Nie udało się wczytać biblioteki Google'));
    };
    document.head.appendChild(script);
  });
  return gisPromise;
}

// Tokeny trzymane tylko w pamięci (nigdy w localStorage — to sekret).
// Ważą się ~1 h, odświeżenie wymaga kliknięcia "Kopia teraz" /
// cichego ponownego uzgodnienia przez zalogowaną sesję Google.
const tokenCache = new Map();

export function hasFreshToken(clientId, now = Date.now()) {
  const entry = tokenCache.get(clientId);
  return Boolean(entry && entry.expiresAt > now);
}

export function clearToken(clientId) {
  tokenCache.delete(clientId);
}

// Prosi o token; przy zgodzie danej wcześniej (prompt: '') Google
// zwykle oddaje token bez żadnego okna (ciche odświeżenie).
export async function requestToken({ clientId, prompt = '' } = {}) {
  if (!clientId) throw new Error('Brak Client ID');
  if (hasFreshToken(clientId)) return tokenCache.get(clientId).token;
  await loadGis();
  return new Promise((resolve, reject) => {
    const client = window.google.accounts.oauth2.initTokenClient({
      client_id: clientId,
      scope: DRIVE_SCOPES,
      prompt,
      callback: response => {
        if (response && response.access_token) {
          tokenCache.set(clientId, {
            token: response.access_token,
            expiresAt: Date.now() + ((Number(response.expires_in) || 3600) - 60) * 1000,
          });
          resolve(response.access_token);
        } else {
          reject(new Error((response && response.error) || 'token_error'));
        }
      },
      error_callback: error => reject(new Error((error && error.type) || 'token_error')),
    });
    client.requestAccessToken();
  });
}

// Kim jest zalogowany użytkownik (dla podpisu "Zalogowano jako...").
export async function fetchUserInfo(token, fetchFn = fetch) {
  const res = await fetchFn('https://www.googleapis.com/oauth2/v3/userinfo', {
    headers: { Authorization: `Bearer ${token}` },
  });
  if (!res.ok) throw new Error(`userinfo ${res.status}`);
  const data = await res.json();
  return { email: data.email || '', name: data.name || '' };
}

function authHeaders(token) {
  return { Authorization: `Bearer ${token}` };
}

// Szuka pliku kopii na Dysku; null = jeszcze nie ma żadnej kopii.
export async function findBackupFile(token, fetchFn = fetch) {
  const query = `name = '${DRIVE_FILE_NAME}' and trashed = false`;
  const url =
    'https://www.googleapis.com/drive/v3/files' +
    `?q=${encodeURIComponent(query)}` +
    `&fields=${encodeURIComponent('files(id, name, modifiedTime)')}` +
    `&orderBy=${encodeURIComponent('modifiedTime desc')}` +
    '&pageSize=5';
  const res = await fetchFn(url, { headers: authHeaders(token) });
  if (!res.ok) throw new Error(`drive list ${res.status}`);
  const data = await res.json();
  const files = Array.isArray(data.files) ? data.files : [];
  return files.length ? { id: files[0].id, modifiedTime: files[0].modifiedTime } : null;
}

// Nowy plik: multipart; istniejący: nadpis (media PATCH).
export async function uploadBackupFile(token, { fileId = null, content }, fetchFn = fetch) {
  if (fileId) {
    const url = `https://www.googleapis.com/upload/drive/v3/files/${encodeURIComponent(fileId)}?uploadType=media`;
    const res = await fetchFn(url, {
      method: 'PATCH',
      headers: { ...authHeaders(token), 'Content-Type': 'application/json' },
      body: content,
    });
    if (!res.ok) throw new Error(`drive upload ${res.status}`);
    return res.json();
  }
  const boundary = `trening2026boundary${Date.now()}`;
  const metadata = JSON.stringify({ name: DRIVE_FILE_NAME, mimeType: 'application/json' });
  const body = [
    `--${boundary}`,
    'Content-Type: application/json; charset=UTF-8',
    '',
    metadata,
    `--${boundary}`,
    'Content-Type: application/json',
    '',
    content,
    `--${boundary}--`,
  ].join('\r\n');
  const url = 'https://www.googleapis.com/upload/drive/v3/files?uploadType=multipart&fields=id';
  const res = await fetchFn(url, {
    method: 'POST',
    headers: { ...authHeaders(token), 'Content-Type': `multipart/related; boundary=${boundary}` },
    body,
  });
  if (!res.ok) throw new Error(`drive upload ${res.status}`);
  return res.json();
}

export async function downloadBackupFile(token, fileId, fetchFn = fetch) {
  const url = `https://www.googleapis.com/drive/v3/files/${encodeURIComponent(fileId)}?alt=media`;
  const res = await fetchFn(url, { headers: authHeaders(token) });
  if (!res.ok) throw new Error(`drive download ${res.status}`);
  const text = await res.text();
  return JSON.parse(text);
}
