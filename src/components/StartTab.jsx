import { achievementsState, weekStreak } from '../logic.js';
import { useT } from '../i18n.jsx';
import { dateLocale } from '../i18n/core.js';

// Start is now the account/dashboard hub; the workout picker hero lives in WorkoutTab.
export function StartTab({
  settings, session, history, drive,
  onContinue, onOpenSettings, onOpenAchievements, onOpenAtlas,
  onDriveLogin, onDriveBackup, onDriveRestore, onDriveAuto, onDriveLogout, driveBusy,
}) {
  const { t, lang } = useT();
  const total = Number.isSafeInteger(settings.completedWorkoutCount) && settings.completedWorkoutCount >= 0
    ? settings.completedWorkoutCount
    : history.length;
  const thisWeek = history.filter(entry => entry.week === settings.currentWeek).length;
  const lastDate = history[0] ? new Date(history[0].date) : null;
  const lastText = lastDate && !isNaN(lastDate) ? lastDate.toLocaleDateString(dateLocale(lang)) : t('start.noWorkouts');
  const badges = achievementsState(history, settings);
  const earnedBadges = badges.filter(b => b.earned);
  const streak = weekStreak(history, settings.currentWeek);

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

        <button type="button" className="dashboard-card atlas-tile" onClick={onOpenAtlas} data-testid="atlas-tile">
          <div className="dashboard-card-title">📖 {t('atlas.startTile')}</div>
          <p className="dashboard-card-text">{t('atlas.startTileText')}</p>
        </button>

        <button type="button" className="dashboard-card dashboard-badges" onClick={onOpenAchievements}>
          <div className="dashboard-card-title">
            🏅 {t('start.badgesTitle')}
            <span className="badge badge-soon">{t('start.badgesCount', { earned: earnedBadges.length, total: badges.length })}</span>
          </div>
          <div className="badge-icons">
            {earnedBadges.length > 0
              ? earnedBadges.map(b => <span key={b.id} title={t(`start.badge.${b.id}`)}>{b.icon}</span>)
              : <span className="badge-empty">🔒</span>}
          </div>
          <p className="dashboard-card-text">{t('start.streakLine', { count: streak })}</p>
        </button>

        <div className="dashboard-card">
          <div className="dashboard-card-title">💾 {t('start.backupTitle')}</div>
          <p className="dashboard-card-text">{t('start.backupText')}</p>
          <button type="button" className="btn btn-outline" onClick={onOpenSettings}>
            {t('start.backupAction')}
          </button>
        </div>

        {drive && drive.email ? (
          <div className="dashboard-card">
            <div className="dashboard-card-title">🔐 {drive.email}</div>
            <p className="dashboard-card-text">
              {drive.lastBackupAt
                ? t('settings.driveLastBackup', {
                    date: new Date(drive.lastBackupAt).toLocaleString(
                      lang === 'pl' ? 'pl-PL' : 'en-GB',
                      { dateStyle: 'short', timeStyle: 'short' }
                    ),
                  })
                : t('settings.driveNoBackupYet')}
            </p>
            <div className="settings-row compact">
              <span>{t('settings.driveAutoBackup')}</span>
              <input type="checkbox" id="driveAutoBackupToggleStart" style={{ width: 20, height: 20 }} checked={Boolean(drive.autoBackup)} onChange={event => onDriveAuto(event.target.checked)} />
            </div>
            <div style={{ display: 'flex', flexDirection: 'column', gap: 10, marginTop: 8 }}>
              <button type="button" className="btn btn-outline" style={{ borderColor: 'var(--accent-gold)', color: 'var(--accent-gold)' }} disabled={driveBusy === 'restore'} onClick={onDriveBackup}>
                ☁️ {t('settings.driveBackupNow')}
              </button>
              <button type="button" className="btn btn-outline" disabled={driveBusy === 'restore'} onClick={onDriveRestore}>
                ♻️ {t('settings.driveRestore')}
              </button>
              <button type="button" className="btn btn-outline" style={{ fontSize: '0.8rem' }} onClick={onDriveLogout}>
                {t('settings.driveLogout')}
              </button>
            </div>
          </div>
        ) : (
          <div className="dashboard-card">
            <div className="dashboard-card-title">🔐 {t('start.googleTitle')}</div>
            <p className="dashboard-card-text">{t('start.googleText')}</p>
            <button type="button" className="btn btn-primary" disabled={driveBusy === 'login'} onClick={onDriveLogin}>
              {driveBusy === 'login' ? t('settings.driveBusy') : t('start.googleSignIn')}
            </button>
          </div>
        )}
      </div>
    </section>
  );
}
