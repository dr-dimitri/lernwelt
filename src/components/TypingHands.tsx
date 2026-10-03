import { useId } from 'react';
import {
  typingFingers,
  type TypingDigit,
  type TypingHand,
  type TypingKeyHint,
} from '../domain/typing';

const handOutline =
  'M72 228 67 185C50 173 34 149 33 132L23 93Q19 80 28 77Q39 72 44 85L58 119 50 55Q47 40 59 37Q71 34 76 49L93 116 88 32Q87 16 100 15Q113 14 116 29L123 111 127 48Q127 33 139 33Q152 33 153 47L155 133 185 104Q197 93 206 102Q215 112 205 125L179 155C171 175 164 185 155 188L153 228Z';

// Anatomical drawing coordinates; key and finger assignments come from the domain model.
const fingerShapes: Record<
  TypingDigit,
  { path: string; x: number; y: number }
> = {
  little: { path: 'M31 88 46 130', x: 31, y: 87 },
  ring: { path: 'M62 48 81 124', x: 62, y: 48 },
  middle: { path: 'M103 28 112 123', x: 103, y: 29 },
  index: { path: 'M141 45 142 131', x: 141, y: 46 },
  thumb: { path: 'M198 112 162 152', x: 197, y: 113 },
};

function Hand({
  hand,
  hint,
}: {
  hand: TypingHand;
  hint: TypingKeyHint | null;
}) {
  const mirrored = hand === 'right';
  return (
    <g
      transform={
        mirrored ? 'translate(545 18) scale(-1 1)' : 'translate(15 18)'
      }
    >
      <path className="typing-hand-outline" d={handOutline} />
      <path
        className="typing-hand-joints"
        d="M63 147q35-18 80 2m-58 18q27-10 54-3M74 202h73"
      />
      {typingFingers
        .filter((finger) => finger.hand === hand)
        .map((finger) => {
          const shape = fingerShapes[finger.digit];
          const status =
            hint?.fingerId === finger.id
              ? 'active'
              : hint?.shiftFingerId === finger.id
                ? 'shift'
                : hint?.choiceFingerIds.includes(finger.id)
                  ? 'choice'
                  : 'rest';
          return (
            <g
              key={finger.id}
              data-finger={finger.id}
              data-status={status}
              className={`typing-hand-finger ${status}`}
            >
              <path className="typing-finger-trace" d={shape.path} />
              <g
                transform={`translate(${shape.x} ${shape.y})${mirrored ? ' scale(-1 1)' : ''}`}
              >
                <circle className="typing-finger-marker" r="14" />
                <text
                  className="typing-finger-key"
                  textAnchor="middle"
                  dominantBaseline="central"
                >
                  {finger.digit === 'thumb' ? '␣' : finger.homeKey}
                </text>
                {(status === 'active' || status === 'shift') && (
                  <>
                    <circle className="typing-finger-active-ring" r="18" />
                    <text
                      className="typing-finger-action"
                      x="0"
                      y="-23"
                      textAnchor="middle"
                    >
                      {status === 'shift' ? 'Shift' : '●'}
                    </text>
                  </>
                )}
              </g>
            </g>
          );
        })}
    </g>
  );
}

export default function TypingHands({
  hint,
  correcting = false,
}: {
  hint: TypingKeyHint | null;
  correcting?: boolean;
}) {
  const id = useId();
  const activeFinger = typingFingers.find(
    (finger) => finger.id === hint?.fingerId,
  );
  const shiftFinger = typingFingers.find(
    (finger) => finger.id === hint?.shiftFingerId,
  );
  const homeKeys = (hand: TypingHand) =>
    typingFingers
      .filter((finger) => finger.hand === hand && finger.digit !== 'thumb')
      .map((finger) => finger.homeKey)
      .join(' · ');
  const activity = hint?.choiceFingerIds.length
    ? 'Für die Leertaste: Wähle einen Daumen. Die beiden gestrichelten Markierungen zeigen deine Wahlmöglichkeiten; drücke nur mit einem Daumen.'
    : activeFinger
      ? `${correcting ? 'Zum Verbessern' : 'Für die nächste Taste'}: ${activeFinger.name}${shiftFinger ? `; dazu ${shiftFinger.name} für Shift` : ''}. Nach der Taste kehrt der Finger in die Grundstellung zurück.`
      : hint
        ? 'Für dieses Zeichen gibt es hier keine Fingerzuordnung. Suche die Taste auf deiner Tastatur.'
        : 'Die Hände zeigen die Grundstellung. Gerade ist kein Finger für eine nächste Taste markiert.';

  return (
    <div className="typing-hands-help">
      <div className="typing-hands-heading">
        <h4>So liegen deine Hände</h4>
        <span>Grundstellung · schematisch</span>
      </div>
      <svg
        className="typing-hands-diagram"
        viewBox="0 0 560 280"
        role="img"
        aria-labelledby={`${id}-title`}
        aria-describedby={`${id}-description`}
      >
        <title id={`${id}-title`}>
          Grundstellung der Hände auf einer deutschen QWERTZ-Tastatur
        </title>
        <desc id={`${id}-description`}>
          Draufsicht: Finger oben, Unterarme unten, Daumen innen. Links:{' '}
          {homeKeys('left')}. Rechts: {homeKeys('right')}. Beide Daumen liegen
          locker über der Leertaste. {activity}
        </desc>
        <g aria-hidden="true">
          <Hand hand="left" hint={hint} />
          <Hand hand="right" hint={hint} />
          <path
            className="typing-thumb-guide"
            d="M213 143 252 174M347 143 308 174"
          />
          <rect
            className="typing-hand-space-key"
            x="218"
            y="171"
            width="124"
            height="29"
            rx="6"
          />
          <text
            className="typing-hand-space-label"
            x="280"
            y="191"
            textAnchor="middle"
          >
            Leertaste
          </text>
          <text
            className="typing-hand-label"
            x="126"
            y="269"
            textAnchor="middle"
          >
            Linke Hand
          </text>
          <text
            className="typing-hand-label"
            x="434"
            y="269"
            textAnchor="middle"
          >
            Rechte Hand
          </text>
        </g>
      </svg>
      <p className="typing-hand-home">
        Links: {homeKeys('left')}. Rechts: {homeKeys('right')}.
      </p>
      <p className="typing-hand-activity">{activity}</p>
      <div className="typing-posture">
        <svg
          viewBox="0 0 220 95"
          className="typing-posture-diagram"
          role="img"
          aria-label="Seitenansicht: Handgelenk in Linie mit dem Unterarm, Finger leicht gekrümmt über den Tasten"
        >
          <path
            className="typing-posture-arm"
            d="M8 30 78 32Q109 24 138 32Q166 36 180 55Q185 64 176 67Q169 68 161 56L141 50 128 50 91 49 8 50"
          />
          <path className="typing-posture-line" d="M10 40 90 40 137 41" />
          <path
            className="typing-posture-keyboard"
            d="M83 84h124M99 82v-8h24v8m5 0v-8h24v8m5 0v-8h24v8"
          />
          <path className="typing-posture-motion" d="m166 18 7-7 7 7m-7-7v18" />
        </svg>
        <ul>
          <li>Finger leicht gekrümmt, Hände frei beweglich.</li>
          <li>
            Handgelenke möglichst gerade in Linie mit den Unterarmen. Schultern
            locker.
          </li>
          <li>
            Fühle die Erhebungen auf F und J mit den Zeigefingern. Die Daumen
            liegen locker über der Leertaste.
          </li>
        </ul>
      </div>
    </div>
  );
}
