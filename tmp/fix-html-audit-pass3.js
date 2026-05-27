#!/usr/bin/env node
/**
 * Pass 3 — fix what pass 1 + pass 2 missed:
 *   1. Legal pages without OG/Twitter (regex was too narrow)
 *   2. /learn/X/ + /facts/ + /launch/ pages missing hreflang
 *   3. capital-of-X titles still >70 chars (regex didn't match)
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
const stats = { ogLegal: 0, hreflang: 0, capitalOf: 0, otherTitle: 0 };

function ex(html, re) { return (html.match(re) || [])[1] || ''; }
function esc(s) { return String(s).replace(/&/g, '&amp;').replace(/"/g, '&quot;'); }

for (const f of files) {
  let html = fs.readFileSync(f, 'utf8');
  const rel = path.relative(ROOT, f);

  const robots = ex(html, /<meta\s+name="robots"\s+content="([^"]*)"/i);
  if (/noindex/i.test(robots)) continue;

  let changed = false;

  // ─── 1. Legal pages (privacy/terms/faq) without OG/Twitter ──────────────
  const isLegal = /(?:^|\/)(privacy|terms|faq)\/index\.html$/.test(rel);
  if (isLegal && !/<meta\s+property="og:type"/i.test(html)) {
    const titleNow = ex(html, /<title>([^<]*)<\/title>/i).split('|')[0].trim() || 'Statedoku';
    const descNow  = ex(html, /<meta\s+name="description"\s+content="([^"]*)"/i) || 'Statedoku — Daily US States Puzzle Game';
    const canonical = ex(html, /<link\s+rel="canonical"\s+href="([^"]*)"/i) || 'https://statedoku.com/';
    const block =
`  <meta property="og:type" content="website">
  <meta property="og:title" content="${esc(titleNow)}">
  <meta property="og:description" content="${esc(descNow)}">
  <meta property="og:url" content="${esc(canonical)}">
  <meta property="og:image" content="https://statedoku.com/og-image.png?v=2">
  <meta name="twitter:card" content="summary_large_image">
  <meta name="twitter:title" content="${esc(titleNow)}">
  <meta name="twitter:description" content="${esc(descNow)}">
  <meta name="twitter:image" content="https://statedoku.com/og-image.png?v=2">
`;
    if (/<\/head>/i.test(html)) {
      html = html.replace(/(\s*<\/head>)/i, '\n' + block + '$1');
      stats.ogLegal++; changed = true;
    }
  }

  // ─── 2. /learn/X/ + other single-locale EN pages missing hreflang ───────
  const hasHreflang = /<link\s+rel="alternate"\s+hreflang=/i.test(html);
  const canonical = ex(html, /<link\s+rel="canonical"\s+href="([^"]*)"/i);
  if (!hasHreflang && canonical) {
    // Match learn/, facts/, launch/, quiz/, about/, faq/, archive/, plus any
    // missed single-locale English pages
    const isEnSingleLocale =
      /^learn\/[a-z-]+\/index\.html$/.test(rel) ||
      /^facts\/index\.html$/.test(rel) ||
      /^launch\/index\.html$/.test(rel) ||
      /^quiz\/index\.html$/.test(rel) ||
      /^archive\/index\.html$/.test(rel) ||
      /^cities\/index\.html$/.test(rel) ||
      /^states\/index\.html$/.test(rel) ||
      /^regions\/[a-z-]*\/?index\.html$/.test(rel);

    if (isEnSingleLocale) {
      const block =
`  <link rel="alternate" hreflang="en" href="${canonical}">
  <link rel="alternate" hreflang="en-US" href="${canonical}">
  <link rel="alternate" hreflang="en-GB" href="${canonical}">
  <link rel="alternate" hreflang="en-CA" href="${canonical}">
  <link rel="alternate" hreflang="en-AU" href="${canonical}">
  <link rel="alternate" hreflang="en-IN" href="${canonical}">
  <link rel="alternate" hreflang="x-default" href="${canonical}">`;
      html = html.replace(/(<link\s+rel="canonical"\s+href="[^"]*">)/i, `$1\n${block}`);
      stats.hreflang++; changed = true;
    }

    // FR/ES archive pages
    const frArchive = /^fr\/archive\/index\.html$/.test(rel);
    const esArchive = /^es\/archive\/index\.html$/.test(rel);
    if (frArchive || esArchive) {
      const lang = frArchive ? 'fr' : 'es';
      const block =
`  <link rel="alternate" hreflang="en" href="https://statedoku.com/archive/">
  <link rel="alternate" hreflang="${lang}" href="${canonical}">
  <link rel="alternate" hreflang="x-default" href="https://statedoku.com/archive/">`;
      html = html.replace(/(<link\s+rel="canonical"\s+href="[^"]*">)/i, `$1\n${block}`);
      stats.hreflang++; changed = true;
    }
  }

  // ─── 3. Capital-of-X titles still too long (loose match) ────────────────
  if (/(?:^|\/)learn\/capital-of-[a-z-]+\//.test(rel)) {
    const titleM = html.match(/<title>([^<]*)<\/title>/i);
    if (titleM && titleM[1].length > 60) {
      const t = titleM[1];
      // Extract city + state + capital with looser regex (em-dash, parens, etc.)
      const m = t.match(/capital of ([^?]+)\?.*?is a city in (.+?) \(capital:\s*(.+?)\)/i);
      if (m) {
        const city = m[1].trim(), stateName = m[2].trim(), cap = m[3].trim();
        let newTitle = `Capital of ${city}? It's in ${stateName} (cap. ${cap})`;
        if (newTitle.length > 60) newTitle = `${city} is in ${stateName} (cap. ${cap})`;
        if (newTitle.length > 60) newTitle = `${city}: city in ${stateName}, cap. ${cap}`;
        html = html.replace(/<title>[^<]*<\/title>/i, `<title>${esc(newTitle)}</title>`);
        // Also update og:title and twitter:title to match
        html = html.replace(
          /(<meta\s+property="og:title"\s+content=")[^"]*(")/i,
          `$1${esc(newTitle)}$2`
        );
        html = html.replace(
          /(<meta\s+name="twitter:title"\s+content=")[^"]*(")/i,
          `$1${esc(newTitle)}$2`
        );
        stats.capitalOf++; changed = true;
      }
    }
  }

  // ─── 4. Shorten remaining specific titles (>60 to ≤60) ─────────────────
  // is-X-a-state titles like "Is Boston a state? — No, Boston is a city in Massachusetts (MA)" = 63 chars
  if (/(?:^|\/)learn\/is-[a-z-]+-a-state\//.test(rel)) {
    const titleM = html.match(/<title>([^<]*)<\/title>/i);
    if (titleM && titleM[1].length > 60) {
      const t = titleM[1];
      // "Is X a state? — No, X is a city in {State} (USPS)" → "Is X a state? No — it's in {State}"
      const m = t.match(/^Is ([A-Z][^?]+) a state\? .+? is a city in (.+?) \([A-Z]{2}\)/);
      if (m) {
        const city = m[1].trim(), stateName = m[2].trim();
        const newTitle = `Is ${city} a state? No — it's in ${stateName}`;
        if (newTitle.length <= 60) {
          html = html.replace(/<title>[^<]*<\/title>/i, `<title>${esc(newTitle)}</title>`);
          html = html.replace(
            /(<meta\s+property="og:title"\s+content=")[^"]*(")/i,
            `$1${esc(newTitle)}$2`
          );
          html = html.replace(
            /(<meta\s+name="twitter:title"\s+content=")[^"]*(")/i,
            `$1${esc(newTitle)}$2`
          );
          stats.otherTitle++; changed = true;
        }
      }
    }
  }

  if (changed) fs.writeFileSync(f, html);
}

console.log('\n📊 PASS 3 FIX REPORT');
console.log('='.repeat(50));
console.log(`OG+Twitter on legal pages:  ${stats.ogLegal}`);
console.log(`Hreflang added (other):     ${stats.hreflang}`);
console.log(`capital-of titles rewritten: ${stats.capitalOf}`);
console.log(`is-X-a-state titles shorter:  ${stats.otherTitle}`);
