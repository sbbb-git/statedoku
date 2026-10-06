// GET  /api/confirm?token=...  shows a button (mail scanners only GET links)
// POST /api/confirm            token in the form body; activates the address
import { page, T, HOME, validToken } from '../_shared/page.js';

async function _row(env, token) {
  return env.STATS_DB.prepare('SELECT lang, active FROM email_subscribers WHERE token = ?').bind(token).first();
}

export async function onRequestGet({ request, env }) {
  const token = new URL(request.url).searchParams.get('token');
  if (!env.STATS_DB || !validToken(token)) return page('Statedoku', `<p>${T.en.bad}</p>`, 400);
  const row = await _row(env, token).catch(() => null);
  const t = T[row?.lang] || T.en;
  if (!row) return page('Statedoku', `<p>${t.bad}</p>`, 404);
  const home = HOME[row.lang] || '/';
  if (row.active === 1) return page(t.cTitle, `<p>${t.cDone}</p><p><a href="${home}" style="color:#0F2147;font-weight:700">${t.home}</a></p>`);
  return page(t.cTitle, `<h1 style="font-size:1.3rem">${t.cTitle}</h1><p>${t.cText}</p>
<form method="post" action="/api/confirm"><input type="hidden" name="token" value="${token}">
<button type="submit" style="background:#0F2147;color:#fff;border:0;border-radius:999px;padding:12px 24px;font-weight:700;font-size:1rem;cursor:pointer">${t.cBtn}</button></form>`);
}

export async function onRequestPost({ request, env }) {
  let token = null;
  try { token = (await request.formData()).get('token'); } catch {}
  if (!env.STATS_DB || !validToken(token)) return page('Statedoku', `<p>${T.en.bad}</p>`, 400);
  const row = await _row(env, token).catch(() => null);
  const t = T[row?.lang] || T.en;
  if (!row) return page('Statedoku', `<p>${t.bad}</p>`, 404);
  try {
    await env.STATS_DB.prepare('UPDATE email_subscribers SET active = 1 WHERE token = ?').bind(token).run();
  } catch {
    return page('Statedoku', `<p>${t.bad}</p>`, 500);
  }
  const home = HOME[row.lang] || '/';
  return page(t.cTitle, `<h1 style="font-size:1.3rem">${t.cTitle}</h1><p>${t.cDone}</p><p><a href="${home}" style="color:#0F2147;font-weight:700">${t.home}</a></p>`);
}
