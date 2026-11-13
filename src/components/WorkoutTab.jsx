import { formatRecordedSet, formatTime, formatWeightDisplay, isBodyweightExercise, isTimedExercise, repButtonValues, repsDisplay, workoutIds } from '../logic.js';

const fmt = formatWeightDisplay;

const WEIGHT_STEPS = [
  [-2.5, '−2,5', 'step-minus'],
  [-1, '−1', 'step-minus'],
  [-0.5, '−0,5', 'step-minus'],
  [0.5, '+0,5', 'step-plus'],
  [1, '+1', 'step-plus'],
  [2.5, '+2,5', 'step-plus'],
];

function timerClass(timer) {
  if (timer.isRunning) return 'timer-btn-main timer-running';
  if (timer.remaining === 0 && timer.total > 0) return 'timer-btn-main timer-done';
  return 'timer-btn-main';
}

function timerLabel(timer) {
  if (timer.isRunning) return { icon: '⏳', text: formatTime(timer.remaining) };
  if (timer.remaining === 0 && timer.total > 0) return { icon: '🔔', text: 'KONIEC PRZERWY!' };
  return { icon: '⏱', text: `START ${formatTime(timer.remaining)}` };
}

export function WorkoutTab(props) {
  const { session } = props;
  return session ? <ActiveWorkout {...props} /> : <WorkoutPicker {...props} />;
}

function WorkoutPicker({ plan, settings, onStart, onWeek }) {
  return (
    <section className="tab-view active" id="view-workout">
      <div id="workoutSelectionContainer">
        <div style={{ marginBottom: 16, display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
          <h2 style={{ fontSize: '1.3rem', fontWeight: 800, color: '#fff' }}>Wybierz trening</h2>
          <div className="week-stepper">
            <button type="button" className="stepper-btn" onClick={() => onWeek(-1)}>−</button>
            <span className="stepper-val">TYDZIEŃ {settings.currentWeek}</span>
            <button type="button" className="stepper-btn" onClick={() => onWeek(1)}>+</button>
          </div>
        </div>

        <div className="workout-picker-grid">
          {workoutIds(plan).map(id => {
            const workout = plan[id];
            if (!workout) return null;
            const names = workout.exercises.map(e => e.name).slice(0, 4).join(', ') + (workout.exercises.length > 4 ? '...' : '');
            return (
              <div className="workout-choice-card" key={id} onClick={() => onStart(id)}>
                <div className="w-card-header">
                  <span className="w-card-title">{workout.name}</span>
                  <span className="badge badge-gold">{workout.exercises.length} ćwiczeń</span>
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
                  ROZPOCZNIJ
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
  const ex = session.exercises[index];
  const bodyweight = isBodyweightExercise(ex);
  const weightEnabled = !bodyweight || (ex.weightEnabled ?? (Number(ex.currentWeight) > 0 || Number(ex.progressionStep) > 0));
  const timed = isTimedExercise(ex);
  const completed = ex.completedSets.length;
  const isCompleted = completed >= ex.setsTarget;
  const isLast = index === session.exercises.length - 1;
  const next = isCompleted
    ? isLast
      ? { label: '🏆 ZAKOŃCZ TRENING', action: onFinish }
      : { label: 'NASTĘPNE ĆWICZENIE →', action: () => onNavigate(1) }
    : isLast
      ? { label: 'Podsumuj trening', action: onFinish }
      : { label: 'Następne ćwiczenie →', action: () => onNavigate(1) };
  const timerText = timerLabel(timer);

  return (
    <section className="tab-view active" id="view-workout">
      <div id="workoutActiveAssistant">
        <div className="assistant-topbar">
          <div className="assistant-ex-count" id="assistantExerciseCounter">
            ĆWICZENIE {index + 1} Z {session.exercises.length}
          </div>
          <button type="button" className="btn-plan-toggle" onClick={onOpenDrawer}>
            <span>☰ PLAN</span>
          </button>
        </div>

        <div className="exercise-main-card">
          <div className="exercise-header-compact">
            <h2 className="exercise-name-header">{ex.name}</h2>
            <div className="exercise-tags">
              <span className="tag">{ex.setsTarget} serie × {repsDisplay(ex)} {timed ? 'sek.' : 'powt.'}</span>
              <span className="tag tag-tempo">Tempo: {ex.tempo || '2010'}</span>
              <span className="tag">Odpoczynek: {ex.restSeconds || 90}s</span>
            </div>
          </div>

          <div className="exercise-info-strip">
            <div className="info-strip-col prev">
              <span className="strip-lbl">OSTATNIO</span>
              <span className="strip-val">{ex.lastSummary || 'BRAK POPRZEDNIEGO WYNIKU'}</span>
            </div>
            {weightEnabled && <div className={`info-strip-col target${ex.isProgressionHit ? ' progres-hit' : ''}`}>
              <span className="strip-lbl">{ex.isProgressionHit ? '🎯 DZISIAJ' : 'DZISIAJ'}</span>
              <div className="strip-val-row">
                <span className="strip-val">
                  {ex.isProgressionHit || ex.suggestedWeight > 0 ? `${fmt(ex.suggestedWeight)} kg` : 'Wybierz'}
                </span>
                {ex.isProgressionHit && (
                  <span className="progres-badge" style={{ display: 'inline-flex' }}>
                    +{fmt(ex.progressionStep)} kg
                  </span>
                )}
              </div>
            </div>}
          </div>

          {bodyweight && <label className="weight-toggle"><input type="checkbox" checked={weightEnabled} onChange={event => onToggleWeight(event.target.checked)} /> Dodatkowe obciążenie (kg)</label>}
          {weightEnabled && <div className="weight-adjuster-section">
            <div className="weight-display-wrapper">
              <button type="button" className="weight-display-btn" onClick={onOpenWeight} title="Kliknij, aby wpisać ręcznie">
                <span>{fmt(ex.currentWeight)}</span>
                <span className="weight-unit">kg</span>
              </button>
            </div>
            <div className="weight-quick-buttons">
              {WEIGHT_STEPS.map(([delta, label, cls]) => (
                <button type="button" key={label} className={`btn-step ${cls}`} onClick={() => onAdjustWeight(delta)}>
                  {label}
                </button>
              ))}
            </div>
          </div>}

          <div className="sets-progress-box">
            <div className="sets-header">
              <span>SERIE W TYM ĆWICZENIU</span>
              <div style={{ display: 'flex', alignItems: 'center', gap: 6 }}>
                <span>{completed} / {ex.setsTarget} serie</span>
                <button type="button" className="btn btn-outline btn-mini btn-set-step" onClick={onRemoveSetTarget} title="Odejmij serię">
                  − seria
                </button>
                <button type="button" className="btn btn-outline btn-mini btn-set-step" onClick={onAddSet} title="Dodaj dodatkową serię">
                  + seria
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
                        <span>{setNumber}. <strong>{formatRecordedSet(set, ex)}</strong></span>
                      </div>
                      <button type="button" className="set-actions-btn" onClick={() => onRemoveSet(i)} title="Usuń tę serię">
                        ✕ Usuń
                      </button>
                    </div>
                  );
                }
                if (i === completed) {
                  return (
                    <div className="set-row active" key={`set-${i}`}>
                      <div>
                        <span className="set-status-icon">○</span>{' '}
                        <span>{setNumber}. <strong>{weightEnabled ? `${fmt(ex.currentWeight)} kg × ?${timed ? ' s' : ''}` : `? ${timed ? 's' : 'powt.'}`}</strong></span>
                      </div>
                      <span style={{ fontSize: '0.75rem', textTransform: 'uppercase', color: 'var(--accent-gold)' }}>Aktualna</span>
                    </div>
                  );
                }
                return (
                  <div className="set-row" key={`set-${i}`}>
                    <div>
                      <span className="set-status-icon" style={{ color: 'var(--text-muted)' }}>○</span>{' '}
                      <span>
                        {setNumber}. <span style={{ color: 'var(--text-muted)' }}>{weightEnabled ? `${fmt(ex.currentWeight)} kg × ?${timed ? ' s' : ''}` : `? ${timed ? 's' : 'powt.'}`}</span>
                      </span>
                    </div>
                    <span style={{ fontSize: '0.75rem', color: 'var(--text-muted)' }}>Oczekuje</span>
                  </div>
                );
              })}
            </div>
          </div>

          {isCompleted && (
            <div className="exercise-completed-banner" style={{ display: 'block' }}>
              🎉 ĆWICZENIE UKOŃCZONE! ({completed}/{ex.setsTarget} serie)
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
                {timed ? 'Wpisz czas' : 'Inne...'}
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
              <button type="button" className="timer-ctrl-btn" onClick={onResetTimer} title="Reset timera">↺</button>
            </div>
          </div>

          <div className="exercise-nav-footer">
            <button type="button" className="btn-prev-ex" onClick={() => onNavigate(-1)}>← Poprzednie</button>
            <button type="button" className={`btn-next-ex${isCompleted ? ' completed-prompt' : ''}`} onClick={next.action}>
              {next.label}
            </button>
          </div>
        </div>

        <button type="button" className="btn-finish-link" onClick={onFinish}>
          Zakończ ten trening
        </button>
      </div>
    </section>
  );
}
