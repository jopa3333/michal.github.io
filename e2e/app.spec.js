import { expect, test } from '@playwright/test';

// Storage keys and data shapes match the legacy app (commit 174af90), so these tests also check
// that data saved by the old version still loads in the React version.
const KEYS = {
  history: 'trening2026_history_v1',
  active: 'trening2026_active_session_v1',
};

const legacyHistory = [
  {
    sessionId: 'sess_b',
    workoutId: 'B',
    workoutName: 'TRENING B',
    week: 1,
    date: '2026-01-07T10:00:00.000Z',
    totalSets: 1,
    totalVolume: 200,
    exercises: [{ id: 'ex_b_1', name: 'Martwy ciąg na prostych nogach', targetSets: 3, tempo: '2010', sets: [{ weight: 100, reps: 2 }] }],
  },
  {
    sessionId: 'sess_a',
    workoutId: 'A',
    workoutName: 'TRENING A',
    week: 1,
    date: '2026-01-05T10:00:00.000Z',
    totalSets: 2,
    totalVolume: 1000,
    exercises: [{ id: 'ex_a_1', name: 'Przysiad z sztangą na plecach', targetSets: 3, tempo: '2010', sets: [{ weight: 100, reps: 5 }, { weight: 100, reps: 5 }] }],
  },
];

// Seeds localStorage (same shape as the legacy app) and reloads so the app reads it.
async function seed(page, values) {
  await page.goto('/');
  await page.evaluate(entries => {
    for (const [key, value] of entries) localStorage.setItem(key, JSON.stringify(value));
  }, Object.entries(values));
  await page.reload();
}

async function startWorkoutFromStart(page) {
  await page.locator('.start-hero .btn-gold').click();
  await expect(page.locator('.assistant-ex-count')).toHaveText('ĆWICZENIE 1 Z 7');
}

async function finishWorkout(page) {
  await page.locator('.btn-finish-link').click();
  await expect(page.locator('.modal-title', { hasText: 'Trening Ukończony!' })).toBeVisible();
  await page.getByRole('button', { name: 'Super, przejdź do historii' }).click();
}

test.beforeEach(async ({ page }) => {
  page.on('dialog', dialog => dialog.accept());
});

test('start screen shows today\'s plan and loads without errors', async ({ page }) => {
  const errors = [];
  const failedRequests = [];
  page.on('pageerror', error => errors.push(error.message));
  page.on('console', message => {
    if (message.type() === 'error') errors.push(message.text());
  });
  page.on('response', response => {
    if (response.status() >= 400) failedRequests.push(`${response.status()} ${response.url()}`);
  });

  await page.goto('/');

  await expect(page.locator('.start-title')).toHaveText('TRENING A');
  await expect(page.locator('.logo-badge')).toHaveText('TYDZIEŃ 1');
  await expect(page.locator('.preview-item')).toHaveCount(7);
  await expect(page.locator('.preview-item').last()).toContainText('(2 × 10+ MAX)');
  await expect(page.locator('.workout-active-pill')).toHaveCount(0);
  await expect(page.locator('.floating-timer-bar')).toHaveCount(0);
  expect(errors).toEqual([]);
  expect(failedRequests).toEqual([]);
});

test('a finished workout is saved to history with the right totals', async ({ page }) => {
  await page.goto('/');
  await startWorkoutFromStart(page);

  await page.locator('.btn-step', { hasText: '+2,5' }).click();
  await expect(page.locator('.weight-display-btn span').first()).toHaveText('2,5');
  await page.locator('.rep-btn').first().click(); // 2.5 kg × 3
  await page.locator('.rep-btn').first().click(); // 2.5 kg × 3

  await finishWorkout(page);

  await expect(page.locator('.history-session-card')).toHaveCount(1);
  await expect(page.locator('.history-session-card')).toContainText('TRENING A');
  await expect(page.locator('.history-session-card')).toContainText('Objętość: 15 kg (2 serii)');
  await expect(page.locator('.workout-active-pill')).toHaveCount(0);
});

test('rest timer runs in the background, shows the floating bar and resets after a set', async ({ page }) => {
  await page.goto('/');
  await startWorkoutFromStart(page);

  await expect(page.locator('.timer-btn-main')).toContainText('START 3:00');
  await page.locator('.timer-btn-main').click();
  await expect(page.locator('.timer-btn-main')).toHaveClass(/timer-running/);

  await page.locator('#nav-plan').click();
  await expect(page.locator('.floating-timer-bar')).toBeVisible();
  await expect(page.locator('.floating-timer-bar')).toContainText('(Odpoczynek w toku)');
  await page.locator('.floating-timer-bar button').click();
  await expect(page.locator('.assistant-ex-count')).toBeVisible();

  await page.locator('.timer-btn-main').click(); // pause
  await expect(page.locator('.timer-btn-main')).not.toHaveClass(/timer-running/);
  await page.locator('.timer-ctrl-btn', { hasText: '−30s' }).click();
  await expect(page.locator('.timer-btn-main')).toContainText('START 2:30');

  await page.locator('.rep-btn').first().click(); // recording a set resets the rest
  await expect(page.locator('.timer-btn-main')).toContainText('START 3:00');
});

test('the rest timer announces the end of the break', async ({ page }) => {
  await page.clock.install();
  await page.goto('/');
  await startWorkoutFromStart(page);

  await page.locator('.timer-btn-main').click();
  await page.clock.fastForward(181_000);

  await expect(page.locator('.timer-btn-main')).toContainText('KONIEC PRZERWY!');
  await expect(page.locator('#notif-msg')).toHaveText('⏱ Koniec przerwy! Czas na kolejną serię.');
});

test('a session saved by the legacy app resumes where it was', async ({ page }) => {
  const legacyActive = {
    sessionId: 'sess_legacy',
    workoutId: 'A',
    workoutName: 'TRENING A',
    week: 1,
    startTime: '2026-01-06T10:00:00.000Z',
    currentExerciseIndex: 0,
    exercises: [
      {
        id: 'ex_a_1',
        name: 'Przysiad z sztangą na plecach',
        setsTarget: 3,
        repsMin: 3,
        repsMax: 5,
        tempo: '2010',
        restSeconds: 180,
        progressionStep: 2.5,
        progressionType: 'top_all_sets',
        currentWeight: 100,
        suggestedWeight: 100,
        isProgressionHit: false,
        lastSummary: '100 kg • 5 / 5 / 5',
        lastDate: '',
        completedSets: [{ weight: 100, reps: 5 }],
      },
      ...Array.from({ length: 6 }, (_, i) => ({
        id: `ex_a_${i + 2}`,
        name: `Ćwiczenie ${i + 2}`,
        setsTarget: 3,
        repsMin: 8,
        repsMax: 12,
        tempo: '2010',
        restSeconds: 90,
        progressionStep: 2.5,
        progressionType: 'top_all_sets',
        currentWeight: 0,
        suggestedWeight: 0,
        isProgressionHit: false,
        lastSummary: 'BRAK POPRZEDNIEGO WYNIKU',
        lastDate: '',
        completedSets: [],
      })),
    ],
  };

  await seed(page, { [KEYS.active]: legacyActive, [KEYS.history]: legacyHistory });

  await expect(page.locator('.workout-active-pill')).toBeVisible();
  await expect(page.locator('.assistant-ex-count')).toHaveText('ĆWICZENIE 1 Z 7');
  await expect(page.locator('.set-row.completed')).toHaveCount(1);
  await expect(page.locator('.set-row.completed')).toContainText('100 kg × 5');
});

test('history filters by workout, week and exercise, and can delete an entry', async ({ page }) => {
  await seed(page, { [KEYS.history]: legacyHistory });
  await page.locator('#nav-history').click();

  await expect(page.locator('.history-session-card')).toHaveCount(2);
  await expect(page.locator('.history-status-strip')).toContainText('Wszystkie sesje');
  // Newest first: the seeded list starts with TRENING B, so it must be the first card.
  await expect(page.locator('.history-session-card').first()).toContainText('TRENING B');

  await page.locator('.hist-pill', { hasText: 'Trening A' }).click();
  await expect(page.locator('.history-session-card')).toHaveCount(1);
  await expect(page.locator('.history-session-card')).toContainText('TRENING A');
  await expect(page.locator('.history-status-strip')).toContainText('Trening A');
  await expect(page.locator('.history-status-strip')).toContainText('1 sesji');

  await page.locator('.hist-pill', { hasText: /^Wszystkie$/ }).click();
  await page.locator('.hist-week-select').selectOption('1');
  await expect(page.locator('.history-session-card')).toHaveCount(2);

  await page.getByRole('button', { name: /Wyczyść filtry/ }).click();
  await expect(page.locator('.history-session-card')).toHaveCount(2);

  await page.getByRole('button', { name: /Podgląd wg ćwiczenia/ }).click();
  await page.locator('.history-filters-box select.modal-select').selectOption('Przysiad z sztangą na plecach');
  await expect(page.locator('.card').filter({ hasText: 'Historia wykonania w kolejnych treningach' })).toContainText('100 kg × 5');

  await page.getByRole('button', { name: /Wyczyść filtry/ }).click();
  await page.locator('.history-session-card', { hasText: 'TRENING B' }).getByRole('button', { name: 'Usuń wpis' }).click();
  await expect(page.locator('.history-session-card')).toHaveCount(1);
});

test('adding an exercise from the library fills the form and persists after reload', async ({ page }) => {
  await page.goto('/');
  await page.locator('#nav-plan').click();
  await page.locator('.plan-mgmt-actions .btn', { hasText: '+ Dodaj ćwiczenie' }).click();

  const modal = page.locator('.modal-box');
  await modal.locator('select').first().selectOption({ label: 'Wyciskanie hantli na ławce poziomej' });
  await expect(modal.locator('#modalExName')).toHaveValue('Wyciskanie hantli na ławce poziomej');
  await expect(modal.locator('#modalExRest')).toHaveValue('120');
  await expect(modal.locator('#modalExStep')).toHaveValue('2');
  await modal.getByRole('button', { name: 'Zapisz ćwiczenie' }).click();

  await expect(page.locator('.plan-item-card')).toHaveCount(8);
  await page.reload();
  await page.locator('#nav-plan').click();
  await expect(page.locator('.plan-item-card')).toHaveCount(8);
  await expect(page.locator('.plan-item-card').last()).toContainText('Wyciskanie hantli na ławce poziomej');
});

test('saved plans can be saved as, loaded, and the default restored', async ({ page }) => {
  await page.goto('/');
  await page.locator('#nav-plan').click();

  await page.locator('.plan-mgmt-actions .btn', { hasText: 'Zapisz jako' }).click();
  await page.locator('#savePlanAsInput').fill('Plan testowy');
  await page.locator('.modal-box .btn-gold', { hasText: /^Zapisz$/ }).click();
  await expect(page.locator('.plan-mgmt-title')).toHaveText('Plan testowy');
  await expect(page.locator('.plan-item-card')).toHaveCount(7);

  await page.locator('.plan-mgmt-header .btn').click();
  await expect(page.locator('.saved-plan-card')).toHaveCount(2);
  await page.locator('.saved-plan-card', { hasText: 'Mój Plan Główny' }).getByRole('button', { name: /Wczytaj ten plan/ }).click();
  await expect(page.locator('.plan-mgmt-title')).toHaveText('Mój Plan Główny (A/B/C)');

  await page.getByRole('button', { name: /Przywróć domyślny plan treningowy/ }).click();
  await expect(page.locator('.plan-mgmt-title')).toHaveText('Domyślny Plan A/B/C');
  await expect(page.locator('.plan-item-card')).toHaveCount(7);
  await expect(page.locator('.plan-item-card').first()).toContainText('1. Przysiad z sztangą na plecach');
});

test('finishing three workouts in one week moves the app to the next week', async ({ page }) => {
  await page.goto('/');

  for (const id of ['A', 'B', 'C']) {
    await page.locator('#nav-workout').click();
    await page.locator('.workout-choice-card', { hasText: `TRENING ${id}` }).click();
    await page.locator('.rep-btn').first().click();
    await page.locator('.btn-finish-link').click();
    await expect(page.locator('.modal-title', { hasText: 'Trening Ukończony!' })).toBeVisible();
    if (id === 'C') {
      await expect(page.locator('#summarySubtitle')).toContainText('przeszła do Tygodnia 2');
    } else {
      const remaining = id === 'A' ? 'B, C' : 'C';
      await expect(page.locator('#summarySubtitle')).toContainText(`Do ukończenia tego tygodnia pozostał: Trening ${remaining}`);
    }
    await page.getByRole('button', { name: 'Super, przejdź do historii' }).click();
  }

  await expect(page.locator('.logo-badge')).toHaveText('TYDZIEŃ 2');
  await page.locator('#nav-start').click();
  await expect(page.locator('.start-title')).toHaveText('TRENING A');
});

test('a backup can be exported and restored, and a broken file is rejected', async ({ page }) => {
  await seed(page, { [KEYS.history]: legacyHistory });
  await page.locator('#nav-settings').click();

  const [download] = await Promise.all([
    page.waitForEvent('download'),
    page.locator('.btn-primary', { hasText: 'Pobierz kopię' }).click(),
  ]);
  expect(download.suggestedFilename()).toMatch(/^trening2026_backup_\d{4}-\d{2}-\d{2}\.json$/);
  const backupPath = await download.path();

  await page.locator('.btn-danger', { hasText: 'Wyczyść całą historię' }).click();
  await page.locator('#nav-history').click();
  await expect(page.locator('.history-session-card')).toHaveCount(0);

  await page.locator('#nav-settings').click();
  await page.locator('#importJsonFileInput').setInputFiles(backupPath);
  await page.locator('#nav-history').click();
  await expect(page.locator('.history-session-card')).toHaveCount(2);

  const dialogs = [];
  page.removeAllListeners('dialog');
  page.on('dialog', dialog => {
    dialogs.push(dialog.message());
    dialog.accept();
  });
  await page.locator('#nav-settings').click();
  await page.locator('#importJsonFileInput').setInputFiles({ name: 'broken.json', mimeType: 'application/json', buffer: Buffer.from('{"nope":true}') });
  await expect.poll(() => dialogs.length).toBe(1);
  expect(dialogs[0]).toContain('Plik nie zawiera poprawnych danych planu lub historii');
});
