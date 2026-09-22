#!/usr/bin/env node
/**
 * Weekly audience reading: who actually plays, and who subscribes.
 *
 * The search collectors measure arrivals from search engines. They cannot say
 * whether anyone played, because a click on /learn/states-and-capitals/ and a
 * solved puzzle look identical from Search Console. That gap is why the site
 * could grow to ~600 Bing clicks a week while nobody knew if the game was used.
 *
 * Both figures live in the same Cloudflare D1 (statedoku-stats), reachable only
 * through the site's own admin endpoints:
 *
 *   GET /api/stats?key=<STATS_ADMIN_KEY>       aggregates, no personal data
 *   GET /api/admin/subscribers                 header X-Admin-Key: <ADMIN_API_KEY>
 *
 * THE SECOND ONE RETURNS EMAIL ADDRESSES. This repository is public. The
 * `subscribers` array is therefore dropped before anything is written, and a
 * hard guard re-reads the finished payload and refuses to write it if an
 * address survived anyway. Counts are public-safe; the people behind them are
 * not, and they never consented to appearing in a git history.
 *
 * Env:
 *   STATS_ADMIN_KEY   query-string key for /api/stats
 *   ADMIN_API_KEY     header key for /api/admin/subscribers
 *   AUDIENCE_OUT_DIR  where to write (default audience-snapshots/)
 */
import fs from 'node:fs/promises';
import path from 'node:path';
import { siteBase } from './_site.mjs';
import { fetchRetry } from './_gsc-auth.mjs';

// Deliberately broad. A false positive costs one reading; a false negative
// publishes somebody's address.
export const EMAIL_RE = /[A-Za-z0-9._%+-]+@[A-Za-z0-9.-]+\.[A-Za-z]{2,}/g;

/** Remove every key that could carry a person, at any depth. */
const PII_KEYS = new Set(['subscribers', 'email', 'token', 'emails', 'rows']);

export function stripPII(value, dropped) {
  if (Array.isArray(value)) return value.map((v) => stripPII(v, dropped));
  if (value && typeof value === 'object') {
    const out = {};
    for (const [k, v] of Object.entries(value)) {
      if (PII_KEYS.has(k)) { dropped.push(k); continue; }
      out[k] = stripPII(v, dropped);
    }
    return out;
  }
  return value;
}

async function getJSON(url, init, label) {
  const res = await fetchRetry(url, init);
  const text = await res.text();
  if (res.status === 401 || res.status === 403) {
    throw new Error(`${label}: the site refused the key (HTTP ${res.status}). ` +
      'Check the secret matches what is set on the Pages project.');
  }
  if (!res.ok) throw new Error(`${label}: HTTP ${res.status}: ${text.slice(0, 200)}`);
  try { return JSON.parse(text); }
  catch { throw new Error(`${label}: answered something that is not JSON: ${text.slice(0, 160)}`); }
}

async function main() {
  const statsKey = (process.env.STATS_ADMIN_KEY || '').trim();
  const adminKey = (process.env.ADMIN_API_KEY || '').trim();
  if (!statsKey && !adminKey) {
    console.warn('[audience] skipped: neither STATS_ADMIN_KEY nor ADMIN_API_KEY is set');
    return;
  }

  const base = (await siteBase()).replace(/\/$/, '');
  const snapshot = { source: 'statedoku-audience', collected_at: new Date().toISOString(), site: base };
  const dropped = [];
  let fetched = 0;

  if (statsKey) {
    const raw = await getJSON(`${base}/api/stats?key=${encodeURIComponent(statsKey)}`, {}, '/api/stats');
    snapshot.gameplay = stripPII(raw, dropped);
    fetched++;
    const d = snapshot.gameplay.daily || [];
    const starts = d.reduce((a, r) => a + (r.starts || 0), 0);
    const solves = d.reduce((a, r) => a + (r.solves || 0), 0);
    console.log(`[audience] gameplay: ${d.length} days, ${starts} starts, ${solves} solves`);
  } else {
    console.warn('[audience] STATS_ADMIN_KEY absent, gameplay not collected');
  }

  if (adminKey) {
    const raw = await getJSON(`${base}/api/admin/subscribers?limit=1`,
      { headers: { 'X-Admin-Key': adminKey } }, '/api/admin/subscribers');
    // Keep only the counted shapes. The subscriber rows are dropped by stripPII.
    snapshot.subscribers = stripPII(
      { ok: raw.ok, summary: raw.summary, breakdowns: raw.breakdowns, generated_at: raw.generated_at },
      dropped);
    fetched++;
    const s = snapshot.subscribers.summary || {};
    console.log(`[audience] subscribers: ${s.active ?? '?'} active of ${s.total ?? '?'} total`);
  } else {
    console.warn('[audience] ADMIN_API_KEY absent, subscribers not collected');
  }

  // Say what was actually done. A collector reporting success over zero
  // endpoints reads exactly like one that worked.
  console.log(`[audience] ${fetched} of 2 endpoints answered; ` +
    `${dropped.length} personal field(s) dropped: ${[...new Set(dropped)].join(', ') || 'none'}`);
  if (!fetched) throw new Error('No endpoint answered. Writing an empty reading would hide that.');

  // The guard. Re-read the finished payload rather than trusting the stripper:
  // the endpoint's shape can change, and this file goes into a public repo.
  const body = JSON.stringify(snapshot, null, 2) + '\n';
  const leaked = body.match(EMAIL_RE) || [];
  console.log(`[audience] leak guard: scanned ${body.length} bytes, ${leaked.length} address(es) found`);
  if (leaked.length) {
    throw new Error(`Refusing to write: ${leaked.length} email address(es) survived stripping. ` +
      'This repository is public. Fix the collector before running it again.');
  }

  const outDir = process.env.AUDIENCE_OUT_DIR || 'audience-snapshots';
  await fs.mkdir(outDir, { recursive: true });
  const file = path.join(outDir, `audience-${new Date().toISOString().slice(0, 10)}.json`);
  await fs.writeFile(file, body, 'utf8');
  console.log(`[audience] wrote ${file}`);
}

// Only run when executed directly, so the helpers above stay importable for
// a guard test that must be able to fail on purpose.
if (process.argv[1] && import.meta.url === new URL(`file://${process.argv[1]}`).href) {
  main().catch((e) => { console.error(`[audience] ${e.message}`); process.exit(1); });
}
