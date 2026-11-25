import { formatRecordedSet, formatTime, formatWeightDisplay, isBodyweightExercise, isTimedExercise, plateModeForExercise, repButtonValues, repsDisplay, weightStepValues, workoutIds } from '../logic.js';
import { useT } from '../i18n.jsx';
import { exerciseDisplayName, workoutDisplayName } from '../i18n/core.js';

const fmt = formatWeightDisplay;

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

// Pre-start screen: 1:1 the hero layout that used to live in StartTab.
function WorkoutPicker({ plan, settings, onStart, onSelect, onWeek }) {
  const { t, lang } = useT();
  const ids = workoutIds(plan);
  const workoutId = ids.includes(settings.selectedStartWorkoutId) ? settings.selectedStartWorkoutId : ids[0];
  const workout = plan[workoutId];
  const displayName = workoutDisplayName(workout.name, lang);

  return (
    <section className="tab-view active" id="view-workout">
      <div className="start-hero">
        <div className="start-subtitle">{t('start.today')}</div>
        <h1 className={`start-title${displayName.length >= 18 ? ' start-title-long' : ''}`}>{displayName}</h1>

        <div className="start-meta-row">
          <div className="week-stepper">
            <button type="button" className="stepper-btn" onClick={() => onWeek(-1)} title={t('start.prevWeek')}>−</button>
            <span className="stepper-val">{t('start.weekBadge', { week: settings.currentWeek })}</span>
            <button type="button" className="stepper-btn" onClick={() => onWeek(1)} title={t('start.nextWeek')}>+</button>
          </div>
        </div>

        <button type="button" className="btn btn-large btn-gold" onClick={() => onStart(workoutId)}>
          {t('start.start')}
        </button>

        <div className="preview-box">
          <div className="preview-title">
            <span>{t('start.planToday')}</span>
            <span>{t('common.exercisesCount', { count: workout.exercises.length })}</span>
          </div>
          <ul className="preview-list">
            {workout.exercises.map((ex, index) => (
              <li className="preview-item" key={ex.id}>
                <span className="num">{index + 1}.</span>
                <strong className="preview-exercise-name">{exerciseDisplayName(ex.name, lang)}</strong>
                <span className="preview-exercise-reps">({ex.sets} × {repsDisplay(ex)}{isTimedExercise(ex) ? ' s' : ''})</span>
              </li>
            ))}
          </ul>
        </div>

        <div className="manual-picker-label">{t('start.otherWorkout')}</div>
        <div className={`workout-selector-pills${ids.length > 4 ? ' many' : ''}`}>
          {ids.map(id => (
            <button type="button" key={id} className={`pill-btn${workoutId === id ? ' active' : ''}`} onClick={() => onSelect(id)}>
              {t('start.workoutPill', { id })}
            </button>
          ))}
        </div>
      </div>
    </section>
  );
}

function ActiveWorkout(props) {
  const {
    session, index, timer, onOpenDrawer, onOpenWeight, onAdjustWeight, onToggleWeight, onRecord, onOpenReps,
    onRemoveSet, onAddSet, onRemoveSetTarget, onNavigate, onFinish, onToggleTimer, onAdjustTimer, onResetTimer,
    onOpenPlates, settings, onOpenAtlas,
  } = props;
  const { t, lang } = useT();
  const unit = settings?.unit === 'lb' ? 'lb' : 'kg';
  const ex = session.exercises[index];
  const bodyweight = isBodyweightExercise(ex);
  const weightEnabled = !bodyweight || (ex.weightEnabled ?? (Number(ex.currentWeight) > 0 || Number(ex.progressionStep) > 0));
  const timed = isTimedExercise(ex);
  const plateMode = plateModeForExercise(ex.name);
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
  const repUnit = timed ? t('common.secondsShort') : t('common.reps');

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
            <button
              type="button"
              className="btn-atlas-info"
              onClick={() => onOpenAtlas(ex.name)}
              title={t('atlas.showInCard')}
              aria-label={t('atlas.showInCard')}
              data-testid="atlas-info-btn"
            >
              📖
            </button>
            <div className="exercise-tags">
              <span className="tag">{t('workout.setsTag', { sets: ex.setsTarget, reps: repsDisplay(ex), unit: repUnit })}</span>
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
                  {ex.isProgressionHit || ex.suggestedWeight > 0 ? `${fmt(ex.suggestedWeight, lang, unit)} ${unit}` : t('workout.chooseWeight')}
                </span>
                {ex.isProgressionHit && (
                  <span className="progres-badge" style={{ display: 'inline-flex' }}>
                    +{fmt(ex.progressionStep, lang, unit)} {unit}
                  </span>
                )}
              </div>
            </div>}
          </div>

          {bodyweight && <label className="weight-toggle"><input type="checkbox" checked={weightEnabled} onChange={event => onToggleWeight(event.target.checked)} /> {t('workout.extraWeight', { unit })}</label>}
          {weightEnabled && <div className="weight-adjuster-section">
            <div className="weight-display-wrapper">
              <button type="button" className="weight-display-btn" onClick={onOpenWeight} title={t('workout.enterManually')}>
                <span>{fmt(ex.currentWeight, lang, unit)}</span>
                <span className="weight-unit">{unit}</span>
              </button>
              {plateMode && <button type="button" className="btn-plates" onClick={() => onOpenPlates(plateMode)} title={t('workout.plates')}>🧮</button>}
            </div>
            <div className="weight-quick-buttons">
              {[...weightStepValues(unit).slice().reverse().map(v => -v), ...weightStepValues(unit)].map(delta => (
                <button type="button" key={delta} className={`btn-step ${delta < 0 ? 'step-minus' : 'step-plus'}`} onClick={() => onAdjustWeight(delta)}>
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
                        <span>{setNumber}. <strong>{formatRecordedSet(set, ex, lang, unit)}</strong></span>
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
                        <span>{setNumber}. <strong>{weightEnabled ? `${fmt(ex.currentWeight, lang, unit)} ${unit} × ?${timed ? ' s' : ''}` : `? ${timed ? 's' : t('common.reps')}`}</strong></span>
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
                        {setNumber}. <span style={{ color: 'var(--text-muted)' }}>{weightEnabled ? `${fmt(ex.currentWeight, lang, unit)} ${unit} × ?${timed ? ' s' : ''}` : `? ${timed ? 's' : t('common.reps')}`}</span>
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
