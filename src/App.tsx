import { useCallback, useEffect, useRef, useState } from 'react';
import InfoPanel from './components/InfoPanel';
import AchievementBadge from './components/AchievementBadge';
import {
  subscribeWallet,
  validWallet,
  walletRevision,
} from './lib/wallet-updates';
import MultiplicationPanel from './components/MultiplicationPanel';
import VocabularyPanel from './components/VocabularyPanel';
import ArcadePanel from './components/ArcadePanel';
import ProfilePanel from './components/ProfilePanel';
import LearningPanel from './components/LearningPanel';
import MissionPanel from './components/MissionPanel';
import NatureGames from './components/NatureGames';
import AppUpdates from './components/AppUpdates';
import SolarSystemWorld from './components/SolarSystemWorld';
import EarthWorld from './components/EarthWorld';
import TypingPanel from './components/TypingPanel';
import CollectionPanel from './components/CollectionPanel';
import { subjects, type SubjectId } from './domain/subjects';
import { difficulties, type Difficulty, type Wallet } from './domain/learning';
import { desktop } from './lib/desktop';

type View =
  | 'learn'
  | 'trainers'
  | 'mission'
  | 'arcade'
  | 'vocabulary'
  | 'multiplication'
  | 'typing'
  | 'nature-games'
  | 'solar'
  | 'earth';
type Activity = { dirty: boolean; busy: boolean };
const sidebarStorageKey = 'lernwelt.sidebarCollapsed';
function readSidebarCollapsed() {
  try {
    return window.localStorage.getItem(sidebarStorageKey) === 'true';
  } catch {
    return false;
  }
}
const trainers = [
  {
    id: 'vocabulary',
    label: 'Vokabeltrainer',
    description: 'Englische Wörter üben und wiederholen.',
    symbol: 'Aa',
  },
  {
    id: 'multiplication',
    label: 'Einmaleins-Trainer',
    description: 'Malnehmen, Teilen und Quadratzahlen.',
    symbol: '×',
  },
  {
    id: 'typing',
    label: 'Tastschreiben',
    description: 'Finde die Tasten und schreibe kurze Zeilen.',
    symbol: '⌨',
  },
  {
    id: 'nature-games',
    label: 'Naturspiele',
    description: 'Entdecke Pflanzen, Tiere und Teilchen.',
    symbol: '⚘',
  },
  {
    id: 'arcade',
    label: 'Spielhalle',
    description: 'Eine Spielrunde kostet 10 Lernpunkte.',
    symbol: '✦',
  },
] as const;

export default function App() {
  const [view, setView] = useState<View>('learn');
  const [selected, setSelected] = useState<SubjectId>('mathematics');
  const [visited, setVisited] = useState<SubjectId[]>(['mathematics']);
  const [catalogRequests, setCatalogRequests] = useState<
    Partial<Record<SubjectId, number>>
  >({});
  const [vocabularyDeck, setVocabularyDeck] = useState('all');
  const [multiplicationMode, setMultiplicationMode] = useState<'squares'>();
  const [missionTopic, setMissionTopic] = useState<string>();
  const [solarMode, setSolarMode] = useState<'discover' | 'quiz'>('discover');
  const [earthMode, setEarthMode] = useState<'discover' | 'quiz'>('discover');
  const [profileVersion, setProfileVersion] = useState(0);
  const [menuOpen, setMenuOpen] = useState(false);
  const [sidebarCollapsed, setSidebarCollapsed] =
    useState(readSidebarCollapsed);
  const [activity, setActivity] = useState<Activity>({
    dirty: false,
    busy: false,
  });
  const [difficulty, setDifficulty] = useState<Difficulty>();
  const [headerWallet, setHeaderWallet] = useState<Wallet | null>(null);
  const [badgeError, setBadgeError] = useState('');
  const [profileReady, setProfileReady] = useState<boolean | null>(null);
  const [difficultyBusy, setDifficultyBusy] = useState(false);
  const [settingsBusy, setSettingsBusy] = useState(false);
  const [difficultyError, setDifficultyError] = useState('');
  const [difficultyReload, setDifficultyReload] = useState(0);
  const [pendingChange, setPendingChange] = useState<(() => void) | null>(null);
  const heading = useRef<HTMLHeadingElement>(null);
  const menuButton = useRef<HTMLButtonElement>(null);
  const confirmation = useRef<HTMLDialogElement>(null);
  const returnFocus = useRef<HTMLElement | null>(null);
  const restoreCatalogFocus = useRef(false);
  const stayButton = useRef<HTMLButtonElement>(null);
  const subject = subjects.find((item) => item.id === selected)!;
  const title =
    view === 'learn'
      ? subject.name
      : view === 'trainers'
        ? 'Trainer & Spiele'
        : view === 'mission'
          ? 'Deine Lernrunde'
          : view === 'solar'
            ? 'Sonnensystem'
            : view === 'earth'
              ? 'Expedition zum Erdkern'
              : trainers.find((item) => item.id === view)!.label;
  const locked = activity.busy || difficultyBusy || settingsBusy;
  const saved = useCallback(
    () => setProfileVersion((version) => version + 1),
    [],
  );
  const reportActivity = useCallback((next: Activity) => {
    setActivity((current) =>
      current.dirty === next.dirty && current.busy === next.busy
        ? current
        : next,
    );
  }, []);

  useEffect(
    () =>
      subscribeWallet((wallet) => {
        setHeaderWallet(wallet);
        setBadgeError('');
      }),
    [],
  );

  useEffect(() => {
    let active = true;
    setProfileReady(null);
    const readRevision = walletRevision();
    desktop
      .getLearningState()
      .then((state) => {
        if (active) {
          setDifficulty(state.difficulty);
          setDifficultyError('');
          setProfileReady(state.profileReady);
          if (walletRevision() === readRevision) {
            if (validWallet(state.wallet)) {
              setHeaderWallet(state.wallet);
              setBadgeError('');
            } else
              setBadgeError(
                'Deine Lernabzeichen konnten nicht gelesen werden.',
              );
          }
        }
      })
      .catch(() => {
        if (active) {
          setDifficultyError('Deine Stufe konnte nicht geladen werden.');
          if (walletRevision() === readRevision)
            setBadgeError('Deine Lernabzeichen konnten nicht geladen werden.');
        }
      });
    return () => {
      active = false;
    };
  }, [profileVersion, difficultyReload]);

  useEffect(() => {
    if (view === 'learn' && restoreCatalogFocus.current) {
      restoreCatalogFocus.current = false;
      return;
    }
    heading.current?.focus({ preventScroll: true });
  }, [view, selected]);

  useEffect(() => {
    if (pendingChange) {
      confirmation.current?.showModal();
      stayButton.current?.focus();
    }
  }, [pendingChange]);

  function guard(action: () => void) {
    if (locked) return;
    if (activity.dirty) {
      returnFocus.current = document.activeElement as HTMLElement;
      setPendingChange(() => action);
    } else action();
  }
  function toggleSidebar() {
    const next = !sidebarCollapsed;
    setSidebarCollapsed(next);
    try {
      window.localStorage.setItem(sidebarStorageKey, String(next));
    } catch {
      // The layout remains usable when local storage is unavailable.
    }
  }
  function stay() {
    confirmation.current?.close();
    setPendingChange(null);
    (returnFocus.current?.isConnected
      ? returnFocus.current
      : document.querySelector<HTMLButtonElement>('.global-difficulty > button')
    )?.focus({ preventScroll: true });
  }
  function navigate(next: View, subjectId?: SubjectId, resetCatalog = false) {
    guard(() => {
      reportActivity({ dirty: false, busy: false });
      const nextSubject = subjectId ?? selected;
      if (subjectId) {
        setSelected(subjectId);
        setVisited((current) =>
          current.includes(subjectId) ? current : [...current, subjectId],
        );
      }
      if (resetCatalog)
        setCatalogRequests((current) => ({
          ...current,
          [nextSubject]: (current[nextSubject] ?? 0) + 1,
        }));
      restoreCatalogFocus.current = next === 'learn' && resetCatalog;
      setView(next);
      setMenuOpen(false);
      setProfileVersion((version) => version + 1);
      document.documentElement.scrollTop = 0;
    });
  }
  async function changeDifficulty(next: Difficulty) {
    if (next === difficulty || difficultyBusy) return;
    setDifficultyBusy(true);
    setDifficultyError('');
    try {
      const confirmed = await desktop.setDifficulty(next);
      setDifficulty(confirmed);
      saved();
      reportActivity({ dirty: false, busy: false });
    } catch (reason) {
      setDifficultyError(
        reason instanceof Error
          ? reason.message
          : 'Deine Stufe konnte nicht gespeichert werden. Versuche es erneut.',
      );
    } finally {
      setDifficultyBusy(false);
    }
  }
  function openSupplement(link: {
    kind: 'mission' | 'vocabulary' | 'multiplication';
    target: string;
  }) {
    guard(() => {
      if (link.kind === 'mission') setMissionTopic(link.target);
      if (link.kind === 'vocabulary') setVocabularyDeck(link.target);
      if (link.kind === 'multiplication') setMultiplicationMode('squares');
      reportActivity({ dirty: false, busy: false });
      setView(link.kind);
      setMenuOpen(false);
      saved();
    });
  }

  return (
    <div
      className={`app-shell direct-topics-shell ${sidebarCollapsed ? 'is-sidebar-collapsed' : ''}`}
    >
      <a className="skip-link" href="#main">
        Zum Inhalt
      </a>
      <aside
        className="sidebar"
        aria-label="Lernwelt-Navigation"
        onKeyDown={(event) => {
          if (event.key === 'Escape' && menuOpen) {
            setMenuOpen(false);
            menuButton.current?.focus();
          }
        }}
      >
        <button
          className="brand"
          aria-label="Lernwelt – Zu den Themen"
          title="Lernwelt – Zu den Themen"
          disabled={locked}
          onClick={() => navigate('learn', selected, true)}
        >
          <span className="brand-icon" aria-hidden="true">
            L
          </span>
          <span className="brand-label">Lernwelt</span>
        </button>
        <button
          className="sidebar-toggle"
          type="button"
          aria-expanded={!sidebarCollapsed}
          aria-controls="navigation-items"
          aria-label={
            sidebarCollapsed
              ? 'Seitenleiste ausklappen'
              : 'Seitenleiste einklappen'
          }
          title={
            sidebarCollapsed
              ? 'Seitenleiste ausklappen'
              : 'Seitenleiste einklappen'
          }
          onClick={toggleSidebar}
        >
          <svg
            viewBox="0 0 24 24"
            fill="none"
            stroke="currentColor"
            strokeWidth="1.7"
            strokeLinecap="round"
            strokeLinejoin="round"
            aria-hidden="true"
          >
            <path d={sidebarCollapsed ? 'm9 6 6 6-6 6' : 'm15 6-6 6 6 6'} />
          </svg>
          <span className="sidebar-toggle-label">Einklappen</span>
        </button>
        <button
          ref={menuButton}
          className="menu-toggle secondary-button"
          aria-expanded={menuOpen}
          aria-controls="navigation-items"
          onClick={() => setMenuOpen((open) => !open)}
        >
          {menuOpen ? 'Menü schließen' : 'Menü öffnen'}
        </button>
        <div
          id="navigation-items"
          className={`navigation-items ${menuOpen ? 'is-open' : ''}`}
        >
          <p className="nav-label">DEINE FÄCHER</p>
          <nav className="primary-navigation" aria-label="Lernwelt-Bereiche">
            {subjects.map((item) => (
              <button
                key={item.id}
                aria-label={item.name}
                title={item.name}
                disabled={locked}
                aria-current={
                  selected === item.id &&
                  ['learn', 'mission', 'solar', 'earth'].includes(view)
                    ? 'page'
                    : undefined
                }
                onClick={() => navigate('learn', item.id, true)}
              >
                <span className="subject-nav-symbol" aria-hidden="true">
                  {item.symbol}
                </span>
                <span className="navigation-label">{item.name}</span>
                {selected === item.id &&
                  ['learn', 'mission', 'solar', 'earth'].includes(view) && (
                    <span className="current-mark" aria-hidden="true">
                      ✓
                    </span>
                  )}
              </button>
            ))}
            <button
              aria-label="Trainer & Spiele"
              title="Trainer & Spiele"
              disabled={locked}
              aria-current={
                !['learn', 'mission', 'solar', 'earth'].includes(view)
                  ? 'page'
                  : undefined
              }
              onClick={() => navigate('trainers')}
            >
              <span className="subject-nav-symbol" aria-hidden="true">
                ✦
              </span>
              <span className="navigation-label">Trainer & Spiele</span>
            </button>
          </nav>
          <p className="offline-note">
            <span aria-hidden="true" />
            Deine Lerndaten bleiben auf deinem Gerät
          </p>
        </div>
      </aside>
      <div className="app-content">
        <header className="header">
          <div className="location-label">
            Deine Lernwelt <span aria-hidden="true">/</span>
            <strong>{title}</strong>
          </div>
          <span className="grade-badge">Klasse 5</span>
          <InfoPanel className="global-difficulty" disabled={locked}>
            <summary>
              {difficultyBusy
                ? 'Stufe wird gespeichert …'
                : difficulty
                  ? `Stufe: ${difficulties.find((item) => item.id === difficulty)!.name}`
                  : 'Stufe laden …'}
            </summary>
            <p>
              Wähle frei. Die Stufen gelten für alle Fächer. Du kannst jederzeit
              wechseln.
            </p>
            <div className="level-grid">
              {difficulties.map((item) => (
                <button
                  key={item.id}
                  className="level-card"
                  disabled={locked || !difficulty}
                  aria-pressed={difficulty === item.id}
                  data-close-info
                  onClick={() => {
                    if (item.id !== difficulty)
                      guard(() => void changeDifficulty(item.id));
                  }}
                >
                  <span aria-hidden="true">{item.symbol}</span>
                  <strong>{item.name}</strong>
                  <small>{item.description}</small>
                </button>
              ))}
            </div>
            <p>Die Namen sind spielerisch. Sie bewerten dich nicht.</p>
          </InfoPanel>
          <div
            className="settings-entry"
            role="group"
            aria-label="Profil und Einstellungen"
          >
            <InfoPanel disabled={locked}>
              <summary>Dein Profil</summary>
              <ProfilePanel
                onSaved={saved}
                onBeforeSave={guard}
                onBusyChange={setSettingsBusy}
              />
            </InfoPanel>
            <InfoPanel disabled={locked}>
              <summary>Sammlung & Abzeichen</summary>
              <CollectionPanel
                onChanged={saved}
                onBeforeRedeem={guard}
                onBusyChange={setSettingsBusy}
              />
            </InfoPanel>
            <AppUpdates disabled={locked} onBeforeInstall={guard} />
          </div>
          <AchievementBadge
            wallet={headerWallet}
            error={badgeError}
            profileReady={profileReady}
            disabled={locked}
            onReload={() => setDifficultyReload((value) => value + 1)}
          />
        </header>
        {difficultyError && (
          <div className="global-error" role="alert">
            <span>{difficultyError}</span>
            <button
              className="secondary-button"
              disabled={difficultyBusy}
              onClick={() => setDifficultyReload((value) => value + 1)}
            >
              Stufe erneut laden
            </button>
          </div>
        )}
        <main id="main" tabIndex={-1}>
          <div className="page-heading">
            <h1 ref={heading} tabIndex={-1}>
              {title}
            </h1>
            {view !== 'learn' && (
              <button
                className="secondary-button"
                disabled={locked}
                onClick={() => navigate('learn', selected, true)}
              >
                Zu den Themen
              </button>
            )}
          </div>
          {visited
            .filter((id) => id !== 'geography')
            .map((id) => (
              <div key={id} hidden={view !== 'learn' || selected !== id}>
                <LearningPanel
                  subject={id}
                  active={view === 'learn' && selected === id}
                  profileVersion={profileVersion}
                  catalogRequest={catalogRequests[id] ?? 0}
                  externalControls
                  onActivityChange={
                    view === 'learn' && selected === id
                      ? reportActivity
                      : undefined
                  }
                  onProfileSaved={saved}
                  onSupplement={openSupplement}
                  onNatureGames={() => navigate('nature-games')}
                />
              </div>
            ))}
          {view === 'learn' && selected === 'geography' && (
            <section className="direct-goals" aria-label="Geographiethemen">
              <p>Was möchtest du entdecken?</p>
              <div className="study-grid">
                {[
                  [
                    'discover',
                    'Sonnensystem entdecken',
                    'Schau dir die Sonne und ihre acht Planeten an.',
                  ],
                  [
                    'quiz',
                    'Planeten erraten',
                    'Löse die Planetenrätsel auf deiner Stufe.',
                  ],
                ].map(([mode, label, description]) => (
                  <button
                    className="study-card"
                    key={mode}
                    onClick={() => {
                      setSolarMode(mode as 'discover' | 'quiz');
                      navigate('solar');
                    }}
                  >
                    <strong>{label}</strong>
                    <span>{description}</span>
                  </button>
                ))}
                {[
                  [
                    'discover',
                    'Expedition zum Erdkern',
                    'Öffne die Erde und erkunde ihre vier Schichten.',
                  ],
                  [
                    'quiz',
                    'Erdschichten üben',
                    'Grafikrätsel, Reihenfolgen und kleine Denkfragen.',
                  ],
                ].map(([mode, label, description]) => (
                  <button
                    className="study-card"
                    key={`earth-${mode}`}
                    onClick={() => {
                      setEarthMode(mode as 'discover' | 'quiz');
                      navigate('earth');
                    }}
                  >
                    <strong>{label}</strong>
                    <span>{description}</span>
                  </button>
                ))}
              </div>
            </section>
          )}
          {view === 'trainers' && (
            <section className="direct-goals" aria-label="Trainer und Spiele">
              <p>Wähle, was du ausprobieren möchtest.</p>
              <div className="study-grid">
                {trainers.map((item) => (
                  <button
                    className="study-card"
                    key={item.id}
                    onClick={() => {
                      setVocabularyDeck('all');
                      setMultiplicationMode(undefined);
                      navigate(item.id);
                    }}
                  >
                    <span className="goal-symbol" aria-hidden="true">
                      {item.symbol}
                    </span>
                    <strong>{item.label}</strong>
                    <span>{item.description}</span>
                  </button>
                ))}
              </div>
            </section>
          )}
          {view === 'mission' && (
            <MissionPanel
              topicId={missionTopic}
              profileVersion={profileVersion}
              externalControls
              onActivityChange={reportActivity}
              onProfileSaved={saved}
            />
          )}
          {view === 'solar' && (
            <SolarSystemWorld
              initialMode={solarMode}
              profileVersion={profileVersion}
              externalControls
              onActivityChange={reportActivity}
              onProfileSaved={saved}
            />
          )}
          {view === 'earth' && (
            <EarthWorld
              initialMode={earthMode}
              profileVersion={profileVersion}
              externalControls
              onActivityChange={reportActivity}
              onProfileSaved={saved}
            />
          )}
          {view === 'multiplication' && (
            <MultiplicationPanel
              initialMode={multiplicationMode}
              profileVersion={profileVersion}
              externalControls
              onActivityChange={reportActivity}
              onProfileSaved={saved}
            />
          )}
          {view === 'vocabulary' && (
            <VocabularyPanel
              key={vocabularyDeck}
              initialDeck={vocabularyDeck}
              profileVersion={profileVersion}
              externalControls
              onActivityChange={reportActivity}
              onProfileSaved={saved}
            />
          )}
          {view === 'typing' && (
            <TypingPanel
              profileVersion={profileVersion}
              externalControls
              onActivityChange={reportActivity}
              onProfileSaved={saved}
            />
          )}
          {view === 'nature-games' && difficulty && (
            <NatureGames
              key={difficulty}
              difficulty={difficulty}
              onActivityChange={reportActivity}
            />
          )}
          {view === 'nature-games' && !difficulty && (
            <p role="status">
              {difficultyError
                ? 'Lade zuerst deine Stufe erneut, damit du auf deiner gewählten Stufe spielen kannst.'
                : 'Deine Stufe wird geladen …'}
            </p>
          )}
          {view === 'arcade' && (
            <ArcadePanel
              profileVersion={profileVersion}
              externalControls
              onActivityChange={reportActivity}
              onProfileSaved={saved}
            />
          )}
        </main>
      </div>
      {pendingChange && (
        <dialog
          ref={confirmation}
          className="info-dialog leave-dialog"
          aria-label="Wechseln?"
          onKeyDown={(event) => {
            if (event.key === 'Escape') {
              event.preventDefault();
              stay();
            }
          }}
          onCancel={(event) => {
            event.preventDefault();
            stay();
          }}
        >
          <h2>Du hast noch eine ungesendete Eingabe.</h2>
          <p>
            Wenn du wechselst, wird sie verworfen. Gespeicherte Punkte und
            Lernschritte bleiben erhalten.
          </p>
          <div className="dialog-actions">
            <button ref={stayButton} className="primary-button" onClick={stay}>
              Bleiben
            </button>
            <button
              className="secondary-button"
              onClick={() => {
                confirmation.current?.close();
                const action = pendingChange;
                setPendingChange(null);
                action();
              }}
            >
              Wechseln
            </button>
          </div>
        </dialog>
      )}
    </div>
  );
}
