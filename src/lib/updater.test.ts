import { beforeEach, expect, it, vi } from 'vitest';
import { updater } from './updater';
import { invoke } from '@tauri-apps/api/core';
import { Update } from '@tauri-apps/plugin-updater';
vi.mock('@tauri-apps/api/core', () => ({ invoke: vi.fn(), isTauri: vi.fn() }));
vi.mock('@tauri-apps/plugin-updater', () => ({ Update: vi.fn() }));
beforeEach(() => {
  localStorage.clear();
  vi.resetAllMocks();
});

it('persists automatic and prerelease preferences independently, with previews off by default', () => {
  expect(updater.preference()).toBe(true);
  expect(updater.prereleasePreference()).toBe(false);
  updater.savePrereleasePreference(true);
  updater.savePreference(false);
  expect(updater.preference()).toBe(false);
  expect(updater.prereleasePreference()).toBe(true);
  updater.savePrereleasePreference(false);
  updater.savePreference(true);
  expect(updater.preference()).toBe(true);
  expect(updater.prereleasePreference()).toBe(false);
});

it('requires an explicit true preference, rejecting unexpected persisted values', () => {
  for (const value of ['false', '1', 'yes', 'TRUE']) {
    localStorage.setItem('lernwelt.include-prereleases', value);
    expect(updater.prereleasePreference()).toBe(false);
  }
});

it('uses the closed native command with only the channel flag, stable by default', async () => {
  vi.mocked(invoke).mockResolvedValue(null);
  await expect(updater.check()).resolves.toBeNull();
  expect(invoke).toHaveBeenCalledExactlyOnceWith('check_app_update', {
    includePrereleases: false,
  });
  expect(Update).not.toHaveBeenCalled();
});

it('retains the GitHub flag and uses the official signed installer with a bounded download', async () => {
  const metadata = {
    rid: 7,
    currentVersion: '0.1.0',
    version: '0.2.0',
    body: 'Neue Lernrunden',
    rawJson: {},
    prerelease: true,
  };
  const downloadAndInstall = vi.fn().mockResolvedValue(undefined);
  const close = vi.fn().mockResolvedValue(undefined);
  vi.mocked(invoke).mockResolvedValue(metadata);
  vi.mocked(Update).mockImplementation(function () {
    return { ...metadata, downloadAndInstall, close } as unknown as Update;
  });
  const update = await updater.check(true);
  expect(invoke).toHaveBeenCalledExactlyOnceWith('check_app_update', {
    includePrereleases: true,
  });
  expect(Update).toHaveBeenCalledExactlyOnceWith(metadata);
  expect(update?.prerelease).toBe(true);
  expect(update?.version).toBe('0.2.0');
  const callback = vi.fn();
  await update?.downloadAndInstall(callback);
  expect(downloadAndInstall).toHaveBeenCalledExactlyOnceWith(callback, {
    timeout: 180_000,
  });
  await update?.close();
  expect(close).toHaveBeenCalledTimes(1);
});

it('propagates failed checks without creating an installable update', async () => {
  vi.mocked(invoke).mockRejectedValue(new Error('offline'));
  await expect(updater.check(true)).rejects.toThrow('offline');
  expect(Update).not.toHaveBeenCalled();
});
