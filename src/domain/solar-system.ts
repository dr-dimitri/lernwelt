export interface SolarPlanet {
  readonly id:
    | 'mercury'
    | 'venus'
    | 'earth'
    | 'mars'
    | 'jupiter'
    | 'saturn'
    | 'uranus'
    | 'neptune';
  readonly name: string;
  readonly order: number;
  readonly image: string;
  readonly imageAlt: string;
  readonly imageCredit: string;
  readonly imageSource: string;
  readonly tagline: string;
  readonly facts: readonly string[];
  readonly color: string;
}

export const planets: readonly SolarPlanet[] = [
  {
    id: 'mercury',
    name: 'Merkur',
    order: 1,
    image: '/images/solar-system/mercury.webp',
    imageAlt:
      'Merkur als graue Kugel mit vielen Kratern. Bildmosaik der Raumsonde MESSENGER.',
    imageCredit:
      'NASA/Johns Hopkins University Applied Physics Laboratory/Carnegie Institution of Washington',
    imageSource: 'https://science.nasa.gov/photojournal/mercury-globe-0n-180e/',
    tagline: 'Klein, felsig und ganz nah an der Sonne.',
    facts: [
      'Merkur ist ein Gesteinsplanet. Er hat einen festen Boden.',
      'Er ist der kleinste Planet und der Sonne am nächsten.',
      'Tagsüber wird es sehr heiß, nachts sehr kalt.',
      'Er hat viele Krater. Sie entstanden durch Einschläge aus dem All.',
    ],
    color: '#bdb4aa',
  },
  {
    id: 'venus',
    name: 'Venus',
    order: 2,
    image: '/images/solar-system/venus.webp',
    imageAlt:
      'Venus mit hellen, dichten Wolken. Aufnahme von Mariner 10 mit bearbeiteten Farben.',
    imageCredit: 'NASA/JPL-Caltech',
    imageSource: 'https://science.nasa.gov/photojournal/venus-from-mariner-10/',
    tagline: 'Unter den Wolken glüht eine heiße Welt.',
    facts: [
      'Venus ist ein Gesteinsplanet und fast so groß wie die Erde.',
      'Eine dichte Gashülle hält Wärme fest. Sie heißt Atmosphäre.',
      'Venus ist der heißeste Planet, obwohl Merkur näher an der Sonne liegt.',
      'Ihre dichten Wolken verdecken den Boden.',
    ],
    color: '#efcf9b',
  },
  {
    id: 'earth',
    name: 'Erde',
    order: 3,
    image: '/images/solar-system/earth.webp',
    imageAlt:
      'Die Erde mit blauen Ozeanen, Afrika und weißen Wolken. Foto der Apollo-17-Besatzung.',
    imageCredit: 'NASA',
    imageSource: 'https://www.nasa.gov/image-article/apollo-17-blue-marble/',
    tagline: 'Unser blauer Heimatplanet voller Leben.',
    facts: [
      'Die Erde ist ein Gesteinsplanet mit Ozeanen und Kontinenten.',
      'Flüssiges Wasser und eine schützende Lufthülle helfen dem Leben.',
      'Sie ist der einzige Planet, auf dem wir bisher Leben kennen.',
      'Sauberes Wasser und saubere Luft sind kostbar. Wir können sie schützen.',
    ],
    color: '#6ca8eb',
  },
  {
    id: 'mars',
    name: 'Mars',
    order: 4,
    image: '/images/solar-system/mars.webp',
    imageAlt:
      'Mars als rostfarbene Kugel mit einer großen Schlucht. Bildmosaik der Viking-Raumsonden.',
    imageCredit: 'NASA/JPL-Caltech/USGS',
    imageSource: 'https://science.nasa.gov/resource/mosaic-of-mars/',
    tagline: 'Eine rote Welt für neugierige Roboter.',
    facts: [
      'Mars ist ein Gesteinsplanet. Er ist kleiner als die Erde.',
      'Rost in seinem Boden lässt ihn rötlich aussehen.',
      'Er hat zwei kleine Monde: Phobos und Deimos.',
      'Fahrende Roboter erkunden seinen Boden. Sie heißen Rover.',
    ],
    color: '#dc896a',
  },
  {
    id: 'jupiter',
    name: 'Jupiter',
    order: 5,
    image: '/images/solar-system/jupiter.webp',
    imageAlt:
      'Jupiter mit hellen und braunen Wolkenbändern und dem Großen Roten Fleck. Cassini-Bildmosaik.',
    imageCredit: 'NASA/JPL/University of Arizona',
    imageSource:
      'https://science.nasa.gov/photojournal/pj-high-resolution-globe-of-jupiter/',
    tagline: 'Der größte Planet mit einem Riesensturm.',
    facts: [
      'Jupiter ist ein Gasriese. Er besteht vor allem aus Wasserstoff und Helium.',
      'Er ist der größte Planet unseres Sonnensystems.',
      'Seine Streifen sind Wolkenbänder.',
      'Der Große Rote Fleck ist ein gewaltiger Sturm.',
    ],
    color: '#d7b38c',
  },
  {
    id: 'saturn',
    name: 'Saturn',
    order: 6,
    image: '/images/solar-system/saturn.webp',
    imageAlt:
      'Saturn mit breiten Ringen vor schwarzem Weltraum. Aufnahme der Raumsonde Cassini.',
    imageCredit: 'NASA/JPL-Caltech/Space Science Institute',
    imageSource: 'https://science.nasa.gov/photojournal/so-far-from-home/',
    tagline: 'Seine hellen Ringe sind ein echter Hingucker.',
    facts: [
      'Saturn ist ein Gasriese und der zweitgrößte Planet.',
      'Seine Ringe bestehen aus vielen Eis- und Gesteinsstücken.',
      'Die Ringe sind keine feste Scheibe. Jedes Stück kreist um Saturn.',
      'Auch Jupiter, Uranus und Neptun haben Ringe. Sie sind viel unauffälliger.',
    ],
    color: '#e7cb94',
  },
  {
    id: 'uranus',
    name: 'Uranus',
    order: 7,
    image: '/images/solar-system/uranus.webp',
    imageAlt:
      'Uranus als blassblau-grüne Kugel. Aufnahme der Raumsonde Voyager 2.',
    imageCredit: 'NASA/JPL-Caltech',
    imageSource:
      'https://science.nasa.gov/photojournal/uranus-as-seen-by-nasas-voyager-2/',
    tagline: 'Dieser blasse Riese dreht sich auf der Seite.',
    facts: [
      'Uranus ist ein Eisriese. Unter seinen Wolken liegen Wasser und andere Stoffe unter großem Druck.',
      'Ein Eisriese ist keine feste Eiskugel. Sein Inneres ist sehr heiß.',
      'Seine Drehachse ist stark gekippt. Er dreht sich fast auf der Seite.',
      'Ein Gas namens Methan trägt zu seiner blau-grünen Farbe bei.',
    ],
    color: '#9ad9db',
  },
  {
    id: 'neptune',
    name: 'Neptun',
    order: 8,
    image: '/images/solar-system/neptune.webp',
    imageAlt:
      'Neptun mit blauen Wolken und einem dunklen Sturm. Voyager-2-Aufnahme mit verstärkten Farben.',
    imageCredit: 'NASA/JPL',
    imageSource:
      'https://science.nasa.gov/photojournal/neptune-full-disk-view/',
    tagline: 'Weit draußen toben gewaltige Winde.',
    facts: [
      'Neptun ist ein Eisriese, ähnlich wie Uranus.',
      'Er ist von den acht Planeten am weitesten von der Sonne entfernt.',
      'Ein Umlauf um die Sonne dauert etwa 165 Erdenjahre.',
      'In seinen Wolken wehen besonders starke Winde.',
    ],
    color: '#6485e9',
  },
];
