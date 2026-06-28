#!/usr/bin/env node
/**
 * /widgets/ landing pages — iframe copy-paste hub for teachers/bloggers.
 * Each iframe embed = a backlink to the canonical game URL.
 */
const fs = require('fs');
const path = require('path');
const ROOT = path.resolve(__dirname, '..');

const GAMES = [
  { slug: 'place-the-state', titles: {
      en: 'Place the State',
      fr: "Placer l'État",
      es: 'Coloca el Estado',
    }, desc: {
      en: 'Click the right state on the US map. 10 rounds, 3 lives.',
      fr: "Cliquez sur le bon État sur la carte. 10 manches, 3 vies.",
      es: 'Haz clic en el estado correcto en el mapa. 10 rondas, 3 vidas.',
    } },
  { slug: 'state-capitals-typing', titles: {
      en: 'State Capitals (Typing)',
      fr: 'Capitales des États',
      es: 'Capitales de los Estados',
    }, desc: {
      en: 'Type the capital of each state. 50 questions, no time limit.',
      fr: "Tapez la capitale de chaque État. 50 questions, sans limite de temps.",
      es: 'Escribe la capital de cada estado. 50 preguntas, sin tiempo límite.',
    } },
  { slug: 'state-flags', titles: {
      en: 'State Flags',
      fr: "Drapeaux d'États",
      es: 'Banderas Estatales',
    }, desc: {
      en: 'Match every flag to its state. Quick visual quiz, 4 choices each.',
      fr: 'Associez chaque drapeau à son État. Quiz visuel, 4 choix.',
      es: 'Empareja cada bandera con su estado. Quiz visual, 4 opciones.',
    } },
  { slug: 'state-silhouettes', titles: {
      en: 'State Silhouettes',
      fr: "Silhouettes d'États",
      es: 'Siluetas Estatales',
    }, desc: {
      en: 'Guess the state from its shape alone. Outlines only — no labels.',
      fr: 'Devinez l\'État rien qu\'à sa forme. Contours uniquement.',
      es: 'Adivina el estado por su forma. Solo contornos, sin etiquetas.',
    } },
  { slug: 'state-abbreviations', titles: {
      en: 'USPS State Abbreviations',
      fr: 'Abréviations USPS',
      es: 'Abreviaturas USPS',
    }, desc: {
      en: 'Match every two-letter code to its state. Classroom favorite.',
      fr: 'Associez chaque code à deux lettres à son État.',
      es: 'Empareja cada código de dos letras con su estado.',
    } },
];

const I18N = {
  en: {
    locale: 'en_US',
    title: 'Embeddable US States Quizzes (Free Iframes for Teachers) | Statedoku',
    desc: 'Free embeddable US-states quizzes you can drop into any classroom blog, LMS or learning site. Copy the iframe code — no signup, no fee.',
    h1: 'Embed Statedoku on your site',
    sub: 'Drop any of our US-geography mini-games into your classroom blog, LMS, news article or learning site. Pure iframe — no signup, no fee, no tracking on your visitors beyond what Statedoku already does.',
    instructionsH: 'How to embed',
    instructions: [
      'Pick a game below. Each is fully playable in an iframe.',
      'Copy the snippet under each preview.',
      'Paste it anywhere HTML is allowed (Notion, WordPress, Google Sites, Schoology, Canvas LMS, Squarespace, Wix, Substack…).',
    ],
    rulesH: 'Rules of the road',
    rules: [
      'Free for any educational, journalistic or personal use.',
      'Keep the small "Powered by Statedoku.com" link visible at the bottom of the iframe — that\'s how we keep this free.',
      'No need to ask — just embed. If you publish to a high-traffic site, drop us a note at contact@statedoku.com so we can say thank you.',
    ],
    previewLabel: 'Live preview',
    copyLabel: 'Copy iframe',
    copied: 'Copied!',
    homeCTA: 'Back to Statedoku',
    breadcrumb: { home: 'Home', play: 'Play & Learn', widgets: 'Widgets / Embed' },
  },
  fr: {
    locale: 'fr_FR',
    title: 'Quiz États-Unis à Intégrer (Iframes Gratuits pour Enseignants) | Statedoku',
    desc: 'Quiz géographie US gratuits à intégrer sur n\'importe quel blog scolaire, ENT ou site éducatif. Copie-colle le code iframe — sans inscription.',
    h1: 'Intégrer Statedoku sur ton site',
    sub: 'Insère n\'importe lequel de nos mini-jeux de géographie américaine dans ton blog de classe, ton ENT, ton site éducatif ou ton article. Pur iframe — pas d\'inscription, pas de frais, aucun pistage supplémentaire de tes visiteurs.',
    instructionsH: 'Comment intégrer',
    instructions: [
      'Choisis un jeu ci-dessous. Chacun est entièrement jouable en iframe.',
      'Copie le code sous chaque aperçu.',
      'Colle-le partout où le HTML est autorisé (Notion, WordPress, Google Sites, Pronote, Canvas, Squarespace, Substack…).',
    ],
    rulesH: 'Règles d\'usage',
    rules: [
      'Libre pour tout usage éducatif, journalistique ou personnel.',
      'Garde le petit lien « Powered by Statedoku.com » visible en bas de l\'iframe — c\'est ce qui permet à ce service de rester gratuit.',
      'Pas besoin de demander — intègre directement. Si tu publies sur un site à fort trafic, écris-nous à contact@statedoku.com pour qu\'on puisse te remercier.',
    ],
    previewLabel: 'Aperçu en direct',
    copyLabel: 'Copier l\'iframe',
    copied: 'Copié !',
    homeCTA: 'Retour à Statedoku',
    breadcrumb: { home: 'Accueil', play: 'Jouer & Apprendre', widgets: 'Widgets / Intégrer' },
  },
  es: {
    locale: 'es_ES',
    title: 'Quizzes EE. UU. para Incrustar (Iframes Gratis para Profesores) | Statedoku',
    desc: 'Quizzes gratuitos de geografía estadounidense para incrustar en cualquier blog escolar, LMS o sitio educativo. Copia el iframe — sin registro, sin coste.',
    h1: 'Incrusta Statedoku en tu sitio',
    sub: 'Inserta cualquiera de nuestros mini-juegos de geografía estadounidense en tu blog de clase, LMS, sitio educativo o artículo. Iframe puro — sin registro, sin coste, sin rastreo adicional de tus visitantes.',
    instructionsH: 'Cómo incrustar',
    instructions: [
      'Elige un juego abajo. Cada uno es totalmente jugable en iframe.',
      'Copia el fragmento bajo cada vista previa.',
      'Pégalo donde se permita HTML (Notion, WordPress, Google Sites, Schoology, Canvas LMS, Squarespace, Wix, Substack…).',
    ],
    rulesH: 'Reglas de uso',
    rules: [
      'Gratis para cualquier uso educativo, periodístico o personal.',
      'Mantén visible el pequeño enlace "Powered by Statedoku.com" en la parte inferior — así mantenemos esto gratis.',
      'No hace falta pedir permiso — solo incrústalo. Si publicas en un sitio de mucho tráfico, escríbenos a contact@statedoku.com para que podamos agradecerte.',
    ],
    previewLabel: 'Vista previa en vivo',
    copyLabel: 'Copiar iframe',
    copied: '¡Copiado!',
    homeCTA: 'Volver a Statedoku',
    breadcrumb: { home: 'Inicio', play: 'Jugar y Aprender', widgets: 'Widgets / Incrustar' },
  },
};

const PATHS = { en: '/widgets/', fr: '/fr/widgets/', es: '/es/widgets/' };
const PLAY = { en: '/play/', fr: '/fr/play/', es: '/es/play/' };
const HOME = { en: '/', fr: '/fr/', es: '/es/' };

function hreflang() {
  return `
  <link rel="canonical" href="https://statedoku.com/widgets/">
  <link rel="alternate" hreflang="en" href="https://statedoku.com/widgets/">
  <link rel="alternate" hreflang="fr" href="https://statedoku.com/fr/widgets/">
  <link rel="alternate" hreflang="es" href="https://statedoku.com/es/widgets/">
  <link rel="alternate" hreflang="x-default" href="https://statedoku.com/widgets/">`;
}

function escAttr(s) {
  return s.replace(/&/g, '&amp;').replace(/"/g, '&quot;').replace(/</g, '&lt;');
}
function escHtml(s) {
  return s.replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;');
}

function gameCard(lang, game, i18n) {
  const url = `https://statedoku.com${PLAY[lang]}${game.slug}/?embed=1`;
  const title = game.titles[lang];
  const desc  = game.desc[lang];
  const iframeCode = `<iframe src="${url}" width="100%" height="640" style="border:1px solid #e2e8f0;border-radius:12px;max-width:720px;display:block;margin:24px auto" loading="lazy" title="${escAttr(title + ' — Statedoku')}"></iframe>`;
  return `
  <section class="wg-card">
    <header class="wg-card-h">
      <h2>${escHtml(title)}</h2>
      <p>${escHtml(desc)}</p>
    </header>
    <div class="wg-preview-label">${i18n.previewLabel} ↓</div>
    <div class="wg-preview">
      <iframe src="${url}" width="100%" height="560" loading="lazy" title="${escAttr(title + ' — preview')}" allow="autoplay"></iframe>
    </div>
    <div class="wg-snippet-wrap">
      <textarea class="wg-snippet" readonly onclick="this.select()">${escHtml(iframeCode)}</textarea>
      <button class="wg-copy" data-target type="button">${escHtml(i18n.copyLabel)}</button>
    </div>
  </section>`;
}

function pageHTML(lang) {
  const i18n = I18N[lang];
  const GA = `
  <!-- Google tag (gtag.js) -->
  <script async src="https://www.googletagmanager.com/gtag/js?id=G-P7ZBQNYLS4"></script>
  <script>
    window.dataLayer = window.dataLayer || [];
    function gtag(){dataLayer.push(arguments);}
    gtag('js', new Date());
    gtag('config', 'G-P7ZBQNYLS4');
  </script>
  <!-- adsense-head -->
  <script async src="https://pagead2.googlesyndication.com/pagead/js/adsbygoogle.js?client=ca-pub-1481624152917622"
     crossorigin="anonymous"></script>`;

  const cards = GAMES.map(g => gameCard(lang, g, i18n)).join('\n');

  const breadcrumb = JSON.stringify({
    '@context': 'https://schema.org',
    '@type': 'BreadcrumbList',
    itemListElement: [
      { '@type': 'ListItem', position: 1, name: i18n.breadcrumb.home, item: 'https://statedoku.com' + HOME[lang] },
      { '@type': 'ListItem', position: 2, name: i18n.breadcrumb.play, item: 'https://statedoku.com' + PLAY[lang] },
      { '@type': 'ListItem', position: 3, name: i18n.breadcrumb.widgets, item: 'https://statedoku.com' + PATHS[lang] },
    ],
  });

  return `<!DOCTYPE html>
<html lang="${lang}">
<head>${GA}
  <meta charset="UTF-8">
  <meta name="viewport" content="width=device-width,initial-scale=1.0">
  <meta name="theme-color" content="#0F2147">
  <title>${escHtml(i18n.title)}</title>
  <meta name="description" content="${escAttr(i18n.desc)}">
  <meta name="robots" content="index, follow, max-image-preview:large">
${hreflang()}
  <link rel="icon" type="image/svg+xml" href="/favicon.svg?v=5">
  <link rel="stylesheet" href="https://fonts.googleapis.com/css2?family=Inter:wght@500;700;800&display=swap">
  <meta property="og:type" content="article">
  <meta property="og:title" content="${escAttr(i18n.title)}">
  <meta property="og:description" content="${escAttr(i18n.desc.slice(0,160))}">
  <meta property="og:url" content="https://statedoku.com${PATHS[lang]}">
  <meta property="og:locale" content="${i18n.locale}">
  <script type="application/ld+json">
${breadcrumb}
  </script>
  <style>
    body{margin:0;background:#F7F8FB;color:#0F2147;font-family:'Inter',system-ui,sans-serif;line-height:1.55}
    header.top{padding:14px 20px;background:#fff;border-bottom:1px solid #E2E8F0;display:flex;justify-content:space-between;align-items:center}
    header.top a.logo{font-weight:900;font-size:1.1rem;color:#0F2147;text-decoration:none}
    header.top a.logo em{color:#DC2626;font-style:normal}
    header.top .lang a{color:#0F2147;text-decoration:none;font-weight:700;font-size:.85rem;margin-left:10px;padding:4px 8px;border-radius:6px}
    header.top .lang a.active{background:#0F2147;color:#fff}
    main{max-width:920px;margin:0 auto;padding:24px 16px 60px}
    .wg-hero{text-align:center;padding:14px 0 20px}
    .wg-chip{display:inline-block;padding:4px 14px;border-radius:999px;background:#F59E0B;color:#0F2147;font-weight:800;font-size:.72rem;letter-spacing:.06em;text-transform:uppercase;margin-bottom:12px}
    .wg-hero h1{font-size:clamp(1.8rem,4.6vw,2.8rem);font-weight:900;letter-spacing:-.025em;margin:0 0 12px}
    .wg-hero p{color:#475569;font-size:1.02rem;max-width:680px;margin:0 auto}
    .wg-info{background:#fff;border:1px solid #E2E8F0;border-radius:14px;padding:18px 22px;margin:24px 0 30px;display:grid;grid-template-columns:1fr 1fr;gap:24px}
    @media (max-width:700px){.wg-info{grid-template-columns:1fr}}
    .wg-info h3{font-size:.95rem;color:#0F2147;text-transform:uppercase;letter-spacing:.04em;margin:0 0 8px}
    .wg-info ol,.wg-info ul{margin:0;padding-left:18px;font-size:.92rem;color:#334155}
    .wg-info li{margin:4px 0}
    .wg-card{background:#fff;border:1px solid #E2E8F0;border-radius:14px;padding:18px 18px 22px;margin:18px 0}
    .wg-card-h h2{margin:0 0 4px;font-size:1.25rem;color:#0F2147}
    .wg-card-h p{margin:0 0 12px;color:#475569;font-size:.92rem}
    .wg-preview-label{font-size:.72rem;text-transform:uppercase;letter-spacing:.06em;color:#94A3B8;font-weight:800;margin:6px 0 4px}
    .wg-preview{border-radius:12px;overflow:hidden;border:1px solid #E2E8F0}
    .wg-preview iframe{display:block;width:100%;border:none;background:#F7F8FB}
    .wg-snippet-wrap{display:flex;gap:8px;margin-top:14px;align-items:stretch}
    .wg-snippet{flex:1;font-family:ui-monospace,Menlo,Monaco,monospace;font-size:.78rem;background:#0F2147;color:#F8FAFC;padding:10px 12px;border-radius:8px;border:none;resize:none;min-height:54px;line-height:1.4}
    .wg-copy{background:#F59E0B;color:#0F2147;border:none;border-radius:8px;font-weight:800;padding:0 18px;cursor:pointer;font-size:.85rem;min-width:120px}
    .wg-copy:hover{background:#D97706;color:#fff}
    footer{padding:30px 20px;text-align:center;color:#475569;font-size:.82rem;border-top:1px solid #E2E8F0;margin-top:40px;background:#fff}
    footer a{color:#0F2147;text-decoration:none;font-weight:700}
  </style>
</head>
<body>
<header class="top">
  <a class="logo" href="${HOME[lang]}">State<em>doku</em> 🇺🇸</a>
  <div class="lang">
    <a href="/widgets/" ${lang==='en'?'class="active"':''}>EN</a>
    <a href="/fr/widgets/" ${lang==='fr'?'class="active"':''}>FR</a>
    <a href="/es/widgets/" ${lang==='es'?'class="active"':''}>ES</a>
  </div>
</header>
<main>
  <section class="wg-hero">
    <span class="wg-chip">🎁 ${lang==='en'?'FREE EMBEDS':lang==='fr'?'INTÉGRATION GRATUITE':'INCRUSTACIÓN GRATIS'}</span>
    <h1>${escHtml(i18n.h1)}</h1>
    <p>${escHtml(i18n.sub)}</p>
  </section>

  <section class="wg-info">
    <div>
      <h3>${escHtml(i18n.instructionsH)}</h3>
      <ol>
        ${i18n.instructions.map(s => `<li>${escHtml(s)}</li>`).join('\n        ')}
      </ol>
    </div>
    <div>
      <h3>${escHtml(i18n.rulesH)}</h3>
      <ul>
        ${i18n.rules.map(s => `<li>${escHtml(s)}</li>`).join('\n        ')}
      </ul>
    </div>
  </section>

${cards}

</main>
<footer>
  <a href="${HOME[lang]}">${escHtml(i18n.homeCTA)}</a>
</footer>
<script>
  document.querySelectorAll('.wg-copy').forEach(function(btn){
    btn.addEventListener('click', function(){
      var ta = btn.parentElement.querySelector('.wg-snippet');
      ta.select();
      try { document.execCommand('copy'); } catch(e) {}
      if (navigator.clipboard) { try { navigator.clipboard.writeText(ta.value); } catch(e){} }
      var old = btn.textContent;
      btn.textContent = ${JSON.stringify(i18n.copied)};
      setTimeout(function(){ btn.textContent = old; }, 1400);
    });
  });
</script>
</body>
</html>`;
}

const LANGS = ['en', 'fr', 'es'];
const out = [];
for (const lang of LANGS) {
  const dirRel = lang === 'en' ? 'widgets' : `${lang}/widgets`;
  const file = path.join(ROOT, dirRel, 'index.html');
  fs.mkdirSync(path.dirname(file), { recursive: true });
  fs.writeFileSync(file, pageHTML(lang));
  out.push(dirRel);
}
console.log('✅ ' + out.length + ' /widgets/ landing pages written:');
out.forEach(p => console.log('  ' + p));
