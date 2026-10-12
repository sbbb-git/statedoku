// Statedoku — client-side analytics
// Sends events to /api/events (anonymous, no PII).
// Skips firing when admin is authenticated.

const Analytics = (() => {
  const ENDPOINT = '/api/events';
  const SENT_KEY = 'statedoku_analytics_sent';

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

    // Same event in GA4, once per puzzle per device like the D1 row, so a
    // game can be tied to the source and landing page of the visit.
    try {
      if (typeof window.gtag === 'function') {
        window.gtag('event', eventType, {
          puzzle_date: data.puzzle_date,
          mistakes: data.mistakes ?? undefined,
          time_seconds: data.time_seconds ?? undefined,
        });
      }
    } catch (_) {}

    const payload = {
      event_type: eventType,
      puzzle_date: data.puzzle_date,
      lang: document.documentElement.lang || 'en',
      time_seconds: data.time_seconds ?? null,
      mistakes: data.mistakes ?? null,
    };

    try {
      const blob = new Blob([JSON.stringify(payload)], { type: 'application/json' });
      if (navigator.sendBeacon && navigator.sendBeacon(ENDPOINT, blob)) {
        _markSent(eventKey);
        return;
      }
    } catch {}

    // Fallback (sendBeacon failed)
    try {
      fetch(ENDPOINT, {
        method: 'POST',
        headers: { 'content-type': 'application/json' },
        body: JSON.stringify(payload),
        keepalive: true,
      }).then(() => _markSent(eventKey)).catch(() => {});
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
