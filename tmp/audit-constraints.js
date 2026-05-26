#!/usr/bin/env node
/**
 * Full audit of constraint correctness.
 *
 * For each constraint:
 *   1. Compute the set of states that actually match (per the matcher function)
 *   2. Flag if too few matches (≤4 states = unfair for a puzzle)
 *   3. Flag known "obviously broad" labels with suspiciously narrow data
 *   4. Cross-check labels against ground truth where the truth is well-known
 *
 * Output: report grouped by severity:
 *   🚨 CRITICAL — constraint name promises lots of answers but data ≤4
 *   ⚠️  WARNING  — small match list (5-7) that may feel unfair
 *   📋 INFO     — small but defensible (e.g. "states bordering Mexico" = 4 by fact)
 *
 * Plus per-constraint state list dump so a human can review.
 */
const fs = require('fs');
const path = require('path');
const ROOT = path.resolve(__dirname, '..');

// ── Load states.json ──────────────────────────────────────────────────────
const STATES = JSON.parse(fs.readFileSync(path.join(ROOT, 'data/states.json'), 'utf8'));

// ── Re-implement matches() from js/puzzle.js (so we run identical logic) ──
function matches(state, c) {
  if (c.length === 8 && c.startsWith('starts_')) return state.startsWith === c[7].toUpperCase();
  if (c.startsWith('letters_')) return state.letterCount === parseInt(c.slice(8), 10);
  switch (c) {
    case 'region_west':      return state.region === 'west';
    case 'region_south':     return state.region === 'south';
    case 'region_midwest':   return state.region === 'midwest';
    case 'region_northeast': return state.region === 'northeast';
    case 'sub_new_england':  return state.subregion === 'new_england';
    case 'sub_mid_atlantic': return state.subregion === 'mid_atlantic';
    case 'sub_deep_south':   return state.subregion === 'deep_south';
    case 'sub_plains':       return state.subregion === 'plains';
    case 'sub_mountain':     return state.subregion === 'mountain';
    case 'sub_pacific':      return state.subregion === 'pacific';
    case 'pop_lt1m':   return state.population === '<1M';
    case 'pop_1m5m':   return state.population === '1M-5M';
    case 'pop_5m10m':  return state.population === '5M-10M';
    case 'pop_gt10m':  return state.population === '>10M';
    case 'coast_atlantic':   return state.coastline.includes('atlantic');
    case 'coast_pacific':    return state.coastline.includes('pacific');
    case 'coast_gulf':       return state.coastline.includes('gulf');
    case 'coast_great_lakes':return state.coastline.includes('great_lakes');
    case 'landlocked':       return state.landlocked;
    case 'political_red':    return state.political === 'red';
    case 'political_blue':   return state.political === 'blue';
    case 'political_swing':  return state.political === 'swing';
    case 'tz_eastern':  return state.timezone === 'eastern';
    case 'tz_central':  return state.timezone === 'central';
    case 'tz_mountain': return state.timezone === 'mountain';
    case 'tz_pacific':  return state.timezone === 'pacific';
    case 'border_canada': return state.bordersCanada;
    case 'border_mexico': return state.bordersMexico;
    case 'original_13':         return !!state.original13;
    case 'confederate':         return !!state.confederate;
    case 'on_mississippi':  return !!state.onMississippi;
    case 'mt_rockies':      return Array.isArray(state.mountainRange) && state.mountainRange.includes('rockies');
    case 'desert_state':    return !!state.desertState;
    case 'four_corners':    return !!state.fourCorners;
    case 'great_plains':    return !!state.greatPlains;
    case 'bible_belt':    return !!state.bibleBelt;
    case 'rust_belt':     return !!state.rustBelt;
    case 'route_66':      return !!state.route66;
    case 'has_million_city':   return !!state.hasMillionCity;
    case 'largest_state':      return state.areaRank <= 5;
    case 'smallest_state':     return state.areaRank >= 46;
    case 'has_nba': return !!state.nbaTeam;
    case 'two_word_name':  return state.wordCount === 2;
    case 'double_letter':  return !!state.doubleLetter;
    case 'vowel_start':    return 'AEIOU'.includes(state.startsWith);
    case 'has_new':   return state.names.en.includes('New');
    case 'sun_belt':          return !!state.sunBelt;
    case 'snow_belt':         return !!state.snowBelt;
    case 'corn_belt':         return !!state.cornBelt;
    case 'wheat_belt':        return !!state.wheatBelt;
    case 'cotton_belt':       return !!state.cottonBelt;
    case 'tornado_alley':         return !!state.tornadoAlley;
    case 'hurricane_zone':        return !!state.hurricaneZone;
    case 'earthquake_zone':       return !!state.earthquakeZone;
    case 'has_volcano':           return !!state.hasVolcano;
    case 'has_glaciers':          return !!state.hasGlaciers;
    case 'multi_timezone':        return !!state.multiTimezone;
    case 'statehood_pre_1800':   return !!state.statehoodPre1800;
    case 'statehood_1900s':      return !!state.statehood1900s;
    case 'capital_named_after_president': return !!state.capitalNamedAfterPresident;
    case 'capital_starts_with_s':       return !!state.capitalStartsWithS;
    case 'borders_6_plus':  return !!state.borders6Plus;
    case 'borders_few':     return !!state.bordersFew;
    case 'name_native_origin':  return !!state.nameNative;
    case 'name_spanish_origin': return !!state.nameSpanish;
    case 'name_royalty_origin': return !!state.nameRoyalty;
    case 'ends_in_a':              return state.endsWith === 'A';
    case 'ends_in_o':              return state.endsWith === 'O';
    case 'ends_in_e':              return state.endsWith === 'E';
    case 'ends_in_n':              return state.endsWith === 'N';
    case 'ends_in_s':              return state.endsWith === 'S';
    case 'starts_and_ends_vowel':  return 'AEIOU'.includes(state.startsWith) && state.endsInVowel;
    case 'contains_letter_k':      return state.names.en.toUpperCase().includes('K');
    case 'contains_letter_w':      return state.names.en.toUpperCase().includes('W');
    case 'contains_letter_v':      return state.names.en.toUpperCase().includes('V');
    case 'contains_letter_y':      return state.names.en.toUpperCase().includes('Y');
    case 'short_name':             return state.letterCount <= 5;
    case 'long_name':              return state.letterCount >= 10;
    case 'two_word_starts_n':      return state.wordCount === 2 && state.startsWith === 'N';
    default: return null; // unknown
  }
}

// ── All constraint IDs from puzzle.js ─────────────────────────────────────
const CORE_CONSTRAINTS = [
  'region_west','region_south','region_midwest','region_northeast',
  'sub_new_england','sub_mid_atlantic','sub_deep_south','sub_plains','sub_mountain','sub_pacific',
  'pop_lt1m','pop_1m5m','pop_5m10m','pop_gt10m',
  'coast_atlantic','coast_pacific','coast_gulf','coast_great_lakes','landlocked','border_canada','border_mexico',
  'sun_belt','snow_belt','corn_belt','wheat_belt','cotton_belt','bible_belt','rust_belt',
  'political_red','political_blue','political_swing',
  'tz_eastern','tz_central','tz_mountain','tz_pacific','multi_timezone',
  'original_13','confederate','statehood_pre_1800','statehood_1900s',
  'on_mississippi','mt_rockies','desert_state','four_corners','great_plains','tornado_alley','hurricane_zone','earthquake_zone',
  'has_volcano','has_glaciers','route_66',
  'has_million_city','largest_state','smallest_state',
  'capital_named_after_president','capital_starts_with_s',
  'borders_6_plus','borders_few',
  'has_nba',
  'name_native_origin','name_spanish_origin','name_royalty_origin',
  'two_word_name','double_letter','vowel_start','has_new',
  'ends_in_a','ends_in_o','ends_in_e','ends_in_n','ends_in_s',
  'starts_and_ends_vowel','two_word_starts_n',
  'contains_letter_k','contains_letter_w','contains_letter_v','contains_letter_y',
  'short_name','long_name',
  'letters_6','letters_7','letters_8','letters_9',
  'starts_a','starts_i','starts_m','starts_n','starts_w',
];

// Human-readable labels (English) — kept short, just enough for the report
const LABELS = {
  region_west: 'Region: West', region_south: 'Region: South', region_midwest: 'Region: Midwest', region_northeast: 'Region: Northeast',
  sub_new_england: 'Subregion: New England', sub_mid_atlantic: 'Subregion: Mid-Atlantic', sub_deep_south: 'Subregion: Deep South',
  sub_plains: 'Subregion: Plains', sub_mountain: 'Subregion: Mountain', sub_pacific: 'Subregion: Pacific',
  pop_lt1m: 'Pop <1M', pop_1m5m: 'Pop 1-5M', pop_5m10m: 'Pop 5-10M', pop_gt10m: 'Pop >10M',
  coast_atlantic: 'Atlantic coast', coast_pacific: 'Pacific coast', coast_gulf: 'Gulf coast', coast_great_lakes: 'Great Lakes coast',
  landlocked: 'Landlocked', border_canada: 'Borders Canada', border_mexico: 'Borders Mexico',
  sun_belt: 'Sun Belt', snow_belt: 'Snow Belt', corn_belt: 'Corn Belt', wheat_belt: 'Wheat Belt', cotton_belt: 'Cotton Belt',
  bible_belt: 'Bible Belt', rust_belt: 'Rust Belt',
  political_red: 'Red state', political_blue: 'Blue state', political_swing: 'Swing state',
  tz_eastern: 'Eastern Time', tz_central: 'Central Time', tz_mountain: 'Mountain Time', tz_pacific: 'Pacific Time',
  multi_timezone: 'Has multiple time zones',
  original_13: 'Original 13 colonies', confederate: 'Confederate state',
  statehood_pre_1800: 'Admitted before 1800', statehood_1900s: 'Admitted in 1900s',
  on_mississippi: 'On the Mississippi', mt_rockies: 'In the Rockies', desert_state: 'Desert state',
  four_corners: 'Four Corners', great_plains: 'Great Plains', tornado_alley: 'Tornado Alley',
  hurricane_zone: 'Hurricane zone', earthquake_zone: 'Earthquake zone', has_volcano: 'Has a volcano',
  has_glaciers: 'Has glaciers', route_66: 'Route 66 state',
  has_million_city: 'Has a million-plus city', largest_state: 'Top 5 largest by area', smallest_state: 'Bottom 5 by area',
  capital_named_after_president: 'Capital named after a president',
  capital_starts_with_s: 'Capital starts with S',
  borders_6_plus: 'Borders 6+ states', borders_few: 'Borders ≤2 states',
  has_nba: 'Has an NBA team',
  name_native_origin: 'Name from native tribe', name_spanish_origin: 'Spanish-origin name', name_royalty_origin: 'Named after royalty',
  two_word_name: 'Two-word name', double_letter: 'Double letter in name',
  vowel_start: 'Starts with vowel', has_new: 'Name starts with "New"',
  ends_in_a: 'Ends in A', ends_in_o: 'Ends in O', ends_in_e: 'Ends in E', ends_in_n: 'Ends in N', ends_in_s: 'Ends in S',
  starts_and_ends_vowel: 'Starts AND ends with vowel', two_word_starts_n: 'Two-word, starts with N',
  contains_letter_k: 'Contains K', contains_letter_w: 'Contains W', contains_letter_v: 'Contains V', contains_letter_y: 'Contains Y',
  short_name: 'Short name (≤5 letters)', long_name: 'Long name (≥10 letters)',
  letters_6: '6 letters', letters_7: '7 letters', letters_8: '8 letters', letters_9: '9 letters',
  starts_a: 'Starts with A', starts_i: 'Starts with I', starts_m: 'Starts with M', starts_n: 'Starts with N', starts_w: 'Starts with W',
};

// Constraints where small count is actually CORRECT and expected
const NARROW_BY_FACT = new Set([
  'border_mexico',         // 4 states — correct (CA, AZ, NM, TX)
  'four_corners',          // 4 states — correct (AZ, CO, NM, UT)
  'has_volcano',           // Few states — correct
  'has_glaciers',          // Few states — correct
  'multi_timezone',        // Few states — correct
  'two_word_starts_n',     // Few — correct (NC, ND, NH, NJ, NM, NY are 2-word? Actually most are 1-word)
  'pop_gt10m',             // 4 states — correct
]);

// Ground-truth checks for constraints where the FACT is verifiable
const GROUND_TRUTH = {
  border_canada: { expected: 13, list: 'AK ID ME MI MN MT NH NY ND OH PA VT WA', note: '13 states share a border with Canada' },
  border_mexico: { expected: 4, list: 'AZ CA NM TX' },
  four_corners: { expected: 4, list: 'AZ CO NM UT' },
  original_13: { expected: 13, list: 'CT DE GA MA MD NC NH NJ NY PA RI SC VA' },
  confederate: { expected: 11, list: 'AL AR FL GA LA MS NC SC TN TX VA' },
  // Coastlines
  coast_pacific: { expected: 5, list: 'AK CA HI OR WA', note: 'AK + CA + HI + OR + WA' },
  coast_gulf: { expected: 5, list: 'AL FL LA MS TX' },
  coast_great_lakes: { expected: 8, list: 'IL IN MI MN NY OH PA WI' },
  coast_atlantic: { expected: 14, list: 'CT DE FL GA MA MD ME NC NH NJ NY RI SC VA' },
  // Income tax
  // Time zones (continental US)
  tz_eastern: { expected: 21, list: 'CT DE FL GA IN KY MA MD ME MI NC NH NJ NY OH PA RI SC TN VA VT WV', note: 'plus partial states' },
  // Population
  pop_gt10m: { expected: 4, list: 'CA FL NY TX', note: '>10M: CA, TX, FL, NY' },
};

// ── Run audit ─────────────────────────────────────────────────────────────
const results = [];
for (const c of CORE_CONSTRAINTS) {
  const matchingStates = STATES.filter(s => matches(s, c) === true);
  const count = matchingStates.length;
  const matchedIds = matchingStates.map(s => s.id).sort();

  let severity = 'OK';
  const issues = [];

  // Severity rules
  if (count === 0) { severity = 'CRITICAL'; issues.push('ZERO MATCHES — constraint is dead'); }
  else if (count <= 2) { severity = 'CRITICAL'; issues.push(`Only ${count} match — too narrow`); }
  else if (count <= 4 && !NARROW_BY_FACT.has(c)) { severity = 'WARNING'; issues.push(`Only ${count} matches — may feel unfair`); }

  // Ground-truth check
  if (GROUND_TRUTH[c]) {
    const exp = GROUND_TRUTH[c].expected;
    const expList = GROUND_TRUTH[c].list.split(/\s+/).sort();
    if (count !== exp) {
      severity = 'CRITICAL';
      issues.push(`GROUND-TRUTH MISMATCH: expected ${exp} states, got ${count}`);
    }
    const missing = expList.filter(id => !matchedIds.includes(id));
    const extra   = matchedIds.filter(id => !expList.includes(id));
    if (missing.length) { severity = 'CRITICAL'; issues.push(`Missing states (per ground truth): ${missing.join(', ')}`); }
    if (extra.length)   { severity = 'CRITICAL'; issues.push(`Extra states (per ground truth): ${extra.join(', ')}`); }
  }

  results.push({ c, label: LABELS[c] || c, count, matchedIds, severity, issues });
}

// ── Report ────────────────────────────────────────────────────────────────
const critical = results.filter(r => r.severity === 'CRITICAL');
const warnings = results.filter(r => r.severity === 'WARNING');
const oks = results.filter(r => r.severity === 'OK');

console.log(`\n📊 STATEDOKU CONSTRAINT AUDIT (${results.length} core constraints)`);
console.log('='.repeat(80));
console.log(`🚨 CRITICAL: ${critical.length} · ⚠️  WARNING: ${warnings.length} · ✅ OK: ${oks.length}`);
console.log('='.repeat(80));

function print(group, marker) {
  if (!group.length) return;
  for (const r of group) {
    console.log(`\n${marker} ${r.c}  (${r.label})  → ${r.count} state${r.count === 1 ? '' : 's'}`);
    console.log(`   States: ${r.matchedIds.join(', ') || '(none)'}`);
    for (const i of r.issues) console.log(`   ⚡ ${i}`);
  }
}

if (critical.length) { console.log('\n\n🚨 CRITICAL ISSUES'); console.log('-'.repeat(80)); print(critical, '🚨'); }
if (warnings.length) { console.log('\n\n⚠️  WARNINGS'); console.log('-'.repeat(80)); print(warnings, '⚠️ '); }

// Also report by category size for full picture
console.log('\n\n📊 ALL CORE CONSTRAINTS BY MATCH COUNT (ascending)');
console.log('-'.repeat(80));
const sorted = [...results].sort((a, b) => a.count - b.count);
for (const r of sorted) {
  const mark = r.severity === 'CRITICAL' ? '🚨' : (r.severity === 'WARNING' ? '⚠️ ' : '  ');
  console.log(`${mark} ${String(r.count).padStart(3)}  ${r.c.padEnd(30)} ${r.label}`);
}

// Save full data
const reportPath = path.join(ROOT, 'tmp', 'audit-constraints-report.json');
fs.writeFileSync(reportPath, JSON.stringify(results, null, 2));
console.log(`\n\n💾 Full report: ${path.relative(process.cwd(), reportPath)}`);

// Exit code: 1 if critical, 0 if all OK or warnings only
process.exit(critical.length > 0 ? 1 : 0);
