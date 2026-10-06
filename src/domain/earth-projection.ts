/** Orthographic isometry: all three unit axes have the same projected length. */
export function projectEarth(
  x: number,
  y: number,
  z: number,
): [number, number] {
  return [320 + (x - y) / Math.sqrt(2), 250 + (x + y - 2 * z) / Math.sqrt(6)];
}

/** A vertical half-disc; together the two faces expose the removed quarter. */
export function earthCutFace(radius: number, side: 'left' | 'right'): string {
  const points = Array.from({ length: 65 }, (_, i) => {
    const angle = -Math.PI / 2 + (i * Math.PI) / 64;
    const horizontal = radius * Math.cos(angle);
    return side === 'right'
      ? projectEarth(horizontal, 0, radius * Math.sin(angle))
      : projectEarth(0, horizontal, radius * Math.sin(angle));
  });
  return (
    points
      .map(([x, y], i) => `${i ? 'L' : 'M'}${x.toFixed(2)},${y.toFixed(2)}`)
      .join(' ') + ' Z'
  );
}

type Vertex = [number, number, number];
function vertex(longitude: number, latitude: number): Vertex {
  return [
    214 * Math.cos(latitude) * Math.cos(longitude),
    214 * Math.cos(latitude) * Math.sin(longitude),
    214 * Math.sin(latitude),
  ];
}
function inPolygon(x: number, y: number, points: number[][]): boolean {
  let inside = false;
  for (let i = 0, j = points.length - 1; i < points.length; j = i++) {
    const [xi, yi] = points[i];
    const [xj, yj] = points[j];
    if (yi > y !== yj > y && x < ((xj - xi) * (y - yi)) / (yj - yi) + xi)
      inside = !inside;
  }
  return inside;
}
function colour(shade: number, land: boolean): string {
  const dark = land ? [44, 105, 81] : [22, 62, 88];
  const light = land ? [169, 207, 151] : [86, 160, 182];
  return `rgb(${dark.map((v, i) => Math.round(v + (light[i] - v) * shade)).join(',')})`;
}

/** Own schematic surface, with the viewer-facing x/y quarter removed. */
export const earthSurface = (() => {
  const pieces: { points: string; fill: string; depth: number }[] = [];
  const landShapes = [
    [
      [100, 10],
      [105, 45],
      [120, 68],
      [168, 57],
      [176, 32],
      [144, 5],
      [140, -20],
      [125, -40],
      [108, -12],
    ],
    [
      [278, 28],
      [294, 58],
      [327, 68],
      [352, 43],
      [337, 19],
      [316, 5],
      [306, -19],
      [289, -7],
    ],
    [
      [235, -31],
      [247, -23],
      [267, -32],
      [259, -52],
      [241, -49],
    ],
  ];
  for (let longitudeIndex = 12; longitudeIndex < 48; longitudeIndex++) {
    const lon = (longitudeIndex * Math.PI * 2) / 48;
    const nextLon = ((longitudeIndex + 1) * Math.PI * 2) / 48;
    for (let latitudeIndex = 0; latitudeIndex < 24; latitudeIndex++) {
      const lat = -Math.PI / 2 + (latitudeIndex * Math.PI) / 24;
      const nextLat = -Math.PI / 2 + ((latitudeIndex + 1) * Math.PI) / 24;
      const corners = [
        vertex(lon, lat),
        vertex(nextLon, lat),
        vertex(nextLon, nextLat),
        vertex(lon, nextLat),
      ];
      for (const triangle of [
        [corners[0], corners[1], corners[2]],
        [corners[0], corners[2], corners[3]],
      ]) {
        const middle = [0, 1, 2].map(
          (axis) => triangle.reduce((sum, point) => sum + point[axis], 0) / 3,
        );
        const depth = middle[0] + middle[1] + middle[2];
        if (depth <= 0) continue;
        const normal = middle.map((value) => value / 214);
        const shade =
          0.25 +
          0.75 *
            Math.max(
              0,
              (-normal[0] + normal[1] + 2 * normal[2]) / Math.sqrt(6),
            );
        const degreesLon = (((lon + nextLon) / 2) * 180) / Math.PI;
        const degreesLat = (((lat + nextLat) / 2) * 180) / Math.PI;
        const land = landShapes.some((shape) =>
          inPolygon(degreesLon, degreesLat, shape),
        );
        pieces.push({
          points: triangle
            .map((point) =>
              projectEarth(...point)
                .map((value) => value.toFixed(2))
                .join(','),
            )
            .join(' '),
          fill: colour(shade, land),
          depth,
        });
      }
    }
  }
  return pieces.sort((a, b) => a.depth - b.depth);
})();
