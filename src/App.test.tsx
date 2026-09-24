import { act, render, screen, waitFor, within } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { beforeEach, describe, expect, it, vi } from 'vitest';
import App from './App';
import { desktop } from './lib/desktop';
import type { LearnerProfile } from './domain/learner';
vi.mock('./components/GamePreview', () => ({ default: () => null }));

import { vocabularyInitial } from './test/vocabulary-fixture';
import { multiplicationInitial } from './test/multiplication-fixture';
import { initial } from './test/learning-fixture';
import {
  missionInitial,
  missionActive,
  missionAt,
  missionCorrect,
} from './test/mission-fixture';

vi.mock('./lib/desktop', () => ({
  desktop: {
    getProfile: vi.fn(),
    saveProfile: vi.fn(),
    getLearningState: vi.fn(),
    getArcadeState: vi.fn(),
    getVocabularyState: vi.fn(),
    getMultiplicationState: vi.fn(),
    getMissionState: vi.fn(),
    startMission: vi.fn(),
    actMission: vi.fn(),
  },
}));

beforeEach(() => {
  vi.resetAllMocks();
  vi.mocked(desktop.getProfile).mockResolvedValue(null);
  vi.mocked(desktop.getMissionState).mockResolvedValue(missionInitial);
  vi.mocked(desktop.getLearningState).mockResolvedValue({
    ...initial,
    profileReady: false,
  });
});

describe('Lernwelt', () => {
  it('wechselt das Fach und zeigt den tatsächlichen Ausbaustand', async () => {
    const user = userEvent.setup();
    render(<App />);
    await user.click(screen.getByRole('button', { name: 'Englisch' }));
    expect(
      await screen.findByRole('heading', { name: 'Englisch · Klasse 5' }),
    ).toBeVisible();
    expect(
      screen.getByRole('heading', { name: 'Englisch', level: 1 }),
    ).toHaveFocus();
    expect(screen.getByText(/12 Themen zum Entdecken/)).toBeVisible();
    await user.click(
      screen.getByText('Für Neugierige & Erwachsene: Englisch-Lerninhalte'),
    );
    expect(screen.getByText(/automatische Aussprachebewertung/)).toBeVisible();
  });

  it('lädt ein älteres Profil ohne die gespeicherte Klasse automatisch zu ändern', async () => {
    vi.mocked(desktop.getProfile).mockResolvedValue({
      displayName: 'Alex',
      grade: 8,
    });
    render(<App />);
    await userEvent.click(screen.getByRole('button', { name: 'Dein Profil' }));
    expect(await screen.findByDisplayValue('Alex')).toBeVisible();
    expect(screen.getByLabelText('Jahrgangsstufe')).toHaveValue('5');
    expect(screen.getByText(/noch Klasse 8 gespeichert/)).toBeVisible();
    expect(desktop.saveProfile).not.toHaveBeenCalled();
  });

  it('speichert Name und die einzige angebotene Klasse 5 und bestätigt erst den Erfolg', async () => {
    const user = userEvent.setup();
    vi.mocked(desktop.saveProfile).mockResolvedValue({
      displayName: 'Alex',
      grade: 5,
    });
    render(<App />);
    await userEvent.click(screen.getByRole('button', { name: 'Dein Profil' }));
    await waitFor(() =>
      expect(screen.getByLabelText('Name oder Spitzname')).toBeEnabled(),
    );
    await user.type(screen.getByLabelText('Name oder Spitzname'), 'Alex');
    expect(
      within(screen.getByLabelText('Jahrgangsstufe')).getAllByRole('option'),
    ).toHaveLength(1);
    expect(screen.getByLabelText('Jahrgangsstufe')).toHaveValue('5');
    await user.click(screen.getByRole('button', { name: 'Profil speichern' }));
    expect(desktop.saveProfile).toHaveBeenCalledWith({
      displayName: 'Alex',
      grade: 5,
    });
    expect(
      await within(
        screen.getByRole('region', { name: 'Dein Lernprofil' }),
      ).findByRole('status'),
    ).toHaveTextContent('gespeichert');
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
    await userEvent.click(screen.getByRole('button', { name: 'Dein Profil' }));
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
    await userEvent.click(screen.getByRole('button', { name: 'Dein Profil' }));
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
    await userEvent.click(screen.getByRole('button', { name: 'Dein Profil' }));
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
    expect(
      await within(
        screen.getByRole('region', { name: 'Dein Lernprofil' }),
      ).findByRole('status'),
    ).toHaveTextContent('gespeichert');
    expect(screen.queryByRole('alert')).not.toBeInTheDocument();
  });
});

it('lädt beim Rückweg aus der Spielhalle das gemeinsame Lernpunktekonto neu', async () => {
  const user = userEvent.setup();
  vi.mocked(desktop.getLearningState)
    .mockResolvedValueOnce({
      ...initial,
      wallet: { ...initial.wallet, balance: 20 },
    })
    .mockResolvedValueOnce({
      ...initial,
      wallet: { ...initial.wallet, balance: 10 },
    });
  vi.mocked(desktop.getArcadeState).mockResolvedValue({
    profileReady: true,
    entryCost: 10,
    wallet: { ...initial.wallet, balance: 10 },
    activeSession: null,
    bestScores: [],
  });
  render(<App />);
  await user.click(screen.getByRole('button', { name: 'Mathematik' }));
  expect(await screen.findByText('20 Punkte')).toBeVisible();
  await user.click(screen.getByRole('button', { name: 'Spielhalle' }));
  expect(
    await screen.findByText('10 Lernpunkte', { selector: '.arcade-balance' }),
  ).toBeVisible();
  await user.click(screen.getByRole('button', { name: 'Meine Fächer' }));
  await user.click(screen.getByRole('button', { name: 'Mathematik' }));
  expect(await screen.findByText('10 Punkte')).toBeVisible();
  expect(desktop.getLearningState).toHaveBeenCalledTimes(2);
});

it('öffnet den separaten Vokabeltrainer und lädt beim Rückweg die gemeinsame Stufe neu', async () => {
  const user = userEvent.setup();
  vi.mocked(desktop.getVocabularyState).mockResolvedValue(vocabularyInitial);
  render(<App />);
  await user.click(screen.getByRole('button', { name: 'Mathematik' }));
  await screen.findByText('Wie möchtest du heute üben?');
  await user.click(screen.getByRole('button', { name: 'Vokabeltrainer' }));
  expect(
    await screen.findByRole('button', { name: 'Antwort prüfen' }),
  ).toBeVisible();
  vi.mocked(desktop.getLearningState).mockResolvedValue({
    ...initial,
    difficulty: 'streber',
  });
  await user.click(screen.getByRole('button', { name: 'Meine Fächer' }));
  await user.click(screen.getByRole('button', { name: 'Mathematik' }));
  expect(
    await screen.findByRole('button', { name: /Streber/ }),
  ).toHaveAttribute('aria-pressed', 'true');
  expect(desktop.getLearningState).toHaveBeenCalledTimes(2);
});

it('öffnet den Einmaleins-Trainer neben dem Vokabeltrainer und lädt danach das Guthaben neu', async () => {
  const user = userEvent.setup();
  vi.mocked(desktop.getMultiplicationState).mockResolvedValue(
    multiplicationInitial,
  );
  render(<App />);
  await user.click(screen.getByRole('button', { name: 'Mathematik' }));
  await screen.findByText('Wie möchtest du heute üben?');
  await user.click(screen.getByRole('button', { name: 'Einmaleins-Trainer' }));
  expect(
    await screen.findByRole('heading', { name: '2 × 8 = ?' }),
  ).toBeVisible();
  vi.mocked(desktop.getLearningState).mockResolvedValue({
    ...initial,
    wallet: { ...initial.wallet, balance: 11 },
  });
  await user.click(screen.getByRole('button', { name: 'Meine Fächer' }));
  await user.click(screen.getByRole('button', { name: 'Mathematik' }));
  expect(await screen.findByLabelText('Verfügbare Punkte')).toHaveTextContent(
    '11 Punkte',
  );
  expect(desktop.getLearningState).toHaveBeenCalledTimes(2);
});

it('führt durch Fächersuche, Fachwechsel und zurück zur Auswahl mit Tastaturfokus', async () => {
  const user = userEvent.setup();
  render(<App />);
  expect(screen.getByRole('button', { name: 'Meine Fächer' })).toHaveAttribute(
    'aria-current',
    'page',
  );
  expect(desktop.getLearningState).not.toHaveBeenCalled();
  await user.type(
    screen.getByRole('searchbox', { name: 'Fach suchen' }),
    'engl',
  );
  await user.click(screen.getByRole('button', { name: 'Englisch' }));
  expect(
    await screen.findByRole('heading', { name: 'Englisch · Klasse 5' }),
  ).toBeVisible();
  expect(
    screen.getByRole('heading', { name: 'Englisch', level: 1 }),
  ).toHaveFocus();
  await user.click(screen.getByRole('button', { name: '← Alle Fächer' }));
  expect(screen.getByRole('heading', { level: 1 })).toHaveFocus();
  expect(screen.getByRole('button', { name: 'Englisch' })).toHaveAttribute(
    'aria-pressed',
    'true',
  );
  await user.click(screen.getByRole('button', { name: 'Mathematik' }));
  expect(
    await screen.findByRole('heading', { name: 'Mathematik · Klasse 5' }),
  ).toBeVisible();
});

it('schließt das kompakte Menü mit Escape und nach einer Bereichswahl', async () => {
  const user = userEvent.setup();
  vi.mocked(desktop.getVocabularyState).mockResolvedValue(vocabularyInitial);
  render(<App />);
  await user.click(screen.getByRole('button', { name: 'Menü öffnen' }));
  expect(
    screen.getByRole('button', { name: 'Menü schließen' }),
  ).toHaveAttribute('aria-expanded', 'true');
  await user.keyboard('{Escape}');
  expect(screen.getByRole('button', { name: 'Menü öffnen' })).toHaveFocus();
  await user.click(screen.getByRole('button', { name: 'Menü öffnen' }));
  screen.getByRole('button', { name: 'Meine Fächer' }).focus();
  await user.keyboard('{Escape}');
  expect(screen.getByRole('button', { name: 'Menü öffnen' })).toHaveFocus();
  await user.click(screen.getByRole('button', { name: 'Menü öffnen' }));
  await user.click(screen.getByRole('button', { name: 'Vokabeltrainer' }));
  expect(screen.getByRole('button', { name: 'Menü öffnen' })).toHaveAttribute(
    'aria-expanded',
    'false',
  );
  expect(
    screen.getByRole('heading', { name: 'Vokabeltrainer', level: 1 }),
  ).toHaveFocus();
  expect(
    await screen.findByRole('button', { name: 'Antwort prüfen' }),
  ).toBeVisible();
});

it('startet die Lernrunde, setzt bestätigte Rückmeldung nach Navigation fort und lädt Lernpunkte neu', async () => {
  const user = userEvent.setup();
  vi.mocked(desktop.startMission).mockImplementation(async () => {
    vi.mocked(desktop.getMissionState).mockResolvedValue(missionActive);
    return missionActive;
  });
  const answered = missionAt(0, missionCorrect);
  vi.mocked(desktop.actMission).mockImplementation(async () => {
    vi.mocked(desktop.getMissionState).mockResolvedValue(answered);
    return answered;
  });
  render(<App />);
  await user.click(
    await screen.findByRole('button', { name: 'Lernrunde starten' }),
  );
  expect(
    await screen.findByRole('heading', { name: 'Deine Lernrunde', level: 1 }),
  ).toHaveFocus();
  expect(desktop.startMission).toHaveBeenCalledTimes(1);
  await user.type(await screen.findByLabelText('Deine Antwort in m'), '22');
  await user.keyboard('{Enter}');
  expect(
    await screen.findByRole('heading', { name: 'Das stimmt – gut gelöst!' }),
  ).toHaveFocus();
  await user.click(screen.getByRole('button', { name: '← Alle Fächer' }));
  await user.click(
    await screen.findByRole('button', { name: 'Runde fortsetzen' }),
  );
  expect(
    await screen.findByRole('heading', { name: 'Das stimmt – gut gelöst!' }),
  ).toBeVisible();
  expect(screen.getByRole('heading', { level: 1 })).toHaveFocus();
  expect(desktop.startMission).toHaveBeenCalledTimes(1);
  expect(desktop.actMission).toHaveBeenCalledTimes(1);
  vi.mocked(desktop.getLearningState).mockResolvedValue({
    ...initial,
    wallet: answered.wallet,
  });
  await user.click(screen.getByRole('button', { name: '← Alle Fächer' }));
  await user.click(screen.getByRole('button', { name: 'Mathematik' }));
  expect(await screen.findByLabelText('Verfügbare Punkte')).toHaveTextContent(
    '10 Punkte',
  );
});
