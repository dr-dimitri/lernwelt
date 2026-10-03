import { act, render, screen, waitFor, within } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { beforeEach, expect, it, vi } from 'vitest';
import type { AnswerResult } from '../domain/learning';
import { planets, pluto, solarBodies } from '../domain/solar-system';
import { getPlanetImages } from '../domain/solar-planet-images';
import { desktop } from '../lib/desktop';
import {
  solarAnswerFor,
  solarInitial,
  solarQuestions,
  solarResultFor,
} from '../test/solar-system-fixture';
import SolarSystemWorld from './SolarSystemWorld';

vi.mock('../lib/desktop', () => ({
  desktop: {
    getLearningState: vi.fn(),
    submitAnswer: vi.fn(),
    setDifficulty: vi.fn(),
  },
}));

const questions = solarQuestions.filter(
  (item) => item.difficulty === 'koenner',
);
const firstQuestion = questions[0];
const firstAnswer = solarAnswerFor(firstQuestion);

beforeEach(() => {
  vi.resetAllMocks();
  vi.mocked(desktop.getLearningState).mockResolvedValue(
    structuredClone(solarInitial),
  );
  vi.mocked(desktop.submitAnswer).mockResolvedValue(
    solarResultFor(firstQuestion),
  );
});

async function startQuiz(
  user: ReturnType<typeof userEvent.setup>,
  fromPluto = false,
) {
  render(<SolarSystemWorld profileVersion={0} />);
  await screen.findByRole('button', { name: /Könner/ });
  if (fromPluto) {
    await user.click(
      screen.getByRole('button', { name: 'Pluto · Zwergplanet' }),
    );
    expect(screen.getByRole('article', { name: 'Pluto' })).toBeVisible();
  }
  await user.click(screen.getByRole('button', { name: 'Planeten erraten' }));
  return screen.getByRole('heading', { name: firstQuestion.prompt });
}

it('entdeckt alle acht Steckbriefe mit lokalem NASA-Bild, Fakten und Bildquelle', async () => {
  const user = userEvent.setup();
  render(<SolarSystemWorld profileVersion={0} />);
  await screen.findByRole('button', { name: /Könner/ });
  for (const planet of planets) {
    const picker = screen.getByRole('button', {
      name: `${planet.order} ${planet.name}`,
    });
    await user.click(picker);
    expect(picker).toHaveAttribute('aria-pressed', 'true');
    const card = screen.getByRole('article', { name: planet.name });
    expect(within(card).getByRole('img')).toHaveAttribute('src', planet.image);
    expect(within(card).getByRole('img')).toHaveAccessibleName(planet.imageAlt);
    expect(
      within(card).getByRole('link', { name: 'NASA-Bildquelle' }),
    ).toHaveAttribute('href', planet.imageSource);
    expect(card).toHaveTextContent(planet.imageCredit);
    for (const fact of planet.facts) expect(card).toHaveTextContent(fact);
  }
  expect(desktop.submitAnswer).not.toHaveBeenCalled();
});

it('entdeckt Pluto als Zwergplaneten mit drei Bildern, Großansicht und zurückgesetzter Galerie', async () => {
  const user = userEvent.setup();
  render(<SolarSystemWorld profileVersion={0} />);
  await screen.findByRole('button', { name: /Könner/ });
  const picker = screen.getByRole('button', { name: 'Pluto · Zwergplanet' });
  await user.click(picker);
  expect(picker).toHaveAttribute('aria-pressed', 'true');
  const card = screen.getByRole('article', { name: 'Pluto' });
  expect(within(card).getByText('ZWERGPLANET')).toBeVisible();
  expect(card).not.toHaveTextContent('PLANET 9 VON DER SONNE AUS');
  for (const fact of pluto.facts) expect(card).toHaveTextContent(fact);
  const images = getPlanetImages('pluto');
  expect(images).toHaveLength(3);
  for (const [index, image] of images.entries()) {
    expect(within(card).getByText(`Bild ${index + 1} von 3`)).toBeVisible();
    expect(within(card).getByRole('img')).toHaveAttribute('src', image.src);
    expect(within(card).getByRole('img')).toHaveAccessibleName(image.alt);
    expect(within(card).getByText(image.title)).toBeVisible();
    expect(within(card).getByText(image.caption)).toBeVisible();
    expect(
      within(card).getByRole('link', { name: 'NASA-Bildquelle' }),
    ).toHaveAttribute('href', image.sourcePage);
    expect(card).toHaveTextContent(image.credit);
    if (index < images.length - 1) {
      await user.click(
        within(card).getByRole('button', { name: 'Nächstes Bild' }),
      );
    }
  }
  const trigger = within(card).getByRole('button', { name: 'Bild vergrößern' });
  await user.click(trigger);
  const dialog = screen.getByRole('dialog', { name: 'Pluto: Bild vergrößert' });
  expect(within(dialog).getByRole('img')).toHaveAttribute('src', images[2].src);
  expect(
    within(dialog).getByRole('button', { name: 'Schließen' }),
  ).toHaveFocus();
  await user.click(
    within(dialog).getByRole('button', { name: 'Nächstes Bild' }),
  );
  expect(within(dialog).getByRole('img')).toHaveAttribute('src', pluto.image);
  await user.click(within(dialog).getByRole('button', { name: 'Schließen' }));
  expect(screen.queryByRole('dialog')).not.toBeInTheDocument();
  expect(trigger).toHaveFocus();
  await user.click(within(card).getByRole('button', { name: 'Nächstes Bild' }));
  expect(within(card).getByRole('img')).toHaveAttribute('src', images[1].src);
  await user.click(screen.getByRole('button', { name: '3 Erde' }));
  await user.click(picker);
  const reopened = screen.getByRole('article', { name: 'Pluto' });
  expect(within(reopened).getByText('Bild 1 von 3')).toBeVisible();
  expect(within(reopened).getByRole('img')).toHaveAttribute('src', pluto.image);
  expect(desktop.submitAnswer).not.toHaveBeenCalled();
});

it('beginnt bei jedem Planetenwechsel mit Bild 1 und vergibt beim Erkunden keine Punkte', async () => {
  const user = userEvent.setup();
  render(<SolarSystemWorld profileVersion={0} />);
  await screen.findByRole('button', { name: /Könner/ });
  for (const planet of planets) {
    await user.click(
      screen.getByRole('button', { name: `${planet.order} ${planet.name}` }),
    );
    const card = screen.getByRole('article', { name: planet.name });
    expect(within(card).getByText('Bild 1 von 3')).toBeVisible();
    await user.click(
      within(card).getByRole('button', { name: 'Nächstes Bild' }),
    );
    expect(within(card).getByRole('img')).toHaveAttribute(
      'src',
      getPlanetImages(planet.id)[1].src,
    );
  }
  expect(desktop.submitAnswer).not.toHaveBeenCalled();
});

it('markiert nach Pluto-Auswahl alle acht Rätsel ohne Namensleck oder Pluto als Antwortoption', async () => {
  const user = userEvent.setup();
  await startQuiz(user, true);
  for (let index = 0; index < questions.length; index++) {
    const question = questions[index];
    const answer = solarAnswerFor(question);
    const target = planets.find(
      (item) => item.id === question.solarSystemPlanetId,
    )!;
    const heading = screen.getByRole('heading', { name: question.prompt });
    expect(heading).toHaveFocus();
    expect(heading).not.toHaveTextContent(answer);
    const model = screen.getByRole('img', { name: /Räumliches Sonnensystem/ });
    expect(model).toHaveTextContent('?');
    for (const planet of solarBodies) {
      expect(model).not.toHaveTextContent(planet.name);
      expect(model).not.toHaveAccessibleName(new RegExp(planet.name));
    }
    expect(
      screen.getByRole('img', { name: 'NASA-Aufnahme des gesuchten Planeten' }),
    ).toHaveAttribute('src', target.image);
    expect(screen.getAllByRole('radio')).toHaveLength(8);
    expect(
      screen.queryByRole('radio', { name: /Pluto/ }),
    ).not.toBeInTheDocument();
    expect(
      screen.queryByRole('button', { name: /Pluto/ }),
    ).not.toBeInTheDocument();
    expect(
      screen.queryByRole('article', { name: 'Pluto' }),
    ).not.toBeInTheDocument();
    expect(model.querySelectorAll('image')).toHaveLength(9);
    expect(screen.getByRole('radio', { name: answer })).not.toBeChecked();
    expect(
      screen.queryByRole('button', { name: `${target.order} ${answer}` }),
    ).not.toBeInTheDocument();
    expect(
      screen.getByRole('button', { name: 'Antwort prüfen' }),
    ).toBeDisabled();
    if (index < questions.length - 1) {
      await user.click(
        screen.getByRole('button', { name: 'Nächster Planet →' }),
      );
    }
  }
});

it('ermutigt nach einer falschen Antwort und vergibt Punkte nur nach bestätigtem Erfolg', async () => {
  const user = userEvent.setup();
  vi.mocked(desktop.submitAnswer)
    .mockResolvedValueOnce({
      ...solarResultFor(firstQuestion, false, 10),
      mistakeHint: 'Zähle die Bahnen von innen nach außen.',
    })
    .mockResolvedValueOnce(solarResultFor(firstQuestion));
  await startQuiz(user);
  const wrong = firstQuestion.options.find((option) => option !== firstAnswer)!;
  await user.click(screen.getByRole('radio', { name: wrong }));
  await user.click(screen.getByRole('button', { name: 'Antwort prüfen' }));
  expect(await screen.findByRole('status')).toHaveTextContent(
    'Du kannst es nochmal versuchen!',
  );
  expect(screen.getByLabelText('Verfügbare Punkte')).toHaveTextContent(
    '10 Punkte',
  );
  expect(
    screen.getByText('Zähle die Bahnen von innen nach außen.'),
  ).toBeVisible();
  expect(
    screen.queryByText(solarResultFor(firstQuestion).explanation),
  ).not.toBeInTheDocument();
  await user.click(screen.getByRole('button', { name: 'Lösung verstehen' }));
  expect(
    screen.getByRole('dialog', { name: 'Lösung verstehen' }),
  ).toHaveTextContent(solarResultFor(firstQuestion).explanation);
  await user.click(screen.getByRole('button', { name: 'Schließen' }));
  await user.click(screen.getByRole('radio', { name: firstAnswer }));
  await user.click(screen.getByRole('button', { name: 'Antwort prüfen' }));
  expect(await screen.findByRole('status')).toHaveTextContent(
    'Richtig! +2 Punkte',
  );
  expect(screen.getByLabelText('Verfügbare Punkte')).toHaveTextContent(
    '12 Punkte',
  );
  expect(screen.getByRole('radio', { name: firstAnswer })).toBeChecked();
  expect(screen.getByRole('radio', { name: firstAnswer })).toBeDisabled();
  expect(screen.getByRole('button', { name: 'Antwort prüfen' })).toBeDisabled();
  expect(screen.getByText(/Schon gelöst/)).toBeVisible();
  expect(
    vi.mocked(desktop.submitAnswer).mock.calls.map((call) => call.slice(1)),
  ).toEqual([
    [firstQuestion.id, wrong],
    [firstQuestion.id, firstAnswer],
  ]);
});

it('behält beim Speicherfehler Guthaben und Auswahl und sendet beim Retry denselben Request', async () => {
  const user = userEvent.setup();
  vi.mocked(desktop.submitAnswer)
    .mockRejectedValueOnce(new Error('Speichern fehlgeschlagen'))
    .mockResolvedValueOnce(solarResultFor(firstQuestion));
  await startQuiz(user);
  await user.click(screen.getByRole('radio', { name: firstAnswer }));
  await user.click(screen.getByRole('button', { name: 'Antwort prüfen' }));
  expect(await screen.findByRole('alert')).toHaveTextContent(
    'Speichern fehlgeschlagen',
  );
  expect(screen.getByRole('radio', { name: firstAnswer })).toBeChecked();
  expect(screen.getByLabelText('Verfügbare Punkte')).toHaveTextContent(
    '10 Punkte',
  );
  await user.click(screen.getByRole('button', { name: 'Antwort prüfen' }));
  await screen.findByText('Richtig! +2 Punkte');
  const calls = vi.mocked(desktop.submitAnswer).mock.calls;
  expect(calls[0]).toEqual(calls[1]);
  expect(calls[0][0]).not.toBe('');
});

it('sperrt Antworten, Stufe, Weitergehen und Moduswechsel während der Buchung', async () => {
  const user = userEvent.setup();
  let finish!: (value: AnswerResult) => void;
  vi.mocked(desktop.submitAnswer).mockImplementation(
    () =>
      new Promise((resolve) => {
        finish = resolve;
      }),
  );
  await startQuiz(user);
  await user.click(screen.getByRole('radio', { name: firstAnswer }));
  await user.click(screen.getByRole('button', { name: 'Antwort prüfen' }));
  expect(screen.getByRole('button', { name: 'Wird geprüft …' })).toBeDisabled();
  for (const radio of screen.getAllByRole('radio'))
    expect(radio).toBeDisabled();
  for (const name of [
    /Vorschule/,
    /Könner/,
    /Streber/,
    'Nächster Planet →',
    'Planeten entdecken',
    'Planeten erraten',
  ]) {
    expect(screen.getByRole('button', { name })).toBeDisabled();
  }
  await user.click(screen.getByRole('button', { name: /Vorschule/ }));
  expect(desktop.setDifficulty).not.toHaveBeenCalled();
  await act(async () => {
    finish(solarResultFor(firstQuestion));
  });
  expect(
    screen.getByRole('button', { name: 'Nächster Planet →' }),
  ).toBeEnabled();
});

it('behält Aufgabe und Antwort nach fehlgeschlagenem Stufenwechsel und leert sie nach Erfolg', async () => {
  const user = userEvent.setup();
  vi.mocked(desktop.setDifficulty)
    .mockRejectedValueOnce(new Error('Stufe konnte nicht gespeichert werden'))
    .mockResolvedValueOnce('vorschule');
  await startQuiz(user);
  await user.click(screen.getByRole('radio', { name: firstAnswer }));
  await user.click(screen.getByRole('button', { name: /Vorschule/ }));
  expect(await screen.findByRole('alert')).toHaveTextContent(
    'Stufe konnte nicht gespeichert werden',
  );
  expect(
    screen.getByRole('heading', { name: firstQuestion.prompt }),
  ).toBeVisible();
  expect(screen.getByRole('radio', { name: firstAnswer })).toBeChecked();
  expect(screen.getByRole('button', { name: /Könner/ })).toHaveAttribute(
    'aria-pressed',
    'true',
  );
  await user.click(screen.getByRole('button', { name: /Vorschule/ }));
  const easier = solarQuestions.find(
    (item) => item.difficulty === 'vorschule',
  )!;
  expect(
    await screen.findByRole('heading', { name: easier.prompt }),
  ).toHaveFocus();
  expect(screen.getByRole('button', { name: /Vorschule/ })).toHaveAttribute(
    'aria-pressed',
    'true',
  );
  expect(
    screen.queryByRole('radio', { checked: true }),
  ).not.toBeInTheDocument();
  expect(screen.getByRole('button', { name: 'Antwort prüfen' })).toBeDisabled();
  expect(screen.queryByRole('alert')).not.toBeInTheDocument();
  expect(
    screen.getByText(/Eine neue richtige Lösung bringt 1 Punkt/),
  ).toBeVisible();
});

it('sperrt die Stufenauswahl bis das Speichern bestätigt ist', async () => {
  const user = userEvent.setup();
  let finish!: (value: 'streber') => void;
  vi.mocked(desktop.setDifficulty).mockImplementation(
    () =>
      new Promise((resolve) => {
        finish = resolve;
      }),
  );
  await startQuiz(user);
  await user.click(screen.getByRole('button', { name: /Streber/ }));
  expect(screen.getByRole('button', { name: /Könner/ })).toHaveAttribute(
    'aria-pressed',
    'true',
  );
  expect(screen.getByRole('button', { name: /Vorschule/ })).toBeDisabled();
  expect(screen.getByRole('radio', { name: firstAnswer })).toBeDisabled();
  await act(async () => {
    finish('streber');
  });
  expect(screen.getByRole('button', { name: /Streber/ })).toHaveAttribute(
    'aria-pressed',
    'true',
  );
  expect(
    screen.getByText(/Eine neue richtige Lösung bringt 3 Punkte/),
  ).toBeVisible();
});

it('zeigt Ladefehler ohne erfundenes Guthaben, lässt Entdecken zu und kann erneut laden', async () => {
  const user = userEvent.setup();
  vi.mocked(desktop.getLearningState)
    .mockRejectedValueOnce(new Error('Lokale Daten sind nicht verfügbar'))
    .mockResolvedValueOnce(solarInitial);
  render(<SolarSystemWorld profileVersion={0} />);
  expect(await screen.findByRole('alert')).toHaveTextContent(
    'Lokale Daten sind nicht verfügbar',
  );
  expect(screen.getByLabelText('Verfügbare Punkte')).toHaveTextContent(
    'Nicht verfügbar',
  );
  await user.click(screen.getByRole('button', { name: '4 Mars' }));
  expect(screen.getByRole('article', { name: 'Mars' })).toBeVisible();
  await user.click(screen.getByRole('button', { name: 'Planeten erraten' }));
  expect(screen.getByText(/Für gespeicherte Rätsel/)).toBeVisible();
  await user.click(screen.getByRole('button', { name: 'Lernrunde neu laden' }));
  expect(
    await screen.findByRole('heading', { name: firstQuestion.prompt }),
  ).toBeVisible();
  expect(screen.getByLabelText('Verfügbare Punkte')).toHaveTextContent(
    '10 Punkte',
  );
  expect(desktop.getLearningState).toHaveBeenCalledTimes(2);
});

it('erlaubt ohne Profil das Entdecken, aktiviert Antworten aber erst nach gespeichertem Profil', async () => {
  const user = userEvent.setup();
  vi.mocked(desktop.getLearningState)
    .mockResolvedValueOnce({ ...solarInitial, profileReady: false })
    .mockResolvedValueOnce(solarInitial);
  const { rerender } = render(<SolarSystemWorld profileVersion={0} />);
  await screen.findByRole('button', { name: /Könner/ });
  await user.click(screen.getByRole('button', { name: '8 Neptun' }));
  expect(screen.getByRole('article', { name: 'Neptun' })).toBeVisible();
  await user.click(screen.getByRole('button', { name: 'Planeten erraten' }));
  expect(
    screen.getByText(/Speichere oben unter „Dein Profil“ deinen Namen/),
  ).toBeVisible();
  expect(screen.getByRole('radio', { name: firstAnswer })).toBeDisabled();
  await user.click(screen.getByRole('radio', { name: firstAnswer }));
  expect(desktop.submitAnswer).not.toHaveBeenCalled();
  rerender(<SolarSystemWorld profileVersion={1} />);
  await waitFor(() =>
    expect(screen.getByRole('radio', { name: firstAnswer })).toBeEnabled(),
  );
  expect(screen.queryByText(/Speichere oben/)).not.toBeInTheDocument();
  await user.click(screen.getByRole('radio', { name: firstAnswer }));
  expect(screen.getByRole('button', { name: 'Antwort prüfen' })).toBeEnabled();
});

it('führt durch acht Rätsel, setzt Auswahl und Fokus beim Weitergehen zurück und startet erneut', async () => {
  const user = userEvent.setup();
  await startQuiz(user);
  for (let index = 0; index < questions.length; index++) {
    const question = questions[index];
    expect(
      screen.getByText(`PLANETEN-RÄTSEL ${index + 1} VON 8`),
    ).toBeVisible();
    expect(
      screen.getByRole('heading', { name: question.prompt }),
    ).toHaveFocus();
    expect(
      screen.queryByRole('radio', { checked: true }),
    ).not.toBeInTheDocument();
    expect(screen.queryByRole('status')).not.toBeInTheDocument();
    vi.mocked(desktop.submitAnswer).mockResolvedValueOnce(
      solarResultFor(question, true, 12 + index * 2),
    );
    await user.click(
      screen.getByRole('radio', { name: solarAnswerFor(question) }),
    );
    await user.click(screen.getByRole('button', { name: 'Antwort prüfen' }));
    expect(await screen.findByRole('status')).toHaveTextContent(
      'Richtig! +2 Punkte',
    );
    await user.click(
      screen.getByRole('button', {
        name: index === 7 ? 'Reise abschließen' : 'Nächster Planet →',
      }),
    );
  }
  expect(
    screen.getByRole('heading', { name: 'Einmal durchs Sonnensystem!' }),
  ).toHaveFocus();
  expect(screen.getByText(/8 von 8 Planeten-Rätseln/)).toBeVisible();
  expect(screen.getByLabelText('Verfügbare Punkte')).toHaveTextContent(
    '26 Punkte',
  );
  expect(desktop.submitAnswer).toHaveBeenCalledTimes(8);
  await user.click(
    screen.getByRole('button', { name: 'Noch eine Reise starten' }),
  );
  expect(
    screen.getByRole('heading', { name: firstQuestion.prompt }),
  ).toHaveFocus();
  expect(
    screen.queryByRole('radio', { checked: true }),
  ).not.toBeInTheDocument();
  expect(screen.getByText(/Schon gelöst/)).toBeVisible();
  vi.mocked(desktop.submitAnswer).mockResolvedValueOnce({
    ...solarResultFor(firstQuestion, true, 26),
    pointsAwarded: 0,
  });
  await user.click(screen.getByRole('radio', { name: firstAnswer }));
  await user.click(screen.getByRole('button', { name: 'Antwort prüfen' }));
  expect(await screen.findByRole('status')).toHaveTextContent(
    'Diesen Planeten hast du schon gelöst.',
  );
  expect(screen.getByLabelText('Verfügbare Punkte')).toHaveTextContent(
    '26 Punkte',
  );
});

it('kann ein Rätsel ohne Antwort überspringen, ohne dafür Punkte oder Versuche zu speichern', async () => {
  const user = userEvent.setup();
  await startQuiz(user);
  await user.click(screen.getByRole('button', { name: 'Nächster Planet →' }));
  expect(
    screen.getByRole('heading', { name: questions[1].prompt }),
  ).toHaveFocus();
  expect(screen.getByLabelText('Verfügbare Punkte')).toHaveTextContent(
    '10 Punkte',
  );
  expect(desktop.submitAnswer).not.toHaveBeenCalled();
});
