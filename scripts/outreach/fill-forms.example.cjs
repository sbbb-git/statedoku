#!/usr/bin/env node
// Template: fill submission forms, screenshot them, and submit only with
// --submit. Copy it, edit PROJECT and the run(...) blocks, one per site.
//   node fill-forms.cjs                    dry run: fills, saves filled-<tag>.png
//   node fill-forms.cjs --submit --only=a,b  submits the named sites
// Rules: never fill a honeypot field, never tick a newsletter box, never solve
// or bypass a captcha (the script stops when one is on the page), never pay,
// never use a personal name or phone number. Read sent-<tag>.png to confirm.
const { chromium } = require(process.env.PW_MODULE || 'playwright');
const PROJECT = {
  url: 'https://example.com/',
  name: 'Example',
  email: 'contact@example.com',
  desc: 'One honest paragraph of about 70 words saying what the project is, who it is for, and that it is free.',
};
const SUBMIT = process.argv.includes('--submit');
const only = (process.argv.find(a => a.startsWith('--only=')) || '').slice(7).split(',').filter(Boolean);
const CAPTCHA = 'iframe[src*="recaptcha"], iframe[src*="hcaptcha"], iframe[src*="challenges.cloudflare"], .g-recaptcha, .h-captcha, .cf-turnstile, [data-sitekey]';

async function dismissCookies(pg) {
  for (const t of ['Reject all', 'Reject', 'Continue without accepting', 'Continuer sans accepter', 'Tout refuser', 'Rechazar', 'Rechazar todo', 'Continuar sin aceptar']) {
    const b = pg.getByRole('button', { name: t, exact: true });
    if (await b.count()) { await b.first().click().catch(() => {}); await pg.waitForTimeout(800); return; }
  }
}

async function run(br, tag, url, fill, submitSelector) {
  if (only.length && !only.includes(tag)) return;
  const pg = await (await br.newContext({ viewport: { width: 1280, height: 1100 } })).newPage();
  try {
    await pg.goto(url, { waitUntil: 'domcontentloaded', timeout: 45000 });
    await pg.waitForTimeout(3500);
    await dismissCookies(pg);
    await fill(pg);
    await pg.waitForTimeout(1000);
    await pg.screenshot({ path: `filled-${tag}.png`, fullPage: true });
    if (await pg.evaluate(s => !!document.querySelector(s), CAPTCHA)) { console.log(tag, 'CAPTCHA present: not submitted, leave it to a human'); return; }
    if (!SUBMIT) { console.log(tag, 'filled (dry run), check filled-' + tag + '.png'); return; }
    await pg.locator(submitSelector).first().click();
    await pg.waitForTimeout(6000);
    await pg.screenshot({ path: `sent-${tag}.png`, fullPage: true });
    console.log(tag, 'clicked submit, now at', pg.url(), '- read sent-' + tag + '.png to confirm');
  } catch (e) {
    console.log(tag, 'ERROR', e.message.slice(0, 300));
    await pg.screenshot({ path: `err-${tag}.png`, fullPage: true }).catch(() => {});
  }
}

(async () => {
  const br = await chromium.launch(process.env.PW_EXECUTABLE ? { executablePath: process.env.PW_EXECUTABLE } : {});

  // One block per site. Target fields by name, id, placeholder or label as
  // printed by inspect-forms.cjs.
  await run(br, 'example-directory', 'https://directory.example/submit', async pg => {
    await pg.fill('input[name=url]', PROJECT.url);
    await pg.fill('input[name=name]', PROJECT.name);
    await pg.fill('textarea[name=description]', PROJECT.desc);
    await pg.getByLabel("I'm the maker").check().catch(() => {});
    await pg.fill('input[type=email]', PROJECT.email);
    // optional selects can be disabled until a section is opened: do not block on them
    await pg.selectOption('select[name=category]', { label: 'Geography' }, { timeout: 2500 }).catch(() => {});
  }, 'button[type=submit]');

  await br.close();
})();
