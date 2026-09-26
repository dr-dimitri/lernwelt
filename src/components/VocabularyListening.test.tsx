import { render, screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { afterEach, expect, it, vi } from 'vitest';
import VocabularyListening from './VocabularyListening';
import { createListeningRound } from '../domain/vocabulary-audio';
import { mockAudio } from '../test/audio-mock';
const decks = [
  { id: 'hello', name: 'Begrüßung' },
  { id: 'family', name: 'Familie' },
];
afterEach(() => {
  vi.restoreAllMocks();
  vi.unstubAllGlobals();
});

it('bietet drei freiwillige Hörfragen, zeigt den Text erst nach der Antwort und stoppt Audio beim Weitergehen', async () => {
  const { instances } = mockAudio();
  vi.spyOn(Math, 'random').mockReturnValue(0);
  const round = createListeningRound('hello');
  const user = userEvent.setup();
  render(<VocabularyListening decks={decks} initialDeck="hello" />);
  expect(screen.getByText(/gibt keine Punkte/)).toBeInTheDocument();
  for (const [index, question] of round.entries()) {
    expect(screen.getByText(`WORT ${index + 1} VON 3`)).toBeInTheDocument();
    expect(
      screen.queryByText(question.card.english, { exact: true }),
    ).not.toBeInTheDocument();
    expect(
      screen.queryByRole('button', { name: 'Beispielsatz anhören' }),
    ).not.toBeInTheDocument();
    await user.click(screen.getByRole('button', { name: 'Wort anhören' }));
    expect(instances.at(-1)!.src).toBe(question.card.wordAudio.file);
    await user.click(
      screen.getByRole('button', { name: question.card.german }),
    );
    expect(screen.getByText('Gut gehört!')).toBeInTheDocument();
    expect(screen.getByText(question.card.example)).toBeInTheDocument();
    await user.click(
      screen.getByRole('button', { name: 'Beispielsatz anhören' }),
    );
    const last = instances.at(-1)!;
    await user.click(
      screen.getByRole('button', {
        name: index === 2 ? 'Runde abschließen' : 'Nächstes Hörwort',
      }),
    );
    expect(last.pause).toHaveBeenCalledOnce();
  }
  expect(screen.getByText('Deine Hörrunde ist geschafft!')).toBeInTheDocument();
  await user.click(screen.getByRole('button', { name: 'Neue Hörrunde' }));
  expect(screen.getByText('WORT 1 VON 3')).toBeInTheDocument();
});

it('erlaubt Aufdecken ohne Ton und setzt die Runde beim Themenwechsel zurück', async () => {
  const { instances } = mockAudio();
  const user = userEvent.setup();
  render(<VocabularyListening decks={decks} initialDeck="hello" />);
  await user.click(
    screen.getByRole('button', { name: 'Wort und Lösung zeigen' }),
  );
  expect(screen.getByText('Hören wir noch einmal hin.')).toBeInTheDocument();
  await user.click(
    screen.getByRole('button', { name: 'Beispielsatz anhören' }),
  );
  await user.selectOptions(screen.getByLabelText('Dein Hörthema'), 'family');
  expect(instances[0].pause).toHaveBeenCalledOnce();
  expect(screen.getByText('WORT 1 VON 3')).toBeInTheDocument();
  expect(
    screen.queryByText('Hören wir noch einmal hin.'),
  ).not.toBeInTheDocument();
});
