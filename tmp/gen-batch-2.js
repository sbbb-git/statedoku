#!/usr/bin/env node
/**
 * Mass batch 2: 12 new learn pages
 *   D — 2 EN pages (state-nicknames-complete, us-cultural-belts)
 *   E — 5 ES + 5 FR pages
 *
 * Same template as gen-mass-pages.js, FAQPage + BreadcrumbList schema,
 * hreflang variants, related-grid.
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
    table.lt tr:hover { background: #FAFBFC; }
    table.lt a { color: var(--navy); font-weight: 700; text-decoration: none; }
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
      <a href="/learn/state-abbreviations/">→ USPS abbreviations</a>
      <a href="/learn/state-nicknames/">→ State nicknames</a>
      <a href="/learn/state-flags/">→ State flags</a>
      <a href="/learn/state-mottos/">→ State mottos</a>
      <a href="/learn/us-regions/">→ The 4 US regions</a>
      <a href="/learn/13-colonies/">→ The 13 original colonies</a>
      <a href="/learn/electoral-college/">→ Electoral college</a>
      <a href="/learn/swing-states/">→ Swing states</a>
    </div>`;
const relatedES = `    <div class="related-grid">
      <a href="/es/learn/">→ Aprender los 50 estados</a>
      <a href="/es/learn/capitales-de-estados/">→ Las 50 capitales</a>
      <a href="/es/learn/regiones-de-eeuu/">→ Las 4 regiones de EE.UU.</a>
      <a href="/es/learn/banderas-de-estados/">→ Banderas de los estados</a>
      <a href="/es/learn/apodos-de-estados/">→ Apodos estatales</a>
      <a href="/es/learn/state-abbreviations/">→ Abreviaturas USPS</a>
      <a href="/es/learn/colegio-electoral/">→ Colegio Electoral</a>
      <a href="/es/learn/colonias-originales/">→ Las 13 colonias originales</a>
      <a href="/es/learn/zonas-horarias-eeuu/">→ Zonas horarias</a>
      <a href="/es/learn/cinturones-eeuu/">→ Bible Belt, Rust Belt, Sun Belt</a>
    </div>`;
const relatedFR = `    <div class="related-grid">
      <a href="/fr/learn/">→ Apprendre les 50 états</a>
      <a href="/fr/learn/capitales-des-etats/">→ Les 50 capitales</a>
      <a href="/fr/learn/regions-des-etats-unis/">→ Les 4 régions</a>
      <a href="/fr/learn/drapeaux-des-etats/">→ Drapeaux d'États</a>
      <a href="/fr/learn/surnoms-des-etats/">→ Surnoms d'États</a>
      <a href="/fr/learn/college-electoral/">→ Collège Électoral</a>
      <a href="/fr/learn/13-colonies/">→ Les 13 colonies originelles</a>
      <a href="/fr/learn/state-abbreviations/">→ Abréviations USPS</a>
      <a href="/fr/learn/fuseaux-horaires-etats-unis/">→ Fuseaux horaires</a>
      <a href="/fr/learn/largest-states/">→ Plus grands États</a>
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
  <link rel="stylesheet" href="/css/style.css?v=17">
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

// ── D1: /learn/state-nicknames-complete/ ────────────────────────────────
out.push(['learn/state-nicknames-complete',
  wrap('en', 'state-nicknames-complete',
    'All 50 US state nicknames — official + popular (2026) | Statedoku',
    'The complete list of nicknames for all 50 US states. Texas is the Lone Star State, California the Golden State, Florida the Sunshine State. History + meaning for each.',
    'us state nicknames, state nicknames list, lone star state, golden state, sunshine state, all 50 state nicknames',
    'All 50 US State Nicknames',
    'Lone Star, Golden State, Sunshine State, Bluegrass — the complete list with the history behind each.',
`    <p>Each of the <strong>50 US states</strong> has at least one <strong>official or popular nickname</strong>. They appear on license plates, coins, flags, and tourism slogans. They tell the story, geography or culture of the state.</p>

    <h2>Complete table of all 50 nicknames</h2>
    <table class="lt">
      <thead><tr><th>State</th><th>Nickname</th><th>Meaning</th></tr></thead>
      <tbody>
        <tr><td>Alabama</td><td>Yellowhammer State</td><td>For the yellow bird, Civil War symbol.</td></tr>
        <tr><td>Alaska</td><td>The Last Frontier</td><td>The last unexplored territory.</td></tr>
        <tr><td>Arizona</td><td>Grand Canyon State</td><td>For the Grand Canyon of the Colorado.</td></tr>
        <tr><td>Arkansas</td><td>Natural State</td><td>For its wild nature.</td></tr>
        <tr><td>California</td><td>Golden State</td><td>From the 1849 Gold Rush + golden hills light.</td></tr>
        <tr><td>Colorado</td><td>Centennial State</td><td>Admitted in 1876, the centennial of US independence.</td></tr>
        <tr><td>Connecticut</td><td>Constitution State</td><td>From the "Fundamental Orders of Connecticut" (1639).</td></tr>
        <tr><td>Delaware</td><td>First State</td><td>First to ratify the Constitution (Dec 1787).</td></tr>
        <tr><td>Florida</td><td>Sunshine State</td><td>For the year-round sunny climate.</td></tr>
        <tr><td>Georgia</td><td>Peach State</td><td>For its peach orchards.</td></tr>
        <tr><td>Hawaii</td><td>Aloha State</td><td>For the Hawaiian greeting.</td></tr>
        <tr><td>Idaho</td><td>Gem State</td><td>For its minerals and gemstones.</td></tr>
        <tr><td>Illinois</td><td>Prairie State</td><td>For its vast prairies.</td></tr>
        <tr><td>Indiana</td><td>Hoosier State</td><td>Uncertain origin, but "Hoosier" is the people's demonym.</td></tr>
        <tr><td>Iowa</td><td>Hawkeye State</td><td>After Sauk chief Black Hawk.</td></tr>
        <tr><td>Kansas</td><td>Sunflower State</td><td>For the sunflower, the state flower.</td></tr>
        <tr><td>Kentucky</td><td>Bluegrass State</td><td>For the bluegrass that grows in its meadows.</td></tr>
        <tr><td>Louisiana</td><td>Pelican State</td><td>For the brown pelican, state symbol.</td></tr>
        <tr><td>Maine</td><td>Pine Tree State</td><td>For its white pine forests.</td></tr>
        <tr><td>Maryland</td><td>Old Line State</td><td>For the Maryland Line in the revolutionary army.</td></tr>
        <tr><td>Massachusetts</td><td>Bay State</td><td>For Massachusetts Bay.</td></tr>
        <tr><td>Michigan</td><td>Great Lake State</td><td>For the 4 Great Lakes surrounding it.</td></tr>
        <tr><td>Minnesota</td><td>Land of 10,000 Lakes</td><td>Actually has more than 11,000 lakes.</td></tr>
        <tr><td>Mississippi</td><td>Magnolia State</td><td>For the magnolia, state tree.</td></tr>
        <tr><td>Missouri</td><td>Show Me State</td><td>"Show me" — skeptical attitude of locals.</td></tr>
        <tr><td>Montana</td><td>Treasure State</td><td>For its mineral wealth.</td></tr>
        <tr><td>Nebraska</td><td>Cornhusker State</td><td>For the corn harvest.</td></tr>
        <tr><td>Nevada</td><td>Silver State</td><td>For the silver mines of the Comstock Lode.</td></tr>
        <tr><td>New Hampshire</td><td>Granite State</td><td>For its granite formations.</td></tr>
        <tr><td>New Jersey</td><td>Garden State</td><td>For historical farming.</td></tr>
        <tr><td>New Mexico</td><td>Land of Enchantment</td><td>For its natural and cultural beauty.</td></tr>
        <tr><td>New York</td><td>Empire State</td><td>Attributed to George Washington — future empire.</td></tr>
        <tr><td>North Carolina</td><td>Tar Heel State</td><td>For historical tar production.</td></tr>
        <tr><td>North Dakota</td><td>Peace Garden State</td><td>For the International Peace Garden on the Canadian border.</td></tr>
        <tr><td>Ohio</td><td>Buckeye State</td><td>For the buckeye tree.</td></tr>
        <tr><td>Oklahoma</td><td>Sooner State</td><td>For "sooners" who entered land before time in 1889.</td></tr>
        <tr><td>Oregon</td><td>Beaver State</td><td>For the beaver, state symbol + fur trade history.</td></tr>
        <tr><td>Pennsylvania</td><td>Keystone State</td><td>"Keystone" state of the 13 original colonies.</td></tr>
        <tr><td>Rhode Island</td><td>Ocean State</td><td>For its large coastline relative to size.</td></tr>
        <tr><td>South Carolina</td><td>Palmetto State</td><td>For the palmetto tree, Revolutionary War symbol.</td></tr>
        <tr><td>South Dakota</td><td>Mount Rushmore State</td><td>For the mountain with 4 presidents.</td></tr>
        <tr><td>Tennessee</td><td>Volunteer State</td><td>For volunteers of the War of 1812.</td></tr>
        <tr><td>Texas</td><td>Lone Star State</td><td>For the lone star on its flag, symbolizing independence.</td></tr>
        <tr><td>Utah</td><td>Beehive State</td><td>For the Mormon beehive, symbol of industry.</td></tr>
        <tr><td>Vermont</td><td>Green Mountain State</td><td>From "Vert Mont" in French — "green mountain".</td></tr>
        <tr><td>Virginia</td><td>Old Dominion</td><td>For its loyalty to the English Crown.</td></tr>
        <tr><td>Washington</td><td>Evergreen State</td><td>For its evergreen forests.</td></tr>
        <tr><td>West Virginia</td><td>Mountain State</td><td>Entirely covered by Appalachians.</td></tr>
        <tr><td>Wisconsin</td><td>Badger State</td><td>For miners who lived underground like badgers.</td></tr>
        <tr><td>Wyoming</td><td>Equality State</td><td>First state to give women the vote (1869).</td></tr>
      </tbody>
    </table>

    <h2>The most globally recognized nicknames</h2>
    <ul>
      <li><strong>Texas — Lone Star State:</strong> the most internationally recognizable.</li>
      <li><strong>California — Golden State:</strong> used by the Golden State Warriors (NBA).</li>
      <li><strong>Florida — Sunshine State:</strong> appears on every license plate.</li>
      <li><strong>New York — Empire State:</strong> name of the Empire State Building.</li>
      <li><strong>Alaska — Last Frontier:</strong> evocative of the Wild West.</li>
    </ul>

    <h2>The French nickname: Vermont = "Green Mountain"</h2>
    <p>The only US state with a French-origin name and nickname. "Vert Mont" became "Vermont", and the English translation "Green Mountain State" honors the mountains crossing it.</p>

    <div class="cta-card">
      <h3>Learn the nicknames by playing</h3>
      <p>Statedoku uses nicknames as constraints — "Aloha State", "Bluegrass State", "Sunshine State". Learn without effort.</p>
      <a href="/">Play today's puzzle →</a>
    </div>

    <h2>Frequently asked questions</h2>
    <details><summary><strong>Why is Texas the "Lone Star State"?</strong></summary><p>From the single star on its flag, symbolizing its independence as the Republic of Texas (1836-1845) before joining the United States.</p></details>
    <details><summary><strong>Why is California the "Golden State"?</strong></summary><p>From the 1849 Gold Rush that massively populated it, and also from the golden light on its hills in summer.</p></details>
    <details><summary><strong>What does "Hoosier State" (Indiana) mean?</strong></summary><p>The origin is debated. Possible: from the greeting "Who's there?" pronounced "Hoo-sher", from a foreman named Hoosier, or from a Native American word. Today it's the official demonym.</p></details>
    <details><summary><strong>Which state has a French nickname?</strong></summary><p>Vermont. Its name comes from French "Vert Mont" (green mountain), and its official nickname "Green Mountain State" is the translation.</p></details>
`,
    faq([
      ["What is Texas's nickname?", "Lone Star State, from the single star on its flag, symbolizing its brief independence as the Republic of Texas (1836-1845)."],
      ["What is California's nickname?", "Golden State, from the 1849 Gold Rush and the golden light of its landscapes."],
      ["What is Florida's nickname?", "Sunshine State, from its year-round sunny climate."],
      ["Which state is called the 'Empire State'?", "New York. The nickname is attributed to George Washington, who predicted it would be the empire of the new nation."],
    ]),
    `[{"@type":"ListItem","position":1,"name":"Home","item":"https://statedoku.com/"},{"@type":"ListItem","position":2,"name":"Learn","item":"https://statedoku.com/learn/"},{"@type":"ListItem","position":3,"name":"All 50 state nicknames","item":"https://statedoku.com/learn/state-nicknames-complete/"}]`,
    '/learn/', 'Learn', relatedEN, hreflangEN('state-nicknames-complete'), footerEN, 'en_US'
  )
]);

// ── D2: /learn/us-cultural-belts/ ────────────────────────────────────────
out.push(['learn/us-cultural-belts',
  wrap('en', 'us-cultural-belts',
    'US cultural belts — Bible Belt, Rust Belt, Sun Belt, Corn Belt (2026) | Statedoku',
    'The cultural and economic belts of the US: Bible Belt (religious South), Rust Belt (industrial Midwest), Sun Belt (growing south), Corn Belt, Black Belt. What they are and which states.',
    'bible belt, rust belt, sun belt, corn belt, black belt, us cultural belts, american cultural regions',
    'The US Cultural Belts',
    'Bible Belt, Rust Belt, Sun Belt, Corn Belt — beyond the 4 official regions, America divides itself into "belts" by economy, religion, and landscape.',
`    <p>Beyond the 4 official regions (Northeast, South, Midwest, West), the United States divides informally into <strong>"belts"</strong> based on economy, culture, religion, or landscape. They aren't administrative boundaries, but they are as real to Americans as the Census regions.</p>

    <h2>1. Bible Belt</h2>
    <p>The Southern region where evangelical Protestant Christianity culturally dominates. Higher church attendance per capita than anywhere else in the country. Politically conservative.</p>
    <p><strong>Core states:</strong> Alabama, Mississippi, Tennessee, Kentucky, Arkansas, Louisiana, Georgia, Carolinas, Texas (north and east), Oklahoma, Missouri (south), Virginia (west), West Virginia.</p>
    <p><strong>Key cities:</strong> Nashville (TN), Birmingham (AL), Atlanta (GA), Tulsa (OK).</p>

    <h2>2. Rust Belt</h2>
    <p>The Midwest and Mid-Atlantic region that flourished with heavy industry (steel, automobiles, manufacturing) and declined from the 1970s onward. "Rust" for the abandoned factories.</p>
    <p><strong>States:</strong> Pennsylvania (west), Ohio, Michigan, Indiana, Illinois (north), Wisconsin, New York (west), West Virginia.</p>
    <p><strong>Key cities:</strong> Detroit (MI), Pittsburgh (PA), Cleveland (OH), Buffalo (NY), Gary (IN), Toledo (OH).</p>

    <h2>3. Sun Belt</h2>
    <p>The demographic opposite of the Rust Belt. Southern and Southwestern states growing rapidly due to warm climate, low costs, and tech industries. Many retirees, lots of internal migration.</p>
    <p><strong>States:</strong> Florida, Georgia, Alabama, Mississippi, Louisiana, Texas, New Mexico, Arizona, Nevada, southern California, southern Carolinas.</p>
    <p><strong>Key cities:</strong> Miami (FL), Houston (TX), Phoenix (AZ), Las Vegas (NV), Atlanta (GA), Dallas (TX).</p>

    <h2>4. Corn Belt</h2>
    <p>The Midwestern region dominated by corn (and now soybean) production. Deep black soils formed by glaciations.</p>
    <p><strong>States:</strong> Iowa, Illinois, Indiana, Nebraska, Missouri, Minnesota (south), South Dakota (east), Ohio (west), Wisconsin (south), Kansas (east).</p>
    <p><strong>Key city:</strong> Des Moines (IA) — symbolic corn capital.</p>

    <h2>5. Black Belt</h2>
    <p>Originally a strip of fertile black soils in the Deep South (Alabama, Mississippi). Later associated with the large African American population descended from cotton plantation slaves. Today it's a socioeconomic term: regions with Black majority, historically poor, mostly rural.</p>
    <p><strong>States:</strong> Alabama (center), Mississippi (west), Louisiana (west), Texas (east), Arkansas (southeast), Tennessee (west), Georgia (center-south), South Carolina (center), North Carolina (east), Virginia (southeast).</p>

    <h2>6. Borscht Belt</h2>
    <p>Historical — not geographic anymore. From the 1920s to the 1970s, the Catskill Mountains of upstate New York were summer destinations for the Jewish community. Hotels, comedians (Mel Brooks, Jerry Lewis, Joan Rivers started there). The name comes from borscht, traditional Russian soup. Almost disappeared but culturally important.</p>

    <h2>7. Other lesser-known "belts"</h2>
    <ul>
      <li><strong>Cotton Belt:</strong> Southern states that dominated cotton in the 19th century. Now diversified.</li>
      <li><strong>Wheat Belt:</strong> Wheat region of the Midwest — Dakotas, Montana, Kansas, Nebraska.</li>
      <li><strong>Dairy Belt:</strong> Wisconsin and Minnesota, dominated by dairy production.</li>
      <li><strong>Frost Belt / Snow Belt:</strong> the North receiving heavy snow — Great Lakes eastward.</li>
      <li><strong>Tornado Alley:</strong> the "row" of tornadoes — Texas, Oklahoma, Kansas, Nebraska, Iowa.</li>
      <li><strong>Stroke Belt:</strong> Southeastern states with high stroke rates (public health issue).</li>
      <li><strong>Tech Belt / Silicon Belt:</strong> California (Bay Area), Washington (Seattle), Texas (Austin), Massachusetts (Boston).</li>
    </ul>

    <div class="cta-card">
      <h3>Learn the belts by playing</h3>
      <p>Statedoku uses "Bible Belt" or "Sun Belt" as constraints in its daily puzzle. Culture and geography at once.</p>
      <a href="/">Play today's puzzle →</a>
    </div>

    <h2>Frequently asked questions</h2>
    <details><summary><strong>What is the "Bible Belt"?</strong></summary><p>The strip of Southern US states where evangelical Protestant Christianity is culturally dominant. Includes Alabama, Mississippi, Tennessee, north Texas, Georgia, the Carolinas and neighboring areas.</p></details>
    <details><summary><strong>What is the "Rust Belt"?</strong></summary><p>The Midwest and Mid-Atlantic region (Detroit, Pittsburgh, Cleveland...) where heavy industry flourished and then declined from the 1970s. "Rust" symbolizes abandoned factories.</p></details>
    <details><summary><strong>How does the Sun Belt differ from the Rust Belt?</strong></summary><p>They're demographic opposites. The Sun Belt (Florida, Texas, Arizona) grows — warm climate, migration. The Rust Belt (Michigan, Ohio, Pennsylvania) empties — industrial decline, cold.</p></details>
    <details><summary><strong>What is "Tornado Alley"?</strong></summary><p>A north-south strip covering Texas, Oklahoma, Kansas, Nebraska, South Dakota, Iowa. Where most tornadoes in the world form: ~1,000 per year.</p></details>
`,
    faq([
      ["What is the Bible Belt?", "The strip of Southern United States where evangelical Protestant Christianity is culturally dominant. Includes Alabama, Mississippi, Tennessee, parts of Texas and Georgia."],
      ["What is the Rust Belt?", "Midwest and Mid-Atlantic region (Detroit, Pittsburgh, Cleveland) where heavy industry declined from the 1970s. 'Rust' symbolizes abandoned factories."],
      ["What is the Sun Belt?", "Southern and Southwestern states (Florida, Texas, Arizona, Nevada) growing rapidly due to warm climate and internal migration."],
      ["Where is the Corn Belt?", "The Midwest — Iowa, Illinois, Indiana, Nebraska, southern Missouri, southern Minnesota. Corn and soybean production."],
    ]),
    `[{"@type":"ListItem","position":1,"name":"Home","item":"https://statedoku.com/"},{"@type":"ListItem","position":2,"name":"Learn","item":"https://statedoku.com/learn/"},{"@type":"ListItem","position":3,"name":"US cultural belts","item":"https://statedoku.com/learn/us-cultural-belts/"}]`,
    '/learn/', 'Learn', relatedEN, hreflangEN('us-cultural-belts'), footerEN, 'en_US'
  )
]);

// ── E1: ES /es/learn/sistema-federal-eeuu/ ───────────────────────────────
out.push(['es/learn/sistema-federal-eeuu',
  wrap('es', 'sistema-federal-eeuu',
    'El sistema federal de EE.UU. — cómo funciona el gobierno (2026) | Statedoku',
    'Cómo funciona el sistema federal de Estados Unidos: tres poderes (ejecutivo, legislativo, judicial), división federal vs estatal, los 3 niveles de gobierno. Guía clara.',
    'sistema federal estados unidos, gobierno federal eeuu, tres poderes estados unidos, separación poderes eeuu, federalismo americano',
    'El sistema federal de EE.UU.',
    'Cómo se divide el poder entre el gobierno federal, los 50 estados y los municipios. La estructura única del país.',
`    <p>Estados Unidos es una <strong>república federal</strong> con un sistema de gobierno único en el mundo. El poder se reparte en <strong>3 niveles</strong> (federal, estatal, local) y <strong>3 ramas</strong> (ejecutiva, legislativa, judicial). La Constitución de 1787 lo establece.</p>

    <h2>Los 3 niveles de gobierno</h2>
    <h3>1. Federal (nacional)</h3>
    <p>Gobierno con sede en Washington D.C. Responsable de defensa, política exterior, moneda, correo, inmigración, comercio interestatal. Sus 3 ramas son la presidencia (ejecutivo), el Congreso (legislativo), y la Corte Suprema (judicial).</p>

    <h3>2. Estatal</h3>
    <p>Cada uno de los 50 estados tiene su propia constitución, gobernador, legislatura bicameral (excepto Nebraska, unicameral), y cortes. Compete en educación, transporte, salud pública, código penal, impuesto sobre la renta estatal.</p>

    <h3>3. Local (condados + municipios)</h3>
    <p>Más de 3,000 condados y decenas de miles de municipios. Maneja policía local, escuelas primarias, parques, recolección de basura. Estructura varía mucho entre estados.</p>

    <h2>Las 3 ramas del gobierno federal</h2>

    <h3>Rama ejecutiva — el presidente</h3>
    <ul>
      <li>Presidente y vicepresidente, elegidos cada 4 años vía <a href="/es/learn/colegio-electoral/">Colegio Electoral</a>.</li>
      <li>Gabinete: 15 secretarios (Estado, Defensa, Tesoro, etc.).</li>
      <li>Agencias federales: FBI, CIA, EPA, NASA, IRS, Pentágono.</li>
      <li>Veta leyes del Congreso, comanda las fuerzas armadas.</li>
    </ul>

    <h3>Rama legislativa — el Congreso</h3>
    <ul>
      <li><strong>Cámara de Representantes:</strong> 435 miembros, elegidos por 2 años. Cada estado tiene un número proporcional a su población.</li>
      <li><strong>Senado:</strong> 100 senadores (2 por estado), elegidos por 6 años. Cada estado tiene igual representación, independientemente de su tamaño.</li>
      <li>Hacen las leyes, declaran guerra, controlan el presupuesto, ratifican tratados.</li>
    </ul>

    <h3>Rama judicial — Corte Suprema</h3>
    <ul>
      <li>9 magistrados nombrados por el presidente y confirmados por el Senado.</li>
      <li>Cargos vitalicios.</li>
      <li>Interpretan la Constitución, pueden declarar inconstitucional cualquier ley federal o estatal.</li>
    </ul>

    <h2>Federal vs estatal: ¿quién hace qué?</h2>
    <table class="lt">
      <thead><tr><th>Tema</th><th>¿Quién decide?</th></tr></thead>
      <tbody>
        <tr><td>Pasaportes / inmigración</td><td>Federal</td></tr>
        <tr><td>Moneda (dólar)</td><td>Federal</td></tr>
        <tr><td>Defensa nacional</td><td>Federal</td></tr>
        <tr><td>Correo postal</td><td>Federal (USPS)</td></tr>
        <tr><td>Carné de conducir</td><td>Estatal</td></tr>
        <tr><td>Educación pública (K-12)</td><td>Estatal + local</td></tr>
        <tr><td>Edad legal para alcohol</td><td>Federal (21 desde 1984)</td></tr>
        <tr><td>Edad legal para conducir</td><td>Estatal (16 generalmente)</td></tr>
        <tr><td>Pena de muerte</td><td>Estatal (legal en 27 estados)</td></tr>
        <tr><td>Matrimonio</td><td>Estatal (legalizado federalmente desde 2015)</td></tr>
        <tr><td>Marihuana</td><td>Estatal (legal en 24 estados, ilegal federalmente)</td></tr>
        <tr><td>Impuesto sobre la renta</td><td>Federal + estatal (los hay sin impuesto estatal)</td></tr>
      </tbody>
    </table>

    <h2>Por qué importa la diferencia</h2>
    <p>Un mismo acto puede ser legal en California y ilegal en Texas. Un mismo medicamento puede aprobarse a nivel federal (FDA) pero estar regulado distinto por estado. Por eso EE.UU. parece "varios países en uno".</p>

    <div class="cta-card">
      <h3>Aprende las diferencias estado a estado</h3>
      <p>Statedoku usa "Pena de muerte legal" o "Estado sin impuesto" como pistas. Aprende derecho comparado sin estudiarlo.</p>
      <a href="/es/">Jugar el puzzle de hoy →</a>
    </div>

    <h2>Preguntas frecuentes</h2>
    <details><summary><strong>¿Cuántos estados tiene EE.UU.?</strong></summary><p>50 estados + Washington D.C. (distrito federal) + 5 territorios habitados (Puerto Rico, Guam, Islas Vírgenes, Samoa, Marianas).</p></details>
    <details><summary><strong>¿Cuál es la diferencia entre EE.UU. y un país unitario?</strong></summary><p>En un país unitario (Francia, España, China), el gobierno central decide casi todo. En EE.UU. los estados conservan poderes propios. Por eso un mexicano que llega a EE.UU. encuentra leyes muy distintas entre California y Texas.</p></details>
    <details><summary><strong>¿Quién tiene más poder, el presidente o el Congreso?</strong></summary><p>Depende. El presidente comanda el ejército y vetará leyes. El Congreso aprueba el presupuesto y puede destituirlo (impeachment). Por diseño, ambos se balancean (checks and balances).</p></details>
    <details><summary><strong>¿Puede un estado salir de EE.UU.?</strong></summary><p>Legalmente no — la Corte Suprema falló en 1869 (Texas v. White) que la Unión es perpetua. Texas y otros lo intentaron en la Guerra Civil (1861-65) y perdieron.</p></details>
`,
    faq([
      ['¿Cómo funciona el sistema federal de EE.UU.?', 'EE.UU. tiene 3 niveles de gobierno (federal, estatal, local) y 3 ramas (ejecutiva, legislativa, judicial). El federal maneja defensa, política exterior, moneda. Cada estado tiene su propia constitución y leyes.'],
      ['¿Cuáles son los 3 poderes del gobierno?', 'Ejecutivo (presidente), Legislativo (Congreso = Cámara + Senado), Judicial (Corte Suprema con 9 magistrados vitalicios).'],
      ['¿Cuántos estados tiene EE.UU.?', '50 estados, más Washington D.C. (distrito federal) y 5 territorios habitados.'],
      ['¿Quién tiene poder en EE.UU., el federal o los estados?', 'Depende del tema. Defensa, inmigración, moneda → federal. Educación, código penal, conducir → estatal. La 10ª Enmienda da a los estados todos los poderes no expresamente federales.'],
    ]),
    `[{"@type":"ListItem","position":1,"name":"Inicio","item":"https://statedoku.com/es/"},{"@type":"ListItem","position":2,"name":"Aprender","item":"https://statedoku.com/es/learn/"},{"@type":"ListItem","position":3,"name":"Sistema federal de EE.UU.","item":"https://statedoku.com/es/learn/sistema-federal-eeuu/"}]`,
    '/es/learn/', 'Aprender', relatedES, hreflangES('sistema-federal-eeuu'), footerES, 'es_ES'
  )
]);

// ── E2: ES /es/learn/padres-fundadores/ ──────────────────────────────────
out.push(['es/learn/padres-fundadores',
  wrap('es', 'padres-fundadores',
    'Los Padres Fundadores de EE.UU. — quiénes fueron y qué hicieron (2026) | Statedoku',
    'Los Padres Fundadores de Estados Unidos: Washington, Jefferson, Franklin, Adams, Hamilton, Madison y otros. Quiénes fueron, qué firmaron, y por qué siguen importando hoy.',
    'padres fundadores eeuu, founding fathers, george washington, thomas jefferson, benjamin franklin, declaración independencia eeuu',
    'Los Padres Fundadores',
    'Quiénes fueron, qué firmaron, y cuál es su legado. Los 7 hombres clave que crearon Estados Unidos.',
`    <p>Los <strong>"Padres Fundadores"</strong> (Founding Fathers) son los hombres que lideraron la independencia de Estados Unidos y redactaron la Constitución entre 1776 y 1789. No hay lista oficial, pero 7 nombres aparecen en casi todos los listados serios.</p>

    <h2>Los 7 Padres Fundadores clave</h2>

    <h3>George Washington (1732-1799) — Virginia</h3>
    <p>General comandante del ejército continental durante la Guerra de Independencia. Primer presidente (1789-1797). Refuso un tercer mandato, estableciendo la tradición de los 2 mandatos (formalizada en la 22ª Enmienda de 1951). Su rostro está en el billete de 1 dólar y la moneda de 25 centavos.</p>

    <h3>Thomas Jefferson (1743-1826) — Virginia</h3>
    <p>Autor principal de la <a href="/es/learn/colonias-originales/">Declaración de Independencia</a> (1776). Tercer presidente (1801-1809). Negoció la Compra de Luisiana (1803), duplicando el tamaño del país. Murió el 4 de julio de 1826, exactamente 50 años después de la independencia.</p>

    <h3>Benjamin Franklin (1706-1790) — Pensilvania</h3>
    <p>El más viejo de los Padres. Inventor (pararrayos, lentes bifocales), impresor, diplomático. Negoció el apoyo francés durante la guerra (decisivo para la victoria). Único que firmó las 4 documentos fundadores: Declaración de Independencia (1776), Tratado de Alianza con Francia (1778), Tratado de París (1783), Constitución (1787).</p>

    <h3>John Adams (1735-1826) — Massachusetts</h3>
    <p>Defensor de los soldados británicos tras la Masacre de Boston (1770) — paradoja famosa. Segundo presidente (1797-1801). Padre de John Quincy Adams (6º presidente). Murió el mismo día que Jefferson, el 4 de julio de 1826.</p>

    <h3>Alexander Hamilton (1755-1804) — Nueva York</h3>
    <p>Inmigrante caribeño (nacido en Nevis). Primer Secretario del Tesoro, creó el sistema bancario nacional. Defendió la Constitución en los Federalist Papers (con Madison y Jay). Murió en duelo contra Aaron Burr en 1804. Su musical de Broadway lo reintrodujo culturalmente en 2015.</p>

    <h3>James Madison (1751-1836) — Virginia</h3>
    <p>"Padre de la Constitución" — su redacción se basa en sus notas. Autor de la Carta de Derechos (Bill of Rights — las primeras 10 enmiendas). Cuarto presidente (1809-1817). Estuvo durante el incendio de la Casa Blanca en 1814 (Guerra anglo-estadounidense).</p>

    <h3>John Jay (1745-1829) — Nueva York</h3>
    <p>Primer presidente de la Corte Suprema (1789-1795). Negoció el Tratado de París con Franklin. Co-autor de los Federalist Papers. Anti-esclavista activo en una época donde era raro entre los Padres.</p>

    <h2>Otros Padres importantes (la "lista larga")</h2>
    <ul>
      <li><strong>Samuel Adams</strong> (Massachusetts) — radical, organizó la Boston Tea Party (1773).</li>
      <li><strong>Patrick Henry</strong> (Virginia) — "Give me liberty or give me death".</li>
      <li><strong>John Hancock</strong> (Massachusetts) — su firma gigante en la Declaración de Independencia (la única visible sin lupa, en señal de coraje).</li>
      <li><strong>Roger Sherman</strong> (Connecticut) — único que firmó los 3 documentos fundadores principales.</li>
      <li><strong>Gouverneur Morris</strong> (Pensilvania) — redactó el preámbulo de la Constitución ("We the People").</li>
    </ul>

    <h2>Sus contradicciones</h2>
    <p>Muchos de los Padres eran <strong>esclavistas</strong> — Jefferson tenía más de 600 personas esclavizadas a lo largo de su vida. Washington liberó a sus esclavos en su testamento. Esta tensión entre los ideales de libertad e igualdad y la práctica de la esclavitud es la "contradicción fundadora" de EE.UU.</p>

    <h2>Por qué siguen importando</h2>
    <p>Los Padres redactaron una Constitución que sigue vigente hoy — la más antigua del mundo todavía en uso. Solo se ha enmendado 27 veces en 230+ años. Cada conflicto político actual en EE.UU. termina remontándose a "¿qué querían los Founding Fathers?". Esa cultura constitucional es única en el mundo.</p>

    <div class="cta-card">
      <h3>Aprende EE.UU. por sus orígenes</h3>
      <p>Statedoku usa pistas como "Estado natal de Washington" (Virginia) o "una de las 13 colonias" en su puzzle diario.</p>
      <a href="/es/">Jugar el puzzle de hoy →</a>
    </div>

    <h2>Preguntas frecuentes</h2>
    <details><summary><strong>¿Cuántos Padres Fundadores hay?</strong></summary><p>No hay número oficial. La lista corta tiene 7 (Washington, Jefferson, Franklin, Adams, Hamilton, Madison, Jay). La lista extendida incluye 50+ firmantes de la Declaración + la Constitución.</p></details>
    <details><summary><strong>¿Cuál fue el más importante?</strong></summary><p>Washington (sin él habrían perdido la guerra) y Madison (sin él no habría Constitución). Empate en importancia.</p></details>
    <details><summary><strong>¿Eran esclavistas?</strong></summary><p>La mayoría sí: Washington, Jefferson, Madison, Adams del sur. Excepciones: Franklin (anti-esclavista al final de su vida), John Jay, Hamilton.</p></details>
    <details><summary><strong>¿Qué estado tiene más Padres Fundadores?</strong></summary><p>Virginia: Washington, Jefferson, Madison, Patrick Henry, George Mason. Por eso se llama la "Virginia Dynasty" (4 de los primeros 5 presidentes son de Virginia).</p></details>
`,
    faq([
      ['¿Quiénes son los Padres Fundadores de EE.UU.?', 'Los 7 principales son: George Washington, Thomas Jefferson, Benjamin Franklin, John Adams, Alexander Hamilton, James Madison, John Jay. Lideraron la independencia y redactaron la Constitución entre 1776 y 1789.'],
      ['¿Qué firmó Benjamin Franklin?', 'Franklin es el único que firmó los 4 documentos fundadores: Declaración de Independencia (1776), Tratado de Alianza con Francia (1778), Tratado de París (1783), Constitución (1787).'],
      ['¿Cuándo murieron Jefferson y Adams?', 'Ambos murieron el 4 de julio de 1826 — el 50º aniversario exacto de la Declaración de Independencia. Coincidencia histórica famosa.'],
      ['¿Qué estado tiene más Padres Fundadores?', 'Virginia: Washington, Jefferson, Madison, Patrick Henry, George Mason. La "Virginia Dynasty" dominó la presidencia temprana de EE.UU.'],
    ]),
    `[{"@type":"ListItem","position":1,"name":"Inicio","item":"https://statedoku.com/es/"},{"@type":"ListItem","position":2,"name":"Aprender","item":"https://statedoku.com/es/learn/"},{"@type":"ListItem","position":3,"name":"Padres Fundadores","item":"https://statedoku.com/es/learn/padres-fundadores/"}]`,
    '/es/learn/', 'Aprender', relatedES, hreflangES('padres-fundadores'), footerES, 'es_ES'
  )
]);

// ── E3-E5: 3 more ES + 5 FR (compact, body-focused) ──────────────────────

const ES_RIOS_BODY = `    <p>Los <strong>10 ríos más largos de Estados Unidos</strong> dan forma a la geografía, la historia y la economía del país. El Misisipi, con sus afluentes, drena 31 de los 50 estados.</p>
    <h2>Los 10 ríos más largos</h2>
    <table class="lt">
      <thead><tr><th>#</th><th>Río</th><th>Longitud</th><th>Estados que atraviesa</th></tr></thead>
      <tbody>
        <tr><td>1</td><td><strong>Misuri</strong></td><td>3,767 km</td><td>MT, ND, SD, NE, IA, MO, KS (desemboca en el Misisipi)</td></tr>
        <tr><td>2</td><td><strong>Misisipi</strong></td><td>3,734 km</td><td>MN, WI, IA, IL, MO, KY, TN, AR, MS, LA</td></tr>
        <tr><td>3</td><td><strong>Yukón</strong></td><td>3,185 km</td><td>Alaska (+ Yukón, Canadá)</td></tr>
        <tr><td>4</td><td><strong>Río Grande</strong></td><td>3,051 km</td><td>CO, NM, TX (frontera con México)</td></tr>
        <tr><td>5</td><td>Arkansas</td><td>2,364 km</td><td>CO, KS, OK, AR (afluente del Misisipi)</td></tr>
        <tr><td>6</td><td>Colorado</td><td>2,330 km</td><td>CO, UT, AZ, NV, CA (atravesando el Gran Cañón)</td></tr>
        <tr><td>7</td><td>Ohio</td><td>1,579 km</td><td>PA, OH, WV, KY, IN, IL (afluente del Misisipi)</td></tr>
        <tr><td>8</td><td>Columbia</td><td>2,000 km</td><td>WA, OR (+ Canadá)</td></tr>
        <tr><td>9</td><td>Snake</td><td>1,735 km</td><td>WY, ID, OR, WA (afluente del Columbia)</td></tr>
        <tr><td>10</td><td>Red River of the South</td><td>2,190 km</td><td>NM, TX, OK, AR, LA</td></tr>
      </tbody>
    </table>

    <h2>El sistema Misisipi-Misuri</h2>
    <p>El sistema más grande de Norteamérica. Si se cuentan como uno solo (lo cual hacen los geógrafos), totaliza ~6,275 km — entre los 5 sistemas fluviales más largos del mundo. Drena 41% del territorio continental de EE.UU. y el centro económico del país (la agricultura del <a href="/es/learn/cinturones-eeuu/">Corn Belt</a>).</p>

    <h2>Río Grande: frontera con México</h2>
    <p>Forma 2,000 km de frontera entre Texas y México. En la frontera lo llaman "Rio Bravo" del lado mexicano. Atraviesa <a href="/es/learn/regiones-de-eeuu/">3 regiones distintas</a>: nace en las Rocosas (Colorado), atraviesa el desierto (New Mexico, Texas), termina en el Golfo de México.</p>

    <h2>El Yukón: el más norteño</h2>
    <p>Solo río importante de Alaska. Era la ruta de la Fiebre del Oro de Klondike (1896-99). Su nombre viene del idioma gwich'in y significa "gran río".</p>

    <div class="cta-card">
      <h3>Aprende los ríos jugando</h3>
      <p>Statedoku usa "Atravesado por el Misisipi" o "Frontera con México" como pistas. Geografía fluvial sin esfuerzo.</p>
      <a href="/es/">Jugar el puzzle de hoy →</a>
    </div>

    <h2>Preguntas frecuentes</h2>
    <details><summary><strong>¿Cuál es el río más largo de EE.UU.?</strong></summary><p>El Misuri (3,767 km) es técnicamente más largo que el Misisipi (3,734 km). Pero los dos juntos forman el sistema fluvial más importante del país.</p></details>
    <details><summary><strong>¿Qué estados atraviesa el Misisipi?</strong></summary><p>10 estados: Minnesota (nace), Wisconsin, Iowa, Illinois, Missouri, Kentucky, Tennessee, Arkansas, Mississippi, Louisiana (desemboca en el Golfo de México).</p></details>
    <details><summary><strong>¿El Río Grande es lo mismo que el Rio Bravo?</strong></summary><p>Sí. "Rio Grande" en EE.UU., "Rio Bravo" en México. Misma frontera, dos nombres.</p></details>
`;

out.push(['es/learn/rios-mas-largos-eeuu',
  wrap('es', 'rios-mas-largos-eeuu',
    'Los 10 ríos más largos de EE.UU. — Misisipi, Misuri, Río Grande (2026) | Statedoku',
    'Los ríos más largos de Estados Unidos: Misuri (3,767 km), Misisipi (3,734 km), Yukón, Río Grande, Colorado. Qué estados atraviesan, datos clave, historia.',
    'rios mas largos estados unidos, rio misisipi, rio misuri, rio grande, rio colorado, geografia fluvial eeuu',
    'Los ríos más largos de EE.UU.',
    'Misuri, Misisipi, Yukón, Río Grande, Colorado — los 10 ríos que dan forma a la geografía estadounidense.',
    ES_RIOS_BODY,
    faq([
      ['¿Cuál es el río más largo de Estados Unidos?', 'El Río Misuri, con 3,767 km. Es ligeramente más largo que el Misisipi (3,734 km). Juntos forman el sistema fluvial más importante de Norteamérica.'],
      ['¿Qué estados atraviesa el Misisipi?', 'El río Misisipi atraviesa 10 estados: Minnesota (nacimiento), Wisconsin, Iowa, Illinois, Missouri, Kentucky, Tennessee, Arkansas, Mississippi, Louisiana (desembocadura).'],
      ['¿Cuál es el río fronterizo con México?', 'El Río Grande (llamado Rio Bravo en México). Forma 2,000 km de frontera entre Texas y México.'],
      ['¿Cuál es el río principal del oeste americano?', 'El Río Colorado, 2,330 km. Atraviesa Colorado, Utah, Arizona, Nevada y California. Pasa por el Gran Cañón.'],
    ]),
    `[{"@type":"ListItem","position":1,"name":"Inicio","item":"https://statedoku.com/es/"},{"@type":"ListItem","position":2,"name":"Aprender","item":"https://statedoku.com/es/learn/"},{"@type":"ListItem","position":3,"name":"Ríos más largos","item":"https://statedoku.com/es/learn/rios-mas-largos-eeuu/"}]`,
    '/es/learn/', 'Aprender', relatedES, hreflangES('rios-mas-largos-eeuu'), footerES, 'es_ES'
  )
]);

const ES_MONTANAS_BODY = `    <p>Estados Unidos tiene <strong>10 montañas de más de 4,000 metros</strong> (todas en Alaska o el Oeste). El <strong>Denali</strong> (antes Mount McKinley) es la cima más alta de Norteamérica con 6,190 metros.</p>

    <h2>Las 10 cumbres más altas</h2>
    <table class="lt">
      <thead><tr><th>#</th><th>Cumbre</th><th>Altitud</th><th>Estado</th></tr></thead>
      <tbody>
        <tr><td>1</td><td><strong>Denali</strong> (Mt. McKinley)</td><td>6,190 m</td><td>Alaska</td></tr>
        <tr><td>2</td><td>Mt. Saint Elias</td><td>5,489 m</td><td>Alaska/Yukón</td></tr>
        <tr><td>3</td><td>Mt. Foraker</td><td>5,304 m</td><td>Alaska</td></tr>
        <tr><td>4</td><td>Mt. Bona</td><td>5,005 m</td><td>Alaska</td></tr>
        <tr><td>5</td><td>Mt. Whitney</td><td>4,421 m</td><td>California</td></tr>
        <tr><td>6</td><td>Mt. Elbert</td><td>4,401 m</td><td>Colorado</td></tr>
        <tr><td>7</td><td>Mt. Massive</td><td>4,396 m</td><td>Colorado</td></tr>
        <tr><td>8</td><td>Mt. Harvard</td><td>4,395 m</td><td>Colorado</td></tr>
        <tr><td>9</td><td>Mt. Rainier</td><td>4,392 m</td><td>Washington</td></tr>
        <tr><td>10</td><td>Mt. Blanca Peak</td><td>4,374 m</td><td>Colorado</td></tr>
      </tbody>
    </table>

    <h2>Las grandes cordilleras</h2>

    <h3>Rocky Mountains (Rocosas)</h3>
    <p>La columna vertebral del Oeste. Se extiende desde Nuevo México hasta Alaska a través de <a href="/es/learn/regiones-de-eeuu/">8 estados</a>: NM, CO, UT, WY, MT, ID + parte de Idaho y Washington. Contiene la mayoría de las cumbres de 4,000m+ del país continental.</p>

    <h3>Sierra Nevada</h3>
    <p>California oriental. Contiene Mt. Whitney (4,421m, cumbre más alta del país sin contar Alaska) y el Parque Nacional Yosemite. Climáticamente crea el desierto de Mojave a su este (sombra orográfica).</p>

    <h3>Cascade Range (Cascadas)</h3>
    <p>Washington, Oregón, norte de California. Cordillera volcánica: Mt. Rainier (4,392m), Mt. Hood (Oregón), Mt. Shasta (California). El Mt. St. Helens explotó en 1980 (la erupción más destructora del siglo XX en EE.UU.).</p>

    <h3>Appalachian Mountains (Apalaches)</h3>
    <p>La cordillera del Este. Mucho más baja que las del Oeste — pico más alto: Mt. Mitchell (Carolina del Norte) a 2,037m. Se extiende desde Alabama hasta Maine. Más antigua geológicamente.</p>

    <h2>Cumbres por nivel de estado (highpoint highest)</h2>
    <ul>
      <li><strong>Alaska:</strong> Denali (6,190 m) — el más alto del país.</li>
      <li><strong>California:</strong> Mt. Whitney (4,421 m).</li>
      <li><strong>Colorado:</strong> Mt. Elbert (4,401 m).</li>
      <li><strong>Washington:</strong> Mt. Rainier (4,392 m).</li>
      <li><strong>Wyoming:</strong> Gannett Peak (4,209 m).</li>
      <li><strong>Hawái:</strong> Mauna Kea (4,207 m).</li>
      <li><strong>Texas:</strong> Guadalupe Peak (2,667 m) — sorprendentemente alto para Texas.</li>
      <li><strong>Florida:</strong> Britton Hill (105 m) — el más bajo "highpoint" del país.</li>
    </ul>

    <div class="cta-card">
      <h3>Aprende las cumbres jugando</h3>
      <p>Statedoku usa "Rocky Mountains" o "Appalachian Mountains" como pistas en su puzzle.</p>
      <a href="/es/">Jugar el puzzle de hoy →</a>
    </div>

    <h2>Preguntas frecuentes</h2>
    <details><summary><strong>¿Cuál es la montaña más alta de EE.UU.?</strong></summary><p>El Denali en Alaska (6,190 m), antes llamado Mount McKinley. Es también la cima más alta de Norteamérica.</p></details>
    <details><summary><strong>¿Cuál es la cima más alta sin contar Alaska?</strong></summary><p>Mt. Whitney en California (4,421 m). Está en la Sierra Nevada.</p></details>
    <details><summary><strong>¿Qué estado tiene más cumbres altas?</strong></summary><p>Colorado tiene 53 "fourteeners" (cumbres de más de 14,000 pies / 4,267 m), más que ningún otro estado del país continental.</p></details>
    <details><summary><strong>¿Por qué los Apalaches son más bajos?</strong></summary><p>Son geológicamente mucho más viejos (450 millones de años, vs 70 millones para las Rocosas). El tiempo y la erosión los han desgastado.</p></details>
`;

out.push(['es/learn/montanas-mas-altas-eeuu',
  wrap('es', 'montanas-mas-altas-eeuu',
    'Las 10 montañas más altas de EE.UU. — Denali, Whitney, Rainier (2026) | Statedoku',
    'Las montañas más altas de Estados Unidos: Denali (6,190 m), Mt. Whitney, Mt. Rainier, las Rocosas, Sierra Nevada y Cascadas. Datos, estados y altitudes.',
    'montañas mas altas estados unidos, denali, mt mckinley, mt whitney, mt rainier, rocky mountains, sierra nevada',
    'Las montañas más altas de EE.UU.',
    'Denali, Whitney, Rainier — las cumbres que dominan el continente americano.',
    ES_MONTANAS_BODY,
    faq([
      ['¿Cuál es la montaña más alta de Estados Unidos?', 'El Denali en Alaska, con 6,190 metros (20,310 pies). Antes se llamaba Mount McKinley. Es también el pico más alto de Norteamérica.'],
      ['¿Cuál es la montaña más alta sin contar Alaska?', 'Mt. Whitney en California, con 4,421 metros. Está en la cordillera Sierra Nevada.'],
      ['¿Cuántas cumbres de más de 14,000 pies hay en EE.UU.?', 'Más de 70, llamadas "fourteeners". Colorado tiene 53, California tiene 12, el resto están repartidas en Washington, Alaska y Wyoming.'],
      ['¿Cuál es el pico más alto de los Apalaches?', 'Mt. Mitchell en Carolina del Norte, con 2,037 metros. Mucho más bajo que las Rocosas — los Apalaches son una cordillera muy antigua y erosionada.'],
    ]),
    `[{"@type":"ListItem","position":1,"name":"Inicio","item":"https://statedoku.com/es/"},{"@type":"ListItem","position":2,"name":"Aprender","item":"https://statedoku.com/es/learn/"},{"@type":"ListItem","position":3,"name":"Montañas más altas","item":"https://statedoku.com/es/learn/montanas-mas-altas-eeuu/"}]`,
    '/es/learn/', 'Aprender', relatedES, hreflangES('montanas-mas-altas-eeuu'), footerES, 'es_ES'
  )
]);

const ES_PRES_BODY = `    <p>Los <strong>46 presidentes de EE.UU.</strong> han nacido en solo <strong>21 estados distintos</strong>. Virginia y Ohio lideran con 8 y 7 presidentes respectivamente. 29 estados nunca han producido un presidente.</p>

    <h2>Estados que han producido más presidentes</h2>
    <table class="lt">
      <thead><tr><th>Estado</th><th>Presidentes</th><th>Ejemplos</th></tr></thead>
      <tbody>
        <tr><td><strong>Virginia</strong></td><td>8</td><td>Washington, Jefferson, Madison, Monroe, W.H. Harrison, Tyler, Taylor, Wilson</td></tr>
        <tr><td><strong>Ohio</strong></td><td>7</td><td>Grant, Hayes, Garfield, B. Harrison, McKinley, Taft, Harding</td></tr>
        <tr><td>Nueva York</td><td>5</td><td>Van Buren, Fillmore, T. Roosevelt, F.D. Roosevelt, Trump</td></tr>
        <tr><td>Massachusetts</td><td>4</td><td>J. Adams, J.Q. Adams, JFK, G.H.W. Bush (criado)</td></tr>
        <tr><td>Carolina del Norte</td><td>3</td><td>Polk, A. Johnson, Jackson</td></tr>
        <tr><td>Texas</td><td>2</td><td>Eisenhower (nacido), LBJ</td></tr>
        <tr><td>Vermont</td><td>2</td><td>Chester A. Arthur, Calvin Coolidge</td></tr>
      </tbody>
    </table>

    <h2>La "Virginia Dynasty"</h2>
    <p>4 de los primeros 5 presidentes (Washington, Jefferson, Madison, Monroe) eran de Virginia. La excepción es John Adams (Massachusetts). Esta dominación virginiana duró de 1789 a 1825 y reflejaba el peso económico (tabaco, esclavitud) y político del estado.</p>

    <h2>Datos curiosos de geografía presidencial</h2>
    <ul>
      <li><strong>Barack Obama</strong> nacido en Hawái — el primer presidente nacido fuera del territorio continental.</li>
      <li><strong>Joe Biden</strong> de Pensilvania, el actual.</li>
      <li><strong>Bill Clinton</strong> nacido en Arkansas, criado allí, gobernador del estado.</li>
      <li><strong>George W. Bush</strong> nacido en Connecticut, criado en Texas, gobernador de Texas — más asociado a Texas.</li>
      <li><strong>Ronald Reagan</strong> nacido en Illinois, conocido como "Californian" tras gobernador de California.</li>
      <li><strong>Jimmy Carter</strong>: único presidente nacido en Georgia.</li>
      <li><strong>JFK</strong>: único presidente católico hasta Joe Biden (2021).</li>
    </ul>

    <h2>Los 29 estados sin presidente</h2>
    <p>Casi todos los estados del Oeste y muchos del Sur nunca han producido un presidente:</p>
    <p>Alaska, Arizona, Colorado, Delaware, Florida, Idaho, Indiana (técnicamente Benjamin Harrison nació en Ohio, vivió en Indiana), Kansas (Eisenhower criado allí pero nació en Texas), Kentucky (Lincoln nacido allí pero vivió en Illinois), Louisiana, Maine, Maryland, Michigan, Minnesota, Mississippi, Montana, Nebraska, Nevada, Nuevo México, Dakota del Norte, Oklahoma, Oregón, Rhode Island, Carolina del Sur, Dakota del Sur, Tennessee, Utah, Washington, Virginia Occidental, Wisconsin, Wyoming.</p>

    <h2>Estado natal vs estado adoptivo</h2>
    <p>Para los políticos, "su estado" suele ser el de su carrera, no el de su nacimiento. Por ejemplo: Eisenhower nació en Texas pero es "de Kansas". George W. Bush nació en Connecticut pero es "de Texas". Lincoln nació en Kentucky pero es "de Illinois". Es la regla, no la excepción.</p>

    <div class="cta-card">
      <h3>Aprende los presidentes por estado</h3>
      <p>Statedoku usa "Estado natal de Washington" (Virginia) o "Estado de Lincoln" (Illinois) como pistas en el puzzle diario.</p>
      <a href="/es/">Jugar el puzzle de hoy →</a>
    </div>

    <h2>Preguntas frecuentes</h2>
    <details><summary><strong>¿Qué estado ha producido más presidentes?</strong></summary><p>Virginia, con 8 presidentes: Washington, Jefferson, Madison, Monroe, W.H. Harrison, Tyler, Taylor, Wilson.</p></details>
    <details><summary><strong>¿De qué estado es Joe Biden?</strong></summary><p>Joe Biden nació en Scranton, Pensilvania. Pero hizo su carrera política en Delaware (senador 36 años). Se asocia generalmente a Delaware.</p></details>
    <details><summary><strong>¿Hay presidentes nacidos en Texas?</strong></summary><p>Sí: Eisenhower (nacido en Texas, criado en Kansas), Lyndon B. Johnson (texano de pies a cabeza).</p></details>
    <details><summary><strong>¿De dónde es Obama?</strong></summary><p>Barack Obama nació en Honolulu, Hawái (1961). Es el único presidente nacido fuera del territorio continental.</p></details>
`;

out.push(['es/learn/presidentes-por-estado',
  wrap('es', 'presidentes-por-estado',
    'Presidentes de EE.UU. por estado natal — Virginia, Ohio, Nueva York (2026) | Statedoku',
    'Los 46 presidentes de EE.UU. y sus estados natales. Virginia lidera con 8 (Washington, Jefferson, Madison). Ohio con 7. Lista completa y datos curiosos.',
    'presidentes eeuu por estado, estado natal presidentes, virginia presidentes, ohio presidentes, donde nacio obama, donde nacio biden',
    'Presidentes por estado natal',
    'Virginia 8, Ohio 7, Nueva York 5. Los 21 estados que han producido un presidente — y los 29 que nunca.',
    ES_PRES_BODY,
    faq([
      ['¿Qué estado ha producido más presidentes de EE.UU.?', 'Virginia, con 8 presidentes: Washington, Jefferson, Madison, Monroe, W.H. Harrison, Tyler, Taylor y Wilson.'],
      ['¿De qué estado era Lincoln?', 'Abraham Lincoln nació en Kentucky pero hizo su carrera política en Illinois. Se le considera "de Illinois" — el estado se autodenomina "Land of Lincoln".'],
      ['¿De qué estado es Obama?', 'Barack Obama nació en Honolulu, Hawái. Es el único presidente nacido fuera del territorio continental.'],
      ['¿Cuántos estados nunca han tenido un presidente?', '29 estados, principalmente del Oeste y partes del Sur. Florida, Colorado, Arizona, Washington, Oregón, Nevada nunca han producido un presidente.'],
    ]),
    `[{"@type":"ListItem","position":1,"name":"Inicio","item":"https://statedoku.com/es/"},{"@type":"ListItem","position":2,"name":"Aprender","item":"https://statedoku.com/es/learn/"},{"@type":"ListItem","position":3,"name":"Presidentes por estado","item":"https://statedoku.com/es/learn/presidentes-por-estado/"}]`,
    '/es/learn/', 'Aprender', relatedES, hreflangES('presidentes-por-estado'), footerES, 'es_ES'
  )
]);

// ── FR pages — equivalent topics
const FR_SYS_BODY = `    <p>Les États-Unis sont une <strong>république fédérale</strong> avec un système de gouvernement unique au monde. Le pouvoir se répartit sur <strong>3 niveaux</strong> (fédéral, étatique, local) et <strong>3 branches</strong> (exécutive, législative, judiciaire). La Constitution de 1787 l'établit.</p>

    <h2>Les 3 niveaux de gouvernement</h2>
    <h3>1. Fédéral (national)</h3>
    <p>Gouvernement basé à Washington D.C. Responsable de la défense, politique étrangère, monnaie, courrier, immigration, commerce inter-États. Ses 3 branches sont la présidence (exécutif), le Congrès (législatif), et la Cour Suprême (judiciaire).</p>

    <h3>2. Étatique</h3>
    <p>Chacun des 50 États a sa propre constitution, gouverneur, législature bicamérale (sauf le Nebraska, monocaméral), et tribunaux. Compétences : éducation, transport, santé publique, code pénal, impôt sur le revenu étatique.</p>

    <h3>3. Local (comtés + municipalités)</h3>
    <p>Plus de 3,000 comtés et des dizaines de milliers de municipalités. Police locale, écoles primaires, parcs, collecte des déchets. La structure varie beaucoup entre États.</p>

    <h2>Les 3 branches du gouvernement fédéral</h2>

    <h3>Branche exécutive — le président</h3>
    <ul>
      <li>Président et vice-président, élus tous les 4 ans via le <a href="/fr/learn/college-electoral/">Collège Électoral</a>.</li>
      <li>Cabinet : 15 secrétaires (État, Défense, Trésor, etc.).</li>
      <li>Agences fédérales : FBI, CIA, EPA, NASA, IRS, Pentagone.</li>
      <li>Veto sur les lois du Congrès, commande l'armée.</li>
    </ul>

    <h3>Branche législative — le Congrès</h3>
    <ul>
      <li><strong>Chambre des Représentants :</strong> 435 membres, élus pour 2 ans. Chaque État a un nombre proportionnel à sa population.</li>
      <li><strong>Sénat :</strong> 100 sénateurs (2 par État), élus pour 6 ans. Chaque État a une représentation égale, indépendamment de sa taille.</li>
      <li>Font les lois, déclarent la guerre, contrôlent le budget, ratifient les traités.</li>
    </ul>

    <h3>Branche judiciaire — Cour Suprême</h3>
    <ul>
      <li>9 juges nommés par le président et confirmés par le Sénat.</li>
      <li>Mandat à vie.</li>
      <li>Interprètent la Constitution, peuvent déclarer inconstitutionnelle toute loi fédérale ou étatique.</li>
    </ul>

    <h2>Fédéral vs étatique : qui fait quoi ?</h2>
    <table class="lt">
      <thead><tr><th>Sujet</th><th>Qui décide ?</th></tr></thead>
      <tbody>
        <tr><td>Passeports / immigration</td><td>Fédéral</td></tr>
        <tr><td>Monnaie (dollar)</td><td>Fédéral</td></tr>
        <tr><td>Défense nationale</td><td>Fédéral</td></tr>
        <tr><td>Poste</td><td>Fédéral (USPS)</td></tr>
        <tr><td>Permis de conduire</td><td>État</td></tr>
        <tr><td>Éducation publique (K-12)</td><td>État + local</td></tr>
        <tr><td>Âge légal pour l'alcool</td><td>Fédéral (21 ans depuis 1984)</td></tr>
        <tr><td>Âge légal pour conduire</td><td>État (16 ans généralement)</td></tr>
        <tr><td>Peine de mort</td><td>État (légale dans 27 États)</td></tr>
        <tr><td>Mariage</td><td>État (légalisé fédéralement depuis 2015)</td></tr>
        <tr><td>Cannabis</td><td>État (légal dans 24 États, illégal fédéralement)</td></tr>
        <tr><td>Impôt sur le revenu</td><td>Fédéral + État (certains États n'en ont pas)</td></tr>
      </tbody>
    </table>

    <div class="cta-card">
      <h3>Apprenez les différences États en jouant</h3>
      <p>Statedoku utilise "Peine de mort légale" ou "État sans impôt sur le revenu" comme indices dans le puzzle quotidien.</p>
      <a href="/fr/">Jouer le puzzle du jour →</a>
    </div>

    <h2>Questions fréquentes</h2>
    <details><summary><strong>Combien d'États ont les États-Unis ?</strong></summary><p>50 États + Washington D.C. (district fédéral) + 5 territoires habités (Porto Rico, Guam, Îles Vierges, Samoa, Mariannes).</p></details>
    <details><summary><strong>Qui a plus de pouvoir, le président ou le Congrès ?</strong></summary><p>Ça dépend. Le président commande l'armée et peut opposer un veto. Le Congrès vote le budget et peut le destituer (impeachment). Par conception, ils s'équilibrent (checks and balances).</p></details>
    <details><summary><strong>Un État peut-il quitter les États-Unis ?</strong></summary><p>Légalement non — la Cour Suprême a tranché en 1869 (Texas v. White) que l'Union est perpétuelle. Le Texas et d'autres l'ont essayé pendant la Guerre Civile (1861-65) et ont perdu.</p></details>
`;

out.push(['fr/learn/systeme-federal-americain',
  wrap('fr', 'systeme-federal-americain',
    'Le système fédéral américain — comment fonctionne le gouvernement (2026) | Statedoku',
    'Comment fonctionne le système fédéral des États-Unis : trois pouvoirs (exécutif, législatif, judiciaire), division fédéral vs États, les 3 niveaux de gouvernement. Guide clair.',
    'systeme federal americain, gouvernement etats unis, trois pouvoirs etats unis, federalisme americain',
    'Le système fédéral américain',
    'Comment le pouvoir se répartit entre le gouvernement fédéral, les 50 États et les municipalités. Structure unique au monde.',
    FR_SYS_BODY,
    faq([
      ['Comment fonctionne le système fédéral américain ?', 'Les États-Unis ont 3 niveaux de gouvernement (fédéral, État, local) et 3 branches (exécutive, législative, judiciaire). Le fédéral gère défense, politique étrangère, monnaie. Chaque État a sa propre constitution et ses propres lois.'],
      ['Quels sont les 3 pouvoirs du gouvernement américain ?', 'Exécutif (président), Législatif (Congrès = Chambre + Sénat), Judiciaire (Cour Suprême avec 9 juges à vie).'],
      ['Combien d\'États ont les États-Unis ?', '50 États, plus Washington D.C. (district fédéral) et 5 territoires habités.'],
      ['Qui a le pouvoir, le fédéral ou les États ?', 'Ça dépend du sujet. Défense, immigration, monnaie → fédéral. Éducation, code pénal, conduite → États. Le 10e amendement donne aux États tous les pouvoirs non expressément fédéraux.'],
    ]),
    `[{"@type":"ListItem","position":1,"name":"Accueil","item":"https://statedoku.com/fr/"},{"@type":"ListItem","position":2,"name":"Apprendre","item":"https://statedoku.com/fr/learn/"},{"@type":"ListItem","position":3,"name":"Système fédéral","item":"https://statedoku.com/fr/learn/systeme-federal-americain/"}]`,
    '/fr/learn/', 'Apprendre', relatedFR, hreflangFR('systeme-federal-americain'), footerFR, 'fr_FR'
  )
]);

const FR_PERES_BODY = `    <p>Les <strong>"Pères Fondateurs"</strong> (Founding Fathers) sont les hommes qui ont mené l'indépendance des États-Unis et rédigé la Constitution entre 1776 et 1789. Il n'y a pas de liste officielle, mais 7 noms apparaissent dans presque toutes les listes sérieuses.</p>

    <h2>Les 7 Pères Fondateurs clés</h2>

    <h3>George Washington (1732-1799) — Virginie</h3>
    <p>Général commandant de l'armée continentale pendant la Guerre d'Indépendance. Premier président (1789-1797). A refusé un troisième mandat, établissant la tradition des 2 mandats (formalisée par le 22e amendement de 1951). Son visage est sur le billet de 1 dollar.</p>

    <h3>Thomas Jefferson (1743-1826) — Virginie</h3>
    <p>Auteur principal de la Déclaration d'Indépendance (1776). Troisième président (1801-1809). A négocié l'Achat de la Louisiane (1803), doublant la superficie du pays. Mort le 4 juillet 1826, exactement 50 ans après l'indépendance.</p>

    <h3>Benjamin Franklin (1706-1790) — Pennsylvanie</h3>
    <p>Le plus âgé des Pères. Inventeur (paratonnerre, lunettes bifocales), imprimeur, diplomate. A négocié le soutien français pendant la guerre (décisif). Seul à avoir signé les 4 documents fondateurs : Déclaration d'Indépendance (1776), Traité d'Alliance avec la France (1778), Traité de Paris (1783), Constitution (1787).</p>

    <h3>John Adams (1735-1826) — Massachusetts</h3>
    <p>Avocat des soldats britanniques après le Massacre de Boston (1770) — paradoxe célèbre. Deuxième président (1797-1801). Père de John Quincy Adams (6e président). Mort le même jour que Jefferson, le 4 juillet 1826.</p>

    <h3>Alexander Hamilton (1755-1804) — New York</h3>
    <p>Immigré antillais (né à Nevis). Premier secrétaire au Trésor, a créé le système bancaire national. A défendu la Constitution dans les Federalist Papers (avec Madison et Jay). Mort en duel contre Aaron Burr en 1804. Son musical Broadway l'a remis culturellement sur le devant de la scène en 2015.</p>

    <h3>James Madison (1751-1836) — Virginie</h3>
    <p>"Père de la Constitution" — sa rédaction se base sur ses notes. Auteur de la Déclaration des Droits (Bill of Rights — les 10 premiers amendements). Quatrième président (1809-1817). Présent lors de l'incendie de la Maison Blanche en 1814.</p>

    <h3>John Jay (1745-1829) — New York</h3>
    <p>Premier président de la Cour Suprême (1789-1795). A négocié le Traité de Paris avec Franklin. Co-auteur des Federalist Papers. Anti-esclavagiste actif à une époque où c'était rare parmi les Pères.</p>

    <h2>Leurs contradictions</h2>
    <p>Beaucoup des Pères étaient <strong>esclavagistes</strong> — Jefferson a possédé plus de 600 personnes esclavagisées au cours de sa vie. Washington a libéré ses esclaves dans son testament. Cette tension entre les idéaux de liberté et l'esclavage est la "contradiction fondatrice" des États-Unis.</p>

    <h2>Pourquoi ils comptent encore</h2>
    <p>Les Pères ont rédigé une Constitution qui est toujours en vigueur aujourd'hui — la plus ancienne du monde encore en usage. Elle n'a été amendée que 27 fois en plus de 230 ans. Chaque conflit politique américain actuel finit par revenir à "que voulaient les Pères Fondateurs ?". Cette culture constitutionnelle est unique au monde.</p>

    <div class="cta-card">
      <h3>Apprenez les USA par leur origine</h3>
      <p>Statedoku utilise des indices comme "État natal de Washington" (Virginie) ou "Une des 13 colonies" dans le puzzle quotidien.</p>
      <a href="/fr/">Jouer le puzzle du jour →</a>
    </div>

    <h2>Questions fréquentes</h2>
    <details><summary><strong>Combien de Pères Fondateurs y a-t-il ?</strong></summary><p>Pas de nombre officiel. La liste courte en a 7 (Washington, Jefferson, Franklin, Adams, Hamilton, Madison, Jay). La liste étendue inclut 50+ signataires de la Déclaration + la Constitution.</p></details>
    <details><summary><strong>Lequel a été le plus important ?</strong></summary><p>Washington (sans lui ils auraient perdu la guerre) et Madison (sans lui pas de Constitution). Égalité d'importance.</p></details>
    <details><summary><strong>Étaient-ils esclavagistes ?</strong></summary><p>La majorité oui : Washington, Jefferson, Madison, Adams. Exceptions : Franklin (anti-esclavagiste sur la fin), John Jay, Hamilton.</p></details>
    <details><summary><strong>Quel État a le plus de Pères Fondateurs ?</strong></summary><p>La Virginie : Washington, Jefferson, Madison, Patrick Henry, George Mason. D'où le terme "Virginia Dynasty" (4 des 5 premiers présidents sont de Virginie).</p></details>
`;

out.push(['fr/learn/peres-fondateurs',
  wrap('fr', 'peres-fondateurs',
    'Les Pères Fondateurs américains — qui étaient-ils, qu\'ont-ils fait (2026) | Statedoku',
    'Les Pères Fondateurs des États-Unis : Washington, Jefferson, Franklin, Adams, Hamilton, Madison, Jay. Qui ils étaient, ce qu\'ils ont signé, leur héritage politique.',
    'peres fondateurs americains, founding fathers, george washington, thomas jefferson, benjamin franklin, declaration independance usa',
    'Les Pères Fondateurs américains',
    'Qui ils étaient, ce qu\'ils ont signé, et pourquoi ils comptent encore. Les 7 hommes clés qui ont créé les États-Unis.',
    FR_PERES_BODY,
    faq([
      ['Qui sont les Pères Fondateurs des États-Unis ?', 'Les 7 principaux sont : George Washington, Thomas Jefferson, Benjamin Franklin, John Adams, Alexander Hamilton, James Madison, John Jay. Ils ont mené l\'indépendance et rédigé la Constitution entre 1776 et 1789.'],
      ['Qu\'a signé Benjamin Franklin ?', 'Franklin est le seul à avoir signé les 4 documents fondateurs : Déclaration d\'Indépendance (1776), Traité d\'Alliance avec la France (1778), Traité de Paris (1783), Constitution (1787).'],
      ['Quand sont morts Jefferson et Adams ?', 'Les deux sont morts le 4 juillet 1826 — le 50e anniversaire exact de la Déclaration d\'Indépendance. Coïncidence historique célèbre.'],
      ['Quel État a le plus de Pères Fondateurs ?', 'La Virginie : Washington, Jefferson, Madison, Patrick Henry, George Mason. La "Virginia Dynasty" a dominé la présidence américaine au début.'],
    ]),
    `[{"@type":"ListItem","position":1,"name":"Accueil","item":"https://statedoku.com/fr/"},{"@type":"ListItem","position":2,"name":"Apprendre","item":"https://statedoku.com/fr/learn/"},{"@type":"ListItem","position":3,"name":"Pères Fondateurs","item":"https://statedoku.com/fr/learn/peres-fondateurs/"}]`,
    '/fr/learn/', 'Apprendre', relatedFR, hreflangFR('peres-fondateurs'), footerFR, 'fr_FR'
  )
]);

const FR_RIV_BODY = `    <p>Les <strong>10 fleuves les plus longs des États-Unis</strong> donnent forme à la géographie, l'histoire et l'économie du pays. Le Mississippi et ses affluents drainent 31 des 50 États.</p>
    <h2>Les 10 fleuves les plus longs</h2>
    <table class="lt">
      <thead><tr><th>#</th><th>Fleuve</th><th>Longueur</th><th>États traversés</th></tr></thead>
      <tbody>
        <tr><td>1</td><td><strong>Missouri</strong></td><td>3,767 km</td><td>MT, ND, SD, NE, IA, MO, KS (se jette dans le Mississippi)</td></tr>
        <tr><td>2</td><td><strong>Mississippi</strong></td><td>3,734 km</td><td>MN, WI, IA, IL, MO, KY, TN, AR, MS, LA</td></tr>
        <tr><td>3</td><td><strong>Yukon</strong></td><td>3,185 km</td><td>Alaska (+ Yukon, Canada)</td></tr>
        <tr><td>4</td><td><strong>Rio Grande</strong></td><td>3,051 km</td><td>CO, NM, TX (frontière avec Mexique)</td></tr>
        <tr><td>5</td><td>Arkansas</td><td>2,364 km</td><td>CO, KS, OK, AR (affluent du Mississippi)</td></tr>
        <tr><td>6</td><td>Colorado</td><td>2,330 km</td><td>CO, UT, AZ, NV, CA (traverse le Grand Canyon)</td></tr>
        <tr><td>7</td><td>Columbia</td><td>2,000 km</td><td>WA, OR (+ Canada)</td></tr>
        <tr><td>8</td><td>Ohio</td><td>1,579 km</td><td>PA, OH, WV, KY, IN, IL (affluent du Mississippi)</td></tr>
        <tr><td>9</td><td>Snake</td><td>1,735 km</td><td>WY, ID, OR, WA (affluent du Columbia)</td></tr>
        <tr><td>10</td><td>Red River of the South</td><td>2,190 km</td><td>NM, TX, OK, AR, LA</td></tr>
      </tbody>
    </table>

    <h2>Le système Mississippi-Missouri</h2>
    <p>Le plus grand système fluvial d'Amérique du Nord. Compté comme un seul (ce que font les géographes), il totalise ~6,275 km — parmi les 5 plus longs systèmes fluviaux du monde. Draine 41% du territoire continental américain et le centre économique du pays (l'agriculture du Corn Belt).</p>

    <h2>Le Rio Grande : frontière avec le Mexique</h2>
    <p>Forme 2,000 km de frontière entre le Texas et le Mexique. Appelé "Rio Bravo" côté mexicain. Traverse 3 régions distinctes : naît dans les Rocheuses (Colorado), traverse le désert (Nouveau-Mexique, Texas), se jette dans le golfe du Mexique.</p>

    <div class="cta-card">
      <h3>Apprenez la géographie fluviale en jouant</h3>
      <p>Statedoku utilise "Traversé par le Mississippi" ou "Frontière avec le Mexique" comme indices.</p>
      <a href="/fr/">Jouer le puzzle du jour →</a>
    </div>

    <h2>Questions fréquentes</h2>
    <details><summary><strong>Quel est le fleuve le plus long des États-Unis ?</strong></summary><p>Le Missouri (3,767 km) est techniquement plus long que le Mississippi (3,734 km). Mais les deux ensemble forment le système fluvial le plus important du pays.</p></details>
    <details><summary><strong>Combien d'États traverse le Mississippi ?</strong></summary><p>10 États : Minnesota (source), Wisconsin, Iowa, Illinois, Missouri, Kentucky, Tennessee, Arkansas, Mississippi, Louisiane (embouchure dans le golfe du Mexique).</p></details>
    <details><summary><strong>Le Rio Grande est-il le même que le Rio Bravo ?</strong></summary><p>Oui. "Rio Grande" aux USA, "Rio Bravo" au Mexique. Même frontière, deux noms.</p></details>
`;

out.push(['fr/learn/fleuves-des-etats-unis',
  wrap('fr', 'fleuves-des-etats-unis',
    'Les fleuves les plus longs des États-Unis — Mississippi, Missouri, Rio Grande (2026) | Statedoku',
    'Les fleuves les plus longs des États-Unis : Missouri (3,767 km), Mississippi (3,734 km), Yukon, Rio Grande, Colorado. États traversés, données clés.',
    'fleuves etats unis, mississippi, missouri, rio grande, colorado, fleuves americains, hydrographie usa',
    'Les fleuves des États-Unis',
    'Missouri, Mississippi, Yukon, Rio Grande, Colorado — les 10 fleuves qui dessinent la géographie américaine.',
    FR_RIV_BODY,
    faq([
      ['Quel est le fleuve le plus long des États-Unis ?', 'Le Missouri, avec 3,767 km. Il est légèrement plus long que le Mississippi (3,734 km). Ensemble, ils forment le système fluvial le plus important d\'Amérique du Nord.'],
      ['Quel fleuve forme la frontière avec le Mexique ?', 'Le Rio Grande (appelé Rio Bravo au Mexique). Il forme 2,000 km de frontière entre le Texas et le Mexique.'],
      ['Quel est le fleuve principal de l\'Ouest américain ?', 'Le Colorado, 2,330 km. Il traverse le Colorado, l\'Utah, l\'Arizona, le Nevada et la Californie. Il passe par le Grand Canyon.'],
      ['Combien d\'États le Mississippi traverse-t-il ?', '10 États : Minnesota (source), Wisconsin, Iowa, Illinois, Missouri, Kentucky, Tennessee, Arkansas, Mississippi, Louisiane.'],
    ]),
    `[{"@type":"ListItem","position":1,"name":"Accueil","item":"https://statedoku.com/fr/"},{"@type":"ListItem","position":2,"name":"Apprendre","item":"https://statedoku.com/fr/learn/"},{"@type":"ListItem","position":3,"name":"Fleuves américains","item":"https://statedoku.com/fr/learn/fleuves-des-etats-unis/"}]`,
    '/fr/learn/', 'Apprendre', relatedFR, hreflangFR('fleuves-des-etats-unis'), footerFR, 'fr_FR'
  )
]);

const FR_MONT_BODY = `    <p>Les États-Unis comptent <strong>10 sommets de plus de 4,000 mètres</strong> (tous en Alaska ou dans l'Ouest). Le <strong>Denali</strong> (anciennement Mt McKinley) est le sommet le plus haut d'Amérique du Nord avec 6,190 mètres.</p>

    <h2>Les 10 sommets les plus hauts</h2>
    <table class="lt">
      <thead><tr><th>#</th><th>Sommet</th><th>Altitude</th><th>État</th></tr></thead>
      <tbody>
        <tr><td>1</td><td><strong>Denali</strong> (Mt. McKinley)</td><td>6,190 m</td><td>Alaska</td></tr>
        <tr><td>2</td><td>Mt. Saint Elias</td><td>5,489 m</td><td>Alaska/Yukon</td></tr>
        <tr><td>3</td><td>Mt. Foraker</td><td>5,304 m</td><td>Alaska</td></tr>
        <tr><td>4</td><td>Mt. Bona</td><td>5,005 m</td><td>Alaska</td></tr>
        <tr><td>5</td><td>Mt. Whitney</td><td>4,421 m</td><td>Californie</td></tr>
        <tr><td>6</td><td>Mt. Elbert</td><td>4,401 m</td><td>Colorado</td></tr>
        <tr><td>7</td><td>Mt. Massive</td><td>4,396 m</td><td>Colorado</td></tr>
        <tr><td>8</td><td>Mt. Harvard</td><td>4,395 m</td><td>Colorado</td></tr>
        <tr><td>9</td><td>Mt. Rainier</td><td>4,392 m</td><td>Washington</td></tr>
        <tr><td>10</td><td>Mt. Blanca Peak</td><td>4,374 m</td><td>Colorado</td></tr>
      </tbody>
    </table>

    <h2>Les grandes chaînes de montagnes</h2>

    <h3>Rocky Mountains (Rocheuses)</h3>
    <p>La colonne vertébrale de l'Ouest. S'étend du Nouveau-Mexique jusqu'à l'Alaska à travers 8 États : NM, CO, UT, WY, MT, ID + parties de Washington. Contient la plupart des sommets de 4,000m+ du pays continental.</p>

    <h3>Sierra Nevada</h3>
    <p>Californie orientale. Contient le Mt. Whitney (4,421m, sommet le plus haut du pays sans compter l'Alaska) et le Parc National Yosemite. Crée climatologiquement le désert de Mojave à son est (ombre orographique).</p>

    <h3>Cascade Range (Cascades)</h3>
    <p>Washington, Oregon, nord de la Californie. Chaîne volcanique : Mt. Rainier (4,392m), Mt. Hood (Oregon), Mt. Shasta (Californie). Le Mt. St. Helens a explosé en 1980 (éruption la plus destructrice du XXe siècle aux USA).</p>

    <h3>Appalachian Mountains (Appalaches)</h3>
    <p>La chaîne de l'Est. Bien plus basse que celles de l'Ouest — sommet le plus haut : Mt. Mitchell (Caroline du Nord) à 2,037m. S'étend de l'Alabama jusqu'au Maine. Géologiquement plus ancienne.</p>

    <div class="cta-card">
      <h3>Apprenez les sommets en jouant</h3>
      <p>Statedoku utilise "Rocky Mountains" ou "Appalachian Mountains" comme indices.</p>
      <a href="/fr/">Jouer le puzzle du jour →</a>
    </div>

    <h2>Questions fréquentes</h2>
    <details><summary><strong>Quelle est la montagne la plus haute des USA ?</strong></summary><p>Le Denali en Alaska (6,190 m), anciennement Mount McKinley. C'est aussi le sommet le plus haut d'Amérique du Nord.</p></details>
    <details><summary><strong>Quel est le sommet le plus haut sans compter l'Alaska ?</strong></summary><p>Le Mt. Whitney en Californie (4,421 m). Il est dans la Sierra Nevada.</p></details>
    <details><summary><strong>Quel État a le plus de hauts sommets ?</strong></summary><p>Le Colorado avec 53 "fourteeners" (sommets de plus de 14,000 pieds / 4,267 m), plus que tout autre État du pays continental.</p></details>
    <details><summary><strong>Pourquoi les Appalaches sont-elles plus basses ?</strong></summary><p>Elles sont géologiquement bien plus anciennes (450 millions d'années, contre 70 millions pour les Rocheuses). Le temps et l'érosion les ont usées.</p></details>
`;

out.push(['fr/learn/montagnes-des-etats-unis',
  wrap('fr', 'montagnes-des-etats-unis',
    'Les montagnes les plus hautes des États-Unis — Denali, Whitney, Rainier (2026) | Statedoku',
    'Les montagnes les plus hautes des USA : Denali (6,190 m), Mt. Whitney, Mt. Rainier, les Rocheuses, Sierra Nevada et Cascades. Données, États et altitudes.',
    'montagnes etats unis, denali, mt mckinley, mt whitney, rocheuses, sierra nevada, sommets americains',
    'Les montagnes les plus hautes',
    'Denali, Whitney, Rainier — les sommets qui dominent le continent américain.',
    FR_MONT_BODY,
    faq([
      ['Quelle est la montagne la plus haute des États-Unis ?', 'Le Denali en Alaska, 6,190 mètres (20,310 pieds). Anciennement Mount McKinley. C\'est aussi le sommet le plus haut d\'Amérique du Nord.'],
      ['Quel est le sommet le plus haut hors Alaska ?', 'Mt. Whitney en Californie, 4,421 mètres. Il se situe dans la Sierra Nevada.'],
      ['Combien y a-t-il de sommets de plus de 14,000 pieds aux USA ?', 'Plus de 70, appelés "fourteeners". Le Colorado en compte 53, la Californie 12, le reste réparti entre Washington, l\'Alaska et le Wyoming.'],
      ['Quel est le sommet le plus haut des Appalaches ?', 'Mt. Mitchell en Caroline du Nord, 2,037 mètres. Bien plus bas que les Rocheuses — les Appalaches sont une chaîne très ancienne et érodée.'],
    ]),
    `[{"@type":"ListItem","position":1,"name":"Accueil","item":"https://statedoku.com/fr/"},{"@type":"ListItem","position":2,"name":"Apprendre","item":"https://statedoku.com/fr/learn/"},{"@type":"ListItem","position":3,"name":"Montagnes américaines","item":"https://statedoku.com/fr/learn/montagnes-des-etats-unis/"}]`,
    '/fr/learn/', 'Apprendre', relatedFR, hreflangFR('montagnes-des-etats-unis'), footerFR, 'fr_FR'
  )
]);

const FR_PRES_BODY = `    <p>Les <strong>46 présidents des États-Unis</strong> sont nés dans seulement <strong>21 États différents</strong>. La Virginie et l'Ohio dominent avec 8 et 7 présidents. 29 États n'ont jamais produit de président.</p>

    <h2>États ayant produit le plus de présidents</h2>
    <table class="lt">
      <thead><tr><th>État</th><th>Présidents</th><th>Exemples</th></tr></thead>
      <tbody>
        <tr><td><strong>Virginie</strong></td><td>8</td><td>Washington, Jefferson, Madison, Monroe, W.H. Harrison, Tyler, Taylor, Wilson</td></tr>
        <tr><td><strong>Ohio</strong></td><td>7</td><td>Grant, Hayes, Garfield, B. Harrison, McKinley, Taft, Harding</td></tr>
        <tr><td>New York</td><td>5</td><td>Van Buren, Fillmore, T. Roosevelt, F.D. Roosevelt, Trump</td></tr>
        <tr><td>Massachusetts</td><td>4</td><td>J. Adams, J.Q. Adams, JFK, G.H.W. Bush (élevé)</td></tr>
        <tr><td>Caroline du Nord</td><td>3</td><td>Polk, A. Johnson, Jackson</td></tr>
        <tr><td>Texas</td><td>2</td><td>Eisenhower (né), LBJ</td></tr>
        <tr><td>Vermont</td><td>2</td><td>Chester A. Arthur, Calvin Coolidge</td></tr>
      </tbody>
    </table>

    <h2>La "Virginia Dynasty"</h2>
    <p>4 des 5 premiers présidents (Washington, Jefferson, Madison, Monroe) étaient de Virginie. L'exception est John Adams (Massachusetts). Cette domination virginienne a duré de 1789 à 1825 et reflétait le poids économique (tabac, esclavage) et politique de l'État.</p>

    <h2>Curiosités géographiques présidentielles</h2>
    <ul>
      <li><strong>Barack Obama</strong> né à Hawaï — le premier président né hors du territoire continental.</li>
      <li><strong>Joe Biden</strong> de Pennsylvanie, l'actuel.</li>
      <li><strong>Bill Clinton</strong> né en Arkansas, élevé là, gouverneur de l'État.</li>
      <li><strong>George W. Bush</strong> né dans le Connecticut, élevé au Texas, gouverneur du Texas — plus associé au Texas.</li>
      <li><strong>Ronald Reagan</strong> né en Illinois, connu comme "Californien" après son mandat de gouverneur de Californie.</li>
      <li><strong>Jimmy Carter</strong> : seul président né en Géorgie.</li>
      <li><strong>JFK</strong> : seul président catholique jusqu'à Joe Biden (2021).</li>
    </ul>

    <h2>État natal vs État adoptif</h2>
    <p>Pour les politiciens américains, "leur État" est généralement celui de leur carrière, pas celui de leur naissance. Par exemple : Eisenhower est né au Texas mais est "du Kansas". George W. Bush est né dans le Connecticut mais est "du Texas". Lincoln est né dans le Kentucky mais est "de l'Illinois". C'est la règle, pas l'exception.</p>

    <div class="cta-card">
      <h3>Apprenez les présidents par État</h3>
      <p>Statedoku utilise "État natal de Washington" (Virginie) ou "État de Lincoln" (Illinois) comme indices.</p>
      <a href="/fr/">Jouer le puzzle du jour →</a>
    </div>

    <h2>Questions fréquentes</h2>
    <details><summary><strong>Quel État a produit le plus de présidents ?</strong></summary><p>La Virginie, avec 8 présidents : Washington, Jefferson, Madison, Monroe, W.H. Harrison, Tyler, Taylor, Wilson.</p></details>
    <details><summary><strong>De quel État est Joe Biden ?</strong></summary><p>Joe Biden est né à Scranton, en Pennsylvanie. Mais il a fait sa carrière politique au Delaware (sénateur pendant 36 ans). Il est généralement associé au Delaware.</p></details>
    <details><summary><strong>Y a-t-il des présidents nés au Texas ?</strong></summary><p>Oui : Eisenhower (né au Texas, élevé au Kansas), Lyndon B. Johnson (Texan pur et dur).</p></details>
    <details><summary><strong>D'où est Obama ?</strong></summary><p>Barack Obama est né à Honolulu, Hawaï (1961). C'est le seul président né hors du territoire continental.</p></details>
`;

out.push(['fr/learn/presidents-par-etat',
  wrap('fr', 'presidents-par-etat',
    'Présidents américains par État natal — Virginie, Ohio, New York (2026) | Statedoku',
    'Les 46 présidents américains et leurs États natals. La Virginie en tête avec 8 (Washington, Jefferson, Madison). L\'Ohio avec 7. Liste complète et curiosités.',
    'presidents americains par etat, etat natal president, virginie presidents, ou est ne obama, ou est ne biden',
    'Présidents par État natal',
    'Virginie 8, Ohio 7, New York 5. Les 21 États qui ont produit un président — et les 29 qui n\'en ont jamais eu.',
    FR_PRES_BODY,
    faq([
      ['Quel État a produit le plus de présidents américains ?', 'La Virginie, avec 8 présidents : Washington, Jefferson, Madison, Monroe, W.H. Harrison, Tyler, Taylor et Wilson.'],
      ['De quel État était Lincoln ?', 'Abraham Lincoln est né dans le Kentucky mais a fait sa carrière politique en Illinois. Il est considéré comme "de l\'Illinois" — l\'État se surnomme "Land of Lincoln".'],
      ['D\'où est Obama ?', 'Barack Obama est né à Honolulu, Hawaï. C\'est le seul président né hors du territoire continental américain.'],
      ['Combien d\'États n\'ont jamais eu de président ?', '29 États, principalement de l\'Ouest et de certaines parties du Sud. Floride, Colorado, Arizona, Washington, Oregon, Nevada n\'ont jamais produit de président.'],
    ]),
    `[{"@type":"ListItem","position":1,"name":"Accueil","item":"https://statedoku.com/fr/"},{"@type":"ListItem","position":2,"name":"Apprendre","item":"https://statedoku.com/fr/learn/"},{"@type":"ListItem","position":3,"name":"Présidents par État","item":"https://statedoku.com/fr/learn/presidents-par-etat/"}]`,
    '/fr/learn/', 'Apprendre', relatedFR, hreflangFR('presidents-par-etat'), footerFR, 'fr_FR'
  )
]);

// ── Write all
for (const [rel, html] of out) {
  const dir = path.join(ROOT, rel);
  fs.mkdirSync(dir, { recursive: true });
  fs.writeFileSync(path.join(dir, 'index.html'), html);
  console.log(`✅ /${rel}/`);
}
console.log(`\n${out.length} pages générées (D + E).`);
