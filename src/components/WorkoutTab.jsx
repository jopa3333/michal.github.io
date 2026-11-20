import { formatRecordedSet, formatTime, formatWeightDisplay, isBodyweightExercise, isTimedExercise, repButtonValues, repsDisplay, workoutIds } from '../logic.js';
import { useT } from '../i18n.jsx';
import { exerciseDisplayName, workoutDisplayName } from '../i18n/core.js';

const fmt = formatWeightDisplay;

const WEIGHT_STEPS = [
  [-2.5, 'step-minus'],
  [-1, 'step-minus'],
  [-0.5, 'step-minus'],
  [0.5, 'step-plus'],
  [1, 'step-plus'],
  [2.5, 'step-plus'],
];

function timerClass(timer) {
  if (timer.isRunning) return 'timer-btn-main timer-running';
  if (timer.remaining === 0 && timer.total > 0) return 'timer-btn-main timer-done';
  return 'timer-btn-main';
}

function timerLabel(timer, t) {
  if (timer.isRunning) return { icon: '⏳', text: formatTime(timer.remaining) };
  if (timer.remaining === 0 && timer.total > 0) return { icon: '🔔', text: t('workout.restOver') };
  return { icon: '⏱', text: t('workout.startTimer', { time: formatTime(timer.remaining) }) };
}

export function WorkoutTab(props) {
  const { session } = props;
  return session ? <ActiveWorkout {...props} /> : <WorkoutPicker {...props} />;
}

function WorkoutPicker({ plan, settings, onStart, onWeek }) {
  const { t, lang } = useT();
  return (
    <section className="tab-view active" id="view-workout">
      <div id="workoutSelectionContainer">
        <div style={{ marginBottom: 16, display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
          <h2 style={{ fontSize: '1.3rem', fontWeight: 800, color: '#fff' }}>{t('workout.choose')}</h2>
          <div className="week-stepper">
            <button type="button" className="stepper-btn" onClick={() => onWeek(-1)}>−</button>
            <span className="stepper-val">{t('workout.weekBadge', { week: settings.currentWeek })}</span>
            <button type="button" className="stepper-btn" onClick={() => onWeek(1)}>+</button>
          </div>
        </div>

        <div className="workout-picker-grid">
          {workoutIds(plan).map(id => {
            const workout = plan[id];
            if (!workout) return null;
            const names = workout.exercises.map(e => exerciseDisplayName(e.name, lang)).slice(0, 4).join(', ') + (workout.exercises.length > 4 ? '...' : '');
            return (
              <div className="workout-choice-card" key={id} onClick={() => onStart(id)}>
                <div className="w-card-header">
                  <span className="w-card-title">{workoutDisplayName(workout.name, lang)}</span>
                  <span className="badge badge-gold">{t('common.exercisesCount', { count: workout.exercises.length })}</span>
                </div>
                <div className="w-card-exercises">{names}</div>
                <button
                  type="button"
                  className="btn btn-gold btn-large"
                  style={{ marginTop: 8 }}
                  onClick={event => {
                    event.stopPropagation();
                    onStart(id);
                  }}
                >
                  {t('workout.start')}
                </button>
              </div>
            );
          })}
        </div>
      </div>
    </section>
  );
}

function ActiveWorkout(props) {
  const {
    session, index, timer, onOpenDrawer, onOpenWeight, onAdjustWeight, onToggleWeight, onRecord, onOpenReps,
    onRemoveSet, onAddSet, onRemoveSetTarget, onNavigate, onFinish, onToggleTimer, onAdjustTimer, onResetTimer,
  } = props;
  const { t, lang } = useT();
  const ex = session.exercises[index];
  const bodyweight = isBodyweightExercise(ex);
  const weightEnabled = !bodyweight || (ex.weightEnabled ?? (Number(ex.currentWeight) > 0 || Number(ex.progressionStep) > 0));
  const timed = isTimedExercise(ex);
  const completed = ex.completedSets.length;
  const isCompleted = completed >= ex.setsTarget;
  const isLast = index === session.exercises.length - 1;
  const next = isCompleted
    ? isLast
      ? { label: t('workout.finishUpper'), action: onFinish }
      : { label: t('workout.nextUpper'), action: () => onNavigate(1) }
    : isLast
      ? { label: t('workout.summarize'), action: onFinish }
      : { label: t('workout.next'), action: () => onNavigate(1) };
  const timerText = timerLabel(timer, t);
  const unit = timed ? t('common.secondsShort') : t('common.reps');

  return (
    <section className="tab-view active" id="view-workout">
      <div id="workoutActiveAssistant">
        <div className="assistant-topbar">
          <div className="assistant-ex-count" id="assistantExerciseCounter">
            {t('workout.exerciseCounter', { index: index + 1, total: session.exercises.length })}
          </div>
          <button type="button" className="btn-plan-toggle" onClick={onOpenDrawer}>
            <span>{t('workout.planToggle')}</span>
          </button>
        </div>

        <div className="exercise-main-card">
          <div className="exercise-header-compact">
            <h2 className="exercise-name-header">{exerciseDisplayName(ex.name, lang)}</h2>
            <div className="exercise-tags">
              <span className="tag">{t('workout.setsTag', { sets: ex.setsTarget, reps: repsDisplay(ex), unit })}</span>
              <span className="tag tag-tempo">{t('workout.tempoTag', { tempo: ex.tempo || '2010' })}</span>
              <span className="tag">{t('workout.restTag', { seconds: ex.restSeconds || 90 })}</span>
            </div>
          </div>

          <div className="exercise-info-strip">
            <div className="info-strip-col prev">
              <span className="strip-lbl">{t('workout.last')}</span>
              <span className="strip-val">{ex.lastSummary || t('common.noPreviousResult')}</span>
            </div>
            {weightEnabled && <div className={`info-strip-col target${ex.isProgressionHit ? ' progres-hit' : ''}`}>
              <span className="strip-lbl">{ex.isProgressionHit ? t('workout.todayHit') : t('workout.today')}</span>
              <div className="strip-val-row">
                <span className="strip-val">
                  {ex.isProgressionHit || ex.suggestedWeight > 0 ? `${fmt(ex.suggestedWeight, lang)} kg` : t('workout.chooseWeight')}
                </span>
                {ex.isProgressionHit && (
                  <span className="progres-badge" style={{ display: 'inline-flex' }}>
                    +{fmt(ex.progressionStep, lang)} kg
                  </span>
                )}
              </div>
            </div>}
          </div>

          {bodyweight && <label className="weight-toggle"><input type="checkbox" checked={weightEnabled} onChange={event => onToggleWeight(event.target.checked)} /> {t('workout.extraWeight')}</label>}
          {weightEnabled && <div className="weight-adjuster-section">
            <div className="weight-display-wrapper">
              <button type="button" className="weight-display-btn" onClick={onOpenWeight} title={t('workout.enterManually')}>
                <span>{fmt(ex.currentWeight, lang)}</span>
                <span className="weight-unit">kg</span>
              </button>
            </div>
            <div className="weight-quick-buttons">
              {WEIGHT_STEPS.map(([delta, cls]) => (
                <button type="button" key={delta} className={`btn-step ${cls}`} onClick={() => onAdjustWeight(delta)}>
                  {delta < 0 ? '−' : '+'}{fmt(Math.abs(delta), lang)}
                </button>
              ))}
            </div>
          </div>}

          <div className="sets-progress-box">
            <div className="sets-header">
              <span>{t('workout.setsHeader')}</span>
              <div style={{ display: 'flex', alignItems: 'center', gap: 6 }}>
                <span>{t('workout.setsProgress', { done: completed, target: ex.setsTarget })}</span>
                <button type="button" className="btn btn-outline btn-mini btn-set-step" onClick={onRemoveSetTarget} title={t('workout.removeSetTitle')}>
                  {t('workout.minusSet')}
                </button>
                <button type="button" className="btn btn-outline btn-mini btn-set-step" onClick={onAddSet} title={t('workout.addSetTitle')}>
                  {t('workout.plusSet')}
                </button>
              </div>
            </div>
            <div className="sets-list">
              {Array.from({ length: ex.setsTarget }, (_, i) => {
                const setNumber = i + 1;
                if (i < completed) {
                  const set = ex.completedSets[i];
                  return (
                    <div className="set-row completed" key={`set-${i}`}>
                      <div>
                        <span className="set-status-icon" style={{ color: 'var(--success-green)' }}>✓</span>{' '}
                        <span>{setNumber}. <strong>{formatRecordedSet(set, ex, lang)}</strong></span>
                      </div>
                      <button type="button" className="set-actions-btn" onClick={() => onRemoveSet(i)} title={t('workout.removeSetTitle')}>
                        {t('workout.removeSet')}
                      </button>
                    </div>
                  );
                }
                if (i === completed) {
                  return (
                    <div className="set-row active" key={`set-${i}`}>
                      <div>
                        <span className="set-status-icon">○</span>{' '}
                        <span>{setNumber}. <strong>{weightEnabled ? `${fmt(ex.currentWeight, lang)} kg × ?${timed ? ' s' : ''}` : `? ${timed ? 's' : t('common.reps')}`}</strong></span>
                      </div>
                      <span style={{ fontSize: '0.75rem', textTransform: 'uppercase', color: 'var(--accent-gold)' }}>{t('workout.current')}</span>
                    </div>
                  );
                }
                return (
                  <div className="set-row" key={`set-${i}`}>
                    <div>
                      <span className="set-status-icon" style={{ color: 'var(--text-muted)' }}>○</span>{' '}
                      <span>
                        {setNumber}. <span style={{ color: 'var(--text-muted)' }}>{weightEnabled ? `${fmt(ex.currentWeight, lang)} kg × ?${timed ? ' s' : ''}` : `? ${timed ? 's' : t('common.reps')}`}</span>
                      </span>
                    </div>
                    <span style={{ fontSize: '0.75rem', color: 'var(--text-muted)' }}>{t('workout.waiting')}</span>
                  </div>
                );
              })}
            </div>
          </div>

          {isCompleted && (
            <div className="exercise-completed-banner" style={{ display: 'block' }}>
              {t('workout.doneBanner', { done: completed, target: ex.setsTarget })}
            </div>
          )}

          <div className="reps-picker-container">
            <div className="reps-buttons-grid">
              {(timed ? [15, 30, 45, 60, 75, 90] : repButtonValues(ex)).map(value => (
                <button type="button" key={value} className={value === 'MAX' ? 'rep-btn rep-max' : 'rep-btn'} onClick={() => onRecord(value)}>
                  {value}{timed ? ' s' : ''}
                </button>
              ))}
              <button type="button" className="rep-btn-custom" onClick={onOpenReps}>
                {timed ? t('workout.enterTime') : t('workout.other')}
              </button>
            </div>
          </div>

          <div className="rest-timer-box">
            <button type="button" className={timerClass(timer)} onClick={onToggleTimer}>
              <span>{timerText.icon}</span>
              <span>{timerText.text}</span>
            </button>
            <div className="timer-controls">
              <button type="button" className="timer-ctrl-btn" onClick={() => onAdjustTimer(-30)}>−30s</button>
              <button type="button" className="timer-ctrl-btn" onClick={() => onAdjustTimer(30)}>+30s</button>
              <button type="button" className="timer-ctrl-btn" onClick={onResetTimer} title={t('workout.resetTimerTitle')}>↺</button>
            </div>
          </div>

          <div className="exercise-nav-footer">
            <button type="button" className="btn-prev-ex" onClick={() => onNavigate(-1)}>{t('workout.previous')}</button>
            <button type="button" className={`btn-next-ex${isCompleted ? ' completed-prompt' : ''}`} onClick={next.action}>
              {next.label}
            </button>
          </div>
        </div>

        <button type="button" className="btn-finish-link" onClick={onFinish}>
          {t('workout.finishLink')}
        </button>
      </div>
    </section>
  );
}
