#!/usr/bin/env node
/**
 * SEO title rewrites based on GSC May 12-21 data.
 * - /cities/{slug}/  → "What state is {City} in? — {State} (USPS) | Statedoku"
 * - /states/{slug}/symbols/ → "{State} State Symbols: Bird, Flower, Tree & Flag (2026)"
 * - /states/{slug}/fun-facts/ → "20 Fun Facts About {State} You Didn't Know (2026)"
 */
const fs = require('fs');
const path = require('path');

const ROOT = path.resolve(__dirname, '..');
const states = JSON.parse(fs.readFileSync(path.join(ROOT, 'data/states.json'), 'utf8'));

// Build slug → {name, usps} map
const slugToState = {};
const uspsToName = {};
for (const s of states) {
  const slug = s.names.en.toLowerCase().replace(/\s+/g, '-');
  slugToState[slug] = { name: s.names.en, usps: s.id, capital: s.capital };
  uspsToName[s.id] = s.names.en;
}

let changed = 0;

function rewriteFile(filePath, mutateFn) {
  let html = fs.readFileSync(filePath, 'utf8');
  const orig = html;
  html = mutateFn(html);
  if (html !== orig) {
    fs.writeFileSync(filePath, html);
    changed++;
    return true;
  }
  return false;
}

function setTitle(html, newTitle) {
  return html.replace(/<title>[^<]*<\/title>/, `<title>${newTitle}</title>`);
}
function setMeta(html, name, value) {
  const re = new RegExp(`(<meta\\s+name="${name}"\\s+content=")[^"]*(")`, 'i');
  if (re.test(html)) return html.replace(re, `$1${value}$2`);
  return html;
}
function setProp(html, prop, value) {
  const re = new RegExp(`(<meta\\s+property="${prop}"\\s+content=")[^"]*(")`, 'i');
  if (re.test(html)) return html.replace(re, `$1${value}$2`);
  return html;
}
function escapeAttr(s) {
  return String(s).replace(/&/g, '&amp;').replace(/"/g, '&quot;');
}

// ============================================================
// 1. /cities/{slug}/ titles
// ============================================================
const citiesDir = path.join(ROOT, 'cities');
let cityCount = 0;
for (const slug of fs.readdirSync(citiesDir)) {
  const file = path.join(citiesDir, slug, 'index.html');
  if (!fs.existsSync(file)) continue;
  if (slug === 'index.html') continue;

  const html = fs.readFileSync(file, 'utf8');
  // Extract state slug from first /states/X/ link
  const m = html.match(/\/states\/([a-z-]+)\//);
  if (!m) {
    console.warn(`[cities] no state link in ${slug}`);
    continue;
  }
  const stateSlug = m[1];
  const st = slugToState[stateSlug];
  if (!st) {
    console.warn(`[cities] unknown state slug ${stateSlug} in ${slug}`);
    continue;
  }
  // Pretty city name from H1 if possible, else slug
  const h1m = html.match(/<h1[^>]*>([^<]+)<\/h1>/);
  let cityName = h1m ? h1m[1].split(',')[0].trim() : slug.split('-').map(w => w[0].toUpperCase() + w.slice(1)).join(' ');

  const newTitle = `What state is ${cityName} in? — ${st.name} (${st.usps}) | Statedoku`;
  const newOG = `What state is ${cityName} in? — ${st.name} (${st.usps})`;
  const newDesc = `${cityName} is a city in ${st.name}, USA (USPS code: ${st.usps}). See its location, population, and state facts on Statedoku.`;

  rewriteFile(file, h => {
    h = setTitle(h, escapeAttr(newTitle));
    h = setMeta(h, 'description', escapeAttr(newDesc));
    h = setProp(h, 'og:title', escapeAttr(newOG));
    h = setProp(h, 'og:description', escapeAttr(newDesc));
    return h;
  });
  cityCount++;
}
console.log(`✅ cities updated: ${cityCount}`);

// ============================================================
// 2. /states/{slug}/symbols/ titles
// ============================================================
const statesDir = path.join(ROOT, 'states');
let symbolsCount = 0;
for (const slug of fs.readdirSync(statesDir)) {
  const file = path.join(statesDir, slug, 'symbols', 'index.html');
  if (!fs.existsSync(file)) continue;
  const st = slugToState[slug];
  if (!st) continue;

  const newTitle = `${st.name} State Symbols: Bird, Flower, Tree & Flag (2026)`;
  const newOG = `${st.name} State Symbols: Bird, Flower, Tree & Flag`;
  const newDesc = `Official state symbols of ${st.name}: state bird, flower, tree, motto, song, and nickname. Complete 2026 reference list.`;

  rewriteFile(file, h => {
    h = setTitle(h, escapeAttr(newTitle + ' | Statedoku'));
    h = setMeta(h, 'description', escapeAttr(newDesc));
    h = setProp(h, 'og:title', escapeAttr(newOG));
    h = setProp(h, 'og:description', escapeAttr(newDesc));
    return h;
  });
  symbolsCount++;
}
console.log(`✅ /symbols/ updated: ${symbolsCount}`);

// ============================================================
// 3. /states/{slug}/fun-facts/ titles
// ============================================================
let funCount = 0;
for (const slug of fs.readdirSync(statesDir)) {
  const file = path.join(statesDir, slug, 'fun-facts', 'index.html');
  if (!fs.existsSync(file)) continue;
  const st = slugToState[slug];
  if (!st) continue;

  const newTitle = `20 Fun Facts About ${st.name} You Didn't Know (2026)`;
  const newOG = `20 Fun Facts About ${st.name}`;
  const newDesc = `Discover 20 surprising fun facts about ${st.name}: history, geography, food, sports, and trivia you didn't know. Updated 2026.`;

  rewriteFile(file, h => {
    h = setTitle(h, escapeAttr(newTitle + ' | Statedoku'));
    h = setMeta(h, 'description', escapeAttr(newDesc));
    h = setProp(h, 'og:title', escapeAttr(newOG));
    h = setProp(h, 'og:description', escapeAttr(newDesc));
    return h;
  });
  funCount++;
}
console.log(`✅ /fun-facts/ updated: ${funCount}`);

console.log(`\nTotal files changed: ${changed}`);
