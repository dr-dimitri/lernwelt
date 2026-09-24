import {
  Children,
  isValidElement,
  useEffect,
  useRef,
  useState,
  type ReactNode,
  type RefObject,
} from 'react';

/** Small, keyboard-accessible pages instead of expanding the current exercise. */
export default function InfoPanel({
  children,
  className = '',
  paginate = false,
  onOpenChange,
  autoOpen = false,
  returnFocusRef,
}: {
  children: ReactNode;
  className?: string;
  paginate?: boolean;
  autoOpen?: boolean;
  returnFocusRef?: RefObject<HTMLElement | null>;
  onOpenChange?: (open: boolean) => void;
}) {
  const parts = Children.toArray(children);
  const summary = parts.find(
    (child) => isValidElement(child) && child.type === 'summary',
  );
  const label = isValidElement<{ children: ReactNode }>(summary)
    ? summary.props.children
    : 'Mehr erfahren';
  const contents = parts.filter((child) => child !== summary);
  const pages = paginate ? contents : [contents];
  const [open, setOpen] = useState(autoOpen);
  const [page, setPage] = useState(0);
  const dialog = useRef<HTMLDialogElement>(null);
  const trigger = useRef<HTMLButtonElement>(null);
  useEffect(() => {
    if (open && !dialog.current?.open) dialog.current?.showModal();
  }, [open]);
  function close() {
    dialog.current?.close();
    setOpen(false);
    onOpenChange?.(false);
    (returnFocusRef?.current ?? trigger.current)?.focus({
      preventScroll: true,
    });
  }
  return (
    <div className={`info-panel ${className}`}>
      <button
        type="button"
        className="secondary-button"
        ref={trigger}
        onClick={() => {
          setPage(0);
          setOpen(true);
          onOpenChange?.(true);
        }}
      >
        {label}
      </button>
      {open && (
        <dialog
          onClick={(event) => {
            if ((event.target as HTMLElement).closest('[data-close-info]'))
              close();
          }}
          ref={dialog}
          className="info-dialog"
          aria-label={typeof label === 'string' ? label : 'Lernhilfe'}
          onCancel={(event) => {
            event.preventDefault();
            event.stopPropagation();
            close();
          }}
        >
          <div className="dialog-heading">
            <h2>{label}</h2>
            <button type="button" className="secondary-button" onClick={close}>
              Schließen
            </button>
          </div>
          <div className="dialog-page">
            {pages[Math.min(page, pages.length - 1)]}
          </div>
          {pages.length > 1 && (
            <nav className="page-controls" aria-label="Infoseiten">
              <button
                className="secondary-button"
                disabled={!page}
                onClick={() => setPage((p) => p - 1)}
              >
                ← Zurück
              </button>
              <span aria-live="polite">
                Seite {page + 1} von {pages.length}
              </span>
              <button
                className="primary-button"
                disabled={page >= pages.length - 1}
                onClick={() => setPage((p) => p + 1)}
              >
                Weiter →
              </button>
            </nav>
          )}
        </dialog>
      )}
    </div>
  );
}
