import { useEffect, useRef, useState } from 'react';

/** Keep a draft until the learner explicitly chooses a different task. */
export default function useConfirmChange(dirty: boolean, busy = false) {
  const [pending, setPending] = useState<(() => void) | null>(null);
  const dialog = useRef<HTMLDialogElement>(null);
  const stay = useRef<HTMLButtonElement>(null);
  const returnFocus = useRef<HTMLElement | null>(null);

  useEffect(() => {
    if (!pending || !dialog.current) return;
    dialog.current.showModal();
    stay.current?.focus();
  }, [pending]);

  function close(change: boolean) {
    dialog.current?.close();
    setPending(null);
    if (change) pending?.();
    else returnFocus.current?.focus({ preventScroll: true });
  }

  function requestChange(action: () => void) {
    if (busy) return;
    if (!dirty) {
      action();
      return;
    }
    returnFocus.current =
      document.activeElement instanceof HTMLElement
        ? document.activeElement
        : null;
    setPending(() => action);
  }

  const confirmation = pending && (
    <dialog
      ref={dialog}
      className="info-dialog change-dialog"
      aria-label="Übung wechseln?"
      onKeyDown={(event) => {
        if (event.key !== 'Escape') return;
        event.preventDefault();
        event.stopPropagation();
        close(false);
      }}
      onCancel={(event) => {
        event.preventDefault();
        event.stopPropagation();
        close(false);
      }}
    >
      <div className="dialog-heading">
        <h2>Übung wechseln?</h2>
      </div>
      <p>
        Deine ungespeicherte Eingabe oder Runde geht beim Wechsel verloren.
        Gespeicherte Punkte bleiben erhalten.
      </p>
      <div className="card-actions">
        <button
          ref={stay}
          type="button"
          className="primary-button"
          onClick={() => close(false)}
        >
          Bleiben
        </button>
        <button
          type="button"
          className="secondary-button"
          onClick={() => close(true)}
        >
          Wechseln
        </button>
      </div>
    </dialog>
  );

  return { requestChange, confirmation };
}
