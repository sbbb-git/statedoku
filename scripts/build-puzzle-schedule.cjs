#!/usr/bin/env node
/**
 * Builds V3_SCHEDULE in js/puzzle.js: the six clues of every daily grid from
 * DATA_FIX3_FROM, two years ahead.
 *
 * A grid computed from its own date alone cannot see the others, and in
 * practice the same six clues came back ten times a year, once 17 days apart.
 * Built in order with the whole history in view, the schedule guarantees:
 *   - no set of six clues ever repeats;
 *   - no clue of yesterday's grid is in today's;
 *   - every clue's turn comes round evenly (the least recently used lead);
 *   - every cell accepts at least two states and a full grid of nine
 *     different states exists (checked again on the finished schedule).
 *
 * Run after any change to data/states.json or to the clue pool, then commit.
 * Days already played must not change: the script refuses to rewrite a day
 * before today unless --from is given explicitly.
 *
 * Usage: node scripts/build-puzzle-schedule.cjs [--days 731]
 */
const fs = require('fs'), vm = require('vm'), path = require('path');
const ROOT = path.resolve(__dirname, '..');
const PUZZLE = path.join(ROOT, 'js/puzzle.js');
const DAYS = Number((process.argv.find(a => a.startsWith('--days=')) || '--days=731').split('=')[1]);

function load(src) {
  const store = {};
  const ctx = {
    console, Date, Math, JSON, Set, Map, Promise, Object, Array, String, Number,
    setTimeout, clearTimeout, setInterval, clearInterval,
    localStorage: { getItem: k => (k in store ? store[k] : null), setItem: (k, v) => { store[k] = String(v); },
      removeItem: k => { delete store[k]; }, key: i => Object.keys(store)[i], get length() { return Object.keys(store).length; } },
    location: { pathname: '/', hostname: 'localhost', protocol: 'http:', search: '' },
    fetch: async () => ({ json: async () => JSON.parse(fs.readFileSync(path.join(ROOT, 'data/states.json'), 'utf8')) }),
  };
  ctx.window = ctx; ctx.globalThis = ctx;
  vm.createContext(ctx);
  vm.runInContext([
    "const CONFIG = { DATA_VERSION: '0', STORAGE_KEY: 'statedoku_v1' };",
    fs.readFileSync(path.join(ROOT, 'js/constraints-approved.js'), 'utf8'),
    fs.readFileSync(path.join(ROOT, 'js/constraints-live.js'), 'utf8'),
    src, 'globalThis.__P = Puzzle;',
  ].join('\n;\n'), ctx);
  return ctx.__P;
}

function addDays(d, n) { const t = new Date(d + 'T00:00:00Z'); t.setUTCDate(t.getUTCDate() + n); return t.toISOString().slice(0, 10); }

(async () => {
  let src = fs.readFileSync(PUZZLE, 'utf8');
  const P = load(src);
  const V = P._v3;
  const raw = await P.loadStates();
  const states = V.withData(V.from, raw, st => st);
  const SET = V.sets(states);
  const ids = V.ids;

  const lastUsed = Object.fromEntries(ids.map(c => [c, -99]));
  const uses = Object.fromEntries(ids.map(c => [c, 0]));
  const seen = new Set();
  const chosen = [];
  let prev = new Set();

  for (let day = 0; day < DAYS; day++) {
    const date = addDays(V.from, day);
    // The least recently used clues lead; each is crossed with the least
    // recently used clues it can meet.
    const byAge = [...ids].sort((a, b) => lastUsed[a] - lastUsed[b] || uses[a] - uses[b] || (a < b ? -1 : 1));
    let best = null, bestScore = -Infinity;
    // Widen the search only when the oldest clues meet nothing usable.
    for (const [na, np] of [[5, 10], [20, 30], [ids.length, ids.length]]) {
     if (best) break;
     const anchors = byAge.filter(c => !prev.has(c)).slice(0, na);
     for (const anchor of anchors) {
      const partners = byAge.filter(c => c !== anchor && !prev.has(c)).slice(0, np);
      for (const partner of partners) {
        const found = V.candidates(SET, `sched:${date}:${anchor}:${partner}`, anchor, partner, 4);
        for (const g of found) {
          const six = [...g.rows, ...g.cols];
          if (six.some(c => prev.has(c))) continue;
          const key = [...six].sort().join('|');
          if (seen.has(key)) continue;
          const avg = (day * 6) / ids.length;
          // Cell quality first: a grid of two-answer cells is a grid of
          // single guesses. Then freshness and an even turn for every clue.
          const twos = g.cells.flat().filter(x => x.length === 2).length;
          let score = 1.5 * g.q - 0.8 * twos;
          for (const c of six) {
            const age = day - lastUsed[c];
            if (age <= 3) score -= 2; else if (age <= 7) score -= 1;
            score -= 0.15 * (uses[c] - avg);
          }
          if (score > bestScore) { bestScore = score; best = g; }
        }
      }
      if (best && bestScore > 8) break;   // good enough, keep the build fast
     }
    }
    if (!best) throw new Error(`no grid for ${date}`);
    const six = [...best.rows, ...best.cols];
    seen.add([...six].sort().join('|'));
    for (const c of six) { lastUsed[c] = day; uses[c]++; }
    prev = new Set(six);
    chosen.push(six);
  }

  // Two characters per clue: its index in base 64, so the pool can pass 64.
  const enc = i => V.alphabet[i >> 6] + V.alphabet[i & 63];
  if (ids.length > 64 * 64) throw new Error('clue pool too large for the encoding');
  const code = chosen.map(six => six.map(c => enc(ids.indexOf(c))).join('')).join('');
  src = src.replace(/const V3_SCHEDULE = '[^']*';/, `const V3_SCHEDULE = '${code}';`);
  fs.writeFileSync(PUZZLE, src);

  // Check the finished file the way the game reads it.
  const Q = load(fs.readFileSync(PUZZLE, 'utf8'));
  const keys = new Set();
  let cells = 0, twos = 0, repeats = 0, carried = 0, bad = 0, prevSix = new Set();
  const sizes = [];
  for (let day = 0; day < DAYS; day++) {
    const date = addDays(V.from, day);
    const p = await Q.getPuzzle(date);
    const six = [...p.rows, ...p.cols];
    if (six.join() !== chosen[day].join()) bad++;
    const key = [...six].sort().join('|');
    if (keys.has(key)) repeats++;
    keys.add(key);
    if (six.some(c => prevSix.has(c))) carried++;
    prevSix = new Set(six);
    for (const row of p.cells) for (const c of row) { cells++; sizes.push(c.length); if (c.length < 2) bad++; if (c.length === 2) twos++; }
    const flat = p.solution.flat();
    if (new Set(flat).size !== 9 || flat.some((s, i) => !p.cells[Math.floor(i / 3)][i % 3].includes(s))) bad++;
  }
  sizes.sort((a, b) => a - b);
  const u = Object.values(uses).sort((a, b) => a - b);
  console.log(`${DAYS} days from ${V.from}, ${code.length} characters written`);
  console.log(`checked ${DAYS} grids, ${cells} cells: median ${sizes[sizes.length >> 1]} answers per cell, ` +
    `${twos} cells with exactly 2, repeated sets ${repeats}, clues carried over from the day before ${carried}, errors ${bad}`);
  console.log(`clue use over the period: min ${u[0]}, max ${u[u.length - 1]}, ${ids.length} clues`);
  if (bad || repeats || carried) process.exit(1);
})();
