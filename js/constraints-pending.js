// ─────────────────────────────────────────────────────────────────────────
// Statedoku — Pending constraint candidates (admin review)
//
// All candidates have ≥5 matching states. Labels are written to feel human
// in EN/FR/ES (no robotic phrasing). Tasteful emojis used sparingly.
// ─────────────────────────────────────────────────────────────────────────

const PENDING_CONSTRAINTS = (() => {
  const list = [];
  const inS = (str) => {
    const set = new Set(str.split(/\s+/).filter(Boolean));
    return (s) => set.has(s.id);
  };
  const add = (id, en, fr, es, statesStr) => {
    list.push({ id, en, fr, es, match: inS(statesStr), _states: statesStr });
  };

  // ═════════════════════════════════════════════════════════════════════
  // 🍔 FAST FOOD / RESTAURANT CHAINS
  // ═════════════════════════════════════════════════════════════════════
  add('pc_sonic_drive_in',      '🍔 Has Sonic Drive-In',                 'Sonic Drive-In y est',          'Tiene Sonic Drive-In',
      'AL AR AZ CA CO FL GA IL IN KS KY LA MD MI MO MS NC NE NM NV OH OK PA SC TN TX UT VA');
  add('pc_whataburger',          '🍔 Has Whataburger',                    'Whataburger y est',             'Tiene Whataburger',
      'TX AZ AL AR FL GA LA MS NM OK SC TN KS CO');
  add('pc_wawa',                 '☕ Has Wawa',                            'Wawa y est',                    'Tiene Wawa',
      'NJ PA DE MD VA FL NC');
  add('pc_sheetz',               '⛽ Has Sheetz',                          'Sheetz y est',                  'Tiene Sheetz',
      'PA WV VA MD NC OH');
  add('pc_publix',               '🛒 Has Publix grocery',                 'Supermarchés Publix',           'Supermercados Publix',
      'FL GA AL SC NC TN VA KY');
  add('pc_meijer',               '🛒 Has Meijer grocery',                 'Supermarchés Meijer',           'Supermercados Meijer',
      'MI OH IN IL KY WI');
  add('pc_trader_joes',          'Has a Trader Joe\'s nearby',            'Trader Joe\'s y est',           'Hay un Trader Joe\'s',
      'CA NY NJ MA IL PA CO TX FL WA OR VA MD CT MI NV AZ MN OH NC GA WI TN');
  add('pc_ikea',                 '🛏️ Has an IKEA',                         'Il y a un IKEA',                'Hay un IKEA',
      'AZ CA CO CT FL GA IL MA MD MI MN MO NC NJ NY OH OR PA TX UT VA WA');
  add('pc_dunkin_heartland',     '☕ Dunkin\' country (East Coast)',       'Royaume de Dunkin\'',           'Reino de Dunkin\'',
      'MA RI CT NH ME NJ NY PA VT FL IL OH');
  add('pc_krispy_kreme',         '🍩 Krispy Kreme country',               'Pays de Krispy Kreme',          'País de Krispy Kreme',
      'NC SC GA AL TN VA FL TX OK AR MS LA KY');
  add('pc_white_castle',         '🍔 Has a White Castle',                 'White Castle y est',            'Tiene White Castle',
      'OH IN IL KY MO MN NY NJ WI MI TN');
  add('pc_steak_n_shake',        '🥩 Has Steak \'n Shake',                'Steak \'n Shake y est',         'Tiene Steak \'n Shake',
      'IN OH IL KY TN GA FL MO AL VA WV NC');
  add('pc_culvers',              '🍦 Has Culver\'s',                       'Culver\'s y est',               'Tiene Culver\'s',
      'WI IL MN IA IN MI OH KY TN MO');
  add('pc_jack_in_the_box',      '🌮 Has Jack in the Box',                'Jack in the Box y est',         'Tiene Jack in the Box',
      'CA TX AZ NV WA OR NM CO OK ID UT LA');
  add('pc_bojangles',            '🍗 Has Bojangles',                       'Bojangles y est',               'Tiene Bojangles',
      'NC SC GA VA TN KY AL FL PA MD');
  add('pc_chickfila_concentrated','🐔 Chick-fil-A Southern stronghold',    'Bastion sudiste Chick-fil-A',   'Bastión sureño Chick-fil-A',
      'GA TX FL NC SC AL TN VA');
  add('pc_in_n_out_present',     '🍔 Has In-N-Out',                        'In-N-Out y est',                'Tiene In-N-Out',
      'CA NV AZ UT TX OR CO ID');
  add('pc_waffle_house',         '🧇 Waffle House country',                'Pays de Waffle House',          'País de Waffle House',
      'GA AL SC TN FL NC LA MS TX AR KY VA OH');
  add('pc_aldi_top_states',      '🛒 Aldi heavy footprint',               'Forte présence Aldi',           'Fuerte presencia Aldi',
      'OH IL IN PA NY NJ MI WI MN KS MD IA CA AZ FL GA');
  add('pc_kroger_states',        '🛒 Kroger states',                       'Kroger y est',                  'Hay Kroger',
      'OH KY MI IN IL TN AL GA AR LA NC SC TX VA WV CA NV AZ CO UT MS MO');
  add('pc_costco_top',           '🛒 Costco-heavy (≥10 warehouses)',      'Forte présence Costco',         'Fuerte presencia Costco',
      'CA WA NY TX FL IL VA NJ MA AZ CO MD NC GA OR MN OH MI PA');
  add('pc_cracker_barrel',       '🪑 Cracker Barrel',                      'Cracker Barrel y est',          'Tiene Cracker Barrel',
      'TN GA AL FL TX KY IN OH PA VA NC SC MO IL MI WI OK AR LA MS WV');
  add('pc_dairy_queen',          '🍦 Dairy Queen heartland (Midwest)',    'Pays de Dairy Queen',           'País de Dairy Queen',
      'MN WI IA IL IN OH MI MO KS NE ND SD OK TX');

  // ═════════════════════════════════════════════════════════════════════
  // 🏈 PRO SPORTS
  // ═════════════════════════════════════════════════════════════════════
  add('pc_nfl_team',             '🏈 Has an NFL team',                    'A une équipe NFL',              'Tiene equipo NFL',
      'AZ CA CO FL GA IL IN LA MA MD MI MN MO NC NJ NV NY OH PA TN TX WA WI');
  add('pc_nba_team',             '🏀 Has an NBA team',                    'A une équipe NBA',              'Tiene equipo NBA',
      'CA CO FL GA IL IN LA MA MI MN MO NC NY OH OK OR PA TN TX UT WA WI AZ');
  add('pc_mlb_team',             '⚾ Has an MLB team',                    'A une équipe MLB',              'Tiene equipo MLB',
      'AZ CA CO FL GA IL MA MD MI MN MO NY OH PA TX WA WI');
  add('pc_nhl_team',             '🏒 Has an NHL team',                    'A une équipe NHL',              'Tiene equipo NHL',
      'AZ CA CO FL IL MA MI MN MO NJ NV NY NC OH PA TN TX WA');
  add('pc_4_pro_leagues',        '🏆 The big four (NBA + NFL + MLB + NHL)','Les 4 ligues majeures',        'Las 4 ligas mayores',
      'CA MA TX FL IL CO PA OH NY MI MN');
  add('pc_3plus_pro_leagues',    '🏆 3+ major pro leagues',               '3+ ligues majeures',            '3+ ligas mayores',
      'CA MA TX FL IL CO PA OH NY MI MN GA AZ');
  add('pc_super_bowl_host',      '🏟️ Has hosted a Super Bowl',            'A organisé un Super Bowl',      'Organizó un Super Bowl',
      'CA FL LA TX MN AZ NJ MI GA IN TN NV');
  add('pc_nba_champ_25yr',       '🏀 NBA title in the last 25 years',    'Titre NBA depuis 25 ans',       'Título NBA en últimos 25 años',
      'CA TX FL MA MI WI CO');
  add('pc_super_bowl_winner_25', '🏈 Super Bowl ring in the last 25 yrs','Bague de Super Bowl depuis 25 ans','Anillo de Super Bowl en 25 años',
      'MA CO MD CA TX MO NY LA WI WA FL PA');
  add('pc_world_series_25yr',    '⚾ World Series win since 2000',        'Vainqueur des World Series depuis 2000','Campeón MLB desde 2000',
      'MA AZ FL CA MO NY PA IL TX GA');
  add('pc_stanley_cup_25yr',     '🏒 Stanley Cup since 2000',             'Vainqueur de la Stanley Cup depuis 2000','Stanley Cup desde 2000',
      'NJ CO MI TX MA CA PA IL FL MO NV');
  add('pc_mls_team',             '⚽ Has an MLS team',                    'A une équipe MLS',              'Tiene equipo MLS',
      'CA CO DC FL GA IL KS MA MN MO NC NY OH OR PA TN TX UT WA');
  add('pc_wnba_team',            '🏀 Has a WNBA team',                    'A une équipe WNBA',             'Tiene equipo WNBA',
      'AZ CA CT IL IN MN NY NV OH WA');
  add('pc_pro_team_animal_name', '🦅 Pro team named after an animal',     'Équipe pro au nom d\'animal',   'Equipo pro con nombre de animal',
      'AZ NC GA MD PA WA CO IN IL OH FL MI CA TX MN PA');

  // ═════════════════════════════════════════════════════════════════════
  // 🏀 NCAA
  // ═════════════════════════════════════════════════════════════════════
  add('pc_ncaa_basketball_blueblood','🏀 NCAA basketball blue blood',     'Mastodonte du basket NCAA',     'Gigante del baloncesto NCAA',
      'NC KY KS IN CA');
  add('pc_acc_basketball',       '🏀 Has an ACC basketball school',       'Université de l\'ACC',          'Universidad de la ACC',
      'NC VA MA NY PA FL GA IN SC KY');
  add('pc_big12_school',         '🏈 Has a Big 12 school',                'Université du Big 12',          'Universidad del Big 12',
      'TX OK KS WV IA AZ UT CO FL OH');
  add('pc_pac12_legacy',         '🏈 Was in the original Pac-12',         'Anciennement Pac-12',           'Antes Pac-12',
      'CA OR WA AZ UT CO');
  add('pc_college_football_powerhouse','🏈 College football powerhouse',  'Mastodonte du football NCAA',   'Potencia del fútbol NCAA',
      'AL OK NE OH MI USC GA FL TX');

  // ═════════════════════════════════════════════════════════════════════
  // 🏟️ SPORTS EVENTS
  // ═════════════════════════════════════════════════════════════════════
  add('pc_wrestlemania_host',    '🤼 Has hosted WrestleMania',            'A organisé WrestleMania',       'Organizó WrestleMania',
      'NJ CA NV NY TX FL MI LA AZ MN TN PA NC');
  add('pc_final_four_host',      '🏀 Has hosted an NCAA Final Four',      'A organisé un Final Four',      'Organizó un Final Four',
      'IN TX MN MI MO GA AZ LA NC OH NV CA WA NY');
  add('pc_olympics_host_any',    '🥇 Has hosted the Olympics',            'A organisé les JO',             'Organizó los JJOO',
      'CA NY UT MO GA');

  // ═════════════════════════════════════════════════════════════════════
  // 📺 TV — Multi-state franchises
  // ═════════════════════════════════════════════════════════════════════
  add('pc_real_housewives_franchise','📺 Has a Real Housewives franchise','Une franchise des Real Housewives','Una franquicia de Real Housewives',
      'NY GA NJ CA UT MD FL TX TN');
  add('pc_bravo_show_setting',   '📺 Setting of a Bravo reality show',    'Décor d\'une émission Bravo',   'Escenario de un reality Bravo',
      'NY GA NJ CA UT MD FL TX TN MI');

  // ═════════════════════════════════════════════════════════════════════
  // 🎥 MOVIES
  // ═════════════════════════════════════════════════════════════════════
  add('pc_stephen_king_setting', '👻 Setting of a Stephen King novel',    'Décor d\'un Stephen King',      'Escenario de Stephen King',
      'ME CO MA NH NV FL NY PA');
  add('pc_marvel_mcu_us_setting','🦸 MCU film location in the US',        'Lieu MCU aux US',               'Locación MCU en EE.UU.',
      'CA NY NM VA NV TN');
  add('pc_pixar_film_setting',   '🎬 Setting of a Pixar film',            'Décor d\'un Pixar',             'Escenario Pixar',
      'CA NY MN CO TX MO');
  add('pc_disney_animated_us_set','🏰 US setting of a Disney animated film','Décor US d\'un Disney animé', 'Escenario US de Disney animado',
      'VA LA TN HI AK MO');
  add('pc_coen_brothers_setting','🎬 Setting of a Coen Brothers film',    'Décor des frères Coen',         'Escenario de los Coen',
      'MN TX CA AZ NY AR');
  add('pc_tarantino_setting',    '🎬 Setting of a Tarantino film',        'Décor d\'un Tarantino',         'Escenario de Tarantino',
      'CA TN TX WY NM');
  add('pc_iconic_road_trip',     '🚗 Iconic American road trip route',    'Itinéraire road trip mythique', 'Ruta road trip icónica',
      'CA OR WA NV UT AZ NM TX OK MO IL KY TN NC VA');
  add('pc_western_film_setting', '🤠 Setting of a classic Western',       'Décor de western classique',    'Escenario de western clásico',
      'CA AZ NM TX UT CO MT WY NV OK');
  add('pc_horror_movie_setting', '🔪 Setting of iconic horror movies',    'Décor de films d\'horreur cultes','Escenario de horror icónico',
      'CA TX IL OH IN ME CO NV');

  // ═════════════════════════════════════════════════════════════════════
  // 🎵 MUSIC
  // ═════════════════════════════════════════════════════════════════════
  add('pc_rock_hof_origin_10plus','🎸 Birthed 10+ Rock & Roll HoF inductees','10+ Hall of Fame du rock',  '10+ Hall of Fame del rock',
      'CA NY TX IL TN MI WI OH');
  add('pc_country_music_artist_origin','🎵 Birthed 3+ country HoF artists','3+ stars country légendaires','3+ leyendas country',
      'TN TX KY OK AR LA GA MS AL VA NC');
  add('pc_rap_artist_top',       '🎤 Birthed a top rap artist',           'Naissance d\'un grand rappeur', 'Cuna de un gran rapero',
      'NY CA GA IL TX TN MI LA FL');
  add('pc_indie_rock_scene',     '🎸 Famous indie-rock scene',            'Scène indie-rock connue',       'Escena indie-rock conocida',
      'WA OR CA NY IL TX MA');
  add('pc_top_jazz_scenes',      '🎺 Historic jazz scene',                'Scène jazz historique',         'Escena jazz histórica',
      'LA NY IL MO CA TN');
  add('pc_top_blues_scenes',     '🎷 Historic blues scene',               'Scène blues historique',        'Escena blues histórica',
      'MS TN IL TX LA AR');
  add('pc_warped_tour_stop',     '🎸 Regular Vans Warped Tour stop',      'Étape régulière du Warped Tour','Parada habitual del Warped Tour',
      'CA NV AZ CO TX OK MO IL OH MI NY MA NJ PA FL GA');
  add('pc_outdoor_amphitheater', '🎤 Has an iconic outdoor amphitheater', 'Amphithéâtre extérieur mythique','Anfiteatro icónico al aire libre',
      'CO CA TN NY VA AZ TX MA WA GA NV');
  add('pc_top_jazz_festival',    '🎷 Hosts a major jazz festival',        'Festival de jazz majeur',       'Festival de jazz mayor',
      'LA RI CA NY IL WA');
  add('pc_music_capital_nickname','🎵 Self-styled music capital',         'Capitale musicale auto-proclamée','Capital musical autoproclamada',
      'TN TX LA GA NY CA WA');

  // ═════════════════════════════════════════════════════════════════════
  // 🐔 STATE BIRDS
  // ═════════════════════════════════════════════════════════════════════
  add('pc_state_bird_cardinal',  '🐦 State bird: Northern Cardinal',      'Oiseau d\'État : cardinal rouge','Ave estatal: cardenal',
      'IL IN KY NC OH VA WV');
  add('pc_state_bird_mockingbird','🐦 State bird: Mockingbird',           'Oiseau d\'État : moqueur',      'Ave estatal: cenzontle',
      'AR FL MS TN TX');
  add('pc_state_bird_meadowlark','🐦 State bird: Western Meadowlark',     'Oiseau d\'État : sturnelle',    'Ave estatal: pradero',
      'KS MT NE ND OR WY');

  // ═════════════════════════════════════════════════════════════════════
  // 🥧 FOOD CULTURE
  // ═════════════════════════════════════════════════════════════════════
  add('pc_pizza_named_after_city','🍕 Has a pizza style named after a city','Style de pizza nommé d\'une ville','Estilo de pizza con nombre de ciudad',
      'NY IL CT MI MO OH RI');
  add('pc_bbq_style',            '🍖 Has its own BBQ tradition',          'Sa propre tradition BBQ',       'Su propia tradición BBQ',
      'TX TN NC SC MO KS GA AL KY');
  add('pc_diner_culture',        '🥞 Iconic diner culture',               'Culture diner emblématique',    'Cultura diner icónica',
      'NJ NY MA RI PA CT');
  add('pc_lobster_country',      '🦞 Lobster country',                    'Pays du homard',                'Tierra de la langosta',
      'ME MA NH RI CT NY');
  add('pc_apple_orchard_state',  '🍎 Top apple state',                    'Producteur de pommes majeur',   'Productor de manzanas',
      'WA NY MI PA VA CA OR');
  add('pc_beer_craft_capital',   '🍺 Top craft-beer state',               'Capitale de la craft beer',     'Capital de cerveza artesanal',
      'CO CA OR WA PA MI VT IL TX NY');
  add('pc_chili_culture',        '🌶️ Strong chili cookoff culture',       'Culture du chili / concours',   'Cultura del chili',
      'TX OH NM OK KS IL WV');
  add('pc_donut_capital',        '🍩 Self-styled "donut capital"',        'Auto-proclamé capitale du donut','Autoproclamada capital del donut',
      'MA RI MI WI ND OR');
  add('pc_known_for_cheese',     '🧀 Famous for its cheese',              'Connu pour son fromage',        'Famoso por su queso',
      'WI VT CA NY MN');
  add('pc_known_for_potatoes',   '🥔 Famous for its potatoes',            'Connu pour ses patates',        'Famoso por sus patatas',
      'ID ME WA OR ND');
  add('pc_known_for_maple',      '🍁 Famous for its maple syrup',         'Connu pour son sirop d\'érable','Famoso por su jarabe de arce',
      'VT NY NH ME WI MI');
  add('pc_wine_region_named',    '🍷 Famous American wine region',        'Région viticole célèbre',       'Región vinícola famosa',
      'CA OR WA NY MI VA TX MO');

  // ═════════════════════════════════════════════════════════════════════
  // ⚖️ LIFESTYLE / LAWS (factual, not politics)
  // ═════════════════════════════════════════════════════════════════════
  add('pc_recreational_cannabis','🌿 Recreational cannabis legal',        'Cannabis récréatif légal',      'Cannabis recreativo legal',
      'AK AZ CA CO CT DE IL ME MA MD MI MN MO MT NV NJ NM NY OH OR RI VT VA WA');
  add('pc_medical_cannabis_only','💊 Medical cannabis only',              'Cannabis médical uniquement',   'Solo cannabis medicinal',
      'AL AR FL HI IA KY LA MS NH ND OK PA SD TX UT WV');
  add('pc_sports_betting_legal', '🎰 Sports betting legal',               'Paris sportifs légaux',         'Apuestas deportivas legales',
      'AZ AR CO CT DE IL IN IA KY LA ME MD MA MI MS MO MT NV NH NJ NM NY NC ND OH OR PA RI SD TN VA WA WV WY VT WI');
  add('pc_online_casino',        '🃏 Online casino legal',                'Casino en ligne légal',         'Casino online legal',
      'NJ PA MI WV CT DE RI');
  add('pc_no_state_lottery',     '🎟️ No state lottery',                   'Pas de loterie d\'État',        'Sin lotería estatal',
      'AL AK HI NV UT');
  add('pc_no_state_income_tax',  '💸 No state income tax',                'Pas d\'impôt sur le revenu',    'Sin impuesto sobre la renta',
      'AK FL NV NH SD TN TX WA WY');
  add('pc_no_state_sales_tax',   '🧾 No state sales tax',                 'Pas de taxe sur les ventes',    'Sin impuesto sobre las ventas',
      'AK DE MT NH OR');
  add('pc_death_penalty_abolished','⚖️ Death penalty abolished',          'Peine de mort abolie',          'Pena de muerte abolida',
      'NY NJ NM IL CT MD CO WA OR HI ME MA MI MN ND RI VT WV WI');
  add('pc_commercial_casino',    '🎰 Has commercial casinos',             'Casinos commerciaux',           'Casinos comerciales',
      'NV NJ MS LA CO MI IL IN IA MO PA OH KS MD WV NY OK ME RI DE FL CT WA OR NM');

  // ═════════════════════════════════════════════════════════════════════
  // 🚗 INDUSTRY
  // ═════════════════════════════════════════════════════════════════════
  add('pc_auto_plant',           '🚗 Major auto manufacturing plant',     'Grande usine automobile',       'Planta automotriz importante',
      'MI OH IN KY TN AL SC MS GA TX CA MO KS WI');
  add('pc_big_tech_office',      '💻 Big Tech major office',              'Bureau Big Tech majeur',        'Oficina Big Tech mayor',
      'CA WA TX NY MA OR CO IL VA GA AZ');
  add('pc_oil_country',          '🛢️ Major oil/gas producer',             'Gros producteur pétrole/gaz',   'Gran productor petróleo/gas',
      'TX OK ND NM CO WY LA AK CA WV PA');
  add('pc_aerospace_hub',        '🚀 Aerospace manufacturing hub',        'Pôle aérospatial',              'Centro aeroespacial',
      'WA CA AZ TX FL GA KS AL OH MO');

  // ═════════════════════════════════════════════════════════════════════
  // ✈️ TRAVEL & TOURISM
  // ═════════════════════════════════════════════════════════════════════
  add('pc_top10_airport_passengers','✈️ Top 10 busiest US airport',       'Top 10 aéroports américains',   'Top 10 aeropuertos US',
      'GA TX IL CA CO NY FL');
  add('pc_iconic_beach_dest',    '🏖️ Iconic beach destination',           'Plage emblématique',            'Playa icónica',
      'FL CA HI NJ NC SC MA NY ME RI MD VA AL MS LA TX OR WA');
  add('pc_top_skiing_resort',    '⛷️ Top-tier ski resort',                'Station de ski de premier plan','Estación de esquí top',
      'CO UT VT CA WY MT NH ID WA OR NV');
  add('pc_top_national_park_vis','🏞️ Top-15 most-visited National Park', 'Parc national top 15 visite',  'Parque nacional top 15 visitas',
      'CA AZ TN UT WY CO ME WA VA NC SD');
  add('pc_fall_foliage_top',     '🍂 Top fall foliage destination',       'Top feuillage d\'automne',      'Top follaje otoñal',
      'VT NH ME MA RI CT NY PA WV VA TN NC GA MI WI MN');
  add('pc_theme_park_major',     '🎢 Has a major theme park',             'Parc d\'attractions majeur',    'Parque de atracciones mayor',
      'CA FL OH PA NJ TX VA MO IL IA GA');
  add('pc_six_flags_park',       '🎢 Has a Six Flags',                    'A un Six Flags',                'Tiene Six Flags',
      'CA TX NJ IL MA GA MO MD NY');

  // ═════════════════════════════════════════════════════════════════════
  // 🎬 ENTERTAINMENT INDUSTRY
  // ═════════════════════════════════════════════════════════════════════
  add('pc_film_tax_incentive',   '🎬 Strong film tax incentive',          'Crédit d\'impôt cinéma fort',   'Crédito fiscal cine fuerte',
      'GA LA NM NY CA IL MA NC OK');
  add('pc_top_filming_location', '🎬 Top 10 filming state',               'Top 10 États de tournage',      'Top 10 estados de rodaje',
      'CA NY GA NM LA IL MA WA OK AZ');
  add('pc_5plus_snl_castmembers','🎤 5+ SNL cast members hail from here', 'Naissance de 5+ du cast SNL',   'Cuna de 5+ del SNL',
      'IL NY CA MA MI OH PA TX');

  // ═════════════════════════════════════════════════════════════════════
  // 🦅 TRUE CRIME LORE
  // ═════════════════════════════════════════════════════════════════════
  add('pc_serial_killer_history','🔪 Notorious serial-killer history',    'Histoire de tueurs en série',   'Historia de asesinos en serie',
      'WA FL UT IL KS NY CA WI');
  add('pc_mafia_history',        '🕴️ Mafia history',                      'Histoire mafieuse',             'Historia mafiosa',
      'NY NJ IL NV FL MA RI PA');
  add('pc_famous_cult_history',  '👁️ Famous cult / sect history',         'Histoire de sectes / cultes',   'Historia de cultos',
      'TX CA UT CO OR WA AZ FL');

  // ═════════════════════════════════════════════════════════════════════
  // 🏆 CELEBRITY ORIGINS (grouped)
  // ═════════════════════════════════════════════════════════════════════
  add('pc_birthplace_oscar_winners','🏆 Birthed 5+ Best Actor/Actress Oscar winners','5+ Oscars du meilleur acteur','5+ Oscar Mejor Actor',
      'CA NY TX IL OH MA NJ');
  add('pc_birthplace_grammy_aoty','🏆 Birthed 3+ Grammy Album of the Year winners','3+ Grammys Album de l\'année','3+ Grammy Álbum del Año',
      'CA NY TN GA TX NJ');
  add('pc_3plus_presidents',     '🇺🇸 Birthplace of 3+ US presidents',     'Naissance de 3+ présidents',    'Cuna de 3+ presidentes',
      'VA OH NY MA TX VT NC');
  add('pc_heisman_winner_origin','🏆 Birthed 2+ Heisman Trophy winners',  '2+ Heisman du même État',       '2+ ganadores del Heisman',
      'TX CA FL OH OK AL MI IN PA NE');
  add('pc_nba_hall_of_famer_origin','🏀 Birthed 5+ NBA Hall of Famers',   '5+ HoF NBA',                    '5+ Hall of Fame NBA',
      'NY CA IL PA IN NC MI OH LA TX');
  add('pc_nfl_hall_of_famer_origin','🏈 Birthed 5+ NFL Hall of Famers',   '5+ HoF NFL',                    '5+ Hall of Fame NFL',
      'TX CA PA OH NY IL FL MI NC LA AL');
  add('pc_mlb_hall_of_famer_origin','⚾ Birthed 5+ MLB Hall of Famers',   '5+ HoF MLB',                    '5+ Hall of Fame MLB',
      'CA NY PA TX OH IL AL GA MO');
  add('pc_olympic_gold_5plus',   '🥇 Birthed 5+ Olympic gold medalists',  '5+ médaillés d\'or olympiques', '5+ medallistas oro olímpicos',
      'CA NY TX FL IL OH PA MI');
  add('pc_qb_super_bowl_mvp',    '🏈 Birthed a Super Bowl MVP QB',        'QB MVP du Super Bowl né ici',   'Cuna de QB MVP Super Bowl',
      'TX CA PA AL FL LA');
  add('pc_boxer_world_champ',    '🥊 Birthed a world boxing champion',    'Champion du monde de boxe',     'Campeón mundial de boxeo',
      'NY CA TX PA IL NJ MI FL');
  add('pc_late_night_host_origin','🎙️ Birthplace of a major late-night TV host','État natal d\'un animateur de late-night','Cuna de presentador late-night',
      'IN MA OH NJ NY GA IA');
  add('pc_pop_star_2010s',       '🎤 Birthed a top 2010s+ pop artist',    'Naissance d\'une star pop 2010+','Cuna de estrella pop 2010+',
      'PA TX GA TN NY NJ CA FL');
  add('pc_broadway_origins',     '🎭 Birthed a Broadway musical icon',    'Naissance d\'une icône de Broadway','Cuna de icono de Broadway',
      'NY NJ MA CT CA IL OH');
  add('pc_tech_founder_birth',   '💻 Birthplace of a Big Tech founder',   'Naissance d\'un fondateur tech','Cuna de un fundador Big Tech',
      'WA NM NY MI IL CA OH PA FL');

  // ═════════════════════════════════════════════════════════════════════
  // 🎓 EDUCATION
  // ═════════════════════════════════════════════════════════════════════
  add('pc_ivy_league_home',      '🎓 Has an Ivy League school',           'Université Ivy League',         'Universidad de la Ivy League',
      'MA NY NJ CT PA NH RI');
  add('pc_top_public_uni',       '🎓 Has a top-15 public university',     'Top 15 universités publiques',  'Top 15 universidades públicas',
      'CA MI VA NC GA WI IL TX FL WA OH');
  add('pc_top_business_school',  '🎓 Has a top-10 business school',       'Top 10 écoles de commerce',     'Top 10 escuelas de negocios',
      'PA MA CA IL NY NC IN MI NH');
  add('pc_top_liberal_arts',     '🎓 Has a top-10 liberal arts college',  'Top 10 colleges arts libéraux', 'Top 10 universidad de artes liberales',
      'MA ME VT PA OH IL MN NY CA');
  add('pc_top_art_school',       '🎨 Has a top-10 art / design school',   'Top 10 écoles d\'art / design', 'Top 10 escuelas de arte',
      'NY CA RI IL MA MI');
  add('pc_hbcu_top',             '🎓 Has a top-rated HBCU',               'HBCU de premier plan',          'HBCU principal',
      'DC GA AL FL MD NC SC TN TX VA LA MS');
  add('pc_jesuit_university',    '⛪ Has a major Jesuit university',      'Université jésuite majeure',    'Universidad jesuita mayor',
      'DC MA NY PA OH MI CA LA WI MD');
  add('pc_state_uni_powerhouse', '🎓 Land-grant Power 5 flagship',        'Université d\'État de premier plan','Universidad estatal de élite',
      'AL AR CA CO FL GA IL IN IA KS KY LA MA MD MI MN MS MO NC NE NJ NY OH OK OR PA SC TN TX UT VA WA WI WV');
  add('pc_5plus_rhodes_scholars','🎓 5+ Rhodes Scholars come from here',  '5+ boursiers Rhodes',           '5+ becarios Rhodes',
      'CA NY MA TX VA PA IL');
  add('pc_top10_engineering_uni','🔧 Top-10 engineering university',      'Top 10 fac d\'ingénierie',      'Top 10 ingeniería',
      'MA CA TX IL GA MI');
  add('pc_top10_law_school',     '⚖️ Top-10 law school',                  'Top 10 fac de droit',           'Top 10 derecho',
      'CT MA NY IL CA VA MI PA');
  add('pc_top10_med_school',     '🩺 Top-10 medical school',              'Top 10 fac de médecine',        'Top 10 medicina',
      'MA CA MD PA NY NC MI MN');

  // ═════════════════════════════════════════════════════════════════════
  // 🚀 NASA / SCIENCE
  // ═════════════════════════════════════════════════════════════════════
  add('pc_nasa_facility',        '🚀 Has a major NASA facility',          'Site NASA majeur',              'Sitio NASA mayor',
      'TX FL AL CA OH VA MD MS');
  add('pc_apollo_program_state', '🌙 Played a role in the Apollo program','Rôle dans Apollo',              'Rol en Apollo',
      'TX FL AL OH CA VA');
  add('pc_national_lab',         '🔬 Major US national research lab',     'Laboratoire national',          'Laboratorio nacional',
      'CA NM TN IL ID WA NY TX');
  add('pc_observatory_major',    '🔭 World-class astronomical observatory','Observatoire astronomique',    'Observatorio astronómico',
      'HI CA AZ NM TX WV CO');
  add('pc_dinosaur_fossils',     '🦖 Famous dinosaur fossil sites',       'Sites de fossiles de dinosaures','Sitios de fósiles dinosaurios',
      'MT WY CO UT SD ND TX NM AZ');

  // ═════════════════════════════════════════════════════════════════════
  // 🦅 WILDLIFE
  // ═════════════════════════════════════════════════════════════════════
  add('pc_large_bald_eagle_pop', '🦅 Large bald eagle population',        'Grande population de pygargues','Gran población de águilas calvas',
      'AK MN WA WI FL MI OR');
  add('pc_wild_bear_range',      '🐻 Native bear range',                  'Habitat des ours sauvages',     'Hábitat de osos salvajes',
      'AK MT WY ID WA OR CA CO ME NH VT MI WI MN NY PA TN NC GA WV VA');
  add('pc_alligator_native',     '🐊 Native alligator territory',         'Pays des alligators',           'Territorio de aligátores',
      'FL LA GA AL MS SC NC TX OK AR');
  add('pc_moose_native',         '🫎 Native moose territory',             'Pays de l\'orignal',            'Territorio del alce',
      'AK ME NH VT MN MT WY ID WA WI MI CO ND UT NY');

  // ═════════════════════════════════════════════════════════════════════
  // 🎄 FESTIVALS & HOLIDAY CULTURE
  // ═════════════════════════════════════════════════════════════════════
  add('pc_iconic_state_fair',    '🎡 Iconic state fair (1M+ visitors)',   'Foire d\'État emblématique',    'Feria estatal icónica',
      'TX MN IA OH OK NY MO WI IN GA');
  add('pc_mardi_gras_parades',   '🎭 Major Mardi Gras celebrations',      'Mardi Gras majeur',             'Carnaval Mardi Gras',
      'LA AL MS FL TX');
  add('pc_christmas_market',     '🎄 Major German-style Christmas market','Marché de Noël à l\'allemande', 'Mercado navideño alemán',
      'NY IL OH PA TX MI WI MO MN');
  add('pc_pumpkin_capital',      '🎃 Pumpkin / fall festival capital',    'Capitale citrouilles & automne','Capital calabazas y otoño',
      'IL CA OH PA IN MI NY MO');
  add('pc_haunted_destinations', '👻 Popular "haunted" tourism destination','Destination « hantée »',      'Destino «embrujado»',
      'MA RI LA CA NV CO IL TN PA');
  add('pc_americana_county_fair','🎡 Famous county fair tradition',       'Tradition de foires de comté',  'Tradición de ferias de condado',
      'IA OH IL IN WI MN PA NY MD TX');
  add('pc_iconic_summer_camp',   '🏕️ Iconic American summer camp culture','Culture des colos d\'été',      'Cultura de campamentos de verano',
      'ME NH VT MA NY PA WI MN MI NC');

  // ═════════════════════════════════════════════════════════════════════
  // 📚 LITERATURE
  // ═════════════════════════════════════════════════════════════════════
  add('pc_huckleberry_finn',     '📖 Huck Finn / Twain Mississippi setting','Twain / Huck Finn',          'Twain / Huck Finn',
      'MO IL AR TN MS LA');
  add('pc_grapes_of_wrath',      '📖 Grapes of Wrath route',              'Route des Raisins de la colère','Ruta de Las uvas de la ira',
      'OK TX NM AZ CA');
  add('pc_poe_lived',            '🦅 Where Edgar Allan Poe lived',        'Où vécut Edgar Allan Poe',      'Donde vivió Poe',
      'MA NY MD VA PA SC');
  add('pc_little_house_prairie', '🏡 Little House on the Prairie territory','Petite maison dans la prairie','La Casa de la Pradera',
      'WI KS MN SD MO');
  add('pc_pulitzer_newspaper',   '📰 Pulitzer Prize-winning newspaper',   'Journal Prix Pulitzer',         'Diario con Pulitzer',
      'NY CA IL DC FL MA TX VA WI GA');
  add('pc_presidential_library', '🏛️ Has a Presidential Library',         'Bibliothèque présidentielle',   'Biblioteca presidencial',
      'GA TX CA AR KS MA MI MO NY OK VA IL IA OH IN');

  // ═════════════════════════════════════════════════════════════════════
  // 🏞️ OUTDOORS
  // ═════════════════════════════════════════════════════════════════════
  add('pc_top_hiking_state',     '🥾 Top-tier hiking destination',        'Top destination randonnée',     'Destino top de senderismo',
      'CO CA UT WA OR WY MT NH VT NC TN ME AZ NV NM');
  add('pc_top_camping',          '⛺ Top camping destination',            'Top destination camping',       'Top camping',
      'CO UT WY MT WA OR CA AZ NM NV ID AK MN');
  add('pc_top_fly_fishing',      '🎣 Top fly-fishing destination',        'Top pêche à la mouche',         'Top pesca con mosca',
      'MT WY CO ID OR WA UT AK CA');
  add('pc_top_kayak_canoe',      '🛶 Top kayak / canoe destination',      'Top kayak / canoë',             'Top kayak / canoa',
      'MN WI MI ME NH VT NY FL CA WA OR CO AK');

  // ═════════════════════════════════════════════════════════════════════
  // 🚂 ROAD & RAIL
  // ═════════════════════════════════════════════════════════════════════
  add('pc_route66_state',        '🛣️ On historic Route 66',               'Sur la Route 66 historique',    'En la Ruta 66 histórica',
      'IL MO KS OK TX NM AZ CA');
  add('pc_appalachian_trail',    '🥾 On the Appalachian Trail',           'Sur le sentier des Appalaches', 'En el sendero de los Apalaches',
      'GA NC TN VA WV MD PA NJ NY CT MA VT NH ME');

  // ═════════════════════════════════════════════════════════════════════
  // 🦬 RIVALRIES / SPORTS CULTURE
  // ═════════════════════════════════════════════════════════════════════
  add('pc_iconic_cfb_rivalry',   '🏈 Iconic college football rivalry',    'Rivalité football NCAA iconique','Rivalidad CFB icónica',
      'AL OH MI OK TX FL GA TN');
  add('pc_iconic_nba_franchise', '🏀 Iconic NBA franchise',               'Franchise NBA emblématique',    'Franquicia NBA emblemática',
      'CA MA IL TX MI NY');

  // ═════════════════════════════════════════════════════════════════════
  // 🏘️ CLIMATE / VIBE
  // ═════════════════════════════════════════════════════════════════════
  add('pc_sunshine_climate',     '☀️ Mostly sunny / warm',                'Majoritairement ensoleillé',    'Mayoritariamente soleado',
      'AZ FL CA TX NV NM HI');
  add('pc_snowy_winter_climate', '❄️ Snowy winters',                      'Hivers neigeux',                'Inviernos nevados',
      'AK MN ND VT NH ME WI MI MT ID WY NY MA');

  // ═════════════════════════════════════════════════════════════════════
  // 🦅 CIVIL RIGHTS / HISTORY
  // ═════════════════════════════════════════════════════════════════════
  add('pc_civil_rights_march',   '✊ Site of a major Civil Rights march', 'Site d\'une marche des droits civiques','Sitio de marcha de derechos civiles',
      'AL TN GA DC NC MS AR');
  add('pc_prohibition_speakeasy','🥃 Famous speakeasy / Prohibition past','Histoire de speakeasies',       'Historia de speakeasies',
      'NY IL MA NJ MI OH KY MO');

  // ═════════════════════════════════════════════════════════════════════
  // 🦬 NATIVE AMERICAN CULTURE
  // ═════════════════════════════════════════════════════════════════════
  add('pc_top_native_reservation','🪶 Has a top-10 Native reservation',   'Réserve amérindienne top 10',   'Reservación nativa top 10',
      'AZ NM SD OK MT ND NV UT WA');
  add('pc_tribal_casino',        '🎰 Major tribal casino industry',       'Casinos tribaux majeurs',       'Industria casinos tribales',
      'CA OK CT FL NY MI WI MN AZ NM WA NC');

  // ═════════════════════════════════════════════════════════════════════
  // 🌍 IMMIGRANT HERITAGE
  // ═════════════════════════════════════════════════════════════════════
  add('pc_irish_immigrant_heritage','☘️ Strong Irish-American heritage',  'Forte présence irlando-américaine','Fuerte herencia irlandesa',
      'MA NY IL PA NJ CT MI OH');
  add('pc_italian_immigrant_heritage','🍝 Strong Italian-American heritage','Forte présence italo-américaine','Fuerte herencia italiana',
      'NY NJ MA PA CT CA IL RI');
  add('pc_german_immigrant_heritage','🥨 Strong German-American heritage','Forte présence germano-américaine','Fuerte herencia alemana',
      'PA OH WI IN IL IA MN MO MI ND SD NE TX');
  add('pc_scandinavian_heritage','🛶 Strong Scandinavian heritage',       'Forte présence scandinave',     'Fuerte herencia escandinava',
      'MN WI IA ND SD WA OR');
  add('pc_polish_heritage',      '🥟 Strong Polish-American heritage',    'Forte présence polonaise',      'Fuerte herencia polaca',
      'IL MI NY MA NJ PA OH WI');

  // ═════════════════════════════════════════════════════════════════════
  // ⛪ RELIGION CULTURE
  // ═════════════════════════════════════════════════════════════════════
  add('pc_mormon_concentration', '⛪ High Mormon (LDS) population',       'Forte présence mormone',        'Alta presencia mormona',
      'UT ID AZ NV WY');
  add('pc_amish_communities',    '🐎 Notable Amish communities',          'Communautés Amish notables',    'Comunidades Amish importantes',
      'PA OH IN NY MI WI IA IL');
  add('pc_megachurch_top',       '⛪ 5+ "megachurches" (2000+ attendees)','5+ megachurches',              '5+ megaiglesias',
      'TX CA GA FL IL OH NC TN AZ CO');

  // ═════════════════════════════════════════════════════════════════════
  // 🎢 MORE TOURISM
  // ═════════════════════════════════════════════════════════════════════
  add('pc_world_top_roller_coaster','🎢 Has a top-50 roller coaster',     'Top 50 montagnes russes',       'Top 50 montañas rusas',
      'OH CA FL PA IN NC TX VA NJ MO');
  add('pc_unesco_world_heritage','🌍 Has a UNESCO World Heritage Site',   'Site UNESCO',                   'Sitio UNESCO',
      'AZ CO HI KY NM NY PA TN VA WY CA IL OH MO NC MT');
  add('pc_major_cruise_port',    '🚢 Major cruise port',                  'Port de croisière majeur',      'Puerto crucero mayor',
      'FL TX CA LA NY MD WA NJ');

  // ═════════════════════════════════════════════════════════════════════
  // 🐎 NICHE FUN
  // ═════════════════════════════════════════════════════════════════════
  add('pc_horse_racing_industry','🐎 Major horse-racing state',           'Pôle hippique majeur',          'Estado hípico mayor',
      'KY CA NY FL MD AR LA');
  add('pc_nascar_speedway',      '🏁 Has a NASCAR Cup speedway',          'Circuit NASCAR Cup',            'Circuito NASCAR Cup',
      'NC SC GA VA TN AL FL TX KS NV CA NH MI WI IN IA');
  add('pc_cowboy_culture',       '🤠 Cowboy / rodeo culture',             'Culture cowboy / rodéo',        'Cultura vaquera y rodeo',
      'TX OK CO WY NM AZ NV MT KS NE SD CA OR ID');
  add('pc_alien_lore',           '👽 Famous UFO / alien lore',            'Folklore OVNI célèbre',         'Folklore OVNI famoso',
      'NM AZ NV CA OR WA');

  // ═════════════════════════════════════════════════════════════════════
  // 🚓 LAW ENFORCEMENT / TRAGEDY MEMORY
  // ═════════════════════════════════════════════════════════════════════
  add('pc_state_trooper_iconic', '🚓 Iconic state highway patrol',        'Police d\'État emblématique',   'Patrulla estatal icónica',
      'TX CA AZ NY NJ FL OK IL');
  add('pc_early_covid_hotspot',  '🦠 Early 2020 COVID-19 hotspot',        'Foyer COVID-19 début 2020',     'Foco temprano COVID-19',
      'NY NJ MA CT IL CA WA');

  // ═════════════════════════════════════════════════════════════════════
  // 🎭 ARTS
  // ═════════════════════════════════════════════════════════════════════
  add('pc_theater_district',     '🎭 Famous theater district downtown',   'Quartier théâtral renommé',     'Distrito teatral famoso',
      'NY IL MA CA DC GA TX');
  add('pc_top10_art_museum',     '🖼️ Top-10 US art museum',               'Top 10 musées d\'art',          'Top 10 museos de arte',
      'NY MA DC CA IL PA TX OH MO MD MI MN');
  add('pc_iconic_comedy_club',   '🎙️ Iconic comedy club city',            'Club de comédie iconique',      'Club de comedia icónico',
      'NY CA IL MA TX TN FL CO');
  add('pc_podcast_hq',           '🎙️ Major podcast network HQ',           'Siège réseau podcasts',         'Sede red de podcasts',
      'CA NY MA TX GA CO IL');

  // ═════════════════════════════════════════════════════════════════════
  // 🌲 ARCHITECTURE / CHARM
  // ═════════════════════════════════════════════════════════════════════
  add('pc_covered_bridges',      '🌉 Famous for covered bridges',         'Connu pour ses ponts couverts', 'Famoso por puentes cubiertos',
      'PA OH IN VT NH ME NY OR');
  add('pc_oldest_lighthouses',   '🗼 50+ historic lighthouses',           '50+ phares historiques',        '50+ faros históricos',
      'MI ME MA NY MD VA NC FL WI MN');
  add('pc_state_capitol_dome',   '🏛️ State Capitol with a famous dome',   'Coupole de Capitole célèbre',   'Cúpula de Capitolio famosa',
      'TX MN IA WV MT IN UT WI PA CO RI MO MS NE OH');
  add('pc_giant_roadside_statue','🗿 Famous giant roadside statue',       'Statue géante célèbre',         'Estatua gigante de carretera',
      'MN SD ND ID NE OH WI MI IN TX OK');
  add('pc_drive_in_movie',       '🎬 5+ active drive-in theaters',        '5+ drive-ins actifs',           '5+ autocines activos',
      'PA NY OH NC TN IN MI WI CA TX FL VA');

  // ═════════════════════════════════════════════════════════════════════
  // 🎮 GAMING / TECH CULTURE
  // ═════════════════════════════════════════════════════════════════════
  add('pc_game_dev_hub',         '🎮 Major video game dev hub',           'Pôle jeu vidéo majeur',         'Centro mayor de videojuegos',
      'CA WA TX MA NY GA NC');
  add('pc_esports_top',          '🎮 Major esports tournament host',      'Hôte de tournois esports',      'Anfitrión de torneos esports',
      'CA TX NV NY GA WA');
  add('pc_unicorn_startup_dense','🚀 Top startup ecosystem',              'Top écosystème startup',        'Top ecosistema startup',
      'CA NY MA WA TX IL CO GA NC');
  add('pc_silicon_X',            '💻 Self-styled "Silicon X" nickname',   'Surnom « Silicon X »',          'Apodo «Silicon X»',
      'CA UT NC TX MA WA');

  // ═════════════════════════════════════════════════════════════════════
  // 🌊 NATIONAL PARKS extras
  // ═════════════════════════════════════════════════════════════════════
  add('pc_3plus_national_parks', '🏞️ Has 3+ National Parks',              '3+ parcs nationaux',            '3+ parques nacionales',
      'CA AK UT CO WA FL');

  // ═════════════════════════════════════════════════════════════════════
  // 🎤 BONUS
  // ═════════════════════════════════════════════════════════════════════
  add('pc_pair_with_neighbor',   '🤜🤛 In a famous neighbor-state rivalry','Rivalité entre États voisins', 'Rivalidad entre estados vecinos',
      'TX OK KS MO OH MI AL NC SC FL GA');

  return list;
})();

if (typeof window !== 'undefined') {
  window.PENDING_CONSTRAINTS = PENDING_CONSTRAINTS;
  window.PENDING_MAP = Object.fromEntries(PENDING_CONSTRAINTS.map(c => [c.id, c]));
}
