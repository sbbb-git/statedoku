#!/usr/bin/env node
/**
 * GSC-driven mega-batch — 50 Spanish "capital de [state]" pages + 15 crossword answer pages.
 *
 * Based on Google Search Console data showing massive impressions on:
 *  - "capital de kentucky" (58 imp, pos 10.83)
 *  - "capital de dakota del sur" (34 imp, pos 9.62)
 *  - "capital de montana", "capital de illinois", "capital de missouri" etc.
 *  - Crossword queries: "ciudad de arizona 6 letras", "augusta 5 letras", "oregón 5 letras"
 *
 * Strategy: dedicated page per query, exact-match titles, deep optimization.
 */
const fs = require('fs');
const path = require('path');
const ROOT = path.resolve(__dirname, '..');
const states = JSON.parse(fs.readFileSync(path.join(ROOT, 'data/states.json'), 'utf8'));
const slugOf = s => s.names.en.toLowerCase().replace(/\s+/g, '-');

const STATE_CAPITAL_ES = {
  AL: { state: 'Alabama', stateEs: 'Alabama', capital: 'Montgomery', largest: 'Huntsville', popState: '5.1 millones', region: 'Sur', popCap: '~199,000', founded: 1846 },
  AK: { state: 'Alaska', stateEs: 'Alaska', capital: 'Juneau', largest: 'Anchorage', popState: '733,000', region: 'Oeste', popCap: '~32,000', founded: 1900, note: 'Juneau es accesible solo por avión o barco — no hay carretera que llegue a ella.' },
  AZ: { state: 'Arizona', stateEs: 'Arizona', capital: 'Phoenix', largest: 'Phoenix', popState: '7.4 millones', region: 'Oeste', popCap: '~1.6 millones', founded: 1881, note: 'Phoenix es 5 letras... pero el crossword pregunta por 6 letras, así que la respuesta es PHOENIX (con 6 letras al escribirse fonéticamente o con artículo). Las ciudades de 6 letras: Tucson, Tucson.' },
  AR: { state: 'Arkansas', stateEs: 'Arkansas', capital: 'Little Rock', largest: 'Little Rock', popState: '3 millones', region: 'Sur', popCap: '~200,000', founded: 1821 },
  CA: { state: 'California', stateEs: 'California', capital: 'Sacramento', largest: 'Los Angeles', popState: '39 millones', region: 'Oeste', popCap: '~525,000', founded: 1850 },
  CO: { state: 'Colorado', stateEs: 'Colorado', capital: 'Denver', largest: 'Denver', popState: '5.8 millones', region: 'Oeste', popCap: '~715,000', founded: 1876 },
  CT: { state: 'Connecticut', stateEs: 'Connecticut', capital: 'Hartford', largest: 'Bridgeport', popState: '3.6 millones', region: 'Noreste', popCap: '~120,000', founded: 1784 },
  DE: { state: 'Delaware', stateEs: 'Delaware', capital: 'Dover', largest: 'Wilmington', popState: '1 millón', region: 'Sur', popCap: '~38,000', founded: 1683 },
  FL: { state: 'Florida', stateEs: 'Florida', capital: 'Tallahassee', largest: 'Jacksonville', popState: '22.6 millones', region: 'Sur', popCap: '~196,000', founded: 1824 },
  GA: { state: 'Georgia', stateEs: 'Georgia', capital: 'Atlanta', largest: 'Atlanta', popState: '11 millones', region: 'Sur', popCap: '~498,000', founded: 1837 },
  HI: { state: 'Hawaii', stateEs: 'Hawái', capital: 'Honolulu', largest: 'Honolulu', popState: '1.4 millones', region: 'Oeste', popCap: '~352,000', founded: 1850 },
  ID: { state: 'Idaho', stateEs: 'Idaho', capital: 'Boise', largest: 'Boise', popState: '2 millones', region: 'Oeste', popCap: '~235,000', founded: 1864 },
  IL: { state: 'Illinois', stateEs: 'Illinois', capital: 'Springfield', largest: 'Chicago', popState: '12.5 millones', region: 'Medio Oeste', popCap: '~114,000', founded: 1837 },
  IN: { state: 'Indiana', stateEs: 'Indiana', capital: 'Indianápolis', largest: 'Indianápolis', popState: '6.9 millones', region: 'Medio Oeste', popCap: '~880,000', founded: 1821 },
  IA: { state: 'Iowa', stateEs: 'Iowa', capital: 'Des Moines', largest: 'Des Moines', popState: '3.2 millones', region: 'Medio Oeste', popCap: '~210,000', founded: 1846 },
  KS: { state: 'Kansas', stateEs: 'Kansas', capital: 'Topeka', largest: 'Wichita', popState: '2.9 millones', region: 'Medio Oeste', popCap: '~125,000', founded: 1854 },
  KY: { state: 'Kentucky', stateEs: 'Kentucky', capital: 'Frankfort', largest: 'Louisville', popState: '4.5 millones', region: 'Sur', popCap: '~28,000', founded: 1786 },
  LA: { state: 'Louisiana', stateEs: 'Luisiana', capital: 'Baton Rouge', largest: 'Nueva Orleans', popState: '4.6 millones', region: 'Sur', popCap: '~220,000', founded: 1719 },
  ME: { state: 'Maine', stateEs: 'Maine', capital: 'Augusta', largest: 'Portland', popState: '1.4 millones', region: 'Noreste', popCap: '~19,000', founded: 1797, note: 'Augusta tiene 7 letras en español, pero "Augusta" en español = AUGUSTA (7 letras). El crossword pregunta por 5 letras = MAINE (estado cuya capital es Augusta).' },
  MD: { state: 'Maryland', stateEs: 'Maryland', capital: 'Annapolis', largest: 'Baltimore', popState: '6.2 millones', region: 'Sur', popCap: '~40,000', founded: 1649 },
  MA: { state: 'Massachusetts', stateEs: 'Massachusetts', capital: 'Boston', largest: 'Boston', popState: '7 millones', region: 'Noreste', popCap: '~675,000', founded: 1630 },
  MI: { state: 'Michigan', stateEs: 'Michigan', capital: 'Lansing', largest: 'Detroit', popState: '10 millones', region: 'Medio Oeste', popCap: '~112,000', founded: 1847 },
  MN: { state: 'Minnesota', stateEs: 'Minnesota', capital: 'Saint Paul', largest: 'Minneapolis', popState: '5.7 millones', region: 'Medio Oeste', popCap: '~309,000', founded: 1854 },
  MS: { state: 'Mississippi', stateEs: 'Misisipi', capital: 'Jackson', largest: 'Jackson', popState: '2.9 millones', region: 'Sur', popCap: '~145,000', founded: 1822 },
  MO: { state: 'Missouri', stateEs: 'Misuri', capital: 'Jefferson City', largest: 'Kansas City', popState: '6.2 millones', region: 'Medio Oeste', popCap: '~43,000', founded: 1821 },
  MT: { state: 'Montana', stateEs: 'Montana', capital: 'Helena', largest: 'Billings', popState: '1.1 millones', region: 'Oeste', popCap: '~33,000', founded: 1875 },
  NE: { state: 'Nebraska', stateEs: 'Nebraska', capital: 'Lincoln', largest: 'Omaha', popState: '2 millones', region: 'Medio Oeste', popCap: '~292,000', founded: 1867 },
  NV: { state: 'Nevada', stateEs: 'Nevada', capital: 'Carson City', largest: 'Las Vegas', popState: '3.2 millones', region: 'Oeste', popCap: '~58,000', founded: 1858 },
  NH: { state: 'New Hampshire', stateEs: 'New Hampshire', capital: 'Concord', largest: 'Manchester', popState: '1.4 millones', region: 'Noreste', popCap: '~44,000', founded: 1808 },
  NJ: { state: 'New Jersey', stateEs: 'Nueva Jersey', capital: 'Trenton', largest: 'Newark', popState: '9.3 millones', region: 'Noreste', popCap: '~89,000', founded: 1790 },
  NM: { state: 'New Mexico', stateEs: 'Nuevo México', capital: 'Santa Fe', largest: 'Albuquerque', popState: '2.1 millones', region: 'Oeste', popCap: '~88,000', founded: 1610 },
  NY: { state: 'New York', stateEs: 'Nueva York', capital: 'Albany', largest: 'Nueva York', popState: '19.6 millones', region: 'Noreste', popCap: '~95,000', founded: 1797 },
  NC: { state: 'North Carolina', stateEs: 'Carolina del Norte', capital: 'Raleigh', largest: 'Charlotte', popState: '10.8 millones', region: 'Sur', popCap: '~470,000', founded: 1792 },
  ND: { state: 'North Dakota', stateEs: 'Dakota del Norte', capital: 'Bismarck', largest: 'Fargo', popState: '780,000', region: 'Medio Oeste', popCap: '~75,000', founded: 1872 },
  OH: { state: 'Ohio', stateEs: 'Ohio', capital: 'Columbus', largest: 'Columbus', popState: '11.8 millones', region: 'Medio Oeste', popCap: '~907,000', founded: 1816 },
  OK: { state: 'Oklahoma', stateEs: 'Oklahoma', capital: 'Oklahoma City', largest: 'Oklahoma City', popState: '4 millones', region: 'Sur', popCap: '~687,000', founded: 1907 },
  OR: { state: 'Oregon', stateEs: 'Oregón', capital: 'Salem', largest: 'Portland', popState: '4.2 millones', region: 'Oeste', popCap: '~177,000', founded: 1851, note: 'Salem tiene 5 letras — coincide con el crossword "capital del estado de oregón (5 letras)" = SALEM.' },
  PA: { state: 'Pennsylvania', stateEs: 'Pensilvania', capital: 'Harrisburg', largest: 'Filadelfia', popState: '13 millones', region: 'Noreste', popCap: '~50,000', founded: 1812 },
  RI: { state: 'Rhode Island', stateEs: 'Rhode Island', capital: 'Providence', largest: 'Providence', popState: '1.1 millones', region: 'Noreste', popCap: '~190,000', founded: 1636 },
  SC: { state: 'South Carolina', stateEs: 'Carolina del Sur', capital: 'Columbia', largest: 'Charleston', popState: '5.4 millones', region: 'Sur', popCap: '~135,000', founded: 1786 },
  SD: { state: 'South Dakota', stateEs: 'Dakota del Sur', capital: 'Pierre', largest: 'Sioux Falls', popState: '910,000', region: 'Medio Oeste', popCap: '~14,000', founded: 1880, note: 'Pierre es una de las capitales menos pobladas de EE.UU. (~14,000 habitantes).' },
  TN: { state: 'Tennessee', stateEs: 'Tennessee', capital: 'Nashville', largest: 'Nashville', popState: '7.1 millones', region: 'Sur', popCap: '~696,000', founded: 1779 },
  TX: { state: 'Texas', stateEs: 'Texas', capital: 'Austin', largest: 'Houston', popState: '30.5 millones', region: 'Sur', popCap: '~975,000', founded: 1839 },
  UT: { state: 'Utah', stateEs: 'Utah', capital: 'Salt Lake City', largest: 'Salt Lake City', popState: '3.4 millones', region: 'Oeste', popCap: '~200,000', founded: 1847 },
  VT: { state: 'Vermont', stateEs: 'Vermont', capital: 'Montpelier', largest: 'Burlington', popState: '645,000', region: 'Noreste', popCap: '~7,500', founded: 1805, note: 'Montpelier (~7,500 habitantes) es la capital estatal MENOS POBLADA de EE.UU.' },
  VA: { state: 'Virginia', stateEs: 'Virginia', capital: 'Richmond', largest: 'Virginia Beach', popState: '8.7 millones', region: 'Sur', popCap: '~226,000', founded: 1737 },
  WA: { state: 'Washington', stateEs: 'Washington', capital: 'Olympia', largest: 'Seattle', popState: '7.8 millones', region: 'Oeste', popCap: '~56,000', founded: 1859, note: 'Olympia no debe confundirse con Washington DC (capital federal).' },
  WV: { state: 'West Virginia', stateEs: 'Virginia Occidental', capital: 'Charleston', largest: 'Charleston', popState: '1.8 millones', region: 'Sur', popCap: '~48,000', founded: 1788 },
  WI: { state: 'Wisconsin', stateEs: 'Wisconsin', capital: 'Madison', largest: 'Milwaukee', popState: '5.9 millones', region: 'Medio Oeste', popCap: '~270,000', founded: 1836 },
  WY: { state: 'Wyoming', stateEs: 'Wyoming', capital: 'Cheyenne', largest: 'Cheyenne', popState: '580,000', region: 'Oeste', popCap: '~65,000', founded: 1867 },
};

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
    .answer-box{background:linear-gradient(135deg,#F59E0B,#FCD34D);color:var(--navy);padding:20px 22px;border-radius:14px;margin:18px 0;border-left:6px solid var(--navy)}
    .answer-box .label{font-size:.78rem;font-weight:800;letter-spacing:.08em;text-transform:uppercase;color:var(--navy);margin-bottom:4px}
    .answer-box .answer{font-size:1.8rem;font-weight:900;letter-spacing:-.02em;color:var(--navy)}
    .cta-card{background:linear-gradient(135deg,var(--navy),var(--navy-soft));color:#fff;padding:22px;border-radius:14px;margin:28px 0;text-align:center}
    .cta-card h3{color:#fff;margin:0 0 8px}.cta-card p{margin:0 0 12px;color:rgba(255,255,255,.85)}
    .cta-card a{display:inline-block;background:var(--gold);color:var(--navy);padding:10px 22px;border-radius:999px;font-weight:800;text-decoration:none;font-size:.92rem}
    .related-grid{display:grid;grid-template-columns:repeat(auto-fit,minmax(220px,1fr));gap:8px;margin:14px 0}
    .related-grid a{display:block;padding:10px 12px;border:1px solid var(--border);border-radius:8px;color:var(--navy);text-decoration:none;font-weight:600;font-size:.9rem}
    .related-grid a:hover{background:#F8FAFC;border-color:var(--navy)}
    details{margin:8px 0;padding:10px 14px;background:#F8FAFC;border-radius:8px}
    summary{font-weight:700;color:var(--navy);cursor:pointer}
    details p{margin:8px 0 0;color:var(--text-2)}`;

const hreflangES = s => `
  <link rel="canonical" href="https://statedoku.com/es/learn/${s}/">
  <link rel="alternate" hreflang="es" href="https://statedoku.com/es/learn/${s}/">
  <link rel="alternate" hreflang="es-ES" href="https://statedoku.com/es/learn/${s}/">
  <link rel="alternate" hreflang="es-MX" href="https://statedoku.com/es/learn/${s}/">
  <link rel="alternate" hreflang="es-AR" href="https://statedoku.com/es/learn/${s}/">
  <link rel="alternate" hreflang="es-CO" href="https://statedoku.com/es/learn/${s}/">
  <link rel="alternate" hreflang="es-PE" href="https://statedoku.com/es/learn/${s}/">
  <link rel="alternate" hreflang="es-CL" href="https://statedoku.com/es/learn/${s}/">
  <link rel="alternate" hreflang="x-default" href="https://statedoku.com/learn/">`;

const footerES = `<footer><p>Statedoku &copy; 2026 &nbsp;·&nbsp; <a href="/es/learn/">Aprender</a> &nbsp;·&nbsp; <a href="/es/learn/capitales-de-estados/">Capitales</a> &nbsp;·&nbsp; <a href="/es/learn/regiones-de-eeuu/">Regiones</a> &nbsp;·&nbsp; <a href="/es/faq/">FAQ</a></p></footer><script src="/config.js"></script><script src="/js/admin.js"></script></body></html>`;

const out = [];

// ── 50 capital-de-{state} pages ─────────────────────────────────────────
const allStates = Object.keys(STATE_CAPITAL_ES);
function relatedES(currentId) {
  // Pick 8 random other states for variety
  const others = allStates.filter(k => k !== currentId);
  const sample = [];
  for (let i = 0; i < 8; i++) {
    const idx = (currentId.charCodeAt(0) * 7 + i * 13) % others.length;
    if (!sample.includes(others[idx])) sample.push(others[idx]);
  }
  return `    <div class="related-grid">
      <a href="/es/learn/capitales-de-estados/">→ Todas las 50 capitales</a>
      <a href="/es/learn/regiones-de-eeuu/">→ Las 4 regiones de EE.UU.</a>
      <a href="/es/learn/estados-mas-poblados/">→ Estados más poblados</a>
${sample.map(id => {
  const c = STATE_CAPITAL_ES[id];
  return `      <a href="/es/learn/capital-de-${slugOf({names:{en:c.state}})}/">→ Capital de ${c.stateEs}</a>`;
}).join('\n')}
    </div>`;
}

function makeCapitalPage(id) {
  const c = STATE_CAPITAL_ES[id];
  const stateSlug = slugOf({names:{en:c.state}});
  const slug = `capital-de-${stateSlug}`;
  const isCapAlsoLargest = c.capital === c.largest;
  const trickFact = isCapAlsoLargest ? `<strong>${c.capital}</strong> es a la vez capital Y la ciudad más grande de ${c.stateEs} — una de las pocas excepciones en EE.UU. (solo 17 de 50 estados están en este caso).` : `Atención: <strong>${c.capital}</strong> NO es la ciudad más grande de ${c.stateEs}. La ciudad más grande es <strong>${c.largest}</strong>. Pero la capital es ${c.capital}.`;

  const body = `    <div class="answer-box">
      <div class="label">Respuesta directa</div>
      <div class="answer">${c.capital}</div>
    </div>

    <p>La capital de <strong>${c.stateEs}</strong> (Estados Unidos) es <strong>${c.capital}</strong>. ${trickFact}</p>

    <div class="wc-quick" style="background:#F8FAFC;border:1px solid var(--border);border-radius:12px;padding:16px 18px;margin:18px 0">
      <table class="lt" style="margin:0">
        <tbody>
          <tr><td><strong>Estado</strong></td><td>${c.stateEs} (${id})</td></tr>
          <tr><td><strong>Capital</strong></td><td>${c.capital}</td></tr>
          <tr><td><strong>Población de la capital</strong></td><td>${c.popCap}</td></tr>
          <tr><td><strong>Ciudad más grande del estado</strong></td><td>${c.largest}</td></tr>
          <tr><td><strong>Población del estado</strong></td><td>${c.popState}</td></tr>
          <tr><td><strong>Región</strong></td><td><a href="/es/learn/regiones-de-eeuu/">${c.region}</a></td></tr>
          <tr><td><strong>Capital desde</strong></td><td>${c.founded}</td></tr>
        </tbody>
      </table>
    </div>

    <h2>¿Por qué ${c.capital} es la capital de ${c.stateEs}?</h2>
    <p>${c.capital} fue elegida como capital de ${c.stateEs} en ${c.founded}. ${isCapAlsoLargest ? `Como ciudad más grande y mejor desarrollada del estado, fue la opción natural.` : `Aunque ${c.largest} es la ciudad más poblada, ${c.capital} fue elegida por razones históricas: ubicación más central, menor influencia de intereses comerciales, o tradición desde la fundación del estado.`}</p>

    ${c.note ? `<h2>Dato interesante</h2><p>${c.note}</p>` : ''}

    <h2>${c.stateEs}: datos rápidos</h2>
    <ul>
      <li><strong>Abreviatura USPS:</strong> ${id}</li>
      <li><strong>Región del Censo:</strong> ${c.region}</li>
      <li><strong>Población:</strong> ${c.popState}</li>
      <li><strong>Capital:</strong> ${c.capital}</li>
      <li><strong>Ciudad más grande:</strong> ${c.largest}</li>
      <li><strong>Año en que ${c.capital} se convirtió en capital:</strong> ${c.founded}</li>
    </ul>

    <h2>Cómo recordar la capital de ${c.stateEs}</h2>
    <p>Truco mnemotécnico: ${getMnemonic(id, c)}</p>

    <div class="cta-card">
      <h3>Aprende las 50 capitales jugando</h3>
      <p>Statedoku usa "capital es ${c.capital}" como pista en su puzzle diario. Cinco minutos al día y memorizarás las 50.</p>
      <a href="/es/">Jugar el puzzle de hoy →</a>
    </div>

    <h2>Preguntas frecuentes</h2>
    <details><summary><strong>¿Cuál es la capital de ${c.stateEs}?</strong></summary><p>La capital de ${c.stateEs} es <strong>${c.capital}</strong>. Tiene aproximadamente ${c.popCap} habitantes.</p></details>
    <details><summary><strong>¿Es ${c.largest} la capital de ${c.stateEs}?</strong></summary><p>${isCapAlsoLargest ? `Sí, ${c.capital} es a la vez capital y ciudad más grande de ${c.stateEs}.` : `No. ${c.largest} es la ciudad más grande de ${c.stateEs}, pero la capital es ${c.capital}.`}</p></details>
    <details><summary><strong>¿Desde cuándo es ${c.capital} la capital?</strong></summary><p>Desde ${c.founded}.</p></details>
    <details><summary><strong>¿En qué región está ${c.stateEs}?</strong></summary><p>${c.stateEs} está en la región <strong>${c.region}</strong> de los Estados Unidos según la Oficina del Censo.</p></details>
    <details><summary><strong>¿Cuál es la población de ${c.capital}?</strong></summary><p>${c.capital} tiene aproximadamente ${c.popCap} habitantes.</p></details>

    <h2>Otras capitales que te pueden interesar</h2>
${relatedES(id)}
`;

  const faqJson = JSON.stringify({
    '@context':'https://schema.org','@type':'FAQPage',
    mainEntity:[
      {'@type':'Question',name:`¿Cuál es la capital de ${c.stateEs}?`,acceptedAnswer:{'@type':'Answer',text:`La capital de ${c.stateEs} (Estados Unidos) es ${c.capital}. Tiene aproximadamente ${c.popCap} habitantes y está ubicada en la región ${c.region} del país.`}},
      {'@type':'Question',name:`¿Cuál es la ciudad más grande de ${c.stateEs}?`,acceptedAnswer:{'@type':'Answer',text:isCapAlsoLargest ? `${c.capital} es a la vez la capital y la ciudad más grande de ${c.stateEs}.` : `La ciudad más grande de ${c.stateEs} es ${c.largest}, pero la capital es ${c.capital}.`}},
      {'@type':'Question',name:`¿Desde cuándo es ${c.capital} la capital de ${c.stateEs}?`,acceptedAnswer:{'@type':'Answer',text:`${c.capital} es capital de ${c.stateEs} desde ${c.founded}.`}},
      {'@type':'Question',name:`¿En qué región está ${c.stateEs}?`,acceptedAnswer:{'@type':'Answer',text:`${c.stateEs} está en la región ${c.region} de los Estados Unidos según la Oficina del Censo.`}},
    ],
  });

  const breadcrumb = `[{"@type":"ListItem","position":1,"name":"Inicio","item":"https://statedoku.com/es/"},{"@type":"ListItem","position":2,"name":"Aprender","item":"https://statedoku.com/es/learn/"},{"@type":"ListItem","position":3,"name":"Capital de ${c.stateEs}","item":"https://statedoku.com/es/learn/${slug}/"}]`;

  return `<!DOCTYPE html>
<html lang="es">
<head>
<meta charset="UTF-8">
<meta name="viewport" content="width=device-width,initial-scale=1.0">
<meta name="theme-color" content="#0F2147">
<title>Capital de ${c.stateEs} — ${c.capital} (estado EE.UU.) | Statedoku</title>
<meta name="description" content="La capital de ${c.stateEs}, Estados Unidos, es ${c.capital}. ${c.popCap} habitantes. ${isCapAlsoLargest ? `También es la ciudad más grande del estado.` : `La ciudad más grande es ${c.largest}.`} Datos completos.">
<meta name="keywords" content="capital de ${c.stateEs.toLowerCase()}, ${c.capital.toLowerCase()} capital, ${c.stateEs.toLowerCase()} ${c.capital.toLowerCase()}, cual es la capital de ${c.stateEs.toLowerCase()}, capital del estado de ${c.stateEs.toLowerCase()}">
<meta name="robots" content="index, follow, max-image-preview:large">
${hreflangES(slug)}
<link rel="icon" type="image/svg+xml" href="/favicon.svg?v=5">
<link rel="stylesheet" href="/css/style.css?v=18">
<meta property="og:type" content="article">
<meta property="og:title" content="Capital de ${c.stateEs} — ${c.capital}">
<meta property="og:description" content="La capital de ${c.stateEs} es ${c.capital}. Datos demográficos, historia, ubicación.">
<meta property="og:url" content="https://statedoku.com/es/learn/${slug}/">
<meta property="og:image" content="https://statedoku.com/og/og-learn-state-capitals.png">
<meta property="og:locale" content="es_ES">
<meta name="twitter:card" content="summary_large_image">
<meta name="twitter:title" content="Capital de ${c.stateEs} — ${c.capital}">
<meta name="twitter:description" content="La capital de ${c.stateEs} es ${c.capital}.">
<meta name="twitter:image" content="https://statedoku.com/og/og-learn-state-capitals.png">
<style>${styles}</style>
</head>
<body class="legal-body">
<header>
  <a href="/es/" class="logo">State<em>doku</em> <span class="logo-flag">🇺🇸</span></a>
  <nav class="nav-actions"><a href="/es/learn/" style="color:var(--text-2);text-decoration:none;font-weight:700;font-size:.88rem">← Aprender</a></nav>
</header>
<script type="application/ld+json">
{"@context":"https://schema.org","@type":"BreadcrumbList","itemListElement":${breadcrumb}}
</script>
<script type="application/ld+json">${faqJson}</script>
<main>
  <section class="lt-hero">
    <h1>¿Cuál es la capital de ${c.stateEs}?</h1>
    <p class="sub">Respuesta corta: ${c.capital}. Datos completos sobre el estado y su capital.</p>
  </section>
  <article class="lt-main">
${body}
  </article>
</main>
${footerES}`;
}

function getMnemonic(id, c) {
  const mnemonics = {
    AL: 'Mont-gomery comienza con MONT — Alabama tiene montañas en el norte (Appalaches).',
    AK: 'Juneau suena como "Juneau-zo" (verano breve en Alaska).',
    AZ: 'Phoenix (ave fénix) — Arizona, donde el sol renace cada día en el desierto.',
    AR: 'Little Rock — la "pequeña roca" en Arkansas, pequeño estado del Sur.',
    CA: 'Sacramento — "sagrado" cerca del río que dio nombre al estado.',
    CO: 'Denver = altura (1 milla de altitud = la "Mile-High City") en Colorado, estado montañoso.',
    CT: 'Hartford — "ford" significa vado del río Connecticut.',
    DE: 'Dover = pequeña ciudad para un pequeño estado.',
    FL: 'Tallahassee — palabra creek que significa "ciudad vieja". No es Miami ni Orlando.',
    GA: 'Atlanta — corazón sureño y famosa por la canción "Welcome to Atlanta".',
    HI: 'Honolulu — saludo Aloha desde Honolulu (la única capital en una isla del Pacífico).',
    ID: 'Boise — pronunciado "boi-si" (no "boise"), capital y mayor ciudad de Idaho.',
    IL: 'Springfield — donde Abraham Lincoln vivió antes de la Casa Blanca.',
    IN: 'Indianápolis — capital lógica (nombre similar al estado).',
    IA: 'Des Moines — francés "de los monjes".',
    KS: 'Topeka — palabra Kansa, significa "lugar para cavar papas silvestres".',
    KY: 'Frankfort — sí, como Frankfurt en Alemania (alemanes en Kentucky temprano).',
    LA: 'Baton Rouge — francés "Bastón Rojo" (Luisiana es ex-colonia francesa).',
    ME: 'Augusta — pequeña pero histórica, no la confundas con Augusta GA.',
    MD: 'Annapolis — pequeña ciudad colonial cerca del Chesapeake.',
    MA: 'Boston — capital y mayor ciudad, cuna de la Revolución.',
    MI: 'Lansing — central en Michigan, no es Detroit.',
    MN: 'Saint Paul — vecina con Minneapolis (las "Twin Cities" gemelas).',
    MS: 'Jackson — como el presidente Andrew Jackson.',
    MO: 'Jefferson City — por Thomas Jefferson. Pequeña, no es Kansas City ni St. Louis.',
    MT: 'Helena — pequeña capital en el oeste montañoso de Montana.',
    NE: 'Lincoln — por Abraham Lincoln (el presidente que firmó la admisión de Nebraska).',
    NV: 'Carson City — por Kit Carson, NO es Las Vegas (¡error común!).',
    NH: 'Concord — pequeña capital de Nueva Inglaterra.',
    NJ: 'Trenton — central en Nueva Jersey, NO es Newark.',
    NM: 'Santa Fe — palabra española, capital colonial de los conquistadores españoles.',
    NY: 'Albany — pequeña capital del norte, NO es la ciudad de Nueva York.',
    NC: 'Raleigh — por Sir Walter Raleigh, colonizador inglés.',
    ND: 'Bismarck — sí, como Otto von Bismarck (alemanes vivían en Dakota del Norte).',
    OH: 'Columbus — por Cristóbal Colón, también capital y mayor ciudad.',
    OK: 'Oklahoma City — capital con el nombre del estado.',
    OR: 'Salem — palabra hebrea que significa "paz", capital pequeña y tranquila.',
    PA: 'Harrisburg — por John Harris, fundador.',
    RI: 'Providence — fundada por Roger Williams como "Providencia divina".',
    SC: 'Columbia — por Cristóbal Colón (igual que Columbus OH).',
    SD: 'Pierre — francés (cazadores franceses de pieles).',
    TN: 'Nashville — capital Y cuna de la música country.',
    TX: 'Austin — por Stephen F. Austin, "padre" de Texas.',
    UT: 'Salt Lake City — junto al Gran Lago Salado, capital mormona.',
    VT: 'Montpelier — francés (Vermont = "vert mont"). La capital MENOS poblada de EE.UU.',
    VA: 'Richmond — capital de la Confederación durante la Guerra Civil.',
    WA: 'Olympia — por los Juegos Olímpicos griegos. NO Washington DC.',
    WV: 'Charleston — la capital y mayor ciudad de Virginia Occidental.',
    WI: 'Madison — por James Madison (4to presidente).',
    WY: 'Cheyenne — por la tribu nativa Cheyenne.',
  };
  return mnemonics[id] || `${c.capital} es la capital — pequeña pero estratégica para ${c.stateEs}.`;
}

for (const id of allStates) {
  const c = STATE_CAPITAL_ES[id];
  const stateSlug = slugOf({names:{en:c.state}});
  const slug = `capital-de-${stateSlug}`;
  const html = makeCapitalPage(id);
  out.push([`es/learn/${slug}`, html]);
}

// ── 15 crossword answer pages ─────────────────────────────────────────────
function makeCrosswordPage(slug, query, answer, explanation, related) {
  const faqJson = JSON.stringify({
    '@context':'https://schema.org','@type':'FAQPage',
    mainEntity:[
      {'@type':'Question',name:query.endsWith('?') ? query : `${query}?`,acceptedAnswer:{'@type':'Answer',text:`La respuesta es ${answer}. ${explanation}`}},
    ],
  });
  const breadcrumb = `[{"@type":"ListItem","position":1,"name":"Inicio","item":"https://statedoku.com/es/"},{"@type":"ListItem","position":2,"name":"Aprender","item":"https://statedoku.com/es/learn/"},{"@type":"ListItem","position":3,"name":"${query.slice(0,60)}","item":"https://statedoku.com/es/learn/${slug}/"}]`;

  return `<!DOCTYPE html>
<html lang="es">
<head>
<meta charset="UTF-8">
<meta name="viewport" content="width=device-width,initial-scale=1.0">
<meta name="theme-color" content="#0F2147">
<title>${query} — Respuesta: ${answer} | Statedoku</title>
<meta name="description" content="${query} La respuesta correcta es ${answer}. ${explanation.slice(0, 110)}">
<meta name="keywords" content="${query.toLowerCase()}, ${answer.toLowerCase()}, crucigrama ${answer.toLowerCase()}, ayuda crucigrama estados unidos">
<meta name="robots" content="index, follow, max-image-preview:large">
${hreflangES(slug)}
<link rel="icon" type="image/svg+xml" href="/favicon.svg?v=5">
<link rel="stylesheet" href="/css/style.css?v=18">
<meta property="og:type" content="article">
<meta property="og:title" content="${query} = ${answer}">
<meta property="og:description" content="${explanation.slice(0, 160)}">
<meta property="og:url" content="https://statedoku.com/es/learn/${slug}/">
<meta property="og:image" content="https://statedoku.com/og/og-learn-state-capitals.png">
<meta property="og:locale" content="es_ES">
<meta name="twitter:card" content="summary_large_image">
<meta name="twitter:title" content="${query} = ${answer}">
<meta name="twitter:image" content="https://statedoku.com/og/og-learn-state-capitals.png">
<style>${styles}</style>
</head>
<body class="legal-body">
<header>
  <a href="/es/" class="logo">State<em>doku</em> <span class="logo-flag">🇺🇸</span></a>
  <nav class="nav-actions"><a href="/es/learn/" style="color:var(--text-2);text-decoration:none;font-weight:700;font-size:.88rem">← Aprender</a></nav>
</header>
<script type="application/ld+json">
{"@context":"https://schema.org","@type":"BreadcrumbList","itemListElement":${breadcrumb}}
</script>
<script type="application/ld+json">${faqJson}</script>
<main>
  <section class="lt-hero">
    <h1>${query}</h1>
    <p class="sub">Respuesta directa al crucigrama.</p>
  </section>
  <article class="lt-main">
    <div class="answer-box">
      <div class="label">Respuesta</div>
      <div class="answer">${answer}</div>
    </div>

    <h2>Explicación</h2>
    <p>${explanation}</p>

    <div class="cta-card">
      <h3>Más ayuda para crucigramas de EE.UU.</h3>
      <p>Statedoku tiene una página dedicada con respuestas para crucigramas de estados, capitales y geografía estadounidense.</p>
      <a href="/es/learn/crucigrama-estados/">Ver guía de crucigramas →</a>
    </div>

    <h2>Más pistas relacionadas</h2>
${related}

    <h2>Preguntas frecuentes</h2>
    <details><summary><strong>${query}</strong></summary><p>La respuesta es <strong>${answer}</strong>. ${explanation}</p></details>
    <details><summary><strong>¿Quieres aprender más sobre geografía de EE.UU.?</strong></summary><p>Visita nuestras guías: <a href="/es/learn/capitales-de-estados/">Capitales</a>, <a href="/es/learn/regiones-de-eeuu/">Regiones</a>, <a href="/es/learn/state-abbreviations/">Abreviaturas USPS</a>.</p></details>
  </article>
</main>
${footerES}`;
}

const crosswordRelated = `    <div class="related-grid">
      <a href="/es/learn/crucigrama-estados/">→ Guía completa de crucigramas</a>
      <a href="/es/learn/capitales-de-estados/">→ Las 50 capitales</a>
      <a href="/es/learn/state-abbreviations/">→ Abreviaturas USPS</a>
      <a href="/es/learn/apodos-de-estados/">→ Apodos de estados</a>
      <a href="/es/learn/regiones-de-eeuu/">→ Regiones de EE.UU.</a>
      <a href="/es/learn/largest-states/">→ Estados más grandes</a>
    </div>`;

const crosswords = [
  ['ciudad-de-arizona-6-letras', '¿Ciudad de Arizona, en los EE.UU. (6 letras)?', 'TUCSON', 'TUCSON tiene 6 letras y es la segunda ciudad más grande de Arizona (después de Phoenix). Ubicada en el sur del estado, cerca de la frontera con México. Otras ciudades de Arizona con menos letras: PHOENIX (7), MESA (4), TEMPE (5), CHANDLER (8), GLENDALE (8).'],
  ['estado-cuya-capital-es-augusta-5-letras', '¿Estado de EE.UU. cuya capital es Augusta (5 letras)?', 'MAINE', 'MAINE tiene 5 letras y su capital es Augusta. Augusta tiene unos 19,000 habitantes. Maine está en la región Noreste de EE.UU., en Nueva Inglaterra. (Nota: existe también Augusta, Georgia, pero NO es capital de Georgia — Atlanta lo es).'],
  ['capital-de-oregon-5-letras', '¿Capital del estado de Oregón (5 letras)?', 'SALEM', 'SALEM tiene 5 letras y es la capital de Oregón. NO es Portland (la ciudad más grande). Salem viene del hebreo "shalom" (paz). Es una palabra famosa también por los juicios de las brujas de Salem en Massachusetts.'],
  ['ciudad-arizona-cabecera-condado-pima', '¿Ciudad de Arizona, cabecera del condado de Pima?', 'TUCSON', 'TUCSON es la cabecera del condado de Pima en Arizona. Es la 2da ciudad más grande del estado. La Universidad de Arizona está en Tucson.'],
  ['capital-massachusetts-6-letras', '¿Capital de Massachusetts (6 letras)?', 'BOSTON', 'BOSTON tiene 6 letras y es la capital de Massachusetts. También es la ciudad más grande del estado. Cuna de la Revolución Americana, fundada en 1630.'],
  ['estado-eeuu-2-letras-nc', '¿Qué estado de EE.UU. tiene la abreviatura NC?', 'CAROLINA DEL NORTE', 'NC es la abreviatura USPS de North Carolina (Carolina del Norte). Capital: Raleigh. Mayor ciudad: Charlotte.'],
  ['estado-eeuu-2-letras-sc', '¿Qué estado de EE.UU. tiene la abreviatura SC?', 'CAROLINA DEL SUR', 'SC es la abreviatura USPS de South Carolina (Carolina del Sur). Capital: Columbia. Mayor ciudad: Charleston.'],
  ['estado-eeuu-abreviatura-hi', '¿Qué estado de EE.UU. tiene la abreviatura HI?', 'HAWAI', 'HI es la abreviatura USPS de Hawaii (Hawái). El único estado insular de EE.UU., en el Pacífico. Capital y mayor ciudad: Honolulu.'],
  ['estado-eeuu-abreviatura-md', '¿Qué estado de EE.UU. tiene la abreviatura MD?', 'MARYLAND', 'MD es la abreviatura USPS de Maryland. Capital: Annapolis. Mayor ciudad: Baltimore. Está en la región Sur del Censo.'],
  ['estado-eeuu-abreviatura-ma', '¿Qué estado de EE.UU. tiene la abreviatura MA?', 'MASSACHUSETTS', 'MA es la abreviatura USPS de Massachusetts. Capital y mayor ciudad: Boston. Está en Nueva Inglaterra.'],
  ['estado-eeuu-abreviatura-mi', '¿Qué estado de EE.UU. tiene la abreviatura MI?', 'MICHIGAN', 'MI es la abreviatura USPS de Michigan. Capital: Lansing. Mayor ciudad: Detroit. Famoso por los Grandes Lagos.'],
  ['estado-eeuu-abreviatura-mn', '¿Qué estado de EE.UU. tiene la abreviatura MN?', 'MINNESOTA', 'MN es la abreviatura USPS de Minnesota. Capital: Saint Paul. Mayor ciudad: Minneapolis. Conocido como "Land of 10,000 Lakes".'],
  ['estado-capital-honolulu', '¿Qué estado tiene a Honolulu como capital?', 'HAWAI', 'Hawái (Hawaii) tiene a Honolulu como capital y mayor ciudad. Único estado insular y en el Pacífico.'],
  ['estado-capital-austin', '¿Qué estado tiene a Austin como capital?', 'TEXAS', 'Texas tiene a Austin como capital. La mayor ciudad de Texas es Houston (no Austin). Austin es la 4ª ciudad más grande del estado.'],
  ['estado-capital-sacramento', '¿Qué estado tiene a Sacramento como capital?', 'CALIFORNIA', 'California tiene a Sacramento como capital. La mayor ciudad de California es Los Angeles (no Sacramento). Sacramento tiene unos 525,000 habitantes vs LA con 3.9 millones.'],
];

for (const [slug, q, a, exp] of crosswords) {
  out.push([`es/learn/${slug}`, makeCrosswordPage(slug, q, a, exp, crosswordRelated)]);
}

// Write all
for (const [rel, html] of out) {
  const dir = path.join(ROOT, rel);
  fs.mkdirSync(dir, { recursive: true });
  fs.writeFileSync(path.join(dir, 'index.html'), html);
  console.log(`✅ /${rel}/`);
}
console.log(`\n${out.length} pages GSC-driven générées.`);
