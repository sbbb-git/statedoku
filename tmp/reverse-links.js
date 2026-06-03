#!/usr/bin/env node
/**
 * Add reverse contextual links: from EXISTING authoritative pages
 * → TO the NEW pages we just created.
 *
 * Why this matters more than forward links:
 * /es/learn/state-abbreviations/ captured 13% of launch-day traffic.
 * It already has authority (organic ranks, internal links pointing TO it).
 * Adding a link FROM it → new page passes part of that authority.
 *
 * Strategy: targeted phrase replacements. Each insertion is small and
 * natural (single sentence, contextual, not link-stuffing).
 */
const fs = require('fs');
const path = require('path');

const ROOT = path.resolve(__dirname, '..');

const edits = [
  // ─── ES authority pages → ES new pages ──────────────────────────────
  ['es/learn/state-abbreviations/index.html', [
    [
      'Lista completa de las 50 abreviaturas postales',
      'Lista completa de las 50 abreviaturas postales (organizadas por <a href="/es/learn/regiones-de-eeuu/">región</a>)'
    ],
  ]],
  ['es/learn/capitales-de-estados/index.html', [
    [
      'capital de DC',
      'capital federal en DC — DC tiene también 3 votos en el <a href="/es/learn/colegio-electoral/">Colegio Electoral</a>'
    ],
  ]],
  ['es/learn/13-colonies/index.html', [
    [
      'Statedoku',
      'Para una versión en español de este tema, mira las <a href="/es/learn/colonias-originales/">13 colonias originales en español</a>. Statedoku'
    ],
  ]],
  ['es/learn/states-and-capitals/index.html', [
    [
      'capital',
      '<a href="/es/learn/capitales-de-estados/">capital</a>' // first occurrence only
    ],
  ]],
  ['es/learn/landlocked-states/index.html', [
    [
      'Statedoku',
      'Para ver cómo se distribuyen geográficamente, consulta <a href="/es/learn/regiones-de-eeuu/">las 4 regiones de EE.UU.</a> Statedoku'
    ],
  ]],
  ['es/learn/largest-states/index.html', [
    [
      'Statedoku',
      'Estos grandes estados forman parte de <a href="/es/learn/regiones-de-eeuu/">distintas regiones</a> y tienen distintas <a href="/es/learn/zonas-horarias-eeuu/">zonas horarias</a>. Statedoku'
    ],
  ]],
  ['es/learn/no-income-tax/index.html', [
    [
      'Statedoku',
      'Muchos de estos estados también forman parte del <a href="/es/learn/cinturones-eeuu/">Sun Belt</a> en crecimiento demográfico. Statedoku'
    ],
  ]],
  ['es/learn/states-bordering-mexico/index.html', [
    [
      'Statedoku',
      'Estos estados pertenecen al <a href="/es/learn/regiones-de-eeuu/">Oeste americano</a> y comparten distintos <a href="/es/learn/apodos-de-estados/">apodos estatales</a>. Statedoku'
    ],
  ]],
  ['es/learn/states-bordering-canada/index.html', [
    [
      'Statedoku',
      'Algunos de estos estados son <a href="/es/learn/estados-bisagra/">estados bisagra clave</a> en elecciones (Michigan, Pensilvania). Statedoku'
    ],
  ]],
  ['es/learn/crucigrama-estados/index.html', [
    [
      'Statedoku',
      'Para vocabulario crucigramístico relacionado con EE.UU., revisa también los <a href="/es/learn/apodos-de-estados/">apodos de los estados</a> y las <a href="/es/learn/banderas-de-estados/">banderas</a>. Statedoku'
    ],
  ]],

  // ─── FR authority pages → FR new pages ──────────────────────────────
  ['fr/learn/state-abbreviations/index.html', [
    [
      'Statedoku',
      'Pour la liste complète des <a href="/fr/learn/capitales-des-etats/">capitales d\'États</a> et les <a href="/fr/learn/surnoms-des-etats/">surnoms des États</a>, voir les guides associés. Statedoku'
    ],
  ]],
  ['fr/learn/13-colonies/index.html', [
    [
      'Statedoku',
      'Ces 13 États sont aujourd\'hui répartis dans la région <a href="/fr/learn/regions-des-etats-unis/">Nord-Est et Sud Atlantique</a>. Statedoku'
    ],
  ]],
  ['fr/learn/landlocked-states/index.html', [
    [
      'Statedoku',
      'Ces États sans accès maritime se trouvent principalement dans le <a href="/fr/learn/regions-des-etats-unis/">Midwest et l\'Ouest</a>. Statedoku'
    ],
  ]],
  ['fr/learn/largest-states/index.html', [
    [
      'Statedoku',
      'Les plus grands États traversent souvent plusieurs <a href="/fr/learn/fuseaux-horaires-etats-unis/">fuseaux horaires</a> et ont des <a href="/fr/learn/surnoms-des-etats/">surnoms évocateurs</a> (Alaska : "Last Frontier"). Statedoku'
    ],
  ]],
  ['fr/learn/no-income-tax/index.html', [
    [
      'Statedoku',
      'Beaucoup de ces États font partie du <a href="/fr/learn/regions-des-etats-unis/">Sun Belt</a> et attirent les retraités. Statedoku'
    ],
  ]],
  ['fr/learn/states-bordering-mexico/index.html', [
    [
      'Statedoku',
      'Ces 4 États appartiennent à la <a href="/fr/learn/regions-des-etats-unis/">région Ouest</a> et incluent l\'Arizona ("<a href="/fr/learn/surnoms-des-etats/">Grand Canyon State</a>"). Statedoku'
    ],
  ]],
  ['fr/learn/states-bordering-canada/index.html', [
    [
      'Statedoku',
      'Plusieurs de ces États sont des <a href="/fr/learn/college-electoral/">swing states</a> majeurs (Michigan, Pennsylvanie) ou des <a href="/fr/learn/capitales-des-etats/">capitales remarquables</a>. Statedoku'
    ],
  ]],
  ['fr/learn/states-and-capitals/index.html', [
    [
      'Statedoku',
      'Pour la liste détaillée et le pourquoi historique, voir <a href="/fr/learn/capitales-des-etats/">les 50 capitales d\'États en détail</a>. Statedoku'
    ],
  ]],

  // ─── EN authority pages → reference the new ES/FR equivalents (hreflang reinforcement)
  // Skipped here — EN pages already use <link rel="alternate"> for cross-lang signal.
];

let totalEdits = 0;
const skipped = [];

for (const [relPath, replacements] of edits) {
  const fullPath = path.join(ROOT, relPath);
  if (!fs.existsSync(fullPath)) {
    console.log(`⚠️  Missing: ${relPath}`);
    skipped.push(`${relPath}: file missing`);
    continue;
  }
  let content = fs.readFileSync(fullPath, 'utf8');
  let pageEdits = 0;
  for (const [search, replace] of replacements) {
    if (!content.includes(search)) {
      skipped.push(`${relPath}: phrase "${search.slice(0, 60)}..." not found`);
      continue;
    }
    // Only replace first occurrence (the natural place — usually opening paragraph)
    content = content.replace(search, replace);
    pageEdits++;
    totalEdits++;
  }
  if (pageEdits > 0) {
    fs.writeFileSync(fullPath, content);
    console.log(`✅ ${relPath} (+${pageEdits} reverse links)`);
  } else {
    console.log(`⏭️  ${relPath} (no matches)`);
  }
}

console.log(`\n${totalEdits} reverse contextual links added.`);
if (skipped.length) {
  console.log(`\n${skipped.length} skipped:`);
  for (const s of skipped) console.log('  ', s);
}
