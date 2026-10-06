import { expect, it, vi } from 'vitest';
import { initial } from '../test/learning-fixture';
import type { Wallet } from '../domain/learning';
import {
  publishWallet,
  subscribeWallet,
  walletRevision,
  withWallet,
  withStateWallet,
  withDirectWallet,
} from './wallet-updates';

it('übermittelt erst den tatsächlich bestätigten Wallet und verändert weder Rang noch Punkte', async () => {
  const listener = vi.fn();
  const unsubscribe = subscribeWallet(listener);
  let finish!: (value: { wallet: Wallet }) => void;
  const response = withWallet(
    new Promise<{ wallet: Wallet }>((resolve) => {
      finish = resolve;
    }),
  );
  expect(listener).not.toHaveBeenCalled();
  const wallet = {
    ...initial.wallet,
    totalEarned: 1000,
    achievements: { ...initial.wallet.achievements, completedTasks: 400 },
  };
  finish({ wallet });
  await expect(response).resolves.toEqual({ wallet });
  expect(listener).toHaveBeenCalledExactlyOnceWith(wallet);
  expect(wallet.achievements.currentId).toBe('startklar');
  unsubscribe();
});

it('publiziert verschachtelte Trainerstände und direkte Einlösungen ohne zusätzliche Abfrage', async () => {
  const listener = vi.fn();
  const unsubscribe = subscribeWallet(listener);
  await withStateWallet(Promise.resolve({ state: { wallet: initial.wallet } }));
  await withDirectWallet(Promise.resolve(initial.wallet));
  expect(listener).toHaveBeenCalledTimes(2);
  expect(listener).toHaveBeenLastCalledWith(initial.wallet);
  unsubscribe();
});

it('gibt bei Fehlern und unvollständigen Antwortdaten kein Abzeichen frei', async () => {
  const listener = vi.fn();
  const unsubscribe = subscribeWallet(listener);
  const revision = walletRevision();
  await expect(
    withWallet(Promise.reject(new Error('Speicherfehler'))),
  ).rejects.toThrow('Speicherfehler');
  publishWallet({
    ...initial.wallet,
    achievements: undefined,
  } as unknown as Wallet);
  publishWallet({
    ...initial.wallet,
    achievements: { ...initial.wallet.achievements, currentId: 'unbekannt' },
  });
  // A known lower rank with no next rank must not claim all ranks were earned.
  publishWallet({
    ...initial.wallet,
    achievements: { ...initial.wallet.achievements, nextId: null },
  });
  publishWallet({
    ...initial.wallet,
    achievements: {
      ...initial.wallet.achievements,
      currentId: 'lernfuchs',
      unlockedIds: ['lernfuchs'],
      nextId: 'wissenspilot',
    },
  });
  expect(listener).not.toHaveBeenCalled();
  expect(walletRevision()).toBe(revision);
  unsubscribe();
});

it('ignoriert eine ältere Ladeantwort nach einem neueren bestätigten Fortschritt', async () => {
  const listener = vi.fn();
  const unsubscribe = subscribeWallet(listener);
  let finishOld!: (value: { wallet: Wallet }) => void;
  const oldRead = withWallet(
    new Promise<{ wallet: Wallet }>((resolve) => {
      finishOld = resolve;
    }),
  );
  const promoted: Wallet = {
    ...initial.wallet,
    achievements: {
      completedTasks: 5,
      currentId: 'funkenfinder',
      unlockedIds: ['startklar', 'funkenfinder'],
      nextId: 'lernfuchs',
    },
  };
  await withWallet(Promise.resolve({ wallet: promoted }));
  finishOld({ wallet: initial.wallet });
  await oldRead;
  expect(listener).toHaveBeenCalledExactlyOnceWith(promoted);
  unsubscribe();
});

it('lässt eine laufende Mutation trotz später angefragter alter Ladeantwort den bestätigten Rang aktualisieren', async () => {
  const listener = vi.fn();
  const unsubscribe = subscribeWallet(listener);
  let finishMutation!: (value: { wallet: Wallet }) => void;
  const mutation = withWallet(
    new Promise<{ wallet: Wallet }>((resolve) => {
      finishMutation = resolve;
    }),
  );
  let finishRead!: (value: { wallet: Wallet }) => void;
  const read = withWallet(
    new Promise<{ wallet: Wallet }>((resolve) => {
      finishRead = resolve;
    }),
  );
  const promoted: Wallet = {
    ...initial.wallet,
    balance: 10,
    totalEarned: 10,
    achievements: {
      completedTasks: 5,
      currentId: 'funkenfinder',
      unlockedIds: ['startklar', 'funkenfinder'],
      nextId: 'lernfuchs',
    },
  };
  finishRead({ wallet: initial.wallet });
  await read;
  finishMutation({ wallet: promoted });
  await mutation;
  expect(listener.mock.calls.map(([wallet]) => wallet)).toEqual([
    initial.wallet,
    promoted,
  ]);
  // Even a newer request cannot demote confirmed lifetime progress.
  await withWallet(Promise.resolve({ wallet: initial.wallet }));
  expect(listener).toHaveBeenCalledTimes(2);
  unsubscribe();
});

it('erhält bei gleichem Gesamtfortschritt die neuere Guthabenbestätigung', async () => {
  const listener = vi.fn();
  const unsubscribe = subscribeWallet(listener);
  let finishOld!: (value: { wallet: Wallet }) => void;
  const oldRead = withWallet(
    new Promise<{ wallet: Wallet }>((resolve) => {
      finishOld = resolve;
    }),
  );
  const redeemed = { ...initial.wallet, balance: 0 };
  await withDirectWallet(Promise.resolve(redeemed));
  finishOld({ wallet: { ...initial.wallet, balance: 20 } });
  await oldRead;
  expect(listener).toHaveBeenCalledExactlyOnceWith(redeemed);
  unsubscribe();
});

it('entfernt den Listener beim Unmount, ohne andere Abonnenten zu entfernen', () => {
  const first = vi.fn();
  const second = vi.fn();
  const unsubscribeFirst = subscribeWallet(first);
  const unsubscribeSecond = subscribeWallet(second);
  unsubscribeFirst();
  publishWallet(initial.wallet);
  expect(first).not.toHaveBeenCalled();
  expect(second).toHaveBeenCalledExactlyOnceWith(initial.wallet);
  unsubscribeSecond();
});
