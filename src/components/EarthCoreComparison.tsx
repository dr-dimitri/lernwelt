export default function EarthCoreComparison({ inner }: { inner: boolean }) {
  return (
    <svg
      viewBox="0 0 640 320"
      className="earth-core-picture"
      role="img"
      aria-label={
        inner
          ? 'Illustration: fester innerer Kern unter hohem Druck'
          : 'Illustration: flüssiges Metall im äußeren Kern'
      }
    >
      <rect
        x="18"
        y="18"
        width="604"
        height="284"
        rx="28"
        fill={inner ? '#ffefc3' : '#f2cc78'}
      />
      <g fill="#c86538" stroke="#6f3c27" strokeWidth="2">
        {Array.from({ length: 15 }, (_, i) => (
          <circle
            key={i}
            r="15"
            cx={inner ? 245 + (i % 5) * 36 : 140 + ((i * 79) % 340)}
            cy={inner ? 120 + Math.floor(i / 5) * 36 : 87 + ((i * 57) % 140)}
          />
        ))}
      </g>
      {inner ? (
        <g stroke="#683b2a" strokeWidth="8" fill="none">
          <path d="M150 156h57m-14 -14 14 14 -14 14M490 156h-57m14 -14 -14 14 14 14M318 56v37m-14 -14 14 14 14 -14M318 272v-37m-14 14 14 -14 14 14" />
        </g>
      ) : (
        <g stroke="#683b2a" strokeWidth="4" fill="none">
          <path d="M220 72q40 -30 80 0m-15 -17 15 17 -22 3M395 240q-40 30 -80 0m15 17 -15 -17 22 -3" />
        </g>
      )}
      <text x="320" y="292" textAnchor="middle" fill="#4d2c1e" fontSize="18">
        {inner
          ? '▰ Fest · stark zusammengedrückt'
          : '≈ Flüssig · Metall kann fließen'}
      </text>
    </svg>
  );
}
