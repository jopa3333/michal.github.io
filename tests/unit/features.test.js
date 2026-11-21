import { describe, expect, it } from 'vitest';
import {
  achievementsState, exerciseRecord, formatRecordedSet, formatWeightDisplay,
  fromDisplayWeight, isPersonalRecord, platesForWeight, toDisplayWeight,
  weekStreak, weightStepValues,
} from '../../src/logic.js';

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
