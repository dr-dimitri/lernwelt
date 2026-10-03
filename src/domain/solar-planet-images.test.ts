import { createHash } from 'node:crypto';
import { readFileSync } from 'node:fs';
import { resolve } from 'node:path';
import { expect, it } from 'vitest';
import { getPlanetImages } from './solar-planet-images';
import { planets } from './solar-system';

it('bündelt drei unterschiedliche gültige NASA-Bilddateien je Planet mit vollständigen Nachweisen', () => {
  const usedIds = new Set<string>();
  const usedHashes = new Set<string>();
  for (const planet of planets) {
    const images = getPlanetImages(planet.id);
    expect(images).toHaveLength(3);
    expect(images[0].src).toBe(planet.image);
    expect(images[0].alt).toBe(planet.imageAlt);
    expect(images[0].sourcePage).toBe(planet.imageSource);
    expect(images[0].credit).toBe(planet.imageCredit);
    for (const image of images) {
      expect(usedIds.has(image.id)).toBe(false);
      expect(usedHashes.has(image.sha256)).toBe(false);
      usedIds.add(image.id);
      usedHashes.add(image.sha256);
      expect(image.src).toMatch(/^\/images\/solar-system\/[a-z0-9-]+\.webp$/);
      for (const value of [image.alt, image.title, image.caption]) {
        expect(value.trim().length).toBeGreaterThan(10);
      }
      expect(image.credit.trim().length).toBeGreaterThan(0);
      for (const url of [image.sourcePage, image.sourceImage]) {
        expect(new URL(url).protocol).toBe('https:');
        expect(new URL(url).hostname).toMatch(/(^|\.)nasa\.gov$/);
      }
      expect(image.retrievedAt).toBe('2026-10-03');
      expect(image.processing).toContain('keine Inhalts- oder Farbänderung');
      const file = readFileSync(
        resolve(process.cwd(), 'public', image.src.slice(1)),
      );
      expect(file.subarray(0, 4).toString()).toBe('RIFF');
      expect(file.subarray(8, 12).toString()).toBe('WEBP');
      expect(file.length).toBe(image.bytes);
      expect(createHash('sha256').update(file).digest('hex')).toBe(
        image.sha256,
      );
      expect(image.width).toBeGreaterThan(0);
      expect(image.height).toBeGreaterThan(0);
    }
  }
});
