// ─────────────────────────────────────────────────────────────────────────
// Statedoku — Twitter bot
//
// Tweets come from a pre-generated two-slot bank at /data/tweets.json, written
// once and served from the site. Nothing calls an LLM at runtime.
//
// Each day posts one tweet from each slot: the 13:00 UTC run takes from "game"
// and links to the puzzle, the 23:00 run takes from "page" and links to the
// page that tweet is actually about. The game list runs 200 days before it
// wraps, the page list 400, and they advance independently so a missed run
// cannot desynchronise them.
//
// Cost note. X is pay-per-use as of 2026 and a post containing a link costs
// materially more than a plain one. Both slots carry links by design, so if the
// bill matters, the lever is posting once a day rather than twice, not stripping
// the links, since the links are the entire point of the account.
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

// Which slot each cron fires. The 13:00 UTC run posts the game link, the 23:00
// run posts the content link, so every day goes out exactly one of each.
const PAGE_SLOT_FROM_UTC_HOUR = 15;

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
// ───── Buffer -> X (free route) ──────────────────────────────────────────
// Posting to X through the X API costs 0.20 USD per post containing a link.
// Buffer publishes to X through its own approved X app, so no X developer
// account and no per-post charge: the Buffer free plan covers it.
//
// Buffer's free plan caps a channel queue at 10 scheduled posts. We never come
// near it, because each cron run schedules a single post a couple of minutes
// out and Buffer publishes it almost immediately. Queue depth stays at 1.
//
// Needs BUFFER_TOKEN (publish.buffer.com/settings/api) and BUFFER_CHANNEL_ID.
// Run the worker with ?key=...&buffer_channels=1 once to list channel ids.
const BUFFER_API = 'https://api.buffer.com';
const BUFFER_LEAD_MS = 3 * 60 * 1000;

async function bufferGraphQL(query, env) {
  const resp = await fetch(BUFFER_API, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json', 'Authorization': 'Bearer ' + env.BUFFER_TOKEN },
    body: JSON.stringify({ query }),
  });
  const body = await resp.text();
  let json = null;
  try { json = JSON.parse(body); } catch { /* keep raw body for the error path */ }
  return { ok: resp.ok, status: resp.status, json, body: body.slice(0, 600) };
}

async function postBuffer(text, env, nowMs) {
  const dueAt = new Date(nowMs + BUFFER_LEAD_MS).toISOString();
  // GraphQL strings need their quotes and newlines escaped; the tweets contain both.
  const safe = JSON.stringify(text);
  const q = `mutation {
    createPost(input: {
      text: ${safe},
      channelId: ${JSON.stringify(env.BUFFER_CHANNEL_ID)},
      schedulingType: automatic,
      mode: customScheduled,
      dueAt: ${JSON.stringify(dueAt)}
    }) {
      ... on PostActionSuccess { post { id dueAt } }
      ... on MutationError { message }
    }
  }`;
  const r = await bufferGraphQL(q, env);

  // A GraphQL endpoint answers 200 even when the mutation failed, so the
  // transport status alone is not a success signal.
  const payload = r.json?.data?.createPost;
  const gqlErr = r.json?.errors?.[0]?.message || payload?.message || null;
  return {
    ok: r.ok && !gqlErr && !!payload?.post?.id,
    status: r.status,
    dueAt,
    postId: payload?.post?.id || null,
    body: gqlErr || r.body,
  };
}

async function listBufferChannels(env) {
  const orgs = await bufferGraphQL('query { account { organizations { id name } } }', env);
  const orgId = orgs.json?.data?.account?.organizations?.[0]?.id;
  if (!orgId) return { ok: false, step: 'organizations', detail: orgs.body };
  const ch = await bufferGraphQL(
    `query { channels(input: { organizationId: ${JSON.stringify(orgId)} }) { id name service } }`, env);
  return { ok: !!ch.json?.data?.channels, organizationId: orgId, channels: ch.json?.data?.channels || ch.body };
}

// ───── Bluesky (AT Protocol) ─────────────────────────────────────────────
// Free to post. Needs BLUESKY_HANDLE and BLUESKY_APP_PASSWORD, the latter made
// at Settings > App Passwords, not the account password.
//
// Bluesky does not detect links on its own. A URL with no matching facet is
// posted as dead plain text, so the whole point of the post is lost. Facet
// offsets are indices into the UTF-8 BYTES of the text, not into the JS string,
// and these tweets carry emoji, so the offsets have to be computed on the
// encoded bytes or every link lands in the wrong place.
function _linkFacets(text) {
  const bytes = new TextEncoder().encode(text);
  const facets = [];
  const rx = /https?:\/\/[^\s]+/g;
  let m;
  while ((m = rx.exec(text)) !== null) {
    let uri = m[0];
    while (/[.,;:!?)\]]$/.test(uri)) uri = uri.slice(0, -1); // trailing punctuation is not part of the URL
    const before = new TextEncoder().encode(text.slice(0, m.index)).length;
    const len = new TextEncoder().encode(uri).length;
    facets.push({
      index: { byteStart: before, byteEnd: before + len },
      features: [{ $type: 'app.bsky.richtext.facet#link', uri }],
    });
  }
  return { facets, byteLength: bytes.length };
}

async function postBluesky(text, env) {
  const host = env.BLUESKY_HOST || 'https://bsky.social';
  const auth = await fetch(host + '/xrpc/com.atproto.server.createSession', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ identifier: env.BLUESKY_HANDLE, password: env.BLUESKY_APP_PASSWORD }),
  });
  if (!auth.ok) return { ok: false, status: auth.status, body: await auth.text() };
  const session = await auth.json();

  const { facets, byteLength } = _linkFacets(text);
  // Bluesky caps a post at 300 graphemes, measured well above our 280.
  const resp = await fetch(host + '/xrpc/com.atproto.repo.createRecord', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json', 'Authorization': 'Bearer ' + session.accessJwt },
    body: JSON.stringify({
      repo: session.did,
      collection: 'app.bsky.feed.post',
      record: {
        $type: 'app.bsky.feed.post',
        text,
        facets,
        createdAt: new Date().toISOString(),
        langs: ['en'],
      },
    }),
  });
  return { ok: resp.ok, status: resp.status, body: await resp.text(), facets: facets.length, bytes: byteLength };
}

// ───── Mastodon ──────────────────────────────────────────────────────────
// Free to post. Needs MASTODON_HOST (e.g. https://mastodon.social) and
// MASTODON_TOKEN from Preferences > Development > New application, scope
// write:statuses. Mastodon linkifies URLs itself, so no facets needed.
async function postMastodon(text, env) {
  const resp = await fetch(env.MASTODON_HOST + '/api/v1/statuses', {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      'Authorization': 'Bearer ' + env.MASTODON_TOKEN,
      'Idempotency-Key': `statedoku-${text.length}-${new Date().toISOString().slice(0, 13)}`,
    },
    body: JSON.stringify({ status: text, visibility: 'public', language: 'en' }),
  });
  return { ok: resp.ok, status: resp.status, body: (await resp.text()).slice(0, 400) };
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

// Which day we are on and which of the two daily slots this run is. Indexing by
// day rather than by elapsed slot means the two lists advance independently, so
// a missed run never desynchronises them.
function _daySlot(nowMs) {
  const epoch = Date.parse(BANK_EPOCH + 'T00:00:00Z');
  const day = Math.max(0, Math.floor((nowMs - epoch) / 86400000));
  const slot = new Date(nowMs).getUTCHours() >= PAGE_SLOT_FROM_UTC_HOUR ? 'page' : 'game';
  return { day, slot };
}

async function pickFromBank(env, nowMs) {
  const resp = await fetch(TWEET_BANK_URL, { cf: { cacheTtl: 3600, cacheEverything: true } });
  if (!resp.ok) throw new Error('bank fetch ' + resp.status);
  const bank = await resp.json();
  if (!bank.slots) throw new Error('bank is not v2 (no slots)');

  const { day, slot } = _daySlot(nowMs);
  const pool = (bank.slots[slot] || {}).tweets || [];
  if (!pool.length) throw new Error('slot ' + slot + ' empty');

  const idx = day % pool.length;
  const picked = pool[idx];
  return {
    text: picked.text,
    meta: { slot, day, idx, of: pool.length, angle: picked.angle, url: picked.url, page: picked.page || null },
  };
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

  if (dryRun) return { dry_run: true, phase: PHASE, source, meta, tweet, networks: _enabledNetworks(env) };

  // Post to every network that has credentials configured. One network failing
  // must not stop the others, so each is settled independently.
  const nets = _enabledNetworks(env);
  const results = {};
  for (const net of nets) {
    try {
      if (net === 'buffer')   results.buffer = await postBuffer(tweet, env, now);
      if (net === 'x')        results.x = await postTweet(tweet, env);
      if (net === 'bluesky')  results.bluesky = await postBluesky(tweet, env);
      if (net === 'mastodon') results.mastodon = await postMastodon(tweet, env);
    } catch (e) {
      results[net] = { ok: false, status: 0, body: e.message };
    }
  }
  return { phase: PHASE, source, meta, tweet, networks: nets, results };
}

// A network is on when its secrets are present, so switching route is a matter
// of adding or deleting secrets, with no code change.
//
// buffer and x both end up on X. Configuring both would double-post, so buffer
// wins when the two are set: it is the free one.
function _enabledNetworks(env) {
  const nets = [];
  const viaBuffer = env.BUFFER_TOKEN && env.BUFFER_CHANNEL_ID;
  if (viaBuffer) nets.push('buffer');
  else if (env.TWITTER_API_KEY && env.TWITTER_ACCESS_TOKEN) nets.push('x');
  if (env.BLUESKY_HANDLE && env.BLUESKY_APP_PASSWORD) nets.push('bluesky');
  if (env.MASTODON_HOST && env.MASTODON_TOKEN) nets.push('mastodon');
  return nets;
}

export default {
  // Cron — schedule set in wrangler.toml.
  // prelaunch: fires twice a day (morning + evening UTC).
  // launch:    fires once a day.
  async scheduled(event, env, ctx) {
    try {
      const r = await _runOnce(env);
      const line = Object.entries(r.results || {})
        .map(([net, res]) => `${net}:${res.ok ? 'ok' : 'FAIL ' + res.status}`).join(' ');
      console.log('[Statedoku Bot]', r.meta?.slot || '?', line || 'no network configured', '|', r.tweet.split('\n')[0]);
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

    // One-off helper: list Buffer channel ids so BUFFER_CHANNEL_ID can be set.
    if (url.searchParams.get('buffer_channels') === '1') {
      return new Response(JSON.stringify(await listBufferChannels(env), null, 2),
        { headers: { 'content-type': 'application/json' } });
    }

    const dryRun = url.searchParams.get('dry') === '1';
    const customText = url.searchParams.get('text') || null;
    const result = await _runOnce(env, { dryRun, customText });

    return new Response(JSON.stringify(result, null, 2), {
      headers: { 'content-type': 'application/json' }
    });
  },
};
