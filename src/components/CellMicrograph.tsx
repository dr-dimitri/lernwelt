import { useEffect, useRef, useState } from 'react';
import { cellPhoto } from '../domain/cells';

export default function CellMicrograph({
  quiz = false,
  markers = false,
  large = false,
}: {
  quiz?: boolean;
  markers?: boolean;
  large?: boolean;
}) {
  const [failed, setFailed] = useState(false);
  const [loading, setLoading] = useState(true);
  const [attempt, setAttempt] = useState(0);
  return (
    <figure className={`cell-micrograph ${large ? 'is-large' : ''}`}>
      {failed ? (
        <div className="cell-image-fallback" role="alert">
          <strong>Das Mikroskopbild konnte nicht geladen werden.</strong>
          <p>
            Als Textbeobachtung: In einer großen Wangenzelle liegt ein dunkler
            ovaler Bereich. Er wurde mit Methylenblau gefärbt. Seine Anleitungen
            sind im Bild nicht sichtbar.
          </p>
          <svg
            viewBox="0 0 640 480"
            role="img"
            aria-label="Vereinfachter Ersatz der Textbeobachtung: ovaler Bereich A im Zellinneren"
          >
            <rect width="640" height="480" fill="#f4faf6" />
            <path
              d="M90 130Q320 45 570 180L550 350Q260 440 90 350Z"
              fill="#c6dbdc"
              stroke="#608e99"
              strokeWidth="6"
            />
            <ellipse cx="279" cy="240" rx="45" ry="36" fill="#7777bc" />
            <text
              x="279"
              y="249"
              textAnchor="middle"
              fill="white"
              fontSize="30"
            >
              A
            </text>
          </svg>
          <p>Vereinfachte Ersatzgrafik · keine echte Aufnahme.</p>
          <button
            className="secondary-button"
            type="button"
            onClick={() => {
              setFailed(false);
              setLoading(true);
              setAttempt((value) => value + 1);
            }}
          >
            Bild erneut laden
          </button>
        </div>
      ) : (
        <div className="cell-photo-frame">
          {loading && (
            <span className="cell-photo-loading" role="status">
              Bild lädt …
            </span>
          )}
          <img
            key={attempt}
            src={cellPhoto.src}
            width={cellPhoto.width}
            height={cellPhoto.height}
            alt={
              quiz
                ? 'Lichtmikroskopaufnahme gefärbter Wangenzellen. A zeigt einen dunklen ovalen Bereich im Inneren der großen Zelle.'
                : cellPhoto.alt
            }
            onLoad={() => setLoading(false)}
            onError={() => {
              setFailed(true);
              setLoading(false);
            }}
          />
          {(markers || quiz) && (
            <svg
              className="cell-photo-overlay"
              viewBox="0 0 640 480"
              aria-hidden="true"
            >
              <ellipse
                cx="280"
                cy="240"
                rx="56"
                ry="46"
                fill="none"
                stroke="#ffeaaa"
                strokeWidth="5"
                strokeDasharray="9 5"
              />
              <path d="M329 213L405 164" stroke="#ffeaaa" strokeWidth="4" />
              <rect
                x="395"
                y="130"
                width={quiz ? 48 : 131}
                height="41"
                rx="10"
                fill="#fff7db"
              />
              <text
                x={quiz ? 419 : 460}
                y="158"
                textAnchor="middle"
                fill="#503e2d"
                fontSize="25"
                fontWeight="700"
              >
                {quiz ? 'A' : 'Zellkern'}
              </text>
            </svg>
          )}
        </div>
      )}
      <figcaption>
        <strong>
          {failed
            ? 'Zur fehlenden Lichtmikroskopaufnahme · Wangenzellen'
            : 'Lichtmikroskopaufnahme · Wangenzellen'}
        </strong>
        <span>
          {quiz
            ? 'Methylenblau-Färbung. A: dunkler ovaler Bereich im Zellinneren.'
            : cellPhoto.description}
        </span>
        <span>
          {cellPhoto.credit} · Original unverändert, {cellPhoto.width} ×{' '}
          {cellPhoto.height} Bildpunkte. Markierung von Lernwelt separat
          darübergelegt.
        </span>
      </figcaption>
    </figure>
  );
}

export function CellPhotoDialog({ markers }: { markers: boolean }) {
  const [open, setOpen] = useState(false);
  const dialog = useRef<HTMLDialogElement>(null);
  const closeButton = useRef<HTMLButtonElement>(null);
  const trigger = useRef<HTMLButtonElement>(null);
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
  return (
    <>
      <button
        ref={trigger}
        className="secondary-button"
        type="button"
        onClick={() => setOpen(true)}
      >
        Bild vergrößern
      </button>
      {open && (
        <dialog
          ref={dialog}
          className="info-dialog cell-photo-dialog"
          aria-label="Wangenzellen vergrößert"
          onCancel={(event) => {
            event.preventDefault();
            event.stopPropagation();
            close();
          }}
        >
          <div className="dialog-heading">
            <h2>Wangenzellen ganz groß</h2>
            <button
              ref={closeButton}
              className="secondary-button"
              type="button"
              onClick={close}
            >
              Schließen
            </button>
          </div>
          <CellMicrograph markers={markers} large />
          <p>
            Die Datei wird größer dargestellt. Das liefert keine zusätzliche
            Mikroskopauflösung. Kein Maßstabsbalken: Die Quelle nennt keinen
            verlässlichen Maßstab.
          </p>
        </dialog>
      )}
    </>
  );
}
