import { expect, test } from '@playwright/test';

// Language gate, persistence and the settings switcher.
test.beforeEach(async ({ page }) => {
  page.on('dialog', dialog => dialog.accept());
});

test('first run shows the language gate and English choice persists', async ({ page }) => {
  await page.goto('/');
  await expect(page.locator('#langGatePl')).toBeVisible();
  await expect(page.locator('#langGateEn')).toBeVisible();
  await page.locator('#langGateEn').click();
  await expect(page.locator('#langGateEn')).toHaveCount(0);
  await expect(page.locator('.logo-title')).toHaveText('GYM');
  await expect(page.locator('.logo-badge')).toHaveText('WEEK 1');
  await expect(page.locator('.start-title')).toHaveText('WORKOUT A');
  await expect(page.locator('#nav-workout .nav-label')).toHaveText('Workout');
  await page.reload();
  await expect(page.locator('.logo-title')).toHaveText('GYM');
  await expect(page.locator('#langGatePl')).toHaveCount(0);
});

test('first run Polish choice keeps the Polish UI', async ({ page }) => {
  await page.goto('/');
  await page.locator('#langGatePl').click();
  await expect(page.locator('.logo-title')).toHaveText('SIŁOWNIA');
  await expect(page.locator('.start-title')).toHaveText('TRENING A');
  await page.reload();
  await expect(page.locator('.logo-title')).toHaveText('SIŁOWNIA');
  await expect(page.locator('#langGatePl')).toHaveCount(0);
});

test('settings switcher translates the app both ways', async ({ page }) => {
  await page.addInitScript(() => localStorage.setItem('trening2026_lang_v1', JSON.stringify('pl')));
  await page.goto('/');
  await page.locator('#nav-settings').click();
  await page.locator('#langEnBtn').click();
  await expect(page.locator('.logo-title')).toHaveText('GYM');
  await page.locator('#nav-start').click();
  await expect(page.locator('.start-title')).toHaveText('WORKOUT A');
  await expect(page.locator('.preview-exercise-name').first()).toHaveText('Barbell Back Squat');
  await page.locator('#nav-settings').click();
  await page.locator('#langPlBtn').click();
  await expect(page.locator('.logo-title')).toHaveText('SIŁOWNIA');
  await page.locator('#nav-start').click();
  await expect(page.locator('.start-title')).toHaveText('TRENING A');
  await expect(page.locator('.preview-exercise-name').first()).toHaveText('Przysiad z sztangą na plecach');
});

test('existing user data skips the gate and defaults to Polish', async ({ page }) => {
  await page.addInitScript(() => {
    localStorage.removeItem('trening2026_lang_v1');
    localStorage.setItem('trening2026_history_v1', JSON.stringify([]));
  });
  await page.goto('/');
  await expect(page.locator('#langGatePl')).toHaveCount(0);
  await expect(page.locator('.logo-title')).toHaveText('SIŁOWNIA');
});

test('English workout flow records sets and finishes with English UI', async ({ page }) => {
  await page.addInitScript(() => localStorage.setItem('trening2026_lang_v1', JSON.stringify('en')));
  await page.goto('/');
  await page.locator('.start-hero .btn-gold').click();
  await expect(page.locator('.assistant-ex-count')).toHaveText('EXERCISE 1 OF 7');
  await expect(page.locator('.exercise-name-header')).toHaveText('Barbell Back Squat');
  await page.locator('.rep-btn', { hasText: /^5$/ }).click();
  await expect(page.locator('.set-row.completed')).toContainText('0 kg × 5');
  await page.locator('.btn-finish-link').click();
  await expect(page.locator('.modal-title', { hasText: 'Workout Complete!' })).toBeVisible();
  await page.getByRole('button', { name: 'Great, go to history' }).click();
  await expect(page.locator('.session-title')).toHaveText('WORKOUT A');
  await expect(page.locator('.session-ex-name').first()).toHaveText('Barbell Back Squat');
});

test('English library pick and typed name store the canonical exercise', async ({ page }) => {
  await page.addInitScript(() => localStorage.setItem('trening2026_lang_v1', JSON.stringify('en')));
  await page.goto('/');
  await page.locator('#nav-plan').click();
  await page.getByRole('button', { name: '+ Add exercise' }).click();
  await page.locator('#exerciseLibrary').selectOption({ label: 'Hanging Leg Raise' });
  await expect(page.locator('#modalExName')).toHaveValue('Hanging Leg Raise');
  await expect(page.locator('#modalExStep')).toHaveCount(0);
  await page.getByRole('button', { name: 'Save exercise' }).click();
  await expect(page.locator('.plan-item-title', { hasText: 'Hanging Leg Raise' })).toBeVisible();
  // Typing the English name must also trigger bodyweight mode.
  await page.getByRole('button', { name: '+ Add exercise' }).click();
  await page.locator('#modalExName').fill('Push-Up');
  await expect(page.locator('#modalExStep')).toHaveCount(0);
  await page.getByRole('button', { name: 'Save exercise' }).click();
  const names = await page.evaluate(() => JSON.parse(localStorage.getItem('trening2026_plan_v1')).A.exercises.map(e => e.name));
  expect(names).toContain('Wznosy nóg w zwisie na drążku');
  expect(names).toContain('Pompki klasyczne');
});
