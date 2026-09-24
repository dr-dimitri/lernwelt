import { act, render, screen, waitFor } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { beforeEach, describe, expect, it, vi } from 'vitest';
import App from './App';
import { desktop } from './lib/desktop';
import type { LearnerProfile } from './domain/learner';

vi.mock('./lib/desktop', () => ({
  desktop: { getProfile: vi.fn(), saveProfile: vi.fn() },
}));

beforeEach(() => {
  vi.resetAllMocks();
  vi.mocked(desktop.getProfile).mockResolvedValue(null);
});

describe('Lernwelt', () => {
  it('wechselt das Fach und zeigt den tatsächlichen Ausbaustand', async () => {
    const user = userEvent.setup();
    render(<App />);
    await user.click(screen.getByRole('button', { name: /Englisch/ }));
    expect(screen.getByRole('heading', { name: 'Englisch' })).toBeVisible();
    expect(screen.getByRole('button', { name: /Englisch/ })).toHaveAttribute(
      'aria-pressed',
      'true',
    );
    expect(
      screen.getByText(/Übungen und Lehrplaninhalte werden/),
    ).toBeVisible();
  });

  it('lädt das gespeicherte Profil', async () => {
    vi.mocked(desktop.getProfile).mockResolvedValue({
      displayName: 'Alex',
      grade: 8,
    });
    render(<App />);
    expect(await screen.findByDisplayValue('Alex')).toBeVisible();
    expect(screen.getByLabelText('Jahrgangsstufe')).toHaveValue('8');
  });

  it('speichert Name und Jahrgangsstufe und bestätigt erst den Erfolg', async () => {
    const user = userEvent.setup();
    vi.mocked(desktop.saveProfile).mockResolvedValue({
      displayName: 'Alex',
      grade: 7,
    });
    render(<App />);
    await waitFor(() =>
      expect(screen.getByLabelText('Name oder Spitzname')).toBeEnabled(),
    );
    await user.type(screen.getByLabelText('Name oder Spitzname'), 'Alex');
    await user.selectOptions(screen.getByLabelText('Jahrgangsstufe'), '7');
    await user.click(screen.getByRole('button', { name: 'Profil speichern' }));
    expect(desktop.saveProfile).toHaveBeenCalledWith({
      displayName: 'Alex',
      grade: 7,
    });
    expect(await screen.findByRole('status')).toHaveTextContent('gespeichert');
    await user.type(screen.getByLabelText('Name oder Spitzname'), 'a');
    expect(
      screen.queryByText(/wurde auf diesem Gerät gespeichert/),
    ).not.toBeInTheDocument();
  });

  it('verhindert Änderungen und doppeltes Speichern während einer Speicherung', async () => {
    const user = userEvent.setup();
    let resolveSave!: (profile: LearnerProfile) => void;
    vi.mocked(desktop.saveProfile).mockImplementation(
      () =>
        new Promise((resolve) => {
          resolveSave = resolve;
        }),
    );
    render(<App />);
    await waitFor(() =>
      expect(screen.getByLabelText('Name oder Spitzname')).toBeEnabled(),
    );
    await user.type(screen.getByLabelText('Name oder Spitzname'), 'Alex');
    await user.click(screen.getByRole('button', { name: 'Profil speichern' }));
    expect(screen.getByLabelText('Name oder Spitzname')).toBeDisabled();
    expect(
      screen.getByRole('button', { name: 'Wird gespeichert …' }),
    ).toBeDisabled();
    expect(
      screen.queryByText(/wurde auf diesem Gerät gespeichert/),
    ).not.toBeInTheDocument();
    await act(async () => {
      resolveSave({ displayName: 'Alex', grade: 5 });
    });
    expect(desktop.saveProfile).toHaveBeenCalledTimes(1);
    expect(
      screen.getByRole('button', { name: 'Profil speichern' }),
    ).toBeEnabled();
  });

  it('zeigt Ladefehler und verhindert Überschreiben eines nicht geladenen Profils', async () => {
    vi.mocked(desktop.getProfile).mockRejectedValue(
      new Error('Datenbank nicht verfügbar'),
    );
    render(<App />);
    expect(await screen.findByRole('alert')).toHaveTextContent(
      'Datenbank nicht verfügbar',
    );
    expect(
      screen.getByRole('button', { name: 'Profil speichern' }),
    ).toBeDisabled();
    expect(desktop.saveProfile).not.toHaveBeenCalled();
  });

  it('behält Eingaben bei einem Speicherfehler für einen erneuten Versuch', async () => {
    const user = userEvent.setup();
    vi.mocked(desktop.saveProfile).mockRejectedValueOnce(
      new Error('Speichern fehlgeschlagen'),
    );
    render(<App />);
    await waitFor(() =>
      expect(screen.getByLabelText('Name oder Spitzname')).toBeEnabled(),
    );
    await user.type(screen.getByLabelText('Name oder Spitzname'), 'Alex');
    await user.click(screen.getByRole('button', { name: 'Profil speichern' }));
    expect(await screen.findByRole('alert')).toHaveTextContent(
      'Speichern fehlgeschlagen',
    );
    expect(screen.getByLabelText('Name oder Spitzname')).toHaveValue('Alex');
    expect(
      screen.getByRole('button', { name: 'Profil speichern' }),
    ).toBeEnabled();
    expect(
      screen.queryByText(/wurde auf diesem Gerät gespeichert/),
    ).not.toBeInTheDocument();
    vi.mocked(desktop.saveProfile).mockResolvedValueOnce({
      displayName: 'Alex',
      grade: 5,
    });
    await user.click(screen.getByRole('button', { name: 'Profil speichern' }));
    expect(await screen.findByRole('status')).toHaveTextContent('gespeichert');
    expect(screen.queryByRole('alert')).not.toBeInTheDocument();
  });
});
