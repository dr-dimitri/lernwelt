import { render, screen, within } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { expect, it } from 'vitest';
import NatureGames from './NatureGames';

it('erlaubt falsche Versuche, erklärt richtige Zuordnungen und schließt das Stoff-Labor ab', async () => {
  const user = userEvent.setup();
  render(<NatureGames difficulty="koenner" />);
  expect(screen.getByRole('button', { name: 'Fest' })).toBeDisabled();
  await user.click(
    screen.getByRole('button', { name: 'Weit verteilt und frei beweglich' }),
  );
  await user.click(screen.getByRole('button', { name: 'Fest' }));
  expect(screen.getByRole('status')).toHaveTextContent('Das passt noch nicht');
  expect(screen.getByText('0 von 3 entdeckt')).toBeVisible();
  await user.click(screen.getByRole('button', { name: 'Gasförmig' }));
  expect(screen.getByRole('status')).toHaveTextContent(
    'Die Teilchen haben viel Abstand',
  );
  expect(
    screen.getByRole('button', { name: 'Weit verteilt und frei beweglich' }),
  ).toBeDisabled();
  await user.click(
    screen.getByRole('button', { name: 'Nah beieinander und verschiebbar' }),
  );
  await user.click(screen.getByRole('button', { name: 'Flüssig' }));
  await user.click(
    screen.getByRole('button', { name: 'An festen Plätzen, aber nicht still' }),
  );
  await user.click(screen.getByRole('button', { name: 'Fest' }));
  expect(screen.getByText('Alles entdeckt!')).toBeVisible();
  expect(
    screen.getByRole('heading', { name: 'Alles entdeckt!' }),
  ).toHaveFocus();
  expect(screen.getByText('3 von 3 entdeckt')).toBeVisible();
  await user.click(
    screen.getByRole('button', { name: 'Noch einmal erforschen' }),
  );
  expect(screen.getByText('0 von 3 entdeckt')).toBeVisible();
  expect(screen.queryByText('Alles entdeckt!')).not.toBeInTheDocument();
  expect(
    screen.getByRole('button', { name: 'Weit verteilt und frei beweglich' }),
  ).toBeEnabled();
});

it('ordnet Blütenfunktionen zu und setzt Tipps und Auswahl beim Neustart zurück', async () => {
  const user = userEvent.setup();
  render(<NatureGames difficulty="koenner" />);
  await user.click(screen.getByRole('button', { name: /Pflanzen-Werkstatt/ }));
  await user.click(screen.getByRole('button', { name: 'Forscher-Tipp' }));
  expect(screen.getByText(/Pollen = Blütenstaub/)).toBeVisible();
  await user.click(
    screen.getByRole('button', { name: 'Hier liegen die Samenanlagen' }),
  );
  await user.click(screen.getByRole('button', { name: 'Fruchtknoten' }));
  expect(screen.getByRole('status')).toHaveTextContent('Nach der Befruchtung');
  expect(screen.getByText('1 von 4 entdeckt')).toBeVisible();
  await user.click(
    screen.getByRole('button', { name: 'Bildet Pollen im Staubbeutel' }),
  );
  await user.click(screen.getByRole('button', { name: 'Runde neu starten' }));
  expect(screen.getByText('0 von 4 entdeckt')).toBeVisible();
  expect(screen.getByRole('button', { name: 'Forscher-Tipp' })).toHaveAttribute(
    'aria-expanded',
    'false',
  );
  expect(screen.queryByText(/Pollen = Blütenstaub/)).not.toBeInTheDocument();
  expect(
    screen.getByRole('button', { name: 'Bildet Pollen im Staubbeutel' }),
  ).toHaveAttribute('aria-pressed', 'false');
  expect(screen.getByRole('button', { name: 'Staubblatt' })).toBeDisabled();
});

it('baut auf Streber ein Nahrungsnetz mit Abzweigung und zählt doppelte Verbindungen nicht erneut', async () => {
  const user = userEvent.setup();
  render(<NatureGames difficulty="streber" />);
  await user.click(screen.getByRole('button', { name: /Wiesen-Netz/ }));
  await user.click(screen.getByRole('button', { name: 'Nahrung: Frosch' }));
  await user.click(screen.getByRole('button', { name: 'Grashüpfer' }));
  expect(screen.getByRole('status')).toHaveTextContent(
    'Pfeil passt hier noch nicht',
  );
  expect(screen.getByText('0 von 4 Verbindungen')).toBeVisible();
  for (const [food, eater] of [
    ['Gras', 'Grashüpfer'],
    ['Gras', 'Grashüpfer'],
    ['Grashüpfer', 'Frosch'],
    ['Frosch', 'Weißstorch'],
    ['Grashüpfer', 'Weißstorch'],
  ]) {
    await user.click(screen.getByRole('button', { name: `Nahrung: ${food}` }));
    await user.click(screen.getByRole('button', { name: eater }));
  }
  expect(screen.getByText('4 von 4 Verbindungen')).toBeVisible();
  expect(
    within(
      screen.getByRole('list', { name: 'Entdeckte Nahrungsbeziehungen' }),
    ).getAllByRole('listitem'),
  ).toHaveLength(4);
  expect(screen.getByText('Deine Wiese ist verbunden!')).toBeVisible();
  expect(
    screen.getByRole('heading', { name: 'Deine Wiese ist verbunden!' }),
  ).toHaveFocus();
  expect(screen.getByRole('button', { name: 'Nahrung: Gras' })).toBeDisabled();
  await user.click(
    screen.getByRole('button', { name: 'Noch einmal erforschen' }),
  );
  expect(screen.getByText('0 von 4 Verbindungen')).toBeVisible();
  expect(
    screen.queryByRole('list', { name: 'Entdeckte Nahrungsbeziehungen' }),
  ).not.toBeInTheDocument();
});

it('bezeichnet eine echte Zusatzbeziehung im Ketten-Modus nicht als fachlich falsch', async () => {
  const user = userEvent.setup();
  render(<NatureGames difficulty="koenner" />);
  await user.click(screen.getByRole('button', { name: /Wiesen-Netz/ }));
  await user.click(screen.getByRole('button', { name: 'Nahrung: Grashüpfer' }));
  await user.click(screen.getByRole('button', { name: 'Weißstorch' }));
  expect(screen.getByRole('status')).toHaveTextContent(
    'Gut beobachtet: Weißstörche fressen auch Grashüpfer!',
  );
  expect(screen.getByText('0 von 3 Verbindungen')).toBeVisible();
});

it('wechselt die fachliche Schwierigkeit und verwirft dabei die alte Runde', async () => {
  const user = userEvent.setup();
  const { rerender } = render(<NatureGames difficulty="vorschule" />);
  await user.click(screen.getByRole('button', { name: 'Ein Eiswürfel' }));
  await user.click(screen.getByRole('button', { name: 'Fest' }));
  expect(screen.getByText('1 von 3 entdeckt')).toBeVisible();
  rerender(<NatureGames difficulty="streber" />);
  expect(screen.getByText('0 von 4 entdeckt')).toBeVisible();
  expect(
    screen.getByRole('button', { name: 'Fest → flüssig' }),
  ).toHaveAttribute('aria-pressed', 'false');
  expect(screen.getByRole('button', { name: 'Schmelzen' })).toBeDisabled();
  expect(
    screen.queryByRole('button', { name: 'Ein Eiswürfel' }),
  ).not.toBeInTheDocument();
  await user.click(screen.getByRole('button', { name: 'Fest → flüssig' }));
  await user.click(screen.getByRole('button', { name: 'Schmelzen' }));
  expect(screen.getByRole('status')).toHaveTextContent(
    'Beim Schmelzen wird ein fester Stoff flüssig',
  );
});

it('ist vollständig mit der Tastatur bedienbar und startet beim Spielwechsel neu', async () => {
  const user = userEvent.setup();
  render(<NatureGames difficulty="vorschule" />);
  for (let i = 0; i < 4; i++) await user.tab();
  expect(screen.getByRole('button', { name: 'Ein Eiswürfel' })).toHaveFocus();
  await user.keyboard('{Enter}');
  await user.tab();
  await user.tab();
  await user.tab();
  expect(screen.getByRole('button', { name: 'Fest' })).toHaveFocus();
  await user.keyboard(' ');
  expect(screen.getByText('1 von 3 entdeckt')).toBeVisible();
  expect(
    screen.getByRole('button', { name: 'Unsichtbarer Wasserdampf' }),
  ).toHaveFocus();
  await user.click(screen.getByRole('button', { name: /Wiesen-Netz/ }));
  expect(screen.getByText('0 von 2 Verbindungen')).toBeVisible();
  await user.click(screen.getByRole('button', { name: /Stoff-Labor/ }));
  expect(screen.getByText('0 von 3 entdeckt')).toBeVisible();
  expect(screen.getByText(/ohne Lernpunkte/)).toBeVisible();
});
