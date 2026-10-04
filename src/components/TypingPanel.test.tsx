import { act, fireEvent, render, screen, within } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { beforeEach, expect, it, vi } from 'vitest';
import TypingPanel from './TypingPanel';
import { desktop } from '../lib/desktop';
import type { TypingResult, TypingState } from '../domain/typing';
import type { Difficulty } from '../domain/learning';

vi.mock('../lib/desktop', () => ({
  desktop: {
    getTypingState: vi.fn(),
    submitTyping: vi.fn(),
    setDifficulty: vi.fn(),
  },
}));

const levels: Difficulty[] = ['vorschule', 'koenner', 'streber'];
const initial: TypingState = {
  profileReady: true,
  difficulty: 'koenner',
  wallet: { balance: 8, totalEarned: 8, rewards: [] },
  stations: Array.from({ length: 12 }, (_, index) => ({
    id: `station-${index}`,
    title:
      index === 0
        ? 'Funkkontakt'
        : index === 1
          ? 'Signalabgleich'
          : index === 11
            ? 'Logbuch'
            : `Sektor ${index + 1}`,
    description: 'Finde deine Starttasten.',
    newKeys: index === 0 ? ['F', 'J', 'Leertaste'] : ['D', 'K'],
    tip: 'Fühle F und J mit deinen Zeigefingern.',
    tasks: levels.flatMap((difficulty) =>
      [1, 2, 3].map((line) => ({
        id: `station-${index}.${difficulty}.${line}`,
        difficulty,
        text:
          index === 11
            ? 'Äußerer Orbit.'
            : index === 1
              ? 'dk kd'
              : difficulty === 'vorschule'
                ? 'fj'
                : difficulty === 'streber'
                  ? 'fj jf fj'
                  : line === 1
                    ? 'fj jf'
                    : 'jf fj',
        solved: false,
      })),
    ),
  })),
};
const success: TypingResult = {
  correct: true,
  pointsAwarded: 2,
  wallet: { balance: 10, totalEarned: 10, rewards: [] },
};

beforeEach(() => {
  vi.resetAllMocks();
  vi.mocked(desktop.getTypingState).mockResolvedValue(initial);
  vi.mocked(desktop.submitTyping).mockResolvedValue(success);
  vi.mocked(desktop.setDifficulty).mockImplementation(async (value) => value);
});

it('lässt den Anfangsfokus beim Seitentitel und prüft echte Eingaben erst bewusst per Enter', async () => {
  const user = userEvent.setup();
  render(
    <>
      <h1 tabIndex={-1}>Tastschreiben</h1>
      <TypingPanel profileVersion={0} />
    </>,
  );
  const title = screen.getByRole('heading', { name: 'Tastschreiben' });
  title.focus();
  const field = await screen.findByLabelText('Deine Zeile');
  expect(title).toHaveFocus();
  expect(
    within(screen.getByRole('combobox', { name: 'Kurs wählen' })).getAllByRole(
      'option',
    ),
  ).toHaveLength(12);
  await user.type(field, 'fj x');
  expect(screen.getByText(/Schau bei Zeichen 4/)).toBeVisible();
  expect(desktop.submitTyping).not.toHaveBeenCalled();
  await user.type(field, '{Backspace}jf{Enter}');
  expect(
    await screen.findByRole('heading', { name: 'Geschafft! +2 Punkte' }),
  ).toHaveFocus();
  expect(desktop.submitTyping).toHaveBeenCalledWith({
    requestId: expect.any(String),
    taskId: 'station-0.koenner.1',
    answer: 'fj jf',
  });
  expect(screen.getByLabelText('Verfügbare Lernpunkte')).toHaveTextContent(
    '10 Punkte',
  );
  expect(screen.getByRole('combobox', { name: 'Kurs wählen' })).toHaveValue(
    'station-0',
  );
  expect(
    screen.getByRole('option', { name: 'S01: Funkkontakt · 1 / 3' }),
  ).toBeInTheDocument();
  await user.click(screen.getByRole('button', { name: 'Weiter' }));
  expect(field).toHaveFocus();
  expect(field).toHaveValue('');
  expect(screen.getByRole('button', { name: 'Zeile 2' })).toHaveAttribute(
    'aria-pressed',
    'true',
  );
});

it('bietet alle Sektoren und Zeilen frei an und nutzt die bestätigten Wiederholungspunkte', async () => {
  const user = userEvent.setup();
  render(<TypingPanel profileVersion={0} />);
  const field = await screen.findByLabelText('Deine Zeile');
  await user.selectOptions(
    screen.getByRole('combobox', { name: 'Kurs wählen' }),
    'station-11',
  );
  expect(field).toHaveFocus();
  await user.click(
    screen.getByRole('button', { name: 'Tastaturhilfe einblenden' }),
  );
  await user.type(field, 'Äußerer Orbit.');
  expect(
    screen.getByText(
      'Alle Zeichen sind da. Prüfe deine Zeile, wenn du bereit bist.',
    ),
  ).toBeVisible();
  await user.type(field, '{Enter}');
  await screen.findByRole('heading', { name: 'Geschafft! +2 Punkte' });
  expect(
    screen.getByText(
      'Diese Zeile ist geschafft. Wähle die nächste Zeile oder übe sie noch einmal.',
    ),
  ).toBeVisible();
  expect(
    screen.queryByText(
      'Alle Zeichen sind da. Prüfe deine Zeile, wenn du bereit bist.',
    ),
  ).not.toBeInTheDocument();
  await user.click(screen.getByRole('button', { name: 'Noch einmal üben' }));
  expect(field).toHaveFocus();
  expect(field).toHaveValue('');
  vi.mocked(desktop.submitTyping).mockResolvedValue({
    ...success,
    pointsAwarded: 0,
  });
  await user.type(field, 'Äußerer Orbit.{Enter}');
  expect(
    await screen.findByRole('heading', { name: 'Geschafft! Gut wiederholt.' }),
  ).toBeVisible();
  expect(
    screen.getByText(
      'Diese Zeile hast du schon geschafft. Du kannst weiterüben oder eine neue Zeile wählen.',
    ),
  ).toBeVisible();
  expect(
    screen.queryByText(
      'Zeile bestätigt. Dein Missionsfortschritt ist gespeichert. Du kannst mit der nächsten Zeile weitermachen.',
    ),
  ).not.toBeInTheDocument();
  expect(
    screen.getByText(
      'Diese Zeile ist geschafft. Wähle die nächste Zeile oder übe sie noch einmal.',
    ),
  ).toBeVisible();
  const requests = vi.mocked(desktop.submitTyping).mock.calls;
  expect(requests[0][0].taskId).toBe(requests[1][0].taskId);
  expect(requests[0][0].requestId).not.toBe(requests[1][0].requestId);
  expect(screen.getByRole('combobox', { name: 'Kurs wählen' })).toHaveValue(
    'station-11',
  );
  expect(
    screen.getByRole('option', { name: 'S12: Logbuch · 1 / 3' }),
  ).toBeInTheDocument();
});

it('erklärt Starttasten und zeigt QWERTZ, Leerzeichen sowie gegenüberliegendes Shift', async () => {
  const user = userEvent.setup();
  render(<TypingPanel profileVersion={0} />);
  const field = await screen.findByLabelText('Deine Zeile');
  await user.click(screen.getByRole('button', { name: 'Hilfe' }));
  const dialog = screen.getByRole('dialog', { name: 'Hilfe' });
  expect(
    within(dialog).getByText(/Fühle die kleinen Erhebungen auf F und J/),
  ).toBeVisible();
  await user.click(within(dialog).getByRole('button', { name: 'Schließen' }));
  await user.click(
    screen.getByRole('button', { name: 'Tastaturhilfe einblenden' }),
  );
  const keyboard = screen.getByRole('region', {
    name: 'Deutsche QWERTZ-Tastatur als Hilfe',
  });
  expect(keyboard).toHaveAttribute('tabindex', '0');
  expect(within(keyboard).getByText('ß')).toBeVisible();
  expect(within(keyboard).queryByRole('button')).not.toBeInTheDocument();
  expect(
    screen.getByText(/linker Zeigefinger/, { selector: '.typing-key-hint' }),
  ).toBeVisible();
  await user.type(field, 'fj');
  expect(
    screen.getByText(/ein Daumen/, { selector: '.typing-key-hint' }),
  ).toBeVisible();
  await user.selectOptions(
    screen.getByRole('combobox', { name: 'Kurs wählen' }),
    'station-11',
  );
  await user.click(screen.getByRole('button', { name: 'Wechseln' }));
  expect(
    screen.getByText(/rechte[r]? kleine[r]? Finger/, {
      selector: '.typing-key-hint',
    }),
  ).toBeVisible();
  expect(screen.getByText(/linke Umschalttaste/)).toBeVisible();
});

it('blendet die Hände gemeinsam mit der Tastatur ein und hält sie bei zusätzlichen oder vollständigen Zeichen neutral', async () => {
  const user = userEvent.setup();
  const { container } = render(<TypingPanel profileVersion={0} />);
  const field = await screen.findByLabelText('Deine Zeile');
  expect(screen.queryByText('So liegen deine Hände')).not.toBeInTheDocument();
  await user.click(
    screen.getByRole('button', { name: 'Tastaturhilfe einblenden' }),
  );
  expect(screen.getByText('So liegen deine Hände')).toBeVisible();
  expect(container.querySelector('[data-finger="left-index"]')).toHaveAttribute(
    'data-status',
    'active',
  );
  fireEvent.change(field, { target: { value: 'fj' } });
  expect(container.querySelectorAll('[data-status="choice"]')).toHaveLength(2);
  fireEvent.change(field, { target: { value: 'fj jfx' } });
  expect(container.querySelectorAll('[data-status="rest"]')).toHaveLength(10);
  expect(screen.getByText(/Nächste Taste: Rücktaste/)).toBeVisible();
  const keyboard = screen.getByRole('region', {
    name: 'Deutsche QWERTZ-Tastatur als Hilfe',
  });
  expect(within(keyboard).getByText('⌫')).toHaveClass('highlighted');
  fireEvent.change(field, { target: { value: 'fj jf' } });
  expect(container.querySelectorAll('[data-status="rest"]')).toHaveLength(10);
  expect(keyboard.querySelector('.highlighted')).not.toBeInTheDocument();
  await user.click(screen.getByRole('button', { name: 'Prüfen' }));
  await screen.findByRole('heading', { name: 'Geschafft! +2 Punkte' });
  expect(container.querySelectorAll('[data-status="rest"]')).toHaveLength(10);
  await user.click(screen.getByRole('button', { name: 'Noch einmal üben' }));
  expect(container.querySelector('[data-finger="left-index"]')).toHaveAttribute(
    'data-status',
    'active',
  );
  fireEvent.change(field, { target: { value: 'x' } });
  expect(
    screen.getByText(/Zum Verbessern: linker Zeigefinger/, {
      selector: '.typing-hand-activity',
    }),
  ).toBeVisible();
  await user.click(
    screen.getByRole('button', { name: 'Tastaturhilfe ausblenden' }),
  );
  expect(screen.queryByText('So liegen deine Hände')).not.toBeInTheDocument();
  expect(
    screen.queryByRole('region', {
      name: 'Deutsche QWERTZ-Tastatur als Hilfe',
    }),
  ).not.toBeInTheDocument();
  expect(field).toHaveValue('x');
});

it('wartet auf die Desktop-Prüfung und lässt eine falsche Zeile ohne Punkte korrigieren', async () => {
  const user = userEvent.setup();
  let resolve!: (value: TypingResult) => void;
  vi.mocked(desktop.submitTyping).mockImplementationOnce(
    () =>
      new Promise((done) => {
        resolve = done;
      }),
  );
  render(<TypingPanel profileVersion={0} />);
  const field = await screen.findByLabelText('Deine Zeile');
  await user.type(field, 'fj jf{Enter}');
  expect(screen.queryByText(/Geschafft!/)).not.toBeInTheDocument();
  expect(
    screen.getByRole('img', {
      name: 'Bereit zum Start · 0 von 3 Zeilen bestätigt',
    }),
  ).toBeVisible();
  expect(field).toBeDisabled();
  await act(async () =>
    resolve({ correct: false, pointsAwarded: 0, wallet: initial.wallet }),
  );
  expect(
    await screen.findByRole('heading', {
      name: 'Fast! Du kannst die Zeile noch verbessern.',
    }),
  ).toHaveFocus();
  expect(field).toBeEnabled();
  expect(
    screen.getByRole('img', {
      name: 'Bereit zum Start · 0 von 3 Zeilen bestätigt',
    }),
  ).toBeVisible();
  expect(screen.getByRole('combobox', { name: 'Kurs wählen' })).toHaveValue(
    'station-0',
  );
  expect(
    screen.getByRole('option', { name: 'S01: Funkkontakt · 0 / 3' }),
  ).toBeInTheDocument();
  await user.clear(field);
  await user.type(field, 'fj jf{Enter}');
  await screen.findByRole('heading', { name: 'Geschafft! +2 Punkte' });
});

it('zeigt die drei Orbitabschnitte erst nach bestätigten Lösungen und erhält sie beim Wiederholen', async () => {
  const user = userEvent.setup();
  render(<TypingPanel profileVersion={0} />);
  const field = await screen.findByLabelText('Deine Zeile');
  await user.type(field, 'fj jf');
  expect(
    screen.getByRole('img', {
      name: 'Bereit zum Start · 0 von 3 Zeilen bestätigt',
    }),
  ).toBeVisible();
  await user.type(field, '{Enter}');
  expect(
    await screen.findByRole('img', {
      name: 'Signal empfangen · 1 von 3 Zeilen bestätigt',
    }),
  ).toBeVisible();
  await user.click(screen.getByRole('button', { name: 'Weiter' }));
  await user.type(field, 'jf fj{Enter}');
  expect(
    await screen.findByRole('img', {
      name: 'Kurs bestätigt · 2 von 3 Zeilen bestätigt',
    }),
  ).toBeVisible();
  await user.click(screen.getByRole('button', { name: 'Weiter' }));
  await user.type(field, 'jf fj{Enter}');
  expect(
    await screen.findByRole('img', {
      name: 'Sektor erkundet · 3 von 3 Zeilen bestätigt',
    }),
  ).toBeVisible();
  expect(screen.getByRole('combobox', { name: 'Kurs wählen' })).toHaveValue(
    'station-0',
  );
  expect(
    screen.getByRole('option', { name: 'S01: Funkkontakt · 3 / 3' }),
  ).toBeInTheDocument();
  expect(screen.getByText(/Sektor erkundet: Alle drei Zeilen/)).toBeVisible();
  vi.mocked(desktop.submitTyping).mockResolvedValue({
    ...success,
    pointsAwarded: 0,
  });
  await user.click(screen.getByRole('button', { name: 'Noch einmal üben' }));
  await user.type(field, 'jf fj{Enter}');
  await screen.findByRole('heading', {
    name: 'Geschafft! Gut wiederholt.',
  });
  expect(
    screen.getByRole('img', {
      name: 'Sektor erkundet · 3 von 3 Zeilen bestätigt',
    }),
  ).toBeVisible();
});

it('sperrt doppelte Übertragung und hält bei Speicherfehler dieselbe UUID und Antwort für Retry', async () => {
  const user = userEvent.setup();
  vi.mocked(desktop.submitTyping)
    .mockRejectedValueOnce(new Error('Speicherfehler'))
    .mockResolvedValueOnce(success);
  render(<TypingPanel profileVersion={0} />);
  const field = await screen.findByLabelText('Deine Zeile');
  await user.type(field, 'fj jf');
  const button = screen.getByRole('button', { name: 'Prüfen' });
  fireEvent.click(button);
  fireEvent.click(button);
  expect(await screen.findByRole('alert')).toHaveTextContent('Speicherfehler');
  expect(desktop.submitTyping).toHaveBeenCalledTimes(1);
  expect(field).toHaveValue('fj jf');
  expect(field).toBeDisabled();
  expect(screen.getByRole('button', { name: 'Vorschule' })).toBeDisabled();
  expect(screen.getByRole('combobox', { name: 'Kurs wählen' })).toBeDisabled();
  expect(screen.queryByText(/Geschafft!/)).not.toBeInTheDocument();
  await user.click(screen.getByRole('button', { name: 'Erneut versuchen' }));
  expect(
    await screen.findByRole('heading', { name: 'Geschafft! +2 Punkte' }),
  ).toHaveFocus();
  expect(vi.mocked(desktop.submitTyping).mock.calls[0]).toEqual(
    vi.mocked(desktop.submitTyping).mock.calls[1],
  );
});

it('stellt beim Stufenwechsel die passenden Zeilen bereit und erhält Eingaben bei einem Fehler', async () => {
  const user = userEvent.setup();
  render(<TypingPanel profileVersion={0} />);
  const field = await screen.findByLabelText('Deine Zeile');
  await user.type(field, 'fj');
  vi.mocked(desktop.setDifficulty).mockRejectedValueOnce(
    new Error('Stufe nicht gespeichert'),
  );
  await user.click(screen.getByRole('button', { name: 'Vorschule' }));
  expect(await screen.findByRole('alert')).toHaveTextContent(
    'Stufe nicht gespeichert',
  );
  expect(field).toHaveValue('fj');
  expect(screen.getByRole('button', { name: 'Könner' })).toHaveAttribute(
    'aria-pressed',
    'true',
  );
  vi.mocked(desktop.getTypingState).mockResolvedValue({
    ...initial,
    difficulty: 'vorschule',
  });
  await user.click(screen.getByRole('button', { name: 'Erneut versuchen' }));
  expect(field).toHaveFocus();
  expect(field).toHaveValue('');
  expect(screen.getByRole('button', { name: 'Vorschule' })).toHaveAttribute(
    'aria-pressed',
    'true',
  );
  expect(screen.getByText('Neue Zeile: +1 Punkt')).toBeVisible();
  expect(desktop.setDifficulty).toHaveBeenNthCalledWith(1, 'vorschule');
  expect(desktop.setDifficulty).toHaveBeenNthCalledWith(2, 'vorschule');
  await user.type(field, 'fj{Enter}');
  expect(desktop.submitTyping).toHaveBeenLastCalledWith(
    expect.objectContaining({ taskId: 'station-0.vorschule.1' }),
  );
});

it('holt nach Ladefehlern den bestätigten Stand und lädt nach einem gespeicherten Profil erneut', async () => {
  const user = userEvent.setup();
  vi.mocked(desktop.getTypingState).mockRejectedValueOnce(
    new Error('Bitte öffne die Lernwelt-Desktop-App.'),
  );
  const { rerender } = render(<TypingPanel profileVersion={0} />);
  expect(await screen.findByRole('alert')).toHaveTextContent('Desktop-App');
  expect(screen.queryByLabelText('Deine Zeile')).not.toBeInTheDocument();
  vi.mocked(desktop.getTypingState).mockResolvedValueOnce({
    ...initial,
    profileReady: false,
  });
  await user.click(screen.getByRole('button', { name: 'Erneut laden' }));
  expect(await screen.findByText(/Speichere dein Lernprofil/)).toBeVisible();
  expect(screen.queryByLabelText('Deine Zeile')).not.toBeInTheDocument();
  rerender(<TypingPanel profileVersion={1} />);
  expect(await screen.findByLabelText('Deine Zeile')).toBeVisible();
  expect(desktop.getTypingState).toHaveBeenCalledTimes(3);
});

it('ignoriert veraltete Lade- und Speicherantworten nach Profiländerung und Unmount', async () => {
  const user = userEvent.setup();
  let load!: (value: TypingState) => void;
  let save!: (value: TypingResult) => void;
  vi.mocked(desktop.getTypingState).mockImplementationOnce(
    () =>
      new Promise((done) => {
        load = done;
      }),
  );
  const { rerender, unmount } = render(<TypingPanel profileVersion={0} />);
  rerender(<TypingPanel profileVersion={1} />);
  const field = await screen.findByLabelText('Deine Zeile');
  await act(async () => load({ ...initial, profileReady: false }));
  expect(field).toBeVisible();
  vi.mocked(desktop.submitTyping).mockImplementationOnce(
    () =>
      new Promise((done) => {
        save = done;
      }),
  );
  await user.type(field, 'fj jf{Enter}');
  vi.mocked(desktop.getTypingState).mockResolvedValueOnce({
    ...initial,
    profileReady: false,
  });
  rerender(<TypingPanel profileVersion={2} />);
  await screen.findByText(/Speichere dein Lernprofil/);
  await act(async () => save(success));
  expect(screen.queryByText(/Geschafft!/)).not.toBeInTheDocument();
  expect(screen.getByLabelText('Verfügbare Lernpunkte')).toHaveTextContent(
    '8 Punkte',
  );
  unmount();
});

it('erklärt Einfügen und Ziehen und stört die Texteingabe per IME nicht', async () => {
  const user = userEvent.setup();
  render(<TypingPanel profileVersion={0} />);
  const field = await screen.findByLabelText('Deine Zeile');
  field.focus();
  await user.paste('fj jf');
  expect(field).toHaveValue('');
  expect(screen.getByRole('status')).toHaveTextContent(
    'damit deine Finger die Tasten kennenlernen',
  );
  fireEvent.drop(field, { dataTransfer: { getData: () => 'fj jf' } });
  expect(field).toHaveValue('');
  fireEvent.compositionStart(field);
  fireEvent.change(field, { target: { value: 'fj jf' } });
  fireEvent.submit(field.closest('form')!);
  expect(desktop.submitTyping).not.toHaveBeenCalled();
  fireEvent.compositionEnd(field);
  await user.type(field, '{Enter}');
  expect(
    await screen.findByRole('heading', { name: 'Geschafft! +2 Punkte' }),
  ).toBeVisible();
});

it('lässt überlange und unsichtbare Zeichen ohne Speicheranfrage verbessern', async () => {
  const user = userEvent.setup();
  render(<TypingPanel profileVersion={0} />);
  const field = await screen.findByLabelText('Deine Zeile');
  expect(field).toHaveAttribute('maxlength', '120');
  fireEvent.change(field, { target: { value: 'f'.repeat(121) } });
  await user.click(screen.getByRole('button', { name: 'Prüfen' }));
  expect(screen.getByRole('status')).toHaveTextContent('höchstens 120 Zeichen');
  expect(field).toBeEnabled();
  expect(field).toHaveFocus();
  expect(screen.getByRole('button', { name: 'Vorschule' })).toBeEnabled();
  expect(desktop.submitTyping).not.toHaveBeenCalled();
  fireEvent.change(field, { target: { value: 'fj\tjf' } });
  expect(screen.queryByRole('status')).not.toBeInTheDocument();
  await user.click(screen.getByRole('button', { name: 'Prüfen' }));
  expect(screen.getByRole('status')).toHaveTextContent('unsichtbare Zeichen');
  expect(field).toBeEnabled();
  expect(desktop.submitTyping).not.toHaveBeenCalled();
  fireEvent.change(field, { target: { value: 'fj jf' } });
  expect(screen.queryByRole('status')).not.toBeInTheDocument();
  await user.type(field, '{Enter}');
  expect(
    await screen.findByRole('heading', { name: 'Geschafft! +2 Punkte' }),
  ).toBeVisible();
});

it('unterdrückt das WebKit-Enter zur IME-Bestätigung auch nach compositionEnd', async () => {
  const user = userEvent.setup();
  render(<TypingPanel profileVersion={0} />);
  const field = await screen.findByLabelText('Deine Zeile');
  fireEvent.compositionStart(field);
  fireEvent.change(field, { target: { value: 'fj jf' } });
  fireEvent.compositionEnd(field);
  expect(
    fireEvent.keyDown(field, {
      key: 'Enter',
      code: 'Enter',
      keyCode: 229,
      isComposing: false,
    }),
  ).toBe(false);
  expect(desktop.submitTyping).not.toHaveBeenCalled();
  expect(field).toBeEnabled();
  await user.type(field, '{Enter}');
  expect(
    await screen.findByRole('heading', { name: 'Geschafft! +2 Punkte' }),
  ).toBeVisible();
});

it('hält die eingeblendete Hilfe bei allen zwölf Kurswechseln bereit und fokussiert die passende Eingabe', async () => {
  const user = userEvent.setup();
  render(<TypingPanel profileVersion={0} />);
  const field = await screen.findByLabelText('Deine Zeile');
  const picker = screen.getByRole('combobox', { name: 'Kurs wählen' });
  await user.click(
    screen.getByRole('button', { name: 'Tastaturhilfe einblenden' }),
  );
  for (const station of initial.stations) {
    await user.type(field, 'x');
    await user.selectOptions(picker, station.id);
    await user.click(screen.getByRole('button', { name: 'Wechseln' }));
    expect(picker).toHaveValue(station.id);
    expect(screen.getByRole('heading', { name: station.title })).toBeVisible();
    expect(field).toHaveFocus();
    expect(field).toHaveValue('');
    expect(
      screen.getByRole('region', {
        name: 'Deutsche QWERTZ-Tastatur als Hilfe',
      }),
    ).toBeVisible();
    expect(
      screen.getByRole('img', { name: /Grundstellung der Hände/ }),
    ).toBeVisible();
    expect(screen.getByRole('button', { name: 'Prüfen' })).toBeVisible();
    expect(
      screen.getByRole('button', { name: 'Tastaturhilfe ausblenden' }),
    ).toHaveAttribute('aria-pressed', 'true');
  }
  expect(desktop.submitTyping).not.toHaveBeenCalled();
  expect(desktop.setDifficulty).not.toHaveBeenCalled();
});

it('meldet Entwurf und Übertragung an die Fachnavigation und bewahrt die Zeile beim Abbrechen eines Kurswechsels', async () => {
  const user = userEvent.setup();
  const activity = vi.fn();
  let finish!: (value: TypingResult) => void;
  vi.mocked(desktop.submitTyping).mockImplementation(
    () =>
      new Promise((resolve) => {
        finish = resolve;
      }),
  );
  render(
    <TypingPanel
      profileVersion={0}
      externalControls
      onActivityChange={activity}
    />,
  );
  const field = await screen.findByLabelText('Deine Zeile');
  expect(field).toHaveFocus();
  expect(
    screen.queryByRole('group', { name: 'Schwierigkeitsgrad für alle Fächer' }),
  ).not.toBeInTheDocument();
  await user.type(field, 'fj');
  expect(activity).toHaveBeenLastCalledWith({ dirty: true, busy: false });
  const picker = screen.getByRole('combobox', { name: 'Kurs wählen' });
  await user.selectOptions(picker, 'station-1');
  expect(screen.getByRole('button', { name: 'Bleiben' })).toHaveFocus();
  await user.keyboard('{Escape}');
  expect(screen.queryByRole('dialog')).not.toBeInTheDocument();
  expect(picker).toHaveFocus();
  expect(picker).toHaveValue('station-0');
  expect(field).toHaveValue('fj');
  await user.type(field, ' jf{Enter}');
  expect(activity).toHaveBeenLastCalledWith({ dirty: true, busy: true });
  await act(async () => finish(success));
  expect(activity).toHaveBeenLastCalledWith({ dirty: false, busy: false });
});

it('hält andere Fächer erreichbar, solange nur die Modul-Daten geladen werden', () => {
  vi.mocked(desktop.getTypingState).mockImplementation(
    () => new Promise(() => {}),
  );
  const activity = vi.fn();
  render(
    <TypingPanel
      profileVersion={0}
      externalControls
      onActivityChange={activity}
    />,
  );
  expect(activity).toHaveBeenLastCalledWith({ dirty: false, busy: false });
});
