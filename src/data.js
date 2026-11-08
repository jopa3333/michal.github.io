export const DEFAULT_PLAN = {
  A: { id: 'A', name: 'TRENING A', exercises: [
    ['Przysiad z sztangą na plecach', 3, 3, 5, '2010', 2.5, 180], ['Wyciskanie hantli siedząc', 3, 6, 8, '2010', 2.5, 120], ['Ściąganie drążka do klatki', 3, 8, 12, '2010', 2.5, 90], ['Uginanie ramion z supinacją', 2, 8, 12, '2111', 1, 90], ['Wznosy w bok', 2, 8, 12, '2010', 1, 90], ['Łydka stojąc', 2, 8, 12, '2111', 2.5, 90], ['Wznosy nóg do klatki', 2, 10, 'MAX', '1111', 0, 60]
  ] },
  B: { id: 'B', name: 'TRENING B', exercises: [
    ['Martwy ciąg na prostych nogach', 3, 6, 8, '2010', 2.5, 180], ['Leg press', 3, 8, 12, '2010', 5, 120], ['Wiosłowanie na hammerze', 3, 8, 12, '2010', 2.5, 90], ['Wyciskanie na hammerze', 3, 8, 12, '2010', 2.5, 90], ['Prostowanie ramion na wyciągu', 2, 8, 12, '2111', 1.25, 90], ['Wznosy w bok na wyciągu', 2, 8, 12, '2111', 1, 90], ['Allahy', 2, 8, 12, '2111', 2.5, 60]
  ] },
  C: { id: 'C', name: 'TRENING C', exercises: [
    ['Pompki na poręczach', 3, 5, 7, '2010', 2.5, 120], ['Ściąganie drążka do klatki', 3, 8, 12, '2010', 2.5, 90], ['Uginanie nóg', 3, 8, 12, '2010', 2.5, 90], ['Wyciskanie francuskie hantlami', 2, 8, 12, '2010', 1, 90], ['Uginanie ramion z oparciem o kolano', 2, 8, 12, '2111', 1, 90], ['Odwrotny butterfly', 2, 8, 12, '2111', 1, 90], ['Wznosy nóg do klatki', 2, 10, 'MAX', '1111', 0, 60]
  ] }
};

for (const workout of Object.values(DEFAULT_PLAN)) {
  workout.exercises = workout.exercises.map(([name, sets, repsMin, repsMax, tempo, progressionStep, restSeconds], index) => ({
    id: `${workout.id}-${index + 1}`, name, sets, repsMin, repsMax, tempo, progressionStep, restSeconds,
    progressionType: progressionStep ? 'top_all_sets' : 'manual'
  }));
}

export const EXERCISE_NAMES = [...new Set(Object.values(DEFAULT_PLAN).flatMap(workout => workout.exercises.map(exercise => exercise.name)))];
