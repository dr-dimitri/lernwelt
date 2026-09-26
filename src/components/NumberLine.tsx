import { useId, useRef, type KeyboardEvent } from 'react';
import type { NumberLineDiagram } from '../domain/number-line';
import './NumberLine.css';

interface NumberLineProps {
  diagram: NumberLineDiagram;
  value: string;
  onChange: (value: string) => void;
  disabled?: boolean;
}

export default function NumberLine({
  diagram,
  value,
  onChange,
  disabled = false,
}: NumberLineProps) {
  const id = useId();
  const buttons = useRef<(HTMLButtonElement | null)[]>([]);
  const intervals = (diagram.max - diagram.min) / diagram.step;
  const ticks = Array.from(
    { length: intervals + 1 },
    (_, index) => diagram.min + index * diagram.step,
  );
  const placing = diagram.mode === 'place';
  const selected = value.trim() === '' ? -1 : ticks.indexOf(Number(value));
  const format = (coordinate: number) =>
    coordinate.toLocaleString('de-DE').replaceAll('.', ' ');
  const labelWidth = (coordinate: number) => format(coordinate).length * 10;
  const sortedLabels = [...diagram.labels].sort((a, b) => a - b);
  const margin = Math.max(
    40,
    ...sortedLabels.map((label) => labelWidth(label) / 2 + 12),
  );
  const tickGap = Math.max(
    placing ? 44 : 28,
    ...sortedLabels.slice(1).map((label, index) => {
      const previous = sortedLabels[index];
      const gap = (label - previous) / diagram.step;
      return (labelWidth(previous) / 2 + labelWidth(label) / 2 + 12) / gap;
    }),
  );
  const width = Math.max(320, margin * 2 + intervals * tickGap);
  const position = (coordinate: number) =>
    margin +
    ((coordinate - diagram.min) / (diagram.max - diagram.min)) *
      (width - margin * 2);
  const percent = (coordinate: number) => `${(coordinate / width) * 100}%`;
  const name = diagram.kind === 'ray' ? 'Zahlenstrahl' : 'Zahlengerade';
  const description = [
    `${ticks.length} Teilstriche mit gleich großen Abständen.`,
    `Von links gezählt: ${diagram.labels
      .map(
        (label) => `${ticks.indexOf(label) + 1}. Teilstrich: ${format(label)}`,
      )
      .join('; ')}.`,
    ...diagram.markers.map(
      (marker) =>
        `Punkt ${marker.label} steht am ${ticks.indexOf(marker.value) + 1}. Teilstrich von links.`,
    ),
  ].join(' ');

  function choose(index: number, button: HTMLButtonElement) {
    if (disabled || button.matches(':disabled')) return;
    onChange(String(ticks[index]));
  }

  function move(event: KeyboardEvent<HTMLButtonElement>, index: number) {
    let next: number;
    switch (event.key) {
      case 'ArrowLeft':
      case 'ArrowDown':
        next = Math.max(0, index - 1);
        break;
      case 'ArrowRight':
      case 'ArrowUp':
        next = Math.min(ticks.length - 1, index + 1);
        break;
      case 'Home':
        next = 0;
        break;
      case 'End':
        next = ticks.length - 1;
        break;
      default:
        return;
    }
    if (disabled || event.currentTarget.matches(':disabled')) return;
    event.preventDefault();
    choose(next, event.currentTarget);
    buttons.current[next]?.focus({ preventScroll: true });
    buttons.current[next]?.scrollIntoView({
      block: 'nearest',
      inline: 'center',
    });
  }

  return (
    <figure className="number-line">
      {placing && (
        <figcaption
          id={`${id}-instruction`}
          className="number-line-instruction"
        >
          Tippe auf einen Teilstrich. Mit der Tastatur: Pfeiltasten zum Bewegen,
          Pos1 und Ende für die Ränder.
        </figcaption>
      )}
      <div className="number-line-scroll">
        <div
          className="number-line-canvas"
          style={{ minWidth: width }}
          role={placing ? 'radiogroup' : undefined}
          aria-label={placing ? 'Deinen Punkt markieren' : undefined}
          aria-describedby={placing ? `${id}-instruction` : undefined}
          aria-orientation={placing ? 'horizontal' : undefined}
        >
          <svg
            className="number-line-picture"
            role="img"
            aria-labelledby={`${id}-title`}
            aria-describedby={`${id}-description`}
          >
            <title id={`${id}-title`}>{name}</title>
            <desc id={`${id}-description`}>{description}</desc>
            <line
              x1={percent(diagram.kind === 'line' ? margin - 22 : margin)}
              x2={percent(width - margin + 22)}
              y1="70"
              y2="70"
              className="number-line-axis"
            />
            {[64, 76].map((y) => (
              <line
                key={y}
                x1={percent(width - margin + 13)}
                x2={percent(width - margin + 22)}
                y1={y}
                y2="70"
                className="number-line-axis"
              />
            ))}
            {diagram.kind === 'line' &&
              [64, 76].map((y) => (
                <line
                  key={y}
                  x1={percent(margin - 13)}
                  x2={percent(margin - 22)}
                  y1={y}
                  y2="70"
                  className="number-line-axis"
                />
              ))}
            {ticks.map((tick) => (
              <line
                key={tick}
                x1={percent(position(tick))}
                x2={percent(position(tick))}
                y1="61"
                y2="79"
                className="number-line-tick"
              />
            ))}
            {diagram.labels.map((label) => (
              <text
                key={label}
                x={percent(position(label))}
                y="109"
                textAnchor="middle"
                className="number-line-label"
              >
                {format(label)}
              </text>
            ))}
            {diagram.markers.map((marker) => (
              <g key={marker.label} className="number-line-marker">
                <line
                  x1={percent(position(marker.value))}
                  x2={percent(position(marker.value))}
                  y1="40"
                  y2="70"
                />
                <circle cx={percent(position(marker.value))} cy="70" r="6" />
                <text
                  x={percent(position(marker.value))}
                  y="30"
                  textAnchor="middle"
                >
                  {marker.label}
                </text>
              </g>
            ))}
          </svg>
          {placing &&
            ticks.map((tick, index) => (
              <button
                key={tick}
                ref={(element) => {
                  buttons.current[index] = element;
                }}
                type="button"
                role="radio"
                aria-checked={selected === index}
                aria-label={`${index + 1}. Teilstrich von links${
                  diagram.labels.includes(tick)
                    ? `, beschriftet mit ${format(tick)}`
                    : ''
                }`}
                className="number-line-point"
                style={{ left: `${(position(tick) / width) * 100}%` }}
                tabIndex={index === (selected < 0 ? 0 : selected) ? 0 : -1}
                disabled={disabled}
                onClick={(event) => choose(index, event.currentTarget)}
                onKeyDown={(event) => move(event, index)}
              >
                <span className="number-line-point-dot" aria-hidden="true" />
                {selected === index && (
                  <span className="number-line-point-label" aria-hidden="true">
                    Dein Punkt
                  </span>
                )}
              </button>
            ))}
        </div>
      </div>
      {placing && (
        <p className="number-line-selection" role="status">
          {selected < 0
            ? 'Noch kein Punkt gewählt. Im schmalen Fenster kannst du die Skala seitlich verschieben.'
            : `Dein Punkt steht am ${selected + 1}. Teilstrich von links.`}
        </p>
      )}
      <details className="number-line-description">
        <summary>Bild in Worten</summary>
        <p>{description}</p>
      </details>
    </figure>
  );
}
