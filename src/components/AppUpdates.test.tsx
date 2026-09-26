import {
  act,
  fireEvent,
  render,
  screen,
  waitFor,
} from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { beforeEach, describe, expect, it, vi } from 'vitest';
import { StrictMode } from 'react';
import AppUpdates from './AppUpdates';
import { updater, type AvailableUpdate } from '../lib/updater';

vi.mock('../lib/updater', () => ({
  updater: {
    available: vi.fn(),
    version: vi.fn(),
    check: vi.fn(),
    restart: vi.fn(),
    preference: vi.fn(),
    savePreference: vi.fn(),
  },
}));

let candidate: AvailableUpdate;
beforeEach(() => {
  vi.resetAllMocks();
  vi.mocked(updater.available).mockReturnValue(true);
  vi.mocked(updater.version).mockResolvedValue('0.1.0');
  vi.mocked(updater.preference).mockReturnValue(true);
  vi.mocked(updater.check).mockResolvedValue(null);
  vi.mocked(updater.restart).mockResolvedValue();
  candidate = {
    version: '0.2.0',
    body: 'Neue Lernrunden',
    close: vi.fn().mockResolvedValue(undefined),
    downloadAndInstall: vi.fn().mockResolvedValue(undefined),
  };
});

async function open() {
  await userEvent.click(
    screen.getByRole('button', { name: /App aktualisieren|Update verfügbar/ }),
  );
}

describe('App-Updates', () => {
  it('checks once on startup, also under StrictMode, and displays the installed version', async () => {
    render(
      <StrictMode>
        <AppUpdates />
      </StrictMode>,
    );
    await open();
    expect(
      await screen.findByText('Du hast die aktuelle Version.'),
    ).toBeVisible();
    expect(screen.getByText('0.1.0')).toBeVisible();
    expect(updater.check).toHaveBeenCalledTimes(1);
    expect(updater.restart).not.toHaveBeenCalled();
  });

  it('respects the saved opt-out and checks manually', async () => {
    vi.mocked(updater.preference).mockReturnValue(false);
    render(<AppUpdates />);
    await open();
    expect(updater.check).not.toHaveBeenCalled();
    expect(screen.getByRole('checkbox')).not.toBeChecked();
    await userEvent.click(
      screen.getByRole('button', { name: 'Nach Updates suchen' }),
    );
    expect(
      await screen.findByText('Du hast die aktuelle Version.'),
    ).toBeVisible();
    await userEvent.click(screen.getByRole('checkbox'));
    expect(updater.savePreference).toHaveBeenCalledWith(true);
  });

  it('keeps learning available after a network failure and allows retry', async () => {
    vi.mocked(updater.check)
      .mockRejectedValueOnce(new Error('offline'))
      .mockResolvedValue(null);
    render(<AppUpdates />);
    await open();
    expect(await screen.findByRole('alert')).toHaveTextContent(
      'Du kannst weiterlernen',
    );
    await userEvent.click(screen.getByRole('button', { name: 'Schließen' }));
    expect(screen.queryByRole('dialog')).not.toBeInTheDocument();
    await open();
    await userEvent.click(
      screen.getByRole('button', { name: 'Nach Updates suchen' }),
    );
    expect(
      await screen.findByText('Du hast die aktuelle Version.'),
    ).toBeVisible();
  });

  it('waits for an explicit install, blocks closing during install, then restarts on request', async () => {
    vi.mocked(updater.check).mockResolvedValue(candidate);
    let finish!: () => void;
    vi.mocked(candidate.downloadAndInstall).mockImplementation((callback) => {
      callback({ event: 'Started', data: { contentLength: 100 } });
      callback({ event: 'Progress', data: { chunkLength: 40 } });
      return new Promise<void>((resolve) => {
        finish = resolve;
      });
    });
    render(<AppUpdates />);
    await screen.findByRole('button', { name: 'Update verfügbar' });
    expect(candidate.downloadAndInstall).not.toHaveBeenCalled();
    await open();
    await userEvent.click(
      screen.getByRole('button', {
        name: 'Update herunterladen und installieren',
      }),
    );
    expect(screen.getByRole('progressbar')).toHaveAttribute('value', '40');
    expect(screen.getByRole('button', { name: 'Schließen' })).toBeDisabled();
    fireEvent(
      screen.getByRole('dialog'),
      new Event('cancel', { cancelable: true }),
    );
    expect(screen.getByRole('dialog')).toBeVisible();
    expect(candidate.downloadAndInstall).toHaveBeenCalledTimes(1);
    await act(async () => finish());
    expect(await screen.findByText(/Das Update ist installiert/)).toBeVisible();
    expect(updater.restart).not.toHaveBeenCalled();
    await userEvent.click(
      screen.getByRole('button', { name: 'Jetzt neu starten' }),
    );
    expect(updater.restart).toHaveBeenCalledTimes(1);
  });

  it('does not report a failed signature or installation as success', async () => {
    vi.mocked(updater.check).mockResolvedValue(candidate);
    vi.mocked(candidate.downloadAndInstall).mockRejectedValueOnce(
      new Error('invalid signature'),
    );
    render(<AppUpdates />);
    await open();
    await userEvent.click(
      await screen.findByRole('button', {
        name: 'Update herunterladen und installieren',
      }),
    );
    expect(await screen.findByRole('alert')).toHaveTextContent(
      'nicht sicher installiert',
    );
    expect(
      screen.queryByRole('button', { name: 'Jetzt neu starten' }),
    ).not.toBeInTheDocument();
    expect(updater.restart).not.toHaveBeenCalled();
    await userEvent.click(
      screen.getByRole('button', {
        name: 'Update herunterladen und installieren',
      }),
    );
    expect(await screen.findByText(/Das Update ist installiert/)).toBeVisible();
  });

  it('retains installed state on a restart error', async () => {
    vi.mocked(updater.check).mockResolvedValue(candidate);
    vi.mocked(updater.restart).mockRejectedValue(new Error('restart failed'));
    render(<AppUpdates />);
    await open();
    await userEvent.click(
      await screen.findByRole('button', {
        name: 'Update herunterladen und installieren',
      }),
    );
    await userEvent.click(
      await screen.findByRole('button', { name: 'Jetzt neu starten' }),
    );
    expect(await screen.findByRole('alert')).toHaveTextContent(
      'bereits installiert',
    );
    expect(
      screen.getByRole('button', { name: 'Jetzt neu starten' }),
    ).toBeEnabled();
  });

  it('reports settings failures and avoids checking if the preference is unreadable', async () => {
    vi.mocked(updater.preference).mockImplementation(() => {
      throw new Error('storage unavailable');
    });
    vi.mocked(updater.savePreference).mockImplementation(() => {
      throw new Error('storage unavailable');
    });
    render(<AppUpdates />);
    await open();
    expect(updater.check).not.toHaveBeenCalled();
    expect(screen.getByRole('alert')).toHaveTextContent('nicht gelesen');
    await userEvent.click(screen.getByRole('checkbox'));
    expect(screen.getByRole('alert')).toHaveTextContent('nicht gespeichert');
    expect(screen.getByRole('checkbox')).not.toBeChecked();
  });

  it('releases a pending native update when the view unmounts', async () => {
    let finish!: (update: AvailableUpdate) => void;
    vi.mocked(updater.check).mockImplementation(
      () =>
        new Promise((resolve) => {
          finish = resolve;
        }),
    );
    const view = render(<AppUpdates />);
    view.unmount();
    await act(async () => finish(candidate));
    await waitFor(() => expect(candidate.close).toHaveBeenCalledTimes(1));
  });

  it('does not pretend to update the browser preview', async () => {
    vi.mocked(updater.available).mockReturnValue(false);
    render(<AppUpdates />);
    await open();
    expect(screen.getByText(/in der installierten Lernwelt-App/)).toBeVisible();
    expect(updater.version).not.toHaveBeenCalled();
    expect(updater.check).not.toHaveBeenCalled();
  });
});
