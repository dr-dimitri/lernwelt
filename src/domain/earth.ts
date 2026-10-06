export const earthLayers = [
  {
    id: 'crust',
    name: 'Erdkruste',
    marker: 'A',
    color: '#88c6b2',
    radius: 214,
    material: 'Gestein',
    state: 'Fest',
    symbol: '▰',
    tagline: 'Unser Boden ist nur die dünne Außenschicht.',
    facts: [
      'Auf der Kruste liegen Kontinente und Ozeane.',
      'Im Modell ist sie extra dick gezeichnet, damit du sie gut auswählen kannst.',
    ],
  },
  {
    id: 'mantle',
    name: 'Erdmantel',
    marker: 'B',
    color: '#ef9864',
    radius: 190,
    material: 'Gestein',
    state: 'Überwiegend fest',
    symbol: '▰',
    tagline: 'Eine sehr dicke Schicht aus heißem Gestein.',
    facts: [
      'Über sehr lange Zeit kann sich das Gestein langsam verformen.',
      'Der Mantel ist kein weltweiter Ozean aus flüssiger Lava.',
    ],
  },
  {
    id: 'outer-core',
    name: 'Äußerer Erdkern',
    marker: 'C',
    color: '#e7bb54',
    radius: 110,
    material: 'Überwiegend Metall',
    state: 'Flüssig',
    symbol: '≈',
    tagline: 'Hier ist das heiße Metall flüssig.',
    facts: [
      'Diese Schicht umgibt den inneren Kern.',
      'Sie besteht vor allem aus Eisen.',
    ],
  },
  {
    id: 'inner-core',
    name: 'Innerer Erdkern',
    marker: 'D',
    color: '#fff0b4',
    radius: 53,
    material: 'Überwiegend Metall',
    state: 'Fest',
    symbol: '▰',
    tagline: 'Sehr heiß und trotzdem fest!',
    facts: [
      'Der innere Kern liegt in der Mitte der Erde.',
      'Der Druck ist hier besonders hoch. Druck bedeutet starkes Zusammendrücken; er hält das Metall trotz großer Hitze fest.',
    ],
  },
] as const;
export type EarthLayerId = (typeof earthLayers)[number]['id'];
export const earthModelNote =
  'Vereinfachtes Modell: Farben und Schichtdicken sind nicht naturgetreu. Die Kruste ist vergrößert. Die Schichten sind keine hohlen Räume.';
export const earthStations = [
  { id: 'open', name: 'Öffne die Erde', symbol: '◒' },
  { id: 'travel', name: 'Reise zur Mitte', symbol: '↘' },
  { id: 'compare', name: 'Heiß und trotzdem fest?', symbol: '▰' },
] as const;
export type EarthStation = (typeof earthStations)[number]['id'];
