// ============================================================
// Motywy kolorystyczne. Palety siedzą w styles.css jako bloki
// [data-theme='<id>'], tu tylko metadane do UI (nazwa + próbka).
// Ocean = paleta domyślna (bez bloku w CSS, to stylistyka :root).
// ============================================================

export const THEMES = [
  { id: 'ocean', key: 'settings.theme.ocean', swatch: { bg: '#022c43', card: '#053f5e', accent: '#ffd700' } },
  { id: 'crimson', key: 'settings.theme.crimson', swatch: { bg: '#20070c', card: '#3a0e14', accent: '#ff5252' } },
  { id: 'forest', key: 'settings.theme.forest', swatch: { bg: '#04231a', card: '#0a3d2c', accent: '#00e676' } },
  { id: 'violet', key: 'settings.theme.violet', swatch: { bg: '#190830', card: '#2a1445', accent: '#c77dff' } },
  { id: 'sunset', key: 'settings.theme.sunset', swatch: { bg: '#2a1204', card: '#452005', accent: '#ff9800' } },
  { id: 'steel', key: 'settings.theme.steel', swatch: { bg: '#14161a', card: '#232730', accent: '#9be7ff' } },
  { id: 'rose', key: 'settings.theme.rose', swatch: { bg: '#1d0a12', card: '#361220', accent: '#ff80ab' } },
  { id: 'indigo', key: 'settings.theme.indigo', swatch: { bg: '#0c1030', card: '#191f52', accent: '#7c9cff' } },
  // Seria premium: dziś darmowe; po wejściu w Play i rewarded ads ta piątka
  // stanie się motywami „odblokuj za reklamę" (flaga premium w kodzie).
  { id: 'onyx', key: 'settings.theme.onyx', premium: true, swatch: { bg: '#0a0a0c', card: '#17171b', accent: '#e6c069' } },
  { id: 'platinum', key: 'settings.theme.platinum', premium: true, swatch: { bg: '#101114', card: '#1b1d22', accent: '#d9dee6' } },
  { id: 'emerald', key: 'settings.theme.emerald', premium: true, swatch: { bg: '#05211a', card: '#0b3327', accent: '#2dd4a3' } },
  { id: 'burgundy', key: 'settings.theme.burgundy', premium: true, swatch: { bg: '#220a10', card: '#3c1119', accent: '#e8a87c' } },
  { id: 'admiral', key: 'settings.theme.admiral', premium: true, swatch: { bg: '#0a152e', card: '#13224a', accent: '#e29b58' } },
];

export const DEFAULT_THEME = 'ocean';

export function themeById(id) {
  return THEMES.find(theme => theme.id === id) || THEMES[0];
}

// Ustawia motyw na <html data-theme="..."> — ocean to brak atrybutu,
// żeby domyślny wygląd nigdy nie zależał od kolejności ładowania.
export function applyTheme(id) {
  if (typeof document === 'undefined') return;
  const theme = themeById(id);
  if (theme.id === DEFAULT_THEME) document.documentElement.removeAttribute('data-theme');
  else document.documentElement.setAttribute('data-theme', theme.id);
}
