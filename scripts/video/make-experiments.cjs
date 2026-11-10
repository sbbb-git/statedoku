#!/usr/bin/env node
// Format tests (10 November 2026): the 100 quiz videos did not take off on
// TikTok, so the owner asked for very different kinds of video to find out
// what works. Writes scripts/video/experiments.json: ten short videos (15 to
// 35 s), one per format, same shape as videos.json plus the three post texts
// (X, TikTok, YouTube). Every state fact comes from the game's data through
// data.cjs and each answer is asserted below; the three photos are NASA's
// (public domain), described in photos/CREDITS.md.
//
//   node scripts/video/make-experiments.cjs
//   VIDEOS=experiments.json node scripts/video/render-frames.cjs OUT
//   VIDEOS=experiments.json python3 scripts/video/render.py OUT VOICE.onnx
//   node scripts/video/add-experiments.cjs      # copies nothing: MP4s first, see README
const fs = require('fs'), path = require('path'), assert = require('assert');
const { load } = require('./data.cjs');

const say = (tag, voice, caption, visual) => ({ kind: 'say', tag, voice, caption, visual });
const count = (n, tag, visual) => Array.from({ length: n }, (_, i) => ({ kind: 'count', tag, caption: String(n - i), visual, tick: true }));
const beat = (tag, caption, visual, dur, freq) => ({ kind: 'beat', tag, caption, visual, dur, freq });
const join = a => a.length < 2 ? a.join('') : a.slice(0, -1).join(', ') + ' and ' + a[a.length - 1];
const outro = (voice, caption) => say('', voice, caption, { type: 'outro', title: 'One map puzzle a day', sub: 'Nine cells, two clues each, every answer a US state.' });
const OUTRO = outro('Play the daily map puzzle at State doku dot com.', 'A new map puzzle every day at statedoku.com');
const GOLD = '#F59E0B', GREEN = '#059669', RED = '#DC2626';

(async () => {
  const D = await load();
  const S = Object.fromEntries(D.states.map(s => [s.id, s]));
  const name = id => S[id].names.en, ids = D.states.map(s => s.id);
  const hl = (list, c) => Object.fromEntries(list.map(i => [i, c]));
  const both = (...sets) => ids.filter(i => sets.every(s => D.sets[s].includes(i)));
  const same = (a, b) => assert.deepStrictEqual(a.slice().sort(), b.slice().sort());
  const V = [];
  const add = (format, title, segments, x, tiktok, ytTitle, tags) => V.push({ format, series: format, title, segments, post: x, tiktok, youtube: { title: ytTitle, tags } });

  // 1. Three clues, one state: the candidates shrink on the map.
  {
    const rounds = [
      [['border_canada', 'It borders Canada.'], ['coast_great_lakes', 'It touches a Great Lake.'], ['on_mississippi', 'It is on the Mississippi River.'], 'MN'],
      [['on_missouri', 'The Missouri River runs through it or along it.'], ['border_canada', 'It borders Canada.'], ['yellowstone', 'Part of Yellowstone National Park is inside it.'], 'MT'],
    ];
    const segs = [];
    rounds.forEach(([a, b, c, ans], r) => {
      const s1 = both(a[0]), s2 = both(a[0], b[0]), s3 = both(a[0], b[0], c[0]);
      same(s3, [ans]); assert(s1.length > s2.length && s2.length > 1);
      const tag = `State ${r + 1} of 2`, left = n => `${n} states left`;
      const m1 = { type: 'map', title: left(s1.length), hl: hl(s1, GOLD) }, m2 = { type: 'map', title: left(s2.length), hl: hl(s2, GOLD) };
      segs.push(say(tag, (r ? 'Next state. Clue one. ' : 'Three clues, one state. Clue one. ') + a[1], 'Clue 1: ' + a[1], m1), ...count(2, tag, m1),
        say(tag, 'Clue two. ' + b[1], 'Clue 2: ' + b[1], m2), ...count(2, tag, m2),
        say(tag, 'Clue three. ' + c[1], 'Clue 3: ' + c[1], m2), ...count(3, tag, m2),
        say(tag, `It's ${name(ans)}.`, `${name(ans)}, capital ${S[ans].capital}`, { type: 'map', title: name(ans), hl: hl([ans], GREEN) }));
    });
    add('Three clues', 'Three clues, one state', [...segs, outro('Did you get both before the third clue? Play the daily puzzle at State doku dot com.', 'Got both before clue 3? Daily puzzle at statedoku.com')],
      'Three clues, one state, and the map narrows with each clue. Did you get both before the third? #geography #quiz',
      'Three clues, one state. Watch the map narrow down and comment which clue gave it away.', 'Three clues, one state: can you beat the third clue?', '#shorts #geography #quiz');
  }

  // 2. State puns.
  {
    const jokes = [['What did Delaware?', 'Her New Jersey.', 'DE', 'NJ'], ['Where has Oregon?', "I don't know. Alaska.", 'OR', 'AK'], ['What did Tennessee?', 'The same thing Arkansas.', 'TN', 'AR']];
    const segs = [];
    jokes.forEach(([q, a, s1, s2], i) => {
      const tag = `Joke ${i + 1} of 3`;
      segs.push(say(tag, (i ? '' : 'Three map jokes. Rate them out of ten. ') + q, q, { type: 'map', title: q, hl: hl([s1], GOLD), punch: '' }),
        beat(tag, q, { type: 'map', title: q, hl: hl([s1], GOLD), punch: '' }, 0.8),
        say(tag, a, a, { type: 'map', title: q, hl: { ...hl([s1], GOLD), ...hl([s2], RED) }, punch: a }),
        beat(tag, a, { type: 'map', title: q, hl: { ...hl([s1], GOLD), ...hl([s2], RED) }, punch: a }, 0.9));
    });
    add('State puns', 'Three US state jokes', [...segs, outro('Comment a worse one. Then play the daily puzzle at State doku dot com.', 'Comment a worse one. Daily puzzle at statedoku.com')],
      'Three US state puns, each one worse than the last. What did Delaware? Reply with yours. #geography #dadjokes',
      'What did Delaware? Three state puns, rate them out of 10 and comment a worse one.', 'What did Delaware? 3 US state puns', '#shorts #geography #dadjokes');
  }

  // 3. From space: three NASA photographs.
  {
    const shots = [
      ['nasa-iss072e891004.jpg', '45% 30%', 'Which state is this, seen from space at night?', 'Which state is this, from space at night?', 'FL', 'Florida, lit up at night.', 'Photo: NASA, International Space Station, 2025'],
      ['nasa-iss074e0671775.jpg', '100% 60%', 'Which state does this hook of land belong to?', 'Which state owns this hook of land?', 'MA', 'Massachusetts. That hook is Cape Cod.', 'Photo: NASA / Chris Williams, 2026'],
      ['nasa-s40-77-045.jpg', '70% 100%', 'This lake has the same name as the state on its right. Which state?', 'The lake and the state on its right share a name', 'MI', 'Michigan, seen from the space shuttle in 1991.', 'Photo: NASA, space shuttle Columbia, 1991'],
    ];
    const segs = [];
    shots.forEach(([img, pos, q, cap, id, a, credit], i) => {
      const tag = `Photo ${i + 1} of 3`, v = { type: 'photo', img: 'photos/' + img, pos, credit };
      segs.push(say(tag, q, cap, v), ...count(3, tag, v), say(tag, a, a, { ...v, name: name(id) }));
    });
    add('From space', 'Guess the state from space', [...segs, OUTRO],
      'Three real NASA photos, three states seen from orbit. The night one is easier than it looks. How many did you get? #geography #space',
      'Can you name a state from orbit? Three real NASA photos, three seconds each. Comment your score.', 'Guess the US state from space (real NASA photos)', '#shorts #geography #space');
  }

  // 4. Time-lapse: the map fills in the order the states joined.
  {
    const years = [...new Set(ids.map(i => S[i].admitted))].sort((a, b) => a - b), segs = [];
    years.forEach((y, k) => {
      const done = ids.filter(i => S[i].admitted < y), now = ids.filter(i => S[i].admitted === y);
      const v = { type: 'map', big: String(y), bigsub: `${done.length + now.length} states`, hl: { ...hl(done, GREEN), ...hl(now, GOLD) } };
      if (!k) segs.push(say('Time-lapse', 'Watch the United States grow to fifty states. Which two came last?', 'Watch the USA grow to 50 states', v));
      else segs.push(beat('Time-lapse', '', v, 0.42, 420 + k * 14));
    });
    const last = ids.filter(i => S[i].admitted === years[years.length - 1]).map(name).sort();
    same(last, ['Alaska', 'Hawaii']); assert.strictEqual(years[years.length - 1], 1959);
    segs.push(say('Time-lapse', 'Alaska and Hawaii, in 1959.', 'Alaska and Hawaii, 1959', { type: 'map', big: '1959', bigsub: '50 states', hl: { ...hl(ids, GREEN), AK: GOLD, HI: GOLD } }));
    add('Time-lapse', 'The USA from 13 to 50 states', [...segs, OUTRO],
      'From the first states to fifty in twenty seconds: the map fills in the order the states joined. Which two came last? #ushistory #maps',
      'The whole map filling up in the order the states joined the Union. Which year surprised you?', 'Watch the USA grow to 50 states in 20 seconds', '#shorts #ushistory #maps');
  }

  // 5. Upside down.
  {
    const three = ['OK', 'ID', 'MD'], segs = [];
    three.forEach((id, i) => {
      const tag = `Shape ${i + 1} of 3`, q = { type: 'silhouette', id, rot: true };
      segs.push(say(tag, i ? `Number ${i + 1}.` : 'These three states are upside down. Can you still name them? Number one.', i ? `#${i + 1}: which state, upside down?` : 'Upside down: can you still name them?', q),
        ...count(3, tag, q), say(tag, `${name(id)}.`, name(id), { type: 'silhouette', id, reveal: true, name: name(id) }));
    });
    add('Upside down', 'Upside down states', [...segs, OUTRO],
      'Three state outlines flipped upside down. The first is easy, the third is not. How many can you still name? #geography #mapchallenge',
      'Three states, flipped upside down. The last one gets almost everyone. Comment your score out of 3.', 'Can you name these states upside down?', '#shorts #geography #quiz');
  }

  // 6. Zoom out.
  {
    const rounds = [['TX', 0.36, 0.02], ['KY', 0.03, 0.86]], F = [0.16, 0.24, 0.38, 0.6, 1], segs = [];
    rounds.forEach(([id, cx, cy], r) => {
      const tag = `State ${r + 1} of 2`;
      F.forEach((f, k) => {
        const v = { type: 'silhouette', id, zoom: { f, cx, cy } }, cap = `Zoom ${k + 1} of ${F.length}`;
        if (!k) segs.push(say(tag, r ? 'One more. Which state?' : 'Zoom out challenge. Name the state as early as you can.', r ? 'One more: which state?' : 'Name the state as early as you can', v));
        segs.push(beat(tag, cap, v, 1.1, 520 + k * 60));
      });
      segs.push(say(tag, `${name(id)}.`, name(id), { type: 'silhouette', id, reveal: true, name: name(id) }));
    });
    add('Zoom out', 'Zoom out: name the state', [...segs, outro('Which zoom did you get it on? Play the daily puzzle at State doku dot com.', 'Which zoom did you get it on? statedoku.com')],
      'We start zoomed in on one stretch of border and pull back five times. On which zoom do you recognise the state? #geography #maps',
      'Zoom out challenge: one piece of border, five zoom levels. Comment the zoom you got it on.', 'Zoom out challenge: name the state from its border', '#shorts #geography #maps');
  }

  // 7. Spot the mistake: one label sits on the wrong state.
  {
    const rounds = [
      [['MT', 'TX', 'KS', 'FL', 'NV'], 'KS', 'NE', 'That state is Kansas. Nebraska is its neighbor to the north.'],
      [['OR', 'CO', 'AZ', 'IA', 'GA'], 'CO', 'WY', 'That state is Colorado. Wyoming is the rectangle right above it.'],
    ];
    const segs = [];
    rounds.forEach(([five, bad, wrong, why], r) => {
      const tag = `Map ${r + 1} of 2`, colors = hl(five, '#93C5FD');
      const q = { type: 'map', title: 'Which label is wrong?', hl: colors, labels: five.map(id => ({ id, text: name(id === bad ? wrong : id) })) };
      segs.push(say(tag, r ? 'Second map, a harder one.' : 'One of these five labels is on the wrong state. Find it.', r ? 'Map 2: which label is wrong?' : 'One label is on the wrong state. Find it.', q), ...count(4, tag, q),
        say(tag, why, `${name(wrong)}? No: ${name(bad)}`, { type: 'map', title: `Not ${name(wrong)}: ${name(bad)}`, hl: { ...colors, [bad]: RED },
          labels: five.map(id => ({ id, text: name(id), state: id === bad ? 'ok' : '' })) }));
    });
    add('Spot the mistake', 'Spot the wrong label on the map', [...segs, OUTRO],
      'One label on each map is on the wrong state. Four seconds to find it, and the second map is the one people miss. #geography #mapchallenge',
      'Spot the mistake: one label is on the wrong state. Did you catch both maps in time?', 'Spot the mistake on the US map', '#shorts #geography #maps');
  }

  // 8. Blind ranking by area.
  {
    const five = ['GA', 'NV', 'FL', 'MI', 'CO'], sorted = five.slice().sort((a, b) => S[a].areaRank - S[b].areaRank), segs = [];
    const ord = n => n + (n % 100 >= 11 && n % 100 <= 13 ? 'th' : ['th', 'st', 'nd', 'rd'][n % 10] || 'th');
    segs.push(say('Blind ranking', 'Blind ranking. Five states, from biggest to smallest. Place each one before you see the next.', 'Place each state before you see the next',
      { type: 'hook', title: 'Blind ranking: 5 states by size', sub: 'Slot 1 = biggest, slot 5 = smallest' }));
    five.forEach((id, i) => {
      const tag = `State ${i + 1} of 5`, v = { type: 'silhouette', id, name: name(id) };
      segs.push(say(tag, `${name(id)}. Which slot?`, `${name(id)}: slot 1, 2, 3, 4 or 5?`, v), beat(tag, `${name(id)}: slot 1, 2, 3, 4 or 5?`, v, 1.6, 600));
    });
    segs.push(say('The real order', `The real order: ${join(sorted.map(name))}.`, 'The real order, by total area',
      { type: 'list', title: 'Biggest to smallest', items: sorted.map(i => `${name(i)}, ${ord(S[i].areaRank)}`), note: 'Rank among the 50 states, total area' }));
    add('Blind ranking', 'Blind ranking: five states by size', [...segs, outro('How many did you place right? Play the daily puzzle at State doku dot com.', 'How many did you place right? statedoku.com')],
      'Blind ranking: five states, biggest to smallest, and you place each one before seeing the next. Michigan is where it goes wrong. #geography #blindranking',
      'Blind ranking, states edition: place each one from biggest to smallest before you see the next. Comment how many you got.', 'Blind ranking: 5 US states by size', '#shorts #geography #blindranking');
  }

  // 9. Letter challenges.
  {
    const noA = D.sets.no_letter_a, sfl = D.sets.same_first_last, segs = [];
    same(noA, ids.filter(i => !/a/i.test(name(i)))); same(sfl, ids.filter(i => name(i)[0].toLowerCase() === name(i).slice(-1).toLowerCase()));
    const q1 = { type: 'map', title: 'A state with no letter A', hl: {} }, q2 = { type: 'map', title: 'Starts and ends with the same letter', hl: {} };
    segs.push(say('5 seconds', 'Name a state with no letter A in its name. Five seconds.', 'Name a state with NO letter A', q1), ...count(5, '5 seconds', q1),
      say('No letter A', `Only ${noA.length} of the fifty states have no A. Did you find one?`, `Only ${noA.length} of 50 have no A`, { type: 'map', title: `${noA.length} states with no letter A`, hl: hl(noA, GREEN), names: noA.map(name) }),
      say('5 seconds', 'Harder. A state that starts and ends with the same letter.', 'Starts and ends with the same letter', q2), ...count(5, '5 seconds', q2),
      say('Same letter', `There are only ${sfl.length}: ${join(sfl.map(name))}.`, join(sfl.map(name)), { type: 'map', title: `Only ${sfl.length} states`, hl: hl(sfl, GREEN), names: sfl.map(name) }));
    add('Letter challenge', 'Name a state with no letter A', [...segs, OUTRO],
      `Name a US state with no letter A in it. Harder than it sounds: only ${noA.length} of the 50 qualify. Which one came to you first? #geography #trivia`,
      'Name a state with NO letter A in 5 seconds. Most people freeze. Comment the first one you thought of.', 'Name a US state with no letter A (only 14 exist)', '#shorts #geography #trivia');
    assert.strictEqual(noA.length, 14);
  }

  // 10. One cell of the daily grid.
  {
    const cells = [['border_canada', 'coast_pacific'], ['four_corners', 'rio_grande'], ['original_13', 'coast_great_lakes']], segs = [];
    cells.forEach(([row, col], i) => {
      const ans = both(row, col); assert(ans.length >= 2 && ans.length <= 3, row + col);
      const tag = `Cell ${i + 1} of 3`, q = { type: 'cell', title: 'One state, both clues', row: D.label(row), col: D.label(col) };
      segs.push(say(tag, (i ? '' : 'Can you solve this cell? Name one state that fits both clues. ') + `${D.label(row)}, and ${D.label(col).replace(/^On /, 'on ')}.`, `${D.label(row)} + ${D.label(col)}`, q), ...count(4, tag, q),
        say(tag, `${join(ans.map(name))}.`, join(ans.map(name)), { type: 'map', title: `${D.label(row)} + ${D.label(col)}`, hl: hl(ans, GREEN), names: ans.map(name) }));
    });
    add('Grid cell', 'Solve one cell of the grid', [...segs, outro('The real grid has nine cells like these. Play today\'s at State doku dot com.', 'The real grid has 9 cells. Play today\'s: statedoku.com')],
      'One cell, two clues, and any state that fits both is right. Three cells here, nine in the daily grid. Which one stopped you? #geography #puzzle',
      'Two clues, one state that fits both. Three cells to solve, comment which one stopped you.', 'Can you solve these 3 US state puzzle cells?', '#shorts #geography #puzzle');
  }

  const DASH = /[‐-―−]/, URL = 'https://statedoku.com/?utm_source=x&utm_medium=video&utm_campaign=';
  V.forEach((v, i) => {
    v.n = i + 1; v.slug = 'x' + String(i + 1).padStart(2, '0') + '-' + v.format.toLowerCase().replace(/[^a-z0-9]+/g, '-');
    v.post = `${v.post} ${URL}${v.slug.slice(4)}`;
    v.tiktok = `${v.tiktok}\n\nA new US map puzzle every day, free: link in bio.\n\n#geography #usa #50states #${v.format.toLowerCase().replace(/[^a-z]/g, '')}`;
    v.youtube = { title: v.youtube.title, description: `${v.tiktok.split('\n')[0]}\n\nA new US map puzzle every day, free, no sign-up: statedoku.com (link on the channel page).\n\n${v.youtube.tags}` };
    if (DASH.test(JSON.stringify(v))) throw new Error('unicode dash in ' + v.slug);
    if (v.post.length > 280 || v.youtube.title.length > 100) throw new Error('text too long in ' + v.slug);
  });
  for (const k of ['post', 'tiktok']) assert.strictEqual(new Set(V.map(v => v[k])).size, V.length);
  fs.writeFileSync(path.join(__dirname, 'experiments.json'), JSON.stringify(V, null, 1) + '\n');
  console.log(V.length, 'videos:', V.map(v => `${v.slug} (${v.segments.length} steps)`).join(', '));
})();
