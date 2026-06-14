#!/usr/bin/env node
/**
 * World Cup 2026 mega-batch — 30 articles
 * Peak search-volume opportunity: tournament kicks off June 11, 2026.
 * Final at MetLife Stadium (NJ), July 19, 2026.
 *
 * Structure:
 *   1 EN master hub + 11 EN host-city pages + 3 EN topical = 15
 *   1 ES master hub + 4 ES topical + 4 ES country-focused = 9
 *   1 FR master hub + 5 FR topical = 6
 *
 *   = 30 total.
 */
const fs = require('fs');
const path = require('path');

const ROOT = path.resolve(__dirname, '..');

// ── HOST CITY DATA (verified) ─────────────────────────────────────────────
// 11 US host cities for FIFA World Cup 2026.
// Stadium names/capacities/states/NFL tenants.
const HOST_CITIES = [
  { city: 'Atlanta',           slug: 'atlanta',           state: 'GA', stateLong: 'Georgia',          stadium: 'Mercedes-Benz Stadium', capacity: 71000, nfl: 'Atlanta Falcons',         matches: 8, knockout: true,  notes: 'Hosts a Round of 16 + a Quarter-Final match.' },
  { city: 'Boston',            slug: 'boston',            state: 'MA', stateLong: 'Massachusetts',    stadium: 'Gillette Stadium',      capacity: 65878, nfl: 'New England Patriots',    matches: 7, knockout: true,  notes: 'Gillette is technically in Foxborough, MA — 25 miles south of Boston.' },
  { city: 'Dallas',            slug: 'dallas',            state: 'TX', stateLong: 'Texas',            stadium: 'AT&T Stadium',          capacity: 80000, nfl: 'Dallas Cowboys',          matches: 9, knockout: true,  notes: 'Hosts the most matches of any US venue. Located in Arlington, TX.' },
  { city: 'Houston',           slug: 'houston',           state: 'TX', stateLong: 'Texas',            stadium: 'NRG Stadium',           capacity: 72220, nfl: 'Houston Texans',          matches: 7, knockout: true,  notes: 'Indoor venue — protects players from Texas summer heat.' },
  { city: 'Kansas City',       slug: 'kansas-city',       state: 'MO', stateLong: 'Missouri',         stadium: 'Arrowhead Stadium',     capacity: 76416, nfl: 'Kansas City Chiefs',      matches: 6, knockout: true,  notes: 'Known for the loudest crowd noise in the NFL (Guinness record).' },
  { city: 'Los Angeles',       slug: 'los-angeles',       state: 'CA', stateLong: 'California',       stadium: 'SoFi Stadium',          capacity: 70240, nfl: 'LA Rams / LA Chargers',   matches: 8, knockout: true,  notes: 'Newest US venue (opened 2020). $5.5B cost — most expensive stadium ever built.' },
  { city: 'Miami',             slug: 'miami',             state: 'FL', stateLong: 'Florida',          stadium: 'Hard Rock Stadium',     capacity: 65326, nfl: 'Miami Dolphins',          matches: 7, knockout: true,  notes: 'Already hosts Inter Miami CF (Messi\'s team) on adjacent training facilities.' },
  { city: 'New York / New Jersey', slug: 'new-york-new-jersey', state: 'NJ', stateLong: 'New Jersey',  stadium: 'MetLife Stadium',       capacity: 82500, nfl: 'NY Giants / NY Jets',     matches: 8, knockout: true,  notes: 'Hosts the FINAL on July 19, 2026. Located in East Rutherford, NJ — across the Hudson from Manhattan.' },
  { city: 'Philadelphia',      slug: 'philadelphia',      state: 'PA', stateLong: 'Pennsylvania',     stadium: 'Lincoln Financial Field', capacity: 69879, nfl: 'Philadelphia Eagles',    matches: 6, knockout: true,  notes: 'Will host Round of 16 + Quarter-Final.' },
  { city: 'San Francisco Bay Area', slug: 'san-francisco-bay-area', state: 'CA', stateLong: 'California',  stadium: "Levi's Stadium",      capacity: 68500, nfl: 'San Francisco 49ers',    matches: 6, knockout: true,  notes: "Located in Santa Clara — 45 miles south of San Francisco." },
  { city: 'Seattle',           slug: 'seattle',           state: 'WA', stateLong: 'Washington',       stadium: 'Lumen Field',           capacity: 68740, nfl: 'Seattle Seahawks',        matches: 6, knockout: true,  notes: 'Has the strongest soccer culture of any US host city (Seattle Sounders MLS).' },
];

const KEY_DATES = {
  opening: 'June 11, 2026',
  openingVenue: 'Estadio Azteca, Mexico City',
  final: 'July 19, 2026',
  finalVenue: 'MetLife Stadium, New Jersey',
  teams: 48,
  totalMatches: 104,
};

// ── shared HTML template parts ───────────────────────────────────────────
const styles = `
    .lt-hero { max-width: 720px; margin: 32px auto 12px; padding: 0 18px; text-align: center; }
    .lt-hero h1 { font-size: clamp(1.9rem, 5.5vw, 2.6rem); font-weight: 900; letter-spacing: -0.025em; margin: 0 0 10px; line-height: 1.15; }
    .lt-hero .sub { color: var(--text-2); font-size: 1rem; line-height: 1.55; }
    .lt-main { max-width: 720px; margin: 0 auto; padding: 18px 18px 60px; line-height: 1.65; color: var(--text); }
    .lt-main h2 { margin-top: 36px; margin-bottom: 12px; font-size: 1.35rem; font-weight: 800; letter-spacing: -0.015em; }
    .lt-main h3 { margin-top: 20px; margin-bottom: 8px; font-size: 1.05rem; font-weight: 700; color: var(--navy); }
    .lt-main p, .lt-main li { line-height: 1.65; }
    .lt-main ul, .lt-main ol { padding-left: 22px; margin-bottom: 14px; }
    .lt-main li { margin-bottom: 6px; }
    table.lt { width: 100%; border-collapse: collapse; margin: 14px 0 22px; font-size: .92rem; }
    table.lt th, table.lt td { padding: 9px 12px; border-bottom: 1px solid var(--border); text-align: left; }
    table.lt th { background: #F8FAFC; font-weight: 700; color: var(--navy); font-size: .82rem; text-transform: uppercase; letter-spacing: .03em; }
    .cta-card { background: linear-gradient(135deg, var(--navy), var(--navy-soft)); color: #fff; padding: 22px; border-radius: 14px; margin: 28px 0; text-align: center; }
    .cta-card h3 { color: #fff; margin: 0 0 8px; }
    .cta-card p { margin: 0 0 12px; color: rgba(255,255,255,0.85); }
    .cta-card a { display: inline-block; background: var(--gold); color: var(--navy); padding: 10px 22px; border-radius: 999px; font-weight: 800; text-decoration: none; font-size: .92rem; }
    .related-grid { display: grid; grid-template-columns: repeat(auto-fit, minmax(220px, 1fr)); gap: 8px; margin: 14px 0; }
    .related-grid a { display: block; padding: 10px 12px; border: 1px solid var(--border); border-radius: 8px; color: var(--navy); text-decoration: none; font-weight: 600; font-size: .9rem; }
    .related-grid a:hover { background: #F8FAFC; border-color: var(--navy); }
    details { margin: 8px 0; padding: 10px 14px; background: #F8FAFC; border-radius: 8px; }
    summary { font-weight: 700; color: var(--navy); cursor: pointer; }
    details p { margin: 8px 0 0; color: var(--text-2); }
    .wc-chip { display: inline-block; padding: 4px 10px; border-radius: 999px; background: var(--gold); color: var(--navy); font-weight: 800; font-size: .82rem; letter-spacing: -0.005em; margin-bottom: 12px; }
    .wc-quick { background: #F8FAFC; border: 1px solid var(--border); border-radius: 12px; padding: 16px 18px; margin: 18px 0; }
    .wc-quick dl { display: grid; grid-template-columns: max-content 1fr; gap: 6px 14px; margin: 0; }
    .wc-quick dt { font-weight: 700; color: var(--navy); font-size: .88rem; }
    .wc-quick dd { margin: 0; color: var(--text); font-size: .92rem; }`;

const hreflangEN = (slug) => `
  <link rel="canonical" href="https://statedoku.com/learn/${slug}/">
  <link rel="alternate" hreflang="en" href="https://statedoku.com/learn/${slug}/">
  <link rel="alternate" hreflang="en-US" href="https://statedoku.com/learn/${slug}/">
  <link rel="alternate" hreflang="en-GB" href="https://statedoku.com/learn/${slug}/">
  <link rel="alternate" hreflang="en-CA" href="https://statedoku.com/learn/${slug}/">
  <link rel="alternate" hreflang="en-AU" href="https://statedoku.com/learn/${slug}/">
  <link rel="alternate" hreflang="x-default" href="https://statedoku.com/learn/${slug}/">`;
const hreflangES = (slug) => `
  <link rel="canonical" href="https://statedoku.com/es/learn/${slug}/">
  <link rel="alternate" hreflang="es" href="https://statedoku.com/es/learn/${slug}/">
  <link rel="alternate" hreflang="es-ES" href="https://statedoku.com/es/learn/${slug}/">
  <link rel="alternate" hreflang="es-MX" href="https://statedoku.com/es/learn/${slug}/">
  <link rel="alternate" hreflang="es-AR" href="https://statedoku.com/es/learn/${slug}/">
  <link rel="alternate" hreflang="es-CO" href="https://statedoku.com/es/learn/${slug}/">
  <link rel="alternate" hreflang="es-PE" href="https://statedoku.com/es/learn/${slug}/">
  <link rel="alternate" hreflang="es-CL" href="https://statedoku.com/es/learn/${slug}/">
  <link rel="alternate" hreflang="es-US" href="https://statedoku.com/es/learn/${slug}/">
  <link rel="alternate" hreflang="x-default" href="https://statedoku.com/learn/">`;
const hreflangFR = (slug) => `
  <link rel="canonical" href="https://statedoku.com/fr/learn/${slug}/">
  <link rel="alternate" hreflang="fr" href="https://statedoku.com/fr/learn/${slug}/">
  <link rel="alternate" hreflang="fr-FR" href="https://statedoku.com/fr/learn/${slug}/">
  <link rel="alternate" hreflang="fr-CA" href="https://statedoku.com/fr/learn/${slug}/">
  <link rel="alternate" hreflang="fr-BE" href="https://statedoku.com/fr/learn/${slug}/">
  <link rel="alternate" hreflang="fr-CH" href="https://statedoku.com/fr/learn/${slug}/">
  <link rel="alternate" hreflang="x-default" href="https://statedoku.com/learn/">`;

const footerEN = `<footer>
  <p>Statedoku &copy; 2026 &nbsp;·&nbsp; <a href="https://www.reddit.com/r/Statedoku/" rel="noopener" target="_blank">💬 Reddit</a> &nbsp;·&nbsp; <a href="/about/">About</a> &nbsp;·&nbsp; <a href="/learn/">Learn</a> &nbsp;·&nbsp; <a href="/states/">All states</a> &nbsp;·&nbsp; <a href="/quiz/">Quiz</a> &nbsp;·&nbsp; <a href="/facts/">Facts</a> &nbsp;·&nbsp; <a href="/faq/">FAQ</a></p>
</footer>
<script src="/config.js"></script>
<script src="/js/admin.js"></script>
</body>
</html>`;
const footerES = `<footer>
  <p>Statedoku &copy; 2026 &nbsp;·&nbsp; <a href="https://www.reddit.com/r/Statedoku/" rel="noopener" target="_blank">💬 Reddit</a> &nbsp;·&nbsp; <a href="/es/about/">Acerca</a> &nbsp;·&nbsp; <a href="/es/learn/">Aprender</a> &nbsp;·&nbsp; <a href="/states/">Estados</a> &nbsp;·&nbsp; <a href="/quiz/">Quiz</a> &nbsp;·&nbsp; <a href="/facts/">Facts</a> &nbsp;·&nbsp; <a href="/es/faq/">FAQ</a></p>
</footer>
<script src="/config.js"></script>
<script src="/js/admin.js"></script>
</body>
</html>`;
const footerFR = `<footer>
  <p>Statedoku &copy; 2026 &nbsp;·&nbsp; <a href="https://www.reddit.com/r/Statedoku/" rel="noopener" target="_blank">💬 Reddit</a> &nbsp;·&nbsp; <a href="/fr/about/">À propos</a> &nbsp;·&nbsp; <a href="/fr/learn/">Apprendre</a> &nbsp;·&nbsp; <a href="/states/">États</a> &nbsp;·&nbsp; <a href="/quiz/">Quiz</a> &nbsp;·&nbsp; <a href="/facts/">Facts</a> &nbsp;·&nbsp; <a href="/fr/faq/">FAQ</a></p>
</footer>
<script src="/config.js"></script>
<script src="/js/admin.js"></script>
</body>
</html>`;

// Related grids — shared across each language's WC pages
const wcRelatedEN = `    <div class="related-grid">
      <a href="/learn/world-cup-2026-us-host-cities/">→ All 11 US host cities</a>
      <a href="/learn/world-cup-2026-final-stadium/">→ The Final: MetLife Stadium</a>
      <a href="/learn/world-cup-2026-schedule-by-state/">→ Schedule by state</a>
      <a href="/learn/world-cup-2026-stadiums-complete/">→ All 16 host stadiums</a>
      <a href="/learn/state-capitals/">→ Learn the 50 US capitals</a>
      <a href="/learn/us-regions/">→ The 4 US regions</a>
    </div>`;
const wcRelatedES = `    <div class="related-grid">
      <a href="/es/learn/mundial-2026-eeuu/">→ Las 11 ciudades sede en EE.UU.</a>
      <a href="/es/learn/mundial-2026-final-metlife/">→ La final: MetLife Stadium</a>
      <a href="/es/learn/mexico-mundial-2026/">→ México en el Mundial 2026</a>
      <a href="/es/learn/argentina-mundial-2026/">→ Argentina en el Mundial 2026</a>
      <a href="/es/learn/mundial-2026-estadios/">→ Los 16 estadios del Mundial</a>
      <a href="/es/learn/capitales-de-estados/">→ Las 50 capitales de EE.UU.</a>
    </div>`;
const wcRelatedFR = `    <div class="related-grid">
      <a href="/fr/learn/coupe-du-monde-2026-villes-usa/">→ Les 11 villes hôtes aux USA</a>
      <a href="/fr/learn/coupe-du-monde-2026-finale/">→ La finale : MetLife Stadium</a>
      <a href="/fr/learn/france-coupe-du-monde-2026/">→ La France à la Coupe du Monde 2026</a>
      <a href="/fr/learn/coupe-du-monde-2026-stades/">→ Les 16 stades de la Coupe</a>
      <a href="/fr/learn/coupe-du-monde-2026-voyage-usa/">→ Voyager aux USA pour la Coupe</a>
      <a href="/fr/learn/capitales-des-etats/">→ Les 50 capitales américaines</a>
    </div>`;

function wrap(lang, slug, title, desc, kw, h1, sub, body, faqJson, breadcrumb, headerHref, headerLabel, related, hreflang, footer, locale) {
  return `<!DOCTYPE html>
<html lang="${lang}">
<head>
  <meta charset="UTF-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0, viewport-fit=cover">
  <meta name="theme-color" content="#0F2147">
  <meta name="color-scheme" content="light">
  <title>${title}</title>
  <meta name="description" content="${desc}">
  <meta name="keywords" content="${kw}">
  <meta name="robots" content="index, follow, max-image-preview:large">
${hreflang}
  <link rel="icon" type="image/svg+xml" href="/favicon.svg?v=5">
  <link rel="stylesheet" href="/css/style.css?v=18">
  <meta property="og:type" content="article">
  <meta property="og:title" content="${h1}">
  <meta property="og:description" content="${desc.slice(0, 160)}">
  <meta property="og:url" content="https://statedoku.com${headerHref}${slug}/">
  <meta property="og:image" content="https://statedoku.com/og/og-learn-state-capitals.png">
  <meta property="og:locale" content="${locale}">
  <meta name="twitter:card" content="summary_large_image">
  <meta name="twitter:title" content="${h1}">
  <meta name="twitter:description" content="${desc.slice(0, 160)}">
  <meta name="twitter:image" content="https://statedoku.com/og/og-learn-state-capitals.png">
  <style>${styles}</style>
</head>
<body class="legal-body">
<header>
  <a href="${headerHref === '/learn/' ? '/' : (headerHref === '/es/learn/' ? '/es/' : '/fr/')}" class="logo">State<em>doku</em> <span class="logo-flag">🇺🇸</span></a>
  <nav class="nav-actions"><a href="${headerHref}" style="color:var(--text-2);text-decoration:none;font-weight:700;font-size:.88rem;">← ${headerLabel}</a></nav>
</header>
<script type="application/ld+json">
{"@context":"https://schema.org","@type":"BreadcrumbList","itemListElement":${breadcrumb}}
</script>
<script type="application/ld+json">${faqJson}</script>
<main>
  <section class="lt-hero">
    <span class="wc-chip">🏆 FIFA WORLD CUP 2026</span>
    <h1>${h1}</h1>
    <p class="sub">${sub}</p>
  </section>
  <article class="lt-main">
${body}
    <h2>${lang === 'en' ? 'Related — World Cup 2026 + US' : lang === 'es' ? 'Relacionado — Mundial 2026 + EE.UU.' : 'À voir aussi — Coupe du Monde 2026 + USA'}</h2>
${related}
  </article>
</main>
${footer}`;
}

const faq = (qa) => JSON.stringify({
  '@context': 'https://schema.org', '@type': 'FAQPage',
  mainEntity: qa.map(([q, a]) => ({ '@type': 'Question', name: q, acceptedAnswer: { '@type': 'Answer', text: a } })),
});

const out = [];

// ═════════════════════════════════════════════════════════════════════════
// EN MASTER HUB: /learn/world-cup-2026-us-host-cities/
// ═════════════════════════════════════════════════════════════════════════
const enHubBody = `    <p>The <strong>2026 FIFA World Cup</strong> will be hosted by <strong>three countries: the USA, Canada, and Mexico</strong> — the first World Cup ever co-hosted by three nations and the first with <strong>48 teams</strong>. The tournament kicks off on <strong>${KEY_DATES.opening}</strong> at the <strong>${KEY_DATES.openingVenue}</strong> and ends with the <strong>final on ${KEY_DATES.final}</strong> at <strong>${KEY_DATES.finalVenue}</strong>.</p>

    <div class="wc-quick">
      <dl>
        <dt>Total teams</dt><dd>48 (up from 32 in 2022)</dd>
        <dt>Total matches</dt><dd>${KEY_DATES.totalMatches} matches over 39 days</dd>
        <dt>Host countries</dt><dd>🇺🇸 USA · 🇨🇦 Canada · 🇲🇽 Mexico</dd>
        <dt>US host cities</dt><dd>11 cities across 9 states</dd>
        <dt>Opening match</dt><dd>${KEY_DATES.opening} — ${KEY_DATES.openingVenue}</dd>
        <dt>Final</dt><dd>${KEY_DATES.final} — ${KEY_DATES.finalVenue}</dd>
      </dl>
    </div>

    <h2>The 11 US host cities</h2>
    <p>78 of the 104 World Cup matches will be played in the USA. Each US host city hosts between 6 and 9 matches.</p>

    <table class="lt">
      <thead><tr><th>City</th><th>State</th><th>Stadium</th><th>Matches</th></tr></thead>
      <tbody>
${HOST_CITIES.map(c => `        <tr><td><a href="/learn/${c.slug}-world-cup-2026/"><strong>${c.city}</strong></a></td><td>${c.stateLong}</td><td>${c.stadium}</td><td>${c.matches}</td></tr>`).join('\n')}
      </tbody>
    </table>

    <h2>Which US states host the World Cup?</h2>
    <p>Across the 11 US host cities, <strong>9 US states</strong> are hosting:</p>
    <ul>
      <li><strong>California (CA)</strong> — Los Angeles + San Francisco Bay Area (2 cities)</li>
      <li><strong>Texas (TX)</strong> — Dallas + Houston (2 cities)</li>
      <li><strong>Georgia (GA)</strong> — Atlanta</li>
      <li><strong>Massachusetts (MA)</strong> — Boston</li>
      <li><strong>Missouri (MO)</strong> — Kansas City</li>
      <li><strong>Florida (FL)</strong> — Miami</li>
      <li><strong>New Jersey (NJ)</strong> — New York / NJ (hosts the FINAL)</li>
      <li><strong>Pennsylvania (PA)</strong> — Philadelphia</li>
      <li><strong>Washington (WA)</strong> — Seattle</li>
    </ul>

    <h2>The 3 Canadian + 3 Mexican host cities</h2>
    <p>Outside the US, <strong>Toronto and Vancouver</strong> host in Canada, and <strong>Mexico City, Guadalajara, and Monterrey</strong> host in Mexico.</p>

    <h2>The Final — MetLife Stadium, New Jersey</h2>
    <p>The Final is at <strong>MetLife Stadium</strong> in East Rutherford, New Jersey — across the Hudson from Manhattan. With 82,500 seats, it's the largest US World Cup venue. Home of the NY Giants and NY Jets.</p>

    <h2>Tickets</h2>
    <p>Tickets are sold via <strong>FIFA.com/tickets</strong>. The first phase sold out in October 2025. Subsequent phases (random draws, team-specific allocations, hospitality) opened in early 2026. Average prices for group-stage matches: $60-$300. Final ticket prices: $1,000-$4,000 face value.</p>

    <div class="cta-card">
      <h3>Learn the host states by playing</h3>
      <p>Statedoku's daily puzzle uses "Hosts World Cup 2026" as a constraint. Five minutes, you know which 9 states are hosting.</p>
      <a href="/">Play today's puzzle →</a>
    </div>

    <h2>Frequently asked questions</h2>
    <details><summary><strong>Where is the 2026 World Cup being held?</strong></summary><p>The 2026 World Cup is co-hosted by the USA, Canada, and Mexico. 11 US cities, 2 Canadian cities, and 3 Mexican cities host matches. The final is at MetLife Stadium in New Jersey.</p></details>
    <details><summary><strong>When does the 2026 World Cup start?</strong></summary><p>${KEY_DATES.opening} with the opening match at ${KEY_DATES.openingVenue}.</p></details>
    <details><summary><strong>When is the 2026 World Cup Final?</strong></summary><p>${KEY_DATES.final} at MetLife Stadium in East Rutherford, New Jersey (greater NYC area).</p></details>
    <details><summary><strong>Which US city hosts the most matches?</strong></summary><p>Dallas (AT&T Stadium) — 9 matches. The next-most are Atlanta and Los Angeles with 8 each.</p></details>
    <details><summary><strong>How many states are hosting?</strong></summary><p>9 US states: California (LA + SF Bay), Texas (Dallas + Houston), Georgia, Massachusetts, Missouri, Florida, New Jersey, Pennsylvania, Washington.</p></details>
`;

out.push(['learn/world-cup-2026-us-host-cities',
  wrap('en', 'world-cup-2026-us-host-cities',
    '2026 World Cup US host cities — all 11 venues + final (2026) | Statedoku',
    `All 11 US host cities for the 2026 FIFA World Cup: Atlanta, Boston, Dallas, Houston, Kansas City, LA, Miami, NY/NJ (final), Philadelphia, SF Bay, Seattle. Stadiums + states.`,
    'world cup 2026 host cities, fifa world cup 2026 usa, world cup 2026 stadiums, where is world cup 2026, world cup 2026 schedule',
    '2026 World Cup — All 11 US Host Cities',
    `Atlanta, Boston, Dallas, Houston, Kansas City, LA, Miami, NY/NJ, Philadelphia, SF Bay, Seattle. The Final is at MetLife Stadium, NJ on ${KEY_DATES.final}.`,
    enHubBody,
    faq([
      ["Which US cities host the 2026 World Cup?", "The 11 US host cities are: Atlanta (GA), Boston (MA), Dallas (TX), Houston (TX), Kansas City (MO), Los Angeles (CA), Miami (FL), New York / New Jersey (NJ), Philadelphia (PA), San Francisco Bay Area (CA), and Seattle (WA)."],
      ["Where is the 2026 World Cup Final?", `The 2026 FIFA World Cup Final is at MetLife Stadium in East Rutherford, New Jersey on ${KEY_DATES.final}. MetLife seats 82,500 — the largest US venue at the tournament.`],
      ["How many US states host World Cup 2026 matches?", "9 US states host: California (LA + SF Bay Area), Texas (Dallas + Houston), Georgia, Massachusetts, Missouri, Florida, New Jersey, Pennsylvania, and Washington."],
      ["When does the 2026 World Cup start?", `${KEY_DATES.opening} at ${KEY_DATES.openingVenue}.`],
      ["Which US city hosts the most World Cup matches?", "Dallas (AT&T Stadium) hosts 9 matches — the most of any US venue. Atlanta and Los Angeles each host 8."],
    ]),
    `[{"@type":"ListItem","position":1,"name":"Home","item":"https://statedoku.com/"},{"@type":"ListItem","position":2,"name":"Learn","item":"https://statedoku.com/learn/"},{"@type":"ListItem","position":3,"name":"2026 World Cup US Host Cities","item":"https://statedoku.com/learn/world-cup-2026-us-host-cities/"}]`,
    '/learn/', 'Learn', wcRelatedEN, hreflangEN('world-cup-2026-us-host-cities'), footerEN, 'en_US'
  )
]);

// ═════════════════════════════════════════════════════════════════════════
// EN — 11 CITY PAGES
// ═════════════════════════════════════════════════════════════════════════
for (const c of HOST_CITIES) {
  const body = `    <p><strong>${c.city}, ${c.stateLong}</strong> is one of the <strong>11 US host cities</strong> for the FIFA World Cup 2026, with all matches played at <strong>${c.stadium}</strong>. The venue will host <strong>${c.matches} matches</strong>${c.slug === 'new-york-new-jersey' ? ' — including the FINAL on July 19, 2026' : ''}.</p>

    <div class="wc-quick">
      <dl>
        <dt>Stadium</dt><dd>${c.stadium}</dd>
        <dt>Capacity</dt><dd>${c.capacity.toLocaleString()} seats</dd>
        <dt>State</dt><dd>${c.stateLong} (${c.state})</dd>
        <dt>NFL tenant</dt><dd>${c.nfl}</dd>
        <dt>Matches</dt><dd>${c.matches}${c.knockout ? ' (includes knockout round)' : ''}</dd>
      </dl>
    </div>

    <h2>About ${c.stadium}</h2>
    <p>${c.notes}</p>

    ${c.slug === 'new-york-new-jersey' ? `<p><strong>This venue hosts the World Cup Final on July 19, 2026.</strong> MetLife is the only US venue dedicated to a confirmed Final slot — making it the most coveted ticket of the tournament.</p>` : ''}
    ${c.slug === 'dallas' ? `<p>AT&T Stadium hosts the <strong>most matches</strong> of any US venue (9). It's an indoor retractable-roof venue — protecting players and fans from the Texas summer heat. Located in Arlington, between Dallas and Fort Worth.</p>` : ''}
    ${c.slug === 'los-angeles' ? `<p>SoFi Stadium is the newest US World Cup venue (opened September 2020). Cost: <strong>$5.5 billion</strong> — the most expensive stadium ever built. Has a translucent ETFE roof and a 70,000-seat capacity that can expand to 100,000 for special events.</p>` : ''}
    ${c.slug === 'seattle' ? `<p>Seattle has perhaps the strongest soccer culture of any US host city. The Seattle Sounders (MLS) regularly draw 40,000+ at Lumen Field, and the city's supporters' culture is widely considered the most European-style in North America.</p>` : ''}

    <h2>Getting to ${c.city}</h2>
    <ul>
      ${c.slug === 'atlanta'           ? `<li><strong>Airport:</strong> Hartsfield-Jackson Atlanta International (ATL) — busiest airport in the world.</li><li><strong>Public transit:</strong> MARTA rail goes straight to Mercedes-Benz Stadium (Vine City station).</li><li><strong>Walking distance:</strong> Centennial Olympic Park, Georgia Aquarium, World of Coca-Cola.</li>` :
        c.slug === 'boston'            ? `<li><strong>Airport:</strong> Boston Logan International (BOS).</li><li><strong>Public transit:</strong> Gillette Stadium is 25 miles south of Boston in Foxborough — commuter rail from South Station available on match days.</li><li><strong>Walking distance:</strong> Patriot Place (shopping/dining).</li>` :
        c.slug === 'dallas'            ? `<li><strong>Airports:</strong> DFW International (DFW) or Dallas Love Field (DAL).</li><li><strong>Public transit:</strong> Limited — drive or rideshare to AT&T Stadium in Arlington (between Dallas and Fort Worth).</li><li><strong>Walking distance:</strong> Globe Life Field (Texas Rangers baseball stadium) next door.</li>` :
        c.slug === 'houston'           ? `<li><strong>Airport:</strong> George Bush Intercontinental (IAH) or Hobby (HOU).</li><li><strong>Public transit:</strong> METRO Light Rail Red Line stops at NRG Stadium.</li><li><strong>Walking distance:</strong> NRG Park complex including the Houston Livestock Show grounds.</li>` :
        c.slug === 'kansas-city'       ? `<li><strong>Airport:</strong> Kansas City International (MCI).</li><li><strong>Public transit:</strong> Limited — drive or rideshare to Arrowhead Stadium.</li><li><strong>Walking distance:</strong> Kauffman Stadium (Royals baseball) shares the Truman Sports Complex parking lots.</li>` :
        c.slug === 'los-angeles'       ? `<li><strong>Airport:</strong> LAX, served by Metro Crenshaw/LAX line direct to SoFi.</li><li><strong>Public transit:</strong> Metro K Line stops near SoFi.</li><li><strong>Walking distance:</strong> Intuit Dome (LA Clippers' new home), Hollywood Park casino, YouTube Theater.</li>` :
        c.slug === 'miami'             ? `<li><strong>Airports:</strong> Miami International (MIA) or Fort Lauderdale (FLL).</li><li><strong>Public transit:</strong> Limited — rideshare recommended to Hard Rock Stadium in Miami Gardens.</li><li><strong>Walking distance:</strong> Not pedestrian-friendly — plan for 30-min drives between stadium, beach, and downtown.</li>` :
        c.slug === 'new-york-new-jersey' ? `<li><strong>Airports:</strong> Newark (EWR — closest to MetLife), JFK, LaGuardia (LGA).</li><li><strong>Public transit:</strong> NJ Transit train from NYC Penn Station direct to Meadowlands station (15 min).</li><li><strong>Walking distance from MetLife:</strong> Limited — most fans will base themselves in NYC (Manhattan).</li>` :
        c.slug === 'philadelphia'      ? `<li><strong>Airport:</strong> Philadelphia International (PHL).</li><li><strong>Public transit:</strong> SEPTA Broad Street Line to NRG / AT&T station, right at the sports complex.</li><li><strong>Walking distance:</strong> Citizens Bank Park (Phillies baseball), Wells Fargo Center (76ers basketball).</li>` :
        c.slug === 'san-francisco-bay-area' ? `<li><strong>Airports:</strong> San Francisco (SFO), San Jose (SJC), or Oakland (OAK).</li><li><strong>Public transit:</strong> VTA light rail stops at Levi's Stadium in Santa Clara (45 miles south of San Francisco).</li><li><strong>Walking distance:</strong> Santana Row shopping (3 miles), Great America theme park (adjacent).</li>` :
                                          `<li><strong>Airport:</strong> Seattle-Tacoma International (SEA).</li><li><strong>Public transit:</strong> Light Rail from SeaTac airport to Stadium station — Lumen Field is right downtown.</li><li><strong>Walking distance:</strong> Pike Place Market, Pioneer Square, T-Mobile Park (Mariners baseball).</li>`}
    </ul>

    <h2>What to know about ${c.stateLong}</h2>
    <p>${c.stateLong} has the USPS abbreviation <strong>${c.state}</strong>${c.slug === 'new-york-new-jersey' ? ' (note: MetLife Stadium is in New Jersey, not New York — even though it\'s called the New York / New Jersey host venue)' : ''}. Learn more about ${c.stateLong} on our <a href="/states/${c.stateLong.toLowerCase().replace(/ /g, '-')}/">state page</a>.</p>

    <div class="cta-card">
      <h3>Learn the host states by playing</h3>
      <p>Statedoku's daily puzzle uses "Hosts World Cup 2026" as a constraint. Learn the 9 host states by playing 5 minutes per day.</p>
      <a href="/">Play today's puzzle →</a>
    </div>

    <h2>Frequently asked questions</h2>
    <details><summary><strong>How many matches will ${c.city} host?</strong></summary><p>${c.city} hosts ${c.matches} matches during the 2026 FIFA World Cup, all at ${c.stadium}.</p></details>
    <details><summary><strong>What stadium will ${c.city} use?</strong></summary><p>${c.stadium}, the home of the ${c.nfl} (NFL). Capacity: ${c.capacity.toLocaleString()}.</p></details>
    <details><summary><strong>What state is ${c.city} in?</strong></summary><p>${c.city} is in ${c.stateLong} (USPS code: ${c.state}).</p></details>
    ${c.slug === 'new-york-new-jersey' ? `<details><summary><strong>Is the World Cup Final in New York?</strong></summary><p>Sort of. The Final is at MetLife Stadium, which is in East Rutherford, New Jersey — across the Hudson River from Manhattan. Officially it's the "New York / New Jersey" host venue.</p></details>` : ''}
    ${c.slug === 'dallas'   ? `<details><summary><strong>Why does Dallas host the most matches?</strong></summary><p>AT&T Stadium has the largest capacity of any US venue (80,000), an indoor retractable roof (no weather worries), and central US location. FIFA selected it for 9 matches including a Round of 16 and Quarter-Final.</p></details>` : ''}
`;

  out.push([`learn/${c.slug}-world-cup-2026`,
    wrap('en', `${c.slug}-world-cup-2026`,
      `${c.city} 2026 World Cup — ${c.stadium} matches + state info | Statedoku`,
      `${c.city} (${c.stateLong}) hosts ${c.matches} 2026 FIFA World Cup matches at ${c.stadium}. ${c.slug === 'new-york-new-jersey' ? 'Includes the FINAL on July 19, 2026.' : 'Stadium details, transit, dates, and state info.'}`,
      `${c.city} world cup 2026, ${c.stadium} world cup, fifa 2026 ${c.city.toLowerCase()}, ${c.stateLong.toLowerCase()} world cup matches`,
      `${c.city} — 2026 World Cup`,
      `${c.matches} matches at ${c.stadium}. Located in ${c.stateLong}. ${c.slug === 'new-york-new-jersey' ? 'Hosts the FINAL.' : ''}`,
      body,
      faq([
        [`How many matches will ${c.city} host at the 2026 World Cup?`, `${c.city} hosts ${c.matches} matches during the 2026 FIFA World Cup, all at ${c.stadium} (capacity ${c.capacity.toLocaleString()}).`],
        [`What state is ${c.city} in?`, `${c.city} is in ${c.stateLong} (USPS abbreviation: ${c.state}).`],
        [`What stadium does ${c.city} use for the World Cup?`, `${c.stadium}, home of the ${c.nfl}. ${c.notes}`],
        c.slug === 'new-york-new-jersey'
          ? [`Where is the 2026 World Cup Final?`, `The Final is at MetLife Stadium in East Rutherford, New Jersey on July 19, 2026 — across the Hudson from Manhattan.`]
          : [`Is ${c.city} a host city for the 2026 World Cup?`, `Yes, ${c.city} is one of the 11 US host cities for the FIFA World Cup 2026, hosting ${c.matches} matches at ${c.stadium}.`],
      ]),
      `[{"@type":"ListItem","position":1,"name":"Home","item":"https://statedoku.com/"},{"@type":"ListItem","position":2,"name":"Learn","item":"https://statedoku.com/learn/"},{"@type":"ListItem","position":3,"name":"${c.city} — 2026 World Cup","item":"https://statedoku.com/learn/${c.slug}-world-cup-2026/"}]`,
      '/learn/', 'Learn', wcRelatedEN, hreflangEN(`${c.slug}-world-cup-2026`), footerEN, 'en_US'
    )
  ]);
}

// ═════════════════════════════════════════════════════════════════════════
// EN — 3 TOPICAL
// ═════════════════════════════════════════════════════════════════════════

// 1. /learn/world-cup-2026-final-stadium/
out.push(['learn/world-cup-2026-final-stadium',
  wrap('en', 'world-cup-2026-final-stadium',
    '2026 World Cup Final — MetLife Stadium, New Jersey (July 19) | Statedoku',
    'The 2026 FIFA World Cup Final is at MetLife Stadium in East Rutherford, New Jersey on July 19, 2026. Capacity 82,500. How to get there, what to know, tickets.',
    'world cup 2026 final, metlife stadium world cup, world cup 2026 final stadium, new jersey world cup final, world cup final venue 2026',
    '2026 World Cup Final — MetLife Stadium',
    'The 2026 FIFA World Cup Final is at MetLife Stadium in New Jersey on July 19, 2026. Here\'s everything to know.',
    `    <p>The <strong>2026 FIFA World Cup Final</strong> will be played at <strong>MetLife Stadium</strong> in East Rutherford, <strong>New Jersey</strong>, on <strong>July 19, 2026</strong>. With 82,500 seats, it's the largest US venue at the tournament — and the only one dedicated to the Final.</p>

    <div class="wc-quick">
      <dl>
        <dt>Stadium</dt><dd>MetLife Stadium</dd>
        <dt>City</dt><dd>East Rutherford, New Jersey</dd>
        <dt>Capacity</dt><dd>82,500 seats</dd>
        <dt>Built</dt><dd>2010</dd>
        <dt>NFL tenants</dt><dd>New York Giants + New York Jets</dd>
        <dt>Final date</dt><dd>${KEY_DATES.final}</dd>
      </dl>
    </div>

    <h2>Where exactly is MetLife Stadium?</h2>
    <p>MetLife is in <strong>East Rutherford, NJ</strong> — about <strong>5 miles west of Manhattan</strong>, across the Hudson River. It's part of the Meadowlands Sports Complex. Even though it's marketed as the "New York / New Jersey" venue, it's physically in New Jersey, not New York.</p>

    <h2>How to get to MetLife from NYC</h2>
    <ul>
      <li><strong>NJ Transit train:</strong> direct from Penn Station (NYC) to Meadowlands. ~15 minutes, $5.25.</li>
      <li><strong>Bus:</strong> from Port Authority Bus Terminal — slow on match days.</li>
      <li><strong>Drive:</strong> 7 miles via the Lincoln Tunnel. Heavy parking traffic on match days.</li>
      <li><strong>Rideshare:</strong> Uber/Lyft — expect surge pricing on Final day.</li>
    </ul>

    <h2>Other matches at MetLife (besides the Final)</h2>
    <p>MetLife hosts <strong>8 total matches</strong> during the tournament, including:</p>
    <ul>
      <li>Group-stage matches (several)</li>
      <li>Round of 16</li>
      <li>Quarter-Final</li>
      <li>Semi-Final</li>
      <li><strong>The FINAL — July 19, 2026</strong></li>
    </ul>

    <h2>History of MetLife Stadium</h2>
    <p>MetLife opened in 2010, replacing the old Giants Stadium. Cost: $1.6 billion at the time — was the most expensive stadium in the world. Hosted Super Bowl XLVIII in 2014. Co-tenancy between the Giants and Jets is unique — it's the only NFL stadium shared by two teams. Both teams have their own locker rooms, end zones, and decorative colors that change weekly.</p>

    <h2>The Final crowd</h2>
    <p>An expected <strong>82,500 spectators</strong> at the Final. Past Final attendance for comparison:</p>
    <ul>
      <li>2022 Qatar (Lusail Stadium): 88,966 — Argentina 3-3 France (Argentina won on PKs).</li>
      <li>2018 Russia (Luzhniki): 78,011 — France 4-2 Croatia.</li>
      <li>2014 Brazil (Maracanã): 74,738 — Germany 1-0 Argentina.</li>
    </ul>

    <h2>Past Finals played in the USA</h2>
    <p>This is only the <strong>second World Cup Final ever played in the USA</strong>. The first was in 1994 at the Rose Bowl in Pasadena, California (Brazil beat Italy on penalties). The 1999 Women's World Cup Final was also at the Rose Bowl (USA beat China on penalties — the famous Brandi Chastain shirt celebration).</p>

    <h2>Tickets</h2>
    <p>Final tickets sold via FIFA.com/tickets. Face-value range: $1,000–$4,000+. Secondary market prices for past Finals have ranged from $5,000 to $30,000+ depending on which teams qualify. Hospitality packages start at $15,000.</p>

    <div class="cta-card">
      <h3>Learn the 50 US states by playing</h3>
      <p>The 2026 Final is in <a href="/states/new-jersey/" style="color:#fff;text-decoration:underline">New Jersey</a> — Statedoku's puzzle teaches you all 50 states one match at a time.</p>
      <a href="/">Play today's puzzle →</a>
    </div>

    <h2>Frequently asked questions</h2>
    <details><summary><strong>Where is the 2026 World Cup Final?</strong></summary><p>The 2026 FIFA World Cup Final is at MetLife Stadium in East Rutherford, New Jersey on July 19, 2026.</p></details>
    <details><summary><strong>Is MetLife Stadium in New York or New Jersey?</strong></summary><p>New Jersey. East Rutherford, specifically. About 5 miles west of Manhattan. The "New York" branding is because of its proximity to NYC.</p></details>
    <details><summary><strong>What is the capacity for the Final?</strong></summary><p>82,500 seats — the largest US venue at the World Cup.</p></details>
    <details><summary><strong>When was the last World Cup Final in the USA?</strong></summary><p>1994 at the Rose Bowl in Pasadena, California. Brazil beat Italy on penalties. The 1999 Women's World Cup Final was also at the Rose Bowl.</p></details>
    <details><summary><strong>How much do Final tickets cost?</strong></summary><p>Face value: $1,000–$4,000+ via FIFA.com. Secondary market prices vary widely depending on which teams qualify — past Finals have seen prices from $5,000 to $30,000+ on resale.</p></details>
`,
    faq([
      ['Where is the 2026 World Cup Final?', `The 2026 FIFA World Cup Final is at MetLife Stadium in East Rutherford, New Jersey on ${KEY_DATES.final}.`],
      ['Is MetLife Stadium in New York or New Jersey?', 'MetLife Stadium is in East Rutherford, New Jersey — about 5 miles west of Manhattan across the Hudson River. The "New York" branding refers to its proximity to NYC.'],
      ['What is the capacity of MetLife Stadium?', '82,500 seats. It is the largest US venue at the 2026 FIFA World Cup.'],
      ['When was the last World Cup Final hosted in the USA?', '1994 at the Rose Bowl in Pasadena, California. Brazil beat Italy on penalties. The 2026 Final will be the second-ever in the US.'],
    ]),
    `[{"@type":"ListItem","position":1,"name":"Home","item":"https://statedoku.com/"},{"@type":"ListItem","position":2,"name":"Learn","item":"https://statedoku.com/learn/"},{"@type":"ListItem","position":3,"name":"World Cup Final 2026","item":"https://statedoku.com/learn/world-cup-2026-final-stadium/"}]`,
    '/learn/', 'Learn', wcRelatedEN, hreflangEN('world-cup-2026-final-stadium'), footerEN, 'en_US'
  )
]);

// 2. /learn/world-cup-2026-schedule-by-state/
out.push(['learn/world-cup-2026-schedule-by-state',
  wrap('en', 'world-cup-2026-schedule-by-state',
    '2026 World Cup schedule by US state — matches in each state | Statedoku',
    'Where to watch World Cup 2026 by US state. California 14 matches, Texas 16, New Jersey 8 (incl. Final), Georgia 8. Full breakdown by state and stadium.',
    'world cup 2026 schedule by state, fifa 2026 matches by state, world cup 2026 matches per state, where to see world cup 2026',
    '2026 World Cup schedule — by US state',
    'How the 78 US matches are distributed across the 9 host states. Texas leads with 16 matches; New Jersey hosts the Final.',
    `    <p>The <strong>2026 FIFA World Cup</strong> brings <strong>78 of its 104 matches</strong> to the USA across <strong>9 host states</strong> and <strong>11 host cities</strong>. Here's the breakdown by state.</p>

    <h2>Matches by US state</h2>
    <table class="lt">
      <thead><tr><th>State</th><th>Cities</th><th>Matches</th><th>Notable</th></tr></thead>
      <tbody>
        <tr><td><strong>Texas</strong></td><td>Dallas + Houston</td><td>16</td><td>Dallas (AT&T) hosts the most of any US venue (9)</td></tr>
        <tr><td><strong>California</strong></td><td>LA + SF Bay</td><td>14</td><td>SoFi Stadium (LA) — newest US WC venue</td></tr>
        <tr><td><strong>New Jersey</strong></td><td>NY/NJ</td><td>8</td><td>Hosts the FINAL (MetLife, Jul 19)</td></tr>
        <tr><td><strong>Georgia</strong></td><td>Atlanta</td><td>8</td><td>Mercedes-Benz — central US hub</td></tr>
        <tr><td><strong>Massachusetts</strong></td><td>Boston (Foxborough)</td><td>7</td><td>Gillette Stadium</td></tr>
        <tr><td><strong>Florida</strong></td><td>Miami</td><td>7</td><td>Hard Rock Stadium — Messi territory</td></tr>
        <tr><td><strong>Missouri</strong></td><td>Kansas City</td><td>6</td><td>Arrowhead — loudest crowd in NFL</td></tr>
        <tr><td><strong>Pennsylvania</strong></td><td>Philadelphia</td><td>6</td><td>Lincoln Financial Field</td></tr>
        <tr><td><strong>Washington</strong></td><td>Seattle</td><td>6</td><td>Lumen Field — best soccer culture in US</td></tr>
      </tbody>
    </table>
    <p>Total: <strong>78 US matches</strong>. Combined with 13 in Mexico and 13 in Canada, the tournament covers ${KEY_DATES.totalMatches} total.</p>

    <h2>Key dates by region</h2>
    <ul>
      <li><strong>${KEY_DATES.opening}</strong> — Opening match at Estadio Azteca, Mexico City.</li>
      <li><strong>June 11–27</strong> — Group stage (matches across all venues).</li>
      <li><strong>June 27–July 3</strong> — Round of 32.</li>
      <li><strong>July 4–7</strong> — Round of 16.</li>
      <li><strong>July 9–11</strong> — Quarter-Finals.</li>
      <li><strong>July 14–15</strong> — Semi-Finals.</li>
      <li><strong>July 18</strong> — 3rd place match.</li>
      <li><strong>${KEY_DATES.final}</strong> — Final at MetLife Stadium, New Jersey.</li>
    </ul>

    <h2>Travel strategy by region</h2>
    <h3>East Coast cluster</h3>
    <p>NY/NJ + Boston + Philadelphia + Miami + Atlanta — covering 36 matches. Best base: <strong>NYC area</strong> for the early rounds, then move south. East Coast venues are within 1-3 hour flights of each other.</p>

    <h3>Texas hub</h3>
    <p>Dallas + Houston host <strong>16 matches</strong> — the highest of any state. <strong>3.5-hour drive</strong> or 1-hour flight between them. Great base for fans following teams in groups stationed centrally.</p>

    <h3>West Coast cluster</h3>
    <p>LA + SF Bay + Seattle — 20 matches. Long distances between (6 hours LA-Seattle by car), but cheap one-way flights. Best for fans who want to chase specific teams.</p>

    <div class="cta-card">
      <h3>Learn the 9 host states by playing</h3>
      <p>Statedoku's puzzle uses "Hosts a 2026 World Cup match" as a constraint. Five minutes a day = you know all 9 states.</p>
      <a href="/">Play today's puzzle →</a>
    </div>

    <h2>Frequently asked questions</h2>
    <details><summary><strong>Which US state hosts the most World Cup matches?</strong></summary><p>Texas, with 16 matches across Dallas (9) and Houston (7). California is second with 14 (LA + SF Bay).</p></details>
    <details><summary><strong>Which state hosts the Final?</strong></summary><p>New Jersey hosts the Final at MetLife Stadium on July 19, 2026 — even though it's called the "New York / New Jersey" host venue.</p></details>
    <details><summary><strong>How many matches are in the US total?</strong></summary><p>78 of the 104 tournament matches will be played in the USA. The other 26 are in Mexico (13) and Canada (13).</p></details>
    <details><summary><strong>Which states are NOT hosting any World Cup matches?</strong></summary><p>41 US states are not hosting matches: Alabama, Alaska, Arizona, Arkansas, Colorado, Connecticut, Delaware, Hawaii, Idaho, Illinois, Indiana, Iowa, Kansas, Kentucky, Louisiana, Maine, Maryland, Michigan, Minnesota, Mississippi, Montana, Nebraska, Nevada, New Hampshire, New Mexico, New York (matches are in NJ), North Carolina, North Dakota, Ohio, Oklahoma, Oregon, Rhode Island, South Carolina, South Dakota, Tennessee, Utah, Vermont, Virginia, West Virginia, Wisconsin, Wyoming.</p></details>
`,
    faq([
      ['Which US state hosts the most 2026 World Cup matches?', 'Texas, with 16 matches across Dallas (9 at AT&T Stadium) and Houston (7 at NRG Stadium). California is second with 14 matches across LA and SF Bay Area.'],
      ['How many World Cup matches will the USA host in 2026?', '78 of the 104 total tournament matches will be played in the USA. The other 26 are in Mexico (13) and Canada (13).'],
      ['Which states host the World Cup Final?', 'New Jersey hosts the Final at MetLife Stadium on July 19, 2026 — even though the venue is branded as the New York / New Jersey host.'],
      ['How many US states are hosting World Cup matches?', '9 US states: California, Texas, Georgia, Massachusetts, Missouri, Florida, New Jersey, Pennsylvania, and Washington.'],
    ]),
    `[{"@type":"ListItem","position":1,"name":"Home","item":"https://statedoku.com/"},{"@type":"ListItem","position":2,"name":"Learn","item":"https://statedoku.com/learn/"},{"@type":"ListItem","position":3,"name":"WC2026 schedule by state","item":"https://statedoku.com/learn/world-cup-2026-schedule-by-state/"}]`,
    '/learn/', 'Learn', wcRelatedEN, hreflangEN('world-cup-2026-schedule-by-state'), footerEN, 'en_US'
  )
]);

// 3. /learn/world-cup-2026-stadiums-complete/
out.push(['learn/world-cup-2026-stadiums-complete',
  wrap('en', 'world-cup-2026-stadiums-complete',
    'All 16 2026 World Cup stadiums — USA, Canada, Mexico complete list | Statedoku',
    'Every 2026 FIFA World Cup stadium: 11 in the USA (MetLife, SoFi, AT&T, Mercedes-Benz...), 2 in Canada (BMO Field Toronto, BC Place Vancouver), 3 in Mexico (Azteca, Akron, BBVA).',
    'world cup 2026 stadiums, fifa 2026 venues, all world cup 2026 stadiums, world cup 2026 stadium list, metlife sofi at&t azteca',
    'All 16 2026 World Cup stadiums',
    '11 in the USA, 2 in Canada, 3 in Mexico. The complete list with capacities, locations, and tenants.',
    `    <p>The <strong>2026 FIFA World Cup</strong> is hosted across <strong>16 stadiums in 3 countries</strong>: 11 in the USA, 2 in Canada, and 3 in Mexico. Here's the complete list.</p>

    <h2>🇺🇸 The 11 US stadiums</h2>
    <table class="lt">
      <thead><tr><th>Stadium</th><th>City</th><th>State</th><th>Capacity</th><th>Matches</th></tr></thead>
      <tbody>
${HOST_CITIES.map(c => `        <tr><td><strong>${c.stadium}</strong></td><td><a href="/learn/${c.slug}-world-cup-2026/">${c.city}</a></td><td>${c.state}</td><td>${c.capacity.toLocaleString()}</td><td>${c.matches}</td></tr>`).join('\n')}
      </tbody>
    </table>

    <h2>🇨🇦 The 2 Canadian stadiums</h2>
    <table class="lt">
      <thead><tr><th>Stadium</th><th>City</th><th>Province</th><th>Capacity</th></tr></thead>
      <tbody>
        <tr><td><strong>BMO Field</strong></td><td>Toronto</td><td>Ontario</td><td>~45,500 (expanded for WC)</td></tr>
        <tr><td><strong>BC Place</strong></td><td>Vancouver</td><td>British Columbia</td><td>~54,500</td></tr>
      </tbody>
    </table>

    <h2>🇲🇽 The 3 Mexican stadiums</h2>
    <table class="lt">
      <thead><tr><th>Stadium</th><th>City</th><th>Capacity</th><th>Note</th></tr></thead>
      <tbody>
        <tr><td><strong>Estadio Azteca</strong></td><td>Mexico City</td><td>~87,000</td><td>Hosts the OPENING match — 3rd-ever WC hosting</td></tr>
        <tr><td><strong>Estadio Akron</strong></td><td>Guadalajara</td><td>~46,000</td><td>Home of Chivas (Liga MX)</td></tr>
        <tr><td><strong>Estadio BBVA</strong></td><td>Monterrey</td><td>~51,000</td><td>Home of Monterrey (Liga MX)</td></tr>
      </tbody>
    </table>

    <h2>Largest stadium of the tournament</h2>
    <p><strong>Estadio Azteca</strong> in Mexico City is the largest WC 2026 venue with ~87,000 capacity. It will be the <strong>first stadium ever to host 3 different World Cups</strong> (1970, 1986, 2026).</p>

    <h2>Newest WC stadium</h2>
    <p><strong>SoFi Stadium</strong> in Los Angeles (opened September 2020). Cost: <strong>$5.5 billion</strong> — the most expensive stadium ever built. Translucent ETFE roof.</p>

    <h2>Oldest WC stadium</h2>
    <p><strong>Estadio Azteca</strong>, opened in 1966. Site of Pelé's "Game of the Century" (1970), Maradona's "Hand of God" + "Goal of the Century" (1986).</p>

    <h2>Stadium for the Final</h2>
    <p><strong>MetLife Stadium</strong> (New Jersey) hosts the Final on July 19, 2026. 82,500 seats. Read more at <a href="/learn/world-cup-2026-final-stadium/">The Final at MetLife →</a></p>

    <div class="cta-card">
      <h3>Learn the host states by playing</h3>
      <p>Statedoku uses "Hosts a 2026 World Cup match" as a constraint in its daily puzzle. Master the 9 US host states in a week.</p>
      <a href="/">Play today's puzzle →</a>
    </div>

    <h2>Frequently asked questions</h2>
    <details><summary><strong>How many stadiums host the 2026 World Cup?</strong></summary><p>16 stadiums across 3 countries: 11 in the USA, 2 in Canada (Toronto, Vancouver), and 3 in Mexico (Mexico City, Guadalajara, Monterrey).</p></details>
    <details><summary><strong>What's the largest 2026 World Cup stadium?</strong></summary><p>Estadio Azteca in Mexico City, with ~87,000 capacity. It's also the first stadium ever to host 3 World Cups (1970, 1986, 2026).</p></details>
    <details><summary><strong>What's the newest stadium?</strong></summary><p>SoFi Stadium in Los Angeles, opened September 2020. Cost $5.5 billion — most expensive stadium ever built.</p></details>
    <details><summary><strong>What stadium hosts the Final?</strong></summary><p>MetLife Stadium in East Rutherford, New Jersey. 82,500 seats. July 19, 2026.</p></details>
`,
    faq([
      ['How many stadiums host the 2026 FIFA World Cup?', '16 stadiums across 3 countries: 11 in the USA, 2 in Canada (Toronto, Vancouver), and 3 in Mexico (Mexico City, Guadalajara, Monterrey).'],
      ['What is the largest 2026 World Cup stadium?', 'Estadio Azteca in Mexico City, with ~87,000 capacity. It is the first stadium ever to host 3 World Cups (1970, 1986, 2026).'],
      ['What is the newest 2026 World Cup stadium?', 'SoFi Stadium in Los Angeles, opened in September 2020. At $5.5 billion to build, it is the most expensive stadium ever built.'],
      ['What stadium hosts the 2026 World Cup Final?', 'MetLife Stadium in East Rutherford, New Jersey. 82,500 seats. The Final is on July 19, 2026.'],
    ]),
    `[{"@type":"ListItem","position":1,"name":"Home","item":"https://statedoku.com/"},{"@type":"ListItem","position":2,"name":"Learn","item":"https://statedoku.com/learn/"},{"@type":"ListItem","position":3,"name":"All WC 2026 stadiums","item":"https://statedoku.com/learn/world-cup-2026-stadiums-complete/"}]`,
    '/learn/', 'Learn', wcRelatedEN, hreflangEN('world-cup-2026-stadiums-complete'), footerEN, 'en_US'
  )
]);

// ═════════════════════════════════════════════════════════════════════════
// ES — HUB + 8 articles
// ═════════════════════════════════════════════════════════════════════════

// ES HUB
out.push(['es/learn/mundial-2026-eeuu',
  wrap('es', 'mundial-2026-eeuu',
    'Mundial 2026 EE.UU. — las 11 ciudades sede + la final (2026) | Statedoku',
    'Las 11 ciudades sede del Mundial 2026 en EE.UU.: Atlanta, Boston, Dallas, Houston, Kansas City, Los Ángeles, Miami, Nueva York/NJ (final), Filadelfia, San Francisco Bay, Seattle.',
    'mundial 2026 eeuu, copa mundial 2026 estados unidos, ciudades sede mundial 2026, sedes mundial 2026 usa, fifa world cup 2026 ciudades',
    'Mundial 2026 — las 11 ciudades sede en EE.UU.',
    `Atlanta, Boston, Dallas, Houston, Kansas City, LA, Miami, NY/NJ, Filadelfia, SF Bay, Seattle. La final en MetLife Stadium, Nueva Jersey.`,
    `    <p>El <strong>Mundial 2026 de FIFA</strong> será co-organizado por <strong>tres países: EE.UU., Canadá y México</strong> — el primer Mundial co-organizado por tres naciones y el primero con <strong>48 selecciones</strong>. Comienza el <strong>11 de junio de 2026</strong> en el <strong>Estadio Azteca</strong> y termina con la <strong>final el 19 de julio de 2026</strong> en el <strong>MetLife Stadium, Nueva Jersey</strong>.</p>

    <div class="wc-quick">
      <dl>
        <dt>Total selecciones</dt><dd>48 (antes 32 en Qatar 2022)</dd>
        <dt>Total partidos</dt><dd>104 partidos en 39 días</dd>
        <dt>Países sede</dt><dd>🇺🇸 EE.UU. · 🇨🇦 Canadá · 🇲🇽 México</dd>
        <dt>Ciudades sede en EE.UU.</dt><dd>11 ciudades en 9 estados</dd>
        <dt>Partido inaugural</dt><dd>11 jun 2026 — Estadio Azteca, CDMX</dd>
        <dt>Final</dt><dd>19 jul 2026 — MetLife Stadium, Nueva Jersey</dd>
      </dl>
    </div>

    <h2>Las 11 ciudades sede en EE.UU.</h2>
    <p>78 de los 104 partidos del Mundial se jugarán en EE.UU. Cada ciudad sede albergará entre 6 y 9 partidos.</p>

    <table class="lt">
      <thead><tr><th>Ciudad</th><th>Estado</th><th>Estadio</th><th>Partidos</th></tr></thead>
      <tbody>
${HOST_CITIES.map(c => `        <tr><td><strong>${c.city}</strong></td><td>${c.stateLong}</td><td>${c.stadium}</td><td>${c.matches}</td></tr>`).join('\n')}
      </tbody>
    </table>

    <h2>Los 9 estados que albergan partidos</h2>
    <ul>
      <li><strong>California (CA)</strong> — Los Ángeles + San Francisco Bay (2 ciudades)</li>
      <li><strong>Texas (TX)</strong> — Dallas + Houston (2 ciudades)</li>
      <li><strong>Georgia (GA)</strong> — Atlanta</li>
      <li><strong>Massachusetts (MA)</strong> — Boston</li>
      <li><strong>Misuri (MO)</strong> — Kansas City</li>
      <li><strong>Florida (FL)</strong> — Miami</li>
      <li><strong>Nueva Jersey (NJ)</strong> — Nueva York / NJ (FINAL)</li>
      <li><strong>Pensilvania (PA)</strong> — Filadelfia</li>
      <li><strong>Washington (WA)</strong> — Seattle</li>
    </ul>

    <h2>Sedes en México y Canadá</h2>
    <p><strong>México:</strong> Estadio Azteca (Ciudad de México) — alberga el partido inaugural, Estadio Akron (Guadalajara), Estadio BBVA (Monterrey).</p>
    <p><strong>Canadá:</strong> BMO Field (Toronto) y BC Place (Vancouver).</p>

    <h2>¿Dónde es la final?</h2>
    <p>La <a href="/es/learn/mundial-2026-final-metlife/">final del Mundial 2026</a> será en el <strong>MetLife Stadium</strong> en East Rutherford, Nueva Jersey — a 8 km de Manhattan. Capacidad: 82,500. El estadio más grande del Mundial.</p>

    <h2>Equipos clasificados</h2>
    <p>Como anfitriones, EE.UU., México y Canadá están clasificados automáticamente. El proceso de clasificación tradicional sigue para las otras 45 plazas.</p>
    <ul>
      <li><a href="/es/learn/mexico-mundial-2026/">México</a> — selección anfitriona</li>
      <li><a href="/es/learn/argentina-mundial-2026/">Argentina</a> — campeona 2022</li>
      <li><a href="/es/learn/espana-mundial-2026/">España</a> — campeona 2010</li>
      <li><a href="/es/learn/colombia-mundial-2026/">Colombia</a> — finalista Copa América 2024</li>
    </ul>

    <div class="cta-card">
      <h3>Aprende los estados sede jugando</h3>
      <p>El puzzle diario de Statedoku usa "Sede del Mundial 2026" como pista. Aprendes los 9 estados sede en una semana.</p>
      <a href="/es/">Jugar el puzzle de hoy →</a>
    </div>

    <h2>Preguntas frecuentes</h2>
    <details><summary><strong>¿Dónde se juega el Mundial 2026?</strong></summary><p>El Mundial 2026 es co-organizado por EE.UU., Canadá y México. 11 ciudades en EE.UU., 2 en Canadá (Toronto, Vancouver) y 3 en México (CDMX, Guadalajara, Monterrey).</p></details>
    <details><summary><strong>¿Cuándo empieza el Mundial 2026?</strong></summary><p>El 11 de junio de 2026 con el partido inaugural en el Estadio Azteca, Ciudad de México.</p></details>
    <details><summary><strong>¿Dónde es la final del Mundial 2026?</strong></summary><p>El 19 de julio de 2026 en el MetLife Stadium, East Rutherford, Nueva Jersey (área de NYC).</p></details>
    <details><summary><strong>¿Qué ciudad de EE.UU. tendrá más partidos?</strong></summary><p>Dallas (AT&T Stadium) — 9 partidos. Le siguen Atlanta y Los Ángeles con 8 cada uno.</p></details>
    <details><summary><strong>¿Cuántos estados albergan partidos?</strong></summary><p>9 estados de EE.UU.: California (LA + SF Bay), Texas (Dallas + Houston), Georgia, Massachusetts, Misuri, Florida, Nueva Jersey, Pensilvania, Washington.</p></details>
`,
    faq([
      ['¿Dónde se juega el Mundial 2026?', 'El Mundial 2026 es co-organizado por Estados Unidos, Canadá y México. 11 ciudades en EE.UU., 2 en Canadá y 3 en México albergan los 104 partidos.'],
      ['¿Cuándo empieza el Mundial 2026?', 'El 11 de junio de 2026 con el partido inaugural en el Estadio Azteca, Ciudad de México.'],
      ['¿Dónde es la final del Mundial 2026?', 'El 19 de julio de 2026 en el MetLife Stadium en East Rutherford, Nueva Jersey, área metropolitana de Nueva York.'],
      ['¿Cuántas selecciones participan en el Mundial 2026?', '48 selecciones, frente a las 32 del Mundial de Qatar 2022. Es el primer Mundial con este formato ampliado.'],
    ]),
    `[{"@type":"ListItem","position":1,"name":"Inicio","item":"https://statedoku.com/es/"},{"@type":"ListItem","position":2,"name":"Aprender","item":"https://statedoku.com/es/learn/"},{"@type":"ListItem","position":3,"name":"Mundial 2026 EE.UU.","item":"https://statedoku.com/es/learn/mundial-2026-eeuu/"}]`,
    '/es/learn/', 'Aprender', wcRelatedES, hreflangES('mundial-2026-eeuu'), footerES, 'es_ES'
  )
]);

// ES — Final
out.push(['es/learn/mundial-2026-final-metlife',
  wrap('es', 'mundial-2026-final-metlife',
    'La final del Mundial 2026 — MetLife Stadium, Nueva Jersey | Statedoku',
    'La final del Mundial 2026 será en el MetLife Stadium, East Rutherford, Nueva Jersey, el 19 de julio de 2026. Capacidad 82,500. Todo sobre la sede de la final.',
    'final mundial 2026, metlife stadium final mundial, donde es la final del mundial 2026, final fifa 2026 nueva jersey',
    'La final del Mundial 2026 — MetLife Stadium',
    'El 19 de julio de 2026, en Nueva Jersey. 82,500 espectadores. Lo que tienes que saber.',
    `    <p>La <strong>final del Mundial 2026 FIFA</strong> se jugará en el <strong>MetLife Stadium</strong> en East Rutherford, <strong>Nueva Jersey</strong>, el <strong>19 de julio de 2026</strong>. Con 82,500 asientos, es la sede más grande de todo el torneo.</p>

    <div class="wc-quick">
      <dl>
        <dt>Estadio</dt><dd>MetLife Stadium</dd>
        <dt>Ciudad</dt><dd>East Rutherford, Nueva Jersey</dd>
        <dt>Capacidad</dt><dd>82,500 asientos</dd>
        <dt>Inaugurado</dt><dd>2010</dd>
        <dt>Equipos NFL</dt><dd>New York Giants + New York Jets</dd>
        <dt>Fecha de la final</dt><dd>19 de julio de 2026</dd>
      </dl>
    </div>

    <h2>¿Dónde está exactamente el MetLife Stadium?</h2>
    <p>El MetLife está en <strong>East Rutherford, Nueva Jersey</strong> — aproximadamente <strong>8 km al oeste de Manhattan</strong>, cruzando el río Hudson. Es parte del complejo Meadowlands Sports Complex. Aunque se promueve como "Nueva York / Nueva Jersey", físicamente está en Nueva Jersey, no en Nueva York.</p>

    <h2>Cómo llegar al MetLife desde NYC</h2>
    <ul>
      <li><strong>Tren NJ Transit:</strong> directo desde Penn Station (NYC) hasta Meadowlands. ~15 minutos, $5.25.</li>
      <li><strong>Autobús:</strong> desde Port Authority — lento los días de partido.</li>
      <li><strong>Coche:</strong> 11 km vía el Lincoln Tunnel. Mucho tráfico los días de partido.</li>
      <li><strong>Uber/Lyft:</strong> espera tarifas elevadas el día de la final.</li>
    </ul>

    <h2>Otros partidos del MetLife (además de la final)</h2>
    <p>El MetLife alberga <strong>8 partidos totales</strong>, incluyendo:</p>
    <ul>
      <li>Fase de grupos (varios)</li>
      <li>Octavos de final</li>
      <li>Cuartos de final</li>
      <li>Semifinal</li>
      <li><strong>La FINAL — 19 de julio de 2026</strong></li>
    </ul>

    <h2>¿Hubo otras finales del Mundial en EE.UU.?</h2>
    <p>Solo una vez: en <strong>1994 en el Rose Bowl</strong> de Pasadena, California. Brasil ganó a Italia en penales (3-2 en penales tras 0-0). La final del Mundial Femenino de 1999 también fue en el Rose Bowl (EE.UU. ganó a China en penales — la famosa celebración de Brandi Chastain).</p>

    <h2>Boletos para la final</h2>
    <p>Vendidos via FIFA.com/tickets. Rango de precio oficial: $1,000–$4,000+. Mercado secundario: $5,000–$30,000+ según las selecciones que clasifiquen. Paquetes hospitalidad desde $15,000.</p>

    <div class="cta-card">
      <h3>Aprende los estados de EE.UU. jugando</h3>
      <p>La final del Mundial 2026 es en <a href="/es/states/new-jersey/" style="color:#fff;text-decoration:underline">Nueva Jersey</a> — Statedoku te enseña los 50 estados un partido al día.</p>
      <a href="/es/">Jugar el puzzle de hoy →</a>
    </div>

    <h2>Preguntas frecuentes</h2>
    <details><summary><strong>¿Dónde es la final del Mundial 2026?</strong></summary><p>En el MetLife Stadium, East Rutherford, Nueva Jersey, el 19 de julio de 2026.</p></details>
    <details><summary><strong>¿El MetLife está en Nueva York o Nueva Jersey?</strong></summary><p>En Nueva Jersey, específicamente en East Rutherford. A 8 km al oeste de Manhattan. La marca "Nueva York" es por su proximidad a NYC.</p></details>
    <details><summary><strong>¿Cuál es la capacidad para la final?</strong></summary><p>82,500 asientos — la sede más grande de EE.UU. en el Mundial.</p></details>
    <details><summary><strong>¿Cuándo fue la última final del Mundial en EE.UU.?</strong></summary><p>1994 en el Rose Bowl, Pasadena, California. Brasil ganó a Italia en penales.</p></details>
    <details><summary><strong>¿Cuánto cuestan los boletos para la final?</strong></summary><p>Oficiales: $1,000–$4,000+. Mercado secundario: hasta $30,000 según las selecciones clasificadas.</p></details>
`,
    faq([
      ['¿Dónde es la final del Mundial 2026?', 'En el MetLife Stadium en East Rutherford, Nueva Jersey, el 19 de julio de 2026.'],
      ['¿El MetLife Stadium está en Nueva York o Nueva Jersey?', 'En Nueva Jersey, en East Rutherford — aproximadamente 8 km al oeste de Manhattan. Se promueve como "Nueva York" por la proximidad a NYC.'],
      ['¿Cuál es la capacidad del MetLife Stadium?', '82,500 asientos. Es la sede más grande del Mundial 2026.'],
      ['¿Cuándo fue la última final del Mundial jugada en EE.UU.?', '1994 en el Rose Bowl en Pasadena, California. Brasil ganó a Italia en penales (3-2).'],
    ]),
    `[{"@type":"ListItem","position":1,"name":"Inicio","item":"https://statedoku.com/es/"},{"@type":"ListItem","position":2,"name":"Aprender","item":"https://statedoku.com/es/learn/"},{"@type":"ListItem","position":3,"name":"Final Mundial 2026","item":"https://statedoku.com/es/learn/mundial-2026-final-metlife/"}]`,
    '/es/learn/', 'Aprender', wcRelatedES, hreflangES('mundial-2026-final-metlife'), footerES, 'es_ES'
  )
]);

// ES — Stadiums all
out.push(['es/learn/mundial-2026-estadios',
  wrap('es', 'mundial-2026-estadios',
    'Los 16 estadios del Mundial 2026 — lista completa | Statedoku',
    'Los 16 estadios del Mundial 2026 FIFA: 11 en EE.UU. (MetLife, SoFi, AT&T...), 2 en Canadá (BMO Field, BC Place), 3 en México (Azteca, Akron, BBVA). Capacidades y datos.',
    'estadios mundial 2026, estadios fifa 2026, lista estadios mundial 2026, estadio azteca mundial 2026, metlife sofi at&t',
    'Los 16 estadios del Mundial 2026',
    '11 en EE.UU., 2 en Canadá, 3 en México. La lista completa con capacidades y datos.',
    `    <p>El <strong>Mundial 2026 FIFA</strong> se jugará en <strong>16 estadios distribuidos en 3 países</strong>: 11 en EE.UU., 2 en Canadá y 3 en México.</p>

    <h2>🇺🇸 Los 11 estadios de EE.UU.</h2>
    <table class="lt">
      <thead><tr><th>Estadio</th><th>Ciudad</th><th>Estado</th><th>Capacidad</th><th>Partidos</th></tr></thead>
      <tbody>
${HOST_CITIES.map(c => `        <tr><td><strong>${c.stadium}</strong></td><td>${c.city}</td><td>${c.state}</td><td>${c.capacity.toLocaleString()}</td><td>${c.matches}</td></tr>`).join('\n')}
      </tbody>
    </table>

    <h2>🇨🇦 Los 2 estadios de Canadá</h2>
    <ul>
      <li><strong>BMO Field</strong> (Toronto, Ontario) — capacidad expandida ~45,500 para el Mundial.</li>
      <li><strong>BC Place</strong> (Vancouver, Columbia Británica) — ~54,500.</li>
    </ul>

    <h2>🇲🇽 Los 3 estadios de México</h2>
    <ul>
      <li><strong>Estadio Azteca</strong> (CDMX) — ~87,000. Sede del partido inaugural. Primer estadio del mundo en albergar 3 Mundiales (1970, 1986, 2026).</li>
      <li><strong>Estadio Akron</strong> (Guadalajara) — ~46,000. Casa del Chivas.</li>
      <li><strong>Estadio BBVA</strong> (Monterrey) — ~51,000. Casa de los Rayados.</li>
    </ul>

    <h2>El más grande del Mundial</h2>
    <p>El <strong>Estadio Azteca</strong> en CDMX con ~87,000 asientos es el más grande de todos. Es además el primer estadio del mundo en organizar 3 Mundiales (1970, 1986, 2026). Sede del histórico "Gol del Siglo" de Maradona en 1986.</p>

    <h2>El más nuevo</h2>
    <p><strong>SoFi Stadium</strong> en Los Ángeles (inaugurado septiembre 2020). Costo: <strong>$5,500 millones</strong> — el estadio más caro jamás construido.</p>

    <h2>El más antiguo</h2>
    <p><strong>Estadio Azteca</strong>, inaugurado en 1966. Histórico para fútbol mexicano y mundial. Casa del América, escenario del "Juego del Siglo" 1970 y "Mano de Dios" + "Gol del Siglo" 1986.</p>

    <div class="cta-card">
      <h3>Aprende los estados sede jugando</h3>
      <p>Statedoku usa "Sede del Mundial 2026" como pista en el puzzle diario.</p>
      <a href="/es/">Jugar el puzzle de hoy →</a>
    </div>

    <h2>Preguntas frecuentes</h2>
    <details><summary><strong>¿Cuántos estadios albergarán el Mundial 2026?</strong></summary><p>16 estadios en 3 países: 11 en EE.UU., 2 en Canadá y 3 en México.</p></details>
    <details><summary><strong>¿Cuál es el estadio más grande del Mundial 2026?</strong></summary><p>El Estadio Azteca en CDMX, con ~87,000 capacidad. Es el primer estadio del mundo en organizar 3 Mundiales.</p></details>
    <details><summary><strong>¿Qué estadios mexicanos tienen partidos?</strong></summary><p>Estadio Azteca (CDMX), Estadio Akron (Guadalajara), Estadio BBVA (Monterrey).</p></details>
    <details><summary><strong>¿Cuál es el estadio más nuevo?</strong></summary><p>SoFi Stadium en Los Ángeles, inaugurado en 2020. Costó $5,500 millones — el más caro jamás construido.</p></details>
`,
    faq([
      ['¿Cuántos estadios albergarán el Mundial 2026?', '16 estadios en 3 países: 11 en Estados Unidos, 2 en Canadá (Toronto y Vancouver) y 3 en México (CDMX, Guadalajara, Monterrey).'],
      ['¿Cuál es el estadio más grande del Mundial 2026?', 'El Estadio Azteca en la Ciudad de México, con capacidad para ~87,000 espectadores. Es el primer estadio del mundo en organizar 3 Mundiales.'],
      ['¿Qué estadios mexicanos tienen partidos?', 'Estadio Azteca (CDMX) que alberga el partido inaugural, Estadio Akron (Guadalajara) y Estadio BBVA (Monterrey).'],
      ['¿Cuál es el estadio más nuevo del Mundial 2026?', 'SoFi Stadium en Los Ángeles, inaugurado en septiembre de 2020. Costó $5,500 millones — el estadio más caro jamás construido.'],
    ]),
    `[{"@type":"ListItem","position":1,"name":"Inicio","item":"https://statedoku.com/es/"},{"@type":"ListItem","position":2,"name":"Aprender","item":"https://statedoku.com/es/learn/"},{"@type":"ListItem","position":3,"name":"Estadios Mundial 2026","item":"https://statedoku.com/es/learn/mundial-2026-estadios/"}]`,
    '/es/learn/', 'Aprender', wcRelatedES, hreflangES('mundial-2026-estadios'), footerES, 'es_ES'
  )
]);

// ES — Mexico
out.push(['es/learn/mexico-mundial-2026',
  wrap('es', 'mexico-mundial-2026',
    'México en el Mundial 2026 — sedes, partidos, calendario | Statedoku',
    'México es anfitrión del Mundial 2026 con 3 sedes: Estadio Azteca (CDMX), Akron (Guadalajara), BBVA (Monterrey). La selección mexicana clasifica automáticamente. Calendario y datos.',
    'mexico mundial 2026, seleccion mexicana mundial 2026, estadios mexico mundial 2026, mexico fifa 2026',
    'México en el Mundial 2026',
    'Anfitrión + 3 sedes + clasificación automática. Todo lo que el aficionado mexicano necesita saber.',
    `    <p>México es <strong>anfitrión del Mundial 2026</strong> junto con EE.UU. y Canadá. Como sede, la selección mexicana está <strong>clasificada automáticamente</strong>. Tres ciudades mexicanas albergan partidos.</p>

    <div class="wc-quick">
      <dl>
        <dt>Ciudades sede</dt><dd>3 — Ciudad de México, Guadalajara, Monterrey</dd>
        <dt>Estadios</dt><dd>Azteca, Akron, BBVA</dd>
        <dt>Total partidos en México</dt><dd>13</dd>
        <dt>Partido inaugural</dt><dd>11 jun 2026 en Estadio Azteca</dd>
        <dt>Selección México</dt><dd>Clasificada automáticamente como sede</dd>
      </dl>
    </div>

    <h2>Las 3 sedes mexicanas</h2>

    <h3>Estadio Azteca (Ciudad de México)</h3>
    <p>Capacidad ~87,000. Sede del <strong>partido inaugural</strong> el 11 de junio de 2026. <strong>Primer estadio del mundo en organizar 3 Mundiales</strong> (1970, 1986, 2026). Escenario del "Juego del Siglo" México-Italia 1970, la "Mano de Dios" y el "Gol del Siglo" de Maradona en 1986.</p>

    <h3>Estadio Akron (Guadalajara)</h3>
    <p>Capacidad ~46,000. Casa del Chivas de Guadalajara. Inaugurado en 2010. Diseño con forma de volcán.</p>

    <h3>Estadio BBVA (Monterrey)</h3>
    <p>Capacidad ~51,000. Casa de los Rayados (Monterrey FC). Inaugurado en 2015. Cuenta con el "Cerro de la Silla" como telón de fondo.</p>

    <h2>México en su Mundial</h2>
    <p>México ha organizado el Mundial dos veces antes: en <strong>1970</strong> y <strong>1986</strong>. Es el primer país en organizar el Mundial 3 veces. La selección llegó a cuartos de final ambas veces. La maldición del "quinto partido" (5e ronde = quartos) sigue vigente — México nunca ha pasado de cuartos como local ni en ningún Mundial.</p>

    <h2>Cómo ver partidos en México</h2>
    <ul>
      <li><strong>Boletos:</strong> FIFA.com/tickets. Vente por fases.</li>
      <li><strong>Vuelos a CDMX:</strong> desde toda Latinoamérica via Aeroméxico, Volaris, VivaAerobús.</li>
      <li><strong>Vuelos a Guadalajara y Monterrey:</strong> aeropuertos internacionales accesibles desde EE.UU. y Sudamérica.</li>
      <li><strong>Visado:</strong> los ciudadanos de la UE, EE.UU., Canadá y la mayoría de países sudamericanos no necesitan visa para estancias turísticas en México.</li>
    </ul>

    <h2>Latinoamericanos viajando a EE.UU. para el Mundial</h2>
    <p>Para los partidos en EE.UU., se requiere visa B1/B2 (turismo) o ESTA en el caso de programas Visa Waiver. <strong>México no participa</strong> en el Visa Waiver — los mexicanos necesitan visa B1/B2 que tarda 6-18 meses en algunas ciudades. Aplicar con MUCHA anticipación.</p>

    <div class="cta-card">
      <h3>Aprende los 50 estados de EE.UU. jugando</h3>
      <p>Si vas a EE.UU. para el Mundial, aprende los estados con Statedoku. Cinco minutos al día.</p>
      <a href="/es/">Jugar el puzzle de hoy →</a>
    </div>

    <h2>Preguntas frecuentes</h2>
    <details><summary><strong>¿Cuántas ciudades mexicanas son sede del Mundial 2026?</strong></summary><p>3: Ciudad de México (Estadio Azteca), Guadalajara (Estadio Akron) y Monterrey (Estadio BBVA).</p></details>
    <details><summary><strong>¿Cuántas veces ha organizado México el Mundial?</strong></summary><p>3 veces: 1970, 1986 y 2026. Es el primer país en organizar el Mundial 3 veces.</p></details>
    <details><summary><strong>¿México está clasificado automáticamente?</strong></summary><p>Sí, como sede está clasificado automáticamente al Mundial 2026.</p></details>
    <details><summary><strong>¿Qué estadio alberga el partido inaugural?</strong></summary><p>El Estadio Azteca en Ciudad de México, el 11 de junio de 2026.</p></details>
    <details><summary><strong>¿Necesito visa para viajar a EE.UU. desde México?</strong></summary><p>Sí, los ciudadanos mexicanos necesitan visa B1/B2 para entrar a EE.UU. La tramitación puede tardar 6-18 meses en algunas ciudades — aplicar con anticipación.</p></details>
`,
    faq([
      ['¿Cuántas ciudades mexicanas son sede del Mundial 2026?', 'Tres: Ciudad de México (Estadio Azteca), Guadalajara (Estadio Akron) y Monterrey (Estadio BBVA).'],
      ['¿Cuántas veces ha organizado México el Mundial?', 'Tres veces: 1970, 1986 y 2026. Es el primer país en organizar el Mundial 3 veces en la historia.'],
      ['¿La selección mexicana está clasificada al Mundial 2026?', 'Sí, México está clasificado automáticamente como país anfitrión, junto con EE.UU. y Canadá.'],
      ['¿Qué estadio mexicano alberga el partido inaugural?', 'El Estadio Azteca en Ciudad de México, el 11 de junio de 2026. Es el partido que abre el torneo.'],
    ]),
    `[{"@type":"ListItem","position":1,"name":"Inicio","item":"https://statedoku.com/es/"},{"@type":"ListItem","position":2,"name":"Aprender","item":"https://statedoku.com/es/learn/"},{"@type":"ListItem","position":3,"name":"México Mundial 2026","item":"https://statedoku.com/es/learn/mexico-mundial-2026/"}]`,
    '/es/learn/', 'Aprender', wcRelatedES, hreflangES('mexico-mundial-2026'), footerES, 'es_ES'
  )
]);

// ES — Argentina
out.push(['es/learn/argentina-mundial-2026',
  wrap('es', 'argentina-mundial-2026',
    'Argentina en el Mundial 2026 — defensa del título, sedes en EE.UU. | Statedoku',
    'Argentina defiende su título de Qatar 2022 en el Mundial 2026 (EE.UU., Canadá, México). Calendario, dónde verán los partidos los argentinos en EE.UU.',
    'argentina mundial 2026, seleccion argentina fifa 2026, messi mundial 2026, argentina campeona mundial',
    'Argentina en el Mundial 2026',
    `Defiende el título de Qatar 2022. Lo que se sabe sobre el calendario, sedes, y Messi.`,
    `    <p>Argentina llega al <strong>Mundial 2026</strong> como <strong>campeona vigente</strong> tras su triunfo en Qatar 2022 (3-3 vs Francia, ganó en penales 4-2). El sorteo determinará en qué ciudad de EE.UU., Canadá o México jugará.</p>

    <div class="wc-quick">
      <dl>
        <dt>Estatus</dt><dd>Campeona Mundial 2022 — defiende título</dd>
        <dt>Capitán probable</dt><dd>Lionel Messi (38 años en julio 2026)</dd>
        <dt>Mundiales ganados</dt><dd>3 (1978, 1986, 2022)</dd>
        <dt>Final del Mundial 2026</dt><dd>19 jul 2026 en MetLife Stadium, NJ</dd>
      </dl>
    </div>

    <h2>¿Será el último Mundial de Messi?</h2>
    <p>Lionel Messi tendrá <strong>39 años</strong> al jugarse la final (junio 24, 2026 cumple 39). Si juega, será su <strong>sexto Mundial</strong> — un récord absoluto. Roland Pelé jugó 4. Cristiano Ronaldo también juega su 6º Mundial 2026 (tendrá 41 años).</p>

    <h2>Argentina en EE.UU. y Miami</h2>
    <p><strong>Hard Rock Stadium</strong> en Miami será probablemente la "casa argentina" — está cerca del <strong>Inter Miami CF</strong>, el club de Messi. Una parte importante de la comunidad argentina en EE.UU. vive en Miami, Nueva York, Los Ángeles, Houston.</p>

    <h2>Comunidad argentina en EE.UU. (datos)</h2>
    <ul>
      <li>~285,000 argentinos viven en EE.UU. (Censo 2020)</li>
      <li>Florida concentra la mayor parte (~25%)</li>
      <li>Le siguen California, Nueva York, Texas</li>
      <li>Mucho movimiento desde el Mundial 2022 — Messi en Miami catalizó migración</li>
    </ul>

    <h2>Cómo seguir los partidos desde Argentina</h2>
    <p>Diferencia horaria Buenos Aires vs sedes EE.UU.:</p>
    <ul>
      <li><strong>Buenos Aires vs Nueva York/MetLife:</strong> +1 hora (hora argentina por delante).</li>
      <li><strong>Buenos Aires vs Los Ángeles:</strong> +4 horas.</li>
      <li><strong>Buenos Aires vs Houston/Dallas:</strong> +2 horas.</li>
      <li><strong>Buenos Aires vs CDMX (Estadio Azteca):</strong> +3 horas.</li>
    </ul>
    <p>Partidos de las 15h hora del este = 16h hora de Argentina (perfecto para mirar después del trabajo).</p>

    <h2>Argentinos viajando a EE.UU.</h2>
    <p>Argentina <strong>NO participa</strong> en el Visa Waiver de EE.UU. Necesitas <strong>visa B1/B2</strong> tramitada en el consulado. Tiempo de espera: 6-12 meses en algunos consulados. Aplicar con anticipación.</p>

    <div class="cta-card">
      <h3>Aprende los estados de EE.UU. jugando</h3>
      <p>Si viajas a EE.UU. para apoyar a Argentina, aprende los 50 estados con Statedoku.</p>
      <a href="/es/">Jugar el puzzle de hoy →</a>
    </div>

    <h2>Preguntas frecuentes</h2>
    <details><summary><strong>¿Argentina defiende el título en 2026?</strong></summary><p>Sí, Argentina ganó Qatar 2022 vs Francia y defiende el título como campeona reinante.</p></details>
    <details><summary><strong>¿Jugará Messi el Mundial 2026?</strong></summary><p>Messi tendrá 39 años. No ha confirmado oficialmente, pero todo indica que sí jugará — sería su 6º Mundial, récord absoluto en la historia.</p></details>
    <details><summary><strong>¿Cuántos Mundiales ha ganado Argentina?</strong></summary><p>3: 1978 (Argentina, vs Países Bajos), 1986 (México, vs Alemania Federal — Maradona) y 2022 (Qatar, vs Francia — Messi).</p></details>
    <details><summary><strong>¿En qué ciudad de EE.UU. jugará Argentina?</strong></summary><p>Se sabrá tras el sorteo. Pero Hard Rock Stadium (Miami) es la "casa argentina" probable — cerca del Inter Miami CF de Messi.</p></details>
    <details><summary><strong>¿Necesito visa para viajar a EE.UU. desde Argentina?</strong></summary><p>Sí, los argentinos necesitan visa B1/B2. Tiempo de espera: 6-12 meses. Aplica con MUCHA anticipación.</p></details>
`,
    faq([
      ['¿Argentina defiende el título en el Mundial 2026?', 'Sí, Argentina ganó Qatar 2022 venciendo a Francia 4-2 en penales tras 3-3 en tiempo extra. Defiende el título como campeona vigente.'],
      ['¿Jugará Messi el Mundial 2026?', 'Messi tendrá 39 años en el Mundial 2026. No ha confirmado oficialmente, pero todo indica que sí jugará — sería su sexto Mundial, récord absoluto.'],
      ['¿Cuántos Mundiales ha ganado Argentina?', '3 títulos: 1978, 1986 y 2022. Es la cuarta selección con más títulos mundiales después de Brasil (5), Alemania (4) e Italia (4).'],
      ['¿Necesito visa para ir a Estados Unidos a ver el Mundial?', 'Los argentinos sí necesitan visa B1/B2 para entrar a EE.UU. La espera puede ser de 6-12 meses dependiendo del consulado.'],
    ]),
    `[{"@type":"ListItem","position":1,"name":"Inicio","item":"https://statedoku.com/es/"},{"@type":"ListItem","position":2,"name":"Aprender","item":"https://statedoku.com/es/learn/"},{"@type":"ListItem","position":3,"name":"Argentina Mundial 2026","item":"https://statedoku.com/es/learn/argentina-mundial-2026/"}]`,
    '/es/learn/', 'Aprender', wcRelatedES, hreflangES('argentina-mundial-2026'), footerES, 'es_ES'
  )
]);

// ES — Espana
out.push(['es/learn/espana-mundial-2026',
  wrap('es', 'espana-mundial-2026',
    'España en el Mundial 2026 — la Roja en Norteamérica | Statedoku',
    'España vuelve al Mundial 2026 tras la Eurocopa 2024 ganada en Berlín. Calendario, sedes posibles y la generación de Lamine Yamal, Nico Williams y Rodri.',
    'españa mundial 2026, seleccion española fifa 2026, lamine yamal mundial, la roja mundial 2026',
    'España en el Mundial 2026',
    `Tras ganar la Eurocopa 2024, la Roja llega con una generación dorada. Lo que se sabe.`,
    `    <p>España llega al <strong>Mundial 2026</strong> tras su victoria en la <strong>Eurocopa 2024</strong> (2-1 vs Inglaterra en Berlín). Con Lamine Yamal, Nico Williams, Rodri y compañía, es una de las grandes favoritas del torneo.</p>

    <div class="wc-quick">
      <dl>
        <dt>Estatus</dt><dd>Campeona Eurocopa 2024 — favorita</dd>
        <dt>Mundiales ganados</dt><dd>1 (Sudáfrica 2010, vs Países Bajos)</dd>
        <dt>Estrellas</dt><dd>Lamine Yamal (19), Nico Williams (23), Rodri (29)</dd>
        <dt>Entrenador</dt><dd>Luis de la Fuente</dd>
      </dl>
    </div>

    <h2>Generación dorada</h2>
    <p>España tiene la generación más prometedora desde la del Mundial 2010:</p>
    <ul>
      <li><strong>Lamine Yamal</strong> (19 años en junio 2026) — el "nuevo Messi" del Barcelona.</li>
      <li><strong>Nico Williams</strong> (23) — extremo letal del Athletic Bilbao.</li>
      <li><strong>Rodri</strong> (29) — mediocentro del Manchester City, Balón de Oro 2024.</li>
      <li><strong>Pedri</strong> (23) — visión del Barcelona.</li>
      <li><strong>Gavi</strong> (21) — energía del Barcelona.</li>
      <li><strong>Fabián Ruiz</strong> (30) — PSG.</li>
    </ul>

    <h2>Diferencia horaria España-EE.UU.</h2>
    <ul>
      <li><strong>Madrid vs Nueva York/MetLife:</strong> -6 horas (NYC va atrasado).</li>
      <li><strong>Madrid vs Los Ángeles:</strong> -9 horas.</li>
      <li><strong>Madrid vs Houston/Dallas:</strong> -7 horas.</li>
      <li><strong>Madrid vs CDMX:</strong> -8 horas.</li>
    </ul>
    <p>Partidos de las 15h hora del este = 21h hora española (hora ideal para verlos cenando).</p>

    <h2>Españoles viajando a EE.UU.</h2>
    <p>Los <strong>españoles SÍ participan en el Visa Waiver Program (ESTA)</strong>. Tramitación online, ~$21, aprobación en horas o días. <strong>Mucho más fácil que países latinoamericanos.</strong></p>

    <h2>Comunidad española en EE.UU.</h2>
    <ul>
      <li>~85,000 españoles registrados en EE.UU. (Censo 2020)</li>
      <li>Concentrados en Florida, Nueva York, California, Texas</li>
      <li>Miami tiene la mayor comunidad española en EE.UU. (~30,000)</li>
      <li>Buenos vuelos directos desde Madrid a NYC, Miami, LA, Boston</li>
    </ul>

    <h2>Las 11 ciudades sede en EE.UU.</h2>
    <p>España puede jugar en cualquiera de las <a href="/es/learn/mundial-2026-eeuu/">11 ciudades sede en EE.UU.</a> + 3 en México y 2 en Canadá. Se sabrá tras el sorteo de diciembre 2025.</p>

    <div class="cta-card">
      <h3>Aprende los estados de EE.UU. jugando</h3>
      <p>Si viajas a EE.UU. para apoyar a la Roja, aprende los 50 estados con Statedoku.</p>
      <a href="/es/">Jugar el puzzle de hoy →</a>
    </div>

    <h2>Preguntas frecuentes</h2>
    <details><summary><strong>¿España va al Mundial 2026?</strong></summary><p>Sí, España está clasificada al Mundial 2026 tras ganar la Eurocopa 2024 y completar la clasificación europea.</p></details>
    <details><summary><strong>¿Cuántos Mundiales ha ganado España?</strong></summary><p>1: Sudáfrica 2010, venciendo a Países Bajos 1-0 con gol de Iniesta en la prórroga.</p></details>
    <details><summary><strong>¿Lamine Yamal jugará el Mundial 2026?</strong></summary><p>Sí, Lamine Yamal tendrá 19 años. Es titular indiscutible y una de las grandes estrellas del torneo.</p></details>
    <details><summary><strong>¿Necesito visa para viajar a EE.UU. desde España?</strong></summary><p>No necesitas visa, pero sí ESTA (Electronic System for Travel Authorization). Tramitación online, ~$21, aprobación rápida.</p></details>
`,
    faq([
      ['¿España está clasificada al Mundial 2026?', 'Sí, España completó su clasificación europea tras ganar la Eurocopa 2024. Va al Mundial 2026 como una de las favoritas.'],
      ['¿Cuántos Mundiales ha ganado España?', 'Uno: Sudáfrica 2010, venciendo a Países Bajos 1-0 con gol de Andrés Iniesta en la prórroga.'],
      ['¿Lamine Yamal jugará el Mundial 2026?', 'Sí, Lamine Yamal tendrá 19 años en el Mundial. Es titular indiscutible y una de las grandes estrellas jóvenes del torneo.'],
      ['¿Los españoles necesitan visa para ir a Estados Unidos?', 'No necesitan visa pero sí ESTA (autorización electrónica de viaje). Trámite online en pocos minutos, costo ~$21.'],
    ]),
    `[{"@type":"ListItem","position":1,"name":"Inicio","item":"https://statedoku.com/es/"},{"@type":"ListItem","position":2,"name":"Aprender","item":"https://statedoku.com/es/learn/"},{"@type":"ListItem","position":3,"name":"España Mundial 2026","item":"https://statedoku.com/es/learn/espana-mundial-2026/"}]`,
    '/es/learn/', 'Aprender', wcRelatedES, hreflangES('espana-mundial-2026'), footerES, 'es_ES'
  )
]);

// ES — Colombia
out.push(['es/learn/colombia-mundial-2026',
  wrap('es', 'colombia-mundial-2026',
    'Colombia en el Mundial 2026 — la Tricolor en Norteamérica | Statedoku',
    'Colombia llega al Mundial 2026 tras llegar a la final de Copa América 2024. James, Lerma, Lucho Díaz, Cuadrado: la generación de Néstor Lorenzo. Sedes y viaje a EE.UU.',
    'colombia mundial 2026, seleccion colombiana fifa 2026, james rodriguez mundial, lucho diaz mundial',
    'Colombia en el Mundial 2026',
    `Tras la final de Copa América 2024, la Tricolor tiene una generación que ilusiona. Lo que se sabe.`,
    `    <p>Colombia llega al <strong>Mundial 2026</strong> tras una <strong>final de Copa América 2024</strong> contra Argentina (perdida 1-0 en prórroga). Con James Rodríguez liderando la generación, la Tricolor es una de las grandes ilusiones latinoamericanas.</p>

    <div class="wc-quick">
      <dl>
        <dt>Estatus</dt><dd>Subcampeona Copa América 2024 — clasificada</dd>
        <dt>Mundiales jugados</dt><dd>6 (1962, 1990, 1994, 1998, 2014, 2018)</dd>
        <dt>Mejor resultado</dt><dd>Cuartos de final 2014 (Brasil)</dd>
        <dt>Entrenador</dt><dd>Néstor Lorenzo (argentino)</dd>
      </dl>
    </div>

    <h2>Plantilla principal</h2>
    <ul>
      <li><strong>James Rodríguez</strong> (35 años en 2026) — capitán, top scorer Copa América 2024.</li>
      <li><strong>Luis Díaz "Lucho"</strong> (29) — extremo del Liverpool, gol vital en la Copa América.</li>
      <li><strong>Jhon Lerma</strong> (29) — mediocentro Crystal Palace.</li>
      <li><strong>Daniel Muñoz</strong> (30) — lateral Crystal Palace.</li>
      <li><strong>Davinson Sánchez</strong> (29) — central Galatasaray.</li>
    </ul>

    <h2>Diferencia horaria Colombia-EE.UU.</h2>
    <ul>
      <li><strong>Bogotá vs Nueva York/MetLife:</strong> 0 horas (mismo huso horario en invierno EE.UU.). En verano (DST), Bogotá -1 hora.</li>
      <li><strong>Bogotá vs Los Ángeles:</strong> +3 horas (NY > LA = 3 horas).</li>
      <li><strong>Bogotá vs Miami:</strong> 0 horas. ¡Ideal!</li>
    </ul>
    <p>Partidos a las 15h hora del este de EE.UU. = 15h en Bogotá (mismo). Diferencias mínimas.</p>

    <h2>Colombianos viajando a EE.UU.</h2>
    <p>Colombia <strong>NO participa</strong> en Visa Waiver. Necesitas <strong>visa B1/B2</strong>. <strong>Tiempo de espera en Bogotá: 12-24 meses</strong>. <strong>Aplicar AHORA si quieres ir al Mundial.</strong></p>

    <h2>Comunidad colombiana en EE.UU.</h2>
    <ul>
      <li>~1.4 millones de colombianos en EE.UU. (estimación 2024)</li>
      <li>Mayor comunidad concentrada en Florida (Miami, Orlando, Tampa)</li>
      <li>Le siguen Nueva York/NJ, California, Houston</li>
      <li>Doral (Florida) — apodada "Doralzuela"/"Colombia"</li>
    </ul>

    <div class="cta-card">
      <h3>Aprende los estados de EE.UU. jugando</h3>
      <p>Si viajas a EE.UU. para apoyar a la Tricolor, aprende los 50 estados con Statedoku.</p>
      <a href="/es/">Jugar el puzzle de hoy →</a>
    </div>

    <h2>Preguntas frecuentes</h2>
    <details><summary><strong>¿Colombia está en el Mundial 2026?</strong></summary><p>Sí, Colombia se clasificó al Mundial 2026 vía las eliminatorias sudamericanas.</p></details>
    <details><summary><strong>¿En qué Mundiales ha jugado Colombia?</strong></summary><p>6 Mundiales: 1962, 1990, 1994, 1998, 2014 y 2018. Mejor resultado: cuartos de final en Brasil 2014.</p></details>
    <details><summary><strong>¿James Rodríguez jugará el Mundial 2026?</strong></summary><p>Sí, James tendrá 35 años. Sigue siendo capitán y referente. Probable su 4º y último Mundial.</p></details>
    <details><summary><strong>¿Necesito visa para viajar a EE.UU. desde Colombia?</strong></summary><p>Sí, visa B1/B2. Tiempo de espera: 12-24 meses en Bogotá. Aplica YA si quieres ir al Mundial.</p></details>
`,
    faq([
      ['¿Colombia está clasificada al Mundial 2026?', 'Sí, Colombia se clasificó al Mundial 2026 vía las eliminatorias sudamericanas. Llega tras una final de Copa América 2024 perdida ante Argentina.'],
      ['¿Cuántas veces ha jugado Colombia el Mundial?', '6 ediciones: 1962, 1990, 1994, 1998, 2014 y 2018. El mejor resultado fue cuartos de final en el Mundial Brasil 2014.'],
      ['¿James Rodríguez jugará el Mundial 2026?', 'Sí, James Rodríguez tendrá 35 años. Sigue siendo capitán y figura. Probable su cuarto y último Mundial.'],
      ['¿Los colombianos necesitan visa para Estados Unidos?', 'Sí, necesitan visa B1/B2. El tiempo de espera en el consulado de Bogotá puede ser de 12-24 meses. Importante aplicar con muchísima antelación.'],
    ]),
    `[{"@type":"ListItem","position":1,"name":"Inicio","item":"https://statedoku.com/es/"},{"@type":"ListItem","position":2,"name":"Aprender","item":"https://statedoku.com/es/learn/"},{"@type":"ListItem","position":3,"name":"Colombia Mundial 2026","item":"https://statedoku.com/es/learn/colombia-mundial-2026/"}]`,
    '/es/learn/', 'Aprender', wcRelatedES, hreflangES('colombia-mundial-2026'), footerES, 'es_ES'
  )
]);

// ES — Tickets / viaje
out.push(['es/learn/mundial-2026-boletos-visa',
  wrap('es', 'mundial-2026-boletos-visa',
    'Boletos y visa para el Mundial 2026 — guía para latinoamericanos | Statedoku',
    'Cómo comprar boletos y tramitar visa para el Mundial 2026 en EE.UU. desde México, Argentina, Colombia, España. Plazos críticos, costos, fases de venta.',
    'boletos mundial 2026, visa eeuu mundial 2026, como ir al mundial 2026, fifa tickets 2026, viaje mundial 2026',
    'Mundial 2026 — boletos y visa',
    `Cómo conseguir boletos y la visa de EE.UU. Plazos críticos para no quedarte fuera.`,
    `    <p>Hay dos cosas que necesitas para asistir al Mundial 2026 en EE.UU.: <strong>boletos</strong> y <strong>visa</strong> (si no eres de país con Visa Waiver). Aquí los plazos críticos.</p>

    <h2>Boletos: las 3 fases de venta</h2>
    <h3>Fase 1 (octubre 2025) — agotada</h3>
    <p>Primera ronda de sorteo aleatorio FIFA. Ya cerrada. Si no aplicaste, tuviste que esperar la fase 2.</p>

    <h3>Fase 2 (febrero–marzo 2026)</h3>
    <p>Sorteo segundo. Disponibles las plazas no vendidas en fase 1 + algunas adicionales.</p>

    <h3>Fase 3 (abril–junio 2026)</h3>
    <p>Venta directa (no sorteo) para las plazas que queden. <strong>Hot zone:</strong> última oportunidad oficial. Sin garantías de conseguir entrada.</p>

    <h3>Reventa oficial (todos los meses)</h3>
    <p>FIFA tiene una plataforma de reventa oficial. Precios variables. Reventa NO oficial (Stubhub, Vivid Seats) es legal en EE.UU. pero suele ser más cara.</p>

    <h2>Precios oficiales típicos</h2>
    <ul>
      <li><strong>Fase de grupos:</strong> $60 – $300 USD</li>
      <li><strong>Octavos de final:</strong> $150 – $500</li>
      <li><strong>Cuartos de final:</strong> $300 – $1,000</li>
      <li><strong>Semifinales:</strong> $500 – $2,500</li>
      <li><strong>Final:</strong> $1,000 – $6,000 (oficial) / $5,000 – $30,000+ (reventa)</li>
    </ul>

    <h2>Visa B1/B2 — quién la necesita</h2>
    <h3>NO necesitas visa (solo ESTA online ~$21):</h3>
    <ul>
      <li>España, Francia, Reino Unido y mayoría UE</li>
      <li>Chile (único país sudamericano en Visa Waiver)</li>
      <li>Israel, Japón, Corea del Sur, Australia, Nueva Zelanda</li>
    </ul>

    <h3>SÍ necesitas visa B1/B2:</h3>
    <ul>
      <li>México — espera 6-18 meses</li>
      <li>Argentina — espera 6-12 meses</li>
      <li>Colombia — espera 12-24 meses (¡el más largo!)</li>
      <li>Brasil — espera 8-15 meses</li>
      <li>Perú, Venezuela, Ecuador — esperas similares</li>
    </ul>

    <h2>Cómo aplicar a la visa (paso a paso)</h2>
    <ol>
      <li>Llenar el formulario DS-160 online en travel.state.gov</li>
      <li>Pagar la tasa $185 USD (no reembolsable)</li>
      <li>Agendar la entrevista en el consulado de tu ciudad</li>
      <li>Asistir a la entrevista con documentos: pasaporte, foto, comprobantes de empleo/ingresos, posibles boletos del Mundial</li>
      <li>Esperar el resultado: 1 día a 6 semanas</li>
      <li>Si aprobada, recibes la visa en tu pasaporte por correo</li>
    </ol>

    <h2>Errores comunes a evitar</h2>
    <ul>
      <li><strong>Esperar a tener boletos antes de aplicar a la visa:</strong> error grave. Aplica YA aunque no tengas boletos.</li>
      <li><strong>Comprar boletos en reventa NO oficial:</strong> riesgo de fraude. Solo FIFA Ticket Resale, Stubhub o Vivid Seats verificados.</li>
      <li><strong>Solo planear ir a un partido:</strong> Mejor planear el viaje completo (vuelos, hospedaje, transporte entre ciudades) ANTES de comprar boletos.</li>
    </ul>

    <div class="cta-card">
      <h3>Aprende los estados sede</h3>
      <p>Statedoku usa "Sede del Mundial 2026" como pista en su puzzle diario.</p>
      <a href="/es/">Jugar el puzzle de hoy →</a>
    </div>

    <h2>Preguntas frecuentes</h2>
    <details><summary><strong>¿Cuándo cierra la venta de boletos?</strong></summary><p>Las ventas oficiales continúan hasta que se agoten las plazas. La fase final es abril-junio 2026, pero las mejores entradas se agotan antes.</p></details>
    <details><summary><strong>¿Cuánto cuesta la visa?</strong></summary><p>$185 USD la tasa de aplicación, no reembolsable independientemente del resultado.</p></details>
    <details><summary><strong>¿Tengo que aplicar a la visa por país?</strong></summary><p>Debes aplicar en el consulado del país donde resides. Los tiempos varían enormemente: 1 día en algunos consulados, 24 meses en otros.</p></details>
    <details><summary><strong>¿Puedo cambiar boletos a otra fecha?</strong></summary><p>Solo via la plataforma oficial de reventa FIFA. Pierdes ~10-15% de comisión. Mejor si los boletos están vinculados a tu selección y se hace un cambio antes del sorteo.</p></details>
`,
    faq([
      ['¿Cómo se compran boletos para el Mundial 2026?', 'Solo via FIFA.com/tickets. Hay 3 fases de venta: octubre 2025 (cerrada), febrero-marzo 2026, y abril-junio 2026. También hay reventa oficial todo el año.'],
      ['¿Cuánto cuesta un boleto para el Mundial 2026?', 'Fase de grupos: $60-$300. Octavos: $150-$500. Cuartos: $300-$1,000. Semifinales: $500-$2,500. Final: $1,000-$6,000 oficial.'],
      ['¿Necesito visa para ver el Mundial en Estados Unidos?', 'Depende de tu nacionalidad. España, Chile y la mayoría UE solo necesitan ESTA online. México, Argentina, Colombia, Brasil necesitan visa B1/B2 con espera de 6-24 meses.'],
      ['¿Cuánto tarda en tramitarse la visa B1/B2?', 'Tiempos típicos: México 6-18 meses, Argentina 6-12 meses, Colombia 12-24 meses, Brasil 8-15 meses. Aplica con MUCHA anticipación.'],
    ]),
    `[{"@type":"ListItem","position":1,"name":"Inicio","item":"https://statedoku.com/es/"},{"@type":"ListItem","position":2,"name":"Aprender","item":"https://statedoku.com/es/learn/"},{"@type":"ListItem","position":3,"name":"Boletos y visa Mundial 2026","item":"https://statedoku.com/es/learn/mundial-2026-boletos-visa/"}]`,
    '/es/learn/', 'Aprender', wcRelatedES, hreflangES('mundial-2026-boletos-visa'), footerES, 'es_ES'
  )
]);

// ═════════════════════════════════════════════════════════════════════════
// FR — HUB + 5 articles
// ═════════════════════════════════════════════════════════════════════════

// FR HUB
out.push(['fr/learn/coupe-du-monde-2026-villes-usa',
  wrap('fr', 'coupe-du-monde-2026-villes-usa',
    'Coupe du Monde 2026 USA — les 11 villes hôtes + la finale | Statedoku',
    'Les 11 villes hôtes US de la Coupe du Monde 2026 : Atlanta, Boston, Dallas, Houston, Kansas City, LA, Miami, NY/NJ (finale), Philadelphie, SF Bay, Seattle. Stades + États.',
    'coupe du monde 2026 villes usa, mondial 2026 villes hotes, fifa coupe du monde 2026 etats-unis, finale coupe du monde 2026',
    'Coupe du Monde 2026 — les 11 villes hôtes US',
    `Atlanta, Boston, Dallas, Houston, Kansas City, LA, Miami, NY/NJ, Philadelphie, SF Bay, Seattle. La finale au MetLife Stadium, New Jersey.`,
    `    <p>La <strong>Coupe du Monde 2026</strong> sera co-organisée par <strong>trois pays : USA, Canada et Mexique</strong> — la première Coupe du Monde jamais co-organisée par trois nations et la première avec <strong>48 équipes</strong>. Le tournoi débute le <strong>11 juin 2026</strong> à l'Estadio Azteca à Mexico, et se termine par la <strong>finale le 19 juillet 2026</strong> au <strong>MetLife Stadium, New Jersey</strong>.</p>

    <div class="wc-quick">
      <dl>
        <dt>Équipes totales</dt><dd>48 (contre 32 au Qatar 2022)</dd>
        <dt>Matchs totaux</dt><dd>104 sur 39 jours</dd>
        <dt>Pays hôtes</dt><dd>🇺🇸 USA · 🇨🇦 Canada · 🇲🇽 Mexique</dd>
        <dt>Villes hôtes US</dt><dd>11 villes dans 9 États</dd>
        <dt>Match d'ouverture</dt><dd>11 juin 2026 — Estadio Azteca, Mexico</dd>
        <dt>Finale</dt><dd>19 juillet 2026 — MetLife Stadium, NJ</dd>
      </dl>
    </div>

    <h2>Les 11 villes hôtes US</h2>
    <p>78 des 104 matchs du Mondial seront joués aux USA. Chaque ville hôte américaine accueille entre 6 et 9 matchs.</p>

    <table class="lt">
      <thead><tr><th>Ville</th><th>État</th><th>Stade</th><th>Matchs</th></tr></thead>
      <tbody>
${HOST_CITIES.map(c => `        <tr><td><strong>${c.city}</strong></td><td>${c.stateLong}</td><td>${c.stadium}</td><td>${c.matches}</td></tr>`).join('\n')}
      </tbody>
    </table>

    <h2>Les 9 États américains hôtes</h2>
    <ul>
      <li><strong>Californie (CA)</strong> — Los Angeles + San Francisco Bay (2 villes)</li>
      <li><strong>Texas (TX)</strong> — Dallas + Houston (2 villes)</li>
      <li><strong>Géorgie (GA)</strong> — Atlanta</li>
      <li><strong>Massachusetts (MA)</strong> — Boston</li>
      <li><strong>Missouri (MO)</strong> — Kansas City</li>
      <li><strong>Floride (FL)</strong> — Miami</li>
      <li><strong>New Jersey (NJ)</strong> — New York / NJ (FINALE)</li>
      <li><strong>Pennsylvanie (PA)</strong> — Philadelphie</li>
      <li><strong>Washington (WA)</strong> — Seattle</li>
    </ul>

    <h2>Hôtes au Canada et au Mexique</h2>
    <p><strong>Mexique :</strong> Estadio Azteca (Mexico) — match d'ouverture, Estadio Akron (Guadalajara), Estadio BBVA (Monterrey).</p>
    <p><strong>Canada :</strong> BMO Field (Toronto) et BC Place (Vancouver).</p>

    <h2>Où est la finale ?</h2>
    <p>La <a href="/fr/learn/coupe-du-monde-2026-finale/">finale de la Coupe du Monde 2026</a> sera au <strong>MetLife Stadium</strong> à East Rutherford, New Jersey — à 8 km de Manhattan. Capacité : 82 500. Le plus grand stade du Mondial.</p>

    <h2>Pour les supporters français</h2>
    <p>La France participe en tant que vice-championne du monde 2022. Voir <a href="/fr/learn/france-coupe-du-monde-2026/">La France à la Coupe du Monde 2026</a> pour le calendrier et les conseils voyage.</p>

    <div class="cta-card">
      <h3>Apprenez les États hôtes en jouant</h3>
      <p>Statedoku utilise "Ville hôte de la Coupe du Monde 2026" comme indice dans son puzzle quotidien.</p>
      <a href="/fr/">Jouer le puzzle du jour →</a>
    </div>

    <h2>Questions fréquentes</h2>
    <details><summary><strong>Où se joue la Coupe du Monde 2026 ?</strong></summary><p>La Coupe du Monde 2026 est co-organisée par les USA, le Canada et le Mexique. 11 villes aux USA, 2 au Canada (Toronto, Vancouver) et 3 au Mexique (Mexico, Guadalajara, Monterrey).</p></details>
    <details><summary><strong>Quand commence la Coupe du Monde 2026 ?</strong></summary><p>Le 11 juin 2026 avec le match d'ouverture à l'Estadio Azteca, Mexico City.</p></details>
    <details><summary><strong>Où est la finale de la Coupe du Monde 2026 ?</strong></summary><p>Le 19 juillet 2026 au MetLife Stadium, East Rutherford, New Jersey (région métropolitaine de New York).</p></details>
    <details><summary><strong>Combien d'équipes participent à la Coupe du Monde 2026 ?</strong></summary><p>48 équipes, contre 32 au Qatar 2022. C'est la première Coupe du Monde avec ce format élargi.</p></details>
    <details><summary><strong>Quelle ville US accueille le plus de matchs ?</strong></summary><p>Dallas (AT&T Stadium) — 9 matchs. Atlanta et Los Angeles suivent avec 8 chacune.</p></details>
`,
    faq([
      ['Où se joue la Coupe du Monde 2026 ?', "La Coupe du Monde 2026 est co-organisée par les USA, le Canada et le Mexique. 11 villes aux États-Unis, 2 au Canada et 3 au Mexique accueillent les 104 matchs."],
      ['Quand commence la Coupe du Monde 2026 ?', "Le 11 juin 2026 avec le match d'ouverture à l'Estadio Azteca à Mexico City."],
      ['Où est la finale de la Coupe du Monde 2026 ?', "Le 19 juillet 2026 au MetLife Stadium à East Rutherford, New Jersey, près de New York."],
      ['Quelle ville américaine accueille le plus de matchs ?', "Dallas (AT&T Stadium) avec 9 matchs. Atlanta et Los Angeles suivent avec 8 matchs chacune."],
    ]),
    `[{"@type":"ListItem","position":1,"name":"Accueil","item":"https://statedoku.com/fr/"},{"@type":"ListItem","position":2,"name":"Apprendre","item":"https://statedoku.com/fr/learn/"},{"@type":"ListItem","position":3,"name":"Coupe du Monde 2026 USA","item":"https://statedoku.com/fr/learn/coupe-du-monde-2026-villes-usa/"}]`,
    '/fr/learn/', 'Apprendre', wcRelatedFR, hreflangFR('coupe-du-monde-2026-villes-usa'), footerFR, 'fr_FR'
  )
]);

// FR — Finale
out.push(['fr/learn/coupe-du-monde-2026-finale',
  wrap('fr', 'coupe-du-monde-2026-finale',
    'Finale Coupe du Monde 2026 — MetLife Stadium, New Jersey | Statedoku',
    'La finale de la Coupe du Monde 2026 est au MetLife Stadium à East Rutherford, New Jersey, le 19 juillet 2026. Capacité 82 500. Tout savoir.',
    'finale coupe du monde 2026, metlife stadium finale, ou est la finale mondial 2026, fifa finale 2026',
    'La finale de la Coupe du Monde 2026',
    `Le 19 juillet 2026 au MetLife Stadium, New Jersey. 82 500 places. Ce qu'il faut savoir.`,
    `    <p>La <strong>finale de la Coupe du Monde 2026 FIFA</strong> se jouera au <strong>MetLife Stadium</strong> à East Rutherford, <strong>New Jersey</strong>, le <strong>19 juillet 2026</strong>. Avec 82 500 places, c'est le plus grand stade américain du tournoi — et le seul dédié à une finale.</p>

    <div class="wc-quick">
      <dl>
        <dt>Stade</dt><dd>MetLife Stadium</dd>
        <dt>Ville</dt><dd>East Rutherford, New Jersey</dd>
        <dt>Capacité</dt><dd>82 500 places</dd>
        <dt>Inauguré</dt><dd>2010</dd>
        <dt>Locataires NFL</dt><dd>New York Giants + New York Jets</dd>
        <dt>Date de la finale</dt><dd>19 juillet 2026</dd>
      </dl>
    </div>

    <h2>Où est le MetLife Stadium ?</h2>
    <p>Le MetLife est à <strong>East Rutherford, New Jersey</strong> — environ <strong>8 km à l'ouest de Manhattan</strong>, de l'autre côté du fleuve Hudson. Il fait partie du complexe sportif Meadowlands. Même si on dit "New York / New Jersey", il est physiquement dans le New Jersey, pas à New York.</p>

    <h2>Comment se rendre au MetLife depuis NYC</h2>
    <ul>
      <li><strong>Train NJ Transit :</strong> direct depuis Penn Station (NYC) à Meadowlands. ~15 minutes, 5,25 $.</li>
      <li><strong>Bus :</strong> depuis Port Authority Bus Terminal — lent les jours de match.</li>
      <li><strong>Voiture :</strong> 11 km via le Lincoln Tunnel. Beaucoup d'embouteillages les jours de match.</li>
      <li><strong>Uber/Lyft :</strong> attendez-vous à des tarifs élevés le jour de la finale.</li>
    </ul>

    <h2>Autres matchs du MetLife (en plus de la finale)</h2>
    <p>Le MetLife accueille <strong>8 matchs au total</strong>, dont :</p>
    <ul>
      <li>Plusieurs matchs de phase de groupes</li>
      <li>Huitième de finale</li>
      <li>Quart de finale</li>
      <li>Demi-finale</li>
      <li><strong>La FINALE — 19 juillet 2026</strong></li>
    </ul>

    <h2>La 2e finale du Mondial aux USA</h2>
    <p>C'est seulement la <strong>deuxième finale de Coupe du Monde jouée aux USA</strong>. La première : <strong>1994 au Rose Bowl</strong> de Pasadena, Californie (Brésil bat l'Italie aux tirs au but).</p>

    <h2>Billets</h2>
    <p>Billets vendus via FIFA.com/tickets. Prix officiels : 1 000 $ à 4 000 $+. Revente : 5 000 $ à 30 000 $+ selon les équipes qualifiées. Hospitalité dès 15 000 $.</p>

    <div class="cta-card">
      <h3>Apprenez les 50 États en jouant</h3>
      <p>La finale 2026 est dans <a href="/fr/states/new-jersey/" style="color:#fff;text-decoration:underline">le New Jersey</a> — Statedoku vous apprend les 50 États un match à la fois.</p>
      <a href="/fr/">Jouer le puzzle du jour →</a>
    </div>

    <h2>Questions fréquentes</h2>
    <details><summary><strong>Où est la finale de la Coupe du Monde 2026 ?</strong></summary><p>La finale est au MetLife Stadium à East Rutherford, New Jersey, le 19 juillet 2026.</p></details>
    <details><summary><strong>Le MetLife Stadium est à New York ou au New Jersey ?</strong></summary><p>Au New Jersey, à East Rutherford. À environ 8 km à l'ouest de Manhattan. Le branding "New York" est lié à sa proximité avec NYC.</p></details>
    <details><summary><strong>Quelle est la capacité pour la finale ?</strong></summary><p>82 500 places — la plus grande capacité de toutes les enceintes US du tournoi.</p></details>
    <details><summary><strong>Quand a eu lieu la dernière finale du Mondial aux USA ?</strong></summary><p>En 1994 au Rose Bowl de Pasadena, Californie. Le Brésil a battu l'Italie aux tirs au but (3-2 après 0-0).</p></details>
    <details><summary><strong>Combien coûtent les billets pour la finale ?</strong></summary><p>Officiels : 1 000 $ à 4 000 $+ via FIFA.com. Revente : 5 000 $ à 30 000 $+ selon les équipes qualifiées.</p></details>
`,
    faq([
      ['Où est la finale de la Coupe du Monde 2026 ?', 'La finale de la Coupe du Monde 2026 FIFA se joue au MetLife Stadium à East Rutherford, New Jersey, le 19 juillet 2026.'],
      ['Le MetLife Stadium est-il à New York ou au New Jersey ?', "Au New Jersey, à East Rutherford — environ 8 km à l'ouest de Manhattan. Le branding 'New York' est dû à sa proximité avec NYC."],
      ['Quelle est la capacité du MetLife Stadium ?', "82 500 places. C'est le plus grand stade américain du Mondial 2026."],
      ["Quand a eu lieu la dernière finale du Mondial aux USA ?", "En 1994 au Rose Bowl à Pasadena, Californie. Le Brésil a battu l'Italie aux tirs au but. La finale 2026 sera la seconde aux États-Unis."],
    ]),
    `[{"@type":"ListItem","position":1,"name":"Accueil","item":"https://statedoku.com/fr/"},{"@type":"ListItem","position":2,"name":"Apprendre","item":"https://statedoku.com/fr/learn/"},{"@type":"ListItem","position":3,"name":"Finale Mondial 2026","item":"https://statedoku.com/fr/learn/coupe-du-monde-2026-finale/"}]`,
    '/fr/learn/', 'Apprendre', wcRelatedFR, hreflangFR('coupe-du-monde-2026-finale'), footerFR, 'fr_FR'
  )
]);

// FR — France
out.push(['fr/learn/france-coupe-du-monde-2026',
  wrap('fr', 'france-coupe-du-monde-2026',
    'La France à la Coupe du Monde 2026 — Mbappé, calendrier, voyage USA | Statedoku',
    `L'équipe de France à la Coupe du Monde 2026 aux USA-Canada-Mexique. Mbappé, Dembélé, Tchouaméni. Calendrier, décalage horaire, conseils pour les supporters français.`,
    'france coupe du monde 2026, equipe de france mondial 2026, mbappe coupe du monde 2026, bleus mondial 2026',
    'La France à la Coupe du Monde 2026',
    `Les Bleus de Mbappé. Calendrier, décalage horaire avec les USA, conseils pour les supporters français.`,
    `    <p>L'équipe de France arrive à la <strong>Coupe du Monde 2026</strong> en favorite après deux finales consécutives (vainqueurs 2018, finalistes 2022). Avec Kylian Mbappé et une génération renouvelée, les Bleus sont parmi les favoris pour le titre.</p>

    <div class="wc-quick">
      <dl>
        <dt>Statut</dt><dd>Finaliste 2022 — favorite du Mondial 2026</dd>
        <dt>Titres de Coupe du Monde</dt><dd>2 (1998, 2018)</dd>
        <dt>Capitaine</dt><dd>Kylian Mbappé</dd>
        <dt>Sélectionneur</dt><dd>Didier Deschamps</dd>
      </dl>
    </div>

    <h2>L'effectif probable</h2>
    <ul>
      <li><strong>Kylian Mbappé</strong> (27 ans) — capitaine, joueur du Real Madrid.</li>
      <li><strong>Ousmane Dembélé</strong> (28) — explosif, PSG.</li>
      <li><strong>Aurélien Tchouaméni</strong> (26) — milieu Real Madrid.</li>
      <li><strong>William Saliba</strong> (25) — défenseur central Arsenal.</li>
      <li><strong>Mike Maignan</strong> (30) — gardien titulaire AC Milan.</li>
      <li><strong>Jules Koundé</strong> (27) — latéral droit Barcelone.</li>
    </ul>

    <h2>Calendrier prévisible</h2>
    <p>L'équipe de France jouera 3 matchs de phase de groupes (mi-juin à fin juin 2026), puis idéalement les phases à élimination directe jusqu'à la finale (19 juillet 2026, MetLife Stadium, New Jersey). Le sorter au tirage de décembre 2025 a déterminé le groupe et les villes hôtes.</p>

    <h2>Décalage horaire France-USA</h2>
    <ul>
      <li><strong>Paris vs New York/MetLife :</strong> -6h (NY en retard).</li>
      <li><strong>Paris vs Los Angeles :</strong> -9h.</li>
      <li><strong>Paris vs Houston/Dallas :</strong> -7h.</li>
      <li><strong>Paris vs Mexico (Estadio Azteca) :</strong> -8h.</li>
    </ul>
    <p>Match à 15h heure de l'Est US = 21h heure de Paris (idéal pour regarder à table). Match à 21h heure du Pacifique = 6h heure de Paris (mauvais : matin trop tôt).</p>

    <h2>Pour les supporters français en voyage</h2>

    <h3>Visa USA</h3>
    <p>Les Français bénéficient du <strong>Visa Waiver Program</strong>. Vous n'avez pas besoin de visa, mais d'une <strong>autorisation ESTA</strong> (~21 €). Demande en ligne, approuvée en quelques heures à quelques jours. Valide 2 ans.</p>

    <h3>Vols depuis Paris</h3>
    <ul>
      <li><strong>NYC :</strong> Air France, Delta, La Compagnie — 8h de vol direct.</li>
      <li><strong>LA :</strong> Air France, Norse — 11-12h de vol.</li>
      <li><strong>Miami :</strong> Air France, American — 9-10h.</li>
      <li><strong>Mexico City :</strong> Air France — 12h.</li>
    </ul>

    <h3>Coût approximatif</h3>
    <ul>
      <li>Vol Paris-NYC AR : 600-1 500 € selon dates et anticipation.</li>
      <li>Hôtel à NYC : 200-400 €/nuit pendant le Mondial (prix triplés).</li>
      <li>Repas : 30-60 € par jour minimum.</li>
      <li>Billets de match : 60-300 $ phase de groupes, jusqu'à plusieurs milliers pour la finale.</li>
    </ul>

    <h2>Communauté française aux USA</h2>
    <p>Environ <strong>150 000 Français</strong> vivent aux USA. Les plus grandes communautés : New York, Los Angeles, San Francisco, Miami. Des bars français existent dans la plupart des grandes villes pour suivre les matchs avec d'autres supporters tricolores.</p>

    <div class="cta-card">
      <h3>Apprenez les États avant de partir</h3>
      <p>Si vous suivez les Bleus aux USA, Statedoku vous apprend les 50 États en 5 minutes par jour.</p>
      <a href="/fr/">Jouer le puzzle du jour →</a>
    </div>

    <h2>Questions fréquentes</h2>
    <details><summary><strong>La France est-elle qualifiée pour la Coupe du Monde 2026 ?</strong></summary><p>Oui, la France a terminé la phase qualificative européenne en tête de son groupe.</p></details>
    <details><summary><strong>Combien de Coupes du Monde la France a-t-elle gagnées ?</strong></summary><p>Deux : 1998 (en France, vs Brésil) et 2018 (en Russie, vs Croatie). Plus deux finales perdues (2006 vs Italie, 2022 vs Argentine).</p></details>
    <details><summary><strong>Kylian Mbappé jouera-t-il le Mondial 2026 ?</strong></summary><p>Oui, Mbappé est capitaine de l'équipe de France. Il aura 27 ans pendant le Mondial. Ce sera son troisième Mondial.</p></details>
    <details><summary><strong>Faut-il un visa pour aller aux USA depuis la France ?</strong></summary><p>Pas de visa, mais une autorisation ESTA en ligne. Coût : ~21 €. Approuvée généralement en quelques heures.</p></details>
    <details><summary><strong>Quel est le décalage horaire avec les USA ?</strong></summary><p>Paris vs New York : -6h. Paris vs LA : -9h. Mexico : -8h. Tous décalages valent pour l'heure d'été.</p></details>
`,
    faq([
      ["La France est-elle qualifiée pour la Coupe du Monde 2026 ?", "Oui, l'équipe de France a terminé la phase qualificative européenne en tête de son groupe. Elle arrive comme une des grandes favorites."],
      ["Combien de Coupes du Monde la France a-t-elle gagnées ?", "Deux : 1998 (en France contre le Brésil) et 2018 (en Russie contre la Croatie). Plus les finales perdues de 2006 et 2022."],
      ["Kylian Mbappé jouera-t-il la Coupe du Monde 2026 ?", "Oui, Kylian Mbappé est capitaine de l'équipe de France. Il aura 27 ans au moment du Mondial — sa troisième Coupe du Monde."],
      ["Faut-il un visa pour aller aux USA pour la Coupe du Monde ?", "Pas de visa pour les Français, mais une autorisation ESTA en ligne (~21 €). Approuvée généralement en quelques heures."],
    ]),
    `[{"@type":"ListItem","position":1,"name":"Accueil","item":"https://statedoku.com/fr/"},{"@type":"ListItem","position":2,"name":"Apprendre","item":"https://statedoku.com/fr/learn/"},{"@type":"ListItem","position":3,"name":"France Mondial 2026","item":"https://statedoku.com/fr/learn/france-coupe-du-monde-2026/"}]`,
    '/fr/learn/', 'Apprendre', wcRelatedFR, hreflangFR('france-coupe-du-monde-2026'), footerFR, 'fr_FR'
  )
]);

// FR — All stadiums
out.push(['fr/learn/coupe-du-monde-2026-stades',
  wrap('fr', 'coupe-du-monde-2026-stades',
    'Les 16 stades de la Coupe du Monde 2026 — liste complète | Statedoku',
    'Les 16 stades de la Coupe du Monde 2026 FIFA : 11 aux USA (MetLife, SoFi, AT&T...), 2 au Canada (BMO Field, BC Place), 3 au Mexique (Azteca, Akron, BBVA).',
    'stades coupe du monde 2026, stades mondial 2026, liste stades fifa 2026, estadio azteca metlife sofi',
    'Les 16 stades de la Coupe du Monde 2026',
    '11 aux USA, 2 au Canada, 3 au Mexique. La liste complète avec capacités et données.',
    `    <p>La <strong>Coupe du Monde 2026 FIFA</strong> se joue dans <strong>16 stades répartis sur 3 pays</strong> : 11 aux USA, 2 au Canada, 3 au Mexique.</p>

    <h2>🇺🇸 Les 11 stades américains</h2>
    <table class="lt">
      <thead><tr><th>Stade</th><th>Ville</th><th>État</th><th>Capacité</th><th>Matchs</th></tr></thead>
      <tbody>
${HOST_CITIES.map(c => `        <tr><td><strong>${c.stadium}</strong></td><td>${c.city}</td><td>${c.state}</td><td>${c.capacity.toLocaleString()}</td><td>${c.matches}</td></tr>`).join('\n')}
      </tbody>
    </table>

    <h2>🇨🇦 Les 2 stades canadiens</h2>
    <ul>
      <li><strong>BMO Field</strong> (Toronto, Ontario) — capacité étendue ~45 500 pour le Mondial.</li>
      <li><strong>BC Place</strong> (Vancouver, Colombie-Britannique) — ~54 500.</li>
    </ul>

    <h2>🇲🇽 Les 3 stades mexicains</h2>
    <ul>
      <li><strong>Estadio Azteca</strong> (Mexico) — ~87 000. Accueille le match d'ouverture. Premier stade au monde à accueillir 3 Coupes du Monde (1970, 1986, 2026).</li>
      <li><strong>Estadio Akron</strong> (Guadalajara) — ~46 000. Maison du Chivas (Liga MX).</li>
      <li><strong>Estadio BBVA</strong> (Monterrey) — ~51 000. Maison du Monterrey (Liga MX).</li>
    </ul>

    <h2>Le plus grand stade du tournoi</h2>
    <p><strong>L'Estadio Azteca</strong> à Mexico avec ~87 000 places est le plus grand. C'est aussi le <strong>premier stade au monde à accueillir 3 Coupes du Monde</strong> (1970, 1986, 2026). Site du "Match du Siècle" en 1970, et de la "Main de Dieu" + le "But du Siècle" de Maradona en 1986.</p>

    <h2>Le plus récent</h2>
    <p><strong>SoFi Stadium</strong> à Los Angeles, inauguré en septembre 2020. Coût : <strong>5,5 milliards de dollars</strong> — le stade le plus cher jamais construit. Toit translucide ETFE.</p>

    <h2>Le plus ancien</h2>
    <p><strong>Estadio Azteca</strong>, inauguré en 1966. Mythique pour le football mexicain et mondial.</p>

    <div class="cta-card">
      <h3>Apprenez les États hôtes en jouant</h3>
      <p>Statedoku utilise "Ville hôte de la Coupe du Monde 2026" comme indice dans le puzzle.</p>
      <a href="/fr/">Jouer le puzzle du jour →</a>
    </div>

    <h2>Questions fréquentes</h2>
    <details><summary><strong>Combien de stades pour la Coupe du Monde 2026 ?</strong></summary><p>16 stades répartis sur 3 pays : 11 aux USA, 2 au Canada (Toronto, Vancouver), 3 au Mexique (Mexico, Guadalajara, Monterrey).</p></details>
    <details><summary><strong>Quel est le plus grand stade du Mondial 2026 ?</strong></summary><p>L'Estadio Azteca à Mexico avec ~87 000 places. Premier stade au monde à accueillir 3 Coupes du Monde.</p></details>
    <details><summary><strong>Quel est le plus récent stade ?</strong></summary><p>Le SoFi Stadium à Los Angeles, inauguré en septembre 2020. 5,5 milliards de dollars de coût — stade le plus cher jamais construit.</p></details>
    <details><summary><strong>Quel stade accueille la finale ?</strong></summary><p>Le MetLife Stadium à East Rutherford, New Jersey. 82 500 places. Le 19 juillet 2026.</p></details>
`,
    faq([
      ["Combien de stades pour la Coupe du Monde 2026 ?", "16 stades répartis sur 3 pays : 11 aux États-Unis, 2 au Canada (Toronto et Vancouver) et 3 au Mexique (Mexico, Guadalajara, Monterrey)."],
      ["Quel est le plus grand stade de la Coupe du Monde 2026 ?", "L'Estadio Azteca à Mexico, avec ~87 000 places. C'est le premier stade au monde à accueillir 3 Coupes du Monde (1970, 1986, 2026)."],
      ["Quel est le stade le plus récent ?", "Le SoFi Stadium à Los Angeles, inauguré en septembre 2020. Avec 5,5 milliards de dollars, c'est le stade le plus cher jamais construit au monde."],
      ["Quel stade accueille la finale ?", "Le MetLife Stadium à East Rutherford, New Jersey. 82 500 places. Le 19 juillet 2026."],
    ]),
    `[{"@type":"ListItem","position":1,"name":"Accueil","item":"https://statedoku.com/fr/"},{"@type":"ListItem","position":2,"name":"Apprendre","item":"https://statedoku.com/fr/learn/"},{"@type":"ListItem","position":3,"name":"Stades Mondial 2026","item":"https://statedoku.com/fr/learn/coupe-du-monde-2026-stades/"}]`,
    '/fr/learn/', 'Apprendre', wcRelatedFR, hreflangFR('coupe-du-monde-2026-stades'), footerFR, 'fr_FR'
  )
]);

// FR — Voyage USA
out.push(['fr/learn/coupe-du-monde-2026-voyage-usa',
  wrap('fr', 'coupe-du-monde-2026-voyage-usa',
    'Voyager aux USA pour la Coupe du Monde 2026 — guide pratique | Statedoku',
    'Guide pour voyager aux USA pendant la Coupe du Monde 2026 : ESTA, vols depuis Paris, hôtels, budgets, transports entre les 11 villes hôtes, conseils pratiques.',
    'voyage usa coupe du monde 2026, esta usa mondial, vols usa mondial 2026, budget coupe du monde usa, hotel new york mondial',
    'Voyager aux USA pour la Coupe du Monde 2026',
    `ESTA, vols, hôtels, transports entre villes hôtes. Le guide pratique pour les supporters français.`,
    `    <p>La Coupe du Monde 2026 sera un voyage. Voici tout ce qu'il faut savoir pour se rendre aux USA en tant que supporter français.</p>

    <h2>L'autorisation ESTA (obligatoire)</h2>
    <p>Pas besoin de visa pour les Français, mais une <strong>autorisation ESTA</strong> est obligatoire.</p>
    <ul>
      <li><strong>Site officiel :</strong> esta.cbp.dhs.gov</li>
      <li><strong>Coût :</strong> 21 USD (~21 €)</li>
      <li><strong>Délai :</strong> approbation en quelques heures à quelques jours</li>
      <li><strong>Validité :</strong> 2 ans, autant de voyages que vous voulez (90 jours max par voyage)</li>
      <li><strong>Important :</strong> faites-le AVANT de réserver, pas tous les français sont éligibles (antécédents, voyages dans certains pays au Moyen-Orient peuvent compliquer)</li>
    </ul>
    <p><strong>Attention aux sites pirates</strong> qui facturent 80-150 € pour le même service. Seul esta.cbp.dhs.gov est officiel.</p>

    <h2>Vols depuis Paris</h2>
    <table class="lt">
      <thead><tr><th>Destination</th><th>Compagnies directes</th><th>Durée</th><th>Prix moyen AR</th></tr></thead>
      <tbody>
        <tr><td>New York (JFK/EWR)</td><td>Air France, Delta, La Compagnie</td><td>8h</td><td>600-1 500 €</td></tr>
        <tr><td>Los Angeles (LAX)</td><td>Air France, Norse</td><td>11-12h</td><td>700-1 800 €</td></tr>
        <tr><td>Miami (MIA)</td><td>Air France, American</td><td>9-10h</td><td>650-1 600 €</td></tr>
        <tr><td>Boston (BOS)</td><td>Air France, Delta</td><td>7-8h</td><td>550-1 400 €</td></tr>
        <tr><td>Mexico (MEX)</td><td>Air France</td><td>12h</td><td>800-2 000 €</td></tr>
      </tbody>
    </table>
    <p><em>Prix valables hors période Mondial — attendez-vous à +50-100% pendant le tournoi. Réservez TÔT.</em></p>

    <h2>Hôtels (prévoir budget triplé)</h2>
    <p>Les prix triplent ou quadruplent en zones hôtes pendant le Mondial.</p>
    <ul>
      <li><strong>NYC :</strong> 200-400 €/nuit (vs 100-200 € hors période)</li>
      <li><strong>LA :</strong> 250-500 €/nuit</li>
      <li><strong>Miami :</strong> 250-500 €/nuit</li>
      <li><strong>Houston/Dallas :</strong> 150-300 €/nuit (moins cher)</li>
      <li><strong>Mexico City :</strong> 80-200 €/nuit</li>
    </ul>
    <p><strong>Astuce :</strong> Airbnb ou hôtels en banlieue (avec transport). Booking parle 12-18 mois avant pour les meilleures offres.</p>

    <h2>Transport entre villes hôtes</h2>
    <p>Les distances entre villes hôtes sont énormes — pensez avion :</p>
    <ul>
      <li><strong>NYC → LA :</strong> 6h de vol, 60h en bus</li>
      <li><strong>NYC → Miami :</strong> 3h de vol</li>
      <li><strong>NYC → Boston :</strong> 1h30 de vol ou 4h en train Amtrak</li>
      <li><strong>Dallas → Houston :</strong> 1h de vol ou 3h30 en voiture</li>
      <li><strong>LA → SF Bay :</strong> 1h15 de vol ou 6h en voiture</li>
    </ul>
    <p>Compagnies low-cost intérieures : <strong>Southwest, Spirit, JetBlue, Frontier</strong>. Vols intérieurs souvent 100-300 € AR.</p>

    <h2>Coût total estimé pour 1 supporter (10 jours, 3 matchs)</h2>
    <ul>
      <li>Vol AR Paris : 1 000 €</li>
      <li>Hôtel 10 nuits : 2 500-4 000 €</li>
      <li>Vols intérieurs (2-3) : 400-800 €</li>
      <li>Billets de match (3) : 250-1 200 € (phase groupes) / 1 500-15 000 € (élim. directe)</li>
      <li>Repas, transport local, divers : 700-1 000 €</li>
      <li><strong>TOTAL :</strong> 5 000 - 8 000 € minimum pour la phase de groupes. 10 000+ € pour suivre l'équipe de France jusqu'en finale.</li>
    </ul>

    <h2>Conseils de supporters</h2>
    <ul>
      <li><strong>Achetez 1 billet de match au moins :</strong> sans billet de match, vous n'êtes qu'un touriste. Les billets sont en FIFA.com</li>
      <li><strong>Bars français :</strong> presque chaque grande ville US a des bars français qui diffusent les matchs. Ambiance plus chaleureuse qu'au stade.</li>
      <li><strong>Carte bancaire :</strong> prévenez votre banque française avant le départ. Les frais sans contact USA sont chères — privilégiez Revolut, Wise ou Boursorama.</li>
      <li><strong>SIM US :</strong> achetez une eSIM Airalo (10-30 €/semaine) — plus pratique que les forfaits français en itinérance.</li>
    </ul>

    <div class="cta-card">
      <h3>Apprenez les États avant le voyage</h3>
      <p>Avant de partir, apprenez les 50 États avec Statedoku. 5 minutes par jour.</p>
      <a href="/fr/">Jouer le puzzle du jour →</a>
    </div>

    <h2>Questions fréquentes</h2>
    <details><summary><strong>Faut-il un visa pour aller aux USA pour la Coupe du Monde ?</strong></summary><p>Pas de visa pour les Français — une autorisation ESTA (21 USD, en ligne) suffit. À demander avant l'achat de billets.</p></details>
    <details><summary><strong>Combien coûte un voyage Coupe du Monde aux USA ?</strong></summary><p>Compter au minimum 5 000 € pour 10 jours et 3 matchs de phase de groupes. 10 000+ € pour suivre les Bleus jusqu'en finale.</p></details>
    <details><summary><strong>Comment se déplacer entre les villes hôtes ?</strong></summary><p>Avion intérieur (Southwest, Spirit, JetBlue). NYC-LA = 6h. Compter 100-300 € AR pour les vols domestiques.</p></details>
    <details><summary><strong>Où acheter les billets de match ?</strong></summary><p>Uniquement sur FIFA.com/tickets ou via revente FIFA officielle. Évitez les sites non officiels (risque de fraude).</p></details>
`,
    faq([
      ["Faut-il un visa pour aller à la Coupe du Monde 2026 aux USA ?", "Pas de visa pour les Français, mais une autorisation ESTA (21 USD, en ligne) est obligatoire. À demander avant l'achat des billets de match."],
      ["Combien coûte un voyage Coupe du Monde 2026 ?", "Compter au minimum 5 000 € pour 10 jours et 3 matchs de phase de groupes. Plus de 10 000 € pour suivre les Bleus jusqu'en finale."],
      ["Comment se déplacer entre les villes hôtes US ?", "Avion intérieur via Southwest, Spirit ou JetBlue. New York vers Los Angeles fait 6h de vol. Les vols domestiques coûtent 100-300 € aller-retour."],
      ["Où acheter les billets de match officiels ?", "Uniquement sur FIFA.com/tickets ou via la plateforme de revente FIFA officielle. Évitez les sites non officiels pour éviter les fraudes."],
    ]),
    `[{"@type":"ListItem","position":1,"name":"Accueil","item":"https://statedoku.com/fr/"},{"@type":"ListItem","position":2,"name":"Apprendre","item":"https://statedoku.com/fr/learn/"},{"@type":"ListItem","position":3,"name":"Voyage USA Mondial 2026","item":"https://statedoku.com/fr/learn/coupe-du-monde-2026-voyage-usa/"}]`,
    '/fr/learn/', 'Apprendre', wcRelatedFR, hreflangFR('coupe-du-monde-2026-voyage-usa'), footerFR, 'fr_FR'
  )
]);

// ── WRITE ALL
for (const [rel, html] of out) {
  const dir = path.join(ROOT, rel);
  fs.mkdirSync(dir, { recursive: true });
  fs.writeFileSync(path.join(dir, 'index.html'), html);
  console.log(`✅ /${rel}/`);
}
console.log(`\n${out.length} articles World Cup générés.`);
