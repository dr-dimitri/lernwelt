import { useEffect, useRef, useState } from 'react';
import type { LearningState } from '../domain/learning';
import { desktop } from '../lib/desktop';

export default function CollectionPanel({
  onChanged,
  onBeforeRedeem,
  onBusyChange,
}: {
  onChanged: () => void;
  onBeforeRedeem?: (redeem: () => void) => void;
  onBusyChange?: (busy: boolean) => void;
}) {
  const [state, setState] = useState<LearningState>();
  const [error, setError] = useState('');
  const [notice, setNotice] = useState('');
  const [busy, setBusy] = useState(false);
  const [reload, setReload] = useState(0);
  const inFlight = useRef(false);
  useEffect(() => {
    let active = true;
    desktop
      .getLearningState()
      .then((value) => {
        if (active) {
          setState(value);
          setError('');
        }
      })
      .catch((reason) => {
        if (active)
          setError(
            reason instanceof Error
              ? reason.message
              : 'Deine Sammlung konnte nicht geladen werden.',
          );
      });
    return () => {
      active = false;
    };
  }, [reload]);
  async function redeem(id: string, name: string) {
    if (inFlight.current || !state?.profileReady) return;
    inFlight.current = true;
    setBusy(true);
    onBusyChange?.(true);
    setError('');
    try {
      const wallet = await desktop.redeemReward(id);
      setState((current) => current && { ...current, wallet });
      setNotice(`${name} gehört jetzt zu deiner Sammlung.`);
      onChanged();
    } catch (reason) {
      setError(
        reason instanceof Error
          ? reason.message
          : 'Das Einlösen hat nicht geklappt. Versuche es erneut.',
      );
    } finally {
      inFlight.current = false;
      setBusy(false);
      onBusyChange?.(false);
    }
  }
  return (
    <section aria-label="Deine Sammlung">
      {!state && !error && <p role="status">Deine Sammlung wird geladen …</p>}
      {error && (
        <div role="alert">
          <p>{error}</p>
          <button
            className="secondary-button"
            disabled={busy}
            onClick={() => setReload((value) => value + 1)}
          >
            Erneut laden
          </button>
        </div>
      )}
      {notice && <p role="status">{notice}</p>}
      {state && (
        <>
          <p>
            {state.wallet.balance} Punkte verfügbar · {state.wallet.totalEarned}{' '}
            insgesamt verdient
          </p>
          <div className="reward-grid">
            {state.wallet.rewards.map((reward) => (
              <article
                className={`reward-card ${reward.owned ? 'owned' : ''}`}
                key={reward.id}
              >
                <h3>{reward.name}</h3>
                <p>{reward.description}</p>
                <button
                  className="secondary-button"
                  disabled={
                    busy ||
                    !state.profileReady ||
                    reward.owned ||
                    state.wallet.balance < reward.cost
                  }
                  onClick={() =>
                    onBeforeRedeem
                      ? onBeforeRedeem(
                          () => void redeem(reward.id, reward.name),
                        )
                      : void redeem(reward.id, reward.name)
                  }
                >
                  {reward.owned
                    ? 'In deiner Sammlung ✓'
                    : `${reward.cost} Punkte · Einlösen`}
                </button>
                {!reward.owned && state.wallet.balance < reward.cost && (
                  <p>Noch {reward.cost - state.wallet.balance} Punkte</p>
                )}
              </article>
            ))}
          </div>
        </>
      )}
    </section>
  );
}
