import { useId, useMemo, useRef, useState, type PointerEvent } from 'react';
import { earthLayers, type EarthLayerId } from '../domain/earth';
import {
  earthCutFace,
  buildEarthSurface,
  clampEarthRotation,
  EARTH_ROTATION_LIMIT,
  earthCallouts,
  earthProbePosition,
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
  const [rotation, setRotation] = useState(0);
  const [dragging, setDragging] = useState(false);
  const gesture = useRef<{
    pointerId: number;
    target: Element;
    x: number;
    y: number;
    rotation: number;
    moved: boolean;
    rotating: boolean;
  } | null>(null);
  const suppressClick = useRef(false);
  const surface = useMemo(() => buildEarthSurface(rotation), [rotation]);
  const callouts = earthCallouts(rotation);
  const probePosition = earthProbePosition(
    earthLayers.findIndex((layer) => layer.id === selected),
    rotation,
  );
  function finishGesture(
    event: PointerEvent<SVGSVGElement>,
    cancelled = false,
  ) {
    if (gesture.current?.pointerId !== event.pointerId) return;
    const target = gesture.current.target;
    suppressClick.current = gesture.current.moved || cancelled;
    gesture.current = null;
    setDragging(false);
    if (target.hasPointerCapture?.(event.pointerId))
      target.releasePointerCapture(event.pointerId);
  }
  return (
    <div className="earth-model">
      <div className="earth-model-caption">
        <span>{guessing ? 'BEREICHE A–D' : 'ERDKUGEL IM SCHNITT'}</span>
        <span>DREHBARE ERDE</span>
      </div>
      <svg
        viewBox="0 0 720 510"
        className="earth-cutaway"
        data-earth-rotation={rotation}
        data-dragging={dragging || undefined}
        aria-describedby={`${id}-rotation-note`}
        aria-label={
          guessing
            ? 'Drehbare aufgeschnittene Erdkugel mit Bereichen A bis D von außen nach innen'
            : 'Drehbare aufgeschnittene Erdkugel mit vier Erdschichten'
        }
        onPointerDown={(event) => {
          if (event.button !== 0 || gesture.current) return;
          suppressClick.current = false;
          const target =
            event.target instanceof Element &&
            event.target.closest('[role="button"]')
              ? event.target
              : event.currentTarget;
          gesture.current = {
            pointerId: event.pointerId,
            target,
            x: event.clientX,
            y: event.clientY,
            rotation,
            moved: false,
            rotating: false,
          };
          // Layer paths stay mounted and preserve taps. Surface triangles are
          // culled during rotation, so their drag belongs to the stable SVG.
          target.setPointerCapture?.(event.pointerId);
        }}
        onPointerMove={(event) => {
          const current = gesture.current;
          if (!current || current.pointerId !== event.pointerId) return;
          const dx = event.clientX - current.x;
          const dy = event.clientY - current.y;
          if (Math.hypot(dx, dy) > 6) current.moved = true;
          if (Math.abs(dx) > 6 && Math.abs(dx) >= Math.abs(dy))
            current.rotating = true;
          if (!current.rotating) return;
          event.preventDefault();
          setDragging(true);
          setRotation(clampEarthRotation(current.rotation + dx * 0.18));
        }}
        onPointerUp={(event) => finishGesture(event)}
        onPointerCancel={(event) => finishGesture(event, true)}
        onLostPointerCapture={(event) => {
          if (gesture.current?.pointerId === event.pointerId) {
            suppressClick.current = true;
            gesture.current = null;
            setDragging(false);
          }
        }}
        onClickCapture={(event) => {
          if (suppressClick.current) {
            event.preventDefault();
            event.stopPropagation();
            suppressClick.current = false;
          }
        }}
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
          {surface.map((piece, i) => (
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
                data-earth-cut-face={`left-${layer.id}`}
                d={earthCutFace(layer.radius, 'left', rotation)}
                fill={layer.color}
                stroke={active ? '#fff' : '#765039'}
                strokeWidth={active ? 5 : 1.5}
              />
              <path
                data-earth-cut-face={`right-${layer.id}`}
                d={earthCutFace(layer.radius, 'right', rotation)}
                fill={`url(#${id}-${layer.id})`}
                stroke={active ? '#fff' : '#765039'}
                strokeWidth={active ? 5 : 1.5}
              />
            </g>
          );
        })}
        {callouts.map(({ marker, anchor, elbow, end, label }) => (
          <g key={marker} aria-hidden="true" pointerEvents="none">
            <circle cx={anchor[0]} cy={anchor[1]} r="4" fill="#fff" />
            <path
              className="earth-marker-line"
              data-earth-marker={marker}
              d={`M${anchor.join(',')} L${elbow.join(',')} L${end.join(',')}`}
              fill="none"
              stroke="#fbf3d7"
              strokeWidth="2"
            />
            <circle
              className="earth-marker-label"
              data-earth-marker={marker}
              cx={label[0]}
              cy={label[1]}
              r="20"
              fill="#183739"
              stroke="#fbf3d7"
              strokeWidth="2"
            />
            <text
              x={label[0]}
              y={label[1] + 7}
              textAnchor="middle"
              fontSize="20"
              fill="#fff"
              fontWeight="700"
            >
              {marker}
            </text>
          </g>
        ))}
        {probe && !guessing && (
          <g
            aria-hidden="true"
            pointerEvents="none"
            data-earth-probe="true"
            transform={`translate(${probePosition.join(',')})`}
          >
            <circle r="15" fill="#194947" stroke="white" strokeWidth="3" />
            <path d="M-7 0h14M0 -7v14" stroke="white" strokeWidth="2" />
          </g>
        )}
        <text x="100" y="495" fill="#d9ece4" fontSize="15" aria-hidden="true">
          Großer Ausschnitt · Farben und Dicken vereinfacht
        </text>
      </svg>
      <div className="earth-rotation-controls" aria-label="Erde drehen">
        <button
          type="button"
          onClick={() => setRotation((value) => clampEarthRotation(value - 10))}
          disabled={rotation === -EARTH_ROTATION_LIMIT}
        >
          Nach links drehen
        </button>
        <button
          type="button"
          onClick={() => setRotation((value) => clampEarthRotation(value + 10))}
          disabled={rotation === EARTH_ROTATION_LIMIT}
        >
          Nach rechts drehen
        </button>
        <button
          type="button"
          onClick={() => setRotation(0)}
          disabled={rotation === 0}
        >
          Ansicht zurücksetzen
        </button>
      </div>
      <p className="earth-rotation-note" id={`${id}-rotation-note`}>
        Ziehe die Erde nach links oder rechts. Die Drehung ist begrenzt, damit
        du alle Schichten siehst.
      </p>
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
