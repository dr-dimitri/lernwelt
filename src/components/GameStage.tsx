import InfoPanel from './InfoPanel';
import { useEffect, useRef, useState } from 'react';
import type { GameId } from '../domain/arcade';
import { gameDefinition } from '../domain/arcade';
import {
  actGame,
  createGame,
  hitChicken,
  pointAt,
  stepGame,
  type Action,
} from '../games/engine';
import { drawGame } from '../games/draw';
import { prepareCanvas } from '../games/canvas';
import { gameProgress } from '../games/progress';

export default function GameStage({
  gameId,
  onFinish,
}: {
  gameId: GameId;
  onFinish: (score: number) => void;
}) {
  const [game] = useState(() => createGame(gameId));
  const canvas = useRef<HTMLCanvasElement>(null);
  const area = useRef<HTMLDivElement>(null);
  const held = useRef(new Set<Action>());
  const taps = useRef(new Map<Action, ReturnType<typeof setTimeout>>());
  const keyboardStarted = useRef(new Map<Action, number>());
  const repeatAt = useRef(new Map<Action, number>());
  function release(action: Action) {
    keyboardStarted.current.delete(action);
    clearTimeout(taps.current.get(action));
    taps.current.delete(action);
    held.current.delete(action);
    repeatAt.current.delete(action);
  }
  function clearControls() {
    for (const timer of taps.current.values()) clearTimeout(timer);
    taps.current.clear();
    keyboardStarted.current.clear();
    held.current.clear();
    repeatAt.current.clear();
  }
  const ended = useRef(false);
  const [paused, setPaused] = useState(true);
  const [started, setStarted] = useState(false);
  const [reducedMotion, setReducedMotion] = useState(
    () =>
      window.matchMedia?.('(prefers-reduced-motion: reduce)').matches ?? false,
  );
  const snapshot = () => ({
    score: game.score,
    lives: game.lives,
    over: game.over,
    won: game.won,
    progress: gameProgress(game),
    feedback: game.feedback.ttl > 0 ? game.feedback.text : '',
    feedbackSerial: game.feedback.serial,
    chickenHits: [...game.chickenHits],
  });
  const [hud, setHud] = useState(snapshot);
  const definition = gameDefinition(gameId);
  const finishRef = useRef(onFinish);
  useEffect(() => {
    finishRef.current = onFinish;
  }, [onFinish]);
  useEffect(() => {
    const preference = window.matchMedia?.('(prefers-reduced-motion: reduce)');
    const update = () => setReducedMotion(preference?.matches ?? false);
    preference?.addEventListener('change', update);
    return () => preference?.removeEventListener('change', update);
  }, []);
  useEffect(() => {
    const pause = () => {
      clearControls();
      setPaused(true);
    };
    const visibility = () => {
      if (document.hidden) pause();
    };
    window.addEventListener('blur', pause);
    document.addEventListener('visibilitychange', visibility);
    return () => {
      clearControls();
      window.removeEventListener('blur', pause);
      document.removeEventListener('visibilitychange', visibility);
    };
  }, []);
  useEffect(() => {
    let frame = 0,
      previous = 0,
      hudClock = 0;
    const paint = () => {
      const context = canvas.current ? prepareCanvas(canvas.current) : null;
      if (context) drawGame(context, game, reducedMotion);
    };
    const tick = (time: number) => {
      const dt = previous ? Math.min((time - previous) / 1000, 0.04) : 0;
      previous = time;
      if (!paused && !game.over) {
        stepGame(game, dt, held.current);
        for (const [action, nextRepeat] of repeatAt.current) {
          if (time >= nextRepeat) {
            actGame(game, action);
            repeatAt.current.set(action, time + 120);
          }
        }
      }
      paint();
      hudClock += dt;
      if (paused || hudClock >= 0.1 || game.over) {
        setHud(snapshot());
        hudClock = 0;
      }
      if (game.over && !ended.current) {
        ended.current = true;
        finishRef.current(game.score);
      }
      if (!game.over && !paused) frame = requestAnimationFrame(tick);
    };
    window.addEventListener('resize', paint);
    frame = requestAnimationFrame(tick);
    return () => {
      cancelAnimationFrame(frame);
      window.removeEventListener('resize', paint);
    };
  }, [game, gameId, paused, reducedMotion]);
  function press(action: Action) {
    if (paused || game.over) return;
    release(action);
    held.current.add(action);
    actGame(game, action);
    if (gameId === 'blocks' && ['left', 'right', 'down'].includes(action)) {
      repeatAt.current.set(action, performance.now() + 120);
    }
  }
  function togglePause() {
    clearControls();
    setStarted(true);
    setPaused(!paused);
    area.current?.focus({ preventScroll: true });
  }
  function end() {
    clearControls();
    game.over = true;
    setHud(snapshot());
    if (!ended.current) {
      ended.current = true;
      finishRef.current(game.score);
    }
  }
  const keyAction = (key: string): Action | undefined =>
    (
      ({
        ArrowLeft: 'left',
        ArrowRight: 'right',
        ArrowDown: 'down',
        ArrowUp:
          gameId === 'blocks'
            ? 'rotate'
            : gameId === 'maze'
              ? 'forward'
              : 'jump',
        ...(gameId === 'maze'
          ? { w: 'forward', s: 'down', a: 'left', d: 'right' }
          : {}),
        ' ':
          gameId === 'blocks' ? 'drop' : gameId === 'runner' ? 'jump' : 'fire',
      }) as Record<string, Action>
    )[key.length === 1 ? key.toLowerCase() : key];
  const controls: [Action, string][] =
    gameId === 'blocks'
      ? [
          ['left', '← Links'],
          ['rotate', '↻ Drehen'],
          ['right', 'Rechts →'],
          ['down', '↓ Senken'],
          ['drop', 'Ablegen'],
        ]
      : gameId === 'maze'
        ? [
            ['left', '↶ Drehen'],
            ['forward', '↑ Vorwärts'],
            ['fire', '◎ Blasen'],
            ['down', '↓ Zurück'],
            ['right', 'Drehen ↷'],
          ]
        : gameId === 'runner'
          ? [
              ['left', 'Bremsen'],
              ['jump', '↑ Springen'],
              ['right', 'Schneller'],
            ]
          : [
              ['left', '← Links'],
              ['fire', '✦ Lichtblitz'],
              ['right', 'Rechts →'],
            ];
  return (
    <section
      className={`game-stage arcade-${gameId}`}
      aria-labelledby="game-title"
    >
      <div className="section-heading">
        <div className="game-heading">
          <span className="game-emblem" aria-hidden="true">
            {definition.icon}
          </span>
          <div>
            <p className="eyebrow">{definition.theme}</p>
            <h3 id="game-title">{definition.name}</h3>
          </div>
        </div>
        <span className="game-paid-note">Deine Runde ist bezahlt</span>
      </div>
      <InfoPanel className="game-instructions">
        <summary>Steuerung & Spielziel</summary>
        <p id="game-instructions">
          {definition.instructions} P pausiert das Spiel.
        </p>
      </InfoPanel>
      <div className="game-hud">
        <strong>{hud.score} Spielpunkte</strong>
        {(gameId === 'runner' || gameId === 'space' || gameId === 'maze') && (
          <span aria-label={`${hud.lives} Herzen`}>
            {'♥'.repeat(Math.max(0, hud.lives))}
          </span>
        )}
        <div className="game-progress">
          <span>{hud.progress.label}</span>
          <progress
            aria-label={hud.progress.label}
            value={hud.progress.value}
            max={hud.progress.max}
          />
          <p>{hud.progress.detail}</p>
        </div>
        <div
          className="game-feedback"
          role="status"
          aria-live="polite"
          aria-atomic="true"
        >
          <span key={hud.feedbackSerial}>
            {hud.feedback || 'Jeder Versuch zählt. Viel Spaß!'}
          </span>
        </div>
        <span>Spielpunkte sind keine Lernpunkte.</span>
      </div>
      <div
        className="game-focus"
        ref={area}
        tabIndex={0}
        role="group"
        aria-label={`Spielfeld ${definition.name}`}
        onBlur={(event) => {
          if (
            !event.currentTarget.contains(event.relatedTarget as Node | null)
          ) {
            clearControls();
            setPaused(true);
          }
        }}
        onKeyDown={(event) => {
          if (event.key.toLowerCase() === 'p') {
            event.preventDefault();
            if (!event.repeat) togglePause();
            return;
          }
          if (event.target !== event.currentTarget) return;
          const action = keyAction(event.key);
          if (action) {
            event.preventDefault();
            if (!event.repeat) press(action);
          }
          if (gameId === 'chickens' && /^[1-5]$/.test(event.key) && !paused) {
            event.preventDefault();
            if (!event.repeat) hitChicken(game, Number(event.key) - 1);
          }
        }}
        onKeyUp={(event) => {
          const action = keyAction(event.key);
          if (action) release(action);
        }}
      >
        <div className="game-scene">
          <canvas
            ref={canvas}
            width={640}
            height={400}
            aria-label={definition.name}
            onPointerDown={(event) => {
              area.current?.focus();
              if (paused || game.over || gameId !== 'chickens') return;
              const bounds = event.currentTarget.getBoundingClientRect();
              pointAt(
                game,
                ((event.clientX - bounds.left) * 640) / bounds.width,
                ((event.clientY - bounds.top) * 400) / bounds.height,
              );
            }}
          >
            Dein Gerät kann das Spielfeld nicht anzeigen.
          </canvas>
          {(paused || hud.over) && (
            <div className="game-overlay">
              <div className="game-dialog">
                {hud.over ? (
                  <>
                    <h3>{hud.won ? 'Runde geschafft!' : 'Gut gespielt!'}</h3>
                    <p>{hud.score} Spielpunkte gesammelt.</p>
                    <p>{hud.progress.detail}</p>
                  </>
                ) : (
                  <>
                    <span className="game-dialog-icon" aria-hidden="true">
                      {started ? 'Ⅱ' : definition.icon}
                    </span>
                    <h3>{started ? 'Deine Pause' : definition.name}</h3>
                    <p>
                      {started
                        ? 'Alles wartet auf dich. Spiele in deinem Tempo weiter.'
                        : definition.goal}
                    </p>
                    {!started && (
                      <p className="game-quick-controls">
                        {definition.controlsHint}
                        <br />
                        oder die Tasten unter dem Spielfeld
                      </p>
                    )}
                    <button onClick={togglePause}>Losspielen / Weiter</button>
                    <small>P = Pause · Du kannst jederzeit aufhören.</small>
                  </>
                )}
              </div>
            </div>
          )}
        </div>
        <div className="game-controls" aria-label="Spielsteuerung">
          {gameId === 'chickens'
            ? [1, 2, 3, 4, 5].map((number) => (
                <button
                  key={number}
                  disabled={paused || hud.over}
                  onClick={() => {
                    hitChicken(game, number - 1);
                    area.current?.focus();
                  }}
                >
                  <span
                    className={`chicken-control-mark ${hud.chickenHits[number - 1] ? 'is-greeted' : ''}`}
                    aria-hidden="true"
                  >
                    {hud.chickenHits[number - 1] ? '✓' : number}
                  </span>
                  Huhn {number}
                </button>
              ))
            : controls.map(([action, label]) => (
                <button
                  key={action}
                  disabled={paused || hud.over}
                  onPointerDown={(event) => {
                    event.preventDefault();
                    event.currentTarget.setPointerCapture(event.pointerId);
                    area.current?.focus();
                    press(action);
                  }}
                  onPointerUp={() => release(action)}
                  onPointerCancel={() => release(action)}
                  onLostPointerCapture={() => release(action)}
                  onKeyDown={(event) => {
                    if (event.key !== 'Enter' && event.key !== ' ') return;
                    event.preventDefault();
                    event.stopPropagation();
                    if (!event.repeat) {
                      press(action);
                      keyboardStarted.current.set(action, performance.now());
                    }
                  }}
                  onKeyUp={(event) => {
                    if (event.key !== 'Enter' && event.key !== ' ') return;
                    event.preventDefault();
                    event.stopPropagation();
                    const began = keyboardStarted.current.get(action);
                    keyboardStarted.current.delete(action);
                    const remaining =
                      gameId === 'blocks' || began === undefined
                        ? 0
                        : 120 - (performance.now() - began);
                    // Continuous movement needs a frame; blocks already move in press().
                    if (remaining > 0 && held.current.has(action)) {
                      taps.current.set(
                        action,
                        setTimeout(() => release(action), remaining),
                      );
                    } else release(action);
                  }}
                  onBlur={() => release(action)}
                  onClick={(event) => {
                    // Assistive technology may activate a button without key events.
                    if (event.detail === 0 && !paused && !game.over) {
                      press(action);
                      if (gameId === 'blocks') release(action);
                      else {
                        taps.current.set(
                          action,
                          setTimeout(() => release(action), 120),
                        );
                      }
                    }
                  }}
                >
                  {label}
                </button>
              ))}
        </div>
      </div>
      <div className="game-actions">
        <button
          disabled={hud.over}
          onPointerDown={(event) => event.preventDefault()}
          onClick={togglePause}
        >
          {paused ? 'Weiterspielen' : 'Pause'}
        </button>
        <button disabled={hud.over} onClick={end}>
          Runde beenden
        </button>
      </div>
      <label className="game-motion-choice">
        <input
          type="checkbox"
          checked={reducedMotion}
          onChange={(event) => setReducedMotion(event.target.checked)}
        />
        Weniger Bewegung
      </label>
    </section>
  );
}
