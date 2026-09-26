export interface NumberLineDiagram {
  kind: 'ray' | 'line';
  mode: 'read' | 'place';
  min: number;
  max: number;
  step: number;
  labels: number[];
  markers: { label: string; value: number }[];
}
