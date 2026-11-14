// Pure logic ported from the legacy index.html script. No DOM, no React, no storage access here,
// so it can be unit-tested directly.

export const WORKOUT_IDS = ['A', 'B', 'C'];
export const DEFAULT_PLAN_NAME = 'Mój Plan Główny (A/B/C)';

const BODYWEIGHT_NAMES = new Set([
  'wznosy nóg do klatki', 'wznosy nóg w zwisie na drążku', 'wznosy nóg na poręczach stacyjnych',
  'pompki klasyczne', 'plank (deska klasyczna)', 'plank',
  'kółko do brzucha (ab wheel rollout)', 'spięcia brzucha na ławce skośnej',
]);
export function isBodyweightExercise(ex) {
  return BODYWEIGHT_NAMES.has(String(ex.name || '').trim().toLocaleLowerCase('pl'));
}
export function isTimedExercise(ex) {
  return ['plank', 'plank (deska klasyczna)'].includes(String(ex.name || '').trim().toLocaleLowerCase('pl'));
}
export function formatRecordedSet(set, exercise) {
  const timed = set.measurement === 'seconds';
  const unit = timed ? 's' : 'powt.';
  const weighted = set.hasWeight ?? (!isBodyweightExercise(exercise) || Number(set.weight) > 0);
  return weighted ? `${formatWeightDisplay(set.weight)} kg × ${set.reps}${timed ? ' s' : ''}` : `${set.reps} ${unit}`;
}

export const clone = value => JSON.parse(JSON.stringify(value));

// Older backups only contain the A/B/C object. New plans use the same object
// shape, but may have from three to five workout ids.
export function workoutIds(plan, preferredOrder) {
  const available = Object.keys(plan || {}).filter(id => plan[id] && Array.isArray(plan[id].exercises));
  if (!Array.isArray(preferredOrder)) return available;
  const ordered = preferredOrder.filter(id => available.includes(id));
  return [...ordered, ...available.filter(id => !ordered.includes(id))];
}

export function formatWeightDisplay(num) {
  if (num === null || num === undefined || isNaN(num)) return '0';
  return String(num).replace('.', ',');
}

export function parseWeightInput(str) {
  if (!str) return 0;
  const clean = String(str).replace(',', '.').trim();
  const val = parseFloat(clean);
  return isNaN(val) ? 0 : val;
}

export function formatTime(seconds) {
  const m = Math.floor(seconds / 60);
  const s = seconds % 60;
  return `${m}:${s < 10 ? '0' : ''}${s}`;
}

function isLegacyLegRaiseRange(ex) {
  const name = String(ex.name || '').trim().toLocaleLowerCase('pl');
  return (name === 'wznosy nóg do klatki' || name === 'wznosy nóg w zwisie na drążku')
    && Number(ex.repsMin) === 10 && ex.repsMax === 'MAX';
}

export function repsDisplay(ex) {
  if (isLegacyLegRaiseRange(ex)) return '8–12';
  return ex.repsMax === 'MAX' ? `${ex.repsMin}+ MAX` : `${ex.repsMin}–${ex.repsMax}`;
}

// Rep buttons shown on the workout screen.
export function repButtonValues(ex) {
  const min = typeof ex.repsMin === 'number' ? ex.repsMin : parseInt(ex.repsMin, 10);
  const max = typeof ex.repsMax === 'number' ? ex.repsMax : parseInt(ex.repsMax, 10);
  const isMaxTag = ex.repsMax === 'MAX' || isNaN(max);
  if (isLegacyLegRaiseRange(ex)) return [8, 9, 10, 11, 12];
  if (isMaxTag) return ['MAX'];
  if (!isNaN(min) && !isNaN(max)) {
    const values = [];
    if (min <= max && max - min <= 7) {
      for (let r = min; r <= max; r++) values.push(r);
    } else {
      for (let r = min; r <= max; r += 2) values.push(r);
    }
    return values;
  }
  return [6, 8, 10, 12];
}

export function getLastExerciseResult(history, exerciseName) {
  if (!history || history.length === 0) return null;
  const wanted = exerciseName.trim().toLowerCase();
  for (const session of history) {
    if (!session.exercises) continue;
    const match = session.exercises.find(e => e.name && e.name.trim().toLowerCase() === wanted);
    if (match && match.sets && match.sets.length > 0) {
      return {
        sessionDate: session.date,
        sessionWeek: session.week,
        sets: match.sets,
        targetSets: match.targetSets || match.sets.length,
      };
    }
  }
  return null;
}

export function calculateProgression(history, def) {
  const last = getLastExerciseResult(history, def.name);
  if (!last) {
    return {
      hasHistory: false,
      suggestedWeight: 0,
      isProgression: false,
      progressionBadgeText: '',
      lastSummaryText: 'BRAK POPRZEDNIEGO WYNIKU',
      lastDateText: '',
    };
  }

  const sets = last.sets;
  const lastWeight = sets[0].weight || 0;
  const allSameWeight = sets.every(s => s.weight === lastWeight);
  const lastSummaryText = isBodyweightExercise(def)
    ? sets.map(s => formatRecordedSet(s, def)).join(' / ')
    : allSameWeight
      ? `${formatWeightDisplay(lastWeight)} kg • ${sets.map(s => s.reps).join(' / ')}`
      : sets.map(s => `${formatWeightDisplay(s.weight)}kg × ${s.reps}`).join(' / ');

  const dateObj = new Date(last.sessionDate);
  const lastDateText = !isNaN(dateObj)
    ? `${dateObj.toLocaleDateString('pl-PL')} (Tydz. ${last.sessionWeek})`
    : `Tydzień ${last.sessionWeek}`;

  const asNumber = value => (typeof value === 'number' ? value : parseInt(value, 10));
  const maxReps = asNumber(def.repsMax);
  let shouldProgress = false;

  if (def.progressionType === 'top_all_sets') {
    if (!isNaN(maxReps) && maxReps > 0) {
      const completedEnoughSets = sets.length >= def.sets;
      const allAtMax = sets.every(s => {
        const r = asNumber(s.reps);
        return !isNaN(r) && r >= maxReps;
      });
      if (completedEnoughSets && allAtMax) shouldProgress = true;
    }
  } else if (def.progressionType === 'top_first_set') {
    if (!isNaN(maxReps) && maxReps > 0 && sets[0]) {
      const r0 = asNumber(sets[0].reps);
      if (!isNaN(r0) && r0 >= maxReps) shouldProgress = true;
    }
  }

  if (isTimedExercise(def)) shouldProgress = false;
  const step = def.progressionStep || 0;
  let suggestedWeight = lastWeight;
  if (shouldProgress && step > 0) suggestedWeight = Number((lastWeight + step).toFixed(2));

  return {
    hasHistory: true,
    lastWeight,
    suggestedWeight,
    isProgression: shouldProgress,
    progressionBadgeText: shouldProgress ? `PROGRES +${formatWeightDisplay(step)} kg` : '',
    lastSummaryText,
    lastDateText,
  };
}

// Exercises for a new workout session, with suggested weights from history.
export function createSessionExercises(workout, history) {
  return workout.exercises.map(def => {
    const prog = calculateProgression(history, def);
    return {
      id: def.id,
      name: def.name,
      setsTarget: def.sets,
      repsMin: def.repsMin,
      repsMax: def.repsMax,
      tempo: def.tempo,
      restSeconds: def.restSeconds,
      progressionStep: def.progressionStep,
      progressionType: def.progressionType,
      currentWeight: prog.hasHistory ? prog.suggestedWeight : 0,
      suggestedWeight: prog.suggestedWeight ? prog.suggestedWeight : 0,
      isProgressionHit: prog.isProgression,
      ...(isBodyweightExercise(def) ? { weightEnabled: Number(def.progressionStep) > 0 || Number(prog.lastWeight) > 0 } : {}),
      lastSummary: prog.lastSummaryText,
      lastDate: prog.lastDateText,
      completedSets: [],
    };
  });
}

function belongsToActivePlan(session, settings) {
  if (!settings?.activePlanId) return true;
  return session.planId ? session.planId === settings.activePlanId : settings.activePlanId === settings.legacyProgressPlanId;
}

export function remainingWorkoutsThisWeek(history, week, plan, settings) {
  const w = Number(week || 1);
  const done = new Set((history || []).filter(s => Number(s.week) === w && belongsToActivePlan(s, settings)).map(s => (s.workoutId || '').toUpperCase()));
  const ids = workoutIds(plan).length > 0 ? workoutIds(plan) : WORKOUT_IDS;
  return ids.filter(id => !done.has(id.toUpperCase()));
}

// Advances the week when every workout of the current week is done.
export function applyWeekProgress(history, settings, plan) {
  const startWeek = Number(settings.currentWeek) || 1;
  const ids = workoutIds(plan).length > 0 ? workoutIds(plan) : WORKOUT_IDS;
  let cur = startWeek;
  let changed = false;
  for (;;) {
    const sessions = history.filter(s => Number(s.week) === cur && belongsToActivePlan(s, settings));
    const done = new Set(sessions.map(s => (s.workoutId || '').toUpperCase()));
    if (!ids.every(id => done.has(id.toUpperCase()))) break;
    cur += 1;
    changed = true;
  }
  if (!changed) return { advanced: false, settings, weekProg: { advanced: false, currentWeek: startWeek } };
  const remaining = remainingWorkoutsThisWeek(history, cur, plan, settings);
  return {
    advanced: true,
    settings: { ...settings, currentWeek: cur, selectedStartWorkoutId: remaining.length > 0 ? remaining[0] : ids[0] },
    weekProg: { advanced: true, newWeek: cur, previousWeek: startWeek },
  };
}

export function nextWorkoutAfter(workoutId, plan) {
  const ids = workoutIds(plan).length > 0 ? workoutIds(plan) : WORKOUT_IDS;
  const index = ids.indexOf(workoutId);
  return ids[(index + 1 + ids.length) % ids.length];
}

// `history` must already contain the finished session.
export function settingsAfterFinish(history, settings, workoutId, plan) {
  const progress = applyWeekProgress(history, settings, plan);
  if (progress.advanced) return { settings: progress.settings, weekProg: progress.weekProg };
  const remaining = remainingWorkoutsThisWeek(history, settings.currentWeek, plan, settings);
  const selected = remaining.length > 0 ? remaining[0] : nextWorkoutAfter(workoutId, plan);
  return { settings: { ...settings, selectedStartWorkoutId: selected }, weekProg: progress.weekProg };
}

export function buildSessionRecord(session, date) {
  let totalSets = 0;
  let totalVolume = 0;
  const exercises = session.exercises.map(ex => {
    const sets = (ex.completedSets || []).map(s => {
      totalSets++;
      const repsNum = typeof s.reps === 'number' ? s.reps : parseInt(s.reps, 10);
      if (!isNaN(repsNum) && s.measurement !== 'seconds') totalVolume += s.weight * repsNum;
      return { weight: s.weight, reps: s.reps, ...(s.hasWeight !== undefined ? { hasWeight: s.hasWeight } : {}), ...(s.measurement ? { measurement: s.measurement } : {}) };
    });
    return { id: ex.id, name: ex.name, targetSets: ex.setsTarget, tempo: ex.tempo, sets };
  });
  const volume = Math.round(totalVolume);
  return {
    totalSets,
    volume,
    record: {
      sessionId: session.sessionId,
      ...(session.planId ? { planId: session.planId } : {}),
      workoutId: session.workoutId,
      workoutName: session.workoutName,
      week: session.week,
      date,
      totalSets,
      totalVolume: volume,
      exercises,
    },
  };
}

export function matchesWorkout(session, workout) {
  if (workout === 'all') return true;
  if (session.workoutId) return String(session.workoutId).toUpperCase() === String(workout).toUpperCase();
  const legacyId = /^TRENING\s+([A-Z])$/i.exec(String(session.workoutName || '').trim())?.[1];
  return Boolean(legacyId && legacyId.toUpperCase() === String(workout).toUpperCase());
}

export function filterHistory(history, workout, week) {
  return history.filter(s => matchesWorkout(s, workout) && (week === 'all' || String(s.week) === String(week)));
}

export function weekOptions(history, workout) {
  const base = history.filter(s => matchesWorkout(s, workout));
  return [...new Set(base.map(s => s.week).filter(w => w != null))].sort((a, b) => a - b);
}

export function exerciseNames(history, plan) {
  const names = new Set();
  history.forEach(s => (s.exercises || []).forEach(e => names.add(e.name)));
  Object.values(plan).forEach(workout => workout.exercises.forEach(e => names.add(e.name)));
  return [...names].sort();
}

export function exerciseEntries(sessions, exerciseName) {
  const wanted = exerciseName.trim().toLowerCase();
  const entries = [];
  sessions.forEach(sess => {
    if (!sess.exercises) return;
    const found = sess.exercises.find(e => e.name && e.name.trim().toLowerCase() === wanted);
    if (found && found.sets && found.sets.length > 0) {
      entries.push({ date: sess.date, week: sess.week, workoutName: sess.workoutName, sets: found.sets });
    }
  });
  return entries;
}

export function emptyPlan(days = 3) {
  return Object.fromEntries(Array.from({ length: Math.max(3, Math.min(5, Number(days) || 3)) }, (_, index) => {
    const id = String.fromCharCode(65 + index);
    return [id, { id, name: `TRENING ${id}`, exercises: [] }];
  }));
}

export function planCounts(workouts, order) {
  return workoutIds(workouts, order).map(id => workouts[id].exercises.length);
}

export function progressionRuleText(type) {
  if (type === 'top_all_sets') return 'Górny zakres we wszystkich seriach';
  if (type === 'top_first_set') return 'Górny zakres w 1. serii';
  return 'Ręczna';
}

// Writes the current plan into the saved-plan entry it came from (the legacy "autoSaveCurrentPlan").
export function upsertCurrentPlan(savedPlans, settings, plan, now) {
  const currentId = settings.activePlanId || 'plan_default';
  if (savedPlans.some(p => p.id === currentId)) {
    return savedPlans.map(p => (p.id === currentId ? { ...p, workouts: clone(plan), updatedAt: now } : p));
  }
  return [
    ...savedPlans,
    {
      id: currentId,
      name: settings.activePlanName || DEFAULT_PLAN_NAME,
      createdAt: now,
      updatedAt: now,
      workouts: clone(plan),
      workoutOrder: workoutIds(plan),
      source: { type: 'custom' },
    },
  ];
}

// Validates the exercise form exactly like the legacy saveExerciseModal().
export function exerciseFromForm(form, existingId, nowMs) {
  const name = form.name.trim();
  const sets = parseInt(form.sets, 10);
  const repsMin = parseInt(form.repsMin, 10);
  const repsMaxInput = form.repsMax.trim();
  const repsMax = repsMaxInput.toUpperCase() === 'MAX' ? 'MAX' : parseInt(repsMaxInput, 10);
  const tempo = form.tempo.trim();
  const step = parseWeightInput(form.step);
  const rest = parseInt(form.rest, 10);

  if (!name) return { error: 'Podaj nazwę ćwiczenia' };
  if (isNaN(sets) || sets < 1) return { error: 'Podaj prawidłową liczbę serii' };

  return {
    exercise: {
      id: existingId || `ex_${nowMs}`,
      name,
      sets,
      repsMin: isNaN(repsMin) ? 8 : repsMin,
      repsMax,
      tempo: tempo || '2010',
      progressionStep: isNaN(step) ? 2.5 : step,
      restSeconds: isNaN(rest) ? 90 : rest,
      progressionType: form.progressionType,
    },
  };
}

export function clampWeight(value) {
  return value < 0 ? 0 : value;
}
