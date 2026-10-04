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

it('zeigt alle 18 Suchtreffer auf zwei Seiten und startet auch das letzte Unterthema', async () => {
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
  await user.type(screen.getByRole('searchbox'), 'Wort');
  expect(screen.getByRole('status')).toHaveTextContent(
    '18 Unterthemen gefunden',
  );
  expect(unitButtons()).toHaveLength(12);
  expect(screen.getByText('Seite 1 von 2')).toBeVisible();
  expect(
    screen.getByRole('button', { name: '← Vorige Unterthemen' }),
  ).toBeDisabled();
  expect(
    screen.queryByRole('button', { name: /^Wort 18/ }),
  ).not.toBeInTheDocument();
  screen.getByRole('button', { name: 'Weitere Unterthemen →' }).focus();
  await user.keyboard('{Enter}');
  expect(unitButtons()).toHaveLength(6);
  expect(screen.getByText('Seite 2 von 2')).toBeVisible();
  expect(screen.getByRole('status')).toHaveTextContent(
    '18 Unterthemen gefunden',
  );
  expect(
    screen.getByRole('heading', { name: 'Was möchtest du üben?' }),
  ).toHaveFocus();
  expect(
    screen.getByRole('button', { name: 'Weitere Unterthemen →' }),
  ).toBeDisabled();
  await user.click(screen.getByRole('button', { name: /^Wort 18/ }));
  expect(select).toHaveBeenCalledWith(state.studyCatalog!.units[17]);
  await user.click(
    screen.getByRole('button', { name: '← Vorige Unterthemen' }),
  );
  expect(unitButtons()).toHaveLength(12);
  expect(screen.getByText('Seite 1 von 2')).toBeVisible();
  expect(
    screen.getByRole('heading', { name: 'Was möchtest du üben?' }),
  ).toHaveFocus();
});

it('beginnt nach Such-, Bereichs- und Stufenwechsel wieder auf der ersten Seite', async () => {
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
  await user.click(screen.getByRole('button', { name: /Viele Themen/ }));
  await user.click(
    screen.getByRole('button', { name: 'Weitere Unterthemen →' }),
  );
  expect(screen.getByText('Seite 2 von 2')).toBeVisible();
  await user.click(screen.getByRole('button', { name: '← Alle Lernbereiche' }));
  await user.click(screen.getByRole('button', { name: /Viele Themen/ }));
  expect(screen.getByText('Seite 1 von 2')).toBeVisible();
  await user.click(
    screen.getByRole('button', { name: 'Weitere Unterthemen →' }),
  );
  await user.type(screen.getByRole('searchbox'), 'Wort');
  expect(screen.getByText('Seite 1 von 2')).toBeVisible();
  await user.click(
    screen.getByRole('button', { name: 'Weitere Unterthemen →' }),
  );
  rerender(
    <StudyBrowser
      state={{ ...state, difficulty: 'vorschule' }}
      subject="mathematics"
      disabled={false}
      onSelect={select}
    />,
  );
  expect(screen.getByText('Seite 1 von 2')).toBeVisible();
  expect(unitButtons()).toHaveLength(12);
  await user.click(
    screen.getByRole('button', { name: 'Weitere Unterthemen →' }),
  );
  await user.type(screen.getByRole('searchbox'), ' 18');
  expect(screen.getByRole('status')).toHaveTextContent('1 Unterthema gefunden');
  expect(unitButtons()).toHaveLength(1);
  expect(
    screen.queryByRole('navigation', { name: 'Unterthemen-Seiten' }),
  ).not.toBeInTheDocument();
});

it('sperrt Blättern, Suchänderungen und Themenwahl während einer laufenden Änderung', async () => {
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
  await user.type(screen.getByRole('searchbox'), 'Wort');
  await user.click(
    screen.getByRole('button', { name: 'Weitere Unterthemen →' }),
  );
  rerender(
    <StudyBrowser
      state={state}
      subject="mathematics"
      disabled
      onSelect={select}
    />,
  );
  expect(screen.getByRole('searchbox')).toBeDisabled();
  for (const button of screen.getAllByRole('button'))
    expect(button).toBeDisabled();
  await user.click(
    screen.getByRole('button', { name: '← Vorige Unterthemen' }),
  );
  expect(screen.getByText('Seite 2 von 2')).toBeVisible();
  expect(select).not.toHaveBeenCalled();
});
