import { useEffect, useRef, useState } from 'react';
import './styles.css';
import { DEFAULT_PLAN, PLAN_TEMPLATES } from './data.js';
import { KEYS, loadFromStorage, saveToStorage } from './storage.js';
import * as audio from './audio.js';
import * as logic from './logic.js';
import { HistoryTab } from './components/HistoryTab.jsx';
import { PlanTab } from './components/PlanTab.jsx';
import { SettingsTab } from './components/SettingsTab.jsx';
import { StartTab } from './components/StartTab.jsx';
import { WorkoutTab } from './components/WorkoutTab.jsx';
import {
  CustomRepsModal,
  ExerciseModal,
  PlanDrawer,
  SavedPlansModal,
  SavePlanAsModal,
  SummaryModal,
  TemplateLibraryModal,
  WeightModal,
} from './components/Modals.jsx';

const TICK_MS = 400;
const TOAST_MS = 2600;
const NAV = [
  ['start', '🏠', 'Start'],
  ['workout', '🏋️', 'Trening'],
  ['plan', '📋', 'Plan'],
  ['history', '📊', 'Historia'],
  ['settings', '⚙️', 'Ustawienia'],
];
const DEFAULT_SETTINGS = {
  currentWeek: 1,
  selectedStartWorkoutId: 'A',
  activePlanId: 'plan_default',
  activePlanName: logic.DEFAULT_PLAN_NAME,
  soundEnabled: true,
  vibrateEnabled: true,
};
const DEFAULT_HISTORY_FILTERS = { workout: 'all', week: 'all', exerciseMode: false, exerciseName: '' };
const fmt = logic.formatWeightDisplay;

function readInitialState() {
  const plan = loadFromStorage(KEYS.plan, logic.clone(DEFAULT_PLAN));
  const history = loadFromStorage(KEYS.history, []);
  const storedSettings = loadFromStorage(KEYS.settings, logic.clone(DEFAULT_SETTINGS));
  const session = loadFromStorage(KEYS.active, null);
  let savedPlans = loadFromStorage(KEYS.savedPlans, null);
  const now = new Date().toISOString();
  if (!Array.isArray(savedPlans) || savedPlans.length === 0) {
    savedPlans = [
      {
        id: 'plan_default',
        name: storedSettings.activePlanName || logic.DEFAULT_PLAN_NAME,
        createdAt: now,
        updatedAt: now,
        workouts: logic.clone(plan || DEFAULT_PLAN),
        workoutOrder: logic.workoutIds(plan || DEFAULT_PLAN),
      },
    ];
  }
  let settings = storedSettings;
  if (!settings.activePlanId) settings = { ...settings, activePlanId: savedPlans[0].id, activePlanName: savedPlans[0].name };
  if (!settings.legacyProgressPlanId) settings = { ...settings, legacyProgressPlanId: settings.activePlanId };
  const progress = logic.applyWeekProgress(history, settings, plan);
  return { plan, history, settings: progress.settings, weekProg: progress.weekProg, session, savedPlans };
}

function Toast({ notice }) {
  const icon = notice?.type === 'error' ? '✕' : notice?.type === 'gold' ? '★' : '✓';
  return (
    <div id="notification" className={`notification${notice?.visible ? ' show' : ''} ${notice ? notice.type : ''}`}>
      <span id="notif-icon">{notice ? icon : '✓'}</span>
      <span id="notif-msg">{notice ? notice.message : 'Powiadomienie'}</span>
    </div>
  );
}

export default function App() {
  const [boot] = useState(readInitialState);
  const [plan, setPlan] = useState(boot.plan);
  const [history, setHistory] = useState(boot.history);
  const [settings, setSettings] = useState(boot.settings);
  const [savedPlans, setSavedPlans] = useState(boot.savedPlans);
  const [session, setSession] = useState(boot.session);
  const [tab, setTab] = useState(boot.session ? 'workout' : 'start');
  const [exerciseIndex, setExerciseIndex] = useState(0);
  const [planTab, setPlanTab] = useState(() => logic.workoutIds(boot.plan)[0] || 'A');
  const [notice, setNotice] = useState(null);
  const [timer, setTimer] = useState({ isRunning: false, remaining: 0, total: 0, targetEndTime: null });
  const [modal, setModal] = useState(null);
  const [historyFilters, setHistoryFilters] = useState(DEFAULT_HISTORY_FILTERS);

  const timerRef = useRef(timer);
  timerRef.current = timer;
  // Browsers can fire visibilitychange, focus and pageshow together when waking.
  // One deadline must finish and notify only once.
  const finishedTimerTargetRef = useRef(null);
  const settingsRef = useRef(settings);
  settingsRef.current = settings;

  const notify = (message, type = 'success') => setNotice({ message, type, visible: true, id: Date.now() + Math.random() });

  // Persist every piece of state under the legacy localStorage keys.
  useEffect(() => saveToStorage(KEYS.plan, plan), [plan]);
  useEffect(() => saveToStorage(KEYS.history, history), [history]);
  useEffect(() => saveToStorage(KEYS.settings, settings), [settings]);
  useEffect(() => saveToStorage(KEYS.savedPlans, savedPlans), [savedPlans]);
  useEffect(() => saveToStorage(KEYS.active, session), [session]);

  // Toast hides itself after TOAST_MS.
  useEffect(() => {
    if (!notice) return undefined;
    const id = setTimeout(() => setNotice(current => (current && current.id === notice.id ? { ...current, visible: false } : current)), TOAST_MS);
    return () => clearTimeout(id);
  }, [notice]);

  // Week progression on load (legacy initApp).
  useEffect(() => {
    if (boot.weekProg.advanced) {
      notify(`🚀 Zaktualizowano na Tydzień ${boot.weekProg.newWeek} (ukończono Tydzień ${boot.weekProg.previousWeek})!`, 'gold');
    }
    // Runs once on mount, like the legacy initApp().
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  // Uncaught errors show a toast, like the legacy window.onerror.
  useEffect(() => {
    const onError = event => setNotice({ message: `Błąd: ${event.message}`, type: 'error', visible: true, id: Date.now() + Math.random() });
    window.addEventListener('error', onError);
    return () => window.removeEventListener('error', onError);
  }, []);

  // Warn before leaving the page during an active workout.
  useEffect(() => {
    if (!session) return undefined;
    const warn = event => {
      event.preventDefault();
      event.returnValue = 'Trwa aktywny trening. Czy na pewno chcesz opuścić stronę?';
    };
    window.addEventListener('beforeunload', warn);
    return () => window.removeEventListener('beforeunload', warn);
  }, [session]);

  // ---- Rest timer (timestamp based, like the legacy timerState) ----

  function tickTimer() {
    const current = timerRef.current;
    if (!current.isRunning || !current.targetEndTime) return;
    if (current.targetEndTime - Date.now() > 0) {
      setTimer(prev => (prev.isRunning && prev.targetEndTime ? { ...prev, remaining: Math.ceil((prev.targetEndTime - Date.now()) / 1000) } : prev));
      return;
    }
    if (finishedTimerTargetRef.current === current.targetEndTime) return;
    finishedTimerTargetRef.current = current.targetEndTime;
    setTimer(prev => ({ ...prev, remaining: 0, isRunning: false, targetEndTime: null }));
    audio.soundTimerFinished(settingsRef.current);
    setTimeout(() => audio.speakVoiceNotification(settingsRef.current, 'Koniec przerwy! Czas na serię.'), 450);
    audio.sendSystemNotification('Koniec przerwy! ⏱', 'Czas na kolejną serię!');
    notify('⏱ Koniec przerwy! Czas na kolejną serię.', 'gold');
  }
  const tickRef = useRef(tickTimer);
  tickRef.current = tickTimer;

  useEffect(() => {
    if (!timer.isRunning) return undefined;
    const id = setInterval(() => tickRef.current(), TICK_MS);
    return () => clearInterval(id);
  }, [timer.isRunning, timer.targetEndTime]);

  useEffect(() => {
    const wake = () => tickRef.current();
    document.addEventListener('visibilitychange', wake);
    window.addEventListener('focus', wake);
    window.addEventListener('pageshow', wake);
    return () => {
      document.removeEventListener('visibilitychange', wake);
      window.removeEventListener('focus', wake);
      window.removeEventListener('pageshow', wake);
    };
  }, []);

  function initExerciseTimer(rest) {
    setTimer(prev => (prev.isRunning ? prev : { isRunning: false, remaining: rest, total: rest, targetEndTime: null }));
  }

  function resetTimer(rest) {
    finishedTimerTargetRef.current = null;
    setTimer({ isRunning: false, remaining: rest, total: rest, targetEndTime: null });
  }

  function startTimer(rest) {
    finishedTimerTargetRef.current = null;
    setTimer(prev => {
      let remaining = prev.remaining;
      let total = prev.total;
      if (remaining <= 0) {
        remaining = rest;
        total = rest;
      }
      return { isRunning: true, remaining, total, targetEndTime: Date.now() + remaining * 1000 };
    });
    audio.unlockAudioAndSpeech();
    audio.requestNotificationPermissionIfNeeded();
  }

  function pauseTimer() {
    finishedTimerTargetRef.current = null;
    setTimer(prev =>
      prev.targetEndTime
        ? { ...prev, isRunning: false, remaining: Math.max(0, Math.ceil((prev.targetEndTime - Date.now()) / 1000)), targetEndTime: null }
        : { ...prev, isRunning: false },
    );
  }

  function adjustTimer(seconds) {
    setTimer(prev => {
      const remaining = Math.max(0, prev.remaining + seconds);
      return { ...prev, remaining, targetEndTime: prev.isRunning ? Date.now() + remaining * 1000 : prev.targetEndTime };
    });
  }

  // ---- Navigation and sessions ----

  const exIndex = session ? Math.min(exerciseIndex, Math.max(session.exercises.length - 1, 0)) : 0;
  const restAt = index => (session && session.exercises[index] && session.exercises[index].restSeconds) || 90;
  const currentExercise = session ? session.exercises[exIndex] : null;

  function goTab(id) {
    setTab(id);
    if (id === 'workout' && session) initExerciseTimer(restAt(exIndex));
    window.scrollTo(0, 0);
  }

  function startWorkout(workoutId) {
    const workout = plan[workoutId];
    if (!workout) return;
    if (session && session.workoutId === workoutId) {
      goTab('workout');
      return;
    }
    if (!workout.exercises.length) {
      notify('Ten trening nie ma ćwiczeń.', 'error');
      return;
    }
    const next = {
      sessionId: `sess_${Date.now()}`,
      planId: settings.activePlanId,
      workoutId,
      workoutName: workout.name,
      week: settings.currentWeek || 1,
      startTime: new Date().toISOString(),
      currentExerciseIndex: 0,
      exercises: logic.createSessionExercises(workout, history),
    };
    setSession(next);
    setExerciseIndex(0);
    setTab('workout');
    initExerciseTimer(next.exercises[0].restSeconds || 90);
    window.scrollTo(0, 0);
    notify(`Rozpoczęto ${workout.name} (Tydzień ${settings.currentWeek})!`);
  }

  function patchExercise(index, change) {
    setSession(prev => {
      if (!prev || !prev.exercises[index]) return prev;
      return { ...prev, exercises: prev.exercises.map((ex, i) => (i === index ? { ...ex, ...change(ex) } : ex)) };
    });
  }

  function navigate(direction) {
    if (!session) return;
    const next = exIndex + direction;
    if (next < 0 || next >= session.exercises.length) return;
    setExerciseIndex(next);
    setSession(prev => (prev ? { ...prev, currentExerciseIndex: next } : prev));
    initExerciseTimer(restAt(next));
    window.scrollTo(0, 0);
  }

  function selectExerciseFromDrawer(index) {
    setExerciseIndex(index);
    setSession(prev => (prev ? { ...prev, currentExerciseIndex: index } : prev));
    initExerciseTimer(restAt(index));
    setModal(null);
  }

  // ---- Per-set actions (legacy section 10 and 11) ----

  function recordSet(reps) {
    if (!session || !currentExercise) return;
    const ex = currentExercise;
    const weight = ex.currentWeight || 0;
    patchExercise(exIndex, e => ({ completedSets: [...e.completedSets, { weight, reps }] }));
    audio.unlockAudioAndSpeech();
    audio.soundSetLogged(settingsRef.current);
    notify(`✓ Zapisano serię: ${fmt(weight)} kg × ${reps}`);
    if (ex.completedSets.length + 1 >= ex.setsTarget) {
      initExerciseTimer(restAt(exIndex));
      notify(`🎉 Ukończono: ${ex.name}!`, 'gold');
    } else {
      resetTimer(restAt(exIndex));
    }
  }

  function removeSet(setIndex) {
    if (!session) return;
    patchExercise(exIndex, e => ({ completedSets: e.completedSets.filter((_, i) => i !== setIndex) }));
    initExerciseTimer(restAt(exIndex));
    notify('Usunięto serię');
  }

  function addSet() {
    if (!currentExercise) return;
    patchExercise(exIndex, e => ({ setsTarget: e.setsTarget + 1 }));
    initExerciseTimer(restAt(exIndex));
    notify(`Dodano serię (cel: ${currentExercise.setsTarget + 1} serii)`);
  }

  function removeSetTarget() {
    if (!currentExercise) return;
    if (currentExercise.setsTarget <= 1) {
      notify('Minimalna liczba serii to 1', 'error');
      return;
    }
    patchExercise(exIndex, e => ({
      setsTarget: e.setsTarget - 1,
      completedSets: e.completedSets.length >= e.setsTarget ? e.completedSets.slice(0, -1) : e.completedSets,
    }));
    initExerciseTimer(restAt(exIndex));
    notify(`Zmniejszono liczbę serii do ${currentExercise.setsTarget - 1}`);
  }

  function adjustWeight(delta) {
    if (!session) return;
    patchExercise(exIndex, e => ({ currentWeight: logic.clampWeight(Number(((e.currentWeight || 0) + delta).toFixed(2))) }));
    audio.playTone(settingsRef.current, 440, 0.04, 'sine', 0.05);
  }

  function saveWeight(text) {
    const value = logic.parseWeightInput(text);
    if (isNaN(value) || value < 0) {
      notify('Podaj prawidłowy ciężar', 'error');
      return;
    }
    patchExercise(exIndex, () => ({ currentWeight: value }));
    initExerciseTimer(restAt(exIndex));
    setModal(null);
    notify(`Ustawiono ciężar ${fmt(value)} kg`);
  }

  function saveCustomReps(text) {
    const value = parseInt(text, 10);
    if (!isNaN(value) && value > 0) {
      setModal(null);
      recordSet(value);
    } else {
      notify('Podaj prawidłową liczbę powtórzeń', 'error');
    }
  }

  function adjustWeekSetting(delta) {
    const week = Math.max(1, (settings.currentWeek || 1) + delta);
    setSettings({ ...settings, currentWeek: week });
    notify(`Ustawiono tydzień ${week}`, 'gold');
  }

  // ---- Finishing a workout (legacy section 14) ----

  function promptFinish() {
    if (!session) return;
    const anySets = session.exercises.some(e => e.completedSets && e.completedSets.length > 0);
    if (!anySets) {
      if (window.confirm('Nie wykonano jeszcze żadnej serii. Czy na pewno chcesz anulować ten trening?')) {
        setSession(null);
        setTab('start');
        notify('Anulowano trening');
      }
      return;
    }
    if (window.confirm('Czy na pewno chcesz zakończyć ten trening i zapisać wyniki do historii?')) finishWorkout();
  }

  function finishWorkout() {
    if (!session) return;
    const sessionWithPlan = session.planId ? session : { ...session, planId: settings.legacyProgressPlanId || settings.activePlanId };
    const { record, totalSets, volume } = logic.buildSessionRecord(sessionWithPlan, new Date().toISOString());
    const nextHistory = [record, ...history];
    const { settings: nextSettings, weekProg } = logic.settingsAfterFinish(nextHistory, settings, session.workoutId, plan);
    const previousCount = Number.isSafeInteger(settings.completedWorkoutCount) && settings.completedWorkoutCount >= 0
      ? settings.completedWorkoutCount : history.length;
    const completedWorkoutCount = previousCount + 1;
    setHistory(nextHistory);
    setSettings({
      ...nextSettings,
      completedWorkoutCount,
      backupReminderPending: Boolean(settings.backupReminderPending) || completedWorkoutCount % 20 === 0,
    });
    setSession(null);
    setTimer(prev => ({ ...prev, isRunning: false, targetEndTime: null }));
    audio.playTone(settingsRef.current, 523.25, 0.3, 'sine', 0.2);
    setModal({ kind: 'summary', data: { name: session.workoutName, week: session.week, sets: totalSets, volume, weekProg } });
  }

  function closeSummary() {
    setModal(null);
    setTab('history');
    window.scrollTo(0, 0);
    notify('Trening zapisany pomyślnie!', 'gold');
  }

  // ---- Plans (legacy section 15) ----

  function commitPlan(nextPlan, nextSettings = settings) {
    setPlan(nextPlan);
    setSavedPlans(logic.upsertCurrentPlan(savedPlans, nextSettings, nextPlan, new Date().toISOString()));
  }

  function saveExercise(form, index) {
    const isNew = index < 0;
    const existingId = isNew ? null : plan[planTab].exercises[index].id;
    const result = logic.exerciseFromForm(form, existingId, Date.now());
    if (result.error) {
      notify(result.error, 'error');
      return;
    }
    const next = logic.clone(plan);
    if (isNew) next[planTab].exercises.push(result.exercise);
    else next[planTab].exercises[index] = result.exercise;
    commitPlan(next);
    notify(isNew ? `Dodano "${result.exercise.name}" do ${plan[planTab].name}` : `Zapisano zmiany w "${result.exercise.name}"`);
    setModal(null);
  }

  function moveExercise(index, direction) {
    const list = plan[planTab].exercises;
    const target = index + direction;
    if (target < 0 || target >= list.length) return;
    const next = logic.clone(plan);
    const exercises = next[planTab].exercises;
    const [item] = exercises.splice(index, 1);
    exercises.splice(target, 0, item);
    commitPlan(next);
    notify('Zmieniono kolejność ćwiczeń');
  }

  function deleteExercise(index) {
    const name = plan[planTab].exercises[index].name;
    if (!window.confirm(`Czy na pewno chcesz usunąć ćwiczenie "${name}" z ${plan[planTab].name}?\n(Twoja dotychczasowa historia wyników zostanie zachowana)`)) return;
    const next = logic.clone(plan);
    next[planTab].exercises.splice(index, 1);
    commitPlan(next);
    notify('Usunięto ćwiczenie z planu');
  }

  function resetDefaultPlan() {
    if (!window.confirm('Czy na pewno chcesz przywrócić domyślny plan treningowy A/B/C?\nTwoja historia wykonanych treningów pozostanie nienaruszona!')) return;
    const next = logic.clone(DEFAULT_PLAN);
    const nextSettings = { ...settings, activePlanName: 'Domyślny Plan A/B/C' };
    setSettings(nextSettings);
    commitPlan(next, nextSettings);
    setPlanTab('A');
    notify('Przywrócono domyślny plan treningowy', 'gold');
  }

  function loadPlan(id) {
    const target = savedPlans.find(p => p.id === id);
    if (!target) return;
    setSavedPlans(logic.upsertCurrentPlan(savedPlans, settings, plan, new Date().toISOString()));
    setPlan(logic.clone(target.workouts));
    const ids = logic.workoutIds(target.workouts, target.workoutOrder);
    setPlanTab(ids[0] || 'A');
    setSettings({ ...settings, activePlanId: target.id, activePlanName: target.name, selectedStartWorkoutId: ids[0] || 'A' });
    setModal(null);
    notify(`✓ Wczytano plan: ${target.name}!`, 'gold');
  }

  function savePlanAs(mode, rawName, days = 3) {
    const name = rawName.trim();
    if (!name) {
      notify('Podaj nazwę planu', 'error');
      return;
    }
    const now = new Date().toISOString();
    const id = `plan_${Date.now()}`;
    if (mode === 'save_as') {
      setSavedPlans([...savedPlans, { id, name, createdAt: now, updatedAt: now, workouts: logic.clone(plan), workoutOrder: logic.workoutIds(plan), source: { type: 'custom' } }]);
      setSettings({ ...settings, activePlanId: id, activePlanName: name });
      notify(`✓ Zapisano plan jako: "${name}"`, 'gold');
    } else {
      const upserted = logic.upsertCurrentPlan(savedPlans, settings, plan, now);
      const empty = logic.emptyPlan(days);
      const order = logic.workoutIds(empty);
      setSavedPlans([...upserted, { id, name, createdAt: now, updatedAt: now, workouts: empty, workoutOrder: order, source: { type: 'custom' } }]);
      setPlan(empty);
      setPlanTab(order[0]);
      setSettings({ ...settings, activePlanId: id, activePlanName: name, selectedStartWorkoutId: order[0] });
      notify(`Utworzono plan: "${name}". Dodaj ćwiczenia!`, 'gold');
    }
    setModal(null);
  }

  function createPlanFromTemplate(templateId) {
    const template = PLAN_TEMPLATES.find(item => item.id === templateId);
    if (!template) return;
    const now = new Date().toISOString();
    const id = `plan_${Date.now()}`;
    const workouts = logic.clone(template.workouts);
    const order = logic.workoutIds(workouts);
    const nextPlan = {
      id,
      name: template.title,
      createdAt: now,
      updatedAt: now,
      workouts,
      workoutOrder: order,
      source: { type: 'template', templateId: template.id, version: template.version },
      availability: { type: 'included' },
    };
    const upserted = logic.upsertCurrentPlan(savedPlans, settings, plan, now);
    setSavedPlans([...upserted, nextPlan]);
    setPlan(workouts);
    setPlanTab(order[0]);
    setSettings({ ...settings, activePlanId: id, activePlanName: template.title, selectedStartWorkoutId: order[0] });
    setModal(null);
    notify(`✓ Dodano gotowy plan: ${template.title}`, 'gold');
  }

  function renamePlan(id) {
    const existing = savedPlans.find(p => p.id === id);
    if (!existing) return;
    const newName = window.prompt('Podaj nową nazwę planu:', existing.name);
    if (!newName || !newName.trim()) return;
    const name = newName.trim();
    setSavedPlans(savedPlans.map(p => (p.id === id ? { ...p, name, updatedAt: new Date().toISOString() } : p)));
    if (settings.activePlanId === id) setSettings({ ...settings, activePlanName: name });
    notify(`Zmieniono nazwę na: "${name}"`);
  }

  function duplicatePlan(id) {
    const source = savedPlans.find(p => p.id === id);
    if (!source) return;
    const now = new Date().toISOString();
    const name = `${source.name} (Kopia)`;
    setSavedPlans([...savedPlans, {
      id: `plan_${Date.now()}`,
      name,
      createdAt: now,
      updatedAt: now,
      workouts: logic.clone(source.workouts),
      workoutOrder: logic.workoutIds(source.workouts, source.workoutOrder),
      source: { type: 'copy', copiedFrom: source.id },
    }]);
    notify(`Skopiowano plan jako: "${name}"`);
  }

  function deletePlan(id) {
    if (settings.activePlanId === id) {
      notify('Nie możesz usunąć aktualnie aktywnego planu!', 'error');
      return;
    }
    const target = savedPlans.find(p => p.id === id);
    if (!target) return;
    if (!window.confirm(`Czy na pewno chcesz usunąć plan "${target.name}"?\nTwoja historia wykonanych treningów pozostanie nienaruszona!`)) return;
    setSavedPlans(savedPlans.filter(p => p.id !== id));
    notify(`Usunięto plan "${target.name}"`);
  }

  // ---- History filters (legacy section 16) ----

  function deleteSession(index) {
    if (!window.confirm('Czy na pewno chcesz usunąć ten trening z historii?')) return;
    setHistory(history.filter((_, i) => i !== index));
    notify('Usunięto sesję z historii');
  }

  // ---- Settings, backup and restore (legacy section 17) ----

  function exportData() {
    const now = new Date().toISOString();
    const upserted = logic.upsertCurrentPlan(savedPlans, settings, plan, now);
    setSavedPlans(upserted);
    const payload = { version: 'trening2026_1.1', exportDate: now, settings, plan, savedPlans: upserted, history };
    const blob = new Blob([JSON.stringify(payload, null, 2)], { type: 'application/json' });
    const url = URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.href = url;
    link.download = `trening2026_backup_${now.slice(0, 10)}.json`;
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
    URL.revokeObjectURL(url);
    notify('Wyeksportowano kopię zapasową JSON (z planami i historią)!', 'gold');
  }

  function importFile(file) {
    const reader = new FileReader();
    reader.onload = event => {
      try {
        const imported = JSON.parse(event.target.result);
        if (!imported.plan || !imported.history) throw new Error('Plik nie zawiera poprawnych danych planu lub historii');
        if (!window.confirm('Czy na pewno chcesz wczytać dane z tego pliku?\nObecne plany i historia zostaną zastąpione danymi z kopii.')) return;
        setPlan(imported.plan);
        setPlanTab(logic.workoutIds(imported.plan)[0] || 'A');
        setHistoryFilters(DEFAULT_HISTORY_FILTERS);
        setHistory(imported.history);
        if (Array.isArray(imported.savedPlans)) setSavedPlans(imported.savedPlans);
        if (imported.settings) setSettings({ ...imported.settings, legacyProgressPlanId: imported.settings.legacyProgressPlanId || imported.settings.activePlanId || 'plan_default' });
        notify('Pomyślnie wczytano kopię zapasową!', 'gold');
      } catch (error) {
        window.alert(`Błąd wczytywania pliku JSON: ${error.message}`);
      }
    };
    reader.readAsText(file);
  }

  function clearHistory() {
    if (!window.confirm('UWAGA! Czy na pewno chcesz trwale usunąć całą historię treningów?\nTej operacji nie można cofnąć!')) return;
    setHistory([]);
    notify('Historia treningów została wyczyszczona', 'error');
  }

  function toggleSetting(key, enabled, label) {
    setSettings({ ...settingsRef.current, [key]: enabled });
    notify(`${label}: ${enabled ? 'Włączone' : 'Wyłączone'}`);
  }

  // ---- Render ----

  const currentWeight = currentExercise ? currentExercise.currentWeight : 0;

  function renderModal() {
    if (!modal) return null;
    switch (modal.kind) {
      case 'exercise': {
        const existing = modal.index >= 0 ? plan[planTab].exercises[modal.index] : null;
        return (
          <ExerciseModal
            planName={plan[planTab].name}
            exercise={existing}
            onClose={() => setModal(null)}
            onSave={form => saveExercise(form, modal.index)}
          />
        );
      }
      case 'weight':
        return <WeightModal value={currentWeight} onClose={() => setModal(null)} onSave={saveWeight} />;
      case 'reps':
        return <CustomRepsModal onClose={() => setModal(null)} onSave={saveCustomReps} />;
      case 'summary':
        return <SummaryModal data={modal.data} history={history} plan={plan} settings={settings} onClose={closeSummary} />;
      case 'savedPlans':
        return (
          <SavedPlansModal
            plans={savedPlans}
            activeId={settings.activePlanId}
            onLoad={loadPlan}
            onRename={renamePlan}
            onDuplicate={duplicatePlan}
            onDelete={deletePlan}
            onCreate={() => setModal({ kind: 'savePlanAs', mode: 'create_new' })}
            onOpenTemplates={() => setModal({ kind: 'templates' })}
            onClose={() => setModal(null)}
          />
        );
      case 'templates':
        return <TemplateLibraryModal onUse={createPlanFromTemplate} onClose={() => setModal(null)} />;
      case 'savePlanAs':
        return (
          <SavePlanAsModal
            mode={modal.mode}
            defaultName={modal.mode === 'create_new' ? 'Mój Nowy Plan 3-Dniowy' : `${settings.activePlanName || 'Plan'} (Kopia)`}
            onConfirm={(name, days) => savePlanAs(modal.mode, name, days)}
            onClose={() => setModal(null)}
          />
        );
      case 'drawer':
        return session ? (
          <PlanDrawer
            session={session}
            index={exIndex}
            onSelect={selectExerciseFromDrawer}
            onClose={() => setModal(null)}
            onFinish={() => {
              setModal(null);
              promptFinish();
            }}
          />
        ) : null;
      default:
        return null;
    }
  }

  return (
    <>
      <Toast notice={notice} />

      {timer.isRunning && tab !== 'workout' && (
        <div className="floating-timer-bar" style={{ display: 'flex' }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
            <span style={{ color: 'var(--accent-gold)', fontSize: '1.1rem' }}>⏱</span>
            <span style={{ fontWeight: 800, fontSize: '0.9rem' }}>{logic.formatTime(timer.remaining)}</span>
            <span style={{ fontSize: '0.75rem', color: 'var(--text-muted)' }}>(Odpoczynek w toku)</span>
          </div>
          <button type="button" className="btn btn-primary btn-mini" onClick={() => goTab('workout')}>
            Wróć do ćwiczenia
          </button>
        </div>
      )}

      <header className="app-header">
        <div className="app-logo">
          <span className="logo-icon">🏋️</span>
          <span className="logo-title">SIŁOWNIA</span>
          <span className="logo-badge" id="headerWeekBadge">TYDZIEŃ {settings.currentWeek}</span>
        </div>
        <div className="header-right">
          {session && (
            <div id="activeWorkoutHeaderPill" className="workout-active-pill" style={{ display: 'flex' }} onClick={() => goTab('workout')}>
              <span>⚡ TRENING W TOKU</span>
            </div>
          )}
        </div>
      </header>

      <main className="main-content">
        {settings.backupReminderPending && !modal && (
          <section className="backup-reminder" role="region" aria-label="Przypomnienie o kopii zapasowej">
            <span>💾 Zrób szybką kopię swoich wyników w ustawieniach na wypadek zmiany telefonu</span>
            <button type="button" aria-label="Zamknij przypomnienie" onClick={() => setSettings(current => ({ ...current, backupReminderPending: false }))}>✕</button>
          </section>
        )}
        {tab === 'start' && (
          <StartTab
            plan={plan}
            settings={settings}
            session={session}
            onStart={startWorkout}
            onContinue={() => goTab('workout')}
            onSelect={id => setSettings({ ...settings, selectedStartWorkoutId: id })}
            onWeek={adjustWeekSetting}
          />
        )}
        {tab === 'workout' && (
          <WorkoutTab
            plan={plan}
            settings={settings}
            session={session}
            index={exIndex}
            timer={timer}
            onStart={startWorkout}
            onWeek={adjustWeekSetting}
            onOpenDrawer={() => setModal({ kind: 'drawer' })}
            onOpenWeight={() => setModal({ kind: 'weight' })}
            onAdjustWeight={adjustWeight}
            onRecord={recordSet}
            onOpenReps={() => setModal({ kind: 'reps' })}
            onRemoveSet={removeSet}
            onAddSet={addSet}
            onRemoveSetTarget={removeSetTarget}
            onNavigate={navigate}
            onFinish={promptFinish}
            onToggleTimer={() => (timerRef.current.isRunning ? pauseTimer() : startTimer(restAt(exIndex)))}
            onAdjustTimer={adjustTimer}
            onResetTimer={() => resetTimer(restAt(exIndex))}
          />
        )}
        {tab === 'plan' && (
          <PlanTab
            plan={plan}
            planTab={planTab}
            onPlanTab={setPlanTab}
            settings={settings}
            savedCount={savedPlans.length}
            onOpenSaved={() => setModal({ kind: 'savedPlans' })}
            onSaveAs={() => setModal({ kind: 'savePlanAs', mode: 'save_as' })}
            onCreate={() => setModal({ kind: 'savePlanAs', mode: 'create_new' })}
            onAdd={() => setModal({ kind: 'exercise', index: -1 })}
            onEdit={index => setModal({ kind: 'exercise', index })}
            onMove={moveExercise}
            onDelete={deleteExercise}
            onResetDefault={resetDefaultPlan}
          />
        )}
        {tab === 'history' && (
          <HistoryTab
            history={history}
            plan={plan}
            workout={historyFilters.workout}
            week={historyFilters.week}
            exerciseMode={historyFilters.exerciseMode}
            exerciseName={historyFilters.exerciseName}
            onWorkout={id => setHistoryFilters(prev => ({ ...prev, workout: id, week: 'all' }))}
            onWeek={week => setHistoryFilters(prev => ({ ...prev, week }))}
            onWeekSelect={value => setHistoryFilters(prev => ({ ...prev, week: value === 'all' ? 'all' : parseInt(value, 10) }))}
            onToggleExerciseMode={() => setHistoryFilters(prev => ({ ...prev, exerciseMode: !prev.exerciseMode }))}
            onReset={() => setHistoryFilters(DEFAULT_HISTORY_FILTERS)}
            onExerciseName={name => setHistoryFilters(prev => ({ ...prev, exerciseName: name }))}
            onDelete={deleteSession}
          />
        )}
        {tab === 'settings' && (
          <SettingsTab
            settings={settings}
            onSound={enabled => toggleSetting('soundEnabled', enabled, 'Dźwięki')}
            onVibrate={enabled => toggleSetting('vibrateEnabled', enabled, 'Wibracje')}
            onTest={() => {
              audio.testAudioAndSpeech(settingsRef.current);
              notify('🔊 Odtworzono dźwięk i lektora', 'gold');
            }}
            onExport={exportData}
            onImport={importFile}
            onClear={clearHistory}
          />
        )}
      </main>

      <nav className="bottom-nav">
        {NAV.map(([id, icon, label]) => (
          <button type="button" key={id} id={`nav-${id}`} className={`nav-item${tab === id ? ' active' : ''}`} onClick={() => goTab(id)}>
            <span className="nav-icon">{icon}</span>
            <span className="nav-label">{label}</span>
            {id === 'workout' && session && <span className="nav-badge-dot" id="navWorkoutDot" style={{ display: 'block' }} />}
          </button>
        ))}
      </nav>

      {renderModal()}
    </>
  );
}
