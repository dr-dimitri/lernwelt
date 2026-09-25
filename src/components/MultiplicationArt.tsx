import { useId } from 'react';

type World = 'workshop' | 'island';
type Design = 'scout' | 'garden' | 'aqua';
type Palette = 'mint' | 'amber' | 'violet';

const colors = {
  mint: { light: '#b6ffdc', main: '#44d9ad', dark: '#12867a' },
  amber: { light: '#fff0a0', main: '#ffc65b', dark: '#cc733c' },
  violet: { light: '#e5d3ff', main: '#b49aff', dark: '#7354c3' },
};

/** Original local vector artwork. Visible construction follows saved practice, not points. */
function Robot({
  design,
  palette,
  progress = 8,
}: {
  design: Design;
  palette: Palette;
  progress?: number;
}) {
  const c = colors[palette];
  const stage = Math.max(0, Math.min(8, progress));
  return (
    <g strokeLinejoin="round" strokeLinecap="round">
      <g
        fill="none"
        stroke="#96b8c2"
        strokeWidth="2"
        strokeDasharray="5 7"
        opacity=".42"
      >
        <rect x="-67" y="-118" width="134" height="91" rx="31" />
        <rect x="-55" y="-19" width="110" height="105" rx="28" />
        <path d="M-35 86v30m70-30v30M-55 0l-25 52m135-52 25 52" />
      </g>
      <g opacity={stage >= 1 ? 1 : 0.14}>
        <path d="M-34 74v34m68-34v34" stroke="#344659" strokeWidth="20" />
        {design === 'scout' ? (
          <>
            <rect
              x="-57"
              y="94"
              width="44"
              height="38"
              rx="15"
              fill="#23374d"
            />
            <rect x="13" y="94" width="44" height="38" rx="15" fill="#23374d" />
            <path
              d="M-48 101h26m-26 10h26m-26 10h26m44-20h26m-26 10h26m-26 10h26"
              stroke="#567589"
              strokeWidth="4"
            />
          </>
        ) : (
          <>
            <path
              d="M-44 99q-25 5-24 25h54v-25zM44 99q25 5 24 25H14v-25z"
              fill={c.dark}
            />
            <path d="M-61 123h44m44 0h34" stroke={c.light} strokeWidth="4" />
          </>
        )}
      </g>
      <g opacity={stage >= 2 ? 1 : 0.1}>
        <rect x="-55" y="-19" width="110" height="107" rx="28" fill={c.dark} />
        <rect x="-55" y="-25" width="104" height="105" rx="27" fill={c.main} />
        <path
          d="M-40-9q-7 0-7 15v43"
          fill="none"
          stroke={c.light}
          strokeWidth="6"
        />
        <path d="M-27 72h54" stroke={c.dark} strokeWidth="4" />
      </g>
      <g opacity={stage >= 3 ? 1 : 0.1}>
        <rect x="-31" y="5" width="62" height="46" rx="14" fill="#203a50" />
        <path
          d="m-18 29 10-9 9 16 11-22 8 12"
          fill="none"
          stroke={c.light}
          strokeWidth="4"
        />
        <circle cx="-13" cy="62" r="4" fill="#203a50" />
        <circle cx="0" cy="62" r="4" fill="#203a50" />
        <circle cx="13" cy="62" r="4" fill="#fff2b3" />
      </g>
      <g opacity={stage >= 4 ? 1 : 0.1}>
        <path d="M-57 2-78 40m135-38 25 26" stroke="#344659" strokeWidth="18" />
        <circle cx="-59" cy="2" r="14" fill={c.light} />
        <circle cx="59" cy="2" r="14" fill={c.light} />
        <path d="m-78 40-5 16m165-28 12-15" stroke={c.main} strokeWidth="22" />
        <path
          d="m-91 64-9-8 9-12m188-42 11 3 1 14"
          fill="none"
          stroke="#344659"
          strokeWidth="8"
        />
      </g>
      <g opacity={stage >= 5 ? 1 : 0.1}>
        <path d="M0-26v-14" stroke="#344659" strokeWidth="20" />
        <rect x="-69" y="-119" width="138" height="94" rx="31" fill={c.dark} />
        <rect x="-69" y="-125" width="132" height="94" rx="31" fill={c.light} />
        <rect x="-56" y="-111" width="108" height="62" rx="23" fill="#203a50" />
        <path d="M-43-99h24" stroke="#547487" strokeWidth="5" />
        <circle cx="-70" cy="-77" r="9" fill={c.main} />
        <circle cx="65" cy="-77" r="9" fill={c.main} />
      </g>
      <g opacity={stage >= 6 ? 1 : 0.1}>
        <rect x="-33" y="-89" width="17" height="23" rx="8" fill="#b6fff5" />
        <rect x="15" y="-89" width="17" height="23" rx="8" fill="#b6fff5" />
        <path
          d="M-6-65q6 6 12 0"
          fill="none"
          stroke="#b6fff5"
          strokeWidth="3"
        />
      </g>
      <g opacity={stage >= 7 ? 1 : 0.1}>
        {design === 'garden' ? (
          <>
            <path d="M0-125v-30" stroke={c.dark} strokeWidth="7" />
            <path
              d="M0-140q-40-1-29-28 30-2 29 28M0-145q1-34 31-26 8 23-31 26"
              fill="#64cb81"
            />
            <path d="M-24-36h47" stroke="#fff3aa" strokeWidth="6" />
          </>
        ) : design === 'aqua' ? (
          <>
            <path d="M-57-113-25-145h48l33 32" fill={c.main} />
            <path
              d="M-65-100-27-132H8"
              fill="none"
              stroke={c.light}
              strokeWidth="5"
            />
            <path d="M-59 5-33 25-59 36M59 5 33 25 59 36" fill={c.light} />
            <circle
              cx="-89"
              cy="-127"
              r="8"
              fill="none"
              stroke="#95ecf4"
              strokeWidth="3"
            />
            <circle
              cx="83"
              cy="-149"
              r="5"
              fill="none"
              stroke="#95ecf4"
              strokeWidth="3"
            />
          </>
        ) : (
          <>
            <path d="M0-125v-27" stroke={c.dark} strokeWidth="6" />
            <circle cx="0" cy="-156" r="10" fill="#ffbb78" />
            <path d="M-24-37h47" stroke={c.main} strokeWidth="5" />
          </>
        )}
      </g>
      {stage >= 8 && (
        <g fill="#ffe6a0">
          <path d="m-113-95 4 12 12 4-12 4-4 12-4-12-12-4 12-4zM99-51l3 9 9 3-9 3-3 9-3-9-9-3 9-3z" />
          <circle cx="-89" cy="-21" r="3" />
          <circle cx="90" cy="-98" r="4" />
        </g>
      )}
    </g>
  );
}

export function RobotPortrait({
  design,
  palette,
}: {
  design: Design;
  palette: Palette;
}) {
  return (
    <svg
      viewBox="-145 -185 290 345"
      aria-hidden="true"
      focusable="false"
      className="robot-portrait"
    >
      <ellipse cy="135" rx="83" ry="13" fill="#163849" opacity=".12" />
      <Robot design={design} palette={palette} />
    </svg>
  );
}

function Palm({ x, y, scale = 1 }: { x: number; y: number; scale?: number }) {
  return (
    <g transform={`translate(${x} ${y}) scale(${scale})`}>
      <ellipse cy="4" rx="27" ry="9" fill="#277d69" opacity=".22" />
      <path d="M0 0q10-25-3-59" fill="none" stroke="#aa7952" strokeWidth="10" />
      <path
        d="M-3-59q-41-18-53 8 29-8 53-8M-3-59q-4-45-31-35 18 12 31 35M-3-59q20-42 42-19-27 5-42 19M-3-59q47-6 47 24-24-21-47-24M-3-59q-25-2-22 31 10-18 22-31"
        fill="#268d68"
      />
      <path
        d="M-3-59q26-20 40-16M-3-59q-31-8-46 6"
        fill="none"
        stroke="#75d495"
        strokeWidth="3"
      />
      <circle cx="-1" cy="-54" r="6" fill="#dc9b61" />
    </g>
  );
}

export const islandBuildings = [
  'Brücke',
  'Baumhaus',
  'Garten',
  'Werkstatt',
  'Sternwarte',
  'Leuchtturm',
];

function IslandBuilding({
  index,
  palette,
}: {
  index: number;
  palette: Palette;
}) {
  const c = colors[palette];
  if (index === 0)
    return (
      <g>
        <path d="m-38 13 31-33 59 21-31 34z" fill="#a27150" />
        <path d="m-35 6 30-33 59 21-31 34z" fill="#efd297" />
        {[0, 1, 2, 3, 4, 5].map((n) => (
          <path
            key={n}
            d={`m${-29 + n * 10} ${9 + n * 3.5} 30-33`}
            stroke="#c59a65"
            strokeWidth="2"
          />
        ))}
        <path
          d="m-38 6v-18L19 8v18M-8-26v-16L51-21V-4"
          fill="none"
          stroke="#986146"
          strokeWidth="5"
        />
        <path d="m-38-14 57 21m-27-49 59 21" stroke="#f5dfac" strokeWidth="4" />
      </g>
    );
  if (index === 2)
    return (
      <g>
        <path d="m-50 0 48-26 54 26L4 28z" fill="#e4c388" />
        <path d="m-40-1 38-19 42 19L3 20z" fill="#735d4e" />
        {[-18, 0, 18].flatMap((x, i) =>
          [-10, 5].map((y, j) => (
            <g
              key={`${i}-${j}`}
              transform={`translate(${x + j * 9} ${y + i * 3})`}
            >
              <path d="M0 0v-11" stroke="#dcf39c" strokeWidth="3" />
              <path
                d="M0-6q-13 1-12-10 13-2 12 10M0-6q0-13 12-10 2 9-12 10"
                fill="#83d68b"
              />
              <circle cy="-13" r="4" fill={i % 2 ? '#ffbe69' : '#ed8677'} />
            </g>
          )),
        )}
        <path
          d="m-52 3 54 28 52-29"
          fill="none"
          stroke="#f9ebc0"
          strokeWidth="5"
        />
      </g>
    );
  if (index === 5)
    return (
      <g>
        <ellipse cy="6" rx="29" ry="13" fill="#f2dcaa" />
        <path d="M-17 0-11-75H9L18 0q-17 10-35 0" fill="#fff4d2" />
        <path d="m-15-18 30 1-2-20-27-1zm3-37 24 1-2-18h-20z" fill="#ee886f" />
        <path d="M-15-76v-17h29v18" fill="#304b64" />
        <path d="M-8-90H7v12H-8z" fill="#ffe799" />
        <path d="m-23-94 23-17 22 17z" fill={c.dark} />
        <path d="M-4 4v-17h9V4" fill="#34546a" />
        <path d="M20-85 70-100v30z" fill="#fff0b0" opacity=".3" />
      </g>
    );
  if (index === 4)
    return (
      <g>
        <path d="M-32-5v-39h65V-5q-32 17-65 0" fill="#d8e5ef" />
        <path d="M-34-44a34 34 0 0 1 68 0z" fill={c.main} />
        <path d="M1-77q-19 13-15 33H1z" fill={c.light} />
        <path d="m12-59 24-22 8 10-24 23z" fill="#344e66" />
        <path d="m35-81 8-5 9 11-8 5z" fill="#ecf5ee" />
        <path d="M-5 5v-29H9V5" fill="#344e66" />
        <circle cx="-21" cy="-25" r="5" fill="#f7c96e" />
      </g>
    );
  return (
    <g>
      {index === 1 && (
        <>
          <path d="M-17 6v-29M22 6v-29" stroke="#927050" strokeWidth="8" />
          <circle cx="-22" cy="-61" r="30" fill="#409c6e" />
          <circle cx="15" cy="-74" r="33" fill="#6bc488" />
        </>
      )}
      <path d="m-35-10 38 18 34-19v-45L0-38-35-55z" fill="#fff0cc" />
      <path d="M3 8v-46l34-18v45z" fill="#dfc294" />
      <path d="m-44-52 43-34 47 27L3-29z" fill={c.dark} />
      <path d="m-44-52 43-34 4 57z" fill={c.main} />
      <path d="m-29-51 26-22m-15 30 16-14" stroke={c.light} strokeWidth="3" />
      <path d="m-24-31 17 8v14l-17-8z" fill="#568a9d" />
      <path d="m15-28 13-7v23L15-5z" fill="#58617b" />
      {index === 3 && (
        <>
          <path d="M22-72v-24l12 5v27" fill="#d5b0a1" />
          <path
            d="m-44-9 49 23 37-22"
            fill="none"
            stroke="#c89b6d"
            strokeWidth="5"
          />
          <circle cx="-20" cy="-23" r="5" fill="#f9ce76" />
        </>
      )}
    </g>
  );
}

function Island({
  palette,
  progress,
  completed,
  id,
}: {
  palette: Palette;
  progress: number;
  completed: number;
  id: string;
}) {
  const sites = [
    [404, 348],
    [205, 229],
    [399, 271],
    [263, 315],
    [363, 193],
    [500, 227],
  ];
  const previousStages = Math.max(0, completed - (progress === 8 ? 1 : 0));
  const current = previousStages % 6;
  const firstTour = previousStages < 6;
  return (
    <>
      <rect width="660" height="460" fill={`url(#${id}-sea)`} />
      <circle cx="578" cy="68" r="31" fill="#fff4bb" opacity=".95" />
      <g
        fill="none"
        stroke="#b9f4ed"
        strokeWidth="3"
        strokeLinecap="round"
        opacity=".5"
      >
        <path d="M39 137h36m13 0h9M515 375h43m12 0h17M80 347h38m-4-222h39M416 77h41m18 0h12M512 127h63M152 410h42m12 0h18M45 250h27" />
        <path
          d="M106 286c-61 58 16 109 151 118 184 12 358-90 325-173"
          strokeWidth="2"
        />
      </g>
      <path
        d="M96 271Q80 224 161 189L199 144q32-32 97-12 47-34 101-13 67-4 75 45 86 14 91 74 46 38-4 67-8 60-111 65-22 41-94 17-77 26-123-15-99 2-110-46z"
        fill="#278f90"
        opacity=".35"
        transform="translate(0 24)"
      />
      <path
        d="M96 271Q80 224 161 189L199 144q32-32 97-12 47-34 101-13 67-4 75 45 86 14 91 74 46 38-4 67-8 60-111 65-22 41-94 17-77 26-123-15-99 2-110-46z"
        fill="#eac691"
      />
      <path
        d="M103 255q-6-36 65-59l45-47q30-23 85-6 44-33 96-12 61-4 68 43 78 13 86 64 42 28-2 61-20 42-101 52-27 27-87 11-70 22-124-16-88 4-99-41z"
        fill="#f9e3ad"
      />
      <path
        d="M124 250q-4-28 63-43l37-44q27-20 74-4 39-27 91-11 57-3 61 40 73 11 80 52 31 23-5 43-21 40-84 48-30 26-76 10-65 23-119-15-82 3-92-33z"
        fill={`url(#${id}-grass)`}
      />
      <path
        d="m208 235 55 61 79-33 29-60m-24 61 64 27 72-63m-72 63-10 47"
        fill="none"
        stroke="#e9d7a0"
        strokeWidth="18"
        strokeLinecap="round"
        strokeLinejoin="round"
      />
      <path
        d="m208 235 55 61 79-33 29-60m-24 61 64 27 72-63m-72 63-10 47"
        fill="none"
        stroke="#f7e9c2"
        strokeWidth="9"
        strokeLinecap="round"
        strokeLinejoin="round"
      />
      <Palm x={148} y={247} scale={0.78} />
      <Palm x={452} y={174} scale={0.68} />
      <g fill="#d9f0a7">
        <ellipse cx="265" cy="166" rx="10" ry="5" />
        <ellipse cx="284" cy="171" rx="7" ry="4" />
        <ellipse cx="455" cy="307" rx="10" ry="4" />
      </g>
      {sites.map(([x, y], index) => {
        const built = !firstTour || index < current;
        const active = index === current;
        const showBuilding = built || (active && progress >= 4);
        return (
          <g key={index} transform={`translate(${x} ${y})`}>
            <ellipse
              cy="5"
              rx="45"
              ry="16"
              fill="#358574"
              opacity={showBuilding ? '.18' : '.1'}
            />
            {showBuilding ? (
              <g opacity={built || progress >= 8 ? 1 : 0.65}>
                <IslandBuilding index={index} palette={palette} />
              </g>
            ) : (
              <>
                <path
                  d="m-34 0 34-17 34 17L0 17z"
                  fill="#afce8c"
                  stroke="#f7e9b5"
                  strokeWidth="2"
                  strokeDasharray="5 4"
                />
                {active && progress > 0 && (
                  <g stroke="#c29564" strokeWidth="4" fill="none">
                    <path d="M-28 0v-27L0-41l28 14V0M0 14v-28M-28-27 0-14l28-13" />
                  </g>
                )}
              </>
            )}
            {active && (
              <g transform="translate(34 -43)">
                <path d="M0 25V-8" stroke="#486d67" strokeWidth="3" />
                <path d="M1-8h22L16 0l7 8H1z" fill="#f1836b" />
              </g>
            )}
            {!firstTour && <circle cx="-19" cy="4" r="4" fill="#f9a96f" />}
          </g>
        );
      })}
      <Palm x={179} y={342} scale={0.85} />
      <g transform="translate(547 320)">
        <ellipse cy="23" rx="32" ry="7" fill="#ecffed" opacity=".3" />
        <path d="m-28 2 56 0-10 17h-34z" fill="#fff0ce" />
        <path d="M0 2v-52L-24-4H-2z" fill="#f48978" />
        <path d="M4-42v36h22z" fill="#fff1cd" />
      </g>
      <g stroke="#f6fff0" strokeWidth="3" fill="none" strokeLinecap="round">
        <path d="M81 79q8-7 16 0 8-7 16 0M116 64q6-6 12 0 6-6 12 0" />
      </g>
    </>
  );
}

function Workshop({
  design,
  palette,
  progress,
  id,
}: {
  design: Design;
  palette: Palette;
  progress: number;
  id: string;
}) {
  const c = colors[palette];
  return (
    <>
      <rect width="660" height="460" fill={`url(#${id}-room)`} />
      <circle cx="325" cy="204" r="193" fill="#416477" opacity=".15" />
      <path d="M0 369 330 281 660 369v91H0z" fill="#203749" />
      <g stroke="#466471" strokeWidth="1" opacity=".32">
        {[0, 1, 2, 3, 4, 5].map((n) => (
          <path
            key={n}
            d={`M${n * 110 - 150} 460 330 281 ${n * 110 + 150} 460M0 ${369 + n * 27}l330-88 330 88`}
          />
        ))}
      </g>
      <rect
        x="49"
        y="56"
        width="177"
        height="183"
        rx="19"
        fill="#1c3247"
        stroke="#435b6e"
        strokeWidth="2"
      />
      <rect x="60" y="67" width="155" height="161" rx="12" fill="#29495b" />
      <g fill="#547488" opacity=".55">
        {[0, 1, 2, 3, 4, 5].flatMap((x) =>
          [0, 1, 2, 3, 4, 5].map((y) => (
            <circle key={`${x}-${y}`} cx={75 + x * 25} cy={81 + y * 26} r="2" />
          )),
        )}
      </g>
      <g strokeLinecap="round">
        <path d="m87 112 24 37" stroke="#a5c7cc" strokeWidth="11" />
        <path
          d="m85 106-9-5 3-11m10 11 8-9-7-8"
          stroke="#a5c7cc"
          strokeWidth="6"
          fill="none"
        />
        <path d="m171 92-23 38" stroke="#e9b574" strokeWidth="13" />
        <path d="m143 138-18 28" stroke="#9ebdc6" strokeWidth="5" />
        <path d="M81 185h33m-24-10v21" stroke="#76d9b9" strokeWidth="8" />
        <path d="m180 163-16 34m-2-34 17 34" stroke="#9ebdc6" strokeWidth="6" />
        <circle
          cx="163"
          cy="202"
          r="8"
          stroke="#f09a79"
          strokeWidth="5"
          fill="none"
        />
        <circle
          cx="182"
          cy="202"
          r="8"
          stroke="#f09a79"
          strokeWidth="5"
          fill="none"
        />
      </g>
      <path
        d="M478 222v-85h106v85"
        fill="#233c4f"
        stroke="#526b7b"
        strokeWidth="3"
      />
      <rect x="489" y="146" width="84" height="62" rx="5" fill="#152d40" />
      <path
        d="M498 183h12l7-15 10 26 10-21 8 10h18"
        stroke={c.main}
        strokeWidth="3"
        fill="none"
      />
      <path d="M510 223h35m-18-9v9" stroke="#809ca9" strokeWidth="5" />
      <path d="m458 234 125-3 37 20-122 7z" fill="#657e86" />
      <path d="m498 258 122-7v23l-122 7z" fill="#354f60" />
      <path d="M500 278v50m103-56v52" stroke="#162f42" strokeWidth="9" />
      <g transform="translate(462 285)">
        <path d="m0 0 45 5 23-15-42-5z" fill="#fedc8d" />
        <path d="m0 0 45 5v39L0 37z" fill="#d39d64" />
        <path d="m45 5 23-15v39L45 44z" fill="#ac7651" />
        <path d="m19 2 11 1v14l-11-1" fill="#f6d99d" />
      </g>
      <ellipse cx="325" cy="368" rx="147" ry="48" fill="#102c3c" opacity=".8" />
      <path d="M178 334v25c0 28 294 28 294 0v-25" fill="#3a6370" />
      <ellipse cx="325" cy="334" rx="147" ry="47" fill="#587e84" />
      <ellipse cx="325" cy="331" rx="130" ry="36" fill="#284c5c" />
      <ellipse
        cx="325"
        cy="331"
        rx="119"
        ry="30"
        fill="none"
        stroke={c.main}
        strokeWidth="2"
        opacity=".65"
      />
      <path
        d="M275 380h100"
        stroke={c.main}
        strokeWidth="5"
        strokeLinecap="round"
      />
      <g transform="translate(325 205)">
        <Robot design={design} palette={palette} progress={progress} />
      </g>
      <path d="M306 0v20m38-20v20" stroke="#647e8a" strokeWidth="5" />
      <path d="m274 45 26-27h50l26 27z" fill="#9fbab8" />
      <ellipse cx="325" cy="46" rx="51" ry="9" fill="#eff8ce" />
      <path d="m285 49-52 184h184L365 49z" fill={`url(#${id}-beam)`} />
      <g transform="translate(66 315)">
        <path d="m0 0 50-12 34 17-49 13z" fill="#b3c2b7" />
        <path d="M0 0v38l35 17V18z" fill="#779290" />
        <path d="m35 18 49-13v37L35 55z" fill="#4d7078" />
        <path d="m12 22 11 5m26 1 21-6" stroke="#d3dcc7" strokeWidth="4" />
      </g>
    </>
  );
}

export function AdventureScene({
  world,
  design,
  palette,
  progress,
  completed,
}: {
  world: World;
  design: Design;
  palette: Palette;
  progress: number;
  completed: number;
}) {
  const id = useId().replace(/:/g, '');
  const title =
    world === 'workshop'
      ? `Dein Roboter entsteht: ${progress} von 8 Bauschritten.`
      : `Deine Einmaleins-Insel: ${completed} Bauetappen fertig. ${islandBuildings[Math.max(0, completed - (progress === 8 ? 1 : 0)) % 6]}: ${progress} von 8 Bauschritten.`;
  return (
    <svg
      className="adventure-art"
      viewBox="0 0 660 460"
      role="img"
      aria-labelledby={`${id}-title`}
      focusable="false"
    >
      <title id={`${id}-title`}>{title}</title>
      <defs>
        <linearGradient id={`${id}-room`} x2="1" y2="1">
          <stop stopColor="#183345" />
          <stop offset="1" stopColor="#30495e" />
        </linearGradient>
        <linearGradient id={`${id}-beam`} x2="0" y2="1">
          <stop stopColor="#eaffd6" stopOpacity=".09" />
          <stop offset="1" stopColor="#eaffd6" stopOpacity="0" />
        </linearGradient>
        <linearGradient id={`${id}-sea`} x2=".5" y2="1">
          <stop stopColor="#77ddd7" />
          <stop offset="1" stopColor="#39aebc" />
        </linearGradient>
        <linearGradient id={`${id}-grass`} x2="0" y2="1">
          <stop stopColor="#a8d78e" />
          <stop offset="1" stopColor="#71b987" />
        </linearGradient>
      </defs>
      {world === 'workshop' ? (
        <Workshop
          design={design}
          palette={palette}
          progress={progress}
          id={id}
        />
      ) : (
        <Island
          palette={palette}
          progress={progress}
          completed={completed}
          id={id}
        />
      )}
    </svg>
  );
}

export function multiplicationParts(left: number) {
  const split = left > 10 ? 10 : left > 5 ? 5 : left > 1 ? 1 : 0;
  const first = split || left;
  return { first, rest: left - first };
}

/** Shown only on request. No product value is printed, including in accessible text. */
export function MultiplicationHint({
  left,
  right,
}: {
  left: number;
  right: number;
}) {
  const { first, rest } = multiplicationParts(left);
  const large = left > 10 || right > 10;
  const cell = Math.min(26, 220 / right, 200 / left);
  const width = right * cell;
  const height = left * cell;
  const firstHeight = first * cell;
  const description = rest
    ? `Zerlege ${left} in ${first} und ${rest}. Rechne ${first} × ${right} und ${rest} × ${right}. Zähle die beiden Ergebnisse zusammen.`
    : `${left} ${left === 1 ? 'Reihe' : 'Reihen'} mit je ${right} ${right === 1 ? 'Platz' : 'Plätzen'}. ${left === 1 ? 'Bei einmal nimmst du die Zahl genau einmal.' : 'Zähle in gleich großen Schritten.'}`;
  return (
    <div className="multiplication-visual-hint">
      <p>{description}</p>
      <svg
        viewBox={`0 0 380 ${Math.max(height + 65, 145)}`}
        role="img"
        aria-label={description}
        className="adventure-hint-art"
      >
        <g transform="translate(36 34)">
          <rect
            width={width}
            height={firstHeight}
            rx="4"
            fill="#b6edda"
            stroke="#238c72"
            strokeWidth="2"
          />
          {rest > 0 && (
            <rect
              y={firstHeight}
              width={width}
              height={height - firstHeight}
              rx="4"
              fill="#ffe4b0"
              stroke="#b47635"
              strokeWidth="2"
            />
          )}
          {!large &&
            Array.from({ length: left }, (_, row) =>
              Array.from({ length: right }, (_, col) => (
                <circle
                  key={`${row}-${col}`}
                  cx={(col + 0.5) * cell}
                  cy={(row + 0.5) * cell}
                  r={Math.max(2, cell * 0.16)}
                  fill={row < first ? '#247c68' : '#a56b30'}
                />
              )),
            )}
          <text
            x={width / 2}
            y="-12"
            textAnchor="middle"
            fill="#26463f"
            fontSize="17"
          >
            {right} pro Reihe
          </text>
          <text
            x={width + 15}
            y={firstHeight / 2 + 6}
            fill="#245c4e"
            fontSize="17"
          >
            {first} × {right}
          </text>
          {rest > 0 && (
            <text
              x={width + 15}
              y={firstHeight + (height - firstHeight) / 2 + 6}
              fill="#81521d"
              fontSize="17"
            >
              {rest} × {right}
            </text>
          )}
        </g>
      </svg>
      {left === right && (
        <p>
          Beide Seiten sind gleich lang. Daher heißt {left} × {right} auch{' '}
          {left}² („{left} zum Quadrat“).
        </p>
      )}
      <p>
        Erkläre dir deinen Rechenweg kurz selbst. Danach rechne ohne Bild
        weiter.
      </p>
    </div>
  );
}
