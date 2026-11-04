// Loads the game's data with the corrections of js/puzzle.js applied (the raw
// data/states.json keeps the old values for the grids already played), and
// every clue's answer set. Facts in the videos come from here and nowhere else.
const fs = require('fs'), vm = require('vm'), path = require('path');
const ROOT = path.resolve(__dirname, '..', '..');
async function load(dateStr = '2026-11-04') {
  const ctx = { console, Date, Math, JSON, Set, Map, Promise, Object, Array, String, Number, setTimeout, clearTimeout,
    localStorage: { getItem: () => null, setItem() {}, removeItem() {}, key: () => null, length: 0 },
    location: { pathname: '/', hostname: 'localhost', protocol: 'http:', search: '' },
    fetch: async () => ({ json: async () => JSON.parse(fs.readFileSync(path.join(ROOT, 'data/states.json'), 'utf8')) }) };
  ctx.window = ctx; ctx.globalThis = ctx; vm.createContext(ctx);
  const src = fs.readFileSync(path.join(ROOT, 'js/puzzle.js'), 'utf8').replace('return { _v3, getPuzzle,', 'return { _withDataFor, _v3, getPuzzle,');
  if (!src.includes('_withDataFor, _v3')) throw new Error('puzzle.js export changed');
  vm.runInContext(["const CONFIG = { DATA_VERSION: '0', STORAGE_KEY: 'x' };",
    fs.readFileSync(path.join(ROOT, 'js/constraints-approved.js'), 'utf8'),
    fs.readFileSync(path.join(ROOT, 'js/constraints-live.js'), 'utf8'), src, 'globalThis.__P = Puzzle;'].join('\n;\n'), ctx);
  const P = ctx.__P, raw = await P.loadStates();
  const tr = JSON.parse(fs.readFileSync(path.join(ROOT, 'data/translations.json'), 'utf8'));
  return P._withDataFor(dateStr, raw, states => {
    const sets = {};
    for (const id of P._v3.ids) sets[id] = states.filter(s => P.matches(s, id)).map(s => s.id);
    return { states: JSON.parse(JSON.stringify(states)), sets, label: id => tr.en.constraints[id], help: id => tr.en.constraint_help[id] };
  });
}
module.exports = { load, ROOT };
if (require.main === module) load().then(d => {
  const s = d.states.find(x => x.id === 'CA');
  console.log(Object.fromEntries(['names','capital','largestCity','capitalIsLargest','admitted','population','areaRank','timezone'].map(k => [k, s[k]])));
  for (const [id, a] of Object.entries(d.sets)) console.log(String(a.length).padStart(2), id.padEnd(26), d.label(id), '|', a.length <= 14 ? a.join(' ') : '');
});
