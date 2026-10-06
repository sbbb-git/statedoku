// GET /api/track/email-click?u=<base64-email>&d=<base64-dest>&l=<lang>
//
// Records a click from an email and 302-redirects to the destination URL.
// Recording is opt-in per address: env.CLICK_TRACK_EMAILS holds a comma
// separated allow-list, kept out of this public repo. Unset or empty, no click
// is recorded and the link simply redirects.
//
// Storage: D1 table `email_clicks`.
// Privacy: stores email, user_agent, country, ref_lang, dest, timestamp.


function _b64decode(s) {
  try { return atob(s.replace(/-/g, '+').replace(/_/g, '/')); }
  catch { return null; }
}

function _todayIso() {
  const d = new Date();
  return `${d.getUTCFullYear()}-${String(d.getUTCMonth()+1).padStart(2,'0')}-${String(d.getUTCDate()).padStart(2,'0')}`;
}

// Safe-list of destination origins we allow redirecting to. Prevents this
// endpoint from being used as an open redirect.
function _isAllowedDest(dest) {
  try {
    const u = new URL(dest);
    return u.protocol === 'https:' && u.hostname === 'statedoku.com';
  } catch { return false; }
}

export async function onRequestGet({ request, env }) {
  const url = new URL(request.url);
  const u = url.searchParams.get('u') || '';
  const d = url.searchParams.get('d') || '';
  const lang = url.searchParams.get('l') || 'en';

  const email = _b64decode(u);
  const dest = _b64decode(d) || 'https://statedoku.com/';

  // Always redirect — even if the recording fails. UX > telemetry.
  const fallbackRedirect = _isAllowedDest(dest)
    ? dest
    : 'https://statedoku.com/';

  if (!email || !_isAllowedDest(dest)) {
    return Response.redirect(fallbackRedirect, 302);
  }

  // Skip recording unless this email is in scope (privacy + opt-in semantics)
  const scope = (env.CLICK_TRACK_EMAILS || '').split(',').map(x => x.trim().toLowerCase()).filter(Boolean);
  if (!scope.includes(email)) {
    return Response.redirect(fallbackRedirect, 302);
  }

  if (!env.STATS_DB) {
    return Response.redirect(fallbackRedirect, 302);
  }

  try {
    const ua = request.headers.get('user-agent') || '';
    const cf = request.cf || {};
    const country = cf.country || '';
    await env.STATS_DB
      .prepare(`INSERT INTO email_clicks (email, clicked_at, date, user_agent, country, ref_lang, dest)
                VALUES (?, ?, ?, ?, ?, ?, ?)`)
      .bind(email, Date.now(), _todayIso(), ua.slice(0, 240), country, lang, dest)
      .run();
  } catch (e) {
    // swallow — never block the redirect
  }

  return Response.redirect(fallbackRedirect, 302);
}
