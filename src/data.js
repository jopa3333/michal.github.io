// Literal port of the legacy DEFAULT_PLAN and EXERCISE_DATABASE from index.html (commit 174af90).
// Tuple order: [name, sets, repsMin, repsMax, tempo, progressionStep, restSeconds]

const PLAN_TUPLES = {
  A: {
    name: 'TRENING A',
    exercises: [
      ['Przysiad z sztangą na plecach', 3, 3, 5, '2010', 2.5, 180],
      ['Wyciskanie hantli siedząc', 3, 6, 8, '2010', 2.5, 120],
      ['Ściąganie drążka do klatki', 3, 8, 12, '2010', 2.5, 90],
      ['Uginanie ramion z supinacją', 2, 8, 12, '2111', 1.0, 90],
      ['Wznosy w bok', 2, 8, 12, '2010', 1.0, 90],
      ['Łydka stojąc', 2, 8, 12, '2111', 2.5, 90],
      ['Wznosy nóg do klatki', 2, 8, 12, '1111', 0, 60],
    ],
  },
  B: {
    name: 'TRENING B',
    exercises: [
      ['Martwy ciąg na prostych nogach', 3, 6, 8, '2010', 2.5, 180],
      ['Leg press', 3, 8, 12, '2010', 5.0, 120],
      ['Wiosłowanie na hammerze', 3, 8, 12, '2010', 2.5, 90],
      ['Wyciskanie na hammerze', 3, 8, 12, '2010', 2.5, 90],
      ['Prostowanie ramion na wyciągu', 2, 8, 12, '2111', 1.25, 90],
      ['Wznosy w bok na wyciągu', 2, 8, 12, '2111', 1.0, 90],
      ['Allahy', 2, 8, 12, '2111', 2.5, 60],
    ],
  },
  C: {
    name: 'TRENING C',
    exercises: [
      ['Pompki na poręczach', 3, 5, 7, '2010', 2.5, 120],
      ['Ściąganie drążka do klatki', 3, 8, 12, '2010', 2.5, 90],
      ['Uginanie nóg', 3, 8, 12, '2010', 2.5, 90],
      ['Wyciskanie francuskie hantlami', 2, 8, 12, '2010', 1.0, 90],
      ['Uginanie ramion z oparciem o kolano', 2, 8, 12, '2111', 1.0, 90],
      ['Odwrotny butterfly', 2, 8, 12, '2111', 1.0, 90],
      ['Wznosy nóg do klatki', 2, 8, 12, '1111', 0, 60],
    ],
  },
};

export const DEFAULT_PLAN = Object.fromEntries(
  Object.entries(PLAN_TUPLES).map(([id, workout]) => [
    id,
    {
      id,
      name: workout.name,
      exercises: workout.exercises.map(([name, sets, repsMin, repsMax, tempo, progressionStep, restSeconds], index) => ({
        id: `ex_${id.toLowerCase()}_${index + 1}`,
        name,
        sets,
        repsMin,
        repsMax,
        tempo,
        progressionStep,
        restSeconds,
        progressionType: progressionStep === 0 ? 'manual' : 'top_all_sets',
      })),
    },
  ]),
);

const templateExercise = (id, name, sets, repsMin, repsMax, tempo = '2010', progressionStep = 2.5, restSeconds = 90) => ({
  id,
  name,
  sets,
  repsMin,
  repsMax,
  tempo,
  progressionStep,
  restSeconds,
  progressionType: progressionStep === 0 ? 'manual' : 'top_all_sets',
});

const templateWorkouts = days => Object.fromEntries(days.map(([id, name, exercises]) => [
  id,
  { id, name, exercises: exercises.map((exercise, index) => templateExercise(`${id.toLowerCase()}_${index + 1}`, ...exercise)) },
]));

// Library entries are data only. Creating one always clones its workouts into
// the user's saved plans, so later edits never change this library.
export const PLAN_TEMPLATES = [
  {
    id: 'fbw-3', version: 1, title: 'FBW — 3 dni', level: 'Początkujący', goal: 'Siła i masa', daysPerWeek: 3,
    description: 'Trening całego ciała trzy razy w tygodniu.',
    workouts: templateWorkouts([
      ['A', 'FBW A', [['Przysiad ze sztangą na plecach', 3, 6, 8, '2010', 2.5, 150], ['Wyciskanie sztangi leżąc na ławce poziomej', 3, 6, 8, '2010', 2.5, 150], ['Przyciąganie uchwytu wyciągu dolnego do brzucha', 3, 8, 12], ['Wznosy hantli bokiem stojąc', 2, 12, 15, '2011', 1, 60], ['Plank (deska klasyczna)', 3, 30, 45, '1111', 0, 60]]],
      ['B', 'FBW B', [['Martwy ciąg rumuński ze sztangą (RDL)', 3, 6, 8, '3010', 2.5, 150], ['Wyciskanie hantli siedząc', 3, 8, 10, '2010', 2, 120], ['Ściąganie drążka wyciągu górnego do klatki', 3, 8, 12], ['Wykroki chodzone z hantlami', 2, 10, 12, '2010', 2, 90], ['Allahy (spięcia brzucha klęcząc na wyciągu)', 3, 10, 15, '2011', 2.5, 60]]],
      ['C', 'FBW C', [['Suwnica na nogi (Leg Press)', 3, 10, 12, '2010', 5, 120], ['Wyciskanie hantli na ławce skośnej dodatniej', 3, 8, 12], ['Wiosłowanie hantlem jednorącz w oparciu o ławkę', 3, 8, 12], ['Prostowanie ramion na wyciągu ze sznurem', 2, 10, 15, '2011', 1.25, 60], ['Uginanie ramion z hantlami z supinacją', 2, 10, 15, '2011', 1, 60]]],
    ]),
  },
  {
    id: 'ppl-3', version: 1, title: 'Push / Pull / Legs — 3 dni', level: 'Średni', goal: 'Masa', daysPerWeek: 3,
    description: 'Klasyczny podział na ruchy wypychające, przyciągające i nogi.',
    workouts: templateWorkouts([
      ['A', 'PUSH', [['Wyciskanie sztangi leżąc na ławce poziomej', 4, 6, 10, '2010', 2.5, 150], ['Wyciskanie hantli na ławce skośnej dodatniej', 3, 8, 12], ['Wyciskanie hantli siedząc', 3, 8, 12], ['Wznosy hantli bokiem stojąc', 3, 12, 15, '2011', 1, 60], ['Prostowanie ramion na wyciągu ze sznurem', 3, 10, 15, '2011', 1.25, 60]]],
      ['B', 'PULL', [['Podciąganie na drążku nachwytem', 4, 6, 10, '2010', 1.25, 120], ['Wiosłowanie sztangą w opadzie tułowia', 3, 8, 10, '2010', 2.5, 120], ['Ściąganie uchwytu neutralnego wyciągu górnego', 3, 10, 12], ['Face Pull z linką wyciągu górnego', 3, 12, 15, '2011', 1.25, 60], ['Uginanie ramion z hantlami chwytem młotkowym', 3, 10, 15, '2011', 1, 60]]],
      ['C', 'LEGS', [['Przysiad ze sztangą na plecach', 4, 6, 10, '2010', 2.5, 150], ['Martwy ciąg rumuński ze sztangą (RDL)', 3, 8, 10, '3010', 2.5, 120], ['Suwnica na nogi (Leg Press)', 3, 10, 15, '2010', 5, 120], ['Uginanie nóg leżąc na maszynie', 3, 10, 15, '2011', 2.5, 75], ['Wspięcia na łydki stojąc', 4, 10, 15, '2111', 2.5, 60]]],
    ]),
  },
  {
    id: 'upper-lower-4', version: 1, title: 'Góra / Dół — 4 dni', level: 'Początkujący–średni', goal: 'Siła i masa', daysPerWeek: 4,
    description: 'Dwie sesje góry i dwie sesje dołu ciała.',
    workouts: templateWorkouts([
      ['A', 'GÓRA A', [['Wyciskanie sztangi leżąc na ławce poziomej', 3, 6, 8, '2010', 2.5, 150], ['Wiosłowanie sztangą w opadzie tułowia', 3, 6, 8, '2010', 2.5, 150], ['Wyciskanie hantli siedząc', 3, 8, 10, '2010', 2, 120], ['Ściąganie drążka wyciągu górnego do klatki', 3, 8, 12], ['Uginanie przedramion ze sztangą stojąc', 2, 10, 12, '2011', 1.25, 75], ['Prostowanie ramion na wyciągu ze sznurem', 2, 10, 12, '2011', 1.25, 75]]],
      ['B', 'DÓŁ A', [['Przysiad ze sztangą na plecach', 4, 5, 8, '2010', 2.5, 180], ['Martwy ciąg rumuński ze sztangą (RDL)', 3, 8, 10, '3010', 2.5, 120], ['Wykroki chodzone z hantlami', 3, 10, 12, '2010', 2, 90], ['Uginanie nóg leżąc na maszynie', 3, 10, 12, '2011', 2.5, 75], ['Wspięcia na łydki stojąc', 3, 12, 15, '2111', 2.5, 60]]],
      ['C', 'GÓRA B', [['Wyciskanie hantli na ławce skośnej dodatniej', 3, 8, 12], ['Podciąganie na drążku nachwytem', 3, 6, 10, '2010', 1.25, 120], ['Wyciskanie na maszynie Shoulder Press', 3, 8, 12], ['Przyciąganie uchwytu wyciągu dolnego do brzucha', 3, 8, 12], ['Wznosy hantli bokiem stojąc', 3, 12, 15, '2011', 1, 60], ['Wyciskanie francuskie hantla oburącz zza głowy', 2, 10, 12, '2011', 2, 75]]],
      ['D', 'DÓŁ B', [['Suwnica na nogi (Leg Press)', 4, 8, 12, '2010', 5, 150], ['Hip Thrust ze sztangą na biodrach', 3, 8, 12, '2011', 5, 120], ['Przysiad bułgarski z hantlami', 3, 8, 12, '2010', 2, 90], ['Prostowanie nóg na maszynie', 2, 12, 15, '2011', 2.5, 60], ['Allahy (spięcia brzucha klęcząc na wyciągu)', 3, 10, 15, '2011', 2.5, 60]]],
    ]),
  },
  {
    id: 'upper-lower-hypertrophy-4', version: 1, title: 'Góra / Dół — hipertrofia', level: 'Średni', goal: 'Masa', daysPerWeek: 4,
    description: 'Większa objętość dla rozbudowy mięśni.',
    workouts: templateWorkouts([
      ['A', 'GÓRA PUSH', [['Wyciskanie hantli na ławce skośnej dodatniej', 4, 8, 12], ['Wyciskanie na maszynie Chest Press', 3, 10, 12], ['Wyciskanie hantli siedząc', 3, 8, 12], ['Wznosy hantli bokiem stojąc', 4, 12, 20, '2011', 1, 60], ['Prostowanie ramion na wyciągu ze sznurem', 3, 12, 15, '2011', 1.25, 60]]],
      ['B', 'DÓŁ QUAD', [['Hack Przysiad (maszyna)', 4, 8, 12, '2010', 2.5, 120], ['Suwnica na nogi (Leg Press)', 3, 12, 15, '2010', 5, 120], ['Prostowanie nóg na maszynie', 3, 12, 15, '2011', 2.5, 60], ['Wykroki chodzone z hantlami', 3, 10, 12, '2010', 2, 90], ['Wspięcia na łydki siedząc', 4, 12, 20, '2111', 2.5, 60]]],
      ['C', 'GÓRA PULL', [['Ściąganie drążka wyciągu górnego do klatki', 4, 8, 12], ['Wiosłowanie na maszynie T-Bar', 3, 8, 12], ['Przyciąganie uchwytu wyciągu dolnego do brzucha', 3, 10, 12], ['Odwrotny butterfly na maszynie (tył barku)', 3, 12, 15, '2011', 2.5, 60], ['Uginanie ramion z hantlami z supinacją', 3, 10, 15, '2011', 1, 60]]],
      ['D', 'DÓŁ TYŁ', [['Martwy ciąg rumuński ze sztangą (RDL)', 4, 8, 10, '3010', 2.5, 150], ['Hip Thrust ze sztangą na biodrach', 4, 8, 12, '2011', 5, 120], ['Uginanie nóg siedząc na maszynie', 3, 10, 15, '2011', 2.5, 75], ['Odwodzenie nóg na maszynie', 3, 12, 20, '2011', 2.5, 60], ['Wznosy nóg w zwisie na drążku', 3, 8, 12, '2010', 0, 60]]],
    ]),
  },
  {
    id: 'ppl-upper-lower-5', version: 1, title: 'PPL + Góra / Dół — 5 dni', level: 'Średni', goal: 'Masa', daysPerWeek: 5,
    description: 'Pięć dni dla osób, które dobrze regenerują się na siłowni.',
    workouts: templateWorkouts([
      ['A', 'PUSH', [['Wyciskanie sztangi leżąc na ławce poziomej', 4, 6, 10, '2010', 2.5, 150], ['Wyciskanie hantli na ławce skośnej dodatniej', 3, 8, 12], ['Wyciskanie hantli siedząc', 3, 8, 12], ['Wznosy hantli bokiem stojąc', 3, 12, 15, '2011', 1, 60], ['Prostowanie ramion na wyciągu ze sznurem', 3, 10, 15, '2011', 1.25, 60]]],
      ['B', 'PULL', [['Podciąganie na drążku nachwytem', 4, 6, 10, '2010', 1.25, 120], ['Wiosłowanie sztangą w opadzie tułowia', 3, 8, 10, '2010', 2.5, 120], ['Ściąganie uchwytu neutralnego wyciągu górnego', 3, 10, 12], ['Face Pull z linką wyciągu górnego', 3, 12, 15, '2011', 1.25, 60], ['Uginanie ramion z hantlami chwytem młotkowym', 3, 10, 15, '2011', 1, 60]]],
      ['C', 'LEGS', [['Przysiad ze sztangą na plecach', 4, 6, 10, '2010', 2.5, 150], ['Martwy ciąg rumuński ze sztangą (RDL)', 3, 8, 10, '3010', 2.5, 120], ['Suwnica na nogi (Leg Press)', 3, 10, 15, '2010', 5, 120], ['Uginanie nóg leżąc na maszynie', 3, 10, 15, '2011', 2.5, 75]]],
      ['D', 'GÓRA', [['Wyciskanie hantli na ławce poziomej', 3, 8, 12], ['Przyciąganie uchwytu wyciągu dolnego do brzucha', 3, 8, 12], ['Wyciskanie na maszynie Shoulder Press', 3, 8, 12], ['Ściąganie drążka wyciągu górnego do klatki', 3, 8, 12], ['Uginanie przedramion ze sztangą stojąc', 2, 10, 12, '2011', 1.25, 75], ['Wyciskanie francuskie hantla oburącz zza głowy', 2, 10, 12, '2011', 2, 75]]],
      ['E', 'DÓŁ', [['Hack Przysiad (maszyna)', 3, 8, 12, '2010', 2.5, 120], ['Hip Thrust ze sztangą na biodrach', 3, 8, 12, '2011', 5, 120], ['Przysiad bułgarski z hantlami', 3, 8, 12, '2010', 2, 90], ['Wspięcia na łydki stojąc', 4, 12, 15, '2111', 2.5, 60], ['Allahy (spięcia brzucha klęcząc na wyciągu)', 3, 10, 15, '2011', 2.5, 60]]],
    ]),
  },
  {
    id: 'body-part-5', version: 1, title: 'Split partii mięśniowych — 5 dni', level: 'Średni', goal: 'Masa', daysPerWeek: 5,
    description: 'Większa objętość dla konkretnej partii na każdej sesji.',
    workouts: templateWorkouts([
      ['A', 'KLATKA + TRICEPS', [['Wyciskanie sztangi leżąc na ławce poziomej', 4, 6, 10, '2010', 2.5, 150], ['Wyciskanie hantli na ławce skośnej dodatniej', 3, 8, 12], ['Rozpiętki na bramie z linkami wyciągu', 3, 12, 15, '2011', 1.25, 60], ['Prostowanie ramion na wyciągu ze sznurem', 3, 10, 15, '2011', 1.25, 60], ['Wyciskanie francuskie ze sztangą łamaną leżąc', 3, 8, 12]]],
      ['B', 'PLECY + BICEPS', [['Podciąganie na drążku nachwytem', 4, 6, 10, '2010', 1.25, 120], ['Wiosłowanie sztangą w opadzie tułowia', 4, 8, 10, '2010', 2.5, 120], ['Przyciąganie uchwytu wyciągu dolnego do brzucha', 3, 10, 12], ['Uginanie przedramion ze sztangą stojąc', 3, 8, 12], ['Uginanie ramion z hantlami chwytem młotkowym', 3, 10, 15, '2011', 1, 60]]],
      ['C', 'NOGI', [['Przysiad ze sztangą na plecach', 4, 6, 10, '2010', 2.5, 150], ['Martwy ciąg rumuński ze sztangą (RDL)', 4, 8, 10, '3010', 2.5, 120], ['Suwnica na nogi (Leg Press)', 3, 10, 15, '2010', 5, 120], ['Uginanie nóg leżąc na maszynie', 3, 10, 15, '2011', 2.5, 75], ['Wspięcia na łydki stojąc', 4, 12, 15, '2111', 2.5, 60]]],
      ['D', 'BARKI + BRZUCH', [['Wyciskanie żołnierskie stojąc ze sztangą (OHP)', 4, 6, 10, '2010', 1.25, 150], ['Wznosy hantli bokiem stojąc', 4, 12, 20, '2011', 1, 60], ['Odwrotny butterfly na maszynie (tył barku)', 3, 12, 15, '2011', 2.5, 60], ['Allahy (spięcia brzucha klęcząc na wyciągu)', 3, 10, 15, '2011', 2.5, 60], ['Wznosy nóg w zwisie na drążku', 3, 8, 12, '2010', 0, 60]]],
      ['E', 'GÓRA UZUPEŁNIAJĄCA', [['Wyciskanie na maszynie Chest Press', 3, 10, 12], ['Ściąganie drążka wyciągu górnego do klatki', 3, 10, 12], ['Wznosy bokiem na wyciągu jednorącz', 3, 12, 15, '2011', 1.25, 60], ['Face Pull z linką wyciągu górnego', 3, 12, 15, '2011', 1.25, 60], ['Uginanie ramion na wyciągu dolnym', 2, 12, 15, '2011', 1.25, 60], ['Prostowanie ramion na wyciągu z drążkiem prostym', 2, 12, 15, '2011', 1.25, 60]]],
    ]),
  },
];

// Tuple order: [name, category, rest, tempo, step]
const DATABASE_TUPLES = [
  ['Przysiad ze sztangą na plecach', 'Nogi i Pośladki', 180, '2010', 2.5],
  ['Przysiad ze sztangą z przodu (Front Squat)', 'Nogi i Pośladki', 150, '2010', 2.5],
  ['Hack Przysiad (maszyna)', 'Nogi i Pośladki', 120, '2010', 2.5],
  ['Suwnica na nogi (Leg Press)', 'Nogi i Pośladki', 120, '2010', 5.0],
  ['Wykroki chodzone z hantlami', 'Nogi i Pośladki', 90, '2010', 2.0],
  ['Przysiad bułgarski z hantlami', 'Nogi i Pośladki', 90, '2010', 2.0],
  ['Martwy ciąg rumuński ze sztangą (RDL)', 'Nogi i Pośladki', 120, '3010', 2.5],
  ['Martwy ciąg rumuński z hantlami', 'Nogi i Pośladki', 90, '3010', 2.0],
  ['Uginanie nóg leżąc na maszynie', 'Nogi i Pośladki', 75, '2011', 2.5],
  ['Uginanie nóg siedząc na maszynie', 'Nogi i Pośladki', 75, '2011', 2.5],
  ['Prostowanie nóg na maszynie', 'Nogi i Pośladki', 75, '2011', 2.5],
  ['Hip Thrust ze sztangą na biodrach', 'Nogi i Pośladki', 120, '2011', 5.0],
  ['Odwodzenie nóg na maszynie', 'Nogi i Pośladki', 60, '2011', 2.5],
  ['Wspięcia na łydki stojąc', 'Nogi i Pośladki', 60, '2111', 2.5],
  ['Wspięcia na łydki siedząc', 'Nogi i Pośladki', 60, '2111', 2.5],

  ['Wyciskanie sztangi leżąc na ławce poziomej', 'Klatka Piersiowa', 150, '2010', 2.5],
  ['Wyciskanie hantli na ławce skośnej dodatniej', 'Klatka Piersiowa', 120, '2010', 2.0],
  ['Wyciskanie hantli na ławce poziomej', 'Klatka Piersiowa', 120, '2010', 2.0],
  ['Wyciskanie sztangi na ławce skośnej dodatniej', 'Klatka Piersiowa', 120, '2010', 2.5],
  ['Pompki na poręczach (Dipsy na klatkę)', 'Klatka Piersiowa', 120, '2010', 1.25],
  ['Rozpiętki z hantlami na ławce poziomej', 'Klatka Piersiowa', 90, '2010', 1.0],
  ['Rozpiętki na bramie z linkami wyciągu', 'Klatka Piersiowa', 75, '2011', 1.25],
  ['Butterfly (maszyna rozpiętki)', 'Klatka Piersiowa', 75, '2011', 2.5],
  ['Wyciskanie na maszynie Chest Press', 'Klatka Piersiowa', 90, '2010', 2.5],
  ['Pompki klasyczne', 'Klatka Piersiowa', 60, '2010', 0.0],

  ['Martwy ciąg klasyczny ze sztangą', 'Plecy', 180, '2010', 5.0],
  ['Martwy ciąg Sumo ze sztangą', 'Plecy', 180, '2010', 5.0],
  ['Podciąganie na drążku nachwytem', 'Plecy', 120, '2010', 1.25],
  ['Podciąganie na drążku podchwytem', 'Plecy', 120, '2010', 1.25],
  ['Ściąganie drążka wyciągu górnego do klatki', 'Plecy', 90, '2010', 2.5],
  ['Ściąganie uchwytu neutralnego wyciągu górnego', 'Plecy', 90, '2010', 2.5],
  ['Wiosłowanie sztangą w opadzie tułowia', 'Plecy', 120, '2010', 2.5],
  ['Wiosłowanie hantlem jednorącz w oparciu o ławkę', 'Plecy', 90, '2010', 2.0],
  ['Przyciąganie uchwytu wyciągu dolnego do brzucha', 'Plecy', 90, '2011', 2.5],
  ['Wiosłowanie na maszynie T-Bar', 'Plecy', 90, '2010', 2.5],
  ['Narciarz (ściąganie drążka prostymi ramionami)', 'Plecy', 75, '2011', 1.25],
  ['Szrugsy z hantlami / sztangą (kaptury)', 'Plecy', 75, '2111', 2.5],

  ['Wyciskanie żołnierskie stojąc ze sztangą (OHP)', 'Barki', 150, '2010', 1.25],
  ['Wyciskanie hantli siedząc', 'Barki', 120, '2010', 2.0],
  ['Wznosy hantli bokiem stojąc', 'Barki', 75, '2011', 1.0],
  ['Wznosy bokiem na wyciągu jednorącz', 'Barki', 60, '2011', 1.25],
  ['Odwrotny butterfly na maszynie (tył barku)', 'Barki', 75, '2011', 2.5],
  ['Face Pull z linką wyciągu górnego', 'Barki', 75, '2011', 1.25],
  ['Wznosy hantli w opadzie tułowia', 'Barki', 60, '2011', 1.0],
  ['Wyciskanie na maszynie Shoulder Press', 'Barki', 90, '2010', 2.5],

  ['Uginanie przedramion ze sztangą stojąc', 'Ramiona (Biceps & Triceps)', 90, '2010', 1.25],
  ['Uginanie ramion z hantlami z supinacją', 'Ramiona (Biceps & Triceps)', 75, '2010', 1.0],
  ['Uginanie ramion z hantlami chwytem młotkowym', 'Ramiona (Biceps & Triceps)', 75, '2010', 1.0],
  ['Uginanie na modlitewniku ze sztangą łamaną', 'Ramiona (Biceps & Triceps)', 75, '2010', 1.25],
  ['Uginanie ramion na wyciągu dolnym', 'Ramiona (Biceps & Triceps)', 60, '2011', 1.25],
  ['Wyciskanie francuskie ze sztangą łamaną leżąc', 'Ramiona (Biceps & Triceps)', 90, '2010', 1.25],
  ['Wyciskanie francuskie hantla oburącz zza głowy', 'Ramiona (Biceps & Triceps)', 75, '2010', 2.0],
  ['Prostowanie ramion na wyciągu ze sznurem', 'Ramiona (Biceps & Triceps)', 60, '2011', 1.25],
  ['Prostowanie ramion na wyciągu z drążkiem prostym', 'Ramiona (Biceps & Triceps)', 60, '2011', 1.25],
  ['Pompki na poręczach (Dipsy na triceps)', 'Ramiona (Biceps & Triceps)', 90, '2010', 1.25],
  ['Wyciskanie sztangi leżąc wąskim chwytem', 'Ramiona (Biceps & Triceps)', 120, '2010', 2.5],

  ['Allahy (spięcia brzucha klęcząc na wyciągu)', 'Brzuch & Core', 60, '2011', 2.5],
  ['Wznosy nóg w zwisie na drążku', 'Brzuch & Core', 60, '2010', 0.0],
  ['Wznosy nóg na poręczach stacyjnych', 'Brzuch & Core', 60, '2010', 0.0],
  ['Kółko do brzucha (Ab Wheel Rollout)', 'Brzuch & Core', 60, '2010', 0.0],
  ['Plank (deska klasyczna)', 'Brzuch & Core', 60, '1111', 0.0],
  ['Spięcia brzucha na ławce skośnej', 'Brzuch & Core', 60, '2010', 0.0],
];

export const EXERCISE_DATABASE = DATABASE_TUPLES.map(([name, category, rest, tempo, step]) => ({ name, category, rest, tempo, step }));

export const EXERCISE_CATEGORIES = EXERCISE_DATABASE.reduce((groups, item) => {
  const group = groups.find(([category]) => category === item.category);
  if (group) group[1].push(item);
  else groups.push([item.category, [item]]);
  return groups;
}, []);
