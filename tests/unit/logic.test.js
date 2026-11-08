import { describe, expect, it } from 'vitest';
import { DEFAULT_PLAN, EXERCISE_CATEGORIES, EXERCISE_DATABASE } from '../../src/data.js';
import { KEYS } from '../../src/storage.js';
import * as logic from '../../src/logic.js';

const session = (week, workoutId, date, exercises) => ({
  sessionId: `s_${week}_${workoutId}_${date}`,
  workoutId,
  workoutName: `TRENING ${workoutId}`,
  week,
  date,
  exercises,
});

const sets = (...pairs) => pairs.map(([weight, reps]) => ({ weight, reps }));

describe('legacy storage keys', () => {
  it('keeps the exact keys used by the legacy app so saved data carries over', () => {
    expect(KEYS).toEqual({
      plan: 'trening2026_plan_v1',
      savedPlans: 'trening2026_saved_plans_v1',
      history: 'trening2026_history_v1',
      settings: 'trening2026_settings_v1',
      active: 'trening2026_active_session_v1',
    });
  });
});

describe('default plan (port of legacy DEFAULT_PLAN)', () => {
  it('has workouts A, B and C with 7 exercises each', () => {
    expect(Object.keys(DEFAULT_PLAN)).toEqual(['A', 'B', 'C']);
    expect(DEFAULT_PLAN.A.exercises).toHaveLength(7);
    expect(DEFAULT_PLAN.B.exercises).toHaveLength(7);
    expect(DEFAULT_PLAN.C.exercises).toHaveLength(7);
  });

  it('uses the legacy ids and names', () => {
    expect(DEFAULT_PLAN.A.name).toBe('TRENING A');
    expect(DEFAULT_PLAN.A.exercises[0]).toMatchObject({ id: 'ex_a_1', name: 'Przysiad z sztangą na plecach', sets: 3, repsMin: 3, repsMax: 5, tempo: '2010', progressionStep: 2.5, restSeconds: 180 });
    expect(DEFAULT_PLAN.B.exercises[1]).toMatchObject({ id: 'ex_b_2', name: 'Leg press', progressionStep: 5, restSeconds: 120 });
    expect(DEFAULT_PLAN.C.exercises[6]).toMatchObject({ id: 'ex_c_7', repsMin: 10, repsMax: 'MAX' });
  });

  it('marks only zero-step exercises as manual progression', () => {
    const manual = Object.values(DEFAULT_PLAN).flatMap(w => w.exercises).filter(e => e.progressionType === 'manual');
    expect(manual.map(e => e.name)).toEqual(['Wznosy nóg do klatki', 'Wznosy nóg do klatki']);
    expect(manual.every(e => e.progressionStep === 0)).toBe(true);
  });
});

describe('exercise database', () => {
  it('has the six legacy categories and unique names', () => {
    expect(EXERCISE_CATEGORIES.map(([category]) => category)).toEqual([
      'Nogi i Pośladki',
      'Klatka Piersiowa',
      'Plecy',
      'Barki',
      'Ramiona (Biceps & Triceps)',
      'Brzuch & Core',
    ]);
    const names = EXERCISE_DATABASE.map(e => e.name);
    expect(new Set(names).size).toBe(names.length);
    expect(EXERCISE_DATABASE).toHaveLength(62);
  });
});

describe('formatting helpers', () => {
  it('formats weights with a decimal comma, like the legacy app', () => {
    expect(logic.formatWeightDisplay(2.5)).toBe('2,5');
    expect(logic.formatWeightDisplay(100)).toBe('100');
    expect(logic.formatWeightDisplay(undefined)).toBe('0');
    expect(logic.formatWeightDisplay('abc')).toBe('0');
  });

  it('parses typed weights with a comma or a dot, and falls back to 0', () => {
    expect(logic.parseWeightInput('2,5')).toBe(2.5);
    expect(logic.parseWeightInput('2.5')).toBe(2.5);
    expect(logic.parseWeightInput('')).toBe(0);
    expect(logic.parseWeightInput('abc')).toBe(0);
    expect(logic.parseWeightInput('-3')).toBe(-3);
  });

  it('formats timer seconds as m:ss', () => {
    expect(logic.formatTime(180)).toBe('3:00');
    expect(logic.formatTime(65)).toBe('1:05');
    expect(logic.formatTime(0)).toBe('0:00');
  });

  it('shows rep ranges with an en dash and MAX as 10+ MAX', () => {
    expect(logic.repsDisplay({ repsMin: 8, repsMax: 12 })).toBe('8–12');
    expect(logic.repsDisplay({ repsMin: 10, repsMax: 'MAX' })).toBe('10+ MAX');
  });
});

describe('repButtonValues', () => {
  it('lists every rep count for ranges up to 8 values wide', () => {
    expect(logic.repButtonValues({ repsMin: 3, repsMax: 5 })).toEqual([3, 4, 5]);
    expect(logic.repButtonValues({ repsMin: 8, repsMax: 12 })).toEqual([8, 9, 10, 11, 12]);
  });

  it('steps by 2 for wider ranges', () => {
    expect(logic.repButtonValues({ repsMin: 5, repsMax: 20 })).toEqual([5, 7, 9, 11, 13, 15, 17, 19]);
  });

  it('offers a single MAX button for open-ended sets', () => {
    expect(logic.repButtonValues({ repsMin: 10, repsMax: 'MAX' })).toEqual(['MAX']);
  });

  it('falls back to 6/8/10/12 when the minimum is not a number', () => {
    expect(logic.repButtonValues({ repsMin: 'x', repsMax: 12 })).toEqual([6, 8, 10, 12]);
  });
});

describe('calculateProgression', () => {
  const def = { name: 'Przysiad z sztangą na plecach', sets: 3, repsMin: 3, repsMax: 5, progressionType: 'top_all_sets', progressionStep: 2.5 };

  it('has no suggestion without history', () => {
    expect(logic.calculateProgression([], def)).toEqual({
      hasHistory: false,
      suggestedWeight: 0,
      isProgression: false,
      progressionBadgeText: '',
      lastSummaryText: 'BRAK POPRZEDNIEGO WYNIKU',
      lastDateText: '',
    });
  });

  it('adds the step when every set reached the top of the range', () => {
    const history = [session(1, 'A', '2026-01-05T10:00:00Z', [{ name: def.name, sets: sets([100, 5], [100, 5], [100, 5]) }])];
    const result = logic.calculateProgression(history, def);
    expect(result.isProgression).toBe(true);
    expect(result.suggestedWeight).toBe(102.5);
    expect(result.progressionBadgeText).toBe('PROGRES +2,5 kg');
    expect(result.lastSummaryText).toBe('100 kg • 5 / 5 / 5');
  });

  it('keeps the same weight when one set fell short', () => {
    const history = [session(1, 'A', '2026-01-05T10:00:00Z', [{ name: def.name, sets: sets([100, 5], [100, 4], [100, 5]) }])];
    const result = logic.calculateProgression(history, def);
    expect(result.isProgression).toBe(false);
    expect(result.suggestedWeight).toBe(100);
  });

  it('needs all planned sets for top_all_sets', () => {
    const history = [session(1, 'A', '2026-01-05T10:00:00Z', [{ name: def.name, sets: sets([100, 5], [100, 5]) }])];
    expect(logic.calculateProgression(history, def).isProgression).toBe(false);
  });

  it('only checks the first set for top_first_set', () => {
    const history = [session(1, 'A', '2026-01-05T10:00:00Z', [{ name: def.name, sets: sets([100, 5], [100, 4], [100, 4]) }])];
    const result = logic.calculateProgression(history, { ...def, progressionType: 'top_first_set' });
    expect(result.isProgression).toBe(true);
    expect(result.suggestedWeight).toBe(102.5);
  });

  it('never progresses manual exercises', () => {
    const history = [session(1, 'A', '2026-01-05T10:00:00Z', [{ name: def.name, sets: sets([100, 5], [100, 5], [100, 5]) }])];
    expect(logic.calculateProgression(history, { ...def, progressionType: 'manual' }).isProgression).toBe(false);
  });

  it('shows mixed weights per set, like the legacy summary', () => {
    const history = [session(1, 'A', '2026-01-05T10:00:00Z', [{ name: def.name, sets: sets([100, 8], [90, 8]) }])];
    expect(logic.calculateProgression(history, def).lastSummaryText).toBe('100kg × 8 / 90kg × 8');
  });

  it('matches exercise names ignoring case and surrounding spaces', () => {
    const history = [session(1, 'A', '2026-01-05T10:00:00Z', [{ name: '  PRZYSIAD Z SZTANGĄ NA PLECACH ', sets: sets([60, 4]) }])];
    expect(logic.calculateProgression(history, def).lastWeight).toBe(60);
  });
});

describe('createSessionExercises', () => {
  it('pre-fills weights from history and starts every set list empty', () => {
    const history = [session(1, 'A', '2026-01-05T10:00:00Z', [{ name: 'Przysiad z sztangą na plecach', sets: sets([100, 5], [100, 5], [100, 5]) }])];
    const exercises = logic.createSessionExercises(DEFAULT_PLAN.A, history);
    expect(exercises).toHaveLength(7);
    expect(exercises[0]).toMatchObject({ name: 'Przysiad z sztangą na plecach', setsTarget: 3, currentWeight: 102.5, isProgressionHit: true, completedSets: [] });
    expect(exercises[1]).toMatchObject({ currentWeight: 0, suggestedWeight: 0, lastSummary: 'BRAK POPRZEDNIEGO WYNIKU', isProgressionHit: false });
  });
});

describe('week progression', () => {
  it('advances to the next week once A, B and C are all done', () => {
    const history = [session(1, 'A', 'd1', []), session(1, 'B', 'd2', []), session(1, 'C', 'd3', [])];
    const result = logic.applyWeekProgress(history, { currentWeek: 1, selectedStartWorkoutId: 'C' });
    expect(result.advanced).toBe(true);
    expect(result.settings).toMatchObject({ currentWeek: 2, selectedStartWorkoutId: 'A' });
    expect(result.weekProg).toEqual({ advanced: true, newWeek: 2, previousWeek: 1 });
  });

  it('stays on the same week while a workout is still missing', () => {
    const settings = { currentWeek: 1, selectedStartWorkoutId: 'C' };
    const result = logic.applyWeekProgress([session(1, 'A', 'd1', []), session(1, 'B', 'd2', [])], settings);
    expect(result.advanced).toBe(false);
    expect(result.settings).toBe(settings);
  });

  it('also advances after three sessions even if the ids repeat', () => {
    const history = [session(1, 'A', 'd1', []), session(1, 'A', 'd2', []), session(1, 'A', 'd3', [])];
    expect(logic.applyWeekProgress(history, { currentWeek: 1 }).settings.currentWeek).toBe(2);
  });

  it('suggests the next missing workout after finishing one', () => {
    const history = [session(1, 'A', 'd1', [])];
    const result = logic.settingsAfterFinish(history, { currentWeek: 1 }, 'A');
    expect(result.settings.selectedStartWorkoutId).toBe('B');
    expect(result.weekProg.advanced).toBe(false);
  });

  it('cycles A to B to C when the week is complete but not advanced', () => {
    expect(logic.nextWorkoutAfter('A')).toBe('B');
    expect(logic.nextWorkoutAfter('B')).toBe('C');
    expect(logic.nextWorkoutAfter('C')).toBe('A');
  });

  it('reports remaining workouts for a week', () => {
    expect(logic.remainingWorkoutsThisWeek([session(2, 'B', 'd', [])], 2)).toEqual(['A', 'C']);
    expect(logic.remainingWorkoutsThisWeek([], undefined)).toEqual(['A', 'B', 'C']);
  });
});

describe('buildSessionRecord', () => {
  it('sums volume from numeric reps only and rounds it', () => {
    const built = logic.buildSessionRecord(
      {
        sessionId: 's1',
        workoutId: 'A',
        workoutName: 'TRENING A',
        week: 1,
        exercises: [
          { id: 'ex_a_1', name: 'X', setsTarget: 3, tempo: '2010', completedSets: sets([100, 5], [100, 'MAX']) },
          { id: 'ex_a_2', name: 'Y', setsTarget: 2, tempo: '2010', completedSets: sets([2.5, 3]) },
        ],
      },
      '2026-01-01T00:00:00.000Z',
    );
    expect(built.totalSets).toBe(3);
    expect(built.volume).toBe(508);
    expect(built.record).toMatchObject({ sessionId: 's1', totalSets: 3, totalVolume: 508, date: '2026-01-01T00:00:00.000Z' });
    expect(built.record.exercises[0]).toEqual({ id: 'ex_a_1', name: 'X', targetSets: 3, tempo: '2010', sets: sets([100, 5], [100, 'MAX']) });
    expect(built.record.exercises[1].sets).toEqual(sets([2.5, 3]));
  });

  it('keeps exercises with no completed sets in the record, as legacy does', () => {
    const built = logic.buildSessionRecord({ sessionId: 's', workoutId: 'B', workoutName: 'TRENING B', week: 1, exercises: [{ id: 'e', name: 'N', setsTarget: 2, tempo: '2010', completedSets: [] }] }, 'd');
    expect(built.record.exercises).toEqual([{ id: 'e', name: 'N', targetSets: 2, tempo: '2010', sets: [] }]);
    expect(built.volume).toBe(0);
  });
});

describe('history filters and lists', () => {
  const history = [
    session(1, 'A', 'd1', [{ name: 'Przysiad z sztangą na plecach', sets: sets([100, 5]) }]),
    session(2, 'B', 'd2', [{ name: 'Leg press', sets: sets([120, 10]) }]),
    session(2, 'C', 'd3', [{ name: 'Przysiad z sztangą na plecach', sets: sets([80, 8]) }]),
  ];

  it('filters by workout and week', () => {
    expect(logic.filterHistory(history, 'A', 'all').map(s => s.workoutId)).toEqual(['A']);
    expect(logic.filterHistory(history, 'all', 2).map(s => s.workoutId)).toEqual(['B', 'C']);
    expect(logic.filterHistory(history, 'B', 2).map(s => s.workoutId)).toEqual(['B']);
  });

  it('lists week options for the chosen workout, sorted', () => {
    expect(logic.weekOptions(history, 'all')).toEqual([1, 2]);
    expect(logic.weekOptions(history, 'A')).toEqual([1]);
  });

  it('lists exercise names from history and the plan, sorted and unique', () => {
    const names = logic.exerciseNames(history, DEFAULT_PLAN);
    expect(names.filter(n => n === 'Przysiad z sztangą na plecach')).toHaveLength(1);
    expect(names).toContain('Leg press');
    expect([...names].sort()).toEqual(names);
  });

  it('finds an exercise in each session regardless of case', () => {
    const entries = logic.exerciseEntries(history, '  przysiad z SZTANGĄ na plecach ');
    expect(entries.map(e => e.sets)).toEqual([sets([100, 5]), sets([80, 8])]);
  });
});

describe('plan helpers', () => {
  it('updates the saved entry that matches the active plan', () => {
    const saved = [{ id: 'plan_default', name: 'Mój', workouts: {}, updatedAt: 'old' }];
    const next = logic.upsertCurrentPlan(saved, { activePlanId: 'plan_default', activePlanName: 'Mój' }, DEFAULT_PLAN, 'now');
    expect(next).toHaveLength(1);
    expect(next[0].updatedAt).toBe('now');
    expect(next[0].workouts.A.exercises).toHaveLength(7);
  });

  it('adds an entry when the active plan is not saved yet', () => {
    const next = logic.upsertCurrentPlan([], { activePlanId: 'plan_x', activePlanName: 'Nowy' }, DEFAULT_PLAN, 'now');
    expect(next).toHaveLength(1);
    expect(next[0]).toMatchObject({ id: 'plan_x', name: 'Nowy', createdAt: 'now' });
  });

  it('builds an empty three-workout plan and counts exercises', () => {
    expect(logic.planCounts(logic.emptyPlan())).toEqual([0, 0, 0]);
    expect(logic.planCounts(DEFAULT_PLAN)).toEqual([7, 7, 7]);
  });

  it('validates the exercise form like the legacy modal', () => {
    const base = { name: ' Wyciskanie ', sets: '3', repsMin: '8', repsMax: 'max', tempo: ' ', step: '1,25', rest: '120', progressionType: 'manual' };
    expect(logic.exerciseFromForm({ ...base, name: '  ' }, null, 1).error).toBe('Podaj nazwę ćwiczenia');
    expect(logic.exerciseFromForm({ ...base, sets: '0' }, null, 1).error).toBe('Podaj prawidłową liczbę serii');
    expect(logic.exerciseFromForm(base, 'ex_old', 1).exercise).toEqual({
      id: 'ex_old',
      name: 'Wyciskanie',
      sets: 3,
      repsMin: 8,
      repsMax: 'MAX',
      tempo: '2010',
      progressionStep: 1.25,
      restSeconds: 120,
      progressionType: 'manual',
    });
  });

  it('falls back to legacy defaults for bad numbers and creates ids from the time', () => {
    const { exercise } = logic.exerciseFromForm({ name: 'A', sets: '2', repsMin: 'x', repsMax: '12', tempo: '2111', step: '', rest: 'y', progressionType: 'top_all_sets' }, null, 42);
    expect(exercise).toMatchObject({ id: 'ex_42', repsMin: 8, progressionStep: 0, restSeconds: 90 });
  });

  it('turns an unreadable step into 0, as the legacy parser does (the 2.5 fallback is never reached)', () => {
    const { exercise } = logic.exerciseFromForm({ name: 'A', sets: '2', repsMin: '8', repsMax: '12', tempo: '2010', step: 'x', rest: '60', progressionType: 'manual' }, null, 1);
    expect(exercise.progressionStep).toBe(0);
  });
});
