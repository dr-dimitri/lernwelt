import { render, screen } from '@testing-library/react';
import { expect, it } from 'vitest';
import { AdventureScene, MultiplicationHint } from './MultiplicationArt';

it('zeigt am Etappenende das gerade fertige Inselprojekt und danach das nächste', () => {
  const { rerender } = render(
    <AdventureScene
      world="island"
      design="scout"
      palette="mint"
      progress={8}
      completed={1}
    />,
  );
  expect(screen.getByRole('img')).toHaveAccessibleName(/Brücke: 8 von 8/);
  rerender(
    <AdventureScene
      world="island"
      design="scout"
      palette="mint"
      progress={0}
      completed={1}
    />,
  );
  expect(screen.getByRole('img')).toHaveAccessibleName(/Baumhaus: 0 von 8/);
  rerender(
    <AdventureScene
      world="island"
      design="scout"
      palette="mint"
      progress={8}
      completed={6}
    />,
  );
  expect(screen.getByRole('img')).toHaveAccessibleName(/Leuchtturm: 8 von 8/);
  rerender(
    <AdventureScene
      world="island"
      design="scout"
      palette="mint"
      progress={0}
      completed={6}
    />,
  );
  expect(screen.getByRole('img')).toHaveAccessibleName(/Brücke: 0 von 8/);
});

it('verknüpft das Gruppenbild mit Teilaufgaben, ohne das Gesamtergebnis auszugeben', () => {
  const { container, rerender } = render(
    <MultiplicationHint left={6} right={7} />,
  );
  expect(screen.getByRole('img')).toHaveAccessibleName(/5 × 7 und 1 × 7/);
  expect(container).not.toHaveTextContent('42');
  expect(container.querySelectorAll('circle')).toHaveLength(42);
  rerender(<MultiplicationHint left={13} right={13} />);
  expect(screen.getByRole('img')).toHaveAccessibleName(/10 × 13 und 3 × 13/);
  expect(container).not.toHaveTextContent('169');
  expect(container.querySelectorAll('circle')).toHaveLength(0);
  expect(screen.getByText(/zum Quadrat/)).toBeVisible();
});

it('bietet bei einer einzelnen Reihe einen zutreffenden Rechenweg ohne leere Teilfläche', () => {
  render(<MultiplicationHint left={1} right={7} />);
  expect(screen.getByRole('img')).toHaveAccessibleName(
    /1 Reihe mit je 7 Plätzen/,
  );
  expect(screen.queryByText(/0 ×/)).not.toBeInTheDocument();
});
