import { useEffect, useRef, useState } from 'react';
import { getPlanetImages } from '../domain/solar-planet-images';

const photo = getPlanetImages('earth').find(
  (image) => image.id === 'earth-pia00123',
)!;

function Photo() {
  const [failed, setFailed] = useState(false);
  const [attempt, setAttempt] = useState(0);
  return failed ? (
    <div className="earth-photo-error" role="status">
      <p>
        Das Erdfoto konnte nicht geladen werden. Das Schnittmodell und alle
        Rätsel bleiben nutzbar.
      </p>
      <button
        type="button"
        className="secondary-button"
        onClick={() => {
          setAttempt((a) => a + 1);
          setFailed(false);
        }}
      >
        Bild erneut laden
      </button>
      <p>
        Textalternative: Auf dem Foto siehst du die Erdoberfläche, den
        Pazifischen Ozean und Wolken. Die inneren Schichten sind darauf nicht
        sichtbar.
      </p>
    </div>
  ) : (
    <img
      key={attempt}
      src={photo.src}
      width={photo.width}
      height={photo.height}
      alt={photo.alt}
      onError={() => setFailed(true)}
    />
  );
}

export default function EarthPhoto() {
  const [open, setOpen] = useState(false);
  const dialog = useRef<HTMLDialogElement>(null);
  const trigger = useRef<HTMLButtonElement>(null);
  const closeButton = useRef<HTMLButtonElement>(null);
  useEffect(() => {
    if (open) {
      dialog.current?.showModal();
      closeButton.current?.focus({ preventScroll: true });
    }
  }, [open]);
  function close() {
    dialog.current?.close();
    setOpen(false);
    trigger.current?.focus({ preventScroll: true });
  }
  const caption = (
    <figcaption>
      <strong>Echte Aufnahme · Galileo</strong>
      <p>{photo.caption}</p>
      <small>
        NASA/JPL ·{' '}
        <a href={photo.sourcePage} target="_blank" rel="noreferrer">
          Bildquelle
        </a>
      </small>
    </figcaption>
  );
  return (
    <div className="earth-photo">
      <figure>
        <Photo />
        {caption}
      </figure>
      <button
        ref={trigger}
        type="button"
        className="secondary-button"
        onClick={() => setOpen(true)}
      >
        Erdfoto vergrößern
      </button>
      {open && (
        <dialog
          ref={dialog}
          className="info-dialog earth-photo-dialog"
          aria-label="Erdfoto in Großansicht"
          onCancel={(event) => {
            event.preventDefault();
            event.stopPropagation();
            close();
          }}
        >
          <div className="dialog-heading">
            <h2>Unser blauer Heimatplanet</h2>
            <button
              ref={closeButton}
              type="button"
              className="secondary-button"
              onClick={close}
            >
              Schließen
            </button>
          </div>
          <figure>
            <Photo />
            {caption}
          </figure>
        </dialog>
      )}
    </div>
  );
}
