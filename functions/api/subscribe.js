// POST /api/subscribe
// Body: { email, hour_utc, lang }
// Returns: { ok: true } on success

import { rateLimit, getClientIp } from '../_shared/ratelimit.js';

function _rand(bytes = 24) {
  const a = new Uint8Array(bytes);
  crypto.getRandomValues(a);
  return Array.from(a, b => b.toString(16).padStart(2, '0')).join('');
}

function _validEmail(e) {
  if (typeof e !== 'string' || e.length > 254) return false;
  return /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(e);
}

export async function onRequestPost({ request, env, waitUntil }) {
  if (!env.STATS_DB) return new Response('Database not configured', { status: 500 });

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

  // Honeypot: if "website" field exists in payload, silently accept but drop
  if (body.website) {
    return new Response(JSON.stringify({ ok: true }), {
      headers: { 'content-type': 'application/json' },
    });
  }

  const email = (body.email || '').trim().toLowerCase();
  const hour = parseInt(body.hour_utc, 10);
  const lang = ['en','fr','es'].includes(body.lang) ? body.lang : 'en';
  const country = request.headers.get('cf-ipcountry') || null;

  if (!_validEmail(email))   return _bad('Invalid email');
  if (!(hour >= 0 && hour <= 23)) return _bad('Invalid hour (0-23 UTC)');

  const token = _rand(24);
  const now = Date.now();

  let isNew = false;
  let totalSubs = 0;
  try {
    const existing = await env.STATS_DB
      .prepare('SELECT 1 FROM email_subscribers WHERE email = ?')
      .bind(email).first();
    isNew = !existing;

    await env.STATS_DB
      .prepare(`INSERT INTO email_subscribers (email, hour_utc, lang, token, subscribed_at, active, country)
                VALUES (?, ?, ?, ?, ?, 1, ?)
                ON CONFLICT(email) DO UPDATE SET
                  hour_utc = excluded.hour_utc,
                  lang = excluded.lang,
                  active = 1`)
      .bind(email, hour, lang, token, now, country)
      .run();

    const c = await env.STATS_DB
      .prepare('SELECT COUNT(*) AS n FROM email_subscribers WHERE active = 1').first();
    totalSubs = c?.n || 0;
  } catch (e) {
    return new Response('DB error: ' + e.message, { status: 500 });
  }

  // Fire-and-forget admin notification on NEW subscribes only
  if (isNew && env.RESEND_API_KEY && env.ADMIN_NOTIFY_EMAIL) {
    const subject = `🎉 New Statedoku subscriber #${totalSubs}: ${email}`;
    const html = `
      <div style="font-family:system-ui,sans-serif;max-width:480px;padding:20px;color:#0A0A0A">
        <h2 style="margin:0 0 12px;color:#0F2147">🎉 New subscriber</h2>
        <p style="margin:6px 0"><strong>Email:</strong> ${email}</p>
        <p style="margin:6px 0"><strong>Language:</strong> ${lang.toUpperCase()}</p>
        <p style="margin:6px 0"><strong>Daily hour:</strong> ${hour}:00 UTC</p>
        ${country ? `<p style="margin:6px 0"><strong>Country:</strong> ${country}</p>` : ''}
        <p style="margin:14px 0 0;padding-top:12px;border-top:1px solid #eee;color:#666;font-size:14px">
          Total active subscribers: <strong>${totalSubs}</strong>
        </p>
      </div>`;
    const notify = fetch('https://api.resend.com/emails', {
      method: 'POST',
      headers: {
        'authorization': `Bearer ${env.RESEND_API_KEY}`,
        'content-type': 'application/json',
      },
      body: JSON.stringify({
        from: 'Statedoku <hello@statedoku.com>',
        to: [env.ADMIN_NOTIFY_EMAIL],
        subject,
        html,
      }),
    }).catch(() => {/* never block subscribe on notify failure */});
    if (typeof waitUntil === 'function') waitUntil(notify);
  }

  return new Response(JSON.stringify({ ok: true }), {
    headers: { 'content-type': 'application/json' },
  });
}

export async function onRequestOptions() {
  return new Response(null, {
    headers: {
      'access-control-allow-origin': '*',
      'access-control-allow-methods': 'POST, OPTIONS',
      'access-control-allow-headers': 'content-type',
    },
  });
}

function _bad(msg) {
  return new Response(JSON.stringify({ ok: false, error: msg }), {
    status: 400,
    headers: { 'content-type': 'application/json' },
  });
}
