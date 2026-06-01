#!/usr/bin/env node
/**
 * Generic UTM patcher: reads the **Slug:** line of each mail block and tags
 * every statedoku.com URL inside the ```code fence``` with utm_content=<slug>.
 *
 * Idempotent. Pass the mail file as the only arg.
 *   node marketing/utm-patch-batch.js marketing/outreach-batch-2.md
 */
const fs = require('fs');
const path = require('path');

const FILE = path.resolve(process.cwd(), process.argv[2] || 'marketing/outreach-batch-2.md');
const CAMPAIGN = process.argv[3] || 'launch-2026';
const BASE_PARAMS = `utm_source=outreach&utm_medium=email&utm_campaign=${CAMPAIGN}`;

if (!fs.existsSync(FILE)) {
  console.error('❌ File not found:', FILE);
  process.exit(1);
}

function stripUtm(url) {
  return url.replace(/[?&]utm_source=outreach[^\s)>"']*/g, '').replace(/\?$/, '');
}

function addUtm(url, content) {
  const stripped = stripUtm(url);
  const m = stripped.match(/^(https:\/\/(?:www\.)?statedoku\.com(?:\/[^\s)>"']*)?)([.,;:)"']*)$/);
  if (!m) return url;
  let clean = m[1];
  const tail = m[2];
  if (/^https:\/\/(?:www\.)?statedoku\.com$/.test(clean)) clean += '/';
  const params = `${BASE_PARAMS}&utm_content=${content}`;
  clean = clean + (clean.includes('?') ? '&' : '?') + params;
  return clean + tail;
}

let md = fs.readFileSync(FILE, 'utf8');
const blocks = md.split(/(?=^## )/m);
let totalTagged = 0;
const report = [];

const patched = blocks.map(block => {
  // Skip non-mail blocks (intro / "Action" headers etc.)
  if (!block.startsWith('## ') || !block.includes('```')) return block;
  const slugMatch = block.match(/\*\*Slug:\*\*\s*([a-z0-9-]+)/i);
  if (!slugMatch) return block;
  const slug = slugMatch[1];

  let blockTagged = 0;
  const patchedBlock = block.replace(/```([\s\S]*?)```/g, (_, code) => {
    const newCode = code.replace(
      /(https:\/\/(?:www\.)?statedoku\.com(?:\/[^\s)>"']*)?)/g,
      (url) => {
        const tagged = addUtm(url, slug);
        if (tagged !== url) blockTagged++;
        return tagged;
      }
    );
    return '```' + newCode + '```';
  });

  if (blockTagged) {
    report.push({ slug, count: blockTagged });
    totalTagged += blockTagged;
  }
  return patchedBlock;
}).join('');

fs.writeFileSync(FILE, patched);

console.log('UTM tags applied per slug:');
report.forEach(r => console.log(`  ${r.slug.padEnd(22)} → ${r.count} link${r.count === 1 ? '' : 's'}`));
console.log(`\n✅ ${totalTagged} URLs tagged across ${report.length} mails in ${path.relative(process.cwd(), FILE)}`);
console.log(`   Campaign: ${CAMPAIGN}`);
