import assert from 'node:assert/strict';
import { spawnSync } from 'node:child_process';
import {
  cpSync,
  mkdtempSync,
  readFileSync,
  rmSync,
  writeFileSync,
} from 'node:fs';
import { tmpdir } from 'node:os';
import { join } from 'node:path';
import { fileURLToPath } from 'node:url';
import test from 'node:test';

const contentDirectory = fileURLToPath(
  new URL('../src-tauri/content', import.meta.url),
);
const generator = fileURLToPath(
  new URL('./build-topic-practice.py', import.meta.url),
);
const readJson = (path) => JSON.parse(readFileSync(path, 'utf8'));
const cellUnit = (catalog) =>
  catalog.units.find((unit) => unit.id === 'nature-cells');

function fixture(t) {
  const directory = mkdtempSync(join(tmpdir(), 'lernwelt content rebuild '));
  t.after(() => rmSync(directory, { recursive: true, force: true }));
  const content = join(directory, 'src-tauri', 'content');
  cpSync(contentDirectory, content, { recursive: true });
  const catalog = readJson(join(content, 'study-catalog-v1.json'));
  const nature = readJson(join(content, 'nature-5-v1.json')).exercises;
  const practice = readJson(join(content, 'topic-practice-v1.json'));
  const nucleus = readJson(join(content, 'nature-nucleus-5-v1.json'));
  const originalIds = cellUnit(catalog).exerciseIds.filter(
    (id) => !id.includes('.nucleus.'),
  );
  const byId = new Map([...nature, ...practice].map((task) => [task.id, task]));
  const originalCells = originalIds.map((id) => byId.get(id));
  assert.equal(originalCells.length, 45);
  assert.ok(originalCells.every(Boolean));
  assert.equal(nucleus.exercises.length, 18);
  return { directory, content, catalog, nucleus, originalIds, originalCells };
}

function rebuild({ directory }) {
  const result = spawnSync('python3', [generator], {
    cwd: directory,
    encoding: 'utf8',
    timeout: 60_000,
  });
  assert.equal(result.error, undefined);
  assert.equal(result.status, 0, result.stderr || result.stdout);
}

function assertCellInventory({ content, originalIds, originalCells }) {
  const catalog = readJson(join(content, 'study-catalog-v1.json'));
  const ids = cellUnit(catalog).exerciseIds;
  const byId = new Map(
    [
      ...readJson(join(content, 'nature-5-v1.json')).exercises,
      ...readJson(join(content, 'topic-practice-v1.json')),
      ...readJson(join(content, 'nature-nucleus-5-v1.json')).exercises,
    ].map((task) => [task.id, task]),
  );
  assert.deepEqual(
    originalIds.map((id) => byId.get(id)),
    originalCells,
    'all 45 original cell tasks retain IDs, answers, difficulties and content',
  );
  for (const id of originalIds) assert.ok(ids.includes(id), id);
  assert.equal(ids.filter((id) => id.includes('.focus.')).length, 36);
  assert.equal(ids.length, new Set(ids).size);
  assert.ok(ids.every((id) => byId.has(id)));
  return ids;
}

test('rebuilds the real cell catalog with all 45 original and 18 nucleus tasks', (t) => {
  const options = fixture(t);
  const earthBefore = readFileSync(
    join(options.content, 'geography-earth-5-v1.json'),
    'utf8',
  );
  const earthIdsBefore = options.catalog.units.find(
    (unit) => unit.id === 'geography-earth-layers',
  ).exerciseIds;
  const nucleusBefore = readFileSync(
    join(options.content, 'nature-nucleus-5-v1.json'),
    'utf8',
  );
  rebuild(options);
  const ids = assertCellInventory(options);
  assert.equal(ids.length, 63);
  const rebuiltCatalog = readJson(
    join(options.content, 'study-catalog-v1.json'),
  );
  assert.deepEqual(
    rebuiltCatalog.units.find((unit) => unit.id === 'geography-earth-layers')
      .exerciseIds,
    earthIdsBefore,
    'the independent earth expedition remains assigned to its original IDs',
  );
  assert.equal(
    readFileSync(join(options.content, 'geography-earth-5-v1.json'), 'utf8'),
    earthBefore,
  );
  for (const task of options.nucleus.exercises)
    assert.ok(ids.includes(task.id), task.id);
  assert.equal(
    readFileSync(join(options.content, 'nature-nucleus-5-v1.json'), 'utf8'),
    nucleusBefore,
  );
});

test('supplemental nucleus tasks never replace the 36 existing focus tasks', (t) => {
  const options = fixture(t);
  const extras = options.nucleus.exercises.map((task) => ({
    ...task,
    id: `${task.id}.rebuild-regression`,
  }));
  options.nucleus.exercises.push(...extras);
  cellUnit(options.catalog).exerciseIds.push(...extras.map((task) => task.id));
  writeFileSync(
    join(options.content, 'nature-nucleus-5-v1.json'),
    JSON.stringify(options.nucleus),
  );
  writeFileSync(
    join(options.content, 'study-catalog-v1.json'),
    JSON.stringify(options.catalog),
  );
  rebuild(options);
  const ids = assertCellInventory(options);
  assert.equal(ids.length, 81);
  for (const task of options.nucleus.exercises)
    assert.ok(ids.includes(task.id), task.id);
});
