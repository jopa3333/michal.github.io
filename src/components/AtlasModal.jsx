import { useMemo, useState } from 'react';
import { useT } from '../i18n.jsx';
import { categoryDisplayName, exerciseDisplayName } from '../i18n/core.js';
import { ATLAS_CATEGORIES, ATLAS_EXERCISES, atlasEntryFor, atlasSearch } from '../atlas/index.js';
import { EXERCISE_DATABASE } from '../data.js';
import { BodyMuscleMap, MotionSchematic, TempoBar, muscleLabel } from './AtlasVisuals.jsx';

// Tempo comes from the training database (src/data.js) so the atlas never
// duplicates training data; unknown names fall back to 2010.
function tempoFor(name) {
  const known = EXERCISE_DATABASE.find(item => item.name === name);
  return (known && known.tempo) || '2010';
}

function AtlasRow({ entry, lang, onOpen }) {
  return (
    <button type="button" className="atlas-row" onClick={() => onOpen(entry)} data-testid="atlas-row">
      <span className="atlas-row-main">
        <strong className="atlas-row-name">{exerciseDisplayName(entry.name, lang)}</strong>
        <span className="atlas-row-cat">{categoryDisplayName(entry.category, lang)}</span>
      </span>
      <span className="atlas-row-muscles">
        {entry.primaryMuscles.slice(0, 3).map(slug => (
          <span className="atlas-row-pm" key={slug}>{muscleLabel(slug, lang)}</span>
        ))}
      </span>
    </button>
  );
}

function AtlasDetail({ entry, lang, t, onClose, onSelectMuscle }) {
  const loc = entry[lang === 'en' ? 'en' : 'pl'];
  const tempo = tempoFor(entry.name);
  const isIsometric = entry.mechanic === 'isometric';
  return (
    <div className="atlas-detail" data-testid="atlas-detail">
      <button type="button" className="btn btn-outline atlas-back" onClick={onClose}>← {t('atlas.title')}</button>

      <h3 className="atlas-detail-name" data-testid="atlas-detail-name">
        {exerciseDisplayName(entry.name, lang)}
      </h3>
      {entry.aliases && entry.aliases.length > 0 && (
        <p className="atlas-detail-aliases">
          <em>{t('atlas.aliases')}:</em> {entry.aliases.map(a => lang === 'en' ? exerciseDisplayName(a, lang) : a).join(' · ')}
        </p>
      )}
      <div className="atlas-detail-tags">
        <span className="tag">{categoryDisplayName(entry.category, lang)}</span>
        <span className="tag">{t(`atlas.equipment.${entry.equipment}`)}</span>
        <span className="tag">{t(`atlas.mechanic.${entry.mechanic}`)}</span>
      </div>

      <p className="atlas-detail-summary">{loc.summary}</p>
      <p className="atlas-detail-prime">
        <span className="atlas-detail-prime-label">💪 {t('atlas.primeMover')}:</span> {loc.primeMover}
      </p>

      <MotionSchematic pattern={entry.pattern} tempo={tempo} lang={lang} />

      <div className="atlas-detail-block">
        <h4 className="atlas-detail-h">{t('atlas.howTo')}</h4>
        <ol className="atlas-phases">
          {loc.phases.map((phase, idx) => (
            <li key={idx}>
              <span className="atlas-phase-num">{t('atlas.step', { num: idx + 1 })}</span>
              <span>{phase}</span>
            </li>
          ))}
        </ol>
      </div>

      <div className="atlas-detail-block">
        <h4 className="atlas-detail-h">{t('atlas.tempoTitle')} · <span className="atlas-tempo-inline">{tempo}</span></h4>
        <TempoBar tempo={tempo} isIsometric={isIsometric} lang={lang} />
      </div>

      <div className="atlas-detail-block">
        <h4 className="atlas-detail-h">{t('atlas.primaryMuscles')} / {t('atlas.secondaryMuscles')}</h4>
        <p className="atlas-muscle-legend">
          <span className="atlas-swatch atlas-swatch-primary" /> {entry.primaryMuscles.map(slug => muscleLabel(slug, lang)).join(', ')}
        </p>
        {entry.secondaryMuscles.length > 0 && (
          <p className="atlas-muscle-legend">
            <span className="atlas-swatch atlas-swatch-secondary" /> {entry.secondaryMuscles.map(slug => muscleLabel(slug, lang)).join(', ')}
          </p>
        )}
        <BodyMuscleMap
          primaryMuscles={entry.primaryMuscles}
          secondaryMuscles={entry.secondaryMuscles}
          onSelectMuscle={onSelectMuscle}
          frontLabel={t('atlas.front')}
          backLabel={t('atlas.back')}
          lang={lang}
        />
        <p className="atlas-muscle-hint">{t('atlas.muscleHint')}</p>
      </div>

      <div className="atlas-detail-cols">
        <div>
          <h4 className="atlas-detail-h">{t('atlas.cues')}</h4>
          <ul className="atlas-list atlas-list-cues">{loc.cues.map((cue, idx) => <li key={idx}>{cue}</li>)}</ul>
          <h4 className="atlas-detail-h">{t('atlas.mistakes')}</h4>
          <ul className="atlas-list atlas-list-mistakes">{loc.mistakes.map((m, idx) => <li key={idx}>{m}</li>)}</ul>
        </div>
      </div>

      {loc.note && (
        <div className="atlas-detail-block">
          <h4 className="atlas-detail-h">{t('atlas.notes')}</h4>
          <p className="atlas-note">{loc.note}</p>
        </div>
      )}

      <div className="atlas-detail-block">
        <h4 className="atlas-detail-h">{t('atlas.sources')}</h4>
        <ul className="atlas-sources">{entry.sources.map((source, idx) => <li key={idx}>{source}</li>)}</ul>
      </div>
    </div>
  );
}

export function AtlasModal({ initialName = null, onClose }) {
  const { t, lang } = useT();
  const [query, setQuery] = useState('');
  const [category, setCategory] = useState(null);
  const [muscle, setMuscle] = useState(null);
  const [openName, setOpenName] = useState(initialName || null);

  const openEntry = openName ? atlasEntryFor(openName) : null;
  const list = useMemo(() => {
    let entries = atlasSearch(query, muscle);
    if (category) entries = entries.filter(entry => entry.category === category);
    return entries;
  }, [query, muscle, category]);

  const selectMuscle = slug => {
    setMuscle(slug);
    setOpenName(null);
  };

  return (
    <div className="modal-overlay atlas-overlay" style={{ display: 'flex' }} onClick={event => { if (event.target === event.currentTarget) onClose(); }}>
      <div className="atlas-modal" role="dialog" aria-label={t('atlas.title')}>
        <div className="atlas-header">
          <h3 className="atlas-title" data-testid="atlas-title">📖 {t('atlas.title')}</h3>
          <button type="button" className="atlas-close" onClick={onClose} aria-label="✕">✕</button>
        </div>

        {openEntry ? (
          <div className="atlas-scroll">
            <AtlasDetail
              entry={openEntry}
              lang={lang}
              t={t}
              onClose={() => setOpenName(null)}
              onSelectMuscle={selectMuscle}
            />
          </div>
        ) : (
          <div className="atlas-scroll">
            <input
              type="search"
              className="atlas-search"
              placeholder={t('atlas.searchPlaceholder')}
              value={query}
              onChange={event => setQuery(event.target.value)}
              data-testid="atlas-search"
            />
            <div className="atlas-chips" data-testid="atlas-chips">
              <button
                type="button"
                className={`atlas-chip${!category ? ' active' : ''}`}
                onClick={() => setCategory(null)}
              >
                {t('atlas.filterAll')}
              </button>
              {ATLAS_CATEGORIES.map(cat => (
                <button
                  type="button"
                  key={cat}
                  className={`atlas-chip${category === cat ? ' active' : ''}`}
                  onClick={() => setCategory(category === cat ? null : cat)}
                >
                  {categoryDisplayName(cat, lang)}
                </button>
              ))}
            </div>

            <div className="atlas-list-meta">
              <span>{t('atlas.count', { count: list.length })}</span>
              {muscle && (
                <span className="atlas-muscle-filter">
                  {t('atlas.muscleFilter', { muscle: muscleLabel(muscle, lang) })}
                  <button type="button" className="atlas-muscle-clear" onClick={() => setMuscle(null)}>
                    {t('atlas.clearMuscleFilter')}
                  </button>
                </span>
              )}
            </div>

            {list.length === 0 ? (
              <p className="atlas-empty" data-testid="atlas-empty">{t('atlas.noResults')}</p>
            ) : (
              <div className="atlas-rows" data-testid="atlas-rows">
                {list.map(entry => (
                  <AtlasRow key={entry.id} entry={entry} lang={lang} onOpen={e => setOpenName(e.name)} />
                ))}
              </div>
            )}

            <p className="atlas-muscle-hint atlas-muscle-hint-list">{t('atlas.muscleHint')}</p>
            <BodyMuscleMap
              compact
              primaryMuscles={[]}
              secondaryMuscles={[]}
              selectedMuscle={muscle}
              onSelectMuscle={slug => setMuscle(muscle === slug ? null : slug)}
              frontLabel={t('atlas.front')}
              backLabel={t('atlas.back')}
              lang={lang}
            />
          </div>
        )}
      </div>
    </div>
  );
}
