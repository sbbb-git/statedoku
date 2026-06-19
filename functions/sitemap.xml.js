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

  // New: API hub + printable map page + crossword helpers + ES capitals hub
  const extras = [
    [`${BASE}/api/`, { priority: 0.7 }],
    [`${BASE}/learn/printable-us-states-map/`, { priority: 0.85 }],
    [`${BASE}/learn/crossword-helper/`, { priority: 0.8, alternates: [['en', `${BASE}/learn/crossword-helper/`], ['es', `${BASE}/es/learn/crucigrama-estados/`]] }],
    [`${BASE}/es/learn/crucigrama-estados/`, { priority: 0.8 }],
    [`${BASE}/es/learn/capitales-de-estados/`, { priority: 0.9 }],
    // LATAM SEO push pages (added after launch-day analytics showed
    // /es/learn/state-abbreviations/ capturing 13% of all J0 traffic).
    [`${BASE}/es/learn/regiones-de-eeuu/`, { priority: 0.9 }],
    [`${BASE}/es/learn/banderas-de-estados/`, { priority: 0.85 }],
    [`${BASE}/es/learn/colonias-originales/`, { priority: 0.85 }],
    [`${BASE}/es/learn/colegio-electoral/`, { priority: 0.85 }],
    [`${BASE}/es/learn/estados-bisagra/`, { priority: 0.85 }],
    [`${BASE}/es/learn/territorios-eeuu/`, { priority: 0.85 }],
    [`${BASE}/es/learn/zonas-horarias-eeuu/`, { priority: 0.85 }],
    [`${BASE}/es/learn/apodos-de-estados/`, { priority: 0.85 }],
    [`${BASE}/es/learn/cinturones-eeuu/`, { priority: 0.8 }],
    // FR push pages (21% of launch-day traffic; FR cluster was underbuilt).
    [`${BASE}/fr/learn/capitales-des-etats/`, { priority: 0.9 }],
    [`${BASE}/fr/learn/regions-des-etats-unis/`, { priority: 0.9 }],
    [`${BASE}/fr/learn/drapeaux-des-etats/`, { priority: 0.85 }],
    [`${BASE}/fr/learn/college-electoral/`, { priority: 0.85 }],
    [`${BASE}/fr/learn/fuseaux-horaires-etats-unis/`, { priority: 0.85 }],
    [`${BASE}/fr/learn/surnoms-des-etats/`, { priority: 0.85 }],
    // Batch 2 (June 4) — 2 EN + 5 ES + 5 FR
    [`${BASE}/learn/state-nicknames-complete/`, { priority: 0.85 }],
    [`${BASE}/learn/us-cultural-belts/`, { priority: 0.85 }],
    [`${BASE}/es/learn/sistema-federal-eeuu/`, { priority: 0.85 }],
    [`${BASE}/es/learn/padres-fundadores/`, { priority: 0.85 }],
    [`${BASE}/es/learn/rios-mas-largos-eeuu/`, { priority: 0.85 }],
    [`${BASE}/es/learn/montanas-mas-altas-eeuu/`, { priority: 0.85 }],
    [`${BASE}/es/learn/presidentes-por-estado/`, { priority: 0.85 }],
    [`${BASE}/fr/learn/systeme-federal-americain/`, { priority: 0.85 }],
    [`${BASE}/fr/learn/peres-fondateurs/`, { priority: 0.85 }],
    [`${BASE}/fr/learn/fleuves-des-etats-unis/`, { priority: 0.85 }],
    [`${BASE}/fr/learn/montagnes-des-etats-unis/`, { priority: 0.85 }],
    [`${BASE}/fr/learn/presidents-par-etat/`, { priority: 0.85 }],
    // Batch 3 (June 4) — National parks + populous states trio
    [`${BASE}/learn/national-parks-by-state/`, { priority: 0.9 }],
    [`${BASE}/learn/most-populous-states/`, { priority: 0.9 }],
    [`${BASE}/es/learn/parques-nacionales-eeuu/`, { priority: 0.9 }],
    [`${BASE}/es/learn/estados-mas-poblados/`, { priority: 0.9 }],
    [`${BASE}/fr/learn/parcs-nationaux-americains/`, { priority: 0.9 }],
    // World Cup 2026 mega-batch (June 4) — peak search-volume opportunity
    // Tournament starts June 11, 2026, final July 19 at MetLife Stadium.
    // Priority 0.95 for hubs (highest in entire sitemap) — these are the
    // most time-sensitive pages on the site for the next ~50 days.
    [`${BASE}/learn/world-cup-2026-us-host-cities/`, { priority: 0.95, changefreq: 'weekly' }],
    [`${BASE}/learn/world-cup-2026-final-stadium/`, { priority: 0.95, changefreq: 'weekly' }],
    [`${BASE}/learn/world-cup-2026-schedule-by-state/`, { priority: 0.95, changefreq: 'weekly' }],
    [`${BASE}/learn/world-cup-2026-stadiums-complete/`, { priority: 0.9, changefreq: 'weekly' }],
    [`${BASE}/learn/atlanta-world-cup-2026/`, { priority: 0.9, changefreq: 'weekly' }],
    [`${BASE}/learn/boston-world-cup-2026/`, { priority: 0.9, changefreq: 'weekly' }],
    [`${BASE}/learn/dallas-world-cup-2026/`, { priority: 0.9, changefreq: 'weekly' }],
    [`${BASE}/learn/houston-world-cup-2026/`, { priority: 0.9, changefreq: 'weekly' }],
    [`${BASE}/learn/kansas-city-world-cup-2026/`, { priority: 0.9, changefreq: 'weekly' }],
    [`${BASE}/learn/los-angeles-world-cup-2026/`, { priority: 0.9, changefreq: 'weekly' }],
    [`${BASE}/learn/miami-world-cup-2026/`, { priority: 0.9, changefreq: 'weekly' }],
    [`${BASE}/learn/new-york-new-jersey-world-cup-2026/`, { priority: 0.95, changefreq: 'weekly' }],
    [`${BASE}/learn/philadelphia-world-cup-2026/`, { priority: 0.9, changefreq: 'weekly' }],
    [`${BASE}/learn/san-francisco-bay-area-world-cup-2026/`, { priority: 0.9, changefreq: 'weekly' }],
    [`${BASE}/learn/seattle-world-cup-2026/`, { priority: 0.9, changefreq: 'weekly' }],
    [`${BASE}/es/learn/mundial-2026-eeuu/`, { priority: 0.95, changefreq: 'weekly' }],
    [`${BASE}/es/learn/mundial-2026-final-metlife/`, { priority: 0.95, changefreq: 'weekly' }],
    [`${BASE}/es/learn/mundial-2026-estadios/`, { priority: 0.9, changefreq: 'weekly' }],
    [`${BASE}/es/learn/mexico-mundial-2026/`, { priority: 0.95, changefreq: 'weekly' }],
    [`${BASE}/es/learn/argentina-mundial-2026/`, { priority: 0.95, changefreq: 'weekly' }],
    [`${BASE}/es/learn/espana-mundial-2026/`, { priority: 0.9, changefreq: 'weekly' }],
    [`${BASE}/es/learn/colombia-mundial-2026/`, { priority: 0.9, changefreq: 'weekly' }],
    [`${BASE}/es/learn/mundial-2026-boletos-visa/`, { priority: 0.9, changefreq: 'weekly' }],
    [`${BASE}/fr/learn/coupe-du-monde-2026-villes-usa/`, { priority: 0.95, changefreq: 'weekly' }],
    [`${BASE}/fr/learn/coupe-du-monde-2026-finale/`, { priority: 0.95, changefreq: 'weekly' }],
    [`${BASE}/fr/learn/france-coupe-du-monde-2026/`, { priority: 0.95, changefreq: 'weekly' }],
    [`${BASE}/fr/learn/coupe-du-monde-2026-stades/`, { priority: 0.9, changefreq: 'weekly' }],
    [`${BASE}/fr/learn/coupe-du-monde-2026-voyage-usa/`, { priority: 0.9, changefreq: 'weekly' }],
    // WC mega-batch 2 (June 4) — country & state pages (huge query volume)
    [`${BASE}/learn/brazil-world-cup-2026/`, { priority: 0.95, changefreq: 'weekly' }],
    [`${BASE}/learn/england-world-cup-2026/`, { priority: 0.95, changefreq: 'weekly' }],
    [`${BASE}/learn/germany-world-cup-2026/`, { priority: 0.9, changefreq: 'weekly' }],
    [`${BASE}/learn/italy-world-cup-2026/`, { priority: 0.9, changefreq: 'weekly' }],
    [`${BASE}/learn/netherlands-world-cup-2026/`, { priority: 0.9, changefreq: 'weekly' }],
    [`${BASE}/learn/portugal-world-cup-2026/`, { priority: 0.9, changefreq: 'weekly' }],
    [`${BASE}/learn/usmnt-world-cup-2026/`, { priority: 0.95, changefreq: 'weekly' }],
    [`${BASE}/learn/canada-world-cup-2026/`, { priority: 0.9, changefreq: 'weekly' }],
    [`${BASE}/learn/california-world-cup-2026/`, { priority: 0.9, changefreq: 'weekly' }],
    [`${BASE}/learn/texas-world-cup-2026/`, { priority: 0.9, changefreq: 'weekly' }],
    [`${BASE}/learn/new-jersey-world-cup-2026/`, { priority: 0.95, changefreq: 'weekly' }],
    [`${BASE}/learn/world-cup-2026-opening-match/`, { priority: 0.95, changefreq: 'weekly' }],
    [`${BASE}/learn/world-cup-2026-dates-schedule/`, { priority: 0.95, changefreq: 'weekly' }],
    [`${BASE}/learn/world-cup-2026-mascot/`, { priority: 0.85, changefreq: 'weekly' }],
    [`${BASE}/es/learn/brasil-mundial-2026/`, { priority: 0.95, changefreq: 'weekly' }],
    [`${BASE}/es/learn/uruguay-mundial-2026/`, { priority: 0.9, changefreq: 'weekly' }],
    [`${BASE}/es/learn/chile-mundial-2026/`, { priority: 0.9, changefreq: 'weekly' }],
    [`${BASE}/es/learn/peru-mundial-2026/`, { priority: 0.9, changefreq: 'weekly' }],
    [`${BASE}/es/learn/ecuador-mundial-2026/`, { priority: 0.9, changefreq: 'weekly' }],
    [`${BASE}/fr/learn/belgique-coupe-du-monde-2026/`, { priority: 0.9, changefreq: 'weekly' }],
    [`${BASE}/fr/learn/portugal-coupe-du-monde-2026/`, { priority: 0.9, changefreq: 'weekly' }],
    [`${BASE}/fr/learn/allemagne-coupe-du-monde-2026/`, { priority: 0.9, changefreq: 'weekly' }],
    [`${BASE}/fr/learn/pays-bas-coupe-du-monde-2026/`, { priority: 0.9, changefreq: 'weekly' }],
    [`${BASE}/fr/learn/bresil-coupe-du-monde-2026/`, { priority: 0.9, changefreq: 'weekly' }],
    // WC mega-batch 3 (June 4) — players, base camps, ceremonies, history
    [`${BASE}/learn/messi-world-cup-2026/`, { priority: 0.95, changefreq: 'weekly' }],
    [`${BASE}/learn/mbappe-world-cup-2026/`, { priority: 0.95, changefreq: 'weekly' }],
    [`${BASE}/learn/ronaldo-world-cup-2026/`, { priority: 0.95, changefreq: 'weekly' }],
    [`${BASE}/learn/lamine-yamal-world-cup-2026/`, { priority: 0.9, changefreq: 'weekly' }],
    [`${BASE}/learn/vinicius-jr-world-cup-2026/`, { priority: 0.9, changefreq: 'weekly' }],
    [`${BASE}/learn/pulisic-world-cup-2026/`, { priority: 0.9, changefreq: 'weekly' }],
    [`${BASE}/learn/team-base-camps-world-cup-2026/`, { priority: 0.9, changefreq: 'weekly' }],
    [`${BASE}/learn/world-cup-2026-opening-ceremony/`, { priority: 0.95, changefreq: 'weekly' }],
    [`${BASE}/learn/world-cup-2026-closing-ceremony/`, { priority: 0.9, changefreq: 'weekly' }],
    [`${BASE}/learn/world-cup-2026-vs-usa-1994/`, { priority: 0.85, changefreq: 'weekly' }],
    [`${BASE}/learn/world-cup-2026-ticket-prices/`, { priority: 0.95, changefreq: 'weekly' }],
    [`${BASE}/learn/world-cup-2026-fan-zones/`, { priority: 0.9, changefreq: 'weekly' }],
    [`${BASE}/learn/world-cup-2026-ball/`, { priority: 0.85, changefreq: 'weekly' }],
    [`${BASE}/learn/world-cup-2026-anthem/`, { priority: 0.85, changefreq: 'weekly' }],
    [`${BASE}/learn/best-us-city-world-cup-2026-tourism/`, { priority: 0.9, changefreq: 'weekly' }],
    [`${BASE}/es/learn/messi-mundial-2026/`, { priority: 0.95, changefreq: 'weekly' }],
    [`${BASE}/es/learn/lamine-yamal-mundial-2026/`, { priority: 0.9, changefreq: 'weekly' }],
    [`${BASE}/es/learn/vinicius-jr-mundial-2026/`, { priority: 0.9, changefreq: 'weekly' }],
    [`${BASE}/es/learn/mbappe-mundial-2026/`, { priority: 0.9, changefreq: 'weekly' }],
    [`${BASE}/es/learn/donde-ver-mexico-mundial-2026/`, { priority: 0.95, changefreq: 'weekly' }],
    [`${BASE}/es/learn/donde-ver-argentina-eeuu-mundial-2026/`, { priority: 0.95, changefreq: 'weekly' }],
    [`${BASE}/es/learn/mundial-2026-ceremonia-inaugural/`, { priority: 0.9, changefreq: 'weekly' }],
    [`${BASE}/es/learn/concentraciones-mundial-2026/`, { priority: 0.9, changefreq: 'weekly' }],
    [`${BASE}/fr/learn/mbappe-coupe-du-monde-2026/`, { priority: 0.95, changefreq: 'weekly' }],
    [`${BASE}/fr/learn/ronaldo-coupe-du-monde-2026/`, { priority: 0.9, changefreq: 'weekly' }],
    [`${BASE}/fr/learn/messi-coupe-du-monde-2026/`, { priority: 0.9, changefreq: 'weekly' }],
    [`${BASE}/fr/learn/camps-de-base-mondial-2026/`, { priority: 0.9, changefreq: 'weekly' }],
    [`${BASE}/fr/learn/ceremonie-ouverture-mondial-2026/`, { priority: 0.9, changefreq: 'weekly' }],
    [`${BASE}/fr/learn/ou-voir-france-coupe-du-monde-2026/`, { priority: 0.95, changefreq: 'weekly' }],
    [`${BASE}/fr/learn/comparaison-mondial-2026-vs-qatar-2022/`, { priority: 0.85, changefreq: 'weekly' }],
    [`${BASE}/fr/learn/prix-billets-mondial-2026/`, { priority: 0.95, changefreq: 'weekly' }],
    // WC mega-batch 4 (June 4) — more teams, players, stadium guides
    [`${BASE}/learn/spain-world-cup-2026/`, { priority: 0.95, changefreq: 'weekly' }],
    [`${BASE}/learn/argentina-world-cup-2026/`, { priority: 0.95, changefreq: 'weekly' }],
    [`${BASE}/learn/mexico-world-cup-2026/`, { priority: 0.95, changefreq: 'weekly' }],
    [`${BASE}/learn/france-world-cup-2026/`, { priority: 0.95, changefreq: 'weekly' }],
    [`${BASE}/learn/morocco-world-cup-2026/`, { priority: 0.9, changefreq: 'weekly' }],
    [`${BASE}/learn/bellingham-world-cup-2026/`, { priority: 0.9, changefreq: 'weekly' }],
    [`${BASE}/learn/pedri-world-cup-2026/`, { priority: 0.9, changefreq: 'weekly' }],
    [`${BASE}/learn/lautaro-martinez-world-cup-2026/`, { priority: 0.9, changefreq: 'weekly' }],
    [`${BASE}/learn/metlife-stadium-world-cup-guide/`, { priority: 0.95, changefreq: 'weekly' }],
    [`${BASE}/learn/sofi-stadium-world-cup-guide/`, { priority: 0.95, changefreq: 'weekly' }],
    [`${BASE}/learn/usa-vs-mexico-soccer-history/`, { priority: 0.9, changefreq: 'weekly' }],
    [`${BASE}/learn/world-cup-2026-hotel-pricing/`, { priority: 0.9, changefreq: 'weekly' }],
    [`${BASE}/es/learn/espana-mundial-2026/`, { priority: 0.95, changefreq: 'weekly' }],
    [`${BASE}/es/learn/colombia-mundial-2026/`, { priority: 0.95, changefreq: 'weekly' }],
    [`${BASE}/es/learn/francia-mundial-2026/`, { priority: 0.9, changefreq: 'weekly' }],
    [`${BASE}/es/learn/eeuu-mundial-2026/`, { priority: 0.9, changefreq: 'weekly' }],
    [`${BASE}/es/learn/pedri-mundial-2026/`, { priority: 0.9, changefreq: 'weekly' }],
    [`${BASE}/es/learn/lautaro-martinez-mundial-2026/`, { priority: 0.9, changefreq: 'weekly' }],
    [`${BASE}/es/learn/rodrygo-mundial-2026/`, { priority: 0.9, changefreq: 'weekly' }],
    [`${BASE}/es/learn/estadio-azteca-historia/`, { priority: 0.95, changefreq: 'weekly' }],
    [`${BASE}/es/learn/mexico-vs-eeuu-historia/`, { priority: 0.9, changefreq: 'weekly' }],
    [`${BASE}/es/learn/concacaf-mundial-2026/`, { priority: 0.9, changefreq: 'weekly' }],
    [`${BASE}/es/learn/precio-hoteles-mundial-2026/`, { priority: 0.9, changefreq: 'weekly' }],
    [`${BASE}/es/learn/mundial-2026-grupos/`, { priority: 0.9, changefreq: 'weekly' }],
    [`${BASE}/fr/learn/maroc-coupe-du-monde-2026/`, { priority: 0.95, changefreq: 'weekly' }],
    [`${BASE}/fr/learn/senegal-coupe-du-monde-2026/`, { priority: 0.9, changefreq: 'weekly' }],
    [`${BASE}/fr/learn/suisse-coupe-du-monde-2026/`, { priority: 0.85, changefreq: 'weekly' }],
    [`${BASE}/fr/learn/canada-coupe-du-monde-2026/`, { priority: 0.9, changefreq: 'weekly' }],
    [`${BASE}/fr/learn/bellingham-coupe-du-monde-2026/`, { priority: 0.9, changefreq: 'weekly' }],
    [`${BASE}/fr/learn/foden-coupe-du-monde-2026/`, { priority: 0.85, changefreq: 'weekly' }],
    [`${BASE}/fr/learn/modric-coupe-du-monde-2026/`, { priority: 0.85, changefreq: 'weekly' }],
    [`${BASE}/fr/learn/metlife-stadium-guide-mondial-2026/`, { priority: 0.95, changefreq: 'weekly' }],
    [`${BASE}/fr/learn/mondial-2026-budget-voyage/`, { priority: 0.9, changefreq: 'weekly' }],
    // GSC-driven mega-batch (June 19) — 50 capital-de-X + 15 crossword answer pages
    [`${BASE}/es/learn/capital-de-alabama/`, { priority: 0.95, changefreq: 'weekly' }],
    [`${BASE}/es/learn/capital-de-alaska/`, { priority: 0.95, changefreq: 'weekly' }],
    [`${BASE}/es/learn/capital-de-arizona/`, { priority: 0.95, changefreq: 'weekly' }],
    [`${BASE}/es/learn/capital-de-arkansas/`, { priority: 0.95, changefreq: 'weekly' }],
    [`${BASE}/es/learn/capital-de-california/`, { priority: 0.95, changefreq: 'weekly' }],
    [`${BASE}/es/learn/capital-de-colorado/`, { priority: 0.95, changefreq: 'weekly' }],
    [`${BASE}/es/learn/capital-de-connecticut/`, { priority: 0.95, changefreq: 'weekly' }],
    [`${BASE}/es/learn/capital-de-delaware/`, { priority: 0.95, changefreq: 'weekly' }],
    [`${BASE}/es/learn/capital-de-florida/`, { priority: 0.95, changefreq: 'weekly' }],
    [`${BASE}/es/learn/capital-de-georgia/`, { priority: 0.95, changefreq: 'weekly' }],
    [`${BASE}/es/learn/capital-de-hawaii/`, { priority: 0.95, changefreq: 'weekly' }],
    [`${BASE}/es/learn/capital-de-idaho/`, { priority: 0.95, changefreq: 'weekly' }],
    [`${BASE}/es/learn/capital-de-illinois/`, { priority: 0.95, changefreq: 'weekly' }],
    [`${BASE}/es/learn/capital-de-indiana/`, { priority: 0.95, changefreq: 'weekly' }],
    [`${BASE}/es/learn/capital-de-iowa/`, { priority: 0.95, changefreq: 'weekly' }],
    [`${BASE}/es/learn/capital-de-kansas/`, { priority: 0.95, changefreq: 'weekly' }],
    [`${BASE}/es/learn/capital-de-kentucky/`, { priority: 0.95, changefreq: 'weekly' }],
    [`${BASE}/es/learn/capital-de-louisiana/`, { priority: 0.95, changefreq: 'weekly' }],
    [`${BASE}/es/learn/capital-de-maine/`, { priority: 0.95, changefreq: 'weekly' }],
    [`${BASE}/es/learn/capital-de-maryland/`, { priority: 0.95, changefreq: 'weekly' }],
    [`${BASE}/es/learn/capital-de-massachusetts/`, { priority: 0.95, changefreq: 'weekly' }],
    [`${BASE}/es/learn/capital-de-michigan/`, { priority: 0.95, changefreq: 'weekly' }],
    [`${BASE}/es/learn/capital-de-minnesota/`, { priority: 0.95, changefreq: 'weekly' }],
    [`${BASE}/es/learn/capital-de-mississippi/`, { priority: 0.95, changefreq: 'weekly' }],
    [`${BASE}/es/learn/capital-de-missouri/`, { priority: 0.95, changefreq: 'weekly' }],
    [`${BASE}/es/learn/capital-de-montana/`, { priority: 0.95, changefreq: 'weekly' }],
    [`${BASE}/es/learn/capital-de-nebraska/`, { priority: 0.95, changefreq: 'weekly' }],
    [`${BASE}/es/learn/capital-de-nevada/`, { priority: 0.95, changefreq: 'weekly' }],
    [`${BASE}/es/learn/capital-de-new-hampshire/`, { priority: 0.95, changefreq: 'weekly' }],
    [`${BASE}/es/learn/capital-de-new-jersey/`, { priority: 0.95, changefreq: 'weekly' }],
    [`${BASE}/es/learn/capital-de-new-mexico/`, { priority: 0.95, changefreq: 'weekly' }],
    [`${BASE}/es/learn/capital-de-new-york/`, { priority: 0.95, changefreq: 'weekly' }],
    [`${BASE}/es/learn/capital-de-north-carolina/`, { priority: 0.95, changefreq: 'weekly' }],
    [`${BASE}/es/learn/capital-de-north-dakota/`, { priority: 0.95, changefreq: 'weekly' }],
    [`${BASE}/es/learn/capital-de-ohio/`, { priority: 0.95, changefreq: 'weekly' }],
    [`${BASE}/es/learn/capital-de-oklahoma/`, { priority: 0.95, changefreq: 'weekly' }],
    [`${BASE}/es/learn/capital-de-oregon/`, { priority: 0.95, changefreq: 'weekly' }],
    [`${BASE}/es/learn/capital-de-pennsylvania/`, { priority: 0.95, changefreq: 'weekly' }],
    [`${BASE}/es/learn/capital-de-rhode-island/`, { priority: 0.95, changefreq: 'weekly' }],
    [`${BASE}/es/learn/capital-de-south-carolina/`, { priority: 0.95, changefreq: 'weekly' }],
    [`${BASE}/es/learn/capital-de-south-dakota/`, { priority: 0.95, changefreq: 'weekly' }],
    [`${BASE}/es/learn/capital-de-tennessee/`, { priority: 0.95, changefreq: 'weekly' }],
    [`${BASE}/es/learn/capital-de-texas/`, { priority: 0.95, changefreq: 'weekly' }],
    [`${BASE}/es/learn/capital-de-utah/`, { priority: 0.95, changefreq: 'weekly' }],
    [`${BASE}/es/learn/capital-de-vermont/`, { priority: 0.95, changefreq: 'weekly' }],
    [`${BASE}/es/learn/capital-de-virginia/`, { priority: 0.95, changefreq: 'weekly' }],
    [`${BASE}/es/learn/capital-de-washington/`, { priority: 0.95, changefreq: 'weekly' }],
    [`${BASE}/es/learn/capital-de-west-virginia/`, { priority: 0.95, changefreq: 'weekly' }],
    [`${BASE}/es/learn/capital-de-wisconsin/`, { priority: 0.95, changefreq: 'weekly' }],
    [`${BASE}/es/learn/capital-de-wyoming/`, { priority: 0.95, changefreq: 'weekly' }],
    [`${BASE}/es/learn/ciudad-de-arizona-6-letras/`, { priority: 0.9, changefreq: 'weekly' }],
    [`${BASE}/es/learn/estado-cuya-capital-es-augusta-5-letras/`, { priority: 0.9, changefreq: 'weekly' }],
    [`${BASE}/es/learn/capital-de-oregon-5-letras/`, { priority: 0.9, changefreq: 'weekly' }],
    [`${BASE}/es/learn/ciudad-arizona-cabecera-condado-pima/`, { priority: 0.9, changefreq: 'weekly' }],
    [`${BASE}/es/learn/capital-massachusetts-6-letras/`, { priority: 0.9, changefreq: 'weekly' }],
    [`${BASE}/es/learn/estado-eeuu-2-letras-nc/`, { priority: 0.9, changefreq: 'weekly' }],
    [`${BASE}/es/learn/estado-eeuu-2-letras-sc/`, { priority: 0.9, changefreq: 'weekly' }],
    [`${BASE}/es/learn/estado-eeuu-abreviatura-hi/`, { priority: 0.9, changefreq: 'weekly' }],
    [`${BASE}/es/learn/estado-eeuu-abreviatura-md/`, { priority: 0.9, changefreq: 'weekly' }],
    [`${BASE}/es/learn/estado-eeuu-abreviatura-ma/`, { priority: 0.9, changefreq: 'weekly' }],
    [`${BASE}/es/learn/estado-eeuu-abreviatura-mi/`, { priority: 0.9, changefreq: 'weekly' }],
    [`${BASE}/es/learn/estado-eeuu-abreviatura-mn/`, { priority: 0.9, changefreq: 'weekly' }],
    [`${BASE}/es/learn/estado-capital-honolulu/`, { priority: 0.9, changefreq: 'weekly' }],
    [`${BASE}/es/learn/estado-capital-austin/`, { priority: 0.9, changefreq: 'weekly' }],
    [`${BASE}/es/learn/estado-capital-sacramento/`, { priority: 0.9, changefreq: 'weekly' }],
  ];

  // Disambiguation pages — "is {city} a state?" and "capital of {city}?"
  const IS_A_STATE = ['las-vegas','boston','atlanta','miami','minneapolis','philadelphia','charlotte','seattle','portland','phoenix'];
  const CAPITAL_OF = ['miami','pittsburgh','baltimore','milwaukee','las-vegas','charlotte','durham'];
  for (const city of IS_A_STATE) extras.push([`${BASE}/learn/is-${city}-a-state/`, { priority: 0.75 }]);
  for (const city of CAPITAL_OF) extras.push([`${BASE}/learn/capital-of-${city}/`, { priority: 0.75 }]);

  // Press kit + FR/ES legal pages (were missing — flagged by Bing Webmaster Tools)
  extras.push([`${BASE}/press/`, { priority: 0.6 }]);
  extras.push([`${BASE}/fr/privacy/`, { priority: 0.3 }]);
  extras.push([`${BASE}/fr/terms/`, { priority: 0.3 }]);
  extras.push([`${BASE}/es/privacy/`, { priority: 0.3 }]);
  extras.push([`${BASE}/es/terms/`, { priority: 0.3 }]);

  const all = [...evergreen, ...stateEntries, ...esStateEntries, ...stateSubpageEntries, ...cityEntries, ...learnNewEntries, ...REGION_HUB, ...extras, ...scheduled];
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
