#!/usr/bin/env node
// Puts the format tests of experiments.json and experiments-anim.json into data/videos.json, at the
// place the bot reads next, so that a different format goes out every day: TikTok and YouTube Shorts in the 23:00 UTC run (index
// counted from shorts_epoch), X in the 13:00 UTC run (index from epoch, set
// here so that X starts the tests the day after the shorts). Idempotent.
// Re-run after build-bank.cjs, which rebuilds the list without them.
//   node scripts/video/add-experiments.cjs [AT_INDEX] [X_EPOCH]
const fs = require('fs'), path = require('path');
const ROOT = path.resolve(__dirname, '..', '..'), P = path.join(ROOT, 'data/videos.json');
const AT = +(process.argv[2] || 11), X_EPOCH = process.argv[3] || '2026-10-31';
// Posting order: the formats furthest from the old quizzes first.
const ORDER = ['last-state-standing', 'bounce-out', 'from-space', 'map-builds-itself', 'state-puns', 'line-closes', 'time-lapse', 'blind-ranking', 'three-clues', 'upside-down', 'zoom-out', 'spot-the-mistake', 'letter-challenge', 'grid-cell'];
// The still-slide tests (make-experiments.cjs) and the animated ones (make-anim.cjs).
const exp = ['experiments.json', 'experiments-anim.json'].flatMap(f => JSON.parse(fs.readFileSync(path.join(__dirname, f), 'utf8')));
const bank = JSON.parse(fs.readFileSync(P, 'utf8'));
bank.videos = bank.videos.filter(v => !v.exp);
const rows = ORDER.map((f, i) => {
  const v = exp.find(x => x.slug.slice(4) === f); if (!v) throw new Error('no test video ' + f);
  for (const d of ['media/videos', 'media/videos/tiktok']) if (!fs.existsSync(path.join(ROOT, d, v.slug + '.mp4'))) throw new Error('missing ' + d + '/' + v.slug + '.mp4');
  return { n: 101 + i, exp: true, format: v.format, slug: v.slug, text: v.post, url: `https://statedoku.com/media/videos/${v.slug}.mp4`, tiktok: v.tiktok,
    vertical_url: `https://statedoku.com/media/videos/tiktok/${v.slug}.mp4`, youtube: v.youtube };
});
bank.videos.splice(AT, 0, ...rows);
bank.epoch = X_EPOCH;
bank.note_tests = 'Entries with exp:true are the ten format tests of 10 November 2026 (scripts/video/make-experiments.cjs, add-experiments.cjs); results in scripts/video/EXPERIMENTS.md.';
fs.writeFileSync(P, JSON.stringify(bank, null, 1) + '\n');
const day = (e, i) => new Date(Date.parse(e + 'T00:00:00Z') + i * 86400000).toISOString().slice(0, 10);
rows.forEach((r, i) => console.log(r.slug.padEnd(22), 'TikTok/YouTube', day(bank.shorts_epoch, AT + i), '| X', day(bank.epoch, AT + i)));
console.log(bank.videos.length, 'videos in the list');
