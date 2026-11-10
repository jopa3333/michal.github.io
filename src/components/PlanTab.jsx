import { formatWeightDisplay, progressionRuleText, repsDisplay } from '../logic.js';

export function PlanTab({ plan, planTab, onPlanTab, settings, savedCount, onOpenSaved, onSaveAs, onCreate, onAdd, onEdit, onMove, onDelete, onResetDefault }) {
  const exercises = plan[planTab].exercises;
  return (
    <section className="tab-view active" id="view-plan">
      <div className="plan-management-card">
        <div className="plan-mgmt-header">
          <span className="plan-mgmt-badge">AKTYWNY PLAN TRENINGOWY</span>
          <button type="button" className="btn btn-outline btn-mini" onClick={onOpenSaved} style={{ whiteSpace: 'nowrap' }}>
            📂 Moje Plany (<span>{savedCount}</span>)
          </button>
          <h3 className="plan-mgmt-title" title={settings.activePlanName}>{settings.activePlanName}</h3>
        </div>
        <div className="plan-mgmt-actions">
          <button type="button" className="btn btn-outline btn-mini plan-mgmt-action" onClick={onSaveAs}>💾 Zapisz jako</button>
          <button type="button" className="btn btn-gold btn-mini plan-mgmt-action" onClick={onCreate}>➕ Nowy plan</button>
          <button type="button" className="btn btn-primary btn-mini plan-mgmt-action" onClick={onAdd}>
            + Dodaj ćwiczenie
          </button>
        </div>
      </div>

      <div className="plan-tabs">
        {['A', 'B', 'C'].map(id => (
          <button type="button" key={id} className={`plan-tab-btn${planTab === id ? ' active' : ''}`} onClick={() => onPlanTab(id)}>
            TRENING {id}
          </button>
        ))}
      </div>

      <div className="plan-edit-list">
        {exercises.length === 0 ? (
          <div className="card" style={{ textAlign: 'center', padding: '24px 16px', color: 'var(--text-muted)' }}>
            <div style={{ fontSize: '2rem', marginBottom: 8 }}>📝</div>
            <div style={{ fontWeight: 700, color: '#fff', marginBottom: 4 }}>Brak ćwiczeń w tym dniu</div>
            <p style={{ fontSize: '0.85rem', marginBottom: 12 }}>
              Kliknij przycisk poniżej, aby dodać pierwsze ćwiczenie z bazy lub własne.
            </p>
            <button type="button" className="btn btn-gold btn-mini" onClick={onAdd}>+ Dodaj ćwiczenie</button>
          </div>
        ) : (
          exercises.map((ex, index) => (
            <div className="plan-item-card" key={ex.id}>
              <div className="plan-item-top">
                <div>
                  <div className="plan-item-title">{index + 1}. {ex.name}</div>
                  <div className="plan-item-details" style={{ marginTop: 4 }}>
                    <span>🎯 {ex.sets} serie × {repsDisplay(ex)}</span>
                    <span>⏱ Tempo: {ex.tempo || '-'}</span>
                    <span>⏳ Odpoczynek: {ex.restSeconds}s</span>
                    <span>📈 Progres: +{formatWeightDisplay(ex.progressionStep)} kg ({progressionRuleText(ex.progressionType)})</span>
                  </div>
                </div>
              </div>
              <div className="plan-item-actions">
                <button type="button" className="btn btn-outline btn-mini" onClick={() => onEdit(index)}>✏️ Edytuj</button>
                <button type="button" className="btn btn-outline btn-mini" disabled={index === 0} onClick={() => onMove(index, -1)}>⬆️</button>
                <button type="button" className="btn btn-outline btn-mini" disabled={index === exercises.length - 1} onClick={() => onMove(index, 1)}>⬇️</button>
                <button type="button" className="btn btn-danger btn-mini" style={{ marginLeft: 'auto' }} onClick={() => onDelete(index)}>🗑️ Usuń</button>
              </div>
            </div>
          ))
        )}
      </div>

      <div style={{ marginTop: 20, textAlign: 'center' }}>
        <button type="button" className="btn btn-outline btn-mini" style={{ color: 'var(--text-muted)' }} onClick={onResetDefault}>
          🔄 Przywróć domyślny plan treningowy
        </button>
      </div>
    </section>
  );
}
