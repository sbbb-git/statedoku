#!/usr/bin/env node
/**
 * Weekly AdSense reading: is statedoku.com approved, and is anything wrong.
 *
 * The review status only lives in the AdSense UI, where nobody looks between
 * the day the site is submitted and the day the email arrives. This reads it
 * through the AdSense Management API v2 and archives it, so a change of state,
 * a new alert or a policy issue on a page shows up in the weekly reading.
 *
 * WHAT IT WRITES, AND WHAT IT NEVER WRITES
 *
 * This repository is public. An AdSense account covers every site its owner has
 * added, and the first run of the Bing collector here published nine sites'
 * search data because a key opened more than the one site it was meant for.
 * So this collector:
 *   - keeps statedoku.com only, and counts the other sites without naming them;
 *   - never calls reports or payments, so no earnings, RPM or CTR is written;
 *   - drops the account display name, which can be a person's name;
 *   - re-reads the finished payload and refuses to write it if any domain other
 *     than statedoku.com, or anything shaped like an email address, survived.
 *
 * Auth is OAuth with a refresh token: the AdSense API does not accept service
 * accounts. The owner authorises once, read-only, and the three values live as
 * GitHub secrets.
 *
 * Env:
 *   ADSENSE_CLIENT_ID, ADSENSE_CLIENT_SECRET, ADSENSE_REFRESH_TOKEN
 *   ADSENSE_OUT_DIR   where to write (default audience-snapshots/)
 */
import fs from 'node:fs/promises';
import path from 'node:path';
import { siteHost } from './_site.mjs';
import { fetchRetry } from './_gsc-auth.mjs';

const API = 'https://adsense.googleapis.com/v2';

export const EMAIL_RE = /[A-Za-z0-9._%+-]+@[A-Za-z0-9.-]+\.[A-Za-z]{2,}/g;
// Hostnames in free text. Google's own hosts are allowed through, since alert
// messages link to their help pages.
export const DOMAIN_RE = /\b(?:[a-z0-9](?:[a-z0-9-]{0,61}[a-z0-9])?\.)+[a-z]{2,24}\b/gi;
// File names, not hosts: AdSense alerts routinely mention ads.txt.
const FILE_EXT = /\.(txt|json|html?|js|css|xml|csv|pdf|png|jpe?g|gif|svg|webp)$/i;
const ALLOWED_HOST = /(^|\.)(google|googleapis|googleusercontent|gstatic|youtube)\.com$|(^|\.)g\.co$/i;

/** Any hostname in the text that is neither ours nor Google's. */
export function foreignHosts(text, ownHost) {
  const own = ownHost.replace(/^www\./, '').toLowerCase();
  return [...new Set((text.match(DOMAIN_RE) || []).map((h) => h.toLowerCase()))]
    .filter((h) => h.replace(/^www\./, '') !== own && !ALLOWED_HOST.test(h))
    // Numbers like 1.5 and dotted identifiers are not hostnames.
    .filter((h) => /[a-z]/.test(h.split('.').pop()))
    // Nor are file names. AdSense alerts routinely mention ads.txt, and treating
    // it as a foreign site would make the guard refuse every reading.
    .filter((h) => !FILE_EXT.test(h));
}

async function accessToken() {
  const id = (process.env.ADSENSE_CLIENT_ID || '').trim();
  const secret = (process.env.ADSENSE_CLIENT_SECRET || '').trim();
  const refresh = (process.env.ADSENSE_REFRESH_TOKEN || '').trim();
  const missing = [['ADSENSE_CLIENT_ID', id], ['ADSENSE_CLIENT_SECRET', secret], ['ADSENSE_REFRESH_TOKEN', refresh]]
    .filter(([, v]) => !v).map(([k]) => k);
  if (missing.length === 3) return { skip: 'none of the ADSENSE_* secrets is set' };
  if (missing.length) throw new Error(`Only part of the AdSense credentials is set; missing ${missing.join(', ')}.`);

  const res = await fetchRetry('https://oauth2.googleapis.com/token', {
    method: 'POST',
    headers: { 'content-type': 'application/x-www-form-urlencoded' },
    body: new URLSearchParams({ client_id: id, client_secret: secret, refresh_token: refresh, grant_type: 'refresh_token' }),
  });
  const body = await res.json().catch(() => ({}));
  if (!res.ok) {
    const hint = body.error === 'invalid_grant'
      ? ' The refresh token was revoked or has expired. If the OAuth app is still in "Testing", Google expires ' +
        'its refresh tokens after 7 days: set it to "In production" and authorise again.'
      : body.error === 'invalid_client' ? ' The client id or secret does not match.' : '';
    const desc = (body.error_description || '').replace(/\.$/, '');
    throw new Error(`token exchange failed ${res.status}: ${body.error || ''} ${desc}.${hint}`);
  }
  return { token: body.access_token };
}

async function get(token, url) {
  const res = await fetchRetry(url, { headers: { authorization: `Bearer ${token}` } });
  const text = await res.text();
  if (res.status === 403) {
    throw new Error(`AdSense refused (403) on ${url.replace(API, '')}. Either the AdSense Management API is not ` +
      `enabled on the Cloud project, or the authorised Google account has no access to this AdSense account. ` +
      `${text.slice(0, 200)}`);
  }
  if (!res.ok) throw new Error(`${url.replace(API, '')} -> ${res.status}: ${text.slice(0, 250)}`);
  return JSON.parse(text || '{}');
}

/** Follow nextPageToken until the list is complete. */
async function list(token, url, key) {
  const out = [];
  let page = '';
  do {
    const sep = url.includes('?') ? '&' : '?';
    const j = await get(token, `${url}${sep}pageSize=100${page ? `&pageToken=${page}` : ''}`);
    out.push(...(j[key] || []));
    page = j.nextPageToken || '';
  } while (page);
  return out;
}

async function main() {
  const auth = await accessToken();
  if (auth.skip) { console.warn(`[adsense] skipped: ${auth.skip}`); return; }
  const { token } = auth;
  const host = (await siteHost()).replace(/^www\./, '').toLowerCase();

  const accounts = await list(token, `${API}/accounts`, 'accounts');
  console.log(`[adsense] ${accounts.length} account(s) visible`);
  if (!accounts.length) throw new Error('The authorised Google account sees no AdSense account.');

  const snapshot = {
    source: 'adsense-management-v2',
    collected_at: new Date().toISOString(),
    site: host,
    accounts: [],
  };

  for (const acc of accounts) {
    const sites = await list(token, `${API}/${acc.name}/sites`, 'sites');
    const ours = sites.filter((s) => (s.domain || '').replace(/^www\./, '').toLowerCase() === host);
    const alerts = await list(token, `${API}/${acc.name}/alerts`, 'alerts').catch((e) => ({ error: e.message }));
    const issues = await list(token, `${API}/${acc.name}/policyIssues`, 'policyIssues').catch((e) => ({ error: e.message }));

    const ourIssues = Array.isArray(issues)
      ? issues.filter((i) => [i.site, i.uri].some((v) => (v || '').toLowerCase().includes(host)))
      : issues;

    snapshot.accounts.push({
      // The publisher id is already public in ads.txt; the display name is not kept.
      account: acc.name,
      state: acc.state ?? null,
      pending_tasks: acc.pendingTasks ?? [],
      time_zone: acc.timeZone?.id ?? null,
      other_sites_count: sites.length - ours.length,
      sites: ours.map((s) => ({ domain: s.domain, state: s.state, auto_ads_enabled: s.autoAdsEnabled ?? null })),
      alerts: Array.isArray(alerts)
        ? alerts.map((a) => ({ severity: a.severity, type: a.type, message: a.message }))
        : alerts,
      policy_issues: Array.isArray(ourIssues)
        ? ourIssues.map((i) => ({
          entity_type: i.entityType, site: i.site, site_section: i.siteSection, uri: i.uri,
          enforcement: i.action, topics: (i.policyTopics || []).map((t) => t.topic),
          first_detected: i.firstDetectedDate, last_detected: i.lastDetectedDate,
        }))
        : ourIssues,
      policy_issues_other_sites_count: Array.isArray(issues) ? issues.length - ourIssues.length : null,
    });

    const s = ours[0];
    console.log(`[adsense] ${acc.name}: account ${acc.state ?? '?'}; ${host} ${s ? s.state : 'NOT FOUND'}` +
      `${s && s.autoAdsEnabled != null ? `, auto ads ${s.autoAdsEnabled ? 'ON' : 'off'}` : ''}; ` +
      `${Array.isArray(alerts) ? alerts.length : '?'} alert(s); ` +
      `${Array.isArray(ourIssues) ? ourIssues.length : '?'} policy issue(s) on ${host}; ` +
      `${sites.length - ours.length} other site(s) counted, not named`);
    if (!ours.length) console.warn(`[adsense] ${host} is not among this account's sites. Add it in AdSense > Sites.`);
  }

  // The guard. Alert messages are free text written by Google about the whole
  // account, and can name another site. Re-read the finished payload rather
  // than trusting the filters above.
  const body = JSON.stringify(snapshot, null, 2) + '\n';
  const foreign = foreignHosts(body, host);
  const emails = body.match(EMAIL_RE) || [];
  console.log(`[adsense] leak guard: scanned ${body.length} bytes, ${foreign.length} foreign host(s), ${emails.length} address(es)`);
  if (foreign.length || emails.length) {
    throw new Error(`Refusing to write: the reading names ${foreign.length} other host(s) and ${emails.length} ` +
      'email address(es). This repository is public. Tighten the filter before running again.');
  }

  const outDir = process.env.ADSENSE_OUT_DIR || 'audience-snapshots';
  await fs.mkdir(outDir, { recursive: true });
  const file = path.join(outDir, `adsense-${new Date().toISOString().slice(0, 10)}.json`);
  await fs.writeFile(file, body, 'utf8');
  console.log(`[adsense] wrote ${file}`);
}

if (process.argv[1] && import.meta.url === new URL(`file://${process.argv[1]}`).href) {
  main().catch((e) => { console.error(`[adsense] ${e.message}`); process.exit(1); });
}
