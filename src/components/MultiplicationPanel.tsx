import { useEffect, useRef, useState } from 'react';
import type {
  MultiplicationInput,
  MultiplicationMode,
  MultiplicationResult,
  MultiplicationState,
  MultiplicationTask,
} from '../domain/multiplication';
import { desktop } from '../lib/desktop';

const modes = [
  {
    id: 'tables' as const,
    name: '100er-Einmaleins',
    description: '1 × 1 bis 10 × 10 · Ergebnisse bis 100',
    symbol: '×',
    count: 100,
  },
  {
    id: 'squares' as const,
    name: 'Quadratzahlen',
    description: '1 × 1 bis 25 × 25 · dieselbe Zahl mal sich selbst',
    symbol: '²',
    count: 20,
  },
];
const message = (error: unknown) =>
  error instanceof Error
    ? error.message
    : 'Dein Rechentraining ist gerade nicht verfügbar.';
type Feedback = {
  task: MultiplicationTask;
  answer: string | null;
  result: MultiplicationResult;
};

export default function MultiplicationPanel({
  profileVersion,
}: {
  profileVersion: number;
}) {
  const [mode, setMode] = useState<MultiplicationMode>('tables');
  const [state, setState] = useState<MultiplicationState | null>(null);
  const [answer, setAnswer] = useState('');
  const [feedback, setFeedback] = useState<Feedback | null>(null);
  const [pending, setPending] = useState<MultiplicationInput | null>(null);
  const [error, setError] = useState('');
  const [busy, setBusy] = useState(true);
  const [reload, setReload] = useState(0);
  const revision = useRef(0);
  const inFlight = useRef(false);
  const field = useRef<HTMLInputElement>(null);
  const heading = useRef<HTMLHeadingElement>(null);

  useEffect(() => {
    const current = ++revision.current;
    inFlight.current = true;
    setBusy(true);
    setState(null);
    setError('');
    setAnswer('');
    setFeedback(null);
    setPending(null);
    void desktop
      .getMultiplicationState(mode)
      .then((value) => {
        if (current === revision.current) setState(value);
      })
      .catch((err: unknown) => {
        if (current === revision.current) setError(message(err));
      })
      .finally(() => {
        if (current === revision.current) {
          inFlight.current = false;
          setBusy(false);
        }
      });
    return () => {
      ++revision.current;
    };
  }, [mode, reload, profileVersion]);

  useEffect(() => {
    if (!busy && !pending) {
      if (feedback) heading.current?.focus();
      else if (state?.task) field.current?.focus();
    }
  }, [busy, pending, feedback, state]);

  async function submit(value: string | null) {
    if (inFlight.current || feedback || !state?.profileReady || !state.task)
      return;
    if (!pending && value !== null && !/^\d+$/.test(value.trim())) {
      setError(
        'Gib eine ganze Zahl ein, zum Beispiel 24. Nur Ziffern, keine Rechenzeichen.',
      );
      return;
    }
    const input = pending ?? {
      mode: state.mode,
      sequence: state.task.sequence,
      answer: value,
    };
    const current = revision.current;
    inFlight.current = true;
    setBusy(true);
    setError('');
    setPending(input);
    try {
      const result = await desktop.answerMultiplication(input);
      if (current !== revision.current) return;
      setFeedback({ task: state.task, answer: input.answer, result });
      setState(result.state);
      setPending(null);
    } catch (err) {
      if (current === revision.current) setError(message(err));
    } finally {
      if (current === revision.current) {
        inFlight.current = false;
        setBusy(false);
      }
    }
  }
  const task = feedback?.task ?? state?.task;
  const disabled = busy || !!pending;
  const modeInfo = modes.find((item) => item.id === mode)!;
  return (
    <section
      className="detail-panel multiplication-panel"
      aria-labelledby="multiplication-title"
      aria-busy={busy}
    >
      <p className="eyebrow">KLEINE RECHENPAUSE, GROSSES KÖNNEN</p>
      <h2 id="multiplication-title">Einmaleins-Trainer</h2>
      <p>
        Rechne in deinem Tempo. Jede richtige Antwort bringt 1 Punkt – auch in
        einer neuen Übungsrunde. Fehler kosten nichts.
      </p>
      {state && (
        <div className="points-balance" aria-label="Verfügbare Lernpunkte">
          {state.wallet.balance}{' '}
          {state.wallet.balance === 1 ? 'Punkt' : 'Punkte'}
        </div>
      )}
      <h3>Was möchtest du üben?</h3>
      <div className="trainer-modes" aria-label="Rechenart">
        {modes.map((item) => (
          <button
            key={item.id}
            className="level-card"
            aria-pressed={mode === item.id}
            disabled={disabled}
            onClick={() => setMode(item.id)}
          >
            <span aria-hidden="true">{item.symbol}</span>
            <strong>{item.name}</strong>
            <small>{item.description}</small>
          </button>
        ))}
      </div>
      {busy && (
        <p role="status">Dein Rechentraining wird geladen oder gespeichert …</p>
      )}
      {error && (
        <div role="alert" className="error-message">
          <p>{error}</p>
          {pending && (
            <button
              className="primary-button"
              disabled={busy}
              onClick={() => void submit(pending.answer)}
            >
              Speichern erneut versuchen
            </button>
          )}
          <button
            className="secondary-button"
            disabled={busy}
            onClick={() => setReload((value) => value + 1)}
          >
            Trainer neu laden
          </button>
        </div>
      )}
      {state && !state.profileReady && (
        <p>
          Speichere zuerst unten dein Lernprofil. Dann kannst du losrechnen und
          Punkte sammeln.
        </p>
      )}
      {state?.profileReady && (
        <p className="sample-note">
          {state.answered} {state.answered === 1 ? 'Aufgabe' : 'Aufgaben'} geübt
          · {state.correct} richtig in dieser Rechenart. Dein Stand bleibt auf
          diesem Gerät.
        </p>
      )}
      {mode === 'squares' && (
        <p className="sample-note">
          Pro Runde übst du 5 zufällig ausgewählte Quadratzahlen. Jede kommt
          4-mal dran – gemischt in 20 Aufgaben. In der nächsten Runde werden
          wieder 5 ausgewählt. Manche können dir erneut begegnen.
        </p>
      )}
      {task && (
        <article className="flashcard" aria-labelledby="multiplication-prompt">
          <p className="eyebrow">
            {modeInfo.name} · RUNDE {task.round} · AUFGABE {task.position} VON{' '}
            {task.roundSize}
          </p>
          <p>
            {mode === 'squares'
              ? 'Eine Quadratzahl entsteht, wenn du eine Zahl mit sich selbst malnimmst.'
              : 'Wie viel ist das? Schreibe nur das Ergebnis.'}
          </p>
          <h3 id="multiplication-prompt">
            {task.left} × {task.right} = ?
          </h3>
          {!feedback ? (
            <>
              <details key={`${mode}-${task.sequence}`} className="source-note">
                <summary>Gib mir einen Rechentipp</summary>
                <p>
                  {mode === 'squares'
                    ? 'Beide Zahlen sind gleich. Zerlege eine davon in Zehner und Einer. Rechne die beiden Malaufgaben aus und zähle die Ergebnisse zusammen.'
                    : `Du kannst ${task.right} mal die Zahl ${task.left} zusammenzählen. Oder nutze eine Malaufgabe, die du schon kennst, und zähle weiter.`}
                </p>
              </details>
              <form
                onSubmit={(event) => {
                  event.preventDefault();
                  void submit(answer);
                }}
              >
                <label>
                  Dein Ergebnis
                  <input
                    ref={field}
                    inputMode="numeric"
                    maxLength={8}
                    autoComplete="off"
                    value={answer}
                    disabled={disabled}
                    aria-describedby="multiplication-help"
                    onChange={(event) => setAnswer(event.target.value)}
                  />
                </label>
                <p id="multiplication-help">
                  Nur die Zahl eingeben. Mit Enter prüfst du deine Antwort.
                </p>
                <div className="card-actions">
                  <button
                    className="primary-button"
                    type="submit"
                    disabled={disabled || !answer.trim()}
                  >
                    Antwort prüfen
                  </button>
                  <button
                    className="secondary-button"
                    type="button"
                    disabled={disabled}
                    onClick={() => void submit(null)}
                  >
                    Weiß ich noch nicht · Lösung zeigen
                  </button>
                </div>
              </form>
            </>
          ) : (
            <div
              className={`answer-feedback ${feedback.result.correct ? 'correct' : ''}`}
            >
              <h4 ref={heading} tabIndex={-1}>
                {feedback.result.correct
                  ? 'Richtig! +1 Punkt'
                  : feedback.answer === null
                    ? 'Schauen wir uns die Lösung an'
                    : 'Noch nicht ganz – üben hilft!'}
              </h4>
              {feedback.answer !== null && (
                <p>Deine Antwort: {feedback.answer}</p>
              )}
              <p className="trainer-solution">
                {task.left} × {task.right} ={' '}
                <strong>{feedback.result.solution}</strong>
              </p>
              <p>
                {feedback.result.correct
                  ? 'Gut gerechnet! Dein Punkt ist im gemeinsamen Guthaben für Spiele und Abzeichen.'
                  : 'Diesmal gibt es 0 Punkte, aber keinen Abzug. Schau dir die Lösung in Ruhe an.'}
              </p>
              <button
                className="primary-button"
                disabled={busy}
                onClick={() => setReload((value) => value + 1)}
              >
                Nächste Aufgabe
              </button>
            </div>
          )}
        </article>
      )}
      <p className="sample-note">
        Die Aufgaben kommen gemischt. Nach {modeInfo.count} Aufgaben startet
        eine neue Runde. Du kannst jederzeit eine Pause machen. Hier gibt es in
        beiden Rechenarten 1 Punkt pro richtiger Antwort.
      </p>
    </section>
  );
}
