// Statedoku, POST /api/events
// Receives game events from the client (puzzle_start, puzzle_solve, puzzle_lost).
// Anonymous, no IP stored, only the cf-ipcountry header (country-level).
// Bindings required (set in Cloudflare Pages → Settings → Functions):
// - STATS_DB (D1 database)

import { rateLimit, getClientIp } from '../_shared/ratelimit.js';

// The three names js/game.js sends through js/analytics.js, and the only
// three the events table accepts (CHECK constraint in bot/d1-schema.sql).
const ALLOWED_EVENTS = ['puzzle_start', 'puzzle_first_move', 'puzzle_solve', 'puzzle_lost'];
const LANGS = ['en', 'fr', 'es'];
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

  try {
    await env.STATS_DB.prepare(
      `INSERT INTO events (event_type, puzzle_date, timestamp, country, lang, time_seconds, mistakes)
       VALUES (?, ?, ?, ?, ?, ?, ?)`
    ).bind(body.event_type, body.puzzle_date, Date.now(), country, lang, timeSec, mistakes).run();
  } catch (e) {
    return new Response('Internal error', { status: 500 });
  }

  return new Response(null, { status: 204 });
}

// Optional GET for health check
export async function onRequestGet() {
  return new Response('ok', { status: 200 });
}
