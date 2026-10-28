#!/usr/bin/env node
// Lists the visible fields, buttons and any captcha of one or more web forms,
// and saves a full-page screenshot of each (in-<tag>.png). Submits nothing.
// Usage: node inspect-forms.cjs "tag|https://example.com/submit" ...
// Needs Playwright (npm i playwright; npx playwright install chromium), or set
// PW_EXECUTABLE to an installed Chromium.
const { chromium } = require(process.env.PW_MODULE || 'playwright');
const CAPTCHA = 'iframe[src*="recaptcha"], iframe[src*="hcaptcha"], iframe[src*="challenges.cloudflare"], .g-recaptcha, .h-captcha, .cf-turnstile, [data-sitekey]';
(async () => {
  const br = await chromium.launch(process.env.PW_EXECUTABLE ? { executablePath: process.env.PW_EXECUTABLE } : {});
  for (const [tag, url] of process.argv.slice(2).map(a => a.split('|'))) {
    const pg = await (await br.newContext({ viewport: { width: 1280, height: 1000 } })).newPage();
    try {
      const res = await pg.goto(url, { waitUntil: 'domcontentloaded', timeout: 45000 });
      await pg.waitForTimeout(4000);
      const info = await pg.evaluate(sel => {
        const lab = el => {
          const forId = el.id && document.querySelector(`label[for="${CSS.escape(el.id)}"]`);
          return ((forId && forId.textContent) || el.getAttribute('aria-label') || el.placeholder || el.name ||
            (el.closest('label') && el.closest('label').textContent) || '').trim().replace(/\s+/g, ' ').slice(0, 80);
        };
        const fields = [...document.querySelectorAll('input, textarea, select')]
          .filter(e => e.type !== 'hidden' && e.offsetParent !== null)
          .map(e => `${e.tagName.toLowerCase()}[${e.type || ''}] name=${e.name || ''} id=${e.id || ''} :: ${lab(e)}${e.required ? ' *' : ''}` +
            (e.tagName === 'SELECT' ? ' {' + [...e.options].map(o => o.value + ':' + o.text).slice(0, 20).join(' / ') + '}' : ''));
        const buttons = [...document.querySelectorAll('button, input[type=submit]')].filter(b => b.offsetParent)
          .map(b => (b.textContent || b.value).trim().slice(0, 30)).filter(Boolean).slice(0, 10);
        return { title: document.title, fields, buttons, captcha: !!document.querySelector(sel) };
      }, CAPTCHA);
      console.log(`\n=== ${tag} ${res && res.status()} ${info.title}\ncaptcha: ${info.captcha}\nbuttons: ${info.buttons.join(' | ')}\n${info.fields.join('\n')}`);
      await pg.screenshot({ path: `in-${tag}.png`, fullPage: true });
    } catch (e) { console.log(`\n=== ${tag} ERROR ${e.message.slice(0, 200)}`); }
  }
  await br.close();
})();
