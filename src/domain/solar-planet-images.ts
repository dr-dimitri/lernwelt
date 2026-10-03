import manifest from '../../public/images/solar-system/manifest.json';
import type { SolarBody } from './solar-system';

export type SolarPlanetImage = (typeof manifest.images)[number] & {
  readonly src: string;
};

/** Only bundled, curated files are used; source links never load a picture. */
export function getPlanetImages(planetId: SolarBody['id']): SolarPlanetImage[] {
  return manifest.images
    .filter((image) => image.planetId === planetId)
    .map((image) => ({
      ...image,
      src: `/images/solar-system/${image.file}`,
    }));
}
