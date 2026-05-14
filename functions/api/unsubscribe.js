// GET /api/unsubscribe?token=...
// Marks the subscriber as inactive. Returns a tiny HTML confirmation.

export async function onRequestGet({ request, env }) {
  if (!env.STATS_DB) return _html('Database not configured', 500);

  const url = new URL(request.url);
  const token = url.searchParams.get('token');
  if (!token) return _html('Missing token', 400);

  try {
    const r = await env.STATS_DB
      .prepare('UPDATE email_subscribers SET active = 0 WHERE token = ?')
      .bind(token).run();
    if (r.meta && r.meta.changes === 0) return _html('Already unsubscribed or invalid link.', 404);
  } catch (e) {
    return _html('DB error: ' + e.message, 500);
  }

  return _html(`
    <div style="text-align:center;padding:60px 24px;font-family:system-ui,sans-serif;color:#0F2147">
      <h1 style="font-size:1.4rem;font-weight:900;margin-bottom:8px">You're unsubscribed.</h1>
      <p style="color:#525252;font-size:.95rem">No more daily emails from Statedoku.</p>
      <p style="margin-top:24px"><a href="/" style="color:#0F2147;font-weight:700">← Back to today's puzzle</a></p>
    </div>
  `);
}

function _html(body, status = 200) {
  return new Response(`<!doctype html><html><body>${body}</body></html>`, {
    status,
    headers: { 'content-type': 'text/html; charset=utf-8' },
  });
}
