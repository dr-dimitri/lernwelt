import { useEffect, useRef, useState } from 'react';
import { difficulties, type Difficulty } from '../domain/learning';
import type { VocabularyState, VocabularyReview } from '../domain/vocabulary';
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

export default function VocabularyPanel({
  profileVersion,
}: {
  profileVersion: number;
}) {
  const [state, setState] = useState<VocabularyState | null>(null);
  const [deck, setDeck] = useState('all');
  const [reload, setReload] = useState(0);
  const [flipped, setFlipped] = useState(false);
  const [answer, setAnswer] = useState('');
  const [busy, setBusy] = useState(true);
  const [error, setError] = useState('');
  const [notice, setNotice] = useState('');
  const [pending, setPending] = useState<VocabularyReview | null>(null);
  const revision = useRef(0);
  const inFlight = useRef(false);
  const flipButton = useRef<HTMLButtonElement>(null);

  useEffect(() => {
    const current = ++revision.current;
    setBusy(true);
    setError('');
    setNotice('');
    setState(null);
    setPending(null);
    setFlipped(false);
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
    setNotice('');
    try {
      await desktop.setDifficulty(difficulty);
      const next = await desktop.getVocabularyState(deck);
      if (current !== revision.current) return;
      setState(next);
      setFlipped(false);
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

  async function rate(known: boolean) {
    if (inFlight.current || !state?.card || !flipped || !state.profileReady)
      return;
    const request = pending ?? {
      requestId: crypto.randomUUID(),
      cardId: state.card.card.id,
      deckId: deck,
      difficulty: state.difficulty,
      expectedReviews: state.card.reviews,
      known,
    };
    const current = revision.current;
    inFlight.current = true;
    setBusy(true);
    setError('');
    setNotice('');
    setPending(request);
    try {
      const result = await desktop.reviewVocabulary(request);
      if (current !== revision.current) return;
      setState(result.state);
      setPending(null);
      setFlipped(false);
      setAnswer('');
      setNotice(
        request.known
          ? `Gut erinnert! Die Karte liegt jetzt in Fach ${result.boxNumber}. Wieder dran: ${date(result.dueAt)}.`
          : 'Alles okay! Diese Karte kommt in etwa einer Minute wieder. Übe inzwischen ein anderes Wort oder mach eine kleine Pause.',
      );
      // The next card is mounted by this state update. Focus it after React commits.
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
    if (notice && !busy && !flipped) flipButton.current?.focus();
  }, [notice, busy, flipped]);

  const presented = state?.card;
  const card = presented?.card;
  const disabled = busy || !!pending;
  const front =
    card &&
    state &&
    (state.difficulty === 'vorschule'
      ? card.english
      : state.difficulty === 'koenner'
        ? card.german
        : card.cloze);
  const back =
    card &&
    state &&
    (state.difficulty === 'vorschule' ? card.german : card.english);
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
        Erst selbst überlegen, dann umdrehen. Noch unsicher? Dieses Wort kommt
        bald wieder. Du bestimmst dein Tempo.
      </p>
      {busy && (
        <p role="status">Wortkarten werden geladen oder gespeichert …</p>
      )}
      {error && (
        <div role="alert" className="error-message">
          <p>{error}</p>
          {pending && (
            <button
              className="primary-button"
              onClick={() => void rate(pending.known)}
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
        onClick={() => setReload((value) => value + 1)}
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
                <span aria-hidden="true">{level.symbol}</span>{' '}
                <strong>{level.name}</strong>
                <small>{modes[level.id]}</small>
              </button>
            ))}
          </div>
          <p className="sample-note">
            Deine Stufe gilt auch in den anderen Fächern. Wir merken uns deine
            Wortkarten für jede Stufe getrennt. Für die ehrliche
            Selbsteinschätzung gibt es keine Punkte; Punkte sammelst du bei den
            Lernaufgaben.
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
              <p>{modes[state.difficulty]}</p>
              {state.difficulty === 'streber' && (
                <p>Gesuchtes Wort: {card.german}</p>
              )}
              <h3
                id="card-prompt"
                lang={state.difficulty === 'koenner' ? 'de' : 'en'}
              >
                {front}
              </h3>
              {!flipped ? (
                <>
                  <label>
                    Deine Antwort zum Vergleichen (freiwillig)
                    <input
                      value={answer}
                      disabled={busy}
                      maxLength={160}
                      autoComplete="off"
                      onChange={(event) => setAnswer(event.target.value)}
                    />
                  </label>
                  <button
                    className="primary-button"
                    ref={flipButton}
                    disabled={busy}
                    onClick={() => setFlipped(true)}
                  >
                    Karte umdrehen
                  </button>
                </>
              ) : (
                <>
                  {answer && <p>Deine Antwort: {answer}</p>}
                  <div className="card-answer">
                    <p>Die Lösung</p>
                    <strong
                      lang={state.difficulty === 'vorschule' ? 'de' : 'en'}
                    >
                      {back}
                    </strong>
                    <p lang="en">{card.example}</p>
                    {state.difficulty !== 'vorschule' && <p>{card.german}</p>}
                  </div>
                  <p>
                    Hattest du die Bedeutung oder das Wort vor dem Umdrehen
                    gewusst? Auch eine passende andere Übersetzung zählt. Sei
                    ehrlich – so übst du genau das Richtige.
                  </p>
                  <div className="card-actions">
                    <button
                      className="secondary-button"
                      disabled={disabled}
                      onClick={() => void rate(false)}
                    >
                      Noch üben
                    </button>
                    <button
                      className="primary-button"
                      disabled={disabled}
                      onClick={() => void rate(true)}
                    >
                      Gewusst
                    </button>
                  </div>
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
          {notice && <p role="status">{notice}</p>}
          <details className="source-note">
            <summary>So funktionieren deine Karteifächer</summary>
            <p>
              Gewusst: ein Fach weiter, höchstens bis Fach 5. Noch üben: zurück
              in Fach 1, nach einer Minute wieder dran. Die weiteren Abstände
              sind 1, 3, 7 und 14 Tage. Fällige Wiederholungen kommen vor neuen
              Wörtern. Dein Stand bleibt auf diesem Gerät gespeichert.
            </p>
            <p>
              120 eigene Wortkarten mit Beispielen. {state.orientation}{' '}
              {state.curriculumVersion}. Quelle: {state.source}
            </p>
            <p>
              Die Termine richten sich nach der Uhr deines Geräts. Die App muss
              nicht offen bleiben. Kein Timer läuft gegen dich, und es gibt
              keinen Punkteabzug.
            </p>
          </details>
        </>
      )}
    </section>
  );
}
