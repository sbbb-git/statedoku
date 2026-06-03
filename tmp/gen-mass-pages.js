#!/usr/bin/env node
/**
 * Mass-generate 12 high-value learn pages:
 *   6 ES (LATAM SEO push, after launch-day showed ES capturing 13%+ of traffic)
 *   6 FR (FR market is 21% of launch-day traffic, FR cluster is underbuilt)
 */
const fs = require('fs');
const path = require('path');

const ROOT = path.resolve(__dirname, '..');
const states = JSON.parse(fs.readFileSync(path.join(ROOT, 'data/states.json'), 'utf8'));
const slugFor = s => s.names.en.toLowerCase().replace(/\s+/g, '-');

// ── shared snippets ──────────────────────────────────────────────────────
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

const footerES = `<footer>
  <p>Statedoku &copy; 2026 &nbsp;·&nbsp; <a href="https://www.reddit.com/r/Statedoku/" rel="noopener" target="_blank">💬 Reddit</a> &nbsp;·&nbsp; <a href="/es/about/">Acerca</a> &nbsp;·&nbsp; <a href="/es/learn/">Aprender</a> &nbsp;·&nbsp; <a href="/states/">Todos los estados</a> &nbsp;·&nbsp; <a href="/quiz/">Quiz</a> &nbsp;·&nbsp; <a href="/facts/">Facts</a> &nbsp;·&nbsp; <a href="/es/faq/">FAQ</a></p>
</footer>
<script src="/config.js"></script>
<script src="/js/admin.js"></script>
</body>
</html>`;

const footerFR = `<footer>
  <p>Statedoku &copy; 2026 &nbsp;·&nbsp; <a href="https://www.reddit.com/r/Statedoku/" rel="noopener" target="_blank">💬 Reddit</a> &nbsp;·&nbsp; <a href="/fr/about/">À propos</a> &nbsp;·&nbsp; <a href="/fr/learn/">Apprendre</a> &nbsp;·&nbsp; <a href="/states/">Tous les états</a> &nbsp;·&nbsp; <a href="/quiz/">Quiz</a> &nbsp;·&nbsp; <a href="/facts/">Facts</a> &nbsp;·&nbsp; <a href="/fr/faq/">FAQ</a></p>
</footer>
<script src="/config.js"></script>
<script src="/js/admin.js"></script>
</body>
</html>`;

const relatedES = `    <div class="related-grid">
      <a href="/es/learn/">→ Aprender los 50 estados</a>
      <a href="/es/learn/capitales-de-estados/">→ Las 50 capitales</a>
      <a href="/es/learn/state-abbreviations/">→ Abreviaturas USPS</a>
      <a href="/es/learn/regiones-de-eeuu/">→ Las 4 regiones de EE.UU.</a>
      <a href="/es/learn/banderas-de-estados/">→ Banderas de los estados</a>
      <a href="/es/learn/colonias-originales/">→ Las 13 colonias originales</a>
      <a href="/es/learn/crucigrama-estados/">→ Ayuda para crucigramas</a>
      <a href="/es/learn/largest-states/">→ Los estados más grandes</a>
      <a href="/es/learn/no-income-tax/">→ Estados sin impuesto sobre la renta</a>
      <a href="/es/learn/landlocked-states/">→ Estados sin salida al mar</a>
    </div>`;

const relatedFR = `    <div class="related-grid">
      <a href="/fr/learn/">→ Apprendre les 50 états</a>
      <a href="/fr/learn/capitales-des-etats/">→ Les 50 capitales</a>
      <a href="/fr/learn/regions-des-etats-unis/">→ Les 4 régions des États-Unis</a>
      <a href="/fr/learn/drapeaux-des-etats/">→ Les drapeaux des états</a>
      <a href="/fr/learn/13-colonies/">→ Les 13 colonies originelles</a>
      <a href="/fr/learn/state-abbreviations/">→ Abréviations USPS</a>
      <a href="/fr/learn/largest-states/">→ Les plus grands états</a>
      <a href="/fr/learn/landlocked-states/">→ États sans accès à la mer</a>
      <a href="/fr/learn/states-bordering-canada/">→ États frontaliers du Canada</a>
      <a href="/fr/learn/no-income-tax/">→ États sans impôt sur le revenu</a>
    </div>`;

// ── page wrapper templates ───────────────────────────────────────────────
function wrapES(slug, title, desc, keywords, h1, sub, body, faqJson, breadcrumbName) {
  return `<!DOCTYPE html>
<html lang="es">
<head>
  <meta charset="UTF-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0, viewport-fit=cover">
  <meta name="theme-color" content="#0F2147">
  <meta name="color-scheme" content="light">

  <title>${title}</title>
  <meta name="description" content="${desc}">
  <meta name="keywords" content="${keywords}">
  <meta name="robots" content="index, follow, max-image-preview:large">
${hreflangES(slug)}
  <link rel="icon" type="image/svg+xml" href="/favicon.svg?v=5">
  <link rel="stylesheet" href="/css/style.css?v=17">

  <meta property="og:type" content="article">
  <meta property="og:title" content="${h1}">
  <meta property="og:description" content="${desc.slice(0, 160)}">
  <meta property="og:url" content="https://statedoku.com/es/learn/${slug}/">
  <meta property="og:image" content="https://statedoku.com/og/og-learn-state-capitals.png">
  <meta property="og:locale" content="es_ES">
  <meta name="twitter:card" content="summary_large_image">
  <meta name="twitter:title" content="${h1}">
  <meta name="twitter:description" content="${desc.slice(0, 160)}">
  <meta name="twitter:image" content="https://statedoku.com/og/og-learn-state-capitals.png">

  <style>${sharedStyles}</style>
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
  {"@type":"ListItem","position":3,"name":"${breadcrumbName}","item":"https://statedoku.com/es/learn/${slug}/"}
]}
</script>
<script type="application/ld+json">${faqJson}</script>

<main>
  <section class="lt-hero">
    <h1>${h1}</h1>
    <p class="sub">${sub}</p>
  </section>

  <article class="lt-main">
${body}

    <h2>Guías relacionadas</h2>
${relatedES}
  </article>
</main>

${footerES}`;
}

function wrapFR(slug, title, desc, keywords, h1, sub, body, faqJson, breadcrumbName) {
  return `<!DOCTYPE html>
<html lang="fr">
<head>
  <meta charset="UTF-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0, viewport-fit=cover">
  <meta name="theme-color" content="#0F2147">
  <meta name="color-scheme" content="light">

  <title>${title}</title>
  <meta name="description" content="${desc}">
  <meta name="keywords" content="${keywords}">
  <meta name="robots" content="index, follow, max-image-preview:large">
${hreflangFR(slug)}
  <link rel="icon" type="image/svg+xml" href="/favicon.svg?v=5">
  <link rel="stylesheet" href="/css/style.css?v=17">

  <meta property="og:type" content="article">
  <meta property="og:title" content="${h1}">
  <meta property="og:description" content="${desc.slice(0, 160)}">
  <meta property="og:url" content="https://statedoku.com/fr/learn/${slug}/">
  <meta property="og:image" content="https://statedoku.com/og/og-learn-state-capitals.png">
  <meta property="og:locale" content="fr_FR">
  <meta name="twitter:card" content="summary_large_image">
  <meta name="twitter:title" content="${h1}">
  <meta name="twitter:description" content="${desc.slice(0, 160)}">
  <meta name="twitter:image" content="https://statedoku.com/og/og-learn-state-capitals.png">

  <style>${sharedStyles}</style>
</head>
<body class="legal-body">

<header>
  <a href="/fr/" class="logo">State<em>doku</em> <span class="logo-flag">🇺🇸</span></a>
  <nav class="nav-actions"><a href="/fr/learn/" style="color:var(--text-2);text-decoration:none;font-weight:700;font-size:.88rem;">← Apprendre</a></nav>
</header>

<script type="application/ld+json">
{"@context":"https://schema.org","@type":"BreadcrumbList","itemListElement":[
  {"@type":"ListItem","position":1,"name":"Accueil","item":"https://statedoku.com/fr/"},
  {"@type":"ListItem","position":2,"name":"Apprendre","item":"https://statedoku.com/fr/learn/"},
  {"@type":"ListItem","position":3,"name":"${breadcrumbName}","item":"https://statedoku.com/fr/learn/${slug}/"}
]}
</script>
<script type="application/ld+json">${faqJson}</script>

<main>
  <section class="lt-hero">
    <h1>${h1}</h1>
    <p class="sub">${sub}</p>
  </section>

  <article class="lt-main">
${body}

    <h2>Guides associés</h2>
${relatedFR}
  </article>
</main>

${footerFR}`;
}

const faq = (qa) => JSON.stringify({
  '@context': 'https://schema.org',
  '@type': 'FAQPage',
  mainEntity: qa.map(([q, a]) => ({ '@type': 'Question', name: q, acceptedAnswer: { '@type': 'Answer', text: a } })),
});

// ════════════════════════════════════════════════════════════════════════
// ES: 6 new pages
// ════════════════════════════════════════════════════════════════════════

const ES_STATE_CAPITALS = [
  ['AL', 'Montgomery'], ['AK', 'Juneau'], ['AZ', 'Phoenix'], ['AR', 'Little Rock'],
  ['CA', 'Sacramento'], ['CO', 'Denver'], ['CT', 'Hartford'], ['DE', 'Dover'],
  ['FL', 'Tallahassee'], ['GA', 'Atlanta'], ['HI', 'Honolulu'], ['ID', 'Boise'],
  ['IL', 'Springfield'], ['IN', 'Indianápolis'], ['IA', 'Des Moines'], ['KS', 'Topeka'],
  ['KY', 'Frankfort'], ['LA', 'Baton Rouge'], ['ME', 'Augusta'], ['MD', 'Annapolis'],
];

// 1. /es/learn/colegio-electoral/
const esColegio = wrapES(
  'colegio-electoral',
  'Colegio Electoral de EE.UU. — cómo funciona, votos por estado (2026) | Statedoku',
  'El Colegio Electoral elige al presidente de EE.UU. con 538 votos: California 54, Texas 40, Florida 30, Nueva York 28. Cómo funciona, votos por estado, mapa, y por qué importa.',
  'colegio electoral estados unidos, electoral college eeuu, votos electorales por estado, elecciones presidenciales eeuu, california 54 votos',
  'El Colegio Electoral de EE.UU.',
  'Cómo se elige al presidente de Estados Unidos. 538 votos electorales, 270 para ganar, y por qué California vale 54 mientras Wyoming vale 3.',
  `    <p>En Estados Unidos, el presidente NO se elige por voto popular directo. Se elige a través del <strong>Colegio Electoral</strong>: un sistema con <strong>538 votos electorales</strong> repartidos entre los 50 estados y Washington DC. Para ganar, un candidato necesita <strong>270 votos electorales</strong>.</p>

    <h2>Cómo se calculan los votos por estado</h2>
    <p>El número de votos electorales de cada estado = número de representantes en la Cámara + 2 senadores. Como cada estado tiene 2 senadores y al menos 1 representante, el mínimo es 3 votos. El máximo lo tiene California con 54.</p>

    <h2>Votos electorales por estado (2024-2028)</h2>
    <table class="lt">
      <thead><tr><th>Estado</th><th>Votos</th><th>Estado</th><th>Votos</th></tr></thead>
      <tbody>
        <tr><td>California</td><td><strong>54</strong></td><td>Carolina del Norte</td><td>16</td></tr>
        <tr><td>Texas</td><td><strong>40</strong></td><td>Michigan</td><td>15</td></tr>
        <tr><td>Florida</td><td><strong>30</strong></td><td>Nueva Jersey</td><td>14</td></tr>
        <tr><td>Nueva York</td><td>28</td><td>Virginia</td><td>13</td></tr>
        <tr><td>Pensilvania</td><td>19</td><td>Washington</td><td>12</td></tr>
        <tr><td>Illinois</td><td>19</td><td>Arizona</td><td>11</td></tr>
        <tr><td>Ohio</td><td>17</td><td>Massachusetts</td><td>11</td></tr>
        <tr><td>Georgia</td><td>16</td><td>Indiana, Tennessee</td><td>11 cada uno</td></tr>
        <tr><td colspan="4" style="font-style:italic;color:var(--text-2);text-align:center;">... y 32 estados restantes con 3 a 10 votos.</td></tr>
      </tbody>
    </table>

    <h2>Los 7 estados con solo 3 votos</h2>
    <p>El mínimo (3 votos) lo tienen: <strong>Alaska, Delaware, Dakota del Norte, Dakota del Sur, Vermont, Wyoming</strong>, más <strong>Washington DC</strong>. Wyoming, con apenas 580,000 habitantes, tiene tanto peso por voto como un estado mucho más poblado proporcionalmente.</p>

    <h2>"Winner takes all" (excepto en 2 estados)</h2>
    <p>En 48 de 50 estados, el candidato que gana el voto popular del estado se lleva TODOS sus votos electorales. Las 2 excepciones son:</p>
    <ul>
      <li><strong>Nebraska</strong> (5 votos): 2 por el ganador estatal + 3 por distrito congresional.</li>
      <li><strong>Maine</strong> (4 votos): mismo sistema.</li>
    </ul>
    <p>Por eso un distrito de Omaha (Nebraska) puede dar 1 voto demócrata mientras el resto del estado vota republicano.</p>

    <h2>Por qué algunos presidentes ganan sin el voto popular</h2>
    <p>Como los votos no son proporcionales (Wyoming = 3 votos / 580k hab = 1 voto cada 193k; California = 54 / 39M = 1 voto cada 722k), un candidato puede perder el voto popular nacional pero ganar el Colegio Electoral. Ha pasado 5 veces:</p>
    <ul>
      <li>2016: Trump gana con menos votos populares que Clinton.</li>
      <li>2000: Bush gana con menos votos populares que Gore (decidido por Florida).</li>
      <li>1888, 1876, 1824: también.</li>
    </ul>

    <div class="cta-card">
      <h3>Aprende los estados clave jugando</h3>
      <p>Statedoku usa "Swing state" o "Estado con 10+ votos electorales" como pistas en su puzzle diario. Aprende geografía electoral sin estudiarla.</p>
      <a href="/es/">Jugar el puzzle de hoy →</a>
    </div>

    <h2>Preguntas frecuentes</h2>
    <details><summary><strong>¿Cuántos votos electorales tiene California?</strong></summary><p>54 votos en el ciclo 2024-2028. Es el estado con más votos.</p></details>
    <details><summary><strong>¿Cuántos votos se necesitan para ganar?</strong></summary><p>270 de 538. Mayoría absoluta.</p></details>
    <details><summary><strong>¿Qué pasa con un empate 269-269?</strong></summary><p>La Cámara de Representantes elige al presidente. Cada estado tiene 1 voto (no proporcional). Pasó en 1800 (Jefferson) y 1824 (John Quincy Adams).</p></details>
    <details><summary><strong>¿Por qué Washington DC tiene 3 votos?</strong></summary><p>La 23ª Enmienda (1961) le dio 3 votos electorales a DC, aunque no es un estado.</p></details>
    <details><summary><strong>¿Puede un elector votar en contra del candidato ganador?</strong></summary><p>Sí: se llaman "electores infieles" (faithless electors). Pero la mayoría de estados los penalizan o anulan su voto. Han pasado pocos casos sin cambiar el resultado.</p></details>
`,
  faq([
    ['¿Cuántos votos electorales tiene EE.UU.?', '538 votos electorales en total. 270 son necesarios para ganar la presidencia.'],
    ['¿Cuál es el estado con más votos electorales?', 'California, con 54 votos electorales en el ciclo 2024-2028.'],
    ['¿Qué estados tienen solo 3 votos electorales?', 'Alaska, Delaware, Dakota del Norte, Dakota del Sur, Vermont, Wyoming, y Washington DC.'],
    ['¿Por qué un presidente puede ganar sin el voto popular?', 'Porque los votos electorales no son proporcionales a la población. Wyoming tiene 1 voto por cada 193k habitantes, California 1 por cada 722k. Ha pasado 5 veces: 2016 (Trump), 2000 (Bush), 1888, 1876, 1824.'],
  ]),
  'El Colegio Electoral'
);

// 2. /es/learn/estados-bisagra/ (swing states)
const esSwing = wrapES(
  'estados-bisagra',
  'Estados bisagra de EE.UU. — los 7 swing states de las elecciones (2026) | Statedoku',
  'Los 7 estados bisagra que deciden las elecciones presidenciales de EE.UU.: Pensilvania, Michigan, Wisconsin, Georgia, Arizona, Nevada, Carolina del Norte. Por qué importan y cuántos votos electorales tienen.',
  'estados bisagra eeuu, swing states, estados pendulares, pensilvania elecciones, georgia elecciones, arizona elecciones, michigan elecciones',
  'Los estados bisagra (swing states)',
  'Los 7 estados que deciden las elecciones presidenciales de EE.UU. Por qué importan más que los 43 restantes.',
  `    <p>En las elecciones presidenciales de EE.UU., la mayoría de estados están "decididos" antes de empezar la campaña. California vota demócrata, Wyoming republicano, etc. Pero <strong>7 estados</strong> son lo suficientemente competitivos para cambiar de bando: los <strong>estados bisagra</strong> o <strong>swing states</strong>. Estos 7 deciden quién gana.</p>

    <h2>Los 7 estados bisagra (ciclo 2024)</h2>
    <table class="lt">
      <thead><tr><th>Estado</th><th>Votos electorales</th><th>Última tendencia</th></tr></thead>
      <tbody>
        <tr><td><strong>Pensilvania</strong></td><td>19</td><td>Trump 2016, Biden 2020, Trump 2024</td></tr>
        <tr><td><strong>Georgia</strong></td><td>16</td><td>Biden 2020, Trump 2024</td></tr>
        <tr><td><strong>Carolina del Norte</strong></td><td>16</td><td>Trump 2016/2020/2024</td></tr>
        <tr><td><strong>Michigan</strong></td><td>15</td><td>Trump 2016, Biden 2020, Trump 2024</td></tr>
        <tr><td><strong>Arizona</strong></td><td>11</td><td>Biden 2020, Trump 2024</td></tr>
        <tr><td><strong>Wisconsin</strong></td><td>10</td><td>Trump 2016, Biden 2020, Trump 2024</td></tr>
        <tr><td><strong>Nevada</strong></td><td>6</td><td>Demócrata desde 2008, Trump 2024</td></tr>
      </tbody>
    </table>
    <p>Total: <strong>93 votos electorales</strong>. Suficiente para determinar quién llega a los 270.</p>

    <h2>Por qué son bisagra</h2>
    <h3>Pensilvania</h3>
    <p>Mezcla diversa: zonas industriales en declive (Pittsburgh, Erie) votando republicano, suburbios de Filadelfia votando demócrata. Decisivo en 2016, 2020, 2024.</p>

    <h3>Georgia</h3>
    <p>Cambió en 2020 por el crecimiento de Atlanta y su periferia (con muchos votantes negros y suburbios diversos). Stacey Abrams organizó masivamente. Volvió rojo en 2024.</p>

    <h3>Arizona</h3>
    <p>El crecimiento de Phoenix y la migración interna lo transformaron. Voto latino importante. Biden ganó por 10,000 votos en 2020.</p>

    <h3>Michigan, Wisconsin (Rust Belt)</h3>
    <p>Estados industriales donde el voto trabajador blanco basculó hacia Trump. Decisivos por márgenes ínfimos cada ciclo.</p>

    <h3>Carolina del Norte</h3>
    <p>El "estado bisagra que casi nunca se mueve". Republicano en cada elección desde 2008 (excepto Obama 2008), pero siempre por márgenes pequeños (1-4%).</p>

    <h3>Nevada</h3>
    <p>Voto latino (~30% del estado), trabajadores de hostelería en Las Vegas, jubilados blancos. Demócrata desde 2008 hasta 2024.</p>

    <h2>Estados que YA NO son bisagra</h2>
    <ul>
      <li><strong>Florida:</strong> bisagra histórico hasta 2016, hoy republicano sólido (Trump +13 en 2024).</li>
      <li><strong>Ohio:</strong> bisagra hasta 2016, hoy republicano (Trump +11 en 2024).</li>
      <li><strong>Iowa:</strong> votó Obama dos veces, hoy republicano (Trump +13 en 2024).</li>
    </ul>

    <h2>Posibles futuros estados bisagra</h2>
    <ul>
      <li><strong>Texas:</strong> 40 votos electorales. Crecimiento del voto latino y suburbano podría hacerlo competitivo después de 2028.</li>
      <li><strong>Florida:</strong> si la tendencia republicana se invierte.</li>
      <li><strong>Minnesota:</strong> demócrata pero por márgenes menores cada ciclo.</li>
    </ul>

    <div class="cta-card">
      <h3>Conoce los estados políticamente</h3>
      <p>Statedoku usa "Swing state 2024" o "Estado del Rust Belt" como pistas en el puzzle. Geografía electoral sin estudiar.</p>
      <a href="/es/">Jugar el puzzle de hoy →</a>
    </div>

    <h2>Preguntas frecuentes</h2>
    <details><summary><strong>¿Cuántos estados bisagra hay?</strong></summary><p>Generalmente 7 en el ciclo actual: Pensilvania, Michigan, Wisconsin, Georgia, Carolina del Norte, Arizona, Nevada.</p></details>
    <details><summary><strong>¿Florida sigue siendo bisagra?</strong></summary><p>No desde 2020. Hoy es republicano sólido (Trump ganó por 13 puntos en 2024).</p></details>
    <details><summary><strong>¿Cuál es el estado bisagra con más votos electorales?</strong></summary><p>Pensilvania, con 19 votos. Por eso es el "trofeo" más buscado en cada elección.</p></details>
    <details><summary><strong>¿Por qué Texas no es bisagra todavía?</strong></summary><p>Por sus 40 votos electorales sería el más grande, pero los republicanos todavía ganan por 5-13 puntos. Está en la lista de "futuros bisagra" si la demografía sigue cambiando.</p></details>
`,
  faq([
    ['¿Cuáles son los 7 estados bisagra de EE.UU.?', 'Pensilvania, Michigan, Wisconsin, Georgia, Carolina del Norte, Arizona, Nevada.'],
    ['¿Cuántos votos electorales suman los swing states?', '93 votos en total (PA 19, GA 16, NC 16, MI 15, AZ 11, WI 10, NV 6). Suficiente para determinar quién llega a 270.'],
    ['¿Florida sigue siendo un estado bisagra?', 'No. Florida votó republicano por 13 puntos en 2024. Ya no se considera bisagra.'],
    ['¿Cuál es el swing state con más peso?', 'Pensilvania, con 19 votos electorales. Es el más codiciado en cada elección presidencial.'],
  ]),
  'Estados bisagra'
);

// 3. /es/learn/territorios-eeuu/
const esTerritorios = wrapES(
  'territorios-eeuu',
  'Territorios de EE.UU. — Puerto Rico, Guam, Islas Vírgenes, Samoa, Marianas (2026) | Statedoku',
  'Los 5 territorios habitados de Estados Unidos: Puerto Rico (3.2M hab), Guam, Islas Vírgenes EE.UU., Samoa Americana y las Islas Marianas del Norte. Estatus político, ciudadanía, derechos.',
  'territorios estados unidos, puerto rico territorio, guam estados unidos, islas virgenes eeuu, samoa americana, marianas norte, estado 51',
  'Los territorios de EE.UU.',
  'Puerto Rico, Guam, Samoa Americana, Islas Vírgenes y Marianas del Norte. Los 5 territorios habitados de Estados Unidos: estatus, ciudadanía, y por qué no son estados.',
  `    <p>Estados Unidos tiene <strong>5 territorios habitados</strong> que no son estados. Sus habitantes son ciudadanos estadounidenses (excepto Samoa Americana) pero no pueden votar por el presidente y no tienen senadores. Es el tema más controvertido del estatus político estadounidense.</p>

    <h2>Los 5 territorios habitados</h2>
    <table class="lt">
      <thead><tr><th>Territorio</th><th>Capital</th><th>Población</th><th>Estatus</th></tr></thead>
      <tbody>
        <tr><td><strong>Puerto Rico</strong></td><td>San Juan</td><td>~3.2M</td><td>Commonwealth</td></tr>
        <tr><td><strong>Guam</strong></td><td>Hagåtña</td><td>~165k</td><td>Territorio no incorporado</td></tr>
        <tr><td><strong>Islas Vírgenes de EE.UU.</strong></td><td>Charlotte Amalie</td><td>~87k</td><td>Territorio no incorporado</td></tr>
        <tr><td><strong>Marianas del Norte</strong></td><td>Saipán</td><td>~47k</td><td>Commonwealth</td></tr>
        <tr><td><strong>Samoa Americana</strong></td><td>Pago Pago</td><td>~45k</td><td>Territorio no incorporado, no organizado</td></tr>
      </tbody>
    </table>

    <h2>Puerto Rico</h2>
    <p>El territorio más grande con diferencia. Adquirido en 1898 después de la Guerra Hispano-Estadounidense. Sus habitantes son <strong>ciudadanos estadounidenses</strong> desde la Ley Jones de 1917. Pero:</p>
    <ul>
      <li>No pueden votar por presidente desde Puerto Rico (sí desde un estado).</li>
      <li>No tienen senadores ni representantes con voto en el Congreso.</li>
      <li>Tienen 1 comisionado residente con voz pero sin voto.</li>
      <li>Han votado en 6 referendos sobre su estatus. En 2020 y 2024 ganó la opción "estadidad" pero el Congreso no actúa.</li>
    </ul>

    <h2>Guam</h2>
    <p>Isla del Pacífico, adquirida en 1898. Base militar estratégica. 30% del territorio es ocupado por el Departamento de Defensa. Ciudadanía estadounidense desde 1950. Misma situación electoral que Puerto Rico.</p>

    <h2>Islas Vírgenes de EE.UU.</h2>
    <p>3 islas principales en el Caribe (Saint Thomas, Saint John, Saint Croix). Compradas a Dinamarca en 1917 por 25 millones de dólares. Ciudadanía desde 1927.</p>

    <h2>Samoa Americana</h2>
    <p>El único territorio donde los nacidos NO son ciudadanos estadounidenses por defecto: son "nacionales estadounidenses" (US nationals). Pueden vivir y trabajar libremente en EE.UU. pero no votar. La Corte Suprema declinó cambiar esto en 2022.</p>

    <h2>Marianas del Norte</h2>
    <p>Commonwealth desde 1986 (más reciente). 14 islas en el Pacífico. Saipán es la principal. La isla de Tinián fue el punto de despegue de los aviones que lanzaron las bombas atómicas en Hiroshima y Nagasaki en 1945.</p>

    <h2>¿Por qué Puerto Rico no es estado?</h2>
    <p>La estadidad requiere aprobación del Congreso de EE.UU. (artículo IV, sección 3 de la Constitución). Razones políticas que retrasan la decisión:</p>
    <ul>
      <li>Equilibrio partidista (PR votaría probablemente demócrata, dando 4 votos electorales nuevos y 2 senadores).</li>
      <li>División interna en PR: ~50% pro-estadidad, ~45% pro-statu-quo o independencia.</li>
      <li>Costos: el estatus actual tiene ventajas fiscales para PR.</li>
    </ul>

    <h2>El "estado 51"</h2>
    <p>Si PR se convirtiera en estado, sería el 51. La bandera estadounidense pasaría de 50 a 51 estrellas. La última vez que se añadió una estrella fue en 1959 (Hawái).</p>

    <div class="cta-card">
      <h3>Aprende los 50 estados primero</h3>
      <p>Statedoku te enseña los 50 estados actuales con su puzzle diario. Si llegan más en el futuro, los añadiremos.</p>
      <a href="/es/">Jugar el puzzle de hoy →</a>
    </div>

    <h2>Preguntas frecuentes</h2>
    <details><summary><strong>¿Cuántos territorios habitados tiene EE.UU.?</strong></summary><p>5: Puerto Rico, Guam, Islas Vírgenes, Samoa Americana, Marianas del Norte. Más una decena de territorios deshabitados.</p></details>
    <details><summary><strong>¿Los puertorriqueños son ciudadanos de EE.UU.?</strong></summary><p>Sí, desde 1917 (Ley Jones-Shafroth). Pero no pueden votar por presidente mientras vivan en Puerto Rico.</p></details>
    <details><summary><strong>¿Cuál es la diferencia entre estado y territorio?</strong></summary><p>Los estados tienen 2 senadores, representantes con voto, votos electorales y soberanía propia. Los territorios no tienen ninguno de los anteriores. Solo un comisionado residente con voz sin voto.</p></details>
    <details><summary><strong>¿Será Puerto Rico el estado 51?</strong></summary><p>Posible. Ha votado a favor de la estadidad en los 2 últimos referendos (2020 y 2024), pero solo el Congreso de EE.UU. puede aprobarlo. No hay timeline oficial.</p></details>
    <details><summary><strong>¿Washington DC es un territorio?</strong></summary><p>No, es un distrito federal especial. Tiene 3 votos electorales (desde 1961) pero tampoco tiene senadores ni representante con voto.</p></details>
`,
  faq([
    ['¿Cuáles son los territorios de Estados Unidos?', 'Los 5 territorios habitados son: Puerto Rico, Guam, Islas Vírgenes de EE.UU., Samoa Americana, y las Islas Marianas del Norte.'],
    ['¿Puerto Rico es parte de Estados Unidos?', 'Sí, Puerto Rico es un territorio (Commonwealth) de Estados Unidos desde 1898. Sus 3.2 millones de habitantes son ciudadanos estadounidenses pero no votan por presidente.'],
    ['¿Cuántos estados tendría EE.UU. si Puerto Rico fuera estado?', '51 estados. La bandera tendría 51 estrellas en lugar de 50.'],
    ['¿Los habitantes de Samoa Americana son ciudadanos?', 'No por defecto. Son "nacionales estadounidenses" (US nationals): pueden vivir y trabajar en EE.UU. pero deben naturalizarse para ser ciudadanos plenos.'],
  ]),
  'Los territorios de EE.UU.'
);

// 4. /es/learn/zonas-horarias-eeuu/
const esZonas = wrapES(
  'zonas-horarias-eeuu',
  'Zonas horarias de EE.UU. — 6 husos horarios, mapa, diferencia con México y España (2026) | Statedoku',
  'Estados Unidos tiene 6 zonas horarias principales: Este, Central, Montaña, Pacífico, Alaska, Hawái-Aleutianas. Mapa, qué estados están en cada una, diferencia con México, España, Argentina.',
  'zonas horarias estados unidos, husos horarios eeuu, hora california, hora nueva york, hora chicago, diferencia hora españa mexico',
  'Las zonas horarias de EE.UU.',
  '6 husos horarios para 50 estados. Qué hora es en California cuando son las 12h en Nueva York. Diferencias con España, México y Argentina.',
  `    <p>Estados Unidos cubre <strong>6 zonas horarias principales</strong>. Cuando son las 12h del mediodía en Nueva York, son las 9h en Los Ángeles, las 8h en Anchorage y las 7h en Honolulu.</p>

    <h2>Las 6 zonas horarias (continente + Alaska + Hawái)</h2>
    <table class="lt">
      <thead><tr><th>Zona</th><th>UTC</th><th>Estados principales</th><th>Ciudades clave</th></tr></thead>
      <tbody>
        <tr><td><strong>Este (Eastern)</strong></td><td>UTC-5</td><td>NY, FL, GA, PA, NC, VA, MA, OH, MI, IN…</td><td>Nueva York, Miami, Atlanta, Washington DC, Boston, Detroit</td></tr>
        <tr><td><strong>Central</strong></td><td>UTC-6</td><td>TX, IL, MO, MN, WI, IA, KS, OK, LA, AR, AL, MS, TN…</td><td>Chicago, Houston, Dallas, Nueva Orleans, Memphis</td></tr>
        <tr><td><strong>Montaña (Mountain)</strong></td><td>UTC-7</td><td>CO, UT, NM, MT, WY, ID, AZ (sin horario verano)</td><td>Denver, Salt Lake City, Phoenix, Albuquerque</td></tr>
        <tr><td><strong>Pacífico</strong></td><td>UTC-8</td><td>CA, WA, OR, NV</td><td>Los Ángeles, San Francisco, Seattle, Las Vegas</td></tr>
        <tr><td><strong>Alaska</strong></td><td>UTC-9</td><td>Alaska</td><td>Anchorage, Juneau, Fairbanks</td></tr>
        <tr><td><strong>Hawái-Aleutianas</strong></td><td>UTC-10</td><td>Hawái, parte oeste de Alaska</td><td>Honolulu, Hilo</td></tr>
      </tbody>
    </table>

    <h2>Diferencia horaria con países hispanohablantes (en horario de invierno)</h2>
    <table class="lt">
      <thead><tr><th>Cuando son las 12h en…</th><th>Madrid</th><th>Ciudad de México</th><th>Buenos Aires</th><th>Bogotá</th></tr></thead>
      <tbody>
        <tr><td>Nueva York (Este)</td><td>18h</td><td>11h</td><td>14h</td><td>12h</td></tr>
        <tr><td>Chicago (Central)</td><td>19h</td><td>12h</td><td>15h</td><td>13h</td></tr>
        <tr><td>Denver (Montaña)</td><td>20h</td><td>13h</td><td>16h</td><td>14h</td></tr>
        <tr><td>Los Ángeles (Pacífico)</td><td>21h</td><td>14h</td><td>17h</td><td>15h</td></tr>
      </tbody>
    </table>
    <p><em>Nota: el horario de verano (DST) se aplica en EE.UU. de marzo a noviembre. Madrid y CDMX también cambian, Buenos Aires y Bogotá no. Las diferencias varían según la fecha.</em></p>

    <h2>Estados que cruzan 2 zonas horarias</h2>
    <ul>
      <li><strong>Florida:</strong> mayoría Este, pero el panhandle oeste (Pensacola) en Central.</li>
      <li><strong>Indiana:</strong> mayoría Este, esquina noroeste y suroeste en Central.</li>
      <li><strong>Kentucky:</strong> dividido Este/Central.</li>
      <li><strong>Tennessee:</strong> dividido Este/Central.</li>
      <li><strong>Michigan:</strong> mayoría Este, esquina noroeste de la Península Superior en Central.</li>
      <li><strong>Idaho:</strong> norte Pacífico, sur Montaña.</li>
      <li><strong>Oregón:</strong> mayoría Pacífico, esquina sureste (condado de Malheur) Montaña.</li>
      <li><strong>Dakota del Norte y del Sur:</strong> divididos Central/Montaña.</li>
      <li><strong>Nebraska, Kansas, Texas:</strong> divididos Central/Montaña.</li>
      <li><strong>Alaska:</strong> mayoría Alaska, esquina oeste Hawái-Aleutianas.</li>
    </ul>

    <h2>Arizona y el horario de verano</h2>
    <p><strong>Arizona NO aplica el horario de verano</strong> (excepto la Nación Navajo). En verano, Arizona está en el mismo horario que California (Pacífico) en lugar de Mountain. Hawái tampoco aplica DST.</p>

    <h2>El cambio de hora en EE.UU.</h2>
    <ul>
      <li><strong>Inicio horario verano:</strong> 2º domingo de marzo. Se adelanta 1h ("spring forward").</li>
      <li><strong>Fin horario verano:</strong> 1er domingo de noviembre. Se atrasa 1h ("fall back").</li>
      <li>Estados que NO aplican DST: Arizona (excepto Navajo), Hawái, y los territorios (PR, Guam, etc.).</li>
      <li>Florida, California y otros estados han votado en sus parlamentos por DST permanente, pero necesitan aprobación federal (no aprobada todavía).</li>
    </ul>

    <div class="cta-card">
      <h3>Aprende qué estados están en cada zona</h3>
      <p>Statedoku usa "Zona Pacífico" o "Zona Central" como pistas. Geografía y horarios al mismo tiempo.</p>
      <a href="/es/">Jugar el puzzle de hoy →</a>
    </div>

    <h2>Preguntas frecuentes</h2>
    <details><summary><strong>¿Cuántas zonas horarias tiene EE.UU.?</strong></summary><p>6 en territorios habitados: Este, Central, Montaña, Pacífico, Alaska, Hawái-Aleutianas. Más Samoa Americana (UTC-11), Chamorro/Guam (UTC+10) y otros.</p></details>
    <details><summary><strong>¿Cuántas horas de diferencia hay entre Nueva York y Los Ángeles?</strong></summary><p>3 horas. Cuando son las 9h en Los Ángeles son las 12h en Nueva York. Esto se mantiene durante todo el año.</p></details>
    <details><summary><strong>¿Qué hora es en Hawái cuando son las 12h en Madrid?</strong></summary><p>En invierno: 1h de la madrugada del MISMO día (Madrid es UTC+1, Hawái UTC-10 = 11 horas atrás). En verano español es 12h de medianoche.</p></details>
    <details><summary><strong>¿Por qué Arizona no cambia de hora?</strong></summary><p>Decisión tomada en 1968 para evitar las tardes largas con calor extremo. Más sentido económico en el desierto: prefieren atardeceres más tempranos.</p></details>
`,
  faq([
    ['¿Cuántas zonas horarias tiene Estados Unidos?', '6 zonas horarias principales: Este (UTC-5), Central (UTC-6), Montaña (UTC-7), Pacífico (UTC-8), Alaska (UTC-9), Hawái-Aleutianas (UTC-10).'],
    ['¿Qué diferencia horaria hay entre Nueva York y Madrid?', '6 horas en invierno (Madrid es +6). En verano son 6 horas también porque ambos aplican el cambio de hora.'],
    ['¿Qué diferencia horaria hay entre California y México?', 'Los Ángeles (Pacífico) y Ciudad de México (Centro): 2 horas en invierno, 1 hora en verano.'],
    ['¿Arizona aplica el horario de verano?', 'No, Arizona NO aplica el horario de verano (DST), excepto la Nación Navajo. En verano coincide con California.'],
  ]),
  'Zonas horarias de EE.UU.'
);

// 5. /es/learn/apodos-de-estados/
const esApodos = wrapES(
  'apodos-de-estados',
  'Apodos de los 50 estados de EE.UU. — la lista completa (2026) | Statedoku',
  'Los apodos oficiales de los 50 estados: Texas "Lone Star State", California "Golden State", Florida "Sunshine State", Alaska "Last Frontier"... Historia y significado de cada uno.',
  'apodos estados unidos, sobrenombres estados eeuu, lone star state, golden state, sunshine state, apodo california, apodo texas',
  'Apodos de los 50 estados',
  'Lone Star, Golden State, Sunshine State, Bluegrass... La lista completa de apodos oficiales y su historia.',
  `    <p>Cada uno de los 50 estados de EE.UU. tiene al menos un <strong>apodo oficial o popular</strong>. Aparecen en matrículas, monedas, banderas y publicidad turística. Cuentan la historia, geografía o cultura del estado.</p>

    <h2>Tabla completa de apodos por estado</h2>
    <table class="lt">
      <thead><tr><th>Estado</th><th>Apodo</th><th>Significado</th></tr></thead>
      <tbody>
        <tr><td>Alabama</td><td>Yellowhammer State</td><td>Por el pájaro amarillo, símbolo de la Guerra Civil.</td></tr>
        <tr><td>Alaska</td><td>The Last Frontier</td><td>El último territorio inexplorado.</td></tr>
        <tr><td>Arizona</td><td>Grand Canyon State</td><td>Por el Gran Cañón del Colorado.</td></tr>
        <tr><td>Arkansas</td><td>Natural State</td><td>Por su naturaleza salvaje.</td></tr>
        <tr><td>California</td><td>Golden State</td><td>Por la fiebre del oro de 1849 y la luz dorada.</td></tr>
        <tr><td>Colorado</td><td>Centennial State</td><td>Admitido en 1876, centenario de la independencia.</td></tr>
        <tr><td>Connecticut</td><td>Constitution State</td><td>Por las "Fundamental Orders of Connecticut" (1639), primera constitución escrita.</td></tr>
        <tr><td>Delaware</td><td>First State</td><td>Primero en ratificar la Constitución (1787).</td></tr>
        <tr><td>Florida</td><td>Sunshine State</td><td>Por el clima.</td></tr>
        <tr><td>Georgia</td><td>Peach State</td><td>Por sus duraznos.</td></tr>
        <tr><td>Hawái</td><td>Aloha State</td><td>Por el saludo hawaiano.</td></tr>
        <tr><td>Idaho</td><td>Gem State</td><td>Por sus minerales y piedras preciosas.</td></tr>
        <tr><td>Illinois</td><td>Prairie State</td><td>Por las grandes praderas.</td></tr>
        <tr><td>Indiana</td><td>Hoosier State</td><td>Origen incierto, pero "Hoosier" es el gentilicio popular.</td></tr>
        <tr><td>Iowa</td><td>Hawkeye State</td><td>Por un líder Sauk llamado Black Hawk.</td></tr>
        <tr><td>Kansas</td><td>Sunflower State</td><td>Por los girasoles, flor estatal.</td></tr>
        <tr><td>Kentucky</td><td>Bluegrass State</td><td>Por el pasto bluegrass que crece en sus prados.</td></tr>
        <tr><td>Luisiana</td><td>Pelican State</td><td>Por el pelícano marrón, símbolo estatal.</td></tr>
        <tr><td>Maine</td><td>Pine Tree State</td><td>Por sus bosques de pinos blancos.</td></tr>
        <tr><td>Maryland</td><td>Old Line State</td><td>Por la "Maryland Line" del ejército revolucionario.</td></tr>
        <tr><td>Massachusetts</td><td>Bay State</td><td>Por la Bahía de Massachusetts.</td></tr>
        <tr><td>Michigan</td><td>Great Lake State</td><td>Por los 4 Grandes Lagos que lo rodean.</td></tr>
        <tr><td>Minnesota</td><td>Land of 10,000 Lakes</td><td>Realmente tiene más de 11,000 lagos.</td></tr>
        <tr><td>Misisipi</td><td>Magnolia State</td><td>Por la magnolia, árbol estatal.</td></tr>
        <tr><td>Misuri</td><td>Show Me State</td><td>"Muéstrame" — actitud escéptica de sus habitantes.</td></tr>
        <tr><td>Montana</td><td>Treasure State</td><td>Por su riqueza mineral.</td></tr>
        <tr><td>Nebraska</td><td>Cornhusker State</td><td>Por la cosecha de maíz.</td></tr>
        <tr><td>Nevada</td><td>Silver State</td><td>Por las minas de plata de Comstock Lode.</td></tr>
        <tr><td>New Hampshire</td><td>Granite State</td><td>Por sus formaciones de granito.</td></tr>
        <tr><td>Nueva Jersey</td><td>Garden State</td><td>Por la agricultura histórica.</td></tr>
        <tr><td>Nuevo México</td><td>Land of Enchantment</td><td>Por su belleza natural y cultural.</td></tr>
        <tr><td>Nueva York</td><td>Empire State</td><td>Atribuido a George Washington — futuro imperio.</td></tr>
        <tr><td>Carolina del Norte</td><td>Tar Heel State</td><td>Por la producción histórica de brea.</td></tr>
        <tr><td>Dakota del Norte</td><td>Peace Garden State</td><td>Por el Jardín Internacional de la Paz en la frontera con Canadá.</td></tr>
        <tr><td>Ohio</td><td>Buckeye State</td><td>Por el árbol buckeye.</td></tr>
        <tr><td>Oklahoma</td><td>Sooner State</td><td>Por los colonos "sooners" que entraron antes de tiempo en 1889.</td></tr>
        <tr><td>Oregón</td><td>Beaver State</td><td>Por el castor, símbolo estatal y comercio de pieles.</td></tr>
        <tr><td>Pensilvania</td><td>Keystone State</td><td>Estado "clave" entre las 13 colonias originales.</td></tr>
        <tr><td>Rhode Island</td><td>Ocean State</td><td>Por su gran costa relativa al tamaño.</td></tr>
        <tr><td>Carolina del Sur</td><td>Palmetto State</td><td>Por la palmera palmetto, símbolo de la Guerra de Independencia.</td></tr>
        <tr><td>Dakota del Sur</td><td>Mount Rushmore State</td><td>Por el monte con los 4 presidentes esculpidos.</td></tr>
        <tr><td>Tennessee</td><td>Volunteer State</td><td>Por los voluntarios de la Guerra de 1812.</td></tr>
        <tr><td>Texas</td><td>Lone Star State</td><td>Por la estrella solitaria de su bandera, símbolo de su independencia.</td></tr>
        <tr><td>Utah</td><td>Beehive State</td><td>Por el panal mormón, símbolo de industriosidad.</td></tr>
        <tr><td>Vermont</td><td>Green Mountain State</td><td>De "vert mont" en francés — "monte verde".</td></tr>
        <tr><td>Virginia</td><td>Old Dominion</td><td>Por su lealtad a la Corona inglesa antes de la independencia.</td></tr>
        <tr><td>Washington</td><td>Evergreen State</td><td>Por sus bosques siempre verdes.</td></tr>
        <tr><td>Virginia Occidental</td><td>Mountain State</td><td>Cubierto enteramente por los Apalaches.</td></tr>
        <tr><td>Wisconsin</td><td>Badger State</td><td>Por los mineros que vivían bajo tierra como tejones.</td></tr>
        <tr><td>Wyoming</td><td>Equality State</td><td>Primer estado en dar el voto a las mujeres (1869).</td></tr>
      </tbody>
    </table>

    <h2>Apodos más conocidos a nivel mundial</h2>
    <ul>
      <li><strong>Texas — Lone Star State:</strong> el más reconocible internacionalmente.</li>
      <li><strong>California — Golden State:</strong> usado por los Golden State Warriors (NBA).</li>
      <li><strong>Florida — Sunshine State:</strong> aparece en cada matrícula del estado.</li>
      <li><strong>Nueva York — Empire State:</strong> da nombre al Empire State Building.</li>
      <li><strong>Alaska — Last Frontier:</strong> evocador del Oeste salvaje.</li>
    </ul>

    <div class="cta-card">
      <h3>Aprende los apodos jugando</h3>
      <p>Statedoku usa apodos como pistas — "Aloha State", "Bluegrass State", "Sunshine State". Aprende sin esfuerzo.</p>
      <a href="/es/">Jugar el puzzle de hoy →</a>
    </div>

    <h2>Preguntas frecuentes</h2>
    <details><summary><strong>¿Por qué Texas es "Lone Star State"?</strong></summary><p>Por la estrella solitaria de su bandera, que simboliza su independencia como República de Texas (1836-1845) antes de unirse a EE.UU.</p></details>
    <details><summary><strong>¿Por qué California es "Golden State"?</strong></summary><p>Por la fiebre del oro de 1849 que masivamente la pobló, y también por la luz dorada de sus colinas en verano.</p></details>
    <details><summary><strong>¿Qué significa "Hoosier State" (Indiana)?</strong></summary><p>El origen es debatido. Posibles: del saludo "Who's there?" pronunciado "Hoo-sher", de un capataz llamado Hoosier, o de una palabra indígena. Hoy es el gentilicio oficial.</p></details>
    <details><summary><strong>¿Cuál es el apodo más antiguo?</strong></summary><p>"Old Dominion" para Virginia, datando del siglo XVII por su lealtad a Carlos II tras la Guerra Civil Inglesa.</p></details>
`,
  faq([
    ['¿Cuál es el apodo de Texas?', 'Lone Star State (Estado de la Estrella Solitaria), por la única estrella de su bandera, símbolo de su breve independencia como República de Texas (1836-1845).'],
    ['¿Cuál es el apodo de California?', 'Golden State (Estado Dorado), por la fiebre del oro de 1849 y la luz dorada de sus paisajes.'],
    ['¿Cuál es el apodo de Florida?', 'Sunshine State (Estado del Sol), por su clima soleado todo el año.'],
    ['¿Qué estado se llama "Empire State"?', 'Nueva York. El apodo se le atribuye a George Washington, que predijo que sería el imperio del nuevo país.'],
  ]),
  'Apodos de los 50 estados'
);

// 6. /es/learn/cinturones-eeuu/
const esCinturones = wrapES(
  'cinturones-eeuu',
  'Los "cinturones" de EE.UU. — Bible Belt, Rust Belt, Sun Belt, Corn Belt (2026) | Statedoku',
  'Los cinturones culturales y económicos de EE.UU.: Bible Belt (sur religioso), Rust Belt (Medio Oeste industrial), Sun Belt (sur creciente), Corn Belt, Black Belt, Borscht Belt. Qué son y qué estados los componen.',
  'bible belt eeuu, rust belt estados unidos, sun belt, corn belt, black belt eeuu, cinturones estados unidos',
  'Los "cinturones" culturales de EE.UU.',
  'Bible Belt, Rust Belt, Sun Belt, Corn Belt... Los EE.UU. no se dividen solo por regiones, también por "cinturones" geográficos.',
  `    <p>Además de las 4 regiones oficiales (Noreste, Sur, Medio Oeste, Oeste), Estados Unidos se divide informalmente en <strong>"cinturones" (belts)</strong> según su economía, cultura, religión o paisaje. No son límites administrativos, pero son tan reales para los estadounidenses como las regiones censales.</p>

    <h2>1. Bible Belt (Cinturón Bíblico)</h2>
    <p>La región del Sur donde el cristianismo evangélico protestante domina culturalmente. Más asistencia a iglesia per cápita que cualquier otra parte del país. Conservador políticamente.</p>
    <p><strong>Estados centrales:</strong> Alabama, Misisipi, Tennessee, Kentucky, Arkansas, Luisiana, Georgia, Carolinas, Texas (norte y este), Oklahoma, Misuri (sur), Virginia (oeste), Virginia Occidental.</p>
    <p><strong>Ciudades clave:</strong> Nashville (Tennessee), Birmingham (Alabama), Atlanta (Georgia), Tulsa (Oklahoma).</p>

    <h2>2. Rust Belt (Cinturón del Óxido)</h2>
    <p>La región del Medio Oeste y Atlántico Medio que floreció con la industria pesada (acero, automóviles, manufactura) y declinó desde los años 70. "Rust" (óxido) por las fábricas abandonadas.</p>
    <p><strong>Estados:</strong> Pensilvania (oeste), Ohio, Michigan, Indiana, Illinois (norte), Wisconsin, Nueva York (oeste), Virginia Occidental.</p>
    <p><strong>Ciudades clave:</strong> Detroit (Michigan), Pittsburgh (Pensilvania), Cleveland (Ohio), Buffalo (Nueva York), Gary (Indiana), Toledo (Ohio).</p>

    <h2>3. Sun Belt (Cinturón del Sol)</h2>
    <p>El opuesto demográfico del Rust Belt. Estados del Sur y Suroeste que crecen rápido por el clima cálido, costos bajos y empresas tech. Muchos retirados, mucha migración interna.</p>
    <p><strong>Estados:</strong> Florida, Georgia, Alabama, Misisipi, Luisiana, Texas, Nuevo México, Arizona, Nevada, sur de California, sur de Carolinas.</p>
    <p><strong>Ciudades clave:</strong> Miami (Florida), Houston (Texas), Phoenix (Arizona), Las Vegas (Nevada), Atlanta (Georgia), Dallas (Texas).</p>

    <h2>4. Corn Belt (Cinturón del Maíz)</h2>
    <p>La región del Medio Oeste dominada por la producción de maíz (y, hoy en día, también soja). Suelos profundos negros formados por glaciaciones.</p>
    <p><strong>Estados:</strong> Iowa, Illinois, Indiana, Nebraska, Misuri, Minnesota (sur), Dakota del Sur (este), Ohio (oeste), Wisconsin (sur), Kansas (este).</p>
    <p><strong>Ciudad clave:</strong> Des Moines (Iowa) — capital simbólica del maíz.</p>

    <h2>5. Black Belt (Cinturón Negro)</h2>
    <p>Originalmente, una franja de suelos negros muy fértiles en el Sur profundo (Alabama, Misisipi). Después se asoció con la gran población afroamericana descendiente de esclavos de plantaciones de algodón. Hoy es un término socioeconómico: regiones con mayoría negra, históricamente pobres, mayormente rurales.</p>
    <p><strong>Estados:</strong> Alabama (centro), Misisipi (oeste), Luisiana (oeste), Texas (este), Arkansas (sureste), Tennessee (oeste), Georgia (centro-sur), Carolina del Sur (centro), Carolina del Norte (este), Virginia (sureste).</p>

    <h2>6. Borscht Belt (Cinturón del Borscht)</h2>
    <p>Histórico — no geográfico contemporáneo. En los años 1920-1970, los Catskill Mountains al norte de Nueva York eran destino veraniego de la comunidad judía. Hoteles, comediantes (Mel Brooks, Jerry Lewis, Joan Rivers empezaron ahí). El nombre viene del borscht, sopa rusa tradicional. Casi desaparecido pero culturalmente importante.</p>

    <h2>7. Otros "cinturones" menos conocidos</h2>
    <ul>
      <li><strong>Cotton Belt:</strong> los estados del sur que dominaron el algodón en el siglo XIX. Hoy diversificados.</li>
      <li><strong>Wheat Belt:</strong> región triguera del Medio Oeste — Dakotas, Montana, Kansas, Nebraska.</li>
      <li><strong>Dairy Belt:</strong> Wisconsin y Minnesota, dominados por la producción láctea.</li>
      <li><strong>Frost Belt / Snow Belt:</strong> el norte que recibe mucha nieve — Grandes Lagos hacia el este.</li>
      <li><strong>Tornado Alley:</strong> la "fila" de tornados — Texas, Oklahoma, Kansas, Nebraska, Iowa.</li>
      <li><strong>Stroke Belt:</strong> estados del sureste con tasas altas de derrames cerebrales (problema de salud pública).</li>
      <li><strong>Tech Belt / Silicon Belt:</strong> California (Bay Area), Washington (Seattle), Texas (Austin), Massachusetts (Boston).</li>
    </ul>

    <div class="cta-card">
      <h3>Aprende los cinturones jugando</h3>
      <p>Statedoku usa "Bible Belt" o "Sun Belt" como pistas en su puzzle diario. Cultura y geografía a la vez.</p>
      <a href="/es/">Jugar el puzzle de hoy →</a>
    </div>

    <h2>Preguntas frecuentes</h2>
    <details><summary><strong>¿Qué es el "Bible Belt"?</strong></summary><p>La franja del Sur de EE.UU. donde el cristianismo evangélico protestante es culturalmente dominante. Incluye Alabama, Misisipi, Tennessee, Texas norte, Georgia, las Carolinas y partes vecinas.</p></details>
    <details><summary><strong>¿Qué es el "Rust Belt"?</strong></summary><p>Región del Medio Oeste y Atlántico Medio (Detroit, Pittsburgh, Cleveland...) donde la industria pesada floreció y luego decayó desde los 70. El "óxido" simboliza fábricas abandonadas.</p></details>
    <details><summary><strong>¿En qué se diferencia el Sun Belt del Rust Belt?</strong></summary><p>Son demográficamente opuestos. El Sun Belt (Florida, Texas, Arizona) crece — clima cálido, migración. El Rust Belt (Michigan, Ohio, Pensilvania) se vacía — declive industrial, frío.</p></details>
    <details><summary><strong>¿Cuál es el "Tornado Alley"?</strong></summary><p>Una franja Norte-Sur que cubre Texas, Oklahoma, Kansas, Nebraska, Dakota del Sur, Iowa. Donde se forman más tornados del mundo: ~1,000 por año.</p></details>
`,
  faq([
    ['¿Qué es el Bible Belt?', 'La franja del Sur de Estados Unidos donde el cristianismo evangélico protestante es culturalmente dominante. Incluye Alabama, Misisipi, Tennessee, partes de Texas y Georgia.'],
    ['¿Qué es el Rust Belt?', 'Región del Medio Oeste y Atlántico Medio (Detroit, Pittsburgh, Cleveland) donde la industria pesada decayó desde los años 70. "Óxido" simboliza fábricas abandonadas.'],
    ['¿Qué es el Sun Belt?', 'Estados del Sur y Suroeste (Florida, Texas, Arizona, Nevada) que crecen rápido por su clima cálido y migración interna.'],
    ['¿Dónde está el Corn Belt?', 'El Medio Oeste — Iowa, Illinois, Indiana, Nebraska, Misuri, Minnesota sur. Producción de maíz y soja.'],
  ]),
  'Los cinturones culturales de EE.UU.'
);

// ════════════════════════════════════════════════════════════════════════
// FR: 6 new pages
// ════════════════════════════════════════════════════════════════════════

// 1. /fr/learn/capitales-des-etats/
const frCapitales = wrapFR(
  'capitales-des-etats',
  'Les 50 capitales des États américains — liste complète (2026) | Statedoku',
  'La liste complète des 50 capitales des États des États-Unis. Sacramento (Californie), Austin (Texas), Tallahassee (Floride), Albany (New York)... Avec leur population, fondation et fait clé.',
  'capitales etats unis, capitale californie, capitale texas, capitale floride, capitale new york, liste capitales etats americains',
  'Les 50 capitales des États',
  'La liste complète des capitales d\'États américains. Et pourquoi Sacramento, Austin ou Albany — alors qu\'ils ne sont pas les plus grandes villes.',
  `    <p>Les <strong>50 États des États-Unis</strong> ont chacun une capitale. La surprise : dans <strong>33 cas sur 50</strong>, la capitale n'est PAS la plus grande ville de l'État. Albany (335k habitants) est la capitale de New York alors que la ville de New York (8.3M) est 25 fois plus grande.</p>

    <h2>Tableau complet des 50 capitales</h2>
    <table class="lt">
      <thead><tr><th>État</th><th>Capitale</th><th>Plus grande ville</th></tr></thead>
      <tbody>
        <tr><td>Alabama</td><td>Montgomery</td><td>Huntsville</td></tr>
        <tr><td>Alaska</td><td>Juneau</td><td>Anchorage</td></tr>
        <tr><td>Arizona</td><td><strong>Phoenix</strong></td><td>Phoenix (même)</td></tr>
        <tr><td>Arkansas</td><td><strong>Little Rock</strong></td><td>Little Rock (même)</td></tr>
        <tr><td>Californie</td><td>Sacramento</td><td>Los Angeles</td></tr>
        <tr><td>Colorado</td><td><strong>Denver</strong></td><td>Denver (même)</td></tr>
        <tr><td>Connecticut</td><td>Hartford</td><td>Bridgeport</td></tr>
        <tr><td>Delaware</td><td>Dover</td><td>Wilmington</td></tr>
        <tr><td>Floride</td><td>Tallahassee</td><td>Jacksonville</td></tr>
        <tr><td>Géorgie</td><td><strong>Atlanta</strong></td><td>Atlanta (même)</td></tr>
        <tr><td>Hawaï</td><td><strong>Honolulu</strong></td><td>Honolulu (même)</td></tr>
        <tr><td>Idaho</td><td><strong>Boise</strong></td><td>Boise (même)</td></tr>
        <tr><td>Illinois</td><td>Springfield</td><td>Chicago</td></tr>
        <tr><td>Indiana</td><td><strong>Indianapolis</strong></td><td>Indianapolis (même)</td></tr>
        <tr><td>Iowa</td><td><strong>Des Moines</strong></td><td>Des Moines (même)</td></tr>
        <tr><td>Kansas</td><td>Topeka</td><td>Wichita</td></tr>
        <tr><td>Kentucky</td><td>Frankfort</td><td>Louisville</td></tr>
        <tr><td>Louisiane</td><td>Baton Rouge</td><td>La Nouvelle-Orléans</td></tr>
        <tr><td>Maine</td><td>Augusta</td><td>Portland</td></tr>
        <tr><td>Maryland</td><td>Annapolis</td><td>Baltimore</td></tr>
        <tr><td>Massachusetts</td><td><strong>Boston</strong></td><td>Boston (même)</td></tr>
        <tr><td>Michigan</td><td>Lansing</td><td>Detroit</td></tr>
        <tr><td>Minnesota</td><td>Saint Paul</td><td>Minneapolis</td></tr>
        <tr><td>Mississippi</td><td><strong>Jackson</strong></td><td>Jackson (même)</td></tr>
        <tr><td>Missouri</td><td>Jefferson City</td><td>Kansas City</td></tr>
        <tr><td>Montana</td><td>Helena</td><td>Billings</td></tr>
        <tr><td>Nebraska</td><td>Lincoln</td><td>Omaha</td></tr>
        <tr><td>Nevada</td><td>Carson City</td><td>Las Vegas</td></tr>
        <tr><td>New Hampshire</td><td>Concord</td><td>Manchester</td></tr>
        <tr><td>New Jersey</td><td>Trenton</td><td>Newark</td></tr>
        <tr><td>Nouveau-Mexique</td><td>Santa Fe</td><td>Albuquerque</td></tr>
        <tr><td>New York</td><td>Albany</td><td>New York City</td></tr>
        <tr><td>Caroline du Nord</td><td>Raleigh</td><td>Charlotte</td></tr>
        <tr><td>Dakota du Nord</td><td>Bismarck</td><td>Fargo</td></tr>
        <tr><td>Ohio</td><td><strong>Columbus</strong></td><td>Columbus (même)</td></tr>
        <tr><td>Oklahoma</td><td><strong>Oklahoma City</strong></td><td>Oklahoma City (même)</td></tr>
        <tr><td>Oregon</td><td>Salem</td><td>Portland</td></tr>
        <tr><td>Pennsylvanie</td><td>Harrisburg</td><td>Philadelphie</td></tr>
        <tr><td>Rhode Island</td><td><strong>Providence</strong></td><td>Providence (même)</td></tr>
        <tr><td>Caroline du Sud</td><td>Columbia</td><td>Charleston</td></tr>
        <tr><td>Dakota du Sud</td><td>Pierre</td><td>Sioux Falls</td></tr>
        <tr><td>Tennessee</td><td><strong>Nashville</strong></td><td>Nashville (même)</td></tr>
        <tr><td>Texas</td><td>Austin</td><td>Houston</td></tr>
        <tr><td>Utah</td><td><strong>Salt Lake City</strong></td><td>Salt Lake City (même)</td></tr>
        <tr><td>Vermont</td><td>Montpelier</td><td>Burlington</td></tr>
        <tr><td>Virginie</td><td>Richmond</td><td>Virginia Beach</td></tr>
        <tr><td>Washington (état)</td><td>Olympia</td><td>Seattle</td></tr>
        <tr><td>Virginie-Occidentale</td><td><strong>Charleston</strong></td><td>Charleston (même)</td></tr>
        <tr><td>Wisconsin</td><td>Madison</td><td>Milwaukee</td></tr>
        <tr><td>Wyoming</td><td><strong>Cheyenne</strong></td><td>Cheyenne (même)</td></tr>
      </tbody>
    </table>
    <p><em>En <strong>gras</strong> : les 17 États où la capitale est aussi la plus grande ville.</em></p>

    <h2>Pourquoi tant de capitales ne sont pas les plus grandes villes ?</h2>
    <p>Trois raisons historiques principales :</p>
    <ul>
      <li><strong>Choix géographique central :</strong> au XVIIIe-XIXe siècle, on choisissait une ville centrale pour faciliter les déplacements, pas la métropole côtière. Albany (centrée) vs New York City (côtière).</li>
      <li><strong>Méfiance envers les grandes villes :</strong> les Pères Fondateurs craignaient l'influence des centres financiers sur le gouvernement. Trenton plutôt que Newark.</li>
      <li><strong>Croissance post-fondation :</strong> les capitales ont été choisies tôt. Les métropoles ont grandi plus tard grâce au commerce, à l'industrie ou au tourisme.</li>
    </ul>

    <h2>Les capitales les moins peuplées</h2>
    <ol>
      <li><strong>Montpelier (Vermont)</strong> — ~7,500 habitants. La plus petite capitale d'État américaine.</li>
      <li><strong>Pierre (Dakota du Sud)</strong> — ~14,000.</li>
      <li><strong>Augusta (Maine)</strong> — ~19,000.</li>
      <li><strong>Frankfort (Kentucky)</strong> — ~28,000.</li>
      <li><strong>Juneau (Alaska)</strong> — ~32,000 (et inaccessible par la route !).</li>
    </ol>

    <h2>Pièges classiques pour francophones</h2>
    <ul>
      <li>Washington, D.C. n'est PAS un État. C'est un district fédéral. Capitale fédérale.</li>
      <li>L'État de Washington existe — sa capitale est Olympia, pas Seattle.</li>
      <li>"New York" peut désigner l'État ou la ville. La capitale de l'État est Albany.</li>
      <li>Kansas City est PRINCIPALEMENT dans le Missouri, pas le Kansas. Et la capitale du Kansas est Topeka.</li>
    </ul>

    <div class="cta-card">
      <h3>Apprenez les capitales en jouant</h3>
      <p>Statedoku utilise les capitales comme indices dans son puzzle quotidien. Cinq minutes par jour et les 50 deviennent évidentes.</p>
      <a href="/fr/">Jouer le puzzle du jour →</a>
    </div>

    <h2>Questions fréquentes</h2>
    <details><summary><strong>Quelle est la capitale des États-Unis ?</strong></summary><p>Washington, D.C. Ce n'est pas un État mais un district fédéral indépendant.</p></details>
    <details><summary><strong>Quelle est la capitale de la Californie ?</strong></summary><p>Sacramento. La plus grande ville est Los Angeles.</p></details>
    <details><summary><strong>Quelle est la capitale du Texas ?</strong></summary><p>Austin. La plus grande ville est Houston.</p></details>
    <details><summary><strong>Quelle est la capitale de la Floride ?</strong></summary><p>Tallahassee. La plus grande ville est Jacksonville (Miami est aussi très peuplée).</p></details>
    <details><summary><strong>Quelle est la plus petite capitale d'État ?</strong></summary><p>Montpelier au Vermont, environ 7,500 habitants. La seule capitale d'État sans un seul McDonald's.</p></details>
`,
  faq([
    ['Quelle est la capitale des États-Unis ?', "Washington, D.C. Ce n'est pas un État mais un district fédéral indépendant créé en 1790."],
    ['Quelle est la capitale de la Californie ?', 'Sacramento. La plus grande ville de Californie est Los Angeles, mais ce n\'est pas la capitale.'],
    ['Quelle est la capitale du Texas ?', 'Austin. Houston est la plus grande ville du Texas mais n\'est pas la capitale.'],
    ['Combien de capitales sont aussi la plus grande ville ?', '17 sur 50 seulement. Dans 33 États, la capitale est plus petite que la métropole : Albany vs NYC, Sacramento vs LA, Tallahassee vs Jacksonville.'],
  ]),
  'Les 50 capitales des États'
);

// 2. /fr/learn/regions-des-etats-unis/
const frRegions = wrapFR(
  'regions-des-etats-unis',
  'Les 4 régions des États-Unis — Nord-Est, Sud, Midwest, Ouest (2026) | Statedoku',
  'Les 4 régions des États-Unis selon le Bureau du Recensement : Nord-Est (9 États), Sud (16), Midwest (12), Ouest (13). Liste complète des États par région et 9 sous-régions.',
  'regions etats unis, nord est etats unis, sud etats unis, midwest, ouest americain, regions usa',
  'Les 4 régions des États-Unis',
  'Nord-Est, Sud, Midwest, Ouest. Comment le Bureau du Recensement divise les 50 États, et leurs 9 sous-régions.',
  `    <p>Le <strong>Bureau du Recensement des États-Unis</strong> divise officiellement le pays en <strong>4 régions principales</strong> et <strong>9 sous-régions</strong>. C'est la division la plus utilisée pour les statistiques, la politique et l'analyse économique.</p>

    <h2>Les 4 régions principales</h2>

    <h3>Nord-Est (Northeast) — 9 États</h3>
    <p>Connecticut, Maine, Massachusetts, New Hampshire, New Jersey, New York, Pennsylvanie, Rhode Island, Vermont. Population : ~57M. Région la plus densément peuplée.</p>

    <h3>Sud (South) — 16 États + DC</h3>
    <p>Alabama, Arkansas, Caroline du Nord, Caroline du Sud, Delaware, Floride, Géorgie, Kentucky, Louisiane, Maryland, Mississippi, Oklahoma, Tennessee, Texas, Virginie, Virginie-Occidentale. Plus Washington DC. Population : ~127M. Région la plus peuplée.</p>

    <h3>Midwest — 12 États</h3>
    <p>Dakota du Nord, Dakota du Sud, Illinois, Indiana, Iowa, Kansas, Michigan, Minnesota, Missouri, Nebraska, Ohio, Wisconsin. Population : ~69M. Région agricole et industrielle historique.</p>

    <h3>Ouest (West) — 13 États</h3>
    <p>Alaska, Arizona, Californie, Colorado, Hawaï, Idaho, Montana, Nevada, Nouveau-Mexique, Oregon, Utah, Washington, Wyoming. Population : ~78M. La plus grande superficie, paysages les plus variés.</p>

    <h2>Les 9 sous-régions</h2>
    <table class="lt">
      <thead><tr><th>Région</th><th>Sous-région</th><th>Exemples</th></tr></thead>
      <tbody>
        <tr><td>Nord-Est</td><td>Nouvelle-Angleterre</td><td>Massachusetts, Maine, Vermont, New Hampshire, Rhode Island, Connecticut</td></tr>
        <tr><td>Nord-Est</td><td>Mid-Atlantic</td><td>New York, New Jersey, Pennsylvanie</td></tr>
        <tr><td>Sud</td><td>Atlantique Sud</td><td>Floride, Géorgie, Carolines, Virginie, Maryland, Delaware, DC, Virginie-Occidentale</td></tr>
        <tr><td>Sud</td><td>Centre-Sud-Est</td><td>Tennessee, Kentucky, Alabama, Mississippi</td></tr>
        <tr><td>Sud</td><td>Centre-Sud-Ouest</td><td>Texas, Oklahoma, Arkansas, Louisiane</td></tr>
        <tr><td>Midwest</td><td>Centre-Nord-Est</td><td>Illinois, Indiana, Ohio, Michigan, Wisconsin</td></tr>
        <tr><td>Midwest</td><td>Centre-Nord-Ouest</td><td>Iowa, Kansas, Missouri, Nebraska, Dakotas, Minnesota</td></tr>
        <tr><td>Ouest</td><td>Montagne</td><td>Colorado, Utah, Arizona, Nouveau-Mexique, Montana, Wyoming, Idaho, Nevada</td></tr>
        <tr><td>Ouest</td><td>Pacifique</td><td>Californie, Oregon, Washington, Alaska, Hawaï</td></tr>
      </tbody>
    </table>

    <h2>Autres divisions courantes (non-officielles)</h2>
    <ul>
      <li><strong>Côte Est (East Coast)</strong> — du Maine à la Floride, tous les États ayant accès à l'Atlantique.</li>
      <li><strong>Côte Ouest (West Coast)</strong> — Californie, Oregon, Washington (et parfois l'Alaska, l'Hawaï).</li>
      <li><strong>Sud Profond (Deep South)</strong> — Alabama, Mississippi, Louisiane, Géorgie, Caroline du Sud. Historiquement les États esclavagistes du cœur.</li>
      <li><strong>Plaines (Great Plains)</strong> — Dakotas, Nebraska, Kansas, Oklahoma, Texas, Wyoming, Montana, Colorado, Nouveau-Mexique.</li>
      <li><strong>Sun Belt</strong> — la "ceinture du soleil" — du sud de la Californie à la Floride, croissance démographique forte.</li>
      <li><strong>Rust Belt</strong> — la "ceinture de la rouille" — Détroit, Pittsburgh, Cleveland, le Midwest industriel en déclin.</li>
      <li><strong>Bible Belt</strong> — la "ceinture biblique" — le Sud religieux protestant évangélique.</li>
    </ul>

    <div class="cta-card">
      <h3>Apprenez les régions en jouant</h3>
      <p>Statedoku utilise "Région : Sud" ou "Côte Pacifique" comme indices dans son puzzle quotidien.</p>
      <a href="/fr/">Jouer le puzzle du jour →</a>
    </div>

    <h2>Questions fréquentes</h2>
    <details><summary><strong>Combien de régions ont les États-Unis ?</strong></summary><p>4 régions principales (Nord-Est, Sud, Midwest, Ouest) et 9 sous-régions selon le Bureau du Recensement.</p></details>
    <details><summary><strong>Pourquoi le Texas n'est-il pas dans l'Ouest ?</strong></summary><p>Culturellement, le Texas est associé à l'Ouest américain, mais le Bureau du Recensement le classe dans le <strong>Sud</strong> (sous-région Centre-Sud-Ouest). Historiquement, le Texas faisait partie du Sud esclavagiste et de la Confédération.</p></details>
    <details><summary><strong>Hawaï et Alaska font-ils partie de l'Ouest ?</strong></summary><p>Oui. Tous deux sont dans la sous-région Pacifique de l'Ouest, même s'ils ne partagent pas de frontière avec les autres États de cette sous-région.</p></details>
    <details><summary><strong>Quelle est la région la plus peuplée ?</strong></summary><p>Le Sud, avec plus de 127 millions d'habitants. Texas et Floride sont les moteurs démographiques.</p></details>
`,
  faq([
    ['Combien de régions ont les États-Unis ?', '4 régions principales (Nord-Est, Sud, Midwest, Ouest) et 9 sous-régions selon le Bureau du Recensement.'],
    ['Pourquoi le Texas est-il dans la région Sud ?', 'Le Bureau du Recensement classe le Texas dans le Sud (sous-région Centre-Sud-Ouest) pour des raisons historiques : il faisait partie du Sud esclavagiste et de la Confédération.'],
    ['Hawaï et Alaska sont-ils dans la région Ouest ?', 'Oui, tous deux sont dans la sous-région Pacifique de la région Ouest.'],
    ['Quelle région américaine est la plus peuplée ?', 'Le Sud, avec plus de 127 millions d\'habitants. Texas et Floride sont les principaux moteurs démographiques.'],
  ]),
  'Les 4 régions des États-Unis'
);

// 3. /fr/learn/drapeaux-des-etats/
const frDrapeaux = wrapFR(
  'drapeaux-des-etats',
  'Drapeaux des 50 États américains — histoire et design (2026) | Statedoku',
  'Les drapeaux des 50 États américains : histoire, design, les plus anciens (Maryland), les plus distinctifs (Texas, Californie) et le problème des "Seals on Blue".',
  'drapeaux etats unis, drapeau californie, drapeau texas, drapeau hawai, drapeau maryland, drapeaux etats americains',
  'Les drapeaux des 50 États',
  'Histoire et design des drapeaux d\'État. Pourquoi tant sont bleus avec un sceau, et lesquels se démarquent vraiment.',
  `    <p>Chacun des <strong>50 États américains</strong> a son propre drapeau officiel, en plus de la bannière étoilée des États-Unis. Certains sont historiques et iconiques (Texas, Californie). Une vingtaine sont quasi indiscernables — un "sceau d'État" sur fond bleu.</p>

    <h2>Les drapeaux les plus reconnaissables</h2>

    <h3>Maryland — le plus distinctif</h3>
    <p>Motif héraldique jaune/noir et rouge/blanc des familles Calvert et Crossland. Adopté en 1904 mais basé sur les armoiries du XVIIe siècle. <strong>Le seul drapeau d'État américain au design héraldique européen.</strong></p>

    <h3>Texas — "Lone Star Flag"</h3>
    <p>Rouge, blanc et bleu avec une étoile solitaire. Adopté en 1839 quand le Texas était une république indépendante. Devenu le drapeau de l'État lors de son admission en 1845.</p>

    <h3>Californie — "Bear Flag"</h3>
    <p>Un grizzly (espèce éteinte) marchant, étoile rouge, "California Republic". Adopté après la révolte du drapeau de l'ours en 1846.</p>

    <h3>Hawaï — Union Jack</h3>
    <p>Le SEUL drapeau d'État américain incluant l'Union Jack britannique. Reflète la période du Royaume de Hawaï allié au Royaume-Uni (1816-1893).</p>

    <h3>Arizona, Nouveau-Mexique, Colorado</h3>
    <p>Trois designs solaires distinctifs. Arizona : soleil cuivré stylisé (1917). Nouveau-Mexique : soleil Zia rouge sur jaune (1925, symbole amérindien). Colorado : C rouge entourant un soleil jaune sur barres bleu-blanc-bleu (1911).</p>

    <h3>Alaska</h3>
    <p>La Grande Ourse et l'étoile polaire en or sur fond bleu. Conçu en 1927 par un orphelin de 13 ans, Benny Benson.</p>

    <h2>Le problème des "Seals on Blue"</h2>
    <p>Plus de 20 États ont des drapeaux similaires : un sceau d'État sur fond bleu. Tellement semblables qu'il est presque impossible de les distinguer à distance.</p>
    <p><strong>Exemples :</strong> Wisconsin, Minnesota (avant 2024), Michigan, Indiana, Pennsylvanie, Nebraska, New York, Virginie, Missouri, Kansas, Massachusetts, Vermont, New Hampshire, Oregon, Idaho, Montana, Dakotas, Iowa, Connecticut.</p>
    <p><strong>Cause historique :</strong> à la fin du XIXe siècle, les régiments militaires d'État utilisaient des drapeaux militaires bleus avec leur sceau. Ces drapeaux ont été adoptés tels quels comme drapeaux officiels.</p>

    <h2>Drapeaux récemment redessinés</h2>
    <ul>
      <li><strong>Mississippi</strong> — changé en 2021. L'ancien incluait le drapeau confédéré. Le nouveau montre une magnolia.</li>
      <li><strong>Géorgie</strong> — changé en 2003 pour les mêmes raisons (éléments confédérés enlevés).</li>
      <li><strong>Utah</strong> — redessiné en 2024, premier changement majeur depuis 1913.</li>
      <li><strong>Minnesota</strong> — redessiné en 2024 (abandonne le sceau bleu traditionnel).</li>
    </ul>

    <h2>Classements officieux</h2>
    <p>L'<em>Association nord-américaine de vexillologie</em> (NAVA) a classé les drapeaux d'État en 2001. Les meilleurs : Nouveau-Mexique, Texas, Maryland, Alaska, Arizona. Les pires : Géorgie (version 2001), Nebraska, Montana, Kansas, Mississippi (ancien).</p>

    <div class="cta-card">
      <h3>Apprenez les États visuellement</h3>
      <p>Statedoku utilise des indices culturels comme "État confédéré" ou "État avec nouveau drapeau" dans son puzzle quotidien.</p>
      <a href="/fr/">Jouer le puzzle du jour →</a>
    </div>

    <h2>Questions fréquentes</h2>
    <details><summary><strong>Quel est le drapeau d'État américain le plus ancien ?</strong></summary><p>Maryland (1904), basé sur les armoiries des Calvert du XVIIe siècle. Le seul au design héraldique européen.</p></details>
    <details><summary><strong>Quel drapeau a l'Union Jack ?</strong></summary><p>Hawaï uniquement. Reflète la période du Royaume de Hawaï allié au Royaume-Uni.</p></details>
    <details><summary><strong>Pourquoi tant de drapeaux d'État se ressemblent ?</strong></summary><p>Le problème des "Seals on Blue" : 20+ États ont un sceau sur fond bleu, héritage des régiments militaires du XIXe siècle. Mouvement actuel pour redesign (Mississippi 2021, Utah 2024, Minnesota 2024).</p></details>
    <details><summary><strong>Quel est le drapeau le plus reconnaissable mondialement ?</strong></summary><p>Le drapeau du Texas ("Lone Star Flag") et celui de la Californie ("Bear Flag") sont les plus iconiques. Tous deux sont d'anciens drapeaux nationaux d'éphémères républiques indépendantes.</p></details>
`,
  faq([
    ['Quel est le drapeau d\'État américain le plus ancien ?', 'Maryland (1904), basé sur les armoiries des familles Calvert et Crossland du XVIIe siècle. C\'est le seul drapeau d\'État américain avec un design héraldique européen.'],
    ['Quel État a un drapeau avec l\'Union Jack ?', 'Hawaï est le seul État dont le drapeau inclut l\'Union Jack britannique, héritage du Royaume de Hawaï allié au Royaume-Uni (1816-1893).'],
    ['Pourquoi le drapeau du Texas a-t-il une étoile solitaire ?', 'L\'étoile solitaire ("Lone Star") symbolise l\'indépendance du Texas comme République (1836-1845) avant son annexion par les États-Unis.'],
    ['Quel drapeau d\'État a été changé récemment ?', 'Le Mississippi en 2021 (suppression des éléments confédérés). Plus récemment, l\'Utah et le Minnesota ont redessiné leurs drapeaux en 2024.'],
  ]),
  'Drapeaux des 50 États'
);

// 4. /fr/learn/college-electoral/
const frCollege = wrapFR(
  'college-electoral',
  'Le Collège Électoral américain — fonctionnement et votes par État (2026) | Statedoku',
  'Le Collège Électoral élit le président des États-Unis avec 538 grands électeurs. Californie 54, Texas 40, Floride 30. Comment ça marche, pourquoi un président peut gagner sans le vote populaire.',
  'college electoral americain, electoral college usa, grands electeurs etats unis, election presidentielle americaine, 270 grands electeurs',
  'Le Collège Électoral américain',
  'Comment les États-Unis élisent leur président. 538 grands électeurs, 270 pour gagner, et pourquoi la Californie pèse 54 alors que le Wyoming pèse 3.',
  `    <p>Aux États-Unis, le président n'est <strong>pas</strong> élu au suffrage universel direct. Il est élu par le <strong>Collège Électoral</strong> : 538 grands électeurs répartis entre les 50 États et Washington DC. Pour gagner, un candidat a besoin de <strong>270 grands électeurs</strong>.</p>

    <h2>Comment se calculent les grands électeurs par État</h2>
    <p>Nombre de grands électeurs d'un État = nombre de représentants à la Chambre + 2 sénateurs. Comme chaque État a 2 sénateurs et au moins 1 représentant, le minimum est 3 grands électeurs. Le maximum est détenu par la Californie avec 54.</p>

    <h2>Grands électeurs par État (cycle 2024-2028)</h2>
    <table class="lt">
      <thead><tr><th>État</th><th>Grands électeurs</th></tr></thead>
      <tbody>
        <tr><td>Californie</td><td><strong>54</strong></td></tr>
        <tr><td>Texas</td><td><strong>40</strong></td></tr>
        <tr><td>Floride</td><td><strong>30</strong></td></tr>
        <tr><td>New York</td><td>28</td></tr>
        <tr><td>Pennsylvanie</td><td>19</td></tr>
        <tr><td>Illinois</td><td>19</td></tr>
        <tr><td>Ohio</td><td>17</td></tr>
        <tr><td>Géorgie</td><td>16</td></tr>
        <tr><td>Caroline du Nord</td><td>16</td></tr>
        <tr><td>Michigan</td><td>15</td></tr>
        <tr><td>New Jersey</td><td>14</td></tr>
        <tr><td>Virginie</td><td>13</td></tr>
        <tr><td>Washington</td><td>12</td></tr>
        <tr><td>Arizona</td><td>11</td></tr>
        <tr><td colspan="2" style="font-style:italic;color:var(--text-2);text-align:center;">... et 36 autres États avec 3 à 11 grands électeurs.</td></tr>
      </tbody>
    </table>

    <h2>Les 7 États avec seulement 3 grands électeurs</h2>
    <p>Le minimum (3) est détenu par : <strong>Alaska, Delaware, Dakota du Nord, Dakota du Sud, Vermont, Wyoming</strong>, plus <strong>Washington DC</strong>. Wyoming, avec ~580,000 habitants, a donc autant de poids par électeur qu'un État beaucoup plus peuplé proportionnellement.</p>

    <h2>"Winner takes all" — sauf 2 exceptions</h2>
    <p>Dans 48 des 50 États, le candidat qui remporte le vote populaire de l'État obtient TOUS ses grands électeurs. Les 2 exceptions :</p>
    <ul>
      <li><strong>Nebraska</strong> (5 grands électeurs) : 2 pour le gagnant de l'État + 3 par circonscription du Congrès.</li>
      <li><strong>Maine</strong> (4 grands électeurs) : même système.</li>
    </ul>
    <p>C'est pourquoi un district d'Omaha (Nebraska) peut donner 1 voix démocrate tandis que le reste de l'État vote républicain.</p>

    <h2>Pourquoi certains présidents gagnent sans le vote populaire</h2>
    <p>Comme les grands électeurs ne sont pas proportionnels (Wyoming = 3 / 580k hab = 1 grand électeur pour 193k habitants ; Californie = 54 / 39M = 1 pour 722k), un candidat peut perdre le vote populaire national mais gagner le Collège Électoral. C'est arrivé 5 fois :</p>
    <ul>
      <li>2016 : Trump gagne avec ~3M de voix populaires de moins que Clinton.</li>
      <li>2000 : Bush gagne avec moins de voix que Gore (joué en Floride).</li>
      <li>1888, 1876, 1824 : également.</li>
    </ul>

    <h2>Les swing states (États-pivots)</h2>
    <p>Sur les 50 États, seuls <strong>7</strong> sont véritablement compétitifs et déterminent l'élection :</p>
    <ul>
      <li>Pennsylvanie (19)</li>
      <li>Géorgie (16)</li>
      <li>Caroline du Nord (16)</li>
      <li>Michigan (15)</li>
      <li>Arizona (11)</li>
      <li>Wisconsin (10)</li>
      <li>Nevada (6)</li>
    </ul>
    <p>Total : 93 grands électeurs. Suffisant pour décider qui atteint 270.</p>

    <div class="cta-card">
      <h3>Apprenez les États-clés en jouant</h3>
      <p>Statedoku utilise "Swing state" ou "État avec 10+ grands électeurs" comme indices. Géographie électorale sans révision.</p>
      <a href="/fr/">Jouer le puzzle du jour →</a>
    </div>

    <h2>Questions fréquentes</h2>
    <details><summary><strong>Combien de grands électeurs y a-t-il aux États-Unis ?</strong></summary><p>538 grands électeurs au total. 270 sont nécessaires pour remporter la présidence.</p></details>
    <details><summary><strong>Combien de grands électeurs a la Californie ?</strong></summary><p>54 pour le cycle 2024-2028. C'est l'État avec le plus de grands électeurs.</p></details>
    <details><summary><strong>Que se passe-t-il en cas d'égalité 269-269 ?</strong></summary><p>La Chambre des Représentants élit le président. Chaque État a 1 voix (non proportionnel). C'est arrivé en 1800 (Jefferson) et 1824 (John Quincy Adams).</p></details>
    <details><summary><strong>Pourquoi Washington DC a-t-il des grands électeurs ?</strong></summary><p>Depuis le 23e amendement (1961), DC a 3 grands électeurs, autant que le plus petit État.</p></details>
    <details><summary><strong>Un grand électeur peut-il voter contre son candidat ?</strong></summary><p>Oui : on les appelle "faithless electors". Mais la majorité des États les pénalisent ou annulent leur vote. Quelques cas ont eu lieu sans changer le résultat.</p></details>
`,
  faq([
    ['Combien de grands électeurs y a-t-il aux États-Unis ?', '538 grands électeurs au total. 270 sont nécessaires pour remporter la présidence.'],
    ['Combien de grands électeurs a la Californie ?', '54 grands électeurs pour le cycle 2024-2028. C\'est l\'État avec le plus de grands électeurs.'],
    ['Quels sont les États avec seulement 3 grands électeurs ?', 'Alaska, Delaware, Dakota du Nord, Dakota du Sud, Vermont, Wyoming, et Washington DC.'],
    ['Pourquoi un président peut-il gagner sans le vote populaire ?', 'Parce que les grands électeurs ne sont pas proportionnels à la population. Le Wyoming a 1 grand électeur pour 193,000 habitants, la Californie 1 pour 722,000. C\'est arrivé 5 fois : 2016 (Trump), 2000 (Bush), 1888, 1876, 1824.'],
  ]),
  'Le Collège Électoral américain'
);

// 5. /fr/learn/fuseaux-horaires-etats-unis/
const frFuseaux = wrapFR(
  'fuseaux-horaires-etats-unis',
  'Fuseaux horaires des États-Unis — 6 zones, décalage avec Paris (2026) | Statedoku',
  'Les États-Unis ont 6 fuseaux horaires : Est, Centre, Montagne, Pacifique, Alaska, Hawaï. Carte, États par zone, décalage horaire avec la France et le Québec.',
  'fuseaux horaires etats unis, decalage horaire france etats unis, heure new york paris, heure californie paris, eastern time, pacific time',
  'Fuseaux horaires des États-Unis',
  '6 fuseaux horaires pour 50 États. Quelle heure est-il en Californie quand il est midi à New York. Décalage avec Paris et Montréal.',
  `    <p>Les États-Unis couvrent <strong>6 fuseaux horaires principaux</strong>. Quand il est midi à New York, il est 9h à Los Angeles, 8h à Anchorage et 7h à Honolulu.</p>

    <h2>Les 6 fuseaux horaires (continent + Alaska + Hawaï)</h2>
    <table class="lt">
      <thead><tr><th>Fuseau</th><th>UTC</th><th>États principaux</th><th>Villes clés</th></tr></thead>
      <tbody>
        <tr><td><strong>Eastern (Est)</strong></td><td>UTC-5</td><td>NY, FL, GA, PA, NC, VA, MA, OH, MI, IN…</td><td>New York, Miami, Atlanta, Washington DC, Boston, Detroit</td></tr>
        <tr><td><strong>Central</strong></td><td>UTC-6</td><td>TX, IL, MO, MN, WI, IA, KS, OK, LA, AR, AL, MS, TN…</td><td>Chicago, Houston, Dallas, La Nouvelle-Orléans, Memphis</td></tr>
        <tr><td><strong>Mountain (Montagne)</strong></td><td>UTC-7</td><td>CO, UT, NM, MT, WY, ID, AZ (sans DST)</td><td>Denver, Salt Lake City, Phoenix, Albuquerque</td></tr>
        <tr><td><strong>Pacific (Pacifique)</strong></td><td>UTC-8</td><td>CA, WA, OR, NV</td><td>Los Angeles, San Francisco, Seattle, Las Vegas</td></tr>
        <tr><td><strong>Alaska</strong></td><td>UTC-9</td><td>Alaska</td><td>Anchorage, Juneau, Fairbanks</td></tr>
        <tr><td><strong>Hawaï-Aléoutiennes</strong></td><td>UTC-10</td><td>Hawaï, partie ouest de l'Alaska</td><td>Honolulu, Hilo</td></tr>
      </tbody>
    </table>

    <h2>Décalage horaire avec Paris (heure d'hiver)</h2>
    <table class="lt">
      <thead><tr><th>Quand il est midi à…</th><th>À Paris</th><th>À Montréal</th><th>À Bruxelles</th></tr></thead>
      <tbody>
        <tr><td>New York (Est)</td><td>18h</td><td>12h</td><td>18h</td></tr>
        <tr><td>Chicago (Central)</td><td>19h</td><td>13h</td><td>19h</td></tr>
        <tr><td>Denver (Montagne)</td><td>20h</td><td>14h</td><td>20h</td></tr>
        <tr><td>Los Angeles (Pacifique)</td><td>21h</td><td>15h</td><td>21h</td></tr>
        <tr><td>Honolulu (Hawaï)</td><td>23h</td><td>17h</td><td>23h</td></tr>
      </tbody>
    </table>
    <p><em>Note : Montréal est au fuseau Est (comme NY). En été, l'heure d'été s'applique aux États-Unis (sauf Arizona et Hawaï) et en Europe — les décalages restent stables car les deux changements se compensent.</em></p>

    <h2>États qui traversent 2 fuseaux horaires</h2>
    <ul>
      <li><strong>Floride :</strong> majorité Est, mais le panhandle ouest (Pensacola) en Central.</li>
      <li><strong>Indiana :</strong> majorité Est, coins nord-ouest et sud-ouest en Central.</li>
      <li><strong>Kentucky, Tennessee :</strong> divisés Est/Central.</li>
      <li><strong>Michigan :</strong> majorité Est, coin nord-ouest de la péninsule supérieure en Central.</li>
      <li><strong>Idaho :</strong> nord Pacifique, sud Montagne.</li>
      <li><strong>Oregon :</strong> majorité Pacifique, coin sud-est (comté de Malheur) Montagne.</li>
      <li><strong>Dakotas, Nebraska, Kansas, Texas :</strong> divisés Central/Montagne.</li>
      <li><strong>Alaska :</strong> majorité Alaska, coin ouest Hawaï-Aléoutiennes.</li>
    </ul>

    <h2>L'Arizona et l'heure d'été (DST)</h2>
    <p><strong>L'Arizona n'applique PAS l'heure d'été</strong> (sauf la Nation Navajo). En été, l'Arizona est sur le même horaire que la Californie (Pacifique) au lieu de Mountain. Hawaï n'applique pas non plus le DST.</p>

    <h2>Le changement d'heure aux États-Unis</h2>
    <ul>
      <li><strong>Début heure d'été :</strong> 2e dimanche de mars. On avance d'1h ("spring forward").</li>
      <li><strong>Fin heure d'été :</strong> 1er dimanche de novembre. On recule d'1h ("fall back").</li>
      <li>États qui ne suivent PAS le DST : Arizona (sauf Navajo), Hawaï, et les territoires (Porto Rico, Guam, etc.).</li>
      <li>Florida, Californie et d'autres ont voté pour le DST permanent dans leurs parlements, mais une approbation fédérale est nécessaire (pas encore obtenue).</li>
    </ul>

    <div class="cta-card">
      <h3>Apprenez quels États sont dans quelle zone</h3>
      <p>Statedoku utilise "Fuseau Pacifique" ou "Central Time" comme indices dans le puzzle quotidien.</p>
      <a href="/fr/">Jouer le puzzle du jour →</a>
    </div>

    <h2>Questions fréquentes</h2>
    <details><summary><strong>Combien de fuseaux horaires ont les États-Unis ?</strong></summary><p>6 dans les territoires habités : Est, Central, Montagne, Pacifique, Alaska, Hawaï-Aléoutiennes. Plus Samoa Américaines (UTC-11) et Guam/Mariannes (UTC+10).</p></details>
    <details><summary><strong>Quelle heure est-il à Los Angeles quand il est 18h à Paris ?</strong></summary><p>9h du matin (en hiver), 9h du matin également (en été car les deux changent en même temps). Le décalage Paris-LA est stable à 9 heures toute l'année.</p></details>
    <details><summary><strong>Quel est le décalage horaire entre New York et Paris ?</strong></summary><p>6 heures. Quand il est midi à New York, il est 18h à Paris. Stable toute l'année.</p></details>
    <details><summary><strong>Pourquoi l'Arizona ne change-t-elle pas d'heure ?</strong></summary><p>Décision prise en 1968 pour éviter les soirées d'été longues avec une chaleur extrême. Plus de sens économique dans le désert : ils préfèrent que le coucher de soleil soit plus tôt.</p></details>
`,
  faq([
    ['Combien de fuseaux horaires ont les États-Unis ?', '6 fuseaux horaires principaux : Eastern (UTC-5), Central (UTC-6), Mountain (UTC-7), Pacific (UTC-8), Alaska (UTC-9), Hawaii-Aleutian (UTC-10).'],
    ['Quel est le décalage horaire entre Paris et New York ?', '6 heures. Quand il est midi à New York, il est 18h à Paris. Stable toute l\'année car les deux pays appliquent le changement d\'heure aux mêmes périodes.'],
    ['Quel est le décalage horaire entre Paris et Los Angeles ?', '9 heures. Quand il est midi à Los Angeles, il est 21h à Paris. Stable toute l\'année.'],
    ['L\'Arizona applique-t-elle l\'heure d\'été ?', 'Non, l\'Arizona n\'applique PAS l\'heure d\'été (sauf la Nation Navajo). En été, l\'Arizona est au même horaire que la Californie (Pacifique).'],
  ]),
  'Fuseaux horaires des États-Unis'
);

// 6. /fr/learn/surnoms-des-etats/
const frSurnoms = wrapFR(
  'surnoms-des-etats',
  'Surnoms des 50 États américains — la liste complète (2026) | Statedoku',
  'Les surnoms officiels des 50 États : Texas "Lone Star State", Californie "Golden State", Floride "Sunshine State", Alaska "Last Frontier"... Histoire et signification de chacun.',
  'surnoms etats unis, surnom californie, surnom texas, surnom floride, lone star state, golden state, sunshine state',
  'Surnoms des 50 États américains',
  'Lone Star, Golden State, Sunshine State, Bluegrass... La liste complète des surnoms officiels et leur histoire.',
  `    <p>Chacun des 50 États américains a au moins un <strong>surnom officiel ou populaire</strong>. Ils apparaissent sur les plaques d'immatriculation, les pièces de monnaie, les drapeaux et la publicité touristique. Ils racontent l'histoire, la géographie ou la culture de l'État.</p>

    <h2>Tableau complet des surnoms par État</h2>
    <table class="lt">
      <thead><tr><th>État</th><th>Surnom</th><th>Signification</th></tr></thead>
      <tbody>
        <tr><td>Alabama</td><td>Yellowhammer State</td><td>D'après l'oiseau jaune, symbole de la Guerre Civile.</td></tr>
        <tr><td>Alaska</td><td>The Last Frontier</td><td>Le dernier territoire inexploré.</td></tr>
        <tr><td>Arizona</td><td>Grand Canyon State</td><td>D'après le Grand Canyon du Colorado.</td></tr>
        <tr><td>Arkansas</td><td>Natural State</td><td>D'après sa nature sauvage.</td></tr>
        <tr><td>Californie</td><td>Golden State</td><td>De la ruée vers l'or de 1849 et la lumière dorée.</td></tr>
        <tr><td>Colorado</td><td>Centennial State</td><td>Admis en 1876, centenaire de l'indépendance.</td></tr>
        <tr><td>Connecticut</td><td>Constitution State</td><td>D'après les "Fundamental Orders of Connecticut" (1639), première constitution écrite.</td></tr>
        <tr><td>Delaware</td><td>First State</td><td>Premier à ratifier la Constitution (1787).</td></tr>
        <tr><td>Floride</td><td>Sunshine State</td><td>D'après son climat.</td></tr>
        <tr><td>Géorgie</td><td>Peach State</td><td>D'après ses pêches.</td></tr>
        <tr><td>Hawaï</td><td>Aloha State</td><td>D'après la salutation hawaïenne.</td></tr>
        <tr><td>Idaho</td><td>Gem State</td><td>D'après ses minéraux et pierres précieuses.</td></tr>
        <tr><td>Illinois</td><td>Prairie State</td><td>D'après les grandes prairies.</td></tr>
        <tr><td>Indiana</td><td>Hoosier State</td><td>Origine incertaine, mais "Hoosier" est le gentilé populaire.</td></tr>
        <tr><td>Iowa</td><td>Hawkeye State</td><td>D'après un chef Sauk appelé Black Hawk.</td></tr>
        <tr><td>Kansas</td><td>Sunflower State</td><td>D'après le tournesol, fleur d'État.</td></tr>
        <tr><td>Kentucky</td><td>Bluegrass State</td><td>D'après l'herbe bluegrass qui pousse dans ses prés.</td></tr>
        <tr><td>Louisiane</td><td>Pelican State</td><td>D'après le pélican brun, symbole d'État.</td></tr>
        <tr><td>Maine</td><td>Pine Tree State</td><td>D'après ses forêts de pins blancs.</td></tr>
        <tr><td>Maryland</td><td>Old Line State</td><td>D'après la "Maryland Line" de l'armée révolutionnaire.</td></tr>
        <tr><td>Massachusetts</td><td>Bay State</td><td>D'après la Baie du Massachusetts.</td></tr>
        <tr><td>Michigan</td><td>Great Lake State</td><td>D'après les 4 Grands Lacs qui l'entourent.</td></tr>
        <tr><td>Minnesota</td><td>Land of 10,000 Lakes</td><td>En réalité plus de 11,000 lacs.</td></tr>
        <tr><td>Mississippi</td><td>Magnolia State</td><td>D'après le magnolia, arbre d'État.</td></tr>
        <tr><td>Missouri</td><td>Show Me State</td><td>"Montre-moi" — attitude sceptique de ses habitants.</td></tr>
        <tr><td>Montana</td><td>Treasure State</td><td>D'après sa richesse minérale.</td></tr>
        <tr><td>Nebraska</td><td>Cornhusker State</td><td>D'après la récolte du maïs.</td></tr>
        <tr><td>Nevada</td><td>Silver State</td><td>D'après les mines d'argent du Comstock Lode.</td></tr>
        <tr><td>New Hampshire</td><td>Granite State</td><td>D'après ses formations de granit.</td></tr>
        <tr><td>New Jersey</td><td>Garden State</td><td>D'après l'agriculture historique.</td></tr>
        <tr><td>Nouveau-Mexique</td><td>Land of Enchantment</td><td>D'après sa beauté naturelle et culturelle.</td></tr>
        <tr><td>New York</td><td>Empire State</td><td>Attribué à George Washington — futur empire.</td></tr>
        <tr><td>Caroline du Nord</td><td>Tar Heel State</td><td>D'après la production historique de goudron.</td></tr>
        <tr><td>Dakota du Nord</td><td>Peace Garden State</td><td>D'après le Jardin International de la Paix à la frontière canadienne.</td></tr>
        <tr><td>Ohio</td><td>Buckeye State</td><td>D'après l'arbre buckeye (marronnier d'Amérique).</td></tr>
        <tr><td>Oklahoma</td><td>Sooner State</td><td>D'après les colons "sooners" entrés trop tôt en 1889.</td></tr>
        <tr><td>Oregon</td><td>Beaver State</td><td>D'après le castor, symbole d'État et commerce de fourrures.</td></tr>
        <tr><td>Pennsylvanie</td><td>Keystone State</td><td>État "clé de voûte" des 13 colonies originelles.</td></tr>
        <tr><td>Rhode Island</td><td>Ocean State</td><td>D'après sa grande côte relativement à sa taille.</td></tr>
        <tr><td>Caroline du Sud</td><td>Palmetto State</td><td>D'après le palmier palmetto, symbole de la Guerre d'Indépendance.</td></tr>
        <tr><td>Dakota du Sud</td><td>Mount Rushmore State</td><td>D'après le mont avec 4 présidents sculptés.</td></tr>
        <tr><td>Tennessee</td><td>Volunteer State</td><td>D'après les volontaires de la Guerre de 1812.</td></tr>
        <tr><td>Texas</td><td>Lone Star State</td><td>D'après l'étoile solitaire de son drapeau, symbole de son indépendance.</td></tr>
        <tr><td>Utah</td><td>Beehive State</td><td>D'après la ruche mormone, symbole d'industrie.</td></tr>
        <tr><td>Vermont</td><td>Green Mountain State</td><td>De "vert mont" en français — "montagne verte".</td></tr>
        <tr><td>Virginie</td><td>Old Dominion</td><td>D'après sa loyauté à la Couronne anglaise avant l'indépendance.</td></tr>
        <tr><td>Washington (état)</td><td>Evergreen State</td><td>D'après ses forêts toujours vertes.</td></tr>
        <tr><td>Virginie-Occidentale</td><td>Mountain State</td><td>Entièrement couvert par les Appalaches.</td></tr>
        <tr><td>Wisconsin</td><td>Badger State</td><td>D'après les mineurs qui vivaient sous terre comme des blaireaux.</td></tr>
        <tr><td>Wyoming</td><td>Equality State</td><td>Premier État à donner le vote aux femmes (1869).</td></tr>
      </tbody>
    </table>

    <h2>Surnoms les plus connus à l'international</h2>
    <ul>
      <li><strong>Texas — Lone Star State :</strong> le plus reconnaissable internationalement.</li>
      <li><strong>Californie — Golden State :</strong> utilisé par les Golden State Warriors (NBA).</li>
      <li><strong>Floride — Sunshine State :</strong> apparaît sur chaque plaque d'immatriculation.</li>
      <li><strong>New York — Empire State :</strong> donne son nom à l'Empire State Building.</li>
      <li><strong>Alaska — Last Frontier :</strong> évocateur du Far West.</li>
    </ul>

    <h2>Surnom français : Vermont = "Green Mountain"</h2>
    <p>Le seul État dont le nom et le surnom viennent du français : "Vert Mont" devenu "Vermont", puis traduit en anglais "Green Mountain State". Hommage aux montagnes Vertes (Green Mountains) qui le traversent.</p>

    <div class="cta-card">
      <h3>Apprenez les surnoms en jouant</h3>
      <p>Statedoku utilise les surnoms comme indices — "Aloha State", "Bluegrass State", "Sunshine State". Apprentissage sans effort.</p>
      <a href="/fr/">Jouer le puzzle du jour →</a>
    </div>

    <h2>Questions fréquentes</h2>
    <details><summary><strong>Pourquoi le Texas est-il le "Lone Star State" ?</strong></summary><p>D'après l'étoile solitaire de son drapeau, qui symbolise son indépendance comme République du Texas (1836-1845) avant de rejoindre les États-Unis.</p></details>
    <details><summary><strong>Pourquoi la Californie est-elle le "Golden State" ?</strong></summary><p>De la ruée vers l'or de 1849 qui l'a massivement peuplée, et aussi de la lumière dorée de ses collines en été.</p></details>
    <details><summary><strong>Que signifie "Hoosier State" (Indiana) ?</strong></summary><p>L'origine est débattue. Possibles : du salut "Who's there?" prononcé "Hoo-sher", d'un contremaître appelé Hoosier, ou d'un mot amérindien. Aujourd'hui, c'est le gentilé officiel.</p></details>
    <details><summary><strong>Quel État a un surnom français ?</strong></summary><p>Le Vermont. Son nom vient du français "Vert Mont" (montagne verte), et son surnom "Green Mountain State" en est la traduction.</p></details>
`,
  faq([
    ['Quel est le surnom du Texas ?', 'Lone Star State (l\'État de l\'Étoile Solitaire), d\'après l\'unique étoile de son drapeau, symbole de sa brève indépendance comme République du Texas (1836-1845).'],
    ['Quel est le surnom de la Californie ?', 'Golden State (l\'État Doré), d\'après la ruée vers l\'or de 1849 et la lumière dorée de ses paysages.'],
    ['Quel est le surnom de la Floride ?', 'Sunshine State (l\'État du Soleil), d\'après son climat ensoleillé toute l\'année.'],
    ['Quel État américain a un nom d\'origine française ?', 'Le Vermont, dont le nom vient du français "Vert Mont" (montagne verte). Son surnom officiel "Green Mountain State" en est la traduction.'],
  ]),
  'Surnoms des 50 États'
);

// ── Write all files ──────────────────────────────────────────────────────
const out = [
  ['es/learn/colegio-electoral', esColegio],
  ['es/learn/estados-bisagra', esSwing],
  ['es/learn/territorios-eeuu', esTerritorios],
  ['es/learn/zonas-horarias-eeuu', esZonas],
  ['es/learn/apodos-de-estados', esApodos],
  ['es/learn/cinturones-eeuu', esCinturones],
  ['fr/learn/capitales-des-etats', frCapitales],
  ['fr/learn/regions-des-etats-unis', frRegions],
  ['fr/learn/drapeaux-des-etats', frDrapeaux],
  ['fr/learn/college-electoral', frCollege],
  ['fr/learn/fuseaux-horaires-etats-unis', frFuseaux],
  ['fr/learn/surnoms-des-etats', frSurnoms],
];

for (const [rel, html] of out) {
  const dir = path.join(ROOT, rel);
  fs.mkdirSync(dir, { recursive: true });
  fs.writeFileSync(path.join(dir, 'index.html'), html);
  console.log(`✅ /${rel}/`);
}

console.log(`\n${out.length} pages générées.`);
