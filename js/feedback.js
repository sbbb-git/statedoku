// Player ratings (18 November 2026, owner: "ils ont la possibilité de noter le
// jeu et laisser un commentaire ? Si non mets en place").
//
// At the end of a game, under the result, five stars and then an optional
// comment. Loaded on the three homepages (the daily game: solved and game-over
// cards) and on the 63 game pages (their #g-result, #pts-result or #ab-result
// card). One rating per device per puzzle date on the daily game, per page on
// a game; a star changed or a comment added updates the same row, through a
// random id kept in localStorage. Sent to /api/feedback, read by the owner on
// admin/dashboard/. No account, no email, no IP stored.
(function () {
  'use strict';
  var lang = (document.documentElement.lang || 'en').slice(0, 2);
  var NB = ' ';
  var T = {
    en: {
      qDaily: "Did you enjoy today's puzzle?", qGame: 'Did you enjoy this game?',
      star: '{n} out of 5', group: 'Rate it from 1 to 5 stars',
      ask: 'Thanks! Anything to tell us? (optional)',
      ph: 'What you liked, what we could improve...',
      note: 'Anonymous. Please leave out your email and personal details.',
      send: 'Send', done: 'Thanks for your feedback!',
      fail: 'Could not send, please try again later.'
    },
    fr: {
      qDaily: 'Ce puzzle t’a plu' + NB + '?', qGame: 'Ce jeu t’a plu' + NB + '?',
      star: '{n} sur 5', group: 'Note de 1 à 5 étoiles',
      ask: 'Merci' + NB + '! Un mot à nous dire' + NB + '? (facultatif)',
      ph: 'Ce que tu as aimé, ce qu’on peut améliorer...',
      note: 'Anonyme. N’écris ni ton adresse mail ni d’information personnelle.',
      send: 'Envoyer', done: 'Merci pour ton avis' + NB + '!',
      fail: 'Envoi impossible, réessaie plus tard.'
    },
    es: {
      qDaily: '¿Te gustó el puzzle de hoy?', qGame: '¿Te gustó este juego?',
      star: '{n} de 5', group: 'Puntúa de 1 a 5 estrellas',
      ask: '¡Gracias! ¿Algo que contarnos? (opcional)',
      ph: 'Lo que te gustó, lo que podemos mejorar...',
      note: 'Anónimo. No incluyas tu correo ni datos personales.',
      send: 'Enviar', done: '¡Gracias por tu opinión!',
      fail: 'No se pudo enviar, inténtalo más tarde.'
    }
  };
  var t = T[lang] || T.en;
  var page = location.pathname.replace(/index\.html$/, '');
  if (page.slice(-1) !== '/') page += '/';
  var uid = 0;

  function today() {
    try {
      if (typeof _dateParam === 'function' && _dateParam()) return _dateParam();
      if (typeof Puzzle !== 'undefined' && Puzzle.getTodayStr) return Puzzle.getTodayStr();
    } catch (e) {}
    var d = new Date();
    return d.getFullYear() + '-' + String(d.getMonth() + 1).padStart(2, '0') + '-' + String(d.getDate()).padStart(2, '0');
  }

  function newId() {
    if (window.crypto && crypto.randomUUID) return crypto.randomUUID();
    var b = new Uint8Array(16);
    crypto.getRandomValues(b);
    b[6] = (b[6] & 15) | 64; b[8] = (b[8] & 63) | 128;
    var h = Array.prototype.map.call(b, function (x) { return (x + 256).toString(16).slice(1); }).join('');
    return h.slice(0, 8) + '-' + h.slice(8, 12) + '-' + h.slice(12, 16) + '-' + h.slice(16, 20) + '-' + h.slice(20);
  }

  function load(key) {
    try { return JSON.parse(localStorage.getItem(key)) || null; } catch (e) { return null; }
  }
  function save(key, v) {
    try { localStorage.setItem(key, JSON.stringify(v)); } catch (e) {}
  }

  function post(body) {
    return fetch('/api/feedback', {
      method: 'POST', headers: { 'content-type': 'application/json' },
      body: JSON.stringify(body), keepalive: true
    }).then(function (r) { if (!r.ok) throw new Error(String(r.status)); });
  }

  function style() {
    if (document.getElementById('fb-css')) return;
    var s = document.createElement('style');
    s.id = 'fb-css';
    s.textContent =
      '.fb-box{width:100%;max-width:420px;margin:14px auto 0;padding-top:12px;border-top:1px solid #E5E7EB;text-align:center;font-family:inherit}' +
      '.fb-q{margin:0 0 4px;font-weight:700;font-size:.95rem;color:#0F2147}' +
      '.fb-stars{display:flex;justify-content:center;gap:2px}' +
      '.fb-star{background:none;border:0;cursor:pointer;font-size:30px;line-height:1;width:44px;height:44px;padding:0;color:#D1D5DB;transition:color .1s,transform .1s}' +
      '.fb-star.on{color:#F59E0B}.fb-star:hover{transform:scale(1.1)}' +
      '.fb-star:focus-visible{outline:3px solid #0F2147;outline-offset:1px;border-radius:6px}' +
      '.fb-more{margin-top:8px;text-align:left}.fb-more[hidden]{display:none}' +
      '.fb-ask{display:block;font-size:.88rem;font-weight:600;color:#0F2147;margin-bottom:6px}' +
      '.fb-more textarea{box-sizing:border-box;width:100%;min-height:64px;padding:8px 10px;border:1.5px solid #E5E7EB;border-radius:8px;font:inherit;font-size:16px;resize:vertical;color:#111827;background:#fff}' +
      '.fb-more textarea:focus{outline:none;border-color:#0F2147}' +
      '.fb-row{display:flex;align-items:center;justify-content:space-between;gap:10px;margin-top:6px}' +
      '.fb-note{margin:0;font-size:.75rem;color:#6B7280;line-height:1.35}' +
      '.fb-send{flex:none;background:#0F2147;color:#fff;border:0;border-radius:999px;padding:9px 18px;font:inherit;font-weight:700;font-size:.88rem;cursor:pointer}' +
      '.fb-send:disabled{opacity:.6;cursor:default}' +
      '.fb-done{margin:6px 0 0;font-size:.88rem;color:#059669;font-weight:600;min-height:1em}' +
      '.fb-done.err{color:#DC2626}';
    document.head.appendChild(s);
  }

  // host: the result card; daily: true on the homepages; outcome: won or lost.
  function mount(host, daily, outcome) {
    if (!host || host.querySelector('.fb-box')) return;
    style();
    var date = today();
    var key = 'statedoku_fb:' + page + (daily ? date : '');
    var st = load(key) || {};
    var n = ++uid;

    var box = document.createElement('div');
    box.className = 'fb-box';
    var q = document.createElement('p');
    q.className = 'fb-q'; q.id = 'fb-q-' + n;
    q.textContent = daily ? t.qDaily : t.qGame;
    var stars = document.createElement('div');
    stars.className = 'fb-stars';
    stars.setAttribute('role', 'group');
    stars.setAttribute('aria-label', t.group);
    var btns = [];
    for (var i = 1; i <= 5; i++) {
      var b = document.createElement('button');
      b.type = 'button'; b.className = 'fb-star'; b.textContent = '★';
      b.setAttribute('aria-label', t.star.replace('{n}', i));
      b.setAttribute('data-n', i);
      stars.appendChild(b); btns.push(b);
    }
    var more = document.createElement('div');
    more.className = 'fb-more'; more.hidden = true;
    var lab = document.createElement('label');
    lab.className = 'fb-ask'; lab.htmlFor = 'fb-c-' + n; lab.textContent = t.ask;
    var ta = document.createElement('textarea');
    ta.id = 'fb-c-' + n; ta.maxLength = 600; ta.rows = 2; ta.placeholder = t.ph;
    var row = document.createElement('div');
    row.className = 'fb-row';
    var note = document.createElement('p');
    note.className = 'fb-note'; note.textContent = t.note;
    var send = document.createElement('button');
    send.type = 'button'; send.className = 'fb-send'; send.textContent = t.send;
    row.appendChild(note); row.appendChild(send);
    more.appendChild(lab); more.appendChild(ta); more.appendChild(row);
    var done = document.createElement('p');
    done.className = 'fb-done'; done.setAttribute('role', 'status');
    box.appendChild(q); box.appendChild(stars); box.appendChild(more); box.appendChild(done);
    host.appendChild(box);

    function paint(k) {
      btns.forEach(function (x, j) {
        x.classList.toggle('on', j < k);
        x.setAttribute('aria-pressed', st.r === j + 1 ? 'true' : 'false');
      });
    }
    function body(extra) {
      var o = { id: st.id, rating: st.r, page: page, puzzle_date: date, lang: lang };
      if (outcome) o.outcome = outcome;
      for (var k in extra) o[k] = extra[k];
      return o;
    }
    paint(st.r || 0);
    if (st.r) {
      if (st.c) done.textContent = t.done; else more.hidden = false;
    }

    stars.addEventListener('mouseover', function (e) {
      var x = e.target.closest && e.target.closest('.fb-star');
      if (x) paint(+x.getAttribute('data-n'));
    });
    stars.addEventListener('mouseleave', function () { paint(st.r || 0); });
    stars.addEventListener('click', function (e) {
      var x = e.target.closest && e.target.closest('.fb-star');
      if (!x) return;
      if (!st.id) st.id = newId();
      st.r = +x.getAttribute('data-n');
      save(key, st);
      paint(st.r);
      done.classList.remove('err');
      done.textContent = st.c ? t.done : '';
      if (!st.c) more.hidden = false;
      post(body({})).catch(function () {});
    });
    send.addEventListener('click', function () {
      var c = ta.value.trim();
      if (!c || !st.r) return;
      send.disabled = true;
      post(body({ comment: c })).then(function () {
        st.c = true; save(key, st);
        more.hidden = true;
        done.classList.remove('err');
        done.textContent = t.done;
      }).catch(function () {
        done.classList.add('err');
        done.textContent = t.fail;
      }).then(function () { send.disabled = false; });
    });
  }

  function visible(el) {
    return el && el.style.display !== 'none' && getComputedStyle(el).display !== 'none' && el.textContent.trim();
  }

  function check() {
    var won = document.getElementById('solved-banner');
    var lost = document.getElementById('gameover-banner');
    if (won || lost) {
      if (visible(won)) mount(won, true, 'won');
      if (visible(lost)) mount(lost, true, 'lost');
      return;
    }
    var res = document.querySelector('#g-result, #pts-result, #ab-result');
    if (visible(res)) mount(res, false, null);
  }

  function start() {
    var hosts = [document.getElementById('solved-banner'), document.getElementById('gameover-banner'),
      document.querySelector('#g-result, #pts-result, #ab-result')].filter(Boolean);
    if (!hosts.length || !window.MutationObserver) return;
    var mo = new MutationObserver(check);
    hosts.forEach(function (h) { mo.observe(h, { childList: true, attributes: true, attributeFilter: ['style', 'class'] }); });
    check();
  }
  if (document.readyState === 'loading') document.addEventListener('DOMContentLoaded', start);
  else start();
})();
