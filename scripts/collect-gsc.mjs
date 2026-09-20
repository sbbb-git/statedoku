#!/usr/bin/env node
/**
 * Weekly Google Search Console performance snapshot.
 *
 * Collection is separate from analysis on purpose: this runs in CI, where the
 * service-account key lives as a GitHub secret and nothing else can read it,
 * and writes raw JSON into the repo. An assistant session later reads the
 * committed file. The key never reaches a transcript, a log or an error body.
 *
 * No npm dependency. The RS256 signature is ten lines of node:crypto, and
 * pulling googleapis would slow every npm ci for a script that runs once a week.
 *
 * Env:
 *   one of the names in KEY_VARS (see _gsc-auth.mjs)
 *   GSC_OUT_DIR    where to write (default seo-snapshots/)
 *   GSC_SITE       property id to collect; default is the one matching the host
 *                  that functions/sitemap.xml.js declares
 *   GSC_ALL_SITES  set to "true" to collect every visible property
 */
import fs from 'node:fs/promises';
import path from 'node:path';
import { readKey, accessToken, fetchRetry } from './_gsc-auth.mjs';
import { siteHost, pickProperty } from './_site.mjs';

const API = 'https://searchconsole.googleapis.com/webmasters/v3';
const SCOPE = 'https://www.googleapis.com/auth/webmasters.readonly';

// Search Console data lags two to three days. Asking up to today returns empty
// days that read as a traffic collapse.
const LAG_DAYS = 3;
const WINDOW_DAYS = 28;

async function api(token, endpoint, body) {
  const res = await fetchRetry(API + endpoint, {
    method: body ? 'POST' : 'GET',
    headers: { authorization: `Bearer ${token}`, 'content-type': 'application/json' },
    body: body ? JSON.stringify(body) : undefined,
  });
  const text = await res.text();
  if (!res.ok) throw new Error(`${endpoint} -> ${res.status}: ${text}`);
  return JSON.parse(text);
}

const isoDaysAgo = (n) => new Date(Date.now() - n * 86400000).toISOString().slice(0, 10);

async function main() {
  const { skip, key, found } = readKey();
  if (skip) {
    // A missing secret is a skip, not a failure. A red cross every week stops
    // being read, and the alert is worthless the day it matters.
    console.warn(`[gsc] skipped: ${skip}`);
    return;
  }
  console.log(`[gsc] using ${found}`);

  const token = await accessToken(key, SCOPE);
  const host = await siteHost();

  // Never build the property id by hand. A domain property is sc-domain:x.com,
  // a URL-prefix property is https://x.com/, and guessing wrong looks exactly
  // like an empty account.
  const siteList = await api(token, '/sites');
  const visible = (siteList.siteEntry || []).map((s) => s.siteUrl);
  if (!visible.length) {
    throw new Error('The service account sees no property. Add its client_email under ' +
      `Search Console > Settings > Users and permissions (Restricted is enough): ${key.client_email}`);
  }

  let sites;
  if (process.env.GSC_ALL_SITES === 'true') {
    sites = visible;
  } else if (process.env.GSC_SITE) {
    if (!visible.includes(process.env.GSC_SITE)) {
      throw new Error(`GSC_SITE="${process.env.GSC_SITE}" is not among the properties this account sees: ${visible.join(', ')}`);
    }
    sites = [process.env.GSC_SITE];
  } else {
    // A service account can be added to properties across several projects, and
    // this repo is public. Take the one whose host matches, and refuse rather
    // than guess.
    sites = pickProperty(visible, host, 'Search Console properties');
  }

  const endDate = isoDaysAgo(LAG_DAYS);
  const startDate = isoDaysAgo(LAG_DAYS + WINDOW_DAYS);

  // query x page is the one that earns its place: it says which page Google
  // actually serves for which query, so it shows cannibalisation and wrong
  // internal targeting. The manual CSV export does not contain it.
  const CUTS = [
    { name: 'by_date', dimensions: ['date'], rowLimit: 500 },
    { name: 'by_query', dimensions: ['query'], rowLimit: 1000 },
    { name: 'by_page', dimensions: ['page'], rowLimit: 1000 },
    { name: 'by_query_page', dimensions: ['query', 'page'], rowLimit: 5000 },
    { name: 'by_country', dimensions: ['country'], rowLimit: 300 },
    { name: 'by_device', dimensions: ['device'], rowLimit: 10 },
  ];

  const snapshot = {
    source: 'google-search-console',
    collected_at: new Date().toISOString(),
    window: { startDate, endDate, lag_days: LAG_DAYS },
    // A count, not the list: naming every property the account can reach would
    // publish other projects' domains in a public repo.
    properties_visible_count: visible.length,
    properties_collected: sites,
    data: {},
  };

  for (const site of sites) {
    const per = {};
    for (const cut of CUTS) {
      const r = await api(token, `/sites/${encodeURIComponent(site)}/searchAnalytics/query`, {
        startDate, endDate, dimensions: cut.dimensions, rowLimit: cut.rowLimit, dataState: 'final',
      });
      per[cut.name] = r.rows || [];
    }
    snapshot.data[site] = per;
    console.log(`[gsc] ${site}: ` + Object.entries(per).map(([k, v]) => `${k}=${v.length}`).join(' '));
  }

  const outDir = process.env.GSC_OUT_DIR || 'seo-snapshots';
  await fs.mkdir(outDir, { recursive: true });
  const file = path.join(outDir, `gsc-${endDate}.json`);
  await fs.writeFile(file, JSON.stringify(snapshot, null, 2) + '\n', 'utf8');
  console.log(`[gsc] wrote ${file} covering ${startDate} to ${endDate}`);
}

main().catch((e) => {
  console.error(`[gsc] ${e.message}`);
  process.exit(1);
});
