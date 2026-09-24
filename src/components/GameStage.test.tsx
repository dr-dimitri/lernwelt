import { act, fireEvent, render, screen } from '@testing-library/react';
import { afterEach, beforeEach, expect, it, vi } from 'vitest';
import GameStage from './GameStage';
vi.mock('../games/draw', () => ({ drawGame: vi.fn() }));
beforeEach(() => {
  vi.useFakeTimers();
  Element.prototype.scrollIntoView = vi.fn();
  vi.spyOn(HTMLCanvasElement.prototype, 'getContext').mockReturnValue(
    {} as CanvasRenderingContext2D,
  );
});
afterEach(() => {
  vi.useRealTimers();
  vi.restoreAllMocks();
});
it('startet erst auf Wunsch, pausiert per Bildschirmtaste und zählt nur aktive Spielzeit', () => {
  const finish = vi.fn();
  render(<GameStage gameId="chickens" onFinish={finish} />);
  act(() => vi.advanceTimersByTime(50000));
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
