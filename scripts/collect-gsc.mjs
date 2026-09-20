#!/usr/bin/env node
/**
 * Weekly Google Search Console snapshot.
 *
 * Collection is separate from analysis on purpose: this runs in CI, where the
 * service-account key lives as a GitHub secret and nothing else can read it,
 * and writes raw JSON into the repo. An assistant session later reads the
 * committed file. The key never reaches a transcript, a log or an error body.
 *
 * No npm dependency. The RS256 signature is ten lines of node:crypto, and
 * pulling googleapis would slow every `npm ci` for a script that runs once a
 * week.
 *
 * Auth chain: build a JWT (iss = client_email, scope = webmasters.readonly,
 * aud = the token endpoint), trade it for an access token with
 * grant_type=urn:ietf:params:oauth:grant-type:jwt-bearer, then call the
 * webmasters/v3 API.
 *
 * Env:
 *   GSC_SERVICE_ACCOUNT_JSON  the whole downloaded key file, braces included.
 *                             GOOGLE_SERVICE_ACCOUNT_JSON and the other names in
 *                             KEY_VARS are accepted too: GitHub gives no way to
 *                             list the secrets on a repository, so rather than
 *                             guess one name and silently skip forever, the
 *                             workflow passes several and the first one filled
 *                             wins. Only the name is ever logged.
 *   GSC_OUT_DIR               where to write (default seo-snapshots/)
 *   GSC_SITE                  property id to collect; default is whichever
 *                             visible property is about statedoku.com
 *   GSC_ALL_SITES             set to "true" to collect every visible property
 */
import crypto from 'node:crypto';
import fs from 'node:fs/promises';
import path from 'node:path';

const TOKEN_URL = 'https://oauth2.googleapis.com/token';
const API = 'https://searchconsole.googleapis.com/webmasters/v3';
const SCOPE = 'https://www.googleapis.com/auth/webmasters.readonly';

// This repo is statedoku, and it is public.
const SITE_DOMAIN = 'statedoku.com';

// Search Console data lags two to three days. Asking up to today returns empty
// days that read as a traffic collapse.
const LAG_DAYS = 3;
const WINDOW_DAYS = 28;

const b64url = (buf) =>
  Buffer.from(buf).toString('base64').replace(/\+/g, '-').replace(/\//g, '_').replace(/=+$/, '');

const KEY_VARS = [
  'GSC_SERVICE_ACCOUNT_JSON',
  'GOOGLE_SERVICE_ACCOUNT_JSON',
  'GOOGLE_SERVICE_ACCOUNT',
  'SEARCH_CONSOLE_SERVICE_ACCOUNT_JSON',
  'GSC_KEY_JSON',
];

function readKey() {
  const found = KEY_VARS.find((v) => (process.env[v] || '').trim());
  if (!found) {
    return { skip: `none of ${KEY_VARS.join(', ')} is set` };
  }
  const raw = process.env[found];
  console.log(`[gsc] using ${found}`);
  let key;
  try {
    key = JSON.parse(raw);
  } catch (e) {
    throw new Error(
      found + ' is not valid JSON (' + e.message + '). ' +
      'Paste the downloaded key file whole, including the outer braces.');
  }
  for (const f of ['client_email', 'private_key']) {
    if (!key[f]) throw new Error(`${found} has no "${f}". This is not a service-account key file.`);
  }
  return { key };
}

async function accessToken(key) {
  const now = Math.floor(Date.now() / 1000);
  const claims = { iss: key.client_email, scope: SCOPE, aud: TOKEN_URL, iat: now, exp: now + 3600 };
  const signingInput = b64url(JSON.stringify({ alg: 'RS256', typ: 'JWT' })) + '.' + b64url(JSON.stringify(claims));
  let signature;
  try {
    signature = b64url(crypto.sign('RSA-SHA256', Buffer.from(signingInput), key.private_key));
  } catch (e) {
    throw new Error('Could not sign the JWT with private_key (' + e.message + '). ' +
      'A key pasted through a shell often loses its newlines; they must survive as \\n.');
  }

  const res = await fetch(TOKEN_URL, {
    method: 'POST',
    headers: { 'content-type': 'application/x-www-form-urlencoded' },
    body: new URLSearchParams({
      grant_type: 'urn:ietf:params:oauth:grant-type:jwt-bearer',
      assertion: signingInput + '.' + signature,
    }),
  });
  const body = await res.text();
  if (!res.ok) {
    let hint = '';
    if (body.includes('account not found') || body.includes('invalid_grant')) {
      hint = ' The signature is well formed but Google does not know this account. ' +
             'Check client_email, and that the service account still exists.';
    }
    throw new Error(`token exchange failed ${res.status}: ${body}${hint}`);
  }
  return JSON.parse(body).access_token;
}

async function api(token, endpoint, body) {
  const res = await fetch(API + endpoint, {
    method: body ? 'POST' : 'GET',
    headers: { authorization: 'Bearer ' + token, 'content-type': 'application/json' },
    body: body ? JSON.stringify(body) : undefined,
  });
  const text = await res.text();
  if (!res.ok) throw new Error(`${endpoint} -> ${res.status}: ${text}`);
  return JSON.parse(text);
}

function isoDaysAgo(n) {
  return new Date(Date.now() - n * 86400000).toISOString().slice(0, 10);
}

async function main() {
  const { skip, key } = readKey();
  if (skip) {
    // A missing secret is a skip, not a failure. A red cross every week stops
    // being read, and the alert is worthless the day it matters.
    console.warn(`[gsc] skipped: ${skip}`);
    return;
  }

  const token = await accessToken(key);

  // Never build the property id by hand. A domain property is sc-domain:x.com,
  // a URL-prefix property is https://x.com/, and guessing wrong looks exactly
  // like an empty account.
  const siteList = await api(token, '/sites');
  let sites = (siteList.siteEntry || []).map((s) => s.siteUrl);
  if (!sites.length) {
    throw new Error('The service account sees no property. Add its client_email under ' +
      'Search Console > Settings > Users and permissions (Restricted is enough): ' + key.client_email);
  }
  const visible = sites;
  if (process.env.GSC_ALL_SITES !== 'true') {
    if (process.env.GSC_SITE) {
      if (!visible.includes(process.env.GSC_SITE)) {
        throw new Error(`GSC_SITE="${process.env.GSC_SITE}" is not among the properties this account sees: ${visible.join(', ')}`);
      }
      sites = [process.env.GSC_SITE];
    } else {
      // A service account can be added to properties for several projects. This
      // repo is statedoku and is public, so collect only the properties about
      // this domain rather than everything the account happens to see.
      sites = visible.filter((u) => u.includes(SITE_DOMAIN));
      if (!sites.length) {
        throw new Error(`No visible property mentions ${SITE_DOMAIN}. Set GSC_SITE explicitly, ` +
          'or GSC_ALL_SITES=true to collect every property this account sees.');
      }
    }
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
    const n = Object.entries(per).map(([k, v]) => `${k}=${v.length}`).join(' ');
    console.log(`[gsc] ${site}: ${n}`);
  }

  const outDir = process.env.GSC_OUT_DIR || 'seo-snapshots';
  await fs.mkdir(outDir, { recursive: true });
  const file = path.join(outDir, `gsc-${endDate}.json`);
  await fs.writeFile(file, JSON.stringify(snapshot, null, 2) + '\n', 'utf8');
  console.log(`[gsc] wrote ${file} covering ${startDate} to ${endDate}`);
}

main().catch((e) => {
  console.error('[gsc] ' + e.message);
  process.exit(1);
});
