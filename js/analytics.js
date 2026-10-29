// Statedoku, client-side analytics
// Sends events to /api/events (anonymous, no PII).
// Skips firing when admin is authenticated.

const Analytics = (() => {
  const ENDPOINT = '/api/events';
  const SENT_KEY = 'statedoku_analytics_sent';

  // Where this visit came from, as one coarse class and never a URL, sent with
  // the game events so plays can be read by source in the first-party count
  // (29 October 2026). 'guide' is a page of the site other than a homepage or
  // the archive, the funnel from the learn pages to a first move.
  const SRC = (() => {
    try {
      const u = (new URLSearchParams(location.search).get('utm_source') || '').toLowerCase();
      if (u === 'share') return 'share';
      if (u.startsWith('pwa')) return 'pwa';
      if (u === 'x' || u === 'bluesky' || u === 'mastodon') return 'social';
      if (u) return 'other';
      if (!document.referrer) return 'direct';
      const r = new URL(document.referrer);
      if (r.hostname === location.hostname) {
        if (/^\/((fr|es)\/)?(archive\/)?$/.test(r.pathname)) return /archive\/$/.test(r.pathname) ? 'archive' : 'site';
        return 'guide';
      }
      const h = r.hostname.replace(/^www\./, '');
      if (/(^|\.)(chatgpt\.com|openai\.com|perplexity\.ai|claude\.ai)$|^(copilot\.microsoft\.com|gemini\.google\.com)$/.test(h)) return 'ai';
      if (h === 'classroom.google.com') return 'classroom';
      if (/(listdle|alldle|dles|dailydle|playlin|dlelist|bestdle|dailygame|wordleverse|mapgame|seekdle|dlehunt)/.test(h)) return 'directory';
      if (/(^|\.)(google|bing|duckduckgo|yahoo|ecosia|qwant|yandex|baidu|brave|startpage)\.[a-z.]+$/.test(h)) return 'search';
      if (/(^|\.)(t\.co|x\.com|twitter\.com|facebook\.com|instagram\.com|reddit\.com|tiktok\.com|bsky\.app|linkedin\.com|threads\.net|pinterest\.com)$/.test(h)) return 'social';
      return 'other';
    } catch (e) { return 'other'; }
  })();

  function _shouldSkip() {
    // Admin sessions don't count toward public stats
    return typeof Admin !== 'undefined' && Admin.isAuthenticated();
  }

  function _hasSent(eventKey) {
    try {
      const raw = localStorage.getItem(SENT_KEY);
      if (!raw) return false;
      const sent = JSON.parse(raw);
      return sent.includes(eventKey);
    } catch { return false; }
  }

  function _markSent(eventKey) {
    try {
      const raw = localStorage.getItem(SENT_KEY);
      const sent = raw ? JSON.parse(raw) : [];
      sent.push(eventKey);
      // Keep last 200 events (LRU-ish)
      const trimmed = sent.slice(-200);
      localStorage.setItem(SENT_KEY, JSON.stringify(trimmed));
    } catch {}
  }

  function track(eventType, data = {}) {
    if (_shouldSkip()) return;

    // Mirror puzzle events to Cloudflare Web Analytics custom events
    // (lightweight aggregate counters, separate from the D1 detail store).
    try {
      if (typeof window !== 'undefined' && typeof window.cfTrack === 'function') {
        const cfProps = {};
        if (data.time_seconds != null) cfProps.t = data.time_seconds;
        if (data.mistakes != null) cfProps.m = data.mistakes;
        cfProps.lang = document.documentElement.lang || 'en';
        window.cfTrack(eventType, cfProps);
      }
    } catch (_) {}

    if (!data.puzzle_date) return;

    // Dedupe per-event-per-puzzle-per-device so reloading doesn't inflate counts
    const eventKey = `${eventType}:${data.puzzle_date}`;
    if (eventType !== 'puzzle_start' && _hasSent(eventKey)) return;
    // Allow puzzle_start once per day per device
    if (eventType === 'puzzle_start' && _hasSent(eventKey)) return;

    // Mark the event sent before any transport. _markSent used to run only
    // after the beacon to /api/events succeeded, so with that request blocked
    // (an ad blocker, a network error) every reload re-sent the GA4 event
    // while the D1 count stayed deduped.
    _markSent(eventKey);

    // Same event in GA4, once per puzzle per device like the D1 row, so a
    // game can be tied to the source and landing page of the visit.
    try {
      if (typeof window.gtag === 'function') {
        window.gtag('event', eventType, {
          puzzle_date: data.puzzle_date,
          mistakes: data.mistakes ?? undefined,
          time_seconds: data.time_seconds ?? undefined,
          streak: data.streak ?? undefined,
          src: SRC,
        });
      }
    } catch (_) {}

    const payload = {
      event_type: eventType,
      puzzle_date: data.puzzle_date,
      lang: document.documentElement.lang || 'en',
      time_seconds: data.time_seconds ?? null,
      mistakes: data.mistakes ?? null,
      streak: data.streak ?? null,
      src: SRC,
    };

    try {
      const blob = new Blob([JSON.stringify(payload)], { type: 'application/json' });
      if (navigator.sendBeacon && navigator.sendBeacon(ENDPOINT, blob)) return;
    } catch {}

    // Fallback (sendBeacon failed)
    try {
      fetch(ENDPOINT, {
        method: 'POST',
        headers: { 'content-type': 'application/json' },
        body: JSON.stringify(payload),
        keepalive: true,
      }).catch(() => {});
    } catch {}
  }

  return { track };
})();

// Share to Google Classroom clicks, counted in GA4 with the page they came from.
document.addEventListener('click', (e) => {
  try {
    if (e.target.closest && e.target.closest('.gc-share') && typeof window.gtag === 'function') {
      window.gtag('event', 'classroom_share', { page_path: location.pathname });
    }
  } catch (_) {}
}, true);
