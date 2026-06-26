#!/usr/bin/env node
/**
 * IndexNow submission for the Shabbat content push (~824 new URLs).
 *
 * Uses the dynamic sitemap function directly so the list always matches what's
 * currently being served at /sitemap.xml. 10,000-URL cap per request.
 */
const https = require('https');
const path = require('path');
const sitemap = require(path.resolve(__dirname, '..', 'functions/sitemap.xml.js'));

const KEY = 'a7844e0c0770e4f1a297158b783450d7';
const HOST = 'statedoku.com';
const BASE = 'https://statedoku.com';
const KEY_LOCATION = `${BASE}/${KEY}.txt`;
const DRY = process.argv.includes('--dry-run');

const ENDPOINTS = [
  'https://api.indexnow.org/indexnow',
  'https://www.bing.com/indexnow',
  'https://yandex.com/indexnow',
];

function submit(endpoint, payload) {
  return new Promise((resolve) => {
    const req = https.request(endpoint, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json; charset=utf-8', 'Content-Length': Buffer.byteLength(payload) },
    }, (res) => {
      let body = '';
      res.on('data', d => body += d);
      res.on('end', () => resolve({ status: res.statusCode, body }));
    });
    req.on('error', e => resolve({ status: 0, body: e.message }));
    req.write(payload);
    req.end();
  });
}

(async () => {
  const r = await sitemap.onRequestGet({ request: {} });
  const xml = await r.text();
  const urls = [...xml.matchAll(/<loc>([^<]+)<\/loc>/g)].map(m => m[1]);
  console.log(`📦 ${urls.length} URLs in sitemap.`);

  // IndexNow caps at 10k per request — slice if needed.
  const batches = [];
  for (let i = 0; i < urls.length; i += 9500) batches.push(urls.slice(i, i + 9500));
  console.log(`📤 ${batches.length} batch(es) of <=9500 URLs.`);

  if (DRY) {
    console.log('Sample first 5:', urls.slice(0, 5));
    console.log('Sample last 5:', urls.slice(-5));
    process.exit(0);
  }

  for (let bi = 0; bi < batches.length; bi++) {
    const payload = JSON.stringify({ host: HOST, key: KEY, keyLocation: KEY_LOCATION, urlList: batches[bi] });
    console.log(`\n=== Batch ${bi + 1}/${batches.length} (${batches[bi].length} URLs) ===`);
    let ok = false;
    for (const endpoint of ENDPOINTS) {
      for (let attempt = 1; attempt <= 3; attempt++) {
        const { status, body } = await submit(endpoint, payload);
        const host = endpoint.replace(/^https:\/\//, '').split('/')[0];
        if (status === 200 || status === 202) {
          console.log(`✅ ${host} HTTP ${status}`);
          ok = true; break;
        }
        console.log(`  ${host} attempt ${attempt}: HTTP ${status}${status >= 500 ? ' (retry)' : ''}`);
        if (status === 403) { console.log(`  → Key file unreachable: ${KEY_LOCATION}`); break; }
        if (status === 422) { console.log('  → URL/host/key mismatch.'); break; }
        if (status >= 500 || status === 0) { await new Promise(r => setTimeout(r, 5000)); continue; }
        break;
      }
      if (ok) break;
    }
    if (!ok) console.log(`⚠️ Batch ${bi + 1} failed all endpoints — re-run later.`);
  }
})();
