// POST /api/subscribe
// Body (application/json): { email, hour_utc, lang }
// Returns: { ok: true, pending: true } when a confirmation email was sent.
//
// Double opt-in: a new address is stored inactive and only starts receiving
// the puzzle once its owner clicks the link in the confirmation email
// (/api/confirm). An address that is already active is left alone, and one
// that unsubscribed is never switched back on without a new confirmation, so
// nobody can sign up a third party.
//
// Without a mail provider (RESEND_API_KEY unset) no address can be confirmed,
// so the endpoint refuses with 503 rather than storing anything: it used to
// switch a brand new address on directly, which let anyone subscribe anyone.
//
// One confirmation mail per address per COOLDOWN_MS. The per-IP limit below
// does not stop many IPs from mailing one inbox; this does, and the answer is
// the same either way, so it reveals nothing about the address.

import { rateLimit, getClientIp } from '../_shared/ratelimit.js';

const COOLDOWN_MS = 10 * 60_000;

function _rand(bytes = 24) {
  const a = new Uint8Array(bytes);
  crypto.getRandomValues(a);
  return Array.from(a, b => b.toString(16).padStart(2, '0')).join('');
}

// Plausible address only: letters, digits and the usual local-part symbols.
// No quotes, angle brackets or spaces, so the value is safe in HTML as well.
function _validEmail(e) {
  if (typeof e !== 'string' || e.length > 254) return false;
  return /^[a-z0-9.!#$%&*+\/=?^_`{|}~-]{1,64}@[a-z0-9](?:[a-z0-9-]{0,61}[a-z0-9])?(?:\.[a-z0-9](?:[a-z0-9-]{0,61}[a-z0-9])?)+$/.test(e);
}

function _esc(s) {
  return String(s).replace(/[&<>"']/g, c => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;' }[c]));
}

const CONFIRM = {
  en: { subject: 'Confirm your Statedoku daily puzzle email',
        p1: 'Someone, hopefully you, asked to receive the Statedoku daily puzzle at this address.',
        btn: 'Confirm my email', p2: 'If it was not you, ignore this message and nothing will be sent.' },
  fr: { subject: 'Confirmez votre inscription au puzzle quotidien Statedoku',
        p1: 'Quelqu’un, sans doute vous, a demandé à recevoir le puzzle quotidien Statedoku à cette adresse.',
        btn: 'Confirmer mon adresse', p2: 'Si ce n’est pas vous, ignorez ce message : rien ne vous sera envoyé.' },
  es: { subject: 'Confirma tu suscripción al puzzle diario de Statedoku',
        p1: 'Alguien, seguramente tú, pidió recibir el puzzle diario de Statedoku en esta dirección.',
        btn: 'Confirmar mi correo', p2: 'Si no fuiste tú, ignora este mensaje y no se enviará nada.' },
};

export async function onRequestPost({ request, env, waitUntil }) {
  if (!env.STATS_DB || !env.RESEND_API_KEY) return _bad('Service unavailable', 503);

  // A JSON content type forces a CORS preflight, so other sites cannot post
  // this form from a visitor's browser.
  if (!(request.headers.get('content-type') || '').toLowerCase().startsWith('application/json')) {
    return _bad('Unsupported content type', 415);
  }

  // Rate limit: 5 subscribe attempts per IP per 5 minutes
  const ip = getClientIp(request);
  const rl = rateLimit('subscribe:' + ip, 5, 5 * 60_000);
  if (!rl.ok) {
    return new Response(JSON.stringify({ ok: false, error: 'Too many attempts. Try again in a few minutes.' }), {
      status: 429,
      headers: {
        'content-type': 'application/json',
        'retry-after': Math.ceil((rl.resetAt - Date.now()) / 1000).toString(),
      },
    });
  }

  let body;
  try { body = await request.json(); } catch { return _bad('Invalid JSON'); }
  if (!body || typeof body !== 'object') return _bad('Invalid JSON');

  // Honeypot: if "website" field exists in payload, silently accept but drop
  if (body.website) return _pending();

  const email = (body.email || '').trim().toLowerCase();
  const hour = parseInt(body.hour_utc, 10);
  const lang = ['en','fr','es'].includes(body.lang) ? body.lang : 'en';
  const country = request.headers.get('cf-ipcountry') || null;

  if (!_validEmail(email))   return _bad('Invalid email');
  if (!(hour >= 0 && hour <= 23)) return _bad('Invalid hour (0-23 UTC)');

  const now = Date.now();
  let token, isNew = false;
  try {
    const existing = await env.STATS_DB
      .prepare('SELECT active, token, subscribed_at FROM email_subscribers WHERE email = ?')
      .bind(email).first();
    if (existing && existing.active === 1) {
      // Already subscribed: say nothing that would reveal it, change nothing.
      return _pending();
    }
    // A pending address had its confirmation mail less than COOLDOWN_MS ago:
    // same answer, no second mail. subscribed_at holds the time of the last
    // confirmation request for a row that is not active yet.
    if (existing && now - (Number(existing.subscribed_at) || 0) < COOLDOWN_MS) {
      return _pending();
    }
    isNew = !existing;
    token = existing ? existing.token : _rand(24);
    // The WHERE keeps an address that was confirmed in the meantime untouched.
    await env.STATS_DB
      .prepare(`INSERT INTO email_subscribers (email, hour_utc, lang, token, subscribed_at, active, country)
                VALUES (?, ?, ?, ?, ?, 0, ?)
                ON CONFLICT(email) DO UPDATE SET
                  hour_utc = excluded.hour_utc,
                  lang = excluded.lang,
                  subscribed_at = excluded.subscribed_at
                WHERE email_subscribers.active = 0`)
      .bind(email, hour, lang, token, now, country)
      .run();
  } catch (e) {
    return _bad('Could not save your subscription. Please try again later.', 500);
  }

  const t = CONFIRM[lang];
  const link = `https://statedoku.com/api/confirm?token=${encodeURIComponent(token)}`;
  const html = `
    <div style="font-family:system-ui,sans-serif;max-width:480px;padding:20px;color:#0A0A0A">
      <h2 style="margin:0 0 12px;color:#0F2147">Statedoku</h2>
      <p style="margin:6px 0 16px">${_esc(t.p1)}</p>
      <p><a href="${link}" style="display:inline-block;background:#0F2147;color:#fff;padding:10px 20px;border-radius:999px;text-decoration:none;font-weight:700">${_esc(t.btn)}</a></p>
      <p style="margin:16px 0 0;color:#666;font-size:14px">${_esc(t.p2)}</p>
    </div>`;
  const send = fetch('https://api.resend.com/emails', {
    method: 'POST',
    headers: { 'authorization': `Bearer ${env.RESEND_API_KEY}`, 'content-type': 'application/json' },
    body: JSON.stringify({ from: 'Statedoku <hello@statedoku.com>', to: [email], subject: t.subject, html }),
  }).catch(() => {});
  if (typeof waitUntil === 'function') waitUntil(send);

  // Owner notification for new addresses, with every value escaped.
  if (isNew && env.ADMIN_NOTIFY_EMAIL) {
    const html = `
      <div style="font-family:system-ui,sans-serif;max-width:480px;padding:20px;color:#0A0A0A">
        <h2 style="margin:0 0 12px;color:#0F2147">New subscriber, awaiting confirmation</h2>
        <p style="margin:6px 0"><strong>Email:</strong> ${_esc(email)}</p>
        <p style="margin:6px 0"><strong>Language:</strong> ${_esc(lang.toUpperCase())}</p>
        <p style="margin:6px 0"><strong>Daily hour:</strong> ${hour}:00 UTC</p>
        ${country ? `<p style="margin:6px 0"><strong>Country:</strong> ${_esc(country)}</p>` : ''}
      </div>`;
    const notify = fetch('https://api.resend.com/emails', {
      method: 'POST',
      headers: { 'authorization': `Bearer ${env.RESEND_API_KEY}`, 'content-type': 'application/json' },
      body: JSON.stringify({
        from: 'Statedoku <hello@statedoku.com>',
        to: [env.ADMIN_NOTIFY_EMAIL],
        subject: 'New Statedoku subscriber (pending confirmation)',
        html,
      }),
    }).catch(() => {});
    if (typeof waitUntil === 'function') waitUntil(notify);
  }

  return _pending();
}

function _pending() {
  return new Response(JSON.stringify({ ok: true, pending: true }), {
    headers: { 'content-type': 'application/json' },
  });
}

function _bad(msg, status = 400) {
  return new Response(JSON.stringify({ ok: false, error: msg }), {
    status,
    headers: { 'content-type': 'application/json' },
  });
}
