// ─────────────────────────────────────────────────────────────────────────
// Statedoku — Superadmin gate
// Hidden entry: visit any page with #admin in the URL → password modal.
// On success → admin mode persists for 30 days in localStorage.
// ─────────────────────────────────────────────────────────────────────────

const Admin = (() => {
  const TOKEN_KEY = 'statedoku_admin_token';
  const TTL_MS = 30 * 24 * 60 * 60 * 1000; // 30 days

  // ── SHA-256 via SubtleCrypto ────────────────────────────────────────────
  async function _sha256(text) {
    const buf = new TextEncoder().encode(text);
    const hash = await crypto.subtle.digest('SHA-256', buf);
    return Array.from(new Uint8Array(hash)).map(b => b.toString(16).padStart(2, '0')).join('');
  }

  // ── Token management ────────────────────────────────────────────────────
  function _saveToken() {
    const payload = { exp: Date.now() + TTL_MS };
    localStorage.setItem(TOKEN_KEY, JSON.stringify(payload));
  }
  function _readToken() {
    try {
      const raw = localStorage.getItem(TOKEN_KEY);
      if (!raw) return null;
      const tok = JSON.parse(raw);
      if (!tok || !tok.exp || tok.exp < Date.now()) {
        localStorage.removeItem(TOKEN_KEY);
        return null;
      }
      return tok;
    } catch { return null; }
  }

  function isAuthenticated() { return !!_readToken(); }

  function logout() {
    localStorage.removeItem(TOKEN_KEY);
    // Also clear legacy dev flag
    localStorage.removeItem('statedoku_dev');
    location.hash = '';
    location.reload();
  }

  // ── Password modal ──────────────────────────────────────────────────────
  function _showPasswordModal() {
    if (document.getElementById('admin-modal')) return;

    const modal = document.createElement('div');
    modal.id = 'admin-modal';
    modal.innerHTML = `
      <div class="admin-modal-overlay"></div>
      <form class="admin-modal-content" autocomplete="off">
        <div class="admin-modal-icon">
          <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round">
            <rect x="3" y="11" width="18" height="11" rx="2"/>
            <path d="M7 11V7a5 5 0 0 1 10 0v4"/>
          </svg>
        </div>
        <h3>Restricted area</h3>
        <p>Enter the access key to continue.</p>
        <input type="password" id="admin-password" autocomplete="new-password" autofocus placeholder="••••••••" spellcheck="false">
        <div class="admin-modal-actions">
          <button type="button" class="admin-btn admin-btn-secondary" id="admin-cancel">Cancel</button>
          <button type="submit" class="admin-btn admin-btn-primary">Unlock</button>
        </div>
        <p class="admin-modal-error" id="admin-error"></p>
      </form>
    `;
    document.body.appendChild(modal);

    const input = modal.querySelector('#admin-password');
    const errEl = modal.querySelector('#admin-error');
    const cancel = () => { modal.remove(); location.hash = ''; };

    modal.querySelector('.admin-modal-overlay').addEventListener('click', cancel);
    modal.querySelector('#admin-cancel').addEventListener('click', cancel);
    modal.addEventListener('keydown', e => { if (e.key === 'Escape') cancel(); });

    modal.querySelector('form').addEventListener('submit', async e => {
      e.preventDefault();
      const pwd = input.value;
      if (!pwd) return;
      const hash = await _sha256(pwd);
      if (hash === CONFIG.ADMIN_HASH) {
        _saveToken();
        modal.remove();
        location.hash = '';
        location.reload();
      } else {
        errEl.textContent = 'Wrong key.';
        modal.querySelector('.admin-modal-content').classList.add('shake');
        setTimeout(() => modal.querySelector('.admin-modal-content')?.classList.remove('shake'), 500);
        input.value = '';
        input.focus();
      }
    });

    setTimeout(() => input.focus(), 50);
  }

  // ── Init ────────────────────────────────────────────────────────────────
  function init() {
    // Migrate legacy ?dev=1 flag → require re-auth
    if (localStorage.getItem('statedoku_dev')) {
      localStorage.removeItem('statedoku_dev');
    }
    if (location.hash === '#admin') {
      _showPasswordModal();
    }
  }

  return { init, isAuthenticated, logout };
})();

document.addEventListener('DOMContentLoaded', () => Admin.init());
