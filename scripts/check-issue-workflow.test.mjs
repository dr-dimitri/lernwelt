import { test } from 'node:test';
import assert from 'node:assert/strict';
import { validateIssueWorkflow } from './check-issue-workflow.mjs';

test('accepts one matching issue and its review', () => {
  assert.equal(
    validateIssueWorkflow(
      'codex/issue-4-quality',
      'Closes #4',
      (path) => path === 'docs/reviews/issue-4.md',
    ),
    '4',
  );
});

test('rejects wrong branches, missing review and mismatched or multiple closing issues', () => {
  for (const [branch, body, review] of [
    ['main', 'Closes #4', true],
    ['codex/issue-4-quality', 'Closes #3', true],
    ['codex/issue-4-quality', 'Closes #4\nFixes #5', true],
    ['codex/issue-4-quality', 'Closes #4', false],
    ['codex/issue-4-quality', 'Related to #4', true],
  ]) {
    assert.throws(() => validateIssueWorkflow(branch, body, () => review));
  }
});
