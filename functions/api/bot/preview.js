// Statedoku Bot — preview the tweet Claude would generate (no posting)
// Required env: ANTHROPIC_API_KEY, STATS_ADMIN_KEY
// Required binding: BOT_KV

const SITE_URL = 'https://statedoku.com';
const KV_KEY = 'bot:config';

const DEFAULT_STYLES = [
  "a punchy reminder that today's puzzle is live",
  'a "did you know" geography fact about a US state',
  'an engagement question for state-heads',
  'a single-state spotlight with 3-4 surprising facts',
  'a Wordle/Connections comparison',
  'a meme-y playful post about US geography',
  'a streak/brag invitation',
];

function _checkAuth(request, env) {
  const url = new URL(request.url);
  const key = url.searchParams.get('key') || request.headers.get('x-admin-key');
  return env.STATS_ADMIN_KEY && key === env.STATS_ADMIN_KEY;
}

export async function onRequest({ request, env }) {
  if (!_checkAuth(request, env)) return new Response('Forbidden', { status: 403 });
  if (!env.ANTHROPIC_API_KEY) return new Response('ANTHROPIC_API_KEY missing', { status: 500 });

  const url = new URL(request.url);
  const dateStr = url.searchParams.get('date') || new Date().toISOString().slice(0, 10);

  // Load config from KV
  let config = {};
  if (env.BOT_KV) {
    const raw = await env.BOT_KV.get(KV_KEY);
    if (raw) config = JSON.parse(raw);
  }

  const persona = config.persona || '';
  const styles = config.styles || DEFAULT_STYLES;
  const override = config.overrides?.[dateStr] || null;

  const date = new Date(dateStr + 'T12:00:00Z');
  const dateLong = date.toLocaleDateString('en-US', { weekday: 'long', month: 'long', day: 'numeric' });
  const dayOfYear = Math.floor((date - new Date(date.getFullYear(), 0, 0)) / 86400000);
  const style = override || styles[dayOfYear % styles.length];

  const prompt = `${persona}

TODAY: ${dateLong}.

WRITE ONE TWEET in this style: ${style}.

End with the URL: ${SITE_URL}
Output ONLY the tweet, no quotes, no explanation.`;

  const resp = await fetch('https://api.anthropic.com/v1/messages', {
    method: 'POST',
    headers: {
      'x-api-key': env.ANTHROPIC_API_KEY,
      'anthropic-version': '2023-06-01',
      'content-type': 'application/json',
    },
    body: JSON.stringify({
      model: 'claude-haiku-4-5',
      max_tokens: 400,
      messages: [{ role: 'user', content: prompt }],
    }),
  });

  if (!resp.ok) {
    return new Response(JSON.stringify({ error: `Claude ${resp.status}`, details: await resp.text() }), {
      status: 502, headers: { 'content-type': 'application/json' }
    });
  }
  const json = await resp.json();
  let tweet = (json.content?.[0]?.text || '').trim();
  if (tweet.length > 280) tweet = tweet.slice(0, 277) + '…';

  return new Response(JSON.stringify({
    date: dateStr,
    style_used: style,
    is_override: !!override,
    tweet,
    char_count: tweet.length,
    prompt_sent: prompt,
  }, null, 2), {
    headers: { 'content-type': 'application/json' }
  });
}
