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
      ['Wznosy nóg do klatki', 2, 10, 'MAX', '1111', 0, 60],
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
      ['Wznosy nóg do klatki', 2, 10, 'MAX', '1111', 0, 60],
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
