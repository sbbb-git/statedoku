#!/usr/bin/env node
// Writes scripts/video/videos.json: 100 short vertical videos (30 to 60 s),
// each a list of segments (voice line = burned-in caption, a visual, an
// optional countdown) plus the text to post with it. Every fact comes from
// the game's data with the corrections of js/puzzle.js applied (data.cjs):
// capitals, largest cities, admission years, area ranks, population bands and
// the answer sets and glosses of the daily-grid clues, all checked twice when
// they went into the game. Nothing here is typed from memory.
//
//   node scripts/video/make-scripts.cjs
const fs = require('fs'), path = require('path');
const { load } = require('./data.cjs');

let seed = 20261104;
const rnd = () => ((seed = (seed * 1103515245 + 12345) & 0x7fffffff) / 0x7fffffff);
const shuffle = a => { a = a.slice(); for (let i = a.length - 1; i > 0; i--) { const j = Math.floor(rnd() * (i + 1)); [a[i], a[j]] = [a[j], a[i]]; } return a; };
const pick = a => a[Math.floor(rnd() * a.length)];
const ord = n => n + (n % 100 >= 11 && n % 100 <= 13 ? 'th' : ['th', 'st', 'nd', 'rd'][n % 10] || 'th');
const join = a => a.length < 2 ? a.join('') : a.slice(0, -1).join(', ') + ' and ' + a[a.length - 1];
const TAGS = ['#geography #USA', '#geography', '#USA #quiz', '#mapchallenge', '#trivia #geography', '#50states'];
const SHAPE_POSTS = [
  'Guess the state from its shape, round {n}: five outlines, three seconds each. Comment your score. #geography',
  'Shape quiz {n}: can you name all five states from their outline alone? #USA #quiz',
  'Five state outlines, no names, three seconds each. Round {n}, how many did you get? #geography #USA',
  'Round {n} of guess the state: some shapes are easy, one is not. #50states',
  'Can you recognise these five states by their borders? Shape quiz number {n}. #mapchallenge',
  'Name the state from its silhouette, round {n}. Five shapes, one reveal each. #trivia #geography',
];
const ODD_POSTS = [
  'Odd one out, round {n}: in each set of four states, one does not belong. Can you spot it? #geography',
  'Three states share something, one does not. Odd one out number {n}, three rounds. #USA #quiz',
  'Spot the state that does not fit, odd one out {n}. Rivers, trails, borders and more. #trivia #geography',
  'Odd one out {n}: four states, one impostor, three seconds. #50states',
];
const URL = medium => `https://statedoku.com/?utm_source=x&utm_medium=${medium}`;
const OUTRO = { kind: 'say', tag: '', voice: 'How many did you get? Play the daily US map puzzle at State doku dot com.',
  caption: 'How many did you get? Play the daily puzzle at statedoku.com', visual: { type: 'outro', title: 'One map puzzle a day', sub: 'Nine cells, two clues each, every answer a US state.' } };
const count = (n, tag, visual) => Array.from({ length: n }, (_, i) => ({ kind: 'count', tag, caption: String(n - i), visual, tick: true }));

// Clues that make a good map question. q: "the N states ___", neg: "does not ...", all: "The other three all ..."
const CLUES = {
  border_canada: ['that border Canada', 'does not border Canada', 'border Canada'],
  border_mexico: ['that border Mexico', 'does not border Mexico', 'border Mexico'],
  on_mississippi: ['on the Mississippi River', 'is not on the Mississippi River', 'touch the Mississippi River'],
  on_missouri: ['on the Missouri River', 'is not on the Missouri River', 'touch the Missouri River'],
  ohio_river: ['on the Ohio River', 'is not on the Ohio River', 'touch the Ohio River'],
  colorado_river: ['on the Colorado River', 'is not on the Colorado River', 'touch the Colorado River'],
  rio_grande: ['on the Rio Grande', null, null],
  coast_gulf: ['on the Gulf of Mexico', 'is not on the Gulf of Mexico', 'have a Gulf of Mexico coast'],
  coast_pacific: ['on the Pacific Ocean', 'is not on the Pacific Ocean', 'have a Pacific coast'],
  coast_great_lakes: ['on a Great Lake', 'is not on a Great Lake', 'touch a Great Lake'],
  original_13: ['that were among the 13 original colonies', 'was not one of the 13 colonies', 'were among the 13 colonies'],
  confederate: ['that joined the Confederacy', 'did not join the Confederacy', 'joined the Confederacy'],
  border_state_civil_war: ['that were Civil War border states', 'was not a Civil War border state', 'were Civil War border states'],
  four_corners: ['that meet at the Four Corners', null, null],
  yellowstone: ['that hold part of Yellowstone National Park', null, null],
  peak_14000: ['with a peak over 14,000 feet', 'has no peak over 14,000 feet', 'have a peak over 14,000 feet'],
  natl_parks_3: ['with three or more national parks', 'has fewer than three national parks', 'have three or more national parks'],
  oregon_trail: ['on the Oregon Trail', 'is not on the Oregon Trail', 'lie on the Oregon Trail'],
  pony_express: ['on the Pony Express route', 'is not on the Pony Express route', 'had Pony Express stations'],
  route_66: ['that Route 66 crosses', 'is not on Route 66', 'are on Route 66'],
  appalachian_trail: ['on the Appalachian Trail', 'is not on the Appalachian Trail', 'are on the Appalachian Trail'],
  in_mexican_cession: ['with land ceded by Mexico in 1848', 'has no land ceded by Mexico in 1848', 'include land ceded by Mexico in 1848'],
  northwest_territory: ['carved from the Northwest Territory', 'was not part of the Northwest Territory', 'come from the Northwest Territory'],
  former_us_capital: ['that once hosted the US capital', 'never hosted the US capital', 'once hosted the US capital'],
  hosted_olympics: ['that have hosted the Olympics', 'has never hosted the Olympics', 'have hosted the Olympics'],
  ivy_league: ['with an Ivy League university', 'has no Ivy League university', 'have an Ivy League university'],
  nasa_center: ['with a NASA field center', 'has no NASA field center', 'have a NASA field center'],
  bird_cardinal: ['whose state bird is the cardinal', 'does not have the cardinal as its state bird', 'have the cardinal as their state bird'],
  bird_meadowlark: ['whose state bird is the western meadowlark', 'does not have the western meadowlark as its state bird', 'have the western meadowlark as their state bird'],
  bird_mockingbird: ['whose state bird is the mockingbird', 'does not have the mockingbird as its state bird', 'have the mockingbird as their state bird'],
  larger_than_uk: ['larger than the United Kingdom', 'is smaller than the United Kingdom', 'are larger than the United Kingdom'],
  more_cows_than_people: ['with more cattle than people', 'has more people than cattle', 'have more cattle than people'],
  capital_named_after_president: ['whose capital is named after a president', null, null],
  has_million_city: ['with a city of over one million people', 'has no city of over one million people', 'have a city of over one million people'],
  low_high_point: ['whose highest point is under 1,600 feet', 'has a high point above 1,600 feet', 'top out under 1,600 feet'],
  named_after_person: ['named after a real person', 'is not named after a person', 'are named after a real person'],
  multi_timezone: ['split between two time zones', 'sits in a single time zone', 'are split between two time zones'],
  statehood_1900s: ['that joined the Union after 1900', null, null],
  sub_new_england: ['in New England', 'is not in New England', 'are in New England'],
  paired_name: ['that share their name with another state', null, null],
  same_first_last: ['that start and end with the same letter', null, null],
  rare_letter: ['with a J, Q, X or Z in their name', null, null],
};

(async () => {
  const D = await load();
  const S = Object.fromEntries(D.states.map(s => [s.id, s]));
  const name = id => S[id].names.en;
  const ids = D.states.map(s => s.id);
  for (const [c, v] of Object.entries(CLUES)) if (!D.sets[c] || !D.label(c)) throw new Error('unknown clue ' + c);
  const videos = [];
  const add = (series, title, segs, post, medium = 'video') => videos.push({ series, title, segments: [...segs, OUTRO], post: post + ' ' + URL(medium) });

  // 1. Guess the state from its shape (22)
  let order = [...shuffle(ids), ...shuffle(ids), ...shuffle(ids)];
  for (let v = 0; v < 22; v++) {
    const five = []; while (five.length < 5) { const x = order.shift(); if (!five.includes(x)) five.push(x); else order.push(x); }
    const segs = [{ kind: 'say', tag: 'Guess the state', voice: 'Can you guess these five states from their shape? Three seconds each.', caption: 'Guess these 5 states from their shape. 3 seconds each.',
      visual: { type: 'hook', title: 'Guess the state from its shape', sub: '5 shapes, 3 seconds each' } }];
    five.forEach((id, i) => {
      const tag = `Shape ${i + 1} of 5`, q = { type: 'silhouette', id };
      segs.push({ kind: 'say', tag, voice: `Number ${i + 1}. Which state is this?`, caption: `#${i + 1}: which state is this?`, visual: q }, ...count(3, tag, q),
        { kind: 'say', tag, voice: `It's ${name(id)}. Capital: ${S[id].capital}.`, caption: `${name(id)}, capital ${S[id].capital}`, visual: { type: 'silhouette', id, reveal: true, name: name(id) } });
    });
    add('Guess the state', `Guess the state from its shape #${v + 1}`, segs, SHAPE_POSTS[v % SHAPE_POSTS.length].replace('{n}', v + 1));
  }

  // 2. Name the capital (15)
  order = [...shuffle(ids), ...shuffle(ids)];
  const caps = ids.map(i => S[i].capital);
  for (let v = 0; v < 15; v++) {
    const five = []; while (five.length < 5) { const x = order.shift(); if (!five.includes(x)) five.push(x); else order.push(x); }
    const segs = [{ kind: 'say', tag: 'Name the capital', voice: 'Five states, five capitals. Can you name them all?', caption: '5 states, 5 capitals. Can you name them all?',
      visual: { type: 'hook', title: 'Name the state capital', sub: '4 choices, 3 seconds' } }];
    five.forEach((id, i) => {
      const s = S[id], tag = `Capital ${i + 1} of 5`;
      const opts = [s.capital]; if (!s.capitalIsLargest && s.largestCity && s.largestCity !== s.capital) opts.push(s.largestCity);
      while (opts.length < 4) { const c = pick(caps); if (!opts.includes(c)) opts.push(c); }
      const o = shuffle(opts), q = { type: 'options', title: s.names.en, shape: id, opts: o };
      const extra = s.capitalIsLargest ? ' It is also its largest city.' : ` Not ${s.largestCity}, its largest city.`;
      segs.push({ kind: 'say', tag, voice: `What is the capital of ${s.names.en}?`, caption: `Capital of ${s.names.en}?`, visual: q }, ...count(3, tag, q),
        { kind: 'say', tag, voice: `${s.capital}.${extra}`, caption: `${s.capital}.${extra}`, visual: { ...q, correct: o.indexOf(s.capital) } });
    });
    add('Name the capital', `Name the capital #${v + 1}`, segs, `Capitals quiz #${v + 1}: ${join(five.map(name))}. Can you name all five capitals? ${TAGS[v % TAGS.length]}`);
  }

  // 3. The capital is not the biggest city (6)
  const notLargest = shuffle(ids.filter(i => !S[i].capitalIsLargest));
  for (let v = 0; v < 6; v++) {
    const five = notLargest.slice(v * 5, v * 5 + 5); if (five.length < 5) break;
    const segs = [{ kind: 'say', tag: 'Tricky capitals', voice: `In ${notLargest.length} of the 50 states, the capital is not the largest city. Can you name these capitals?`,
      caption: `In ${notLargest.length} states, the capital is NOT the biggest city`, visual: { type: 'hook', title: 'The capital is not the biggest city', sub: 'Can you name these 5?' } }];
    five.forEach((id, i) => {
      const s = S[id], tag = `Tricky capital ${i + 1} of 5`, opts = [s.capital, s.largestCity];
      while (opts.length < 4) { const c = pick(caps); if (!opts.includes(c)) opts.push(c); }
      const o = shuffle(opts), q = { type: 'options', title: s.names.en, shape: id, opts: o };
      segs.push({ kind: 'say', tag, voice: `The largest city in ${s.names.en} is ${s.largestCity}. But what is the capital?`, caption: `${s.names.en}: biggest city ${s.largestCity}. Capital?`, visual: q }, ...count(3, tag, q),
        { kind: 'say', tag, voice: `${s.capital}.`, caption: `${s.capital}`, visual: { ...q, correct: o.indexOf(s.capital) } });
    });
    add('Tricky capitals', `The capital is not the biggest city #${v + 1}`, segs, `${join(five.map(name))}: the biggest city is not the capital. Can you name the five capitals? ${TAGS[(v + 2) % TAGS.length]}`);
  }

  // 4. Name the states on the map (14 videos, two rounds each)
  const mapClues = shuffle(Object.keys(CLUES)).filter(c => D.sets[c].length >= 3 && D.sets[c].length <= 14).slice(0, 28);
  for (let v = 0; v < 14; v++) {
    const pair = mapClues.slice(v * 2, v * 2 + 2);
    const segs = [{ kind: 'say', tag: 'Map challenge', voice: 'Two map questions. Name every state before the reveal.', caption: 'Map challenge: name every state before the reveal',
      visual: { type: 'hook', title: 'Map challenge', sub: 'Two questions, five seconds each' } }];
    pair.forEach((c, r) => {
      const set = D.sets[c], n = set.length, q = CLUES[c][0], names = set.map(name).sort(), tag = `Question ${r + 1} of 2`;
      const hl = Object.fromEntries(set.map(i => [i, '#059669'])), title = `The ${n} states ${q}`, blank = { type: 'map', title, hl: {} };
      segs.push({ kind: 'say', tag, voice: `Can you name the ${n} states ${q}?`, caption: `Name the ${n} states ${q}`, visual: blank }, ...count(5, tag, blank),
        { kind: 'say', tag, voice: `Here they are: ${join(names)}.`, caption: join(names), visual: { type: 'map', title, hl, names, note: D.help(c) || '' } });
    });
    const qs = pair.map(c => `the ${D.sets[c].length} states ${CLUES[c][0]}`);
    add('Map challenge', `Map challenge: ${qs[0]}`, segs, `Map challenge: can you name ${qs[0]}, then ${qs[1]}? #geography #mapchallenge`);
  }

  // 5. Odd one out (12), three rounds each
  const oddClues = shuffle(Object.keys(CLUES).filter(c => CLUES[c][1] && D.sets[c].length >= 4 && D.sets[c].length <= 14));
  for (let v = 0; v < 12; v++) {
    const segs = [{ kind: 'say', tag: 'Odd one out', voice: 'Three rounds. In each, one state does not belong. Can you spot it?', caption: 'Spot the state that does not belong. 3 rounds.',
      visual: { type: 'hook', title: 'Odd one out', sub: '3 rounds, 3 seconds each' } }];
    for (let r = 0; r < 3; r++) {
      const c = oddClues[(v * 3 + r) % oddClues.length], set = D.sets[c], [, neg, all] = CLUES[c];
      const ins = shuffle(set).slice(0, 3), out = pick(ids.filter(i => !set.includes(i)));
      const o = shuffle([...ins, out]), tag = `Round ${r + 1} of 3`;
      const qv = { type: 'options', title: `Which one ${neg}?`, opts: o.map(name) };
      segs.push({ kind: 'say', tag, voice: `Which of these states ${neg}?`, caption: `Which one ${neg}?`, visual: qv }, ...count(3, tag, qv),
        { kind: 'say', tag, voice: `${name(out)}. The other three all ${all}.`, caption: `${name(out)}! The other three all ${all}.`, visual: { ...qv, correct: o.indexOf(out) } });
    }
    add('Odd one out', `Odd one out #${v + 1}`, segs, ODD_POSTS[v % ODD_POSTS.length].replace('{n}', v + 1));
  }

  // 6. Which joined the Union first? (10), five pairs each
  for (let v = 0; v < 10; v++) {
    const segs = [{ kind: 'say', tag: 'Which came first', voice: 'Two states. Which one joined the Union first? Four rounds.', caption: 'Which state joined the Union first? 4 rounds.',
      visual: { type: 'hook', title: 'Which joined the Union first?', sub: '4 pairs, 3 seconds each' } }];
    for (let r = 0; r < 4; r++) {
      let a, b; do { [a, b] = shuffle(ids).slice(0, 2); } while (S[a].admitted === S[b].admitted || Math.abs(S[a].admitted - S[b].admitted) < 8);
      const first = S[a].admitted < S[b].admitted ? a : b, later = first === a ? b : a, tag = `Round ${r + 1} of 4`;
      const qv = { type: 'vs', title: 'Joined the Union first?', a: { id: a, name: name(a) }, b: { id: b, name: name(b) } };
      segs.push({ kind: 'say', tag, voice: `${name(a)} or ${name(b)}?`, caption: `${name(a)} or ${name(b)}?`, visual: qv }, ...count(3, tag, qv),
        { kind: 'say', tag, voice: `${name(first)}, in ${S[first].admitted}. ${name(later)} followed in ${S[later].admitted}.`, caption: `${name(first)} ${S[first].admitted}, ${name(later)} ${S[later].admitted}`,
          visual: { ...qv, win: first === a ? 0 : 1, a: { ...qv.a, val: String(S[a].admitted) }, b: { ...qv.b, val: String(S[b].admitted) } } });
    }
    add('Which came first', `Which joined the Union first? #${v + 1}`, segs, `${segs[1].caption.replace('?', '')}: which joined the Union first? Four pairs in this one. ${['#history #USA', '#ushistory', '#history #trivia'][v % 3]}`);
  }

  // 7. Which is bigger? (10), five pairs each, by area rank among the 50
  for (let v = 0; v < 10; v++) {
    const segs = [{ kind: 'say', tag: 'Bigger or smaller', voice: 'Two states. Which one is bigger by area? Five rounds.', caption: 'Which state is bigger? 5 rounds.',
      visual: { type: 'hook', title: 'Which state is bigger?', sub: 'By area, 5 pairs' } }];
    for (let r = 0; r < 5; r++) {
      let a, b; do { [a, b] = shuffle(ids).slice(0, 2); } while (Math.abs(S[a].areaRank - S[b].areaRank) < 4);
      const big = S[a].areaRank < S[b].areaRank ? a : b, small = big === a ? b : a, tag = `Round ${r + 1} of 5`;
      const qv = { type: 'vs', title: 'Which is bigger?', a: { id: a, name: name(a) }, b: { id: b, name: name(b) } };
      segs.push({ kind: 'say', tag, voice: `${name(a)} or ${name(b)}?`, caption: `${name(a)} or ${name(b)}?`, visual: qv }, ...count(3, tag, qv),
        { kind: 'say', tag, voice: `${name(big)}, ${ord(S[big].areaRank)} of the 50 states by area. ${name(small)} is ${ord(S[small].areaRank)}.`,
          caption: `${name(big)}: ${ord(S[big].areaRank)} by area. ${name(small)}: ${ord(S[small].areaRank)}.`,
          visual: { ...qv, win: big === a ? 0 : 1, a: { ...qv.a, val: ord(S[a].areaRank) + ' by area' }, b: { ...qv.b, val: ord(S[b].areaRank) + ' by area' } } });
    }
    add('Bigger or smaller', `Which state is bigger? #${v + 1}`, segs, `${segs[1].caption.replace('?', '')}: which one is bigger? Five pairs, ranked by area. ${TAGS[(v + 1) % TAGS.length]}`);
  }

  // 8. Postal codes (6), five codes each, four choices with the same initial
  order = shuffle(ids.filter(i => ids.filter(j => j[0] === i[0]).length >= 3));
  for (let v = 0; v < 6; v++) {
    const five = order.slice(v * 5, v * 5 + 5); if (five.length < 5) break;
    const segs = [{ kind: 'say', tag: 'Postal codes', voice: 'Two letters, one state. Can you decode these postal codes?', caption: 'Decode these 5 state postal codes',
      visual: { type: 'hook', title: 'Which state is it?', sub: 'Two letters, four choices' } }];
    five.forEach((code, i) => {
      const same = shuffle(ids.filter(j => j !== code && j[0] === code[0])).slice(0, 3), o = shuffle([code, ...same]), tag = `Code ${i + 1} of 5`;
      const qv = { type: 'options', title: code, opts: o.map(name) };
      segs.push({ kind: 'say', tag, voice: `Which state is ${code.split('').join(' ')}?`, caption: `Which state is ${code}?`, visual: qv }, ...count(3, tag, qv),
        { kind: 'say', tag, voice: `${name(code)}.`, caption: `${code} = ${name(code)}`, visual: { ...qv, correct: o.indexOf(code) } });
    });
    add('Postal codes', `Which state is it? Postal codes #${v + 1}`, segs, `${five.join(', ')}: can you decode these five state postal codes? ${TAGS[(v + 3) % TAGS.length]}`);
  }

  // 9. Lists and rankings (5)
  const byArea = ids.slice().sort((a, b) => S[a].areaRank - S[b].areaRank);
  const lists = [
    ['The 5 largest states by area', byArea.slice(0, 5).map(i => `${name(i)}`), 'Can you name the five largest states by area, in order?', byArea.slice(0, 5)],
    ['The 5 smallest states by area', byArea.slice(-5).reverse().map(i => `${name(i)}`), 'Can you name the five smallest states by area, starting with the smallest?', byArea.slice(-5)],
    ['The 5 states that joined after 1900', D.sets.statehood_1900s.slice().sort((a, b) => S[a].admitted - S[b].admitted || name(a).localeCompare(name(b))).map(i => `${name(i)}, ${S[i].admitted}`), 'Only five states joined the Union after 1900. Can you name them?', D.sets.statehood_1900s],
    ['Capitals named after presidents', D.sets.capital_named_after_president.map(i => `${S[i].capital}, ${name(i)}`), 'Four state capitals are named after a US president. Can you name them?', D.sets.capital_named_after_president],
    ['Capitals that end in City', D.sets.capital_has_city.map(i => `${S[i].capital}, ${name(i)}`), 'Four state capitals end in the word City. Can you name them?', D.sets.capital_has_city],
  ];
  for (const [title, items, ask, hlIds] of lists) {
    const hl = Object.fromEntries(hlIds.map(i => [i, '#059669']));
    const segs = [{ kind: 'say', tag: 'Top list', voice: ask + ' Pause and try.', caption: ask, visual: { type: 'hook', title, sub: 'Answer before the reveal' } },
      ...count(5, 'Top list', { type: 'map', title, hl: {} }),
      ...items.map((it, k) => ({ kind: 'say', tag: `${k + 1} of ${items.length}`, voice: `Number ${k + 1}: ${it}.`, caption: it,
        visual: { type: 'list', title, items: items.slice(0, k + 1) } })),
      { kind: 'say', tag: 'On the map', voice: 'And here they are on the map.', caption: 'On the map', visual: { type: 'map', title, hl, names: hlIds.map(name) } }];
    add('Top list', title, segs, `${ask} Answer in the video. #geography #USA`);
  }

  // Interleave the series so that the posting order alternates formats.
  const bySeries = {}; videos.forEach(v => (bySeries[v.series] = bySeries[v.series] || []).push(v));
  const out = []; while (Object.values(bySeries).some(a => a.length)) for (const a of Object.values(bySeries)) if (a.length) out.push(a.shift());
  out.forEach((v, i) => { v.n = i + 1; v.slug = String(i + 1).padStart(3, '0') + '-' + v.title.toLowerCase().replace(/[^a-z0-9]+/g, '-').replace(/^-|-$/g, '').slice(0, 50); });
  const DASH = /[‐-―−]/;
  for (const v of out) for (const s of v.segments) if (DASH.test(JSON.stringify(s)) || DASH.test(v.post)) throw new Error('unicode dash in ' + v.slug);
  fs.writeFileSync(path.join(__dirname, 'videos.json'), JSON.stringify(out, null, 1));
  const counts = {}; out.forEach(v => counts[v.series] = (counts[v.series] || 0) + 1);
  console.log(out.length, 'videos', counts);
})();
