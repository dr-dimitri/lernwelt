import { act, render, screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { beforeEach, expect, it, vi } from 'vitest';
import ProfilePanel from './ProfilePanel';
import { desktop } from '../lib/desktop';
import type { LearnerProfile } from '../domain/learner';
vi.mock('../lib/desktop', () => ({
  desktop: { getProfile: vi.fn(), saveProfile: vi.fn() },
}));
beforeEach(() => vi.resetAllMocks());

it('lädt nach einem vorübergehenden Fehler das vorhandene Profil ohne Neustart erneut', async () => {
  const user = userEvent.setup();
  vi.mocked(desktop.getProfile)
    .mockRejectedValueOnce(new Error('Datenbank gesperrt'))
    .mockResolvedValueOnce({ displayName: 'Mia', grade: 6 });
  render(<ProfilePanel />);
  expect(await screen.findByRole('alert')).toHaveTextContent(
    'Datenbank gesperrt',
  );
  expect(screen.getByLabelText('Name oder Spitzname')).toBeDisabled();
  expect(
    screen.getByRole('button', { name: 'Profil speichern' }),
  ).toBeDisabled();
  await user.click(screen.getByRole('button', { name: 'Profil erneut laden' }));
  expect(await screen.findByDisplayValue('Mia')).toBeEnabled();
  expect(screen.getByLabelText('Jahrgangsstufe')).toHaveValue('5');
  expect(screen.getByLabelText('Jahrgangsstufe')).toHaveAccessibleDescription(
    'In deinem Profil ist noch Klasse 6 gespeichert. Mit „Profil speichern“ wechselst du zu Klasse 5. Dein Lernfortschritt bleibt erhalten.',
  );
  expect(screen.queryByRole('alert')).not.toBeInTheDocument();
  expect(desktop.getProfile).toHaveBeenCalledTimes(2);
  expect(desktop.saveProfile).not.toHaveBeenCalled();
});

it('bietet nur Klasse 5 an und ändert eine ältere Profilklasse erst beim Speichern', async () => {
  const user = userEvent.setup();
  const onSaved = vi.fn();
  vi.mocked(desktop.getProfile).mockResolvedValue({
    displayName: 'Mia',
    grade: 8,
  });
  vi.mocked(desktop.saveProfile).mockResolvedValue({
    displayName: 'Mia',
    grade: 5,
  });
  render(<ProfilePanel onSaved={onSaved} />);
  await screen.findByDisplayValue('Mia');
  expect(screen.getAllByRole('option')).toHaveLength(1);
  expect(screen.getByRole('option', { name: 'Klasse 5' })).toBeInTheDocument();
  expect(screen.getByText(/noch Klasse 8 gespeichert/)).toBeVisible();
  expect(desktop.saveProfile).not.toHaveBeenCalled();
  expect(onSaved).not.toHaveBeenCalled();

  await user.click(screen.getByRole('button', { name: 'Profil speichern' }));

  expect(desktop.saveProfile).toHaveBeenCalledExactlyOnceWith({
    displayName: 'Mia',
    grade: 5,
  });
  expect(await screen.findByRole('status')).toHaveTextContent('gespeichert');
  expect(
    screen.queryByText(/noch Klasse 8 gespeichert/),
  ).not.toBeInTheDocument();
  expect(onSaved).toHaveBeenCalledExactlyOnceWith();
});

it('sperrt das Formular während des erneuten Ladens und bietet nach erneutem Fehler wieder Wiederholen an', async () => {
  const user = userEvent.setup();
  let reject!: (reason: Error) => void;
  vi.mocked(desktop.getProfile)
    .mockRejectedValueOnce(new Error('Erster Fehler'))
    .mockImplementationOnce(
      () =>
        new Promise((_resolve, r) => {
          reject = r;
        }),
    )
    .mockResolvedValueOnce(null);
  render(<ProfilePanel />);
  await screen.findByRole('alert');
  await user.click(screen.getByRole('button', { name: 'Profil erneut laden' }));
  expect(screen.getByRole('status')).toHaveTextContent('wird geladen');
  expect(
    screen.getByRole('button', { name: 'Profil speichern' }),
  ).toBeDisabled();
  expect(
    screen.queryByRole('button', { name: 'Profil erneut laden' }),
  ).not.toBeInTheDocument();
  await act(async () => reject(new Error('Noch gesperrt')));
  expect(await screen.findByRole('alert')).toHaveTextContent('Noch gesperrt');
  await user.click(screen.getByRole('button', { name: 'Profil erneut laden' }));
  expect(screen.getByLabelText('Name oder Spitzname')).toBeEnabled();
  expect(screen.getByLabelText('Name oder Spitzname')).toHaveValue('');
  expect(screen.getByLabelText('Jahrgangsstufe')).toHaveValue('5');
  expect(desktop.getProfile).toHaveBeenCalledTimes(3);
  expect(desktop.saveProfile).not.toHaveBeenCalled();
});

it('verwirft einen verspäteten Retry nach Unmount und bewahrt Eingaben bei reinem Speicherfehler', async () => {
  const user = userEvent.setup();
  let resolve!: (profile: LearnerProfile) => void;
  vi.mocked(desktop.getProfile)
    .mockRejectedValueOnce(new Error('Lesefehler'))
    .mockImplementationOnce(
      () =>
        new Promise((r) => {
          resolve = r;
        }),
    );
  const first = render(<ProfilePanel />);
  await screen.findByRole('alert');
  await user.click(screen.getByRole('button', { name: 'Profil erneut laden' }));
  first.unmount();
  await act(async () => resolve({ displayName: 'Alt', grade: 8 }));
  vi.mocked(desktop.getProfile).mockResolvedValueOnce({
    displayName: 'Mia',
    grade: 6,
  });
  vi.mocked(desktop.saveProfile).mockRejectedValueOnce(
    new Error('Schreibfehler'),
  );
  render(<ProfilePanel />);
  await screen.findByDisplayValue('Mia');
  await user.type(screen.getByLabelText('Name oder Spitzname'), 'chen');
  await user.click(screen.getByRole('button', { name: 'Profil speichern' }));
  expect(await screen.findByRole('alert')).toHaveTextContent('Schreibfehler');
  expect(screen.getByLabelText('Name oder Spitzname')).toHaveValue('Miachen');
  expect(screen.getByText(/noch Klasse 6 gespeichert/)).toBeVisible();
  expect(desktop.saveProfile).toHaveBeenCalledExactlyOnceWith({
    displayName: 'Miachen',
    grade: 5,
  });
  expect(
    screen.queryByRole('button', { name: 'Profil erneut laden' }),
  ).not.toBeInTheDocument();
  expect(
    screen.getByRole('button', { name: 'Profil speichern' }),
  ).toBeEnabled();
});
