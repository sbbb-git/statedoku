#!/usr/bin/env node
/**
 * Push URLs to Bing for indexing.
 *
 * Google offers no equivalent for ordinary pages. On a young domain this is
 * worth having: crawling is slow, and a page that is never fetched is never
 * indexed and can never rank.
 *
 * Note the lowercase b in SubmitUrlbatch. The JSON variant spells it that way
 * while the XML one uses a capital B, and that is Microsoft's own casing.
 *
 * Only URLs never submitted before are sent. Re-sending the same list every
 * week burns the quota and teaches Bing nothing, so the register is kept in the
 * repo and versioned alongside the readings. The quota is asked for, not
 * assumed.
 *
 * Env:
 *   BING_API_KEY
 *   BING_SUBMIT_LIMIT   cap the batch (default: whatever the quota allows)
 *   BING_SUBMIT_DRY     set to "true" to report without sending
 */
import fs from 'node:fs/promises';
import path from 'node:path';
import { fetchRetry } from './_gsc-auth.mjs';
import { siteBase, siteHost, pickProperty, sitemapUrls } from './_site.mjs';

const BASE = 'https://ssl.bing.com/webmaster/api.svc/json';
const REGISTER = 'seo-snapshots/bing-submitted.json';

async function call(method, apikey, params = {}, body = null) {
  const qs = new URLSearchParams({ apikey, ...params });
  const res = await fetchRetry(`${BASE}/${method}?${qs}`, body ? {
    method: 'POST',
    headers: { 'content-type': 'application/json' },
    body: JSON.stringify(body),
  } : {});
  const text = await res.text();
  if (text.includes('InvalidApiKey')) {
    throw new Error('Bing rejected the API key (InvalidApiKey). Regenerate it under ' +
      'Bing Webmaster Tools > Settings > API Access > API Key.');
  }
  if (!res.ok) throw new Error(`${method} -> ${res.status}: ${text.slice(0, 300)}`);
  const parsed = JSON.parse(text);
  return 'd' in parsed ? parsed.d : parsed;
}

async function main() {
  const apikey = process.env.BING_API_KEY;
  if (!apikey || !apikey.trim()) {
    console.warn('[submit] skipped: BING_API_KEY is not set');
    return;
  }

  const base = await siteBase();
  const host = await siteHost();

  // The key opens every site on the account. Match on host and refuse to guess.
  const visible = (await call('GetUserSites', apikey) || []).map((s) => s.Url).filter(Boolean);
  if (!visible.length) throw new Error('This key opens no verified site.');
  const siteUrl = pickProperty(visible, host, 'Bing sites')[0];

  // Ask the quota rather than assuming it.
  const quota = await call('GetUrlSubmissionQuota', apikey, { siteUrl });
  const daily = Number(quota?.DailyQuota ?? 0);
  console.log(`[submit] ${siteUrl}: daily quota ${daily}, monthly ${quota?.MonthlyQuota ?? '?'}`);
  if (!daily) {
    console.warn('[submit] no daily quota left, nothing sent');
    return;
  }

  let sent = [];
  try {
    sent = JSON.parse(await fs.readFile(REGISTER, 'utf8')).urls || [];
  } catch {
    console.log('[submit] no register yet, starting one');
  }
  const already = new Set(sent);

  const all = await sitemapUrls(base);
  const fresh = all.filter((u) => !already.has(u));
  const cap = Math.min(daily, Number(process.env.BING_SUBMIT_LIMIT || daily), fresh.length);
  const batch = fresh.slice(0, cap);

  // Always report the counts, including when there is nothing to do.
  console.log(`[submit] sitemap ${all.length}, already submitted ${already.size}, never submitted ${fresh.length}, sending ${batch.length}`);
  if (!batch.length) {
    console.log('[submit] nothing new to send');
    return;
  }

  if (process.env.BING_SUBMIT_DRY === 'true') {
    console.log('[submit] dry run, not sending. First few:', batch.slice(0, 3).join(', '));
    return;
  }

  await call('SubmitUrlbatch', apikey, {}, { siteUrl, urlList: batch });
  console.log(`[submit] sent ${batch.length}`);

  const merged = [...already, ...batch].sort();
  await fs.mkdir(path.dirname(REGISTER), { recursive: true });
  await fs.writeFile(REGISTER, JSON.stringify({
    site: siteUrl,
    updated_at: new Date().toISOString(),
    count: merged.length,
    urls: merged,
  }, null, 2) + '\n', 'utf8');
  console.log(`[submit] register now holds ${merged.length} URLs`);
}

main().catch((e) => {
  console.error(`[submit] ${e.message}`);
  process.exit(1);
});
