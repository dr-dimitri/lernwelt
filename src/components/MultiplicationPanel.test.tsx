import { act, render, screen } from '@testing-library/react';
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
  desktop: { getMultiplicationState: vi.fn(), answerMultiplication: vi.fn() },
}));
beforeEach(() => {
  vi.resetAllMocks();
  vi.mocked(desktop.getMultiplicationState).mockResolvedValue(initial);
  vi.mocked(desktop.answerMultiplication).mockResolvedValue(success);
});
it('prüft per Enter, vergibt einen Punkt und lädt die nächste Aufgabe bewusst', async () => {
  const user = userEvent.setup();
  render(<MultiplicationPanel profileVersion={0} />);
  const input = await screen.findByLabelText('Dein Ergebnis');
  expect(input).toHaveFocus();
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
  expect(screen.queryByLabelText('Dein Ergebnis')).not.toBeInTheDocument();
  vi.mocked(desktop.getMultiplicationState).mockResolvedValue(success.state);
  await user.click(screen.getByRole('button', { name: 'Nächste Aufgabe' }));
  expect(await screen.findByLabelText('Dein Ergebnis')).toHaveValue('');
  expect(screen.getByRole('heading', { name: '6 × 5 = ?' })).toBeVisible();
  expect(desktop.answerMultiplication).toHaveBeenCalledTimes(1);
});
it('zeigt falsche Antworten und aufgedeckte Lösungen ohne Punkteabzug', async () => {
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
  await user.click(screen.getByRole('button', { name: 'Nächste Aufgabe' }));
  await user.click(
    await screen.findByRole('button', {
      name: 'Weiß ich noch nicht · Lösung zeigen',
    }),
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
it('wechselt zu Quadratzahlen und entfernt Eingabe und Rückmeldung der alten Rechenart', async () => {
  const user = userEvent.setup();
  render(<MultiplicationPanel profileVersion={0} />);
  await user.type(await screen.findByLabelText('Dein Ergebnis'), '16{Enter}');
  await screen.findByText('Richtig! +1 Punkt');
  vi.mocked(desktop.getMultiplicationState).mockResolvedValue({
    ...initial,
    mode: 'squares',
    task: { sequence: 24, left: 25, right: 25 },
  });
  await user.click(screen.getByRole('button', { name: /Quadratzahlen/ }));
  expect(
    await screen.findByRole('heading', { name: '25 × 25 = ?' }),
  ).toBeVisible();
  expect(desktop.getMultiplicationState).toHaveBeenLastCalledWith('squares');
  expect(screen.queryByText('Richtig! +1 Punkt')).not.toBeInTheDocument();
  expect(screen.getByLabelText('Dein Ergebnis')).toHaveValue('');
  expect(screen.getByText(/RUNDE 1 · AUFGABE 25 VON 25/)).toBeVisible();
});
it('behält bei Speicherfehler die identische Antwort und sperrt parallele Änderungen', async () => {
  const user = userEvent.setup();
  let resolve!: (r: MultiplicationResult) => void;
  vi.mocked(desktop.answerMultiplication)
    .mockRejectedValueOnce(new Error('Speicherfehler'))
    .mockImplementationOnce(
      () =>
        new Promise((r) => {
          resolve = r;
        }),
    );
  render(<MultiplicationPanel profileVersion={0} />);
  await user.type(await screen.findByLabelText('Dein Ergebnis'), '16{Enter}');
  expect(await screen.findByRole('alert')).toHaveTextContent('Speicherfehler');
  expect(screen.getByLabelText('Dein Ergebnis')).toBeDisabled();
  expect(screen.getByRole('button', { name: /Quadratzahlen/ })).toBeDisabled();
  expect(screen.getByLabelText('Verfügbare Lernpunkte')).toHaveTextContent(
    '9 Punkte',
  );
  await user.click(
    screen.getByRole('button', { name: 'Speichern erneut versuchen' }),
  );
  expect(screen.getByRole('button', { name: 'Antwort prüfen' })).toBeDisabled();
  expect(vi.mocked(desktop.answerMultiplication).mock.calls[0]).toEqual(
    vi.mocked(desktop.answerMultiplication).mock.calls[1],
  );
  await act(async () => resolve(success));
  expect(await screen.findByText('Richtig! +1 Punkt')).toBeVisible();
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
  expect(
    await screen.findByText(/Speichere zuerst unten dein Lernprofil/),
  ).toBeVisible();
  expect(screen.queryByLabelText('Dein Ergebnis')).not.toBeInTheDocument();
});
it('verwirft veraltete Lade- und Speicherantworten nach Profilaktualisierung', async () => {
  const user = userEvent.setup();
  let load!: (s: MultiplicationState) => void;
  let save!: (r: MultiplicationResult) => void;
  vi.mocked(desktop.getMultiplicationState).mockImplementationOnce(
    () =>
      new Promise((r) => {
        load = r;
      }),
  );
  const { rerender } = render(<MultiplicationPanel profileVersion={0} />);
  rerender(<MultiplicationPanel profileVersion={1} />);
  await screen.findByLabelText('Dein Ergebnis');
  await act(async () => load({ ...initial, task: null }));
  expect(screen.getByLabelText('Dein Ergebnis')).toBeVisible();
  vi.mocked(desktop.answerMultiplication).mockImplementationOnce(
    () =>
      new Promise((r) => {
        save = r;
      }),
  );
  await user.type(screen.getByLabelText('Dein Ergebnis'), '16{Enter}');
  vi.mocked(desktop.getMultiplicationState).mockResolvedValue({
    ...initial,
    profileReady: false,
    task: null,
  });
  rerender(<MultiplicationPanel profileVersion={2} />);
  await screen.findByText(/Speichere zuerst unten/);
  await act(async () => save(success));
  expect(screen.queryByText('Richtig! +1 Punkt')).not.toBeInTheDocument();
});
it('holt nach unklarer Speicherung beim Neuladen den bestätigten Aufgabenstand', async () => {
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
  expect(screen.getByLabelText('Verfügbare Lernpunkte')).toHaveTextContent(
    '10 Punkte',
  );
  expect(desktop.answerMultiplication).toHaveBeenCalledTimes(1);
});
