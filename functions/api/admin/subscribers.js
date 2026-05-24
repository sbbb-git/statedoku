// GET /api/admin/subscribers
//   Returns the full email_subscribers table for admin display.
//   Auth: requires header `X-Admin-Key: <env.ADMIN_API_KEY>`.
//
// DELETE /api/admin/subscribers?email=<email>
//   Soft-deactivates a subscriber (sets active=0). Used by the admin UI.
//
// Set the secret with:
//   wrangler pages secret put ADMIN_API_KEY --project-name statedoku
// then paste a long random string at the prompt. Use the same string from
// the admin page when prompted.

const JSON_HEADERS = { 'content-type': 'application/json', 'cache-control': 'no-store' };

function _unauthorized() {
  return new Response(JSON.stringify({ ok: false, error: 'unauthorized' }), {
    status: 401,
    headers: JSON_HEADERS,
  });
}

function _checkAuth(request, env) {
  if (!env.ADMIN_API_KEY) return false;
  const supplied = request.headers.get('X-Admin-Key') || '';
  if (!supplied) return false;
  // Constant-time comparison
  if (supplied.length !== env.ADMIN_API_KEY.length) return false;
  let diff = 0;
  for (let i = 0; i < supplied.length; i++) diff |= supplied.charCodeAt(i) ^ env.ADMIN_API_KEY.charCodeAt(i);
  return diff === 0;
}

export async function onRequestGet({ request, env }) {
  if (!_checkAuth(request, env)) return _unauthorized();
  if (!env.STATS_DB) return new Response(JSON.stringify({ ok: false, error: 'db_not_configured' }), { status: 500, headers: JSON_HEADERS });

  const url = new URL(request.url);
  const limit = Math.min(parseInt(url.searchParams.get('limit') || '500', 10), 5000);

  try {
    const stmt = env.STATS_DB.prepare(`
      SELECT email, hour_utc, lang, country, subscribed_at, last_sent_date, active
      FROM email_subscribers
      ORDER BY subscribed_at DESC
      LIMIT ?
    `).bind(limit);
    const rs = await stmt.all();
    const rows = rs.results || [];

    // Aggregate counts in the same response to save a roundtrip
    const aggStmt = env.STATS_DB.prepare(`
      SELECT
        COUNT(*) AS total,
        SUM(CASE WHEN active = 1 THEN 1 ELSE 0 END) AS active_n,
        SUM(CASE WHEN active = 0 THEN 1 ELSE 0 END) AS inactive_n,
        COUNT(DISTINCT lang) AS langs_n,
        COUNT(DISTINCT country) AS countries_n
      FROM email_subscribers
    `);
    const agg = (await aggStmt.first()) || {};

    // Per-lang and per-hour breakdowns
    const byLang = (await env.STATS_DB.prepare(
      `SELECT lang, COUNT(*) AS n FROM email_subscribers WHERE active = 1 GROUP BY lang ORDER BY n DESC`
    ).all()).results || [];
    const byHour = (await env.STATS_DB.prepare(
      `SELECT hour_utc, COUNT(*) AS n FROM email_subscribers WHERE active = 1 GROUP BY hour_utc ORDER BY hour_utc`
    ).all()).results || [];
    const byCountry = (await env.STATS_DB.prepare(
      `SELECT country, COUNT(*) AS n FROM email_subscribers WHERE active = 1 AND country IS NOT NULL GROUP BY country ORDER BY n DESC LIMIT 20`
    ).all()).results || [];

    return new Response(JSON.stringify({
      ok: true,
      subscribers: rows,
      summary: {
        total: agg.total || 0,
        active: agg.active_n || 0,
        inactive: agg.inactive_n || 0,
        langs: agg.langs_n || 0,
        countries: agg.countries_n || 0,
      },
      breakdowns: { byLang, byHour, byCountry },
      generated_at: new Date().toISOString(),
    }), { headers: JSON_HEADERS });
  } catch (e) {
    return new Response(JSON.stringify({ ok: false, error: 'query_failed', detail: e.message }), {
      status: 500,
      headers: JSON_HEADERS,
    });
  }
}

export async function onRequestDelete({ request, env }) {
  if (!_checkAuth(request, env)) return _unauthorized();
  if (!env.STATS_DB) return new Response(JSON.stringify({ ok: false, error: 'db_not_configured' }), { status: 500, headers: JSON_HEADERS });

  const url = new URL(request.url);
  const email = (url.searchParams.get('email') || '').toLowerCase().trim();
  if (!email) return new Response(JSON.stringify({ ok: false, error: 'missing_email' }), { status: 400, headers: JSON_HEADERS });

  try {
    const res = await env.STATS_DB.prepare(
      `UPDATE email_subscribers SET active = 0 WHERE email = ?`
    ).bind(email).run();
    return new Response(JSON.stringify({ ok: true, updated: res.meta?.changes || 0 }), { headers: JSON_HEADERS });
  } catch (e) {
    return new Response(JSON.stringify({ ok: false, error: 'update_failed', detail: e.message }), {
      status: 500,
      headers: JSON_HEADERS,
    });
  }
}
