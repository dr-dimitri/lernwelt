import { useEffect, useState, type SubmitEvent } from 'react';
import { desktop } from '../lib/desktop';

export default function ProfilePanel({ onSaved }: { onSaved?: () => void }) {
  const [name, setName] = useState('');
  const [savedGrade, setSavedGrade] = useState(5);
  const [state, setState] = useState<
    'loading' | 'ready' | 'saving' | 'unavailable'
  >('loading');
  const [error, setError] = useState('');
  const [notice, setNotice] = useState('');
  const [reload, setReload] = useState(0);

  useEffect(() => {
    let active = true;
    setState('loading');
    setError('');
    desktop
      .getProfile()
      .then((profile) => {
        if (!active) return;
        setName(profile?.displayName ?? '');
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
    if (state !== 'ready') return;
    setState('saving');
    setError('');
    setNotice('');
    try {
      const profile = await desktop.saveProfile({
        displayName: name,
        grade: 5,
      });
      setName(profile.displayName);
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
    }
  }

  return (
    <section
      className="detail-panel profile-panel"
      aria-labelledby="profile-title"
      aria-busy={state === 'loading'}
    >
      <p className="eyebrow">DEIN PERSÖNLICHER START</p>
      <h2 id="profile-title">Dein Lernprofil</h2>
      <p>
        Ein Vorname oder Spitzname reicht. Dein Profil bleibt auf diesem Gerät.
      </p>
      <p id="profile-grade-note" className="profile-grade-note">
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
            <label htmlFor="profile-name">
              Name oder Spitzname
              <input
                id="profile-name"
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
            <label htmlFor="profile-grade">
              Jahrgangsstufe
              <select
                id="profile-grade"
                defaultValue="5"
                aria-describedby="profile-grade-note"
              >
                <option value="5">Klasse 5</option>
              </select>
            </label>
            <button className="primary-button" type="submit">
              {state === 'saving' ? 'Wird gespeichert …' : 'Profil speichern'}
            </button>
          </div>
        </fieldset>
      </form>
      {notice && <p role="status">{notice}</p>}
    </section>
  );
}
