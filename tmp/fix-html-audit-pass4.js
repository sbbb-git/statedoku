#!/usr/bin/env node
/**
 * Pass 4 — final cleanup:
 *   1. Add Twitter card to ANY page missing it (more relaxed than pass1).
 *      If OG tags exist, mirror them. Otherwise use a sensible default.
 *   2. Add hreflang to the 50 /states/{slug}/index.html pages (the main state
 *      pages), pointing to their /es/states/{slug}/ siblings + en-* variants
 *      + x-default. Closes the reciprocity loop.
 *   3. Add OG block to es/states/index.html (only remaining OG-missing page).
 */
const fs = require('fs');
const path = require('path');

const ROOT = path.resolve(__dirname, '..');
const EXCLUDE = ['.git', 'node_modules', 'tmp', '.wrangler'];

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

const files = walkHtml(ROOT);
const stats = { tw: 0, hreflang: 0, og: 0 };

function ex(html, re) { return (html.match(re) || [])[1] || ''; }
function esc(s) { return String(s).replace(/&/g, '&amp;').replace(/"/g, '&quot;'); }

// Build set of state slugs that have an /es/states/{slug}/ counterpart
const esStateSlugs = new Set();
for (const f of files) {
  const rel = path.relative(ROOT, f);
  const m = rel.match(/^es\/states\/([a-z-]+)\/index\.html$/);
  if (m) esStateSlugs.add(m[1]);
}

for (const f of files) {
  let html = fs.readFileSync(f, 'utf8');
  const rel = path.relative(ROOT, f);

  const robots = ex(html, /<meta\s+name="robots"\s+content="([^"]*)"/i);
  if (/noindex/i.test(robots)) continue;

  let changed = false;

  // ─── 1. Add Twitter card if missing (regardless of OG state) ────────────
  if (!/<meta\s+name="twitter:card"/i.test(html)) {
    const title = ex(html, /<title>([^<]*)<\/title>/i) || 'Statedoku';
    const desc  = ex(html, /<meta\s+name="description"\s+content="([^"]*)"/i) || 'Daily US States Puzzle Game';
    const ogImage = ex(html, /<meta\s+property="og:image"\s+content="([^"]*)"/i) || 'https://statedoku.com/og-image.png?v=2';
    const block =
`  <meta name="twitter:card" content="summary_large_image">
  <meta name="twitter:title" content="${esc(title)}">
  <meta name="twitter:description" content="${esc(desc)}">
  <meta name="twitter:image" content="${esc(ogImage)}">
`;
    // Insert before </head>
    if (/<\/head>/i.test(html)) {
      html = html.replace(/(\s*<\/head>)/i, '\n' + block + '$1');
      stats.tw++; changed = true;
    }
  }

  // ─── 2. Hreflang on main /states/{slug}/index.html pages ────────────────
  const stateMatch = rel.match(/^states\/([a-z-]+)\/index\.html$/);
  if (stateMatch) {
    const slug = stateMatch[1];
    const canonical = `https://statedoku.com/states/${slug}/`;
    const hasHreflang = /<link\s+rel="alternate"\s+hreflang=/i.test(html);
    if (!hasHreflang) {
      const hasEs = esStateSlugs.has(slug);
      const lines = [
        `  <link rel="alternate" hreflang="en" href="${canonical}">`,
        `  <link rel="alternate" hreflang="en-US" href="${canonical}">`,
        `  <link rel="alternate" hreflang="en-GB" href="${canonical}">`,
        `  <link rel="alternate" hreflang="en-CA" href="${canonical}">`,
        `  <link rel="alternate" hreflang="en-AU" href="${canonical}">`,
        `  <link rel="alternate" hreflang="en-IN" href="${canonical}">`,
        hasEs ? `  <link rel="alternate" hreflang="es" href="https://statedoku.com/es/states/${slug}/">` : '',
        `  <link rel="alternate" hreflang="x-default" href="${canonical}">`,
      ].filter(Boolean).join('\n');
      // Insert after the canonical line
      const canonicalLine = html.match(/<link\s+rel="canonical"\s+href="[^"]*">/i);
      if (canonicalLine) {
        html = html.replace(canonicalLine[0], canonicalLine[0] + '\n' + lines);
        stats.hreflang++; changed = true;
      }
    }
  }

  // ─── 3. Add OG block to es/states/index.html (hub page) ─────────────────
  if (rel === 'es/states/index.html' && !/<meta\s+property="og:type"/i.test(html)) {
    const title = ex(html, /<title>([^<]*)<\/title>/i).split('|')[0].trim() || 'Estados de EE.UU.';
    const desc  = ex(html, /<meta\s+name="description"\s+content="([^"]*)"/i) || 'Los 50 estados de EE.UU. — fichas, capitales y datos.';
    const canonical = ex(html, /<link\s+rel="canonical"\s+href="([^"]*)"/i) || 'https://statedoku.com/es/states/';
    const block =
`  <meta property="og:type" content="website">
  <meta property="og:title" content="${esc(title)}">
  <meta property="og:description" content="${esc(desc)}">
  <meta property="og:url" content="${esc(canonical)}">
  <meta property="og:image" content="https://statedoku.com/og-image.png?v=2">
  <meta property="og:locale" content="es_ES">
`;
    if (/<\/head>/i.test(html)) {
      html = html.replace(/(\s*<\/head>)/i, '\n' + block + '$1');
      stats.og++; changed = true;
    }
  }

  if (changed) fs.writeFileSync(f, html);
}

console.log('\n📊 PASS 4 FIX REPORT');
console.log('='.repeat(50));
console.log(`Twitter cards added (final):  ${stats.tw}`);
console.log(`Hreflang on 50 state pages:   ${stats.hreflang}`);
console.log(`OG added (es/states hub):     ${stats.og}`);
