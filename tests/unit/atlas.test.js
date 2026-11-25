import { describe, expect, it } from 'vitest';
import { EXERCISE_CATEGORIES, EXERCISE_DATABASE, DATABASE_TUPLES } from '../../src/data.js';
import { ATLAS_CATEGORIES, ATLAS_EXERCISES, atlasEntryFor, atlasSearch } from '../../src/atlas/index.js';
import { MUSCLE_META, SCHEMATIC_PATTERNS } from '../../src/components/AtlasVisuals.jsx';
import { tFor } from '../../src/i18n/core.js';

const REQUIRED_LOC_KEYS = ['primeMover', 'summary', 'phases', 'cues', 'mistakes', 'note'];
const EQUIPMENTS = ['barbell', 'dumbbell', 'machine', 'cable', 'bodyweight'];
const MECHANICS = ['compound', 'isolation', 'isometric'];
const FORCES = ['push', 'pull', 'static'];

describe('atlas database', () => {
  it('covers every exercise in the training database (62)', () => {
    expect(EXERCISE_DATABASE).toHaveLength(62);
    expect(ATLAS_EXERCISES).toHaveLength(62);

    const byId = new Map(ATLAS_EXERCISES.map(entry => [entry.name, entry]));
    for (const ex of EXERCISE_DATABASE) {
      expect(byId.get(ex.name), `missing atlas entry: ${ex.name}`).toBeTruthy();
    }
    const ids = new Set(ATLAS_EXERCISES.map(entry => entry.id));
    expect(ids.size).toBe(62);
  });

  it('keeps atlas categories aligned with EXERCISE_CATEGORIES', () => {
    const dbCategoryNames = EXERCISE_CATEGORIES.map(([name]) => name);
    expect(ATLAS_CATEGORIES).toEqual(dbCategoryNames);
    for (const entry of ATLAS_EXERCISES) {
      expect(dbCategoryNames).toContain(entry.category);
    }
  });

  it('has complete and valid metadata for every entry', () => {
    for (const entry of ATLAS_EXERCISES) {
      expect(EQUIPMENTS).toContain(entry.equipment);
      expect(MECHANICS).toContain(entry.mechanic);
      expect(FORCES).toContain(entry.force);
      expect(SCHEMATIC_PATTERNS).toContain(entry.pattern);

      expect(entry.primaryMuscles.length).toBeGreaterThan(0);
      for (const slug of [...entry.primaryMuscles, ...entry.secondaryMuscles]) {
        expect(Object.keys(MUSCLE_META), `unknown muscle: ${slug} in ${entry.id}`).toContain(slug);
      }
      expect(entry.sources.length).toBeGreaterThan(0);
      expect(entry.aliases.every(alias => typeof alias === 'string')).toBe(true);
    }
  });

  it('has complete bilingual content (pl + en) for every entry', () => {
    for (const entry of ATLAS_EXERCISES) {
      for (const lang of ['pl', 'en']) {
        const loc = entry[lang];
        expect(loc, `${entry.id}.${lang}`).toBeTruthy();
        for (const key of REQUIRED_LOC_KEYS) {
          expect(loc[key], `${entry.id}.${lang}.${key}`).toBeTruthy();
        }
        expect(loc.phases).toHaveLength(3);
        for (const phase of loc.phases) expect(phase.length).toBeGreaterThan(20);
        for (const cue of loc.cues) expect(cue.length).toBeGreaterThan(10);
        for (const mistake of loc.mistakes) expect(mistake.length).toBeGreaterThan(10);
      }
    }
  });

  it('contains no characters outside the Polish/English sets', () => {
    const allowed = /[ĄĆĘŁŃÓŚŹŻąćęłńóśźżA-Za-z0-9 .,;:()%/"'’„”\-–—°…&=~+<>=×²¹!?→↓↑]/;
    const check = value => {
      for (const ch of String(value)) {
        expect(allowed.test(ch), `unexpected char "${ch}" in: ${String(value).slice(0, 50)}`).toBe(true);
      }
    };
    const walk = value => {
      if (typeof value === 'string') return check(value);
      if (Array.isArray(value)) return value.forEach(walk);
      if (value && typeof value === 'object') return Object.values(value).forEach(walk);
    };
    walk(ATLAS_EXERCISES);
  });

  it('finds entries by canonical names and legacy aliases', () => {
    expect(atlasEntryFor('Przysiad ze sztangą na plecach').id).toBe('barbell-back-squat');
    expect(atlasEntryFor('  przysiad ze sztangą na plecach ').id).toBe('barbell-back-squat');
    // Legacy names from the original default plans.
    expect(atlasEntryFor('Leg press').id).toBe('leg-press');
    expect(atlasEntryFor('Łydka stojąc').id).toBe('standing-calf-raise');
    expect(atlasEntryFor('Martwy ciąg na prostych nogach').id).toBe('barbell-rdl');
    expect(atlasEntryFor('Ściąganie drążka do klatki').category).toBe('Plecy');
    expect(atlasEntryFor('Wiosłowanie na hammerze').id).toBe('t-bar-row');
    expect(atlasEntryFor('Wyciskanie na hammerze').id).toBe('machine-chest-press');
    expect(atlasEntryFor('Uginanie ramion z supinacją').id).toBe('supinating-dumbbell-curl');
    expect(atlasEntryFor('Prostowanie ramion na wyciągu').id).toBe('rope-pushdown');
    expect(atlasEntryFor('Uginanie ramion z oparciem o kolano').id).toBe('preacher-curl');
    expect(atlasEntryFor('Wyciskanie francuskie hantlami').id).toBe('overhead-dumbbell-extension');
    expect(atlasEntryFor('Wznosy nóg do klatki').id).toBe('hanging-leg-raise');
    expect(atlasEntryFor('Allahy').id).toBe('cable-kneeling-crunch');
    expect(atlasEntryFor('Nie ma takiego ćwiczenia')).toBeNull();
  });

  it('searches by fragment and filters by muscle', () => {
    expect(atlasSearch('przysiad').some(entry => entry.id === 'barbell-back-squat')).toBe(true);
    expect(atlasSearch('Wykroki').some(entry => entry.id === 'walking-lunges')).toBe(true);
    expect(atlasSearch('', 'chest').some(entry => entry.id === 'barbell-bench-press')).toBe(true);
    expect(atlasSearch('', 'hamstrings').every(entry =>
      entry.primaryMuscles.includes('hamstrings') || entry.secondaryMuscles.includes('hamstrings')
    )).toBe(true);
  });

  it('keeps bilingual UI dictionary keys in sync', () => {
    const tk = key => ({ pl: tFor('pl')(key), en: tFor('en')(key) });
    for (const key of [
      'atlas.title', 'atlas.startTile', 'atlas.startTileText', 'atlas.searchPlaceholder',
      'atlas.filterAll', 'atlas.count', 'atlas.howTo', 'atlas.cues', 'atlas.mistakes',
      'atlas.sources', 'atlas.tempoTitle', 'atlas.front', 'atlas.back',
    ]) {
      const { pl, en } = tk(key);
      expect(pl).not.toBe(key);
      expect(en).not.toBe(key);
    }
    for (const eq of EQUIPMENTS) {
      expect(tFor('pl')(`atlas.equipment.${eq}`)).not.toBe(`atlas.equipment.${eq}`);
      expect(tFor('en')(`atlas.equipment.${eq}`)).not.toBe(`atlas.equipment.${eq}`);
    }
  });
});
