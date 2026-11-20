import { exerciseEntries, exerciseNames, filterHistory, formatRecordedSet, weekOptions, workoutIds } from '../logic.js';
import { useT } from '../i18n.jsx';
import { dateLocale, exerciseDisplayName, workoutDisplayName } from '../i18n/core.js';

export function HistoryTab({ history, plan, workout, week, exerciseMode, exerciseName, onWorkout, onWeek, onWeekSelect, onToggleExerciseMode, onReset, onExerciseName, onDelete }) {
  const { t, lang } = useT();
  const ids = [...new Set([...workoutIds(plan), ...history.map(item => item.workoutId).filter(id => /^[A-E]$/.test(id))])].sort();
  const workoutPills = [['all', t('history.allWorkouts')], ...ids.map(id => [id, t('history.workoutPill', { id })])];
  const weeks = weekOptions(history, workout);
  const filtered = filterHistory(history, workout, week);
  const names = exerciseNames(history, plan);
  const selectedExercise = names.includes(exerciseName) ? exerciseName : names[0] || '';
  const isFiltered = workout !== 'all' || week !== 'all' || exerciseMode;

  let statusText = t('history.allSessions');
  if (isFiltered) {
    const parts = [];
    if (workout !== 'all') parts.push(t('history.workoutPill', { id: workout }));
    if (week !== 'all') parts.push(`${t('common.week')} ${week}`);
    if (exerciseMode) parts.push(t('history.byExercise'));
    statusText = parts.join(' · ');
  }

  return (
    <section className="tab-view active" id="view-history">
      <div style={{ marginBottom: 12 }}>
        <h2 style={{ fontSize: '1.3rem', fontWeight: 800, color: '#fff', marginBottom: 10 }}>{t('history.title')}</h2>

        <div className="history-filters-box">
          <div>
            <div className="hist-filter-label"><span>{t('history.chooseWorkout')}</span></div>
            <div className={`hist-pills-row${workoutPills.length > 4 ? ' scrollable' : ''}`}>
              {workoutPills.map(([id, label]) => (
                <button type="button" key={id} className={`hist-pill${workout === id ? ' active' : ''}`} onClick={() => onWorkout(id)}>
                  {label}
                </button>
              ))}
            </div>
          </div>

          <div>
            <div className="hist-filter-label"><span>{t('history.filterWeek')}</span></div>
            <div style={{ display: 'flex', gap: 6, alignItems: 'center' }}>
              <button type="button" className={`hist-pill${week === 'all' ? ' active' : ''}`} onClick={() => onWeek('all')}>
                {t('history.allWeeks')}
              </button>
              <select className="hist-week-select" value={week === 'all' ? 'all' : String(week)} onChange={event => onWeekSelect(event.target.value)}>
                <option value="all">{t('history.weekPlaceholder')}</option>
                {weeks.map(value => (
                  <option key={value} value={value}>{t('history.weekOption', { value })}</option>
                ))}
              </select>
            </div>
          </div>

          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', gap: 8, paddingTop: 4, borderTop: '1px solid rgba(20, 107, 151, 0.25)' }}>
            <button type="button" className="btn btn-outline btn-mini" onClick={onToggleExerciseMode} style={{ fontSize: '0.75rem' }}>
              {t('history.exercisePreview')}
            </button>
            {isFiltered && (
              <button type="button" className="btn-clear-filter" onClick={onReset} style={{ display: 'inline-flex' }}>
                {t('history.clearFilters')}
              </button>
            )}
          </div>

          {exerciseMode && (
            <div style={{ marginTop: 6 }}>
              <select className="modal-select" value={selectedExercise} onChange={event => onExerciseName(event.target.value)}>
                {names.map(name => (
                  <option key={name} value={name}>{exerciseDisplayName(name, lang)}</option>
                ))}
              </select>
            </div>
          )}
        </div>

        <div className="history-status-strip">
          <span>{history.length === 0 ? t('history.allSessions') : statusText}</span>
          <span>{t('history.sessionsCount', { n: history.length === 0 ? 0 : filtered.length })}</span>
        </div>
      </div>

      <div className="history-list">
        {history.length === 0 ? (
          <div className="card" style={{ textAlign: 'center', padding: '30px 20px', color: 'var(--text-muted)' }}>
            <div style={{ fontSize: '2.5rem', marginBottom: 10 }}>📊</div>
            <div style={{ fontSize: '1.1rem', fontWeight: 800, color: '#fff', marginBottom: 6 }}>{t('history.emptyTitle')}</div>
            <p style={{ fontSize: '0.85rem' }}>
              {t('history.emptyHint')}
            </p>
          </div>
        ) : exerciseMode ? (
          <ExerciseHistory sessions={filtered} exerciseName={selectedExercise} />
        ) : (
          <AllSessions history={history} sessions={filtered} onDelete={onDelete} />
        )}
      </div>
    </section>
  );
}

function AllSessions({ history, sessions, onDelete }) {
  const { t, lang } = useT();
  if (sessions.length === 0) {
    return (
      <div className="card" style={{ textAlign: 'center', padding: '24px 16px', color: 'var(--text-muted)' }}>
        <div style={{ fontSize: '2rem', marginBottom: 8 }}>🔍</div>
        <div style={{ fontWeight: 700, color: '#fff', marginBottom: 4 }}>{t('history.noResultsTitle')}</div>
        <p style={{ fontSize: '0.85rem' }}>{t('history.noResultsHint')}</p>
      </div>
    );
  }

  // History is stored newest-first (same as the legacy app), so render it in that order.
  return sessions.map(session => {
    const realIndex = history.indexOf(session);
    const date = new Date(session.date);
    const dateFormatted = !isNaN(date)
      ? date.toLocaleDateString(dateLocale(lang), { weekday: 'short', day: '2-digit', month: '2-digit', year: 'numeric' })
      : session.date;

    return (
      <div className="history-session-card" key={session.sessionId || realIndex}>
        <div className="session-header">
          <div className="session-header-left">
            <span className="session-title">{workoutDisplayName(session.workoutName, lang)}</span>
            <span className="session-week-tag">{t('common.week')} {session.week}</span>
          </div>
          <span className="session-date">{dateFormatted}</span>
        </div>
        <div style={{ marginBottom: 12 }}>
          {(session.exercises || []).map((ex, index) => {
            const setsText = ex.sets.map(s => formatRecordedSet(s, ex, lang)).join('  |  ');
            return (
              <div className="session-ex-row" key={`${ex.name}-${index}`}>
                <div className="session-ex-name"><strong>{exerciseDisplayName(ex.name, lang)}</strong></div>
                <div className="session-ex-sets">{setsText || t('history.noSets')}</div>
              </div>
            );
          })}
        </div>
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', borderTop: '1px solid rgba(20, 107, 151, 0.3)', paddingTop: 8, fontSize: '0.8rem', color: 'var(--text-muted)' }}>
          <span>
            {t('history.volumeLabel')} <strong>{(session.totalVolume || 0).toLocaleString(dateLocale(lang))} kg</strong> ({t('common.setsCount', { count: session.totalSets || 0 })})
          </span>
          <button type="button" className="btn btn-outline btn-mini" style={{ color: 'var(--danger-red)', borderColor: 'transparent' }} onClick={() => onDelete(realIndex)}>
            {t('history.deleteEntry')}
          </button>
        </div>
      </div>
    );
  });
}

function ExerciseHistory({ sessions, exerciseName }) {
  const { t, lang } = useT();
  if (!exerciseName) {
    return <div style={{ color: 'var(--text-muted)', textAlign: 'center' }}>{t('history.chooseExercise')}</div>;
  }
  const entries = exerciseEntries(sessions, exerciseName);
  if (entries.length === 0) {
    return (
      <div className="card" style={{ textAlign: 'center', color: 'var(--text-muted)' }}>
        {t('history.noExerciseHistory')} <strong>{exerciseDisplayName(exerciseName, lang)}</strong>
      </div>
    );
  }
  return (
    <div className="card">
      <h3 style={{ fontSize: '1.15rem', color: 'var(--accent-gold)', marginBottom: 6 }}>{exerciseDisplayName(exerciseName, lang)}</h3>
      <p style={{ fontSize: '0.85rem', color: 'var(--text-muted)', marginBottom: 14 }}>{t('history.executionHistory')}</p>
      {entries.map((entry, index) => {
        const date = new Date(entry.date);
        const dateText = !isNaN(date) ? date.toLocaleDateString(dateLocale(lang)) : entry.date;
        const setsText = entry.sets.map(s => formatRecordedSet(s, { name: exerciseName }, lang)).join('  |  ');
        return (
          <div key={`${entry.date}-${index}`} style={{ padding: '10px 0', borderBottom: '1px solid rgba(20, 107, 151, 0.3)' }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: 4, fontSize: '0.85rem' }}>
              <strong style={{ color: '#fff' }}>{workoutDisplayName(entry.workoutName, lang)} · {t('common.week')} {entry.week}</strong>
              <span style={{ color: 'var(--text-muted)' }}>{dateText}</span>
            </div>
            <div style={{ fontSize: '0.95rem', fontWeight: 700, color: 'var(--accent-gold)' }}>{setsText}</div>
          </div>
        );
      })}
    </div>
  );
}
