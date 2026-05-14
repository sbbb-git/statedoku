// ─────────────────────────────────────────────────────────────────────────
// Statedoku — Pending constraint candidates (admin review)
//
// 200 creative candidates: pop culture, cinema, TV, music, sports, history,
// landmarks, brands, food. Each has a verified state list (no fragile
// predicates). Admin approves/rejects via /admin/constraints/.
//
// Storage:
//   statedoku_approved_pending = JSON array of approved IDs
//   statedoku_rejected_pending = JSON array of rejected IDs
// ─────────────────────────────────────────────────────────────────────────

const PENDING_CONSTRAINTS = (() => {
  const list = [];

  // Helper: build a predicate from a string of state IDs
  const inS = (str) => {
    const set = new Set(str.split(/\s+/).filter(Boolean));
    return (s) => set.has(s.id);
  };

  const add = (id, en, fr, es, statesStr) => {
    list.push({ id, en, fr, es, match: inS(statesStr), _states: statesStr });
  };

  // ═════════════════════════════════════════════════════════════════════
  // 🎬 CINEMA — Setting of an iconic movie
  // ═════════════════════════════════════════════════════════════════════
  add('pc_movie_godfather',       'Setting of The Godfather',                'Décor du Parrain',                       'Escenario de El Padrino',                'NY NV');
  add('pc_movie_pulp_fiction',    'Setting of Pulp Fiction',                 'Décor de Pulp Fiction',                  'Escenario de Pulp Fiction',              'CA');
  add('pc_movie_forrest_gump',    'Filming locations of Forrest Gump',       'Tournage de Forrest Gump',               'Filmación de Forrest Gump',              'AL SC NC VA MA UT');
  add('pc_movie_field_of_dreams', 'Field of Dreams setting',                 'Décor de Jusqu\'au bout du rêve',        'Escenario de Field of Dreams',           'IA');
  add('pc_movie_fargo',           'Fargo (movie) setting',                   'Décor de Fargo',                         'Escenario de Fargo',                     'MN ND');
  add('pc_movie_no_country',      'No Country for Old Men setting',          'Décor de No Country for Old Men',        'Escenario de No Country for Old Men',    'TX NM');
  add('pc_movie_jaws',            'Jaws setting (Amity Island)',             'Décor des Dents de la mer',              'Escenario de Tiburón',                   'MA');
  add('pc_movie_shawshank',       'Shawshank Redemption (Maine)',            'Décor des Évadés (Maine)',               'Escenario de Cadena perpetua',           'ME');
  add('pc_movie_shining',         'The Shining (Colorado)',                  'Décor de Shining',                       'Escenario de El Resplandor',             'CO');
  add('pc_movie_gone_with_wind',  'Gone with the Wind setting',              'Décor d\'Autant en emporte le vent',     'Escenario de Lo que el viento se llevó', 'GA');
  add('pc_movie_wizard_oz',       'Wizard of Oz (Kansas)',                   'Décor du Magicien d\'Oz',                'Escenario de El Mago de Oz',             'KS');
  add('pc_movie_thelma_louise',   'Thelma & Louise road trip',               'Road trip de Thelma & Louise',           'Road trip de Thelma & Louise',           'AR OK NM AZ UT');
  add('pc_movie_easy_rider',      'Easy Rider road trip',                    'Road trip d\'Easy Rider',                'Road trip de Easy Rider',                'CA AZ NM TX LA');
  add('pc_movie_brokeback',       'Brokeback Mountain setting',              'Décor de Brokeback Mountain',            'Escenario de Brokeback Mountain',        'WY TX');
  add('pc_movie_titanic',         'Titanic departure US states (none, UK)',  'Aucune (départ UK)',                     'Ninguno (zarpa UK)',                     '');
  add('pc_movie_top_gun',         'Top Gun (San Diego)',                     'Décor de Top Gun',                       'Escenario de Top Gun',                   'CA');
  add('pc_movie_indiana_jones',   'Indiana Jones US scenes',                 'Scènes US d\'Indiana Jones',             'Escenas US de Indiana Jones',            'NV CT UT');
  add('pc_movie_back_to_future',  'Back to the Future setting (Hill Valley)','Décor de Retour vers le futur',          'Escenario de Volver al Futuro',          'CA');
  add('pc_movie_goonies',         'The Goonies setting',                     'Décor des Goonies',                      'Escenario de Los Goonies',               'OR');
  add('pc_movie_stand_by_me',     'Stand By Me setting',                     'Décor de Stand By Me',                   'Escenario de Cuenta conmigo',            'OR');
  add('pc_movie_get_out',         'Get Out setting',                         'Décor de Get Out',                       'Escenario de Get Out',                   'NY AL');

  // ═════════════════════════════════════════════════════════════════════
  // 📺 TV — Setting of a famous show
  // ═════════════════════════════════════════════════════════════════════
  add('pc_tv_breaking_bad',       'Breaking Bad setting',                    'Décor de Breaking Bad',                  'Escenario de Breaking Bad',              'NM');
  add('pc_tv_stranger_things',    'Stranger Things setting',                 'Décor de Stranger Things',               'Escenario de Stranger Things',           'IN');
  add('pc_tv_the_office',         'The Office (US) setting',                 'Décor de The Office US',                 'Escenario de The Office US',             'PA');
  add('pc_tv_friends',            'Friends setting',                         'Décor de Friends',                       'Escenario de Friends',                   'NY');
  add('pc_tv_simpsons_springfld', 'The Simpsons (Springfield — every state)','Springfield des Simpsons (chaque État)', 'Springfield (cada estado)',              'IL OR MA MO KY');
  add('pc_tv_sopranos',           'The Sopranos setting',                    'Décor des Soprano',                      'Escenario de Los Soprano',               'NJ');
  add('pc_tv_yellowstone',        'Yellowstone TV setting',                  'Décor de la série Yellowstone',          'Escenario de Yellowstone',               'MT');
  add('pc_tv_walking_dead',       'The Walking Dead setting',                'Décor de Walking Dead',                  'Escenario de Walking Dead',              'GA');
  add('pc_tv_better_call_saul',   'Better Call Saul setting',                'Décor de Better Call Saul',              'Escenario de Better Call Saul',          'NM');
  add('pc_tv_friday_night_lights','Friday Night Lights setting',             'Décor de Friday Night Lights',           'Escenario de Friday Night Lights',       'TX');
  add('pc_tv_true_blood',         'True Blood setting',                      'Décor de True Blood',                    'Escenario de True Blood',                'LA');
  add('pc_tv_true_detective_s1',  'True Detective season 1',                 'True Detective saison 1',                'True Detective temporada 1',             'LA');
  add('pc_tv_twin_peaks',         'Twin Peaks setting',                      'Décor de Twin Peaks',                    'Escenario de Twin Peaks',                'WA');
  add('pc_tv_cheers',             'Cheers setting',                          'Décor de Cheers',                        'Escenario de Cheers',                    'MA');
  add('pc_tv_frasier',            'Frasier setting',                         'Décor de Frasier',                       'Escenario de Frasier',                   'WA');
  add('pc_tv_seinfeld',           'Seinfeld setting',                        'Décor de Seinfeld',                      'Escenario de Seinfeld',                  'NY');
  add('pc_tv_mad_men',            'Mad Men setting',                         'Décor de Mad Men',                       'Escenario de Mad Men',                   'NY');
  add('pc_tv_arrested_dev',       'Arrested Development setting',            'Décor d\'Arrested Development',          'Escenario de Arrested Development',      'CA');
  add('pc_tv_atlanta',            'Atlanta (Donald Glover) setting',         'Décor d\'Atlanta',                       'Escenario de Atlanta',                   'GA');
  add('pc_tv_justified',          'Justified setting',                       'Décor de Justified',                     'Escenario de Justified',                 'KY');
  add('pc_tv_ozark',              'Ozark setting',                           'Décor d\'Ozark',                         'Escenario de Ozark',                     'MO');
  add('pc_tv_the_wire',           'The Wire setting',                        'Décor de The Wire',                      'Escenario de The Wire',                  'MD');
  add('pc_tv_succession',         'Succession setting (mainly NY)',          'Décor de Succession',                    'Escenario de Succession',                'NY');
  add('pc_tv_yellowjackets',      'Yellowjackets setting',                   'Décor de Yellowjackets',                 'Escenario de Yellowjackets',             'NJ');
  add('pc_tv_paper_towns_jp',     'John Hughes "brat pack" Chicago vibes',   'Films Brat Pack à Chicago',              'Brat Pack de Chicago',                   'IL');
  add('pc_tv_dexter',             'Dexter setting (Miami)',                  'Décor de Dexter',                        'Escenario de Dexter',                    'FL');
  add('pc_tv_csi_miami',          'CSI: Miami setting',                      'Décor de Les Experts: Miami',            'Escenario de CSI: Miami',                'FL');
  add('pc_tv_csi_vegas',          'CSI: Vegas setting',                      'Décor de Les Experts: Vegas',            'Escenario de CSI: Vegas',                'NV');
  add('pc_tv_house_of_cards',     'House of Cards (DC suburbs)',             'House of Cards (banlieue DC)',           'House of Cards (suburbios DC)',          'MD VA');

  // ═════════════════════════════════════════════════════════════════════
  // 🎤 CELEBRITY BIRTHPLACES
  // ═════════════════════════════════════════════════════════════════════
  add('pc_born_taylor_swift',     'Birth state of Taylor Swift',             'État de naissance de Taylor Swift',      'Estado natal de Taylor Swift',           'PA');
  add('pc_born_michael_jackson',  'Birth state of Michael Jackson',          'État de naissance de Michael Jackson',   'Estado natal de Michael Jackson',        'IN');
  add('pc_born_madonna',          'Birth state of Madonna',                  'État de naissance de Madonna',           'Estado natal de Madonna',                'MI');
  add('pc_born_beyonce',          'Birth state of Beyoncé',                  'État de naissance de Beyoncé',           'Estado natal de Beyoncé',                'TX');
  add('pc_born_elvis',            'Birth state of Elvis Presley',            'État de naissance d\'Elvis',             'Estado natal de Elvis',                  'MS');
  add('pc_born_lady_gaga',        'Birth state of Lady Gaga',                'État de naissance de Lady Gaga',         'Estado natal de Lady Gaga',              'NY');
  add('pc_born_bruce_spring',     'Birth state of Bruce Springsteen',        'État natal de Bruce Springsteen',        'Estado natal de Bruce Springsteen',      'NJ');
  add('pc_born_bob_dylan',        'Birth state of Bob Dylan',                'État natal de Bob Dylan',                'Estado natal de Bob Dylan',              'MN');
  add('pc_born_prince',           'Birth state of Prince',                   'État natal de Prince',                   'Estado natal de Prince',                 'MN');
  add('pc_born_kanye',            'Birth state of Kanye West',               'État natal de Kanye West',               'Estado natal de Kanye West',             'GA');
  add('pc_born_jayz',             'Birth state of Jay-Z',                    'État natal de Jay-Z',                    'Estado natal de Jay-Z',                  'NY');
  add('pc_born_britney',          'Birth state of Britney Spears',           'État natal de Britney Spears',           'Estado natal de Britney Spears',         'MS');
  add('pc_born_dolly_parton',     'Birth state of Dolly Parton',             'État natal de Dolly Parton',             'Estado natal de Dolly Parton',           'TN');
  add('pc_born_johnny_cash',      'Birth state of Johnny Cash',              'État natal de Johnny Cash',              'Estado natal de Johnny Cash',            'AR');
  add('pc_born_marilyn_monroe',   'Birth state of Marilyn Monroe',           'État natal de Marilyn Monroe',           'Estado natal de Marilyn Monroe',         'CA');
  add('pc_born_brad_pitt',        'Birth state of Brad Pitt',                'État natal de Brad Pitt',                'Estado natal de Brad Pitt',              'OK');
  add('pc_born_george_clooney',   'Birth state of George Clooney',           'État natal de George Clooney',           'Estado natal de George Clooney',         'KY');
  add('pc_born_steve_jobs',       'Birth state of Steve Jobs',               'État natal de Steve Jobs',               'Estado natal de Steve Jobs',             'CA');
  add('pc_born_elon_musk_us',     'Adopted state of Elon Musk',              'État d\'adoption d\'Elon Musk',          'Estado adoptivo de Elon Musk',           'TX');
  add('pc_born_oprah',            'Birth state of Oprah Winfrey',            'État natal d\'Oprah Winfrey',            'Estado natal de Oprah',                  'MS');
  add('pc_born_jordan',           'Birth state of Michael Jordan',           'État natal de Michael Jordan',           'Estado natal de Michael Jordan',         'NY');
  add('pc_raised_jordan',         'State Jordan grew up in',                 'État où Jordan a grandi',                'Estado donde creció Jordan',             'NC');
  add('pc_born_lebron',           'Birth state of LeBron James',             'État natal de LeBron James',             'Estado natal de LeBron',                 'OH');
  add('pc_born_brady',            'Birth state of Tom Brady',                'État natal de Tom Brady',                'Estado natal de Tom Brady',              'CA');
  add('pc_born_kobe',             'Birth state of Kobe Bryant',              'État natal de Kobe Bryant',              'Estado natal de Kobe',                   'PA');
  add('pc_born_serena',           'Birth state of Serena Williams',          'État natal de Serena Williams',          'Estado natal de Serena Williams',        'MI');
  add('pc_born_tiger_woods',      'Birth state of Tiger Woods',              'État natal de Tiger Woods',              'Estado natal de Tiger Woods',            'CA');

  // ═════════════════════════════════════════════════════════════════════
  // 🎵 MUSIC ORIGINS & SCENES
  // ═════════════════════════════════════════════════════════════════════
  add('pc_music_country_origin',  'Country music heritage',                  'Berceau de la country music',            'Cuna de la música country',              'TN KY VA NC GA TX');
  add('pc_music_jazz_origin',     'Jazz birthplace',                         'Berceau du jazz',                        'Cuna del jazz',                          'LA');
  add('pc_music_blues_origin',    'Delta blues birthplace',                  'Berceau du blues du Delta',              'Cuna del blues del Delta',               'MS TN');
  add('pc_music_hiphop_origin',   'Hip-hop birthplace (Bronx)',              'Berceau du hip-hop',                     'Cuna del hip-hop',                       'NY');
  add('pc_music_motown',          'Motown sound home',                       'Berceau du son Motown',                  'Hogar del Motown',                       'MI');
  add('pc_music_grunge',          'Grunge birthplace',                       'Berceau du grunge',                      'Cuna del grunge',                        'WA');
  add('pc_music_west_coast_rap',  'West Coast hip-hop scene',                'Scène hip-hop West Coast',               'Escena hip-hop West Coast',              'CA');
  add('pc_music_atl_hiphop',      'Atlanta trap/hip-hop scene',              'Scène hip-hop d\'Atlanta',               'Escena hip-hop de Atlanta',              'GA');
  add('pc_music_punk_origin',     'US punk scenes (NY, LA, DC)',             'Scènes punk US',                         'Escenas punk US',                        'NY CA');
  add('pc_music_zydeco',          'Zydeco / Cajun music home',               'Berceau du zydeco / cajun',              'Cuna del zydeco / cajun',                'LA');
  add('pc_music_bluegrass',       'Bluegrass birthplace',                    'Berceau du bluegrass',                   'Cuna del bluegrass',                     'KY');
  add('pc_music_emo_midwest',     'Midwest emo scene',                       'Scène emo Midwest',                      'Escena emo Medio Oeste',                 'IL OH IN');
  add('pc_music_chicago_blues',   'Chicago blues',                           'Blues de Chicago',                       'Blues de Chicago',                       'IL');
  add('pc_music_outlaw_country',  'Outlaw country (Texas / Tennessee)',      'Outlaw country',                         'Outlaw country',                         'TX TN');
  add('pc_music_surf_rock',       'Surf rock origin',                        'Berceau du surf rock',                   'Cuna del surf rock',                     'CA');

  // ═════════════════════════════════════════════════════════════════════
  // 🎵 SONG TITLES (state appears in famous song)
  // ═════════════════════════════════════════════════════════════════════
  add('pc_song_sweet_home_alabama','Subject of "Sweet Home Alabama"',        '"Sweet Home Alabama"',                   '«Sweet Home Alabama»',                   'AL');
  add('pc_song_california_dreamin','"California Dreamin\'" subject',         '"California Dreamin\'"',                 '«California Dreamin\'»',                 'CA');
  add('pc_song_georgia_on_my_mind','"Georgia on My Mind"',                   '"Georgia on My Mind"',                   '«Georgia on My Mind»',                   'GA');
  add('pc_song_empire_state',     '"Empire State of Mind"',                  '"Empire State of Mind"',                 '«Empire State of Mind»',                 'NY');
  add('pc_song_tennessee_whiskey','"Tennessee Whiskey"',                     '"Tennessee Whiskey"',                    '«Tennessee Whiskey»',                    'TN');
  add('pc_song_oklahoma_musical', '"Oklahoma!" the musical',                 'La comédie musicale "Oklahoma!"',        'El musical «Oklahoma!»',                 'OK');
  add('pc_song_kentucky_woman',   '"Kentucky Woman" / "My Old Kentucky Home"','"Kentucky Woman"',                      '«Kentucky Woman»',                       'KY');
  add('pc_song_carolina_in_mind', '"Carolina in My Mind"',                   '"Carolina in My Mind"',                  '«Carolina in My Mind»',                  'NC SC');
  add('pc_song_take_me_home_wv',  '"Take Me Home, Country Roads" (WV)',      '"Take Me Home, Country Roads"',          '«Take Me Home, Country Roads»',          'WV');
  add('pc_song_mississippi_queen','"Mississippi Queen"',                     '"Mississippi Queen"',                    '«Mississippi Queen»',                    'MS');
  add('pc_song_kansas_city',      '"Kansas City"',                           '"Kansas City"',                          '«Kansas City»',                          'KS MO');
  add('pc_song_arkansas_traveler','"Arkansas Traveler"',                     '"Arkansas Traveler"',                    '«Arkansas Traveler»',                    'AR');
  add('pc_song_indiana_morning', 'In a famous song title',                   'Dans un titre célèbre',                  'En título famoso',                       'IN');

  // ═════════════════════════════════════════════════════════════════════
  // 🏛️ HISTORICAL EVENTS
  // ═════════════════════════════════════════════════════════════════════
  add('pc_hist_civil_war_started','Civil War started here (Fort Sumter)',    'Début de la Guerre de Sécession',        'Inicio de la Guerra Civil',              'SC');
  add('pc_hist_boston_tea_party', 'Boston Tea Party',                        'Boston Tea Party',                       'Motín del Té',                           'MA');
  add('pc_hist_pearl_harbor',     'Pearl Harbor attack',                     'Attaque de Pearl Harbor',                'Ataque a Pearl Harbor',                  'HI');
  add('pc_hist_911_attacks',      '9/11 attack sites',                       'Sites des attentats du 11 septembre',    'Sitios del 11-S',                        'NY PA');
  add('pc_hist_jfk_assassinated', 'JFK assassinated here',                   'Assassinat de JFK',                      'Asesinato de JFK',                       'TX');
  add('pc_hist_mlk_assassinated', 'MLK assassinated here',                   'Assassinat de MLK',                      'Asesinato de MLK',                       'TN');
  add('pc_hist_lincoln_assass',   'Lincoln assassinated here',               'Assassinat de Lincoln',                  'Asesinato de Lincoln',                   'DC');
  add('pc_hist_first_flight',     'Wright Brothers first flight',            'Premier vol des frères Wright',          'Primer vuelo de los Wright',             'NC');
  add('pc_hist_gold_rush',        'Gold Rush of 1849',                       'Ruée vers l\'or de 1849',                'Fiebre del oro de 1849',                 'CA');
  add('pc_hist_manhattan_project','Manhattan Project (Los Alamos)',          'Projet Manhattan',                       'Proyecto Manhattan',                     'NM');
  add('pc_hist_roswell_ufo',      'Roswell UFO incident',                    'Incident de Roswell',                    'Incidente de Roswell',                   'NM');
  add('pc_hist_salem_witches',    'Salem witch trials',                      'Procès des sorcières de Salem',          'Juicios de Salem',                       'MA');
  add('pc_hist_alamo',            'Battle of the Alamo',                     'Bataille d\'Alamo',                      'Batalla de El Álamo',                    'TX');
  add('pc_hist_oregon_trail_end', 'End of Oregon Trail',                     'Fin de la piste de l\'Oregon',           'Fin del Oregon Trail',                   'OR');
  add('pc_hist_lewis_clark_start','Lewis & Clark expedition start',          'Départ de Lewis et Clark',               'Inicio de Lewis y Clark',                'MO');
  add('pc_hist_selma_march',      'Selma to Montgomery march',               'Marches de Selma',                       'Marchas de Selma',                       'AL');
  add('pc_hist_freedom_summer',   'Mississippi Freedom Summer 1964',         '"Freedom Summer" du Mississippi',        'Freedom Summer de Misisipi',             'MS');
  add('pc_hist_little_rock_9',    'Little Rock Nine',                        'Les neuf de Little Rock',                'Los Nueve de Little Rock',               'AR');
  add('pc_hist_stonewall',        'Stonewall riots',                         'Émeutes de Stonewall',                   'Disturbios de Stonewall',                'NY');
  add('pc_hist_woodstock',        'Woodstock 1969',                          'Woodstock 1969',                         'Woodstock 1969',                         'NY');
  add('pc_hist_kent_state',       'Kent State shootings 1970',               'Fusillade de Kent State',                'Tiroteo de Kent State',                  'OH');
  add('pc_hist_three_mile_isl',   'Three Mile Island accident',              'Accident de Three Mile Island',          'Accidente de Three Mile Island',         'PA');
  add('pc_hist_mt_st_helens',     'Mount St. Helens eruption 1980',          'Éruption du Mont Saint Helens',          'Erupción del Monte Santa Helena',        'WA');
  add('pc_hist_katrina',          'Hurricane Katrina (2005)',                'Ouragan Katrina',                        'Huracán Katrina',                        'LA MS');
  add('pc_hist_columbine',        'Columbine shooting',                      'Tuerie de Columbine',                    'Masacre de Columbine',                   'CO');
  add('pc_hist_okc_bombing',      'Oklahoma City bombing 1995',              'Attentat d\'Oklahoma City',              'Atentado de Oklahoma City',              'OK');

  // ═════════════════════════════════════════════════════════════════════
  // 🇺🇸 PRESIDENTS
  // ═════════════════════════════════════════════════════════════════════
  add('pc_pres_birthplace_4plus','Birthplace of 4+ presidents',              'État natal de 4+ présidents',            'Estado natal de 4+ presidentes',         'VA OH NY MA');
  add('pc_pres_born_lincoln',     'Birthplace of Lincoln',                   'Naissance de Lincoln',                   'Cuna de Lincoln',                        'KY');
  add('pc_pres_born_jfk',         'Birthplace of JFK',                       'Naissance de JFK',                       'Cuna de JFK',                            'MA');
  add('pc_pres_born_obama',       'Birthplace of Obama',                     'Naissance d\'Obama',                     'Cuna de Obama',                          'HI');
  add('pc_pres_born_trump',       'Birthplace of Trump',                     'Naissance de Trump',                     'Cuna de Trump',                          'NY');
  add('pc_pres_born_biden',       'Birthplace of Biden',                     'Naissance de Biden',                     'Cuna de Biden',                          'PA');
  add('pc_pres_born_reagan',      'Birthplace of Reagan',                    'Naissance de Reagan',                    'Cuna de Reagan',                         'IL');
  add('pc_pres_born_clinton',     'Birthplace of Bill Clinton',              'Naissance de Bill Clinton',              'Cuna de Bill Clinton',                   'AR');
  add('pc_pres_born_carter',      'Birthplace of Jimmy Carter',              'Naissance de Carter',                    'Cuna de Carter',                         'GA');
  add('pc_pres_born_bush_h',      'Birthplace of George H.W. Bush',          'Naissance de Bush père',                 'Cuna de Bush padre',                     'MA');
  add('pc_pres_born_bush_w',      'Birthplace of George W. Bush',            'Naissance de Bush fils',                 'Cuna de Bush hijo',                      'CT');
  add('pc_pres_born_washington',  'Birthplace of George Washington',         'Naissance de George Washington',         'Cuna de George Washington',              'VA');

  // ═════════════════════════════════════════════════════════════════════
  // 🏆 SPORTS — Major events
  // ═════════════════════════════════════════════════════════════════════
  add('pc_sport_olympics_summer', 'Hosted Summer Olympics',                  'A organisé les JO d\'été',               'Organizó JJOO de Verano',                'CA GA MO');
  add('pc_sport_olympics_winter', 'Hosted Winter Olympics',                  'A organisé les JO d\'hiver',             'Organizó JJOO de Invierno',              'CA NY UT');
  add('pc_sport_super_bowl_5plus','Has hosted Super Bowl 5+ times',          'A organisé 5+ Super Bowls',              'Organizó 5+ Super Bowls',                'FL CA LA TX');
  add('pc_sport_indy_500',        'Indy 500',                                'Indy 500',                               'Indy 500',                               'IN');
  add('pc_sport_kentucky_derby',  'Kentucky Derby',                          'Kentucky Derby',                         'Derby de Kentucky',                      'KY');
  add('pc_sport_masters_golf',    'The Masters golf tournament',             'Le Masters de golf',                     'El Masters de golf',                     'GA');
  add('pc_sport_iditarod',        'Iditarod sled dog race',                  'L\'Iditarod',                            'El Iditarod',                            'AK');
  add('pc_sport_rose_bowl',       'Rose Bowl game',                          'Rose Bowl',                              'Rose Bowl',                              'CA');
  add('pc_sport_daytona_500',     'Daytona 500',                             'Daytona 500',                            'Daytona 500',                            'FL');

  // ═════════════════════════════════════════════════════════════════════
  // 🏢 BRANDS / COMPANIES HQ
  // ═════════════════════════════════════════════════════════════════════
  add('pc_brand_walmart',         'Walmart HQ (Bentonville)',                'Siège de Walmart',                       'Sede de Walmart',                        'AR');
  add('pc_brand_amazon',          'Amazon HQ',                               'Siège d\'Amazon',                        'Sede de Amazon',                         'WA');
  add('pc_brand_microsoft',       'Microsoft HQ',                            'Siège de Microsoft',                     'Sede de Microsoft',                      'WA');
  add('pc_brand_apple',           'Apple HQ',                                'Siège d\'Apple',                         'Sede de Apple',                          'CA');
  add('pc_brand_google',          'Google HQ',                               'Siège de Google',                        'Sede de Google',                         'CA');
  add('pc_brand_meta',            'Meta HQ',                                 'Siège de Meta',                          'Sede de Meta',                           'CA');
  add('pc_brand_tesla',           'Tesla HQ (Austin)',                       'Siège de Tesla',                         'Sede de Tesla',                          'TX');
  add('pc_brand_coca_cola',       'Coca-Cola HQ (Atlanta)',                  'Siège de Coca-Cola',                     'Sede de Coca-Cola',                      'GA');
  add('pc_brand_mcdonalds',       'McDonald\'s HQ (Chicago)',                'Siège de McDonald\'s',                   'Sede de McDonald\'s',                    'IL');
  add('pc_brand_boeing',          'Boeing HQ (Arlington/Chicago)',           'Siège de Boeing',                        'Sede de Boeing',                         'VA');
  add('pc_brand_disney',          'Walt Disney HQ (Burbank)',                'Siège Disney',                           'Sede Disney',                            'CA');
  add('pc_brand_ford',            'Ford HQ',                                 'Siège de Ford',                          'Sede de Ford',                           'MI');
  add('pc_brand_gm',              'GM HQ',                                   'Siège de GM',                            'Sede de GM',                             'MI');
  add('pc_brand_berkshire',       'Berkshire Hathaway HQ (Omaha)',           'Siège de Berkshire Hathaway',            'Sede de Berkshire Hathaway',             'NE');
  add('pc_brand_tyson',           'Tyson Foods HQ',                          'Siège de Tyson Foods',                   'Sede de Tyson',                          'AR');
  add('pc_brand_exxon',           'ExxonMobil HQ',                           'Siège d\'ExxonMobil',                    'Sede de ExxonMobil',                     'TX');
  add('pc_brand_ibm',             'IBM HQ',                                  'Siège d\'IBM',                           'Sede de IBM',                            'NY');
  add('pc_brand_target',          'Target HQ',                               'Siège de Target',                        'Sede de Target',                         'MN');
  add('pc_brand_starbucks',       'Starbucks HQ',                            'Siège de Starbucks',                     'Sede de Starbucks',                      'WA');
  add('pc_brand_jpmorgan',        'JPMorgan Chase HQ',                       'Siège de JPMorgan',                      'Sede de JPMorgan',                       'NY');
  add('pc_brand_nike',            'Nike HQ',                                 'Siège de Nike',                          'Sede de Nike',                           'OR');
  add('pc_brand_intel',           'Intel HQ',                                'Siège d\'Intel',                         'Sede de Intel',                          'CA');
  add('pc_brand_kraft',           'Kraft Heinz HQ',                          'Siège de Kraft Heinz',                   'Sede de Kraft Heinz',                    'IL PA');
  add('pc_brand_pg',              'Procter & Gamble HQ',                     'Siège de P&G',                           'Sede de P&G',                            'OH');

  // ═════════════════════════════════════════════════════════════════════
  // 🍔 FOOD ORIGINS
  // ═════════════════════════════════════════════════════════════════════
  add('pc_food_philly_cheesesteak','Philly cheesesteak origin',              'Origine du cheesesteak Philly',          'Origen del cheesesteak',                 'PA');
  add('pc_food_buffalo_wings',    'Buffalo wings origin',                    'Origine des Buffalo wings',              'Origen de las alitas Buffalo',           'NY');
  add('pc_food_chicago_pizza',    'Deep dish pizza origin',                  'Origine de la pizza deep dish',          'Origen de la pizza deep dish',           'IL');
  add('pc_food_ny_pizza',         'NY-style pizza origin',                   'Origine de la pizza new-yorkaise',       'Origen de la pizza estilo NY',           'NY');
  add('pc_food_cajun',            'Cajun cuisine origin',                    'Origine de la cuisine cajun',            'Origen de la cocina cajún',              'LA');
  add('pc_food_tex_mex',          'Tex-Mex cuisine origin',                  'Origine du Tex-Mex',                     'Origen del Tex-Mex',                     'TX');
  add('pc_food_new_england_chow', 'Clam chowder origin',                     'Origine de la chaudrée de palourdes',    'Origen de la sopa de almejas',           'MA');
  add('pc_food_maine_lobster',    'Maine lobster',                           'Homard du Maine',                        'Langosta de Maine',                      'ME');
  add('pc_food_maryland_crab',    'Maryland blue crab',                      'Crabe bleu du Maryland',                 'Cangrejo azul de Maryland',              'MD');
  add('pc_food_kentucky_bourbon', 'Kentucky bourbon',                        'Bourbon du Kentucky',                    'Bourbon de Kentucky',                    'KY');
  add('pc_food_tn_whiskey',       'Tennessee whiskey',                       'Whiskey du Tennessee',                   'Whiskey de Tennessee',                   'TN');
  add('pc_food_napa_wine',        'Napa Valley wine country',                'Vignobles de la Napa Valley',            'Valle de Napa',                          'CA');
  add('pc_food_idaho_potato',     'Idaho potato',                            'Pomme de terre de l\'Idaho',             'Patata de Idaho',                        'ID');
  add('pc_food_vt_maple_syrup',   'Vermont maple syrup',                     'Sirop d\'érable du Vermont',             'Jarabe de arce de Vermont',              'VT');
  add('pc_food_georgia_peach',    'Georgia peach',                           'Pêche de Géorgie',                       'Melocotón de Georgia',                   'GA');
  add('pc_food_fl_orange',        'Florida orange',                          'Orange de Floride',                      'Naranja de Florida',                     'FL');
  add('pc_food_wi_cheese',        'Wisconsin cheese',                        'Fromage du Wisconsin',                   'Queso de Wisconsin',                     'WI');
  add('pc_food_bbq_capitals',     'BBQ capital (KC/Memphis/TX/NC)',          'Capitale du BBQ',                        'Capital del BBQ',                        'TX TN NC MO KS');
  add('pc_food_in_n_out',         'In-N-Out Burger present',                 'In-N-Out Burger présent',                'In-N-Out Burger',                        'CA NV AZ UT TX OR CO ID');
  add('pc_food_waffle_house',     'Waffle House heartland',                  'Pays de Waffle House',                   'Tierra de Waffle House',                 'GA AL SC TN FL NC');

  // ═════════════════════════════════════════════════════════════════════
  // 🏞️ LANDMARKS
  // ═════════════════════════════════════════════════════════════════════
  add('pc_lm_grand_canyon',       'Grand Canyon',                            'Grand Canyon',                           'Gran Cañón',                             'AZ');
  add('pc_lm_niagara',            'Niagara Falls (US side)',                 'Chutes du Niagara',                      'Cataratas del Niágara',                  'NY');
  add('pc_lm_rushmore',           'Mount Rushmore',                          'Mont Rushmore',                          'Monte Rushmore',                         'SD');
  add('pc_lm_yellowstone_park',   'Yellowstone National Park',               'Parc de Yellowstone',                    'Parque de Yellowstone',                  'WY MT ID');
  add('pc_lm_statue_liberty',     'Statue of Liberty',                       'Statue de la Liberté',                   'Estatua de la Libertad',                 'NY');
  add('pc_lm_golden_gate',        'Golden Gate Bridge',                      'Golden Gate Bridge',                     'Puente Golden Gate',                     'CA');
  add('pc_lm_space_needle',       'Space Needle',                            'Space Needle',                           'Space Needle',                           'WA');
  add('pc_lm_st_louis_arch',      'Gateway Arch (St. Louis)',                'Gateway Arch',                           'Arco Gateway',                           'MO');
  add('pc_lm_hoover_dam',         'Hoover Dam',                              'Barrage Hoover',                         'Presa Hoover',                           'NV AZ');
  add('pc_lm_vegas_strip',        'Las Vegas Strip',                         'Strip de Las Vegas',                     'Strip de Las Vegas',                     'NV');
  add('pc_lm_times_square',       'Times Square',                            'Times Square',                           'Times Square',                           'NY');
  add('pc_lm_bourbon_street',     'Bourbon Street',                          'Bourbon Street',                         'Bourbon Street',                         'LA');
  add('pc_lm_freedom_trail',      'Boston Freedom Trail',                    'Freedom Trail de Boston',                'Sendero de la Libertad',                 'MA');
  add('pc_lm_old_faithful',       'Old Faithful geyser',                     'Geyser Old Faithful',                    'Géiser Old Faithful',                    'WY');
  add('pc_lm_disneyland',         'Disneyland (Anaheim)',                    'Disneyland',                             'Disneyland',                             'CA');
  add('pc_lm_disney_world',       'Walt Disney World',                       'Walt Disney World',                      'Walt Disney World',                      'FL');
  add('pc_lm_alcatraz',           'Alcatraz Island',                         'Alcatraz',                               'Alcatraz',                               'CA');

  // ═════════════════════════════════════════════════════════════════════
  // 🎓 UNIVERSITIES
  // ═════════════════════════════════════════════════════════════════════
  add('pc_uni_ivy_league',        'Home to an Ivy League school',            'Université Ivy League',                  'Universidad Ivy League',                 'MA NY NJ CT PA NH RI');
  add('pc_uni_harvard',           'Home to Harvard',                         'Abrite Harvard',                         'Alberga Harvard',                        'MA');
  add('pc_uni_mit',               'Home to MIT',                             'Abrite le MIT',                          'Alberga MIT',                            'MA');
  add('pc_uni_stanford',          'Home to Stanford',                        'Abrite Stanford',                        'Alberga Stanford',                       'CA');
  add('pc_uni_yale',              'Home to Yale',                            'Abrite Yale',                            'Alberga Yale',                           'CT');
  add('pc_uni_princeton',         'Home to Princeton',                       'Abrite Princeton',                       'Alberga Princeton',                      'NJ');
  add('pc_uni_sec_football',      'Has an SEC football school',              'Université de la SEC',                   'Universidad de la SEC',                  'AL AR FL GA KY LA MS MO SC TN TX OK');
  add('pc_uni_big_ten',           'Has a Big Ten football school',           'Université du Big Ten',                  'Universidad del Big Ten',                'IA IL IN MD MI MN NE NJ OH OR PA WA WI');

  // ═════════════════════════════════════════════════════════════════════
  // 🎪 FESTIVALS & EVENTS
  // ═════════════════════════════════════════════════════════════════════
  add('pc_fest_coachella',        'Coachella',                               'Coachella',                              'Coachella',                              'CA');
  add('pc_fest_burning_man',      'Burning Man',                             'Burning Man',                            'Burning Man',                            'NV');
  add('pc_fest_sxsw',             'SXSW (Austin)',                           'SXSW',                                   'SXSW',                                   'TX');
  add('pc_fest_bonnaroo',         'Bonnaroo',                                'Bonnaroo',                               'Bonnaroo',                               'TN');
  add('pc_fest_lollapalooza',     'Lollapalooza',                            'Lollapalooza',                           'Lollapalooza',                           'IL');
  add('pc_fest_sundance',         'Sundance Film Festival',                  'Festival de Sundance',                   'Festival de Sundance',                   'UT');
  add('pc_fest_mardi_gras',       'Mardi Gras (New Orleans)',                'Mardi Gras',                             'Martes de Carnaval',                     'LA');

  // ═════════════════════════════════════════════════════════════════════
  // 🎲 QUIRKY TRIVIA
  // ═════════════════════════════════════════════════════════════════════
  add('pc_first_state_admitted',  'First state admitted (Delaware, 1787)',   'Premier État admis',                     'Primer estado admitido',                 'DE');
  add('pc_last_state_admitted',   'Last state admitted (Hawaii, 1959)',      'Dernier État admis',                     'Último estado admitido',                 'HI');
  add('pc_48th_state',            '48th state (Arizona, 1912)',              '48e État',                               'Estado 48',                              'AZ');
  add('pc_largest_pop',           'Most populous state',                     'État le plus peuplé',                    'Estado más poblado',                     'CA');
  add('pc_smallest_pop',          'Least populous state',                    'État le moins peuplé',                   'Estado menos poblado',                   'WY');
  add('pc_only_island_state',     'Only island state',                       'Seul État insulaire',                    'Único estado insular',                   'HI');
  add('pc_not_contiguous',        'Non-contiguous (separated from 48)',      'Non contigus aux 48',                    'No contiguos',                           'AK HI');
  add('pc_4_corners',             'Four Corners states',                     'Les Quatre Coins',                       'Cuatro Esquinas',                        'AZ CO NM UT');
  add('pc_motor_city',            'Motor City',                              'Motor City',                             'Motor City',                             'MI');
  add('pc_capital_of_world',      'Self-styled "X capital of the world"',    'Auto-proclamé capitale mondiale',        'Capital mundial autoproclamada',         'NY TX NV');
  add('pc_dual_state_names',      'Has "North" or "South" sibling state',    'A un État jumeau Nord/Sud',              'Tiene estado gemelo Norte/Sur',          'ND SD NC SC WV VA');
  add('pc_name_is_country',       'Name shared with a country',              'Nom partagé avec un pays',               'Nombre compartido con país',             'GA');
  add('pc_no_state_income_tax_9', 'No state income tax (9 states)',          'Pas d\'impôt sur le revenu (9 États)',   'Sin impuesto estatal sobre la renta',    'AK FL NV NH SD TN TX WA WY');
  add('pc_states_in_pacific',     'Touches the Pacific Ocean',               'Borde le Pacifique',                     'Toca el Pacífico',                       'CA OR WA AK HI');
  add('pc_state_two_capitals',    'Two-capital history (e.g. Virginia)',     'Histoire à deux capitales',              'Historia con dos capitales',             'VA RI');
  add('pc_silicon_valley',        'Home to Silicon Valley',                  'Silicon Valley',                         'Silicon Valley',                         'CA');
  add('pc_research_triangle',     'Research Triangle (NC)',                  'Research Triangle',                      'Research Triangle',                      'NC');
  add('pc_route66_iconic',        'On historic Route 66',                    'Sur la Route 66',                        'En la Ruta 66',                          'IL MO KS OK TX NM AZ CA');
  add('pc_appalachian_states',    'Along the Appalachian Trail',             'Sur le sentier des Appalaches',          'Sendero de los Apalaches',               'GA NC TN VA WV MD PA NJ NY CT MA VT NH ME');
  add('pc_mississippi_river_path','Bordering the Mississippi River',         'Borde le Mississippi',                   'Bordea el Misisipi',                     'MN WI IA IL MO KY TN AR MS LA');

  return list;
})();

if (typeof window !== 'undefined') {
  window.PENDING_CONSTRAINTS = PENDING_CONSTRAINTS;
  window.PENDING_MAP = Object.fromEntries(PENDING_CONSTRAINTS.map(c => [c.id, c]));
}
