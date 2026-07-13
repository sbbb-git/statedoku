#!/usr/bin/env node
/**
 * IndexNow — STREAMING mode (per Bing Webmaster Tools recommendation).
 *
 * Instead of blasting all sitemap URLs on every deploy (batch mode →
 * slower indexing, server strain), this reads `git diff` to find just
 * the HTML files that actually changed, maps them to canonical URLs,
 * filters out noindex pages + non-content paths, and submits ONLY
 * those to the IndexNow endpoints.
 *
 * Usage:
 *   node tmp/indexnow-streaming.js                       # HEAD~1..HEAD
 *   node tmp/indexnow-streaming.js HEAD~5..HEAD          # last 5 commits
 *   node tmp/indexnow-streaming.js --since=2h            # last 2 hours
 *   node tmp/indexnow-streaming.js --dry-run             # preview only
 *   node tmp/indexnow-streaming.js --url=/foo/bar/       # one-off URL
 *
 * Wire it into your deploy hook: run after `git push` and it will only
 * ping the URLs that actually changed.
 */
const https = require('https');
const { execSync } = require('child_process');
const fs = require('fs');
const path = require('path');

const KEY = 'a7844e0c0770e4f1a297158b783450d7';
const HOST = 'statedoku.com';
const BASE = 'https://statedoku.com';
const KEY_LOCATION = `${BASE}/${KEY}.txt`;

// Streaming mode caps a single submit at 100 URLs (Bing's soft-recommended
// per-request ceiling for streaming). If a commit touches more than that,
// we do multiple sequential submits with a small gap so we still count as
// streaming, not batch.
const MAX_PER_STREAM = 100;
const STREAM_GAP_MS = 3000;

const DRY = process.argv.includes('--dry-run');
const rangeArg = process.argv.find(a => /^HEAD/.test(a) || /^[a-f0-9]{7,40}\.\./.test(a));
const sinceArg = process.argv.find(a => a.startsWith('--since='));
const urlArgs = process.argv.filter(a => a.startsWith('--url=')).map(a => a.slice(6));

const ENDPOINTS = [
  'https://api.indexnow.org/indexnow',
  'https://www.bing.com/indexnow',
  'https://yandex.com/indexnow',
];

// ── Path → URL mapping ───────────────────────────────────────────────────
// index.html files sit at their directory URL. Skip templates/assets/etc.
const IGNORE_PREFIXES = [
  'tmp/', 'bot/', 'admin/', 'functions/', 'marketing/', '.claude/',
  'node_modules/', 'og/', 'css/', 'js/', 'data/', 'scripts/',
  'press/screenshots/', 'og-image', 'twitter-banner',
];

function isContentHtml(relPath) {
  if (!relPath.endsWith('.html')) return false;
  if (IGNORE_PREFIXES.some(p => relPath.startsWith(p))) return false;
  return true;
}

function relToUrl(relPath) {
  // learn/state-birds/index.html → /learn/state-birds/
  let p = relPath;
  if (p.endsWith('/index.html')) p = p.slice(0, -'index.html'.length);
  else if (p === 'index.html') p = '';
  else if (p.endsWith('.html')) p = p.slice(0, -'.html'.length);
  return BASE + '/' + p;
}

function hasNoindex(relPath) {
  const abs = path.resolve(__dirname, '..', relPath);
  try {
    const src = fs.readFileSync(abs, 'utf8');
    return /<meta\s+name=["']robots["']\s+content=["'][^"']*noindex/i.test(src);
  } catch {
    return false; // deleted → still submit so search engines drop it
  }
}

// ── Collect changed HTML files from git ──────────────────────────────────
function gitChanged(range) {
  const out = execSync(`git diff --name-only ${range}`, { encoding: 'utf8' });
  return out.split('\n').map(s => s.trim()).filter(Boolean);
}

function pickRange() {
  if (rangeArg) return rangeArg;
  if (sinceArg) {
    // Convert --since=2h into git syntax
    const spec = sinceArg.slice(8);
    return `--since="${spec.replace(/([hdwm])/, ' $1')} ago"`;
  }
  return 'HEAD~1..HEAD';
}

// ── Build final URL list ─────────────────────────────────────────────────
let urls;
if (urlArgs.length) {
  urls = urlArgs.map(u => BASE + (u.startsWith('/') ? u : '/' + u));
} else {
  const range = pickRange();
  const changed = gitChanged(range).filter(isContentHtml);
  urls = changed
    .filter(f => !hasNoindex(f))
    .map(relToUrl)
    // Dedup
    .filter((v, i, a) => a.indexOf(v) === i);
  console.log(`📂 range: ${range}`);
  console.log(`📂 changed HTML: ${changed.length}, indexable: ${urls.length}`);
}

if (!urls.length) {
  console.log('🟰 nothing to submit (no content HTML changed).');
  process.exit(0);
}

console.log(`📤 ${urls.length} URL${urls.length === 1 ? '' : 's'} to stream:`);
urls.slice(0, 8).forEach(u => console.log('  ' + u));
if (urls.length > 8) console.log(`  … +${urls.length - 8} more`);

if (DRY) {
  console.log('\n🧪 --dry-run — nothing submitted.');
  process.exit(0);
}

// ── HTTP submit ──────────────────────────────────────────────────────────
function submit(endpoint, payload) {
  return new Promise((resolve) => {
    const req = https.request(endpoint, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json; charset=utf-8',
        'Content-Length': Buffer.byteLength(payload),
      },
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
  // Split into ≤100-URL streams.
  const streams = [];
  for (let i = 0; i < urls.length; i += MAX_PER_STREAM) {
    streams.push(urls.slice(i, i + MAX_PER_STREAM));
  }

  for (let si = 0; si < streams.length; si++) {
    const chunk = streams[si];
    const payload = JSON.stringify({
      host: HOST,
      key: KEY,
      keyLocation: KEY_LOCATION,
      urlList: chunk,
    });
    console.log(`\n=== Stream ${si + 1}/${streams.length} (${chunk.length} URLs) ===`);

    let submitted = false;
    for (const endpoint of ENDPOINTS) {
      for (let attempt = 1; attempt <= 3; attempt++) {
        const { status, body } = await submit(endpoint, payload);
        const host = endpoint.replace(/^https:\/\//, '').split('/')[0];
        if (status === 200 || status === 202) {
          console.log(`✅ ${host} HTTP ${status}`);
          submitted = true; break;
        }
        console.log(`  ${host} attempt ${attempt}: HTTP ${status}${status >= 500 ? ' (retry)' : ''}`);
        if (status === 403) { console.log(`  → Key file unreachable: ${KEY_LOCATION}`); break; }
        if (status === 422) { console.log(`  → URL/host/key mismatch. body=${body.slice(0, 200)}`); break; }
        if (status >= 500 || status === 0) { await new Promise(r => setTimeout(r, 3000)); continue; }
        break;
      }
      if (submitted) break;
    }
    if (!submitted) console.log(`⚠️ Stream ${si + 1} failed all endpoints — re-run later.`);

    if (si + 1 < streams.length) await new Promise(r => setTimeout(r, STREAM_GAP_MS));
  }
})();
