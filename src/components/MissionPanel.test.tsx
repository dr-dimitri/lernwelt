import {
  act,
  fireEvent,
  render,
  screen,
  waitFor,
} from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { beforeEach, expect, it, vi } from 'vitest';
import MissionPanel from './MissionPanel';
import { desktop } from '../lib/desktop';
import {
  missionInitial,
  missionActive,
  missionAt,
  missionCorrect,
  missionCompleted,
  missionSteps,
} from '../test/mission-fixture';
import type { MissionState } from '../domain/mission';

vi.mock('../lib/desktop', () => ({
  desktop: {
    getMissionState: vi.fn(),
    startMission: vi.fn(),
    actMission: vi.fn(),
    setDifficulty: vi.fn(),
  },
}));
beforeEach(() => {
  vi.resetAllMocks();
  vi.mocked(desktop.getMissionState).mockResolvedValue(missionInitial);
  vi.mocked(desktop.startMission).mockResolvedValue(missionActive);
});

it('führt durch alle fünf Schritte mit Rückmeldung, Begründungswahl, Selbstcheck und Tastaturfokus', async () => {
  const user = userEvent.setup();
  vi.mocked(desktop.actMission)
    .mockResolvedValueOnce(missionAt(0, missionCorrect))
    .mockResolvedValueOnce(missionAt(1))
    .mockResolvedValueOnce(missionAt(2))
    .mockResolvedValueOnce(
      missionAt(2, { ...missionCorrect, explanation: '9 + 5 + 9 + 5 = 28 m.' }),
    )
    .mockResolvedValueOnce(missionAt(3))
    .mockResolvedValueOnce(
      missionAt(3, {
        ...missionCorrect,
        explanation: '24 m² ist die Fläche. Der Rand ist 22 m lang.',
      }),
    )
    .mockResolvedValueOnce(missionAt(4))
    .mockResolvedValueOnce(
      missionAt(4, {
        correct: null,
        revealed: true,
        explanation: 'Hast du zwei lange und zwei kurze Seiten gezählt?',
        pointsAwarded: 0,
        independent: false,
      }),
    )
    .mockResolvedValueOnce(missionCompleted);
  render(<MissionPanel profileVersion={0} />);
  await user.click(
    await screen.findByRole('button', { name: 'Lernrunde starten' }),
  );
  const field = await screen.findByLabelText('Deine Antwort in m');
  expect(field).toHaveFocus();
  expect(screen.getByRole('img')).toHaveAccessibleName(
    /zwei Seiten mit Länge 7 m/,
  );
  expect(
    screen.queryByText(missionCorrect.explanation),
  ).not.toBeInTheDocument();
  await user.keyboard('22{Enter}');
  expect(
    await screen.findByRole('heading', { name: 'Das stimmt – gut gelöst!' }),
  ).toHaveFocus();
  expect(screen.getByText('+2 Lernpunkte')).toBeVisible();
  expect(screen.getByLabelText('Verfügbare Lernpunkte')).toHaveTextContent(
    '10 Punkte',
  );
  await user.tab();
  expect(
    screen.getByRole('button', { name: 'Nächster Schritt' }),
  ).toHaveFocus();
  await user.keyboard('{Enter}');
  expect(
    await screen.findByRole('heading', { name: 'Einmal außen herum' }),
  ).toHaveFocus();
  expect(
    screen.queryByRole('button', { name: 'Antwort prüfen' }),
  ).not.toBeInTheDocument();
  await user.click(screen.getByRole('button', { name: 'Nächster Schritt' }));
  expect(await screen.findByLabelText('Deine Antwort in m')).toHaveFocus();
  await user.keyboard('28{Enter}');
  await screen.findByText('9 + 5 + 9 + 5 = 28 m.');
  await user.click(screen.getByRole('button', { name: 'Nächster Schritt' }));
  const options = await screen.findAllByRole('radio');
  expect(options[0]).toHaveFocus();
  await user.keyboard('{ArrowDown}');
  expect(options[1]).toBeChecked();
  await user.click(screen.getByRole('button', { name: 'Antwort prüfen' }));
  expect(desktop.actMission).toHaveBeenLastCalledWith(
    expect.objectContaining({
      action: 'answer',
      stepIndex: 3,
      answer: missionSteps[3].options[1],
    }),
  );
  await screen.findByText('24 m² ist die Fläche. Der Rand ist 22 m lang.');
  await user.click(screen.getByRole('button', { name: 'Nächster Schritt' }));
  expect(
    await screen.findByRole('heading', { name: 'Dein eigener Rand' }),
  ).toHaveFocus();
  expect(
    screen.getByText('Miss die Länge und Breite der Vorderseite in cm.'),
  ).toBeVisible();
  await user.click(
    screen.getByRole('button', { name: 'Selbstkontrolle ansehen' }),
  );
  expect(
    await screen.findByRole('heading', { name: 'Deine Selbstkontrolle' }),
  ).toHaveFocus();
  expect(screen.queryByText('+2 Lernpunkte')).not.toBeInTheDocument();
  await user.click(screen.getByRole('button', { name: 'Runde abschließen' }));
  expect(
    await screen.findByRole('heading', {
      name: 'Deine Gartenrunde ist geschafft!',
    }),
  ).toHaveFocus();
  expect(screen.getByText(/Deine nächste Wiederholung wartet/)).toBeVisible();
  const album = screen.getByRole('list', {
    name: 'Dein Themenalbum auf dieser Stufe',
  });
  expect(album).toHaveTextContent('AusprobiertSchon erreicht');
  expect(album).toHaveTextContent('Später wieder geschafftNoch offen');
  expect(desktop.actMission).toHaveBeenCalledTimes(9);
});

it('zeigt Tipp und Lösung erst nach Bestätigung, führt den Fokus zur Hilfe und vergibt dafür keine Punkte', async () => {
  const user = userEvent.setup();
  const hinted = missionAt(0);
  hinted.session!.currentStep!.hint =
    'Ein Rechteck hat zwei lange und zwei kurze Seiten.';
  vi.mocked(desktop.getMissionState).mockResolvedValue(missionActive);
  vi.mocked(desktop.actMission)
    .mockResolvedValueOnce(hinted)
    .mockResolvedValueOnce(
      missionAt(0, {
        ...missionCorrect,
        revealed: true,
        correct: null,
        pointsAwarded: 0,
        independent: false,
      }),
    );
  render(<MissionPanel profileVersion={0} />);
  await user.click(
    await screen.findByRole('button', { name: 'Gib mir einen Tipp' }),
  );
  expect(await screen.findByRole('status')).toHaveTextContent(
    'zwei lange und zwei kurze Seiten',
  );
  expect(screen.getByRole('status')).toHaveFocus();
  expect(desktop.actMission).toHaveBeenLastCalledWith(
    expect.objectContaining({ action: 'hint', answer: null }),
  );
  expect(
    screen.queryByText(missionCorrect.explanation),
  ).not.toBeInTheDocument();
  await user.click(screen.getByRole('button', { name: 'Lösung ansehen' }));
  expect(await screen.findByText(missionCorrect.explanation)).toBeVisible();
  expect(
    screen.getByRole('heading', { name: 'Schauen wir uns den Weg an' }),
  ).toHaveFocus();
  expect(screen.queryByText(/\+2 Lernpunkte/)).not.toBeInTheDocument();
  expect(
    screen.getByRole('button', { name: 'Nächster Schritt' }),
  ).toBeEnabled();
});

it('behält nach Speicherfehler dieselbe Request-ID und Antwort und sperrt Änderungen bis zum Retry', async () => {
  const user = userEvent.setup();
  let save!: (value: MissionState) => void;
  vi.mocked(desktop.getMissionState).mockResolvedValue(missionActive);
  vi.mocked(desktop.actMission)
    .mockRejectedValueOnce(new Error('Transportfehler'))
    .mockImplementationOnce(
      () =>
        new Promise((resolve) => {
          save = resolve;
        }),
    );
  render(<MissionPanel profileVersion={0} />);
  await user.type(await screen.findByLabelText('Deine Antwort in m'), '22');
  const check = screen.getByRole('button', { name: 'Antwort prüfen' });
  fireEvent.click(check);
  fireEvent.click(check);
  expect(await screen.findByRole('alert')).toHaveTextContent('Transportfehler');
  expect(desktop.actMission).toHaveBeenCalledTimes(1);
  expect(screen.getByLabelText('Deine Antwort in m')).toBeDisabled();
  expect(screen.getByLabelText('Deine Antwort in m')).toHaveValue('22');
  expect(screen.getByRole('button', { name: /Vorschule/ })).toBeDisabled();
  await user.click(
    screen.getByRole('button', { name: 'Speichern erneut versuchen' }),
  );
  expect(vi.mocked(desktop.actMission).mock.calls[0]).toEqual(
    vi.mocked(desktop.actMission).mock.calls[1],
  );
  await act(async () => save(missionAt(0, missionCorrect)));
  expect(
    await screen.findByRole('heading', { name: 'Das stimmt – gut gelöst!' }),
  ).toHaveFocus();
});

it('wechselt frei die Stufe, lädt deren bestätigte Runde und verrät unbekannte Längen nicht', async () => {
  const user = userEvent.setup();
  const streber = missionAt(2);
  streber.difficulty = 'streber';
  streber.session!.id = 'garden-session-streber-1';
  streber.session!.currentStep!.prompt =
    'Der Garten hat 46 m Umfang und ist 8 m breit. Wie lang ist er?';
  streber.session!.currentStep!.diagram = { width: null, height: 8, unit: 'm' };
  vi.mocked(desktop.getMissionState)
    .mockResolvedValueOnce(missionActive)
    .mockResolvedValueOnce(streber)
    .mockResolvedValueOnce(missionActive);
  vi.mocked(desktop.setDifficulty).mockResolvedValue('streber');
  render(<MissionPanel profileVersion={0} />);
  await user.type(await screen.findByLabelText('Deine Antwort in m'), 'alte');
  await user.click(screen.getByRole('button', { name: /Streber/ }));
  expect(
    await screen.findByRole('heading', { name: 'Dein eigener Zaun' }),
  ).toBeVisible();
  expect(desktop.setDifficulty).toHaveBeenCalledWith('streber');
  expect(screen.getByLabelText('Deine Antwort in m')).toHaveValue('');
  expect(screen.getByRole('img')).toHaveAccessibleName(/Länge \? m/);
  expect(screen.getByRole('img')).not.toHaveAccessibleName(/15/);
  await user.click(screen.getByRole('button', { name: /Könner/ }));
  expect(
    await screen.findByRole('heading', { name: 'Was weißt du noch?' }),
  ).toBeVisible();
  expect(desktop.startMission).not.toHaveBeenCalled();
});

it('nimmt gespeicherte Rückmeldung wieder auf ohne den anfänglichen Seitenfokus zu stehlen', async () => {
  const user = userEvent.setup();
  let load!: (value: MissionState) => void;
  vi.mocked(desktop.getMissionState).mockImplementationOnce(
    () =>
      new Promise((resolve) => {
        load = resolve;
      }),
  );
  vi.mocked(desktop.actMission).mockResolvedValue(missionAt(3));
  render(
    <>
      <h1 tabIndex={-1}>Lernrunde</h1>
      <MissionPanel profileVersion={0} />
    </>,
  );
  const heading = screen.getByRole('heading', { name: 'Lernrunde' });
  heading.focus();
  await act(async () => load(missionAt(2, missionCorrect)));
  expect(heading).toHaveFocus();
  expect(screen.getByText(missionCorrect.explanation)).toBeVisible();
  expect(desktop.startMission).not.toHaveBeenCalled();
  await user.click(screen.getByRole('button', { name: 'Nächster Schritt' }));
  expect(desktop.actMission).toHaveBeenCalledWith(
    expect.objectContaining({
      sessionId: missionActive.session!.id,
      stepIndex: 2,
      action: 'next',
    }),
  );
  expect((await screen.findAllByRole('radio'))[0]).toHaveFocus();
});

it('überspringt die optionale Mitmachaufgabe ohne Antwort oder Selbstbewertung', async () => {
  const user = userEvent.setup();
  vi.mocked(desktop.getMissionState).mockResolvedValue(missionAt(4));
  vi.mocked(desktop.actMission).mockResolvedValue(missionCompleted);
  render(<MissionPanel profileVersion={0} />);
  await user.click(
    await screen.findByRole('button', { name: 'Heute überspringen' }),
  );
  expect(desktop.actMission).toHaveBeenCalledWith(
    expect.objectContaining({ action: 'skip', answer: null, stepIndex: 4 }),
  );
  expect(
    await screen.findByRole('heading', {
      name: 'Deine Gartenrunde ist geschafft!',
    }),
  ).toHaveFocus();
});

it('erlaubt Eingabekorrektur ohne Request und verliert beim Tippen oder Rerender keinen Fokus', async () => {
  const user = userEvent.setup();
  vi.mocked(desktop.getMissionState).mockResolvedValue(missionActive);
  vi.mocked(desktop.actMission).mockResolvedValue(missionAt(0, missionCorrect));
  const { rerender } = render(<MissionPanel profileVersion={0} />);
  const field = await screen.findByLabelText('Deine Antwort in m');
  await user.type(field, '2+2{Enter}');
  expect(await screen.findByRole('alert')).toHaveTextContent('nur eine Zahl');
  expect(field).toBeEnabled();
  expect(desktop.actMission).not.toHaveBeenCalled();
  await user.clear(field);
  await user.type(field, '2{ArrowLeft}2');
  expect(field).toHaveFocus();
  expect(field).toHaveValue('22');
  await user.tab();
  rerender(<MissionPanel profileVersion={0} />);
  expect(screen.getByRole('button', { name: 'Antwort prüfen' })).toHaveFocus();
  await user.keyboard('{Enter}');
  expect(await screen.findByText(missionCorrect.explanation)).toBeVisible();
});

it('verwirft alte Lade- und Speicherantworten nach Profiländerung', async () => {
  const user = userEvent.setup();
  let load!: (value: MissionState) => void;
  let save!: (value: MissionState) => void;
  vi.mocked(desktop.getMissionState)
    .mockImplementationOnce(
      () =>
        new Promise((resolve) => {
          load = resolve;
        }),
    )
    .mockResolvedValue(missionActive);
  const { rerender } = render(<MissionPanel profileVersion={0} />);
  rerender(<MissionPanel profileVersion={1} />);
  await screen.findByLabelText('Deine Antwort in m');
  await act(async () => load(missionCompleted));
  expect(
    screen.queryByText('Deine Gartenrunde ist geschafft!'),
  ).not.toBeInTheDocument();
  vi.mocked(desktop.actMission).mockImplementationOnce(
    () =>
      new Promise((resolve) => {
        save = resolve;
      }),
  );
  await user.type(screen.getByLabelText('Deine Antwort in m'), '22{Enter}');
  vi.mocked(desktop.getMissionState).mockResolvedValue({
    ...missionInitial,
    profileReady: false,
  });
  rerender(<MissionPanel profileVersion={2} />);
  expect(await screen.findByText(/Speichere dein Lernprofil/)).toBeVisible();
  await act(async () => save(missionAt(0, missionCorrect)));
  expect(
    screen.queryByText('Das stimmt – gut gelöst!'),
  ).not.toBeInTheDocument();
});

it.each(['22,0', '+22', '1 000'])(
  'überlässt die Bewertung der gültigen Zahl %s dem Backend',
  async (answer) => {
    const user = userEvent.setup();
    vi.mocked(desktop.getMissionState).mockResolvedValue(missionActive);
    vi.mocked(desktop.actMission).mockResolvedValue(
      missionAt(0, missionCorrect),
    );
    render(<MissionPanel profileVersion={0} />);
    await user.type(
      await screen.findByLabelText('Deine Antwort in m'),
      `${answer}{Enter}`,
    );
    expect(desktop.actMission).toHaveBeenCalledWith(
      expect.objectContaining({ answer, action: 'answer' }),
    );
  },
);

it('holt nach Lade- oder Speicherfehler den bestätigten Zustand erneut', async () => {
  const user = userEvent.setup();
  vi.mocked(desktop.getMissionState)
    .mockRejectedValueOnce(new Error('Ladefehler'))
    .mockResolvedValue(missionActive);
  vi.mocked(desktop.actMission).mockRejectedValue(
    new Error('Antwort verloren'),
  );
  render(<MissionPanel profileVersion={0} />);
  expect(await screen.findByRole('alert')).toHaveTextContent('Ladefehler');
  await user.click(screen.getByRole('button', { name: 'Runde neu laden' }));
  expect(await screen.findByLabelText('Deine Antwort in m')).toHaveFocus();
  await user.keyboard('22{Enter}');
  expect(await screen.findByRole('alert')).toHaveTextContent(
    'Antwort verloren',
  );
  vi.mocked(desktop.getMissionState).mockResolvedValue(
    missionAt(0, missionCorrect),
  );
  await user.click(screen.getByRole('button', { name: 'Runde neu laden' }));
  expect(await screen.findByText(missionCorrect.explanation)).toBeVisible();
  expect(
    screen.getByRole('heading', { name: 'Das stimmt – gut gelöst!' }),
  ).toHaveFocus();
  expect(desktop.actMission).toHaveBeenCalledTimes(1);
  await waitFor(() =>
    expect(screen.queryByRole('alert')).not.toBeInTheDocument(),
  );
});

it('fokussiert nach ausdrücklich erneutem Laden den gespeicherten Abschluss', async () => {
  const user = userEvent.setup();
  vi.mocked(desktop.getMissionState)
    .mockRejectedValueOnce(new Error('Ladefehler'))
    .mockResolvedValue(missionCompleted);
  render(<MissionPanel profileVersion={0} />);
  await user.click(
    await screen.findByRole('button', { name: 'Runde neu laden' }),
  );
  expect(
    await screen.findByRole('heading', {
      name: 'Deine Gartenrunde ist geschafft!',
    }),
  ).toHaveFocus();
});

it('belässt den Seitenfokus beim ersten Laden und bei Profilaktualisierung', async () => {
  vi.mocked(desktop.getMissionState)
    .mockResolvedValueOnce(missionActive)
    .mockResolvedValue(missionCompleted);
  const view = (version: number) => (
    <>
      <h1 tabIndex={-1}>Lernrunde</h1>
      <MissionPanel profileVersion={version} />
    </>
  );
  const { rerender } = render(view(0));
  const heading = screen.getByRole('heading', { name: 'Lernrunde' });
  heading.focus();
  await screen.findByLabelText('Deine Antwort in m');
  expect(heading).toHaveFocus();
  rerender(view(1));
  await screen.findByRole('heading', {
    name: 'Deine Gartenrunde ist geschafft!',
  });
  expect(heading).toHaveFocus();
});
