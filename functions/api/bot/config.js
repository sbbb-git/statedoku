// Statedoku Bot — config endpoint (GET + POST)
// Stored in Cloudflare KV (binding: BOT_KV). Shared with the Worker.
// Admin-auth required (STATS_ADMIN_KEY).

const KV_KEY = 'bot:config';

const DEFAULT_CONFIG = {
  persona: `You are the Statedoku Twitter agent. You write daily tweets for the @Statedoku account on X.

Statedoku is a free daily web puzzle (statedoku.com) that combines Sudoku grid logic with US geography. Players fill a 3×3 grid with US states matching row + column constraints (like "Pacific coast × Borders Mexico = California"). 3 mistakes allowed.

Voice: casual, witty, slightly nerdy. Like a friend who's into US geography but not preachy. Mix of curiosity and play. Never corporate or sales-y. Never use em-dashes.

Always:
- Include #Statedoku hashtag
- Include the URL https://statedoku.com
- Stay under 270 characters
- 1-2 emojis max per tweet (don't spam)
- Sound human (mix sentence structures, contractions OK)`,

  styles: [
    'a punchy reminder that today\\'s puzzle is live, mention the day of week casually',
    'a "did you know" geography fact about a US state, that ties to a Statedoku constraint',
    'an engagement question or poll for state-heads to reply to',
    'a single-state spotlight with 3-4 surprising facts and a CTA to play',
    'a Wordle/Connections-style comparison post explaining why Statedoku is different',
    'a meme-y / playful post about US geography knowledge gaps',
    'a streak/brag invitation: "share your result today" type post',
  ],

  overrides: {},          // { "2026-05-15": "Today is Mother's Day in France...", ... }
  approval_required: false, // if true: cron only generates + saves to pending, doesn't post
};

function _checkAuth(request, env) {
  const url = new URL(request.url);
  const key = url.searchParams.get('key') || request.headers.get('x-admin-key');
  return env.STATS_ADMIN_KEY && key === env.STATS_ADMIN_KEY;
}

export async function onRequestGet({ request, env }) {
  if (!_checkAuth(request, env)) return new Response('Forbidden', { status: 403 });
  if (!env.BOT_KV) return new Response('BOT_KV binding missing', { status: 500 });

  const raw = await env.BOT_KV.get(KV_KEY);
  const config = raw ? JSON.parse(raw) : DEFAULT_CONFIG;
  // Also include the current pending tweet (if any)
  const pending = await env.BOT_KV.get('bot:pending');
  return new Response(JSON.stringify({ config, pending: pending ? JSON.parse(pending) : null, defaults: DEFAULT_CONFIG }, null, 2), {
    headers: { 'content-type': 'application/json' },
  });
}

export async function onRequestPost({ request, env }) {
  if (!_checkAuth(request, env)) return new Response('Forbidden', { status: 403 });
  if (!env.BOT_KV) return new Response('BOT_KV binding missing', { status: 500 });

  let body;
  try { body = await request.json(); }
  catch { return new Response('Invalid JSON', { status: 400 }); }

  const existing = await env.BOT_KV.get(KV_KEY);
  const current = existing ? JSON.parse(existing) : DEFAULT_CONFIG;
  // Merge — only overwrite provided fields
  const merged = {
    ...current,
    ...body,
    overrides: { ...current.overrides, ...(body.overrides || {}) },
  };
  await env.BOT_KV.put(KV_KEY, JSON.stringify(merged));
  return new Response(JSON.stringify({ ok: true, config: merged }, null, 2), {
    headers: { 'content-type': 'application/json' },
  });
}
