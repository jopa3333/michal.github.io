import { isTimedExercise, repsDisplay, workoutIds } from '../logic.js';
import { useT } from '../i18n.jsx';
import { exerciseDisplayName, workoutDisplayName } from '../i18n/core.js';

export function StartTab({ plan, settings, session, onStart, onContinue, onSelect, onWeek }) {
  const { t, lang } = useT();
  const ids = workoutIds(plan);
  const workoutId = ids.includes(settings.selectedStartWorkoutId) ? settings.selectedStartWorkoutId : ids[0];
  const workout = plan[workoutId];
  const displayName = workoutDisplayName(workout.name, lang);

  return (
    <section className="tab-view active" id="view-start">
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

        {session ? (
          <button type="button" className="btn btn-large btn-success" onClick={onContinue}>
            {t('start.continue')}
          </button>
        ) : (
          <button type="button" className="btn btn-large btn-gold" onClick={() => onStart(workoutId)}>
            {t('start.start')}
          </button>
        )}

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
