#!/usr/bin/env node
// Parses every inline <script> (not JSON-LD) of every HTML page, so a quote
// that breaks a whole game script is caught before it ships. On 4 November 2026
// six French map games had been dead since 22 October over one apostrophe
// ("n'a" inside a single-quoted string) and no gate looked. Exits 1 on any.
const fs = require('fs'), path = require('path'), vm = require('vm');
const ROOT = path.resolve(__dirname, '..');
const SKIP = new Set(['node_modules', '.git', 'tmp', 'marketing', 'seo-snapshots', 'audience-snapshots', 'bot', 'email-worker']);
const files = [];
(function walk(d) { for (const e of fs.readdirSync(d, { withFileTypes: true })) {
  if (e.isDirectory()) { if (!SKIP.has(e.name)) walk(path.join(d, e.name)); }
  else if (e.name.endsWith('.html')) files.push(path.join(d, e.name)); } })(ROOT);
let scripts = 0, bad = 0;
for (const f of files) {
  const html = fs.readFileSync(f, 'utf8');
  for (const m of html.matchAll(/<script\b([^>]*)>([\s\S]*?)<\/script>/gi)) {
    const attrs = m[1];
    if (/\bsrc=/.test(attrs) || /type="application\/(ld\+)?json"/.test(attrs) || /type="text\/(template|x-)/.test(attrs) || !m[2].trim()) continue;
    scripts++;
    if (/type="module"/.test(attrs)) { scripts--; continue; }   // none today; would need a module parser
    try { new vm.Script(m[2], { filename: f }); }
    catch (e) { bad++; if (bad <= 20) console.log('FAIL', path.relative(ROOT, f), e.message); }
  }
}
console.log(`inline scripts: ${scripts} parsed in ${files.length} pages, ${bad} broken`);
process.exit(bad ? 1 : 0);
