#!/usr/bin/env node
/**
 * Auto-generate per-article OG images for the 12 new ES + FR learn pages
 * (and update each page's <meta property="og:image"> to point to its own image).
 *
 * Visual: navy gradient bg, gold accent strip, language flag chip, kicker tag,
 * big article title, Statedoku branding. 1200×630.
 */
const fs = require('fs');
const path = require('path');
const sharp = require('/usr/local/lib/node_modules/wrangler/node_modules/sharp');

const ROOT = path.resolve(__dirname, '..');
const OUT = path.join(ROOT, 'og');
fs.mkdirSync(OUT, { recursive: true });

const C = {
  bg: '#0F2147',
  bgDark: '#081530',
  red: '#DC2626',
  gold: '#F59E0B',
  goldSoft: '#FCD34D',
  white: '#FFFFFF',
  textDim: '#94A3B8',
};

// [slug, lang, kicker, title, subtitle, htmlPath, flagEmoji]
const ARTICLES = [
  // ─── ES (6) ─────────────────────────────────────────────────────────
  ['og-es-colegio-electoral',     'es', 'ELECCIONES EE.UU.',     'El Colegio Electoral',          '538 votos · 270 para ganar · 50 estados',                'es/learn/colegio-electoral/index.html',          '🇪🇸'],
  ['og-es-estados-bisagra',       'es', 'ESTADOS PENDULARES',    'Los 7 estados bisagra',         'PA · GA · NC · MI · AZ · WI · NV',                       'es/learn/estados-bisagra/index.html',            '🇪🇸'],
  ['og-es-territorios-eeuu',      'es', 'TERRITORIOS',           'Territorios de EE.UU.',         'Puerto Rico · Guam · Islas Vírgenes · Samoa · Marianas', 'es/learn/territorios-eeuu/index.html',           '🇪🇸'],
  ['og-es-zonas-horarias-eeuu',   'es', 'GEOGRAFÍA',             'Zonas horarias de EE.UU.',      '6 husos horarios · decalaje con España y México',        'es/learn/zonas-horarias-eeuu/index.html',        '🇪🇸'],
  ['og-es-apodos-de-estados',     'es', 'CULTURA',               'Apodos de los 50 estados',      'Lone Star · Golden State · Sunshine State · Aloha State', 'es/learn/apodos-de-estados/index.html',         '🇪🇸'],
  ['og-es-cinturones-eeuu',       'es', 'GEOGRAFÍA CULTURAL',    'Bible Belt, Rust Belt, Sun Belt', 'Los cinturones que dividen culturalmente EE.UU.',      'es/learn/cinturones-eeuu/index.html',            '🇪🇸'],

  // ─── FR (6) ─────────────────────────────────────────────────────────
  ['og-fr-capitales-des-etats',         'fr', 'GÉOGRAPHIE',         'Les 50 capitales des États', 'Sacramento · Austin · Albany · Tallahassee · Olympia',      'fr/learn/capitales-des-etats/index.html',         '🇫🇷'],
  ['og-fr-regions-des-etats-unis',      'fr', 'GÉOGRAPHIE',         'Les 4 régions américaines',  'Nord-Est · Sud · Midwest · Ouest',                          'fr/learn/regions-des-etats-unis/index.html',      '🇫🇷'],
  ['og-fr-drapeaux-des-etats',          'fr', 'SYMBOLES',           'Drapeaux des 50 États',      'Histoire et design de chaque drapeau d\'État',              'fr/learn/drapeaux-des-etats/index.html',          '🇫🇷'],
  ['og-fr-college-electoral',           'fr', 'ÉLECTIONS USA',      'Le Collège Électoral',       '538 grands électeurs · 270 pour gagner',                    'fr/learn/college-electoral/index.html',           '🇫🇷'],
  ['og-fr-fuseaux-horaires-etats-unis', 'fr', 'GÉOGRAPHIE',         'Fuseaux horaires USA',       '6 fuseaux · décalage Paris-NY-LA',                          'fr/learn/fuseaux-horaires-etats-unis/index.html', '🇫🇷'],
  ['og-fr-surnoms-des-etats',           'fr', 'CULTURE',            'Surnoms des 50 États',       'Lone Star · Golden State · Sunshine State · Aloha State',   'fr/learn/surnoms-des-etats/index.html',           '🇫🇷'],
];

// Word-wrap helper: split a long string into N lines fitting maxChars
function wrap(text, maxChars) {
  const words = text.split(' ');
  const lines = [];
  let cur = '';
  for (const w of words) {
    if ((cur + ' ' + w).trim().length <= maxChars) {
      cur = (cur + ' ' + w).trim();
    } else {
      if (cur) lines.push(cur);
      cur = w;
    }
  }
  if (cur) lines.push(cur);
  return lines;
}

function svgFor(kicker, title, subtitle, flag) {
  const W = 1200, H = 630;

  // Wrap title to fit 2 lines at most
  const titleLines = wrap(title, 22).slice(0, 2);
  const titleSize = titleLines.length === 1 ? 92 : 78;
  const titleLineHeight = titleSize * 1.05;

  // Subtitle: small, single line, may need shortening
  let subDisplay = subtitle;
  if (subDisplay.length > 64) subDisplay = subDisplay.slice(0, 61) + '…';

  return `<?xml version="1.0" encoding="UTF-8"?>
<svg xmlns="http://www.w3.org/2000/svg" width="${W}" height="${H}" viewBox="0 0 ${W} ${H}">
  <defs>
    <linearGradient id="bg" x1="0" y1="0" x2="1" y2="1">
      <stop offset="0%" stop-color="${C.bg}"/>
      <stop offset="100%" stop-color="${C.bgDark}"/>
    </linearGradient>
    <linearGradient id="gold" x1="0" y1="0" x2="1" y2="0">
      <stop offset="0%" stop-color="${C.gold}"/>
      <stop offset="100%" stop-color="${C.goldSoft}"/>
    </linearGradient>
  </defs>
  <rect width="${W}" height="${H}" fill="url(#bg)"/>

  <!-- Decorative dot grid (right side) -->
  ${Array.from({length: 10}, (_, r) => Array.from({length: 10}, (_, c) =>
    `<circle cx="${720 + c * 42}" cy="${60 + r * 42}" r="2" fill="${C.white}" opacity="0.06"/>`
  ).join('')).join('')}

  <!-- Gold accent strip (left edge) -->
  <rect x="0" y="0" width="12" height="${H}" fill="url(#gold)"/>

  <!-- Top: branding row -->
  <g transform="translate(72, 80)">
    <text x="0" y="0" font-family="Inter, system-ui, sans-serif" font-size="34" font-weight="900" fill="${C.white}" letter-spacing="-0.025em">
      State<tspan font-style="italic" font-weight="700">doku</tspan>
    </text>
    <text x="220" y="0" font-family="Inter, system-ui, sans-serif" font-size="34" fill="${C.white}">${flag}</text>
  </g>

  <!-- Kicker chip -->
  <g transform="translate(72, 170)">
    <rect x="-12" y="-22" width="${Math.max(120, kicker.length * 12 + 24)}" height="38" rx="19" fill="${C.red}"/>
    <text x="0" y="2" font-family="Inter, system-ui, sans-serif" font-size="17" font-weight="800" fill="${C.white}" letter-spacing="0.08em">${kicker}</text>
  </g>

  <!-- Title (1 or 2 lines) -->
  <g transform="translate(72, ${titleLines.length === 1 ? 320 : 280})">
    ${titleLines.map((line, i) => `
    <text x="0" y="${i * titleLineHeight}" font-family="Inter, system-ui, sans-serif" font-size="${titleSize}" font-weight="900" fill="${C.white}" letter-spacing="-0.03em">${line}</text>`).join('')}
  </g>

  <!-- Subtitle -->
  <text x="72" y="${titleLines.length === 1 ? 400 : 460}" font-family="Inter, system-ui, sans-serif" font-size="24" font-weight="500" fill="${C.textDim}" letter-spacing="-0.005em">${subDisplay}</text>

  <!-- Bottom URL -->
  <text x="72" y="${H - 60}" font-family="Inter, system-ui, sans-serif" font-size="22" font-weight="700" fill="${C.gold}" letter-spacing="-0.01em">statedoku.com</text>
</svg>`;
}

async function main() {
  let generated = 0;
  let updated = 0;

  for (const [slug, lang, kicker, title, subtitle, htmlPath, flag] of ARTICLES) {
    // 1. Generate PNG
    const svgStr = svgFor(kicker, title, subtitle, flag);
    const outPng = path.join(OUT, `${slug}.png`);
    await sharp(Buffer.from(svgStr)).png().toFile(outPng);
    generated++;
    console.log(`✅ og/${slug}.png  ←  ${title}`);

    // 2. Update HTML to reference new image
    const fullHtmlPath = path.join(ROOT, htmlPath);
    if (!fs.existsSync(fullHtmlPath)) {
      console.log(`   ⚠️  HTML not found: ${htmlPath}`);
      continue;
    }
    let html = fs.readFileSync(fullHtmlPath, 'utf8');
    const newImg = `https://statedoku.com/og/${slug}.png`;
    const before = html;
    html = html.replace(
      /<meta property="og:image" content="https:\/\/statedoku\.com\/og\/[^"]+">/,
      `<meta property="og:image" content="${newImg}">`
    );
    html = html.replace(
      /<meta name="twitter:image" content="https:\/\/statedoku\.com\/og\/[^"]+">/,
      `<meta name="twitter:image" content="${newImg}">`
    );
    if (html !== before) {
      fs.writeFileSync(fullHtmlPath, html);
      updated++;
    } else {
      console.log(`   ⚠️  No OG/twitter:image meta found in ${htmlPath}`);
    }
  }

  console.log(`\n${generated} OG images generated.`);
  console.log(`${updated} HTML files updated.`);
}

main().catch(e => { console.error(e); process.exit(1); });
