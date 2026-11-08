import { useRef } from 'react';

export function SettingsTab({ settings, onSound, onVibrate, onTest, onExport, onImport, onClear }) {
  const fileInput = useRef(null);
  return (
    <section className="tab-view active" id="view-settings">
      <div className="card">
        <h2 style={{ fontSize: '1.25rem', fontWeight: 800, color: 'var(--accent-gold)', marginBottom: 16 }}>Ustawienia Aplikacji</h2>

        <div className="settings-section-title">Kopia zapasowa danych</div>
        <p style={{ fontSize: '0.85rem', color: 'var(--text-muted)', marginBottom: 14 }}>
          Wszystkie Twoje plany i historia treningów zapisują się w pamięci tej przeglądarki. Możesz w każdej chwili pobrać plik kopii zapasowej.
        </p>

        <div style={{ display: 'flex', flexDirection: 'column', gap: 10, marginBottom: 20 }}>
          <button type="button" className="btn btn-primary" onClick={onExport}>💾 Pobierz kopię zapasową (JSON)</button>
          <button type="button" className="btn btn-outline" onClick={() => fileInput.current && fileInput.current.click()}>
            📥 Wczytaj kopię z pliku (JSON)
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

        <div className="settings-section-title">Dźwięki i wibracje</div>
        <div className="settings-row">
          <span>Dźwięki timera i zapisu</span>
          <input type="checkbox" id="settingSoundToggle" style={{ width: 20, height: 20 }} checked={settings.soundEnabled !== false} onChange={event => onSound(event.target.checked)} />
        </div>
        <div className="settings-row">
          <span>Wibracje na telefonie</span>
          <input type="checkbox" id="settingVibrateToggle" style={{ width: 20, height: 20 }} checked={settings.vibrateEnabled !== false} onChange={event => onVibrate(event.target.checked)} />
        </div>
        <button type="button" className="btn btn-outline" style={{ marginTop: 10, width: '100%', borderColor: 'var(--accent-gold)', color: 'var(--accent-gold)', fontSize: '0.85rem' }} onClick={onTest}>
          🔊 Przetestuj dźwięk i lektora AI
        </button>
        <p style={{ fontSize: '0.75rem', color: 'var(--text-muted)', marginTop: 6, lineHeight: 1.3 }}>
          ℹ️ <em>Jeśli na iPhonie nie słyszysz dźwięku, upewnij się, że przełącznik wyciszenia z boku telefonu (Silent Switch) jest wyłączony oraz głośność multimediów jest podkręcona.</em>
        </p>

        <div className="settings-section-title">Zarządzanie danymi</div>
        <div style={{ display: 'flex', flexDirection: 'column', gap: 10, marginTop: 10 }}>
          <button type="button" className="btn btn-danger" onClick={onClear}>🗑️ Wyczyść całą historię treningów</button>
        </div>

        <div style={{ marginTop: 24, paddingTop: 12, borderTop: '1px solid rgba(20, 107, 151, 0.3)', fontSize: '0.75rem', color: 'var(--text-muted)', textAlign: 'center' }}>
          Trening 2026 • Wersja lokalna offline • Montserrat & Native Web Audio
        </div>
      </div>
    </section>
  );
}
