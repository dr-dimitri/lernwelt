import { useState } from 'react';
import type { Question } from '../domain/learning';
import InfoPanel from './InfoPanel';

/** The parent keys this component by question ID so another task starts at tip 1. */
export default function LearningHints({ question }: { question: Question }) {
  const [count, setCount] = useState(1);
  const hints = [question.hint, ...question.furtherHints];
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
