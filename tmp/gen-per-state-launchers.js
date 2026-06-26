#!/usr/bin/env node
/**
 * Per-state launcher pages — Seterra pattern.
 *
 *   5 games × 50 states × 3 langs = 750 new HTML pages.
 *
 * Each page is a marketing landing page that captures '[state] [game] quiz'
 * search traffic, contains UNIQUE state-specific content (~500 words from data
 * files), and funnels to the actual game page.
 *
 * URL pattern: /play/<game>/state/<state-slug>/
 *              /fr/play/<game>/state/<state-slug>/
 *              /es/play/<game>/state/<state-slug>/
 */
const fs = require('fs');
const path = require('path');
const ROOT = path.resolve(__dirname, '..');

const STATES = JSON.parse(fs.readFileSync(path.join(ROOT, 'data/states.json'), 'utf8'));
const EXTRA = JSON.parse(fs.readFileSync(path.join(ROOT, 'data/play-extra.json'), 'utf8'));
const FACTS = (() => { try { return JSON.parse(fs.readFileSync(path.join(ROOT, 'data/facts.json'), 'utf8')); } catch (e) { return []; } })();

const slugOf = name => name.toLowerCase().replace(/\s+/g, '-');

const STATE_NAME = lang => Object.fromEntries(STATES.map(s => [s.id, (s.names && s.names[lang]) || s.names.en]));
const STATE_NAMES = { en: STATE_NAME('en'), fr: STATE_NAME('fr'), es: STATE_NAME('es') };

// Pre-compute slugs
const SLUGS = Object.fromEntries(STATES.map(s => [s.id, slugOf(s.names.en)]));

// Borders lookup
const BORDERS = (() => {
  const m = {};
  STATES.forEach(s => { m[s.id] = []; });
  // Hardcoded US state border map (public-domain Census data)
  const BMAP = {
    AL: ['FL','GA','MS','TN'], AK: [], AZ: ['CA','CO','NM','NV','UT'], AR: ['LA','MS','MO','OK','TN','TX'],
    CA: ['AZ','NV','OR'], CO: ['AZ','KS','NE','NM','OK','UT','WY'], CT: ['MA','NY','RI'], DE: ['MD','NJ','PA'],
    FL: ['AL','GA'], GA: ['AL','FL','NC','SC','TN'], HI: [], ID: ['MT','NV','OR','UT','WA','WY'],
    IL: ['IN','IA','KY','MO','WI'], IN: ['IL','KY','MI','OH'], IA: ['IL','MN','MO','NE','SD','WI'],
    KS: ['CO','MO','NE','OK'], KY: ['IL','IN','MO','OH','TN','VA','WV'], LA: ['AR','MS','TX'],
    ME: ['NH'], MD: ['DE','PA','VA','WV'], MA: ['CT','NH','NY','RI','VT'], MI: ['IN','OH','WI'],
    MN: ['IA','MI','ND','SD','WI'], MS: ['AL','AR','LA','TN'], MO: ['AR','IA','IL','KS','KY','NE','OK','TN'],
    MT: ['ID','ND','SD','WY'], NE: ['CO','IA','KS','MO','SD','WY'], NV: ['AZ','CA','ID','OR','UT'],
    NH: ['ME','MA','VT'], NJ: ['DE','NY','PA'], NM: ['AZ','CO','OK','TX','UT'],
    NY: ['CT','MA','NJ','PA','VT'], NC: ['GA','SC','TN','VA'], ND: ['MN','MT','SD'],
    OH: ['IN','KY','MI','PA','WV'], OK: ['AR','CO','KS','MO','NM','TX'], OR: ['CA','ID','NV','WA'],
    PA: ['DE','MD','NJ','NY','OH','WV'], RI: ['CT','MA'], SC: ['GA','NC'], SD: ['IA','MN','MT','NE','ND','WY'],
    TN: ['AL','AR','GA','KY','MS','MO','NC','VA'], TX: ['AR','LA','NM','OK'], UT: ['AZ','CO','ID','NV','NM','WY'],
    VT: ['MA','NH','NY'], VA: ['KY','MD','NC','TN','WV'], WA: ['ID','OR'], WV: ['KY','MD','OH','PA','VA'],
    WI: ['IL','IA','MI','MN'], WY: ['CO','ID','MT','NE','SD','UT'],
  };
  Object.keys(BMAP).forEach(id => { m[id] = BMAP[id] || []; });
  return m;
})();

const REGION_LABEL = {
  en: { northeast: 'Northeast', south: 'South', midwest: 'Midwest', west: 'West' },
  fr: { northeast: 'Nord-Est', south: 'Sud', midwest: 'Midwest', west: 'Ouest' },
  es: { northeast: 'Noreste', south: 'Sur', midwest: 'Medio Oeste', west: 'Oeste' },
};

// Shared HTML helpers
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
  en: `<footer><p>Statedoku &copy; 2026 &nbsp;·&nbsp; <a href="/play/">Play & Learn</a> &nbsp;·&nbsp; <a href="/learn/">Learn</a> &nbsp;·&nbsp; <a href="/states/">States</a> &nbsp;·&nbsp; <a href="/faq/">FAQ</a></p></footer>`,
  fr: `<footer><p>Statedoku &copy; 2026 &nbsp;·&nbsp; <a href="/fr/play/">Jouer & Apprendre</a> &nbsp;·&nbsp; <a href="/fr/learn/">Apprendre</a> &nbsp;·&nbsp; <a href="/fr/faq/">FAQ</a></p></footer>`,
  es: `<footer><p>Statedoku &copy; 2026 &nbsp;·&nbsp; <a href="/es/play/">Jugar y Aprender</a> &nbsp;·&nbsp; <a href="/es/learn/">Aprender</a> &nbsp;·&nbsp; <a href="/es/faq/">FAQ</a></p></footer>`,
};

const PATHS = { en: '/play/', fr: '/fr/play/', es: '/es/play/' };
const HOME = { en: '/', fr: '/fr/', es: '/es/' };
const BACK_HUB = { en: '← All games', fr: '← Tous les jeux', es: '← Todos los juegos' };
const LOCALE_TAG = { en: 'en_US', fr: 'fr_FR', es: 'es_ES' };

function hreflang(game, stateSlug) {
  return `
  <link rel="canonical" href="https://statedoku.com/play/${game}/state/${stateSlug}/">
  <link rel="alternate" hreflang="en" href="https://statedoku.com/play/${game}/state/${stateSlug}/">
  <link rel="alternate" hreflang="en-US" href="https://statedoku.com/play/${game}/state/${stateSlug}/">
  <link rel="alternate" hreflang="fr" href="https://statedoku.com/fr/play/${game}/state/${stateSlug}/">
  <link rel="alternate" hreflang="fr-FR" href="https://statedoku.com/fr/play/${game}/state/${stateSlug}/">
  <link rel="alternate" hreflang="es" href="https://statedoku.com/es/play/${game}/state/${stateSlug}/">
  <link rel="alternate" hreflang="es-ES" href="https://statedoku.com/es/play/${game}/state/${stateSlug}/">
  <link rel="alternate" hreflang="es-MX" href="https://statedoku.com/es/play/${game}/state/${stateSlug}/">
  <link rel="alternate" hreflang="x-default" href="https://statedoku.com/play/${game}/state/${stateSlug}/">`;
}

const SHARED_CSS = `
    .hub-hero{max-width:760px;margin:24px auto 14px;padding:0 18px;text-align:center}
    .hub-hero h1{font-size:clamp(1.7rem,4.5vw,2.4rem);font-weight:900;letter-spacing:-.025em;margin:0 0 10px;line-height:1.15}
    .hub-hero .sub{color:var(--text-2);font-size:1rem;line-height:1.55}
    .hub-chip{display:inline-block;padding:4px 10px;border-radius:999px;background:var(--gold);color:var(--navy);font-weight:800;font-size:.78rem;letter-spacing:.06em;text-transform:uppercase;margin-bottom:12px}
    .lc-wrap{max-width:760px;margin:0 auto;padding:14px 14px 60px}
    .lc-card{background:linear-gradient(135deg,var(--navy),var(--navy-soft));color:#fff;border-radius:14px;padding:20px;text-align:center;margin:14px 0}
    .lc-card h3{color:#fff;margin:0 0 6px;font-size:1.15rem}
    .lc-card p{margin:0 0 12px;color:rgba(255,255,255,.85);font-size:.92rem}
    .lc-card a{display:inline-block;background:var(--gold);color:var(--navy);padding:11px 22px;border-radius:999px;font-weight:800;text-decoration:none;font-size:.95rem}
    .lc-section{margin:24px 0}
    .lc-section h2{font-size:1.2rem;font-weight:800;letter-spacing:-.015em;margin:0 0 10px;color:var(--navy)}
    .lc-section p,.lc-section li{line-height:1.55;color:var(--text)}
    .lc-section ul{padding-left:22px;margin:6px 0 14px}
    .lc-facts{background:#F8FAFC;border:1px solid var(--border);border-radius:12px;padding:14px 18px;margin:10px 0}
    .lc-facts dl{display:grid;grid-template-columns:max-content 1fr;gap:6px 14px;margin:0;font-size:.92rem}
    .lc-facts dt{font-weight:700;color:var(--navy);font-size:.82rem}
    .lc-facts dd{margin:0;color:var(--text)}
    .lc-related{display:grid;grid-template-columns:repeat(auto-fit,minmax(200px,1fr));gap:8px;margin:10px 0}
    .lc-related a{display:block;padding:10px 12px;border:1px solid var(--border);border-radius:8px;color:var(--navy);text-decoration:none;font-weight:600;font-size:.88rem}
    .lc-related a:hover{background:#F8FAFC;border-color:var(--navy)}
    details{margin:8px 0;padding:10px 14px;background:#F8FAFC;border-radius:8px}
    summary{font-weight:700;color:var(--navy);cursor:pointer}
    details p{margin:8px 0 0;color:var(--text-2)}`;

// ─── Game definitions for launchers ───────────────────────────────────────
const GAMES = {
  'place-the-state': {
    titles: { en: 'Place the State', fr: "Placer l'État", es: 'Coloca el Estado' },
    chip: '📍 MAP CHALLENGE',
    seoKey: { en: 'on the map', fr: 'sur la carte', es: 'en el mapa' },
  },
  'state-capitals-typing': {
    titles: { en: 'State Capitals Quiz', fr: 'Quiz Capitales', es: 'Quiz Capitales' },
    chip: '🏛️ TYPE CAPITALS',
    seoKey: { en: 'capital', fr: 'capitale', es: 'capital' },
  },
  'state-abbreviations': {
    titles: { en: 'USPS Abbreviation', fr: 'Abréviation USPS', es: 'Abreviatura USPS' },
    chip: '✉️ USPS CODES',
    seoKey: { en: 'abbreviation', fr: 'abréviation', es: 'abreviatura' },
  },
  'state-flags': {
    titles: { en: 'State Flag Quiz', fr: 'Quiz Drapeau', es: 'Quiz Bandera' },
    chip: '🏳️ FLAGS',
    seoKey: { en: 'flag', fr: 'drapeau', es: 'bandera' },
  },
  'state-nicknames': {
    titles: { en: 'State Nickname Quiz', fr: "Quiz Surnom", es: 'Quiz Apodo' },
    chip: '✨ NICKNAMES',
    seoKey: { en: 'nickname', fr: 'surnom', es: 'apodo' },
  },
};

// ─── Body content generator (per state × game) ────────────────────────────
function bodyForLauncher(lang, gameSlug, state) {
  const stateName = STATE_NAMES[lang][state.id];
  const stateNameEn = STATE_NAMES.en[state.id];
  const stateSlug = SLUGS[state.id];
  const extra = EXTRA.states[state.id] || {};
  const regionLabel = REGION_LABEL[lang][state.region] || state.region;
  const borderIds = BORDERS[state.id] || [];
  const borderNames = borderIds.map(b => STATE_NAMES[lang][b]).join(', ');
  const game = GAMES[gameSlug];
  const playUrl = PATHS[lang] + gameSlug + '/';
  const homeUrl = HOME[lang];

  // Game-specific intro
  let intro = '';
  let facts = [];
  let why = '';
  let challenge = '';

  // Translation packs
  const T = {
    en: {
      gameTopic: { 'place-the-state': "where it is on the US map", 'state-capitals-typing': `${stateName}'s capital`, 'state-abbreviations': `${stateName}'s 2-letter postal abbreviation`, 'state-flags': `${stateName}'s state flag`, 'state-nicknames': `${stateName}'s state nickname` },
      playNow: 'Play the full game now',
      backHub: 'All US states games',
      otherStateGames: `Other ${stateName} games`,
      otherStateContent: `More about ${stateName}`,
      faqHead: 'Frequently asked',
      quickFacts: 'Quick facts',
      capitalLabel: 'Capital', biggestCityLabel: 'Largest city', regionLabel: 'Region', abbrLabel: 'USPS code', admittedLabel: 'Admitted to Union', popLabel: 'Population', nicknameLabel: 'Nickname', mottoLabel: 'Motto', electLabel: 'Electoral votes', borderingLabel: 'Bordering states',
    },
    fr: {
      gameTopic: { 'place-the-state': "où il se trouve sur la carte des USA", 'state-capitals-typing': `la capitale de ${stateName}`, 'state-abbreviations': `l'abréviation USPS à 2 lettres de ${stateName}`, 'state-flags': `le drapeau de ${stateName}`, 'state-nicknames': `le surnom de ${stateName}` },
      playNow: 'Jouer maintenant',
      backHub: 'Tous les jeux US',
      otherStateGames: `Autres jeux sur ${stateName}`,
      otherStateContent: `En savoir plus sur ${stateName}`,
      faqHead: 'Questions fréquentes',
      quickFacts: 'En bref',
      capitalLabel: 'Capitale', biggestCityLabel: 'Ville la plus grande', regionLabel: 'Région', abbrLabel: 'Code USPS', admittedLabel: 'Admission à l\'Union', popLabel: 'Population', nicknameLabel: 'Surnom', mottoLabel: 'Devise', electLabel: 'Grands électeurs', borderingLabel: 'États frontaliers',
    },
    es: {
      gameTopic: { 'place-the-state': "dónde está en el mapa de EE.UU.", 'state-capitals-typing': `la capital de ${stateName}`, 'state-abbreviations': `la abreviatura USPS de 2 letras de ${stateName}`, 'state-flags': `la bandera de ${stateName}`, 'state-nicknames': `el apodo de ${stateName}` },
      playNow: 'Jugar ahora',
      backHub: 'Todos los juegos US',
      otherStateGames: `Otros juegos sobre ${stateName}`,
      otherStateContent: `Más sobre ${stateName}`,
      faqHead: 'Preguntas frecuentes',
      quickFacts: 'Datos rápidos',
      capitalLabel: 'Capital', biggestCityLabel: 'Ciudad más grande', regionLabel: 'Región', abbrLabel: 'Código USPS', admittedLabel: 'Admisión a la Unión', popLabel: 'Población', nicknameLabel: 'Apodo', mottoLabel: 'Lema', electLabel: 'Votos electorales', borderingLabel: 'Estados fronterizos',
    },
  }[lang];

  // Build content per game
  if (gameSlug === 'place-the-state') {
    intro = lang === 'en'
      ? `${stateName} (USPS code <strong>${state.id}</strong>) is one of the 50 US states. It is in the ${regionLabel} region. This page is the launcher for the Place the State quiz with a ${stateName} focus — you'll be shown the name <em>${stateName}</em> and asked to click its location on the US map.`
      : lang === 'fr'
      ? `${stateName} (code USPS <strong>${state.id}</strong>) est l'un des 50 États américains. Il est situé dans la région ${regionLabel}. Cette page est le point d'entrée du quiz « Placer l'État » avec un focus ${stateName} — on vous montre le nom <em>${stateName}</em> et il faut cliquer sa position sur la carte.`
      : `${stateName} (código USPS <strong>${state.id}</strong>) es uno de los 50 estados de EE.UU. Se ubica en la región ${regionLabel}. Esta página es el lanzador del quiz « Coloca el Estado » con foco en ${stateName} — se le muestra el nombre <em>${stateName}</em> y debe hacer clic en su ubicación en el mapa.`;
    why = lang === 'en'
      ? `<h2>Where ${stateName} is</h2><p>${stateName} is in the ${regionLabel} region of the United States. ${borderIds.length > 0 ? `It borders ${borderIds.length} other state${borderIds.length > 1 ? 's' : ''}: ${borderNames}. Look for these neighbors as visual anchors on the map.` : `It is geographically isolated from the contiguous United States — there are no neighbor states to use as anchors.`}</p>${state.coastline && state.coastline.length ? `<p>${stateName} has coastline on the ${state.coastline.join(' and ')}, which helps identify it on the map.</p>` : ''}`
      : lang === 'fr'
      ? `<h2>Où se trouve ${stateName}</h2><p>${stateName} est dans la région ${regionLabel} des États-Unis. ${borderIds.length > 0 ? `Il a une frontière avec ${borderIds.length} autre${borderIds.length > 1 ? 's' : ''} État${borderIds.length > 1 ? 's' : ''} : ${borderNames}. Repérez ces voisins comme points d'ancrage visuels.` : `Il est isolé géographiquement des États-Unis contigus — aucun voisin pour s'appuyer.`}</p>${state.coastline && state.coastline.length ? `<p>${stateName} a une côte sur ${state.coastline.join(' et ')}, ce qui aide à l'identifier sur la carte.</p>` : ''}`
      : `<h2>Dónde está ${stateName}</h2><p>${stateName} está en la región ${regionLabel} de Estados Unidos. ${borderIds.length > 0 ? `Limita con ${borderIds.length} estado${borderIds.length > 1 ? 's' : ''}: ${borderNames}. Use estos vecinos como anclas visuales en el mapa.` : `Está geográficamente aislado de los Estados Unidos contiguos — no hay vecinos para anclar.`}</p>${state.coastline && state.coastline.length ? `<p>${stateName} tiene costa en el ${state.coastline.join(' y ')}, lo que ayuda a identificarlo en el mapa.</p>` : ''}`;
  } else if (gameSlug === 'state-capitals-typing') {
    intro = lang === 'en'
      ? `The capital of ${stateName} is <strong>${state.capital}</strong>. This page is the launcher for the State Capitals typing quiz with ${stateName} as the first prompt — you type the capital, hit enter, and earn a star.`
      : lang === 'fr'
      ? `La capitale de ${stateName} est <strong>${state.capital}</strong>. Cette page est le point d'entrée du quiz Capitales avec ${stateName} en première question — tapez la capitale, validez, gagnez une étoile.`
      : `La capital de ${stateName} es <strong>${state.capital}</strong>. Esta página es el lanzador del quiz Capitales con ${stateName} como primera pregunta — escriba la capital, envíe, gane una estrella.`;
    const isAlsoLargest = state.capital === state.largestCity;
    why = lang === 'en'
      ? `<h2>About ${state.capital}, capital of ${stateName}</h2><p>${state.capital} ${isAlsoLargest ? 'is both the capital and the largest city of ' + stateName + ' — one of only 17 US states with this property' : 'is the capital of ' + stateName + '. The largest city is ' + state.largestCity + ' (a common trick question)'}.</p><p>Capital city: <strong>${state.capital}</strong>. Population: ${extra && state.id === 'VT' ? '~7,500 — the smallest US state capital' : 'varies'}.</p>`
      : lang === 'fr'
      ? `<h2>${state.capital}, capitale de ${stateName}</h2><p>${state.capital} ${isAlsoLargest ? 'est à la fois la capitale et la plus grande ville de ' + stateName + ' — un cas rare, seuls 17 États américains sont dans ce cas' : 'est la capitale de ' + stateName + '. La plus grande ville est ' + state.largestCity + ' (piège courant)'}.</p>`
      : `<h2>${state.capital}, capital de ${stateName}</h2><p>${state.capital} ${isAlsoLargest ? 'es a la vez la capital y la ciudad más grande de ' + stateName + ' — un caso poco común, solo 17 estados de EE.UU. están así' : 'es la capital de ' + stateName + '. La ciudad más grande es ' + state.largestCity + ' (pregunta engañosa común)'}.</p>`;
  } else if (gameSlug === 'state-abbreviations') {
    intro = lang === 'en'
      ? `<strong>${state.id}</strong> is the official USPS 2-letter abbreviation for ${stateName}. This page launches the USPS Abbreviations quiz starting with ${state.id} — match the code to the state.`
      : lang === 'fr'
      ? `<strong>${state.id}</strong> est l'abréviation USPS officielle à 2 lettres pour ${stateName}. Cette page lance le quiz Abréviations USPS commençant par ${state.id} — associez le code à l'État.`
      : `<strong>${state.id}</strong> es la abreviatura USPS oficial de 2 letras para ${stateName}. Esta página lanza el quiz Abreviaturas USPS comenzando por ${state.id} — empareje el código con el estado.`;
    why = lang === 'en'
      ? `<h2>Why ${state.id}?</h2><p>The USPS standardized state abbreviations to 2 letters in 1963 to fit punched cards in early mail-sorting machines. The code <strong>${state.id}</strong> takes the first 1 or 2 distinctive letters of ${stateName}. ${state.id.startsWith('M') ? 'It is one of the famously confused 8 M-states (MA/MD/ME/MI/MN/MS/MO/MT).' : state.id.startsWith('N') ? 'It is one of the 8 N-states (NC/ND/NE/NH/NJ/NM/NV/NY).' : ''}</p>`
      : lang === 'fr'
      ? `<h2>Pourquoi ${state.id} ?</h2><p>L'USPS a standardisé les abréviations d'États à 2 lettres en 1963 pour les cartes perforées des premières machines de tri postal. Le code <strong>${state.id}</strong> reprend les 1-2 lettres distinctives de ${stateName}.</p>`
      : `<h2>¿Por qué ${state.id}?</h2><p>USPS estandarizó las abreviaturas de estados a 2 letras en 1963 para tarjetas perforadas de las primeras máquinas clasificadoras de correo. El código <strong>${state.id}</strong> toma las 1-2 letras distintivas de ${stateName}.</p>`;
  } else if (gameSlug === 'state-flags') {
    intro = lang === 'en'
      ? `This page launches the State Flags quiz with ${stateName} in the rotation. Each round shows a flag description — match it to the state.`
      : lang === 'fr'
      ? `Cette page lance le quiz Drapeaux d'États avec ${stateName} dans la rotation. À chaque manche on montre une description du drapeau — associez-la à l'État.`
      : `Esta página lanza el quiz Banderas de Estados con ${stateName} en la rotación. Cada ronda muestra una descripción de la bandera — empareje con el estado.`;
    why = lang === 'en'
      ? `<h2>The ${stateName} flag</h2><p>The ${stateName} state flag is a unique visual identifier. ${state.id === 'TX' ? 'The Lone Star flag — red, white, blue with a single white star — is the most recognizable of all US state flags.' : state.id === 'CA' ? "California's Bear Flag features a brown grizzly walking on green grass with a red star, with 'California Republic' below." : state.id === 'AZ' ? "Arizona's flag is unmistakable — a copper star with 13 red and yellow rays on the top half, blue below." : state.id === 'NM' ? "New Mexico's flag is a red Zia sun symbol on yellow — one of the most distinctive in the country." : state.id === 'HI' ? "Hawaii's flag is the only US state flag that includes the British Union Jack, a relic of the Kingdom of Hawaii's UK alliance." : state.id === 'MD' ? "Maryland's flag uses the heraldic pattern of the Calvert family — yellow and black quartered with red and white." : state.id === 'AK' ? "Alaska's flag was designed in 1927 by a 13-year-old orphan, Benny Benson — the Big Dipper and the North Star on dark blue." : "It typically features the state seal on a blue background, a common pattern shared by many US states ('Seal on Blue')."}</p>`
      : lang === 'fr'
      ? `<h2>Le drapeau de ${stateName}</h2><p>Le drapeau de ${stateName} a son identité visuelle propre. ${state.id === 'TX' ? "Le drapeau Lone Star — rouge, blanc, bleu avec une étoile blanche — est le plus reconnaissable des drapeaux d'États américains." : state.id === 'CA' ? "Le drapeau de la Californie présente un grizzly brun marchant sur de l'herbe verte avec une étoile rouge, et 'California Republic' en bas." : "Souvent, c'est le sceau d'État sur fond bleu, un motif partagé par de nombreux États américains."}</p>`
      : `<h2>La bandera de ${stateName}</h2><p>La bandera de ${stateName} tiene su identidad visual propia. ${state.id === 'TX' ? 'La bandera Lone Star — roja, blanca, azul con una sola estrella — es la más reconocible de todas las banderas de estados.' : state.id === 'CA' ? "La bandera de California presenta un grizzly marrón caminando sobre hierba verde con una estrella roja, y 'California Republic' abajo." : 'A menudo presenta el sello estatal sobre fondo azul, un patrón compartido por muchos estados.'}</p>`;
  } else if (gameSlug === 'state-nicknames') {
    const nick = extra.nickname || '(unknown)';
    intro = lang === 'en'
      ? `${stateName}'s nickname is <strong>"${nick}"</strong>. This page launches the State Nicknames quiz with ${stateName} in rotation — match the nickname to the state.`
      : lang === 'fr'
      ? `Le surnom de ${stateName} est <strong>« ${nick} »</strong>. Cette page lance le quiz Surnoms d'États avec ${stateName} dans la rotation — associez le surnom à l'État.`
      : `El apodo de ${stateName} es <strong>«${nick}»</strong>. Esta página lanza el quiz Apodos Estatales con ${stateName} en la rotación — empareje el apodo con el estado.`;
    why = lang === 'en'
      ? `<h2>Why "${nick}"?</h2><p>${nicknameOrigin(state.id, nick, 'en')}</p>`
      : lang === 'fr'
      ? `<h2>Pourquoi « ${nick} » ?</h2><p>${nicknameOrigin(state.id, nick, 'fr')}</p>`
      : `<h2>¿Por qué «${nick}»?</h2><p>${nicknameOrigin(state.id, nick, 'es')}</p>`;
  }

  // Quick facts panel
  const factsHtml = `
    <div class="lc-facts">
      <dl>
        <dt>${T.abbrLabel}</dt><dd>${state.id}</dd>
        <dt>${T.capitalLabel}</dt><dd>${state.capital}</dd>
        <dt>${T.biggestCityLabel}</dt><dd>${state.largestCity}</dd>
        <dt>${T.regionLabel}</dt><dd>${regionLabel}</dd>
        ${state.admitted ? `<dt>${T.admittedLabel}</dt><dd>${state.admitted}</dd>` : ''}
        ${extra.nickname ? `<dt>${T.nicknameLabel}</dt><dd>${extra.nickname}</dd>` : ''}
        ${extra.electoralVotes ? `<dt>${T.electLabel}</dt><dd>${extra.electoralVotes}</dd>` : ''}
        ${borderIds.length ? `<dt>${T.borderingLabel}</dt><dd>${borderNames}</dd>` : ''}
      </dl>
    </div>`;

  // Cross-links — sibling launchers (other games for this state) + state pages + related learn
  const siblings = Object.keys(GAMES).filter(g => g !== gameSlug).map(g => {
    const gameTitle = GAMES[g].titles[lang];
    return `<a href="${PATHS[lang]}${g}/state/${stateSlug}/">→ ${stateName} · ${gameTitle}</a>`;
  }).join('');

  const learnLink = lang === 'en' ? `/states/${stateSlug}/` : `/${lang}/states/${stateSlug}/`;
  const learnLinkEn = `/states/${stateSlug}/`;
  const learnFallback = fs.existsSync(path.join(ROOT, learnLink.replace(/^\//, ''), 'index.html')) ? learnLink : learnLinkEn;

  const otherContent = `
    <div class="lc-related">
      <a href="${learnFallback}">→ ${stateName} ${lang === 'en' ? 'state page' : lang === 'fr' ? 'page État' : 'página del estado'}</a>
      <a href="${HOME[lang]}learn/">→ ${lang === 'en' ? 'Learn the 50 US states' : lang === 'fr' ? 'Apprendre les 50 États' : 'Aprender los 50 estados'}</a>
      <a href="${PATHS[lang]}">→ ${T.backHub}</a>
    </div>`;

  // FAQ
  const faq = lang === 'en'
    ? `<details><summary><strong>What is ${stateName}'s ${game.seoKey.en}?</strong></summary><p>${gameSlug === 'place-the-state' ? 'It is in the ' + regionLabel + ' region of the US.' : gameSlug === 'state-capitals-typing' ? state.capital + '.' : gameSlug === 'state-abbreviations' ? state.id + '.' : gameSlug === 'state-flags' ? 'See the flag description above.' : extra.nickname || stateName}</p></details>
    <details><summary><strong>Is this game free?</strong></summary><p>Yes — 100% free, no signup, no ads. Just play.</p></details>
    <details><summary><strong>Can I play other ${stateName} quizzes?</strong></summary><p>Yes — see the sibling games above. ${stateName} appears in every Statedoku mini-game.</p></details>`
    : lang === 'fr'
    ? `<details><summary><strong>Quel est le ${game.seoKey.fr} de ${stateName} ?</strong></summary><p>${gameSlug === 'place-the-state' ? 'Il se trouve dans la région ' + regionLabel + ' des USA.' : gameSlug === 'state-capitals-typing' ? state.capital + '.' : gameSlug === 'state-abbreviations' ? state.id + '.' : gameSlug === 'state-flags' ? 'Voir la description du drapeau ci-dessus.' : extra.nickname || stateName}</p></details>
    <details><summary><strong>Le jeu est-il gratuit ?</strong></summary><p>Oui — 100% gratuit, sans inscription, sans pub.</p></details>
    <details><summary><strong>Puis-je jouer à d'autres quiz sur ${stateName} ?</strong></summary><p>Oui — voir les jeux frères ci-dessus.</p></details>`
    : `<details><summary><strong>¿Cuál es la ${game.seoKey.es} de ${stateName}?</strong></summary><p>${gameSlug === 'place-the-state' ? 'Está en la región ' + regionLabel + ' de EE.UU.' : gameSlug === 'state-capitals-typing' ? state.capital + '.' : gameSlug === 'state-abbreviations' ? state.id + '.' : gameSlug === 'state-flags' ? 'Vea la descripción de la bandera arriba.' : extra.nickname || stateName}</p></details>
    <details><summary><strong>¿Es gratis?</strong></summary><p>Sí — 100% gratis, sin registro, sin anuncios.</p></details>
    <details><summary><strong>¿Puedo jugar a otros quizzes sobre ${stateName}?</strong></summary><p>Sí — vea los juegos hermanos arriba.</p></details>`;

  return `
  <div class="lc-wrap">
    <div class="lc-card">
      <h3>${T.playNow}</h3>
      <p>${T.gameTopic[gameSlug]}</p>
      <a href="${playUrl}">${T.playNow} →</a>
    </div>

    <div class="lc-section">${intro}</div>
    <div class="ad-slot" data-ad-slot="PLACEHOLDER_LAUNCHER_MID" data-ad-format="auto"></div>

    <div class="lc-section">${why}</div>

    <div class="lc-section">
      <h2>${T.quickFacts}</h2>
      ${factsHtml}
    </div>

    <div class="lc-section">
      <h2>${T.otherStateGames}</h2>
      <div class="lc-related">
        ${siblings}
      </div>
    </div>

    <div class="lc-section">
      <h2>${T.otherStateContent}</h2>
      ${otherContent}
    </div>

    <div class="lc-section">
      <h2>${T.faqHead}</h2>
      ${faq}
    </div>

    <div class="ad-slot ad-slot-inline" data-ad-slot="PLACEHOLDER_LAUNCHER_BOTTOM" data-ad-format="auto" style="max-width:760px"></div>
  </div>`;
}

function nicknameOrigin(id, nick, lang) {
  // A short explanation per nickname. Use a small dictionary for the most distinct ones, fallback for others.
  const D = {
    TX: { en: 'From the lone star on its flag — symbol of Texas\' brief independence as a republic (1836-1845).', fr: 'Vient de l\'étoile unique du drapeau — symbole de la brève indépendance du Texas comme république (1836-1845).', es: 'De la estrella solitaria de su bandera — símbolo de la breve independencia de Texas como república (1836-1845).' },
    CA: { en: 'From the 1849 Gold Rush + the golden hills in the summer light.', fr: 'De la ruée vers l\'or de 1849 + collines dorées sous la lumière estivale.', es: 'De la fiebre del oro de 1849 + colinas doradas a la luz de verano.' },
    FL: { en: 'For its year-round sunny climate.', fr: 'Pour son climat ensoleillé toute l\'année.', es: 'Por su clima soleado todo el año.' },
    AK: { en: 'The last great American wilderness frontier.', fr: 'La dernière grande frontière sauvage américaine.', es: 'La última gran frontera salvaje americana.' },
    HI: { en: 'For the Hawaiian greeting "Aloha" — used both to say hello and goodbye, and meaning love.', fr: 'Pour le salut hawaïen « Aloha » — qui sert à dire bonjour, au revoir et qui signifie amour.', es: 'Por el saludo hawaiano "Aloha" — usado para hola, adiós y que significa amor.' },
    NY: { en: 'Attributed to George Washington who predicted New York would be the seat of an empire.', fr: 'Attribué à George Washington qui prédisait que New York serait le siège d\'un empire.', es: 'Atribuido a George Washington, que predijo que Nueva York sería sede de un imperio.' },
  };
  if (D[id]) return D[id][lang];
  return lang === 'en'
    ? `"${nick}" was adopted as the official nickname based on a defining feature of the state — its geography, its history, or a notable plant/animal/symbol.`
    : lang === 'fr'
    ? `« ${nick} » a été adopté comme surnom officiel à partir d'un trait distinctif de l'État — géographie, histoire, ou animal/symbole notable.`
    : `«${nick}» fue adoptado como apodo oficial basado en un rasgo distintivo del estado — geografía, historia o un animal/símbolo notable.`;
}

// ─── Page wrapper ─────────────────────────────────────────────────────────
function pageHTML(lang, gameSlug, state) {
  const stateName = STATE_NAMES[lang][state.id];
  const stateSlug = SLUGS[state.id];
  const game = GAMES[gameSlug];
  const title = `${stateName} — ${game.titles[lang]} | Statedoku`;
  const desc = lang === 'en'
    ? `${stateName} ${game.seoKey.en}: launch the Statedoku quiz with ${stateName} as the first prompt. Free, no signup, mobile-friendly. Try it.`
    : lang === 'fr'
    ? `${stateName} ${game.seoKey.fr} : lance le quiz Statedoku avec ${stateName} en première question. Gratuit, sans inscription, mobile.`
    : `${stateName} ${game.seoKey.es}: lanza el quiz Statedoku con ${stateName} como primera pregunta. Gratis, sin registro, móvil.`;
  const kw = lang === 'en'
    ? `${stateName.toLowerCase()} ${game.seoKey.en} quiz, ${stateName.toLowerCase()} ${gameSlug}, ${stateName.toLowerCase()} on map, ${stateName.toLowerCase()} state quiz`
    : lang === 'fr'
    ? `${stateName.toLowerCase()} ${game.seoKey.fr} quiz, jeu ${stateName.toLowerCase()}`
    : `${stateName.toLowerCase()} ${game.seoKey.es} quiz, juego ${stateName.toLowerCase()}`;
  const h1 = `${stateName} · ${game.titles[lang]}`;
  const sub = lang === 'en'
    ? `Launch the ${game.titles[lang]} mini-game with ${stateName} as the first prompt. Quick facts and links below.`
    : lang === 'fr'
    ? `Lance le mini-jeu ${game.titles[lang]} avec ${stateName} en première question. Infos et liens utiles ci-dessous.`
    : `Lanza el mini-juego ${game.titles[lang]} con ${stateName} como primera pregunta. Datos y enlaces abajo.`;
  const bcStateGame = lang === 'en' ? `${stateName} ${game.titles[lang]}` : `${stateName} ${game.titles[lang]}`;
  const breadcrumb = lang === 'en'
    ? `[{"@type":"ListItem","position":1,"name":"Home","item":"https://statedoku.com/"},{"@type":"ListItem","position":2,"name":"Play & Learn","item":"https://statedoku.com/play/"},{"@type":"ListItem","position":3,"name":"${game.titles.en.replace(/"/g,'\\"')}","item":"https://statedoku.com/play/${gameSlug}/"},{"@type":"ListItem","position":4,"name":"${bcStateGame.replace(/"/g,'\\"')}","item":"https://statedoku.com/play/${gameSlug}/state/${stateSlug}/"}]`
    : lang === 'fr'
    ? `[{"@type":"ListItem","position":1,"name":"Accueil","item":"https://statedoku.com/fr/"},{"@type":"ListItem","position":2,"name":"Jouer & Apprendre","item":"https://statedoku.com/fr/play/"},{"@type":"ListItem","position":3,"name":"${game.titles.fr.replace(/"/g,'\\"')}","item":"https://statedoku.com/fr/play/${gameSlug}/"},{"@type":"ListItem","position":4,"name":"${bcStateGame.replace(/"/g,'\\"')}","item":"https://statedoku.com/fr/play/${gameSlug}/state/${stateSlug}/"}]`
    : `[{"@type":"ListItem","position":1,"name":"Inicio","item":"https://statedoku.com/es/"},{"@type":"ListItem","position":2,"name":"Jugar y Aprender","item":"https://statedoku.com/es/play/"},{"@type":"ListItem","position":3,"name":"${game.titles.es.replace(/"/g,'\\"')}","item":"https://statedoku.com/es/play/${gameSlug}/"},{"@type":"ListItem","position":4,"name":"${bcStateGame.replace(/"/g,'\\"')}","item":"https://statedoku.com/es/play/${gameSlug}/state/${stateSlug}/"}]`;

  const gameSchema = JSON.stringify({
    '@context': 'https://schema.org', '@type': 'Game',
    name: `${stateName} · ${game.titles[lang]}`,
    description: desc, url: `https://statedoku.com${PATHS[lang]}${gameSlug}/state/${stateSlug}/`,
    genre: 'Geography Quiz', gamePlatform: 'Web Browser', inLanguage: lang, isAccessibleForFree: true,
    publisher: { '@type': 'Organization', name: 'Statedoku' },
  });

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
${hreflang(gameSlug, stateSlug)}
  <link rel="icon" type="image/svg+xml" href="/favicon.svg?v=5">
  <link rel="stylesheet" href="/css/style.css?v=19">
  <meta property="og:type" content="website">
  <meta property="og:title" content="${h1}">
  <meta property="og:description" content="${desc.slice(0,160)}">
  <meta property="og:url" content="https://statedoku.com${PATHS[lang]}${gameSlug}/state/${stateSlug}/">
  <meta property="og:image" content="https://statedoku.com/og/og-learn-state-capitals.png">
  <meta property="og:locale" content="${LOCALE_TAG[lang]}">
  <meta name="twitter:card" content="summary_large_image">
  <meta name="twitter:title" content="${h1}">
  <meta name="twitter:description" content="${desc.slice(0,160)}">
  <meta name="twitter:image" content="https://statedoku.com/og/og-learn-state-capitals.png">
  <style>${SHARED_CSS}</style>
</head>
<body class="legal-body">
<header>
  <a href="${HOME[lang]}" class="logo">State<em>doku</em> <span class="logo-flag">🇺🇸</span></a>
  <nav class="nav-actions"><a href="${PATHS[lang]}${gameSlug}/" style="color:var(--text-2);text-decoration:none;font-weight:700;font-size:.88rem">← ${game.titles[lang]}</a></nav>
</header>
<script type="application/ld+json">
{"@context":"https://schema.org","@type":"BreadcrumbList","itemListElement":${breadcrumb}}
</script>
<script type="application/ld+json">${gameSchema}</script>
<main>
  <section class="hub-hero">
    <span class="hub-chip">${game.chip}</span>
    <h1>${h1}</h1>
    <p class="sub">${sub}</p>
  </section>
${bodyForLauncher(lang, gameSlug, state)}
</main>
${FOOTERS[lang]}
<script src="/config.js"></script>
<script src="/js/admin.js"></script>
<script src="/js/ads.js?v=1"></script>
</body>
</html>`;
}

// ─── WRITE ────────────────────────────────────────────────────────────────
const out = [];
const LANGS = ['en', 'fr', 'es'];
const GAME_SLUGS = Object.keys(GAMES);

for (const gameSlug of GAME_SLUGS) {
  for (const state of STATES) {
    const stateSlug = SLUGS[state.id];
    for (const lang of LANGS) {
      const dirRel = lang === 'en'
        ? `play/${gameSlug}/state/${stateSlug}`
        : `${lang}/play/${gameSlug}/state/${stateSlug}`;
      const file = path.join(ROOT, dirRel, 'index.html');
      fs.mkdirSync(path.dirname(file), { recursive: true });
      fs.writeFileSync(file, pageHTML(lang, gameSlug, state));
      out.push(dirRel);
    }
  }
}

console.log(`✅ ${out.length} per-state launcher pages written (${GAME_SLUGS.length} games × ${STATES.length} states × ${LANGS.length} langs)`);

// Persist slug list for sitemap injection step
fs.writeFileSync(path.join(__dirname, 'launcher-paths.json'), JSON.stringify({
  games: GAME_SLUGS,
  states: STATES.map(s => SLUGS[s.id]),
  langs: LANGS,
  total: out.length,
  paths: out,
}, null, 2));
console.log('📝 launcher-paths.json written for sitemap step.');
