import { useEffect, useRef, useState, type SubmitEvent } from 'react';
import {
  difficulties,
  type AnswerResult,
  type Difficulty,
  type LearningState,
} from '../domain/learning';
import {
  earthLayers,
  earthModelNote,
  earthStations,
  type EarthLayerId,
  type EarthStation,
} from '../domain/earth';
import { desktop } from '../lib/desktop';
import EarthModel from './EarthModel';
import EarthPhoto from './EarthPhoto';
import EarthCoreComparison from './EarthCoreComparison';
import InfoPanel from './InfoPanel';
import LearningHints from './LearningHints';
import ProfilePanel from './ProfilePanel';
import useConfirmChange from './useConfirmChange';
import '../earth.css';

export default function EarthWorld({
  profileVersion,
  initialMode = 'discover',
  externalControls = false,
  onActivityChange,
  onProfileSaved,
}: {
  profileVersion: number;
  initialMode?: 'discover' | 'quiz';
  externalControls?: boolean;
  onActivityChange?: (activity: { dirty: boolean; busy: boolean }) => void;
  onProfileSaved?: () => void;
}) {
  const [mode, setMode] = useState(initialMode);
  const [station, setStation] = useState<EarthStation>('open');
  const [selected, setSelected] = useState<EarthLayerId>('crust');
  const [surface, setSurface] = useState(false);
  const [inner, setInner] = useState(false);
  const [state, setState] = useState<LearningState | null>(null);
  const [loading, setLoading] = useState(true);
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState('');
  const [reload, setReload] = useState(0);
  const [index, setIndex] = useState(0);
  const [finished, setFinished] = useState(false);
  const [answer, setAnswer] = useState('');
  const [result, setResult] = useState<AnswerResult | null>(null);
  const [revealed, setRevealed] = useState<string | null>(null);
  const [revealFailed, setRevealFailed] = useState(false);
  const pending = useRef<{
    id: string;
    questionId: string;
    answer: string;
  } | null>(null);
  const inFlight = useRef(false);
  const revision = useRef(0);
  const focus = useRef(initialMode === 'quiz');
  const heading = useRef<HTMLHeadingElement>(null);
  const questions =
    state?.questions.filter(
      (q) =>
        q.topicId === 'geography-earth-layers' &&
        q.difficulty === state.difficulty,
    ) ?? [];
  const question = questions[index];
  const layer = earthLayers.find((l) => l.id === selected)!;
  const ordered = answer ? answer.split('|') : [];
  const enabled = !!state?.profileReady && !loading && !busy;
  const lockedAnswer =
    !enabled || !!result?.correct || revealed !== null || !!pending.current;
  const dirty = !!pending.current || (!!answer && !result && revealed === null);
  const { requestChange, confirmation } = useConfirmChange(dirty, busy);

  useEffect(() => {
    onActivityChange?.({ dirty, busy });
  }, [dirty, busy, onActivityChange]);
  useEffect(() => {
    let active = true;
    const version = ++revision.current;
    setLoading(true);
    setError('');
    setState(null);
    setIndex(0);
    setFinished(false);
    setAnswer('');
    setResult(null);
    setRevealed(null);
    setRevealFailed(false);
    pending.current = null;
    desktop
      .getLearningState()
      .then((value) => {
        if (active && revision.current === version) setState(value);
      })
      .catch((reason: unknown) => {
        if (active && revision.current === version)
          setError(
            reason instanceof Error
              ? reason.message
              : 'Die Lernrunde konnte nicht geladen werden.',
          );
      })
      .finally(() => {
        if (active && revision.current === version) setLoading(false);
      });
    return () => {
      active = false;
      ++revision.current;
    };
  }, [profileVersion, reload]);
  useEffect(() => {
    if (focus.current && mode === 'quiz' && heading.current) {
      heading.current.focus({ preventScroll: true });
      focus.current = false;
    }
  }, [mode, index, finished, state?.difficulty, question?.id]);

  function clear() {
    setAnswer('');
    setResult(null);
    setRevealed(null);
    setRevealFailed(false);
    pending.current = null;
    if (state) setError('');
  }
  function startQuiz() {
    focus.current = true;
    setMode('quiz');
    setIndex(0);
    setFinished(false);
    clear();
  }
  function next() {
    focus.current = true;
    if (index + 1 >= questions.length) setFinished(true);
    else setIndex((i) => i + 1);
    clear();
  }
  async function changeDifficulty(difficulty: Difficulty) {
    if (
      !state ||
      inFlight.current ||
      loading ||
      state.difficulty === difficulty
    )
      return;
    inFlight.current = true;
    setBusy(true);
    setError('');
    const version = revision.current;
    try {
      const saved = await desktop.setDifficulty(difficulty);
      if (revision.current === version) {
        setState((s) => s && { ...s, difficulty: saved });
        focus.current = true;
        setIndex(0);
        setFinished(false);
        clear();
      }
    } catch (reason) {
      if (revision.current === version)
        setError(
          reason instanceof Error
            ? reason.message
            : 'Die Stufe konnte nicht gespeichert werden.',
        );
    } finally {
      inFlight.current = false;
      setBusy(false);
    }
  }
  async function submit(event: SubmitEvent<HTMLFormElement>) {
    event.preventDefault();
    if (
      !question ||
      !enabled ||
      !answer ||
      inFlight.current ||
      result?.correct ||
      revealed !== null
    )
      return;
    if (question.ordering && ordered.length !== question.ordering.items.length)
      return;
    inFlight.current = true;
    setBusy(true);
    setError('');
    setRevealFailed(false);
    const version = revision.current;
    if (!pending.current)
      pending.current = {
        id: crypto.randomUUID(),
        questionId: question.id,
        answer,
      };
    try {
      const receipt = pending.current;
      const value = await desktop.submitAnswer(
        receipt.id,
        receipt.questionId,
        receipt.answer,
      );
      if (revision.current === version) {
        pending.current = null;
        setState(
          (current) =>
            current && {
              ...current,
              wallet: value.wallet,
              questions: current.questions.map((q) =>
                q.id === receipt.questionId && value.correct
                  ? { ...q, solved: true }
                  : q,
              ),
            },
        );
        setResult(value);
      }
    } catch (reason) {
      if (revision.current === version)
        setError(
          reason instanceof Error
            ? reason.message
            : 'Die Antwort konnte nicht gespeichert werden. Versuche dieselbe Antwort erneut.',
        );
    } finally {
      inFlight.current = false;
      setBusy(false);
    }
  }
  async function reveal() {
    if (!question || busy || pending.current || result?.correct) return;
    const version = revision.current;
    inFlight.current = true;
    setBusy(true);
    setError('');
    setRevealFailed(false);
    try {
      const explanation = await desktop.getLearningExplanation(question.id);
      if (revision.current === version) {
        setRevealed(explanation);
        setResult(null);
      }
    } catch (reason) {
      if (revision.current === version) {
        setRevealFailed(true);
        setError(
          reason instanceof Error
            ? reason.message
            : 'Der Lösungsweg konnte nicht geladen werden.',
        );
      }
    } finally {
      inFlight.current = false;
      setBusy(false);
    }
  }
  function editAnswer(value: string) {
    setAnswer(value);
    setResult(null);
  }
  function selectLayer(id: EarthLayerId | string) {
    setSelected(id as EarthLayerId);
  }

  return (
    <section className="earth-world" aria-labelledby="earth-title">
      <header className="earth-intro">
        <div>
          <p className="eyebrow">GEOGRAPHIE · KLASSE 5</p>
          <h2 id="earth-title">Expedition zum Erdkern</h2>
          <p>
            Was steckt unter unseren Füßen? Öffne das Modell und finde es
            heraus.
          </p>
        </div>
        <div className="earth-pass">
          <span aria-hidden="true">◒</span>
          <strong>Deine Forschungsreise</strong>
          <small>Entdecken ist immer frei.</small>
        </div>
      </header>
      <nav className="earth-mode" aria-label="Deine Erdkern-Expedition">
        <button
          type="button"
          className={
            mode === 'discover' ? 'primary-button' : 'secondary-button'
          }
          aria-pressed={mode === 'discover'}
          disabled={busy}
          onClick={() =>
            requestChange(() => {
              setMode('discover');
              clear();
            })
          }
        >
          Entdecken
        </button>
        <button
          type="button"
          className={mode === 'quiz' ? 'primary-button' : 'secondary-button'}
          aria-pressed={mode === 'quiz'}
          disabled={busy}
          onClick={() => requestChange(startQuiz)}
        >
          Erdschichten üben
        </button>
        {state && !externalControls && (
          <div className="earth-levels" aria-label="Deine Stufe">
            {difficulties.map((level) => (
              <button
                type="button"
                key={level.id}
                disabled={busy || loading}
                aria-pressed={state.difficulty === level.id}
                onClick={() =>
                  requestChange(() => void changeDifficulty(level.id))
                }
              >
                {level.name}
              </button>
            ))}
          </div>
        )}
      </nav>
      {error && (
        <div className="earth-error" role="alert">
          <p>{error}</p>
          {!state ? (
            <button
              type="button"
              className="secondary-button"
              disabled={loading}
              onClick={() => setReload((r) => r + 1)}
            >
              Erneut laden
            </button>
          ) : revealFailed ? (
            <button
              type="button"
              className="secondary-button"
              disabled={busy}
              onClick={() => void reveal()}
            >
              Lösungsweg erneut laden
            </button>
          ) : null}
        </div>
      )}
      {mode === 'discover' ? (
        <>
          <nav className="earth-stations" aria-label="Entdeckerstationen">
            {earthStations.map((item) => (
              <button
                type="button"
                key={item.id}
                aria-pressed={station === item.id}
                onClick={() => setStation(item.id)}
              >
                <span aria-hidden="true">{item.symbol}</span>
                {item.name}
              </button>
            ))}
          </nav>
          <div className="earth-workspace">
            <div>
              {station === 'compare' ? (
                <div className="earth-comparison">
                  <p className="eyebrow">
                    DETAILILLUSTRATION · KEIN EXPERIMENT
                  </p>
                  <EarthCoreComparison inner={inner} />
                  <div className="earth-comparison-controls">
                    <button
                      type="button"
                      aria-pressed={!inner}
                      onClick={() => {
                        setInner(false);
                        setSelected('outer-core');
                      }}
                    >
                      Äußerer Kern · flüssig
                    </button>
                    <button
                      type="button"
                      aria-pressed={inner}
                      onClick={() => {
                        setInner(true);
                        setSelected('inner-core');
                      }}
                    >
                      Innerer Kern · fest
                    </button>
                  </div>
                  <p>
                    Die Punkte und Pfeile sind nur eine Merkhilfe. Sie zeigen
                    keine echten Teilchen oder gemessene Kräfte.
                  </p>
                </div>
              ) : station === 'open' && surface ? (
                <div className="earth-surface">
                  <EarthPhoto />
                </div>
              ) : (
                <EarthModel
                  selected={selected}
                  onSelect={selectLayer}
                  probe={station === 'travel'}
                />
              )}
              {station === 'open' && (
                <div className="earth-view-switch">
                  <button
                    type="button"
                    className="secondary-button"
                    aria-pressed={surface}
                    onClick={() => setSurface(true)}
                  >
                    Oberfläche ansehen
                  </button>
                  <button
                    type="button"
                    className="secondary-button"
                    aria-pressed={!surface}
                    onClick={() => setSurface(false)}
                  >
                    Schnitt öffnen
                  </button>
                </div>
              )}
              {station === 'travel' && (
                <label className="earth-travel">
                  Reisestation:{' '}
                  {earthLayers.findIndex((l) => l.id === selected) + 1} von 4
                  <input
                    type="range"
                    min="0"
                    max="3"
                    step="1"
                    value={earthLayers.findIndex((l) => l.id === selected)}
                    aria-valuetext={layer.name}
                    onChange={(event) =>
                      setSelected(earthLayers[Number(event.target.value)].id)
                    }
                  />
                  <span>Außen → Mitte</span>
                </label>
              )}
            </div>
            <div className="earth-detail">
              <article
                className="earth-fact"
                aria-labelledby="earth-layer-title"
              >
                <p className="eyebrow">
                  {station === 'travel'
                    ? 'FIKTIVE REISE · KEINE ECHTE BOHRUNG'
                    : 'DEIN ENTDECKERSTECKBRIEF'}
                </p>
                <h3 id="earth-layer-title">
                  {station === 'compare'
                    ? inner
                      ? 'Innerer Erdkern'
                      : 'Äußerer Erdkern'
                    : layer.name}
                </h3>
                <p className="earth-tagline">
                  {station === 'compare'
                    ? inner
                      ? earthLayers[3].tagline
                      : earthLayers[2].tagline
                    : layer.tagline}
                </p>
                <dl>
                  <div>
                    <dt>Material</dt>
                    <dd>
                      {station === 'compare'
                        ? 'Überwiegend Metall'
                        : layer.material}
                    </dd>
                  </div>
                  <div>
                    <dt>Zustand</dt>
                    <dd>
                      {station === 'compare'
                        ? inner
                          ? '▰ Fest'
                          : '≈ Flüssig'
                        : `${layer.symbol} ${layer.state}`}
                    </dd>
                  </div>
                </dl>
                <ul>
                  {(station === 'compare'
                    ? earthLayers[inner ? 3 : 2].facts
                    : layer.facts
                  ).map((fact) => (
                    <li key={fact}>{fact}</li>
                  ))}
                </ul>
                <p className="earth-model-note">
                  {station === 'travel'
                    ? 'Unsere Sonde reist nur in der Vorstellung. Wir können nicht zum Erdkern bohren.'
                    : earthModelNote}
                </p>
                <button
                  type="button"
                  className="primary-button"
                  onClick={() => requestChange(startQuiz)}
                  disabled={busy}
                >
                  Bereit für ein Erdschichten-Rätsel?
                </button>
              </article>
              <InfoPanel paginate>
                <summary>Baue deine Schicht-Erde</summary>
                <ol>
                  <li>
                    Zeichne vier Kreise ineinander oder schneide vier
                    Papierkreise aus.
                  </li>
                  <li>
                    Beschrifte die Schichten von außen nach innen. Schau bei
                    Bedarf im Modell nach.
                  </li>
                  <li>
                    Markiere den flüssigen äußeren und den festen inneren Kern
                    mit verschiedenen Zeichen.
                  </li>
                  <li>
                    Erkläre jemandem, warum der innere Kern trotz großer Hitze
                    fest ist.
                  </li>
                </ol>
                <p>
                  Selbstkontrolle: Liegt die Kruste außen? Liegt der innere Kern
                  in der Mitte? Erkläre Druck als starkes Zusammendrücken. Hier
                  gibt es keine automatischen Lernpunkte.
                </p>
              </InfoPanel>
              <InfoPanel paginate>
                <summary>Modellgrenzen und Quellen</summary>
                <p>
                  {earthModelNote} Das Innere ist eine Illustration, kein Foto.
                  Der Mantel ist überwiegend fest und kann sich über sehr lange
                  Zeit langsam verformen.
                </p>
                <p>
                  Schalenbau:{' '}
                  <a
                    href="https://www.lehrplanplus.bayern.de/fachlehrplan/gymnasium/5/geographie"
                    target="_blank"
                    rel="noreferrer"
                  >
                    LehrplanPLUS Geo5, Planet Erde
                  </a>
                  . Geprüft 06.10.2026. Begrenztes Übungsangebot, keine
                  vollständige Lehrplanabdeckung.
                </p>
                <p>
                  Fachquellen:{' '}
                  <a
                    href="https://www.usgs.gov/faqs/are-tectonic-plates-floating-magma"
                    target="_blank"
                    rel="noreferrer"
                  >
                    USGS: fester Mantel
                  </a>{' '}
                  ·{' '}
                  <a
                    href="https://www.nps.gov/subjects/geology/plate-tectonics-inner-earth-model.htm"
                    target="_blank"
                    rel="noreferrer"
                  >
                    NPS: Erdinneres und Druck
                  </a>
                  . Eigene Lernwelt-Illustrationen; keine übernommenen
                  NPS-Diagramme.
                </p>
              </InfoPanel>
            </div>
          </div>
        </>
      ) : loading ? (
        <p role="status">Deine Erdschichten-Runde wird geladen …</p>
      ) : !state ? (
        <p>
          Für gespeicherte Antworten öffne die Desktop-App. Du kannst das
          Erdmodell schon entdecken.
        </p>
      ) : !state.profileReady ? (
        <div className="earth-profile">
          <p>
            Speichere dein Profil für Antworten und Punkte. Entdecken
            funktioniert schon jetzt.
          </p>
          <ProfilePanel
            compact
            onActivityChange={onActivityChange}
            onSaved={() => {
              setReload((r) => r + 1);
              onProfileSaved?.();
            }}
          />
        </div>
      ) : finished ? (
        <div className="earth-end">
          <p className="eyebrow">DEINE RUNDE IST GESCHAFFT</p>
          <h3 ref={heading} tabIndex={-1}>
            Zur Mitte und zurück!
          </h3>
          <p>
            {questions.filter((q) => q.solved).length} von {questions.length}{' '}
            Aufgaben auf dieser Stufe sind bereits gelöst. Du kannst alles in
            Ruhe wiederholen.
          </p>
          <button type="button" className="primary-button" onClick={startQuiz}>
            Noch eine Runde
          </button>
          <button
            type="button"
            className="secondary-button"
            onClick={() => setMode('discover')}
          >
            Zurück zum Erdmodell
          </button>
        </div>
      ) : question ? (
        <div className="earth-quiz">
          <div className="earth-question-heading">
            <p className="eyebrow">
              ERDSCHICHTEN-RÄTSEL {index + 1} VON {questions.length}
            </p>
            <h3 ref={heading} tabIndex={-1}>
              {question.prompt}
            </h3>
            {question.solved && (
              <p>✓ Schon gelöst · Wiederholen ist jederzeit erlaubt.</p>
            )}
          </div>
          <div
            className={`earth-quiz-layout ${question.earthDiagram ? 'has-model' : ''}`}
          >
            {question.earthDiagram && (
              <EarthModel
                guessing
                selected={answer}
                onSelect={editAnswer}
                disabled={lockedAnswer}
              />
            )}
            <div className="earth-answer-card">
              <form onSubmit={(event) => void submit(event)}>
                {question.ordering ? (
                  <fieldset disabled={lockedAnswer}>
                    <legend>Baue die Reihenfolge Schritt für Schritt.</legend>
                    <p>Tippe die Bausteine in der gesuchten Reihenfolge an.</p>
                    <div className="earth-order-pool">
                      {question.ordering.items.map((item) => (
                        <button
                          type="button"
                          key={item}
                          disabled={ordered.includes(item)}
                          onClick={() =>
                            editAnswer([...ordered, item].join('|'))
                          }
                        >
                          {item}
                        </button>
                      ))}
                    </div>
                    <ol
                      className="earth-order-result"
                      aria-label="Deine Reihenfolge"
                    >
                      {ordered.map((item, pos) => (
                        <li key={item}>
                          <span>{item}</span>
                          <button
                            type="button"
                            aria-label={`${item} aus der Reihenfolge entfernen`}
                            onClick={() =>
                              editAnswer(
                                ordered.filter((_, i) => i !== pos).join('|'),
                              )
                            }
                          >
                            Entfernen
                          </button>
                        </li>
                      ))}
                    </ol>
                    <button
                      type="button"
                      className="secondary-button"
                      disabled={!answer}
                      onClick={() => editAnswer('')}
                    >
                      Reihenfolge zurücksetzen
                    </button>
                  </fieldset>
                ) : (
                  <fieldset disabled={lockedAnswer}>
                    <legend>
                      {question.earthDiagram
                        ? 'Welcher Bereich passt?'
                        : 'Wähle eine Antwort.'}
                    </legend>
                    <div className="earth-answer-options">
                      {question.options.map((option) => (
                        <label
                          key={option}
                          className={answer === option ? 'is-selected' : ''}
                        >
                          <input
                            type="radio"
                            name="earth-answer"
                            value={option}
                            checked={answer === option}
                            onChange={() => {
                              editAnswer(option);
                              setResult(null);
                            }}
                          />
                          {question.earthDiagram ? `Bereich ${option}` : option}
                        </label>
                      ))}
                    </div>
                  </fieldset>
                )}
                <div className="earth-actions">
                  <button
                    type="submit"
                    className="primary-button"
                    disabled={
                      !enabled ||
                      !answer ||
                      !!result?.correct ||
                      revealed !== null ||
                      (!!question.ordering &&
                        ordered.length !== question.ordering.items.length)
                    }
                  >
                    {busy
                      ? 'Wird gespeichert …'
                      : pending.current
                        ? 'Erneut versuchen'
                        : 'Prüfen'}
                  </button>
                  <button
                    type="button"
                    className="secondary-button"
                    disabled={
                      busy ||
                      !!pending.current ||
                      !!result?.correct ||
                      revealed !== null
                    }
                    onClick={() => void reveal()}
                  >
                    Lösung zeigen · 0 Punkte
                  </button>
                  <button
                    type="button"
                    className="secondary-button"
                    disabled={busy || !!pending.current}
                    onClick={() => requestChange(next)}
                  >
                    {result?.correct || revealed !== null
                      ? 'Weiter'
                      : 'Aufgabe überspringen'}
                  </button>
                </div>
              </form>
              <div className="earth-support">
                <LearningHints compact key={question.id} question={question} />
                {result && (
                  <div
                    className={`earth-feedback ${result.correct ? 'correct' : ''}`}
                    role="status"
                  >
                    <strong>
                      {result.correct
                        ? result.pointsAwarded
                          ? `Richtig! +${result.pointsAwarded} ${result.pointsAwarded === 1 ? 'Punkt' : 'Punkte'}`
                          : 'Richtig! Diese Aufgabe hast du schon gelöst.'
                        : 'Noch nicht ganz. Probiere es in Ruhe noch einmal.'}
                    </strong>
                    {result.correct ? (
                      <p>{result.explanation}</p>
                    ) : (
                      <>
                        <p>
                          {result.mistakeHint ??
                            'Nutze bei Bedarf den Tipp. Fehler kosten keine Punkte.'}
                        </p>
                        <button
                          type="button"
                          className="secondary-button"
                          disabled={busy}
                          onClick={() => {
                            setResult(null);
                            editAnswer('');
                          }}
                        >
                          Noch einmal versuchen
                        </button>
                      </>
                    )}
                  </div>
                )}
                {revealed !== null && (
                  <div className="earth-feedback" role="status">
                    <strong>Dein Lösungsweg · 0 Punkte</strong>
                    <p>{revealed}</p>
                    <p>
                      Übe mit der nächsten Aufgabe weiter. Diese aufgedeckte
                      Aufgabe wird jetzt nicht bewertet.
                    </p>
                  </div>
                )}
                <p className="earth-points-note">
                  Eine erstmals richtige Lösung bringt{' '}
                  {state.pointsByDifficulty[state.difficulty]}{' '}
                  {state.pointsByDifficulty[state.difficulty] === 1
                    ? 'Punkt'
                    : 'Punkte'}
                  . Tipps und Fehler kosten nichts.
                </p>
              </div>
            </div>
          </div>
        </div>
      ) : (
        <p>Auf dieser Stufe sind noch keine Erdschichten-Rätsel verfügbar.</p>
      )}
      {confirmation}
    </section>
  );
}
