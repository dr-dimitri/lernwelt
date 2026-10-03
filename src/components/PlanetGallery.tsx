import { useEffect, useRef, useState } from 'react';
import {
  getPlanetImages,
  type SolarPlanetImage,
} from '../domain/solar-planet-images';
import type { SolarPlanet } from '../domain/solar-system';

function PlanetPhoto({ image }: { image: SolarPlanetImage }) {
  const [failed, setFailed] = useState(false);
  const [attempt, setAttempt] = useState(0);
  return failed ? (
    <div className="solar-image-error" role="status">
      <p>
        Dieses Bild konnte nicht geladen werden. Du kannst ein anderes ansehen.
      </p>
      <button
        type="button"
        className="secondary-button"
        onClick={() => {
          setAttempt((value) => value + 1);
          setFailed(false);
        }}
      >
        Bild erneut laden
      </button>
    </div>
  ) : (
    <img
      key={attempt}
      className="solar-gallery-image"
      src={image.src}
      alt={image.alt}
      width={image.width}
      height={image.height}
      onError={() => setFailed(true)}
    />
  );
}

function PictureCaption({ image }: { image: SolarPlanetImage }) {
  return (
    <figcaption>
      <strong className="solar-image-title">{image.title}</strong>
      <p className="solar-image-description">{image.caption}</p>
      <span className="solar-image-credit">
        Bild: {image.credit} ·{' '}
        <a href={image.sourcePage} target="_blank" rel="noreferrer">
          NASA-Bildquelle
        </a>
      </span>
    </figcaption>
  );
}

/** The parent keys this gallery by planet ID so a new planet starts at picture 1. */
export default function PlanetGallery({ planet }: { planet: SolarPlanet }) {
  const images = getPlanetImages(planet.id);
  const [index, setIndex] = useState(0);
  const [open, setOpen] = useState(false);
  const dialog = useRef<HTMLDialogElement>(null);
  const trigger = useRef<HTMLButtonElement>(null);
  const closeButton = useRef<HTMLButtonElement>(null);
  const image = images[index];

  useEffect(() => {
    if (open && !dialog.current?.open) {
      dialog.current?.showModal();
      closeButton.current?.focus({ preventScroll: true });
    }
  }, [open]);

  function close() {
    dialog.current?.close();
    setOpen(false);
    trigger.current?.focus({ preventScroll: true });
  }

  function controls(enlarged = false) {
    return (
      <nav
        className="solar-gallery-controls"
        aria-label={`Bilder von ${planet.name}${enlarged ? ' in Großansicht' : ''}`}
      >
        <button
          type="button"
          className="secondary-button"
          aria-label="Vorheriges Bild"
          onClick={() =>
            setIndex((value) => (value + images.length - 1) % images.length)
          }
        >
          <span aria-hidden="true">←</span> Zurück
        </button>
        <span aria-live="polite" aria-atomic="true">
          Bild {index + 1} von {images.length}
        </span>
        <button
          type="button"
          className="secondary-button"
          aria-label="Nächstes Bild"
          onClick={() => setIndex((value) => (value + 1) % images.length)}
        >
          Weiter <span aria-hidden="true">→</span>
        </button>
      </nav>
    );
  }

  return (
    <div className="solar-gallery" aria-label={`Bildgalerie: ${planet.name}`}>
      <figure>
        <PlanetPhoto key={image.id} image={image} />
        {controls()}
        <button
          type="button"
          className="secondary-button solar-image-enlarge"
          ref={trigger}
          onClick={() => setOpen(true)}
        >
          <span aria-hidden="true">⤢</span> Bild vergrößern
        </button>
        <PictureCaption image={image} />
      </figure>
      {open && (
        <dialog
          ref={dialog}
          className="info-dialog solar-image-dialog"
          aria-label={`${planet.name}: Bild vergrößert`}
          onCancel={(event) => {
            event.preventDefault();
            event.stopPropagation();
            close();
          }}
        >
          <div className="dialog-heading">
            <h2>{planet.name} ganz groß</h2>
            <button
              type="button"
              className="secondary-button"
              ref={closeButton}
              onClick={close}
            >
              Schließen
            </button>
          </div>
          <figure>
            <PlanetPhoto key={image.id} image={image} />
            {controls(true)}
            <PictureCaption image={image} />
          </figure>
        </dialog>
      )}
    </div>
  );
}
