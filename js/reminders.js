// Statedoku — daily reminder via browser notifications
// Strategy: when user opts in + picks a time, we save preference in localStorage.
// On every page load we check if we should show a "next puzzle is ready" notification
// (lazy reminding — works only when they have a browser open).
// For real scheduled push: would need backend with VAPID + Web Push API.

const Reminders = (() => {
  const PREF_KEY = 'statedoku_reminder_pref';
  const LAST_SHOWN = 'statedoku_reminder_last_shown';

  function getPref() {
    try { return JSON.parse(localStorage.getItem(PREF_KEY) || 'null'); }
    catch { return null; }
  }
  function setPref(pref) {
    if (pref) localStorage.setItem(PREF_KEY, JSON.stringify(pref));
    else localStorage.removeItem(PREF_KEY);
  }
  function isEnabled() {
    const p = getPref();
    return !!(p && p.enabled && typeof Notification !== 'undefined' && Notification.permission === 'granted');
  }
  function permission() {
    return typeof Notification === 'undefined' ? 'unsupported' : Notification.permission;
  }

  async function askPermission() {
    if (typeof Notification === 'undefined') return 'unsupported';
    if (Notification.permission === 'granted') return 'granted';
    if (Notification.permission === 'denied') return 'denied';
    return await Notification.requestPermission();
  }

  async function enable(time = '09:00') {
    const perm = await askPermission();
    if (perm !== 'granted') return { ok: false, reason: perm };
    setPref({ enabled: true, time, ts: Date.now() });
    return { ok: true };
  }

  function disable() {
    setPref(null);
    return { ok: true };
  }

  // Try to fire a "next puzzle ready" notification when relevant
  function _maybeFireOnVisit() {
    if (!isEnabled()) return;
    const last = parseInt(localStorage.getItem(LAST_SHOWN) || '0', 10);
    const now = Date.now();
    if (now - last < 20 * 3600 * 1000) return; // only every 20h+
    // Check if today's puzzle hasn't been solved
    const todayKey = (typeof Puzzle !== 'undefined' ? Puzzle.getTodayStr() : new Date().toISOString().slice(0,10));
    const progressKey = ((window.CONFIG && CONFIG.STORAGE_KEY) || 'statedoku_v1') + '_progress_' + todayKey;
    const raw = localStorage.getItem(progressKey);
    let solvedOrLost = false;
    if (raw) {
      try { const d = JSON.parse(raw); solvedOrLost = !!(d.solved || d.gameOver); } catch {}
    }
    if (solvedOrLost) return; // they already played today
    try {
      new Notification('🇺🇸 Statedoku is ready', {
        body: "Today's daily puzzle is waiting. Tap to play.",
        icon: '/icon-192.png',
        badge: '/favicon-32.png',
        tag: 'statedoku-daily-reminder',
      });
      localStorage.setItem(LAST_SHOWN, now.toString());
    } catch (e) {
      console.warn('[Reminders] notification failed:', e.message);
    }
  }

  // Try to schedule a Notification via the Notification Triggers API (Chrome/Edge only).
  // Falls back silently if unsupported. We use it to schedule for tomorrow at the chosen time.
  async function _scheduleNext() {
    if (!isEnabled()) return;
    if (!('serviceWorker' in navigator)) return;
    const reg = await navigator.serviceWorker.getRegistration();
    if (!reg) return;
    const pref = getPref();
    if (!pref || !pref.time) return;
    const [hh, mm] = pref.time.split(':').map(Number);
    const next = new Date();
    next.setHours(hh, mm, 0, 0);
    if (next <= new Date()) next.setDate(next.getDate() + 1);
    try {
      await reg.showNotification('🇺🇸 Statedoku is ready', {
        tag: 'statedoku-daily-reminder',
        body: "Today's daily puzzle is waiting. Tap to play.",
        icon: '/icon-192.png',
        badge: '/favicon-32.png',
        showTrigger: typeof TimestampTrigger !== 'undefined' ? new TimestampTrigger(next.getTime()) : undefined,
      });
    } catch (e) {
      // Triggers API not supported on most browsers — that's OK
    }
  }

  function init() {
    // Register a tiny service worker if supported (needed for showNotification)
    if ('serviceWorker' in navigator) {
      navigator.serviceWorker.register('/sw.js').catch(() => {});
    }
    // Lazy reminder when user opens the site
    _maybeFireOnVisit();
    // Schedule next via Triggers API where available
    _scheduleNext();
  }

  return { init, enable, disable, isEnabled, permission, getPref };
})();

document.addEventListener('DOMContentLoaded', () => Reminders.init());
