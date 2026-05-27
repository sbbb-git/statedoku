#!/usr/bin/env node
/**
 * Add r/Statedoku Reddit link to every HTML page footer.
 *
 * Strategy:
 *   - Inserts a "Reddit" link just after "Statedoku &copy; 2026" + first separator
 *   - Skips pages where it's already present (idempotent)
 *   - Handles EN/FR/ES variants — Reddit URL is the same, only the label differs
 */
const fs = require('fs');
const path = require('path');

const ROOT = path.resolve(__dirname, '..');
const EXCLUDE = ['.git', 'node_modules', 'tmp', '.wrangler'];
const REDDIT_URL = 'https://www.reddit.com/r/Statedoku/';

function walkHtml(dir, out = []) {
  for (const e of fs.readdirSync(dir, { withFileTypes: true })) {
    if (e.name.startsWith('.')) continue;
    const full = path.join(dir, e.name);
    const rel = path.relative(ROOT, full);
    if (EXCLUDE.some(x => rel.startsWith(x))) continue;
    if (e.isDirectory()) walkHtml(full, out);
    else if (e.name.endsWith('.html')) out.push(full);
  }
  return out;
}

let count = 0;
for (const f of walkHtml(ROOT)) {
  let html = fs.readFileSync(f, 'utf8');
  if (html.includes(REDDIT_URL)) continue; // already present

  const rel = path.relative(ROOT, f);
  // Detect language from path
  const isFr = rel.startsWith('fr/');
  const isEs = rel.startsWith('es/');
  const label = '💬 Reddit'; // Same emoji + label across all langs — Reddit is a brand name

  // Match the footer pattern: <p>Statedoku &copy; 2026 &nbsp;·&nbsp; <link 1> ...
  // Insert the Reddit link right after the © year, before the first separator.
  const before = `Statedoku &copy; 2026 &nbsp;·&nbsp;`;
  const reddit = ` <a href="${REDDIT_URL}" rel="noopener" target="_blank">${label}</a> &nbsp;·&nbsp;`;

  if (html.includes(before)) {
    const next = html.replace(before, before + reddit);
    if (next !== html) {
      fs.writeFileSync(f, next);
      count++;
    }
  }
}
console.log(`✅ Reddit link added to ${count} pages.`);
