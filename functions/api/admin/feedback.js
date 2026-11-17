// GET /api/admin/feedback with header X-Admin-Key (ADMIN_API_KEY or
// STATS_ADMIN_KEY): the players' ratings and comments, newest first, for
// admin/dashboard/. Comments are free text written by visitors: the dashboard
// renders them as text, never as markup, and they never go into the public
// repo (/api/stats, which the audience collector reads, only counts them).
import { keyMatches, adminKey } from '../../_shared/auth.js';
import { rateLimit, getClientIp } from '../../_shared/ratelimit.js';

const json = (o, status = 200) => new Response(JSON.stringify(o), {
  status, headers: { 'content-type': 'application/json', 'cache-control': 'no-store' },
});

export async function onRequestGet({ request, env }) {
  const rl = rateLimit('admin:' + getClientIp(request), 30, 60_000);
  if (!rl.ok) return new Response(null, { status: 429 });
  const k = adminKey(request);
  if (!keyMatches(k, env.ADMIN_API_KEY) && !keyMatches(k, env.STATS_ADMIN_KEY)) {
    return new Response('Forbidden', { status: 403 });
  }
  if (!env.STATS_DB) return new Response('Service unavailable', { status: 503 });
  try {
    const db = env.STATS_DB;
    const summary = await db.prepare(
      `SELECT COUNT(*) AS ratings, ROUND(AVG(rating), 2) AS average,
              SUM(CASE WHEN comment IS NOT NULL THEN 1 ELSE 0 END) AS comments
         FROM feedback`).first();
    const dist = (await db.prepare(
      `SELECT rating, COUNT(*) AS n FROM feedback GROUP BY rating ORDER BY rating DESC`).all()).results;
    const byPage = (await db.prepare(
      `SELECT page, COUNT(*) AS n, ROUND(AVG(rating), 2) AS average FROM feedback
        GROUP BY page ORDER BY n DESC LIMIT 80`).all()).results;
    const reviews = (await db.prepare(
      `SELECT created_at, updated_at, page, puzzle_date, rating, comment, lang, outcome, country
         FROM feedback ORDER BY (comment IS NULL), updated_at DESC LIMIT 500`).all()).results;
    return json({ summary, dist, by_page: byPage, reviews });
  } catch (e) {
    // No rating yet: the table is created by the first one.
    if (/no such table/i.test(String(e && e.message))) {
      return json({ summary: { ratings: 0, average: null, comments: 0 }, dist: [], by_page: [], reviews: [] });
    }
    return new Response('Internal error', { status: 500 });
  }
}
