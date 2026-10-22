// ─────────────────────────────────────────────────────────────────────────
// Statedoku — Archive calendar
// Renders a month-by-month calendar. Each cell shows the date's status
// (solved / lost / in progress / not played) and links to ?date=YYYY-MM-DD.
// Reads progress from localStorage. No server roundtrip.
// ─────────────────────────────────────────────────────────────────────────

(() => {
  const STORAGE_PREFIX = (window.CONFIG && CONFIG.STORAGE_KEY) || 'statedoku_v1';

  // Day #1. Earlier dates all showed the same pre-launch preview grid and
  // were counted as 151 "days available".
  const EPOCH = new Date('2026-06-01T00:00:00');

  // Locale based on URL path
  const path = location.pathname;
  const lang = path.includes('/fr/') ? 'fr' : path.includes('/es/') ? 'es' : 'en';
  const locale = lang === 'fr' ? 'fr-FR' : lang === 'es' ? 'es-ES' : 'en-US';
  const homeUrl = lang === 'fr' ? '/fr/' : lang === 'es' ? '/es/' : '/';

  const TXT = {
    en: { today: 'Today', play: 'Play', future: 'Locked',
          status: { solved: 'solved', lost: 'lost', progress: 'in progress', empty: 'not played' },
          stats: (s, l, p, t) => `<strong>${s}</strong> solved · <strong>${l}</strong> lost · <strong>${p}</strong> played out of <strong>${t}</strong> days available` },
    fr: { today: 'Aujourd\'hui', play: 'Jouer', future: 'Verrouillé',
          status: { solved: 'réussi', lost: 'perdu', progress: 'en cours', empty: 'pas joué' },
          stats: (s, l, p, t) => `<strong>${s}</strong> réussis · <strong>${l}</strong> perdus · <strong>${p}</strong> joués sur <strong>${t}</strong> jours disponibles` },
    es: { today: 'Hoy', play: 'Jugar', future: 'Bloqueado',
          status: { solved: 'resuelto', lost: 'perdido', progress: 'en curso', empty: 'sin jugar' },
          stats: (s, l, p, t) => `<strong>${s}</strong> resueltos · <strong>${l}</strong> perdidos · <strong>${p}</strong> jugados de <strong>${t}</strong> días disponibles` },
  }[lang];

  function fmtDate(d) {
    const y = d.getFullYear();
    const m = String(d.getMonth() + 1).padStart(2, '0');
    const day = String(d.getDate()).padStart(2, '0');
    return `${y}-${m}-${day}`;
  }

  function readProgress(dateStr) {
    try {
      const raw = localStorage.getItem(`${STORAGE_PREFIX}_progress_${dateStr}`);
      if (!raw) return null;
      return JSON.parse(raw);
    } catch { return null; }
  }

  function statusOf(d) {
    const today = new Date();
    today.setHours(0, 0, 0, 0);
    const day = new Date(d);
    day.setHours(0, 0, 0, 0);

    if (day > today) return 'future';
    if (day < EPOCH) return 'pre-epoch';

    const p = readProgress(fmtDate(d));
    if (!p) return 'empty';
    if (p.solved) return 'solved';
    if (p.gameOver) return 'lost';
    return 'progress';
  }

  // ── Calendar renderer ────────────────────────────────────────────────────
  let viewYear, viewMonth;

  function renderMonth() {
    const cal = document.getElementById('arc-calendar');
    const label = document.getElementById('arc-month-label');
    cal.innerHTML = '';

    const first = new Date(viewYear, viewMonth, 1);
    const last  = new Date(viewYear, viewMonth + 1, 0);
    const monthName = first.toLocaleDateString(locale, { month: 'long', year: 'numeric' });
    label.textContent = monthName[0].toUpperCase() + monthName.slice(1);

    // Day-of-week headers (Mon-first)
    const dowFmt = new Intl.DateTimeFormat(locale, { weekday: 'short' });
    const baseMon = new Date(2024, 0, 1); // Jan 1, 2024 = Monday
    for (let i = 0; i < 7; i++) {
      const d = new Date(baseMon); d.setDate(baseMon.getDate() + i);
      const el = document.createElement('div');
      el.className = 'arc-dow';
      el.textContent = dowFmt.format(d).slice(0, 3);
      cal.appendChild(el);
    }

    // Leading blanks (start week on Monday)
    let leading = first.getDay() - 1;
    if (leading < 0) leading = 6;
    for (let i = 0; i < leading; i++) {
      const el = document.createElement('div');
      el.className = 'arc-blank';
      cal.appendChild(el);
    }

    const today = new Date(); today.setHours(0,0,0,0);

    for (let day = 1; day <= last.getDate(); day++) {
      const d = new Date(viewYear, viewMonth, day);
      const dateStr = fmtDate(d);
      const status = statusOf(d);
      const isToday = d.getTime() === today.getTime();
      const isClickable = status !== 'future' && status !== 'pre-epoch';

      const tag = isClickable ? 'a' : 'div';
      const el = document.createElement(tag);
      el.className = `arc-day arc-${status}` + (isToday ? ' arc-today' : '');
      if (isClickable) {
        el.href = `${homeUrl}?date=${dateStr}`;
        el.setAttribute('aria-label', `${d.toLocaleDateString(locale, { weekday:'long', month:'long', day:'numeric' })}, ${TXT.status[status] || status}`);
      }
      el.innerHTML = `<span class="arc-num">${day}</span>`;
      cal.appendChild(el);
    }

    updateStats();
  }

  function updateStats() {
    const today = new Date(); today.setHours(0,0,0,0);
    let solved = 0, lost = 0, played = 0;
    for (let d = new Date(EPOCH); d <= today; d.setDate(d.getDate() + 1)) {
      const s = statusOf(d);
      if (s === 'solved')   { solved++; played++; }
      else if (s === 'lost'){ lost++;   played++; }
      else if (s === 'progress') played++;
    }
    const total = Math.ceil((today - EPOCH) / 86400000) + 1;
    const stats = document.getElementById('arc-stats');
    if (stats) stats.innerHTML = TXT.stats(solved, lost, played, total);
  }

  function go(delta) {
    viewMonth += delta;
    if (viewMonth < 0) { viewMonth = 11; viewYear--; }
    if (viewMonth > 11) { viewMonth = 0; viewYear++; }
    renderMonth();
  }

  document.addEventListener('DOMContentLoaded', () => {
    const now = new Date();
    viewYear  = now.getFullYear();
    viewMonth = now.getMonth();
    document.getElementById('arc-prev').addEventListener('click', () => go(-1));
    document.getElementById('arc-next').addEventListener('click', () => go(+1));
    renderMonth();
  });
})();
