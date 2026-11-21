import { formatWeightDisplay, isTimedExercise, progressionRuleText, repsDisplay, workoutIds } from '../logic.js';
import { useT } from '../i18n.jsx';
import { exerciseDisplayName, planDisplayName, workoutDisplayName } from '../i18n/core.js';

export function PlanTab({ plan, planTab, onPlanTab, settings, savedCount, onOpenSaved, onSaveAs, onCreate, onAdd, onEdit, onMove, onDelete, onResetDefault }) {
  const { t, lang } = useT();
  const unit = settings?.unit === 'lb' ? 'lb' : 'kg';
  const ids = workoutIds(plan);
  const activeId = ids.includes(planTab) ? planTab : ids[0];
  const exercises = plan[activeId].exercises;
  // Keep the count inside a <span>: split the template around {count}.
  const [myPlansBefore, myPlansAfter = ''] = t('plan.myPlans').split('{count}');
  const activePlanName = planDisplayName(settings.activePlanName, lang);
  return (
    <section className="tab-view active" id="view-plan">
      <div className="plan-management-card">
        <div className="plan-mgmt-header">
          <span className="plan-mgmt-badge">{t('plan.activeBadge')}</span>
          <button type="button" className="btn btn-outline btn-mini" onClick={onOpenSaved} style={{ whiteSpace: 'nowrap' }}>
            {myPlansBefore}<span>{savedCount}</span>{myPlansAfter}
          </button>
          <h3 className="plan-mgmt-title" title={activePlanName}>{activePlanName}</h3>
        </div>
        <div className="plan-mgmt-actions">
          <button type="button" className="btn btn-outline btn-mini plan-mgmt-action" onClick={onSaveAs}>{t('plan.saveAs')}</button>
          <button type="button" className="btn btn-gold btn-mini plan-mgmt-action" onClick={onCreate}>{t('plan.newPlan')}</button>
          <button type="button" className="btn btn-primary btn-mini plan-mgmt-action" onClick={onAdd}>
            {t('plan.addExercise')}
          </button>
        </div>
      </div>

      <div className={`plan-tabs${ids.length > 3 ? ' plan-tabs-many' : ''}`}>
        {ids.map(id => (
          <button type="button" key={id} className={`plan-tab-btn${activeId === id ? ' active' : ''}`} onClick={() => onPlanTab(id)}>
            {workoutDisplayName(plan[id].name, lang)}
          </button>
        ))}
      </div>

      <div className="plan-edit-list">
        {exercises.length === 0 ? (
          <div className="card" style={{ textAlign: 'center', padding: '24px 16px', color: 'var(--text-muted)' }}>
            <div style={{ fontSize: '2rem', marginBottom: 8 }}>📝</div>
            <div style={{ fontWeight: 700, color: '#fff', marginBottom: 4 }}>{t('plan.emptyTitle')}</div>
            <p style={{ fontSize: '0.85rem', marginBottom: 12 }}>
              {t('plan.emptyHint')}
            </p>
            <button type="button" className="btn btn-gold btn-mini" onClick={onAdd}>{t('plan.addExercise')}</button>
          </div>
        ) : (
          exercises.map((ex, index) => (
            <div className="plan-item-card" key={ex.id}>
              <div className="plan-item-top">
                <div>
                  <div className="plan-item-title">{index + 1}. {exerciseDisplayName(ex.name, lang)}</div>
                  <div className="plan-item-details" style={{ marginTop: 4 }}>
                    <span>{t('plan.setsReps', { sets: ex.sets, reps: repsDisplay(ex) })}{isTimedExercise(ex) ? ' s' : ''}</span>
                    <span>{t('plan.tempo', { tempo: ex.tempo || '-' })}</span>
                    <span>{t('plan.rest', { n: ex.restSeconds })}</span>
                    <span>{t('plan.progress', { step: formatWeightDisplay(ex.progressionStep, lang, unit), unit, rule: progressionRuleText(ex.progressionType, lang) })}</span>
                  </div>
                </div>
              </div>
              <div className="plan-item-actions">
                <button type="button" className="btn btn-outline btn-mini" onClick={() => onEdit(index)}>{t('plan.edit')}</button>
                <button type="button" className="btn btn-outline btn-mini" disabled={index === 0} onClick={() => onMove(index, -1)}>⬆️</button>
                <button type="button" className="btn btn-outline btn-mini" disabled={index === exercises.length - 1} onClick={() => onMove(index, 1)}>⬇️</button>
                <button type="button" className="btn btn-danger btn-mini" style={{ marginLeft: 'auto' }} onClick={() => onDelete(index)}>{t('plan.delete')}</button>
              </div>
            </div>
          ))
        )}
      </div>

      <div style={{ marginTop: 20, textAlign: 'center' }}>
        <button type="button" className="btn btn-outline btn-mini" style={{ color: 'var(--text-muted)' }} onClick={onResetDefault}>
          {t('plan.resetDefault')}
        </button>
      </div>
    </section>
  );
}
