// ─────────────────────────────────────────────────────────────────────────
// Statedoku — Embed mode (third-party iframe context)
// When loaded with ?embed=1, hide the page chrome (header, footer, ads),
// and show a small "Powered by Statedoku.com" banner that links back to
// the standalone game. Every embed = a backlink.
// ─────────────────────────────────────────────────────────────────────────
(function() {
  try {
    var params = new URLSearchParams(location.search);
    if (params.get('embed') !== '1') return;

    var inIframe;
    try { inIframe = window.self !== window.top; } catch (e) { inIframe = true; }

    var cssId = 'statedoku-embed-css';
    if (!document.getElementById(cssId)) {
      var style = document.createElement('style');
      style.id = cssId;
      style.textContent = ''
        + 'html.embed-mode body{margin:0!important;padding:0!important;background:#F7F8FB!important}'
        + 'html.embed-mode header,html.embed-mode footer,html.embed-mode nav,html.embed-mode .top-bar,html.embed-mode .bottom-band,html.embed-mode .bottom-ad-band,html.embed-mode .lang-switch,html.embed-mode [data-ad-slot],html.embed-mode .ad-slot,html.embed-mode .related-grid,html.embed-mode .play-cta,html.embed-mode .breadcrumb,html.embed-mode #subscribe-modal,html.embed-mode .post-win-modal{display:none!important}'
        + 'html.embed-mode main{padding:6px 8px 44px!important;max-width:none!important;margin:0!important}'
        + 'html.embed-mode .lt-hero{padding:6px 0 4px!important}'
        + 'html.embed-mode .lt-hero h1{font-size:1.05rem!important;margin:0 0 4px!important}'
        + 'html.embed-mode .lt-hero .sub{display:none!important}'
        + '.statedoku-embed-byline{position:fixed;left:0;right:0;bottom:0;height:32px;display:flex;align-items:center;justify-content:center;background:#0F2147;color:#fff;font-family:Inter,system-ui,sans-serif;font-size:.78rem;font-weight:700;letter-spacing:.01em;z-index:9999;box-shadow:0 -1px 0 rgba(0,0,0,.08)}'
        + '.statedoku-embed-byline a{color:#F59E0B;text-decoration:none;margin-left:6px}'
        + '.statedoku-embed-byline a:hover{text-decoration:underline}';
      (document.head || document.documentElement).appendChild(style);
    }

    document.documentElement.classList.add('embed-mode');

    function injectByline() {
      if (document.querySelector('.statedoku-embed-byline')) return;
      var bar = document.createElement('div');
      bar.className = 'statedoku-embed-byline';
      var canonical = location.origin + location.pathname;
      bar.innerHTML = 'Powered by <a href="' + canonical + '" target="_blank" rel="noopener">Statedoku.com 🇺🇸</a>';
      document.body.appendChild(bar);
    }
    if (document.body) injectByline();
    else document.addEventListener('DOMContentLoaded', injectByline);
  } catch (e) {
    // Embed-mode CSS injection failed — silently fall back to full chrome.
  }
})();

// ─────────────────────────────────────────────────────────────────────────
// Statedoku — Ads module
//
// Two-mode loader for ad slots:
//   • If CONFIG.ADS_ENABLED === false, all slots are hidden and no
//     third-party script is loaded. Site stays ad-free, no extra requests.
//   • If CONFIG.ADS_ENABLED === true, AdSense (or a fallback network like
//     Ezoic) is initialized once, and every <ins class="adsbygoogle"> or
//     [data-ad-slot] placeholder on the page is activated.
//
// Activation procedure (when you get AdSense approval):
//   1. Edit /config.js → ADS_ENABLED: true
//   2. Edit /config.js → ADSENSE_PUBLISHER_ID: 'ca-pub-XXXXXXX...'
//   3. (For each placement) edit your AdSense dashboard to create slot IDs
//      and update the data-ad-slot="..." attributes on each placeholder.
//   4. Commit, push, done. Ads load globally.
//
// Refresh hook:
//   Called by game.js after the daily puzzle is solved (banner re-injection).
//
// What this module deliberately does NOT do:
//   • No consent banner injection. AdSense will show its own (or use the
//     'Privacy & messaging' setup in the AdSense console).
//   • No tracking pixels of its own beyond what AdSense ships.
//   • No fallback house ads or promo inventory.
// ─────────────────────────────────────────────────────────────────────────
(function() {
  // Skip admin pages (internal tooling) and localhost dev.
  if (location.pathname.startsWith('/admin/') || location.pathname.startsWith('/admin')) return;
  const host = location.hostname;
  if (host === 'localhost' || host === '127.0.0.1' || host.endsWith('.local') || location.protocol === 'file:') return;

  const cfg = window.CONFIG || {};
  const enabled = !!cfg.ADS_ENABLED;
  const pubId = cfg.ADSENSE_PUBLISHER_ID || '';
  const hasValidPub = enabled && pubId && !pubId.includes('XXXX');

  const SCRIPT_LOADED_FLAG = '__adsbygoogle_loaded';

  function hideAllSlots() {
    document.querySelectorAll('[data-ad-slot], .ad-slot').forEach(el => {
      el.style.display = 'none';
      el.setAttribute('aria-hidden', 'true');
    });
  }

  function loadAdSenseScript() {
    if (window[SCRIPT_LOADED_FLAG]) return Promise.resolve();
    // Detect existing AdSense script (e.g. site-verification tag in <head> of the
    // homepages). Avoids double-loading adsbygoogle.js once ADS_ENABLED is flipped on.
    if (document.querySelector('script[src*="adsbygoogle.js"]')) {
      window[SCRIPT_LOADED_FLAG] = true;
      return Promise.resolve();
    }
    window[SCRIPT_LOADED_FLAG] = true;
    return new Promise((resolve, reject) => {
      const s = document.createElement('script');
      s.async = true;
      s.crossOrigin = 'anonymous';
      s.src = 'https://pagead2.googlesyndication.com/pagead/js/adsbygoogle.js?client=' + encodeURIComponent(pubId);
      s.onload = resolve;
      s.onerror = () => { window[SCRIPT_LOADED_FLAG] = false; reject(); };
      (document.head || document.documentElement).appendChild(s);
    });
  }

  // Build an <ins class="adsbygoogle"> inside a placeholder div.
  // Reads slot configuration from data-ad-* attributes (mirrors AdSense's own naming).
  function activatePlaceholder(el) {
    if (el.dataset.adActivated === '1') return;
    el.dataset.adActivated = '1';
    el.style.display = '';
    el.removeAttribute('aria-hidden');

    const slotId = el.dataset.adSlot;
    if (!slotId) return; // No slot id → render nothing (still visible reserved space)

    const ins = document.createElement('ins');
    ins.className = 'adsbygoogle';
    ins.style.cssText = 'display:block;width:100%';
    ins.setAttribute('data-ad-client', pubId);
    ins.setAttribute('data-ad-slot', slotId);
    if (el.dataset.adFormat) ins.setAttribute('data-ad-format', el.dataset.adFormat);
    else ins.setAttribute('data-ad-format', 'auto');
    if (el.dataset.adLayout)    ins.setAttribute('data-ad-layout', el.dataset.adLayout);
    if (el.dataset.adLayoutKey) ins.setAttribute('data-ad-layout-key', el.dataset.adLayoutKey);
    if (el.dataset.fullWidth !== 'false') ins.setAttribute('data-full-width-responsive', 'true');

    // Empty the placeholder first (label is decorative; ad fills it)
    el.appendChild(ins);
    try {
      (window.adsbygoogle = window.adsbygoogle || []).push({});
    } catch (e) {
      // Push failed — leave a dim placeholder.
      console && console.warn && console.warn('[ads] push failed:', e && e.message);
    }
  }

  // Lazy-activate: only push when the slot is near the viewport.
  // Saves a request roundtrip + improves CLS budget for above-the-fold.
  function lazyObserve(el) {
    if (!('IntersectionObserver' in window)) return activatePlaceholder(el);
    const io = new IntersectionObserver(entries => {
      entries.forEach(e => {
        if (e.isIntersecting) {
          activatePlaceholder(e.target);
          io.unobserve(e.target);
        }
      });
    }, { rootMargin: '200px 0px' });
    io.observe(el);
  }

  function activateAll() {
    document.querySelectorAll('[data-ad-slot]').forEach(lazyObserve);
  }

  // Public API
  const Ads = {
    enabled: hasValidPub,

    // Re-scan the DOM for new placeholders (e.g. after a banner injects).
    refresh() {
      if (!hasValidPub) return;
      activateAll();
    },

    // Programmatically place an ad in an arbitrary container.
    //   Ads.placeAt('#some-div', { slot: '1234567890', format: 'auto' });
    placeAt(selector, opts = {}) {
      if (!hasValidPub) return;
      const host = typeof selector === 'string' ? document.querySelector(selector) : selector;
      if (!host) return;
      // Wrap in a placeholder div that the activator can target
      const ph = document.createElement('div');
      ph.dataset.adSlot = opts.slot || '';
      if (opts.format) ph.dataset.adFormat = opts.format;
      if (opts.layout) ph.dataset.adLayout = opts.layout;
      if (opts.layoutKey) ph.dataset.adLayoutKey = opts.layoutKey;
      ph.style.margin = opts.margin || '16px auto';
      ph.style.maxWidth = opts.maxWidth || '720px';
      host.appendChild(ph);
      lazyObserve(ph);
    },
  };
  window.Ads = Ads;

  // ── Boot ────────────────────────────────────────────────────────────────
  if (!hasValidPub) {
    // Make sure nothing visual remains. The placeholders carry their own
    // collapse CSS but defensive double-hide doesn't hurt.
    if (document.readyState === 'loading') {
      document.addEventListener('DOMContentLoaded', hideAllSlots);
    } else {
      hideAllSlots();
    }
    return;
  }

  // Ads enabled with a valid publisher ID — load the script, then activate.
  loadAdSenseScript().then(() => {
    if (document.readyState === 'loading') {
      document.addEventListener('DOMContentLoaded', activateAll);
    } else {
      activateAll();
    }
  }).catch(() => {
    // Script failed to load — leave placeholders hidden.
    hideAllSlots();
  });
})();
