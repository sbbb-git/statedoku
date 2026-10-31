// Statedoku, POST /api/events
// Receives game events from the client (puzzle_start, puzzle_first_move,
// puzzle_solve, puzzle_lost).
// Anonymous, no IP stored, only the cf-ipcountry header (country-level).
// Bindings required (set in Cloudflare Pages → Settings → Functions):
// - STATS_DB (D1 database)

import { rateLimit, getClientIp } from '../_shared/ratelimit.js';

// The names js/game.js sends through js/analytics.js. This list is the only
// gate: the table used to carry its own CHECK on three names, so from 24 to
// 31 October 2026 every puzzle_first_move failed on it with a 500 and D1
// counted none. _dropEventTypeCheck removes that CHECK once.
const ALLOWED_EVENTS = ['puzzle_start', 'puzzle_first_move', 'puzzle_solve', 'puzzle_lost'];
const LANGS = ['en', 'fr', 'es'];
// Coarse classes only (js/analytics.js), never a URL: where the visit came
// from and the streak band at the end of a grid (29 October 2026).
const SOURCES = ['direct', 'search', 'ai', 'social', 'share', 'classroom', 'directory', 'guide', 'site', 'archive', 'pwa', 'other'];
const STREAKS = ['0', '1', '2-3', '4-7', '8-30', '31+', 'archive'];
const MAX_BODY = 1024;            // a real payload is about 120 bytes
const MAX_SECONDS = 7 * 86400;    // a tab left open for a week, no more
const MAX_MISTAKES = 10;          // the game stops at 5

// A real calendar date between the first archive day and tomorrow (UTC), so
// a time zone ahead of UTC still counts and nothing else pads the table.
function _validDate(s) {
  if (typeof s !== 'string' || !/^\d{4}-\d{2}-\d{2}$/.test(s)) return false;
  const t = Date.parse(s + 'T00:00:00Z');
  if (Number.isNaN(t) || new Date(t).toISOString().slice(0, 10) !== s) return false;
  return s >= '2026-01-01' && t <= Date.now() + 2 * 86400000;
}

function _int(v, max) {
  return Number.isInteger(v) && v >= 0 && v <= max ? v : null;
}

// SQLite cannot alter a CHECK, so the table is rebuilt without it, rows and
// ids kept, in one D1 batch, which is a transaction: it lands whole or not at
// all. Runs only while sqlite_master still shows the CHECK.
async function _dropEventTypeCheck(db) {
  const row = await db.prepare(`SELECT sql FROM sqlite_master WHERE type='table' AND name='events'`).first();
  if (!row || !/CHECK\s*\(\s*event_type/i.test(row.sql || '')) return;
  for (const col of ['src', 'streak']) {
    await db.prepare(`ALTER TABLE events ADD COLUMN ${col} TEXT`).run().catch(() => {});
  }
  const cols = 'id, event_type, puzzle_date, timestamp, country, lang, time_seconds, mistakes, src, streak';
  await db.batch([
    db.prepare(`DROP TABLE IF EXISTS events_rebuild`),
    db.prepare(`CREATE TABLE events_rebuild (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      event_type TEXT NOT NULL,
      puzzle_date TEXT NOT NULL,
      timestamp INTEGER NOT NULL,
      country TEXT, lang TEXT, time_seconds INTEGER, mistakes INTEGER, src TEXT, streak TEXT)`),
    db.prepare(`INSERT INTO events_rebuild (${cols}) SELECT ${cols} FROM events`),
    db.prepare(`DROP TABLE events`),
    db.prepare(`ALTER TABLE events_rebuild RENAME TO events`),
    db.prepare(`CREATE INDEX IF NOT EXISTS idx_events_date ON events(puzzle_date)`),
    db.prepare(`CREATE INDEX IF NOT EXISTS idx_events_type ON events(event_type)`),
    db.prepare(`CREATE INDEX IF NOT EXISTS idx_events_ts ON events(timestamp)`),
  ]);
}

export async function onRequestPost({ request, env }) {
  if (!env.STATS_DB) {
    return new Response('Service unavailable', { status: 503 });
  }

  // Rate limit: 60 events per IP per minute (generous, covers a normal day of play)
  const ip = getClientIp(request);
  const rl = rateLimit('events:' + ip, 60, 60_000);
  if (!rl.ok) {
    return new Response(null, { status: 429 });
  }

  if (Number(request.headers.get('content-length') || 0) > MAX_BODY) {
    return new Response('Payload too large', { status: 413 });
  }
  let body;
  try {
    const text = await request.text();
    if (text.length > MAX_BODY) return new Response('Payload too large', { status: 413 });
    body = JSON.parse(text);
  } catch {
    return new Response('Invalid JSON', { status: 400 });
  }

  if (!body || typeof body !== 'object' || !ALLOWED_EVENTS.includes(body.event_type)) {
    return new Response('Invalid event_type', { status: 400 });
  }
  if (!_validDate(body.puzzle_date)) {
    return new Response('Invalid puzzle_date', { status: 400 });
  }

  const country = (request.headers.get('cf-ipcountry') || '').slice(0, 2) || null;
  // <html lang> on the site is en, fr or es; anything else is not ours.
  const l = String(body.lang || 'en').toLowerCase().slice(0, 2);
  const lang = LANGS.includes(l) ? l : 'en';
  const timeSec = _int(body.time_seconds, MAX_SECONDS);
  const mistakes = _int(body.mistakes, MAX_MISTAKES);
  const src = SOURCES.includes(body.src) ? body.src : null;
  const streak = STREAKS.includes(body.streak) ? body.streak : null;

  const insert = () => env.STATS_DB.prepare(
    `INSERT INTO events (event_type, puzzle_date, timestamp, country, lang, time_seconds, mistakes, src, streak)
     VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?)`
  ).bind(body.event_type, body.puzzle_date, Date.now(), country, lang, timeSec, mistakes, src, streak).run();
  // A table older than the code may need repairing first: the src and streak
  // columns arrived on 29 October 2026, and the CHECK on event_type is
  // dropped once (see _dropEventTypeCheck). Each repair is tried at most
  // once, then the insert runs again.
  const repaired = new Set();
  for (;;) {
    try {
      await insert();
      break;
    } catch (e) {
      const msg = String(e && e.message);
      const fix = /CHECK constraint/i.test(msg) ? 'check'
        : /no column named|no such column/i.test(msg) ? 'columns' : null;
      if (!fix || repaired.has(fix)) return new Response('Internal error', { status: 500 });
      repaired.add(fix);
      try {
        if (fix === 'check') {
          await _dropEventTypeCheck(env.STATS_DB);
        } else {
          for (const col of ['src', 'streak']) {
            await env.STATS_DB.prepare(`ALTER TABLE events ADD COLUMN ${col} TEXT`).run().catch(() => {});
          }
        }
      } catch (e2) {
        return new Response('Internal error', { status: 500 });
      }
    }
  }

  return new Response(null, { status: 204 });
}

// Optional GET for health check
export async function onRequestGet() {
  return new Response('ok', { status: 200 });
}
