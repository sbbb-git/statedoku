#!/usr/bin/env node
/**
 * Printable worksheet views for each /play/ game.
 *
 *   21 games × 3 langs = 63 new HTML pages.
 *
 * Each page is a print-friendly worksheet (@media print CSS) that captures
 * "printable [topic] quiz" search intent. Classroom-ready.
 */
const fs = require('fs');
const path = require('path');
const ROOT = path.resolve(__dirname, '..');

const STATES = JSON.parse(fs.readFileSync(path.join(ROOT, 'data/states.json'), 'utf8'));
const EXTRA = JSON.parse(fs.readFileSync(path.join(ROOT, 'data/play-extra.json'), 'utf8'));

const SLUGS = Object.fromEntries(STATES.map(s => [s.id, s.names.en.toLowerCase().replace(/\s+/g, '-')]));
const NAME = lang => Object.fromEntries(STATES.map(s => [s.id, (s.names && s.names[lang]) || s.names.en]));
const NAMES = { en: NAME('en'), fr: NAME('fr'), es: NAME('es') };

const PATHS = { en: '/play/', fr: '/fr/play/', es: '/es/play/' };
const HOME  = { en: '/', fr: '/fr/', es: '/es/' };

const GA = `
  <!-- Google tag (gtag.js) -->
  <script async src="https://www.googletagmanager.com/gtag/js?id=G-P7ZBQNYLS4"></script>
  <script>
    window.dataLayer = window.dataLayer || [];
    function gtag(){dataLayer.push(arguments);}
    gtag('js', new Date());
    gtag('config', 'G-P7ZBQNYLS4');
  </script>`;

const FOOTERS = {
  en: `<footer><p>Statedoku &copy; 2026 &nbsp;·&nbsp; <a href="/play/">Play & Learn</a> &nbsp;·&nbsp; <a href="/learn/">Learn</a></p></footer>`,
  fr: `<footer><p>Statedoku &copy; 2026 &nbsp;·&nbsp; <a href="/fr/play/">Jouer & Apprendre</a></p></footer>`,
  es: `<footer><p>Statedoku &copy; 2026 &nbsp;·&nbsp; <a href="/es/play/">Jugar y Aprender</a></p></footer>`,
};

// Game registry (subset; some are not great as worksheets — skip those)
const GAMES = {
  'place-the-state': { titles: { en: 'Place the State', fr: "Placer l'État", es: 'Coloca el Estado' }, ws: 'fill-50-on-map' },
  'state-capitals-typing': { titles: { en: 'State Capitals', fr: 'Capitales', es: 'Capitales' }, ws: 'state-to-capital' },
  'state-capitals-match': { titles: { en: 'States ↔ Capitals Match', fr: 'États ↔ Capitales', es: 'Estados ↔ Capitales' }, ws: 'matching' },
  'state-abbreviations': { titles: { en: 'USPS Abbreviations', fr: 'Abréviations USPS', es: 'Abreviaturas USPS' }, ws: 'abbr-to-state' },
  'state-flags': { titles: { en: 'State Flags', fr: 'Drapeaux', es: 'Banderas' }, ws: 'state-to-flag' },
  'state-nicknames': { titles: { en: 'State Nicknames', fr: "Surnoms d'États", es: 'Apodos Estatales' }, ws: 'state-to-nickname' },
  'state-mottos': { titles: { en: 'State Mottos', fr: "Devises d'États", es: 'Lemas Estatales' }, ws: 'state-to-motto' },
  'state-symbols': { titles: { en: 'State Symbols', fr: "Symboles", es: 'Símbolos' }, ws: 'state-to-symbol' },
  'thirteen-colonies': { titles: { en: '13 Original Colonies', fr: '13 Colonies', es: '13 Colonias' }, ws: 'fill-13-on-map' },
  'state-admission-order': { titles: { en: 'State Admission Order', fr: "Ordre d'Admission", es: 'Orden de Admisión' }, ws: 'state-to-year' },
  'confederate-states': { titles: { en: 'Confederate States', fr: 'États Confédérés', es: 'Estados Confederados' }, ws: 'identify-confederate' },
  'president-birth-states': { titles: { en: 'Presidents by Birth State', fr: 'Présidents par État Natal', es: 'Presidentes por Estado Natal' }, ws: 'pres-to-state' },
  'time-zones': { titles: { en: 'State Time Zones', fr: 'Fuseaux Horaires', es: 'Zonas Horarias' }, ws: 'state-to-tz' },
  'border-states': { titles: { en: 'Border States', fr: 'États Frontaliers', es: 'Estados Fronterizos' }, ws: 'identify-borders' },
  'rivers-mountains': { titles: { en: 'Rivers & Mountains', fr: 'Fleuves & Montagnes', es: 'Ríos y Montañas' }, ws: 'landmark-to-state' },
  'electoral-college': { titles: { en: 'Electoral Votes', fr: 'Grands Électeurs', es: 'Votos Electorales' }, ws: 'state-to-votes' },
  'swing-states': { titles: { en: 'Swing States', fr: 'États-Pivots', es: 'Estados Bisagra' }, ws: 'identify-swing' },
  'no-income-tax-states': { titles: { en: 'No Income Tax States', fr: 'États Sans Impôt', es: 'Estados Sin Impuesto' }, ws: 'identify-no-tax' },
  'state-silhouettes': { titles: { en: 'State Silhouettes', fr: "Silhouettes", es: 'Siluetas' }, ws: 'silhouette-to-name' },
  'states-connections': { titles: { en: 'States Categories', fr: "Catégories d'États", es: 'Categorías Estatales' }, ws: 'sort-into-groups' },
  'biggest-cities': { titles: { en: 'Biggest City Quiz', fr: 'Plus Grande Ville', es: 'Ciudad Más Grande' }, ws: 'state-to-city' },
};

function hreflang(gameSlug) {
  return `
  <link rel="canonical" href="https://statedoku.com/play/${gameSlug}/printable/">
  <link rel="alternate" hreflang="en" href="https://statedoku.com/play/${gameSlug}/printable/">
  <link rel="alternate" hreflang="fr" href="https://statedoku.com/fr/play/${gameSlug}/printable/">
  <link rel="alternate" hreflang="es" href="https://statedoku.com/es/play/${gameSlug}/printable/">
  <link rel="alternate" hreflang="x-default" href="https://statedoku.com/play/${gameSlug}/printable/">`;
}

const CSS = `
    body{margin:0;background:#F7F8FB;color:#0F2147;font-family:'Inter',system-ui,sans-serif;line-height:1.45}
    header,footer{padding:14px 20px;background:#fff;border-bottom:1px solid #E2E8F0;display:flex;justify-content:space-between;align-items:center}
    header a.logo{font-weight:900;font-size:1.1rem;color:#0F2147;text-decoration:none}
    header a.logo em{color:#DC2626;font-style:normal}
    header .actions a{color:#0F2147;text-decoration:none;font-weight:700;font-size:.88rem;margin-left:14px}
    main{max-width:880px;margin:0 auto;padding:18px 14px 40px}
    .ws-hero{text-align:center;padding:8px 0 16px}
    .ws-hero h1{font-size:clamp(1.6rem,4vw,2.2rem);font-weight:900;letter-spacing:-.02em;margin:0 0 6px;color:#0F2147}
    .ws-hero .sub{color:#475569;font-size:.95rem}
    .ws-chip{display:inline-block;padding:3px 10px;border-radius:999px;background:#F59E0B;color:#0F2147;font-weight:800;font-size:.7rem;letter-spacing:.06em;text-transform:uppercase;margin-bottom:10px}
    .ws-cta{display:flex;gap:10px;justify-content:center;margin:10px 0 22px;flex-wrap:wrap}
    .ws-cta button,.ws-cta a{padding:9px 18px;border-radius:999px;border:none;background:#0F2147;color:#fff;font-weight:800;cursor:pointer;font-size:.88rem;text-decoration:none;display:inline-block}
    .ws-cta a.gold{background:#F59E0B;color:#0F2147}
    .ws-meta{font-size:.85rem;color:#475569;text-align:center;margin-bottom:14px}
    .ws-table{width:100%;border-collapse:collapse;background:#fff;border:1px solid #E2E8F0;border-radius:8px;overflow:hidden;font-size:.92rem}
    .ws-table th{background:#F8FAFC;color:#0F2147;text-transform:uppercase;font-size:.72rem;letter-spacing:.04em;padding:8px 10px;text-align:left;border-bottom:1px solid #E2E8F0}
    .ws-table td{padding:9px 10px;border-bottom:1px solid #F1F5F9}
    .ws-table .blank{height:1.8em;border-bottom:1px solid #94A3B8}
    .ws-cols{display:grid;grid-template-columns:1fr 1fr;gap:18px}
    @media (max-width:600px){.ws-cols{grid-template-columns:1fr}}
    .ws-instructions{background:#FFF7ED;border:1px solid #F59E0B;border-radius:10px;padding:14px 18px;margin:10px 0 18px;font-size:.92rem}
    .ws-instructions strong{color:#0F2147}
    .ws-answer-key{margin-top:30px;border-top:2px dashed #E2E8F0;padding-top:18px}
    .ws-answer-key h2{font-size:1.1rem;color:#0F2147;margin:0 0 8px}
    .ws-answer-key details{margin:6px 0;background:#F1F5F9;padding:10px 14px;border-radius:8px}
    .ws-answer-key summary{font-weight:700;color:#0F2147;cursor:pointer}

    @media print{
      header,footer,.ws-cta,.ws-instructions,.ws-actions,nav,#print-hide{display:none!important}
      body{background:#fff}
      main{padding:0}
      .ws-table{border:1px solid #ddd;page-break-inside:auto}
      .ws-answer-key{page-break-before:always}
      h1{font-size:18pt}
      .ws-table th{font-size:9pt}
      .ws-table td{font-size:10pt;padding:5px 8px}
    }`;

// ─── Worksheet builders per game type ─────────────────────────────────────
function shuffle(arr) {
  const a = arr.slice();
  let seed = 42;
  function r() { seed = (seed * 1664525 + 1013904223) >>> 0; return seed / 4294967296; }
  for (let i = a.length - 1; i > 0; i--) {
    const j = Math.floor(r() * (i + 1));
    [a[i], a[j]] = [a[j], a[i]];
  }
  return a;
}

function tplStateToValue(lang, leftLabel, rightLabel, rows, answerKey) {
  // Two-column table: state name + blank, with answer key below
  const tEN = { state: 'State', blank: 'Your answer', answers: 'Answer key' };
  const tFR = { state: 'État',  blank: 'Réponse',     answers: 'Corrigé' };
  const tES = { state: 'Estado',blank: 'Respuesta',   answers: 'Clave de respuestas' };
  const T = { en: tEN, fr: tFR, es: tES }[lang];
  const left = T.state, right = T.blank;
  return `
    <table class="ws-table">
      <thead><tr><th>${leftLabel || left}</th><th>${rightLabel || right}</th></tr></thead>
      <tbody>
${rows.map(r => `        <tr><td>${r}</td><td class="blank"></td></tr>`).join('\n')}
      </tbody>
    </table>

    <div class="ws-answer-key">
      <h2>${T.answers}</h2>
      <details>
        <summary>Show all answers / Voir tous les corrigés / Ver claves</summary>
${answerKey.map(([q, a]) => `        <p style="margin:4px 0;font-size:.9rem">${q} → <strong>${a}</strong></p>`).join('\n')}
      </details>
    </div>`;
}

function tplValueToState(lang, leftLabel, rows, answerKey) {
  const tEN = { blank: 'State', answers: 'Answer key' };
  const tFR = { blank: 'État',  answers: 'Corrigé' };
  const tES = { blank: 'Estado',answers: 'Clave de respuestas' };
  const T = { en: tEN, fr: tFR, es: tES }[lang];
  return `
    <table class="ws-table">
      <thead><tr><th>${leftLabel}</th><th>${T.blank}</th></tr></thead>
      <tbody>
${rows.map(r => `        <tr><td>${r}</td><td class="blank"></td></tr>`).join('\n')}
      </tbody>
    </table>
    <div class="ws-answer-key">
      <h2>${T.answers}</h2>
      <details>
        <summary>Show all answers / Voir tous les corrigés / Ver claves</summary>
${answerKey.map(([q, a]) => `        <p style="margin:4px 0;font-size:.9rem">${q} → <strong>${a}</strong></p>`).join('\n')}
      </details>
    </div>`;
}

function tplSortGroups(lang, groups, allMembers) {
  // Show all state names, ask user to write a group letter
  const tEN = { groups: 'Categories', state: 'State', group: 'Group', answers: 'Answer key' };
  const tFR = { groups: 'Catégories', state: 'État',  group: 'Groupe',answers: 'Corrigé' };
  const tES = { groups: 'Categorías', state: 'Estado',group: 'Grupo', answers: 'Clave' };
  const T = { en: tEN, fr: tFR, es: tES }[lang];
  const groupLetters = ['A','B','C','D','E','F'];
  return `
    <h2>${T.groups}</h2>
    <ol>${groups.map((g, i) => `<li><strong>${groupLetters[i]}.</strong> ${g.label}</li>`).join('')}</ol>
    <table class="ws-table">
      <thead><tr><th>${T.state}</th><th>${T.group} (A, B, C, …)</th></tr></thead>
      <tbody>
${allMembers.map(s => `        <tr><td>${s}</td><td class="blank"></td></tr>`).join('\n')}
      </tbody>
    </table>
    <div class="ws-answer-key">
      <h2>${T.answers}</h2>
      <details>
        <summary>Show all / Voir / Ver</summary>
${groups.map((g, i) => `        <p style="margin:6px 0"><strong>${groupLetters[i]}. ${g.label}:</strong> ${g.members.join(', ')}</p>`).join('\n')}
      </details>
    </div>`;
}

// ─── Build worksheet per game ─────────────────────────────────────────────
function buildWorksheet(lang, gameSlug) {
  const states = STATES;
  const N = NAMES[lang];

  if (gameSlug === 'state-capitals-typing' || gameSlug === 'state-capitals-match') {
    const sample = shuffle(states).slice(0, 25);
    const rows = sample.map(s => N[s.id]);
    const ans = sample.map(s => [N[s.id], s.capital]);
    return tplStateToValue(lang, null, lang === 'en' ? 'Capital' : 'Capital', rows, ans);
  }

  if (gameSlug === 'state-abbreviations') {
    const sample = shuffle(states).slice(0, 25);
    const rows = sample.map(s => s.id);
    const ans = sample.map(s => [s.id, N[s.id]]);
    return tplValueToState(lang, lang === 'en' ? 'USPS Code' : lang === 'fr' ? 'Code USPS' : 'Código USPS', rows, ans);
  }

  if (gameSlug === 'state-nicknames') {
    const sample = shuffle(states.filter(s => (EXTRA.states[s.id] || {}).nickname)).slice(0, 20);
    const rows = sample.map(s => EXTRA.states[s.id].nickname);
    const ans = sample.map(s => [EXTRA.states[s.id].nickname, N[s.id]]);
    return tplValueToState(lang, lang === 'en' ? 'Nickname' : lang === 'fr' ? 'Surnom' : 'Apodo', rows, ans);
  }

  if (gameSlug === 'state-mottos') {
    const sample = shuffle(states.filter(s => (EXTRA.states[s.id] || {}).motto)).slice(0, 20);
    const rows = sample.map(s => EXTRA.states[s.id].motto);
    const ans = sample.map(s => [EXTRA.states[s.id].motto, N[s.id]]);
    return tplValueToState(lang, lang === 'en' ? 'Motto' : lang === 'fr' ? 'Devise' : 'Lema', rows, ans);
  }

  if (gameSlug === 'state-symbols') {
    const sample = shuffle(states.filter(s => (EXTRA.states[s.id] || {}).bird || (EXTRA.states[s.id] || {}).flower || (EXTRA.states[s.id] || {}).tree)).slice(0, 18);
    const rows = sample.map(s => {
      const ex = EXTRA.states[s.id] || {};
      return ex.bird ? `${ex.bird} (bird)` : ex.flower ? `${ex.flower} (flower)` : `${ex.tree} (tree)`;
    });
    const ans = sample.map(s => {
      const ex = EXTRA.states[s.id] || {};
      const sym = ex.bird ? `${ex.bird} (bird)` : ex.flower ? `${ex.flower} (flower)` : `${ex.tree} (tree)`;
      return [sym, N[s.id]];
    });
    return tplValueToState(lang, lang === 'en' ? 'Symbol' : lang === 'fr' ? 'Symbole' : 'Símbolo', rows, ans);
  }

  if (gameSlug === 'biggest-cities') {
    const cities = EXTRA.biggest_cities;
    const sample = shuffle(states.filter(s => cities[s.id])).slice(0, 25);
    const rows = sample.map(s => N[s.id]);
    const ans = sample.map(s => [N[s.id], cities[s.id]]);
    return tplStateToValue(lang, null, lang === 'en' ? 'Biggest city' : lang === 'fr' ? 'Plus grande ville' : 'Ciudad más grande', rows, ans);
  }

  if (gameSlug === 'electoral-college') {
    const sample = shuffle(states.filter(s => (EXTRA.states[s.id] || {}).electoralVotes)).slice(0, 25);
    const rows = sample.map(s => N[s.id]);
    const ans = sample.map(s => [N[s.id], String(EXTRA.states[s.id].electoralVotes)]);
    return tplStateToValue(lang, null, lang === 'en' ? 'Electoral votes' : lang === 'fr' ? 'Grands électeurs' : 'Votos electorales', rows, ans);
  }

  if (gameSlug === 'time-zones') {
    const sample = shuffle(states).slice(0, 25);
    const rows = sample.map(s => N[s.id]);
    const ans = sample.map(s => [N[s.id], s.timezone]);
    return tplStateToValue(lang, null, lang === 'en' ? 'Time zone' : lang === 'fr' ? 'Fuseau horaire' : 'Zona horaria', rows, ans);
  }

  if (gameSlug === 'state-admission-order') {
    const sample = shuffle(states).slice(0, 20).sort((a, b) => a.admitted - b.admitted);
    const rows = sample.map(s => N[s.id]);
    const ans = sample.map(s => [N[s.id], String(s.admitted)]);
    return tplStateToValue(lang, null, lang === 'en' ? 'Year admitted' : lang === 'fr' ? "Année d'admission" : 'Año de admisión', rows, ans);
  }

  if (gameSlug === 'thirteen-colonies') {
    const c13 = states.filter(s => s.original13);
    const others = shuffle(states.filter(s => !s.original13)).slice(0, 12);
    const all = shuffle([...c13, ...others]).map(s => N[s.id]);
    return tplSortGroups(lang, [
      { label: lang === 'en' ? 'Original 13 Colonies' : lang === 'fr' ? '13 Colonies originelles' : '13 Colonias originales', members: c13.map(s => N[s.id]) },
      { label: lang === 'en' ? 'NOT in the original 13' : lang === 'fr' ? "Pas dans les 13" : 'No en las 13', members: others.map(s => N[s.id]) },
    ], all);
  }

  if (gameSlug === 'confederate-states') {
    const conf = states.filter(s => s.confederate);
    const union = shuffle(states.filter(s => !s.confederate && s.admitted < 1861)).slice(0, 12);
    const all = shuffle([...conf, ...union]).map(s => N[s.id]);
    return tplSortGroups(lang, [
      { label: lang === 'en' ? 'Confederate States (CSA)' : lang === 'fr' ? 'États Confédérés' : 'Estados Confederados', members: conf.map(s => N[s.id]) },
      { label: lang === 'en' ? 'Union states (admitted before 1861)' : lang === 'fr' ? 'États Union (avant 1861)' : 'Estados Unión (antes de 1861)', members: union.map(s => N[s.id]) },
    ], all);
  }

  if (gameSlug === 'swing-states') {
    const swing = EXTRA.swing_states_2024.map(id => N[id]);
    const other = shuffle(states.filter(s => !EXTRA.swing_states_2024.includes(s.id))).slice(0, 14).map(s => N[s.id]);
    const all = shuffle([...swing, ...other]);
    return tplSortGroups(lang, [
      { label: lang === 'en' ? 'Swing states (2024)' : lang === 'fr' ? 'États-pivots (2024)' : 'Estados bisagra (2024)', members: swing },
      { label: lang === 'en' ? 'Solidly partisan states' : lang === 'fr' ? 'États fortement partisans' : 'Estados fuertemente partidistas', members: other },
    ], all);
  }

  if (gameSlug === 'no-income-tax-states') {
    const nit = states.filter(s => s.noIncomeTax);
    const wit = shuffle(states.filter(s => !s.noIncomeTax)).slice(0, 14);
    const all = shuffle([...nit, ...wit]).map(s => N[s.id]);
    return tplSortGroups(lang, [
      { label: lang === 'en' ? 'No state income tax' : lang === 'fr' ? "Pas d'impôt sur le revenu" : 'Sin impuesto sobre la renta', members: nit.map(s => N[s.id]) },
      { label: lang === 'en' ? 'With state income tax' : lang === 'fr' ? "Avec impôt sur le revenu" : 'Con impuesto sobre la renta', members: wit.map(s => N[s.id]) },
    ], all);
  }

  if (gameSlug === 'border-states') {
    const can = states.filter(s => s.bordersCanada);
    const mex = states.filter(s => s.bordersMexico);
    const other = shuffle(states.filter(s => !s.bordersCanada && !s.bordersMexico)).slice(0, 10);
    const all = shuffle([...can, ...mex, ...other]).map(s => N[s.id]);
    return tplSortGroups(lang, [
      { label: lang === 'en' ? 'Borders Canada' : lang === 'fr' ? 'Frontière Canada' : 'Frontera con Canadá', members: can.map(s => N[s.id]) },
      { label: lang === 'en' ? 'Borders Mexico' : lang === 'fr' ? 'Frontière Mexique' : 'Frontera con México', members: mex.map(s => N[s.id]) },
      { label: lang === 'en' ? 'Borders neither' : lang === 'fr' ? 'Aucune' : 'Ninguna', members: other.map(s => N[s.id]) },
    ], all);
  }

  if (gameSlug === 'rivers-mountains') {
    const lm = EXTRA.rivers_landmarks;
    const sample = Object.entries(lm).filter(([id, _]) => id !== '_doc').slice(0, 20);
    const rows = sample.map(([id, landmark]) => landmark);
    const ans = sample.map(([id, landmark]) => [landmark, N[id]]);
    return tplValueToState(lang, lang === 'en' ? 'Landmark' : lang === 'fr' ? 'Repère' : 'Lugar', rows, ans);
  }

  if (gameSlug === 'president-birth-states') {
    const items = [];
    Object.entries(EXTRA.states).forEach(([id, ex]) => {
      (ex.presidents || []).forEach(p => {
        if (p.includes('(Confederate)') || p.includes('(born)') || p.includes('(raised)')) return;
        items.push([p, N[id]]);
      });
    });
    const sample = shuffle(items).slice(0, 20);
    const rows = sample.map(s => s[0]);
    return tplValueToState(lang, lang === 'en' ? 'President' : lang === 'fr' ? 'Président' : 'Presidente', rows, sample);
  }

  if (gameSlug === 'state-flags') {
    const sample = shuffle(states).slice(0, 18);
    const rows = sample.map(s => N[s.id]);
    const ans = sample.map(s => [N[s.id], lang === 'en' ? `(describe the flag of ${N[s.id]})` : lang === 'fr' ? `(décrire le drapeau de ${N[s.id]})` : `(describir la bandera de ${N[s.id]})`]);
    return tplStateToValue(lang, null, lang === 'en' ? 'Describe the flag' : lang === 'fr' ? 'Décrire le drapeau' : 'Describir la bandera', rows, ans);
  }

  if (gameSlug === 'state-silhouettes') {
    const sample = shuffle(states).slice(0, 12);
    const rows = sample.map(s => lang === 'en' ? `Look at the shape of ${N[s.id]}` : lang === 'fr' ? `Regardez la forme de ${N[s.id]}` : `Mire la forma de ${N[s.id]}`);
    const ans = sample.map(s => [N[s.id], N[s.id]]);
    return tplStateToValue(lang, null, lang === 'en' ? 'Identify the state' : lang === 'fr' ? "Identifier l'État" : 'Identificar el estado', rows, ans);
  }

  if (gameSlug === 'place-the-state') {
    const sample = shuffle(states).slice(0, 20);
    const rows = sample.map(s => N[s.id]);
    const ans = sample.map(s => [N[s.id], lang === 'en' ? `(located in ${s.region})` : lang === 'fr' ? `(située dans le ${s.region})` : `(ubicada en el ${s.region})`]);
    return tplStateToValue(lang, null, lang === 'en' ? 'Region' : lang === 'fr' ? 'Région' : 'Región', rows, ans);
  }

  if (gameSlug === 'states-connections') {
    // Use a simple sort-into-belt-types puzzle
    const belts = {
      sunBelt: states.filter(s => s.sunBelt).slice(0,4).map(s => N[s.id]),
      rustBelt: states.filter(s => s.rustBelt).slice(0,4).map(s => N[s.id]),
      bibleBelt: states.filter(s => s.bibleBelt).slice(0,4).map(s => N[s.id]),
      original13: states.filter(s => s.original13).slice(0,4).map(s => N[s.id]),
    };
    const all = shuffle([...belts.sunBelt, ...belts.rustBelt, ...belts.bibleBelt, ...belts.original13]);
    return tplSortGroups(lang, [
      { label: 'Sun Belt', members: belts.sunBelt },
      { label: 'Rust Belt', members: belts.rustBelt },
      { label: 'Bible Belt', members: belts.bibleBelt },
      { label: lang === 'en' ? 'Original 13 Colonies' : lang === 'fr' ? '13 Colonies originelles' : '13 Colonias originales', members: belts.original13 },
    ], all);
  }

  // Fallback
  return `<p>${lang === 'en' ? 'Worksheet coming soon.' : lang === 'fr' ? 'Fiche bientôt disponible.' : 'Hoja de trabajo próximamente.'}</p>`;
}

function pageHTML(lang, gameSlug) {
  const g = GAMES[gameSlug];
  const title = lang === 'en'
    ? `Printable ${g.titles.en} worksheet (free PDF-ready, 2026) | Statedoku`
    : lang === 'fr'
    ? `Fiche imprimable ${g.titles.fr} (gratuit, 2026) | Statedoku`
    : `Hoja imprimable ${g.titles.es} (gratis, 2026) | Statedoku`;
  const desc = lang === 'en'
    ? `Free printable worksheet for ${g.titles.en}. Classroom-ready PDF with answer key. Print or play online.`
    : lang === 'fr'
    ? `Fiche imprimable gratuite : ${g.titles.fr}. Format prêt à imprimer avec corrigé. Imprimer ou jouer en ligne.`
    : `Hoja imprimable gratuita: ${g.titles.es}. Formato listo para imprimir con clave de respuestas.`;
  const kw = lang === 'en'
    ? `printable ${g.titles.en.toLowerCase()}, ${gameSlug} worksheet, free us states printable`
    : lang === 'fr'
    ? `fiche imprimable ${g.titles.fr.toLowerCase()}, ${gameSlug} pdf gratuit`
    : `hoja imprimable ${g.titles.es.toLowerCase()}, ${gameSlug} pdf gratis`;

  const breadcrumb = lang === 'en'
    ? `[{"@type":"ListItem","position":1,"name":"Home","item":"https://statedoku.com/"},{"@type":"ListItem","position":2,"name":"Play & Learn","item":"https://statedoku.com/play/"},{"@type":"ListItem","position":3,"name":"${g.titles.en}","item":"https://statedoku.com/play/${gameSlug}/"},{"@type":"ListItem","position":4,"name":"Printable","item":"https://statedoku.com/play/${gameSlug}/printable/"}]`
    : lang === 'fr'
    ? `[{"@type":"ListItem","position":1,"name":"Accueil","item":"https://statedoku.com/fr/"},{"@type":"ListItem","position":2,"name":"Jouer & Apprendre","item":"https://statedoku.com/fr/play/"},{"@type":"ListItem","position":3,"name":"${g.titles.fr}","item":"https://statedoku.com/fr/play/${gameSlug}/"},{"@type":"ListItem","position":4,"name":"Imprimable","item":"https://statedoku.com/fr/play/${gameSlug}/printable/"}]`
    : `[{"@type":"ListItem","position":1,"name":"Inicio","item":"https://statedoku.com/es/"},{"@type":"ListItem","position":2,"name":"Jugar y Aprender","item":"https://statedoku.com/es/play/"},{"@type":"ListItem","position":3,"name":"${g.titles.es}","item":"https://statedoku.com/es/play/${gameSlug}/"},{"@type":"ListItem","position":4,"name":"Imprimible","item":"https://statedoku.com/es/play/${gameSlug}/printable/"}]`;

  const playUrl = `${PATHS[lang]}${gameSlug}/`;
  const titleHero = lang === 'en' ? `${g.titles.en} Worksheet` : lang === 'fr' ? `Fiche : ${g.titles.fr}` : `Hoja: ${g.titles.es}`;
  const sub = lang === 'en'
    ? 'Print this worksheet for class or solo practice. Click Print to print, or play the interactive version online.'
    : lang === 'fr'
    ? 'Imprime cette fiche pour la classe ou ton entraînement. Clique sur Imprimer ou joue à la version interactive.'
    : 'Imprime esta hoja para la clase o tu práctica. Clic en Imprimir o juega la versión interactiva.';
  const printLabel = { en: '🖨 Print', fr: '🖨 Imprimer', es: '🖨 Imprimir' }[lang];
  const playLabel = { en: 'Play online ▶', fr: 'Jouer en ligne ▶', es: 'Jugar en línea ▶' }[lang];

  const ws = buildWorksheet(lang, gameSlug);

  return `<!DOCTYPE html>
<html lang="${lang}">
<head>${GA}
  <meta charset="UTF-8">
  <meta name="viewport" content="width=device-width,initial-scale=1.0">
  <meta name="theme-color" content="#0F2147">
  <title>${title}</title>
  <meta name="description" content="${desc}">
  <meta name="keywords" content="${kw}">
  <meta name="robots" content="index, follow, max-image-preview:large">
${hreflang(gameSlug)}
  <link rel="icon" type="image/svg+xml" href="/favicon.svg?v=5">
  <link rel="stylesheet" href="https://fonts.googleapis.com/css2?family=Inter:wght@500;700;800&display=swap">
  <meta property="og:type" content="article">
  <meta property="og:title" content="${title}">
  <meta property="og:description" content="${desc.slice(0,160)}">
  <meta property="og:url" content="https://statedoku.com${PATHS[lang]}${gameSlug}/printable/">
  <meta property="og:image" content="https://statedoku.com/og/og-learn-state-capitals.png">
  <meta property="og:locale" content="${lang === 'en' ? 'en_US' : lang === 'fr' ? 'fr_FR' : 'es_ES'}">
  <style>${CSS}</style>
</head>
<body>
<header id="print-hide">
  <a href="${HOME[lang]}" class="logo">State<em>doku</em> 🇺🇸</a>
  <div class="actions"><a href="${playUrl}">${playLabel}</a></div>
</header>
<script type="application/ld+json">
{"@context":"https://schema.org","@type":"BreadcrumbList","itemListElement":${breadcrumb}}
</script>
<main>
  <section class="ws-hero">
    <span class="ws-chip">🖨 ${lang === 'en' ? 'PRINTABLE' : lang === 'fr' ? 'IMPRIMABLE' : 'IMPRIMIBLE'}</span>
    <h1>${titleHero}</h1>
    <p class="sub">${sub}</p>
    <div class="ws-cta">
      <button onclick="window.print()">${printLabel}</button>
      <a class="gold" href="${playUrl}">${playLabel}</a>
    </div>
    <div class="ws-meta">${lang === 'en' ? 'Free for classroom + personal use. No signup. No watermark.' : lang === 'fr' ? 'Gratuit pour usage scolaire et personnel. Sans inscription, sans filigrane.' : 'Gratis para uso escolar y personal. Sin registro, sin marca de agua.'}</div>
  </section>

  <div class="ws-instructions">
    <strong>${lang === 'en' ? 'How to use:' : lang === 'fr' ? 'Mode d\'emploi :' : 'Cómo usar:'}</strong>
    ${lang === 'en' ? 'Print or fill on screen. Self-check with the answer key at the end. Use as a classroom warm-up, homework, or solo study.' : lang === 'fr' ? 'Imprimez ou remplissez à l\'écran. Vérifiez avec le corrigé en fin de page. Idéal pour un échauffement en classe, un devoir, ou une révision perso.' : 'Imprime o llena en pantalla. Verifica con la clave de respuestas al final. Útil para calentamiento de clase, tarea o estudio personal.'}
  </div>

${ws}

</main>
${FOOTERS[lang]}
<script>document.documentElement.lang='${lang}';</script>
</body>
</html>`;
}

// ─── WRITE ────────────────────────────────────────────────────────────────
const LANGS = ['en', 'fr', 'es'];
const out = [];
for (const gameSlug of Object.keys(GAMES)) {
  for (const lang of LANGS) {
    const dirRel = lang === 'en' ? `play/${gameSlug}/printable` : `${lang}/play/${gameSlug}/printable`;
    const file = path.join(ROOT, dirRel, 'index.html');
    fs.mkdirSync(path.dirname(file), { recursive: true });
    fs.writeFileSync(file, pageHTML(lang, gameSlug));
    out.push(dirRel);
  }
}
console.log(`✅ ${out.length} printable worksheet pages written (${Object.keys(GAMES).length} games × ${LANGS.length} langs)`);
fs.writeFileSync(path.join(__dirname, 'printable-paths.json'), JSON.stringify({ games: Object.keys(GAMES), langs: LANGS, total: out.length, paths: out }, null, 2));
