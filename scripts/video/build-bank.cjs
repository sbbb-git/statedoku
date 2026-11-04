#!/usr/bin/env node
// Writes data/videos.json, the list the posting worker reads in its 13:00 UTC
// run (the video replaces the game tweet that day): one video a day from EPOCH, in videos.json order, each with its
// post text and the URL of its MP4 under /media/videos/ on the site.
//   node scripts/video/build-bank.cjs [EPOCH]
const fs = require('fs'), path = require('path');
const ROOT = path.resolve(__dirname, '..', '..');
const EPOCH = process.argv[2] || '2026-11-05';
const v = JSON.parse(fs.readFileSync(path.join(__dirname, 'videos.json'), 'utf8'));
const missing = v.filter(x => !fs.existsSync(path.join(ROOT, 'media/videos', x.slug + '.mp4')));
if (missing.length) { console.error('missing MP4s:', missing.length, missing.slice(0, 3).map(x => x.slug)); process.exit(1); }
const bank = { version: 1, epoch: EPOCH, note: 'One video a day in the 13:00 UTC run from epoch; built by scripts/video/build-bank.cjs.',
  videos: v.map(x => ({ n: x.n, slug: x.slug, text: x.post, url: `https://statedoku.com/media/videos/${x.slug}.mp4` })) };
fs.writeFileSync(path.join(ROOT, 'data/videos.json'), JSON.stringify(bank, null, 1) + '\n');
const last = new Date(Date.parse(EPOCH + 'T00:00:00Z') + (v.length - 1) * 86400000).toISOString().slice(0, 10);
console.log(`data/videos.json: ${v.length} videos, ${EPOCH} to ${last}`);
