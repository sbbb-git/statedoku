// In-memory rate-limiter shared by Pages Functions.
// Each Cloudflare Worker isolate has its own Map (eventual consistency across
// regions), so this is a best-effort guardrail against naive flooding — not a
// fortress. For tighter limits, use Cloudflare KV or a dedicated Rate Limit rule.

const _buckets = new Map(); // key -> { count, resetAt }

export function rateLimit(key, limit = 5, windowMs = 60_000) {
  const now = Date.now();
  // Lazy cleanup so the Map doesn't grow forever
  if (_buckets.size > 10_000) {
    for (const [k, v] of _buckets) if (v.resetAt < now) _buckets.delete(k);
  }
  const entry = _buckets.get(key);
  if (!entry || entry.resetAt < now) {
    _buckets.set(key, { count: 1, resetAt: now + windowMs });
    return { ok: true, remaining: limit - 1, resetAt: now + windowMs };
  }
  entry.count++;
  if (entry.count > limit) return { ok: false, remaining: 0, resetAt: entry.resetAt };
  return { ok: true, remaining: limit - entry.count, resetAt: entry.resetAt };
}

export function getClientIp(request) {
  return request.headers.get('cf-connecting-ip')
      || request.headers.get('x-real-ip')
      || 'unknown';
}
