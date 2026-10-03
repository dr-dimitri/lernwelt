import { expect, it } from 'vitest';
import { solarOrbitAngle } from './solar-orbits';
import { solarPlanetPosition } from './solar-projection';
import { planets, type SolarPlanet } from './solar-system';

// Independent reference values from NASA's sidereal orbital periods, in Earth
// days. Keep expected timings independent of the production data table.
const orbitalDays: [SolarPlanet['id'], number][] = [
  ['mercury', 87.969],
  ['venus', 224.701],
  ['earth', 365.256],
  ['mars', 686.98],
  ['jupiter', 4332.589],
  ['saturn', 10755.699],
  ['uranus', 30685.4],
  ['neptune', 60189.018],
];

it.each(orbitalDays)(
  'führt %s in seiner tatsächlichen Umlaufzeit einmal um die Sonne',
  (id, days) => {
    const earthYears = days / 365.256;
    expect(solarOrbitAngle(id, earthYears / 4)).toBeCloseTo(Math.PI / 2, 10);
    expect(solarOrbitAngle(id, earthYears / 2)).toBeCloseTo(Math.PI, 10);
    const planet = planets.find((candidate) => candidate.id === id)!;
    const start = solarPlanetPosition(planet, 35, 50);
    const half = solarPlanetPosition(planet, 35, 50, earthYears / 2);
    const complete = solarPlanetPosition(planet, 35, 50, earthYears);
    expect(half.x).not.toBeCloseTo(start.x, 8);
    expect(half.y).not.toBeCloseTo(start.y, 8);
    expect(complete.x).toBeCloseTo(start.x, 8);
    expect(complete.y).toBeCloseTo(start.y, 8);
    expect(complete.radius).toBeCloseTo(start.radius, 8);
  },
);

it('zeigt im gleichen Zeitraum mehr Umlauf bei nahen als bei äußeren Planeten', () => {
  const angles = planets.map((planet) => solarOrbitAngle(planet.id, 0.1));
  for (let index = 1; index < angles.length; index += 1) {
    expect(angles[index - 1]).toBeGreaterThan(angles[index]);
    expect(angles[index]).toBeGreaterThan(0);
  }
  expect(solarOrbitAngle('earth', 0.1)).toBeCloseTo(Math.PI / 5, 10);
});
