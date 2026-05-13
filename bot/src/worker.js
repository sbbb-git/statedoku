// ─────────────────────────────────────────────────────────────────────────
// Statedoku — Twitter daily bot (Claude-powered)
//
// Generates a unique tweet every day using Anthropic's Claude API,
// then posts it to X (Twitter API v2, OAuth 1.0a).
//
// Required secrets (set with `wrangler secret put NAME`):
//   - TWITTER_API_KEY            (Twitter consumer key)
//   - TWITTER_API_SECRET         (Twitter consumer secret)
//   - TWITTER_ACCESS_TOKEN       (Twitter user access token)
//   - TWITTER_ACCESS_TOKEN_SECRET
//   - ANTHROPIC_API_KEY          (Claude API key from console.anthropic.com)
//   - MANUAL_TRIGGER_KEY         (random string for testing via URL)
// ─────────────────────────────────────────────────────────────────────────

const SITE_URL = 'https://statedoku.com';
const ANTHROPIC_MODEL = 'claude-haiku-4-5';   // small + fast + cheap (~$0.25/M input tokens)

// ───── OAuth 1.0a (Twitter) ──────────────────────────────────────────────
function percentEncode(str) {
  return encodeURIComponent(str)
    .replace(/!/g, '%21').replace(/\*/g, '%2A')
    .replace(/'/g, '%27').replace(/\(/g, '%28').replace(/\)/g, '%29');
}
async function hmacSha1Base64(key, message) {
  const enc = new TextEncoder();
  const cryptoKey = await crypto.subtle.importKey(
    'raw', enc.encode(key),
    { name: 'HMAC', hash: 'SHA-1' }, false, ['sign']
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
  const paramString = Object.keys(oauth).sort()
    .map(k => `${percentEncode(k)}=${percentEncode(oauth[k])}`).join('&');
  const signingBase = `${method}&${percentEncode(url)}&${percentEncode(paramString)}`;
  const signingKey = `${percentEncode(env.TWITTER_API_SECRET)}&${percentEncode(env.TWITTER_ACCESS_TOKEN_SECRET)}`;
  oauth.oauth_signature = await hmacSha1Base64(signingKey, signingBase);
  const authHeader = 'OAuth ' + Object.keys(oauth).sort()
    .map(k => `${percentEncode(k)}="${percentEncode(oauth[k])}"`).join(', ');

  const response = await fetch(url, {
    method,
    headers: { 'Authorization': authHeader, 'Content-Type': 'application/json' },
    body: JSON.stringify({ text }),
  });
  const body = await response.text();
  return { ok: response.ok, status: response.status, body };
}

// ───── Claude API ────────────────────────────────────────────────────────
const STYLES = [
  'a punchy daily reminder that today\'s puzzle is live',
  'a "did you know" geography fact about a US state, that ties to the game',
  'an engagement question / poll for state-heads to reply to',
  'a single-state spotlight with 3-4 surprising facts and a CTA to play',
  'a Wordle/Connections-style comparison post explaining why Statedoku is different',
  'a meme-y / playful post about US geography knowledge',
  'a brag-about-streak post inviting others to share their results',
];

function _todayDateStr() {
  return new Date().toISOString().slice(0, 10);
}

async function generateTweetText(env) {
  const date = new Date();
  const dayName = date.toLocaleDateString('en-US', { weekday: 'long' });
  const dateLong = date.toLocaleDateString('en-US', { weekday: 'long', month: 'long', day: 'numeric' });

  // Rotate style by day-of-year so each day feels different and we don't repeat too soon
  const dayOfYear = Math.floor((date - new Date(date.getFullYear(), 0, 0)) / 86400000);
  const style = STYLES[dayOfYear % STYLES.length];

  const prompt = `You write the daily tweet for @Statedoku — a free daily puzzle game (statedoku.com) that mixes Sudoku grid logic with US geography. Players fill a 3×3 grid with US states matching row + column constraints, like "Pacific coast × Borders Mexico = California". 3 mistakes allowed.

Today is ${dateLong}.

Write ONE tweet for today in this style: ${style}.

Requirements:
- Under 270 characters total (leave room for the URL).
- Include 1-2 emojis (no emoji spam).
- Include #Statedoku hashtag.
- Include the URL: ${SITE_URL}
- Sound human, casual, slightly witty. Avoid corporate marketing speak.
- Do NOT use em-dashes or fancy unicode dashes.
- Do NOT wrap in quotes.
- Output ONLY the tweet, no explanations.`;

  const resp = await fetch('https://api.anthropic.com/v1/messages', {
    method: 'POST',
    headers: {
      'x-api-key': env.ANTHROPIC_API_KEY,
      'anthropic-version': '2023-06-01',
      'content-type': 'application/json',
    },
    body: JSON.stringify({
      model: ANTHROPIC_MODEL,
      max_tokens: 400,
      messages: [{ role: 'user', content: prompt }],
    }),
  });

  if (!resp.ok) {
    throw new Error(`Claude API ${resp.status}: ${await resp.text()}`);
  }
  const json = await resp.json();
  let text = (json.content?.[0]?.text || '').trim();
  // Strip wrapping quotes if Claude added any
  if ((text.startsWith('"') && text.endsWith('"')) || (text.startsWith('"') && text.endsWith('"'))) {
    text = text.slice(1, -1).trim();
  }
  if (text.length > 280) text = text.slice(0, 277) + '…';
  return text;
}

// Fallback if Claude API is unavailable
function fallbackTweet() {
  const date = new Date().toLocaleDateString('en-US', { weekday: 'long', month: 'long', day: 'numeric' });
  return `🇺🇸 Today's Statedoku is live\n\n${date}\n\nSolve the 3x3 US states grid in 3 mistakes or fewer.\n\n${SITE_URL}\n\n#Statedoku`;
}

// ───── Worker entry points ──────────────────────────────────────────────
async function _runOnce(env, { dryRun = false } = {}) {
  let tweet;
  let source = 'claude';
  try {
    tweet = await generateTweetText(env);
  } catch (e) {
    console.error('[Statedoku Bot] Claude failed, using fallback:', e.message);
    tweet = fallbackTweet();
    source = 'fallback';
  }

  if (dryRun) return { dry_run: true, source, tweet };

  const result = await postTweet(tweet, env);
  return { source, tweet, result };
}

export default {
  // Daily cron — 14:00 UTC (set in wrangler.toml)
  async scheduled(event, env, ctx) {
    try {
      const r = await _runOnce(env);
      console.log('[Statedoku Bot]', r.result.ok ? '✓' : '✘', r.result.status, r.tweet);
    } catch (e) {
      console.error('[Statedoku Bot] Exception:', e.message);
    }
  },

  // Manual trigger / preview
  async fetch(request, env) {
    const url = new URL(request.url);
    const key = url.searchParams.get('key');

    if (!key || key !== env.MANUAL_TRIGGER_KEY) {
      return new Response('Forbidden\n', { status: 403, headers: { 'content-type': 'text/plain' } });
    }

    const dryRun = url.searchParams.get('dry') === '1';
    const result = await _runOnce(env, { dryRun });

    return new Response(JSON.stringify(result, null, 2), {
      headers: { 'content-type': 'application/json' }
    });
  },
};
