import { useEffect, useRef, useState, type SubmitEvent } from 'react';
import {
  difficulties,
  type AnswerResult,
  type Difficulty,
  type LearningState,
} from '../domain/learning';
import {
  cellParts,
  cellPhoto,
  cellQuestions,
  cellQuestionVisual,
  cellStations,
  type CellFilter,
  type CellPart,
  type CellType,
} from '../domain/cells';
import { desktop } from '../lib/desktop';
import CellModel from './CellModel';
import CellMicrograph, { CellPhotoDialog } from './CellMicrograph';
import LearningHints from './LearningHints';
import InfoPanel from './InfoPanel';
import ProfilePanel from './ProfilePanel';
import useConfirmChange from './useConfirmChange';
import '../cells.css';

type Station = 'cell' | 'nucleus' | 'microscope' | 'life' | 'drawing';
const discoveryStations: { id: Station; name: string; symbol: string }[] = [
  { id: 'cell', name: 'Winzige Welt', symbol: '◉' },
  { id: 'nucleus', name: 'Zum Zellkern', symbol: '◎' },
  { id: 'microscope', name: 'Forscherblick', symbol: '⌕' },
  { id: 'life', name: 'Was lebt?', symbol: '♧' },
  { id: 'drawing', name: 'Forscherzeichnung', symbol: '✎' },
];
export default function CellWorld({
  profileVersion,
  externalControls = false,
  onActivityChange,
  onProfileSaved,
}: {
  profileVersion: number;
  externalControls?: boolean;
  onActivityChange?: (activity: { dirty: boolean; busy: boolean }) => void;
  onProfileSaved?: () => void;
}) {
  const [mode, setMode] = useState<'discover' | 'quiz'>('discover');
  const [station, setStation] = useState<Station>('cell');
  const [type, setType] = useState<CellType>('animal');
  const [part, setPart] = useState<CellPart>('nucleus');
  const [detailPart, setDetailPart] = useState<CellPart>('envelope');
  const [chain, setChain] = useState(0);
  const [markers, setMarkers] = useState(false);
  const [activityIndex, setActivityIndex] = useState(0);
  const [state, setState] = useState<LearningState | null>(null);
  const [loading, setLoading] = useState(true);
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState('');
  const [reload, setReload] = useState(0);
  const [filter, setFilter] = useState<CellFilter>('all');
  const [offset, setOffset] = useState(0);
  const [index, setIndex] = useState(0);
  const [finished, setFinished] = useState(false);
  const [answer, setAnswer] = useState('');
  const [result, setResult] = useState<AnswerResult | null>(null);
  const [revealed, setRevealed] = useState<string | null>(null);
  const [discoveries, setDiscoveries] = useState<Station[]>(['cell']);
  const revision = useRef(0);
  const inFlight = useRef(false);
  const pending = useRef<{
    id: string;
    questionId: string;
    answer: string;
  } | null>(null);
  const heading = useRef<HTMLHeadingElement>(null);
  const requestFocus = useRef(false);
  const bank = state
    ? cellQuestions(state.questions, state.difficulty, filter)
    : [];
  const round = bank.slice(offset, offset + 6);
  const question = round[index];
  const visual = question ? cellQuestionVisual(question) : null;
  const enabled = !!state?.profileReady && !loading && !busy;
  const dirty = (!!answer && !result && revealed === null) || !!pending.current;
  const { requestChange, confirmation } = useConfirmChange(dirty, busy);
  const activities =
    state?.topics.find((topic) => topic.id === 'nature-cells')?.activities ??
    [];
  const activity = activities[activityIndex];

  useEffect(() => {
    onActivityChange?.({ dirty, busy });
  }, [dirty, busy, onActivityChange]);
  useEffect(() => {
    let active = true;
    const version = ++revision.current;
    setLoading(true);
    setState(null);
    setAnswer('');
    setResult(null);
    setRevealed(null);
    setOffset(0);
    setIndex(0);
    setFinished(false);
    pending.current = null;
    desktop
      .getLearningState()
      .then((value) => {
        if (active && revision.current === version) {
          setState(value);
          setError('');
        }
      })
      .catch((reason: unknown) => {
        if (active && revision.current === version)
          setError(
            reason instanceof Error
              ? reason.message
              : 'Die Zellrätsel konnten nicht geladen werden.',
          );
      })
      .finally(() => {
        if (active && revision.current === version) setLoading(false);
      });
    return () => {
      active = false;
      ++revision.current;
    };
  }, [profileVersion, reload]);
  useEffect(() => {
    if (requestFocus.current && heading.current) {
      heading.current.focus({ preventScroll: true });
      requestFocus.current = false;
    }
  }, [mode, station, index, offset, finished, state?.difficulty]);

  function clear() {
    setAnswer('');
    setResult(null);
    setRevealed(null);
    pending.current = null;
    if (state) setError('');
  }
  function visit(next: Station) {
    requestFocus.current = true;
    setMode('discover');
    setStation(next);
    setDiscoveries((current) =>
      current.includes(next) ? current : [...current, next],
    );
    clear();
  }
  function startQuiz(nextFilter: CellFilter = filter, nextOffset = 0) {
    requestFocus.current = true;
    setMode('quiz');
    setFilter(nextFilter);
    setOffset(nextOffset);
    setIndex(0);
    setFinished(false);
    clear();
  }
  async function changeDifficulty(difficulty: Difficulty) {
    if (!state || inFlight.current || difficulty === state.difficulty) return;
    inFlight.current = true;
    setBusy(true);
    setError('');
    const version = revision.current;
    try {
      const saved = await desktop.setDifficulty(difficulty);
      if (revision.current !== version) return;
      setState((current) => current && { ...current, difficulty: saved });
      requestFocus.current = true;
      setOffset(0);
      setIndex(0);
      setFinished(false);
      clear();
    } catch (reason) {
      if (revision.current === version)
        setError(
          reason instanceof Error
            ? reason.message
            : 'Die Stufe konnte nicht gespeichert werden.',
        );
    } finally {
      inFlight.current = false;
      setBusy(false);
    }
  }
  async function submit(event: SubmitEvent<HTMLFormElement>) {
    event.preventDefault();
    if (
      !question ||
      !answer ||
      !enabled ||
      inFlight.current ||
      result?.correct ||
      revealed !== null
    )
      return;
    inFlight.current = true;
    setBusy(true);
    setError('');
    setResult(null);
    const version = revision.current,
      questionId = question.id;
    if (
      !pending.current ||
      pending.current.questionId !== questionId ||
      pending.current.answer !== answer
    )
      pending.current = { id: crypto.randomUUID(), questionId, answer };
    try {
      const value = await desktop.submitAnswer(
        pending.current.id,
        questionId,
        answer,
      );
      pending.current = null;
      if (revision.current !== version) {
        setReload((current) => current + 1);
        return;
      }
      setState(
        (current) =>
          current && {
            ...current,
            wallet: value.wallet,
            questions: current.questions.map((item) =>
              item.id === questionId && value.correct
                ? { ...item, solved: true }
                : item,
            ),
          },
      );
      setResult(value);
    } catch (reason) {
      if (revision.current === version)
        setError(
          reason instanceof Error
            ? reason.message
            : 'Die Antwort konnte nicht gespeichert werden. Versuche es erneut.',
        );
    } finally {
      inFlight.current = false;
      setBusy(false);
    }
  }
  async function reveal() {
    if (
      !question ||
      loading ||
      inFlight.current ||
      result?.correct ||
      pending.current ||
      revealed !== null
    )
      return;
    inFlight.current = true;
    setBusy(true);
    setError('');
    const version = revision.current;
    try {
      const text = await desktop.getLearningExplanation(question.id);
      if (revision.current === version) {
        setRevealed(text);
        setAnswer('');
        setResult(null);
      }
    } catch (reason) {
      if (revision.current === version)
        setError(
          reason instanceof Error
            ? reason.message
            : 'Die Lösung konnte nicht geladen werden.',
        );
    } finally {
      inFlight.current = false;
      setBusy(false);
    }
  }
  function next() {
    requestFocus.current = true;
    if (index + 1 >= round.length) setFinished(true);
    else setIndex((value) => value + 1);
    clear();
  }
  const sourcePanel = (
    <InfoPanel paginate className="cell-sources">
      <summary>Quellen, Bilder und Modellgrenzen</summary>
      <article>
        <h3>Ein kleines Stück Biologie Klasse 5</h3>
        <p>
          NT5 2.2: Zellbestandteile sowie Vergleich von Tier- und Pflanzenzellen
          anhand von Zeichnungen und Mikroskopbildern. NT5 2.1 und 1.1:
          Beobachten, Zeichnen und Modelle. Geprüft am 06.10.2026. Keine
          vollständige Lehrplanabdeckung und kein Ersatz für praktisches
          Mikroskopieren.
        </p>
        <p>
          <a
            href="https://www.lehrplanplus.bayern.de/fachlehrplan/gymnasium/5/nt_gym"
            target="_blank"
            rel="noreferrer"
          >
            LehrplanPLUS NT5
          </a>{' '}
          ·{' '}
          <a
            href="https://www.genome.gov/genetics-glossary/Nucleus"
            target="_blank"
            rel="noreferrer"
          >
            NHGRI: Zellkern
          </a>{' '}
          ·{' '}
          <a
            href="https://medlineplus.gov/genetics/understanding/basics/cell/"
            target="_blank"
            rel="noreferrer"
          >
            MedlinePlus: Zelle
          </a>
        </p>
      </article>
      <article>
        <h3>Das echte Mikroskopbild</h3>
        <p>
          {cellPhoto.description} {cellPhoto.credit}.
        </p>
        <p>
          Originaldatei unverändert, 640 × 480 Bildpunkte. Unsere Markierung
          liegt separat über dem Bild. Die Bilddatei und diese
          Markierungsansicht dürfen unter CC BY-SA 4.0 weitergegeben werden.
          Kein belegter Maßstab in der Quelle; deshalb keine erfundenen Größen
          oder Maßstabsbalken.
        </p>
        <p>
          <a href={cellPhoto.source} target="_blank" rel="noreferrer">
            Original und Urheberangabe
          </a>{' '}
          ·{' '}
          <a href={cellPhoto.license} target="_blank" rel="noreferrer">
            Lizenz CC BY-SA 4.0
          </a>
        </p>
        <p>
          Alle Bilder und Texte sind lokal enthalten. Nur die Quellenlinks
          benötigen Internet.
        </p>
      </article>
      <article>
        <h3>Was unsere Bilder erklären</h3>
        <p>
          Die drei Modelle sind eigene Illustrationen. Formen, Größen, Farben
          und die Linien für Erbinformation sind vereinfacht. Wir zeigen
          typische Tierzellen und eine grüne Pflanzenzelle. Nicht jede
          Pflanzenzelle besitzt Chloroplasten, nicht jede Zelle einen Zellkern.
        </p>
        <p>
          Die Anleitungsbibliothek ist ein Vergleich. Der Zellkern ist kein
          denkender Chef. Viele Zellbestandteile arbeiten zusammen. Vertiefte
          DNA-Struktur ist hier kein Lernziel.
        </p>
      </article>
    </InfoPanel>
  );

  return (
    <section
      className={`cell-world ${mode === 'quiz' ? 'cell-is-quiz' : ''} ${error ? 'cell-has-error' : ''}`}
      aria-labelledby="cell-title"
    >
      <header className="cell-intro">
        <div>
          <p className="eyebrow">NATUR UND TECHNIK · DEINE WINZIGE WELT</p>
          <h2 id="cell-title">Expedition Zellkern</h2>
          <p>Eine Zelle steckt voller Entdeckungen. Schau hinein!</p>
        </div>
        <div className="cell-pass">
          <strong>{discoveries.length} von 5 Stationen besucht</strong>
          <small>Für diese Reise · kein gespeicherter Lernerfolg</small>
        </div>
      </header>
      <div className="cell-mode">
        <button
          type="button"
          className={
            mode === 'discover' ? 'primary-button' : 'secondary-button'
          }
          aria-pressed={mode === 'discover'}
          disabled={busy}
          onClick={() => requestChange(() => visit(station))}
        >
          Entdecken
        </button>
        <button
          type="button"
          className={mode === 'quiz' ? 'primary-button' : 'secondary-button'}
          aria-pressed={mode === 'quiz'}
          disabled={busy}
          onClick={() => requestChange(() => startQuiz('all'))}
        >
          Zellrätsel
        </button>
        {sourcePanel}
      </div>
      {error && (
        <div className="cell-error" role="alert">
          <p>{error}</p>
          {!state && (
            <button
              type="button"
              className="secondary-button"
              disabled={loading}
              onClick={() => setReload((value) => value + 1)}
            >
              Erneut laden
            </button>
          )}
        </div>
      )}
      {state && !externalControls && (
        <div
          className="difficulty-options cell-levels"
          aria-label="Schwierigkeitsgrad"
        >
          {difficulties.map((level) => (
            <button
              key={level.id}
              type="button"
              aria-pressed={state.difficulty === level.id}
              disabled={busy || loading}
              onClick={() =>
                requestChange(() => void changeDifficulty(level.id))
              }
            >
              {level.name}
            </button>
          ))}
        </div>
      )}
      {mode === 'discover' ? (
        <>
          <nav className="cell-stations" aria-label="Entdeckungsstationen">
            {discoveryStations.map((item) => (
              <button
                key={item.id}
                type="button"
                aria-pressed={station === item.id}
                onClick={() => visit(item.id)}
              >
                <span aria-hidden="true">{item.symbol}</span>
                {item.name}
                {discoveries.includes(item.id) && (
                  <span className="cell-visited" aria-label="besucht">
                    ✓
                  </span>
                )}
              </button>
            ))}
          </nav>
          <h3 ref={heading} tabIndex={-1} className="cell-station-heading">
            {discoveryStations.find((item) => item.id === station)!.name}
          </h3>
          {station === 'cell' ? (
            <div className="cell-workspace">
              <div>
                <div className="cell-type-choice" aria-label="Zelltyp">
                  <button
                    type="button"
                    aria-pressed={type === 'animal'}
                    onClick={() => {
                      setType('animal');
                      setPart('nucleus');
                    }}
                  >
                    Tierzelle
                  </button>
                  <button
                    type="button"
                    aria-pressed={type === 'plant'}
                    onClick={() => {
                      setType('plant');
                      setPart('nucleus');
                    }}
                  >
                    Pflanzenzelle
                  </button>
                </div>
                <CellModel type={type} selected={part} onSelect={setPart} />
              </div>
              <article className="cell-note">
                <p className="eyebrow">DEINE FORSCHERLUPE</p>
                <h4>{cellParts[part].name}</h4>
                <p>{cellParts[part].explanation}</p>
                <p>
                  Wähle einen Bereich im Bild oder einen der beschrifteten
                  Knöpfe.
                </p>
                <button
                  type="button"
                  className="primary-button"
                  onClick={() => visit('nucleus')}
                >
                  Reise zum Zellkern
                </button>
                <button
                  type="button"
                  className="secondary-button"
                  disabled={busy}
                  onClick={() => startQuiz('cell')}
                >
                  Zellteile üben
                </button>
                <small>
                  Typische Zellen als Modell. Nicht jede echte Zelle sieht so
                  aus.
                </small>
              </article>
            </div>
          ) : station === 'nucleus' ? (
            <div className="cell-workspace">
              <CellModel
                detail
                selected={detailPart}
                onSelect={setDetailPart}
              />
              <article className="cell-note">
                <p className="eyebrow">DETAILMODELL · KEIN FOTO</p>
                <h4>{cellParts[detailPart].name}</h4>
                <p>{cellParts[detailPart].explanation}</p>
                <div
                  className="cell-chain"
                  aria-label="Zelle, Zellkern, Erbinformation"
                >
                  {['Zelle', 'Zellkern', 'Erbinformation'].map((name, i) => (
                    <button
                      key={name}
                      type="button"
                      aria-pressed={chain === i}
                      onClick={() => setChain(i)}
                    >
                      {i + 1}. {name}
                    </button>
                  ))}
                </div>
                <p>
                  {
                    [
                      'Die ganze Zelle: viele Teile arbeiten zusammen.',
                      'Der Zellkern liegt innerhalb der Zelle. Eine Kernhülle grenzt ihn ab.',
                      'Die Anleitungsbibliothek: Im Zellkern liegt ein großer Teil der Erbinformation. Der Vergleich meint keine echten Bücher.',
                    ][chain]
                  }
                </p>
                <button
                  className="secondary-button"
                  type="button"
                  onClick={() => visit('cell')}
                >
                  Zur Gesamtzelle
                </button>
                <button
                  className="primary-button"
                  type="button"
                  disabled={busy}
                  onClick={() => startQuiz('nucleus')}
                >
                  Zellkern üben
                </button>
              </article>
            </div>
          ) : station === 'microscope' ? (
            <div className="cell-comparison">
              <div>
                <CellModel type="animal" />
                <p className="cell-comparison-note">
                  Das Modell macht Teile durch klare Formen und gewählte Farben
                  sichtbar.
                </p>
              </div>
              <div>
                <CellMicrograph markers={markers} />
                <div className="cell-photo-actions">
                  <button
                    className="secondary-button"
                    type="button"
                    aria-pressed={markers}
                    onClick={() => setMarkers((value) => !value)}
                  >
                    {markers
                      ? 'Markierung ausblenden'
                      : 'Markierung einblenden'}
                  </button>
                  <CellPhotoDialog markers={markers} />
                </div>
                <p>
                  Der Zellkern ist dunkel gefärbt. Die Kernhülle und
                  DNA-Einzelheiten sind hier nicht sicher erkennbar. Ein größer
                  angezeigtes Foto liefert keine neuen Einzelheiten.
                </p>
                <button
                  className="primary-button"
                  type="button"
                  disabled={busy}
                  onClick={() => startQuiz('microscope')}
                >
                  Forscherblick üben
                </button>
              </div>
            </div>
          ) : station === 'life' ? (
            <div className="cell-life">
              <div className="cell-life-art" aria-hidden="true">
                <span>♧</span>
                <span>🐈</span>
                <span>⚙</span>
              </div>
              <article className="cell-note">
                <h4>Läuft ein Baum? Lebt ein Auto?</h4>
                <p>
                  Bewegung allein entscheidet nicht. Lebewesen bestehen aus
                  Zellen. Sie wachsen, entwickeln sich und tauschen Stoffe mit
                  ihrer Umwelt aus. Sie reagieren auf Reize.
                </p>
                <p>
                  Ein Stoffwechsel bedeutet: Stoffe aufnehmen, umwandeln und
                  abgeben. Ein Spielzeugroboter hat keinen eigenen Stoffwechsel.
                </p>
                <button
                  className="primary-button"
                  type="button"
                  disabled={busy}
                  onClick={() => startQuiz('life')}
                >
                  Was lebt? Üben
                </button>
                <button
                  className="secondary-button"
                  type="button"
                  onClick={() => {
                    setActivityIndex(1);
                    visit('drawing');
                  }}
                >
                  Mit Karten erklären
                </button>
              </article>
            </div>
          ) : (
            <div className="cell-workspace cell-drawing">
              <div>
                <CellModel type="plant" />
                <p>Hol Papier und Stifte. Gehe die Schritte in Ruhe durch.</p>
              </div>
              <article className="cell-note">
                <div className="cell-activity-choice">
                  {['Eine Zelle als Modell', 'Leben oder Bewegung?'].map(
                    (title, i) => (
                      <button
                        key={title}
                        type="button"
                        aria-pressed={activityIndex === i}
                        onClick={() => setActivityIndex(i)}
                      >
                        {title}
                      </button>
                    ),
                  )}
                </div>
                {activity ? (
                  <>
                    <h4>{activity.title}</h4>
                    <ol>
                      {activity.prompt.split('\n').map((step) => (
                        <li key={step}>{step.replace(/^\d+\.\s*/, '')}</li>
                      ))}
                    </ol>
                    {activityIndex === 0 && (
                      <p>Erkläre jemandem: Welche Aufgabe hat der Zellkern?</p>
                    )}
                    <InfoPanel>
                      <summary>Meine Selbstkontrolle</summary>
                      <p>{activity.check}</p>
                      {activityIndex === 0 && (
                        <p>
                          Im Zellkern liegt ein großer Teil der Erbinformation.
                          Sie enthält wichtige Anleitungen. Dein Modell ist eine
                          Vereinfachung.
                        </p>
                      )}
                    </InfoPanel>
                  </>
                ) : (
                  <>
                    <p>
                      {loading
                        ? 'Deine Mitmachmissionen werden geladen …'
                        : 'Die Originalmissionen konnten nicht geladen werden. Du kannst trotzdem zeichnen: Eine typische Tierzelle und eine grüne Pflanzenzelle. Beschrifte die Teile und erkläre den Zellkern.'}
                    </p>
                  </>
                )}
                <p>
                  Selbstkontrolle ohne automatische Bewertung und ohne
                  Lernpunkte.
                </p>
              </article>
            </div>
          )}
        </>
      ) : loading ? (
        <p role="status">Deine Zellrätsel werden geladen …</p>
      ) : !state ? (
        <p>
          Du kannst alle Bilder und Stationen entdecken. Gespeicherte Rätsel
          brauchen die lokalen Daten der Desktop-App.
        </p>
      ) : (
        <>
          <div className="cell-filters" aria-label="Rätsel auswählen">
            {cellStations.map((item) => (
              <button
                key={item.id}
                type="button"
                disabled={busy}
                aria-pressed={filter === item.id}
                onClick={() => requestChange(() => startQuiz(item.id))}
              >
                {item.label}
                <small>
                  {
                    cellQuestions(state.questions, state.difficulty, item.id)
                      .length
                  }
                </small>
              </button>
            ))}
          </div>
          {!state.profileReady &&
            (externalControls ? (
              <ProfilePanel
                compact
                onActivityChange={onActivityChange}
                onSaved={() => {
                  setReload((value) => value + 1);
                  onProfileSaved?.();
                }}
              />
            ) : (
              <p className="status-message">
                Speichere oben unter „Dein Profil“ deinen Namen, um Antworten
                und Punkte zu speichern. Entdecken ist schon möglich.
              </p>
            ))}
          {externalControls && !state.profileReady ? null : finished ? (
            <div className="cell-round-end">
              <span className="cell-round-star" aria-hidden="true">
                ✦
              </span>
              <h3 ref={heading} tabIndex={-1}>
                Eine Forscherpause für dich!
              </h3>
              <p>
                Deine kurze Runde ist zu Ende.{' '}
                {bank.filter((q) => q.solved).length} von {bank.length} Rätseln
                in dieser Auswahl sind schon gelöst.
              </p>
              <div className="card-actions">
                <button
                  className="primary-button"
                  type="button"
                  onClick={() =>
                    startQuiz(
                      filter,
                      offset + round.length < bank.length
                        ? offset + round.length
                        : 0,
                    )
                  }
                >
                  Weitere Zellrätsel
                </button>
                <button
                  className="secondary-button"
                  type="button"
                  onClick={() => visit('cell')}
                >
                  Weiter entdecken
                </button>
              </div>
              <p>Alle Stationen und Stufen bleiben frei wählbar.</p>
            </div>
          ) : question ? (
            <div className={`cell-quiz ${visual ? 'has-visual' : ''}`}>
              <div className="cell-question-card">
                <p className="eyebrow">
                  ZELLRÄTSEL {index + 1} VON {round.length} ·{' '}
                  {
                    difficulties.find((level) => level.id === state.difficulty)!
                      .name
                  }
                </p>
                <h3 ref={heading} tabIndex={-1}>
                  {question.prompt}
                </h3>
                <form onSubmit={(event) => void submit(event)}>
                  <fieldset
                    disabled={
                      !enabled || !!result?.correct || revealed !== null
                    }
                  >
                    <legend>Deine Antwort</legend>
                    {question.answerKind === 'choice' ? (
                      <div className="cell-answer-options">
                        {question.options.map((option) => (
                          <label
                            key={option}
                            className={answer === option ? 'is-selected' : ''}
                          >
                            <input
                              type="radio"
                              name="cell-answer"
                              checked={answer === option}
                              value={option}
                              onChange={() => {
                                setAnswer(option);
                                setResult(null);
                              }}
                            />
                            {option}
                          </label>
                        ))}
                      </div>
                    ) : (
                      <label>
                        Antwort{question.unit && ` in ${question.unit}`}
                        <input
                          type="text"
                          inputMode={
                            question.answerKind === 'number'
                              ? 'decimal'
                              : 'text'
                          }
                          value={answer}
                          onChange={(event) => {
                            setAnswer(event.target.value);
                            setResult(null);
                          }}
                          autoComplete="off"
                        />
                      </label>
                    )}
                  </fieldset>
                  <div className="cell-answer-actions">
                    <button
                      type="submit"
                      className="primary-button"
                      disabled={
                        !enabled ||
                        !answer ||
                        !!result?.correct ||
                        revealed !== null
                      }
                    >
                      {busy
                        ? 'Wird gespeichert …'
                        : pending.current
                          ? 'Erneut speichern'
                          : 'Antwort prüfen'}
                    </button>
                    <button
                      type="button"
                      className="secondary-button"
                      disabled={
                        loading ||
                        busy ||
                        !!result?.correct ||
                        revealed !== null ||
                        !!pending.current
                      }
                      onClick={() => void reveal()}
                    >
                      Lösung aufdecken · 0 Punkte
                    </button>
                  </div>
                </form>
                {question.solved && !result?.correct && (
                  <p className="cell-solved">
                    Schon gelöst · Wiederholen gibt keine weiteren Punkte.
                  </p>
                )}
                <LearningHints key={question.id} question={question} />
                {revealed !== null && (
                  <div role="status" className="cell-feedback">
                    <strong>Aufgedeckt · keine Punkte</strong>
                    <p>{revealed}</p>
                    <p>
                      Gehe weiter. In einer späteren Runde kannst du es selbst
                      versuchen.
                    </p>
                  </div>
                )}
                {result && (
                  <div
                    role="status"
                    className={`cell-feedback ${result.correct ? 'is-correct' : ''}`}
                  >
                    <strong>
                      {result.correct
                        ? result.pointsAwarded
                          ? `Richtig! +${result.pointsAwarded} ${result.pointsAwarded === 1 ? 'Punkt' : 'Punkte'}`
                          : 'Richtig! Schon gelöst – keine weiteren Punkte.'
                        : 'Noch nicht ganz. Probiere es in Ruhe noch einmal.'}
                    </strong>
                    {result.correct ? (
                      <p>{result.explanation}</p>
                    ) : (
                      <>
                        {result.mistakeHint && <p>{result.mistakeHint}</p>}
                        <button
                          type="button"
                          className="secondary-button"
                          onClick={() => {
                            setResult(null);
                            setAnswer('');
                          }}
                        >
                          Noch einmal versuchen
                        </button>
                      </>
                    )}
                  </div>
                )}
                <button
                  type="button"
                  className={
                    result?.correct ? 'primary-button' : 'secondary-button'
                  }
                  disabled={busy}
                  onClick={() => requestChange(next)}
                >
                  {index + 1 === round.length ? 'Runde abschließen' : 'Weiter'}
                </button>
                <p className="cell-points-note">
                  Eine neue richtige Lösung bringt{' '}
                  {state.pointsByDifficulty[question.difficulty]}{' '}
                  {state.pointsByDifficulty[question.difficulty] === 1
                    ? 'Punkt'
                    : 'Punkte'}
                  . Tipps, Fehler, Aufdecken und Wiederholungen bringen keine
                  zusätzlichen Punkte.
                </p>
              </div>
              {visual && (
                <aside className="cell-quiz-art" aria-label="Bild zur Aufgabe">
                  {visual.kind === 'animal' || visual.kind === 'plant' ? (
                    <CellModel type={visual.kind} quizTarget={visual.target} />
                  ) : visual.kind === 'nucleus' ? (
                    <CellModel detail quizTarget={visual.target} />
                  ) : visual.kind === 'micro' || visual.kind === 'compare' ? (
                    <>
                      <CellMicrograph quiz />
                      {visual.kind === 'compare' && (
                        <CellModel type="animal" quizTarget="nucleus" />
                      )}
                    </>
                  ) : (
                    <div className="cell-relation-art">
                      <svg
                        viewBox="0 0 600 320"
                        role="img"
                        aria-label="Modell einer Zelle mit einem runden Innenbereich"
                      >
                        <path
                          d="M60 160Q80 30 305 55T550 170Q540 300 280 278T60 160Z"
                          fill="#c4e7d5"
                          stroke="#448774"
                          strokeWidth="9"
                        />
                        <ellipse
                          cx="310"
                          cy="170"
                          rx="90"
                          ry="70"
                          fill="#bea7e1"
                          stroke="#7961a9"
                          strokeWidth="7"
                        />
                      </svg>
                      <p>
                        Modell · Formen, Farben und Größen sind vereinfacht.
                      </p>
                    </div>
                  )}
                </aside>
              )}
            </div>
          ) : (
            <p role="alert">
              Für diese Auswahl sind keine Rätsel geladen. Wähle eine andere
              Station oder entdecke die Zellen weiter.
            </p>
          )}
        </>
      )}
      {confirmation}
    </section>
  );
}
