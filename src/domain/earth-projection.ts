export const EARTH_CUT_OPENING_DEGREES = 140;
export const EARTH_ROTATION_LIMIT = 35;
const radians = (degrees: number) => (degrees * Math.PI) / 180;
const cutStart = radians(45 - EARTH_CUT_OPENING_DEGREES / 2);
const cutEnd = radians(45 + EARTH_CUT_OPENING_DEGREES / 2);
export type EarthPoint = [number, number];
type Vertex = [number, number, number];

export function clampEarthRotation(degrees: number): number {
  return Math.max(
    -EARTH_ROTATION_LIMIT,
    Math.min(EARTH_ROTATION_LIMIT, degrees),
  );
}

/** Rotate the actual sphere about its north/south axis before projection. */
export function rotateEarth(
  x: number,
  y: number,
  z: number,
  degrees = 0,
): Vertex {
  const angle = radians(clampEarthRotation(degrees));
  return [
    x * Math.cos(angle) - y * Math.sin(angle),
    x * Math.sin(angle) + y * Math.cos(angle),
    z,
  ];
}

/** Orthographic camera; the cut faces and surface use the same 3D transform. */
export function projectEarth(
  x: number,
  y: number,
  z: number,
  degrees = 0,
): EarthPoint {
  const [rx, ry, rz] = rotateEarth(x, y, z, degrees);
  return [
    320 + (rx - ry) / Math.sqrt(2),
    250 + (rx + ry - 2 * rz) / Math.sqrt(6),
  ];
}

function cutVertex(
  radius: number,
  side: 'left' | 'right',
  latitude: number,
): Vertex {
  const longitude = side === 'right' ? cutStart : cutEnd;
  return [
    radius * Math.cos(latitude) * Math.cos(longitude),
    radius * Math.cos(latitude) * Math.sin(longitude),
    radius * Math.sin(latitude),
  ];
}

/** Two filled vertical half-discs bound the enlarged removed sector. */
export function earthCutFace(
  radius: number,
  side: 'left' | 'right',
  degrees = 0,
): string {
  const points = Array.from({ length: 65 }, (_, i) =>
    projectEarth(
      ...cutVertex(radius, side, -Math.PI / 2 + (i * Math.PI) / 64),
      degrees,
    ),
  );
  return (
    points
      .map(([x, y], i) => `${i ? 'L' : 'M'}${x.toFixed(2)},${y.toFixed(2)}`)
      .join(' ') + ' Z'
  );
}

const markerRadii = [202, 154, 81, 31];
const markers = ['A', 'B', 'C', 'D'] as const;

/**
 * All anchors lie on one ray in separate filled layers. Their screen heights
 * remain strictly ordered throughout the supported rotation. The outgoing
 * lines keep that order and end at distinct label heights on the right.
 */
export function earthCallouts(degrees = 0) {
  return markers.map((marker, i) => {
    const anchor = projectEarth(
      ...cutVertex(markerRadii[i], 'right', Math.PI / 3),
      degrees,
    );
    const elbow: EarthPoint = [562, 102 + i * 99];
    const end: EarthPoint = [601, elbow[1]];
    const label: EarthPoint = [626, elbow[1]];
    return { marker, anchor, elbow, end, label };
  });
}

/** The probe uses the other cut face, away from the label leaders. */
export function earthProbePosition(
  layerIndex: number,
  degrees = 0,
): EarthPoint {
  return projectEarth(
    ...cutVertex(markerRadii[layerIndex] ?? markerRadii[0], 'left', 0),
    degrees,
  );
}

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

const surfaceTriangles = (() => {
  const triangles: { vertices: Vertex[]; middle: Vertex; land: boolean }[] = [];
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
  for (let longitudeIndex = 0; longitudeIndex < 44; longitudeIndex++) {
    const lon =
      cutEnd + (longitudeIndex * (Math.PI * 2 - (cutEnd - cutStart))) / 44;
    const nextLon =
      cutEnd +
      ((longitudeIndex + 1) * (Math.PI * 2 - (cutEnd - cutStart))) / 44;
    for (let latitudeIndex = 0; latitudeIndex < 28; latitudeIndex++) {
      const lat = -Math.PI / 2 + (latitudeIndex * Math.PI) / 28;
      const nextLat = -Math.PI / 2 + ((latitudeIndex + 1) * Math.PI) / 28;
      const corners = [
        vertex(lon, lat),
        vertex(nextLon, lat),
        vertex(nextLon, nextLat),
        vertex(lon, nextLat),
      ];
      for (const vertices of [
        [corners[0], corners[1], corners[2]],
        [corners[0], corners[2], corners[3]],
      ]) {
        const middle = [0, 1, 2].map(
          (axis) => vertices.reduce((sum, point) => sum + point[axis], 0) / 3,
        ) as Vertex;
        const degreesLon = (((lon + nextLon) / 2) * 180) / Math.PI;
        const degreesLat = (((lat + nextLat) / 2) * 180) / Math.PI;
        triangles.push({
          vertices,
          middle,
          land: landShapes.some((shape) =>
            inPolygon(degreesLon, degreesLat, shape),
          ),
        });
      }
    }
  }
  return triangles;
})();

/** Reproject, light and depth-sort the remaining surface for each orientation. */
export function buildEarthSurface(degrees = 0) {
  const pieces: { points: string; fill: string; depth: number }[] = [];
  for (const triangle of surfaceTriangles) {
    const middle = rotateEarth(...triangle.middle, degrees);
    const depth = (middle[0] + middle[1] + middle[2]) / Math.sqrt(3);
    if (depth <= 0) continue;
    const normal = middle.map((value) => value / 214);
    const shade =
      0.25 +
      0.75 *
        Math.max(0, (-normal[0] + normal[1] + 2 * normal[2]) / Math.sqrt(6));
    pieces.push({
      points: triangle.vertices
        .map((point) =>
          projectEarth(...point, degrees)
            .map((value) => value.toFixed(2))
            .join(','),
        )
        .join(' '),
      fill: colour(shade, triangle.land),
      depth,
    });
  }
  return pieces.sort((a, b) => a.depth - b.depth);
}
