import InfoPanel from './InfoPanel';
import { useEffect, useRef, useState } from 'react';
import type { GameId } from '../domain/arcade';
import { games } from '../domain/arcade';
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
  function release(action: Action) {
    keyboardStarted.current.delete(action);
    clearTimeout(taps.current.get(action));
    taps.current.delete(action);
    held.current.delete(action);
  }
  function clearControls() {
    for (const timer of taps.current.values()) clearTimeout(timer);
    taps.current.clear();
    keyboardStarted.current.clear();
    held.current.clear();
  }
  const ended = useRef(false);
  const [paused, setPaused] = useState(true);
  const [hud, setHud] = useState({
    score: 0,
    lives: 3,
    over: false,
    won: false,
  });
  const definition = games.find((g) => g.id === gameId)!;
  const finishRef = useRef(onFinish);
  useEffect(() => {
    finishRef.current = onFinish;
  }, [onFinish]);
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
      hudClock = 0,
      repeatClock = 0;
    const paint = () => {
      const context = canvas.current ? prepareCanvas(canvas.current) : null;
      if (context) drawGame(context, game);
    };
    const tick = (time: number) => {
      const dt = previous ? Math.min((time - previous) / 1000, 0.04) : 0;
      previous = time;
      if (!paused && !game.over) {
        stepGame(game, dt, held.current);
        repeatClock += dt;
        if (gameId === 'blocks' && repeatClock >= 0.12) {
          for (const action of held.current)
            if (['left', 'right', 'down'].includes(action))
              actGame(game, action);
          repeatClock = 0;
        }
      }
      paint();
      hudClock += dt;
      if (paused || hudClock >= 0.1 || game.over) {
        setHud({
          score: game.score,
          lives: game.lives,
          over: game.over,
          won: game.won,
        });
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
  }, [game, gameId, paused]);
  function press(action: Action) {
    if (paused || game.over) return;
    release(action);
    held.current.add(action);
    actGame(game, action);
  }
  function togglePause() {
    clearControls();
    setPaused(!paused);
    area.current?.focus({ preventScroll: true });
  }
  function end() {
    clearControls();
    game.over = true;
    setHud({ score: game.score, lives: game.lives, over: true, won: false });
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
        ArrowUp: gameId === 'blocks' ? 'rotate' : 'jump',
        ' ':
          gameId === 'blocks' ? 'drop' : gameId === 'runner' ? 'jump' : 'fire',
      }) as Record<string, Action>
    )[key];
  const controls: [Action, string][] =
    gameId === 'blocks'
      ? [
          ['left', '← Links'],
          ['rotate', '↻ Drehen'],
          ['right', 'Rechts →'],
          ['down', '↓ Senken'],
          ['drop', 'Ablegen'],
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
    <section className="game-stage" aria-labelledby="game-title">
      <div className="section-heading">
        <h3 id="game-title">{definition.name}</h3>
        <span>Bezahlte Runde · kein weiterer Eintritt</span>
      </div>
      <InfoPanel className="game-instructions">
        <summary>Steuerung & Spielziel</summary>
        <p id="game-instructions">
          {definition.instructions} P pausiert das Spiel.
        </p>
      </InfoPanel>
      <div className="game-hud">
        <strong>{hud.score} Spielpunkte</strong>
        {(gameId === 'runner' || gameId === 'space') && (
          <span aria-label={`${hud.lives} Herzen`}>
            {'♥'.repeat(Math.max(0, hud.lives))}
          </span>
        )}
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
          if (action) held.current.delete(action);
        }}
      >
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
                </>
              ) : (
                <>
                  <h3>Zeit für dein Spiel!</h3>
                  <p>Bereit? Du kannst jederzeit pausieren.</p>
                  <button onClick={togglePause}>Losspielen / Weiter</button>
                </>
              )}
            </div>
          </div>
        )}
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
                      began === undefined
                        ? 0
                        : 120 - (performance.now() - began);
                    // A quick tap must last long enough to reach an animation frame.
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
                      taps.current.set(
                        action,
                        setTimeout(() => release(action), 120),
                      );
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
    </section>
  );
}
