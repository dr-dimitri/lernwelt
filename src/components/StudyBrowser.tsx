import { useEffect, useRef, useState } from 'react';
import type { LearningState } from '../domain/learning';
import type { SubjectId } from '../domain/subjects';
import { matchesUnit, unitQuestions, type StudyUnit } from '../domain/study';

const unitsPerPage = 12;

export default function StudyBrowser({
  state,
  subject,
  disabled,
  onSelect,
  focusOnMount = false,
}: {
  state: LearningState;
  subject: SubjectId;
  disabled: boolean;
  onSelect: (unit: StudyUnit) => void;
  focusOnMount?: boolean;
}) {
  const [areaId, setAreaId] = useState('');
  const [query, setQuery] = useState('');
  const [page, setPage] = useState(0);
  const heading = useRef<HTMLHeadingElement>(null);
  useEffect(() => {
    if (focusOnMount) heading.current?.focus();
  }, [focusOnMount]);
  useEffect(() => {
    setPage(0);
  }, [state.difficulty, subject]);
  const catalog = state.studyCatalog!;
  const areas = catalog.areas.filter((a) => a.subject === subject);
  const selectedArea = areas.find((a) => a.id === areaId);
  const searching = query.trim().length > 0;
  const matches = catalog.units.filter(
    (u) =>
      u.subject === subject &&
      (searching
        ? matchesUnit(
            u,
            areas.find((a) => a.id === u.areaId),
            query,
          )
        : u.areaId === selectedArea?.id),
  );
  const pageCount = Math.ceil(matches.length / unitsPerPage);
  const currentPage = Math.min(page, Math.max(0, pageCount - 1));
  const visibleUnits = matches.slice(
    currentPage * unitsPerPage,
    (currentPage + 1) * unitsPerPage,
  );
  const enterArea = (id: string) => {
    if (disabled) return;
    setAreaId(id);
    setQuery('');
    setPage(0);
    heading.current?.focus();
  };
  const turnPage = (next: number) => {
    if (disabled) return;
    setPage(next);
    heading.current?.focus();
  };
  return (
    <section className="study-browser" aria-label="Lehrplanthemen">
      <div className="study-browser-heading">
        <div>
          <p className="eyebrow">
            KLASSE 5{subject === 'english' ? ' · 1. FREMDSPRACHE' : ''}
          </p>
          <h3 ref={heading} tabIndex={-1}>
            {selectedArea && !searching
              ? selectedArea.name
              : 'Was möchtest du üben?'}
          </h3>
        </div>
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
      </div>
      {(selectedArea || searching) && (
        <button
          className="secondary-button"
          disabled={disabled}
          onClick={() => enterArea('')}
        >
          ← Alle Lernbereiche
        </button>
      )}
      {searching && (
        <p role="status">
          {matches.length}{' '}
          {matches.length === 1
            ? 'Unterthema gefunden'
            : 'Unterthemen gefunden'}
        </p>
      )}
      {!selectedArea && !searching ? (
        <div className="study-grid">
          {areas.map((a) => {
            const count = catalog.units.filter((u) => u.areaId === a.id).length;
            return (
              <button
                className="study-card"
                key={a.id}
                disabled={disabled}
                onClick={() => enterArea(a.id)}
              >
                <strong>{a.name}</strong>
                <span>
                  {count} {count === 1 ? 'Unterthema' : 'Unterthemen'}
                </span>
                <span className="study-action">Entdecken →</span>
              </button>
            );
          })}
        </div>
      ) : matches.length ? (
        <div className="study-grid">
          {visibleUnits.map((unit) => {
            const questions = unitQuestions(state, unit);
            const solved = questions.filter((q) => q.solved).length;
            return (
              <button
                className="study-card"
                key={unit.id}
                disabled={disabled || !questions.length}
                onClick={() => onSelect(unit)}
              >
                <strong>{unit.name}</strong>
                <span>
                  {searching
                    ? areas.find((a) => a.id === unit.areaId)?.name
                    : unit.goal}
                </span>
                <small>
                  {questions.length
                    ? `${questions.length} ${questions.length === 1 ? 'Aufgabe' : 'Aufgaben'} · ${solved} schon gelöst`
                    : 'Auf dieser Stufe noch keine Aufgaben'}
                </small>
                <span className="study-action">Kurze Runde starten →</span>
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
              setPage(0);
            }}
          >
            Suche löschen
          </button>
        </div>
      )}
      {(selectedArea || searching) && pageCount > 1 && (
        <nav className="page-controls" aria-label="Unterthemen-Seiten">
          <button
            type="button"
            className="secondary-button"
            disabled={disabled || currentPage === 0}
            onClick={() => turnPage(currentPage - 1)}
          >
            ← Vorige Unterthemen
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
            Weitere Unterthemen →
          </button>
        </nav>
      )}
      <p className="sample-note">
        Wähle frei. Du kannst jederzeit das Thema oder die Stufe wechseln.
        Quellen und Lernziele findest du bei der Übung.
      </p>
    </section>
  );
}
