import { useCallback, useEffect, useRef, useState } from 'react';
import { vocabularyAudio } from '../domain/vocabulary-audio';

export default function VocabularyAudio({
  cardId,
  example = true,
  disabled = false,
}: {
  cardId: string;
  example?: boolean;
  disabled?: boolean;
}) {
  const player = useRef<HTMLAudioElement | null>(null);
  const [playing, setPlaying] = useState<'word' | 'example' | null>(null);
  const [error, setError] = useState('');
  const card = vocabularyAudio.get(cardId);
  const dispose = useCallback(() => {
    const audio = player.current;
    player.current = null;
    if (audio) {
      audio.onended = null;
      audio.onerror = null;
      audio.pause();
      audio.currentTime = 0;
    }
  }, []);
  const stop = useCallback(() => {
    dispose();
    setPlaying(null);
  }, [dispose]);
  useEffect(() => {
    stop();
    setError('');
    return dispose;
  }, [cardId, disabled, example, dispose, stop]);
  useEffect(() => {
    const onHidden = () => {
      if (document.hidden) stop();
    };
    document.addEventListener('visibilitychange', onHidden);
    return () => document.removeEventListener('visibilitychange', onHidden);
  }, [stop]);

  async function play(kind: 'word' | 'example') {
    if (disabled || !card) return;
    stop();
    setError('');
    const audio = new Audio(
      kind === 'word' ? card.wordAudio.file : card.exampleAudio.file,
    );
    player.current = audio;
    const fail = () => {
      if (player.current !== audio) return;
      stop();
      setError(
        'Das Audio konnte nicht abgespielt werden. Versuche es noch einmal. Du kannst auch ohne Ton weiterüben.',
      );
    };
    audio.onended = () => {
      if (player.current === audio) stop();
    };
    audio.onerror = fail;
    setPlaying(kind);
    try {
      await audio.play();
    } catch {
      fail();
    }
  }

  return (
    <div
      className="vocabulary-audio"
      role="group"
      aria-label="Englische Aussprache"
    >
      <div className="card-actions">
        <button
          type="button"
          className="secondary-button"
          disabled={disabled || !card}
          aria-pressed={playing === 'word'}
          onClick={() => void play('word')}
        >
          Wort anhören
        </button>
        {example && (
          <button
            type="button"
            className="secondary-button"
            disabled={disabled || !card}
            aria-pressed={playing === 'example'}
            onClick={() => void play('example')}
          >
            Beispielsatz anhören
          </button>
        )}
        {playing && (
          <button type="button" className="secondary-button" onClick={stop}>
            Audio stoppen
          </button>
        )}
      </div>
      {playing && (
        <p role="status">
          {playing === 'word'
            ? 'Das Wort wird vorgelesen.'
            : 'Der Beispielsatz wird vorgelesen.'}
        </p>
      )}
      {!card && (
        <p role="status">Für dieses Wort ist noch kein Audio vorhanden.</p>
      )}
      {error && (
        <p role="alert" className="error-message">
          {error}
        </p>
      )}
    </div>
  );
}
