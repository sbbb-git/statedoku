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
    if (!data.puzzle_date) return;

    // Dedupe per-event-per-puzzle-per-device so reloading doesn't inflate counts
    const eventKey = `${eventType}:${data.puzzle_date}`;
    if (eventType !== 'puzzle_start' && _hasSent(eventKey)) return;
    // Allow puzzle_start once per day per device
    if (eventType === 'puzzle_start' && _hasSent(eventKey)) return;

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
