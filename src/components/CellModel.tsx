import { useId, type ReactNode } from 'react';
import { cellParts, type CellPart, type CellType } from '../domain/cells';

/** Own schematic illustrations; color, shapes and labels jointly identify parts. */
export default function CellModel({
  type = 'animal',
  detail = false,
  selected = 'nucleus',
  onSelect,
  quizTarget,
}: {
  type?: CellType;
  detail?: boolean;
  selected?: CellPart;
  onSelect?: (part: CellPart) => void;
  quizTarget?: CellPart;
}) {
  const id = useId().replace(/:/g, '');
  const quiz = !!quizTarget;
  const parts: CellPart[] = detail
    ? ['envelope', 'information']
    : type === 'plant'
      ? ['wall', 'membrane', 'plasma', 'vacuole', 'chloroplast', 'nucleus']
      : ['membrane', 'plasma', 'nucleus'];
  function region(part: CellPart, children: ReactNode) {
    return (
      <g
        key={part}
        className={`cell-region ${!quiz && selected === part ? 'is-selected' : ''}`}
        role={onSelect && !quiz ? 'button' : undefined}
        tabIndex={onSelect && !quiz ? 0 : undefined}
        aria-label={
          onSelect && !quiz ? `${cellParts[part].name} im Modell` : undefined
        }
        aria-pressed={onSelect && !quiz ? selected === part : undefined}
        onClick={() => !quiz && onSelect?.(part)}
        onKeyDown={(event) => {
          if (onSelect && !quiz && ['Enter', ' '].includes(event.key)) {
            event.preventDefault();
            onSelect(part);
          }
        }}
      >
        {children}
      </g>
    );
  }
  const targetPosition = detail
    ? [135, 205]
    : quizTarget === 'membrane'
      ? [82, 211]
      : type === 'plant'
        ? [425, 271]
        : [278, 220];
  return (
    <figure className={`cell-model ${detail ? 'cell-detail-model' : ''}`}>
      <svg
        viewBox="0 0 600 410"
        role={onSelect && !quiz ? 'group' : 'img'}
        aria-label={
          quiz
            ? 'Vereinfachtes Zellmodell. A zeigt den gesuchten Bereich.'
            : detail
              ? 'Eigenes Detailmodell des Zellkerns'
              : `Eigenes Modell einer typischen ${type === 'plant' ? 'Pflanzenzelle' : 'Tierzelle'}`
        }
      >
        <defs>
          <linearGradient id={`${id}plasma`} x1="0" x2="1" y1="0" y2="1">
            <stop stopColor="#eff9f2" />
            <stop offset="1" stopColor="#b8e3d1" />
          </linearGradient>
          <radialGradient id={`${id}kernel`}>
            <stop stopColor="#e6dcfa" />
            <stop offset=".7" stopColor="#b8a1e0" />
            <stop offset="1" stopColor="#8970bb" />
          </radialGradient>
        </defs>
        <rect width="600" height="410" rx="24" fill="#f5faf7" />
        <g aria-hidden={quiz || !onSelect ? true : undefined}>
          {detail ? (
            <>
              {region(
                'envelope',
                <circle
                  cx="300"
                  cy="205"
                  r="164"
                  fill={`url(#${id}kernel)`}
                  stroke="#7961a9"
                  strokeWidth="14"
                />,
              )}
              <circle
                cx="300"
                cy="205"
                r="149"
                fill="none"
                stroke="#f1eafa"
                strokeWidth="3"
                aria-hidden="true"
                pointerEvents="none"
              />
              {region(
                'information',
                <g>
                  <circle cx="300" cy="205" r="126" fill="transparent" />
                  <path
                    d="M220 130c90-50 20 100 115 50s-20 105 30 110M190 230c90 45 10-95 90-80s-20 140 70 155M250 105c-55 85 100 45 90 105s-75 20-90 80"
                    fill="none"
                    stroke="#684aa0"
                    strokeWidth="10"
                    strokeLinecap="round"
                  />
                </g>,
              )}
              {[70, 155, 245, 330].map((angle) => (
                <circle
                  key={angle}
                  cx={300 + 158 * Math.cos((angle * Math.PI) / 180)}
                  cy={205 + 158 * Math.sin((angle * Math.PI) / 180)}
                  r="8"
                  fill="#f5faf7"
                  stroke="#7961a9"
                  strokeWidth="3"
                  aria-hidden="true"
                  pointerEvents="none"
                />
              ))}
              {!quiz && (
                <text
                  x="300"
                  y="397"
                  textAnchor="middle"
                  className="cell-svg-note"
                  aria-hidden="true"
                >
                  Gezeichnetes Detail · keine Mikroskopvergrößerung
                </text>
              )}
            </>
          ) : type === 'plant' ? (
            <>
              {region(
                'wall',
                <rect
                  x="62"
                  y="45"
                  width="478"
                  height="322"
                  rx="48"
                  fill="#e5c99a"
                  stroke="#8b7047"
                  strokeWidth="8"
                />,
              )}
              {region(
                'membrane',
                <rect
                  x="77"
                  y="59"
                  width="448"
                  height="293"
                  rx="38"
                  fill={`url(#${id}plasma)`}
                  stroke="#448774"
                  strokeWidth="7"
                />,
              )}
              {region(
                'plasma',
                <rect
                  x="92"
                  y="74"
                  width="418"
                  height="263"
                  rx="27"
                  fill={`url(#${id}plasma)`}
                />,
              )}
              {region(
                'vacuole',
                <path
                  d="M170 101Q330 70 389 118Q424 147 375 252Q352 284 194 274Q137 259 133 199Q130 127 170 101Z"
                  fill="#c5e8f1"
                  stroke="#62a3b2"
                  strokeWidth="5"
                />,
              )}
              {region(
                'chloroplast',
                <g>
                  {[
                    [115, 115, -25],
                    [445, 105, 20],
                    [122, 296, 30],
                    [474, 216, -15],
                    [291, 315, 0],
                  ].map(([x, y, a]) => (
                    <g key={x} transform={`translate(${x} ${y}) rotate(${a})`}>
                      <ellipse
                        rx="27"
                        ry="16"
                        fill="#67a75d"
                        stroke="#407a44"
                        strokeWidth="3"
                      />
                      <path
                        d="M-16-6H16M-18 0H18M-16 6H16"
                        stroke="#cfdf96"
                        strokeWidth="3"
                      />
                    </g>
                  ))}
                </g>,
              )}
              {region(
                'nucleus',
                <ellipse
                  cx="425"
                  cy="271"
                  rx="45"
                  ry="39"
                  fill={`url(#${id}kernel)`}
                  stroke="#7961a9"
                  strokeWidth="5"
                />,
              )}
              <path
                d="M403 260q20-20 31 8t-23 17"
                stroke="#7961a9"
                strokeWidth="4"
                fill="none"
                pointerEvents="none"
              />
            </>
          ) : (
            <>
              {region(
                'membrane',
                <path
                  d="M105 91Q166 36 282 62Q420 33 500 140Q566 247 457 316Q387 382 231 348Q79 337 74 237Q44 159 105 91Z"
                  fill={`url(#${id}plasma)`}
                  stroke="#448774"
                  strokeWidth="9"
                />,
              )}
              {region(
                'plasma',
                <path
                  d="M119 111Q182 62 279 83Q414 54 481 151Q536 244 444 300Q377 352 238 327Q103 316 96 231Q71 166 119 111Z"
                  fill={`url(#${id}plasma)`}
                />,
              )}
              <g fill="#73bca4" opacity=".5" pointerEvents="none">
                {[
                  [165, 160],
                  [392, 145],
                  [427, 263],
                  [181, 280],
                ].map(([x, y]) => (
                  <ellipse
                    key={x}
                    cx={x}
                    cy={y}
                    rx="26"
                    ry="12"
                    transform={`rotate(-20 ${x} ${y})`}
                  />
                ))}
              </g>
              {region(
                'nucleus',
                <ellipse
                  cx="278"
                  cy="220"
                  rx="69"
                  ry="57"
                  fill={`url(#${id}kernel)`}
                  stroke="#7961a9"
                  strokeWidth="6"
                />,
              )}
              <path
                d="M249 205q23-27 42 2t-28 27q-15 15 25 15"
                fill="none"
                stroke="#7961a9"
                strokeWidth="5"
                pointerEvents="none"
              />
            </>
          )}
        </g>
        {quiz && (
          <g aria-hidden="true">
            <circle
              cx={targetPosition[0]}
              cy={targetPosition[1]}
              r={detail ? 27 : 22}
              fill="#fff6d9"
              stroke="#8f6522"
              strokeWidth="4"
            />
            <text
              x={targetPosition[0]}
              y={targetPosition[1] + 8}
              textAnchor="middle"
              fontSize="26"
              fill="#563e1d"
              fontWeight="800"
            >
              A
            </text>
          </g>
        )}
        {!quiz && (
          <text x="28" y="33" className="cell-svg-note" aria-hidden="true">
            MODELL · vereinfacht
          </text>
        )}
      </svg>
      {!quiz && onSelect && (
        <div className="cell-part-options" aria-label="Zellteile auswählen">
          {parts.map((part) => (
            <button
              key={part}
              type="button"
              aria-pressed={selected === part}
              onClick={() => onSelect(part)}
            >
              {cellParts[part].name}
            </button>
          ))}
        </div>
      )}
      <figcaption>
        {quiz
          ? `A: ${detail ? 'Grenze des runden Innenbereichs' : quizTarget === 'membrane' ? 'äußere Grenze der ganzen Zelle' : 'runder Bereich im Zellinneren'}. Wähle deine Antwort unter der Frage.`
          : detail
            ? 'Kernhülle und Erbinformation als vereinfachtes Modell. Formen, Farben und Größen sind frei gestaltet.'
            : `Typische ${type === 'plant' ? 'grüne Pflanzenzelle' : 'Tierzelle'} als vereinfachtes Modell. Formen und Größen sind nicht maßstabsgetreu; weitere Zellbestandteile fehlen.`}
      </figcaption>
    </figure>
  );
}
