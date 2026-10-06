// Statedoku: GET /api/stats with header X-Admin-Key
// Returns aggregate analytics for the admin dashboard.
// Auth: header X-Admin-Key must equal env.STATS_ADMIN_KEY (constant-time).
// Bindings:
//   - STATS_DB (D1)
//   - STATS_ADMIN_KEY (env var)

import { keyMatches, adminKey } from '../_shared/auth.js';

export async function onRequestGet({ request, env }) {
  if (!keyMatches(adminKey(request), env.STATS_ADMIN_KEY)) {
    return new Response('Forbidden', { status: 403 });
  }
  if (!env.STATS_DB) return new Response('Service unavailable', { status: 503 });

  const since = Date.now() - 30 * 86400000;
  const all = {};

  // Total events
  const totals = await env.STATS_DB.prepare(
    `SELECT event_type, COUNT(*) as n FROM events GROUP BY event_type`
  ).all();
  all.totals = totals.results;

  // Daily breakdown (last 30 days)
  const daily = await env.STATS_DB.prepare(
    `SELECT puzzle_date,
            SUM(CASE WHEN event_type='puzzle_start' THEN 1 ELSE 0 END) AS starts,
            SUM(CASE WHEN event_type='puzzle_solve' THEN 1 ELSE 0 END) AS solves,
            SUM(CASE WHEN event_type='puzzle_lost'  THEN 1 ELSE 0 END) AS losses,
            ROUND(AVG(CASE WHEN event_type='puzzle_solve' THEN time_seconds END)) AS avg_solve_sec
       FROM events
       WHERE timestamp > ?
       GROUP BY puzzle_date
       ORDER BY puzzle_date DESC
       LIMIT 30`
  ).bind(since).all();
  all.daily = daily.results;

  // Top countries
  const countries = await env.STATS_DB.prepare(
    `SELECT country, COUNT(*) AS n
       FROM events
       WHERE country IS NOT NULL AND timestamp > ?
       GROUP BY country
       ORDER BY n DESC
       LIMIT 25`
  ).bind(since).all();
  all.countries = countries.results;

  // Top languages
  const langs = await env.STATS_DB.prepare(
    `SELECT lang, COUNT(*) AS n
       FROM events
       WHERE timestamp > ?
       GROUP BY lang
       ORDER BY n DESC`
  ).bind(since).all();
  all.langs = langs.results;

  // Mistakes distribution on solves
  const mistakes = await env.STATS_DB.prepare(
    `SELECT mistakes, COUNT(*) AS n
       FROM events
       WHERE event_type='puzzle_solve' AND mistakes IS NOT NULL AND timestamp > ?
       GROUP BY mistakes
       ORDER BY mistakes`
  ).bind(since).all();
  all.mistakes_dist = mistakes.results;

  // Total unique puzzles played
  const uniq = await env.STATS_DB.prepare(
    `SELECT COUNT(DISTINCT puzzle_date) AS n FROM events WHERE timestamp > ?`
  ).bind(since).first();
  all.unique_puzzles_30d = uniq.n;

  return new Response(JSON.stringify(all, null, 2), {
    headers: {
      'content-type': 'application/json',
      'cache-control': 'no-store'
    }
  });
}
