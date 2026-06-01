#!/usr/bin/env node
/**
 * Send the 15 outreach mails via Resend (DKIM-signed by statedoku.com → inbox).
 *
 * Usage:
 *   RESEND_API_KEY=re_xxx node marketing/send-outreach.js --dry-run
 *     → preview each mail without sending (no API call). Use first.
 *   RESEND_API_KEY=re_xxx node marketing/send-outreach.js --send 1
 *     → send only mail #1
 *   RESEND_API_KEY=re_xxx node marketing/send-outreach.js --send 1,2,3
 *     → send mails #1, #2, #3
 *   RESEND_API_KEY=re_xxx node marketing/send-outreach.js --send all
 *     → send ALL 15 (use with care — better spread over days)
 *
 * Tracks what was sent in marketing/outreach-sent.json (idempotent — won't
 * resend the same mail twice unless you delete the entry).
 *
 * Each mail uses:
 *   From: Sacha Bitoun <sacha@statedoku.com>
 *   Reply-To: sacha@statedoku.com  (replies forward to your Gmail via CF Email Routing)
 *   DKIM signed by statedoku.com via Resend → DMARC pass → inbox
 */

const fs = require('fs');
const path = require('path');

const STATE_FILE = path.resolve(__dirname, 'outreach-sent.json');

// --file <path> overrides the default mail file. Default = batch 1.
let MD_FILE = path.resolve(__dirname, 'outreach-mails-personalized.md');
const fileIdx = process.argv.indexOf('--file');
if (fileIdx > -1 && process.argv[fileIdx + 1]) {
  MD_FILE = path.resolve(process.cwd(), process.argv[fileIdx + 1]);
}

const FROM = 'Sacha Bitoun <sacha@statedoku.com>';
const REPLY_TO = 'sacha@statedoku.com';

// ── Args ─────────────────────────────────────────────────────────────────
const args = process.argv.slice(2);
const isDryRun = args.includes('--dry-run');
const sendArgIdx = args.indexOf('--send');
let sendTargets = null; // null = no send (dry-run by default if not specified)
if (sendArgIdx > -1 && args[sendArgIdx + 1]) {
  const raw = args[sendArgIdx + 1].trim().toLowerCase();
  if (raw === 'all') sendTargets = 'all';
  else sendTargets = raw.split(',').map(n => parseInt(n.trim(), 10)).filter(Boolean);
}

if (!isDryRun && !sendTargets) {
  console.error('❌ Specify --dry-run OR --send 1,2,3 OR --send all');
  console.error('   Example: RESEND_API_KEY=re_xxx node marketing/send-outreach.js --dry-run');
  process.exit(1);
}

if (!isDryRun && !process.env.RESEND_API_KEY) {
  console.error('❌ RESEND_API_KEY env var missing.');
  console.error('   Get it at https://resend.com/api-keys');
  console.error('   Run: RESEND_API_KEY=re_xxx node marketing/send-outreach.js --send 1');
  process.exit(1);
}

// ── Parse mails from markdown ─────────────────────────────────────────────
const md = fs.readFileSync(MD_FILE, 'utf8');

// Each mail block starts with "## N…" header. We extract:
//   - mail number from CUES
//   - recipient label from header
//   - To: line from the meta
//   - Subject + body from the ```...``` code fence

const CUES = [
  { num: 1,  re: /(Floodgates|Drew Patty|Medium)/i,  label: 'Drew Patty (Medium / Floodgates)' },
  { num: 2,  re: /(Beebom|Ishan)/i,                  label: 'Ishan Adhikary (Beebom)' },
  { num: 3,  re: /(Tom'?s Guide|Marc McLaren)/i,     label: "Marc McLaren (Tom's Guide)" },
  { num: 4,  re: /(Business Insider|Antonelli)/i,    label: 'W. Antonelli (Business Insider)' },
  { num: 5,  re: /PlayDaily/i,                       label: 'PlayDaily.org' },
  { num: 6,  re: /(TechDator|Harsh Sharma)/i,        label: 'Harsh Sharma (TechDator)' },
  { num: 7,  re: /Magnitudle/i,                      label: 'Magnitudle.com' },
  { num: 8,  re: /CNET/i,                            label: 'CNET reference team' },
  { num: 9,  re: /Crosswordle/i,                     label: 'Crosswordle.com' },
  { num: 10, re: /Vibe Arcade/i,                     label: 'Vibe Arcade' },
  { num: 11, re: /Den of Geek/i,                     label: 'Den of Geek' },
  { num: 12, re: /Wordproxi/i,                       label: 'Wordproxi.com' },
  { num: 13, re: /Daily Chill Pill/i,                label: 'The Daily Chill Pill' },
  { num: 14, re: /Rushle/i,                          label: 'Rushle.io' },
  { num: 15, re: /Mashable/i,                        label: 'Mashable' },
];

function extractToEmail(metaBlock) {
  // Looks for "**To:** xxx@yyy.com" — pulls first email
  const m = metaBlock.match(/\*\*To:\*\*\s*([^\s(]+@[^\s)]+)/i);
  return m ? m[1].trim() : null;
}

function extractTaglineHints(metaBlock) {
  const da = metaBlock.match(/\*\*DA:\*\*\s*([^\n]+)/i);
  const art = metaBlock.match(/\*\*Article:\*\*\s*([^\n]+)/i);
  return { da: da?.[1]?.trim(), article: art?.[1]?.trim() };
}

function parseMail(block, sequentialIndex) {
  const headerLine = (block.match(/^## .*/m) || [''])[0];
  // Skip non-mail headers (intro, "🚀 Action", etc.) — a real mail block has a ```code fence
  if (!block.includes('```')) return null;

  // Try CUES first (batch 1 uses keyword matching), otherwise fall back to
  // the **Slug:** line (batch 2+) or auto-derive from header.
  let cue = CUES.find(c => c.re.test(headerLine));
  if (!cue) {
    const slugLine = block.match(/\*\*Slug:\*\*\s*([a-z0-9-]+)/i);
    const slug = slugLine ? slugLine[1] : null;
    if (!slug) return null;
    // Strip emoji-digit prefix from header to get a readable label
    const labelText = headerLine.replace(/^## (?:[\d️⃣🔟]+\s+)?/, '').trim();
    cue = { num: sequentialIndex, re: null, label: labelText, slug };
  }

  // Meta lines are between header and the first ``` code fence
  const codeFenceIdx = block.indexOf('```');
  if (codeFenceIdx < 0) return null;
  const metaBlock = block.slice(0, codeFenceIdx);
  const codeBlock = block.slice(codeFenceIdx);

  const to = extractToEmail(metaBlock);
  if (!to) return { num: cue.num, label: cue.label, error: 'No To: email found in meta' };

  // Code block content
  const fenceMatch = codeBlock.match(/```([\s\S]*?)```/);
  if (!fenceMatch) return { num: cue.num, label: cue.label, error: 'No code fence body' };
  const body = fenceMatch[1].trim();

  // Subject is the first "Subject: ..." line
  const subjectMatch = body.match(/^Subject:\s*(.+)$/m);
  if (!subjectMatch) return { num: cue.num, label: cue.label, error: 'No Subject: in body' };
  const subject = subjectMatch[1].trim();

  // Everything after the Subject: line is the body
  const bodyAfterSubject = body.slice(body.indexOf(subjectMatch[0]) + subjectMatch[0].length).replace(/^\n+/, '');

  // Convert to plain text (it's already plain), wrap to HTML for Resend
  // Keep newlines as <br> in HTML version, keep as-is in text version
  const escapeHtml = s => s.replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;');
  const html = `<div style="font-family:Helvetica,Arial,sans-serif;font-size:14px;line-height:1.55;color:#0A0A0A;max-width:600px;">${escapeHtml(bodyAfterSubject).replace(/\n/g, '<br>')}</div>`;

  const { da, article } = extractTaglineHints(metaBlock);

  return {
    num: cue.num,
    label: cue.label,
    to,
    subject,
    text: bodyAfterSubject,
    html,
    da,
    article,
  };
}

// Split by `## ` headers
const blocks = md.split(/(?=^## )/m).filter(b => b.trim().startsWith('## '));
const mails = blocks.map((b, i) => parseMail(b, i + 1)).filter(Boolean);

console.log(`\n📬 Parsed ${mails.length} mails from ${path.relative(process.cwd(), MD_FILE)}\n`);

// ── State (idempotency) ───────────────────────────────────────────────────
function loadState() {
  if (!fs.existsSync(STATE_FILE)) return {};
  try { return JSON.parse(fs.readFileSync(STATE_FILE, 'utf8')); } catch { return {}; }
}
function saveState(s) { fs.writeFileSync(STATE_FILE, JSON.stringify(s, null, 2)); }
let sent = loadState();

// ── Resend send ───────────────────────────────────────────────────────────
async function sendOne(mail) {
  const payload = {
    from: FROM,
    to: [mail.to],
    reply_to: REPLY_TO,
    subject: mail.subject,
    text: mail.text,
    html: mail.html,
    headers: { 'X-Statedoku-Outreach-ID': `outreach-${mail.num}` },
  };
  const r = await fetch('https://api.resend.com/emails', {
    method: 'POST',
    headers: {
      'authorization': `Bearer ${process.env.RESEND_API_KEY}`,
      'content-type': 'application/json',
    },
    body: JSON.stringify(payload),
  });
  const body = await r.text();
  if (!r.ok) throw new Error(`HTTP ${r.status}: ${body}`);
  let json; try { json = JSON.parse(body); } catch { json = { raw: body }; }
  return json;
}

// ── Run ───────────────────────────────────────────────────────────────────
(async () => {
  let toProcess = mails;
  if (sendTargets && sendTargets !== 'all') {
    toProcess = mails.filter(m => sendTargets.includes(m.num));
  }

  if (isDryRun || !sendTargets) {
    console.log('🧪 DRY RUN — nothing will be sent.\n');
  } else {
    console.log(`✉️  SENDING ${toProcess.length} mail(s) via Resend (DKIM signed by statedoku.com)…\n`);
  }

  for (const mail of toProcess) {
    if (mail.error) {
      console.log(`#${String(mail.num).padStart(2,' ')}  ❌ ${mail.label}  →  ${mail.error}`);
      continue;
    }
    const sentKey = `${mail.num}:${mail.to}`;
    const alreadySent = sent[sentKey];

    console.log(`#${String(mail.num).padStart(2,' ')}  ${mail.label}`);
    console.log(`     To:      ${mail.to}`);
    console.log(`     Subject: ${mail.subject}`);
    console.log(`     Body:    ${mail.text.split('\n').slice(0, 2).join(' ').slice(0, 100)}…`);
    if (mail.da) console.log(`     DA:      ${mail.da}`);

    if (isDryRun || !sendTargets) {
      console.log(`     [dry-run]\n`);
      continue;
    }

    if (alreadySent) {
      console.log(`     ⏭  Already sent at ${alreadySent.sent_at}  (resend_id: ${alreadySent.id || 'n/a'})\n`);
      continue;
    }

    try {
      const res = await sendOne(mail);
      sent[sentKey] = {
        sent_at: new Date().toISOString(),
        id: res.id || null,
        subject: mail.subject,
      };
      saveState(sent);
      console.log(`     ✅ Sent — resend_id: ${res.id}\n`);
      // Small delay to be polite
      await new Promise(r => setTimeout(r, 1500));
    } catch (e) {
      console.log(`     ❌ FAILED: ${e.message}\n`);
    }
  }

  console.log(`\n✓ Done. State saved to ${path.relative(process.cwd(), STATE_FILE)}`);
  if (isDryRun || !sendTargets) {
    console.log(`\nNext step: run with --send 1,2,3 (or --send all) to actually send.`);
    console.log(`Example:   RESEND_API_KEY=re_xxx node marketing/send-outreach.js --send 1`);
  }
})();
