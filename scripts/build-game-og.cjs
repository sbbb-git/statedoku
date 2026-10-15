#!/usr/bin/env node
/*
 * Social and answer-engine preview images for the 21 games and the /play/ hub,
 * in English, French and Spanish: og/og-play-<slug>-<lang>.jpg, 1200x630, JPEG at quality 85 (a PNG of the gradient
 * and map weighed 380 KB; the JPEG is a fraction of that).
 *
 * Until 15 October 2026 all 66 play pages shared og-learn-state-capitals.png,
 * a card titled "Memorize the 50 State Capitals", so a shared Confederate
 * States quiz previewed as a capitals article. Each card now carries the
 * game's own title and first sentence, read from its page, over the US map.
 * The five map games light up their answer set, read from the game's code or
 * from data/states.json, never typed here.
 *
 * Needs Playwright with Chromium. Optional INTER_WOFF2=/path/to/inter.woff2;
 * without it the card falls back to Arial.
 *   NODE_PATH=/path/to/node_modules node scripts/build-game-og.cjs
 * Then point each page at its image: python3 scripts/set-game-og.py
 */
const fs = require('fs');
const path = require('path');
const { chromium } = require('playwright');

const ROOT = path.resolve(__dirname, '..');
const LANGS = { en: '', fr: 'fr/', es: 'es/' };
const LABEL = { en: 'Free geography game', fr: 'Jeu de géographie gratuit', es: 'Juego de geografía gratis' };
const HUB_LABEL = { en: '21 free geography games', fr: '21 jeux de géographie gratuits', es: '21 juegos de geografía gratis' };
const FOOT = { en: 'statedoku.com · No signup', fr: 'statedoku.com · Sans inscription', es: 'statedoku.com · Sin registro' };

const states = JSON.parse(fs.readFileSync(path.join(ROOT, 'data/states.json'), 'utf8'));
const svg = fs.readFileSync(path.join(ROOT, 'data/us-map.svg'), 'utf8');
const paths = [...svg.matchAll(/<path id="us-([A-Z]{2})"[^>]*\sd="([^"]+)"/g)].map((m) => [m[1], m[2]]);
if (paths.length !== 50) throw new Error(`us-map.svg gave ${paths.length} state paths, expected 50`);

function answerSet(slug) {
  if (slug === 'border-states') {
    return states.filter((s) => s.bordersCanada || s.bordersMexico).map((s) => s.id);
  }
  if (!['swing-states', 'no-income-tax-states', 'confederate-states', 'thirteen-colonies'].includes(slug)) return [];
  const src = fs.readFileSync(path.join(ROOT, 'play', slug, 'index.html'), 'utf8');
  const m = src.match(/\[("[A-Z]{2}",?\s*){4,13}\]/);
  if (!m) throw new Error(`no answer array found in play/${slug}`);
  return JSON.parse(m[0]);
}

function decode(s) {
  return s.replace(/&amp;/g, '&').replace(/&#39;|&rsquo;/g, '’').replace(/&quot;/g, '"').replace(/<[^>]+>/g, '').trim();
}
function esc(s) {
  return s.replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;');
}

function card(lang, slug, title, sub, lit) {
  const font = process.env.INTER_WOFF2
    ? `@font-face{font-family:Inter;src:url(file://${process.env.INTER_WOFF2}) format('woff2');font-weight:100 900}`
    : '';
  const set = new Set(lit);
  const map = paths.map(([id, d]) =>
    `<path d="${d}" fill="${set.has(id) ? '#F59E0B' : 'rgba(255,255,255,0.16)'}" stroke="#0F2147" stroke-width="1.6"/>`).join('');
  const label = slug === 'hub' ? HUB_LABEL[lang] : LABEL[lang];
  return `<!doctype html><html><head><meta charset="utf-8"><style>${font}
  *{margin:0;box-sizing:border-box}
  body{width:1200px;height:630px;overflow:hidden;font-family:Inter,Arial,sans-serif;
       background:linear-gradient(135deg,#0F2147 0%,#1E3A8A 100%);color:#fff;position:relative}
  .brand{position:absolute;left:60px;top:48px;font-size:34px;font-weight:800;letter-spacing:-0.5px}
  .brand b{color:#F87171;font-weight:800}
  .txt{position:absolute;left:60px;top:150px;width:520px}
  .label{font-size:22px;font-weight:700;letter-spacing:2px;text-transform:uppercase;color:#FBBF24;margin-bottom:22px}
  h1{font-size:${title.length > 26 ? 50 : 60}px;line-height:1.08;font-weight:800;letter-spacing:-1px;margin-bottom:24px}
  p{font-size:26px;line-height:1.35;color:#DBE4F5}
  .foot{position:absolute;left:60px;bottom:52px;font-size:22px;font-weight:600;color:#C7D2FE}
  .bar{position:absolute;left:0;right:0;bottom:0;height:14px;background:#F59E0B}
  svg{position:absolute;left:600px;top:120px;width:560px;height:350px}
  </style></head><body>
  <div class="brand">State<b>doku</b></div>
  <div class="txt"><div class="label">${esc(label)}</div><h1>${esc(title)}</h1><p>${esc(sub)}</p></div>
  <svg viewBox="0 0 975 610" xmlns="http://www.w3.org/2000/svg">${map}</svg>
  <div class="foot">${esc(FOOT[lang])}</div><div class="bar"></div>
  </body></html>`;
}

(async () => {
  const browser = await chromium.launch({ executablePath: process.env.CHROMIUM || '/opt/pw-browsers/chromium' });
  const page = await browser.newPage({ viewport: { width: 1200, height: 630 } });
  const hub = fs.readFileSync(path.join(ROOT, 'play/index.html'), 'utf8');
  const slugs = [...hub.matchAll(/"url":"https:\/\/statedoku\.com\/play\/([a-z0-9-]+)\/"/g)].map((m) => m[1]);
  if (slugs.length !== 21) throw new Error(`/play/ lists ${slugs.length} games, expected 21`);
  let n = 0;
  for (const [lang, pre] of Object.entries(LANGS)) {
    for (const slug of [...slugs, 'hub']) {
      const file = path.join(ROOT, pre + 'play', slug === 'hub' ? '' : slug, 'index.html');
      const src = fs.readFileSync(file, 'utf8');
      const h1 = decode(src.match(/<h1[^>]*>([\s\S]*?)<\/h1>/)[1]);
      const desc = decode(src.match(/<meta name="description" content="([^"]*)"/)[1]);
      const title = h1;
      const sub = slug === 'hub' ? 'English · Français · Español'
                                 : desc.split(/(?<=[.!?])\s/)[0];
      await page.setContent(card(lang, slug, title, sub, answerSet(slug)), { waitUntil: 'load' });
      await page.evaluate(() => document.fonts.ready);
      const overflow = await page.evaluate(() => {
        const t = document.querySelector('.txt').getBoundingClientRect();
        return t.bottom > 560;
      });
      if (overflow) throw new Error(`${lang}/${slug}: text runs into the footer`);
      await page.screenshot({ path: path.join(ROOT, 'og', `og-play-${slug}-${lang}.jpg`), type: 'jpeg', quality: 85 });
      n++;
    }
  }
  await browser.close();
  console.log(`wrote ${n} images`);
})().catch((e) => { console.error(e.message); process.exit(1); });
