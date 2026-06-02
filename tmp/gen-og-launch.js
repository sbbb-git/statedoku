#!/usr/bin/env node
/**
 * Redesigned launch OG images for the 3 home pages (EN/FR/ES).
 * Replaces the bland text card with one that shows the actual 3×3 puzzle
 * mechanic — the visual hook unique to Statedoku.
 *
 * Output: og/home-en.png, og/home-fr.png, og/home-es.png (1200×630)
 */
const fs = require('fs');
const path = require('path');
const sharp = require('/usr/local/lib/node_modules/wrangler/node_modules/sharp');

const ROOT = path.resolve(__dirname, '..');
const OUT = path.join(ROOT, 'og');
fs.mkdirSync(OUT, { recursive: true });

const C = {
  bg: '#0F2147',         // navy
  bgDark: '#081530',
  cell: '#1A2B52',
  cellBorder: '#2A3D6B',
  filled: '#DCFCE7',     // green-100 (correct)
  filledBorder: '#16A34A',
  filledText: '#166534',
  red: '#DC2626',
  gold: '#F59E0B',
  white: '#FFFFFF',
  textDim: '#94A3B8',
};

// Three example cells filled, six empty — shows the mechanic without spoiling
const GRID = [
  ['AK',  '',   'WA'],
  ['',   'CA',  ''],
  ['NV',  '',   'OR'],
];
const ROW_CLUES = {
  en: ['Borders Canada', 'On the Pacific', 'No income tax'],
  fr: ['Frontière Canada', 'Côte Pacifique', 'Pas d\'impôt'],
  es: ['Limita Canadá', 'Costa Pacífico', 'Sin impuesto'],
};
const COL_CLUES = {
  en: ['Original 13', 'Largest by area', 'Capital = largest'],
  fr: ['13 colonies', 'Plus grand', 'Capitale = la plus grande'],
  es: ['13 colonias', 'Más grande', 'Capital = la mayor'],
};
const TAGLINES = {
  en: { kicker: 'DAILY PUZZLE',     title: 'Sudoku × US geography', sub: 'Fill the grid. Match two clues per cell. New puzzle every day.' },
  fr: { kicker: 'PUZZLE QUOTIDIEN', title: 'Sudoku × géographie US',  sub: 'Remplis la grille. Deux indices par case. Un puzzle par jour.' },
  es: { kicker: 'PUZZLE DIARIO',    title: 'Sudoku × geografía EE.UU.', sub: 'Rellena la cuadrícula. Dos pistas por celda. Puzzle nuevo cada día.' },
};

function svg(lang) {
  const t = TAGLINES[lang];
  const rows = ROW_CLUES[lang];
  const cols = COL_CLUES[lang];

  const W = 1200, H = 630;

  // Layout: left side = title + tagline + URL. Right side = grid.
  const gridSize = 380;
  const cellSize = 100;
  const cellGap = 10;
  const labelSize = 70;
  const gridX = W - gridSize - 80;
  const gridY = (H - gridSize) / 2;

  function cell(r, c) {
    const id = GRID[r][c];
    const filled = !!id;
    const x = gridX + labelSize + c * (cellSize + cellGap);
    const y = gridY + labelSize + r * (cellSize + cellGap);
    return `
    <rect x="${x}" y="${y}" width="${cellSize}" height="${cellSize}" rx="14"
          fill="${filled ? C.filled : C.cell}"
          stroke="${filled ? C.filledBorder : C.cellBorder}" stroke-width="3"/>
    ${filled ? `<text x="${x + cellSize/2}" y="${y + cellSize/2 + 14}" text-anchor="middle"
                font-family="Inter, system-ui, sans-serif" font-size="42" font-weight="900"
                fill="${C.filledText}" letter-spacing="-0.02em">${id}</text>` : ''}`;
  }

  function colClue(c) {
    const x = gridX + labelSize + c * (cellSize + cellGap);
    return `<foreignObject x="${x}" y="${gridY}" width="${cellSize}" height="${labelSize - 8}">
      <div xmlns="http://www.w3.org/1999/xhtml" style="height:100%;display:flex;align-items:center;justify-content:center;padding:4px;text-align:center;color:${C.white};font-family:Inter,system-ui,sans-serif;font-size:11px;font-weight:700;line-height:1.2;background:${C.red};border-radius:8px;letter-spacing:-0.01em">${cols[c]}</div>
    </foreignObject>`;
  }

  function rowClue(r) {
    const y = gridY + labelSize + r * (cellSize + cellGap);
    return `<foreignObject x="${gridX}" y="${y}" width="${labelSize - 8}" height="${cellSize}">
      <div xmlns="http://www.w3.org/1999/xhtml" style="height:100%;display:flex;align-items:center;justify-content:center;padding:4px;text-align:center;color:${C.white};font-family:Inter,system-ui,sans-serif;font-size:11px;font-weight:700;line-height:1.2;background:${C.red};border-radius:8px;letter-spacing:-0.01em">${rows[r]}</div>
    </foreignObject>`;
  }

  let cells = '';
  let colClues = '';
  let rowClues = '';
  for (let r = 0; r < 3; r++) for (let c = 0; c < 3; c++) cells += cell(r, c);
  for (let c = 0; c < 3; c++) colClues += colClue(c);
  for (let r = 0; r < 3; r++) rowClues += rowClue(r);

  return `<?xml version="1.0" encoding="UTF-8"?>
<svg xmlns="http://www.w3.org/2000/svg" width="${W}" height="${H}" viewBox="0 0 ${W} ${H}">
  <!-- Background gradient -->
  <defs>
    <linearGradient id="bg" x1="0" y1="0" x2="1" y2="1">
      <stop offset="0%" stop-color="${C.bg}"/>
      <stop offset="100%" stop-color="${C.bgDark}"/>
    </linearGradient>
  </defs>
  <rect width="${W}" height="${H}" fill="url(#bg)"/>

  <!-- Decorative dots pattern (top right) -->
  ${Array.from({length: 8}, (_, r) => Array.from({length: 12}, (_, c) =>
    `<circle cx="${800 + c * 30}" cy="${30 + r * 30}" r="1.5" fill="${C.white}" opacity="0.07"/>`
  ).join('')).join('')}

  <!-- Left side: branding + title + sub + url -->
  <g transform="translate(80, 110)">
    <text font-family="Inter, system-ui, sans-serif" font-size="32" font-weight="900" fill="${C.white}" letter-spacing="-0.02em">
      State<tspan font-style="italic" fill="${C.red}">doku</tspan>
    </text>
    <text y="22" font-family="Inter, system-ui, sans-serif" font-size="20" fill="${C.gold}" letter-spacing="0.05em" font-weight="700">🇺🇸</text>
  </g>

  <g transform="translate(80, 215)">
    <text font-family="Inter, system-ui, sans-serif" font-size="16" font-weight="800" fill="${C.gold}" letter-spacing="0.18em">${t.kicker}</text>
    <text y="60" font-family="Inter, system-ui, sans-serif" font-size="56" font-weight="900" fill="${C.white}" letter-spacing="-0.03em">${t.title}</text>
    <foreignObject x="0" y="90" width="540" height="180">
      <div xmlns="http://www.w3.org/1999/xhtml" style="color:${C.textDim};font-family:Inter,system-ui,sans-serif;font-size:22px;line-height:1.45;font-weight:500;letter-spacing:-0.005em">${t.sub}</div>
    </foreignObject>
  </g>

  <text x="80" y="580" font-family="Inter, system-ui, sans-serif" font-size="18" font-weight="700" fill="${C.white}" letter-spacing="0.04em">statedoku.com</text>
  <rect x="80" y="588" width="180" height="3" fill="${C.gold}" rx="1.5"/>

  <!-- Right side: the 3×3 grid mockup -->
  ${colClues}
  ${rowClues}
  ${cells}
</svg>`;
}

(async () => {
  for (const lang of ['en', 'fr', 'es']) {
    const svgStr = svg(lang);
    const file = path.join(OUT, `home-${lang}.png`);
    await sharp(Buffer.from(svgStr)).png({ quality: 95 }).toFile(file);
    const stats = fs.statSync(file);
    console.log(`✅ ${path.relative(ROOT, file)} (${(stats.size/1024).toFixed(1)} KB)`);
  }
})();
