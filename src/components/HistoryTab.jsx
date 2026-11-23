import { exerciseEntries, exerciseNames, filterHistory, filterHistoryByPlan, formatRecordedSet, formatWeightDisplay, historyPlanGroups, progressSeries, sessionPlanId, toDisplayWeight, weekOptions, workoutIds } from '../logic.js';
import { useT } from '../i18n.jsx';
import { canonicalExerciseName, dateLocale, exerciseDisplayName, workoutDisplayName } from '../i18n/core.js';

export function HistoryTab({ history, plan, workout, week, exerciseMode, exerciseName, unit = 'kg', planFilter = 'all', savedPlans = [], settings = null, onWorkout, onWeek, onWeekSelect, onToggleExerciseMode, onReset, onExerciseName, onDelete, onPlan, onExportCsv }) {
  const { t, lang } = useT();
  const planGroups = historyPlanGroups(history, savedPlans, settings);
  const planLabel = id => {
    const group = planGroups.find(g => g.id === id);
    if (group) return group.deleted ? t('history.deletedPlan') : group.name;
    return t('history.deletedPlan');
  };
  const planHistory = filterHistoryByPlan(history, planFilter, settings, savedPlans);
  // Exercises defined in the selected plan (for non-active saved plans, read savedPlans[i].workouts).
  const selectedSaved = savedPlans.find(p => p.id === planFilter);
  const workoutsForNames = planFilter === 'all' || planFilter === settings?.activePlanId
    ? plan
    : selectedSaved?.workouts || {};
  const ids = [...new Set([...workoutIds(workoutsForNames), ...planHistory.map(item => item.workoutId).filter(id => /^[A-E]$/.test(id))])].sort();
  const workoutPills = [['all', t('history.allWorkouts')], ...ids.map(id => [id, t('history.workoutPill', { id })])];
  const weeks = weekOptions(planHistory, workout);
  const filtered = filterHistory(planHistory, workout, week);
  const names = exerciseNames(planHistory, workoutsForNames);
  const typedRaw = String(exerciseName ?? '');
  const typedCanonical = typedRaw.trim() ? canonicalExerciseName(typedRaw.trim()) : '';
  // Partial typing filter in "All plans": if no exact match yet, pick the first matching name.
  const partialMatch = typedCanonical && !names.some(n => n.toLowerCase() === typedCanonical.toLowerCase())
    ? names.find(n => exerciseDisplayName(n, lang).toLowerCase().includes(typedRaw.trim().toLowerCase()) || n.toLowerCase().includes(typedCanonical.toLowerCase()))
    : null;
  const selectedExercise = planFilter === 'all'
    ? (partialMatch || typedCanonical || names[0] || '')
    : (names.includes(typedCanonical) ? typedCanonical : names[0] || '');
  const selectValue = names.includes(selectedExercise) ? selectedExercise : (names[0] || '');
  const isFiltered = planFilter !== 'all' || workout !== 'all' || week !== 'all' || exerciseMode;

  let statusText = t('history.allSessions');
  if (isFiltered) {
    const parts = [];
    if (planFilter !== 'all') parts.push(planLabel(planFilter));
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
          {planGroups.length > 1 && (
            <div>
              <div className="hist-filter-label"><span>{t('history.planFilter')}</span></div>
              <select id="histPlanSelect" className="hist-week-select" value={planFilter} onChange={event => onPlan && onPlan(event.target.value)}>
                <option value="all">{t('history.allPlans')}</option>
                {planGroups.map(g => (
                  <option key={g.id} value={g.id}>{g.deleted ? t('history.deletedPlan') : g.name}</option>
                ))}
              </select>
            </div>
          )}
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
              <select id="histWeekSelect" className="hist-week-select" value={week === 'all' ? 'all' : String(week)} onChange={event => onWeekSelect(event.target.value)}>
                <option value="all">{t('history.weekPlaceholder')}</option>
                {weeks.map(value => (
                  <option key={value} value={value}>{t('history.weekOption', { value })}</option>
                ))}
              </select>
            </div>
          </div>

          <div className="hist-actions-row">
            <button type="button" className="btn btn-outline btn-mini hist-action-btn" onClick={onToggleExerciseMode}>
              {t('history.exercisePreview')}
            </button>
            {filtered.length > 0 && onExportCsv && (
              <button type="button" id="exportCsvHistoryBtn" className="btn btn-outline btn-mini hist-action-btn" onClick={() => onExportCsv(filtered)}>
                {t('history.exportCsv')}
              </button>
            )}
          </div>
          {isFiltered && (
            <div style={{ display: 'flex', justifyContent: 'flex-end' }}>
              <button type="button" className="btn-clear-filter" onClick={onReset} style={{ display: 'inline-flex' }}>
                {t('history.clearFilters')}
              </button>
            </div>
          )}

          {exerciseMode && (
            <div style={{ marginTop: 6 }}>
              {planFilter === 'all' ? (
                <>
                  <div style={{ display: 'flex', gap: 6 }}>
                    <input
                      type="text"
                      id="histExerciseInput"
                      className="modal-input"
                      list="histExerciseSuggestions"
                      placeholder={t('history.exerciseInputPlaceholder')}
                      value={typedRaw}
                      onChange={event => onExerciseName(event.target.value)}
                    />
                    {typedRaw && (
                      <button type="button" className="btn btn-outline btn-mini" onClick={() => onExerciseName('')} title={t('history.clearFilters')}>✕</button>
                    )}
                  </div>
                  <datalist id="histExerciseSuggestions">
                    {names.map(name => (
                      <option key={name} value={exerciseDisplayName(name, lang)} />
                    ))}
                  </datalist>
                </>
              ) : (
                <select className="modal-select" value={selectValue} onChange={event => onExerciseName(event.target.value)}>
                  {!selectValue && selectedExercise && (
                    <option value="">{exerciseDisplayName(selectedExercise, lang)}</option>
                  )}
                  {names.map(name => (
                    <option key={name} value={name}>{exerciseDisplayName(name, lang)}</option>
                  ))}
                </select>
              )}
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
          <ExerciseHistory sessions={filtered} exerciseName={selectedExercise} unit={unit} />
        ) : (
          <AllSessions history={history} sessions={filtered} unit={unit} onDelete={onDelete} planTagFor={planFilter === 'all' ? session => planLabel(sessionPlanId(session, settings)) : null} />
        )}
      </div>
    </section>
  );
}

function AllSessions({ history, sessions, unit = 'kg', onDelete, planTagFor = null }) {
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
            {planTagFor && <span className="session-plan-tag">{planTagFor(session)}</span>}
          </div>
          <span className="session-date">{dateFormatted}</span>
        </div>
        <div style={{ marginBottom: 12 }}>
          {(session.exercises || []).map((ex, index) => {
            const setsText = ex.sets.map(s => formatRecordedSet(s, ex, lang, unit)).join('  |  ');
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
            {t('history.volumeLabel')} <strong>{Math.round(toDisplayWeight(session.totalVolume || 0, unit)).toLocaleString(dateLocale(lang))} {unit}</strong> ({t('common.setsCount', { count: session.totalSets || 0 })})
          </span>
          <button type="button" className="btn btn-outline btn-mini" style={{ color: 'var(--danger-red)', borderColor: 'transparent' }} onClick={() => onDelete(realIndex)}>
            {t('history.deleteEntry')}
          </button>
        </div>
      </div>
    );
  });
}

function ExerciseHistory({ sessions, exerciseName, unit = 'kg' }) {
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
  const series = progressSeries(sessions, exerciseName);
  return (
    <div className="card">
      <h3 style={{ fontSize: '1.15rem', color: 'var(--accent-gold)', marginBottom: 6 }}>{exerciseDisplayName(exerciseName, lang)}</h3>
      <ProgressChart series={series} unit={unit} />
      <p style={{ fontSize: '0.85rem', color: 'var(--text-muted)', marginBottom: 14 }}>{t('history.executionHistory')}</p>
      {entries.map((entry, index) => {
        const date = new Date(entry.date);
        const dateText = !isNaN(date) ? date.toLocaleDateString(dateLocale(lang)) : entry.date;
        const setsText = entry.sets.map(s => formatRecordedSet(s, { name: exerciseName }, lang, unit)).join('  |  ');
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

function ProgressChart({ series, unit }) {
  const { t, lang } = useT();
  const { measurement, points } = series;
  if (!points || points.length === 0) return null;
  const unitLabel = measurement === 'weight' ? unit : measurement === 'seconds' ? t('common.secondsShort') : t('common.reps');
  const disp = v => (measurement === 'weight' ? toDisplayWeight(v, unit) : v);
  const fmt = v => (measurement === 'weight' ? formatWeightDisplay(v, lang, unit) : String(v));
  const shortDate = iso => {
    const d = new Date(iso);
    return !isNaN(d) ? d.toLocaleDateString(dateLocale(lang), { day: '2-digit', month: '2-digit' }) : String(iso).slice(0, 10);
  };
  if (points.length < 2) {
    const only = points[0];
    return (
      <div className="progress-chart-box" data-testid="progress-chart">
        <div className="progress-chart-header">
          <span>{t('history.chartTitle')}</span>
          <strong>{fmt(only.value)} {unitLabel}</strong>
        </div>
        <p className="progress-chart-note">{t('history.chartTooFew')}</p>
      </div>
    );
  }
  const values = points.map(p => disp(p.value));
  const min = Math.min(...values);
  const max = Math.max(...values);
  const span = max - min || 1;
  const W = 300;
  const H = 110;
  const padX = 18;
  const padTop = 22;
  const padBot = 20;
  const coords = points.map((p, i) => {
    const x = padX + (i / (points.length - 1)) * (W - padX * 2);
    const y = max === min ? (padTop + H - padBot) / 2 : padTop + (1 - (disp(p.value) - min) / span) * (H - padTop - padBot);
    return { ...p, x: Math.round(x * 10) / 10, y: Math.round(y * 10) / 10 };
  });
  const line = coords.map((c, i) => `${i === 0 ? 'M' : 'L'}${c.x},${c.y}`).join(' ');
  const rawDelta = Math.round((disp(points[points.length - 1].value) - disp(points[0].value)) * 100) / 100;
  const deltaStr = lang === 'en' ? String(Math.abs(rawDelta)) : String(Math.abs(rawDelta)).replace('.', ',');
  const deltaText = rawDelta === 0
    ? t('history.chartSame')
    : t('history.chartDelta', { sign: rawDelta > 0 ? '+' : '−', delta: deltaStr, unit: unitLabel });
  return (
    <div className="progress-chart-box" data-testid="progress-chart">
      <div className="progress-chart-header">
        <span>{t('history.chartTitle')}</span>
        <span>{fmt( points.reduce((m, p) => Math.min(m, p.value), Infinity) )} – {fmt( points.reduce((m, p) => Math.max(m, p.value), -Infinity) )} {unitLabel}</span>
      </div>
      <svg className="progress-chart-svg" viewBox={`0 0 ${W} ${H}`} role="img">
        <path d={line} fill="none" stroke="var(--accent-gold)" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round" />
        {coords.map((c, i) => (
          <g key={`${c.date}-${i}`}>
            <circle cx={c.x} cy={c.y} r={c.isPR ? 4.5 : 3.5} className={c.isPR ? 'chart-dot pr' : 'chart-dot'} />
            {c.isPR && <text x={c.x} y={c.y - 7} textAnchor="middle" className="chart-pr-mark">🏆</text>}
          </g>
        ))}
        <text x={padX} y={H - 4} className="chart-axis-lbl">{shortDate(points[0].date)}</text>
        <text x={W - padX} y={H - 4} textAnchor="end" className="chart-axis-lbl">{shortDate(points[points.length - 1].date)}</text>
      </svg>
      <div className="progress-chart-delta">{deltaText}</div>
    </div>
  );
}
