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

Statedoku is a NEW daily puzzle game launching soon — it mixes Sudoku grid logic with US geography (players fill a 3×3 grid with US states that satisfy row+column constraints). The game is NOT live yet, so we're building an audience first.

Voice: casual, witty, slightly nerdy. Like a friend who's obsessed with US geography facts and is excited to share them. Curious and playful. NEVER corporate. NEVER use em-dashes or fancy unicode dashes.

Hard rules (every tweet):
- Under 270 characters total.
- 1-2 emojis max (no emoji spam, no flag overload).
- Sound human (use contractions, mix sentence lengths).
- Do NOT include any link or URL.
- Do NOT use the hashtag #Statedoku yet (we keep it for launch).
- Do NOT mention "statedoku.com" or call to play — the game isn't live yet.
- Do NOT wrap the tweet in quotes.
- Output ONLY the tweet text, no explanations, no preamble.`;

// Two distinct tweet types, used at different times of the day.
const PRELAUNCH_MORNING_STYLES = [
  'a teaser "something\'s coming" post hinting at a new daily geography game, without revealing details',
  'a relatable observation about how bad most Americans (or non-Americans) are at US geography, ending with a hint that help is coming',
  'a poll-style question that gets state-heads to reply (e.g. "name a state without using its first letter")',
  'an "incoming" / "soon" type post building hype, mysterious but fun',
  'a pop-culture comparison (Wordle, Connections, NYT games) framing why daily games are great, hinting a new one is coming',
  'a hot take or playful opinion about a US geography topic (best state shape, weirdest border, etc.)',
  'a "tell me you\'re from [region] without telling me you\'re from [region]" style prompt',
];

const PRELAUNCH_EVENING_STYLES = [
  'a surprising fun fact about a single US state (history, geography, name origin, weird law, etc.) — pick a non-obvious one',
  'a "did you know" about US state borders, shapes, or geography quirks',
  'a fact about a state capital (origin of the name, oddities, smallest/largest, etc.)',
  'a fact about state names: native origins, royal references, what they actually mean',
  'a comparison between two states that share something weird (same shape, share a border, name twins, etc.)',
  'a fact about US regions, belts (Sun Belt, Rust Belt, Bible Belt, etc.) or unofficial geographic groupings',
  'a number-based geography fact (e.g. "the smallest state is 245× smaller than the largest", "X states have a Pacific coast", etc.)',
  'a quirky superlative (the only state that..., the state with the most..., the only one shaped like...)',
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
    // Mornings (12:00 UTC slot) → hype/teaser. Evenings (18:00 UTC slot) → fun fact.
    const isMorningSlot = utcHour < 15;
    const styleList = isMorningSlot ? PRELAUNCH_MORNING_STYLES : PRELAUNCH_EVENING_STYLES;
    // Rotate independently within each slot so morning and evening don't echo
    const style = styleList[(doy + (isMorningSlot ? 0 : 3)) % styleList.length];

    return `${PRELAUNCH_PERSONA}

Today is ${dateLong}.

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
    const facts = [
      'Rhode Island is so small you can drive across it in about 45 minutes 🚗',
      'Alaska has more coastline than the rest of the US states combined.',
      'Hawaii is the only state that grows coffee commercially ☕',
      'Maine is the only US state whose name is just one syllable.',
      'Wyoming has fewer people than 31 individual US cities.',
    ];
    return facts[Math.floor(Math.random() * facts.length)];
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
