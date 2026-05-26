const CONFIG = {
  // Global feature flags
  ADS_ENABLED: false,                // false → no ads, no consent banner. Toggle from superadmin.
  ADSENSE_PUBLISHER_ID: 'ca-pub-XXXXXXXXXXXXXXXX',

  // Cloudflare Web Analytics token (privacy-friendly, no cookies, no IPs stored)
  // Get it at https://dash.cloudflare.com/?to=/:account/web-analytics
  // Paste the token from data-cf-beacon='{"token":"XXX"}' here, then commit + push.
  CF_ANALYTICS_TOKEN: '9aaf696fd1464b2191238f4787ceca5c',

  // Ahrefs Web Analytics — free, complements CF Analytics with SEO referrer data
  // (Google query keywords, backlink-driven traffic, etc.).
  // Get the data-key at https://app.ahrefs.com/web-analytics
  AHREFS_KEY: '2EFX1+9bkFd8gDk9CVLD4A',

  // Superadmin: SHA-256 hash of the admin password.
  // ⚠️ Change immediately with: node bin/set-admin-password.mjs
  // Default password: ChangeMe_Statedoku_2026
  ADMIN_HASH: '26eb84f4a05045e38616b565f17c64185fd92f109ffa69930377ba5eebf3a0b9',

  // i18n + storage
  DEFAULT_LANG: 'en',
  SUPPORTED_LANGS: ['en', 'fr', 'es'],
  GAME_NAME: 'Statedoku',
  VERSION: '1.0.0',
  STORAGE_KEY: 'statedoku_v1',
};

// ─────────────────────────────────────────────────────────────────────────
// Cloudflare Web Analytics auto-loader.
// Injects the beacon only if a valid token is set. Privacy-safe.
// Skips /admin/* paths (internal dashboard pollutes stats) and localhost dev.
// ─────────────────────────────────────────────────────────────────────────
(function() {
  const tok = CONFIG.CF_ANALYTICS_TOKEN;
  if (!tok || tok.startsWith('INSERT_')) return;

  // Skip admin pages — they're internal tooling, not real traffic.
  if (location.pathname.startsWith('/admin/') || location.pathname.startsWith('/admin')) return;

  // Skip local dev (localhost / 127.0.0.1 / *.local / file://).
  const host = location.hostname;
  if (host === 'localhost' || host === '127.0.0.1' || host.endsWith('.local') || location.protocol === 'file:') return;

  const s = document.createElement('script');
  s.defer = true;
  s.src = 'https://static.cloudflareinsights.com/beacon.min.js';
  s.setAttribute('data-cf-beacon', JSON.stringify({ token: tok }));
  (document.head || document.documentElement).appendChild(s);
})();

// ─────────────────────────────────────────────────────────────────────────
// Ahrefs Web Analytics auto-loader.
// Provides search-referrer + backlink-driven traffic data that CF doesn't.
// Same skip rules: no admin, no localhost.
// ─────────────────────────────────────────────────────────────────────────
(function() {
  const key = CONFIG.AHREFS_KEY;
  if (!key || key.startsWith('INSERT_')) return;

  // Skip admin pages — internal tooling, shouldn't inflate SEO stats.
  if (location.pathname.startsWith('/admin/') || location.pathname.startsWith('/admin')) return;

  // Skip local dev.
  const host = location.hostname;
  if (host === 'localhost' || host === '127.0.0.1' || host.endsWith('.local') || location.protocol === 'file:') return;

  const s = document.createElement('script');
  s.async = true;
  s.src = 'https://analytics.ahrefs.com/analytics.js';
  s.setAttribute('data-key', key);
  (document.head || document.documentElement).appendChild(s);
})();

// ─────────────────────────────────────────────────────────────────────────
// Helper: send a custom event to Cloudflare Web Analytics.
// Usage: window.cfTrack('puzzle_completed', { won: true, mistakes: 1 });
// Properties are stringified into a single label for CF's custom event slot.
// Safe to call even if the beacon hasn't loaded (no-ops).
// ─────────────────────────────────────────────────────────────────────────
window.cfTrack = function cfTrack(name, props) {
  try {
    if (location.pathname.startsWith('/admin/')) return; // never track admin
    const beam = window.__cfBeacon || (window.cloudflare && window.cloudflare.beam);
    const label = props ? `${name}|${Object.entries(props).map(([k, v]) => `${k}=${v}`).join('&')}` : name;
    if (beam) {
      beam(label);
      return;
    }
    // Fallback: queue until beacon loads. CF's beacon picks up window.__cfBeacon if defined.
    (window.__cfQueue = window.__cfQueue || []).push(label);
  } catch (_) { /* swallow */ }
};
