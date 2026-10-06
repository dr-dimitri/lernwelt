import { useEffect, useId, useState, type SubmitEvent } from 'react';
import { desktop } from '../lib/desktop';

export default function ProfilePanel({
  onSaved,
  compact = false,
  onActivityChange,
  onBeforeSave,
  onBusyChange,
}: {
  onSaved?: () => void;
  compact?: boolean;
  onActivityChange?: (activity: { dirty: boolean; busy: boolean }) => void;
  onBeforeSave?: (save: () => void) => void;
  onBusyChange?: (busy: boolean) => void;
}) {
  const id = useId();
  const [name, setName] = useState('');
  const [savedName, setSavedName] = useState('');
  const [savedGrade, setSavedGrade] = useState(5);
  const [state, setState] = useState<
    'loading' | 'ready' | 'saving' | 'unavailable'
  >('loading');
  const [error, setError] = useState('');
  const [notice, setNotice] = useState('');
  const [reload, setReload] = useState(0);

  useEffect(() => {
    onActivityChange?.({
      dirty: name !== savedName,
      busy: state === 'saving',
    });
  }, [name, savedName, state, onActivityChange]);

  useEffect(() => {
    let active = true;
    setState('loading');
    setError('');
    desktop
      .getProfile()
      .then((profile) => {
        if (!active) return;
        setName(profile?.displayName ?? '');
        setSavedName(profile?.displayName ?? '');
        setSavedGrade(profile?.grade ?? 5);
        setState('ready');
      })
      .catch((reason: unknown) => {
        if (!active) return;
        setError(
          reason instanceof Error
            ? reason.message
            : 'Dein Profil konnte nicht geladen werden.',
        );
        setState('unavailable');
      });
    return () => {
      active = false;
    };
  }, [reload]);

  async function save(event: SubmitEvent<HTMLFormElement>) {
    event.preventDefault();
    if (onBeforeSave) {
      onBeforeSave(() => void persist());
      return;
    }
    await persist();
  }

  async function persist() {
    if (state !== 'ready') return;
    setState('saving');
    onBusyChange?.(true);
    setError('');
    setNotice('');
    try {
      const profile = await desktop.saveProfile({
        displayName: name,
        grade: 5,
      });
      setName(profile.displayName);
      setSavedName(profile.displayName);
      setSavedGrade(profile.grade);
      setNotice('Dein Lernprofil wurde auf diesem Gerät gespeichert.');
      onSaved?.();
    } catch (reason) {
      setError(
        reason instanceof Error
          ? reason.message
          : 'Dein Profil konnte nicht gespeichert werden.',
      );
    } finally {
      setState('ready');
      onBusyChange?.(false);
    }
  }

  return (
    <section
      className="detail-panel profile-panel"
      aria-labelledby={`${id}-title`}
      aria-busy={state === 'loading'}
    >
      <p className="eyebrow">DEIN PERSÖNLICHER START</p>
      <h2 id={`${id}-title`}>
        {compact ? 'Wie dürfen wir dich nennen?' : 'Dein Lernprofil'}
      </h2>
      <p>
        Ein Vorname oder Spitzname reicht. Dein Profil bleibt auf diesem Gerät.
      </p>
      <p id={`${id}-grade-note`} className="profile-grade-note">
        {savedGrade !== 5
          ? `In deinem Profil ist noch Klasse ${savedGrade} gespeichert. Mit „Profil speichern“ wechselst du zu Klasse 5. Dein Lernfortschritt bleibt erhalten.`
          : 'Hier übst du für Klasse 5.'}
      </p>
      {state === 'loading' && <p role="status">Dein Profil wird geladen …</p>}
      {error && (
        <p className="error-message" role="alert">
          {error}
        </p>
      )}
      {state === 'unavailable' && (
        <button
          className="secondary-button"
          onClick={() => {
            setState('loading');
            setReload((value) => value + 1);
          }}
        >
          Profil erneut laden
        </button>
      )}
      <form onSubmit={save}>
        <fieldset disabled={state !== 'ready'}>
          <div className="profile-fields">
            <label htmlFor={`${id}-name`}>
              Name oder Spitzname
              <input
                id={`${id}-name`}
                value={name}
                maxLength={60}
                required
                autoComplete="off"
                onChange={(event) => {
                  setName(event.target.value);
                  setNotice('');
                }}
              />
            </label>
            {!compact && (
              <label htmlFor={`${id}-grade`}>
                Jahrgangsstufe
                <select
                  id={`${id}-grade`}
                  defaultValue="5"
                  aria-describedby={`${id}-grade-note`}
                >
                  <option value="5">Klasse 5</option>
                </select>
              </label>
            )}
            <button className="primary-button" type="submit">
              {state === 'saving'
                ? 'Wird gespeichert …'
                : compact
                  ? 'Speichern'
                  : 'Profil speichern'}
            </button>
          </div>
        </fieldset>
      </form>
      {notice && <p role="status">{notice}</p>}
    </section>
  );
}
