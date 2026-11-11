// Inline-fetch the geographic US states SVG, color by region, and wire up
// click → /states/<slug>/ navigation. One-shot per page.
//
// Usage: drop `<div data-us-map data-highlight="CA"></div>` in HTML.
// Optional: data-highlight="XX" highlights a specific state in gold.
// Optional: data-base="/es/states/" sends clicks to another language's pages.
// Optional: data-info="<id>" names a <script type="application/json"> holding
//   {"labels": {"capital": "...", "open": "Open the {name} page", "hint": "..."},
//    "states": {"AL": ["Alabama", "Montgomery"], ...}}.
//   A tap, click or Enter then selects the state and shows its name, code,
//   capital and a link under the map instead of leaving the page, so a phone
//   user can read the map before choosing. Without it, nothing changes.
//
// Fetched once and cached by the browser (immutable file path).

(function () {
  const ENDPOINT = '/data/us-map.svg?v=1';
  let svgPromise = null;

  function fetchSvg() {
    if (svgPromise) return svgPromise;
    svgPromise = fetch(ENDPOINT).then(r => r.text());
    return svgPromise;
  }

  function readInfo(container) {
    const id = container.getAttribute('data-info');
    if (!id) return null;
    const el = document.getElementById(id);
    if (!el) return null;
    try { return JSON.parse(el.textContent); } catch (e) { return null; }
  }

  function makePanel(container, info) {
    const panel = document.createElement('div');
    panel.setAttribute('aria-live', 'polite');
    panel.style.cssText = 'max-width:900px;margin:-10px auto 22px;padding:12px 16px;border:2px solid #0F2147;border-radius:12px;background:#fff;font-size:.95rem;line-height:1.45;min-height:3.2em;';
    const hint = document.createElement('p');
    hint.style.cssText = 'margin:0;color:#475569;';
    hint.textContent = info.labels.hint;
    panel.appendChild(hint);
    container.insertAdjacentElement('afterend', panel);
    return panel;
  }

  function showState(panel, info, usps, slug, base) {
    const row = info.states[usps];
    if (!row) return;
    const name = row[0], capital = row[1];
    panel.textContent = '';
    const title = document.createElement('p');
    title.style.cssText = 'margin:0 0 4px;font-weight:800;color:#0F2147;font-size:1.05rem;';
    title.textContent = name + ' (' + usps + ')';
    const cap = document.createElement('p');
    cap.style.cssText = 'margin:0 0 8px;color:#334155;';
    cap.textContent = info.labels.capital + ': ' + capital;
    const link = document.createElement('a');
    link.href = base + slug + '/';
    link.style.cssText = 'font-weight:700;color:#0F2147;';
    link.textContent = info.labels.open.replace('{name}', name);
    panel.append(title, cap, link);
  }

  async function mountMap(container) {
    const highlight = (container.getAttribute('data-highlight') || '').split(',').map(s => s.trim()).filter(Boolean);
    const dim = container.getAttribute('data-dim-rest') === 'true';
    const base = container.getAttribute('data-base') || '/states/';
    const info = readInfo(container);
    try {
      const raw = await fetchSvg();
      container.innerHTML = raw;
      const svg = container.querySelector('svg');
      if (!svg) return;
      svg.setAttribute('aria-label', container.getAttribute('aria-label') || svg.getAttribute('aria-label') || 'US states map');
      const highlightSet = new Set(highlight);
      const panel = info ? makePanel(container, info) : null;
      let selected = null;
      svg.querySelectorAll('.state').forEach(path => {
        const slug = path.getAttribute('data-slug');
        const usps = path.getAttribute('data-usps');
        path.style.cursor = 'pointer';
        if (panel) {
          const row = info.states[usps];
          path.setAttribute('tabindex', '0');
          path.setAttribute('role', 'button');
          if (row) path.setAttribute('aria-label', row[0]);
          const select = () => {
            if (selected) selected.classList.remove('is-highlight');
            path.classList.add('is-highlight');
            selected = path;
            showState(panel, info, usps, slug, base);
          };
          path.addEventListener('click', select);
          path.addEventListener('keydown', e => {
            if (e.key === 'Enter' || e.key === ' ') { e.preventDefault(); select(); }
          });
        } else {
          path.addEventListener('click', () => {
            if (slug) window.location.href = base + slug + '/';
          });
        }
        if (highlightSet.has(usps)) path.classList.add('is-highlight');
        else if (dim && highlightSet.size > 0) path.classList.add('is-dimmed');
      });
    } catch (e) {
      // Fail silently, fallback content (tilemap or text) remains
      container.setAttribute('data-load-failed', '1');
    }
  }

  function init() {
    document.querySelectorAll('[data-us-map]').forEach(mountMap);
  }

  if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', init);
  } else {
    init();
  }
})();
