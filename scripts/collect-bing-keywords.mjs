#!/usr/bin/env node
/**
 * Weekly keyword demand from Bing, independent of this site.
 *
 * Without this the whole arrangement runs in a closed loop: Search Console and
 * Bing performance only ever report queries the site already appears on, so the
 * analysis can improve what exists and can never find demand nobody serves. A
 * site that appears on nothing learns nothing from its own performance data.
 *
 * GetKeyword and GetRelatedKeywords take no siteUrl. They return the volume of
 * any term, for any site or none, which makes this free keyword research using
 * the key already in place.
 *
 * Seeds are derived from the project's own taxonomy crossed with its intents,
 * never from a hand-written list that would quietly go stale. If the taxonomy
 * read returns nothing, this fails: an empty seed list produces a hollow
 * reading that looks exactly like a real one.
 *
 * Env:
 *   BING_API_KEY
 *   BING_KW_LIMIT   cap the seeds, for a smoke run
 *   BING_OUT_DIR    where to write (default seo-snapshots/)
 */
import fs from 'node:fs/promises';
import path from 'node:path';
import { fileURLToPath } from 'node:url';
import { fetchRetry, pool } from './_gsc-auth.mjs';

const ROOT = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '..');
const BASE = 'https://ssl.bing.com/webmaster/api.svc/json';
// Bing throttles these two methods hard. It answers HTTP 400 with ThrottleUser
// in the body rather than a 429, so the generic retry cannot see it, and at
// four at a time it refused 27 of 73 seeds on the first real run. Two at a
// time, with an explicit wait on that message.
const CONCURRENCY = 2;
const THROTTLE_TRIES = 4;
const THROTTLE_WAIT_MS = 4000;

async function call(method, apikey, params = {}) {
  const qs = new URLSearchParams({ apikey, ...params });
  let res, text;
  for (let attempt = 1; ; attempt++) {
    res = await fetchRetry(`${BASE}/${method}?${qs}`);
    text = await res.text();
    if (!text.includes('ThrottleUser') || attempt === THROTTLE_TRIES) break;
    await new Promise((r) => setTimeout(r, THROTTLE_WAIT_MS * attempt));
  }
  if (text.includes('ThrottleUser')) {
    throw new Error(`${method} still throttled after ${THROTTLE_TRIES} tries. ` +
      'Lower CONCURRENCY or cut the seed list with BING_KW_LIMIT.');
  }
  // Bing answers 400, not 401, on a bad key, with InvalidApiKey in the body.
  // Trusting the status alone surfaces the commonest failure as a parse error.
  if (text.includes('InvalidApiKey')) {
    throw new Error('Bing rejected the API key (InvalidApiKey). Regenerate it under ' +
      'Bing Webmaster Tools > Settings > API Access > API Key.');
  }
  if (!res.ok) throw new Error(`${method} -> ${res.status}: ${text.slice(0, 300)}`);
  let parsed;
  try {
    parsed = JSON.parse(text);
  } catch {
    throw new Error(`${method} returned something that is not JSON: ${text.slice(0, 200)}`);
  }
  return 'd' in parsed ? parsed.d : parsed;
}

/**
 * Seeds from the taxonomy this project already maintains: the 50 states in
 * data/states.json, and the topic slugs of the indexable pages under learn/.
 * Crossed with the intents the site actually serves.
 *
 * Only live subjects are seeded. A learn/ page carrying noindex has been
 * retired on purpose (World Cup 2026, "capital of <city>", crossword helpers,
 * one-template-per-state families: see CLAUDE.md), and measuring demand for
 * it would only invite bringing it back. RETIRED repeats the families by name
 * so a retired page that loses its noindex by accident still stays out.
 */
const RETIRED = /world-cup|mondial|soccer|azteca|metlife-stadium|crossword|^capital-of-/;

// Cost: every seed is two calls (GetKeyword and GetRelatedKeywords), made
// CONCURRENCY at a time. MAX_SEEDS keeps a weekly run near 400 calls. Seeds are
// added in priority order (core cluster, the 50 states, then learn topics), so
// if the cap ever bites it trims learn topics, never a state.
const MAX_SEEDS = 200;

async function isIndexable(file) {
  let html;
  try { html = await fs.readFile(file, 'utf8'); } catch { return false; }
  const head = html.split('</head>')[0];
  return !/<meta\s+name="robots"\s+content="[^"]*noindex/i.test(head);
}

async function seeds() {
  const states = JSON.parse(await fs.readFile(path.join(ROOT, 'data', 'states.json'), 'utf8'));
  if (!Array.isArray(states) || states.length !== 50) {
    throw new Error(`data/states.json parsed to ${Array.isArray(states) ? states.length : 0} states, ` +
      'not 50. Seeding from a broken taxonomy would produce a hollow reading, so this stops instead.');
  }
  const learnDirs = (await fs.readdir(path.join(ROOT, 'learn'), { withFileTypes: true }))
    .filter((d) => d.isDirectory()).map((d) => d.name).sort();
  const liveTopics = [];
  for (const d of learnDirs) {
    if (RETIRED.test(d)) continue;
    if (await isIndexable(path.join(ROOT, 'learn', d, 'index.html'))) liveTopics.push(d);
  }
  if (!liveTopics.length) {
    throw new Error('learn/ holds no indexable topic directory. Same reason: an empty seed list is ' +
      'worse than no reading at all.');
  }

  const out = new Set();

  // The cluster this site already wins on, and the live subjects around it:
  // states and capitals, abbreviations, time zones, regions, state facts,
  // geography quizzes, territories, how many states.
  for (const t of ['list of states and capitals', 'us state capitals', 'list of 50 states',
    'states and capitals', '50 states and capitals quiz', 'memorize state capitals',
    'us states quiz', 'us geography quiz', 'us states map',
    'state abbreviations list', 'us state abbreviations', 'state nicknames list',
    'us time zones map', 'time zones by state', 'states with two time zones',
    'regions of the united states', 'us census regions', 'state facts',
    'fun facts about the 50 states', 'us territories', 'how many states are in the us',
    'how many states in america']) out.add(t);

  // All 50 states crossed with the intents the site serves.
  for (const s of states) {
    const n = (s.names && s.names.en) || s.id;
    out.add(`capital of ${n}`.toLowerCase());
    out.add(`${n} facts`.toLowerCase());
  }

  // Indexable learn topics, humanised. The taxonomy speaks for itself.
  for (const d of liveTopics) out.add(d.replace(/-/g, ' '));

  const list = [...out].filter((s) => s.length > 2).slice(0, MAX_SEEDS);
  console.log(`[kw] taxonomy: ${states.length} states, ${liveTopics.length} of ${learnDirs.length} ` +
    `learn topics indexable and live, ${out.size} seeds before the cap of ${MAX_SEEDS}`);
  const limit = Number(process.env.BING_KW_LIMIT || 0);
  return limit > 0 ? list.slice(0, limit) : list;
}

async function main() {
  const apikey = process.env.BING_API_KEY;
  if (!apikey || !apikey.trim()) {
    console.warn('[kw] skipped: BING_API_KEY is not set');
    return;
  }

  const list = await seeds();
  console.log(`[kw] ${list.length} seeds derived from the project taxonomy`);

  const today = new Date();
  const start = new Date(today.getTime() - 90 * 86400000);
  const fmt = (d) => d.toISOString().slice(0, 10);

  let ok = 0, failed = 0;
  const rows = await pool(list, CONCURRENCY, async (q) => {
    const params = { q, country: 'us', language: 'en-US', startDate: fmt(start), endDate: fmt(today) };
    try {
      const [kw, rel] = await Promise.all([
        call('GetKeyword', apikey, params),
        call('GetRelatedKeywords', apikey, params),
      ]);
      ok++;
      return { seed: q, keyword: kw ?? null, related: rel ?? null };
    } catch (e) {
      failed++;
      return { seed: q, error: e.message };
    }
  });

  // Always say how many were checked. A loop reporting success over zero items
  // reads exactly like one that passed.
  console.log(`[kw] ${ok} seeds answered, ${failed} failed`);
  if (!ok) {
    throw new Error('No seed returned anything. Either the method names or their parameters are ' +
      'wrong, or the key lost its access. Writing an empty reading would hide that.');
  }
  const withVolume = rows.filter((r) => r.keyword && !r.error).length;
  console.log(`[kw] ${withVolume} seeds carry a volume figure`);

  const snapshot = {
    source: 'bing-keyword-demand',
    collected_at: new Date().toISOString(),
    window: { startDate: fmt(start), endDate: fmt(today) },
    seeds_count: list.length,
    answered: ok,
    failed,
    rows,
  };

  const outDir = process.env.BING_OUT_DIR || 'seo-snapshots';
  await fs.mkdir(outDir, { recursive: true });
  const file = path.join(outDir, `bing-keywords-${fmt(today)}.json`);
  await fs.writeFile(file, JSON.stringify(snapshot, null, 2) + '\n', 'utf8');
  console.log(`[kw] wrote ${file}`);
}

main().catch((e) => {
  console.error(`[kw] ${e.message}`);
  process.exit(1);
});
