#!/usr/bin/env node
/**
 * Wave 1: Build /play/ multigame hub.
 *
 *   3 hub pages    (EN/FR/ES)
 *   2 full games × 3 langs = 6 playable pages (Place-the-State, USPS abbreviations)
 *  19 stub pages × 3 langs = 57 coming-soon pages (proper SEO + JSON-LD)
 *  = 66 new pages.
 */
const fs = require('fs');
const path = require('path');
const ROOT = path.resolve(__dirname, '..');

// ─── 21-game registry ─────────────────────────────────────────────────────
const GAMES = [
  // Wave 1 playable
  { slug:'place-the-state',     playable:true, group:'interactive',
    titles:{en:'Place the State',       fr:'Placer l’État',          es:'Coloca el Estado'},
    desc:{
      en:'Click the right state on the US map when prompted. 10 rounds, 3 lives. Free quiz.',
      fr:'Clique sur l’État américain quand on te le demande. 10 manches, 3 vies. Quiz gratuit.',
      es:'Haz clic en el estado correcto del mapa EE.UU. cuando te lo pidan. 10 rondas, 3 vidas.',
    },
    kw:{
      en:'us states map quiz, place the states, click the state, us states game',
      fr:'quiz carte etats unis, placer les etats americains, jeu carte usa',
      es:'mapa estados unidos quiz, juego coloca los estados, juego mapa eeuu',
    },
    chip:'📍 MAP CHALLENGE'},
  { slug:'state-abbreviations',  playable:true, group:'classic',
    titles:{en:'USPS Abbreviations Quiz',  fr:'Quiz Abréviations USPS',     es:'Quiz Abreviaturas USPS'},
    desc:{
      en:'Match the 2-letter postal code to its US state. 20 rounds, multiple choice + typing modes.',
      fr:'Trouve l’abréviation USPS à 2 lettres pour chaque État. 20 manches, QCM + saisie.',
      es:'Empareja el código postal de 2 letras con su estado. 20 rondas, opción múltiple + escritura.',
    },
    kw:{
      en:'state abbreviations quiz, usps state codes quiz, 50 state abbreviations',
      fr:'quiz abreviations etats americains, codes postaux usa quiz',
      es:'quiz abreviaturas estados unidos, codigos usps quiz',
    },
    chip:'✉️ USPS CODES'},

  // Wave 2-4 stubs (interactives)
  { slug:'state-capitals-match', playable:false, group:'classic',
    titles:{en:'State Capitals Match',     fr:'Mémo Capitales d’États', es:'Empareja Estados y Capitales'},
    desc:{en:'Match 10 US states with their capitals.',fr:'Associe les 10 États avec leurs capitales.',es:'Empareja los 10 estados con sus capitales.'},
    kw:{en:'state capitals quiz, match states and capitals',fr:'quiz capitales etats americains',es:'quiz capitales estados unidos'},
    chip:'🏛️ CAPITALS'},
  { slug:'state-silhouettes', playable:false, group:'interactive',
    titles:{en:'State Silhouettes',         fr:'Silhouettes d’États',    es:'Siluetas de Estados'},
    desc:{en:'Guess the US state from its outline alone.',fr:'Devine l’État à partir de sa silhouette.',es:'Adivina el estado por su silueta.'},
    kw:{en:'guess the state by shape, state silhouette quiz',fr:'devine etat americain forme',es:'adivina estado por silueta'},
    chip:'🔳 SILHOUETTES'},
  { slug:'states-connections', playable:false, group:'interactive',
    titles:{en:'States Connections',        fr:'Connexions d’États',       es:'Conexiones de Estados'},
    desc:{en:'NYT-Connections style: group 16 states into 4 hidden categories.',fr:'Style Connections NYT : regroupe 16 États en 4 catégories cachées.',es:'Estilo Connections NYT: agrupa 16 estados en 4 categorías ocultas.'},
    kw:{en:'states connections, nyt connections states',fr:'connections nyt etats unis',es:'connections estados unidos'},
    chip:'🎯 CONNECTIONS'},

  // Classic quizzes
  { slug:'state-capitals-typing', playable:false, group:'classic',
    titles:{en:'State Capitals Quiz',       fr:'Quiz Capitales',           es:'Quiz Capitales'},
    desc:{en:'Type the capital of each US state. 50 rounds.',fr:'Tape la capitale de chaque État. 50 manches.',es:'Escribe la capital de cada estado. 50 rondas.'},
    kw:{en:'us state capitals quiz, 50 state capitals',fr:'quiz 50 capitales etats unis',es:'quiz 50 capitales estados unidos'},
    chip:'🏛️ TYPE CAPITALS'},
  { slug:'biggest-cities', playable:false, group:'classic',
    titles:{en:'Biggest City Quiz',         fr:'Quiz Plus Grande Ville',   es:'Quiz Ciudad más Grande'},
    desc:{en:'Identify the biggest city of each US state.',fr:'Identifie la plus grande ville de chaque État.',es:'Identifica la ciudad más grande de cada estado.'},
    kw:{en:'biggest city per state quiz',fr:'quiz plus grande ville etat americain',es:'quiz ciudad mas grande estado'},
    chip:'🏙️ BIG CITIES'},
  { slug:'state-flags', playable:false, group:'classic',
    titles:{en:'State Flags Quiz',          fr:'Quiz Drapeaux d’États',  es:'Quiz Banderas de Estados'},
    desc:{en:'Identify the state from its flag.',fr:'Identifie l’État à partir de son drapeau.',es:'Identifica el estado por su bandera.'},
    kw:{en:'state flags quiz, us state flag identification',fr:'quiz drapeaux etats americains',es:'quiz banderas estados eeuu'},
    chip:'🏳️ FLAGS'},

  // History quizzes
  { slug:'thirteen-colonies', playable:false, group:'history',
    titles:{en:'13 Original Colonies',      fr:'13 Colonies originelles',  es:'13 Colonias originales'},
    desc:{en:'Identify the 13 original American colonies among the 50 states.',fr:'Identifie les 13 colonies originelles parmi les 50 États.',es:'Identifica las 13 colonias originales entre los 50 estados.'},
    kw:{en:'13 original colonies quiz',fr:'quiz 13 colonies originelles',es:'quiz 13 colonias originales'},
    chip:'🌲 13 COLONIES'},
  { slug:'state-admission-order', playable:false, group:'history',
    titles:{en:'State Admission Order',     fr:'Ordre d’admission à l’Union', es:'Orden de admisión a la Unión'},
    desc:{en:'Order the states by year of admission to the Union.',fr:'Classe les États par année d’admission à l’Union.',es:'Ordena los estados por año de admisión a la Unión.'},
    kw:{en:'state admission order quiz, statehood year quiz',fr:'ordre admission etats union americaine',es:'orden admision estados union'},
    chip:'⏳ STATEHOOD'},
  { slug:'confederate-states', playable:false, group:'history',
    titles:{en:'Confederate States Quiz',   fr:'Quiz États Confédérés',  es:'Quiz Estados Confederados'},
    desc:{en:'Identify the 11 Confederate states of the US Civil War.',fr:'Identifie les 11 États confédérés de la guerre civile.',es:'Identifica los 11 estados confederados.'},
    kw:{en:'confederate states quiz',fr:'quiz etats confederation americaine',es:'quiz estados confederacion'},
    chip:'⚔️ CONFEDERATION'},
  { slug:'president-birth-states', playable:false, group:'history',
    titles:{en:'Presidents by State',       fr:'Présidents par État natal', es:'Presidentes por Estado natal'},
    desc:{en:'Match US presidents to their state of birth.',fr:'Associe chaque président américain à son État natal.',es:'Asocia cada presidente con su estado natal.'},
    kw:{en:'us presidents birth state quiz',fr:'quiz presidents americains etat natal',es:'quiz presidentes estados unidos estado natal'},
    chip:'🏛️ PRESIDENTS'},

  // Symbol quizzes
  { slug:'state-nicknames', playable:false, group:'symbols',
    titles:{en:'State Nicknames Quiz',      fr:'Quiz Surnoms d’États',    es:'Quiz Apodos Estatales'},
    desc:{en:'Match nicknames like "Lone Star State" to their US state.',fr:'Associe les surnoms ("Lone Star State"...) aux États.',es:'Asocia apodos ("Lone Star State"...) a sus estados.'},
    kw:{en:'state nicknames quiz, lone star state golden state quiz',fr:'quiz surnoms etats americains',es:'quiz apodos estados unidos'},
    chip:'✨ NICKNAMES'},
  { slug:'state-mottos', playable:false, group:'symbols',
    titles:{en:'State Mottos Quiz',         fr:'Quiz Devises d’États',    es:'Quiz Lemas Estatales'},
    desc:{en:'Match each state to its official motto.',fr:'Associe chaque État à sa devise officielle.',es:'Asocia cada estado con su lema oficial.'},
    kw:{en:'state mottos quiz',fr:'quiz devises etats americains',es:'quiz lemas estados unidos'},
    chip:'📜 MOTTOS'},
  { slug:'state-symbols', playable:false, group:'symbols',
    titles:{en:'State Symbols Quiz',        fr:'Quiz Symboles d’États',   es:'Quiz Símbolos Estatales'},
    desc:{en:'Match state birds, flowers, and trees to their US state.',fr:'Associe oiseaux, fleurs et arbres officiels à leur État.',es:'Asocia aves, flores y árboles oficiales a su estado.'},
    kw:{en:'state birds flowers trees quiz',fr:'quiz oiseaux fleurs arbres etats',es:'quiz aves flores arboles estados'},
    chip:'🌼 SYMBOLS'},

  // Advanced geography
  { slug:'time-zones', playable:false, group:'geography',
    titles:{en:'Time Zones Quiz',           fr:'Quiz Fuseaux Horaires',    es:'Quiz Zonas Horarias'},
    desc:{en:'Identify the time zone of each US state.',fr:'Identifie le fuseau horaire de chaque État.',es:'Identifica la zona horaria de cada estado.'},
    kw:{en:'us time zones quiz',fr:'quiz fuseaux horaires etats unis',es:'quiz zonas horarias estados unidos'},
    chip:'⏰ TIME ZONES'},
  { slug:'border-states', playable:false, group:'geography',
    titles:{en:'Border States Quiz',        fr:'Quiz États Frontaliers',  es:'Quiz Estados Fronterizos'},
    desc:{en:'Identify states bordering Canada and Mexico.',fr:'Identifie les États frontaliers du Canada et du Mexique.',es:'Identifica los estados fronterizos con Canadá y México.'},
    kw:{en:'states bordering canada mexico quiz',fr:'quiz etats frontaliers canada mexique',es:'quiz estados fronterizos canada mexico'},
    chip:'🌎 BORDERS'},
  { slug:'rivers-mountains', playable:false, group:'geography',
    titles:{en:'Rivers & Mountains',        fr:'Fleuves et Montagnes',     es:'Ríos y Montañas'},
    desc:{en:'Match US rivers and mountain ranges to their states.',fr:'Associe fleuves et chaînes de montagnes aux États.',es:'Asocia ríos y cordilleras a los estados.'},
    kw:{en:'us rivers mountains quiz',fr:'quiz fleuves montagnes etats unis',es:'quiz rios montanas estados unidos'},
    chip:'⛰️ GEO ADV'},

  // Politics
  { slug:'electoral-college', playable:false, group:'politics',
    titles:{en:'Electoral College Quiz',    fr:'Quiz Collège Électoral', es:'Quiz Colegio Electoral'},
    desc:{en:'Test how many electoral votes each state has.',fr:'Teste combien de grands électeurs chaque État possède.',es:'Pon a prueba cuántos votos electorales tiene cada estado.'},
    kw:{en:'electoral college quiz, votes per state quiz',fr:'quiz college electoral americain',es:'quiz colegio electoral eeuu'},
    chip:'🗳️ ELECTORAL'},
  { slug:'swing-states', playable:false, group:'politics',
    titles:{en:'Swing States Quiz',         fr:'Quiz États Bisagra',    es:'Quiz Estados Bisagra'},
    desc:{en:'Identify the 7 swing states of 2024.',fr:'Identifie les 7 États-pivots de 2024.',es:'Identifica los 7 estados bisagra de 2024.'},
    kw:{en:'swing states quiz, 2024 swing states',fr:'quiz etats pivots 2024',es:'quiz estados bisagra 2024'},
    chip:'⚖️ SWING'},
  { slug:'no-income-tax-states', playable:false, group:'politics',
    titles:{en:'No Income Tax Quiz',        fr:'Quiz Sans Impôt sur le Revenu', es:'Quiz Sin Impuesto sobre la Renta'},
    desc:{en:'Find the 9 US states with no state income tax.',fr:'Trouve les 9 États sans impôt sur le revenu.',es:'Encuentra los 9 estados sin impuesto sobre la renta.'},
    kw:{en:'no income tax states quiz',fr:'quiz etats sans impot revenu',es:'quiz estados sin impuesto renta'},
    chip:'💰 NO TAX'},
];

// ─── Shared helpers ───────────────────────────────────────────────────────
const PATHS = { en:'/play/', fr:'/fr/play/', es:'/es/play/' };
const HOME  = { en:'/',      fr:'/fr/',      es:'/es/' };
const NAV   = { en:'Play & Learn', fr:'Jouer & Apprendre', es:'Jugar y Aprender' };
const BACK_HUB = { en:'← All games', fr:'← Tous les jeux', es:'← Todos los juegos' };

const GA = `
  <!-- Google tag (gtag.js) -->
  <script async src="https://www.googletagmanager.com/gtag/js?id=G-P7ZBQNYLS4"></script>
  <script>
    window.dataLayer = window.dataLayer || [];
    function gtag(){dataLayer.push(arguments);}
    gtag('js', new Date());
    gtag('config', 'G-P7ZBQNYLS4');
  </script>`;

const FOOTER = {
  en:`<footer><p>Statedoku &copy; 2026 &nbsp;·&nbsp; <a href="/play/">Play & Learn</a> &nbsp;·&nbsp; <a href="/learn/">Learn</a> &nbsp;·&nbsp; <a href="/states/">States</a> &nbsp;·&nbsp; <a href="/faq/">FAQ</a></p></footer>`,
  fr:`<footer><p>Statedoku &copy; 2026 &nbsp;·&nbsp; <a href="/fr/play/">Jouer & Apprendre</a> &nbsp;·&nbsp; <a href="/fr/learn/">Apprendre</a> &nbsp;·&nbsp; <a href="/fr/faq/">FAQ</a></p></footer>`,
  es:`<footer><p>Statedoku &copy; 2026 &nbsp;·&nbsp; <a href="/es/play/">Jugar y Aprender</a> &nbsp;·&nbsp; <a href="/es/learn/">Aprender</a> &nbsp;·&nbsp; <a href="/es/faq/">FAQ</a></p></footer>`,
};

function hreflang(slug) {
  const ext = slug ? slug + '/' : '';
  return `
  <link rel="canonical" href="https://statedoku.com/play/${ext}">
  <link rel="alternate" hreflang="en" href="https://statedoku.com/play/${ext}">
  <link rel="alternate" hreflang="en-US" href="https://statedoku.com/play/${ext}">
  <link rel="alternate" hreflang="en-GB" href="https://statedoku.com/play/${ext}">
  <link rel="alternate" hreflang="fr" href="https://statedoku.com/fr/play/${ext}">
  <link rel="alternate" hreflang="fr-FR" href="https://statedoku.com/fr/play/${ext}">
  <link rel="alternate" hreflang="es" href="https://statedoku.com/es/play/${ext}">
  <link rel="alternate" hreflang="es-ES" href="https://statedoku.com/es/play/${ext}">
  <link rel="alternate" hreflang="es-MX" href="https://statedoku.com/es/play/${ext}">
  <link rel="alternate" hreflang="x-default" href="https://statedoku.com/play/${ext}">`;
}

function hreflangPerLang(lang, slug) {
  return hreflang(slug); // identical canonical map for any lang
}

const SHARED_STYLES = `
    .hub-hero{max-width:880px;margin:24px auto 14px;padding:0 18px;text-align:center}
    .hub-hero h1{font-size:clamp(2rem,5.5vw,2.8rem);font-weight:900;letter-spacing:-.025em;margin:0 0 10px;line-height:1.12}
    .hub-hero .sub{color:var(--text-2);font-size:1rem;line-height:1.55;max-width:640px;margin:0 auto}
    .hub-chip{display:inline-block;padding:4px 10px;border-radius:999px;background:var(--gold);color:var(--navy);font-weight:800;font-size:.78rem;letter-spacing:.06em;text-transform:uppercase;margin-bottom:12px}
    .hub-stats{display:flex;gap:18px;justify-content:center;margin:14px 0 18px;flex-wrap:wrap;font-size:.85rem;color:var(--text-2)}
    .hub-stats b{color:var(--navy)}
    .hub-section{max-width:880px;margin:24px auto;padding:0 18px}
    .hub-section h2{font-size:1.2rem;font-weight:800;letter-spacing:-.015em;margin:24px 0 12px;color:var(--navy)}
    .game-grid{display:grid;grid-template-columns:repeat(auto-fill,minmax(240px,1fr));gap:12px;margin:8px 0 18px}
    .game-card{display:block;text-decoration:none;color:inherit;background:#fff;border:1px solid var(--border);border-left:4px solid var(--region-color,#0F2147);border-radius:12px;padding:14px 16px;transition:transform 120ms,box-shadow 120ms,border-color 120ms;position:relative}
    .game-card:hover{transform:translateY(-2px);box-shadow:0 6px 18px rgba(15,33,71,0.08);border-color:var(--region-color,#0F2147)}
    .game-card[data-group="interactive"]{--region-color:#1E40AF}
    .game-card[data-group="classic"]{--region-color:#B45309}
    .game-card[data-group="history"]{--region-color:#B91C1C}
    .game-card[data-group="symbols"]{--region-color:#047857}
    .game-card[data-group="geography"]{--region-color:#0E7490}
    .game-card[data-group="politics"]{--region-color:#7C3AED}
    .gc-chip{display:inline-block;font-size:.7rem;font-weight:800;letter-spacing:.04em;color:var(--region-color);background:rgba(15,33,71,.04);padding:3px 7px;border-radius:4px;margin-bottom:6px}
    .gc-title{font-weight:800;font-size:1.02rem;color:var(--text);margin-bottom:4px;line-height:1.22}
    .gc-desc{font-size:.84rem;color:var(--text-2);line-height:1.45}
    .gc-tag{position:absolute;top:14px;right:14px;font-size:.65rem;font-weight:800;letter-spacing:.05em;padding:2px 8px;border-radius:999px}
    .gc-tag.live{background:#16A34A;color:#fff}
    .gc-tag.soon{background:#94A3B8;color:#fff}
    .game-frame{max-width:880px;margin:0 auto;padding:18px;line-height:1.55;color:var(--text)}
    .game-frame h2{margin-top:28px;margin-bottom:10px;font-size:1.2rem;font-weight:800;letter-spacing:-.01em}
    .game-frame p{margin-bottom:10px}
    .game-frame details{margin:8px 0;padding:10px 14px;background:#F8FAFC;border-radius:8px}
    .game-frame summary{font-weight:700;color:var(--navy);cursor:pointer}
    .stars{font-size:1.4rem;letter-spacing:6px;color:#F59E0B}
    .stars .off{color:#E5E7EB}`;

// ─── Hub page generator ──────────────────────────────────────────────────
function gameCard(lang, g) {
  const href = (PATHS[lang] || '/play/') + g.slug + '/';
  return `      <a class="game-card" data-group="${g.group}" href="${href}">
        <span class="gc-tag ${g.playable?'live':'soon'}">${g.playable ? (lang==='fr'?'JOUER':lang==='es'?'JUGAR':'PLAY') : (lang==='fr'?'BIENTÔT':lang==='es'?'PRONTO':'SOON')}</span>
        <span class="gc-chip">${g.chip}</span>
        <div class="gc-title">${g.titles[lang]}</div>
        <div class="gc-desc">${g.desc[lang]}</div>
      </a>`;
}

function hubPage(lang) {
  const TITLE = {
    en:'Play & Learn the 50 US States — 21 Daily Geography Games | Statedoku',
    fr:'Jouer & Apprendre les 50 États américains — 21 jeux quotidiens | Statedoku',
    es:'Juega y Aprende los 50 Estados de EE.UU. — 21 juegos diarios | Statedoku',
  };
  const DESC = {
    en:'21 daily free games to learn all 50 US states — placement on map, capitals, abbreviations, flags, history, electoral college, time zones, and more. EN/FR/ES.',
    fr:'21 jeux quotidiens gratuits pour apprendre les 50 États américains: placer sur carte, capitales, abréviations, drapeaux, histoire, collège électoral, fuseaux horaires...',
    es:'21 juegos diarios gratuitos para aprender los 50 estados de EE.UU.: colocar en mapa, capitales, abreviaturas, banderas, historia, colegio electoral, zonas horarias...',
  };
  const H1 = {
    en:'Play & Learn the 50 US States',
    fr:'Jouer & Apprendre les 50 États américains',
    es:'Juega y Aprende los 50 Estados de EE.UU.',
  };
  const SUB = {
    en:'21 free daily games to master US geography: placement, capitals, flags, history, electoral college, time zones and more. New puzzles every day. EN/FR/ES.',
    fr:'21 jeux gratuits quotidiens pour maîtriser la géographie américaine: placement, capitales, drapeaux, histoire, collège électoral. Nouveaux puzzles chaque jour.',
    es:'21 juegos gratis diarios para dominar la geografía de EE.UU.: ubicación, capitales, banderas, historia, colegio electoral. Nuevos puzzles cada día.',
  };
  const CHIP_TXT = {
    en:'🎮 21 GAMES · 50 STATES · 3 LANGUAGES',
    fr:'🎮 21 JEUX · 50 ÉTATS · 3 LANGUES',
    es:'🎮 21 JUEGOS · 50 ESTADOS · 3 IDIOMAS',
  };
  const SECTIONS = {
    en:[['interactive','Interactive map games'],['classic','Classic quizzes'],['history','History quizzes'],['symbols','State symbols'],['geography','Advanced geography'],['politics','Politics']],
    fr:[['interactive','Jeux interactifs sur carte'],['classic','Quiz classiques'],['history','Quiz histoire'],['symbols','Symboles d’États'],['geography','Géographie avancée'],['politics','Politique']],
    es:[['interactive','Juegos interactivos en mapa'],['classic','Quizzes clásicos'],['history','Quizzes de historia'],['symbols','Símbolos estatales'],['geography','Geografía avanzada'],['politics','Política']],
  };
  const STATS_LABEL = {
    en:'<b>21</b> games <span>·</span> <b>50</b> states <span>·</span> <b>3</b> languages <span>·</span> <b>New</b> every day',
    fr:'<b>21</b> jeux <span>·</span> <b>50</b> États <span>·</span> <b>3</b> langues <span>·</span> <b>Nouveau</b> chaque jour',
    es:'<b>21</b> juegos <span>·</span> <b>50</b> estados <span>·</span> <b>3</b> idiomas <span>·</span> <b>Nuevo</b> cada día',
  };

  const breadcrumb = lang === 'en'
    ? `[{"@type":"ListItem","position":1,"name":"Home","item":"https://statedoku.com/"},{"@type":"ListItem","position":2,"name":"Play & Learn","item":"https://statedoku.com/play/"}]`
    : lang === 'fr'
    ? `[{"@type":"ListItem","position":1,"name":"Accueil","item":"https://statedoku.com/fr/"},{"@type":"ListItem","position":2,"name":"Jouer & Apprendre","item":"https://statedoku.com/fr/play/"}]`
    : `[{"@type":"ListItem","position":1,"name":"Inicio","item":"https://statedoku.com/es/"},{"@type":"ListItem","position":2,"name":"Jugar y Aprender","item":"https://statedoku.com/es/play/"}]`;

  // ItemList schema for hub
  const itemList = JSON.stringify({
    '@context':'https://schema.org','@type':'ItemList',
    'name': H1[lang],
    'numberOfItems': GAMES.length,
    'itemListElement': GAMES.map((g, i) => ({
      '@type':'ListItem','position':i+1,
      'name': g.titles[lang],
      'url': `https://statedoku.com${PATHS[lang]}${g.slug}/`,
    })),
  });

  const sectionsHtml = SECTIONS[lang].map(([grp, title]) => {
    const cards = GAMES.filter(g => g.group === grp).map(g => gameCard(lang, g)).join('\n');
    return `    <section class="hub-section">
      <h2>${title}</h2>
      <div class="game-grid">
${cards}
      </div>
    </section>`;
  }).join('\n');

  return `<!DOCTYPE html>
<html lang="${lang}">
<head>${GA}
  <meta charset="UTF-8">
  <meta name="viewport" content="width=device-width,initial-scale=1.0">
  <meta name="theme-color" content="#0F2147">
  <title>${TITLE[lang]}</title>
  <meta name="description" content="${DESC[lang]}">
  <meta name="keywords" content="${lang==='en'?'us states games, learn 50 states, state capitals quiz, place the states':lang==='fr'?'jeux etats americains, apprendre 50 etats, quiz geographie usa':'juegos estados unidos, aprender 50 estados, quiz geografia eeuu'}">
  <meta name="robots" content="index, follow, max-image-preview:large">
${hreflang('')}
  <link rel="icon" type="image/svg+xml" href="/favicon.svg?v=5">
  <link rel="stylesheet" href="/css/style.css?v=18">
  <meta property="og:type" content="website">
  <meta property="og:title" content="${H1[lang]}">
  <meta property="og:description" content="${DESC[lang].slice(0,160)}">
  <meta property="og:url" content="https://statedoku.com${PATHS[lang]}">
  <meta property="og:image" content="https://statedoku.com/og/og-learn-state-capitals.png">
  <meta property="og:locale" content="${lang==='en'?'en_US':lang==='fr'?'fr_FR':'es_ES'}">
  <meta name="twitter:card" content="summary_large_image">
  <meta name="twitter:title" content="${H1[lang]}">
  <meta name="twitter:description" content="${DESC[lang].slice(0,160)}">
  <meta name="twitter:image" content="https://statedoku.com/og/og-learn-state-capitals.png">
  <style>${SHARED_STYLES}</style>
</head>
<body class="legal-body">
<header>
  <a href="${HOME[lang]}" class="logo">State<em>doku</em> <span class="logo-flag">🇺🇸</span></a>
  <nav class="nav-actions"><a href="${HOME[lang]}" style="color:var(--text-2);text-decoration:none;font-weight:700;font-size:.88rem">${lang==='fr'?'← Accueil':lang==='es'?'← Inicio':'← Home'}</a></nav>
</header>
<script type="application/ld+json">
{"@context":"https://schema.org","@type":"BreadcrumbList","itemListElement":${breadcrumb}}
</script>
<script type="application/ld+json">${itemList}</script>
<main>
  <section class="hub-hero">
    <span class="hub-chip">${CHIP_TXT[lang]}</span>
    <h1>${H1[lang]}</h1>
    <p class="sub">${SUB[lang]}</p>
    <div class="hub-stats">${STATS_LABEL[lang]}</div>
  </section>
${sectionsHtml}

  <section class="hub-section">
    <h2>${lang==='fr'?'À propos de ce hub':lang==='es'?'Sobre este hub':'About this hub'}</h2>
    <p style="font-size:.92rem;line-height:1.65;color:var(--text-2)">${lang==='fr'?'21 mini-jeux gratuits pour maîtriser la géographie des 50 États américains. Chaque jeu offre 3 niveaux de difficulté (Facile, Normal, Difficile), un score à base d’étoiles (1–3 étoiles), un classement quotidien et la possibilité de partager le résultat (Wordle-style). EN/FR/ES.':lang==='es'?'21 mini-juegos gratuitos para dominar la geografía de los 50 estados. Cada juego tiene 3 niveles de dificultad (Fácil, Normal, Difícil), un sistema de estrellas (1–3) y un ranking diario. EN/FR/ES.':'21 free mini-games to master the geography of the 50 US states. Each game has 3 difficulty levels (Easy, Normal, Hard), a 1–3 star scoring system, daily leaderboard, and Wordle-style share. EN/FR/ES.'}</p>
  </section>
</main>
${FOOTER[lang]}
</body>
</html>`;
}

// ─── PLAYABLE GAME 1: Place-the-State ─────────────────────────────────────
function placeTheStatePage(lang) {
  const slug = 'place-the-state';
  const g = GAMES.find(g => g.slug === slug);
  const TITLE = {
    en:`Place the State — Click on US Map Quiz | Statedoku`,
    fr:`Placer l’État sur la Carte — Quiz Carte USA | Statedoku`,
    es:`Coloca el Estado en el Mapa — Quiz Mapa EE.UU. | Statedoku`,
  };
  const T = {
    en:{ play:'Play', start:'Start', round:'Round', score:'Score', lives:'Lives', findState:'Find this state:', wellDone:'Well done!', gameOver:'Game over', tryAgain:'Play again', share:'Share result', backToHub:'← All games', stars1:'1 star', stars2:'2 stars', stars3:'3 stars', perfect:'Perfect!', difficulty:'Difficulty', easy:'Easy', normal:'Normal', hard:'Hard', easyDesc:'5 well-known states', normalDesc:'10 random states', hardDesc:'15 states, lookalikes included' },
    fr:{ play:'Jouer', start:'Commencer', round:'Manche', score:'Score', lives:'Vies', findState:'Trouve cet État :', wellDone:'Bravo !', gameOver:'Terminé', tryAgain:'Rejouer', share:'Partager', backToHub:'← Tous les jeux', stars1:'1 étoile', stars2:'2 étoiles', stars3:'3 étoiles', perfect:'Parfait !', difficulty:'Difficulté', easy:'Facile', normal:'Normal', hard:'Difficile', easyDesc:'5 États bien connus', normalDesc:'10 États aléatoires', hardDesc:'15 États, pièges inclus' },
    es:{ play:'Jugar', start:'Empezar', round:'Ronda', score:'Puntuación', lives:'Vidas', findState:'Encuentra este estado:', wellDone:'¡Bien hecho!', gameOver:'Juego terminado', tryAgain:'Volver a jugar', share:'Compartir', backToHub:'← Todos los juegos', stars1:'1 estrella', stars2:'2 estrellas', stars3:'3 estrellas', perfect:'¡Perfecto!', difficulty:'Dificultad', easy:'Fácil', normal:'Normal', hard:'Difícil', easyDesc:'5 estados muy conocidos', normalDesc:'10 estados al azar', hardDesc:'15 estados, parecidos incluidos' },
  }[lang];
  const DESC = g.desc[lang];
  const KW = g.kw[lang];
  const breadcrumb = lang === 'en'
    ? `[{"@type":"ListItem","position":1,"name":"Home","item":"https://statedoku.com/"},{"@type":"ListItem","position":2,"name":"Play & Learn","item":"https://statedoku.com/play/"},{"@type":"ListItem","position":3,"name":"Place the State","item":"https://statedoku.com/play/place-the-state/"}]`
    : lang === 'fr'
    ? `[{"@type":"ListItem","position":1,"name":"Accueil","item":"https://statedoku.com/fr/"},{"@type":"ListItem","position":2,"name":"Jouer & Apprendre","item":"https://statedoku.com/fr/play/"},{"@type":"ListItem","position":3,"name":"Placer l’État","item":"https://statedoku.com/fr/play/place-the-state/"}]`
    : `[{"@type":"ListItem","position":1,"name":"Inicio","item":"https://statedoku.com/es/"},{"@type":"ListItem","position":2,"name":"Jugar y Aprender","item":"https://statedoku.com/es/play/"},{"@type":"ListItem","position":3,"name":"Coloca el Estado","item":"https://statedoku.com/es/play/place-the-state/"}]`;

  const gameSchema = JSON.stringify({
    '@context':'https://schema.org','@type':'Game',
    'name': g.titles[lang],
    'description': DESC,
    'url': `https://statedoku.com${PATHS[lang]}${slug}/`,
    'genre': 'Geography Quiz',
    'gamePlatform': 'Web Browser',
    'inLanguage': lang,
    'isAccessibleForFree': true,
    'publisher': { '@type':'Organization', 'name':'Statedoku' },
  });

  const faqJson = JSON.stringify({
    '@context':'https://schema.org','@type':'FAQPage',
    mainEntity: [
      {'@type':'Question', name: lang==='en'?'How do you play Place the State?':lang==='fr'?'Comment jouer à Placer l’État ?':'¿Cómo se juega Coloca el Estado?',
       acceptedAnswer:{'@type':'Answer',text: lang==='en'?'A state name appears at the top. Click that state on the US map. 10 rounds, 3 lives, score 1–3 stars.':lang==='fr'?'Un nom d’État apparaît en haut. Clique sur cet État sur la carte des USA. 10 manches, 3 vies, score 1–3 étoiles.':'Aparece un nombre de estado arriba. Haz clic en ese estado en el mapa. 10 rondas, 3 vidas, 1–3 estrellas.'}},
      {'@type':'Question', name: lang==='en'?'Is it free?':lang==='fr'?'Est-ce gratuit ?':'¿Es gratis?',
       acceptedAnswer:{'@type':'Answer',text: lang==='en'?'Yes — 100% free, no signup, no ads.':lang==='fr'?'Oui — 100% gratuit, sans inscription, sans pub.':'Sí — 100% gratis, sin registro, sin anuncios.'}},
      {'@type':'Question', name: lang==='en'?'Does it work on mobile?':lang==='fr'?'Ça marche sur mobile ?':'¿Funciona en móvil?',
       acceptedAnswer:{'@type':'Answer',text: lang==='en'?'Yes — the map and tap targets are touch-friendly. East-coast inset coming soon.':lang==='fr'?'Oui — la carte est tactile. Zoom côte Est à venir.':'Sí — mapa optimizado para táctil. Zoom costa Este próximamente.'}},
    ],
  });

  // Try to read the existing us-map.svg to inline it
  let svgInline = '';
  try {
    svgInline = fs.readFileSync(path.join(ROOT, 'data/us-map.svg'), 'utf8');
    // Strip XML declaration and class on svg since we'll restyle it
    svgInline = svgInline.replace(/<\?xml[^?]*\?>/, '').trim();
  } catch (e) {
    svgInline = '<p>Map data unavailable</p>';
  }

  return `<!DOCTYPE html>
<html lang="${lang}">
<head>${GA}
  <meta charset="UTF-8">
  <meta name="viewport" content="width=device-width,initial-scale=1.0">
  <meta name="theme-color" content="#0F2147">
  <title>${TITLE[lang]}</title>
  <meta name="description" content="${DESC}">
  <meta name="keywords" content="${KW}">
  <meta name="robots" content="index, follow, max-image-preview:large">
${hreflang(slug)}
  <link rel="icon" type="image/svg+xml" href="/favicon.svg?v=5">
  <link rel="stylesheet" href="/css/style.css?v=18">
  <meta property="og:type" content="website">
  <meta property="og:title" content="${g.titles[lang]}">
  <meta property="og:description" content="${DESC.slice(0,160)}">
  <meta property="og:url" content="https://statedoku.com${PATHS[lang]}${slug}/">
  <meta property="og:image" content="https://statedoku.com/og/og-learn-state-capitals.png">
  <meta property="og:locale" content="${lang==='en'?'en_US':lang==='fr'?'fr_FR':'es_ES'}">
  <meta name="twitter:card" content="summary_large_image">
  <meta name="twitter:title" content="${g.titles[lang]}">
  <meta name="twitter:description" content="${DESC.slice(0,160)}">
  <meta name="twitter:image" content="https://statedoku.com/og/og-learn-state-capitals.png">
  <style>${SHARED_STYLES}
    .pts-wrap{max-width:880px;margin:0 auto;padding:14px 14px 60px}
    .pts-panel{display:flex;gap:8px;align-items:center;flex-wrap:wrap;background:#F8FAFC;border:1px solid var(--border);border-radius:12px;padding:10px 14px;margin:10px 0 14px;font-size:.88rem}
    .pts-panel .lbl{color:var(--text-3);font-weight:600;font-size:.78rem;letter-spacing:.04em;text-transform:uppercase;margin-right:4px}
    .pts-panel .val{font-weight:900;font-size:1.08rem;color:var(--navy)}
    .pts-panel .lives{letter-spacing:3px}
    .pts-target{background:linear-gradient(135deg,var(--navy),var(--navy-soft));color:#fff;border-radius:14px;padding:16px 18px;margin:6px 0 12px;text-align:center}
    .pts-target .pt-label{font-size:.78rem;letter-spacing:.08em;text-transform:uppercase;font-weight:800;opacity:.78;margin-bottom:4px}
    .pts-target .pt-name{font-size:1.7rem;font-weight:900;letter-spacing:-.025em}
    .pts-map-wrap{background:#fff;border:1px solid var(--border);border-radius:14px;padding:8px;margin:8px 0 12px}
    .pts-map-wrap svg{width:100%;height:auto;display:block;max-height:520px}
    .pts-map-wrap svg path.state{fill:#E2E8F0!important;stroke:#fff!important;stroke-width:.8!important;cursor:pointer;transition:fill 120ms}
    .pts-map-wrap svg path.state:hover{fill:#CBD5E1!important}
    .pts-map-wrap svg path.state.correct{fill:#16A34A!important;cursor:default}
    .pts-map-wrap svg path.state.wrong{fill:#DC2626!important;cursor:default}
    .pts-map-wrap svg path.state.target-reveal{fill:#F59E0B!important;stroke:#0F2147!important;stroke-width:1.4!important}
    .pts-controls{display:flex;gap:10px;justify-content:center;flex-wrap:wrap;margin:8px 0}
    .pts-btn{padding:10px 18px;border-radius:999px;border:none;background:var(--navy);color:#fff;font-weight:800;cursor:pointer;font-size:.92rem}
    .pts-btn:disabled{opacity:.45;cursor:default}
    .pts-btn.gold{background:var(--gold);color:var(--navy)}
    .pts-difficulty{display:flex;gap:8px;justify-content:center;flex-wrap:wrap;margin:10px 0 16px}
    .pts-diff{padding:8px 14px;border-radius:999px;border:1px solid var(--border);background:#fff;color:var(--text);font-weight:700;cursor:pointer;font-size:.86rem}
    .pts-diff.active{background:var(--navy);color:#fff;border-color:var(--navy)}
    .pts-result{background:#FFF7ED;border:1px solid var(--gold);border-radius:14px;padding:18px;text-align:center;margin:14px 0}
    .pts-result h2{margin:0 0 10px;font-size:1.3rem;color:var(--navy)}
    .pts-result .score-line{font-size:1.05rem;margin-bottom:6px}
    .pts-feedback{min-height:1.6em;text-align:center;font-weight:700;font-size:.92rem;margin:6px 0}
    .pts-feedback.ok{color:#16A34A}
    .pts-feedback.no{color:#DC2626}</style>
</head>
<body class="legal-body">
<header>
  <a href="${HOME[lang]}" class="logo">State<em>doku</em> <span class="logo-flag">🇺🇸</span></a>
  <nav class="nav-actions"><a href="${PATHS[lang]}" style="color:var(--text-2);text-decoration:none;font-weight:700;font-size:.88rem">${T.backToHub}</a></nav>
</header>
<script type="application/ld+json">
{"@context":"https://schema.org","@type":"BreadcrumbList","itemListElement":${breadcrumb}}
</script>
<script type="application/ld+json">${gameSchema}</script>
<script type="application/ld+json">${faqJson}</script>
<main>
  <section class="hub-hero">
    <span class="hub-chip">${g.chip}</span>
    <h1>${g.titles[lang]}</h1>
    <p class="sub">${DESC}</p>
  </section>

  <div class="pts-wrap">
    <div class="pts-difficulty" id="pts-difficulty">
      <button class="pts-diff" data-diff="easy">${T.easy} · ${T.easyDesc}</button>
      <button class="pts-diff active" data-diff="normal">${T.normal} · ${T.normalDesc}</button>
      <button class="pts-diff" data-diff="hard">${T.hard} · ${T.hardDesc}</button>
    </div>

    <div class="pts-panel">
      <span class="lbl">${T.round}</span><span class="val" id="pts-round">1/10</span>
      <span class="lbl" style="margin-left:14px">${T.score}</span><span class="val" id="pts-score">0</span>
      <span class="lbl" style="margin-left:14px">${T.lives}</span><span class="val lives" id="pts-lives">❤️❤️❤️</span>
    </div>

    <div class="pts-target" id="pts-target">
      <div class="pt-label">${T.findState}</div>
      <div class="pt-name" id="pts-target-name">—</div>
    </div>

    <div class="pts-feedback" id="pts-feedback">&nbsp;</div>

    <div class="pts-map-wrap" id="pts-map-wrap">
${svgInline}
    </div>

    <div class="pts-controls">
      <button class="pts-btn gold" id="pts-start">${T.start}</button>
      <button class="pts-btn" id="pts-restart" style="display:none">${T.tryAgain}</button>
    </div>

    <div class="pts-result" id="pts-result" style="display:none"></div>

    <h2>${lang==='en'?'How to play':lang==='fr'?'Comment jouer':'Cómo jugar'}</h2>
    <p>${lang==='en'?'A state name appears in the gold box. Click that state on the US map. Three lives, ten rounds. Score is shown as X/10 and 1–3 stars.':lang==='fr'?'Un nom d’État apparaît dans la zone dorée. Clique sur cet État sur la carte des États-Unis. Trois vies, dix manches. Score affiché en X/10 et 1–3 étoiles.':'Un nombre de estado aparece en el cuadro dorado. Haz clic en ese estado en el mapa. Tres vidas, diez rondas. Puntuación X/10 y 1–3 estrellas.'}</p>

    <h2>${lang==='en'?'Frequently asked':lang==='fr'?'Questions fréquentes':'Preguntas frecuentes'}</h2>
    <details><summary><strong>${lang==='en'?'Is this free?':lang==='fr'?'C’est gratuit ?':'¿Es gratis?'}</strong></summary><p>${lang==='en'?'Yes — 100% free, no signup, no ads.':lang==='fr'?'Oui — 100% gratuit, sans inscription, sans pub.':'Sí — 100% gratis, sin registro, sin anuncios.'}</p></details>
    <details><summary><strong>${lang==='en'?'Does it save my streak?':lang==='fr'?'Mon streak est-il sauvegardé ?':'¿Se guarda mi racha?'}</strong></summary><p>${lang==='en'?'Yes — streak saved locally in your browser.':lang==='fr'?'Oui — streak sauvegardé localement dans ton navigateur.':'Sí — racha guardada localmente en tu navegador.'}</p></details>
    <details><summary><strong>${lang==='en'?'What about tiny states like Rhode Island?':lang==='fr'?'Et les petits États comme Rhode Island ?':'¿Y los estados pequeños como Rhode Island?'}</strong></summary><p>${lang==='en'?'Tap accuracy is forgiving for small states. An East-Coast inset is coming soon.':lang==='fr'?'La précision est tolérante pour les petits États. Zoom côte Est bientôt.':'La precisión es tolerante para los estados pequeños. Próximamente: zoom de la costa Este.'}</p></details>
  </div>
</main>
${FOOTER[lang]}

<script>
(function(){
  const STATES = ${JSON.stringify(buildStatesIndex(lang))};
  const T = ${JSON.stringify(T)};
  const DIFF = { easy: 5, normal: 10, hard: 15 };
  let diff = 'normal';
  let queue = [];
  let round = 0;
  let total = 10;
  let score = 0;
  let lives = 3;
  let answered = false;
  const $ = id => document.getElementById(id);
  const svgRoot = document.querySelector('#pts-map-wrap svg');
  const paths = svgRoot ? Array.from(svgRoot.querySelectorAll('path.state, [data-usps]')) : [];
  const pathByUSPS = {};
  paths.forEach(p => {
    const k = p.getAttribute('data-usps') || (p.id || '').replace(/^us-/, '');
    if (k) pathByUSPS[k] = p;
  });

  function setDifficulty(d) {
    diff = d;
    document.querySelectorAll('.pts-diff').forEach(b => {
      b.classList.toggle('active', b.dataset.diff === d);
    });
  }
  document.querySelectorAll('.pts-diff').forEach(b => b.addEventListener('click', () => setDifficulty(b.dataset.diff)));

  function shuffle(arr) {
    const a = arr.slice();
    for (let i = a.length - 1; i > 0; i--) {
      const j = Math.floor(Math.random() * (i + 1));
      [a[i], a[j]] = [a[j], a[i]];
    }
    return a;
  }
  function pickQueue(d) {
    const easyList = ['CA','TX','FL','NY','AK'];
    const hardList = ['IA','MO','KS','NE','SD','ND','MS','AL','WV','NH','VT','CT','RI','DE','NM'];
    let pool = STATES.map(s => s.id);
    if (d === 'easy') pool = easyList.concat(STATES.filter(s => !easyList.includes(s.id) && !hardList.includes(s.id)).slice(0,15).map(s=>s.id));
    if (d === 'hard') pool = hardList.concat(STATES.map(s=>s.id)).filter(Boolean);
    pool = pool.filter(id => STATES.find(s=>s.id===id));
    return shuffle(pool).slice(0, DIFF[d]);
  }

  function renderLives() {
    $('pts-lives').textContent = '❤️'.repeat(lives) + '\u{1F90D}'.repeat(Math.max(0,3-lives));
  }
  function nextRound() {
    answered = false;
    if (round >= total || queue.length === 0) return finish();
    round++;
    const id = queue.shift();
    const s = STATES.find(x => x.id === id);
    $('pts-round').textContent = round + '/' + total;
    $('pts-target-name').textContent = s.name;
    $('pts-target').dataset.target = id;
    $('pts-feedback').innerHTML = '&nbsp;';
  }
  function handleClick(p) {
    if (answered) return;
    const targetId = $('pts-target').dataset.target;
    const usps = p.getAttribute('data-usps') || (p.id || '').replace(/^us-/, '');
    if (!usps) return;
    answered = true;
    if (usps === targetId) {
      score++;
      p.classList.add('correct');
      $('pts-feedback').textContent = '✅ ' + T.wellDone;
      $('pts-feedback').className = 'pts-feedback ok';
    } else {
      p.classList.add('wrong');
      lives--;
      const correctP = pathByUSPS[targetId];
      if (correctP) correctP.classList.add('target-reveal');
      const s = STATES.find(x => x.id === targetId);
      $('pts-feedback').textContent = '❌ → ' + s.name;
      $('pts-feedback').className = 'pts-feedback no';
      renderLives();
      if (lives <= 0) { setTimeout(finish, 900); return; }
    }
    $('pts-score').textContent = score;
    setTimeout(() => {
      // Clear visual marks before next round
      paths.forEach(x => x.classList.remove('correct','wrong','target-reveal'));
      nextRound();
    }, 900);
  }
  paths.forEach(p => p.addEventListener('click', () => handleClick(p)));

  function stars(s, t) {
    const pct = s / t;
    if (pct >= 0.9) return 3;
    if (pct >= 0.6) return 2;
    if (pct >= 0.3) return 1;
    return 0;
  }
  function shareText() {
    const st = stars(score, total);
    const filled = '⭐'.repeat(st) + '⬜'.repeat(3 - st);
    return '🗺️ ${g.titles[lang].replace(/'/g, "\\'")} ' + score + '/' + total + ' ' + filled + ' statedoku.com${PATHS[lang]}${slug}/';
  }
  function finish() {
    $('pts-result').style.display = 'block';
    const st = stars(score, total);
    const filled = '★'.repeat(st);
    const off = '☆'.repeat(3 - st);
    $('pts-result').innerHTML = '<h2>' + (lives > 0 ? T.wellDone : T.gameOver) + '</h2>' +
      '<div class="score-line"><strong>' + score + '/' + total + '</strong> (' + Math.round(score/total*100) + '%)</div>' +
      '<div class="stars"><span>' + filled + '</span><span class="off">' + off + '</span></div>' +
      '<div style="margin-top:10px"><button class="pts-btn gold" onclick="window.location.reload()">' + T.tryAgain + '</button> ' +
      '<button class="pts-btn" id="pts-share-btn">' + T.share + '</button></div>';
    document.getElementById('pts-share-btn').addEventListener('click', async () => {
      const txt = shareText();
      try {
        if (navigator.share) { await navigator.share({ text: txt }); return; }
      } catch(e){}
      try { await navigator.clipboard.writeText(txt); alert('Copied'); } catch(e){ alert(txt); }
    });

    // Track + persist streak
    try {
      const key = 'sds_play_${slug}';
      const today = new Date().toISOString().slice(0,10);
      const prev = JSON.parse(localStorage.getItem(key) || '{}');
      const yesterday = new Date(Date.now() - 86400000).toISOString().slice(0,10);
      const streak = (prev.lastPlayed === today) ? (prev.streak||0) :
                     (prev.lastPlayed === yesterday) ? (prev.streak||0) + 1 : 1;
      localStorage.setItem(key, JSON.stringify({
        lastPlayed: today, streak: streak,
        best: Math.max(prev.best || 0, score),
      }));
      if (window.gtag) window.gtag('event','play_complete',{game:'${slug}',score:score,total:total,stars:st});
    } catch(e){}
  }

  $('pts-start').addEventListener('click', () => {
    queue = pickQueue(diff);
    total = queue.length;
    round = 0;
    score = 0;
    lives = 3;
    renderLives();
    $('pts-score').textContent = '0';
    $('pts-result').style.display = 'none';
    $('pts-start').style.display = 'none';
    paths.forEach(x => x.classList.remove('correct','wrong','target-reveal'));
    nextRound();
  });

  // Default visible text
  $('pts-target-name').textContent = T.findState.replace(/:$/, '');
})();
</script>
</body>
</html>`;
}

// ─── PLAYABLE GAME 2: USPS Abbreviations ─────────────────────────────────
function uspsAbbrPage(lang) {
  const slug = 'state-abbreviations';
  const g = GAMES.find(g => g.slug === slug);
  const T = {
    en:{ round:'Round', score:'Score', lives:'Lives', whichState:'Which state has this abbreviation?', wellDone:'Well done!', gameOver:'Game over', tryAgain:'Play again', share:'Share result', backToHub:'← All games', start:'Start' },
    fr:{ round:'Manche', score:'Score', lives:'Vies', whichState:'Quel État a cette abréviation ?', wellDone:'Bravo !', gameOver:'Terminé', tryAgain:'Rejouer', share:'Partager', backToHub:'← Tous les jeux', start:'Commencer' },
    es:{ round:'Ronda', score:'Puntuación', lives:'Vidas', whichState:'¿Qué estado tiene esta abreviatura?', wellDone:'¡Bien hecho!', gameOver:'Juego terminado', tryAgain:'Volver a jugar', share:'Compartir', backToHub:'← Todos los juegos', start:'Empezar' },
  }[lang];
  const DESC = g.desc[lang];
  const KW = g.kw[lang];
  const breadcrumb = lang === 'en'
    ? `[{"@type":"ListItem","position":1,"name":"Home","item":"https://statedoku.com/"},{"@type":"ListItem","position":2,"name":"Play & Learn","item":"https://statedoku.com/play/"},{"@type":"ListItem","position":3,"name":"USPS Abbreviations","item":"https://statedoku.com/play/state-abbreviations/"}]`
    : lang === 'fr'
    ? `[{"@type":"ListItem","position":1,"name":"Accueil","item":"https://statedoku.com/fr/"},{"@type":"ListItem","position":2,"name":"Jouer & Apprendre","item":"https://statedoku.com/fr/play/"},{"@type":"ListItem","position":3,"name":"Abréviations USPS","item":"https://statedoku.com/fr/play/state-abbreviations/"}]`
    : `[{"@type":"ListItem","position":1,"name":"Inicio","item":"https://statedoku.com/es/"},{"@type":"ListItem","position":2,"name":"Jugar y Aprender","item":"https://statedoku.com/es/play/"},{"@type":"ListItem","position":3,"name":"Abreviaturas USPS","item":"https://statedoku.com/es/play/state-abbreviations/"}]`;
  const gameSchema = JSON.stringify({
    '@context':'https://schema.org','@type':'Game',
    name: g.titles[lang], description: DESC,
    url: `https://statedoku.com${PATHS[lang]}${slug}/`,
    genre:'Geography Quiz', gamePlatform:'Web Browser', inLanguage: lang, isAccessibleForFree: true,
    publisher:{'@type':'Organization', name:'Statedoku'},
  });

  return `<!DOCTYPE html>
<html lang="${lang}">
<head>${GA}
  <meta charset="UTF-8">
  <meta name="viewport" content="width=device-width,initial-scale=1.0">
  <meta name="theme-color" content="#0F2147">
  <title>${g.titles[lang]} — Quiz | Statedoku</title>
  <meta name="description" content="${DESC}">
  <meta name="keywords" content="${KW}">
  <meta name="robots" content="index, follow, max-image-preview:large">
${hreflang(slug)}
  <link rel="icon" type="image/svg+xml" href="/favicon.svg?v=5">
  <link rel="stylesheet" href="/css/style.css?v=18">
  <meta property="og:type" content="website">
  <meta property="og:title" content="${g.titles[lang]}">
  <meta property="og:description" content="${DESC.slice(0,160)}">
  <meta property="og:url" content="https://statedoku.com${PATHS[lang]}${slug}/">
  <meta property="og:image" content="https://statedoku.com/og/og-learn-state-capitals.png">
  <meta property="og:locale" content="${lang==='en'?'en_US':lang==='fr'?'fr_FR':'es_ES'}">
  <meta name="twitter:card" content="summary_large_image">
  <meta name="twitter:title" content="${g.titles[lang]}">
  <meta name="twitter:description" content="${DESC.slice(0,160)}">
  <meta name="twitter:image" content="https://statedoku.com/og/og-learn-state-capitals.png">
  <style>${SHARED_STYLES}
    .ab-wrap{max-width:660px;margin:0 auto;padding:14px 14px 60px}
    .ab-panel{display:flex;gap:8px;align-items:center;flex-wrap:wrap;background:#F8FAFC;border:1px solid var(--border);border-radius:12px;padding:10px 14px;margin:10px 0 14px;font-size:.88rem}
    .ab-panel .lbl{color:var(--text-3);font-weight:600;font-size:.78rem;letter-spacing:.04em;text-transform:uppercase;margin-right:4px}
    .ab-panel .val{font-weight:900;font-size:1.08rem;color:var(--navy)}
    .ab-card{background:linear-gradient(135deg,var(--navy),var(--navy-soft));color:#fff;border-radius:14px;padding:24px;text-align:center;margin:6px 0 14px}
    .ab-q{font-size:.8rem;letter-spacing:.08em;text-transform:uppercase;font-weight:800;opacity:.78;margin-bottom:8px}
    .ab-code{font-size:4.5rem;font-weight:900;letter-spacing:.06em;line-height:1}
    .ab-choices{display:grid;grid-template-columns:1fr 1fr;gap:10px}
    .ab-choice{padding:14px;border-radius:12px;border:1px solid var(--border);background:#fff;cursor:pointer;font-weight:700;color:var(--navy);font-size:.98rem;text-align:left}
    .ab-choice:hover{background:#F8FAFC}
    .ab-choice.correct{background:#16A34A;color:#fff;border-color:#16A34A}
    .ab-choice.wrong{background:#DC2626;color:#fff;border-color:#DC2626}
    .ab-controls{display:flex;gap:10px;justify-content:center;flex-wrap:wrap;margin:8px 0}
    .ab-btn{padding:10px 18px;border-radius:999px;border:none;background:var(--navy);color:#fff;font-weight:800;cursor:pointer;font-size:.92rem}
    .ab-btn.gold{background:var(--gold);color:var(--navy)}
    .ab-feedback{min-height:1.6em;text-align:center;font-weight:700;font-size:.92rem;margin:6px 0}
    .ab-feedback.ok{color:#16A34A}
    .ab-feedback.no{color:#DC2626}
    .ab-result{background:#FFF7ED;border:1px solid var(--gold);border-radius:14px;padding:18px;text-align:center;margin:14px 0}
    .ab-result h2{margin:0 0 10px;font-size:1.3rem;color:var(--navy)}</style>
</head>
<body class="legal-body">
<header>
  <a href="${HOME[lang]}" class="logo">State<em>doku</em> <span class="logo-flag">🇺🇸</span></a>
  <nav class="nav-actions"><a href="${PATHS[lang]}" style="color:var(--text-2);text-decoration:none;font-weight:700;font-size:.88rem">${T.backToHub}</a></nav>
</header>
<script type="application/ld+json">
{"@context":"https://schema.org","@type":"BreadcrumbList","itemListElement":${breadcrumb}}
</script>
<script type="application/ld+json">${gameSchema}</script>
<main>
  <section class="hub-hero">
    <span class="hub-chip">${g.chip}</span>
    <h1>${g.titles[lang]}</h1>
    <p class="sub">${DESC}</p>
  </section>

  <div class="ab-wrap">
    <div class="ab-panel">
      <span class="lbl">${T.round}</span><span class="val" id="ab-round">1/20</span>
      <span class="lbl" style="margin-left:14px">${T.score}</span><span class="val" id="ab-score">0</span>
      <span class="lbl" style="margin-left:14px">${T.lives}</span><span class="val" id="ab-lives">❤️❤️❤️</span>
    </div>

    <div class="ab-card">
      <div class="ab-q">${T.whichState}</div>
      <div class="ab-code" id="ab-code">??</div>
    </div>

    <div class="ab-feedback" id="ab-feedback">&nbsp;</div>

    <div class="ab-choices" id="ab-choices"></div>

    <div class="ab-controls">
      <button class="ab-btn gold" id="ab-start">${T.start}</button>
    </div>

    <div class="ab-result" id="ab-result" style="display:none"></div>
  </div>
</main>
${FOOTER[lang]}

<script>
(function(){
  const STATES = ${JSON.stringify(buildStatesIndex(lang))};
  const T = ${JSON.stringify(T)};
  let queue = [];
  let round = 0;
  let total = 20;
  let score = 0;
  let lives = 3;
  let answered = false;
  const $ = id => document.getElementById(id);

  function shuffle(a){a=a.slice();for(let i=a.length-1;i>0;i--){const j=Math.floor(Math.random()*(i+1));[a[i],a[j]]=[a[j],a[i]];}return a;}
  function pickQueue(){ return shuffle(STATES.map(s=>s.id)).slice(0, total); }
  function nextRound(){
    answered=false;
    if (round >= total || queue.length === 0) return finish();
    round++;
    const id = queue.shift();
    const correct = STATES.find(s=>s.id===id);
    const distractors = shuffle(STATES.filter(s=>s.id!==id)).slice(0,3);
    const choices = shuffle([correct, ...distractors]);
    $('ab-round').textContent = round+'/'+total;
    $('ab-code').textContent = id;
    const ch = $('ab-choices');
    ch.innerHTML = '';
    choices.forEach(s => {
      const b = document.createElement('button');
      b.className = 'ab-choice';
      b.textContent = s.name;
      b.dataset.id = s.id;
      b.addEventListener('click', () => answer(b, correct.id));
      ch.appendChild(b);
    });
    $('ab-feedback').innerHTML = '&nbsp;';
  }
  function answer(btn, correctId){
    if (answered) return;
    answered = true;
    const correctBtn = Array.from(document.querySelectorAll('.ab-choice')).find(b => b.dataset.id === correctId);
    if (btn.dataset.id === correctId) {
      score++;
      btn.classList.add('correct');
      $('ab-feedback').textContent = '✅ ' + T.wellDone;
      $('ab-feedback').className = 'ab-feedback ok';
    } else {
      btn.classList.add('wrong');
      if (correctBtn) correctBtn.classList.add('correct');
      lives--;
      $('ab-feedback').textContent = '❌';
      $('ab-feedback').className = 'ab-feedback no';
      $('ab-lives').textContent = '❤️'.repeat(lives)+'\u{1F90D}'.repeat(3-lives);
      if (lives <= 0) { setTimeout(finish, 800); return; }
    }
    $('ab-score').textContent = score;
    setTimeout(nextRound, 800);
  }
  function stars(s,t){const p=s/t;return p>=0.9?3:p>=0.6?2:p>=0.3?1:0;}
  function shareText(){const st=stars(score,total);return '✉️ ${g.titles[lang].replace(/'/g, "\\'")} ' + score + '/' + total + ' ' + '⭐'.repeat(st)+'⬜'.repeat(3-st) + ' statedoku.com${PATHS[lang]}${slug}/';}
  function finish(){
    $('ab-result').style.display = 'block';
    const st = stars(score, total);
    $('ab-result').innerHTML = '<h2>' + (lives > 0 ? T.wellDone : T.gameOver) + '</h2>' +
      '<div style="font-size:1.05rem;margin-bottom:6px"><strong>' + score + '/' + total + '</strong> (' + Math.round(score/total*100) + '%)</div>' +
      '<div class="stars"><span style="color:#F59E0B;font-size:1.4rem;letter-spacing:6px">' + '★'.repeat(st) + '</span><span style="color:#E5E7EB;font-size:1.4rem;letter-spacing:6px">' + '☆'.repeat(3-st) + '</span></div>' +
      '<div style="margin-top:10px"><button class="ab-btn gold" onclick="window.location.reload()">' + T.tryAgain + '</button> ' +
      '<button class="ab-btn" id="ab-share-btn">' + T.share + '</button></div>';
    document.getElementById('ab-share-btn').addEventListener('click', async () => {
      const txt = shareText();
      try { if (navigator.share) { await navigator.share({ text: txt }); return; } } catch(e){}
      try { await navigator.clipboard.writeText(txt); alert('Copied'); } catch(e){ alert(txt); }
    });
    try {
      const key = 'sds_play_${slug}';
      const today = new Date().toISOString().slice(0,10);
      const prev = JSON.parse(localStorage.getItem(key) || '{}');
      const yesterday = new Date(Date.now() - 86400000).toISOString().slice(0,10);
      const streak = (prev.lastPlayed === today) ? (prev.streak||0) :
                     (prev.lastPlayed === yesterday) ? (prev.streak||0) + 1 : 1;
      localStorage.setItem(key, JSON.stringify({
        lastPlayed: today, streak: streak, best: Math.max(prev.best || 0, score),
      }));
      if (window.gtag) window.gtag('event','play_complete',{game:'${slug}',score:score,total:total,stars:st});
    } catch(e){}
  }
  $('ab-start').addEventListener('click', () => {
    queue = pickQueue();
    round = 0;
    score = 0;
    lives = 3;
    $('ab-lives').textContent = '❤️❤️❤️';
    $('ab-score').textContent = '0';
    $('ab-result').style.display = 'none';
    $('ab-start').style.display = 'none';
    nextRound();
  });
})();
</script>
</body>
</html>`;
}

// ─── Build per-game stub (coming soon, proper SEO) ───────────────────────
function stubPage(lang, g) {
  const slug = g.slug;
  const TITLE = `${g.titles[lang]} — ${lang==='en'?'Coming Soon':lang==='fr'?'Bientôt disponible':'Próximamente'} | Statedoku`;
  const breadcrumb = lang === 'en'
    ? `[{"@type":"ListItem","position":1,"name":"Home","item":"https://statedoku.com/"},{"@type":"ListItem","position":2,"name":"Play & Learn","item":"https://statedoku.com/play/"},{"@type":"ListItem","position":3,"name":"${g.titles[lang]}","item":"https://statedoku.com/play/${slug}/"}]`
    : lang === 'fr'
    ? `[{"@type":"ListItem","position":1,"name":"Accueil","item":"https://statedoku.com/fr/"},{"@type":"ListItem","position":2,"name":"Jouer & Apprendre","item":"https://statedoku.com/fr/play/"},{"@type":"ListItem","position":3,"name":"${g.titles[lang]}","item":"https://statedoku.com/fr/play/${slug}/"}]`
    : `[{"@type":"ListItem","position":1,"name":"Inicio","item":"https://statedoku.com/es/"},{"@type":"ListItem","position":2,"name":"Jugar y Aprender","item":"https://statedoku.com/es/play/"},{"@type":"ListItem","position":3,"name":"${g.titles[lang]}","item":"https://statedoku.com/es/play/${slug}/"}]`;

  const gameSchema = JSON.stringify({
    '@context':'https://schema.org','@type':'Game',
    name: g.titles[lang], description: g.desc[lang],
    url: `https://statedoku.com${PATHS[lang]}${slug}/`,
    genre:'Geography Quiz', gamePlatform:'Web Browser', inLanguage: lang, isAccessibleForFree: true,
    publisher:{'@type':'Organization', name:'Statedoku'},
  });

  const RELATED = GAMES.filter(x => x.group === g.group && x.slug !== slug).slice(0, 5).map(x =>
    `      <a class="game-card" data-group="${x.group}" href="${PATHS[lang]}${x.slug}/">
        <span class="gc-tag ${x.playable?'live':'soon'}">${x.playable ? (lang==='fr'?'JOUER':lang==='es'?'JUGAR':'PLAY') : (lang==='fr'?'BIENTÔT':lang==='es'?'PRONTO':'SOON')}</span>
        <span class="gc-chip">${x.chip}</span>
        <div class="gc-title">${x.titles[lang]}</div>
        <div class="gc-desc">${x.desc[lang]}</div>
      </a>`).join('\n');

  const NOW_PLAYABLE = GAMES.filter(x => x.playable).map(x =>
    `      <a class="game-card" data-group="${x.group}" href="${PATHS[lang]}${x.slug}/">
        <span class="gc-tag live">${lang==='fr'?'JOUER':lang==='es'?'JUGAR':'PLAY'}</span>
        <span class="gc-chip">${x.chip}</span>
        <div class="gc-title">${x.titles[lang]}</div>
        <div class="gc-desc">${x.desc[lang]}</div>
      </a>`).join('\n');

  return `<!DOCTYPE html>
<html lang="${lang}">
<head>${GA}
  <meta charset="UTF-8">
  <meta name="viewport" content="width=device-width,initial-scale=1.0">
  <meta name="theme-color" content="#0F2147">
  <title>${TITLE}</title>
  <meta name="description" content="${g.desc[lang]}">
  <meta name="keywords" content="${g.kw[lang]}">
  <meta name="robots" content="index, follow, max-image-preview:large">
${hreflang(slug)}
  <link rel="icon" type="image/svg+xml" href="/favicon.svg?v=5">
  <link rel="stylesheet" href="/css/style.css?v=18">
  <meta property="og:type" content="website">
  <meta property="og:title" content="${g.titles[lang]}">
  <meta property="og:description" content="${g.desc[lang].slice(0,160)}">
  <meta property="og:url" content="https://statedoku.com${PATHS[lang]}${slug}/">
  <meta property="og:image" content="https://statedoku.com/og/og-learn-state-capitals.png">
  <meta property="og:locale" content="${lang==='en'?'en_US':lang==='fr'?'fr_FR':'es_ES'}">
  <meta name="twitter:card" content="summary_large_image">
  <meta name="twitter:title" content="${g.titles[lang]}">
  <meta name="twitter:description" content="${g.desc[lang].slice(0,160)}">
  <meta name="twitter:image" content="https://statedoku.com/og/og-learn-state-capitals.png">
  <style>${SHARED_STYLES}</style>
</head>
<body class="legal-body">
<header>
  <a href="${HOME[lang]}" class="logo">State<em>doku</em> <span class="logo-flag">🇺🇸</span></a>
  <nav class="nav-actions"><a href="${PATHS[lang]}" style="color:var(--text-2);text-decoration:none;font-weight:700;font-size:.88rem">${lang==='fr'?'← Tous les jeux':lang==='es'?'← Todos los juegos':'← All games'}</a></nav>
</header>
<script type="application/ld+json">
{"@context":"https://schema.org","@type":"BreadcrumbList","itemListElement":${breadcrumb}}
</script>
<script type="application/ld+json">${gameSchema}</script>
<main>
  <section class="hub-hero">
    <span class="hub-chip">${g.chip}</span>
    <h1>${g.titles[lang]}</h1>
    <p class="sub">${g.desc[lang]}</p>
  </section>

  <div class="game-frame">
    <div style="background:#FFF7ED;border:1px solid var(--gold);border-radius:14px;padding:22px;text-align:center;margin:14px 0">
      <h2 style="margin:0 0 6px;color:var(--navy);font-size:1.2rem">${lang==='fr'?'Bientôt disponible':lang==='es'?'Próximamente':'Coming Soon'}</h2>
      <p style="margin:0;font-size:.92rem;color:var(--text-2)">${lang==='fr'?'Ce jeu est en préparation. En attendant, explore nos jeux déjà jouables et notre guide complet.':lang==='es'?'Este juego está en preparación. Mientras tanto, explora nuestros juegos disponibles y nuestra guía completa.':'This game is in production. In the meantime, try our live games and complete guides.'}</p>
    </div>

    <h2>${lang==='fr'?'Prêt à jouer maintenant':lang==='es'?'Disponibles ahora':'Available now'}</h2>
    <div class="game-grid">
${NOW_PLAYABLE}
    </div>

    <h2>${lang==='fr'?'Jeux similaires (à venir)':lang==='es'?'Juegos similares (pronto)':'Similar games (coming soon)'}</h2>
    <div class="game-grid">
${RELATED}
    </div>

    <h2>${lang==='fr'?'En attendant':lang==='es'?'Mientras tanto':'In the meantime'}</h2>
    <p>${lang==='fr'?'Tu peux déjà explorer notre <a href="/fr/learn/" style="color:var(--navy);font-weight:700">guide complet des 50 États</a> qui couvre toutes les questions des quiz à venir : <a href="/fr/learn/capitales-des-etats/" style="color:var(--navy);font-weight:700">capitales</a>, <a href="/fr/learn/surnoms-des-etats/" style="color:var(--navy);font-weight:700">surnoms</a>, <a href="/fr/learn/college-electoral/" style="color:var(--navy);font-weight:700">collège électoral</a>, <a href="/fr/learn/13-colonies/" style="color:var(--navy);font-weight:700">13 colonies</a> et bien plus.':lang==='es'?'Mientras tanto, explora nuestra <a href="/es/learn/" style="color:var(--navy);font-weight:700">guía completa de los 50 estados</a> que cubre todas las preguntas de los próximos quizzes: <a href="/es/learn/capitales-de-estados/" style="color:var(--navy);font-weight:700">capitales</a>, <a href="/es/learn/apodos-de-estados/" style="color:var(--navy);font-weight:700">apodos</a>, <a href="/es/learn/colegio-electoral/" style="color:var(--navy);font-weight:700">colegio electoral</a> y más.':'You can already explore our <a href="/learn/" style="color:var(--navy);font-weight:700">complete 50-states guide</a> which covers everything that the upcoming quizzes will test: <a href="/learn/state-capitals/" style="color:var(--navy);font-weight:700">capitals</a>, <a href="/learn/state-nicknames-complete/" style="color:var(--navy);font-weight:700">nicknames</a>, <a href="/learn/electoral-college/" style="color:var(--navy);font-weight:700">electoral college</a>, <a href="/learn/13-colonies/" style="color:var(--navy);font-weight:700">13 colonies</a>, and many more.'}</p>

    <h2>${lang==='fr'?'Notifie-moi':lang==='es'?'Avísame':'Notify me'}</h2>
    <p>${lang==='fr'?'Reçois le puzzle quotidien Statedoku par mail. On t’enverra aussi un mot quand ce jeu sera dispo.':lang==='es'?'Recibe el puzzle diario Statedoku por correo. También te avisaremos cuando este juego esté disponible.':'Get the daily Statedoku puzzle by email. We’ll also drop you a note when this game goes live.'} <a href="${HOME[lang]}" style="color:var(--navy);font-weight:700">${lang==='fr'?'S’inscrire →':lang==='es'?'Suscribirse →':'Subscribe →'}</a></p>
  </div>
</main>
${FOOTER[lang]}
</body>
</html>`;
}

// ─── Helper: build states index with localized names ──────────────────────
function buildStatesIndex(lang) {
  const raw = JSON.parse(fs.readFileSync(path.join(ROOT, 'data/states.json'), 'utf8'));
  return raw.map(s => ({ id: s.id, name: (s.names && s.names[lang]) || s.names.en }));
}

// ─── WRITE ALL FILES ─────────────────────────────────────────────────────
const LANGS = ['en','fr','es'];
const langDir = lang => lang === 'en' ? 'play' : `${lang}/play`;

const out = [];

// 1. Hubs (3)
for (const lang of LANGS) {
  out.push([`${langDir(lang)}/index.html`, hubPage(lang)]);
}

// 2. Playable games (6)
for (const lang of LANGS) {
  out.push([`${langDir(lang)}/place-the-state/index.html`, placeTheStatePage(lang)]);
  out.push([`${langDir(lang)}/state-abbreviations/index.html`, uspsAbbrPage(lang)]);
}

// 3. Stubs (19 × 3 = 57)
for (const g of GAMES.filter(g => !g.playable)) {
  for (const lang of LANGS) {
    out.push([`${langDir(lang)}/${g.slug}/index.html`, stubPage(lang, g)]);
  }
}

// Write
for (const [rel, html] of out) {
  const fullPath = path.join(ROOT, rel);
  fs.mkdirSync(path.dirname(fullPath), { recursive: true });
  fs.writeFileSync(fullPath, html);
  console.log(`✅ /${rel}`);
}
console.log(`\n${out.length} files generated for /play/ hub (3 hubs + 6 playable + 57 stubs).`);

// Export the games list for sitemap injection
fs.writeFileSync(path.join(__dirname, 'play-slugs.json'), JSON.stringify({
  slugs: GAMES.map(g => g.slug),
  playable: GAMES.filter(g => g.playable).map(g => g.slug),
}, null, 2));
console.log('📝 play-slugs.json written for sitemap step.');
