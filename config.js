const CONFIG = {
  // Cache-buster for the JSON files under /data/. Those are fetched at runtime,
  // so without a version query a returning player keeps the copy their browser
  // cached and never sees updated translations or state data. Bump on edit.
  DATA_VERSION: '10',

  // Global feature flags
  ADS_ENABLED: false,                // false → no ads rendered. Toggle to true once AdSense approves + slot IDs are pasted into placeholders. See /ADS-ACTIVATION.md
  ADSENSE_PUBLISHER_ID: 'ca-pub-1481624152917622',  // real publisher ID (June 2026). Site verification snippet is in <head> of the 3 homepages.

  // Cloudflare Web Analytics token (server-side, complements GA4)
  // Get it at https://dash.cloudflare.com/?to=/:account/web-analytics
  // Paste the token from data-cf-beacon='{"token":"XXX"}' here, then commit + push.
  CF_ANALYTICS_TOKEN: '9aaf696fd1464b2191238f4787ceca5c',

  // Ahrefs Web Analytics, free, complements CF Analytics with SEO referrer data
  // (Google query keywords, backlink-driven traffic, etc.).
  // Get the data-key at https://app.ahrefs.com/web-analytics
  AHREFS_KEY: '2EFX1+9bkFd8gDk9CVLD4A',

  // Microsoft Clarity, free session replays + heatmaps + scroll maps.
  // Shows WHERE users click/rage-click and how far they scroll. Get the ID
  // at https://clarity.microsoft.com (project settings → tracking code).
  CLARITY_ID: 'wxvtsnx9h8',

  // The dev panel (#admin) asks /api/admin/verify, which checks the admin API
  // key on the server. No password hash ships to the browser any more.

  // i18n + storage
  DEFAULT_LANG: 'en',
  SUPPORTED_LANGS: ['en', 'fr', 'es'],
  GAME_NAME: 'Statedoku',
  VERSION: '1.0.0',
  STORAGE_KEY: 'statedoku_v1',
};

// 
// Cloudflare Web Analytics auto-loader.
// Injects the beacon only if a valid token is set.
// Skips /admin/* paths (internal dashboard pollutes stats) and localhost dev.
// 
(function() {
  const tok = CONFIG.CF_ANALYTICS_TOKEN;
  if (!tok || tok.startsWith('INSERT_')) return;

  // Skip admin pages, they're internal tooling, not real traffic.
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

// 
// Ahrefs Web Analytics auto-loader.
// Provides search-referrer + backlink-driven traffic data that CF doesn't.
// Same skip rules: no admin, no localhost.
// 
(function() {
  const key = CONFIG.AHREFS_KEY;
  if (!key || key.startsWith('INSERT_')) return;

  // Skip admin pages, internal tooling, shouldn't inflate SEO stats.
  if (location.pathname.startsWith('/admin/') || location.pathname.startsWith('/admin')) return;

  // Skip local dev.
  const host = location.hostname;
  if (host === 'localhost' || host === '127.0.0.1' || host.endsWith('.local') || location.protocol === 'file:') return;

  // Skip if the page already includes the Ahrefs inline snippet (home pages do
  // this so the Ahrefs install verifier finds the script in raw HTML).
  if (document.querySelector('script[src*="analytics.ahrefs.com"]')) return;

  const s = document.createElement('script');
  s.async = true;
  s.src = 'https://analytics.ahrefs.com/analytics.js';
  s.setAttribute('data-key', key);
  (document.head || document.documentElement).appendChild(s);
})();

//
// Consent (29 October 2026). Google Analytics and Microsoft Clarity set
// cookies, so under the CNIL rules that bind a publisher based in France they
// load only after the visitor accepts. Cloudflare Web Analytics, Ahrefs Web
// Analytics and the game's own counts (/api/events) set none and run for
// everyone: they are the complete count, GA4 only sees those who accepted.
// The choice is kept six months, then asked again. Refusing is one click, as
// is accepting, and the "Cookies" link added to every footer reopens it.
// The inline GA block in each page's <head> reads the same key and loads
// gtag.js only when it says yes.
//
const Consent = (() => {
  const KEY = 'statedoku_consent';
  const TTL = 182 * 86400000;
  const GA_ID = 'G-P7ZBQNYLS4';
  const TEXT = {
    en: { msg: 'Statedoku would like to use Google Analytics and Microsoft Clarity to see how the site is used. Both set cookies. Everything works the same either way.',
          yes: 'Accept', no: 'Decline', more: 'Privacy', link: 'Cookies', priv: '/privacy/' },
    fr: { msg: "Statedoku aimerait utiliser Google Analytics et Microsoft Clarity pour voir comment le site est utilisé. Tous deux déposent des cookies. Tout fonctionne pareil dans les deux cas.",
          yes: 'Accepter', no: 'Refuser', more: 'Confidentialité', link: 'Cookies', priv: '/fr/privacy/' },
    es: { msg: 'A Statedoku le gustaría usar Google Analytics y Microsoft Clarity para ver cómo se usa el sitio. Ambos usan cookies. Todo funciona igual en los dos casos.',
          yes: 'Aceptar', no: 'Rechazar', more: 'Privacidad', link: 'Cookies', priv: '/es/privacy/' },
  };

  function _skip() {
    const host = location.hostname;
    return location.pathname.startsWith('/admin') || host === 'localhost' || host === '127.0.0.1' ||
      host.endsWith('.local') || location.protocol === 'file:';
  }
  function get() {
    try {
      const c = JSON.parse(localStorage.getItem(KEY) || 'null');
      return c && (c.v === 'yes' || c.v === 'no') && Date.now() - c.t < TTL ? c.v : null;
    } catch (e) { return null; }
  }
  function _save(v) {
    try { localStorage.setItem(KEY, JSON.stringify({ v, t: Date.now() })); } catch (e) {}
  }

  function _loadAnalytics() {
    if (_skip()) return;
    if (!document.querySelector('script[src*="googletagmanager.com/gtag/js"]') && typeof window.gtag === 'function') {
      const g = document.createElement('script');
      g.async = true;
      g.src = 'https://www.googletagmanager.com/gtag/js?id=' + GA_ID;
      document.head.appendChild(g);
    }
    const id = CONFIG.CLARITY_ID;
    if (id && !window.clarity) {
      (function (c, l, a, r) {
        c[a] = c[a] || function () { (c[a].q = c[a].q || []).push(arguments); };
        const t = l.createElement(r); t.async = 1; t.src = 'https://www.clarity.ms/tag/' + id + '?ref=bwt';
        const y = l.getElementsByTagName(r)[0]; y.parentNode.insertBefore(t, y);
      })(window, document, 'clarity', 'script');
      window.clarity('consentv2', { ad_Storage: 'denied', analytics_Storage: 'granted' });
    }
  }

  // Cookies already set by a past acceptance go with a refusal.
  function _clearCookies() {
    const host = location.hostname.replace(/^www\./, '');
    document.cookie.split(';').map(c => c.split('=')[0].trim())
      .filter(n => /^(_ga|_gid|_gat|_clck|_clsk|CLID|MUID)/.test(n))
      .forEach(n => {
        ['', '; domain=' + host, '; domain=.' + host].forEach(d => {
          document.cookie = n + '=; expires=Thu, 01 Jan 1970 00:00:00 GMT; path=/' + d;
        });
      });
  }

  function _style() {
    if (document.getElementById('consent-style')) return;
    const s = document.createElement('style');
    s.id = 'consent-style';
    s.textContent =
      '#consent{position:fixed;left:12px;right:12px;bottom:12px;z-index:2147483000;max-width:560px;margin:0 auto;' +
      'background:#fff;color:#1C232D;border:2px solid #1C232D;border-radius:4px;padding:12px 14px;' +
      'font:500 0.82rem/1.45 Inter,system-ui,sans-serif;box-shadow:0 6px 24px rgba(15,33,71,.18)}' +
      '#consent p{margin:0 0 10px}#consent .cs-row{display:flex;gap:8px;align-items:center;flex-wrap:wrap}' +
      '#consent button{font:700 0.85rem/1 Inter,system-ui,sans-serif;padding:10px 16px;border-radius:2px;cursor:pointer;' +
      'border:1.5px solid #0F2147;background:#fff;color:#0F2147;min-width:96px}' +
      '#consent button.cs-yes{background:#0F2147;color:#fff}' +
      '#consent a{color:#0F2147;margin-left:auto;font-size:0.8rem}' +
      '#consent button:focus-visible,#consent a:focus-visible{outline:3px solid #F59E0B;outline-offset:2px}';
    document.head.appendChild(s);
  }

  function open() {
    if (_skip() || document.getElementById('consent')) return;
    const lang = (document.documentElement.lang || 'en').slice(0, 2);
    const T = TEXT[lang] || TEXT.en;
    _style();
    const box = document.createElement('div');
    box.id = 'consent';
    box.setAttribute('role', 'region');
    box.setAttribute('aria-label', T.link);
    const p = document.createElement('p');
    p.textContent = T.msg;
    const row = document.createElement('div');
    row.className = 'cs-row';
    const no = document.createElement('button');
    no.type = 'button'; no.className = 'cs-no'; no.textContent = T.no;
    const yes = document.createElement('button');
    yes.type = 'button'; yes.className = 'cs-yes'; yes.textContent = T.yes;
    const more = document.createElement('a');
    more.href = T.priv; more.textContent = T.more;
    row.append(no, yes, more);
    box.append(p, row);
    document.body.appendChild(box);
    const was = get();
    no.addEventListener('click', () => {
      _save('no'); box.remove(); _clearCookies();
      if (was === 'yes') location.reload();   // unloads the scripts already running
    });
    yes.addEventListener('click', () => { _save('yes'); box.remove(); _loadAnalytics(); });
  }

  // A "Cookies" link at the end of every footer reopens the choice.
  function _footerLink() {
    const foot = document.querySelector('footer');
    if (!foot || foot.querySelector('.consent-link')) return;
    const lang = (document.documentElement.lang || 'en').slice(0, 2);
    const a = document.createElement('a');
    a.href = '#cookies'; a.className = 'consent-link'; a.textContent = (TEXT[lang] || TEXT.en).link;
    a.addEventListener('click', e => { e.preventDefault(); open(); });
    const line = foot.querySelector('.foot-links');
    if (line) { line.append(' · ', a); return; }
    const p = document.createElement('p');
    p.style.margin = '8px 0 0';
    p.appendChild(a);
    foot.appendChild(p);
  }

  function init() {
    if (_skip()) return;
    const v = get();
    if (v === 'yes') _loadAnalytics();
    else if (v === null) open();
    _footerLink();
    if (location.hash === '#cookies') open();
  }
  if (document.readyState === 'loading') document.addEventListener('DOMContentLoaded', init);
  else init();

  return { get, open };
})();

// 
// Helper: send a custom event to Cloudflare Web Analytics.
// Usage: window.cfTrack('puzzle_completed', { won: true, mistakes: 1 });
// Properties are stringified into a single label for CF's custom event slot.
// Safe to call even if the beacon hasn't loaded (no-ops).
// 
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
