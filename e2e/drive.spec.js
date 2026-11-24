import { expect, test } from '@playwright/test';

// Kopia na Google Drive — realnego Google nie dotykamy; biblioteka logowania
// i API Drive są podstawione przez page.route, więc testuję pełny przepływ
// UI na Pulpicie: zaloguj → kopia → przywracanie → wylogowanie.

async function seedSettings(page, googleDrive) {
  await page.evaluate(({ googleDrive }) => {
    localStorage.setItem(
      'trening2026_settings_v1',
      JSON.stringify({ currentWeek: 1, activePlanId: 'plan_default', unit: 'kg', googleDrive })
    );
  }, { googleDrive });
}

// Podstawia sieć Google: bibliotekę GIS (window.google) i endpointy Drive.
function mockGoogle(page, { files = [], downloadPayload = null } = {}) {
  const state = { files, uploadedContent: null };

  // „Biblioteka” GIS wczytywana przez <script src=".../gsi/client">.
  const fakeGis = `
    window.google = {
      accounts: {
        oauth2: {
          initTokenClient: (opts) => ({
            requestAccessToken: () => opts.callback({ access_token: 'e2e-token', expires_in: 3600 }),
          }),
        },
      },
    };
  `;

  page.route('https://accounts.google.com/gsi/client', route =>
    route.fulfill({ contentType: 'application/javascript', body: fakeGis })
  );

  page.route('https://www.googleapis.com/**', route => {
    const url = new URL(route.request().url());
    const path = url.pathname;
    if (path === '/oauth2/v3/userinfo') {
      return route.fulfill({ contentType: 'application/json', body: JSON.stringify({ email: 'test@example.com', name: 'Test' }) });
    }
    if (path.startsWith('/drive/v3/files/') && url.searchParams.get('alt') === 'media') {
      if (!downloadPayload) return route.fulfill({ status: 404, body: '{}' });
      return route.fulfill({ contentType: 'application/json', body: JSON.stringify(downloadPayload) });
    }
    if (path === '/drive/v3/files') {
      return route.fulfill({ contentType: 'application/json', body: JSON.stringify({ files }) });
    }
    if (path.startsWith('/upload/drive/v3/files')) {
      state.uploadedContent = route.request().postData();
      return route.fulfill({ contentType: 'application/json', body: JSON.stringify({ id: 'file_drive_1' }) });
    }
    return route.fulfill({ status: 404, body: '{}' });
  });

  return state;
}

test.beforeEach(async ({ page }) => {
  await page.addInitScript(() => localStorage.setItem('trening2026_lang_v1', JSON.stringify('pl')));
});

test('pulpit bez logowania pokazuje kartę Zaloguj z Google (Ustawienia czyste)', async ({ page }) => {
  await page.goto('/');
  await page.locator('#nav-start').click();
  const googleCard = page.locator('.dashboard-card', { hasText: 'Konto Google' });
  await expect(googleCard).toContainText('Zaloguj z Google');
  await expect(googleCard).not.toContainText('WKRÓTCE');

  await page.locator('#nav-settings').click();
  await expect(page.locator('text=Kopia w chmurze')).toHaveCount(0);
});

test('logowanie Google prosto z Pulpitu (bez wchodzenia w Ustawienia)', async ({ page }) => {
  mockGoogle(page);
  await page.goto('/');
  await page.locator('#nav-start').click();

  await page.locator('.dashboard-card', { hasText: 'Konto Google' }).locator('button', { hasText: 'Zaloguj z Google' }).click();
  const googleCard = page.locator('.dashboard-card', { hasText: 'test@example.com' });
  await expect(googleCard).toContainText('Na Drive nie ma jeszcze żadnej kopii');
  await expect(googleCard.locator('button', { hasText: 'Zrób kopię na Drive teraz' })).toBeVisible();
  await expect(googleCard.locator('button', { hasText: 'Przywróć dane z Drive' })).toBeVisible();
  await expect(googleCard.locator('button', { hasText: 'Wyloguj z Google' })).toBeVisible();
});

test('zalogowany pulpit robi kopię na Drive i pamiętamy datę', async ({ page }) => {
  const state = mockGoogle(page);
  await page.goto('/');
  await page.evaluate(() => {
    localStorage.setItem(
      'trening2026_history_v1',
      JSON.stringify([{ sessionId: 's1', workoutId: 'A', workoutName: 'TRENING A', week: 1, exercises: [] }])
    );
  });
  await seedSettings(page, { email: 'test@example.com' });
  await page.reload();
  await page.locator('#nav-start').click();

  const googleCard = page.locator('.dashboard-card', { hasText: 'test@example.com' });
  await googleCard.locator('button', { hasText: 'Zrób kopię na Drive teraz' }).click();
  await expect(page.locator('text=Kopia zapasowa zapisana na Google Drive')).toBeVisible();
  await expect(googleCard).toContainText('Ostatnia kopia na Drive:');

  expect(state.uploadedContent).toContain('trening2026_1.1');
  expect(state.uploadedContent).toContain('TRENING A');
});

test('przywracanie z Drive z Pulpitu zastępuje dane lokalne', async ({ page }) => {
  mockGoogle(page, {
    files: [{ id: 'file_drive_1', modifiedTime: '2026-01-01T00:00:00Z' }],
    downloadPayload: {
      version: 'trening2026_1.1',
      settings: { currentWeek: 2, activePlanId: 'plan_default', unit: 'kg' },
      plan: { A: { name: 'TRENING A', exercises: [] } },
      savedPlans: [],
      history: [{ sessionId: 'from_drive', workoutId: 'A', workoutName: 'TRENING A', week: 2, exercises: [] }],
    },
  });
  await page.goto('/');
  await seedSettings(page, { email: 'test@example.com' });
  await page.reload();
  await page.locator('#nav-start').click();

  page.on('dialog', dialog => dialog.accept());
  await page.locator('.dashboard-card', { hasText: 'test@example.com' }).locator('button', { hasText: 'Przywróć dane z Drive' }).click();
  await expect(page.locator('text=Przywrócono dane z Google Drive')).toBeVisible();

  await page.locator('#nav-history').click();
  await expect(page.locator('.session-week-tag', { hasText: 'Tydzień 2' })).toBeVisible();
});

test('brak kopii na Drive daje jasny komunikat', async ({ page }) => {
  mockGoogle(page);
  await page.goto('/');
  await seedSettings(page, { email: 'test@example.com' });
  await page.reload();
  await page.locator('#nav-start').click();

  await page.locator('.dashboard-card', { hasText: 'test@example.com' }).locator('button', { hasText: 'Przywróć dane z Drive' }).click();
  await expect(page.locator('text=Na Google Drive nie znaleziono kopii zapasowej')).toBeVisible();
});

test('wylogowanie z Pulpitu czyści kartę Google', async ({ page }) => {
  mockGoogle(page);
  await page.goto('/');
  await seedSettings(page, { email: 'test@example.com' });
  await page.reload();
  await page.locator('#nav-start').click();

  await page.locator('.dashboard-card', { hasText: 'test@example.com' }).locator('button', { hasText: 'Wyloguj z Google' }).click();
  const googleCard = page.locator('.dashboard-card', { hasText: 'Konto Google' });
  await expect(googleCard).toContainText('Zaloguj z Google');
});
