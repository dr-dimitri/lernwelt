import { fireEvent, render, screen, within } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { expect, it } from 'vitest';
import { getPlanetImages } from '../domain/solar-planet-images';
import { planets } from '../domain/solar-system';
import PlanetGallery from './PlanetGallery';

const earth = planets.find((planet) => planet.id === 'earth')!;
const images = getPlanetImages(earth.id);

it('wechselt per Tastatur in beide Richtungen durch echte Bilder samt Beschreibung und Quelle', async () => {
  const user = userEvent.setup();
  render(<PlanetGallery planet={earth} />);
  const next = screen.getByRole('button', { name: 'Nächstes Bild' });
  for (const [index, image] of images.entries()) {
    expect(screen.getByRole('img')).toHaveAttribute('src', image.src);
    expect(screen.getByRole('img')).toHaveAccessibleName(image.alt);
    expect(
      screen.getByText(`Bild ${index + 1} von ${images.length}`),
    ).toBeVisible();
    expect(screen.getByText(image.caption)).toBeVisible();
    expect(screen.getByText(image.title)).toBeVisible();
    expect(
      screen.getByRole('link', { name: 'NASA-Bildquelle' }),
    ).toHaveAttribute('href', image.sourcePage);
    next.focus();
    await user.keyboard('{Enter}');
  }
  expect(screen.getByRole('img')).toHaveAttribute('src', images[0].src);
  const previous = screen.getByRole('button', { name: 'Vorheriges Bild' });
  previous.focus();
  await user.keyboard(' ');
  expect(screen.getByRole('img')).toHaveAttribute('src', images.at(-1)!.src);
});

it('vergrößert die gewählte Aufnahme und übernimmt den Bildwechsel zurück in den Steckbrief', async () => {
  const user = userEvent.setup();
  render(<PlanetGallery planet={earth} />);
  await user.click(screen.getByRole('button', { name: 'Nächstes Bild' }));
  const trigger = screen.getByRole('button', { name: 'Bild vergrößern' });
  await user.click(trigger);
  const dialog = screen.getByRole('dialog', { name: 'Erde: Bild vergrößert' });
  expect(within(dialog).getByRole('img')).toHaveAttribute('src', images[1].src);
  expect(
    within(dialog).getByRole('button', { name: 'Schließen' }),
  ).toHaveFocus();
  await user.click(
    within(dialog).getByRole('button', { name: 'Nächstes Bild' }),
  );
  expect(within(dialog).getByRole('img')).toHaveAttribute('src', images[2].src);
  await user.click(
    within(dialog).getByRole('button', { name: 'Vorheriges Bild' }),
  );
  await user.click(within(dialog).getByRole('button', { name: 'Schließen' }));
  expect(screen.queryByRole('dialog')).not.toBeInTheDocument();
  expect(trigger).toHaveFocus();
  expect(screen.getByRole('img')).toHaveAttribute('src', images[1].src);
});

it('schließt mit dem nativen Escape-Signal und bringt den Fokus zum Vergrößern-Knopf zurück', async () => {
  const user = userEvent.setup();
  render(<PlanetGallery planet={earth} />);
  const trigger = screen.getByRole('button', { name: 'Bild vergrößern' });
  await user.click(trigger);
  fireEvent(
    screen.getByRole('dialog'),
    new Event('cancel', { cancelable: true }),
  );
  expect(screen.queryByRole('dialog')).not.toBeInTheDocument();
  expect(trigger).toHaveFocus();
});

it('erlaubt nach einem Bildladefehler einen Retry und den Wechsel zu einem anderen lokalen Bild', async () => {
  const user = userEvent.setup();
  render(<PlanetGallery planet={earth} />);
  fireEvent.error(screen.getByRole('img'));
  expect(screen.getByRole('status')).toHaveTextContent(
    'Dieses Bild konnte nicht geladen werden.',
  );
  await user.click(screen.getByRole('button', { name: 'Bild erneut laden' }));
  expect(screen.getByRole('img')).toHaveAttribute('src', images[0].src);
  fireEvent.error(screen.getByRole('img'));
  await user.click(screen.getByRole('button', { name: 'Nächstes Bild' }));
  expect(screen.queryByRole('status')).not.toBeInTheDocument();
  expect(screen.getByRole('img')).toHaveAttribute('src', images[1].src);
});
