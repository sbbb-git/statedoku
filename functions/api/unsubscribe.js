// GET  /api/unsubscribe?token=...  shows a button (mail scanners only GET links)
// POST /api/unsubscribe            token in the form body; deletes the address
//
// Unsubscribing erases the row, as the privacy policy promises, instead of
// keeping the address with a flag.
import { page, T, HOME, validToken } from '../_shared/page.js';

async function _row(env, token) {
  return env.STATS_DB.prepare('SELECT lang FROM email_subscribers WHERE token = ?').bind(token).first();
}

export async function onRequestGet({ request, env }) {
  const token = new URL(request.url).searchParams.get('token');
  if (!env.STATS_DB || !validToken(token)) return page('Statedoku', `<p>${T.en.bad}</p>`, 400);
  const row = await _row(env, token).catch(() => null);
  const t = T[row?.lang] || T.en;
  if (!row) return page('Statedoku', `<p>${t.bad}</p>`, 404);
  return page(t.uTitle, `<h1 style="font-size:1.3rem">${t.uTitle}</h1><p>${t.uText}</p>
<form method="post" action="/api/unsubscribe"><input type="hidden" name="token" value="${token}">
<button type="submit" style="background:#DC2626;color:#fff;border:0;border-radius:999px;padding:12px 24px;font-weight:700;font-size:1rem;cursor:pointer">${t.uBtn}</button></form>`);
}

export async function onRequestPost({ request, env }) {
  let token = null;
  const ct = (request.headers.get('content-type') || '').toLowerCase();
  try {
    // Form posts from the page above, and RFC 8058 one-click posts from mail
    // clients (List-Unsubscribe-Post), which carry the token in the URL.
    token = new URL(request.url).searchParams.get('token');
    if (!token && (ct.includes('form') || ct.includes('multipart'))) token = (await request.formData()).get('token');
  } catch {}
  if (!env.STATS_DB || !validToken(token)) return page('Statedoku', `<p>${T.en.bad}</p>`, 400);
  const row = await _row(env, token).catch(() => null);
  const t = T[row?.lang] || T.en;
  if (!row) return page('Statedoku', `<p>${t.bad}</p>`, 404);
  try {
    await env.STATS_DB.prepare('DELETE FROM email_subscribers WHERE token = ?').bind(token).run();
  } catch {
    return page('Statedoku', `<p>${t.bad}</p>`, 500);
  }
  const home = HOME[row.lang] || '/';
  return page(t.uTitle, `<h1 style="font-size:1.3rem">${t.uTitle}</h1><p>${t.uDone}</p><p><a href="${home}" style="color:#0F2147;font-weight:700">${t.home}</a></p>`);
}
