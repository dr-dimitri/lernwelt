import { act, fireEvent, render, screen } from '@testing-library/react';
import { afterEach, beforeEach, expect, it, vi } from 'vitest';
import GameStage from './GameStage';
import * as engine from '../games/engine';
import { drawGame } from '../games/draw';
const renderedGame = () => vi.mocked(drawGame).mock.lastCall![1];
vi.mock('../games/draw', () => ({ drawGame: vi.fn() }));
beforeEach(() => {
  vi.useFakeTimers();
  Element.prototype.scrollIntoView = vi.fn();
  vi.spyOn(HTMLCanvasElement.prototype, 'getContext').mockReturnValue({
    setTransform: vi.fn(),
  } as unknown as CanvasRenderingContext2D);
});
afterEach(() => {
  vi.useRealTimers();
  vi.restoreAllMocks();
});
it('zeichnet auf Retina scharf und trifft Hühner bei verkleinerter Anzeige weiterhin an der richtigen Position', () => {
  vi.spyOn(window, 'devicePixelRatio', 'get').mockReturnValue(2);
  render(<GameStage gameId="chickens" onFinish={vi.fn()} />);
  fireEvent.click(screen.getByRole('button', { name: 'Losspielen / Weiter' }));
  act(() => vi.advanceTimersByTime(32));
  const canvas = screen.getByLabelText('Hühner-Rummel', {
    selector: 'canvas',
  }) as HTMLCanvasElement;
  expect(canvas.width).toBe(1280);
  expect(canvas.height).toBe(800);
  vi.spyOn(canvas, 'getBoundingClientRect').mockReturnValue({
    left: 100,
    top: 100,
    width: 320,
    height: 200,
  } as DOMRect);
  const chicken = renderedGame().entities[0];
  fireEvent.pointerDown(canvas, {
    clientX: 100 + (chicken.x + chicken.w / 2) / 2,
    clientY: 100 + (chicken.y + chicken.h / 2) / 2,
  });
  act(() => vi.advanceTimersByTime(120));
  expect(screen.getByText('50 Spielpunkte')).toBeVisible();
});
it('startet erst auf Wunsch, pausiert per Bildschirmtaste und zählt nur aktive Spielzeit', () => {
  const finish = vi.fn();
  render(<GameStage gameId="chickens" onFinish={finish} />);
  act(() => vi.advanceTimersByTime(32));
  const initialFrames = vi.mocked(drawGame).mock.calls.length;
  act(() => vi.advanceTimersByTime(50000));
  expect(drawGame).toHaveBeenCalledTimes(initialFrames);
  fireEvent(window, new Event('resize'));
  expect(drawGame).toHaveBeenCalledTimes(initialFrames + 1);
  expect(finish).not.toHaveBeenCalled();
  fireEvent.click(screen.getByRole('button', { name: 'Losspielen / Weiter' }));
  const field = screen.getByRole('group', { name: 'Spielfeld Hühner-Rummel' });
  fireEvent.keyDown(field, { key: '1' });
  act(() => vi.advanceTimersByTime(200));
  expect(screen.getByText('50 Spielpunkte')).toBeVisible();
  const pause = screen.getByRole('button', { name: 'Pause' });
  // A pointer press must keep focus on the field until the pause click is processed.
  expect(fireEvent.pointerDown(pause)).toBe(false);
  fireEvent.click(pause);
  expect(
    screen.getByRole('button', { name: 'Losspielen / Weiter' }),
  ).toBeVisible();
  act(() => vi.advanceTimersByTime(50000));
  expect(finish).not.toHaveBeenCalled();
  fireEvent.click(screen.getByRole('button', { name: 'Losspielen / Weiter' }));
  act(() => vi.advanceTimersByTime(46000));
  expect(finish).toHaveBeenCalledExactlyOnceWith(50);
  act(() => vi.advanceTimersByTime(1000));
  expect(finish).toHaveBeenCalledTimes(1);
});
it('pausiert bei Fokusverlust und beendet eine Runde auch aus der Pause einmalig', () => {
  const finish = vi.fn();
  render(<GameStage gameId="runner" onFinish={finish} />);
  fireEvent.click(screen.getByRole('button', { name: 'Losspielen / Weiter' }));
  fireEvent(window, new Event('blur'));
  expect(
    screen.getByRole('button', { name: 'Losspielen / Weiter' }),
  ).toBeVisible();
  fireEvent.click(screen.getByRole('button', { name: 'Runde beenden' }));
  expect(finish).toHaveBeenCalledExactlyOnceWith(0);
  expect(screen.getByRole('button', { name: 'Runde beenden' })).toBeDisabled();
});

it('zeigt einen Treffer auch bei sofortiger Pause vor dem nächsten HUD-Intervall', () => {
  render(<GameStage gameId="chickens" onFinish={vi.fn()} />);
  fireEvent.click(screen.getByRole('button', { name: 'Losspielen / Weiter' }));
  act(() => vi.advanceTimersByTime(32));
  fireEvent.click(screen.getByRole('button', { name: 'Huhn 1' }));
  fireEvent.click(screen.getByRole('button', { name: 'Pause' }));
  act(() => vi.advanceTimersByTime(32));
  expect(screen.getByText('50 Spielpunkte')).toBeVisible();
});

it.each(['Enter', ' '])(
  'bewegt das Raumschiff beim Halten einer fokussierten Bildschirmtaste mit %s',
  (key) => {
    render(<GameStage gameId="space" onFinish={vi.fn()} />);
    fireEvent.click(
      screen.getByRole('button', { name: 'Losspielen / Weiter' }),
    );
    act(() => vi.advanceTimersByTime(32));
    const startX = renderedGame().x;
    const left = screen.getByRole('button', { name: '← Links' });
    act(() => left.focus());
    fireEvent.keyDown(left, { key });
    act(() => vi.advanceTimersByTime(200));
    expect(renderedGame().x).toBeLessThan(startX);
    fireEvent.keyUp(left, { key });
    const stoppedX = renderedGame().x;
    act(() => vi.advanceTimersByTime(200));
    expect(renderedGame().x).toBe(stoppedX);
  },
);

it('beschleunigt den Läufer per Bildschirmtaste und beendet das Halten beim Weiter-Tabben', () => {
  render(<GameStage gameId="runner" onFinish={vi.fn()} />);
  fireEvent.click(screen.getByRole('button', { name: 'Losspielen / Weiter' }));
  act(() => vi.advanceTimersByTime(32));
  const faster = screen.getByRole('button', { name: 'Schneller' });
  act(() => faster.focus());
  const x = renderedGame().x;
  fireEvent.keyDown(faster, { key: 'Enter' });
  act(() => vi.advanceTimersByTime(160));
  const accelerated = renderedGame().x - x;
  act(() => screen.getByRole('button', { name: 'Bremsen' }).focus());
  const beforeNormal = renderedGame().x;
  act(() => vi.advanceTimersByTime(160));
  const normal = renderedGame().x - beforeNormal;
  expect(accelerated).toBeGreaterThan(normal * 1.2);
});

it('bewegt bei barrierefreier Klick-Aktivierung kurz und lässt keine Taste klemmen', () => {
  const view = render(<GameStage gameId="space" onFinish={vi.fn()} />);
  fireEvent.click(screen.getByRole('button', { name: 'Losspielen / Weiter' }));
  act(() => vi.advanceTimersByTime(32));
  const x = renderedGame().x;
  fireEvent.click(screen.getByRole('button', { name: 'Rechts →' }), {
    detail: 0,
  });
  act(() => vi.advanceTimersByTime(160));
  expect(renderedGame().x).toBeGreaterThan(x);
  const stopped = renderedGame().x;
  act(() => vi.advanceTimersByTime(160));
  expect(renderedGame().x).toBe(stopped);
  fireEvent.click(screen.getByRole('button', { name: '← Links' }), {
    detail: 0,
  });
  fireEvent(window, new Event('blur'));
  act(() => vi.advanceTimersByTime(200));
  expect(renderedGame().x).toBe(stopped);
  view.unmount();
  expect(vi.getTimerCount()).toBe(0);
});

it('lässt direkte Pfeiltasten und Pointer-Halten mit Loslassen weiterhin zu', () => {
  render(<GameStage gameId="space" onFinish={vi.fn()} />);
  fireEvent.click(screen.getByRole('button', { name: 'Losspielen / Weiter' }));
  act(() => vi.advanceTimersByTime(32));
  const area = screen.getByRole('group', { name: 'Spielfeld Sternenwache' });
  const right = screen.getByRole('button', { name: 'Rechts →' });
  right.setPointerCapture = vi.fn();
  const start = renderedGame().x;
  fireEvent.keyDown(area, { key: 'ArrowLeft' });
  act(() => vi.advanceTimersByTime(160));
  fireEvent.keyUp(area, { key: 'ArrowLeft' });
  const left = renderedGame().x;
  expect(left).toBeLessThan(start);
  fireEvent.pointerDown(right, { pointerId: 1 });
  act(() => vi.advanceTimersByTime(160));
  fireEvent.pointerUp(right, { pointerId: 1 });
  expect(renderedGame().x).toBeGreaterThan(left);
  const stopped = renderedGame().x;
  act(() => vi.advanceTimersByTime(160));
  expect(renderedGame().x).toBe(stopped);
});

it('führt Ablegen einmal je Tastendruck aus und ignoriert automatische Tastenwiederholung', () => {
  const action = vi.spyOn(engine, 'actGame');
  render(<GameStage gameId="blocks" onFinish={vi.fn()} />);
  fireEvent.click(screen.getByRole('button', { name: 'Losspielen / Weiter' }));
  const drop = screen.getByRole('button', { name: 'Ablegen' });
  act(() => drop.focus());
  fireEvent.keyDown(drop, { key: 'Enter' });
  fireEvent.keyDown(drop, { key: 'Enter', repeat: true });
  fireEvent.keyUp(drop, { key: 'Enter' });
  expect(action).toHaveBeenCalledTimes(1);
  expect(action.mock.calls[0][1]).toBe('drop');
});

it('bewegt auch bei einem kurzen Tastendruck zwischen zwei Animationsframes', () => {
  render(<GameStage gameId="space" onFinish={vi.fn()} />);
  fireEvent.click(screen.getByRole('button', { name: 'Losspielen / Weiter' }));
  act(() => vi.advanceTimersByTime(32));
  const button = screen.getByRole('button', { name: '← Links' });
  act(() => button.focus());
  const x = renderedGame().x;
  fireEvent.keyDown(button, { key: 'Enter' });
  fireEvent.keyUp(button, { key: 'Enter' });
  act(() => vi.advanceTimersByTime(160));
  expect(renderedGame().x).toBeLessThan(x);
  const stopped = renderedGame().x;
  act(() => vi.advanceTimersByTime(160));
  expect(renderedGame().x).toBe(stopped);
});

it('pausiert mit P auch auf einer fokussierten Bildschirmtaste', () => {
  render(<GameStage gameId="space" onFinish={vi.fn()} />);
  fireEvent.click(screen.getByRole('button', { name: 'Losspielen / Weiter' }));
  const button = screen.getByRole('button', { name: '← Links' });
  act(() => button.focus());
  fireEvent.keyDown(button, { key: 'Enter' });
  fireEvent.keyDown(button, { key: 'p' });
  expect(
    screen.getByRole('button', { name: 'Losspielen / Weiter' }),
  ).toBeVisible();
  act(() => vi.advanceTimersByTime(200));
  expect(renderedGame().x).toBe(305);
});
