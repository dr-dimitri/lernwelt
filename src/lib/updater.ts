import { isTauri } from '@tauri-apps/api/core';
import { getVersion } from '@tauri-apps/api/app';
import { check, type DownloadEvent } from '@tauri-apps/plugin-updater';
import { relaunch } from '@tauri-apps/plugin-process';

export interface AvailableUpdate {
  version: string;
  body?: string;
  downloadAndInstall: (
    onEvent: (event: DownloadEvent) => void,
  ) => Promise<void>;
  close: () => Promise<void>;
}

const preferenceKey = 'lernwelt.check-updates-on-start';

export const updater = {
  available: () => isTauri(),
  version: getVersion,
  check: async (): Promise<AvailableUpdate | null> => {
    const update = await check({ timeout: 15_000 });
    return update
      ? {
          version: update.version,
          body: update.body,
          downloadAndInstall: (onEvent) =>
            update.downloadAndInstall(onEvent, { timeout: 180_000 }),
          close: () => update.close(),
        }
      : null;
  },
  restart: relaunch,
  preference: () => localStorage.getItem(preferenceKey) !== 'false',
  savePreference: (enabled: boolean) =>
    localStorage.setItem(preferenceKey, String(enabled)),
};
