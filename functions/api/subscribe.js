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

export async function onRequestPost({ request, env }) {
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

  try {
    // UPSERT: if email exists, update hour/lang and reactivate; else insert
    await env.STATS_DB
      .prepare(`INSERT INTO email_subscribers (email, hour_utc, lang, token, subscribed_at, active, country)
                VALUES (?, ?, ?, ?, ?, 1, ?)
                ON CONFLICT(email) DO UPDATE SET
                  hour_utc = excluded.hour_utc,
                  lang = excluded.lang,
                  active = 1`)
      .bind(email, hour, lang, token, now, country)
      .run();
  } catch (e) {
    return new Response('DB error: ' + e.message, { status: 500 });
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
