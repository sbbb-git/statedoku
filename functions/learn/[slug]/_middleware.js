// Auto-flips noindex → index on publish date for scheduled SEO pages.
// Runs only on /learn/<slug>/* requests.

const SCHEDULE = {
  'state-abbreviations':   '2026-05-15',
  'states-and-capitals':   '2026-05-15',
  '13-colonies':           '2026-05-18',
  'landlocked-states':     '2026-05-20',
  'states-bordering-mexico':'2026-05-22',
  'states-bordering-canada':'2026-05-25',
  'largest-states':        '2026-05-27',
  'no-income-tax':         '2026-05-30',
};

function todayISO() {
  return new Date().toISOString().slice(0, 10);
}

export async function onRequest({ request, next, params }) {
  const response = await next();
  const slug = params.slug;
  const publishDate = SCHEDULE[slug];
  if (!publishDate) return response;
  if (todayISO() < publishDate) return response; // still scheduled
  // Published — strip the noindex meta so Google indexes
  const ct = response.headers.get('content-type') || '';
  if (!ct.includes('text/html')) return response;
  return new HTMLRewriter()
    .on('meta[name="robots"]', {
      element(el) {
        const c = el.getAttribute('content') || '';
        if (c.includes('noindex')) {
          el.setAttribute('content', 'index, follow, max-image-preview:large');
        }
      },
    })
    .transform(response);
}
