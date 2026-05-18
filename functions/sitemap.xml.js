// Dynamic sitemap — auto-includes scheduled SEO pages on their publish date.
// Replaces the static sitemap.xml from this date forward.

// Drip schedule: each URL becomes indexable on its scheduled date.
const LONGTAIL_SLUGS = [
  ['state-abbreviations',    '2026-05-15'],
  ['states-and-capitals',    '2026-05-15'],
  ['13-colonies',            '2026-05-15'],
  ['landlocked-states',      '2026-05-15'],
  ['states-bordering-mexico','2026-05-15'],
  ['states-bordering-canada','2026-05-15'],
  ['largest-states',         '2026-05-15'],
  ['no-income-tax',          '2026-05-15'],
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

  // 50 ES state overview pages (LATAM target)
  const esStateEntries = [[`${BASE}/es/states/`, { priority: 0.8 }]];
  for (const slug of stateSlugs) esStateEntries.push([`${BASE}/es/states/${slug}/`, { priority: 0.65 }]);

  // 12 subpages per state
  const SUBTOPICS = ['map','history','geography','people','sports','elections','travel','weather','symbols','fun-facts','economy','food'];
  const stateSubpageEntries = [];
  for (const slug of stateSlugs) {
    for (const t of SUBTOPICS) {
      stateSubpageEntries.push([`${BASE}/states/${slug}/${t}/`, { priority: 0.6 }]);
    }
  }

  // 100 top US city pages
  const CITIES = ['new-york','los-angeles','chicago','houston','phoenix','philadelphia','san-antonio','san-diego','dallas','san-jose','austin','jacksonville','fort-worth','columbus','charlotte','san-francisco','indianapolis','seattle','denver','washington','boston','el-paso','nashville','detroit','oklahoma-city','portland','las-vegas','memphis','louisville','baltimore','milwaukee','albuquerque','tucson','fresno','sacramento','mesa','kansas-city','atlanta','omaha','colorado-springs','raleigh','miami','long-beach','virginia-beach','oakland','minneapolis','tulsa','arlington','new-orleans','wichita','cleveland','tampa','bakersfield','aurora','honolulu','anaheim','santa-ana','corpus-christi','riverside','lexington','stockton','henderson','saint-paul','st-louis','cincinnati','pittsburgh','greensboro','anchorage','plano','lincoln','orlando','irvine','newark','durham','chula-vista','toledo','fort-wayne','st-petersburg','laredo','jersey-city','chandler','madison','lubbock','scottsdale','reno','buffalo','gilbert','glendale','north-las-vegas','winston-salem','chesapeake','norfolk','fremont','garland','irving','hialeah','richmond','boise','spokane','baton-rouge','tacoma'];
  const cityEntries = [[`${BASE}/cities/`, { priority: 0.8 }]];
  for (const c of CITIES) cityEntries.push([`${BASE}/cities/${c}/`, { priority: 0.65 }]);

  // 30 /learn/ deep dives
  const LEARN_NEW = ['state-mottos','state-nicknames','state-flags','state-birds','state-flowers','state-trees','state-songs','state-capitals-pronunciation','state-license-plates','state-quarters','states-by-statehood-year','states-by-time-zone','states-by-population','electoral-college','swing-states','states-presidents-born','states-largest-cities','states-without-capital-largest','states-with-oceans','states-with-great-lakes','states-with-mountains','states-with-deserts','states-with-national-parks','cheapest-states-to-live','most-expensive-states','best-states-for-retirees','states-by-region-list','us-territories','states-confederate','state-sport'];
  const learnNewEntries = LEARN_NEW.map(slug => [`${BASE}/learn/${slug}/`, { priority: 0.7 }]);

  // 13 region pages
  const REGION_HUB = [[`${BASE}/regions/`, { priority: 0.8 }]];
  const REGIONS = ['northeast','south','midwest','west','new-england','mid-atlantic','south-atlantic','east-south-central','west-south-central','east-north-central','west-north-central','mountain','pacific'];
  for (const r of REGIONS) REGION_HUB.push([`${BASE}/regions/${r}/`, { priority: 0.7 }]);

  const scheduled = Object.entries(SCHEDULE)
    .filter(([url, date]) => today >= date)
    .map(([url]) => [`${BASE}${url}`, { priority: 0.8 }]);

  const all = [...evergreen, ...stateEntries, ...esStateEntries, ...stateSubpageEntries, ...cityEntries, ...learnNewEntries, ...REGION_HUB, ...scheduled];
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
