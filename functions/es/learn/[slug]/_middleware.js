// Auto-flips noindex → index on publish date for scheduled ES SEO pages.
const SCHEDULE = {
  'state-abbreviations':    '2026-05-15',
  'states-and-capitals':    '2026-05-15',
  '13-colonies':            '2026-05-18',
  'landlocked-states':      '2026-05-20',
  'states-bordering-mexico':'2026-05-22',
  'states-bordering-canada':'2026-05-25',
  'largest-states':         '2026-05-27',
  'no-income-tax':          '2026-05-30',
};
const today = () => new Date().toISOString().slice(0, 10);

export async function onRequest({ next, params }) {
  const response = await next();
  const publish = SCHEDULE[params.slug];
  if (!publish || today() < publish) return response;
  const ct = response.headers.get('content-type') || '';
  if (!ct.includes('text/html')) return response;
  return new HTMLRewriter()
    .on('meta[name="robots"]', {
      element(el) {
        const c = el.getAttribute('content') || '';
        if (c.includes('noindex')) el.setAttribute('content', 'index, follow, max-image-preview:large');
      },
    })
    .transform(response);
}
