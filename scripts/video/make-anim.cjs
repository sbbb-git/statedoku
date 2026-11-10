#!/usr/bin/env node
// Animated videos (10 November 2026, the owner: "des trucs vraiment wow"):
// real motion at 30 frames a second instead of still slides. Four scenes of
// anim.html, each a kind of video the account never posted:
//   last-state-standing  seven rules knock states off the map until one is left
//   bounce-out           fifty tiles, bouncing balls, the last tile wins
//   map-builds-itself    the states fly into place in the order they joined (it loops)
//   line-closes          a pen draws a border, name the state before it closes
// Facts come from the game's data (data.cjs) and are asserted here. Writes
// experiments-anim.json (texts) and, in OUT/<slug>/, the frames and
// timeline.json (voice lines and sounds) that render-anim.py turns into MP4s.
//
//   node scripts/video/make-anim.cjs OUT          # frames
//   python3 scripts/video/render-anim.py OUT VOICE.onnx
const fs = require('fs'), path = require('path'), assert = require('assert');
const { chromium } = require('/opt/node-tools/node_modules/playwright');
const { load, ROOT } = require('./data.cjs');
const OUT = process.argv[2], ONLY = process.argv[3], FPS = 30;
const join = a => a.slice(0, -1).join(', ') + ' and ' + a[a.length - 1];

(async () => {
  const D = await load(), S = Object.fromEntries(D.states.map(s => [s.id, s])), ids = D.states.map(s => s.id), name = id => S[id].names.en;
  // Last state standing: the rules, in order; each round removes what is still on the map.
  const RULES = [
    [['coast_atlantic', 'coast_pacific', 'coast_gulf'], 'on an ocean or the Gulf', 'Out: every state on an ocean, or on the Gulf.'],
    [['border_canada'], 'borders Canada', 'Out: every state that borders Canada.'],
    [['on_mississippi'], 'on the Mississippi', 'Out: every state on the Mississippi River.'],
    [['in_mexican_cession'], 'land ceded by Mexico', 'Out: every state with land ceded by Mexico in 1848.'],
    [['on_missouri'], 'on the Missouri River', 'Out: the Missouri River.'],
    [['coast_great_lakes'], 'on a Great Lake', 'Out: the Great Lakes.'],
    [['ohio_river'], 'on the Ohio River', 'Out: the Ohio River.'],
  ];
  let left = ids.slice();
  const rounds = RULES.map(([sets, label, voice]) => { const out = left.filter(i => sets.some(s => D.sets[s].includes(i))); assert(out.length, label); left = left.filter(i => !out.includes(i)); return { label, voice, out }; });
  assert.deepStrictEqual(left, ['OK']); const w = left[0];
  const order = ids.slice().sort((a, b) => S[a].admitted - S[b].admitted || name(a).localeCompare(name(b))).map(id => ({ id, year: S[id].admitted }));
  assert.deepStrictEqual(order.slice(-2).map(o => o.id).sort(), ['AK', 'HI']); assert.strictEqual(order[49].year, 1959);
  const V = [
    { slug: 'w01-last-state-standing', format: 'Last state standing', scene: 'royale',
      params: { rounds, winner: w, hookTop: '50 STATES.\nONE SURVIVES.', hookVoice: 'Fifty states. Seven rules. One survivor. Is yours still alive?',
        winTop: `${name(w).toUpperCase()}\nSURVIVES`, winVoice: `${name(w)} survives. Which round took your state out?`, winBottom: '<span style="font-size:76px">Which round got yours?</span>', winSub: 'A new map puzzle every day' },
      post: '50 states, 7 rules, one survivor. Every round knocks states off the map: oceans, Canada, the Mississippi. Which round took yours out? #geography #maps',
      tiktok: '50 states enter, one survives. Comment the round that took your state out.', yt: '50 states, 7 rules, 1 survivor: is your state still alive?', tags: '#shorts #geography #maps' },
    { slug: 'w02-bounce-out', format: 'Bounce out', scene: 'bounce',
      params: { seed: 1, tiles: ids.slice().sort().map(id => ({ id, name: name(id), capital: S[id].capital, region: S[id].region })), hookTop: 'LAST STATE\nSTANDING WINS', hookVoice: 'Fifty states. The last one standing wins. Find yours.',
        sub: 'Find your state', winVoice: 'Did yours make the final ten?', winSub: 'Did yours make the final ten?' },
      post: 'Fifty state tiles, a few bouncing balls, and the last tile standing wins. Pure chance, oddly tense. Did yours make the final ten? #geography #usa',
      tiktok: '50 states, last one standing wins. Find your state and comment how long it lasted.', yt: '50 states, last one standing wins: find your state', tags: '#shorts #geography #usa' },
    { slug: 'w03-map-builds-itself', format: 'Map builds itself', scene: 'assemble',
      params: { order, hookTop: 'WATCH THE USA\nBUILD ITSELF', hookVoice: 'Every state, in the order it joined the Union. Wait for the last two.', endVoice: 'Alaska and Hawaii, in 1959.', sub: 'In the order the states joined', endSub: 'Alaska and Hawaii came last, in 1959' },
      post: 'The US map building itself: all 50 states fly into place in the order they joined the Union, then it loops. Which one arrived later than you thought? #ushistory #maps',
      tiktok: 'The US map building itself, state by state, in the order they joined the Union. Which one arrived later than you thought?', yt: 'The US map builds itself in statehood order (satisfying loop)', tags: '#shorts #ushistory #maps' },
    { slug: 'w04-line-closes', format: 'Line closes', scene: 'draw',
      params: { states: ['TX', 'ID', 'WV'].map(id => ({ id, name: name(id) })), hookTop: 'NAME IT BEFORE\nTHE LINE CLOSES', hookVoice: 'Name the state before the line closes.', endVoice: 'How many did you get before the end?', endBottom: 'HOW MANY?', endSub: 'Comment your score out of 3' },
      post: 'A pen draws a state border and you have to name it before the line closes. Three states, and the third one is hard. How far did the pen get? #geography #quiz',
      tiktok: 'Name the state before the line closes. Comment how far the pen got when you knew.', yt: 'Name the state before the line closes', tags: '#shorts #geography #quiz' },
  ];
  const DASH = /[‐-―−]/, URL = 'https://statedoku.com/?utm_source=x&utm_medium=video&utm_campaign=';
  const meta = V.map(v => { const tk = `${v.tiktok}\n\nA new US map puzzle every day, free: link in bio.\n\n#geography #usa #50states #maps`;
    const m = { slug: v.slug, format: v.format, series: v.format, title: v.yt, post: `${v.post} ${URL}${v.slug.slice(4)}`, tiktok: tk,
      youtube: { title: v.yt, description: `${v.tiktok}\n\nA new US map puzzle every day, free, no sign-up: statedoku.com (link on the channel page).\n\n${v.tags}` } };
    if (DASH.test(JSON.stringify(m) + JSON.stringify(v.params))) throw new Error('unicode dash in ' + v.slug);
    if (m.post.length > 280) throw new Error('post too long: ' + v.slug); return m; });
  fs.writeFileSync(path.join(__dirname, 'experiments-anim.json'), JSON.stringify(meta, null, 1) + '\n');
  if (!OUT) return console.log('texts written; pass OUT to render frames');
  const logo = 'data:image/png;base64,' + fs.readFileSync(path.join(ROOT, 'logo-mark-192.png')).toString('base64');
  const html = fs.readFileSync(path.join(__dirname, 'anim.html'), 'utf8').replace('LOGO', logo).replace('MAPSVG', fs.readFileSync(path.join(ROOT, 'data/us-map.svg'), 'utf8'));
  const b = await chromium.launch({ executablePath: '/opt/pw-browsers/chromium' });
  await Promise.all(V.filter(v => !ONLY || v.slug.includes(ONLY)).map(async v => {
    const p = await b.newPage({ viewport: { width: 1080, height: 1920 }, deviceScaleFactor: 2 / 3 });
    await p.setContent(html, { waitUntil: 'load' }); await p.evaluate(() => document.fonts.ready);
    const tl = await p.evaluate(([n, P]) => window.setup(n, P), [v.scene, v.params]);
    const dir = path.join(OUT, v.slug); fs.rmSync(dir, { recursive: true, force: true }); fs.mkdirSync(dir, { recursive: true });
    const n = Math.ceil(tl.dur * FPS);
    fs.writeFileSync(path.join(dir, 'timeline.json'), JSON.stringify({ ...tl, frames: n, fps: FPS }));
    for (let i = 0; i < n; i++) { await p.evaluate(t => window.frame(t), i / FPS); await p.screenshot({ path: path.join(dir, `f${String(i).padStart(5, '0')}.jpg`), type: 'jpeg', quality: 88 }); }
    console.log(v.slug, tl.dur.toFixed(1) + ' s', n, 'frames', tl.winner ? 'winner ' + tl.winner : '');
    await p.close();
  }));
  await b.close();
})();
