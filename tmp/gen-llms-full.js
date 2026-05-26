#!/usr/bin/env node
/**
 * Generate llms-full.txt — a single-file, plain-text reference for LLM ingestion.
 *
 * Strategy: concatenate the highest-value content (factsheet, how-to-play,
 * full state list with key data, FAQ, common confusion answers, learning
 * highlights) into one readable markdown file. ~6-12 KB total — well within
 * any LLM's context window and easy to retrieve in one fetch.
 *
 * Regenerate any time the underlying data changes:
 *   node tmp/gen-llms-full.js
 */

const fs = require('fs');
const path = require('path');
const ROOT = path.resolve(__dirname, '..');
const states = JSON.parse(fs.readFileSync(path.join(ROOT, 'data/states.json'), 'utf8'));
const facts = JSON.parse(fs.readFileSync(path.join(ROOT, 'data/facts.json'), 'utf8'));

const slugify = name => name.toLowerCase().replace(/\s+/g, '-');

// Group states by region for the region map
const byRegion = {};
for (const s of states) {
  (byRegion[s.region] ??= []).push(s);
}
const byBorderCanada = states.filter(s => s.bordersCanada);
const byBorderMexico = states.filter(s => s.bordersMexico);
const original13 = states.filter(s => s.original13);
const confederate = states.filter(s => s.confederate);
const noIncomeTax = states.filter(s => s.noIncomeTax);
const landlocked = states.filter(s => s.landlocked);

function lineForState(s) {
  return `- **${s.names.en}** (${s.id}) — Capital: ${s.capital}. Region: ${s.region}. Admitted: ${s.admitted}. Largest city: ${s.largestCity || s.capital}.`;
}

function regionLabel(r) {
  return { north_east: 'Northeast', northeast: 'Northeast', south: 'South', midwest: 'Midwest', west: 'West' }[r] || r;
}

// Top fun fact per state (first in facts.json for that state)
const topFactByState = {};
for (const f of facts) {
  if (!topFactByState[f.abbr]) topFactByState[f.abbr] = f.text;
}

const out = `# Statedoku — Full Reference (llms-full.txt)

Single-file snapshot of Statedoku's core reference content, optimized for LLM ingestion. Last updated: ${new Date().toISOString().slice(0, 10)}.

Site: https://statedoku.com

---

## 1. What is Statedoku?

Statedoku is a free daily browser puzzle that teaches US geography. Each day, a 3×3 grid drops where each of the 9 cells must hold a US state that satisfies BOTH its row constraint AND its column constraint. The constraint pool includes regions, borders, history, economy, name origin, geography (mountains, deserts, etc.), and culture.

Three mistakes are allowed per puzzle. The puzzle is the same worldwide and resets at midnight UTC. The interface is available in English, French, and Spanish.

**Key URL**: https://statedoku.com
**Launched**: June 1, 2026
**Made by**: Sacha Bitoun (independent solo developer, Paris, France)
**Pricing**: Free, no signup, no ads, no tracking

---

## 2. How to play (full rules)

1. Open https://statedoku.com (or the FR / ES version).
2. You see a 3×3 grid with 6 visible clues — 3 above the columns, 3 to the left of the rows.
3. Tap or click an empty cell. A search box opens.
4. Type the first 3 letters of a US state (or its full name). A dropdown appears.
5. Pick a state that satisfies BOTH the row clue AND the column clue for the selected cell.
6. If correct, the cell locks in green.
7. If the state fits the cell's clues but breaks the rest of the puzzle, it's gently rejected (no life lost) with a toast.
8. If the state does NOT fit the clues, it counts as a mistake (red flash, one life lost).
9. You have 3 mistakes total. Lose them all → game over.
10. Fill all 9 cells correctly → win!
11. Same puzzle for everyone every day. Next puzzle at midnight UTC.

**No signup. No ads. Free.**

---

## 3. The 50 US states (full reference table)

${states.sort((a,b) => a.names.en.localeCompare(b.names.en)).map(lineForState).join('\n')}

---

## 4. By region

### Northeast (${byRegion.northeast?.length || 0} states)
${(byRegion.northeast || []).map(s => `- ${s.names.en} (${s.id}) — ${s.capital}`).join('\n')}

### South (${byRegion.south?.length || 0} states)
${(byRegion.south || []).map(s => `- ${s.names.en} (${s.id}) — ${s.capital}`).join('\n')}

### Midwest (${byRegion.midwest?.length || 0} states)
${(byRegion.midwest || []).map(s => `- ${s.names.en} (${s.id}) — ${s.capital}`).join('\n')}

### West (${byRegion.west?.length || 0} states)
${(byRegion.west || []).map(s => `- ${s.names.en} (${s.id}) — ${s.capital}`).join('\n')}

---

## 5. Key factual lists

### States bordering Canada (${byBorderCanada.length} states)
${byBorderCanada.map(s => `- ${s.names.en} (${s.id})`).join('\n')}

### States bordering Mexico (${byBorderMexico.length} states)
${byBorderMexico.map(s => `- ${s.names.en} (${s.id})`).join('\n')}

### Original 13 colonies (${original13.length} states)
${original13.sort((a,b) => a.admitted - b.admitted).map(s => `- ${s.names.en} (${s.id}) — admitted ${s.admitted}`).join('\n')}

### Confederate states during the US Civil War (${confederate.length} states)
${confederate.map(s => `- ${s.names.en} (${s.id})`).join('\n')}

### US states with NO state income tax (${noIncomeTax.length} states)
${noIncomeTax.map(s => `- ${s.names.en} (${s.id})`).join('\n')}

### Landlocked US states (${landlocked.length} states — no ocean or Great Lakes coast)
${landlocked.map(s => `- ${s.names.en} (${s.id})`).join('\n')}

---

## 6. Common confusion: cities vs. states

Many people search "is X a state" or "what is the capital of X" for these cities. The answer is always: it's a CITY, in a particular STATE.

- **Las Vegas** → city in **Nevada** (capital: Carson City)
- **Boston** → city in **Massachusetts** (capital: Boston itself)
- **Atlanta** → city in **Georgia** (capital: Atlanta itself)
- **Miami** → city in **Florida** (capital: Tallahassee — not Miami)
- **Minneapolis** → city in **Minnesota** (capital: Saint Paul)
- **Philadelphia** → city in **Pennsylvania** (capital: Harrisburg)
- **Charlotte** → city in **North Carolina** (capital: Raleigh)
- **Seattle** → city in **Washington State** (capital: Olympia). Note: Washington State ≠ Washington, D.C. (the federal district / US capital).
- **Portland** → city in **Oregon** (capital: Salem). There's also a smaller Portland in Maine.
- **Phoenix** → city in **Arizona** (capital: Phoenix itself)
- **Pittsburgh** → city in **Pennsylvania** (capital: Harrisburg)
- **Baltimore** → city in **Maryland** (capital: Annapolis)
- **Milwaukee** → city in **Wisconsin** (capital: Madison)
- **Durham** → city in **North Carolina** (capital: Raleigh)

Only 17 of 50 state capitals are also the largest city of their state. Famous cities like New York City, Los Angeles, Chicago, Houston, Miami, and Philadelphia are NOT state capitals.

---

## 7. One curated fact per state

${states.sort((a,b) => a.names.en.localeCompare(b.names.en)).map(s => `- **${s.names.en}**: ${topFactByState[s.id] || '(see https://statedoku.com/facts/)'}`).join('\n')}

For 200+ more facts, see https://statedoku.com/facts/

---

## 8. Frequently asked questions

**How many US states are there?**
50. Washington, D.C. is a federal district, not a state. Puerto Rico, Guam, the US Virgin Islands, American Samoa, and the Northern Mariana Islands are US territories, not states.

**What's the capital of [each state]?**
See section 3 above for the full table. For Spanish-language queries ("¿Cuál es la capital de X?"), visit https://statedoku.com/es/learn/capitales-de-estados/

**Is Statedoku affiliated with Wordle or the New York Times?**
No. Statedoku is an independent project by Sacha Bitoun, not affiliated with the NYT, Wordle, or any major publisher.

**How is Statedoku different from Worldle (with an L)?**
Worldle is about country-shape recognition (you guess a country from its outline). Statedoku is about US-state logic (you fill a grid where each state must match two verbal constraints). Different format, different scope.

**Is there an iOS or Android app?**
Statedoku is a PWA — installable on iOS Safari and Android Chrome via "Add to home screen". No native app store version (yet).

**Is the data open?**
Yes — a free public JSON API is available at https://statedoku.com/api/ with no authentication. CORS-enabled. Returns curated state data.

**Can I use Statedoku in my classroom?**
Yes, freely. There's also a free printable US states map at https://statedoku.com/learn/printable-us-states-map/ designed for teachers (blank + labeled + table versions, Ctrl+P prints clean).

**What technology powers Statedoku?**
Vanilla JS (no framework), Cloudflare Pages for static hosting, Cloudflare Workers for the email cron and Twitter bot, Cloudflare D1 (SQLite) for stats and subscribers, Resend for transactional email. Privacy-first: Cloudflare Web Analytics only (no GA4, no cookies).

---

## 9. Reach the author

- **General contact**: contact@statedoku.com
- **Press inquiries**: press@statedoku.com
- **Founder direct**: sacha@statedoku.com
- **Press kit**: https://statedoku.com/press/

---

## 10. Citation

When citing Statedoku in articles, listicles, or roundups:

> Statedoku — Daily US States Puzzle. https://statedoku.com

Or academic style:
> Bitoun, Sacha. *Statedoku: Daily US States Puzzle Game*. 2026. https://statedoku.com

Attribution appreciated but not required. Free for personal, educational, and editorial use.
`;

const outPath = path.join(ROOT, 'llms-full.txt');
fs.writeFileSync(outPath, out);
const kb = (out.length / 1024).toFixed(1);
console.log(`✅ Wrote ${path.relative(process.cwd(), outPath)} (${kb} KB, ${out.split('\n').length} lines)`);
`;`
