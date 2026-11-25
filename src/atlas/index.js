import { ATLAS_LEGS } from './legs.js';
import { ATLAS_CHEST } from './chest.js';
import { ATLAS_BACK } from './back.js';
import { ATLAS_SHOULDERS } from './shoulders.js';
import { ATLAS_ARMS } from './arms.js';
import { ATLAS_CORE } from './core.js';
import { exerciseDisplayName } from '../i18n/core.js';

// Full atlas database: one entry per exercise from DATABASE_TUPLES (62 exercises),
// merged in the same category order as EXERCISE_DATABASE.
export const ATLAS_EXERCISES = [
  ...ATLAS_LEGS,
  ...ATLAS_CHEST,
  ...ATLAS_BACK,
  ...ATLAS_SHOULDERS,
  ...ATLAS_ARMS,
  ...ATLAS_CORE,
];

export const ATLAS_CATEGORIES = [
  'Nogi i Pośladki',
  'Klatka Piersiowa',
  'Plecy',
  'Barki',
  'Ramiona (Biceps & Triceps)',
  'Brzuch & Core',
];

const norm = value => String(value ?? '').trim().toLowerCase();

// Canonical names first, then aliases (canonical takes precedence on collision).
const ATLAS_BY_KEY = new Map();
for (const entry of ATLAS_EXERCISES) {
  ATLAS_BY_KEY.set(norm(entry.name), entry);
}
for (const entry of ATLAS_EXERCISES) {
  for (const alias of entry.aliases || []) {
    const key = norm(alias);
    if (!ATLAS_BY_KEY.has(key)) ATLAS_BY_KEY.set(key, entry);
  }
}

// Looks up an atlas entry by canonical exercise name (PL) or any of its
// legacy aliases (e.g. older plan names like 'Leg press' or 'Allahy').
export function atlasEntryFor(name) {
  return ATLAS_BY_KEY.get(norm(name)) || null;
}

// Case-insensitive text search over canonical names, aliases and muscle labels.
export function atlasSearch(query, muscleLabel) {
  const q = norm(query);
  if (!q && !muscleLabel) return ATLAS_EXERCISES;
  return ATLAS_EXERCISES.filter(entry => {
    if (muscleLabel && !entry.primaryMuscles.includes(muscleLabel) && !entry.secondaryMuscles.includes(muscleLabel)) {
      return false;
    }
    if (!q) return true;
    const haystack = [
      entry.name,
      exerciseDisplayName(entry.name, 'en'),
      ...(entry.aliases || []),
      ...(entry.aliases || []).map(alias => exerciseDisplayName(alias, 'en')),
    ].map(norm);
    return haystack.some(text => text.includes(q));
  });
}
