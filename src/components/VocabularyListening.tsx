import { useEffect, useRef, useState } from 'react';
import { createListeningRound } from '../domain/vocabulary-audio';
import VocabularyAudio from './VocabularyAudio';

export default function VocabularyListening({
  decks,
  initialDeck,
}: {
  decks: { id: string; name: string }[];
  initialDeck: string;
}) {
  const [deck, setDeck] = useState(initialDeck);
  const [round, setRound] = useState(() => createListeningRound(initialDeck));
  const [index, setIndex] = useState(0);
  const [choice, setChoice] = useState<string | null>(null);
  const [roundId, setRoundId] = useState(0);
  const heading = useRef<HTMLHeadingElement>(null);
  const feedback = useRef<HTMLDivElement>(null);
  const question = round[index];

  useEffect(() => {
    if (choice !== null) feedback.current?.focus();
  }, [choice]);
  function start(nextDeck: string) {
    setDeck(nextDeck);
    setRound(createListeningRound(nextDeck));
    setIndex(0);
    setChoice(null);
    setRoundId((value) => value + 1);
    heading.current?.focus();
  }
  return (
    <section
      className="vocabulary-listening"
      aria-labelledby="listening-heading"
    >
      <h3 id="listening-heading" tabIndex={-1} ref={heading}>
        Ohren auf! Drei Wörter hören
      </h3>
      <p>
        Höre ein Wort. Welche deutsche Bedeutung passt? Du kannst es so oft
        hören, wie du möchtest. Diese freiwillige Runde gibt keine Punkte und
        verändert deine Karteifächer nicht.
      </p>
      <label className="vocabulary-deck">
        Dein Hörthema
        <select value={deck} onChange={(event) => start(event.target.value)}>
          <option value="all">Alle Themen</option>
          {decks.map((item) => (
            <option key={item.id} value={item.id}>
              {item.name}
            </option>
          ))}
        </select>
      </label>
      {question ? (
        <article
          className="flashcard"
          aria-label={`Hörwort ${index + 1} von ${round.length}`}
        >
          <p className="eyebrow">
            WORT {index + 1} VON {round.length}
          </p>
          <VocabularyAudio
            key={`${roundId}-${index}`}
            cardId={question.card.id}
            example={choice !== null}
          />
          {choice === null ? (
            <>
              <h4>Was bedeutet das Wort?</h4>
              <div className="card-actions">
                {question.choices.map((option) => (
                  <button
                    type="button"
                    className="secondary-button"
                    key={option.id}
                    onClick={() => setChoice(option.id)}
                  >
                    {option.label}
                  </button>
                ))}
              </div>
              <button
                type="button"
                className="secondary-button"
                onClick={() => setChoice('reveal')}
              >
                Wort und Lösung zeigen
              </button>
            </>
          ) : (
            <div ref={feedback} tabIndex={-1}>
              <h4>
                {choice === question.card.id
                  ? 'Gut gehört!'
                  : 'Hören wir noch einmal hin.'}
              </h4>
              <p>
                <strong lang="en">{question.card.english}</strong> bedeutet{' '}
                <strong>{question.card.german}</strong>.
              </p>
              <p lang="en">{question.card.example}</p>
              <button
                type="button"
                className="primary-button"
                onClick={() => {
                  setIndex((value) => value + 1);
                  setChoice(null);
                  heading.current?.focus();
                }}
              >
                {index + 1 === round.length
                  ? 'Runde abschließen'
                  : 'Nächstes Hörwort'}
              </button>
            </div>
          )}
        </article>
      ) : (
        <div className="flashcard">
          <h4>Deine Hörrunde ist geschafft!</h4>
          <p>Drei Wörter für deine Ohren. Magst du noch eine Runde?</p>
          <button
            type="button"
            className="primary-button"
            onClick={() => start(deck)}
          >
            Neue Hörrunde
          </button>
        </div>
      )}
    </section>
  );
}
