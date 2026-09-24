import { useEffect, useRef, useState } from 'react';
import {
  games,
  type ArcadeState,
  type GameSession,
  type GameId,
} from '../domain/arcade';
import { desktop } from '../lib/desktop';
import GameStage from './GameStage';

export default function ArcadePanel({
  profileVersion,
}: {
  profileVersion: number;
}) {
  const [state, setState] = useState<ArcadeState | null>(null);
  const [error, setError] = useState('');
  const [busy, setBusy] = useState(false);
  const [reload, setReload] = useState(0);
  const [playing, setPlaying] = useState<GameSession | null>(null);
  const [result, setResult] = useState<number | null>(null);
  const [saved, setSaved] = useState(false);
  const inFlight = useRef(false);
  const loadVersion = useRef(0);
  const pending = useRef<GameSession | null>(null);
  useEffect(() => {
    let current = true;
    const version = ++loadVersion.current;
    setError('');
    desktop
      .getArcadeState()
      .then((value) => {
        if (current && version === loadVersion.current) {
          setState(value);
          pending.current = null;
        }
      })
      .catch((reason) => {
        if (current && version === loadVersion.current)
          setError((reason as Error).message);
      });
    return () => {
      current = false;
    };
  }, [profileVersion, reload]);
  async function start(gameId: GameId) {
    if (inFlight.current) return;
    inFlight.current = true;
    loadVersion.current++;
    setBusy(true);
    setError('');
    const request = pending.current ?? { id: crypto.randomUUID(), gameId };
    pending.current = request;
    try {
      const next = await desktop.startGame(request.id, request.gameId);
      setState(next);
      setPlaying(next.activeSession);
      setResult(null);
      setSaved(false);
      pending.current = null;
    } catch (reason) {
      setError((reason as Error).message);
    } finally {
      inFlight.current = false;
      setBusy(false);
    }
  }
  async function finish(score: number) {
    if (!playing || inFlight.current) return;
    inFlight.current = true;
    loadVersion.current++;
    setResult(score);
    setBusy(true);
    setError('');
    try {
      setState(await desktop.finishGame(playing.id, score));
      setSaved(true);
    } catch (reason) {
      setError((reason as Error).message);
    } finally {
      inFlight.current = false;
      setBusy(false);
    }
  }
  return (
    <section className="arcade" aria-labelledby="arcade-title">
      <div className="section-heading">
        <div>
          <p className="eyebrow">DEINE VERDIENTE SPIELPAUSE</p>
          <h2 id="arcade-title">Die Spielhalle</h2>
        </div>
        <span className="arcade-balance">
          {state ? `${state.wallet.balance} Lernpunkte` : 'Punkte laden …'}
        </span>
      </div>
      <p>
        Jede Runde kostet <strong>{state?.entryCost ?? 10} Lernpunkte</strong>.
        Du entscheidest, wann du sie einlöst. Spiele sammeln eigene Spielpunkte
        und Bestwerte.
      </p>
      {error && (
        <div role="alert" className="error-message">
          <p>{error}</p>
          {result !== null && !saved ? (
            <button disabled={busy} onClick={() => void finish(result)}>
              Ergebnis erneut speichern
            </button>
          ) : (
            !playing && (
              <button
                disabled={busy}
                onClick={() => {
                  setState(null);
                  setReload((r) => r + 1);
                }}
              >
                Spielhalle neu laden
              </button>
            )
          )}
        </div>
      )}
      {!state && !error && <p role="status">Deine Spielhalle wird geladen …</p>}
      {state && !state.profileReady && (
        <p>
          Speichere zuerst dein Lernprofil unten. Dann kannst du beim Lernen
          Punkte verdienen.
        </p>
      )}
      {playing ? (
        <>
          <GameStage
            key={playing.id}
            gameId={playing.gameId}
            onFinish={(score) => void finish(score)}
          />
          {result !== null && (
            <div className="arcade-result" role="status">
              <strong>{result} Spielpunkte</strong>
              <p>
                {saved
                  ? 'Dein Ergebnis ist gespeichert. Lust auf eine Lernpause von der Spielpause?'
                  : busy
                    ? 'Dein Ergebnis wird gespeichert …'
                    : 'Bitte speichere dein Ergebnis erneut. Es werden keine Lernpunkte abgezogen.'}
              </p>
              {saved && (
                <button
                  onClick={() => {
                    setPlaying(null);
                    setResult(null);
                  }}
                >
                  Zur Spielauswahl
                </button>
              )}
            </div>
          )}
        </>
      ) : (
        <>
          {state?.activeSession && (
            <div className="resume-round">
              <h3>Deine bezahlte Runde wartet!</h3>
              <p>
                {games.find((g) => g.id === state.activeSession!.gameId)?.name}:
                Du startest die unterbrochene Runde von vorn. Das kostet keine
                weiteren Punkte. Beende diese Runde, bevor du ein anderes Spiel
                wählst.
              </p>
              <button
                disabled={busy}
                onClick={() => {
                  setPlaying(state.activeSession);
                  setResult(null);
                  setSaved(false);
                }}
              >
                Kostenlos wieder aufnehmen
              </button>
            </div>
          )}
          <div className="arcade-grid">
            {games.map((game) => (
              <article
                key={game.id}
                className={`arcade-card arcade-${game.id}`}
              >
                <span className="arcade-icon" aria-hidden="true">
                  {game.icon}
                </span>
                <h3>{game.name}</h3>
                <p>{game.description}</p>
                <p className="best-score">
                  Bestwert:{' '}
                  {state?.bestScores.find((b) => b.gameId === game.id)?.score ??
                    0}{' '}
                  Spielpunkte
                </p>
                <details>
                  <summary>So geht’s</summary>
                  <p>{game.instructions}</p>
                </details>
                <button
                  disabled={
                    !state?.profileReady ||
                    !!state.activeSession ||
                    busy ||
                    state.wallet.balance < state.entryCost ||
                    (!!pending.current && pending.current.gameId !== game.id)
                  }
                  onClick={() => void start(game.id)}
                >
                  {busy && pending.current?.gameId === game.id
                    ? 'Runde wird geöffnet …'
                    : pending.current?.gameId === game.id
                      ? 'Buchung erneut versuchen'
                      : `Spielen · ${state?.entryCost ?? 10} Lernpunkte`}
                </button>
              </article>
            ))}
          </div>
          {state?.profileReady &&
            state.wallet.balance < state.entryCost &&
            !state.activeSession && (
              <p className="points-tip">
                Deine nächste neue richtige Antwort bringt 10 Lernpunkte – genug
                für eine Spielrunde.
              </p>
            )}
        </>
      )}
      <p className="arcade-note">
        Beim Verlassen pausiert dein Spiel. Eine offene bezahlte Runde kannst du
        später kostenlos von vorn beginnen. Gespeichert werden der Eintritt und
        deine abgeschlossenen Bestwerte, nicht die genaue Spielposition.
      </p>
    </section>
  );
}
