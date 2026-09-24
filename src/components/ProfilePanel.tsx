import { useEffect, useState, type SubmitEvent } from 'react';
import { desktop } from '../lib/desktop';

export default function ProfilePanel() {
  const [name, setName] = useState('');
  const [grade, setGrade] = useState(5);
  const [state, setState] = useState<
    'loading' | 'ready' | 'saving' | 'unavailable'
  >('loading');
  const [error, setError] = useState('');
  const [notice, setNotice] = useState('');

  useEffect(() => {
    let active = true;
    desktop
      .getProfile()
      .then((profile) => {
        if (!active) return;
        if (profile) {
          setName(profile.displayName);
          setGrade(profile.grade);
        }
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
  }, []);

  async function save(event: SubmitEvent<HTMLFormElement>) {
    event.preventDefault();
    if (state !== 'ready') return;
    setState('saving');
    setError('');
    setNotice('');
    try {
      const profile = await desktop.saveProfile({ displayName: name, grade });
      setName(profile.displayName);
      setNotice('Dein Lernprofil wurde auf diesem Gerät gespeichert.');
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
      {state === 'loading' && <p role="status">Dein Profil wird geladen …</p>}
      {error && (
        <p className="error-message" role="alert">
          {error}
        </p>
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
                value={grade}
                onChange={(event) => {
                  setGrade(Number(event.target.value));
                  setNotice('');
                }}
              >
                {Array.from({ length: 9 }, (_, index) => index + 5).map(
                  (value) => (
                    <option key={value} value={value}>
                      Klasse {value}
                    </option>
                  ),
                )}
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
