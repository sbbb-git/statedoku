#!/usr/bin/env node
/**
 * Pass 2 fixes after pass 1 (tmp/fix-html-audit.js):
 *   1. Trim " | Statedoku" / " | Statedoku Admin" suffix from titles 60-69 chars
 *      (drops them below the 60-char SERP cutoff while keeping the meaningful part)
 *   2. Rewrite the "capital-of-{city}/" titles that are 80-95 chars
 *   3. Add basic OG + Twitter card to the 7 legal pages that have neither
 *   4. Add hreflang en + en-US + x-default to /cities/ and state sub-pages
 *      that have no hreflang at all (302 pages)
 *   5. Fix hreflang reciprocity: every /states/{slug}/ that has an /es/ sibling
 *      gets an es hreflang return tag (and vice versa)
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
const stats = { titleTrim: 0, titleRewrite: 0, ogLegal: 0, hreflang: 0, reciprocity: 0 };

function ex(html, re) { return (html.match(re) || [])[1] || ''; }
function esc(s) { return String(s).replace(/&/g, '&amp;').replace(/"/g, '&quot;'); }

// Build slug → has /es/ version map for state pages
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

  // ─── 1. Trim " | Statedoku" suffix on titles 60-69 chars ────────────────
  const titleM = html.match(/<title>([^<]*)<\/title>/i);
  if (titleM) {
    const title = titleM[1];
    if (title.length >= 60 && title.length <= 69 && / \| Statedoku\s*$/.test(title)) {
      const shorter = title.replace(/\s*\|\s*Statedoku\s*$/, '');
      if (shorter.length >= 30) {
        html = html.replace(/<title>[^<]*<\/title>/i, `<title>${esc(shorter)}</title>`);
        stats.titleTrim++; changed = true;
      }
    }
  }

  // ─── 2. Rewrite oversized capital-of-X titles ──────────────────────────
  if (/\/learn\/capital-of-[a-z-]+\//.test(rel)) {
    const newTitleM = html.match(/<title>([^<]*)<\/title>/i);
    if (newTitleM && newTitleM[1].length > 70) {
      // Pattern: "What is the capital of {City}? — {City} is a city in {State} (capital: {Cap}) | Statedoku"
      // Shorter: "Capital of {City}? — It's in {State}, capital {Cap}"
      const newM = newTitleM[1].match(/What is the capital of ([^?]+)\? — \1 is a city in (.+?) \(capital: (.+?)\)/);
      if (newM) {
        const city = newM[1], stateName = newM[2], cap = newM[3];
        const newTitle = `Capital of ${city}? It's a city in ${stateName} (capital: ${cap})`;
        if (newTitle.length <= 60 + 5) { // give 5 chars of slack
          html = html.replace(/<title>[^<]*<\/title>/i, `<title>${esc(newTitle)}</title>`);
          stats.titleRewrite++; changed = true;
        } else {
          // Fall back to even shorter
          const shorter = `Capital of ${city}? — In ${stateName}, capital ${cap}`;
          html = html.replace(/<title>[^<]*<\/title>/i, `<title>${esc(shorter)}</title>`);
          stats.titleRewrite++; changed = true;
        }
      }
    }
  }

  // ─── 3. Add OG + Twitter to legal pages that have neither ───────────────
  const isLegal = /\/(privacy|terms)\/index\.html$/.test(rel) || /\/(faq)\/index\.html$/.test(rel);
  if (isLegal && !/<meta\s+property="og:type"/i.test(html) && !/<meta\s+name="twitter:card"/i.test(html)) {
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

  // ─── 4. Add hreflang en/en-US/x-default to pages that have NO hreflang ──
  const hasHreflang = /<link\s+rel="alternate"\s+hreflang=/i.test(html);
  const canonical = ex(html, /<link\s+rel="canonical"\s+href="([^"]*)"/i);
  if (!hasHreflang && canonical && /<link\s+rel="canonical"/i.test(html)) {
    const isCity = /^cities\/[a-z-]+\/index\.html$/.test(rel);
    const isStateSub = /^states\/[a-z-]+\/[a-z-]+\/index\.html$/.test(rel);
    const isIsXState = /^learn\/is-[a-z-]+-a-state\/index\.html$/.test(rel);
    const isCapitalOf = /^learn\/capital-of-[a-z-]+\/index\.html$/.test(rel);

    // Add hreflang for English-language single-locale pages
    if (isCity || isStateSub) {
      // Build tag block
      const block =
`  <link rel="alternate" hreflang="en" href="${canonical}">
  <link rel="alternate" hreflang="en-US" href="${canonical}">
  <link rel="alternate" hreflang="en-GB" href="${canonical}">
  <link rel="alternate" hreflang="en-CA" href="${canonical}">
  <link rel="alternate" hreflang="en-AU" href="${canonical}">
  <link rel="alternate" hreflang="en-IN" href="${canonical}">
  <link rel="alternate" hreflang="x-default" href="${canonical}">`;
      // Insert after canonical
      html = html.replace(/(<link\s+rel="canonical"\s+href="[^"]*">)/i, `$1\n${block}`);
      stats.hreflang++; changed = true;
    }
    // is-X-a-state and capital-of-X already had hreflang in their template
    // but if they somehow lost it, add it back
  }

  // ─── 5. Reciprocity: ensure /states/{slug}/index.html links to /es/states/{slug}/ ──
  const stateMatch = rel.match(/^states\/([a-z-]+)\/index\.html$/);
  if (stateMatch && esStateSlugs.has(stateMatch[1])) {
    const slug = stateMatch[1];
    const esUrl = `https://statedoku.com/es/states/${slug}/`;
    if (!html.includes(`hreflang="es"`) || !html.includes(esUrl)) {
      // Add the es hreflang tag after any existing en hreflang
      const enTag = (html.match(/<link\s+rel="alternate"\s+hreflang="en"\s+href="[^"]*">/i) || [])[0];
      const esBlock = `\n  <link rel="alternate" hreflang="es" href="${esUrl}">`;
      if (enTag) {
        html = html.replace(enTag, enTag + esBlock);
        stats.reciprocity++; changed = true;
      }
    }
  }

  // Reverse reciprocity: /es/states/{slug}/ already has hreflang en pointing
  // to /states/{slug}/ via the generator — should already be reciprocated by step 5.

  if (changed) fs.writeFileSync(f, html);
}

console.log('\n📊 PASS 2 FIX REPORT');
console.log('='.repeat(50));
console.log(`Titles trimmed (| Statedoku):  ${stats.titleTrim}`);
console.log(`Titles rewritten (capital-of): ${stats.titleRewrite}`);
console.log(`OG+Twitter added to legal:     ${stats.ogLegal}`);
console.log(`Hreflang added to single-locale: ${stats.hreflang}`);
console.log(`Reciprocity tags added:        ${stats.reciprocity}`);
