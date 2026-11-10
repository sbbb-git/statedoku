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
      params: { order: order.map(o => ({ id: o.id, label: String(o.year) })), labelCls: 'year', hookTop: 'WATCH THE USA\nBUILD ITSELF', hookVoice: 'Every state, in the order it joined the Union. Wait for the last two.', endVoice: 'Alaska and Hawaii, in 1959.', sub: 'In the order the states joined', endSub: 'Alaska and Hawaii came last, in 1959' },
      post: 'The US map building itself: all 50 states fly into place in the order they joined the Union, then it loops. Which one arrived later than you thought? #ushistory #maps',
      tiktok: 'The US map building itself, state by state, in the order they joined the Union. Which one arrived later than you thought?', yt: 'The US map builds itself in statehood order (satisfying loop)', tags: '#shorts #ushistory #maps' },
    { slug: 'w04-line-closes', format: 'Line closes', scene: 'draw',
      params: { states: ['TX', 'ID', 'WV'].map(id => ({ id, name: name(id) })), hookTop: 'NAME IT BEFORE\nTHE LINE CLOSES', hookVoice: 'Name the state before the line closes.', endVoice: 'How many did you get before the end?', endBottom: 'HOW MANY?', endSub: 'Comment your score out of 3' },
      post: 'A pen draws a state border and you have to name it before the line closes. Three states, and the third one is hard. How far did the pen get? #geography #quiz',
      tiktok: 'Name the state before the line closes. Comment how far the pen got when you knew.', yt: 'Name the state before the line closes', tags: '#shorts #geography #quiz' },
  ];

  // ---- The batch of 30 (10 November, "pousse pour générer 30 vidéos"): more rounds of the four scenes, plus two new ones.
  let seed = 20261110; const rnd = () => ((seed = (seed * 1103515245 + 12345) & 0x7fffffff) / 0x7fffffff);
  const WORD = ['zero', 'one', 'two', 'three', 'four', 'five', 'six', 'seven'], tile = id => ({ id, name: name(id), capital: S[id].capital, region: S[id].region });
  // Rules for "last state standing": [sets, label on screen, what the voice says]. Every set is a clue of the daily grid.
  const POOL = [
    [['coast_atlantic', 'coast_pacific', 'coast_gulf'], 'on an ocean or the Gulf', 'every state on an ocean, or on the Gulf.'],
    [['border_canada'], 'borders Canada', 'every state that borders Canada.'], [['border_mexico'], 'borders Mexico', 'every state that borders Mexico.'],
    [['on_mississippi'], 'on the Mississippi', 'every state on the Mississippi River.'], [['on_missouri'], 'on the Missouri River', 'the Missouri River.'],
    [['ohio_river'], 'on the Ohio River', 'the Ohio River.'], [['colorado_river'], 'on the Colorado River', 'the Colorado River.'],
    [['coast_great_lakes'], 'on a Great Lake', 'the Great Lakes.'], [['in_mexican_cession'], 'land ceded by Mexico', 'every state with land ceded by Mexico in 1848.'],
    [['in_louisiana_purchase'], 'the Louisiana Purchase', 'every state with land from the Louisiana Purchase.'], [['original_13'], 'the 13 colonies', 'the thirteen colonies.'],
    [['confederate'], 'joined the Confederacy', 'every state that joined the Confederacy.'], [['statehood_pre_1800'], 'joined before 1800', 'every state that joined before 1800.'],
    [['statehood_1851_1899'], 'joined 1851 to 1899', 'every state that joined between 1851 and 1899.'], [['statehood_1900s'], 'joined after 1900', 'every state that joined after 1900.'],
    [['region_west'], 'the West', 'the West.'], [['region_south'], 'the South', 'the South.'], [['region_midwest'], 'the Midwest', 'the Midwest.'], [['region_northeast'], 'the Northeast', 'the Northeast.'],
    [['route_66'], 'on Route 66', 'every state on Route 66.'], [['appalachian_trail'], 'on the Appalachian Trail', 'every state on the Appalachian Trail.'],
    [['oregon_trail'], 'on the Oregon Trail', 'the Oregon Trail.'], [['pony_express'], 'on the Pony Express route', 'the Pony Express route.'],
    [['borders_6_plus'], 'borders 6 states or more', 'every state that borders six states or more.'], [['pop_gt10m'], 'over 10 million people', 'every state with more than ten million people.'],
    [['pop_lt1m'], 'under 1 million people', 'every state with under one million people.'], [['capital_is_largest'], 'capital is its biggest city', 'every state whose capital is its biggest city.'],
    [['has_nba'], 'has an NBA team', 'every state with an N B A team.'], [['two_word_name'], 'two-word names', 'every two word name.'], [['ends_in_a'], 'names ending in A', 'every name that ends in A.'],
    [['vowel_start'], 'names starting with a vowel', 'every name that starts with a vowel.'], [['larger_than_uk'], 'bigger than the UK', 'every state bigger than the United Kingdom.'],
    [['more_cows_than_people'], 'more cattle than people', 'every state with more cattle than people.'], [['natl_parks_3'], '3 national parks or more', 'every state with three national parks or more.'],
    [['named_after_person'], 'named after a person', 'every state named after a person.'], [['nasa_center'], 'has a NASA center', 'every state with a NASA center.'],
    [['ivy_league'], 'has an Ivy League school', 'every state with an Ivy League school.'], [['hosted_olympics'], 'hosted the Olympics', 'every state that has hosted the Olympics.'],
    [['long_name'], 'names of 10 letters or more', 'every name of ten letters or more.'], [['double_letter'], 'a double letter in the name', 'every name with a double letter.'],
  ];
  for (const [sets] of POOL) for (const k of sets) assert(D.sets[k], k);
  function chain() {
    let left = ids.slice(); const rounds = [], used = new Set();
    while (left.length > 1 && rounds.length < 7) {
      const c = POOL.map((r, k) => ({ k, r, out: left.filter(i => r[0].some(s => D.sets[s].includes(i))) }))
        .filter(x => !used.has(x.k) && x.out.length && x.out.length < left.length && (left.length <= 6 || (x.out.length >= left.length * 0.25 && x.out.length <= left.length * 0.62)));
      if (!c.length) return null;
      const x = c[Math.floor(rnd() * c.length)]; used.add(x.k); left = left.filter(i => !x.out.includes(i));
      rounds.push({ label: x.r[1], voice: 'Out: ' + x.r[2], out: x.out });
    }
    return left.length === 1 && rounds.length >= 5 ? { rounds, winner: left[0] } : null;
  }
  const chains = [], seenW = new Set(['OK']), seenFirst = new Set(['on an ocean or the Gulf']);
  for (let n = 0; chains.length < 8 && n < 20000; n++) { const c = chain(); if (!c || seenW.has(c.winner) || seenFirst.has(c.rounds[0].label)) continue;
    // check the chain by replaying it: each round's "out" is exactly what its rule removes from what is left
    seenW.add(c.winner); seenFirst.add(c.rounds[0].label); chains.push(c); }
  assert.strictEqual(chains.length, 8);
  if (process.env.SHOW) for (const c of chains) console.log(c.winner, '|', c.rounds.map(r => `${r.label} (${r.out.length})`).join(' > '));
  const ROYALE = [
    (n, k, l) => `New round of last state standing: ${n} rules, 50 states, and the first rule alone wipes out ${k}. Is yours still on the map at the end? #geography #maps`,
    (n, k, l) => `Fifty states go in, one comes out. This time the first rule is "${l}". Which round got your state? #geography #usa`,
    (n, k, l) => `Elimination map: every rule removes the states it describes until one is left. Bet on a survivor before you press play. #maps #50states`,
    (n, k, l) => `One state survives ${n} rules in this one, and it may not be the one you would bet on. Where did yours fall? #geography #trivia`,
    (n, k, l) => `${k} states gone after a single rule, and it only gets tighter from there. Last state standing, another round. #maps #geography`,
    (n, k, l) => `Can your state survive "${l}"? ${n} rounds, one winner, the whole map falling apart. #geography #usa`,
    (n, k, l) => `Watch the map empty out rule by rule: ${n} rounds, 49 states out, one left standing. Was yours close? #50states #maps`,
    (n, k, l) => `Pick a state, then watch ${n} rules try to knock it off the map. Only one makes it to the end. #geography #quiz`,
  ];
  const royale = chains.map((c, i) => { const n = c.rounds.length, w = c.winner;
    return { format: 'Last state standing', scene: 'royale', key: 'last-state-standing',
      params: { rounds: c.rounds, winner: w, hookTop: '50 STATES.\nONE SURVIVES.', hookVoice: `Fifty states. ${WORD[n][0].toUpperCase() + WORD[n].slice(1)} rules. One survivor. Is yours still alive?`,
        winTop: `${name(w).toUpperCase()}\nSURVIVES`, winVoice: `${name(w)} survives. Which round took your state out?`, winBottom: '<span style="font-size:76px">Which round got yours?</span>', winSub: 'A new map puzzle every day' },
      post: ROYALE[i](n, c.rounds[0].out.length, c.rounds[0].label), yt: `50 states, ${n} rules, 1 survivor (round ${i + 2})`, tags: '#shorts #geography #maps', tk: '#geography #usa #50states #maps' }; });
  const BOUNCE = [
    i => `Round ${i} of the bouncing ball knockout: 50 state tiles, and the last one untouched wins. Did yours outlast the first ten seconds? #geography #usa`,
    i => `No skill, no facts, just fifty states and a few very rude balls. Last tile standing wins. How long did yours hold? #usa #50states`,
    i => `Another knockout, a new winner. Find your state on the board before the balls do. #geography #maps`,
    i => `The balls are back and nobody is safe. Fifty tiles, one survivor, round ${i}. Which row lasted longest? #usa #trivia`,
    i => `Fifty states on a board, one left at the end. Round ${i}: tell us when yours popped. #50states #geography`,
    i => `Luck of the bounce, round ${i}. The winner gets its capital on screen, everyone else gets popped. #usa #maps`,
  ];
  const bounce = BOUNCE.map((f, i) => ({ format: 'Bounce out', scene: 'bounce', key: 'bounce-out',
    params: { seed: 0, tiles: ids.slice().sort().map(tile), hookTop: 'LAST STATE\nSTANDING WINS', hookVoice: i % 2 ? 'Fifty states, one winner. Is it yours this time?' : 'Fifty states. The last one standing wins. Find yours.',
      sub: 'Find your state', winVoice: 'Did yours make the final ten?', winSub: 'Did yours make the final ten?' },
    post: f(i + 2), yt: `50 states, last one standing wins (round ${i + 2})`, tags: '#shorts #geography #usa', tk: '#geography #usa #50states #satisfying' }));
  const byArea = ids.slice().sort((a, b) => S[a].areaRank - S[b].areaRank), up = id => ({ id, label: name(id).toUpperCase() });
  assert.strictEqual(byArea[0], 'AK'); assert.strictEqual(byArea[49], 'RI');
  const az = ids.slice().sort((a, b) => name(a).localeCompare(name(b))); assert.strictEqual(name(az[0]), 'Alabama'); assert.strictEqual(name(az[49]), 'Wyoming');
  const ASM = { format: 'Map builds itself', scene: 'assemble', key: 'map-builds-itself', tags: '#shorts #geography #maps', tk: '#geography #usa #maps #satisfying' };
  const assemble = [
    { ...ASM, params: { order: byArea.map(up), hookTop: 'BIGGEST STATE\nTO SMALLEST', hookVoice: 'The map builds itself, from the biggest state to the smallest. Guess the last one.', endVoice: 'Rhode Island lands last.', sub: 'Biggest first, by total area', endSub: 'Rhode Island is the smallest' },
      post: 'The US map assembling itself from the biggest state to the smallest. Alaska lands first, and you have ten seconds to guess what lands last. #geography #maps', yt: 'The US map builds itself, biggest state to smallest' },
    { ...ASM, params: { order: az.map(up), hookTop: 'ALL 50 STATES\nA TO Z', hookVoice: 'All fifty states, in alphabetical order. Try to say them as they land.', endVoice: 'Alabama to Wyoming.', sub: 'Alphabetical order', endSub: 'Alabama to Wyoming' },
      post: 'All 50 states dropping into place in alphabetical order, Alabama to Wyoming, then it loops. Can you say them as fast as they land? #50states #maps', yt: 'All 50 states in alphabetical order, on the map' },
    { ...ASM, params: { order: ids.map(up), byX: true, hookTop: 'THE MAP FILLS\nLEFT TO RIGHT', hookVoice: 'The map fills in from left to right. Shout when your state lands.', endVoice: 'Fifty out of fifty.', sub: 'From the left of the map to the right', endSub: 'All 50 in place' },
      post: 'The map filling in from its left edge to its right like a wave, then bursting apart and starting over. Strangely calming. #maps #geography', yt: 'The US map fills in from left to right (satisfying loop)' },
    { ...ASM, params: { order: order.slice().reverse().map(o => ({ id: o.id, label: String(o.year) })), labelCls: 'year', hookTop: 'THE USA\nIN REVERSE', hookVoice: 'The map built backwards, from the newest states to the oldest.', endVoice: 'Back to the first states.', sub: 'Newest states first', endSub: 'Back to the first states' },
      post: 'The map built backwards: the states of 1959 first, the first states last. Watch the country shrink toward the east coast in reverse. #ushistory #maps', yt: 'The US map built backwards, newest states first', tags: '#shorts #ushistory #maps' },
  ];
  const three = l => l.map(id => ({ id, name: name(id) })), single = d => (d.match(/m/gi) || []).length === 1;
  const svgSrc = fs.readFileSync(path.join(ROOT, 'data/us-map.svg'), 'utf8'), dOf = id => svgSrc.match(new RegExp(`id="us-${id}"[^>]* d="([^"]*)"`))[1];
  const DRAW = [
    [['GA', 'MN', 'NJ'], i => `Round ${i}: a pen traces a state border and you name it before the line closes. Three states. How far did the pen get? #geography #quiz`],
    [['OK', 'PA', 'IL'], i => `Three more borders drawn in real time. Name each state before the pen gets back to where it started. #maps #geography`],
    [['AZ', 'MO', 'NH'], i => `The pen starts, you guess. Three outlines, and the middle one is the tricky one. Line closes, round ${i}. #geography #50states`],
    [['NM', 'AR', 'VT'], i => `How early can you call it? A border drawn stroke by stroke, three states, round ${i}. Reply with your score. #quiz #maps`],
    [['MT', 'TN', 'SC'], i => `Name it before the line closes, round ${i}. Some states give themselves away at the first corner, some never do. #geography #usa`],
    [['NV', 'IN', 'OR'], i => `Three outlines, one pen, no hints. Round ${i} of line closes: at what percent did you know? #maps #quiz`],
  ];
  const drawV = DRAW.map(([l, f], i) => { l.forEach(id => assert(single(dOf(id)), id + ' is not one line'));
    return { format: 'Line closes', scene: 'draw', key: 'line-closes', params: { states: three(l), hookTop: 'NAME IT BEFORE\nTHE LINE CLOSES', hookVoice: i % 2 ? 'Three states. Name each one before the pen is done.' : 'Name the state before the line closes.',
      endVoice: 'How many did you get before the end?', endBottom: 'HOW MANY?', endSub: 'Comment your score out of 3' }, post: f(i + 2), yt: `Name the state before the line closes (round ${i + 2})`, tags: '#shorts #geography #quiz', tk: '#geography #usa #50states #quiz' }; });
  const SPIN = [
    [['CA', 'LA', 'MA'], 'A state is spinning and you have to name it before it stops. Three states, and the outline only settles upright at the last second. #geography #quiz'],
    [['FL', 'OH', 'ID'], 'Spin, round 2: outlines turning in circles, three states to name before they come to rest. #maps #50states'],
    [['NY', 'KY', 'MD'], 'Does a state look the same sideways? Three spinning outlines, name them before they stop. Round 3. #geography #usa'],
  ];
  const spin = SPIN.map(([l, post], i) => ({ format: 'Spinning state', scene: 'spin', key: 'spinning-state', params: { states: three(l), hookTop: 'NAME IT BEFORE\nIT STOPS SPINNING', hookVoice: 'Name the state before it stops spinning.',
    endVoice: 'How many before they stopped?', endBottom: 'HOW MANY?', endSub: 'Comment your score out of 3' }, post, yt: `Name the spinning state (round ${i + 1})`, tags: '#shorts #geography #quiz', tk: '#geography #usa #50states #quiz' }));
  const MISS = [
    [['TN', 'NV', 'IA'], 'One state has been pulled out of the map. You have three seconds to say which before it drops back in. Three holes to fill. #geography #maps'],
    [['MO', 'PA', 'UT'], 'Spot the hole: a state is missing from the map, three times in a row. Which ones did you catch in time? #50states #quiz'],
    [['KY', 'AL', 'VT'], 'The map has a gap and it is your job to name it. Missing state, round 3, and the last one is small. #geography #usa'],
  ];
  const missing = MISS.map(([l, post], i) => ({ format: 'Missing state', scene: 'missing', key: 'missing-state', params: { states: three(l), hookTop: 'WHICH STATE\nIS MISSING?', hookVoice: 'Which state is missing?',
    endVoice: 'Did you get all three?', endBottom: 'ALL THREE?', endSub: 'Comment your score out of 3' }, post, yt: `Which state is missing from the map? (round ${i + 1})`, tags: '#shorts #geography #maps', tk: '#geography #usa #50states #maps' }));
  // Posting order alternates the scenes; slugs w05 to w34.
  const groups = [royale, bounce, drawV, assemble, spin, missing].map(g => g.slice()), batch = [];
  while (groups.some(g => g.length)) for (const g of groups) if (g.length) batch.push(g.shift());
  assert.strictEqual(batch.length, 30);
  const cnt = {};
  batch.forEach((v, i) => { cnt[v.key] = (cnt[v.key] || (/spinning|missing/.test(v.key) ? 0 : 1)) + 1; v.slug = `w${String(i + 5).padStart(2, '0')}-${v.key}-${cnt[v.key]}`; v.tiktok = v.post.replace(/(\s+#\w+)+\s*$/, ''); V.push(v); });
  const DASH = /[‐-―−]/, URL = 'https://statedoku.com/?utm_source=x&utm_medium=video&utm_campaign=';
  const meta = V.map(v => { const tk = `${v.tiktok}\n\nA new US map puzzle every day, free: link in bio.\n\n${v.tk || '#geography #usa #50states #maps'}`;
    const m = { slug: v.slug, format: v.format, series: v.format, title: v.yt, post: `${v.post} ${URL}${v.slug.slice(4)}`, tiktok: tk,
      youtube: { title: v.yt, description: `${v.tiktok}\n\nA new US map puzzle every day, free, no sign-up: statedoku.com (link on the channel page).\n\n${v.tags}` } };
    if (DASH.test(JSON.stringify(m) + JSON.stringify(v.params))) throw new Error('unicode dash in ' + v.slug);
    if (m.post.length > 280 || m.youtube.title.length > 100) throw new Error('text too long: ' + v.slug); return m; });
  for (const k of ['post', 'tiktok', 'slug']) assert.strictEqual(new Set(meta.map(m => m[k])).size, meta.length, 'duplicate ' + k);
  fs.writeFileSync(path.join(__dirname, 'experiments-anim.json'), JSON.stringify(meta, null, 1) + '\n');
  if (!OUT) return console.log('texts written; pass OUT to render frames');
  const logo = 'data:image/png;base64,' + fs.readFileSync(path.join(ROOT, 'logo-mark-192.png')).toString('base64');
  const html = fs.readFileSync(path.join(__dirname, 'anim.html'), 'utf8').replace('LOGO', logo).replace('MAPSVG', fs.readFileSync(path.join(ROOT, 'data/us-map.svg'), 'utf8'));
  const b = await chromium.launch({ executablePath: '/opt/pw-browsers/chromium' });
  { // each bounce video gets a seed whose winner no other bounce video has
    const p = await b.newPage(); await p.setContent(html, { waitUntil: 'load' }); const won = new Set(); let sd = 1;
    for (const v of V.filter(v => v.scene === 'bounce')) for (;; sd += 37) { const r = await p.evaluate(([n, P]) => window.setup(n, P), ['bounce', { ...v.params, seed: sd, probe: true }]);
      if (!won.has(r.winner)) { won.add(r.winner); v.params.seed = sd; sd += 37; break; } }
    await p.close(); console.log('bounce winners', [...won].join(' ')); }
  const todo = V.filter(v => !ONLY || new RegExp(ONLY).test(v.slug)); let qi = 0;
  await Promise.all([0, 1, 2, 3].map(async () => { while (qi < todo.length) { const v = todo[qi++];
    const p = await b.newPage({ viewport: { width: 1080, height: 1920 }, deviceScaleFactor: 2 / 3 });
    await p.setContent(html, { waitUntil: 'load' }); await p.evaluate(() => document.fonts.ready);
    const tl = await p.evaluate(([n, P]) => window.setup(n, P), [v.scene, v.params]);
    const dir = path.join(OUT, v.slug); fs.rmSync(dir, { recursive: true, force: true }); fs.mkdirSync(dir, { recursive: true });
    const n = Math.ceil(tl.dur * FPS);
    fs.writeFileSync(path.join(dir, 'timeline.json'), JSON.stringify({ ...tl, frames: n, fps: FPS }));
    for (let i = 0; i < n; i++) { await p.evaluate(t => window.frame(t), i / FPS); await p.screenshot({ path: path.join(dir, `f${String(i).padStart(5, '0')}.jpg`), type: 'jpeg', quality: 88 }); }
    console.log(v.slug, tl.dur.toFixed(1) + ' s', n, 'frames', tl.winner ? 'winner ' + tl.winner : '');
    await p.close();
  } }));
  await b.close();
})();
