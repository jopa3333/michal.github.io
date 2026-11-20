import { describe, expect, it } from 'vitest';
import {
  tFor, exerciseDisplayName, canonicalExerciseName, workoutDisplayName,
  categoryDisplayName, planDisplayName, templateText, dateLocale,
} from '../../src/i18n/core.js';
import {
  formatWeightDisplay, formatRecordedSet, isBodyweightExercise, isTimedExercise,
  exerciseFromForm, progressionRuleText,
} from '../../src/logic.js';
import { PLAN_TEMPLATES } from '../../src/data.js';

describe('i18n core', () => {
  it('translates and interpolates', () => {
    expect(tFor('pl')('app.started', { name: 'TRENING A', week: 2 })).toBe('Rozpoczęto TRENING A (Tydzień 2)!');
    expect(tFor('en')('app.started', { name: 'WORKOUT A', week: 2 })).toBe('Started WORKOUT A (Week 2)!');
  });

  it('falls back to Polish for missing EN keys and to the key itself when unknown', () => {
    expect(tFor('en')('app.nav.start')).toBe('Start');
    expect(tFor('en')('no.such.key')).toBe('no.such.key');
  });

  it('translates exercise names both ways and passes custom names through', () => {
    expect(exerciseDisplayName('Przysiad ze sztangą na plecach', 'en')).toBe('Barbell Back Squat');
    expect(exerciseDisplayName('Przysiad ze sztangą na plecach', 'pl')).toBe('Przysiad ze sztangą na plecach');
    expect(canonicalExerciseName('Barbell Back Squat')).toBe('Przysiad ze sztangą na plecach');
    expect(canonicalExerciseName('barbell back squat')).toBe('Przysiad ze sztangą na plecach');
    expect(exerciseDisplayName('Moje własne ćwiczenie', 'en')).toBe('Moje własne ćwiczenie');
    expect(canonicalExerciseName('My custom exercise')).toBe('My custom exercise');
  });

  it('translates workout, category and plan names', () => {
    expect(workoutDisplayName('TRENING A', 'en')).toBe('WORKOUT A');
    expect(workoutDisplayName('KLATKA + TRICEPS', 'en')).toBe('CHEST + TRICEPS');
    expect(workoutDisplayName('GÓRA UZUPEŁNIAJĄCA', 'en')).toBe('UPPER SUPPLEMENTAL');
    expect(workoutDisplayName('Mój własny trening', 'en')).toBe('Mój własny trening');
    expect(categoryDisplayName('Nogi i Pośladki', 'en')).toBe('Legs & Glutes');
    expect(planDisplayName('Mój Plan Główny (A/B/C)', 'en')).toBe('My Main Plan (A/B/C)');
    expect(planDisplayName('FBW — 3 dni (Kopia)', 'en')).toBe('FBW — 3 dni (Copy)');
  });

  it('translates every template library entry', () => {
    for (const template of PLAN_TEMPLATES) {
      const en = templateText(template, 'en');
      expect(en.title).not.toBe(template.title);
      expect(en.description).not.toBe(template.description);
      expect(en.level).toBeTruthy();
      expect(en.goal).toBeTruthy();
    }
  });

  it('uses language-aware locales', () => {
    expect(dateLocale('pl')).toBe('pl-PL');
    expect(dateLocale('en')).toBe('en-GB');
  });
});

describe('language-aware logic', () => {
  it('formats weights with comma in PL and dot in EN', () => {
    expect(formatWeightDisplay(2.5)).toBe('2,5');
    expect(formatWeightDisplay(2.5, 'pl')).toBe('2,5');
    expect(formatWeightDisplay(2.5, 'en')).toBe('2.5');
  });

  it('formats recorded sets in both languages', () => {
    const ex = { name: 'Przysiad ze sztangą na plecach' };
    expect(formatRecordedSet({ weight: 60, reps: 10 }, ex, 'pl')).toBe('60 kg × 10');
    const bw = { name: 'Pompki klasyczne' };
    expect(formatRecordedSet({ weight: 0, reps: 12, hasWeight: false }, bw, 'pl')).toBe('12 powt.');
    expect(formatRecordedSet({ weight: 0, reps: 12, hasWeight: false }, bw, 'en')).toBe('12 reps');
    expect(formatRecordedSet({ weight: 0, reps: 45, hasWeight: false, measurement: 'seconds' }, { name: 'Plank (deska klasyczna)' }, 'en')).toBe('45 s');
  });

  it('recognises English bodyweight and timed names', () => {
    expect(isBodyweightExercise({ name: 'Hanging Leg Raise' })).toBe(true);
    expect(isBodyweightExercise({ name: 'Push-Up' })).toBe(true);
    expect(isBodyweightExercise({ name: 'Barbell Back Squat' })).toBe(false);
    expect(isTimedExercise({ name: 'Plank' })).toBe(true);
    expect(isTimedExercise({ name: 'Push-Up' })).toBe(false);
  });

  it('canonicalizes English exercise names on save', () => {
    const form = { name: 'Hanging Leg Raise', sets: '3', repsMin: '8', repsMax: '12', tempo: '2010', step: '0', rest: '60', progressionType: 'manual' };
    const result = exerciseFromForm(form, null, 1, 'en');
    expect(result.exercise.name).toBe('Wznosy nóg w zwisie na drążku');
  });

  it('translates form errors and progression rules', () => {
    const bad = { name: '', sets: '3', repsMin: '8', repsMax: '12', tempo: '', step: '', rest: '', progressionType: 'manual' };
    expect(exerciseFromForm(bad, null, 1, 'en').error).toBe('Enter an exercise name');
    expect(exerciseFromForm(bad, null, 1, 'pl').error).toBe('Podaj nazwę ćwiczenia');
    expect(progressionRuleText('top_all_sets', 'en')).toBe('Top of range in all sets');
    expect(progressionRuleText('manual', 'pl')).toBe('Ręczna');
  });
});
