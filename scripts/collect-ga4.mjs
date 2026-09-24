#!/usr/bin/env node
/**
 * Weekly reading from Google Analytics 4: how many people, and where from.
 *
 * The other collectors each answer a narrower question. Search Console and Bing
 * report arrivals from one engine. The D1 reading counts games, and its events
 * table holds no visitor id, so a player who comes back every day counts thirty
 * times in a month. Neither can say how many people. This one can.
 *
 * It reuses the Search Console service account rather than adding a second
 * credential: the same key signs a JWT for any scope it has been granted. What
 * has to be done once, by hand, is enabling the Analytics Data API on that
 * Cloud project and adding the account's client_email as a Viewer on the GA4
 * property. The permission comes from Analytics, not from the Cloud project,
 * which is the step people miss, exactly as with Search Console.
 *
 * Env:
 *   GA4_PROPERTY_ID   the numeric property id, not the G-XXXX measurement id
 *   GSC_SERVICE_ACCOUNT_JSON (or one of the other names readKey accepts)
 *   GA4_OUT_DIR       where to write (default audience-snapshots/)
 */
import fs from 'node:fs/promises';
import path from 'node:path';
import { readKey, accessToken, fetchRetry } from './_gsc-auth.mjs';

const SCOPE = 'https://www.googleapis.com/auth/analytics.readonly';
const API = 'https://analyticsdata.googleapis.com/v1beta';
// GA4 processing lags; asking up to today returns a part-day that reads as a
// collapse when compared week on week.
const WINDOW = { startDate: '28daysAgo', endDate: 'yesterday' };

/** One runReport call, flattened into plain rows. */
async function report(propertyId, token, dimensions, metrics, { limit = 200, orderByMetric } = {}) {
  const body = {
    dateRanges: [WINDOW],
    dimensions: dimensions.map((name) => ({ name })),
    metrics: metrics.map((name) => ({ name })),
    limit,
  };
  if (orderByMetric) body.orderBys = [{ metric: { metricName: orderByMetric }, desc: true }];

  const res = await fetchRetry(`${API}/properties/${propertyId}:runReport`, {
    method: 'POST',
    headers: { authorization: `Bearer ${token}`, 'content-type': 'application/json' },
    body: JSON.stringify(body),
  });
  const text = await res.text();

  if (res.status === 403) {
    throw new Error('Analytics refused the service account (403). Two different things cause ' +
      'this and the message does not distinguish them: the Google Analytics Data API is not ' +
      'enabled on the Cloud project, or the account is not a Viewer on the property. ' +
      `Add its client_email under Analytics > Admin > Property access management. Body: ${text.slice(0, 200)}`);
  }
  if (res.status === 404) {
    throw new Error(`Property ${propertyId} not found. GA4_PROPERTY_ID must be the numeric id ` +
      'from Analytics > Admin > Property settings, not the G-XXXXXXX measurement id in the page.');
  }
  if (!res.ok) throw new Error(`runReport ${dimensions.join('+')} -> ${res.status}: ${text.slice(0, 250)}`);

  let json;
  try { json = JSON.parse(text); }
  catch { throw new Error(`runReport returned something that is not JSON: ${text.slice(0, 160)}`); }

  const dims = (json.dimensionHeaders || []).map((h) => h.name);
  const mets = (json.metricHeaders || []).map((h) => h.name);
  const rows = (json.rows || []).map((r) => {
    const o = {};
    dims.forEach((d, i) => { o[d] = r.dimensionValues?.[i]?.value ?? null; });
    mets.forEach((m, i) => {
      const v = r.metricValues?.[i]?.value;
      const n = Number(v);
      o[m] = Number.isFinite(n) ? n : v ?? null;
    });
    return o;
  });
  return { rows, rowCount: json.rowCount ?? rows.length };
}

async function main() {
  const propertyId = (process.env.GA4_PROPERTY_ID || '').trim();
  if (!propertyId) {
    console.warn('[ga4] skipped: GA4_PROPERTY_ID is not set');
    return;
  }
  if (!/^\d+$/.test(propertyId)) {
    throw new Error(`GA4_PROPERTY_ID is "${propertyId}". It must be the numeric property id, ` +
      'not the G-XXXXXXX measurement id that appears in the page source.');
  }

  // readKey returns an envelope, { key, found } or { skip }, not the key itself.
  // The first version of this file passed the envelope to accessToken and died
  // on "No key provided to sign" in production, which no absent-secret test
  // could have caught.
  const { skip, key, found } = readKey();
  if (skip) { console.warn(`[ga4] skipped: ${skip}`); return; }
  console.log(`[ga4] service account key read from ${found}`);

  const token = await accessToken(key, SCOPE);

  const cuts = {
    // People and sessions over time. This is the "how many" the other readings cannot give.
    by_date: await report(propertyId, token, ['date'],
      ['activeUsers', 'newUsers', 'sessions', 'screenPageViews', 'userEngagementDuration'], { limit: 40 }),
    // Where they actually come from. Direct, Bing, Google, social, referral.
    by_source: await report(propertyId, token, ['sessionSource', 'sessionMedium'],
      ['activeUsers', 'sessions', 'engagedSessions'], { limit: 60, orderByMetric: 'sessions' }),
    // Which pages hold people, against which pages merely receive clicks.
    by_page: await report(propertyId, token, ['pagePath'],
      ['activeUsers', 'screenPageViews', 'userEngagementDuration', 'bounceRate'],
      { limit: 150, orderByMetric: 'screenPageViews' }),
    by_country: await report(propertyId, token, ['country'],
      ['activeUsers', 'sessions'], { limit: 40, orderByMetric: 'activeUsers' }),
    by_device: await report(propertyId, token, ['deviceCategory'],
      ['activeUsers', 'sessions', 'bounceRate'], { limit: 10 }),
    // Returning against new: whether the daily puzzle earns a habit at all.
    by_new_returning: await report(propertyId, token, ['newVsReturning'],
      ['activeUsers', 'sessions'], { limit: 10 }),
  };

  // Always say how much was actually read. A collector reporting success over
  // zero rows reads exactly like one that worked.
  const counts = Object.entries(cuts).map(([k, v]) => `${k}=${v.rows.length}`).join(' ');
  console.log(`[ga4] property ${propertyId}, window ${WINDOW.startDate} to ${WINDOW.endDate}`);
  console.log(`[ga4] rows per cut: ${counts}`);

  const totalRows = Object.values(cuts).reduce((a, v) => a + v.rows.length, 0);
  if (!totalRows) {
    throw new Error('Every cut came back empty. Either the property has no data in the window, ' +
      'or the wrong property id is set. Writing an empty reading would hide that.');
  }

  const users = cuts.by_date.rows.reduce((a, r) => a + (r.activeUsers || 0), 0);
  const sessions = cuts.by_date.rows.reduce((a, r) => a + (r.sessions || 0), 0);
  console.log(`[ga4] ${users} active users and ${sessions} sessions over the window`);

  const snapshot = {
    source: 'google-analytics-4',
    collected_at: new Date().toISOString(),
    property_id: propertyId,
    window: WINDOW,
    data: cuts,
  };

  const outDir = process.env.GA4_OUT_DIR || 'audience-snapshots';
  await fs.mkdir(outDir, { recursive: true });
  const file = path.join(outDir, `ga4-${new Date().toISOString().slice(0, 10)}.json`);
  await fs.writeFile(file, JSON.stringify(snapshot, null, 2) + '\n', 'utf8');
  console.log(`[ga4] wrote ${file}`);
}

main().catch((e) => { console.error(`[ga4] ${e.message}`); process.exit(1); });
