import { useEffect, useRef, useState } from 'react';
import type { MissionStartInput, MissionState } from '../domain/mission';
import { desktop } from '../lib/desktop';
import '../mission.css';

export function missionDate(seconds: number) {
  return new Date(seconds * 1000).toLocaleDateString('de-DE', {
    day: 'numeric',
    month: 'long',
  });
}

export function MissionAlbum({ state }: { state: MissionState }) {
  const entries = [
    ['Ausprobiert', state.progress.tried],
    ['Selbst gelöst', state.progress.solvedIndependently],
    ['Später wieder geschafft', state.progress.recalledLater],
  ] as const;
  return (
    <ul
      className="mission-album"
      aria-label="Dein Themenalbum auf dieser Stufe"
    >
      {entries.map(([label, achieved]) => (
        <li key={label} className={achieved ? 'is-achieved' : ''}>
          <span aria-hidden="true">{achieved ? '✓' : '○'}</span>
          <span>
            {label}
            <small>{achieved ? 'Schon erreicht' : 'Noch offen'}</small>
          </span>
        </li>
      ))}
    </ul>
  );
}

export default function MissionCard({
  profileVersion,
  onOpen,
}: {
  profileVersion: number;
  onOpen: () => void;
}) {
  const [state, setState] = useState<MissionState | null>(null);
  const [busy, setBusy] = useState(true);
  const [error, setError] = useState('');
  const [reload, setReload] = useState(0);
  const [pending, setPending] = useState<MissionStartInput | null>(null);
  const revision = useRef(0);
  const inFlight = useRef(false);
  const reloadRequested = useRef(false);
  const focusAfterLoad = useRef(false);
  const openButton = useRef<HTMLButtonElement>(null);
  useEffect(() => {
    const current = ++revision.current;
    const restoreFocus = reloadRequested.current;
    reloadRequested.current = false;
    focusAfterLoad.current = false;
    inFlight.current = true;
    setBusy(true);
    setState(null);
    setError('');
    setPending(null);
    void desktop
      .getMissionState()
      .then((value) => {
        if (current !== revision.current) return;
        focusAfterLoad.current = restoreFocus;
        setState(value);
      })
      .catch((reason: unknown) => {
        if (current === revision.current)
          setError(
            reason instanceof Error
              ? reason.message
              : 'Deine Lernrunde konnte nicht geladen werden.',
          );
      })
      .finally(() => {
        if (current === revision.current) {
          inFlight.current = false;
          setBusy(false);
        }
      });
    return () => {
      ++revision.current;
    };
  }, [profileVersion, reload]);

  useEffect(() => {
    if (!busy && focusAfterLoad.current) {
      focusAfterLoad.current = false;
      openButton.current?.focus();
    }
  }, [busy, state]);

  async function open() {
    if (inFlight.current || !state) return;
    if (!state.profileReady || (state.session && !state.session.completed)) {
      onOpen();
      return;
    }
    const input = pending ?? {
      requestId: crypto.randomUUID(),
      difficulty: state.difficulty,
    };
    const current = revision.current;
    inFlight.current = true;
    setBusy(true);
    setError('');
    setPending(input);
    try {
      const value = await desktop.startMission(input);
      if (current !== revision.current) return;
      setState(value);
      setPending(null);
      onOpen();
    } catch (reason) {
      if (current === revision.current)
        setError(
          reason instanceof Error
            ? reason.message
            : 'Deine Lernrunde konnte nicht gestartet werden.',
        );
    } finally {
      if (current === revision.current) {
        inFlight.current = false;
        setBusy(false);
      }
    }
  }
  const active = state?.session && !state.session.completed;
  return (
    <section
      className="mission-card"
      aria-labelledby="mission-card-title"
      aria-busy={busy}
    >
      <div className="mission-card-icon" aria-hidden="true">
        ▱<span>✿</span>
      </div>
      <div className="mission-card-copy">
        <p className="eyebrow">DEINE LERNRUNDE · MATHEMATIK</p>
        <h2 id="mission-card-title">
          {state?.metadata.title ?? 'Ein Zaun für unseren Garten'}
        </h2>
        <p>
          Einmal außen herum: Entdecke den Umfang in fünf kleinen Schritten.
        </p>
        <p className="mission-small">
          {active
            ? `Weiter bei Schritt ${(state.session?.currentStep?.index ?? 0) + 1} von 5.`
            : state?.due
              ? 'Deine Wiederholung wartet auf dich.'
              : state?.dueAt
                ? `Wiederholung ab ${missionDate(state.dueAt)}. Du kannst auch vorher üben.`
                : 'Ein erstes Thema für Klasse 5. In deinem Tempo.'}
        </p>
        {busy && <p role="status">Lernrunde wird geladen …</p>}
        {error && (
          <p role="alert" className="error-message">
            {error}
          </p>
        )}
      </div>
      <div className="mission-card-action">
        {state && (
          <button
            ref={openButton}
            className="primary-button"
            disabled={busy}
            onClick={() => void open()}
          >
            {pending
              ? 'Start erneut versuchen'
              : active
                ? 'Runde fortsetzen'
                : state.due
                  ? 'Jetzt wiederholen'
                  : 'Lernrunde starten'}
          </button>
        )}
        {error && (
          <button
            className="secondary-button"
            disabled={busy}
            onClick={() => {
              reloadRequested.current = true;
              setReload((value) => value + 1);
            }}
          >
            Runde neu laden
          </button>
        )}
      </div>
    </section>
  );
}
