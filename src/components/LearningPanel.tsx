import { useEffect, useRef, useState, type SubmitEvent } from 'react';
import {
  difficulties,
  type Difficulty,
  type AnswerResult,
  type LearningState,
} from '../domain/learning';
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
  const [topicId, setTopicId] = useState('');
  const [questionId, setQuestionId] = useState('');
  const [hintVisible, setHintVisible] = useState(false);
  const [answer, setAnswer] = useState('');
  const [result, setResult] = useState<{
    questionId: string;
    answer: AnswerResult;
  } | null>(null);
  const practiceRef = useRef<HTMLDivElement>(null);
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

  const topics = state?.topics.filter((item) => item.subject === subject) ?? [];
  const topic = topics.find((item) => item.id === topicId) ?? topics[0];
  const questions =
    state?.questions.filter(
      (item) =>
        item.subject === subject &&
        item.topicId === topic?.id &&
        item.difficulty === state.difficulty,
    ) ?? [];
  const question =
    questions.find((item) => item.id === questionId) ?? questions[0];
  const questionIndex = questions.findIndex((item) => item.id === question?.id);
  const solvedCount = questions.filter((item) => item.solved).length;

  useEffect(() => {
    setHintVisible(false);
    setAnswer('');
    setResult(null);
    setNotice('');
  }, [question?.id]);

  function selectQuestion(id: string) {
    setQuestionId(id);
    setAnswer('');
    setResult(null);
    setNotice('');
    setHintVisible(false);
  }

  async function changeDifficulty(difficulty: Difficulty) {
    if (
      !state ||
      loading ||
      inFlight.current ||
      difficulty === state.difficulty
    )
      return;
    inFlight.current = true;
    setBusy(true);
    setError('');
    try {
      const saved = await desktop.setDifficulty(difficulty);
      ++revision.current;
      setLoading(false);
      setState((current) => current && { ...current, difficulty: saved });
      selectQuestion('');
    } catch (reason) {
      showError(reason);
    } finally {
      inFlight.current = false;
      setBusy(false);
    }
  }
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
          <h2 id="learning-title">Dein Lernabenteuer</h2>
        </div>
        <div className="points-balance" aria-label="Verfügbare Punkte">
          {loading
            ? '…'
            : state
              ? `${state.wallet.balance} Punkte`
              : 'Nicht verfügbar'}
        </div>
      </div>
      <p className="points-explainer">
        {state
          ? `Eine neue Aufgabe gelöst? +${state.pointsByDifficulty[state.difficulty]} Punkte! `
          : 'Löse neue Aufgaben und sammle Punkte. '}
        Du darfst so oft probieren, wie du magst. Fehler kosten nichts.
      </p>
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
      {state && (
        <>
          <div className="level-section">
            <h3>Wie möchtest du heute üben?</h3>
            <div
              className="level-grid"
              aria-label="Schwierigkeitsgrad für alle Fächer"
            >
              {difficulties.map((level) => (
                <button
                  key={level.id}
                  className="level-card"
                  aria-pressed={state.difficulty === level.id}
                  disabled={busy || loading}
                  onClick={() => void changeDifficulty(level.id)}
                >
                  <span aria-hidden="true">{level.symbol}</span>
                  <strong>{level.name}</strong>
                  <small>{level.description}</small>
                  <small>
                    +{state.pointsByDifficulty[level.id]} Punkte pro neuer
                    Lösung
                  </small>
                </button>
              ))}
            </div>
            <p className="sample-note">
              Lustige Namen, keine Noten! „Vorschule“ ist der leichte Einstieg
              in dein Thema. Du kannst jederzeit wechseln. Deine Wahl gilt auch
              im anderen Fach.
            </p>
          </div>
          <div className="topic-section">
            <h3>
              {subject === 'mathematics' ? 'Mathematik · Klasse 5' : 'Englisch'}
            </h3>
            <p>
              {subject === 'mathematics'
                ? `${topics.length} Themenwelten. Wo beginnt dein nächstes Abenteuer?`
                : 'Beispielaufgaben · Noch kein vollständiger Lehrplan · Englisch als 1. Fremdsprache'}
            </p>
            <div className="topic-grid" aria-label="Themen">
              {topics.map((item, index) => {
                const exercises = state.questions.filter(
                  (q) =>
                    q.topicId === item.id && q.difficulty === state.difficulty,
                );
                const solved = exercises.filter((q) => q.solved).length;
                return (
                  <button
                    key={item.id}
                    className="topic-card"
                    aria-pressed={item.id === topic?.id}
                    disabled={busy || loading}
                    onClick={() => {
                      setTopicId(item.id);
                      selectQuestion('');
                      practiceRef.current?.focus();
                    }}
                  >
                    <span className="topic-number" aria-hidden="true">
                      {index + 1}
                    </span>
                    <strong>{item.name}</strong>
                    <span>{item.description}</span>
                    <small>
                      {solved} von {exercises.length} gelöst{' '}
                      {solved === exercises.length && solved > 0 ? '✓' : ''}
                    </small>
                  </button>
                );
              })}
            </div>
          </div>
        </>
      )}
      {question && topic && (
        <div
          className="practice-area"
          ref={practiceRef}
          tabIndex={-1}
          aria-label="Deine Übung"
        >
          <div className="section-heading">
            <h3>{topic.name}</h3>
            <span>
              {
                difficulties.find((level) => level.id === state?.difficulty)
                  ?.name
              }{' '}
              · {solvedCount}/{questions.length} geschafft
            </span>
          </div>
          <details className="lesson" key={topic.id}>
            <summary>So geht’s · kurz erklärt</summary>
            <p>{topic.lesson}</p>
            {topic.tables?.map((table) => (
              <div key={table.caption} className="learning-table">
                <div
                  className="learning-table-scroll"
                  role="region"
                  aria-label={table.caption}
                  tabIndex={0}
                >
                  <table>
                    <caption>{table.caption}</caption>
                    <thead>
                      <tr>
                        {table.headers.map((header, index) => (
                          <th key={index} scope="col">
                            {header}
                          </th>
                        ))}
                      </tr>
                    </thead>
                    <tbody>
                      {table.rows.map((row, index) => (
                        <tr key={index}>
                          {row.map((cell, column) => (
                            <td key={column}>{cell}</td>
                          ))}
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
                <p>{table.note}</p>
              </div>
            ))}
          </details>
          <div className="question-navigation">
            <label htmlFor="question-picker">Deine Aufgabe</label>
            <select
              id="question-picker"
              value={question.id}
              disabled={busy || loading}
              onChange={(event) => selectQuestion(event.target.value)}
            >
              {questions.map((item, index) => (
                <option key={item.id} value={item.id}>
                  Aufgabe {index + 1} von {questions.length}
                  {item.solved ? ' · gelöst ✓' : ''}
                </option>
              ))}
            </select>
            <button
              className="secondary-button"
              disabled={busy || loading || questions.length < 2}
              onClick={() =>
                selectQuestion(
                  questions[(questionIndex + 1) % questions.length].id,
                )
              }
            >
              Nächste Aufgabe →
            </button>
          </div>
          <form onSubmit={submit}>
            <fieldset disabled={!enabled}>
              {question.answerKind === 'choice' ? (
                <>
                  <legend className="answer-label">{question.prompt}</legend>
                  <div className="answer-options">
                    {question.options.map((option) => (
                      <label key={option} className="answer-option">
                        <input
                          type="radio"
                          name="answer"
                          value={option}
                          checked={answer === option}
                          required
                          onChange={() => {
                            setAnswer(option);
                            setResult(null);
                          }}
                        />
                        <span>{option}</span>
                      </label>
                    ))}
                  </div>
                  <button className="primary-button" type="submit">
                    {busy ? 'Bitte warten …' : 'Antwort prüfen'}
                  </button>
                </>
              ) : (
                <>
                  <label className="answer-label" htmlFor="practice-answer">
                    {question.prompt}
                  </label>
                  {question.unit && (
                    <p id="answer-format" className="sample-note">
                      {question.unit} Große Zahlen ohne Punkte schreiben, z. B.
                      25000 oder 25 000.
                    </p>
                  )}
                  <div className="answer-row">
                    <input
                      id="practice-answer"
                      value={answer}
                      maxLength={120}
                      required
                      autoComplete="off"
                      aria-describedby={
                        question.unit ? 'answer-format' : undefined
                      }
                      onChange={(event) => {
                        setAnswer(event.target.value);
                        setResult(null);
                      }}
                    />
                    <button className="primary-button" type="submit">
                      {busy ? 'Bitte warten …' : 'Antwort prüfen'}
                    </button>
                  </div>
                </>
              )}
            </fieldset>
          </form>
          <button
            className="hint-button"
            aria-expanded={hintVisible}
            onClick={() => setHintVisible(!hintVisible)}
          >
            {hintVisible ? 'Tipp zuklappen' : 'Gib mir einen Tipp'}
          </button>
          {hintVisible && <p className="hint-box">{question.hint}</p>}
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
              {visibleResult.correct ? (
                <p>{visibleResult.explanation}</p>
              ) : (
                <>
                  <p>
                    Ein Tipp kann dir helfen. Du kannst auch den Lösungsweg
                    anschauen und danach noch einmal rechnen.
                  </p>
                  <details key={question.id}>
                    <summary>Lösungsweg anschauen</summary>
                    <p>{visibleResult.explanation}</p>
                  </details>
                </>
              )}
            </div>
          )}
          {solvedCount === questions.length && (
            <p className="completion-message">
              ✦ Alles geschafft in dieser Stufe! Lust auf ein anderes Thema oder
              eine Mitmachaufgabe?
            </p>
          )}
          {topic.activities.length > 0 && (
            <details className="activities" key={`activities-${topic.id}`}>
              <summary>
                Stift raus! {topic.activities.length} Mitmachaufgaben
              </summary>
              <p>
                Für alle drei Stufen: Zeichne, probiere aus und erkläre deinen
                Weg. Hier kontrollierst du selbst – ohne Punkte. Bei kniffligen
                Fragen hilft dir eine erwachsene Person.
              </p>
              {topic.activities.map((activity) => (
                <article key={activity.title}>
                  <h4>{activity.title}</h4>
                  <p>{activity.prompt}</p>
                  <details>
                    <summary>So kannst du dich prüfen</summary>
                    <p>{activity.check}</p>
                  </details>
                </article>
              ))}
            </details>
          )}
        </div>
      )}
      {state && (
        <div className="rewards-area">
          <h3>Deine Belohnungen</h3>
          <p>
            Tausche deine Punkte gegen Abzeichen für deine Sammlung. Insgesamt
            verdient: {state.wallet.totalEarned} Punkte.
          </p>
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
      {state && subject === 'mathematics' && (
        <details className="source-note">
          <summary>Für Neugierige & Erwachsene: Lerninhalte</summary>
          <p>
            Lernangebote zu allen 39 Kompetenzerwartungen für Mathematik Klasse
            5 am bayerischen Gymnasium. Eigene Übungen nach LehrplanPLUS;
            Zeichnungen und Begründungen werden über Mitmachaufgaben geübt und
            nicht automatisch bewertet. Ein begrenztes Übungspaket, kein Ersatz
            für Unterricht oder eine vollständige Lernstandserhebung.
          </p>
          <p>
            {state.curriculumVersion}. Themenbezug: {topic?.curriculumRef}.
            Quelle: {state.curriculumSource}. Zum Üben ist kein Internet nötig.
          </p>
        </details>
      )}
    </section>
  );
}
