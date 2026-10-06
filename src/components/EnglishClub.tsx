import InfoPanel from './InfoPanel';

export function EnglishClubPicture() {
  return (
    <figure className="english-club-picture">
      <svg
        viewBox="0 0 620 150"
        role="img"
        aria-label="Eigene Clubszene: Robin und Juno mit dem erfundenen Roboter Pip in der Schule. Sprechblasen sagen Hello und Welcome."
      >
        <rect x="1" y="1" width="618" height="148" rx="20" fill="#e5f3f4" />
        <path
          d="M24 127h572M500 24h80v74h-80zM540 24v74M500 61h80"
          stroke="#83b1b3"
          strokeWidth="4"
          fill="none"
        />
        <g transform="translate(50 36)">
          <path d="M20 91V59Q42 37 64 59v32" fill="#a77fea" />
          <circle cx="42" cy="27" r="23" fill="#e5b491" />
          <path d="M20 25q1-33 43-16l3 19-13-17-17 5z" fill="#463c54" />
          <circle cx="35" cy="27" r="2" />
          <circle cx="50" cy="27" r="2" />
          <path
            d="M36 36q7 6 13 0"
            fill="none"
            stroke="#594332"
            strokeWidth="2"
          />
          <text x="42" y="108" textAnchor="middle" fontSize="17">
            Robin
          </text>
        </g>
        <g transform="translate(240 36)">
          <path d="M20 91V59Q42 37 64 59v32" fill="#3d9290" />
          <circle cx="42" cy="27" r="23" fill="#ad765c" />
          <path d="M19 24Q15-6 48 1q25 5 18 30L50 12 28 18z" fill="#302b31" />
          <circle cx="35" cy="27" r="2" />
          <circle cx="50" cy="27" r="2" />
          <path
            d="M36 36q7 6 13 0"
            fill="none"
            stroke="#49382d"
            strokeWidth="2"
          />
          <text x="42" y="108" textAnchor="middle" fontSize="17">
            Juno
          </text>
        </g>
        <g transform="translate(419 65)">
          <rect
            x="0"
            y="0"
            width="62"
            height="54"
            rx="14"
            fill="#f9c15b"
            stroke="#8f6739"
            strokeWidth="3"
          />
          <path
            d="M31 0v-12m-6 0h12M9 54v10m44-10v10"
            stroke="#8f6739"
            strokeWidth="4"
          />
          <circle cx="19" cy="21" r="5" fill="#54415a" />
          <circle cx="44" cy="21" r="5" fill="#54415a" />
          <path
            d="M19 36q13 12 26 0"
            stroke="#54415a"
            strokeWidth="3"
            fill="none"
          />
          <text x="31" y="79" textAnchor="middle" fontSize="17">
            Pip
          </text>
        </g>
        <path
          d="M116 14h97q10 0 10 10v22q0 10-10 10h-66l-16 14V56h-15q-10 0-10-10V24q0-10 10-10"
          fill="white"
        />
        <text x="164" y="41" textAnchor="middle" fontSize="19">
          Hello!
        </text>
        <path
          d="M315 13h111q10 0 10 10v22q0 10-10 10h-70l-16 14V55h-25q-10 0-10-10V23q0-10 10-10"
          fill="white"
        />
        <text x="370" y="40" textAnchor="middle" fontSize="19">
          Welcome!
        </text>
      </svg>
      <figcaption>
        Unser English Club · Alle nötigen Angaben stehen in der Frage.
      </figcaption>
    </figure>
  );
}
export function EnglishClubNotes({
  onPast,
  disabled,
}: {
  onPast?: () => void;
  disabled: boolean;
}) {
  return (
    <InfoPanel paginate>
      <summary>Club-Merkzettel & Mitmachen</summary>
      <div>
        <h3>Wer tut etwas?</h3>
        <p>
          Personalpronomen sind kurze Wörter, die für Personen oder Dinge
          stehen: I, you, he, she, it, we, they. You kann du oder ihr bedeuten.
          Welche Pronomen eine Person verwendet, steht in der Frage.
        </p>
        <p lang="en">I → am · he / she / it → is · you / we / they → are</p>
        <p>
          Be heißt hier sein. In einer Frage steht be vorne: Are you ready?
          Verneinen: You are not ready. Kurzform: You aren’t ready.
        </p>
        <p lang="en">Are you ready? — Yes, I am. / No, I’m not.</p>
        <p>
          Eine positive Kurzantwort heißt Yes, I am. Am wird hier nicht zu I’m
          verkürzt.
        </p>
      </div>
      <div>
        <h3>Wen? Wem? — Objektformen</h3>
        <p>Subjekt = Wer tut etwas? Objekt = Wen oder wem betrifft es?</p>
        <p lang="en">I help Robin. → Robin helps me.</p>
        <p lang="en">
          I → me · you → you · he → him · she → her · it → it · we → us · they →
          them
        </p>
        <p>
          Beispiel: I see her. = Ich sehe sie. Her ist hier ein Personalpronomen
          als Objekt.
        </p>
      </div>
      <div>
        <h3>Begleiter: Wem gehört etwas?</h3>
        <p>
          My card heißt meine Karte, his card seine Karte. My und his sind hier
          Possessivbegleiter, keine Personalpronomen. Sie stehen vor dem Ding,
          das jemandem gehört.
        </p>
        <p>
          Her card = ihre Karte. Her ist hier ein Begleiter. I see her = Ich
          sehe sie. Her ist hier ein Personalpronomen.
        </p>
      </div>
      <div>
        <h3>Deine erfundene Clubkarte</h3>
        <p>
          Freiwillig: 1. Zeichne eine Clubkarte und ein Maskottchen. 2. Sag drei
          Sätze: I am … . This is … . We are … . 3. Erkläre jemandem ein
          Pronomen. Dein Sprechen wird nicht automatisch bewertet und bringt
          keine Punkte.
        </p>
        <p>
          Später kannst du zum Simple Past zurückblicken. Hier üben wir am, is
          und are für die Gegenwart; die Vergangenheit gehört zu einem eigenen
          Thema.
        </p>
        {onPast && (
          <button
            type="button"
            className="secondary-button"
            disabled={disabled}
            data-close-info
            onClick={onPast}
          >
            Freiwilliger Rückblick: Simple Past
          </button>
        )}
      </div>
    </InfoPanel>
  );
}
