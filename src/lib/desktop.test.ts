import { invoke, isTauri } from '@tauri-apps/api/core';
import { beforeEach, describe, expect, it, vi } from 'vitest';
import { desktop } from './desktop';

vi.mock('@tauri-apps/api/core', () => ({ invoke: vi.fn(), isTauri: vi.fn() }));

beforeEach(() => {
  vi.resetAllMocks();
  vi.mocked(isTauri).mockReturnValue(true);
});

describe('Desktop-Schnittstelle', () => {
  it('täuscht in der Browser-Vorschau keine Speicherung vor', async () => {
    vi.mocked(isTauri).mockReturnValue(false);
    await expect(
      desktop.saveProfile({ displayName: 'Alex', grade: 7 }),
    ).rejects.toThrow('Desktop-App');
    expect(invoke).not.toHaveBeenCalled();
  });

  it('übersetzt Rust-Fehler in darstellbare Fehler', async () => {
    vi.mocked(invoke).mockRejectedValue(
      'Bitte wähle eine Jahrgangsstufe zwischen 5 und 13.',
    );
    await expect(
      desktop.saveProfile({ displayName: 'Alex', grade: 2 }),
    ).rejects.toThrow('Jahrgangsstufe');
  });

  it('verwendet die vereinbarten Command-Argumente für Fortschritt', async () => {
    vi.mocked(invoke).mockResolvedValue(undefined);
    await desktop.recordAttempt('english', 'by.english.7.example', true);
    expect(invoke).toHaveBeenCalledWith('record_attempt', {
      subject: 'english',
      competencyId: 'by.english.7.example',
      correct: true,
    });
  });
});
