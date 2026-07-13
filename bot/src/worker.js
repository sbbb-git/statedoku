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
const PHASE = 'launch';

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
  `a hype tweet revealing the launch is on Monday June 1 — ${daysLeft} day${daysLeft === 1 ? '' : 's'} to go. No link yet but use the date.`,
  `an "almost here" tweet ${daysLeft === 1 ? 'with the launch day TOMORROW' : 'with the launch in ' + daysLeft + ' days'}. Build excitement, mention June 1 specifically.`,
];

// Voice variety pool. Picked pseudo-randomly per slot. NEVER pick the same
// style two consecutive days (handled by `_pickStyleAvoidingRecent`).
const LAUNCH_STYLES = [
  'a single sharp question to your followers about a specific state. one sentence, no setup. e.g. "name 5 states with no ocean coast. go."',
  'a self-deprecating one-liner: confess one US-geography blank spot you (the bot persona) had this week, casually.',
  'a tiny scene from today\'s puzzle: one constraint pair and the state that fits. concrete, not abstract. no comparisons to other games.',
  'a "this state has more X than entire Y" surprising-stat one-liner, with the actual number.',
  'a weather/season tie-in for today\'s date. mention one state where the weather is doing something notable right now.',
  'a one-line geography hot take. opinionated, mildly contrarian, friendly. no rage bait.',
  'a tiny "today i learned" with one real surprising fact about a state\'s capital, river, or border. no "did you know".',
  'a single line of geography wordplay or pun about a state name or capital. funny without trying too hard.',
  'a friendly nudge to people stuck on today\'s puzzle: hint at the kind of thinking that helps, without spoiling.',
  'a one-state spotlight: 2 short lines, weird unique fact + CTA.',
  'a personal-sounding line about why daily puzzles are good for your brain. no clichés about "neurons".',
  'a snippet of school-trivia nostalgia: "remember when you had to memorize state capitals in 5th grade? today\'s puzzle would have helped."',
  'a one-line "what state am i?" tease using 2-3 quirky clues. answer is hidden in the puzzle of the day.',
  'a one-line riff on a current-month theme (summer roadtrip / fall foliage / spring storms / winter pass closures) that ties to a specific state.',
  'a short tweet calling out a famous state-border quirk (e.g. the Four Corners, Bristol TN/VA, North Carolina–South Carolina island swap).',
  'a one-line callout of a tiny, often-overlooked state with one genuine reason it punches above its weight.',
  'a "people forget that" reminder of a real but counterintuitive geography fact, in a chill tone.',
  'a one-line streak brag. talk about your own (the bot\'s) streak, invite people to share theirs.',
  'a tiny puzzle teaser: one of today\'s constraints + an invitation to try.',
  'a wholesome line about a US state most people underrate. no superlatives, just a specific reason.',
  'a one-line invitation framed around a coffee/lunch break (e.g. "between meetings? 90 seconds of geography").',
  'a quick "spot the lie" with two true state facts and one false, ask people to guess.',
];

// Pick a style index. Day-of-year + slot give a stable rotation across
// daily cron firings, but each manual/dry-run call adds a small random
// offset so we don't keep replaying the same template when testing.
function _pickStyleAvoidingRecent(doy, slotIdx, listLen) {
  const base = ((doy * 31) + slotIdx * 7) % listLen;
  const jitter = Math.floor(Math.random() * 5);
  return (base + jitter) % listLen;
}

function _todayDateStr() { return new Date().toISOString().slice(0, 10); }
function _dayOfYear(d) { return Math.floor((d - new Date(d.getFullYear(), 0, 0)) / 86400000); }

// Fetch a random fun fact about a US state from the live site.
// Returns null on any failure (so the bot can fall back to a teaser).
async function pickRandomFunFact() {
  try {
    const resp = await fetch(`${SITE_URL}/data/facts.json`, { cf: { cacheTtl: 3600 } });
    if (!resp.ok) return null;
    const facts = await resp.json();
    if (!Array.isArray(facts) || !facts.length) return null;
    return facts[Math.floor(Math.random() * facts.length)];
  } catch {
    return null;
  }
}

// Build a fun-fact tweet prompt. Used in prelaunch (evening slot) + launch (every other day).
function buildFunFactPrompt(fact, isPrelaunch, dateLong, daysLeft = 0) {
  const personaCore = `You run the @Statedoku Twitter account. Drop one US geography fact in a way that feels human, not LinkedIn-influencer.

VOICE:
- One thought, one tweet. Don't pack three.
- Short sentences. Fragments are good. Vary length wildly.
- Lowercase or sentence-case starts are both fine.
- Real contractions (it's, don't, you're).
- Specific names, numbers, places. Never abstract.

HARD BANS (these scream bot, never use):
- NO em-dashes (no "—"), no en-dashes (no "–"), no spaced-hyphen pauses (no " - "). Use commas, periods, or line breaks.
- NO triadic mirror sentences like "X is A. Y is B. Z is C."
- NO ALL-CAPS WORDS for emphasis.
- NO "🧩", "✨", "🎯", "🚀", "💡". Only 🇺🇸 plus maybe one of 🗺️ 🏔️ 🌊 🌽 🦅 🪐 🛣️.
- NO "Fun fact", "Did you know", "Plot twist:", "Honestly,", "Yeah, basically", "Picture this:", "Let's be honest,".
- NO marketing-speak.

REQUIREMENTS:
- Under 250 characters total.
- Exactly one 🇺🇸 somewhere.
- At most one extra emoji from the allowed list.
- Do NOT wrap in quotes.
- Output ONLY the tweet text, no preamble.`;

  const ctx = isPrelaunch
    ? `Today is ${dateLong}. The Statedoku puzzle launches in ${daysLeft} day${daysLeft === 1 ? '' : 's'} (June 1). Do NOT include any link or hashtag yet. You can hint that something is coming (one short line), but the fact is the star.`
    : `Today is ${dateLong}. Statedoku is the daily US states puzzle, live at ${SITE_URL}. End with: a brief CTA (e.g. "Today's puzzle: ${SITE_URL}") and the hashtag #Statedoku.`;

  return `${personaCore}

${ctx}

Fact to base your tweet on (rephrase it, don't copy verbatim):
"${fact.text}"
(state: ${fact.state}${fact.abbr ? ', ' + fact.abbr : ''})

Write ONE tweet now.`;
}

// Pick which prompt to send to Claude based on phase + current UTC hour.
async function buildPrompt() {
  const now = new Date();
  const dateLong = now.toLocaleDateString('en-US', { weekday: 'long', month: 'long', day: 'numeric' });
  const doy = _dayOfYear(now);
  const utcHour = now.getUTCHours();
  const isMorningSlot = utcHour < 15;

  if (PHASE === 'prelaunch') {
    const daysLeft = _daysUntilLaunch();

    // MIX: morning slot = teaser/hype. Evening slot = fun fact.
    // This guarantees variety and gives followers both vibes.
    if (!isMorningSlot) {
      const fact = await pickRandomFunFact();
      if (fact) return buildFunFactPrompt(fact, true, dateLong, daysLeft);
      // else fall through to teaser if fetch failed
    }

    // Teaser tier escalation by days-to-launch
    let pool;
    if (daysLeft >= 7) pool = PRELAUNCH_FAR;
    else if (daysLeft >= 3) pool = PRELAUNCH_NEAR;
    else if (daysLeft >= 1) pool = PRELAUNCH_COUNTDOWN(daysLeft);
    else pool = PRELAUNCH_FAR;

    const idx = (doy * 2 + (isMorningSlot ? 0 : 5)) % pool.length;
    const style = pool[idx];

    return `${PRELAUNCH_PERSONA}

Today is ${dateLong}. Launch day is Monday June 1 (${daysLeft} day${daysLeft === 1 ? '' : 's'} away).

Write ONE tweet for ${isMorningSlot ? 'this morning' : 'this evening'} in this style: ${style}.`;
  }

  // LAUNCH phase — alternate every other day between fun-fact and puzzle CTA
  if (doy % 2 === 0) {
    const fact = await pickRandomFunFact();
    if (fact) return buildFunFactPrompt(fact, false, dateLong);
  }
  const slotIdx = utcHour < 15 ? 0 : 1;
  const style = LAUNCH_STYLES[_pickStyleAvoidingRecent(doy, slotIdx, LAUNCH_STYLES.length)];
  return `You write the daily tweet for @Statedoku, a free daily US-states puzzle (${SITE_URL}). Players fill a 3x3 grid with states satisfying row+column constraints like "Pacific coast x Borders Mexico = California". 3 mistakes allowed. The site is live.

Today is ${dateLong}.

STYLE FOR THIS TWEET: ${style}

VOICE (must feel like a real person):
- Lowercase or sentence-case starts are fine. Real humans don't always capitalize.
- Short sentences. Fragments are good. Vary sentence length wildly.
- Use contractions (it's, don't, you're).
- Be specific, not abstract. Name actual states, capitals, numbers.
- One thought per tweet. Don't pack three.

HARD BANS (these are AI-tells, never use them):
- NO em-dashes (no "—"), no en-dashes (no "–"), no spaced-hyphen pauses (no " - ").
  Use commas, periods, or new lines instead.
- NO triadic mirror structures like "X does A. Y does B. Z does C." That pattern screams bot.
- NO ALL-CAPS WORDS for emphasis (no AND, OR, NOT, BUT, just AND, etc.).
- NO "🧩", "✨", "🎯", "🚀", "💡", or other puzzle/app cliché emojis. ONLY 🇺🇸 plus maybe one geographic emoji (🗺️, 🏔️, 🌊, 🌽).
- NO opener phrases: "Let's be honest,", "Yeah, basically", "Honestly,", "Plot twist:", "Fun fact:", "Did you know", "Picture this:", "Imagine if".
- NO "make you think", "makes you feel", "where X meets Y".
- NO comparisons to Wordle/Connections/NYT every tweet. Allowed maybe once a week, not more.
- NO marketing speak: no "the daily puzzle that...", "perfect for...", "designed to...", "join thousands of".

REQUIREMENTS:
- Under 250 characters total (leave room for URL + hashtag).
- Include exactly one 🇺🇸 somewhere (anywhere).
- At most ONE additional emoji, and only from this list: 🗺️ 🏔️ 🌊 🌽 🦅 🪐 🛣️
- Include the hashtag #Statedoku once (lowercase #statedoku also fine).
- Include the URL once: ${SITE_URL}
- Do NOT wrap the tweet in quotes.
- Output ONLY the tweet text, no explanations or preamble.`;
}

async function generateTweetText(env) {
  const prompt = await buildPrompt();
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
  text = humanize(text);
  if (text.length > 280) text = text.slice(0, 277) + '…';
  return text;
}

// Deterministic post-processor: even when Claude slips, strip the
// dead-giveaway AI tells. Prompt + post-processing is more reliable
// than prompt alone.
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
async function _runOnce(env, { dryRun = false, customText = null } = {}) {
  let tweet;
  let source = 'claude';
  if (customText) {
    tweet = humanize(customText);
    source = 'custom';
  } else {
    try {
      tweet = await generateTweetText(env);
    } catch (e) {
      console.error('[Statedoku Bot] Claude failed, using fallback:', e.message);
      tweet = fallbackTweet();
      source = 'fallback';
    }
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
