import type { SolarPlanet } from './solar-system';
import { solarOrbitAngle } from './solar-orbits';

// Deliberately compressed distances and enlarged planets for a readable model.
const radii = [68, 102, 140, 180, 238, 300, 365, 430];
const angles = [210, 330, 85, 155, 275, 30, 190, 115];
const sizes = [10, 15, 17, 13, 38, 32, 25, 24];

export function projectSolarPoint(
  x: number,
  z: number,
  yaw: number,
  tilt: number,
) {
  const turn = (yaw * Math.PI) / 180;
  const elevation = (tilt * Math.PI) / 180;
  const rotatedX = x * Math.cos(turn) - z * Math.sin(turn);
  const rotatedZ = x * Math.sin(turn) + z * Math.cos(turn);
  const depth = rotatedZ * Math.cos(elevation);
  // Fit even the nearest outer orbit into the frame at a steep viewing angle.
  // Reserve space above the spheres for the target marker and its label.
  const outerExtent =
    (430 * Math.sin(elevation)) / (1 - (430 / 1400) * Math.cos(elevation));
  const fit = Math.min(1, 255 / outerExtent);
  const scale = fit / (1 + depth / 1400);
  return {
    x: 500 + rotatedX * scale,
    y: 315 + rotatedZ * Math.sin(elevation) * scale,
    depth,
    scale,
  };
}

export function solarPlanetPosition(
  planet: SolarPlanet,
  yaw: number,
  tilt: number,
  earthYears = 0,
) {
  const index = planet.order - 1;
  const angle =
    (angles[index] * Math.PI) / 180 + solarOrbitAngle(planet.id, earthYears);
  const radius = radii[index];
  const point = projectSolarPoint(
    radius * Math.cos(angle),
    radius * Math.sin(angle),
    yaw,
    tilt,
  );
  return { ...point, radius: sizes[index] * point.scale };
}

export function solarOrbitPath(order: number, yaw: number, tilt: number) {
  const radius = radii[order - 1];
  return (
    Array.from({ length: 97 }, (_, index) => {
      const angle = (index / 96) * Math.PI * 2;
      const point = projectSolarPoint(
        radius * Math.cos(angle),
        radius * Math.sin(angle),
        yaw,
        tilt,
      );
      return `${index ? 'L' : 'M'}${point.x.toFixed(2)},${point.y.toFixed(2)}`;
    }).join(' ') + ' Z'
  );
}
