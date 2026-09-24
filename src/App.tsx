import InfoPanel from './components/InfoPanel';
import { useState } from 'react';
import MultiplicationPanel from './components/MultiplicationPanel';
import VocabularyPanel from './components/VocabularyPanel';
import ArcadePanel from './components/ArcadePanel';
import ProfilePanel from './components/ProfilePanel';
import LearningPanel from './components/LearningPanel';
import { subjects, type SubjectId } from './domain/subjects';

export default function App() {
  const [view, setView] = useState<
    'learn' | 'arcade' | 'vocabulary' | 'multiplication'
  >('learn');
  const [selected, setSelected] = useState<SubjectId>('mathematics');
  const [profileVersion, setProfileVersion] = useState(0);

  return (
    <div className="app-shell">
      <header className="header">
        <a className="brand" href="#main">
          <span className="brand-icon" aria-hidden="true">
            L
          </span>
          Lernwelt
        </a>
        <span className="local-badge">Dein Tempo. Dein Abenteuer.</span>
        <InfoPanel>
          <summary>Dein Profil</summary>
          <ProfilePanel
            onSaved={() => setProfileVersion((version) => version + 1)}
          />
        </InfoPanel>
      </header>
      <main id="main">
        <nav className="view-switch" aria-label="Lernwelt-Bereiche">
          <button
            aria-pressed={view === 'learn'}
            onClick={() => setView('learn')}
          >
            Lernen & Punkte sammeln
          </button>
          <button
            aria-pressed={view === 'arcade'}
            onClick={() => setView('arcade')}
          >
            Spielhalle
          </button>
          <button
            aria-pressed={view === 'vocabulary'}
            onClick={() => setView('vocabulary')}
          >
            Vokabeltrainer
          </button>
          <button
            aria-pressed={view === 'multiplication'}
            onClick={() => setView('multiplication')}
          >
            Einmaleins-Trainer
          </button>
        </nav>
        {view === 'learn' ? (
          <>
            <section className="subject-bar" aria-labelledby="subjects-title">
              <div className="section-heading">
                <h2 id="subjects-title">Deine Fächer</h2>
                <span>Gymnasium · Bayern</span>
              </div>
              <div className="subject-grid">
                {subjects.map((item) => (
                  <button
                    key={item.id}
                    className={`subject-card ${item.id}`}
                    aria-label={item.name}
                    aria-pressed={selected === item.id}
                    onClick={() => setSelected(item.id)}
                  >
                    <span className="subject-symbol" aria-hidden="true">
                      {item.symbol}
                    </span>
                    <span className="subject-name">{item.name}</span>
                    <span className="subject-description">
                      {item.description}
                    </span>
                    <span className="subject-action">
                      Fach auswählen <span aria-hidden="true">↗</span>
                    </span>
                  </button>
                ))}
              </div>
            </section>
            <LearningPanel subject={selected} profileVersion={profileVersion} />
          </>
        ) : view === 'multiplication' ? (
          <MultiplicationPanel profileVersion={profileVersion} />
        ) : view === 'vocabulary' ? (
          <VocabularyPanel profileVersion={profileVersion} />
        ) : (
          <ArcadePanel profileVersion={profileVersion} />
        )}
      </main>
    </div>
  );
}
