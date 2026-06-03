// GET /api/admin/email-clicks
//   Returns the full email_clicks log (most recent first).
//   Auth: requires header `X-Admin-Key: <env.ADMIN_API_KEY>`.

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
  if (supplied.length !== env.ADMIN_API_KEY.length) return false;
  let diff = 0;
  for (let i = 0; i < supplied.length; i++) diff |= supplied.charCodeAt(i) ^ env.ADMIN_API_KEY.charCodeAt(i);
  return diff === 0;
}

export async function onRequestGet({ request, env }) {
  if (!_checkAuth(request, env)) return _unauthorized();
  if (!env.STATS_DB) return new Response(JSON.stringify({ ok: false, error: 'db_not_configured' }), { status: 500, headers: JSON_HEADERS });

  const url = new URL(request.url);
  const email = url.searchParams.get('email');
  const limit = Math.min(parseInt(url.searchParams.get('limit') || '200', 10), 5000);

  try {
    let stmt;
    if (email) {
      stmt = env.STATS_DB.prepare(`
        SELECT email, clicked_at, date, country, ref_lang, dest, user_agent
        FROM email_clicks WHERE email = ? ORDER BY clicked_at DESC LIMIT ?
      `).bind(email, limit);
    } else {
      stmt = env.STATS_DB.prepare(`
        SELECT email, clicked_at, date, country, ref_lang, dest, user_agent
        FROM email_clicks ORDER BY clicked_at DESC LIMIT ?
      `).bind(limit);
    }
    const rs = await stmt.all();
    const rows = rs.results || [];

    // Aggregates
    const agg = await env.STATS_DB.prepare(`
      SELECT COUNT(*) AS total, COUNT(DISTINCT email) AS unique_emails, COUNT(DISTINCT date) AS distinct_days
      FROM email_clicks ${email ? 'WHERE email = ?' : ''}
    `).bind(...(email ? [email] : [])).first();

    return new Response(JSON.stringify({
      ok: true,
      stats: {
        total_clicks: agg?.total || 0,
        unique_emails: agg?.unique_emails || 0,
        distinct_days: agg?.distinct_days || 0,
      },
      clicks: rows,
    }, null, 2), { headers: JSON_HEADERS });
  } catch (e) {
    return new Response(JSON.stringify({ ok: false, error: e.message }), { status: 500, headers: JSON_HEADERS });
  }
}
