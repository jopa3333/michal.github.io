import { useRef } from 'react';
import { useT } from '../i18n.jsx';

export function SettingsTab({ settings, onSound, onVibrate, onTest, onExport, onExportCsv, onImport, onClear, onUnit, onAutoRest }) {
  const { t, lang, setLang } = useT();
  const fileInput = useRef(null);
  return (
    <section className="tab-view active" id="view-settings">
      <div className="card">
        <h2 style={{ fontSize: '1.25rem', fontWeight: 800, color: 'var(--accent-gold)', marginBottom: 16 }}>{t('settings.title')}</h2>

        <div className="settings-section-title">{t('settings.localeSection')}</div>
        <div className="settings-row compact">
          <span>{t('common.language')}</span>
          <div style={{ display: 'flex', gap: 8 }}>
            <button type="button" id="langPlBtn" className={`btn btn-mini ${lang === 'pl' ? 'btn-gold' : 'btn-outline'}`} onClick={() => setLang('pl')}>Polski</button>
            <button type="button" id="langEnBtn" className={`btn btn-mini ${lang === 'en' ? 'btn-gold' : 'btn-outline'}`} onClick={() => setLang('en')}>English</button>
          </div>
        </div>
        <div className="settings-row compact" style={{ marginBottom: 8 }}>
          <span>kg / lb</span>
          <div style={{ display: 'flex', gap: 8 }}>
            <button type="button" id="unitKgBtn" className={`btn btn-mini ${settings.unit !== 'lb' ? 'btn-gold' : 'btn-outline'}`} onClick={() => onUnit('kg')}>kg</button>
            <button type="button" id="unitLbBtn" className={`btn btn-mini ${settings.unit === 'lb' ? 'btn-gold' : 'btn-outline'}`} onClick={() => onUnit('lb')}>lb</button>
          </div>
        </div>

        <div className="settings-section-title">{t('settings.backup')}</div>
        <p style={{ fontSize: '0.85rem', color: 'var(--text-muted)', marginBottom: 14 }}>
          {t('settings.backupInfo')}
        </p>

        <div style={{ display: 'flex', flexDirection: 'column', gap: 10, marginBottom: 20 }}>
          <button type="button" className="btn btn-primary" onClick={onExport}>{t('settings.export')}</button>
          <button type="button" id="exportCsvSettingsBtn" className="btn btn-outline" onClick={onExportCsv}>{t('settings.exportCsv')}</button>
          <button type="button" className="btn btn-outline" onClick={() => fileInput.current && fileInput.current.click()}>
            {t('settings.import')}
          </button>
          <input
            type="file"
            id="importJsonFileInput"
            accept=".json"
            style={{ display: 'none' }}
            ref={fileInput}
            onChange={event => {
              const file = event.target.files[0];
              if (file) onImport(file);
              event.target.value = '';
            }}
          />
        </div>

        <div className="settings-section-title">{t('settings.soundSection')}</div>
        <div className="settings-row">
          <span>{t('settings.sounds')}</span>
          <input type="checkbox" id="settingSoundToggle" style={{ width: 20, height: 20 }} checked={settings.soundEnabled !== false} onChange={event => onSound(event.target.checked)} />
        </div>
        <div className="settings-row">
          <span>{t('settings.vibrate')}</span>
          <input type="checkbox" id="settingVibrateToggle" style={{ width: 20, height: 20 }} checked={settings.vibrateEnabled !== false} onChange={event => onVibrate(event.target.checked)} />
        </div>
        <div className="settings-row">
          <span>{t('settings.autoRest')}</span>
          <input type="checkbox" id="settingAutoRestToggle" style={{ width: 20, height: 20 }} checked={settings.autoStartRest === true} onChange={event => onAutoRest(event.target.checked)} />
        </div>
        <button type="button" className="btn btn-outline" style={{ marginTop: 10, width: '100%', borderColor: 'var(--accent-gold)', color: 'var(--accent-gold)', fontSize: '0.85rem' }} onClick={onTest}>
          {t('settings.test')}
        </button>
        <p style={{ fontSize: '0.75rem', color: 'var(--text-muted)', marginTop: 6, lineHeight: 1.3 }}>
          ℹ️ <em>{t('settings.iphoneNote')}</em>
        </p>

        <div className="settings-section-title">{t('settings.dataSection')}</div>
        <div style={{ display: 'flex', flexDirection: 'column', gap: 10, marginTop: 10 }}>
          <button type="button" className="btn btn-danger" onClick={onClear}>{t('settings.clear')}</button>
        </div>

        <div style={{ marginTop: 24, paddingTop: 12, borderTop: '1px solid rgba(20, 107, 151, 0.3)', fontSize: '0.75rem', color: 'var(--text-muted)', textAlign: 'center' }}>
          {t('settings.footer')}
        </div>
      </div>
    </section>
  );
}
