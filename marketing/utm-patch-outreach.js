#!/usr/bin/env node
/**
 * Patch marketing/outreach-mails-personalized.md to swap every
 * bare https://statedoku.com[...] link inside a mail with a UTM-tagged version.
 *
 * Each mail gets a unique utm_content (the recipient slug) so we can see in CF
 * Web Analytics which contacts actually drove traffic, even if they don't reply.
 *
 * Idempotent: re-running won't double-tag links.
 */
const fs = require('fs');
const path = require('path');

const FILE = path.resolve(__dirname, 'outreach-mails-personalized.md');
const BASE_PARAMS = 'utm_source=outreach&utm_medium=email&utm_campaign=wordle-alt-2026';

// Recipient slug per mail block (matching headers `## 1️⃣ … — Site Name`)
const RECIPIENT_SLUGS = {
  '1': 'medium-floodgates',
  '2': 'beebom',
  '3': 'tomsguide',
  '4': 'businessinsider',
  '5': 'playdaily',
  '6': 'techdator',
  '7': 'magnitudle',
  '8': 'cnet',
  '9': 'crosswordle',
  '10': 'vibearcade',
  '11': 'denofgeek',
  '12': 'wordproxi',
  '13': 'thedailychillpill',
  '14': 'rushle',
  '15': 'mashable',
};

let md = fs.readFileSync(FILE, 'utf8');

// Split on every line that starts with "## " (any h2). We'll filter to recipient
// mail blocks by their domain content (each header mentions a known site/person).
const parts = md.split(/(?=^## )/m);

// Identify the mail number by matching the header text against per-recipient cues.
// More robust than parsing emoji digits (some headers use 🔟, others 1️⃣1️⃣, etc).
const CUES = [
  { num: '1',  re: /(Floodgates|Drew Patty|Medium)/i },
  { num: '2',  re: /(Beebom|Ishan)/i },
  { num: '3',  re: /(Tom'?s Guide|Marc McLaren)/i },
  { num: '4',  re: /(Business Insider|Antonelli)/i },
  { num: '5',  re: /PlayDaily/i },
  { num: '6',  re: /(TechDator|Harsh Sharma)/i },
  { num: '7',  re: /Magnitudle/i },
  { num: '8',  re: /CNET/i },
  { num: '9',  re: /Crosswordle/i },
  { num: '10', re: /Vibe Arcade/i },
  { num: '11', re: /Den of Geek/i },
  { num: '12', re: /Wordproxi/i },
  { num: '13', re: /Daily Chill Pill/i },
  { num: '14', re: /Rushle/i },
  { num: '15', re: /Mashable/i },
];

const numFromHeader = (block) => {
  const headerLine = (block.match(/^## .*/m) || [''])[0];
  for (const c of CUES) if (c.re.test(headerLine)) return c.num;
  return null;
};

function stripUtm(url) {
  // Strip any existing outreach UTM params so we can re-tag with the right slug.
  return url.replace(/[?&]utm_source=outreach[^\s)>"']*/g, '').replace(/\?$/, '');
}

function addUtm(url, content) {
  // Re-tag from scratch (in case a previous broken run set the wrong slug).
  const stripped = stripUtm(url);
  // Split potential trailing punctuation (matches bare domain too: zero-or-more chars after .com)
  const m = stripped.match(/^(https:\/\/(?:www\.)?statedoku\.com(?:\/[^\s)>"']*)?)([.,;:)"']*)$/);
  if (!m) return url;
  let clean = m[1];
  const tail = m[2];
  // Normalize bare domain to include trailing slash for cleaner URLs in mails
  if (/^https:\/\/(?:www\.)?statedoku\.com$/.test(clean)) clean += '/';
  const params = `${BASE_PARAMS}&utm_content=${content}`;
  clean = clean + (clean.includes('?') ? '&' : '?') + params;
  return clean + tail;
}

const patched = parts.map(block => {
  const num = numFromHeader(block);
  if (!num) return block; // header sections / intro
  const slug = RECIPIENT_SLUGS[num];
  if (!slug) return block;

  // Only swap statedoku.com URLs that sit inside the mail body (the ```…``` block).
  return block.replace(/```([\s\S]*?)```/g, (full, codeBody) => {
    const patchedBody = codeBody.replace(
      /(https:\/\/(?:www\.)?statedoku\.com(?:\/[^\s)>"']*)?)/g,
      (m) => addUtm(m, slug)
    );
    return '```' + patchedBody + '```';
  });
}).join('');

fs.writeFileSync(FILE, patched);

// Report
const counted = Object.entries(RECIPIENT_SLUGS).map(([n, s]) => {
  const re = new RegExp(`utm_content=${s}\\b`, 'g');
  return { n, s, count: (patched.match(re) || []).length };
});
console.log('UTM tags applied per mail:');
for (const { n, s, count } of counted) {
  console.log(`  #${n.padStart(2)} ${s.padEnd(22)} → ${count} link${count === 1 ? '' : 's'}`);
}
console.log(`\n✅ Patched ${path.relative(process.cwd(), FILE)}`);
