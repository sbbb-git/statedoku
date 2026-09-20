#!/usr/bin/env node
/**
 * Weekly Bing Webmaster Tools snapshot.
 *
 * Same split as the Google collector: this runs in CI with the key as a GitHub
 * secret, and writes raw JSON into the repo for a later session to read.
 *
 * Bing is far simpler than Google here: one API key on the query string, no
 * OAuth. Note that the key belongs to the user, not to the site, so the same
 * key opens every verified site on the account. Convenient, and that much worse
 * if it leaks.
 *
 * Env:
 *   BING_API_KEY    from Bing Webmaster Tools > Settings > API Access
 *   BING_SITE       site to collect (default https://statedoku.com/)
 *   BING_ALL_SITES  set to "true" to collect every site the key opens
 *   BING_OUT_DIR    where to write (default seo-snapshots/)
 */
import fs from 'node:fs/promises';
import path from 'node:path';

const BASE = 'https://ssl.bing.com/webmaster/api.svc/json';

// This repo is statedoku. The key opens every site verified on the account,
// which here is nine of them, so collecting "whatever the key can see" writes
// other projects' search data into a public repo. Collect this site only,
// unless someone explicitly asks for the rest.
const DEFAULT_SITE = 'https://statedoku.com/';

// Bing serialises dates in the legacy .NET form, /Date(1316156400000-0700)/,
// which JSON.parse leaves as a string. Converting at collection time is what
// makes one week comparable with the next; leave it and the history is junk.
const DOTNET_DATE = /^\/Date\((-?\d+)([+-]\d{4})?\)\/$/;

function normaliseDates(value) {
  if (typeof value === 'string') {
    const m = DOTNET_DATE.exec(value);
    return m ? new Date(Number(m[1])).toISOString() : value;
  }
  if (Array.isArray(value)) return value.map(normaliseDates);
  if (value && typeof value === 'object') {
    return Object.fromEntries(Object.entries(value).map(([k, v]) => [k, normaliseDates(v)]));
  }
  return value;
}

async function call(method, apikey, params = {}) {
  const qs = new URLSearchParams({ apikey, ...params });
  const res = await fetch(`${BASE}/${method}?${qs}`);
  const text = await res.text();

  // Bing answers 400, not 401, on a bad key, with InvalidApiKey in the body.
  // Trusting the HTTP status alone lets the most common failure through with
  // no usable message, as a raw JSON parse error or a Node stack trace.
  if (text.includes('InvalidApiKey')) {
    throw new Error('Bing rejected the API key (InvalidApiKey). Regenerate it under ' +
      'Bing Webmaster Tools > Settings > API Access > API Key.');
  }
  if (!res.ok) throw new Error(`${method} -> ${res.status}: ${text.slice(0, 400)}`);

  let parsed;
  try {
    parsed = JSON.parse(text);
  } catch {
    throw new Error(`${method} returned something that is not JSON: ${text.slice(0, 200)}`);
  }
  // Every response is wrapped in { "d": ... }.
  return normaliseDates('d' in parsed ? parsed.d : parsed);
}

async function main() {
  const apikey = process.env.BING_API_KEY;
  if (!apikey || !apikey.trim()) {
    // Skip, do not fail: see the note in collect-gsc.mjs.
    console.warn('[bing] skipped: BING_API_KEY is not set');
    return;
  }

  // Ask which sites the key actually opens rather than assuming the url shape.
  const userSites = await call('GetUserSites', apikey);
  const visible = (userSites || []).map((s) => s.Url).filter(Boolean);
  if (!visible.length) {
    throw new Error('This key opens no verified site. Add and verify the site in Bing Webmaster Tools first; ' +
      'importing from Search Console reuses the verification you already have.');
  }

  let sites;
  if (process.env.BING_ALL_SITES === 'true') {
    sites = visible;
  } else {
    const want = process.env.BING_SITE || DEFAULT_SITE;
    // Bing reports urls with a trailing slash; compare forgivingly.
    const norm = (u) => u.replace(/\/+$/, '').toLowerCase();
    const hit = visible.find((u) => norm(u) === norm(want));
    if (!hit) {
      throw new Error(`"${want}" is not among the sites this key opens: ${visible.join(', ')}. ` +
        'Set BING_SITE, or BING_ALL_SITES=true to collect them all.');
    }
    sites = [hit];
  }

  // What Bing gives and Google does not: crawl anomalies and the URL
  // submission quota. What it does not give is the query x page crossing in one
  // call, so the two axes are collected separately.
  const METHODS = [
    'GetRankAndTrafficStats',
    'GetQueryStats',
    'GetPageStats',
    'GetCrawlStats',
    'GetCrawlIssues',
    'GetUrlSubmissionQuota',
  ];

  const snapshot = {
    source: 'bing-webmaster-tools',
    collected_at: new Date().toISOString(),
    // Only a count. Listing every site the key opens would publish the names of
    // unrelated projects in a public repo, which is the same leak by a smaller
    // door.
    sites_visible_count: visible.length,
    sites_collected: sites,
    data: {},
  };

  for (const site of sites) {
    const per = {};
    for (const m of METHODS) {
      try {
        per[m] = await call(m, apikey, { siteUrl: site });
      } catch (e) {
        // One unavailable method must not cost the whole snapshot.
        per[m] = { error: e.message };
        console.warn(`[bing] ${site} ${m}: ${e.message}`);
      }
    }
    snapshot.data[site] = per;
    const n = Object.entries(per)
      .map(([k, v]) => `${k}=${Array.isArray(v) ? v.length : v && v.error ? 'err' : 'ok'}`)
      .join(' ');
    console.log(`[bing] ${site}: ${n}`);
  }

  const outDir = process.env.BING_OUT_DIR || 'seo-snapshots';
  await fs.mkdir(outDir, { recursive: true });
  const day = new Date().toISOString().slice(0, 10);
  const file = path.join(outDir, `bing-${day}.json`);
  await fs.writeFile(file, JSON.stringify(snapshot, null, 2) + '\n', 'utf8');
  console.log(`[bing] wrote ${file}`);
}

main().catch((e) => {
  console.error('[bing] ' + e.message);
  process.exit(1);
});
