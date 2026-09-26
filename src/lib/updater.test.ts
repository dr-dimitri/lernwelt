import { beforeEach, expect, it, vi } from 'vitest';
import { updater } from './updater';
import { check } from '@tauri-apps/plugin-updater';
vi.mock('@tauri-apps/plugin-updater', () => ({ check: vi.fn() }));
beforeEach(() => {
  localStorage.clear();
  vi.resetAllMocks();
});

it('persists the automatic-check preference across reads', () => {
  expect(updater.preference()).toBe(true);
  updater.savePreference(false);
  expect(updater.preference()).toBe(false);
  updater.savePreference(true);
  expect(updater.preference()).toBe(true);
});

it('uses the configured endpoint with a bounded timeout and no learning payload', async () => {
  vi.mocked(check).mockResolvedValue(null);
  await expect(updater.check()).resolves.toBeNull();
  expect(check).toHaveBeenCalledExactlyOnceWith({ timeout: 15_000 });
});
