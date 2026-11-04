#!/usr/bin/env node
// Renders one 1080x1920 PNG per segment of every video in videos.json.
//   node scripts/video/render-frames.cjs <out_dir> [first_n]
const fs = require('fs'), path = require('path');
const { chromium } = require('/opt/node-tools/node_modules/playwright');
const ROOT = path.resolve(__dirname, '..', '..');
const OUT = process.argv[2], N = +process.argv[3] || 1e9, SCALE = +(process.env.SCALE || 2 / 3);
const videos = JSON.parse(fs.readFileSync(path.join(__dirname, 'videos.json'), 'utf8')).slice(0, N);
const logo = 'data:image/png;base64,' + fs.readFileSync(path.join(ROOT, 'logo-mark-192.png')).toString('base64');
const html = fs.readFileSync(path.join(__dirname, 'template.html'), 'utf8')
  .replace('LOGO', logo).replace('MAPSVG', fs.readFileSync(path.join(ROOT, 'data/us-map.svg'), 'utf8'));
(async () => {
  const b = await chromium.launch({ executablePath: '/opt/pw-browsers/chromium' });
  const jobs = videos.slice(); let done = 0;
  async function worker() {
    // Laid out at 1080x1920, captured at SCALE (2/3 gives 720x1280, what X is sent).
    const p = await b.newPage({ viewport: { width: 1080, height: 1920 }, deviceScaleFactor: SCALE });
    await p.setContent(html, { waitUntil: 'load' });
    await p.evaluate(() => document.fonts.ready);
    while (jobs.length) {
      const v = jobs.shift(), dir = path.join(OUT, v.slug);
      fs.mkdirSync(dir, { recursive: true });
      for (let i = 0; i < v.segments.length; i++) {
        const f = path.join(dir, `f${String(i).padStart(3, '0')}.jpg`);
        if (fs.existsSync(f)) continue;
        await p.evaluate(seg => window.render(seg), v.segments[i]);
        await p.screenshot({ path: f, type: 'jpeg', quality: 90 });
      }
      done++; if (done % 10 === 0) console.log('frames', done, '/', videos.length);
    }
  }
  await Promise.all([worker(), worker(), worker(), worker()]);
  await b.close();
  console.log('frames done', videos.length);
})();
