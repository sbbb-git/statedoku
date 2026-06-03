#!/usr/bin/env node
/**
 * Add contextual in-body links across the 12 new ES + FR learn pages.
 * Boosts internal link density: each new page now points to 3-5 others
 * via the body text (not just the related-grid at the bottom).
 *
 * Strategy: targeted string replacements. Each replacement converts a
 * specific phrase (occurring exactly once on the target page) into an
 * <a href> pointing to the most-relevant sibling page.
 */
const fs = require('fs');
const path = require('path');

const ROOT = path.resolve(__dirname, '..');

// [filePath, [[searchString, replacementWithLink], ...]]
// Each search MUST be unique in the file (we use Edit-tool-style exact match).
const edits = [
  // ─── ES: colegio-electoral ──────────────────────────────────────────
  ['es/learn/colegio-electoral/index.html', [
    [
      'En 48 de 50 estados, el candidato que gana el voto popular del estado se lleva TODOS sus votos electorales',
      'En 48 de 50 estados, el candidato que gana el voto popular del estado se lleva TODOS sus votos electorales. Las excepciones afectan especialmente a los <a href="/es/learn/estados-bisagra/"><strong>estados bisagra</strong></a>'
    ],
    [
      'La 23ª Enmienda (1961) le dio 3 votos electorales a DC, aunque no es un estado.',
      'La 23ª Enmienda (1961) le dio 3 votos electorales a DC, aunque no es un estado. Para entender la diferencia legal entre estado y distrito, mira los <a href="/es/learn/territorios-eeuu/">territorios de EE.UU.</a>'
    ],
    [
      '<p>El número de votos electorales de cada estado = número de representantes en la Cámara + 2 senadores.',
      '<p>El número de votos electorales de cada estado = número de representantes en la Cámara + 2 senadores. Esto deriva del compromiso de las <a href="/es/learn/colonias-originales/">13 colonias originales</a> al redactar la Constitución.'
    ],
  ]],

  // ─── ES: estados-bisagra ────────────────────────────────────────────
  ['es/learn/estados-bisagra/index.html', [
    [
      'Estos 7 deciden quién gana.',
      'Estos 7 deciden quién gana. El sistema de <a href="/es/learn/colegio-electoral/">Colegio Electoral</a> (538 votos, 270 para ganar) es lo que hace que estos estados pesen más que los otros 43.'
    ],
    [
      '<h3>Michigan, Wisconsin (Rust Belt)</h3>',
      '<h3>Michigan, Wisconsin (<a href="/es/learn/cinturones-eeuu/">Rust Belt</a>)</h3>'
    ],
    [
      'Estados industriales donde el voto trabajador blanco basculó hacia Trump.',
      'Estados del declive industrial del Medio Oeste (parte del <a href="/es/learn/regiones-de-eeuu/">Medio Oeste estadounidense</a>) donde el voto trabajador blanco basculó hacia Trump.'
    ],
  ]],

  // ─── ES: territorios-eeuu ───────────────────────────────────────────
  ['es/learn/territorios-eeuu/index.html', [
    [
      'No pueden votar por presidente desde Puerto Rico (sí desde un estado).',
      'No pueden votar por presidente desde Puerto Rico (sí desde un estado) — el <a href="/es/learn/colegio-electoral/">Colegio Electoral</a> solo cuenta los votos de los 50 estados y DC.'
    ],
    [
      'Adquirido en 1898 después de la Guerra Hispano-Estadounidense.',
      'Adquirido en 1898 después de la Guerra Hispano-Estadounidense (mucho después de las <a href="/es/learn/colonias-originales/">13 colonias originales</a>).'
    ],
    [
      'La última vez que se añadió una estrella fue en 1959 (Hawái).',
      'La última vez que se añadió una estrella fue en 1959 (Hawái). Para ver cómo se ha rediseñado la <a href="/es/learn/banderas-de-estados/">bandera estadounidense</a> a lo largo de la historia, mira la página de banderas de los estados.'
    ],
  ]],

  // ─── ES: zonas-horarias-eeuu ────────────────────────────────────────
  ['es/learn/zonas-horarias-eeuu/index.html', [
    [
      'Estados Unidos cubre <strong>6 zonas horarias principales</strong>.',
      'Estados Unidos cubre <strong>6 zonas horarias principales</strong> repartidas entre las <a href="/es/learn/regiones-de-eeuu/">4 regiones del país</a>.'
    ],
    [
      '<strong>Florida:</strong> mayoría Este, pero el panhandle oeste (Pensacola) en Central.',
      '<strong><a href="/es/states/florida/">Florida</a>:</strong> mayoría Este, pero el panhandle oeste (Pensacola) en Central.'
    ],
    [
      'Decisión tomada en 1968 para evitar las tardes largas con calor extremo.',
      'Decisión tomada en 1968 para evitar las tardes largas con calor extremo. Arizona forma parte del <a href="/es/learn/cinturones-eeuu/">Sun Belt</a> donde los veranos son agresivos.'
    ],
  ]],

  // ─── ES: apodos-de-estados ──────────────────────────────────────────
  ['es/learn/apodos-de-estados/index.html', [
    [
      'Aparecen en matrículas, monedas, banderas y publicidad turística.',
      'Aparecen en matrículas, monedas, <a href="/es/learn/banderas-de-estados/">banderas estatales</a> y publicidad turística.'
    ],
    [
      '<strong>Texas — Lone Star State:</strong> el más reconocible internacionalmente.',
      '<strong>Texas — Lone Star State:</strong> el más reconocible internacionalmente. Texas es también uno de los <a href="/es/learn/colegio-electoral/">estados con más votos electorales</a> (40).'
    ],
    [
      '<strong>Nueva York — Empire State:</strong> da nombre al Empire State Building.',
      '<strong>Nueva York — Empire State:</strong> da nombre al Empire State Building. Nueva York fue una de las <a href="/es/learn/colonias-originales/">13 colonias originales</a>.'
    ],
  ]],

  // ─── ES: cinturones-eeuu ────────────────────────────────────────────
  ['es/learn/cinturones-eeuu/index.html', [
    [
      'Además de las 4 regiones oficiales',
      'Además de las <a href="/es/learn/regiones-de-eeuu/">4 regiones oficiales</a>'
    ],
    [
      'Conservador políticamente.',
      'Conservador políticamente — solapa fuertemente con los <a href="/es/learn/estados-bisagra/">estados pendulares</a> del Sur (Georgia, Carolina del Norte).'
    ],
    [
      'la región del Medio Oeste y Atlántico Medio que floreció con la industria pesada',
      'la región del Medio Oeste y Atlántico Medio (parte del <a href="/es/learn/regiones-de-eeuu/">Midwest oficial</a>) que floreció con la industria pesada'
    ],
  ]],

  // ─── FR: capitales-des-etats ────────────────────────────────────────
  ['fr/learn/capitales-des-etats/index.html', [
    [
      'La surprise : dans <strong>33 cas sur 50</strong>, la capitale n\'est PAS la plus grande ville de l\'État.',
      'La surprise : dans <strong>33 cas sur 50</strong>, la capitale n\'est PAS la plus grande ville de l\'État — ce qui rend l\'apprentissage de la <a href="/fr/learn/regions-des-etats-unis/">géographie américaine</a> contre-intuitif.'
    ],
    [
      'Washington, D.C. n\'est PAS un État. C\'est un district fédéral. Capitale fédérale.',
      'Washington, D.C. n\'est PAS un État. C\'est un district fédéral. Capitale fédérale. DC dispose tout de même de 3 grands électeurs au <a href="/fr/learn/college-electoral/">Collège Électoral</a>.'
    ],
    [
      'Burlington est la plus grande ville sans McDonald\'s connue mondialement',
      'Montpelier (Vermont) — environ 7,500 habitants — est par ailleurs réputée comme l\'une des rares capitales d\'État sans McDonald\'s, et elle se trouve dans la sous-région de la <a href="/fr/learn/regions-des-etats-unis/">Nouvelle-Angleterre</a>'
    ], // (this last one might not match — handled gracefully)
  ]],

  // ─── FR: regions-des-etats-unis ─────────────────────────────────────
  ['fr/learn/regions-des-etats-unis/index.html', [
    [
      'C\'est la division la plus utilisée pour les statistiques, la politique et l\'analyse économique.',
      'C\'est la division la plus utilisée pour les statistiques, la politique (voir <a href="/fr/learn/college-electoral/">le Collège Électoral</a>) et l\'analyse économique.'
    ],
    [
      '<strong>Rust Belt</strong> — la "ceinture de la rouille" — Détroit, Pittsburgh, Cleveland, le Midwest industriel en déclin.',
      '<strong>Rust Belt</strong> — la "ceinture de la rouille" — Détroit, Pittsburgh, Cleveland, le Midwest industriel en déclin. Plusieurs <a href="/fr/learn/college-electoral/">swing states</a> (Michigan, Wisconsin, Pennsylvanie) sont dans cette zone.'
    ],
    [
      'Population : ~127M. Région la plus peuplée.',
      'Population : ~127M. Région la plus peuplée — concentre une grande partie du <a href="/fr/learn/surnoms-des-etats/">Bible Belt</a>.'
    ],
  ]],

  // ─── FR: drapeaux-des-etats ─────────────────────────────────────────
  ['fr/learn/drapeaux-des-etats/index.html', [
    [
      'Devenu le drapeau de l\'État lors de son admission en 1845.',
      'Devenu le drapeau de l\'État lors de son admission en 1845. C\'est aussi l\'origine du <a href="/fr/learn/surnoms-des-etats/">surnom "Lone Star State"</a>.'
    ],
    [
      'Reflète la période du Royaume de Hawaï allié au Royaume-Uni (1816-1893).',
      'Reflète la période du Royaume de Hawaï allié au Royaume-Uni (1816-1893) — bien antérieure à son admission comme État (1959, voir la liste des <a href="/fr/learn/capitales-des-etats/">capitales d\'États</a>).'
    ],
    [
      'L\'ancien incluait le drapeau confédéré.',
      'L\'ancien incluait le drapeau confédéré, héritage de l\'époque où le Mississippi faisait partie des États du Sud confédérés (voir <a href="/fr/learn/regions-des-etats-unis/">les 4 régions américaines</a>).'
    ],
  ]],

  // ─── FR: college-electoral ──────────────────────────────────────────
  ['fr/learn/college-electoral/index.html', [
    [
      'Les 2 exceptions :',
      'Les 2 exceptions concernent des États qui ne sont pas des <a href="/fr/learn/regions-des-etats-unis/">swing states classiques</a> mais où chaque grand électeur peut compter :'
    ],
    [
      'Depuis le 23e amendement (1961), DC a 3 grands électeurs, autant que le plus petit État.',
      'Depuis le 23e amendement (1961), DC a 3 grands électeurs, autant que le plus petit État. DC reste néanmoins un district fédéral particulier, comparable aux autres <a href="/fr/learn/capitales-des-etats/">capitales d\'États</a> en tant que ville-capitale.'
    ],
    [
      'Sur les 50 États, seuls <strong>7</strong> sont véritablement compétitifs et déterminent l\'élection',
      'Sur les 50 États, seuls <strong>7</strong> — appartenant à différentes <a href="/fr/learn/regions-des-etats-unis/">régions américaines</a> — sont véritablement compétitifs et déterminent l\'élection'
    ],
  ]],

  // ─── FR: fuseaux-horaires-etats-unis ────────────────────────────────
  ['fr/learn/fuseaux-horaires-etats-unis/index.html', [
    [
      'Les États-Unis couvrent <strong>6 fuseaux horaires principaux</strong>.',
      'Les États-Unis couvrent <strong>6 fuseaux horaires principaux</strong>, répartis entre les <a href="/fr/learn/regions-des-etats-unis/">4 régions du pays</a>.'
    ],
    [
      'Décision prise en 1968 pour éviter les soirées d\'été longues avec une chaleur extrême.',
      'Décision prise en 1968 pour éviter les soirées d\'été longues avec une chaleur extrême. L\'Arizona porte le <a href="/fr/learn/surnoms-des-etats/">surnom de "Grand Canyon State"</a>.'
    ],
    [
      'Plus Samoa Américaines (UTC-11) et Guam/Mariannes (UTC+10).',
      'Plus Samoa Américaines (UTC-11) et Guam/Mariannes (UTC+10), qui ne sont pas comptabilisés au <a href="/fr/learn/college-electoral/">Collège Électoral</a>.'
    ],
  ]],

  // ─── FR: surnoms-des-etats ──────────────────────────────────────────
  ['fr/learn/surnoms-des-etats/index.html', [
    [
      'Ils apparaissent sur les plaques d\'immatriculation, les pièces de monnaie, les drapeaux et la publicité touristique.',
      'Ils apparaissent sur les plaques d\'immatriculation, les pièces de monnaie, les <a href="/fr/learn/drapeaux-des-etats/">drapeaux</a> et la publicité touristique.'
    ],
    [
      '<strong>Texas — Lone Star State :</strong> le plus reconnaissable internationalement.',
      '<strong>Texas — Lone Star State :</strong> le plus reconnaissable internationalement. Le Texas a aussi 40 <a href="/fr/learn/college-electoral/">grands électeurs</a>, le deuxième total.'
    ],
    [
      '<strong>Vermont :</strong>',
      '<strong>Vermont (<a href="/fr/learn/regions-des-etats-unis/">Nouvelle-Angleterre</a>) :</strong>'
    ],
  ]],
];

let totalEdits = 0;
let totalSkipped = 0;
const skipped = [];

for (const [relPath, replacements] of edits) {
  const fullPath = path.join(ROOT, relPath);
  if (!fs.existsSync(fullPath)) {
    console.log(`⚠️  Missing: ${relPath}`);
    continue;
  }
  let content = fs.readFileSync(fullPath, 'utf8');
  let pageEdits = 0;
  for (const [search, replace] of replacements) {
    if (!content.includes(search)) {
      skipped.push(`${relPath}: "${search.slice(0, 60)}..."`);
      totalSkipped++;
      continue;
    }
    // Guard against multiple matches
    const occurrences = content.split(search).length - 1;
    if (occurrences > 1) {
      console.log(`⚠️  Multiple matches in ${relPath} for: ${search.slice(0, 50)}... (skipping)`);
      skipped.push(`${relPath}: multi-match`);
      totalSkipped++;
      continue;
    }
    content = content.replace(search, replace);
    pageEdits++;
    totalEdits++;
  }
  fs.writeFileSync(fullPath, content);
  console.log(`✅ ${relPath} (+${pageEdits} contextual links)`);
}

console.log(`\n${totalEdits} contextual links added. ${totalSkipped} skipped.`);
if (skipped.length) {
  console.log('\nSkipped:');
  for (const s of skipped) console.log('  ', s);
}
