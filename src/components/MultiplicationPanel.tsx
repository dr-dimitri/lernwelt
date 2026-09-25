import { useEffect, useRef, useState } from 'react';
import InfoPanel from './InfoPanel';
import {
  AdventureScene,
  MultiplicationHint,
  RobotPortrait,
  islandBuildings,
  multiplicationParts,
} from './MultiplicationArt';
import type {
  MultiplicationConfiguration,
  MultiplicationInput,
  MultiplicationResult,
  MultiplicationState,
  MultiplicationTask,
  RobotDesign,
  RobotPalette,
} from '../domain/multiplication';
import { desktop } from '../lib/desktop';
import '../multiplication.css';

const designs: { id: RobotDesign; name: string }[] = [
  { id: 'scout', name: 'Entdecker' },
  { id: 'garden', name: 'Gartenfreund' },
  { id: 'aqua', name: 'Wasserforscher' },
];
const palettes: { id: RobotPalette; name: string; color: string }[] = [
  { id: 'mint', name: 'Minzgrün', color: '#5ea990' },
  { id: 'amber', name: 'Sonnengelb', color: '#dfad47' },
  { id: 'violet', name: 'Beerenlila', color: '#9e7cbc' },
];
type Feedback = {
  task: MultiplicationTask;
  answer: string | null;
  result: MultiplicationResult;
};
type ConfigurationDraft = Pick<
  MultiplicationConfiguration,
  'mode' | 'table' | 'design' | 'palette'
>;
type Pending =
  | { kind: 'answer'; input: MultiplicationInput }
  | { kind: 'configure'; input: MultiplicationConfiguration };
const message = (error: unknown) =>
  error instanceof Error
    ? error.message
    : 'Dein Baufortschritt konnte nicht geladen oder gespeichert werden. Bitte versuche es erneut.';

export default function MultiplicationPanel({
  profileVersion,
}: {
  profileVersion: number;
}) {
  const [state, setState] = useState<MultiplicationState | null>(null);
  const [answer, setAnswer] = useState('');
  const [feedback, setFeedback] = useState<Feedback | null>(null);
  const [pending, setPending] = useState<Pending | null>(null);
  const [error, setError] = useState('');
  const [busy, setBusy] = useState(true);
  const [reload, setReload] = useState(0);
  const [paused, setPaused] = useState(false);
  const [settingsOpen, setSettingsOpen] = useState(false);
  const [draft, setDraft] = useState<ConfigurationDraft>({
    mode: 'tables',
    table: null,
    design: 'scout',
    palette: 'mint',
  });
  const revision = useRef(0);
  const inFlight = useRef(false);
  const requestedReload = useRef(false);
  const requestedFocus = useRef<'task' | 'feedback' | 'recovery' | null>(null);
  const field = useRef<HTMLInputElement>(null);
  const heading = useRef<HTMLHeadingElement>(null);
  const panelHeading = useRef<HTMLHeadingElement>(null);
  const stageHeading = useRef<HTMLHeadingElement>(null);
  const settingsDialog = useRef<HTMLDialogElement>(null);
  const settingsButton = useRef<HTMLButtonElement>(null);
  const errorBox = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const current = ++revision.current;
    const restoreFocus = requestedReload.current;
    requestedReload.current = false;
    requestedFocus.current = null;
    inFlight.current = true;
    setBusy(true);
    setState(null);
    setError('');
    setAnswer('');
    setFeedback(null);
    setPending(null);
    setPaused(false);
    setSettingsOpen(false);
    void desktop
      .getMultiplicationState()
      .then((value) => {
        if (current !== revision.current) return;
        setState(value);
        if (restoreFocus) requestedFocus.current = 'task';
      })
      .catch((reason: unknown) => {
        if (current === revision.current) setError(message(reason));
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
  }, [reload, profileVersion]);

  useEffect(() => {
    if (busy || settingsOpen) return;
    if (requestedFocus.current === 'recovery') {
      requestedFocus.current = null;
      (errorBox.current ?? settingsButton.current)?.focus();
      return;
    }
    if (pending || error) return;
    const requested = requestedFocus.current;
    requestedFocus.current = null;
    if (requested === 'feedback')
      (
        heading.current ??
        stageHeading.current ??
        panelHeading.current
      )?.focus();
    else if (requested === 'task')
      (field.current ?? stageHeading.current ?? panelHeading.current)?.focus();
  }, [busy, pending, error, state, feedback, settingsOpen, paused]);
  useEffect(() => {
    if (settingsOpen && !settingsDialog.current?.open)
      settingsDialog.current?.showModal();
  }, [settingsOpen]);

  function closeSettings() {
    settingsDialog.current?.close();
    setSettingsOpen(false);
    if (pending || busy || error) requestedFocus.current = 'recovery';
    else settingsButton.current?.focus();
  }
  function reloadState() {
    settingsDialog.current?.close();
    setSettingsOpen(false);
    requestedReload.current = true;
    setReload((value) => value + 1);
  }
  async function perform(request: Pending) {
    if (inFlight.current || !state) return;
    const current = revision.current;
    inFlight.current = true;
    setBusy(true);
    setError('');
    setPending(request);
    try {
      if (request.kind === 'answer') {
        const task = state.task;
        if (!task) return;
        const result = await desktop.answerMultiplication(request.input);
        if (current !== revision.current) return;
        setFeedback({ task, answer: request.input.answer, result });
        setState(result.state);
        requestedFocus.current = 'feedback';
      } else {
        const next = await desktop.configureMultiplication(request.input);
        if (current !== revision.current) return;
        setState(next);
        setFeedback(null);
        setAnswer('');
        setPaused(false);
        settingsDialog.current?.close();
        setSettingsOpen(false);
        requestedFocus.current = 'task';
      }
      setPending(null);
    } catch (reason) {
      if (current === revision.current) setError(message(reason));
    } finally {
      if (current === revision.current) {
        inFlight.current = false;
        setBusy(false);
      }
    }
  }
  function submit(value: string | null) {
    if (
      inFlight.current ||
      pending ||
      feedback ||
      !state?.profileReady ||
      !state.task
    )
      return;
    if (value !== null && !/^\d{1,8}$/.test(value.trim())) {
      setError(
        'Gib eine ganze Zahl ein, zum Beispiel 24. Nur Ziffern, keine Rechenzeichen.',
      );
      return;
    }
    void perform({
      kind: 'answer',
      input: { mode: state.mode, sequence: state.task.sequence, answer: value },
    });
  }
  function configure(
    changes: Partial<
      Omit<MultiplicationConfiguration, 'requestId' | 'expectedRevision'>
    >,
  ) {
    if (!state?.profileReady || inFlight.current || pending) return;
    const { adventure } = state;
    void perform({
      kind: 'configure',
      input: {
        requestId: crypto.randomUUID(),
        expectedRevision: adventure.revision,
        mode: state.mode,
        world: adventure.world,
        design: adventure.design,
        palette: adventure.palette,
        table: adventure.table,
        review: adventure.review,
        continueStage: false,
        ...changes,
      },
    });
  }
  function openSettings() {
    if (!state || busy || pending) return;
    setDraft({
      mode: state.mode,
      table: state.adventure.table,
      design: state.adventure.design,
      palette: state.adventure.palette,
    });
    setSettingsOpen(true);
  }
  const disabled = busy || !!pending;
  const task = feedback?.task ?? state?.task;
  const adventure = state?.adventure;
  const world = adventure?.world ?? 'workshop';
  const progress = adventure?.worlds[world];
  const completed = progress?.completedStages ?? 0;
  const stageComplete = progress?.awaitingContinue ?? false;
  const sceneRobot =
    world === 'workshop' && stageComplete
      ? (adventure?.lastRobot ?? adventure)
      : adventure;
  const structureIndex = Math.max(0, completed - (stageComplete ? 1 : 0));
  const structure =
    world === 'workshop'
      ? `Roboter ${structureIndex + 1}`
      : structureIndex < islandBuildings.length
        ? islandBuildings[structureIndex]
        : `Inselausbau ${structureIndex - islandBuildings.length + 1}`;
  const trainingLabel =
    state?.mode === 'squares'
      ? 'Quadratzahlen · 10² bis 20²'
      : adventure?.table
        ? `${adventure.table}er-Reihe`
        : '10er-Einmaleins · gemischt';
  const story =
    task &&
    (state?.mode === 'squares'
      ? `Dein Solarfeld hat ${task.left} Reihen mit je ${task.right} Modulen. Wie viele Module sind das zusammen?`
      : world === 'workshop'
        ? `${task.left} ${task.left === 1 ? 'Roboter braucht' : 'Roboter brauchen'} je ${task.right} ${task.right === 1 ? 'Energiezelle' : 'Energiezellen'}. Wie viele Energiezellen sind das zusammen?`
        : `${task.left} ${task.left === 1 ? 'Haus bekommt' : 'Häuser bekommen'} je ${task.right} ${task.right === 1 ? 'Solarmodul' : 'Solarmodule'}. Wie viele Module sind das zusammen?`);
  const parts = task ? multiplicationParts(task.left) : null;
  const errorNotice = error && (
    <div role="alert" className="error-message" ref={errorBox} tabIndex={-1}>
      <p>{error}</p>
      <div className="adventure-actions">
        {pending && (
          <button
            className="primary-button"
            disabled={busy}
            onClick={() => void perform(pending)}
          >
            Speichern erneut versuchen
          </button>
        )}
        <button
          className="secondary-button"
          disabled={busy}
          onClick={reloadState}
        >
          Trainer neu laden
        </button>
      </div>
    </div>
  );

  return (
    <section
      className="detail-panel multiplication-panel adventure-panel"
      aria-labelledby="multiplication-title"
      aria-busy={busy}
    >
      <div className="adventure-topbar">
        <div>
          <p className="eyebrow">RECHNEN. BAUEN. STAUNEN.</p>
          <h2 id="multiplication-title" ref={panelHeading} tabIndex={-1}>
            Deine Einmaleins-Welten
          </h2>
        </div>
        {state && (
          <div className="points-balance" aria-label="Verfügbare Lernpunkte">
            {state.wallet.balance}{' '}
            {state.wallet.balance === 1 ? 'Punkt' : 'Punkte'}
          </div>
        )}
      </div>
      {busy && (
        <p role="status">Deine Bauwelt wird geladen oder gespeichert …</p>
      )}
      {!settingsOpen && errorNotice}
      {state && (
        <>
          <div className="adventure-toolbar">
            <div className="adventure-worlds" aria-label="Deine Spielwelt">
              <button
                aria-pressed={world === 'workshop'}
                disabled={disabled || !state.profileReady}
                onClick={() => configure({ world: 'workshop' })}
              >
                Roboterwerkstatt
              </button>
              <button
                aria-pressed={world === 'island'}
                disabled={disabled || !state.profileReady}
                onClick={() => configure({ world: 'island' })}
              >
                Einmaleins-Insel
              </button>
            </div>
            <div className="adventure-tools">
              <button
                ref={settingsButton}
                className="secondary-button"
                disabled={disabled || !state.profileReady}
                onClick={openSettings}
              >
                Dein Bauplan
              </button>
              <InfoPanel>
                <summary>Dein Bauregal</summary>
                <p>
                  Hier bleiben deine fertigen Bauwerke. Acht geübte Aufgaben
                  ergeben ein Bauwerk – Fehler und aufgedeckte Lösungen zählen
                  mit.
                </p>
                <h3>Deine Roboter</h3>
                {adventure!.robots.length ? (
                  <ul className="adventure-shelf">
                    {adventure!.robots.map((robot) => (
                      <li key={`${robot.design}-${robot.palette}`}>
                        <RobotPortrait
                          design={robot.design}
                          palette={robot.palette}
                        />
                        <strong>
                          {
                            designs.find((item) => item.id === robot.design)
                              ?.name
                          }
                        </strong>
                        <small>
                          {
                            palettes.find((item) => item.id === robot.palette)
                              ?.name
                          }{' '}
                          · {robot.count} gebaut
                        </small>
                      </li>
                    ))}
                  </ul>
                ) : (
                  <p>Dein erster Roboter wartet noch auf seine Bauteile.</p>
                )}
                <h3>Deine Insel</h3>
                <p>
                  {adventure!.worlds.island.completedStages} Bauetappen
                  geschafft.
                </p>
                <ul className="adventure-shelf">
                  {islandBuildings.map((name, index) => (
                    <li key={name}>
                      <strong>
                        {adventure!.worlds.island.completedStages > index
                          ? '✓ '
                          : '○ '}
                        {name}
                      </strong>
                      <small>
                        {adventure!.worlds.island.completedStages > index
                          ? 'Gebaut'
                          : 'Kommt noch'}
                      </small>
                    </li>
                  ))}
                </ul>
                {adventure!.worlds.island.completedStages > 6 && (
                  <p>
                    Außerdem: {adventure!.worlds.island.completedStages - 6}{' '}
                    weitere Ausbaustufen.
                  </p>
                )}
              </InfoPanel>
            </div>
          </div>
          {!state.profileReady ? (
            <p>
              Speichere dein Lernprofil über „Dein Profil“ oben. Dann kannst du
              losrechnen und bauen.
            </p>
          ) : (
            <>
              <div className="adventure-workspace">
                <div className={`adventure-landscape ${world}`}>
                  <div className="adventure-scene-heading">
                    <h3>{structure}</h3>
                    <span>
                      {world === 'workshop'
                        ? `${designs.find((item) => item.id === sceneRobot!.design)?.name} · ${palettes.find((item) => item.id === sceneRobot!.palette)?.name}`
                        : `Deine Insel · Etappe ${structureIndex + 1}`}
                    </span>
                  </div>
                  <AdventureScene
                    world={world}
                    design={sceneRobot!.design}
                    palette={sceneRobot!.palette}
                    progress={progress!.stageAnswered}
                    completed={completed}
                  />
                  <div className="adventure-progress">
                    <div
                      className="adventure-progress-track"
                      role="progressbar"
                      aria-label="Geübte Aufgaben in dieser Bauetappe"
                      aria-valuemin={0}
                      aria-valuemax={8}
                      aria-valuenow={progress!.stageAnswered}
                    >
                      {Array.from({ length: 8 }, (_, index) => (
                        <span
                          key={index}
                          className={
                            index < progress!.stageAnswered ? 'is-built' : ''
                          }
                        />
                      ))}
                    </div>
                    <p>
                      {progress!.stageAnswered} von 8 Aufgaben geübt. Jeder
                      Versuch baut weiter.
                    </p>
                  </div>
                </div>
                <article
                  className="adventure-question"
                  aria-labelledby={
                    task ? 'multiplication-prompt' : 'adventure-stage-title'
                  }
                >
                  <p className="eyebrow">
                    {adventure!.review
                      ? 'STOLPERAUFGABEN · NOCH MAL IN RUHE'
                      : trainingLabel}
                  </p>
                  {task && (
                    <>
                      {!feedback && (
                        <p className="adventure-task-story">{story}</p>
                      )}
                      <h3 id="multiplication-prompt">
                        {task.left} × {task.right} = ?
                      </h3>
                      {!feedback ? (
                        <>
                          <form
                            onSubmit={(event) => {
                              event.preventDefault();
                              submit(answer);
                            }}
                          >
                            <label className="adventure-answer">
                              Dein Ergebnis
                              <input
                                ref={field}
                                inputMode="numeric"
                                maxLength={8}
                                autoComplete="off"
                                value={answer}
                                disabled={disabled}
                                aria-describedby="multiplication-help"
                                onChange={(event) =>
                                  setAnswer(event.target.value)
                                }
                              />
                            </label>
                            <p
                              className="adventure-answer-help"
                              id="multiplication-help"
                            >
                              Nur die Zahl. Mit Enter prüfen.
                            </p>
                            <button
                              className="primary-button"
                              type="submit"
                              disabled={disabled || !answer.trim()}
                            >
                              Antwort prüfen
                            </button>
                          </form>
                          <div className="adventure-actions">
                            <InfoPanel
                              key={`${state.mode}-${task.sequence}`}
                              returnFocusRef={field}
                            >
                              <summary>Zeig mir einen Rechentipp</summary>
                              <MultiplicationHint
                                left={task.left}
                                right={task.right}
                              />
                            </InfoPanel>
                            <button
                              className="secondary-button"
                              disabled={disabled}
                              onClick={() => submit(null)}
                            >
                              Lösung zeigen
                            </button>
                          </div>
                        </>
                      ) : (
                        <div
                          className={`adventure-feedback ${feedback.result.correct ? 'is-correct' : ''}`}
                        >
                          <h4 ref={heading} tabIndex={-1}>
                            {feedback.result.correct
                              ? 'Richtig! +1 Punkt'
                              : feedback.answer === null
                                ? 'Schauen wir uns die Lösung an'
                                : 'Noch nicht ganz – üben hilft!'}
                          </h4>
                          {feedback.answer !== null && (
                            <p>Deine Antwort: {feedback.answer}</p>
                          )}
                          <p className="adventure-solution">
                            {task.left} × {task.right} ={' '}
                            <strong>{feedback.result.solution}</strong>
                          </p>
                          <p>
                            {feedback.result.correct
                              ? 'Ein Lernpunkt für dich. Dein Bauwerk wächst!'
                              : 'Dein Bauwerk wächst trotzdem. Fehler kosten keine Punkte.'}
                          </p>
                          {!stageComplete && (
                            <button
                              className="primary-button"
                              disabled={disabled}
                              onClick={reloadState}
                            >
                              Nächste Aufgabe
                            </button>
                          )}
                          <InfoPanel>
                            <summary>Rechenweg ansehen</summary>
                            <MultiplicationHint
                              left={task.left}
                              right={task.right}
                            />
                            <p>
                              {parts!.rest
                                ? `${task.left} × ${task.right} = ${parts!.first} × ${task.right} + ${parts!.rest} × ${task.right} = ${parts!.first * task.right} + ${parts!.rest * task.right} = ${feedback.result.solution}`
                                : `${task.left} × ${task.right} = ${feedback.result.solution}`}
                            </p>
                          </InfoPanel>
                        </div>
                      )}
                    </>
                  )}
                  {stageComplete ? (
                    <div className="adventure-stage-complete">
                      <h3
                        id="adventure-stage-title"
                        ref={stageHeading}
                        tabIndex={-1}
                      >
                        {paused
                          ? 'Dein Bauwerk wartet auf dich.'
                          : 'Etappe geschafft!'}
                      </h3>
                      <p>
                        {paused
                          ? 'Mach eine Pause. Dein Fortschritt bleibt gespeichert – auch nach dem Schließen der App.'
                          : `${structure} ist fertig. Zeit zum Anschauen oder für eine kleine Pause.`}
                      </p>
                      <div className="adventure-actions">
                        <button
                          className="primary-button"
                          disabled={disabled}
                          onClick={() => configure({ continueStage: true })}
                        >
                          Weiterbauen
                        </button>
                        {!paused && (
                          <button
                            className="secondary-button"
                            disabled={disabled}
                            onClick={() => {
                              setPaused(true);
                              requestedFocus.current = 'task';
                            }}
                          >
                            Pause machen
                          </button>
                        )}
                      </div>
                    </div>
                  ) : (
                    !task && (
                      <>
                        <h3
                          id="adventure-stage-title"
                          ref={stageHeading}
                          tabIndex={-1}
                        >
                          Für jetzt geschafft!
                        </h3>
                        <p>
                          Diese Wiederholungsrunde ist geschafft. Schwierige
                          Aufgaben bleiben für später gespeichert. Du kannst
                          normal weiterbauen oder eine Pause machen.
                        </p>
                        <button
                          className="primary-button"
                          disabled={disabled}
                          onClick={() => configure({ review: false })}
                        >
                          Normal weiterüben
                        </button>
                      </>
                    )
                  )}
                </article>
              </div>
              <div className="adventure-actions">
                {adventure!.review ? (
                  <button
                    className="secondary-button"
                    disabled={disabled}
                    onClick={() => configure({ review: false })}
                  >
                    Zurück zu deinen Aufgaben
                  </button>
                ) : (
                  adventure!.reviewCount > 0 && (
                    <button
                      className="secondary-button"
                      disabled={disabled}
                      onClick={() => configure({ review: true })}
                    >
                      Stolperaufgaben üben · {adventure!.reviewCount}
                    </button>
                  )
                )}
                <InfoPanel>
                  <summary>So funktioniert deine Bauwelt</summary>
                  <p>
                    Jede Etappe hat acht Aufgaben. Auch eine falsche Antwort
                    oder „Lösung zeigen“ baut weiter. Du kannst jederzeit
                    aufhören; dein Stand bleibt auf diesem Gerät.
                  </p>
                  <p>
                    Jede richtig geprüfte neue Antwort gibt 1 Lernpunkt, auch
                    bei späteren Wiederholungen. Falsche Antworten und Aufdecken
                    geben 0 Punkte. Doppelte Übertragungen bringen keine
                    doppelten Punkte.
                  </p>
                  <p>
                    Stolperaufgaben sind Aufgaben, bei denen du noch geübt oder
                    die Lösung angesehen hast. Du entscheidest selbst, wann du
                    sie wiederholst.
                  </p>
                  <p>
                    Das 10er-Einmaleins übt die Reihen 1 bis 10. Quadratzahlen
                    entstehen, wenn du eine Zahl mit sich selbst malnimmst; hier
                    übst du 10² bis 20². Ergänzendes Grundlagentraining für
                    Mathematik 5, keine vollständige Lehrplanabdeckung.
                  </p>
                  <p>
                    {state.content.curriculumVersion}. Quelle:{' '}
                    {state.content.source}
                  </p>
                </InfoPanel>
              </div>
              <p className="adventure-summary">
                {state.answered} {state.answered === 1 ? 'Aufgabe' : 'Aufgaben'}{' '}
                geübt · {state.correct} richtig in dieser Rechenart · Alles
                bleibt auf deinem Gerät.
              </p>
            </>
          )}
        </>
      )}
      {settingsOpen && (
        <dialog
          ref={settingsDialog}
          className="info-dialog"
          aria-label="Dein Bauplan"
          onCancel={(event) => {
            event.preventDefault();
            closeSettings();
          }}
        >
          <div className="dialog-heading">
            <h2>Dein Bauplan</h2>
            <button className="secondary-button" onClick={closeSettings}>
              Schließen
            </button>
          </div>
          <div className="dialog-page adventure-settings">
            {errorNotice}
            <section>
              <h3>Was möchtest du üben?</h3>
              <div className="adventure-setting-options">
                <button
                  className="secondary-button"
                  disabled={disabled}
                  aria-pressed={draft.mode === 'tables'}
                  onClick={() => setDraft({ ...draft, mode: 'tables' })}
                >
                  10er-Einmaleins
                </button>
                <button
                  className="secondary-button"
                  disabled={disabled}
                  aria-pressed={draft.mode === 'squares'}
                  onClick={() => setDraft({ ...draft, mode: 'squares' })}
                >
                  Quadratzahlen · 10² bis 20²
                </button>
              </div>
              {draft.mode === 'tables' && (
                <label>
                  Deine Reihe
                  <select
                    disabled={disabled}
                    value={draft.table ?? 'mixed'}
                    onChange={(event) =>
                      setDraft({
                        ...draft,
                        table:
                          event.target.value === 'mixed'
                            ? null
                            : Number(event.target.value),
                      })
                    }
                  >
                    <option value="mixed">Gemischt · alle 100 Aufgaben</option>
                    {Array.from({ length: 10 }, (_, index) => (
                      <option key={index + 1} value={index + 1}>
                        {index + 1}er-Reihe
                      </option>
                    ))}
                  </select>
                </label>
              )}
            </section>
            <section>
              <h3>Dein Roboter</h3>
              <div className="adventure-design-options">
                {designs.map((design) => (
                  <button
                    key={design.id}
                    aria-label={design.name}
                    className="secondary-button"
                    disabled={disabled}
                    aria-pressed={draft.design === design.id}
                    onClick={() => setDraft({ ...draft, design: design.id })}
                  >
                    <RobotPortrait design={design.id} palette={draft.palette} />
                    <span>{design.name}</span>
                  </button>
                ))}
              </div>
            </section>
            <section>
              <h3>Deine Farben</h3>
              <div className="adventure-setting-options">
                {palettes.map((palette) => (
                  <button
                    key={palette.id}
                    className="secondary-button"
                    disabled={disabled}
                    aria-pressed={draft.palette === palette.id}
                    onClick={() => setDraft({ ...draft, palette: palette.id })}
                  >
                    <span
                      className="adventure-palette-swatch"
                      style={{ background: palette.color }}
                      aria-hidden="true"
                    />
                    {palette.name}
                  </button>
                ))}
              </div>
            </section>
            <p>
              Deine fertigen Roboter behalten ihre Farben. Änderungen gelten für
              {stageComplete
                ? ' das nächste Bauwerk.'
                : ' das aktuelle Bauwerk.'}{' '}
              Den Fortschritt verlierst du dabei nicht.
            </p>
            <button
              className="primary-button"
              disabled={disabled}
              onClick={() => configure({ ...draft, review: false })}
            >
              Bauplan speichern
            </button>
          </div>
        </dialog>
      )}
    </section>
  );
}
