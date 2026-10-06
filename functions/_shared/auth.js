// Admin key check shared by every /api/admin and /api/stats endpoint.
// The key is read from the X-Admin-Key header only (never the query string,
// which ends up in logs and browser history) and compared in constant time.
export function keyMatches(given, expected) {
  if (typeof given !== 'string' || typeof expected !== 'string' || !expected) return false;
  const enc = new TextEncoder();
  const a = enc.encode(given), b = enc.encode(expected);
  let diff = a.length ^ b.length;
  for (let i = 0; i < b.length; i++) diff |= (a[i % (a.length || 1)] ?? 0) ^ b[i];
  return diff === 0;
}

export function adminKey(request) {
  return request.headers.get('x-admin-key') || '';
}
