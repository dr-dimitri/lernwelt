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
    : 'Dein Tastengarten konnte nicht geladen oder gespeichert werden. Versuche es noch einmal.';

function GardenPlant({ growth, index }: { growth: number; index: number }) {
  const colors = ['#bb6298', '#dc9459', '#7f75b2', '#6ba28c'];
  const color = colors[index % colors.length];
  return (
    <svg viewBox="0 0 100 104" aria-hidden="true" className="typing-plant">
      <ellipse cx="50" cy="94" rx="32" ry="5" fill="#dce6d8" />
      <path d="M24 75h52l-7 23H31Z" fill="#d6a07f" />
      <path d="M22 73h56v8H22Z" fill="#efbb98" />
      <ellipse cx="50" cy="73" rx="26" ry="4" fill="#80644f" />
      {growth === 0 ? (
        <path d="M46 72q4-13 9-8q3 8-9 8Z" fill="#f9d991" />
      ) : (
        <g className="typing-sprout">
          <path
            d={`M50 73Q${index % 2 ? 54 : 46} 54 50 ${growth === 1 ? 50 : 30}`}
            fill="none"
            stroke="#568769"
            strokeWidth="4"
            strokeLinecap="round"
          />
          <path d="M49 63Q23 62 26 45q23 0 23 18Z" fill="#7fab79" />
          <path d="M51 57q24-2 23-18q-22 0-23 18Z" fill="#99bd83" />
          {growth >= 2 && (
            <path d="M50 44Q32 42 33 31q17 0 17 13Z" fill="#7fab79" />
          )}
          {growth === 2 && (
            <ellipse cx="50" cy="27" rx="8" ry="11" fill={color} />
          )}
          {growth >= 3 && (
            <g fill={color}>
              {[0, 60, 120, 180, 240, 300].map((angle) => (
                <ellipse
                  key={angle}
                  cx="50"
                  cy="15"
                  rx={index % 2 ? 7 : 9}
                  ry="12"
                  transform={`rotate(${angle} 50 28)`}
                />
              ))}
              <circle cx="50" cy="28" r="9" fill="#f9d991" />
              <circle cx="47" cy="27" r="1.1" fill="#6c6041" />
              <circle cx="53" cy="27" r="1.1" fill="#6c6041" />
              <path
                d="M47 31q3 3 6 0"
                fill="none"
                stroke="#6c6041"
                strokeWidth="1.3"
              />
            </g>
          )}
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

  const growth = station && state ? solvedLines(station, state.difficulty) : 0;
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
          <p className="eyebrow">TASTE FÜR TASTE WÄCHST DEIN GARTEN</p>
          <h2 id="typing-title" ref={heading} tabIndex={-1}>
            Dein Tastengarten
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
        <p>Tippe in Ruhe. Drei Zeilen, eine Blume.</p>
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
            Wähle jedes Beet und jede Stufe frei. Eine neue richtige Zeile
            bringt 1 Punkt in Vorschule, 2 in Könner oder 3 in Streber.
            Wiederholen gibt keine neuen Punkte. Fehler kosten nichts.
          </p>
        </InfoPanel>
      </div>
      {busy && (
        <p role="status">Dein Tastengarten wird geladen oder gespeichert …</p>
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
              Tastengarten neu laden
            </button>
          </div>
        </div>
      )}
      {state && !state.profileReady && (
        <p>
          Speichere dein Lernprofil über „Dein Profil“ oben. Dann kannst du
          tippen und deinen Garten wachsen lassen.
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
            <nav className="typing-garden" aria-label="Deine zwölf Beete">
              <h3>Wähle dein Beet</h3>
              <p>Alle Beete sind offen.</p>
              <div className="typing-stations">
                {state.stations.map((item, index) => (
                  <button
                    key={item.id}
                    className="typing-station"
                    aria-pressed={item.id === station?.id}
                    aria-label={`${index + 1}. ${item.title} · ${solvedLines(item, state.difficulty)} von 3 Zeilen geschafft`}
                    title={item.title}
                    disabled={disabled}
                    onClick={() => selectLine(item.id)}
                  >
                    <GardenPlant
                      growth={solvedLines(item, state.difficulty)}
                      index={index}
                    />
                    <span>
                      <strong>Beet {index + 1}</strong>
                      <small className="typing-station-keys">
                        {stationKeys(item)}
                      </small>
                      <small>{solvedLines(item, state.difficulty)} / 3</small>
                    </span>
                  </button>
                ))}
              </div>
            </nav>
            {station && task ? (
              <div className="typing-exercise">
                <div className="typing-station-heading">
                  <div>
                    <p className="eyebrow">
                      DEIN BEET · {growth} VON 3 ZEILEN GESCHAFFT
                    </p>
                    <h3>{station.title}</h3>
                    <p>{station.description}</p>
                  </div>
                  <GardenPlant
                    growth={growth}
                    index={state.stations.indexOf(station)}
                  />
                </div>
                <div className="typing-keys-intro">
                  <strong>Diese Tasten:</strong> {station.newKeys.join(' · ')}
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
                          : growth === 3
                            ? 'Deine Blume blüht! Wähle ein neues Beet oder übe hier weiter.'
                            : 'Deine Pflanze wächst. Nimm dir die nächste Zeile vor, wenn du magst.'
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
                Für diese Stufe sind gerade keine Zeilen verfügbar. Lade den
                Tastengarten neu.
              </p>
            )}
          </div>
        </>
      )}
    </section>
  );
}
