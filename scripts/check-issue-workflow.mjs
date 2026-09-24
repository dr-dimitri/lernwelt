import { existsSync } from 'node:fs';
import { resolve } from 'node:path';
import { pathToFileURL } from 'node:url';

export function validateIssueWorkflow(branch, body, hasReview) {
  const match = /^codex\/issue-([1-9]\d*)-[a-z0-9-]+$/.exec(branch);
  if (!match)
    throw new Error(
      'Jedes Issue benötigt einen eigenen Branch: codex/issue-<nummer>-<kurzname>.',
    );
  const issue = match[1];
  const closingIssues = [
    ...body.matchAll(
      /\b(?:close[sd]?|fix(?:e[sd])?|resolve[sd]?)\s+#(\d+)\b/gi,
    ),
  ].map((item) => item[1]);
  if (closingIssues.length !== 1 || closingIssues[0] !== issue) {
    throw new Error(
      `Der PR muss genau das Branch-Issue mit Closes #${issue} schließen.`,
    );
  }
  const review = `docs/reviews/issue-${issue}.md`;
  if (!hasReview(review)) throw new Error(`Reviewnachweis fehlt: ${review}`);
  return issue;
}

if (
  process.argv[1] &&
  import.meta.url === pathToFileURL(resolve(process.argv[1])).href
) {
  const issue = validateIssueWorkflow(
    process.env.PR_BRANCH ?? '',
    process.env.PR_BODY ?? '',
    existsSync,
  );
  console.log(
    `Issue #${issue}: Branch, Abschlussverknüpfung und Reviewdatei vorhanden.`,
  );
}
