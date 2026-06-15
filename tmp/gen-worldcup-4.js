#!/usr/bin/env node
/**
 * WC 2026 mega-batch 4 — 35 articles
 *  EN (12): 5 teams + 3 players + 2 stadium guides + 1 history + 1 budget
 *  ES (12): 4 teams + 3 players + 3 Mexico/USA-themed + 2 logistics
 *  FR (11): 4 teams + 3 players + 2 stadium guides + 2 voyage
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
      <a href="/learn/world-cup-2026-dates-schedule/">→ Dates & schedule</a>
      <a href="/learn/usmnt-world-cup-2026/">→ USMNT</a>
      <a href="/learn/world-cup-2026-opening-ceremony/">→ Opening ceremony</a>
      <a href="/learn/world-cup-2026-ticket-prices/">→ Ticket prices</a>
      <a href="/learn/messi-world-cup-2026/">→ Messi</a>
    </div>`;
const relES = `    <div class="related-grid">
      <a href="/es/learn/mundial-2026-eeuu/">→ Las 11 ciudades sede</a>
      <a href="/es/learn/mexico-mundial-2026/">→ México</a>
      <a href="/es/learn/argentina-mundial-2026/">→ Argentina</a>
      <a href="/es/learn/messi-mundial-2026/">→ Messi</a>
      <a href="/es/learn/mundial-2026-boletos-visa/">→ Boletos + visa</a>
      <a href="/es/learn/donde-ver-mexico-mundial-2026/">→ Dónde ver México</a>
    </div>`;
const relFR = `    <div class="related-grid">
      <a href="/fr/learn/coupe-du-monde-2026-villes-usa/">→ Les 11 villes hôtes</a>
      <a href="/fr/learn/france-coupe-du-monde-2026/">→ La France</a>
      <a href="/fr/learn/coupe-du-monde-2026-voyage-usa/">→ Voyager aux USA</a>
      <a href="/fr/learn/mbappe-coupe-du-monde-2026/">→ Mbappé</a>
      <a href="/fr/learn/prix-billets-mondial-2026/">→ Prix des billets</a>
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
// EN TEAMS — 5 (Spain, Argentina, Mexico, France, Morocco)
// ═════════════════════════════════════════════════════════════════════════

const enTeams = [
  {slug:'spain-world-cup-2026', name:'Spain', flag:'🇪🇸',
   titles:1, lastTitle:'2010', stars:'Lamine Yamal, Pedri, Rodri, Nico Williams, Pau Cubarsí',
   coach:'Luis de la Fuente', diaspora:'Spanish-Americans: ~1M. Concentrated in NY/NJ, Florida, California.',
   keyNote:'Reigning Euro 2024 champions (Lamine Yamal scored youngest Euro goal). Spain enters with the most exciting young squad — Lamine Yamal (19), Pedri (23), Pau Cubarsí (19), Nico Williams (24).'},
  {slug:'argentina-world-cup-2026', name:'Argentina', flag:'🇦🇷',
   titles:3, lastTitle:'2022', stars:'Lionel Messi, Lautaro Martínez, Julián Álvarez, Enzo Fernández, Alexis Mac Allister',
   coach:'Lionel Scaloni', diaspora:'~285k Argentines in US. Concentrated in Miami (~70k post-Messi), NY/NJ (~40k), LA (~25k).',
   keyNote:'Defending champions. Messi could play his 6th and possibly final World Cup at 39. Inter Miami connection means Hard Rock Stadium becomes practically a home venue.'},
  {slug:'mexico-world-cup-2026', name:'Mexico', flag:'🇲🇽',
   titles:0, lastTitle:'never (quarterfinals 1970, 1986)', stars:'Edson Álvarez, Hirving Lozano, Santiago Giménez, Luis Romo',
   coach:'Javier Aguirre (3rd stint)', diaspora:'37M Mexican-Americans in US — largest Latin American diaspora.',
   keyNote:'Co-host nation, automatic qualification. Mexico plays the opening match June 11 at Estadio Azteca — 3rd time in WC history (1970, 1986, 2026). Massive Mexican-American fan presence in every US venue.'},
  {slug:'france-world-cup-2026', name:'France', flag:'🇫🇷',
   titles:2, lastTitle:'2018', stars:'Kylian Mbappé, Aurélien Tchouaméni, Eduardo Camavinga, Bradley Barcola, Désiré Doué',
   coach:'Didier Deschamps (last WC before stepping down)', diaspora:'~150k French nationals in US. NYC, LA, Miami.',
   keyNote:'Champions in 2018, runners-up in 2022. Deschamps announced this is his last World Cup as France manager. France enters as favorite given depth + experience + Mbappé prime.'},
  {slug:'morocco-world-cup-2026', name:'Morocco', flag:'🇲🇦',
   titles:0, lastTitle:'never (4th in 2022 — historic)', stars:'Achraf Hakimi, Hakim Ziyech, Bilal El Khannouss, Brahim Díaz, Sofyan Amrabat',
   coach:'Walid Regragui', diaspora:'Moroccan-Americans: ~120k. Concentrated in NY, Chicago, Washington DC.',
   keyNote:'Made history as first African team in WC semifinals (Qatar 2022). Now hosting WC 2030 (with Spain + Portugal). 2026 is build-up for that hosting role.'},
];

for(const t of enTeams){
  const body = `    <p>${t.flag} <strong>${t.name}</strong> will compete at the <strong>2026 FIFA World Cup</strong> hosted by the USA, Canada, and Mexico from <strong>June 11 to July 19, 2026</strong>.</p>

    <div class="wc-quick">
      <dl>
        <dt>FIFA World Cup titles</dt><dd>${t.titles} (${t.titles===0?'best result':'last won'}: ${t.lastTitle})</dd>
        <dt>Manager</dt><dd>${t.coach}</dd>
        <dt>Key players</dt><dd>${t.stars}</dd>
        <dt>Fans in the US</dt><dd>${t.diaspora}</dd>
      </dl>
    </div>

    <h2>${t.name} at the 2026 World Cup</h2>
    <p>${t.keyNote}</p>

    <h2>The squad</h2>
    <p>${t.name}'s 2026 squad is built around: ${t.stars}. Manager ${t.coach} has been refining the team for years.</p>

    <h2>${t.name}'s diaspora in the US</h2>
    <p>${t.diaspora}</p>

    ${t.slug==='spain-world-cup-2026' ? '<h2>The Yamal generation</h2><p>Spain enters 2026 with the youngest exciting attacking core in football. Lamine Yamal (19) scored the youngest Euro goal in history. Pedri (23) is the midfield maestro. Pau Cubarsí (19) is the defensive prodigy. They\'re the generation expected to dominate the next decade.</p>' : ''}
    ${t.slug==='argentina-world-cup-2026' ? '<h2>Messi\'s farewell?</h2><p>Messi will be 39 during the tournament. Despite saying after 2022 that "I won\'t play another World Cup", he has not formally retired. If he plays, it\'s his record-tying 6th WC alongside Ronaldo. Inter Miami based him in the US — Hard Rock Stadium becomes Argentina\'s home venue.</p>' : ''}
    ${t.slug==='mexico-world-cup-2026' ? '<h2>The opening match honor</h2><p>As host, Mexico plays the WC opener on June 11, 2026 at Estadio Azteca. The third opening match at the same stadium (1970, 1986, 2026) — a global first.</p>' : ''}
    ${t.slug==='france-world-cup-2026' ? '<h2>Deschamps\' last dance</h2><p>Manager Didier Deschamps confirmed this is his last World Cup. After 14 years at the helm (2012-2026), it ends with one of the most successful tenures in international football. Champions 2018, runner-ups 2022.</p>' : ''}
    ${t.slug==='morocco-world-cup-2026' ? '<h2>From historic 4th place to 2030 host</h2><p>Morocco\'s 4th place in Qatar 2022 was the first time an African team reached the semifinals. Now Morocco co-hosts the 2030 World Cup with Spain and Portugal. The 2026 tournament is build-up for that bigger role.</p>' : ''}

    <h2>Where ${t.name} will play</h2>
    <p>Group-stage matches are determined by FIFA draw. See the full <a href="/learn/world-cup-2026-us-host-cities/">11 US host cities</a> and <a href="/learn/world-cup-2026-schedule-by-state/">schedule by state</a>.</p>

    <div class="cta-card">
      <h3>Learn the host states by playing</h3>
      <p>Statedoku uses "Hosts a WC 2026 match" as a constraint.</p>
      <a href="/">Play today's puzzle →</a>
    </div>

    <h2>Frequently asked questions</h2>
    <details><summary><strong>Is ${t.name} qualified for the 2026 World Cup?</strong></summary><p>Yes, ${t.name} is qualified for the FIFA World Cup 2026.</p></details>
    <details><summary><strong>How many World Cups has ${t.name} won?</strong></summary><p>${t.titles} title${t.titles!==1?'s':''}. ${t.titles>0?'Last won: '+t.lastTitle+'.':'Best result: '+t.lastTitle+'.'}</p></details>
    <details><summary><strong>Who manages ${t.name}?</strong></summary><p>${t.coach}.</p></details>
    <details><summary><strong>Who are ${t.name}'s key players for 2026?</strong></summary><p>${t.stars}.</p></details>
`;
  out.push([`learn/${t.slug}`,
    wrap('en', t.slug,
      `${t.name} at the 2026 World Cup — squad, schedule, history | Statedoku`,
      `${t.flag} ${t.name} at the FIFA World Cup 2026 hosted in USA, Canada, Mexico. ${t.titles} title${t.titles!==1?'s':''}. ${t.coach} as manager. ${t.stars.split(',')[0]} leads.`,
      `${t.name.toLowerCase()} world cup 2026, ${t.name.toLowerCase()} fifa 2026, ${t.name.toLowerCase()} squad world cup`,
      `${t.flag} ${t.name} at the 2026 World Cup`,
      `${t.titles} World Cup title${t.titles!==1?'s':''}. ${t.coach} as manager. ${t.stars.split(',')[0]} leads the squad.`,
      body,
      faq([
        [`Is ${t.name} qualified for the 2026 World Cup?`, `Yes, ${t.name} is qualified for the 2026 FIFA World Cup hosted in the USA, Canada, and Mexico from June 11 to July 19, 2026.`],
        [`How many World Cups has ${t.name} won?`, `${t.name} has won the World Cup ${t.titles} time${t.titles!==1?'s':''}. ${t.titles>0?'Last title in '+t.lastTitle+'.':'Best result: '+t.lastTitle+'.'}`],
        [`Who is ${t.name}'s manager for the 2026 World Cup?`, t.coach+'.'],
        [`Who are ${t.name}'s key players for the 2026 World Cup?`, t.stars+'.'],
      ]),
      bcEN(t.slug, `${t.name} World Cup 2026`), hreflangEN(t.slug), footerEN, 'en_US', '/learn/', 'Learn', relEN, `🏆 ${t.flag} WORLD CUP 2026`)
  ]);
}

// ═════════════════════════════════════════════════════════════════════════
// EN PLAYERS — 3 (Bellingham, Pedri, Lautaro Martínez)
// ═════════════════════════════════════════════════════════════════════════

const enPlayers = [
  {slug:'bellingham-world-cup-2026', name:'Jude Bellingham', country:'England', flag:'🏴󠁧󠁢󠁥󠁮󠁧󠁿',
   age:'22', club:'Real Madrid', wc:'1', wcWon:'0',
   note:"Bellingham at 22 enters his second World Cup as England's most influential player. UEFA Champions League winner 2024. Will likely captain or co-captain England with Harry Kane.",
   chip:'🏆 🏴󠁧󠁢󠁥󠁮󠁧󠁿 BELLINGHAM WC 2026'},
  {slug:'pedri-world-cup-2026', name:'Pedri', country:'Spain', flag:'🇪🇸',
   age:'23', club:'FC Barcelona', wc:'1', wcWon:'0',
   note:"Pedri is Spain's playmaker-in-chief. Euro 2024 winner. Often compared to Iniesta. At 23, this is his second World Cup. The orchestrator of Spain's Yamal-led generation.",
   chip:'🏆 🇪🇸 PEDRI WC 2026'},
  {slug:'lautaro-martinez-world-cup-2026', name:'Lautaro Martínez', country:'Argentina', flag:'🇦🇷',
   age:'28', club:'Inter Milan', wc:'2', wcWon:'1 (2022)',
   note:"Lautaro Martínez is Argentina's #9 and captain in waiting. 2022 World Cup champion. Inter Milan captain. At 28, in his absolute prime. Plays alongside Messi at international level.",
   chip:'🏆 🇦🇷 LAUTARO WC 2026'},
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

    <h2>Where ${p.country} will play</h2>
    <p>${p.country}'s matches are determined by the FIFA group draw. See the full <a href="/learn/world-cup-2026-us-host-cities/">list of 11 US host cities</a>.</p>

    <div class="cta-card">
      <h3>Learn the host states by playing</h3>
      <p>Statedoku uses "Hosts the 2026 WC" as a constraint in its daily puzzle.</p>
      <a href="/">Play today's puzzle →</a>
    </div>

    <h2>Frequently asked questions</h2>
    <details><summary><strong>Will ${p.name} play the 2026 World Cup?</strong></summary><p>${p.country} is qualified. ${p.name} is expected in the squad.</p></details>
    <details><summary><strong>How old is ${p.name} during the 2026 World Cup?</strong></summary><p>${p.age} years old.</p></details>
    <details><summary><strong>What club does ${p.name} play for?</strong></summary><p>${p.club}.</p></details>
`;
  out.push([`learn/${p.slug}`,
    wrap('en', p.slug,
      `${p.name} at the 2026 World Cup — age, club, history | Statedoku`,
      `${p.flag} ${p.name} at the 2026 FIFA World Cup. Age ${p.age}, plays for ${p.club}, for ${p.country}. ${p.wc} prior WCs.`,
      `${p.name.toLowerCase()} world cup 2026, ${p.name.toLowerCase()} fifa 2026, ${p.country.toLowerCase()} ${p.name.toLowerCase().split(' ').pop()}`,
      `${p.flag} ${p.name} — 2026 World Cup`, `${p.country} · ${p.age} years old · ${p.club}.`, body,
      faq([
        [`Will ${p.name} play at the 2026 World Cup?`, `${p.country} is qualified. ${p.name} is expected in the squad.`],
        [`How old is ${p.name} during the 2026 World Cup?`, `${p.age} years old during the tournament.`],
        [`What club does ${p.name} play for?`, p.club+'.'],
      ]),
      bcEN(p.slug, p.name), hreflangEN(p.slug), footerEN, 'en_US', '/learn/', 'Learn', relEN, p.chip)
  ]);
}

// ═════════════════════════════════════════════════════════════════════════
// EN STADIUM GUIDES — 2 (MetLife, SoFi)
// ═════════════════════════════════════════════════════════════════════════

out.push(['learn/metlife-stadium-world-cup-guide',
  wrap('en', 'metlife-stadium-world-cup-guide',
    'MetLife Stadium World Cup 2026 fan guide — tickets, transit, hotels | Statedoku',
    'Complete fan guide to MetLife Stadium for the 2026 World Cup. Host venue for the FINAL. NJ Transit, hotels near, parking, food. Everything you need.',
    'metlife stadium world cup 2026, metlife stadium guide, how to get to metlife stadium, hotels near metlife stadium',
    "MetLife Stadium — your 2026 World Cup fan guide",
    "Hosts the FINAL. NJ Transit from NYC. Hotels, food, parking, security.",
    `    <p><strong>MetLife Stadium</strong> in East Rutherford, New Jersey, hosts the <strong>2026 FIFA World Cup Final</strong> on July 19, 2026, plus 7 other matches. Capacity: 82,500 — the largest US venue. Here's everything you need to know as a fan.</p>

    <div class="wc-quick">
      <dl>
        <dt>Address</dt><dd>1 MetLife Stadium Dr, East Rutherford, NJ</dd>
        <dt>Capacity</dt><dd>82,500 (largest US WC venue)</dd>
        <dt>Total WC matches</dt><dd>8 (including FINAL)</dd>
        <dt>Opened</dt><dd>2010</dd>
        <dt>Other tenants</dt><dd>NY Giants + NY Jets (NFL)</dd>
      </dl>
    </div>

    <h2>How to get there</h2>

    <h3>From Manhattan (best option for most fans)</h3>
    <p><strong>NJ Transit</strong>:
    <br>From Penn Station NYC, take the Meadowlands Rail Line directly to Meadowlands Sports Complex Station. 15 minutes, $5.25.
    <br>Trains run every 15 mins on event days.
    <br>Station is at the stadium gates.</p>

    <h3>From Newark Liberty Airport (EWR)</h3>
    <p>30-min NJ Transit ride from Newark Airport. Or 25-min Uber/Lyft ($35-60).</p>

    <h3>From JFK Airport</h3>
    <p>1h15 by train (AirTrain + LIRR + transfer) or 1h drive ($70-120 Uber/Lyft).</p>

    <h3>Driving</h3>
    <p>From NYC: I-95 N to Exit 17. Stadium parking $50+/day on match days.</p>

    <h2>Hotels nearby</h2>

    <h3>Closest (East Rutherford / Carlstadt) — walking/short drive</h3>
    <ul>
      <li><strong>Sheraton Lincoln Harbor</strong> — Weehawken, 10 mins drive</li>
      <li><strong>Hampton Inn East Rutherford</strong> — 1 mile from stadium</li>
      <li><strong>Embassy Suites Secaucus</strong> — 2 miles, NJ Transit access</li>
      <li><strong>Price range during WC:</strong> $350-$800/night</li>
    </ul>

    <h3>NYC (best vibe, cheaper than stadium hotels)</h3>
    <ul>
      <li>Times Square hotels — walk to Penn Station then 15-min train</li>
      <li><strong>Price range during WC:</strong> $250-$1,200/night depending on hotel</li>
    </ul>

    <h2>Food at the stadium</h2>
    <ul>
      <li>Standard NFL food: hot dogs, pretzels, beer</li>
      <li>Premium options: Shake Shack, Carl's Cuban, gourmet pizza</li>
      <li>Plant-based options available</li>
      <li>Beer/wine standard. Hard liquor in club levels only</li>
    </ul>

    <h2>Best seats</h2>
    <p>For WC matches, FIFA categorizes seats 1-4:</p>
    <ul>
      <li><strong>Cat 1:</strong> 100-200 level, near field. $300+ group, $5K+ Final</li>
      <li><strong>Cat 2:</strong> Lower bowl corners. $200+ group, $3K+ Final</li>
      <li><strong>Cat 3:</strong> Upper bowl. $100+ group, $2K+ Final</li>
      <li><strong>Cat 4 (host residents only):</strong> Discount tier. Available only with US/Canada/Mexico address</li>
    </ul>

    <h2>Security & policies</h2>
    <ul>
      <li>Clear bag policy (12" x 12" or smaller, clear)</li>
      <li>No outside food or drink</li>
      <li>Arrive 60-90 mins before kickoff (security + queues)</li>
      <li>Vibrant cashless: card only, no cash accepted</li>
    </ul>

    <div class="cta-card">
      <h3>Learn the host states by playing</h3>
      <p>Statedoku uses "Hosts the Final" as a constraint.</p>
      <a href="/">Play today's puzzle →</a>
    </div>

    <h2>Frequently asked questions</h2>
    <details><summary><strong>How do I get to MetLife Stadium from Manhattan?</strong></summary><p>NJ Transit from Penn Station — Meadowlands Rail Line, direct to Meadowlands Sports Complex Station. 15 minutes, $5.25.</p></details>
    <details><summary><strong>Where should I stay for the World Cup Final?</strong></summary><p>NYC offers the best vibe + value. Stay near Penn Station, ride NJ Transit 15 min. Stadium-area hotels (Hampton Inn, Embassy Suites) are pricier but walking distance.</p></details>
    <details><summary><strong>Is parking available at MetLife?</strong></summary><p>Yes. ~$50+/day on WC days. Pre-purchase recommended via stadium website.</p></details>
    <details><summary><strong>Can I bring my own food/drink?</strong></summary><p>No. Stadium is fully cashless and prohibits outside food/drink. Bottled water is provided free at certain stations.</p></details>
`,
    faq([
      ['How do I get to MetLife Stadium from Manhattan?', 'NJ Transit Meadowlands Rail Line from Penn Station directly to Meadowlands Sports Complex Station. 15 minutes, $5.25 each way. Trains every 15 min on event days.'],
      ['Where should I stay for the 2026 World Cup Final?', 'NYC offers best vibe + price. Stay near Penn Station and ride NJ Transit. Hotels near the stadium (East Rutherford) cost $350-$800/night during WC; NYC hotels range $250-$1,200/night.'],
      ['What is MetLife Stadium capacity for the World Cup?', '82,500 seats — the largest US WC venue. Standing room or temporary structures may add a few thousand more for specific events.'],
      ['Can I bring food and drink into MetLife Stadium?', 'No outside food or drink allowed. The stadium has standard NFL food (hot dogs, pretzels) plus premium options (Shake Shack, Carl\'s Cuban). The stadium is fully cashless — credit/debit only.'],
    ]),
    bcEN('metlife-stadium-world-cup-guide','MetLife Stadium guide'), hreflangEN('metlife-stadium-world-cup-guide'), footerEN, 'en_US', '/learn/', 'Learn', relEN, '🏆 🏁 METLIFE STADIUM')
]);

out.push(['learn/sofi-stadium-world-cup-guide',
  wrap('en', 'sofi-stadium-world-cup-guide',
    'SoFi Stadium World Cup 2026 fan guide — tickets, transit, parking | Statedoku',
    'Complete fan guide to SoFi Stadium for the 2026 World Cup. Hosts 8 matches incl knockout. Inglewood, LA. Newest venue, most expensive ever ($5.5B). How to get there.',
    'sofi stadium world cup 2026, sofi stadium guide, how to get to sofi stadium, la world cup stadium',
    "SoFi Stadium — your 2026 World Cup fan guide",
    "Hosts 8 matches. Inglewood, LA. Newest US WC venue, opened 2020.",
    `    <p><strong>SoFi Stadium</strong> in Inglewood, California, hosts <strong>8 matches</strong> at the 2026 World Cup including knockout rounds. Capacity: 70,000 (expandable to 100,000). The newest US WC venue and the <strong>most expensive stadium ever built</strong> ($5.5B). Here's everything you need.</p>

    <div class="wc-quick">
      <dl>
        <dt>Address</dt><dd>1001 Stadium Dr, Inglewood, CA</dd>
        <dt>Capacity</dt><dd>70,240 (expandable to 100,000)</dd>
        <dt>Total WC matches</dt><dd>8</dd>
        <dt>Opened</dt><dd>September 2020</dd>
        <dt>Cost</dt><dd>$5.5 billion (most expensive stadium ever)</dd>
        <dt>Other tenants</dt><dd>LA Rams + LA Chargers (NFL)</dd>
      </dl>
    </div>

    <h2>How to get there</h2>

    <h3>By Metro (LA Metro K Line)</h3>
    <p>The K Line opened in 2022 and reaches SoFi Stadium directly. From downtown LA, take the K Line to Downtown Inglewood Station, then 10-minute shuttle to stadium. 45 minutes total. Fare: $1.75.</p>

    <h3>From LAX (Los Angeles International Airport)</h3>
    <p>LAX is 4 miles from SoFi. Options:
    <br>• Free LAX-to-Metro shuttle to K Line, then K Line to SoFi (~30 mins)
    <br>• Uber/Lyft direct: 15 mins, $15-30
    <br>• Driving: 10-25 mins depending on traffic</p>

    <h3>From downtown LA</h3>
    <p>K Line: 45 mins, $1.75
    <br>Driving: 30-60 mins, $40+ for stadium parking</p>

    <h3>Parking</h3>
    <p>Stadium parking is $50+/day. Better to use rideshare (Uber/Lyft pickup areas are well-marked) or LA Metro.</p>

    <h2>Hotels nearby</h2>

    <h3>Closest (Inglewood / El Segundo)</h3>
    <ul>
      <li><strong>Hyatt Regency LAX</strong> — 4 miles, easy access</li>
      <li><strong>Marriott LAX</strong> — 5 miles</li>
      <li><strong>Renaissance LAX</strong> — 5 miles</li>
      <li><strong>Price range during WC:</strong> $300-$600/night</li>
    </ul>

    <h3>Santa Monica / Venice Beach</h3>
    <ul>
      <li>10 miles north, beach vibe</li>
      <li><strong>Price range during WC:</strong> $400-$900/night</li>
    </ul>

    <h3>Downtown LA</h3>
    <ul>
      <li>Best for cultural exploration, walkable</li>
      <li><strong>Price range during WC:</strong> $250-$600/night</li>
    </ul>

    <h2>Food at the stadium</h2>
    <ul>
      <li>Premium California-style food: gourmet tacos, ramen, plant-based options</li>
      <li>Local LA classics: Pink's Hot Dogs, Wexler's Deli</li>
      <li>Vegan + vegetarian options strong</li>
      <li>Stadium is cashless — card only</li>
    </ul>

    <h2>What to see in LA around your match</h2>
    <ul>
      <li><strong>Venice Beach</strong> — 8 miles. Boardwalk, muscle beach, skating.</li>
      <li><strong>Santa Monica Pier</strong> — 9 miles. Ferris wheel, restaurants.</li>
      <li><strong>Hollywood</strong> — 12 miles. Walk of Fame, Chinese Theatre.</li>
      <li><strong>Griffith Observatory</strong> — 15 miles. Best LA view.</li>
      <li><strong>Universal Studios</strong> — 16 miles.</li>
      <li><strong>Disneyland (Anaheim)</strong> — 25 miles.</li>
    </ul>

    <h2>Mexican / Latin influence</h2>
    <p>LA has the largest Mexican-American population of any US city. Expect huge Mexican fan presence at every match — and excellent Mexican food everywhere. Suggested:</p>
    <ul>
      <li><strong>Tacos Punta Cabras</strong> — Santa Monica</li>
      <li><strong>Guisados</strong> — Boyle Heights</li>
      <li><strong>Sonoratown</strong> — downtown</li>
      <li><strong>La Cevicheria</strong> — Koreatown</li>
    </ul>

    <div class="cta-card">
      <h3>Learn the host states by playing</h3>
      <p>Statedoku uses "Hosts WC 2026" as a constraint.</p>
      <a href="/">Play today's puzzle →</a>
    </div>

    <h2>Frequently asked questions</h2>
    <details><summary><strong>How do I get to SoFi Stadium without a car?</strong></summary><p>LA Metro K Line directly. From downtown LA, take K Line to Downtown Inglewood Station then short shuttle. 45 minutes total, $1.75.</p></details>
    <details><summary><strong>How far is SoFi from LAX?</strong></summary><p>4 miles. By LAX-Metro shuttle + K Line: 30 mins. By Uber: 15 mins, $15-30. By car: 10-25 mins depending on traffic.</p></details>
    <details><summary><strong>Where should I stay for SoFi Stadium matches?</strong></summary><p>Inglewood / LAX area is closest and easiest. Santa Monica is more scenic. Downtown LA is more cultural. Each has tradeoffs in price and vibe.</p></details>
    <details><summary><strong>Why is SoFi Stadium famous?</strong></summary><p>It opened in 2020 and is the most expensive stadium ever built at $5.5 billion. Features a translucent ETFE roof, 70,000 seats expandable to 100,000, and is home to both LA Rams and LA Chargers.</p></details>
`,
    faq([
      ['How do I get to SoFi Stadium from downtown LA?', 'LA Metro K Line directly. From downtown LA Union Station, take the K Line to Downtown Inglewood Station, then 10-minute shuttle to stadium. 45 minutes total, $1.75 each way.'],
      ['How far is SoFi Stadium from LAX airport?', '4 miles. Options: LAX-Metro shuttle + K Line (30 mins), Uber/Lyft direct (15 mins, $15-30), or driving (10-25 mins depending on traffic).'],
      ['What is SoFi Stadium capacity for the 2026 World Cup?', '70,240 seats, expandable to 100,000 for premium events. It\'s the newest US WC venue (opened 2020) and the most expensive stadium ever built at $5.5 billion.'],
      ['Where should I stay for SoFi Stadium World Cup matches?', 'Inglewood / LAX area is closest. Santa Monica has beach vibe (10 miles north). Downtown LA is more cultural and walkable (45 min by Metro). Each has tradeoffs.'],
    ]),
    bcEN('sofi-stadium-world-cup-guide','SoFi Stadium guide'), hreflangEN('sofi-stadium-world-cup-guide'), footerEN, 'en_US', '/learn/', 'Learn', relEN, '🏆 🌴 SOFI STADIUM')
]);

// ═════════════════════════════════════════════════════════════════════════
// EN HISTORY + BUDGET — 2
// ═════════════════════════════════════════════════════════════════════════

out.push(['learn/usa-vs-mexico-soccer-history',
  wrap('en', 'usa-vs-mexico-soccer-history',
    'USA vs Mexico soccer rivalry — full head-to-head history | Statedoku',
    'USA vs Mexico soccer history: head-to-head record, biggest matches, famous wins. From "Dos a Cero" to Copa America. The rivalry that defines CONCACAF.',
    'usa vs mexico soccer history, usmnt vs mexico, dos a cero, mexico vs usa world cup history',
    "USA vs Mexico — the soccer rivalry",
    "The biggest rivalry in CONCACAF. Head-to-head, famous wins, the 'Dos a Cero' tradition.",
    `    <p>The <strong>USA vs Mexico</strong> soccer rivalry is the most fierce in CONCACAF and one of the most heated in international football. Here's the complete history of this North American showdown.</p>

    <h2>All-time head-to-head record</h2>
    <table class="lt">
      <thead><tr><th>Metric</th><th>USA</th><th>Mexico</th></tr></thead>
      <tbody>
        <tr><td>Total wins</td><td>~22</td><td>~38</td></tr>
        <tr><td>Draws</td><td colspan="2" style="text-align:center">~16</td></tr>
        <tr><td>Goals scored</td><td>~90</td><td>~140</td></tr>
        <tr><td>Confederation titles meeting</td><td colspan="2" style="text-align:center">CONCACAF Gold Cup x10+</td></tr>
      </tbody>
    </table>
    <p>Mexico holds the overall edge historically, but the USA has dominated recent meetings (2010s-2020s).</p>

    <h2>The "Dos a Cero" tradition</h2>
    <p>"Dos a Cero" (Spanish for "2-0") is the score line that defines the rivalry. In World Cup qualifiers played at Crew Stadium in Columbus, Ohio (later Lower.com Field), the USA has beaten Mexico <strong>2-0 multiple times in a row</strong>:</p>
    <ul>
      <li>2001: USA 2-0 Mexico (WC qualifier)</li>
      <li>2005: USA 2-0 Mexico (WC qualifier)</li>
      <li>2009: USA 2-0 Mexico (WC qualifier)</li>
      <li>2013: USA 2-0 Mexico (WC qualifier)</li>
      <li>2016: USA 1-2 Mexico (rare loss at Crew)</li>
    </ul>
    <p>The score became symbolic. Fans tatoo it. Bars play "Dos a Cero" by Latin artists. It's the foundation myth of US soccer.</p>

    <h2>Famous matches</h2>

    <h3>2002 World Cup Round of 16 — USA 2-0 Mexico</h3>
    <p>In Korea. USA's biggest WC win against any team. Brian McBride and Landon Donovan goals. Sparked the modern USMNT.</p>

    <h3>2009 Confederations Cup — Brazil 3-0 USA</h3>
    <p>Not USA-Mexico but pivotal: USA beat Spain (Brazil-bound Spanish team) 2-0 in semifinal. Foreshadowed USA's rise.</p>

    <h3>2011 Gold Cup Final — Mexico 4-2 USA</h3>
    <p>Mexico's biggest comeback. USA led 2-0, Mexico scored 4 unanswered. Played at Rose Bowl, Pasadena.</p>

    <h3>2021 Concacaf Nations League Final — USA 3-2 Mexico</h3>
    <p>In Denver. Extra time epic. McKennie, Pulisic, Reyna goals. USMNT's modern coming-of-age.</p>

    <h3>2022 Concacaf W Championship — USA 1-0 Mexico</h3>
    <p>USWNT continues dominance over Mexican women's team.</p>

    <h2>The 2026 World Cup angle</h2>
    <p>For the first time, USA and Mexico co-host the same World Cup. They could meet only in the knockout stages (group placement is engineered to keep co-hosts apart). If they meet — say, in the Round of 16 or Quarter-Final — it would be the most-watched soccer match in North American history.</p>

    <h2>Cultural significance</h2>
    <p>The USA-Mexico rivalry transcends sport. It reflects immigration, identity, language, and shared border politics. Most Mexican-American fans support Mexico for emotional reasons + family heritage. USMNT has historically been the team of converted soccer fans.</p>

    <h2>Where to watch USA vs Mexico in 2026</h2>
    <ul>
      <li><strong>Telemundo</strong> (Spanish, USA)</li>
      <li><strong>Fox Sports</strong> (English, USA)</li>
      <li><strong>Univision</strong> + <strong>Televisa</strong> (Mexico)</li>
      <li><strong>BBC</strong> + <strong>ITV</strong> (UK)</li>
      <li><strong>FIFA+ app</strong> (streaming worldwide)</li>
    </ul>

    <div class="cta-card">
      <h3>Learn the states by playing</h3>
      <p>Statedoku uses "Hosts USA-Mexico WC matches" as a constraint.</p>
      <a href="/">Play today's puzzle →</a>
    </div>

    <h2>Frequently asked questions</h2>
    <details><summary><strong>What is the USA vs Mexico head-to-head record?</strong></summary><p>Mexico leads historically (~38 wins to USA's ~22). But the USA has dominated recent meetings (2010s-2020s) including the 2021 Nations League Final.</p></details>
    <details><summary><strong>What does "Dos a Cero" mean?</strong></summary><p>"Dos a Cero" means "2-0" in Spanish. It's the score the USA repeatedly beat Mexico by at Crew Stadium (Columbus, Ohio) in WC qualifiers 2001-2013. It became symbolic of the rivalry.</p></details>
    <details><summary><strong>Can USA play Mexico at the 2026 World Cup?</strong></summary><p>Yes, but only in the knockout stages. FIFA engineers the group stage to keep co-hosts apart.</p></details>
    <details><summary><strong>Where do most Mexican-American fans live?</strong></summary><p>California, Texas, Arizona, Illinois, Florida — about 37 million Mexican-Americans in the US (largest Latin American diaspora in the country).</p></details>
`,
    faq([
      ['What is the all-time USA vs Mexico soccer record?', 'Mexico leads historically (~38 wins to USA\'s ~22, with ~16 draws). But the USA has dominated recent meetings (2010s-2020s) including the 2021 Nations League Final.'],
      ['What does "Dos a Cero" mean in US soccer culture?', '"Dos a Cero" means "2-0" in Spanish. It\'s the score the USMNT repeatedly beat Mexico by at Crew Stadium (Columbus, Ohio) in WC qualifiers 2001-2013. It became the symbolic score line of the rivalry.'],
      ['Can the USA and Mexico meet at the 2026 World Cup?', 'Yes, but only in the knockout stages. FIFA engineers the group stage draw to keep co-host nations apart until elimination rounds.'],
      ['Why is USA vs Mexico the biggest rivalry in CONCACAF?', 'The two nations have met over 70 times in formal competition. The proximity, immigration ties, and Mexican-American population make the rivalry intensely personal for millions.'],
    ]),
    bcEN('usa-vs-mexico-soccer-history','USA vs Mexico history'), hreflangEN('usa-vs-mexico-soccer-history'), footerEN, 'en_US', '/learn/', 'Learn', relEN, '🏆 ⚔️ USA vs MEXICO')
]);

out.push(['learn/world-cup-2026-hotel-pricing',
  wrap('en', 'world-cup-2026-hotel-pricing',
    '2026 World Cup hotel pricing — what to expect in each US host city | Statedoku',
    'Hotel prices during the 2026 World Cup in each US city. NYC $400-1500/night. Miami $350-1200. LA $300-900. How to save, when to book, what areas to avoid.',
    'world cup 2026 hotel prices, hotels world cup 2026 nyc miami la, where to stay world cup 2026, world cup 2026 accommodation',
    "2026 World Cup hotel pricing",
    "What hotels cost in each host city. NYC $400-1.5K, Miami $350-1.2K, LA $300-900. How to save.",
    `    <p>Hotel prices during the <strong>2026 FIFA World Cup</strong> will spike dramatically — especially in NYC, LA, Miami. Here's what to expect in each host city + strategies to save money.</p>

    <h2>Average nightly rates by host city (peak WC dates)</h2>
    <table class="lt">
      <thead><tr><th>City</th><th>Budget</th><th>Mid-range</th><th>Premium</th></tr></thead>
      <tbody>
        <tr><td><strong>NYC / NJ (Final host)</strong></td><td>$300-450</td><td>$500-900</td><td>$1,000-2,500</td></tr>
        <tr><td><strong>Miami</strong></td><td>$280-400</td><td>$450-800</td><td>$900-1,800</td></tr>
        <tr><td><strong>Los Angeles</strong></td><td>$220-350</td><td>$400-700</td><td>$800-1,500</td></tr>
        <tr><td><strong>SF Bay Area</strong></td><td>$280-400</td><td>$450-750</td><td>$800-1,400</td></tr>
        <tr><td><strong>Boston</strong></td><td>$250-380</td><td>$420-680</td><td>$700-1,200</td></tr>
        <tr><td><strong>Philadelphia</strong></td><td>$200-300</td><td>$330-550</td><td>$600-1,000</td></tr>
        <tr><td><strong>Atlanta</strong></td><td>$180-280</td><td>$300-500</td><td>$550-900</td></tr>
        <tr><td><strong>Seattle</strong></td><td>$220-340</td><td>$370-620</td><td>$680-1,100</td></tr>
        <tr><td><strong>Dallas</strong></td><td>$170-260</td><td>$280-460</td><td>$520-850</td></tr>
        <tr><td><strong>Houston</strong></td><td>$160-250</td><td>$270-440</td><td>$500-800</td></tr>
        <tr><td><strong>Kansas City</strong></td><td>$150-230</td><td>$250-400</td><td>$450-720</td></tr>
      </tbody>
    </table>
    <p><em>All prices in USD per night, for a standard hotel room. Prices spike higher during host country (USA) matches and FINAL week (July 14-19).</em></p>

    <h2>Strategies to save money</h2>

    <h3>1. Book NOW (or earlier)</h3>
    <p>Prices increase as the tournament approaches. Book today vs 3 months from now = often 20-40% savings. Most hotels have free cancellation until 24-48 hours before.</p>

    <h3>2. Stay outside the host city center</h3>
    <ul>
      <li><strong>NYC:</strong> Stay in Brooklyn, Queens, or Jersey City. 30-50% cheaper than Manhattan.</li>
      <li><strong>LA:</strong> Stay in Burbank or Pasadena. 40% cheaper than Hollywood/Santa Monica.</li>
      <li><strong>Miami:</strong> Stay in Aventura, Brickell, or Doral. 30-40% cheaper than South Beach.</li>
      <li><strong>San Francisco:</strong> Stay in Oakland or Berkeley. 40% cheaper.</li>
    </ul>

    <h3>3. Use vacation rentals (Airbnb, VRBO)</h3>
    <p>Often cheaper for groups (4-6 people). Saving: 30-50% vs hotels. Tradeoff: less reliable, less service.</p>

    <h3>4. Avoid the FINAL week</h3>
    <p>July 14-19, 2026 has the highest hotel rates (Semi-Finals, Third Place, Final). Pricing can be 2-3x higher than group stage rates.</p>

    <h3>5. Travel by car between host cities</h3>
    <p>Renting a car + cheaper budget hotels in smaller cities = often cheaper than premium hotels.</p>

    <h2>What about hostels and budget options?</h2>
    <p>US has fewer hostels than Europe. Best budget options:</p>
    <ul>
      <li><strong>Pod Hotels</strong> (NYC, LA, Miami) — micro-rooms, $150-250/night</li>
      <li><strong>HI Hostels</strong> (San Francisco, Boston, etc.) — $80-150/night</li>
      <li><strong>Motels</strong> — $100-180/night, less central but functional</li>
      <li><strong>Couchsurfing</strong> — limited but possible</li>
    </ul>

    <h2>Hidden costs to factor in</h2>
    <ul>
      <li>Resort fees: $30-50/night in many hotels (not included in posted price)</li>
      <li>Parking: $50-90/night in NYC, LA, Miami</li>
      <li>Wi-Fi: rarely free in premium hotels ($15-25/day)</li>
      <li>Tax: 14-17% on top of room rate</li>
      <li>Tip: $5/night for housekeeping recommended</li>
    </ul>

    <div class="cta-card">
      <h3>Learn the host states by playing</h3>
      <p>Statedoku uses "Hosts a 2026 WC match" as a constraint.</p>
      <a href="/">Play today's puzzle →</a>
    </div>

    <h2>Frequently asked questions</h2>
    <details><summary><strong>How much will hotels cost in NYC during the World Cup?</strong></summary><p>Budget: $300-450/night. Mid-range: $500-900. Premium: $1,000-2,500. Peak during FINAL week (July 14-19). Stay in Brooklyn/Queens/Jersey City to save 30-50%.</p></details>
    <details><summary><strong>What's the cheapest US host city for World Cup hotels?</strong></summary><p>Kansas City, Houston, Dallas, Atlanta — budget hotels under $250/night vs $400+ in coastal cities.</p></details>
    <details><summary><strong>When should I book a hotel for the World Cup?</strong></summary><p>Now or earlier. Prices increase as the tournament approaches. Most hotels offer free cancellation 24-48 hours before. Book early + cancel if plans change.</p></details>
    <details><summary><strong>Are Airbnbs cheaper than hotels for the World Cup?</strong></summary><p>Often yes, especially for groups of 4-6 (30-50% savings vs equivalent hotel rooms). Tradeoff: less consistent service and quality.</p></details>
`,
    faq([
      ['How much will hotels cost during the 2026 World Cup in NYC?', 'NYC hotels will cost $300-450/night for budget, $500-900 for mid-range, $1,000-2,500 for premium during the World Cup. Peak prices during Final week (July 14-19). Save 30-50% by staying in Brooklyn, Queens, or Jersey City.'],
      ['What is the cheapest US host city for World Cup accommodation?', 'Kansas City, Houston, Dallas, and Atlanta — budget hotels under $250/night vs $400+ in coastal cities like NYC, LA, and Miami.'],
      ['When should I book a hotel for the 2026 World Cup?', 'Book now or earlier. Prices increase as the tournament approaches. Most hotels offer free cancellation 24-48 hours before, so booking early and cancelling later is often the best strategy.'],
      ['Are Airbnbs cheaper than hotels for the World Cup?', 'Often yes, especially for groups of 4-6 people. Airbnb savings vs equivalent hotel rooms: 30-50%. Tradeoff: less consistent service and amenities than hotels.'],
    ]),
    bcEN('world-cup-2026-hotel-pricing','Hotel pricing guide'), hreflangEN('world-cup-2026-hotel-pricing'), footerEN, 'en_US', '/learn/', 'Learn', relEN, '🏆 🏨 HOTEL PRICING')
]);

// ═════════════════════════════════════════════════════════════════════════
// ES TEAMS + PLAYERS + ANGLES — 12
// ═════════════════════════════════════════════════════════════════════════

const esTeams = [
  {slug:'espana-mundial-2026', name:'España', flag:'🇪🇸',
   titles:1, lastTitle:'2010', stars:'Lamine Yamal, Pedri, Rodri, Nico Williams, Pau Cubarsí',
   coach:'Luis de la Fuente',
   note:'Campeona de la Eurocopa 2024. España llega con la generación más joven y prometedora del fútbol mundial. Lamine Yamal (19) ya es estrella global. Pedri y Pau Cubarsí completan un mediocampo y defensa de oro.'},
  {slug:'colombia-mundial-2026', name:'Colombia', flag:'🇨🇴',
   titles:0, lastTitle:'nunca (cuartos 2014)', stars:'Luis Díaz, James Rodríguez, Jhon Durán, Daniel Muñoz, Davinson Sánchez',
   coach:'Néstor Lorenzo',
   note:'Subcampeona de Copa América 2024 (perdió la final con Argentina). Colombia es subcampeona también de la Copa América 2001 que ganó como anfitriona. Generación dorada nueva con Luis Díaz.'},
  {slug:'francia-mundial-2026', name:'Francia', flag:'🇫🇷',
   titles:2, lastTitle:'2018', stars:'Kylian Mbappé, Aurélien Tchouaméni, Eduardo Camavinga, Bradley Barcola',
   coach:'Didier Deschamps (último Mundial)',
   note:'Campeona 2018, subcampeona 2022. Deschamps ha anunciado que este es su último Mundial como técnico. Francia llega como una de las favoritas absolutas.'},
  {slug:'eeuu-mundial-2026', name:'Estados Unidos (USMNT)', flag:'🇺🇸',
   titles:0, lastTitle:'nunca (3o en 1930)', stars:'Christian Pulisic, Weston McKennie, Tyler Adams, Folarin Balogun, Sergiño Dest',
   coach:'Mauricio Pochettino',
   note:'País co-anfitrión, clasificación automática. Pochettino (argentino) dirige al USMNT. El equipo joven (Pulisic 27, Balogun 24, McKennie 28) busca su mejor resultado en historia moderna gracias al factor casa.'},
];

for(const t of esTeams){
  const body = `    <p>${t.flag} <strong>${t.name}</strong> jugará el <strong>Mundial 2026 FIFA</strong> co-organizado por EE.UU., Canadá y México del <strong>11 de junio al 19 de julio de 2026</strong>.</p>

    <div class="wc-quick">
      <dl>
        <dt>Títulos de Mundial</dt><dd>${t.titles} (${t.titles===0?'mejor resultado':'último'}: ${t.lastTitle})</dd>
        <dt>Director técnico</dt><dd>${t.coach}</dd>
        <dt>Jugadores clave</dt><dd>${t.stars}</dd>
      </dl>
    </div>

    <h2>${t.name} en el Mundial 2026</h2>
    <p>${t.note}</p>

    <h2>Plantilla y estrategia</h2>
    <p>${t.name}'s 2026 escuadra: ${t.stars}. ${t.coach} llega a su mejor torneo.</p>

    ${t.slug==='espana-mundial-2026' ? '<h2>La generación Yamal</h2><p>Lamine Yamal (19 años) ya marcó el gol más joven en la historia de la Eurocopa (2024). Pedri (23) es el "nuevo Iniesta". Pau Cubarsí (19) es la promesa defensiva. España tiene la mejor generación joven del fútbol mundial.</p>' : ''}
    ${t.slug==='colombia-mundial-2026' ? '<h2>La revancha</h2><p>Colombia perdió la final de la Copa América 2024 contra Argentina. El Mundial 2026 es la oportunidad para vengarse a nivel global.</p>' : ''}
    ${t.slug==='francia-mundial-2026' ? '<h2>El adiós de Deschamps</h2><p>Didier Deschamps confirmó que el Mundial 2026 será su último torneo como seleccionador de Francia. Tras 14 años (2012-2026), termina con uno de los registros más exitosos del fútbol internacional.</p>' : ''}
    ${t.slug==='eeuu-mundial-2026' ? '<h2>El factor casa</h2><p>EE.UU. juega como anfitrión. Todos los partidos de fase de grupos serán en suelo estadounidense. Mauricio Pochettino, ex-PSG/Tottenham/Chelsea, dirige al USMNT con un plantel joven (Pulisic 27, Balogun 24, Dest 25).</p>' : ''}

    <h2>Cómo ver a ${t.name} desde EE.UU.</h2>
    <ul>
      <li><strong>Telemundo</strong> (español) + <strong>Peacock</strong> streaming</li>
      <li><strong>Fox Sports</strong> (inglés)</li>
      <li><strong>FIFA+</strong> app (gratuito, calidad limitada)</li>
    </ul>

    <div class="cta-card">
      <h3>Aprende los estados sede jugando</h3>
      <p>Si viajas para apoyar a ${t.name}, conoce los 50 estados con Statedoku.</p>
      <a href="/es/">Jugar el puzzle de hoy →</a>
    </div>

    <h2>Preguntas frecuentes</h2>
    <details><summary><strong>¿${t.name} está clasificado para el Mundial 2026?</strong></summary><p>Sí, ${t.name} está clasificado.</p></details>
    <details><summary><strong>¿Cuántos Mundiales ha ganado ${t.name}?</strong></summary><p>${t.titles} título${t.titles!==1?'s':''}. ${t.titles>0?'Último: '+t.lastTitle+'.':'Mejor: '+t.lastTitle+'.'}</p></details>
    <details><summary><strong>¿Quién dirige a ${t.name}?</strong></summary><p>${t.coach}.</p></details>
`;
  out.push([`es/learn/${t.slug}`,
    wrap('es', t.slug,
      `${t.name} en el Mundial 2026 — plantilla, sedes, historia | Statedoku`,
      `${t.flag} ${t.name} en el Mundial 2026 FIFA. ${t.titles} título${t.titles!==1?'s':''}. Director técnico: ${t.coach}. Estrellas: ${t.stars.split(',')[0]}.`,
      `${t.name.toLowerCase()} mundial 2026, ${t.name.toLowerCase()} fifa 2026, seleccion ${t.name.toLowerCase()}`,
      `${t.flag} ${t.name} en el Mundial 2026`,
      `${t.titles} título${t.titles!==1?'s':''}. ${t.coach} en el banquillo. ${t.stars.split(',')[0]} lidera el ataque.`,
      body,
      faq([
        [`¿${t.name} juega el Mundial 2026?`, t.name + ' está clasificado para el Mundial 2026 FIFA en EE.UU., Canadá y México.'],
        [`¿Cuántos Mundiales ha ganado ${t.name}?`, t.name + ' ha ganado el Mundial ' + t.titles + ' vez' + (t.titles !== 1 ? 'es' : '') + '. ' + (t.titles > 0 ? 'Último: '+t.lastTitle+'.' : 'Mejor: '+t.lastTitle+'.')],
        [`¿Quién es el director técnico de ${t.name}?`, t.coach+'.'],
        [`¿Quién es el jugador estrella de ${t.name}?`, t.stars.split(',')[0]+'.'],
      ]),
      bcES(t.slug, t.name+' Mundial 2026'), hreflangES(t.slug), footerES, 'es_ES', '/es/learn/', 'Aprender', relES, `🏆 ${t.flag} MUNDIAL 2026`)
  ]);
}

// ES PLAYERS — 3
const esPlayers = [
  {slug:'pedri-mundial-2026', name:'Pedri', country:'España', flag:'🇪🇸',
   age:'23', club:'FC Barcelona', wc:'1', wcWon:'0',
   note:"Pedri es el mediocampista de oro de España. Campeón de la Eurocopa 2024. Comparado con Iniesta. A los 23 años, segundo Mundial. El orquestador de la generación Yamal.",
   chip:'🏆 🇪🇸 PEDRI MUNDIAL 2026'},
  {slug:'lautaro-martinez-mundial-2026', name:'Lautaro Martínez', country:'Argentina', flag:'🇦🇷',
   age:'28', club:'Inter Milan', wc:'2', wcWon:'1 (2022)',
   note:"Lautaro Martínez es el goleador y futuro capitán de Argentina. Campeón del Mundial 2022. Capitán del Inter. A los 28 años, en plenitud. Juega junto a Messi en la Albiceleste.",
   chip:'🏆 🇦🇷 LAUTARO MUNDIAL 2026'},
  {slug:'rodrygo-mundial-2026', name:'Rodrygo', country:'Brasil', flag:'🇧🇷',
   age:'25', club:'Real Madrid', wc:'1', wcWon:'0',
   note:"Rodrygo, junto a Vinicius Jr, forma el ataque de Brasil. Campeón de Champions League con Real Madrid. A los 25 años, llega a su segundo Mundial.",
   chip:'🏆 🇧🇷 RODRYGO MUNDIAL 2026'},
];

for(const p of esPlayers){
  const body = `    <p>${p.flag} <strong>${p.name}</strong> es una estrella del <strong>Mundial 2026 FIFA</strong>. A los ${p.age} años, juega para ${p.club} y representa a ${p.country}.</p>

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

    <h2>Dónde jugará ${p.country}</h2>
    <p>Consulta las <a href="/es/learn/mundial-2026-eeuu/">11 ciudades sede</a>.</p>

    <div class="cta-card">
      <h3>Aprende los estados sede jugando</h3>
      <a href="/es/">Jugar el puzzle de hoy →</a>
    </div>

    <h2>Preguntas frecuentes</h2>
    <details><summary><strong>¿${p.name} juega el Mundial 2026?</strong></summary><p>${p.country} está clasificado. ${p.name} se espera en la convocatoria.</p></details>
    <details><summary><strong>¿Cuántos años tiene ${p.name}?</strong></summary><p>${p.age} años.</p></details>
    <details><summary><strong>¿En qué club juega ${p.name}?</strong></summary><p>${p.club}.</p></details>
`;
  out.push([`es/learn/${p.slug}`,
    wrap('es', p.slug,
      `${p.name} en el Mundial 2026 — edad, club, historia | Statedoku`,
      `${p.flag} ${p.name} en el Mundial 2026 FIFA. ${p.age} años, ${p.club}, ${p.country}.`,
      `${p.name.toLowerCase()} mundial 2026, ${p.name.toLowerCase()} fifa 2026`,
      `${p.flag} ${p.name} en el Mundial 2026`, `${p.country} · ${p.age} años · ${p.club}.`, body,
      faq([
        [`¿${p.name} juega el Mundial 2026?`, p.country + ' está clasificado al Mundial 2026 FIFA. ' + p.name + ' se espera en la convocatoria.'],
        [`¿Cuántos años tiene ${p.name} en el Mundial 2026?`, p.age + ' años durante el torneo.'],
        [`¿En qué club juega ${p.name}?`, p.club+'.'],
      ]),
      bcES(p.slug, p.name), hreflangES(p.slug), footerES, 'es_ES', '/es/learn/', 'Aprender', relES, p.chip)
  ]);
}

// ES MEXICO-THEMED — 3
out.push(['es/learn/estadio-azteca-historia',
  wrap('es', 'estadio-azteca-historia',
    'Estadio Azteca — historia del estadio más legendario del mundo | Statedoku',
    'Historia del Estadio Azteca de la Ciudad de México: 3 Mundiales (1970, 1986, 2026), 87,000 espectadores, "Mano de Dios" de Maradona, "Gol del Siglo". Datos y récords.',
    'estadio azteca historia, estadio azteca mexico, azteca mundial, maradona azteca, mano de dios azteca',
    "El Estadio Azteca",
    "El estadio más legendario del fútbol mundial. Tres Mundiales, dos goles imborrables.",
    `    <p>El <strong>Estadio Azteca</strong> en la Ciudad de México es uno de los estadios más legendarios del fútbol mundial. Es el <strong>primer estadio en albergar 3 Copas del Mundo</strong> — 1970, 1986 y ahora 2026.</p>

    <div class="wc-quick">
      <dl>
        <dt>Capacidad</dt><dd>~87,000 (la más grande del Mundial 2026)</dd>
        <dt>Inaugurado</dt><dd>29 de mayo de 1966</dd>
        <dt>Mundiales</dt><dd>1970, 1986, 2026 (récord mundial)</dd>
        <dt>Ubicación</dt><dd>Coyoacán, Ciudad de México</dd>
        <dt>Equipos</dt><dd>Club América + selección mexicana</dd>
      </dl>
    </div>

    <h2>1970 — el primer Mundial en México</h2>
    <p>El Mundial 1970 fue el primero jugado fuera de Europa o Sudamérica. Pelé ganó su tercera Copa con Brasil. La final Brasil 4-1 Italia se considera uno de los mejores partidos de la historia.</p>
    <p>El "Partido del Siglo" (Italia 4-3 Alemania, semifinal) también se jugó en el Azteca — considerado el mejor partido de Mundial de todos los tiempos.</p>

    <h2>1986 — el Mundial de Maradona</h2>
    <p>El Estadio Azteca albergó dos goles que cambiaron el fútbol para siempre, ambos contra Inglaterra el 22 de junio de 1986:</p>

    <h3>La "Mano de Dios"</h3>
    <p>A los 51 minutos, Maradona saltó con Peter Shilton y empujó la pelota con la mano izquierda. Gol. El árbitro tunecino Ali Bin Nasser lo dio por bueno. Maradona después: "La pelota la metió un poco la cabeza de Maradona y un poco la mano de Dios".</p>

    <h3>El "Gol del Siglo"</h3>
    <p>Cuatro minutos después, Maradona arrancó desde su mitad de cancha. Pasó a Peter Reid, Peter Beardsley, Terry Butcher, Terry Fenwick — uno por uno — y a Peter Shilton. 10 segundos, 6 toques, 60 metros recorridos. Argentina 2-0. FIFA lo votó "Mejor Gol del Siglo XX".</p>

    <p>Argentina terminó ganando ese Mundial. Maradona se consagró como icono mundial.</p>

    <h2>2026 — el tercer Mundial</h2>
    <p>El Azteca albergará el <strong>partido inaugural del 11 de junio de 2026</strong>, donde México (anfitrión) jugará. También se jugarán otros partidos de fase de grupos y rondas eliminatorias.</p>

    <h2>Cómo llegar</h2>
    <ul>
      <li><strong>Metro CDMX:</strong> Estación "Estadio Azteca" de la Línea Xochimilco — el metro lleva directamente al estadio</li>
      <li><strong>Auto:</strong> 30-45 min desde el centro CDMX con tráfico</li>
      <li><strong>Uber/Taxi:</strong> ~$200-300 pesos desde el centro</li>
    </ul>

    <h2>Capacidad y récords</h2>
    <ul>
      <li>Capacidad oficial: ~87,000 (la más grande del Mundial 2026)</li>
      <li>Récord histórico: 119,853 (Brasil vs Italia, Final 1970)</li>
      <li>Inaugurado: 29 mayo 1966</li>
      <li>Costo construcción (1966): ~$3 millones de pesos</li>
    </ul>

    <h2>Datos curiosos</h2>
    <ul>
      <li>Es el único estadio donde dos jugadores han ganado el Mundial: Pelé (1970) y Maradona (1986)</li>
      <li>Alberga el récord de asistencia para un partido de Mundial</li>
      <li>El "Conjuro Azteca" — el ambiente único de gritos mexicanos</li>
      <li>Frenando Valenzuela tiró el primer balón ceremonial del Mundial 1986</li>
    </ul>

    <div class="cta-card">
      <h3>Aprende los estados de EE.UU. jugando</h3>
      <p>Statedoku usa pistas del Mundial 2026 en su puzzle.</p>
      <a href="/es/">Jugar el puzzle de hoy →</a>
    </div>

    <h2>Preguntas frecuentes</h2>
    <details><summary><strong>¿Dónde está el Estadio Azteca?</strong></summary><p>En Coyoacán, sur de la Ciudad de México. Estación "Estadio Azteca" de la Línea Xochimilco del metro.</p></details>
    <details><summary><strong>¿Cuál es la capacidad del Estadio Azteca?</strong></summary><p>~87,000 oficiales para Mundial 2026. Récord histórico: 119,853 (Brasil vs Italia, Final 1970).</p></details>
    <details><summary><strong>¿Cuántas Copas del Mundo ha albergado el Azteca?</strong></summary><p>Tres: 1970, 1986 y 2026. Es el primer estadio del mundo en este récord.</p></details>
    <details><summary><strong>¿Dónde fue la "Mano de Dios"?</strong></summary><p>En el Estadio Azteca, el 22 de junio de 1986, Cuartos de Final Argentina vs Inglaterra. Maradona marcó con la mano y poco después marcó el "Gol del Siglo".</p></details>
`,
    faq([
      ['¿Dónde está el Estadio Azteca?', 'El Estadio Azteca está en Coyoacán, sur de la Ciudad de México. Se llega por la Estación "Estadio Azteca" de la Línea Xochimilco del metro.'],
      ['¿Cuántas Copas del Mundo ha albergado el Estadio Azteca?', 'Tres: 1970, 1986 y 2026. Es el primer estadio del mundo en albergar tres Copas del Mundo de la FIFA.'],
      ['¿Dónde marcó Maradona la "Mano de Dios"?', 'En el Estadio Azteca, el 22 de junio de 1986, durante el partido Argentina vs Inglaterra de Cuartos de Final del Mundial. Cuatro minutos después marcó el "Gol del Siglo".'],
      ['¿Cuál es la capacidad del Estadio Azteca?', '~87,000 oficiales para el Mundial 2026. Récord histórico de asistencia: 119,853 (Brasil vs Italia, Final 1970).'],
    ]),
    bcES('estadio-azteca-historia','Estadio Azteca'), hreflangES('estadio-azteca-historia'), footerES, 'es_ES', '/es/learn/', 'Aprender', relES, '🏆 🇲🇽 ESTADIO AZTECA')
]);

out.push(['es/learn/mexico-vs-eeuu-historia',
  wrap('es', 'mexico-vs-eeuu-historia',
    'México vs Estados Unidos en fútbol — la rivalidad completa | Statedoku',
    'Historia completa de la rivalidad México vs Estados Unidos en fútbol: enfrentamientos, victorias famosas, "Dos a Cero", finales de Copa Oro, posibles encuentros 2026.',
    'mexico vs eeuu historia, mexico vs estados unidos futbol, dos a cero, copa oro mexico estados unidos',
    "México vs Estados Unidos — historia",
    'La rivalidad más grande de la CONCACAF. Enfrentamientos, "Dos a Cero", legado.',
    `    <p>La rivalidad <strong>México vs Estados Unidos</strong> es la más fuerte de la CONCACAF y una de las más intensas del fútbol mundial. He aquí la historia completa.</p>

    <h2>Récord histórico</h2>
    <table class="lt">
      <thead><tr><th>Métrica</th><th>México</th><th>EE.UU.</th></tr></thead>
      <tbody>
        <tr><td>Victorias totales</td><td>~38</td><td>~22</td></tr>
        <tr><td>Empates</td><td colspan="2" style="text-align:center">~16</td></tr>
        <tr><td>Goles anotados</td><td>~140</td><td>~90</td></tr>
        <tr><td>Copas Oro CONCACAF ganadas (acumulado)</td><td>11</td><td>7</td></tr>
      </tbody>
    </table>
    <p>México lidera históricamente. Pero EE.UU. ha dominado los enfrentamientos recientes (2010-2020s).</p>

    <h2>El fenómeno "Dos a Cero"</h2>
    <p>"Dos a Cero" se refiere al marcador con el que EE.UU. derrotó repetidamente a México en el Estadio Crew de Columbus, Ohio, en eliminatorias mundialistas:</p>
    <ul>
      <li>2001: EE.UU. 2-0 México (eliminatoria)</li>
      <li>2005: EE.UU. 2-0 México (eliminatoria)</li>
      <li>2009: EE.UU. 2-0 México (eliminatoria)</li>
      <li>2013: EE.UU. 2-0 México (eliminatoria)</li>
      <li>2016: EE.UU. 1-2 México (rara derrota en Crew)</li>
    </ul>
    <p>El "Dos a Cero" se convirtió en el grito de guerra del USMNT. Bares ponen reggaeton remix con "Dos a Cero". Es la mitología fundacional del fútbol estadounidense moderno.</p>

    <h2>Partidos memorables</h2>

    <h3>2002 Octavos de Final — EE.UU. 2-0 México</h3>
    <p>En Corea del Sur. La mayor victoria mundialista de EE.UU. contra cualquier rival. Goles de Brian McBride y Landon Donovan. El "Dos a Cero" comenzó aquí.</p>

    <h3>2011 Final Copa Oro — México 4-2 EE.UU.</h3>
    <p>La remontada épica de México. EE.UU. iba 2-0. México metió 4 sin respuesta. Jugado en el Rose Bowl, Pasadena.</p>

    <h3>2021 Final Concacaf Nations League — EE.UU. 3-2 México</h3>
    <p>En Denver. Partido épico en tiempo extra. Goles de McKennie, Pulisic, Reyna. La nueva era USMNT.</p>

    <h3>2023 Final Concacaf Nations League — EE.UU. 2-0 México</h3>
    <p>Otro "Dos a Cero" simbólico — esta vez en Final continental.</p>

    <h2>El ángulo del Mundial 2026</h2>
    <p>Por primera vez, EE.UU. y México coorganizan el mismo Mundial. Solo pueden enfrentarse en fases eliminatorias (la fase de grupos se diseña para mantener separados a los anfitriones). Si se cruzan en Octavos o Cuartos sería el partido de fútbol más visto en la historia de Norteamérica.</p>

    <h2>Significado cultural</h2>
    <p>La rivalidad va más allá del fútbol. Refleja inmigración, identidad, idioma y políticas fronterizas compartidas. Los mexicano-estadounidenses (37 millones — la mayor diáspora latinoamericana en EE.UU.) usualmente apoyan a México por herencia y emoción. El USMNT es históricamente el equipo de conversos al fútbol.</p>

    <h2>Dónde ver en 2026</h2>
    <ul>
      <li><strong>Telemundo</strong> (español, EE.UU.)</li>
      <li><strong>Fox Sports</strong> (inglés, EE.UU.)</li>
      <li><strong>Univisión</strong> + <strong>Televisa</strong> (México)</li>
      <li><strong>FIFA+</strong> app (mundialmente)</li>
    </ul>

    <div class="cta-card">
      <h3>Aprende los estados sede jugando</h3>
      <p>Statedoku usa "Sede USA-México del Mundial 2026" como pista.</p>
      <a href="/es/">Jugar el puzzle de hoy →</a>
    </div>

    <h2>Preguntas frecuentes</h2>
    <details><summary><strong>¿Cuál es el récord histórico México vs EE.UU.?</strong></summary><p>México lidera con ~38 victorias contra ~22 de EE.UU. Pero EE.UU. dominó los enfrentamientos recientes (2010-2020s).</p></details>
    <details><summary><strong>¿Qué significa "Dos a Cero"?</strong></summary><p>Se refiere al marcador con el que EE.UU. ganó repetidamente a México en el Crew Stadium de Columbus, Ohio, en eliminatorias mundialistas 2001-2013. Se convirtió en el grito de guerra del USMNT.</p></details>
    <details><summary><strong>¿Pueden México y EE.UU. cruzarse en el Mundial 2026?</strong></summary><p>Sí, pero solo en fase eliminatoria. La fase de grupos se diseña para mantener separados a los países anfitriones.</p></details>
    <details><summary><strong>¿Cuántos mexicano-americanos viven en EE.UU.?</strong></summary><p>~37 millones — la mayor comunidad latinoamericana en EE.UU. Principalmente en California, Texas, Arizona, Illinois.</p></details>
`,
    faq([
      ['¿Cuál es el récord histórico de México vs Estados Unidos en fútbol?', 'México lidera históricamente con ~38 victorias contra ~22 de Estados Unidos, con ~16 empates. Pero Estados Unidos ha dominado los enfrentamientos recientes (2010-2020s).'],
      ['¿Qué significa "Dos a Cero" en la rivalidad?', 'Se refiere al marcador con el que Estados Unidos ganó repetidamente a México en el Crew Stadium de Columbus, Ohio, en eliminatorias mundialistas 2001-2013. Se convirtió en el grito de guerra del USMNT.'],
      ['¿Pueden México y Estados Unidos enfrentarse en el Mundial 2026?', 'Sí, pero solo en fase eliminatoria. La fase de grupos se diseña para mantener separados a los países anfitriones.'],
      ['¿Cuántos mexicano-americanos viven en Estados Unidos?', 'Aproximadamente 37 millones — la mayor comunidad latinoamericana en Estados Unidos. Principalmente concentrada en California, Texas, Arizona, Illinois y Florida.'],
    ]),
    bcES('mexico-vs-eeuu-historia','México vs EE.UU.'), hreflangES('mexico-vs-eeuu-historia'), footerES, 'es_ES', '/es/learn/', 'Aprender', relES, '🏆 ⚔️ MÉXICO vs EE.UU.')
]);

out.push(['es/learn/concacaf-mundial-2026',
  wrap('es', 'concacaf-mundial-2026',
    'CONCACAF en el Mundial 2026 — equipos clasificados de Norteamérica y Caribe | Statedoku',
    'Equipos de CONCACAF clasificados al Mundial 2026: México, EE.UU., Canadá (anfitriones) + otros que se clasificaron vía eliminatorias. Costa Rica, Honduras, Jamaica, Panamá.',
    'concacaf mundial 2026, equipos concacaf mundial 2026, costa rica mundial 2026, honduras mundial 2026, jamaica panama',
    "CONCACAF en el Mundial 2026",
    "México, EE.UU., Canadá (anfitriones) + qué otros equipos de CONCACAF se clasificaron.",
    `    <p>La <strong>CONCACAF</strong> (Confederación de Norteamérica, Centroamérica y el Caribe) tiene <strong>6 cupos directos</strong> en el Mundial 2026 (más 2 vía repechaje), incluyendo a los <strong>3 países anfitriones</strong>.</p>

    <h2>Los 3 anfitriones (clasificación automática)</h2>

    <h3>🇲🇽 México</h3>
    <p>17 Mundiales jugados. Mejor resultado: Cuartos de Final 1970 y 1986 (como anfitrión). Coorganiza 2026.</p>

    <h3>🇺🇸 Estados Unidos (USMNT)</h3>
    <p>11 Mundiales jugados. Mejor resultado: 3er lugar en 1930 (primer Mundial). Coorganiza 2026.</p>

    <h3>🇨🇦 Canadá</h3>
    <p>Segundo Mundial de Canadá (primero fue 1986). Bajo Jesse Marsch. Coorganiza 2026.</p>

    <h2>Equipos CONCACAF clasificados (vía eliminatorias)</h2>

    <h3>🇨🇷 Costa Rica</h3>
    <p>6 Mundiales jugados. Mejor resultado: Cuartos de Final 2014 (eliminado por Países Bajos en penales). Generación dorada nueva con Manfred Ugalde y Jewison Bennette.</p>

    <h3>🇭🇳 Honduras</h3>
    <p>3 Mundiales jugados. Mejor resultado: Eliminatorias clasificación. Romell Quioto + Anthony Lozano lideran el ataque.</p>

    <h3>🇯🇲 Jamaica</h3>
    <p>2 Mundiales jugados (1998, 2026). El "Reggae Boyz" regresan tras 28 años. Leon Bailey + Demarai Gray lideran.</p>

    <h3>🇵🇦 Panamá</h3>
    <p>2 Mundiales jugados (2018, 2026). Generación nueva tras el icónico Mundial de 2018.</p>

    <h2>Diáspora CONCACAF en EE.UU.</h2>
    <p>Casi todos los países CONCACAF tienen grandes comunidades en EE.UU.:</p>
    <ul>
      <li><strong>Mexicanos:</strong> ~37 millones</li>
      <li><strong>Cubanos:</strong> ~2.3 millones (Miami)</li>
      <li><strong>Dominicanos:</strong> ~2 millones (NY)</li>
      <li><strong>Salvadoreños:</strong> ~2.5 millones (LA, NJ, Texas)</li>
      <li><strong>Guatemaltecos:</strong> ~1.6 millones (LA, NY)</li>
      <li><strong>Hondureños:</strong> ~1 millón (Texas, NY, Florida)</li>
      <li><strong>Jamaicanos:</strong> ~700,000 (NY, Florida)</li>
      <li><strong>Costarricenses:</strong> ~200,000 (California, Florida)</li>
      <li><strong>Panameños:</strong> ~200,000 (NY, Florida)</li>
    </ul>

    <h2>¿Por qué tantos cupos para CONCACAF en 2026?</h2>
    <p>El Mundial pasó de 32 a 48 equipos. CONCACAF pasó de 3.5 cupos a 6.5 cupos. La región es la sede del torneo y FIFA quería mayor representación local.</p>

    <h2>Las eliminatorias 2026</h2>
    <p>Las eliminatorias CONCACAF 2026 se jugaron 2023-2025 sin EE.UU., México, Canadá (anfitriones ya clasificados). Las eliminatorias se organizaron en grupos y la fase final clasificó a los equipos al Mundial.</p>

    <div class="cta-card">
      <h3>Aprende los estados sede jugando</h3>
      <p>Statedoku usa "Sede del Mundial 2026" como pista.</p>
      <a href="/es/">Jugar el puzzle de hoy →</a>
    </div>

    <h2>Preguntas frecuentes</h2>
    <details><summary><strong>¿Cuántos equipos de CONCACAF están en el Mundial 2026?</strong></summary><p>6 directamente: los 3 anfitriones (México, EE.UU., Canadá) + 3 vía eliminatorias (Costa Rica, Honduras, Jamaica, Panamá u otros).</p></details>
    <details><summary><strong>¿Qué países CONCACAF tienen más Mundiales?</strong></summary><p>México (17), Estados Unidos (11), Costa Rica (6), Honduras (3), Jamaica (2), Panamá (2).</p></details>
    <details><summary><strong>¿Cuál es el mejor resultado de CONCACAF en Mundiales?</strong></summary><p>Estados Unidos llegó al 3er lugar en 1930 (primer Mundial). Más recientemente: Costa Rica a Cuartos de Final 2014.</p></details>
`,
    faq([
      ['¿Cuántos equipos CONCACAF están en el Mundial 2026?', '6 equipos directamente: los 3 anfitriones (México, EE.UU., Canadá) + 3 más vía eliminatorias (Costa Rica, Honduras, Jamaica y Panamá entre los clasificados).'],
      ['¿Qué países de CONCACAF han ganado el Mundial?', 'Ninguno. El mejor resultado de la CONCACAF en Mundiales fue el 3er lugar de Estados Unidos en 1930 (primer Mundial).'],
      ['¿Por qué CONCACAF tiene más cupos en 2026?', 'El Mundial pasó de 32 a 48 equipos. CONCACAF pasó de 3.5 cupos a 6.5 cupos. La región es sede del torneo.'],
      ['¿Quién tiene más Mundiales en CONCACAF?', 'México con 17 participaciones, seguido de Estados Unidos con 11. Costa Rica tiene 6 Mundiales.'],
    ]),
    bcES('concacaf-mundial-2026','CONCACAF Mundial 2026'), hreflangES('concacaf-mundial-2026'), footerES, 'es_ES', '/es/learn/', 'Aprender', relES, '🏆 ⚽ CONCACAF MUNDIAL 2026')
]);

out.push(['es/learn/precio-hoteles-mundial-2026',
  wrap('es', 'precio-hoteles-mundial-2026',
    'Precio de hoteles del Mundial 2026 — qué esperar en cada ciudad sede | Statedoku',
    'Precios de hoteles para el Mundial 2026 en cada ciudad sede de EE.UU. NYC $400-1500/noche. Miami $350-1200. LA $300-900. Cómo ahorrar, cuándo reservar.',
    'precio hoteles mundial 2026, hoteles mundial 2026 nyc miami la, donde dormir mundial 2026, alojamiento mundial 2026',
    "Precio de hoteles del Mundial 2026",
    "Qué cuestan los hoteles en cada ciudad sede. Cómo ahorrar.",
    `    <p>Los precios de hoteles durante el <strong>Mundial 2026 FIFA</strong> subirán dramáticamente en NYC, LA y Miami. Aquí está la guía completa para cada ciudad sede.</p>

    <h2>Precios promedio por ciudad sede (fechas pico)</h2>
    <table class="lt">
      <thead><tr><th>Ciudad</th><th>Económico</th><th>Medio</th><th>Premium</th></tr></thead>
      <tbody>
        <tr><td><strong>NYC / NJ (Final)</strong></td><td>$300-450</td><td>$500-900</td><td>$1,000-2,500</td></tr>
        <tr><td><strong>Miami</strong></td><td>$280-400</td><td>$450-800</td><td>$900-1,800</td></tr>
        <tr><td><strong>Los Ángeles</strong></td><td>$220-350</td><td>$400-700</td><td>$800-1,500</td></tr>
        <tr><td><strong>SF Bay</strong></td><td>$280-400</td><td>$450-750</td><td>$800-1,400</td></tr>
        <tr><td><strong>Boston</strong></td><td>$250-380</td><td>$420-680</td><td>$700-1,200</td></tr>
        <tr><td><strong>Philadelphia</strong></td><td>$200-300</td><td>$330-550</td><td>$600-1,000</td></tr>
        <tr><td><strong>Atlanta</strong></td><td>$180-280</td><td>$300-500</td><td>$550-900</td></tr>
        <tr><td><strong>Seattle</strong></td><td>$220-340</td><td>$370-620</td><td>$680-1,100</td></tr>
        <tr><td><strong>Dallas</strong></td><td>$170-260</td><td>$280-460</td><td>$520-850</td></tr>
        <tr><td><strong>Houston</strong></td><td>$160-250</td><td>$270-440</td><td>$500-800</td></tr>
        <tr><td><strong>Kansas City</strong></td><td>$150-230</td><td>$250-400</td><td>$450-720</td></tr>
      </tbody>
    </table>
    <p><em>Todos los precios en USD por noche. Suben en partidos del USMNT y la semana de la Final (14-19 julio).</em></p>

    <h2>Estrategias para ahorrar</h2>

    <h3>1. Reserva YA</h3>
    <p>Los precios suben conforme se acerca el Mundial. Reservar hoy = 20-40% menos que reservar en 3 meses. La mayoría tiene cancelación gratis hasta 24-48h antes.</p>

    <h3>2. Quédate fuera del centro</h3>
    <ul>
      <li><strong>NYC:</strong> Brooklyn, Queens o Jersey City — 30-50% más barato.</li>
      <li><strong>LA:</strong> Burbank o Pasadena — 40% más barato.</li>
      <li><strong>Miami:</strong> Aventura, Brickell o Doral — 30-40% más barato.</li>
      <li><strong>SF Bay:</strong> Oakland o Berkeley — 40% más barato.</li>
    </ul>

    <h3>3. Usa rentas vacacionales (Airbnb, VRBO)</h3>
    <p>Más barato para grupos de 4-6 personas. Ahorro 30-50% vs hoteles equivalentes. Desventaja: menos servicios.</p>

    <h3>4. Evita la semana de la Final</h3>
    <p>14-19 julio 2026 tiene los precios más altos. 2-3x más caros que partidos de fase de grupos.</p>

    <h2>Para latinoamericanos viajando</h2>
    <p>Comunidades hispanas grandes en cada ciudad sede ofrecen:</p>
    <ul>
      <li>Comida latinoamericana auténtica</li>
      <li>Apoyo en español</li>
      <li>Hoteles operados por latinos a menudo más baratos</li>
      <li>Recomendaciones de bares deportivos donde otros latinos van a ver el Mundial</li>
    </ul>

    <h2>Costos ocultos a presupuestar</h2>
    <ul>
      <li>Tarifa de resort: $30-50/noche (no incluida en el precio publicado)</li>
      <li>Estacionamiento: $50-90/noche en NYC, LA, Miami</li>
      <li>Wi-Fi: rara vez gratis en hoteles premium ($15-25/día)</li>
      <li>Impuesto: 14-17% sobre la tarifa</li>
    </ul>

    <div class="cta-card">
      <h3>Aprende los estados sede jugando</h3>
      <p>Statedoku usa "Sede del Mundial 2026" como pista.</p>
      <a href="/es/">Jugar el puzzle de hoy →</a>
    </div>

    <h2>Preguntas frecuentes</h2>
    <details><summary><strong>¿Cuánto cuesta un hotel en NYC durante el Mundial?</strong></summary><p>Económico: $300-450/noche. Medio: $500-900. Premium: $1,000-2,500. Mas alto en la semana de la Final.</p></details>
    <details><summary><strong>¿Cuál es la ciudad sede más barata?</strong></summary><p>Kansas City, Houston, Dallas y Atlanta — hoteles económicos bajo $250/noche.</p></details>
    <details><summary><strong>¿Cuándo debo reservar?</strong></summary><p>YA. Los precios suben conforme se acerca el Mundial. La mayoría ofrece cancelación gratis 24-48h antes.</p></details>
`,
    faq([
      ['¿Cuánto cuestan los hoteles en NYC para el Mundial 2026?', 'NYC tendrá hoteles económicos a $300-450/noche, medios a $500-900, premium a $1,000-2,500. Los precios más altos serán durante la semana de la Final (14-19 julio).'],
      ['¿Cuál es la ciudad sede más barata para alojamiento?', 'Kansas City, Houston, Dallas y Atlanta — con hoteles económicos bajo $250/noche.'],
      ['¿Cuándo debo reservar un hotel para el Mundial 2026?', 'Lo más pronto posible. Los precios suben conforme se acerca el torneo. La mayoría de hoteles ofrecen cancelación gratis 24-48 horas antes.'],
      ['¿Conviene Airbnb sobre hotel para el Mundial?', 'Para grupos de 4-6 personas, sí. Ahorro 30-50% vs hoteles equivalentes. Desventaja: menos servicios.'],
    ]),
    bcES('precio-hoteles-mundial-2026','Precios de hoteles'), hreflangES('precio-hoteles-mundial-2026'), footerES, 'es_ES', '/es/learn/', 'Aprender', relES, '🏆 🏨 PRECIOS HOTELES')
]);

out.push(['es/learn/mundial-2026-grupos',
  wrap('es', 'mundial-2026-grupos',
    'Grupos del Mundial 2026 — los 12 grupos de 48 equipos | Statedoku',
    'Los 12 grupos del Mundial 2026 con 48 equipos. Cómo funciona la nueva fase de grupos, qué equipos pasarán a Octavos. Formato R32 explicado.',
    'grupos mundial 2026, fase de grupos mundial 2026, grupo a mundial 2026, grupo mexico mundial 2026',
    "Grupos del Mundial 2026",
    "12 grupos de 4 equipos. Cómo funciona la nueva fase de grupos.",
    `    <p>El <strong>Mundial 2026 FIFA</strong> tiene un nuevo formato: <strong>48 equipos divididos en 12 grupos de 4</strong>. Aquí cómo funciona.</p>

    <h2>El nuevo formato</h2>
    <ul>
      <li><strong>48 equipos</strong> (vs 32 en Qatar 2022)</li>
      <li><strong>12 grupos de 4</strong> (Grupo A hasta Grupo L)</li>
      <li><strong>3 partidos por equipo</strong> en fase de grupos</li>
      <li><strong>Top 2 de cada grupo + 8 mejores 3eros lugares</strong> pasan a Octavos (32 equipos total)</li>
      <li>Esto significa que un 3er lugar de grupo PUEDE pasar a la siguiente ronda (en Qatar 2022 con 32 equipos solo pasaban los 2 primeros)</li>
    </ul>

    <h2>Composición de grupos</h2>
    <p>FIFA divide los 48 equipos en 4 bombos según el ranking FIFA:</p>
    <ul>
      <li><strong>Bombo 1:</strong> Los 3 países anfitriones (USA, México, Canadá) + las 9 selecciones mejor rankeadas</li>
      <li><strong>Bombo 2:</strong> Las 12 siguientes mejor rankeadas</li>
      <li><strong>Bombo 3:</strong> Las 12 siguientes</li>
      <li><strong>Bombo 4:</strong> Las 12 con menor ranking</li>
    </ul>
    <p>Cada grupo recibe 1 equipo de cada bombo. Los anfitriones siempre van en grupos diferentes para evitar enfrentamientos en fase de grupos.</p>

    <h2>El sorteo</h2>
    <p>El sorteo del Mundial 2026 se realizó en 2025 en un evento televisado mundialmente desde Las Vegas. Las pelotas FIFA seleccionan los grupos en orden con restricciones de continente (mínimo 1 africano por grupo, no 2 europeos en el mismo grupo, etc.).</p>

    <h2>Posibles grupos clave (especulativo)</h2>

    <h3>El "Grupo de la Muerte"</h3>
    <p>Cada Mundial tiene un grupo con 3-4 candidatos a campeón. En 2026 podría ser un grupo con Brasil + Italia + Portugal + un equipo africano fuerte como Marruecos o Senegal.</p>

    <h3>El "Grupo de los anfitriones"</h3>
    <p>México juega en el Grupo A, EE.UU. en el Grupo D, Canadá en el Grupo B (la asignación oficial se confirmará en el sorteo).</p>

    <h2>El nuevo Tour des 32 (R32)</h2>
    <p>Con 32 equipos en eliminación directa, FIFA agregó el <strong>Tour des 32</strong> — una ronda nueva entre la fase de grupos y los Octavos. Primer Mundial en tener esto.</p>

    <h2>Cómo avanzan los equipos</h2>
    <ol>
      <li><strong>Fase de grupos (11 jun-27 jun):</strong> 3 partidos por equipo, top 2 + mejores 8 terceros lugares avanzan</li>
      <li><strong>R32 (28 jun-3 jul):</strong> 32 equipos juegan 16 partidos eliminatorios</li>
      <li><strong>Octavos (4-7 jul):</strong> 16 equipos juegan 8 partidos</li>
      <li><strong>Cuartos (9-11 jul):</strong> 8 equipos juegan 4 partidos</li>
      <li><strong>Semifinales (14-15 jul):</strong> 4 equipos juegan 2 partidos</li>
      <li><strong>3er lugar (18 jul):</strong> partido por la bronce</li>
      <li><strong>FINAL (19 jul):</strong> MetLife Stadium, NJ</li>
    </ol>

    <h2>Calendario de fase de grupos</h2>
    <p>72 partidos en 17 días. Aprox 4-5 partidos por día durante la fase de grupos.</p>

    <div class="cta-card">
      <h3>Aprende los estados sede jugando</h3>
      <p>Statedoku usa "Sede del Mundial 2026" como pista.</p>
      <a href="/es/">Jugar el puzzle de hoy →</a>
    </div>

    <h2>Preguntas frecuentes</h2>
    <details><summary><strong>¿Cuántos grupos tiene el Mundial 2026?</strong></summary><p>12 grupos (A-L) de 4 equipos cada uno = 48 equipos en total. Es el primer Mundial con este formato.</p></details>
    <details><summary><strong>¿Cuántos equipos pasan a Octavos?</strong></summary><p>32 equipos: 24 (top 2 de cada grupo) + 8 mejores 3eros lugares.</p></details>
    <details><summary><strong>¿Cuándo es el sorteo del Mundial 2026?</strong></summary><p>El sorteo se realizó en 2025 en Las Vegas en un evento televisado mundialmente.</p></details>
    <details><summary><strong>¿Qué es el Tour des 32?</strong></summary><p>Una nueva ronda eliminatoria agregada entre fase de grupos y Octavos. Primer Mundial con esta ronda. 32 equipos → 16.</p></details>
`,
    faq([
      ['¿Cuántos grupos tiene el Mundial 2026?', 'Tiene 12 grupos (A-L) de 4 equipos cada uno = 48 equipos en total. Es el primer Mundial con este formato.'],
      ['¿Cuántos equipos pasan de la fase de grupos a Octavos?', '32 equipos avanzan: 24 (los top 2 de cada grupo) + los 8 mejores terceros lugares.'],
      ['¿Cuándo se realizó el sorteo del Mundial 2026?', 'El sorteo se realizó en 2025 en Las Vegas en un evento televisado mundialmente.'],
      ['¿Qué es el Tour des 32 en el Mundial 2026?', 'Una nueva ronda eliminatoria agregada entre la fase de grupos y los Octavos de Final. Es el primer Mundial con esta ronda. Pasan 32 equipos → 16.'],
    ]),
    bcES('mundial-2026-grupos','Grupos del Mundial 2026'), hreflangES('mundial-2026-grupos'), footerES, 'es_ES', '/es/learn/', 'Aprender', relES, '🏆 📋 GRUPOS MUNDIAL 2026')
]);

// ═════════════════════════════════════════════════════════════════════════
// FR — 11 articles
// ═════════════════════════════════════════════════════════════════════════

const frTeams = [
  {slug:'maroc-coupe-du-monde-2026', name:'Maroc', flag:'🇲🇦',
   titles:0, lastTitle:'jamais (4e en 2022 — historique)',
   stars:'Achraf Hakimi, Hakim Ziyech, Bilal El Khannouss, Brahim Díaz, Sofyan Amrabat',
   coach:'Walid Regragui',
   note:'Première équipe africaine en demi-finale de Coupe du Monde (Qatar 2022). Maroc co-organise le Mondial 2030 avec l\'Espagne et le Portugal. 2026 est la préparation pour ce rôle plus grand.',
   diaspora:'~700 000 Maghrébins en France. Grande communauté marocaine en Europe.'},
  {slug:'senegal-coupe-du-monde-2026', name:'Sénégal', flag:'🇸🇳',
   titles:0, lastTitle:'jamais (8e en 2022)',
   stars:'Sadio Mané, Krépin Diatta, Pape Gueye, Iliman Ndiaye, Ismaila Sarr',
   coach:'Aliou Cissé',
   note:'Champion de la CAN 2022. Sénégal compte parmi les sélections africaines les plus fortes. Sadio Mané reste l\'icône du foot sénégalais.',
   diaspora:'~50 000 Sénégalais en France. Bordeaux, Paris, Marseille.'},
  {slug:'suisse-coupe-du-monde-2026', name:'Suisse', flag:'🇨🇭',
   titles:0, lastTitle:'jamais (cab 1934, 1938, 1954)',
   stars:'Granit Xhaka, Manuel Akanji, Yann Sommer, Breel Embolo, Renato Steffen',
   coach:'Murat Yakin',
   note:'Suisse a participé à 11 Coupes du Monde. Elle a impressionné en Qatar 2022 (Round of 16). Génération solide mais sans star mondiale.',
   diaspora:'Communauté suisse aux USA: ~70 000. Concentration en Californie.'},
  {slug:'canada-coupe-du-monde-2026', name:'Canada', flag:'🇨🇦',
   titles:0, lastTitle:'jamais (2e Mondial seulement, premier 1986)',
   stars:'Alphonso Davies, Jonathan David, Tajon Buchanan, Cyle Larin, Steven Vitória',
   coach:'Jesse Marsch',
   note:'Co-hôte. Seulement 2e Mondial de l\'histoire canadienne (premier 1986). L\'objectif est de passer la phase de groupes — exploit historique.',
   diaspora:'~1 million de Canadiens vivant à l\'étranger.'},
];

for(const t of frTeams){
  const body = `    <p>${t.flag} L'équipe nationale du <strong>${t.name}</strong> participera à la <strong>Coupe du Monde 2026</strong> co-organisée par les USA, le Canada et le Mexique du <strong>11 juin au 19 juillet 2026</strong>.</p>

    <div class="wc-quick">
      <dl>
        <dt>Titres mondiaux</dt><dd>${t.titles} (${t.titles===0?'meilleur résultat':'dernier'}: ${t.lastTitle})</dd>
        <dt>Sélectionneur</dt><dd>${t.coach}</dd>
        <dt>Joueurs clés</dt><dd>${t.stars}</dd>
      </dl>
    </div>

    <h2>${t.name} au Mondial 2026</h2>
    <p>${t.note}</p>

    <h2>L'effectif</h2>
    <p>${t.stars} sont les piliers de la sélection. ${t.coach} est le maître à penser tactique.</p>

    <h2>Diaspora francophone</h2>
    <p>${t.diaspora}</p>

    ${t.slug==='maroc-coupe-du-monde-2026' ? '<h2>L\'histoire à écrire</h2><p>Après l\'exploit historique en Qatar 2022 (4e place — première équipe africaine en demi-finale), Maroc cherche à confirmer en 2026. La présence francophone marocaine en Europe et en Amérique du Nord crée un soutien massif.</p>' : ''}
    ${t.slug==='senegal-coupe-du-monde-2026' ? '<h2>Sadio Mané, dernier grand tournoi ?</h2><p>Mané aura 34 ans pendant le Mondial 2026. Sa dernière chance peut-être de briller sur la scène mondiale. Le Sénégal est l\'une des sélections africaines les plus suivies grâce à sa génération dorée.</p>' : ''}
    ${t.slug==='canada-coupe-du-monde-2026' ? '<h2>Le facteur hôte</h2><p>Canada bénéficie de l\'avantage du terrain. Toutes les matchs de groupe au Canada (BMO Field Toronto, BC Place Vancouver). Alphonso Davies (Bayern Munich) est la star, Jonathan David (Lille) le buteur.</p>' : ''}

    <h2>Où jouera ${t.name}</h2>
    <p>L'attribution des matchs dépend du tirage FIFA. Consultez les <a href="/fr/learn/coupe-du-monde-2026-villes-usa/">11 villes hôtes aux USA</a>.</p>

    <h2>Comment suivre les matchs depuis la France</h2>
    <ul>
      <li>TF1 + M6 (grandes affiches)</li>
      <li>beIN Sports (tous les matchs)</li>
      <li>FIFA+ app (streaming officiel)</li>
    </ul>

    <div class="cta-card">
      <h3>Apprenez les États hôtes en jouant</h3>
      <p>Statedoku utilise des indices Mondial 2026 dans son puzzle quotidien.</p>
      <a href="/fr/">Jouer le puzzle du jour →</a>
    </div>

    <h2>Questions fréquentes</h2>
    <details><summary><strong>${t.name} est-il qualifié pour le Mondial 2026 ?</strong></summary><p>Oui, ${t.name} est qualifié.</p></details>
    <details><summary><strong>Combien de Coupes du Monde ${t.name} a-t-il gagné ?</strong></summary><p>${t.titles} titre${t.titles!==1?'s':''}. ${t.titles>0?'Dernier: '+t.lastTitle+'.':'Meilleur: '+t.lastTitle+'.'}</p></details>
    <details><summary><strong>Qui est le sélectionneur de ${t.name} ?</strong></summary><p>${t.coach}.</p></details>
`;
  out.push([`fr/learn/${t.slug}`,
    wrap('fr', t.slug,
      `${t.name} à la Coupe du Monde 2026 — effectif, calendrier | Statedoku`,
      `${t.flag} ${t.name} à la Coupe du Monde 2026 FIFA. ${t.titles} titre${t.titles!==1?'s':''}. ${t.coach} sélectionneur. ${t.stars.split(',')[0]} en pointe.`,
      `${t.name.toLowerCase()} coupe du monde 2026, ${t.name.toLowerCase()} mondial 2026`,
      `${t.flag} ${t.name} à la Coupe du Monde 2026`,
      `${t.titles} titre${t.titles!==1?'s':''}. ${t.coach} sélectionneur. ${t.stars.split(',')[0]} en pointe.`,
      body,
      faq([
        [t.name + ' est-il qualifié pour la Coupe du Monde 2026 ?', 'Oui, ' + t.name + ' est qualifié pour le Mondial 2026 FIFA aux USA, Canada et Mexique.'],
        ['Combien de Coupes du Monde ' + t.name + ' a-t-il gagné ?', t.name + ' a gagné ' + t.titles + ' Coupe' + (t.titles !== 1 ? 's' : '') + ' du Monde. ' + (t.titles > 0 ? 'Dernier titre: '+t.lastTitle+'.' : 'Meilleur résultat: '+t.lastTitle+'.')],
        ['Qui est le sélectionneur de ' + t.name + ' au Mondial 2026 ?', t.coach+'.'],
        ['Faut-il un visa pour voyager aux USA depuis ' + (t.slug.includes('maroc')?'le Maroc':t.slug.includes('senegal')?'le Sénégal':t.slug.includes('suisse')?'la Suisse':'le Canada') + ' ?', t.slug.includes('canada')?'Non, les Canadiens n\'ont pas besoin de visa pour les USA.':t.slug.includes('suisse')?'Non, visa Waiver via ESTA (~21 €).':'Oui, visa B1/B2 nécessaire. Délai: 8-15 mois selon le consulat.'],
      ]),
      bcFR(t.slug, t.name+' Mondial 2026'), hreflangFR(t.slug), footerFR, 'fr_FR', '/fr/learn/', 'Apprendre', relFR, `🏆 ${t.flag} MONDIAL 2026`)
  ]);
}

// FR PLAYERS — 3
const frPlayers = [
  {slug:'bellingham-coupe-du-monde-2026', name:'Jude Bellingham', country:'Angleterre', flag:'🏴󠁧󠁢󠁥󠁮󠁧󠁿',
   age:'22', club:'Real Madrid', wc:'1', wcWon:'0',
   note:"Bellingham à 22 ans entre dans son deuxième Mondial comme joueur le plus influent de l'Angleterre. Vainqueur Ligue des Champions 2024. Probable co-capitaine avec Harry Kane.",
   chip:'🏆 🏴󠁧󠁢󠁥󠁮󠁧󠁿 BELLINGHAM MONDIAL 2026'},
  {slug:'foden-coupe-du-monde-2026', name:'Phil Foden', country:'Angleterre', flag:'🏴󠁧󠁢󠁥󠁮󠁧󠁿',
   age:'26', club:'Manchester City', wc:'1', wcWon:'0',
   note:"Foden, le génie créatif anglais. Vainqueur de la Premier League à plusieurs reprises avec City. À 26 ans, il entre dans son deuxième Mondial à son apogée tactique.",
   chip:'🏆 🏴󠁧󠁢󠁥󠁮󠁧󠁿 FODEN MONDIAL 2026'},
  {slug:'modric-coupe-du-monde-2026', name:'Luka Modrić', country:'Croatie', flag:'🇭🇷',
   age:'40', club:'AC Milan', wc:'5', wcWon:'0',
   note:"Modrić aura 40 ans pendant le Mondial 2026 — sa 6e Coupe du Monde. Légende vivante. Ballon d'Or 2018. Finaliste 2018, 3e en 2022. La Croatie reste un challenger sérieux malgré le vieillissement de Modrić.",
   chip:'🏆 🇭🇷 MODRIĆ MONDIAL 2026'},
];

for(const p of frPlayers){
  const body = `    <p>${p.flag} <strong>${p.name}</strong> est l'une des stars de la <strong>Coupe du Monde 2026 FIFA</strong>. À ${p.age} ans, il joue pour ${p.club} et représente ${p.country}.</p>

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
    <p>Consultez les <a href="/fr/learn/coupe-du-monde-2026-villes-usa/">11 villes hôtes</a>.</p>

    <div class="cta-card">
      <h3>Apprenez les États hôtes en jouant</h3>
      <a href="/fr/">Jouer le puzzle du jour →</a>
    </div>

    <h2>Questions fréquentes</h2>
    <details><summary><strong>${p.name} jouera-t-il au Mondial 2026 ?</strong></summary><p>${p.country} est qualifié. ${p.name} est attendu dans l'effectif.</p></details>
    <details><summary><strong>Quel âge a ${p.name} pendant le Mondial 2026 ?</strong></summary><p>${p.age} ans.</p></details>
    <details><summary><strong>Pour quel club joue ${p.name} ?</strong></summary><p>${p.club}.</p></details>
`;
  out.push([`fr/learn/${p.slug}`,
    wrap('fr', p.slug,
      `${p.name} à la Coupe du Monde 2026 — âge, club, palmarès | Statedoku`,
      `${p.flag} ${p.name} à la Coupe du Monde 2026 FIFA. ${p.age} ans, ${p.club}, ${p.country}.`,
      `${p.name.toLowerCase()} coupe du monde 2026, ${p.name.toLowerCase()} mondial 2026`,
      `${p.flag} ${p.name} à la Coupe du Monde 2026`, `${p.country} · ${p.age} ans · ${p.club}.`, body,
      faq([
        [p.name + ' jouera-t-il à la Coupe du Monde 2026 ?', p.country + ' est qualifié pour la Coupe du Monde 2026 FIFA. ' + p.name + ' est attendu dans l\'effectif.'],
        ['Quel âge a ' + p.name + ' pendant la Coupe du Monde 2026 ?', p.age + ' ans pendant le tournoi.'],
        ['Pour quel club joue ' + p.name + ' ?', p.club+'.'],
      ]),
      bcFR(p.slug, p.name), hreflangFR(p.slug), footerFR, 'fr_FR', '/fr/learn/', 'Apprendre', relFR, p.chip)
  ]);
}

// FR STADIUM + VOYAGE — 4
out.push(['fr/learn/metlife-stadium-guide-mondial-2026',
  wrap('fr', 'metlife-stadium-guide-mondial-2026',
    'MetLife Stadium — guide pour les supporters français au Mondial 2026 | Statedoku',
    'Guide complet du MetLife Stadium (New Jersey) pour les supporters français. Comment y aller depuis Manhattan, hôtels, billetterie, restaurants.',
    'metlife stadium guide francais, mondial 2026 metlife, finale mondial 2026 metlife, hotels metlife stadium',
    "MetLife Stadium — guide pour les supporters français",
    "Où se trouve la finale du Mondial 2026 et comment s'y rendre.",
    `    <p>Le <strong>MetLife Stadium</strong> à East Rutherford, New Jersey, accueille la <strong>finale de la Coupe du Monde 2026</strong> le 19 juillet 2026, plus 7 autres matchs. Capacité 82 500 — le plus grand stade hôte des USA.</p>

    <div class="wc-quick">
      <dl>
        <dt>Adresse</dt><dd>1 MetLife Stadium Dr, East Rutherford, NJ</dd>
        <dt>Capacité</dt><dd>82 500 (plus grand stade WC US)</dd>
        <dt>Matchs WC</dt><dd>8 (dont la FINALE)</dd>
        <dt>Ouvert en</dt><dd>2010</dd>
      </dl>
    </div>

    <h2>Comment y aller depuis Manhattan</h2>
    <p><strong>NJ Transit Meadowlands Rail Line :</strong> depuis Penn Station NYC, train direct jusqu'à la station "Meadowlands Sports Complex". 15 minutes, 5,25 USD. Trains toutes les 15 min les jours de match.</p>

    <h2>Comment y aller depuis Newark Airport (EWR)</h2>
    <p>30 min en train NJ Transit. 25 min en Uber/Lyft (35-60 USD).</p>

    <h2>Hôtels recommandés pour les français</h2>
    <h3>À NYC (mieux situé)</h3>
    <ul>
      <li><strong>Pod 51</strong> — Midtown East. 250-450 USD/nuit.</li>
      <li><strong>The Standard</strong> — Meatpacking. 600-1000 USD/nuit.</li>
      <li><strong>Hotel Edison</strong> — Times Square. 350-700 USD/nuit.</li>
    </ul>

    <h3>Près du stade (Carlstadt / East Rutherford)</h3>
    <ul>
      <li><strong>Sheraton Lincoln Harbor</strong> — Weehawken</li>
      <li><strong>Hampton Inn East Rutherford</strong> — à pied du stade</li>
    </ul>

    <h2>Restaurants français à Manhattan</h2>
    <ul>
      <li><strong>Buvette</strong> — West Village. Bistrot français.</li>
      <li><strong>Pastis</strong> — Meatpacking. Brasserie iconique.</li>
      <li><strong>Le Bilboquet</strong> — UES.</li>
      <li><strong>L'Express</strong> — Flatiron.</li>
    </ul>

    <h2>Communauté française à NYC</h2>
    <ul>
      <li><strong>~50 000 Français</strong> à NYC</li>
      <li>Lycée Français de New York (Upper East Side)</li>
      <li>French Institute Alliance Française</li>
      <li>FrenchTuesdays (events sociaux)</li>
    </ul>

    <h2>Fan zones pour les Français</h2>
    <ul>
      <li>Times Square — diffusion publique des grandes affiches</li>
      <li>Pier 17 (Seaport) — FIFA Fan Festival officiel</li>
      <li>French Embassy events à confirmer</li>
    </ul>

    <h2>Conseils pratiques pour les supporters français</h2>
    <ul>
      <li><strong>ESTA</strong> obligatoire (en ligne, ~21 €, 2 ans de validité)</li>
      <li><strong>Carte bancaire</strong> sans frais étrangers recommandée (Revolut, Boursorama)</li>
      <li><strong>Décalage horaire :</strong> Paris est +6h, donc 21h Paris = 15h NY</li>
      <li><strong>Pourboires :</strong> 18-20% obligatoires dans restaurants/bars/Uber</li>
      <li><strong>Eau :</strong> potable au robinet (pas besoin d'acheter)</li>
    </ul>

    <div class="cta-card">
      <h3>Apprenez les États hôtes en jouant</h3>
      <p>Si vous voyagez aux USA pour la Finale, apprenez les 50 États avec Statedoku.</p>
      <a href="/fr/">Jouer le puzzle du jour →</a>
    </div>

    <h2>Questions fréquentes</h2>
    <details><summary><strong>Comment aller au MetLife Stadium depuis Manhattan ?</strong></summary><p>NJ Transit Meadowlands Rail Line depuis Penn Station. 15 minutes, 5,25 USD. Trains toutes les 15 min.</p></details>
    <details><summary><strong>Où dormir pour la finale du Mondial 2026 ?</strong></summary><p>NYC offre le meilleur compromis. Hôtels près de Penn Station permettent un accès facile au train. Hôtels près du stade (Carlstadt) sont plus chers (350-800 USD/nuit).</p></details>
    <details><summary><strong>Quel décalage horaire France-MetLife ?</strong></summary><p>Paris est +6h. Match à 15h ET = 21h Paris. Idéal pour suivre depuis la France.</p></details>
`,
    faq([
      ['Comment aller au MetLife Stadium depuis Manhattan ?', 'NJ Transit Meadowlands Rail Line directe depuis Penn Station. 15 minutes, 5,25 USD. Trains toutes les 15 minutes les jours de match.'],
      ['Où séjourner pour la finale de la Coupe du Monde 2026 ?', 'NYC offre le meilleur compromis. Hôtels près de Penn Station permettent un accès facile au train. Hôtels près du stade (Carlstadt, East Rutherford) sont plus chers (350-800 USD/nuit) mais à pied.'],
      ['Quel est le décalage horaire France-MetLife Stadium ?', 'Paris est +6h. Match à 15h ET = 21h Paris. Idéal pour suivre depuis la France à une heure normale.'],
      ['Combien y a-t-il de Français à NYC ?', 'Environ 50 000 Français à NYC. Lycée Français de New York dans l\'Upper East Side. French Institute Alliance Française organise des events sociaux.'],
    ]),
    bcFR('metlife-stadium-guide-mondial-2026','MetLife Stadium guide'), hreflangFR('metlife-stadium-guide-mondial-2026'), footerFR, 'fr_FR', '/fr/learn/', 'Apprendre', relFR, '🏆 🏁 METLIFE STADIUM')
]);

out.push(['fr/learn/mondial-2026-budget-voyage',
  wrap('fr', 'mondial-2026-budget-voyage',
    'Budget voyage Mondial 2026 USA — combien prévoir pour 1 semaine | Statedoku',
    'Combien coûte un voyage au Mondial 2026 ? Détaillé : vols, hôtels, billets, repas, déplacements. Estimation 2 500-7 000 € pour 1 semaine. Comment optimiser.',
    'budget voyage mondial 2026, combien coute mondial 2026, voyage usa mondial 2026 prix, vol paris ny mondial 2026',
    "Budget voyage Mondial 2026 USA",
    "2 500-7 000 € pour 1 semaine. Détail des coûts et conseils.",
    `    <p>Combien coûte un voyage au <strong>Mondial 2026 FIFA</strong> pour un supporter français ? Voici le calcul complet pour 1 semaine aux USA.</p>

    <h2>Budget estimatif pour 1 semaine</h2>
    <table class="lt">
      <thead><tr><th>Niveau</th><th>Budget total</th></tr></thead>
      <tbody>
        <tr><td><strong>Economique</strong></td><td>2 500-3 500 €</td></tr>
        <tr><td><strong>Confort</strong></td><td>4 000-5 500 €</td></tr>
        <tr><td><strong>Premium</strong></td><td>6 500-10 000+ €</td></tr>
      </tbody>
    </table>

    <h2>Vol Paris → NYC (a-r)</h2>
    <ul>
      <li><strong>Économique :</strong> 600-900 € (réservation 2 mois avant)</li>
      <li><strong>Premium éco :</strong> 1 200-1 800 €</li>
      <li><strong>Business :</strong> 3 500-6 000 €</li>
    </ul>
    <p>Conseil : utilisez Google Flights, Skyscanner. Réservez tôt — les prix doublent à 1 mois du Mondial.</p>

    <h2>Hôtels (6 nuits)</h2>
    <p>NYC pendant le Mondial — prix par nuit :</p>
    <ul>
      <li><strong>Hostel/Pod :</strong> 150-250 €/nuit = 900-1 500 €</li>
      <li><strong>Hôtel mid-range :</strong> 250-400 €/nuit = 1 500-2 400 €</li>
      <li><strong>Hôtel premium :</strong> 500-800 €/nuit = 3 000-4 800 €</li>
    </ul>

    <h2>Billets de match</h2>
    <p>Hors revente :</p>
    <ul>
      <li><strong>Match phase de groupes :</strong> 60-300 €</li>
      <li><strong>Match Tour des 32 :</strong> 80-400 €</li>
      <li><strong>Match Octavos :</strong> 150-500 €</li>
      <li><strong>Match Quarts :</strong> 300-1 000 €</li>
      <li><strong>Match Demis :</strong> 500-2 500 €</li>
      <li><strong>FINALE :</strong> 1 000-6 000 €</li>
    </ul>
    <p>Pour un voyage 1 semaine : prévoir 1 à 3 matchs = 150-1 500 €.</p>

    <h2>Repas (6 jours)</h2>
    <ul>
      <li><strong>Pas cher :</strong> 25-40 €/repas × 3 = 75-120 €/jour = 450-720 €</li>
      <li><strong>Moyen :</strong> 40-70 €/repas = 120-210 €/jour = 720-1 260 €</li>
      <li><strong>Haut de gamme :</strong> 70-150 € = 210-450 € = 1 260-2 700 €</li>
    </ul>

    <h2>Déplacements (6 jours)</h2>
    <ul>
      <li><strong>Métro NYC :</strong> 3 USD/trajet = ~50 €</li>
      <li><strong>Uber/Lyft :</strong> 15-30 € par course = 100-300 €</li>
      <li><strong>NJ Transit (MetLife) :</strong> 10-20 € a-r</li>
      <li><strong>Voiture de location :</strong> 80-150 €/jour</li>
    </ul>

    <h2>Frais cachés</h2>
    <ul>
      <li><strong>ESTA :</strong> 21 €</li>
      <li><strong>Assurance voyage :</strong> 40-80 €</li>
      <li><strong>Frais bancaires étrangers :</strong> 10-50 €</li>
      <li><strong>Pourboires :</strong> 18-20% sur restaurants, bars, Uber, taxis</li>
      <li><strong>Souvenirs :</strong> 50-200 €</li>
    </ul>

    <h2>Comment économiser</h2>
    <ul>
      <li><strong>Réservez tôt</strong> (avion + hôtel) — 30-40% d'économies</li>
      <li><strong>Voyagez avec amis</strong> — partage Airbnb, taxi</li>
      <li><strong>Évitez la semaine de la Finale</strong> (14-19 juillet) — prix 2-3× plus chers</li>
      <li><strong>Mangez chez les food trucks</strong> (10-15 € le repas)</li>
      <li><strong>Utilisez le métro</strong> au lieu d'Uber</li>
      <li><strong>Ne dormez pas en plein centre</strong> de NYC — Brooklyn ou Queens 30-50% moins cher</li>
    </ul>

    <h2>Cartes bancaires recommandées</h2>
    <ul>
      <li><strong>Revolut</strong> (gratuit) — pas de frais étrangers</li>
      <li><strong>Boursorama Banque</strong> Premium — 1 retrait gratuit/mois</li>
      <li><strong>N26</strong> — gratuit, no frais étrangers</li>
    </ul>

    <div class="cta-card">
      <h3>Apprenez les États hôtes en jouant</h3>
      <p>Avant votre voyage, apprenez les 50 États avec Statedoku.</p>
      <a href="/fr/">Jouer le puzzle du jour →</a>
    </div>

    <h2>Questions fréquentes</h2>
    <details><summary><strong>Combien coûte un voyage de 1 semaine au Mondial 2026 ?</strong></summary><p>2 500-3 500 € en mode économique, 4 000-5 500 € en confort, 6 500-10 000+ € en premium.</p></details>
    <details><summary><strong>Combien coûte le vol Paris-NY pour le Mondial ?</strong></summary><p>600-900 € en économique (réserver 2 mois avant), 1 200-1 800 € en premium éco, 3 500+ € en business.</p></details>
    <details><summary><strong>Quels frais cachés prévoir ?</strong></summary><p>ESTA 21 €, assurance 40-80 €, pourboires 18-20% sur quasi tout aux USA, frais bancaires étrangers si pas de Revolut/N26.</p></details>
    <details><summary><strong>Comment économiser sur le voyage ?</strong></summary><p>Réservez avion + hôtel tôt (30-40% d'économies), évitez la semaine de la Finale, mangez au food trucks (10-15 €), utilisez le métro NYC (3 €/trajet vs 25-50 € Uber).</p></details>
`,
    faq([
      ['Combien coûte un voyage d\'une semaine au Mondial 2026 ?', 'Budget estimatif : 2 500-3 500 € en économique, 4 000-5 500 € en confort, 6 500-10 000+ € en premium. Inclut vol, hôtel, repas, 1-3 matchs, transport local.'],
      ['Combien coûte le vol Paris-New York pour le Mondial 2026 ?', '600-900 € en économique si réservé 2 mois avant. 1 200-1 800 € en premium éco. 3 500-6 000 € en business. Prix multiplié si dernière minute.'],
      ['Comment économiser sur le voyage au Mondial 2026 ?', 'Réservez avion + hôtel tôt (30-40% économies). Évitez la semaine de la Finale (14-19 juillet, prix 2-3× plus chers). Mangez au food trucks (10-15 €). Utilisez Revolut/N26 pour zéro frais bancaires étrangers.'],
      ['Quels frais cachés prévoir pour le Mondial 2026 ?', 'ESTA 21 €, assurance voyage 40-80 €, pourboires 18-20% obligatoires aux USA, frais bancaires étrangers si pas de carte Revolut/N26, souvenirs 50-200 €.'],
    ]),
    bcFR('mondial-2026-budget-voyage','Budget voyage'), hreflangFR('mondial-2026-budget-voyage'), footerFR, 'fr_FR', '/fr/learn/', 'Apprendre', relFR, '🏆 💸 BUDGET VOYAGE')
]);

// Write all
for(const [rel, html] of out){
  const dir = path.join(ROOT, rel);
  fs.mkdirSync(dir, {recursive:true});
  fs.writeFileSync(path.join(dir, 'index.html'), html);
  console.log(`✅ /${rel}/`);
}
console.log(`\n${out.length} articles WC batch 4 générés.`);
