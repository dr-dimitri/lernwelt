import type { Wallet } from '../domain/learning';
import { validAchievementProgress } from '../domain/achievements';

type WalletListener = (wallet: Wallet) => void;
const listeners = new Set<WalletListener>();
let revision = 0;
let requestedSequence = 0;
let confirmedSequence = 0;
let confirmedProgress: {
  totalEarned: number;
  completedTasks: number;
  unlockedCount: number;
} | null = null;

export function validWallet(wallet: Wallet): boolean {
  return (
    !!wallet &&
    Number.isSafeInteger(wallet.balance) &&
    wallet.balance >= 0 &&
    Number.isSafeInteger(wallet.totalEarned) &&
    wallet.totalEarned >= 0 &&
    Array.isArray(wallet.rewards) &&
    validAchievementProgress(wallet.achievements)
  );
}

function confirmWallet(wallet: Wallet, sequence: number): void {
  if (!validWallet(wallet)) return;
  const progress = {
    totalEarned: wallet.totalEarned,
    completedTasks: wallet.achievements.completedTasks,
    unlockedCount: wallet.achievements.unlockedIds.length,
  };
  if (
    confirmedProgress &&
    (progress.totalEarned < confirmedProgress.totalEarned ||
      progress.completedTasks < confirmedProgress.completedTasks ||
      progress.unlockedCount < confirmedProgress.unlockedCount)
  )
    return;
  const advances =
    confirmedProgress &&
    (progress.totalEarned > confirmedProgress.totalEarned ||
      progress.completedTasks > confirmedProgress.completedTasks);
  if (sequence < confirmedSequence && !advances) return;
  confirmedSequence = Math.max(confirmedSequence, sequence);
  confirmedProgress = progress;
  revision++;
  for (const listener of listeners) listener(wallet);
}

/** Observes confirmed desktop responses; never awards or calculates a rank. */
export function publishWallet(wallet: Wallet): void {
  confirmWallet(wallet, ++requestedSequence);
}

export function subscribeWallet(listener: WalletListener): () => void {
  if (listeners.size === 0) confirmedProgress = null;
  listeners.add(listener);
  return () => {
    listeners.delete(listener);
    if (listeners.size === 0) confirmedProgress = null;
  };
}

export function walletRevision(): number {
  return revision;
}

export async function withWallet<T extends { wallet: Wallet }>(
  response: Promise<T>,
): Promise<T> {
  const sequence = ++requestedSequence;
  const result = await response;
  if (result?.wallet) confirmWallet(result.wallet, sequence);
  return result;
}

export async function withStateWallet<T extends { state: { wallet: Wallet } }>(
  response: Promise<T>,
): Promise<T> {
  const sequence = ++requestedSequence;
  const result = await response;
  if (result?.state?.wallet) confirmWallet(result.state.wallet, sequence);
  return result;
}

export async function withDirectWallet(
  response: Promise<Wallet>,
): Promise<Wallet> {
  const sequence = ++requestedSequence;
  const wallet = await response;
  if (wallet) confirmWallet(wallet, sequence);
  return wallet;
}
