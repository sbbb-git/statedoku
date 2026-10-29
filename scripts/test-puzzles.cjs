#!/usr/bin/env node
/**
 * Tests the daily grids before every deploy (Coincheur's practice: the core is
 * tested and a red test stops the deploy). Exits 1 on any failure.
 *
 *   1. Grids already played never change: every date from 1 June 2026 to the
 *      day before DATA_FIX3_FROM, in four time zones, against the hashes in
 *      scripts/fixtures/past-grids.json (before 24 October 2026 the grid
 *      depended on the zone, which is why there are four).
 *   2. Every grid from DATA_FIX3_FROM to 30 days past the end of the schedule:
 *      each cell accepts at least two states, the stored solution satisfies
 *      both clues of each cell with nine different states.
 *   3. The same date gives the same grid in every zone (next 60 days, four
 *      zones, including UTC+14).
 *   4. Every clue of the pool has a label in English, French and Spanish, and
 *      no label or gloss holds a unicode dash.
 *
 * Usage: node scripts/test-puzzles.cjs            run the tests
 *        node scripts/test-puzzles.cjs --write-fixture
 *        (only after a deliberate cut-over: it records the current past grids)
 */
const fs = require('fs'), vm = require('vm'), path = require('path'), crypto = require('crypto');
const { spawnSync } = require('child_process');
const ROOT = path.resolve(__dirname, '..');
const FIXTURE = path.join(__dirname, 'fixtures', 'past-grids.json');
const ZONES = ['UTC', 'Europe/Paris', 'America/Los_Angeles', 'Australia/Sydney'];
const FIRST = '2026-06-01';

function load() {
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
    fs.readFileSync(path.join(ROOT, 'js/puzzle.js'), 'utf8'), 'globalThis.__P = Puzzle;',
  ].join('\n;\n'), ctx);
  return ctx.__P;
}
const addDays = (d, n) => { const t = new Date(d + 'T00:00:00Z'); t.setUTCDate(t.getUTCDate() + n); return t.toISOString().slice(0, 10); };
const sig = p => p.rows.join(',') + '|' + p.cols.join(',') + '|' + JSON.stringify(p.solution) + '|' + (p.goldenState || '');
const hash = s => crypto.createHash('sha1').update(s).digest('hex').slice(0, 12);

// Child mode: signatures for a date range in the zone given by TZ.
async function child(from, to) {
  const P = load(), out = {};
  for (let d = from; d <= to; d = addDays(d, 1)) out[d] = hash(sig(await P.getPuzzle(d)));
  process.stdout.write(JSON.stringify(out));
}
function inZone(tz, from, to) {
  const r = spawnSync(process.execPath, [__filename, '--child', from, to], { env: { ...process.env, TZ: tz }, encoding: 'utf8', maxBuffer: 64 << 20 });
  if (r.status !== 0) throw new Error(`child in ${tz} failed: ${r.stderr.slice(0, 400)}`);
  return JSON.parse(r.stdout);
}

(async () => {
  if (process.argv[2] === '--child') return child(process.argv[3], process.argv[4]);
  const P = load(), V = P._v3;
  const lastPast = addDays(V.from, -1);
  let failures = 0;
  const fail = m => { failures++; if (failures <= 20) console.log('FAIL', m); };

  if (process.argv.includes('--write-fixture')) {
    const fx = { from: FIRST, to: lastPast, zones: {} };
    for (const tz of ZONES) fx.zones[tz] = inZone(tz, FIRST, lastPast);
    fs.mkdirSync(path.dirname(FIXTURE), { recursive: true });
    fs.writeFileSync(FIXTURE, JSON.stringify(fx, null, 0) + '\n');
    console.log(`fixture written: ${Object.keys(fx.zones[ZONES[0]]).length} dates x ${ZONES.length} zones`);
    return;
  }

  // 1. Past grids
  const fx = JSON.parse(fs.readFileSync(FIXTURE, 'utf8'));
  let pastChecked = 0;
  for (const tz of ZONES) {
    const now = inZone(tz, fx.from, fx.to);
    for (const [d, h] of Object.entries(fx.zones[tz])) { pastChecked++; if (now[d] !== h) fail(`past grid ${d} changed in ${tz}`); }
  }
  console.log(`past grids: ${pastChecked} checked (${ZONES.length} zones), must be unchanged`);

  // 2. Every v3 grid
  const states = await P.loadStates();
  const sched = fs.readFileSync(path.join(ROOT, 'js/puzzle.js'), 'utf8').match(/const V3_SCHEDULE = '([^']*)'/);
  const days = sched ? sched[1].length / 12 : 0;
  if (!days) fail('V3_SCHEDULE not found in js/puzzle.js');
  const last = addDays(V.from, days + 30);
  let grids = 0, cells = 0;
  for (let d = V.from; d <= last; d = addDays(d, 1)) {
    const p = await P.getPuzzle(d); grids++;
    if (!p || p.rows.length !== 3 || p.cols.length !== 3) { fail(`${d}: no grid`); continue; }
    const used = new Set();
    for (let r = 0; r < 3; r++) for (let c = 0; c < 3; c++) {
      cells++;
      const opts = states.filter(s => P.matches(s, p.rows[r]) && P.matches(s, p.cols[c])).map(s => s.id);
      if (opts.length < 2) fail(`${d} cell ${r},${c}: ${opts.length} answer(s)`);
      const s = p.solution[r][c];
      if (!opts.includes(s)) fail(`${d} cell ${r},${c}: stored answer ${s} does not fit`);
      used.add(s);
    }
    if (used.size !== 9) fail(`${d}: solution repeats a state`);
  }
  console.log(`v3 grids: ${grids} checked (${cells} cells), ${V.from} to ${last}`);

  // 3. Same grid in every zone, next 60 days
  const today = new Date().toISOString().slice(0, 10);
  const start = today > V.from ? today : V.from, end = addDays(start, 59);
  const zones = [...ZONES, 'Pacific/Kiritimati'];
  const ref = inZone(zones[0], start, end);
  let zoneChecked = 0;
  for (const tz of zones.slice(1)) {
    const other = inZone(tz, start, end);
    for (const d of Object.keys(ref)) { zoneChecked++; if (other[d] !== ref[d]) fail(`${d} differs between UTC and ${tz}`); }
  }
  console.log(`time zones: ${zoneChecked} date-zone pairs checked against UTC`);

  // 4. Labels
  const tr = JSON.parse(fs.readFileSync(path.join(ROOT, 'data/translations.json'), 'utf8'));
  const DASH = /[‒–—―]/;
  let labels = 0;
  for (const id of V.ids) for (const lang of ['en', 'fr', 'es']) {
    labels++;
    const l = tr[lang].constraints[id], g = tr[lang].constraint_help[id];
    if (!l) fail(`no ${lang} label for ${id}`);
    if (DASH.test(l || '') || DASH.test(g || '')) fail(`unicode dash in ${lang} ${id}`);
  }
  console.log(`labels: ${labels} checked (${V.ids.length} clues x 3 languages)`);

  if (failures) { console.log(`${failures} failure(s)`); process.exit(1); }
  console.log('all puzzle tests passed');
})().catch(e => { console.error(e); process.exit(1); });
