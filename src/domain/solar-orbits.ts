import type { SolarPlanet } from './solar-system';

// Sidereal orbital periods in Earth days from NASA's individual factsheets:
// https://nssdc.gsfc.nasa.gov/planetary/factsheet/ (source checked 2026-10-03).
// Circular paths and constant angular speed are a learning-model simplification.
export const orbitalPeriodDays: Readonly<Record<SolarPlanet['id'], number>> = {
  mercury: 87.969,
  venus: 224.701,
  earth: 365.256,
  mars: 686.98,
  jupiter: 4332.589,
  saturn: 10755.699,
  uranus: 30685.4,
  neptune: 60189.018,
};

export function solarOrbitAngle(
  planetId: SolarPlanet['id'],
  earthYears: number,
) {
  const period = orbitalPeriodDays[planetId] / orbitalPeriodDays.earth;
  return ((earthYears % period) / period) * Math.PI * 2;
}
