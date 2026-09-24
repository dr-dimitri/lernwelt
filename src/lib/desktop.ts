import { invoke, isTauri } from '@tauri-apps/api/core';
import type { LearnerProfile, LearningProgress } from '../domain/learner';
import type { SubjectId } from '../domain/subjects';

async function callDesktop<T>(
  command: string,
  args?: Record<string, unknown>,
): Promise<T> {
  if (!isTauri()) {
    throw new Error(
      'Bitte öffne die Lernwelt-Desktop-App, um dein Lernprofil zu verwenden.',
    );
  }
  try {
    return await invoke<T>(command, args);
  } catch (error) {
    throw new Error(
      typeof error === 'string'
        ? error
        : 'Die lokalen Lerndaten sind nicht verfügbar.',
    );
  }
}

export const desktop = {
  getProfile: () => callDesktop<LearnerProfile | null>('get_profile'),
  saveProfile: (profile: LearnerProfile) =>
    callDesktop<LearnerProfile>('save_profile', { profile }),
  listProgress: () => callDesktop<LearningProgress[]>('list_progress'),
  recordAttempt: (subject: SubjectId, competencyId: string, correct: boolean) =>
    callDesktop<void>('record_attempt', { subject, competencyId, correct }),
};
