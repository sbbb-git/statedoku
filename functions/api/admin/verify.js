// GET /api/admin/verify with header X-Admin-Key
// 204 when the key is the admin API key (or the stats key), 403 otherwise.
// js/admin.js asks this before switching the browser dev panel on. Until
// 29 October 2026 the panel compared a SHA-256 of the password with a hash
// published in config.js, which every visitor downloaded and anyone could
// brute-force offline; now nothing secret ships to the browser.
import { keyMatches, adminKey } from '../../_shared/auth.js';
import { rateLimit, getClientIp } from '../../_shared/ratelimit.js';

export async function onRequestGet({ request, env }) {
  const rl = rateLimit('admin-verify:' + getClientIp(request), 10, 60_000);
  if (!rl.ok) return new Response(null, { status: 429 });
  const k = adminKey(request);
  const ok = keyMatches(k, env.ADMIN_API_KEY) || keyMatches(k, env.STATS_ADMIN_KEY);
  return new Response(null, { status: ok ? 204 : 403, headers: { 'cache-control': 'no-store' } });
}
