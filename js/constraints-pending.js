// ─────────────────────────────────────────────────────────────────────────
// Statedoku — Pending constraint candidates (for admin review)
//
// 200 new candidate constraints, all derived from existing states.json
// fields. Each has a predicate. Admin reviews and approves/rejects
// them at /admin/constraints/ → only approved ones enter the puzzle pool.
//
// User decisions persist in localStorage:
//   statedoku_approved_pending = JSON array of approved IDs
//   statedoku_rejected_pending = JSON array of rejected IDs
// ─────────────────────────────────────────────────────────────────────────

const PENDING_CONSTRAINTS = (() => {
  const list = [];
  const add = (id, en, fr, es, match) => list.push({ id, en, fr, es, match });

  // ─── Letter starts (all not already in pool: A, I, M, N, W are taken) ───
  const startsLetters = [
    ['B', 'B', 'B'], ['C', 'C', 'C'], ['D', 'D', 'D'], ['F', 'F', 'F'],
    ['G', 'G', 'G'], ['H', 'H', 'H'], ['K', 'K', 'K'], ['L', 'L', 'L'],
    ['O', 'O', 'O'], ['P', 'P', 'P'], ['R', 'R', 'R'], ['S', 'S', 'S'],
    ['T', 'T', 'T'], ['U', 'U', 'U'], ['V', 'V', 'V'],
  ];
  for (const [letter] of startsLetters) {
    add(`p_starts_${letter.toLowerCase()}`,
      `Name starts with ${letter}`,
      `Nom commence par ${letter}`,
      `Empieza con ${letter}`,
      s => s.startsWith === letter);
  }

  // ─── Letter contains (less common letters) ───
  const containsLetters = ['B', 'C', 'D', 'F', 'G', 'H', 'J', 'P', 'X', 'Z'];
  for (const L of containsLetters) {
    add(`p_contains_${L.toLowerCase()}`,
      `Name contains letter ${L}`,
      `Nom contient la lettre ${L}`,
      `Nombre contiene la letra ${L}`,
      s => s.names.en.toUpperCase().includes(L));
  }

  // ─── Letter ends (excluding A, O, E, N, S already in pool) ───
  const endsLetters = ['D', 'H', 'I', 'L', 'R', 'T', 'Y', 'K'];
  for (const L of endsLetters) {
    add(`p_ends_${L.toLowerCase()}`,
      `Name ends in ${L}`,
      `Nom finit par ${L}`,
      `Termina con ${L}`,
      s => s.endsWith === L);
  }

  // ─── Letter count brackets not covered ───
  for (const n of [4, 5, 10, 11, 12, 13]) {
    add(`p_letters_${n}`,
      `Name has exactly ${n} letters`,
      `Nom de ${n} lettres exactement`,
      `Nombre de ${n} letras`,
      s => s.letterCount === n);
  }
  add('p_letters_lte5', 'Short name (≤5 letters)', 'Nom court (≤5 lettres)', 'Nombre corto (≤5)', s => s.letterCount <= 5);
  add('p_letters_gte11', 'Long name (≥11 letters)', 'Nom long (≥11 lettres)', 'Nombre largo (≥11)', s => s.letterCount >= 11);

  // ─── Area rank brackets ───
  add('p_area_top5',    'Top 5 largest by area',  '5 plus grands en superficie', 'Top 5 más grandes', s => s.areaRank <= 5);
  add('p_area_top10',   'Top 10 largest',         '10 plus grands',              'Top 10 más grandes', s => s.areaRank <= 10);
  add('p_area_bottom5', 'Top 5 smallest',         '5 plus petits',               'Top 5 más pequeños', s => s.areaRank >= 46);
  add('p_area_bottom10','Top 10 smallest',        '10 plus petits',              'Top 10 más pequeños', s => s.areaRank >= 41);
  add('p_area_middle',  'Middle area rank (15–35)','Superficie moyenne (15–35)', 'Superficie media (15–35)', s => s.areaRank >= 15 && s.areaRank <= 35);

  // ─── Statehood era ───
  add('p_admit_pre1800', 'Admitted before 1800',  'Admis avant 1800',  'Admitido antes de 1800', s => s.admitted < 1800);
  add('p_admit_1800_1849', 'Admitted 1800–1849',  'Admis 1800–1849',   'Admitido 1800–1849',     s => s.admitted >= 1800 && s.admitted < 1850);
  add('p_admit_1850_1899', 'Admitted 1850–1899',  'Admis 1850–1899',   'Admitido 1850–1899',     s => s.admitted >= 1850 && s.admitted < 1900);
  add('p_admit_1900_plus', 'Admitted 1900 or later','Admis après 1900','Admitido desde 1900',    s => s.admitted >= 1900);
  add('p_admit_civil_war_era', 'Admitted 1861–1870 (Civil War era)', 'Admis 1861–1870 (Guerre de Sécession)', 'Admitido 1861–1870 (Guerra Civil)', s => s.admitted >= 1861 && s.admitted <= 1870);
  add('p_admit_18th_century', 'Admitted in 18th century', 'Admis au 18e siècle', 'Admitido en siglo 18', s => s.admitted < 1800);
  add('p_admit_19th_century', 'Admitted in 19th century', 'Admis au 19e siècle', 'Admitido en siglo 19', s => s.admitted >= 1800 && s.admitted < 1900);
  add('p_admit_20th_century', 'Admitted in 20th century', 'Admis au 20e siècle', 'Admitido en siglo 20', s => s.admitted >= 1900 && s.admitted < 2000);

  // ─── Election history ───
  const e = (s, y) => s.elections && s.elections[y];
  add('p_elec_2024_dem', 'Voted Democrat in 2024',  'A voté démocrate en 2024',  'Votó demócrata en 2024',  s => e(s,'2024') === 'd');
  add('p_elec_2020_rep', 'Voted Republican in 2020','A voté républicain en 2020','Votó republicano en 2020',s => e(s,'2020') === 'r');
  add('p_elec_2016_rep', 'Voted Republican in 2016','A voté républicain en 2016','Votó republicano en 2016',s => e(s,'2016') === 'r');
  add('p_elec_2016_dem', 'Voted Democrat in 2016',  'A voté démocrate en 2016',  'Votó demócrata en 2016',  s => e(s,'2016') === 'd');
  add('p_elec_2012_dem', 'Voted Democrat in 2012',  'A voté démocrate en 2012',  'Votó demócrata en 2012',  s => e(s,'2012') === 'd');
  add('p_elec_flipped_20_24', 'Flipped Biden→Trump (2020→2024)', 'Bascule Biden→Trump (2020→2024)', 'Cambió Biden→Trump (2020→2024)', s => e(s,'2020') === 'd' && e(s,'2024') === 'r');
  add('p_elec_consistent_red', 'Republican in every election since 2008', 'Républicain à chaque élection depuis 2008', 'Republicano en cada elección desde 2008', s => ['2008','2012','2016','2020','2024'].every(y => e(s,y) === 'r'));
  add('p_elec_consistent_blue','Democrat in every election since 2008',  'Démocrate à chaque élection depuis 2008', 'Demócrata en cada elección desde 2008', s => ['2008','2012','2016','2020','2024'].every(y => e(s,y) === 'd'));
  add('p_elec_2008_obama', 'Voted for Obama in 2008',  'A voté Obama en 2008',     'Votó por Obama en 2008',     s => e(s,'2008') === 'd');

  // ─── Tax & money ───
  add('p_no_income_tax', 'No state income tax',  'Pas d\'impôt sur le revenu', 'Sin impuesto sobre la renta', s => s.noIncomeTax);
  add('p_no_sales_tax',  'No state sales tax',   'Pas de taxe de vente',       'Sin impuesto sobre las ventas', s => s.noSalesTax);
  add('p_zero_tax',      'No income AND no sales tax', 'Aucun des deux impôts', 'Sin ningún impuesto estatal', s => s.noIncomeTax && s.noSalesTax);

  // ─── Geography specifics ───
  add('p_on_missouri', 'On the Missouri River',  'Sur le fleuve Missouri',  'En el río Misuri', s => s.onMissouri);
  add('p_appalachian_only', 'Appalachian range (only)', 'Chaîne des Appalaches uniquement', 'Solo Apalaches', s => Array.isArray(s.mountainRange) && s.mountainRange.includes('appalachians') && !s.mountainRange.includes('rockies'));
  add('p_no_mountains', 'No mountain range',     'Sans chaîne de montagnes', 'Sin cadena montañosa', s => !s.mountainRange || s.mountainRange.length === 0);
  add('p_capital_is_largest', 'Capital is largest city', 'Capitale = plus grande ville', 'Capital = ciudad más grande', s => s.capitalIsLargest);
  add('p_top_ten_city',       'Has a top-10 US city',    'A une ville du top 10 US',     'Tiene ciudad top 10 EE.UU.',   s => s.hasTopTenCity);
  add('p_pres_birthplace',    'Birthplace of a US president', 'Naissance d\'un président US', 'Cuna de presidente de EE.UU.', s => s.presidentBirthplace);

  // ─── Heritage / historical origin ───
  add('p_louisiana_purchase', 'Part of Louisiana Purchase', 'Achat de la Louisiane', 'Compra de Luisiana', s => s.louisianaPurchase);
  add('p_mexican_cession',    'Part of Mexican Cession',    'Cession mexicaine',     'Cesión Mexicana',    s => s.mexicanCession);
  add('p_french_heritage',    'French colonial heritage',   'Héritage colonial français', 'Herencia colonial francesa', s => s.frenchHeritage);
  add('p_spanish_heritage',   'Spanish colonial heritage',  'Héritage colonial espagnol', 'Herencia colonial española', s => s.spanishHeritage);

  // ─── Sports combos ───
  const teamCount = s => (s.nbaTeam?1:0) + (s.nflTeam?1:0) + (s.mlbTeam?1:0) + (s.nhlTeam?1:0);
  add('p_pro_teams_3plus','3+ major pro teams (NBA/NFL/MLB/NHL)', '3+ équipes pro majeures', '3+ equipos pro mayores', s => teamCount(s) >= 3);
  add('p_pro_teams_4',    'All 4 major pro leagues',              '4 ligues majeures',       'Las 4 ligas mayores',    s => teamCount(s) === 4);
  add('p_has_nfl',        'Has an NFL team',         'A une équipe NFL',          'Tiene equipo NFL',       s => s.nflTeam);
  add('p_has_mlb',        'Has an MLB team',         'A une équipe MLB',          'Tiene equipo MLB',       s => s.mlbTeam);
  add('p_has_nhl',        'Has an NHL team',         'A une équipe NHL',          'Tiene equipo NHL',       s => s.nhlTeam);
  add('p_nascar',         'Has a NASCAR speedway',   'A un circuit NASCAR',       'Tiene circuito NASCAR',  s => s.nascarSpeedway);

  // ─── Coastal combos ───
  const coast = (s, c) => Array.isArray(s.coastline) && s.coastline.includes(c);
  add('p_coastal_any',   'Any coastline at all',  'Au moins une côte',  'Cualquier costa', s => Array.isArray(s.coastline) && s.coastline.length > 0);
  add('p_atlantic_and_gulf','Atlantic AND Gulf coast', 'Côte Atlantique ET Golfe', 'Costa Atlántica Y Golfo', s => coast(s,'atlantic') && coast(s,'gulf'));
  add('p_two_coasts',    '2+ coastlines',         '2+ côtes',           '2+ costas', s => Array.isArray(s.coastline) && s.coastline.length >= 2);
  add('p_pacific_states','Pacific time zone',     'Fuseau Pacifique',   'Zona horaria Pacífico', s => s.timezone === 'pacific');

  // ─── Subregion combos ───
  add('p_sub_southwest', 'Southwest subregion',  'Sous-région Sud-Ouest', 'Subregión Suroeste', s => s.subregion === 'southwest');
  add('p_sub_pacific',   'Pacific subregion',    'Sous-région Pacifique', 'Subregión Pacífico', s => s.subregion === 'pacific');
  add('p_west_landlocked','Western + landlocked','Ouest + enclavé',        'Oeste + sin costa', s => s.region === 'west' && s.landlocked);
  add('p_south_coastal',  'Southern + coastal',  'Sud + côtier',           'Sur + costero',     s => s.region === 'south' && Array.isArray(s.coastline) && s.coastline.length > 0);
  add('p_northeast_atlantic','Northeast + Atlantic','Nord-Est + Atlantique','Noreste + Atlántico', s => s.region === 'northeast' && coast(s,'atlantic'));
  add('p_midwest_great_lakes','Midwest + Great Lakes','Midwest + Grands Lacs','Medio Oeste + Grandes Lagos', s => s.region === 'midwest' && coast(s,'great_lakes'));

  // ─── Border combos ───
  add('p_borders_canada_or_mexico', 'Borders Canada OR Mexico', 'Frontière Canada OU Mexique', 'Frontera con Canadá O México', s => s.bordersCanada || s.bordersMexico);
  add('p_borders_both_intl', 'Borders both Canada and Mexico', 'Frontière Canada ET Mexique', 'Frontera Canadá Y México', s => s.bordersCanada && s.bordersMexico);
  add('p_borders_neither_intl', 'Borders no foreign country', 'Aucune frontière étrangère', 'Sin frontera internacional', s => !s.bordersCanada && !s.bordersMexico);

  // ─── Population combos ───
  add('p_pop_gt5m', 'Population > 5M', 'Population > 5M', 'Población > 5M', s => s.population === '5M-10M' || s.population === '>10M');
  add('p_pop_lt5m', 'Population < 5M', 'Population < 5M', 'Población < 5M', s => s.population === '<1M' || s.population === '1M-5M');

  // ─── Belts ───
  add('p_belt_3plus', 'In 3+ regional belts', 'Dans 3+ ceintures régionales', 'En 3+ cinturones', s => {
    let n = 0;
    ['sunBelt','snowBelt','cornBelt','wheatBelt','cottonBelt','bibleBelt','rustBelt'].forEach(k => { if (s[k]) n++; });
    return n >= 3;
  });
  add('p_belt_none', 'In no regional belt', 'Dans aucune ceinture régionale', 'En ningún cinturón', s => {
    return !['sunBelt','snowBelt','cornBelt','wheatBelt','cottonBelt','bibleBelt','rustBelt'].some(k => s[k]);
  });

  // ─── Confederate combos ───
  add('p_orig13_and_atlantic', 'Original 13 + Atlantic coast', '13 colonies + Atlantique', '13 colonias + Atlántico', s => s.original13 && coast(s,'atlantic'));
  add('p_confederate_and_gulf', 'Confederate + Gulf coast', 'Confédéré + Golfe', 'Confederado + Golfo', s => s.confederate && coast(s,'gulf'));
  add('p_confederate_only_inland', 'Confederate + landlocked', 'Confédéré + enclavé', 'Confederado + sin costa', s => s.confederate && s.landlocked);

  // ─── Geographic + political combos ───
  add('p_red_landlocked', 'Republican + landlocked', 'Républicain + enclavé', 'Republicano + sin costa', s => s.political === 'red' && s.landlocked);
  add('p_blue_coastal', 'Democrat + coastal', 'Démocrate + côtier', 'Demócrata + costero', s => s.political === 'blue' && Array.isArray(s.coastline) && s.coastline.length > 0);
  add('p_swing_great_lakes', 'Swing + Great Lakes', 'Swing + Grands Lacs', 'Indeciso + Grandes Lagos', s => s.political === 'swing' && coast(s,'great_lakes'));

  // ─── Mountain + political ───
  add('p_rockies_red', 'In Rockies + Republican', 'Rocheuses + républicain', 'Rocosas + republicano', s => Array.isArray(s.mountainRange) && s.mountainRange.includes('rockies') && s.political === 'red');

  // ─── Name + vowel patterns ───
  const countVowels = name => (name.match(/[AEIOU]/gi) || []).length;
  const countConsonants = name => (name.match(/[BCDFGHJKLMNPQRSTVWXYZ]/gi) || []).length;
  add('p_name_3vowels', 'Name has 3 vowels',  'Nom à 3 voyelles', 'Nombre con 3 vocales', s => countVowels(s.names.en.replace(/\s/g,'')) === 3);
  add('p_name_4vowels', 'Name has 4 vowels',  'Nom à 4 voyelles', 'Nombre con 4 vocales', s => countVowels(s.names.en.replace(/\s/g,'')) === 4);
  add('p_name_5vowels', 'Name has 5+ vowels', 'Nom à 5+ voyelles','Nombre con 5+ vocales',s => countVowels(s.names.en.replace(/\s/g,'')) >= 5);
  add('p_name_more_vowels_than_consonants', 'More vowels than consonants', 'Plus de voyelles que de consonnes', 'Más vocales que consonantes', s => {
    const n = s.names.en.replace(/\s/g,'');
    return countVowels(n) > countConsonants(n);
  });
  add('p_name_starts_consonant_ends_vowel', 'Starts consonant, ends vowel', 'Commence consonne, finit voyelle', 'Empieza consonante, termina vocal', s => !'AEIOU'.includes(s.startsWith) && s.endsInVowel);
  add('p_name_starts_vowel_ends_consonant', 'Starts vowel, ends consonant', 'Commence voyelle, finit consonne', 'Empieza vocal, termina consonante', s => 'AEIOU'.includes(s.startsWith) && !s.endsInVowel);

  // ─── Specific letter pairs in name ───
  add('p_contains_th', 'Name contains "TH"', 'Nom contient « TH »', 'Nombre contiene «TH»', s => s.names.en.toUpperCase().includes('TH'));
  add('p_contains_ia', 'Name contains "IA"', 'Nom contient « IA »', 'Nombre contiene «IA»', s => s.names.en.toUpperCase().includes('IA'));
  add('p_contains_an', 'Name contains "AN"', 'Nom contient « AN »', 'Nombre contiene «AN»', s => s.names.en.toUpperCase().includes('AN'));
  add('p_contains_or', 'Name contains "OR"', 'Nom contient « OR »', 'Nombre contiene «OR»', s => s.names.en.toUpperCase().includes('OR'));
  add('p_contains_in', 'Name contains "IN"', 'Nom contient « IN »', 'Nombre contiene «IN»', s => s.names.en.toUpperCase().includes('IN'));
  add('p_contains_ar', 'Name contains "AR"', 'Nom contient « AR »', 'Nombre contiene «AR»', s => s.names.en.toUpperCase().includes('AR'));
  add('p_contains_on', 'Name contains "ON"', 'Nom contient « ON »', 'Nombre contiene «ON»', s => s.names.en.toUpperCase().includes('ON'));
  add('p_contains_aa', 'Name has double A', 'Nom avec AA', 'Nombre con AA', s => /AA/i.test(s.names.en));
  add('p_contains_oo', 'Name has double O', 'Nom avec OO', 'Nombre con OO', s => /OO/i.test(s.names.en));
  add('p_contains_ee', 'Name has double E', 'Nom avec EE', 'Nombre con EE', s => /EE/i.test(s.names.en));

  // ─── Two-word names + first-word patterns ───
  add('p_two_word_starts_s', 'Two words, starts S', 'Deux mots, commence S', 'Dos palabras, empieza S', s => s.wordCount === 2 && s.startsWith === 'S');
  add('p_two_word_starts_w', 'Two words, starts W', 'Deux mots, commence W', 'Dos palabras, empieza W', s => s.wordCount === 2 && s.startsWith === 'W');
  add('p_one_word_long',     'Single word, ≥9 letters', 'Un mot, ≥9 lettres', 'Una palabra, ≥9 letras', s => s.wordCount === 1 && s.letterCount >= 9);

  // ─── Specific multi-attribute combos ───
  add('p_warm_winter', 'Sun Belt + Republican', 'Sun Belt + républicain', 'Sun Belt + republicano', s => s.sunBelt && s.political === 'red');
  add('p_cold_winter', 'Snow Belt + landlocked', 'Snow Belt + enclavé', 'Snow Belt + sin costa', s => s.snowBelt && s.landlocked);
  add('p_breadbasket', 'Corn Belt + Wheat Belt', 'Corn Belt + Wheat Belt', 'Cinturón maíz + trigo', s => s.cornBelt && s.wheatBelt);
  add('p_bible_belt_confederate', 'Bible Belt + Confederate', 'Bible Belt + Confédéré', 'Bible Belt + Confederado', s => s.bibleBelt && s.confederate);
  add('p_rust_belt_blue', 'Rust Belt + Democrat-leaning', 'Rust Belt + démocrate', 'Rust Belt + demócrata', s => s.rustBelt && s.political === 'blue');

  // ─── Timezone combos ───
  add('p_eastern_atlantic', 'Eastern TZ + Atlantic coast', 'Fuseau Est + Atlantique', 'Hora Este + Atlántico', s => s.timezone === 'eastern' && coast(s,'atlantic'));
  add('p_central_no_coast', 'Central TZ + landlocked',     'Fuseau Central + enclavé','Hora Central + sin costa', s => s.timezone === 'central' && s.landlocked);
  add('p_mountain_tz_landlocked', 'Mountain TZ + landlocked','Fuseau Mountain + enclavé','Hora Montaña + sin costa', s => s.timezone === 'mountain' && s.landlocked);

  // ─── Capital city facts ───
  add('p_capital_starts_a', 'Capital starts with A', 'Capitale commence par A', 'Capital empieza con A', s => s.capital?.[0] === 'A');
  add('p_capital_starts_c', 'Capital starts with C', 'Capitale commence par C', 'Capital empieza con C', s => s.capital?.[0] === 'C');
  add('p_capital_starts_d', 'Capital starts with D', 'Capitale commence par D', 'Capital empieza con D', s => s.capital?.[0] === 'D');
  add('p_capital_starts_l', 'Capital starts with L', 'Capitale commence par L', 'Capital empieza con L', s => s.capital?.[0] === 'L');
  add('p_capital_starts_m', 'Capital starts with M', 'Capitale commence par M', 'Capital empieza con M', s => s.capital?.[0] === 'M');
  add('p_capital_starts_b', 'Capital starts with B', 'Capitale commence par B', 'Capital empieza con B', s => s.capital?.[0] === 'B');
  add('p_capital_starts_h', 'Capital starts with H', 'Capitale commence par H', 'Capital empieza con H', s => s.capital?.[0] === 'H');
  add('p_capital_starts_r', 'Capital starts with R', 'Capitale commence par R', 'Capital empieza con R', s => s.capital?.[0] === 'R');
  add('p_capital_two_word', 'Capital is two words', 'Capitale en deux mots', 'Capital de dos palabras', s => s.capital && s.capital.split(' ').length >= 2);

  // ─── Geography / nature combos ───
  add('p_river_state', 'On Mississippi OR Missouri', 'Sur Mississippi OU Missouri', 'En Misisipi O Misuri', s => s.onMississippi || s.onMissouri);
  add('p_two_rivers',  'On Mississippi AND Missouri','Mississippi ET Missouri',     'Misisipi Y Misuri',     s => s.onMississippi && s.onMissouri);
  add('p_natural_hazard_any', 'Has a major natural hazard', 'A un risque naturel majeur', 'Riesgo natural mayor', s => s.tornadoAlley || s.hurricaneZone || s.earthquakeZone || s.hasVolcano);

  // ─── Light original-13 combos ───
  add('p_orig13_no_civil_war_battle', 'Original 13 + no Civil War battle', '13 colonies sans bataille', '13 colonias sin batalla', s => s.original13 && !s.civilWarMajorBattle);
  add('p_orig13_north', 'Original 13 + Northeast', '13 colonies + Nord-Est', '13 colonias + Noreste', s => s.original13 && s.region === 'northeast');
  add('p_orig13_south', 'Original 13 + South', '13 colonies + Sud', '13 colonias + Sur', s => s.original13 && s.region === 'south');

  // ─── Combos: borders + size ───
  add('p_top10_landlocked', 'Top 10 area + landlocked', 'Top 10 superficie + enclavé', 'Top 10 área + sin costa', s => s.areaRank <= 10 && s.landlocked);
  add('p_bottom10_coastal', 'Smallest 10 + coastal',     'Plus petits + côtiers',       'Más pequeños + costeros', s => s.areaRank >= 41 && Array.isArray(s.coastline) && s.coastline.length > 0);

  // ─── Pop + region ───
  add('p_high_pop_south', 'Population >10M + South', 'Population >10M + Sud', 'Pob. >10M + Sur', s => s.population === '>10M' && s.region === 'south');
  add('p_low_pop_west',   'Population <1M + West',   'Population <1M + Ouest','Pob. <1M + Oeste', s => s.population === '<1M' && s.region === 'west');

  // ─── Subregion + statehood ───
  add('p_plains_19c', 'Plains + admitted 19th century', 'Plaines + admis 19e siècle', 'Llanuras + admitido siglo 19', s => s.subregion === 'plains' && s.admitted >= 1800 && s.admitted < 1900);
  add('p_mountain_20c', 'Mountain + admitted 20th century', 'Mountain + admis 20e siècle', 'Montaña + admitido siglo 20', s => s.subregion === 'mountain' && s.admitted >= 1900);

  // ─── Capital city combos ───
  add('p_capital_short', 'Capital ≤6 letters', 'Capitale ≤6 lettres', 'Capital ≤6 letras', s => s.capital && s.capital.replace(/\s/g,'').length <= 6);
  add('p_capital_long',  'Capital ≥10 letters','Capitale ≥10 lettres','Capital ≥10 letras', s => s.capital && s.capital.replace(/\s/g,'').length >= 10);

  // ─── Name origin combos ───
  add('p_origin_indigenous_or_spanish', 'Native or Spanish name origin', 'Origine amérindienne ou espagnole', 'Origen nativo o español', s => s.nameNative || s.nameSpanish);
  add('p_origin_european',              'European name origin (Spanish or royal)', 'Origine européenne', 'Origen europeo', s => s.nameSpanish || s.nameRoyalty);
  add('p_origin_native_west',           'Native name + West',          'Origine native + Ouest', 'Origen nativo + Oeste', s => s.nameNative && s.region === 'west');
  add('p_origin_spanish_west',          'Spanish name + West',         'Origine espagnole + Ouest','Origen español + Oeste',s => s.nameSpanish && s.region === 'west');

  // ─── Random unique signal combos ───
  add('p_ends_consonant', 'Name ends in a consonant', 'Nom finit par une consonne', 'Termina en consonante', s => !s.endsInVowel);
  add('p_starts_and_ends_consonant', 'Starts AND ends consonant', 'Commence ET finit par consonne', 'Empieza y termina consonante', s => !'AEIOU'.includes(s.startsWith) && !s.endsInVowel);
  add('p_starts_vowel_ends_vowel',    'Starts AND ends vowel',     'Commence ET finit voyelle',     'Empieza y termina vocal',     s => 'AEIOU'.includes(s.startsWith) && s.endsInVowel);

  // ─── Region + sport combos ───
  add('p_midwest_no_pro', 'Midwest + no pro team', 'Midwest + sans équipe pro', 'Medio Oeste + sin pro', s => s.region === 'midwest' && !s.nbaTeam && !s.nflTeam && !s.mlbTeam && !s.nhlTeam);

  // ─── First letter clusters ───
  add('p_starts_consonant_pair', 'Starts with a hard letter (B/C/D/F/G/H/J/K/P/Q/R/T/V/W/X/Z)', 'Commence par consonne dure', 'Empieza con consonante dura', s => 'BCDFGHJKPQRTVWXZ'.includes(s.startsWith));
  add('p_starts_soft_letter',    'Starts with soft (L/M/N/S)',    'Commence par L/M/N/S',          'Empieza con L/M/N/S',          s => 'LMNS'.includes(s.startsWith));

  // ─── Specific quirky combos ───
  add('p_no_pro_no_coast', 'No pro team + landlocked', 'Sans équipe pro + enclavé', 'Sin pro + sin costa', s => s.landlocked && !s.nbaTeam && !s.nflTeam && !s.mlbTeam && !s.nhlTeam);
  add('p_coast_no_pro',    'Coastal + no pro team',    'Côtier + sans équipe pro',  'Costero + sin pro',   s => Array.isArray(s.coastline) && s.coastline.length > 0 && !s.nbaTeam && !s.nflTeam && !s.mlbTeam && !s.nhlTeam);

  // ─── Election margin proxies (using existing fields) ───
  add('p_voted_obama_then_trump', 'Obama 2008/2012 → Trump 2016', 'Obama 2008-2012 puis Trump 2016', 'Obama 2008-2012 luego Trump 2016', s => e(s,'2008') === 'd' && e(s,'2012') === 'd' && e(s,'2016') === 'r');
  add('p_voted_dem_twice_2020s',  'Democrat in 2020 AND 2024',    'Démocrate 2020 ET 2024',          'Demócrata 2020 Y 2024',           s => e(s,'2020') === 'd' && e(s,'2024') === 'd');

  // ─── Era admissions ───
  add('p_admit_1800s_first_quarter', 'Admitted 1800–1825', 'Admis 1800–1825', 'Admitido 1800–1825', s => s.admitted >= 1800 && s.admitted <= 1825);
  add('p_admit_post_civil_war',      'Admitted after 1865','Admis après 1865','Admitido después de 1865', s => s.admitted > 1865);
  add('p_admit_19c_second_half',     'Admitted 1850–1899','Admis 1850–1899','Admitido 1850–1899', s => s.admitted >= 1850 && s.admitted < 1900);

  // ─── Multi-attribute factual combos ───
  add('p_big_red_landlocked', 'Top 20 area + Republican + landlocked', 'Top 20 + républicain + enclavé', 'Top 20 + republicano + sin costa', s => s.areaRank <= 20 && s.political === 'red' && s.landlocked);
  add('p_small_blue_coastal', 'Bottom 20 area + Democrat + coastal', 'Bottom 20 + démocrate + côtier', 'Bottom 20 + demócrata + costero', s => s.areaRank >= 31 && s.political === 'blue' && Array.isArray(s.coastline) && s.coastline.length > 0);

  // ─── Bordering specifics ───
  add('p_borders_3_to_5', 'Borders 3–5 states',  'Frontière 3–5 États', 'Frontera 3–5 estados', s => !s.borders6Plus && !s.bordersFew);

  // ─── EXTRA BATCH (50 more) ───────────────────────────────────────────

  // More letter starts with regional combos
  add('p_starts_n_northeast', 'Starts N + Northeast', 'Commence N + Nord-Est', 'Empieza N + Noreste', s => s.startsWith === 'N' && s.region === 'northeast');
  add('p_starts_m_south',     'Starts M + South',      'Commence M + Sud',     'Empieza M + Sur',      s => s.startsWith === 'M' && s.region === 'south');
  add('p_starts_w_west',      'Starts W + West',       'Commence W + Ouest',   'Empieza W + Oeste',    s => s.startsWith === 'W' && s.region === 'west');
  add('p_starts_w_midwest',   'Starts W + Midwest',    'Commence W + Midwest', 'Empieza W + Medio Oeste', s => s.startsWith === 'W' && s.region === 'midwest');

  // Vowel-heavy combos
  add('p_only_one_vowel',    'Name has only 1 vowel',  'Nom à 1 seule voyelle','Nombre con solo 1 vocal', s => countVowels(s.names.en.replace(/\s/g,'')) === 1);
  add('p_two_vowels',        'Name has 2 vowels',      'Nom à 2 voyelles',     'Nombre con 2 vocales',    s => countVowels(s.names.en.replace(/\s/g,'')) === 2);
  add('p_vowel_pct_high',    'Vowel-heavy name (≥50% vowels)', 'Nom riche en voyelles (≥50%)', 'Nombre con muchas vocales (≥50%)', s => {
    const n = s.names.en.replace(/\s/g,'');
    return countVowels(n) / n.length >= 0.5;
  });

  // More etymology
  add('p_named_after_person', 'Name from royalty (king/queen)', 'Nom royal (roi/reine)', 'Nombre de realeza', s => s.nameRoyalty);
  add('p_north_or_south', 'Has North or South in name', 'Avec North/South dans le nom', 'Con Norte/Sur en el nombre', s => /\bnorth\b|\bsouth\b/i.test(s.names.en));
  add('p_has_new_in_name', 'Has "New" in name', 'Avec « New »', 'Con «New»', s => /\bnew\b/i.test(s.names.en));
  add('p_has_west_in_name', 'Has "West" in name', 'Avec « West »', 'Con «West»', s => /west/i.test(s.names.en));

  // Population + size
  add('p_dense_state',  'Small area + high population (≥5M)',  'Petit + pop ≥5M',     'Pequeño + pob ≥5M',    s => s.areaRank >= 30 && (s.population === '5M-10M' || s.population === '>10M'));
  add('p_sparse_state', 'Large area + low population (<5M)',   'Grand + pop <5M',     'Grande + pob <5M',     s => s.areaRank <= 15 && (s.population === '<1M' || s.population === '1M-5M'));

  // Mountain + admit
  add('p_mountain_late_admit', 'Mountain + admitted 1900+', 'Montagne + admis 1900+', 'Montaña + admitido 1900+', s => Array.isArray(s.mountainRange) && s.mountainRange.length > 0 && s.admitted >= 1900);

  // Border combos
  add('p_borders6_red',  'Borders 6+ + Republican',  'Frontière 6+ + républicain',  'Frontera 6+ + republicano', s => s.borders6Plus && s.political === 'red');
  add('p_borders6_blue', 'Borders 6+ + Democrat',    'Frontière 6+ + démocrate',    'Frontera 6+ + demócrata',   s => s.borders6Plus && s.political === 'blue');
  add('p_borders_few_coastal', 'Borders few + coastal', 'Peu de frontières + côtier','Pocas fronteras + costero', s => s.bordersFew && Array.isArray(s.coastline) && s.coastline.length > 0);

  // Specific belt + region
  add('p_sun_belt_west',    'Sun Belt + West',    'Sun Belt + Ouest',  'Sun Belt + Oeste',    s => s.sunBelt && s.region === 'west');
  add('p_sun_belt_south',   'Sun Belt + South',   'Sun Belt + Sud',    'Sun Belt + Sur',      s => s.sunBelt && s.region === 'south');
  add('p_corn_belt_swing',  'Corn Belt + swing',  'Corn Belt + swing', 'Corn Belt + indeciso',s => s.cornBelt && s.political === 'swing');

  // Election triple combos
  add('p_blue_2008_2012_2024', 'Voted Dem in 2008, 2012, AND 2024', 'Démocrate 2008, 2012 et 2024', 'Demócrata 2008, 2012 y 2024', s => e(s,'2008')==='d' && e(s,'2012')==='d' && e(s,'2024')==='d');
  add('p_red_streak_3plus',     'Republican in last 3+ elections',   'Républicain depuis 3+ scrutins',   'Republicano en últimas 3+ elecciones', s => ['2016','2020','2024'].every(y => e(s,y)==='r'));

  // Coast specifics
  add('p_only_atlantic', 'Atlantic coast only',  'Atlantique uniquement', 'Solo Atlántico', s => Array.isArray(s.coastline) && s.coastline.length === 1 && s.coastline[0] === 'atlantic');
  add('p_only_gulf',     'Gulf coast only',      'Golfe uniquement',      'Solo Golfo',     s => Array.isArray(s.coastline) && s.coastline.length === 1 && s.coastline[0] === 'gulf');
  add('p_great_lakes_only','Great Lakes only',   'Grands Lacs uniquement','Solo Grandes Lagos', s => Array.isArray(s.coastline) && s.coastline.length === 1 && s.coastline[0] === 'great_lakes');

  // Capital city extras
  add('p_capital_3_letters', 'Capital with ≤4 letters', 'Capitale ≤4 lettres', 'Capital ≤4 letras', s => s.capital && s.capital.replace(/\s/g,'').length <= 4);
  add('p_capital_starts_vowel', 'Capital starts with vowel', 'Capitale commence par voyelle', 'Capital empieza con vocal', s => s.capital && 'AEIOU'.includes(s.capital[0]?.toUpperCase()));

  // Pure name properties
  add('p_palindromic_letters', 'Same start and end letter', 'Même lettre début/fin', 'Misma letra inicio/fin', s => s.startsWith === s.endsWith);
  add('p_three_consonants_start', 'Starts with 3 consonants in a row', 'Commence par 3 consonnes', 'Empieza con 3 consonantes', s => {
    const n = s.names.en.toUpperCase();
    return /^[BCDFGHJKLMNPQRSTVWXYZ]{3}/.test(n);
  });

  // Statehood centennial
  add('p_admit_in_1800s_exact', 'Admitted in a specific 1800s decade (1810s)', 'Admis dans les années 1810', 'Admitido en los 1810s', s => s.admitted >= 1810 && s.admitted < 1820);
  add('p_admit_1850s', 'Admitted in the 1850s', 'Admis dans les années 1850', 'Admitido en los 1850s', s => s.admitted >= 1850 && s.admitted < 1860);
  add('p_admit_1860s', 'Admitted in the 1860s', 'Admis dans les années 1860', 'Admitido en los 1860s', s => s.admitted >= 1860 && s.admitted < 1870);
  add('p_admit_1880s', 'Admitted in the 1880s', 'Admis dans les années 1880', 'Admitido en los 1880s', s => s.admitted >= 1880 && s.admitted < 1890);
  add('p_admit_1890s', 'Admitted in the 1890s', 'Admis dans les années 1890', 'Admitido en los 1890s', s => s.admitted >= 1890 && s.admitted < 1900);

  // Geographic + statehood
  add('p_original13_atlantic_seaboard', 'Original 13 + on Atlantic', '13 colonies sur Atlantique', '13 colonias en Atlántico', s => s.original13 && coast(s,'atlantic'));
  add('p_late_admit_western', 'Admitted 1900+ + West region', 'Admis 1900+ + Ouest', 'Admitido 1900+ + Oeste', s => s.admitted >= 1900 && s.region === 'west');

  // Specific economy / industry (factual data points)
  add('p_oil_producer', 'Oil-producing state', 'État producteur de pétrole', 'Estado productor de petróleo', s => s.oilProducer);
  add('p_agricultural', 'Agricultural state', 'État agricole', 'Estado agrícola', s => s.agricultural);

  // Geographic feature combos
  add('p_landlocked_red_sunbelt', 'Landlocked + Republican + Sun Belt', 'Enclavé + républicain + Sun Belt', 'Sin costa + rep. + Sun Belt', s => s.landlocked && s.political === 'red' && s.sunBelt);
  add('p_coastal_blue_no_landlock','Coastal + Democrat',  'Côtier + démocrate', 'Costero + demócrata', s => Array.isArray(s.coastline) && s.coastline.length > 0 && s.political === 'blue');

  // Name pattern + region
  add('p_two_word_southern', 'Two-word name + South region', 'Deux mots + Sud',  'Dos palabras + Sur',     s => s.wordCount === 2 && s.region === 'south');
  add('p_two_word_western',  'Two-word name + West region',  'Deux mots + Ouest','Dos palabras + Oeste',   s => s.wordCount === 2 && s.region === 'west');

  // Multi-timezone variants
  add('p_eastern_landlocked', 'Eastern TZ + landlocked', 'Est + enclavé', 'Este + sin costa', s => s.timezone === 'eastern' && s.landlocked);

  return list;
})();

// Expose globally (used by puzzle.js and admin/constraints/)
if (typeof window !== 'undefined') {
  window.PENDING_CONSTRAINTS = PENDING_CONSTRAINTS;
  window.PENDING_MAP = Object.fromEntries(PENDING_CONSTRAINTS.map(c => [c.id, c]));
}
