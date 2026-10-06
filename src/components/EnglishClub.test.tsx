import { render, screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { expect, it, vi } from 'vitest';
import { EnglishClubNotes, EnglishClubPicture } from './EnglishClub';
it('stellt eigene Clubszene mit Textalternative und getrennte paginierte Merkzettel bereit', async () => {
  const user = userEvent.setup();
  const past = vi.fn();
  render(
    <>
      <EnglishClubPicture />
      <EnglishClubNotes disabled={false} onPast={past} />
    </>,
  );
  expect(screen.getByRole('img', { name: /Robin und Juno/ })).toBeVisible();
  await user.click(
    screen.getByRole('button', { name: 'Club-Merkzettel & Mitmachen' }),
  );
  expect(screen.getByText(/Personalpronomen sind kurze Wörter/)).toBeVisible();
  expect(screen.getByText(/I → am/)).toBeVisible();
  await user.click(screen.getByRole('button', { name: 'Weiter →' }));
  expect(
    screen.getByRole('heading', { name: 'Wen? Wem? — Objektformen' }),
  ).toBeVisible();
  await user.click(screen.getByRole('button', { name: 'Weiter →' }));
  expect(
    screen.getByText(/My und his sind hier Possessivbegleiter/),
  ).toBeVisible();
  await user.click(screen.getByRole('button', { name: 'Weiter →' }));
  await user.click(
    screen.getByRole('button', { name: 'Freiwilliger Rückblick: Simple Past' }),
  );
  expect(past).toHaveBeenCalledOnce();
});
