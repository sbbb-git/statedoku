#!/usr/bin/env node
/**
 * Pass 5 — fix meta descriptions:
 *   1. Lengthen <110 chars by appending a contextual sentence
 *   2. Trim >160 chars to ~155 + "…"
 *   Both reflect to og:description + twitter:description for consistency.
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
const stats = { lengthen: 0, trim: 0 };

function ex(html, re) { return (html.match(re) || [])[1] || ''; }
function esc(s) { return String(s).replace(/&/g, '&amp;').replace(/"/g, '&quot;'); }

// Path-specific filler to lengthen short descriptions in a meaningful way
function fillerFor(rel) {
  if (/^cities\//.test(rel))  return ' Quick facts, location map, and the state capital.';
  if (/states\/[a-z-]+\/index\.html$/.test(rel)) return ' Capital, population, fun facts, region, and map.';
  if (/states\/[a-z-]+\/symbols\//.test(rel))   return ' Official state bird, flower, tree, motto, and flag.';
  if (/states\/[a-z-]+\/fun-facts\//.test(rel)) return ' 20 curated trivia facts about history, food, geography, and culture.';
  if (/states\/[a-z-]+\/food\//.test(rel))      return ' Local cuisine, iconic dishes, regional specialties.';
  if (/states\/[a-z-]+\/(history|geography|economy|elections|people|sports|travel|weather|map)\//.test(rel))
                                                 return ' Reference facts and quick context for learners and quiz fans.';
  if (/^learn\/is-[a-z-]+-a-state\//.test(rel)) return ' Quick disambiguation: city vs state, with state capital and region.';
  if (/^learn\/capital-of-[a-z-]+\//.test(rel)) return ' Quick disambiguation: city vs state capital, with state facts.';
  if (/^learn\//.test(rel))                     return ' Learn US geography step by step with maps, lists, and trivia.';
  if (/^regions\//.test(rel))                   return ' Region members, sub-regions, key facts, and a clickable map.';
  if (/^(fr|es)\//.test(rel))                   return ' Plus de détails, cartes et faits sur les 50 États.';
  return ' Free daily puzzle and reference content about the 50 US states.';
}

function smartTrim(s, max) {
  if (s.length <= max) return s;
  let cut = s.slice(0, max - 1);
  // Avoid cutting mid-word: backtrack to last space
  const lastSpace = cut.lastIndexOf(' ');
  if (lastSpace > max - 30) cut = cut.slice(0, lastSpace);
  return cut.replace(/[,.;:\s]+$/, '') + '…';
}

for (const f of files) {
  let html = fs.readFileSync(f, 'utf8');
  const rel = path.relative(ROOT, f);

  const robots = ex(html, /<meta\s+name="robots"\s+content="([^"]*)"/i);
  if (/noindex/i.test(robots)) continue;

  const desc = ex(html, /<meta\s+name="description"\s+content="([^"]*)"/i);
  if (!desc) continue;

  let newDesc = desc;
  let action = null;

  if (desc.length < 110) {
    const filler = fillerFor(rel).trim();
    // Add filler if it brings us into the 110-160 range
    const candidate = (desc.replace(/\s+$/, '').replace(/\.?$/, '.') + ' ' + filler).trim();
    if (candidate.length >= 110 && candidate.length <= 160) {
      newDesc = candidate;
      action = 'lengthen';
    } else if (candidate.length > 160) {
      newDesc = smartTrim(candidate, 158);
      action = 'lengthen';
    }
  } else if (desc.length > 160) {
    newDesc = smartTrim(desc, 158);
    action = 'trim';
  }

  if (action && newDesc !== desc) {
    // Update description + og:description + twitter:description for consistency
    html = html.replace(
      /(<meta\s+name="description"\s+content=")[^"]*(")/i,
      `$1${esc(newDesc)}$2`
    );
    html = html.replace(
      /(<meta\s+property="og:description"\s+content=")[^"]*(")/i,
      `$1${esc(newDesc)}$2`
    );
    html = html.replace(
      /(<meta\s+name="twitter:description"\s+content=")[^"]*(")/i,
      `$1${esc(newDesc)}$2`
    );
    fs.writeFileSync(f, html);
    if (action === 'lengthen') stats.lengthen++;
    else stats.trim++;
  }
}

console.log('\n📊 PASS 5 FIX REPORT');
console.log('='.repeat(50));
console.log(`Descriptions lengthened (110+):  ${stats.lengthen}`);
console.log(`Descriptions trimmed (≤160):     ${stats.trim}`);
