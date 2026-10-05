// Render functions/sitemap.xml.js locally and compare it to the indexable,
// self-canonical pages on disk. Both lists must match exactly. On 5 October
// 2026 thirteen retired pages stayed listed because two loops generated them
// rather than fixed lines; a grep of the source called it clean.
// Run: node scripts/audit-sitemap.mjs
// Render the sitemap function locally and compare it to the indexable pages on disk.
import { onRequestGet as onRequest } from '../functions/sitemap.xml.js';
import fs from 'node:fs'; import path from 'node:path'; import { fileURLToPath } from 'node:url';
const ROOT = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '..');
const res = await onRequest({ request: new Request('https://statedoku.com/sitemap.xml'), env: {} });
const xml = await res.text();
const locs = new Set([...xml.matchAll(/<loc>([^<]+)<\/loc>/g)].map(m => m[1].replace('https://statedoku.com', '')));
const idx = new Set();
function walk(d) { for (const e of fs.readdirSync(d, { withFileTypes: true })) {
  if (['tmp','admin','node_modules','.git','bot','marketing','logos','email-worker','scripts','functions','seo-snapshots','audience-snapshots'].includes(e.name)) continue;
  const f = path.join(d, e.name);
  if (e.isDirectory()) walk(f); else if (e.name === 'index.html') {
    const h = fs.readFileSync(f, 'utf8'); if (/name="robots" content="[^"]*noindex/.test(h) || /http-equiv="refresh"/i.test(h)) continue;
    const u = '/' + path.relative(ROOT, path.dirname(f)).replace(/^$/, '') + '/';
    const c = h.match(/rel="canonical" href="https:\/\/statedoku\.com([^"]*)"/); if (c && c[1] !== u.replace('//','/')) continue;
    idx.add(u.replace('//', '/')); } } }
walk(ROOT);
console.log('sitemap', locs.size, 'indexable self-canonical', idx.size);
console.log('in sitemap, not indexable:', [...locs].filter(u => !idx.has(u)).slice(0, 20));
console.log('indexable, not in sitemap:', [...idx].filter(u => !locs.has(u)).slice(0, 20));
