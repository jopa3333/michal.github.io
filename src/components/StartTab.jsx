import { isTimedExercise, repsDisplay, workoutIds } from '../logic.js';

export function StartTab({ plan, settings, session, onStart, onContinue, onSelect, onWeek }) {
  const ids = workoutIds(plan);
  const workoutId = ids.includes(settings.selectedStartWorkoutId) ? settings.selectedStartWorkoutId : ids[0];
  const workout = plan[workoutId];

  return (
    <section className="tab-view active" id="view-start">
      <div className="start-hero">
        <div className="start-subtitle">DZISIEJSZY TRENING</div>
        <h1 className={`start-title${workout.name.length >= 18 ? ' start-title-long' : ''}`}>{workout.name}</h1>

        <div className="start-meta-row">
          <div className="week-stepper">
            <button type="button" className="stepper-btn" onClick={() => onWeek(-1)} title="Poprzedni tydzień">−</button>
            <span className="stepper-val">TYDZIEŃ {settings.currentWeek}</span>
            <button type="button" className="stepper-btn" onClick={() => onWeek(1)} title="Następny tydzień">+</button>
          </div>
        </div>

        {session ? (
          <button type="button" className="btn btn-large btn-success" onClick={onContinue}>
            ⚡ KONTYNUUJ TRWAJĄCY TRENING
          </button>
        ) : (
          <button type="button" className="btn btn-large btn-gold" onClick={() => onStart(workoutId)}>
            🚀 ROZPOCZNIJ TRENING
          </button>
        )}

        <div className="preview-box">
          <div className="preview-title">
            <span>PLAN NA DZISIAJ</span>
            <span>{workout.exercises.length} ćwiczeń</span>
          </div>
          <ul className="preview-list">
            {workout.exercises.map((ex, index) => (
              <li className="preview-item" key={ex.id}>
                <span className="num">{index + 1}.</span>
                <strong className="preview-exercise-name">{ex.name}</strong>
                <span className="preview-exercise-reps">({ex.sets} × {repsDisplay(ex)}{isTimedExercise(ex) ? ' s' : ''})</span>
              </li>
            ))}
          </ul>
        </div>

        <div className="manual-picker-label">Chcesz wybrać inny trening na dziś?</div>
        <div className={`workout-selector-pills${ids.length > 4 ? ' many' : ''}`}>
          {ids.map(id => (
            <button type="button" key={id} className={`pill-btn${workoutId === id ? ' active' : ''}`} onClick={() => onSelect(id)}>
              TRENING {id}
            </button>
          ))}
        </div>
      </div>
    </section>
  );
}
