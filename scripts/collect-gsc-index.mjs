#!/usr/bin/env node
/**
 * Weekly Google index coverage, via the URL Inspection API.
 *
 * This is the reading almost nobody takes, and it is second only to authority
 * in what it explains. A page missing from the index cannot rank however good
 * it is, and nothing in the performance report says so: an unindexed page
 * simply never appears, which looks identical to a page that ranks badly.
 *
 * Quota is 2,000 inspections per day per site and 600 per minute. This site
 * publishes 757 URLs, so one full pass costs about 37% of a day, once a week.
 * Concurrency stays low on purpose: nothing presses, and a 429 would cost the
 * whole reading.
 *
 * Google's own chosen canonical is recorded next to the declared one. When they
 * differ it is always a real defect, and it is invisible from the page itself.
 *
 * Env:
 *   one of the names in KEY_VARS (see _gsc-auth.mjs)
 *   GSC_INDEX_LIMIT   cap the number of URLs inspected, for a smoke run
 *   GSC_OUT_DIR       where to write (default seo-snapshots/)
 */
import fs from 'node:fs/promises';
import path from 'node:path';
import { readKey, accessToken, fetchRetry, pool } from './_gsc-auth.mjs';
import { siteBase, siteHost, pickProperty, sitemapUrls } from './_site.mjs';

const SCOPE = 'https://www.googleapis.com/auth/webmasters.readonly';
const INSPECT = 'https://searchconsole.googleapis.com/v1/urlInspection/index:inspect';
const CONCURRENCY = 4;

async function inspect(token, siteUrl, inspectionUrl) {
  const res = await fetchRetry(INSPECT, {
    method: 'POST',
    headers: { authorization: `Bearer ${token}`, 'content-type': 'application/json' },
    body: JSON.stringify({ inspectionUrl, siteUrl, languageCode: 'en-US' }),
  });
  const text = await res.text();
  if (!res.ok) return { url: inspectionUrl, error: `${res.status}: ${text.slice(0, 200)}` };

  const r = JSON.parse(text).inspectionResult || {};
  const idx = r.indexStatusResult || {};
  return {
    url: inspectionUrl,
    verdict: idx.verdict || null,
    coverageState: idx.coverageState || null,
    robotsTxtState: idx.robotsTxtState || null,
    pageFetchState: idx.pageFetchState || null,
    indexingState: idx.indexingState || null,
    googleCanonical: idx.googleCanonical || null,
    userCanonical: idx.userCanonical || null,
    lastCrawlTime: idx.lastCrawlTime || null,
  };
}

async function main() {
  const { skip, key, found } = readKey();
  if (skip) {
    console.warn(`[index] skipped: ${skip}`);
    return;
  }
  console.log(`[index] using ${found}`);

  const base = await siteBase();
  const host = await siteHost();
  const token = await accessToken(key, SCOPE);

  // Ask which properties exist rather than assembling sc-domain: by hand.
  const listRes = await fetchRetry('https://searchconsole.googleapis.com/webmasters/v3/sites', {
    headers: { authorization: `Bearer ${token}` },
  });
  if (!listRes.ok) throw new Error(`/sites -> ${listRes.status}: ${await listRes.text()}`);
  const visible = (JSON.parse(await listRes.text()).siteEntry || []).map((s) => s.siteUrl);
  if (!visible.length) {
    throw new Error('The service account sees no property. Add its client_email under ' +
      `Search Console > Settings > Users and permissions: ${key.client_email}`);
  }
  const siteUrl = pickProperty(visible, host, 'Search Console properties')[0];

  let urls = await sitemapUrls(base);
  const limit = Number(process.env.GSC_INDEX_LIMIT || 0);
  if (limit > 0) urls = urls.slice(0, limit);
  console.log(`[index] ${siteUrl}: inspecting ${urls.length} URLs from the sitemap at ${CONCURRENCY} at a time`);

  let done = 0;
  const rows = await pool(urls, CONCURRENCY, async (u) => {
    const r = await inspect(token, siteUrl, u);
    if (++done % 100 === 0) console.log(`[index]   ${done}/${urls.length}`);
    return r;
  });

  // Report the counts, always. A loop that announces "all clear" over zero
  // items has checked nothing, and reads exactly like a loop that passed.
  const tally = {};
  for (const r of rows) tally[r.error ? 'ERROR' : r.coverageState || r.verdict || 'UNKNOWN'] =
    (tally[r.error ? 'ERROR' : r.coverageState || r.verdict || 'UNKNOWN'] || 0) + 1;
  const notIndexed = rows.filter((r) => !r.error && r.verdict && r.verdict !== 'PASS');
  const canonicalMismatch = rows.filter(
    (r) => !r.error && r.googleCanonical && r.userCanonical && r.googleCanonical !== r.userCanonical
  );

  console.log(`[index] inspected ${rows.length}`);
  for (const [k, v] of Object.entries(tally).sort((a, b) => b[1] - a[1])) console.log(`[index]   ${v} ${k}`);
  console.log(`[index] not passing: ${notIndexed.length}   canonical mismatch: ${canonicalMismatch.length}`);

  const snapshot = {
    source: 'google-url-inspection',
    collected_at: new Date().toISOString(),
    property: siteUrl,
    properties_visible_count: visible.length,
    inspected: rows.length,
    summary: { tally, not_passing: notIndexed.length, canonical_mismatch: canonicalMismatch.length },
    rows,
  };

  const outDir = process.env.GSC_OUT_DIR || 'seo-snapshots';
  await fs.mkdir(outDir, { recursive: true });
  const day = new Date().toISOString().slice(0, 10);
  const file = path.join(outDir, `gsc-index-${day}.json`);
  await fs.writeFile(file, JSON.stringify(snapshot, null, 2) + '\n', 'utf8');
  console.log(`[index] wrote ${file}`);
}

main().catch((e) => {
  console.error(`[index] ${e.message}`);
  process.exit(1);
});
