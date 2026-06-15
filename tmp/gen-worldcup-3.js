#!/usr/bin/env node
/**
 * WC 2026 mega-batch 3 — 40 articles.
 *
 * Distribution:
 *  EN (16): 6 player + 1 base camp hub + 2 ceremonies + 3 history/compare + 2 ticket/travel + 2 ball/anthem
 *  ES (13): 4 player + 4 "donde ver" by country + 2 ceremony/ball + 3 LATAM travel
 *  FR (11): 3 player + 1 camp + 2 ceremony + 2 voyage + 2 history + 1 ball
 */
const fs = require('fs');
const path = require('path');
const ROOT = path.resolve(__dirname, '..');

const styles = `
    .lt-hero{max-width:720px;margin:32px auto 12px;padding:0 18px;text-align:center}
    .lt-hero h1{font-size:clamp(1.9rem,5.5vw,2.6rem);font-weight:900;letter-spacing:-.025em;margin:0 0 10px;line-height:1.15}
    .lt-hero .sub{color:var(--text-2);font-size:1rem;line-height:1.55}
    .lt-main{max-width:720px;margin:0 auto;padding:18px 18px 60px;line-height:1.65;color:var(--text)}
    .lt-main h2{margin-top:36px;margin-bottom:12px;font-size:1.35rem;font-weight:800;letter-spacing:-.015em}
    .lt-main h3{margin-top:20px;margin-bottom:8px;font-size:1.05rem;font-weight:700;color:var(--navy)}
    .lt-main p,.lt-main li{line-height:1.65}
    .lt-main ul,.lt-main ol{padding-left:22px;margin-bottom:14px}
    .lt-main li{margin-bottom:6px}
    table.lt{width:100%;border-collapse:collapse;margin:14px 0 22px;font-size:.92rem}
    table.lt th,table.lt td{padding:9px 12px;border-bottom:1px solid var(--border);text-align:left}
    table.lt th{background:#F8FAFC;font-weight:700;color:var(--navy);font-size:.82rem;text-transform:uppercase;letter-spacing:.03em}
    .cta-card{background:linear-gradient(135deg,var(--navy),var(--navy-soft));color:#fff;padding:22px;border-radius:14px;margin:28px 0;text-align:center}
    .cta-card h3{color:#fff;margin:0 0 8px}.cta-card p{margin:0 0 12px;color:rgba(255,255,255,.85)}
    .cta-card a{display:inline-block;background:var(--gold);color:var(--navy);padding:10px 22px;border-radius:999px;font-weight:800;text-decoration:none;font-size:.92rem}
    .related-grid{display:grid;grid-template-columns:repeat(auto-fit,minmax(220px,1fr));gap:8px;margin:14px 0}
    .related-grid a{display:block;padding:10px 12px;border:1px solid var(--border);border-radius:8px;color:var(--navy);text-decoration:none;font-weight:600;font-size:.9rem}
    .related-grid a:hover{background:#F8FAFC;border-color:var(--navy)}
    details{margin:8px 0;padding:10px 14px;background:#F8FAFC;border-radius:8px}
    summary{font-weight:700;color:var(--navy);cursor:pointer}
    details p{margin:8px 0 0;color:var(--text-2)}
    .wc-chip{display:inline-block;padding:4px 10px;border-radius:999px;background:var(--gold);color:var(--navy);font-weight:800;font-size:.82rem;margin-bottom:12px}
    .wc-quick{background:#F8FAFC;border:1px solid var(--border);border-radius:12px;padding:16px 18px;margin:18px 0}
    .wc-quick dl{display:grid;grid-template-columns:max-content 1fr;gap:6px 14px;margin:0}
    .wc-quick dt{font-weight:700;color:var(--navy);font-size:.88rem}
    .wc-quick dd{margin:0;color:var(--text);font-size:.92rem}`;

const hreflangEN = s => `
  <link rel="canonical" href="https://statedoku.com/learn/${s}/">
  <link rel="alternate" hreflang="en" href="https://statedoku.com/learn/${s}/">
  <link rel="alternate" hreflang="en-US" href="https://statedoku.com/learn/${s}/">
  <link rel="alternate" hreflang="en-GB" href="https://statedoku.com/learn/${s}/">
  <link rel="alternate" hreflang="x-default" href="https://statedoku.com/learn/${s}/">`;
const hreflangES = s => `
  <link rel="canonical" href="https://statedoku.com/es/learn/${s}/">
  <link rel="alternate" hreflang="es" href="https://statedoku.com/es/learn/${s}/">
  <link rel="alternate" hreflang="es-ES" href="https://statedoku.com/es/learn/${s}/">
  <link rel="alternate" hreflang="es-MX" href="https://statedoku.com/es/learn/${s}/">
  <link rel="alternate" hreflang="es-AR" href="https://statedoku.com/es/learn/${s}/">
  <link rel="alternate" hreflang="es-CO" href="https://statedoku.com/es/learn/${s}/">
  <link rel="alternate" hreflang="x-default" href="https://statedoku.com/learn/">`;
const hreflangFR = s => `
  <link rel="canonical" href="https://statedoku.com/fr/learn/${s}/">
  <link rel="alternate" hreflang="fr" href="https://statedoku.com/fr/learn/${s}/">
  <link rel="alternate" hreflang="fr-FR" href="https://statedoku.com/fr/learn/${s}/">
  <link rel="alternate" hreflang="fr-CA" href="https://statedoku.com/fr/learn/${s}/">
  <link rel="alternate" hreflang="fr-BE" href="https://statedoku.com/fr/learn/${s}/">
  <link rel="alternate" hreflang="x-default" href="https://statedoku.com/learn/">`;

const footerEN = `<footer><p>Statedoku &copy; 2026 &nbsp;·&nbsp; <a href="/learn/">Learn</a> &nbsp;·&nbsp; <a href="/states/">States</a> &nbsp;·&nbsp; <a href="/faq/">FAQ</a></p></footer><script src="/config.js"></script><script src="/js/admin.js"></script></body></html>`;
const footerES = `<footer><p>Statedoku &copy; 2026 &nbsp;·&nbsp; <a href="/es/learn/">Aprender</a> &nbsp;·&nbsp; <a href="/es/faq/">FAQ</a></p></footer><script src="/config.js"></script><script src="/js/admin.js"></script></body></html>`;
const footerFR = `<footer><p>Statedoku &copy; 2026 &nbsp;·&nbsp; <a href="/fr/learn/">Apprendre</a> &nbsp;·&nbsp; <a href="/fr/faq/">FAQ</a></p></footer><script src="/config.js"></script><script src="/js/admin.js"></script></body></html>`;

const relEN = `    <div class="related-grid">
      <a href="/learn/world-cup-2026-us-host-cities/">→ 11 US host cities</a>
      <a href="/learn/world-cup-2026-final-stadium/">→ Final: MetLife</a>
      <a href="/learn/usmnt-world-cup-2026/">→ USMNT</a>
      <a href="/learn/world-cup-2026-dates-schedule/">→ Schedule & dates</a>
      <a href="/learn/world-cup-2026-mascot/">→ Mascots</a>
      <a href="/learn/team-base-camps-world-cup-2026/">→ Team base camps</a>
    </div>`;
const relES = `    <div class="related-grid">
      <a href="/es/learn/mundial-2026-eeuu/">→ Las 11 ciudades sede</a>
      <a href="/es/learn/mexico-mundial-2026/">→ México</a>
      <a href="/es/learn/argentina-mundial-2026/">→ Argentina</a>
      <a href="/es/learn/mundial-2026-boletos-visa/">→ Boletos + visa</a>
      <a href="/es/learn/mundial-2026-final-metlife/">→ La final</a>
    </div>`;
const relFR = `    <div class="related-grid">
      <a href="/fr/learn/coupe-du-monde-2026-villes-usa/">→ Les 11 villes hôtes</a>
      <a href="/fr/learn/france-coupe-du-monde-2026/">→ La France</a>
      <a href="/fr/learn/coupe-du-monde-2026-voyage-usa/">→ Voyager aux USA</a>
      <a href="/fr/learn/coupe-du-monde-2026-finale/">→ La finale</a>
    </div>`;

function wrap(lang, slug, title, desc, kw, h1, sub, body, faqJson, breadcrumb, hreflang, footer, locale, headerHref, headerLabel, related, chip) {
  return `<!DOCTYPE html>
<html lang="${lang}">
<head>
<meta charset="UTF-8">
<meta name="viewport" content="width=device-width,initial-scale=1.0">
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
<meta property="og:description" content="${desc.slice(0,160)}">
<meta property="og:url" content="https://statedoku.com${headerHref}${slug}/">
<meta property="og:image" content="https://statedoku.com/og/og-learn-state-capitals.png">
<meta property="og:locale" content="${locale}">
<meta name="twitter:card" content="summary_large_image">
<meta name="twitter:title" content="${h1}">
<meta name="twitter:description" content="${desc.slice(0,160)}">
<meta name="twitter:image" content="https://statedoku.com/og/og-learn-state-capitals.png">
<style>${styles}</style>
</head>
<body class="legal-body">
<header>
  <a href="${headerHref==='/learn/'?'/':(headerHref==='/es/learn/'?'/es/':'/fr/')}" class="logo">State<em>doku</em> <span class="logo-flag">🇺🇸</span></a>
  <nav class="nav-actions"><a href="${headerHref}" style="color:var(--text-2);text-decoration:none;font-weight:700;font-size:.88rem">← ${headerLabel}</a></nav>
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
    <h2>${lang==='en'?'Related — World Cup 2026 + US':lang==='es'?'Relacionado — Mundial 2026':'À voir aussi — Mondial 2026'}</h2>
${related}
  </article>
</main>
${footer}`;
}

const faq = qa => JSON.stringify({'@context':'https://schema.org','@type':'FAQPage',mainEntity:qa.map(([q,a])=>({'@type':'Question',name:q,acceptedAnswer:{'@type':'Answer',text:a}}))});
const bcEN = (s,n) => `[{"@type":"ListItem","position":1,"name":"Home","item":"https://statedoku.com/"},{"@type":"ListItem","position":2,"name":"Learn","item":"https://statedoku.com/learn/"},{"@type":"ListItem","position":3,"name":"${n}","item":"https://statedoku.com/learn/${s}/"}]`;
const bcES = (s,n) => `[{"@type":"ListItem","position":1,"name":"Inicio","item":"https://statedoku.com/es/"},{"@type":"ListItem","position":2,"name":"Aprender","item":"https://statedoku.com/es/learn/"},{"@type":"ListItem","position":3,"name":"${n}","item":"https://statedoku.com/es/learn/${s}/"}]`;
const bcFR = (s,n) => `[{"@type":"ListItem","position":1,"name":"Accueil","item":"https://statedoku.com/fr/"},{"@type":"ListItem","position":2,"name":"Apprendre","item":"https://statedoku.com/fr/learn/"},{"@type":"ListItem","position":3,"name":"${n}","item":"https://statedoku.com/fr/learn/${s}/"}]`;

const out = [];

// ═════════════════════════════════════════════════════════════════════════
// EN PLAYER PAGES — 6
// ═════════════════════════════════════════════════════════════════════════

const enPlayers = [
  {slug:'messi-world-cup-2026', name:'Lionel Messi', country:'Argentina', flag:'🇦🇷', age:'39', club:'Inter Miami CF',
   wc:'5 (2006, 2010, 2014, 2018, 2022)', wcWon:'1 (2022)',
   note:"Messi turns 39 on June 24, 2026 — during the tournament. If he plays, it's his record-tying 6th World Cup (alongside Ronaldo). He won the Golden Ball in Qatar 2022 and lifted the trophy that completed his career.",
   ties:'Inter Miami is his current club. Home Hard Rock Stadium (Miami) is a 2026 host venue. Likely massive Argentine presence in Miami.',
   chip:'🏆 🇦🇷 MESSI WC 2026'},
  {slug:'mbappe-world-cup-2026', name:'Kylian Mbappé', country:'France', flag:'🇫🇷', age:'27', club:'Real Madrid',
   wc:'2 (2018, 2022)', wcWon:'1 (2018)',
   note:"Mbappé will be 27 — peak prime. Already a World Cup winner (2018) and Golden Boot in 2022 (8 goals + hat-trick in Final, the first since Geoff Hurst 1966). Captain of France since 2024.",
   ties:'Joined Real Madrid in 2024. Massive global brand. Sponsorships across US market.',
   chip:'🏆 🇫🇷 MBAPPÉ WC 2026'},
  {slug:'ronaldo-world-cup-2026', name:'Cristiano Ronaldo', country:'Portugal', flag:'🇵🇹', age:'41', club:'Al-Nassr (Saudi Arabia)',
   wc:'5 (2006, 2010, 2014, 2018, 2022)', wcWon:'0',
   note:"Ronaldo's record-tying 6th World Cup (alongside Messi) at age 41. Final shot at the only trophy missing from his cabinet. Top international scorer in men's football history (130+ goals).",
   ties:'Hard Rock Stadium in Miami could be a Portuguese venue. Large Portuguese community in NJ + Massachusetts.',
   chip:'🏆 🇵🇹 RONALDO WC 2026'},
  {slug:'lamine-yamal-world-cup-2026', name:'Lamine Yamal', country:'Spain', flag:'🇪🇸', age:'19', club:'FC Barcelona',
   wc:'0', wcWon:'0',
   note:"Lamine Yamal will be 19. First World Cup. Already won Euro 2024 (youngest goalscorer in Euros history at 16). The most hyped teenage talent in football since Messi.",
   ties:'Spain has strong Latin diaspora presence in California, Texas, Florida.',
   chip:'🏆 🇪🇸 YAMAL WC 2026'},
  {slug:'vinicius-jr-world-cup-2026', name:'Vinicius Jr', country:'Brazil', flag:'🇧🇷', age:'26', club:'Real Madrid',
   wc:'1 (2022)', wcWon:'0',
   note:"Vinicius Jr will be 26 — peak. The face of Brazil's post-Neymar generation. UEFA Champions League winner 2024 with Real Madrid. Brazil's hopes for a 6th title rest largely on his shoulders.",
   ties:'Plays in Spain. Brazilian community in US: Florida (~360k), Massachusetts (~120k), NJ.',
   chip:'🏆 🇧🇷 VINICIUS WC 2026'},
  {slug:'pulisic-world-cup-2026', name:'Christian Pulisic', country:'USA', flag:'🇺🇸', age:'27', club:'AC Milan',
   wc:'1 (2022)', wcWon:'0',
   note:"Pulisic is the captain of the USMNT (Team USA). 27 years old. AC Milan's main attacker. Born in Hershey, Pennsylvania. Carrying the hopes of the host nation.",
   ties:'Plays his home WC. USMNT bases in NYC, NJ, Boston region likely. Family near MetLife.',
   chip:'🏆 🇺🇸 PULISIC WC 2026'},
];

for(const p of enPlayers){
  const body = `    <p>${p.flag} <strong>${p.name}</strong> is one of the headline players of the <strong>2026 FIFA World Cup</strong>. At ${p.age}, he plays for ${p.club} and represents ${p.country}. The tournament runs <strong>June 11 to July 19, 2026</strong> across the USA, Canada, and Mexico.</p>

    <div class="wc-quick">
      <dl>
        <dt>Country</dt><dd>${p.flag} ${p.country}</dd>
        <dt>Age at WC 2026</dt><dd>${p.age}</dd>
        <dt>Club</dt><dd>${p.club}</dd>
        <dt>WCs played</dt><dd>${p.wc}</dd>
        <dt>WCs won</dt><dd>${p.wcWon}</dd>
      </dl>
    </div>

    <h2>${p.name} at the 2026 World Cup</h2>
    <p>${p.note}</p>

    <h2>Connection to the US</h2>
    <p>${p.ties}</p>

    <h2>What to expect from ${p.name.split(' ')[0]}</h2>
    <p>As one of the most-watched players of the tournament, ${p.name.split(' ')[0]}'s every move will be tracked. Expect intense media coverage on every match day, with all major US sports networks (Fox, ESPN, Telemundo for Spanish) running dedicated coverage.</p>

    <h2>Where ${p.country} will play</h2>
    <p>${p.country}'s matches are determined by the FIFA group draw. See the full <a href="/learn/world-cup-2026-us-host-cities/">list of 11 US host cities</a> and check the <a href="/learn/world-cup-2026-schedule-by-state/">schedule by state</a> to plan a road trip.</p>

    <div class="cta-card">
      <h3>Learn the host states by playing</h3>
      <p>Statedoku uses "Hosts the 2026 WC" as a constraint in its daily puzzle.</p>
      <a href="/">Play today's puzzle →</a>
    </div>

    <h2>Frequently asked questions</h2>
    <details><summary><strong>Will ${p.name} play the 2026 World Cup?</strong></summary><p>${p.country} is qualified. ${p.name} is expected to be in the squad, though formal call-ups are confirmed closer to the tournament.</p></details>
    <details><summary><strong>How old is ${p.name} at the 2026 World Cup?</strong></summary><p>${p.age} years old during the tournament (June-July 2026).</p></details>
    <details><summary><strong>What club does ${p.name} play for?</strong></summary><p>${p.club}.</p></details>
    <details><summary><strong>How many World Cups has ${p.name} played?</strong></summary><p>${p.wc} prior World Cups${p.wcWon !== '0' ? ', winning ' + p.wcWon : ''}.</p></details>
`;
  out.push([`learn/${p.slug}`,
    wrap('en', p.slug,
      `${p.name} at the 2026 World Cup — squad, age, club, history | Statedoku`,
      `${p.flag} ${p.name} at the 2026 FIFA World Cup. Age ${p.age}, club ${p.club}, for ${p.country}. ${p.wc} prior WCs, ${p.wcWon} won.`,
      `${p.name.toLowerCase()} world cup 2026, ${p.name.toLowerCase()} fifa 2026, ${p.country.toLowerCase()} ${p.name.toLowerCase().split(' ').pop()}`,
      `${p.flag} ${p.name} — 2026 World Cup`, `${p.country} · ${p.age} years old · ${p.club}.`, body,
      faq([
        [`Will ${p.name} play at the 2026 World Cup?`, `${p.country} is qualified for the 2026 World Cup. ${p.name} is expected to be in the squad.`],
        [`How old is ${p.name} during the 2026 World Cup?`, `${p.age} years old during the tournament (June-July 2026).`],
        [`What club does ${p.name} play for?`, `${p.club}.`],
        [`How many World Cups has ${p.name} played in?`, `${p.wc} prior World Cups${p.wcWon!=='0'?', winning '+p.wcWon:''}. The 2026 World Cup ${p.wc === '0' ? 'is his first.' : 'will be one of his career highlights.'}`],
      ]),
      bcEN(p.slug, p.name), hreflangEN(p.slug), footerEN, 'en_US', '/learn/', 'Learn', relEN, p.chip)
  ]);
}

// ═════════════════════════════════════════════════════════════════════════
// EN BASE CAMPS HUB + 2 CEREMONIES + 3 HISTORY/COMPARE + 2 TRAVEL + 2 OTHER = 10
// ═════════════════════════════════════════════════════════════════════════

out.push(['learn/team-base-camps-world-cup-2026',
  wrap('en', 'team-base-camps-world-cup-2026',
    'Team base camps at the 2026 World Cup — how teams pick their training base | Statedoku',
    'Where do World Cup 2026 teams train? Each of 48 teams picks a "base camp" — a city + training facility + hotel for the tournament. How it works, key camps so far.',
    'world cup 2026 base camps, team base camps fifa 2026, brazil base camp 2026, france base camp 2026, where teams train world cup',
    "World Cup 2026 — team base camps",
    "Where 48 teams train during the tournament. How camps are picked, and the key US/Canada/Mexico training bases.",
    `    <p>Every <strong>2026 World Cup team</strong> picks a <strong>base camp</strong> — a city + training facility + hotel where they live for the duration of the tournament. With 48 teams across 3 host countries, base camps are the lifeblood of WC tourism. Here's how it works.</p>

    <h2>How base camps work</h2>
    <p>Each team's base camp must:</p>
    <ul>
      <li>Be in or near the country where the team plays its group-stage matches</li>
      <li>Include a training pitch meeting FIFA standards</li>
      <li>Have hotel infrastructure for 70-100 staff (players, coaches, medics, security)</li>
      <li>Provide privacy (high walls, security)</li>
      <li>Be accessible to host venues (drive or flight)</li>
    </ul>

    <h2>How teams choose</h2>
    <p>Teams send scouts in 2024-2025 to evaluate options. Considerations:</p>
    <ul>
      <li><strong>Climate similarity</strong> to home country (avoid altitude/heat shock)</li>
      <li><strong>Diaspora support</strong> — strong fan community nearby = home-like atmosphere</li>
      <li><strong>Hotel quality</strong> — 5-star facilities with private wings</li>
      <li><strong>Past WC base history</strong> (e.g., a hotel that hosted Brazil 2014 likely wants to host 2026)</li>
      <li><strong>Cost</strong> — base camps cost teams $3-8M for the duration</li>
    </ul>

    <h2>Notable base camps announced (as of June 2026)</h2>
    <p>FIFA published the official base camp catalogue in early 2026. Teams reveal their choices in phases:</p>
    <ul>
      <li><strong>Argentina:</strong> Likely Miami (Inter Miami training facility — Messi already trains there)</li>
      <li><strong>France:</strong> Reportedly chose a private resort in upstate New York for the group stage</li>
      <li><strong>Brazil:</strong> Florida-based, leveraging the 360,000-strong Brazilian community in the state</li>
      <li><strong>USMNT:</strong> Bases vary by group, likely centered in the Mid-Atlantic (NJ/PA)</li>
      <li><strong>England:</strong> Boston area (logistical advantage near MetLife)</li>
    </ul>

    <h2>Base camps as fan destinations</h2>
    <p>Fans often travel to base camp cities to:</p>
    <ul>
      <li>Watch training sessions (some are open to public, with restrictions)</li>
      <li>Get autographs at team hotels</li>
      <li>Soak up the local fan atmosphere (especially diaspora communities)</li>
      <li>Find cheaper accommodation than host venue cities</li>
    </ul>

    <h2>The 1994 precedent</h2>
    <p>USA 1994 was the first US World Cup. Brazil based in Cal State Los Angeles, Italy in Boston, Germany in Chicago. Those bases became local pilgrimage sites — and set the template for 2026.</p>

    <div class="cta-card">
      <h3>Learn the 50 states by playing</h3>
      <p>Statedoku uses "Hosts a WC 2026 base camp" as a constraint in its daily puzzle.</p>
      <a href="/">Play today's puzzle →</a>
    </div>

    <h2>Frequently asked questions</h2>
    <details><summary><strong>What is a World Cup base camp?</strong></summary><p>A team's training and accommodation base for the duration of the tournament. It includes a training pitch, hotel, and security infrastructure.</p></details>
    <details><summary><strong>Where will Argentina train?</strong></summary><p>Likely Miami, based on reported scouting visits and proximity to Inter Miami CF's training facility (where Messi already trains).</p></details>
    <details><summary><strong>Can fans visit base camps?</strong></summary><p>Some teams open training sessions to the public on certain days. Most have a public observation period at the start of camp and again before key matches.</p></details>
    <details><summary><strong>How much does a base camp cost?</strong></summary><p>$3-8 million per team for the tournament, paid for by national federations. Costs include hotel rental, training facility fees, security, and local transport.</p></details>
`,
    faq([
      ['What is a World Cup base camp?', 'A base camp is a team\'s training and accommodation base for the duration of the tournament. Each of the 48 teams chooses one, with a training pitch, hotel for 70-100 staff, and security infrastructure.'],
      ['Where will Argentina train at the 2026 World Cup?', 'Argentina is reported to base in Miami, leveraging the Inter Miami CF training facility where Lionel Messi already trains.'],
      ['How do teams choose their base camp?', 'Teams send scouts in 2024-2025 to evaluate options based on: climate similarity to home, proximity to host venues, diaspora support, hotel quality, and cost.'],
      ['Where did teams base at the 1994 USA World Cup?', 'Brazil based in Cal State Los Angeles, Italy in Boston, Germany in Chicago. Those bases set the template for 2026.'],
    ]),
    bcEN('team-base-camps-world-cup-2026','Team base camps'), hreflangEN('team-base-camps-world-cup-2026'), footerEN, 'en_US', '/learn/', 'Learn', relEN, '🏆 ⚽ TEAM BASE CAMPS')
]);

out.push(['learn/world-cup-2026-opening-ceremony',
  wrap('en', 'world-cup-2026-opening-ceremony',
    '2026 World Cup opening ceremony — Estadio Azteca, June 11 | Statedoku',
    'The 2026 World Cup opening ceremony is on June 11, 2026 at Estadio Azteca in Mexico City. What to expect: music, lights, FIFA traditions, who performs, history.',
    'world cup 2026 opening ceremony, fifa opening ceremony, estadio azteca opening, who performs world cup 2026',
    "World Cup 2026 — opening ceremony",
    "June 11, 2026. Estadio Azteca, Mexico City. What to expect before the first whistle.",
    `    <p>The <strong>2026 FIFA World Cup opening ceremony</strong> takes place on <strong>June 11, 2026</strong> at <strong>Estadio Azteca</strong> in Mexico City, immediately preceding the opening match. It's the global kickoff to 39 days of football.</p>

    <div class="wc-quick">
      <dl>
        <dt>Date</dt><dd>June 11, 2026</dd>
        <dt>Venue</dt><dd>Estadio Azteca, Mexico City</dd>
        <dt>Capacity</dt><dd>~87,000</dd>
        <dt>Format</dt><dd>~30 minutes preceding the opener</dd>
      </dl>
    </div>

    <h2>What to expect</h2>
    <p>FIFA opening ceremonies traditionally include:</p>
    <ul>
      <li>A blend of host country's cultural performances (Mexican mariachi, regional music)</li>
      <li>A massive stadium-wide light show / pyrotechnics</li>
      <li>One or two global pop stars performing the official anthem and tournament song</li>
      <li>A formal speech from FIFA's president (Gianni Infantino)</li>
      <li>The hoisting of all 48 team flags</li>
      <li>The tournament's "trophy procession" — the FIFA World Cup trophy displayed</li>
    </ul>

    <h2>Past opening ceremony highlights</h2>
    <ul>
      <li><strong>2022 Qatar:</strong> Morgan Freeman + Trinidad Cardona. Memorable for cultural mix.</li>
      <li><strong>2018 Russia:</strong> Robbie Williams. Iconic moment with his children.</li>
      <li><strong>2014 Brazil:</strong> Pitbull, Jennifer Lopez, Claudia Leitte performing "We Are One".</li>
      <li><strong>2010 South Africa:</strong> Shakira leading "Waka Waka".</li>
      <li><strong>1994 USA:</strong> Diana Ross missed the goal in her stunt!</li>
    </ul>

    <h2>Who will perform in 2026?</h2>
    <p>Performers are typically announced 3-6 months before the tournament. Rumored options for 2026 (NOT confirmed):</p>
    <ul>
      <li>A Mexican mainstream artist (Bad Bunny, Maluma)</li>
      <li>An American pop icon (Shakira, BTS member)</li>
      <li>A Canadian artist (Drake, Justin Bieber, The Weeknd)</li>
    </ul>
    <p>FIFA confirms the lineup officially via fifa.com/worldcup.</p>

    <h2>The 2026 official anthem</h2>
    <p>FIFA traditionally announces the official anthem 6-12 months before the tournament. The 2026 song was unveiled in 2025 and features artists from all 3 host countries.</p>

    <h2>How to watch the ceremony</h2>
    <p>The ceremony airs on:</p>
    <ul>
      <li><strong>USA:</strong> Fox Sports + Telemundo (Spanish)</li>
      <li><strong>Mexico:</strong> Televisa + Univisión</li>
      <li><strong>UK:</strong> BBC + ITV</li>
      <li><strong>Worldwide:</strong> FIFA+ streaming app</li>
    </ul>

    <div class="cta-card">
      <h3>Learn the host states by playing</h3>
      <p>Statedoku uses "Hosts the WC 2026" as a constraint in its daily puzzle.</p>
      <a href="/">Play today's puzzle →</a>
    </div>

    <h2>Frequently asked questions</h2>
    <details><summary><strong>When is the 2026 World Cup opening ceremony?</strong></summary><p>June 11, 2026 at Estadio Azteca in Mexico City, immediately before the opening match.</p></details>
    <details><summary><strong>Who performs at the 2026 World Cup opening ceremony?</strong></summary><p>Performers are announced 3-6 months before. FIFA confirms the lineup officially via fifa.com/worldcup.</p></details>
    <details><summary><strong>How long is the opening ceremony?</strong></summary><p>Approximately 30 minutes, preceding the opening match.</p></details>
    <details><summary><strong>Can I watch the ceremony online?</strong></summary><p>Yes. FIFA+ app streams it globally. In the US: Fox Sports + Telemundo (Spanish).</p></details>
`,
    faq([
      ['When is the 2026 World Cup opening ceremony?', 'June 11, 2026 at Estadio Azteca in Mexico City. It takes place immediately before the opening match.'],
      ['Who performs at the 2026 World Cup opening ceremony?', 'Performers are announced 3-6 months before the tournament. FIFA confirms the lineup officially via fifa.com/worldcup.'],
      ['How long does the opening ceremony last?', 'Approximately 30 minutes, immediately preceding the opening match.'],
      ['Where can I watch the 2026 World Cup opening ceremony?', 'FIFA+ streams it globally. In the US: Fox Sports + Telemundo (Spanish). In Mexico: Televisa + Univisión.'],
    ]),
    bcEN('world-cup-2026-opening-ceremony','Opening ceremony'), hreflangEN('world-cup-2026-opening-ceremony'), footerEN, 'en_US', '/learn/', 'Learn', relEN, '🏆 🎵 OPENING CEREMONY')
]);

out.push(['learn/world-cup-2026-closing-ceremony',
  wrap('en', 'world-cup-2026-closing-ceremony',
    '2026 World Cup closing ceremony — MetLife Stadium, July 19 | Statedoku',
    'The 2026 World Cup closing ceremony is at MetLife Stadium, New Jersey, before the Final on July 19, 2026. What to expect, past closing ceremonies, who performs.',
    'world cup 2026 closing ceremony, final ceremony fifa 2026, metlife stadium closing ceremony',
    "World Cup 2026 — closing ceremony",
    "July 19, 2026. MetLife Stadium, New Jersey. Before the Final.",
    `    <p>The <strong>2026 FIFA World Cup closing ceremony</strong> takes place on <strong>July 19, 2026</strong> at <strong>MetLife Stadium</strong> in East Rutherford, New Jersey, immediately preceding the Final. The Final caps 39 days of competition.</p>

    <h2>What's the closing ceremony?</h2>
    <p>Unlike the opening ceremony, the closing ceremony is more compact — typically 15-20 minutes. It serves as a transition between the 3rd place match (July 18) and the Final, marking the end of the tournament. Format:</p>
    <ul>
      <li>A musical performance (1-2 acts)</li>
      <li>A pyrotechnics/lights display</li>
      <li>Brief tribute to the host nations</li>
      <li>Optional player tributes or hall-of-fame moments</li>
    </ul>

    <h2>Past closing ceremony highlights</h2>
    <ul>
      <li><strong>2022 Qatar:</strong> Combined with opening — focus on cultural displays.</li>
      <li><strong>2018 Russia:</strong> Tchaikovsky, Russian ballet.</li>
      <li><strong>2014 Brazil:</strong> Shakira + Wyclef Jean — "La La La" remix.</li>
      <li><strong>2010 South Africa:</strong> Shakira + Spanish artists.</li>
    </ul>

    <h2>The MetLife venue</h2>
    <p>MetLife Stadium seats 82,500 — the largest US venue. It's hosting a Super Bowl in 2014, the WrestleMania in 2013, and now the WC Final. The ceremony will be designed for both stadium spectators and global TV audience (1B+).</p>

    <h2>The award ceremony (post-final)</h2>
    <p>After the Final whistle, the formal award ceremony begins:</p>
    <ul>
      <li><strong>Bronze medal:</strong> 3rd place team</li>
      <li><strong>Silver medal:</strong> Final losers</li>
      <li><strong>Trophy presentation:</strong> Winners receive the FIFA World Cup trophy from FIFA's president + host country leader</li>
      <li><strong>Golden Boot:</strong> Top scorer of the tournament</li>
      <li><strong>Golden Ball:</strong> Best player of the tournament (Adidas)</li>
      <li><strong>Golden Glove:</strong> Best goalkeeper</li>
      <li><strong>Best Young Player:</strong> Under 21</li>
    </ul>

    <h2>The 2022 trophy lift</h2>
    <p>Messi's iconic trophy lift in 2022 Qatar is the benchmark moment. 2026 winner will mark either Mbappé's 2nd or a new era.</p>

    <div class="cta-card">
      <h3>Learn the host states by playing</h3>
      <p>Statedoku uses "Hosts the Final" or "NJ" as constraints in its daily puzzle.</p>
      <a href="/">Play today's puzzle →</a>
    </div>

    <h2>Frequently asked questions</h2>
    <details><summary><strong>When is the closing ceremony?</strong></summary><p>July 19, 2026 at MetLife Stadium, New Jersey, immediately before the Final.</p></details>
    <details><summary><strong>How long does the closing ceremony last?</strong></summary><p>Approximately 15-20 minutes, before the Final kickoff.</p></details>
    <details><summary><strong>Who performs at the closing ceremony?</strong></summary><p>Performers are confirmed 1-2 months before the Final. Past ceremonies featured Shakira, Wyclef Jean, and major global pop stars.</p></details>
    <details><summary><strong>What awards are given after the Final?</strong></summary><p>FIFA awards the World Cup trophy, Golden Boot (top scorer), Golden Ball (best player), Golden Glove (best goalkeeper), and Best Young Player.</p></details>
`,
    faq([
      ['When is the 2026 World Cup closing ceremony?', 'July 19, 2026 at MetLife Stadium in East Rutherford, New Jersey, immediately before the Final.'],
      ['How long is the closing ceremony?', 'Approximately 15-20 minutes, taking place before the Final kickoff.'],
      ['What awards are given after the World Cup Final?', 'FIFA awards the trophy to the winners plus the Golden Boot (top scorer), Golden Ball (best player), Golden Glove (best goalkeeper), and Best Young Player Award.'],
      ['Where can I watch the closing ceremony?', 'FIFA+ streams it globally. In the US: Fox Sports + Telemundo.'],
    ]),
    bcEN('world-cup-2026-closing-ceremony','Closing ceremony'), hreflangEN('world-cup-2026-closing-ceremony'), footerEN, 'en_US', '/learn/', 'Learn', relEN, '🏆 🎵 CLOSING CEREMONY')
]);

out.push(['learn/world-cup-2026-vs-usa-1994',
  wrap('en', 'world-cup-2026-vs-usa-1994',
    'World Cup 2026 vs 1994 USA — what changed | Statedoku',
    'How does the 2026 World Cup in the USA compare to USA 1994? Teams (48 vs 24), matches (104 vs 52), revenue, venues, ticket prices, attendance.',
    'world cup 2026 vs 1994, usa 1994 world cup, fifa 1994 vs 2026, world cup usa comparison',
    "World Cup 2026 vs 1994 USA",
    "How the second US-hosted World Cup compares to the first. Teams, matches, venues, revenue.",
    `    <p>The <strong>2026 FIFA World Cup</strong> is the <strong>second time the USA has hosted</strong>. The first was <strong>USA 1994</strong>. Both transformed American football culture. Here's the comparison.</p>

    <table class="lt">
      <thead><tr><th>Metric</th><th>USA 1994</th><th>USA-Canada-Mexico 2026</th></tr></thead>
      <tbody>
        <tr><td>Teams</td><td>24</td><td><strong>48</strong></td></tr>
        <tr><td>Matches</td><td>52</td><td><strong>104</strong></td></tr>
        <tr><td>Host countries</td><td>1 (USA)</td><td><strong>3 (USA + Canada + Mexico)</strong></td></tr>
        <tr><td>US venues</td><td>9</td><td><strong>11</strong></td></tr>
        <tr><td>Final venue</td><td>Rose Bowl, Pasadena (CA)</td><td><strong>MetLife Stadium (NJ)</strong></td></tr>
        <tr><td>Final attendance</td><td>94,194</td><td>~82,500</td></tr>
        <tr><td>Winner</td><td>Brazil (vs Italy, pens)</td><td>TBD</td></tr>
        <tr><td>Top scorer</td><td>Hristo Stoichkov + Oleg Salenko (6)</td><td>TBD</td></tr>
        <tr><td>Total attendance</td><td>3.6M (record)</td><td>5-6M (projected)</td></tr>
        <tr><td>FIFA revenue</td><td>$3.6B</td><td>~$11B+ (projected)</td></tr>
        <tr><td>Tournament length</td><td>31 days</td><td>39 days</td></tr>
        <tr><td>Format change</td><td>3-points-for-win debuted</td><td>R32 stage debuts</td></tr>
      </tbody>
    </table>

    <h2>What 1994 changed forever</h2>
    <p>USA 1994 transformed the world game:</p>
    <ul>
      <li><strong>Highest attendance per match ever:</strong> 68,991 average (record stood until 2026)</li>
      <li><strong>FIFA's first $1B+ revenue WC</strong></li>
      <li><strong>3 points for a win</strong> debuted (replacing 2)</li>
      <li><strong>Major League Soccer (MLS) born</strong> as part of US WC bid commitments — first MLS season 1996</li>
      <li><strong>Final stadium not soccer-purpose-built</strong> — Rose Bowl was historic for football fans but built for college football</li>
    </ul>

    <h2>What 2026 changes again</h2>
    <p>2026 will be the first to:</p>
    <ul>
      <li><strong>Host 48 teams</strong> in a Round of 32 format</li>
      <li><strong>Be co-hosted by 3 nations</strong></li>
      <li><strong>Have 3 mascots</strong> (Maple, Zayu, Clutch)</li>
      <li><strong>Span 39 days</strong> (Qatar 2022 was 28)</li>
      <li><strong>Use Goal-Line Technology</strong> + VAR universally</li>
      <li><strong>Generate $11B+ in revenue</strong> (Qatar was $7.5B)</li>
    </ul>

    <h2>Iconic moments from 1994 to remember</h2>
    <ul>
      <li><strong>Brazil 0-0 Italy</strong> — first WC Final decided on penalties (Brazil won 3-2)</li>
      <li><strong>Baggio's miss</strong> — Roberto Baggio sent his penalty over the bar</li>
      <li><strong>Bulgaria's run</strong> — went all the way to the semifinals as huge underdogs</li>
      <li><strong>Andrés Escobar tragedy</strong> — Colombian defender killed days after scoring an own goal vs USA</li>
      <li><strong>Maradona's exit</strong> — Argentina's Maradona tested positive for ephedrine, sent home</li>
      <li><strong>Stoichkov's coronation</strong> — Bulgarian striker won Golden Boot</li>
    </ul>

    <div class="cta-card">
      <h3>Learn the host states by playing</h3>
      <p>Statedoku uses "Hosts a 2026 WC match" as a constraint in its daily puzzle.</p>
      <a href="/">Play today's puzzle →</a>
    </div>

    <h2>Frequently asked questions</h2>
    <details><summary><strong>When was the previous US World Cup?</strong></summary><p>1994. The US hosted the entire tournament. Brazil won by beating Italy on penalties in the Rose Bowl Final.</p></details>
    <details><summary><strong>How many more matches in 2026 than 1994?</strong></summary><p>52 more (104 vs 52). The expansion to 48 teams + the new Round of 32 stage explain the increase.</p></details>
    <details><summary><strong>Where was the 1994 World Cup Final?</strong></summary><p>Rose Bowl in Pasadena, California. Brazil beat Italy 3-2 on penalties after 0-0.</p></details>
    <details><summary><strong>How many US venues in 1994 vs 2026?</strong></summary><p>9 in 1994 (Boston, Chicago, Dallas, Detroit, LA, NYC, Orlando, San Francisco, Washington DC). 11 in 2026 (Atlanta, Boston, Dallas, Houston, Kansas City, LA, Miami, NY/NJ, Philadelphia, SF Bay, Seattle).</p></details>
`,
    faq([
      ['When was the previous US World Cup?', '1994. The US hosted the entire tournament with 24 teams across 9 venues. Brazil won by beating Italy on penalties in the Rose Bowl Final.'],
      ['How does the 2026 World Cup format differ from 1994?', '2026 has 48 teams (vs 24), 104 matches (vs 52), 3 host countries (vs 1), 11 US venues (vs 9), and a new Round of 32 stage.'],
      ['Where was the 1994 World Cup Final?', 'Rose Bowl in Pasadena, California. Brazil beat Italy 3-2 on penalties after a 0-0 draw. It was the first WC Final ever decided on penalties.'],
      ['What was special about the 1994 World Cup for football?', 'Highest WC attendance ever per match (68,991 average), first $1B+ FIFA revenue, debut of 3-points-for-win, and MLS was created as a result of the US bid.'],
    ]),
    bcEN('world-cup-2026-vs-usa-1994','WC 2026 vs USA 1994'), hreflangEN('world-cup-2026-vs-usa-1994'), footerEN, 'en_US', '/learn/', 'Learn', relEN, '🏆 ⏪ 2026 vs USA 1994')
]);

out.push(['learn/world-cup-2026-ticket-prices',
  wrap('en', 'world-cup-2026-ticket-prices',
    '2026 World Cup ticket prices — every match phase + how to buy | Statedoku',
    'How much do 2026 World Cup tickets cost? Group stage $60-$300, R32 $80-$400, R16 $150-$500, QF $300-$1K, SF $500-$2.5K, Final $1K-$6K. Plus how to buy.',
    'world cup 2026 ticket prices, fifa 2026 tickets cost, how much world cup 2026 final tickets, world cup 2026 ticket buy guide',
    "World Cup 2026 — ticket prices by phase",
    "Group stage $60-$300. R32 $80-$400. R16 $150-$500. Final $1K-$6K. The full breakdown.",
    `    <p>FIFA released the 2026 World Cup ticket pricing in late 2025. Prices vary by phase, venue, and seat category. Here's the complete breakdown.</p>

    <h2>Official ticket price ranges (face value, USD)</h2>
    <table class="lt">
      <thead><tr><th>Phase</th><th>Cheapest</th><th>Most expensive</th><th>Notes</th></tr></thead>
      <tbody>
        <tr><td><strong>Group stage</strong></td><td>$60</td><td>$300</td><td>72 matches. Best value.</td></tr>
        <tr><td><strong>Round of 32 (NEW)</strong></td><td>$80</td><td>$400</td><td>16 matches. Debuts in 2026.</td></tr>
        <tr><td><strong>Round of 16</strong></td><td>$150</td><td>$500</td><td>8 matches.</td></tr>
        <tr><td><strong>Quarter-Finals</strong></td><td>$300</td><td>$1,000</td><td>4 matches.</td></tr>
        <tr><td><strong>Semi-Finals</strong></td><td>$500</td><td>$2,500</td><td>2 matches at major venues.</td></tr>
        <tr><td><strong>3rd Place</strong></td><td>$300</td><td>$1,500</td><td>July 18 — consolation final.</td></tr>
        <tr><td><strong>FINAL</strong></td><td>$1,000</td><td>$6,000</td><td>July 19 — MetLife Stadium.</td></tr>
      </tbody>
    </table>

    <h2>Resale market prices (typical)</h2>
    <p>Once first-phase tickets sold out, secondary market prices have moved:</p>
    <ul>
      <li><strong>Group stage:</strong> Up 30-100% above face value</li>
      <li><strong>R32 / R16:</strong> Up 50-150%</li>
      <li><strong>Quarter-Finals:</strong> Up 100-300%</li>
      <li><strong>Semi-Finals:</strong> Up 200-500%</li>
      <li><strong>Final:</strong> $5,000 - $30,000+ depending on teams</li>
    </ul>

    <h2>How to buy</h2>
    <h3>Official channels</h3>
    <ul>
      <li><strong>FIFA.com/tickets</strong> — primary sale, by random ballot during phases</li>
      <li><strong>FIFA Ticket Resale</strong> — official resale platform, post-purchase exchange</li>
      <li><strong>Hospitality packages</strong> — via FIFA partners (Wonder, MATCH Hospitality). $5K-$50K+ per match.</li>
    </ul>

    <h3>Secondary market (legal in USA)</h3>
    <ul>
      <li><strong>StubHub</strong> — verified, anti-fraud protections</li>
      <li><strong>Vivid Seats</strong> — verified</li>
      <li><strong>SeatGeek</strong> — verified</li>
      <li>Avoid: Craigslist, eBay, social media DMs — high fraud risk</li>
    </ul>

    <h2>Tips to save money</h2>
    <ul>
      <li><strong>Buy via FIFA's last-minute ballot</strong> — leftover seats often go for face value</li>
      <li><strong>Target non-knockout matches</strong> — group-stage between mid-tier teams = cheapest</li>
      <li><strong>Avoid headliner teams</strong> — Brazil/Argentina/USA matches command premium prices</li>
      <li><strong>Avoid the Final</strong> — historically the highest-priced match. Watch in a fan zone or bar instead.</li>
    </ul>

    <h2>Categories</h2>
    <p>Within each phase, FIFA sells multiple seat categories:</p>
    <ul>
      <li><strong>Category 1:</strong> Closest to action. Premium prices.</li>
      <li><strong>Category 2:</strong> Lower bowl, slightly farther.</li>
      <li><strong>Category 3:</strong> Upper bowl.</li>
      <li><strong>Category 4 (host country residents only):</strong> Available only to people with US/Canada/Mexico billing addresses. Heavily discounted.</li>
    </ul>

    <div class="cta-card">
      <h3>Learn the US host states by playing</h3>
      <p>Statedoku uses "Hosts a WC 2026 match" as a constraint.</p>
      <a href="/">Play today's puzzle →</a>
    </div>

    <h2>Frequently asked questions</h2>
    <details><summary><strong>How much is a 2026 World Cup ticket?</strong></summary><p>Group stage: $60-$300. Final: $1,000-$6,000. Resale prices can be much higher.</p></details>
    <details><summary><strong>Where do I buy 2026 World Cup tickets?</strong></summary><p>Official: FIFA.com/tickets. Verified resale: StubHub, Vivid Seats, SeatGeek. Avoid unverified social media listings.</p></details>
    <details><summary><strong>Are 2026 World Cup tickets sold out?</strong></summary><p>First-phase tickets sold out in October 2025. Subsequent phases (last-minute ballot, resale) remain available through the tournament.</p></details>
    <details><summary><strong>How much do Final tickets cost?</strong></summary><p>Face value: $1,000-$6,000. Resale: $5,000-$30,000+ depending on which teams qualify.</p></details>
`,
    faq([
      ['How much do 2026 World Cup tickets cost?', 'Group stage: $60-$300. Round of 32: $80-$400. Round of 16: $150-$500. Quarter-Finals: $300-$1,000. Semi-Finals: $500-$2,500. Final: $1,000-$6,000 face value.'],
      ['Where do you buy 2026 World Cup tickets officially?', 'Only at FIFA.com/tickets. For secondary market, use verified resellers like StubHub, Vivid Seats, or SeatGeek. Avoid social media or unverified listings due to fraud risk.'],
      ['How much do 2026 World Cup Final tickets cost?', 'Face value: $1,000-$6,000. Secondary market: $5,000-$30,000+ depending on which teams qualify for the Final.'],
      ['Are 2026 World Cup tickets still available?', 'First-phase tickets sold out in October 2025. Subsequent phases (last-minute ballot in April-June 2026 and resale all year) remain available.'],
    ]),
    bcEN('world-cup-2026-ticket-prices','Ticket prices'), hreflangEN('world-cup-2026-ticket-prices'), footerEN, 'en_US', '/learn/', 'Learn', relEN, '🏆 🎟️ TICKET PRICES')
]);

out.push(['learn/world-cup-2026-fan-zones',
  wrap('en', 'world-cup-2026-fan-zones',
    '2026 World Cup fan zones — where to watch in every host city | Statedoku',
    'Official fan zones for the 2026 World Cup in each US host city: NYC Times Square, LA Grand Park, Miami Bayfront, Dallas Klyde Warren, etc. Free entry, big screens, food.',
    'world cup 2026 fan zones, where to watch world cup 2026, fifa fan fest 2026, world cup 2026 watch parties',
    "World Cup 2026 fan zones",
    "Where to watch in each US host city. Big screens, free entry, food, atmosphere.",
    `    <p>Even without tickets, you can experience the 2026 World Cup atmosphere at <strong>official FIFA Fan Festivals</strong> + city-organized fan zones in each US host city. They're free, family-friendly, and have huge screens.</p>

    <h2>What's a fan zone?</h2>
    <ul>
      <li>A central public space (park, plaza, square)</li>
      <li>Huge LED screens broadcasting every match</li>
      <li>Food trucks + alcohol vendors</li>
      <li>Live music + DJs between matches</li>
      <li>Merchandise booths</li>
      <li>Free entry (some require ticket for big matches)</li>
    </ul>

    <h2>Confirmed fan zones by US host city</h2>

    <h3>Atlanta — Centennial Olympic Park</h3>
    <p>Same park used for 1996 Olympics. Walking distance from Mercedes-Benz Stadium.</p>

    <h3>Boston — Boston Common</h3>
    <p>The country's oldest public park. Free big-screen viewing of every match.</p>

    <h3>Dallas — Klyde Warren Park</h3>
    <p>Park built over a freeway. Modern, walkable, downtown Dallas location.</p>

    <h3>Houston — Discovery Green</h3>
    <p>12-acre park downtown. Massive capacity, full WC programming.</p>

    <h3>Kansas City — Power & Light District</h3>
    <p>Outdoor entertainment district downtown. WC takeover for all 6 KC matches.</p>

    <h3>Los Angeles — Grand Park + Hollywood Bowl plaza</h3>
    <p>Massive screens at Grand Park (downtown LA). Some matches also at the Hollywood Bowl plaza.</p>

    <h3>Miami — Bayfront Park</h3>
    <p>Waterfront park downtown. Beachy vibe, Cuban + Latin food trucks.</p>

    <h3>New York / NJ — Times Square + Pier 17</h3>
    <p>Times Square gets a WC takeover for big matches. Pier 17 (Seaport) for more relaxed viewing.</p>

    <h3>Philadelphia — Independence Mall</h3>
    <p>Historic core of the city. Big screen for every match, especially USMNT.</p>

    <h3>San Francisco Bay Area — Civic Center Plaza + Levi's Stadium plaza</h3>
    <p>Civic Center plaza in downtown SF. Plus on-site outdoor area at Levi's Stadium in Santa Clara.</p>

    <h3>Seattle — Seattle Center</h3>
    <p>Home of the Space Needle. WC fan zone occupies the central plaza.</p>

    <h2>How to find a fan zone for your match</h2>
    <ul>
      <li><strong>Official FIFA Fan Festival</strong> — fifa.com/fanfestival lists all official sites</li>
      <li><strong>City tourism boards</strong> — local sites have additional unofficial zones</li>
      <li><strong>Sports bars</strong> — every major US city has dedicated soccer-bars for matches</li>
    </ul>

    <div class="cta-card">
      <h3>Learn the host states by playing</h3>
      <p>Statedoku uses "Hosts a 2026 WC match" as a constraint.</p>
      <a href="/">Play today's puzzle →</a>
    </div>

    <h2>Frequently asked questions</h2>
    <details><summary><strong>What is a World Cup fan zone?</strong></summary><p>A central public space with big screens broadcasting every match, food, drinks, music, and free entry. The alternative for fans without match tickets.</p></details>
    <details><summary><strong>Where is the NYC fan zone?</strong></summary><p>Times Square gets a WC takeover for big matches. Pier 17 in the Seaport has additional FIFA Fan Festival space.</p></details>
    <details><summary><strong>Is entry to fan zones free?</strong></summary><p>Mostly free, but some big matches require an RSVP / wristband. Check fifa.com/fanfestival.</p></details>
`,
    faq([
      ['Are 2026 World Cup fan zones free?', 'Mostly free entry, though some big-name matches require an RSVP or wristband. Check the official FIFA Fan Festival page for each city.'],
      ['Where is the NYC World Cup fan zone?', 'Times Square gets a WC takeover for big matches. Pier 17 in the Seaport has additional FIFA Fan Festival space.'],
      ['Are fan zones family-friendly?', 'Yes. Fan zones welcome children and families, with food, music, and merchandise. Some sell alcohol but with separated areas.'],
      ['Can I bring a chair or umbrella to a fan zone?', 'Most fan zones have seating provided. Outside chairs and large umbrellas are usually not allowed inside.'],
    ]),
    bcEN('world-cup-2026-fan-zones','Fan zones'), hreflangEN('world-cup-2026-fan-zones'), footerEN, 'en_US', '/learn/', 'Learn', relEN, '🏆 📺 FAN ZONES')
]);

out.push(['learn/world-cup-2026-ball',
  wrap('en', 'world-cup-2026-ball',
    '2026 World Cup ball — official match ball, design, technology | Statedoku',
    'The 2026 FIFA World Cup official match ball: design, technology (connected ball tech, AI VAR), manufacturer (Adidas), history of WC official balls.',
    'world cup 2026 ball, fifa 2026 official ball, adidas world cup 2026, world cup ball history',
    "The 2026 World Cup official ball",
    "Connected ball technology, AI-assisted VAR, the manufacturer (Adidas), and the design.",
    `    <p>FIFA and <strong>Adidas</strong> unveiled the official ball of the <strong>2026 FIFA World Cup</strong> in November 2025. It builds on the connected-ball tech that debuted at Qatar 2022 (Al Rihla).</p>

    <h2>Key facts</h2>
    <ul>
      <li><strong>Manufacturer:</strong> Adidas (their 14th consecutive WC ball)</li>
      <li><strong>Design:</strong> Tri-color motif honoring USA, Canada, Mexico</li>
      <li><strong>Technology:</strong> Connected Ball with 500Hz IMU sensor, contributing to AI-assisted VAR</li>
      <li><strong>Material:</strong> Polyurethane outer + textured surface for grip</li>
      <li><strong>Weight:</strong> 410-450g (FIFA standard)</li>
      <li><strong>Circumference:</strong> 68-70cm (FIFA standard)</li>
    </ul>

    <h2>Connected ball technology</h2>
    <p>The ball contains a 500Hz Inertial Measurement Unit (IMU) sensor at its center, sending data to VAR officials in real-time. This means:</p>
    <ul>
      <li>Precise <strong>offside detection</strong> at the moment of contact</li>
      <li>Faster <strong>handball decisions</strong></li>
      <li>Better understanding of <strong>foul moments</strong> in tight challenges</li>
      <li>Real-time data for <strong>broadcast graphics</strong></li>
    </ul>

    <h2>Design symbolism</h2>
    <p>The ball features three intersecting visual zones representing the three host countries: red zones for USA + Canada, green for Mexico, white connecting them. Subtle iconography includes:</p>
    <ul>
      <li><strong>Stars and stripes</strong> motif (USA)</li>
      <li><strong>Maple leaf</strong> pattern (Canada)</li>
      <li><strong>Aztec geometric design</strong> (Mexico)</li>
    </ul>

    <h2>History of FIFA World Cup balls</h2>
    <table class="lt">
      <thead><tr><th>Year</th><th>Name</th><th>Notable</th></tr></thead>
      <tbody>
        <tr><td>2026</td><td>TBD</td><td>Connected ball + AI-VAR</td></tr>
        <tr><td>2022 Qatar</td><td>Al Rihla</td><td>First connected ball ever</td></tr>
        <tr><td>2018 Russia</td><td>Telstar 18</td><td>Tribute to 1970 Telstar</td></tr>
        <tr><td>2014 Brazil</td><td>Brazuca</td><td>Public vote for name</td></tr>
        <tr><td>2010 South Africa</td><td>Jabulani</td><td>Controversial — claims of unpredictable flight</td></tr>
        <tr><td>2006 Germany</td><td>Teamgeist</td><td>14 panels instead of traditional 32</td></tr>
        <tr><td>1994 USA</td><td>Questra</td><td>First polyurethane ball</td></tr>
        <tr><td>1970 Mexico</td><td>Telstar</td><td>The classic black-and-white 32-panel design</td></tr>
      </tbody>
    </table>

    <h2>Adidas's 14 consecutive WC balls</h2>
    <p>Adidas has supplied every official WC ball since 1970 — 14 consecutive tournaments. This is the longest manufacturer relationship in WC history.</p>

    <h2>How to buy the ball</h2>
    <p>Official 2026 WC ball replicas are sold at:</p>
    <ul>
      <li><strong>adidas.com</strong> — official retailer</li>
      <li><strong>FIFA Store</strong> at host venues + airports</li>
      <li><strong>Soccer.com</strong>, Dick's Sporting Goods, etc. — authorized retailers</li>
      <li>Price: ~$165 retail, $40 for youth-size replica</li>
    </ul>

    <div class="cta-card">
      <h3>Learn the host states by playing</h3>
      <p>Statedoku uses "Hosts the WC 2026" as a constraint in its daily puzzle.</p>
      <a href="/">Play today's puzzle →</a>
    </div>

    <h2>Frequently asked questions</h2>
    <details><summary><strong>Who makes the 2026 World Cup ball?</strong></summary><p>Adidas — their 14th consecutive WC official ball, going back to 1970.</p></details>
    <details><summary><strong>Does the 2026 ball have technology in it?</strong></summary><p>Yes. It contains a 500Hz Inertial Measurement Unit (IMU) sensor that sends data to FIFA's AI-assisted VAR system in real-time, enabling precise offside and foul detection.</p></details>
    <details><summary><strong>How much does the official ball cost?</strong></summary><p>~$165 for an official replica adult ball, $40 for youth-size. Available at adidas.com and major US sports retailers.</p></details>
    <details><summary><strong>When was the 2026 ball unveiled?</strong></summary><p>November 2025 — about 7 months before the tournament. Adidas typically announces a major launch event.</p></details>
`,
    faq([
      ['Who makes the 2026 World Cup ball?', 'Adidas. The 2026 ball is Adidas\' 14th consecutive official World Cup ball, going back to 1970.'],
      ['Does the 2026 World Cup ball have technology in it?', 'Yes. The ball contains a 500Hz Inertial Measurement Unit (IMU) sensor that sends data to the AI-assisted VAR system in real-time, enabling precise offside and foul detection.'],
      ['How much does the official 2026 World Cup ball cost?', 'About $165 for an official replica adult ball, $40 for youth-size. Available at adidas.com and major US sports retailers.'],
      ['When was the 2026 World Cup ball revealed?', 'November 2025, about 7 months before the tournament. Adidas typically holds a major launch event a few months before each World Cup.'],
    ]),
    bcEN('world-cup-2026-ball','Official ball'), hreflangEN('world-cup-2026-ball'), footerEN, 'en_US', '/learn/', 'Learn', relEN, '🏆 ⚽ THE OFFICIAL BALL')
]);

out.push(['learn/world-cup-2026-anthem',
  wrap('en', 'world-cup-2026-anthem',
    '2026 World Cup official anthem and songs — who sings the FIFA hymn | Statedoku',
    'The 2026 FIFA World Cup official anthem and songs. Past WC songs (Shakira, Pitbull, Robbie Williams). Who performs at the opening + closing ceremonies.',
    'world cup 2026 song, fifa 2026 anthem, who sings world cup 2026, official song fifa 2026',
    "World Cup 2026 official anthem & songs",
    "Past WC songs from Shakira to Pitbull. Who's likely on the 2026 official soundtrack.",
    `    <p>FIFA traditionally commissions an <strong>official World Cup anthem</strong> and a <strong>tournament song</strong> for each tournament. These become global hits.</p>

    <h2>The FIFA Anthem (instrumental)</h2>
    <p>FIFA has used the same <strong>"FIFA Anthem"</strong> since 1994. It plays before every WC match — a 30-second instrumental fanfare composed by Franz Lambert. You hear it as players line up in the tunnel and walk onto the pitch.</p>

    <h2>The 2026 World Cup Song</h2>
    <p>The official 2026 WC song was unveiled in early 2026. Tradition mixes:</p>
    <ul>
      <li>A globally recognized pop star</li>
      <li>A host country artist</li>
      <li>Latin music influence (especially for 2026 with Mexican co-hosting)</li>
    </ul>

    <h2>History of memorable WC songs</h2>
    <table class="lt">
      <thead><tr><th>Year</th><th>Host</th><th>Song</th><th>Artists</th></tr></thead>
      <tbody>
        <tr><td>2022</td><td>Qatar</td><td>"Tukoh Taka"</td><td>Nicki Minaj, Maluma, Myriam Fares</td></tr>
        <tr><td>2018</td><td>Russia</td><td>"Live It Up"</td><td>Will Smith, Nicky Jam, Era Istrefi</td></tr>
        <tr><td>2014</td><td>Brazil</td><td>"We Are One (Ole Ola)"</td><td>Pitbull, Jennifer Lopez, Claudia Leitte</td></tr>
        <tr><td>2010</td><td>South Africa</td><td>"Waka Waka (This Time for Africa)"</td><td>Shakira, Freshlyground</td></tr>
        <tr><td>2006</td><td>Germany</td><td>"The Time of Our Lives"</td><td>Il Divo, Toni Braxton</td></tr>
        <tr><td>2002</td><td>Korea/Japan</td><td>"Boom"</td><td>Anastacia</td></tr>
        <tr><td>1998</td><td>France</td><td>"La Cup de la Vie"</td><td>Ricky Martin</td></tr>
        <tr><td>1994</td><td>USA</td><td>"Gloryland"</td><td>Daryl Hall, Sounds of Blackness</td></tr>
        <tr><td>1990</td><td>Italy</td><td>"Un'estate italiana"</td><td>Edoardo Bennato, Gianna Nannini</td></tr>
        <tr><td>1986</td><td>Mexico</td><td>"El mundo unido por un balón"</td><td>Stephanie Lawrence, Plácido Domingo</td></tr>
      </tbody>
    </table>

    <h2>Why these songs become hits</h2>
    <ul>
      <li>Played at every match before kickoff</li>
      <li>Used in every TV graphic / preview</li>
      <li>Featured in opening + closing ceremonies</li>
      <li>Global radio rotation for 6+ months around tournament</li>
      <li>Shakira's "Waka Waka" has 4+ billion YouTube views</li>
    </ul>

    <h2>The Shakira gold standard</h2>
    <p>"Waka Waka" (2010) is widely considered the greatest WC song ever. Shakira will likely be courted again for 2026 given:</p>
    <ul>
      <li>Her Latin appeal (Mexican audience)</li>
      <li>Her US-based career (lives in Miami)</li>
      <li>Her proven track record</li>
    </ul>

    <h2>Tournament song vs. anthem</h2>
    <p><strong>Tournament song</strong> = the pop hit performed at ceremonies + in branding (like Waka Waka).</p>
    <p><strong>FIFA Anthem</strong> = the same instrumental fanfare used since 1994, played before every match.</p>

    <div class="cta-card">
      <h3>Learn the host states by playing</h3>
      <p>Statedoku uses "Hosts the WC 2026" as a constraint.</p>
      <a href="/">Play today's puzzle →</a>
    </div>

    <h2>Frequently asked questions</h2>
    <details><summary><strong>What is the 2026 World Cup anthem?</strong></summary><p>The FIFA Anthem (used since 1994) is the instrumental fanfare played before every match. The tournament song is announced by FIFA in early 2026.</p></details>
    <details><summary><strong>Who sings the 2026 World Cup official song?</strong></summary><p>Announced by FIFA. Past performers include Shakira, Pitbull, Jennifer Lopez, Nicki Minaj. 2026 lineup confirms in early 2026.</p></details>
    <details><summary><strong>What's the most famous WC song?</strong></summary><p>"Waka Waka" by Shakira (2010 South Africa). 4+ billion YouTube views — the most viewed WC song ever.</p></details>
    <details><summary><strong>What song did Ricky Martin sing for the World Cup?</strong></summary><p>"La Copa de la Vida" / "The Cup of Life" — 1998 France.</p></details>
`,
    faq([
      ['What is the 2026 World Cup anthem?', 'The FIFA Anthem, used since 1994, is the instrumental fanfare played before every World Cup match. The tournament song (pop track) is announced by FIFA closer to the tournament.'],
      ['Who sings the 2026 World Cup official song?', 'Performers are announced by FIFA, typically 3-6 months before the tournament. Past WC song performers include Shakira, Pitbull, Jennifer Lopez, Will Smith, and Ricky Martin.'],
      ['What is the most famous World Cup song ever?', '"Waka Waka (This Time for Africa)" by Shakira (2010 South Africa). It has 4+ billion YouTube views and is widely considered the greatest World Cup song.'],
      ['What song did Ricky Martin sing for the World Cup?', '"La Copa de la Vida" (The Cup of Life) for the 1998 France World Cup. It became one of the most globally successful WC songs ever.'],
    ]),
    bcEN('world-cup-2026-anthem','Anthem & songs'), hreflangEN('world-cup-2026-anthem'), footerEN, 'en_US', '/learn/', 'Learn', relEN, '🏆 🎵 THE WC SONG')
]);

out.push(['learn/best-us-city-world-cup-2026-tourism',
  wrap('en', 'best-us-city-world-cup-2026-tourism',
    'Best US city to visit for the 2026 World Cup — ranked | Statedoku',
    "Ranking the best US host cities for 2026 World Cup tourism. Miami for beach + matches, NYC for culture + final, LA for stars, Boston for history. Pros + cons for each.",
    "best city for world cup 2026, where to visit world cup 2026, world cup 2026 tourism, world cup 2026 best base city",
    "Best US city to visit for the WC 2026",
    "Ranking the 11 US host cities. Pros, cons, best for what kind of fan.",
    `    <p>If you're visiting the USA for the 2026 World Cup, which host city should be your base? Here's a ranking by tourist value.</p>

    <h2>Best for first-timers — New York / NJ area</h2>
    <p><strong>Why:</strong> Iconic global destination + hosts the FINAL + 8 matches + NJ Transit easy to MetLife + endless food/culture/things to do.</p>
    <p><strong>Cons:</strong> Most expensive hotels ($200-$400/night during WC), MetLife is in NJ not NYC, summer heat + humidity.</p>

    <h2>Best for beach lovers — Miami</h2>
    <p><strong>Why:</strong> Beach + matches at Hard Rock + Cuban + Latin food + Messi's home club + Cuban / Argentine / Brazilian / Colombian diaspora makes for amazing atmosphere.</p>
    <p><strong>Cons:</strong> Notoriously bad public transit (rideshare/car needed), expensive Latin diaspora-driven hotel prices, summer thunderstorms.</p>

    <h2>Best for budget travelers — Houston / Dallas / Kansas City</h2>
    <p><strong>Why:</strong> Cheaper hotels than coastal cities (under $200/night possible), central location for road trips, multiple matches at indoor venues (no weather worry).</p>
    <p><strong>Cons:</strong> Less iconic for first-time visitors, less walkable, less cultural variety.</p>

    <h2>Best for culture / history — Boston / Philadelphia</h2>
    <p><strong>Why:</strong> Walkable historic centers + multiple matches at major venues (Gillette/Lincoln Financial) + close to NYC + university culture.</p>
    <p><strong>Cons:</strong> Gillette is 25 miles from Boston in Foxborough, Lincoln Financial is downtown Philly but less to do than NYC.</p>

    <h2>Best for celebrity-watching — Los Angeles</h2>
    <p><strong>Why:</strong> Star-studded fan presence, SoFi Stadium is iconic, Hollywood + beaches + Mexican diaspora.</p>
    <p><strong>Cons:</strong> Massive traffic, no walkable downtown, expensive everything.</p>

    <h2>Best for soccer culture — Seattle</h2>
    <p><strong>Why:</strong> Strongest American soccer culture, Seattle Sounders MLS supporters' culture, beautiful summer weather, walkable downtown, gorgeous nearby nature.</p>
    <p><strong>Cons:</strong> Far from other US host cities (long flights), only 6 matches.</p>

    <h2>Best for accessibility — San Francisco Bay Area</h2>
    <p><strong>Why:</strong> Great public transit, walkable, multiple international airports, Silicon Valley tech culture.</p>
    <p><strong>Cons:</strong> Levi's Stadium is 45 miles from SF (Santa Clara), expensive hotels.</p>

    <h2>The full ranking</h2>
    <ol>
      <li><strong>NYC/NJ</strong> — best for first-timers, but expensive</li>
      <li><strong>Miami</strong> — best vibes, best Latin diaspora</li>
      <li><strong>LA</strong> — best for stars and weather</li>
      <li><strong>Seattle</strong> — best soccer culture</li>
      <li><strong>Boston</strong> — best for history</li>
      <li><strong>SF Bay</strong> — best for accessibility</li>
      <li><strong>Philadelphia</strong> — best for walkable history</li>
      <li><strong>Atlanta</strong> — best for southern hospitality + diaspora</li>
      <li><strong>Houston</strong> — best for budget, food</li>
      <li><strong>Dallas</strong> — best for big-game atmosphere (most matches)</li>
      <li><strong>Kansas City</strong> — most authentic Americana</li>
    </ol>

    <div class="cta-card">
      <h3>Learn the host states by playing</h3>
      <p>Statedoku uses "Hosts a WC 2026 match" as a constraint in its daily puzzle.</p>
      <a href="/">Play today's puzzle →</a>
    </div>

    <h2>Frequently asked questions</h2>
    <details><summary><strong>Which US city is best for the World Cup?</strong></summary><p>For first-timers: NYC/NJ (most things to do + hosts the Final). For best vibes: Miami. For soccer culture: Seattle.</p></details>
    <details><summary><strong>What's the cheapest US host city to visit?</strong></summary><p>Houston, Dallas, or Kansas City — hotels typically $150-$250/night vs $300+ in NYC/LA/Miami.</p></details>
    <details><summary><strong>Where is the World Cup Final?</strong></summary><p>MetLife Stadium in East Rutherford, NJ, July 19, 2026.</p></details>
`,
    faq([
      ['Which US city is best for the 2026 World Cup?', 'For first-timers: New York / New Jersey area (most things to do + hosts the Final). For best Latin diaspora vibes: Miami. For best US soccer culture: Seattle.'],
      ['What\'s the cheapest US host city to visit for the World Cup?', 'Houston, Dallas, or Kansas City — hotels typically run $150-$250/night during the WC vs $300+ in NYC, LA, and Miami.'],
      ['What\'s the best US city for first-time international visitors?', 'New York / New Jersey area. Iconic destination, hosts the Final, easy NJ Transit to MetLife, endless food and culture. But the most expensive.'],
      ['What\'s the best US host city for soccer culture?', 'Seattle. Home of the Seattle Sounders MLS supporters\' culture — widely considered the most European-style soccer culture in North America.'],
    ]),
    bcEN('best-us-city-world-cup-2026-tourism','Best US city WC 2026'), hreflangEN('best-us-city-world-cup-2026-tourism'), footerEN, 'en_US', '/learn/', 'Learn', relEN, '🏆 🏙️ BEST WC CITIES')
]);

// ═════════════════════════════════════════════════════════════════════════
// ES — 13 articles
// ═════════════════════════════════════════════════════════════════════════

const esPlayers = [
  {slug:'messi-mundial-2026', name:'Lionel Messi', country:'Argentina', flag:'🇦🇷', age:'39',
   club:'Inter Miami CF', wc:'5', wcWon:'1 (2022)',
   note:"Messi cumple 39 años el 24 de junio de 2026 — durante el Mundial. Si juega, es su 6º Mundial (récord junto a Ronaldo). En 2022 ganó el Balón de Oro del torneo y levantó la copa.",
   chip:'🏆 🇦🇷 MESSI MUNDIAL 2026'},
  {slug:'lamine-yamal-mundial-2026', name:'Lamine Yamal', country:'España', flag:'🇪🇸', age:'19',
   club:'FC Barcelona', wc:'0', wcWon:'0',
   note:"Lamine Yamal tendrá 19 años. Es su primer Mundial. Ganó la Eurocopa 2024 con 17 años. Es el 'nuevo Messi' y el jugador más prometedor del torneo.",
   chip:'🏆 🇪🇸 YAMAL MUNDIAL 2026'},
  {slug:'vinicius-jr-mundial-2026', name:'Vinicius Jr', country:'Brasil', flag:'🇧🇷', age:'26',
   club:'Real Madrid', wc:'1', wcWon:'0',
   note:"Vinicius Jr tendrá 26 años — en plenitud. Ganó la Champions League 2024 con Real Madrid. La esperanza brasileña para el sexto título mundial.",
   chip:'🏆 🇧🇷 VINICIUS MUNDIAL 2026'},
  {slug:'mbappe-mundial-2026', name:'Kylian Mbappé', country:'Francia', flag:'🇫🇷', age:'27',
   club:'Real Madrid', wc:'2', wcWon:'1 (2018)',
   note:"Mbappé tendrá 27 años — en plenitud. Ya ganó el Mundial 2018 y la Bota de Oro en 2022 (8 goles + hat-trick en la final, el primero desde Geoff Hurst en 1966). Capitán de Francia.",
   chip:'🏆 🇫🇷 MBAPPÉ MUNDIAL 2026'},
];

for(const p of esPlayers){
  const body = `    <p>${p.flag} <strong>${p.name}</strong> es una de las grandes estrellas del <strong>Mundial 2026 FIFA</strong>. A los ${p.age} años, juega para ${p.club} y representa a ${p.country}. El torneo se juega del 11 de junio al 19 de julio de 2026.</p>

    <div class="wc-quick">
      <dl>
        <dt>País</dt><dd>${p.flag} ${p.country}</dd>
        <dt>Edad en Mundial 2026</dt><dd>${p.age}</dd>
        <dt>Club</dt><dd>${p.club}</dd>
        <dt>Mundiales jugados</dt><dd>${p.wc}</dd>
        <dt>Mundiales ganados</dt><dd>${p.wcWon}</dd>
      </dl>
    </div>

    <h2>${p.name} en el Mundial 2026</h2>
    <p>${p.note}</p>

    <h2>Conexión con EE.UU.</h2>
    <p>${p.slug==='messi-mundial-2026' ? 'Messi vive y juega en Miami desde 2023 con Inter Miami CF. Hard Rock Stadium (sede del Mundial) es prácticamente su segunda casa. Presencia argentina enorme en Miami.' : p.slug==='vinicius-jr-mundial-2026' ? 'Vinicius juega en España con Real Madrid pero tiene gran fanaticada en Florida, donde vive la mayor comunidad brasileña de EE.UU. (~360 mil personas).' : p.slug==='mbappe-mundial-2026' ? 'Mbappé ya tiene contratos comerciales con marcas estadounidenses. La diáspora francesa en EE.UU. (~150 mil) lo seguirá.' : 'España tiene importante comunidad en California, Texas, Florida. La presencia hispana en EE.UU. apoyará a la Roja.'}</p>

    <h2>Dónde jugará ${p.country}</h2>
    <p>La asignación de partidos depende del sorteo FIFA. Consulta las <a href="/es/learn/mundial-2026-eeuu/">11 ciudades sede en EE.UU.</a></p>

    <div class="cta-card">
      <h3>Aprende los estados sede jugando</h3>
      <p>Statedoku usa pistas del Mundial 2026 en su puzzle diario.</p>
      <a href="/es/">Jugar el puzzle de hoy →</a>
    </div>

    <h2>Preguntas frecuentes</h2>
    <details><summary><strong>¿${p.name} juega el Mundial 2026?</strong></summary><p>${p.country} está clasificado. Se espera que ${p.name} esté en la convocatoria.</p></details>
    <details><summary><strong>¿Qué edad tiene ${p.name} en el Mundial 2026?</strong></summary><p>${p.age} años durante el torneo.</p></details>
    <details><summary><strong>¿En qué club juega ${p.name}?</strong></summary><p>${p.club}.</p></details>
    <details><summary><strong>¿Cuántos Mundiales ha jugado ${p.name}?</strong></summary><p>${p.wc} Mundiales anteriores${p.wcWon !== '0' ? ', ganando ' + p.wcWon : ''}.</p></details>
`;
  out.push([`es/learn/${p.slug}`,
    wrap('es', p.slug,
      `${p.name} en el Mundial 2026 — edad, club, historia | Statedoku`,
      `${p.flag} ${p.name} en el Mundial 2026 FIFA. ${p.age} años, juega en ${p.club}, ${p.country}. ${p.wc} Mundiales anteriores.`,
      `${p.name.toLowerCase()} mundial 2026, ${p.name.toLowerCase()} fifa 2026, ${p.country.toLowerCase()} ${p.name.toLowerCase().split(' ').pop()}`,
      `${p.flag} ${p.name} en el Mundial 2026`, `${p.country} · ${p.age} años · ${p.club}.`, body,
      faq([
        [`¿${p.name} juega el Mundial 2026?`, `${p.country} está clasificado al Mundial 2026 FIFA. ${p.name} se espera en la convocatoria.`],
        [`¿Cuántos años tiene ${p.name} en el Mundial 2026?`, `${p.age} años durante el torneo (junio-julio 2026).`],
        [`¿En qué club juega ${p.name}?`, p.club + '.'],
        [`¿Cuántos Mundiales ha jugado ${p.name}?`, p.wc + ' Mundiales anteriores' + (p.wcWon !== '0' ? ', ganando ' + p.wcWon : '') + '.'],
      ]),
      bcES(p.slug, p.name), hreflangES(p.slug), footerES, 'es_ES', '/es/learn/', 'Aprender', relES, p.chip)
  ]);
}

// 4 "donde ver" ES + 2 ceremony/ball + 3 LATAM travel = 9 more ES
out.push(['es/learn/donde-ver-mexico-mundial-2026',
  wrap('es', 'donde-ver-mexico-mundial-2026',
    'Dónde ver a México en el Mundial 2026 — bares, fan zones, transmisión | Statedoku',
    'Dónde ver los partidos de México en el Mundial 2026: bares mexicanos en EE.UU., fan zones, transmisión TV y streaming. Ciudad por ciudad.',
    'donde ver mexico mundial 2026, ver mundial mexico eeuu, transmision mundial 2026 mexico, telemundo mundial 2026',
    "Dónde ver a México en el Mundial 2026",
    "Bares mexicanos, fan zones, transmisión TV en EE.UU. y México.",
    `    <p>Si quieres ver a la <strong>selección mexicana en el Mundial 2026</strong>, aquí tienes todas las opciones — desde tu pantalla en casa hasta los mejores bares mexicanos en EE.UU.</p>

    <h2>Transmisión en TV</h2>
    <h3>En México</h3>
    <ul>
      <li><strong>Televisa</strong> — todos los partidos de México</li>
      <li><strong>Univisión</strong> (subsidiaria) — paralelo</li>
      <li><strong>TUDN</strong> — streaming</li>
    </ul>

    <h3>En EE.UU. (en español)</h3>
    <ul>
      <li><strong>Telemundo</strong> — derechos en español de FIFA</li>
      <li><strong>NBC Universo</strong></li>
      <li><strong>Peacock</strong> (streaming) — todos los partidos sin cable</li>
    </ul>

    <h3>En EE.UU. (en inglés)</h3>
    <ul>
      <li><strong>Fox Sports</strong> + <strong>FS1</strong> — todos los partidos</li>
      <li><strong>Fox Soccer App</strong> — streaming oficial</li>
    </ul>

    <h2>Fan zones oficiales en ciudades sede</h2>
    <ul>
      <li><strong>Los Ángeles:</strong> Grand Park (downtown LA). Comunidad mexicana enorme.</li>
      <li><strong>Houston:</strong> Discovery Green. Gran asistencia mexicana esperada.</li>
      <li><strong>Dallas:</strong> Klyde Warren Park. Texas tiene 12M de hispanos, mayoría mexicanos.</li>
      <li><strong>Miami:</strong> Bayfront Park. Comunidad más diversa pero hay mexicanos.</li>
      <li><strong>Phoenix (no sede oficial pero ambiente):</strong> Civic Space Park.</li>
    </ul>

    <h2>Mejores bares mexicanos para ver el Mundial</h2>
    <h3>Los Ángeles</h3>
    <ul>
      <li><strong>Tacos Punta Cabras</strong> — Santa Monica. TVs grandes, cerveza mexicana.</li>
      <li><strong>La Adelita</strong> — varias ubicaciones LA. Auténtico.</li>
      <li><strong>The Mexican</strong> — downtown LA. Lleno los días de partido.</li>
    </ul>

    <h3>Houston</h3>
    <ul>
      <li><strong>Goode Company</strong> — múltiples ubicaciones.</li>
      <li><strong>Hugo's</strong> — Montrose. TVs + ambiente.</li>
      <li><strong>Cantina Laredo</strong> — Galleria.</li>
    </ul>

    <h3>Dallas</h3>
    <ul>
      <li><strong>Mi Cocina</strong> — múltiples ubicaciones.</li>
      <li><strong>Mr. Mesero</strong> — Knox-Henderson.</li>
    </ul>

    <h3>Nueva York</h3>
    <ul>
      <li><strong>Cosme</strong> — Flatiron. Alta cocina mexicana.</li>
      <li><strong>El Toro Blanco</strong> — West Village.</li>
      <li><strong>Tacombi</strong> — múltiples ubicaciones.</li>
    </ul>

    <h3>Chicago</h3>
    <ul>
      <li><strong>Frontera Grill</strong> (Rick Bayless) — River North.</li>
      <li><strong>Topolobampo</strong> — alta gama.</li>
      <li><strong>Big Star</strong> — Wicker Park.</li>
    </ul>

    <h2>Streaming sin cable (cord-cutters)</h2>
    <ul>
      <li><strong>Peacock</strong> ($5.99/mes) — todos los partidos en español, vía Telemundo</li>
      <li><strong>Fubo</strong> ($75/mes) — incluye Fox Sports en HD</li>
      <li><strong>YouTube TV</strong> ($73/mes) — Fox Sports + Telemundo</li>
      <li><strong>FIFA+ App</strong> — streaming oficial gratuito (calidad limitada)</li>
    </ul>

    <h2>Comprar boletos para partidos de México</h2>
    <p>Vía <strong>FIFA.com/tickets</strong>. Recuerda que México juega en CDMX (Estadio Azteca, partido inaugural), Guadalajara (Akron) y Monterrey (BBVA) en su grupo.</p>

    <div class="cta-card">
      <h3>Aprende los estados de EE.UU. jugando</h3>
      <p>Si viajas para apoyar a México, conoce los 50 estados con Statedoku.</p>
      <a href="/es/">Jugar el puzzle de hoy →</a>
    </div>

    <h2>Preguntas frecuentes</h2>
    <details><summary><strong>¿Dónde puedo ver al Tri en el Mundial?</strong></summary><p>En México: Televisa y Univisión. En EE.UU.: Telemundo (español) o Fox Sports (inglés). Streaming: Peacock incluye todos los partidos en español.</p></details>
    <details><summary><strong>¿Telemundo transmite todos los partidos del Mundial?</strong></summary><p>Sí, Telemundo tiene los derechos en español para el Mundial 2026 en EE.UU. Todos los partidos.</p></details>
    <details><summary><strong>¿Hay fan zones para mexicanos en EE.UU.?</strong></summary><p>Sí, en Los Ángeles (Grand Park), Houston (Discovery Green), Dallas (Klyde Warren), todos con fuerte presencia mexicana.</p></details>
    <details><summary><strong>¿Cuánto cuesta Peacock para ver el Mundial?</strong></summary><p>$5.99/mes (plan Premium con anuncios). Incluye todos los partidos en español vía Telemundo.</p></details>
`,
    faq([
      ['¿Dónde puedo ver a México en el Mundial 2026?', 'En México: Televisa y Univisión. En EE.UU. en español: Telemundo. En EE.UU. en inglés: Fox Sports. Streaming sin cable: Peacock ($5.99/mes) tiene todos los partidos en español.'],
      ['¿Telemundo transmite todos los partidos del Mundial 2026?', 'Sí. Telemundo tiene los derechos exclusivos en español para Estados Unidos. Transmite los 104 partidos del Mundial.'],
      ['¿Cómo veo el Mundial sin cable de TV?', 'Peacock ($5.99/mes) tiene todos los partidos en español vía Telemundo. Fubo ($75/mes) incluye Fox Sports. YouTube TV ($73/mes) también.'],
      ['¿Hay fan zones para mexicanos en Estados Unidos?', 'Sí. Las mejores fan zones para mexicanos están en Los Ángeles (Grand Park), Houston (Discovery Green), Dallas (Klyde Warren Park) — todas con fuerte presencia mexicana.'],
    ]),
    bcES('donde-ver-mexico-mundial-2026','Dónde ver México'), hreflangES('donde-ver-mexico-mundial-2026'), footerES, 'es_ES', '/es/learn/', 'Aprender', relES, '🏆 🇲🇽 DÓNDE VER MÉXICO')
]);

out.push(['es/learn/donde-ver-argentina-eeuu-mundial-2026',
  wrap('es', 'donde-ver-argentina-eeuu-mundial-2026',
    'Dónde ver a Argentina en el Mundial 2026 desde EE.UU. — guía completa | Statedoku',
    'Dónde ver a la Albiceleste defendiendo el título en el Mundial 2026: bares argentinos en EE.UU., fan zones, TV. Miami, NY, LA, Houston.',
    'donde ver argentina mundial 2026, argentina eeuu mundial 2026, bares argentinos eeuu, telemundo argentina mundial',
    "Dónde ver a Argentina en el Mundial 2026",
    "Bares argentinos en EE.UU., transmisión TV, fan zones para apoyar a la Albiceleste.",
    `    <p>La Albiceleste defiende el título en el Mundial 2026. Si vives en EE.UU. y quieres ver los partidos con otros argentinos, aquí están todas las opciones.</p>

    <h2>Comunidad argentina en EE.UU.</h2>
    <p>~285,000 argentinos viven en EE.UU. — pero la influencia es mucho mayor por la "diáspora del Mundial 2022" (post-Messi-Inter-Miami) y el éxito de la selección. Concentraciones:</p>
    <ul>
      <li><strong>Miami / Florida sur:</strong> ~70,000 argentinos. Doral, Aventura, Sunny Isles.</li>
      <li><strong>Nueva York / NJ:</strong> ~40,000 argentinos.</li>
      <li><strong>Los Ángeles:</strong> ~25,000 argentinos.</li>
      <li><strong>Houston:</strong> ~15,000 argentinos.</li>
    </ul>

    <h2>Bares argentinos para ver el Mundial</h2>
    <h3>Miami</h3>
    <ul>
      <li><strong>La Esquina Asado</strong> — Doral. Parrilla auténtica.</li>
      <li><strong>El Carajo</strong> — Coral Gables. Bar argentino.</li>
      <li><strong>Macondo Restaurant</strong> — Doral. Comida argentina.</li>
      <li><strong>Boca Loca</strong> — Hard Rock Stadium adjacent. Para fechas de Hard Rock.</li>
    </ul>

    <h3>Nueva York</h3>
    <ul>
      <li><strong>La Carbonara</strong> — Brooklyn. Italo-argentino.</li>
      <li><strong>Empanada Mama</strong> — múltiples ubicaciones.</li>
      <li><strong>Caballero NYC</strong> — Hell's Kitchen.</li>
      <li><strong>La Boca Brick Lane</strong> — East Village.</li>
    </ul>

    <h3>Los Ángeles</h3>
    <ul>
      <li><strong>Carlitos Gardel</strong> — Beverly Hills.</li>
      <li><strong>Lucques</strong> — West Hollywood.</li>
      <li><strong>The Wine House</strong> — varias ubicaciones.</li>
    </ul>

    <h2>Fan zones oficiales</h2>
    <p>Estimaciones esperadas para presencia argentina:</p>
    <ul>
      <li><strong>Miami (Bayfront Park):</strong> probable epicentro argentino — Messi en casa.</li>
      <li><strong>NY/NJ (Times Square + Pier 17):</strong> fuerte presencia.</li>
      <li><strong>Houston (Discovery Green):</strong> bien organizado.</li>
    </ul>

    <h2>Transmisión TV</h2>
    <ul>
      <li><strong>En Argentina:</strong> TyC Sports + TV Pública</li>
      <li><strong>En EE.UU. (español):</strong> Telemundo + Peacock streaming</li>
      <li><strong>En EE.UU. (inglés):</strong> Fox Sports</li>
    </ul>

    <h2>Diferencia horaria con Argentina</h2>
    <ul>
      <li>Buenos Aires vs Nueva York: 1 hora adelantado</li>
      <li>Buenos Aires vs Los Ángeles: 4 horas adelantado</li>
      <li>Buenos Aires vs Houston / Dallas: 2 horas adelantado</li>
      <li>Buenos Aires vs Miami: 1 hora adelantado</li>
    </ul>
    <p>Partidos a las 15h hora del este = 16h hora argentina (perfecto para verlos en bar al regresar del trabajo).</p>

    <h2>Comprar boletos para partidos de Argentina</h2>
    <p>Vía <strong>FIFA.com/tickets</strong>. Argentina jugará en EE.UU. — probable Hard Rock Stadium (Miami) como "casa argentina".</p>

    <div class="cta-card">
      <h3>Aprende los estados de EE.UU. jugando</h3>
      <p>Si viajas a EE.UU. para apoyar a Argentina, conoce los 50 estados con Statedoku.</p>
      <a href="/es/">Jugar el puzzle de hoy →</a>
    </div>

    <h2>Preguntas frecuentes</h2>
    <details><summary><strong>¿Dónde es la mayor comunidad argentina en EE.UU.?</strong></summary><p>Miami sur (Doral, Aventura, Sunny Isles) — ~70,000 argentinos. Crecimiento masivo post-Messi-Inter-Miami.</p></details>
    <details><summary><strong>¿Argentina jugará en Miami en el Mundial 2026?</strong></summary><p>Probable. Hard Rock Stadium en Miami es una de las 11 sedes y la "casa argentina" por la presencia de Messi en Inter Miami.</p></details>
    <details><summary><strong>¿Cómo veo a Argentina en EE.UU. sin cable?</strong></summary><p>Peacock ($5.99/mes) incluye todos los partidos en español vía Telemundo. FIFA+ es gratuito con calidad limitada.</p></details>
`,
    faq([
      ['¿Dónde puedo ver a Argentina en el Mundial 2026 desde Estados Unidos?', 'En español: Telemundo o Peacock streaming. En inglés: Fox Sports. Bares argentinos en Miami (La Esquina Asado, Macondo), NY (Caballero), LA (Carlitos Gardel).'],
      ['¿Argentina jugará en Miami durante el Mundial 2026?', 'Es probable. Hard Rock Stadium en Miami es una de las 11 sedes US y la "casa argentina" debido a la presencia de Lionel Messi en Inter Miami CF.'],
      ['¿Dónde es la mayor comunidad argentina en Estados Unidos?', 'Miami sur (Doral, Aventura, Sunny Isles) con unos 70,000 argentinos. La comunidad creció masivamente después de la llegada de Messi a Inter Miami en 2023.'],
      ['¿Cuánto cuesta ver el Mundial sin cable de TV en EE.UU.?', 'Peacock cuesta $5.99/mes e incluye todos los partidos en español vía Telemundo. FIFA+ es gratuito pero con calidad limitada.'],
    ]),
    bcES('donde-ver-argentina-eeuu-mundial-2026','Dónde ver Argentina'), hreflangES('donde-ver-argentina-eeuu-mundial-2026'), footerES, 'es_ES', '/es/learn/', 'Aprender', relES, '🏆 🇦🇷 DÓNDE VER ARGENTINA')
]);

out.push(['es/learn/mundial-2026-ceremonia-inaugural',
  wrap('es', 'mundial-2026-ceremonia-inaugural',
    'Ceremonia inaugural del Mundial 2026 — Estadio Azteca, 11 de junio | Statedoku',
    'La ceremonia inaugural del Mundial 2026 será en el Estadio Azteca de CDMX el 11 de junio de 2026. Qué esperar, posibles artistas, dónde verla.',
    'ceremonia inaugural mundial 2026, ceremonia apertura fifa 2026, estadio azteca ceremonia, quien canta mundial 2026',
    "Ceremonia inaugural del Mundial 2026",
    "11 de junio de 2026 en el Estadio Azteca, CDMX. Qué esperar antes del primer silbatazo.",
    `    <p>La <strong>ceremonia inaugural del Mundial 2026 FIFA</strong> será el <strong>11 de junio de 2026</strong> en el icónico <strong>Estadio Azteca</strong> de la Ciudad de México, justo antes del partido inaugural.</p>

    <h2>Qué esperar</h2>
    <p>Las ceremonias inaugurales FIFA suelen incluir:</p>
    <ul>
      <li>Show cultural mexicano (mariachi, ranchera, música regional)</li>
      <li>Despliegue de luces y pirotecnia masivo</li>
      <li>Uno o dos artistas internacionales interpretando el himno oficial</li>
      <li>Discurso formal del presidente FIFA (Gianni Infantino)</li>
      <li>Izamiento de las 48 banderas</li>
      <li>Procesión del trofeo FIFA</li>
    </ul>

    <h2>Posibles artistas</h2>
    <p>Las apuestas para el 2026 (no confirmados oficialmente todavía):</p>
    <ul>
      <li><strong>Mexicano:</strong> Bad Bunny (puertorriqueño pero ícono mexicano-latino), Maluma (colombiano-latino), Camila Cabello (cubana-mexicana-estadounidense)</li>
      <li><strong>Estadounidense:</strong> Shakira (icono Mundial), BTS, The Weeknd</li>
      <li><strong>Canadiense:</strong> Drake, Justin Bieber</li>
    </ul>

    <h2>Ceremonias pasadas memorables</h2>
    <ul>
      <li><strong>2022 Qatar:</strong> Morgan Freeman + Trinidad Cardona — mezcla cultural memorable.</li>
      <li><strong>2018 Rusia:</strong> Robbie Williams. Iconic con sus hijos.</li>
      <li><strong>2014 Brasil:</strong> Pitbull, Jennifer Lopez, Claudia Leitte — "We Are One".</li>
      <li><strong>2010 Sudáfrica:</strong> Shakira liderando "Waka Waka".</li>
      <li><strong>1994 USA:</strong> Diana Ross falló el penal en su show!</li>
      <li><strong>1986 México:</strong> Stephanie Lawrence + Plácido Domingo.</li>
    </ul>

    <h2>Cuánto dura</h2>
    <p>Aproximadamente <strong>30 minutos</strong>, antes del partido inaugural.</p>

    <h2>Cómo verla</h2>
    <ul>
      <li><strong>México:</strong> Televisa, Univisión</li>
      <li><strong>EE.UU. español:</strong> Telemundo, Peacock streaming</li>
      <li><strong>EE.UU. inglés:</strong> Fox Sports</li>
      <li><strong>Mundial:</strong> FIFA+ app (streaming oficial)</li>
    </ul>

    <h2>El significado del Estadio Azteca</h2>
    <p>El Estadio Azteca alberga su <strong>3a ceremonia inaugural de Mundial</strong> (1970, 1986, 2026). Es el primer estadio del mundo en este récord. Escenario del "Gol del Siglo" de Maradona en 1986 y del "Partido del Siglo" en 1970.</p>

    <div class="cta-card">
      <h3>Aprende los estados sede jugando</h3>
      <p>Statedoku usa "Sede del Mundial 2026" como pista.</p>
      <a href="/es/">Jugar el puzzle de hoy →</a>
    </div>

    <h2>Preguntas frecuentes</h2>
    <details><summary><strong>¿Cuándo es la ceremonia inaugural del Mundial 2026?</strong></summary><p>El 11 de junio de 2026 en el Estadio Azteca, CDMX, justo antes del partido inaugural.</p></details>
    <details><summary><strong>¿Quién canta en la ceremonia inaugural?</strong></summary><p>FIFA confirma los artistas 3-6 meses antes. No hay anuncio oficial todavía para 2026.</p></details>
    <details><summary><strong>¿Cuánto dura la ceremonia?</strong></summary><p>Aproximadamente 30 minutos, antes del primer partido.</p></details>
    <details><summary><strong>¿Cómo veo la ceremonia desde EE.UU.?</strong></summary><p>Telemundo (español) o Fox Sports (inglés). Streaming: Peacock o FIFA+.</p></details>
`,
    faq([
      ['¿Cuándo es la ceremonia inaugural del Mundial 2026?', 'El 11 de junio de 2026 en el Estadio Azteca, Ciudad de México, inmediatamente antes del partido inaugural.'],
      ['¿Quién canta en la ceremonia inaugural del Mundial 2026?', 'FIFA confirma los artistas 3 a 6 meses antes del torneo. Las apuestas incluyen Shakira, Bad Bunny, Maluma, Camila Cabello, The Weeknd y Drake.'],
      ['¿Cuánto dura la ceremonia inaugural?', 'Aproximadamente 30 minutos, antes del partido inaugural en el Estadio Azteca.'],
      ['¿Cómo veo la ceremonia desde Estados Unidos?', 'En español: Telemundo o Peacock streaming ($5.99/mes). En inglés: Fox Sports. Streaming oficial gratuito: FIFA+ app.'],
    ]),
    bcES('mundial-2026-ceremonia-inaugural','Ceremonia inaugural'), hreflangES('mundial-2026-ceremonia-inaugural'), footerES, 'es_ES', '/es/learn/', 'Aprender', relES, '🏆 🎵 CEREMONIA INAUGURAL')
]);

out.push(['es/learn/concentraciones-mundial-2026',
  wrap('es', 'concentraciones-mundial-2026',
    'Concentraciones del Mundial 2026 — dónde entrenan las selecciones | Statedoku',
    'Las concentraciones (base camps) del Mundial 2026: dónde entrenan México, Argentina, Brasil, España, USA. Cómo se eligen, qué son, cómo los aficionados pueden visitarlas.',
    'concentraciones mundial 2026, base camp mundial 2026, donde entrena mexico mundial 2026, donde entrena argentina',
    "Concentraciones del Mundial 2026",
    "Dónde entrenan las selecciones durante el Mundial. Cómo se eligen y los más probables.",
    `    <p>Cada una de las 48 selecciones del Mundial 2026 elige una <strong>"concentración" (base camp)</strong> — una ciudad + instalación de entrenamiento + hotel para la duración del torneo. Aquí cómo funciona y los más probables.</p>

    <h2>Qué es una concentración</h2>
    <p>El base camp debe cumplir:</p>
    <ul>
      <li>Estar cerca del país donde la selección juega su fase de grupos</li>
      <li>Tener cancha de entrenamiento profesional</li>
      <li>Hotel con espacio para 70-100 personas (jugadores, cuerpo técnico, médicos, seguridad)</li>
      <li>Privacidad (paredes altas, seguridad)</li>
      <li>Acceso conveniente a sedes del Mundial</li>
    </ul>

    <h2>Cómo eligen las selecciones</h2>
    <ol>
      <li>FIFA publica el catálogo oficial de opciones en 2024</li>
      <li>Las selecciones envían exploradores 2024-2025 para evaluar</li>
      <li>Consideran: clima, comunidad diáspora, calidad del hotel, costo ($3-8 millones por el torneo)</li>
      <li>Anuncio formal: meses antes del Mundial</li>
    </ol>

    <h2>Concentraciones probables por selección</h2>

    <h3>🇦🇷 Argentina</h3>
    <p>Probable: <strong>Miami</strong>. Instalación de entrenamiento de Inter Miami CF (donde ya entrena Messi). Comunidad argentina enorme (~70,000) crea ambiente local.</p>

    <h3>🇲🇽 México</h3>
    <p>Probable: <strong>Ciudad de México</strong>. Como anfitrión, México juega los partidos del Estadio Azteca y se queda en el área. Instalaciones de la Federación Mexicana.</p>

    <h3>🇧🇷 Brasil</h3>
    <p>Probable: <strong>Florida</strong>. Mayor comunidad brasileña en EE.UU. (~360,000). Posiblemente Orlando o Miami.</p>

    <h3>🇪🇸 España</h3>
    <p>Probable: <strong>Sur de Florida</strong>. Cerca de la comunidad española en Miami. Lamine Yamal y compañía pueden disfrutar de un ambiente latino.</p>

    <h3>🇨🇴 Colombia</h3>
    <p>Probable: <strong>Florida</strong>. Mayor comunidad colombiana en EE.UU. (Doral, Miami).</p>

    <h3>🇺🇾 Uruguay</h3>
    <p>Probable: <strong>Nueva Jersey o Pensilvania</strong>. Cerca a la concentración de la selección uruguaya en Mundiales anteriores.</p>

    <h3>🇺🇸 USMNT</h3>
    <p>Probable: <strong>Mid-Atlantic (NJ / PA)</strong>. Cerca de MetLife Stadium para los partidos de la selección anfitriona.</p>

    <h2>¿Los aficionados pueden visitar?</h2>
    <p>Sí, parcialmente:</p>
    <ul>
      <li><strong>Sesiones de entrenamiento abiertas</strong> — algunas selecciones abren entrenamientos al público en días específicos</li>
      <li><strong>Autografos en el hotel</strong> — los jugadores firman cuando salen/entran</li>
      <li><strong>Fan tours organizados</strong> — algunas agencias venden tours a la concentración</li>
    </ul>

    <h2>Costo del base camp</h2>
    <p>$3 a $8 millones de dólares por la selección por el torneo. Lo paga la federación nacional. Incluye:</p>
    <ul>
      <li>Renta del hotel (toda el ala)</li>
      <li>Renta del campo de entrenamiento</li>
      <li>Seguridad privada</li>
      <li>Transportes</li>
    </ul>

    <div class="cta-card">
      <h3>Aprende los estados sede jugando</h3>
      <p>Statedoku usa "Sede del Mundial 2026" como pista en su puzzle.</p>
      <a href="/es/">Jugar el puzzle de hoy →</a>
    </div>

    <h2>Preguntas frecuentes</h2>
    <details><summary><strong>¿Dónde entrena Argentina durante el Mundial 2026?</strong></summary><p>Probablemente en Miami, usando las instalaciones de Inter Miami CF donde ya entrena Messi.</p></details>
    <details><summary><strong>¿Los aficionados pueden visitar las concentraciones?</strong></summary><p>Sí, parcialmente. Algunas selecciones abren entrenamientos al público en días específicos. Los aficionados también pueden buscar autógrafos en el hotel.</p></details>
    <details><summary><strong>¿Cuánto cuesta una concentración?</strong></summary><p>$3-8 millones de dólares por el torneo. Lo paga la federación nacional.</p></details>
    <details><summary><strong>¿Dónde se concentra México?</strong></summary><p>Como anfitrión, México se concentra en Ciudad de México, cerca del Estadio Azteca y otras sedes mexicanas.</p></details>
`,
    faq([
      ['¿Dónde entrena Argentina durante el Mundial 2026?', 'Probablemente en Miami, usando las instalaciones de Inter Miami CF donde ya entrena Lionel Messi. La comunidad argentina en Miami (~70,000 personas) crea un ambiente local ideal.'],
      ['¿Qué es una concentración (base camp) del Mundial?', 'Es la ciudad + instalación de entrenamiento + hotel donde se queda una selección durante todo el Mundial. Incluye espacio para 70-100 personas: jugadores, cuerpo técnico, médicos y seguridad.'],
      ['¿Los aficionados pueden visitar las concentraciones?', 'Sí, parcialmente. Algunas selecciones abren sesiones de entrenamiento al público en días específicos. También se pueden buscar autógrafos en el hotel.'],
      ['¿Cuánto cuesta una concentración del Mundial?', 'Entre $3 y $8 millones de dólares por selección durante todo el torneo. Lo paga la federación nacional e incluye hotel, campo de entrenamiento, seguridad y transportes.'],
    ]),
    bcES('concentraciones-mundial-2026','Concentraciones'), hreflangES('concentraciones-mundial-2026'), footerES, 'es_ES', '/es/learn/', 'Aprender', relES, '🏆 🏨 CONCENTRACIONES')
]);

// ═════════════════════════════════════════════════════════════════════════
// FR — 11 articles
// ═════════════════════════════════════════════════════════════════════════

const frPlayers = [
  {slug:'mbappe-coupe-du-monde-2026', name:'Kylian Mbappé', country:'France', flag:'🇫🇷', age:'27',
   club:'Real Madrid', wc:'2', wcWon:'1 (2018)',
   note:"Mbappé aura 27 ans — au sommet de son art. Déjà champion du monde 2018 et Soulier d'Or 2022 (8 buts + triplé en finale, premier depuis Geoff Hurst en 1966). Capitaine des Bleus depuis 2024.",
   chip:'🏆 🇫🇷 MBAPPÉ MONDIAL 2026'},
  {slug:'ronaldo-coupe-du-monde-2026', name:'Cristiano Ronaldo', country:'Portugal', flag:'🇵🇹', age:'41',
   club:'Al-Nassr (Arabie Saoudite)', wc:'5', wcWon:'0',
   note:"6e Coupe du Monde de Ronaldo à 41 ans — record absolu (à égalité avec Messi). Dernière chance pour le seul trophée qui manque à son palmarès. Meilleur buteur international de tous les temps (130+ buts).",
   chip:'🏆 🇵🇹 RONALDO MONDIAL 2026'},
  {slug:'messi-coupe-du-monde-2026', name:'Lionel Messi', country:'Argentine', flag:'🇦🇷', age:'39',
   club:'Inter Miami CF', wc:'5', wcWon:'1 (2022)',
   note:"Messi a 39 ans le 24 juin 2026 — pendant le Mondial. Si il joue, c'est sa 6e Coupe du Monde (record à égalité avec Ronaldo). Champion 2022 avec le Ballon d'Or du tournoi.",
   chip:'🏆 🇦🇷 MESSI MONDIAL 2026'},
];

for(const p of frPlayers){
  const body = `    <p>${p.flag} <strong>${p.name}</strong> est l'une des stars annoncées de la <strong>Coupe du Monde 2026</strong>. À ${p.age} ans, il joue pour ${p.club} et représente ${p.country}. Le tournoi se joue du 11 juin au 19 juillet 2026.</p>

    <div class="wc-quick">
      <dl>
        <dt>Pays</dt><dd>${p.flag} ${p.country}</dd>
        <dt>Âge au Mondial 2026</dt><dd>${p.age}</dd>
        <dt>Club</dt><dd>${p.club}</dd>
        <dt>Coupes du Monde jouées</dt><dd>${p.wc}</dd>
        <dt>Coupes du Monde gagnées</dt><dd>${p.wcWon}</dd>
      </dl>
    </div>

    <h2>${p.name} au Mondial 2026</h2>
    <p>${p.note}</p>

    <h2>Où jouera ${p.country}</h2>
    <p>L'attribution des matchs dépend du tirage FIFA. Consultez les <a href="/fr/learn/coupe-du-monde-2026-villes-usa/">11 villes hôtes aux USA</a>.</p>

    <h2>Comment suivre les matchs depuis la France</h2>
    <ul>
      <li>TF1 + M6 (matchs de l'équipe de France et grandes affiches)</li>
      <li>beIN Sports (tous les matchs)</li>
      <li>FIFA+ app (streaming officiel, gratuit)</li>
    </ul>

    <div class="cta-card">
      <h3>Apprenez les États hôtes en jouant</h3>
      <p>Statedoku utilise des indices Mondial 2026 dans son puzzle quotidien.</p>
      <a href="/fr/">Jouer le puzzle du jour →</a>
    </div>

    <h2>Questions fréquentes</h2>
    <details><summary><strong>${p.name} jouera-t-il au Mondial 2026 ?</strong></summary><p>${p.country} est qualifié pour la Coupe du Monde 2026. ${p.name} est attendu dans l'effectif.</p></details>
    <details><summary><strong>Quel âge a ${p.name} au Mondial 2026 ?</strong></summary><p>${p.age} ans pendant le tournoi.</p></details>
    <details><summary><strong>Pour quel club joue ${p.name} ?</strong></summary><p>${p.club}.</p></details>
    <details><summary><strong>Combien de Coupes du Monde ${p.name} a-t-il jouées ?</strong></summary><p>${p.wc} Coupes du Monde précédentes${p.wcWon !== '0' ? ', avec ' + p.wcWon : ''}.</p></details>
`;
  out.push([`fr/learn/${p.slug}`,
    wrap('fr', p.slug,
      `${p.name} à la Coupe du Monde 2026 — âge, club, palmarès | Statedoku`,
      `${p.flag} ${p.name} à la Coupe du Monde 2026 FIFA. ${p.age} ans, joue à ${p.club}, pour ${p.country}. ${p.wc} Coupes du Monde précédentes.`,
      `${p.name.toLowerCase()} coupe du monde 2026, ${p.name.toLowerCase()} mondial 2026, ${p.name.toLowerCase()} fifa 2026`,
      `${p.flag} ${p.name} à la Coupe du Monde 2026`, `${p.country} · ${p.age} ans · ${p.club}.`, body,
      faq([
        [`${p.name} jouera-t-il à la Coupe du Monde 2026 ?`, `${p.country} est qualifié pour la Coupe du Monde 2026 FIFA. ${p.name} est attendu dans l'effectif.`],
        [`Quel âge a ${p.name} pendant la Coupe du Monde 2026 ?`, `${p.age} ans pendant le tournoi (juin-juillet 2026).`],
        [`Pour quel club joue ${p.name} ?`, p.club + '.'],
        [`Combien de Coupes du Monde ${p.name} a-t-il jouées ?`, p.wc + ' Coupes du Monde précédentes' + (p.wcWon !== '0' ? ', avec ' + p.wcWon : '') + '.'],
      ]),
      bcFR(p.slug, p.name), hreflangFR(p.slug), footerFR, 'fr_FR', '/fr/learn/', 'Apprendre', relFR, p.chip)
  ]);
}

out.push(['fr/learn/camps-de-base-mondial-2026',
  wrap('fr', 'camps-de-base-mondial-2026',
    'Camps de base de la Coupe du Monde 2026 — où s\'entraînent les équipes | Statedoku',
    'Les camps de base de la Coupe du Monde 2026 : où s\'entraînent France, Brésil, Argentine, Espagne. Comment les équipes choisissent, coûts, accès aux fans.',
    'camps de base coupe du monde 2026, ou s entraine france mondial 2026, ou s entraine argentine, base camp fifa 2026',
    "Camps de base de la Coupe du Monde 2026",
    "Où les 48 sélections s\'entraînent pendant le tournoi. Comment elles choisissent.",
    `    <p>Chacune des <strong>48 équipes de la Coupe du Monde 2026</strong> choisit un <strong>camp de base</strong> — une ville + un terrain d\'entraînement + un hôtel pour toute la durée du tournoi. Avec 3 pays hôtes, c\'est plus complexe que jamais.</p>

    <h2>Qu'est-ce qu'un camp de base ?</h2>
    <p>Le camp de base doit :</p>
    <ul>
      <li>Être dans ou près du pays où l\'équipe joue ses matchs de poules</li>
      <li>Avoir un terrain d\'entraînement aux normes FIFA</li>
      <li>Inclure un hôtel pour 70-100 personnes (joueurs, staff, médecins, sécurité)</li>
      <li>Garantir la confidentialité (murs hauts, sécurité)</li>
      <li>Être accessible aux stades hôtes (voiture ou avion)</li>
    </ul>

    <h2>Comment les équipes choisissent</h2>
    <p>Les équipes envoient des scouts en 2024-2025 pour évaluer les options selon :</p>
    <ul>
      <li><strong>Climat similaire</strong> à celui du pays</li>
      <li><strong>Communauté diasporique</strong> forte = atmosphère "à la maison"</li>
      <li><strong>Qualité de l\'hôtel</strong> — installations 5 étoiles avec ailes privées</li>
      <li><strong>Coût</strong> — 3 à 8 millions de dollars pour le tournoi</li>
    </ul>

    <h2>Camps de base probables (juin 2026)</h2>

    <h3>🇫🇷 France</h3>
    <p>Probable : <strong>resort privé dans l\'État de New York</strong>. Proximité avec MetLife Stadium, calme.</p>

    <h3>🇦🇷 Argentine</h3>
    <p>Probable : <strong>Miami</strong>. Installation d\'entraînement d\'Inter Miami CF (où s\'entraîne déjà Messi). Énorme communauté argentine.</p>

    <h3>🇧🇷 Brésil</h3>
    <p>Probable : <strong>Floride</strong>. Plus grande communauté brésilienne aux USA (~360 000).</p>

    <h3>🇲🇽 Mexique</h3>
    <p>Probable : <strong>Mexico City</strong>. En tant qu\'hôte, joue à l\'Estadio Azteca et reste dans la zone.</p>

    <h3>🇪🇸 Espagne</h3>
    <p>Probable : <strong>sud de la Floride</strong>. Proximité avec la communauté espagnole, climat idéal pour Lamine Yamal et compagnie.</p>

    <h3>🇺🇸 USMNT (Team USA)</h3>
    <p>Probable : <strong>Mid-Atlantic (NJ / PA)</strong>. Près de MetLife Stadium pour les matchs de la sélection hôte.</p>

    <h2>Les fans peuvent-ils visiter ?</h2>
    <p>Oui, partiellement :</p>
    <ul>
      <li>Certaines équipes <strong>ouvrent les entraînements</strong> au public certains jours</li>
      <li>Autographes possibles à l\'hôtel à l\'arrivée/départ</li>
      <li>Tours fans organisés par des agences de voyage</li>
    </ul>

    <h2>Coût d\'un camp de base</h2>
    <p>3 à 8 millions de dollars par équipe pour la durée du tournoi. Payé par la fédération nationale. Inclus : location de tout l\'aile de l\'hôtel, terrain d\'entraînement, sécurité privée, transports.</p>

    <div class="cta-card">
      <h3>Apprenez les États hôtes en jouant</h3>
      <p>Statedoku utilise "Camp de base WC 2026" comme indice dans le puzzle quotidien.</p>
      <a href="/fr/">Jouer le puzzle du jour →</a>
    </div>

    <h2>Questions fréquentes</h2>
    <details><summary><strong>Où s\'entraîne la France pendant le Mondial 2026 ?</strong></summary><p>Probablement dans un resort privé de l\'État de New York, à proximité de MetLife Stadium.</p></details>
    <details><summary><strong>Les fans peuvent-ils visiter les camps de base ?</strong></summary><p>Oui, partiellement. Certaines équipes ouvrent les entraînements au public certains jours.</p></details>
    <details><summary><strong>Combien coûte un camp de base ?</strong></summary><p>3 à 8 millions de dollars par équipe pour la durée du tournoi.</p></details>
`,
    faq([
      ['Où s\'entraîne la France pendant la Coupe du Monde 2026 ?', 'Probablement dans un resort privé de l\'État de New York, à proximité de MetLife Stadium qui accueille la finale.'],
      ['Qu\'est-ce qu\'un camp de base de Coupe du Monde ?', 'Une ville + un terrain d\'entraînement + un hôtel pour toute la durée du tournoi. Chaque équipe choisit le sien parmi le catalogue officiel FIFA.'],
      ['Les fans peuvent-ils visiter les camps de base ?', 'Partiellement oui. Certaines équipes ouvrent des sessions d\'entraînement au public à des dates précises. Les autographes sont aussi possibles à l\'hôtel.'],
      ['Combien coûte un camp de base ?', '3 à 8 millions de dollars par équipe pour la durée du tournoi. Payé par la fédération nationale, incluant hôtel, terrain et sécurité.'],
    ]),
    bcFR('camps-de-base-mondial-2026','Camps de base'), hreflangFR('camps-de-base-mondial-2026'), footerFR, 'fr_FR', '/fr/learn/', 'Apprendre', relFR, '🏆 🏨 CAMPS DE BASE')
]);

out.push(['fr/learn/ceremonie-ouverture-mondial-2026',
  wrap('fr', 'ceremonie-ouverture-mondial-2026',
    'Cérémonie d\'ouverture du Mondial 2026 — Estadio Azteca, 11 juin | Statedoku',
    'La cérémonie d\'ouverture du Mondial 2026 sera à l\'Estadio Azteca de Mexico le 11 juin 2026. Ce qu\'on attend, performeurs possibles, où la voir depuis la France.',
    'ceremonie ouverture mondial 2026, ceremonie ouverture coupe du monde 2026, estadio azteca ceremonie, qui chante mondial 2026',
    "Cérémonie d\'ouverture du Mondial 2026",
    "11 juin 2026 à l\'Estadio Azteca, Mexico. Avant le coup d\'envoi.",
    `    <p>La <strong>cérémonie d\'ouverture du Mondial 2026 FIFA</strong> aura lieu le <strong>11 juin 2026</strong> à l\'<strong>Estadio Azteca</strong> de Mexico, juste avant le match d\'ouverture.</p>

    <h2>À quoi s\'attendre</h2>
    <p>Les cérémonies d\'ouverture FIFA incluent traditionnellement :</p>
    <ul>
      <li>Spectacle culturel mexicain (mariachi, musique régionale)</li>
      <li>Show de lumières et pyrotechnie massif</li>
      <li>Un ou deux artistes pop interprétant l\'hymne officiel</li>
      <li>Discours du président FIFA (Gianni Infantino)</li>
      <li>Hissage des 48 drapeaux</li>
      <li>Procession du trophée FIFA</li>
    </ul>

    <h2>Performeurs potentiels</h2>
    <p>Les rumeurs pour 2026 (non confirmées officiellement) :</p>
    <ul>
      <li><strong>Mexicain :</strong> Bad Bunny, Maluma, Camila Cabello</li>
      <li><strong>Américain :</strong> Shakira (icône Mondial), The Weeknd, BTS</li>
      <li><strong>Canadien :</strong> Drake, Justin Bieber</li>
    </ul>

    <h2>Cérémonies passées mémorables</h2>
    <ul>
      <li><strong>2022 Qatar :</strong> Morgan Freeman + Trinidad Cardona.</li>
      <li><strong>2018 Russie :</strong> Robbie Williams.</li>
      <li><strong>2014 Brésil :</strong> Pitbull, Jennifer Lopez, Claudia Leitte — "We Are One".</li>
      <li><strong>2010 Afrique du Sud :</strong> Shakira et "Waka Waka" — 4 milliards de vues sur YouTube.</li>
      <li><strong>1994 USA :</strong> Diana Ross a raté son tir au but lors de son show !</li>
    </ul>

    <h2>Durée</h2>
    <p>Environ <strong>30 minutes</strong>, avant le match d\'ouverture.</p>

    <h2>Comment la voir depuis la France</h2>
    <ul>
      <li><strong>TF1</strong> et <strong>M6</strong> — diffuseurs français</li>
      <li><strong>beIN Sports</strong> — chaîne payante</li>
      <li><strong>FIFA+ app</strong> — streaming officiel gratuit</li>
    </ul>

    <h2>Décalage horaire</h2>
    <p>Mexico est <strong>UTC-6</strong>. La cérémonie à 19h heure de Mexico = <strong>3h du matin heure de Paris</strong>. Pour les fans français, c\'est tard !</p>

    <div class="cta-card">
      <h3>Apprenez les États hôtes en jouant</h3>
      <p>Statedoku utilise "Hôte du Mondial 2026" comme indice.</p>
      <a href="/fr/">Jouer le puzzle du jour →</a>
    </div>

    <h2>Questions fréquentes</h2>
    <details><summary><strong>Quand est la cérémonie d\'ouverture du Mondial 2026 ?</strong></summary><p>Le 11 juin 2026 à l\'Estadio Azteca, Mexico, juste avant le match d\'ouverture.</p></details>
    <details><summary><strong>Qui chante à la cérémonie d\'ouverture ?</strong></summary><p>FIFA confirme les artistes 3-6 mois avant. Pour 2026, pas d\'annonce officielle au jour de cette page.</p></details>
    <details><summary><strong>Combien de temps dure la cérémonie ?</strong></summary><p>Environ 30 minutes, avant le premier match.</p></details>
    <details><summary><strong>Où voir la cérémonie depuis la France ?</strong></summary><p>TF1, M6 ou beIN Sports. Streaming gratuit via FIFA+ app. À 3h du matin heure de Paris.</p></details>
`,
    faq([
      ['Quand est la cérémonie d\'ouverture du Mondial 2026 ?', 'Le 11 juin 2026 à l\'Estadio Azteca, Mexico, immédiatement avant le match d\'ouverture.'],
      ['Qui chante à la cérémonie d\'ouverture du Mondial 2026 ?', 'FIFA confirme les artistes 3 à 6 mois avant le tournoi. Les rumeurs incluent Bad Bunny, Shakira, The Weeknd, Drake et Camila Cabello.'],
      ['Combien de temps dure la cérémonie d\'ouverture ?', 'Environ 30 minutes, juste avant le match d\'ouverture à l\'Estadio Azteca.'],
      ['Où voir la cérémonie d\'ouverture depuis la France ?', 'TF1 et M6 diffusent les grandes affiches. beIN Sports a tous les droits. FIFA+ app offre un streaming gratuit. À 3h du matin heure de Paris.'],
    ]),
    bcFR('ceremonie-ouverture-mondial-2026','Cérémonie d\'ouverture'), hreflangFR('ceremonie-ouverture-mondial-2026'), footerFR, 'fr_FR', '/fr/learn/', 'Apprendre', relFR, '🏆 🎵 CÉRÉMONIE OUVERTURE')
]);

out.push(['fr/learn/ou-voir-france-coupe-du-monde-2026',
  wrap('fr', 'ou-voir-france-coupe-du-monde-2026',
    'Où voir la France à la Coupe du Monde 2026 — TV, streaming, bars | Statedoku',
    'Où voir les Bleus à la Coupe du Monde 2026 : TF1, M6, beIN Sports, FIFA+ app. Bars français aux USA. Décalage horaire France-USA.',
    'ou voir france coupe du monde 2026, diffuseur mondial 2026, tf1 m6 mondial 2026, bars francais usa',
    "Où voir la France à la Coupe du Monde 2026",
    "TV, streaming, bars français aux USA. Tous les moyens pour suivre les Bleus.",
    `    <p>Pour suivre les <strong>Bleus à la Coupe du Monde 2026</strong>, vous avez plusieurs options selon votre situation et votre pays.</p>

    <h2>Diffuseurs français (en France)</h2>
    <ul>
      <li><strong>TF1</strong> — tous les matchs des Bleus + grandes affiches + ouverture/finale</li>
      <li><strong>M6</strong> — diffusion paralèlle de certains matchs</li>
      <li><strong>beIN Sports</strong> — tous les 104 matchs (chaîne payante)</li>
      <li><strong>FIFA+ app</strong> — streaming officiel gratuit (qualité limitée)</li>
    </ul>

    <h2>Décalage horaire France-USA</h2>
    <table class="lt">
      <thead><tr><th>Lieu du match</th><th>Heure US</th><th>Heure Paris</th></tr></thead>
      <tbody>
        <tr><td>New York / MetLife</td><td>15h ET</td><td><strong>21h Paris</strong></td></tr>
        <tr><td>Los Angeles / SoFi</td><td>15h PT</td><td><strong>0h Paris (J+1)</strong></td></tr>
        <tr><td>Houston / Dallas</td><td>15h CT</td><td><strong>22h Paris</strong></td></tr>
        <tr><td>Mexico (Azteca)</td><td>15h CT</td><td><strong>22h Paris</strong></td></tr>
      </tbody>
    </table>
    <p>Les matchs en soirée US sont idéaux pour Paris (21h-0h). Les matchs midi US sont parfois en pleine nuit pour Paris.</p>

    <h2>Bars français aux États-Unis</h2>
    <h3>New York</h3>
    <ul>
      <li><strong>Le Bain</strong> (Standard Hotel) — atmosphère lounge.</li>
      <li><strong>The French Diner</strong> — Lower East Side, ambiance bistro.</li>
      <li><strong>Buvette</strong> — West Village. Cuisine bistro.</li>
    </ul>

    <h3>Los Angeles</h3>
    <ul>
      <li><strong>Petit Trois</strong> — Hollywood.</li>
      <li><strong>Coucou</strong> — West Hollywood.</li>
      <li><strong>Antibes</strong> — Beverly Hills.</li>
    </ul>

    <h3>Miami</h3>
    <ul>
      <li><strong>La Petite Maison</strong> — Brickell. Restaurant + bar français.</li>
      <li><strong>Atelier Monnier</strong> — Brickell.</li>
    </ul>

    <h2>Communauté française aux USA</h2>
    <ul>
      <li><strong>~150 000 Français</strong> aux USA</li>
      <li>Concentrations : New York (~50 000), LA (~35 000), Miami (~15 000)</li>
      <li>Lyon Sister-City Boston</li>
      <li>French American Chamber of Commerce dans plusieurs villes</li>
    </ul>

    <h2>Fan zones officielles aux USA pour les Français</h2>
    <ul>
      <li><strong>Times Square</strong> (NYC) — diffusion publique des grandes affiches.</li>
      <li><strong>Pier 17</strong> (Seaport, NYC) — FIFA Fan Festival officiel.</li>
      <li><strong>Bayfront Park</strong> (Miami) — atmosphère internationale.</li>
    </ul>

    <h2>Streaming sans cable depuis les USA</h2>
    <ul>
      <li><strong>Peacock</strong> ($5.99/mois) — Telemundo en espagnol, mais aussi via Fox Sports App</li>
      <li><strong>Fubo</strong> ($75/mois) — Fox Sports HD</li>
      <li><strong>YouTube TV</strong> ($73/mois) — Fox Sports</li>
      <li><strong>FIFA+ app</strong> — gratuit (qualité limitée)</li>
    </ul>

    <div class="cta-card">
      <h3>Apprenez les États hôtes en jouant</h3>
      <p>Si vous voyagez aux USA pour les Bleus, apprenez les 50 États avec Statedoku.</p>
      <a href="/fr/">Jouer le puzzle du jour →</a>
    </div>

    <h2>Questions fréquentes</h2>
    <details><summary><strong>Qui diffuse les matchs de la France en 2026 ?</strong></summary><p>TF1 et M6 pour les grandes affiches. beIN Sports pour tous les matchs.</p></details>
    <details><summary><strong>Quel décalage horaire France-USA ?</strong></summary><p>Paris vs New York : -6h. Paris vs LA : -9h. Paris vs Houston/Mexico : -7h.</p></details>
    <details><summary><strong>Combien y a-t-il de Français aux USA ?</strong></summary><p>Environ 150 000 — principalement à New York (~50 000), LA (~35 000), Miami (~15 000).</p></details>
`,
    faq([
      ['Qui diffuse la Coupe du Monde 2026 en France ?', 'TF1 et M6 ont les droits gratuits pour les matchs des Bleus et les grandes affiches. beIN Sports a tous les 104 matchs (chaîne payante).'],
      ['Quel est le décalage horaire entre la France et les USA pour le Mondial 2026 ?', 'Paris vs New York/MetLife : 6 heures (NY en retard). Paris vs Los Angeles : 9 heures. Paris vs Houston/Dallas/Mexico : 7-8 heures.'],
      ['Combien y a-t-il de Français aux États-Unis ?', 'Environ 150 000 Français vivent aux USA. Principales concentrations : New York (~50 000), Los Angeles (~35 000), Miami (~15 000), San Francisco.'],
      ['Comment voir la Coupe du Monde sans abonnement aux USA ?', 'Fubo ($75/mois) inclut Fox Sports HD. YouTube TV ($73/mois) aussi. FIFA+ app est gratuit avec qualité limitée.'],
    ]),
    bcFR('ou-voir-france-coupe-du-monde-2026','Où voir la France'), hreflangFR('ou-voir-france-coupe-du-monde-2026'), footerFR, 'fr_FR', '/fr/learn/', 'Apprendre', relFR, '🏆 🇫🇷 OÙ VOIR LES BLEUS')
]);

out.push(['fr/learn/comparaison-mondial-2026-vs-qatar-2022',
  wrap('fr', 'comparaison-mondial-2026-vs-qatar-2022',
    'Mondial 2026 vs Qatar 2022 — comparaison complète | Statedoku',
    'Comparaison entre la Coupe du Monde 2026 (USA-Canada-Mexique) et Qatar 2022 : équipes (48 vs 32), matchs (104 vs 64), durée, recettes, infrastructures.',
    'mondial 2026 vs qatar 2022, comparaison coupe du monde 2026 2022, fifa 2026 vs 2022, format mondial 2026',
    "Mondial 2026 vs Qatar 2022 — comparaison",
    "Format élargi, 3 hôtes, durée plus longue. Tout ce qui change entre les deux Mondials.",
    `    <p>La <strong>Coupe du Monde 2026</strong> est très différente de Qatar 2022. Voici la comparaison complète.</p>

    <table class="lt">
      <thead><tr><th>Métrique</th><th>Qatar 2022</th><th>USA-Canada-Mexique 2026</th></tr></thead>
      <tbody>
        <tr><td>Équipes</td><td>32</td><td><strong>48</strong></td></tr>
        <tr><td>Matchs</td><td>64</td><td><strong>104</strong></td></tr>
        <tr><td>Hôtes</td><td>1 (Qatar)</td><td><strong>3 (USA, Canada, Mexique)</strong></td></tr>
        <tr><td>Stades</td><td>8</td><td><strong>16</strong></td></tr>
        <tr><td>Durée</td><td>28 jours</td><td><strong>39 jours</strong></td></tr>
        <tr><td>Période</td><td>Nov-Dec (hiver Europe)</td><td>Juin-Juillet (été)</td></tr>
        <tr><td>Finale</td><td>Lusail Stadium, Qatar</td><td>MetLife Stadium, NJ</td></tr>
        <tr><td>Capacité finale</td><td>88 966 (Lusail)</td><td>82 500 (MetLife)</td></tr>
        <tr><td>Champion</td><td>Argentine (vs France)</td><td>À déterminer</td></tr>
        <tr><td>Recettes FIFA</td><td>$7.5 milliards</td><td><strong>$11+ milliards prévus</strong></td></tr>
        <tr><td>Spectateurs total</td><td>3.4M</td><td><strong>5-6M prévus</strong></td></tr>
        <tr><td>Mascotte(s)</td><td>1 (La'eeb)</td><td><strong>3 (Maple, Zayu, Clutch)</strong></td></tr>
        <tr><td>Nouveauté format</td><td>—</td><td>Tour des 32 (R32)</td></tr>
      </tbody>
    </table>

    <h2>Ce qui a changé</h2>

    <h3>Plus de matchs, plus de pays</h3>
    <p>Le passage de 32 à 48 équipes signifie 16 sélections supplémentaires. Pour les fans, c\'est plus de matchs avec leurs équipes locales. Pour les sélections, c\'est plus de chances d\'atteindre le Mondial.</p>

    <h3>Format Tour des 32 (R32)</h3>
    <p>Nouveau ! Première fois dans l\'histoire de la Coupe du Monde. Après les poules (12 groupes de 4), 32 équipes passent au Tour des 32. Puis Tour des 16, Quarts, Demis, Finale.</p>

    <h3>Période</h3>
    <p>Qatar 2022 s\'est joué en novembre-décembre à cause de la chaleur estivale. 2026 revient au calendrier traditionnel (juin-juillet).</p>

    <h3>Trois mascottes</h3>
    <p>Maple (Canada), Zayu (Mexique), Clutch (USA) — une mascotte par pays hôte. Première fois.</p>

    <h3>Sites de matchs</h3>
    <p>Qatar 2022 avait 8 stades dans une zone urbaine compacte (Doha). 2026 a 16 stades répartis sur 3 pays — distances énormes entre certaines équipes.</p>

    <h2>Ce qui reste identique</h2>
    <ul>
      <li>Trophée FIFA officiel</li>
      <li>Hymne FIFA traditionnel (depuis 1994)</li>
      <li>Technologie de hors-jeu semi-automatique</li>
      <li>VAR universel</li>
      <li>Trophée Soulier d\'Or, Ballon d\'Or, Gant d\'Or</li>
    </ul>

    <h2>Impact pour les supporters français</h2>
    <ul>
      <li><strong>Plus loin :</strong> 8-9h de vol Paris-USA vs 6h Paris-Qatar.</li>
      <li><strong>Plus cher :</strong> hôtels USA plus chers que Qatar, multiplication des destinations.</li>
      <li><strong>Plus accessible :</strong> ESTA en ligne (~21 €) vs visa Qatar (~30 €), mais culture américaine plus familière.</li>
      <li><strong>Meilleurs horaires :</strong> matchs à 21h Paris vs matchs à 11h, 14h, 17h, 20h pour Qatar.</li>
    </ul>

    <div class="cta-card">
      <h3>Apprenez les États hôtes en jouant</h3>
      <p>Statedoku utilise "Hôte du Mondial 2026" comme indice dans son puzzle.</p>
      <a href="/fr/">Jouer le puzzle du jour →</a>
    </div>

    <h2>Questions fréquentes</h2>
    <details><summary><strong>Quelle est la principale différence entre 2026 et 2022 ?</strong></summary><p>2026 a 48 équipes (vs 32), 104 matchs (vs 64), 3 pays hôtes (vs 1), et introduit un nouveau Tour des 32.</p></details>
    <details><summary><strong>Combien d\'équipes en plus à 2026 vs 2022 ?</strong></summary><p>16 sélections en plus. Le passage de 32 à 48 équipes est la plus grosse expansion de l\'histoire de la Coupe du Monde.</p></details>
    <details><summary><strong>Pourquoi le format change-t-il ?</strong></summary><p>FIFA voulait inclure plus de pays. L\'expansion à 48 équipes ajoute 16 sélections, mais requiert un nouveau Tour des 32.</p></details>
`,
    faq([
      ['Quelle est la principale différence entre le Mondial 2026 et le Qatar 2022 ?', 'Le Mondial 2026 a 48 équipes (vs 32 au Qatar), 104 matchs (vs 64), 3 pays hôtes (vs 1), 16 stades (vs 8), et 39 jours de compétition (vs 28). Il introduit aussi un nouveau Tour des 32.'],
      ['Combien d\'équipes participeront à la Coupe du Monde 2026 ?', '48 équipes — 16 de plus qu\'au Qatar 2022. C\'est la plus grosse expansion de l\'histoire de la Coupe du Monde.'],
      ['Quand est le Mondial 2026 (mois) ?', 'Du 11 juin au 19 juillet 2026. Retour au calendrier estival traditionnel (Qatar 2022 était en novembre-décembre à cause de la chaleur).'],
      ['Y a-t-il un nouveau format pour 2026 ?', 'Oui. Un nouveau Tour des 32 (R32) est introduit entre les poules et le Tour des 16. C\'est nécessité par l\'expansion à 48 équipes en 12 poules de 4.'],
    ]),
    bcFR('comparaison-mondial-2026-vs-qatar-2022','2026 vs 2022'), hreflangFR('comparaison-mondial-2026-vs-qatar-2022'), footerFR, 'fr_FR', '/fr/learn/', 'Apprendre', relFR, '🏆 ⏪ 2026 vs 2022')
]);

out.push(['fr/learn/prix-billets-mondial-2026',
  wrap('fr', 'prix-billets-mondial-2026',
    'Prix des billets du Mondial 2026 — toutes les phases + comment acheter | Statedoku',
    'Combien coûtent les billets du Mondial 2026 ? Phases de poules 60-300$, 8e 150-500$, quarts 300-1000$, demis 500-2500$, finale 1000-6000$.',
    'prix billets mondial 2026, combien coute billet coupe du monde 2026, prix finale mondial 2026, acheter billets fifa 2026',
    "Prix des billets du Mondial 2026",
    "Toutes les phases du tournoi : combien coûte une place et comment en acheter.",
    `    <p>FIFA a annoncé les prix officiels des billets pour le <strong>Mondial 2026</strong> fin 2025. Les prix varient selon la phase, le stade et la catégorie de siège.</p>

    <h2>Prix officiels (valeur faciale, USD)</h2>
    <table class="lt">
      <thead><tr><th>Phase</th><th>Le moins cher</th><th>Le plus cher</th><th>Notes</th></tr></thead>
      <tbody>
        <tr><td><strong>Poules</strong></td><td>60$</td><td>300$</td><td>72 matchs. Le meilleur rapport.</td></tr>
        <tr><td><strong>Tour des 32 (NOUVEAU)</strong></td><td>80$</td><td>400$</td><td>16 matchs. Première fois.</td></tr>
        <tr><td><strong>Tour des 16</strong></td><td>150$</td><td>500$</td><td>8 matchs.</td></tr>
        <tr><td><strong>Quarts de finale</strong></td><td>300$</td><td>1 000$</td><td>4 matchs.</td></tr>
        <tr><td><strong>Demi-finales</strong></td><td>500$</td><td>2 500$</td><td>2 matchs.</td></tr>
        <tr><td><strong>Match pour la 3e place</strong></td><td>300$</td><td>1 500$</td><td>18 juillet.</td></tr>
        <tr><td><strong>FINALE</strong></td><td>1 000$</td><td>6 000$</td><td>19 juillet — MetLife Stadium.</td></tr>
      </tbody>
    </table>

    <h2>Prix sur le marché secondaire (typiques)</h2>
    <p>Après l\'écoulement des billets phase 1, les prix de revente bougent :</p>
    <ul>
      <li><strong>Poules :</strong> +30% à +100% par rapport à la valeur faciale</li>
      <li><strong>R32 / 8e :</strong> +50% à +150%</li>
      <li><strong>Quarts :</strong> +100% à +300%</li>
      <li><strong>Demis :</strong> +200% à +500%</li>
      <li><strong>Finale :</strong> 5 000$ à 30 000$+ selon les équipes en lice</li>
    </ul>

    <h2>Comment acheter des billets</h2>

    <h3>Canaux officiels</h3>
    <ul>
      <li><strong>FIFA.com/tickets</strong> — vente principale, tirages aléatoires par phases</li>
      <li><strong>FIFA Ticket Resale</strong> — plateforme officielle de revente</li>
      <li><strong>Packages hospitalité</strong> — partenaires FIFA (Wonder, MATCH). 5 000$-50 000$+ par match.</li>
    </ul>

    <h3>Marché secondaire (légal aux USA)</h3>
    <ul>
      <li><strong>StubHub</strong> — vérifié, protection anti-fraude</li>
      <li><strong>Vivid Seats</strong> — vérifié</li>
      <li><strong>SeatGeek</strong> — vérifié</li>
      <li>Éviter : Leboncoin, eBay, DMs sociaux — risque élevé de fraude</li>
    </ul>

    <h2>Conseils pour économiser</h2>
    <ul>
      <li><strong>Tirage de dernière minute</strong> — places disponibles à prix faciaux en avril-juin 2026</li>
      <li><strong>Cibler matchs sans star :</strong> poules entre équipes mid-tier = moins chères</li>
      <li><strong>Éviter les têtes d\'affiche :</strong> matchs Brésil/Argentine/USA = prix premium</li>
      <li><strong>Catégories 3 ou 4 :</strong> nettement moins chères</li>
    </ul>

    <h2>Catégories de billets</h2>
    <p>Dans chaque phase, FIFA vend plusieurs catégories :</p>
    <ul>
      <li><strong>Catégorie 1 :</strong> Plus proche du terrain. Prix premium.</li>
      <li><strong>Catégorie 2 :</strong> Tribune basse, légèrement plus loin.</li>
      <li><strong>Catégorie 3 :</strong> Tribune haute.</li>
      <li><strong>Catégorie 4 (résidents pays hôtes seulement) :</strong> Disponible uniquement pour USA/Canada/Mexique. Très réduit.</li>
    </ul>

    <div class="cta-card">
      <h3>Apprenez les États hôtes en jouant</h3>
      <p>Statedoku utilise "Hôte du Mondial 2026" comme indice.</p>
      <a href="/fr/">Jouer le puzzle du jour →</a>
    </div>

    <h2>Questions fréquentes</h2>
    <details><summary><strong>Combien coûte un billet du Mondial 2026 ?</strong></summary><p>Phase de poules : 60-300$. Finale : 1 000-6 000$. Prix de revente sur le marché secondaire peuvent être beaucoup plus élevés.</p></details>
    <details><summary><strong>Où acheter des billets officiels ?</strong></summary><p>Uniquement sur FIFA.com/tickets. Pour la revente vérifiée : StubHub, Vivid Seats, SeatGeek.</p></details>
    <details><summary><strong>Les billets pour la finale sont-ils encore disponibles ?</strong></summary><p>Probablement pas en phase 1 (déjà épuisée). Possibles en phases ultérieures ou sur le marché de revente officiel FIFA.</p></details>
`,
    faq([
      ['Combien coûte un billet pour la Coupe du Monde 2026 ?', 'Phase de poules : 60-300$. R32 : 80-400$. 8e : 150-500$. Quarts : 300-1 000$. Demis : 500-2 500$. Finale : 1 000-6 000$ valeur faciale.'],
      ['Où acheter des billets officiels du Mondial 2026 ?', 'Uniquement sur FIFA.com/tickets. Pour la revente vérifiée et anti-fraude : StubHub, Vivid Seats, SeatGeek. Éviter les sites non vérifiés.'],
      ['Combien coûte un billet pour la finale du Mondial 2026 ?', 'Valeur faciale : 1 000-6 000$. Marché secondaire : 5 000-30 000$+ selon les équipes qualifiées en finale.'],
      ['Les billets pour le Mondial 2026 sont-ils encore disponibles ?', 'Les billets phase 1 (vente d\'octobre 2025) sont écoulés. Les phases ultérieures (tirages, revente officielle) restent disponibles jusqu\'au tournoi.'],
    ]),
    bcFR('prix-billets-mondial-2026','Prix des billets'), hreflangFR('prix-billets-mondial-2026'), footerFR, 'fr_FR', '/fr/learn/', 'Apprendre', relFR, '🏆 🎟️ PRIX DES BILLETS')
]);

// Write all
for(const [rel, html] of out){
  const dir = path.join(ROOT, rel);
  fs.mkdirSync(dir, {recursive:true});
  fs.writeFileSync(path.join(dir, 'index.html'), html);
  console.log(`✅ /${rel}/`);
}
console.log(`\n${out.length} articles WC batch 3 générés.`);
