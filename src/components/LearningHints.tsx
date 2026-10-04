import { useId, useState } from 'react';
import type { Question } from '../domain/learning';
import InfoPanel from './InfoPanel';

/** The parent keys this component by question ID so another task starts at tip 1. */
export default function LearningHints({
  question,
  compact = false,
}: {
  question: Question;
  compact?: boolean;
}) {
  const hintId = useId();
  const [count, setCount] = useState(1);
  const [open, setOpen] = useState(false);
  const hints = [question.hint, ...question.furtherHints];
  if (compact)
    return (
      <section className="inline-hints" aria-label="Tipps">
        <button
          type="button"
          className="secondary-button"
          aria-expanded={open}
          aria-controls={hintId}
          onClick={() => setOpen((value) => !value)}
        >
          Tipp
        </button>
        {open && (
          <div id={hintId} className="hint-box" aria-live="polite">
            <strong>Tipp {count}</strong>
            <p>{hints[count - 1]}</p>
            {count < hints.length && (
              <button
                type="button"
                className="secondary-button"
                onClick={() => setCount((value) => value + 1)}
              >
                Nächster Tipp
              </button>
            )}
          </div>
        )}
      </section>
    );
  return (
    <InfoPanel className="hint-panel">
      <summary>Gib mir einen Tipp</summary>
      <ol aria-label="Deine Tipps" aria-live="polite">
        {hints.slice(0, count).map((hint, index) => (
          <li key={index} className="hint-box">
            <strong>Tipp {index + 1}</strong>
            <p>{hint}</p>
          </li>
        ))}
      </ol>
      {count < hints.length ? (
        <button
          type="button"
          className="primary-button"
          onClick={() => setCount((value) => value + 1)}
        >
          Nächster Tipp
        </button>
      ) : (
        <p>
          Probiere deinen Weg aus. Nach der Antwort kannst du den Lösungsweg
          ansehen.
        </p>
      )}
    </InfoPanel>
  );
}
