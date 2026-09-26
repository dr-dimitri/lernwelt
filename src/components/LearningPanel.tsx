import InfoPanel from './InfoPanel';
import LearningHints from './LearningHints';
import LearningTable from './LearningTable';
import NatureGames from './NatureGames';
import NumberLine from './NumberLine';
import { FlowerPicture, ParticlePicture } from './NatureArt';
import { useEffect, useRef, useState, type SubmitEvent } from 'react';
import {
  difficulties,
  type Difficulty,
  type AnswerResult,
  type LearningState,
} from '../domain/learning';
import { subjects, type SubjectId } from '../domain/subjects';
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
  const [rewardsOpen, setRewardsOpen] = useState(false);
  const [topicId, setTopicId] = useState('');
  const [questionId, setQuestionId] = useState('');
  const [natureMode, setNatureMode] = useState<'questions' | 'games'>(
    'questions',
  );
  const playingNature = subject === 'nature' && natureMode === 'games';

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

  useEffect(() => {
    setNatureMode('questions');
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
    setAnswer('');
    setResult(null);
    setNotice('');
  }, [question?.id]);

  function selectQuestion(id: string) {
    setQuestionId(id);
    setAnswer('');
    setResult(null);
    setNotice('');
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
    if (!question || !enabled || inFlight.current || !answer.trim()) return;
    inFlight.current = true;
    setBusy(true);
    setError('');
    setNotice('');
    setResult(null);
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
          <h2 id="learning-title">
            {subject === 'nature'
              ? 'Dein Forscherabenteuer'
              : 'Dein Lernabenteuer'}
          </h2>
        </div>
        <div className="points-balance" aria-label="Verfügbare Punkte">
          {loading
            ? '…'
            : state
              ? `${state.wallet.balance} ${state.wallet.balance === 1 ? 'Punkt' : 'Punkte'}`
              : 'Nicht verfügbar'}
        </div>
      </div>
      <p className="points-explainer">
        {playingNature
          ? 'Ausprobieren, entdecken und noch einmal spielen. '
          : state
            ? `Eine neue Aufgabe gelöst? +${state.pointsByDifficulty[state.difficulty]} ${state.pointsByDifficulty[state.difficulty] === 1 ? 'Punkt' : 'Punkte'}! `
            : 'Löse neue Aufgaben und sammle Punkte. '}
        Du darfst so oft probieren, wie du magst. Fehler kosten nichts.
      </p>
      {loading && <p role="status">Dein Punktekonto wird geladen …</p>}
      {error && !rewardsOpen && (
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
        <p>
          Speichere dein Lernprofil über „Dein Profil“ oben, um Punkte zu
          sammeln.
        </p>
      )}
      {state && subject === 'nature' && (
        <div className="nature-mode" role="group" aria-label="Dein Forscherweg">
          <button
            className="secondary-button"
            aria-pressed={!playingNature}
            disabled={busy || loading}
            onClick={() => setNatureMode('questions')}
          >
            Fragen entdecken
          </button>
          <button
            className="secondary-button"
            aria-pressed={playingNature}
            disabled={busy || loading}
            onClick={() => setNatureMode('games')}
          >
            Lernspiele ausprobieren
          </button>
        </div>
      )}
      <div className="learning-workspace">
        {state && (
          <>
            <div className="learning-settings">
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
                        {playingNature ? 'Bei Fragen: ' : ''}+
                        {state.pointsByDifficulty[level.id]}{' '}
                        {state.pointsByDifficulty[level.id] === 1
                          ? 'Punkt'
                          : 'Punkte'}{' '}
                        pro neuer Lösung
                      </small>
                    </button>
                  ))}
                </div>
                <InfoPanel>
                  <summary>Über die Stufen</summary>
                  <p className="sample-note">
                    Lustige Namen, keine Noten! „Vorschule“ ist der leichte
                    Einstieg in dein Thema. Du kannst jederzeit wechseln. Deine
                    Wahl gilt in allen Fächern.
                  </p>
                </InfoPanel>
              </div>
              {!playingNature && (
                <div className="topic-section">
                  <h3>
                    {subjects.find((item) => item.id === subject)?.name} ·
                    Klasse 5
                  </h3>
                  <p className="topic-description">
                    {subject === 'english'
                      ? '12 Themen zum Entdecken · Englisch als 1. Fremdsprache'
                      : `${topics.length} Themenwelten. Wo beginnt dein nächstes Abenteuer?`}
                  </p>
                  <InfoPanel className="topic-picker">
                    <summary>Thema wählen</summary>
                    <div className="topic-grid" aria-label="Themen">
                      {topics.map((item, index) => {
                        const exercises = state.questions.filter(
                          (q) =>
                            q.topicId === item.id &&
                            q.difficulty === state.difficulty,
                        );
                        const solved = exercises.filter((q) => q.solved).length;
                        return (
                          <button
                            key={item.id}
                            className="topic-card"
                            data-close-info
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
                              {solved === exercises.length && solved > 0
                                ? '✓'
                                : ''}
                            </small>
                          </button>
                        );
                      })}
                    </div>
                  </InfoPanel>
                </div>
              )}
            </div>
          </>
        )}
        {playingNature && state && (
          <NatureGames key={state.difficulty} difficulty={state.difficulty} />
        )}
        {!playingNature && question && topic && (
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
                {question.numberLine?.mode === 'place' ? (
                  <>
                    <legend className="answer-label">{question.prompt}</legend>
                    <NumberLine
                      key={question.id}
                      diagram={question.numberLine}
                      value={answer}
                      disabled={!enabled}
                      onChange={(value) => {
                        setAnswer(value);
                        setResult(null);
                      }}
                    />
                    <button
                      className="primary-button"
                      type="submit"
                      disabled={!answer}
                    >
                      {busy ? 'Bitte warten …' : 'Antwort prüfen'}
                    </button>
                  </>
                ) : question.answerKind === 'choice' ? (
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
                    {question.numberLine && (
                      <NumberLine
                        key={question.id}
                        diagram={question.numberLine}
                        value={answer}
                        onChange={setAnswer}
                        disabled={!enabled}
                      />
                    )}
                    {question.unit && (
                      <p id="answer-format" className="sample-note">
                        {question.unit} Große Zahlen ohne Punkte schreiben, z.
                        B. 25000 oder 25 000.
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
            <LearningHints key={question.id} question={question} />
            <InfoPanel paginate className="lesson" key={topic.id}>
              <summary>So geht’s · kurz erklärt</summary>
              <p>{topic.lesson}</p>
              {topic.id === 'nature-water' && (
                <div>
                  <h3>Wasser im Teilchenmodell</h3>
                  <div className="nature-lesson-models">
                    {(['solid', 'liquid', 'gas'] as const).map(
                      (value, index) => (
                        <figure key={value}>
                          <ParticlePicture state={value} />
                          <figcaption>
                            {
                              [
                                'Eis · fest',
                                'Wasser · flüssig',
                                'Wasserdampf · gasförmig',
                              ][index]
                            }
                          </figcaption>
                        </figure>
                      ),
                    )}
                  </div>
                  <p>
                    Die Punkte sind ein Modell für winzige Teilchen. Wir können
                    sie nicht mit bloßem Auge sehen. Im Eis schwingen sie an
                    festen Plätzen. Im flüssigen Wasser bewegen sie sich
                    aneinander vorbei. Im Wasserdampf bewegen sie sich frei mit
                    großen Abständen. Wasserdampf selbst ist unsichtbar.
                  </p>
                </div>
              )}
              {topic.id === 'nature-plants' && (
                <figure className="nature-lesson-flower">
                  <FlowerPicture />
                  <figcaption>
                    Ein Blick in eine Blüte: Staubblätter bilden Pollen. Auf der
                    Narbe kann Pollen landen. Im Fruchtknoten liegen die
                    Samenanlagen.
                  </figcaption>
                </figure>
              )}
              {topic.tables?.map((table) => (
                <LearningTable key={table.caption} table={table} />
              ))}
            </InfoPanel>
            {question.solved && (
              <p className="sample-note">
                Die Punkte für diese Aufgabe hast du bereits gesammelt. Du
                kannst weiter üben.
              </p>
            )}
            {visibleResult && (
              <InfoPanel
                autoOpen
                returnFocusRef={practiceRef}
                className="feedback-panel"
              >
                <summary>Deine Rückmeldung</summary>
                <div
                  className={`answer-feedback ${visibleResult.correct ? 'correct' : ''}`}
                  role="status"
                >
                  <strong>
                    {visibleResult.correct
                      ? visibleResult.pointsAwarded > 0
                        ? `Richtig! +${visibleResult.pointsAwarded} ${visibleResult.pointsAwarded === 1 ? 'Punkt' : 'Punkte'}`
                        : 'Richtig! Diese Aufgabe hast du bereits gelöst.'
                      : 'Noch nicht richtig. Versuch es noch einmal!'}
                  </strong>
                  {visibleResult.correct ? (
                    <p>{visibleResult.explanation}</p>
                  ) : (
                    <>
                      {visibleResult.mistakeHint && (
                        <p className="hint-box">{visibleResult.mistakeHint}</p>
                      )}
                      <p>
                        Die Tipps helfen dir Schritt für Schritt. Du kannst auch
                        den Lösungsweg anschauen und danach noch einmal
                        versuchen.
                      </p>
                      <InfoPanel key={question.id}>
                        <summary>Lösungsweg anschauen</summary>
                        <p>{visibleResult.explanation}</p>
                      </InfoPanel>
                    </>
                  )}
                  <button
                    className="primary-button"
                    data-close-info
                    onClick={() => {
                      if (visibleResult.correct)
                        selectQuestion(
                          questions[(questionIndex + 1) % questions.length].id,
                        );
                      else setResult(null);
                    }}
                  >
                    {visibleResult.correct
                      ? 'Weiter zur nächsten Aufgabe'
                      : 'Noch einmal versuchen'}
                  </button>
                </div>
              </InfoPanel>
            )}
            {solvedCount === questions.length && (
              <p className="completion-message">
                ✦ Alles geschafft in dieser Stufe! Lust auf ein anderes Thema
                oder eine Mitmachaufgabe?
              </p>
            )}
            {topic.activities.length > 0 && (
              <InfoPanel
                paginate
                className="activities"
                key={`activities-${topic.id}`}
              >
                <summary>
                  {subject === 'english'
                    ? 'Sprich, lies & entdecke!'
                    : subject === 'nature'
                      ? 'Forschen & mitmachen!'
                      : 'Stift raus!'}{' '}
                  {topic.activities.length} Mitmachaufgaben
                </summary>
                <p>
                  Für alle drei Stufen:{' '}
                  {subject === 'english'
                    ? 'Sprich, schreibe und probiere die Sprache aus.'
                    : 'Zeichne, probiere aus und erkläre deinen Weg.'}{' '}
                  Hier kontrollierst du selbst – ohne Punkte. Bei kniffligen
                  Fragen hilft dir eine erwachsene Person.
                </p>
                {topic.activities.map((activity) => (
                  <article key={activity.title}>
                    <h4>{activity.title}</h4>
                    <p>{activity.prompt}</p>
                    <InfoPanel>
                      <summary>So kannst du dich prüfen</summary>
                      <p>{activity.check}</p>
                    </InfoPanel>
                  </article>
                ))}
              </InfoPanel>
            )}
          </div>
        )}
      </div>
      {state && (
        <InfoPanel className="rewards-area" onOpenChange={setRewardsOpen}>
          <summary>Deine Belohnungen</summary>
          <div>
            {error && <p role="alert">{error}</p>}
            {notice && <p role="status">{notice}</p>}
            <h3>Deine Belohnungen</h3>
            <p>
              Tausche deine Punkte gegen Abzeichen für deine Sammlung. Insgesamt
              verdient: {state.wallet.totalEarned}{' '}
              {state.wallet.totalEarned === 1 ? 'Punkt' : 'Punkte'}.
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
                      Noch {reward.cost - state.wallet.balance}{' '}
                      {reward.cost - state.wallet.balance === 1
                        ? 'Punkt'
                        : 'Punkte'}
                    </p>
                  )}
                </article>
              ))}
            </div>
          </div>
        </InfoPanel>
      )}
      {notice && !rewardsOpen && <p role="status">{notice}</p>}
      {state && subject === 'nature' && (
        <InfoPanel className="source-note">
          <summary>Für Neugierige & Erwachsene: Natur und Technik</summary>
          <p>
            Eigene Fragen, Lernspiele und Mitmachaufgaben für 10- bis
            12-Jährige. Wir erkunden naturwissenschaftliches Arbeiten und
            Biologie nach LehrplanPLUS für Klasse 5 am bayerischen Gymnasium.
            Das ist ein begrenztes Übungspaket, keine vollständige
            Lehrplanabdeckung und kein Ersatz für Unterricht.
          </p>
          <p>
            Die Lernspiele sind kostenloses Ausprobieren ohne Lernpunkte. Die
            Runden werden beim Verlassen oder Stufenwechsel neu gestartet. Die
            Fragen speichern deinen Fortschritt und bringen für neue richtige
            Lösungen die angezeigten Lernpunkte. Mitmachaufgaben prüfst du
            selbst.
          </p>
          <p>
            {topic?.curriculumVersion}. Themenbezug: {topic?.curriculumRef}.
            Quelle: {topic?.source}. Alles funktioniert offline.
          </p>
        </InfoPanel>
      )}
      {state && subject === 'english' && (
        <InfoPanel className="source-note">
          <summary>Für Neugierige & Erwachsene: Englisch-Lerninhalte</summary>
          <p>
            108 eigene Übungen und 24 Mitmachaufgaben für Klasse 5, Englisch als
            erste Fremdsprache. Themen nach LehrplanPLUS und zur Orientierung
            nach Green Line Bayern 1, Ausgabe ab 2017. Kein Originalmaterial von
            Klett und kein vollständiger Ersatz für Buch oder Unterricht.
          </p>
          <p>
            Hörtexte werden von einer anderen Person vorgelesen. Sprechen und
            freie Texte prüfst du mit den Hinweisen selbst; es gibt keine
            Audioaufnahmen oder automatische Aussprachebewertung.
          </p>
          <p>
            {topic?.curriculumVersion}. Themenbezug: {topic?.curriculumRef}.
            Quelle: {topic?.source}. Alle Übungen funktionieren offline.
          </p>
        </InfoPanel>
      )}
      {state && subject === 'mathematics' && (
        <InfoPanel className="source-note">
          <summary>Für Neugierige & Erwachsene: Lerninhalte</summary>
          <p>
            Lernangebote zu allen 39 Kompetenzerwartungen für Mathematik Klasse
            5 am bayerischen Gymnasium. Eigene Übungen nach LehrplanPLUS;
            Zeichnungen und Begründungen werden über Mitmachaufgaben geübt und
            nicht automatisch bewertet. Ein begrenztes Übungspaket, kein Ersatz
            für Unterricht oder eine vollständige Lernstandserhebung.
          </p>
          <p>
            {topic?.curriculumVersion ?? state.curriculumVersion}. Themenbezug:{' '}
            {topic?.curriculumRef}. Quelle:{' '}
            {topic?.source ?? state.curriculumSource}. Zum Üben ist kein
            Internet nötig.
          </p>
        </InfoPanel>
      )}
    </section>
  );
}
