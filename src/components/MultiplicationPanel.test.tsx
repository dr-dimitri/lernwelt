import { act, fireEvent, render, screen, within } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { beforeEach, expect, it, vi } from 'vitest';
import MultiplicationPanel from './MultiplicationPanel';
import { desktop } from '../lib/desktop';
import {
  multiplicationInitial as initial,
  multiplicationSuccess as success,
} from '../test/multiplication-fixture';
import type {
  MultiplicationResult,
  MultiplicationState,
} from '../domain/multiplication';
vi.mock('../lib/desktop', () => ({
  desktop: {
    getMultiplicationState: vi.fn(),
    answerMultiplication: vi.fn(),
    configureMultiplication: vi.fn(),
  },
}));
beforeEach(() => {
  vi.resetAllMocks();
  vi.mocked(desktop.getMultiplicationState).mockResolvedValue(initial);
  vi.mocked(desktop.answerMultiplication).mockResolvedValue(success);
  vi.mocked(desktop.configureMultiplication).mockResolvedValue(initial);
});
const completed: MultiplicationState = {
  ...success.state,
  task: null,
  answered: 8,
  adventure: {
    ...success.state.adventure,
    revision: 8,
    worlds: {
      ...initial.adventure.worlds,
      workshop: {
        answered: 8,
        completedStages: 1,
        stageAnswered: 8,
        awaitingContinue: true,
      },
    },
    robots: [{ design: 'scout', palette: 'mint', count: 1 }],
    lastRobot: { design: 'scout', palette: 'mint' },
  },
};

it('prüft per Enter und führt den Fokus über Rückmeldung zur nächsten Aufgabe', async () => {
  const user = userEvent.setup();
  render(
    <>
      <h1 tabIndex={-1}>Einmaleins-Trainer</h1>
      <MultiplicationPanel profileVersion={0} />
    </>,
  );
  const pageHeading = screen.getByRole('heading', {
    name: 'Einmaleins-Trainer',
  });
  pageHeading.focus();
  const input = await screen.findByLabelText('Dein Ergebnis');
  expect(pageHeading).toHaveFocus();
  expect(desktop.getMultiplicationState).toHaveBeenCalledWith();
  expect(
    screen.getByText(
      '2 Roboter brauchen je 8 Energiezellen. Wie viele Energiezellen sind das zusammen?',
    ),
  ).toBeVisible();
  expect(screen.getByRole('heading', { name: '2 × 8 = ?' })).toBeVisible();
  expect(
    screen.queryByText('16', { selector: 'strong' }),
  ).not.toBeInTheDocument();
  expect(screen.getByRole('button', { name: 'Antwort prüfen' })).toBeDisabled();
  await user.type(input, '16{Enter}');
  expect(desktop.answerMultiplication).toHaveBeenCalledWith({
    mode: 'tables',
    sequence: 0,
    answer: '16',
  });
  expect(
    await screen.findByRole('heading', { name: 'Richtig! +1 Punkt' }),
  ).toHaveFocus();
  expect(screen.getByLabelText('Verfügbare Lernpunkte')).toHaveTextContent(
    '10 Punkte',
  );
  expect(screen.getByRole('progressbar')).toHaveAttribute('aria-valuenow', '1');
  vi.mocked(desktop.getMultiplicationState).mockResolvedValue(success.state);
  await user.tab();
  expect(screen.getByRole('button', { name: 'Nächste Aufgabe' })).toHaveFocus();
  await user.keyboard('{Enter}');
  expect(await screen.findByLabelText('Dein Ergebnis')).toHaveFocus();
  expect(screen.getByLabelText('Dein Ergebnis')).toHaveValue('');
  expect(screen.getByRole('heading', { name: '6 × 5 = ?' })).toBeVisible();
  expect(desktop.answerMultiplication).toHaveBeenCalledTimes(1);
});

it('lässt falsche und aufgedeckte Antworten ohne Punkteabzug weiterbauen', async () => {
  const user = userEvent.setup();
  vi.mocked(desktop.answerMultiplication).mockResolvedValue({
    ...success,
    correct: false,
    pointsAwarded: 0,
    state: { ...success.state, correct: 0, wallet: initial.wallet },
  });
  render(<MultiplicationPanel profileVersion={0} />);
  await user.type(await screen.findByLabelText('Dein Ergebnis'), '15{Enter}');
  expect(
    await screen.findByText('Noch nicht ganz – üben hilft!'),
  ).toBeVisible();
  expect(screen.getByText('16', { selector: 'strong' })).toBeVisible();
  expect(screen.getByLabelText('Verfügbare Lernpunkte')).toHaveTextContent(
    '9 Punkte',
  );
  expect(screen.getByRole('progressbar')).toHaveAttribute('aria-valuenow', '1');
  await user.click(screen.getByRole('button', { name: 'Nächste Aufgabe' }));
  await user.click(
    await screen.findByRole('button', { name: 'Lösung zeigen' }),
  );
  expect(desktop.answerMultiplication).toHaveBeenLastCalledWith({
    mode: 'tables',
    sequence: 0,
    answer: null,
  });
  expect(
    await screen.findByText('Schauen wir uns die Lösung an'),
  ).toBeVisible();
});

it('zeigt Rechenbilder nur auf Wunsch und kehrt per Schließen ins Antwortfeld zurück', async () => {
  const user = userEvent.setup();
  render(<MultiplicationPanel profileVersion={0} />);
  await screen.findByLabelText('Dein Ergebnis');
  expect(screen.queryByRole('dialog')).not.toBeInTheDocument();
  await user.click(
    screen.getByRole('button', { name: 'Zeig mir einen Rechentipp' }),
  );
  const dialog = screen.getByRole('dialog', {
    name: 'Zeig mir einen Rechentipp',
  });
  expect(within(dialog).getByRole('img')).toBeVisible();
  expect(desktop.answerMultiplication).not.toHaveBeenCalled();
  await user.click(within(dialog).getByRole('button', { name: 'Schließen' }));
  expect(screen.getByLabelText('Dein Ergebnis')).toHaveFocus();
});

it('erklärt nach einer falschen Antwort auf Wunsch die Teilprodukte und gibt den Fokus zurück', async () => {
  const user = userEvent.setup();
  vi.mocked(desktop.getMultiplicationState).mockResolvedValue({
    ...initial,
    task: { ...initial.task!, left: 6, right: 7 },
  });
  vi.mocked(desktop.answerMultiplication).mockResolvedValue({
    ...success,
    correct: false,
    pointsAwarded: 0,
    solution: 42,
  });
  render(<MultiplicationPanel profileVersion={0} />);
  const input = await screen.findByLabelText('Dein Ergebnis');
  expect(
    screen.queryByRole('button', { name: 'Rechenweg ansehen' }),
  ).not.toBeInTheDocument();
  expect(
    screen.queryByText('6 × 7 = 5 × 7 + 1 × 7 = 35 + 7 = 42'),
  ).not.toBeInTheDocument();
  await user.type(input, '40{Enter}');
  await user.click(
    await screen.findByRole('button', { name: 'Rechenweg ansehen' }),
  );
  const dialog = screen.getByRole('dialog', { name: 'Rechenweg ansehen' });
  expect(within(dialog).getByRole('img')).toHaveAccessibleName(
    /Zerlege 6 in 5 und 1/,
  );
  expect(
    within(dialog).getByText('6 × 7 = 5 × 7 + 1 × 7 = 35 + 7 = 42'),
  ).toBeVisible();
  expect(desktop.answerMultiplication).toHaveBeenCalledTimes(1);
  await user.click(within(dialog).getByRole('button', { name: 'Schließen' }));
  expect(
    screen.getByRole('button', { name: 'Rechenweg ansehen' }),
  ).toHaveFocus();
});

it('speichert Reihe, Robotendesign und Farben gemeinsam und zeigt sie nach erneutem Laden', async () => {
  const user = userEvent.setup();
  const customized: MultiplicationState = {
    ...initial,
    task: { ...initial.task!, sequence: 1, left: 5, right: 3 },
    adventure: {
      ...initial.adventure,
      revision: 1,
      table: 5,
      design: 'aqua',
      palette: 'violet',
    },
  };
  vi.mocked(desktop.configureMultiplication).mockResolvedValue(customized);
  const { unmount } = render(<MultiplicationPanel profileVersion={0} />);
  await user.click(await screen.findByRole('button', { name: 'Dein Bauplan' }));
  const dialog = screen.getByRole('dialog', { name: 'Dein Bauplan' });
  await user.selectOptions(within(dialog).getByLabelText('Deine Reihe'), '5');
  await user.click(
    within(dialog).getByRole('button', { name: 'Wasserforscher' }),
  );
  await user.click(within(dialog).getByRole('button', { name: 'Beerenlila' }));
  expect(desktop.configureMultiplication).not.toHaveBeenCalled();
  await user.click(
    within(dialog).getByRole('button', { name: 'Bauplan speichern' }),
  );
  expect(desktop.configureMultiplication).toHaveBeenCalledWith(
    expect.objectContaining({
      expectedRevision: 0,
      table: 5,
      design: 'aqua',
      palette: 'violet',
      world: 'workshop',
      mode: 'tables',
      review: false,
      continueStage: false,
    }),
  );
  expect(
    await screen.findByRole('heading', { name: '5 × 3 = ?' }),
  ).toBeVisible();
  expect(screen.queryByRole('dialog')).not.toBeInTheDocument();
  expect(screen.getByLabelText('Dein Ergebnis')).toHaveFocus();
  unmount();
  vi.mocked(desktop.getMultiplicationState).mockResolvedValue(customized);
  render(<MultiplicationPanel profileVersion={0} />);
  expect(await screen.findByText('5er-Reihe')).toBeVisible();
  await user.click(screen.getByRole('button', { name: 'Dein Bauplan' }));
  expect(screen.getByLabelText('Deine Reihe')).toHaveValue('5');
  expect(
    screen.getByRole('button', { name: 'Wasserforscher' }),
  ).toHaveAttribute('aria-pressed', 'true');
  expect(screen.getByRole('button', { name: 'Beerenlila' })).toHaveAttribute(
    'aria-pressed',
    'true',
  );
});

it('wechselt zu Quadratzahlen bis 20 und entfernt alte Eingaben und Rückmeldungen', async () => {
  const user = userEvent.setup();
  render(<MultiplicationPanel profileVersion={0} />);
  await user.type(await screen.findByLabelText('Dein Ergebnis'), '16{Enter}');
  await screen.findByText('Richtig! +1 Punkt');
  vi.mocked(desktop.configureMultiplication).mockResolvedValue({
    ...initial,
    mode: 'squares',
    task: {
      ...initial.task!,
      id: '20x20',
      sequence: 1,
      left: 20,
      right: 20,
      roundSize: 20,
    },
    adventure: { ...initial.adventure, revision: 2 },
  });
  await user.click(screen.getByRole('button', { name: 'Dein Bauplan' }));
  await user.click(
    screen.getByRole('button', { name: 'Quadratzahlen · 10² bis 20²' }),
  );
  expect(screen.queryByLabelText('Deine Reihe')).not.toBeInTheDocument();
  await user.click(screen.getByRole('button', { name: 'Bauplan speichern' }));
  expect(
    await screen.findByRole('heading', { name: '20 × 20 = ?' }),
  ).toBeVisible();
  expect(desktop.configureMultiplication).toHaveBeenCalledWith(
    expect.objectContaining({ mode: 'squares', expectedRevision: 1 }),
  );
  expect(screen.queryByText('Richtig! +1 Punkt')).not.toBeInTheDocument();
  expect(screen.getByLabelText('Dein Ergebnis')).toHaveValue('');
  expect(screen.getByText(/Dein Solarfeld hat 20 Reihen/)).toBeVisible();
});

it('beendet acht Aufgaben mit einem Bauwerk und setzt erst nach Weiterbauen fort', async () => {
  const user = userEvent.setup();
  const seventh: MultiplicationState = {
    ...initial,
    adventure: {
      ...initial.adventure,
      worlds: {
        ...initial.adventure.worlds,
        workshop: {
          answered: 7,
          stageAnswered: 7,
          completedStages: 0,
          awaitingContinue: false,
        },
      },
    },
  };
  vi.mocked(desktop.getMultiplicationState).mockResolvedValue(seventh);
  vi.mocked(desktop.answerMultiplication).mockResolvedValue({
    ...success,
    correct: false,
    pointsAwarded: 0,
    state: completed,
  });
  vi.mocked(desktop.configureMultiplication).mockResolvedValue({
    ...initial,
    adventure: {
      ...completed.adventure,
      revision: 9,
      worlds: {
        ...completed.adventure.worlds,
        workshop: {
          ...completed.adventure.worlds.workshop,
          stageAnswered: 0,
          awaitingContinue: false,
        },
      },
    },
  });
  render(<MultiplicationPanel profileVersion={0} />);
  await user.click(
    await screen.findByRole('button', { name: 'Lösung zeigen' }),
  );
  expect(
    await screen.findByRole('heading', { name: 'Etappe geschafft!' }),
  ).toBeVisible();
  expect(screen.getByRole('progressbar')).toHaveAttribute('aria-valuenow', '8');
  expect(
    screen.queryByRole('button', { name: 'Nächste Aufgabe' }),
  ).not.toBeInTheDocument();
  await user.click(screen.getByRole('button', { name: 'Pause machen' }));
  expect(
    screen.getByRole('heading', { name: 'Dein Bauwerk wartet auf dich.' }),
  ).toHaveFocus();
  expect(desktop.configureMultiplication).not.toHaveBeenCalled();
  await user.click(screen.getByRole('button', { name: 'Dein Bauregal' }));
  const shelf = screen.getByRole('dialog', { name: 'Dein Bauregal' });
  expect(within(shelf).getByText('Minzgrün · 1 gebaut')).toBeVisible();
  await user.click(within(shelf).getByRole('button', { name: 'Schließen' }));
  await user.click(screen.getByRole('button', { name: 'Weiterbauen' }));
  expect(desktop.configureMultiplication).toHaveBeenCalledWith(
    expect.objectContaining({ expectedRevision: 8, continueStage: true }),
  );
  expect(await screen.findByLabelText('Dein Ergebnis')).toHaveFocus();
  expect(screen.getByRole('progressbar')).toHaveAttribute('aria-valuenow', '0');
  expect(screen.getByRole('heading', { name: 'Roboter 2' })).toBeVisible();
});

it('setzt eine fertige Etappe nach Neustart fort und zeigt den Inselausbau nach sechs Bauwerken', async () => {
  const user = userEvent.setup();
  vi.mocked(desktop.getMultiplicationState).mockResolvedValue(completed);
  const island: MultiplicationState = {
    ...initial,
    adventure: {
      ...initial.adventure,
      revision: 9,
      world: 'island',
      worlds: {
        ...completed.adventure.worlds,
        island: {
          answered: 48,
          stageAnswered: 0,
          completedStages: 6,
          awaitingContinue: false,
        },
      },
    },
  };
  vi.mocked(desktop.configureMultiplication).mockResolvedValue(island);
  render(<MultiplicationPanel profileVersion={0} />);
  expect(
    await screen.findByRole('heading', { name: 'Etappe geschafft!' }),
  ).toBeVisible();
  expect(screen.queryByLabelText('Dein Ergebnis')).not.toBeInTheDocument();
  await user.click(screen.getByRole('button', { name: 'Einmaleins-Insel' }));
  expect(desktop.configureMultiplication).toHaveBeenCalledWith(
    expect.objectContaining({
      world: 'island',
      expectedRevision: 8,
      continueStage: false,
    }),
  );
  expect(
    await screen.findByRole('heading', { name: 'Inselausbau 1' }),
  ).toBeVisible();
  expect(screen.getByText(/2 Häuser bekommen je 8 Solarmodule/)).toBeVisible();
  expect(screen.getByLabelText('Dein Ergebnis')).toHaveFocus();
});

it('bietet Stolperaufgaben freiwillig an und kehrt nach der Runde zum normalen Üben zurück', async () => {
  const user = userEvent.setup();
  const withMistakes = {
    ...initial,
    adventure: { ...initial.adventure, reviewCount: 2 },
  };
  const review = {
    ...withMistakes,
    task: { ...initial.task!, review: true },
    adventure: { ...withMistakes.adventure, revision: 1, review: true },
  };
  vi.mocked(desktop.getMultiplicationState).mockResolvedValue(withMistakes);
  vi.mocked(desktop.configureMultiplication)
    .mockResolvedValueOnce(review)
    .mockResolvedValueOnce(withMistakes);
  render(<MultiplicationPanel profileVersion={0} />);
  await user.click(
    await screen.findByRole('button', { name: 'Stolperaufgaben üben · 2' }),
  );
  expect(desktop.configureMultiplication).toHaveBeenCalledWith(
    expect.objectContaining({ review: true }),
  );
  expect(
    await screen.findByText('STOLPERAUFGABEN · NOCH MAL IN RUHE'),
  ).toBeVisible();
  vi.mocked(desktop.answerMultiplication).mockResolvedValue({
    ...success,
    state: { ...review, task: null },
  });
  await user.type(screen.getByLabelText('Dein Ergebnis'), '16{Enter}');
  await screen.findByText('Richtig! +1 Punkt');
  vi.mocked(desktop.getMultiplicationState).mockResolvedValue({
    ...review,
    task: null,
  });
  await user.click(screen.getByRole('button', { name: 'Nächste Aufgabe' }));
  expect(
    await screen.findByRole('heading', { name: 'Für jetzt geschafft!' }),
  ).toHaveFocus();
  await user.click(screen.getByRole('button', { name: 'Normal weiterüben' }));
  expect(desktop.configureMultiplication).toHaveBeenLastCalledWith(
    expect.objectContaining({ review: false }),
  );
  expect(await screen.findByLabelText('Dein Ergebnis')).toHaveFocus();
});

it('behält den fertigen Roboter bei neuen Einstellungen und nutzt sie erst beim Weiterbauen', async () => {
  const user = userEvent.setup();
  const customized: MultiplicationState = {
    ...completed,
    adventure: {
      ...completed.adventure,
      revision: 9,
      design: 'aqua',
      palette: 'violet',
    },
  };
  vi.mocked(desktop.getMultiplicationState).mockResolvedValue(completed);
  vi.mocked(desktop.configureMultiplication)
    .mockResolvedValueOnce(customized)
    .mockResolvedValueOnce({
      ...initial,
      adventure: {
        ...customized.adventure,
        revision: 10,
        worlds: {
          ...customized.adventure.worlds,
          workshop: {
            ...customized.adventure.worlds.workshop,
            stageAnswered: 0,
            awaitingContinue: false,
          },
        },
      },
    });
  render(<MultiplicationPanel profileVersion={0} />);
  await user.click(await screen.findByRole('button', { name: 'Dein Bauplan' }));
  expect(
    screen.getByText(/Änderungen gelten für das nächste Bauwerk/),
  ).toBeVisible();
  await user.click(screen.getByRole('button', { name: 'Wasserforscher' }));
  await user.click(screen.getByRole('button', { name: 'Beerenlila' }));
  await user.click(screen.getByRole('button', { name: 'Bauplan speichern' }));
  expect(
    await screen.findByRole('heading', { name: 'Etappe geschafft!' }),
  ).toBeVisible();
  expect(screen.getByText('Entdecker · Minzgrün')).toBeVisible();
  expect(
    screen.queryByText('Wasserforscher · Beerenlila'),
  ).not.toBeInTheDocument();
  await user.click(screen.getByRole('button', { name: 'Weiterbauen' }));
  expect(await screen.findByText('Wasserforscher · Beerenlila')).toBeVisible();
  expect(screen.getByLabelText('Dein Ergebnis')).toHaveFocus();
});

it('behält bei Speicherfehler die identische Antwort und sperrt parallele Änderungen', async () => {
  const user = userEvent.setup();
  let resolve!: (value: MultiplicationResult) => void;
  vi.mocked(desktop.answerMultiplication)
    .mockRejectedValueOnce(new Error('Speicherfehler'))
    .mockImplementationOnce(
      () =>
        new Promise((done) => {
          resolve = done;
        }),
    );
  render(<MultiplicationPanel profileVersion={0} />);
  await user.type(await screen.findByLabelText('Dein Ergebnis'), '16');
  const button = screen.getByRole('button', { name: 'Antwort prüfen' });
  fireEvent.click(button);
  fireEvent.click(button);
  expect(await screen.findByRole('alert')).toHaveTextContent('Speicherfehler');
  expect(desktop.answerMultiplication).toHaveBeenCalledTimes(1);
  expect(screen.getByLabelText('Dein Ergebnis')).toBeDisabled();
  expect(
    screen.getByRole('button', { name: 'Einmaleins-Insel' }),
  ).toBeDisabled();
  expect(screen.getByRole('button', { name: 'Dein Bauplan' })).toBeDisabled();
  await user.click(
    screen.getByRole('button', { name: 'Speichern erneut versuchen' }),
  );
  expect(vi.mocked(desktop.answerMultiplication).mock.calls[0]).toEqual(
    vi.mocked(desktop.answerMultiplication).mock.calls[1],
  );
  await act(async () => resolve(success));
  expect(
    await screen.findByRole('heading', { name: 'Richtig! +1 Punkt' }),
  ).toHaveFocus();
});

it('zeigt Konfigurationsfehler im offenen Bauplan und wiederholt exakt denselben Request', async () => {
  const user = userEvent.setup();
  vi.mocked(desktop.configureMultiplication)
    .mockRejectedValueOnce(new Error('Bauplan nicht gespeichert'))
    .mockResolvedValueOnce(initial);
  render(<MultiplicationPanel profileVersion={0} />);
  await user.click(await screen.findByRole('button', { name: 'Dein Bauplan' }));
  await user.selectOptions(screen.getByLabelText('Deine Reihe'), '7');
  await user.click(screen.getByRole('button', { name: 'Bauplan speichern' }));
  const dialog = screen.getByRole('dialog', { name: 'Dein Bauplan' });
  expect(await within(dialog).findByRole('alert')).toHaveTextContent(
    'Bauplan nicht gespeichert',
  );
  expect(within(dialog).getByLabelText('Deine Reihe')).toBeDisabled();
  await user.click(
    within(dialog).getByRole('button', { name: 'Speichern erneut versuchen' }),
  );
  expect(vi.mocked(desktop.configureMultiplication).mock.calls[0]).toEqual(
    vi.mocked(desktop.configureMultiplication).mock.calls[1],
  );
  expect(screen.queryByRole('dialog')).not.toBeInTheDocument();
});

it('führt beim Schließen eines fehlgeschlagenen Bauplans zum sichtbaren Fehler und erhält den Retry', async () => {
  const user = userEvent.setup();
  vi.mocked(desktop.configureMultiplication)
    .mockRejectedValueOnce(new Error('Bauplan nicht gespeichert'))
    .mockResolvedValueOnce(initial);
  render(<MultiplicationPanel profileVersion={0} />);
  await user.click(await screen.findByRole('button', { name: 'Dein Bauplan' }));
  await user.click(screen.getByRole('button', { name: 'Bauplan speichern' }));
  await screen.findByRole('alert');
  await user.click(screen.getByRole('button', { name: 'Schließen' }));
  expect(screen.getByRole('alert')).toHaveFocus();
  expect(screen.getByRole('button', { name: 'Dein Bauplan' })).toBeDisabled();
  await user.click(
    screen.getByRole('button', { name: 'Speichern erneut versuchen' }),
  );
  expect(vi.mocked(desktop.configureMultiplication).mock.calls[0]).toEqual(
    vi.mocked(desktop.configureMultiplication).mock.calls[1],
  );
  expect(await screen.findByLabelText('Dein Ergebnis')).toHaveFocus();
});

it('lässt ungültige Eingaben korrigieren und zeigt Profil- und Ladefehler', async () => {
  const user = userEvent.setup();
  render(<MultiplicationPanel profileVersion={0} />);
  const field = await screen.findByLabelText('Dein Ergebnis');
  await user.type(field, '2+2{Enter}');
  expect(await screen.findByRole('alert')).toHaveTextContent('Nur Ziffern');
  expect(desktop.answerMultiplication).not.toHaveBeenCalled();
  expect(field).toBeEnabled();
  await user.clear(field);
  await user.type(field, '16{Enter}');
  await screen.findByText('Richtig! +1 Punkt');
  vi.mocked(desktop.getMultiplicationState).mockRejectedValueOnce(
    new Error('Ladefehler'),
  );
  await user.click(screen.getByRole('button', { name: 'Nächste Aufgabe' }));
  expect(await screen.findByRole('alert')).toHaveTextContent('Ladefehler');
  vi.mocked(desktop.getMultiplicationState).mockResolvedValue({
    ...initial,
    profileReady: false,
    task: null,
  });
  await user.click(screen.getByRole('button', { name: 'Trainer neu laden' }));
  expect(await screen.findByText(/Speichere dein Lernprofil/)).toBeVisible();
  expect(
    screen.getByRole('heading', { name: 'Deine Einmaleins-Welten' }),
  ).toHaveFocus();
  expect(screen.queryByLabelText('Dein Ergebnis')).not.toBeInTheDocument();
});

it('verwirft veraltete Lade- und Speicherantworten nach Profilaktualisierung', async () => {
  const user = userEvent.setup();
  let load!: (value: MultiplicationState) => void;
  let save!: (value: MultiplicationResult) => void;
  vi.mocked(desktop.getMultiplicationState).mockImplementationOnce(
    () =>
      new Promise((done) => {
        load = done;
      }),
  );
  const { rerender } = render(<MultiplicationPanel profileVersion={0} />);
  rerender(<MultiplicationPanel profileVersion={1} />);
  await screen.findByLabelText('Dein Ergebnis');
  await act(async () => load({ ...initial, task: null }));
  expect(screen.getByLabelText('Dein Ergebnis')).toBeVisible();
  vi.mocked(desktop.answerMultiplication).mockImplementationOnce(
    () =>
      new Promise((done) => {
        save = done;
      }),
  );
  await user.type(screen.getByLabelText('Dein Ergebnis'), '16{Enter}');
  vi.mocked(desktop.getMultiplicationState).mockResolvedValue({
    ...initial,
    profileReady: false,
    task: null,
  });
  rerender(<MultiplicationPanel profileVersion={2} />);
  await screen.findByText(/Speichere dein Lernprofil/);
  await act(async () => save(success));
  expect(screen.queryByText('Richtig! +1 Punkt')).not.toBeInTheDocument();
});

it('holt nach unklarer Speicherung beim Neuladen den bestätigten Aufgabenstand mit Fokus', async () => {
  const user = userEvent.setup();
  vi.mocked(desktop.answerMultiplication).mockRejectedValueOnce(
    new Error('Antwort verloren'),
  );
  render(<MultiplicationPanel profileVersion={0} />);
  await user.type(await screen.findByLabelText('Dein Ergebnis'), '16{Enter}');
  await screen.findByRole('alert');
  vi.mocked(desktop.getMultiplicationState).mockResolvedValue(success.state);
  await user.click(screen.getByRole('button', { name: 'Trainer neu laden' }));
  expect(
    await screen.findByRole('heading', { name: '6 × 5 = ?' }),
  ).toBeVisible();
  expect(screen.getByLabelText('Dein Ergebnis')).toHaveFocus();
  expect(screen.getByLabelText('Verfügbare Lernpunkte')).toHaveTextContent(
    '10 Punkte',
  );
  expect(desktop.answerMultiplication).toHaveBeenCalledTimes(1);
});
