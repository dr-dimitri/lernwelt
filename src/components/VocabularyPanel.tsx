import { useEffect, useRef, useState } from 'react';
import { difficulties, type Difficulty } from '../domain/learning';
import type {
  VocabularyState,
  VocabularyReview,
  VocabularyReviewResult,
} from '../domain/vocabulary';
import { desktop } from '../lib/desktop';

const modes: Record<Difficulty, string> = {
  vorschule: 'Englisch erkennen → Deutsch',
  koenner: 'Deutsch übersetzen → Englisch',
  streber: 'Das englische Wort im Satz finden',
};
const date = (seconds: number) =>
  new Date(seconds * 1000).toLocaleString('de-DE', {
    day: '2-digit',
    month: '2-digit',
    hour: '2-digit',
    minute: '2-digit',
  });
const message = (error: unknown) =>
  error instanceof Error
    ? error.message
    : 'Die Wortkarten sind gerade nicht verfügbar.';
type Feedback = {
  result: VocabularyReviewResult;
  presented: NonNullable<VocabularyState['card']>;
  difficulty: Difficulty;
  answer: string | null;
};

export default function VocabularyPanel({
  profileVersion,
}: {
  profileVersion: number;
}) {
  const [state, setState] = useState<VocabularyState | null>(null);
  const [deck, setDeck] = useState('all');
  const [reload, setReload] = useState(0);
  const [answer, setAnswer] = useState('');
  const [feedback, setFeedback] = useState<Feedback | null>(null);
  const [busy, setBusy] = useState(true);
  const [error, setError] = useState('');
  const [pending, setPending] = useState<VocabularyReview | null>(null);
  const revision = useRef(0);
  const inFlight = useRef(false);
  const feedbackHeading = useRef<HTMLHeadingElement>(null);

  useEffect(() => {
    const current = ++revision.current;
    setBusy(true);
    setError('');
    setState(null);
    setPending(null);
    setFeedback(null);
    setAnswer('');
    inFlight.current = true;
    void desktop
      .getVocabularyState(deck)
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
  }, [deck, reload, profileVersion]);

  async function changeDifficulty(difficulty: Difficulty) {
    if (inFlight.current || pending) return;
    const current = revision.current;
    inFlight.current = true;
    setBusy(true);
    setError('');
    setFeedback(null);
    try {
      await desktop.setDifficulty(difficulty);
      const next = await desktop.getVocabularyState(deck);
      if (current !== revision.current) return;
      setState(next);
      setAnswer('');
    } catch (err) {
      if (current !== revision.current) return;
      setState(null);
      setError(message(err));
    } finally {
      if (current === revision.current) {
        inFlight.current = false;
        setBusy(false);
      }
    }
  }
  async function submit(value: string | null) {
    if (inFlight.current || !state?.card || !state.profileReady || feedback)
      return;
    if (value !== null && !value.trim() && !pending) return;
    const request = pending ?? {
      requestId: crypto.randomUUID(),
      cardId: state.card.card.id,
      deckId: deck,
      difficulty: state.difficulty,
      expectedReviews: state.card.reviews,
      answer: value,
    };
    const current = revision.current;
    inFlight.current = true;
    setBusy(true);
    setError('');
    setPending(request);
    try {
      const result = await desktop.reviewVocabulary(request);
      if (current !== revision.current) return;
      setFeedback({
        result,
        presented: state.card,
        difficulty: request.difficulty,
        answer: request.answer,
      });
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
  useEffect(() => {
    if (feedback && !busy) feedbackHeading.current?.focus();
  }, [feedback, busy]);

  const presented = feedback?.presented ?? state?.card;
  const card = presented?.card;
  const difficulty = feedback?.difficulty ?? state?.difficulty ?? 'koenner';
  const disabled = busy || !!pending;
  const front =
    card &&
    (difficulty === 'vorschule'
      ? card.english
      : difficulty === 'koenner'
        ? card.german
        : card.cloze);
  const back =
    card && (difficulty === 'vorschule' ? card.german : card.english);
  return (
    <section
      className="detail-panel vocabulary-panel"
      aria-labelledby="vocabulary-title"
      aria-busy={busy}
    >
      <p className="eyebrow">DEIN WÖRTERSCHATZ WÄCHST</p>
      <h2 id="vocabulary-title">Vokabeltrainer</h2>
      <p>Englisch · Klasse 5 · 1. Fremdsprache</p>
      <p>
        Tippe deine Übersetzung ein. Jede richtige Antwort bringt 1 Punkt – auch
        wenn du ein Wort später wiederholst. Fehler kosten nichts.
      </p>
      {state && (
        <div className="points-balance" aria-label="Verfügbare Lernpunkte">
          {state.wallet.balance}{' '}
          {state.wallet.balance === 1 ? 'Punkt' : 'Punkte'}
        </div>
      )}
      {busy && (
        <p role="status">Wortkarten werden geladen oder gespeichert …</p>
      )}
      {error && (
        <div role="alert" className="error-message">
          <p>{error}</p>
          {pending && (
            <button
              className="primary-button"
              onClick={() => void submit(pending.answer)}
              disabled={busy}
            >
              Speichern erneut versuchen
            </button>
          )}
        </div>
      )}
      <button
        className="secondary-button"
        disabled={busy}
        onClick={() => setReload((v) => v + 1)}
      >
        {error ? 'Karten neu laden' : 'Fällige Karten laden'}
      </button>
      {state && (
        <>
          <h3>Wie möchtest du Wörter üben?</h3>
          <div
            className="level-grid"
            aria-label="Schwierigkeitsgrad für alle Fächer"
          >
            {difficulties.map((level) => (
              <button
                key={level.id}
                className="level-card"
                aria-pressed={state.difficulty === level.id}
                disabled={disabled}
                onClick={() => void changeDifficulty(level.id)}
              >
                <span aria-hidden="true">{level.symbol}</span>
                <strong>{level.name}</strong>
                <small>{modes[level.id]}</small>
              </button>
            ))}
          </div>
          <p className="sample-note">
            Deine Stufe gilt auch in den anderen Fächern. Wir merken uns deine
            Wortkarten für jede Stufe getrennt. Hier gibt es in jeder Stufe 1
            Punkt pro richtiger Antwort. Deine Punkte kannst du für Spiele und
            Belohnungen verwenden.
          </p>
          <label className="vocabulary-deck">
            Dein Wortthema
            <select
              value={deck}
              disabled={disabled}
              onChange={(event) => setDeck(event.target.value)}
            >
              <option value="all">
                Alle Themen · {state.decks.length} Wörterwelten
              </option>
              {state.decks.map((item) => (
                <option key={item.id} value={item.id}>
                  {item.name}
                </option>
              ))}
            </select>
          </label>
          <p>
            {state.total} Karten im Thema · {state.newCount} neu ·{' '}
            {state.dueCount} zum Wiederholen fällig
          </p>
          <ol className="vocabulary-boxes" aria-label="Deine fünf Karteifächer">
            {state.boxes.map((count, index) => (
              <li key={index}>
                <strong>Fach {index + 1}</strong>
                <span>
                  {count} {count === 1 ? 'Karte' : 'Karten'}
                </span>
                <small>
                  {
                    ['Bald wieder', '1 Tag', '3 Tage', '7 Tage', '14 Tage'][
                      index
                    ]
                  }
                </small>
              </li>
            ))}
          </ol>
          {!state.profileReady && (
            <p>
              Speichere unten zuerst dein Lernprofil. Dann kann sich Lernwelt
              deine Wortkarten merken.
            </p>
          )}
          {card && presented && (
            <article className="flashcard" aria-labelledby="card-prompt">
              <p className="eyebrow">
                {presented.reviews === 0
                  ? 'NEUES WORT'
                  : `WIEDERHOLUNG · FACH ${presented.boxNumber}`}
              </p>
              <p>{modes[difficulty]}</p>
              {difficulty === 'streber' && <p>Gesuchtes Wort: {card.german}</p>}
              <h3
                id="card-prompt"
                lang={difficulty === 'koenner' ? 'de' : 'en'}
              >
                {front}
              </h3>
              {!feedback && difficulty === 'vorschule' && (
                <p lang="en">{card.example}</p>
              )}
              {!feedback ? (
                <form
                  onSubmit={(event) => {
                    event.preventDefault();
                    void submit(answer);
                  }}
                >
                  <label>
                    {difficulty === 'vorschule'
                      ? 'Deine deutsche Übersetzung'
                      : 'Deine englische Antwort'}
                    <input
                      value={answer}
                      disabled={disabled}
                      maxLength={160}
                      autoComplete="off"
                      autoCapitalize="off"
                      spellCheck={false}
                      onChange={(event) => setAnswer(event.target.value)}
                      aria-describedby="vocabulary-answer-help"
                    />
                  </label>
                  <p id="vocabulary-answer-help">
                    Eine passende Übersetzung reicht. Schreibe nur das gesuchte
                    Wort oder die Wortgruppe. Groß- und Kleinschreibung ist hier
                    egal.
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
              ) : (
                <>
                  <h4 ref={feedbackHeading} tabIndex={-1}>
                    {feedback.result.correct
                      ? `Richtig! +${feedback.result.pointsAwarded} Punkt`
                      : 'Noch nicht ganz – wir üben das wieder!'}
                  </h4>
                  {feedback.answer !== null && (
                    <p>Deine Antwort: {feedback.answer}</p>
                  )}
                  <div className="card-answer">
                    <p>
                      {feedback.result.correct
                        ? 'Eine passende Lösung'
                        : 'Die Lösung'}
                    </p>
                    <strong lang={difficulty === 'vorschule' ? 'de' : 'en'}>
                      {back}
                    </strong>
                    <p lang="en">{card.example}</p>
                  </div>
                  <p>
                    {feedback.result.correct
                      ? `Die Karte liegt jetzt in Fach ${feedback.result.boxNumber}. Wieder dran: ${date(feedback.result.dueAt)}.`
                      : 'Kein Punkteabzug. Schau dir das Wort in Ruhe an. Es kommt in etwa einer Minute wieder.'}
                  </p>
                  <button
                    className="primary-button"
                    disabled={busy}
                    onClick={() => setReload((v) => v + 1)}
                  >
                    Nächste Karte
                  </button>
                </>
              )}
            </article>
          )}
          {state.profileReady && !card && (
            <div className="flashcard">
              <h3>Für jetzt geschafft!</h3>
              <p>
                In diesem Thema ist gerade keine Karte fällig. Eine Pause gehört
                zum Lernen dazu.
              </p>
              {state.nextDueAt !== null && (
                <p>
                  Nächste Wiederholung: {date(state.nextDueAt)}. Klicke dann auf
                  „Fällige Karten laden“.
                </p>
              )}
              <p>Du kannst auch ein anderes Wortthema wählen.</p>
            </div>
          )}
          <details className="source-note">
            <summary>So funktionieren deine Karteifächer</summary>
            <p>
              Richtig: 1 Punkt und ein Fach weiter, höchstens bis Fach 5. Falsch
              oder Lösung aufgedeckt: 0 Punkte, zurück in Fach 1 und nach einer
              Minute wieder dran. Die weiteren Abstände sind 1, 3, 7 und 14
              Tage. Fällige Wiederholungen kommen vor neuen Wörtern.
            </p>
            <p>
              Die App prüft hinterlegte Übersetzungen und häufige Varianten. Es
              gibt keine KI-Bewertung; nicht jede mögliche Umschreibung wird
              erkannt. Die angezeigte Lösung ist ein Beispiel.
            </p>
            <p>
              {state.catalogTotal} eigene Wortkarten mit Beispielen.{' '}
              {state.orientation} {state.curriculumVersion}. Quelle:{' '}
              {state.source}
            </p>
            <p>
              Dein Stand bleibt auf diesem Gerät. Termine richten sich nach der
              Geräteuhr. Insgesamt verdient: {state.wallet.totalEarned} Punkte.
            </p>
          </details>
        </>
      )}
    </section>
  );
}
