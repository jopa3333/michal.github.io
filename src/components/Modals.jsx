import { useState } from 'react';
import { EXERCISE_CATEGORIES, EXERCISE_DATABASE, PLAN_TEMPLATES } from '../data.js';
import { formatWeightDisplay, planCounts, remainingWorkoutsThisWeek, workoutIds } from '../logic.js';

const fmt = formatWeightDisplay;

const overlayStyle = { display: 'flex' };
const BODYWEIGHT_NAMES = new Set([
  'wznosy nóg do klatki',
  'wznosy nóg w zwisie na drążku',
  'wznosy nóg na poręczach stacyjnych',
  'pompki klasyczne',
  'plank (deska klasyczna)',
  'plank',
  'kółko do brzucha (ab wheel rollout)',
  'spięcia brzucha na ławce skośnej',
]);

// Add / edit exercise dialog. Form fields are strings, validated by logic.exerciseFromForm on save.
function initialForm(exercise) {
  if (!exercise) {
    return { quick: '', name: '', sets: '3', repsMin: '8', repsMax: '12', tempo: '2010', step: '2,5', rest: '90', progressionType: 'top_all_sets' };
  }
  const known = EXERCISE_DATABASE.find(item => item.name.toLowerCase() === exercise.name.toLowerCase());
  return {
    quick: known ? known.name : '',
    name: exercise.name,
    sets: String(exercise.sets),
    repsMin: String(exercise.repsMin),
    repsMax: String(exercise.repsMax),
    tempo: exercise.tempo || '2010',
    step: fmt(exercise.progressionStep || 0),
    rest: String(exercise.restSeconds || 90),
    progressionType: exercise.progressionType || 'top_all_sets',
  };
}

export function ExerciseModal({ planName, exercise, onSave, onClose }) {
  const [form, setForm] = useState(() => initialForm(exercise));
  const field = key => event => setForm(prev => ({ ...prev, [key]: event.target.value }));

  const pickFromDatabase = name => {
    if (!name) return;
    const known = EXERCISE_DATABASE.find(item => item.name === name);
    setForm(prev => {
      const next = { ...prev, quick: name, name };
      if (known) {
        if (!prev.tempo || prev.tempo === '2010') next.tempo = known.tempo || '2010';
        next.rest = String(known.rest || 90);
        next.step = fmt(known.step);
      }
      return next;
    });
  };

  const title = exercise ? `Edytuj: ${exercise.name}` : `Dodaj ćwiczenie do ${planName}`;
  const hideWeightProgression = BODYWEIGHT_NAMES.has(form.name.trim().toLocaleLowerCase('pl'))
    && Number(String(form.step).replace(',', '.')) === 0;

  return (
    <div className="modal-overlay" style={overlayStyle}>
      <div className="modal-box">
        <div className="modal-title">{title}</div>

        <div className="form-group" style={{ background: 'rgba(2, 44, 67, 0.6)', padding: '8px 10px', borderRadius: 8, border: '1px solid rgba(20, 107, 151, 0.35)' }}>
          <label className="form-label" htmlFor="exerciseLibrary" style={{ marginBottom: 4 }}>⚡ Baza ćwiczeń</label>
          <select id="exerciseLibrary" className="modal-select" value={form.quick} onChange={event => pickFromDatabase(event.target.value)} style={{ fontSize: '0.85rem' }}>
            <option value="">— Wybierz lub wpisz poniżej —</option>
            {EXERCISE_CATEGORIES.map(([category, items]) => (
              <optgroup label={category} key={category}>
                {items.map(item => (
                  <option key={item.name} value={item.name}>{item.name}</option>
                ))}
              </optgroup>
            ))}
          </select>
        </div>

        <div className="form-group">
          <label className="form-label">Nazwa ćwiczenia</label>
          <input type="text" id="modalExName" className="modal-input" placeholder="np. Przysiad ze sztangą na plecach" list="exerciseDatalist" value={form.name} onChange={field('name')} />
          <datalist id="exerciseDatalist">
            {EXERCISE_DATABASE.map(item => (
              <option key={item.name} value={item.name} />
            ))}
          </datalist>
        </div>

        <div className="exercise-rep-fields">
          <div className="form-group">
            <label className="form-label">Liczba serii</label>
            <input type="number" id="modalExSets" className="modal-input" min="1" max="10" value={form.sets} onChange={field('sets')} />
          </div>
          <div className="form-group">
            <label className="form-label">Min. powtórzeń</label>
            <input type="number" id="modalExRepsMin" className="modal-input" min="1" max="50" value={form.repsMin} onChange={field('repsMin')} />
          </div>
          <div className="form-group">
            <label className="form-label">Max. powtórzeń</label>
            <input type="text" id="modalExRepsMax" className="modal-input" placeholder="np. 12 lub MAX" value={form.repsMax} onChange={field('repsMax')} />
          </div>
        </div>

        <div style={{ display: 'flex', gap: 10 }}>
          <div className="form-group" style={{ flex: 1 }}>
            <label className="form-label">Tempo</label>
            <input type="text" id="modalExTempo" className="modal-input" placeholder="np. 2010" value={form.tempo} onChange={field('tempo')} />
          </div>
          {!hideWeightProgression && <div className="form-group" style={{ flex: 1 }}>
            <label className="form-label">Krok progresji (kg)</label>
            <input type="text" inputMode="decimal" id="modalExStep" className="modal-input" value={form.step} onChange={field('step')} />
          </div>}
        </div>

        <div className="form-group">
          <label className="form-label">Czas odpoczynku (sekundy)</label>
          <input type="number" id="modalExRest" className="modal-input" min="15" max="600" step="15" value={form.rest} onChange={field('rest')} />
        </div>

        {!hideWeightProgression && <div className="form-group">
          <label className="form-label">Reguła Progresji Ciężaru</label>
          <select id="modalExProgressionType" className="modal-select" value={form.progressionType} onChange={field('progressionType')}>
            <option value="top_all_sets">Górny zakres we wszystkich seriach (np. 5/5/5 lub 12/12)</option>
            <option value="top_first_set">Górny zakres w 1. serii (np. 12 w pierwszej serii)</option>
            <option value="manual">Ręczna / brak automatycznej sugestii</option>
          </select>
        </div>}

        <div className="modal-buttons">
          <button type="button" className="btn btn-outline" onClick={onClose}>Anuluj</button>
          <button type="button" className="btn btn-gold" onClick={() => onSave(form)}>Zapisz ćwiczenie</button>
        </div>
      </div>
    </div>
  );
}

export function WeightModal({ value, onSave, onClose }) {
  const [text, setText] = useState(() => fmt(value));
  return (
    <div className="modal-overlay" style={overlayStyle}>
      <div className="modal-box" style={{ maxWidth: 320, textAlign: 'center' }}>
        <div className="modal-title">Wpisz ciężar (kg)</div>
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
          <button type="button" className="btn btn-outline" onClick={onClose}>Anuluj</button>
          <button type="button" className="btn btn-gold" onClick={() => onSave(text)}>Ustaw ciężar</button>
        </div>
      </div>
    </div>
  );
}

export function CustomRepsModal({ onSave, onClose }) {
  const [text, setText] = useState('');
  return (
    <div className="modal-overlay" style={overlayStyle}>
      <div className="modal-box" style={{ maxWidth: 320, textAlign: 'center' }}>
        <div className="modal-title">Liczba powtórzeń</div>
        <input
          type="number"
          id="modalCustomRepsInput"
          className="modal-input"
          style={{ fontSize: '1.8rem', textAlign: 'center', fontWeight: 900 }}
          min="1"
          max="100"
          value={text}
          autoFocus
          onChange={event => setText(event.target.value)}
        />
        <div className="modal-buttons" style={{ justifyContent: 'center' }}>
          <button type="button" className="btn btn-outline" onClick={onClose}>Anuluj</button>
          <button type="button" className="btn btn-gold" onClick={() => onSave(text)}>Zapisz serię</button>
        </div>
      </div>
    </div>
  );
}

export function SummaryModal({ data, history, plan, settings, onClose }) {
  const remaining = remainingWorkoutsThisWeek(history, data.week, plan, settings);
  const advanced = Boolean(data.weekProg && data.weekProg.advanced);
  return (
    <div className="modal-overlay" style={overlayStyle}>
      <div className="modal-box" style={{ textAlign: 'center' }}>
        <div style={{ fontSize: '3rem', marginBottom: 10 }}>🏆</div>
        <div className="modal-title" style={{ marginBottom: 8 }}>Trening Ukończony!</div>
        <p id="summarySubtitle" style={{ color: 'var(--text-muted)', fontSize: '0.9rem', marginBottom: 16 }}>
          {advanced ? (
            <>
              🎉 <strong>Świetna robota!</strong> Ukończyłeś wszystkie {Object.keys(plan).length} treningi w Tygodniu {data.weekProg.previousWeek}.
              <br />
              <span style={{ color: 'var(--accent-gold)', fontWeight: 800 }}>
                Aplikacja automatycznie przeszła do Tygodnia {data.weekProg.newWeek}! 🚀
              </span>
            </>
          ) : (
            <>
              Świetna robota! Trening został zapisany w historii.{' '}
              {remaining.length > 0 && (
                <>
                  Do ukończenia tego tygodnia pozostał: <strong>Trening {remaining.join(', ')}</strong>.
                </>
              )}
            </>
          )}
        </p>

        <div style={{ background: 'rgba(2, 44, 67, 0.7)', borderRadius: 10, padding: 14, marginBottom: 20, textAlign: 'left' }}>
          <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: 6, fontSize: '0.9rem' }}>
            <span style={{ color: 'var(--text-muted)' }}>Trening:</span>
            <span id="sumWorkoutName" style={{ fontWeight: 800, color: '#fff' }}>{data.name}</span>
          </div>
          <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: 6, fontSize: '0.9rem' }}>
            <span style={{ color: 'var(--text-muted)' }}>Tydzień:</span>
            <span id="sumWeekNum" style={{ fontWeight: 800, color: '#fff' }}>Tydzień {data.week}</span>
          </div>
          <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: 6, fontSize: '0.9rem' }}>
            <span style={{ color: 'var(--text-muted)' }}>Liczba serii ogółem:</span>
            <span id="sumTotalSets" style={{ fontWeight: 800, color: 'var(--accent-gold)' }}>{data.sets} serii</span>
          </div>
          <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: '0.9rem' }}>
            <span style={{ color: 'var(--text-muted)' }}>Objętość (tonaż):</span>
            <span id="sumTotalVolume" style={{ fontWeight: 800, color: 'var(--success-green)' }}>{data.volume.toLocaleString('pl-PL')} kg</span>
          </div>
        </div>

        <button type="button" className="btn btn-gold btn-large" onClick={onClose}>
          Super, przejdź do historii
        </button>
      </div>
    </div>
  );
}

export function SavedPlansModal({ plans, activeId, onLoad, onRename, onDuplicate, onDelete, onCreate, onOpenTemplates, onClose }) {
  return (
    <div className="modal-overlay" style={overlayStyle}>
      <div className="modal-box" style={{ maxWidth: 440 }}>
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 6 }}>
          <div className="modal-title" style={{ marginBottom: 0 }}>📂 Moje Plany Treningowe</div>
          <button type="button" className="btn btn-outline btn-mini" onClick={onClose}>✕</button>
        </div>
        <p style={{ fontSize: '0.78rem', color: 'var(--text-muted)', marginBottom: 12 }}>
          Możesz tworzyć i zapisywać różne plany. Przy wczytaniu innego planu, Twój bieżący układ automatycznie zapisze się w pamięci, a Twoja historia treningów pozostanie zachowana!
        </p>

        <div className="saved-plans-list" id="savedPlansListContainer">
          {plans.length === 0 ? (
            <div style={{ color: 'var(--text-muted)', textAlign: 'center', padding: 20 }}>Brak zapisanych planów</div>
          ) : (
            plans.map(plan => {
              const isActive = plan.id === activeId;
              const counts = planCounts(plan.workouts, plan.workoutOrder);
              const ids = workoutIds(plan.workouts, plan.workoutOrder);
              const date = plan.updatedAt ? new Date(plan.updatedAt).toLocaleDateString('pl-PL') : '';
              return (
                <div key={plan.id} className={`saved-plan-card${isActive ? ' active-plan' : ''}`}>
                  <div className="saved-plan-top">
                    <div className="saved-plan-name">{plan.name}</div>
                    {isActive && <span className="badge badge-gold saved-plan-active-badge">✓ AKTYWNY</span>}
                  </div>
                  <div className="saved-plan-meta">
                    {ids.map((id, index) => `${plan.workouts[id].name}: ${counts[index]} ćw.`).join(' | ')}
                    {date ? ` • ${date}` : ''}
                  </div>
                  <div className="saved-plan-btns">
                    {isActive ? (
                      <span style={{ fontSize: '0.75rem', color: 'var(--accent-gold)', fontWeight: 700 }}>Obecnie używany plan</span>
                    ) : (
                      <button type="button" className="btn btn-gold btn-mini" onClick={() => onLoad(plan.id)}>⚡ Wczytaj ten plan</button>
                    )}
                    <div className="saved-plan-secondary-actions">
                      <button type="button" className="btn btn-outline btn-mini" onClick={() => onRename(plan.id)}>✏️ Zmień nazwę</button>
                      <button type="button" className="btn btn-outline btn-mini" onClick={() => onDuplicate(plan.id)}>📋 Kopiuj</button>
                      {!isActive && (
                        <button type="button" className="btn btn-danger btn-mini saved-plan-delete" onClick={() => onDelete(plan.id)}>🗑️ Usuń</button>
                      )}
                    </div>
                  </div>
                </div>
              );
            })
          )}
        </div>

        <div className="saved-plans-footer">
          <button type="button" className="btn btn-gold btn-mini" onClick={onCreate}>➕ Nowy plan</button>
          <button type="button" className="btn btn-outline btn-mini" onClick={onOpenTemplates}>📚 Gotowe plany</button>
          <button type="button" className="btn btn-outline btn-mini" onClick={onClose}>Zamknij</button>
        </div>
      </div>
    </div>
  );
}

export function SavePlanAsModal({ mode, defaultName, onConfirm, onClose }) {
  const [name, setName] = useState(defaultName);
  const [days, setDays] = useState('3');
  const title = mode === 'create_new' ? 'Stwórz nowy plan treningowy' : 'Zapisz obecny plan jako...';
  return (
    <div className="modal-overlay" style={overlayStyle}>
      <div className="modal-box" style={{ maxWidth: 340 }}>
        <div className="modal-title">{title}</div>
        <div className="form-group">
          <label className="form-label">Nazwa planu treningowego</label>
          <input
            type="text"
            id="savePlanAsInput"
            className="modal-input"
            placeholder="np. Mój FBW Faza 2"
            value={name}
            autoFocus
            onFocus={event => event.target.select()}
            onChange={event => setName(event.target.value)}
          />
        </div>
        {mode === 'create_new' && (
          <div className="form-group">
            <label className="form-label">Liczba treningów w tygodniu</label>
            <select className="modal-select" value={days} onChange={event => setDays(event.target.value)}>
              <option value="3">3 treningi</option>
              <option value="4">4 treningi</option>
              <option value="5">5 treningów</option>
            </select>
          </div>
        )}
        <div className="modal-buttons">
          <button type="button" className="btn btn-outline" onClick={onClose}>Anuluj</button>
          <button type="button" className="btn btn-gold" id="btnConfirmSavePlanAs" onClick={() => onConfirm(name, Number(days))}>{mode === 'create_new' ? 'Utwórz' : 'Zapisz'}</button>
        </div>
      </div>
    </div>
  );
}

export function TemplateLibraryModal({ onUse, onClose }) {
  return (
    <div className="modal-overlay" style={overlayStyle}>
      <div className="modal-box template-library-modal" style={{ maxWidth: 460 }}>
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 6 }}>
          <div className="modal-title" style={{ marginBottom: 0 }}>📚 Gotowe plany na siłownię</div>
          <button type="button" className="btn btn-outline btn-mini" onClick={onClose}>✕</button>
        </div>
        <p style={{ fontSize: '0.8rem', color: 'var(--text-muted)', marginBottom: 12 }}>Wybrany plan zostanie zapisany jako Twój własny, trwały plan do dowolnej edycji.</p>
        <div className="template-library-list">
          {PLAN_TEMPLATES.map(template => (
            <article className="template-card" key={template.id}>
              <div className="template-card-title">{template.title}</div>
              <div className="template-card-meta">{template.daysPerWeek} dni • {template.level} • {template.goal}</div>
              <p>{template.description}</p>
              <button type="button" className="btn btn-gold btn-mini" onClick={() => onUse(template.id)}>Użyj tego planu</button>
            </article>
          ))}
        </div>
      </div>
    </div>
  );
}

export function PlanDrawer({ session, index, onSelect, onClose, onFinish }) {
  return (
    <div className="plan-drawer-overlay" style={overlayStyle} onClick={onClose}>
      <div className="plan-drawer" onClick={event => event.stopPropagation()}>
        <div className="plan-drawer-header">
          <span className="drawer-title">{session.workoutName} (Tydz. {session.week})</span>
          <button type="button" className="drawer-close-btn" onClick={onClose}>✕</button>
        </div>
        <p style={{ fontSize: '0.8rem', color: 'var(--text-muted)', marginBottom: 12 }}>
          Kliknij ćwiczenie, aby natychmiast do niego przejść:
        </p>
        <ul className="drawer-exercises-list">
          {session.exercises.map((ex, idx) => {
            const isCurrent = idx === index;
            const isDone = ex.completedSets.length >= ex.setsTarget;
            const icon = isDone ? '✓' : isCurrent ? '▶' : '○';
            return (
              <li key={`${ex.id}-${idx}`} className={`drawer-ex-item ${isCurrent ? 'current' : ''} ${isDone ? 'done' : ''}`} onClick={() => onSelect(idx)}>
                <span>{icon} {idx + 1}. {ex.name}</span>
                <span style={{ fontSize: '0.75rem', color: 'var(--text-muted)' }}>{ex.completedSets.length}/{ex.setsTarget}</span>
              </li>
            );
          })}
        </ul>
        <button type="button" className="btn btn-danger" style={{ marginTop: 20 }} onClick={onFinish}>
          Zakończ trening
        </button>
      </div>
    </div>
  );
}
