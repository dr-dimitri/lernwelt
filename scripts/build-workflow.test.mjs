import assert from 'node:assert/strict';
import { readFileSync } from 'node:fs';
import { runInNewContext } from 'node:vm';
import test from 'node:test';
import { validateIssueWorkflow } from './check-issue-workflow.mjs';

function workflow(name) {
  return readFileSync(
    new URL(`../.github/workflows/${name}.yml`, import.meta.url),
    'utf8',
  );
}

function job(source, name) {
  return new RegExp(
    `^ {2}${name}:\\n([\\s\\S]*?)(?=^ {2}[\\w-]+:|$(?![\\s\\S]))`,
    'm',
  ).exec(source)?.[1];
}

function expression(source, context) {
  const code = source
    .replace(/^\$\{\{\s*|\s*\}\}$/g, '')
    .replace(
      /\bneeds\.([\w-]+)/g,
      (_, name) => `needs[${JSON.stringify(name)}]`,
    );
  return runInNewContext(code, context, { timeout: 1000 });
}

// Apply Actions' implicit success() gate, then evaluate the real dependency
// list and condition. This detects both missing dependencies and status checks
// such as always() that would permit publication after failure or cancellation.
function runs(source, name, context) {
  const block = job(source, name);
  assert.ok(block, `Missing job ${name}`);
  const required = /^ {4}needs: (.+)$/m.exec(block)?.[1];
  const dependencies = required
    ? required.replace(/[\[\]]/g, '').split(/,\s*|\s+/)
    : [];
  const condition = /^ {4}if: (.+)$/m.exec(block)?.[1] ?? 'true';
  const success = () =>
    dependencies.every(
      (dependency) => context.needs[dependency].result === 'success',
    );
  const explicitStatus = /\b(?:always|success|failure|cancelled)\(/.test(
    condition,
  );
  return Boolean(
    (explicitStatus || success()) &&
    expression(condition, {
      ...context,
      success,
      always: () => true,
      failure: () =>
        dependencies.some(
          (dependency) => context.needs[dependency].result === 'failure',
        ),
      cancelled: () =>
        dependencies.some(
          (dependency) => context.needs[dependency].result === 'cancelled',
        ),
    }),
  );
}

const main = {
  event_name: 'push',
  ref: 'refs/heads/main',
  ref_type: 'branch',
  repository: 'dr-dimitri/lernwelt',
};

function needs(overrides = {}) {
  return {
    frontend: { result: 'success' },
    desktop: { result: 'success' },
    'release-build': { result: 'success', outputs: { build: 'true' } },
    ...overrides,
  };
}

test('main builds release packages while desktop quality is pending but publishes only after all gates succeed', () => {
  const source = workflow('ci');
  assert.equal(
    runs(source, 'release-build', {
      github: main,
      needs: needs({ desktop: { result: 'in_progress' } }),
    }),
    true,
  );
  assert.equal(runs(source, 'publish', { github: main, needs: needs() }), true);
  for (const dependency of ['frontend', 'desktop', 'release-build'])
    for (const result of ['failure', 'cancelled', 'skipped', 'in_progress']) {
      const state = needs();
      state[dependency].result = result;
      assert.equal(
        runs(source, 'publish', { github: main, needs: state }),
        false,
        `${dependency} ${result} must block publication`,
      );
    }
  assert.equal(
    runs(source, 'publish', {
      github: main,
      needs: needs({
        'release-build': { result: 'success', outputs: { build: 'false' } },
      }),
    }),
    false,
    'a published release must stay unchanged on rerun',
  );
  assert.equal(
    runs(source, 'publish', {
      github: { ...main, event_name: 'pull_request' },
      needs: needs(),
    }),
    false,
  );
  assert.match(job(source, 'release-build'), /^ {6}publish: false$/m);
});

test('standalone tag builds retain their publisher, while Quality postpones publication', () => {
  const source = workflow('release');
  const state = {
    prepare: { result: 'success' },
    build: { result: 'success' },
  };
  const tag = { ...main, ref: 'refs/tags/v0.6.16-rc.1', ref_type: 'tag' };
  assert.equal(
    runs(source, 'publish', { github: tag, needs: state, inputs: {} }),
    true,
  );
  assert.equal(
    runs(source, 'publish', {
      github: main,
      needs: state,
      inputs: { publish: false },
    }),
    false,
  );
  for (const result of ['failure', 'cancelled', 'skipped'])
    assert.equal(
      runs(source, 'publish', {
        github: tag,
        needs: { ...state, build: { result } },
        inputs: {},
      }),
      false,
    );
  const checks = /- run: npm run check:all\n {8}if: (.+)/.exec(source)?.[1];
  assert.ok(
    checks,
    'Standalone tags still require full checks before packaging.',
  );
  assert.equal(expression(checks, { github: tag }), true);
  assert.equal(expression(checks, { github: main }), false);
});

test('PR metadata edits validate the updated body without dispatching or cancelling code builds', () => {
  const quality = workflow('ci');
  const metadata = workflow('pr-metadata');
  const activities = (source) =>
    /^ {4}types: \[([^\]]+)\]/m.exec(source)[1].split(', ');
  for (const action of ['edited', 'ready_for_review']) {
    assert.equal(activities(quality).includes(action), false);
    assert.equal(activities(metadata).includes(action), true);
  }
  const group = (source, github) =>
    /^ {2}group: (.+)$/m
      .exec(source)[1]
      .replace(/\$\{\{[\s\S]*?\}\}/g, (part) => expression(part, { github }));
  const github = {
    ...main,
    event_name: 'pull_request',
    workflow: 'Quality',
    ref: 'refs/pull/163/merge',
    head_ref: 'codex/issue-163-buildzyklus',
    event: { pull_request: { number: 163, body: 'Closes #163' } },
  };
  assert.notEqual(group(quality, github), group(metadata, github));
  const block = job(metadata, 'issue');
  const value = (key) =>
    expression(new RegExp(`^ {10}${key}: (.+)$`, 'm').exec(block)[1], {
      github,
    });
  assert.equal(
    validateIssueWorkflow(
      value('PR_BRANCH'),
      value('PR_BODY'),
      (path) => path === 'docs/reviews/issue-163.md',
    ),
    '163',
  );
  github.event.pull_request.body = 'Closes #164';
  assert.throws(
    () =>
      validateIssueWorkflow(value('PR_BRANCH'), value('PR_BODY'), () => true),
    /Closes #163/,
  );
  assert.match(quality, /node scripts\/check-release-version\.mjs/);
});

test('CI checks frontend once, preserves native macOS verification, and saves separate Cargo caches only on main', () => {
  const quality = workflow('ci');
  assert.equal([...quality.matchAll(/run: npm run check$/gm)].length, 1);
  const desktop = job(quality, 'desktop');
  assert.match(desktop, /node --test scripts\/verify-macos-bundle\.test\.mjs/);
  assert.match(desktop, /npm run check:rust/);
  const debug = /- name: Build native executable\n {8}if: (.+)/.exec(
    desktop,
  )?.[1];
  assert.equal(expression(debug, { github: main }), false);
  assert.equal(
    expression(debug, { github: { ...main, event_name: 'pull_request' } }),
    true,
  );
  const caches = [quality, workflow('release')].map((source) => {
    const block =
      /- uses: Swatinem\/rust-cache@([^\n]+)\n((?:^ {8,}[^\n]*\n?)*)/m.exec(
        source,
      );
    assert.equal(
      block[1].split(' ')[0],
      '6323deb102c322ba6fcbdcafc7e3dddab59af2b6',
    );
    assert.match(block[2], /workspaces: src-tauri -> target/);
    return block[2];
  });
  assert.notEqual(
    /^ {10}shared-key: (.+)$/m.exec(caches[0])[1],
    /^ {10}shared-key: (.+)$/m.exec(caches[1])[1],
  );
  for (const cache of caches) {
    const save = /^ {10}save-if: (.+)$/m.exec(cache)[1];
    assert.equal(expression(save, { github: main }), true);
    assert.equal(
      expression(save, { github: { ...main, event_name: 'pull_request' } }),
      false,
    );
    assert.equal(
      expression(save, { github: { ...main, ref: 'refs/tags/v0.6.16-rc.1' } }),
      false,
    );
  }
});
