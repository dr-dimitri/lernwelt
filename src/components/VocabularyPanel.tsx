import InfoPanel from './InfoPanel';
import ProfilePanel from './ProfilePanel';
import useConfirmChange from './useConfirmChange';
import VocabularyAudio from './VocabularyAudio';
import VocabularyListening from './VocabularyListening';
import { useEffect, useRef, useState } from 'react';
import { difficulties, type Difficulty } from '../domain/learning';
import type {
  VocabularyState,
  VocabularyReview,
  VocabularyReviewResult,
  VocabularyMode,
  VocabularySelection,
} from '../domain/vocabulary';
import {
  scrambleWord,
  letterTiles,
  assembleTiles,
  type LetterTile,
} from '../domain/vocabulary-scramble';
import { desktop } from '../lib/desktop';
import { validateAnswerCharacters } from '../lib/answer-input';

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
  mode: VocabularyMode;
};

export default function VocabularyPanel({
  profileVersion,
  initialDeck = 'all',
  externalControls = false,
  onActivityChange,
  onProfileSaved,
}: {
  profileVersion: number;
  initialDeck?: string;
  externalControls?: boolean;
  onActivityChange?: (activity: { dirty: boolean; busy: boolean }) => void;
  onProfileSaved?: () => void;
}) {
  const [mode, setMode] = useState<'write' | 'listen' | 'scramble'>('write');
  const selection = useRef<VocabularySelection>({ mode: 'write' });
  const [mixed, setMixed] = useState('');
  const [chosen, setChosen] = useState<LetterTile[]>([]);
  const [firstLetter, setFirstLetter] = useState(false);
  const [state, setState] = useState<VocabularyState | null>(null);
  const [deck, setDeck] = useState(initialDeck);
  const [reload, setReload] = useState(0);
  const [answer, setAnswer] = useState('');
  const [feedback, setFeedback] = useState<Feedback | null>(null);
  const [busy, setBusy] = useState(true);
  const [error, setError] = useState('');
  const [pending, setPending] = useState<VocabularyReview | null>(null);
  const revision = useRef(0);
  const inFlight = useRef(false);
  const feedbackHeading = useRef<HTMLHeadingElement>(null);
  const answerField = useRef<HTMLInputElement>(null);
  const completedHeading = useRef<HTMLHeadingElement>(null);
  const focusNextCard = useRef(false);

  const { requestChange, confirmation } = useConfirmChange(
    (mode !== 'listen' && !!answer && !feedback) || !!pending,
    busy,
  );

  useEffect(() => {
    if (externalControls && state && !state.profileReady) return;
    onActivityChange?.({
      dirty: (mode !== 'listen' && !!answer && !feedback) || !!pending,
      busy: busy && (!!pending || !!state),
    });
  }, [
    answer,
    feedback,
    pending,
    busy,
    mode,
    state,
    externalControls,
    onActivityChange,
  ]);

  useEffect(() => {
    const current = ++revision.current;
    // A mode change keeps feedback until the next load. External level/profile
    // changes must then load the selected mode, rather than the feedback's mode.
    const requestedMode = mode === 'scramble' ? 'scramble' : 'write';
    if (selection.current.mode !== requestedMode)
      selection.current = { mode: requestedMode };
    setBusy(true);
    setError('');
    setState(null);
    setPending(null);
    setFeedback(null);
    setAnswer('');
    inFlight.current = true;
    const load =
      selection.current.mode === 'write'
        ? desktop.getVocabularyState(deck)
        : desktop.getVocabularyState(deck, selection.current);
    void load
      .then((value) => {
        if (current === revision.current) {
          setState(value);
          setMixed(value.card ? scrambleWord(value.card.card.english) : '');
          setChosen([]);
          setFirstLetter(false);
          if (externalControls && value.profileReady)
            focusNextCard.current = true;
        }
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
  }, [deck, reload, profileVersion, externalControls]);

  async function changeDifficulty(difficulty: Difficulty) {
    if (inFlight.current || pending) return;
    const current = revision.current;
    inFlight.current = true;
    setBusy(true);
    setError('');
    setFeedback(null);
    try {
      await desktop.setDifficulty(difficulty);
      selection.current = { mode: mode === 'scramble' ? 'scramble' : 'write' };
      const next = await (selection.current.mode === 'write'
        ? desktop.getVocabularyState(deck)
        : desktop.getVocabularyState(deck, selection.current));
      if (current !== revision.current) return;
      setState(next);
      setMixed(next.card ? scrambleWord(next.card.card.english) : '');
      setChosen([]);
      setFirstLetter(false);
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
  async function changeMode(next: 'write' | 'listen' | 'scramble') {
    if (inFlight.current || pending || next === mode) return;
    setMode(next);
    // A checked/revealed card stays checked through every mode switch.
    if (next === 'listen' || feedback || next === selection.current.mode)
      return;
    const exposed =
      selection.current.mode === 'write' &&
      state?.difficulty === 'vorschule' &&
      state.card;
    selection.current = {
      mode: next,
      ...(next === 'scramble' && exposed
        ? { excludeCardId: exposed.card.id }
        : {}),
      ...(state?.card ? { previousCardId: state.card.card.id } : {}),
    };
    setReload((value) => value + 1);
  }
  function nextCard(skip = false) {
    if (busy || pending) return;
    const shown = feedback?.presented ?? state?.card;
    if (
      shown ||
      selection.current.mode !== (mode === 'scramble' ? 'scramble' : 'write')
    ) {
      selection.current = {
        mode: mode === 'scramble' ? 'scramble' : 'write',
        ...(skip && shown ? { excludeCardId: shown.card.id } : {}),
        ...(shown ? { previousCardId: shown.card.id } : {}),
      };
    }
    focusNextCard.current = true;
    setReload((value) => value + 1);
  }
  async function submit(value: string | null) {
    if (inFlight.current || !state?.card || !state.profileReady || feedback)
      return;
    if (value !== null && !value.trim() && !pending) return;
    if (value !== null && !pending) {
      const validationError = validateAnswerCharacters(value);
      if (validationError) {
        setError(validationError);
        answerField.current?.focus();
        return;
      }
    }
    const request = pending ?? {
      requestId: crypto.randomUUID(),
      cardId: state.card.card.id,
      deckId: deck,
      difficulty: state.difficulty,
      expectedReviews: state.card.reviews,
      ...(selection.current.mode === 'scramble'
        ? { mode: 'scramble' as const }
        : {}),
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
        mode: request.mode ?? 'write',
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
    if (busy) return;
    const moveToCard = focusNextCard.current;
    focusNextCard.current = false;
    if (pending || error || !state?.profileReady) return;
    if (feedback) feedbackHeading.current?.focus();
    else if (moveToCard) {
      if (state.card) answerField.current?.focus();
      else completedHeading.current?.focus();
    }
  }, [feedback, busy, pending, error, state]);

  const presented = feedback?.presented ?? state?.card;
  const card = presented?.card;
  const difficulty = feedback?.difficulty ?? state?.difficulty ?? 'koenner';
  const disabled = busy || !!pending;
  const scrambling = (feedback?.mode ?? selection.current.mode) === 'scramble';
  const tiles = letterTiles(mixed);
  const front =
    card &&
    (scrambling
      ? card.german
      : difficulty === 'vorschule'
        ? card.english
        : difficulty === 'koenner'
          ? card.german
          : card.cloze);
  const back =
    card &&
    (!scrambling && difficulty === 'vorschule' ? card.german : card.english);
  const notices = (
    <>
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
              Erneut versuchen
            </button>
          )}
        </div>
      )}
    </>
  );
  return (
    <section
      className="detail-panel vocabulary-panel"
      aria-labelledby="vocabulary-title"
      aria-busy={busy}
    >
      <p className="eyebrow">ENGLISCH · KLASSE 5 · 1. FREMDSPRACHE</p>
      <h2 id="vocabulary-title">Vokabeltrainer</h2>
      <p>
        {mode === 'scramble'
          ? 'Finde das englische Wort. Nutze alle Buchstaben. Jede richtige Antwort bringt 1 Punkt. Fehler kosten nichts.'
          : mode === 'write'
            ? 'Tippe deine Übersetzung ein. Jede richtige Antwort bringt 1 Punkt – auch wenn du ein Wort später wiederholst. Fehler kosten nichts.'
            : 'Mach eine kurze Pause vom Schreiben und entdecke englische Wörter mit deinen Ohren.'}
      </p>
      <div className="card-actions" role="group" aria-label="Übungsart">
        <button
          type="button"
          className="secondary-button"
          aria-pressed={mode === 'write'}
          disabled={disabled}
          onClick={() => requestChange(() => void changeMode('write'))}
        >
          Wörter schreiben
        </button>
        <button
          type="button"
          className="secondary-button"
          aria-pressed={mode === 'scramble'}
          disabled={disabled || !state}
          onClick={() => requestChange(() => void changeMode('scramble'))}
        >
          Buchstabensalat
        </button>
        <button
          type="button"
          className="secondary-button"
          aria-pressed={mode === 'listen'}
          disabled={disabled || !state}
          onClick={() => requestChange(() => void changeMode('listen'))}
        >
          3 Wörter hören
        </button>
      </div>
      {state && (
        <div className="points-balance" aria-label="Verfügbare Lernpunkte">
          {state.wallet.balance}{' '}
          {state.wallet.balance === 1 ? 'Punkt' : 'Punkte'}
        </div>
      )}
      {(!state || mode === 'listen') && notices}
      {mode !== 'listen' && (
        <button
          className="secondary-button"
          disabled={disabled}
          onClick={() => requestChange(() => nextCard())}
        >
          {error ? 'Karten neu laden' : 'Fällige Karten laden'}
        </button>
      )}
      {state && mode === 'listen' && (
        <VocabularyListening
          key={profileVersion}
          decks={state.decks}
          initialDeck={deck}
        />
      )}
      {state && mode !== 'listen' && (
        <div className="vocabulary-workspace">
          <div className="vocabulary-settings">
            <h3>
              {externalControls
                ? 'Dein Wortthema'
                : 'Wie möchtest du Wörter üben?'}
            </h3>
            {notices}
            {!externalControls && (
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
                    onClick={() =>
                      requestChange(() => void changeDifficulty(level.id))
                    }
                  >
                    <span aria-hidden="true">{level.symbol}</span>
                    <strong>{level.name}</strong>
                    <small>
                      {mode === 'scramble'
                        ? {
                            vorschule:
                              'Kurze englische Wörter · freiwilliger Tipp',
                            koenner: 'Englische Wörter aus Buchstaben finden',
                            streber: 'Längere Wörter und Satzlücken',
                          }[level.id]
                        : modes[level.id]}
                    </small>
                  </button>
                ))}
              </div>
            )}
            <InfoPanel>
              <summary>Stufen & Punkte</summary>
              <p className="sample-note">
                Schreiben und Buchstabensalat teilen dieselben Karteifächer und
                Termine. Salat fragt auf jeder Stufe Englisch ab, auch in
                Vorschule. Deine Stufe gilt auch in den anderen Fächern. Wir
                merken uns deine Wortkarten für jede Stufe getrennt. Hier gibt
                es in jeder Stufe 1 Punkt pro richtiger Antwort. Deine Punkte
                kannst du für Spiele und Belohnungen verwenden.
              </p>
            </InfoPanel>
            <label className="vocabulary-deck">
              Dein Wortthema
              <select
                value={deck}
                disabled={disabled}
                onChange={(event) => {
                  const next = event.target.value;
                  requestChange(() => {
                    selection.current = {
                      mode: mode === 'scramble' ? 'scramble' : 'write',
                    };
                    setDeck(next);
                  });
                }}
              >
                <option value="all">
                  Alle Themen · {state.decks.length} Wörterwelten
                </option>
                {state.decks.map((item) => (
                  <option key={item.id} value={item.id}>
                    {mode === 'scramble' && item.id === 'hello'
                      ? 'Das bin ich'
                      : item.name}
                  </option>
                ))}
              </select>
            </label>
            <p>
              {state.total} Karten im Thema · {state.newCount} neu ·{' '}
              {state.dueCount} zum Wiederholen fällig
            </p>
            <InfoPanel>
              <summary>Deine fünf Karteifächer</summary>
              <ol
                className="vocabulary-boxes"
                aria-label="Deine fünf Karteifächer"
              >
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
            </InfoPanel>
            {!state.profileReady &&
              (externalControls ? (
                <ProfilePanel
                  compact
                  onActivityChange={onActivityChange}
                  onSaved={() => {
                    setReload((value) => value + 1);
                    onProfileSaved?.();
                  }}
                />
              ) : (
                <p>
                  Speichere dein Lernprofil über „Dein Profil“ oben. Dann kann
                  sich Lernwelt deine Wortkarten merken.
                </p>
              ))}
          </div>
          {card && presented && (!externalControls || state.profileReady) && (
            <article className="flashcard" aria-labelledby="card-prompt">
              <p className="eyebrow">
                {presented.reviews === 0
                  ? 'NEUES WORT'
                  : `WIEDERHOLUNG · FACH ${presented.boxNumber}`}
              </p>
              <p>
                {scrambling
                  ? 'Welche englische Vokabel passt? Nutze alle Buchstaben.'
                  : modes[difficulty]}
              </p>
              {difficulty === 'streber' && !scrambling && (
                <p>Gesuchtes Wort: {card.german}</p>
              )}
              <h3
                id="card-prompt"
                lang={scrambling || difficulty === 'koenner' ? 'de' : 'en'}
              >
                {front}
              </h3>
              {!feedback && !scrambling && difficulty === 'vorschule' && (
                <p lang="en">{card.example}</p>
              )}
              {feedback || (!scrambling && difficulty === 'vorschule') ? (
                <VocabularyAudio cardId={card.id} disabled={disabled} />
              ) : (
                <p className="sample-note">
                  Nach deiner Antwort kannst du das englische Wort und den
                  Beispielsatz anhören.
                </p>
              )}
              {!feedback && scrambling && (
                <div className="scramble-exercise">
                  {difficulty === 'streber' && <p lang="en">{card.cloze}</p>}
                  <p
                    className="scramble-mixed"
                    lang="en"
                    aria-label="Gemischte Buchstaben"
                  >
                    {mixed}
                  </p>
                  <div
                    className="scramble-tiles"
                    role="group"
                    aria-label="Buchstabenkärtchen"
                  >
                    {tiles.map((tile) => (
                      <button
                        key={tile.id}
                        type="button"
                        className="secondary-button"
                        disabled={
                          disabled || chosen.some((item) => item.id === tile.id)
                        }
                        aria-label={`Buchstabe ${tile.letter}, Kärtchen ${tile.id + 1}`}
                        onClick={() => {
                          const next = [...chosen, tile];
                          setChosen(next);
                          setAnswer(assembleTiles(mixed, next));
                        }}
                      >
                        {tile.letter}
                      </button>
                    ))}
                  </div>
                  <div className="card-actions">
                    <button
                      type="button"
                      className="secondary-button"
                      disabled={disabled || !answer}
                      onClick={() => {
                        const next = chosen.slice(0, -1);
                        setChosen(next);
                        setAnswer(
                          chosen.length
                            ? assembleTiles(mixed, next)
                            : answer.slice(0, -1),
                        );
                      }}
                    >
                      Letzten Buchstaben entfernen
                    </button>
                    <button
                      type="button"
                      className="secondary-button"
                      disabled={disabled || !answer}
                      onClick={() => {
                        setChosen([]);
                        setAnswer('');
                      }}
                    >
                      Zurücksetzen
                    </button>
                  </div>
                </div>
              )}
              {!feedback ? (
                <form
                  onSubmit={(event) => {
                    event.preventDefault();
                    void submit(answer);
                  }}
                >
                  <label>
                    {!scrambling && difficulty === 'vorschule'
                      ? 'Deine deutsche Übersetzung'
                      : 'Deine englische Antwort'}
                    <input
                      ref={answerField}
                      value={answer}
                      disabled={disabled}
                      maxLength={160}
                      autoComplete="off"
                      autoCapitalize="off"
                      spellCheck={false}
                      onChange={(event) => {
                        setAnswer(event.target.value);
                        setChosen([]);
                      }}
                      aria-describedby="vocabulary-answer-help"
                    />
                  </label>
                  <p id="vocabulary-answer-help">
                    {scrambling
                      ? 'Benutze hier alle Buchstaben der angezeigten Schreibweise. Leerzeichen und Trennzeichen bleiben an ihrem Platz.'
                      : 'Eine passende Übersetzung reicht. Schreibe nur das gesuchte Wort oder die Wortgruppe.'}{' '}
                    Groß- und Kleinschreibung ist hier egal.
                  </p>
                  <div className="card-actions">
                    <button
                      className="primary-button"
                      type="submit"
                      disabled={disabled || !answer.trim()}
                    >
                      {busy ? 'Wird gespeichert …' : 'Prüfen'}
                    </button>
                    <InfoPanel returnFocusRef={answerField}>
                      <summary>Hilfe</summary>
                      {scrambling && (
                        <>
                          <button
                            type="button"
                            className="secondary-button"
                            disabled={disabled}
                            onClick={() => setFirstLetter(true)}
                          >
                            Anfangsbuchstaben-Tipp
                          </button>
                          {firstLetter && (
                            <p>
                              Das Wort beginnt mit{' '}
                              <strong lang="en">{card.english[0]}</strong>.
                            </p>
                          )}
                        </>
                      )}
                      <p>
                        Du weißt das Wort noch nicht? Schau die Lösung an. Die
                        Karte kommt später wieder. Dafür gibt es keine Punkte.
                      </p>
                      <button
                        className="secondary-button"
                        type="button"
                        disabled={disabled}
                        data-close-info
                        onClick={() => void submit(null)}
                      >
                        Lösung zeigen
                      </button>
                    </InfoPanel>
                    {scrambling && (
                      <button
                        type="button"
                        className="secondary-button"
                        disabled={disabled}
                        onClick={() => requestChange(() => nextCard(true))}
                      >
                        Überspringen
                      </button>
                    )}
                  </div>
                </form>
              ) : (
                <>
                  <h4 ref={feedbackHeading} tabIndex={-1}>
                    {feedback.result.correct
                      ? `Richtig! +${feedback.result.pointsAwarded} Punkt`
                      : 'Noch nicht ganz – wir üben das wieder!'}
                  </h4>
                  {feedback.result.spellingHint && (
                    <p>{feedback.result.spellingHint}</p>
                  )}
                  {feedback.answer !== null && (
                    <p>Deine Antwort: {feedback.answer}</p>
                  )}
                  <div className="card-answer">
                    <p>
                      {feedback.result.correct
                        ? 'Eine passende Lösung'
                        : 'Die Lösung'}
                    </p>
                    <strong
                      lang={
                        !scrambling && difficulty === 'vorschule' ? 'de' : 'en'
                      }
                    >
                      {back}
                    </strong>
                    <p>{card.german}</p>
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
                    onClick={() => {
                      nextCard();
                    }}
                  >
                    Weiter
                  </button>
                </>
              )}
            </article>
          )}
          {state.profileReady && !card && (
            <div className="flashcard">
              <h3 ref={completedHeading} tabIndex={-1}>
                {mode === 'scramble' &&
                (state.total === 0 || state.temporarilyExcluded)
                  ? 'Gerade keine passende Salatkarte'
                  : 'Für jetzt geschafft!'}
              </h3>
              {mode === 'scramble' && state.temporarilyExcluded && (
                <p>
                  Die eben gezeigte Karte lassen wir für diesen Wechsel aus. Sie
                  bleibt unverändert. Wähle ein anderes Thema oder Wörter
                  schreiben.
                </p>
              )}
              {mode === 'scramble' && state.total === 0 && (
                <p>
                  Dieses Thema enthält gerade keine mischbaren Wörter. Wähle ein
                  anderes Thema oder Wörter schreiben.
                </p>
              )}
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
          <InfoPanel paginate className="source-note">
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
              Geräteuhr. Insgesamt verdient: {state.wallet.totalEarned}{' '}
              {state.wallet.totalEarned === 1 ? 'Punkt' : 'Punkte'}.
            </p>
          </InfoPanel>
        </div>
      )}
      <InfoPanel className="source-note">
        <summary>Über die Audios</summary>
        <p>
          Alle 370 Wörter und ihre Beispielsätze sind in der App gespeichert. Du
          brauchst kein Internet und kein Mikrofon. Eine künstlich erzeugte
          britische Stimme liest vor.
        </p>
        <p>
          Stimme: Piper Cori high von Bryce Beattie, aus frei verfügbaren
          LibriVox-Aufnahmen neu trainiert (Public Domain). Quelle:
          https://brycebeattie.com/files/tts/. Die für Lernwelt neu erzeugten
          Audios stehen unter CC0 1.0
          (https://creativecommons.org/publicdomain/zero/1.0/).
        </p>
        <p>
          Für Lernwelt wurden eigene Texte neu eingesprochen und als MP3
          gespeichert. Keine Empfehlung oder Freigabe durch die Urheber. Die
          Hörübungen geben keine Punkte; deine schriftlichen Wortkarten behalten
          ihre gewohnten Regeln.
        </p>
      </InfoPanel>
      {confirmation}
    </section>
  );
}
