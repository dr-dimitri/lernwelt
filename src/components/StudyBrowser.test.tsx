import { render, screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { expect, it, vi } from 'vitest';
import type { LearningState } from '../domain/learning';
import type { StudyUnit } from '../domain/study';
import { initial, mathQuestion } from '../test/learning-fixture';
import StudyBrowser from './StudyBrowser';

function fixture(): LearningState {
  const units: StudyUnit[] = Array.from({ length: 18 }, (_, index) => ({
    id: `word-${index + 1}`,
    areaId: 'words',
    subject: 'mathematics',
    grade: 5,
    name: `Wort ${index + 1}`,
    goal: 'Ein Thema zum Ausprobieren.',
    keywords: [],
    curriculumRef: 'M5 1.1',
    source: 'Eigene Prüfaufgaben',
    curriculumVersion: '2026-10-04',
    languageSequence: null,
    exerciseIds: [`question-${index + 1}`],
    supplements: [],
  }));
  return {
    ...initial,
    studyCatalog: {
      version: 1,
      areas: [
        {
          id: 'words',
          subject: 'mathematics',
          name: 'Viele Themen',
          curriculumRef: 'M5 1.1',
        },
      ],
      units,
    },
    questions: units.flatMap((unit) =>
      (['vorschule', 'koenner'] as const).map((difficulty) => ({
        ...mathQuestion,
        id: unit.exerciseIds[0],
        difficulty,
      })),
    ),
  };
}

function unitButtons() {
  return screen.getAllByRole('button', { name: /Kurze Runde starten/ });
}

it('zeigt direkte Themen auf drei Seiten mit höchstens sechs Zielen und startet das letzte Thema', async () => {
  const user = userEvent.setup();
  const state = fixture();
  const select = vi.fn();
  render(
    <StudyBrowser
      state={state}
      subject="mathematics"
      disabled={false}
      onSelect={select}
    />,
  );
  expect(unitButtons()).toHaveLength(6);
  expect(screen.getByText('Seite 1 von 3')).toBeVisible();
  expect(
    screen.queryByRole('button', { name: /^Viele Themen/ }),
  ).not.toBeInTheDocument();
  await user.type(screen.getByRole('searchbox'), 'Wort');
  expect(screen.getByRole('status')).toHaveTextContent('18 Themen gefunden');
  expect(
    screen.getByRole('button', { name: '← Vorige Themen' }),
  ).toBeDisabled();
  await user.click(screen.getByRole('button', { name: 'Weitere Themen →' }));
  await user.keyboard('{Enter}'); // the heading has focus, so no accidental second navigation
  expect(screen.getByText('Seite 2 von 3')).toBeVisible();
  expect(
    screen.getByRole('heading', { name: 'Was möchtest du üben?' }),
  ).toHaveFocus();
  await user.click(screen.getByRole('button', { name: 'Weitere Themen →' }));
  expect(unitButtons()).toHaveLength(6);
  expect(screen.getByText('Seite 3 von 3')).toBeVisible();
  expect(
    screen.getByRole('button', { name: 'Weitere Themen →' }),
  ).toBeDisabled();
  await user.click(screen.getByRole('button', { name: /^Wort 18/ }));
  expect(select).toHaveBeenCalledWith(state.studyCatalog!.units[17]);
});

it('erhält Suche, Filter und Seite beim Rückweg und gibt den Fokus an das Ziel zurück', async () => {
  const user = userEvent.setup();
  const state = fixture();
  const select = vi.fn();
  const { rerender } = render(
    <StudyBrowser
      state={state}
      subject="mathematics"
      disabled={false}
      onSelect={select}
    />,
  );
  await user.selectOptions(screen.getByRole('combobox'), 'words');
  await user.type(screen.getByRole('searchbox'), 'Wort');
  await user.click(screen.getByRole('button', { name: 'Weitere Themen →' }));
  const selected = screen.getByRole('button', { name: /^Wort 12/ });
  await user.click(selected);
  rerender(
    <StudyBrowser
      state={state}
      subject="mathematics"
      disabled={false}
      onSelect={select}
      active={false}
    />,
  );
  expect(screen.queryByRole('searchbox')).not.toBeInTheDocument();
  rerender(
    <StudyBrowser
      state={{ ...state, difficulty: 'vorschule' }}
      subject="mathematics"
      disabled={false}
      onSelect={select}
      active
    />,
  );
  expect(screen.getByRole('searchbox')).toHaveValue('Wort');
  expect(screen.getByRole('combobox')).toHaveValue('words');
  expect(screen.getByText('Seite 2 von 3')).toBeVisible();
  expect(selected).toHaveFocus();
});

it('setzt nach Such- und Filteränderungen die Seite zurück, begrenzt verkleinerte Treffer und erklärt null Treffer', async () => {
  const user = userEvent.setup();
  const state = fixture();
  const select = vi.fn();
  const { rerender } = render(
    <StudyBrowser
      state={state}
      subject="mathematics"
      disabled={false}
      onSelect={select}
    />,
  );
  await user.click(screen.getByRole('button', { name: 'Weitere Themen →' }));
  await user.click(screen.getByRole('button', { name: 'Weitere Themen →' }));
  rerender(
    <StudyBrowser
      state={{
        ...state,
        studyCatalog: {
          ...state.studyCatalog!,
          units: state.studyCatalog!.units.slice(0, 8),
        },
      }}
      subject="mathematics"
      disabled={false}
      onSelect={select}
    />,
  );
  expect(screen.getByText('Seite 2 von 2')).toBeVisible();
  expect(unitButtons()).toHaveLength(2);
  await user.type(screen.getByRole('searchbox'), 'Wort 8');
  expect(screen.getByRole('status')).toHaveTextContent('1 Thema gefunden');
  expect(unitButtons()).toHaveLength(1);
  await user.clear(screen.getByRole('searchbox'));
  await user.type(screen.getByRole('searchbox'), 'nichts');
  expect(screen.getByText('Hier haben wir nichts gefunden.')).toBeVisible();
  await user.click(screen.getByRole('button', { name: 'Suche löschen' }));
  expect(screen.getByText('Seite 1 von 2')).toBeVisible();
  await user.selectOptions(screen.getByRole('combobox'), 'words');
  expect(screen.getByText('Seite 1 von 2')).toBeVisible();
});

it('sperrt Blättern, Suche, Filter und Themenwahl während einer Änderung', async () => {
  const user = userEvent.setup();
  const select = vi.fn();
  render(
    <StudyBrowser
      state={fixture()}
      subject="mathematics"
      disabled
      onSelect={select}
    />,
  );
  expect(screen.getByRole('searchbox')).toBeDisabled();
  expect(screen.getByRole('combobox')).toBeDisabled();
  for (const button of screen.getAllByRole('button'))
    expect(button).toBeDisabled();
  await user.click(screen.getByRole('button', { name: 'Weitere Themen →' }));
  expect(screen.getByText('Seite 1 von 3')).toBeVisible();
  expect(select).not.toHaveBeenCalled();
});

it('nimmt konkrete Zusatzangebote einmal in die sechs Ziele je Seite auf', async () => {
  const user = userEvent.setup();
  const state = fixture();
  const link = {
    kind: 'multiplication' as const,
    target: 'squares',
    label: 'Quadratzahlen üben',
  };
  state.studyCatalog!.units[0].supplements = [link];
  state.studyCatalog!.units[1].supplements = [link];
  const supplement = vi.fn();
  render(
    <StudyBrowser
      state={state}
      subject="mathematics"
      disabled={false}
      onSelect={vi.fn()}
      onSupplement={supplement}
    />,
  );
  expect(
    screen.getAllByRole('button', { name: /Quadratzahlen üben/ }),
  ).toHaveLength(1);
  expect(unitButtons()).toHaveLength(5);
  await user.click(screen.getByRole('button', { name: /Quadratzahlen üben/ }));
  expect(supplement).toHaveBeenCalledWith(link);
  await user.type(screen.getByRole('searchbox'), 'Quadratzahlen');
  expect(screen.getByRole('status')).toHaveTextContent('1 Thema gefunden');
});

it('zeigt Naturspiele als vorhandenes konkretes Fachziel innerhalb der sechs Kacheln', async () => {
  const user = userEvent.setup();
  const state = fixture();
  state.studyCatalog!.areas[0].subject = 'nature';
  state.studyCatalog!.units.forEach((unit) => {
    unit.subject = 'nature';
  });
  state.questions.forEach((question) => {
    question.subject = 'nature';
  });
  const play = vi.fn();
  render(
    <StudyBrowser
      state={state}
      subject="nature"
      disabled={false}
      onSelect={vi.fn()}
      onNatureGames={play}
    />,
  );
  expect(unitButtons()).toHaveLength(5);
  await user.click(screen.getByRole('button', { name: /^Naturspiele/ }));
  expect(play).toHaveBeenCalledOnce();
});

it('unterscheidet Vokabelziele mit gleicher Linkbeschriftung anhand ihres vorhandenen Wortthemas', () => {
  const state = fixture();
  state.studyCatalog!.units[0].supplements = [
    {
      kind: 'vocabulary',
      label: 'Diese Wörter im Vokabeltrainer üben',
      target: 'school',
    },
  ];
  state.studyCatalog!.units[1].supplements = [
    {
      kind: 'vocabulary',
      label: 'Diese Wörter im Vokabeltrainer üben',
      target: 'family',
    },
  ];
  render(
    <StudyBrowser
      state={state}
      subject="mathematics"
      disabled={false}
      onSelect={vi.fn()}
      onSupplement={vi.fn()}
    />,
  );
  expect(
    screen.getByRole('button', {
      name: /^Diese Wörter im Vokabeltrainer üben.*Wort 1\b/,
    }),
  ).toBeVisible();
  expect(
    screen.getByRole('button', {
      name: /^Diese Wörter im Vokabeltrainer üben.*Wort 2\b/,
    }),
  ).toBeVisible();
  expect(unitButtons()).toHaveLength(4);
});
