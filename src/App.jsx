import { useEffect, useRef, useState } from 'react';
import './styles.css';
import { DEFAULT_PLAN, PLAN_TEMPLATES } from './data.js';
import { KEYS, loadFromStorage, saveToStorage } from './storage.js';
import * as audio from './audio.js';
import * as logic from './logic.js';
import * as gdrive from './gdrive.js';
import * as xlsx from './xlsx.js';
import { useT } from './i18n.jsx';
import { THEMES, applyTheme, themeById } from './themes.js';
import {
  getStoredLang, getLang, tFor, exerciseDisplayName, workoutDisplayName, planDisplayName, templateText,
} from './i18n/core.js';
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
  PlatesModal,
  AchievementsModal,
} from './components/Modals.jsx';

const TICK_MS = 400;
const TOAST_MS = 2600;
const NAV = [
  ['start', '🏠'],
  ['workout', '🏋️'],
  ['plan', '📋'],
  ['history', '📊'],
  ['settings', '⚙️'],
];
const DEFAULT_SETTINGS = {
  currentWeek: 1,
  selectedStartWorkoutId: 'A',
  activePlanId: 'plan_default',
  activePlanName: logic.DEFAULT_PLAN_NAME,
  soundEnabled: true,
  vibrateEnabled: true,
  unit: 'kg',
  autoStartRest: false,
  theme: 'ocean',
};
const DEFAULT_HISTORY_FILTERS = { workout: 'all', week: 'all', exerciseMode: false, exerciseName: '', plan: null };

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
  settings = logic.healSuggestedWorkout(history, progress.settings, plan);
  return { plan, history, settings, weekProg: progress.weekProg, session, savedPlans };
}

// First launch: no language chosen yet and no existing user data.
function isFirstRun() {
  return !getStoredLang()
    && loadFromStorage(KEYS.history, null) === null
    && loadFromStorage(KEYS.settings, null) === null
    && loadFromStorage(KEYS.plan, null) === null;
}

function LanguageGate({ onChoose }) {
  return (
    <div className="modal-overlay" style={{ display: 'flex', zIndex: 1000 }}>
      <div className="modal-box" style={{ maxWidth: 340, textAlign: 'center' }}>
        <div style={{ fontSize: '2.5rem', marginBottom: 8 }}>🏋️</div>
        <div className="modal-title">Wybierz język<br />Choose language</div>
        <div style={{ display: 'flex', flexDirection: 'column', gap: 10, marginTop: 16 }}>
          <button type="button" id="langGatePl" className="btn btn-gold btn-large" onClick={() => onChoose('pl')}>Polski</button>
          <button type="button" id="langGateEn" className="btn btn-outline btn-large" onClick={() => onChoose('en')}>English</button>
        </div>
        <p style={{ fontSize: '0.75rem', color: 'var(--text-muted)', marginTop: 14, lineHeight: 1.4 }}>
          Język możesz później zmienić w ustawieniach.<br />
          You can change the language later in settings.
        </p>
      </div>
    </div>
  );
}

function Toast({ notice }) {
  const { t } = useT();
  const icon = notice?.type === 'error' ? '✕' : notice?.type === 'gold' ? '★' : '✓';
  return (
    <div id="notification" className={`notification${notice?.visible ? ' show' : ''} ${notice ? notice.type : ''}`}>
      <span id="notif-icon">{notice ? icon : '✓'}</span>
      <span id="notif-msg">{notice ? notice.message : t('app.notification')}</span>
    </div>
  );
}

export default function App() {
  const { t, lang, setLang } = useT();
  const [boot] = useState(readInitialState);
  const [plan, setPlan] = useState(boot.plan);
  const [history, setHistory] = useState(boot.history);
  const [settings, setSettings] = useState(boot.settings);
  const [savedPlans, setSavedPlans] = useState(boot.savedPlans);
  const [session, setSession] = useState(boot.session);
  const [tab, setTab] = useState('workout');
  const [exerciseIndex, setExerciseIndex] = useState(() => Number.isInteger(boot.session?.currentExerciseIndex) ? boot.session.currentExerciseIndex : 0);
  const [planTab, setPlanTab] = useState(() => logic.workoutIds(boot.plan)[0] || 'A');
  const [notice, setNotice] = useState(null);
  const [timer, setTimer] = useState({ isRunning: false, remaining: 0, total: 0, targetEndTime: null });
  const [modal, setModal] = useState(null);
  const [historyFilters, setHistoryFilters] = useState(DEFAULT_HISTORY_FILTERS);
  const [showLangGate, setShowLangGate] = useState(isFirstRun);

  const timerRef = useRef(timer);
  timerRef.current = timer;
  // Browsers can fire visibilitychange, focus and pageshow together when waking.
  // One deadline must finish and notify only once.
  const finishedTimerTargetRef = useRef(null);
  const settingsRef = useRef(settings);
  settingsRef.current = settings;
  const langRef = useRef(lang);
  langRef.current = lang;
  // Storage stays canonical kg; lb is a display/input layer only.
  const unit = settings.unit === 'lb' ? 'lb' : 'kg';

  const notify = (message, type = 'success') => setNotice({ message, type, visible: true, id: Date.now() + Math.random() });
  // Persist every piece of state under the legacy localStorage keys.
  useEffect(() => saveToStorage(KEYS.plan, plan), [plan]);
  useEffect(() => saveToStorage(KEYS.history, history), [history]);
  useEffect(() => saveToStorage(KEYS.settings, settings), [settings]);
  // Motyw kolorystyczny przykłada się od razu po starcie i przy każdej zmianie.
  useEffect(() => applyTheme(settings.theme), [settings.theme]);
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
      notify(t('app.weekAdvanced', { newWeek: boot.weekProg.newWeek, previousWeek: boot.weekProg.previousWeek }), 'gold');
    }
    // Runs once on mount, like the legacy initApp().
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  // Uncaught errors show a toast, like the legacy window.onerror.
  useEffect(() => {
    const onError = event => setNotice({ message: tFor(getLang())('app.error', { message: event.message }), type: 'error', visible: true, id: Date.now() + Math.random() });
    window.addEventListener('error', onError);
    return () => window.removeEventListener('error', onError);
  }, []);

  // Warn before leaving the page during an active workout.
  useEffect(() => {
    if (!session) return undefined;
    const warn = event => {
      event.preventDefault();
      event.returnValue = tFor(getLang())('app.leaveWarning');
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
    const tt = tFor(langRef.current);
    audio.soundTimerFinished(settingsRef.current);
    setTimeout(() => audio.speakVoiceNotification(settingsRef.current, tt('audio.restOver')), 450);
    audio.sendSystemNotification(tt('audio.restOverTitle'), tt('audio.restOverBody'));
    notify(tt('audio.restOverToast'), 'gold');
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

  // Treść przewija się w .main-content (okno ma stałą wysokość), więc
  // powrót na górę przy zmianie zakładki/ćwiczenia resetuje ten kontener.
  const mainContentRef = useRef(null);
  const scrollToTop = () => {
    if (mainContentRef.current) mainContentRef.current.scrollTop = 0;
    else window.scrollTo(0, 0);
  };

  const exIndex = session ? Math.min(exerciseIndex, Math.max(session.exercises.length - 1, 0)) : 0;
  const restAt = index => (session && session.exercises[index] && session.exercises[index].restSeconds) || 90;
  const currentExercise = session ? session.exercises[exIndex] : null;

  function goTab(id) {
    setTab(id);
    if (id === 'workout' && session) initExerciseTimer(restAt(exIndex));
    scrollToTop();
  }

  function startWorkout(workoutId) {
    const workout = plan[workoutId];
    if (!workout) return;
    if (session && session.workoutId === workoutId) {
      goTab('workout');
      return;
    }
    if (!workout.exercises.length) {
      notify(t('app.noExercises'), 'error');
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
      exercises: logic.createSessionExercises(workout, history, lang, unit),
    };
    setSession(next);
    setExerciseIndex(0);
    setTab('workout');
    initExerciseTimer(next.exercises[0].restSeconds || 90);
    scrollToTop();
    notify(t('app.started', { name: workoutDisplayName(workout.name, lang), week: settings.currentWeek }));
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
    scrollToTop();
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
    const bodyweight = logic.isBodyweightExercise(ex);
    const hasWeight = !bodyweight || (ex.weightEnabled ?? (Number(ex.currentWeight) > 0 || Number(ex.progressionStep) > 0));
    const weight = hasWeight ? (ex.currentWeight || 0) : 0;
    const set = { weight, reps, ...(bodyweight ? { hasWeight } : {}), ...(logic.isTimedExercise(ex) ? { measurement: 'seconds' } : {}) };
    const isPr = logic.isPersonalRecord(set, ex, history);
    patchExercise(exIndex, e => ({ completedSets: [...e.completedSets, set] }));
    audio.unlockAudioAndSpeech();
    audio.soundSetLogged(settingsRef.current);
    notify(t('app.setSaved', { set: logic.formatRecordedSet(set, ex, lang, unit) }));
    if (ex.completedSets.length + 1 >= ex.setsTarget) {
      initExerciseTimer(restAt(exIndex));
      notify(t('app.exerciseDone', { name: exerciseDisplayName(ex.name, lang) }), 'gold');
    } else {
      resetTimer(restAt(exIndex));
    }
    if (isPr) {
      setSettings(prev => ({ ...prev, prCount: (Number(prev.prCount) || 0) + 1 }));
      notify(t('app.newPr', { value: logic.formatRecordedSet(set, ex, lang, unit) }), 'gold');
    }
    if (settingsRef.current.autoStartRest) {
      resetTimer(restAt(exIndex));
      startTimer(restAt(exIndex));
    }
  }

  function removeSet(setIndex) {
    if (!session) return;
    patchExercise(exIndex, e => ({ completedSets: e.completedSets.filter((_, i) => i !== setIndex) }));
    initExerciseTimer(restAt(exIndex));
    notify(t('app.setRemoved'));
  }

  function addSet() {
    if (!currentExercise) return;
    patchExercise(exIndex, e => ({ setsTarget: e.setsTarget + 1 }));
    initExerciseTimer(restAt(exIndex));
    notify(t('app.setAdded', { count: currentExercise.setsTarget + 1 }));
  }

  function removeSetTarget() {
    if (!currentExercise) return;
    if (currentExercise.setsTarget <= 1) {
      notify(t('app.minSets'), 'error');
      return;
    }
    patchExercise(exIndex, e => ({
      setsTarget: e.setsTarget - 1,
      completedSets: e.completedSets.length >= e.setsTarget ? e.completedSets.slice(0, -1) : e.completedSets,
    }));
    initExerciseTimer(restAt(exIndex));
    notify(t('app.setsReduced', { count: currentExercise.setsTarget - 1 }));
  }

  function adjustWeight(delta) {
    if (!session) return;
    patchExercise(exIndex, e => ({ currentWeight: logic.clampWeight(Number(((e.currentWeight || 0) + logic.fromDisplayWeight(delta, unit)).toFixed(2))) }));
    audio.playTone(settingsRef.current, 440, 0.04, 'sine', 0.05);
  }

  function saveWeight(text) {
    const value = logic.fromDisplayWeight(logic.parseWeightInput(text), unit);
    if (isNaN(value) || value < 0) {
      notify(t('app.invalidWeight'), 'error');
      return;
    }
    patchExercise(exIndex, () => ({ currentWeight: value }));
    initExerciseTimer(restAt(exIndex));
    setModal(null);
    notify(t('app.weightSet', { weight: logic.formatWeightDisplay(value, lang, unit), unit }));
  }

  function changeUnit(nextUnit) {
    setSettings({ ...settingsRef.current, unit: nextUnit });
    // Refresh precomputed "last result" texts so an active session follows the unit.
    setSession(prev => (prev ? {
      ...prev,
      exercises: prev.exercises.map(ex => ({ ...ex, lastSummary: logic.calculateProgression(history, ex, lang, nextUnit).lastSummaryText })),
    } : prev));
    notify(t('app.unitChanged', { unit: nextUnit }), 'gold');
  }

  function saveCustomReps(text) {
    const value = parseInt(text, 10);
    if (!isNaN(value) && value > 0) {
      setModal(null);
      recordSet(value);
    } else {
      notify(t('app.invalidReps'), 'error');
    }
  }

  function adjustWeekSetting(delta) {
    const week = Math.max(1, (settings.currentWeek || 1) + delta);
    setSettings({ ...settings, currentWeek: week });
    notify(t('app.weekSet', { week }), 'gold');
  }

  // ---- Finishing a workout (legacy section 14) ----

  function promptFinish() {
    if (!session) return;
    const anySets = session.exercises.some(e => e.completedSets && e.completedSets.length > 0);
    if (!anySets) {
      if (window.confirm(t('app.confirmCancelNoSets'))) {
        setSession(null);
        setTab('workout');
        notify(t('app.cancelled'));
      }
      return;
    }
    if (window.confirm(t('app.confirmFinish'))) finishWorkout();
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
    const finalSettings = {
      ...nextSettings,
      completedWorkoutCount,
      backupReminderPending: Boolean(settings.backupReminderPending) || completedWorkoutCount % 20 === 0,
    };
    setHistory(nextHistory);
    setSettings(finalSettings);
    setSession(null);
    setTimer(prev => ({ ...prev, isRunning: false, targetEndTime: null }));
    audio.playTone(settingsRef.current, 523.25, 0.3, 'sine', 0.2);
    setModal({ kind: 'summary', data: { name: session.workoutName, week: session.week, sets: totalSets, volume, weekProg, record } });

    // Cicha automatyczna kopia na Google Drive po skończonym treningu.
    const drive = settings.googleDrive || {};
    if (drive.autoBackup && drive.email) {
      driveBackupNow({ silent: true, historyOverride: nextHistory, settingsOverride: finalSettings });
    }
  }

  function closeSummary() {
    setModal(null);
    setTab('history');
    scrollToTop();
    notify(t('app.savedOk'), 'gold');
  }

  // ---- Plans (legacy section 15) ----

  function commitPlan(nextPlan, nextSettings = settings) {
    setPlan(nextPlan);
    setSavedPlans(logic.upsertCurrentPlan(savedPlans, nextSettings, nextPlan, new Date().toISOString()));
  }

  function saveExercise(form, index) {
    const isNew = index < 0;
    const existingId = isNew ? null : plan[planTab].exercises[index].id;
    const result = logic.exerciseFromForm(form, existingId, Date.now(), lang, unit);
    if (result.error) {
      notify(result.error, 'error');
      return;
    }
    const next = logic.clone(plan);
    if (isNew) next[planTab].exercises.push(result.exercise);
    else next[planTab].exercises[index] = result.exercise;
    commitPlan(next);
    notify(isNew
      ? t('app.exerciseAdded', { name: exerciseDisplayName(result.exercise.name, lang), plan: workoutDisplayName(plan[planTab].name, lang) })
      : t('app.exerciseSaved', { name: exerciseDisplayName(result.exercise.name, lang) }));
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
    notify(t('app.orderChanged'));
  }

  function deleteExercise(index) {
    const name = plan[planTab].exercises[index].name;
    if (!window.confirm(t('app.confirmDeleteExercise', { name: exerciseDisplayName(name, lang), plan: workoutDisplayName(plan[planTab].name, lang) }))) return;
    const next = logic.clone(plan);
    next[planTab].exercises.splice(index, 1);
    commitPlan(next);
    notify(t('app.exerciseDeleted'));
  }

  function resetDefaultPlan() {
    if (!window.confirm(t('app.confirmResetPlan'))) return;
    const next = logic.clone(DEFAULT_PLAN);
    const nextSettings = { ...settings, activePlanName: 'Domyślny Plan A/B/C' };
    setSettings(nextSettings);
    commitPlan(next, nextSettings);
    setPlanTab('A');
    notify(t('app.planReset'), 'gold');
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
    notify(t('app.planLoaded', { name: planDisplayName(target.name, lang) }), 'gold');
  }

  function savePlanAs(mode, rawName, days = 3) {
    const name = rawName.trim();
    if (!name) {
      notify(t('app.enterPlanName'), 'error');
      return;
    }
    const now = new Date().toISOString();
    const id = `plan_${Date.now()}`;
    if (mode === 'save_as') {
      setSavedPlans([...savedPlans, { id, name, createdAt: now, updatedAt: now, workouts: logic.clone(plan), workoutOrder: logic.workoutIds(plan), source: { type: 'custom' } }]);
      setSettings({ ...settings, activePlanId: id, activePlanName: name });
      notify(t('app.planSavedAs', { name }), 'gold');
    } else {
      const upserted = logic.upsertCurrentPlan(savedPlans, settings, plan, now);
      const empty = logic.emptyPlan(days);
      const order = logic.workoutIds(empty);
      setSavedPlans([...upserted, { id, name, createdAt: now, updatedAt: now, workouts: empty, workoutOrder: order, source: { type: 'custom' } }]);
      setPlan(empty);
      setPlanTab(order[0]);
      setSettings({ ...settings, activePlanId: id, activePlanName: name, selectedStartWorkoutId: order[0] });
      notify(t('app.planCreated', { name }), 'gold');
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
    notify(t('app.templateAdded', { name: templateText(template, lang).title }), 'gold');
  }

  function renamePlan(id) {
    const existing = savedPlans.find(p => p.id === id);
    if (!existing) return;
    const newName = window.prompt(t('app.enterNewPlanName'), existing.name);
    if (!newName || !newName.trim()) return;
    const name = newName.trim();
    setSavedPlans(savedPlans.map(p => (p.id === id ? { ...p, name, updatedAt: new Date().toISOString() } : p)));
    if (settings.activePlanId === id) setSettings({ ...settings, activePlanName: name });
    notify(t('app.renamed', { name }));
  }

  function duplicatePlan(id) {
    const source = savedPlans.find(p => p.id === id);
    if (!source) return;
    const now = new Date().toISOString();
    const name = `${source.name} ${t('common.copySuffix')}`;
    setSavedPlans([...savedPlans, {
      id: `plan_${Date.now()}`,
      name,
      createdAt: now,
      updatedAt: now,
      workouts: logic.clone(source.workouts),
      workoutOrder: logic.workoutIds(source.workouts, source.workoutOrder),
      source: { type: 'copy', copiedFrom: source.id },
    }]);
    notify(t('app.planCopied', { name }));
  }

  function deletePlan(id) {
    if (settings.activePlanId === id) {
      notify(t('app.cannotDeleteActive'), 'error');
      return;
    }
    const target = savedPlans.find(p => p.id === id);
    if (!target) return;
    if (!window.confirm(t('app.confirmDeletePlan', { name: planDisplayName(target.name, lang) }))) return;
    setSavedPlans(savedPlans.filter(p => p.id !== id));
    notify(t('app.planDeleted', { name: planDisplayName(target.name, lang) }));
  }

  // ---- History filters (legacy section 16) ----

  function deleteSession(index) {
    if (!window.confirm(t('app.confirmDeleteSession'))) return;
    setHistory(history.filter((_, i) => i !== index));
    notify(t('app.sessionDeleted'));
  }

  // ---- Settings, backup and restore (legacy section 17) ----

  function exportData() {
    const now = new Date().toISOString();
    const upserted = logic.upsertCurrentPlan(savedPlans, settings, plan, now);
    setSavedPlans(upserted);
    const payload = logic.buildBackupPayload({ settings, plan, savedPlans: upserted, history }, now);
    const blob = new Blob([JSON.stringify(payload, null, 2)], { type: 'application/json' });
    const url = URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.href = url;
    link.download = `trening2026_backup_${now.slice(0, 10)}.json`;
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
    URL.revokeObjectURL(url);
    notify(t('app.exported'), 'gold');
  }

  function exportCsv(sessionsToExport = history) {
    if (!sessionsToExport || sessionsToExport.length === 0) {
      notify(t('app.exportCsvEmpty'), 'error');
      return;
    }
    const now = new Date().toISOString();
    const csv = logic.historyToCsv(sessionsToExport, { lang, unit, savedPlans, settings });
    const blob = new Blob([csv], { type: 'text/csv;charset=utf-8' });
    const url = URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.href = url;
    link.download = `trening_historia_${now.slice(0, 10)}.csv`;
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
    URL.revokeObjectURL(url);
    notify(t('app.exportedCsv'), 'gold');
  }

  function exportXlsx(sessionsToExport = history) {
    if (!sessionsToExport || sessionsToExport.length === 0) {
      notify(t('app.exportCsvEmpty'), 'error');
      return;
    }
    const now = new Date().toISOString();
    const sheets = logic.historyXlsxSheets(sessionsToExport, { lang, unit, savedPlans, settings })
      .map(sheet => ({ ...sheet, xml: xlsx.sheetXml(sheet) }));
    const bytes = xlsx.buildXlsx(sheets);
    const blob = new Blob([bytes], { type: 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet' });
    const url = URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.href = url;
    link.download = `trening_historia_${now.slice(0, 10)}.xlsx`;
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
    URL.revokeObjectURL(url);
    notify(t('app.exportedXlsx'), 'gold');
  }

  // Wspólne stosowanie kopii dla pliku JSON i przywracania z Google Drive.
  function applyImportedBackup(imported) {
    if (!imported.plan || !imported.history) throw new Error(t('app.importInvalid'));
    setPlan(imported.plan);
    setPlanTab(logic.workoutIds(imported.plan)[0] || 'A');
    setHistoryFilters(DEFAULT_HISTORY_FILTERS);
    setHistory(imported.history);
    if (Array.isArray(imported.savedPlans)) setSavedPlans(imported.savedPlans);
    if (imported.settings) {
      // Logowanie Google jest per urządzenie — przywrócenie kopii z innego
      // urządzenia nie może rozłączać obecnego logowania na tym urządzeniu.
      setSettings({
        ...imported.settings,
        googleDrive: (settingsRef.current && settingsRef.current.googleDrive) || imported.settings.googleDrive || null,
        legacyProgressPlanId: imported.settings.legacyProgressPlanId || imported.settings.activePlanId || 'plan_default',
      });
    }
  }

  function importFile(file) {
    const reader = new FileReader();
    reader.onload = event => {
      try {
        const imported = JSON.parse(event.target.result);
        if (!imported.plan || !imported.history) throw new Error(t('app.importInvalid'));
        if (!window.confirm(t('app.confirmImport'))) return;
        applyImportedBackup(imported);
        notify(t('app.imported'), 'gold');
      } catch (error) {
        window.alert(t('app.importError', { message: error.message }));
      }
    };
    reader.readAsText(file);
  }

  function clearHistory() {
    if (!window.confirm(t('app.confirmClearHistory'))) return;
    setHistory([]);
    notify(t('app.historyCleared'), 'error');
  }

  // ---- Kopia w chmurze na Google Drive (panel na Pulpicie) ----

  function driveState() {
    return settings.googleDrive || {};
  }

  const [driveBusy, setDriveBusy] = useState(null);

  function setDriveData(patch) {
    setSettings(prev => ({ ...prev, googleDrive: { ...(prev.googleDrive || {}), ...patch } }));
  }

  async function driveLogin() {
    setDriveBusy('login');
    try {
      const token = await gdrive.requestToken({ clientId: gdrive.CLIENT_ID });
      const info = await gdrive.fetchUserInfo(token);
      setDriveData({ email: info.email, name: info.name });
      notify(t('app.driveLoginOk', { email: info.email }), 'gold');
    } catch (error) {
      notify(t('app.driveLoginError'), 'error');
    } finally {
      setDriveBusy(null);
    }
  }

  function driveLogout() {
    gdrive.clearToken(gdrive.CLIENT_ID);
    setDriveData({ email: null, name: null, autoBackup: false });
    notify(t('app.driveLoggedOut'));
  }

  function toggleDriveAuto(enabled) {
    if (enabled && !driveState().email) {
      notify(t('app.driveNotConnected'), 'error');
      return;
    }
    setDriveData({ autoBackup: enabled });
    notify(t('app.toggled', { label: t('settings.driveAutoBackup'), state: enabled ? t('app.on') : t('app.off') }));
  }

  // historyOverride/settingsOverride: auto-kopia po treningu przekazuje
  // świeżo policzone dane (setState jest asynchroniczne).
  async function driveBackupNow({ silent = false, historyOverride = null, settingsOverride = null } = {}) {
    const drive = driveState();
    if (!drive.email) {
      if (!silent) notify(t('app.driveNotConnected'), 'error');
      return false;
    }
    const currentSettings = settingsOverride || settingsRef.current;
    const currentHistory = historyOverride !== null ? historyOverride : history;
    const now = new Date().toISOString();
    try {
      const token = await gdrive.requestToken({ clientId: gdrive.CLIENT_ID });
      const existing = await gdrive.findBackupFile(token);
      const upserted = logic.upsertCurrentPlan(savedPlans, currentSettings, plan, now);
      setSavedPlans(upserted);
      const payload = logic.buildBackupPayload({ settings: currentSettings, plan, savedPlans: upserted, history: currentHistory }, now);
      await gdrive.uploadBackupFile(token, { fileId: existing ? existing.id : null, content: JSON.stringify(payload) });
      setSettings(prev => ({ ...prev, googleDrive: { ...(prev.googleDrive || {}), lastBackupAt: now } }));
      notify(t('app.driveBackupOk'), 'gold');
      return true;
    } catch (error) {
      notify(t('app.driveBackupError'), 'error');
      return false;
    }
  }

  // ---- Udostępnianie podsumowania treningu (Web Share / schowek) ----

  async function shareSession(record) {
    if (!record) return;
    const text = logic.buildShareText(record, lang, unit);
    const title = 'Trening 2026';
    try {
      if (navigator.share) {
        await navigator.share({ title, text });
        return;
      }
      await navigator.clipboard.writeText(text);
      notify(t('share.copied'), 'gold');
    } catch (error) {
      // Schowane okno wyboru aplikacji to nie błąd.
      if (error && (error.name === 'AbortError' || error.name === 'NotAllowedError')) return;
      window.prompt(t('share.promptTitle'), text);
    }
  }

  async function driveRestore() {
    if (!driveState().email) {
      notify(t('app.driveNotConnected'), 'error');
      return;
    }
    setDriveBusy('restore');
    try {
      const token = await gdrive.requestToken({ clientId: gdrive.CLIENT_ID });
      const file = await gdrive.findBackupFile(token);
      if (!file) {
        notify(t('app.driveRestoreEmpty'), 'error');
        return;
      }
      const imported = await gdrive.downloadBackupFile(token, file.id);
      if (!imported.plan || !imported.history) throw new Error('invalid');
      if (!window.confirm(t('app.driveConfirmRestore'))) return;
      applyImportedBackup(imported);
      notify(t('app.driveRestored'), 'gold');
    } catch (error) {
      notify(t('app.driveRestoreError'), 'error');
    } finally {
      setDriveBusy(null);
    }
  }

  function toggleSetting(key, enabled, label) {
    setSettings({ ...settingsRef.current, [key]: enabled });
    notify(t('app.toggled', { label, state: enabled ? t('app.on') : t('app.off') }));
  }

  function changeTheme(id) {
    if (!THEMES.some(theme => theme.id === id)) return;
    setSettings({ ...settingsRef.current, theme: id });
    notify(t('app.themeChanged', { name: t(themeById(id).key) }), 'gold');
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
            unit={unit}
            onClose={() => setModal(null)}
            onSave={form => saveExercise(form, modal.index)}
          />
        );
      }
      case 'weight':
        return <WeightModal value={currentWeight} unit={unit} onClose={() => setModal(null)} onSave={saveWeight} />;
      case 'plates':
        return <PlatesModal weightKg={currentWeight} unit={unit} mode={modal.mode} onClose={() => setModal(null)} />;
      case 'achievements':
        return <AchievementsModal history={history} settings={settings} onClose={() => setModal(null)} />;
      case 'reps':
        return <CustomRepsModal timed={currentExercise ? logic.isTimedExercise(currentExercise) : false} onClose={() => setModal(null)} onSave={saveCustomReps} />;
      case 'summary':
        return <SummaryModal data={modal.data} history={history} plan={plan} settings={settings} onClose={closeSummary} onShare={() => shareSession(modal.data.record)} />;
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
            defaultName={modal.mode === 'create_new'
              ? planDisplayName('Mój Nowy Plan 3-Dniowy', lang)
              : `${planDisplayName(settings.activePlanName || 'Plan', lang)} ${t('common.copySuffix')}`}
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
            <span style={{ fontSize: '0.75rem', color: 'var(--text-muted)' }}>{t('app.restInProgress')}</span>
          </div>
          <button type="button" className="btn btn-primary btn-mini" onClick={() => goTab('workout')}>
            {t('app.backToExercise')}
          </button>
        </div>
      )}

      <header className="app-header">
        <div className="app-logo">
          <span className="logo-icon" aria-hidden="true">
            <img src="./logo-96.png" alt="" draggable="false" />
          </span>
          <span className="logo-title">{t('app.logo')}</span>
          <span className="logo-badge" id="headerWeekBadge">{t('app.weekBadge', { week: settings.currentWeek })}</span>
        </div>
        <div className="header-right">
          {session && (
            <div id="activeWorkoutHeaderPill" className="workout-active-pill" style={{ display: 'flex' }} onClick={() => goTab('workout')}>
              <span>{t('app.workoutInProgress')}</span>
            </div>
          )}
        </div>
      </header>

      <main className="main-content" ref={mainContentRef}>
        {settings.backupReminderPending && !modal && (
          <section className="backup-reminder" role="region" aria-label={t('app.backupReminderLabel')}>
            <span>{t('app.backupReminder')}</span>
            <button type="button" aria-label={t('app.closeReminder')} onClick={() => setSettings(current => ({ ...current, backupReminderPending: false }))}>✕</button>
          </section>
        )}
        {tab === 'start' && (
          <StartTab
            settings={settings}
            session={session}
            history={history}
            drive={settings.googleDrive || null}
            onContinue={() => goTab('workout')}
            onOpenSettings={() => goTab('settings')}
            onOpenAchievements={() => setModal({ kind: 'achievements' })}
            onDriveLogin={driveLogin}
            onDriveBackup={() => driveBackupNow()}
            onDriveRestore={driveRestore}
            onDriveAuto={toggleDriveAuto}
            onDriveLogout={driveLogout}
            driveBusy={driveBusy}
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
            onSelect={id => setSettings({ ...settings, selectedStartWorkoutId: id })}
            onWeek={adjustWeekSetting}
            onOpenDrawer={() => setModal({ kind: 'drawer' })}
            onOpenWeight={() => setModal({ kind: 'weight' })}
            onAdjustWeight={adjustWeight}
            onToggleWeight={enabled => patchExercise(exIndex, () => ({ weightEnabled: enabled }))}
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
            onOpenPlates={mode => setModal({ kind: 'plates', mode })}
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
            unit={unit}
            workout={historyFilters.workout}
            week={historyFilters.week}
            exerciseMode={historyFilters.exerciseMode}
            exerciseName={historyFilters.exerciseName}
            planFilter={historyFilters.plan ?? settings.activePlanId}
            savedPlans={savedPlans}
            settings={settings}
            onPlan={id => setHistoryFilters(prev => ({ ...prev, plan: id, week: 'all' }))}
            onWorkout={id => setHistoryFilters(prev => ({ ...prev, workout: id, week: 'all' }))}
            onWeek={week => setHistoryFilters(prev => ({ ...prev, week }))}
            onWeekSelect={value => setHistoryFilters(prev => ({ ...prev, week: value === 'all' ? 'all' : parseInt(value, 10) }))}
            onToggleExerciseMode={() => setHistoryFilters(prev => ({ ...prev, exerciseMode: !prev.exerciseMode }))}
            onReset={() => setHistoryFilters(DEFAULT_HISTORY_FILTERS)}
            onExerciseName={name => setHistoryFilters(prev => ({ ...prev, exerciseName: name }))}
            onDelete={deleteSession}
            onExportCsv={exportCsv}
            onExportXlsx={exportXlsx}
            onShare={shareSession}
          />
        )}
        {tab === 'settings' && (
          <SettingsTab
            settings={settings}
            onSound={enabled => toggleSetting('soundEnabled', enabled, t('app.soundsLabel'))}
            onVibrate={enabled => toggleSetting('vibrateEnabled', enabled, t('app.vibrateLabel'))}
            onTest={() => {
              audio.testAudioAndSpeech(settingsRef.current);
              notify(t('app.testPlayed'), 'gold');
            }}
            onExport={exportData}
            onExportCsv={() => exportCsv(history)}
            onExportXlsx={() => exportXlsx(history)}
            onImport={importFile}
            onClear={clearHistory}
            onUnit={changeUnit}
            onAutoRest={enabled => toggleSetting('autoStartRest', enabled, t('settings.autoRest'))}
            activeTheme={settings.theme || 'ocean'}
            onTheme={changeTheme}
          />
        )}
      </main>

      <nav className="bottom-nav">
        {NAV.map(([id, icon]) => (
          <button type="button" key={id} id={`nav-${id}`} className={`nav-item${tab === id ? ' active' : ''}`} onClick={() => goTab(id)}>
            <span className="nav-icon">{icon}</span>
            <span className="nav-label">{t(`app.nav.${id}`)}</span>
            {id === 'workout' && session && <span className="nav-badge-dot" id="navWorkoutDot" style={{ display: 'block' }} />}
          </button>
        ))}
      </nav>

      {renderModal()}
      {showLangGate && <LanguageGate onChoose={chosen => { setLang(chosen); setShowLangGate(false); }} />}
    </>
  );
}
