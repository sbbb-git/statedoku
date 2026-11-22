// Statedoku, /api/apply (22 November 2026)
//
// The application form of the internship pages (careers/<slug>/, built by
// scripts/careers/build-careers.py, which also writes the list of open roles
// into functions/_shared/careers-roles.js).
//
// POST: one application, JSON only (a CORS preflight for any cross-site
// attempt, like /api/events and /api/feedback). The résumé travels as a
// base64 PDF inside the JSON. Nothing is stored: the application goes by
// email to the recruiting address with the PDF attached, then the candidate
// gets an acknowledgement whose links bring them to the site through a Google
// search for the brand (the site is first on "statedoku") and to its social
// accounts. A failed acknowledgement never fails the application.
//
// GET: { ready } tells js/apply.js whether to show the form; without
// RESEND_API_KEY on the Pages project, or with no role open, the page shows
// the email address instead.
//
// Error bodies are generic codes, never an exception's message.

import { rateLimit, getClientIp } from '../_shared/ratelimit.js';
import { ROLES, DEADLINE } from '../_shared/careers-roles.js';

const MAX_BODY = 6_000_000;            // a 4 MB PDF in base64, plus the fields
const MAX_PDF = 4 * 1024 * 1024;
const FROM = 'Statedoku Careers <careers@statedoku.com>';
const BRAND_SEARCH = 'https://www.google.com/search?q=statedoku';
const EMAIL = /^[^\s@<>"',;:()\[\]\\]{1,64}@[A-Za-z0-9](?:[A-Za-z0-9-]{0,61}[A-Za-z0-9])?(?:\.[A-Za-z0-9](?:[A-Za-z0-9-]{0,61}[A-Za-z0-9])?)+$/;
const CONTROL = /[\u0000-\u0008\u000B\u000C\u000E-\u001F\u007F\u200B-\u200F\u2028-\u202E\u2066-\u2069]/g;

const json = (obj, status = 200) => new Response(JSON.stringify(obj), {
  status, headers: { 'content-type': 'application/json; charset=utf-8', 'cache-control': 'no-store' },
});

function _open() {
  // Open until the end of the deadline day in New York (UTC-5).
  const todayNY = new Date(Date.now() - 5 * 3600_000).toISOString().slice(0, 10);
  return Object.keys(ROLES).length > 0 && todayNY <= DEADLINE;
}

function _line(v, max) {
  if (typeof v !== 'string') return '';
  return v.replace(CONTROL, '').replace(/[\r\n\t]+/g, ' ').replace(/\s{2,}/g, ' ').trim().slice(0, max);
}

function _text(v, max) {
  if (typeof v !== 'string') return '';
  return v.replace(CONTROL, '').replace(/\r\n?/g, '\n').replace(/\n{3,}/g, '\n\n').trim().slice(0, max);
}

export async function onRequestGet({ env }) {
  return json({ ready: Boolean(env.RESEND_API_KEY) && _open(), deadline: DEADLINE });
}

export async function onRequestPost({ request, env, waitUntil }) {
  const origin = request.headers.get('origin');
  if ((origin && !/^https:\/\/(www\.)?statedoku\.com$/.test(origin)) || request.headers.get('sec-fetch-site') === 'cross-site') {
    return json({ ok: false, error: 'forbidden' }, 403);
  }
  if (!/^application\/json\b/i.test(request.headers.get('content-type') || '')) {
    return json({ ok: false, error: 'json_only' }, 415);
  }
  if (!env.RESEND_API_KEY || !_open()) return json({ ok: false, error: 'unavailable' }, 503);
  if (!rateLimit('apply:' + getClientIp(request), 5, 3_600_000).ok) return json({ ok: false, error: 'rate' }, 429);
  if (Number(request.headers.get('content-length') || 0) > MAX_BODY) return json({ ok: false, error: 'too_large' }, 413);

  let b;
  try {
    const raw = await request.text();
    if (raw.length > MAX_BODY) return json({ ok: false, error: 'too_large' }, 413);
    b = JSON.parse(raw);
  } catch {
    return json({ ok: false, error: 'bad_json' }, 400);
  }
  if (!b || typeof b !== 'object') return json({ ok: false, error: 'bad_body' }, 400);

  // A filled honeypot is a bot: answer as if all went well, send nothing.
  if (typeof b.website === 'string' && b.website.trim()) return json({ ok: true });

  const role = typeof b.role === 'string' && Object.prototype.hasOwnProperty.call(ROLES, b.role) ? b.role : null;
  if (!role) return json({ ok: false, error: 'role' }, 400);
  const title = ROLES[role];
  const name = _line(b.name, 100);
  if (name.length < 2) return json({ ok: false, error: 'name' }, 400);
  const email = _line(b.email, 254);
  if (!EMAIL.test(email)) return json({ ok: false, error: 'email' }, 400);
  const answer = _text(b.answer, 1500);
  if (answer.length < 20) return json({ ok: false, error: 'answer' }, 400);
  const link = _line(b.link, 300);
  if (link && !/^https?:\/\/\S{3,}$/i.test(link)) return json({ ok: false, error: 'link' }, 400);
  const keep = b.keep === true;

  // The résumé: a PDF, 4 MB at most, checked by its first bytes, not its name.
  const cv = b.cv && typeof b.cv === 'object' ? b.cv : null;
  if (!cv || typeof cv.data !== 'string' || !/^[A-Za-z0-9+/]+={0,2}$/.test(cv.data)) return json({ ok: false, error: 'cv' }, 400);
  let bytes;
  try { bytes = atob(cv.data); } catch { return json({ ok: false, error: 'cv' }, 400); }
  if (bytes.length > MAX_PDF) return json({ ok: false, error: 'too_large' }, 413);
  if (!bytes.startsWith('%PDF-')) return json({ ok: false, error: 'cv_type' }, 400);
  const file = (_line(cv.name, 80).replace(/[^A-Za-z0-9._ -]/g, '').replace(/\.pdf$/i, '') || 'resume') + '.pdf';

  // One address cannot be made to receive acknowledgements again and again.
  if (!rateLimit('apply-mail:' + email.toLowerCase(), 2, 86_400_000).ok) return json({ ok: false, error: 'rate' }, 429);

  const to = env.CAREERS_TO || 'contact@statedoku.com';
  const country = (request.headers.get('cf-ipcountry') || '').slice(0, 2) || 'unknown';
  const text = [
    `Application: ${title}`,
    '',
    `Name: ${name}`,
    `Email: ${email}`,
    `Link: ${link || 'none'}`,
    `Keep for a future opening (two years at most): ${keep ? 'yes' : 'no'}`,
    `Sent from: ${country}, ${new Date().toISOString()}`,
    '',
    'Five lines:',
    answer,
    '',
    `Résumé attached: ${file}`,
  ].join('\n');

  let sent;
  try {
    sent = await fetch('https://api.resend.com/emails', {
      method: 'POST',
      headers: { authorization: `Bearer ${env.RESEND_API_KEY}`, 'content-type': 'application/json' },
      body: JSON.stringify({
        from: FROM, to: [to], reply_to: email,
        subject: `Application: ${title}, ${name}`.slice(0, 180),
        text, attachments: [{ filename: file, content: cv.data }],
      }),
    });
  } catch {
    return json({ ok: false, error: 'send' }, 502);
  }
  if (!sent.ok) return json({ ok: false, error: 'send' }, 502);

  // The acknowledgement: no promise of an interview, the dates of the pages.
  const ack = [
    'Hello,',
    '',
    `Your application for the ${title} position at Statedoku has arrived. If your profile fits, we will invite you to a video call before the end of December 2026.`,
    '',
    `To prepare for a possible interview, discover the site: search for Statedoku on Google, ${BRAND_SEARCH}`,
    '',
    'In the meantime, follow Statedoku on TikTok (https://www.tiktok.com/@statedoku), YouTube (https://www.youtube.com/@Statedoku) or X (https://x.com/statedoku).',
    '',
    'Best regards,',
    'Statedoku',
  ].join('\n');
  const send_ack = fetch('https://api.resend.com/emails', {
    method: 'POST',
    headers: { authorization: `Bearer ${env.RESEND_API_KEY}`, 'content-type': 'application/json' },
    body: JSON.stringify({ from: FROM, to: [email], reply_to: to, subject: 'Statedoku: application received', text: ack }),
  }).then(r => { if (!r.ok) console.error('apply: acknowledgement refused', r.status); })
    .catch(() => console.error('apply: acknowledgement failed'));
  if (typeof waitUntil === 'function') waitUntil(send_ack); else await send_ack;

  return json({ ok: true });
}
