import { act, fireEvent, render, screen } from '@testing-library/react';
import { afterEach, beforeEach, expect, it, vi } from 'vitest';
import GameStage from './GameStage';
import { drawWorms } from '../games/worms-draw';
import { activeWorm } from '../games/worms';

vi.mock('../games/worms-draw', () => ({ drawWorms: vi.fn() }));
const drawnGame = () => vi.mocked(drawWorms).mock.lastCall![1];
const start = () => {
  fireEvent.click(screen.getByRole('button', { name: 'Losspielen / Weiter' }));
  act(() => vi.advanceTimersByTime(32));
  return screen.getByRole('group', { name: 'Spielfeld Worms' });
};
beforeEach(() => {
  vi.useFakeTimers();
  vi.spyOn(HTMLCanvasElement.prototype, 'getContext').mockReturnValue({
    setTransform: vi.fn(),
  } as unknown as CanvasRenderingContext2D);
});
afterEach(() => {
  vi.useRealTimers();
  vi.restoreAllMocks();
  vi.unstubAllGlobals();
  vi.clearAllMocks();
});

it('zeigt Ziel, beide Teams und Schusswerte vor dem Start ohne aktive Spielzeit', () => {
  const finish = vi.fn();
  render(<GameStage gameId="worms" onFinish={finish} />);
  expect(document.activeElement?.tagName).toBe('H3');
  expect(document.activeElement).toHaveTextContent('Worms');
  expect(
    screen.getByText('Gewinne das Inselduell mit deinem Zweierteam.'),
  ).toBeVisible();
  expect(screen.getByText('Dein Team · 200 Energie')).toBeVisible();
  expect(screen.getByText('Computerteam · 200 Energie')).toBeVisible();
  expect(screen.getAllByRole('progressbar')).toHaveLength(4);
  expect(screen.getByRole('slider', { name: 'Winkel' })).toBeDisabled();
  expect(screen.getByRole('slider', { name: 'Winkel' })).toHaveAttribute(
    'aria-valuetext',
    '45 Grad',
  );
  expect(screen.getByRole('slider', { name: 'Stärke' })).toHaveAttribute(
    'aria-valuetext',
    '55 Prozent',
  );
  act(() => vi.advanceTimersByTime(32));
  const frames = vi.mocked(drawWorms).mock.calls.length;
  act(() => vi.advanceTimersByTime(50000));
  expect(drawWorms).toHaveBeenCalledTimes(frames);
  expect(drawnGame().elapsed).toBe(0);
  expect(finish).not.toHaveBeenCalled();
});

it('ändert Winkel, Stärke und Richtung über sichtbare Bedienelemente und lässt einen Schuss zu', () => {
  render(<GameStage gameId="worms" onFinish={vi.fn()} />);
  start();
  fireEvent.change(screen.getByRole('slider', { name: 'Winkel' }), {
    target: { value: '62' },
  });
  fireEvent.change(screen.getByRole('slider', { name: 'Stärke' }), {
    target: { value: '70' },
  });
  fireEvent.click(screen.getByRole('button', { name: '← Links' }));
  expect(screen.getByRole('button', { name: '← Links' })).toHaveAttribute(
    'aria-pressed',
    'true',
  );
  expect(screen.getByRole('slider', { name: 'Winkel' })).toHaveAttribute(
    'aria-valuetext',
    '62 Grad',
  );
  fireEvent.click(screen.getByRole('button', { name: 'Schießen' }));
  expect(screen.getByText('Der Schuss ist unterwegs.')).toBeVisible();
  expect(screen.getByRole('button', { name: 'Schießen' })).toBeDisabled();
  expect(screen.getByRole('status')).toHaveTextContent('62° und 70 %');
  act(() => vi.advanceTimersByTime(120));
  expect(drawnGame().projectile?.vx).toBeLessThan(0);
  expect(drawnGame().phase).toBe('flight');
  expect(
    screen.queryByRole('button', { name: 'Losspielen / Weiter' }),
  ).not.toBeInTheDocument();
});

it('bewegt begrenzt mit Pfeiltasten und ändert Schusswerte nur im fokussierten Spielfeld', () => {
  render(<GameStage gameId="worms" onFinish={vi.fn()} />);
  const field = start();
  const x = activeWorm(drawnGame())!.x;
  fireEvent.keyDown(field, { key: 'ArrowRight' });
  act(() => vi.advanceTimersByTime(150));
  fireEvent.keyUp(field, { key: 'ArrowRight' });
  expect(activeWorm(drawnGame())!.x).toBeGreaterThan(x);
  const stoppedX = activeWorm(drawnGame())!.x;
  act(() => vi.advanceTimersByTime(200));
  expect(activeWorm(drawnGame())!.x).toBe(stoppedX);
  fireEvent.keyDown(field, { key: 'ArrowUp' });
  fireEvent.keyDown(field, { key: 'w' });
  expect(screen.getByRole('slider', { name: 'Winkel' })).toHaveAttribute(
    'aria-valuetext',
    '50 Grad',
  );
  expect(screen.getByRole('slider', { name: 'Stärke' })).toHaveAttribute(
    'aria-valuetext',
    '60 Prozent',
  );
  const angle = screen.getByRole('slider', { name: 'Winkel' });
  act(() => angle.focus());
  fireEvent.keyDown(angle, { key: 'ArrowUp' });
  fireEvent.keyDown(angle, { key: 'p' });
  fireEvent.keyDown(angle, { key: ' ' });
  expect(screen.getByRole('slider', { name: 'Winkel' })).toHaveAttribute(
    'aria-valuetext',
    '50 Grad',
  );
  expect(screen.getByRole('button', { name: 'Schießen' })).toBeEnabled();
  expect(
    screen.queryByRole('button', { name: 'Losspielen / Weiter' }),
  ).not.toBeInTheDocument();
});

it('geht mit Bildschirmtasten und übergibt den Zug an den selbstständig spielenden Computer', () => {
  render(<GameStage gameId="worms" onFinish={vi.fn()} />);
  start();
  const x = activeWorm(drawnGame())!.x;
  fireEvent.click(screen.getByRole('button', { name: 'Gehen →' }));
  act(() => vi.advanceTimersByTime(120));
  expect(activeWorm(drawnGame())!.x).toBeGreaterThan(x);
  fireEvent.click(screen.getByRole('button', { name: 'Zug auslassen' }));
  expect(screen.getByText('Das Computerteam ist am Zug.')).toBeVisible();
  expect(screen.getByRole('button', { name: 'Zug auslassen' })).toBeDisabled();
  act(() => vi.advanceTimersByTime(14000));
  expect(
    screen.getByText('Du bist am Zug: bewegen, zielen, schießen.'),
  ).toBeVisible();
  expect(screen.getByRole('button', { name: 'Schießen' })).toBeEnabled();
  expect(screen.getByText(/Zug 3 \/ 24/)).toBeVisible();
});

it('pausiert explizit, bei Fenster- und Außenfokusverlust und räumt gehaltene Tasten auf', () => {
  const finish = vi.fn();
  const view = render(
    <>
      <GameStage gameId="worms" onFinish={finish} />
      <input aria-label="Außerhalb" />
    </>,
  );
  const field = start();
  fireEvent.keyDown(field, { key: 'ArrowRight' });
  fireEvent.keyDown(field, { key: 'p' });
  act(() => vi.advanceTimersByTime(32));
  const pausedX = activeWorm(drawnGame())!.x;
  const elapsed = drawnGame().elapsed;
  act(() => vi.advanceTimersByTime(10000));
  expect(drawnGame().elapsed).toBe(elapsed);
  start();
  act(() => vi.advanceTimersByTime(200));
  expect(activeWorm(drawnGame())!.x).toBe(pausedX);
  act(() => screen.getByRole('slider', { name: 'Stärke' }).focus());
  expect(
    screen.queryByRole('button', { name: 'Losspielen / Weiter' }),
  ).not.toBeInTheDocument();
  act(() => screen.getByRole('textbox', { name: 'Außerhalb' }).focus());
  expect(screen.getByRole('heading', { name: 'Deine Pause' })).toBeVisible();
  start();
  fireEvent(window, new Event('blur'));
  expect(screen.getByRole('heading', { name: 'Deine Pause' })).toBeVisible();
  expect(finish).not.toHaveBeenCalled();
  view.unmount();
  expect(vi.getTimerCount()).toBe(0);
});

it('pausiert bei verborgenem Fenster und beendet auch aus der Pause exakt einmal', () => {
  const finish = vi.fn();
  render(<GameStage gameId="worms" onFinish={finish} />);
  start();
  vi.spyOn(document, 'hidden', 'get').mockReturnValue(true);
  fireEvent(document, new Event('visibilitychange'));
  expect(screen.getByRole('heading', { name: 'Deine Pause' })).toBeVisible();
  fireEvent.click(screen.getByRole('button', { name: 'Runde beenden' }));
  expect(finish).toHaveBeenCalledExactlyOnceWith(0);
  expect(screen.getByRole('button', { name: 'Runde beenden' })).toBeDisabled();
  act(() => vi.advanceTimersByTime(20000));
  expect(finish).toHaveBeenCalledTimes(1);
});

it('beendet die begrenzte natürliche Runde mit sichtbarem Ergebnis und genau einem Callback', () => {
  const finish = vi.fn();
  render(<GameStage gameId="worms" onFinish={finish} />);
  start();
  for (let attempt = 0; attempt < 12 && !drawnGame().over; attempt++) {
    fireEvent.click(screen.getByRole('button', { name: 'Zug auslassen' }));
    act(() => vi.advanceTimersByTime(14000));
  }
  expect(finish).toHaveBeenCalledTimes(1);
  expect(finish).toHaveBeenCalledWith(drawnGame().score);
  expect(screen.getByRole('button', { name: 'Runde beenden' })).toBeDisabled();
  expect(screen.getByRole('status')).toHaveTextContent(
    /gewonnen|unentschieden/,
  );
  act(() => vi.advanceTimersByTime(20000));
  expect(finish).toHaveBeenCalledTimes(1);
});

it('übernimmt reduzierte Bewegung und Retina-Auflösung ohne den Spielstand neu zu starten', () => {
  const preference = {
    matches: true,
    addEventListener: vi.fn(),
    removeEventListener: vi.fn(),
  };
  vi.stubGlobal(
    'matchMedia',
    vi.fn(() => preference),
  );
  vi.spyOn(window, 'devicePixelRatio', 'get').mockReturnValue(2);
  const view = render(<GameStage gameId="worms" onFinish={vi.fn()} />);
  start();
  expect(
    screen.getByRole('checkbox', { name: 'Weniger Bewegung' }),
  ).toBeChecked();
  expect(vi.mocked(drawWorms).mock.lastCall![2]).toBe(true);
  const game = drawnGame();
  const canvas = screen.getByLabelText(
    'Inselduell mit vier Würmern',
  ) as HTMLCanvasElement;
  expect(canvas.width).toBe(1280);
  expect(canvas.height).toBe(800);
  fireEvent.click(screen.getByRole('checkbox', { name: 'Weniger Bewegung' }));
  act(() => vi.advanceTimersByTime(32));
  expect(drawnGame()).toBe(game);
  expect(vi.mocked(drawWorms).mock.lastCall![2]).toBe(false);
  preference.matches = true;
  act(() => preference.addEventListener.mock.calls[0][1]());
  expect(
    screen.getByRole('checkbox', { name: 'Weniger Bewegung' }),
  ).toBeChecked();
  view.unmount();
  expect(preference.removeEventListener).toHaveBeenCalledWith(
    'change',
    preference.addEventListener.mock.calls[0][1],
  );
});
