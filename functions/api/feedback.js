// Statedoku, POST /api/feedback (18 November 2026, owner: "ils ont la
// possibilité de noter le jeu et laisser un commentaire ? Si non mets en place")
//
// js/feedback.js sends one row per rating: 1 to 5 stars on the daily game or
// a game page, and an optional comment. The same random id sent again updates
// the row (a star changed, a comment added), so one device leaves one rating
// per puzzle date or per game page.
//
// Anonymous: no IP, no account, no email field; the country comes from
// cf-ipcountry. The comment is free text, so it never leaves the admin side:
// /api/admin/feedback returns it to the key holder, /api/stats only counts.
// Bindings: STATS_DB (D1), the same database as /api/events.

import { rateLimit, getClientIp } from '../_shared/ratelimit.js';

const LANGS = ['en', 'fr', 'es'];
const OUTCOMES = ['won', 'lost'];
const MAX_BODY = 4096;
const MAX_COMMENT = 600;
// The three homepages and the game pages, nothing else.
const PAGE = /^\/(?:(?:fr|es)\/)?(?:play\/[a-z0-9-]{2,40}\/)?$/;
const ID = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/;

function _validDate(s) {
  if (typeof s !== 'string' || !/^\d{4}-\d{2}-\d{2}$/.test(s)) return false;
  const t = Date.parse(s + 'T00:00:00Z');
  if (Number.isNaN(t) || new Date(t).toISOString().slice(0, 10) !== s) return false;
  return s >= '2026-01-01' && t <= Date.now() + 2 * 86400000;
}

// Control characters out (newlines and tabs kept), at most two blank lines in
// a row, trimmed, capped. Empty means no comment.
function _comment(v) {
  if (typeof v !== 'string') return null;
  const s = v.replace(/[\u0000-\u0008\u000B\u000C\u000E-\u001F\u007F\u200B-\u200F\u2028-\u202E\u2066-\u2069]/g, '')
    .replace(/\r\n?/g, '\n').replace(/\n{3,}/g, '\n\n').trim().slice(0, MAX_COMMENT);
  return s || null;
}

const SCHEMA = [
  `CREATE TABLE IF NOT EXISTS feedback (
     id TEXT PRIMARY KEY,
     created_at INTEGER NOT NULL,
     updated_at INTEGER NOT NULL,
     page TEXT NOT NULL,
     puzzle_date TEXT,
     rating INTEGER NOT NULL,
     comment TEXT,
     lang TEXT,
     outcome TEXT,
     country TEXT)`,
  `CREATE INDEX IF NOT EXISTS idx_feedback_created ON feedback(created_at)`,
  `CREATE INDEX IF NOT EXISTS idx_feedback_page ON feedback(page)`,
];

export async function onRequestPost({ request, env }) {
  if (!env.STATS_DB) return new Response('Service unavailable', { status: 503 });

  // Only the site's own pages may write (same rule as /api/events), and only
  // as JSON, which forces a CORS preflight on any cross-site attempt.
  const origin = request.headers.get('origin');
  if ((origin && !/^https:\/\/(www\.)?statedoku\.com$/.test(origin)) || request.headers.get('sec-fetch-site') === 'cross-site') {
    return new Response(null, { status: 403 });
  }
  if (!/^application\/json\b/i.test(request.headers.get('content-type') || '')) {
    return new Response('Unsupported media type', { status: 415 });
  }
  const rl = rateLimit('feedback:' + getClientIp(request), 20, 60_000);
  if (!rl.ok) return new Response(null, { status: 429 });

  if (Number(request.headers.get('content-length') || 0) > MAX_BODY) {
    return new Response('Payload too large', { status: 413 });
  }
  let b;
  try {
    const text = await request.text();
    if (text.length > MAX_BODY) return new Response('Payload too large', { status: 413 });
    b = JSON.parse(text);
  } catch {
    return new Response('Invalid JSON', { status: 400 });
  }
  if (!b || typeof b !== 'object') return new Response('Invalid body', { status: 400 });
  if (typeof b.id !== 'string' || !ID.test(b.id)) return new Response('Invalid id', { status: 400 });
  if (!Number.isInteger(b.rating) || b.rating < 1 || b.rating > 5) return new Response('Invalid rating', { status: 400 });
  if (typeof b.page !== 'string' || !PAGE.test(b.page)) return new Response('Invalid page', { status: 400 });

  const now = Date.now();
  const date = _validDate(b.puzzle_date) ? b.puzzle_date : null;
  const l = String(b.lang || 'en').toLowerCase().slice(0, 2);
  const lang = LANGS.includes(l) ? l : 'en';
  const outcome = OUTCOMES.includes(b.outcome) ? b.outcome : null;
  const comment = _comment(b.comment);
  const country = (request.headers.get('cf-ipcountry') || '').slice(0, 2) || null;

  // A new id inserts; a known id updates its stars, and its comment only when
  // a new one comes (a star change alone never erases what was written).
  const upsert = () => env.STATS_DB.prepare(
    `INSERT INTO feedback (id, created_at, updated_at, page, puzzle_date, rating, comment, lang, outcome, country)
     VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
     ON CONFLICT(id) DO UPDATE SET
       updated_at = excluded.updated_at,
       rating = excluded.rating,
       comment = COALESCE(excluded.comment, feedback.comment),
       outcome = COALESCE(excluded.outcome, feedback.outcome)`
  ).bind(b.id, now, now, b.page, date, b.rating, comment, lang, outcome, country).run();

  try {
    await upsert();
  } catch (e) {
    // First rating ever: the table does not exist yet.
    if (!/no such table/i.test(String(e && e.message))) return new Response('Internal error', { status: 500 });
    try {
      for (const sql of SCHEMA) await env.STATS_DB.prepare(sql).run();
      await upsert();
    } catch (e2) {
      return new Response('Internal error', { status: 500 });
    }
  }
  return new Response(null, { status: 204 });
}

// Health check for scripts/verify-production.mjs.
export async function onRequestGet() {
  return new Response('ok', { status: 200, headers: { 'cache-control': 'no-store' } });
}
