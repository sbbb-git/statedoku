// Dynamic sitemap — auto-includes scheduled SEO pages on their publish date.
// Replaces the static sitemap.xml from this date forward.

// Drip schedule: each URL becomes indexable on its scheduled date.
const LONGTAIL_SLUGS = [
  ['state-abbreviations',    '2026-05-15'],
  ['states-and-capitals',    '2026-05-15'],
  ['13-colonies',            '2026-05-18'],
  ['landlocked-states',      '2026-05-20'],
  ['states-bordering-mexico','2026-05-22'],
  ['states-bordering-canada','2026-05-25'],
  ['largest-states',         '2026-05-27'],
  ['no-income-tax',          '2026-05-30'],
];
const SCHEDULE = {};
for (const [slug, date] of LONGTAIL_SLUGS) {
  SCHEDULE[`/learn/${slug}/`] = date;
  SCHEDULE[`/fr/learn/${slug}/`] = date;
  SCHEDULE[`/es/learn/${slug}/`] = date;
}

function todayISO() {
  return new Date().toISOString().slice(0, 10);
}

function buildEntry(loc, opts = {}) {
  const cf = opts.changefreq || 'monthly';
  const pri = opts.priority != null ? opts.priority : 0.7;
  const alts = opts.alternates ? opts.alternates.map(([hl, h]) => `    <xhtml:link rel="alternate" hreflang="${hl}" href="${h}"/>`).join('\n') + '\n' : '';
  return `  <url>
    <loc>${loc}</loc>
${alts}    <changefreq>${cf}</changefreq>
    <priority>${pri}</priority>
  </url>`;
}

export async function onRequestGet({ request }) {
  const today = todayISO();
  const BASE = 'https://statedoku.com';

  // Static evergreen URLs (always in sitemap)
  const evergreen = [
    [`${BASE}/`, { changefreq: 'daily', priority: 1.0, alternates: [['en', `${BASE}/`], ['fr', `${BASE}/fr/`], ['es', `${BASE}/es/`], ['x-default', `${BASE}/`]] }],
    [`${BASE}/fr/`, { changefreq: 'daily', priority: 0.9 }],
    [`${BASE}/es/`, { changefreq: 'daily', priority: 0.9 }],
    [`${BASE}/archive/`, { changefreq: 'daily', priority: 0.9, alternates: [['en', `${BASE}/archive/`], ['fr', `${BASE}/fr/archive/`], ['es', `${BASE}/es/archive/`]] }],
    [`${BASE}/fr/archive/`, { changefreq: 'daily', priority: 0.8 }],
    [`${BASE}/es/archive/`, { changefreq: 'daily', priority: 0.8 }],
    [`${BASE}/facts/`, { priority: 0.85 }],
    [`${BASE}/learn/`, { priority: 0.9, alternates: [['en', `${BASE}/learn/`], ['fr', `${BASE}/fr/learn/`], ['es', `${BASE}/es/learn/`]] }],
    [`${BASE}/fr/learn/`, { priority: 0.8 }],
    [`${BASE}/es/learn/`, { priority: 0.8 }],
    [`${BASE}/learn/state-capitals/`, { priority: 0.85 }],
    [`${BASE}/learn/us-regions/`, { priority: 0.85 }],
    [`${BASE}/quiz/`, { priority: 0.8 }],
    [`${BASE}/states/`, { priority: 0.85 }],
    [`${BASE}/about/`, { priority: 0.7, alternates: [['en', `${BASE}/about/`], ['fr', `${BASE}/fr/about/`], ['es', `${BASE}/es/about/`]] }],
    [`${BASE}/fr/about/`, { priority: 0.6 }],
    [`${BASE}/es/about/`, { priority: 0.6 }],
    [`${BASE}/how-to-play/`, { priority: 0.8, alternates: [['en', `${BASE}/how-to-play/`], ['fr', `${BASE}/fr/how-to-play/`], ['es', `${BASE}/es/how-to-play/`]] }],
    [`${BASE}/fr/how-to-play/`, { priority: 0.7 }],
    [`${BASE}/es/how-to-play/`, { priority: 0.7 }],
    [`${BASE}/faq/`, { priority: 0.8, alternates: [['en', `${BASE}/faq/`], ['fr', `${BASE}/fr/faq/`], ['es', `${BASE}/es/faq/`]] }],
    [`${BASE}/fr/faq/`, { priority: 0.7 }],
    [`${BASE}/es/faq/`, { priority: 0.7 }],
    [`${BASE}/privacy/`, { priority: 0.3 }],
    [`${BASE}/terms/`, { priority: 0.3 }],
  ];

  // 50 state pages
  const stateSlugs = [
    'alabama','alaska','arizona','arkansas','california','colorado','connecticut',
    'delaware','florida','georgia','hawaii','idaho','illinois','indiana','iowa',
    'kansas','kentucky','louisiana','maine','maryland','massachusetts','michigan',
    'minnesota','mississippi','missouri','montana','nebraska','nevada','new-hampshire',
    'new-jersey','new-mexico','new-york','north-carolina','north-dakota','ohio',
    'oklahoma','oregon','pennsylvania','rhode-island','south-carolina','south-dakota',
    'tennessee','texas','utah','vermont','virginia','washington','west-virginia',
    'wisconsin','wyoming'
  ];
  const stateEntries = stateSlugs.map(slug => [`${BASE}/states/${slug}/`, { priority: 0.7 }]);

  // Scheduled long-tail pages — only included once today >= publishDate
  const scheduled = Object.entries(SCHEDULE)
    .filter(([url, date]) => today >= date)
    .map(([url]) => [`${BASE}${url}`, { priority: 0.8 }]);

  const all = [...evergreen, ...stateEntries, ...scheduled];
  const body = `<?xml version="1.0" encoding="UTF-8"?>
<urlset xmlns="http://www.sitemaps.org/schemas/sitemap/0.9"
        xmlns:xhtml="http://www.w3.org/1999/xhtml">
${all.map(([loc, opts]) => buildEntry(loc, opts)).join('\n')}
</urlset>
`;

  return new Response(body, {
    headers: {
      'content-type': 'application/xml; charset=utf-8',
      'cache-control': 'public, max-age=3600',
    },
  });
}
