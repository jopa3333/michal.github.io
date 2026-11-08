// Same localStorage keys as the legacy app, so existing data carries over.
export const KEYS = {
  plan: 'trening2026_plan_v1',
  savedPlans: 'trening2026_saved_plans_v1',
  history: 'trening2026_history_v1',
  settings: 'trening2026_settings_v1',
  active: 'trening2026_active_session_v1',
};

const memoryStore = {};

export function loadFromStorage(key, fallback) {
  try {
    if (typeof localStorage !== 'undefined' && localStorage) {
      const raw = localStorage.getItem(key);
      if (raw !== null && raw !== undefined) return JSON.parse(raw);
    }
  } catch (error) {
    console.warn('Odczyt localStorage zablokowany, używam pamięci:', error);
  }
  return memoryStore[key] !== undefined ? memoryStore[key] : fallback;
}

export function saveToStorage(key, data) {
  memoryStore[key] = data;
  try {
    if (typeof localStorage !== 'undefined' && localStorage) localStorage.setItem(key, JSON.stringify(data));
  } catch (error) {
    console.warn('Zapis localStorage zablokowany, zapisano w pamięci:', error);
  }
}
