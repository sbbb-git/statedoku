const CONFIG = {
  // Global feature flags
  ADS_ENABLED: false,                // false → no ads, no consent banner. Toggle from superadmin.
  ADSENSE_PUBLISHER_ID: 'ca-pub-XXXXXXXXXXXXXXXX',

  // Cloudflare Web Analytics token (privacy-friendly, no cookies, no IPs stored)
  // Get it at https://dash.cloudflare.com/?to=/:account/web-analytics
  // Paste the token from data-cf-beacon='{"token":"XXX"}' here, then commit + push.
  CF_ANALYTICS_TOKEN: 'INSERT_YOUR_CLOUDFLARE_BEACON_TOKEN_HERE',

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
// ─────────────────────────────────────────────────────────────────────────
(function() {
  const tok = CONFIG.CF_ANALYTICS_TOKEN;
  if (!tok || tok.startsWith('INSERT_')) return;
  const s = document.createElement('script');
  s.defer = true;
  s.src = 'https://static.cloudflareinsights.com/beacon.min.js';
  s.setAttribute('data-cf-beacon', JSON.stringify({ token: tok }));
  (document.head || document.documentElement).appendChild(s);
})();
