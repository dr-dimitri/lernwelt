import type { Difficulty } from './learning';

export type NatureGameId = 'matter' | 'flower' | 'meadow';
export type ParticleState = 'solid' | 'liquid' | 'gas';
export type FlowerPart = 'petal' | 'stamen' | 'stigma' | 'ovary';
export type MeadowAnimal = 'grass' | 'grasshopper' | 'frog' | 'stork';

export const natureGameSource = {
  subject: 'nature',
  grade: 5,
  source: 'https://www.lehrplanplus.bayern.de/fachlehrplan/gymnasium/5/nt_gym',
  curriculumVersion: 'LehrplanPLUS Bayern, abgerufen am 25.09.2026',
} as const;

export const natureGames = [
  {
    id: 'matter',
    name: 'Stoff-Labor',
    subtitle: 'Winzige Teilchen, große Ideen',
    symbol: '◉',
    curriculumRef: 'NT5 1',
  },
  {
    id: 'flower',
    name: 'Pflanzen-Werkstatt',
    subtitle: 'Entdecke das Geheimnis der Blüte',
    symbol: '✿',
    curriculumRef: 'NT5 2.4',
  },
  {
    id: 'meadow',
    name: 'Wiesen-Netz',
    subtitle: 'Wer frisst hier wen?',
    symbol: '↗',
    curriculumRef: 'NT5 2.5',
  },
] as const;

export interface MatchItem {
  id: string;
  label: string;
  target: string;
  explanation: string;
  particleState?: ParticleState;
  nextState?: ParticleState;
}

export interface MatchRound {
  id: string;
  title: string;
  instruction: string;
  hint: string;
  items: readonly MatchItem[];
  targets: readonly { id: string; label: string }[];
}

const stateTargets = [
  { id: 'solid', label: 'Fest' },
  { id: 'liquid', label: 'Flüssig' },
  { id: 'gas', label: 'Gasförmig' },
] as const;

export const matterRounds: Record<Difficulty, MatchRound> = {
  vorschule: {
    id: 'nt5-game-matter-v1-vorschule',
    title: 'Drei Formen von Wasser',
    instruction:
      'Wähle eine Wasser-Karte. Stelle sie dann zum passenden Zustand.',
    hint: 'Eis behält seine Form. Flüssiges Wasser passt sich dem Gefäß an. Wasserdampf verteilt sich als Gas im Raum und ist unsichtbar.',
    targets: stateTargets,
    items: [
      {
        id: 'ice',
        label: 'Ein Eiswürfel',
        target: 'solid',
        particleState: 'solid',
        explanation:
          'Eis ist fest. Seine Teilchen bewegen sich um feste Plätze.',
      },
      {
        id: 'vapor',
        label: 'Unsichtbarer Wasserdampf',
        target: 'gas',
        particleState: 'gas',
        explanation:
          'Wasserdampf ist gasförmig. Seine Teilchen sind weit voneinander entfernt. Die weiße Wolke über einem Topf besteht dagegen aus winzigen Wassertröpfchen.',
      },
      {
        id: 'water',
        label: 'Wasser im Glas',
        target: 'liquid',
        particleState: 'liquid',
        explanation:
          'Wasser im Glas ist flüssig. Seine Teilchen bleiben nah beieinander und können aneinander vorbeigleiten.',
      },
    ],
  },
  koenner: {
    id: 'nt5-game-matter-v1-koenner',
    title: 'Blicke in die Teilchenwelt',
    instruction: 'Wähle ein Teilchenbild. Ordne es dem passenden Zustand zu.',
    hint: 'Fest: feste Plätze. Flüssig: nah beieinander und beweglich. Gasförmig: weit auseinander und frei beweglich. Die Punkte sind ein vereinfachtes Modell, keine echten Fotos.',
    targets: stateTargets,
    items: [
      {
        id: 'spread',
        label: 'Weit verteilt und frei beweglich',
        target: 'gas',
        particleState: 'gas',
        explanation:
          'Gasförmig passt: Die Teilchen haben viel Abstand und verteilen sich im verfügbaren Raum.',
      },
      {
        id: 'sliding',
        label: 'Nah beieinander und verschiebbar',
        target: 'liquid',
        particleState: 'liquid',
        explanation:
          'Flüssig passt: Die Teilchen bleiben nah zusammen und gleiten aneinander vorbei.',
      },
      {
        id: 'places',
        label: 'An festen Plätzen, aber nicht still',
        target: 'solid',
        particleState: 'solid',
        explanation:
          'Fest passt: Die Teilchen bewegen sich um feste Plätze. Auch ein fester Stoff besteht aus bewegten Teilchen.',
      },
    ],
  },
  streber: {
    id: 'nt5-game-matter-v1-streber',
    title: 'Verwandlung im Stoff-Labor',
    instruction: 'Wähle eine Veränderung. Ordne ihr den richtigen Namen zu.',
    hint: 'Lies den Pfeil von links nach rechts. Beim Schmelzen und Verdampfen wird Energie aufgenommen. Beim Erstarren und Kondensieren wird Energie abgegeben.',
    targets: [
      { id: 'melting', label: 'Schmelzen' },
      { id: 'freezing', label: 'Erstarren' },
      { id: 'evaporating', label: 'Verdampfen' },
      { id: 'condensing', label: 'Kondensieren' },
    ],
    items: [
      {
        id: 'condensation',
        label: 'Gasförmig → flüssig',
        target: 'condensing',
        particleState: 'gas',
        nextState: 'liquid',
        explanation:
          'Beim Kondensieren wird aus einem Gas eine Flüssigkeit. So entstehen an einem kalten Spiegel Wassertröpfchen.',
      },
      {
        id: 'melt',
        label: 'Fest → flüssig',
        target: 'melting',
        particleState: 'solid',
        nextState: 'liquid',
        explanation:
          'Beim Schmelzen wird ein fester Stoff flüssig. Die Teilchen können ihre festen Plätze verlassen.',
      },
      {
        id: 'evaporation',
        label: 'Flüssig → gasförmig',
        target: 'evaporating',
        particleState: 'liquid',
        nextState: 'gas',
        explanation:
          'Verdampfen ist der Übergang von flüssig zu gasförmig. Das geschieht beim Sieden und auch beim langsamen Verdunsten.',
      },
      {
        id: 'freeze',
        label: 'Flüssig → fest',
        target: 'freezing',
        particleState: 'liquid',
        nextState: 'solid',
        explanation:
          'Beim Erstarren wird ein flüssiger Stoff fest. Bei Wasser nennen wir das auch Gefrieren.',
      },
    ],
  },
};

export const flowerTargets = [
  { id: 'petal', label: 'Blütenblatt' },
  { id: 'stamen', label: 'Staubblatt' },
  { id: 'stigma', label: 'Narbe' },
  { id: 'ovary', label: 'Fruchtknoten' },
] as const;

export const flowerRounds: Record<Difficulty, MatchRound> = {
  vorschule: {
    id: 'nt5-game-flower-v1-vorschule',
    title: 'Auf Entdeckungsreise in der Blüte',
    instruction:
      'Wähle eine Beschreibung. Finde dazu den passenden Blütenteil.',
    hint: 'In der Zeichnung helfen dir die Linien. Die Narbe sitzt oben in der Mitte. Die Staubblätter stehen seitlich daneben.',
    targets: flowerTargets.slice(0, 3),
    items: [
      {
        id: 'color',
        label: 'Die farbige Hülle der Blüte',
        target: 'petal',
        explanation:
          'Die Blütenblätter sind hier rosa. Auffällige Blütenblätter können Insekten zur Blüte locken.',
      },
      {
        id: 'pollen',
        label: 'Hier entsteht der Blütenstaub',
        target: 'stamen',
        explanation:
          'Im Staubbeutel am Staubblatt entsteht Blütenstaub. Er heißt auch Pollen.',
      },
      {
        id: 'top',
        label: 'Hier landet der Blütenstaub',
        target: 'stigma',
        explanation:
          'Auf der Narbe kann Pollen haften bleiben. Das Übertragen von Pollen auf eine Narbe heißt Bestäubung.',
      },
    ],
  },
  koenner: {
    id: 'nt5-game-flower-v1-koenner',
    title: 'Jeder Teil hat eine Aufgabe',
    instruction:
      'Wähle eine Aufgabe. Verbinde sie mit dem passenden Blütenteil.',
    hint: 'Pollen = Blütenstaub. Die Narbe nimmt Pollen auf. Im verdickten Fruchtknoten liegen die Samenanlagen.',
    targets: flowerTargets,
    items: [
      {
        id: 'protect',
        label: 'Hier liegen die Samenanlagen',
        target: 'ovary',
        explanation:
          'Der Fruchtknoten enthält die Samenanlagen. Nach der Befruchtung können daraus Samen entstehen.',
      },
      {
        id: 'attract',
        label: 'Lockt mit auffälliger Farbe Insekten an',
        target: 'petal',
        explanation:
          'Bei vielen von Insekten bestäubten Blüten helfen auffällige Blütenblätter den Besuchern, die Blüte zu finden.',
      },
      {
        id: 'produce',
        label: 'Bildet Pollen im Staubbeutel',
        target: 'stamen',
        explanation:
          'Das Staubblatt besteht aus Staubfaden und Staubbeutel. Im Staubbeutel entsteht Pollen.',
      },
      {
        id: 'receive',
        label: 'Nimmt Pollen bei der Bestäubung auf',
        target: 'stigma',
        explanation:
          'Pollen landet auf der Narbe. Bestäubung und Befruchtung sind zwei verschiedene Schritte.',
      },
    ],
  },
  streber: {
    id: 'nt5-game-flower-v1-streber',
    title: 'Vom Blütenbesuch zum Samen',
    instruction:
      'Wähle eine Beobachtung. Finde den Blütenteil, zu dem sie gehört.',
    hint: 'Bestäubung: Pollen gelangt auf die Narbe. Danach kann ein Pollenschlauch zur Samenanlage wachsen. Erst dort kann eine männliche Keimzelle die Eizelle befruchten.',
    targets: flowerTargets,
    items: [
      {
        id: 'landing',
        label: 'Pollen bleibt hier haften. Die Blüte ist bestäubt.',
        target: 'stigma',
        explanation:
          'Die Narbe nimmt Pollen auf. Damit ist die Bestäubung erfolgt. Die Befruchtung findet später in einer Samenanlage statt.',
      },
      {
        id: 'fruit',
        label: 'Dieser Teil kann später zur Frucht werden.',
        target: 'ovary',
        explanation:
          'Bei vielen Blütenpflanzen entwickelt sich der Fruchtknoten nach der Befruchtung zur Frucht. Aus Samenanlagen werden Samen.',
      },
      {
        id: 'visitor',
        label: 'Seine auffällige Farbe hilft Bienen, die Blüte zu finden.',
        target: 'petal',
        explanation:
          'Blütenblätter können als farbige Signale wirken. Nicht alle Blüten sind auffällig: Manche werden vom Wind bestäubt.',
      },
      {
        id: 'pickup',
        label: 'Hier nimmt eine Biene Pollen vom Staubbeutel mit.',
        target: 'stamen',
        explanation:
          'Pollen aus dem Staubbeutel kann am Körper einer Biene haften. Bei einem weiteren Blütenbesuch kann er auf eine passende Narbe gelangen.',
      },
    ],
  },
};

export const meadowNames: Record<MeadowAnimal, string> = {
  grass: 'Gras',
  grasshopper: 'Grashüpfer',
  frog: 'Frosch',
  stork: 'Weißstorch',
};

export function meadowRound(difficulty: Difficulty) {
  const nodes: MeadowAnimal[] =
    difficulty === 'vorschule'
      ? ['grass', 'grasshopper', 'frog']
      : ['grass', 'grasshopper', 'frog', 'stork'];
  const links: readonly [MeadowAnimal, MeadowAnimal][] =
    difficulty === 'vorschule'
      ? [
          ['grass', 'grasshopper'],
          ['grasshopper', 'frog'],
        ]
      : difficulty === 'koenner'
        ? [
            ['grass', 'grasshopper'],
            ['grasshopper', 'frog'],
            ['frog', 'stork'],
          ]
        : [
            ['grass', 'grasshopper'],
            ['grasshopper', 'frog'],
            ['frog', 'stork'],
            ['grasshopper', 'stork'],
          ];
  return {
    id: `nt5-game-meadow-v1-${difficulty}`,
    nodes,
    links,
    title:
      difficulty === 'streber'
        ? 'Aus einer Kette wird ein Netz'
        : 'Baue eine Nahrungskette',
    hint:
      difficulty === 'streber'
        ? 'Unser Weißstorch frisst Frösche und auch Grashüpfer. Ein Tier kann mehrere Nahrungsquellen haben.'
        : 'Der Grashüpfer frisst Gras. Der Frosch frisst Grashüpfer.' +
          (difficulty === 'koenner'
            ? ' Der Weißstorch frisst auch Frösche.'
            : ''),
  };
}
