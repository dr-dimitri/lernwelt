import { useId, useRef, useState } from 'react';
import type { Subject, SubjectId } from '../domain/subjects';
import { SubjectArt } from './DiscoveryArt';

export default function SubjectLibrary({
  subjects,
  selected,
  onSelect,
}: {
  subjects: readonly Subject[];
  selected: SubjectId;
  onSelect: (subjectId: SubjectId) => void;
}) {
  const [query, setQuery] = useState('');
  const searchId = useId();
  const searchField = useRef<HTMLInputElement>(null);
  const normalizedQuery = query.trim().toLocaleLowerCase('de');
  const matches = subjects.filter((subject) =>
    subject.name.toLocaleLowerCase('de').includes(normalizedQuery),
  );

  return (
    <section className="subject-library" aria-labelledby="subjects-title">
      <div className="library-heading">
        <div>
          <p className="eyebrow">WISSEN BEGINNT MIT NEUGIER</p>
          <h2 id="subjects-title">Womit legen wir los?</h2>
        </div>
        <div className="subject-search">
          <label className="subject-search-field" htmlFor={searchId}>
            Fach suchen
            <input
              id={searchId}
              ref={searchField}
              type="search"
              value={query}
              autoComplete="off"
              placeholder="Fach suchen …"
              onChange={(event) => setQuery(event.target.value)}
            />
          </label>
          {query && (
            <button
              type="button"
              className="secondary-button"
              onClick={() => {
                setQuery('');
                searchField.current?.focus();
              }}
            >
              Suche löschen
            </button>
          )}
        </div>
      </div>
      <p className="subject-result-count" role="status" aria-live="polite">
        {matches.length} {matches.length === 1 ? 'Fach' : 'Fächer'}
        {normalizedQuery ? ' gefunden' : ' für dich'}
      </p>
      {matches.length ? (
        <div className="subject-grid">
          {matches.map((subject) => (
            <button
              key={subject.id}
              type="button"
              className={`subject-card ${subject.id}`}
              aria-label={subject.name}
              aria-pressed={selected === subject.id}
              onClick={() => onSelect(subject.id)}
            >
              <span className="subject-artwork">
                <SubjectArt subject={subject.id} symbol={subject.symbol} />
                {selected === subject.id && (
                  <span className="subject-selected">
                    <span aria-hidden="true">✓ </span>Ausgewählt
                  </span>
                )}
              </span>
              <span className="subject-name">{subject.name}</span>
              <span className="subject-description">{subject.description}</span>
              <span className="subject-action">
                Los geht’s <span aria-hidden="true">→</span>
              </span>
            </button>
          ))}
        </div>
      ) : (
        <div className="subject-empty">
          <h2>Kein Fach gefunden</h2>
          <p>Ändere deine Suche oder lösche sie. Dann siehst du mehr Fächer.</p>
        </div>
      )}
    </section>
  );
}
