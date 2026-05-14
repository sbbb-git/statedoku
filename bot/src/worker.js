// ─────────────────────────────────────────────────────────────────────────
// Statedoku — Twitter bot (Claude-powered)
//
// Two phases controlled by the PHASE constant below:
//   - "prelaunch"  → 2 tweets/day, no puzzle CTA yet (hype + fun facts)
//   - "launch"    → 1 tweet/day promoting the daily puzzle
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
const ANTHROPIC_MODEL = 'claude-haiku-4-5';   // cheap + fast (~$0.0008 / tweet)

// ⚙️ FLIP THIS WHEN YOU LAUNCH THE PUZZLE
// "prelaunch" → 2 tweets/day, no statedoku.com link, no #Statedoku hashtag (yet)
// "launch"    → 1 tweet/day, promoting the daily puzzle with link
const PHASE = 'prelaunch';

// Public launch date. Drives the countdown / "imminent" phrasing in prelaunch.
const LAUNCH_DATE = '2026-06-01';
const TEASER_URL = 'https://statedoku.com/launch/';

function _daysUntilLaunch() {
  const now = new Date();
  const launch = new Date(LAUNCH_DATE + 'T13:00:00Z'); // 9am ET
  return Math.ceil((launch - now) / 86400000);
}

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

// ───── Prompts ───────────────────────────────────────────────────────────
const PRELAUNCH_PERSONA = `You run the @Statedoku Twitter account.

Statedoku is a NEW daily puzzle game launching soon — it mixes Sudoku grid logic with US geography (players fill a 3×3 grid with US states that satisfy row+column constraints). The game is NOT live yet — we're building hype and an audience first.

The ONLY goal right now: tease that something is coming. Build curiosity. Make people want to follow the account to find out what it is. Do NOT reveal the rules of the game. Do NOT explain it's a puzzle. Stay mysterious but fun.

Voice: casual, witty, slightly nerdy, mysterious. Like a friend dropping hints about a project they're cooking. Curious and playful. NEVER corporate. NEVER use em-dashes or fancy unicode dashes.

Hard rules (every tweet):
- Under 270 characters total.
- MUST include exactly one US flag emoji 🇺🇸 somewhere in the tweet.
- 1-2 emojis MAX TOTAL (so 🇺🇸 + at most one other).
- Sound human (use contractions, mix sentence lengths).
- For countdown tweets (1-2 days before launch), you MAY include this URL: ${TEASER_URL}
- For all other prelaunch tweets, do NOT include any link.
- Do NOT use the hashtag #Statedoku yet (we keep it for launch).
- Do NOT mention "statedoku.com" or call to play — the game isn't live yet.
- Do NOT explain what the game is or how it works.
- Do NOT wrap the tweet in quotes.
- Output ONLY the tweet text, no explanations, no preamble.`;

// PRELAUNCH — "something's coming" teasers. The style chosen depends on how
// many days remain until LAUNCH_DATE so the tweets escalate naturally:
//   ≥7 days  → mysterious, no hints
//   3-6 days → start hinting at the form ("daily", "US states")
//   1-2 days → explicit countdown with the date
//   0 days   → launch day fallback (PHASE flip recommended)
const PRELAUNCH_FAR = [
  'a short cryptic "something\'s coming" teaser — no details, just hype',
  'an "incoming" type post — mysterious, hints at a project for US geography fans',
  'a one-liner that hints at a new daily ritual coming soon for state-heads',
  'a teaser comparing the unnamed thing to NYT-style daily games (Wordle / Connections) — vague, not revealing what it is',
  'a teaser that addresses geography nerds directly ("if you know your states, stay tuned")',
  'a "save this account" / "follow if you like..." style soft CTA without explaining what\'s coming',
  'a playful "guess what we\'re building" type post — invites curiosity, refuses to spoil',
];

const PRELAUNCH_NEAR = [
  'a teaser that drops the hint that something for US geography fans is launching this month — still vague, still no link',
  'an "almost time" post — hints we\'re days away, builds anticipation',
  'a "you\'ll know it when you see it" type tease — confident, playful',
  'a "bookmark this account" style nudge — landing this week, no link yet',
  'a "pulling up the chairs" type post — final preparations, something dropping soon',
];

const PRELAUNCH_COUNTDOWN = (daysLeft) => [
  `a hype tweet revealing the launch is on Monday May 25 — ${daysLeft} day${daysLeft === 1 ? '' : 's'} to go. No link yet but use the date.`,
  `an "almost here" tweet ${daysLeft === 1 ? 'with the launch day TOMORROW' : 'with the launch in ' + daysLeft + ' days'}. Build excitement, mention May 25 specifically.`,
];

const LAUNCH_STYLES = [
  'a punchy daily reminder that today\'s puzzle is live',
  'a "did you know" geography fact about a US state, that ties to the game',
  'an engagement question / poll for state-heads to reply to',
  'a single-state spotlight with 3-4 surprising facts and a CTA to play',
  'a Wordle/Connections-style comparison post explaining why Statedoku is different',
  'a meme-y / playful post about US geography knowledge',
  'a brag-about-streak post inviting others to share their results',
];

function _todayDateStr() { return new Date().toISOString().slice(0, 10); }
function _dayOfYear(d) { return Math.floor((d - new Date(d.getFullYear(), 0, 0)) / 86400000); }

// Pick which prompt to send to Claude based on phase + current UTC hour.
function buildPrompt() {
  const now = new Date();
  const dateLong = now.toLocaleDateString('en-US', { weekday: 'long', month: 'long', day: 'numeric' });
  const doy = _dayOfYear(now);
  const utcHour = now.getUTCHours();

  if (PHASE === 'prelaunch') {
    const isMorningSlot = utcHour < 15;
    const daysLeft = _daysUntilLaunch();

    // Pick the right escalation tier
    let pool;
    if (daysLeft >= 7) pool = PRELAUNCH_FAR;
    else if (daysLeft >= 3) pool = PRELAUNCH_NEAR;
    else if (daysLeft >= 1) pool = PRELAUNCH_COUNTDOWN(daysLeft);
    else pool = PRELAUNCH_FAR; // safety: if PHASE wasn't flipped on launch day

    const idx = (doy * 2 + (isMorningSlot ? 0 : 5)) % pool.length;
    const style = pool[idx];

    return `${PRELAUNCH_PERSONA}

Today is ${dateLong}. Launch day is Monday May 25 (${daysLeft} day${daysLeft === 1 ? '' : 's'} away).

Write ONE tweet for ${isMorningSlot ? 'this morning' : 'this evening'} in this style: ${style}.`;
  }

  // LAUNCH phase — promotes the live puzzle with link + hashtag
  const style = LAUNCH_STYLES[doy % LAUNCH_STYLES.length];
  return `You write the daily tweet for @Statedoku — a free daily puzzle game (${SITE_URL}) that mixes Sudoku grid logic with US geography. Players fill a 3×3 grid with US states matching row + column constraints, like "Pacific coast × Borders Mexico = California". 3 mistakes allowed.

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
}

async function generateTweetText(env) {
  const prompt = buildPrompt();
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

  if (dryRun) return { dry_run: true, phase: PHASE, source, tweet };

  const result = await postTweet(tweet, env);
  return { phase: PHASE, source, tweet, result };
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
