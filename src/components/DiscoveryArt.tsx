import type { SubjectId } from '../domain/subjects';

// Decorative, locally bundled drawings. Learning diagrams live with the lessons.
export default function DiscoveryArt() {
  return (
    <svg
      className="discovery-art"
      viewBox="0 0 320 220"
      fill="none"
      aria-hidden="true"
    >
      <circle cx="170" cy="110" r="92" fill="#7161bc" />
      <circle cx="170" cy="110" r="72" stroke="#a89bdd" strokeDasharray="3 9" />
      <ellipse
        cx="166"
        cy="119"
        rx="145"
        ry="47"
        transform="rotate(-24 166 119)"
        stroke="#a89bdd"
      />
      <g transform="rotate(-12 155 112)">
        <path
          d="M78 58h72l14 12 14-12h68v125h-68l-14 10-14-10H78V58Z"
          fill="#c2b7ef"
        />
        <path
          d="M86 50h60l18 12 18-12h56v121h-56l-18 11-18-11H86V50Z"
          fill="#fffaf1"
        />
        <path d="M164 64v109" stroke="#c2b7ef" strokeWidth="2" />
        <path
          d="M102 78h36m-36 12h27m-27 12h33m51 24h34m-34 12h25m-25 12h31"
          stroke="#c2b7ef"
          strokeWidth="4"
          strokeLinecap="round"
        />
        <path
          d="m107 134 9 9 20-22"
          stroke="#6550ac"
          strokeWidth="5"
          strokeLinecap="round"
          strokeLinejoin="round"
        />
        <circle cx="204" cy="92" r="17" fill="#ffd49b" />
        <path
          d="M204 82v20m-10-10h20"
          stroke="#785013"
          strokeWidth="3"
          strokeLinecap="round"
        />
      </g>
      <g transform="rotate(24 258 149)">
        <path d="M250 103h16v76l-8 16-8-16v-76Z" fill="#ffad87" />
        <path d="m250 179 8 16 8-16" fill="#fffaf1" />
        <path d="m255 189 3 6 3-6" fill="#26253b" />
        <path d="M250 119h16" stroke="#fffaf1" strokeWidth="4" />
      </g>
      <path d="m68 28 5 15 15 5-15 5-5 15-5-15-15-5 15-5Z" fill="#ffca98" />
      <circle cx="265" cy="47" r="7" fill="#b8dfcd" />
      <circle cx="47" cy="154" r="5" fill="#b8dfcd" />
      <path
        d="M113 197h12m-6-6v12"
        stroke="#ffca98"
        strokeWidth="3"
        strokeLinecap="round"
      />
    </svg>
  );
}

export function SubjectArt({
  subject,
  symbol,
}: {
  subject: SubjectId;
  symbol: string;
}) {
  return (
    <svg
      className="subject-art"
      viewBox="0 0 320 150"
      fill="none"
      aria-hidden="true"
    >
      {subject === 'mathematics' ? (
        <>
          <circle cx="204" cy="76" r="61" fill="#cbbaf4" />
          <g transform="rotate(-12 110 78)">
            <rect
              x="56"
              y="31"
              width="91"
              height="100"
              rx="14"
              fill="#6550ac"
            />
            <rect x="69" y="44" width="65" height="22" rx="5" fill="#e9defc" />
            <path
              d="M75 84h12m-6-6v12m27-6h12m-45 27 10-10m-10 0 10 10m23-9h12m-12 8h12"
              stroke="#fffaf1"
              strokeWidth="4"
              strokeLinecap="round"
            />
          </g>
          <path
            d="m169 110 38-76 48 76h-86Z"
            fill="#fffbf5"
            stroke="#8e75c3"
            strokeWidth="2"
          />
          <path d="m207 56-22 44h50l-28-44Z" fill="#dbcdf5" />
          <path
            d="M250 29v19m-9-10h18"
            stroke="#6550ac"
            strokeWidth="3"
            strokeLinecap="round"
          />
          <circle cx="44" cy="106" r="4" fill="#8e75c3" />
        </>
      ) : subject === 'english' ? (
        <>
          <circle cx="170" cy="76" r="61" fill="#f7b990" />
          <g transform="rotate(-9 123 68)">
            <path d="M54 33h137v68h-80l-24 20v-20H54V33Z" fill="#fffaf1" />
            <text x="75" y="79" fill="#954729" fontSize="34" fontWeight="750">
              Hello!
            </text>
          </g>
          <g transform="rotate(8 221 98)">
            <path d="M165 75h96v52h-23v14l-19-14h-54V75Z" fill="#954729" />
            <path
              d="M184 97h53m-53 12h34"
              stroke="#ffe3ce"
              strokeWidth="4"
              strokeLinecap="round"
            />
          </g>
          <path d="m252 22 3 9 9 3-9 3-3 9-3-9-9-3 9-3Z" fill="#954729" />
          <circle cx="49" cy="119" r="5" fill="#cb744c" />
        </>
      ) : subject === 'geography' ? (
        <>
          <rect width="320" height="150" rx="13" fill="#102039" />
          <ellipse
            cx="160"
            cy="77"
            rx="113"
            ry="34"
            transform="rotate(-18 160 77)"
            stroke="#829ec7"
          />
          <ellipse
            cx="160"
            cy="77"
            rx="73"
            ry="22"
            transform="rotate(-18 160 77)"
            stroke="#829ec7"
          />
          <circle cx="160" cy="77" r="24" fill="#ffd17d" />
          <circle cx="227" cy="52" r="13" fill="#8dc6eb" />
          <circle cx="78" cy="119" r="17" fill="#d3ad83" />
          <ellipse
            cx="78"
            cy="119"
            rx="30"
            ry="7"
            transform="rotate(-18 78 119)"
            stroke="#edd2a2"
            strokeWidth="4"
          />
          <circle cx="110" cy="67" r="8" fill="#e18760" />
          <path
            d="M52 30v8m-4-4h8M260 105v8m-4-4h8"
            stroke="#dae9ff"
            strokeWidth="2"
          />
          <circle cx="260" cy="25" r="2" fill="#dae9ff" />
        </>
      ) : subject === 'nature' ? (
        <>
          <circle cx="173" cy="76" r="61" fill="#a5d3c0" />
          <path
            d="M155 121V57m0 36c-38 0-58-18-58-44 38 0 58 18 58 44Zm0-17c0-30 20-47 51-47 0 30-20 47-51 47Z"
            fill="#2d775d"
          />
          <path
            d="m107 61 48 32m38-51-38 34"
            stroke="#b8dfcd"
            strokeWidth="2"
          />
          <circle
            cx="227"
            cy="85"
            r="30"
            fill="#f4fbf5"
            stroke="#285d4b"
            strokeWidth="6"
          />
          <path
            d="m248 107 24 24"
            stroke="#285d4b"
            strokeWidth="10"
            strokeLinecap="round"
          />
          <path
            d="M215 86h24m-12-12v24"
            stroke="#a5d3c0"
            strokeWidth="3"
            strokeLinecap="round"
          />
          <path
            d="M69 94v16m-8-8h16"
            stroke="#285d4b"
            strokeWidth="3"
            strokeLinecap="round"
          />
          <circle cx="247" cy="30" r="4" fill="#2d775d" />
        </>
      ) : (
        <text
          x="160"
          y="97"
          textAnchor="middle"
          fill="currentColor"
          fontSize="60"
        >
          {symbol}
        </text>
      )}
    </svg>
  );
}
