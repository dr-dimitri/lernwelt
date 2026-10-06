import { useId } from 'react';
import { earthLayers, type EarthLayerId } from '../domain/earth';
import {
  earthCutFace,
  earthSurface,
  projectEarth,
} from '../domain/earth-projection';

function shadedFace(color: string): string {
  return `#${color
    .slice(1)
    .match(/../g)!
    .map((channel) =>
      Math.round(parseInt(channel, 16) * 0.7)
        .toString(16)
        .padStart(2, '0'),
    )
    .join('')}`;
}

export default function EarthModel({
  selected,
  onSelect,
  guessing = false,
  disabled = false,
  probe = false,
}: {
  selected?: EarthLayerId | string;
  onSelect?: (id: EarthLayerId | string) => void;
  guessing?: boolean;
  disabled?: boolean;
  probe?: boolean;
}) {
  const id = useId();
  const markerPoints = earthLayers.map((_, i) =>
    projectEarth([202, 154, 81, 0][i], 0, 0),
  );
  const probePosition =
    markerPoints[earthLayers.findIndex((layer) => layer.id === selected)] ??
    markerPoints[0];
  return (
    <div className="earth-model">
      <div className="earth-model-caption">
        <span>{guessing ? 'BEREICHE A–D' : 'ERDKUGEL IM SCHNITT'}</span>
        <span>ISOMETRISCHES MODELL</span>
      </div>
      <svg
        viewBox="0 0 720 510"
        className="earth-cutaway"
        aria-label={
          guessing
            ? 'Isometrisch aufgeschnittene Erdkugel mit Bereichen A bis D von außen nach innen'
            : 'Isometrisch aufgeschnittene Erdkugel mit vier Erdschichten'
        }
      >
        <defs>
          {earthLayers.map((layer) => (
            <linearGradient
              key={layer.id}
              id={`${id}-${layer.id}`}
              x1="0"
              x2="1"
              y1="0"
              y2="1"
            >
              <stop offset="0" stopColor={layer.color} />
              <stop offset="1" stopColor={shadedFace(layer.color)} />
            </linearGradient>
          ))}
        </defs>
        <g aria-hidden="true">
          <ellipse
            cx="310"
            cy="469"
            rx="172"
            ry="15"
            fill="#0c292c"
            opacity=".6"
          />
          {earthSurface.map((piece, i) => (
            <polygon
              key={i}
              points={piece.points}
              fill={piece.fill}
              stroke={piece.fill}
              strokeWidth=".5"
              strokeLinejoin="round"
            />
          ))}
        </g>
        {earthLayers.map((layer) => {
          const value = guessing ? layer.marker : layer.id;
          const active = value === selected;
          return (
            <g
              key={layer.id}
              role={onSelect ? 'button' : undefined}
              tabIndex={onSelect && !disabled ? 0 : undefined}
              aria-label={
                guessing
                  ? `Bereich ${layer.marker} im Modell`
                  : `${layer.name} im Modell`
              }
              aria-pressed={onSelect ? active : undefined}
              aria-disabled={disabled || undefined}
              onClick={() => !disabled && onSelect?.(value)}
              onKeyDown={(event) => {
                if (event.key === 'Enter' || event.key === ' ') {
                  event.preventDefault();
                  if (!disabled) onSelect?.(value);
                }
              }}
            >
              <path
                d={earthCutFace(layer.radius, 'left')}
                fill={layer.color}
                stroke={active ? '#fff' : '#765039'}
                strokeWidth={active ? 5 : 1.5}
              />
              <path
                d={earthCutFace(layer.radius, 'right')}
                fill={`url(#${id}-${layer.id})`}
                stroke={active ? '#fff' : '#765039'}
                strokeWidth={active ? 5 : 1.5}
              />
            </g>
          );
        })}
        {earthLayers.map((layer, i) => (
          <g key={layer.id} aria-hidden="true" pointerEvents="none">
            <circle
              cx={markerPoints[i][0]}
              cy={markerPoints[i][1]}
              r="4"
              fill="#fff"
            />
            <path
              d={`M${markerPoints[i].join(',')} L562,${102 + i * 99} L601,${102 + i * 99}`}
              fill="none"
              stroke="#fbf3d7"
              strokeWidth="2"
            />
            <circle
              cx="626"
              cy={102 + i * 99}
              r="20"
              fill="#183739"
              stroke="#fbf3d7"
              strokeWidth="2"
            />
            <text
              x="626"
              y={109 + i * 99}
              textAnchor="middle"
              fontSize="20"
              fill="#fff"
              fontWeight="700"
            >
              {layer.marker}
            </text>
          </g>
        ))}
        {probe && !guessing && (
          <g
            aria-hidden="true"
            pointerEvents="none"
            transform={`translate(${probePosition.join(',')})`}
          >
            <circle r="15" fill="#194947" stroke="white" strokeWidth="3" />
            <path d="M-7 0h14M0 -7v14" stroke="white" strokeWidth="2" />
          </g>
        )}
        <text x="100" y="495" fill="#d9ece4" fontSize="15" aria-hidden="true">
          Ein Viertel ist geöffnet · Farben und Dicken vereinfacht
        </text>
      </svg>
      {onSelect && (
        <div
          className="earth-layer-picker"
          aria-label={
            guessing ? 'Bereich im Modell auswählen' : 'Erdschicht auswählen'
          }
        >
          {earthLayers.map((layer) => {
            const value = guessing ? layer.marker : layer.id;
            return (
              <button
                key={layer.id}
                type="button"
                disabled={disabled}
                aria-pressed={selected === value}
                onClick={() => onSelect(value)}
              >
                <span aria-hidden="true">{layer.marker} · </span>
                {guessing ? `Bereich ${layer.marker}` : layer.name}
              </button>
            );
          })}
        </div>
      )}
      {guessing && (
        <p className="earth-neutral-note">
          A ist außen, D in der Mitte. Beide Schnittflächen zeigen dieselben
          Schichten. Du kannst die großen Bereichstasten oder das Bild benutzen.
        </p>
      )}
    </div>
  );
}
