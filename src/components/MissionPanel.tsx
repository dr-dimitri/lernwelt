import { useEffect, useId, useRef, useState } from 'react';
import { difficulties, type Difficulty } from '../domain/learning';
import type {
  MissionActionInput,
  MissionDiagram,
  MissionStartInput,
  MissionState,
} from '../domain/mission';
import { desktop } from '../lib/desktop';
import InfoPanel from './InfoPanel';
import { MissionAlbum, missionDate } from './MissionCard';
import '../mission.css';

type Request =
  | { kind: 'start'; input: MissionStartInput }
  | { kind: 'action'; input: MissionActionInput };
const stepNames = [
  'Erinnern',
  'Entdecken',
  'Selbst lösen',
  'Fehlerdetektiv',
  'Mitmachen',
];

function GardenDiagram({ diagram }: { diagram: MissionDiagram }) {
  const titleId = useId();
  const width = diagram.width === null ? '?' : diagram.width;
  const height = diagram.height === null ? '?' : diagram.height;
  const lengthLabel = `Länge ${width} ${diagram.unit}`;
  const widthLabel = `Breite ${height} ${diagram.unit}`;
  return (
    <figure className="mission-garden">
      <svg viewBox="0 0 390 255" role="img" aria-labelledby={titleId}>
        <title id={titleId}>
          Rechteck: zwei Seiten mit {lengthLabel}, zwei Seiten mit {widthLabel}.
          Nicht maßstabsgetreu.
        </title>
        <rect x="92" y="55" width="206" height="140" rx="8" fill="#e0f0df" />
        <path
          d="M92 55H298M92 195H298"
          stroke="#147565"
          strokeWidth="7"
          strokeLinecap="round"
        />
        <path
          d="M92 55V195M298 55V195"
          stroke="#aa583d"
          strokeWidth="7"
          strokeDasharray="10 5"
        />
        <text x="195" y="32" textAnchor="middle" fill="#125d50">
          {lengthLabel}
        </text>
        <text x="195" y="225" textAnchor="middle" fill="#125d50">
          {lengthLabel}
        </text>
        <text
          transform="translate(64 125) rotate(-90)"
          textAnchor="middle"
          fill="#87442d"
        >
          {widthLabel}
        </text>
        <text
          transform="translate(328 125) rotate(90)"
          textAnchor="middle"
          fill="#87442d"
        >
          {widthLabel}
        </text>
        <g aria-hidden="true" fill="#7faa75">
          <circle cx="150" cy="102" r="8" />
          <circle cx="170" cy="140" r="8" />
          <circle cx="218" cy="105" r="8" />
          <circle cx="239" cy="150" r="8" />
        </g>
      </svg>
      <figcaption>
        Gegenüberliegende Seiten sind gleich lang. Die Zeichnung ist nicht
        maßstabsgetreu.
      </figcaption>
    </figure>
  );
}

export default function MissionPanel({
  profileVersion,
}: {
  profileVersion: number;
}) {
  const [state, setState] = useState<MissionState | null>(null);
  const [busy, setBusy] = useState(true);
  const [error, setError] = useState('');
  const [pending, setPending] = useState<Request | null>(null);
  const [answer, setAnswer] = useState('');
  const [reload, setReload] = useState(0);
  const revision = useRef(0);
  const inFlight = useRef(false);
  const reloadRequested = useRef(false);
  const focus = useRef<'step' | 'feedback' | 'hint' | null>(null);
  const panelHeading = useRef<HTMLHeadingElement>(null);
  const field = useRef<HTMLInputElement>(null);
  const stepHeading = useRef<HTMLHeadingElement>(null);
  const feedbackHeading = useRef<HTMLHeadingElement>(null);
  const hint = useRef<HTMLElement>(null);
  const answerId = useId();

  useEffect(() => {
    const current = ++revision.current;
    const restoreFocus = reloadRequested.current;
    reloadRequested.current = false;
    inFlight.current = true;
    setBusy(true);
    setError('');
    setState(null);
    setPending(null);
    setAnswer('');
    focus.current = null;
    void desktop
      .getMissionState()
      .then((value) => {
        if (current !== revision.current) return;
        setState(value);
        if (restoreFocus)
          focus.current = value.session?.currentStep?.feedback
            ? 'feedback'
            : 'step';
      })
      .catch((reason: unknown) => {
        if (current === revision.current) showError(reason);
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
  }, [profileVersion, reload]);

  useEffect(() => {
    if (busy || pending || error) return;
    const requested = focus.current;
    focus.current = null;
    if (requested === 'feedback')
      (
        feedbackHeading.current ??
        field.current ??
        stepHeading.current ??
        panelHeading.current
      )?.focus();
    else if (requested === 'hint')
      (
        hint.current ??
        field.current ??
        stepHeading.current ??
        panelHeading.current
      )?.focus();
    else if (requested === 'step')
      (field.current ?? stepHeading.current ?? panelHeading.current)?.focus();
  }, [busy, pending, error, state]);

  function showError(reason: unknown) {
    setError(
      reason instanceof Error
        ? reason.message
        : 'Dein Schritt konnte nicht gespeichert werden. Bitte versuche es erneut.',
    );
  }
  async function run(request: Request) {
    if (inFlight.current) return;
    const current = revision.current;
    inFlight.current = true;
    setBusy(true);
    setError('');
    setPending(request);
    try {
      const value =
        request.kind === 'start'
          ? await desktop.startMission(request.input)
          : await desktop.actMission(request.input);
      if (current !== revision.current) return;
      setState(value);
      setPending(null);
      const action = request.kind === 'start' ? 'start' : request.input.action;
      if (action === 'answer' || action === 'reveal')
        focus.current = 'feedback';
      if (action === 'hint') focus.current = 'hint';
      if (action === 'next' || action === 'skip' || action === 'start') {
        setAnswer('');
        focus.current = 'step';
      }
    } catch (reason) {
      if (current === revision.current) showError(reason);
    } finally {
      if (current === revision.current) {
        inFlight.current = false;
        setBusy(false);
      }
    }
  }
  function start() {
    if (!state?.profileReady || pending) return;
    void run({
      kind: 'start',
      input: { requestId: crypto.randomUUID(), difficulty: state.difficulty },
    });
  }
  function act(
    action: MissionActionInput['action'],
    value: string | null = null,
  ) {
    const session = state?.session;
    if (!session?.currentStep || pending) return;
    void run({
      kind: 'action',
      input: {
        requestId: crypto.randomUUID(),
        sessionId: session.id,
        stepIndex: session.currentStep.index,
        action,
        answer: value,
      },
    });
  }
  function submitAnswer() {
    if (
      state?.session?.currentStep?.answerKind === 'number' &&
      !/^\+?[-−]?(?:\d+|\d{1,3}(?:[ \u00a0\u202f]\d{3})+)(?:[.,]\d*)?$/.test(
        answer.trim(),
      )
    ) {
      setError('Schreibe nur eine Zahl, zum Beispiel 24 oder 24,0.');
      return;
    }
    if (answer.trim()) act('answer', answer);
  }
  async function changeDifficulty(difficulty: Difficulty) {
    if (inFlight.current || pending || difficulty === state?.difficulty) return;
    const current = ++revision.current;
    inFlight.current = true;
    setBusy(true);
    setError('');
    try {
      await desktop.setDifficulty(difficulty);
      if (current !== revision.current) return;
      const next = await desktop.getMissionState();
      if (current !== revision.current) return;
      setState(next);
      setAnswer('');
      focus.current = 'step';
    } catch (reason) {
      if (current === revision.current) {
        setState(null);
        showError(reason);
      }
    } finally {
      if (current === revision.current) {
        inFlight.current = false;
        setBusy(false);
      }
    }
  }

  const step = state?.session?.currentStep;
  const feedback = step?.feedback;
  const disabled = busy || !!pending;
  return (
    <section
      className="detail-panel mission-panel"
      aria-labelledby="mission-title"
      aria-busy={busy}
    >
      <div className="mission-header">
        <div>
          <p className="eyebrow">MATHEMATIK · KLASSE 5</p>
          <h2 id="mission-title" ref={panelHeading} tabIndex={-1}>
            {state?.metadata.title ?? 'Ein Zaun für unseren Garten'}
          </h2>
        </div>
        {state && (
          <span className="points-balance" aria-label="Verfügbare Lernpunkte">
            {state.wallet.balance}{' '}
            {state.wallet.balance === 1 ? 'Punkt' : 'Punkte'}
          </span>
        )}
      </div>
      {busy && (
        <p role="status">Deine Lernrunde wird geladen oder gespeichert …</p>
      )}
      {error && (
        <div role="alert" className="error-message">
          <p>{error}</p>
          <div className="mission-actions">
            {pending && (
              <button
                className="primary-button"
                disabled={busy}
                onClick={() => void run(pending)}
              >
                Speichern erneut versuchen
              </button>
            )}
            <button
              className="secondary-button"
              disabled={busy}
              onClick={() => {
                reloadRequested.current = true;
                setReload((value) => value + 1);
              }}
            >
              Runde neu laden
            </button>
          </div>
        </div>
      )}
      {state && (
        <>
          <div
            className="mission-levels"
            aria-label="Schwierigkeitsgrad für alle Fächer"
          >
            {difficulties.map((level) => (
              <button
                key={level.id}
                className="secondary-button"
                aria-pressed={state.difficulty === level.id}
                disabled={disabled}
                onClick={() => void changeDifficulty(level.id)}
              >
                <span aria-hidden="true">{level.symbol} </span>
                {level.name}
              </button>
            ))}
            <span className="mission-small">
              Deine Stufe gilt in allen Fächern. Jede Stufe merkt sich ihre
              Runde.
            </span>
          </div>
          {!state.profileReady ? (
            <p>
              Speichere dein Lernprofil über „Dein Profil“ oben. Dann kannst du
              deine Gartenrunde starten.
            </p>
          ) : step ? (
            <>
              <ol
                className="mission-path"
                aria-label="Fünf Schritte deiner Lernrunde"
              >
                {stepNames.map((name, index) => (
                  <li
                    key={name}
                    aria-current={index === step.index ? 'step' : undefined}
                    className={index < step.index ? 'is-done' : ''}
                  >
                    <span aria-hidden="true">
                      {index < step.index ? '✓' : index + 1}
                    </span>
                    <span>{name}</span>
                  </li>
                ))}
              </ol>
              <article
                className="mission-step"
                aria-labelledby="mission-step-title"
              >
                <div className="mission-step-body">
                  <p className="eyebrow">
                    SCHRITT {step.index + 1} VON 5
                    {step.kind === 'activity' ? ' · FREIWILLIG' : ''}
                  </p>
                  <h3 id="mission-step-title" ref={stepHeading} tabIndex={-1}>
                    {step.title}
                  </h3>
                  <p className="mission-prompt">{step.prompt}</p>
                  {step.instructions.length > 0 && (
                    <ol className="mission-instructions">
                      {step.instructions.map((instruction) => (
                        <li key={instruction}>{instruction}</li>
                      ))}
                    </ol>
                  )}
                  {step.hint && (
                    <aside
                      className="mission-hint"
                      role="status"
                      ref={hint}
                      tabIndex={-1}
                    >
                      <strong>Dein Tipp</strong>
                      <p>{step.hint}</p>
                    </aside>
                  )}
                  {!feedback && step.answerKind && (
                    <form
                      onSubmit={(event) => {
                        event.preventDefault();
                        submitAnswer();
                      }}
                    >
                      {step.answerKind === 'choice' ? (
                        <fieldset
                          className="mission-options"
                          disabled={disabled}
                        >
                          <legend>Welche Erklärung passt?</legend>
                          {step.options.map((option, index) => (
                            <label key={option}>
                              <input
                                ref={index === 0 ? field : undefined}
                                type="radio"
                                name={answerId}
                                value={option}
                                checked={answer === option}
                                onChange={() => setAnswer(option)}
                              />
                              <span>{option}</span>
                            </label>
                          ))}
                        </fieldset>
                      ) : (
                        <label className="mission-answer" htmlFor={answerId}>
                          Deine Antwort{step.unit ? ` in ${step.unit}` : ''}
                          <input
                            id={answerId}
                            ref={field}
                            inputMode="decimal"
                            autoComplete="off"
                            maxLength={120}
                            value={answer}
                            disabled={disabled}
                            onChange={(event) => setAnswer(event.target.value)}
                          />
                        </label>
                      )}
                      <div className="mission-actions">
                        <button
                          className="primary-button"
                          disabled={disabled || !answer.trim()}
                          type="submit"
                        >
                          Antwort prüfen
                        </button>
                        <button
                          className="secondary-button"
                          disabled={disabled || !!step.hint}
                          type="button"
                          onClick={() => act('hint')}
                        >
                          {step.hint ? 'Tipp ist offen' : 'Gib mir einen Tipp'}
                        </button>
                        <button
                          className="secondary-button"
                          disabled={disabled}
                          type="button"
                          onClick={() => act('reveal')}
                        >
                          Lösung ansehen
                        </button>
                      </div>
                    </form>
                  )}
                  {feedback && (
                    <div
                      className={`mission-feedback ${feedback.correct ? 'is-correct' : ''}`}
                    >
                      <h4 ref={feedbackHeading} tabIndex={-1}>
                        {step.kind === 'activity'
                          ? 'Deine Selbstkontrolle'
                          : feedback.revealed
                            ? 'Schauen wir uns den Weg an'
                            : feedback.correct
                              ? 'Das stimmt – gut gelöst!'
                              : 'Noch nicht ganz. Entdecken wir den Weg.'}
                      </h4>
                      <p>{feedback.explanation}</p>
                      {feedback.pointsAwarded > 0 && (
                        <p className="mission-points">
                          +{feedback.pointsAwarded}{' '}
                          {feedback.pointsAwarded === 1
                            ? 'Lernpunkt'
                            : 'Lernpunkte'}
                        </p>
                      )}
                      {feedback.correct === false && (
                        <p>
                          Fehler kosten keine Punkte. Du kannst das später
                          wieder üben.
                        </p>
                      )}
                    </div>
                  )}
                  {(feedback || step.kind === 'discover') && (
                    <button
                      className="primary-button"
                      disabled={disabled}
                      onClick={() => act('next')}
                    >
                      {step.kind === 'activity'
                        ? 'Runde abschließen'
                        : 'Nächster Schritt'}
                    </button>
                  )}
                  {step.kind === 'activity' && !feedback && (
                    <div className="mission-actions">
                      <button
                        className="primary-button"
                        disabled={disabled}
                        onClick={() => act('reveal')}
                      >
                        Selbstkontrolle ansehen
                      </button>
                      <button
                        className="secondary-button"
                        disabled={disabled}
                        onClick={() => act('skip')}
                      >
                        Heute überspringen
                      </button>
                    </div>
                  )}
                </div>
                {step.diagram && <GardenDiagram diagram={step.diagram} />}
              </article>
            </>
          ) : (
            <div className="mission-welcome">
              <h3 ref={stepHeading} tabIndex={-1}>
                {state.session?.completed
                  ? 'Deine Gartenrunde ist geschafft!'
                  : 'Bereit für deinen Garten?'}
              </h3>
              <p>
                {state.session?.completed
                  ? 'Du hast den Rand auf verschiedenen Wegen entdeckt. Eine Pause gehört zum Lernen dazu.'
                  : 'Erinnere dich, entdecke ein Beispiel und löse selbst. Danach wirst du zum Fehlerdetektiv. Zum Schluss kannst du mit einem Heft selbst messen.'}
              </p>
              {state.dueAt && (
                <p>
                  {state.due
                    ? 'Deine Wiederholung ist jetzt dran.'
                    : `Deine nächste Wiederholung wartet ab ${missionDate(state.dueAt)}. Vorher kannst du freiwillig üben.`}
                </p>
              )}
              <button
                className="primary-button"
                disabled={disabled}
                onClick={start}
              >
                {state.due
                  ? 'Jetzt wiederholen'
                  : state.session?.completed
                    ? 'Noch eine Runde üben'
                    : 'Lernrunde starten'}
              </button>
            </div>
          )}
          <div className="mission-album-row">
            <h3>Dein Themenalbum</h3>
            <MissionAlbum state={state} />
          </div>
          <InfoPanel>
            <summary>Über diese Lernrunde</summary>
            <p>
              Ein erstes Thema: Rechteckumfang, mit{' '}
              {state.metadata.variantCount} Aufgabenvarianten je Stufe. Noch
              kein vollständiger Lehrgang.
            </p>
            <p>
              „Ausprobiert“ heißt: Du hast begonnen. „Selbst gelöst“ heißt: Du
              hast eine Aufgabe beim ersten Versuch ohne Tipp oder Lösung
              richtig beantwortet. „Später wieder geschafft“ zeigt eine selbst
              gelöste Wiederholung nach einer Pause.
            </p>
            <p>
              Bestätigte Schritte bleiben auf diesem Gerät. Du kannst die Runde
              unterbrechen. Beim nächsten Öffnen geht es hier weiter. Noch nicht
              abgeschickte Eingaben werden nicht gespeichert.
            </p>
            <p>
              Neue richtige Aufgaben bringen je nach Stufe 1, 2 oder 3 Punkte.
              Beispiele, aufgedeckte Lösungen und Mitmachen geben keine Punkte.
              Bereits gelöste Aufgaben zählen nicht noch einmal.
            </p>
            <p>{state.metadata.description}</p>
            <p>
              Kompetenz: {state.metadata.competencyId}.{' '}
              {state.metadata.curriculumVersion}. Quelle:{' '}
              {state.metadata.source}
            </p>
          </InfoPanel>
        </>
      )}
    </section>
  );
}
