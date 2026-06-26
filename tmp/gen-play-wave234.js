#!/usr/bin/env node
/**
 * Wave 2 + 3 + 4 — Implement all 19 remaining games as fully playable.
 *
 * Each game uses a shared engine pattern (mcq / mapClick / typing / match /
 * silhouette / connections / order). Self-contained per-page (inline JS).
 *
 * Total pages this wave: 19 games × 3 langs = 57 (replaces existing stubs).
 */
const fs = require('fs');
const path = require('path');
const ROOT = path.resolve(__dirname, '..');

const STATES = JSON.parse(fs.readFileSync(path.join(ROOT, 'data/states.json'), 'utf8'));
const EXTRA = JSON.parse(fs.readFileSync(path.join(ROOT, 'data/play-extra.json'), 'utf8'));

// Build per-state localized name lookup
const STATE_BY_ID = Object.fromEntries(STATES.map(s => [s.id, s]));
const stateName = (id, lang) => (STATE_BY_ID[id]?.names?.[lang]) || STATE_BY_ID[id]?.names?.en || id;

// ─── Helpers ──────────────────────────────────────────────────────────────
const GA = `
  <!-- Google tag (gtag.js) -->
  <script async src="https://www.googletagmanager.com/gtag/js?id=G-P7ZBQNYLS4"></script>
  <script>
    window.dataLayer = window.dataLayer || [];
    function gtag(){dataLayer.push(arguments);}
    gtag('js', new Date());
    gtag('config', 'G-P7ZBQNYLS4');
  </script>`;

const PATHS = { en:'/play/', fr:'/fr/play/', es:'/es/play/' };
const HOME  = { en:'/', fr:'/fr/', es:'/es/' };
const LANGS = ['en','fr','es'];
const LOCALE_TAG = { en:'en_US', fr:'fr_FR', es:'es_ES' };

const FOOTER = {
  en:`<footer><p>Statedoku &copy; 2026 &nbsp;·&nbsp; <a href="/play/">Play & Learn</a> &nbsp;·&nbsp; <a href="/learn/">Learn</a> &nbsp;·&nbsp; <a href="/states/">States</a> &nbsp;·&nbsp; <a href="/faq/">FAQ</a></p></footer>`,
  fr:`<footer><p>Statedoku &copy; 2026 &nbsp;·&nbsp; <a href="/fr/play/">Jouer & Apprendre</a> &nbsp;·&nbsp; <a href="/fr/learn/">Apprendre</a> &nbsp;·&nbsp; <a href="/fr/faq/">FAQ</a></p></footer>`,
  es:`<footer><p>Statedoku &copy; 2026 &nbsp;·&nbsp; <a href="/es/play/">Jugar y Aprender</a> &nbsp;·&nbsp; <a href="/es/learn/">Aprender</a> &nbsp;·&nbsp; <a href="/es/faq/">FAQ</a></p></footer>`,
};

const BACK_HUB = { en:'← All games', fr:'← Tous les jeux', es:'← Todos los juegos' };

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

// Shared CSS for all game pages
const SHARED_CSS = `
    .hub-hero{max-width:880px;margin:24px auto 14px;padding:0 18px;text-align:center}
    .hub-hero h1{font-size:clamp(2rem,5.5vw,2.8rem);font-weight:900;letter-spacing:-.025em;margin:0 0 10px;line-height:1.12}
    .hub-hero .sub{color:var(--text-2);font-size:1rem;line-height:1.55;max-width:640px;margin:0 auto}
    .hub-chip{display:inline-block;padding:4px 10px;border-radius:999px;background:var(--gold);color:var(--navy);font-weight:800;font-size:.78rem;letter-spacing:.06em;text-transform:uppercase;margin-bottom:12px}
    .game-wrap{max-width:760px;margin:0 auto;padding:14px 14px 60px}
    .game-panel{display:flex;gap:8px;align-items:center;flex-wrap:wrap;background:#F8FAFC;border:1px solid var(--border);border-radius:12px;padding:10px 14px;margin:10px 0 14px;font-size:.88rem}
    .game-panel .lbl{color:var(--text-3);font-weight:600;font-size:.78rem;letter-spacing:.04em;text-transform:uppercase;margin-right:4px}
    .game-panel .val{font-weight:900;font-size:1.08rem;color:var(--navy)}
    .game-card-hero{background:linear-gradient(135deg,var(--navy),var(--navy-soft));color:#fff;border-radius:14px;padding:22px 18px;text-align:center;margin:6px 0 14px}
    .game-card-hero .qlbl{font-size:.78rem;letter-spacing:.08em;text-transform:uppercase;font-weight:800;opacity:.78;margin-bottom:6px}
    .game-card-hero .qval{font-size:1.7rem;font-weight:900;letter-spacing:-.025em;line-height:1.18}
    .game-card-hero .qval.small{font-size:1.2rem;font-weight:700}
    .game-card-hero .qval.tiny{font-size:1rem;font-weight:600;font-style:italic}
    .game-card-hero .qcode{font-size:4rem;font-weight:900;letter-spacing:.06em;line-height:1;margin-top:4px}
    .ab-choices{display:grid;grid-template-columns:1fr 1fr;gap:10px}
    .ab-choice{padding:14px;border-radius:12px;border:1px solid var(--border);background:#fff;cursor:pointer;font-weight:700;color:var(--navy);font-size:.95rem;text-align:left;transition:background 80ms,border-color 80ms}
    .ab-choice:hover{background:#F8FAFC}
    .ab-choice.correct{background:#16A34A;color:#fff;border-color:#16A34A}
    .ab-choice.wrong{background:#DC2626;color:#fff;border-color:#DC2626}
    .feedback{min-height:1.6em;text-align:center;font-weight:700;font-size:.92rem;margin:6px 0}
    .feedback.ok{color:#16A34A}
    .feedback.no{color:#DC2626}
    .controls{display:flex;gap:10px;justify-content:center;flex-wrap:wrap;margin:8px 0}
    .gbtn{padding:10px 18px;border-radius:999px;border:none;background:var(--navy);color:#fff;font-weight:800;cursor:pointer;font-size:.92rem}
    .gbtn:disabled{opacity:.45;cursor:default}
    .gbtn.gold{background:var(--gold);color:var(--navy)}
    .difficulty{display:flex;gap:8px;justify-content:center;flex-wrap:wrap;margin:6px 0 14px}
    .diff{padding:8px 14px;border-radius:999px;border:1px solid var(--border);background:#fff;color:var(--text);font-weight:700;cursor:pointer;font-size:.84rem}
    .diff.active{background:var(--navy);color:#fff;border-color:var(--navy)}
    .result-card{background:#FFF7ED;border:1px solid var(--gold);border-radius:14px;padding:18px;text-align:center;margin:14px 0}
    .result-card h2{margin:0 0 10px;font-size:1.3rem;color:var(--navy)}
    .stars{font-size:1.4rem;letter-spacing:6px;color:#F59E0B}
    .stars .off{color:#E5E7EB}
    .text-input{width:100%;padding:14px 16px;border:2px solid var(--border);border-radius:12px;font-size:1.05rem;font-weight:700;color:var(--navy);text-align:center;text-transform:capitalize}
    .text-input:focus{outline:none;border-color:var(--navy)}
    .match-grid{display:grid;grid-template-columns:1fr 1fr;gap:10px;margin:6px 0}
    .match-col{display:flex;flex-direction:column;gap:6px}
    .match-item{padding:10px 12px;border-radius:10px;border:1px solid var(--border);background:#fff;cursor:pointer;font-weight:700;color:var(--navy);font-size:.92rem;text-align:left;transition:background 80ms,border-color 80ms}
    .match-item.selected{background:var(--navy);color:#fff;border-color:var(--navy)}
    .match-item.paired{background:#16A34A;color:#fff;border-color:#16A34A;cursor:default;opacity:.85}
    .match-item.error{background:#DC2626;color:#fff;border-color:#DC2626}
    .connections-grid{display:grid;grid-template-columns:repeat(4,1fr);gap:6px;margin:6px 0}
    .conn-cell{padding:10px 8px;border-radius:8px;border:1px solid var(--border);background:#fff;cursor:pointer;font-weight:800;color:var(--navy);font-size:.84rem;text-align:center;line-height:1.2;transition:background 80ms,border-color 80ms,color 80ms}
    .conn-cell.selected{background:var(--navy);color:#fff;border-color:var(--navy)}
    .conn-cell.solved-1{background:#FBBF24;color:#0F2147;border-color:#FBBF24}
    .conn-cell.solved-2{background:#34D399;color:#fff;border-color:#34D399}
    .conn-cell.solved-3{background:#60A5FA;color:#fff;border-color:#60A5FA}
    .conn-cell.solved-4{background:#A78BFA;color:#fff;border-color:#A78BFA}
    .conn-cat{padding:10px 14px;border-radius:10px;margin:6px 0;font-weight:800;color:#0F2147;text-align:center;font-size:.92rem}
    .conn-cat.cat-1{background:#FBBF24}
    .conn-cat.cat-2{background:#34D399;color:#fff}
    .conn-cat.cat-3{background:#60A5FA;color:#fff}
    .conn-cat.cat-4{background:#A78BFA;color:#fff}
    .order-list{display:flex;flex-direction:column;gap:6px;margin:6px 0}
    .order-item{padding:12px 16px;border-radius:10px;border:1px solid var(--border);background:#fff;font-weight:700;color:var(--navy);display:flex;align-items:center;gap:8px}
    .order-item .order-num{display:inline-block;width:26px;height:26px;border-radius:50%;background:var(--navy);color:#fff;text-align:center;line-height:26px;font-weight:900;font-size:.82rem;flex-shrink:0}
    .order-controls{display:flex;gap:4px}
    .order-controls button{padding:4px 8px;border-radius:6px;border:1px solid var(--border);background:#fff;cursor:pointer;font-weight:700;color:var(--navy);font-size:.82rem}
    .pts-map-wrap{background:#fff;border:1px solid var(--border);border-radius:14px;padding:8px;margin:8px 0 12px}
    .pts-map-wrap svg{width:100%;height:auto;display:block;max-height:520px}
    .pts-map-wrap svg path.state{fill:#E2E8F0!important;stroke:#fff!important;stroke-width:.8!important;cursor:pointer;transition:fill 120ms}
    .pts-map-wrap svg path.state:hover{fill:#CBD5E1!important}
    .pts-map-wrap svg path.state.correct{fill:#16A34A!important;cursor:default}
    .pts-map-wrap svg path.state.wrong{fill:#DC2626!important;cursor:default}
    .pts-map-wrap svg path.state.target-reveal{fill:#F59E0B!important;stroke:#0F2147!important;stroke-width:1.4!important}
    .pts-map-wrap svg path.state.selected{fill:#3B82F6!important;cursor:pointer}
    .silhouette-wrap{display:flex;justify-content:center;align-items:center;padding:24px;background:#F8FAFC;border-radius:14px;margin:8px 0;min-height:280px}
    .silhouette-wrap svg{max-width:80%;max-height:280px}
    .silhouette-wrap svg path{fill:#0F2147!important;stroke:none!important}
    .autocomplete-list{max-height:160px;overflow-y:auto;border:1px solid var(--border);border-radius:8px;margin-top:4px;background:#fff;display:none}
    .autocomplete-list.show{display:block}
    .autocomplete-item{padding:8px 12px;cursor:pointer;font-weight:600;color:var(--text)}
    .autocomplete-item:hover,.autocomplete-item.active{background:#F8FAFC;color:var(--navy)}`;

// ─── Page wrapper ─────────────────────────────────────────────────────────
function pageHTML({ lang, slug, title, desc, kw, h1, sub, chip, breadcrumbBody, gameSchema, faqJson, bodyHTML, extraCss = '' }) {
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
${hreflang(slug)}
  <link rel="icon" type="image/svg+xml" href="/favicon.svg?v=5">
  <link rel="stylesheet" href="/css/style.css?v=18">
  <meta property="og:type" content="website">
  <meta property="og:title" content="${h1}">
  <meta property="og:description" content="${desc.slice(0,160)}">
  <meta property="og:url" content="https://statedoku.com${PATHS[lang]}${slug}/">
  <meta property="og:image" content="https://statedoku.com/og/og-learn-state-capitals.png">
  <meta property="og:locale" content="${LOCALE_TAG[lang]}">
  <meta name="twitter:card" content="summary_large_image">
  <meta name="twitter:title" content="${h1}">
  <meta name="twitter:description" content="${desc.slice(0,160)}">
  <meta name="twitter:image" content="https://statedoku.com/og/og-learn-state-capitals.png">
  <style>${SHARED_CSS}${extraCss}</style>
</head>
<body class="legal-body">
<header>
  <a href="${HOME[lang]}" class="logo">State<em>doku</em> <span class="logo-flag">🇺🇸</span></a>
  <nav class="nav-actions"><a href="${PATHS[lang]}" style="color:var(--text-2);text-decoration:none;font-weight:700;font-size:.88rem">${BACK_HUB[lang]}</a></nav>
</header>
<script type="application/ld+json">
{"@context":"https://schema.org","@type":"BreadcrumbList","itemListElement":${breadcrumbBody}}
</script>
<script type="application/ld+json">${gameSchema}</script>
<script type="application/ld+json">${faqJson}</script>
<main>
  <section class="hub-hero">
    <span class="hub-chip">${chip}</span>
    <h1>${h1}</h1>
    <p class="sub">${sub}</p>
  </section>
${bodyHTML}
</main>
${FOOTER[lang]}
</body>
</html>`;
}

function breadcrumbFor(slug, title, lang) {
  const home = lang === 'en' ? {n:'Home',u:'https://statedoku.com/'} : lang === 'fr' ? {n:'Accueil',u:'https://statedoku.com/fr/'} : {n:'Inicio',u:'https://statedoku.com/es/'};
  const hub  = lang === 'en' ? {n:'Play & Learn',u:'https://statedoku.com/play/'} : lang === 'fr' ? {n:'Jouer & Apprendre',u:'https://statedoku.com/fr/play/'} : {n:'Jugar y Aprender',u:'https://statedoku.com/es/play/'};
  const me   = `https://statedoku.com${PATHS[lang]}${slug}/`;
  return `[{"@type":"ListItem","position":1,"name":"${home.n}","item":"${home.u}"},{"@type":"ListItem","position":2,"name":"${hub.n}","item":"${hub.u}"},{"@type":"ListItem","position":3,"name":"${title.replace(/"/g,'\\"')}","item":"${me}"}]`;
}
function gameSchemaFor(g, lang) {
  return JSON.stringify({
    '@context':'https://schema.org','@type':'Game',
    'name': g.titles[lang],
    'description': g.desc[lang],
    'url': `https://statedoku.com${PATHS[lang]}${g.slug}/`,
    'genre': 'Geography Quiz',
    'gamePlatform': 'Web Browser',
    'inLanguage': lang,
    'isAccessibleForFree': true,
    'publisher': { '@type':'Organization', 'name':'Statedoku' },
  });
}
function genericFAQ(g, lang) {
  const Q = {
    en:[
      [`How do you play ${g.titles.en}?`, g.desc.en + ' Scores tracked locally; streak preserved across days.'],
      ['Is this game free?', 'Yes — 100% free, no signup, no ads. Just play.'],
      ['Does it work on mobile?', 'Yes — fully responsive on phones, tablets and desktop.'],
    ],
    fr:[
      [`Comment joue-t-on à ${g.titles.fr} ?`, g.desc.fr + ' Scores enregistrés localement ; streak conservé entre les jours.'],
      ['Le jeu est-il gratuit ?', 'Oui — 100% gratuit, sans inscription, sans pub.'],
      ['Fonctionne-t-il sur mobile ?', 'Oui — entièrement adapté téléphone, tablette et bureau.'],
    ],
    es:[
      [`¿Cómo se juega ${g.titles.es}?`, g.desc.es + ' Puntuaciones guardadas localmente; racha conservada entre días.'],
      ['¿Es gratis?', 'Sí — 100% gratis, sin registro, sin anuncios.'],
      ['¿Funciona en móvil?', 'Sí — totalmente adaptado a teléfono, tableta y escritorio.'],
    ],
  }[lang];
  return JSON.stringify({
    '@context':'https://schema.org','@type':'FAQPage',
    mainEntity: Q.map(([q,a]) => ({'@type':'Question',name:q,acceptedAnswer:{'@type':'Answer',text:a}})),
  });
}

// ─── i18n strings per game ────────────────────────────────────────────────
const T = {
  en:{ round:'Round', score:'Score', lives:'Lives', start:'Start', tryAgain:'Play again', share:'Share result', wellDone:'Well done!', gameOver:'Game over', easy:'Easy', normal:'Normal', hard:'Hard', submit:'Submit', skip:'Skip', categories:'Categories', solved:'Solved', mistakes:'Mistakes', pick4:'Pick 4 states that share a category', placeholder:'Type a state name…' },
  fr:{ round:'Manche', score:'Score', lives:'Vies', start:'Commencer', tryAgain:'Rejouer', share:'Partager', wellDone:'Bravo !', gameOver:'Terminé', easy:'Facile', normal:'Normal', hard:'Difficile', submit:'Valider', skip:'Passer', categories:'Catégories', solved:'Résolu', mistakes:'Erreurs', pick4:'Choisis 4 États qui partagent une catégorie', placeholder:'Tape un nom d’État…' },
  es:{ round:'Ronda', score:'Puntuación', lives:'Vidas', start:'Empezar', tryAgain:'Volver a jugar', share:'Compartir', wellDone:'¡Bien!', gameOver:'Juego terminado', easy:'Fácil', normal:'Normal', hard:'Difícil', submit:'Enviar', skip:'Pasar', categories:'Categorías', solved:'Resuelto', mistakes:'Errores', pick4:'Elige 4 estados que compartan una categoría', placeholder:'Escribe un nombre de estado…' },
};

const SHARE_PREFIX = {
  'place-the-state':'🗺️','state-abbreviations':'✉️','state-capitals-match':'🏛️','state-silhouettes':'🔳','states-connections':'🎯',
  'state-capitals-typing':'⌨️','biggest-cities':'🏙️','state-flags':'🏳️','thirteen-colonies':'🌲','state-admission-order':'⏳',
  'confederate-states':'⚔️','president-birth-states':'🏛️','state-nicknames':'✨','state-mottos':'📜','state-symbols':'🌼',
  'time-zones':'⏰','border-states':'🌎','rivers-mountains':'⛰️','electoral-college':'🗳️','swing-states':'⚖️','no-income-tax-states':'💰'
};

// ─── Generic engine helpers (inlined per page) ────────────────────────────
const ENGINE_JS = lang => `
function shuffle(a){a=a.slice();for(let i=a.length-1;i>0;i--){const j=Math.floor(Math.random()*(i+1));[a[i],a[j]]=[a[j],a[i]];}return a;}
function stars(s,t){const p=s/t;return p>=0.9?3:p>=0.6?2:p>=0.3?1:0;}
function persistResult(slug,score,total,st){try{const k='sds_play_'+slug;const today=new Date().toISOString().slice(0,10);const prev=JSON.parse(localStorage.getItem(k)||'{}');const y=new Date(Date.now()-86400000).toISOString().slice(0,10);const streak=(prev.lastPlayed===today)?(prev.streak||0):(prev.lastPlayed===y)?((prev.streak||0)+1):1;localStorage.setItem(k,JSON.stringify({lastPlayed:today,streak:streak,best:Math.max(prev.best||0,score)}));if(window.gtag)window.gtag('event','play_complete',{game:slug,score:score,total:total,stars:st});}catch(e){}}
async function shareResult(txt){try{if(navigator.share){await navigator.share({text:txt});return;}}catch(e){}try{await navigator.clipboard.writeText(txt);alert(${JSON.stringify(lang==='fr'?'Copié':lang==='es'?'Copiado':'Copied')});}catch(e){alert(txt);}}
function renderResult(rootEl,score,total,T_,slug,sharePrefix){const st=stars(score,total);const filled='★'.repeat(st);const off='☆'.repeat(3-st);rootEl.style.display='block';rootEl.innerHTML='<h2>'+(score>=total*.3?T_.wellDone:T_.gameOver)+'</h2>'+'<div style="font-size:1.05rem;margin-bottom:6px"><strong>'+score+'/'+total+'</strong> ('+Math.round(score/total*100)+'%)</div>'+'<div class="stars"><span>'+filled+'</span><span class="off">'+off+'</span></div>'+'<div style="margin-top:10px"><button class="gbtn gold" onclick="window.location.reload()">'+T_.tryAgain+'</button> <button class="gbtn" id="_share">'+T_.share+'</button></div>';document.getElementById('_share').addEventListener('click',()=>shareResult(sharePrefix+' '+score+'/'+total+' '+('⭐'.repeat(st)+'⬜'.repeat(3-st))+' statedoku.com'+window.location.pathname));persistResult(slug,score,total,st);}
`;

// ─── Game type: MCQ ──────────────────────────────────────────────────────
function renderMCQGame(g, lang, items, opts = {}) {
  const slug = g.slug;
  const t = T[lang];
  const totalRounds = opts.rounds || 15;
  const lives = opts.lives || 3;
  const sharePrefix = SHARE_PREFIX[slug] || '🎮';
  const promptLabel = (opts.promptLabel || {en:'Which state?',fr:'Quel État ?',es:'¿Qué estado?'})[lang];
  const promptClass = opts.promptStyle || ''; // 'small' or 'tiny' or ''
  // Items: [{prompt, answer:'AL', distractors:['AK','AZ',...]}]
  // We'll preserve only state IDs in the data; client picks 3 distractors and shuffles.
  const dataJSON = JSON.stringify(items);
  const stateNames = {};
  STATES.forEach(s => { stateNames[s.id] = s.names[lang] || s.names.en; });
  const stateNamesJSON = JSON.stringify(stateNames);

  const body = `
  <div class="game-wrap">
    <div class="game-panel">
      <span class="lbl">${t.round}</span><span class="val" id="g-round">1/${totalRounds}</span>
      <span class="lbl" style="margin-left:14px">${t.score}</span><span class="val" id="g-score">0</span>
      <span class="lbl" style="margin-left:14px">${t.lives}</span><span class="val" id="g-lives">${'❤️'.repeat(lives)}</span>
    </div>

    <div class="game-card-hero">
      <div class="qlbl">${promptLabel}</div>
      <div class="qval${promptClass?' '+promptClass:''}" id="g-prompt">—</div>
    </div>

    <div class="feedback" id="g-feedback">&nbsp;</div>
    <div class="ab-choices" id="g-choices"></div>

    <div class="controls">
      <button class="gbtn gold" id="g-start">${t.start}</button>
    </div>
    <div class="result-card" id="g-result" style="display:none"></div>
  </div>

  <script>
  (function(){
    ${ENGINE_JS(lang)}
    const ITEMS = ${dataJSON};
    const NAMES = ${stateNamesJSON};
    const SHARE_PREFIX = ${JSON.stringify(sharePrefix)};
    const T_ = ${JSON.stringify(t)};
    const TOTAL = ${totalRounds};
    let queue=[],round=0,score=0,lives=${lives},answered=false;
    const $ = id => document.getElementById(id);

    function pickQueue(){return shuffle(ITEMS).slice(0,TOTAL);}

    function nextRound(){
      answered=false;
      if(round>=TOTAL||queue.length===0)return finish();
      round++;
      const it = queue.shift();
      $('g-round').textContent = round+'/'+TOTAL;
      $('g-prompt').innerHTML = it.prompt;
      // Build 4 choices: correct + 3 random distractors
      const correct = it.answer;
      let pool = it.distractors && it.distractors.length>0 ? it.distractors : Object.keys(NAMES).filter(k=>k!==correct);
      const distractors = shuffle(pool).slice(0,3);
      const choiceIds = shuffle([correct,...distractors]);
      const ch = $('g-choices'); ch.innerHTML='';
      choiceIds.forEach(id => {
        const b = document.createElement('button');
        b.className='ab-choice'; b.textContent=NAMES[id]||id; b.dataset.id=id;
        b.addEventListener('click',()=>answer(b,correct));
        ch.appendChild(b);
      });
      $('g-feedback').innerHTML='&nbsp;';
    }
    function answer(btn,correctId){
      if(answered)return;
      answered=true;
      const correctBtn = Array.from(document.querySelectorAll('.ab-choice')).find(b=>b.dataset.id===correctId);
      if(btn.dataset.id===correctId){
        score++; btn.classList.add('correct');
        $('g-feedback').textContent='✅ '+T_.wellDone;
        $('g-feedback').className='feedback ok';
      } else {
        btn.classList.add('wrong');
        if(correctBtn)correctBtn.classList.add('correct');
        lives--;
        $('g-feedback').textContent='❌ → '+(NAMES[correctId]||correctId);
        $('g-feedback').className='feedback no';
        $('g-lives').textContent='❤️'.repeat(lives)+'\\u{1F90D}'.repeat(${lives}-lives);
        if(lives<=0){setTimeout(finish,800);return;}
      }
      $('g-score').textContent=score;
      setTimeout(nextRound,800);
    }
    function finish(){renderResult($('g-result'),score,TOTAL,T_,${JSON.stringify(slug)},SHARE_PREFIX);}
    $('g-start').addEventListener('click',()=>{
      queue=pickQueue(); round=0; score=0; lives=${lives};
      $('g-lives').textContent='${'❤️'.repeat(lives)}';
      $('g-score').textContent='0'; $('g-result').style.display='none'; $('g-start').style.display='none';
      nextRound();
    });
  })();
  </script>
`;
  return body;
}

// ─── Game type: MapClick (find all states matching a criterion) ──────────
function renderMapClickAllGame(g, lang, targets, opts = {}) {
  // Find ALL N states matching a criterion (e.g. all 11 confederate states).
  const slug = g.slug;
  const t = T[lang];
  const N = targets.length;
  const sharePrefix = SHARE_PREFIX[slug] || '🗺️';
  const promptText = (opts.promptText || {})[lang] || 'Find all matching states.';
  const targetsJSON = JSON.stringify(targets);
  const namesJSON = JSON.stringify(Object.fromEntries(STATES.map(s=>[s.id,s.names[lang]||s.names.en])));
  let svgInline = '';
  try {
    svgInline = fs.readFileSync(path.join(ROOT, 'data/us-map.svg'), 'utf8').replace(/<\?xml[^?]*\?>/, '').trim();
  } catch (e) { svgInline = '<p>Map data unavailable</p>'; }

  return `
  <div class="game-wrap">
    <div class="game-panel">
      <span class="lbl">${t.solved}</span><span class="val" id="g-solved">0/${N}</span>
      <span class="lbl" style="margin-left:14px">${t.mistakes}</span><span class="val" id="g-mistakes">0/${opts.maxMistakes||5}</span>
    </div>

    <div class="game-card-hero">
      <div class="qlbl">${promptText}</div>
      <div class="qval small">${(opts.subtitle||{})[lang]||''}</div>
    </div>

    <div class="feedback" id="g-feedback">&nbsp;</div>

    <div class="pts-map-wrap" id="pts-map-wrap">
${svgInline}
    </div>

    <div class="controls">
      <button class="gbtn gold" id="g-start">${t.start}</button>
    </div>
    <div class="result-card" id="g-result" style="display:none"></div>
  </div>

  <script>
  (function(){
    ${ENGINE_JS(lang)}
    const TARGETS = ${targetsJSON};
    const NAMES = ${namesJSON};
    const SHARE_PREFIX = ${JSON.stringify(sharePrefix)};
    const T_ = ${JSON.stringify(t)};
    const TOTAL = TARGETS.length;
    const MAX_MISTAKES = ${opts.maxMistakes || 5};
    let found = 0, mistakes = 0;
    const targetSet = new Set(TARGETS);
    const $ = id => document.getElementById(id);
    const svg = document.querySelector('#pts-map-wrap svg');
    const paths = svg ? Array.from(svg.querySelectorAll('path.state, [data-usps]')) : [];

    function handleClick(p){
      const usps = p.getAttribute('data-usps') || (p.id || '').replace(/^us-/,'');
      if(!usps || p.classList.contains('correct') || p.classList.contains('wrong'))return;
      if(targetSet.has(usps)){
        p.classList.add('correct'); found++;
        $('g-solved').textContent = found+'/'+TOTAL;
        $('g-feedback').textContent = '✅ '+(NAMES[usps]||usps);
        $('g-feedback').className='feedback ok';
        if(found>=TOTAL){setTimeout(finish,400);return;}
      } else {
        p.classList.add('wrong'); mistakes++;
        $('g-mistakes').textContent = mistakes+'/'+MAX_MISTAKES;
        $('g-feedback').textContent='❌ '+(NAMES[usps]||usps);
        $('g-feedback').className='feedback no';
        if(mistakes>=MAX_MISTAKES){
          // Reveal missing targets
          paths.forEach(x=>{const k=x.getAttribute('data-usps')||x.id.replace(/^us-/,'');if(targetSet.has(k)&&!x.classList.contains('correct'))x.classList.add('target-reveal');});
          setTimeout(finish,1200);return;
        }
      }
    }
    paths.forEach(p=>p.addEventListener('click',()=>handleClick(p)));

    function finish(){renderResult($('g-result'),found,TOTAL,T_,${JSON.stringify(slug)},SHARE_PREFIX);}
    $('g-start').addEventListener('click',()=>{
      found=0; mistakes=0;
      $('g-solved').textContent='0/'+TOTAL;
      $('g-mistakes').textContent='0/'+MAX_MISTAKES;
      $('g-result').style.display='none'; $('g-start').style.display='none';
      paths.forEach(x=>x.classList.remove('correct','wrong','target-reveal'));
      $('g-feedback').innerHTML='&nbsp;';
    });
  })();
  </script>
`;
}

// ─── Game type: Typing (text input + autocomplete) ───────────────────────
function renderTypingGame(g, lang, items, opts = {}) {
  const slug = g.slug;
  const t = T[lang];
  const TOTAL = opts.rounds || 15;
  const lives = opts.lives || 3;
  const sharePrefix = SHARE_PREFIX[slug] || '⌨️';
  const promptLabel = (opts.promptLabel || {en:'Capital of',fr:'Capitale de',es:'Capital de'})[lang];
  const itemsJSON = JSON.stringify(items);

  return `
  <div class="game-wrap">
    <div class="game-panel">
      <span class="lbl">${t.round}</span><span class="val" id="g-round">1/${TOTAL}</span>
      <span class="lbl" style="margin-left:14px">${t.score}</span><span class="val" id="g-score">0</span>
      <span class="lbl" style="margin-left:14px">${t.lives}</span><span class="val" id="g-lives">${'❤️'.repeat(lives)}</span>
    </div>

    <div class="game-card-hero">
      <div class="qlbl">${promptLabel}</div>
      <div class="qval" id="g-prompt">—</div>
    </div>

    <div class="feedback" id="g-feedback">&nbsp;</div>

    <input type="text" class="text-input" id="g-input" placeholder="${t.placeholder}" autocomplete="off" />

    <div class="controls">
      <button class="gbtn gold" id="g-start">${t.start}</button>
      <button class="gbtn" id="g-submit" style="display:none">${t.submit}</button>
      <button class="gbtn" id="g-skip" style="display:none">${t.skip}</button>
    </div>
    <div class="result-card" id="g-result" style="display:none"></div>
  </div>

  <script>
  (function(){
    ${ENGINE_JS(lang)}
    const ITEMS = ${itemsJSON};
    const SHARE_PREFIX = ${JSON.stringify(sharePrefix)};
    const T_ = ${JSON.stringify(t)};
    const TOTAL = ${TOTAL};
    let queue=[],round=0,score=0,lives=${lives};
    const $ = id => document.getElementById(id);

    function normalize(s){return (s||'').toLowerCase().normalize('NFKD').replace(/[\\u0300-\\u036f]/g,'').replace(/[^a-z0-9 ]/g,'').trim();}
    function pickQueue(){return shuffle(ITEMS).slice(0,TOTAL);}

    function nextRound(){
      if(round>=TOTAL||queue.length===0)return finish();
      round++;
      const it = queue.shift();
      $('g-round').textContent = round+'/'+TOTAL;
      $('g-prompt').textContent = it.prompt;
      $('g-prompt').dataset.answer = it.answer;
      $('g-prompt').dataset.altAnswers = JSON.stringify(it.alt||[]);
      $('g-input').value = ''; $('g-input').focus();
      $('g-feedback').innerHTML='&nbsp;';
    }
    function submit(){
      const v = $('g-input').value.trim();
      if(!v)return;
      const correct = $('g-prompt').dataset.answer;
      const alts = JSON.parse($('g-prompt').dataset.altAnswers||'[]');
      const ok = normalize(v) === normalize(correct) || alts.some(a => normalize(v) === normalize(a));
      if(ok){
        score++; $('g-feedback').textContent='✅ '+correct; $('g-feedback').className='feedback ok';
      } else {
        lives--;
        $('g-feedback').textContent='❌ → '+correct;
        $('g-feedback').className='feedback no';
        $('g-lives').textContent='❤️'.repeat(lives)+'\\u{1F90D}'.repeat(${lives}-lives);
        if(lives<=0){setTimeout(finish,800);return;}
      }
      $('g-score').textContent=score;
      setTimeout(nextRound,700);
    }
    function skip(){lives--;$('g-feedback').textContent='⏭ → '+$('g-prompt').dataset.answer;$('g-feedback').className='feedback no';$('g-lives').textContent='❤️'.repeat(lives)+'\\u{1F90D}'.repeat(${lives}-lives);if(lives<=0){setTimeout(finish,800);return;}setTimeout(nextRound,700);}
    function finish(){renderResult($('g-result'),score,TOTAL,T_,${JSON.stringify(slug)},SHARE_PREFIX);}
    $('g-start').addEventListener('click',()=>{
      queue=pickQueue(); round=0; score=0; lives=${lives};
      $('g-lives').textContent='${'❤️'.repeat(lives)}';
      $('g-score').textContent='0'; $('g-result').style.display='none';
      $('g-start').style.display='none'; $('g-submit').style.display='inline-block'; $('g-skip').style.display='inline-block';
      nextRound();
    });
    $('g-submit').addEventListener('click',submit);
    $('g-skip').addEventListener('click',skip);
    $('g-input').addEventListener('keypress',e=>{if(e.key==='Enter')submit();});
  })();
  </script>
`;
}

// ─── Game type: Match (10 left ↔ 10 right) ───────────────────────────────
function renderMatchGame(g, lang, pairs, opts = {}) {
  const slug = g.slug;
  const t = T[lang];
  const N = pairs.length;
  const sharePrefix = SHARE_PREFIX[slug] || '🏛️';
  const subtitle = (opts.subtitle||{})[lang]||'';
  const pairsJSON = JSON.stringify(pairs);

  return `
  <div class="game-wrap">
    <div class="game-panel">
      <span class="lbl">${t.solved}</span><span class="val" id="g-solved">0/${N}</span>
      <span class="lbl" style="margin-left:14px">${t.mistakes}</span><span class="val" id="g-mistakes">0</span>
    </div>

    <div class="game-card-hero">
      <div class="qlbl">${(opts.promptText||{en:'Match states with their capitals',fr:'Associe États et capitales',es:'Empareja estados y capitales'})[lang]}</div>
      <div class="qval small">${subtitle}</div>
    </div>

    <div class="feedback" id="g-feedback">&nbsp;</div>

    <div class="match-grid">
      <div class="match-col" id="g-left"></div>
      <div class="match-col" id="g-right"></div>
    </div>

    <div class="controls">
      <button class="gbtn gold" id="g-start">${t.start}</button>
    </div>
    <div class="result-card" id="g-result" style="display:none"></div>
  </div>

  <script>
  (function(){
    ${ENGINE_JS(lang)}
    const PAIRS = ${pairsJSON};
    const SHARE_PREFIX = ${JSON.stringify(sharePrefix)};
    const T_ = ${JSON.stringify(t)};
    let solved=0, mistakes=0, selectedLeft=null;
    const $ = id => document.getElementById(id);

    function start(){
      solved=0; mistakes=0; selectedLeft=null;
      $('g-solved').textContent='0/'+PAIRS.length;
      $('g-mistakes').textContent='0';
      const lefts = shuffle(PAIRS);
      const rights = shuffle(PAIRS);
      const L=$('g-left'); const R=$('g-right');
      L.innerHTML=''; R.innerHTML='';
      lefts.forEach(p=>{
        const b = document.createElement('div');
        b.className='match-item'; b.textContent=p.left; b.dataset.k=p.k;
        b.addEventListener('click',()=>pickLeft(b));
        L.appendChild(b);
      });
      rights.forEach(p=>{
        const b = document.createElement('div');
        b.className='match-item'; b.textContent=p.right; b.dataset.k=p.k;
        b.addEventListener('click',()=>pickRight(b));
        R.appendChild(b);
      });
      $('g-result').style.display='none'; $('g-start').style.display='none';
      $('g-feedback').innerHTML='&nbsp;';
    }
    function pickLeft(el){
      if(el.classList.contains('paired'))return;
      document.querySelectorAll('#g-left .match-item').forEach(x=>x.classList.remove('selected'));
      el.classList.add('selected'); selectedLeft=el;
    }
    function pickRight(el){
      if(el.classList.contains('paired'))return;
      if(!selectedLeft){return;}
      if(selectedLeft.dataset.k===el.dataset.k){
        selectedLeft.classList.remove('selected'); selectedLeft.classList.add('paired');
        el.classList.add('paired'); solved++;
        $('g-solved').textContent=solved+'/'+PAIRS.length;
        $('g-feedback').textContent='✅ '+T_.wellDone; $('g-feedback').className='feedback ok';
        selectedLeft=null;
        if(solved>=PAIRS.length)setTimeout(finish,600);
      } else {
        mistakes++;
        $('g-mistakes').textContent=mistakes;
        const sl=selectedLeft;
        sl.classList.add('error'); el.classList.add('error');
        $('g-feedback').textContent='❌'; $('g-feedback').className='feedback no';
        setTimeout(()=>{sl.classList.remove('error','selected');el.classList.remove('error');selectedLeft=null;},700);
      }
    }
    function finish(){const score=PAIRS.length-mistakes;renderResult($('g-result'),Math.max(0,score),PAIRS.length,T_,${JSON.stringify(slug)},SHARE_PREFIX);}
    $('g-start').addEventListener('click',start);
  })();
  </script>
`;
}

// ─── Game type: Silhouette (isolated SVG of one state) ───────────────────
function renderSilhouetteGame(g, lang, opts = {}) {
  const slug = g.slug;
  const t = T[lang];
  const TOTAL = opts.rounds || 10;
  const lives = opts.lives || 3;
  const sharePrefix = SHARE_PREFIX[slug] || '🔳';
  const promptLabel = (opts.promptLabel || {en:'Which state is this?',fr:'Quel est cet État ?',es:'¿Qué estado es?'})[lang];
  const namesJSON = JSON.stringify(Object.fromEntries(STATES.map(s=>[s.id,s.names[lang]||s.names.en])));
  // Pre-extract each state's path d attribute
  let svgRaw = '';
  try { svgRaw = fs.readFileSync(path.join(ROOT,'data/us-map.svg'),'utf8'); } catch(e){}
  const pathRegex = /<path\s+id="us-(\w{2})"[^>]*\s+d="([^"]+)"/g;
  const paths = {};
  let m;
  while ((m = pathRegex.exec(svgRaw)) !== null) {
    paths[m[1]] = m[2];
  }
  const pathsJSON = JSON.stringify(paths);

  return `
  <div class="game-wrap">
    <div class="game-panel">
      <span class="lbl">${t.round}</span><span class="val" id="g-round">1/${TOTAL}</span>
      <span class="lbl" style="margin-left:14px">${t.score}</span><span class="val" id="g-score">0</span>
      <span class="lbl" style="margin-left:14px">${t.lives}</span><span class="val" id="g-lives">${'❤️'.repeat(lives)}</span>
    </div>

    <div class="game-card-hero">
      <div class="qlbl">${promptLabel}</div>
    </div>

    <div class="silhouette-wrap" id="g-silh">—</div>

    <div class="feedback" id="g-feedback">&nbsp;</div>
    <div class="ab-choices" id="g-choices"></div>

    <div class="controls">
      <button class="gbtn gold" id="g-start">${t.start}</button>
    </div>
    <div class="result-card" id="g-result" style="display:none"></div>
  </div>

  <script>
  (function(){
    ${ENGINE_JS(lang)}
    const PATHS = ${pathsJSON};
    const NAMES = ${namesJSON};
    const SHARE_PREFIX = ${JSON.stringify(sharePrefix)};
    const T_ = ${JSON.stringify(t)};
    const TOTAL = ${TOTAL};
    let queue=[],round=0,score=0,lives=${lives},answered=false;
    const $ = id => document.getElementById(id);

    function pickQueue(){return shuffle(Object.keys(PATHS)).slice(0,TOTAL);}
    function nextRound(){
      answered=false;
      if(round>=TOTAL||queue.length===0)return finish();
      round++;
      const id = queue.shift();
      $('g-round').textContent = round+'/'+TOTAL;
      // Render isolated silhouette by computing bounding box from path
      const d = PATHS[id];
      // Just use viewBox of original; the state is positioned correctly in it
      $('g-silh').innerHTML = '<svg viewBox="0 0 975 610" preserveAspectRatio="xMidYMid meet"><path d="'+d+'" /></svg>';
      // Auto-fit: compute path bbox client-side
      try {
        const svg = $('g-silh').querySelector('svg');
        const p = svg.querySelector('path');
        const bb = p.getBBox();
        const pad = Math.max(bb.width, bb.height) * 0.08;
        svg.setAttribute('viewBox', (bb.x-pad)+' '+(bb.y-pad)+' '+(bb.width+pad*2)+' '+(bb.height+pad*2));
      } catch(e){}

      const distractors = shuffle(Object.keys(NAMES).filter(k=>k!==id)).slice(0,3);
      const choices = shuffle([id, ...distractors]);
      const ch = $('g-choices'); ch.innerHTML='';
      choices.forEach(cid => {
        const b = document.createElement('button');
        b.className='ab-choice'; b.textContent=NAMES[cid]; b.dataset.id=cid;
        b.addEventListener('click',()=>answer(b,id));
        ch.appendChild(b);
      });
      $('g-feedback').innerHTML='&nbsp;';
    }
    function answer(btn,correctId){
      if(answered)return;
      answered=true;
      const correctBtn = Array.from(document.querySelectorAll('.ab-choice')).find(b=>b.dataset.id===correctId);
      if(btn.dataset.id===correctId){
        score++; btn.classList.add('correct');
        $('g-feedback').textContent='✅ '+T_.wellDone; $('g-feedback').className='feedback ok';
      } else {
        btn.classList.add('wrong');
        if(correctBtn)correctBtn.classList.add('correct');
        lives--;
        $('g-feedback').textContent='❌ → '+NAMES[correctId];
        $('g-feedback').className='feedback no';
        $('g-lives').textContent='❤️'.repeat(lives)+'\\u{1F90D}'.repeat(${lives}-lives);
        if(lives<=0){setTimeout(finish,800);return;}
      }
      $('g-score').textContent=score;
      setTimeout(nextRound,800);
    }
    function finish(){renderResult($('g-result'),score,TOTAL,T_,${JSON.stringify(slug)},SHARE_PREFIX);}
    $('g-start').addEventListener('click',()=>{
      queue=pickQueue(); round=0; score=0; lives=${lives};
      $('g-lives').textContent='${'❤️'.repeat(lives)}';
      $('g-score').textContent='0'; $('g-result').style.display='none'; $('g-start').style.display='none';
      nextRound();
    });
  })();
  </script>
`;
}

// ─── Game type: Connections (16 cells, 4 groups of 4) ────────────────────
function renderConnectionsGame(g, lang, puzzles, opts = {}) {
  const slug = g.slug;
  const t = T[lang];
  const sharePrefix = SHARE_PREFIX[slug] || '🎯';
  const puzzlesJSON = JSON.stringify(puzzles);
  const namesJSON = JSON.stringify(Object.fromEntries(STATES.map(s=>[s.id,s.names[lang]||s.names.en])));

  return `
  <div class="game-wrap">
    <div class="game-panel">
      <span class="lbl">${t.categories}</span><span class="val" id="g-solved">0/4</span>
      <span class="lbl" style="margin-left:14px">${t.mistakes}</span><span class="val" id="g-mistakes">0/4</span>
    </div>

    <div class="game-card-hero">
      <div class="qlbl">${(opts.promptText||{en:'Find the 4 groups of 4 states',fr:'Trouve les 4 groupes de 4 États',es:'Encuentra los 4 grupos de 4 estados'})[lang]}</div>
      <div class="qval small">${t.pick4}</div>
    </div>

    <div id="g-solved-cats"></div>
    <div class="feedback" id="g-feedback">&nbsp;</div>
    <div class="connections-grid" id="g-grid"></div>

    <div class="controls">
      <button class="gbtn gold" id="g-start">${t.start}</button>
      <button class="gbtn" id="g-submit" style="display:none">${t.submit}</button>
    </div>
    <div class="result-card" id="g-result" style="display:none"></div>
  </div>

  <script>
  (function(){
    ${ENGINE_JS(lang)}
    const PUZZLES = ${puzzlesJSON};
    const NAMES = ${namesJSON};
    const SHARE_PREFIX = ${JSON.stringify(sharePrefix)};
    const T_ = ${JSON.stringify(t)};
    let puzzle=null, mistakes=0, solvedCount=0, selected=new Set(), solvedKeys=new Set();
    const $ = id => document.getElementById(id);

    function pickPuzzle(){return PUZZLES[Math.floor(Math.random()*PUZZLES.length)];}
    function start(){
      puzzle = pickPuzzle();
      mistakes=0; solvedCount=0; selected.clear(); solvedKeys.clear();
      $('g-solved').textContent='0/4'; $('g-mistakes').textContent='0/4';
      $('g-solved-cats').innerHTML='';
      $('g-result').style.display='none'; $('g-start').style.display='none'; $('g-submit').style.display='inline-block';
      $('g-feedback').innerHTML='&nbsp;';
      const tiles = shuffle(puzzle.categories.flatMap(c => c.states));
      const grid = $('g-grid'); grid.innerHTML='';
      tiles.forEach(id => {
        const c = document.createElement('div');
        c.className='conn-cell'; c.textContent=NAMES[id]; c.dataset.id=id;
        c.addEventListener('click',()=>toggle(c));
        grid.appendChild(c);
      });
    }
    function toggle(c){
      if(c.classList.contains('solved-1')||c.classList.contains('solved-2')||c.classList.contains('solved-3')||c.classList.contains('solved-4'))return;
      if(c.classList.contains('selected')){c.classList.remove('selected');selected.delete(c.dataset.id);return;}
      if(selected.size>=4)return;
      c.classList.add('selected'); selected.add(c.dataset.id);
    }
    function submit(){
      if(selected.size!==4){return;}
      const chosen = Array.from(selected);
      const cat = puzzle.categories.find(c => c.states.every(s => chosen.includes(s)) && chosen.every(s => c.states.includes(s)));
      if(cat){
        solvedCount++; solvedKeys.add(cat.label);
        $('g-solved').textContent=solvedCount+'/4';
        const catEl = document.createElement('div');
        catEl.className='conn-cat cat-'+solvedCount; catEl.textContent=cat.label;
        $('g-solved-cats').appendChild(catEl);
        Array.from(document.querySelectorAll('.conn-cell.selected')).forEach(x=>{x.classList.remove('selected');x.classList.add('solved-'+solvedCount);});
        selected.clear();
        $('g-feedback').textContent='✅ '+cat.label; $('g-feedback').className='feedback ok';
        if(solvedCount>=4){setTimeout(finish,600);return;}
      } else {
        mistakes++;
        $('g-mistakes').textContent=mistakes+'/4';
        Array.from(document.querySelectorAll('.conn-cell.selected')).forEach(x=>{x.classList.remove('selected');});
        selected.clear();
        $('g-feedback').textContent='❌'; $('g-feedback').className='feedback no';
        if(mistakes>=4){setTimeout(finish,600);return;}
      }
    }
    function finish(){renderResult($('g-result'),solvedCount,4,T_,${JSON.stringify(slug)},SHARE_PREFIX);}
    $('g-start').addEventListener('click',start);
    $('g-submit').addEventListener('click',submit);
  })();
  </script>
`;
}

// ─── Game type: Order (sort states by criterion) ─────────────────────────
function renderOrderGame(g, lang, items, opts = {}) {
  const slug = g.slug;
  const t = T[lang];
  const sharePrefix = SHARE_PREFIX[slug] || '⏳';
  const namesJSON = JSON.stringify(Object.fromEntries(STATES.map(s=>[s.id,s.names[lang]||s.names.en])));
  // items: [{id, value}] — list of states to be reordered by value (asc)

  return `
  <div class="game-wrap">
    <div class="game-panel">
      <span class="lbl">${t.score}</span><span class="val" id="g-score">—</span>
    </div>

    <div class="game-card-hero">
      <div class="qlbl">${(opts.promptText||{en:'Order the states',fr:'Classe les États',es:'Ordena los estados'})[lang]}</div>
      <div class="qval small">${(opts.subtitle||{en:'Use the arrows to reorder',fr:'Utilise les flèches pour réorganiser',es:'Usa las flechas para reordenar'})[lang]}</div>
    </div>

    <div class="order-list" id="g-list"></div>

    <div class="feedback" id="g-feedback">&nbsp;</div>

    <div class="controls">
      <button class="gbtn gold" id="g-start">${t.start}</button>
      <button class="gbtn" id="g-submit" style="display:none">${t.submit}</button>
    </div>
    <div class="result-card" id="g-result" style="display:none"></div>
  </div>

  <script>
  (function(){
    ${ENGINE_JS(lang)}
    const ITEMS_BANK = ${JSON.stringify(items)};
    const NAMES = ${namesJSON};
    const SHARE_PREFIX = ${JSON.stringify(sharePrefix)};
    const T_ = ${JSON.stringify(t)};
    const N = 8;
    let order=[];
    const $ = id => document.getElementById(id);

    function pickList(){
      const sample = shuffle(ITEMS_BANK).slice(0,N);
      order = shuffle(sample.map(s=>s.id));
      return { sample: sample, order: order };
    }
    function render(){
      const list = $('g-list'); list.innerHTML='';
      order.forEach((id,i)=>{
        const row = document.createElement('div');
        row.className='order-item';
        row.innerHTML = '<span class="order-num">'+(i+1)+'</span><span style="flex:1">'+NAMES[id]+'</span><span class="order-controls"><button data-act="up">▲</button><button data-act="down">▼</button></span>';
        row.querySelector('button[data-act="up"]').addEventListener('click',()=>move(i,-1));
        row.querySelector('button[data-act="down"]').addEventListener('click',()=>move(i,1));
        list.appendChild(row);
      });
    }
    function move(i,d){const ni=i+d;if(ni<0||ni>=order.length)return;[order[i],order[ni]]=[order[ni],order[i]];render();}
    function submit(){
      // Correct order = sample sorted by value ascending
      const sample = ITEMS_BANK.filter(s=>order.includes(s.id));
      const correctOrder = sample.slice().sort((a,b)=>a.value-b.value).map(s=>s.id);
      let score = 0;
      order.forEach((id,i)=>{if(correctOrder[i]===id)score++;});
      $('g-feedback').textContent = score===N ? '✅ Perfect' : '❌ '+score+'/'+N+' correct';
      $('g-feedback').className = score===N?'feedback ok':'feedback no';
      setTimeout(()=>{
        renderResult($('g-result'),score,N,T_,${JSON.stringify(slug)},SHARE_PREFIX);
      }, 800);
    }
    $('g-start').addEventListener('click',()=>{
      pickList();
      $('g-result').style.display='none'; $('g-start').style.display='none'; $('g-submit').style.display='inline-block';
      render();
    });
    $('g-submit').addEventListener('click',submit);
  })();
  </script>
`;
}

// ─── Build datasets per game ──────────────────────────────────────────────
const ID_LIST = STATES.map(s => s.id);

// MCQ — Biggest cities: prompt = "Boston is the biggest city of which state?" → MA
function biggestCitiesItems(lang) {
  const cities = EXTRA.biggest_cities;
  return Object.entries(cities).filter(([id, c]) => id !== '_doc').map(([id, c]) => ({
    prompt: lang === 'fr' ? `${c} est la plus grande ville de quel État ?` : lang === 'es' ? `${c} es la ciudad más grande de qué estado?` : `${c} is the biggest city of which state?`,
    answer: id,
  }));
}

// MCQ — State flags: text-description (since we don't have flag images yet)
function stateFlagsItems(lang) {
  const descriptions = {
    AL: { en:'Crimson Cross of St. Andrew on white', fr:'Croix rouge de Saint-André sur blanc', es:'Cruz roja de San Andrés sobre blanco' },
    AK: { en:'Big Dipper + North Star on blue', fr:'Grande Ourse + étoile polaire sur bleu', es:'Osa Mayor + estrella polar sobre azul' },
    AZ: { en:'Copper star with red/yellow rays + blue bottom', fr:'Étoile cuivre, rayons rouges/jaunes, bleu bas', es:'Estrella cobre, rayos rojos/amarillos, azul abajo' },
    CA: { en:'Bear walking + "California Republic"', fr:'Ours marchant + "California Republic"', es:'Oso caminando + "California Republic"' },
    CO: { en:'Blue/white/blue stripes + "C" with yellow center', fr:'Bandes bleu/blanc/bleu + "C" jaune', es:'Franjas azul/blanco/azul + "C" amarillo' },
    HI: { en:'Union Jack + 8 horizontal stripes', fr:'Union Jack + 8 bandes horizontales', es:'Union Jack + 8 franjas horizontales' },
    MD: { en:'Yellow/black + red/white heraldic pattern', fr:'Motif héraldique jaune/noir + rouge/blanc', es:'Patrón heráldico amarillo/negro + rojo/blanco' },
    NM: { en:'Red sun (Zia symbol) on yellow', fr:'Soleil rouge (Zia) sur jaune', es:'Sol rojo (Zia) sobre amarillo' },
    NY: { en:'State seal on dark blue', fr:'Sceau d\'État sur bleu foncé', es:'Sello estatal sobre azul oscuro' },
    OH: { en:'Pennant/swallowtail shape (unique!)', fr:'Forme fanion (unique !)', es:'Forma banderín (¡única!)' },
    SC: { en:'Palmetto tree + crescent on indigo', fr:'Palmier + croissant sur indigo', es:'Palmera + media luna sobre añil' },
    TN: { en:'Three stars in blue circle on red', fr:'3 étoiles dans cercle bleu sur rouge', es:'3 estrellas en círculo azul sobre rojo' },
    TX: { en:'Lone Star (white) on blue + red/white stripes', fr:'Lone Star (blanche) sur bleu + bandes rouge/blanc', es:'Estrella solitaria (blanca) sobre azul + franjas rojo/blanco' },
    UT: { en:'Beehive + state seal on dark blue', fr:'Ruche + sceau d\'État sur bleu foncé', es:'Colmena + sello estatal sobre azul oscuro' },
    WY: { en:'White bison on blue + state seal', fr:'Bison blanc sur bleu + sceau d\'État', es:'Bisonte blanco sobre azul + sello estatal' },
  };
  return Object.entries(descriptions).map(([id, d]) => ({
    prompt: d[lang] || d.en,
    answer: id,
  }));
}

// MCQ — State nicknames: nickname → state
function stateNicknamesItems(lang) {
  return Object.entries(EXTRA.states).map(([id, s]) => ({
    prompt: s.nickname,
    answer: id,
  }));
}

// MCQ — State mottos: motto → state
function stateMottosItems(lang) {
  return Object.entries(EXTRA.states).filter(([id,s])=>s.motto).map(([id, s]) => ({
    prompt: s.motto,
    answer: id,
  }));
}

// MCQ — State symbols (bird/flower/tree) → state
function stateSymbolsItems(lang) {
  const items = [];
  Object.entries(EXTRA.states).forEach(([id, s]) => {
    if (s.bird) items.push({ prompt: (lang==='fr'?'Oiseau d\'État : ':lang==='es'?'Ave estatal: ':'State bird: ') + s.bird, answer: id });
    if (s.flower) items.push({ prompt: (lang==='fr'?'Fleur d\'État : ':lang==='es'?'Flor estatal: ':'State flower: ') + s.flower, answer: id });
    if (s.tree) items.push({ prompt: (lang==='fr'?'Arbre d\'État : ':lang==='es'?'Árbol estatal: ':'State tree: ') + s.tree, answer: id });
  });
  return items;
}

// MCQ — Time zones: state name → which time zone
function timeZonesItems(lang) {
  // Reverse: prompt = "Texas" → which time zone (Central)? Actually let's flip the engine:
  // Use the MCQ where prompt = state name (label), and choices are 4 time-zone strings.
  // We'll fake this by encoding choices in the MCQ — but our engine expects state IDs.
  // Easier: prompt = "Pacific Time" → which state? (random representative)
  const tzNames = { eastern:'Eastern Time', central:'Central Time', mountain:'Mountain Time', pacific:'Pacific Time', alaska:'Alaska Time', hawaii:'Hawaii Time' };
  const tzNames_fr = { eastern:'Heure de l\'Est', central:'Heure Centrale', mountain:'Heure des Rocheuses', pacific:'Heure du Pacifique', alaska:'Heure d\'Alaska', hawaii:'Heure d\'Hawaï' };
  const tzNames_es = { eastern:'Hora del Este', central:'Hora Central', mountain:'Hora de las Montañas', pacific:'Hora del Pacífico', alaska:'Hora de Alaska', hawaii:'Hora de Hawái' };
  const tzMap = { en: tzNames, fr: tzNames_fr, es: tzNames_es };
  return STATES.map(s => ({
    prompt: (lang==='fr'?'Fuseau de ':lang==='es'?'Zona de ':'Time zone of ') + s.names[lang] || s.names.en + '?',
    answer: s.id,
    // Distractors: states with different tz
    distractors: STATES.filter(x => x.timezone !== s.timezone).map(x => x.id),
  })).slice(0, 30); // limit
}

// MCQ — Electoral college
function electoralCollegeItems(lang) {
  return Object.entries(EXTRA.states).map(([id, s]) => ({
    prompt: (lang==='fr'?'Combien de grands électeurs pour ':lang==='es'?'¿Cuántos votos electorales tiene ':'How many electoral votes does ') + stateName(id, lang) + (lang==='fr'?' ?':lang==='es'?'?':'?'),
    answer: String(s.electoralVotes),
    // For MCQ we need an "answer" field that maps to a button. The base MCQ uses state IDs.
    // For numeric MCQ, we override the engine. Skip for now — use a typing variant.
  }));
}

// President-birth-states: president → state
function presidentBirthItems(lang) {
  const items = [];
  Object.entries(EXTRA.states).forEach(([id, s]) => {
    (s.presidents || []).forEach(p => {
      if (p.includes('(Confederate)') || p.includes('(born)') || p.includes('(raised)')) return; // skip ambiguous
      items.push({
        prompt: p,
        answer: id,
      });
    });
  });
  return items;
}

// Capitals typing
function capitalsTypingItems(lang) {
  return STATES.map(s => ({
    prompt: s.names[lang] || s.names.en,
    answer: s.capital,
    alt: [],
  }));
}

// Capitals match (10-pair sample)
function capitalsMatchPairs(lang) {
  return STATES.map(s => ({ k: s.id, left: s.names[lang] || s.names.en, right: s.capital }));
}

// Confederate states
function confederateStateIds() { return STATES.filter(s => s.confederate).map(s => s.id); }
function originalThirteenIds() { return STATES.filter(s => s.original13).map(s => s.id); }
function swingStateIds() { return EXTRA.swing_states_2024; }
function noIncomeTaxIds() { return STATES.filter(s => s.noIncomeTax).map(s => s.id); }
function borderCanadaIds() { return STATES.filter(s => s.bordersCanada).map(s => s.id); }
function borderMexicoIds() { return STATES.filter(s => s.bordersMexico).map(s => s.id); }

// Border states (mapClick all) — combine canada + mexico
function borderStateIds() { return Array.from(new Set([...borderCanadaIds(), ...borderMexicoIds()])); }

// Rivers/Mountains MCQ
function riversItems(lang) {
  return Object.entries(EXTRA.rivers_landmarks).filter(([id,v])=>id!=='_doc').map(([id, landmark]) => ({
    prompt: landmark,
    answer: id,
  }));
}

// Order — state admission
function admissionOrderItems() {
  return STATES.map(s => ({ id: s.id, value: s.admitted }));
}

// Connections puzzles (4 categories of 4 states)
function connectionsPuzzles(lang) {
  const cat = (label, ids) => ({ label, states: ids.slice(0,4) });
  // Build a few diverse puzzles based on existing state attributes
  return [
    {
      categories: [
        cat(lang==='fr'?'États frontaliers du Canada':lang==='es'?'Frontera con Canadá':'Border Canada', shuffle(borderCanadaIds()).slice(0,4)),
        cat(lang==='fr'?'États sans impôt sur le revenu':lang==='es'?'Sin impuesto sobre la renta':'No income tax', shuffle(noIncomeTaxIds()).slice(0,4)),
        cat(lang==='fr'?'États confédérés':lang==='es'?'Estados confederados':'Confederate states', shuffle(confederateStateIds()).slice(0,4)),
        cat(lang==='fr'?'13 colonies originelles':lang==='es'?'13 colonias originales':'Original 13 colonies', shuffle(originalThirteenIds()).slice(0,4)),
      ],
    },
    {
      categories: [
        cat(lang==='fr'?'Côte Pacifique':lang==='es'?'Costa Pacífica':'Pacific Coast', STATES.filter(s => s.coastline && s.coastline.includes('pacific')).map(s=>s.id).slice(0,4)),
        cat(lang==='fr'?'Sun Belt':lang==='es'?'Sun Belt':'Sun Belt', STATES.filter(s => s.sunBelt).map(s=>s.id).slice(0,4)),
        cat(lang==='fr'?'Bible Belt':lang==='es'?'Bible Belt':'Bible Belt', STATES.filter(s => s.bibleBelt).map(s=>s.id).slice(0,4)),
        cat(lang==='fr'?'Frontaliers du Mexique':lang==='es'?'Frontera con México':'Border Mexico', borderMexicoIds().slice(0,4)),
      ],
    },
    {
      categories: [
        cat(lang==='fr'?'Swing states 2024':lang==='es'?'Estados bisagra 2024':'2024 Swing states', shuffle(swingStateIds()).slice(0,4)),
        cat(lang==='fr'?'Sans accès à la mer':lang==='es'?'Sin salida al mar':'Landlocked', STATES.filter(s => s.landlocked).map(s=>s.id).slice(0,4)),
        cat(lang==='fr'?'Patrimoine espagnol':lang==='es'?'Herencia española':'Spanish heritage', STATES.filter(s => s.spanishHeritage).map(s=>s.id).slice(0,4)),
        cat(lang==='fr'?'États du Rust Belt':lang==='es'?'Rust Belt':'Rust Belt', STATES.filter(s => s.rustBelt).map(s=>s.id).slice(0,4)),
      ],
    },
  ];
}

// ─── Game configs (registry) ──────────────────────────────────────────────
const GAMES = {
  'state-capitals-match': {
    titles:{en:'State Capitals Match',fr:'Mémo Capitales d\'États',es:'Empareja Estados y Capitales'},
    desc:{en:'Match 10 US states with their capitals.',fr:'Associe les 10 États avec leurs capitales.',es:'Empareja los 10 estados con sus capitales.'},
    kw:{en:'state capitals match game, match states and capitals',fr:'memo capitales etats americains',es:'juego empareja estados capitales'},
    chip:'🏛️ CAPITALS', type:'match',
  },
  'state-silhouettes': {
    titles:{en:'State Silhouettes',fr:'Silhouettes d\'États',es:'Siluetas de Estados'},
    desc:{en:'Guess the US state from its outline alone.',fr:'Devine l\'État à partir de sa silhouette.',es:'Adivina el estado por su silueta.'},
    kw:{en:'guess the state by shape, state silhouette quiz',fr:'devine etat americain forme',es:'adivina estado por silueta'},
    chip:'🔳 SILHOUETTES', type:'silhouette',
  },
  'states-connections': {
    titles:{en:'States Connections',fr:'Connexions d\'États',es:'Conexiones de Estados'},
    desc:{en:'NYT-Connections style: group 16 US states into 4 hidden categories.',fr:'Style Connections NYT : regroupe 16 États en 4 catégories cachées.',es:'Estilo Connections NYT: agrupa 16 estados en 4 categorías ocultas.'},
    kw:{en:'states connections, nyt connections states',fr:'connections nyt etats unis',es:'connections estados unidos'},
    chip:'🎯 CONNECTIONS', type:'connections',
  },
  'state-capitals-typing': {
    titles:{en:'State Capitals Quiz',fr:'Quiz Capitales',es:'Quiz Capitales'},
    desc:{en:'Type the capital of each US state.',fr:'Tape la capitale de chaque État.',es:'Escribe la capital de cada estado.'},
    kw:{en:'us state capitals quiz, 50 state capitals',fr:'quiz 50 capitales etats unis',es:'quiz 50 capitales estados unidos'},
    chip:'🏛️ TYPE CAPITALS', type:'typing',
  },
  'biggest-cities': {
    titles:{en:'Biggest City Quiz',fr:'Quiz Plus Grande Ville',es:'Quiz Ciudad más Grande'},
    desc:{en:'Identify the biggest city of each US state.',fr:'Identifie la plus grande ville de chaque État.',es:'Identifica la ciudad más grande de cada estado.'},
    kw:{en:'biggest city per state quiz',fr:'quiz plus grande ville etat americain',es:'quiz ciudad mas grande estado'},
    chip:'🏙️ BIG CITIES', type:'mcq',
  },
  'state-flags': {
    titles:{en:'State Flags Quiz',fr:'Quiz Drapeaux d\'États',es:'Quiz Banderas de Estados'},
    desc:{en:'Identify a state from its flag description.',fr:'Identifie l\'État à partir de la description de son drapeau.',es:'Identifica el estado por la descripción de su bandera.'},
    kw:{en:'state flags quiz, us state flag identification',fr:'quiz drapeaux etats americains',es:'quiz banderas estados eeuu'},
    chip:'🏳️ FLAGS', type:'mcq',
  },
  'thirteen-colonies': {
    titles:{en:'13 Original Colonies',fr:'13 Colonies originelles',es:'13 Colonias originales'},
    desc:{en:'Click all 13 original American colonies on the US map.',fr:'Clique sur les 13 colonies originelles sur la carte.',es:'Haz clic en las 13 colonias originales en el mapa.'},
    kw:{en:'13 original colonies quiz, original 13 colonies map',fr:'quiz 13 colonies originelles carte',es:'quiz 13 colonias originales mapa'},
    chip:'🌲 13 COLONIES', type:'mapClickAll',
  },
  'state-admission-order': {
    titles:{en:'State Admission Order',fr:'Ordre d\'admission à l\'Union',es:'Orden de admisión a la Unión'},
    desc:{en:'Order 8 states by their year of admission to the Union.',fr:'Classe 8 États par année d\'admission à l\'Union.',es:'Ordena 8 estados por año de admisión a la Unión.'},
    kw:{en:'state admission order quiz, statehood year quiz',fr:'ordre admission etats union americaine',es:'orden admision estados union'},
    chip:'⏳ STATEHOOD', type:'order',
  },
  'confederate-states': {
    titles:{en:'Confederate States Quiz',fr:'Quiz États Confédérés',es:'Quiz Estados Confederados'},
    desc:{en:'Click all 11 Confederate states of the US Civil War on the map.',fr:'Clique sur les 11 États confédérés sur la carte.',es:'Haz clic en los 11 estados confederados en el mapa.'},
    kw:{en:'confederate states quiz, csa states map',fr:'quiz etats confederation americaine carte',es:'quiz estados confederacion mapa'},
    chip:'⚔️ CONFEDERATION', type:'mapClickAll',
  },
  'president-birth-states': {
    titles:{en:'Presidents by State',fr:'Présidents par État natal',es:'Presidentes por Estado natal'},
    desc:{en:'Match US presidents to their state of birth.',fr:'Associe chaque président américain à son État natal.',es:'Asocia cada presidente con su estado natal.'},
    kw:{en:'us presidents birth state quiz',fr:'quiz presidents americains etat natal',es:'quiz presidentes estados unidos estado natal'},
    chip:'🏛️ PRESIDENTS', type:'mcq',
  },
  'state-nicknames': {
    titles:{en:'State Nicknames Quiz',fr:'Quiz Surnoms d\'États',es:'Quiz Apodos Estatales'},
    desc:{en:'Match nicknames like "Lone Star State" to their US state.',fr:'Associe les surnoms ("Lone Star State"...) aux États.',es:'Asocia apodos ("Lone Star State"...) a sus estados.'},
    kw:{en:'state nicknames quiz, lone star state golden state quiz',fr:'quiz surnoms etats americains',es:'quiz apodos estados unidos'},
    chip:'✨ NICKNAMES', type:'mcq',
  },
  'state-mottos': {
    titles:{en:'State Mottos Quiz',fr:'Quiz Devises d\'États',es:'Quiz Lemas Estatales'},
    desc:{en:'Match each state to its official motto.',fr:'Associe chaque État à sa devise officielle.',es:'Asocia cada estado con su lema oficial.'},
    kw:{en:'state mottos quiz',fr:'quiz devises etats americains',es:'quiz lemas estados unidos'},
    chip:'📜 MOTTOS', type:'mcq',
  },
  'state-symbols': {
    titles:{en:'State Symbols Quiz',fr:'Quiz Symboles d\'États',es:'Quiz Símbolos Estatales'},
    desc:{en:'Match state birds, flowers, and trees to their US state.',fr:'Associe oiseaux, fleurs et arbres officiels à leur État.',es:'Asocia aves, flores y árboles oficiales a su estado.'},
    kw:{en:'state birds flowers trees quiz',fr:'quiz oiseaux fleurs arbres etats',es:'quiz aves flores arboles estados'},
    chip:'🌼 SYMBOLS', type:'mcq',
  },
  'time-zones': {
    titles:{en:'Time Zones Quiz',fr:'Quiz Fuseaux Horaires',es:'Quiz Zonas Horarias'},
    desc:{en:'Identify the time zone of each US state.',fr:'Identifie le fuseau horaire de chaque État.',es:'Identifica la zona horaria de cada estado.'},
    kw:{en:'us time zones quiz',fr:'quiz fuseaux horaires etats unis',es:'quiz zonas horarias estados unidos'},
    chip:'⏰ TIME ZONES', type:'mcq',
  },
  'border-states': {
    titles:{en:'Border States Quiz',fr:'Quiz États Frontaliers',es:'Quiz Estados Fronterizos'},
    desc:{en:'Click all states bordering Canada or Mexico on the US map.',fr:'Clique sur les États frontaliers du Canada et du Mexique sur la carte.',es:'Haz clic en los estados fronterizos con Canadá y México en el mapa.'},
    kw:{en:'states bordering canada mexico quiz',fr:'quiz etats frontaliers canada mexique',es:'quiz estados fronterizos canada mexico'},
    chip:'🌎 BORDERS', type:'mapClickAll',
  },
  'rivers-mountains': {
    titles:{en:'Rivers & Mountains',fr:'Fleuves et Montagnes',es:'Ríos y Montañas'},
    desc:{en:'Match US rivers and mountain landmarks to their states.',fr:'Associe fleuves et montagnes à leurs États.',es:'Asocia ríos y montañas con sus estados.'},
    kw:{en:'us rivers mountains quiz, geography landmarks',fr:'quiz fleuves montagnes etats unis',es:'quiz rios montanas estados unidos'},
    chip:'⛰️ GEO ADV', type:'mcq',
  },
  'electoral-college': {
    titles:{en:'Electoral College Quiz',fr:'Quiz Collège Électoral',es:'Quiz Colegio Electoral'},
    desc:{en:'Test how many electoral votes each state has.',fr:'Teste combien de grands électeurs chaque État possède.',es:'Pon a prueba cuántos votos electorales tiene cada estado.'},
    kw:{en:'electoral college quiz, votes per state quiz',fr:'quiz college electoral americain',es:'quiz colegio electoral eeuu'},
    chip:'🗳️ ELECTORAL', type:'typing-electoral',
  },
  'swing-states': {
    titles:{en:'Swing States Quiz',fr:'Quiz États Bisagra',es:'Quiz Estados Bisagra'},
    desc:{en:'Click all 7 swing states of 2024 on the US map.',fr:'Clique sur les 7 États-pivots de 2024 sur la carte.',es:'Haz clic en los 7 estados bisagra de 2024 en el mapa.'},
    kw:{en:'swing states quiz, 2024 swing states',fr:'quiz etats pivots 2024',es:'quiz estados bisagra 2024'},
    chip:'⚖️ SWING', type:'mapClickAll',
  },
  'no-income-tax-states': {
    titles:{en:'No Income Tax Quiz',fr:'Quiz Sans Impôt sur le Revenu',es:'Quiz Sin Impuesto sobre la Renta'},
    desc:{en:'Click all 9 US states with no state income tax.',fr:'Clique sur les 9 États sans impôt sur le revenu.',es:'Haz clic en los 9 estados sin impuesto sobre la renta.'},
    kw:{en:'no income tax states quiz',fr:'quiz etats sans impot revenu',es:'quiz estados sin impuesto renta'},
    chip:'💰 NO TAX', type:'mapClickAll',
  },
};

// ─── Build pages ──────────────────────────────────────────────────────────
function buildPage(slug, lang) {
  const g = { slug, ...GAMES[slug] };
  const t = T[lang];

  let bodyHTML;
  switch (g.type) {
    case 'mcq': {
      const items = (
        slug === 'biggest-cities' ? biggestCitiesItems(lang)
        : slug === 'state-flags' ? stateFlagsItems(lang)
        : slug === 'state-nicknames' ? stateNicknamesItems(lang)
        : slug === 'state-mottos' ? stateMottosItems(lang)
        : slug === 'state-symbols' ? stateSymbolsItems(lang)
        : slug === 'time-zones' ? timeZonesItems(lang)
        : slug === 'president-birth-states' ? presidentBirthItems(lang)
        : slug === 'rivers-mountains' ? riversItems(lang)
        : []
      );
      const promptStyle = (slug === 'state-mottos' || slug === 'state-flags') ? 'tiny' : (slug === 'state-nicknames' || slug === 'state-symbols' || slug === 'rivers-mountains') ? 'small' : '';
      const promptLabel = {
        'biggest-cities': {en:'Biggest city of which state?',fr:'Plus grande ville de quel État ?',es:'Ciudad más grande de qué estado?'},
        'state-flags':   {en:'Whose flag is this?',fr:'Quel est ce drapeau ?',es:'¿De quién es esta bandera?'},
        'state-nicknames':{en:'Which state has this nickname?',fr:'Quel État porte ce surnom ?',es:'¿Qué estado tiene este apodo?'},
        'state-mottos':  {en:'Whose motto is this?',fr:'À quel État cette devise ?',es:'¿De qué estado es este lema?'},
        'state-symbols': {en:'Which state has this symbol?',fr:'Quel État a ce symbole ?',es:'¿Qué estado tiene este símbolo?'},
        'time-zones':    {en:'In which time zone is this state?',fr:'Dans quel fuseau horaire ?',es:'¿En qué zona horaria?'},
        'president-birth-states':{en:'Born in which state?',fr:'Né dans quel État ?',es:'¿Nació en qué estado?'},
        'rivers-mountains':{en:'In which state is this landmark?',fr:'Dans quel État se trouve ce repère ?',es:'¿En qué estado está este lugar?'},
      }[slug];
      bodyHTML = renderMCQGame(g, lang, items, { rounds: 15, lives: 3, promptLabel, promptStyle });
      break;
    }
    case 'mapClickAll': {
      const targets = (
        slug === 'thirteen-colonies' ? originalThirteenIds()
        : slug === 'confederate-states' ? confederateStateIds()
        : slug === 'swing-states' ? swingStateIds()
        : slug === 'no-income-tax-states' ? noIncomeTaxIds()
        : slug === 'border-states' ? borderStateIds()
        : []
      );
      const promptText = {
        'thirteen-colonies': {en:'Click all 13 original colonies',fr:'Clique sur les 13 colonies originelles',es:'Haz clic en las 13 colonias originales'},
        'confederate-states': {en:'Click all 11 Confederate states',fr:'Clique sur les 11 États confédérés',es:'Haz clic en los 11 estados confederados'},
        'swing-states': {en:'Click all 7 swing states (2024)',fr:'Clique sur les 7 États-pivots (2024)',es:'Haz clic en los 7 estados bisagra (2024)'},
        'no-income-tax-states': {en:'Click all 9 no income tax states',fr:'Clique sur les 9 États sans impôt sur le revenu',es:'Haz clic en los 9 estados sin impuesto sobre la renta'},
        'border-states': {en:'Click all states bordering Canada or Mexico',fr:'Clique sur les États frontaliers du Canada et du Mexique',es:'Haz clic en los estados fronterizos con Canadá y México'},
      }[slug];
      bodyHTML = renderMapClickAllGame(g, lang, targets, { maxMistakes: 5, promptText, subtitle: {en:'5 mistakes allowed',fr:'5 erreurs autorisées',es:'5 errores permitidos'} });
      break;
    }
    case 'typing': {
      const items = capitalsTypingItems(lang);
      const promptLabel = { en:'Capital of:', fr:'Capitale de :', es:'Capital de:' };
      bodyHTML = renderTypingGame(g, lang, items, { rounds: 15, lives: 3, promptLabel });
      break;
    }
    case 'typing-electoral': {
      // Electoral college — text-input for vote count
      const items = Object.entries(EXTRA.states).map(([id, s]) => ({
        prompt: stateName(id, lang),
        answer: String(s.electoralVotes),
        alt: [],
      }));
      const promptLabel = { en:'Electoral votes for:', fr:'Grands électeurs pour :', es:'Votos electorales de:' };
      bodyHTML = renderTypingGame(g, lang, items, { rounds: 15, lives: 3, promptLabel });
      break;
    }
    case 'match': {
      const pairs = capitalsMatchPairs(lang);
      // Pick 10 random pairs each game
      bodyHTML = renderMatchGame(g, lang, shuffleStable(pairs).slice(0, 10), {
        promptText: { en:'Match the 10 states with their capitals', fr:'Associe les 10 États à leurs capitales', es:'Empareja los 10 estados con sus capitales' },
      });
      break;
    }
    case 'silhouette': {
      bodyHTML = renderSilhouetteGame(g, lang, { rounds: 10, lives: 3 });
      break;
    }
    case 'connections': {
      bodyHTML = renderConnectionsGame(g, lang, connectionsPuzzles(lang), {});
      break;
    }
    case 'order': {
      bodyHTML = renderOrderGame(g, lang, admissionOrderItems(), {
        promptText: { en:'Order 8 states by year of admission to the Union (oldest first)', fr:'Classe 8 États par année d\'admission (le plus ancien d\'abord)', es:'Ordena 8 estados por año de admisión (el más antiguo primero)' },
      });
      break;
    }
    default:
      bodyHTML = '<p>Coming soon.</p>';
  }

  const title = `${g.titles[lang]} — Quiz | Statedoku`;
  return pageHTML({
    lang, slug,
    title,
    desc: g.desc[lang],
    kw: g.kw[lang],
    h1: g.titles[lang],
    sub: g.desc[lang],
    chip: g.chip,
    breadcrumbBody: breadcrumbFor(slug, g.titles[lang], lang),
    gameSchema: gameSchemaFor(g, lang),
    faqJson: genericFAQ(g, lang),
    bodyHTML,
  });
}

function shuffleStable(arr) {
  // Deterministic-ish shuffle so generation is idempotent
  const a = arr.slice();
  let seed = 42;
  function rand() { seed = (seed * 1664525 + 1013904223) >>> 0; return seed / 4294967296; }
  for (let i = a.length - 1; i > 0; i--) {
    const j = Math.floor(rand() * (i + 1));
    [a[i], a[j]] = [a[j], a[i]];
  }
  return a;
}
function shuffle(arr) {
  const a = arr.slice();
  for (let i = a.length - 1; i > 0; i--) {
    const j = Math.floor(Math.random() * (i + 1));
    [a[i], a[j]] = [a[j], a[i]];
  }
  return a;
}

// ─── WRITE ─────────────────────────────────────────────────────────────────
const out = [];
for (const slug of Object.keys(GAMES)) {
  for (const lang of LANGS) {
    const dirRel = lang === 'en' ? `play/${slug}` : `${lang}/play/${slug}`;
    const file = path.join(ROOT, dirRel, 'index.html');
    fs.mkdirSync(path.dirname(file), { recursive: true });
    fs.writeFileSync(file, buildPage(slug, lang));
    out.push(dirRel);
  }
}
console.log(out.map(x=>'✅ /'+x+'/').join('\n'));
console.log(`\n${out.length} pages regenerated (${Object.keys(GAMES).length} games × ${LANGS.length} langs).`);
