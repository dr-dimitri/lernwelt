import { invoke, isTauri } from '@tauri-apps/api/core';
import { getVersion } from '@tauri-apps/api/app';
import { Update, type DownloadEvent } from '@tauri-apps/plugin-updater';
import { relaunch } from '@tauri-apps/plugin-process';

export interface AvailableUpdate {
  version: string;
  prerelease: boolean;
  body?: string;
  downloadAndInstall: (
    onEvent: (event: DownloadEvent) => void,
  ) => Promise<void>;
  close: () => Promise<void>;
}

const preferenceKey = 'lernwelt.check-updates-on-start';
const prereleaseKey = 'lernwelt.include-prereleases';
type NativeUpdate = ConstructorParameters<typeof Update>[0] & {
  prerelease: boolean;
};

export const updater = {
  available: () => isTauri(),
  version: getVersion,
  check: async (
    includePrereleases = false,
  ): Promise<AvailableUpdate | null> => {
    const metadata = await invoke<NativeUpdate | null>('check_app_update', {
      includePrereleases,
    });
    if (!metadata) return null;
    const update = new Update(metadata);
    return {
      version: update.version,
      prerelease: metadata.prerelease,
      body: update.body,
      downloadAndInstall: (onEvent) =>
        update.downloadAndInstall(onEvent, { timeout: 180_000 }),
      close: () => update.close(),
    };
  },
  restart: relaunch,
  preference: () => localStorage.getItem(preferenceKey) !== 'false',
  savePreference: (enabled: boolean) =>
    localStorage.setItem(preferenceKey, String(enabled)),
  prereleasePreference: () => localStorage.getItem(prereleaseKey) === 'true',
  savePrereleasePreference: (enabled: boolean) =>
    localStorage.setItem(prereleaseKey, String(enabled)),
};
