import { useState } from 'react';
import { fireEvent, render, screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { expect, it, vi } from 'vitest';
import { planets, type SolarPlanet } from '../domain/solar-system';
import SolarSystemModel from './SolarSystemModel';

function DiscoverModel() {
  const [selected, setSelected] = useState<SolarPlanet['id']>('earth');
  return (
    <SolarSystemModel
      guessing={false}
      selected={selected}
      onSelect={setSelected}
    />
  );
}

it('bietet alle Planeten als native Tasten und entdeckt sie mit Enter oder Leertaste', async () => {
  const user = userEvent.setup();
  render(<DiscoverModel />);
  await user.tab();
  expect(screen.getByRole('slider', { name: 'Blick drehen' })).toHaveFocus();
  await user.tab();
  expect(
    screen.getByRole('slider', { name: 'Von oben schauen' }),
  ).toHaveFocus();
  await user.tab();
  expect(
    screen.getByRole('button', { name: 'Blick zurücksetzen' }),
  ).toHaveFocus();
  for (const planet of planets) {
    await user.tab();
    const button = screen.getByRole('button', {
      name: `${planet.order} ${planet.name}`,
    });
    expect(button).toHaveFocus();
    await user.keyboard(planet.order % 2 ? '{Enter}' : ' ');
    expect(button).toHaveAttribute('aria-pressed', 'true');
    expect(screen.getByRole('img')).toHaveTextContent(planet.name);
    expect(screen.getAllByRole('button', { pressed: true })).toHaveLength(1);
  }
});

it('dreht und kippt die Ansicht mit begrenzten Reglern und setzt den Blick zurück', () => {
  render(<DiscoverModel />);
  const yaw = screen.getByRole('slider', { name: 'Blick drehen' });
  const tilt = screen.getByRole('slider', { name: 'Von oben schauen' });
  const picture = screen.getByRole('img');
  const initialPath = picture.querySelector('path')!.getAttribute('d');
  expect(yaw).toHaveValue('0');
  expect(yaw).toHaveAttribute('min', '-180');
  expect(yaw).toHaveAttribute('max', '180');
  expect(tilt).toHaveValue('38');
  expect(tilt).toHaveAttribute('min', '15');
  expect(tilt).toHaveAttribute('max', '80');
  fireEvent.change(yaw, { target: { value: '120' } });
  const rotatedPath = picture.querySelector('path')!.getAttribute('d');
  expect(rotatedPath).not.toBe(initialPath);
  fireEvent.change(tilt, { target: { value: '80' } });
  expect(picture.querySelector('path')!.getAttribute('d')).not.toBe(
    rotatedPath,
  );
  fireEvent.click(screen.getByRole('button', { name: 'Blick zurücksetzen' }));
  expect(yaw).toHaveValue('0');
  expect(tilt).toHaveValue('38');
  expect(picture.querySelector('path')!.getAttribute('d')).toBe(initialPath);
  expect(
    screen.getByText(/Größen und Abstände sind zum Lernen verändert/),
  ).toBeVisible();
});

it('zeigt im Rätsel ein Fragezeichen und lässt Bildklicks keine Lösung auswählen', async () => {
  const user = userEvent.setup();
  const select = vi.fn();
  render(
    <SolarSystemModel
      guessing
      target="saturn"
      selected="earth"
      onSelect={select}
    />,
  );
  const picture = screen.getByRole('img');
  expect(picture).toHaveTextContent('?');
  expect(picture).not.toHaveTextContent('Saturn');
  expect(picture).not.toHaveTextContent('Erde');
  expect(picture).toHaveAccessibleName(
    /Der gesuchte Planet und seine Umlaufbahn sind goldmarkiert/,
  );
  expect(
    screen.queryByRole('button', { name: /Saturn/ }),
  ).not.toBeInTheDocument();
  await user.click(picture.querySelector('image')!);
  expect(select).not.toHaveBeenCalled();
});

it('bündelt acht lokale Planetenbilder und hält Farbverläufe bei zwei Modellen getrennt', () => {
  const { container } = render(
    <>
      <DiscoverModel />
      <DiscoverModel />
    </>,
  );
  const pictures = screen.getAllByRole('img');
  for (const picture of pictures) {
    const images = picture.querySelectorAll('image');
    expect(images).toHaveLength(8);
    expect(
      Array.from(images)
        .map((image) => image.getAttribute('href'))
        .sort(),
    ).toEqual(planets.map((planet) => planet.image).sort());
  }
  const ids = Array.from(container.querySelectorAll('[id]')).map(
    (element) => element.id,
  );
  expect(new Set(ids).size).toBe(ids.length);
  for (const picture of pictures) {
    for (const element of picture.querySelectorAll('[clip-path]')) {
      const target = element.getAttribute('clip-path')!.slice(5, -1);
      expect(
        Array.from(picture.querySelectorAll('clipPath')).some(
          (clip) => clip.id === target,
        ),
      ).toBe(true);
    }
  }
});
