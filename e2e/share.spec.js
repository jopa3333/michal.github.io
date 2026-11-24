import { expect, test } from '@playwright/test';

// Udostępnianie podsumowania treningu — navigator.share podstawiony przez
// addInitScript (desktopowy Chromium nie ma Web Share API), więc testuję
// pełny przepływ: koniec treningu → Udostępnij, oraz Historia → Udostępnij.

async function seedHistory(page) {
  await page.evaluate(() => {
    localStorage.setItem(
      'trening2026_history_v1',
      JSON.stringify([
        {
          sessionId: 's1',
          workoutId: 'A',
          workoutName: 'TRENING A',
          week: 1,
          date: '2026-01-05T10:00:00.000Z',
          totalSets: 2,
          totalVolume: 1000,
          exercises: [{ id: 'ex1', name: 'Przysiad z sztangą na plecach', targetSets: 3, sets: [{ weight: 100, reps: 5 }, { weight: 100, reps: 5 }] }],
        },
      ])
    );
  });
}

async function stubShare(page) {
  await page.addInitScript(() => {
    window.__shares = [];
    Object.defineProperty(navigator, 'share', {
      value: data => { window.__shares.push(data); return Promise.resolve(); },
      configurable: true,
    });
  });
}

test.beforeEach(async ({ page }) => {
  page.on('dialog', dialog => dialog.accept());
  await page.addInitScript(() => localStorage.setItem('trening2026_lang_v1', JSON.stringify('pl')));
});

test('podsumowanie po treningu otwiera udostępnianie z tekstem treningu', async ({ page }) => {
  await stubShare(page);
  await page.goto('/');
  await page.locator('.start-hero .btn-gold').click();
  await expect(page.locator('.assistant-ex-count')).toBeVisible();
  await page.locator('.rep-btn').first().click();
  await expect(page.locator('.set-row.completed')).toHaveCount(1);
  await page.locator('.btn-finish-link').click();

  const shareBtn = page.locator('#summaryShareBtn');
  await expect(shareBtn).toBeVisible();
  await shareBtn.click();
  await expect.poll(async () => page.evaluate(() => window.__shares.length)).toBe(1);
  const shared = await page.evaluate(() => window.__shares[0].text);
  expect(shared).toContain('TRENING A');
  expect(shared).toContain('Zapisane w Trening 2026');
});

test('historia pozwala udostępnić zapisany trening', async ({ page }) => {
  await stubShare(page);
  await page.goto('/');
  await seedHistory(page);
  await page.reload();
  await page.locator('#nav-history').click();

  await page.locator('.share-session-btn').first().click();
  await expect.poll(async () => page.evaluate(() => window.__shares.length)).toBe(1);
  const shared = await page.evaluate(() => window.__shares[0].text);
  expect(shared).toContain('TRENING A');
  expect(shared).toContain('Przysiad z sztangą na plecach');
  expect(shared).toContain('100 kg × 5');
});

test('na telefonie bez Web Share kopia leci do schowka', async ({ page }) => {
  await page.context().grantPermissions(['clipboard-read', 'clipboard-write']);
  await page.goto('/');
  await seedHistory(page);
  await page.reload();
  await page.locator('#nav-history').click();

  await page.locator('.share-session-btn').first().click();
  await expect(page.locator('text=Podsumowanie skopiowane do schowka')).toBeVisible();
  const clip = await page.evaluate(() => navigator.clipboard.readText());
  expect(clip).toContain('TRENING A');
});
