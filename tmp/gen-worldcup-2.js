#!/usr/bin/env node
/**
 * World Cup 2026 mega-batch 2 — 30 more articles.
 *
 * Focus: country/team queries (huge volume) + state-focused + topical.
 *
 *   EN country (8): Brazil, England, Germany, Italy, Netherlands, Portugal, USMNT, Canada
 *   ES country (5): Brasil, Uruguay, Chile, Perú, Ecuador
 *   FR country (5): Belgique, Portugal, Allemagne, Pays-Bas, Brésil
 *   EN state-focused (3): California 14 matches, Texas 16, New Jersey hosts final
 *   EN topical (4): groups draw, opening match, tournament dates, USMNT roster
 *   ES city-focused (3): Miami para latinos, Dallas latinoamericano, NYC latino
 *   FR city-focused (2): Miami pour Français, NYC pour Français
 *
 *   = 30 total.
 */
const fs = require('fs');
const path = require('path');

const ROOT = path.resolve(__dirname, '..');

// ── shared styles + hreflang + footers + related grids ──────────────────
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
  <link rel="alternate" hreflang="x-default" href="https://statedoku.com/learn/">`;
const hreflangFR = (slug) => `
  <link rel="canonical" href="https://statedoku.com/fr/learn/${slug}/">
  <link rel="alternate" hreflang="fr" href="https://statedoku.com/fr/learn/${slug}/">
  <link rel="alternate" hreflang="fr-FR" href="https://statedoku.com/fr/learn/${slug}/">
  <link rel="alternate" hreflang="fr-CA" href="https://statedoku.com/fr/learn/${slug}/">
  <link rel="alternate" hreflang="fr-BE" href="https://statedoku.com/fr/learn/${slug}/">
  <link rel="alternate" hreflang="x-default" href="https://statedoku.com/learn/">`;

const footerEN = `<footer><p>Statedoku &copy; 2026 &nbsp;·&nbsp; <a href="/learn/">Learn</a> &nbsp;·&nbsp; <a href="/states/">States</a> &nbsp;·&nbsp; <a href="/faq/">FAQ</a></p></footer>\n<script src="/config.js"></script>\n<script src="/js/admin.js"></script>\n</body></html>`;
const footerES = `<footer><p>Statedoku &copy; 2026 &nbsp;·&nbsp; <a href="/es/learn/">Aprender</a> &nbsp;·&nbsp; <a href="/es/faq/">FAQ</a></p></footer>\n<script src="/config.js"></script>\n<script src="/js/admin.js"></script>\n</body></html>`;
const footerFR = `<footer><p>Statedoku &copy; 2026 &nbsp;·&nbsp; <a href="/fr/learn/">Apprendre</a> &nbsp;·&nbsp; <a href="/fr/faq/">FAQ</a></p></footer>\n<script src="/config.js"></script>\n<script src="/js/admin.js"></script>\n</body></html>`;

const wcRelatedEN = `    <div class="related-grid">
      <a href="/learn/world-cup-2026-us-host-cities/">→ 11 US host cities</a>
      <a href="/learn/world-cup-2026-final-stadium/">→ Final: MetLife Stadium</a>
      <a href="/learn/world-cup-2026-schedule-by-state/">→ Schedule by state</a>
      <a href="/learn/world-cup-2026-stadiums-complete/">→ All 16 stadiums</a>
      <a href="/learn/usmnt-world-cup-2026/">→ USMNT (Team USA)</a>
      <a href="/learn/brazil-world-cup-2026/">→ Brazil at WC 2026</a>
    </div>`;
const wcRelatedES = `    <div class="related-grid">
      <a href="/es/learn/mundial-2026-eeuu/">→ Las 11 ciudades sede</a>
      <a href="/es/learn/mundial-2026-final-metlife/">→ Final: MetLife</a>
      <a href="/es/learn/mexico-mundial-2026/">→ México</a>
      <a href="/es/learn/argentina-mundial-2026/">→ Argentina</a>
      <a href="/es/learn/brasil-mundial-2026/">→ Brasil</a>
      <a href="/es/learn/mundial-2026-boletos-visa/">→ Boletos + visa</a>
    </div>`;
const wcRelatedFR = `    <div class="related-grid">
      <a href="/fr/learn/coupe-du-monde-2026-villes-usa/">→ Les 11 villes hôtes</a>
      <a href="/fr/learn/coupe-du-monde-2026-finale/">→ Finale : MetLife</a>
      <a href="/fr/learn/france-coupe-du-monde-2026/">→ La France</a>
      <a href="/fr/learn/coupe-du-monde-2026-stades/">→ Les 16 stades</a>
      <a href="/fr/learn/coupe-du-monde-2026-voyage-usa/">→ Voyager aux USA</a>
    </div>`;

function wrap(lang, slug, title, desc, kw, h1, sub, body, faqJson, breadcrumb, headerHref, headerLabel, related, hreflang, footer, locale, chip) {
  return `<!DOCTYPE html>
<html lang="${lang}">
<head>
  <meta charset="UTF-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
  <meta name="theme-color" content="#0F2147">
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
    <span class="wc-chip">${chip || '🏆 FIFA WORLD CUP 2026'}</span>
    <h1>${h1}</h1>
    <p class="sub">${sub}</p>
  </section>
  <article class="lt-main">
${body}
    <h2>${lang === 'en' ? 'Related — World Cup 2026 + US' : lang === 'es' ? 'Relacionado — Mundial 2026' : 'À voir aussi — Mondial 2026'}</h2>
${related}
  </article>
</main>
${footer}`;
}

const faq = (qa) => JSON.stringify({
  '@context': 'https://schema.org', '@type': 'FAQPage',
  mainEntity: qa.map(([q, a]) => ({ '@type': 'Question', name: q, acceptedAnswer: { '@type': 'Answer', text: a } })),
});

const breadcrumbEN = (slug, name) => `[{"@type":"ListItem","position":1,"name":"Home","item":"https://statedoku.com/"},{"@type":"ListItem","position":2,"name":"Learn","item":"https://statedoku.com/learn/"},{"@type":"ListItem","position":3,"name":"${name}","item":"https://statedoku.com/learn/${slug}/"}]`;
const breadcrumbES = (slug, name) => `[{"@type":"ListItem","position":1,"name":"Inicio","item":"https://statedoku.com/es/"},{"@type":"ListItem","position":2,"name":"Aprender","item":"https://statedoku.com/es/learn/"},{"@type":"ListItem","position":3,"name":"${name}","item":"https://statedoku.com/es/learn/${slug}/"}]`;
const breadcrumbFR = (slug, name) => `[{"@type":"ListItem","position":1,"name":"Accueil","item":"https://statedoku.com/fr/"},{"@type":"ListItem","position":2,"name":"Apprendre","item":"https://statedoku.com/fr/learn/"},{"@type":"ListItem","position":3,"name":"${name}","item":"https://statedoku.com/fr/learn/${slug}/"}]`;

const out = [];

// ═════════════════════════════════════════════════════════════════════════
// EN COUNTRY PAGES — 8
// ═════════════════════════════════════════════════════════════════════════

const enCountries = [
  {
    slug: 'brazil-world-cup-2026', name: 'Brazil', flag: '🇧🇷',
    titles: 5, lastTitle: '2002', stars: 'Vinicius Jr, Rodrygo, Raphinha, Casemiro, Endrick',
    coach: 'Dorival Júnior', bestExpat: 'Largest Brazilian community in US: Florida (~360k), Massachusetts (~120k), NJ (~110k)',
    keyMatches: 'Brazil tipped to play in a New York/MetLife group + later rounds. Miami is also a likely Brazilian base — large diaspora.',
  },
  {
    slug: 'england-world-cup-2026', name: 'England', flag: '🏴󠁧󠁢󠁥󠁮󠁧󠁿',
    titles: 1, lastTitle: '1966', stars: 'Bukayo Saka, Phil Foden, Harry Kane, Jude Bellingham, Cole Palmer',
    coach: 'Thomas Tuchel (first foreign England coach since 2016)', bestExpat: 'Britons in US: ~700k. Strongest English fan presence: Boston, NYC, Atlanta (NWSL/MLS franchises).',
    keyMatches: 'England historically struggles in WC quarterfinals (have lost 7 of last 10). Group stage typically comfortable.',
  },
  {
    slug: 'germany-world-cup-2026', name: 'Germany', flag: '🇩🇪',
    titles: 4, lastTitle: '2014', stars: 'Florian Wirtz, Jamal Musiala, Kai Havertz, Joshua Kimmich',
    coach: 'Julian Nagelsmann', bestExpat: 'Germans in US: ~150k recent immigrants. German-American population: 45M+ (largest US ancestry). Concentration: Wisconsin, Pennsylvania, Ohio, Texas.',
    keyMatches: 'Coming off Euro 2024 quarterfinal exit at home (lost to Spain). Reset team under Nagelsmann.',
  },
  {
    slug: 'italy-world-cup-2026', name: 'Italy', flag: '🇮🇹',
    titles: 4, lastTitle: '2006', stars: 'Federico Chiesa, Nicolò Barella, Sandro Tonali, Gianluigi Donnarumma',
    coach: 'Luciano Spalletti', bestExpat: 'Italian-Americans: 17M+ (largest Italian community outside Italy). Concentrated in NY/NJ tri-state, Boston, Philadelphia.',
    keyMatches: 'Failed to qualify for 2018 and 2022 — first WC qualification since 2014. Massive symbolic return.',
  },
  {
    slug: 'netherlands-world-cup-2026', name: 'Netherlands', flag: '🇳🇱',
    titles: 0, lastTitle: 'never (3 finals lost: 1974, 1978, 2010)', stars: 'Virgil van Dijk, Cody Gakpo, Xavi Simons, Frenkie de Jong, Memphis Depay',
    coach: 'Ronald Koeman', bestExpat: 'Dutch in US: ~70k. Concentrations: Michigan, Iowa, California.',
    keyMatches: 'Lost to England in Euro 2024 semis. Strong squad on paper, traditionally great in Europe, underperforms internationally.',
  },
  {
    slug: 'portugal-world-cup-2026', name: 'Portugal', flag: '🇵🇹',
    titles: 0, lastTitle: 'never (best: 3rd in 1966, semis 2006)', stars: 'Cristiano Ronaldo (41 in 2026), Bernardo Silva, Bruno Fernandes, Vitinha, João Neves',
    coach: 'Roberto Martínez', bestExpat: 'Portuguese in US: ~100k. Concentrations: Massachusetts, NJ, California.',
    keyMatches: "Ronaldo's last World Cup at age 41 — his 6th. Joins Messi as only player ever to play 6 World Cups.",
  },
  {
    slug: 'usmnt-world-cup-2026', name: 'USA (USMNT)', flag: '🇺🇸',
    titles: 0, lastTitle: 'never (best: 3rd in 1930)', stars: 'Christian Pulisic, Weston McKennie, Tyler Adams, Folarin Balogun, Sergiño Dest',
    coach: 'Mauricio Pochettino', bestExpat: 'Home country — entire country supports.',
    keyMatches: 'Co-host country, automatically qualified. Best chance for a Round of 16+ result in modern history given home conditions.',
  },
  {
    slug: 'canada-world-cup-2026', name: 'Canada', flag: '🇨🇦',
    titles: 0, lastTitle: 'never (2nd WC ever, also 1986)', stars: 'Alphonso Davies, Jonathan David, Tajon Buchanan',
    coach: 'Jesse Marsch', bestExpat: 'Co-host, automatic qualification.',
    keyMatches: "Only 2nd ever Canada World Cup. Group stage matches in Toronto (BMO Field) and Vancouver (BC Place).",
  },
];

function enCountryBody(c) {
  return `    <p>${c.flag} <strong>${c.name}</strong> will compete at the <strong>2026 FIFA World Cup</strong> hosted by the USA, Canada, and Mexico. The tournament runs <strong>June 11 to July 19, 2026</strong>.</p>

    <div class="wc-quick">
      <dl>
        <dt>FIFA World Cup titles</dt><dd>${c.titles} (last: ${c.lastTitle})</dd>
        <dt>Manager</dt><dd>${c.coach}</dd>
        <dt>Key players</dt><dd>${c.stars}</dd>
        <dt>Fans in the US</dt><dd>${c.bestExpat}</dd>
      </dl>
    </div>

    <h2>Where ${c.name} will play</h2>
    <p>The 2026 WC features 11 US host cities, 2 in Canada, 3 in Mexico. ${c.keyMatches}</p>
    <p>See the full <a href="/learn/world-cup-2026-us-host-cities/">list of US host cities</a> and the <a href="/learn/world-cup-2026-schedule-by-state/">schedule by state</a>.</p>

    <h2>Squad strengths</h2>
    <p>${c.name}'s 2026 squad is built around: ${c.stars}. ${c.coach} took over with a clear plan to mix experience and youth.</p>

    <h2>History at the World Cup</h2>
    <p>${c.name} has lifted the trophy <strong>${c.titles} times</strong>, with their last triumph in <strong>${c.lastTitle}</strong>. They enter 2026 as a strong contender${c.titles === 0 ? ' looking to break the duck' : ' looking to add to their legacy'}.</p>

    ${c.slug === 'brazil-world-cup-2026' ? `<h2>Brazilian-American population</h2><p>${c.bestExpat}. Hard Rock Stadium in Miami and MetLife Stadium in NJ are likely to host games with strong Brazilian crowd presence.</p>` : ''}
    ${c.slug === 'usmnt-world-cup-2026' ? `<h2>The home advantage</h2><p>USA, as co-host, plays all group-stage matches in the USA. Strong group draw + home crowd = best US WC chance since 1930. Pochettino has rebuilt the squad around youthful core (Pulisic, Adams, Balogun, Dest, McKennie).</p>` : ''}
    ${c.slug === 'italy-world-cup-2026' ? `<h2>The return</h2><p>Italy missed both the 2018 and 2022 World Cups. This is their first appearance since 2014. A massive emotional and symbolic return for the 4-time champions.</p>` : ''}
    ${c.slug === 'portugal-world-cup-2026' ? `<h2>Ronaldo's last dance</h2><p>Cristiano Ronaldo will be <strong>41 years old</strong> during the tournament. This is widely expected to be his sixth and final World Cup — tying Messi as the only player to ever play 6.</p>` : ''}

    <div class="cta-card">
      <h3>Learn the US host states by playing</h3>
      <p>Statedoku uses "Hosts a 2026 World Cup match" as a constraint in its daily puzzle. Master the 9 US host states in a week.</p>
      <a href="/">Play today's puzzle →</a>
    </div>

    <h2>Frequently asked questions</h2>
    <details><summary><strong>Is ${c.name} qualified for the 2026 World Cup?</strong></summary><p>Yes, ${c.name} has secured qualification for the 2026 FIFA World Cup.</p></details>
    <details><summary><strong>How many World Cups has ${c.name} won?</strong></summary><p>${c.titles} World Cup titles. Last won: ${c.lastTitle}.</p></details>
    <details><summary><strong>Who is ${c.name}'s coach for the 2026 World Cup?</strong></summary><p>${c.coach}.</p></details>
    <details><summary><strong>Which US cities will ${c.name} play in?</strong></summary><p>Group-stage allocations are determined by the FIFA draw. ${c.keyMatches}</p></details>
`;
}

for (const c of enCountries) {
  out.push([`learn/${c.slug}`,
    wrap('en', c.slug,
      `${c.name} at the 2026 World Cup — squad, schedule, history | Statedoku`,
      `${c.flag} ${c.name} at the FIFA World Cup 2026 in USA, Canada, Mexico. ${c.titles} titles, coach ${c.coach}. Key players, US host cities, schedule.`,
      `${c.name.toLowerCase()} world cup 2026, ${c.name.toLowerCase()} fifa 2026, ${c.name.toLowerCase()} squad, ${c.name.toLowerCase()} schedule world cup`,
      `${c.flag} ${c.name} at the 2026 World Cup`,
      `${c.titles} World Cup titles. Coach: ${c.coach}. ${c.stars.split(',')[0]} leads the squad.`,
      enCountryBody(c),
      faq([
        [`Is ${c.name} in the 2026 World Cup?`, `Yes, ${c.name} is qualified for the FIFA World Cup 2026 hosted in the USA, Canada, and Mexico.`],
        [`How many World Cups has ${c.name} won?`, `${c.name} has won the World Cup ${c.titles} time${c.titles !== 1 ? 's' : ''}${c.titles > 0 ? `. The last title was in ${c.lastTitle}.` : '. Best result: ' + c.lastTitle + '.'}`],
        [`Who is ${c.name}'s manager?`, c.coach + '.'],
        [`Who are ${c.name}'s key players?`, c.stars + '.'],
      ]),
      breadcrumbEN(c.slug, `${c.name} World Cup 2026`),
      '/learn/', 'Learn', wcRelatedEN, hreflangEN(c.slug), footerEN, 'en_US',
      `🏆 ${c.flag} WORLD CUP 2026`
    )
  ]);
}

// ═════════════════════════════════════════════════════════════════════════
// EN STATE-FOCUSED — 3
// ═════════════════════════════════════════════════════════════════════════

out.push(['learn/california-world-cup-2026',
  wrap('en', 'california-world-cup-2026',
    'California at the 2026 World Cup — LA + SF Bay, 14 matches | Statedoku',
    'California hosts 14 matches across SoFi Stadium (LA) and Levi\'s Stadium (Santa Clara, SF Bay) at the 2026 FIFA World Cup. Schedule, transit, what to know.',
    'california world cup 2026, los angeles world cup 2026, sofi stadium world cup, levis stadium world cup, california fifa 2026',
    'California at the 2026 World Cup',
    'Los Angeles + San Francisco Bay = 14 World Cup matches in California. SoFi Stadium + Levi\'s Stadium.',
    `    <p><strong>California</strong> hosts <strong>14 matches</strong> at the 2026 FIFA World Cup, split between <strong>Los Angeles</strong> (SoFi Stadium, 8 matches) and the <strong>San Francisco Bay Area</strong> (Levi's Stadium, 6 matches). Together they make California the <strong>second-biggest state host</strong> after Texas.</p>

    <div class="wc-quick">
      <dl>
        <dt>Total matches</dt><dd>14 (LA: 8, SF Bay: 6)</dd>
        <dt>Venues</dt><dd>SoFi Stadium (Inglewood) + Levi's Stadium (Santa Clara)</dd>
        <dt>Combined capacity</dt><dd>~138,740 seats</dd>
        <dt>Distance between venues</dt><dd>~380 miles / 600 km (6h drive, 1h15 flight)</dd>
      </dl>
    </div>

    <h2>Why California gets two host cities</h2>
    <p>California has 39 million people — more than the population of Canada. It's also home to the largest Mexican, Salvadoran, and Guatemalan diaspora in the US. FIFA chose to award two host cities to capture both the LA region (greater LA = 13M people) and the Bay Area (~7M).</p>

    <h2>SoFi Stadium — Los Angeles</h2>
    <p>Opened September 2020. Cost: $5.5 billion — the most expensive stadium ever built. Translucent ETFE roof, 70,000 seats expandable to 100,000. Home of the LA Rams and LA Chargers (NFL). Hosts 8 World Cup matches including knockout rounds.</p>
    <p>See: <a href="/learn/los-angeles-world-cup-2026/">Los Angeles at the 2026 World Cup →</a></p>

    <h2>Levi's Stadium — SF Bay Area</h2>
    <p>Located in Santa Clara, 45 miles south of San Francisco. Home of the SF 49ers (NFL). Hosts 6 World Cup matches. Capacity ~68,500.</p>
    <p>See: <a href="/learn/san-francisco-bay-area-world-cup-2026/">San Francisco Bay Area at the 2026 World Cup →</a></p>

    <h2>Latino fan culture</h2>
    <p>California has the largest Hispanic population of any US state (~15.5M). Expect strong Mexican, Argentine, Salvadoran, Honduran, and Colombian crowds. Hispanic Heritage Month begins September 15 — but Latino fan presence in California stadia will be the defining vibe of the WC group stage.</p>

    <div class="cta-card">
      <h3>Learn California (and the 49 other states) by playing</h3>
      <p>Statedoku uses "Hosts the 2026 World Cup" as a constraint. Quick path to mastering the 9 host states.</p>
      <a href="/">Play today's puzzle →</a>
    </div>

    <h2>Frequently asked questions</h2>
    <details><summary><strong>How many World Cup matches will California host?</strong></summary><p>14 total: 8 at SoFi Stadium (LA) and 6 at Levi's Stadium (Santa Clara, SF Bay Area).</p></details>
    <details><summary><strong>What is the distance between LA and SF Bay?</strong></summary><p>About 380 miles (600 km). 6 hours by car, or 1h15 by flight. Many fans will fly between venues.</p></details>
    <details><summary><strong>Is the World Cup Final in California?</strong></summary><p>No. The Final is at MetLife Stadium in New Jersey on July 19, 2026.</p></details>
    <details><summary><strong>How big is SoFi Stadium?</strong></summary><p>~70,000 seats expandable to 100,000. SoFi is the newest US WC venue (opened 2020) and the most expensive stadium ever built ($5.5 billion).</p></details>
`,
    faq([
      ['How many World Cup matches will California host?', '14 matches total: 8 at SoFi Stadium (Los Angeles) and 6 at Levi\'s Stadium (San Francisco Bay Area, in Santa Clara).'],
      ['Which California cities host the 2026 World Cup?', 'Los Angeles and the San Francisco Bay Area (specifically Santa Clara for Levi\'s Stadium).'],
      ['Is the 2026 World Cup Final in California?', 'No. The Final is at MetLife Stadium in East Rutherford, New Jersey on July 19, 2026.'],
      ['What stadiums in California host World Cup matches?', 'SoFi Stadium in Inglewood (Los Angeles area) and Levi\'s Stadium in Santa Clara (SF Bay Area).'],
    ]),
    breadcrumbEN('california-world-cup-2026', 'California — 2026 World Cup'),
    '/learn/', 'Learn', wcRelatedEN, hreflangEN('california-world-cup-2026'), footerEN, 'en_US',
    '🏆 🐻 WORLD CUP IN CALIFORNIA'
  )
]);

out.push(['learn/texas-world-cup-2026',
  wrap('en', 'texas-world-cup-2026',
    'Texas at the 2026 World Cup — Dallas + Houston, 16 matches | Statedoku',
    'Texas hosts 16 matches at the 2026 FIFA World Cup — the most of any US state. Dallas (AT&T Stadium, 9 matches) + Houston (NRG Stadium, 7 matches).',
    'texas world cup 2026, dallas world cup 2026, houston world cup 2026, at&t stadium world cup, nrg stadium world cup',
    'Texas at the 2026 World Cup',
    'Dallas + Houston = 16 matches. Most of any US state. The Texas-sized WC venue.',
    `    <p><strong>Texas hosts 16 matches</strong> at the 2026 World Cup — <strong>the most of any US state</strong>. Spread across <strong>Dallas</strong> (AT&T Stadium, 9 matches) and <strong>Houston</strong> (NRG Stadium, 7 matches). Combined seat count: 152,220.</p>

    <div class="wc-quick">
      <dl>
        <dt>Total matches</dt><dd>16 — most of any US state</dd>
        <dt>Venues</dt><dd>AT&T Stadium (Arlington) + NRG Stadium (Houston)</dd>
        <dt>Combined capacity</dt><dd>~152,220 seats</dd>
        <dt>Distance between</dt><dd>~240 mi / 386 km (3h30 drive, 1h flight)</dd>
      </dl>
    </div>

    <h2>Why Texas gets the most matches</h2>
    <p>Texas has 30M people, central US location, two massive NFL stadiums with indoor air conditioning. AT&T Stadium has the largest capacity (80,000) and a retractable roof. NRG Stadium is fully indoor. Both protect players and fans from the brutal Texas summer heat (June-July averages 95-105°F).</p>

    <h2>AT&T Stadium — Dallas (Arlington)</h2>
    <p>Home of the Dallas Cowboys. 80,000 capacity. Hosts <strong>9 matches</strong> — the most of any US venue. Located in Arlington, between Dallas and Fort Worth. Retractable roof, indoor field. Hosts a Round of 16 and Quarter-Final.</p>
    <p>See: <a href="/learn/dallas-world-cup-2026/">Dallas at the 2026 World Cup →</a></p>

    <h2>NRG Stadium — Houston</h2>
    <p>Home of the Houston Texans. 72,220 capacity. Hosts <strong>7 matches</strong>. Indoor venue — fully climate-controlled. Located near the Texas Medical Center.</p>
    <p>See: <a href="/learn/houston-world-cup-2026/">Houston at the 2026 World Cup →</a></p>

    <h2>Texas at the World Cup — the diaspora factor</h2>
    <ul>
      <li><strong>Hispanic population:</strong> 12M (40% of Texas). Expect huge Mexican, Salvadoran, Honduran, and Argentine fan presence.</li>
      <li><strong>African population:</strong> Texas has the largest African immigrant population in the US (Nigerian, Ethiopian, Ghanaian communities concentrated in Houston).</li>
      <li><strong>European fans:</strong> Cheap flights from Frankfurt + London means Texas could see large traveling European supporter contingents.</li>
    </ul>

    <div class="cta-card">
      <h3>Learn Texas (and the 49 other states) by playing</h3>
      <p>Statedoku uses "Hosts the most 2026 World Cup matches" or "TX" as constraints.</p>
      <a href="/">Play today's puzzle →</a>
    </div>

    <h2>Frequently asked questions</h2>
    <details><summary><strong>How many World Cup matches will Texas host?</strong></summary><p>16 matches total: 9 at AT&T Stadium (Dallas/Arlington) and 7 at NRG Stadium (Houston). The most of any US state.</p></details>
    <details><summary><strong>Which Texas city hosts the most matches?</strong></summary><p>Dallas (specifically AT&T Stadium in Arlington) hosts 9 matches — the most of any US venue.</p></details>
    <details><summary><strong>Is the World Cup Final in Texas?</strong></summary><p>No. The Final is at MetLife Stadium in New Jersey on July 19, 2026.</p></details>
    <details><summary><strong>Why does Texas get so many matches?</strong></summary><p>Three reasons: largest US venue capacity (AT&T), indoor/climate-controlled stadia (no weather worry), and central US location for travel.</p></details>
`,
    faq([
      ['How many World Cup 2026 matches will Texas host?', '16 matches total: 9 at AT&T Stadium (Dallas/Arlington) and 7 at NRG Stadium (Houston). Texas hosts the most of any US state.'],
      ['Which Texas venue hosts the most matches?', 'AT&T Stadium in Arlington (Dallas area) — 9 matches. The most of any US venue.'],
      ['Is the World Cup Final in Texas?', 'No. The Final is at MetLife Stadium in East Rutherford, New Jersey on July 19, 2026.'],
      ['Why does Texas host so many World Cup matches?', 'Three reasons: largest US venue capacity (AT&T 80,000), two indoor climate-controlled stadia (protection from Texas summer heat), and central US location.'],
    ]),
    breadcrumbEN('texas-world-cup-2026', 'Texas — 2026 World Cup'),
    '/learn/', 'Learn', wcRelatedEN, hreflangEN('texas-world-cup-2026'), footerEN, 'en_US',
    '🏆 ⭐ WORLD CUP IN TEXAS'
  )
]);

out.push(['learn/new-jersey-world-cup-2026',
  wrap('en', 'new-jersey-world-cup-2026',
    'New Jersey at the 2026 World Cup — MetLife Stadium hosts the FINAL | Statedoku',
    'New Jersey hosts the 2026 FIFA World Cup Final at MetLife Stadium (East Rutherford) on July 19, 2026. Plus 7 other group + knockout matches. Why NJ, not NYC.',
    'new jersey world cup 2026, metlife stadium new jersey, where is world cup 2026 final, nj world cup 2026',
    'New Jersey at the 2026 World Cup',
    'Hosts the FINAL on July 19, 2026. Plus 7 other matches at MetLife Stadium. East Rutherford, NJ.',
    `    <p><strong>New Jersey</strong> is the official home of the <strong>2026 FIFA World Cup Final</strong> at <strong>MetLife Stadium</strong> in East Rutherford, on <strong>July 19, 2026</strong>. Despite the "New York / New Jersey" venue branding, the stadium is physically in New Jersey — about 5 miles west of Manhattan.</p>

    <div class="wc-quick">
      <dl>
        <dt>Total matches</dt><dd>8 (including FINAL)</dd>
        <dt>Venue</dt><dd>MetLife Stadium, East Rutherford, NJ</dd>
        <dt>Capacity</dt><dd>82,500 — largest US venue at the WC</dd>
        <dt>Final date</dt><dd>July 19, 2026</dd>
      </dl>
    </div>

    <h2>Why New Jersey and not New York?</h2>
    <p>MetLife Stadium was selected because it has by far the largest capacity of any East Coast venue (82,500), modern infrastructure, easy NJ Transit access from Manhattan (15-minute train), and FIFA's preference for a single-final venue with proven hosting record. New York State has no comparable football stadium — the Giants and Jets moved out of NYC decades ago.</p>

    <h2>Other matches at MetLife</h2>
    <ul>
      <li>Multiple group-stage matches (likely heavy-hitter teams)</li>
      <li>Round of 16</li>
      <li>Quarter-Final</li>
      <li>Semi-Final</li>
      <li><strong>The FINAL — July 19, 2026</strong></li>
    </ul>

    <h2>How to think about "New Jersey" as a host</h2>
    <p>Most fans will base themselves in <strong>NYC</strong> (Manhattan) and commute to matches via NJ Transit. The 15-minute train from Penn Station to Meadowlands is the most popular route. Hotels in Manhattan will be significantly cheaper than the few options near the stadium in East Rutherford.</p>

    <h2>About New Jersey</h2>
    <p>New Jersey ranks 11th in US population (9.5M) but 1st in population density. It borders New York to the north, Pennsylvania to the west, Delaware to the south. The state capital is <strong>Trenton</strong> — but the WC venue is in East Rutherford, in the populous Bergen County in the north.</p>

    <p>Learn more about New Jersey on our <a href="/states/new-jersey/">state page</a>.</p>

    <div class="cta-card">
      <h3>Learn New Jersey (and the 49 other states) by playing</h3>
      <p>Statedoku uses "Hosts the Final" or "NJ" as constraints in its daily puzzle.</p>
      <a href="/">Play today's puzzle →</a>
    </div>

    <h2>Frequently asked questions</h2>
    <details><summary><strong>Is the 2026 World Cup Final in New Jersey?</strong></summary><p>Yes, the Final is at MetLife Stadium in East Rutherford, New Jersey on July 19, 2026. Despite being branded as "New York / New Jersey", the venue is physically in New Jersey.</p></details>
    <details><summary><strong>How many matches will New Jersey host?</strong></summary><p>8 matches at MetLife Stadium, including the Final, plus a Semi-Final, Quarter-Final, Round of 16, and several group-stage matches.</p></details>
    <details><summary><strong>How far is MetLife from New York City?</strong></summary><p>About 5 miles. 15-minute NJ Transit train from Penn Station (NYC) to Meadowlands. Walking distance from Manhattan: not realistic.</p></details>
    <details><summary><strong>What state is the 2026 World Cup Final in?</strong></summary><p>New Jersey. East Rutherford, specifically. The "New York / New Jersey" branding refers to the broader NYC metro area.</p></details>
`,
    faq([
      ['Is the 2026 World Cup Final in New Jersey?', 'Yes. The 2026 FIFA World Cup Final is at MetLife Stadium in East Rutherford, New Jersey on July 19, 2026. Despite the "New York / New Jersey" branding, the venue is physically in New Jersey.'],
      ['How many World Cup matches will New Jersey host?', '8 matches at MetLife Stadium, including the Final, Semi-Final, Quarter-Final, Round of 16, and group-stage matches.'],
      ['How do you get from NYC to MetLife Stadium?', 'NJ Transit train from Penn Station to Meadowlands — 15 minutes, $5.25. The most popular route for fans staying in Manhattan.'],
      ['Why is the Final in New Jersey instead of New York?', 'MetLife Stadium has the largest East Coast capacity (82,500), modern infrastructure, and easy transit from Manhattan. New York State has no comparable venue.'],
    ]),
    breadcrumbEN('new-jersey-world-cup-2026', 'New Jersey — 2026 World Cup'),
    '/learn/', 'Learn', wcRelatedEN, hreflangEN('new-jersey-world-cup-2026'), footerEN, 'en_US',
    '🏆 🏁 NJ HOSTS THE FINAL'
  )
]);

// ═════════════════════════════════════════════════════════════════════════
// EN TOPICAL — 4
// ═════════════════════════════════════════════════════════════════════════

out.push(['learn/world-cup-2026-opening-match',
  wrap('en', 'world-cup-2026-opening-match',
    '2026 World Cup opening match — June 11 at Estadio Azteca | Statedoku',
    'The 2026 FIFA World Cup opening match is on June 11, 2026 at Estadio Azteca in Mexico City. Mexico plays in the opener — third time at Azteca after 1970 and 1986.',
    'world cup 2026 opening match, fifa 2026 opening, world cup 2026 first match, estadio azteca opening',
    '2026 World Cup opening match',
    'June 11, 2026. Estadio Azteca, Mexico City. Mexico vs ??? — the historic third WC opener at the Azteca.',
    `    <p>The <strong>2026 FIFA World Cup opens on June 11, 2026</strong> with the <strong>opening match at Estadio Azteca</strong> in Mexico City. As tradition holds, Mexico (the host) will play in the opener.</p>

    <div class="wc-quick">
      <dl>
        <dt>Date</dt><dd>June 11, 2026</dd>
        <dt>Venue</dt><dd>Estadio Azteca, Mexico City</dd>
        <dt>Capacity</dt><dd>~87,000 (largest WC 2026 venue)</dd>
        <dt>Mexican role</dt><dd>Host — automatic qualification</dd>
        <dt>Historic significance</dt><dd>3rd WC opener at the Azteca (1970, 1986, 2026)</dd>
      </dl>
    </div>

    <h2>The Azteca trifecta</h2>
    <p>Estadio Azteca becomes the <strong>first stadium ever to host 3 World Cups</strong> — 1970, 1986, and now 2026. Some legendary moments from past openers and matches at the Azteca:</p>
    <ul>
      <li><strong>1970 — "Game of the Century"</strong> — Italy 4-3 West Germany (semifinal). Considered the greatest match in WC history.</li>
      <li><strong>1986 — "Hand of God" + "Goal of the Century"</strong> — Diego Maradona's two famous goals against England in the quarterfinal.</li>
      <li><strong>1986 Opener</strong> — Italy vs Bulgaria, 1-1.</li>
      <li><strong>2026 Opener</strong> — Mexico vs TBD.</li>
    </ul>

    <h2>What time is the opening match?</h2>
    <p>FIFA traditionally schedules the opening match for early evening local time (around 8 PM). For US viewers:</p>
    <ul>
      <li><strong>East Coast (Eastern):</strong> 8 PM ET</li>
      <li><strong>Central:</strong> 7 PM CT</li>
      <li><strong>Mountain:</strong> 6 PM MT</li>
      <li><strong>Pacific:</strong> 5 PM PT</li>
    </ul>
    <p>For international viewers: Madrid 2 AM (already June 12), Paris 2 AM, London 1 AM, Buenos Aires 9 PM.</p>

    <h2>The opening ceremony</h2>
    <p>FIFA's opening ceremony will likely combine Mexican cultural performances with international FIFA branding. Past openers have featured Shakira, Latin music stars, and elaborate stage productions. Expect a mix of mariachi, regional music, and global pop.</p>

    <h2>Group A</h2>
    <p>Mexico will play in Group A. The other 3 teams are determined by the FIFA draw. As host, Mexico's group is given Sunday-evening slots in primetime, with all matches at the Azteca or other Mexican venues to favor Mexican fans.</p>

    <div class="cta-card">
      <h3>Learn the US host states by playing</h3>
      <p>Statedoku uses "Hosts a 2026 World Cup match" as a constraint in its daily puzzle.</p>
      <a href="/">Play today's puzzle →</a>
    </div>

    <h2>Frequently asked questions</h2>
    <details><summary><strong>When is the 2026 World Cup opening match?</strong></summary><p>June 11, 2026, at Estadio Azteca in Mexico City.</p></details>
    <details><summary><strong>Who plays in the opening match?</strong></summary><p>Mexico, as host, plays in the opener. The opponent is determined by the FIFA draw.</p></details>
    <details><summary><strong>What time is the opening match in the US?</strong></summary><p>Approximately 8 PM ET, based on FIFA's traditional scheduling. Confirmed details release closer to the draw.</p></details>
    <details><summary><strong>Why is the Azteca historic?</strong></summary><p>It's the first stadium ever to host 3 World Cups: 1970, 1986, and 2026. Site of Pelé's "Game of the Century", Maradona's "Hand of God" and "Goal of the Century".</p></details>
`,
    faq([
      ['When is the 2026 World Cup opening match?', 'June 11, 2026 at Estadio Azteca in Mexico City. Mexico, as host, plays in the opener.'],
      ['What time is the 2026 World Cup opening match in the US?', 'Approximately 8 PM Eastern Time. FIFA traditionally schedules the opener for early evening local time.'],
      ['What is special about Estadio Azteca?', 'It is the first stadium ever to host 3 World Cups: 1970, 1986, and 2026. Site of legendary moments including Maradona\'s "Hand of God" and "Goal of the Century" in 1986.'],
      ['Who will Mexico play in the opener?', 'Determined by the FIFA draw. Mexico\'s opponent will be confirmed before the tournament begins.'],
    ]),
    breadcrumbEN('world-cup-2026-opening-match', '2026 World Cup Opening Match'),
    '/learn/', 'Learn', wcRelatedEN, hreflangEN('world-cup-2026-opening-match'), footerEN, 'en_US',
    '🏆 ⚽ JUNE 11, 2026'
  )
]);

out.push(['learn/world-cup-2026-dates-schedule',
  wrap('en', 'world-cup-2026-dates-schedule',
    '2026 World Cup dates and schedule — full tournament calendar | Statedoku',
    'Full 2026 FIFA World Cup schedule: June 11 to July 19, 2026. Group stage, Round of 32 (new format), Round of 16, QF, SF, 3rd place, Final. 104 matches.',
    'world cup 2026 schedule, fifa 2026 dates, world cup 2026 calendar, world cup 2026 round of 32, world cup 2026 group stage dates',
    '2026 World Cup dates and schedule',
    'June 11 to July 19, 2026. 104 matches across 39 days. Including the new Round of 32 with 48 teams.',
    `    <p>The <strong>2026 FIFA World Cup</strong> runs from <strong>June 11 to July 19, 2026</strong> — 39 days of competition with 104 matches. As the first WC with <strong>48 teams</strong>, the format includes a new <strong>Round of 32</strong> stage. Here's the full calendar.</p>

    <div class="wc-quick">
      <dl>
        <dt>Tournament dates</dt><dd>June 11 – July 19, 2026</dd>
        <dt>Total matches</dt><dd>104 (up from 64 in 2022)</dd>
        <dt>Teams</dt><dd>48 (up from 32)</dd>
        <dt>Tournament duration</dt><dd>39 days</dd>
        <dt>Final venue</dt><dd>MetLife Stadium, NJ</dd>
      </dl>
    </div>

    <h2>Stage-by-stage breakdown</h2>

    <h3>Group stage — June 11 to June 27, 2026</h3>
    <ul>
      <li>48 teams in 12 groups of 4</li>
      <li>Each team plays 3 matches</li>
      <li>Top 2 from each group + 8 best 3rd-place finishers advance = 32 teams</li>
      <li>Total: 72 matches</li>
    </ul>

    <h3>Round of 32 (NEW) — June 28 to July 3, 2026</h3>
    <ul>
      <li>First-ever Round of 32 stage</li>
      <li>32 teams → 16</li>
      <li>16 matches</li>
    </ul>

    <h3>Round of 16 — July 4 to July 7, 2026</h3>
    <ul>
      <li>16 teams → 8</li>
      <li>8 matches</li>
    </ul>

    <h3>Quarter-Finals — July 9 to July 11, 2026</h3>
    <ul>
      <li>8 teams → 4</li>
      <li>4 matches</li>
    </ul>

    <h3>Semi-Finals — July 14 to July 15, 2026</h3>
    <ul>
      <li>4 teams → 2</li>
      <li>2 matches</li>
      <li>Both semis at major US venues (likely MetLife + Dallas/AT&T)</li>
    </ul>

    <h3>Third-place match — July 18, 2026</h3>
    <ul>
      <li>The 2 semifinal losers</li>
      <li>1 match (consolation prize)</li>
    </ul>

    <h3>FINAL — July 19, 2026</h3>
    <ul>
      <li>MetLife Stadium, East Rutherford, New Jersey</li>
      <li>82,500 capacity</li>
      <li>The 2 semifinal winners</li>
    </ul>

    <h2>Why 104 matches (vs 64 in 2022)?</h2>
    <p>The expansion to 48 teams adds 16 more group-stage participants. Plus the new Round of 32 stage adds 16 matches. Together: 64 + 8 (group stage extras) + 16 (R32) + 16 (extras across rounds) = 104.</p>

    <h2>Match calendar density</h2>
    <ul>
      <li><strong>Group stage:</strong> Up to 6 matches per day at peak.</li>
      <li><strong>Knockout stage:</strong> 2-3 matches per day.</li>
      <li><strong>Travel days:</strong> 2-3 between major rounds for teams.</li>
      <li><strong>Time zones:</strong> Matches span 12pm – 9pm ET (15 UTC – 1am UTC).</li>
    </ul>

    <div class="cta-card">
      <h3>Learn the US host states by playing</h3>
      <p>Statedoku uses "Hosts a WC 2026 match" as a constraint.</p>
      <a href="/">Play today's puzzle →</a>
    </div>

    <h2>Frequently asked questions</h2>
    <details><summary><strong>When does the 2026 World Cup start?</strong></summary><p>June 11, 2026 at Estadio Azteca in Mexico City.</p></details>
    <details><summary><strong>When is the 2026 World Cup Final?</strong></summary><p>July 19, 2026 at MetLife Stadium in East Rutherford, New Jersey.</p></details>
    <details><summary><strong>How many matches will there be?</strong></summary><p>104 total — up from 64 in 2022. The expansion to 48 teams + the new Round of 32 stage account for the increase.</p></details>
    <details><summary><strong>What is the new "Round of 32"?</strong></summary><p>A new knockout stage added because the tournament expanded to 48 teams. After 12 groups of 4, the top 32 advance to the R32 — first ever in WC history.</p></details>
`,
    faq([
      ['When is the 2026 World Cup?', 'June 11 to July 19, 2026. 39 days of competition with 104 matches across 16 stadiums in USA, Canada, and Mexico.'],
      ['How many matches are in the 2026 World Cup?', '104 matches — up from 64 in Qatar 2022. The format change to 48 teams plus the new Round of 32 stage explain the increase.'],
      ['What is the new Round of 32 in the 2026 World Cup?', 'A new knockout stage between the group stage and Round of 16. Added because the tournament expanded from 32 to 48 teams. First Round of 32 in World Cup history.'],
      ['When is the 2026 World Cup Final?', 'July 19, 2026 at MetLife Stadium in East Rutherford, New Jersey.'],
    ]),
    breadcrumbEN('world-cup-2026-dates-schedule', '2026 World Cup Dates'),
    '/learn/', 'Learn', wcRelatedEN, hreflangEN('world-cup-2026-dates-schedule'), footerEN, 'en_US',
    '🏆 📅 39 DAYS, 104 MATCHES'
  )
]);

out.push(['learn/world-cup-2026-mascot',
  wrap('en', 'world-cup-2026-mascot',
    '2026 World Cup mascots — Maple, Zayu, Clutch | Statedoku',
    'The 2026 FIFA World Cup has 3 mascots: Maple the moose (Canada), Zayu the jaguar (Mexico), Clutch the bald eagle (USA). One per host country — a WC first.',
    'world cup 2026 mascot, fifa 2026 mascot, maple zayu clutch, world cup 2026 three mascots',
    '2026 World Cup mascots — Maple, Zayu, Clutch',
    'A WC first: 3 mascots, one per host country. Maple the moose, Zayu the jaguar, Clutch the bald eagle.',
    `    <p>The <strong>2026 FIFA World Cup</strong> has <strong>three mascots</strong> — one per host country. This is a <strong>World Cup first</strong> (every prior WC had a single mascot for the host nation).</p>

    <h2>The three mascots</h2>

    <h3>🇨🇦 Maple — The moose (Canada)</h3>
    <p>A friendly moose representing Canada. Known for joy, kindness, and goaltending skill. Moose are the national symbol of Canada and one of the largest animals in North America.</p>

    <h3>🇲🇽 Zayu — The jaguar (Mexico)</h3>
    <p>A jaguar representing Mexico. Pre-Hispanic Mesoamerican civilizations (Aztec, Maya, Olmec) all revered the jaguar — it was the spiritual symbol of warriors and royalty. Today the jaguar is endangered but iconic in Mexican culture.</p>

    <h3>🇺🇸 Clutch — The bald eagle (USA)</h3>
    <p>A bald eagle representing the USA. The bald eagle is the national bird and on the Great Seal of the United States. "Clutch" — slang for "performing under pressure" — is a fitting name for a sports mascot in America.</p>

    <h2>Why 3 mascots?</h2>
    <p>The 2026 WC is the first co-hosted by 3 countries. FIFA chose to honor each separately rather than create a single shared mascot. Each represents a distinctive cultural/national symbol.</p>

    <h2>Past WC mascots</h2>
    <ul>
      <li><strong>2022 Qatar:</strong> La'eeb (a flying ghutra headdress)</li>
      <li><strong>2018 Russia:</strong> Zabivaka (a wolf in a soccer uniform)</li>
      <li><strong>2014 Brazil:</strong> Fuleco (an armadillo)</li>
      <li><strong>2010 South Africa:</strong> Zakumi (a leopard)</li>
      <li><strong>1994 USA:</strong> Striker (a dog)</li>
      <li><strong>1986 Mexico:</strong> Pique (a jalapeño pepper)</li>
      <li><strong>1970 Mexico:</strong> Juanito (a boy in sombrero) — the first WC mascot ever</li>
    </ul>

    <h2>Merchandise</h2>
    <p>Each of the 3 mascots has its own merchandise line — plushies, t-shirts, mugs, posters. Bundles featuring all 3 are popular collectors' items.</p>

    <div class="cta-card">
      <h3>Learn the host countries by playing</h3>
      <p>Statedoku uses "Hosts the 2026 World Cup" as a constraint.</p>
      <a href="/">Play today's puzzle →</a>
    </div>

    <h2>Frequently asked questions</h2>
    <details><summary><strong>What are the 2026 World Cup mascots?</strong></summary><p>Three mascots, one per host country: Maple (moose, Canada), Zayu (jaguar, Mexico), Clutch (bald eagle, USA).</p></details>
    <details><summary><strong>Why does the 2026 World Cup have 3 mascots?</strong></summary><p>It's the first WC co-hosted by 3 countries. FIFA chose to honor each separately rather than create a single shared mascot.</p></details>
    <details><summary><strong>What was the 1994 USA World Cup mascot?</strong></summary><p>Striker, a dog in a US-themed soccer uniform.</p></details>
    <details><summary><strong>Why is Clutch a bald eagle?</strong></summary><p>The bald eagle is the US national bird, featured on the Great Seal of the United States. "Clutch" is American slang for "performing under pressure" — a fitting name for a sports mascot.</p></details>
`,
    faq([
      ['What are the 2026 World Cup mascots?', 'Three mascots, one per host country: Maple (a moose for Canada), Zayu (a jaguar for Mexico), and Clutch (a bald eagle for the USA).'],
      ['Why does the 2026 World Cup have three mascots?', 'It is the first World Cup co-hosted by three countries (USA, Canada, Mexico). FIFA chose to honor each country with its own mascot rather than create a single shared one.'],
      ['What animal is the USA mascot?', 'Clutch, a bald eagle — the US national bird and a symbol on the Great Seal of the United States. "Clutch" is American sports slang for performing under pressure.'],
      ['What animal is the Mexico mascot?', 'Zayu, a jaguar. Pre-Hispanic civilizations (Aztec, Maya, Olmec) all revered the jaguar as a sacred symbol of warriors and royalty.'],
    ]),
    breadcrumbEN('world-cup-2026-mascot', '2026 World Cup Mascots'),
    '/learn/', 'Learn', wcRelatedEN, hreflangEN('world-cup-2026-mascot'), footerEN, 'en_US',
    '🏆 🦅 MAPLE · ZAYU · CLUTCH'
  )
]);

// ═════════════════════════════════════════════════════════════════════════
// ES COUNTRY PAGES — 5 (Brasil, Uruguay, Chile, Perú, Ecuador)
// ═════════════════════════════════════════════════════════════════════════

const esCountries = [
  {
    slug: 'brasil-mundial-2026', name: 'Brasil', flag: '🇧🇷',
    titles: 5, lastTitle: '2002',
    stars: 'Vinicius Jr (24), Rodrygo (24), Raphinha (28), Casemiro (33), Endrick (19)',
    coach: 'Dorival Júnior',
    diaspora: '~390 mil brasileños en EE.UU. Mayor comunidad en Florida (~360k) y Massachusetts (~120k).',
    note: 'Brasil llega como pentacampeón pero sin ganar desde 2002. La presión es enorme con el centenario del Mundial en 2030.',
  },
  {
    slug: 'uruguay-mundial-2026', name: 'Uruguay', flag: '🇺🇾',
    titles: 2, lastTitle: '1950',
    stars: 'Federico Valverde (27), Darwin Núñez (26), Maximiliano Araújo (24), Manuel Ugarte (24)',
    coach: 'Marcelo Bielsa',
    diaspora: '~80 mil uruguayos en EE.UU. Pequeña comunidad pero apasionada.',
    note: '2 títulos mundiales (1930, 1950 — el "Maracanazo"). Bielsa intenta repetir el éxito de la generación dorada (Suárez, Cavani).',
  },
  {
    slug: 'chile-mundial-2026', name: 'Chile', flag: '🇨🇱',
    titles: 0, lastTitle: 'nunca (cuartos 1962)',
    stars: 'Ben Brereton, Marcelino Núñez, Darío Osorio, Gabriel Suazo',
    coach: 'Ricardo Gareca',
    diaspora: '~150 mil chilenos en EE.UU. Comunidad importante en California y Nueva York.',
    note: 'Chile pasó por una transición tras la generación dorada de Vidal-Sánchez. Joven plantilla bajo el "Tigre" Gareca.',
  },
  {
    slug: 'peru-mundial-2026', name: 'Perú', flag: '🇵🇪',
    titles: 0, lastTitle: 'nunca (cuartos 1970)',
    stars: 'Edison Flores, Christian Cueva (33), Renato Tapia (30), Yotún (35)',
    coach: 'Jorge Fossati',
    diaspora: '~700 mil peruanos en EE.UU. Mayor comunidad: California, Nueva Jersey, Florida.',
    note: 'Perú volvió al Mundial en 2018 tras 36 años de ausencia. Veteranos del proceso 2018 + algunos jóvenes.',
  },
  {
    slug: 'ecuador-mundial-2026', name: 'Ecuador', flag: '🇪🇨',
    titles: 0, lastTitle: 'nunca (octavos 2006)',
    stars: 'Moisés Caicedo (24), Piero Hincapié (24), Pervis Estupiñán (28), Kendry Páez (19)',
    coach: 'Sebastián Beccacece',
    diaspora: '~750 mil ecuatorianos en EE.UU. Mayor comunidad en Nueva York/Nueva Jersey.',
    note: 'Una de las selecciones más jóvenes y prometedoras del Mundial. Caicedo, Hincapié y Páez son el futuro del fútbol sudamericano.',
  },
];

function esCountryBody(c) {
  return `    <p>${c.flag} <strong>${c.name}</strong> jugará el <strong>Mundial 2026 FIFA</strong> co-organizado por EE.UU., Canadá y México. El torneo se juega del <strong>11 de junio al 19 de julio de 2026</strong>.</p>

    <div class="wc-quick">
      <dl>
        <dt>Títulos mundiales</dt><dd>${c.titles} (último: ${c.lastTitle})</dd>
        <dt>Entrenador</dt><dd>${c.coach}</dd>
        <dt>Jugadores clave</dt><dd>${c.stars}</dd>
        <dt>Comunidad en EE.UU.</dt><dd>${c.diaspora}</dd>
      </dl>
    </div>

    <h2>${c.name} en el Mundial 2026</h2>
    <p>${c.note}</p>

    <h2>Plantilla y estrategia</h2>
    <p>${c.name} llega al Mundial con: ${c.stars}. ${c.coach} es el responsable de armar la selección.</p>

    <h2>Comunidad ${c.name.toLowerCase()} en EE.UU.</h2>
    <p>${c.diaspora}</p>

    <h2>Cómo verán los partidos los aficionados</h2>
    <ul>
      <li><strong>En estadios:</strong> Boletos via FIFA.com/tickets. Los aficionados podrán comprar paquetes específicos por selección.</li>
      <li><strong>En bares deportivos:</strong> NYC, Miami, LA tienen bares populares de comunidades sudamericanas.</li>
      <li><strong>En casa:</strong> Difusión Fox Sports + Telemundo (en español) en EE.UU.</li>
    </ul>

    <h2>Diferencia horaria con EE.UU.</h2>
    <ul>
      <li>Vs Nueva York/MetLife: ${c.slug === 'chile-mundial-2026' ? 'igual o +1h (DST)' : c.slug === 'peru-mundial-2026' ? 'igual (todo el año)' : '+1 o +2h'}</li>
      <li>Vs Los Angeles: +3 horas</li>
      <li>Vs Mexico (Estadio Azteca): +1 o +2h</li>
    </ul>

    <h2>Visa para EE.UU.</h2>
    <p>${c.slug === 'chile-mundial-2026' ? '<strong>Chile es el único país sudamericano en Visa Waiver de EE.UU.</strong> Solo necesitas ESTA online (~$21).' : 'Necesitas <strong>visa B1/B2</strong>. Tiempo de espera en consulado: 12-24 meses. Aplica YA.'}</p>

    <div class="cta-card">
      <h3>Aprende los estados de EE.UU. jugando</h3>
      <p>Si viajas a EE.UU. para apoyar a ${c.name}, aprende los 50 estados con Statedoku.</p>
      <a href="/es/">Jugar el puzzle de hoy →</a>
    </div>

    <h2>Preguntas frecuentes</h2>
    <details><summary><strong>¿${c.name} está en el Mundial 2026?</strong></summary><p>${c.slug.startsWith('peru') || c.slug.startsWith('chile') || c.slug.startsWith('ecuador') ? c.name + ' completó su clasificación vía las eliminatorias sudamericanas.' : 'Sí, ' + c.name + ' está clasificado al Mundial 2026.'}</p></details>
    <details><summary><strong>¿Cuántos Mundiales ha ganado ${c.name}?</strong></summary><p>${c.titles} título${c.titles !== 1 ? 's' : ''}. ${c.titles > 0 ? 'Último: ' + c.lastTitle + '.' : 'Mejor resultado: ' + c.lastTitle + '.'}</p></details>
    <details><summary><strong>¿Quién dirige a ${c.name}?</strong></summary><p>${c.coach}.</p></details>
    <details><summary><strong>¿Necesito visa para viajar a EE.UU.?</strong></summary><p>${c.slug === 'chile-mundial-2026' ? 'No, los chilenos solo necesitan ESTA (Visa Waiver). Trámite online, ~$21.' : 'Sí, visa B1/B2. Tiempo de espera: 12-24 meses. Aplica con MUCHA anticipación.'}</p></details>
`;
}

for (const c of esCountries) {
  out.push([`es/learn/${c.slug}`,
    wrap('es', c.slug,
      `${c.name} en el Mundial 2026 — selección, sedes, calendario | Statedoku`,
      `${c.flag} ${c.name} en el Mundial 2026 en EE.UU.-Canadá-México. ${c.titles} títulos, ${c.coach} como entrenador. ${c.stars.split(',')[0]} y compañía.`,
      `${c.name.toLowerCase()} mundial 2026, ${c.name.toLowerCase()} fifa 2026, seleccion ${c.name.toLowerCase()} mundial`,
      `${c.flag} ${c.name} en el Mundial 2026`,
      `${c.titles} título${c.titles !== 1 ? 's' : ''} mundial${c.titles !== 1 ? 'es' : ''}. ${c.coach} como entrenador. ${c.stars.split(',')[0]} lidera el ataque.`,
      esCountryBody(c),
      faq([
        [`¿${c.name} juega el Mundial 2026?`, c.name + ' está clasificado para el Mundial 2026 FIFA en EE.UU., Canadá y México.'],
        [`¿Cuántos Mundiales ha ganado ${c.name}?`, c.name + ' ha ganado el Mundial ' + c.titles + ' vez' + (c.titles !== 1 ? 'es' : '') + '. ' + (c.titles > 0 ? 'Último título en ' + c.lastTitle + '.' : 'Mejor resultado histórico: ' + c.lastTitle + '.')],
        [`¿Quién dirige a ${c.name} en el Mundial 2026?`, c.coach + '.'],
        [`¿Cuánto cuesta viajar a EE.UU. para ver a ${c.name}?`, 'Vuelos desde Sudamérica a EE.UU.: $400-$1,500 ida y vuelta. Hoteles durante el Mundial: $200-$500/noche en ciudades sede. Boletos de fase de grupos: $60-$300.'],
      ]),
      breadcrumbES(c.slug, c.name + ' Mundial 2026'),
      '/es/learn/', 'Aprender', wcRelatedES, hreflangES(c.slug), footerES, 'es_ES',
      `🏆 ${c.flag} MUNDIAL 2026`
    )
  ]);
}

// ═════════════════════════════════════════════════════════════════════════
// FR COUNTRY PAGES — 5
// ═════════════════════════════════════════════════════════════════════════

const frCountries = [
  {
    slug: 'belgique-coupe-du-monde-2026', name: 'Belgique', flag: '🇧🇪',
    titles: 0, lastTitle: 'jamais (3e en 2018)',
    stars: 'Kevin De Bruyne, Romelu Lukaku, Jérémy Doku, Charles De Ketelaere, Amadou Onana',
    coach: 'Rudi Garcia (depuis 2025)',
    note: 'Génération en transition après De Bruyne (35 ans). Belgique cherche à renouveler son XI dorée des années 2018-2022.',
  },
  {
    slug: 'portugal-coupe-du-monde-2026', name: 'Portugal', flag: '🇵🇹',
    titles: 0, lastTitle: 'jamais (3e en 1966)',
    stars: 'Cristiano Ronaldo (41 ans !), Bernardo Silva, Bruno Fernandes, Vitinha, Rafael Leão',
    coach: 'Roberto Martínez',
    note: 'Le dernier Mondial de Cristiano Ronaldo à 41 ans — sa 6e Coupe du Monde, record absolu (à égalité avec Messi).',
  },
  {
    slug: 'allemagne-coupe-du-monde-2026', name: 'Allemagne', flag: '🇩🇪',
    titles: 4, lastTitle: '2014',
    stars: 'Florian Wirtz, Jamal Musiala, Kai Havertz, Joshua Kimmich, Ilkay Gündoğan',
    coach: 'Julian Nagelsmann',
    note: 'Après deux Mondiaux décevants (élim en phase de groupes 2018, 2022), Allemagne mise sur la jeune génération Wirtz-Musiala.',
  },
  {
    slug: 'pays-bas-coupe-du-monde-2026', name: 'Pays-Bas', flag: '🇳🇱',
    titles: 0, lastTitle: 'jamais (3 finales perdues : 1974, 1978, 2010)',
    stars: 'Virgil van Dijk, Cody Gakpo, Xavi Simons, Frenkie de Jong, Memphis Depay',
    coach: 'Ronald Koeman',
    note: 'Demi-finalistes Euro 2024. Belle profondeur d\'effectif mais malédiction des Néerlandais en finales.',
  },
  {
    slug: 'bresil-coupe-du-monde-2026', name: 'Brésil', flag: '🇧🇷',
    titles: 5, lastTitle: '2002',
    stars: 'Vinicius Jr, Rodrygo, Raphinha, Casemiro, Endrick',
    coach: 'Dorival Júnior',
    note: 'Pentacampeão sans titre depuis 23 ans. La pression est immense — Brésil organise le Mondial 2030 (centenaire).',
  },
];

function frCountryBody(c) {
  return `    <p>${c.flag} La <strong>${c.name}</strong> participera à la <strong>Coupe du Monde 2026</strong> co-organisée par les USA, le Canada et le Mexique du <strong>11 juin au 19 juillet 2026</strong>.</p>

    <div class="wc-quick">
      <dl>
        <dt>Titres de Coupe du Monde</dt><dd>${c.titles} (dernier : ${c.lastTitle})</dd>
        <dt>Sélectionneur</dt><dd>${c.coach}</dd>
        <dt>Joueurs clés</dt><dd>${c.stars}</dd>
      </dl>
    </div>

    <h2>${c.name} en 2026</h2>
    <p>${c.note}</p>

    <h2>L'effectif</h2>
    <p>L'équipe de ${c.name} se construit autour de : ${c.stars}.</p>

    <h2>Comment suivre les matchs depuis la France</h2>
    <ul>
      <li><strong>TF1, M6, beIN Sports</strong> — diffuseurs France pour la Coupe du Monde</li>
      <li><strong>Décalage horaire :</strong> Paris vs USA = -6 à -9h selon le fuseau. Match à 15h ET = 21h Paris (idéal).</li>
      <li><strong>Bars français :</strong> sport bars dans les grandes villes diffusent matches importants.</li>
    </ul>

    <h2>Voyager aux USA pour suivre ${c.name}</h2>
    <p>Les ressortissants belges, portugais, allemands, néerlandais bénéficient du <strong>Visa Waiver Program</strong> via ESTA (~21 €). Brésiliens : besoin de visa B1/B2, délai 8-15 mois.</p>
    <p>Voir notre <a href="/fr/learn/coupe-du-monde-2026-voyage-usa/">guide complet voyage USA Mondial 2026</a>.</p>

    <div class="cta-card">
      <h3>Apprenez les États hôtes en jouant</h3>
      <p>Si vous voyagez aux USA pour la Coupe du Monde, apprenez les 50 États avec Statedoku.</p>
      <a href="/fr/">Jouer le puzzle du jour →</a>
    </div>

    <h2>Questions fréquentes</h2>
    <details><summary><strong>La ${c.name} est-elle qualifiée pour la Coupe du Monde 2026 ?</strong></summary><p>Oui, la ${c.name} est qualifiée pour la Coupe du Monde 2026 FIFA aux USA-Canada-Mexique.</p></details>
    <details><summary><strong>Combien de Coupes du Monde la ${c.name} a-t-elle gagnées ?</strong></summary><p>${c.titles} titre${c.titles !== 1 ? 's' : ''}. ${c.titles > 0 ? 'Dernier : ' + c.lastTitle + '.' : 'Meilleur résultat : ' + c.lastTitle + '.'}</p></details>
    <details><summary><strong>Qui est le sélectionneur ?</strong></summary><p>${c.coach}.</p></details>
`;
}

for (const c of frCountries) {
  out.push([`fr/learn/${c.slug}`,
    wrap('fr', c.slug,
      `La ${c.name} à la Coupe du Monde 2026 — effectif, calendrier, voyage USA | Statedoku`,
      `${c.flag} La ${c.name} à la Coupe du Monde 2026 aux USA-Canada-Mexique. ${c.titles} titre${c.titles !== 1 ? 's' : ''}, ${c.coach} sélectionneur. ${c.stars.split(',')[0]} et coéquipiers.`,
      `${c.name.toLowerCase()} coupe du monde 2026, ${c.name.toLowerCase()} mondial 2026, equipe ${c.name.toLowerCase()} fifa 2026`,
      `${c.flag} La ${c.name} à la Coupe du Monde 2026`,
      `${c.titles} titre${c.titles !== 1 ? 's' : ''} mondial${c.titles !== 1 ? 'aux' : ''}. ${c.coach} sélectionneur. ${c.stars.split(',')[0]} en attaque.`,
      frCountryBody(c),
      faq([
        ['La ' + c.name + ' est-elle qualifiée pour la Coupe du Monde 2026 ?', 'Oui, la ' + c.name + ' est qualifiée pour la Coupe du Monde 2026 aux USA-Canada-Mexique.'],
        ['Combien de Coupes du Monde la ' + c.name + ' a-t-elle gagnées ?', 'La ' + c.name + ' a gagné ' + c.titles + ' Coupe' + (c.titles !== 1 ? 's' : '') + ' du Monde. ' + (c.titles > 0 ? 'Dernier titre : ' + c.lastTitle + '.' : 'Meilleur résultat historique : ' + c.lastTitle + '.')],
        ['Qui est le sélectionneur de la ' + c.name + ' pour la Coupe du Monde 2026 ?', c.coach + '.'],
        ['Faut-il un visa pour voyager aux USA depuis la ' + c.name + ' ?', c.slug.startsWith('bresil') ? 'Oui, les Brésiliens ont besoin d\'un visa B1/B2 pour les USA. Délai : 8 à 15 mois.' : 'Non, pas de visa : autorisation ESTA en ligne (~21 €) suffit, valable 2 ans.'],
      ]),
      breadcrumbFR(c.slug, c.name + ' Mondial 2026'),
      '/fr/learn/', 'Apprendre', wcRelatedFR, hreflangFR(c.slug), footerFR, 'fr_FR',
      `🏆 ${c.flag} MONDIAL 2026`
    )
  ]);
}

// ═════════════════════════════════════════════════════════════════════════
// WRITE ALL
// ═════════════════════════════════════════════════════════════════════════
for (const [rel, html] of out) {
  const dir = path.join(ROOT, rel);
  fs.mkdirSync(dir, { recursive: true });
  fs.writeFileSync(path.join(dir, 'index.html'), html);
  console.log(`✅ /${rel}/`);
}
console.log(`\n${out.length} articles WC batch 2 générés.`);
