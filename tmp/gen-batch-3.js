#!/usr/bin/env node
/**
 * Mini-batch 3 (June 4) — 5 high-ROI articles:
 *   EN: /learn/national-parks-by-state/    (US travel, evergreen, huge volume)
 *   EN: /learn/most-populous-states/        (huge volume, low difficulty)
 *   ES: /es/learn/parques-nacionales-eeuu/  (LATAM travel interest)
 *   ES: /es/learn/estados-mas-poblados/     (high LATAM search volume)
 *   FR: /fr/learn/parcs-nationaux-americains/ (FR tourism)
 */
const fs = require('fs');
const path = require('path');

const ROOT = path.resolve(__dirname, '..');

const sharedStyles = `
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
    details p { margin: 8px 0 0; color: var(--text-2); }`;

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

const relatedEN = `    <div class="related-grid">
      <a href="/learn/">→ Learn the 50 states</a>
      <a href="/learn/state-capitals/">→ All 50 capitals</a>
      <a href="/learn/us-regions/">→ The 4 US regions</a>
      <a href="/learn/largest-states/">→ Largest states by area</a>
      <a href="/learn/state-nicknames-complete/">→ State nicknames</a>
      <a href="/learn/us-cultural-belts/">→ Bible/Rust/Sun Belt</a>
      <a href="/learn/swing-states/">→ Swing states</a>
      <a href="/learn/electoral-college/">→ Electoral college</a>
    </div>`;
const relatedES = `    <div class="related-grid">
      <a href="/es/learn/">→ Aprender los 50 estados</a>
      <a href="/es/learn/capitales-de-estados/">→ Las 50 capitales</a>
      <a href="/es/learn/regiones-de-eeuu/">→ Las 4 regiones de EE.UU.</a>
      <a href="/es/learn/largest-states/">→ Los estados más grandes</a>
      <a href="/es/learn/apodos-de-estados/">→ Apodos estatales</a>
      <a href="/es/learn/cinturones-eeuu/">→ Bible Belt, Rust Belt, Sun Belt</a>
      <a href="/es/learn/montanas-mas-altas-eeuu/">→ Las montañas más altas</a>
      <a href="/es/learn/rios-mas-largos-eeuu/">→ Los ríos más largos</a>
    </div>`;
const relatedFR = `    <div class="related-grid">
      <a href="/fr/learn/">→ Apprendre les 50 états</a>
      <a href="/fr/learn/capitales-des-etats/">→ Les 50 capitales</a>
      <a href="/fr/learn/regions-des-etats-unis/">→ Les 4 régions</a>
      <a href="/fr/learn/largest-states/">→ Les plus grands États</a>
      <a href="/fr/learn/montagnes-des-etats-unis/">→ Les montagnes</a>
      <a href="/fr/learn/fleuves-des-etats-unis/">→ Les fleuves</a>
      <a href="/fr/learn/surnoms-des-etats/">→ Surnoms d'États</a>
      <a href="/fr/learn/drapeaux-des-etats/">→ Drapeaux des États</a>
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
  <style>${sharedStyles}</style>
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
    <h1>${h1}</h1>
    <p class="sub">${sub}</p>
  </section>
  <article class="lt-main">
${body}
    <h2>${lang === 'en' ? 'Related guides' : lang === 'es' ? 'Guías relacionadas' : 'Guides associés'}</h2>
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

// ─────────────────────────────────────────────────────────────────────────
// 1. /learn/national-parks-by-state/ (EN)
// ─────────────────────────────────────────────────────────────────────────
const EN_PARKS_BODY = `    <p>The United States has <strong>63 National Parks</strong> across 30 states, plus several territories. Together they cover more than 84 million acres — Yellowstone alone is bigger than Rhode Island and Delaware combined.</p>

    <h2>States with the most National Parks</h2>
    <table class="lt">
      <thead><tr><th>State</th><th># Parks</th><th>Most famous</th></tr></thead>
      <tbody>
        <tr><td><strong>California</strong></td><td>9</td><td>Yosemite, Sequoia, Joshua Tree, Death Valley, Redwood</td></tr>
        <tr><td><strong>Alaska</strong></td><td>8</td><td>Denali, Glacier Bay, Kenai Fjords, Gates of the Arctic</td></tr>
        <tr><td><strong>Utah</strong></td><td>5</td><td>Zion, Bryce Canyon, Arches, Canyonlands, Capitol Reef</td></tr>
        <tr><td><strong>Colorado</strong></td><td>4</td><td>Rocky Mountain, Mesa Verde, Great Sand Dunes, Black Canyon</td></tr>
        <tr><td><strong>Arizona</strong></td><td>3</td><td>Grand Canyon, Petrified Forest, Saguaro</td></tr>
        <tr><td><strong>Washington</strong></td><td>3</td><td>Olympic, Mount Rainier, North Cascades</td></tr>
        <tr><td><strong>Florida</strong></td><td>3</td><td>Everglades, Biscayne, Dry Tortugas</td></tr>
      </tbody>
    </table>

    <h2>The "must-visit" big 5</h2>

    <h3>Yellowstone (Wyoming, Montana, Idaho)</h3>
    <p>The world's <strong>first national park</strong> (1872). 2.2M acres straddling 3 states. Home of Old Faithful, half the world's geysers, and the largest grizzly + wolf population in the lower 48.</p>

    <h3>Grand Canyon (Arizona)</h3>
    <p>1 mile deep, 277 miles long, up to 18 miles wide. ~6M visitors a year. 6 million years of geological exposure visible in the canyon walls.</p>

    <h3>Yosemite (California)</h3>
    <p>Half Dome, El Capitan, Yosemite Falls (highest waterfall in North America). Birthplace of the conservation movement via John Muir.</p>

    <h3>Zion (Utah)</h3>
    <p>Towering sandstone cliffs in red, pink, cream. Angel's Landing and The Narrows are bucket-list hikes.</p>

    <h3>Glacier (Montana)</h3>
    <p>Going-to-the-Sun Road, 700 lakes, the last refuge of grizzlies in the lower 48 outside Yellowstone.</p>

    <h2>Largest National Parks (by area)</h2>
    <ol>
      <li><strong>Wrangell-St. Elias</strong> (Alaska) — 13.2M acres. Larger than Switzerland.</li>
      <li><strong>Gates of the Arctic</strong> (Alaska) — 8.5M acres.</li>
      <li><strong>Denali</strong> (Alaska) — 6.0M acres.</li>
      <li><strong>Katmai</strong> (Alaska) — 4.1M acres.</li>
      <li><strong>Death Valley</strong> (California/Nevada) — 3.4M acres. Largest park in the lower 48.</li>
    </ol>

    <h2>Smallest National Parks</h2>
    <ul>
      <li><strong>Gateway Arch</strong> (Missouri) — 192 acres. The smallest national park.</li>
      <li><strong>Hot Springs</strong> (Arkansas) — 5,500 acres. Oldest federally protected area (1832).</li>
      <li><strong>Indiana Dunes</strong> (Indiana) — 15,000 acres.</li>
    </ul>

    <h2>The 20 states with NO National Park</h2>
    <p>Alabama, Connecticut, Delaware, Georgia, Iowa, Illinois, Kansas, Louisiana, Maryland, Massachusetts, Mississippi, Nebraska, New Hampshire, New Jersey, New York, Oklahoma, Pennsylvania, Rhode Island, Vermont, Wisconsin.</p>
    <p>(They do have National Monuments, Historic Sites, etc. — just no "National Park" designation.)</p>

    <h2>National Park vs. National Monument vs. State Park</h2>
    <ul>
      <li><strong>National Park</strong> — designated by an Act of Congress. Highest tier. 63 currently.</li>
      <li><strong>National Monument</strong> — designated by Presidential proclamation. ~130 currently.</li>
      <li><strong>National Forest / Grassland / Seashore / Recreation Area</strong> — managed by various federal agencies.</li>
      <li><strong>State Park</strong> — managed by state government, NOT federal.</li>
    </ul>

    <div class="cta-card">
      <h3>Learn states through their parks</h3>
      <p>Statedoku uses "Home to Yellowstone" or "Has a National Park" as constraints in its daily puzzle. Geography by curiosity.</p>
      <a href="/">Play today's puzzle →</a>
    </div>

    <h2>Frequently asked questions</h2>
    <details><summary><strong>How many National Parks are in the US?</strong></summary><p>63 National Parks across 30 states. The 64th — New River Gorge — was added in 2020.</p></details>
    <details><summary><strong>Which state has the most National Parks?</strong></summary><p>California with 9: Yosemite, Sequoia, Kings Canyon, Joshua Tree, Death Valley (shared with Nevada), Lassen Volcanic, Pinnacles, Redwood, Channel Islands.</p></details>
    <details><summary><strong>What was the first National Park?</strong></summary><p>Yellowstone, established in 1872 — the world's first National Park. It predates the Wyoming and Montana statehoods.</p></details>
    <details><summary><strong>What's the most visited National Park?</strong></summary><p>Great Smoky Mountains (Tennessee/North Carolina) with ~13M visitors/year. Grand Canyon is second at ~6M. Free entry helps Smokies stay #1.</p></details>
    <details><summary><strong>Which state has the most acreage in National Parks?</strong></summary><p>Alaska — 8 parks totaling ~33M acres, more than the other 49 states combined.</p></details>
`;

out.push(['learn/national-parks-by-state',
  wrap('en', 'national-parks-by-state',
    'National Parks by state — all 63 US National Parks listed (2026) | Statedoku',
    'All 63 US National Parks listed by state. California has 9, Alaska 8, Utah 5. Find the biggest (Wrangell-St. Elias), smallest (Gateway Arch), oldest (Yellowstone 1872).',
    'national parks by state, us national parks list, yellowstone, yosemite, grand canyon, list of national parks usa',
    'National Parks by state',
    'All 63 US National Parks, by state, with the biggest, smallest, oldest, and most-visited.',
    EN_PARKS_BODY,
    faq([
      ['How many National Parks are in the US?', 'There are 63 National Parks across 30 US states. The most recent addition was New River Gorge in 2020.'],
      ['Which state has the most National Parks?', 'California has 9 National Parks: Yosemite, Sequoia, Kings Canyon, Joshua Tree, Death Valley (shared with Nevada), Lassen Volcanic, Pinnacles, Redwood, and Channel Islands.'],
      ['What is the oldest National Park?', 'Yellowstone, established in 1872. It was the world\'s first National Park and predates the statehoods of Wyoming and Montana.'],
      ['Which is the most-visited National Park?', 'Great Smoky Mountains (Tennessee/North Carolina) with ~13 million visitors per year. Free entry helps it stay the most popular.'],
    ]),
    `[{"@type":"ListItem","position":1,"name":"Home","item":"https://statedoku.com/"},{"@type":"ListItem","position":2,"name":"Learn","item":"https://statedoku.com/learn/"},{"@type":"ListItem","position":3,"name":"National Parks by state","item":"https://statedoku.com/learn/national-parks-by-state/"}]`,
    '/learn/', 'Learn', relatedEN, hreflangEN('national-parks-by-state'), footerEN, 'en_US'
  )
]);

// ─────────────────────────────────────────────────────────────────────────
// 2. /learn/most-populous-states/ (EN)
// ─────────────────────────────────────────────────────────────────────────
const EN_POP_BODY = `    <p>The United States has about <strong>335 million people</strong> across 50 states. But the population is wildly unequal: <strong>California alone has 39 million</strong> — more than the 21 least-populated states <em>combined</em>. Here's the full ranking.</p>

    <h2>Top 10 most populous states (2024)</h2>
    <table class="lt">
      <thead><tr><th>#</th><th>State</th><th>Population</th><th>% of US</th></tr></thead>
      <tbody>
        <tr><td>1</td><td><strong>California</strong></td><td>39.0M</td><td>11.7%</td></tr>
        <tr><td>2</td><td><strong>Texas</strong></td><td>30.5M</td><td>9.1%</td></tr>
        <tr><td>3</td><td><strong>Florida</strong></td><td>22.6M</td><td>6.7%</td></tr>
        <tr><td>4</td><td><strong>New York</strong></td><td>19.6M</td><td>5.8%</td></tr>
        <tr><td>5</td><td>Pennsylvania</td><td>13.0M</td><td>3.9%</td></tr>
        <tr><td>6</td><td>Illinois</td><td>12.5M</td><td>3.7%</td></tr>
        <tr><td>7</td><td>Ohio</td><td>11.8M</td><td>3.5%</td></tr>
        <tr><td>8</td><td>Georgia</td><td>11.0M</td><td>3.3%</td></tr>
        <tr><td>9</td><td>North Carolina</td><td>10.8M</td><td>3.2%</td></tr>
        <tr><td>10</td><td>Michigan</td><td>10.0M</td><td>3.0%</td></tr>
      </tbody>
    </table>
    <p>The top 10 alone account for <strong>~54%</strong> of the entire US population.</p>

    <h2>The "Big 4"</h2>
    <p>California, Texas, Florida, New York make up <strong>33%</strong> of the country's population — and a huge share of <a href="/learn/electoral-college/">electoral college votes</a> (152 of 538 = 28%).</p>

    <h3>California — 39M</h3>
    <p>Most populous state since 1962 (overtook New York). Hispanic plurality (~40%). Los Angeles alone has more people than 22 individual states.</p>

    <h3>Texas — 30.5M</h3>
    <p>Fastest-growing of the Big 4. Added more people than any other state in the last decade. Major cities: Houston, San Antonio, Dallas, Austin, Fort Worth — 5 of America's top 15.</p>

    <h3>Florida — 22.6M</h3>
    <p>The <a href="/learn/us-cultural-belts/">Sun Belt</a> magnet. Overtook New York in 2014. Aging population mixed with strong Cuban/Hispanic Caribbean immigration.</p>

    <h3>New York — 19.6M</h3>
    <p>Lost the #1 spot to California in 1962 and #3 to Florida in 2014. NYC alone has 8.3M — still America's biggest city.</p>

    <h2>10 least populous states</h2>
    <table class="lt">
      <thead><tr><th>#</th><th>State</th><th>Population</th></tr></thead>
      <tbody>
        <tr><td>50</td><td><strong>Wyoming</strong></td><td>580k</td></tr>
        <tr><td>49</td><td>Vermont</td><td>645k</td></tr>
        <tr><td>48</td><td>Alaska</td><td>733k</td></tr>
        <tr><td>47</td><td>North Dakota</td><td>783k</td></tr>
        <tr><td>46</td><td>South Dakota</td><td>910k</td></tr>
        <tr><td>45</td><td>Delaware</td><td>1.0M</td></tr>
        <tr><td>44</td><td>Rhode Island</td><td>1.1M</td></tr>
        <tr><td>43</td><td>Montana</td><td>1.1M</td></tr>
        <tr><td>42</td><td>Maine</td><td>1.4M</td></tr>
        <tr><td>41</td><td>New Hampshire</td><td>1.4M</td></tr>
      </tbody>
    </table>
    <p><strong>Wyoming</strong> has fewer people than the city of Detroit. The 21 least-populated states combined have fewer people than California alone.</p>

    <h2>Population vs. Senate seats</h2>
    <p>Each state gets exactly 2 senators regardless of size. So one Wyoming senator represents 290,000 people; one California senator represents 19.5 million. <strong>67x more</strong>. This is why the Senate is structurally biased toward small rural states.</p>

    <h2>States that lost population recently</h2>
    <ul>
      <li><strong>West Virginia</strong> — only state below 1990 population.</li>
      <li><strong>Illinois</strong> — slow but steady decline since 2014.</li>
      <li><strong>New York, Louisiana, Mississippi</strong> — slight losses post-COVID.</li>
    </ul>

    <h2>Fastest-growing states</h2>
    <p>Texas, Florida, Georgia, Idaho, Utah, Tennessee, South Carolina, Arizona, Nevada — all <a href="/learn/us-cultural-belts/">Sun Belt</a> states. People are migrating <em>away</em> from the Northeast and Midwest, <em>toward</em> the South and West.</p>

    <div class="cta-card">
      <h3>Learn the states by population</h3>
      <p>Statedoku uses "Top 10 populous" or "Under 1M people" as constraints in its daily puzzle.</p>
      <a href="/">Play today's puzzle →</a>
    </div>

    <h2>Frequently asked questions</h2>
    <details><summary><strong>What's the most populous US state?</strong></summary><p>California, with 39 million people — about 11.7% of the entire US population.</p></details>
    <details><summary><strong>What's the least populous US state?</strong></summary><p>Wyoming, with about 580,000 people — fewer than the city of Detroit.</p></details>
    <details><summary><strong>What's the most populous city in America?</strong></summary><p>New York City (8.3M). Followed by Los Angeles (3.9M), Chicago (2.7M), Houston (2.3M), Phoenix (1.6M).</p></details>
    <details><summary><strong>Will Texas overtake California?</strong></summary><p>Possibly by 2045-2050 if current trends hold. Texas is adding ~500,000 people/year vs California's ~50,000.</p></details>
`;

out.push(['learn/most-populous-states',
  wrap('en', 'most-populous-states',
    'Most populous US states — full 2024 ranking (2026) | Statedoku',
    'The 10 most populous US states: California (39M), Texas (30M), Florida (22M), New York (19M). Full ranking, the "Big 4", least populous, and why population matters.',
    'most populous states, us state population, california population, texas population, biggest us states by population',
    'Most populous US states',
    'California 39M, Texas 30M, Florida 22M, New York 19M. The full ranking, the "Big 4" and why population matters politically.',
    EN_POP_BODY,
    faq([
      ['What is the most populous US state?', 'California, with about 39 million people — roughly 11.7% of the entire US population.'],
      ['What are the 4 most populous US states?', 'California (39M), Texas (30.5M), Florida (22.6M), and New York (19.6M). Together they make up about 33% of the US population.'],
      ['What is the least populous US state?', 'Wyoming, with about 580,000 people — fewer than the city of Detroit.'],
      ['Will Texas overtake California in population?', 'Possibly by 2045-2050 if current trends hold. Texas is adding ~500,000 people per year compared to California\'s ~50,000.'],
    ]),
    `[{"@type":"ListItem","position":1,"name":"Home","item":"https://statedoku.com/"},{"@type":"ListItem","position":2,"name":"Learn","item":"https://statedoku.com/learn/"},{"@type":"ListItem","position":3,"name":"Most populous states","item":"https://statedoku.com/learn/most-populous-states/"}]`,
    '/learn/', 'Learn', relatedEN, hreflangEN('most-populous-states'), footerEN, 'en_US'
  )
]);

// ─────────────────────────────────────────────────────────────────────────
// 3. /es/learn/parques-nacionales-eeuu/ (ES)
// ─────────────────────────────────────────────────────────────────────────
const ES_PARKS_BODY = `    <p>Estados Unidos tiene <strong>63 Parques Nacionales</strong> en 30 estados. Suman más de 34 millones de hectáreas — Yellowstone solo es más grande que toda Bélgica.</p>

    <h2>Estados con más Parques Nacionales</h2>
    <table class="lt">
      <thead><tr><th>Estado</th><th>Parques</th><th>Los más famosos</th></tr></thead>
      <tbody>
        <tr><td><strong>California</strong></td><td>9</td><td>Yosemite, Sequoia, Joshua Tree, Death Valley, Redwood</td></tr>
        <tr><td><strong>Alaska</strong></td><td>8</td><td>Denali, Glacier Bay, Kenai Fjords, Gates of the Arctic</td></tr>
        <tr><td><strong>Utah</strong></td><td>5</td><td>Zion, Bryce Canyon, Arches, Canyonlands, Capitol Reef</td></tr>
        <tr><td><strong>Colorado</strong></td><td>4</td><td>Rocky Mountain, Mesa Verde, Great Sand Dunes, Black Canyon</td></tr>
        <tr><td><strong>Arizona</strong></td><td>3</td><td>Gran Cañón, Petrified Forest, Saguaro</td></tr>
        <tr><td><strong>Washington</strong></td><td>3</td><td>Olympic, Mount Rainier, North Cascades</td></tr>
        <tr><td><strong>Florida</strong></td><td>3</td><td>Everglades, Biscayne, Dry Tortugas</td></tr>
      </tbody>
    </table>

    <h2>Los "imprescindibles"</h2>

    <h3>Yellowstone (Wyoming, Montana, Idaho)</h3>
    <p>El <strong>primer parque nacional del mundo</strong> (1872). Cruza 3 estados. Old Faithful, la mitad de los géiseres del planeta, la mayor población de osos pardos y lobos del país continental.</p>

    <h3>Gran Cañón (Arizona)</h3>
    <p>1.6 km de profundidad, 446 km de longitud, hasta 29 km de ancho. ~6M de visitantes/año. 6 millones de años de geología visible en sus paredes.</p>

    <h3>Yosemite (California)</h3>
    <p>El Capitán, Half Dome, las cataratas más altas de Norteamérica. Cuna del movimiento conservacionista de John Muir.</p>

    <h3>Zion (Utah)</h3>
    <p>Acantilados de arenisca roja-rosa-crema. Angel's Landing y The Narrows son rutas de senderismo legendarias.</p>

    <h3>Glacier (Montana)</h3>
    <p>La carretera "Going-to-the-Sun Road", 700 lagos, el último refugio de osos pardos del país continental fuera de Yellowstone.</p>

    <h2>Los más grandes (por superficie)</h2>
    <ol>
      <li><strong>Wrangell-St. Elias</strong> (Alaska) — 53,300 km². Más grande que Suiza.</li>
      <li><strong>Gates of the Arctic</strong> (Alaska) — 34,400 km².</li>
      <li><strong>Denali</strong> (Alaska) — 24,300 km².</li>
      <li><strong>Death Valley</strong> (California/Nevada) — 13,800 km². El más grande sin contar Alaska.</li>
      <li><strong>Yellowstone</strong> (WY/MT/ID) — 8,900 km².</li>
    </ol>

    <h2>Los más pequeños</h2>
    <ul>
      <li><strong>Gateway Arch</strong> (Misuri) — 0.78 km². El más pequeño.</li>
      <li><strong>Hot Springs</strong> (Arkansas) — 22 km². El área federal protegida más antigua (1832).</li>
      <li><strong>Indiana Dunes</strong> (Indiana) — 61 km².</li>
    </ul>

    <h2>Los 20 estados SIN Parque Nacional</h2>
    <p>Alabama, Connecticut, Delaware, Georgia, Iowa, Illinois, Kansas, Luisiana, Maryland, Massachusetts, Misisipi, Nebraska, New Hampshire, Nueva Jersey, Nueva York, Oklahoma, Pensilvania, Rhode Island, Vermont, Wisconsin.</p>
    <p>(Tienen Monumentos Nacionales, sitios históricos, etc. — solo no "Parques Nacionales" oficiales.)</p>

    <h2>Parque Nacional vs Monumento Nacional vs Parque Estatal</h2>
    <ul>
      <li><strong>Parque Nacional:</strong> designado por ley del Congreso. Máximo nivel. 63 actualmente.</li>
      <li><strong>Monumento Nacional:</strong> designado por proclamación presidencial. ~130 actualmente.</li>
      <li><strong>Bosque Nacional / Pradera / Costa / Área Recreativa:</strong> gestionados por varias agencias federales.</li>
      <li><strong>Parque Estatal:</strong> gestionado por el estado, NO federal.</li>
    </ul>

    <div class="cta-card">
      <h3>Aprende los estados por sus parques</h3>
      <p>Statedoku usa "Tiene un Parque Nacional" o "Hogar de Yellowstone" como pistas en el puzzle diario.</p>
      <a href="/es/">Jugar el puzzle de hoy →</a>
    </div>

    <h2>Preguntas frecuentes</h2>
    <details><summary><strong>¿Cuántos Parques Nacionales hay en EE.UU.?</strong></summary><p>63 Parques Nacionales en 30 estados. El más reciente añadido fue New River Gorge en 2020.</p></details>
    <details><summary><strong>¿Qué estado tiene más Parques Nacionales?</strong></summary><p>California, con 9: Yosemite, Sequoia, Kings Canyon, Joshua Tree, Death Valley (compartido con Nevada), Lassen Volcanic, Pinnacles, Redwood, Channel Islands.</p></details>
    <details><summary><strong>¿Cuál fue el primer Parque Nacional?</strong></summary><p>Yellowstone, creado en 1872 — el primer parque nacional del mundo. Es anterior a la estadidad de Wyoming y Montana.</p></details>
    <details><summary><strong>¿Cuál es el parque más visitado?</strong></summary><p>Great Smoky Mountains (Tennessee/Carolina del Norte) con ~13M de visitantes/año. La entrada gratuita lo mantiene en primer lugar.</p></details>
    <details><summary><strong>¿Qué estado tiene más superficie en parques?</strong></summary><p>Alaska — 8 parques sumando ~13.4M de hectáreas, más que los otros 49 estados combinados.</p></details>
`;

out.push(['es/learn/parques-nacionales-eeuu',
  wrap('es', 'parques-nacionales-eeuu',
    'Los 63 Parques Nacionales de EE.UU. por estado (2026) | Statedoku',
    'Lista completa de los 63 Parques Nacionales de Estados Unidos por estado. California tiene 9, Alaska 8, Utah 5. El más antiguo (Yellowstone 1872), el más grande, el más visitado.',
    'parques nacionales estados unidos, parques nacionales eeuu, yellowstone, yosemite, gran cañon, lista parques nacionales usa',
    'Parques Nacionales de EE.UU.',
    'Los 63 Parques Nacionales por estado — el más antiguo, el más grande, el más visitado.',
    ES_PARKS_BODY,
    faq([
      ['¿Cuántos Parques Nacionales hay en Estados Unidos?', 'Hay 63 Parques Nacionales en 30 estados. El más reciente añadido fue New River Gorge en 2020.'],
      ['¿Qué estado tiene más Parques Nacionales?', 'California con 9: Yosemite, Sequoia, Kings Canyon, Joshua Tree, Death Valley (compartido con Nevada), Lassen Volcanic, Pinnacles, Redwood y Channel Islands.'],
      ['¿Cuál es el Parque Nacional más antiguo?', 'Yellowstone, creado en 1872. Fue el primer parque nacional del mundo y anterior a la estadidad de Wyoming y Montana.'],
      ['¿Cuál es el Parque Nacional más visitado?', 'Great Smoky Mountains (Tennessee/Carolina del Norte) con ~13 millones de visitantes al año. La entrada gratuita lo mantiene en primer lugar.'],
    ]),
    `[{"@type":"ListItem","position":1,"name":"Inicio","item":"https://statedoku.com/es/"},{"@type":"ListItem","position":2,"name":"Aprender","item":"https://statedoku.com/es/learn/"},{"@type":"ListItem","position":3,"name":"Parques Nacionales","item":"https://statedoku.com/es/learn/parques-nacionales-eeuu/"}]`,
    '/es/learn/', 'Aprender', relatedES, hreflangES('parques-nacionales-eeuu'), footerES, 'es_ES'
  )
]);

// ─────────────────────────────────────────────────────────────────────────
// 4. /es/learn/estados-mas-poblados/ (ES)
// ─────────────────────────────────────────────────────────────────────────
const ES_POP_BODY = `    <p>Estados Unidos tiene unos <strong>335 millones de habitantes</strong> repartidos en 50 estados. Pero la población es muy desigual: <strong>California sola tiene 39 millones</strong> — más que los 21 estados menos poblados juntos. He aquí el ranking completo.</p>

    <h2>Top 10 estados más poblados (2024)</h2>
    <table class="lt">
      <thead><tr><th>#</th><th>Estado</th><th>Población</th><th>% del país</th></tr></thead>
      <tbody>
        <tr><td>1</td><td><strong>California</strong></td><td>39.0M</td><td>11.7%</td></tr>
        <tr><td>2</td><td><strong>Texas</strong></td><td>30.5M</td><td>9.1%</td></tr>
        <tr><td>3</td><td><strong>Florida</strong></td><td>22.6M</td><td>6.7%</td></tr>
        <tr><td>4</td><td><strong>Nueva York</strong></td><td>19.6M</td><td>5.8%</td></tr>
        <tr><td>5</td><td>Pensilvania</td><td>13.0M</td><td>3.9%</td></tr>
        <tr><td>6</td><td>Illinois</td><td>12.5M</td><td>3.7%</td></tr>
        <tr><td>7</td><td>Ohio</td><td>11.8M</td><td>3.5%</td></tr>
        <tr><td>8</td><td>Georgia</td><td>11.0M</td><td>3.3%</td></tr>
        <tr><td>9</td><td>Carolina del Norte</td><td>10.8M</td><td>3.2%</td></tr>
        <tr><td>10</td><td>Michigan</td><td>10.0M</td><td>3.0%</td></tr>
      </tbody>
    </table>
    <p>Solo los 10 primeros suman <strong>~54%</strong> de toda la población del país.</p>

    <h2>Los "Big 4" hispanohablantes</h2>
    <p>California, Texas, Florida, Nueva York concentran también la mayor parte de los <strong>62 millones de hispanos</strong> de EE.UU.:</p>
    <ul>
      <li><strong>California:</strong> ~15.5M hispanos (39% del estado). El estado con más hispanos del país.</li>
      <li><strong>Texas:</strong> ~12M hispanos (40% del estado). Texas será probablemente mayoría hispana en los próximos 10 años.</li>
      <li><strong>Florida:</strong> ~5.6M hispanos (25%). Cubanos, venezolanos, colombianos.</li>
      <li><strong>Nueva York:</strong> ~3.8M hispanos (19%). Dominicanos, puertorriqueños, mexicanos.</li>
    </ul>

    <h2>Top 5 ciudades hispanas en EE.UU.</h2>
    <ol>
      <li>Los Ángeles, California</li>
      <li>Nueva York</li>
      <li>Houston, Texas</li>
      <li>San Antonio, Texas</li>
      <li>Chicago, Illinois</li>
    </ol>

    <h2>10 estados menos poblados</h2>
    <table class="lt">
      <thead><tr><th>#</th><th>Estado</th><th>Población</th></tr></thead>
      <tbody>
        <tr><td>50</td><td><strong>Wyoming</strong></td><td>580k</td></tr>
        <tr><td>49</td><td>Vermont</td><td>645k</td></tr>
        <tr><td>48</td><td>Alaska</td><td>733k</td></tr>
        <tr><td>47</td><td>Dakota del Norte</td><td>783k</td></tr>
        <tr><td>46</td><td>Dakota del Sur</td><td>910k</td></tr>
        <tr><td>45</td><td>Delaware</td><td>1.0M</td></tr>
        <tr><td>44</td><td>Rhode Island</td><td>1.1M</td></tr>
        <tr><td>43</td><td>Montana</td><td>1.1M</td></tr>
        <tr><td>42</td><td>Maine</td><td>1.4M</td></tr>
        <tr><td>41</td><td>New Hampshire</td><td>1.4M</td></tr>
      </tbody>
    </table>
    <p><strong>Wyoming</strong> tiene menos habitantes que la ciudad de Detroit. Los 21 estados menos poblados sumados tienen menos gente que California sola.</p>

    <h2>Población vs <a href="/es/learn/colegio-electoral/">Colegio Electoral</a></h2>
    <p>Cada estado tiene exactamente 2 senadores independientemente de su tamaño. Un senador de Wyoming representa a 290,000 personas; un senador de California, a 19.5M. <strong>67 veces más</strong>. Por eso el Senado está estructuralmente sesgado hacia los estados pequeños.</p>

    <h2>Estados que pierden población</h2>
    <ul>
      <li><strong>Virginia Occidental</strong> — único estado por debajo de su población de 1990.</li>
      <li><strong>Illinois</strong> — declive lento pero constante desde 2014.</li>
      <li><strong>Nueva York, Luisiana, Misisipi</strong> — pequeñas pérdidas post-COVID.</li>
    </ul>

    <h2>Estados que crecen más rápido</h2>
    <p>Texas, Florida, Georgia, Idaho, Utah, Tennessee, Carolina del Sur, Arizona, Nevada — todos del <a href="/es/learn/cinturones-eeuu/">Sun Belt</a>. La gente migra <em>desde</em> el Noreste y Medio Oeste, <em>hacia</em> el Sur y el Oeste.</p>

    <div class="cta-card">
      <h3>Aprende los estados por su población</h3>
      <p>Statedoku usa "Top 10 poblados" o "Menos de 1M" como pistas en el puzzle diario.</p>
      <a href="/es/">Jugar el puzzle de hoy →</a>
    </div>

    <h2>Preguntas frecuentes</h2>
    <details><summary><strong>¿Cuál es el estado más poblado de EE.UU.?</strong></summary><p>California, con 39 millones de personas — alrededor del 11.7% de toda la población estadounidense.</p></details>
    <details><summary><strong>¿Cuál es el estado menos poblado?</strong></summary><p>Wyoming, con unos 580,000 habitantes — menos que la ciudad de Detroit.</p></details>
    <details><summary><strong>¿Cuál es la ciudad más poblada de EE.UU.?</strong></summary><p>Nueva York (8.3M). Le siguen Los Ángeles (3.9M), Chicago (2.7M), Houston (2.3M), Phoenix (1.6M).</p></details>
    <details><summary><strong>¿Cuál es el estado con más hispanos?</strong></summary><p>California, con unos 15.5 millones de hispanos (39% del estado). Texas le sigue con 12 millones (40% del estado).</p></details>
    <details><summary><strong>¿Texas va a superar a California?</strong></summary><p>Posiblemente para 2045-2050 si la tendencia se mantiene. Texas añade ~500,000 personas/año vs California ~50,000.</p></details>
`;

out.push(['es/learn/estados-mas-poblados',
  wrap('es', 'estados-mas-poblados',
    'Los 10 estados más poblados de EE.UU. — ranking 2024 (2026) | Statedoku',
    'Los 10 estados más poblados de Estados Unidos: California (39M), Texas (30M), Florida (22M), Nueva York (19M). Ranking completo, los Big 4 y los hispanos por estado.',
    'estados mas poblados eeuu, poblacion california, poblacion texas, hispanos por estado eeuu, ciudades hispanas estados unidos',
    'Estados más poblados de EE.UU.',
    'California 39M, Texas 30M, Florida 22M, Nueva York 19M. El ranking completo y los hispanos por estado.',
    ES_POP_BODY,
    faq([
      ['¿Cuál es el estado más poblado de EE.UU.?', 'California, con unos 39 millones de habitantes — alrededor del 11.7% de toda la población estadounidense.'],
      ['¿Cuáles son los 4 estados más poblados?', 'California (39M), Texas (30.5M), Florida (22.6M) y Nueva York (19.6M). Juntos suman cerca del 33% de la población del país.'],
      ['¿Cuál es el estado con más hispanos?', 'California con unos 15.5 millones de hispanos (39% del estado). Texas le sigue con 12 millones (40% del estado).'],
      ['¿Cuál es el estado menos poblado?', 'Wyoming, con unos 580,000 habitantes — menos que la ciudad de Detroit.'],
    ]),
    `[{"@type":"ListItem","position":1,"name":"Inicio","item":"https://statedoku.com/es/"},{"@type":"ListItem","position":2,"name":"Aprender","item":"https://statedoku.com/es/learn/"},{"@type":"ListItem","position":3,"name":"Estados más poblados","item":"https://statedoku.com/es/learn/estados-mas-poblados/"}]`,
    '/es/learn/', 'Aprender', relatedES, hreflangES('estados-mas-poblados'), footerES, 'es_ES'
  )
]);

// ─────────────────────────────────────────────────────────────────────────
// 5. /fr/learn/parcs-nationaux-americains/ (FR)
// ─────────────────────────────────────────────────────────────────────────
const FR_PARKS_BODY = `    <p>Les États-Unis comptent <strong>63 Parcs Nationaux</strong> dans 30 États. Ensemble, ils couvrent plus de 34 millions d'hectares — Yellowstone à lui seul est plus grand que toute la Belgique.</p>

    <h2>États avec le plus de Parcs Nationaux</h2>
    <table class="lt">
      <thead><tr><th>État</th><th>Parcs</th><th>Les plus célèbres</th></tr></thead>
      <tbody>
        <tr><td><strong>Californie</strong></td><td>9</td><td>Yosemite, Sequoia, Joshua Tree, Death Valley, Redwood</td></tr>
        <tr><td><strong>Alaska</strong></td><td>8</td><td>Denali, Glacier Bay, Kenai Fjords, Gates of the Arctic</td></tr>
        <tr><td><strong>Utah</strong></td><td>5</td><td>Zion, Bryce Canyon, Arches, Canyonlands, Capitol Reef</td></tr>
        <tr><td><strong>Colorado</strong></td><td>4</td><td>Rocky Mountain, Mesa Verde, Great Sand Dunes, Black Canyon</td></tr>
        <tr><td><strong>Arizona</strong></td><td>3</td><td>Grand Canyon, Petrified Forest, Saguaro</td></tr>
        <tr><td><strong>Washington</strong></td><td>3</td><td>Olympic, Mount Rainier, North Cascades</td></tr>
        <tr><td><strong>Floride</strong></td><td>3</td><td>Everglades, Biscayne, Dry Tortugas</td></tr>
      </tbody>
    </table>

    <h2>Les incontournables</h2>

    <h3>Yellowstone (Wyoming, Montana, Idaho)</h3>
    <p>Le <strong>premier parc national au monde</strong> (1872). Traverse 3 États. Old Faithful, la moitié des geysers de la planète, la plus grande population de grizzlys et de loups du pays continental.</p>

    <h3>Grand Canyon (Arizona)</h3>
    <p>1.6 km de profondeur, 446 km de long, jusqu'à 29 km de large. ~6M de visiteurs/an. 6 millions d'années de géologie exposée dans les parois.</p>

    <h3>Yosemite (Californie)</h3>
    <p>El Capitan, Half Dome, les cascades les plus hautes d'Amérique du Nord. Berceau du mouvement conservationniste de John Muir.</p>

    <h3>Zion (Utah)</h3>
    <p>Falaises de grès rouge-rose-crème. Angel's Landing et The Narrows sont des randonnées légendaires.</p>

    <h3>Glacier (Montana)</h3>
    <p>La route "Going-to-the-Sun Road", 700 lacs, dernier refuge des grizzlys hors Yellowstone dans les 48 États contigus.</p>

    <h2>Les plus grands parcs (par superficie)</h2>
    <ol>
      <li><strong>Wrangell-St. Elias</strong> (Alaska) — 53,300 km². Plus grand que la Suisse.</li>
      <li><strong>Gates of the Arctic</strong> (Alaska) — 34,400 km².</li>
      <li><strong>Denali</strong> (Alaska) — 24,300 km².</li>
      <li><strong>Death Valley</strong> (Californie/Nevada) — 13,800 km². Le plus grand hors Alaska.</li>
      <li><strong>Yellowstone</strong> (WY/MT/ID) — 8,900 km².</li>
    </ol>

    <h2>Les plus petits</h2>
    <ul>
      <li><strong>Gateway Arch</strong> (Missouri) — 0.78 km². Le plus petit.</li>
      <li><strong>Hot Springs</strong> (Arkansas) — 22 km². La plus vieille zone fédérale protégée (1832).</li>
      <li><strong>Indiana Dunes</strong> (Indiana) — 61 km².</li>
    </ul>

    <h2>Conseils pratiques pour les voyageurs francophones</h2>
    <ul>
      <li><strong>Pass annuel "America the Beautiful"</strong> : 80 $ pour 1 an, accès illimité aux 63 parcs + sites fédéraux. Rentable dès 3-4 visites.</li>
      <li><strong>Meilleure saison :</strong> printemps (avril-mai) et automne (septembre-octobre). Évite juillet-août (foule + chaleur dans les parcs du Sud-Ouest).</li>
      <li><strong>Réservations :</strong> obligatoires pour Yosemite et Zion en haute saison, et pour les places de camping populaires (recreation.gov).</li>
      <li><strong>Distances :</strong> entre Yellowstone et Yosemite = 1,500 km. Prévoir vols intérieurs ou road trip de 2-3 semaines.</li>
    </ul>

    <h2>Les 20 États SANS Parc National</h2>
    <p>Alabama, Connecticut, Delaware, Géorgie, Iowa, Illinois, Kansas, Louisiane, Maryland, Massachusetts, Mississippi, Nebraska, New Hampshire, New Jersey, New York, Oklahoma, Pennsylvanie, Rhode Island, Vermont, Wisconsin.</p>
    <p>(Ils ont des Monuments Nationaux, sites historiques, etc. — juste pas de "Parc National" officiel.)</p>

    <div class="cta-card">
      <h3>Apprenez les États par leurs parcs</h3>
      <p>Statedoku utilise "Abrite un Parc National" ou "Yellowstone" comme indices dans le puzzle quotidien.</p>
      <a href="/fr/">Jouer le puzzle du jour →</a>
    </div>

    <h2>Questions fréquentes</h2>
    <details><summary><strong>Combien y a-t-il de Parcs Nationaux aux États-Unis ?</strong></summary><p>63 Parcs Nationaux dans 30 États. Le dernier ajouté est New River Gorge en 2020.</p></details>
    <details><summary><strong>Quel État a le plus de Parcs Nationaux ?</strong></summary><p>La Californie avec 9 : Yosemite, Sequoia, Kings Canyon, Joshua Tree, Death Valley (partagé avec le Nevada), Lassen Volcanic, Pinnacles, Redwood et Channel Islands.</p></details>
    <details><summary><strong>Quel est le plus ancien Parc National ?</strong></summary><p>Yellowstone, créé en 1872 — le premier parc national au monde. Antérieur à la création des États du Wyoming et du Montana.</p></details>
    <details><summary><strong>Quel est le parc le plus visité ?</strong></summary><p>Great Smoky Mountains (Tennessee/Caroline du Nord) avec ~13M de visiteurs par an. L'entrée gratuite l'aide à rester en tête.</p></details>
    <details><summary><strong>Combien coûte le pass annuel ?</strong></summary><p>Le "America the Beautiful" coûte 80 USD pour 1 an et donne accès illimité aux 63 parcs + sites fédéraux. Rentable dès 3-4 visites.</p></details>
`;

out.push(['fr/learn/parcs-nationaux-americains',
  wrap('fr', 'parcs-nationaux-americains',
    'Les 63 Parcs Nationaux américains par État (2026) | Statedoku',
    'Liste complète des 63 Parcs Nationaux américains par État. La Californie en compte 9, l\'Alaska 8, l\'Utah 5. Le plus ancien (Yellowstone 1872), le plus grand, conseils voyage.',
    'parcs nationaux americains, parcs nationaux usa, yellowstone, yosemite, grand canyon, liste parcs nationaux usa, road trip parcs',
    'Les Parcs Nationaux américains',
    '63 Parcs Nationaux dans 30 États. Yellowstone, Yosemite, Grand Canyon — et les conseils pour les visiter.',
    FR_PARKS_BODY,
    faq([
      ['Combien y a-t-il de Parcs Nationaux aux États-Unis ?', 'Il y a 63 Parcs Nationaux dans 30 États. Le dernier ajouté est New River Gorge en 2020.'],
      ['Quel État a le plus de Parcs Nationaux ?', 'La Californie avec 9 : Yosemite, Sequoia, Kings Canyon, Joshua Tree, Death Valley (partagé avec le Nevada), Lassen Volcanic, Pinnacles, Redwood et Channel Islands.'],
      ['Quel est le plus ancien Parc National ?', 'Yellowstone, créé en 1872. C\'était le premier parc national au monde, antérieur à la création des États du Wyoming et du Montana.'],
      ['Combien coûte le pass annuel des Parcs Nationaux ?', 'Le pass "America the Beautiful" coûte 80 USD pour un an et donne accès illimité aux 63 parcs + sites fédéraux. Rentable dès 3-4 visites.'],
    ]),
    `[{"@type":"ListItem","position":1,"name":"Accueil","item":"https://statedoku.com/fr/"},{"@type":"ListItem","position":2,"name":"Apprendre","item":"https://statedoku.com/fr/learn/"},{"@type":"ListItem","position":3,"name":"Parcs Nationaux","item":"https://statedoku.com/fr/learn/parcs-nationaux-americains/"}]`,
    '/fr/learn/', 'Apprendre', relatedFR, hreflangFR('parcs-nationaux-americains'), footerFR, 'fr_FR'
  )
]);

// Write all
for (const [rel, html] of out) {
  const dir = path.join(ROOT, rel);
  fs.mkdirSync(dir, { recursive: true });
  fs.writeFileSync(path.join(dir, 'index.html'), html);
  console.log(`✅ /${rel}/`);
}
console.log(`\n${out.length} pages générées (batch 3).`);
