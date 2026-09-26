import { useEffect, useRef, useState } from 'react';
import InfoPanel from './components/InfoPanel';
import MultiplicationPanel from './components/MultiplicationPanel';
import VocabularyPanel from './components/VocabularyPanel';
import ArcadePanel from './components/ArcadePanel';
import ProfilePanel from './components/ProfilePanel';
import LearningPanel from './components/LearningPanel';
import SubjectLibrary from './components/SubjectLibrary';
import MissionCard from './components/MissionCard';
import MissionPanel from './components/MissionPanel';
import AppUpdates from './components/AppUpdates';
import { subjects, type SubjectId } from './domain/subjects';

type View =
  'subjects' | 'learn' | 'mission' | 'arcade' | 'vocabulary' | 'multiplication';

const destinations = [
  { id: 'subjects', label: 'Meine Fächer', icon: 'subjects' },
  { id: 'vocabulary', label: 'Vokabeltrainer', icon: 'words' },
  { id: 'multiplication', label: 'Einmaleins-Trainer', icon: 'numbers' },
  { id: 'arcade', label: 'Spielhalle', icon: 'game' },
] as const;

function NavIcon({ name }: { name: string }) {
  return (
    <svg
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth="1.7"
      strokeLinecap="round"
      strokeLinejoin="round"
      aria-hidden="true"
    >
      {name === 'subjects' ? (
        <>
          <rect x="3" y="3" width="7" height="7" rx="2" />
          <rect x="14" y="3" width="7" height="7" rx="2" />
          <rect x="3" y="14" width="7" height="7" rx="2" />
          <rect x="14" y="14" width="7" height="7" rx="2" />
        </>
      ) : name === 'words' ? (
        <>
          <path d="M4 4h16v12H9l-5 4V4Z" />
          <path d="M8 8h8M8 12h5" />
        </>
      ) : name === 'numbers' ? (
        <>
          <rect x="4" y="2" width="16" height="20" rx="3" />
          <path d="M8 6h8M8 11h1m6 0h1m-8 4h1m6 0h1m-8 4h1m6 0h1" />
        </>
      ) : (
        <>
          <path d="M8 7h8c4 0 6 10 3 11-2 1-3-3-5-3h-4c-2 0-3 4-5 3-3-1-1-11 3-11Z" />
          <path d="M7 10v4m-2-2h4m6-1h.01m3 2h.01" />
        </>
      )}
    </svg>
  );
}

function DiscoveryArt() {
  return (
    <svg
      className="discovery-art"
      viewBox="0 0 260 180"
      fill="none"
      aria-hidden="true"
    >
      <circle cx="143" cy="88" r="70" fill="#d2eee5" />
      <ellipse
        cx="136"
        cy="94"
        rx="108"
        ry="38"
        transform="rotate(-25 136 94)"
        stroke="#84bdac"
        strokeWidth="1.5"
        strokeDasharray="4 7"
      />
      <g transform="rotate(-10 115 95)">
        <rect x="59" y="41" width="95" height="110" rx="15" fill="#147969" />
        <rect x="67" y="36" width="95" height="108" rx="12" fill="#fffefa" />
        <path
          d="M86 60h51M86 71h32"
          stroke="#9abeb1"
          strokeWidth="5"
          strokeLinecap="round"
        />
        <path
          d="m91 105 11 11 24-27"
          stroke="#147969"
          strokeWidth="7"
          strokeLinecap="round"
          strokeLinejoin="round"
        />
      </g>
      <g transform="rotate(12 191 114)">
        <rect x="161" y="83" width="61" height="65" rx="15" fill="#ffc966" />
        <path
          d="M179 114h25m-12-13v26"
          stroke="#7a5115"
          strokeWidth="5"
          strokeLinecap="round"
        />
      </g>
      <path d="m202 24 3 9 9 3-9 3-3 9-3-9-9-3 9-3Z" fill="#ec886e" />
      <circle cx="41" cy="108" r="6" fill="#ec886e" />
      <circle cx="181" cy="160" r="4" fill="#147969" />
    </svg>
  );
}

export default function App() {
  const [view, setView] = useState<View>('subjects');
  const [selected, setSelected] = useState<SubjectId>('mathematics');
  const [profileVersion, setProfileVersion] = useState(0);
  const [menuOpen, setMenuOpen] = useState(false);
  const heading = useRef<HTMLHeadingElement>(null);
  const menuButton = useRef<HTMLButtonElement>(null);
  const navigationRequested = useRef(false);
  const subject = subjects.find((item) => item.id === selected)!;
  const title =
    view === 'subjects'
      ? 'Meine Fächer'
      : view === 'learn'
        ? subject.name
        : view === 'mission'
          ? 'Deine Lernrunde'
          : destinations.find((item) => item.id === view)!.label;

  useEffect(() => {
    if (navigationRequested.current) {
      heading.current?.focus({ preventScroll: true });
      navigationRequested.current = false;
      document.documentElement.scrollTop = 0;
    }
  }, [view, selected, menuOpen]);

  function navigate(next: View, subjectId?: SubjectId) {
    navigationRequested.current =
      next !== view || (subjectId !== undefined && subjectId !== selected);
    if (subjectId) setSelected(subjectId);
    setView(next);
    setMenuOpen(false);
    // Also handle selecting the already visible destination.
    heading.current?.focus({ preventScroll: true });
    document.documentElement.scrollTop = 0;
  }

  return (
    <div className="app-shell">
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
          onClick={() => navigate('subjects')}
          aria-label="Lernwelt – Meine Fächer"
        >
          <span className="brand-icon" aria-hidden="true">
            L
          </span>
          Lernwelt
          <span className="brand-dot" aria-hidden="true">
            .
          </span>
        </button>
        <button
          ref={menuButton}
          className="menu-toggle secondary-button"
          aria-expanded={menuOpen}
          aria-controls="navigation-items"
          onClick={() => setMenuOpen(!menuOpen)}
        >
          {menuOpen ? 'Menü schließen' : 'Menü öffnen'}
        </button>
        <div
          id="navigation-items"
          className={`navigation-items ${menuOpen ? 'is-open' : ''}`}
        >
          <p className="nav-label">DEIN ENTDECKERPLATZ</p>
          <nav className="primary-navigation" aria-label="Lernwelt-Bereiche">
            {destinations.map((item) => (
              <button
                key={item.id}
                aria-current={
                  view === item.id ||
                  (item.id === 'subjects' &&
                    (view === 'learn' || view === 'mission'))
                    ? 'page'
                    : undefined
                }
                onClick={() => navigate(item.id)}
              >
                <NavIcon name={item.icon} />
                <span>{item.label}</span>
              </button>
            ))}
          </nav>
          <div className="sidebar-note">
            <span aria-hidden="true">✦</span>
            <p>
              Dein Tempo.
              <br />
              <strong>Dein Abenteuer.</strong>
            </p>
            <small>Ausprobieren gehört dazu.</small>
          </div>
          <p className="offline-note">
            <span aria-hidden="true" />
            Deine Lerndaten bleiben auf deinem Gerät
          </p>
        </div>
      </aside>
      <div className="app-content">
        <header className="header">
          <div className="location-label">
            Deine Lernwelt <span aria-hidden="true">/</span>{' '}
            <strong>{title}</strong>
          </div>
          <span className="grade-badge">Klasse 5</span>
          <AppUpdates />
          <InfoPanel>
            <summary>Dein Profil</summary>
            <ProfilePanel
              onSaved={() => setProfileVersion((version) => version + 1)}
            />
          </InfoPanel>
        </header>
        <main id="main" tabIndex={-1}>
          <div
            className={`page-heading ${view === 'subjects' ? 'discovery-heading' : ''}`}
          >
            <div>
              {(view === 'learn' || view === 'mission') && (
                <button
                  className="back-button"
                  onClick={() => navigate('subjects')}
                >
                  ← Alle Fächer
                </button>
              )}
              {view === 'subjects' && (
                <p className="eyebrow">NEUGIER AN. LOS GEHT’S.</p>
              )}
              <h1 ref={heading} tabIndex={-1}>
                {view === 'subjects' ? (
                  <>
                    Was möchtest du
                    <br />
                    heute entdecken?
                  </>
                ) : (
                  title
                )}
              </h1>
              {view === 'subjects' && (
                <p>
                  Such dir ein Fach aus. Kleine Schritte, große Aha-Momente.
                </p>
              )}
            </div>
            {view === 'subjects' && <DiscoveryArt />}
            {view === 'learn' && (
              <span
                className={`current-subject-symbol ${subject.id}`}
                aria-hidden="true"
              >
                {subject.symbol}
              </span>
            )}
          </div>
          {view === 'subjects' ? (
            <>
              <MissionCard
                profileVersion={profileVersion}
                onOpen={() => navigate('mission')}
              />
              <SubjectLibrary
                subjects={subjects}
                selected={selected}
                onSelect={(id) => navigate('learn', id)}
              />
            </>
          ) : view === 'learn' ? (
            <LearningPanel subject={selected} profileVersion={profileVersion} />
          ) : view === 'mission' ? (
            <MissionPanel profileVersion={profileVersion} />
          ) : view === 'multiplication' ? (
            <MultiplicationPanel profileVersion={profileVersion} />
          ) : view === 'vocabulary' ? (
            <VocabularyPanel profileVersion={profileVersion} />
          ) : (
            <ArcadePanel profileVersion={profileVersion} />
          )}
          {view === 'subjects' && (
            <p className="library-footnote">
              Für deinen Weg durch die 5. Klasse · Gymnasium Bayern
            </p>
          )}
        </main>
      </div>
    </div>
  );
}
