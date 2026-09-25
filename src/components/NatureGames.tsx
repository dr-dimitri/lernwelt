import { useEffect, useId, useRef, useState } from 'react';
import { difficulties, type Difficulty } from '../domain/learning';
import {
  flowerRounds,
  matterRounds,
  meadowNames,
  meadowRound,
  natureGames,
  type MatchRound,
  type MeadowAnimal,
  type NatureGameId,
} from '../domain/nature-games';
import {
  FlowerPicture,
  MeadowCreature,
  MeadowPicture,
  ParticlePicture,
} from './NatureArt';
import '../nature.css';

interface Feedback {
  text: string;
  correct: boolean;
}

function MatchGame({ round, flower }: { round: MatchRound; flower: boolean }) {
  const [selected, setSelected] = useState<string | null>(null);
  const [found, setFound] = useState<string[]>([]);
  const [feedback, setFeedback] = useState<Feedback | null>(null);
  const [showHint, setShowHint] = useState(false);
  const cards = useRef(new Map<string, HTMLButtonElement>());
  const completionHeading = useRef<HTMLHeadingElement>(null);
  const moveFocus = useRef(false);
  const hintId = useId();
  const complete = found.length === round.items.length;
  const selectedItem = round.items.find((item) => item.id === selected);
  const foundTargets = round.items
    .filter((item) => found.includes(item.id))
    .map((item) => item.target);

  useEffect(() => {
    if (!moveFocus.current) return;
    moveFocus.current = false;
    const next = round.items.find((item) => !found.includes(item.id));
    if (next) cards.current.get(next.id)?.focus();
    else completionHeading.current?.focus();
  }, [found, round]);

  function match(target: string) {
    if (!selectedItem || found.includes(selectedItem.id)) return;
    if (selectedItem.target !== target) {
      setFeedback({
        text: 'Das passt noch nicht. Schau auf das Bild oder öffne den Tipp. Du kannst es gleich noch einmal versuchen.',
        correct: false,
      });
      return;
    }
    moveFocus.current = true;
    setFound([...found, selectedItem.id]);
    setSelected(null);
    setFeedback({
      text: `Entdeckt! ${selectedItem.explanation}`,
      correct: true,
    });
  }

  function reset() {
    setSelected(null);
    setFound([]);
    setFeedback(null);
    setShowHint(false);
  }

  return (
    <div className="nature-round">
      <div className="nature-round-heading">
        <h4>{round.title}</h4>
        <span>
          {found.length} von {round.items.length} entdeckt
        </span>
      </div>
      <p>{round.instruction}</p>
      {flower ? (
        <FlowerPicture found={foundTargets} />
      ) : (
        <p className="nature-model-note">
          Die Punkte zeigen ein vereinfachtes Teilchenmodell. Teilchen sind
          winzig und immer in Bewegung.
        </p>
      )}
      <fieldset className="nature-card-field">
        <legend>1. Wähle eine Karte</legend>
        <div className="nature-match-cards">
          {round.items.map((item) => {
            const solved = found.includes(item.id);
            return (
              <button
                key={item.id}
                ref={(button) => {
                  if (button) cards.current.set(item.id, button);
                  else cards.current.delete(item.id);
                }}
                type="button"
                className="nature-match-card"
                aria-label={item.label}
                aria-pressed={selected === item.id}
                disabled={solved}
                onClick={() => {
                  setSelected(item.id);
                  setFeedback(null);
                }}
              >
                {item.particleState && (
                  <span className="nature-particle-pair">
                    <ParticlePicture state={item.particleState} />
                    {item.nextState && (
                      <>
                        <span aria-hidden="true">→</span>
                        <ParticlePicture state={item.nextState} />
                      </>
                    )}
                  </span>
                )}
                <span>
                  {solved ? '✓ ' : ''}
                  {item.label}
                </span>
                {solved && <small>Entdeckt</small>}
              </button>
            );
          })}
        </div>
      </fieldset>
      <fieldset className="nature-card-field">
        <legend>
          2. {flower ? 'Wähle den Blütenteil' : 'Wähle das passende Fach'}
        </legend>
        <div className="nature-targets">
          {round.targets.map((target, index) => (
            <button
              key={target.id}
              type="button"
              className="nature-target"
              disabled={!selected || foundTargets.includes(target.id)}
              onClick={() => match(target.id)}
            >
              {flower && (
                <span className="nature-part-number" aria-hidden="true">
                  {index + 1}
                </span>
              )}
              {target.label}
              {foundTargets.includes(target.id) && ' ✓'}
            </button>
          ))}
        </div>
      </fieldset>
      <div
        className={`nature-feedback ${feedback?.correct ? 'is-correct' : ''}`}
        role="status"
        aria-live="polite"
        aria-atomic="true"
      >
        {feedback?.text ??
          (selectedItem
            ? `Gewählt: ${selectedItem.label}. Wohin gehört die Karte?`
            : 'Du darfst in Ruhe ausprobieren.')}
      </div>
      {complete && (
        <div className="nature-complete">
          <h4 ref={completionHeading} tabIndex={-1}>
            Alles entdeckt!
          </h4>
          <p>
            {flower
              ? 'Deine Blüte hat viele Helfer. Erkläre jemandem, was einer davon macht.'
              : 'Du hast die Teilchenwelt erforscht. Erkläre jemandem eines der Bilder.'}
          </p>
        </div>
      )}
      <div className="nature-round-actions">
        <button
          type="button"
          className="secondary-button"
          aria-expanded={showHint}
          aria-controls={hintId}
          onClick={() => setShowHint(!showHint)}
        >
          Forscher-Tipp
        </button>
        <button type="button" className="secondary-button" onClick={reset}>
          {complete ? 'Noch einmal erforschen' : 'Runde neu starten'}
        </button>
      </div>
      {showHint && (
        <p className="nature-hint" id={hintId}>
          {round.hint}
        </p>
      )}
    </div>
  );
}

function MeadowGame({ difficulty }: { difficulty: Difficulty }) {
  const round = meadowRound(difficulty);
  const [food, setFood] = useState<MeadowAnimal | null>(null);
  const [links, setLinks] = useState<[MeadowAnimal, MeadowAnimal][]>([]);
  const [feedback, setFeedback] = useState<Feedback | null>(null);
  const [showHint, setShowHint] = useState(false);
  const foodButtons = useRef(new Map<MeadowAnimal, HTMLButtonElement>());
  const completionHeading = useRef<HTMLHeadingElement>(null);
  const moveFocus = useRef(false);
  const hintId = useId();
  const complete = links.length === round.links.length;

  useEffect(() => {
    if (!moveFocus.current) return;
    moveFocus.current = false;
    const next = meadowRound(difficulty).links.find(
      ([food, eater]) => !links.some(([a, b]) => a === food && b === eater),
    );
    if (next) foodButtons.current.get(next[0])?.focus();
    else completionHeading.current?.focus();
  }, [difficulty, links]);

  function connect(eater: MeadowAnimal) {
    if (!food || complete) return;
    if (links.some(([a, b]) => a === food && b === eater)) {
      setFeedback({
        text: 'Diese Verbindung hast du schon entdeckt. Suche eine weitere.',
        correct: true,
      });
      return;
    }
    if (!round.links.some(([a, b]) => a === food && b === eater)) {
      setFeedback({
        text:
          food === 'grasshopper' && eater === 'stork'
            ? 'Gut beobachtet: Weißstörche fressen auch Grashüpfer! In dieser Runde bauen wir die Kette über den Frosch. Auf Streber kannst du auch diese Abkürzung verbinden.'
            : 'Dieser Pfeil passt hier noch nicht. Der Pfeil führt von der Nahrung zu dem Tier, das sie frisst. Versuche eine andere Verbindung.',
        correct: false,
      });
      return;
    }
    moveFocus.current = true;
    setLinks([...links, [food, eater]]);
    setFeedback({
      text: `Verbunden! ${meadowNames[food]} → ${meadowNames[eater]}. ${meadowNames[eater]} frisst ${meadowNames[food]}.`,
      correct: true,
    });
    setFood(null);
  }

  function reset() {
    setFood(null);
    setLinks([]);
    setFeedback(null);
    setShowHint(false);
  }

  return (
    <div className="nature-round">
      <div className="nature-round-heading">
        <h4>{round.title}</h4>
        <span>
          {links.length} von {round.links.length} Verbindungen
        </span>
      </div>
      <p>Wähle eine Nahrung. Wähle dann das Tier, das sie frisst.</p>
      <MeadowPicture nodes={round.nodes} links={links} />
      <p className="nature-model-note">
        Unser Beispiel zeigt eine feuchte Wiese. Ein Pfeil bedeutet: „wird
        gefressen von“. In der Natur gibt es viel mehr Beziehungen.
      </p>
      <fieldset className="nature-card-field">
        <legend>1. Wähle die Nahrung</legend>
        <div className="nature-meadow-choices">
          {round.nodes.map((node) => (
            <button
              key={node}
              ref={(button) => {
                if (button) foodButtons.current.set(node, button);
                else foodButtons.current.delete(node);
              }}
              type="button"
              className="nature-match-card"
              aria-label={`Nahrung: ${meadowNames[node]}`}
              aria-pressed={food === node}
              disabled={complete}
              onClick={() => {
                setFood(node);
                setFeedback(null);
              }}
            >
              <svg viewBox="-52 -40 108 82" aria-hidden="true">
                <MeadowCreature kind={node} />
              </svg>
              {meadowNames[node]}
            </button>
          ))}
        </div>
      </fieldset>
      <fieldset className="nature-card-field">
        <legend>
          2. Wer frisst {food ? meadowNames[food] : 'diese Nahrung'}?
        </legend>
        <div className="nature-targets">
          {round.nodes
            .filter((node) => node !== 'grass')
            .map((node) => (
              <button
                key={node}
                type="button"
                className="nature-target"
                disabled={!food || complete}
                onClick={() => connect(node)}
              >
                {meadowNames[node]}
              </button>
            ))}
        </div>
      </fieldset>
      <div
        className={`nature-feedback ${feedback?.correct ? 'is-correct' : ''}`}
        role="status"
        aria-live="polite"
        aria-atomic="true"
      >
        {feedback?.text ??
          (food
            ? `Gewählt: ${meadowNames[food]}. Wer frisst das?`
            : 'Verbinde die Lebewesen und lass dein Netz wachsen.')}
      </div>
      {links.length > 0 && (
        <ul className="nature-links" aria-label="Entdeckte Nahrungsbeziehungen">
          {links.map(([a, b]) => (
            <li key={`${a}-${b}`}>
              <span>{meadowNames[a]}</span>
              <span aria-label="wird gefressen von">→</span>
              <span>{meadowNames[b]}</span>
            </li>
          ))}
        </ul>
      )}
      {complete && (
        <div className="nature-complete">
          <h4 ref={completionHeading} tabIndex={-1}>
            Deine Wiese ist verbunden!
          </h4>
          <p>
            {difficulty === 'streber'
              ? 'Ein Tier kann verschiedene Nahrung fressen. Darum wird aus Nahrungsketten ein Nahrungsnetz.'
              : 'Deine Nahrungskette beginnt mit einer Pflanze. Überlege: Was passiert, wenn es weniger Gras gibt?'}
          </p>
        </div>
      )}
      <div className="nature-round-actions">
        <button
          type="button"
          className="secondary-button"
          aria-expanded={showHint}
          aria-controls={hintId}
          onClick={() => setShowHint(!showHint)}
        >
          Forscher-Tipp
        </button>
        <button type="button" className="secondary-button" onClick={reset}>
          {complete ? 'Noch einmal erforschen' : 'Runde neu starten'}
        </button>
      </div>
      {showHint && (
        <p className="nature-hint" id={hintId}>
          {round.hint}
        </p>
      )}
    </div>
  );
}

function NatureGamesSession({ difficulty }: { difficulty: Difficulty }) {
  const [active, setActive] = useState<NatureGameId>('matter');
  const headingId = useId();
  const name = natureGames.find((game) => game.id === active)!.name;
  return (
    <section
      className={`nature-games nature-games-${active}`}
      aria-labelledby={headingId}
    >
      <div className="nature-games-intro">
        <p className="eyebrow">DEINE FORSCHER-WERKSTATT</p>
        <h3 id={headingId}>Anklicken. Ausprobieren. Staunen.</h3>
        <p>
          Drei Lernspiele ·{' '}
          {difficulties.find((entry) => entry.id === difficulty)!.name}
        </p>
      </div>
      <div
        className="nature-game-picker"
        role="group"
        aria-label="Lernspiel wählen"
      >
        {natureGames.map((game) => (
          <button
            type="button"
            key={game.id}
            aria-pressed={active === game.id}
            onClick={() => setActive(game.id)}
          >
            <span className="nature-game-symbol" aria-hidden="true">
              {game.symbol}
            </span>
            <span>
              <strong>{game.name}</strong>
            </span>
          </button>
        ))}
      </div>
      <section aria-label={name} key={`${active}-${difficulty}`}>
        {active === 'meadow' ? (
          <MeadowGame difficulty={difficulty} />
        ) : (
          <MatchGame
            round={
              active === 'matter'
                ? matterRounds[difficulty]
                : flowerRounds[difficulty]
            }
            flower={active === 'flower'}
          />
        )}
      </section>
      <p className="nature-session-note">
        Freies Erkunden ohne Zeitlimit und ohne Lernpunkte. Beim Spiel- oder
        Stufenwechsel beginnt eine neue Runde. Beim Verlassen wird die Runde
        nicht gespeichert.
      </p>
    </section>
  );
}

export default function NatureGames({
  difficulty,
}: {
  difficulty: Difficulty;
}) {
  return <NatureGamesSession difficulty={difficulty} key={difficulty} />;
}
