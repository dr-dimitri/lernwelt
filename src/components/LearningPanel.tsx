import { useEffect, useRef, useState, type SubmitEvent } from 'react';
import type { AnswerResult, LearningState } from '../domain/learning';
import type { SubjectId } from '../domain/subjects';
import { desktop } from '../lib/desktop';

export default function LearningPanel({
  subject,
  profileVersion,
}: {
  subject: SubjectId;
  profileVersion: number;
}) {
  const [state, setState] = useState<LearningState | null>(null);
  const [loading, setLoading] = useState(true);
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState('');
  const [notice, setNotice] = useState('');
  const [questionId, setQuestionId] = useState('');
  const [answer, setAnswer] = useState('');
  const [result, setResult] = useState<{
    questionId: string;
    answer: AnswerResult;
  } | null>(null);
  const pending = useRef<{
    id: string;
    questionId: string;
    answer: string;
  } | null>(null);
  const inFlight = useRef(false);
  const revision = useRef(0);
  const [reload, setReload] = useState(0);

  useEffect(() => {
    let active = true;
    const version = ++revision.current;
    setLoading(true);
    desktop
      .getLearningState()
      .then((value) => {
        if (active && revision.current === version) {
          setState(value);
          setError('');
        }
      })
      .catch((reason: unknown) => {
        if (active && revision.current === version)
          setError(
            reason instanceof Error
              ? reason.message
              : 'Deine Punkte konnten nicht geladen werden.',
          );
      })
      .finally(() => {
        if (active && revision.current === version) setLoading(false);
      });
    return () => {
      active = false;
    };
  }, [profileVersion, reload]);

  useEffect(() => {
    setQuestionId('');
    setAnswer('');
    setResult(null);
    setNotice('');
  }, [subject]);

  const questions =
    state?.questions.filter((item) => item.subject === subject) ?? [];
  const question =
    questions.find((item) => item.id === questionId) ?? questions[0];
  const enabled = !!state?.profileReady && !busy && !loading;
  const visibleResult =
    result && result.questionId === question?.id ? result.answer : null;

  function showError(reason: unknown) {
    setError(
      reason instanceof Error
        ? reason.message
        : 'Die Änderung konnte nicht gespeichert werden.',
    );
  }

  async function submit(event: SubmitEvent<HTMLFormElement>) {
    event.preventDefault();
    if (!question || !enabled || inFlight.current) return;
    inFlight.current = true;
    setBusy(true);
    setError('');
    setNotice('');
    const submittedId = question.id;
    // Retain the request ID after transport errors so retry cannot duplicate a booking.
    if (
      !pending.current ||
      pending.current.questionId !== submittedId ||
      pending.current.answer !== answer
    ) {
      pending.current = {
        id: crypto.randomUUID(),
        questionId: submittedId,
        answer,
      };
    }
    try {
      const value = await desktop.submitAnswer(
        pending.current.id,
        submittedId,
        answer,
      );
      ++revision.current;
      setLoading(false);
      setState(
        (current) =>
          current && {
            ...current,
            wallet: value.wallet,
            questions: current.questions.map((item) =>
              item.id === submittedId && value.correct
                ? { ...item, solved: true }
                : item,
            ),
          },
      );
      setResult({ questionId: submittedId, answer: value });
      pending.current = null;
    } catch (reason) {
      showError(reason);
    } finally {
      inFlight.current = false;
      setBusy(false);
    }
  }

  async function redeem(id: string, name: string) {
    if (!enabled || inFlight.current) return;
    inFlight.current = true;
    setBusy(true);
    setError('');
    setNotice('');
    try {
      const wallet = await desktop.redeemReward(id);
      ++revision.current;
      setLoading(false);
      setState((current) => current && { ...current, wallet });
      setNotice(`„${name}“ gehört jetzt zu deiner Sammlung.`);
    } catch (reason) {
      showError(reason);
    } finally {
      inFlight.current = false;
      setBusy(false);
    }
  }

  return (
    <section
      className="detail-panel learning-panel"
      aria-labelledby="learning-title"
    >
      <div className="section-heading">
        <div>
          <p className="eyebrow">LERNEN LOHNT SICH</p>
          <h2 id="learning-title">Dein Punktekonto</h2>
        </div>
        <div className="points-balance" aria-label="Verfügbare Punkte">
          {loading
            ? '…'
            : state
              ? `${state.wallet.balance} Punkte`
              : 'Nicht verfügbar'}
        </div>
      </div>
      <p>
        Für jede erstmals richtig gelöste Aufgabe erhältst du{' '}
        {state?.pointsPerAnswer ?? 10} Punkte. Falsche Antworten kosten keine
        Punkte.
      </p>
      {state && <p>Insgesamt verdient: {state.wallet.totalEarned} Punkte</p>}
      {loading && <p role="status">Dein Punktekonto wird geladen …</p>}
      {error && (
        <div role="alert">
          <p className="error-message">{error}</p>
          <button
            className="secondary-button"
            disabled={busy || loading}
            onClick={() => setReload((value) => value + 1)}
          >
            Punktekonto neu laden
          </button>
        </div>
      )}
      {state && !state.profileReady && (
        <p>Speichere zuerst unten dein Lernprofil, um Punkte zu sammeln.</p>
      )}
      {question && (
        <div className="practice-area">
          <h3>{subject === 'mathematics' ? 'Mathematik' : 'Englisch'}</h3>
          <p className="sample-note">
            Beispielaufgaben · Noch kein vollständiger Lehrplan
          </p>
          <div className="question-navigation" aria-label="Beispielaufgaben">
            {questions.map((item, index) => (
              <button
                key={item.id}
                className="secondary-button"
                disabled={busy || loading}
                aria-pressed={question.id === item.id}
                onClick={() => {
                  setQuestionId(item.id);
                  setAnswer('');
                  setResult(null);
                  setNotice('');
                }}
              >
                Aufgabe {index + 1}
                {item.solved ? ' ✓' : ''}
              </button>
            ))}
          </div>
          <form onSubmit={submit}>
            <fieldset disabled={!enabled}>
              <label className="answer-label" htmlFor="practice-answer">
                {question.prompt}
              </label>
              <div className="answer-row">
                <input
                  id="practice-answer"
                  value={answer}
                  maxLength={120}
                  required
                  autoComplete="off"
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
          {question.solved && (
            <p className="sample-note">
              Die Punkte für diese Aufgabe hast du bereits gesammelt. Du kannst
              weiter üben.
            </p>
          )}
          {visibleResult && (
            <div
              className={`answer-feedback ${visibleResult.correct ? 'correct' : ''}`}
              role="status"
            >
              <strong>
                {visibleResult.correct
                  ? visibleResult.pointsAwarded > 0
                    ? `Richtig! +${visibleResult.pointsAwarded} Punkte`
                    : 'Richtig! Diese Aufgabe hast du bereits gelöst.'
                  : 'Noch nicht richtig. Versuch es noch einmal!'}
              </strong>
              <p>{visibleResult.explanation}</p>
            </div>
          )}
        </div>
      )}
      {state && (
        <div className="rewards-area">
          <h3>Deine Belohnungen</h3>
          <p>Tausche deine Punkte gegen Abzeichen für deine Sammlung.</p>
          <div className="reward-grid">
            {state.wallet.rewards.map((reward) => (
              <article
                className={`reward-card ${reward.owned ? 'owned' : ''}`}
                key={reward.id}
              >
                <span className="reward-symbol" aria-hidden="true">
                  {reward.id === 'star' ? '✦' : '◆'}
                </span>
                <h4>{reward.name}</h4>
                <p>{reward.description}</p>
                <button
                  className="secondary-button"
                  disabled={
                    !enabled ||
                    reward.owned ||
                    state.wallet.balance < reward.cost
                  }
                  onClick={() => void redeem(reward.id, reward.name)}
                  aria-label={
                    reward.owned
                      ? `${reward.name}: In deiner Sammlung`
                      : `${reward.name} für ${reward.cost} Punkte einlösen`
                  }
                >
                  {reward.owned
                    ? 'In deiner Sammlung ✓'
                    : `${reward.cost} Punkte · Einlösen`}
                </button>
                {!reward.owned && state.wallet.balance < reward.cost && (
                  <p className="sample-note">
                    Noch {reward.cost - state.wallet.balance} Punkte
                  </p>
                )}
              </article>
            ))}
          </div>
        </div>
      )}
      {notice && <p role="status">{notice}</p>}
    </section>
  );
}
