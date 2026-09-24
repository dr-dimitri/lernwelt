import { useState } from 'react';
import { subjects, type SubjectId } from './domain/subjects';

export default function App() {
  const [selected, setSelected] = useState<SubjectId>('mathematics');
  const subject = subjects.find((item) => item.id === selected)!;

  return (
    <div className="app-shell">
      <header className="header">
        <a className="brand" href="#main"><span className="brand-icon" aria-hidden="true">L</span>Lernwelt</a>
        <span className="local-badge">Lokal auf deinem Gerät</span>
      </header>
      <main id="main">
        <section className="intro" aria-labelledby="welcome">
          <p className="eyebrow">DEIN RAUM ZUM LERNEN</p>
          <h1 id="welcome">Neugierig bleiben.<br /><span>Schritt für Schritt wachsen.</span></h1>
          <p className="intro-text">Mathematik und Englisch für das bayerische Gymnasium.<br />In deinem Tempo, auf deinem Gerät.</p>
        </section>
        <section aria-labelledby="subjects-title">
          <div className="section-heading"><h2 id="subjects-title">Deine Fächer</h2><span>Gymnasium · Bayern</span></div>
          <div className="subject-grid">
            {subjects.map((item) => (
              <button key={item.id} className={`subject-card ${item.id}`} aria-pressed={selected === item.id} onClick={() => setSelected(item.id)}>
                <span className="subject-symbol" aria-hidden="true">{item.symbol}</span>
                <span className="subject-name">{item.name}</span>
                <span className="subject-description">{item.description}</span>
                <span className="subject-action">Fach auswählen <span aria-hidden="true">↗</span></span>
              </button>
            ))}
          </div>
        </section>
        <section className="detail-panel" aria-labelledby="detail-title">
          <p className="eyebrow">AUSGEWÄHLTES FACH</p>
          <h2 id="detail-title">{subject.name}</h2>
          <p>Hier entsteht dein Lernbereich. Übungen und Lehrplaninhalte werden in den nächsten Ausbauschritten ergänzt.</p>
        </section>
        <footer>Deine Lernwelt wächst. Dies ist die technische Grundversion.</footer>
      </main>
    </div>
  );
}
