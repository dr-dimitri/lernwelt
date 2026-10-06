import { fireEvent, render, screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { afterAll, beforeAll, expect, it, vi } from 'vitest';
import EarthModel from './EarthModel';

class TestPointerEvent extends MouseEvent {
  readonly pointerId: number;
  constructor(type: string, init: PointerEventInit = {}) {
    super(type, init);
    this.pointerId = init.pointerId ?? 1;
  }
}
beforeAll(() => vi.stubGlobal('PointerEvent', TestPointerEvent));
afterAll(() => vi.unstubAllGlobals());

function setup(props: Parameters<typeof EarthModel>[0] = {}) {
  const onSelect = vi.fn();
  render(<EarthModel selected="crust" onSelect={onSelect} {...props} />);
  const svg = screen.getByLabelText(/Drehbare aufgeschnittene Erdkugel/);
  const layer = screen.getByRole('button', {
    name: props.guessing ? 'Bereich A im Modell' : 'Erdkruste im Modell',
  });
  const target = layer.querySelector('path')!;
  const captured = new Set<number>();
  const setPointerCapture = vi.fn((pointerId: number) =>
    captured.add(pointerId),
  );
  const releasePointerCapture = vi.fn((pointerId: number) =>
    captured.delete(pointerId),
  );
  Object.assign(target, {
    setPointerCapture,
    releasePointerCapture,
    hasPointerCapture: (pointerId: number) => captured.has(pointerId),
  });
  return {
    svg,
    layer,
    target,
    onSelect,
    setPointerCapture,
    releasePointerCapture,
  };
}

it('dreht per Tastatur echte Schnittgeometrie, begrenzt die Sicht und setzt sie ohne Auswahländerung zurück', async () => {
  const user = userEvent.setup();
  const { svg, target, onSelect, layer } = setup();
  const initialPath = target.getAttribute('d');
  const right = screen.getByRole('button', { name: 'Nach rechts drehen' });
  right.focus();
  await user.keyboard('{Enter}');
  expect(svg).toHaveAttribute('data-earth-rotation', '10');
  expect(target.getAttribute('d')).not.toBe(initialPath);
  expect(layer).toHaveAttribute('aria-pressed', 'true');
  for (let i = 0; i < 3; i++) await user.keyboard(' ');
  expect(svg).toHaveAttribute('data-earth-rotation', '35');
  expect(right).toBeDisabled();
  const reset = screen.getByRole('button', { name: 'Ansicht zurücksetzen' });
  reset.focus();
  await user.keyboard('{Enter}');
  expect(svg).toHaveAttribute('data-earth-rotation', '0');
  expect(target).toHaveAttribute('d', initialPath!);
  expect(reset).toBeDisabled();
  const left = screen.getByRole('button', { name: 'Nach links drehen' });
  for (let i = 0; i < 4; i++) await user.click(left);
  expect(svg).toHaveAttribute('data-earth-rotation', '-35');
  expect(left).toBeDisabled();
  expect(onSelect).not.toHaveBeenCalled();
});

it('trennt Ziehen von der Schichtwahl und erhält einen anschließenden normalen Klick', () => {
  const { svg, target, onSelect, setPointerCapture, releasePointerCapture } =
    setup();
  fireEvent.pointerDown(target, {
    pointerId: 7,
    button: 0,
    clientX: 200,
    clientY: 200,
  });
  expect(setPointerCapture).toHaveBeenCalledExactlyOnceWith(7);
  fireEvent.pointerMove(target, { pointerId: 8, clientX: 900, clientY: 200 });
  expect(svg).toHaveAttribute('data-earth-rotation', '0');
  fireEvent.pointerMove(target, { pointerId: 7, clientX: 300, clientY: 200 });
  expect(svg).toHaveAttribute('data-earth-rotation', '18');
  expect(svg).toHaveAttribute('data-dragging', 'true');
  fireEvent.pointerUp(target, { pointerId: 7, clientX: 300, clientY: 200 });
  expect(releasePointerCapture).toHaveBeenCalledExactlyOnceWith(7);
  expect(svg).not.toHaveAttribute('data-dragging');
  fireEvent.click(target);
  expect(onSelect).not.toHaveBeenCalled();
  fireEvent.pointerDown(target, {
    pointerId: 9,
    button: 0,
    clientX: 210,
    clientY: 220,
  });
  fireEvent.pointerUp(target, { pointerId: 9, clientX: 211, clientY: 221 });
  fireEvent.click(target);
  expect(onSelect).toHaveBeenCalledExactlyOnceWith('crust');
});

it.each(['pointerCancel', 'lostPointerCapture'] as const)(
  'beendet %s ohne spätere Bewegung oder unbeabsichtigte Auswahl',
  (kind) => {
    const { svg, target, onSelect } = setup();
    fireEvent.pointerDown(target, {
      pointerId: 3,
      button: 0,
      clientX: 200,
      clientY: 200,
    });
    fireEvent.pointerMove(target, { pointerId: 3, clientX: 250, clientY: 200 });
    fireEvent[kind](target, { pointerId: 3 });
    fireEvent.pointerMove(target, { pointerId: 3, clientX: 350, clientY: 200 });
    expect(svg).toHaveAttribute('data-earth-rotation', '9');
    expect(svg).not.toHaveAttribute('data-dragging');
    fireEvent.click(target);
    expect(onSelect).not.toHaveBeenCalled();
    fireEvent.pointerDown(target, {
      pointerId: 4,
      button: 0,
      clientX: 200,
      clientY: 200,
    });
    fireEvent.pointerUp(target, { pointerId: 4, clientX: 200, clientY: 200 });
    fireEvent.click(target);
    expect(onSelect).toHaveBeenCalledExactlyOnceWith('crust');
  },
);

it('setzt einen Oberflächendrag fort, wenn sich dessen ursprüngliches Dreieck beim Drehen entfernt', async () => {
  const user = userEvent.setup();
  const { svg, onSelect } = setup();
  for (let i = 0; i < 4; i++)
    await user.click(
      screen.getByRole('button', { name: 'Nach rechts drehen' }),
    );
  const originalTriangle = [...svg.querySelectorAll('polygon')].at(-1)!;
  let captured = false;
  Object.assign(svg, {
    setPointerCapture: () => {
      captured = true;
    },
    hasPointerCapture: () => captured,
    releasePointerCapture: () => {
      captured = false;
    },
  });
  fireEvent.pointerDown(originalTriangle, {
    pointerId: 6,
    button: 0,
    clientX: 200,
    clientY: 200,
  });
  expect(captured).toBe(true);
  fireEvent.pointerMove(svg, { pointerId: 6, clientX: 0, clientY: 200 });
  expect(originalTriangle).not.toBeInTheDocument();
  expect(svg).toHaveAttribute('data-earth-rotation', '-1');
  fireEvent.pointerMove(svg, { pointerId: 6, clientX: -100, clientY: 200 });
  expect(svg).toHaveAttribute('data-earth-rotation', '-19');
  fireEvent.pointerUp(svg, { pointerId: 6, clientX: -100, clientY: 200 });
  expect(captured).toBe(false);
  expect(svg).not.toHaveAttribute('data-dragging');
  fireEvent.click(svg);
  expect(onSelect).not.toHaveBeenCalled();
});

it('erhält vertikales Scrollen und dreht weder beim rechten Mausklick noch beim Tippen', () => {
  const { svg, target, onSelect } = setup();
  fireEvent.pointerDown(target, {
    pointerId: 1,
    button: 2,
    clientX: 200,
    clientY: 200,
  });
  fireEvent.pointerMove(target, { pointerId: 1, clientX: 300, clientY: 200 });
  expect(svg).toHaveAttribute('data-earth-rotation', '0');
  fireEvent.pointerDown(target, {
    pointerId: 2,
    button: 0,
    clientX: 200,
    clientY: 200,
  });
  const verticalMove = new TestPointerEvent('pointermove', {
    pointerId: 2,
    clientX: 203,
    clientY: 260,
    bubbles: true,
    cancelable: true,
  });
  fireEvent(target, verticalMove);
  expect(verticalMove.defaultPrevented).toBe(false);
  expect(svg).toHaveAttribute('data-earth-rotation', '0');
  fireEvent.pointerUp(target, { pointerId: 2, clientX: 203, clientY: 260 });
  fireEvent.click(target);
  expect(onSelect).not.toHaveBeenCalled();
});

it('sperrt nur die Antwortwahl, erlaubt weiter Drehung und verrät im Quiz keine Schichtnamen', async () => {
  const user = userEvent.setup();
  const { svg, target, layer, onSelect } = setup({
    guessing: true,
    disabled: true,
    selected: 'B',
  });
  expect(svg).not.toHaveTextContent(
    /Erdkruste|Erdmantel|Äußerer Erdkern|Innerer Erdkern|isometrisch/i,
  );
  expect(layer).toHaveAttribute('aria-disabled', 'true');
  expect(layer).not.toHaveAttribute('tabindex');
  fireEvent.click(target);
  fireEvent.keyDown(layer, { key: 'Enter' });
  fireEvent.keyDown(layer, { key: ' ' });
  expect(screen.getByRole('button', { name: 'Bereich A' })).toBeDisabled();
  await user.click(screen.getByRole('button', { name: 'Nach rechts drehen' }));
  expect(svg).toHaveAttribute('data-earth-rotation', '10');
  fireEvent.pointerDown(target, {
    pointerId: 5,
    button: 0,
    clientX: 100,
    clientY: 200,
  });
  fireEvent.pointerMove(target, { pointerId: 5, clientX: 0, clientY: 200 });
  fireEvent.pointerUp(target, { pointerId: 5, clientX: 0, clientY: 200 });
  expect(svg).toHaveAttribute('data-earth-rotation', '-8');
  expect(onSelect).not.toHaveBeenCalled();
});
