import { expect, test } from '@playwright/test';

// New features: kg/lb units, plate calculator, PR detection, badges, auto-rest.
const KEYS = {
  history: 'trening2026_history_v1',
  settings: 'trening2026_settings_v1',
};

async function seed(page, values) {
  await page.goto('/');
  await page.evaluate(entries => {
    for (const [key, value] of entries) localStorage.setItem(key, JSON.stringify(value));
  }, Object.entries(values));
  await page.reload();
}

test.beforeEach(async ({ page }) => {
  page.on('dialog', dialog => dialog.accept());
  await page.addInitScript(() => localStorage.setItem('trening2026_lang_v1', JSON.stringify('pl')));
});

test('kg/lb switch converts the display while storage stays canonical kg', async ({ page }) => {
  await page.goto('/');
  await page.locator('#nav-settings').click();
  await page.locator('#unitLbBtn').click();
  await expect(page.locator('#notif-msg')).toContainText('Jednostki wagi: lb');

  await page.locator('#nav-workout').click();
  await page.locator('.start-hero .btn-gold').click();
  await expect(page.locator('.weight-unit')).toHaveText('lb');
  await page.locator('.btn-step', { hasText: '+5' }).click();
  await expect(page.locator('.weight-display-btn span').first()).toHaveText('5');
  await page.locator('.rep-btn').first().click();
  await expect(page.locator('.set-row.completed').first()).toContainText('5 lb ×');
  // 5 lb stored as kg (canonical), not as 5.
  const stored = await page.evaluate(() => JSON.parse(localStorage.getItem('trening2026_active_session_v1')).exercises[0].currentWeight);
  expect(stored).toBeCloseTo(2.27, 2);

  await page.locator('#nav-settings').click();
  await page.locator('#unitKgBtn').click();
  await page.locator('#nav-workout').click();
  await expect(page.locator('.weight-display-btn span').first()).toHaveText('2,27');
  await expect(page.locator('.set-row.completed').first()).toContainText('2,27 kg ×');
});

test('plate calculator splits plates per side in kg and lb', async ({ page }) => {
  await page.goto('/');
  await page.locator('.start-hero .btn-gold').click();
  await page.locator('.weight-display-btn').click();
  await page.locator('#modalWeightInput').fill('100');
  await page.getByRole('button', { name: 'Ustaw ciężar' }).click();
  await page.locator('.btn-plates').click();
  await expect(page.locator('.modal-title')).toHaveText('Kalkulator talerzy');
  await expect(page.locator('.plates-bar')).toContainText('Sztanga: 20 kg');
  await expect(page.locator('.plates-list')).toContainText('1× 25 kg');
  await expect(page.locator('.plates-list')).toContainText('1× 15 kg');
  await page.locator('#modalPlatesInput').fill('22');
  await expect(page.locator('.plates-warn')).toContainText('zostaje 1 kg');
  await page.getByRole('button', { name: 'Zamknij' }).click();

  // Switch to lb mid-session: the calculator follows the unit (45 lb bar).
  await page.locator('#nav-settings').click();
  await page.locator('#unitLbBtn').click();
  await page.locator('#nav-workout').click();
  await page.locator('.btn-plates').click();
  await expect(page.locator('.plates-bar')).toContainText('Sztanga: 45 lb');
  await page.locator('#modalPlatesInput').fill('225');
  await expect(page.locator('.plates-list')).toContainText('2× 45 lb');
});

test('plate calculator is hidden for dumbbell and cable exercises', async ({ page }) => {
  await page.goto('/');
  await page.locator('.start-hero .btn-gold').click();
  // Exercise 1: barbell squat — calculator present.
  await expect(page.locator('.btn-plates')).toHaveCount(1);
  await page.locator('.btn-next-ex').click();
  await expect(page.locator('.exercise-name-header')).toHaveText('Wyciskanie hantli siedząc');
  await expect(page.locator('.btn-plates')).toHaveCount(0);
  await page.locator('.btn-next-ex').click();
  await expect(page.locator('.exercise-name-header')).toHaveText('Ściąganie drążka do klatki');
  await expect(page.locator('.btn-plates')).toHaveCount(0);
});

test('plate-loaded machines open the calculator in machine mode without a bar', async ({ page }) => {
  await page.goto('/');
  await page.locator('.pill-btn', { hasText: 'TRENING B' }).click();
  await page.locator('.start-hero .btn-gold').click();
  // Exercise 1: deadlift — barbell mode.
  await page.locator('.btn-plates').click();
  await expect(page.locator('#platesModeBarbell')).toHaveClass(/btn-gold/);
  await expect(page.locator('.plates-bar')).toContainText('Sztanga: 20 kg');
  await page.getByRole('button', { name: 'Zamknij' }).click();
  // Exercise 2: leg press — machine mode, no bar.
  await page.locator('.btn-next-ex').click();
  await expect(page.locator('.exercise-name-header')).toHaveText('Leg press');
  await page.locator('.btn-plates').click();
  await expect(page.locator('#platesModeMachine')).toHaveClass(/btn-gold/);
  await expect(page.locator('.plates-bar')).toContainText('bez sztangi');
  await page.locator('#modalPlatesInput').fill('100');
  await expect(page.locator('.plates-list')).toContainText('2× 25 kg');
  // Manual override back to barbell subtracts the 20 kg bar.
  await page.locator('#platesModeBarbell').click();
  await expect(page.locator('.plates-bar')).toContainText('Sztanga: 20 kg');
  await expect(page.locator('.plates-list')).toContainText('1× 25 kg');
  await expect(page.locator('.plates-list')).toContainText('1× 15 kg');
  await page.getByRole('button', { name: 'Zamknij' }).click();
  // Exercise 3: hammer row — machine mode again.
  await page.locator('.btn-next-ex').click();
  await expect(page.locator('.exercise-name-header')).toHaveText('Wiosłowanie na hammerze');
  await page.locator('.btn-plates').click();
  await expect(page.locator('#platesModeMachine')).toHaveClass(/btn-gold/);
});

test('history filters per plan with plan-scoped weeks and a deleted-plan bucket', async ({ page }) => {
  const settings = { currentWeek: 1, selectedStartWorkoutId: 'A', unit: 'kg', activePlanId: 'plan_default', activePlanName: 'Mój plan', legacyProgressPlanId: 'plan_default' };
  const savedPlans = [
    { id: 'plan_default', name: 'Mój plan', workouts: {}, workoutOrder: ['A', 'B', 'C'] },
    { id: 'plan_2', name: 'Drugi plan', workouts: {}, workoutOrder: ['A', 'B', 'C'] },
  ];
  const ex = name => [{ name, sets: [{ weight: 50, reps: 5 }] }];
  const history = [
    { sessionId: 's3', planId: 'plan_gone', workoutId: 'A', workoutName: 'TRENING A', week: 2, date: '2026-02-03T10:00:00.000Z', totalSets: 1, totalVolume: 250, exercises: ex('Przysiad z sztangą na plecach') },
    { sessionId: 's2', planId: 'plan_2', workoutId: 'A', workoutName: 'PUSH', week: 3, date: '2026-02-02T10:00:00.000Z', totalSets: 1, totalVolume: 100, exercises: ex('Wyciskanie hantli siedząc') },
    { sessionId: 's1', planId: 'plan_default', workoutId: 'A', workoutName: 'TRENING A', week: 1, date: '2026-01-05T10:00:00.000Z', totalSets: 1, totalVolume: 250, exercises: ex('Przysiad z sztangą na plecach') },
    { sessionId: 's0', workoutId: 'B', workoutName: 'TRENING B', week: 1, date: '2026-01-03T10:00:00.000Z', totalSets: 1, totalVolume: 250, exercises: ex('Martwy ciąg na prostych nogach') },
  ];
  await seed(page, { trening2026_settings_v1: settings, trening2026_saved_plans_v1: savedPlans, trening2026_history_v1: history });
  await page.locator('#nav-history').click();

  // Default view: the active plan only — its own session plus the legacy one without planId.
  await expect(page.locator('#histPlanSelect')).toHaveValue('plan_default');
  await expect(page.locator('.history-session-card')).toHaveCount(2);
  // Week options are scoped to the selected plan: placeholder + week 1 only.
  await expect(page.locator('#histWeekSelect option')).toHaveCount(2);
  await expect(page.locator('#histWeekSelect')).toContainText('Tydzień 1');

  // Second plan: only its session, only its weeks.
  await page.locator('#histPlanSelect').selectOption({ label: 'Drugi plan' });
  await expect(page.locator('.history-session-card')).toHaveCount(1);
  await expect(page.locator('.session-title')).toHaveText('PUSH');
  await expect(page.locator('#histWeekSelect')).toContainText('Tydzień 3');

  // Deleted plans land in one bucket.
  await page.locator('#histPlanSelect').selectOption({ label: 'Usunięty plan' });
  await expect(page.locator('.history-session-card')).toHaveCount(1);

  // Clearing filters returns to the active plan.
  await page.locator('#histPlanSelect').selectOption({ label: 'Drugi plan' });
  await page.locator('.btn-clear-filter').click();
  await expect(page.locator('.history-session-card')).toHaveCount(2);

  // All plans: every session carries a plan tag.
  await page.locator('#histPlanSelect').selectOption('all');
  await expect(page.locator('.history-session-card')).toHaveCount(4);
  await expect(page.locator('.session-plan-tag', { hasText: 'Mój plan' })).toHaveCount(2);
  await expect(page.locator('.session-plan-tag', { hasText: 'Drugi plan' })).toHaveCount(1);
  await expect(page.locator('.session-plan-tag', { hasText: 'Usunięty plan' })).toHaveCount(1);
});

test('beating a historical best shows the gold record toast', async ({ page }) => {
  const history = [{
    sessionId: 'old_pr',
    workoutId: 'A',
    workoutName: 'TRENING A',
    week: 1,
    date: '2026-01-05T10:00:00.000Z',
    totalSets: 1,
    totalVolume: 250,
    exercises: [{ id: 'ex_b_1', name: 'Martwy ciąg na prostych nogach', targetSets: 3, sets: [{ weight: 50, reps: 5 }] }],
  }];
  await seed(page, { [KEYS.history]: history });
  await expect(page.locator('.start-title')).toContainText('TRENING B');
  await page.locator('.start-hero .btn-gold').click();
  await page.locator('.weight-display-btn').click();
  await page.locator('#modalWeightInput').fill('60');
  await page.getByRole('button', { name: 'Ustaw ciężar' }).click();
  await page.locator('.rep-btn', { hasText: /^6$/ }).click();
  await expect(page.locator('#notif-msg')).toContainText('🏆 Nowy rekord: 60 kg × 6!');
  expect(await page.evaluate(() => JSON.parse(localStorage.getItem('trening2026_settings_v1')).prCount)).toBe(1);
});

test('startup heals a stale suggestion that points at a workout already done this week', async ({ page }) => {
  const history = [{
    sessionId: 'stale_a', workoutId: 'A', workoutName: 'TRENING A', week: 1,
    date: '2026-01-05T10:00:00.000Z', totalSets: 1, totalVolume: 250,
    exercises: [{ id: 'ex_a_1', name: 'Przysiad z sztangą na plecach', targetSets: 3, sets: [{ weight: 50, reps: 5 }] }],
  }];
  const settings = { currentWeek: 1, selectedStartWorkoutId: 'A' };
  await seed(page, { [KEYS.history]: history, [KEYS.settings]: settings });
  await expect(page.locator('.start-title')).toContainText('TRENING B');
  await expect(page.locator('.pill-btn.active')).toContainText('B');
});

test('dashboard badges open the achievements modal with earned and locked entries', async ({ page }) => {
  const history = Array.from({ length: 10 }, (_, i) => ({
    sessionId: `old_${i}`, workoutId: 'A', workoutName: 'TRENING A', week: 1,
    date: '2026-01-05T10:00:00.000Z', totalSets: 1, totalVolume: 500, exercises: [],
  }));
  await seed(page, { [KEYS.history]: history });
  await page.locator('#nav-start').click();
  await expect(page.locator('.dashboard-badges')).toContainText('2/12 zdobytych');
  await expect(page.locator('.dashboard-badges')).toContainText('🔥 1 tygodni z rzędu');
  await page.locator('.dashboard-badges').click();
  await expect(page.locator('.modal-title')).toHaveText('🏅 Osiągnięcia');
  await expect(page.locator('.achievement-row.earned')).toHaveCount(2);
  await expect(page.locator('.achievement-row', { hasText: '25 treningów' })).toContainText('10/25');
  await page.getByRole('button', { name: 'Zamknij' }).click();
  await expect(page.locator('.achievements-list')).toHaveCount(0);
});

test('exercise preview renders the progress chart with PR marker, lb conversion and plan scope', async ({ page }) => {
  const settings = { currentWeek: 3, selectedStartWorkoutId: 'A', unit: 'kg', activePlanId: 'plan_default', activePlanName: 'Mój plan', legacyProgressPlanId: 'plan_default' };
  const savedPlans = [
    { id: 'plan_default', name: 'Mój plan', workouts: {}, workoutOrder: ['A', 'B', 'C'] },
    { id: 'plan_other', name: 'Inny plan', workouts: {}, workoutOrder: ['A', 'B', 'C'] },
  ];
  const history = [
    { sessionId: 's4', planId: 'plan_other', workoutId: 'A', workoutName: 'TRENING A', week: 1, date: '2026-02-15T10:00:00.000Z', totalSets: 1, totalVolume: 200, exercises: [{ name: 'Przysiad z sztangą na plecach', sets: [{ weight: 200, reps: 1 }] }] },
    { sessionId: 's3', planId: 'plan_default', workoutId: 'A', workoutName: 'TRENING A', week: 3, date: '2026-02-12T10:00:00.000Z', totalSets: 1, totalVolume: 500, exercises: [{ name: 'Przysiad z sztangą na plecach', sets: [{ weight: 100, reps: 5 }] }] },
    { sessionId: 's2', planId: 'plan_default', workoutId: 'A', workoutName: 'TRENING A', week: 2, date: '2026-02-05T10:00:00.000Z', totalSets: 1, totalVolume: 450, exercises: [{ name: 'Przysiad z sztangą na plecach', sets: [{ weight: 90, reps: 5 }] }] },
    { sessionId: 's1', planId: 'plan_default', workoutId: 'A', workoutName: 'TRENING A', week: 1, date: '2026-01-29T10:00:00.000Z', totalSets: 1, totalVolume: 400, exercises: [{ name: 'Przysiad z sztangą na plecach', sets: [{ weight: 80, reps: 5 }] }, { name: 'Wznosy nóg do klatki', sets: [{ weight: 0, reps: 12 }] }] },
  ];
  await seed(page, { trening2026_settings_v1: settings, trening2026_saved_plans_v1: savedPlans, trening2026_history_v1: history });
  await page.locator('#nav-history').click();
  await page.getByRole('button', { name: /Wykres ćwiczenia/ }).click();
  await page.locator('.history-filters-box select.modal-select').selectOption('Przysiad z sztangą na plecach');

  const chart = page.getByTestId('progress-chart');
  // Scoped to active plan: 80 -> 90 -> 100 kg (the 200 kg session from plan_other is excluded).
  await expect(chart).toContainText('80 – 100 kg');
  await expect(chart).toContainText('+20 kg od pierwszego treningu');
  await expect(chart.locator('.chart-dot.pr')).toHaveCount(2);

  // Plan selected: only the dropdown is shown, not the text input.
  await expect(page.locator('#histExerciseInput')).toHaveCount(0);
  await page.locator('.history-filters-box select.modal-select').selectOption('Wznosy nóg do klatki');
  await expect(chart).toContainText('12 powt.');
  await expect(chart).toContainText('Zapisz jeszcze jeden trening');
  await expect(chart.locator('svg')).toHaveCount(0);

  // "All plans" selected: only the search input with suggestions is shown, not the dropdown.
  await page.locator('#histPlanSelect').selectOption('all');
  await expect(page.locator('.history-filters-box select.modal-select')).toHaveCount(0);
  await expect(page.locator('#histExerciseSuggestions option')).not.toHaveCount(0);
  // Partial typing matches immediately without losing spaces or getting stuck.
  await page.locator('#histExerciseInput').fill('Przysiad ');
  await expect(page.locator('#histExerciseInput')).toHaveValue('Przysiad ');
  await expect(chart).toContainText('80 – 200 kg');
  // Switching to a plan whose exercises do not include the typed string falls back cleanly.
  await page.locator('#histPlanSelect').selectOption('plan_other');
  await expect(page.locator('.history-filters-box select.modal-select')).toHaveValue('Przysiad z sztangą na plecach');
  await page.locator('#histPlanSelect').selectOption('plan_default');

  // Unit switch converts the chart too.
  await page.locator('#nav-settings').click();
  await page.locator('#unitLbBtn').click();
  await page.locator('#nav-history').click();
  await page.locator('.history-filters-box select.modal-select').selectOption('Przysiad z sztangą na plecach');
  await expect(chart).toContainText('176,4 – 220,5 lb');
});

test('history and settings export workout sets to a CSV file', async ({ page }) => {
  const history = [{
    sessionId: 's1',
    planId: 'plan_default',
    workoutId: 'A',
    workoutName: 'TRENING A',
    week: 1,
    date: '2026-02-10T10:00:00.000Z',
    totalSets: 2,
    totalVolume: 825,
    exercises: [{ name: 'Przysiad z sztangą na plecach', sets: [{ weight: 82.5, reps: 5 }, { weight: 82.5, reps: 5 }] }],
  }];
  await seed(page, { trening2026_history_v1: history });
  await page.locator('#nav-history').click();

  await page.setViewportSize({ width: 320, height: 700 });
  const actionBoxes = await page.locator('.hist-actions-row .hist-action-btn').evaluateAll(btns =>
    btns.map(b => ({ top: b.getBoundingClientRect().top, fits: b.scrollWidth <= b.clientWidth })));
  expect(actionBoxes).toHaveLength(3);
  expect(actionBoxes[0].top).toBe(actionBoxes[1].top);
  expect(actionBoxes[2].top).toBe(actionBoxes[1].top);
  expect(actionBoxes.every(b => b.fits)).toBe(true);

  const [download] = await Promise.all([
    page.waitForEvent('download'),
    page.locator('#exportCsvHistoryBtn').click(),
  ]);
  expect(download.suggestedFilename()).toMatch(/^trening_historia_.*\.csv$/);
  const path = await download.path();
  const fs = await import('node:fs');
  const text = fs.readFileSync(path, 'utf8');
  expect(text).toContain('Data;Plan;Tydzień;Trening;Ćwiczenie;Seria;Ciężar (kg);Powtórzenia');
  expect(text).toContain('2026-02-10;Mój Plan Główny (A/B/C);1;TRENING A;Przysiad z sztangą na plecach;1;82,5;5');
});

test('auto-start rest runs the timer right after a logged set', async ({ page }) => {
  await page.goto('/');
  await page.locator('#nav-settings').click();
  await page.locator('#settingAutoRestToggle').check();
  await page.locator('#nav-workout').click();
  await page.locator('.start-hero .btn-gold').click();
  await expect(page.locator('.timer-btn-main')).not.toHaveClass(/timer-running/);
  await page.locator('.rep-btn').first().click();
  await expect(page.locator('.timer-btn-main')).toHaveClass(/timer-running/);
});
