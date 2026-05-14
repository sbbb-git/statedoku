// ─────────────────────────────────────────────────────────────────────────
// Statedoku — Email reminders subscribe flow
// In-game CTA banner + subscribe modal. Posts to /api/subscribe (D1).
// ─────────────────────────────────────────────────────────────────────────

const EmailReminder = (() => {
  const LS_DISMISSED = 'statedoku_email_cta_dismissed';
  const LS_SUBSCRIBED = 'statedoku_email_subscribed';

  function _isHidden() {
    return !!localStorage.getItem(LS_DISMISSED) || !!localStorage.getItem(LS_SUBSCRIBED);
  }

  function _showCTA() {
    if (_isHidden()) return;
    const el = document.getElementById('email-cta');
    if (el) el.hidden = false;
  }

  function _hideCTA() {
    const el = document.getElementById('email-cta');
    if (el) el.hidden = true;
  }

  function _openModal() {
    const m = document.getElementById('email-modal');
    if (!m) return;
    m.classList.add('open');
    setTimeout(() => document.getElementById('email-input')?.focus(), 50);
  }

  function _closeModal() {
    const m = document.getElementById('email-modal');
    if (m) m.classList.remove('open');
  }

  function _localHourToUTC(timeStr) {
    // timeStr = "HH:MM" in the user's local timezone — convert to UTC hour 0..23
    const [hh, mm] = timeStr.split(':').map(n => parseInt(n, 10));
    const now = new Date();
    const local = new Date(now.getFullYear(), now.getMonth(), now.getDate(), hh, mm);
    return local.getUTCHours();
  }

  async function _submit(e) {
    e.preventDefault();
    const email = document.getElementById('email-input').value.trim();
    const time  = document.getElementById('email-time').value || '09:00';
    const lang  = (typeof I18n !== 'undefined' && I18n.getLang) ? I18n.getLang() : 'en';
    const status = document.getElementById('email-status');
    const btn = document.querySelector('#email-form .email-submit');
    status.hidden = false; status.className = 'email-status';
    status.textContent = '…';
    btn.disabled = true;

    try {
      const res = await fetch('/api/subscribe', {
        method: 'POST',
        headers: { 'content-type': 'application/json' },
        body: JSON.stringify({ email, hour_utc: _localHourToUTC(time), lang }),
      });
      const data = await res.json().catch(() => ({}));
      if (!res.ok || !data.ok) {
        status.classList.add('err');
        status.textContent = (data.error || 'Subscription failed.');
        btn.disabled = false;
        return;
      }
      status.classList.add('ok');
      const lang2 = (typeof I18n !== 'undefined' && I18n.t) ? I18n.t('email_thanks') : '';
      status.textContent = lang2 && lang2 !== 'email_thanks'
        ? lang2
        : '✓ You\'re in! Tomorrow you\'ll get the puzzle in your inbox.';
      localStorage.setItem(LS_SUBSCRIBED, '1');
      setTimeout(() => { _closeModal(); _hideCTA(); }, 1800);
    } catch (err) {
      status.classList.add('err');
      const msg = (typeof I18n !== 'undefined' && I18n.t) ? I18n.t('email_network_error') : '';
      status.textContent = (msg && msg !== 'email_network_error') ? msg : 'Network error. Try again later.';
      btn.disabled = false;
    }
  }

  function init() {
    // CTA buttons
    document.getElementById('ec-subscribe')?.addEventListener('click', _openModal);
    document.getElementById('ec-dismiss')?.addEventListener('click', () => {
      localStorage.setItem(LS_DISMISSED, '1');
      _hideCTA();
    });
    // Modal close (overlay + close btn share the same wiring as other modals)
    document.querySelectorAll('#email-modal .modal-close, #email-modal .modal-overlay').forEach(el => {
      el.addEventListener('click', _closeModal);
    });
    // Submit
    document.getElementById('email-form')?.addEventListener('submit', _submit);

    // Show CTA shortly after the user starts playing
    setTimeout(_showCTA, 4000);
  }

  return { init, openModal: _openModal };
})();

document.addEventListener('DOMContentLoaded', () => EmailReminder.init());
