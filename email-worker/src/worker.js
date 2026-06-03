// ─────────────────────────────────────────────────────────────────────────
// Statedoku — Email Reminders Worker
//
// Cron: every hour at :05.
// Sends today's puzzle reminder to subscribers whose hour_utc matches the
// current UTC hour and who have not received today's email yet.
// Email sending is via MailChannels (free, integrated with Cloudflare).
// ─────────────────────────────────────────────────────────────────────────

const SITE_URL = 'https://statedoku.com';
const FROM_EMAIL = 'reminders@statedoku.com';
const FROM_NAME  = 'Statedoku';

// Click tracking — when a subscriber's email is in this allow-list, the
// play-button is wrapped with a redirect through /api/track/email-click so we
// can record opens-and-clicks for them. Privacy-scoped to opted-in test users.
const CLICK_TRACK_EMAILS = new Set(['eloise0903.deb@gmail.com']);

const SUBJECTS = {
  en: "Today's grid is live 🗺️",
  fr: "La grille du jour est là 🗺️",
  es: "La cuadrícula de hoy está lista 🗺️",
};

const BTN = {
  en: 'Play now →',
  fr: 'Jouer →',
  es: 'Jugar →',
};

// base64url-encode for safe URL embedding (no +/=)
function _b64url(s) {
  // Workers/Node: btoa works on ASCII; emails are ASCII
  return btoa(s).replace(/\+/g, '-').replace(/\//g, '_').replace(/=+$/, '');
}

function _playUrl(lang, email) {
  const langPath = lang === 'fr' ? '/fr/' : lang === 'es' ? '/es/' : '/';
  const dest = `${SITE_URL}${langPath}?utm_source=email&utm_medium=daily&utm_campaign=reminder`;
  if (CLICK_TRACK_EMAILS.has(email)) {
    const u = _b64url(email);
    const d = _b64url(dest);
    return `${SITE_URL}/api/track/email-click?u=${u}&d=${d}&l=${lang}`;
  }
  return dest;
}

const BODIES = {
  en: (dateLong, href) => `
    <p style="font-size:15px">Today's grid is live.</p>
    <p style="color:#525252">${dateLong}</p>
    <p><a href="${href}" style="display:inline-block;background:#0F2147;color:#fff;padding:12px 22px;border-radius:8px;text-decoration:none;font-weight:700">${BTN.en}</a></p>
  `,
  fr: (dateLong, href) => `
    <p style="font-size:15px">La grille du jour est en ligne.</p>
    <p style="color:#525252">${dateLong}</p>
    <p><a href="${href}" style="display:inline-block;background:#0F2147;color:#fff;padding:12px 22px;border-radius:8px;text-decoration:none;font-weight:700">${BTN.fr}</a></p>
  `,
  es: (dateLong, href) => `
    <p style="font-size:15px">La cuadrícula de hoy está lista.</p>
    <p style="color:#525252">${dateLong}</p>
    <p><a href="${href}" style="display:inline-block;background:#0F2147;color:#fff;padding:12px 22px;border-radius:8px;text-decoration:none;font-weight:700">${BTN.es}</a></p>
  `,
};

const UNSUB = {
  en: t => `<p style="color:#999;font-size:11px;margin-top:32px">Subscribed to daily Statedoku · <a href="${SITE_URL}/api/unsubscribe?token=${t}" style="color:#999">Unsubscribe</a></p>`,
  fr: t => `<p style="color:#999;font-size:11px;margin-top:32px">Inscrit aux mails quotidiens Statedoku · <a href="${SITE_URL}/api/unsubscribe?token=${t}" style="color:#999">Se désinscrire</a></p>`,
  es: t => `<p style="color:#999;font-size:11px;margin-top:32px">Suscrito a los emails diarios de Statedoku · <a href="${SITE_URL}/api/unsubscribe?token=${t}" style="color:#999">Cancelar</a></p>`,
};

function _today() {
  const d = new Date();
  return `${d.getUTCFullYear()}-${String(d.getUTCMonth()+1).padStart(2,'0')}-${String(d.getUTCDate()).padStart(2,'0')}`;
}
function _longDate(lang) {
  const locale = lang === 'fr' ? 'fr-FR' : lang === 'es' ? 'es-ES' : 'en-US';
  return new Date().toLocaleDateString(locale, { weekday: 'long', month: 'long', day: 'numeric' });
}

async function _sendOne(sub, env) {
  const lang = ['en','fr','es'].includes(sub.lang) ? sub.lang : 'en';
  const playHref = _playUrl(lang, sub.email);
  const html = `
    <div style="font-family:system-ui,-apple-system,sans-serif;max-width:480px;margin:0 auto;padding:24px;color:#0A0A0A;line-height:1.55">
      <div style="display:flex;align-items:center;gap:10px;margin-bottom:18px">
        <span style="font-size:26px;line-height:1">🇺🇸</span>
        <h1 style="font-size:22px;font-weight:900;color:#0F2147;letter-spacing:-0.02em;margin:0">State<span style="color:#DC2626">doku</span></h1>
      </div>
      ${BODIES[lang](_longDate(lang), playHref)}
      ${UNSUB[lang](sub.token)}
    </div>
  `;
  const subject = SUBJECTS[lang];

  // Resend API — free 3000 emails/mo, clean. Requires verified domain (DKIM/SPF set in CF DNS)
  const res = await fetch('https://api.resend.com/emails', {
    method: 'POST',
    headers: {
      'authorization': `Bearer ${env.RESEND_API_KEY}`,
      'content-type': 'application/json',
    },
    body: JSON.stringify({
      from: `${FROM_NAME} <${FROM_EMAIL}>`,
      to: [sub.email],
      subject,
      html,
    }),
  });
  if (!res.ok) {
    const t = await res.text();
    throw new Error(`Resend ${res.status}: ${t}`);
  }
  return true;
}

async function _runHourly(env) {
  const nowHour = new Date().getUTCHours();
  const today = _today();
  const { results } = await env.STATS_DB
    .prepare(`SELECT email, lang, token FROM email_subscribers
              WHERE active = 1 AND hour_utc = ? AND (last_sent_date IS NULL OR last_sent_date <> ?)`)
    .bind(nowHour, today)
    .all();

  let ok = 0, fail = 0;
  for (const sub of (results || [])) {
    try {
      await _sendOne(sub, env);
      await env.STATS_DB
        .prepare('UPDATE email_subscribers SET last_sent_date = ? WHERE email = ?')
        .bind(today, sub.email).run();
      ok++;
    } catch (e) {
      console.error('[email] send failed for', sub.email, e.message);
      fail++;
    }
  }
  console.log(`[email] hour ${nowHour}: sent ${ok}, failed ${fail}, queried ${(results || []).length}`);
  return { ok, fail, total: (results || []).length };
}

export default {
  async scheduled(event, env, ctx) {
    try { await _runHourly(env); }
    catch (e) { console.error('[email] cron exception:', e.message); }
  },

  // Manual trigger / debug — visit with ?key=<MANUAL_TRIGGER_KEY>
  async fetch(request, env) {
    const url = new URL(request.url);
    if (url.searchParams.get('key') !== env.MANUAL_TRIGGER_KEY) {
      return new Response('Forbidden\n', { status: 403 });
    }
    const out = await _runHourly(env);
    return new Response(JSON.stringify(out, null, 2), {
      headers: { 'content-type': 'application/json' },
    });
  },
};
