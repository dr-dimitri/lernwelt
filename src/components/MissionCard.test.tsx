import { act, fireEvent, render, screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { beforeEach, expect, it, vi } from 'vitest';
import MissionCard from './MissionCard';
import { desktop } from '../lib/desktop';
import {
  missionInitial,
  missionActive,
  missionCompleted,
  missionOverview,
  englishMissionMetadata,
  natureMissionMetadata,
} from '../test/mission-fixture';
import type { MissionState } from '../domain/mission';
vi.mock('../lib/desktop', () => ({
  desktop: { getMissionState: vi.fn(), startMission: vi.fn() },
}));
beforeEach(() => {
  vi.resetAllMocks();
  vi.mocked(desktop.getMissionState).mockResolvedValue(missionInitial);
  vi.mocked(desktop.startMission).mockResolvedValue(missionActive);
});

it('startet eine Runde einmal und öffnet sie erst nach bestätigtem Speichern', async () => {
  const onOpen = vi.fn();
  let start!: (value: MissionState) => void;
  vi.mocked(desktop.startMission).mockImplementationOnce(
    () =>
      new Promise((resolve) => {
        start = resolve;
      }),
  );
  render(<MissionCard profileVersion={0} onOpen={onOpen} />);
  const button = await screen.findByRole('button', {
    name: 'Lernrunde starten',
  });
  fireEvent.click(button);
  fireEvent.click(button);
  expect(desktop.startMission).toHaveBeenCalledTimes(1);
  expect(onOpen).not.toHaveBeenCalled();
  await act(async () => start(missionActive));
  expect(onOpen).toHaveBeenCalledTimes(1);
  expect(desktop.startMission).toHaveBeenCalledWith(
    expect.objectContaining({ difficulty: 'koenner' }),
  );
});
it('setzt vorhandene Runden ohne erneuten Start fort und zeigt fällige Wiederholungen', async () => {
  const user = userEvent.setup();
  const onOpen = vi.fn();
  vi.mocked(desktop.getMissionState)
    .mockResolvedValueOnce(missionActive)
    .mockResolvedValueOnce({ ...missionCompleted, due: true });
  const { rerender } = render(
    <MissionCard profileVersion={0} onOpen={onOpen} />,
  );
  await user.click(
    await screen.findByRole('button', { name: 'Runde fortsetzen' }),
  );
  expect(desktop.startMission).not.toHaveBeenCalled();
  expect(onOpen).toHaveBeenCalledTimes(1);
  rerender(<MissionCard profileVersion={1} onOpen={onOpen} />);
  expect(
    await screen.findByRole('button', { name: 'Jetzt wiederholen' }),
  ).toBeVisible();
  expect(screen.getByText('Deine Wiederholung wartet auf dich.')).toBeVisible();
});
it('wiederholt nach Startfehler exakt dieselbe Request-ID', async () => {
  const user = userEvent.setup();
  const onOpen = vi.fn();
  vi.mocked(desktop.startMission)
    .mockRejectedValueOnce(new Error('Speicherfehler'))
    .mockResolvedValue(missionActive);
  render(<MissionCard profileVersion={0} onOpen={onOpen} />);
  await user.click(
    await screen.findByRole('button', { name: 'Lernrunde starten' }),
  );
  expect(await screen.findByRole('alert')).toHaveTextContent('Speicherfehler');
  await user.click(
    screen.getByRole('button', { name: 'Start erneut versuchen' }),
  );
  expect(vi.mocked(desktop.startMission).mock.calls[0]).toEqual(
    vi.mocked(desktop.startMission).mock.calls[1],
  );
  expect(onOpen).toHaveBeenCalledTimes(1);
});
it('zeigt Ladefehler und ignoriert den alten Start nach dem Verlassen', async () => {
  const user = userEvent.setup();
  const onOpen = vi.fn();
  let start!: (value: MissionState) => void;
  vi.mocked(desktop.getMissionState)
    .mockRejectedValueOnce(new Error('Ladefehler'))
    .mockResolvedValue(missionInitial);
  vi.mocked(desktop.startMission).mockImplementationOnce(
    () =>
      new Promise((resolve) => {
        start = resolve;
      }),
  );
  const { unmount } = render(
    <MissionCard profileVersion={0} onOpen={onOpen} />,
  );
  expect(await screen.findByRole('alert')).toHaveTextContent('Ladefehler');
  await user.click(screen.getByRole('button', { name: 'Runde neu laden' }));
  expect(
    await screen.findByRole('button', { name: 'Lernrunde starten' }),
  ).toHaveFocus();
  await user.click(
    await screen.findByRole('button', { name: 'Lernrunde starten' }),
  );
  unmount();
  await act(async () => start(missionActive));
  expect(onOpen).not.toHaveBeenCalled();
});

it('behält beim ersten Laden und Profilaktualisieren den Seitenfokus', async () => {
  vi.mocked(desktop.getMissionState)
    .mockResolvedValueOnce(missionInitial)
    .mockResolvedValue(missionActive);
  const view = (version: number) => (
    <>
      <h1 tabIndex={-1}>Meine Fächer</h1>
      <MissionCard profileVersion={version} onOpen={vi.fn()} />
    </>
  );
  const { rerender } = render(view(0));
  const heading = screen.getByRole('heading', { name: 'Meine Fächer' });
  heading.focus();
  await screen.findByRole('button', { name: 'Lernrunde starten' });
  expect(heading).toHaveFocus();
  rerender(view(1));
  await screen.findByRole('button', { name: 'Runde fortsetzen' });
  expect(heading).toHaveFocus();
});

it('zeigt Themen und Fälligkeiten gemeinsam und setzt das gewählte Thema fort', async () => {
  const user = userEvent.setup();
  const onOpen = vi.fn();
  vi.mocked(desktop.getMissionState).mockResolvedValue(missionOverview);
  render(<MissionCard profileVersion={0} onOpen={onOpen} />);
  expect(
    await screen.findByRole('button', {
      name: /Natur und Technik.*Wiederholung fällig/,
    }),
  ).toBeVisible();
  await user.click(
    screen.getByRole('button', { name: /Englisch.*Schritt 3 fortsetzen/ }),
  );
  expect(
    screen.getByRole('heading', { name: englishMissionMetadata.title }),
  ).toBeVisible();
  await user.click(screen.getByRole('button', { name: 'Runde fortsetzen' }));
  expect(onOpen).toHaveBeenCalledWith(englishMissionMetadata.id);
  expect(desktop.startMission).not.toHaveBeenCalled();
});
it('behält das gewählte Thema beim fehlgeschlagenen Start und lädt den bestätigten Stand', async () => {
  const user = userEvent.setup();
  const onOpen = vi.fn();
  vi.mocked(desktop.getMissionState).mockResolvedValue(missionOverview);
  vi.mocked(desktop.startMission).mockRejectedValueOnce(
    new Error('Speicherfehler'),
  );
  render(<MissionCard profileVersion={0} onOpen={onOpen} />);
  const nature = await screen.findByRole('button', {
    name: /Natur und Technik.*Wiederholung fällig/,
  });
  await user.click(nature);
  await user.click(screen.getByRole('button', { name: 'Jetzt wiederholen' }));
  expect(await screen.findByRole('alert')).toHaveTextContent('Speicherfehler');
  expect(desktop.startMission).toHaveBeenCalledWith(
    expect.objectContaining({ topicId: natureMissionMetadata.id }),
  );
  expect(
    screen.getByRole('button', { name: /Englisch.*Schritt 3/ }),
  ).toBeDisabled();
  vi.mocked(desktop.getMissionState).mockResolvedValue({
    ...missionOverview,
    topics: missionOverview.topics.map((t) =>
      t.metadata.id === natureMissionMetadata.id ? { ...t, activeStep: 0 } : t,
    ),
  });
  await user.click(screen.getByRole('button', { name: 'Runde neu laden' }));
  await user.click(
    await screen.findByRole('button', { name: 'Runde fortsetzen' }),
  );
  expect(onOpen).toHaveBeenCalledWith(natureMissionMetadata.id);
  expect(desktop.startMission).toHaveBeenCalledTimes(1);
});
