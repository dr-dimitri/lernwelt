import { useEffect, useRef, useState, type SubmitEvent } from 'react';
import {
  difficulties,
  type AnswerResult,
  type Difficulty,
  type LearningState,
} from '../domain/learning';
import { planets, solarBodies, type SolarBody } from '../domain/solar-system';
import { desktop } from '../lib/desktop';
import InfoPanel from './InfoPanel';
import LearningHints from './LearningHints';
import PlanetGallery from './PlanetGallery';
import SolarSystemModel from './SolarSystemModel';
import '../solar-system.css';

export default function SolarSystemWorld({
  profileVersion,
}: {
  profileVersion: number;
}) {
  const [mode, setMode] = useState<'discover' | 'quiz'>('discover');
  const [selected, setSelected] = useState<SolarBody['id']>('earth');
  const [state, setState] = useState<LearningState | null>(null);
  const [loading, setLoading] = useState(true);
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState('');
  const [reload, setReload] = useState(0);
  const [index, setIndex] = useState(0);
  const [finished, setFinished] = useState(false);
  const [answer, setAnswer] = useState('');
  const [result, setResult] = useState<AnswerResult | null>(null);
  const revision = useRef(0);
  const inFlight = useRef(false);
  const pending = useRef<{
    id: string;
    questionId: string;
    answer: string;
  } | null>(null);
  const questionHeading = useRef<HTMLHeadingElement>(null);
  const focusQuestion = useRef(false);
  const planet = solarBodies.find((item) => item.id === selected)!;
  const questions =
    state?.questions.filter(
      (item) =>
        item.subject === 'geography' &&
        item.difficulty === state.difficulty &&
        item.solarSystemPlanetId,
    ) ?? [];
  const question = questions[index];
  const target = planets.find(
    (item) => item.id === question?.solarSystemPlanetId,
  );
  const solved = questions.filter((item) => item.solved).length;
  const enabled = !!state?.profileReady && !busy && !loading;

  useEffect(() => {
    let active = true;
    const version = ++revision.current;
    setLoading(true);
    setResult(null);
    desktop
      .getLearningState()
      .then((value) => {
        if (!active || revision.current !== version) return;
        setState(value);
        setError('');
      })
      .catch((reason: unknown) => {
        if (active && revision.current === version)
          setError(
            reason instanceof Error
              ? reason.message
              : 'Deine Lernrunde konnte nicht geladen werden.',
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
    if (focusQuestion.current && mode === 'quiz') {
      questionHeading.current?.focus();
      focusQuestion.current = false;
    }
  }, [mode, index, finished, state?.difficulty]);

  function clearAnswer() {
    setAnswer('');
    setResult(null);
    if (state) setError('');
  }

  function startQuiz() {
    focusQuestion.current = true;
    setMode('quiz');
    setIndex(0);
    setFinished(false);
    clearAnswer();
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
    const version = revision.current;
    try {
      const saved = await desktop.setDifficulty(difficulty);
      if (revision.current !== version) {
        setReload((value) => value + 1);
        return;
      }
      setState((current) => current && { ...current, difficulty: saved });
      focusQuestion.current = true;
      setIndex(0);
      setFinished(false);
      clearAnswer();
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
    if (!question || !answer || !enabled || inFlight.current || result?.correct)
      return;
    inFlight.current = true;
    setBusy(true);
    setError('');
    setResult(null);
    const version = revision.current;
    const questionId = question.id;
    if (
      !pending.current ||
      pending.current.questionId !== questionId ||
      pending.current.answer !== answer
    ) {
      pending.current = { id: crypto.randomUUID(), questionId, answer };
    }
    try {
      const value = await desktop.submitAnswer(
        pending.current.id,
        questionId,
        answer,
      );
      pending.current = null;
      if (revision.current !== version) {
        setReload((current) => current + 1);
        return;
      }
      setState(
        (current) =>
          current && {
            ...current,
            wallet: value.wallet,
            questions: current.questions.map((item) =>
              item.id === questionId && value.correct
                ? { ...item, solved: true }
                : item,
            ),
          },
      );
      setResult(value);
    } catch (reason) {
      if (revision.current === version)
        setError(
          reason instanceof Error
            ? reason.message
            : 'Die Antwort konnte nicht gespeichert werden. Versuche es noch einmal.',
        );
    } finally {
      inFlight.current = false;
      setBusy(false);
    }
  }

  function next() {
    focusQuestion.current = true;
    if (index + 1 >= questions.length) setFinished(true);
    else setIndex((value) => value + 1);
    clearAnswer();
  }

  return (
    <section
      className={`solar-world solar-${mode}`}
      aria-labelledby="solar-title"
    >
      <header className="solar-intro">
        <div>
          <p className="eyebrow">GEOGRAPHIE · DEINE WELTRAUMREISE</p>
          <h2 id="solar-title">Hallo, Sonnensystem!</h2>
          <p>
            Acht Planeten, der Zwergplanet Pluto und ein leuchtender Stern. Komm
            mit auf Entdeckungsreise!
          </p>
        </div>
        <div className="solar-counter" aria-label="Verfügbare Punkte">
          <span aria-hidden="true">✦</span>
          <strong>
            {loading
              ? 'Lädt …'
              : state
                ? `${state.wallet.balance} Punkte`
                : 'Nicht verfügbar'}
          </strong>
          <small>Dein Lernpunktekonto</small>
        </div>
      </header>

      <div className="solar-mode" aria-label="Deine Sonnensystem-Reise">
        <button
          type="button"
          className={
            mode === 'discover' ? 'primary-button' : 'secondary-button'
          }
          aria-pressed={mode === 'discover'}
          disabled={busy}
          onClick={() => {
            setMode('discover');
          }}
        >
          Planeten entdecken
        </button>
        <button
          type="button"
          className={mode === 'quiz' ? 'primary-button' : 'secondary-button'}
          aria-pressed={mode === 'quiz'}
          disabled={busy}
          onClick={startQuiz}
        >
          Planeten erraten
        </button>
      </div>

      {error && (
        <div className="solar-error" role="alert">
          <p>{error}</p>
          {!state && (
            <button
              type="button"
              className="secondary-button"
              disabled={busy || loading}
              onClick={() => setReload((value) => value + 1)}
            >
              Lernrunde neu laden
            </button>
          )}
        </div>
      )}

      {state && (
        <div className="solar-levels">
          <span>Deine Stufe</span>
          <div className="difficulty-options" aria-label="Schwierigkeitsgrad">
            {difficulties.map((difficulty) => (
              <button
                key={difficulty.id}
                type="button"
                aria-pressed={state.difficulty === difficulty.id}
                disabled={busy || loading}
                onClick={() => void changeDifficulty(difficulty.id)}
              >
                <span aria-hidden="true">{difficulty.symbol} </span>
                {difficulty.name}
              </button>
            ))}
          </div>
          <small>Du kannst jederzeit wechseln.</small>
        </div>
      )}

      {mode === 'discover' ? (
        <div className="solar-workspace">
          <SolarSystemModel
            guessing={false}
            selected={selected}
            onSelect={setSelected}
          />
          <div className="solar-discovery-details">
            <article
              className="solar-fact-card"
              aria-labelledby="solar-planet-title"
            >
              <PlanetGallery key={planet.id} planet={planet} />
              <div>
                <p className="eyebrow">
                  {planet.id === 'pluto'
                    ? 'ZWERGPLANET'
                    : `PLANET ${planet.order} VON DER SONNE AUS`}
                </p>
                <h3 id="solar-planet-title">{planet.name}</h3>
                <p className="solar-tagline">{planet.tagline}</p>
                <ul>
                  {planet.facts.map((fact) => (
                    <li key={fact}>{fact}</li>
                  ))}
                </ul>
                <button
                  type="button"
                  className="primary-button"
                  onClick={startQuiz}
                  disabled={busy}
                >
                  Bereit für ein Planeten-Rätsel?
                </button>
              </div>
            </article>
            <InfoPanel paginate className="solar-discover-notes">
              <summary>Die Sonne, unsere Erde und Pluto</summary>
              <article>
                <span aria-hidden="true">☀</span>
                <h3>Unser Stern: die Sonne</h3>
                <p>
                  Die Sonne leuchtet selbst und gibt uns Wärme. Alle acht
                  Planeten kreisen um sie. Eine Umlaufbahn ist der Weg eines
                  Planeten um die Sonne.
                </p>
              </article>
              <article>
                <span aria-hidden="true">♧</span>
                <h3>Ein besonderer Planet</h3>
                <p>
                  Auf der Erde gibt es flüssiges Wasser und Luft zum Atmen. Sie
                  ist unser einziges bekanntes Zuhause mit Leben. Wir können sie
                  schützen: Wasser sparen, Müll vermeiden und öfter zu Fuß
                  gehen.
                </p>
              </article>
              <article>
                <span aria-hidden="true">✦</span>
                <h3>Und was ist mit Pluto?</h3>
                <p>
                  Pluto gehört auch zum Sonnensystem. Er ist ein Zwergplanet und
                  zählt deshalb nicht zu den acht Planeten. Wähle Pluto unter
                  dem Modell und entdecke seine eisige Oberfläche.
                </p>
              </article>
            </InfoPanel>
            <InfoPanel paginate className="solar-activity">
              <summary>Deine Mission abseits des Bildschirms</summary>
              <ol>
                <li>Zeichne die Sonne und acht Kreise für die Planeten.</li>
                <li>
                  Beschrifte sie in der Reihenfolge von der Sonne aus. Schau bei
                  Bedarf im Modell nach.
                </li>
                <li>
                  Zeichne zusätzlich Pluto und schreibe „Zwergplanet“ dazu.
                </li>
                <li>Erkläre jemandem: Was macht unsere Erde besonders?</li>
              </ol>
              <p>
                Zum Merken: „Mein Vater erklärt mir jeden Sonntag unseren
                Nachthimmel.“ Die Anfangsbuchstaben passen zu Merkur, Venus,
                Erde, Mars, Jupiter, Saturn, Uranus und Neptun.
              </p>
            </InfoPanel>
          </div>
        </div>
      ) : loading ? (
        <p role="status">Deine Planeten-Runde wird geladen …</p>
      ) : !state ? (
        <p>
          Du kannst die Planeten schon entdecken. Für gespeicherte Rätsel und
          Lernpunkte öffne die Desktop-App.
        </p>
      ) : finished ? (
        <div className="solar-round-end">
          <p className="eyebrow">DEINE REISE DURCH ALLE ACHT PLANETEN</p>
          <h3 ref={questionHeading} tabIndex={-1}>
            Einmal durchs Sonnensystem!
          </h3>
          <p>
            {solved} von {questions.length} Planeten-Rätseln hast du auf dieser
            Stufe schon gelöst. Alles darfst du in Ruhe noch einmal
            ausprobieren.
          </p>
          <button className="primary-button" type="button" onClick={startQuiz}>
            Noch eine Reise starten
          </button>
          <button
            className="secondary-button"
            type="button"
            onClick={() => setMode('discover')}
          >
            Steckbriefe entdecken
          </button>
        </div>
      ) : question && target ? (
        <>
          {!state.profileReady && (
            <p className="status-message">
              Speichere oben unter „Dein Profil“ deinen Namen. Dann kannst du
              Antworten prüfen und Lernpunkte sammeln. Die Planeten kannst du
              jetzt schon entdecken.
            </p>
          )}
          <div className="solar-quiz-heading">
            <p className="eyebrow">
              PLANETEN-RÄTSEL {index + 1} VON {questions.length}
            </p>
            <h3 ref={questionHeading} tabIndex={-1}>
              {question.prompt}
            </h3>
            <p>
              Schau auf den goldmarkierten Planeten. Wähle seinen Namen und
              prüfe deine Antwort.
            </p>
          </div>
          <div className="solar-workspace">
            <SolarSystemModel
              guessing
              target={question.solarSystemPlanetId}
              selected={selected}
              onSelect={setSelected}
            />
            <div className="solar-quiz-card">
              <img
                src={target.image}
                alt="NASA-Aufnahme des gesuchten Planeten"
                width="240"
                height="240"
              />
              <div>
                <form onSubmit={(event) => void submit(event)}>
                  <fieldset disabled={!enabled || !!result?.correct}>
                    <legend>Wie heißt dieser Planet?</legend>
                    <div className="solar-answer-options">
                      {question.options.map((option) => (
                        <label
                          key={option}
                          className={answer === option ? 'is-selected' : ''}
                        >
                          <input
                            type="radio"
                            name="solar-answer"
                            value={option}
                            checked={answer === option}
                            onChange={() => {
                              setAnswer(option);
                              setResult(null);
                            }}
                          />
                          {option}
                        </label>
                      ))}
                    </div>
                  </fieldset>
                  <button
                    className="primary-button"
                    disabled={!enabled || !answer || !!result?.correct}
                    type="submit"
                  >
                    {busy ? 'Wird geprüft …' : 'Antwort prüfen'}
                  </button>
                  {question.solved && (
                    <small className="solar-solved">
                      Schon gelöst · Wiederholen ist immer erlaubt.
                    </small>
                  )}
                </form>
                <LearningHints key={question.id} question={question} />
                {result && (
                  <div
                    className={`solar-feedback ${result.correct ? 'correct' : ''}`}
                    role="status"
                  >
                    <strong>
                      {result.correct
                        ? result.pointsAwarded
                          ? `Richtig! +${result.pointsAwarded} ${result.pointsAwarded === 1 ? 'Punkt' : 'Punkte'}`
                          : 'Richtig! Diesen Planeten hast du schon gelöst.'
                        : 'Noch nicht ganz. Du kannst es nochmal versuchen!'}
                    </strong>
                    {result.correct ? (
                      <p>{result.explanation}</p>
                    ) : (
                      <>
                        {result.mistakeHint && <p>{result.mistakeHint}</p>}
                        <InfoPanel>
                          <summary>Lösung verstehen</summary>
                          <p>{result.explanation}</p>
                        </InfoPanel>
                      </>
                    )}
                  </div>
                )}
                <button
                  className="secondary-button solar-next"
                  type="button"
                  disabled={busy}
                  onClick={next}
                >
                  {index + 1 === questions.length
                    ? 'Reise abschließen'
                    : 'Nächster Planet →'}
                </button>
              </div>
            </div>
          </div>
          <p className="solar-points-note">
            Eine neue richtige Lösung bringt{' '}
            {state.pointsByDifficulty[state.difficulty]}{' '}
            {state.pointsByDifficulty[state.difficulty] === 1
              ? 'Punkt'
              : 'Punkte'}
            . Fehler kosten nichts. Bereits gelöste Rätsel geben keine weiteren
            Punkte.
          </p>
        </>
      ) : (
        <p role="alert">
          Für diese Stufe sind gerade keine Planeten-Rätsel verfügbar. Du kannst
          die Planeten weiter entdecken.
        </p>
      )}

      <InfoPanel className="solar-sources">
        <summary>Für Neugierige &amp; Erwachsene: Quellen und Bilder</summary>
        <p>
          Dieses begrenzte Lernangebot gehört zu Geographie Klasse 5,
          Lernbereich 2 „Planet Erde“: Grundstruktur des Sonnensystems und
          Besonderheiten der Erde. Es deckt nicht den gesamten
          Geographie-Lehrplan ab. Quellenstand: 03.10.2026; Pluto ergänzt am
          04.10.2026.
        </p>
        <p>
          <a
            href="https://www.lehrplanplus.bayern.de/fachlehrplan/gymnasium/5/geographie"
            target="_blank"
            rel="noreferrer"
          >
            LehrplanPLUS Bayern
          </a>{' '}
          ·{' '}
          <a
            href="https://science.nasa.gov/solar-system/planets/"
            target="_blank"
            rel="noreferrer"
          >
            NASA: die Planeten
          </a>
        </p>
        <p>
          Alle Bilder sind lokal mitgeliefert. Manche Aufnahmen wurden aus
          mehreren Bildern zusammengesetzt oder farblich bearbeitet. Die Links
          öffnen externe Quellen und benötigen Internet.
        </p>
        <ul>
          {solarBodies.map((item) => (
            <li key={item.id}>
              <a href={item.imageSource} target="_blank" rel="noreferrer">
                {item.name}
              </a>
              : {item.imageCredit}
            </li>
          ))}
        </ul>
      </InfoPanel>
    </section>
  );
}
