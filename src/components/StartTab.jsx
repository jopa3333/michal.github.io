import { useT } from '../i18n.jsx';
import { dateLocale } from '../i18n/core.js';

// Start is now the account/dashboard hub; the workout picker hero lives in WorkoutTab.
export function StartTab({ settings, session, history, onContinue, onOpenSettings }) {
  const { t, lang } = useT();
  const total = Number.isSafeInteger(settings.completedWorkoutCount) && settings.completedWorkoutCount >= 0
    ? settings.completedWorkoutCount
    : history.length;
  const thisWeek = history.filter(entry => entry.week === settings.currentWeek).length;
  const lastDate = history[0] ? new Date(history[0].date) : null;
  const lastText = lastDate && !isNaN(lastDate) ? lastDate.toLocaleDateString(dateLocale(lang)) : t('start.noWorkouts');

  return (
    <section className="tab-view active" id="view-start">
      <div className="dashboard">
        <h2 className="dashboard-title">{t('start.dashboard')}</h2>

        {session && (
          <button type="button" className="btn btn-large btn-success dashboard-continue" onClick={onContinue}>
            {t('start.continue')}
          </button>
        )}

        <div className="dashboard-stats">
          <div className="stat-tile">
            <span className="stat-value">{total}</span>
            <span className="stat-label">{t('start.statTotal')}</span>
          </div>
          <div className="stat-tile">
            <span className="stat-value">{thisWeek}</span>
            <span className="stat-label">{t('start.statWeek')}</span>
          </div>
          <div className="stat-tile">
            <span className="stat-value stat-value-date">{lastText}</span>
            <span className="stat-label">{t('start.statLast')}</span>
          </div>
        </div>

        <div className="dashboard-card">
          <div className="dashboard-card-title">💾 {t('start.backupTitle')}</div>
          <p className="dashboard-card-text">{t('start.backupText')}</p>
          <button type="button" className="btn btn-outline" onClick={onOpenSettings}>
            {t('start.backupAction')}
          </button>
        </div>

        <div className="dashboard-card">
          <div className="dashboard-card-title">
            🔐 {t('start.googleTitle')} <span className="badge badge-soon">{t('start.soon')}</span>
          </div>
          <p className="dashboard-card-text">{t('start.googleText')}</p>
        </div>
      </div>
    </section>
  );
}
