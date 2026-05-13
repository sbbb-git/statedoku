// Statedoku — POST /api/events
// Receives game events from the client (puzzle_start, puzzle_solve, puzzle_lost).
// Anonymous — no IP stored, only the cf-ipcountry header (country-level).
// Bindings required (set in Cloudflare Pages → Settings → Functions):
//   - STATS_DB (D1 database)

const ALLOWED_EVENTS = ['puzzle_start', 'puzzle_solve', 'puzzle_lost'];

export async function onRequestPost({ request, env }) {
  if (!env.STATS_DB) {
    return new Response('STATS_DB binding missing', { status: 500 });
  }

  let body;
  try {
    body = await request.json();
  } catch {
    return new Response('Invalid JSON', { status: 400 });
  }

  if (!body || !ALLOWED_EVENTS.includes(body.event_type)) {
    return new Response('Invalid event_type', { status: 400 });
  }
  if (!body.puzzle_date || !/^\d{4}-\d{2}-\d{2}$/.test(body.puzzle_date)) {
    return new Response('Invalid puzzle_date', { status: 400 });
  }

  const country = request.headers.get('cf-ipcountry') || null;
  const lang = (body.lang || 'en').toString().slice(0, 5);
  const timeSec = Number.isInteger(body.time_seconds) ? body.time_seconds : null;
  const mistakes = Number.isInteger(body.mistakes) ? body.mistakes : null;

  try {
    await env.STATS_DB.prepare(
      `INSERT INTO events (event_type, puzzle_date, timestamp, country, lang, time_seconds, mistakes)
       VALUES (?, ?, ?, ?, ?, ?, ?)`
    ).bind(body.event_type, body.puzzle_date, Date.now(), country, lang, timeSec, mistakes).run();
  } catch (e) {
    return new Response('DB error: ' + e.message, { status: 500 });
  }

  return new Response(null, { status: 204 });
}

// Optional GET for health check
export async function onRequestGet() {
  return new Response('ok', { status: 200 });
}
