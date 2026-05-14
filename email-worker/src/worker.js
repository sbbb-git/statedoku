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

const SUBJECTS = {
  en: '🇺🇸 Today\'s Statedoku is live',
  fr: '🇺🇸 Le Statedoku du jour est en ligne',
  es: '🇺🇸 El Statedoku de hoy está listo',
};

const BODIES = {
  en: (dateLong) => `
    <p>Good morning — your daily Statedoku is waiting.</p>
    <p><strong>${dateLong}</strong></p>
    <p>Solve the 3×3 grid in 3 mistakes or fewer.</p>
    <p><a href="${SITE_URL}" style="display:inline-block;background:#0F2147;color:#fff;padding:12px 22px;border-radius:8px;text-decoration:none;font-weight:700">Play today's puzzle →</a></p>
  `,
  fr: (dateLong) => `
    <p>Bonjour — votre Statedoku du jour vous attend.</p>
    <p><strong>${dateLong}</strong></p>
    <p>Résolvez la grille 3×3 en 3 erreurs ou moins.</p>
    <p><a href="${SITE_URL}/fr/" style="display:inline-block;background:#0F2147;color:#fff;padding:12px 22px;border-radius:8px;text-decoration:none;font-weight:700">Jouer maintenant →</a></p>
  `,
  es: (dateLong) => `
    <p>Buenos días — tu Statedoku diario te espera.</p>
    <p><strong>${dateLong}</strong></p>
    <p>Resuelve la cuadrícula 3×3 en 3 errores o menos.</p>
    <p><a href="${SITE_URL}/es/" style="display:inline-block;background:#0F2147;color:#fff;padding:12px 22px;border-radius:8px;text-decoration:none;font-weight:700">Jugar ahora →</a></p>
  `,
};

const UNSUB = {
  en: t => `<p style="color:#888;font-size:11px;margin-top:32px">You're getting this because you subscribed to Statedoku daily reminders. <a href="${SITE_URL}/api/unsubscribe?token=${t}" style="color:#888">Unsubscribe</a>.</p>`,
  fr: t => `<p style="color:#888;font-size:11px;margin-top:32px">Vous recevez ce mail car vous êtes inscrit aux rappels quotidiens Statedoku. <a href="${SITE_URL}/api/unsubscribe?token=${t}" style="color:#888">Se désinscrire</a>.</p>`,
  es: t => `<p style="color:#888;font-size:11px;margin-top:32px">Recibes esto porque te suscribiste a los recordatorios diarios de Statedoku. <a href="${SITE_URL}/api/unsubscribe?token=${t}" style="color:#888">Cancelar suscripción</a>.</p>`,
};

function _today() {
  const d = new Date();
  return `${d.getUTCFullYear()}-${String(d.getUTCMonth()+1).padStart(2,'0')}-${String(d.getUTCDate()).padStart(2,'0')}`;
}
function _longDate(lang) {
  const locale = lang === 'fr' ? 'fr-FR' : lang === 'es' ? 'es-ES' : 'en-US';
  return new Date().toLocaleDateString(locale, { weekday: 'long', month: 'long', day: 'numeric' });
}

async function _sendOne(sub) {
  const lang = ['en','fr','es'].includes(sub.lang) ? sub.lang : 'en';
  const html = `
    <div style="font-family:system-ui,-apple-system,sans-serif;max-width:480px;margin:0 auto;padding:24px;color:#0A0A0A;line-height:1.55">
      <h1 style="font-size:22px;font-weight:900;color:#0F2147;margin-bottom:18px;letter-spacing:-0.02em">State<span style="color:#DC2626">doku</span></h1>
      ${BODIES[lang](_longDate(lang))}
      ${UNSUB[lang](sub.token)}
    </div>
  `;
  const subject = SUBJECTS[lang];

  const res = await fetch('https://api.mailchannels.net/tx/v1/send', {
    method: 'POST',
    headers: { 'content-type': 'application/json' },
    body: JSON.stringify({
      personalizations: [{ to: [{ email: sub.email }] }],
      from: { email: FROM_EMAIL, name: FROM_NAME },
      subject,
      content: [{ type: 'text/html', value: html }],
    }),
  });
  if (!res.ok) {
    const t = await res.text();
    throw new Error(`MailChannels ${res.status}: ${t}`);
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
      await _sendOne(sub);
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
