// ─────────────────────────────────────────────────────────────────────────
// Statedoku — Pending constraint candidates (admin review)
//
// 200+ candidates, minimum 5 states each. Focus: pop culture, brands,
// celebrity, fun facts, sports culture, quirky laws. No name/geo/politics.
//
// Storage:
//   statedoku_approved_pending / statedoku_rejected_pending
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
  // 🍔 FAST FOOD & RESTAURANT CHAINS (regional presence)
  // ═════════════════════════════════════════════════════════════════════
  add('pc_sonic_drive_in',      'Has Sonic Drive-In locations',          'A des Sonic Drive-In',          'Tiene Sonic Drive-In',
      'AL AR AZ CA CO FL GA IL IN KS KY LA MD MI MO MS NC NE NM NV OH OK PA SC TN TX UT VA');
  add('pc_whataburger',          'Has Whataburger locations',             'A des Whataburger',             'Tiene Whataburger',
      'TX AZ AL AR FL GA LA MS NM OK SC TN KS CO');
  add('pc_wawa',                 'Has Wawa convenience stores',           'A des Wawa',                    'Tiene Wawa',
      'NJ PA DE MD VA FL NC');
  add('pc_sheetz',               'Has Sheetz convenience stores',         'A des Sheetz',                  'Tiene Sheetz',
      'PA WV VA MD NC OH');
  add('pc_publix',               'Has Publix grocery',                    'A des Publix',                  'Tiene Publix',
      'FL GA AL SC NC TN VA KY');
  add('pc_meijer',               'Has Meijer grocery',                    'A des Meijer',                  'Tiene Meijer',
      'MI OH IN IL KY WI');
  add('pc_trader_joes',          'Has a Trader Joe\'s',                   'A un Trader Joe\'s',            'Tiene Trader Joe\'s',
      'CA NY NJ MA IL PA CO TX FL WA OR VA MD CT MI NV AZ MN OH NC GA WI TN');
  add('pc_ikea',                 'Has an IKEA store',                     'A un IKEA',                     'Tiene IKEA',
      'AZ CA CO CT FL GA IL MA MD MI MN MO NC NJ NY OH OR PA TX UT VA WA');
  add('pc_dunkin_heartland',     'Dunkin\' heartland (East Coast strong)','Pays de Dunkin\'',              'Tierra de Dunkin\'',
      'MA RI CT NH ME NJ NY PA VT FL IL OH');
  add('pc_krispy_kreme',         'Krispy Kreme strong presence',          'Krispy Kreme bien présent',     'Krispy Kreme presente',
      'NC SC GA AL TN VA FL TX OK AR MS LA KY');
  add('pc_white_castle',         'Has a White Castle',                    'A un White Castle',             'Tiene White Castle',
      'OH IN IL KY MO MN NY NJ WI MI TN');
  add('pc_steak_n_shake',        'Has Steak \'n Shake',                   'A des Steak \'n Shake',         'Tiene Steak \'n Shake',
      'IN OH IL KY TN GA FL MO AL VA WV NC');
  add('pc_culvers',              'Has Culver\'s',                         'A des Culver\'s',               'Tiene Culver\'s',
      'WI IL MN IA IN MI OH KY TN MO');
  add('pc_jack_in_the_box',      'Has Jack in the Box',                   'A des Jack in the Box',         'Tiene Jack in the Box',
      'CA TX AZ NV WA OR NM CO OK ID UT LA');
  add('pc_bojangles',            'Has Bojangles fried chicken',           'A des Bojangles',               'Tiene Bojangles',
      'NC SC GA VA TN KY AL FL PA MD');
  add('pc_chickfila_concentrated','Chick-fil-A Southern stronghold (≥150 stores)','Bastion sudiste de Chick-fil-A','Bastión sureño de Chick-fil-A',
      'GA TX FL NC SC AL TN VA');
  add('pc_in_n_out_present',     'Has In-N-Out Burger',                   'A des In-N-Out',                'Tiene In-N-Out',
      'CA NV AZ UT TX OR CO ID');
  add('pc_waffle_house',         'Waffle House territory',                'Pays de Waffle House',          'Territorio Waffle House',
      'GA AL SC TN FL NC LA MS TX AR KY VA OH');
  add('pc_aldi_top_states',      'Aldi heavy footprint',                  'Forte présence Aldi',           'Fuerte presencia Aldi',
      'OH IL IN PA NY NJ MI WI MN KS MD IA CA AZ FL GA');
  add('pc_kroger_states',        'Kroger present',                        'Kroger présent',                'Kroger presente',
      'OH KY MI IN IL TN AL GA AR LA NC SC TX VA WV CA NV AZ CO UT MS MO');
  add('pc_costco_top',           'Costco strong (≥10 warehouses)',        'Costco bien implanté',          'Costco bien establecido',
      'CA WA NY TX FL IL VA NJ MA AZ CO MD NC GA OR MN OH MI PA');
  add('pc_cracker_barrel',       'Cracker Barrel present',                'Cracker Barrel présent',        'Cracker Barrel presente',
      'TN GA AL FL TX KY IN OH PA VA NC SC MO IL MI WI OK AR LA MS WV');
  add('pc_dairy_queen',          'Dairy Queen heritage (Midwest)',        'DQ patrimoine',                 'DQ patrimonio',
      'MN WI IA IL IN OH MI MO KS NE ND SD OK TX');

  // ═════════════════════════════════════════════════════════════════════
  // 🍔 BORN HERE — Restaurant / Brand origins (where it started)
  // ═════════════════════════════════════════════════════════════════════
  add('pc_origin_5plus_fast_chains','Birthplace of 5+ major fast-food chains','Naissance de 5+ chaînes fast-food','Origen de 5+ cadenas de comida rápida',
      'CA OH IL TX KY WI MI NY');

  // ═════════════════════════════════════════════════════════════════════
  // 🏈 PRO SPORTS — Multi-team / multi-state
  // ═════════════════════════════════════════════════════════════════════
  add('pc_nfl_team',             'Home to an NFL team',                   'Abrite une équipe NFL',         'Alberga equipo NFL',
      'AZ CA CO FL GA IL IN LA MA MD MI MN MO NC NJ NV NY OH PA TN TX WA WI');
  add('pc_nba_team',             'Home to an NBA team',                   'Abrite une équipe NBA',         'Alberga equipo NBA',
      'CA CO FL GA IL IN LA MA MI MN MO NC NY OH OK OR PA TN TX UT WA WI AZ');
  add('pc_mlb_team',             'Home to an MLB team',                   'Abrite une équipe MLB',         'Alberga equipo MLB',
      'AZ CA CO FL GA IL MA MD MI MN MO NY OH PA TX WA WI');
  add('pc_nhl_team',             'Home to an NHL team',                   'Abrite une équipe NHL',         'Alberga equipo NHL',
      'AZ CA CO FL IL MA MI MN MO NJ NV NY NC OH PA TN TX WA');
  add('pc_4_pro_leagues',        'Has all 4 major pro leagues',           'Les 4 ligues majeures',         'Las 4 ligas mayores',
      'CA MA TX FL IL CO PA OH NY MI MN');
  add('pc_3plus_pro_leagues',    'Has 3+ major pro leagues',              '3+ ligues majeures',            '3+ ligas mayores',
      'CA MA TX FL IL CO PA OH NY MI MN GA AZ');
  add('pc_super_bowl_host',      'Has hosted a Super Bowl',               'A organisé un Super Bowl',      'Organizó un Super Bowl',
      'CA FL LA TX MN AZ NJ MI GA IN TN NV');
  add('pc_super_bowl_5plus',     'Hosted 5+ Super Bowls',                 'A organisé 5+ Super Bowls',     'Organizó 5+ Super Bowls',
      'FL CA LA');
  add('pc_nba_champ_25yr',       'NBA team won title in last 25 yrs',     'Titre NBA depuis 25 ans',       'Título NBA en últimos 25 años',
      'CA TX FL MA MI WI CO');
  add('pc_super_bowl_winner_25', 'NFL team won Super Bowl in 25 yrs',     'Vainqueur Super Bowl 25 ans',   'Ganador SB 25 años',
      'MA CO MD CA TX MO NY LA WI WA FL PA');
  add('pc_world_series_25yr',    'MLB team won World Series in 25 yrs',   'Vainqueur World Series 25 ans', 'Campeón MLB en 25 años',
      'MA AZ FL CA MO NY PA IL TX GA');
  add('pc_stanley_cup_25yr',     'NHL team won Stanley Cup in 25 yrs',    'Vainqueur Stanley Cup 25 ans',  'Stanley Cup en 25 años',
      'NJ CO MI TX MA CA PA IL FL MO NV');
  add('pc_mls_team',             'Home to an MLS team',                   'Abrite une équipe MLS',         'Alberga equipo MLS',
      'CA CO DC FL GA IL KS MA MN MO NC NY OH OR PA TN TX UT WA');
  add('pc_wnba_team',            'Home to a WNBA team',                   'Abrite une équipe WNBA',        'Alberga equipo WNBA',
      'AZ CA CT IL IN MN NY NV OH WA');
  add('pc_pro_team_animal_name', 'Pro team named after an animal',        'Équipe pro au nom d\'animal',   'Equipo pro con nombre de animal',
      'AZ NC GA MD PA WA CO IN IL OH FL MI CA TX MN PA');

  // ═════════════════════════════════════════════════════════════════════
  // 🏀 NCAA / College sports
  // ═════════════════════════════════════════════════════════════════════
  add('pc_ncaa_basketball_blueblood','NCAA basketball blue-blood',        'Mastodonte du basket NCAA',     'Gigante del baloncesto NCAA',
      'NC KY KS IN CA');
  add('pc_acc_basketball',       'ACC basketball school',                 'Université ACC',                'Universidad ACC',
      'NC VA MA NY PA FL GA IN SC KY');
  add('pc_big12_school',         'Big 12 conference school',              'École Big 12',                  'Escuela Big 12',
      'TX OK KS WV IA AZ UT CO FL OH');
  add('pc_pac12_legacy',         'Was in original Pac-12',                'Anciennement Pac-12',           'Antes Pac-12',
      'CA OR WA AZ UT CO');
  add('pc_college_football_powerhouse','College football powerhouse (4+ natl titles)','Mastodonte football NCAA','Potencia fútbol NCAA',
      'AL OK NE OH MI USC GA FL TX');

  // ═════════════════════════════════════════════════════════════════════
  // 🏟️ MAJOR SPORTS EVENTS
  // ═════════════════════════════════════════════════════════════════════
  add('pc_wrestlemania_host',    'Hosted WrestleMania',                   'A organisé WrestleMania',       'Organizó WrestleMania',
      'NJ CA NV NY TX FL MI LA AZ MN TN PA NC');
  add('pc_final_four_host',      'Hosted NCAA basketball Final Four',     'A organisé un Final Four NCAA', 'Organizó Final Four NCAA',
      'IN TX MN MI MO MN GA AZ TX LA NC OH NV CA WA NY');
  add('pc_olympics_host_any',    'Hosted Olympics (summer or winter)',    'A organisé les JO',             'Organizó los JJOO',
      'CA NY UT MO GA');
  add('pc_kentucky_derby_host',  'Triple Crown horse race',               'Triple Couronne courses hippiques','Triple Corona caballos',
      'KY MD NY');

  // ═════════════════════════════════════════════════════════════════════
  // 🎬 TV — Real Housewives & franchise reality
  // ═════════════════════════════════════════════════════════════════════
  add('pc_real_housewives_franchise','Has a Real Housewives franchise',  'Franchise Real Housewives',     'Franquicia Real Housewives',
      'NY GA NJ CA UT MD FL TX TN');
  add('pc_bravo_show_setting',   'Setting of a Bravo reality show',       'Décor d\'une émission Bravo',   'Escenario de show Bravo',
      'NY GA NJ CA UT MD FL TX TN MI');

  // ═════════════════════════════════════════════════════════════════════
  // 🎥 MOVIES — Multi-state settings
  // ═════════════════════════════════════════════════════════════════════
  add('pc_stephen_king_setting', 'Major Stephen King novel setting',      'Décor d\'un roman Stephen King','Escenario novela Stephen King',
      'ME CO MA NH NV FL NY PA');
  add('pc_marvel_mcu_us_setting','Major MCU film US location',            'Lieu MCU aux US',               'Locación MCU en EE.UU.',
      'CA NY NM VA NV TN');
  add('pc_pixar_film_setting',   'Setting of a Pixar film',               'Décor d\'un film Pixar',        'Escenario de Pixar',
      'CA NY MN CO TX MO');
  add('pc_disney_animated_us_set','US setting of a Disney animated film', 'Décor US d\'un Disney',         'Escenario US de Disney',
      'VA LA TN HI AK MO');
  add('pc_coen_brothers_setting','Setting of a Coen Brothers film',       'Décor d\'un film des frères Coen','Escenario de los Coen',
      'MN TX CA AZ NY AR');
  add('pc_tarantino_setting',    'Setting of a Tarantino film',           'Décor d\'un Tarantino',         'Escenario de Tarantino',
      'CA TN TX WY NM');
  add('pc_road_trip_movie',      'Classic American road-trip film route', 'Itinéraire de road movie',      'Ruta de película road trip',
      'CA NV UT AZ NM TX OK MO IL');

  // ═════════════════════════════════════════════════════════════════════
  // 📺 TV — Setting multiple seasons / shows
  // ═════════════════════════════════════════════════════════════════════
  add('pc_true_detective_seasons','Setting across True Detective seasons','Saisons de True Detective',     'Temporadas True Detective',
      'LA CA AR AK');
  add('pc_csi_franchise',        'Setting of a CSI franchise',            'Décor d\'une série CSI',        'Escenario de CSI',
      'NV FL NY');
  add('pc_law_order_franchise',  'Law & Order franchise main setting',    'Univers Law & Order',           'Universo Law & Order',
      'NY');

  // ═════════════════════════════════════════════════════════════════════
  // 🎵 MUSIC — Hall of Fame inductees & festival circuit
  // ═════════════════════════════════════════════════════════════════════
  add('pc_rock_hof_origin_10plus','State origin of 10+ Rock & Roll HoF inductees','Origine de 10+ R&R HoF','Origen de 10+ R&R HoF',
      'CA NY TX IL TN MI WI OH');
  add('pc_country_artist_top',   'Birthplace of a top-10 country star',   'Star country top 10',           'Estrella country top 10',
      'TN TX KY OK GA AR MS AL VA');
  add('pc_rap_artist_top',       'Birthplace of a top rap artist',        'Naissance d\'un rappeur top',   'Cuna de rapero top',
      'NY CA GA IL TX TN MI LA FL');
  add('pc_indie_rock_scene',     'Famous indie-rock city scene',          'Scène indie-rock',              'Escena indie-rock',
      'WA OR CA NY IL TX MA');

  // ═════════════════════════════════════════════════════════════════════
  // 🐔 STATE BIRDS — Iconic
  // ═════════════════════════════════════════════════════════════════════
  add('pc_state_bird_cardinal',  'State bird: Northern Cardinal',         'Oiseau d\'État: cardinal rouge','Ave estatal: cardenal',
      'IL IN KY NC OH VA WV');
  add('pc_state_bird_mockingbird','State bird: Mockingbird',              'Oiseau d\'État: moqueur',       'Ave estatal: cenzontle',
      'AR FL MS TN TX');
  add('pc_state_bird_meadowlark','State bird: Western Meadowlark',        'Oiseau d\'État: sturnelle',     'Ave estatal: pradero occidental',
      'KS MT NE ND OR WY');

  // ═════════════════════════════════════════════════════════════════════
  // 🥧 STATE FOODS / DISHES
  // ═════════════════════════════════════════════════════════════════════
  add('pc_pizza_named_after_city','Has a famous pizza style named after a city','Style de pizza nommé d\'une ville','Estilo de pizza con nombre de ciudad',
      'NY IL CT MI MO OH RI');
  add('pc_bbq_style',            'Has a distinct BBQ tradition',          'Tradition BBQ distincte',       'Tradición BBQ distintiva',
      'TX TN NC SC MO KS GA AL KY');
  add('pc_diner_culture',        'Iconic diner culture',                  'Culture diner emblématique',    'Cultura diner icónica',
      'NJ NY MA RI PA CT');
  add('pc_lobster_country',      'Lobster country',                       'Pays du homard',                'País del langosta',
      'ME MA NH RI CT NY');
  add('pc_apple_orchard_state',  'Top apple-producing state',             'Producteur de pommes',          'Productor de manzanas',
      'WA NY MI PA VA CA OR');
  add('pc_beer_craft_capital',   'Top craft-beer state',                  'Capitale craft beer',           'Capital cerveza artesanal',
      'CO CA OR WA PA MI VT IL TX NY');

  // ═════════════════════════════════════════════════════════════════════
  // ⚖️ LAWS / LIFESTYLE (factual, non-political)
  // ═════════════════════════════════════════════════════════════════════
  add('pc_recreational_cannabis','Recreational cannabis legal',           'Cannabis récréatif légal',      'Cannabis recreativo legal',
      'AK AZ CA CO CT DE IL ME MA MD MI MN MO MT NV NJ NM NY OH OR RI VT VA WA');
  add('pc_medical_cannabis_only','Medical cannabis only (not recreational)','Cannabis médical uniquement','Solo cannabis medicinal',
      'AL AR FL HI IA KY LA MS NH ND OK PA SD TX UT WV');
  add('pc_sports_betting_legal', 'Legal sports betting (in-person or online)','Paris sportifs légaux',     'Apuestas deportivas legales',
      'AZ AR CO CT DE IL IN IA KY LA ME MD MA MI MS MO MT NV NH NJ NM NY NC ND OH OR PA RI SD TN VA WA WV WY VT WI');
  add('pc_online_casino',        'Online casino legal',                   'Casino en ligne légal',         'Casino online legal',
      'NJ PA MI WV CT DE RI');
  add('pc_no_state_lottery',     'No state lottery',                      'Pas de loterie d\'État',        'Sin lotería estatal',
      'AL AK HI NV UT');
  add('pc_no_state_income_tax',  'No state income tax',                   'Pas d\'impôt sur le revenu',    'Sin impuesto estatal sobre la renta',
      'AK FL NV NH SD TN TX WA WY');
  add('pc_no_state_sales_tax',   'No state sales tax',                    'Pas de taxe de vente',          'Sin impuesto sobre las ventas',
      'AK DE MT NH OR');
  add('pc_death_penalty_abolished','Death penalty abolished',             'Peine de mort abolie',          'Pena de muerte abolida',
      'NY NJ NM IL CT MD CO WA OR HI ME MA MI MN ND RI VT WV WI');
  add('pc_commercial_casino',    'Has commercial casinos',                'Casinos commerciaux',           'Casinos comerciales',
      'NV NJ MS LA CO MI IL IN IA MO PA OH KS MD WV NY OK ME RI DE FL CT WA OR NM');

  // ═════════════════════════════════════════════════════════════════════
  // 🚗 AUTOMOTIVE / INDUSTRY
  // ═════════════════════════════════════════════════════════════════════
  add('pc_auto_plant',           'Has a major auto manufacturing plant',  'Usine auto majeure',            'Planta automotriz mayor',
      'MI OH IN KY TN AL SC MS GA TX CA MO KS WI');
  add('pc_big_tech_office',      'Big Tech major office (Google/Apple/Meta/MSFT/Amazon)','Bureau Big Tech majeur','Oficina mayor Big Tech',
      'CA WA TX NY MA OR CO IL VA GA AZ');
  add('pc_oil_country',          'Major oil/gas producing state',         'Producteur pétrole/gaz majeur', 'Productor mayor petróleo/gas',
      'TX OK ND NM CO WY LA AK CA WV PA');
  add('pc_aerospace_hub',        'Major aerospace manufacturing',         'Pôle aérospatial',              'Centro aeroespacial',
      'WA CA AZ TX FL GA KS AL OH MO');

  // ═════════════════════════════════════════════════════════════════════
  // ✈️ TRAVEL & TOURISM
  // ═════════════════════════════════════════════════════════════════════
  add('pc_top10_airport_passengers','Top 10 busiest US airport',          'Top 10 aéroports US',           'Top 10 aeropuertos US',
      'GA TX IL CA CO NY FL');
  add('pc_iconic_beach_dest',    'Iconic US beach destination',           'Plage emblématique US',         'Playa icónica US',
      'FL CA HI NJ NC SC MA NY ME RI MD VA AL MS LA TX OR WA');
  add('pc_top_ski_state',        'Top US ski destination',                'Destination ski US',            'Destino esquí US',
      'CO VT UT CA WA OR NH NY MT ID WY MI MN ME');
  add('pc_top_national_park_vis','Has top-15 visited National Park',      'Parc national top-15',          'Parque nacional top-15',
      'CA AZ TN UT WY CO ME WA VA NC SD');
  add('pc_park_quarter_series',  'Featured on America the Beautiful quarter','Sur un quarter America the Beautiful','En quarter America the Beautiful',
      'AR HI YS WY ME AZ AK NH MD FL TN ND SD AL CT NV TX');
  add('pc_fall_foliage_top',     'Top fall foliage destination',          'Top feuillage automne',         'Top follaje otoñal',
      'VT NH ME MA RI CT NY PA WV VA TN NC GA MI WI MN');
  add('pc_theme_park_major',     'Has a major theme park',                'Parc d\'attractions majeur',    'Parque de atracciones mayor',
      'CA FL OH PA NJ TX VA MO IL IA GA');

  // ═════════════════════════════════════════════════════════════════════
  // 🎭 ENTERTAINMENT INDUSTRY
  // ═════════════════════════════════════════════════════════════════════
  add('pc_film_tax_incentive',   'Strong film/TV production tax incentive','Crédit d\'impôt cinéma fort',  'Crédito fiscal cine fuerte',
      'GA LA NM NY CA IL MA NC OK');
  add('pc_5plus_snl_castmembers','State produced 5+ SNL cast members',    'État: 5+ membres du SNL',       'Estado: 5+ miembros SNL',
      'IL NY CA MA MI OH PA TX');
  add('pc_top_jazz_scenes',      'Historic jazz scene',                   'Scène jazz historique',         'Escena jazz histórica',
      'LA NY IL MO CA TN');
  add('pc_top_blues_scenes',     'Historic blues scene',                  'Scène blues historique',        'Escena blues histórica',
      'MS TN IL TX LA AR');

  // ═════════════════════════════════════════════════════════════════════
  // 🦅 SERIAL KILLERS / TRUE CRIME (cultural fascination)
  // ═════════════════════════════════════════════════════════════════════
  add('pc_serial_killer_history','Notorious serial killer history',       'Histoire de tueurs en série',   'Historia de asesinos en serie',
      'WA FL UT IL KS NY CA WI');
  add('pc_mafia_history',        'Significant mafia history',             'Histoire mafieuse marquante',   'Historia mafiosa relevante',
      'NY NJ IL NV FL MA RI PA');

  // ═════════════════════════════════════════════════════════════════════
  // 🎤 BIRTHPLACE OF CULTURAL ICONS (groups, not individuals)
  // ═════════════════════════════════════════════════════════════════════
  add('pc_birthplace_oscar_winners','State of 5+ Oscar Best Actor/Actress winners','5+ Oscars du meilleur acteur','5+ Oscar Mejor Actor',
      'CA NY TX IL OH MA NJ');
  add('pc_birthplace_grammy_aoty','State of 3+ Grammy Album of the Year winners','3+ Grammys Album de l\'année','3+ Grammy Álbum del Año',
      'CA NY TN GA TX NJ');
  add('pc_5plus_us_presidents',  'Birthplace of 5+ US presidents',        'Naissance de 5+ présidents US', 'Cuna de 5+ presidentes US',
      'VA OH NY MA');
  add('pc_3plus_presidents',     'Birthplace of 3+ presidents',           'Naissance de 3+ présidents',    'Cuna de 3+ presidentes',
      'VA OH NY MA TX VT NC');

  // ═════════════════════════════════════════════════════════════════════
  // 🎪 STATE FAIRS & ICONIC ANNUAL EVENTS
  // ═════════════════════════════════════════════════════════════════════
  add('pc_iconic_state_fair',    'Has an iconic state fair (1M+ visitors)','Foire d\'État emblématique',   'Feria estatal icónica',
      'TX MN IA OH OK NY MO WI IN GA');
  add('pc_mardi_gras_parades',   'Major Mardi Gras celebrations',         'Carnaval Mardi Gras majeur',    'Carnaval Mardi Gras',
      'LA AL MS FL TX');

  // ═════════════════════════════════════════════════════════════════════
  // 🎢 AMUSEMENT PARKS / ENTERTAINMENT
  // ═════════════════════════════════════════════════════════════════════
  add('pc_six_flags_park',       'Has a Six Flags park',                  'A un parc Six Flags',           'Tiene parque Six Flags',
      'CA TX NJ IL MA GA MO MD NY');
  add('pc_seaworld_busch',       'Has SeaWorld or Busch Gardens',         'A SeaWorld ou Busch Gardens',   'Tiene SeaWorld o Busch Gardens',
      'CA FL VA TX');
  add('pc_world_top_roller_coaster','Has a top-50 roller coaster (Mitch Hawker)','Top-50 montagnes russes','Top-50 montañas rusas',
      'OH CA FL PA IN NC TX VA NJ MO');

  // ═════════════════════════════════════════════════════════════════════
  // 🎯 PRO TEAM NAME PATTERNS
  // ═════════════════════════════════════════════════════════════════════
  add('pc_team_named_after_profession','Pro team named after profession (Steelers, Packers, 49ers...)','Équipe au nom de métier','Equipo con nombre de oficio',
      'PA WI CA NE');
  add('pc_team_named_after_history','Pro team named after historic moment (Mavericks, Pioneers, 76ers)','Équipe au nom historique','Equipo con nombre histórico',
      'TX PA MA CO');

  // ═════════════════════════════════════════════════════════════════════
  // 🚂 IRON / RAIL / OLD INDUSTRY
  // ═════════════════════════════════════════════════════════════════════
  add('pc_route66_state',        'On historic Route 66',                  'Sur la Route 66',               'En la Ruta 66',
      'IL MO KS OK TX NM AZ CA');
  add('pc_appalachian_trail',    'Along the Appalachian Trail',           'Sur le sentier des Appalaches', 'En el sendero de los Apalaches',
      'GA NC TN VA WV MD PA NJ NY CT MA VT NH ME');
  add('pc_pacific_crest_trail',  'On the Pacific Crest Trail',            'Sur le sentier Pacific Crest',  'Sendero Pacific Crest',
      'CA OR WA');

  // ═════════════════════════════════════════════════════════════════════
  // 🦬 SPORTS RIVALRIES
  // ═════════════════════════════════════════════════════════════════════
  add('pc_iconic_cfb_rivalry',   'Iconic college football rivalry (Iron Bowl, The Game, Bedlam...)','Rivalité football NCAA iconique','Rivalidad CFB icónica',
      'AL OH MI OK TX FL GA TN');
  add('pc_iconic_nba_franchise', 'Iconic NBA franchise (Lakers/Celtics/Bulls/Spurs...)','Franchise NBA iconique','Franquicia NBA icónica',
      'CA MA IL TX MI NY');

  // ═════════════════════════════════════════════════════════════════════
  // 🏘️ NICKNAME / IDENTITY (state's vibe)
  // ═════════════════════════════════════════════════════════════════════
  add('pc_sunshine_climate',     'Predominantly sunny / warm climate',    'Climat majoritairement ensoleillé','Clima predominantemente soleado',
      'AZ FL CA TX NV NM HI');
  add('pc_snowy_winter_climate', 'Predominantly snowy winters',           'Hivers majoritairement neigeux','Inviernos predominantemente nevados',
      'AK MN ND VT NH ME WI MI MT ID WY NY MA');

  // ═════════════════════════════════════════════════════════════════════
  // 🎤 ICONIC CONCERT VENUES
  // ═════════════════════════════════════════════════════════════════════
  add('pc_iconic_concert_venue', 'Iconic concert venue (Red Rocks, Hollywood Bowl, MSG, Ryman...)','Salle de concert iconique','Recinto icónico',
      'CO CA NY TN NV IL TX MA WA');

  // ═════════════════════════════════════════════════════════════════════
  // 🍷 WINE / VINEYARDS
  // ═════════════════════════════════════════════════════════════════════
  add('pc_wine_region_named',    'Famous American wine region',           'Région viticole célèbre',       'Región vinícola famosa',
      'CA OR WA NY MI VA TX MO');

  // ═════════════════════════════════════════════════════════════════════
  // 🦅 NATIONAL PARKS — counts
  // ═════════════════════════════════════════════════════════════════════
  add('pc_3plus_national_parks', 'Has 3+ National Parks',                 '3+ parcs nationaux',            '3+ parques nacionales',
      'CA AK UT CO WA FL');
  add('pc_unesco_world_heritage','Has a UNESCO World Heritage Site',      'Site UNESCO',                   'Sitio UNESCO',
      'AZ CO HI KY NM NY PA TN VA WY CA IL OH MO NC MT');

  // ═════════════════════════════════════════════════════════════════════
  // 🎬 GENRE — Where filmmakers love to shoot
  // ═════════════════════════════════════════════════════════════════════
  add('pc_western_film_setting', 'Classic Western film setting',          'Décor de western classique',    'Escenario de western clásico',
      'CA AZ NM TX UT CO MT WY NV OK');
  add('pc_horror_movie_setting', 'Setting of iconic horror movies',       'Décor de films d\'horreur cultes','Escenario de horror icónico',
      'CA TX IL OH IN ME CO NV');

  // ═════════════════════════════════════════════════════════════════════
  // 🎙️ TALK SHOW / LATE NIGHT HOSTS' BIRTHPLACE
  // ═════════════════════════════════════════════════════════════════════
  add('pc_late_night_host_origin','Birthplace of major late-night TV host','État natal d\'un grand animateur TV','Cuna de presentador TV',
      'IN MA OH NJ NY GA IA');

  // ═════════════════════════════════════════════════════════════════════
  // 🧀 STATE STEREOTYPES (cultural shorthand)
  // ═════════════════════════════════════════════════════════════════════
  add('pc_known_for_cheese',     'Famously associated with cheese',       'Connu pour le fromage',         'Famoso por el queso',
      'WI VT CA NY MN');
  add('pc_known_for_potatoes',   'Famously associated with potatoes',     'Connu pour les pommes de terre','Famoso por las patatas',
      'ID ME WA OR ND');
  add('pc_known_for_oranges',    'Famously associated with citrus',       'Connu pour les agrumes',        'Famoso por los cítricos',
      'FL CA AZ TX');
  add('pc_known_for_peaches',    'Famously associated with peaches',      'Connu pour les pêches',         'Famoso por los duraznos',
      'GA SC CA NJ');
  add('pc_known_for_maple',      'Famously associated with maple syrup',  'Connu pour le sirop d\'érable', 'Famoso por jarabe de arce',
      'VT NY NH ME WI MI');

  // ═════════════════════════════════════════════════════════════════════
  // 🦠 PANDEMIC / EPIDEMIC HISTORY (recent cultural memory)
  // ═════════════════════════════════════════════════════════════════════
  add('pc_early_covid_hotspot',  'Early 2020 COVID-19 hotspot',           'Foyer COVID-19 début 2020',     'Foco temprano COVID-19',
      'NY NJ MA CT IL CA WA');

  // ═════════════════════════════════════════════════════════════════════
  // 🎓 EDUCATION — Big trivia
  // ═════════════════════════════════════════════════════════════════════
  add('pc_top10_engineering_uni','Has a top-10 engineering university',   'Top 10 universités d\'ingénierie','Top 10 universidades de ingeniería',
      'MA CA TX IL GA MI');
  add('pc_top10_law_school',     'Has a top-10 law school',               'Top 10 facultés de droit',      'Top 10 facultades de derecho',
      'CT MA NY IL CA VA MI PA');
  add('pc_top10_med_school',     'Has a top-10 medical school',           'Top 10 facultés de médecine',   'Top 10 facultades de medicina',
      'MA CA MD PA NY NC MI MN');

  // ═════════════════════════════════════════════════════════════════════
  // 🏛️ NICKNAMED CITIES / "X CAPITAL OF Y"
  // ═════════════════════════════════════════════════════════════════════
  add('pc_country_music_capital','Country music capital city',            'Capitale country music',        'Capital música country',
      'TN');
  add('pc_5plus_state_capitals_largest','Capital is one of 5 largest cities','Capitale dans top 5',        'Capital top 5 ciudades',
      'AZ CO GA IN MA OK SC UT TN');
  add('pc_3plus_million_cities', 'Has 3+ million-person cities',          '3+ villes de 1M+',              '3+ ciudades de 1M+',
      'TX CA');

  // ═════════════════════════════════════════════════════════════════════
  // 🚀 NASA / SPACE
  // ═════════════════════════════════════════════════════════════════════
  add('pc_nasa_facility',        'Major NASA facility',                   'Site NASA majeur',              'Sitio NASA mayor',
      'TX FL AL CA OH VA MD MS');
  add('pc_apollo_program_state', 'Played role in Apollo program',         'Rôle dans le programme Apollo', 'Rol en programa Apollo',
      'TX FL AL OH CA VA');

  // ═════════════════════════════════════════════════════════════════════
  // 🐎 SPORTS — Equestrian & Niche
  // ═════════════════════════════════════════════════════════════════════
  add('pc_horse_industry',       'Significant horse breeding industry',   'Industrie chevaline majeure',   'Industria equina mayor',
      'KY TX FL CA OK NY VA TN');

  // ═════════════════════════════════════════════════════════════════════
  // 🎉 CRUISE & PORTS
  // ═════════════════════════════════════════════════════════════════════
  add('pc_major_cruise_port',    'Major cruise port',                     'Port de croisière majeur',      'Puerto crucero mayor',
      'FL TX CA LA NY MD WA NJ');

  // ═════════════════════════════════════════════════════════════════════
  // 📚 LITERATURE — Famous American novel setting
  // ═════════════════════════════════════════════════════════════════════
  add('pc_great_gatsby_setting', 'The Great Gatsby setting',              'Décor de Gatsby le Magnifique', 'Escenario de El Gran Gatsby',
      'NY');
  add('pc_huckleberry_finn',     'Huck Finn / Twain Mississippi setting', 'Décor de Twain (Mississippi)',  'Escenario Twain Misisipi',
      'MO IL AR TN MS LA');
  add('pc_grapes_of_wrath',      'Grapes of Wrath route',                 'Route des Raisins de la colère','Ruta de Las uvas de la ira',
      'OK TX NM AZ CA');
  add('pc_to_kill_mockingbird',  'To Kill a Mockingbird setting',         'Décor de Ne tirez pas sur l\'oiseau moqueur','Escenario de Matar a un ruiseñor',
      'AL');

  // ═════════════════════════════════════════════════════════════════════
  // 🐎 PRESIDENTIAL LIBRARIES
  // ═════════════════════════════════════════════════════════════════════
  add('pc_presidential_library', 'Has a Presidential Library',            'Bibliothèque présidentielle',   'Biblioteca presidencial',
      'GA TX CA AR KS MA MI MO NY OK VA IL IA OH IN');

  // ═════════════════════════════════════════════════════════════════════
  // 🎤 BIRTHPLACE OF MODERN POP STARS (2010s+, multi-state)
  // ═════════════════════════════════════════════════════════════════════
  add('pc_pop_star_2010s',       'Birthplace of a top 2010s+ pop artist','Naissance d\'une star pop 2010+','Cuna de estrella pop 2010+',
      'PA TX GA TN NY NJ CA FL');

  // ═════════════════════════════════════════════════════════════════════
  // 🏉 SUPER BOWL / RING COUNT
  // ═════════════════════════════════════════════════════════════════════
  add('pc_super_bowl_won_3plus','NFL team won 3+ Super Bowls',            'Équipe NFL avec 3+ Super Bowls','Equipo NFL con 3+ Super Bowls',
      'MA CA PA TX MD NY');

  // ═════════════════════════════════════════════════════════════════════
  // 🦅 BALD EAGLE / WILDLIFE
  // ═════════════════════════════════════════════════════════════════════
  add('pc_large_bald_eagle_pop', 'Large bald eagle population',           'Grande population de pygargues','Gran población de águilas calvas',
      'AK MN WA WI FL MI OR');
  add('pc_wild_bear_range',      'Wild black/brown/grizzly bear range',   'Aire de répartition des ours sauvages','Hábitat de osos salvajes',
      'AK MT WY ID WA OR CA CO ME NH VT MI WI MN NY PA TN NC GA WV VA');

  // ═════════════════════════════════════════════════════════════════════
  // 🐊 ICONIC ANIMAL ASSOCIATIONS
  // ═════════════════════════════════════════════════════════════════════
  add('pc_alligator_native',     'Native alligator territory',            'Territoire des alligators',     'Territorio de aligátores',
      'FL LA GA AL MS SC NC TX OK AR');
  add('pc_bison_herd',           'Has wild bison herd',                   'Troupeau de bisons sauvages',   'Manada de bisontes silvestres',
      'WY MT SD UT AZ OK SK');
  add('pc_moose_native',         'Native moose territory',                'Territoire de l\'orignal',      'Territorio del alce',
      'AK ME NH VT MN MT WY ID WA WI MI CO ND UT NY');

  // ═════════════════════════════════════════════════════════════════════
  // 🏔️ NICKNAME CULTURE
  // ═════════════════════════════════════════════════════════════════════
  add('pc_state_motto_french_or_latin','State motto in French or Latin',  'Devise d\'État en latin/français','Lema estatal en latín/francés',
      'NY VT MN MI MD MA MN PA NC FL');

  // ═════════════════════════════════════════════════════════════════════
  // ⛪ RELIGION CULTURE (cultural, not political)
  // ═════════════════════════════════════════════════════════════════════
  add('pc_mormon_concentration', 'High Mormon population',                'Forte présence mormone',        'Alta presencia mormona',
      'UT ID AZ NV WY');
  add('pc_amish_communities',    'Significant Amish communities',         'Communautés Amish notables',    'Comunidades Amish importantes',
      'PA OH IN NY MI WI IA IL');

  // ═════════════════════════════════════════════════════════════════════
  // 🎬 OSCAR BEST PICTURE — Setting
  // ═════════════════════════════════════════════════════════════════════
  add('pc_oscar_best_pic_setting','Setting of an Oscar Best Picture',     'Décor d\'un Oscar du meilleur film','Escenario de Oscar Mejor Película',
      'CA NY MA TX MO LA NM GA');

  // ═════════════════════════════════════════════════════════════════════
  // 🎬 NICOLAS CAGE / IT MOVIES / SAW etc
  // ═════════════════════════════════════════════════════════════════════
  add('pc_pixar_finding_nemo',   'Pixar Finding Nemo intro location (CA reef)','Décor de Nemo','Escenario Buscando a Nemo',
      'CA');

  // ═════════════════════════════════════════════════════════════════════
  // 🪄 FANTASY / SCI-FI — Multi-state things
  // ═════════════════════════════════════════════════════════════════════
  add('pc_x_men_school',         'X-Men comic / movie school is here',    'École des X-Men',               'Escuela de X-Men',
      'NY');
  add('pc_alien_lore',           'Famous UFO / alien lore',               'Légendes UFO célèbres',         'Folclor extraterrestre famoso',
      'NM AZ NV CA OR WA');

  // ═════════════════════════════════════════════════════════════════════
  // 📺 GAME SHOWS / RECORDS
  // ═════════════════════════════════════════════════════════════════════
  add('pc_jeopardy_winners_top','Top Jeopardy! all-time winners came from','Vainqueurs Jeopardy! top',     'Ganadores top Jeopardy!',
      'CA OK NY WA UT IL');

  // ═════════════════════════════════════════════════════════════════════
  // ⛏️ COWBOY / WILD WEST
  // ═════════════════════════════════════════════════════════════════════
  add('pc_cowboy_culture',       'Cowboy / rodeo culture',                'Culture cowboy / rodéo',        'Cultura vaquera/rodeo',
      'TX OK CO WY NM AZ NV MT KS NE SD CA OR ID');

  // ═════════════════════════════════════════════════════════════════════
  // 📺 KIDS TV — Nickelodeon / Disney Channel
  // ═════════════════════════════════════════════════════════════════════
  add('pc_disney_channel_sitcom_set','Disney Channel sitcom setting (Hannah Montana, etc.)','Décor sitcom Disney Channel','Escenario sitcom Disney Channel',
      'TN CA NY HI');

  // ═════════════════════════════════════════════════════════════════════
  // 🐎 RACING / SPEED
  // ═════════════════════════════════════════════════════════════════════
  add('pc_nascar_speedway',      'Has a NASCAR Cup-level speedway',       'A un circuit NASCAR Cup',       'Tiene óvalo NASCAR Cup',
      'NC SC GA VA TN AL FL TX KS NV CA NH MI WI IN IA');

  // ═════════════════════════════════════════════════════════════════════
  // 🎓 EDUCATION — Big batch
  // ═════════════════════════════════════════════════════════════════════
  add('pc_ivy_league_home',      'Home to an Ivy League school',          'Université Ivy League',         'Hogar de Ivy League',
      'MA NY NJ CT PA NH RI');
  add('pc_us_service_academy',   'Has a US military service academy',     'Académie militaire fédérale',   'Academia militar federal',
      'NY MD CO CT');
  add('pc_top_public_uni',       'Has a top-15 public university',        'Top 15 universités publiques',  'Top 15 universidades públicas',
      'CA MI VA NC GA WI IL TX FL WA OH');
  add('pc_top_business_school',  'Has a top-10 business school',          'Top 10 écoles de commerce',     'Top 10 escuelas de negocios',
      'PA MA CA IL NY NC IN MI NH');
  add('pc_top_liberal_arts',     'Has a top-10 liberal arts college',    'Top 10 colleges arts libéraux','Top 10 college artes liberales',
      'MA ME VT PA OH IL MN NY CA');
  add('pc_top_art_school',       'Has a top-10 art / design school',      'Top 10 écoles d\'art / design', 'Top 10 escuelas de arte',
      'NY CA RI IL MA MI');
  add('pc_hbcu_top',             'Home to a top-rated HBCU',              'HBCU de premier plan',          'HBCU principal',
      'DC GA AL FL MD NC SC TN TX VA LA MS');
  add('pc_jesuit_university',    'Has a major Jesuit university',         'Université jésuite majeure',    'Universidad jesuita mayor',
      'DC MA NY PA OH MI CA LA WI MD');
  add('pc_state_uni_powerhouse', 'Land-grant flagship + Power 5',         'Université d\'État de premier plan','Universidad estatal de élite',
      'AL AR CA CO FL GA IL IN IA KS KY LA MA MD MI MN MS MO NC NE NJ NY OH OK OR PA SC TN TX UT VA WA WI WV');
  add('pc_5plus_rhodes_scholars','State of 5+ Rhodes Scholars',           'État de 5+ boursiers Rhodes',   'Estado de 5+ becarios Rhodes',
      'CA NY MA TX VA PA IL');

  // ═════════════════════════════════════════════════════════════════════
  // 🏆 SPORTS LEGENDS — Grouped birthplaces
  // ═════════════════════════════════════════════════════════════════════
  add('pc_heisman_winner_origin','Birthplace of 2+ Heisman Trophy winners','2+ Heisman du même État',      '2+ ganadores de Heisman',
      'TX CA FL OH OK AL MI IN PA NE');
  add('pc_nba_hall_of_famer_origin','Birthplace of 5+ NBA Hall of Famers','5+ HoF NBA',                    '5+ Hall of Fame NBA',
      'NY CA IL PA IN NC MI OH LA TX');
  add('pc_nfl_hall_of_famer_origin','Birthplace of 5+ NFL Hall of Famers','5+ HoF NFL',                    '5+ Hall of Fame NFL',
      'TX CA PA OH NY IL FL MI NC LA AL');
  add('pc_mlb_hall_of_famer_origin','Birthplace of 5+ MLB Hall of Famers','5+ HoF MLB',                    '5+ Hall of Fame MLB',
      'CA NY PA TX OH IL AL GA MO');
  add('pc_olympic_gold_5plus',   'Birthplace of 5+ Olympic gold medalists','5+ médaillés d\'or olympiques','5+ medallistas oro olímpicos',
      'CA NY TX FL IL OH PA MI');
  add('pc_kentucky_derby_winner','State of trainers/owners with multiple Derby wins','Multiples vainqueurs du Kentucky Derby','Múltiples ganadores Kentucky Derby',
      'KY CA NY FL TX MD');
  add('pc_qb_super_bowl_mvp',    'Birthplace of a Super Bowl MVP QB',     'Naissance d\'un MVP Super Bowl QB','Cuna de QB MVP de Super Bowl',
      'TX CA PA AL FL LA');
  add('pc_boxer_world_champ',    'Birthplace of a world boxing champion', 'Champion du monde de boxe',     'Campeón mundial de boxeo',
      'NY CA TX PA IL NJ MI FL');

  // ═════════════════════════════════════════════════════════════════════
  // 📚 AMERICAN WRITERS — Where they lived/wrote
  // ═════════════════════════════════════════════════════════════════════
  add('pc_hemingway_lived',      'Where Hemingway lived & wrote',         'Lieux d\'Hemingway',            'Donde vivió Hemingway',
      'FL ID MI IL');
  add('pc_steinbeck_setting',    'John Steinbeck novel settings',         'Décor de Steinbeck',            'Escenarios de Steinbeck',
      'CA OK TX MO');
  add('pc_faulkner_country',     'William Faulkner country',              'Pays de Faulkner',              'País de Faulkner',
      'MS');
  add('pc_twain_lived',          'Where Mark Twain lived',                'Où vécut Mark Twain',           'Donde vivió Twain',
      'MO CT NV NY');
  add('pc_poe_lived',            'Where Edgar Allan Poe lived',           'Où vécut Edgar Allan Poe',      'Donde vivió Poe',
      'MA NY MD VA PA SC');
  add('pc_cormac_mccarthy',      'Cormac McCarthy novel setting',         'Décor de Cormac McCarthy',      'Escenario de Cormac McCarthy',
      'TN TX NM AZ');
  add('pc_little_house_prairie', 'Little House on the Prairie locations', 'Petite maison dans la prairie', 'La Casa de la Pradera',
      'WI KS MN SD MO');
  add('pc_pulitzer_newspaper',   'Pulitzer Prize-winning newspaper',      'Journal Prix Pulitzer',         'Periódico Pulitzer',
      'NY CA IL DC FL MA TX VA WI GA');

  // ═════════════════════════════════════════════════════════════════════
  // 🎤 MUSIC TOURS / SCENES (more)
  // ═════════════════════════════════════════════════════════════════════
  add('pc_warped_tour_stop',     'Vans Warped Tour regular stop',         'Étape Warped Tour',             'Parada Warped Tour',
      'CA NV AZ CO TX OK MO IL OH MI NY MA NJ PA FL GA');
  add('pc_outdoor_amphitheater', 'Has an iconic outdoor amphitheater',    'Amphithéâtre extérieur emblématique','Anfiteatro icónico al aire libre',
      'CO CA TN NY VA AZ TX MA WA GA NV');
  add('pc_country_music_artist_origin','Birthplace of 3+ Hall of Fame country artists','3+ stars country HoF','3+ leyendas country HoF',
      'TN TX KY OK AR LA GA MS AL VA NC');

  // ═════════════════════════════════════════════════════════════════════
  // 💻 TECH / STARTUP
  // ═════════════════════════════════════════════════════════════════════
  add('pc_unicorn_startup_dense','Top startup ecosystem (top 10 metros)', 'Écosystème startup de pointe',  'Top ecosistema startup',
      'CA NY MA WA TX IL CO GA NC');
  add('pc_silicon_X',            'Self-styled "Silicon X" nickname',      'Surnom "Silicon X"',            'Apodo «Silicon X»',
      'CA UT NC TX MA WA');
  add('pc_tech_founder_birth',   'Birthplace of a Big Tech founder',      'Naissance d\'un fondateur tech','Cuna de fundador Big Tech',
      'WA NM NY MI IL CA OH PA FL');

  // ═════════════════════════════════════════════════════════════════════
  // 🦄 INDIGENOUS / NATIVE AMERICAN CULTURE
  // ═════════════════════════════════════════════════════════════════════
  add('pc_top_native_reservation','Has a top-10 Native reservation (by area)','Réserve amérindienne top 10','Reservación nativa top 10',
      'AZ NM SD OK MT ND NV UT WA');
  add('pc_tribal_casino',        'Major tribal casino industry',          'Casinos tribaux majeurs',       'Industria de casinos tribales',
      'CA OK CT FL NY MI WI MN AZ NM WA NC');
  add('pc_pueblo_culture',       'Pueblo or ancient cliff dwellings',     'Culture Pueblo / habitats troglodytes','Cultura Pueblo / acantilados',
      'AZ NM CO UT');

  // ═════════════════════════════════════════════════════════════════════
  // 🦹 CULT / TRUE-CRIME LORE (cultural memory)
  // ═════════════════════════════════════════════════════════════════════
  add('pc_famous_cult_history',  'Famous cult / sect history',            'Histoire de sectes / cultes',   'Historia de sectas / cultos',
      'TX CA UT CO OR WA AZ FL');
  add('pc_unsolved_mystery',     'Famous unsolved mystery / disappearance','Mystère / disparition célèbre','Misterio sin resolver',
      'NV NM CA OR WA AZ');

  // ═════════════════════════════════════════════════════════════════════
  // 🏞️ OUTDOOR / RECREATION
  // ═════════════════════════════════════════════════════════════════════
  add('pc_top_hiking_state',     'Top-tier hiking destination',           'Top destination randonnée',     'Destino top de senderismo',
      'CO CA UT WA OR WY MT NH VT NC TN ME AZ NV NM');
  add('pc_top_camping',          'Top camping destination',               'Top destination camping',       'Top camping',
      'CO UT WY MT WA OR CA AZ NM NV ID AK MN');
  add('pc_iconic_road_trip',     'Iconic American road trip route',       'Itinéraire road trip emblématique','Ruta road trip icónica',
      'CA OR WA NV UT AZ NM TX OK MO IL KY TN NC VA');
  add('pc_top_fly_fishing',      'Top fly-fishing destination',           'Top pêche à la mouche',         'Top pesca con mosca',
      'MT WY CO ID OR WA UT AK CA');
  add('pc_top_kayak_canoe',      'Top kayak / canoe destination',         'Top kayak / canoë',             'Top kayak / canoa',
      'MN WI MI ME NH VT NY FL CA WA OR CO AK');
  add('pc_top_skiing_resort',    'Has top-tier ski resort',               'Station de ski top',            'Estación de esquí top',
      'CO UT VT CA WY MT NH ID WA OR NV');

  // ═════════════════════════════════════════════════════════════════════
  // 🚂 COVERED BRIDGES & QUIRKY ARCHITECTURE
  // ═════════════════════════════════════════════════════════════════════
  add('pc_covered_bridges',      'Famous for covered bridges',            'Connu pour ses ponts couverts', 'Famoso por puentes cubiertos',
      'PA OH IN VT NH ME NY OR');
  add('pc_oldest_lighthouses',   'Has multiple historic lighthouses (50+)','50+ phares historiques',       '50+ faros históricos',
      'MI ME MA NY MD VA NC FL WI MN');
  add('pc_state_capitol_dome',   'State Capitol has a famous dome',       'Coupole de Capitole célèbre',   'Cúpula de Capitolio famosa',
      'TX MN IA WV MT IN UT WI PA CO RI MO MS NE OH');

  // ═════════════════════════════════════════════════════════════════════
  // 🏰 ROADSIDE AMERICANA
  // ═════════════════════════════════════════════════════════════════════
  add('pc_giant_roadside_statue','Famous giant roadside statue',          'Statue géante célèbre',         'Estatua gigante de carretera',
      'MN SD ND ID NE OH WI MI IN TX OK');
  add('pc_drive_in_movie',       '5+ active drive-in theaters',           '5+ drive-ins actifs',           '5+ autocines activos',
      'PA NY OH NC TN IN MI WI CA TX FL VA');

  // ═════════════════════════════════════════════════════════════════════
  // 🎄 HOLIDAY / SEASONAL
  // ═════════════════════════════════════════════════════════════════════
  add('pc_christmas_market',     'Major German-style Christmas market',   'Marché de Noël allemand',       'Mercado navideño alemán',
      'NY IL OH PA TX MI WI MO MN');
  add('pc_pumpkin_capital',      'Pumpkin / fall festival capital',       'Capitale citrouilles / automne','Capital calabazas / otoño',
      'IL CA OH PA IN MI NY MO');
  add('pc_haunted_destinations', '"Most haunted" tourism destinations',   'Destinations "hantées" populaires','Destinos «embrujados»',
      'MA RI LA CA NV CO IL TN PA');

  // ═════════════════════════════════════════════════════════════════════
  // 🎭 BROADWAY / THEATER
  // ═════════════════════════════════════════════════════════════════════
  add('pc_broadway_origins',     'Birthplace of Broadway musical legends','Naissance d\'icônes de Broadway','Cuna de leyendas de Broadway',
      'NY NJ MA CT CA IL OH');
  add('pc_theater_district',     'Famous downtown theater district',      'Quartier théâtral renommé',     'Distrito teatral famoso',
      'NY IL MA CA DC GA TX');

  // ═════════════════════════════════════════════════════════════════════
  // 🦅 PRESIDENTIAL FACTS — Beyond birthplace
  // ═════════════════════════════════════════════════════════════════════
  add('pc_pres_assassinated_in', 'Assassination of a sitting president',  'Assassinat d\'un président',    'Asesinato de presidente',
      'DC TX OH NY');
  add('pc_pres_died_in_office',  'A sitting president died here',         'Mort d\'un président en exercice','Murió presidente en ejercicio',
      'DC GA TX OH NY');

  // ═════════════════════════════════════════════════════════════════════
  // 🎬 MOVIE FILMING DESTINATIONS
  // ═════════════════════════════════════════════════════════════════════
  add('pc_top_filming_location', 'Top 10 film/TV production state',       'Top 10 États de tournage',      'Top 10 estados de rodaje',
      'CA NY GA NM LA IL MA WA OK AZ');
  add('pc_subbed_for_other',     'Often substituted for other states/countries on film','Souvent doublé pour ailleurs','Substituto frecuente en cine',
      'GA NM NC LA AZ');

  // ═════════════════════════════════════════════════════════════════════
  // 🎮 GAMING / NERDY CULTURE
  // ═════════════════════════════════════════════════════════════════════
  add('pc_game_dev_hub',         'Major video game development hub',      'Pôle de jeu vidéo majeur',      'Centro mayor de videojuegos',
      'CA WA TX MA NY GA NC');
  add('pc_esports_top',          'Top esports tournament host city',      'Hôte de tournois esports',      'Anfitrión de torneos esports',
      'CA TX NV NY GA WA');

  // ═════════════════════════════════════════════════════════════════════
  // 🌌 SCIENCE / RESEARCH
  // ═════════════════════════════════════════════════════════════════════
  add('pc_national_lab',         'Major US national research laboratory', 'Laboratoire national majeur',   'Laboratorio nacional mayor',
      'CA NM TN IL ID WA NY TX');
  add('pc_observatory_major',    'World-class astronomical observatory',  'Observatoire astronomique majeur','Observatorio astronómico mayor',
      'HI CA AZ NM TX WV CO');
  add('pc_dinosaur_fossils',     'Famous dinosaur fossil discoveries',    'Découvertes de fossiles de dinosaures','Descubrimientos de dinosaurios',
      'MT WY CO UT SD ND TX NM AZ');

  // ═════════════════════════════════════════════════════════════════════
  // 🐎 RIVALRY / NICKNAME PAIR
  // ═════════════════════════════════════════════════════════════════════
  add('pc_pair_with_neighbor',   'In an "X vs Y" historical rivalry (TX/OK, KS/MO, OH/MI, AL/AU)','Rivalité historique entre voisins','Rivalidad histórica entre vecinos',
      'TX OK KS MO OH MI AL AU NC SC FL GA');

  // ═════════════════════════════════════════════════════════════════════
  // 🌶️ SPICE / HEAT
  // ═════════════════════════════════════════════════════════════════════
  add('pc_hot_sauce_origin',     'Famous hot sauce origin',               'Origine de sauce piquante',     'Origen de salsa picante',
      'LA TX NM CA');

  // ═════════════════════════════════════════════════════════════════════
  // 🧪 PROHIBITION / SPEAKEASIES (historical fun)
  // ═════════════════════════════════════════════════════════════════════
  add('pc_prohibition_speakeasy','Famous speakeasy / Prohibition history','Histoire de speakeasies',       'Historia de speakeasies',
      'NY IL MA NJ MI OH KY MO');

  // ═════════════════════════════════════════════════════════════════════
  // 💀 TRAGEDY / NATIONAL MEMORY
  // ═════════════════════════════════════════════════════════════════════
  add('pc_civil_rights_march',   'Site of a major Civil Rights march',    'Site d\'une grande marche pour les droits civiques','Sitio de marcha por derechos civiles',
      'AL TN GA DC NC MS AR');

  // ═════════════════════════════════════════════════════════════════════
  // 🚓 LAW ENFORCEMENT / FBI
  // ═════════════════════════════════════════════════════════════════════
  add('pc_state_trooper_iconic', 'Iconic state trooper / highway patrol', 'Police d\'État emblématique',   'Patrulla estatal icónica',
      'TX CA AZ NY NJ FL OK IL');

  // ═════════════════════════════════════════════════════════════════════
  // 🌽 ETHNIC / IMMIGRANT HERITAGE
  // ═════════════════════════════════════════════════════════════════════
  add('pc_irish_immigrant_heritage','Strong Irish-American heritage',     'Forte présence irlando-américaine','Fuerte herencia irlandesa-americana',
      'MA NY IL PA NJ CT MI OH');
  add('pc_italian_immigrant_heritage','Strong Italian-American heritage', 'Forte présence italo-américaine','Fuerte herencia italiana-americana',
      'NY NJ MA PA CT CA IL RI');
  add('pc_german_immigrant_heritage','Strong German-American heritage',   'Forte présence germano-américaine','Fuerte herencia alemana-americana',
      'PA OH WI IN IL IA MN MO MI ND SD NE TX');
  add('pc_scandinavian_heritage','Strong Scandinavian heritage',          'Forte présence scandinave',     'Fuerte herencia escandinava',
      'MN WI IA ND SD WA OR');
  add('pc_polish_heritage',      'Strong Polish-American heritage',       'Forte présence polonaise',      'Fuerte herencia polaca',
      'IL MI NY MA NJ PA OH WI');

  // ═════════════════════════════════════════════════════════════════════
  // 🎙️ COMEDY CLUBS
  // ═════════════════════════════════════════════════════════════════════
  add('pc_iconic_comedy_club',   'Iconic comedy club city',               'Club de comédie emblématique',  'Club de comedia icónico',
      'NY CA IL MA TX TN FL CO');

  // ═════════════════════════════════════════════════════════════════════
  // 🎨 ARTS / MUSEUMS
  // ═════════════════════════════════════════════════════════════════════
  add('pc_top10_art_museum',     'Has a top-10 US art museum',            'Top 10 musées d\'art US',       'Top 10 museos de arte US',
      'NY MA DC CA IL PA TX OH MO MD MI MN');

  // ═════════════════════════════════════════════════════════════════════
  // 📺 NICKELODEON / DISNEY KIDS TV
  // ═════════════════════════════════════════════════════════════════════
  add('pc_kids_tv_setting',      'Setting of a Nickelodeon/Disney kids show','Décor d\'une série jeunesse','Escenario de serie infantil',
      'CA TN HI NY FL');

  // ═════════════════════════════════════════════════════════════════════
  // 📼 MTV / VH1
  // ═════════════════════════════════════════════════════════════════════
  add('pc_mtv_jersey_shore',     'Setting of MTV reality (Jersey Shore, Real World)','Décor de téléréalité MTV','Escenario de reality MTV',
      'NJ NY CA HI NV FL');

  // ═════════════════════════════════════════════════════════════════════
  // 🎯 SUMMER CAMP CULTURE
  // ═════════════════════════════════════════════════════════════════════
  add('pc_iconic_summer_camp',   'Iconic American summer camp culture',   'Culture des colos de l\'été',   'Cultura de campamentos de verano',
      'ME NH VT MA NY PA WI MN MI NC');

  // ═════════════════════════════════════════════════════════════════════
  // 🎢 FAIRGROUND RIDES
  // ═════════════════════════════════════════════════════════════════════
  add('pc_americana_county_fair','Famous county fair tradition',          'Tradition de foires de comté',  'Tradición de ferias condado',
      'IA OH IL IN WI MN PA NY MD TX');

  // ═════════════════════════════════════════════════════════════════════
  // ⛪ MEGACHURCH
  // ═════════════════════════════════════════════════════════════════════
  add('pc_megachurch_top',       'Has 5+ "megachurches" (2000+ attendees)','5+ "megachurches"',            '5+ megaiglesias',
      'TX CA GA FL IL OH NC TN AZ CO');

  // ═════════════════════════════════════════════════════════════════════
  // 🐎 RACETRACK / HORSE
  // ═════════════════════════════════════════════════════════════════════
  add('pc_horse_racing_industry','Major horse racing state',              'Pôle des courses hippiques',    'Estado hípico mayor',
      'KY CA NY FL MD AR LA');

  // ═════════════════════════════════════════════════════════════════════
  // 📡 RADIO / PODCAST HUB
  // ═════════════════════════════════════════════════════════════════════
  add('pc_podcast_hq',           'Major podcast network / studio HQ',     'Siège réseau de podcasts',      'Sede red de podcasts',
      'CA NY MA TX GA CO IL');

  // ═════════════════════════════════════════════════════════════════════
  // 🎺 MUSIC CITY NICKNAMES
  // ═════════════════════════════════════════════════════════════════════
  add('pc_music_capital_nickname','Self-styled music capital city',       'Capitale musicale auto-proclamée','Capital musical autoproclamada',
      'TN TX LA GA NY CA WA');

  // ═════════════════════════════════════════════════════════════════════
  // 🏆 OSCAR / EMMY filming
  // ═════════════════════════════════════════════════════════════════════
  add('pc_emmy_oscar_show_filmed','Hosts major awards show (Oscar/Emmy/Grammy/Tony)','Hôte de cérémonies majeures','Anfitrión de premios mayores',
      'CA NY NV TN');

  // ═════════════════════════════════════════════════════════════════════
  // 🎺 JAZZ FESTIVAL
  // ═════════════════════════════════════════════════════════════════════
  add('pc_top_jazz_festival',    'Major annual jazz festival',            'Festival de jazz majeur',       'Festival de jazz mayor',
      'LA RI CA NY IL WA');

  // ═════════════════════════════════════════════════════════════════════
  // 🍔 ICONIC LOCAL DISH
  // ═════════════════════════════════════════════════════════════════════
  add('pc_chili_culture',        'Strong chili-cookoff culture',          'Culture du chili / concours',   'Cultura del chili',
      'TX OH NM OK KS IL WV');
  add('pc_donut_capital',        '"Donut capital" claim',                 'Capitale du donut',             'Capital del donut',
      'MA RI MI WI ND OR');

  return list;
})();

if (typeof window !== 'undefined') {
  window.PENDING_CONSTRAINTS = PENDING_CONSTRAINTS;
  window.PENDING_MAP = Object.fromEntries(PENDING_CONSTRAINTS.map(c => [c.id, c]));
}
