import { expect, test } from '@playwright/test';

// Storage keys and data shapes match the legacy app (commit 174af90), so these tests also check
// that data saved by the old version still loads in the React version.
const KEYS = {
  history: 'trening2026_history_v1',
  active: 'trening2026_active_session_v1',
  settings: 'trening2026_settings_v1',
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
  await expect(page.locator('.preview-item').last()).toContainText('(2 × 8–12)');
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

test('active workout header fits on one line on a narrow phone', async ({ page }) => {
  await page.setViewportSize({ width: 320, height: 700 });
  await page.goto('/');
  await startWorkoutFromStart(page);
  const layout = await page.locator('.app-header').evaluate(header => {
    const elements = [...header.querySelectorAll('.logo-icon, .logo-title, .logo-badge, .workout-active-pill span')];
    const boxes = elements.map(element => element.getBoundingClientRect());
    const outer = header.getBoundingClientRect();
    return { fits: boxes.every(box => box.left >= outer.left && box.right <= outer.right), singleLine: boxes.every(box => Math.abs((box.top + box.bottom) / 2 - (boxes[0].top + boxes[0].bottom) / 2) < 5 && box.height < 30) };
  });
  expect(layout).toEqual({ fits: true, singleLine: true });
  await expect(page.locator('.workout-active-pill')).toContainText('TRENING W TOKU');
});

test('workout plan drawer title and close button avoid the phone status area', async ({ page }) => {
  await page.setViewportSize({ width: 320, height: 700 });
  await page.goto('/');
  await startWorkoutFromStart(page);
  await page.evaluate(key => {
    const session = JSON.parse(localStorage.getItem(key));
    session.workoutName = 'KLATKA + TRICEPS';
    session.week = 5;
    localStorage.setItem(key, JSON.stringify(session));
  }, KEYS.active);
  await page.reload();
  await page.locator('.btn-plan-toggle').click();
  const title = page.locator('.drawer-title');
  await expect(title).toHaveText('KLATKA + TRICEPS (Tydz. 5)');
  const close = page.locator('.drawer-close-btn');
  expect((await title.boundingBox()).y).toBeGreaterThanOrEqual(44);
  expect((await close.boundingBox()).y).toBeGreaterThanOrEqual(44);
  await close.click();
  await expect(page.locator('.plan-drawer')).toHaveCount(0);
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

test('a completed timer uses one persistent banner after the app wakes up', async ({ page }) => {
  await page.addInitScript(() => {
    window.__timerBannerCount = 0;
    window.__timerVoiceCount = 0;
    HTMLMediaElement.prototype.play = function () { window.__timerVoiceCount += 1; return Promise.resolve(); };
    const registration = {
      update() { return Promise.resolve(); },
      showNotification() { window.__timerBannerCount += 1; return Promise.resolve(); },
    };
    class TestNotification {
      static permission = 'granted';
      constructor() { window.__fallbackBannerCount = (window.__fallbackBannerCount || 0) + 1; }
    }
    Object.defineProperty(window, 'Notification', { configurable: true, value: TestNotification });
    Object.defineProperty(navigator, 'serviceWorker', {
      configurable: true,
      value: { controller: null, ready: Promise.resolve(registration), register() { return Promise.resolve(registration); } },
    });
    Object.defineProperty(window, 'speechSynthesis', {
      configurable: true,
      value: {
        paused: false,
        cancel() {},
        getVoices() { return []; },
        resume() {},
        speak(utterance) { if (utterance.volume !== 0) window.__timerVoiceCount += 1; },
      },
    });
    window.SpeechSynthesisUtterance = class TestUtterance { constructor(text) { this.text = text; } };
  });
  await page.clock.install();
  await page.goto('/');
  await startWorkoutFromStart(page);
  await page.locator('.timer-btn-main').click();
  await page.clock.fastForward(181_000);
  await page.evaluate(() => {
    document.dispatchEvent(new Event('visibilitychange'));
    window.dispatchEvent(new Event('focus'));
    window.dispatchEvent(new Event('pageshow'));
  });
  await page.clock.fastForward(1_000);

  await expect(page.locator('#notif-msg')).toHaveText('⏱ Koniec przerwy! Czas na kolejną serię.');
  await expect.poll(() => page.evaluate(() => window.__timerBannerCount)).toBe(1);
  await expect.poll(() => page.evaluate(() => window.__timerVoiceCount)).toBe(1);
  await expect.poll(() => page.evaluate(() => window.__fallbackBannerCount || 0)).toBe(0);
});

test('a muted timer still shows one system banner without voice', async ({ page }) => {
  await page.addInitScript(() => {
    window.__timerBannerCount = 0;
    window.__timerVoiceCount = 0;
    HTMLMediaElement.prototype.play = function () { window.__timerVoiceCount += 1; return Promise.resolve(); };
    class TestNotification {
      static permission = 'granted';
      constructor() { window.__timerBannerCount += 1; }
    }
    Object.defineProperty(window, 'Notification', { configurable: true, value: TestNotification });
    Object.defineProperty(window, 'speechSynthesis', {
      configurable: true,
      value: { paused: false, cancel() {}, getVoices() { return []; }, resume() {}, speak() { window.__timerVoiceCount += 1; } },
    });
    window.SpeechSynthesisUtterance = class TestUtterance { constructor(text) { this.text = text; } };
  });
  await page.clock.install();
  await seed(page, { [KEYS.settings]: { soundEnabled: false, vibrateEnabled: false } });
  await startWorkoutFromStart(page);
  await page.locator('.timer-btn-main').click();
  // Starting a timer performs a silent, one-off speech unlock on some browsers.
  // Count only notifications made when the break ends.
  await page.evaluate(() => { window.__timerVoiceCount = 0; });
  await page.clock.fastForward(181_000);
  await page.clock.fastForward(1_000);

  await expect(page.locator('#notif-msg')).toHaveText('⏱ Koniec przerwy! Czas na kolejną serię.');
  await expect.poll(() => page.evaluate(() => window.__timerBannerCount)).toBe(1);
  await expect.poll(() => page.evaluate(() => window.__timerVoiceCount)).toBe(0);
});

test('the supplied audio decodes in the browser', async ({ page }) => {
  await page.addInitScript(() => {
    window.__recordedAudioSrc = null;
    HTMLMediaElement.prototype.play = function () {
      window.__recordedAudioSrc = this.src;
      return Promise.resolve();
    };
  });
  await page.goto('/');
  await page.locator('#nav-settings').click();
  await page.getByRole('button', { name: /Przetestuj dźwięk/ }).click();
  await expect.poll(() => page.evaluate(() => window.__recordedAudioSrc)).toMatch(/^data:audio\/mpeg;base64,/);
  const duration = await page.evaluate(async () => {
    const ctx = new AudioContext();
    const bytes = await (await fetch(window.__recordedAudioSrc)).arrayBuffer();
    const decoded = await ctx.decodeAudioData(bytes);
    await ctx.close();
    return decoded.duration;
  });
  expect(duration).toBeGreaterThan(2);
  expect(duration).toBeLessThan(3);
});

test('saved plan controls stay aligned and text fits at 320px', async ({ page }) => {
  await page.setViewportSize({ width: 320, height: 700 });
  await page.goto('/');
  await page.locator('#nav-plan').click();
  const alignment = await page.locator('.plan-mgmt-badge, .plan-mgmt-header > .btn').evaluateAll(elements => elements.map(element => { const r = element.getBoundingClientRect(); return (r.top + r.bottom) / 2; }));
  expect(Math.abs(alignment[0] - alignment[1])).toBeLessThan(1);
  await page.locator('.plan-mgmt-header .btn').click();
  await page.getByRole('button', { name: '📚 Gotowe plany' }).click();
  await expect(page.locator('.template-library-modal .modal-title')).toHaveText('📚 Gotowe plany na siłownię');
  await page.locator('.template-card', { hasText: 'Split partii mięśniowych — 5 dni' }).getByRole('button', { name: 'Użyj tego planu' }).click();
  await page.locator('.plan-mgmt-header .btn').click();
  const buttons = page.locator('.saved-plan-secondary-actions .btn');
  expect(await buttons.evaluateAll(nodes => nodes.every(node => node.scrollWidth <= node.clientWidth))).toBe(true);
  const footer = page.locator('.saved-plans-list + div > button');
  expect(await footer.evaluateAll(nodes => nodes.every(node => node.scrollWidth <= node.clientWidth && node.scrollHeight <= node.clientHeight && getComputedStyle(node).whiteSpace === 'nowrap'))).toBe(true);
  const boxes = await footer.evaluateAll(nodes => nodes.map(node => { const r = node.getBoundingClientRect(); return {top:r.top,right:r.right,left:r.left}; }));
  expect(new Set(boxes.map(box => box.top)).size).toBe(1);
  expect(boxes.every(box => box.left >= 0 && box.right <= 320)).toBe(true);
});

test('plan and history controls stay in one row on a narrow phone', async ({ page }) => {
  await page.setViewportSize({ width: 360, height: 800 });
  await page.goto('/');
  await page.locator('#nav-plan').click();

  const planHeaderRows = await page.locator('.plan-mgmt-badge, .plan-mgmt-header > .btn').evaluateAll(elements => elements.map(element => { const r = element.getBoundingClientRect(); return (r.top + r.bottom) / 2; }));
  expect(Math.abs(planHeaderRows[0] - planHeaderRows[1])).toBeLessThan(1);
  expect(await page.locator('.plan-mgmt-badge').evaluate(element => element.scrollHeight <= element.clientHeight)).toBe(true);
  const planActionRows = await page.locator('.plan-mgmt-actions .btn').evaluateAll(buttons => buttons.map(button => button.getBoundingClientRect().top));
  expect(new Set(planActionRows).size).toBe(1);
  expect(await page.locator('.plan-mgmt-title').evaluate(element => element.scrollHeight <= element.clientHeight)).toBe(true);

  await page.locator('.plan-mgmt-header .btn').click();
  const activePlan = page.locator('.saved-plan-card.active-plan');
  const activePlanTopRows = await activePlan.locator('.saved-plan-name, .saved-plan-active-badge').evaluateAll(elements => elements.map(element => {
    const { top, bottom } = element.getBoundingClientRect();
    return { top, bottom };
  }));
  expect(activePlanTopRows[0].top < activePlanTopRows[1].bottom && activePlanTopRows[1].top < activePlanTopRows[0].bottom).toBe(true);
  expect(await activePlan.locator('.saved-plan-meta').evaluate(element => element.scrollHeight <= element.clientHeight)).toBe(true);
  const secondaryActionRows = await activePlan.locator('.saved-plan-secondary-actions .btn').evaluateAll(buttons => buttons.map(button => button.getBoundingClientRect().top));
  expect(new Set(secondaryActionRows).size).toBe(1);
  expect(secondaryActionRows[0]).toBeGreaterThan(await activePlan.locator('.saved-plan-btns > span').evaluate(element => element.getBoundingClientRect().top));
  await page.getByRole('button', { name: '✕' }).click();

  await page.locator('#nav-history').click();
  const historyFilterRows = await page.locator('.hist-pills-row .hist-pill').evaluateAll(buttons => buttons.map(button => button.getBoundingClientRect().top));
  expect(new Set(historyFilterRows).size).toBe(1);
  expect(await page.locator('.hist-pills-row .hist-pill').evaluateAll(buttons => buttons.every(button => button.scrollWidth <= button.clientWidth))).toBe(true);
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

test('toast notification clears the phone status area', async ({ page }) => {
  await page.setViewportSize({ width: 320, height: 700 });
  await page.goto('/');
  await page.locator('.start-hero .btn-gold').click();
  const toast = page.locator('#notification.show');
  await expect(toast).toBeVisible();
  const top = await toast.evaluate(el => el.getBoundingClientRect().top);
  expect(top).toBeGreaterThanOrEqual(48);
});

test('bodyweight exercises hide weight progression without losing saved values', async ({ page }) => {
  await page.goto('/');
  await page.locator('#nav-plan').click();
  const bodyweight = page.locator('.plan-item-card', { hasText: 'Wznosy nóg do klatki' });
  await bodyweight.getByRole('button', { name: '✏️ Edytuj' }).click();
  let modal = page.locator('.modal-box');
  await expect(modal.locator('#modalExStep')).toHaveCount(0);
  await expect(modal.locator('#modalExProgressionType')).toHaveCount(0);
  await modal.getByRole('button', { name: 'Zapisz ćwiczenie' }).click();
  const saved = await page.evaluate(() => JSON.parse(localStorage.getItem('trening2026_plan_v1')).A.exercises.find(item => item.name === 'Wznosy nóg do klatki'));
  expect(saved.progressionStep).toBe(0);
  expect(saved.progressionType).toBe('manual');
  await bodyweight.getByRole('button', { name: '✏️ Edytuj' }).click();
  await expect(modal.locator('#modalExStep')).toHaveCount(0);
  await modal.getByRole('button', { name: 'Anuluj' }).click();
  await page.locator('.plan-mgmt-actions .btn', { hasText: '+ Dodaj ćwiczenie' }).click();
  for (const name of ['Plank (deska klasyczna)', 'Pompki klasyczne', 'Wznosy nóg w zwisie na drążku']) {
    await modal.locator('select').first().selectOption({ label: name });
    await expect(modal.locator('#modalExStep')).toHaveCount(0);
  }
  await modal.locator('select').first().selectOption({ label: 'Wyciskanie hantli na ławce poziomej' });
  await expect(modal.locator('#modalExStep')).toHaveValue('2');
  await expect(modal.locator('#modalExProgressionType')).toBeVisible();
  await modal.locator('#modalExStep').fill('1');
  await modal.locator('#modalExName').fill('Pompki klasyczne');
  await expect(modal.locator('#modalExStep')).toHaveValue('1');
});

test('exercise library heading fits on one line at mobile width', async ({ page }) => {
  await page.setViewportSize({ width: 320, height: 700 });
  await page.goto('/');
  await page.locator('#nav-plan').click();
  await page.locator('.plan-mgmt-actions .btn', { hasText: '+ Dodaj ćwiczenie' }).click();
  const label = page.locator('.modal-box label', { hasText: 'Baza ćwiczeń' });
  await expect(label).toHaveText('⚡ Baza ćwiczeń');
  const lines = await label.evaluate(el => {
    const range = document.createRange(); range.selectNodeContents(el);
    return new Set([...range.getClientRects()].map(r => Math.round(r.top))).size;
  });
  expect(lines).toBe(1);
});

test('bodyweight exercise can record reps without or with weight and keeps history after reload', async ({ page }) => {
  await page.goto('/');
  await startWorkoutFromStart(page);
  await page.locator('.btn-plan-toggle').click();
  await page.locator('.drawer-ex-item', { hasText: 'Wznosy nóg do klatki' }).click();
  const checkbox = page.getByRole('checkbox', { name: 'Dodatkowe obciążenie (kg)' });
  await expect(checkbox).not.toBeChecked();
  await expect(page.locator('.weight-adjuster-section')).toHaveCount(0);
  await page.locator('.rep-btn-custom').click();
  await page.locator('#modalCustomRepsInput').fill('12');
  await page.getByRole('button', { name: 'Zapisz serię' }).click();
  await expect(page.locator('.set-row.completed').first()).toContainText('12 powt.');
  await checkbox.check();
  await page.locator('.btn-step', { hasText: '+2,5' }).click();
  await page.reload();
  await expect(page.getByRole('checkbox', { name: 'Dodatkowe obciążenie (kg)' })).toBeChecked();
  await expect(page.locator('.weight-display-btn')).toContainText('2,5');
  await page.locator('.rep-btn-custom').click();
  await page.locator('#modalCustomRepsInput').fill('10');
  await page.getByRole('button', { name: 'Zapisz serię' }).click();
  await expect(page.locator('.set-row.completed').last()).toContainText('2,5 kg × 10');
  await finishWorkout(page);
  await expect(page.locator('.history-session-card').first()).toContainText('12 powt.');
  await expect(page.locator('.history-session-card').first()).toContainText('2,5 kg × 10');
  await page.reload();
  await page.locator('#nav-history').click();
  await expect(page.locator('.history-session-card').first()).toContainText('12 powt.');
});

test('legacy leg raise plan and history remain intact while old target displays 8–12', async ({ page }) => {
  await page.goto('/');
  await page.evaluate(() => {
    const plan = JSON.parse(localStorage.getItem('trening2026_plan_v1'));
    const ex = plan.A.exercises.find(e => e.name === 'Wznosy nóg do klatki');
    ex.repsMin = 10; ex.repsMax = 'MAX';
    localStorage.setItem('trening2026_plan_v1', JSON.stringify(plan));
    localStorage.setItem('trening2026_history_v1', JSON.stringify([{ sessionId: 'old-raise', workoutId: 'A', workoutName: 'TRENING A', week: 0, date: '2025-01-01T10:00:00.000Z', exercises: [{ id: ex.id, name: ex.name, targetSets: 2, sets: [{ weight: 0, reps: 'MAX' }, { weight: 0, reps: 14 }] }] }]));
  });
  const originalHistory = await page.evaluate(() => localStorage.getItem('trening2026_history_v1'));
  await page.reload();
  await expect(page.locator('.preview-item').last()).toContainText('(2 × 8–12)');
  await page.locator('.start-hero .btn-gold').click();
  await page.locator('.btn-plan-toggle').click();
  await page.locator('.drawer-ex-item', { hasText: 'Wznosy nóg do klatki' }).click();
  const buttons = page.locator('.reps-buttons-grid');
  for (const reps of [8, 9, 10, 11, 12]) await expect(buttons.getByRole('button', { name: String(reps), exact: true })).toBeVisible();
  await expect(page.locator('.info-strip-col.prev')).toContainText('MAX');
  await expect(page.locator('.info-strip-col.prev')).toContainText('14');
  expect(await page.evaluate(() => localStorage.getItem('trening2026_history_v1'))).toBe(originalHistory);
  const savedTarget = await page.evaluate(() => JSON.parse(localStorage.getItem('trening2026_plan_v1')).A.exercises.find(e => e.name === 'Wznosy nóg do klatki'));
  expect(savedTarget).toMatchObject({ repsMin: 10, repsMax: 'MAX' });
});

test('hanging leg raises offer repetitions 8 to 12 and custom entry instead of MAX', async ({ page }) => {
  await page.setViewportSize({ width: 320, height: 700 });
  await page.goto('/');
  await page.locator('#nav-plan').click();
  await page.locator('.plan-mgmt-header .btn').click();
  await page.getByRole('button', { name: '📚 Gotowe plany' }).click();
  await page.locator('.template-card', { hasText: 'Split partii mięśniowych — 5 dni' }).getByRole('button', { name: 'Użyj tego planu' }).click();
  await page.locator('#nav-start').click();
  await page.getByRole('button', { name: 'TRENING D' }).click();
  await page.locator('.start-hero .btn-gold').click();
  await page.locator('.btn-plan-toggle').click();
  await page.locator('.drawer-ex-item', { hasText: 'Wznosy nóg w zwisie na drążku' }).click();
  const buttons = page.locator('.reps-buttons-grid');
  for (const reps of [8, 9, 10, 11, 12]) await expect(buttons.getByRole('button', { name: String(reps), exact: true })).toBeVisible();
  await expect(buttons.getByRole('button', { name: 'MAX', exact: true })).toHaveCount(0);
  await expect(buttons.getByRole('button', { name: 'Inne...' })).toBeVisible();
  await buttons.getByRole('button', { name: '11', exact: true }).click();
  await expect(page.locator('.set-row.completed').first()).toContainText('11 powt.');
  await buttons.getByRole('button', { name: 'Inne...' }).click();
  await page.locator('#modalCustomRepsInput').fill('17');
  await page.getByRole('button', { name: 'Zapisz serię' }).click();
  await expect(page.locator('.set-row.completed').last()).toContainText('17 powt.');
  await finishWorkout(page);
  await expect(page.locator('.history-session-card').first()).toContainText('11 powt.');
  await expect(page.locator('.history-session-card').first()).toContainText('17 powt.');
});

test('plank records seconds separately from rest timer and preserves history', async ({ page }) => {
  await page.goto('/');
  await page.locator('#nav-plan').click();
  await page.locator('.plan-mgmt-header .btn').click();
  await page.getByRole('button', { name: '📚 Gotowe plany' }).click();
  await page.locator('.template-card', { hasText: 'FBW — 3 dni' }).getByRole('button', { name: 'Użyj tego planu' }).click();
  await page.locator('#nav-start').click();
  await page.locator('.start-hero .btn-gold').click();
  await page.locator('.btn-plan-toggle').click();
  await page.locator('.drawer-ex-item', { hasText: 'Plank (deska klasyczna)' }).click();
  await expect(page.locator('.exercise-tags')).toContainText('30–45 sek.');
  await expect(page.locator('.weight-adjuster-section')).toHaveCount(0);
  for (const seconds of [15, 30, 45, 60, 75, 90]) await expect(page.getByRole('button', { name: `${seconds} s`, exact: true })).toBeVisible();
  await page.getByRole('button', { name: '30 s', exact: true }).click();
  await expect(page.locator('.set-row.completed').first()).toContainText('30 s');
  await page.getByRole('button', { name: 'Wpisz czas' }).click();
  await expect(page.locator('.modal-title')).toHaveText('Czas serii (sekundy)');
  await page.locator('#modalCustomRepsInput').fill('45');
  await page.getByRole('button', { name: 'Zapisz serię' }).click();
  await expect(page.locator('.set-row.completed').last()).toContainText('45 s');
  await expect(page.locator('.timer-btn-main')).toContainText('START 1:00');
  await finishWorkout(page);
  await expect(page.locator('.history-session-card').first()).toContainText('45 s');
});

test('name autocomplete applies library defaults and bodyweight mode', async ({ page }) => {
  await page.goto('/');
  await page.locator('#nav-plan').click();
  await page.locator('.plan-mgmt-actions .btn', { hasText: '+ Dodaj ćwiczenie' }).click();
  const modal = page.locator('.modal-box');
  await modal.locator('#modalExName').fill('wznosy');
  await modal.locator('#modalExName').fill('Wznosy nóg w zwisie na drążku');
  await expect(modal.locator('#exerciseLibrary')).toHaveValue('Wznosy nóg w zwisie na drążku');
  await expect(modal.locator('#modalExStep')).toHaveCount(0);
  await expect(modal.locator('#modalExProgressionType')).toHaveCount(0);
  await expect(modal.locator('#modalExRest')).toHaveValue('60');
  await modal.getByRole('button', { name: 'Zapisz ćwiczenie' }).click();
  await expect(page.locator('.modal-box')).toHaveCount(0);
  await page.reload();
  await page.locator('#nav-plan').click();
  const exercise = page.locator('.plan-item-card', { hasText: 'Wznosy nóg w zwisie na drążku' });
  await exercise.getByRole('button', { name: '✏️ Edytuj' }).click();
  await expect(modal.locator('#modalExStep')).toHaveCount(0);
  await modal.getByRole('button', { name: 'Anuluj' }).click();
  await page.locator('#nav-start').click();
  await page.locator('.start-hero .btn-gold').click();
  await page.locator('.btn-plan-toggle').click();
  await page.locator('.drawer-ex-item', { hasText: 'Wznosy nóg w zwisie na drążku' }).click();
  await expect(page.getByRole('checkbox', { name: 'Dodatkowe obciążenie (kg)' })).not.toBeChecked();
  await expect(page.locator('.weight-adjuster-section')).toHaveCount(0);
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

test('mobile layout keeps plan preview, saved-plan actions and repetition fields on one row', async ({ page }) => {
  await page.goto('/');

  const previewExercise = page.locator('.preview-item').first();
  await expect(previewExercise.locator('.preview-exercise-reps')).toHaveCSS('white-space', 'nowrap');
  await expect(previewExercise.locator('.preview-exercise-name')).toHaveCSS('text-overflow', 'ellipsis');
  const previewLayout = await previewExercise.evaluate(element => {
    const [number, name, reps] = element.children;
    const item = element.getBoundingClientRect();
    const nameBox = name.getBoundingClientRect();
    const repsBox = reps.getBoundingClientRect();
    return {
      singleRow: Math.abs(nameBox.top - repsBox.top) < 1,
      fits: repsBox.right <= item.right + 1,
    };
  });
  expect(previewLayout).toEqual({ singleRow: true, fits: true });

  await page.locator('#nav-plan').click();
  await page.locator('.plan-mgmt-actions .btn', { hasText: 'Zapisz jako' }).click();
  await page.locator('#savePlanAsInput').fill('Plan mobilny');
  await page.locator('.modal-box .btn-gold', { hasText: /^Zapisz$/ }).click();
  await page.locator('.plan-mgmt-header .btn').click();
  const savedCard = page.locator('.saved-plan-card', { hasText: 'Mój Plan Główny' });
  const actions = savedCard.locator('.saved-plan-secondary-actions .btn');
  await expect(actions).toHaveCount(3);
  const savedActionsLayout = await actions.evaluateAll(buttons => {
    const boxes = buttons.map(button => button.getBoundingClientRect());
    return {
      singleRow: boxes.every(box => Math.abs(box.top - boxes[0].top) < 1),
      fits: boxes[boxes.length - 1].right <= buttons[0].parentElement.getBoundingClientRect().right + 1,
    };
  });
  expect(savedActionsLayout).toEqual({ singleRow: true, fits: true });

  await page.locator('.modal-box .btn', { hasText: 'Zamknij' }).click();
  await page.locator('.plan-mgmt-actions .btn', { hasText: '+ Dodaj ćwiczenie' }).click();
  const fields = page.locator('.exercise-rep-fields .form-group');
  await expect(fields).toHaveCount(3);
  const fieldLayout = await fields.evaluateAll(groups => {
    const boxes = groups.map(group => group.getBoundingClientRect());
    const container = groups[0].parentElement.getBoundingClientRect();
    return {
      singleRow: boxes.every(box => Math.abs(box.top - boxes[0].top) < 1),
      equalWidths: Math.max(...boxes.map(box => box.width)) - Math.min(...boxes.map(box => box.width)) < 1,
      fits: boxes[boxes.length - 1].right <= container.right + 1,
    };
  });
  expect(fieldLayout).toEqual({ singleRow: true, equalWidths: true, fits: true });
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

test('supports creating a five-day plan and applying a five-day gym template', async ({ page }) => {
  await page.setViewportSize({ width: 390, height: 844 });
  await page.goto('/');
  await page.locator('#nav-plan').click();
  await page.locator('.plan-mgmt-header .btn').click();
  await page.locator('.modal-box').getByRole('button', { name: '➕ Nowy plan' }).click();
  await page.locator('#savePlanAsInput').fill('Plan 5 dni');
  await page.locator('.modal-select').selectOption('5');
  await page.getByRole('button', { name: 'Utwórz' }).click();

  await expect(page.locator('.plan-tab-btn')).toHaveCount(5);
  await page.locator('#nav-start').click();
  await expect(page.locator('.pill-btn')).toHaveCount(5);

  await page.locator('#nav-plan').click();
  await page.locator('.plan-mgmt-header .btn').click();
  await page.getByRole('button', { name: '📚 Gotowe plany' }).click();
  await expect(page.locator('.template-card')).toHaveCount(6);
  const template = page.locator('.template-card', { hasText: 'PPL + Góra / Dół — 5 dni' });
  await template.getByRole('button', { name: 'Użyj tego planu' }).click();

  await expect(page.locator('.plan-tab-btn')).toHaveCount(5);
  await expect(page.locator('.plan-tab-btn').first()).toHaveText('PUSH');
  await page.locator('#nav-history').click();
  await expect(page.locator('.hist-pills-row .hist-pill')).toHaveCount(6);
});

test.describe('touch workout selector', () => {
  test.use({ hasTouch: true, isMobile: true });

  test('dragging across workout buttons highlights only the selected workout', async ({ page }) => {
    await page.setViewportSize({ width: 390, height: 844 });
    await page.goto('/');
    await page.locator('#nav-plan').click();
    await page.locator('.plan-mgmt-header .btn').click();
    await page.getByRole('button', { name: '📚 Gotowe plany' }).click();
    await page.locator('.template-card', { hasText: 'PPL + Góra / Dół — 5 dni' }).getByRole('button', { name: 'Użyj tego planu' }).click();
    await page.locator('#nav-start').click();
    const buttons = page.locator('.pill-btn');
    await buttons.nth(3).scrollIntoViewIfNeeded();
    await buttons.nth(3).tap();
    await expect(buttons.nth(3)).toHaveClass(/active/);
    await buttons.nth(4).scrollIntoViewIfNeeded();
    const start = await buttons.nth(4).boundingBox();
    const end = await buttons.nth(3).boundingBox();
    const cdp = await page.context().newCDPSession(page);
    const point = box => ({ x: Math.round(box.x + box.width / 2), y: Math.round(box.y + box.height / 2) });
    await cdp.send('Input.dispatchTouchEvent', { type: 'touchStart', touchPoints: [point(start)] });
    await cdp.send('Input.dispatchTouchEvent', { type: 'touchMove', touchPoints: [point(end)] });
    await cdp.send('Input.dispatchTouchEvent', { type: 'touchEnd', touchPoints: [] });
    // Some mobile browsers retain :hover after touch; emulate that state on an unselected button.
    const unselected = await buttons.evaluateAll(nodes => nodes.findIndex(element => !element.classList.contains('active')));
    await buttons.nth(unselected).scrollIntoViewIfNeeded();
    const hovered = await buttons.nth(unselected).boundingBox();
    await page.mouse.move(hovered.x + hovered.width / 2, hovered.y + hovered.height / 2);
    await page.waitForTimeout(250);
    await expect(page.locator('.pill-btn.active')).toHaveCount(1);
    const styles = await buttons.evaluateAll(nodes => nodes.map(element => ({ selected: element.classList.contains('active'), color: getComputedStyle(element).color, background: getComputedStyle(element).backgroundColor })));
    const selected = styles.find(item => item.selected);
    expect(styles.filter(item => item.color === selected.color && item.background === selected.background)).toHaveLength(1);
  });
});

test('backup reminder appears at the twentieth completed workout and stays closed until the next milestone', async ({ page }) => {
  await page.setViewportSize({ width: 320, height: 700 });
  const initialHistory = Array.from({ length: 19 }, (_, i) => ({ ...legacyHistory[0], sessionId: `old_${i}`, week: 0 }));
  await seed(page, { [KEYS.history]: initialHistory });
  await expect(page.getByText('Zrób szybką kopię swoich wyników w ustawieniach na wypadek zmiany telefonu')).toHaveCount(0);
  await startWorkoutFromStart(page);
  await page.locator('.rep-btn').first().click();
  await finishWorkout(page);
  const reminder = page.getByRole('region', { name: 'Przypomnienie o kopii zapasowej' });
  await expect(reminder).toBeVisible();
  await expect(reminder).toContainText('Zrób szybką kopię swoich wyników w ustawieniach na wypadek zmiany telefonu');
  await page.reload();
  await expect(reminder).toBeVisible();
  await reminder.getByRole('button', { name: 'Zamknij przypomnienie' }).click();
  await expect(reminder).toHaveCount(0);
  await page.reload();
  await expect(reminder).toHaveCount(0);
  await page.locator('#nav-start').click();
  await startWorkoutFromStart(page);
  await page.locator('.rep-btn').first().click();
  await finishWorkout(page);
  await expect(reminder).toHaveCount(0);
});

test('backup reminder appears at forty even if historical workouts were deleted', async ({ page }) => {
  const settings = { currentWeek: 1, selectedStartWorkoutId: 'A', activePlanId: 'plan_default', activePlanName: 'Plan domyślny', soundEnabled: false, vibrateEnabled: false, completedWorkoutCount: 39, backupReminderPending: false };
  await seed(page, { [KEYS.history]: [legacyHistory[0]], [KEYS.settings]: settings });
  await startWorkoutFromStart(page);
  await page.locator('.rep-btn').first().click();
  await finishWorkout(page);
  const reminder = page.getByRole('region', { name: 'Przypomnienie o kopii zapasowej' });
  await expect(reminder).toBeVisible();
  expect(await page.evaluate(key => JSON.parse(localStorage.getItem(key)).completedWorkoutCount, KEYS.settings)).toBe(40);
});

test('start title for the five-day split stays on one line on a narrow phone', async ({ page }) => {
  await page.setViewportSize({ width: 320, height: 700 });
  await page.goto('/');
  await page.locator('#nav-plan').click();
  await page.locator('.plan-mgmt-header .btn').click();
  await page.getByRole('button', { name: '📚 Gotowe plany' }).click();
  await page.locator('.template-card', { hasText: 'Split partii mięśniowych — 5 dni' }).getByRole('button', { name: 'Użyj tego planu' }).click();
  await page.locator('#nav-start').click();
  await page.getByRole('button', { name: 'TRENING E' }).click();
  const title = page.locator('.start-title');
  await expect(title).toHaveText('GÓRA UZUPEŁNIAJĄCA');
  const layout = await title.evaluate(element => {
    const range = document.createRange(); range.selectNodeContents(element);
    const rects = [...range.getClientRects()];
    const box = element.getBoundingClientRect();
    return { lines: new Set(rects.map(r => Math.round(r.top))).size, textLeft: Math.min(...rects.map(r => r.left)), textRight: Math.max(...rects.map(r => r.right)), left: box.left, right: box.right };
  });
  expect(layout.lines).toBe(1);
  expect(layout.textLeft).toBeGreaterThanOrEqual(layout.left);
  expect(layout.textRight).toBeLessThanOrEqual(layout.right);
});

test('long split workout names fit inside their tabs on a narrow phone', async ({ page }) => {
  await page.setViewportSize({ width: 320, height: 700 });
  await page.goto('/');
  await page.locator('#nav-plan').click();
  await page.locator('.plan-mgmt-header .btn').click();
  await page.getByRole('button', { name: '📚 Gotowe plany' }).click();
  await page.locator('.template-card', { hasText: 'Split partii mięśniowych — 5 dni' }).getByRole('button', { name: 'Użyj tego planu' }).click();
  const tabs = page.locator('.plan-tab-btn');
  await expect(tabs).toHaveCount(5);
  for (let i = 0; i < 5; i++) {
    const tab = tabs.nth(i);
    const geometry = await tab.evaluate(element => {
      const range = document.createRange();
      range.selectNodeContents(element);
      const text = range.getBoundingClientRect();
      const button = element.getBoundingClientRect();
      const viewport = element.parentElement.getBoundingClientRect();
      return { textFits: text.left >= button.left && text.right <= button.right, visible: button.left >= viewport.left - 1 && button.right <= viewport.right + 1 };
    });
    expect(geometry).toEqual({ textFits: true, visible: true });
  }
  await expect(tabs.last()).toHaveText('GÓRA UZUPEŁNIAJĄCA');
  const lines = await tabs.last().evaluate(element => {
    const range = document.createRange();
    range.selectNodeContents(element);
    return range.getClientRects().length;
  });
  expect(lines).toBe(1);
  expect(await page.evaluate(() => document.documentElement.scrollWidth <= window.innerWidth)).toBe(true);
});

test('five-day workout card title and exercise badge stay on one line on a phone', async ({ page }) => {
  await page.setViewportSize({ width: 320, height: 700 });
  await page.goto('/');
  await page.locator('#nav-plan').click();
  await page.locator('.plan-mgmt-header .btn').click();
  await page.getByRole('button', { name: '📚 Gotowe plany' }).click();
  await page.locator('.template-card', { hasText: 'Split partii mięśniowych — 5 dni' }).getByRole('button', { name: 'Użyj tego planu' }).click();
  await page.locator('#nav-workout').click();
  const card = page.locator('.workout-choice-card', { hasText: 'GÓRA UZUPEŁNIAJĄCA' });
  const layout = await card.evaluate(element => {
    const title = element.querySelector('.w-card-title');
    const badge = element.querySelector('.badge');
    const rect = node => { const range = document.createRange(); range.selectNodeContents(node); const rects = [...range.getClientRects()]; const rows = []; for (const r of rects) { const row = rows.find(v => Math.abs(v.top - r.top) < 1); if (row) row.right = Math.max(row.right, r.right); else rows.push({ left: r.left, right: r.right, top: r.top, bottom: r.bottom }); } return rows; };
    const cardBounds = element.getBoundingClientRect();
    return { title: rect(title), badge: rect(badge), cardLeft: cardBounds.left, cardRight: cardBounds.right };
  });
  expect(layout.title).toHaveLength(1);
  expect(layout.badge).toHaveLength(1);
  expect(layout.title[0].right).toBeLessThanOrEqual(layout.badge[0].left);
  expect(layout.badge[0].right).toBeLessThanOrEqual(layout.cardRight);
  expect(Math.abs(layout.title[0].top - layout.badge[0].top)).toBeLessThan(10);
  expect(await page.evaluate(() => document.documentElement.scrollWidth <= window.innerWidth)).toBe(true);
});

test('workout picker has short start labels while the start screen keeps its label', async ({ page }) => {
  await page.goto('/');
  await expect(page.locator('#view-start .btn-gold')).toHaveText('🚀 ROZPOCZNIJ TRENING');
  await page.locator('#nav-workout').click();
  const buttons = page.locator('.workout-choice-card button');
  await expect(buttons).toHaveCount(3);
  for (const button of await buttons.all()) await expect(button).toHaveText('ROZPOCZNIJ');
  await buttons.nth(1).click();
  await expect(page.locator('.assistant-ex-count')).toBeVisible();
});

test('four and five day plans finish only after all days in any order', async ({ page }) => {
  await page.goto('/');
  for (const [title, order] of [
    ['Góra / Dół — 4 dni', ['D', 'B', 'A', 'C']],
    ['PPL + Góra / Dół — 5 dni', ['E', 'C', 'A', 'D', 'B']],
  ]) {
    await page.locator('#nav-plan').click();
    await page.locator('.plan-mgmt-header .btn').click();
    await page.getByRole('button', { name: '📚 Gotowe plany' }).click();
    await page.locator('.template-card', { hasText: title }).getByRole('button', { name: 'Użyj tego planu' }).click();
    const initialWeek = await page.locator('.logo-badge').textContent();
    for (let i = 0; i < order.length; i++) {
      await page.locator('#nav-start').click();
      await page.locator('.pill-btn', { hasText: `TRENING ${order[i]}` }).click();
      await page.locator('.start-hero .btn-gold').click();
      await page.locator('.rep-btn').first().click();
      await page.locator('.btn-finish-link').click();
      await expect(page.locator('.modal-title', { hasText: 'Trening Ukończony!' })).toBeVisible();
      if (i < order.length - 1) await expect(page.locator('.logo-badge')).toHaveText(initialWeek);
      else await expect(page.locator('#summarySubtitle')).toContainText('Aplikacja automatycznie przeszła');
      await page.getByRole('button', { name: 'Super, przejdź do historii' }).click();
    }
  }
});

test('importing a three-day backup after selecting day E keeps the editor usable', async ({ page }) => {
  const errors = [];
  page.on('pageerror', error => errors.push(error.message));
  await page.goto('/');
  await page.locator('#nav-settings').click();
  const [download] = await Promise.all([page.waitForEvent('download'), page.getByRole('button', { name: /Pobierz kopię/ }).click()]);
  const backup = await download.path();
  await page.locator('#nav-plan').click();
  await page.locator('.plan-mgmt-header .btn').click();
  await page.getByRole('button', { name: '📚 Gotowe plany' }).click();
  await page.locator('.template-card', { hasText: 'PPL + Góra / Dół — 5 dni' }).getByRole('button', { name: 'Użyj tego planu' }).click();
  await page.locator('.plan-tab-btn').last().click();
  await page.locator('#nav-settings').click();
  await page.locator('#importJsonFileInput').setInputFiles(backup);
  await expect(page.locator('#notification')).toContainText('Pomyślnie wczytano');
  await page.locator('#nav-plan').click();
  await expect(page.locator('.plan-tab-btn')).toHaveCount(3);
  await page.locator('.plan-mgmt-actions').getByRole('button', { name: /Dodaj ćwiczenie/ }).click();
  await expect(page.locator('.modal-title', { hasText: 'Dodaj' })).toBeVisible();
  expect(errors).toEqual([]);
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
