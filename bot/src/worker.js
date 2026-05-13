// ─────────────────────────────────────────────────────────────────────────
// Statedoku — Twitter daily bot
// Runs on Cloudflare Workers. Posts a daily announcement tweet at midnight UTC.
// Uses Twitter API v2 (POST /2/tweets) with OAuth 1.0a user-context auth.
// ─────────────────────────────────────────────────────────────────────────

const SITE_URL = 'https://statedoku.com';

// ───── OAuth 1.0a helpers (SubtleCrypto-based) ─────
function percentEncode(str) {
  return encodeURIComponent(str)
    .replace(/!/g, '%21')
    .replace(/\*/g, '%2A')
    .replace(/'/g, '%27')
    .replace(/\(/g, '%28')
    .replace(/\)/g, '%29');
}

async function hmacSha1Base64(key, message) {
  const enc = new TextEncoder();
  const cryptoKey = await crypto.subtle.importKey(
    'raw',
    enc.encode(key),
    { name: 'HMAC', hash: 'SHA-1' },
    false,
    ['sign']
  );
  const sig = await crypto.subtle.sign('HMAC', cryptoKey, enc.encode(message));
  return btoa(String.fromCharCode(...new Uint8Array(sig)));
}

async function postTweet(text, env) {
  const url = 'https://api.twitter.com/2/tweets';
  const method = 'POST';

  const oauth = {
    oauth_consumer_key: env.TWITTER_API_KEY,
    oauth_nonce: crypto.randomUUID().replace(/-/g, ''),
    oauth_signature_method: 'HMAC-SHA1',
    oauth_timestamp: Math.floor(Date.now() / 1000).toString(),
    oauth_token: env.TWITTER_ACCESS_TOKEN,
    oauth_version: '1.0',
  };

  // Build the signature base string (RFC 5849 §3.4.1)
  const paramString = Object.keys(oauth)
    .sort()
    .map(k => `${percentEncode(k)}=${percentEncode(oauth[k])}`)
    .join('&');
  const signingBase = `${method}&${percentEncode(url)}&${percentEncode(paramString)}`;
  const signingKey = `${percentEncode(env.TWITTER_API_SECRET)}&${percentEncode(env.TWITTER_ACCESS_TOKEN_SECRET)}`;

  oauth.oauth_signature = await hmacSha1Base64(signingKey, signingBase);

  const authHeader = 'OAuth ' + Object.keys(oauth)
    .sort()
    .map(k => `${percentEncode(k)}="${percentEncode(oauth[k])}"`)
    .join(', ');

  const response = await fetch(url, {
    method,
    headers: {
      'Authorization': authHeader,
      'Content-Type': 'application/json',
    },
    body: JSON.stringify({ text }),
  });

  const body = await response.text();
  return { ok: response.ok, status: response.status, body };
}

// ───── Tweet template pool — rotated daily for variety ─────
const ANNOUNCEMENTS = [
  (dateStr) => `🇺🇸 Today's Statedoku is live!\n\n📅 ${dateStr}\n\nThink you can solve the 3×3 grid with fewer than 3 mistakes?\n\n${SITE_URL}\n\n#Statedoku`,
  (dateStr) => `New day, new grid 🗺️\n\n${dateStr}'s Statedoku just dropped. 3 mistakes allowed. How well do you know your US states?\n\n${SITE_URL}\n\n#Statedoku`,
  (dateStr) => `☀️ Good morning state-heads!\n\nToday's puzzle is up. Solve before 3 mistakes ⚠️\n\n${SITE_URL}\n\n#Statedoku`,
  (dateStr) => `Fresh Statedoku just dropped 🆕\n\nCan you beat my time? Drop your result in the replies 👇\n\n${SITE_URL}\n\n#Statedoku #DailyPuzzle`,
  (dateStr) => `⏰ Daily Statedoku reminder\n\n📅 ${dateStr}\n\nGrab your coffee ☕ and crack today's grid.\n\n${SITE_URL}\n\n#Statedoku`,
  (dateStr) => `🟩🟩🟩\n🟩🟩🟩\n🟩🟩🟩\n\nThat's the goal. Today's puzzle is waiting.\n\n${SITE_URL}\n\n#Statedoku`,
  (dateStr) => `New 3×3 grid · 3 mistakes allowed · 100 possible constraints rotating.\n\nGood luck with today's Statedoku 🇺🇸\n\n${SITE_URL}\n\n#Statedoku`,
];

function getTodayAnnouncement() {
  const date = new Date();
  const dateStr = date.toLocaleDateString('en-US', {
    weekday: 'long', month: 'long', day: 'numeric'
  });
  // Rotate by day-of-year for variety
  const dayOfYear = Math.floor((date - new Date(date.getFullYear(), 0, 0)) / 86400000);
  const template = ANNOUNCEMENTS[dayOfYear % ANNOUNCEMENTS.length];
  return template(dateStr);
}

// ───── Cloudflare Worker entry points ─────
export default {
  // Cron trigger — daily at midnight UTC (see wrangler.toml)
  async scheduled(event, env, ctx) {
    try {
      const tweet = getTodayAnnouncement();
      const result = await postTweet(tweet, env);
      console.log('[Statedoku Bot]', result.ok ? '✓ posted' : '✘ failed', result.status, result.body);
    } catch (e) {
      console.error('[Statedoku Bot] Exception:', e.message);
    }
  },

  // Manual trigger via secret URL — for testing
  async fetch(request, env) {
    const url = new URL(request.url);
    const key = url.searchParams.get('key');

    if (!key || key !== env.MANUAL_TRIGGER_KEY) {
      return new Response('Forbidden\n', { status: 403, headers: { 'content-type': 'text/plain' } });
    }

    const dryRun = url.searchParams.get('dry') === '1';
    const tweet = getTodayAnnouncement();

    if (dryRun) {
      return new Response(`Dry-run preview:\n\n${tweet}\n`, {
        headers: { 'content-type': 'text/plain; charset=utf-8' }
      });
    }

    const result = await postTweet(tweet, env);
    return new Response(JSON.stringify({ tweet, result }, null, 2), {
      headers: { 'content-type': 'application/json' }
    });
  },
};
