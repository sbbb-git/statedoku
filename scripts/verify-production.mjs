#!/usr/bin/env node
// Checks statedoku.com right after a deploy (Coincheur's practice): exits 1 when
// something a visitor or a crawler would hit is broken. Node 18+ only, no
// dependency. Prints how many things it checked, never "all clear" on nothing.
//
//   - every URL of the live sitemap answers 200, with no redirect;
//   - http:// and www. redirect with a 301 to https://statedoku.com/;
//   - an unknown path answers a real 404;
//   - the security headers are on the homepage;
//   - the homepage serves the asset versions of this commit, and they load;
//   - /api/events, /manifest.json, /data/states.json and the IndexNow key answer.
//
// Usage: node scripts/verify-production.mjs [https://statedoku.com]

import { readFileSync } from 'node:fs';

const BASE = (process.argv[2] || 'https://statedoku.com').replace(/\/$/, '');
const UA = 'statedoku-deploy-check (+https://statedoku.com)';
let failures = 0;
const fail = m => { failures++; if (failures <= 30) console.log('FAIL', m); };

async function get(url, opts = {}) {
  for (let i = 0; i < 3; i++) {
    try {
      return await fetch(url, { redirect: 'manual', headers: { 'user-agent': UA }, signal: AbortSignal.timeout(20000), ...opts });
    } catch (e) {
      if (i === 2) throw e;
      await new Promise(r => setTimeout(r, 1500 * (i + 1)));
    }
  }
}

// 1. Sitemap
const sm = await get(BASE + '/sitemap.xml');
const xml = sm.status === 200 ? await sm.text() : '';
const urls = [...xml.matchAll(/<loc>([^<]+)<\/loc>/g)].map(m => m[1].trim());
if (urls.length < 100) fail(`sitemap lists ${urls.length} URLs (status ${sm.status})`);
let ok = 0, i = 0;
async function worker() {
  while (i < urls.length) {
    const u = urls[i++];
    try {
      const r = await get(u, { method: 'GET' });
      if (r.status === 200) ok++; else fail(`${u} answered ${r.status}`);
      await r.arrayBuffer().catch(() => {});
    } catch (e) { fail(`${u} did not answer (${e.name})`); }
  }
}
await Promise.all(Array.from({ length: 8 }, worker));
console.log(`sitemap: ${urls.length} URLs checked, ${ok} answered 200`);

// 2. Redirects
const host = new URL(BASE).host;
const redirects = [[`http://${host}/`, `${BASE}/`], [`https://www.${host}/`, `${BASE}/`], [`http://www.${host}/learn/`, `${BASE}/learn/`]];
for (const [from, to] of redirects) {
  // Permanent hops only (http to https, then www to the bare domain), at most 3.
  try {
    let url = from, hops = [];
    while (url !== to && hops.length < 3) {
      const r = await get(url);
      const loc = r.headers.get('location');
      if (r.status !== 301 && r.status !== 308) break;
      hops.push(r.status); url = new URL(loc, url).href;
    }
    if (url !== to || !hops.length) fail(`${from} ends at ${url} after ${hops.join(',') || 'no'} redirect(s), expected ${to}`);
  } catch (e) { fail(`${from} did not answer`); }
}
console.log(`redirects: ${redirects.length} checked`);

// 3. Real 404
const missing = await get(`${BASE}/no-such-page-${Date.now()}/`);
if (missing.status !== 404) fail(`unknown path answered ${missing.status}, not 404`);

// 4. Headers and 5. versions on the homepage. A fresh deploy can take a few
// seconds to reach every edge: up to six tries, ten seconds apart.
const local = readFileSync(new URL('../index.html', import.meta.url), 'utf8');
const assets = [...new Set([...local.matchAll(/(?:src|href)="(\/[^"]+\?v=\d+)"/g)].map(m => m[1]))];
let home, html = '';
for (let t = 0; t < 6; t++) {
  home = await get(BASE + '/?deploy-check=' + Date.now());
  html = home.status === 200 ? await home.text() : '';
  if (assets.every(a => html.includes(a))) break;
  await new Promise(r => setTimeout(r, 10000));
}
if (home.status !== 200) fail(`homepage answered ${home.status}`);
const headers = ['strict-transport-security', 'content-security-policy', 'x-content-type-options', 'referrer-policy'];
for (const h of headers) if (!home.headers.get(h)) fail(`homepage misses the ${h} header`);
console.log(`headers: ${headers.length} checked on the homepage`);

let assetOk = 0;
for (const a of assets) {
  if (!html.includes(a)) fail(`homepage does not reference ${a} yet (deploy not live?)`);
  const r = await get(BASE + a);
  if (r.status === 200) assetOk++; else fail(`${a} answered ${r.status}`);
  await r.arrayBuffer().catch(() => {});
}
console.log(`assets: ${assets.length} versioned files of this commit checked, ${assetOk} load`);

// 6. Endpoints and data
const ev = await get(BASE + '/api/events');
if (ev.status !== 200) fail(`/api/events health answered ${ev.status}`);
const man = await get(BASE + '/manifest.json');
try { const m = await man.json(); if (!Array.isArray(m.icons) || !m.icons.length) fail('manifest has no icons'); }
catch (e) { fail(`/manifest.json is not JSON (status ${man.status})`); }
const st = await get(BASE + '/data/states.json');
try { const s = await st.json(); if (!Array.isArray(s) || s.length !== 50) fail(`states.json holds ${s && s.length} states`); }
catch (e) { fail(`/data/states.json is not JSON (status ${st.status})`); }
const key = await get(BASE + '/a7844e0c0770e4f1a297158b783450d7.txt');
if (key.status !== 200) fail(`IndexNow key file answered ${key.status}`);
console.log('endpoints: 4 checked (/api/events, manifest, states.json, IndexNow key)');

if (failures) { console.log(`${failures} failure(s)`); process.exit(1); }
console.log('production check passed');
