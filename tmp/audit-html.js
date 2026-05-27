#!/usr/bin/env node
/**
 * Local mirror of Ahrefs Site Audit. Scans every .html in the repo (excluding
 * node_modules/.git/tmp), extracts title/description/og/twitter/hreflang/canonical
 * and reports issues we can fix in bulk.
 */
const fs = require('fs');
const path = require('path');

const ROOT = path.resolve(__dirname, '..');
const EXCLUDE = ['.git', 'node_modules', 'tmp', '.wrangler', 'archive/index.html'];

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

function ex(html, re) { return (html.match(re) || [])[1] || ''; }

const files = walkHtml(ROOT);
const issues = {
  titleTooLong: [],          // > 60 chars
  titleTooShort: [],         // < 30 chars
  descTooShort: [],          // < 110 chars
  descTooLong: [],           // > 160 chars
  ogMissing: [],
  ogIncomplete: [],          // has og:type but missing og:image OR og:title OR og:description
  twitterCardMissing: [],
  hreflangMissing: [],       // no hreflang at all
  hreflangXDefaultMissing: [], // has hreflang but no x-default
  canonicalMissing: [],
  metaRobotsNoindex: [],
};

const pages = [];

for (const f of files) {
  const html = fs.readFileSync(f, 'utf8');
  const rel = path.relative(ROOT, f);

  const title       = ex(html, /<title>([^<]*)<\/title>/i).trim();
  const desc        = ex(html, /<meta\s+name="description"\s+content="([^"]*)"/i);
  const robots      = ex(html, /<meta\s+name="robots"\s+content="([^"]*)"/i);
  const canonical   = ex(html, /<link\s+rel="canonical"\s+href="([^"]*)"/i);
  const ogTitle     = ex(html, /<meta\s+property="og:title"\s+content="([^"]*)"/i);
  const ogDesc      = ex(html, /<meta\s+property="og:description"\s+content="([^"]*)"/i);
  const ogImage     = ex(html, /<meta\s+property="og:image"\s+content="([^"]*)"/i);
  const ogType      = ex(html, /<meta\s+property="og:type"\s+content="([^"]*)"/i);
  const twCard      = ex(html, /<meta\s+name="twitter:card"\s+content="([^"]*)"/i);
  const hreflang    = (html.match(/<link\s+rel="alternate"\s+hreflang="([^"]+)"\s+href="[^"]+"/gi) || []);
  const hreflangXd  = hreflang.some(s => /hreflang="x-default"/.test(s));

  pages.push({ rel, title, desc, canonical, ogTitle, ogDesc, ogImage, ogType, twCard, hreflangCount: hreflang.length, hreflangXd, robots });

  if (robots && /noindex/i.test(robots)) {
    issues.metaRobotsNoindex.push({ rel, robots });
    continue; // don't audit noindex pages
  }

  if (title) {
    if (title.length > 60) issues.titleTooLong.push({ rel, value: title, length: title.length });
    if (title.length < 30) issues.titleTooShort.push({ rel, value: title, length: title.length });
  }
  if (desc) {
    if (desc.length < 110) issues.descTooShort.push({ rel, value: desc, length: desc.length });
    if (desc.length > 160) issues.descTooLong.push({ rel, value: desc, length: desc.length });
  }
  if (!ogType && !ogTitle && !ogImage) {
    issues.ogMissing.push({ rel });
  } else if (ogType && (!ogImage || !ogTitle || !ogDesc)) {
    issues.ogIncomplete.push({ rel, missing: [!ogTitle && 'og:title', !ogDesc && 'og:description', !ogImage && 'og:image'].filter(Boolean) });
  }
  if (!twCard) issues.twitterCardMissing.push({ rel });
  if (hreflang.length === 0) issues.hreflangMissing.push({ rel });
  else if (!hreflangXd) issues.hreflangXDefaultMissing.push({ rel });
  if (!canonical) issues.canonicalMissing.push({ rel });
}

const report = {
  total_pages: files.length,
  total_indexable: pages.filter(p => !p.robots || !/noindex/i.test(p.robots)).length,
  issues: Object.fromEntries(Object.entries(issues).map(([k, v]) => [k, v.length])),
};

console.log('\n📊 LOCAL HTML AUDIT — Statedoku');
console.log('='.repeat(70));
console.log(`Total HTML files scanned: ${report.total_pages}`);
console.log(`Indexable pages (no robots=noindex): ${report.total_indexable}`);
console.log('='.repeat(70));
console.log(JSON.stringify(report.issues, null, 2));

// Save the detailed lists
fs.writeFileSync(path.join(ROOT, 'tmp/audit-html-report.json'), JSON.stringify(issues, null, 2));
console.log('\n💾 Full per-issue details: tmp/audit-html-report.json');
