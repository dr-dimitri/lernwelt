import { useEffect, useId, useRef, useState } from 'react';
import type { Wallet } from '../domain/learning';
import {
  achievements,
  achievementById,
  remainingAchievementProgress,
} from '../domain/achievements';
import { validWallet } from '../lib/wallet-updates';

function BadgeImage({ src, size }: { src: string; size: number }) {
  const [failed, setFailed] = useState(false);
  return failed ? (
    <span
      className="badge-image-fallback"
      aria-hidden="true"
      style={{ width: size, height: size }}
    >
      ✦
    </span>
  ) : (
    <img
      className="badge-image"
      src={src}
      alt=""
      width={size}
      height={size}
      onError={() => setFailed(true)}
    />
  );
}

export default function AchievementBadge({
  wallet,
  error,
  profileReady,
  disabled = false,
  onReload,
}: {
  wallet: Wallet | null;
  error: string;
  profileReady: boolean | null;
  disabled?: boolean;
  onReload: () => void;
}) {
  const [open, setOpen] = useState(false);
  const trigger = useRef<HTMLButtonElement>(null);
  const dialog = useRef<HTMLDialogElement>(null);
  const closeButton = useRef<HTMLButtonElement>(null);
  const titleId = useId();
  const valid = wallet && validWallet(wallet);
  const current = valid ? achievementById(wallet.achievements.currentId) : null;
  const next =
    valid && wallet.achievements.nextId
      ? achievementById(wallet.achievements.nextId)
      : null;
  const unavailable = !!error || (!!wallet && !valid);
  const title = unavailable
    ? 'Lernabzeichen nicht verfügbar'
    : current
      ? current.name
      : 'Lernabzeichen laden …';
  useEffect(() => {
    if (open) {
      dialog.current?.showModal();
      closeButton.current?.focus();
    }
  }, [open]);
  function close() {
    dialog.current?.close();
    setOpen(false);
    trigger.current?.focus({ preventScroll: true });
  }
  const remaining =
    valid && next
      ? remainingAchievementProgress(
          next,
          wallet.totalEarned,
          wallet.achievements.completedTasks,
        )
      : null;
  return (
    <div className="achievement-badge">
      <button
        ref={trigger}
        type="button"
        className="secondary-button current-achievement"
        disabled={disabled}
        aria-label={
          current && !unavailable
            ? `Dein Lernabzeichen: ${current.name}`
            : title
        }
        aria-haspopup="dialog"
        aria-expanded={open}
        onClick={() => setOpen(true)}
      >
        {current && !unavailable && (
          <BadgeImage key={current.id} src={current.image} size={56} />
        )}
        <span>
          <small>Dein Lernabzeichen</small>
          <strong>{title}</strong>
        </span>
      </button>
      <span
        className="achievement-announcement"
        role="status"
        aria-atomic="true"
      >
        {current && !unavailable ? `Dein Lernabzeichen: ${current.name}` : ''}
      </span>
      {open && (
        <dialog
          ref={dialog}
          className="info-dialog achievements-dialog"
          aria-labelledby={titleId}
          onCancel={(event) => {
            event.preventDefault();
            event.stopPropagation();
            close();
          }}
        >
          <div className="dialog-heading">
            <h2 id={titleId}>Deine Lernabzeichen</h2>
            <button
              ref={closeButton}
              type="button"
              className="secondary-button"
              onClick={close}
            >
              Schließen
            </button>
          </div>
          {unavailable ? (
            <div role="alert">
              <p>
                {error || 'Deine Lernabzeichen konnten nicht gelesen werden.'}
              </p>
              <button
                className="secondary-button"
                type="button"
                onClick={onReload}
              >
                Erneut laden
              </button>
            </div>
          ) : !valid ? (
            <p role="status">Deine Lernabzeichen werden geladen …</p>
          ) : (
            <>
              <p className="achievement-explainer">
                Du verdienst Abzeichen mit Punkten und richtig gelösten
                Aufgaben. Beide Ziele gehören zusammen. Erreichte Abzeichen
                bleiben dir auch, wenn du Punkte ausgibst.
              </p>
              {profileReady === false && (
                <p className="achievement-first-start">
                  Speichere deinen Spitznamen in deinem Lernweg. Dann kannst du
                  mit dem Sammeln anfangen.
                </p>
              )}
              <div
                className="achievement-totals"
                aria-label="Dein bestätigter Lernstand"
              >
                <span>
                  Insgesamt verdient:{' '}
                  <strong>
                    {wallet.totalEarned}{' '}
                    {wallet.totalEarned === 1 ? 'Punkt' : 'Punkte'}
                  </strong>
                </span>
                <span>
                  Richtig gelöst:{' '}
                  <strong>
                    {wallet.achievements.completedTasks}{' '}
                    {wallet.achievements.completedTasks === 1
                      ? 'Aufgabe'
                      : 'Aufgaben'}
                  </strong>
                </span>
              </div>
              {next && remaining ? (
                <div
                  className="achievement-next"
                  aria-label="Dein nächstes Abzeichen"
                >
                  <strong>Dein nächstes Ziel: {next.name}</strong>
                  <span>
                    {remaining.points
                      ? `Noch ${remaining.points} ${remaining.points === 1 ? 'Punkt' : 'Punkte'}`
                      : 'Punkte geschafft ✓'}
                  </span>
                  <span>
                    {remaining.tasks
                      ? `Noch ${remaining.tasks} richtig gelöste ${remaining.tasks === 1 ? 'Aufgabe' : 'Aufgaben'}`
                      : 'Aufgaben geschafft ✓'}
                  </span>
                </div>
              ) : (
                <p className="achievement-maximum">
                  Du hast alle sechs Lernabzeichen erreicht! Entdecke weiter,
                  was dich neugierig macht.
                </p>
              )}
              <div
                className="achievement-grid"
                aria-label="Alle sechs Lernabzeichen"
              >
                {achievements.map((achievement, index) => {
                  const earned = wallet.achievements.unlockedIds.includes(
                    achievement.id,
                  );
                  const isCurrent =
                    wallet.achievements.currentId === achievement.id;
                  return (
                    <article
                      key={achievement.id}
                      className={`achievement-card ${earned ? 'earned' : ''}`}
                      aria-current={isCurrent ? 'true' : undefined}
                    >
                      <BadgeImage src={achievement.image} size={96} />
                      <div>
                        <h3>
                          {index + 1}. {achievement.name}
                        </h3>
                        <p>{achievement.description}</p>
                        <p className="achievement-threshold">
                          {index === 0
                            ? 'Dein Startabzeichen'
                            : `${achievement.requiredPoints} Punkte und ${achievement.requiredTasks} richtig gelöste Aufgaben`}
                        </p>
                        <strong className="achievement-state">
                          {isCurrent
                            ? 'Dein aktuelles Abzeichen'
                            : earned
                              ? 'Erreicht ✓'
                              : 'Noch nicht erreicht'}
                        </strong>
                      </div>
                    </article>
                  );
                })}
              </div>
              <p className="achievement-note">
                Diese Abzeichen feiern deine Übung. Sie sind keine Note und kein
                Zeugnis.
              </p>
            </>
          )}
        </dialog>
      )}
    </div>
  );
}
