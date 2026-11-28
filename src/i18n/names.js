// Display-only translations of canonical (Polish) data names.
// Stored data always keeps the canonical Polish name; these maps translate it
// for display and map English names back to the canonical one on input.

export const EXERCISE_NAMES_EN = {
  // Legs & glutes
  'Przysiad ze sztangą na plecach': 'Barbell Back Squat',
  'Przysiad z sztangą na plecach': 'Barbell Back Squat',
  'Przysiad ze sztangą z przodu (Front Squat)': 'Barbell Front Squat',
  'Hack Przysiad (maszyna)': 'Hack Squat (machine)',
  'Suwnica na nogi (Leg Press)': 'Leg Press',
  'Leg press': 'Leg Press',
  'Wykroki chodzone z hantlami': 'Dumbbell Walking Lunges',
  'Przysiad bułgarski z hantlami': 'Bulgarian Split Squat (dumbbells)',
  'Martwy ciąg rumuński ze sztangą (RDL)': 'Barbell Romanian Deadlift (RDL)',
  'Martwy ciąg rumuński z hantlami': 'Dumbbell Romanian Deadlift',
  'Uginanie nóg leżąc na maszynie': 'Lying Leg Curl (machine)',
  'Uginanie nóg siedząc na maszynie': 'Seated Leg Curl (machine)',
  'Uginanie nóg': 'Leg Curl',
  'Prostowanie nóg na maszynie': 'Leg Extension (machine)',
  'Hip Thrust ze sztangą na biodrach': 'Barbell Hip Thrust',
  'Odwodzenie nóg na maszynie': 'Hip Abduction (machine)',
  'Wspięcia na łydki stojąc': 'Standing Calf Raise',
  'Wspięcia na łydki siedząc': 'Seated Calf Raise',
  'Łydka stojąc': 'Standing Calf Raise',
  // Chest
  'Wyciskanie sztangi leżąc na ławce poziomej': 'Barbell Bench Press (flat)',
  'Wyciskanie hantli na ławce skośnej dodatniej': 'Incline Dumbbell Press',
  'Wyciskanie hantli na ławce poziomej': 'Flat Dumbbell Press',
  'Wyciskanie sztangi na ławce skośnej dodatniej': 'Incline Barbell Bench Press',
  'Pompki na poręczach (Dipsy na klatkę)': 'Chest Dips',
  'Pompki na poręczach': 'Dips',
  'Rozpiętki z hantlami na ławce poziomej': 'Flat Dumbbell Fly',
  'Rozpiętki na bramie z linkami wyciągu': 'Cable Crossover Fly',
  'Butterfly (maszyna rozpiętki)': 'Pec Deck (machine fly)',
  'Wyciskanie na maszynie Chest Press': 'Chest Press (machine)',
  'Wyciskanie na hammerze': 'Hammer Strength Chest Press',
  'Pompki klasyczne': 'Push-Up',
  // Back
  'Martwy ciąg klasyczny ze sztangą': 'Conventional Barbell Deadlift',
  'Martwy ciąg Sumo ze sztangą': 'Sumo Barbell Deadlift',
  'Martwy ciąg na prostych nogach': 'Straight-Leg Deadlift',
  'Podciąganie na drążku nachwytem': 'Pull-Up (overhand grip)',
  'Podciąganie na drążku podchwytem': 'Chin-Up (underhand grip)',
  'Ściąganie drążka wyciągu górnego do klatki': 'Lat Pulldown (to chest)',
  'Ściąganie drążka do klatki': 'Lat Pulldown (to chest)',
  'Ściąganie drążka do klatki nachwyt': 'Lat Pulldown (to chest, overhand grip)',
  'Ściąganie drążka do klatki nachwytem': 'Lat Pulldown (to chest, overhand grip)',
  'Ściąganie drążka do klatki podchwyt': 'Lat Pulldown (to chest, underhand grip)',
  'Ściąganie drążka do klatki podchwytem': 'Lat Pulldown (to chest, underhand grip)',
  'Ściąganie uchwytu neutralnego wyciągu górnego': 'Neutral-Grip Lat Pulldown',
  'Wiosłowanie sztangą w opadzie tułowia': 'Barbell Bent-Over Row',
  'Wiosłowanie hantlem jednorącz w oparciu o ławkę': 'One-Arm Dumbbell Row',
  'Przyciąganie uchwytu wyciągu dolnego do brzucha': 'Seated Cable Row',
  'Wiosłowanie na maszynie T-Bar': 'T-Bar Row (machine)',
  'Wiosłowanie na hammerze': 'Hammer Strength Row',
  'Narciarz (ściąganie drążka prostymi ramionami)': 'Straight-Arm Pulldown',
  'Szrugsy z hantlami / sztangą (kaptury)': 'Dumbbell / Barbell Shrug',
  // Shoulders
  'Wyciskanie żołnierskie stojąc ze sztangą (OHP)': 'Standing Barbell Overhead Press (OHP)',
  'Wyciskanie hantli siedząc': 'Seated Dumbbell Shoulder Press',
  'Wznosy hantli bokiem stojąc': 'Standing Dumbbell Lateral Raise',
  'Wznosy w bok': 'Lateral Raise',
  'Wznosy bokiem na wyciągu jednorącz': 'One-Arm Cable Lateral Raise',
  'Wznosy w bok na wyciągu': 'Cable Lateral Raise',
  'Odwrotny butterfly na maszynie (tył barku)': 'Reverse Pec Deck (rear delt)',
  'Odwrotny butterfly': 'Reverse Pec Deck',
  'Face Pull z linką wyciągu górnego': 'Cable Face Pull',
  'Wznosy hantli w opadzie tułowia': 'Bent-Over Dumbbell Rear Delt Raise',
  'Wyciskanie na maszynie Shoulder Press': 'Shoulder Press (machine)',
  // Arms
  'Uginanie przedramion ze sztangą stojąc': 'Standing Barbell Curl',
  'Uginanie ramion z hantlami z supinacją': 'Dumbbell Curl with Supination',
  'Uginanie ramion z supinacją': 'Supinating Curl',
  'Uginanie ramion z hantlami chwytem młotkowym': 'Dumbbell Hammer Curl',
  'Uginanie na modlitewniku ze sztangą łamaną': 'EZ-Bar Preacher Curl',
  'Uginanie ramion na wyciągu dolnym': 'Cable Curl (low pulley)',
  'Uginanie ramion z oparciem o kolano': 'Knee-Supported Concentration Curl',
  'Wyciskanie francuskie ze sztangą łamaną leżąc': 'Lying EZ-Bar Skull Crusher',
  'Wyciskanie francuskie hantla oburącz zza głowy': 'Two-Hand Dumbbell Overhead Extension',
  'Wyciskanie francuskie hantlami': 'Dumbbell Skull Crusher',
  'Prostowanie ramion na wyciągu ze sznurem': 'Cable Triceps Pushdown (rope)',
  'Prostowanie ramion na wyciągu z drążkiem prostym': 'Cable Triceps Pushdown (straight bar)',
  'Prostowanie ramion na wyciągu': 'Cable Triceps Pushdown',
  'Pompki na poręczach (Dipsy na triceps)': 'Triceps Dips',
  'Wyciskanie sztangi leżąc wąskim chwytem': 'Close-Grip Barbell Bench Press',
  // Abs & core
  'Allahy (spięcia brzucha klęcząc na wyciągu)': 'Cable Kneeling Crunch',
  'Allahy': 'Cable Kneeling Crunch',
  'Wznosy nóg w zwisie na drążku': 'Hanging Leg Raise',
  'Wznosy nóg na poręczach stacyjnych': "Captain's Chair Leg Raise",
  'Wznosy nóg do klatki': 'Leg Raises to Chest',
  'Kółko do brzucha (Ab Wheel Rollout)': 'Ab Wheel Rollout',
  'Plank (deska klasyczna)': 'Plank',
  'Spięcia brzucha na ławce skośnej': 'Decline Bench Crunch',
};

export const WORKOUT_NAMES_EN = {
  'GÓRA A': 'UPPER A',
  'DÓŁ A': 'LOWER A',
  'GÓRA B': 'UPPER B',
  'DÓŁ B': 'LOWER B',
  'GÓRA PUSH': 'UPPER PUSH',
  'DÓŁ QUAD': 'LOWER QUAD',
  'GÓRA PULL': 'UPPER PULL',
  'DÓŁ TYŁ': 'LOWER POSTERIOR',
  'GÓRA': 'UPPER',
  'DÓŁ': 'LOWER',
  'KLATKA + TRICEPS': 'CHEST + TRICEPS',
  'PLECY + BICEPS': 'BACK + BICEPS',
  'NOGI': 'LEGS',
  'BARKI + BRZUCH': 'SHOULDERS + ABS',
  'GÓRA UZUPEŁNIAJĄCA': 'UPPER SUPPLEMENTAL',
};

export const CATEGORY_NAMES_EN = {
  'Nogi i Pośladki': 'Legs & Glutes',
  'Klatka Piersiowa': 'Chest',
  'Plecy': 'Back',
  'Barki': 'Shoulders',
  'Ramiona (Biceps & Triceps)': 'Arms (Biceps & Triceps)',
  'Brzuch & Core': 'Abs & Core',
};

export const TEMPLATE_TEXT_EN = {
  'fbw-3': {
    title: 'FBW — 3 days',
    level: 'Beginner',
    goal: 'Strength & size',
    description: 'Full-body training three times a week.',
  },
  'ppl-3': {
    title: 'Push / Pull / Legs — 3 days',
    level: 'Intermediate',
    goal: 'Muscle size',
    description: 'Classic split into pushing, pulling and leg movements.',
  },
  'upper-lower-4': {
    title: 'Upper / Lower — 4 days',
    level: 'Beginner–intermediate',
    goal: 'Strength & size',
    description: 'Two upper-body and two lower-body sessions.',
  },
  'upper-lower-hypertrophy-4': {
    title: 'Upper / Lower — hypertrophy',
    level: 'Intermediate',
    goal: 'Muscle size',
    description: 'Higher volume for muscle growth.',
  },
  'ppl-upper-lower-5': {
    title: 'PPL + Upper / Lower — 5 days',
    level: 'Intermediate',
    goal: 'Muscle size',
    description: 'Five days for people who recover well from gym training.',
  },
  'body-part-5': {
    title: 'Body-Part Split — 5 days',
    level: 'Intermediate',
    goal: 'Muscle size',
    description: 'Higher volume for one muscle group per session.',
  },
};

export const PLAN_NAMES_EN = {
  'Mój Plan Główny (A/B/C)': 'My Main Plan (A/B/C)',
  'Domyślny Plan A/B/C': 'Default Plan A/B/C',
  'Mój Nowy Plan 3-Dniowy': 'My New 3-Day Plan',
};

// English aliases recognised as bodyweight / timed exercises when a user types
// an English name that is not an exact canonical translation.
export const BODYWEIGHT_ALIASES_EN = [
  'hanging leg raise', 'hanging leg raises', 'leg raises to chest', 'leg raise',
  "captain's chair leg raise", 'push-up', 'push up', 'push-ups', 'push ups',
  'ab wheel rollout', 'decline bench crunch', 'plank',
];
export const TIMED_ALIASES_EN = ['plank'];
