import { expect, it } from 'vitest';
import { cellFixture } from '../test/cell-fixture';
import {
  cellQuestions,
  cellQuestionStation,
  cellQuestionVisual,
  cellPhoto,
} from './cells';
import { difficulties } from './learning';

it('erreicht alle 45 ursprünglichen und 18 neuen Fragen einmal je Stufe in kurzen gemischten Runden', () => {
  expect(cellFixture.questions).toHaveLength(63);
  for (const level of difficulties) {
    const bank = cellQuestions(cellFixture.questions, level.id);
    expect(bank).toHaveLength(21);
    expect(new Set(bank.map((q) => q.id)).size).toBe(21);
    expect(bank[0].topicId).toBe('nature-nucleus');
    expect(bank[1].topicId).toBe('nature-cells');
    const byStation = ['cell', 'nucleus', 'microscope', 'life'].flatMap(
      (filter) =>
        cellQuestions(
          cellFixture.questions,
          level.id,
          filter as Parameters<typeof cellQuestions>[2],
        ),
    );
    expect(new Set(byStation.map((q) => q.id))).toEqual(
      new Set(bank.map((q) => q.id)),
    );
    expect(bank.filter((q) => cellQuestionVisual(q))).toHaveLength(6);
  }
});
it('ordnet die Bestandsidentitäten nach ihren Inhalten zu und verwendet lokale Bilder', () => {
  expect(cellQuestionStation('by.nature.5.cells.7.v1')).toBe('life');
  expect(cellQuestionStation('by.nature.5.cells.6.v1')).toBe('microscope');
  expect(cellQuestionStation('by.nature.5.focus.cells.streber.09.v1')).toBe(
    'cell',
  );
  expect(cellQuestionStation('by.nature.5.focus.cells.koenner.12.v1')).toBe(
    'microscope',
  );
  expect(cellPhoto.src).toMatch(/^\/images\/cells\//);
  expect(cellPhoto.credit).toContain('CC BY-SA 4.0');
});
