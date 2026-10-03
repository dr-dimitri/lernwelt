import { useId, useMemo, useRef, useState } from 'react';
import { planets, type SolarPlanet } from '../domain/solar-system';
import {
  solarOrbitPath,
  solarPlanetPosition,
} from '../domain/solar-projection';
import useSolarOrbit from './useSolarOrbit';

// Zoom into the planetary disc in each local NASA image; keep full photographs
// in the fact cards and quiz close-up. Saturn's rings are drawn separately here.
const modelCrop: Record<
  SolarPlanet['id'],
  { x: number; y: number; size: number }
> = {
  mercury: { x: 279, y: 29, size: 512 },
  venus: { x: 254, y: 40, size: 496 },
  earth: { x: 294, y: 59, size: 456 },
  mars: { x: 254, y: 24, size: 520 },
  jupiter: { x: 245, y: 16, size: 556 },
  saturn: { x: 434, y: 37, size: 255 },
  uranus: { x: 240, y: 23, size: 536 },
  neptune: { x: 240, y: 24, size: 536 },
};

export default function SolarSystemModel({
  target,
  guessing,
  selected,
  onSelect,
}: {
  target?: SolarPlanet['id'] | null;
  guessing: boolean;
  selected: SolarPlanet['id'];
  onSelect: (id: SolarPlanet['id']) => void;
}) {
  const id = useId().replaceAll(':', '');
  const [yaw, setYaw] = useState(0);
  const [tilt, setTilt] = useState(38);
  const {
    running,
    setRunning,
    earthYearSeconds,
    setEarthYearSeconds,
    earthYears,
  } = useSolarOrbit();
  const orbitPaths = useMemo(
    () => planets.map((planet) => solarOrbitPath(planet.order, yaw, tilt)),
    [yaw, tilt],
  );
  const drag = useRef<{
    x: number;
    y: number;
    yaw: number;
    tilt: number;
  } | null>(null);
  const moved = useRef(false);
  const positions = planets.map((planet) => ({
    planet,
    ...solarPlanetPosition(planet, yaw, tilt, earthYears),
  }));
  const nodes = [
    ...positions.map((point) => ({ ...point, sun: false })),
    {
      planet: planets[0],
      x: 500,
      y: 315,
      radius: 43,
      depth: 0,
      scale: 1,
      sun: true,
    },
  ].sort((a, b) => b.depth - a.depth);
  const marked = guessing ? target : selected;

  return (
    <figure className="solar-model">
      <div className="solar-model-topline">
        <span>DEIN BLICK INS ALL</span>
        <span>
          ✦{' '}
          {guessing ? 'Welcher Planet ist goldmarkiert?' : '8 Welten · 1 Stern'}
        </span>
      </div>
      <svg
        className="solar-space"
        viewBox="0 0 1000 650"
        role="img"
        aria-label={
          guessing
            ? 'Räumliches Sonnensystem. Der gesuchte Planet und seine Umlaufbahn sind goldmarkiert. Die Sonne steht in der Mitte.'
            : 'Drehbares räumliches Modell mit Sonne und acht Planeten. Wähle einen Planeten mit den Tasten unter dem Bild.'
        }
        onPointerDown={(event) => {
          if (event.button !== 0) return;
          drag.current = { x: event.clientX, y: event.clientY, yaw, tilt };
          moved.current = false;
          (event.target as Element).setPointerCapture?.(event.pointerId);
        }}
        onPointerMove={(event) => {
          if (!drag.current) return;
          const dx = event.clientX - drag.current.x;
          const dy = event.clientY - drag.current.y;
          if (Math.abs(dx) + Math.abs(dy) > 6) moved.current = true;
          setYaw(Math.max(-180, Math.min(180, drag.current.yaw + dx * 0.4)));
          setTilt(Math.max(15, Math.min(80, drag.current.tilt + dy * 0.2)));
        }}
        onPointerUp={() => {
          drag.current = null;
        }}
        onPointerCancel={() => {
          drag.current = null;
        }}
        onLostPointerCapture={() => {
          drag.current = null;
        }}
      >
        <defs>
          <radialGradient id={`${id}-sun`} cx="35%" cy="30%">
            <stop stopColor="#fff5ba" />
            <stop offset="0.5" stopColor="#ffc65c" />
            <stop offset="1" stopColor="#dc651b" />
          </radialGradient>
          <radialGradient id={`${id}-light`} cx="28%" cy="24%" r="75%">
            <stop stopColor="#ffffff" stopOpacity="0.13" />
            <stop offset="0.5" stopColor="#000000" stopOpacity="0" />
            <stop offset="1" stopColor="#000000" stopOpacity="0.35" />
          </radialGradient>
          {positions.map((point) => (
            <clipPath key={point.planet.id} id={`${id}-${point.planet.id}`}>
              <circle cx={point.x} cy={point.y} r={point.radius} />
            </clipPath>
          ))}
        </defs>
        <g aria-hidden="true">
          {Array.from({ length: 80 }, (_, i) => (
            <circle
              key={i}
              cx={(i * 137 + 31) % 1000}
              cy={(i * 83 + 17) % 650}
              r={i % 7 ? 1 : 2}
              fill="#d4e6ff"
              opacity={0.2 + (i % 5) * 0.12}
            />
          ))}
          {planets.map((planet) => (
            <path
              key={planet.id}
              d={orbitPaths[planet.order - 1]}
              fill="none"
              stroke={marked === planet.id ? '#ffd17d' : '#7193c0'}
              strokeOpacity={marked === planet.id ? 0.85 : 0.25}
              strokeWidth={marked === planet.id ? 2.5 : 1}
            />
          ))}
          {nodes.map((point) =>
            point.sun ? (
              <g key="sun">
                <circle
                  cx="500"
                  cy="315"
                  r="64"
                  fill="#ffb74e"
                  opacity="0.08"
                />
                <circle cx="500" cy="315" r="52" fill="#ffb74e" opacity="0.1" />
                <circle cx="500" cy="315" r="43" fill={`url(#${id}-sun)`} />
                <text
                  x="500"
                  y="255"
                  textAnchor="middle"
                  fill="#ffe1a5"
                  fontSize="17"
                >
                  Sonne
                </text>
              </g>
            ) : (
              <g
                key={point.planet.id}
                className={!guessing ? 'solar-planet-node' : undefined}
                onClick={() => {
                  if (!guessing && !moved.current) onSelect(point.planet.id);
                }}
              >
                {point.planet.id === 'saturn' && (
                  <ellipse
                    cx={point.x}
                    cy={point.y}
                    rx={point.radius * 1.7}
                    ry={point.radius * 0.48}
                    fill="none"
                    stroke="#dac49b"
                    strokeWidth={point.radius * 0.22}
                    transform={`rotate(-22 ${point.x} ${point.y})`}
                  />
                )}
                <circle
                  cx={point.x}
                  cy={point.y}
                  r={point.radius}
                  fill={point.planet.color}
                />
                <g clipPath={`url(#${id}-${point.planet.id})`}>
                  <svg
                    x={point.x - point.radius}
                    y={point.y - point.radius}
                    width={point.radius * 2}
                    height={point.radius * 2}
                    viewBox={`${modelCrop[point.planet.id].x} ${modelCrop[point.planet.id].y} ${modelCrop[point.planet.id].size} ${modelCrop[point.planet.id].size}`}
                  >
                    <image
                      href={point.planet.image}
                      width="1024"
                      height={point.planet.id === 'saturn' ? 341 : 576}
                    />
                  </svg>
                </g>
                <circle
                  cx={point.x}
                  cy={point.y}
                  r={point.radius}
                  fill={`url(#${id}-light)`}
                />
                {marked === point.planet.id && (
                  <>
                    <circle
                      cx={point.x}
                      cy={point.y}
                      r={point.radius + 8}
                      fill="none"
                      stroke="#ffd17d"
                      strokeWidth="3"
                    />
                    <text
                      x={point.x}
                      y={point.y - point.radius - 17}
                      textAnchor="middle"
                      fill="#ffd17d"
                      fontSize="22"
                      fontWeight="700"
                    >
                      {guessing ? '?' : point.planet.name}
                    </text>
                  </>
                )}
              </g>
            ),
          )}
        </g>
      </svg>
      <div className="solar-view-controls">
        <label htmlFor={`${id}-turn`}>
          Blick drehen
          <input
            id={`${id}-turn`}
            type="range"
            min="-180"
            max="180"
            value={yaw}
            onChange={(event) => setYaw(Number(event.target.value))}
          />
        </label>
        <label htmlFor={`${id}-tilt`}>
          Von oben schauen
          <input
            id={`${id}-tilt`}
            type="range"
            min="15"
            max="80"
            value={tilt}
            onChange={(event) => setTilt(Number(event.target.value))}
          />
        </label>
        <button
          type="button"
          onClick={() => {
            setYaw(0);
            setTilt(38);
          }}
        >
          Blick zurücksetzen
        </button>
      </div>
      <div className="solar-orbit-controls">
        <button
          type="button"
          aria-pressed={running}
          onClick={() => setRunning((active) => !active)}
        >
          {running ? 'Umlauf anhalten' : 'Umlauf starten'}
        </button>
        <label htmlFor={`${id}-year`}>
          Ein Erdenjahr: {earthYearSeconds} Sekunden
          <input
            id={`${id}-year`}
            type="range"
            min="5"
            max="15"
            step="1"
            value={earthYearSeconds}
            aria-label="Sekunden pro Erdenjahr"
            aria-valuetext={`${earthYearSeconds} Sekunden pro Erdenjahr`}
            onChange={(event) =>
              setEarthYearSeconds(Number(event.target.value))
            }
          />
          <span className="solar-speed-scale" aria-hidden="true">
            <span>Schnell · 5 Sekunden</span>
            <span>Langsam · 15 Sekunden</span>
          </span>
        </label>
        <p>
          Die Erde braucht hier {earthYearSeconds} Sekunden für eine Runde. Die
          anderen Planeten kreisen im Verhältnis ihrer echten Umlaufzeiten.
        </p>
      </div>
      <figcaption>
        Ziehe am Bild oder nutze die Regler. Mit der Tastatur: Tab zum Regler,
        dann Pfeiltasten.
        <strong>
          {' '}
          Größen und Abstände sind zum Lernen verändert. Die Planeten stehen
          anfangs an Beispielpositionen. Sie bewegen sich auf vereinfachten
          Kreisbahnen gleichmäßig um die Sonne.
        </strong>
      </figcaption>
      {!guessing && (
        <div className="solar-planet-picker" aria-label="Planet entdecken">
          {planets.map((planet) => (
            <button
              key={planet.id}
              type="button"
              aria-pressed={selected === planet.id}
              onClick={() => onSelect(planet.id)}
            >
              <span>{planet.order}</span> {planet.name}
            </button>
          ))}
        </div>
      )}
    </figure>
  );
}
