import { describe, expect, it } from 'vitest';
import {
  achievementsState, DELETED_PLAN_ID, exerciseRecord, filterHistoryByPlan, formatRecordedSet, formatWeightDisplay,
  fromDisplayWeight, historyPlanGroups, historyToCsv, isPersonalRecord, plateModeForExercise, platesForWeight, progressSeries, sessionPlanId, toDisplayWeight,
  weekStreak, weightStepValues,
} from '../../src/logic.js';
import { DEFAULT_PLAN, EXERCISE_DATABASE } from '../../src/data.js';

describe('kg/lb units (storage stays kg)', () => {
  it('converts both ways with sane rounding', () => {
    expect(toDisplayWeight(100, 'lb')).toBe(220.5);
    expect(toDisplayWeight(60, 'lb')).toBe(132.3);
    expect(toDisplayWeight(60, 'kg')).toBe(60);
    // Display rounding to 0.1 lb means the kg round-trip can drift by ~20 g.
    expect(fromDisplayWeight(220.5, 'lb')).toBe(100.02);
    expect(fromDisplayWeight(45, 'lb')).toBe(20.41);
    expect(fromDisplayWeight(10, 'kg')).toBe(10);
    expect(fromDisplayWeight(toDisplayWeight(60, 'lb'), 'lb')).toBeCloseTo(60, 1);
  });

  it('formats weights per language and unit', () => {
    expect(formatWeightDisplay(60, 'pl', 'lb')).toBe('132,3');
    expect(formatWeightDisplay(60, 'en', 'lb')).toBe('132.3');
    expect(formatWeightDisplay(60, 'pl')).toBe('60');
    expect(formatWeightDisplay(2.5, 'pl', 'kg')).toBe('2,5');
  });

  it('formats recorded sets in the display unit', () => {
    const ex = { name: 'Przysiad z sztangą na plecach' };
    expect(formatRecordedSet({ weight: 100, reps: 5 }, ex, 'pl', 'lb')).toBe('220,5 lb × 5');
    expect(formatRecordedSet({ weight: 100, reps: 5 }, ex, 'pl')).toBe('100 kg × 5');
  });

  it('offers unit-appropriate quick steps', () => {
    expect(weightStepValues('kg')).toEqual([0.5, 1, 2.5]);
    expect(weightStepValues('lb')).toEqual([1, 2.5, 5]);
  });
});

describe('plate calculator', () => {
  it('splits kg plates per side', () => {
    expect(platesForWeight(100, 'kg')).toMatchObject({ bar: 20, perSide: [{ plate: 25, count: 1 }, { plate: 15, count: 1 }], exact: true, belowBar: false });
    expect(platesForWeight(20, 'kg')).toMatchObject({ perSide: [], exact: true, belowBar: false });
    expect(platesForWeight(10, 'kg').belowBar).toBe(true);
  });

  it('splits lb plates per side with a 45 lb bar', () => {
    expect(platesForWeight(225, 'lb')).toMatchObject({ bar: 45, perSide: [{ plate: 45, count: 2 }], exact: true });
    expect(platesForWeight(135, 'lb')).toMatchObject({ perSide: [{ plate: 45, count: 1 }], exact: true });
  });

  it('reports leftovers that no plate combination can match', () => {
    const result = platesForWeight(22, 'kg');
    expect(result.exact).toBe(false);
    expect(result.remainder).toBe(1);
  });

  it('machine mode has no bar: the whole weight is plates split per side', () => {
    expect(platesForWeight(100, 'kg', 'machine')).toMatchObject({ bar: 0, perSide: [{ plate: 25, count: 2 }], exact: true, belowBar: false });
    expect(platesForWeight(50, 'kg', 'machine')).toMatchObject({ bar: 0, perSide: [{ plate: 25, count: 1 }], exact: true });
    expect(platesForWeight(90, 'lb', 'machine')).toMatchObject({ bar: 0, perSide: [{ plate: 45, count: 1 }], exact: true });
    const result = platesForWeight(22, 'kg', 'machine');
    expect(result.exact).toBe(false);
    expect(result.remainder).toBe(1);
    expect(platesForWeight(0, 'kg', 'machine')).toMatchObject({ perSide: [], exact: true, belowBar: false });
  });
});

describe('plate mode per exercise', () => {
  it('barbell exercises keep the bar calculator', () => {
    for (const name of [
      'Przysiad z sztangą na plecach', 'Przysiad ze sztangą na plecach',
      'Wyciskanie sztangi leżąc na ławce poziomej', 'Martwy ciąg na prostych nogach',
      'Wyciskanie żołnierskie stojąc ze sztangą (OHP)', 'Uginanie na modlitewniku ze sztangą łamaną',
      'Hip Thrust ze sztangą na biodrach',
    ]) expect(plateModeForExercise(name), name).toBe('barbell');
  });

  it('plate-loaded machines use machine mode (no bar)', () => {
    for (const name of [
      'Wiosłowanie na hammerze', 'Wyciskanie na hammerze', 'Leg press',
      'Suwnica na nogi (Leg Press)', 'Hack Przysiad (maszyna)', 'Wiosłowanie na maszynie T-Bar',
    ]) expect(plateModeForExercise(name), name).toBe('machine');
  });

  it('dumbbells, cables, stack machines and bodyweight get no calculator', () => {
    for (const name of [
      'Wyciskanie hantli siedząc', 'Wznosy w bok', 'Wznosy hantli bokiem stojąc',
      'Pompki na poręczach', 'Pompki klasyczne', 'Podciąganie na drążku nachwytem',
      'Wznosy nóg do klatki', 'Plank (deska klasyczna)', 'Ściąganie drążka do klatki',
      'Allahy', 'Prostowanie ramion na wyciągu', 'Uginanie ramion z supinacją',
      'Uginanie ramion z oparciem o kolano', 'Wyciskanie na maszynie Chest Press',
      'Odwrotny butterfly', 'Uginanie nóg', 'Łydka stojąc', 'Wspięcia na łydki siedząc',
      'Rozpiętki z hantlami na ławce poziomej',
    ]) expect(plateModeForExercise(name), name).toBeNull();
  });

  it('classifies every built-in exercise without crashing', () => {
    const names = [
      ...EXERCISE_DATABASE.map(e => e.name),
      ...Object.values(DEFAULT_PLAN).flatMap(w => w.exercises.map(e => e.name)),
    ];
    for (const name of names) {
      expect(['barbell', 'machine', null], name).toContain(plateModeForExercise(name));
    }
    // No dumbbell exercise may ever offer plates.
    for (const name of names.filter(n => n.toLowerCase().includes('hantl'))) {
      expect(plateModeForExercise(name), name).toBeNull();
    }
  });
});

describe('personal records', () => {
  const history = [{
    date: '2026-01-05T10:00:00.000Z',
    exercises: [{ name: 'Przysiad z sztangą na plecach', sets: [{ weight: 100, reps: 5 }, { weight: 100, reps: 4 }] }],
  }];

  it('finds the best historical values', () => {
    expect(exerciseRecord(history, 'Przysiad z sztangą na plecach')).toMatchObject({ weight: 100, reps: 5, hasHistory: true });
    expect(exerciseRecord(history, 'Inne ćwiczenie').hasHistory).toBe(false);
  });

  it('detects a heavier set as a record, equal weight is not', () => {
    const ex = { name: 'Przysiad z sztangą na plecach' };
    expect(isPersonalRecord({ weight: 102.5, reps: 3 }, ex, history)).toBe(true);
    expect(isPersonalRecord({ weight: 100, reps: 8 }, ex, history)).toBe(false);
    expect(isPersonalRecord({ weight: 50, reps: 5 }, ex, [])).toBe(false);
  });

  it('detects rep and seconds records for bodyweight/timed exercises', () => {
    const raises = { name: 'Wznosy nóg do klatki' };
    const raiseHistory = [{ exercises: [{ name: 'Wznosy nóg do klatki', sets: [{ weight: 0, reps: 12, hasWeight: false }] }] }];
    expect(isPersonalRecord({ weight: 0, reps: 15, hasWeight: false }, raises, raiseHistory)).toBe(true);
    expect(isPersonalRecord({ weight: 0, reps: 10, hasWeight: false }, raises, raiseHistory)).toBe(false);
    const plank = { name: 'Plank (deska klasyczna)' };
    const plankHistory = [{ exercises: [{ name: 'Plank (deska klasyczna)', sets: [{ weight: 0, reps: 45, measurement: 'seconds' }] }] }];
    expect(isPersonalRecord({ weight: 0, reps: 60, measurement: 'seconds' }, plank, plankHistory)).toBe(true);
    expect(isPersonalRecord({ weight: 0, reps: 30, measurement: 'seconds' }, plank, plankHistory)).toBe(false);
  });
});

describe('streak and achievements', () => {
  const weekHistory = weeks => weeks.map((week, i) => ({ sessionId: `s${i}`, week, totalVolume: 1000 }));

  it('counts consecutive weeks and tolerates a week still in progress', () => {
    expect(weekStreak(weekHistory([1, 2, 3]), 4)).toBe(3);
    expect(weekStreak(weekHistory([1, 2, 3]), 3)).toBe(3);
    expect(weekStreak(weekHistory([1, 3]), 3)).toBe(1);
    expect(weekStreak([], 1)).toBe(0);
  });

  it('marks earned and locked badges with progress values', () => {
    const history = weekHistory(Array.from({ length: 10 }, () => 1));
    const state = achievementsState(history, { currentWeek: 1, prCount: 1 });
    const byId = Object.fromEntries(state.map(b => [b.id, b]));
    expect(byId.first.earned).toBe(true);
    expect(byId.w10.earned).toBe(true);
    expect(byId.w25.earned).toBe(false);
    expect(byId.w25.value).toBe(10);
    expect(byId.pr1.earned).toBe(true);
    expect(byId.vol10k.earned).toBe(true);
    expect(byId.streak4.earned).toBe(false);
  });

  it('prefers the lifetime counter over history length', () => {
    const state = achievementsState([], { completedWorkoutCount: 50, currentWeek: 1 });
    expect(state.find(b => b.id === 'w50').earned).toBe(true);
  });
});

describe('history per plan', () => {
  const settings = { activePlanId: 'plan_1', legacyProgressPlanId: 'plan_legacy' };
  const savedPlans = [{ id: 'plan_1', name: 'Plan 1' }, { id: 'plan_2', name: 'Plan 2' }];
  const history = [
    { sessionId: 'a', planId: 'plan_1', week: 1 },
    { sessionId: 'b', planId: 'plan_2', week: 1 },
    { sessionId: 'c', planId: 'plan_gone', week: 2 },
    { sessionId: 'd', week: 3 }, // legacy: no planId
  ];

  it('attributes sessions to their plan, legacy ones to the legacy plan', () => {
    expect(sessionPlanId(history[0], settings)).toBe('plan_1');
    expect(sessionPlanId(history[3], settings)).toBe('plan_legacy');
    expect(sessionPlanId({}, {})).toBe('plan_default');
  });

  it('groups plans: active first, then saved plans with history, then deleted bucket', () => {
    const groups = historyPlanGroups(history, savedPlans, settings);
    // plan_legacy and plan_gone no longer exist — both fall into the deleted bucket.
    expect(groups.map(g => g.id)).toEqual(['plan_1', 'plan_2', DELETED_PLAN_ID]);
    expect(groups.find(g => g.id === DELETED_PLAN_ID).deleted).toBe(true);
    // Active plan stays visible even without any history.
    const empty = historyPlanGroups([], savedPlans, settings);
    expect(empty.map(g => g.id)).toEqual(['plan_1']);
  });

  it('filters history by plan including the deleted bucket', () => {
    expect(filterHistoryByPlan(history, 'all', settings, savedPlans)).toHaveLength(4);
    expect(filterHistoryByPlan(history, 'plan_2', settings, savedPlans).map(s => s.sessionId)).toEqual(['b']);
    expect(filterHistoryByPlan(history, 'plan_legacy', settings, savedPlans).map(s => s.sessionId)).toEqual(['d']);
    expect(filterHistoryByPlan(history, DELETED_PLAN_ID, settings, savedPlans).map(s => s.sessionId)).toEqual(['c', 'd']);
  });
});

describe('progress chart series', () => {
  it('picks the heaviest set per session in chronological order and marks PRs', () => {
    // History is newest-first.
    const sessions = [
      { date: '2026-02-10', week: 3, workoutName: 'A', exercises: [{ name: 'Przysiad z sztangą na plecach', sets: [{ weight: 100, reps: 5 }, { weight: 105, reps: 3 }] }] },
      { date: '2026-02-03', week: 2, workoutName: 'A', exercises: [{ name: 'Przysiad z sztangą na plecach', sets: [{ weight: 95, reps: 5 }] }] },
      { date: '2026-01-27', week: 1, workoutName: 'A', exercises: [{ name: 'Przysiad z sztangą na plecach', sets: [{ weight: 100, reps: 5 }] }] },
    ];
    const series = progressSeries(sessions, 'Przysiad z sztangą na plecach');
    expect(series.measurement).toBe('weight');
    expect(series.points.map(p => p.value)).toEqual([100, 95, 105]);
    expect(series.points.map(p => p.isPR)).toEqual([false, false, true]);
  });

  it('uses reps for unweighted exercises and seconds for timed ones', () => {
    const raises = [
      { date: '2026-02-10', week: 2, workoutName: 'A', exercises: [{ name: 'Wznosy nóg do klatki', sets: [{ weight: 0, reps: 14 }] }] },
      { date: '2026-02-03', week: 1, workoutName: 'A', exercises: [{ name: 'Wznosy nóg do klatki', sets: [{ weight: 0, reps: 10 }, { weight: 0, reps: 12 }] }] },
    ];
    const repSeries = progressSeries(raises, 'Wznosy nóg do klatki');
    expect(repSeries.measurement).toBe('reps');
    expect(repSeries.points.map(p => [p.value, p.isPR])).toEqual([[12, false], [14, true]]);

    const plank = [{ date: '2026-02-03', week: 1, workoutName: 'A', exercises: [{ name: 'Plank (deska klasyczna)', sets: [{ weight: 0, reps: 60, measurement: 'seconds' }] }] }];
    expect(progressSeries(plank, 'Plank (deska klasyczna)').measurement).toBe('seconds');
  });
});

describe('CSV export', () => {
  const settings = { activePlanId: 'plan_1', activePlanName: 'Mój plan', legacyProgressPlanId: 'plan_1' };
  const savedPlans = [{ id: 'plan_1', name: 'Mój plan' }];
  const sessions = [{
    date: '2026-02-10T18:00:00.000Z',
    planId: 'plan_1',
    week: 2,
    workoutName: 'TRENING A',
    exercises: [
      { name: 'Przysiad ze sztangą na plecach', sets: [{ weight: 82.5, reps: 5 }, { weight: 85, reps: 4 }] },
      { name: 'Wznosy nóg do klatki', sets: [{ weight: 0, reps: 12, hasWeight: false }] },
    ],
  }];

  it('writes UTF-8 BOM and semicolon-delimited Polish rows for Polish Excel', () => {
    const csv = historyToCsv(sessions, { lang: 'pl', unit: 'kg', savedPlans, settings });
    expect(csv.startsWith('\uFEFF')).toBe(true);
    const lines = csv.slice(1).split('\r\n');
    expect(lines[0]).toBe('Data;Plan;Tydzień;Trening;Ćwiczenie;Seria;Ciężar (kg);Powtórzenia');
    expect(lines[1]).toBe('2026-02-10;Mój plan;2;TRENING A;Przysiad ze sztangą na plecach;1;82,5;5');
    expect(lines[2]).toBe('2026-02-10;Mój plan;2;TRENING A;Przysiad ze sztangą na plecach;2;85;4');
    // Unweighted bodyweight set leaves the weight cell empty instead of 0.
    expect(lines[3]).toBe('2026-02-10;Mój plan;2;TRENING A;Wznosy nóg do klatki;1;;12');
  });

  it('writes comma-delimited English rows and converts to lb', () => {
    const csv = historyToCsv(sessions, { lang: 'en', unit: 'lb', savedPlans, settings });
    const lines = csv.slice(1).split('\r\n');
    expect(lines[0]).toBe('Date,Plan,Week,Workout,Exercise,Set,Weight (lb),Reps');
    expect(lines[1]).toBe('2026-02-10,Mój plan,2,WORKOUT A,Barbell Back Squat,1,181.9,5');
  });
});
