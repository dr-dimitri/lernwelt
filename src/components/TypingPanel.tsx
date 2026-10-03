import { useEffect, useRef, useState } from 'react';
import InfoPanel from './InfoPanel';
import { difficulties, type Difficulty } from '../domain/learning';
import {
  typingKeyboardRows,
  typingKeyHint,
  typingProgress,
  type TypingInput,
  type TypingResult,
  type TypingState,
  type TypingStation,
} from '../domain/typing';
import { desktop } from '../lib/desktop';
import '../typing.css';

type Pending =
  | { kind: 'answer'; input: TypingInput }
  | { kind: 'difficulty'; difficulty: Difficulty };
const message = (reason: unknown) =>
  reason instanceof Error
    ? reason.message
    : 'Deine Weltraumreise konnte nicht geladen oder gespeichert werden. Versuche es noch einmal.';

const missionStages = [
  'Bereit zum Start',
  'Signal empfangen',
  'Kurs bestätigt',
  'Sektor erkundet',
];

function MissionOrbit({
  completed,
  index,
  compact = false,
}: {
  completed: number;
  index: number;
  compact?: boolean;
}) {
  const colors = ['#8bb9ca', '#aaa8d6', '#8fbdb6', '#c7af95'];
  return (
    <svg
      viewBox="0 0 88 88"
      className={`typing-orbit${compact ? ' compact' : ''}`}
      aria-hidden={compact || undefined}
      role={compact ? undefined : 'img'}
      aria-label={
        compact
          ? undefined
          : `${missionStages[completed]} · ${completed} von 3 Zeilen bestätigt`
      }
    >
      <circle cx="44" cy="44" r="34" className="typing-orbit-track" />
      {[0, 120, 240].map((angle, segment) => (
        <path
          key={angle}
          d="M44 10A34 34 0 0 1 77.48 49.9"
          transform={`rotate(${angle} 44 44)`}
          className={`typing-orbit-segment${segment < completed ? ' complete' : ''}`}
        />
      ))}
      <circle
        cx="44"
        cy="44"
        r="20"
        fill={colors[index % colors.length]}
        opacity="0.13"
      />
      <ellipse
        cx="44"
        cy="44"
        rx="27"
        ry="11"
        transform={`rotate(${index % 2 ? -28 : 28} 44 44)`}
        className="typing-orbit-ring"
      />
      {compact ? (
        <>
          <circle cx="44" cy="44" r="11" fill={colors[index % colors.length]} />
          <path
            d="M37 42q7-5 15 0m-12 7q5-3 10-1"
            className="typing-planet-lines"
          />
        </>
      ) : (
        <g className="typing-ship">
          <path d="m44 24 8 18 13 16-15-4-6 8-6-8-15 4 13-16Z" />
          <path d="M44 31v22m-7-8 7 4 7-4m-13 9 2-13m10 13-2-13" />
          <path d="M41 66v6m6-6v6" className="typing-ship-engine" />
        </g>
      )}
    </svg>
  );
}

function solvedLines(station: TypingStation, difficulty: Difficulty) {
  return station.tasks.filter(
    (task) => task.difficulty === difficulty && task.solved,
  ).length;
}

function stationKeys(station: TypingStation) {
  const letters = station.newKeys.filter((key) => key.length === 1);
  return letters.length > 3
    ? `${letters[0]} … ${letters[letters.length - 1]}`
    : letters.join(' · ');
}

export default function TypingPanel({
  profileVersion,
}: {
  profileVersion: number;
}) {
  const [state, setState] = useState<TypingState | null>(null);
  const [stationId, setStationId] = useState('');
  const [taskId, setTaskId] = useState('');
  const [answer, setAnswer] = useState('');
  const [feedback, setFeedback] = useState<TypingResult | null>(null);
  const [pending, setPending] = useState<Pending | null>(null);
  const [busy, setBusy] = useState(true);
  const [error, setError] = useState('');
  const [notice, setNotice] = useState('');
  const [reload, setReload] = useState(0);
  const [showKeyboard, setShowKeyboard] = useState(false);
  const revision = useRef(0);
  const inFlight = useRef(false);
  const composing = useRef(false);
  const field = useRef<HTMLInputElement>(null);
  const feedbackHeading = useRef<HTMLHeadingElement>(null);
  const heading = useRef<HTMLHeadingElement>(null);
  const errorBox = useRef<HTMLDivElement>(null);
  const focusRequested = useRef<'input' | 'feedback' | 'error' | null>(null);

  useEffect(() => {
    const current = ++revision.current;
    inFlight.current = true;
    setBusy(true);
    setState(null);
    setTaskId('');
    setAnswer('');
    setFeedback(null);
    setPending(null);
    setError('');
    setNotice('');
    void desktop
      .getTypingState()
      .then((value) => {
        if (current === revision.current) setState(value);
      })
      .catch((reason: unknown) => {
        if (current === revision.current) {
          setError(message(reason));
          focusRequested.current = 'error';
        }
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
    if (busy) return;
    const requested = focusRequested.current;
    focusRequested.current = null;
    if (requested === 'error') errorBox.current?.focus();
    else if (requested === 'feedback') feedbackHeading.current?.focus();
    else if (requested === 'input') (field.current ?? heading.current)?.focus();
  }, [busy, state, stationId, taskId, feedback, error]);

  const station =
    state?.stations.find((item) => item.id === stationId) ?? state?.stations[0];
  const tasks =
    station?.tasks.filter((task) => task.difficulty === state?.difficulty) ??
    [];
  const task =
    tasks.find((item) => item.id === taskId) ??
    tasks.find((item) => !item.solved) ??
    tasks[0];
  const taskIndex = tasks.findIndex((item) => item.id === task?.id);
  const disabled = busy || !!pending;
  const progress = typingProgress(task?.text ?? '', answer);
  const hint = typingKeyHint(progress.next);

  function reloadState() {
    if (inFlight.current) return;
    inFlight.current = true;
    setBusy(true);
    focusRequested.current = 'input';
    setReload((value) => value + 1);
  }

  async function perform(request: Pending) {
    if (inFlight.current || !state?.profileReady) return;
    const current = revision.current;
    inFlight.current = true;
    setBusy(true);
    setPending(request);
    setError('');
    setNotice('');
    try {
      if (request.kind === 'answer') {
        const result = await desktop.submitTyping(request.input);
        if (current !== revision.current) return;
        setState(
          (value) =>
            value && {
              ...value,
              wallet: result.wallet,
              stations: value.stations.map((item) => ({
                ...item,
                tasks: item.tasks.map((line) =>
                  line.id === request.input.taskId && result.correct
                    ? { ...line, solved: true }
                    : line,
                ),
              })),
            },
        );
        // Keep this exact line selected even when its first solution changes the default.
        setTaskId(request.input.taskId);
        setFeedback(result);
        focusRequested.current = 'feedback';
      } else {
        await desktop.setDifficulty(request.difficulty);
        if (current !== revision.current) return;
        const next = await desktop.getTypingState();
        if (current !== revision.current) return;
        setState(next);
        setTaskId('');
        setAnswer('');
        setFeedback(null);
        focusRequested.current = 'input';
      }
      setPending(null);
    } catch (reason) {
      if (current === revision.current) {
        setError(message(reason));
        focusRequested.current = 'error';
      }
    } finally {
      if (current === revision.current) {
        inFlight.current = false;
        setBusy(false);
      }
    }
  }

  function selectLine(nextStationId: string, nextTaskId = '') {
    if (inFlight.current || pending) return;
    ++revision.current;
    setStationId(nextStationId);
    setTaskId(nextTaskId);
    setAnswer('');
    setFeedback(null);
    setError('');
    setNotice('');
    focusRequested.current = 'input';
    field.current?.focus();
  }

  function nextLine() {
    if (!state || !station) return;
    if (taskIndex < tasks.length - 1)
      selectLine(station.id, tasks[taskIndex + 1].id);
    else {
      const next =
        state.stations[
          (state.stations.indexOf(station) + 1) % state.stations.length
        ];
      if (next) selectLine(next.id);
    }
  }

  function submit() {
    if (
      inFlight.current ||
      pending ||
      !state?.profileReady ||
      !task ||
      !answer.length ||
      feedback?.correct ||
      composing.current
    )
      return;
    if (Array.from(answer).length > 120) {
      setNotice(
        'Deine Zeile ist zu lang. Tippe höchstens 120 Zeichen. Du kannst deine Eingabe jetzt verbessern.',
      );
      field.current?.focus();
      return;
    }
    if (/[\u0000-\u001f\u007f-\u009f]/u.test(answer)) {
      setNotice(
        'Entferne den Zeilenumbruch oder das unsichtbare Zeichen. Tippe nur Buchstaben, Zahlen, Satzzeichen und Leerzeichen.',
      );
      field.current?.focus();
      return;
    }
    void perform({
      kind: 'answer',
      input: { requestId: crypto.randomUUID(), taskId: task.id, answer },
    });
  }

  function explainTyping(event: { preventDefault: () => void }) {
    event.preventDefault();
    setNotice(
      'Tippe selbst, damit deine Finger die Tasten kennenlernen. Einfügen und Ziehen sind hier ausgeschaltet.',
    );
    field.current?.focus();
  }

  const completed =
    station && state ? solvedLines(station, state.difficulty) : 0;
  const points =
    state?.difficulty === 'vorschule'
      ? 1
      : state?.difficulty === 'streber'
        ? 3
        : 2;
  return (
    <section
      className="detail-panel typing-panel"
      aria-labelledby="typing-title"
      aria-busy={busy}
    >
      <div className="section-heading typing-topbar">
        <div>
          <p className="eyebrow">MISSIONSKONSOLE · TASTSCHREIBEN</p>
          <h2 id="typing-title" ref={heading} tabIndex={-1}>
            Weltraumreise
          </h2>
        </div>
        {state && (
          <div className="points-balance" aria-label="Verfügbare Lernpunkte">
            {state.wallet.balance}{' '}
            {state.wallet.balance === 1 ? 'Punkt' : 'Punkte'}
          </div>
        )}
      </div>
      <div className="typing-intro">
        <p>Präzision vor Tempo. Erkunde zwölf Sektoren mit deiner Tastatur.</p>
        <InfoPanel>
          <summary>So fängst du an</summary>
          <ol>
            <li>Setz dich bequem hin. Lass Schultern und Hände locker.</li>
            <li>
              Fühle die kleinen Erhebungen auf F und J. Dort liegen deine
              Zeigefinger. Die anderen Finger ruhen auf A S D und K L Ö.
            </li>
            <li>
              Tippe mit dem passenden Finger. Komm danach wieder zu deiner
              Starttaste zurück. Ein Daumen drückt die Leertaste.
            </li>
            <li>
              Schau öfter auf die Zeile am Bildschirm. Du darfst jederzeit auf
              die Tastatur schauen und die Tastaturhilfe einschalten.
            </li>
          </ol>
          <p>
            Für einen großen Buchstaben hältst du die Umschalttaste (Shift) mit
            der anderen Hand. Tippe den Buchstaben, dann lass Shift wieder los.
          </p>
          <p>
            Die Hilfe zeigt eine deutsche QWERTZ-Tastatur. Auf manchen Geräten
            sind die Tasten etwas anders geformt.
          </p>
          <p>
            Mach nach ein paar Zeilen eine Pause: Hände ausschütteln, strecken,
            aus dem Fenster schauen.
          </p>
          <p>
            Wähle jeden Sektor und jede Stufe frei. Eine neue richtige Zeile
            bringt 1 Punkt in Vorschule, 2 in Könner oder 3 in Streber.
            Wiederholen gibt keine neuen Punkte. Fehler kosten nichts.
          </p>
        </InfoPanel>
      </div>
      {busy && (
        <p role="status">Deine Weltraumreise wird geladen oder gespeichert …</p>
      )}
      {error && (
        <div
          role="alert"
          ref={errorBox}
          tabIndex={-1}
          className="error-message typing-error"
        >
          <p>{error}</p>
          <div className="typing-actions">
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
              Weltraumreise neu laden
            </button>
          </div>
        </div>
      )}
      {state && !state.profileReady && (
        <p>
          Speichere dein Lernprofil über „Dein Profil“ oben. Dann kannst du
          tippen und deine Missionen speichern.
        </p>
      )}
      {state?.profileReady && (
        <>
          <div
            className="typing-levels"
            role="group"
            aria-label="Schwierigkeitsgrad für alle Fächer"
          >
            {difficulties.map((level) => (
              <button
                key={level.id}
                className="secondary-button"
                aria-pressed={state.difficulty === level.id}
                disabled={disabled}
                onClick={() => {
                  if (level.id !== state.difficulty)
                    void perform({ kind: 'difficulty', difficulty: level.id });
                }}
              >
                {level.name}
              </button>
            ))}
            <span>
              Neue Zeile: +{points} {points === 1 ? 'Punkt' : 'Punkte'}
            </span>
          </div>
          <div className="typing-workspace">
            <nav
              className="typing-star-map"
              aria-label="Sternenkarte: zwölf frei wählbare Sektoren"
            >
              <div className="typing-map-heading">
                <h3>Sternenkarte</h3>
                <span aria-hidden="true">12 SEKT.</span>
              </div>
              <p>Drei Zeilen pro Sektor. Freie Kurswahl.</p>
              <div className="typing-stations">
                <svg
                  className="typing-map-routes"
                  viewBox="0 0 200 350"
                  preserveAspectRatio="none"
                  aria-hidden="true"
                >
                  <path d="M45 25H155L45 85H155L45 145H155L45 205H155L45 265H155L45 325H155" />
                </svg>
                {state.stations.map((item, index) => (
                  <button
                    key={item.id}
                    className="typing-station"
                    aria-pressed={item.id === station?.id}
                    aria-label={`Sektor ${index + 1}: ${item.title} · ${solvedLines(item, state.difficulty)} von 3 Zeilen bestätigt`}
                    title={item.title}
                    disabled={disabled}
                    onClick={() => selectLine(item.id)}
                  >
                    <MissionOrbit
                      completed={solvedLines(item, state.difficulty)}
                      index={index}
                      compact
                    />
                    <span>
                      <strong>S{String(index + 1).padStart(2, '0')}</strong>
                      <small className="typing-station-keys">
                        {stationKeys(item)}
                      </small>
                      <small>{solvedLines(item, state.difficulty)} / 3</small>
                    </span>
                  </button>
                ))}
              </div>
              <p className="typing-map-legend">
                Ein heller Orbitabschnitt = eine bestätigte Zeile.
              </p>
            </nav>
            {station && task ? (
              <div className="typing-exercise">
                <div className="typing-station-heading">
                  <div>
                    <p className="eyebrow">
                      SEKTOR{' '}
                      {String(state.stations.indexOf(station) + 1).padStart(
                        2,
                        '0',
                      )}{' '}
                      · {completed} VON 3 ZEILEN BESTÄTIGT
                    </p>
                    <h3>{station.title}</h3>
                    <p>{station.description}</p>
                  </div>
                  <MissionOrbit
                    completed={completed}
                    index={state.stations.indexOf(station)}
                  />
                </div>
                <div className="typing-keys-intro">
                  <span>
                    <strong>Diese Tasten:</strong> {station.newKeys.join(' · ')}
                  </span>
                  <span className="typing-mission-status">
                    <span>{missionStages[completed]}</span>
                    <span className="typing-mission-meter" aria-hidden="true">
                      {[0, 1, 2].map((segment) => (
                        <span
                          key={segment}
                          className={segment < completed ? 'complete' : ''}
                        />
                      ))}
                    </span>
                  </span>
                </div>
                <div
                  className="typing-lines"
                  role="group"
                  aria-label="Zeile wählen"
                >
                  {tasks.map((line, index) => (
                    <button
                      key={line.id}
                      className="secondary-button"
                      disabled={disabled}
                      aria-pressed={line.id === task.id}
                      aria-label={`Zeile ${index + 1}${line.solved ? ' · geschafft' : ''}`}
                      onClick={() => selectLine(station.id, line.id)}
                    >
                      {line.solved && <span aria-hidden="true">✓ </span>}Zeile{' '}
                      {index + 1}
                    </button>
                  ))}
                </div>
                <form
                  onSubmit={(event) => {
                    event.preventDefault();
                    submit();
                  }}
                >
                  <p className="typing-question">Tippe diese Zeile genau ab:</p>
                  <p className="typing-prompt" id="typing-target">
                    <span className="typing-sr-only">{task.text}</span>
                    <span aria-hidden="true">
                      {Array.from(task.text).map((character, index) => (
                        <span
                          key={index}
                          className={
                            index < progress.prefix
                              ? 'typed'
                              : index === progress.prefix
                                ? `next${progress.mistake ? ' mistake' : ''}`
                                : ''
                          }
                        >
                          {character === ' ' ? (
                            <span className="typing-space">␣</span>
                          ) : (
                            character
                          )}
                        </span>
                      ))}
                    </span>
                  </p>
                  <label htmlFor="typing-answer">Deine Zeile</label>
                  <input
                    id="typing-answer"
                    ref={field}
                    value={answer}
                    maxLength={120}
                    autoComplete="off"
                    autoCapitalize="off"
                    autoCorrect="off"
                    spellCheck={false}
                    aria-describedby="typing-target typing-input-tip"
                    disabled={disabled || !!feedback?.correct}
                    onChange={(event) => {
                      setAnswer(event.target.value);
                      setFeedback(null);
                      setNotice('');
                    }}
                    onCompositionStart={() => {
                      composing.current = true;
                    }}
                    onCompositionEnd={() => {
                      composing.current = false;
                    }}
                    onKeyDown={(event) => {
                      if (
                        event.key === 'Enter' &&
                        (event.nativeEvent.isComposing ||
                          composing.current ||
                          event.nativeEvent.keyCode === 229)
                      )
                        event.preventDefault();
                    }}
                    onPaste={explainTyping}
                    onDrop={explainTyping}
                  />
                  <p id="typing-input-tip" className="typing-input-tip">
                    ␣ bedeutet ein Leerzeichen. Achte auf Groß und Klein.
                    Verbessere mit der Rücktaste (⌫).
                  </p>
                  {progress.mistake && !feedback && (
                    <p className="typing-correction">
                      {progress.next === null
                        ? 'Die Zeile ist schon vollständig. Entferne die Zeichen dahinter mit der Rücktaste.'
                        : `Schau bei Zeichen ${progress.prefix + 1}: Dort steht ${progress.next === ' ' ? 'ein Leerzeichen' : `„${progress.next}“`}. Du kannst in deiner Eingabe zurückgehen und verbessern.`}
                    </p>
                  )}
                  {notice && (
                    <p role="status" className="typing-notice">
                      {notice}
                    </p>
                  )}
                  <div className="typing-actions">
                    <button
                      className="primary-button"
                      type="submit"
                      disabled={
                        disabled || !answer.length || !!feedback?.correct
                      }
                    >
                      Zeile prüfen
                    </button>
                    <button
                      className="secondary-button"
                      type="button"
                      aria-pressed={showKeyboard}
                      onClick={() => setShowKeyboard((value) => !value)}
                    >
                      Tastaturhilfe {showKeyboard ? 'ausblenden' : 'einblenden'}
                    </button>
                  </div>
                </form>
                {feedback && (
                  <div
                    className={`typing-feedback ${feedback.correct ? 'correct' : ''}`}
                  >
                    <h4 ref={feedbackHeading} tabIndex={-1}>
                      {feedback.correct
                        ? feedback.pointsAwarded
                          ? `Geschafft! +${feedback.pointsAwarded} ${feedback.pointsAwarded === 1 ? 'Punkt' : 'Punkte'}`
                          : 'Geschafft! Gut wiederholt.'
                        : 'Fast! Du kannst die Zeile noch verbessern.'}
                    </h4>
                    <p>
                      {feedback.correct
                        ? feedback.pointsAwarded === 0
                          ? 'Diese Zeile hast du schon geschafft. Du kannst weiterüben oder eine neue Zeile wählen.'
                          : completed === 3
                            ? 'Sektor erkundet: Alle drei Zeilen sind bestätigt. Wähle einen neuen Kurs oder übe hier weiter.'
                            : 'Zeile bestätigt. Dein Missionsfortschritt ist gespeichert. Du kannst mit der nächsten Zeile weitermachen.'
                        : 'Vergleiche deine Eingabe mit der Zeile darüber. Fehler kosten keine Punkte.'}
                    </p>
                    {feedback.correct && (
                      <div className="typing-actions">
                        <button className="primary-button" onClick={nextLine}>
                          Nächste Zeile
                        </button>
                        <button
                          className="secondary-button"
                          onClick={() => selectLine(station.id, task.id)}
                        >
                          Noch einmal üben
                        </button>
                      </div>
                    )}
                  </div>
                )}
                {showKeyboard && (
                  <div className="typing-keyboard-help">
                    <p className="typing-key-hint">
                      {feedback?.correct ? (
                        'Diese Zeile ist geschafft. Wähle die nächste Zeile oder übe sie noch einmal.'
                      ) : progress.mistake && progress.next === null ? (
                        'Nächste Taste: Rücktaste (⌫) – entferne die zusätzlichen Zeichen.'
                      ) : hint ? (
                        <>
                          {progress.mistake ? 'Zu verbessern' : 'Nächste Taste'}
                          : <strong>{hint.label}</strong> · {hint.finger}
                          {hint.shift && (
                            <>
                              . Halte dazu die{' '}
                              {hint.shift === 'left' ? 'linke' : 'rechte'}{' '}
                              Umschalttaste (Shift).
                            </>
                          )}
                        </>
                      ) : (
                        'Alle Zeichen sind da. Prüfe deine Zeile, wenn du bereit bist.'
                      )}
                    </p>
                    <div
                      className="typing-keyboard-scroll"
                      role="region"
                      aria-label="Deutsche QWERTZ-Tastatur als Hilfe"
                      tabIndex={0}
                    >
                      <div className="typing-keyboard" aria-hidden="true">
                        {typingKeyboardRows.map((row, index) => (
                          <div className="typing-keyboard-row" key={index}>
                            {row.map((key) => (
                              <span
                                key={key}
                                className={`typing-key ${key === 'space' ? 'space' : key.startsWith('shift') ? 'shift' : key === 'backspace' ? 'backspace' : ''}${hint?.key === key || (hint?.shift && key === `shift-${hint.shift}`) || (progress.mistake && !progress.next && key === 'backspace') ? ' highlighted' : ''}${key === 'f' || key === 'j' ? ' home' : ''}`}
                              >
                                {key === 'space'
                                  ? 'Leertaste'
                                  : key.startsWith('shift')
                                    ? '⇧ Shift'
                                    : key === 'backspace'
                                      ? '⌫'
                                      : key === 'ß'
                                        ? 'ß'
                                        : key.toLocaleUpperCase('de')}
                              </span>
                            ))}
                          </div>
                        ))}
                      </div>
                    </div>
                    <p>
                      {station.tip} Die Bildschirmtasten sind Hinweise. Tippe
                      auf deiner echten Tastatur.
                    </p>
                  </div>
                )}
              </div>
            ) : (
              <p>
                Für diese Stufe sind gerade keine Zeilen verfügbar. Lade die
                Weltraumreise neu.
              </p>
            )}
          </div>
        </>
      )}
    </section>
  );
}
