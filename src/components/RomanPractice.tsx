import { useEffect, useRef, useState, type SubmitEvent } from 'react';
import type { AnswerResult, Difficulty, Wallet } from '../domain/learning';
import {
  romanDirections,
  type RomanDirection,
  type RomanQuestion,
} from '../domain/roman';
import { desktop } from '../lib/desktop';
import InfoPanel from './InfoPanel';
import LearningHints from './LearningHints';
import RomanExplanation from './RomanExplanation';

export default function RomanPractice({
  difficulty,
  profileReady,
  disabled,
  onBusyChange,
  onWalletChange,
}: {
  difficulty: Difficulty;
  profileReady: boolean;
  disabled: boolean;
  onBusyChange: (busy: boolean) => void;
  onWalletChange: (wallet: Wallet) => void;
}) {
  const [direction, setDirection] =
    useState<RomanDirection>('decimal-to-roman');
  const [refresh, setRefresh] = useState(0);
  const [question, setQuestion] = useState<RomanQuestion | null>(null);
  const [answer, setAnswer] = useState('');
  const [result, setResult] = useState<AnswerResult | null>(null);
  const [busy, setBusy] = useState(true);
  const [fetching, setFetching] = useState(true);
  const [error, setError] = useState('');
  const previousId = useRef<string | undefined>(undefined);
  const practice = useRef<HTMLDivElement>(null);
  const active = useRef(true);
  const inFlight = useRef(false);
  const generation = useRef(0);
  const pending = useRef<{
    id: string;
    questionId: string;
    answer: string;
  } | null>(null);

  useEffect(() => {
    active.current = true;
    return () => {
      active.current = false;
      onBusyChange(false);
    };
  }, [onBusyChange]);

  useEffect(() => {
    let current = true;
    ++generation.current;
    setQuestion(null);
    setAnswer('');
    setResult(null);
    setError('');
    setBusy(true);
    setFetching(true);
    onBusyChange(true);
    pending.current = null;
    desktop
      .getRomanQuestion(direction, previousId.current)
      .then((value) => {
        if (!current) return;
        previousId.current = value.id;
        setQuestion(value);
      })
      .catch((reason: unknown) => {
        if (current)
          setError(
            reason instanceof Error
              ? reason.message
              : 'Die Zufallsaufgabe konnte nicht geladen werden.',
          );
      })
      .finally(() => {
        if (!current) return;
        setBusy(false);
        setFetching(false);
        onBusyChange(false);
      });
    return () => {
      current = false;
    };
  }, [difficulty, direction, refresh, onBusyChange]);

  useEffect(() => {
    if (question) practice.current?.focus();
  }, [question?.id]);

  async function submit(event: SubmitEvent<HTMLFormElement>) {
    event.preventDefault();
    if (
      !question ||
      question.difficulty !== difficulty ||
      busy ||
      disabled ||
      !profileReady ||
      inFlight.current ||
      !answer.trim()
    )
      return;
    inFlight.current = true;
    const submittedGeneration = generation.current;
    setBusy(true);
    onBusyChange(true);
    setError('');
    setResult(null);
    if (
      !pending.current ||
      pending.current.questionId !== question.id ||
      pending.current.answer !== answer
    ) {
      pending.current = {
        id: crypto.randomUUID(),
        questionId: question.id,
        answer,
      };
    }
    try {
      const value = await desktop.submitAnswer(
        pending.current.id,
        question.id,
        answer,
      );
      if (!active.current || generation.current !== submittedGeneration) return;
      setResult(value);
      if (value.correct)
        setQuestion((current) => current && { ...current, solved: true });
      onWalletChange(value.wallet);
      pending.current = null;
    } catch (reason) {
      if (active.current && generation.current === submittedGeneration)
        setError(
          reason instanceof Error
            ? reason.message
            : 'Deine Antwort konnte nicht gespeichert werden.',
        );
    } finally {
      inFlight.current = false;
      if (active.current && generation.current === submittedGeneration) {
        setBusy(false);
        onBusyChange(false);
      }
    }
  }

  return (
    <div
      className="practice-area"
      ref={practice}
      tabIndex={-1}
      aria-label="Deine Zufallsübung"
    >
      <h3>Römische Zahlen · Zufallsübung</h3>
      <p>
        Eine Zahl von 1 bis 9999. In welche Richtung möchtest du übersetzen?
      </p>
      <div className="roman-controls" role="group" aria-label="Übungsrichtung">
        {romanDirections.map((item) => (
          <button
            key={item.id}
            className="secondary-button"
            aria-pressed={direction === item.id}
            disabled={busy || disabled}
            onClick={() => setDirection(item.id)}
          >
            {item.label}
          </button>
        ))}
        <button
          className="secondary-button"
          disabled={busy || disabled}
          onClick={() => setRefresh((value) => value + 1)}
        >
          Neue Zufallszahl →
        </button>
      </div>
      <p className="sample-note">
        Ab 4000 schreiben wir in dieser Übung weitere M: 4000 = MMMM. Jedes M
        bedeutet 1000.
      </p>
      {fetching && <p role="status">Deine Zufallszahl wird geladen …</p>}
      {error && (
        <div role="alert">
          <p className="error-message">{error}</p>
          {!question && (
            <button
              className="secondary-button"
              disabled={busy || disabled}
              onClick={() => setRefresh((value) => value + 1)}
            >
              Noch einmal laden
            </button>
          )}
        </div>
      )}
      {question && (
        <>
          <form onSubmit={submit}>
            <fieldset
              disabled={busy || disabled || !profileReady || !!result?.correct}
            >
              <label className="answer-label" htmlFor="roman-answer">
                {question.prompt}
              </label>
              <p className="sample-note" id="roman-format">
                {question.unit}
              </p>
              <div className="answer-row">
                <input
                  id="roman-answer"
                  value={answer}
                  maxLength={120}
                  required
                  autoComplete="off"
                  autoCapitalize="characters"
                  spellCheck={false}
                  inputMode={
                    question.answerKind === 'number' ? 'numeric' : 'text'
                  }
                  aria-describedby="roman-format"
                  onChange={(event) => {
                    setAnswer(event.target.value);
                    setResult(null);
                  }}
                />
                <button className="primary-button" type="submit">
                  {busy ? 'Bitte warten …' : 'Antwort prüfen'}
                </button>
              </div>
            </fieldset>
          </form>
          <LearningHints key={question.id} question={question} />
          {question.solved && (
            <p className="sample-note">
              Die Punkte für diese Zahl, Richtung und Stufe hast du bereits
              gesammelt. Du kannst weiter üben.
            </p>
          )}
          {result && (
            <InfoPanel
              autoOpen
              returnFocusRef={practice}
              className="feedback-panel"
            >
              <summary>Deine Rückmeldung</summary>
              <div
                className={`answer-feedback ${result.correct ? 'correct' : ''}`}
                role="status"
              >
                <strong>
                  {result.correct
                    ? result.pointsAwarded > 0
                      ? `Richtig! +${result.pointsAwarded} ${result.pointsAwarded === 1 ? 'Punkt' : 'Punkte'}`
                      : 'Richtig! Diese Aufgabe hast du bereits gelöst.'
                    : 'Noch nicht richtig. Versuch es noch einmal!'}
                </strong>
                {result.correct ? (
                  <p>{result.explanation}</p>
                ) : (
                  <>
                    {result.mistakeHint && (
                      <p className="hint-box">{result.mistakeHint}</p>
                    )}
                    <p>
                      Die Tipps helfen dir Schritt für Schritt. Du kannst auch
                      den Lösungsweg anschauen.
                    </p>
                    <InfoPanel key={question.id}>
                      <summary>Lösungsweg anschauen</summary>
                      <p>{result.explanation}</p>
                    </InfoPanel>
                  </>
                )}
                <button
                  className="primary-button"
                  data-close-info
                  onClick={() => {
                    if (result.correct) setRefresh((value) => value + 1);
                    else setResult(null);
                  }}
                >
                  {result.correct
                    ? 'Weiter zur nächsten Zufallszahl'
                    : 'Noch einmal versuchen'}
                </button>
              </div>
            </InfoPanel>
          )}
        </>
      )}
      <RomanExplanation />
      {question && (
        <InfoPanel>
          <summary>Lernziel und Quellen</summary>
          <p>
            Du übersetzt Zahlen in beide Richtungen. Mathematik Klasse{' '}
            {question.grade}, M5 1.1: Römische Zahlzeichen.
          </p>
          <p>
            {question.curriculumVersion}. Quelle: {question.source}.
          </p>
          <p>
            Eine zusätzliche Übung für 1–9999. Die Erweiterung mit weiteren M
            ist unsere Übungskonvention. Neue richtige Lösungen geben einmalig
            Punkte pro Zahl, Richtung und Stufe.
          </p>
        </InfoPanel>
      )}
    </div>
  );
}
