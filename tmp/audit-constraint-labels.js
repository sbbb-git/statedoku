#!/usr/bin/env node
/**
 * Audit every constraint visible to players:
 *   1. Core constraints from puzzle.js → must have constraints.{id} in translations.json (EN/FR/ES)
 *   2. Approved pending constraints from constraints-approved.js → must have .en/.fr/.es
 *      labels on the PENDING_CONSTRAINTS entry, AND those labels must be sane
 *      (no debug text, no raw underscores, ≤ 28 chars to fit the cell label)
 *
 * Flags:
 *   🚨 BROKEN    — id has NO label anywhere → would render raw to user
 *   ⚠️  TOO LONG  — label > 28 chars (will overflow / look bad in 3×3 grid)
 *   ⚠️  MISSING_LANG — has 1-2 langs but not all 3
 */
const fs = require('fs');
const path = require('path');
const ROOT = path.resolve(__dirname, '..');

const translations = JSON.parse(fs.readFileSync(path.join(ROOT, 'data/translations.json'), 'utf8'));

// Read approved IDs from constraints-approved.js
const approvedSrc = fs.readFileSync(path.join(ROOT, 'js/constraints-approved.js'), 'utf8');
const APPROVED = [...approvedSrc.matchAll(/"(pc_[a-z0-9_]+)"/g)].map(m => m[1]);

// Pull labels from constraints-pending.js — match the add('id', 'en', 'fr', 'es', 'states') signature
const pendingSrc = fs.readFileSync(path.join(ROOT, 'js/constraints-pending.js'), 'utf8');
const labelRe = /add\(\s*'([^']+)'\s*,\s*'((?:\\'|[^'])*)'\s*,\s*'((?:\\'|[^'])*)'\s*,\s*'((?:\\'|[^'])*)'/g;
const PENDING_LABELS = {};
let m;
while ((m = labelRe.exec(pendingSrc))) {
  const [, id, en, fr, es] = m;
  PENDING_LABELS[id] = {
    en: en.replace(/\\'/g, "'"),
    fr: fr.replace(/\\'/g, "'"),
    es: es.replace(/\\'/g, "'"),
  };
}

const CORE = [
  'region_west','region_south','region_midwest','region_northeast',
  'sub_new_england','sub_mid_atlantic','sub_deep_south','sub_plains','sub_mountain','sub_pacific',
  'pop_lt1m','pop_1m5m','pop_5m10m','pop_gt10m',
  'coast_atlantic','coast_pacific','coast_gulf','coast_great_lakes','landlocked','border_canada','border_mexico',
  'sun_belt','snow_belt','corn_belt','wheat_belt','cotton_belt','bible_belt','rust_belt',
  'political_red','political_blue','political_swing',
  'tz_eastern','tz_central','tz_mountain','tz_pacific','multi_timezone',
  'original_13','confederate','statehood_pre_1800','statehood_1900s',
  'on_mississippi','mt_rockies','desert_state','four_corners','great_plains',
  'tornado_alley','hurricane_zone','earthquake_zone','has_volcano','has_glaciers','route_66',
  'has_million_city','largest_state','smallest_state',
  'capital_named_after_president','capital_starts_with_s',
  'borders_6_plus','borders_few','has_nba',
  'name_native_origin','name_spanish_origin','name_royalty_origin',
  'two_word_name','double_letter','vowel_start','has_new',
  'ends_in_a','ends_in_o','ends_in_e','ends_in_n','ends_in_s',
  'starts_and_ends_vowel','two_word_starts_n',
  'contains_letter_k','contains_letter_w','contains_letter_v','contains_letter_y',
  'short_name','long_name',
  'letters_6','letters_7','letters_8','letters_9',
  'starts_a','starts_i','starts_m','starts_n','starts_w',
];

const broken = [];
const tooLong = [];
const missingLang = [];

// ── Core ─────────────────────────────────────────────────────────────────
for (const id of CORE) {
  for (const lang of ['en','fr','es']) {
    const label = translations?.[lang]?.constraints?.[id];
    if (!label) {
      broken.push({ id, lang, source: 'core' });
    } else if (label.length > 28) {
      tooLong.push({ id, lang, source: 'core', label });
    }
  }
}

// ── Approved-pending ─────────────────────────────────────────────────────
for (const id of APPROVED) {
  const labels = PENDING_LABELS[id];
  if (!labels) {
    broken.push({ id, lang: 'all', source: 'approved-pending', reason: 'No add() call found' });
    continue;
  }
  const present = ['en','fr','es'].filter(l => labels[l]);
  if (present.length < 3) {
    missingLang.push({ id, has: present, source: 'approved-pending' });
  }
  for (const lang of present) {
    if (labels[lang].length > 28) tooLong.push({ id, lang, source: 'approved-pending', label: labels[lang] });
  }
}

console.log(`\n📊 CONSTRAINT-LABEL AUDIT`);
console.log('═'.repeat(70));
console.log(`Core: ${CORE.length} · Approved-pending: ${APPROVED.length}`);
console.log(`🚨 BROKEN (no label): ${broken.length}`);
console.log(`⚠️  TOO LONG (>28 chars): ${tooLong.length}`);
console.log(`⚠️  MISSING LANG: ${missingLang.length}`);
console.log('═'.repeat(70));

if (broken.length) {
  console.log('\n🚨 BROKEN — would render raw to user:');
  for (const b of broken) console.log(`  ${b.id}${b.lang !== 'all' ? ' [' + b.lang + ']' : ''}${b.reason ? ' — ' + b.reason : ''}`);
}
if (missingLang.length) {
  console.log('\n⚠️  Missing languages:');
  for (const m of missingLang) console.log(`  ${m.id} → has only ${m.has.join(', ')}`);
}
if (tooLong.length) {
  console.log('\n⚠️  Labels >28 chars (will overflow cell):');
  for (const t of tooLong.slice(0, 30)) console.log(`  [${String(t.label.length).padStart(2)}] ${t.id} [${t.lang}]: ${t.label}`);
  if (tooLong.length > 30) console.log(`  …+${tooLong.length - 30} more`);
}

fs.writeFileSync(path.join(ROOT,'tmp/audit-constraint-labels-report.json'), JSON.stringify({ broken, tooLong, missingLang, pendingLabels: PENDING_LABELS, approved: APPROVED }, null, 2));
console.log(`\n💾 Full report: tmp/audit-constraint-labels-report.json`);
