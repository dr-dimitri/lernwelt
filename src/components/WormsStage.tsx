import { useEffect, useId, useRef, useState } from 'react';
import InfoPanel from './InfoPanel';
import { gameDefinition } from '../domain/arcade';
import { prepareCanvas } from '../games/canvas';
import {
  activeWorm,
  createWorms,
  endWorms,
  fireWorm,
  moveWorm,
  setAim,
  skipTurn,
  stepWorms,
  teamEnergy,
} from '../games/worms';
import { drawWorms } from '../games/worms-draw';
import '../worms.css';

export default function WormsStage({
  onFinish,
}: {
  onFinish: (score: number) => void;
}) {
  const [game] = useState(() => createWorms());
  const canvas = useRef<HTMLCanvasElement>(null);
  const area = useRef<HTMLDivElement>(null);
  const heading = useRef<HTMLHeadingElement>(null);
  const stage = useRef<HTMLElement>(null);
  const held = useRef(new Set<-1 | 1>());
  const ended = useRef(false);
  const finishRef = useRef(onFinish);
  const [paused, setPaused] = useState(true);
  const [started, setStarted] = useState(false);
  const [reducedMotion, setReducedMotion] = useState(
    () =>
      window.matchMedia?.('(prefers-reduced-motion: reduce)').matches ?? false,
  );
  const id = useId();
  const definition = gameDefinition('worms');
  const snapshot = () => ({
    score: game.score,
    over: game.over,
    outcome: game.outcome,
    turn: game.turn,
    team: game.team,
    phase: game.phase,
    angle: game.angle,
    power: game.power,
    wind: game.wind,
    movement: Math.round((game.movementLeft / 50) * 100),
    activeName: activeWorm(game)?.name ?? 'Kein aktiver Wurm',
    facing: activeWorm(game)?.facing ?? 1,
    worms: game.worms.map((worm) => ({
      id: worm.id,
      name: worm.name,
      team: worm.team,
      energy: worm.energy,
    })),
    playerEnergy: teamEnergy(game, 'player'),
    cpuEnergy: teamEnergy(game, 'cpu'),
    feedback: game.feedback.text,
    feedbackSerial: game.feedback.serial,
  });
  const [hud, setHud] = useState(snapshot);
  const canAim =
    !paused && !hud.over && hud.team === 'player' && hud.phase === 'aim';
  const turnText = hud.over
    ? 'Runde beendet'
    : hud.phase === 'flight'
      ? 'Der Schuss ist unterwegs.'
      : hud.phase === 'settle'
        ? 'Das Gelände verändert sich.'
        : hud.team === 'cpu'
          ? 'Das Computerteam ist am Zug.'
          : 'Du bist am Zug: bewegen, zielen, schießen.';
  const outcomeText =
    hud.outcome === 'win'
      ? 'Du hast das Inselduell gewonnen!'
      : hud.outcome === 'loss'
        ? 'Das Computerteam hat das Inselduell gewonnen.'
        : hud.outcome === 'draw'
          ? 'Das Inselduell endet unentschieden.'
          : 'Du hast die Runde beendet.';

  function publish() {
    setHud(snapshot());
    if (game.over && !ended.current) {
      ended.current = true;
      held.current.clear();
      finishRef.current(game.score);
    }
  }
  function paint() {
    const context = canvas.current ? prepareCanvas(canvas.current) : null;
    if (context) drawWorms(context, game, reducedMotion);
  }
  function pause() {
    held.current.clear();
    setPaused(true);
  }
  function togglePause() {
    if (game.over) return;
    held.current.clear();
    setStarted(true);
    setPaused((value) => !value);
    area.current?.focus({ preventScroll: true });
  }
  function fire() {
    if (!canAim) return;
    held.current.clear();
    fireWorm(game);
    area.current?.focus({ preventScroll: true });
    publish();
  }
  function skip() {
    if (!canAim) return;
    held.current.clear();
    skipTurn(game);
    area.current?.focus({ preventScroll: true });
    publish();
  }
  function move(direction: -1 | 1) {
    if (!canAim) return;
    moveWorm(game, direction, 0.12);
    area.current?.focus({ preventScroll: true });
    publish();
  }
  function aim(angle = game.angle, power = game.power, direction?: -1 | 1) {
    if (!canAim) return;
    setAim(game, angle, power, direction);
    publish();
  }
  function end() {
    held.current.clear();
    endWorms(game);
    publish();
  }

  useEffect(() => {
    finishRef.current = onFinish;
  }, [onFinish]);
  useEffect(() => {
    heading.current?.focus({ preventScroll: true });
    stage.current?.scrollIntoView({ block: 'start' });
  }, []);
  useEffect(() => {
    const preference = window.matchMedia?.('(prefers-reduced-motion: reduce)');
    const update = () => setReducedMotion(preference?.matches ?? false);
    preference?.addEventListener('change', update);
    return () => preference?.removeEventListener('change', update);
  }, []);
  useEffect(() => {
    const visibility = () => {
      if (document.hidden) pause();
    };
    window.addEventListener('blur', pause);
    document.addEventListener('visibilitychange', visibility);
    return () => {
      held.current.clear();
      window.removeEventListener('blur', pause);
      document.removeEventListener('visibilitychange', visibility);
    };
  }, []);
  useEffect(() => {
    let frame = 0;
    let previous = 0;
    let hudClock = 0;
    const tick = (time: number) => {
      const dt = previous ? Math.min((time - previous) / 1000, 0.04) : 0;
      previous = time;
      if (!paused && !game.over) {
        for (const direction of held.current) moveWorm(game, direction, dt);
        stepWorms(game, dt);
      }
      paint();
      hudClock += dt;
      if (paused || hudClock >= 0.1 || game.over) {
        publish();
        hudClock = 0;
      }
      if (!paused && !game.over) frame = requestAnimationFrame(tick);
    };
    frame = requestAnimationFrame(tick);
    window.addEventListener('resize', paint);
    return () => {
      cancelAnimationFrame(frame);
      window.removeEventListener('resize', paint);
    };
  }, [game, paused, reducedMotion]);

  return (
    <section
      className="game-stage worms-stage arcade-worms"
      aria-labelledby={`${id}-title`}
      ref={stage}
    >
      <div className="section-heading">
        <div className="game-heading">
          <span className="game-emblem" aria-hidden="true">
            {definition.icon}
          </span>
          <div>
            <p className="eyebrow">{definition.theme}</p>
            <h3 id={`${id}-title`} ref={heading} tabIndex={-1}>
              {definition.name}
            </h3>
          </div>
        </div>
        <span className="game-paid-note">Deine Runde ist bezahlt</span>
      </div>
      <InfoPanel className="game-instructions">
        <summary>Steuerung & Spielziel</summary>
        <p id={`${id}-instructions`}>
          {definition.instructions} P pausiert auf dem fokussierten Spielfeld.
        </p>
      </InfoPanel>
      <div className="game-hud worms-hud">
        <strong>{hud.score} Spielpunkte</strong>
        <p className="worms-turn">
          Zug {hud.turn} / {game.maxTurns} · {hud.activeName}
        </p>
        <p>{turnText}</p>
        <p>
          {hud.wind === 0
            ? 'Kein Wind'
            : hud.wind < 0
              ? 'Wind nach links ←'
              : 'Wind nach rechts →'}
        </p>
        {(['player', 'cpu'] as const).map((team) => (
          <div className={`worms-team worms-team-${team}`} key={team}>
            <strong>
              {team === 'player' ? 'Dein Team' : 'Computerteam'} ·{' '}
              {team === 'player' ? hud.playerEnergy : hud.cpuEnergy} Energie
            </strong>
            <ul>
              {hud.worms
                .filter((worm) => worm.team === team)
                .map((worm) => (
                  <li key={worm.id}>
                    <span>
                      {worm.name} <b>{worm.energy}</b>
                    </span>
                    <progress
                      value={worm.energy}
                      max={100}
                      aria-label={`${worm.name}: Energie`}
                    />
                  </li>
                ))}
            </ul>
          </div>
        ))}
        <div
          className="game-feedback"
          role="status"
          aria-live="polite"
          aria-atomic="true"
        >
          <span key={hud.feedbackSerial}>
            {hud.over
              ? outcomeText
              : hud.feedback ||
                'Wähle deine Flugbahn. Der Computer wartet auf deinen Zug.'}
          </span>
        </div>
        <span>Spielpunkte sind keine Lernpunkte.</span>
      </div>
      <div
        className="game-focus worms-focus"
        ref={area}
        tabIndex={0}
        role="group"
        aria-label="Spielfeld Worms"
        aria-describedby={`${id}-keys`}
        onBlur={(event) => {
          held.current.clear();
          if (!event.currentTarget.contains(event.relatedTarget as Node | null))
            pause();
        }}
        onKeyDown={(event) => {
          if (
            event.target !== event.currentTarget ||
            event.altKey ||
            event.ctrlKey ||
            event.metaKey
          )
            return;
          const key =
            event.key.length === 1 ? event.key.toLowerCase() : event.key;
          if (key === 'p') {
            event.preventDefault();
            if (!event.repeat) togglePause();
            return;
          }
          if (
            ![
              'ArrowLeft',
              'ArrowRight',
              'ArrowUp',
              'ArrowDown',
              'w',
              's',
              ' ',
            ].includes(key)
          )
            return;
          event.preventDefault();
          if (!canAim) return;
          if (key === 'ArrowLeft' || key === 'ArrowRight') {
            const direction = key === 'ArrowLeft' ? -1 : 1;
            if (!event.repeat) {
              moveWorm(game, direction);
              held.current.add(direction);
              publish();
            }
          } else if (key === 'ArrowUp' || key === 'ArrowDown') {
            aim(game.angle + (key === 'ArrowUp' ? 5 : -5));
          } else if (key === 'w' || key === 's') {
            aim(game.angle, game.power + (key === 'w' ? 5 : -5));
          } else if (!event.repeat) fire();
        }}
        onKeyUp={(event) => {
          if (event.key === 'ArrowLeft') held.current.delete(-1);
          if (event.key === 'ArrowRight') held.current.delete(1);
        }}
      >
        <div className="game-scene">
          <canvas
            ref={canvas}
            width={640}
            height={400}
            aria-label="Inselduell mit vier Würmern"
            onPointerDown={() => area.current?.focus({ preventScroll: true })}
          >
            Dein Gerät kann das Spielfeld nicht anzeigen. Teamenergie und Zug
            stehen auch als Text daneben.
          </canvas>
          {(paused || hud.over) && (
            <div className="game-overlay">
              <div className="game-dialog">
                {hud.over ? (
                  <>
                    <h3>{outcomeText}</h3>
                    <p>{hud.score} Spielpunkte gesammelt.</p>
                    <p>
                      Dein Team: {hud.playerEnergy} Energie · Computer:{' '}
                      {hud.cpuEnergy} Energie.
                    </p>
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
                        Winkel und Stärke wählen, dann schießen.
                        <br />
                        Pfeiltasten oder die Steuerung unter dem Spielfeld.
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
        <p className="worms-key-hint" id={`${id}-keys`}>
          Im Spielfeld: ← → gehen · ↑ ↓ Winkel · W/S Stärke · Leertaste schießen
          · P Pause
        </p>
        <fieldset className="worms-controls" disabled={!canAim}>
          <legend>Dein Zug: bewegen und zielen</legend>
          <div className="worms-movement">
            <button
              onClick={() => move(-1)}
              disabled={!canAim || hud.movement <= 0}
            >
              ← Gehen
            </button>
            <span>Bewegung: {hud.movement} %</span>
            <button
              onClick={() => move(1)}
              disabled={!canAim || hud.movement <= 0}
            >
              Gehen →
            </button>
          </div>
          <div className="worms-aim">
            <label htmlFor={`${id}-angle`}>
              Winkel <output aria-hidden="true">{hud.angle}°</output>
            </label>
            <input
              id={`${id}-angle`}
              type="range"
              min={15}
              max={80}
              step={1}
              value={hud.angle}
              aria-valuetext={`${hud.angle} Grad`}
              onChange={(event) => aim(Number(event.target.value))}
            />
            <label htmlFor={`${id}-power`}>
              Stärke <output aria-hidden="true">{hud.power} %</output>
            </label>
            <input
              id={`${id}-power`}
              type="range"
              min={20}
              max={100}
              step={1}
              value={hud.power}
              aria-valuetext={`${hud.power} Prozent`}
              onChange={(event) => aim(game.angle, Number(event.target.value))}
            />
          </div>
          <div className="worms-shot-actions">
            <span>Schussrichtung</span>
            <button
              aria-pressed={hud.facing === -1}
              onClick={() => aim(game.angle, game.power, -1)}
            >
              ← Links
            </button>
            <button
              aria-pressed={hud.facing === 1}
              onClick={() => aim(game.angle, game.power, 1)}
            >
              Rechts →
            </button>
            <button className="worms-fire" onClick={fire}>
              Schießen
            </button>
            <button onClick={skip}>Zug auslassen</button>
          </div>
        </fieldset>
        <div className="game-actions worms-actions">
          <button disabled={hud.over} onClick={togglePause}>
            {paused ? 'Weiterspielen' : 'Pause'}
          </button>
          <button disabled={hud.over} onClick={end}>
            Runde beenden
          </button>
          <label className="game-motion-choice">
            <input
              type="checkbox"
              checked={reducedMotion}
              onChange={(event) => setReducedMotion(event.target.checked)}
            />
            Weniger Bewegung
          </label>
        </div>
      </div>
    </section>
  );
}
