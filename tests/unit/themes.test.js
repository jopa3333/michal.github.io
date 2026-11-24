import { readFileSync } from 'node:fs';
import { fileURLToPath } from 'node:url';
import { describe, expect, it } from 'vitest';
import { DEFAULT_THEME, THEMES, themeById } from '../../src/themes.js';

const styles = readFileSync(fileURLToPath(new URL('../../src/styles.css', import.meta.url)), 'utf8');

const CORE_VARS = [
  '--bg-dark', '--bg-card', '--bg-card-hover', '--bg-input', '--border-color', '--border-accent',
  '--text-main', '--text-muted', '--accent-gold', '--accent-gold-hover', '--success-green', '--danger-red',
  // Kanały RGB do nakładek/ramek (rgba(var(--...-rgb), a)) i ciemny tekst na akcencie —
  // bez nich motywowane ramki/paski wracają do kolorów okresu oceanu.
  '--bg-dark-rgb', '--bg-card-rgb', '--bg-input-rgb', '--border-rgb', '--accent-rgb', '--accent-text',
];

describe('motywy kolorystyczne', () => {
  it('lista ma unikalne id i zawiera domyślny Ocean', () => {
    const ids = THEMES.map(theme => theme.id);
    expect(new Set(ids).size).toBe(THEMES.length);
    expect(ids).toContain(DEFAULT_THEME);
  });

  it('każdy motyw ma nazwę i pełną próbkę kolorów', () => {
    for (const theme of THEMES) {
      expect(theme.key).toMatch(/^settings\.theme\./);
      expect(theme.swatch.bg).toMatch(/^#/);
      expect(theme.swatch.accent).toMatch(/^#/);
      expect(theme.swatch.card).toMatch(/^#/);
    }
  });

  it('dla każdego motywu poza domyślnym styles.css ma blok z pełną paletą', () => {
    for (const theme of THEMES) {
      if (theme.id === DEFAULT_THEME) continue;
      const blockMatch = styles.match(new RegExp(`\\[data-theme='${theme.id}'\\][^}]*}`));
      expect(blockMatch, `brak bloku [data-theme='${theme.id}'] w styles.css`).toBeTruthy();
      const block = blockMatch[0];
      for (const cssVar of CORE_VARS) {
        expect(block, `${theme.id}: brak ${cssVar}`).toContain(cssVar);
      }
    }
  });

  it('themeById zwraca Ocean dla nieznanego id (ustawienia ze starszych kopii)', () => {
    expect(themeById('crimson').id).toBe('crimson');
    expect(themeById('nie-znany').id).toBe(DEFAULT_THEME);
    expect(themeById(undefined).id).toBe(DEFAULT_THEME);
  });

  it('każdy motyw premium ma metaliczną poświatę akcentu (--accent-glow)', () => {
    for (const theme of THEMES.filter(item => item.premium)) {
      const block = styles.match(new RegExp(`\\[data-theme='${theme.id}'\\][^}]*}`))[0];
      expect(block, `${theme.id}: premium bez --accent-glow`).toContain('--accent-glow');
    }
    // :root ma neutralną wartość, żeby zwykłe motywy nie świeciły.
    expect(styles).toMatch(/--accent-glow: transparent;/);
  });

  it('domyślny motyw nie nadpisuje :root w styles.css (ocean = brak bloku)', () => {
    expect(styles).not.toContain(`[data-theme='${DEFAULT_THEME}'`);
  });

  it('styles.css nie ma już sztywnych kolorów oceanu poza definicjami palet', () => {
    const hardcoded = styles.match(/rgba\(2, 44, 67|rgba\(20, 107, 151|rgba\(255, 215, 0|rgba\(2, 37, 56|rgba\(5, 63, 94/g) || [];
    expect(hardcoded).toEqual([]);
  });
});
