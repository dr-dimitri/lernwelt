import { useEffect, useRef, useState } from 'react';
import {
  missionSubjects,
  type MissionStartInput,
  type MissionState,
} from '../domain/mission';
import { desktop } from '../lib/desktop';
import { difficulties } from '../domain/learning';
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
  onOpen: (topicId: string) => void;
}) {
  const [state, setState] = useState<MissionState | null>(null);
  const [topicId, setTopicId] = useState<string>();
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

  const topics = state
    ? [
        {
          metadata: state.metadata,
          activeStep:
            state.session && !state.session.completed
              ? (state.session.currentStep?.index ?? 0)
              : null,
          dueAt: state.dueAt,
          due: state.due,
        },
        ...state.topics.filter(
          (topic) => topic.metadata.id !== state.metadata.id,
        ),
      ]
    : [];
  const selected =
    topics.find((topic) => topic.metadata.id === topicId) ?? topics[0];
  const active = selected?.activeStep != null;
  async function open() {
    if (inFlight.current || !state || !selected) return;
    if (!state.profileReady || active) {
      onOpen(selected.metadata.id);
      return;
    }
    const input = pending ?? {
      requestId: crypto.randomUUID(),
      difficulty: state.difficulty,
      topicId: selected.metadata.id,
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
      onOpen(value.metadata.id);
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
  return (
    <section
      className="mission-card mission-chooser"
      aria-labelledby="mission-card-title"
      aria-busy={busy}
    >
      <div className="mission-topic-heading">
        <p className="eyebrow">
          DEINE LERNRUNDEN · KLASSE 5
          {state
            ? ` · ${difficulties.find((level) => level.id === state.difficulty)?.name}`
            : ''}
        </p>
        <fieldset className="mission-topic-list" disabled={busy || !!pending}>
          <legend>Thema wählen</legend>
          {topics.map((topic) => (
            <button
              type="button"
              className="secondary-button mission-topic"
              key={topic.metadata.id}
              aria-pressed={selected?.metadata.id === topic.metadata.id}
              onClick={() => setTopicId(topic.metadata.id)}
            >
              <span>{missionSubjects[topic.metadata.subject]}</span>
              <strong>{topic.metadata.title}</strong>
              <small>
                {topic.activeStep != null
                  ? `Schritt ${topic.activeStep + 1} fortsetzen`
                  : topic.due
                    ? 'Wiederholung fällig'
                    : topic.dueAt
                      ? `Wiederholen ab ${missionDate(topic.dueAt)}`
                      : 'Neu entdecken'}
              </small>
              {topic.activeStep != null && topic.due && (
                <small>Wiederholung fällig</small>
              )}
            </button>
          ))}
        </fieldset>
      </div>
      <div className="mission-card-copy">
        <p className="eyebrow">
          {selected
            ? missionSubjects[selected.metadata.subject]
            : 'DEINE LERNRUNDE'}
        </p>
        <h2 id="mission-card-title">
          {selected?.metadata.title ?? 'Wähle dein Lernabenteuer'}
        </h2>
        <p>
          {selected?.metadata.description ??
            'Fünf kleine Schritte. In deinem Tempo.'}
        </p>
        <p className="mission-small">
          {active
            ? `Weiter bei Schritt ${(selected.activeStep ?? 0) + 1} von 5.`
            : selected?.due
              ? 'Deine Wiederholung wartet auf dich.'
              : selected?.dueAt
                ? `Wiederholung ab ${missionDate(selected.dueAt)}. Du kannst auch vorher üben.`
                : 'Fünf Schritte für Klasse 5. In deinem Tempo.'}
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
            disabled={busy || !selected}
            onClick={() => void open()}
          >
            {pending
              ? 'Start erneut versuchen'
              : active
                ? 'Runde fortsetzen'
                : selected?.due
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
