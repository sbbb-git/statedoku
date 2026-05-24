#!/usr/bin/env node
/**
 * Generate 3 screenshot SVG mockups of the Statedoku game state for press kit:
 *   1. press-screenshot-intro.png   — empty grid with clues, ready to play
 *   2. press-screenshot-mid.png     — partially filled, one wrong guess
 *   3. press-screenshot-solved.png  — completed with green checks
 *
 * Output sizes:
 *   - 1080x720  (general press / aggregators)
 *   - 1920x1280 (high-res for PH / news / blog hero images)
 *   - mobile 540x960 (PH mobile gallery)
 *
 * Uses SVG → PNG via sharp (already a wrangler dep).
 */
const fs = require('fs');
const path = require('path');
const sharp = require('/usr/local/lib/node_modules/wrangler/node_modules/sharp');

const ROOT = path.resolve(__dirname, '..');
const OUT = path.join(ROOT, 'press', 'screenshots');
fs.mkdirSync(OUT, { recursive: true });

// Brand colors (from css/style.css)
const C = {
  navy: '#0F2147',
  navyDark: '#081530',
  navySoft: '#1E3A6B',
  red: '#DC2626',
  gold: '#F59E0B',
  green: '#16A34A',
  bg: '#F7F8FB',
  surface: '#FFFFFF',
  border: '#E2E8F0',
  text: '#0A0A0A',
  text2: '#475569',
  text3: '#94A3B8',
};

// Shared SVG building blocks for the puzzle UI mockup
function header(w) {
  return `
    <rect x="0" y="0" width="${w}" height="64" fill="${C.surface}"/>
    <line x1="0" y1="64" x2="${w}" y2="64" stroke="${C.border}" stroke-width="1"/>
    <text x="32" y="40" font-family="Inter, system-ui, sans-serif" font-size="22" font-weight="900" fill="${C.navy}" letter-spacing="-0.02em">State<tspan font-style="italic" fill="${C.red}">doku</tspan></text>
    <text x="${w - 200}" y="38" font-family="Inter, system-ui, sans-serif" font-size="12" font-weight="700" fill="${C.text2}" letter-spacing="0.05em">PUZZLE · MAY 24 · 3 LIVES</text>
    <circle cx="${w - 28}" cy="34" r="5" fill="${C.green}"/>
    <circle cx="${w - 44}" cy="34" r="5" fill="${C.green}"/>
    <circle cx="${w - 60}" cy="34" r="5" fill="${C.green}"/>
  `;
}

function cellGrid(state, x0, y0, cellSize) {
  // state.cells[r][c] = { letter, status: 'empty'|'filled'|'wrong'|'solved' }
  // state.rowClues[r], state.colClues[c]
  const gap = 8;
  const labelSize = 110;
  const totalW = labelSize + 3 * cellSize + 2 * gap;
  const totalH = labelSize + 3 * cellSize + 2 * gap;

  let svg = '';

  // Column clues (top labels)
  for (let c = 0; c < 3; c++) {
    const cx = x0 + labelSize + c * (cellSize + gap);
    svg += `<g transform="translate(${cx}, ${y0})">
      <rect x="0" y="0" width="${cellSize}" height="${labelSize - 12}" rx="12" fill="${C.navy}"/>
      <foreignObject x="0" y="0" width="${cellSize}" height="${labelSize - 12}">
        <div xmlns="http://www.w3.org/1999/xhtml" style="height:100%;display:flex;align-items:center;justify-content:center;padding:8px;text-align:center;color:#fff;font-family:Inter,system-ui,sans-serif;font-size:13px;font-weight:700;letter-spacing:-0.01em;line-height:1.25;">${state.colClues[c]}</div>
      </foreignObject>
    </g>`;
  }

  // Row clues (left labels)
  for (let r = 0; r < 3; r++) {
    const cy = y0 + labelSize + r * (cellSize + gap);
    svg += `<g transform="translate(${x0}, ${cy})">
      <rect x="0" y="0" width="${labelSize - 12}" height="${cellSize}" rx="12" fill="${C.navy}"/>
      <foreignObject x="0" y="0" width="${labelSize - 12}" height="${cellSize}">
        <div xmlns="http://www.w3.org/1999/xhtml" style="height:100%;display:flex;align-items:center;justify-content:center;padding:8px;text-align:center;color:#fff;font-family:Inter,system-ui,sans-serif;font-size:13px;font-weight:700;letter-spacing:-0.01em;line-height:1.25;">${state.rowClues[r]}</div>
      </foreignObject>
    </g>`;
  }

  // Cells
  for (let r = 0; r < 3; r++) {
    for (let c = 0; c < 3; c++) {
      const cx = x0 + labelSize + c * (cellSize + gap);
      const cy = y0 + labelSize + r * (cellSize + gap);
      const cell = state.cells[r][c];
      let fill = C.surface;
      let stroke = C.border;
      let strokeW = 2;
      let textFill = C.navy;
      if (cell.status === 'wrong') { fill = '#FEE2E2'; stroke = C.red; strokeW = 3; textFill = C.red; }
      if (cell.status === 'solved') { fill = '#DCFCE7'; stroke = C.green; strokeW = 3; textFill = C.green; }
      if (cell.status === 'filled') { fill = '#EEF2FB'; stroke = C.navy; strokeW = 3; textFill = C.navy; }
      svg += `<g transform="translate(${cx}, ${cy})">
        <rect x="0" y="0" width="${cellSize}" height="${cellSize}" rx="12" fill="${fill}" stroke="${stroke}" stroke-width="${strokeW}"/>
        ${cell.letter ? `<text x="${cellSize/2}" y="${cellSize/2 + 14}" text-anchor="middle" font-family="Inter, system-ui, sans-serif" font-size="40" font-weight="900" fill="${textFill}" letter-spacing="-0.02em">${cell.letter}</text>` : ''}
        ${cell.status === 'solved' ? `<text x="${cellSize - 18}" y="20" text-anchor="end" font-family="Inter, system-ui, sans-serif" font-size="11" font-weight="700" fill="${C.green}" letter-spacing="0.05em">✓</text>` : ''}
        ${cell.status === 'wrong' ? `<text x="${cellSize - 18}" y="20" text-anchor="end" font-family="Inter, system-ui, sans-serif" font-size="11" font-weight="700" fill="${C.red}" letter-spacing="0.05em">✕</text>` : ''}
      </g>`;
    }
  }

  return { svg, totalW, totalH };
}

// Three game states — fictional but realistic puzzle layouts
const PUZZLE_INTRO = {
  rowClues: ['Borders Canada', 'On the Pacific coast', 'No state income tax'],
  colClues: ['Original 13 colonies', 'Larger than 500k km²', 'Capital is largest city'],
  cells: [[{}, {}, {}], [{}, {}, {}], [{}, {}, {}]].map(r => r.map(() => ({ letter: '', status: 'empty' }))),
};

const PUZZLE_MID = {
  rowClues: ['Borders Canada', 'On the Pacific coast', 'No state income tax'],
  colClues: ['Original 13 colonies', 'Larger than 500k km²', 'Capital is largest city'],
  cells: [
    [{ letter: 'NH', status: 'filled' }, { letter: 'AK', status: 'filled' }, { letter: 'WA', status: 'wrong' }],
    [{ letter: '', status: 'empty' }, { letter: 'CA', status: 'filled' }, { letter: '', status: 'empty' }],
    [{ letter: '', status: 'empty' }, { letter: '', status: 'empty' }, { letter: 'TX', status: 'filled' }],
  ],
};

const PUZZLE_SOLVED = {
  rowClues: ['Borders Canada', 'On the Pacific coast', 'No state income tax'],
  colClues: ['Original 13 colonies', 'Larger than 500k km²', 'Capital is largest city'],
  cells: [
    [{ letter: 'NH', status: 'solved' }, { letter: 'AK', status: 'solved' }, { letter: 'NH', status: 'solved' }],
    [{ letter: 'CA', status: 'solved' }, { letter: 'CA', status: 'solved' }, { letter: 'CA', status: 'solved' }],
    [{ letter: 'NH', status: 'solved' }, { letter: 'TX', status: 'solved' }, { letter: 'TX', status: 'solved' }],
  ],
};

function bannerBelow(width, kind, y) {
  if (kind === 'intro') {
    return `
      <text x="${width/2}" y="${y}" text-anchor="middle" font-family="Inter, system-ui, sans-serif" font-size="14" fill="${C.text2}">Fill 9 US states so each row AND column match. Tap a cell to pick.</text>
    `;
  }
  if (kind === 'mid') {
    return `
      <g transform="translate(${(width-440)/2}, ${y - 28})">
        <rect width="440" height="50" rx="12" fill="#FEF3C7" stroke="${C.gold}" stroke-width="2"/>
        <text x="220" y="32" text-anchor="middle" font-family="Inter, system-ui, sans-serif" font-size="14" font-weight="700" fill="${C.navy}">1 wrong guess · 2 lives left · Keep going!</text>
      </g>
    `;
  }
  if (kind === 'solved') {
    return `
      <g transform="translate(${(width-540)/2}, ${y - 70})">
        <rect width="540" height="120" rx="20" fill="${C.navy}"/>
        <text x="270" y="48" text-anchor="middle" font-family="Inter, system-ui, sans-serif" font-size="22" font-weight="900" fill="#fff" letter-spacing="-0.02em">Solved! 🇺🇸</text>
        <text x="270" y="78" text-anchor="middle" font-family="Inter, system-ui, sans-serif" font-size="14" fill="rgba(255,255,255,0.8)">Time: 1:42 · 0 mistakes · Streak 7 days</text>
        <text x="270" y="102" text-anchor="middle" font-family="Inter, system-ui, sans-serif" font-size="12" font-weight="700" fill="${C.gold}" letter-spacing="0.1em">SHARE YOUR RESULT</text>
      </g>
    `;
  }
  return '';
}

function buildSVG({ width, height, puzzle, kind, density = 1 }) {
  const cellSize = 110;
  const gridStartY = 96;
  const { svg: gridSvg, totalW, totalH } = cellGrid(puzzle, (width - (110 + 3 * cellSize + 2 * 8))/2, gridStartY, cellSize);
  const bannerY = gridStartY + totalH + 50;
  return `<?xml version="1.0" encoding="UTF-8"?>
<svg xmlns="http://www.w3.org/2000/svg" width="${width}" height="${height}" viewBox="0 0 ${width} ${height}">
  <rect width="${width}" height="${height}" fill="${C.bg}"/>
  ${header(width)}
  ${gridSvg}
  ${bannerBelow(width, kind, bannerY)}
</svg>`;
}

const SIZES = [
  { name: '1080x720',  w: 1080, h: 720 },
  { name: '1920x1280', w: 1920, h: 1280 },
  { name: 'mobile-540x960', w: 540, h: 960 },
];

const STATES = [
  { id: 'intro',  puzzle: PUZZLE_INTRO,  kind: 'intro' },
  { id: 'mid',    puzzle: PUZZLE_MID,    kind: 'mid' },
  { id: 'solved', puzzle: PUZZLE_SOLVED, kind: 'solved' },
];

(async () => {
  let count = 0;
  for (const st of STATES) {
    for (const sz of SIZES) {
      const svg = buildSVG({ width: sz.w, height: sz.h, puzzle: st.puzzle, kind: st.kind });
      const file = path.join(OUT, `press-${st.id}-${sz.name}.png`);
      await sharp(Buffer.from(svg)).png({ quality: 95 }).toFile(file);
      console.log(`✅ ${path.relative(ROOT, file)}`);
      count++;
    }
  }
  // Bonus: 1200x630 OG-size press hero
  for (const st of STATES) {
    const svg = buildSVG({ width: 1200, height: 630, puzzle: st.puzzle, kind: st.kind });
    const file = path.join(OUT, `press-${st.id}-1200x630.png`);
    await sharp(Buffer.from(svg)).png({ quality: 95 }).toFile(file);
    console.log(`✅ ${path.relative(ROOT, file)}`);
    count++;
  }
  console.log(`\n✅ ${count} PNGs written to ${path.relative(ROOT, OUT)}`);
})();
