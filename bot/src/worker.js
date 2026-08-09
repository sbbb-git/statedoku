// ─────────────────────────────────────────────────────────────────────────
// Statedoku — Twitter bot
//
// Tweets come from a pre-generated bank of 600 at /data/tweets.json, written
// once and served from the site. Nothing calls an LLM at runtime, so the only
// recurring cost is the X API call itself.
//
// Cost note. X moved off fixed Basic plans to pay-per-use in 2026: 0.015 USD
// per post, but 0.20 USD if the post contains a link. That is a 13x multiplier,
// so SKIP_LINK_TWEETS below lets you drop the link-carrying entries and post
// only the free-standing ones. At two posts a day the difference is roughly
// 1 USD a month versus 4 USD a month.
//
// The bank lasts 300 days at two posts a day, 600 at one. When it runs out the
// worker wraps around to the start rather than failing.
//
// Required secrets (set with `wrangler secret put NAME`):
//   - TWITTER_API_KEY            (X consumer key)
//   - TWITTER_API_SECRET         (X consumer secret)
//   - TWITTER_ACCESS_TOKEN       (X user access token)
//   - TWITTER_ACCESS_TOKEN_SECRET
//   - MANUAL_TRIGGER_KEY         (random string for testing via URL)
//
// ANTHROPIC_API_KEY is no longer needed and can be deleted with
// `wrangler secret delete ANTHROPIC_API_KEY`.
// ─────────────────────────────────────────────────────────────────────────

const SITE_URL = 'https://statedoku.com';
const TWEET_BANK_URL = SITE_URL + '/data/tweets.json';

// Day zero for indexing into the bank. Advancing one slot per scheduled run
// keeps the sequence stable and resumable across worker restarts.
const BANK_EPOCH = '2026-08-09';

// Set true to never post a tweet containing a link, cutting the per-post cost
// from 0.20 to 0.015 USD. The bank is 24% link tweets, so this still leaves
// 456 usable entries.
const SKIP_LINK_TWEETS = false;

// ⚙️ FLIP THIS WHEN YOU LAUNCH THE PUZZLE
// "prelaunch" → 2 tweets/day, no statedoku.com link, no #Statedoku hashtag (yet)
// "launch"    → 1 tweet/day, promoting the daily puzzle with link
const PHASE = 'launch';
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
function fallbackTweet() {
  if (PHASE === 'prelaunch') {
    const teasers = [
      'Something is coming for state-heads 🇺🇸',
      'Stay tuned 🇺🇸 a new daily ritual is brewing',
      'If you know your US states, you\'re going to want to be here soon 🇺🇸',
      'Quietly building something for people who love US geography 🇺🇸',
      'Almost there 🇺🇸 something\'s landing soon',
    ];
    return teasers[Math.floor(Math.random() * teasers.length)];
  }
  const date = new Date().toLocaleDateString('en-US', { weekday: 'long', month: 'long', day: 'numeric' });
  return `🇺🇸 Today's Statedoku is live\n\n${date}\n\nSolve the 3x3 US states grid in 3 mistakes or fewer.\n\n${SITE_URL}\n\n#Statedoku`;
}

// Deterministic scrub applied to every tweet before it goes out, whether it
// came from the bank or from ?text=. Strips the punctuation and phrasing that
// reads as machine-written: unicode dashes, ALL-CAPS emphasis, cliche openers,
// app-store emoji. The bank is already written to these rules, so this is a
// backstop rather than the main defence.
function humanize(text) {
  let t = text;

  // Em-dash, en-dash, spaced-hyphen pauses → comma. Handles all common
  // unicode dash codepoints (U+2014, U+2013, U+2012, U+2015, U+2212, ...).
  t = t.replace(/[‒–—―−]/g, ',');
  t = t.replace(/ - /g, ', ');
  t = t.replace(/—/g, ',').replace(/–/g, ',');

  // Cleanup: double commas, comma-before-punct, leading comma.
  t = t.replace(/, *,/g, ',').replace(/,([.!?])/g, '$1').replace(/^,\s*/, '');

  // ALL-CAPS single words used for emphasis (3+ letters, AND/BUT/OR/NOT/etc.).
  // Down-case them. We keep proper acronyms like USA, NYC by skipping 2-letter
  // and known acronym tokens.
  const KEEP_CAPS = new Set(['USA','US','NYC','LA','DC','SF','UK','EU','AI','TV','NFL','NBA','MLB','NHL','NYT','MIT','UCLA','USC','NASA','FBI','CIA','LSU','OK']);
  t = t.replace(/\b([A-Z]{3,})\b/g, (m) => KEEP_CAPS.has(m) ? m : m.toLowerCase());
  // 2-letter common emphasis words (not real acronyms) downcased.
  t = t.replace(/\b(OR|IF|NO|SO|UP)\b/g, (m) => m.toLowerCase());

  // Banned opener phrases: drop them if they lead the tweet.
  const BAD_OPENERS = [
    /^let's be honest,?\s*/i,
    /^honestly,?\s*/i,
    /^yeah,?\s*basically,?\s*/i,
    /^plot twist:?\s*/i,
    /^fun fact:?\s*/i,
    /^did you know:?\s*/i,
    /^picture this:?\s*/i,
    /^imagine if\s+/i,
  ];
  for (const re of BAD_OPENERS) t = t.replace(re, '');

  // Cliché / app emojis → strip.
  t = t.replace(/[\u{1F9E9}\u{2728}\u{1F3AF}\u{1F680}\u{1F4A1}\u{1F4AF}\u{1F525}]/gu, '');

  // Collapse extra spaces and trim.
  t = t.replace(/\s+/g, ' ').replace(/\s+([.!?,])/g, '$1').trim();

  return t;
}

// ───── Tweet bank ───────────────────────────────────────────────────────

// How many scheduled slots have elapsed since BANK_EPOCH. The cron fires twice
// a day, so this advances by two per day and the bank lasts 300 days before
// wrapping.
function _slotIndex(nowMs) {
  const epoch = Date.parse(BANK_EPOCH + 'T00:00:00Z');
  const days = Math.floor((nowMs - epoch) / 86400000);
  const secondSlot = new Date(nowMs).getUTCHours() >= 15 ? 1 : 0;
  return Math.max(0, days * 2 + secondSlot);
}

async function pickFromBank(env, nowMs) {
  const resp = await fetch(TWEET_BANK_URL, { cf: { cacheTtl: 3600, cacheEverything: true } });
  if (!resp.ok) throw new Error('bank fetch ' + resp.status);
  const bank = await resp.json();

  let pool = bank.tweets || [];
  if (SKIP_LINK_TWEETS) pool = pool.filter(t => !t.has_link);
  if (!pool.length) throw new Error('bank empty after filtering');

  const idx = _slotIndex(nowMs) % pool.length;
  const picked = pool[idx];
  return { text: picked.text, meta: { idx, of: pool.length, angle: picked.angle, has_link: !!picked.has_link } };
}

// ───── Worker entry points ──────────────────────────────────────────────
async function _runOnce(env, { dryRun = false, customText = null, now = Date.now() } = {}) {
  let tweet;
  let source = 'bank';
  let meta = null;

  if (customText) {
    tweet = humanize(customText);
    source = 'custom';
  } else {
    try {
      const picked = await pickFromBank(env, now);
      tweet = humanize(picked.text);
      meta = picked.meta;
    } catch (e) {
      // The bank is a static JSON file on the same origin, so this should only
      // fire during a deploy blip. The fallback keeps the streak alive.
      console.error('[Statedoku Bot] bank unavailable, using fallback:', e.message);
      tweet = fallbackTweet();
      source = 'fallback';
    }
  }

  if (dryRun) return { dry_run: true, phase: PHASE, source, meta, tweet };

  const result = await postTweet(tweet, env);
  return { phase: PHASE, source, meta, tweet, result };
}

export default {
  // Cron — schedule set in wrangler.toml.
  // prelaunch: fires twice a day (morning + evening UTC).
  // launch:    fires once a day.
  async scheduled(event, env, ctx) {
    try {
      const r = await _runOnce(env);
      console.log('[Statedoku Bot]', r.result.ok ? '✓' : '✘', r.result.status, r.tweet);
    } catch (e) {
      console.error('[Statedoku Bot] Exception:', e.message);
    }
  },

  // Manual trigger / preview. Supports optional ?text= for custom-content
  // announcements (still gated by MANUAL_TRIGGER_KEY + humanize()'s scrub).
  async fetch(request, env) {
    const url = new URL(request.url);
    const key = url.searchParams.get('key');

    if (!key || key !== env.MANUAL_TRIGGER_KEY) {
      return new Response('Forbidden\n', { status: 403, headers: { 'content-type': 'text/plain' } });
    }

    const dryRun = url.searchParams.get('dry') === '1';
    const customText = url.searchParams.get('text') || null;
    const result = await _runOnce(env, { dryRun, customText });

    return new Response(JSON.stringify(result, null, 2), {
      headers: { 'content-type': 'application/json' }
    });
  },
};
