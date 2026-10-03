import { useState } from 'react';
import { act, fireEvent, render, screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { afterEach, expect, it, vi } from 'vitest';
import { planets, type SolarPlanet } from '../domain/solar-system';
import SolarSystemModel from './SolarSystemModel';

afterEach(() => vi.restoreAllMocks());

function animationClock() {
  let time = 0;
  let nextFrame = 0;
  const callbacks = new Map<number, FrameRequestCallback>();
  const hidden = vi.spyOn(document, 'hidden', 'get').mockReturnValue(false);
  vi.spyOn(performance, 'now').mockImplementation(() => time);
  vi.spyOn(window, 'requestAnimationFrame').mockImplementation((callback) => {
    const frame = ++nextFrame;
    callbacks.set(frame, callback);
    return frame;
  });
  vi.spyOn(window, 'cancelAnimationFrame').mockImplementation((frame) => {
    callbacks.delete(frame);
  });
  return {
    advance(milliseconds: number) {
      time += milliseconds;
      const scheduled = [...callbacks.values()];
      callbacks.clear();
      act(() => scheduled.forEach((callback) => callback(time)));
    },
    visibility(isHidden: boolean) {
      hidden.mockReturnValue(isHidden);
      fireEvent(document, new Event('visibilitychange'));
    },
    pending: () => callbacks.size,
  };
}

function planetCenter(picture: HTMLElement, id: SolarPlanet['id']) {
  const planet = planets.find((candidate) => candidate.id === id)!;
  const portrait = picture.querySelector(
    `image[href="${planet.image}"]`,
  )!.parentElement!;
  return {
    x:
      Number(portrait.getAttribute('x')) +
      Number(portrait.getAttribute('width')) / 2,
    y:
      Number(portrait.getAttribute('y')) +
      Number(portrait.getAttribute('height')) / 2,
  };
}

function expectSameCenter(
  actual: ReturnType<typeof planetCenter>,
  expected: ReturnType<typeof planetCenter>,
) {
  expect(actual.x).toBeCloseTo(expected.x, 8);
  expect(actual.y).toBeCloseTo(expected.y, 8);
}

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
  await user.tab();
  const start = screen.getByRole('button', { name: 'Umlauf starten' });
  expect(start).toHaveFocus();
  await user.keyboard('{Enter}');
  expect(start).toHaveAccessibleName('Umlauf anhalten');
  expect(start).toHaveAttribute('aria-pressed', 'true');
  await user.keyboard(' ');
  expect(start).toHaveAccessibleName('Umlauf starten');
  expect(start).toHaveAttribute('aria-pressed', 'false');
  await user.tab();
  expect(
    screen.getByRole('slider', { name: 'Sekunden pro Erdenjahr' }),
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

it('startet mit ruhenden Planeten und bietet 5 bis 15 Sekunden pro Erdenjahr', () => {
  const clock = animationClock();
  render(<DiscoverModel />);
  const speed = screen.getByRole('slider', { name: 'Sekunden pro Erdenjahr' });
  expect(speed).toHaveAttribute('type', 'range');
  expect(speed).toHaveAttribute('min', '5');
  expect(speed).toHaveAttribute('max', '15');
  expect(speed).toHaveAttribute('step', '1');
  expect(speed).toHaveValue('5');
  expect(speed).toHaveAttribute('aria-valuetext', '5 Sekunden pro Erdenjahr');
  expect(
    screen.getByRole('button', { name: 'Umlauf starten' }),
  ).toHaveAttribute('aria-pressed', 'false');
  const picture = screen.getByRole('img');
  const initial = planets.map((planet) => planetCenter(picture, planet.id));
  clock.advance(60_000);
  expect(clock.pending()).toBe(0);
  for (const [index, planet] of planets.entries()) {
    expectSameCenter(planetCenter(picture, planet.id), initial[index]);
  }
  fireEvent.change(speed, { target: { value: '11' } });
  expect(speed).toHaveValue('11');
  expect(speed).toHaveAttribute('aria-valuetext', '11 Sekunden pro Erdenjahr');
  expect(screen.getByText('Ein Erdenjahr: 11 Sekunden')).toBeVisible();
});

it.each([5, 15])(
  'führt die Erde in genau %i aktiven Sekunden einmal um die Sonne',
  (seconds) => {
    const clock = animationClock();
    render(<DiscoverModel />);
    fireEvent.change(
      screen.getByRole('slider', { name: 'Sekunden pro Erdenjahr' }),
      { target: { value: String(seconds) } },
    );
    const picture = screen.getByRole('img');
    const initialEarth = planetCenter(picture, 'earth');
    const initialMars = planetCenter(picture, 'mars');
    const initialNeptune = planetCenter(picture, 'neptune');
    const orbit = picture.querySelectorAll('path')[2].getAttribute('d');
    fireEvent.click(screen.getByRole('button', { name: 'Umlauf starten' }));
    clock.advance((seconds * 1000) / 2);
    expect(planetCenter(picture, 'earth')).not.toEqual(initialEarth);
    clock.advance((seconds * 1000) / 2);
    expectSameCenter(planetCenter(picture, 'earth'), initialEarth);
    expect(planetCenter(picture, 'mars')).not.toEqual(initialMars);
    expect(planetCenter(picture, 'neptune')).not.toEqual(initialNeptune);
    expect(picture.querySelectorAll('path')[2]).toHaveAttribute('d', orbit);
    expect(picture).toHaveTextContent('Erde');
    expect(picture.querySelectorAll('circle[stroke="#ffd17d"]')).toHaveLength(
      1,
    );
  },
);

it('hält den Umlauf an, setzt ihn fort und wechselt die Geschwindigkeit ohne Positionssprung', () => {
  const clock = animationClock();
  render(<DiscoverModel />);
  const picture = screen.getByRole('img');
  const initial = planetCenter(picture, 'earth');
  fireEvent.click(screen.getByRole('button', { name: 'Umlauf starten' }));
  clock.advance(1250);
  const quarter = planetCenter(picture, 'earth');
  expect(quarter).not.toEqual(initial);
  fireEvent.click(screen.getByRole('button', { name: 'Umlauf anhalten' }));
  expect(clock.pending()).toBe(0);
  clock.advance(30_000);
  expectSameCenter(planetCenter(picture, 'earth'), quarter);
  fireEvent.click(screen.getByRole('button', { name: 'Umlauf starten' }));
  expectSameCenter(planetCenter(picture, 'earth'), quarter);
  clock.advance(1250);
  const half = planetCenter(picture, 'earth');
  expect(half).not.toEqual(quarter);
  fireEvent.change(
    screen.getByRole('slider', { name: 'Sekunden pro Erdenjahr' }),
    { target: { value: '15' } },
  );
  expectSameCenter(planetCenter(picture, 'earth'), half);
  expect(clock.pending()).toBe(1);
  clock.advance(7500);
  expectSameCenter(planetCenter(picture, 'earth'), initial);
  fireEvent.change(screen.getByRole('slider', { name: 'Blick drehen' }), {
    target: { value: '90' },
  });
  expect(planetCenter(picture, 'earth')).not.toEqual(initial);
  fireEvent.click(screen.getByRole('button', { name: 'Blick zurücksetzen' }));
  expectSameCenter(planetCenter(picture, 'earth'), initial);
  fireEvent.click(screen.getByRole('button', { name: '4 Mars' }));
  expect(screen.getByRole('button', { name: '4 Mars' })).toHaveAttribute(
    'aria-pressed',
    'true',
  );
  expect(picture).toHaveTextContent('Mars');
  expect(clock.pending()).toBe(1);
});

it('zählt unsichtbare Zeit nicht mit und beendet die Animation beim Entfernen der Ansicht', () => {
  const clock = animationClock();
  const view = render(<DiscoverModel />);
  const picture = screen.getByRole('img');
  const initial = planetCenter(picture, 'earth');
  fireEvent.click(screen.getByRole('button', { name: 'Umlauf starten' }));
  clock.advance(1250);
  const quarter = planetCenter(picture, 'earth');
  clock.visibility(true);
  expect(clock.pending()).toBe(0);
  clock.advance(60_000);
  expectSameCenter(planetCenter(picture, 'earth'), quarter);
  clock.visibility(false);
  expect(clock.pending()).toBe(1);
  expectSameCenter(planetCenter(picture, 'earth'), quarter);
  clock.advance(3750);
  expectSameCenter(planetCenter(picture, 'earth'), initial);
  view.unmount();
  expect(clock.pending()).toBe(0);
  clock.visibility(true);
  clock.visibility(false);
  expect(clock.pending()).toBe(0);
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
  const clock = animationClock();
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
  const initial = planetCenter(picture, 'saturn');
  fireEvent.click(screen.getByRole('button', { name: 'Umlauf starten' }));
  clock.advance(10_000);
  expect(planetCenter(picture, 'saturn')).not.toEqual(initial);
  expect(picture).toHaveTextContent('?');
  for (const planet of planets) {
    expect(picture).not.toHaveTextContent(planet.name);
  }
  expect(picture.querySelectorAll('circle[stroke="#ffd17d"]')).toHaveLength(1);
  expect(picture.querySelectorAll('path')[5]).toHaveAttribute(
    'stroke',
    '#ffd17d',
  );
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
