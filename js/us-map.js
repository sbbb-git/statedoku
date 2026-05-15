// Inline-fetch the geographic US states SVG, color by region, and wire up
// click → /states/<slug>/ navigation. One-shot per page.
//
// Usage: drop `<div data-us-map data-highlight="CA"></div>` in HTML.
// Optional: data-highlight="XX" highlights a specific state in gold.
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

  async function mountMap(container) {
    const highlight = container.getAttribute('data-highlight') || '';
    try {
      const raw = await fetchSvg();
      container.innerHTML = raw;
      const svg = container.querySelector('svg');
      if (!svg) return;
      svg.setAttribute('aria-label', container.getAttribute('aria-label') || svg.getAttribute('aria-label') || 'US states map');
      // Wire up click + highlight
      svg.querySelectorAll('.state').forEach(path => {
        const slug = path.getAttribute('data-slug');
        const usps = path.getAttribute('data-usps');
        path.style.cursor = 'pointer';
        path.addEventListener('click', () => {
          if (slug) window.location.href = '/states/' + slug + '/';
        });
        if (usps === highlight) path.classList.add('is-highlight');
      });
    } catch (e) {
      // Fail silently — fallback content (tilemap or text) remains
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
