const Game = (() => {

  const MAX_ERRORS = 3;

  let _puzzle     = null;
  let _states     = null;
  let _stateMap   = {};
  let _grid       = [[null,null,null],[null,null,null],[null,null,null]];
  let _selectedCell = null;
  let _solved     = false;
  let _gameOver   = false;
  let _startTime  = null;
  let _solveTime  = null;
  let _dateStr    = null;
  let _errors     = 0;
  let _goldenFound = false;

  // US flag SVG — official proportions (19:10), 13 stripes, 50 stars in 9 rows (6,5,6,5,6,5,6,5,6)
  function _buildFlagSVG() {
    const CANTON_W = 7.6, CANTON_H = 5.385;
    let stars = '';
    const counts = [6,5,6,5,6,5,6,5,6];
    counts.forEach((n, row) => {
      const y = CANTON_H * (row + 0.5) / 9; // 9 evenly-spaced rows within canton
      const stepX = CANTON_W / 12; // 12 half-steps wide
      for (let i = 0; i < n; i++) {
        // Odd rows (0,2,4...) → 6 stars at half-steps 1,3,5,7,9,11
        // Even rows (1,3,5...) → 5 stars at half-steps 2,4,6,8,10
        const halfStep = (row % 2 === 0) ? (i * 2 + 1) : (i * 2 + 2);
        const cx = stepX * halfStep;
        // 5-point star polygon, radius ~0.22
        const r = 0.22, ir = 0.09;
        const pts = [];
        for (let k = 0; k < 10; k++) {
          const angle = (Math.PI / 5) * k - Math.PI / 2;
          const rad = (k % 2 === 0) ? r : ir;
          pts.push(`${(cx + rad * Math.cos(angle)).toFixed(2)},${(y + rad * Math.sin(angle)).toFixed(2)}`);
        }
        stars += `<polygon points="${pts.join(' ')}"/>`;
      }
    });
    return `<svg class="us-flag" viewBox="0 0 19 10" xmlns="http://www.w3.org/2000/svg" preserveAspectRatio="xMidYMid meet" aria-label="USA flag" role="img">
      <rect width="19" height="10" fill="#B22234"/>
      <g fill="#fff">
        <rect y="0.77" width="19" height="0.77"/>
        <rect y="2.31" width="19" height="0.77"/>
        <rect y="3.85" width="19" height="0.77"/>
        <rect y="5.38" width="19" height="0.77"/>
        <rect y="6.92" width="19" height="0.77"/>
        <rect y="8.46" width="19" height="0.77"/>
      </g>
      <rect width="7.6" height="5.385" fill="#3C3B6E"/>
      <g fill="#fff">${stars}</g>
    </svg>`;
  }

  // ── Init ──────────────────────────────────────────────────────────────────
  async function init(dateStr) {
    _dateStr = dateStr || Puzzle.getTodayStr();
    _states  = await Puzzle.loadStates();
    _states.forEach(s => { _stateMap[s.id] = s; });

    // Inject US flag into grid corner (once)
    const corner = document.querySelector('.grid-corner');
    if (corner && !corner.querySelector('.us-flag')) corner.innerHTML = _buildFlagSVG();

    _puzzle = await Puzzle.getPuzzle(_dateStr);
    if (!_puzzle) {
      document.getElementById('loading').textContent = 'Puzzle unavailable — please refresh.';
      return;
    }

    _loadProgress();
    _render();
    _setupDelegation();
    _startTime = _startTime || Date.now();
    document.getElementById('loading').style.display = 'none';
    document.getElementById('game-wrap').style.display = 'flex';
    _updateDateDisplay();
    _updateScore();

    // Analytics: track puzzle_start (deduped per device per date)
    if (typeof Analytics !== 'undefined') {
      Analytics.track('puzzle_start', { puzzle_date: _dateStr });
    }

    // First-time onboarding tooltip (dismisses on first cell tap or after 8s)
    _maybeShowFirstTimeTooltip();
  }

  function _maybeShowFirstTimeTooltip() {
    const KEY = 'statedoku_onboarded_v1';
    if (localStorage.getItem(KEY)) return;
    if (_solved || _gameOver) { localStorage.setItem(KEY, '1'); return; }
    const lang = I18n.getLang();
    const txt = lang === 'fr' ? '👆 Tape sur une case pour commencer'
              : lang === 'es' ? '👆 Toca una celda para empezar'
              : '👆 Tap a cell to start';
    const tip = document.createElement('div');
    tip.id = 'first-tip';
    tip.textContent = txt;
    document.querySelector('#game-wrap')?.appendChild(tip);
    const dismiss = () => {
      localStorage.setItem(KEY, '1');
      tip.remove();
      document.querySelector('.grid-outer')?.removeEventListener('click', dismiss);
    };
    setTimeout(() => document.querySelector('.grid-outer')?.addEventListener('click', dismiss, { once: true }), 100);
    setTimeout(dismiss, 8000);
  }

  function _updateDateDisplay() {
    const el = document.getElementById('puzzle-date');
    if (!el) return;
    if (_puzzle && _puzzle._preview) {
      // Banner above grid already says "Preview — Day #1 drops Monday June 1".
      // Score bar stays clean — hide the date label entirely during preview.
      el.textContent = '';
      _showPreviewBanner();
      return;
    }
    const d = new Date(_dateStr + 'T00:00:00');
    const lang   = I18n.getLang();
    const locale = lang === 'fr' ? 'fr-FR' : lang === 'es' ? 'es-ES' : 'en-US';
    const opts   = { weekday:'long', month:'long', day:'numeric' };
    el.textContent = d.toLocaleDateString(locale, opts);
  }

  function _showPreviewBanner() {
    if (document.getElementById('preview-banner')) return;
    const lang = I18n.getLang();
    const txt = lang === 'fr' ? 'Aperçu — Day #1 sort le lundi 1er juin'
              : lang === 'es' ? 'Vista previa — Day #1 sale el lunes 1 de junio'
              : "Preview — Day #1 drops Monday June 1";
    const cta = lang === 'fr' ? 'Réserver ma place →'
              : lang === 'es' ? 'Reservar mi lugar →'
              : 'Get Day #1 in my inbox →';
    const banner = document.createElement('div');
    banner.id = 'preview-banner';
    banner.innerHTML = `
      <span class="pb-text">${txt}</span>
      <a href="/launch/" class="pb-cta">${cta}</a>
    `;
    const main = document.querySelector('main');
    if (main) main.insertBefore(banner, main.firstChild);
  }

  function _updateScore() {
    const correct = _grid.flat().filter((s,i) => {
      if (!s) return false;
      const r = Math.floor(i/3), c = i%3;
      return _puzzle.solution[r][c] === s;
    }).length;
    const el = document.getElementById('score-display');
    if (el) el.textContent = `${correct} / 9`;
    const errEl = document.getElementById('error-display');
    if (errEl) {
      errEl.innerHTML = '';
      for (let i = 0; i < MAX_ERRORS; i++) {
        const dot = document.createElement('span');
        dot.className = 'err-dot' + (i < _errors ? ' used' : '');
        errEl.appendChild(dot);
      }
    }
  }

  // ── Rendering ─────────────────────────────────────────────────────────────
  function _render() {
    _renderLabels();
    _renderCells();
    if (_solved) _showSolvedBanner();
  }

  function _renderLabels() {
    _puzzle.rows.forEach((rc, i) => {
      const el = document.getElementById(`row-label-${i}`);
      if (el) el.textContent = I18n.constraint(rc);
    });
    _puzzle.cols.forEach((cc, j) => {
      const el = document.getElementById(`col-label-${j}`);
      if (el) el.textContent = I18n.constraint(cc);
    });
  }

  function _renderCells() {
    const lang = I18n.getLang();
    const rowLabels = _puzzle.rows.map(rc => I18n.constraint(rc));
    const colLabels = _puzzle.cols.map(cc => I18n.constraint(cc));
    for (let r = 0; r < 3; r++) {
      for (let c = 0; c < 3; c++) {
        const cell    = document.querySelector(`.cell[data-r="${r}"][data-c="${c}"]`);
        if (!cell) continue;
        const placed  = _grid[r][c];
        const sel     = _selectedCell && _selectedCell.r === r && _selectedCell.c === c;
        cell.className = 'cell' + (sel ? ' selected' : '');
        cell.innerHTML = '';
        // a11y attributes (idempotent)
        cell.setAttribute('role', 'button');
        cell.setAttribute('tabindex', (_solved || _gameOver) ? '-1' : '0');
        if (placed) {
          const state     = _stateMap[placed];
          const isCorrect = _puzzle.solution[r][c] === placed;
          cell.classList.add(isCorrect ? 'correct' : 'wrong');
          if (isCorrect) {
            cell.classList.add('locked');
            cell.setAttribute('tabindex', '-1');
            const isGolden = _puzzle.goldenState && placed === _puzzle.goldenState;
            if (isGolden) cell.classList.add('golden');
            cell.setAttribute('aria-label',
              `${state.names[lang]} (${rowLabels[r]} × ${colLabels[c]})${isGolden ? ' — 🌟 Golden State' : ''} — locked`);
          } else {
            cell.setAttribute('aria-label', `${state.names[lang]} — wrong`);
          }
          cell.innerHTML = `
            <span class="cell-abbr">${state.id}</span>
            <span class="cell-name">${state.names[lang]}</span>
            ${(_puzzle.goldenState && placed === _puzzle.goldenState && isCorrect) ? '<span class="cell-golden-star" aria-hidden="true">🌟</span>' : ''}
          `;
        } else {
          cell.classList.add('empty');
          cell.setAttribute('aria-label', `Empty cell — ${rowLabels[r]} × ${colLabels[c]}. Press Enter to pick a state.`);
        }
      }
    }
  }

  // ── Grid delegation ───────────────────────────────────────────────────────
  function _setupDelegation() {
    const grid = document.querySelector('.grid-outer');
    if (!grid || grid._delegated) return;
    grid._delegated = true;
    grid.addEventListener('click', e => {
      const cell = e.target.closest('.cell[data-r]');
      if (!cell) return;
      _onCellClick(parseInt(cell.dataset.r), parseInt(cell.dataset.c));
    });
    // Keyboard navigation: arrows move focus, Enter/Space opens picker
    grid.addEventListener('keydown', e => {
      const cell = e.target.closest('.cell[data-r]');
      if (!cell) return;
      const r = parseInt(cell.dataset.r);
      const c = parseInt(cell.dataset.c);
      let nr = r, nc = c;
      switch (e.key) {
        case 'ArrowUp':    nr = Math.max(0, r - 1); break;
        case 'ArrowDown':  nr = Math.min(2, r + 1); break;
        case 'ArrowLeft':  nc = Math.max(0, c - 1); break;
        case 'ArrowRight': nc = Math.min(2, c + 1); break;
        case 'Enter':
        case ' ':
          e.preventDefault();
          _onCellClick(r, c);
          return;
        default: return;
      }
      e.preventDefault();
      const next = document.querySelector(`.cell[data-r="${nr}"][data-c="${nc}"]`);
      if (next) next.focus();
    });
  }

  function _onCellClick(r, c) {
    if (_solved || _gameOver) return;
    // Locked cells (already correct) can't be re-edited
    if (_grid[r][c] && _puzzle.solution[r][c] === _grid[r][c]) return;
    _selectedCell = { r, c };
    _renderCells();
    _openSearch(r, c);
  }

  // ── Autocomplete Search ────────────────────────────────────────────────────
  function _openSearch(r, c) {
    const rowC = _puzzle.rows[r];
    const colC = _puzzle.cols[c];
    const lang = I18n.getLang();

    const panel     = document.getElementById('search-panel');
    const tagsEl    = document.getElementById('sp-tags');
    const input     = document.getElementById('sp-input');
    const dropdown  = document.getElementById('sp-dropdown');
    const countEl   = document.getElementById('sp-count');

    // Tags
    tagsEl.innerHTML = `<span class="sp-tag">${I18n.constraint(rowC)}</span><span class="sp-sep">×</span><span class="sp-tag">${I18n.constraint(colC)}</span>`;

    // Reset input
    input.value = '';
    dropdown.innerHTML = '';
    dropdown.style.display = 'none';
    if (countEl) countEl.textContent = '';

    // Remove old listener, replace with fresh clone
    const newInput = input.cloneNode(true);
    input.parentNode.replaceChild(newInput, input);
    newInput.placeholder = I18n.t('search_placeholder');

    const usedIds = new Set(_grid.flat().filter((s, i) => {
      const row = Math.floor(i/3), col = i%3;
      return s && !(row === r && col === c);
    }));

    const MIN_QUERY_LEN = 4;

    function renderDropdown(query) {
      dropdown.innerHTML = '';
      const trimmed = query.trim();
      if (!trimmed) { dropdown.style.display = 'none'; return; }

      // Anti-spoiler: require at least MIN_QUERY_LEN chars before revealing
      // states. NAME ONLY — state abbreviations are never matched, otherwise
      // typing "CA" would instantly reveal California which kills the game.
      if (trimmed.length < MIN_QUERY_LEN) {
        const need = MIN_QUERY_LEN - trimmed.length;
        dropdown.innerHTML = `<li class="sp-hint">${I18n.t('min_chars_hint').replace('{n}', need)}</li>`;
        dropdown.style.display = 'block';
        return;
      }

      const q = trimmed.toLowerCase().normalize('NFD').replace(/[̀-ͯ]/g,'');
      const matches = _states.filter(s => {
        const name = s.names[lang].toLowerCase().normalize('NFD').replace(/[̀-ͯ]/g,'');
        return name.startsWith(q) || name.includes(q);
      }).sort((a, b) => {
        const na = a.names[lang].toLowerCase().normalize('NFD').replace(/[̀-ͯ]/g,'');
        const nb = b.names[lang].toLowerCase().normalize('NFD').replace(/[̀-ͯ]/g,'');
        const aStart = na.startsWith(q) ? 0 : 1;
        const bStart = nb.startsWith(q) ? 0 : 1;
        return aStart - bStart || na.localeCompare(nb);
      }).slice(0, 8);

      if (matches.length === 0) {
        dropdown.innerHTML = `<li class="sp-no-result">${I18n.t('no_states_found')}</li>`;
        dropdown.style.display = 'block';
        return;
      }

      matches.forEach(state => {
        const used = usedIds.has(state.id);
        const li = document.createElement('li');
        li.className = 'sp-item' + (used ? ' sp-used' : '');
        li.innerHTML = `<span class="sp-abbr">${state.id}</span><span class="sp-sname">${state.names[lang]}</span>`;
        if (!used) {
          li.addEventListener('mousedown', e => { e.preventDefault(); _selectState(state.id); });
        }
        dropdown.appendChild(li);
      });
      dropdown.style.display = 'block';
    }

    newInput.addEventListener('input', e => renderDropdown(e.target.value));
    newInput.addEventListener('keydown', e => {
      if (e.key === 'Escape') { _closeSearch(); _selectedCell = null; _renderCells(); }
      if (e.key === 'Enter') {
        const first = dropdown.querySelector('.sp-item:not(.sp-used)');
        if (first) first.dispatchEvent(new MouseEvent('mousedown'));
      }
    });

    panel.classList.add('open');
    setTimeout(() => newInput.focus(), 80);
  }

  function _closeSearch() {
    document.getElementById('search-panel').classList.remove('open');
  }

  function _selectState(stateId) {
    if (!_selectedCell) return;
    const { r, c } = _selectedCell;
    const isCorrect = _puzzle.solution[r][c] === stateId;

    if (isCorrect) {
      // Lock the cell with the correct state
      _grid[r][c] = stateId;

      // Golden State detection: did the player just place the puzzle's secret
      // column-wildcard state? One-time bonus per puzzle.
      if (_puzzle.goldenState && stateId === _puzzle.goldenState && !_goldenFound) {
        _goldenFound = true;
        _bumpStat('golden_total', 1);
        _showGoldenToast(stateId);
      }

      _closeSearch();
      _selectedCell = null;
      _renderCells();
      _updateScore();
      _saveProgress();
      _checkSolved();
      return;
    }

    // Wrong: show the state briefly with red flash, then remove it.
    // IMPORTANT: do NOT save the wrong state to progress — only commit the
    // mistake count + the nulled cell once the flash is done. This prevents
    // a reload during the 600ms flash from leaking the (wrong) state.
    _errors = Math.min(_errors + 1, MAX_ERRORS);
    _grid[r][c] = stateId;
    _closeSearch();
    _renderCells();
    _updateScore();
    _announce(I18n.t('wrong_state') || 'Wrong state, try again');

    const cell = document.querySelector(`.cell[data-r="${r}"][data-c="${c}"]`);
    if (cell) {
      cell.classList.add('shake');
      setTimeout(() => {
        _grid[r][c] = null;
        cell.classList.remove('shake');
        _selectedCell = null;
        _renderCells();
        _saveProgress(); // only persist after the wrong state is cleared
        if (_errors >= MAX_ERRORS) _triggerGameOver();
      }, 600);
    }
  }

  // ── Live region announcer (a11y) ─────────────────────────────────────────
  function _announce(msg) {
    const el = document.getElementById('a11y-live');
    if (!el) return;
    el.textContent = '';
    setTimeout(() => { el.textContent = msg; }, 50);
  }


  function _triggerGameOver() {
    _gameOver = true;
    _saveProgress();
    _updateStatsLoss();
    if (typeof Analytics !== 'undefined') {
      Analytics.track('puzzle_lost', { puzzle_date: _dateStr, mistakes: MAX_ERRORS });
    }
    setTimeout(() => _showGameOverBanner(), 350);
  }

  function _showGameOverBanner() {
    const el = document.getElementById('gameover-banner');
    if (el) el.style.display = 'flex';
    const solEl = document.getElementById('gameover-solution');
    if (solEl) {
      solEl.innerHTML = '';
      for (let r = 0; r < 3; r++) {
        for (let c = 0; c < 3; c++) {
          const sid = _puzzle.solution[r][c];
          const validIds = (_puzzle.cells && _puzzle.cells[r] && _puzzle.cells[r][c]) || [sid];
          const div = document.createElement('div');
          div.className = 'gos-cell';
          // List EVERY state that satisfied row + col, highlight the unique solution
          const optsHtml = validIds.map(id =>
            `<span class="gos-opt${id === sid ? ' gos-opt-pick' : ''}">${id}</span>`
          ).join('');
          div.innerHTML = `<div class="gos-opts">${optsHtml}</div>`;
          solEl.appendChild(div);
        }
      }
    }
    _renderInlineShareRow('gameover');
    _injectResultEmailCTA('gameover');
  }

  // ── Win ───────────────────────────────────────────────────────────────────
  function _checkSolved() {
    const ok = _grid.every((row, r) => row.every((s, c) => s && _puzzle.solution[r][c] === s));
    if (!ok) return;
    _solved = true;
    const elapsed = Math.floor((Date.now() - _startTime) / 1000);
    _solveTime = elapsed;
    _saveProgress();
    _updateStats(elapsed);

    if (typeof Analytics !== 'undefined') {
      Analytics.track('puzzle_solve', { puzzle_date: _dateStr, time_seconds: elapsed, mistakes: _errors });
    }

    setTimeout(() => { _showSolvedBanner(); _renderCells(); }, 350);
  }

  function _showSolvedBanner() {
    const el = document.getElementById('solved-banner');
    if (el) el.style.display = 'flex';
    _renderResultEmojiGrid();
    _renderResultStats();
    _renderInlineShareRow('solved');
    _injectResultEmailCTA();
    _fireConfetti();
    if (typeof Ads !== 'undefined' && Ads.refresh) Ads.refresh();
  }

  // After-solve / after-gameover email CTA — prominent card below share row
  function _injectResultEmailCTA(which = 'solved') {
    if (typeof EmailReminder === 'undefined') return;
    if (localStorage.getItem('statedoku_email_subscribed')) return;
    const banner = document.getElementById(which + '-banner');
    if (!banner || banner.querySelector('.result-email-cta')) return;
    const cta = document.createElement('button');
    cta.type = 'button';
    cta.className = 'result-email-cta';
    const txt = (typeof I18n !== 'undefined' && I18n.t)
      ? (I18n.t('email_get_tomorrow') !== 'email_get_tomorrow' ? I18n.t('email_get_tomorrow') : null)
      : null;
    cta.innerHTML = `<span class="rec-ico">📧</span><span class="rec-text">${txt || "Tomorrow's puzzle in your inbox"}</span><span class="rec-arr">→</span>`;
    cta.addEventListener('click', () => EmailReminder.openModal());
    banner.appendChild(cta);
  }

  // ── Compact result helpers (mini emoji grid, inline stats, inline share row) ──
  function _renderResultEmojiGrid() {
    const host = document.getElementById('result-emoji-solved');
    if (!host) return;
    host.innerHTML = '';
    for (let r = 0; r < 3; r++) {
      for (let c = 0; c < 3; c++) {
        const span = document.createElement('span');
        const s = _grid[r][c];
        span.textContent = (s && _puzzle.solution[r][c] === s) ? '🟩' : (s ? '🟥' : '⬜');
        host.appendChild(span);
      }
    }
  }

  function _fmtTime(sec) {
    if (sec == null) return '—';
    const m = Math.floor(sec / 60), s = sec % 60;
    return `${m}:${String(s).padStart(2,'0')}`;
  }

  function _renderResultStats() {
    const host = document.getElementById('result-stats-solved');
    if (!host) return;
    const stats = _getStats();
    const elapsed = _solveTime != null ? _solveTime : Math.floor((Date.now() - _startTime) / 1000);
    const lang = I18n.getLang();
    const L = {
      en: { time: 'time',  streak: 'streak', err: 'mistakes' },
      fr: { time: 'temps', streak: 'série',  err: 'erreurs' },
      es: { time: 'tiempo',streak: 'racha',  err: 'errores' },
    }[lang] || { time: 'time', streak: 'streak', err: 'mistakes' };
    host.innerHTML = `
      <span><b>${_fmtTime(elapsed)}</b>${L.time}</span>
      <span class="rs-sep"></span>
      <span><b>${stats.streak || 1}</b>${L.streak}</span>
      <span class="rs-sep"></span>
      <span><b>${_errors}/3</b>${L.err}</span>
    `;
  }

  // 5 inline share platforms shown directly in the result card
  const _INLINE_SHARE = [
    { id: 'whatsapp', color: '#25D366',
      svg: '<svg viewBox="0 0 24 24" fill="currentColor"><path d="M17.5 14.4c-.3-.1-1.8-.9-2-1-.3-.1-.5-.1-.7.1s-.8 1-1 1.2c-.2.2-.3.2-.6.1-.3-.2-1.3-.5-2.4-1.5-.9-.8-1.5-1.8-1.7-2.1-.2-.3 0-.5.1-.6.1-.1.3-.3.4-.5.1-.2.2-.3.3-.5.1-.2 0-.4 0-.5-.1-.1-.7-1.6-.9-2.2-.2-.6-.5-.5-.7-.5h-.6c-.2 0-.5.1-.8.4-.3.3-1 1-1 2.5s1.1 2.9 1.2 3.1c.1.2 2.1 3.2 5.1 4.5.7.3 1.3.5 1.7.6.7.2 1.4.2 1.9.1.6-.1 1.8-.7 2-1.4.2-.7.2-1.3.2-1.4-.1-.1-.3-.2-.6-.4M12 21.8c-1.7 0-3.5-.5-5-1.4l-.4-.2-3.7 1 1-3.6-.2-.4c-1-1.6-1.5-3.4-1.5-5.3 0-5.4 4.4-9.9 9.9-9.9 2.6 0 5.1 1 7 2.9 1.9 1.9 2.9 4.4 2.9 7-.1 5.5-4.5 9.9-10 9.9m8.4-18.3C18.2 1.2 15.2 0 12 0 5.5 0 .2 5.3.2 11.9c0 2.1.5 4.1 1.6 5.9L0 24l6.3-1.7c1.7.9 3.7 1.4 5.7 1.4 6.6 0 11.9-5.3 11.9-11.9 0-3.2-1.3-6.2-3.5-8.4"/></svg>' },
    { id: 'twitter', color: '#000000',
      svg: '<svg viewBox="0 0 24 24" fill="currentColor"><path d="M18.244 2.25h3.308l-7.227 8.26 8.502 11.24H16.17l-5.214-6.817L4.99 21.75H1.68l7.73-8.835L1.254 2.25H8.08l4.713 6.231zm-1.161 17.52h1.833L7.084 4.126H5.117z"/></svg>' },
    { id: 'facebook', color: '#1877F2',
      svg: '<svg viewBox="0 0 24 24" fill="currentColor"><path d="M24 12.073C24 5.405 18.627 0 12 0S0 5.405 0 12.073C0 18.1 4.388 23.094 10.125 24v-8.437H7.078v-3.49h3.047V9.412c0-3.017 1.791-4.683 4.533-4.683 1.313 0 2.686.235 2.686.235v2.965h-1.514c-1.491 0-1.956.93-1.956 1.884v2.26h3.328l-.532 3.49h-2.796V24C19.612 23.094 24 18.1 24 12.073"/></svg>' },
    { id: 'copy', color: '#0F2147',
      svg: '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><rect x="9" y="9" width="13" height="13" rx="2" ry="2"/><path d="M5 15H4a2 2 0 0 1-2-2V4a2 2 0 0 1 2-2h9a2 2 0 0 1 2 2v1"/></svg>' },
    { id: 'more', color: '#F59E0B',
      svg: '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><circle cx="18" cy="5" r="3"/><circle cx="6" cy="12" r="3"/><circle cx="18" cy="19" r="3"/><line x1="8.59" y1="13.51" x2="15.42" y2="17.49"/><line x1="15.41" y1="6.51" x2="8.59" y2="10.49"/></svg>' },
  ];

  function _renderInlineShareRow(which) {
    const root = document.querySelector(`.share-row[data-banner="${which}"]`);
    if (!root) return;
    root.innerHTML = '';
    _INLINE_SHARE.forEach(p => {
      const b = document.createElement('button');
      b.type = 'button';
      b.className = 'sr-btn';
      b.style.setProperty('--brand', p.color);
      b.setAttribute('aria-label', p.id);
      b.dataset.platform = p.id;
      b.innerHTML = p.svg;
      b.addEventListener('click', () => _inlineShareClick(p.id));
      root.appendChild(b);
    });
  }

  async function _inlineShareClick(id) {
    const body = getShareBody();
    const full = `${body}\n${SITE_URL}`;
    if (id === 'copy') {
      try { await navigator.clipboard.writeText(full); _showToast(I18n.t('copied') || 'Copied!'); } catch(e) {}
      return;
    }
    if (id === 'more') {
      if (navigator.share) {
        try { await navigator.share({ text: full, url: SITE_URL, title: 'Statedoku' }); } catch(e) {}
      } else {
        _openShareSheet();
      }
      return;
    }
    let url;
    if (id === 'whatsapp')     url = `https://wa.me/?text=${encodeURIComponent(full)}`;
    else if (id === 'twitter') url = `https://twitter.com/intent/tweet?text=${encodeURIComponent(body)}&url=${encodeURIComponent(SITE_URL)}`;
    else if (id === 'facebook')url = `https://www.facebook.com/sharer/sharer.php?u=${encodeURIComponent(SITE_URL)}&quote=${encodeURIComponent(body)}`;
    if (url) window.open(url, '_blank', 'noopener,noreferrer,width=620,height=560');
  }

  // ── Confetti celebration (lightweight, pure CSS particles) ───────────────
  function _fireConfetti() {
    // Respect prefers-reduced-motion
    if (window.matchMedia && window.matchMedia('(prefers-reduced-motion: reduce)').matches) return;

    const colors = ['#DC2626', '#FFFFFF', '#0F2147', '#F59E0B', '#1E3A8A'];
    const container = document.createElement('div');
    container.className = 'confetti-container';
    document.body.appendChild(container);

    const W = window.innerWidth;
    for (let i = 0; i < 80; i++) {
      const piece = document.createElement('div');
      piece.className = 'confetti-piece';
      const isStar = Math.random() < 0.2;
      piece.style.left = (Math.random() * W) + 'px';
      piece.style.background = isStar ? 'transparent' : colors[Math.floor(Math.random() * colors.length)];
      if (isStar) { piece.textContent = '★'; piece.style.color = '#F59E0B'; }
      piece.style.width  = isStar ? '14px' : (6 + Math.random() * 6) + 'px';
      piece.style.height = isStar ? '14px' : (8 + Math.random() * 6) + 'px';
      piece.style.animationDelay = (Math.random() * 0.4) + 's';
      piece.style.animationDuration = (2.2 + Math.random() * 1.5) + 's';
      piece.style.setProperty('--end-x', ((Math.random() - 0.5) * 200) + 'px');
      piece.style.setProperty('--rot', (Math.random() * 720 - 360) + 'deg');
      container.appendChild(piece);
    }
    setTimeout(() => container.remove(), 4500);
  }

  // ── Share ─────────────────────────────────────────────────────────────────
  const SITE_URL = 'https://statedoku.com';

  function getShareBody() {
    const d = new Date(_dateStr + 'T00:00:00');
    const ds = `${String(d.getDate()).padStart(2,'0')}/${String(d.getMonth()+1).padStart(2,'0')}`;
    let grid = '';
    for (let r = 0; r < 3; r++) {
      for (let c = 0; c < 3; c++) {
        const s = _grid[r][c];
        grid += (s && _puzzle.solution[r][c] === s) ? '🟩' : s ? '🟥' : '⬜';
      }
      grid += '\n';
    }
    const gold = (_goldenFound && _puzzle.goldenState) ? ' 🌟' : '';
    return `Statedoku 🗺️ ${ds}${gold}\n${grid.trim()}`;
  }
  // Backwards-compat: full share text (body + URL)
  function getShareText() { return `${getShareBody()}\n${SITE_URL}`; }

  // ── Share sheet (multi-platform) ──────────────────────────────────────────
  const SHARE_PLATFORMS = [
    {
      id: 'whatsapp', label: 'WhatsApp', color: '#25D366',
      icon: '<path d="M17.472 14.382c-.297-.149-1.758-.867-2.03-.967-.273-.099-.471-.148-.67.15-.197.297-.767.966-.94 1.164-.173.199-.347.223-.644.075-.297-.15-1.255-.463-2.39-1.475-.883-.788-1.48-1.761-1.653-2.059-.173-.297-.018-.458.13-.606.134-.133.298-.347.446-.52.149-.174.198-.298.298-.497.099-.198.05-.371-.025-.52-.075-.149-.669-1.612-.916-2.207-.242-.579-.487-.5-.669-.51-.173-.008-.371-.01-.57-.01-.198 0-.52.074-.792.372-.272.297-1.04 1.016-1.04 2.479 0 1.462 1.065 2.875 1.213 3.074.149.198 2.096 3.2 5.077 4.487.709.306 1.262.489 1.694.625.712.227 1.36.195 1.871.118.571-.085 1.758-.719 2.006-1.413.248-.694.248-1.289.173-1.413-.074-.124-.272-.198-.57-.347M12.05 21.785h-.004a9.87 9.87 0 01-5.031-1.378l-.361-.214-3.741.982.998-3.648-.235-.374a9.86 9.86 0 01-1.51-5.26c.001-5.45 4.436-9.884 9.888-9.884 2.64 0 5.122 1.03 6.988 2.898a9.825 9.825 0 012.893 6.994c-.003 5.45-4.437 9.884-9.885 9.884m8.413-18.297A11.815 11.815 0 0012.05 0C5.495 0 .16 5.335.157 11.892c0 2.096.547 4.142 1.588 5.945L.057 24l6.305-1.654a11.882 11.882 0 005.683 1.448h.005c6.554 0 11.89-5.335 11.893-11.893a11.821 11.821 0 00-3.48-8.413"/>',
      url: (body) => `https://wa.me/?text=${encodeURIComponent(body + '\n' + SITE_URL)}`,
    },
    {
      id: 'twitter', label: 'X / Twitter', color: '#000000',
      icon: '<path d="M18.244 2.25h3.308l-7.227 8.26 8.502 11.24H16.17l-5.214-6.817L4.99 21.75H1.68l7.73-8.835L1.254 2.25H8.08l4.713 6.231zm-1.161 17.52h1.833L7.084 4.126H5.117z"/>',
      url: (body) => {
        const tweet = `I just played today's Statedoku 🇺🇸 — the daily US states puzzle, like Sudoku with American geography.\n\n${body}\n\n#Statedoku — try it:`;
        return `https://twitter.com/intent/tweet?text=${encodeURIComponent(tweet)}&url=${encodeURIComponent(SITE_URL)}`;
      },
    },
    {
      id: 'facebook', label: 'Facebook', color: '#1877F2',
      icon: '<path d="M24 12.073c0-6.627-5.373-12-12-12s-12 5.373-12 12c0 5.99 4.388 10.954 10.125 11.854v-8.385H7.078v-3.47h3.047V9.43c0-3.007 1.792-4.669 4.533-4.669 1.312 0 2.686.235 2.686.235v2.953H15.83c-1.491 0-1.956.925-1.956 1.874v2.25h3.328l-.532 3.47h-2.796v8.385C19.612 23.027 24 18.062 24 12.073z"/>',
      url: (body) => `https://www.facebook.com/sharer/sharer.php?u=${encodeURIComponent(SITE_URL)}&quote=${encodeURIComponent(body)}`,
    },
    {
      id: 'telegram', label: 'Telegram', color: '#0088CC',
      icon: '<path d="M11.944 0A12 12 0 0 0 0 12a12 12 0 0 0 12 12 12 12 0 0 0 12-12A12 12 0 0 0 12 0a12 12 0 0 0-.056 0zm4.962 7.224c.1-.002.321.023.465.14a.506.506 0 0 1 .171.325c.016.093.036.306.02.472-.18 1.898-.962 6.502-1.36 8.627-.168.9-.499 1.201-.82 1.23-.696.065-1.225-.46-1.9-.902-1.056-.693-1.653-1.124-2.678-1.8-1.185-.78-.417-1.21.258-1.91.177-.184 3.247-2.977 3.307-3.23.007-.032.014-.15-.056-.212s-.174-.041-.249-.024c-.106.024-1.793 1.14-5.061 3.345-.48.33-.913.49-1.302.48-.428-.008-1.252-.241-1.865-.44-.752-.245-1.349-.374-1.297-.789.027-.216.325-.437.893-.663 3.498-1.524 5.83-2.529 6.998-3.014 3.332-1.386 4.025-1.627 4.476-1.635z"/>',
      url: (body) => `https://t.me/share/url?url=${encodeURIComponent(SITE_URL)}&text=${encodeURIComponent(body)}`,
    },
    {
      id: 'reddit', label: 'Reddit', color: '#FF4500',
      icon: '<path d="M12 0A12 12 0 0 0 0 12a12 12 0 0 0 12 12 12 12 0 0 0 12-12A12 12 0 0 0 12 0zm5.01 4.744c.688 0 1.25.561 1.25 1.249a1.25 1.25 0 0 1-2.498.056l-2.597-.547-.8 3.747c1.824.07 3.48.632 4.674 1.488.308-.309.73-.491 1.207-.491.968 0 1.754.786 1.754 1.754 0 .716-.435 1.333-1.01 1.614a3.111 3.111 0 0 1 .042.52c0 2.694-3.13 4.87-7.004 4.87-3.874 0-7.004-2.176-7.004-4.87 0-.183.015-.366.043-.534A1.748 1.748 0 0 1 4.028 12c0-.968.786-1.754 1.754-1.754.463 0 .898.196 1.207.49 1.207-.883 2.878-1.43 4.744-1.487l.885-4.182a.342.342 0 0 1 .14-.197.35.35 0 0 1 .238-.042l2.906.617a1.214 1.214 0 0 1 1.108-.701zM9.25 12C8.561 12 8 12.562 8 13.25c0 .687.561 1.248 1.25 1.248.687 0 1.248-.561 1.248-1.249 0-.688-.561-1.249-1.249-1.249zm5.5 0c-.687 0-1.248.561-1.248 1.25 0 .687.561 1.248 1.249 1.248.688 0 1.249-.561 1.249-1.249 0-.687-.562-1.249-1.25-1.249zm-5.466 3.99a.327.327 0 0 0-.231.094.33.33 0 0 0 0 .463c.842.842 2.484.913 2.961.913.477 0 2.105-.056 2.961-.913a.361.361 0 0 0 .029-.463.33.33 0 0 0-.464 0c-.547.533-1.684.73-2.512.73-.828 0-1.979-.196-2.512-.73a.326.326 0 0 0-.232-.095z"/>',
      url: (body) => `https://reddit.com/submit?title=${encodeURIComponent("Today's Statedoku")}&url=${encodeURIComponent(SITE_URL)}&text=${encodeURIComponent(body)}`,
    },
    {
      id: 'email', label: 'Email', color: '#525252',
      icon: '<path fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" d="M4 4h16c1.1 0 2 .9 2 2v12c0 1.1-.9 2-2 2H4c-1.1 0-2-.9-2-2V6c0-1.1.9-2 2-2z"/><polyline fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" points="22,6 12,13 2,6"/>',
      url: (body) => `mailto:?subject=${encodeURIComponent("I just played today's Statedoku!")}&body=${encodeURIComponent(body + '\n\nPlay today: ' + SITE_URL)}`,
    },
    {
      id: 'sms', label: 'SMS', color: '#34D399',
      icon: '<path fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" d="M21 15a2 2 0 0 1-2 2H7l-4 4V5a2 2 0 0 1 2-2h14a2 2 0 0 1 2 2z"/>',
      url: (body) => `sms:?&body=${encodeURIComponent(body + ' ' + SITE_URL)}`,
    },
    {
      id: 'copy', label: 'Copy', color: '#0F2147',
      icon: '<rect fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" x="9" y="9" width="13" height="13" rx="2" ry="2"/><path fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" d="M5 15H4a2 2 0 0 1-2-2V4a2 2 0 0 1 2-2h9a2 2 0 0 1 2 2v1"/>',
      url: null, // handled specially
    },
  ];

  function _buildShareSheet() {
    if (document.getElementById('share-sheet')) return;
    const sheet = document.createElement('div');
    sheet.id = 'share-sheet';
    sheet.setAttribute('role', 'dialog');
    sheet.setAttribute('aria-modal', 'true');
    sheet.innerHTML = `
      <div class="share-overlay"></div>
      <div class="share-content">
        <div class="share-head">
          <h3>${I18n.t('share_result') || 'Share your result'}</h3>
          <button class="share-close" type="button" aria-label="Close">✕</button>
        </div>
        <pre class="share-preview" id="share-preview"></pre>
        <div class="share-grid">
          ${SHARE_PLATFORMS.map(p => `
            <button class="share-btn" data-share="${p.id}" type="button" style="--brand:${p.color}">
              <span class="share-ico"><svg viewBox="0 0 24 24">${p.icon}</svg></span>
              <span class="share-label">${p.label}</span>
            </button>
          `).join('')}
          ${navigator.share ? `
            <button class="share-btn share-btn-native" data-share="native" type="button" style="--brand:#F59E0B">
              <span class="share-ico"><svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><circle cx="18" cy="5" r="3"/><circle cx="6" cy="12" r="3"/><circle cx="18" cy="19" r="3"/><line x1="8.59" y1="13.51" x2="15.42" y2="17.49"/><line x1="15.41" y1="6.51" x2="8.59" y2="10.49"/></svg></span>
              <span class="share-label">More…</span>
            </button>` : ''}
        </div>
      </div>
    `;
    document.body.appendChild(sheet);

    sheet.querySelector('.share-close').addEventListener('click', _closeShareSheet);
    sheet.querySelector('.share-overlay').addEventListener('click', _closeShareSheet);
    sheet.addEventListener('keydown', e => { if (e.key === 'Escape') _closeShareSheet(); });
    sheet.querySelectorAll('[data-share]').forEach(btn => {
      btn.addEventListener('click', () => _doShare(btn.dataset.share));
    });
  }

  function _openShareSheet() {
    _buildShareSheet();
    const sheet = document.getElementById('share-sheet');
    const preview = document.getElementById('share-preview');
    if (preview) preview.textContent = getShareBody();
    sheet.classList.add('open');
  }
  function _closeShareSheet() {
    const sheet = document.getElementById('share-sheet');
    if (sheet) sheet.classList.remove('open');
  }

  async function _doShare(id) {
    const body = getShareBody();
    if (id === 'copy') {
      try { await navigator.clipboard.writeText(`${body}\n${SITE_URL}`); _showToast(I18n.t('copied') || 'Copied!'); } catch(e) {}
      _closeShareSheet();
      return;
    }
    if (id === 'native') {
      try { await navigator.share({ text: `${body}\n${SITE_URL}`, url: SITE_URL, title: 'Statedoku' }); }
      catch(e) {}
      _closeShareSheet();
      return;
    }
    const platform = SHARE_PLATFORMS.find(p => p.id === id);
    if (!platform || !platform.url) return;
    window.open(platform.url(body), '_blank', 'noopener,noreferrer,width=620,height=560');
    _closeShareSheet();
  }

  async function share() { _openShareSheet(); }

  function _showToast(msg) {
    const t = document.getElementById('toast');
    if (!t) return;
    t.textContent = msg;
    t.classList.add('show');
    setTimeout(() => t.classList.remove('show'), 2200);
  }

  // ── Stats ─────────────────────────────────────────────────────────────────
  function _getStats() {
    const raw = localStorage.getItem(CONFIG.STORAGE_KEY + '_stats');
    return raw ? JSON.parse(raw) : { played:0, won:0, streak:0, maxStreak:0, bestTime:null, lastDate:null };
  }

  function _updateStatsLoss() {
    const stats = _getStats();
    if (stats.lastDate === _dateStr) return;
    stats.played++;
    stats.streak = 0;
    stats.lastDate = _dateStr;
    localStorage.setItem(CONFIG.STORAGE_KEY + '_stats', JSON.stringify(stats));
    _renderStats(stats);
  }

  function _updateStats(elapsed) {
    const stats = _getStats();
    if (stats.lastDate === _dateStr) return;
    stats.played++; stats.won++;
    const yest = new Date(new Date(_dateStr+'T00:00:00').getTime()-86400000).toISOString().slice(0,10);
    stats.streak  = stats.lastDate === yest ? stats.streak + 1 : 1;
    stats.maxStreak = Math.max(stats.maxStreak, stats.streak);
    stats.lastDate  = _dateStr;
    if (!stats.bestTime || elapsed < stats.bestTime) stats.bestTime = elapsed;
    localStorage.setItem(CONFIG.STORAGE_KEY + '_stats', JSON.stringify(stats));
    _renderStats(stats);
  }

  function _renderStats(s) {
    s = s || _getStats();
    const set = (id, v) => { const el = document.getElementById(id); if (el) el.textContent = v; };
    set('stat-played',    s.played);
    set('stat-win-rate',  s.played ? Math.round(s.won/s.played*100)+'%' : '—');
    // Streak with progressive fire emoji (longer streak = hotter fire)
    const streakEl = document.getElementById('stat-streak');
    if (streakEl) {
      const n = s.streak || 0;
      let prefix = '';
      let tier = '';
      if (n >= 30)      { prefix = '🔥 '; tier = 'streak-gold'; }
      else if (n >= 14) { prefix = '🔥 '; tier = 'streak-red'; }
      else if (n >= 7)  { prefix = '🔥 '; tier = 'streak-orange'; }
      else if (n >= 3)  { prefix = '🔥 '; tier = 'streak-warm'; }
      streakEl.textContent = prefix + n;
      streakEl.className = 'stat-value ' + tier;
    }
    set('stat-best-time', s.bestTime ? _fmt(s.bestTime) : '—');
  }

  function _fmt(s) { return `${Math.floor(s/60)}:${String(s%60).padStart(2,'0')}`; }

  // ── Persistence ───────────────────────────────────────────────────────────
  function _saveProgress() {
    localStorage.setItem(CONFIG.STORAGE_KEY+'_progress_'+_dateStr,
      JSON.stringify({ grid:_grid, solved:_solved, gameOver:_gameOver, startTime:_startTime, errors:_errors, solveTime:_solveTime, goldenFound:_goldenFound }));
  }

  function _loadProgress() {
    const raw = localStorage.getItem(CONFIG.STORAGE_KEY+'_progress_'+_dateStr);
    if (!raw) { _startTime = Date.now(); return; }
    try {
      const d = JSON.parse(raw);
      _grid      = d.grid      || [[null,null,null],[null,null,null],[null,null,null]];
      _solved    = d.solved    || false;
      _gameOver  = d.gameOver  || false;
      _startTime = d.startTime || Date.now();
      _errors    = d.errors    || 0;
      _solveTime = d.solveTime || null;
      _goldenFound = !!d.goldenFound;

      // ── Defensive: detect corrupt progress (states visible but game not won/lost)
      // This can happen after a dev panel "Solve" run, or a stale wrong-flash save.
      // Any non-locked (i.e. not a correct placement) state in the grid is a leak.
      if (!_solved && !_gameOver) {
        let dirty = false;
        for (let r = 0; r < 3; r++) {
          for (let c = 0; c < 3; c++) {
            const s = _grid[r][c];
            if (s && _puzzle.solution[r][c] !== s) {
              _grid[r][c] = null;
              dirty = true;
            }
          }
        }
        if (dirty) _saveProgress();
      }

      if (_gameOver) setTimeout(() => _showGameOverBanner(), 100);
    } catch(e) { _startTime = Date.now(); }
  }

  // ── Reminder toggle (inside stats modal) ─────────────────────────────────
  function _refreshReminderUI() {
    const row = document.getElementById('reminder-row');
    if (!row || typeof Reminders === 'undefined') return;
    const enabled = Reminders.isEnabled();
    const pref = Reminders.getPref();
    const status = document.getElementById('reminder-status');
    const btn = document.getElementById('reminder-toggle');
    const time = document.getElementById('reminder-time');
    if (enabled && pref) {
      if (status) status.textContent = (I18n.t('remind_on') || 'On — daily at') + ' ' + pref.time;
      if (btn) btn.textContent = I18n.t('disable') || 'Disable';
      if (time) time.value = pref.time;
    } else {
      if (status) {
        const perm = Reminders.permission();
        if (perm === 'denied')      status.textContent = I18n.t('remind_blocked') || 'Blocked by browser';
        else if (perm === 'unsupported') status.textContent = I18n.t('remind_unsupported') || 'Not supported here';
        else                        status.textContent = I18n.t('remind_off') || 'Off';
      }
      if (btn) btn.textContent = I18n.t('enable') || 'Enable';
    }
  }

  async function _toggleReminder() {
    if (typeof Reminders === 'undefined') return;
    const time = document.getElementById('reminder-time')?.value || '09:00';
    if (Reminders.isEnabled()) {
      Reminders.disable();
    } else {
      const r = await Reminders.enable(time);
      if (!r.ok && r.reason === 'denied') {
        alert(I18n.t('remind_help') || 'Browser notifications are blocked. Enable them in your browser settings, then try again.');
      } else if (!r.ok && r.reason === 'unsupported') {
        alert('Your browser does not support notifications.');
      }
    }
    _refreshReminderUI();
  }

  // ── Public ────────────────────────────────────────────────────────────────
  function showStats()     { _renderStats(); document.getElementById('stats-modal').classList.add('open'); _refreshReminderUI(); }
  function showHowToPlay() { document.getElementById('howto-modal').classList.add('open'); }
  function rerender()      { if (_puzzle) { _render(); _updateDateDisplay(); } }

  // ── Dev helpers (exposed for /superadmin panel) ─────────────────────────
  function _devGetPuzzle()  { return _puzzle; }
  function _devGetGrid()    { return _grid; }
  function _devSolve()      {
    if (!_puzzle) return;
    _grid = _puzzle.solution.map(r => r.slice());
    _solved = true; _gameOver = false; _errors = 0;
    // NOTE: do NOT call _saveProgress() — dev solves should not pollute the
    // player's localStorage. On reload, the grid will be blank again.
    _renderCells(); _updateScore();
    setTimeout(() => _showSolvedBanner(), 100);
  }
  function _devRevealRow(r) {
    if (!_puzzle) return;
    for (let c = 0; c < 3; c++) _grid[r][c] = _puzzle.solution[r][c];
    _renderCells(); _updateScore(); _saveProgress();
    _checkSolved();
  }
  function _devResetCurrent() {
    localStorage.removeItem(CONFIG.STORAGE_KEY + '_progress_' + _dateStr);
    localStorage.removeItem(CONFIG.STORAGE_KEY + '_puzzle_'   + _dateStr);
    location.reload();
  }

  // ── Golden State helpers ──────────────────────────────────────────────
  function _bumpStat(key, delta) {
    try {
      const cur = parseInt(localStorage.getItem(CONFIG.STORAGE_KEY + '_' + key) || '0', 10);
      localStorage.setItem(CONFIG.STORAGE_KEY + '_' + key, String(cur + delta));
    } catch {}
  }

  function _showGoldenToast(stateId) {
    const state = _stateMap[stateId];
    const name = state ? state.names[I18n.getLang()] : stateId;
    // Reuse the announcer for a11y
    _announce(`🌟 Golden State found: ${name}`);
    // Visual toast
    let toast = document.getElementById('golden-toast');
    if (!toast) {
      toast = document.createElement('div');
      toast.id = 'golden-toast';
      toast.className = 'golden-toast';
      toast.setAttribute('role', 'status');
      toast.setAttribute('aria-live', 'polite');
      document.body.appendChild(toast);
    }
    toast.innerHTML = `<span class="gt-star">🌟</span><span class="gt-text"><strong>Golden State!</strong><br><small>${name} satisfies all 3 column criteria</small></span>`;
    toast.classList.remove('show');
    // Force reflow so the animation re-triggers
    void toast.offsetWidth;
    toast.classList.add('show');
    clearTimeout(_showGoldenToast._t);
    _showGoldenToast._t = setTimeout(() => toast.classList.remove('show'), 3800);
    // Light haptic on mobile
    if (navigator.vibrate) { try { navigator.vibrate([20, 30, 20]); } catch {} }
  }

  return { init, share, showStats, showHowToPlay, rerender, _toggleReminder,
           _dev: { getPuzzle:_devGetPuzzle, getGrid:_devGetGrid, solve:_devSolve, revealRow:_devRevealRow, resetCurrent:_devResetCurrent } };
})();

// ──────────────────────── SUPERADMIN DEV PANEL ────────────────────────────
const DevPanel = (() => {
  let _open = false;
  let _activeTab = 'tools'; // 'tools' | 'constraints'

  // Constraint categories (id-prefix-based; matches puzzle.js constraints)
  const CATEGORIES = [
    { key: 'region',   label: 'Regions',           ids: ['region_west','region_south','region_midwest','region_northeast'] },
    { key: 'sub',      label: 'Subregions',        ids: ['sub_new_england','sub_mid_atlantic','sub_deep_south','sub_plains','sub_mountain'] },
    { key: 'belts',    label: 'Belts & zones',     ids: ['sun_belt','snow_belt','corn_belt','wheat_belt','cotton_belt','bible_belt','rust_belt'] },
    { key: 'pop',      label: 'Population',        ids: ['pop_lt1m','pop_1m5m','pop_5m10m','pop_gt10m'] },
    { key: 'coast',    label: 'Coastline / borders', ids: ['coast_atlantic','coast_pacific','coast_gulf','coast_great_lakes','landlocked','border_canada','border_mexico'] },
    { key: 'tz',       label: 'Timezones',         ids: ['tz_eastern','tz_central','tz_mountain','tz_pacific','multi_timezone'] },
    { key: 'politics', label: 'Politics',          ids: ['political_red','political_blue','political_swing','trump_2024','biden_2020'] },
    { key: 'hist',     label: 'History',           ids: ['original_13','confederate','statehood_pre_1800','statehood_1900s'] },
    { key: 'geo',      label: 'Geography',         ids: ['on_mississippi','mt_rockies','mt_appalachians','desert_state','four_corners','great_plains','appalachian','tornado_alley','hurricane_zone','earthquake_zone','has_volcano','has_glaciers','on_appalachian_trail','on_continental_divide','has_caves','high_elevation','low_elevation','route_66'] },
    { key: 'cities',   label: 'Cities & geography',ids: ['has_million_city','largest_state','smallest_state','capital_named_after_president','capital_starts_with_s','borders_6_plus','borders_few'] },
    { key: 'sports',   label: 'Pro sports',        ids: ['has_nba','no_pro_team'] },
    { key: 'name-origin',label: 'Name origin',     ids: ['name_native_origin','name_spanish_origin','name_royalty_origin'] },
    { key: 'name-prop',label: 'Name properties',   ids: ['two_word_name','ends_in_vowel','double_letter','vowel_start','consonant_start','has_new','ends_in_a','ends_in_o','ends_in_e','ends_in_n','ends_in_s','starts_and_ends_vowel','contains_letter_k','contains_letter_w','contains_letter_v','contains_letter_y','short_name','long_name','double_s','two_word_starts_n'] },
    { key: 'name-len', label: 'Name length',       ids: ['letters_6','letters_7','letters_8','letters_9'] },
    { key: 'name-start',label:'Starts with letter',ids: ['starts_a','starts_i','starts_m','starts_n','starts_w'] },
  ];

  function _enabled() {
    return typeof Admin !== 'undefined' && Admin.isAuthenticated();
  }

  function _enable() {
    if (!document.getElementById('dev-fab')) _mount();
  }

  function _mount() {
    // Floating button
    const fab = document.createElement('button');
    fab.id = 'dev-fab';
    fab.innerHTML = '⚡';
    fab.title = 'Dev panel (Shift+D)';
    fab.addEventListener('click', toggle);
    document.body.appendChild(fab);

    // Panel
    const panel = document.createElement('div');
    panel.id = 'dev-panel';
    panel.innerHTML = `
      <div class="dev-head">
        <strong>⚡ DEV PANEL</strong>
        <button class="dev-close" aria-label="Close">✕</button>
      </div>
      <div class="dev-tabs">
        <button class="dev-tab active" data-tab="tools">Tools</button>
        <button class="dev-tab" data-tab="constraints">Constraints</button>
      </div>
      <div class="dev-body" id="dev-tab-tools">
        <label class="dev-row">
          <span>Jump to date</span>
          <input type="date" id="dev-date" value="${new URLSearchParams(location.search).get('date') || Puzzle.getTodayStr()}">
        </label>
        <div class="dev-row dev-buttons">
          <button data-act="prev">◀ Prev day</button>
          <button data-act="today">Today</button>
          <button data-act="next">Next day ▶</button>
        </div>
        <div class="dev-row dev-buttons">
          <button data-act="rand">🎲 Random date</button>
          <button data-act="rand7">+7 days random</button>
        </div>
        <div class="dev-row dev-buttons">
          <button data-act="reset">↺ Reset this puzzle</button>
          <button data-act="solve">✓ Auto-solve</button>
        </div>
        <div class="dev-row dev-buttons">
          <button data-act="wipe" class="danger">🗑 Wipe ALL local data</button>
        </div>
        <div class="dev-row dev-buttons">
          <button data-act="dashboard">📊 Open admin dashboard</button>
          <button data-act="tweets">🐦 100 tweets bank</button>
        </div>
        <div class="dev-info" id="dev-info"></div>
        <div class="dev-section-title">Feature flags</div>
        <label class="dev-flag-row">
          <span><strong>Ads</strong><br><small>Enable AdSense slots + consent banner for everyone</small></span>
          <input type="checkbox" id="dev-flag-ads">
        </label>
        <div class="dev-row dev-buttons">
          <button data-act="logout" class="danger">🔒 Lock admin (logout)</button>
        </div>
      </div>
      <div class="dev-body" id="dev-tab-constraints" style="display:none">
        <div class="dev-cstr-toolbar">
          <input type="search" id="dev-cstr-search" placeholder="Filter…">
          <button data-act="cstr-reset-all" class="dev-mini">Re-enable all</button>
        </div>
        <div class="dev-cstr-summary" id="dev-cstr-summary"></div>
        <div id="dev-cstr-list"></div>
        <div class="dev-cstr-hint">
          ℹ Changes apply to future puzzles. To regenerate the current one, switch to <strong>Tools</strong> and click <strong>↺ Reset this puzzle</strong>.
        </div>
      </div>
    `;
    document.body.appendChild(panel);

    panel.querySelector('.dev-close').addEventListener('click', toggle);
    panel.querySelectorAll('[data-act]').forEach(btn =>
      btn.addEventListener('click', () => _act(btn.dataset.act)));
    panel.querySelectorAll('.dev-tab').forEach(btn =>
      btn.addEventListener('click', () => _switchTab(btn.dataset.tab)));
    document.getElementById('dev-date').addEventListener('change', e =>
      _goto(e.target.value));
    document.getElementById('dev-cstr-search').addEventListener('input', e =>
      _renderConstraints(e.target.value));

    document.addEventListener('keydown', e => {
      if (e.shiftKey && (e.key === 'D' || e.key === 'd')) toggle();
    });

    _refreshInfo();
    _renderConstraints();
    _initAdsToggle();
  }

  function _switchTab(name) {
    _activeTab = name;
    document.querySelectorAll('.dev-tab').forEach(t =>
      t.classList.toggle('active', t.dataset.tab === name));
    document.getElementById('dev-tab-tools').style.display = name === 'tools' ? '' : 'none';
    document.getElementById('dev-tab-constraints').style.display = name === 'constraints' ? '' : 'none';
  }

  async function _renderConstraints(filter) {
    const list = document.getElementById('dev-cstr-list');
    const summary = document.getElementById('dev-cstr-summary');
    if (!list) return;

    const states = await Puzzle.loadStates();
    const disabled = new Set(Puzzle.getDisabled());
    const allIds = new Set(Puzzle.getAllConstraints());
    const allRowGroups = Puzzle.getAllRowGroups();
    const q = (filter || '').trim().toLowerCase();

    summary.innerHTML = `<strong>${allIds.size - disabled.size}</strong> active / ${allIds.size} total &nbsp;·&nbsp; <strong>${disabled.size}</strong> disabled`;

    list.innerHTML = '';
    CATEGORIES.forEach(cat => {
      const visible = cat.ids.filter(id => allIds.has(id) && (!q ||
        id.toLowerCase().includes(q) ||
        (I18n.constraint(id) || '').toLowerCase().includes(q)));
      if (visible.length === 0) return;

      const enabledCount = visible.filter(id => !disabled.has(id)).length;
      const section = document.createElement('div');
      section.className = 'dev-cstr-cat';
      section.innerHTML = `
        <div class="dev-cstr-cat-head">
          <span>${cat.label}</span>
          <span class="dev-cstr-cat-count">${enabledCount}/${visible.length}</span>
          <button class="dev-mini" data-cat-toggle="${cat.key}">Toggle all</button>
        </div>
      `;

      visible.forEach(id => {
        const count = Puzzle.countMatching(id, states);
        const isDisabled = disabled.has(id);
        const item = document.createElement('label');
        item.className = 'dev-cstr-item' + (isDisabled ? ' off' : '');
        item.innerHTML = `
          <input type="checkbox" data-cstr="${id}" ${isDisabled ? '' : 'checked'}>
          <span class="dev-cstr-label">${I18n.constraint(id) || id}</span>
          <span class="dev-cstr-meta">${count}</span>
        `;
        section.appendChild(item);
      });

      list.appendChild(section);

      section.querySelector('[data-cat-toggle]').addEventListener('click', () => {
        const allOn = visible.every(id => !disabled.has(id));
        visible.forEach(id => allOn ? disabled.add(id) : disabled.delete(id));
        Puzzle.setDisabled([...disabled]);
        _renderConstraints(filter);
        _refreshInfo();
      });

      section.querySelectorAll('[data-cstr]').forEach(cb => {
        cb.addEventListener('change', () => {
          const id = cb.dataset.cstr;
          if (cb.checked) disabled.delete(id); else disabled.add(id);
          Puzzle.setDisabled([...disabled]);
          cb.closest('.dev-cstr-item').classList.toggle('off', !cb.checked);
          _refreshSummary();
        });
      });
    });

    // Also show count of viable row groups (with current disabled set)
    const viableGroups = allRowGroups.filter(g => !g.some(c => disabled.has(c))).length;
    summary.innerHTML += ` &nbsp;·&nbsp; <strong>${viableGroups}</strong> row groups available`;
  }

  function _refreshSummary() {
    const disabled = new Set(Puzzle.getDisabled());
    const allIds = Puzzle.getAllConstraints();
    const allRowGroups = Puzzle.getAllRowGroups();
    const viableGroups = allRowGroups.filter(g => !g.some(c => disabled.has(c))).length;
    const summary = document.getElementById('dev-cstr-summary');
    if (summary) {
      summary.innerHTML = `<strong>${allIds.length - disabled.size}</strong> active / ${allIds.length} total &nbsp;·&nbsp; <strong>${disabled.size}</strong> disabled &nbsp;·&nbsp; <strong>${viableGroups}</strong> row groups available`;
    }
  }

  function _act(name) {
    const p = Game._dev.getPuzzle();
    if (name === 'prev') return _goto(_shiftDate(-1));
    if (name === 'next') return _goto(_shiftDate(+1));
    if (name === 'today') return _goto(Puzzle.getTodayStr());
    if (name === 'rand') return _goto(_randomDate());
    if (name === 'rand7') return _goto(_shiftDate(Math.floor(Math.random() * 7) + 1));
    if (name === 'reset') return Game._dev.resetCurrent();
    if (name === 'solve') return Game._dev.solve();
    if (name === 'wipe') {
      if (confirm('Wipe all Statedoku localStorage? This clears every cached puzzle, progress and stats.')) {
        Object.keys(localStorage).filter(k => k.startsWith(CONFIG.STORAGE_KEY)).forEach(k => localStorage.removeItem(k));
        location.reload();
      }
    }
    if (name === 'cstr-reset-all') {
      Puzzle.setDisabled([]);
      _renderConstraints(document.getElementById('dev-cstr-search')?.value || '');
    }
    if (name === 'logout') {
      if (confirm('Lock the admin panel? You will need the password again to return.')) {
        Admin.logout();
      }
    }
    if (name === 'dashboard') window.open('/admin/dashboard/', '_blank');
    if (name === 'tweets') window.open('/marketing/tweets.html', '_blank');
  }

  function _initAdsToggle() {
    const cb = document.getElementById('dev-flag-ads');
    if (!cb) return;
    const stored = localStorage.getItem('statedoku_ads_force');
    cb.checked = (stored === '1') || (stored === null && CONFIG.ADS_ENABLED);
    cb.addEventListener('change', () => {
      localStorage.setItem('statedoku_ads_force', cb.checked ? '1' : '0');
      if (confirm('Ads flag changed. Reload to apply?')) location.reload();
    });
  }

  function _shiftDate(days) {
    const cur = new URLSearchParams(location.search).get('date') || Puzzle.getTodayStr();
    const [y,m,d] = cur.split('-').map(Number);
    const dt = new Date(y, m-1, d);
    dt.setDate(dt.getDate() + days);
    return `${dt.getFullYear()}-${String(dt.getMonth()+1).padStart(2,'0')}-${String(dt.getDate()).padStart(2,'0')}`;
  }

  function _randomDate() {
    // Random date in 2025–2027 range
    const start = new Date(2025, 0, 1).getTime();
    const end   = new Date(2027, 11, 31).getTime();
    const dt = new Date(start + Math.random() * (end - start));
    return `${dt.getFullYear()}-${String(dt.getMonth()+1).padStart(2,'0')}-${String(dt.getDate()).padStart(2,'0')}`;
  }

  function _goto(dateStr) {
    const url = new URL(location.href);
    url.searchParams.set('date', dateStr);
    url.searchParams.set('dev', '1');
    location.href = url.toString();
  }

  function _refreshInfo() {
    const p = Game._dev.getPuzzle();
    const el = document.getElementById('dev-info');
    if (!el || !p) return;
    const solStr = p.solution.flat().join(' · ');
    el.innerHTML = `
      <div><strong>Date:</strong> ${p.date}</div>
      <div><strong>Rows:</strong> ${p.rows.join(' / ')}</div>
      <div><strong>Cols:</strong> ${p.cols.join(' / ')}</div>
      <div><strong>Solution:</strong> ${solStr}</div>
    `;
  }

  function toggle() {
    _open = !_open;
    const panel = document.getElementById('dev-panel');
    if (panel) panel.classList.toggle('open', _open);
    if (_open) _refreshInfo();
  }

  return { check: () => { if (_enabled()) _enable(); }, enable: _enable };
})();

// ── DOM wiring ───────────────────────────────────────────────────────────────
document.addEventListener('DOMContentLoaded', async () => {
  const path        = location.pathname;
  const langFromPath = path.includes('/fr/') ? 'fr' : path.includes('/es/') ? 'es' : null;
  await I18n.init(langFromPath);

  const dateStr = new URLSearchParams(location.search).get('date') || Puzzle.getTodayStr();
  await Game.init(dateStr);

  // Dev panel — auto-mounts if ?dev=1 in URL, or if previously enabled
  DevPanel.check();

  // Close search panel on overlay click or Escape
  document.getElementById('sp-overlay')?.addEventListener('click', () => {
    document.getElementById('search-panel').classList.remove('open');
    // don't deselect — let user click elsewhere
  });

  // Close modals
  document.querySelectorAll('.modal-close, .modal-overlay').forEach(el =>
    el.addEventListener('click', () =>
      document.querySelectorAll('.modal').forEach(m => m.classList.remove('open'))));

  document.querySelectorAll('.modal-content').forEach(el =>
    el.addEventListener('click', e => e.stopPropagation()));

  // Lang switcher
  document.querySelectorAll('.lang-btn').forEach(btn =>
    btn.addEventListener('click', () => { I18n.setLang(btn.dataset.lang); Game.rerender(); }));

  // Buttons
  document.getElementById('btn-share')?.addEventListener('click', () => Game.share());
  document.getElementById('btn-stats')?.addEventListener('click', () => Game.showStats());
  document.getElementById('btn-howto')?.addEventListener('click', () => Game.showHowToPlay());
  document.getElementById('btn-share-banner')?.addEventListener('click', () => Game.share());
  document.getElementById('btn-share-gameover-banner')?.addEventListener('click', () => Game.share());
  document.getElementById('stats-email-cta')?.addEventListener('click', () => {
    document.querySelectorAll('.modal').forEach(m => m.classList.remove('open'));
    if (typeof EmailReminder !== 'undefined') EmailReminder.openModal();
  });
});
