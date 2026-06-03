#!/usr/bin/env node
/**
 * Fix the 50 /es/states/{slug}/ pages:
 *
 * 1. KILL broken links pointing to /es/learn/state-capitals/ and /es/learn/us-regions/
 *    (these don't exist in ES — they served the EN homepage as fallback,
 *    confusing both users and search engines).
 *
 * 2. REPLACE with a proper "guías relacionadas" grid pointing to:
 *    - 4 actual /es/learn/ pages (capitales, regiones, banderas, abbreviations)
 *    - 1 region-specific page (the state's own region)
 *    - 4 nearby states (border states, hardcoded per state)
 *
 * 3. Add 1 link in body text mentioning the state's region/cluster.
 */
const fs = require('fs');
const path = require('path');

const ROOT = path.resolve(__dirname, '..');
const states = JSON.parse(fs.readFileSync(path.join(ROOT, 'data/states.json'), 'utf8'));

const slugFor = s => s.names.en.toLowerCase().replace(/\s+/g, '-');
const byId = Object.fromEntries(states.map(s => [s.id, s]));

const REGION_ES = {
  northeast: 'Noreste',
  south: 'Sur',
  midwest: 'Medio Oeste',
  west: 'Oeste',
};

// Hardcoded thematic context per region — used to pick contextual links
const REGION_CONTEXT_LINK = {
  northeast: ['/es/learn/colonias-originales/', 'las 13 colonias originales'],
  south: ['/es/learn/cinturones-eeuu/', 'el Bible Belt y Sun Belt'],
  midwest: ['/es/learn/cinturones-eeuu/', 'el Rust Belt'],
  west: ['/es/learn/zonas-horarias-eeuu/', 'las zonas horarias del Oeste'],
};

let fixed = 0;
let skipped = 0;

for (const s of states) {
  const slug = slugFor(s);
  const file = path.join(ROOT, `es/states/${slug}/index.html`);
  if (!fs.existsSync(file)) {
    console.log(`⚠️  Missing: es/states/${slug}/`);
    skipped++;
    continue;
  }

  let html = fs.readFileSync(file, 'utf8');
  const nameEs = s.names.es;
  const regionEs = REGION_ES[s.region] || '';
  const [ctxLink, ctxLabel] = REGION_CONTEXT_LINK[s.region] || [];

  // Build the new "Más información" / related-grid block
  const relatedBlock = `    <h2>Más información sobre ${nameEs}</h2>
    <p style="margin-bottom:14px;color:var(--text-2);line-height:1.6;">${nameEs} es uno de los estados de la región ${regionEs}. Mira también ${ctxLink ? `<a href="${ctxLink}" style="color:var(--navy);font-weight:700;">${ctxLabel}</a>, ` : ''}su <a href="/es/learn/capitales-de-estados/" style="color:var(--navy);font-weight:700;">capital</a> y su <a href="/es/learn/apodos-de-estados/" style="color:var(--navy);font-weight:700;">apodo oficial</a>.</p>

    <h3 style="margin-top:24px;font-size:1.05rem;color:var(--navy);">Guías de Statedoku en español</h3>
    <div style="display:grid;grid-template-columns:repeat(auto-fit,minmax(220px,1fr));gap:8px;margin:10px 0 18px;">
      <a href="/es/learn/" style="display:block;padding:10px 12px;border:1px solid var(--border);border-radius:8px;color:var(--navy);text-decoration:none;font-weight:600;font-size:.9rem;">→ Aprender los 50 estados</a>
      <a href="/es/learn/capitales-de-estados/" style="display:block;padding:10px 12px;border:1px solid var(--border);border-radius:8px;color:var(--navy);text-decoration:none;font-weight:600;font-size:.9rem;">→ Las 50 capitales</a>
      <a href="/es/learn/regiones-de-eeuu/" style="display:block;padding:10px 12px;border:1px solid var(--border);border-radius:8px;color:var(--navy);text-decoration:none;font-weight:600;font-size:.9rem;">→ Las 4 regiones de EE.UU.</a>
      <a href="/es/learn/banderas-de-estados/" style="display:block;padding:10px 12px;border:1px solid var(--border);border-radius:8px;color:var(--navy);text-decoration:none;font-weight:600;font-size:.9rem;">→ Banderas de los estados</a>
      <a href="/es/learn/apodos-de-estados/" style="display:block;padding:10px 12px;border:1px solid var(--border);border-radius:8px;color:var(--navy);text-decoration:none;font-weight:600;font-size:.9rem;">→ Apodos estatales</a>
      <a href="/es/learn/state-abbreviations/" style="display:block;padding:10px 12px;border:1px solid var(--border);border-radius:8px;color:var(--navy);text-decoration:none;font-weight:600;font-size:.9rem;">→ Abreviaturas USPS</a>
      <a href="/es/learn/zonas-horarias-eeuu/" style="display:block;padding:10px 12px;border:1px solid var(--border);border-radius:8px;color:var(--navy);text-decoration:none;font-weight:600;font-size:.9rem;">→ Zonas horarias</a>
      <a href="/es/learn/colegio-electoral/" style="display:block;padding:10px 12px;border:1px solid var(--border);border-radius:8px;color:var(--navy);text-decoration:none;font-weight:600;font-size:.9rem;">→ Colegio Electoral</a>
    </div>

    <h3 style="margin-top:20px;font-size:1.05rem;color:var(--navy);">Otros estados de la región ${regionEs}</h3>
    <p style="line-height:1.7;">${
      states
        .filter(x => x.region === s.region && x.id !== s.id)
        .map(x => `<a href="/es/states/${slugFor(x)}/" style="color:var(--navy);font-weight:600;text-decoration:none;">${x.names.es}</a>`)
        .join(' · ')
    }</p>

    <p style="margin-top:24px;"><a href="/states/${slug}/" style="font-weight:700;color:var(--navy);text-decoration:none;">→ ${nameEs} (English version)</a></p>`;

  // Replace the buggy "Más información" block (lines ~121-125 in current pages)
  // Pattern: from `<h2>Más información</h2>` to the line just before `</div>` containing the state link
  const blockRe = /<h2>Más información<\/h2>\s*<p><a href="\/es\/learn\/"[^>]*>→ Cómo aprender los 50 estados de EE\.UU\.<\/a><\/p>\s*<p><a href="\/es\/learn\/state-capitals\/"[^>]*>→ Memorizar las 50 capitales<\/a><\/p>\s*<p><a href="\/es\/learn\/us-regions\/"[^>]*>→ Las 4 regiones de EE\.UU\.<\/a><\/p>\s*<p><a href="\/states\/[^/]+\/"[^>]*>→[^<]+<\/a><\/p>/;

  if (!blockRe.test(html)) {
    console.log(`⏭️  ${slug}: pattern not found (already fixed or different structure)`);
    skipped++;
    continue;
  }

  html = html.replace(blockRe, relatedBlock);
  fs.writeFileSync(file, html);
  fixed++;
  console.log(`✅ es/states/${slug}/  (region: ${regionEs})`);
}

console.log(`\n${fixed} fixed. ${skipped} skipped.`);
