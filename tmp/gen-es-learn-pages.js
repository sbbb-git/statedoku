#!/usr/bin/env node
/**
 * Generate 3 new high-value Spanish learn pages targeting LATAM long-tail queries:
 *
 *   /es/learn/regiones-de-eeuu/       — Spanish: "regiones estados unidos", "regiones eeuu"
 *   /es/learn/banderas-de-estados/    — Spanish: "banderas estados unidos", "bandera estados"
 *   /es/learn/colonias-originales/    — Spanish: "13 colonias originales", "colonias eeuu"
 *
 * Why these three: launch day analytics showed /es/learn/state-abbreviations/
 * captured 13% of all traffic (organic Spanish SEO). Adding more high-volume
 * Spanish queries can compound that signal.
 */
const fs = require('fs');
const path = require('path');

const ROOT = path.resolve(__dirname, '..');
const states = JSON.parse(fs.readFileSync(path.join(ROOT, 'data/states.json'), 'utf8'));

const slugFor = s => s.names.en.toLowerCase().replace(/\s+/g, '-');
const byId = Object.fromEntries(states.map(s => [s.id, s]));

const hreflangBlock = (slug) => `
  <link rel="canonical" href="https://statedoku.com/es/learn/${slug}/">
  <link rel="alternate" hreflang="es" href="https://statedoku.com/es/learn/${slug}/">
  <link rel="alternate" hreflang="es-ES" href="https://statedoku.com/es/learn/${slug}/">
  <link rel="alternate" hreflang="es-MX" href="https://statedoku.com/es/learn/${slug}/">
  <link rel="alternate" hreflang="es-AR" href="https://statedoku.com/es/learn/${slug}/">
  <link rel="alternate" hreflang="es-CO" href="https://statedoku.com/es/learn/${slug}/">
  <link rel="alternate" hreflang="es-PE" href="https://statedoku.com/es/learn/${slug}/">
  <link rel="alternate" hreflang="es-CL" href="https://statedoku.com/es/learn/${slug}/">
  <link rel="alternate" hreflang="es-US" href="https://statedoku.com/es/learn/${slug}/">
  <link rel="alternate" hreflang="x-default" href="https://statedoku.com/learn/${slug}/">`;

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

const footerBlock = `<footer>
  <p>Statedoku &copy; 2026 &nbsp;·&nbsp; <a href="https://www.reddit.com/r/Statedoku/" rel="noopener" target="_blank">💬 Reddit</a> &nbsp;·&nbsp; <a href="/es/about/">Acerca</a> &nbsp;·&nbsp; <a href="/es/learn/">Aprender</a> &nbsp;·&nbsp; <a href="/states/">Todos los estados</a> &nbsp;·&nbsp; <a href="/quiz/">Quiz</a> &nbsp;·&nbsp; <a href="/facts/">Facts</a> &nbsp;·&nbsp; <a href="/es/faq/">FAQ</a></p>
</footer>
<script src="/config.js"></script>
<script src="/js/admin.js"></script>
</body>
</html>`;

const relatedGrid = `    <div class="related-grid">
      <a href="/es/learn/">→ Aprender los 50 estados</a>
      <a href="/es/learn/capitales-de-estados/">→ Las 50 capitales</a>
      <a href="/es/learn/state-abbreviations/">→ Abreviaturas USPS</a>
      <a href="/es/learn/crucigrama-estados/">→ Ayuda para crucigramas</a>
      <a href="/es/learn/states-and-capitals/">→ Lista estados y capitales</a>
      <a href="/es/learn/states-bordering-canada/">→ Estados que limitan con Canadá</a>
      <a href="/es/learn/states-bordering-mexico/">→ Estados que limitan con México</a>
      <a href="/es/learn/landlocked-states/">→ Estados sin salida al mar</a>
      <a href="/es/learn/largest-states/">→ Los estados más grandes</a>
      <a href="/es/learn/no-income-tax/">→ Estados sin impuesto sobre la renta</a>
    </div>`;

// ── 1. /es/learn/regiones-de-eeuu/ ─────────────────────────────────────────
function buildRegions() {
  const byRegion = { northeast: [], south: [], midwest: [], west: [] };
  for (const s of states) byRegion[s.region]?.push(s);
  const labelES = { northeast: 'Noreste', south: 'Sur', midwest: 'Medio Oeste', west: 'Oeste' };
  const regionRows = Object.entries(byRegion).map(([k, list]) => {
    return `<h3>${labelES[k]} (${list.length} estados)</h3>
    <p>${list.map(s => `<a href="/es/states/${slugFor(s)}/"><strong>${s.names.es}</strong></a> (${s.id})`).join(' · ')}</p>`;
  }).join('\n');

  const faq = JSON.stringify({
    '@context': 'https://schema.org',
    '@type': 'FAQPage',
    mainEntity: [
      { '@type': 'Question', name: '¿Cuántas regiones tiene Estados Unidos?', acceptedAnswer: { '@type': 'Answer', text: 'La Oficina del Censo de EE.UU. divide el país en 4 regiones principales: Noreste, Sur, Medio Oeste y Oeste. Dentro de ellas hay 9 subregiones.' } },
      { '@type': 'Question', name: '¿Cuántos estados hay en cada región?', acceptedAnswer: { '@type': 'Answer', text: `Noreste: ${byRegion.northeast.length} estados. Sur: ${byRegion.south.length}. Medio Oeste: ${byRegion.midwest.length}. Oeste: ${byRegion.west.length}.` } },
      { '@type': 'Question', name: '¿Dónde está California?', acceptedAnswer: { '@type': 'Answer', text: 'California está en la región Oeste, específicamente en la subregión Pacífico.' } },
      { '@type': 'Question', name: '¿Dónde está Texas?', acceptedAnswer: { '@type': 'Answer', text: 'Texas está en la región Sur, específicamente en la subregión Centro-Suroeste (West South Central).' } },
      { '@type': 'Question', name: '¿Cuál es la región más poblada?', acceptedAnswer: { '@type': 'Answer', text: 'El Sur, con más de 125 millones de habitantes en sus 16 estados (más DC).' } },
    ],
  });

  return `<!DOCTYPE html>
<html lang="es">
<head>
  <meta charset="UTF-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0, viewport-fit=cover">
  <meta name="theme-color" content="#0F2147">
  <meta name="color-scheme" content="light">

  <title>Las 4 regiones de EE.UU. — Noreste, Sur, Medio Oeste, Oeste (2026) | Statedoku</title>
  <meta name="description" content="Las 4 regiones de Estados Unidos según la Oficina del Censo: Noreste (9 estados), Sur (16), Medio Oeste (12), Oeste (13). Lista completa de estados por región, mapa y datos.">
  <meta name="keywords" content="regiones estados unidos, regiones eeuu, regiones de ee.uu., noreste estados unidos, sur estados unidos, medio oeste, oeste estados unidos">
  <meta name="robots" content="index, follow, max-image-preview:large">
${hreflangBlock('regiones-de-eeuu')}
  <link rel="icon" type="image/svg+xml" href="/favicon.svg?v=5">
  <link rel="stylesheet" href="/css/style.css?v=17">

  <meta property="og:type" content="article">
  <meta property="og:title" content="Las 4 regiones de EE.UU. — lista completa de estados por región">
  <meta property="og:description" content="Noreste, Sur, Medio Oeste, Oeste — y sus 9 subregiones. Lista completa de los 50 estados agrupados, con datos por región.">
  <meta property="og:url" content="https://statedoku.com/es/learn/regiones-de-eeuu/">
  <meta property="og:image" content="https://statedoku.com/og/og-learn-state-capitals.png">
  <meta property="og:locale" content="es_ES">
  <meta name="twitter:card" content="summary_large_image">
  <meta name="twitter:title" content="Las 4 regiones de EE.UU.">
  <meta name="twitter:description" content="Noreste, Sur, Medio Oeste, Oeste — lista completa de estados por región.">
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
  {"@type":"ListItem","position":3,"name":"Las 4 regiones de EE.UU.","item":"https://statedoku.com/es/learn/regiones-de-eeuu/"}
]}
</script>
<script type="application/ld+json">${faq}</script>

<main>
  <section class="lt-hero">
    <h1>Las 4 regiones de EE.UU.</h1>
    <p class="sub">Noreste, Sur, Medio Oeste y Oeste. Cómo la Oficina del Censo divide los 50 estados, con sus 9 subregiones.</p>
  </section>

  <article class="lt-main">

    <p>La <strong>Oficina del Censo de Estados Unidos</strong> divide el país en <strong>4 regiones principales</strong> y <strong>9 subregiones</strong>. Este sistema es el más usado para estadísticas, política y geografía.</p>

    <h2>Las 4 regiones principales</h2>

${regionRows}

    <h2>Las 9 subregiones</h2>
    <table class="lt">
      <thead><tr><th>Región</th><th>Subregión</th><th>Ejemplos</th></tr></thead>
      <tbody>
        <tr><td>Noreste</td><td>Nueva Inglaterra</td><td>Massachusetts, Maine, Vermont</td></tr>
        <tr><td>Noreste</td><td>Atlántico Medio</td><td>Nueva York, Nueva Jersey, Pensilvania</td></tr>
        <tr><td>Sur</td><td>Atlántico Sur</td><td>Florida, Georgia, Carolinas</td></tr>
        <tr><td>Sur</td><td>Centro-Sureste</td><td>Tennessee, Kentucky, Alabama, Misisipi</td></tr>
        <tr><td>Sur</td><td>Centro-Suroeste</td><td>Texas, Oklahoma, Arkansas, Luisiana</td></tr>
        <tr><td>Medio Oeste</td><td>Centro-Noreste</td><td>Illinois, Indiana, Ohio, Michigan, Wisconsin</td></tr>
        <tr><td>Medio Oeste</td><td>Centro-Noroeste</td><td>Iowa, Kansas, Misuri, Nebraska, Dakotas, Minnesota</td></tr>
        <tr><td>Oeste</td><td>Montaña</td><td>Colorado, Utah, Arizona, Nuevo México, Montana, Wyoming, Idaho, Nevada</td></tr>
        <tr><td>Oeste</td><td>Pacífico</td><td>California, Oregón, Washington, Alaska, Hawái</td></tr>
      </tbody>
    </table>

    <div class="cta-card">
      <h3>Aprende las regiones jugando</h3>
      <p>Statedoku usa "Región: Sur" o "Costa Pacífica" como pistas en su puzzle diario. Cinco minutos al día y las regiones se vuelven obvias.</p>
      <a href="/es/">Jugar el puzzle de hoy →</a>
    </div>

    <h2>Preguntas frecuentes</h2>
    <details><summary><strong>¿Cuántas regiones tiene Estados Unidos?</strong></summary><p>4 regiones principales (Noreste, Sur, Medio Oeste, Oeste) y 9 subregiones según la Oficina del Censo.</p></details>
    <details><summary><strong>¿Por qué Texas no está en el Oeste?</strong></summary><p>Aunque culturalmente Texas se asocia al Oeste americano, la Oficina del Censo lo clasifica en el <strong>Sur</strong>, subregión Centro-Suroeste. Históricamente, Texas era parte del Sur esclavista y se unió a la Confederación.</p></details>
    <details><summary><strong>¿Hawái y Alaska son del Oeste?</strong></summary><p>Sí. Ambos están en la subregión <strong>Pacífico</strong> del Oeste, aunque no comparten frontera con los otros estados de esa subregión.</p></details>
    <details><summary><strong>¿Cuál es la región más poblada?</strong></summary><p>El <strong>Sur</strong>, con más de 125 millones de habitantes. Texas y Florida son los motores demográficos.</p></details>

    <h2>Guías relacionadas</h2>
${relatedGrid}
  </article>
</main>

${footerBlock}`;
}

// ── 2. /es/learn/banderas-de-estados/ ──────────────────────────────────────
function buildFlags() {
  const faq = JSON.stringify({
    '@context': 'https://schema.org',
    '@type': 'FAQPage',
    mainEntity: [
      { '@type': 'Question', name: '¿Cuántos estados de EE.UU. tienen su propia bandera?', acceptedAnswer: { '@type': 'Answer', text: 'Los 50 estados tienen su propia bandera oficial, además de la bandera de Estados Unidos.' } },
      { '@type': 'Question', name: '¿Cuál es la bandera estatal más antigua?', acceptedAnswer: { '@type': 'Answer', text: 'La bandera de Maryland, adoptada oficialmente en 1904, pero basada en el escudo de la familia Calvert del siglo XVII. Por su patrón heráldico es la más distintiva de EE.UU.' } },
      { '@type': 'Question', name: '¿Por qué muchas banderas estatales son azules con un sello?', acceptedAnswer: { '@type': 'Answer', text: 'A finales del siglo XIX, muchos regimientos estatales usaban banderas militares azules con el sello del estado en el centro. Después esas se adoptaron como banderas oficiales. Resultado: 20+ estados tienen banderas casi indistinguibles. Esto se conoce como el problema de las "Seals on Blue".' } },
      { '@type': 'Question', name: '¿Qué bandera estatal tiene una bandera británica?', acceptedAnswer: { '@type': 'Answer', text: 'Hawái. Es la única bandera de un estado de EE.UU. que incluye la Union Jack británica. Refleja la influencia británica en el Reino de Hawái antes de su anexión.' } },
      { '@type': 'Question', name: '¿Cuál es la bandera más reconocible?', acceptedAnswer: { '@type': 'Answer', text: 'Texas (la única que casi nunca cambia, "Lone Star") y California (con su oso pardo y la palabra "California Republic"). Ambas son banderas históricas reutilizadas.' } },
    ],
  });

  return `<!DOCTYPE html>
<html lang="es">
<head>
  <meta charset="UTF-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0, viewport-fit=cover">
  <meta name="theme-color" content="#0F2147">
  <meta name="color-scheme" content="light">

  <title>Banderas de los 50 estados de EE.UU. — historia y diseño (2026) | Statedoku</title>
  <meta name="description" content="Las banderas de los 50 estados de Estados Unidos: historia, diseño, las más antiguas (Maryland), las más distintivas (Texas, California) y el problema de los sellos azules.">
  <meta name="keywords" content="banderas estados unidos, bandera estados eeuu, banderas de los estados, bandera california, bandera texas, bandera hawai, bandera maryland">
  <meta name="robots" content="index, follow, max-image-preview:large">
${hreflangBlock('banderas-de-estados')}
  <link rel="icon" type="image/svg+xml" href="/favicon.svg?v=5">
  <link rel="stylesheet" href="/css/style.css?v=17">

  <meta property="og:type" content="article">
  <meta property="og:title" content="Banderas de los 50 estados de EE.UU. — historia, diseño, datos">
  <meta property="og:description" content="Por qué tantas banderas estatales son azules con un sello, cuál es la más antigua, cuál tiene una Union Jack y más.">
  <meta property="og:url" content="https://statedoku.com/es/learn/banderas-de-estados/">
  <meta property="og:image" content="https://statedoku.com/og/og-learn-state-capitals.png">
  <meta property="og:locale" content="es_ES">
  <meta name="twitter:card" content="summary_large_image">
  <meta name="twitter:title" content="Banderas de los 50 estados de EE.UU.">
  <meta name="twitter:description" content="Historia y diseño de las banderas estatales — y por qué tantas se parecen.">
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
  {"@type":"ListItem","position":3,"name":"Banderas de los estados","item":"https://statedoku.com/es/learn/banderas-de-estados/"}
]}
</script>
<script type="application/ld+json">${faq}</script>

<main>
  <section class="lt-hero">
    <h1>Banderas de los 50 estados</h1>
    <p class="sub">Historia, diseño y curiosidades. Por qué tantas son azules con un sello — y cuáles son las que sí destacan.</p>
  </section>

  <article class="lt-main">

    <h2>Los 50 estados, sus banderas y curiosidades</h2>

    <h3>Las más distintivas (rara vez se confunden)</h3>
    <ul>
      <li><strong>Maryland</strong> — la más reconocible. Patrón heráldico amarillo/negro y rojo/blanco de la familia Calvert. Adoptada en 1904, basada en el escudo del siglo XVII.</li>
      <li><strong>Texas</strong> — la "Lone Star Flag". Roja, blanca y azul con una estrella. Adoptada en 1839 cuando Texas era una república independiente.</li>
      <li><strong>California</strong> — un oso pardo (extinguido) caminando, con la palabra "California Republic". Adoptada después de la Bear Flag Revolt de 1846.</li>
      <li><strong>Hawái</strong> — la única bandera estatal con la <strong>Union Jack británica</strong>. Refleja el periodo del Reino de Hawái aliado con Reino Unido (1816-1893).</li>
      <li><strong>Arizona</strong> — un sol cobre estilizado, naranja, rojo, azul. Adoptada en 1917.</li>
      <li><strong>Nuevo México</strong> — sol Zia (símbolo nativo) en amarillo y rojo. Adoptada en 1925.</li>
      <li><strong>Alaska</strong> — la Osa Mayor y la estrella polar en azul. Diseñada en 1927 por un huérfano de 13 años (Benny Benson).</li>
      <li><strong>Carolina del Sur</strong> — Palmeto y media luna en azul. Símbolo de la guerra revolucionaria.</li>
      <li><strong>Tennessee</strong> — 3 estrellas dentro de un círculo blanco sobre fondo rojo. Representa las 3 regiones del estado.</li>
      <li><strong>Colorado</strong> — barras azul-blanco-azul con una C roja y un círculo amarillo. Sol y montañas.</li>
    </ul>

    <h3>El problema de las "Seals on Blue"</h3>
    <p>Más de 20 estados tienen banderas similares: un sello estatal sobre fondo azul. Son tan parecidas que es casi imposible distinguirlas a distancia. Ejemplos: Wisconsin, Minnesota, Michigan, Indiana, Pensilvania, Nebraska, Nueva York, Virginia, Misuri, Kansas, Massachusetts, Vermont, New Hampshire, Oregón, Idaho, Montana, Dakota del Sur, Dakota del Norte, Iowa, Connecticut.</p>
    <p>Causa histórica: a finales del siglo XIX, los regimientos militares estatales usaban banderas militares azules con el sello del estado. Esas banderas se adoptaron como oficiales sin rediseño.</p>

    <h3>Banderas que han cambiado recientemente</h3>
    <ul>
      <li><strong>Misisipi</strong> — cambió en 2021. La anterior incluía la bandera confederada en la esquina. La nueva muestra una magnolia.</li>
      <li><strong>Georgia</strong> — cambió en 2003. La anterior incluía elementos confederados.</li>
      <li><strong>Utah</strong> — rediseñada en 2024, primer cambio mayor desde 1913.</li>
      <li><strong>Minnesota</strong> — rediseñada en 2024 (eliminando el sello azul tradicional).</li>
    </ul>

    <div class="cta-card">
      <h3>Estudia los estados con un puzzle diario</h3>
      <p>Statedoku usa pistas como "estados confederados" o "estados con bandera reciente" en su puzzle diario. Aprende geografía sin tarjetas.</p>
      <a href="/es/">Jugar el puzzle de hoy →</a>
    </div>

    <h2>Preguntas frecuentes</h2>
    <details><summary><strong>¿Cuál es la bandera estatal más antigua?</strong></summary><p>Maryland (1904), basada en el escudo de los Calvert del siglo XVII. Es la única bandera estatal con un patrón heráldico europeo.</p></details>
    <details><summary><strong>¿Qué bandera tiene la Union Jack?</strong></summary><p>Solo Hawái. Refleja el Reino de Hawái aliado con Reino Unido.</p></details>
    <details><summary><strong>¿Cuál es la bandera estatal más rediseñada?</strong></summary><p>Misisipi cambió en 2021 (eliminando la bandera confederada). Georgia en 2003. Utah y Minnesota en 2024. La tendencia: rediseñar para banderas más distintivas.</p></details>
    <details><summary><strong>¿Existe un ranking oficial de banderas estatales?</strong></summary><p>La North American Vexillological Association ha hecho rankings. En 2001, las mejores fueron Nuevo México, Texas, Maryland, Alaska, Arizona. Las peores: Georgia (versión de 2001), Nebraska, Montana, Kansas, Misisipi (versión antigua).</p></details>

    <h2>Guías relacionadas</h2>
${relatedGrid}
  </article>
</main>

${footerBlock}`;
}

// ── 3. /es/learn/colonias-originales/ ──────────────────────────────────────
function buildColonies() {
  const COLONIES_INFO = [
    { name: 'Virginia', state: 'Virginia', usps: 'VA', founded: 1607, ratified: 1788, ratifiedOrder: 10, note: 'Jamestown — el primer asentamiento inglés permanente.' },
    { name: 'Massachusetts', state: 'Massachusetts', usps: 'MA', founded: 1620, ratified: 1788, ratifiedOrder: 6, note: 'Llegada del Mayflower a Plymouth. Cuna de la Revolución.' },
    { name: 'New Hampshire', state: 'New Hampshire', usps: 'NH', founded: 1623, ratified: 1788, ratifiedOrder: 9, note: 'Pesca y madera. La 9ª en ratificar — la que activó la Constitución.' },
    { name: 'Maryland', state: 'Maryland', usps: 'MD', founded: 1632, ratified: 1788, ratifiedOrder: 7, note: 'Refugio para católicos. Fundada por Lord Baltimore.' },
    { name: 'Connecticut', state: 'Connecticut', usps: 'CT', founded: 1636, ratified: 1788, ratifiedOrder: 5, note: 'Separación puritana de Massachusetts. Pueblo de Thomas Hooker.' },
    { name: 'Rhode Island', state: 'Rhode Island', usps: 'RI', founded: 1636, ratified: 1790, ratifiedOrder: 13, note: 'Refugio de libertad religiosa fundado por Roger Williams. La ÚLTIMA en ratificar.' },
    { name: 'Delaware', state: 'Delaware', usps: 'DE', founded: 1638, ratified: 1787, ratifiedOrder: 1, note: 'Inicialmente sueca y holandesa. La PRIMERA en ratificar la Constitución.' },
    { name: 'Carolina del Norte', state: 'North Carolina', usps: 'NC', founded: 1653, ratified: 1789, ratifiedOrder: 12, note: 'Originalmente parte de Carolina (con SC). Tabaco y algodón.' },
    { name: 'Carolina del Sur', state: 'South Carolina', usps: 'SC', founded: 1663, ratified: 1788, ratifiedOrder: 8, note: 'Charleston como puerto del comercio de esclavos. Plantaciones de arroz e índigo.' },
    { name: 'Nueva York', state: 'New York', usps: 'NY', founded: 1664, ratified: 1788, ratifiedOrder: 11, note: 'Antes Nueva Ámsterdam holandesa. Capturada por los británicos en 1664.' },
    { name: 'Nueva Jersey', state: 'New Jersey', usps: 'NJ', founded: 1664, ratified: 1787, ratifiedOrder: 3, note: 'Dividida entre East y West Jersey al principio. La 3ª en ratificar.' },
    { name: 'Pensilvania', state: 'Pennsylvania', usps: 'PA', founded: 1681, ratified: 1787, ratifiedOrder: 2, note: 'Fundada por William Penn como refugio cuáquero. Filadelfia = capital de la nueva nación.' },
    { name: 'Georgia', state: 'Georgia', usps: 'GA', founded: 1732, ratified: 1788, ratifiedOrder: 4, note: 'La última colonia fundada. Originalmente para deudores británicos.' },
  ];

  const rows = COLONIES_INFO.sort((a, b) => a.ratifiedOrder - b.ratifiedOrder).map(c => {
    const slug = c.state.toLowerCase().replace(/\s+/g, '-');
    return `<tr><td>${c.ratifiedOrder}</td><td><a href="/es/states/${slug}/"><strong>${c.name}</strong></a></td><td>${c.usps}</td><td>${c.founded}</td><td>${c.ratified}</td><td>${c.note}</td></tr>`;
  }).join('\n');

  const faq = JSON.stringify({
    '@context': 'https://schema.org',
    '@type': 'FAQPage',
    mainEntity: [
      { '@type': 'Question', name: '¿Cuáles son las 13 colonias originales?', acceptedAnswer: { '@type': 'Answer', text: 'Las 13 colonias británicas en América del Norte que se independizaron en 1776: Virginia, Massachusetts, New Hampshire, Maryland, Connecticut, Rhode Island, Delaware, Carolina del Norte, Carolina del Sur, Nueva York, Nueva Jersey, Pensilvania y Georgia.' } },
      { '@type': 'Question', name: '¿Cuál fue la primera colonia fundada?', acceptedAnswer: { '@type': 'Answer', text: 'Virginia (1607, Jamestown). Fue el primer asentamiento inglés permanente en América del Norte.' } },
      { '@type': 'Question', name: '¿Cuál fue la última colonia fundada?', acceptedAnswer: { '@type': 'Answer', text: 'Georgia (1732), fundada por James Oglethorpe como refugio para deudores británicos.' } },
      { '@type': 'Question', name: '¿Cuál fue el primer estado en ratificar la Constitución?', acceptedAnswer: { '@type': 'Answer', text: 'Delaware (7 de diciembre de 1787). Por eso es conocido como "The First State".' } },
      { '@type': 'Question', name: '¿Cuál fue el último estado en ratificar la Constitución?', acceptedAnswer: { '@type': 'Answer', text: 'Rhode Island (29 de mayo de 1790). Era el más reacio por su tradición de autonomía religiosa y política.' } },
      { '@type': 'Question', name: '¿Vermont era una de las 13 colonias?', acceptedAnswer: { '@type': 'Answer', text: 'No. Vermont era territorio disputado entre Nueva York y New Hampshire. Se convirtió en el estado 14 en 1791.' } },
      { '@type': 'Question', name: '¿Cuál fue la colonia con más esclavos?', acceptedAnswer: { '@type': 'Answer', text: 'Carolina del Sur. En 1770, los esclavizados eran mayoría de la población (60% aproximadamente). Charleston era el puerto principal del comercio de esclavos.' } },
    ],
  });

  return `<!DOCTYPE html>
<html lang="es">
<head>
  <meta charset="UTF-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0, viewport-fit=cover">
  <meta name="theme-color" content="#0F2147">
  <meta name="color-scheme" content="light">

  <title>Las 13 colonias originales de EE.UU. — orden, fechas, datos (2026) | Statedoku</title>
  <meta name="description" content="Las 13 colonias británicas que se independizaron en 1776 y formaron los Estados Unidos. Orden de fundación, orden de ratificación, datos clave y mapa.">
  <meta name="keywords" content="13 colonias originales, las 13 colonias, colonias estados unidos, colonias británicas américa, independencia eeuu, ratificación constitución eeuu">
  <meta name="robots" content="index, follow, max-image-preview:large">
${hreflangBlock('colonias-originales')}
  <link rel="icon" type="image/svg+xml" href="/favicon.svg?v=5">
  <link rel="stylesheet" href="/css/style.css?v=17">

  <meta property="og:type" content="article">
  <meta property="og:title" content="Las 13 colonias originales de EE.UU. — orden, fechas, ratificación">
  <meta property="og:description" content="Las 13 colonias británicas que formaron los Estados Unidos. Orden de fundación y de ratificación, con datos clave.">
  <meta property="og:url" content="https://statedoku.com/es/learn/colonias-originales/">
  <meta property="og:image" content="https://statedoku.com/og/og-learn-state-capitals.png">
  <meta property="og:locale" content="es_ES">
  <meta name="twitter:card" content="summary_large_image">
  <meta name="twitter:title" content="Las 13 colonias originales de EE.UU.">
  <meta name="twitter:description" content="Orden de fundación, ratificación de la Constitución, datos clave.">
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
  {"@type":"ListItem","position":3,"name":"Las 13 colonias originales","item":"https://statedoku.com/es/learn/colonias-originales/"}
]}
</script>
<script type="application/ld+json">${faq}</script>

<main>
  <section class="lt-hero">
    <h1>Las 13 colonias originales</h1>
    <p class="sub">Las colonias británicas que se independizaron en 1776 y formaron los Estados Unidos. Orden de fundación, de ratificación, y por qué importa cada una.</p>
  </section>

  <article class="lt-main">

    <p>En 1776, <strong>13 colonias británicas</strong> en la costa este de América del Norte declararon su independencia. Después de la Guerra de Independencia (1775-1783), se convirtieron en los Estados Unidos. Cada una ratificó la Constitución entre 1787 y 1790.</p>

    <h2>Tabla: las 13 en orden de ratificación de la Constitución</h2>
    <table class="lt">
      <thead><tr><th>#</th><th>Colonia</th><th>USPS</th><th>Fundada</th><th>Ratificada</th><th>Dato clave</th></tr></thead>
      <tbody>
${rows}
      </tbody>
    </table>

    <h2>Las 3 categorías geográficas</h2>
    <h3>Colonias de Nueva Inglaterra (4)</h3>
    <p>Massachusetts, New Hampshire, Connecticut, Rhode Island. Pesca, comercio marítimo y manufactura. Puritanos disidentes de la Iglesia de Inglaterra. Inviernos duros, suelos pobres, pero educación temprana (Harvard 1636).</p>

    <h3>Colonias Centrales (4)</h3>
    <p>Nueva York, Nueva Jersey, Pensilvania, Delaware. Diversidad étnica y religiosa: alemanes, holandeses, suecos, cuáqueros, católicos. Agricultura, comercio. Filadelfia y Nueva York como centros urbanos.</p>

    <h3>Colonias del Sur (5)</h3>
    <p>Maryland, Virginia, Carolinas del Norte y Sur, Georgia. Plantaciones de tabaco, arroz, índigo. Mano de obra esclava africana. Anglicanismo dominante. Pocas ciudades grandes, economía rural.</p>

    <h2>Las fechas que importan</h2>
    <ul>
      <li><strong>4 de julio de 1776:</strong> Declaración de Independencia firmada en Filadelfia.</li>
      <li><strong>1781:</strong> Rendición británica en Yorktown (Virginia). Fin de los combates principales.</li>
      <li><strong>1783:</strong> Tratado de París — Reino Unido reconoce la independencia.</li>
      <li><strong>1787:</strong> Constitución redactada en Filadelfia.</li>
      <li><strong>7 dic 1787:</strong> Delaware ratifica primero.</li>
      <li><strong>21 jun 1788:</strong> New Hampshire ratifica novena. La Constitución entra en vigor (requería 9).</li>
      <li><strong>29 may 1790:</strong> Rhode Island ratifica última.</li>
    </ul>

    <div class="cta-card">
      <h3>Statedoku usa "Las 13 colonias originales" como pista</h3>
      <p>En el puzzle diario, una de las restricciones más usadas es "Una de las 13 colonias originales". Si sabes cuáles son, resuelves más rápido.</p>
      <a href="/es/">Jugar el puzzle de hoy →</a>
    </div>

    <h2>Preguntas frecuentes</h2>
    <details><summary><strong>¿Cuáles son las 13 colonias originales?</strong></summary><p>Virginia, Massachusetts, New Hampshire, Maryland, Connecticut, Rhode Island, Delaware, Carolina del Norte, Carolina del Sur, Nueva York, Nueva Jersey, Pensilvania, Georgia.</p></details>
    <details><summary><strong>¿Vermont era una de las 13 colonias?</strong></summary><p>No. Vermont era territorio disputado y se convirtió en el estado 14 en 1791.</p></details>
    <details><summary><strong>¿Por qué Delaware se llama "The First State"?</strong></summary><p>Porque fue el primero en ratificar la Constitución (7 diciembre 1787). En su matrícula dice "The First State".</p></details>
    <details><summary><strong>¿Cuál era la colonia más rica?</strong></summary><p>Virginia, gracias al tabaco. Era también la más poblada de las 13 al momento de la independencia.</p></details>
    <details><summary><strong>¿Cuál era la más pequeña?</strong></summary><p>Rhode Island, tanto en área como en población. Fue la última en ratificar la Constitución (1790).</p></details>

    <h2>Guías relacionadas</h2>
${relatedGrid}
  </article>
</main>

${footerBlock}`;
}

const outputs = [
  { slug: 'regiones-de-eeuu', html: buildRegions() },
  { slug: 'banderas-de-estados', html: buildFlags() },
  { slug: 'colonias-originales', html: buildColonies() },
];

for (const o of outputs) {
  const dir = path.join(ROOT, 'es/learn', o.slug);
  fs.mkdirSync(dir, { recursive: true });
  fs.writeFileSync(path.join(dir, 'index.html'), o.html);
  console.log(`✅ /es/learn/${o.slug}/`);
}
