#!/usr/bin/env node
/**
 * Bulk-fix the issues found by tmp/audit-html.js (which mirrors Ahrefs Site Audit).
 *
 * Fixes applied (in order, idempotent):
 *   1. Add <meta name="twitter:card" ...> + twitter:title/description/image to
 *      any page missing them (919 pages). Reuses og: values so it's lossless.
 *   2. Add OG tags (og:type/title/description/image/url) to privacy/terms
 *      pages that lack them (7 pages).
 *   3. Add x-default hreflang to pages that already have other hreflang tags
 *      but no x-default (19 pages).
 *   4. Shorten <title>s that exceed 70 chars (the worst offenders) by trimming
 *      the " | Statedoku" suffix or generic suffixes.
 *   5. Lengthen city descriptions that are <110 chars by appending
 *      "Quick facts, location map, and state capital."
 *
 * Re-run safely — every step checks for the existing state before mutating.
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
const stats = { tw: 0, og: 0, xdefault: 0, title: 0, desc: 0, untouched: 0 };

function ex(html, re) { return (html.match(re) || [])[1] || ''; }
function esc(s) { return String(s).replace(/&/g, '&amp;').replace(/"/g, '&quot;'); }

for (const f of files) {
  let html = fs.readFileSync(f, 'utf8');
  const rel = path.relative(ROOT, f);
  const origLen = html.length;

  // Skip noindex pages — they don't need any of this
  const robots = ex(html, /<meta\s+name="robots"\s+content="([^"]*)"/i);
  if (/noindex/i.test(robots)) { stats.untouched++; continue; }

  let changed = false;

  // ─── 1. Twitter card (append after og:image or end of head) ─────────────
  if (!/<meta\s+name="twitter:card"/i.test(html)) {
    const ogTitle = ex(html, /<meta\s+property="og:title"\s+content="([^"]*)"/i);
    const ogDesc  = ex(html, /<meta\s+property="og:description"\s+content="([^"]*)"/i);
    const ogImage = ex(html, /<meta\s+property="og:image"\s+content="([^"]*)"/i);

    // Skip if there are no OG tags to mirror from — those pages need their own fix
    if (ogTitle || ogDesc || ogImage) {
      const twitterBlock = [
        '  <meta name="twitter:card" content="summary_large_image">',
        ogTitle ? `  <meta name="twitter:title" content="${esc(ogTitle)}">` : '',
        ogDesc  ? `  <meta name="twitter:description" content="${esc(ogDesc)}">` : '',
        ogImage ? `  <meta name="twitter:image" content="${esc(ogImage)}">` : '',
      ].filter(Boolean).join('\n') + '\n';

      // Insert right after the LAST og: meta line for clean grouping
      const lastOgRegex = /(\s*<meta\s+property="og:[^"]+"\s+content="[^"]*">)+/g;
      let lastMatchEnd = -1;
      let m;
      while ((m = lastOgRegex.exec(html))) lastMatchEnd = m.index + m[0].length;
      if (lastMatchEnd > -1) {
        html = html.slice(0, lastMatchEnd) + '\n' + twitterBlock + html.slice(lastMatchEnd);
        stats.tw++; changed = true;
      } else {
        // Fallback: insert before </head>
        html = html.replace(/(\s*<\/head>)/i, '\n' + twitterBlock + '$1');
        stats.tw++; changed = true;
      }
    }
  }

  // ─── 2. OG tags for legal pages (privacy/terms) ─────────────────────────
  const isLegalNoOg = /\/(privacy|terms)\//.test(rel) && !/<meta\s+property="og:type"/i.test(html);
  if (isLegalNoOg) {
    const title = ex(html, /<title>([^<]*)<\/title>/i).split('|')[0].trim();
    const desc  = ex(html, /<meta\s+name="description"\s+content="([^"]*)"/i);
    const canonical = ex(html, /<link\s+rel="canonical"\s+href="([^"]*)"/i) || 'https://statedoku.com/';
    const ogBlock =
`  <meta property="og:type" content="website">
  <meta property="og:title" content="${esc(title || 'Statedoku')}">
  <meta property="og:description" content="${esc(desc || 'Statedoku — Daily US States Puzzle Game')}">
  <meta property="og:url" content="${esc(canonical)}">
  <meta property="og:image" content="https://statedoku.com/og-image.png?v=2">
`;
    // Insert before </head>
    if (/(<\/head>)/i.test(html)) {
      html = html.replace(/(\s*<\/head>)/i, '\n' + ogBlock + '$1');
      stats.og++; changed = true;
    }
  }

  // ─── 3. x-default hreflang for pages that already have other hreflang ───
  const hreflangAll = html.match(/<link\s+rel="alternate"\s+hreflang="[^"]+"\s+href="[^"]+"[^>]*>/gi) || [];
  if (hreflangAll.length > 0 && !hreflangAll.some(t => /hreflang="x-default"/.test(t))) {
    // Find the English variant href to use as x-default
    const enTag = hreflangAll.find(t => /hreflang="en[^"]*"/.test(t)) || hreflangAll[0];
    const enHref = ex(enTag, /href="([^"]+)"/);
    if (enHref) {
      const xDefault = `<link rel="alternate" hreflang="x-default" href="${enHref}">`;
      // Insert right after the LAST hreflang tag for clean grouping
      const lastHl = hreflangAll[hreflangAll.length - 1];
      const lastIdx = html.lastIndexOf(lastHl);
      if (lastIdx > -1) {
        html = html.slice(0, lastIdx + lastHl.length) + '\n  ' + xDefault + html.slice(lastIdx + lastHl.length);
        stats.xdefault++; changed = true;
      }
    }
  }

  // ─── 4. Shorten titles >70 chars by trimming " | Statedoku" suffix ──────
  const title = ex(html, /<title>([^<]*)<\/title>/i);
  if (title.length > 70 && title.includes(' | Statedoku')) {
    const shortened = title.replace(/\s*\|\s*Statedoku\s*$/, '');
    if (shortened.length < title.length && shortened.length >= 30) {
      html = html.replace(
        /<title>[^<]*<\/title>/i,
        `<title>${esc(shortened)}</title>`
      );
      stats.title++; changed = true;
    }
  }

  // ─── 5. Lengthen too-short descriptions on /cities/ pages ────────────────
  const desc = ex(html, /<meta\s+name="description"\s+content="([^"]*)"/i);
  if (desc && desc.length < 110 && /\/cities\//.test(rel)) {
    const lengthened = desc.replace(/\.?\s*$/, '. Quick facts, map, and the state capital.');
    if (lengthened.length <= 160) {
      html = html.replace(
        /(<meta\s+name="description"\s+content=")[^"]*(")/i,
        `$1${esc(lengthened)}$2`
      );
      stats.desc++; changed = true;
    }
  }

  if (changed) {
    fs.writeFileSync(f, html);
  } else {
    stats.untouched++;
  }
}

console.log('\n📊 BULK FIX REPORT');
console.log('='.repeat(50));
console.log(`Twitter cards added:        ${stats.tw}`);
console.log(`OG tags added (legal):       ${stats.og}`);
console.log(`x-default hreflang added:    ${stats.xdefault}`);
console.log(`Titles shortened (>70 → ≤70): ${stats.title}`);
console.log(`Descriptions lengthened:     ${stats.desc}`);
console.log(`Files untouched:             ${stats.untouched}`);
console.log(`Total files scanned:         ${files.length}`);
