#!/usr/bin/env node
const fs = require('fs');
const path = require('path');

const ROOT = path.resolve(__dirname, '..');
const states = JSON.parse(fs.readFileSync(path.join(ROOT, 'data/states.json'), 'utf8'));

const slugMap = {};
for (const s of states) slugMap[s.id] = s.names.en.toLowerCase().replace(/\s+/g, '-');

// Build dataset: state, capital, USPS, letter counts
const dataset = states.map(s => ({
  id: s.id,
  en: s.names.en,
  es: s.names.es,
  fr: s.names.fr,
  capital: s.capital,
  largest: s.largestCity || s.capital,
  stateLetters: s.names.en.replace(/\s+/g, '').length,
  stateLettersWithSpaces: s.names.en.length,
  capitalLetters: s.capital.replace(/\s+/g, '').length,
  capitalLettersWithSpaces: s.capital.length,
  esLetters: s.names.es.replace(/\s+/g, '').length,
}));

const dataJSON = JSON.stringify(dataset);

// =============================================================
// EN: /learn/crossword-helper/
// =============================================================
const enHTML = `<!DOCTYPE html>
<html lang="en">
<head>
  <meta charset="UTF-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0, viewport-fit=cover">
  <meta name="theme-color" content="#0F2147">
  <meta name="color-scheme" content="light">

  <title>US States Crossword Helper: State by Letters, Capital, Abbreviation | Statedoku</title>
  <meta name="description" content="Find any US state or capital by letter count for crosswords. Filter by letters, USPS code, or capital. 50 states, 50 capitals, all in one table.">
  <meta name="keywords" content="us state crossword helper, state with 4 letters, state capital crossword, us state abbreviation, crossword state names">
  <meta name="robots" content="index, follow, max-image-preview:large">

  <link rel="canonical" href="https://statedoku.com/learn/crossword-helper/">
  <link rel="alternate" hreflang="en" href="https://statedoku.com/learn/crossword-helper/">
  <link rel="alternate" hreflang="en-US" href="https://statedoku.com/learn/crossword-helper/">
  <link rel="alternate" hreflang="en-GB" href="https://statedoku.com/learn/crossword-helper/">
  <link rel="alternate" hreflang="en-IN" href="https://statedoku.com/learn/crossword-helper/">
  <link rel="alternate" hreflang="en-CA" href="https://statedoku.com/learn/crossword-helper/">
  <link rel="alternate" hreflang="en-AU" href="https://statedoku.com/learn/crossword-helper/">
  <link rel="alternate" hreflang="es" href="https://statedoku.com/es/learn/crucigrama-estados/">
  <link rel="alternate" hreflang="x-default" href="https://statedoku.com/learn/crossword-helper/">
  <link rel="icon" type="image/svg+xml" href="/favicon.svg?v=5">
  <link rel="stylesheet" href="/css/style.css?v=17">

  <meta property="og:type" content="article">
  <meta property="og:title" content="US States Crossword Helper — Find a state by letters">
  <meta property="og:description" content="Find any US state or capital by letter count for crosswords. Filter by letters, USPS code, or capital.">
  <meta property="og:url" content="https://statedoku.com/learn/crossword-helper/">
  <meta property="og:image" content="https://statedoku.com/og/og-learn-state-capitals.png">

  <style>
    .lt-hero { max-width: 720px; margin: 32px auto 12px; padding: 0 18px; text-align: center; }
    .lt-hero h1 { font-size: clamp(1.9rem, 5.5vw, 2.5rem); font-weight: 900; letter-spacing: -0.025em; margin: 0 0 10px; line-height: 1.15; }
    .lt-hero .sub { color: var(--text-2); font-size: 1rem; line-height: 1.55; }
    .lt-main { max-width: 860px; margin: 0 auto; padding: 18px 18px 60px; line-height: 1.65; color: var(--text); }
    .lt-main h2 { margin-top: 36px; margin-bottom: 12px; font-size: 1.3rem; font-weight: 800; letter-spacing: -0.015em; }
    .lt-main h3 { margin-top: 20px; margin-bottom: 8px; font-size: 1.02rem; font-weight: 700; color: var(--navy); }
    .filters { display: flex; flex-wrap: wrap; gap: 10px; padding: 14px; background: #F8FAFC; border-radius: 12px; margin: 14px 0; }
    .filters label { display: flex; flex-direction: column; gap: 4px; font-size: .82rem; font-weight: 700; color: var(--navy); text-transform: uppercase; letter-spacing: .03em; }
    .filters input, .filters select { padding: 8px 10px; border: 1px solid var(--border); border-radius: 8px; font-size: .95rem; background: #fff; min-width: 140px; font-family: inherit; }
    .filters .clear-btn { align-self: flex-end; padding: 8px 14px; border: none; background: var(--navy); color: #fff; border-radius: 8px; font-weight: 700; cursor: pointer; font-size: .9rem; }
    .filters .clear-btn:hover { background: var(--navy-soft); }
    table.lt { width: 100%; border-collapse: collapse; margin: 14px 0 22px; font-size: .92rem; }
    table.lt th, table.lt td { padding: 8px 10px; border-bottom: 1px solid var(--border); text-align: left; }
    table.lt th { background: #F1F5F9; font-weight: 700; color: var(--navy); font-size: .78rem; text-transform: uppercase; letter-spacing: .03em; cursor: pointer; user-select: none; }
    table.lt th:hover { background: #E2E8F0; }
    table.lt th.sort-asc::after { content: ' ▲'; font-size: .7rem; }
    table.lt th.sort-desc::after { content: ' ▼'; font-size: .7rem; }
    table.lt tr:hover { background: #FAFBFC; }
    table.lt a { color: var(--navy); font-weight: 700; text-decoration: none; }
    table.lt a:hover { text-decoration: underline; }
    table.lt td.num { text-align: center; font-variant-numeric: tabular-nums; font-weight: 700; }
    .no-match { padding: 30px; text-align: center; color: var(--text-3); font-style: italic; }
    .count-badge { display: inline-block; padding: 2px 8px; background: var(--gold); color: var(--navy); border-radius: 10px; font-weight: 800; font-size: .85rem; margin-left: 6px; }
    .tip { background: #FFF7ED; border-left: 3px solid var(--gold); padding: 10px 14px; border-radius: 0 8px 8px 0; margin: 14px 0; font-size: .93rem; }
    .cta-card { background: linear-gradient(135deg, var(--navy), var(--navy-soft)); color: #fff; padding: 22px; border-radius: 14px; margin: 28px 0; text-align: center; }
    .cta-card h3 { color: #fff; margin: 0 0 8px; }
    .cta-card p { margin: 0 0 12px; color: rgba(255,255,255,0.85); }
    .cta-card a { display: inline-block; background: var(--gold); color: var(--navy); padding: 10px 22px; border-radius: 999px; font-weight: 800; text-decoration: none; font-size: .92rem; }
    .related-grid { display: grid; grid-template-columns: repeat(auto-fit, minmax(220px, 1fr)); gap: 8px; margin: 14px 0; }
    .related-grid a { display: block; padding: 10px 12px; border: 1px solid var(--border); border-radius: 8px; color: var(--navy); text-decoration: none; font-weight: 600; font-size: .9rem; transition: all 120ms; }
    .related-grid a:hover { background: #F8FAFC; border-color: var(--navy); }
    details { margin: 8px 0; padding: 10px 14px; background: #F8FAFC; border-radius: 8px; }
    details[open] { background: #fff; border: 1px solid var(--border); }
    summary { font-weight: 700; color: var(--navy); cursor: pointer; }
    details p, details ul { margin: 8px 0 0; color: var(--text-2); }
  </style>
</head>
<body class="legal-body">

<header>
  <a href="/" class="logo">State<em>doku</em> <span class="logo-flag">🇺🇸</span></a>
  <nav class="nav-actions"><a href="/learn/" style="color:var(--text-2);text-decoration:none;font-weight:700;font-size:.88rem;">← Learn</a></nav>
</header>

<script type="application/ld+json">
{"@context":"https://schema.org","@type":"BreadcrumbList","itemListElement":[
  {"@type":"ListItem","position":1,"name":"Home","item":"https://statedoku.com/"},
  {"@type":"ListItem","position":2,"name":"Learn","item":"https://statedoku.com/learn/"},
  {"@type":"ListItem","position":3,"name":"Crossword Helper","item":"https://statedoku.com/learn/crossword-helper/"}
]}
</script>
<script type="application/ld+json">
{"@context":"https://schema.org","@type":"FAQPage","mainEntity":[
  {"@type":"Question","name":"Which US state has 4 letters?","acceptedAnswer":{"@type":"Answer","text":"Three US states have exactly 4 letters: Iowa, Ohio, and Utah."}},
  {"@type":"Question","name":"Which US state has 5 letters?","acceptedAnswer":{"@type":"Answer","text":"Seven US states have exactly 5 letters: Idaho, Maine, Texas, plus none others — only those three at 5 letters. Hawaii has 6."}},
  {"@type":"Question","name":"What state capital has 6 letters?","acceptedAnswer":{"@type":"Answer","text":"Several US state capitals have 6 letters including Albany (NY), Austin (TX), Boston (MA), Denver (CO), Dover (DE — actually 5), Helena (MT), Juneau (AK), Pierre (SD — 6 letters), and Topeka (KS)."}},
  {"@type":"Question","name":"What US state has Augusta as its capital?","acceptedAnswer":{"@type":"Answer","text":"Maine. Augusta is the capital of Maine — a common crossword clue with a 5-letter answer."}},
  {"@type":"Question","name":"What is the shortest US state name?","acceptedAnswer":{"@type":"Answer","text":"Iowa, Ohio, and Utah — all 4 letters — are tied as the shortest US state names."}}
]}
</script>

<main>
  <section class="lt-hero">
    <h1>US States Crossword Helper</h1>
    <p class="sub">Filter the 50 states and capitals by letter count, code, or name. Built for crossword solvers and trivia fans.</p>
  </section>

  <article class="lt-main">

    <div class="filters">
      <label>State letters
        <input type="number" id="f-state-letters" min="1" max="20" placeholder="e.g. 5">
      </label>
      <label>Capital letters
        <input type="number" id="f-capital-letters" min="1" max="20" placeholder="e.g. 6">
      </label>
      <label>USPS code
        <input type="text" id="f-usps" maxlength="2" placeholder="e.g. ME" style="text-transform:uppercase;">
      </label>
      <label>State name contains
        <input type="text" id="f-name" placeholder="e.g. ar">
      </label>
      <label>Capital starts with
        <input type="text" id="f-cap-start" maxlength="3" placeholder="e.g. Au">
      </label>
      <button class="clear-btn" id="clear">Clear filters</button>
    </div>

    <p style="margin: 4px 0 12px;"><strong id="count">50</strong> of 50 states match.</p>

    <table class="lt" id="grid">
      <thead>
        <tr>
          <th data-sort="en">State</th>
          <th data-sort="id">USPS</th>
          <th data-sort="stateLetters" class="num">Letters</th>
          <th data-sort="capital">Capital</th>
          <th data-sort="capitalLetters" class="num">Letters</th>
        </tr>
      </thead>
      <tbody id="rows"></tbody>
    </table>
    <div class="no-match" id="empty" hidden>No state matches your filters. Clear them to start over.</div>

    <h2>Most-searched crossword clues we cover</h2>
    <ul>
      <li><strong>"US state with capital Augusta (5 letters)"</strong> → Maine.</li>
      <li><strong>"US state, capital Honolulu"</strong> → Hawaii (HI).</li>
      <li><strong>"4-letter US state"</strong> → Iowa, Ohio, or Utah.</li>
      <li><strong>"US state capital, 6 letters"</strong> → Albany, Austin, Boston, Denver, Helena, Juneau, Pierre, or Topeka.</li>
      <li><strong>"Smallest US state"</strong> → Rhode Island (by area).</li>
      <li><strong>"US state on the Pacific, 6 letters"</strong> → Hawaii or Oregon.</li>
    </ul>

    <div class="cta-card">
      <h3>Try the daily geography puzzle</h3>
      <p>Statedoku gives you 5 clues about a hidden US state every day. Free, no login.</p>
      <a href="/">Play today's puzzle →</a>
    </div>

    <h2>FAQ</h2>
    <details><summary>Which 4-letter US states exist?</summary><p>Three: <strong>Iowa</strong>, <strong>Ohio</strong>, and <strong>Utah</strong>.</p></details>
    <details><summary>What 5-letter US states are there?</summary><p>Three: <strong>Idaho</strong>, <strong>Maine</strong>, and <strong>Texas</strong>.</p></details>
    <details><summary>Which state capital has 5 letters?</summary><p>Several, including <strong>Dover</strong> (DE), <strong>Salem</strong> (OR), <strong>Boise</strong> (ID), and <strong>Pierre</strong> (SD, depending on counting).</p></details>
    <details><summary>What's the longest US state name?</summary><p><strong>North Carolina</strong> and <strong>South Carolina</strong> tie at 13 letters (excluding the space). <strong>Massachusetts</strong> is the longest single-word state at 13 letters.</p></details>
    <details><summary>Which state has the same first and last letter?</summary><p>Several do: <strong>Alabama</strong>, <strong>Alaska</strong>, <strong>Arizona</strong>, <strong>Arkansas</strong>, <strong>Ohio</strong>, and a few more.</p></details>

    <h2>Related guides</h2>
    <div class="related-grid">
      <a href="/learn/state-abbreviations/">→ USPS state abbreviations</a>
      <a href="/learn/states-and-capitals/">→ All 50 states & capitals</a>
      <a href="/learn/state-nicknames/">→ State nicknames</a>
      <a href="/learn/state-mottos/">→ State mottos</a>
      <a href="/learn/largest-states/">→ Largest states</a>
      <a href="/learn/landlocked-states/">→ Landlocked states</a>
      <a href="/es/learn/crucigrama-estados/">→ Versión en español</a>
      <a href="/learn/">→ All learn guides</a>
    </div>
  </article>
</main>

<footer>
  <p>Statedoku &copy; 2026 &nbsp;·&nbsp; <a href="/about/">About</a> &nbsp;·&nbsp; <a href="/learn/">Learn</a> &nbsp;·&nbsp; <a href="/states/">States</a> &nbsp;·&nbsp; <a href="/quiz/">Quiz</a> &nbsp;·&nbsp; <a href="/api/">API</a> &nbsp;·&nbsp; <a href="/faq/">FAQ</a></p>
</footer>

<script>
  const DATA = ${dataJSON};
  const tbody = document.getElementById('rows');
  const empty = document.getElementById('empty');
  const countEl = document.getElementById('count');
  let sortKey = 'en';
  let sortDir = 1;
  const slug = n => n.toLowerCase().replace(/\\s+/g, '-');

  function render() {
    const f = {
      sl: +document.getElementById('f-state-letters').value || 0,
      cl: +document.getElementById('f-capital-letters').value || 0,
      usps: document.getElementById('f-usps').value.trim().toUpperCase(),
      name: document.getElementById('f-name').value.trim().toLowerCase(),
      capStart: document.getElementById('f-cap-start').value.trim().toLowerCase(),
    };
    let rows = DATA.filter(s => {
      if (f.sl && s.stateLetters !== f.sl) return false;
      if (f.cl && s.capitalLetters !== f.cl) return false;
      if (f.usps && !s.id.startsWith(f.usps)) return false;
      if (f.name && !s.en.toLowerCase().includes(f.name)) return false;
      if (f.capStart && !s.capital.toLowerCase().startsWith(f.capStart)) return false;
      return true;
    });
    rows.sort((a, b) => {
      const va = a[sortKey], vb = b[sortKey];
      if (typeof va === 'number') return (va - vb) * sortDir;
      return String(va).localeCompare(String(vb)) * sortDir;
    });
    countEl.textContent = rows.length;
    if (!rows.length) {
      tbody.innerHTML = '';
      empty.hidden = false;
    } else {
      empty.hidden = true;
      tbody.innerHTML = rows.map(s =>
        '<tr>' +
        '<td><a href="/states/' + slug(s.en) + '/"><strong>' + s.en + '</strong></a></td>' +
        '<td><strong>' + s.id + '</strong></td>' +
        '<td class="num">' + s.stateLetters + '</td>' +
        '<td>' + s.capital + '</td>' +
        '<td class="num">' + s.capitalLetters + '</td>' +
        '</tr>'
      ).join('');
    }
    document.querySelectorAll('#grid th').forEach(th => {
      th.classList.remove('sort-asc', 'sort-desc');
      if (th.dataset.sort === sortKey) th.classList.add(sortDir === 1 ? 'sort-asc' : 'sort-desc');
    });
  }

  document.querySelectorAll('.filters input').forEach(i => i.addEventListener('input', render));
  document.getElementById('clear').addEventListener('click', () => {
    document.querySelectorAll('.filters input').forEach(i => i.value = '');
    render();
  });
  document.querySelectorAll('#grid th').forEach(th => {
    th.addEventListener('click', () => {
      if (sortKey === th.dataset.sort) sortDir = -sortDir;
      else { sortKey = th.dataset.sort; sortDir = 1; }
      render();
    });
  });

  render();
</script>
<script src="/config.js"></script>
<script src="/js/admin.js"></script>
</body>
</html>
`;

const enDir = path.join(ROOT, 'learn/crossword-helper');
fs.mkdirSync(enDir, { recursive: true });
fs.writeFileSync(path.join(enDir, 'index.html'), enHTML);
console.log(`✅ Wrote learn/crossword-helper/index.html`);

// =============================================================
// ES: /es/learn/crucigrama-estados/
// =============================================================
const esHTML = `<!DOCTYPE html>
<html lang="es">
<head>
  <meta charset="UTF-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0, viewport-fit=cover">
  <meta name="theme-color" content="#0F2147">
  <meta name="color-scheme" content="light">

  <title>Crucigrama de estados de EE.UU.: estado por letras, capital, código | Statedoku</title>
  <meta name="description" content="Ayuda para crucigramas: filtra los 50 estados de EE.UU. y sus capitales por número de letras, código USPS o nombre. ¿Estado de 5 letras con capital Augusta? Encuéntralo.">
  <meta name="keywords" content="crucigrama estados unidos, estado 5 letras crucigrama, capital estado crucigrama, ayuda crucigrama estados, estado de ee uu cuya capital es augusta">
  <meta name="robots" content="index, follow, max-image-preview:large">

  <link rel="canonical" href="https://statedoku.com/es/learn/crucigrama-estados/">
  <link rel="alternate" hreflang="en" href="https://statedoku.com/learn/crossword-helper/">
  <link rel="alternate" hreflang="es" href="https://statedoku.com/es/learn/crucigrama-estados/">
  <link rel="alternate" hreflang="es-ES" href="https://statedoku.com/es/learn/crucigrama-estados/">
  <link rel="alternate" hreflang="es-MX" href="https://statedoku.com/es/learn/crucigrama-estados/">
  <link rel="alternate" hreflang="es-AR" href="https://statedoku.com/es/learn/crucigrama-estados/">
  <link rel="alternate" hreflang="es-CO" href="https://statedoku.com/es/learn/crucigrama-estados/">
  <link rel="alternate" hreflang="es-PE" href="https://statedoku.com/es/learn/crucigrama-estados/">
  <link rel="alternate" hreflang="es-CL" href="https://statedoku.com/es/learn/crucigrama-estados/">
  <link rel="alternate" hreflang="es-US" href="https://statedoku.com/es/learn/crucigrama-estados/">
  <link rel="alternate" hreflang="x-default" href="https://statedoku.com/learn/crossword-helper/">
  <link rel="icon" type="image/svg+xml" href="/favicon.svg?v=5">
  <link rel="stylesheet" href="/css/style.css?v=17">

  <meta property="og:type" content="article">
  <meta property="og:title" content="Crucigrama de estados de EE.UU. — Buscar por letras">
  <meta property="og:description" content="Filtra los 50 estados de EE.UU. y sus capitales por número de letras, código USPS o nombre. Ideal para crucigramas y trivias.">
  <meta property="og:url" content="https://statedoku.com/es/learn/crucigrama-estados/">
  <meta property="og:image" content="https://statedoku.com/og/og-learn-state-capitals.png">
  <meta property="og:locale" content="es_ES">

  <style>
    .lt-hero { max-width: 720px; margin: 32px auto 12px; padding: 0 18px; text-align: center; }
    .lt-hero h1 { font-size: clamp(1.9rem, 5.5vw, 2.5rem); font-weight: 900; letter-spacing: -0.025em; margin: 0 0 10px; line-height: 1.15; }
    .lt-hero .sub { color: var(--text-2); font-size: 1rem; line-height: 1.55; }
    .lt-main { max-width: 860px; margin: 0 auto; padding: 18px 18px 60px; line-height: 1.65; color: var(--text); }
    .lt-main h2 { margin-top: 36px; margin-bottom: 12px; font-size: 1.3rem; font-weight: 800; letter-spacing: -0.015em; }
    .lt-main h3 { margin-top: 20px; margin-bottom: 8px; font-size: 1.02rem; font-weight: 700; color: var(--navy); }
    .filters { display: flex; flex-wrap: wrap; gap: 10px; padding: 14px; background: #F8FAFC; border-radius: 12px; margin: 14px 0; }
    .filters label { display: flex; flex-direction: column; gap: 4px; font-size: .82rem; font-weight: 700; color: var(--navy); text-transform: uppercase; letter-spacing: .03em; }
    .filters input, .filters select { padding: 8px 10px; border: 1px solid var(--border); border-radius: 8px; font-size: .95rem; background: #fff; min-width: 140px; font-family: inherit; }
    .filters .clear-btn { align-self: flex-end; padding: 8px 14px; border: none; background: var(--navy); color: #fff; border-radius: 8px; font-weight: 700; cursor: pointer; font-size: .9rem; }
    .filters .clear-btn:hover { background: var(--navy-soft); }
    table.lt { width: 100%; border-collapse: collapse; margin: 14px 0 22px; font-size: .92rem; }
    table.lt th, table.lt td { padding: 8px 10px; border-bottom: 1px solid var(--border); text-align: left; }
    table.lt th { background: #F1F5F9; font-weight: 700; color: var(--navy); font-size: .78rem; text-transform: uppercase; letter-spacing: .03em; cursor: pointer; user-select: none; }
    table.lt th:hover { background: #E2E8F0; }
    table.lt th.sort-asc::after { content: ' ▲'; font-size: .7rem; }
    table.lt th.sort-desc::after { content: ' ▼'; font-size: .7rem; }
    table.lt tr:hover { background: #FAFBFC; }
    table.lt a { color: var(--navy); font-weight: 700; text-decoration: none; }
    table.lt a:hover { text-decoration: underline; }
    table.lt td.num { text-align: center; font-variant-numeric: tabular-nums; font-weight: 700; }
    .no-match { padding: 30px; text-align: center; color: var(--text-3); font-style: italic; }
    .tip { background: #FFF7ED; border-left: 3px solid var(--gold); padding: 10px 14px; border-radius: 0 8px 8px 0; margin: 14px 0; font-size: .93rem; }
    .cta-card { background: linear-gradient(135deg, var(--navy), var(--navy-soft)); color: #fff; padding: 22px; border-radius: 14px; margin: 28px 0; text-align: center; }
    .cta-card h3 { color: #fff; margin: 0 0 8px; }
    .cta-card p { margin: 0 0 12px; color: rgba(255,255,255,0.85); }
    .cta-card a { display: inline-block; background: var(--gold); color: var(--navy); padding: 10px 22px; border-radius: 999px; font-weight: 800; text-decoration: none; font-size: .92rem; }
    .related-grid { display: grid; grid-template-columns: repeat(auto-fit, minmax(220px, 1fr)); gap: 8px; margin: 14px 0; }
    .related-grid a { display: block; padding: 10px 12px; border: 1px solid var(--border); border-radius: 8px; color: var(--navy); text-decoration: none; font-weight: 600; font-size: .9rem; transition: all 120ms; }
    .related-grid a:hover { background: #F8FAFC; border-color: var(--navy); }
    details { margin: 8px 0; padding: 10px 14px; background: #F8FAFC; border-radius: 8px; }
    details[open] { background: #fff; border: 1px solid var(--border); }
    summary { font-weight: 700; color: var(--navy); cursor: pointer; }
    details p, details ul { margin: 8px 0 0; color: var(--text-2); }
  </style>
</head>
<body class="legal-body">

<header>
  <a href="/es/" class="logo">State<em>doku</em> <span class="logo-flag">🇺🇸</span></a>
  <nav class="nav-actions"><a href="/es/learn/" style="color:var(--text-2);text-decoration:none;font-weight:700;font-size:.88rem;">← Aprender</a></nav>
</header>

<script type="application/ld+json">
{"@context":"https://schema.org","@type":"BreadcrumbList","itemListElement":[
  {"@type":"ListItem","position":1,"name":"Inicio","item":"https://statedoku.com/es/"},
  {"@type":"ListItem","position":2,"name":"Aprender","item":"https://statedoku.com/es/learn/"},
  {"@type":"ListItem","position":3,"name":"Crucigrama de estados","item":"https://statedoku.com/es/learn/crucigrama-estados/"}
]}
</script>
<script type="application/ld+json">
{"@context":"https://schema.org","@type":"FAQPage","mainEntity":[
  {"@type":"Question","name":"¿Estado de EE.UU. cuya capital es Augusta (5 letras)?","acceptedAnswer":{"@type":"Answer","text":"Maine. Augusta es la capital de Maine, un estado de 5 letras en inglés."}},
  {"@type":"Question","name":"¿Estado de EE.UU. cuya capital es Honolulu?","acceptedAnswer":{"@type":"Answer","text":"Hawái (Hawaii, HI). Honolulu es la capital de Hawái, en la isla de Oahu."}},
  {"@type":"Question","name":"¿Qué estado de EE.UU. tiene 4 letras?","acceptedAnswer":{"@type":"Answer","text":"Tres: Iowa, Ohio y Utah — los nombres más cortos de los 50 estados."}},
  {"@type":"Question","name":"¿Ciudad de Arizona en EE.UU. (6 letras)?","acceptedAnswer":{"@type":"Answer","text":"Tucson (TUCSON, 6 letras) o Tempe (TEMPE, 5 letras). Phoenix tiene 7."}},
  {"@type":"Question","name":"¿Estados que limitan con Canadá?","acceptedAnswer":{"@type":"Answer","text":"13 estados: Maine, Nuevo Hampshire, Vermont, Nueva York, Pensilvania, Ohio, Michigan, Minnesota, Dakota del Norte, Montana, Idaho, Washington y Alaska."}}
]}
</script>

<main>
  <section class="lt-hero">
    <h1>Crucigrama de estados de EE.UU.</h1>
    <p class="sub">Filtra los 50 estados y capitales por número de letras, código USPS o nombre. Hecho para crucigramas, mots fléchés y trivias.</p>
  </section>

  <article class="lt-main">

    <div class="filters">
      <label>Letras del estado (ES)
        <input type="number" id="f-es-letters" min="1" max="20" placeholder="ej. 5">
      </label>
      <label>Letras de la capital
        <input type="number" id="f-capital-letters" min="1" max="20" placeholder="ej. 6">
      </label>
      <label>Código USPS
        <input type="text" id="f-usps" maxlength="2" placeholder="ej. ME" style="text-transform:uppercase;">
      </label>
      <label>Nombre del estado contiene
        <input type="text" id="f-name" placeholder="ej. nor">
      </label>
      <label>Capital empieza por
        <input type="text" id="f-cap-start" maxlength="3" placeholder="ej. Au">
      </label>
      <button class="clear-btn" id="clear">Borrar filtros</button>
    </div>

    <p style="margin: 4px 0 12px;"><strong id="count">50</strong> de 50 estados coinciden.</p>

    <table class="lt" id="grid">
      <thead>
        <tr>
          <th data-sort="es">Estado (ES)</th>
          <th data-sort="en">Estado (EN)</th>
          <th data-sort="id">USPS</th>
          <th data-sort="esLetters" class="num">Letras ES</th>
          <th data-sort="capital">Capital</th>
          <th data-sort="capitalLetters" class="num">Letras</th>
        </tr>
      </thead>
      <tbody id="rows"></tbody>
    </table>
    <div class="no-match" id="empty" hidden>Ningún estado coincide con los filtros. Bórralos para empezar de nuevo.</div>

    <h2>Pistas de crucigrama más buscadas</h2>
    <ul>
      <li><strong>"Estado de EE.UU. cuya capital es Augusta (5 letras)"</strong> → MAINE.</li>
      <li><strong>"Estado de capital Honolulu"</strong> → HAWAII / HAWÁI.</li>
      <li><strong>"Estado de EE.UU. de 4 letras"</strong> → IOWA, OHIO o UTAH.</li>
      <li><strong>"Ciudad de Arizona en EE.UU. (6 letras)"</strong> → TUCSON.</li>
      <li><strong>"Estado fronterizo con Canadá"</strong> → 13 opciones (ver guía).</li>
      <li><strong>"Estado más pequeño de EE.UU."</strong> → Rhode Island (por superficie).</li>
    </ul>

    <div class="cta-card">
      <h3>Prueba el puzzle diario de geografía</h3>
      <p>Statedoku te da 5 pistas sobre un estado oculto cada día. Gratis, sin registro.</p>
      <a href="/es/">Jugar el puzzle de hoy →</a>
    </div>

    <h2>FAQ</h2>
    <details><summary>¿Qué estados de EE.UU. tienen 4 letras (en inglés)?</summary><p>Tres: <strong>Iowa</strong>, <strong>Ohio</strong> y <strong>Utah</strong>.</p></details>
    <details><summary>¿Qué estados de EE.UU. tienen 5 letras (en inglés)?</summary><p>Tres: <strong>Idaho</strong>, <strong>Maine</strong> y <strong>Texas</strong>.</p></details>
    <details><summary>¿Cuál es el nombre de estado más largo?</summary><p><strong>Carolina del Norte</strong> y <strong>Carolina del Sur</strong> en español. En inglés, Massachusetts es el más largo de una sola palabra (13 letras).</p></details>
    <details><summary>¿Qué estado de EE.UU. tiene la capital con menos letras?</summary><p><strong>Dover</strong> (Delaware) y <strong>Salem</strong> (Oregón), con 5 letras.</p></details>

    <h2>Guías relacionadas</h2>
    <div class="related-grid">
      <a href="/es/learn/capitales-de-estados/">→ Capitales de los 50 estados</a>
      <a href="/es/learn/state-abbreviations/">→ Abreviaturas USPS</a>
      <a href="/es/learn/states-bordering-canada/">→ Estados que limitan con Canadá</a>
      <a href="/es/learn/states-bordering-mexico/">→ Estados que limitan con México</a>
      <a href="/es/learn/largest-states/">→ Estados más grandes</a>
      <a href="/es/learn/landlocked-states/">→ Estados sin salida al mar</a>
      <a href="/es/learn/13-colonies/">→ Las 13 colonias originales</a>
      <a href="/es/learn/">→ Todas las guías</a>
    </div>
  </article>
</main>

<footer>
  <p>Statedoku &copy; 2026 &nbsp;·&nbsp; <a href="/es/about/">Acerca</a> &nbsp;·&nbsp; <a href="/es/learn/">Aprender</a> &nbsp;·&nbsp; <a href="/states/">Todos los estados</a> &nbsp;·&nbsp; <a href="/quiz/">Quiz</a> &nbsp;·&nbsp; <a href="/es/faq/">FAQ</a></p>
</footer>

<script>
  const DATA = ${dataJSON};
  const tbody = document.getElementById('rows');
  const empty = document.getElementById('empty');
  const countEl = document.getElementById('count');
  let sortKey = 'es';
  let sortDir = 1;
  const slug = n => n.toLowerCase().replace(/\\s+/g, '-');

  function render() {
    const f = {
      esl: +document.getElementById('f-es-letters').value || 0,
      cl: +document.getElementById('f-capital-letters').value || 0,
      usps: document.getElementById('f-usps').value.trim().toUpperCase(),
      name: document.getElementById('f-name').value.trim().toLowerCase(),
      capStart: document.getElementById('f-cap-start').value.trim().toLowerCase(),
    };
    let rows = DATA.filter(s => {
      if (f.esl && s.esLetters !== f.esl) return false;
      if (f.cl && s.capitalLetters !== f.cl) return false;
      if (f.usps && !s.id.startsWith(f.usps)) return false;
      if (f.name && !s.es.toLowerCase().includes(f.name) && !s.en.toLowerCase().includes(f.name)) return false;
      if (f.capStart && !s.capital.toLowerCase().startsWith(f.capStart)) return false;
      return true;
    });
    rows.sort((a, b) => {
      const va = a[sortKey], vb = b[sortKey];
      if (typeof va === 'number') return (va - vb) * sortDir;
      return String(va).localeCompare(String(vb), 'es') * sortDir;
    });
    countEl.textContent = rows.length;
    if (!rows.length) {
      tbody.innerHTML = '';
      empty.hidden = false;
    } else {
      empty.hidden = true;
      tbody.innerHTML = rows.map(s =>
        '<tr>' +
        '<td><a href="/es/states/' + slug(s.en) + '/"><strong>' + s.es + '</strong></a></td>' +
        '<td>' + s.en + '</td>' +
        '<td><strong>' + s.id + '</strong></td>' +
        '<td class="num">' + s.esLetters + '</td>' +
        '<td>' + s.capital + '</td>' +
        '<td class="num">' + s.capitalLetters + '</td>' +
        '</tr>'
      ).join('');
    }
    document.querySelectorAll('#grid th').forEach(th => {
      th.classList.remove('sort-asc', 'sort-desc');
      if (th.dataset.sort === sortKey) th.classList.add(sortDir === 1 ? 'sort-asc' : 'sort-desc');
    });
  }

  document.querySelectorAll('.filters input').forEach(i => i.addEventListener('input', render));
  document.getElementById('clear').addEventListener('click', () => {
    document.querySelectorAll('.filters input').forEach(i => i.value = '');
    render();
  });
  document.querySelectorAll('#grid th').forEach(th => {
    th.addEventListener('click', () => {
      if (sortKey === th.dataset.sort) sortDir = -sortDir;
      else { sortKey = th.dataset.sort; sortDir = 1; }
      render();
    });
  });

  render();
</script>
<script src="/config.js"></script>
<script src="/js/admin.js"></script>
</body>
</html>
`;

const esDir = path.join(ROOT, 'es/learn/crucigrama-estados');
fs.mkdirSync(esDir, { recursive: true });
fs.writeFileSync(path.join(esDir, 'index.html'), esHTML);
console.log(`✅ Wrote es/learn/crucigrama-estados/index.html`);
