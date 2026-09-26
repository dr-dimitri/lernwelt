import { useState } from 'react';
import { render, screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { expect, it, vi } from 'vitest';
import type { NumberLineDiagram } from '../domain/number-line';
import NumberLine from './NumberLine';

const ray: NumberLineDiagram = {
  kind: 'ray',
  mode: 'read',
  min: 0,
  max: 10,
  step: 1,
  labels: [0, 5, 10],
  markers: [{ label: 'A', value: 3 }],
};

const place: NumberLineDiagram = { ...ray, mode: 'place', markers: [] };

function Controlled({ diagram = place }: { diagram?: NumberLineDiagram }) {
  const [value, setValue] = useState('');
  return <NumberLine diagram={diagram} value={value} onChange={setValue} />;
}

it('beschreibt Abstände, sichtbare Zahlen und Markerpositionen ohne den abgelesenen Wert vorzusagen', async () => {
  const user = userEvent.setup();
  render(<NumberLine diagram={ray} value="" onChange={vi.fn()} />);
  const picture = screen.getByRole('img', { name: 'Zahlenstrahl' });
  expect(picture).toHaveAccessibleDescription(
    '11 Teilstriche mit gleich großen Abständen. Von links gezählt: 1. Teilstrich: 0; 6. Teilstrich: 5; 11. Teilstrich: 10. Punkt A steht am 4. Teilstrich von links.',
  );
  expect(screen.queryByText('3')).not.toBeInTheDocument();
  expect(screen.queryByRole('radio')).not.toBeInTheDocument();
  await user.click(screen.getByText('Bild in Worten'));
  expect(screen.getByText(/11 Teilstriche/, { selector: 'p' })).toBeVisible();
});

it('beginnt ohne Auswahl und markiert mit einem Klick genau den gewählten Teilstrich', async () => {
  const user = userEvent.setup();
  render(<Controlled />);
  expect(screen.getAllByRole('radio')).toHaveLength(11);
  expect(
    screen.queryByRole('radio', { checked: true }),
  ).not.toBeInTheDocument();
  expect(screen.getByRole('status')).toHaveTextContent(
    'Noch kein Punkt gewählt',
  );
  await user.click(
    screen.getByRole('radio', { name: '8. Teilstrich von links' }),
  );
  expect(screen.getByRole('radio', { checked: true })).toHaveAccessibleName(
    '8. Teilstrich von links',
  );
  expect(screen.getByRole('status')).toHaveTextContent(
    'Dein Punkt steht am 8. Teilstrich von links.',
  );
  expect(screen.queryByText('7')).not.toBeInTheDocument();
});

it('bedient den ganzen Bereich per Tastatur und bleibt an den Rändern stehen', async () => {
  const user = userEvent.setup();
  render(<Controlled />);
  const radios = screen.getAllByRole('radio');
  const scrollStart = vi.fn();
  const scrollEnd = vi.fn();
  radios[0].scrollIntoView = scrollStart;
  radios[10].scrollIntoView = scrollEnd;
  await user.tab();
  expect(radios[0]).toHaveFocus();
  expect(
    screen.queryByRole('radio', { checked: true }),
  ).not.toBeInTheDocument();
  await user.keyboard('{ArrowRight}');
  expect(radios[1]).toHaveFocus();
  expect(radios[1]).toHaveAttribute('aria-checked', 'true');
  await user.keyboard('{End}{ArrowRight}');
  expect(radios[10]).toHaveFocus();
  expect(radios[10]).toHaveAttribute('aria-checked', 'true');
  expect(scrollEnd).toHaveBeenLastCalledWith({
    block: 'nearest',
    inline: 'center',
  });
  await user.keyboard('{Home}{ArrowLeft}');
  expect(radios[0]).toHaveFocus();
  expect(radios[0]).toHaveAttribute('aria-checked', 'true');
  expect(scrollStart).toHaveBeenLastCalledWith({
    block: 'nearest',
    inline: 'center',
  });
  await user.tab();
  expect(screen.getByText('Bild in Worten')).toHaveFocus();
});

it('erlaubt Leertaste und Enter ohne automatisches Absenden des Formulars', async () => {
  const user = userEvent.setup();
  const submit = vi.fn((event) => event.preventDefault());
  render(
    <form onSubmit={submit}>
      <Controlled />
    </form>,
  );
  await user.tab();
  await user.keyboard(' ');
  expect(screen.getByRole('radio', { checked: true })).toHaveAccessibleName(
    '1. Teilstrich von links, beschriftet mit 0',
  );
  await user.keyboard('{Enter}');
  expect(submit).not.toHaveBeenCalled();
});

it('überträgt die tatsächliche negative Koordinate und setzt eine kontrollierte Auswahl zurück', async () => {
  const user = userEvent.setup();
  const change = vi.fn();
  const diagram: NumberLineDiagram = {
    kind: 'line',
    mode: 'place',
    min: -100,
    max: 100,
    step: 25,
    labels: [-100, 0, 100],
    markers: [],
  };
  const { rerender } = render(
    <NumberLine diagram={diagram} value="" onChange={change} />,
  );
  await user.click(
    screen.getByRole('radio', { name: '2. Teilstrich von links' }),
  );
  expect(change).toHaveBeenLastCalledWith('-75');
  expect(
    screen.queryByRole('radio', { checked: true }),
  ).not.toBeInTheDocument();
  rerender(<NumberLine diagram={diagram} value="-75" onChange={change} />);
  expect(screen.getByRole('radio', { checked: true })).toHaveAccessibleName(
    '2. Teilstrich von links',
  );
  rerender(<NumberLine diagram={diagram} value="" onChange={change} />);
  expect(
    screen.queryByRole('radio', { checked: true }),
  ).not.toBeInTheDocument();
  expect(screen.getAllByRole('radio')[0]).toHaveAttribute('tabindex', '0');
});

it('verhindert Auswahl bei disabled und im deaktivierten übergeordneten Fieldset', async () => {
  const user = userEvent.setup();
  const change = vi.fn();
  const { rerender } = render(
    <NumberLine diagram={place} value="" onChange={change} disabled />,
  );
  expect(
    screen.getAllByRole('radio').every((radio) => radio.matches(':disabled')),
  ).toBe(true);
  await user.click(screen.getAllByRole('radio')[2]);
  expect(change).not.toHaveBeenCalled();
  rerender(
    <fieldset disabled>
      <NumberLine diagram={place} value="" onChange={change} />
    </fieldset>,
  );
  await user.click(screen.getAllByRole('radio')[2]);
  expect(change).not.toHaveBeenCalled();
});

it('zeigt große Zahlen mit lesbarer Tausendergruppierung und beschreibt eine verschobene Skala', () => {
  const diagram: NumberLineDiagram = {
    kind: 'line',
    mode: 'read',
    min: 950_000,
    max: 1_000_000,
    step: 10_000,
    labels: [950_000, 1_000_000],
    markers: [{ label: 'B', value: 970_000 }],
  };
  render(<NumberLine diagram={diagram} value="" onChange={vi.fn()} />);
  expect(
    screen.getByText('1 000 000', { selector: 'text' }),
  ).toBeInTheDocument();
  expect(
    screen.getByRole('img', { name: 'Zahlengerade' }),
  ).toHaveAccessibleDescription(
    '6 Teilstriche mit gleich großen Abständen. Von links gezählt: 1. Teilstrich: 950\u00a0000; 6. Teilstrich: 1\u00a0000\u00a0000. Punkt B steht am 3. Teilstrich von links.',
  );
  expect(screen.queryByText('970 000')).not.toBeInTheDocument();
});
