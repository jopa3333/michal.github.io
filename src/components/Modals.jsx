import { useRef, useState } from 'react';
import { EXERCISE_CATEGORIES, EXERCISE_DATABASE, PLAN_TEMPLATES } from '../data.js';
import { formatWeightDisplay, isBodyweightExercise, isTimedExercise, planCounts, remainingWorkoutsThisWeek, workoutIds } from '../logic.js';
import { useT } from '../i18n.jsx';
import {
  exerciseDisplayName, canonicalExerciseName, workoutDisplayName, categoryDisplayName,
  planDisplayName, templateText, dateLocale,
} from '../i18n/core.js';

const fmt = formatWeightDisplay;

const overlayStyle = { display: 'flex' };

// Add / edit exercise dialog. Form fields are strings, validated by logic.exerciseFromForm on save.
function initialForm(exercise, lang) {
  if (!exercise) {
    return { quick: '', name: '', sets: '3', repsMin: '8', repsMax: '12', tempo: '2010', step: fmt(2.5, lang), rest: '90', progressionType: 'top_all_sets' };
  }
  const known = EXERCISE_DATABASE.find(item => item.name.toLowerCase() === exercise.name.toLowerCase());
  return {
    quick: known ? known.name : '',
    name: exerciseDisplayName(exercise.name, lang),
    sets: String(exercise.sets),
    repsMin: String(exercise.repsMin),
    repsMax: String(exercise.repsMax),
    tempo: exercise.tempo || '2010',
    step: fmt(exercise.progressionStep || 0, lang),
    rest: String(exercise.restSeconds || 90),
    progressionType: exercise.progressionType || 'top_all_sets',
  };
}

export function ExerciseModal({ planName, exercise, onSave, onClose }) {
  const { t, lang } = useT();
  const [form, setForm] = useState(() => initialForm(exercise, lang));
  const editedFields = useRef(new Set());
  const field = key => event => {
    editedFields.current.add(key);
    setForm(prev => ({ ...prev, [key]: event.target.value }));
  };

  // Select values stay canonical (Polish); the visible name uses the display language.
  const pickFromDatabase = name => {
    if (!name) return;
    const known = EXERCISE_DATABASE.find(item => item.name === name);
    setForm(prev => {
      const next = { ...prev, quick: name, name: exerciseDisplayName(name, lang) };
      if (known) {
        if (!prev.tempo || prev.tempo === '2010') next.tempo = known.tempo || '2010';
        next.rest = String(known.rest || 90);
        next.step = fmt(known.step, lang);
      }
      return next;
    });
  };

  const nameChanged = event => {
    const name = event.target.value;
    const known = EXERCISE_DATABASE.find(item =>
      item.name === canonicalExerciseName(name)
      || exerciseDisplayName(item.name, lang).toLowerCase() === name.trim().toLowerCase());
    if (name && known?.step === 0) {
      setForm(prev => ({
        ...prev,
        name,
        quick: known.name,
        ...(!exercise && !editedFields.current.has('tempo') && (!prev.tempo || prev.tempo === '2010') ? { tempo: known.tempo || '2010' } : {}),
        ...(!exercise && !editedFields.current.has('rest') ? { rest: String(known.rest || 90) } : {}),
        ...(!exercise && !editedFields.current.has('step') ? { step: fmt(known.step, lang) } : {}),
      }));
    } else {
      setForm(prev => ({ ...prev, name, quick: known ? known.name : '' }));
    }
  };

  const title = exercise
    ? t('modals.editTitle', { name: exerciseDisplayName(exercise.name, lang) })
    : t('modals.addTitle', { plan: workoutDisplayName(planName, lang) });
  const hideWeightProgression = isBodyweightExercise({ name: form.name })
    && Number(String(form.step).replace(',', '.')) === 0;

  return (
    <div className="modal-overlay" style={overlayStyle}>
      <div className="modal-box">
        <div className="modal-title">{title}</div>

        <div className="form-group" style={{ background: 'rgba(2, 44, 67, 0.6)', padding: '8px 10px', borderRadius: 8, border: '1px solid rgba(20, 107, 151, 0.35)' }}>
          <label className="form-label" htmlFor="exerciseLibrary" style={{ marginBottom: 4 }}>{t('modals.library')}</label>
          <select id="exerciseLibrary" className="modal-select" value={form.quick} onChange={event => pickFromDatabase(event.target.value)} style={{ fontSize: '0.85rem' }}>
            <option value="">{t('modals.libraryPlaceholder')}</option>
            {EXERCISE_CATEGORIES.map(([category, items]) => (
              <optgroup label={categoryDisplayName(category, lang)} key={category}>
                {items.map(item => (
                  <option key={item.name} value={item.name}>{exerciseDisplayName(item.name, lang)}</option>
                ))}
              </optgroup>
            ))}
          </select>
        </div>

        <div className="form-group">
          <label className="form-label">{t('modals.exerciseName')}</label>
          <input type="text" id="modalExName" className="modal-input" placeholder={t('modals.namePlaceholder')} list="exerciseDatalist" value={form.name} onChange={nameChanged} />
          <datalist id="exerciseDatalist">
            {EXERCISE_DATABASE.map(item => (
              <option key={item.name} value={exerciseDisplayName(item.name, lang)} />
            ))}
          </datalist>
        </div>

        <div className="exercise-rep-fields">
          <div className="form-group">
            <label className="form-label">{t('modals.sets')}</label>
            <input type="number" id="modalExSets" className="modal-input" min="1" max="10" value={form.sets} onChange={field('sets')} />
          </div>
          <div className="form-group">
            <label className="form-label">{isTimedExercise({ name: form.name }) ? t('modals.minSeconds') : t('modals.minReps')}</label>
            <input type="number" id="modalExRepsMin" className="modal-input" min="1" max={isTimedExercise({ name: form.name }) ? 3600 : 50} value={form.repsMin} onChange={field('repsMin')} />
          </div>
          <div className="form-group">
            <label className="form-label">{isTimedExercise({ name: form.name }) ? t('modals.maxSeconds') : t('modals.maxReps')}</label>
            <input type="text" id="modalExRepsMax" className="modal-input" placeholder={t('modals.maxPlaceholder')} value={form.repsMax} onChange={field('repsMax')} />
          </div>
        </div>

        <div style={{ display: 'flex', gap: 10 }}>
          <div className="form-group" style={{ flex: 1 }}>
            <label className="form-label">{t('modals.tempo')}</label>
            <input type="text" id="modalExTempo" className="modal-input" placeholder={t('modals.tempoPlaceholder')} value={form.tempo} onChange={field('tempo')} />
          </div>
          {!hideWeightProgression && <div className="form-group" style={{ flex: 1 }}>
            <label className="form-label">{t('modals.step')}</label>
            <input type="text" inputMode="decimal" id="modalExStep" className="modal-input" value={form.step} onChange={field('step')} />
          </div>}
        </div>

        <div className="form-group">
          <label className="form-label">{t('modals.rest')}</label>
          <input type="number" id="modalExRest" className="modal-input" min="15" max="600" step="15" value={form.rest} onChange={field('rest')} />
        </div>

        {!hideWeightProgression && <div className="form-group">
          <label className="form-label">{t('modals.progressionRule')}</label>
          <select id="modalExProgressionType" className="modal-select" value={form.progressionType} onChange={field('progressionType')}>
            <option value="top_all_sets">{t('modals.ruleAll')}</option>
            <option value="top_first_set">{t('modals.ruleFirst')}</option>
            <option value="manual">{t('modals.ruleManual')}</option>
          </select>
        </div>}

        <div className="modal-buttons">
          <button type="button" className="btn btn-outline" onClick={onClose}>{t('common.cancel')}</button>
          <button type="button" className="btn btn-gold" onClick={() => onSave(form)}>{t('modals.saveExercise')}</button>
        </div>
      </div>
    </div>
  );
}

export function WeightModal({ value, onSave, onClose }) {
  const { t, lang } = useT();
  const [text, setText] = useState(() => fmt(value, lang));
  return (
    <div className="modal-overlay" style={overlayStyle}>
      <div className="modal-box" style={{ maxWidth: 320, textAlign: 'center' }}>
        <div className="modal-title">{t('modals.enterWeight')}</div>
        <input
          type="text"
          inputMode="decimal"
          id="modalWeightInput"
          className="modal-input"
          style={{ fontSize: '1.8rem', textAlign: 'center', fontWeight: 900 }}
          value={text}
          autoFocus
          onFocus={event => event.target.select()}
          onChange={event => setText(event.target.value)}
        />
        <div className="modal-buttons" style={{ justifyContent: 'center' }}>
          <button type="button" className="btn btn-outline" onClick={onClose}>{t('common.cancel')}</button>
          <button type="button" className="btn btn-gold" onClick={() => onSave(text)}>{t('modals.setWeight')}</button>
        </div>
      </div>
    </div>
  );
}

export function CustomRepsModal({ onSave, onClose, timed = false }) {
  const { t } = useT();
  const [text, setText] = useState('');
  return (
    <div className="modal-overlay" style={overlayStyle}>
      <div className="modal-box" style={{ maxWidth: 320, textAlign: 'center' }}>
        <div className="modal-title">{timed ? t('modals.setTime') : t('modals.enterReps')}</div>
        <input
          type="number"
          id="modalCustomRepsInput"
          className="modal-input"
          style={{ fontSize: '1.8rem', textAlign: 'center', fontWeight: 900 }}
          min="1"
          max={timed ? 3600 : 100}
          value={text}
          autoFocus
          onChange={event => setText(event.target.value)}
        />
        <div className="modal-buttons" style={{ justifyContent: 'center' }}>
          <button type="button" className="btn btn-outline" onClick={onClose}>{t('common.cancel')}</button>
          <button type="button" className="btn btn-gold" onClick={() => onSave(text)}>{t('modals.saveSet')}</button>
        </div>
      </div>
    </div>
  );
}

export function SummaryModal({ data, history, plan, settings, onClose }) {
  const { t, lang } = useT();
  const remaining = remainingWorkoutsThisWeek(history, data.week, plan, settings);
  const advanced = Boolean(data.weekProg && data.weekProg.advanced);
  return (
    <div className="modal-overlay" style={overlayStyle}>
      <div className="modal-box" style={{ textAlign: 'center' }}>
        <div style={{ fontSize: '3rem', marginBottom: 10 }}>🏆</div>
        <div className="modal-title" style={{ marginBottom: 8 }}>{t('modals.workoutDone')}</div>
        <p id="summarySubtitle" style={{ color: 'var(--text-muted)', fontSize: '0.9rem', marginBottom: 16 }}>
          {advanced ? (
            <>
              🎉 <strong>{t('modals.great')}</strong> {t('modals.weekDoneAll', { count: Object.keys(plan).length, week: data.weekProg.previousWeek })}
              <br />
              <span style={{ color: 'var(--accent-gold)', fontWeight: 800 }}>
                {t('modals.autoAdvanced', { week: data.weekProg.newWeek })} 🚀
              </span>
            </>
          ) : (
            <>
              {t('modals.savedToHistory')}{' '}
              {remaining.length > 0 && (
                <>
                  {t('modals.remainingPrefix')} <strong>{t('modals.remainingWorkouts', { ids: remaining.join(', ') })}</strong>.
                </>
              )}
            </>
          )}
        </p>

        <div style={{ background: 'rgba(2, 44, 67, 0.7)', borderRadius: 10, padding: 14, marginBottom: 20, textAlign: 'left' }}>
          <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: 6, fontSize: '0.9rem' }}>
            <span style={{ color: 'var(--text-muted)' }}>{t('modals.workoutRow')}</span>
            <span id="sumWorkoutName" style={{ fontWeight: 800, color: '#fff' }}>{workoutDisplayName(data.name, lang)}</span>
          </div>
          <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: 6, fontSize: '0.9rem' }}>
            <span style={{ color: 'var(--text-muted)' }}>{t('modals.weekRow')}</span>
            <span id="sumWeekNum" style={{ fontWeight: 800, color: '#fff' }}>{t('common.week')} {data.week}</span>
          </div>
          <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: 6, fontSize: '0.9rem' }}>
            <span style={{ color: 'var(--text-muted)' }}>{t('modals.totalSetsRow')}</span>
            <span id="sumTotalSets" style={{ fontWeight: 800, color: 'var(--accent-gold)' }}>{t('common.setsCount', { count: data.sets })}</span>
          </div>
          <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: '0.9rem' }}>
            <span style={{ color: 'var(--text-muted)' }}>{t('modals.volumeRow')}</span>
            <span id="sumTotalVolume" style={{ fontWeight: 800, color: 'var(--success-green)' }}>{data.volume.toLocaleString(dateLocale(lang))} kg</span>
          </div>
        </div>

        <button type="button" className="btn btn-gold btn-large" onClick={onClose}>
          {t('modals.goToHistory')}
        </button>
      </div>
    </div>
  );
}

export function SavedPlansModal({ plans, activeId, onLoad, onRename, onDuplicate, onDelete, onCreate, onOpenTemplates, onClose }) {
  const { t, lang } = useT();
  return (
    <div className="modal-overlay" style={overlayStyle}>
      <div className="modal-box" style={{ maxWidth: 440 }}>
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 6 }}>
          <div className="modal-title" style={{ marginBottom: 0 }}>{t('modals.myPlans')}</div>
          <button type="button" className="btn btn-outline btn-mini" onClick={onClose}>✕</button>
        </div>
        <p style={{ fontSize: '0.78rem', color: 'var(--text-muted)', marginBottom: 12 }}>
          {t('modals.plansIntro')}
        </p>

        <div className="saved-plans-list" id="savedPlansListContainer">
          {plans.length === 0 ? (
            <div style={{ color: 'var(--text-muted)', textAlign: 'center', padding: 20 }}>{t('modals.noPlans')}</div>
          ) : (
            plans.map(plan => {
              const isActive = plan.id === activeId;
              const counts = planCounts(plan.workouts, plan.workoutOrder);
              const ids = workoutIds(plan.workouts, plan.workoutOrder);
              const date = plan.updatedAt ? new Date(plan.updatedAt).toLocaleDateString(dateLocale(lang)) : '';
              return (
                <div key={plan.id} className={`saved-plan-card${isActive ? ' active-plan' : ''}`}>
                  <div className="saved-plan-top">
                    <div className="saved-plan-name">{planDisplayName(plan.name, lang)}</div>
                    {isActive && <span className="badge badge-gold saved-plan-active-badge">✓ {t('common.active')}</span>}
                  </div>
                  <div className="saved-plan-meta">
                    {ids.map((id, index) => `${workoutDisplayName(plan.workouts[id].name, lang)}: ${counts[index]} ${t('common.exercisesShort')}`).join(' | ')}
                    {date ? ` • ${date}` : ''}
                  </div>
                  <div className="saved-plan-btns">
                    {isActive ? (
                      <span style={{ fontSize: '0.75rem', color: 'var(--accent-gold)', fontWeight: 700 }}>{t('modals.currentPlan')}</span>
                    ) : (
                      <button type="button" className="btn btn-gold btn-mini" onClick={() => onLoad(plan.id)}>{t('modals.loadPlan')}</button>
                    )}
                    <div className="saved-plan-secondary-actions">
                      <button type="button" className="btn btn-outline btn-mini" onClick={() => onRename(plan.id)}>{t('modals.rename')}</button>
                      <button type="button" className="btn btn-outline btn-mini" onClick={() => onDuplicate(plan.id)}>{t('modals.copy')}</button>
                      {!isActive && (
                        <button type="button" className="btn btn-danger btn-mini saved-plan-delete" onClick={() => onDelete(plan.id)}>{t('modals.delete')}</button>
                      )}
                    </div>
                  </div>
                </div>
              );
            })
          )}
        </div>

        <div className="saved-plans-footer">
          <button type="button" className="btn btn-gold btn-mini" onClick={onCreate}>{t('modals.newPlan')}</button>
          <button type="button" className="btn btn-outline btn-mini" onClick={onOpenTemplates}>{t('modals.templates')}</button>
          <button type="button" className="btn btn-outline btn-mini" onClick={onClose}>{t('common.close')}</button>
        </div>
      </div>
    </div>
  );
}

export function SavePlanAsModal({ mode, defaultName, onConfirm, onClose }) {
  const { t } = useT();
  const [name, setName] = useState(defaultName);
  const [days, setDays] = useState('3');
  const title = mode === 'create_new' ? t('modals.createNew') : t('modals.saveAs');
  return (
    <div className="modal-overlay" style={overlayStyle}>
      <div className="modal-box" style={{ maxWidth: 340 }}>
        <div className="modal-title">{title}</div>
        <div className="form-group">
          <label className="form-label">{t('modals.planName')}</label>
          <input
            type="text"
            id="savePlanAsInput"
            className="modal-input"
            placeholder={t('modals.planNamePlaceholder')}
            value={name}
            autoFocus
            onFocus={event => event.target.select()}
            onChange={event => setName(event.target.value)}
          />
        </div>
        {mode === 'create_new' && (
          <div className="form-group">
            <label className="form-label">{t('modals.daysPerWeek')}</label>
            <select className="modal-select" value={days} onChange={event => setDays(event.target.value)}>
              <option value="3">{t('modals.days3')}</option>
              <option value="4">{t('modals.days4')}</option>
              <option value="5">{t('modals.days5')}</option>
            </select>
          </div>
        )}
        <div className="modal-buttons">
          <button type="button" className="btn btn-outline" onClick={onClose}>{t('common.cancel')}</button>
          <button type="button" className="btn btn-gold" id="btnConfirmSavePlanAs" onClick={() => onConfirm(name, Number(days))}>{mode === 'create_new' ? t('common.create') : t('common.save')}</button>
        </div>
      </div>
    </div>
  );
}

export function TemplateLibraryModal({ onUse, onClose }) {
  const { t, lang } = useT();
  return (
    <div className="modal-overlay" style={overlayStyle}>
      <div className="modal-box template-library-modal" style={{ maxWidth: 460 }}>
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 6 }}>
          <div className="modal-title" style={{ marginBottom: 0 }}>{t('modals.libraryTitle')}</div>
          <button type="button" className="btn btn-outline btn-mini" onClick={onClose}>✕</button>
        </div>
        <p style={{ fontSize: '0.8rem', color: 'var(--text-muted)', marginBottom: 12 }}>{t('modals.libraryIntro')}</p>
        <div className="template-library-list">
          {PLAN_TEMPLATES.map(template => {
            const tr = templateText(template, lang);
            return (
              <article className="template-card" key={template.id}>
                <div className="template-card-title">{tr.title}</div>
                <div className="template-card-meta">{t('modals.templateMeta', { days: tr.daysPerWeek, level: tr.level, goal: tr.goal })}</div>
                <p>{tr.description}</p>
                <button type="button" className="btn btn-gold btn-mini" onClick={() => onUse(template.id)}>{t('modals.useTemplate')}</button>
              </article>
            );
          })}
        </div>
      </div>
    </div>
  );
}

export function PlanDrawer({ session, index, onSelect, onClose, onFinish }) {
  const { t, lang } = useT();
  return (
    <div className="plan-drawer-overlay" style={overlayStyle} onClick={onClose}>
      <div className="plan-drawer" onClick={event => event.stopPropagation()}>
        <div className="plan-drawer-header">
          <span className="drawer-title">{workoutDisplayName(session.workoutName, lang)} ({t('common.weekShort')} {session.week})</span>
          <button type="button" className="drawer-close-btn" onClick={onClose}>✕</button>
        </div>
        <p style={{ fontSize: '0.8rem', color: 'var(--text-muted)', marginBottom: 12 }}>
          {t('modals.drawerHint')}
        </p>
        <ul className="drawer-exercises-list">
          {session.exercises.map((ex, idx) => {
            const isCurrent = idx === index;
            const isDone = ex.completedSets.length >= ex.setsTarget;
            const icon = isDone ? '✓' : isCurrent ? '▶' : '○';
            return (
              <li key={`${ex.id}-${idx}`} className={`drawer-ex-item ${isCurrent ? 'current' : ''} ${isDone ? 'done' : ''}`} onClick={() => onSelect(idx)}>
                <span>{icon} {idx + 1}. {exerciseDisplayName(ex.name, lang)}</span>
                <span style={{ fontSize: '0.75rem', color: 'var(--text-muted)' }}>{ex.completedSets.length}/{ex.setsTarget}</span>
              </li>
            );
          })}
        </ul>
        <button type="button" className="btn btn-danger" style={{ marginTop: 20 }} onClick={onFinish}>
          {t('modals.finishWorkout')}
        </button>
      </div>
    </div>
  );
}
