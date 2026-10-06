import { useLayoutEffect, useRef, useState } from 'react';
import type { LearningState } from '../domain/learning';
import type { SubjectId } from '../domain/subjects';
import {
  matchesUnit,
  matchesStudyText,
  unitQuestions,
  type StudyUnit,
  type StudySupplement,
} from '../domain/study';

const unitsPerPage = 6;

/** Selection only: the practice stays outside this catalog. */
export default function StudyBrowser({
  state,
  subject,
  disabled,
  onSelect,
  onSupplement,
  onNatureGames,
  onCells,
  active = true,
  focusOnMount = false,
}: {
  state: LearningState;
  subject: SubjectId;
  disabled: boolean;
  onSelect: (unit: StudyUnit) => void;
  onSupplement?: (link: StudySupplement) => void;
  onNatureGames?: () => void;
  onCells?: () => void;
  active?: boolean;
  focusOnMount?: boolean;
}) {
  const [areaId, setAreaId] = useState('');
  const [query, setQuery] = useState('');
  const [page, setPage] = useState(0);
  const heading = useRef<HTMLHeadingElement>(null);
  const selected = useRef<HTMLButtonElement | null>(null);
  const wasActive = useRef(active);
  const wasFocusRequested = useRef(false);
  const pendingFocus = useRef(false);
  useLayoutEffect(() => {
    // Keep the return target while its card is disabled by an outstanding read.
    if (
      active &&
      (!wasActive.current || (focusOnMount && !wasFocusRequested.current))
    ) {
      pendingFocus.current = true;
    }
    wasActive.current = active;
    wasFocusRequested.current = focusOnMount;
    if (active && !disabled && pendingFocus.current) {
      (selected.current?.isConnected && !selected.current.disabled
        ? selected.current
        : heading.current
      )?.focus();
      pendingFocus.current = false;
    }
  }, [active, disabled, focusOnMount]);
  const catalog = state.studyCatalog!;
  const areas = catalog.areas.filter((a) => a.subject === subject);
  const subjectUnits = catalog.units.filter((u) => u.subject === subject);
  const matches = subjectUnits.filter(
    (u) =>
      (!areaId || u.areaId === areaId) &&
      matchesUnit(
        u,
        areas.find((a) => a.id === u.areaId),
        query,
      ),
  );
  const links = new Map<string, { link: StudySupplement; unit: StudyUnit }>();
  if (onSupplement) {
    for (const unit of subjectUnits) {
      for (const link of unit.supplements) {
        const key = `${link.kind}:${link.target}`;
        if (!links.has(key)) links.set(key, { link, unit });
      }
    }
  }
  const supplementMatches = [...links.values()].filter(
    ({ link, unit }) =>
      (!areaId || unit.areaId === areaId) &&
      matchesUnit(
        { ...unit, name: link.label },
        areas.find((a) => a.id === unit.areaId),
        query,
      ),
  );
  const destinations: {
    key: string;
    link: StudySupplement | null;
    unit: StudyUnit | null;
  }[] = [
    ...(subject === 'nature' &&
    onNatureGames &&
    !areaId &&
    matchesStudyText(
      'Naturspiele Entdecken ausprobieren Pflanzen Tiere Futter',
      query,
    )
      ? [{ key: 'nature-games', link: null, unit: null }]
      : []),
    ...(subject === 'nature' &&
    onCells &&
    !areaId &&
    matchesStudyText(
      'Expedition Zellkern Zellen entdecken Mikroskop Erbinformation',
      query,
    )
      ? [{ key: 'cells', link: null, unit: null }]
      : []),
    ...supplementMatches.map(({ link, unit }) => ({
      key: `${link.kind}:${link.target}`,
      link,
      unit,
    })),
    ...matches.map((unit) => ({ key: unit.id, link: null, unit })),
  ];
  const pageCount = Math.ceil(destinations.length / unitsPerPage);
  const currentPage = Math.min(page, Math.max(0, pageCount - 1));
  const visible = destinations.slice(
    currentPage * unitsPerPage,
    (currentPage + 1) * unitsPerPage,
  );
  const turnPage = (next: number) => {
    if (disabled) return;
    setPage(next);
    heading.current?.focus();
  };
  return (
    <section
      className="study-browser"
      aria-label="Lehrplanthemen"
      hidden={!active}
    >
      <div className="study-browser-heading">
        <div>
          <p className="eyebrow">
            KLASSE 5{subject === 'english' ? ' · 1. FREMDSPRACHE' : ''}
          </p>
          <h3 ref={heading} tabIndex={-1}>
            Was möchtest du üben?
          </h3>
          <p>Wähle ein Thema. Deine Runde hat höchstens sechs Aufgaben.</p>
        </div>
        <div className="catalog-filters">
          <label className="study-search">
            Thema suchen
            <input
              type="search"
              value={query}
              disabled={disabled}
              placeholder={
                subject === 'mathematics'
                  ? 'z. B. Längen oder Winkel'
                  : subject === 'english'
                    ? 'z. B. Simple Present'
                    : 'z. B. Bestäubung'
              }
              onChange={(e) => {
                setQuery(e.target.value);
                setPage(0);
              }}
            />
          </label>
          <label>
            Themen filtern
            <select
              value={areaId}
              disabled={disabled}
              onChange={(e) => {
                setAreaId(e.target.value);
                setPage(0);
              }}
            >
              <option value="">Alle Themen</option>
              {areas.map((area) => (
                <option key={area.id} value={area.id}>
                  {area.name}
                </option>
              ))}
            </select>
          </label>
        </div>
      </div>
      {(query.trim() || areaId) && (
        <p role="status" className="catalog-results">
          {destinations.length}{' '}
          {destinations.length === 1 ? 'Thema gefunden' : 'Themen gefunden'}
        </p>
      )}
      {destinations.length ? (
        <div className="study-grid">
          {visible.map(({ key, link, unit }) => {
            const questions = unit ? unitQuestions(state, unit) : [];
            const solved = questions.filter((q) => q.solved).length;
            return (
              <button
                className="study-card"
                aria-label={
                  link
                    ? `${link.label}: ${unit?.name}. ${unit?.goal}`
                    : undefined
                }
                key={key}
                disabled={disabled || (!!unit && !link && !questions.length)}
                onClick={(event) => {
                  selected.current = event.currentTarget;
                  if (link) onSupplement?.(link);
                  else if (unit) onSelect(unit);
                  else if (key === 'cells') onCells?.();
                  else onNatureGames?.();
                }}
              >
                <strong>
                  {link?.label ??
                    unit?.name ??
                    (key === 'cells' ? 'Expedition Zellkern' : 'Naturspiele')}
                </strong>
                {link && <span className="study-context">{unit?.name}</span>}
                <span>
                  {areas.find((area) => area.id === unit?.areaId)?.name}
                </span>
                <span>
                  {unit?.goal ??
                    (key === 'cells'
                      ? 'Erkunde eine Zelle und vergleiche Modell und echtes Mikroskopbild.'
                      : 'Entdecke Blüten und Futterketten. Ohne Lernpunkte.')}
                </span>
                <small>
                  {!unit
                    ? 'Kostenlos ausprobieren'
                    : link
                      ? 'Gemeinsam entdecken und üben'
                      : questions.length
                        ? `${questions.length} ${questions.length === 1 ? 'Aufgabe' : 'Aufgaben'} · ${solved} schon gelöst`
                        : 'Auf dieser Stufe noch keine Aufgaben'}
                </small>
                <span className="study-action">
                  {link || !unit || (unit.id === 'nature-cells' && onCells)
                    ? 'Öffnen →'
                    : 'Kurze Runde starten →'}
                </span>
              </button>
            );
          })}
        </div>
      ) : (
        <div className="subject-empty">
          <h4>Hier haben wir nichts gefunden.</h4>
          <p>
            Versuche einen kürzeren Begriff, zum Beispiel „Zeit“ oder „Wasser“.
          </p>
          <button
            className="secondary-button"
            disabled={disabled}
            onClick={() => {
              setQuery('');
              setAreaId('');
              setPage(0);
            }}
          >
            Suche löschen
          </button>
        </div>
      )}
      {pageCount > 1 && (
        <nav className="page-controls" aria-label="Themen-Seiten">
          <button
            type="button"
            className="secondary-button"
            disabled={disabled || currentPage === 0}
            onClick={() => turnPage(currentPage - 1)}
          >
            ← Vorige Themen
          </button>
          <span aria-live="polite">
            Seite {currentPage + 1} von {pageCount}
          </span>
          <button
            type="button"
            className="secondary-button"
            disabled={disabled || currentPage === pageCount - 1}
            onClick={() => turnPage(currentPage + 1)}
          >
            Weitere Themen →
          </button>
        </nav>
      )}
      <p className="sample-note">
        Du kannst jederzeit das Thema oder die Stufe wechseln.
      </p>
    </section>
  );
}
