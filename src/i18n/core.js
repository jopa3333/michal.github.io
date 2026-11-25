// Pure i18n core: no React, usable from logic.js and audio.js as well.
// Dictionaries are merged from per-area modules; keys are namespaced
// (common.*, app.*, workout.*, modals.*, plan.*, history.*, start.*, settings.*, audio.*).
import { loadFromStorage, saveToStorage } from '../storage.js';
import { COMMON } from './common.js';
import {
  EXERCISE_NAMES_EN, WORKOUT_NAMES_EN, CATEGORY_NAMES_EN, TEMPLATE_TEXT_EN, PLAN_NAMES_EN,
} from './names.js';
import app from './app.js';
import workout from './workout.js';
import modals from './modals.js';
import plan from './plan.js';
import history from './history.js';
import start from './start.js';
import settings from './settings.js';
import audio from './audio.js';
import atlas from './atlas.js';

export const LANG_KEY = 'trening2026_lang_v1';
export const LANGS = ['pl', 'en'];

const DICT = { pl: {}, en: {} };
for (const area of [COMMON, app, workout, modals, plan, history, start, settings, audio, atlas]) {
  Object.assign(DICT.pl, area.pl);
  Object.assign(DICT.en, area.en);
}

export function getStoredLang() {
  const value = loadFromStorage(LANG_KEY, null);
  return LANGS.includes(value) ? value : null;
}

export function getLang() {
  return getStoredLang() || 'pl';
}

export function storeLang(lang) {
  if (LANGS.includes(lang)) saveToStorage(LANG_KEY, lang);
}

// t(key, params) with {param} interpolation; falls back to Polish, then the key.
export function tFor(lang) {
  const l = lang === 'en' ? 'en' : 'pl';
  return (key, params) => {
    let text = DICT[l][key] ?? DICT.pl[key] ?? key;
    if (params) {
      for (const [name, value] of Object.entries(params)) {
        text = text.split(`{${name}}`).join(String(value));
      }
    }
    return text;
  };
}

const lower = value => String(value ?? '').trim().toLowerCase();
const EXERCISE_EN_BY_LOWER = new Map(Object.entries(EXERCISE_NAMES_EN).map(([pl, en]) => [lower(pl), en]));
// First entry wins: canonical database names are listed before legacy variants,
// so an English name maps back to the canonical Polish one.
const EXERCISE_PL_BY_EN_LOWER = new Map();
for (const [pl, en] of Object.entries(EXERCISE_NAMES_EN)) {
  const key = lower(en);
  if (!EXERCISE_PL_BY_EN_LOWER.has(key)) EXERCISE_PL_BY_EN_LOWER.set(key, pl);
}
const WORKOUT_EN_BY_LOWER = new Map(Object.entries(WORKOUT_NAMES_EN).map(([pl, en]) => [lower(pl), en]));
const CATEGORY_EN_BY_LOWER = new Map(Object.entries(CATEGORY_NAMES_EN).map(([pl, en]) => [lower(pl), en]));
const PLAN_EN_BY_LOWER = new Map(Object.entries(PLAN_NAMES_EN).map(([pl, en]) => [lower(pl), en]));

// Display translation of a canonical exercise name; unknown/custom names pass through.
export function exerciseDisplayName(name, lang) {
  if (lang !== 'en') return name;
  return EXERCISE_EN_BY_LOWER.get(lower(name)) ?? name;
}

// Maps an English exercise name back to the canonical Polish one used in storage
// and exercise matching; unknown names pass through unchanged.
export function canonicalExerciseName(name) {
  return EXERCISE_PL_BY_EN_LOWER.get(lower(name)) ?? name;
}

export function workoutDisplayName(name, lang) {
  if (lang !== 'en') return name;
  const raw = String(name ?? '');
  const trening = /^TRENING\s+([A-E])$/i.exec(raw.trim());
  if (trening) return `WORKOUT ${trening[1].toUpperCase()}`;
  return WORKOUT_EN_BY_LOWER.get(lower(raw)) ?? name;
}

export function categoryDisplayName(category, lang) {
  if (lang !== 'en') return category;
  return CATEGORY_EN_BY_LOWER.get(lower(category)) ?? category;
}

export function templateText(template, lang) {
  if (lang !== 'en') return template;
  return { ...template, ...(TEMPLATE_TEXT_EN[template.id] || {}) };
}

export function planDisplayName(name, lang) {
  if (lang !== 'en') return name;
  const raw = String(name ?? '');
  const known = PLAN_EN_BY_LOWER.get(lower(raw));
  if (known) return known;
  return raw.replace(/\(Kopia\)\s*$/i, '(Copy)');
}

export function dateLocale(lang) {
  return lang === 'en' ? 'en-GB' : 'pl-PL';
}
