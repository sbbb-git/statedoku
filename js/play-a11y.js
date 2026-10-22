// Shared helpers for the 63 game pages under play/, fr/play/ and es/play/.
// Each game keeps its own logic inline; this only adds what every one of them
// lacked: keyboard access to map states and tiles, spoken feedback, and on
// phones some tolerance around the smallest states.
(function () {
  'use strict';
  var lang = (document.documentElement.lang || 'en').slice(0, 2);
  var MAP_LABEL = { en: 'Map of the United States', fr: 'Carte des États-Unis', es: 'Mapa de Estados Unidos' };

  // Smallest first. On a 390px phone Rhode Island measured 4.7 x 6.7px and
  // Delaware 6.3 x 10.6px, too small to tap. A tap that lands in the water
  // within RADIUS px of one of these states counts for the smallest one there.
  // A tap on land always stays where it landed: letting small states reach
  // onto land took 30% of Massachusetts and Maryland away from them.
  var SMALL = ['RI', 'DE', 'CT', 'NJ', 'NH', 'VT', 'MA', 'MD'];
  var RADIUS = 10;

  function style() {
    if (document.getElementById('play-a11y-css')) return;
    var s = document.createElement('style');
    s.id = 'play-a11y-css';
    s.textContent =
      '#pts-map-wrap svg path[data-usps]:focus{outline:none}' +
      '#pts-map-wrap svg path[data-usps]:focus-visible{stroke:#0F2147;stroke-width:3px;paint-order:stroke}' +
      '.match-item:focus-visible,.conn-cell:focus-visible{outline:3px solid #0F2147;outline-offset:2px}';
    document.head.appendChild(s);
  }

  function initMap(svg) {
    if (!svg || svg._a11y) return;
    svg._a11y = true;
    style();
    // role="img" hid every state from assistive technology and made the
    // focusable paths below invalid inside it.
    svg.setAttribute('role', 'group');
    svg.setAttribute('aria-label', MAP_LABEL[lang] || MAP_LABEL.en);
    var paths = svg.querySelectorAll('path[data-usps]');
    for (var i = 0; i < paths.length; i++) {
      // No accessible name on purpose: a name would give the answer away.
      paths[i].setAttribute('tabindex', '0');
    }
    svg.addEventListener('keydown', function (e) {
      if (e.key !== 'Enter' && e.key !== ' ') return;
      var p = e.target.closest && e.target.closest('path[data-usps]');
      if (!p) return;
      e.preventDefault();
      p.dispatchEvent(new MouseEvent('click', { bubbles: true }));
    });
    svg.addEventListener('click', function (e) {
      if (!e.isTrusted) return;   // our own re-dispatch below
      var small = svg.getBoundingClientRect().width < 700 ||
        (window.matchMedia && window.matchMedia('(pointer:coarse)').matches);
      if (!small || !document.elementsFromPoint) return;
      if (e.target.closest && e.target.closest('path[data-usps]')) return;
      var best = null, bestRank = SMALL.length;
      // Rings 2.5px apart: coarser sampling stepped right over a 4.7px state.
      var pts = [];
      for (var ring = 2.5; ring <= RADIUS; ring += 2.5) {
        for (var a = 0; a < 16; a++) {
          var t = a * Math.PI / 8;
          pts.push([ring * Math.cos(t), ring * Math.sin(t)]);
        }
      }
      for (var k = 0; k < pts.length; k++) {
        var els = document.elementsFromPoint(e.clientX + pts[k][0], e.clientY + pts[k][1]);
        for (var j = 0; j < els.length; j++) {
          var el = els[j];
          if (!el.getAttribute || !svg.contains(el)) continue;
          var r = SMALL.indexOf(el.getAttribute('data-usps'));
          if (r >= 0 && r < bestRank) { best = el; bestRank = r; }
        }
      }
      if (best) {
        e.stopPropagation();
        e.preventDefault();
        best.dispatchEvent(new MouseEvent('click', { bubbles: true }));
      }
    }, true);
  }

  // Tiles in State Capitals Match and States Connections are divs. They get a
  // button role, a tab stop and Enter/Space, and say whether they are selected.
  function syncTile(el) {
    if (!el.hasAttribute('tabindex')) {
      el.setAttribute('tabindex', '0');
      el.setAttribute('role', 'button');
    }
    el.setAttribute('aria-pressed', el.classList.contains('selected') ? 'true' : 'false');
    if (el.classList.contains('paired')) el.setAttribute('aria-disabled', 'true');
  }

  function scan(root) {
    var tiles = (root || document).querySelectorAll('.match-item, .conn-cell');
    for (var i = 0; i < tiles.length; i++) syncTile(tiles[i]);
    var wrap = document.getElementById('pts-map-wrap');
    if (wrap) initMap(wrap.querySelector('svg'));
  }

  document.addEventListener('keydown', function (e) {
    if (e.key !== 'Enter' && e.key !== ' ') return;
    var t = e.target.closest && e.target.closest('.match-item, .conn-cell');
    if (!t) return;
    e.preventDefault();
    t.click();
  });

  function start() {
    // Right, wrong, lives and the final score were never announced.
    ['g-feedback', 'pts-feedback'].forEach(function (id) {
      var el = document.getElementById(id);
      if (el) { el.setAttribute('role', 'status'); el.setAttribute('aria-live', 'polite'); }
    });
    ['g-result', 'pts-result'].forEach(function (id) {
      var el = document.getElementById(id);
      if (el) el.setAttribute('aria-live', 'polite');
    });
    scan();
    new MutationObserver(function () { scan(); })
      .observe(document.body, { childList: true, subtree: true, attributes: true, attributeFilter: ['class'] });
  }
  if (document.readyState === 'loading') document.addEventListener('DOMContentLoaded', start);
  else start();
})();
