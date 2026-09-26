import { act, render, screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { afterEach, expect, it, vi } from 'vitest';
import VocabularyAudio from './VocabularyAudio';
import { vocabularyAudio } from '../domain/vocabulary-audio';
import { mockAudio } from '../test/audio-mock';
const cards = [...vocabularyAudio.values()];
afterEach(() => vi.unstubAllGlobals());

it('spielt nur nach Klick lokale Dateien, wechselt zwischen Wort und Satz und lässt sich stoppen', async () => {
  const { instances } = mockAudio();
  const user = userEvent.setup();
  render(<VocabularyAudio cardId={cards[0].id} />);
  expect(instances).toHaveLength(0);
  await user.click(screen.getByRole('button', { name: 'Wort anhören' }));
  expect(instances[0].src).toBe(cards[0].wordAudio.file);
  expect(screen.getByRole('button', { name: 'Wort anhören' })).toHaveAttribute(
    'aria-pressed',
    'true',
  );
  await user.click(
    screen.getByRole('button', { name: 'Beispielsatz anhören' }),
  );
  expect(instances[0].pause).toHaveBeenCalledOnce();
  expect(instances[1].src).toBe(cards[0].exampleAudio.file);
  await user.click(screen.getByRole('button', { name: 'Audio stoppen' }));
  expect(instances[1].pause).toHaveBeenCalledOnce();
  expect(
    screen.queryByRole('button', { name: 'Audio stoppen' }),
  ).not.toBeInTheDocument();
});

it('stoppt bei Kartenwechsel, deaktivierten Bedienelementen und Verlassen des Trainers', async () => {
  const { instances } = mockAudio();
  const user = userEvent.setup();
  const view = render(<VocabularyAudio cardId={cards[0].id} />);
  await user.click(screen.getByRole('button', { name: 'Wort anhören' }));
  view.rerender(<VocabularyAudio cardId={cards[1].id} />);
  expect(instances[0].pause).toHaveBeenCalledOnce();
  expect(instances[0].onerror).toBeNull();
  await user.click(screen.getByRole('button', { name: 'Wort anhören' }));
  view.rerender(<VocabularyAudio cardId={cards[1].id} disabled />);
  expect(instances[1].pause).toHaveBeenCalledOnce();
  expect(screen.getByRole('button', { name: 'Wort anhören' })).toBeDisabled();
  view.rerender(<VocabularyAudio cardId={cards[1].id} />);
  await user.click(screen.getByRole('button', { name: 'Wort anhören' }));
  view.unmount();
  expect(instances[2].pause).toHaveBeenCalledOnce();
});

it('zeigt verständliche Abspiel- und Dateifehler und erlaubt einen erneuten Versuch', async () => {
  const { instances, play } = mockAudio();
  play.mockRejectedValueOnce(new Error('NotAllowedError'));
  const user = userEvent.setup();
  render(<VocabularyAudio cardId={cards[0].id} />);
  await user.click(screen.getByRole('button', { name: 'Wort anhören' }));
  expect(screen.getByRole('alert')).toHaveTextContent('ohne Ton weiterüben');
  await user.click(screen.getByRole('button', { name: 'Wort anhören' }));
  expect(screen.queryByRole('alert')).not.toBeInTheDocument();
  act(() => instances[1].onerror?.());
  expect(screen.getByRole('alert')).toHaveTextContent(
    'Versuche es noch einmal',
  );
  await user.click(screen.getByRole('button', { name: 'Wort anhören' }));
  act(() => instances[2].onended?.());
  expect(
    screen.queryByRole('button', { name: 'Audio stoppen' }),
  ).not.toBeInTheDocument();
});

it('ignoriert einen verspäteten Audiofehler nach dem Kartenwechsel', async () => {
  const { play } = mockAudio();
  let reject!: (reason: Error) => void;
  play.mockImplementationOnce(
    () =>
      new Promise((_, no) => {
        reject = no;
      }),
  );
  const user = userEvent.setup();
  const view = render(<VocabularyAudio cardId={cards[0].id} />);
  await user.click(screen.getByRole('button', { name: 'Wort anhören' }));
  view.rerender(<VocabularyAudio cardId={cards[1].id} />);
  await act(async () => reject(new Error('old failure')));
  expect(screen.queryByRole('alert')).not.toBeInTheDocument();
});
