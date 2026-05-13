// ─────────────────────────────────────────────────────────────────────────
// Statedoku Ads + Consent (GDPR/ePrivacy)
// ─────────────────────────────────────────────────────────────────────────
// Loads Google AdSense ONLY after the visitor accepts ads.
// Stores consent in localStorage. Dev mode (?dev=1) disables ads entirely.
// Replace CONFIG.ADSENSE_PUBLISHER_ID in /config.js with your real
// ca-pub-XXXXXXXXXXXXXXXX, then fill in the slot IDs in AD_SLOTS below.
// ─────────────────────────────────────────────────────────────────────────

const Ads = (() => {
  const CONSENT_KEY  = 'statedoku_consent';   // 'accept' | 'reject' | null
  const PUB_ID       = (typeof CONFIG !== 'undefined' && CONFIG.ADSENSE_PUBLISHER_ID) || '';
  const HAS_VALID_ID = /^ca-pub-\d{10,}$/.test(PUB_ID);

  // Replace with your AdSense ad-unit slot IDs once approved.
  // Until then, ads will render as styled placeholders in dev/local builds.
  const AD_SLOTS = {
    top:     '0000000001',
    bottom:  '0000000002',
    solved:  '0000000003',
  };

  const isDev = () =>
    new URLSearchParams(location.search).get('dev') === '1' ||
    localStorage.getItem('statedoku_dev') === '1';

  function getConsent() { return localStorage.getItem(CONSENT_KEY); }
  function setConsent(v) {
    localStorage.setItem(CONSENT_KEY, v);
    if (v === 'accept') _loadAdSense();
    document.body.classList.toggle('ads-on', v === 'accept');
  }

  function _loadAdSense() {
    if (!HAS_VALID_ID) return; // No publisher ID yet → placeholders only
    if (document.getElementById('adsbygoogle-script')) return;
    const s = document.createElement('script');
    s.id = 'adsbygoogle-script';
    s.async = true;
    s.crossOrigin = 'anonymous';
    s.src = `https://pagead2.googlesyndication.com/pagead/js/adsbygoogle.js?client=${PUB_ID}`;
    document.head.appendChild(s);
    s.onload = () => document.querySelectorAll('ins.adsbygoogle:not([data-ad-loaded])').forEach(_pushSlot);
  }

  function _pushSlot(ins) {
    ins.setAttribute('data-ad-loaded', '1');
    try { (window.adsbygoogle = window.adsbygoogle || []).push({}); } catch(e) {}
  }

  // Build an ad slot element. Renders a styled placeholder if no publisher ID.
  function mount(slotName, container) {
    if (!container || isDev()) return;
    if (container.dataset.adsMounted) return;
    container.dataset.adsMounted = '1';

    const slotId = AD_SLOTS[slotName];
    if (HAS_VALID_ID && getConsent() === 'accept') {
      const ins = document.createElement('ins');
      ins.className = 'adsbygoogle';
      ins.style.cssText = 'display:block;width:100%;min-height:100px';
      ins.setAttribute('data-ad-client', PUB_ID);
      ins.setAttribute('data-ad-slot', slotId);
      ins.setAttribute('data-ad-format', 'auto');
      ins.setAttribute('data-full-width-responsive', 'true');
      container.appendChild(ins);
      _pushSlot(ins);
    } else {
      // Placeholder (used until AdSense is configured/consent given)
      container.innerHTML = `<div class="ad-placeholder"><span>Ad slot · ${slotName}</span><small>${HAS_VALID_ID ? 'Awaiting consent' : 'Configure CONFIG.ADSENSE_PUBLISHER_ID'}</small></div>`;
    }
  }

  // ── Consent banner ──────────────────────────────────────────────────────
  function _mountConsentBanner() {
    if (getConsent() || isDev()) return;
    const bar = document.createElement('div');
    bar.id = 'consent-bar';
    bar.role = 'dialog';
    bar.setAttribute('aria-label', 'Cookie & ads consent');
    bar.innerHTML = `
      <div class="consent-text">
        <strong>Help support Statedoku 🇺🇸</strong>
        We show non-intrusive ads to keep the daily puzzle free. We use cookies/local storage for game progress and (with your permission) personalised ads.
        <a href="#" id="consent-learn">Learn more</a>
      </div>
      <div class="consent-actions">
        <button class="consent-btn consent-reject" type="button">Reject ads</button>
        <button class="consent-btn consent-accept" type="button">Accept &amp; play</button>
      </div>
    `;
    document.body.appendChild(bar);

    bar.querySelector('.consent-accept').addEventListener('click', () => {
      setConsent('accept');
      bar.remove();
      _mountAllAds();
    });
    bar.querySelector('.consent-reject').addEventListener('click', () => {
      setConsent('reject');
      bar.remove();
    });
    bar.querySelector('#consent-learn').addEventListener('click', e => {
      e.preventDefault();
      alert('Statedoku is free and ad-supported. We only store: your game progress, stats, and language preference. With "Accept" we also load Google AdSense, which may use cookies to show personalised ads. You can change your choice anytime by clearing site data.');
    });
  }

  function _mountAllAds() {
    mount('top',    document.getElementById('ad-top'));
    mount('bottom', document.getElementById('ad-bottom'));
    mount('solved', document.getElementById('ad-solved'));
  }

  // Public: re-mount when solved banner becomes visible
  function refresh() { _mountAllAds(); }

  function init() {
    if (getConsent() === 'accept') {
      document.body.classList.add('ads-on');
      _loadAdSense();
    }
    _mountAllAds();
    _mountConsentBanner();
  }

  return { init, refresh, mount, setConsent, getConsent };
})();

document.addEventListener('DOMContentLoaded', () => Ads.init());
