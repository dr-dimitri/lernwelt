import { useId } from 'react';
import type {
  FlowerPart,
  MeadowAnimal,
  ParticleState,
} from '../domain/nature-games';

const particles: Record<ParticleState, readonly [number, number][]> = {
  solid: [
    [46, 38],
    [64, 38],
    [82, 38],
    [100, 38],
    [46, 56],
    [64, 56],
    [82, 56],
    [100, 56],
    [46, 74],
    [64, 74],
    [82, 74],
    [100, 74],
  ],
  liquid: [
    [30, 75],
    [48, 71],
    [66, 77],
    [85, 71],
    [105, 77],
    [121, 66],
    [39, 54],
    [57, 51],
    [76, 57],
    [94, 50],
    [112, 48],
    [74, 36],
  ],
  gas: [
    [22, 22],
    [62, 13],
    [110, 23],
    [132, 55],
    [85, 68],
    [41, 49],
    [22, 82],
    [115, 85],
    [75, 38],
    [53, 83],
    [126, 10],
    [15, 57],
  ],
};
const stateNames = {
  solid: 'Teilchen geordnet an festen Plätzen',
  liquid: 'Teilchen nah beieinander und ungeordnet',
  gas: 'Teilchen weit verteilt, mit Bewegungsstrichen',
};

export function ParticlePicture({ state }: { state: ParticleState }) {
  return (
    <svg
      viewBox="0 0 150 104"
      role="img"
      aria-label={`Teilchenmodell, ${stateNames[state]}`}
    >
      <rect
        x="4"
        y="3"
        width="142"
        height="98"
        rx="15"
        fill="#eff9fc"
        stroke="#99bdce"
        strokeWidth="2"
      />
      {particles[state].map(([x, y], index) => (
        <g key={index}>
          {state === 'gas' && (
            <path
              d={`M${x - 6} ${y + 7} l-4 4`}
              stroke="#92bbc8"
              strokeWidth="2"
            />
          )}
          <circle cx={x} cy={y} r="6" fill="#2485a7" />
          <circle cx={x - 1.5} cy={y - 1.5} r="1.8" fill="#d0f8fc" />
        </g>
      ))}
    </svg>
  );
}

export function FlowerPicture({ found = [] }: { found?: readonly string[] }) {
  return (
    <svg
      viewBox="0 0 440 255"
      role="img"
      aria-label="Vereinfachter Blütenschnitt. 1: rosa Blütenblatt. 2: Staubblatt mit gelbem Staubbeutel. 3: Narbe oben in der Mitte. 4: Fruchtknoten mit Samenanlagen."
    >
      <rect width="440" height="255" rx="24" fill="#faf4eb" />
      <ellipse cx="220" cy="235" rx="85" ry="9" fill="#e4e7d0" />
      <path
        d="M220 231 V168"
        stroke="#438160"
        strokeWidth="12"
        strokeLinecap="round"
      />
      <path
        d="M217 207 Q171 167 160 207 Q185 226 217 220 M223 199 Q270 164 277 201 Q247 220 223 211"
        fill="#75a76a"
      />
      <path
        d="M220 175 C157 181 99 112 123 70 C165 38 218 115 220 140 C234 76 288 35 315 70 C341 110 283 180 220 175"
        fill="#ec9baa"
        stroke="#b95e79"
        strokeWidth="3"
      />
      <path
        d="M220 172 Q143 154 139 112 Q181 96 220 172 Q256 102 299 112 Q298 158 220 172"
        fill="#f5bcc4"
      />
      <path
        d="M191 158 L171 96 M248 158 L270 96"
        stroke="#b28a35"
        strokeWidth="5"
        strokeLinecap="round"
      />
      <ellipse
        cx="169"
        cy="91"
        rx="11"
        ry="18"
        fill="#f4c354"
        stroke="#a77524"
        strokeWidth="2"
        transform="rotate(-20 169 91)"
      />
      <ellipse
        cx="272"
        cy="91"
        rx="11"
        ry="18"
        fill="#f4c354"
        stroke="#a77524"
        strokeWidth="2"
        transform="rotate(20 272 91)"
      />
      <path d="M220 150 V73" stroke="#6c985c" strokeWidth="9" />
      <path
        d="M207 70 Q220 55 233 70"
        fill="none"
        stroke="#6c985c"
        strokeWidth="9"
        strokeLinecap="round"
      />
      <ellipse
        cx="220"
        cy="163"
        rx="27"
        ry="29"
        fill="#bcd394"
        stroke="#608d52"
        strokeWidth="3"
      />
      <path d="M220 138 V185" stroke="#608d52" strokeWidth="2" />
      {[153, 167, 180].map((y) => (
        <g key={y} fill="#f9f2c9">
          <ellipse cx="210" cy={y} rx="5" ry="4" />
          <ellipse cx="230" cy={y} rx="5" ry="4" />
        </g>
      ))}
      {(
        [
          ['petal', 1, 'Blütenblatt', 25, 146, 145, 134],
          ['stamen', 2, 'Staubblatt', 24, 45, 166, 78],
          ['stigma', 3, 'Narbe', 319, 42, 228, 65],
          ['ovary', 4, 'Fruchtknoten', 309, 182, 245, 167],
        ] as const
      ).map(([part, number, name, x, y, targetX, targetY]) => (
        <g key={part}>
          <path
            d={`M${x < 200 ? x + 98 : x} ${y + 10} L${targetX} ${targetY}`}
            fill="none"
            stroke="#7d8b74"
            strokeWidth="1.5"
          />
          <rect
            x={x - 7}
            y={y - 8}
            width="115"
            height="34"
            rx="9"
            fill={
              found.includes(part satisfies FlowerPart) ? '#d9edd7' : '#fffdf9'
            }
          />
          <text x={x} y={y + 13} fontSize="12" fill="#304535" fontWeight="700">
            {number} · {name}
          </text>
        </g>
      ))}
      <text x="14" y="242" fontSize="11" fill="#596d5c">
        Ein Modell: Blüten können anders aussehen.
      </text>
    </svg>
  );
}

export function MeadowCreature({ kind }: { kind: MeadowAnimal }) {
  if (kind === 'grass')
    return (
      <g stroke="#398554" strokeWidth="5" strokeLinecap="round" fill="none">
        <path d="M-20 17 Q-26 -12 -35 -18 M-12 18 Q-15 -14 -8 -28 M0 19 V-31 M12 18 Q12 -20 25 -24 M19 19 Q23 -5 36 -14" />
      </g>
    );
  if (kind === 'grasshopper')
    return (
      <g stroke="#477646" strokeWidth="2" strokeLinejoin="round">
        <path
          d="M-20 12 L-35 24 M9 5 L29 -10 L20 24 M-3 8 L8 24"
          fill="none"
          strokeWidth="4"
        />
        <ellipse cx="-4" cy="3" rx="27" ry="10" fill="#a0b967" />
        <circle cx="22" cy="-3" r="11" fill="#b8d07c" />
        <path d="M26 -12 L32 -27 M19 -12 L14 -27" fill="none" />
        <circle cx="25" cy="-6" r="2.5" fill="#243e32" />
      </g>
    );
  if (kind === 'frog')
    return (
      <g stroke="#427b54" strokeWidth="2">
        <ellipse cx="0" cy="8" rx="28" ry="19" fill="#7dae70" />
        <ellipse cx="-27" cy="20" rx="15" ry="9" fill="#9bc782" />
        <ellipse cx="27" cy="20" rx="15" ry="9" fill="#9bc782" />
        <circle cx="-13" cy="-9" r="12" fill="#b0cd87" />
        <circle cx="13" cy="-9" r="12" fill="#b0cd87" />
        <circle cx="-12" cy="-10" r="4" fill="#263d34" />
        <circle cx="12" cy="-10" r="4" fill="#263d34" />
        <path d="M-8 7 Q0 13 8 7" fill="none" />
      </g>
    );
  return (
    <g strokeLinecap="round" strokeLinejoin="round">
      <path d="M-6 15 L-10 34 M7 15 L14 34" stroke="#b65d39" strokeWidth="4" />
      <ellipse
        cx="-2"
        cy="1"
        rx="26"
        ry="18"
        fill="#fffefa"
        stroke="#799596"
        strokeWidth="2"
      />
      <path d="M-23 -4 Q-21 22 15 10" fill="#374d58" />
      <path
        d="M12 2 Q30 -15 21 -27"
        stroke="#fffefa"
        strokeWidth="12"
        fill="none"
      />
      <circle
        cx="20"
        cy="-27"
        r="9"
        fill="#fffefa"
        stroke="#799596"
        strokeWidth="1.5"
      />
      <path d="M26 -29 L48 -23 L27 -22" fill="#d77949" />
      <circle cx="22" cy="-29" r="2" fill="#243e32" />
    </g>
  );
}

const positions: Record<MeadowAnimal, [number, number]> = {
  grass: [62, 154],
  grasshopper: [166, 75],
  frog: [273, 154],
  stork: [374, 75],
};

export function MeadowPicture({
  nodes = ['grass', 'grasshopper', 'frog', 'stork'],
  links = [],
}: {
  nodes?: readonly MeadowAnimal[];
  links?: readonly (readonly [MeadowAnimal, MeadowAnimal])[];
}) {
  const arrowId = useId();
  return (
    <svg
      viewBox="0 0 440 245"
      role="img"
      aria-label={`Vereinfachte Wiese mit ${links.length} gefundenen Nahrungsbeziehungen. Die Beziehungen stehen auch unter dem Bild.`}
    >
      <defs>
        <marker
          id={arrowId}
          viewBox="0 0 10 10"
          refX="8"
          refY="5"
          markerWidth="5"
          markerHeight="5"
          orient="auto-start-reverse"
        >
          <path d="M0 0 L10 5 L0 10Z" fill="#2e7560" />
        </marker>
      </defs>
      <rect width="440" height="245" rx="24" fill="#edf7f0" />
      <circle cx="390" cy="33" r="21" fill="#f5dc83" />
      <path d="M0 189 Q103 151 206 190 T440 183 V245 H0Z" fill="#cce3b9" />
      <path d="M0 214 Q99 174 213 211 T440 206 V245 H0Z" fill="#afd19d" />
      {links.map(([a, b]) => {
        const [x1, y1] = positions[a];
        const [x2, y2] = positions[b];
        const length = Math.hypot(x2 - x1, y2 - y1);
        const dx = (x2 - x1) / length;
        const dy = (y2 - y1) / length;
        return (
          <line
            key={`${a}-${b}`}
            x1={x1 + dx * 41}
            y1={y1 + dy * 41}
            x2={x2 - dx * 43}
            y2={y2 - dy * 43}
            stroke="#2e7560"
            strokeWidth="3"
            markerEnd={`url(#${arrowId})`}
          />
        );
      })}
      {nodes.map((node) => (
        <g
          key={node}
          transform={`translate(${positions[node][0]} ${positions[node][1]})`}
        >
          <circle r="39" fill="#fffef7" />
          <MeadowCreature kind={node} />
        </g>
      ))}
      <text x="18" y="231" fontSize="12" fill="#314c34">
        Nahrung → wird gefressen von → Tier
      </text>
    </svg>
  );
}
