#!/usr/bin/env node
/**
 * Backlink prospect scraper.
 *
 * Usage:
 *   node marketing/prospect-backlinks.js              # default queries
 *   node marketing/prospect-backlinks.js "custom query" "another"
 *
 * Output:
 *   marketing/prospects.tsv    — open in Google Sheets / Numbers
 *   marketing/prospects.json   — raw data
 *
 * What it does:
 *  1. DuckDuckGo HTML search for each query (no API key).
 *  2. Visit each result URL, extract page <title>, author, mailto:, contact emails.
 *  3. Score each prospect (relevance + freshness).
 *  4. Dedup by domain, sort by score, output TSV.
 *
 * Dependencies: none (Node 18+ native fetch).
 */

const fs = require('fs');
const path = require('path');

const DEFAULT_QUERIES = [
  // EN
  'wordle alternatives 2026',
  'best wordle clones',
  'wordle like games list',
  'daily puzzle games like wordle',
  'geography wordle games',
  'us geography daily puzzle',
  'educational daily puzzles 2026',
  'wordle spinoffs list',
  'free daily brain games',
  'wordle copycats list',
  // Targeted to bigger publishers
  'wordle alternatives bustle',
  'wordle alternatives medium',
  'wordle alternatives techradar',
  // ES (Spanish queries — multilingual reach)
  'mejores juegos como wordle',
  'alternativas wordle 2026',
  // FR
  'jeux comme wordle 2026',
  'alternatives wordle quotidien',
];

const queries = process.argv.length > 2 ? process.argv.slice(2) : DEFAULT_QUERIES;

const UA = 'Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36';

// blocklist: don't outreach to these (already known, paywalls, hostile)
const BLOCK = new Set([
  'youtube.com', 'youtu.be', 'reddit.com', 'twitter.com', 'x.com',
  'pinterest.com', 'tiktok.com', 'instagram.com', 'facebook.com',
  'wikipedia.org', 'duckduckgo.com', 'google.com', 'amazon.com',
  'apps.apple.com', 'play.google.com', 'apple.com',
]);

const EMAIL_RE = /\b([A-Za-z0-9._%+-]+@[A-Za-z0-9.-]+\.[A-Za-z]{2,})\b/g;
const TITLE_RE = /<title[^>]*>([^<]+)<\/title>/i;
const AUTHOR_META_RE = /<meta\s+[^>]*name=["']author["'][^>]*content=["']([^"']+)["']/i;
const OG_SITE_RE = /<meta\s+[^>]*property=["']og:site_name["'][^>]*content=["']([^"']+)["']/i;
const PUBDATE_RE = /<meta\s+[^>]*(?:property|name)=["'](?:article:published_time|datePublished|publish_date)["'][^>]*content=["']([^"']+)["']/i;

async function ddgSearch(query) {
  const url = 'https://html.duckduckgo.com/html/?q=' + encodeURIComponent(query);
  console.error(`  → search: "${query}"`);
  try {
    const r = await fetch(url, { headers: { 'User-Agent': UA, 'Accept-Language': 'en-US,en;q=0.9' } });
    if (!r.ok) {
      console.error(`     ⚠ ${r.status}`);
      return [];
    }
    const html = await r.text();
    // Results: <a class="result__a" href="//duckduckgo.com/l/?uddg=ENCODED">Title</a>
    const out = [];
    const re = /<a[^>]+class="result__a"[^>]+href="([^"]+)"[^>]*>([^<]+)</g;
    let m;
    while ((m = re.exec(html))) {
      let href = m[1];
      // DDG wraps in /l/?uddg=...
      const uddg = href.match(/uddg=([^&]+)/);
      if (uddg) href = decodeURIComponent(uddg[1]);
      const title = m[2].replace(/&amp;/g, '&').replace(/&#x27;/g, "'").replace(/&quot;/g, '"');
      out.push({ url: href, title });
      if (out.length >= 25) break;
    }
    return out;
  } catch (e) {
    console.error(`     ⚠ error: ${e.message}`);
    return [];
  }
}

function isUseful(url) {
  try {
    const u = new URL(url);
    const host = u.hostname.replace(/^www\./, '');
    if (BLOCK.has(host)) return false;
    for (const b of BLOCK) if (host.endsWith('.' + b)) return false;
    if (!/^https?:$/.test(u.protocol)) return false;
    return true;
  } catch { return false; }
}

async function inspect(url) {
  try {
    const r = await fetch(url, {
      headers: { 'User-Agent': UA, 'Accept-Language': 'en-US,en;q=0.9' },
      redirect: 'follow',
      // Cap: don't download more than 200KB
    });
    if (!r.ok) return null;
    const html = (await r.text()).slice(0, 400_000);
    return {
      finalUrl: r.url,
      pageTitle: (html.match(TITLE_RE)?.[1] || '').trim(),
      author: (html.match(AUTHOR_META_RE)?.[1] || '').trim(),
      siteName: (html.match(OG_SITE_RE)?.[1] || '').trim(),
      pubDate: (html.match(PUBDATE_RE)?.[1] || '').trim(),
      emails: Array.from(new Set(
        Array.from(html.matchAll(EMAIL_RE))
          .map(m => m[1].toLowerCase())
          .filter(e => !/(\.(png|jpg|svg|gif|webp|jpeg)$)|sentry|wixpress|example\.com|@2x|noreply|donotreply/i.test(e))
          .filter(e => e.length < 60)
      )).slice(0, 5),
      mentionsWordle: /wordle/i.test(html),
      mentionsGeography: /geograph(y|ical)|states?/i.test(html),
      htmlLength: html.length,
    };
  } catch {
    return null;
  }
}

function scoreProspect(p) {
  let s = 0;
  if (p.mentionsWordle) s += 3;
  if (p.mentionsGeography) s += 2;
  if (p.emails.length > 0) s += 4;
  if (p.pubDate) {
    const y = (p.pubDate.match(/202[4-6]/) || [])[0];
    if (y === '2026') s += 3;
    else if (y === '2025') s += 2;
    else if (y === '2024') s += 1;
  }
  if (p.siteName) s += 1;
  if (p.author) s += 1;
  // bonus for high-DA hosts
  const host = (() => { try { return new URL(p.url).hostname.replace(/^www\./, ''); } catch { return ''; } })();
  if (/(medium\.com|substack\.com|dev\.to)$/i.test(host)) s += 2;
  if (/(techradar|bustle|buzzfeed|polygon|theverge|cnet|engadget|kotaku|wired|forbes|nytimes|washingtonpost|guardian|bbc)\.com$/i.test(host)) s += 6;
  if (/(edutopia|teachthought|edsurge|commoncoresheets|teacherspayteachers)\.com$/i.test(host)) s += 4;
  return s;
}

async function main() {
  const allResults = [];
  for (const q of queries) {
    const results = await ddgSearch(q);
    for (const r of results) {
      r.query = q;
      allResults.push(r);
    }
    await new Promise(r => setTimeout(r, 1200)); // be polite to DDG
  }

  // Dedup by URL
  const byUrl = new Map();
  for (const r of allResults) {
    if (!byUrl.has(r.url) && isUseful(r.url)) byUrl.set(r.url, r);
  }
  const candidates = [...byUrl.values()];
  console.error(`\n📊 ${candidates.length} unique candidates to inspect…\n`);

  const prospects = [];
  let i = 0;
  for (const c of candidates) {
    i++;
    process.stderr.write(`  [${i}/${candidates.length}] ${c.url.slice(0, 90)}… `);
    const meta = await inspect(c.url);
    if (!meta) { console.error('skip'); continue; }
    const p = { ...c, ...meta };
    p.score = scoreProspect(p);
    prospects.push(p);
    console.error(`score=${p.score} emails=${meta.emails.length}`);
    await new Promise(r => setTimeout(r, 600));
  }

  // Dedup by domain (keep highest score per domain)
  const byDomain = new Map();
  for (const p of prospects) {
    try {
      const host = new URL(p.url).hostname.replace(/^www\./, '');
      const existing = byDomain.get(host);
      if (!existing || existing.score < p.score) byDomain.set(host, p);
    } catch {}
  }
  const ranked = [...byDomain.values()].sort((a, b) => b.score - a.score);

  // TSV
  const headers = ['score', 'domain', 'pageTitle', 'siteName', 'author', 'emails', 'pubDate', 'mentionsWordle', 'mentionsGeo', 'url', 'foundVia'];
  const rows = ranked.map(p => {
    const host = (() => { try { return new URL(p.url).hostname.replace(/^www\./, ''); } catch { return ''; } })();
    return [
      p.score,
      host,
      (p.pageTitle || '').replace(/\t/g, ' ').slice(0, 120),
      (p.siteName || '').replace(/\t/g, ' '),
      (p.author || '').replace(/\t/g, ' '),
      p.emails.join('; '),
      p.pubDate,
      p.mentionsWordle ? 'yes' : '',
      p.mentionsGeography ? 'yes' : '',
      p.url,
      p.query,
    ].join('\t');
  });

  const outDir = path.dirname(__filename);
  const tsvPath = path.join(outDir, 'prospects.tsv');
  const jsonPath = path.join(outDir, 'prospects.json');
  fs.writeFileSync(tsvPath, [headers.join('\t'), ...rows].join('\n'));
  fs.writeFileSync(jsonPath, JSON.stringify(ranked, null, 2));

  console.error(`\n✅ ${ranked.length} unique domains saved`);
  console.error(`   TSV : ${path.relative(process.cwd(), tsvPath)}`);
  console.error(`   JSON: ${path.relative(process.cwd(), jsonPath)}`);
  console.error(`\nTop 10 by score:`);
  ranked.slice(0, 10).forEach((p, i) => {
    const host = (() => { try { return new URL(p.url).hostname; } catch { return ''; } })();
    console.error(`  ${String(i+1).padStart(2, ' ')}. [${p.score}] ${host}  ${p.emails.length ? '📧' : '  '}  ${p.pageTitle.slice(0, 60)}`);
  });
}

main().catch(e => { console.error(e); process.exit(1); });
