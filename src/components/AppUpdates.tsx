import { useEffect, useRef, useState } from 'react';
import { updater, type AvailableUpdate } from '../lib/updater';
import '../updates.css';

type Phase =
  'idle' | 'checking' | 'current' | 'available' | 'installing' | 'installed';

export default function AppUpdates() {
  const [open, setOpen] = useState(false);
  const [phase, setPhase] = useState<Phase>('idle');
  const [version, setVersion] = useState('');
  const [nextVersion, setNextVersion] = useState('');
  const [notes, setNotes] = useState('');
  const [automatic, setAutomatic] = useState(false);
  const [error, setError] = useState('');
  const [preferenceError, setPreferenceError] = useState('');
  const [progress, setProgress] = useState<number | null>(null);
  const [downloadFinished, setDownloadFinished] = useState(false);
  const [restarting, setRestarting] = useState(false);
  const dialog = useRef<HTMLDialogElement>(null);
  const trigger = useRef<HTMLButtonElement>(null);
  const update = useRef<AvailableUpdate | null>(null);
  const busy = useRef(false);
  const mounted = useRef(false);
  const initialized = useRef(false);
  const native = updater.available();

  async function checkForUpdates() {
    if (!native || busy.current) return;
    busy.current = true;
    setPhase('checking');
    setError('');
    const old = update.current;
    update.current = null;
    if (old) void old.close().catch(() => undefined);
    try {
      const found = await updater.check();
      if (!mounted.current) {
        if (found) void found.close().catch(() => undefined);
        return;
      }
      update.current = found;
      setNextVersion(found?.version ?? '');
      setNotes(found?.body ?? '');
      setPhase(found ? 'available' : 'current');
    } catch {
      if (mounted.current) {
        setPhase('idle');
        setError(
          'Die Update-Prüfung hat nicht geklappt. Prüfe deine Internetverbindung und versuche es später erneut. Du kannst weiterlernen.',
        );
      }
    } finally {
      busy.current = false;
    }
  }

  useEffect(() => {
    mounted.current = true;
    if (!initialized.current && native) {
      initialized.current = true;
      void updater
        .version()
        .then((value) => {
          if (mounted.current) setVersion(value);
        })
        .catch(() => {
          if (mounted.current) setVersion('nicht verfügbar');
        });
      try {
        const enabled = updater.preference();
        setAutomatic(enabled);
        if (enabled) void checkForUpdates();
      } catch {
        setPreferenceError(
          'Die Einstellung konnte nicht gelesen werden. Du kannst manuell nach Updates suchen.',
        );
      }
    }
    return () => {
      mounted.current = false;
      const current = update.current;
      if (current && !busy.current) {
        update.current = null;
        void current.close().catch(() => undefined);
      }
    };
    // The application keeps this controller mounted across learning views.
  }, []);

  useEffect(() => {
    if (open && !dialog.current?.open) dialog.current?.showModal();
  }, [open]);

  function close() {
    if (busy.current && phase === 'installing') return;
    if (restarting) return;
    dialog.current?.close();
    setOpen(false);
    trigger.current?.focus();
  }

  async function install() {
    const current = update.current;
    if (!current || busy.current) return;
    busy.current = true;
    setPhase('installing');
    setError('');
    setProgress(null);
    setDownloadFinished(false);
    let received = 0;
    let total = 0;
    try {
      await current.downloadAndInstall((event) => {
        if (!mounted.current) return;
        if (event.event === 'Started') total = event.data.contentLength ?? 0;
        if (event.event === 'Progress') {
          received += event.data.chunkLength;
          if (total > 0)
            setProgress(Math.min(100, Math.round((100 * received) / total)));
        }
        if (event.event === 'Finished') setDownloadFinished(true);
      });
      if (mounted.current) setPhase('installed');
    } catch {
      if (mounted.current) {
        setPhase('available');
        setError(
          'Das Update konnte nicht sicher installiert werden. Prüfe deine Verbindung und den freien Speicher. Versuche es erneut oder lerne mit dieser Version weiter.',
        );
      }
    } finally {
      busy.current = false;
    }
  }

  async function restart() {
    if (busy.current) return;
    busy.current = true;
    setRestarting(true);
    setError('');
    try {
      await updater.restart();
    } catch {
      setError(
        'Der Neustart hat nicht geklappt. Beende Lernwelt und öffne die App erneut. Das Update ist bereits installiert.',
      );
    } finally {
      busy.current = false;
      setRestarting(false);
    }
  }

  return (
    <div className="app-updates">
      <button
        ref={trigger}
        className="secondary-button"
        onClick={() => setOpen(true)}
      >
        {phase === 'available'
          ? 'Update verfügbar'
          : phase === 'installed'
            ? 'App neu starten'
            : 'App aktualisieren'}
      </button>
      {open && (
        <dialog
          ref={dialog}
          className="info-dialog update-dialog"
          aria-label="App aktualisieren"
          onCancel={(event) => {
            event.preventDefault();
            close();
          }}
        >
          <div className="dialog-heading">
            <h2>App aktualisieren</h2>
            <button
              className="secondary-button"
              disabled={phase === 'installing' || restarting}
              onClick={close}
            >
              Schließen
            </button>
          </div>
          {!native ? (
            <p>Updates sind in der installierten Lernwelt-App verfügbar.</p>
          ) : (
            <div className="update-content">
              <p>
                Installierte Version:{' '}
                <strong>{version || 'wird geladen …'}</strong>
              </p>
              <label className="update-preference">
                <input
                  type="checkbox"
                  checked={automatic}
                  disabled={phase === 'installing' || restarting}
                  onChange={(event) => {
                    try {
                      updater.savePreference(event.target.checked);
                      setAutomatic(event.target.checked);
                      setPreferenceError('');
                    } catch {
                      setPreferenceError(
                        'Die Einstellung konnte nicht gespeichert werden. Versuche es erneut.',
                      );
                    }
                  }}
                />
                Beim Start automatisch nach Updates suchen
              </label>
              <p className="sample-note">
                Die Prüfung lädt Versionsinformationen von GitHub. Dein Profil
                und deine Antworten bleiben auf deinem Gerät. Zum Lernen
                brauchst du kein Internet.
              </p>
              {preferenceError && (
                <p role="alert" className="error-message">
                  {preferenceError}
                </p>
              )}
              {error && (
                <p role="alert" className="error-message">
                  {error}
                </p>
              )}
              {phase === 'checking' && (
                <p role="status">Suche nach einer neuen Version …</p>
              )}
              {phase === 'current' && (
                <p role="status">Du hast die aktuelle Version.</p>
              )}
              {(phase === 'available' || phase === 'installing') && (
                <h3>Version {nextVersion} ist verfügbar</h3>
              )}
              {notes && (phase === 'available' || phase === 'installing') && (
                <details>
                  <summary>Was ist neu?</summary>
                  <p className="release-notes">{notes}</p>
                </details>
              )}
              {phase === 'available' && (
                <>
                  <p>
                    Beende zuerst deine aktuelle Aufgabe. Beim Aktualisieren
                    kann die App geschlossen werden. Dein gespeicherter
                    Lernfortschritt bleibt erhalten.
                  </p>
                  <button
                    className="primary-button"
                    onClick={() => void install()}
                  >
                    Update herunterladen und installieren
                  </button>
                </>
              )}
              {phase === 'installing' && (
                <div role="status">
                  <p>
                    {downloadFinished
                      ? 'Download abgeschlossen. Signatur wird geprüft und Update installiert …'
                      : 'Update wird heruntergeladen …'}
                  </p>
                  <progress
                    aria-label="Update herunterladen"
                    max={100}
                    value={progress ?? undefined}
                  />
                  {progress !== null && <span> {progress} %</span>}
                </div>
              )}
              {phase === 'installed' && (
                <>
                  <p role="status">
                    Das Update ist installiert. Starte Lernwelt neu, um es zu
                    verwenden.
                  </p>
                  <button
                    className="primary-button"
                    disabled={restarting}
                    onClick={() => void restart()}
                  >
                    {restarting ? 'App startet neu …' : 'Jetzt neu starten'}
                  </button>
                </>
              )}
              {phase !== 'installing' && phase !== 'installed' && (
                <button
                  className="secondary-button"
                  disabled={phase === 'checking'}
                  onClick={() => void checkForUpdates()}
                >
                  Nach Updates suchen
                </button>
              )}
            </div>
          )}
        </dialog>
      )}
    </div>
  );
}
