#!/usr/bin/env node
const fs = require('fs');
const path = require('path');

const ROOT = path.resolve(__dirname, '..');
const states = JSON.parse(fs.readFileSync(path.join(ROOT, 'data/states.json'), 'utf8'));

const slugMap = {};
for (const s of states) slugMap[s.id] = s.names.en.toLowerCase().replace(/\s+/g, '-');

const sorted = [...states].sort((a, b) => a.names.es.localeCompare(b.names.es, 'es'));

// FAQ schema for top 8 queries that already get impressions
const faqs = [
  { q: '¿Cuál es la capital de Montana?', a: 'La capital de Montana es Helena. No es la ciudad más grande del estado — esa es Billings.' },
  { q: '¿Cuál es la capital de Illinois?', a: 'La capital de Illinois es Springfield, no Chicago. Chicago es la ciudad más grande, pero la capital es Springfield desde 1839.' },
  { q: '¿Cuál es la capital de Arizona?', a: 'La capital de Arizona es Phoenix, que también es la ciudad más grande del estado y la quinta más grande de Estados Unidos.' },
  { q: '¿Cuál es la capital de Missouri?', a: 'La capital de Missouri es Jefferson City. Las ciudades más grandes son Kansas City y St. Louis, pero ninguna es la capital.' },
  { q: '¿Cuál es la capital de Dakota del Sur?', a: 'La capital de Dakota del Sur es Pierre — una de las capitales estatales menos pobladas de EE.UU., con menos de 14 000 habitantes.' },
  { q: '¿Cuál es la capital de Virginia Occidental?', a: 'La capital de Virginia Occidental es Charleston, situada en la confluencia de los ríos Elk y Kanawha.' },
  { q: '¿Qué estado tiene Honolulu como capital?', a: 'Honolulu es la capital de Hawái (Hawaii). Está en la isla de Oahu.' },
  { q: '¿Qué estado de EE.UU. tiene Augusta como capital (5 letras)?', a: 'Maine. Augusta es la capital de Maine — perfecto para crucigramas en los que el estado tiene 5 letras.' },
];

const faqJSON = JSON.stringify({
  '@context': 'https://schema.org',
  '@type': 'FAQPage',
  mainEntity: faqs.map(f => ({
    '@type': 'Question',
    name: f.q,
    acceptedAnswer: { '@type': 'Answer', text: f.a },
  })),
});

const breadcrumbJSON = JSON.stringify({
  '@context': 'https://schema.org',
  '@type': 'BreadcrumbList',
  itemListElement: [
    { '@type': 'ListItem', position: 1, name: 'Inicio', item: 'https://statedoku.com/es/' },
    { '@type': 'ListItem', position: 2, name: 'Aprender', item: 'https://statedoku.com/es/learn/' },
    { '@type': 'ListItem', position: 3, name: 'Capitales de los 50 estados', item: 'https://statedoku.com/es/learn/capitales-de-estados/' },
  ],
});

const tableRows = sorted.map(s => {
  const slug = slugMap[s.id];
  return `      <tr><td><a href="/es/states/${slug}/"><strong>${s.names.es}</strong></a></td><td>${s.id}</td><td><strong>${s.capital}</strong></td><td>${s.capitalIsLargest ? 'Sí' : 'No'}</td></tr>`;
}).join('\n');

// Each state gets its own H2 with answer
const stateAnswers = sorted.map(s => {
  const slug = slugMap[s.id];
  return `    <h3>¿Cuál es la capital de ${s.names.es}?</h3>
    <p>La capital de <strong>${s.names.es}</strong> (${s.id}) es <strong>${s.capital}</strong>${s.capitalIsLargest ? ' — también la ciudad más grande del estado' : `. La ciudad más grande es ${s.largestCity || s.capital}`}. <a href="/es/states/${slug}/">Ver perfil del estado →</a></p>`;
}).join('\n\n');

const faqHTML = faqs.map(f => `      <details><summary><strong>${f.q}</strong></summary><p>${f.a}</p></details>`).join('\n');

const html = `<!DOCTYPE html>
<html lang="es">
<head>
  <meta charset="UTF-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0, viewport-fit=cover">
  <meta name="theme-color" content="#0F2147">
  <meta name="color-scheme" content="light">

  <title>Capitales de los 50 estados de EE.UU. — Lista completa (2026) | Statedoku</title>
  <meta name="description" content="Lista completa de las 50 capitales de los estados de Estados Unidos: ¿Cuál es la capital de Montana, Illinois, Arizona? Tabla, mapa y respuestas para crucigramas.">
  <meta name="keywords" content="capitales estados unidos, capital de illinois, capital de montana, capital de arizona, capital de missouri, capitales eeuu, estados unidos capitales">
  <meta name="robots" content="index, follow, max-image-preview:large">

  <link rel="canonical" href="https://statedoku.com/es/learn/capitales-de-estados/">
  <link rel="alternate" hreflang="en" href="https://statedoku.com/learn/states-and-capitals/">
  <link rel="alternate" hreflang="fr" href="https://statedoku.com/fr/learn/states-and-capitals/">
  <link rel="alternate" hreflang="es" href="https://statedoku.com/es/learn/capitales-de-estados/">
  <link rel="alternate" hreflang="es-ES" href="https://statedoku.com/es/learn/capitales-de-estados/">
  <link rel="alternate" hreflang="es-MX" href="https://statedoku.com/es/learn/capitales-de-estados/">
  <link rel="alternate" hreflang="es-AR" href="https://statedoku.com/es/learn/capitales-de-estados/">
  <link rel="alternate" hreflang="es-CO" href="https://statedoku.com/es/learn/capitales-de-estados/">
  <link rel="alternate" hreflang="es-PE" href="https://statedoku.com/es/learn/capitales-de-estados/">
  <link rel="alternate" hreflang="es-CL" href="https://statedoku.com/es/learn/capitales-de-estados/">
  <link rel="alternate" hreflang="es-US" href="https://statedoku.com/es/learn/capitales-de-estados/">
  <link rel="alternate" hreflang="x-default" href="https://statedoku.com/learn/states-and-capitals/">
  <link rel="icon" type="image/svg+xml" href="/favicon.svg?v=5">
  <link rel="stylesheet" href="/css/style.css?v=17">

  <meta property="og:type" content="article">
  <meta property="og:title" content="Capitales de los 50 estados de EE.UU. — Lista completa">
  <meta property="og:description" content="¿Cuál es la capital de Montana? ¿De Illinois? Lista completa de las 50 capitales con tabla, mapa y respuestas para crucigramas.">
  <meta property="og:url" content="https://statedoku.com/es/learn/capitales-de-estados/">
  <meta property="og:image" content="https://statedoku.com/og/og-learn-state-capitals.png">
  <meta property="og:locale" content="es_ES">

  <style>
    .lt-hero { max-width: 720px; margin: 32px auto 12px; padding: 0 18px; text-align: center; }
    .lt-hero h1 { font-size: clamp(1.9rem, 5.5vw, 2.6rem); font-weight: 900; letter-spacing: -0.025em; margin: 0 0 10px; line-height: 1.15; }
    .lt-hero .sub { color: var(--text-2); font-size: 1rem; line-height: 1.55; }
    .lt-main { max-width: 720px; margin: 0 auto; padding: 18px 18px 60px; line-height: 1.65; color: var(--text); }
    .lt-main h2 { margin-top: 36px; margin-bottom: 12px; font-size: 1.35rem; font-weight: 800; letter-spacing: -0.015em; }
    .lt-main h3 { margin-top: 20px; margin-bottom: 6px; font-size: 1.02rem; font-weight: 700; color: var(--navy); }
    .lt-main p, .lt-main li { line-height: 1.6; }
    .lt-main ul, .lt-main ol { padding-left: 22px; margin-bottom: 14px; }
    table.lt { width: 100%; border-collapse: collapse; margin: 14px 0 22px; font-size: .92rem; }
    table.lt th, table.lt td { padding: 8px 10px; border-bottom: 1px solid var(--border); text-align: left; }
    table.lt th { background: #F8FAFC; font-weight: 700; color: var(--navy); font-size: .8rem; text-transform: uppercase; letter-spacing: .03em; }
    table.lt tr:hover { background: #FAFBFC; }
    table.lt a { color: var(--navy); font-weight: 700; text-decoration: none; }
    table.lt a:hover { text-decoration: underline; }
    .tip { background: #FFF7ED; border-left: 3px solid var(--gold); padding: 10px 14px; border-radius: 0 8px 8px 0; margin: 14px 0; font-size: .93rem; }
    .cta-card { background: linear-gradient(135deg, var(--navy), var(--navy-soft)); color: #fff; padding: 22px; border-radius: 14px; margin: 28px 0; text-align: center; }
    .cta-card h3 { color: #fff; margin: 0 0 8px; }
    .cta-card p { margin: 0 0 12px; color: rgba(255,255,255,0.85); }
    .cta-card a { display: inline-block; background: var(--gold); color: var(--navy); padding: 10px 22px; border-radius: 999px; font-weight: 800; text-decoration: none; font-size: .92rem; }
    .related-grid { display: grid; grid-template-columns: repeat(auto-fit, minmax(220px, 1fr)); gap: 8px; margin: 14px 0; }
    .related-grid a { display: block; padding: 10px 12px; border: 1px solid var(--border); border-radius: 8px; color: var(--navy); text-decoration: none; font-weight: 600; font-size: .9rem; transition: all 120ms; }
    .related-grid a:hover { background: #F8FAFC; border-color: var(--navy); }
    details { margin: 8px 0; padding: 10px 14px; background: #F8FAFC; border-radius: 8px; cursor: pointer; }
    details[open] { background: #fff; border: 1px solid var(--border); }
    summary { font-weight: 700; color: var(--navy); }
    details p { margin: 8px 0 0; color: var(--text-2); }
    .answers-grid h3 { margin-top: 14px; }
  </style>
</head>
<body class="legal-body">

<header>
  <a href="/es/" class="logo">State<em>doku</em> <span class="logo-flag">🇺🇸</span></a>
  <nav class="nav-actions"><a href="/es/learn/" style="color:var(--text-2);text-decoration:none;font-weight:700;font-size:.88rem;">← Aprender</a></nav>
</header>

<script type="application/ld+json">
${breadcrumbJSON}
</script>
<script type="application/ld+json">
${faqJSON}
</script>

<main>
  <section class="lt-hero">
    <h1>Capitales de los 50 estados de EE.UU.</h1>
    <p class="sub">¿Cuál es la capital de Montana, Illinois o Arizona? Lista completa de las 50 capitales — con tabla, respuestas y pistas para crucigramas.</p>
  </section>

  <article class="lt-main">
    <div class="tip">
      <strong>Atajo:</strong> usa Ctrl+F (⌘+F en Mac) para buscar tu estado rápidamente. La tabla está ordenada alfabéticamente en español.
    </div>

    <h2>Tabla: los 50 estados y sus capitales</h2>
    <table class="lt">
      <thead><tr><th>Estado</th><th>Código</th><th>Capital</th><th>¿Es la más grande?</th></tr></thead>
      <tbody>
${tableRows}
      </tbody>
    </table>

    <h2>5 trampas clásicas que confunden a todo el mundo</h2>
    <ul>
      <li><strong>Illinois → Springfield</strong>, no Chicago.</li>
      <li><strong>Nueva York → Albany</strong>, no la ciudad de Nueva York.</li>
      <li><strong>California → Sacramento</strong>, no Los Ángeles ni San Francisco.</li>
      <li><strong>Florida → Tallahassee</strong>, no Miami ni Orlando.</li>
      <li><strong>Texas → Austin</strong>, no Houston ni Dallas.</li>
    </ul>
    <p>De los 50 estados, solo 17 tienen como capital su ciudad más grande. Una buena regla: si suena famosa, probablemente no es la capital.</p>

    <div class="cta-card">
      <h3>Adivina la capital — puzzle diario</h3>
      <p>Statedoku te da pistas cada día. Una de ellas es siempre el nombre de la capital.</p>
      <a href="/es/">Jugar el puzzle de hoy →</a>
    </div>

    <h2>Las 50 capitales, una por una</h2>
    <p>Respuestas directas para cada estado — ideal para tareas, crucigramas y trivias.</p>
    <div class="answers-grid">
${stateAnswers}
    </div>

    <h2>Preguntas frecuentes</h2>
${faqHTML}

    <h2>Guías relacionadas</h2>
    <div class="related-grid">
      <a href="/es/learn/">→ Aprender los 50 estados</a>
      <a href="/es/learn/state-abbreviations/">→ Abreviaturas de los estados</a>
      <a href="/es/learn/states-bordering-canada/">→ Estados que limitan con Canadá</a>
      <a href="/es/learn/states-bordering-mexico/">→ Estados que limitan con México</a>
      <a href="/es/learn/13-colonies/">→ Las 13 colonias originales</a>
      <a href="/es/learn/landlocked-states/">→ Estados sin salida al mar</a>
      <a href="/es/learn/largest-states/">→ Los estados más grandes</a>
      <a href="/es/learn/crucigrama-estados/">→ Ayuda para crucigramas</a>
    </div>
  </article>
</main>

<footer>
  <p>Statedoku &copy; 2026 &nbsp;·&nbsp; <a href="/es/about/">Acerca</a> &nbsp;·&nbsp; <a href="/es/learn/">Aprender</a> &nbsp;·&nbsp; <a href="/states/">Todos los estados</a> &nbsp;·&nbsp; <a href="/quiz/">Quiz</a> &nbsp;·&nbsp; <a href="/facts/">Facts</a> &nbsp;·&nbsp; <a href="/es/faq/">FAQ</a></p>
</footer>

<script src="/config.js"></script>
<script src="/js/admin.js"></script>
</body>
</html>
`;

const outDir = path.join(ROOT, 'es/learn/capitales-de-estados');
fs.mkdirSync(outDir, { recursive: true });
fs.writeFileSync(path.join(outDir, 'index.html'), html);
console.log(`✅ Wrote ${path.relative(ROOT, path.join(outDir, 'index.html'))}`);
