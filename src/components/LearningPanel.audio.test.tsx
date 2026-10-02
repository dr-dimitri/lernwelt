import { render, screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { afterEach, beforeEach, expect, it, vi } from 'vitest';
import LearningPanel from './LearningPanel';
import { desktop } from '../lib/desktop';
import { initial, mathQuestion } from '../test/learning-fixture';
import { mockAudio } from '../test/audio-mock';
import { vocabularyAudio } from '../domain/vocabulary-audio';
import type { LearningState } from '../domain/learning';

vi.mock('../lib/desktop', () => ({
  desktop: {
    getLearningState: vi.fn(),
    setDifficulty: vi.fn(),
    submitAnswer: vi.fn(),
  },
}));
const cards = [...vocabularyAudio.values()].slice(0, 2);
function fixture(): LearningState {
  return {
    ...structuredClone(initial),
    studyCatalog: {
      version: 1,
      areas: [
        {
          id: 'hearing',
          name: 'Hören',
          subject: 'english',
          curriculumRef: 'E5 1.1',
        },
      ],
      units: [
        {
          id: 'listening',
          areaId: 'hearing',
          subject: 'english',
          grade: 5,
          name: 'Wörter hören',
          goal: 'Du erkennst gehörte Wörter.',
          keywords: ['Audio'],
          curriculumRef: 'E5 1.1',
          source:
            'https://www.lehrplanplus.bayern.de/fachlehrplan/gymnasium/5/englisch/1-fremdsprache',
          curriculumVersion: '02.10.2026',
          languageSequence: '1. Fremdsprache',
          exerciseIds: ['listen-0', 'listen-1'],
          supplements: [],
        },
      ],
    },
    questions: cards.map((card, i) => ({
      ...mathQuestion,
      id: `listen-${i}`,
      subject: 'english',
      topicId: 'english',
      answerKind: 'text',
      audioCardId: card.id,
      prompt: 'Höre das Wort und schreibe es auf.',
    })),
  };
}
beforeEach(() => {
  vi.clearAllMocks();
  vi.mocked(desktop.getLearningState).mockResolvedValue(fixture());
});
afterEach(() => vi.unstubAllGlobals());
async function start(user: ReturnType<typeof userEvent.setup>) {
  await user.click(await screen.findByRole('button', { name: /Hören/ }));
  await user.click(screen.getByRole('button', { name: /Wörter hören/ }));
}
it('spielt Hörübungen lokal und stoppt beim Aufgabenwechsel und Rückweg', async () => {
  const { instances } = mockAudio();
  const user = userEvent.setup();
  render(<LearningPanel subject="english" profileVersion={0} />);
  await start(user);
  expect(instances).toHaveLength(0);
  await user.click(screen.getByRole('button', { name: 'Wort anhören' }));
  expect(instances[0].src).toBe(cards[0].wordAudio.file);
  await user.click(screen.getByRole('button', { name: 'Nächste Aufgabe →' }));
  expect(instances[0].pause).toHaveBeenCalledOnce();
  await user.click(
    screen.getByRole('button', { name: 'Beispielsatz anhören' }),
  );
  expect(instances[1].src).toBe(cards[1].exampleAudio.file);
  await user.click(screen.getByRole('button', { name: '← Themenübersicht' }));
  expect(instances[1].pause).toHaveBeenCalledOnce();
  expect(desktop.submitAnswer).not.toHaveBeenCalled();
});
it('lässt ein fehlgeschlagenes Audio erneut starten, ohne Antwort oder Punkte zu buchen', async () => {
  const { play } = mockAudio();
  play.mockRejectedValueOnce(new Error('Audio nicht verfügbar'));
  const user = userEvent.setup();
  render(<LearningPanel subject="english" profileVersion={0} />);
  await start(user);
  await user.click(screen.getByRole('button', { name: 'Wort anhören' }));
  expect(screen.getByRole('alert')).toHaveTextContent(
    'Versuche es noch einmal',
  );
  await user.click(screen.getByRole('button', { name: 'Wort anhören' }));
  expect(screen.queryByRole('alert')).not.toBeInTheDocument();
  expect(play).toHaveBeenCalledTimes(2);
  expect(desktop.submitAnswer).not.toHaveBeenCalled();
  expect(screen.getByLabelText('Verfügbare Punkte')).toHaveTextContent(
    '10 Punkte',
  );
});
