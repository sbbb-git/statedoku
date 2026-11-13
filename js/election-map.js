// Presidential election map: one map per election from 1804 to 2024, coloured
// by the candidate who won each state's electoral votes. Data from
// /data/elections/president.json (scripts/elections/build-election-data.py),
// map from /data/us-map.svg. Used by learn/presidential-election-maps/ in
// English, French and Spanish, and by the "How <state> voted" strip of the
// state pages (data-state).
(function () {
  var T = {
    en: { ev: 'electoral votes', pv: 'Popular vote', dem: 'Democratic', rep: 'Republican', oth: 'Other', notState: 'Not yet a state', noVote: 'Did not take part', prev: 'Previous election', next: 'Next election', play: 'Play', pause: 'Pause', won: 'won', split: 'split its electoral votes', click: 'Tap a state for its result and its history.', hist: 'Every election in', dc: 'District of Columbia (since 1964)', year: 'Election year' },
    fr: { ev: 'grands électeurs', pv: 'Vote populaire', dem: 'Démocrate', rep: 'Républicain', oth: 'Autres', notState: 'Pas encore un État', noVote: "N'a pas pris part", prev: 'Élection précédente', next: 'Élection suivante', play: 'Lecture', pause: 'Pause', won: 'a gagné', split: 'a partagé ses grands électeurs', click: "Touchez un État pour voir son résultat et son historique.", hist: 'Toutes les élections :', dc: 'District de Columbia (depuis 1964)', year: "Année de l'élection" },
    es: { ev: 'votos electorales', pv: 'Voto popular', dem: 'Demócrata', rep: 'Republicano', oth: 'Otros', notState: 'Aún no era estado', noVote: 'No participó', prev: 'Elección anterior', next: 'Elección siguiente', play: 'Reproducir', pause: 'Pausa', won: 'ganó', split: 'repartió sus votos electorales', click: 'Toca un estado para ver su resultado y su historial.', hist: 'Todas las elecciones en', dc: 'Distrito de Columbia (desde 1964)', year: 'Año de la elección' }
  };
  var PARTY = {
    fr: { 'Democratic': 'démocrate', 'Republican': 'républicain', 'Whig': 'whig', 'Federalist': 'fédéraliste', 'Democratic-Republican': 'démocrate-républicain', 'National Republican': 'national-républicain', 'Southern Democratic': 'démocrate du Sud', 'Constitutional Union': 'Union constitutionnelle', 'Progressive': 'progressiste', 'Populist': 'populiste', "States' Rights Democratic": "démocrate des droits des États", 'American Independent': 'indépendant américain', 'Unpledged electors': 'électeurs non engagés', 'Nullifier': 'nullificateur', 'Anti-Masonic': 'antimaçonnique', 'Liberal Republican': 'républicain libéral' },
    es: { 'Democratic': 'demócrata', 'Republican': 'republicano', 'Whig': 'whig', 'Federalist': 'federalista', 'Democratic-Republican': 'demócrata-republicano', 'National Republican': 'nacional republicano', 'Southern Democratic': 'demócrata del Sur', 'Constitutional Union': 'Unión Constitucional', 'Progressive': 'progresista', 'Populist': 'populista', "States' Rights Democratic": 'demócrata por los derechos de los estados', 'American Independent': 'independiente estadounidense', 'Unpledged electors': 'electores no comprometidos', 'Nullifier': 'anulacionista', 'Anti-Masonic': 'antimasónico', 'Liberal Republican': 'republicano liberal' }
  };
  var GREY = '#E2E8F0', NOVOTE = '#CBD5E1';
  function esc(s) { return String(s).replace(/[&<>"]/g, function (c) { return { '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;' }[c]; }); }
  function party(lang, p) { return p ? ((PARTY[lang] || {})[p] || p) : ''; }
  function winner(st) { var b = null, n = -1; for (var k in st.ev) if (st.ev[k] > n) { n = st.ev[k]; b = k; } return b; }
  function cand(y, name) { for (var i = 0; i < y.candidates.length; i++) if (y.candidates[i].name === name) return y.candidates[i]; return null; }
  function load() {
    if (!load.p) load.p = Promise.all([
      fetch('/data/elections/president.json?v=1').then(function (r) { return r.json(); }),
      fetch('/data/us-map.svg').then(function (r) { return r.text(); })
    ]);
    return load.p;
  }
  // When each state first voted, to tell "not yet a state" from "did not take part".
  function firstYear(D) {
    var f = {}; Object.keys(D.years).sort().forEach(function (y) { for (var s in D.years[y].states) if (!f[s]) f[s] = +y; }); return f;
  }

  function mountMap(root, D, svgText, lang) {
    var t = T[lang] || T.en, C = lang === 'fr' ? '\u00a0: ' : ': ', years = Object.keys(D.years).map(Number).sort(function (a, b) { return a - b; });
    var first = firstYear(D), cur = years[years.length - 1], timer = null, picked = null;
    root.innerHTML =
      '<div class="em-bar"><button type="button" class="em-prev" aria-label="' + esc(t.prev) + '">&lsaquo;</button>' +
      '<label class="em-yl"><span class="em-sr">' + esc(t.year) + '</span><select class="em-year">' + years.slice().reverse().map(function (y) { return '<option>' + y + '</option>'; }).join('') + '</select></label>' +
      '<button type="button" class="em-next" aria-label="' + esc(t.next) + '">&rsaquo;</button><button type="button" class="em-play">' + esc(t.play) + '</button></div>' +
      '<input type="range" class="em-range" min="0" max="' + (years.length - 1) + '" value="' + (years.length - 1) + '" aria-label="' + esc(t.year) + '">' +
      '<div class="em-head"></div><div class="em-map">' + svgText + '</div><div class="em-dc"></div><div class="em-legend"></div>' +
      '<p class="em-hint">' + esc(t.click) + '</p><div class="em-info" aria-live="polite"></div>';
    var svg = root.querySelector('svg'); svg.removeAttribute('class'); svg.setAttribute('role', 'img');
    var paths = {}; svg.querySelectorAll('path[data-usps]').forEach(function (p) {
      paths[p.getAttribute('data-usps')] = p; p.style.stroke = '#fff'; p.style.strokeWidth = '1'; p.style.cursor = 'pointer';
      var tt = p.querySelector('title'); if (tt) tt.remove();
      p.setAttribute('tabindex', '0');
      p.addEventListener('click', function () { pick(p.getAttribute('data-usps')); });
      p.addEventListener('keydown', function (e) { if (e.key === 'Enter' || e.key === ' ') { e.preventDefault(); pick(p.getAttribute('data-usps')); } });
    });
    var names = {}; svg.querySelectorAll('path[data-usps]').forEach(function (p) { names[p.getAttribute('data-usps')] = p.getAttribute('data-name'); });
    names.DC = lang === 'fr' ? 'District de Columbia' : lang === 'es' ? 'Distrito de Columbia' : 'District of Columbia';
    function colorOf(y, c) {
      var st = D.years[y].states[c];
      if (!st) return y < (first[c] || 9999) ? GREY : NOVOTE;
      var w = cand(D.years[y], winner(st)); return (w && w.color) || '#64748B';
    }
    function render() {
      var Y = D.years[cur]; root.querySelector('.em-year').value = cur; root.querySelector('.em-range').value = years.indexOf(cur);
      for (var c in paths) { paths[c].style.fill = colorOf(cur, c); paths[c].setAttribute('aria-label', names[c] + ', ' + cur + ': ' + label(cur, c)); }
      var w = Y.candidates[0];
      root.querySelector('.em-head').innerHTML = '<strong>' + cur + '</strong> &middot; ' + esc(w.name) + (w.party ? ' (' + esc(party(lang, w.party)) + ')' : '') + C + w.ev + ' ' + esc(t.ev) + (Y.note ? '<span class="em-note">' + esc(Y.note[lang] || Y.note.en) + '</span>' : '');
      var dc = Y.states.DC; root.querySelector('.em-dc').innerHTML = dc ? '<button type="button" class="em-dcb"><i style="background:' + colorOf(cur, 'DC') + '"></i>' + esc(t.dc) + '</button>' : '';
      var b = root.querySelector('.em-dcb'); if (b) b.onclick = function () { pick('DC'); };
      root.querySelector('.em-legend').innerHTML = Y.candidates.filter(function (x) { return x.ev > 0; }).map(function (x) {
        return '<span><i style="background:' + (x.color || '#64748B') + '"></i>' + esc(x.name) + (x.party ? ' <small>' + esc(party(lang, x.party)) + '</small>' : '') + ' <b>' + x.ev + '</b></span>';
      }).join('') + '<span><i style="background:' + GREY + '"></i>' + esc(t.notState) + '</span>';
      if (picked) info(picked);
    }
    function label(y, c) {
      var st = D.years[y].states[c];
      if (!st) return y < (first[c] || 9999) ? t.notState : t.noVote;
      return Object.keys(st.ev).map(function (k) { return k + ' ' + st.ev[k]; }).join(', ');
    }
    function info(c) {
      var st = D.years[cur].states[c], h = '<h3>' + esc(names[c]) + ', ' + cur + '</h3>';
      if (!st) h += '<p>' + esc(cur < (first[c] || 9999) ? t.notState : t.noVote) + '</p>';
      else {
        h += '<ul>' + Object.keys(st.ev).sort(function (a, b) { return st.ev[b] - st.ev[a]; }).map(function (k) {
          var x = cand(D.years[cur], k); return '<li><i style="background:' + ((x && x.color) || '#64748B') + '"></i>' + esc(k) + C + st.ev[k] + ' ' + esc(t.ev) + '</li>'; }).join('') + '</ul>';
        if (Object.keys(st.ev).length > 1) h += '<p class="em-small">' + esc(names[c]) + ' ' + esc(t.split) + '.</p>';
        if (st.pv) h += '<p class="em-pv">' + esc(t.pv) + C + '<span style="color:#2563EB">' + esc(t.dem) + ' ' + st.pv[0] + (lang === 'fr' ? '\u00a0%' : '%') + '</span> &middot; <span style="color:#DC2626">' + esc(t.rep) + ' ' + st.pv[1] + (lang === 'fr' ? '\u00a0%' : '%') + '</span> &middot; ' + esc(t.oth) + ' ' + st.pv[2] + (lang === 'fr' ? '\u00a0%' : '%') + '</p>';
        if (st.note) h += '<p class="em-small">' + esc(st.note[lang] || st.note.en) + '</p>';
      }
      h += '<p class="em-small">' + esc(t.hist) + ' ' + esc(names[c]) + '</p>' + strip(D, c, cur);
      root.querySelector('.em-info').innerHTML = h;
      root.querySelectorAll('.em-strip [data-y]').forEach(function (el) { el.onclick = function () { cur = +el.getAttribute('data-y'); render(); }; });
    }
    function pick(c) { picked = c; for (var k in paths) paths[k].style.strokeWidth = k === c ? '3' : '1'; info(c); }
    function go(d) { var i = years.indexOf(cur) + d; if (i >= 0 && i < years.length) { cur = years[i]; render(); } }
    root.querySelector('.em-prev').onclick = function () { go(-1); };
    root.querySelector('.em-next').onclick = function () { go(1); };
    root.querySelector('.em-year').onchange = function (e) { cur = +e.target.value; render(); };
    root.querySelector('.em-range').oninput = function (e) { cur = years[+e.target.value]; render(); };
    root.querySelector('.em-play').onclick = function (e) {
      if (timer) { clearInterval(timer); timer = null; e.target.textContent = t.play; return; }
      if (cur === years[years.length - 1]) cur = years[0];
      e.target.textContent = t.pause; render();
      timer = setInterval(function () { if (cur === years[years.length - 1]) { clearInterval(timer); timer = null; e.target.textContent = t.play; return; } go(1); }, 900);
    };
    var m = /[?&]year=(\d{4})/.exec(location.search); if (m && D.years[m[1]]) cur = +m[1];
    render();
  }

  // One square per election, coloured by the winner of the state's electoral votes.
  function strip(D, c, sel) {
    var first = firstYear(D);
    return '<div class="em-strip">' + Object.keys(D.years).map(Number).sort(function (a, b) { return a - b; }).filter(function (y) { return y >= (first[c] || 9999); }).map(function (y) {
      var st = D.years[y].states[c], w = st ? cand(D.years[y], winner(st)) : null;
      return '<button type="button" data-y="' + y + '" title="' + y + (w ? ': ' + esc(w.name) : '') + '" style="background:' + (w ? w.color || '#64748B' : NOVOTE) + '"' + (y === sel ? ' class="on"' : '') + '><span>' + String(y).slice(2) + '</span></button>';
    }).join('') + '</div>';
  }

  var CSS = '.em-bar{display:flex;gap:8px;align-items:center;justify-content:center;margin:6px 0}.em-bar button,.em-year{font:inherit;font-weight:800;border:2px solid var(--navy,#0F2147);background:#fff;color:var(--navy,#0F2147);border-radius:10px;padding:6px 12px;cursor:pointer}' +
    '.em-prev,.em-next{font-size:1.3rem;line-height:1;padding:4px 14px}.em-play{background:var(--navy,#0F2147)!important;color:#fff!important}.em-range{width:100%;margin:8px 0}.em-sr{position:absolute;left:-9999px}' +
    '.em-head{text-align:center;font-size:1.05rem;margin:4px 0 8px}.em-head strong{font-size:1.4rem;color:var(--navy,#0F2147)}.em-note{display:block;font-size:.85rem;color:var(--text-2,#475569)}' +
    '.em-map svg{width:100%;height:auto;display:block}.em-map path:focus{outline:none;stroke:#0F2147!important;stroke-width:3!important}' +
    '.em-legend,.em-dc{display:flex;flex-wrap:wrap;gap:6px 14px;justify-content:center;font-size:.88rem;margin:8px 0}.em-legend i,.em-dc i,.em-info i{display:inline-block;width:14px;height:14px;border-radius:4px;margin-right:6px;vertical-align:-2px}' +
    '.em-legend small{color:var(--text-2,#475569)}.em-dcb{font:inherit;border:1px solid var(--border,#E2E8F0);background:#fff;border-radius:8px;padding:4px 10px;cursor:pointer}.em-hint{text-align:center;font-size:.85rem;color:var(--text-3,#64748B)}' +
    '.em-info{border:1px solid var(--border,#E2E8F0);border-radius:12px;padding:0 16px;margin:8px 0}.em-info:not(:empty){padding:12px 16px}.em-info h3{margin:0 0 6px}.em-info ul{list-style:none;padding:0;margin:0 0 6px}.em-small{font-size:.85rem;color:var(--text-2,#475569);margin:4px 0}' +
    '.em-strip{display:flex;flex-wrap:wrap;gap:3px;margin:6px 0}.em-strip a{display:inline-flex;align-items:center;justify-content:center;text-decoration:none}.em-strip button,.em-strip a{width:30px;height:30px;border:0;border-radius:6px;color:#fff;font:700 .7rem Inter,sans-serif;cursor:pointer;padding:0}.em-vt{width:100%;border-collapse:collapse;font-size:.9rem;margin:8px 0 18px}.em-vt th,.em-vt td{padding:6px 8px;border-bottom:1px solid var(--border,#E2E8F0);text-align:left}.em-vt th{font-size:.78rem;text-transform:uppercase;color:var(--navy,#0F2147);background:#F8FAFC}.em-vt a{color:var(--navy,#0F2147);font-weight:800}.em-strip button.on{outline:3px solid var(--gold,#F59E0B);outline-offset:1px}';
  function css() { if (document.getElementById('em-css')) return; var s = document.createElement('style'); s.id = 'em-css'; s.textContent = CSS; document.head.appendChild(s); }

  function init() {
    var roots = document.querySelectorAll('[data-election-map],[data-election-strip]'); if (!roots.length) return;
    css();
    load().then(function (r) {
      roots.forEach(function (el) {
        var lang = el.getAttribute('data-lang') || 'en';
        if (el.hasAttribute('data-election-map')) mountMap(el, r[0], r[1], lang);
        else el.innerHTML = strip(r[0], el.getAttribute('data-election-strip'), null).replace(/<button/g, '<a').replace(/<\/button>/g, '</a>')
          .replace(/<a type="button" data-y="(\d+)"/g, '<a href="' + el.getAttribute('data-href') + '?year=$1" data-y="$1"');
      });
    }).catch(function () {});
  }
  if (document.readyState === 'loading') document.addEventListener('DOMContentLoaded', init); else init();
})();
