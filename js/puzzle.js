const Puzzle = (() => {

  // --- Seeded PRNG (Mulberry32) ---
  function mulberry32(seed) {
    return function() {
      seed |= 0; seed = seed + 0x6D2B79F5 | 0;
      let t = Math.imul(seed ^ seed >>> 15, 1 | seed);
      t = t + Math.imul(t ^ t >>> 7, 61 | t) ^ t;
      return ((t ^ t >>> 14) >>> 0) / 4294967296;
    };
  }

  function dateToSeed(dateStr) {
    const [y, m, d] = dateStr.split('-').map(Number);
    return y * 10000 + m * 100 + d;
  }

  function shuffle(arr, rng) {
    const a = [...arr];
    for (let i = a.length - 1; i > 0; i--) {
      const j = Math.floor(rng() * (i + 1));
      [a[i], a[j]] = [a[j], a[i]];
    }
    return a;
  }

  // --- Row groups: every triple is disjoint and has been verified to produce
  // at least one globally-unique puzzle. ---
  // Curated list, all groups tested at ≥20/30 viability rate on real seeds.
  // Dead groups (subregion combos that fail, region/political/coast that have
  // too many states per row to find unique solutions) have been removed.
  const MUTEX_ROW_GROUPS = [
    // Timezones
    ['tz_central', 'tz_mountain', 'tz_pacific'],
    // Subregion spread
    ['sub_new_england', 'sub_deep_south', 'sub_mountain'],
    // Borders
    ['border_canada', 'border_mexico', 'coast_gulf'],
    // Letter-initial groups
    ['starts_a', 'starts_m', 'starts_w'],
    ['starts_a', 'starts_w', 'has_new'],
    ['starts_m', 'starts_w', 'has_new'],
    ['starts_n', 'starts_a', 'starts_w'],
    ['starts_i', 'starts_m', 'starts_n'],
    // Border + letter combo
    ['border_mexico', 'starts_m', 'starts_w'],
    ['pop_lt1m', 'border_mexico', 'letters_8'],
    // Coast + has_new
    ['coast_gulf', 'starts_w', 'has_new'],
    ['coast_gulf', 'tz_pacific', 'has_new'],
    ['tz_pacific', 'starts_a', 'has_new'],
    // Natural hazards
    ['hurricane_zone', 'sub_new_england', 'sub_mountain'],
    ['earthquake_zone', 'sub_new_england', 'sub_mid_atlantic'],
    ['has_glaciers', 'sub_new_england', 'sub_deep_south'],
    // Geography
    ['desert_state', 'sub_new_england', 'sub_deep_south'],
    // Cultural belts
    ['rust_belt', 'sub_deep_south', 'sub_mountain'],
    ['sun_belt', 'sub_new_england', 'sub_plains'],
    // History
    ['statehood_1900s', 'sub_new_england', 'sub_mid_atlantic'],
    ['statehood_1900s', 'sub_new_england', 'sub_deep_south'],
    // Name origin
    ['name_spanish_origin', 'sub_new_england', 'sub_mid_atlantic'],
    // Route 66
    ['route_66', 'sub_new_england', 'sub_mountain'],
    ['route_66', 'sub_new_england', 'sub_deep_south'],
    // Cities & borders
    ['has_million_city', 'sub_new_england', 'sub_mountain'],
    ['has_million_city', 'sub_new_england', 'sub_plains'],
    ['borders_few', 'sub_mid_atlantic', 'sub_mountain'],
    // Expanded set (programmatically validated to produce ≥3 unique puzzles each) 
    ['sun_belt', 'snow_belt', 'rust_belt'],                               // 15× combos
    ['pop_lt1m', 'pop_5m10m', 'pop_gt10m'],                               // 8×
    ['borders_few', 'sub_mountain', 'sub_plains'],                        // 7×
    ['name_spanish_origin', 'sub_new_england', 'sub_deep_south'],         // 6×
    ['route_66', 'sub_new_england', 'sub_plains'],                        // 5×
    ['confederate', 'statehood_1900s', 'sub_mountain'],                   // 4×
    ['earthquake_zone', 'sub_deep_south', 'sub_mid_atlantic'],            // 4×
    ['pop_1m5m', 'pop_5m10m', 'pop_gt10m'],                               // 3×
    ['largest_state', 'sub_new_england', 'sub_mid_atlantic'],             // 3×
    // Added with the 2026 constraint pass 
    // Both of these carry a constraint whose states sit in one corner of the
    // country. As a column such a constraint cannot reach three disjoint rows,
    // so it is placed on a row instead, the same way desert_state and
    // route_66 already are. Counts are unique-solution grids found by search.
    ['smaller_than_portugal', 'sub_plains', 'sub_mountain'],              // 23×
    ['more_cows_than_people', 'sub_new_england', 'sub_mid_atlantic'],     // 3×
  ];

  // --- Sourced constraint lists -------------------------------------------
  // Membership here is a curated fact rather than a field in states.json, so
  // each list is written out in full and can be audited at a glance. Every
  // list holds at least 5 states, the minimum the generator needs.
  //
  // Areas are total area (land plus water), the basis on which the reference
  // countries are quoted too: the United Kingdom is 244,376 km2 and Portugal
  // is 92,212 km2.
  const LIST_CONSTRAINTS = {
    larger_than_uk:        'AK AZ CA CO MI MT NM NV OR TX WY',
    // Belgium (30,689 km2) was the first cut, but it selects only New England
    // plus Hawaii, and a column has to reach all three mutually exclusive rows.
    // Portugal widens it to three census regions without losing the point.
    smaller_than_portugal: 'CT DE HI MA MD ME NH NJ RI SC VT WV',
    // The eight commonly recognised US panhandles.
    has_panhandle:         'AK FL ID MD NE OK TX WV',
    // Cattle inventory exceeds human population.
    more_cows_than_people: 'IA ID KS MT ND NE OK SD WY',
    // Highest point below 500 m / 1,600 ft. The nearest state above the line
    // is Iowa at 509 m, so the metric and imperial thresholds agree.
    low_high_point:        'DE FL IL IN LA MS OH RI',
    // Flags carrying symbols only, with no state name and no motto.
    flag_no_lettering:     'AL AK AZ CO HI MD MN NM OH SC TN TX UT',
    // Two-letter postal abbreviation that is also an ordinary English word.
    postal_code_is_word:   'HI ID IN MA ME OH OK OR PA',
    // More than one president born inside the state. The presidentBirthplace
    // flag in states.json covers 21 states, close to half the country, loose
    // enough that grids built on it almost never resolve to one solution.
    // Requiring two or more cuts it to a set that carries real information.
    two_presidents_born:   'MA NC NY OH PA TX VA VT',
  };

  const _toSets = lists => Object.fromEntries(
    Object.entries(lists).map(([k, v]) => [k, new Set(v.split(/\s+/))])
  );
  const LIST_SETS = _toSets(LIST_CONSTRAINTS);

  // Clues added to the third generator on 25 October 2026, used only from
  // DATA_FIX3_FROM. Each set was checked against a primary or reference
  // source by a second, independent pass; the gloss in translations.json
  // states the rule that settles the edge cases noted here.
  const V3_LISTS = {
    // Sites officially named National Park (Chiricahua became the 64th on
    // 20 October 2026, Arizona's fourth). A park in two states counts for each.
    natl_parks_3:           'AK AZ CA CO FL UT WA',
    // Rainier 14,411 ft; Mauna Kea, 13,803 ft, is under the line.
    peak_14000:             'AK CA CO WA',
    yellowstone:            'ID MT WY',
    ohio_river:             'IL IN KY OH PA WV',
    // The river itself, not its basin, which reaches seven states.
    colorado_river:         'AZ CA CO NV UT',
    rio_grande:             'CO NM TX',
    appalachian_trail:      'CT GA MA MD ME NC NH NJ NY PA TN VA VT WV',
    // The Oregon National Historic Trail as the Park Service maps it.
    oregon_trail:           'ID KS MO NE OR WA WY',
    pony_express:           'CA CO KS MO NE NV UT WY',
    // The 1803 lands as usually mapped, the usual fifteen states.
    in_louisiana_purchase:  'AR CO IA KS LA MN MO MT ND NE NM OK SD TX WY',
    // The 1848 treaty, not counting land Texas already claimed.
    in_mexican_cession:     'AZ CA CO NM NV UT WY',
    // Five states and the part of Minnesota east of the Mississippi.
    northwest_territory:    'IL IN MI MN OH WI',
    border_state_civil_war: 'DE KY MD MO WV',
    // Where Congress met before 1800, the Continental Congress included.
    former_us_capital:      'MD NJ NY PA',
    // The official host city's state; football matches played elsewhere do
    // not count.
    hosted_olympics:        'CA GA MO NY UT',
    ivy_league:             'CT MA NH NJ NY PA RI',
    // NASA's ten main centers; test sites run by a center elsewhere do not.
    nasa_center:            'AL CA FL MD MS OH TX VA',
    bird_cardinal:          'IL IN KY NC OH VA WV',
    bird_meadowlark:        'KS MT ND NE OR WY',
    // Florida's flamingo bill died in the Senate on 13 March 2026.
    bird_mockingbird:       'AR FL MS TN TX',
    // A real person, directly or through a title, bay or older name.
    named_after_person:     'DE GA LA MD NC NY PA SC VA WA WV',
    // North and South, or West, of a name another state carries.
    paired_name:            'NC ND SC SD VA WV',
  };
  const V3_LIST_SETS = _toSets(V3_LISTS);

  // --- Data corrections with a cut-over date ------------------------------
  // data/states.json and LIST_CONSTRAINTS hold the corrected facts. Every grid
  // dated before DATA_FIX_FROM was generated from the old values, and players
  // have played and shared it, so for those dates the old values are put back
  // and the grid comes out byte for byte as it did. Both values are written
  // here rather than read from the JSON, so a browser still holding a stale
  // states.json builds the same grid as everyone else.
  const DATA_FIX_FROM = '2026-10-07';
  const STATE_FIXES = {           // id: { field: [old, corrected] }
    AL: { population: ["1M-5M", "5M-10M"] },
    AZ: { multiTimezone: [true, false], nhlTeam: [true, false] },
    CA: { hasGlaciers: [false, true] },
    CT: { bordersFew: [false, true] },
    DE: { bordersFew: [false, true], nameRoyalty: [true, false], region: ["northeast", "south"] },
    FL: { hasMillionCity: [false, true] },
    HI: { earthquakeZone: [false, true] },
    IA: { borders6Plus: [false, true] },
    ID: { earthquakeZone: [false, true] },
    IL: { earthquakeZone: [false, true] },
    KY: { earthquakeZone: [false, true] },
    LA: { bordersFew: [false, true] },
    MD: { region: ["northeast", "south"] },
    MI: { bordersFew: [false, true] },
    MT: { earthquakeZone: [false, true] },
    NC: { political: ["swing", "red"] },
    ND: { bordersFew: [false, true] },
    NE: { borders6Plus: [false, true] },
    NH: { bordersFew: [false, true], political: ["swing", "blue"] },
    NJ: { bordersFew: [false, true], nflTeam: [false, true] },
    NM: { greatPlains: [false, true] },
    NV: { multiTimezone: [false, true] },
    OR: { desertState: [false, true], hasGlaciers: [false, true] },
    RI: { bordersFew: [false, true] },
    SC: { bordersFew: [false, true], earthquakeZone: [false, true] },
    SD: { borders6Plus: [false, true] },
    TN: { timezone: ["eastern", "central"] },
    TX: { desertState: [false, true] },
    UT: { capitalStartsWithS: [false, true], earthquakeZone: [false, true], nhlTeam: [false, true] },
    VT: { bordersFew: [false, true] },
    WA: { bordersFew: [false, true] },
    WY: { earthquakeZone: [false, true], hasVolcano: [false, true] },
  };
  const LIST_FIXES = {            // list: old membership (LIST_CONSTRAINTS holds the new one)
    two_presidents_born: 'MA NC NY OH TX VA VT',
    flag_no_lettering: 'AL AK AZ CO HI MD NM OH SC TN TX',
    postal_code_is_word: 'HI ID IN MA ME OK OR PA',
  };
  // Pop-culture clues: constraints-live.js keeps the membership the old grids
  // were built from; from DATA_FIX_FROM these corrected lists replace it.
  const PC_FIXES = {
    pc_super_bowl_host: 'CA FL LA TX MN AZ NJ MI GA IN NV',
    pc_music_taylor_swift: 'CA NV AZ TX MA FL GA IL MI MO MN OH PA WA TN IN LA NJ CO',
    pc_music_beyonce_tour: 'PA MA TX MD GA MI MO MN IL FL NV TN KY NJ NC AZ CA WA LA',
    pc_born_president_post60: 'TX HI MA AR GA NE CA IL CT NY PA',
    pc_volcano_active: 'HI WA OR CA AK WY',
    pc_named_after_person: 'LA MD NC SC GA WA PA DE NY VA WV',
    pc_capital_is_largest: 'AR AZ CO GA HI IA ID IN MA MS OH OK RI TN UT WV WY',
    pc_capital_under_50k: 'VT MT SD KY AK ME MD DE MO NH WV',
    pc_state_capital_small: 'VT AK MT NH SD ME KY MD DE MO NV WY ND WA NM PA WV NJ',
    pc_eastern_time: 'ME NH VT MA RI CT NY NJ DE PA MD VA WV NC SC GA FL OH MI IN KY',
    pc_central_time: 'AL AR IL IA KS LA MN MS MO NE ND OK SD TX WI TN',
    pc_multiple_time_zones: 'AK FL ID KS KY MI NE ND OR SD TN TX IN NV',
  };
  // Clues whose answer set no list can make complete or checkable (film and
  // TV settings, "has islands", "on a major river"...). A player who knows
  // the subject could not win them, so they leave the pool from DATA_FIX_FROM.
  const RETIRED_FROM_FIX = new Set([
    'has_islands',
    'pc_stephen_king_setting',
    'pc_marvel_mcu_us_setting',
    'pc_pixar_film_setting',
    'pc_tarantino_setting',
    'pc_iconic_cocktail',
    'pc_disaster_movie_set',
    'pc_cop_show_setting',
    'pc_medical_drama_set',
    'pc_long_river_state',
    'pc_movie_spielberg',
    'pc_movie_scorsese',
    'pc_movie_anderson_wes',
    'pc_movie_eastwood',
    'pc_movie_marvel_loc',
    'pc_movie_pixar_inspo',
    'pc_music_dylan_song',
    'pc_born_first_lady',
    'pc_amusement_park_top',
    'pc_christopher_nolan_us',
    'pc_sea_level_low',
    'pc_letters_12_plus',
    'pc_two_syllables',
    'pc_pro_team_animal_name',
    'pc_major_cruise_port',
    'pc_named_after_river',
    'pc_named_native_tribe',
    'pc_hist_spanish_colonial',
    'pc_hist_french_colonial',
    'pc_real_housewives_franchise',
    'pc_underground_subway',
  ]);
  // Second cut-over, same rule: grids dated before DATA_FIX2_FROM keep the
  // values they were built from. Minnesota was missing from "double letter"
  // ("nn"), and the day before a grid was computed in local time rather than
  // UTC, so east of UTC (France, Spain) the row group to avoid came from two
  // days back and 23 of 304 grids differed from everyone else's.
  const DATA_FIX2_FROM = '2026-10-24';
  const STATE_FIXES2 = {          // id: { field: [old, corrected] }
    MN: { doubleLetter: [false, true] },
  };
  const PC_FIX_SETS = _toSets(PC_FIXES);
  const LEGACY_LIST_SETS = { ...LIST_SETS, ..._toSets(LIST_FIXES) };
  let _lists = LIST_SETS;
  let _legacy = false;       // true while building a grid dated before DATA_FIX_FROM

  function _withDataFor(dateStr, states, fn) {
    const legacy = dateStr < DATA_FIX_FROM;
    const patched = states.map(s => {
      const fix = STATE_FIXES[s.id], fix2 = STATE_FIXES2[s.id];
      if (!fix && !fix2) return s;
      const o = { ...s };
      if (fix) for (const k in fix) o[k] = fix[k][legacy ? 0 : 1];
      if (fix2) for (const k in fix2) o[k] = fix2[k][dateStr < DATA_FIX2_FROM ? 0 : 1];
      return o;
    });
    const prev = [_lists, _legacy];
    _lists = legacy ? LEGACY_LIST_SETS : LIST_SETS;
    _legacy = legacy;
    try { return fn(patched); } finally { [_lists, _legacy] = prev; }
  }

  const ALL_CONSTRAINTS = [
    // Regions
    'region_west', 'region_south', 'region_midwest', 'region_northeast',
    // Subregions
    'sub_new_england', 'sub_mid_atlantic', 'sub_deep_south',
    'sub_plains', 'sub_mountain',
    // Population
    'pop_lt1m', 'pop_1m5m', 'pop_5m10m', 'pop_gt10m',
    // Coastline / borders
    'coast_atlantic', 'coast_pacific', 'coast_gulf', 'coast_great_lakes',
    'landlocked', 'border_canada', 'border_mexico',
    // Belts (curated)
    'sun_belt', 'snow_belt', 'corn_belt', 'wheat_belt', 'cotton_belt',
    'bible_belt', 'rust_belt',
    // Politics
    'political_red', 'political_blue', 'political_swing',
    // Timezones
    'tz_eastern', 'tz_central', 'tz_mountain', 'tz_pacific', 'multi_timezone',
    // History (iconic only)
    'original_13', 'confederate',
    'statehood_pre_1800', 'statehood_1900s',
    // Geography (curated)
    'on_mississippi', 'mt_rockies', 'desert_state', 'four_corners', 'great_plains', 'tornado_alley', 'hurricane_zone', 'earthquake_zone',
    'has_volcano', 'has_glaciers',
    'route_66',
    // Cities & geography (factual)
    'has_million_city', 'largest_state', 'smallest_state',
    'capital_named_after_president', 'capital_starts_with_s',
    'borders_6_plus', 'borders_few',
    // Pro sports, only NBA
    'has_nba',
    // Name origin (NEW category)
    'name_native_origin', 'name_spanish_origin', 'name_royalty_origin',
    // Name properties (general)
    'two_word_name', 'double_letter',
    'vowel_start', 'has_new',
    'ends_in_a', 'ends_in_o', 'ends_in_e', 'ends_in_n', 'ends_in_s',
    'starts_and_ends_vowel', 'two_word_starts_n',
    'contains_letter_k', 'contains_letter_w', 'contains_letter_v', 'contains_letter_y',
    'short_name', 'long_name',
    // Name length
    'letters_6', 'letters_7', 'letters_8', 'letters_9',
    // Starts with letter
    'starts_a', 'starts_i', 'starts_m', 'starts_n', 'starts_w',
    // Map reading: true whatever the player knows about the country 
    'has_islands', 'continental_divide',
    'has_panhandle', 'larger_than_uk', 'smaller_than_portugal',
    // Names, read against something else rather than letter by letter 
    'name_longer_than_capital', 'postal_code_is_word',
    // Superlatives that teach something 
    'all_four_leagues', 'more_cows_than_people', 'low_high_point',
    // Culture that travels 
    'two_presidents_born', 'flag_no_lettering',
  ];

  function matches(state, c) {
    // Generic letter-start constraints (starts_a … starts_w)
    if (c.length === 8 && c.startsWith('starts_')) {
      return state.startsWith === c[7].toUpperCase();
    }
    // Generic letter-count constraints (letters_4 … letters_9)
    if (c.startsWith('letters_')) {
      return state.letterCount === parseInt(c.slice(8), 10);
    }
    // Curated lists (see LIST_CONSTRAINTS)
    if (_lists[c]) return _lists[c].has(state.id);
    if (V3_LIST_SETS[c]) return V3_LIST_SETS[c].has(state.id);
    switch (c) {
      // Regions
      case 'region_west':      return state.region === 'west';
      case 'region_south':     return state.region === 'south';
      case 'region_midwest':   return state.region === 'midwest';
      case 'region_northeast': return state.region === 'northeast';
      // Subregions
      case 'sub_new_england':  return state.subregion === 'new_england';
      case 'sub_mid_atlantic': return state.subregion === 'mid_atlantic';
      case 'sub_deep_south':   return state.subregion === 'deep_south';
      case 'sub_plains':       return state.subregion === 'plains';
      case 'sub_mountain':     return state.subregion === 'mountain';
      case 'sub_pacific':      return state.subregion === 'pacific';
      // Population
      case 'pop_lt1m':   return state.population === '<1M';
      case 'pop_1m5m':   return state.population === '1M-5M';
      case 'pop_5m10m':  return state.population === '5M-10M';
      case 'pop_gt10m':  return state.population === '>10M';
      // Coastline
      case 'coast_atlantic':   return state.coastline.includes('atlantic');
      case 'coast_pacific':    return state.coastline.includes('pacific');
      case 'coast_gulf':       return state.coastline.includes('gulf');
      case 'coast_great_lakes':return state.coastline.includes('great_lakes');
      case 'landlocked':       return state.landlocked;
      // Politics
      case 'political_red':    return state.political === 'red';
      case 'political_blue':   return state.political === 'blue';
      case 'political_swing':  return state.political === 'swing';
      // Timezones
      case 'tz_eastern':  return state.timezone === 'eastern';
      case 'tz_central':  return state.timezone === 'central';
      case 'tz_mountain': return state.timezone === 'mountain';
      case 'tz_pacific':  return state.timezone === 'pacific';
      // Borders
      case 'border_canada': return state.bordersCanada;
      case 'border_mexico': return state.bordersMexico;
      // History (cleaned to iconic only)
      case 'original_13':         return !!state.original13;
      case 'confederate':         return !!state.confederate;
      // Geography
      case 'on_mississippi':  return !!state.onMississippi;
      case 'mt_rockies':      return Array.isArray(state.mountainRange) && state.mountainRange.includes('rockies');
      case 'desert_state':    return !!state.desertState;
      case 'four_corners':    return !!state.fourCorners;
      case 'great_plains':    return !!state.greatPlains;
      // Culture / belts
      case 'bible_belt':    return !!state.bibleBelt;
      case 'rust_belt':     return !!state.rustBelt;
      case 'route_66':      return !!state.route66;
      // Cities
      case 'has_million_city':   return !!state.hasMillionCity;
      case 'largest_state':      return state.areaRank <= 5;
      case 'smallest_state':     return state.areaRank >= 46;
      // Sports
      case 'has_nba': return !!state.nbaTeam;
      // Clues added with the third generator (DATA_FIX3_FROM)
      case 'statehood_1800_1850':  return state.admitted >= 1800 && state.admitted <= 1850;
      case 'statehood_1851_1899':  return state.admitted >= 1851 && state.admitted <= 1899;
      case 'on_missouri':          return !!state.onMissouri;
      case 'capital_has_city':     return / City$/.test(state.capital || '');
      case 'capital_is_largest':   return !!state.capitalIsLargest;
      // Read on the English names, from 25 October 2026
      case 'capital_two_words':    return /\s/.test(state.capital || '');
      case 'capital_same_initial': return (state.capital || '')[0] === state.names.en[0];
      case 'no_letter_a':          return !/a/i.test(state.names.en);
      case 'ends_in_ia':           return /ia$/i.test(state.names.en);
      case 'same_first_last':      return state.names.en[0].toLowerCase() === state.names.en.slice(-1).toLowerCase();
      case 'postal_first_last':    return state.id === (state.names.en[0] + state.names.en.slice(-1)).toUpperCase();
      case 'rare_letter':          return /[jqxz]/i.test(state.names.en);
      // Name
      case 'two_word_name':  return state.wordCount === 2;
      case 'double_letter':  return !!state.doubleLetter;
      case 'vowel_start':    return 'AEIOU'.includes(state.startsWith);
      case 'has_new':   return state.names.en.includes('New');

      // 100 NEW CONSTRAINTS 
      // Regional belts / zones
      case 'sun_belt':          return !!state.sunBelt;
      case 'snow_belt':         return !!state.snowBelt;
      case 'corn_belt':         return !!state.cornBelt;
      case 'wheat_belt':        return !!state.wheatBelt;
      case 'cotton_belt':       return !!state.cottonBelt;
      // Natural hazards & features
      case 'tornado_alley':         return !!state.tornadoAlley;
      case 'hurricane_zone':        return !!state.hurricaneZone;
      case 'earthquake_zone':       return !!state.earthquakeZone;
      case 'has_volcano':           return !!state.hasVolcano;
      case 'has_glaciers':          return !!state.hasGlaciers;
      case 'multi_timezone':        return !!state.multiTimezone;
      // History (kept: factual statehood dates only)
      case 'statehood_pre_1800':   return !!state.statehoodPre1800;
      case 'statehood_1900s':      return !!state.statehood1900s;
      // Politics (capital city facts)
      case 'capital_named_after_president': return !!state.capitalNamedAfterPresident;
      case 'capital_starts_with_s':       return !!state.capitalStartsWithS;
      // Geographic relationships
      case 'borders_6_plus':  return !!state.borders6Plus;
      case 'borders_few':     return !!state.bordersFew;
      // Name origin (NEW)
      case 'name_native_origin':  return !!state.nameNative;
      case 'name_spanish_origin': return !!state.nameSpanish;
      case 'name_royalty_origin': return !!state.nameRoyalty;
      // Name properties extra (computed)
      case 'ends_in_a':              return state.endsWith === 'A';
      case 'ends_in_o':              return state.endsWith === 'O';
      case 'ends_in_e':              return state.endsWith === 'E';
      case 'ends_in_n':              return state.endsWith === 'N';
      case 'ends_in_s':              return state.endsWith === 'S';
      case 'starts_and_ends_vowel':  return 'AEIOU'.includes(state.startsWith) && state.endsInVowel;
      case 'contains_letter_k':      return state.names.en.toUpperCase().includes('K');
      case 'contains_letter_w':      return state.names.en.toUpperCase().includes('W');
      case 'contains_letter_v':      return state.names.en.toUpperCase().includes('V');
      case 'contains_letter_y':      return state.names.en.toUpperCase().includes('Y');
      case 'short_name':             return state.letterCount <= 5;
      case 'long_name':              return state.letterCount >= 10;
      case 'two_word_starts_n':      return state.wordCount === 2 && state.startsWith === 'N';

      // Map reading 
      case 'has_islands':         return !!state.hasIslands;
      case 'continental_divide':  return !!state.continentalDivide;
      // Names read against something else 
      // Letters only, so a name is not penalised for its spaces or hyphens.
      //
      // The margin is 2 rather than 1: at 1 the constraint takes 22 states,
      // loose enough that grids built on it rarely have a unique solution.
      //
      // The test has to hold in all three languages at once, because the
      // player counts the name they can actually see. In Spanish "Nueva York"
      // clears Albany by three letters while "New York" does not clear it at
      // all, so an English-only test would reject a Spanish player who had
      // reasoned correctly. Requiring agreement costs two states, Mississippi
      // and Pennsylvania, and leaves the clue true whatever the page language.
      case 'name_longer_than_capital': {
        const cap = state.capital.replace(/[\s-]/g, '').length;
        return ['en', 'fr', 'es'].every(l =>
          state.names[l].replace(/[\s-]/g, '').length - cap >= 2);
      }
      // Superlatives 
      case 'all_four_leagues':
        return !!(state.nbaTeam && state.nflTeam && state.mlbTeam && state.nhlTeam);

      default:
        if (!_legacy && PC_FIX_SETS[c]) return PC_FIX_SETS[c].has(state.id);
        // Pending candidates registered globally (constraints-pending.js)
        if (typeof window !== 'undefined' && window.PENDING_MAP && window.PENDING_MAP[c]) {
          try { return !!window.PENDING_MAP[c].match(state); } catch { return false; }
        }
        return false;
    }
  }

  function getEligible(states, rowC, colC) {
    return states.filter(s => matches(s, rowC) && matches(s, colC));
  }

  // States that appear in too many constraints. The puzzle generator caps how
  // many of these can appear in a single solution to avoid them being
  // "the answer" every day. CA/NY/TX each match ~25-30 active constraints
  // while smaller states match ~5. Without this cap, the daily grid would
  // feel repetitive, like a Paris metro puzzle where Châtelet was a valid
  // answer every day.
  const DOMINANT_STATES = new Set(['CA', 'NY', 'TX']);
  const MAX_DOMINANT_PER_PUZZLE = 2;

  function _countDominant(flatIds) {
    return flatIds.filter(id => DOMINANT_STATES.has(id)).length;
  }

  // Check if a 3×3 grid has exactly 1 valid assignment (global backtracking)
  //
  // Cells are visited smallest first. The number of assignments does not
  // depend on the order they are counted in, so the answer is the same as a
  // row-by-row walk, but a one-state cell pins its state before the search
  // fans out and dead branches die early. This check runs for every column
  // triple tried, and in row order it was 43% of a first visit's generation.
  function hasUniqueSolution(grid) {
    const cells = [...grid[0], ...grid[1], ...grid[2]].sort((a, b) => a.length - b.length);
    const used = new Set();
    let count = 0;
    function bt(idx) {
      if (count > 1) return;
      if (idx === 9) { count++; return; }
      for (const s of cells[idx]) {
        if (!used.has(s.id)) {
          used.add(s.id);
          bt(idx + 1);
          used.delete(s.id);
        }
      }
    }
    bt(0);
    return count === 1;
  }

  // Two-tier scoring: culturally rich constraints score 2, geographically
  // interesting ones score 1. Letter/pop/tz combos score 0.
  // This naturally elevates historical/cultural puzzles above mechanical ones.
  const SCORE2 = new Set([
    // Historical / cultural identity
    'original_13', 'confederate',
    'statehood_pre_1800', 'statehood_1900s',
    // Geographic features with cultural weight
    'on_mississippi', 'four_corners', 'mt_rockies', 'desert_state', 'route_66',
    // Cultural regions
    'sub_new_england', 'sub_deep_south', 'sub_mid_atlantic', 'sub_mountain',
    'rust_belt', 'bible_belt',
    // Belts
    'sun_belt', 'snow_belt', 'corn_belt', 'wheat_belt', 'cotton_belt',
    // Natural
    'tornado_alley', 'hurricane_zone', 'has_volcano',
    // Misc
    'great_plains', 'two_word_name',
    // Name origin (new, culturally rich)
    'name_native_origin', 'name_spanish_origin', 'name_royalty_origin',
  ]);
  const SCORE1 = new Set([
    'coast_gulf', 'coast_atlantic', 'coast_pacific', 'coast_great_lakes',
    'border_mexico', 'border_canada', 'landlocked',
    'political_swing', 'political_red', 'political_blue',
    'has_million_city', 'largest_state', 'smallest_state',
    'capital_named_after_president', 'capital_starts_with_s',
    'has_nba', 'has_new',
    'double_letter', 'earthquake_zone', 'has_glaciers',
    'multi_timezone',
    'borders_6_plus', 'borders_few',
  ]);
  // Union for pre-filter (interesting cols appear first in search)
  const INTERESTING_COLS = new Set([...SCORE2, ...SCORE1]);

  // Try a row group: find up to `limit` column triples that yield a unique solution.
  // Preserves the shuffled colPool order (no re-sort) so different dates discover
  // different column combos first, giving variety even for the same row group.
  function _tryRowGroup(rowGroup, colPool, states, limit) {
    const rowStateSets = rowGroup.map(rc => states.filter(s => matches(s, rc)));
    const usedRowIds = new Set(rowGroup);

    // Pre-filter: keep only columns where every row has ≥1 eligible state.
    // Cap at 60 (was 22) to broaden the C(n,3) search and surface more variety.
    const availableCols = colPool.filter(c => {
      if (usedRowIds.has(c)) return false;
      return rowStateSets.every(rs => rs.some(s => matches(s, c)));
    }).slice(0, 60);

    // Each column's states per row, filtered once. The loop below tries every
    // triple of up to 60 columns, and filtering inside it re-ran the same
    // 180 filters about 34,000 times. Same arrays, same order, same grids.
    const colCells = new Map(availableCols.map(cc =>
      [cc, rowStateSets.map(rs => rs.filter(s => matches(s, cc)))]));

    const found = [];
    for (let i = 0; i < availableCols.length - 2; i++) {
      for (let j = i + 1; j < availableCols.length - 1; j++) {
        for (let k = j + 1; k < availableCols.length; k++) {
          const cols = [availableCols[i], availableCols[j], availableCols[k]];

          const grid = rowStateSets.map((_, r) => cols.map(cc => colCells.get(cc)[r]));

          if (!hasUniqueSolution(grid)) continue;

          const used = new Set();
          const flat = [];
          (function solve(idx) {
            if (idx === 9) return true;
            const r = Math.floor(idx / 3), c = idx % 3;
            for (const s of grid[r][c]) {
              if (!used.has(s.id)) {
                used.add(s.id); flat.push(s.id);
                if (solve(idx + 1)) return true;
                flat.pop(); used.delete(s.id);
              }
            }
            return false;
          })(0);

          // Hard cap: no more than MAX_DOMINANT_PER_PUZZLE of CA/NY/TX in the
          // solution. Skip combos that violate this, keeps these big states
          // from monopolising daily answers.
          if (_countDominant(flat) > MAX_DOMINANT_PER_PUZZLE) continue;

          const solution = [flat.slice(0,3), flat.slice(3,6), flat.slice(6,9)];
          found.push({
            rows: rowGroup,
            cols,
            solution,
            cells: grid.map(rc => rc.map(cell => cell.map(s => s.id))),
          });
          if (found.length >= limit) return found;
        }
      }
    }
    return found;
  }

  // Score a puzzle: cultural/historical constraints = 2pts, geographic/political = 1pt.
  // Penalty: each CA/NY/TX cell in the solution subtracts 2 points, among
  // otherwise-equal puzzles, prefer the ones that don't lean on dominant states.
  function _score(puzzle) {
    let s = 0;
    for (const c of [...puzzle.rows, ...puzzle.cols]) {
      if (SCORE2.has(c)) s += 2;
      else if (SCORE1.has(c)) s += 1;
    }
    s -= _countDominant(puzzle.solution.flat()) * 2;
    return s;
  }

  // Row constraints that are "boring" (pure letter/count properties).
  // Groups where ALL rows are boring are deprioritised, used only as fallback.
  const BORING_ROW = new Set([
    'letters_6','letters_7','letters_8','letters_9',
    'vowel_start','starts_a','starts_i','starts_m','starts_n','starts_w',
    'ends_in_a','ends_in_o','ends_in_e','ends_in_n','ends_in_s',
    'starts_and_ends_vowel','two_word_starts_n',
    'contains_letter_k','contains_letter_w','contains_letter_v','contains_letter_y',
    'short_name','long_name',
  ]);

  function _generateForSeed(baseSeed, states, excludeGroup) {
    // Use the active (non-disabled) row groups + column constraints
    const activeGroups = _activeRowGroups();
    const activeCols = _activeConstraints();
    const n = activeGroups.length;
    if (n === 0) return null;

    // Shuffle ALL row groups with a date-seeded RNG so each day picks
    // a different order (was: fixed-array startGi rotation, which biased
    // certain groups to first place). This is the single biggest lever
    // for daily-variety across months.
    const rngOrder = mulberry32(baseSeed + 31337);
    const idxs = Array.from({ length: n }, (_, i) => i);
    const shuffledIdxs = shuffle(idxs, rngOrder);

    // Sort: interesting groups first (≥1 non-boring row), boring last.
    const interestingOrder = [];
    const boringOrder = [];
    for (const gi of shuffledIdxs) {
      if (gi === excludeGroup) continue;
      const group = activeGroups[gi];
      const allBoring = group.every(r => BORING_ROW.has(r));
      (allBoring ? boringOrder : interestingOrder).push(gi);
    }
    const rotationOrder = [...interestingOrder, ...boringOrder];

    for (const gi of rotationOrder) {
      const shuffleRng = mulberry32(baseSeed + (gi + 1) * 999983);
      const selectRng  = mulberry32(baseSeed + (gi + 1) * 999983 + 777777);
      const colPool = shuffle(activeCols, shuffleRng);
      const options = _tryRowGroup(activeGroups[gi], colPool, states, 30);
      if (options.length === 0) continue;

      // Weighted random pick: favor higher-scored puzzles but allow lower ones.
      // Weight = max(1, score + 5) so even score-0 puzzles get picked sometimes.
      // This dramatically expands per-row-group variety vs picking only top tier.
      const weights = options.map(o => Math.max(1, _score(o) + 5));
      const total = weights.reduce((a, b) => a + b, 0);
      let pick = selectRng() * total;
      let idx = 0;
      for (let i = 0; i < weights.length; i++) {
        pick -= weights[i];
        if (pick <= 0) { idx = i; break; }
      }
      const best = options[idx];
      return { date: null, ...best, _activeGroupIdx: gi };
    }
    return null;
  }

  // Find the "Golden State" for a puzzle: a state in the solution that satisfies
  // ALL 3 column constraints (a column-wildcard, it could be placed in any of
  // the 3 cells of its row). Since our row groups are mutex by design, a state
  // can satisfy at most 1 row constraint, so "all 6 criteria" is impossible, // the meaningful version is "all 3 columns".
  // Inspired by Tubedoku's Golden Station Easter egg. Rewards observant players.
  function _findGoldenState(puzzle, states) {
    if (!puzzle || !puzzle.solution || !puzzle.cols) return null;
    const cols = puzzle.cols;
    const solutionIds = new Set(puzzle.solution.flat());
    for (const stateId of solutionIds) {
      const state = states.find(s => s.id === stateId);
      if (!state) continue;
      if (cols.every(c => matches(state, c))) return stateId;
    }
    return null;
  }

  function generatePuzzle(dateStr, states) {
    if (dateStr >= DATA_FIX3_FROM) return _withDataFor(dateStr, states, st => _generateV3(dateStr, st));
    return _withDataFor(dateStr, states, st => _generatePuzzle(dateStr, states, st));
  }

  // --- Third generator, from DATA_FIX3_FROM ---------------------------------
  // The first two drew from 150 clues, many of them fuzzy (Sun Belt, Deep
  // South, swing state), trivia (Taylor Swift tour, two presidents born
  // there) or disputed (name origins), and shipped only grids with exactly
  // one solution: 65% of cells accepted a single state, so a player who did
  // not know one clue had nothing to reason with. From this date a grid uses
  // only clues a map, a list or the name itself settles, every cell accepts
  // at least two states, and any valid grid wins as before.
  const DATA_FIX3_FROM = '2026-10-27';
  // clue: family. Clues of one family share an axis only when no state fits
  // both (West, South, Midwest as three rows); otherwise one per axis.
  const V3_POOL = {
    region_west: 'region', region_south: 'region', region_midwest: 'region',
    region_northeast: 'region', sub_new_england: 'region',
    tz_eastern: 'tz', tz_central: 'tz', tz_mountain: 'tz', tz_pacific: 'tz', multi_timezone: 'tz',
    pop_lt1m: 'pop', pop_1m5m: 'pop', pop_5m10m: 'pop', pop_gt10m: 'pop', has_million_city: 'city',
    coast_atlantic: 'coast', coast_pacific: 'coast', coast_gulf: 'coast',
    coast_great_lakes: 'coast', landlocked: 'coast',
    border_canada: 'border', border_mexico: 'border',
    on_mississippi: 'river', on_missouri: 'river', mt_rockies: 'mount', route_66: 'road',
    borders_6_plus: 'nbr', borders_few: 'nbr', largest_state: 'area', smallest_state: 'area',
    original_13: 'hist', confederate: 'civil',
    statehood_pre_1800: 'adm', statehood_1800_1850: 'adm', statehood_1851_1899: 'adm', statehood_1900s: 'adm',
    capital_is_largest: 'cap', capital_starts_with_s: 'cap',
    capital_named_after_president: 'cap', capital_has_city: 'cap',
    has_nba: 'sport',
    starts_m: 'name', starts_n: 'name', starts_a: 'name', starts_i: 'name', starts_w: 'name',
    vowel_start: 'name', ends_in_a: 'name', ends_in_o: 'name', ends_in_e: 'name', ends_in_n: 'name',
    ends_in_s: 'name', two_word_name: 'name', has_new: 'name', double_letter: 'name',
    contains_letter_k: 'name', contains_letter_w: 'name', contains_letter_v: 'name',
    contains_letter_y: 'name', short_name: 'name', long_name: 'name',
    // 25 October 2026: clues a player can reason out from a map, a school
    // lesson or the name, in the spirit of Metrodoku. Appended, as above.
    natl_parks_3: 'nature', peak_14000: 'nature', low_high_point: 'nature', yellowstone: 'nature',
    four_corners: 'corner',
    ohio_river: 'river', colorado_river: 'river', rio_grande: 'river',
    appalachian_trail: 'trail', oregon_trail: 'trail', pony_express: 'trail',
    in_louisiana_purchase: 'land', in_mexican_cession: 'land', northwest_territory: 'land',
    former_us_capital: 'hist', border_state_civil_war: 'civil',
    hosted_olympics: 'sport', ivy_league: 'school', nasa_center: 'space',
    bird_cardinal: 'bird', bird_meadowlark: 'bird', bird_mockingbird: 'bird',
    larger_than_uk: 'area', more_cows_than_people: 'farm',
    capital_two_words: 'cap', capital_same_initial: 'cap', named_after_person: 'origin',
    no_letter_a: 'name', ends_in_ia: 'name', same_first_last: 'name',
    postal_first_last: 'name', rare_letter: 'name', paired_name: 'name',
  };
  const V3_MIN = 2, V3_MAX = 9;
  // The schedule below stores each grid as six indexes into this list, so a
  // clue is only ever appended, never removed or moved.
  const V3_IDS = Object.keys(V3_POOL);
  const V3_ALPHABET = 'ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz0123456789-_';
  // Built by scripts/build-puzzle-schedule.cjs: twelve characters a day, two
  // per clue (three rows, three columns), each pair an index in base 64 so
  // the pool can grow past 64 clues. From DATA_FIX3_FROM. Chosen with the whole history
  // in view, which a grid computed from its own date alone cannot have: no
  // set of six clues ever repeats, no clue of yesterday's grid comes back
  // today, and every clue's turn comes round evenly. Past its end the
  // generator below takes over.
  const V3_SCHEDULE = 'BFBKAfBQAMANBRBYAmAaACATAUBXADAbASA8AkBYAMAPAWA4BSAJA_ARAGAoAlATAiBDAuBTBVAgApA2AWALAnBUAHAvBHBIA3BFBOA6AbALA5ANBPBZAFABAVAuAiBBAlA9AyAjAbAQA4BTAzBPBNAOAZANAwA9BVAYBJAkA1ANADAeAPBFBMAWA_BCALBYAXA3AiBGAqAJBLBOAMBbBXAPAcAoAaAAAJAZAxAEBFAdALAUAKAqAfBdBIAbBaASBVAhAvAMA-AiAoAIBDBTA7ASBQAsANAhBEAZBYBcAAATA0A_AUACAkAPBAA3BHBRAaALBKApAWA2AGAMA8ANBQAgBFACBSBIBPARAkAJBWA4BFABAbAvBUAwAjAHBTBIA6AOAUAFANASAnAGBJAuALAZA5BFANBZBXBQBBAlAiAYBVAuAQBDArA9AvBTAtAMBGAyAiAAA1AbAEAeAPBFADBbASBLBYANAVAHAjAcAoBJAmALAaAXBHACBOA0BFAdAUAqAzAJBVAfAuACBCAeBXBMA6ANBaBQASAhAvAMBdAUAAAKBUAiA7ACAZATANBVA-BTAbAIAQAoAsASBPA_AkAhBAAXBGBRALAaAxATAfAgBFBbA2BVAJAWABACA3ADAgA8AUALApBSAkBIBYAGBNA5BXAFBFBZBcBDA9BBBTAOBWAqAeA4AbALBEAlBHAYBJAZBKAAA4AyAUAkA1BLAbBOBYAPAwBTBUAHAUAuAEA8BFAdBOAkAVAYAJAcAoBIAjBTATArAZAAA0AeBKBQBYAMARBHBRAvAJBIAnAXAAAiAaALBCBMA4A6BXAFAzASAJANACAuAKAeA8BdAbAUA7AZARBPAoAGAmAWBKAhBYAMAQAlBHAIA9BTA_AeA8AfAkBbBABYACBGBRBIAxAaAEAgAUBFA2AoBLADAMAPABAqAZBVATA3A-AvAiBDBTBHBSA9AAAOAJATBNBQA8BZANBXAtAJBGAyAiAkBcAIAHBJAoBTAsAYBVBUAaAkBBBPA9AVAMAoBEAlAjAcBJAZA1ALAEAdBFBOA5BQATBCAgABApAhBPAFAMAbA0AJBTAXAKAvBWAdAWA4A_ALBMA1ADA6APAgAnBUA3AuALBHASAqAfAGAvAeBaAhA9ArBPAMA7AAAaAwBUAoAmAuATACBGAWAzAhBBBIAZAkBbBLA_BYBXAPAQBDBTA-AIALBKA_BFA2BQANBdAfAiA8AGAMBRBGAaBAA3AXAUAgA4AxADBXARANAOBSAvBPBcBJAoAVAHAMBZBHBDBNAkBbBVALBBAjBTAlAsAFASBCA_AJAcAeAKAbAvAUAEAdAqA0BOALAyAAAiAtBGAJABANAOA6BPAZApAeAaBMALA2AYBTAkAwBBAiA5BMAfATBFBXBaBBAQA9AoAjBWAOBKAuA_AFA7AZAmAhATACA1BQBOAPBFBYAWAoAhBIAaAzBUA3BRAGAqAKA-AJAvAIBTAbBLA5ANADBXBbA8BQABBdAFA_AXBTBGBABHBRA4BFAdAxBOALBSAGAoARBPAaAgBKA2AMBYANBcAlBIBJAZBTAVAvBDAHAOA9BZBXAFBNBQA5AsAaASBCAhAJBVAjBUAABTAuAUAPBOAEA4ANA0ADAoAeBFAqAnAYA9AiBHBDArA_AMAfAGAkA6ABBCBMANAFBEAHAoAwBJAVAyBVASACAhBYAcA9BFATAOAbApBVAMAWAGBbA7AZAjALAAAuAQAiA8A-A4AbAmAaBUBGACAXA1AUADBLBYALAzBRAKA3AJATAIA9AZBTBJBHBaBSANBPAkAhBdBQBXAgA8ABAxBOBFAdA4AEARBbBGBIALAGA2A_BCBKANAkBBBYAVBcAoAlAvBRBVAqBUAABZAeBQA5ANABBNBTAYBDAlBHAPA4AaA6AMAkA0BCBQAFBXANAHBUBIAUAuBHAtBTAAAyATBGAsACAhASAkA_ArAMAOAfAGA9BMA2ABAWApBFAwAcBBBEAYAoAnBTAvAiBJBHBAACAJAXBRBGA-AbAIAQBTA8BLA5AUADBXBbBWAAAZAjAuALA1BMBCAgAFBYAzAoARBSBIAGA3ACAaAKAXBVA7AOA_BPAGAhAxAdBOAEALBFBdAfBMAeAPATBKAvAZAlAhAuAqAeAKA0AbAUBZBKBPBQAFANAVAaA9AHBJAoBDBFBHBNAkAMA4ASAgA6AUADAmBbABA2AhAWBUA_A7AsAGALBcBHAYBBBIBTAtACBDAiAkAMBEAuAAAwATAZAyAfAQAJAbAoApAeAiA8AUALBAAaACBRAXBGAcA3BVAjAZAvAIBJBTA-BHAlBLANAUBXAqADA5BMBKBCBQAFBaAfAMArAkBPA1AEBFAdBOBYARAvA_AOAWBPAxBXADAPBFALAzAJAWBSBIAGBdBLAUA0BXAPAnAZAABNBHAuBZALBMAgABBXAVAuBJAHAlA9A4ATBOA6AUAbAKACAJBUA3AXAmAaBSAhAWBYA2AdBOBbAEBFA7AkAYAwBIBUBBAZBHAoBDBVASApALAeAWA2AtAaAJAiBGAABcAkAQAjA4BTA8BIAPAqABAoBAACA3BRBGALAyBQA_BKBYAhAcA0AfANBIAvBWBMA6AFABBbAsAaASBCAGAhAIBHBJA-AiAlAMAuAOBPA9AFA1BLALADAPBYA5BNBFBZATBXBEBVAZAHBJAoARAKA0AbAvAJBdBQA_AgA8ABAxBOALAdA4AEBaAfA9ArAMAkAUA3BGBUAJBIAnAvAiBDBHAaAzARBPBSAGAOAmAaA_AWBYACAYAuAkA7BVBUApAWBOA2ALASAVAuBRAABIATBBAjAZBcBTAoAXA3AJAqBGAaAeBNAfANBXBZAQAVAOAcA9AlBKBFBQBCANBYBWA_BMBbAFABA6AUAbA1ADAgAsANAOAhASBCAwBHAlAHALAiAIAuAoBJBTA9BLBOANA0BXAPA-AKAEA8AUAbAtBTBGAyAiATBdASBQAMACBXAdBYBOA4AEBFBaANAOAvAhBPArBGAoAGAMBTAnAiBHBDALAaAzAoBPBSAGAZBAA9ApAkAUBTAmAFBKA2AMAhA7AjAlAABVAuAYABBHBIAkAaBUAAAJBRAuAXARApA_AWAoBPA5ANAbAeBFAvBcBHBDBBAZBTAqAKAiA3BIAGBZBMBPBbABBXAxA_AJAgAbAFAcAOAlAVA9AABEBYAHAwBJAZAQA8BTAIA-ALAfA1BQAPAeBFADBXA0BLA4AoAsAMBVATAhACA6ANAEBOBbAPBCAGAvASAJAaAtBUAHBGAkAiBNBDALAnAZBHBaAQAYAUBTA9AyAFA_BKAJAhAzAoAWBSA2ACBdAJALAXAfA8AmAMATApAWACA7AaAZAuBIAoAjBTAOBcA9AAAdA4BOAqBFALBRAXBGBAAJBHA5ANBXBZAgBQAKBRBUA3AUAJArAeAWABAvAMBPA2AoAbAGApBBAYAiAwBTBHAcAZAQAlA9AjBMBIA_BYABAWAVAOAaBJAhAvAxAgBFADALAbA-BDAlAIBTBHA1ANBOBLBYAPAsAMACASAWAaA0BOAPAEAUA6BVBHATBbBTAZBCAJABAkBQANBWBKAfAFA_AuARAWAzBSBIAoAtBUA9A8AiAABEBHAvAHBJAZBdBXADAqAPBFAmA3AaAXBYBGBNAgA5BZATBXBaAfBTArAkBPAdBOA8A4AEALA7BUBVAGACAYAKAABYBRBTAJAeAzAMA2AoAfApATBQBMBFAhBcBHA9BBAZBTAcBDAOAVAvAlAQBHBJAIAiBTAjATAJAbAZAuAyAkAGASA4BGA-AEANAUAbA8A1AgBXA6ALADBLAoAqA0AUAPAxBMAMAFAgA4AsASARA_AvAGBbBRAVBIAAATBCANAhBKAkAOAwBIBDAHAiBTABAgAPBdA_BMAWA3BRAXACAJBSAAA2AaBIAoAnA9BYBNAZBHA5BQAfBZAFBFAdBYBOAEA4ALBEBHAuAYBJAZBaABA9BPAMArA7BGAYBUAUAiAmAWAvApAhACBVA9AoBBAuAlAeAPAqADA0BXBWAAA3AjAuALAKAEBYA8AbAUAcBHBDA-AHAvBcBFBOA1AoAMAQBGAiAIA4BTA6ACA_ASBYBCBLAfA4BbBXAPAzBUABAGA3AZAsAhBVAkACAWARA_AZANBPAvAVBRAMATAABIAxASBCAgBFAFBAACAKAXAUAaBKApAkA2AMAhAOBHAnBNAvAZBMBdAJBQABAgA5BXAeBZALADAwBJAiAYAuAoAyAAATAtAbBGAdAEAqA0BOBFArAQBTA9AjAvBEAHAlAcBJAZBBAiAOBDA9AuAmASAzAWAhA2A8AQAiAIAbA4BSA2AJBYAhAoBWA5AMBbABAFA1A_ALAPBYAeA7AKBRBUBIAJA6AZACA3ANAMAfAGApBPAWA2AsBQANBCAvASBVA3AKAXAiAaBcBJAlAVBYAHBaA9ABAkArBPA-AEA4AUA8AbAxANAaAgABBbBLA1AbADBYAPBNAZAYBHAlBJBdAfBOBXA0BFBAALACBGBRAXAnAOAjAAAZAuBMBCBFATA6BXAwBDBUBTAkAiAyAMAlBKAAAhAqALAEAdAUBYARAGAzBSAJAoBZAfASAFBXBFAcAwBJBEAYAoAQBTALAIAjAuAmBSBIA2AWAhA5ASBCBQAgAFAeAbAPApAfADBBBHAuBVAZA9AsAUBUA7AJACAvAXAaAKA3BRBcAAATAVA4AjA_AeBdA8BQAfBWBMA4ABBbAFBaAMAfArAhAkBPAbBSANA_AGBLA8AoBOAqAPAHBUAmBGALAaA-BBAiBDBTAoA1ADBFA6AdAUBNAAAGAnBHAZAOBQA_BYANASA0BOAdAEA8BFAtBMAgBXBYATBKAAA4AyAMAUAlA9AwBJBTAuAzANBKA2AhAJARAvAWBIAGA_BZBKBMBCBQAFAcBUBJAYAZAvAIAuAjAQBTA9ApBVBQACAWAhBAAXBHBRAaBGA5AbAUAeADA8AKAaAuA3AABUBcAoA9AVBBAMBdAkA_AfBXBQA7ABAOBPANAhBbAbAEAxAeAPBEAlBHAHBJAZBSBUA3ALAGAaBLADBYA1AUAoAqBDACAiBHAvBaAfA9ArBPAkA6AMBQA0ASBXAnBHAZBNALAAAdA8AEBOBFBbAsBGAKATAJAaAmA_AMA2AWAhBWAbBMA4ABALAgBFA8BZADAoAwBRAjBIAABTA-AvAiAIBHAUBKBYBQBCA_ANAFAXBVApACAhAcAwBUAYAUBIAyAlA9AQBTAoA5AfAiBdBXALAuBVATA7BJAWBcAjAAAVA4AcARA_BbAOAvBPAzAXBRA3AGACAxBOAMAPAbAUBBAZBTBDBHAjAeA0ANAqBXADAtAYACAkBGAiAHBJAZBEBVBHA1ALAEAdBYBOBLBCA2ASANBbBSBRA3AJBIALArBPAhBaAMAfA6ALABAaA3BMAKA-BOA8AbAUBNAEA6BFBbAeAmACATApAhAWBZA_BXAFANAfAsAGBHBUAkAJAIA4AlAQBTAiBKBZAfBQAFANAgBSBVAoAaA2BWA9AHAuAkAjBdAFBXA5BQAfA7BRAcAAATAUAnAXBJAvBHAiBcBPAhAVAMAOAwAlBTBBBYAYAxBLANAPADBbAzAcALAZBIAhA0BFAEAdBYBOBAAJBRBGAXBTAyAABXAtAUAbAqBHAjA3BTBIBCAuAMABBKBQBDBbAiA-AkBHA1APBFA6BOAUArAhBPBaA9AfARA2BVAWAoBIASApBUACAUAGAKABAQA8AJAbAeBNBQBZANAkAmBGAWAaBYATBMAMAxAgBbAPBEA9BHAHBJAZA_BMBdAFBXABA4AbAjBWAAALAsBUBVA7AGACAvAVBNAOA9BJA5AdAkADBbBFAwBIBUAYA7AaAIBJAuAlAiALBLANBdA0APBXBSAZA2AzAOAWAcBJAqBcBIATAXAYA3BRBUBHBBAIBVBDAiAlAyBQANBKBYAhAEAqAbBOBFAPBCAaADA6AUAgBTA9AkBaBDAHA-AiBOAoA8AbArAWA_AfAhAvBPAeBMApAMABARAKAZAJBIAvAtAXAIBGAiA8A1BCBKAFBYAUAQAuBTAjAiAlASBCBUAsACAJAxAABOA4ALAbBZATADA5BFAgBWBMA8BbABAFAGAoAZAnAzBHBEAvAHAVBJAcAdAqANA0BFBOAmASAzA2AWACAwA9BUAYAkAuBdAgAFBXA5BQBAAKACBRAXAUAOAPBYBLBOBPA3BGAXAaAGACBNAHAnBDAoBHA7AZAjBVAuBIBSAsBPA_AJAoAEBFAeApAkAUAyAmASAhAMACA6AdALA1ADBFBcAlA9BBAZBTBaAGAfArBPAMBKAOBZBCANAFAIA9AuAQAiBDA4BGAMAAATAaAxADAfAbAPAeBWBZBMABBbAFA8BFBOAqANAEAcBJAoAVAlAHARAOAMAvBPAGA0AKAfBdAJAbA2ATAmAWACApBEBHBVAYAZBJAtBNBQBXAkBYBUAXBGBRA3AAA5ATAEAgA8BFAzARBPBSAGANAwBHBBBIAYAoA-AuAKAUAvAiBLALADA1APBXA7BSBVAhAGAaA_A6AOASANAFAjBBAYBTBIAkAsBQANBCBKAJAyA9BDAIAoAiAdBFA0A4BOAEArAMAkBaABAAAQBXADBbAbAoAeA3BIAqAkAUBcA9BHAHBJAoBZAJAgBdANAfBMAGBKApAWAMAcBJAlAVAYBIAmASA_A2AWACBAAJBRAXALBGAnBDAOBNAZAvBYAUBOA8APAEBEAuBVATAAAZBUAUAiAKACAHARBZAFBPAOANAzAaAGBSAZAJAwACAAA7AkAiBWA9BTAjAuAoA5ASAkBCAgBQA1ANADBLBYAPA-BHAQAIBbBTA6BXBMA4BFAFAsASAOAhBCAvA0AJATABBdAKAxBOAEAbBFAPBBA4AVBcBIAoAdBOBFAqAEALBaAfAAArAkAMApBQA_BKAFAhAcBVBJAYAlAvA3AGBRAXACBUAmBYALA2BGAWAeAPAbAUAEAxAtAKAGA8ATAiBDBHAZAnBTAHARAWAGBSAvA_BNBPA5BZBXAFAaBJA7AwBVAHAzASBCAuAOAWAjABAkBWA3BIAgA1AUADA6ALBLA8APANA4BXA-BTAQAIAiAbBbALAeBMA5AEBEA9AcAVATAABdADAfA0AgBFAJAbA3AqACABBBAOBTBcAlBDAoAXACApBVBHAsAGA_BKAhAWBOA8ALAdAEA0AMBSApA2AWAGAyBRAmBGBYACBaAjAhArAkBTBUAABIAKBRAvBQBZAfBPAeAoAnAOANBNAZAvAYBTAkAwBBBUAFASAsBCACAhA7BVBJAaAuAHAxADBUA4AUALAtBFABBXA8ATA1AoAUAPADAeA5A_BMAgAFBbBdAKBRA3BIATA6AEAdBOA0BFARA2BPAGBSANA-BDAYAiBTBHBLA8ADAqBXAPAIAyAbAQAoBTAcBBAOAVAlA9BAAJBHAXAaBRBKAMA2ApAFAWBEA4AjBcATAABYAXBUBGBRALArA_AGAfAvAhBZBMBCBQBXAFAzAcBBAZBIAoAmALA_ACBYAWAwAZAlAHAuBJAkAhBKAsAJBCBNBDAaAnAoBbBVBMApABATAWASAvBQAeBCA_AxAEANAUBFAPA1BQAWAgALBYA5AKBUBdAiAUA3BCAeA6ALABA7AOA_BPBbAFA0APBOBLBXA4AdA2AUADBFA8ARANAWBSA_AJAYBVAuBTAaBUAqAKBFAbA0ATA-A4AlAQBTBJAIAHAMBHBDAiAVAlA9AAATAOBAA3AKAXBRAUBaAfAGArAkBPBcAZAYBBAcBYAjBUAHBIBTAuAtAXAaBGAiA8AzAfBPAhAGAoAmApBGACBYAXBZBJAPBNAOBbAsAaASAvAWACAyBCA_BKAJBYBMBPA6AgABBbAxAbBOAEBFA4AwBVAHA7BJAiA1ANAfAeAPBFBdAhABAFAbBQA5ALBLADBXAUAdAEANA0BOBFA2ARBPBSAoAGBEAjAAAVATAcAnA9BTBDBHAuAqAKABA3AJAbAIA9AyAQAoBTBAALA3BRAaAXAlBHBIAZBJBVAMAcAVBcAAA9AkAdAUA8BOAEBBBHBRAYBTALBUAIAtBGA8AiBaAMABArAhBPAmApAgAWA2ATBNAfA5BZBFBXAsASAXAvAGACAOARBYA_BSBPBCAMAuBKAFAaBWAqAAA4AbALA6BMADAeBbBXAwAVA9AHBJAoAxBOAfAPBbAbBdBKAhBQAFAMAzAgASANAOA2A0AJBRAKAqATA-AvBTBDAbAIA1ADAOBLBYAPA7BGAWBIATAuAjAzACAZA3AoBEA9AHAcAVBJAlBBA7BVAoAYAnAHA9BHAiAuAdA2AUA8BOAEAkAHBGBUA4AaAyAIBTAQAJAoBaAkAfArBPAhABBNBdBZATBXAmBIBbApACAWA5BQBMBFAFBXBAA3BGAXALAaARBCAOA_AvANBcBGBRAABIBTAGApAFBKBPA2A6BXAEAeA0APAsAOBCASAJAhAxATAEAgBFBbAMAiBBBDBVAuAqAbAeADA0ANAKAYAGBYAXBUAwAcAZBEAoAABSAhANAzAOBPBLAPBYA1AUBOAVAaA9BJAHAvBWA6BMA4AFABAtAGAIA8BGAiAjAyA-AQAoBTBHAYAJAkAXBUAlBDAOBNAZBTA7BVBCACAhAuAfBXAqBdAeAPBZAUADA5BFAgAmApAMAWBIBYAdAOA2A_BOA8AnBSAXALAaAGBQBFBCASA5AB';

  function _seedV3(str) {
    let h = 2166136261;
    for (const ch of str) { h ^= ch.charCodeAt(0); h = Math.imul(h, 16777619); }
    return h >>> 0;
  }

  function _v3Sets(states) {
    const SET = {};
    for (const c of V3_IDS) SET[c] = new Set(states.filter(s => matches(s, c)).map(s => s.id));
    return SET;
  }

  // Cells, and one full solution of nine different states, for six clues.
  function _v3Grid(SET, rows, cols, max) {
    const cells = rows.map(r => cols.map(c => [...SET[r]].filter(x => SET[c].has(x))));
    if (cells.flat().some(x => x.length < V3_MIN || x.length > max)) return null;
    const flat = cells.flat(), used = new Set();
    let sol = null;
    (function rec(i, acc) {
      if (sol) return;
      if (i === 9) { sol = acc.slice(); return; }
      for (const s of flat[i]) {
        if (used.has(s)) continue;
        used.add(s); acc.push(s); rec(i + 1, acc); acc.pop(); used.delete(s);
      }
    })(0, []);
    return sol ? { rows, cols, cells, sol } : null;
  }

  // Up to `limit` valid grids around an anchor clue (a row) crossed with a
  // partner clue (a column), each with a quality score. Used at runtime past
  // the schedule and by the schedule builder.
  function _v3Candidates(SET, seedStr, anchor, partner, limit) {
    const ids = V3_IDS;
    const inter = (a, b) => [...SET[a]].filter(x => SET[b].has(x)).length;
    const nested = (a, b) => [...SET[a]].every(x => SET[b].has(x)) || [...SET[b]].every(x => SET[a].has(x));
    // Small sets are drawn more often: left alone, the broad clues fit
    // everything and crowd out the rest. The few that still crowd in after
    // that (Canada meets nearly every clue) are damped by hand.
    const DAMP = { border_canada: 0.35, region_midwest: 0.6, borders_6_plus: 0.6, statehood_1851_1899: 0.7, pop_5m10m: 0.7 };
    const weight = c => { const n = SET[c].size; return (n <= 5 ? 1.7 : n <= 9 ? 1.4 : n <= 14 ? 1 : 0.45) * (DAMP[c] || 1); };
    const pick = (rng, list) => {
      let tot = 0; for (const c of list) tot += weight(c);
      let r = rng() * tot;
      for (const c of list) { r -= weight(c); if (r <= 0) return c; }
      return list[list.length - 1];
    };
    const fitsAxis = (axis, c) => axis.every(a => !nested(a, c)
      && !(V3_POOL[a] === V3_POOL[c] && inter(a, c))
      && !(V3_POOL[a] === 'name' && V3_POOL[c] === 'name'));
    const crosses = (a, b, max) => { const k = inter(a, b); return a !== b && k >= V3_MIN && k <= max && !nested(a, b); };
    const rng = mulberry32(_seedV3(seedStr));
    const found = [];
    if (!crosses(anchor, partner, V3_MAX)) return found;
    for (let att = 0; att < 3000 && found.length < limit; att++) {
      const max = att < 2000 ? V3_MAX : V3_MAX + 3;
      const rows = [anchor];
      while (rows.length < 3) {
        const cand = ids.filter(c => !rows.includes(c) && fitsAxis(rows, c) && crosses(c, partner, max));
        if (!cand.length) break;
        rows.push(pick(rng, cand));
      }
      if (rows.length < 3) continue;
      const cols = [partner];
      while (cols.length < 3) {
        const cand = ids.filter(c => !rows.includes(c) && !cols.includes(c) && fitsAxis(cols, c)
          && rows.every(r => crosses(r, c, max)));
        if (!cand.length) break;
        cols.push(pick(rng, cand));
      }
      if (cols.length < 3) continue;
      const six = [...rows, ...cols];
      if (six.filter(c => V3_POOL[c] === 'name').length > 2) continue;
      if (six.filter(c => SET[c].size >= 17).length > 1) continue;
      const g = _v3Grid(SET, rows, cols, max);
      if (!g) continue;
      // Prefer cells with three to six answers, few with only two, and a mix
      // of kinds of clue.
      const sizes = g.cells.flat().map(x => x.length);
      g.q = sizes.filter(n => n >= 3 && n <= 6).length - 0.6 * sizes.filter(n => n === 2).length
        + 0.8 * new Set(six.map(c => V3_POOL[c])).size - 0.7 * six.filter(c => SET[c].size >= 13).length;
      found.push(g);
    }
    return found;
  }

  function _v3Out(dateStr, states, g, flip) {
    let { rows, cols, cells, sol } = g;
    if (flip) {   // the anchor sits on either axis
      [rows, cols] = [cols, rows];
      cells = rows.map((r, i) => cols.map((c, j) => g.cells[j][i]));
      sol = [0, 1, 2].flatMap(i => [0, 1, 2].map(j => g.sol[j * 3 + i]));
    }
    const out = { date: dateStr, rows, cols, solution: [sol.slice(0, 3), sol.slice(3, 6), sol.slice(6, 9)], cells };
    out.goldenState = _findGoldenState(out, states);
    return out;
  }

  function _generateV3(dateStr, states) {
    const SET = _v3Sets(states);
    const day = Math.round((Date.parse(dateStr + 'T00:00:00Z') - Date.parse(DATA_FIX3_FROM + 'T00:00:00Z')) / 86400000);
    const code = V3_SCHEDULE.slice(day * 12, day * 12 + 12);
    if (code.length === 12) {
      const six = [0, 1, 2, 3, 4, 5].map(i =>
        V3_IDS[V3_ALPHABET.indexOf(code[2 * i]) * 64 + V3_ALPHABET.indexOf(code[2 * i + 1])]);
      const g = six.every(c => SET[c]) && _v3Grid(SET, six.slice(0, 3), six.slice(3), 99);
      if (g) return _v3Out(dateStr, states, g, false);
    }
    // Past the schedule: every clue leads a grid once per cycle, crossed each
    // time with the next of the clues it can meet.
    const mod = (a, n) => ((a % n) + n) % n;
    const cycle = [...V3_IDS].sort((a, b) => _seedV3('o' + a) - _seedV3('o' + b));
    const anchor = cycle[mod(day, cycle.length)];
    const partners = [...V3_IDS].sort((a, b) => _seedV3(anchor + a) - _seedV3(anchor + b));
    const round = Math.floor(day / cycle.length);
    for (let k = 0; k < partners.length; k++) {
      const found = _v3Candidates(SET, 'v3:' + dateStr + ':' + k, anchor, partners[mod(round + k, partners.length)], 10);
      if (!found.length) continue;
      let best = found[0];
      for (const f of found) if (f.q > best.q) best = f;
      return _v3Out(dateStr, states, best, _seedV3('flip' + dateStr) % 2 === 1);
    }
    return null;
  }

  function _generatePuzzle(dateStr, rawStates, states) {
    const baseSeed = dateToSeed(dateStr);

    // Compute yesterday's row group to avoid same-group repeats.
    const [y, m, d] = dateStr.split('-').map(Number);
    const prevDate = dateStr < DATA_FIX2_FROM
      ? new Date(y, m - 1, d - 1)             // as played: local midnight, see DATA_FIX2_FROM
      : new Date(Date.UTC(y, m - 1, d - 1));
    const prevStr = prevDate.toISOString().slice(0, 10);
    const prevSeed = dateToSeed(prevStr);
    // Yesterday is rebuilt from yesterday's data, so the day after the
    // cut-over still sees the row group that was actually played.
    const prevPuzzle = _withDataFor(prevStr, rawStates, st => _generateForSeed(prevSeed, st, -1));
    const activeGroups = _activeRowGroups();
    const prevGroupIdx = prevPuzzle
      ? activeGroups.findIndex(g => g.join() === prevPuzzle.rows.join())
      : -1;

    const result = _generateForSeed(baseSeed, states, prevGroupIdx);
    if (result) {
      const { _activeGroupIdx, ...rest } = result;
      const out = { ...rest, date: dateStr };
      out.goldenState = _findGoldenState(out, states);
      return out;
    }

    // Absolute fallback, should never be reached
    const fallback = generatePuzzleRelaxed(dateStr, states, mulberry32(baseSeed));
    if (fallback) fallback.goldenState = _findGoldenState(fallback, states);
    return fallback;
  }

  function generatePuzzleRelaxed(dateStr, states, rng) {
    const rowGroups = shuffle(MUTEX_ROW_GROUPS, rng);
    const colPool = shuffle(ALL_CONSTRAINTS, rng);

    for (const rowGroup of rowGroups) {
      const rowStateSets = rowGroup.map(rc => states.filter(s => matches(s, rc)));
      const usedRowIds = new Set(rowGroup);
      const availableCols = colPool.filter(c => !usedRowIds.has(c));

      for (let i = 0; i < availableCols.length - 2; i++) {
        for (let j = i + 1; j < availableCols.length - 1; j++) {
          for (let k = j + 1; k < availableCols.length; k++) {
            const cols = [availableCols[i], availableCols[j], availableCols[k]];
            const grid = [];
            let valid = true;
            for (let r = 0; r < 3; r++) {
              const rowCells = [];
              for (let c = 0; c < 3; c++) {
                const eligible = rowStateSets[r].filter(s => matches(s, cols[c]));
                if (eligible.length === 0) { valid = false; break; }
                rowCells.push(eligible);
              }
              if (!valid) break;
              grid.push(rowCells);
            }
            if (!valid) continue;

            const allSolutions = [];
            const used = new Set();
            function bt(idx, chosen) {
              if (allSolutions.length > 1) return;
              if (idx === 9) { allSolutions.push([...chosen]); return; }
              const r = Math.floor(idx / 3), c = idx % 3;
              for (const s of grid[r][c]) {
                if (!used.has(s.id)) {
                  used.add(s.id); chosen.push(s.id);
                  bt(idx + 1, chosen);
                  chosen.pop(); used.delete(s.id);
                }
              }
            }
            bt(0, []);

            if (allSolutions.length !== 1) continue;

            const flat = allSolutions[0];
            // Cap dominant states even in relaxed fallback
            if (_countDominant(flat) > MAX_DOMINANT_PER_PUZZLE) continue;
            const solution = [flat.slice(0,3), flat.slice(3,6), flat.slice(6,9)];
            return {
              date: dateStr,
              rows: rowGroup,
              cols,
              solution,
              cells: grid.map(rowCells => rowCells.map(cell => cell.map(s => s.id))),
            };
          }
        }
      }
    }

    return null;
  }

  let _states = null;
  let _puzzleCache = {};

  // Disabled constraints (dev panel) 
  // Stored in localStorage under 'statedoku_disabled_constraints' as JSON array.
  function _getDisabled() {
    try {
      const raw = localStorage.getItem('statedoku_disabled_constraints');
      return raw ? new Set(JSON.parse(raw)) : new Set();
    } catch(e) { return new Set(); }
  }
  function _setDisabled(set) {
    localStorage.setItem('statedoku_disabled_constraints', JSON.stringify([...set]));
    _puzzleCache = {}; // wipe in-memory cache so next getPuzzle regenerates
  }
  function _activeConstraints() {
    const dis = _getDisabled();
    // Merge built-in pool with admin-approved pending candidates so approved
    // constraints actually appear as columns in generated puzzles.
    const merged = [...ALL_CONSTRAINTS, ..._approvedPendingList()];
    return merged.filter(c => !dis.has(c) && (_legacy || !RETIRED_FROM_FIX.has(c)));
  }
  function _activeRowGroups() {
    const dis = _getDisabled();
    return MUTEX_ROW_GROUPS.filter(g => !g.some(c => dis.has(c)) &&
      (_legacy || !g.some(c => RETIRED_FROM_FIX.has(c))));
  }

  async function loadStates() {
    if (_states) return _states;
    const base = location.pathname.includes('/fr/') || location.pathname.includes('/es/')
      ? '../data/states.json' : 'data/states.json';
    const res = await fetch(`${base}?v=${CONFIG.DATA_VERSION}`);
    _states = await res.json();
    return _states;
  }

  // One-time purge of stale cached puzzles (bump CACHE_GEN to invalidate)
  // gen7: grids cached before constraints-live.js had loaded could differ from
  // the real grid of the day; purging them makes every player regenerate it.
  const CACHE_GEN = 'gen7';   // bump when puzzle structure changes
  (function _purgeOldPuzzleCaches() {
    try {
      if (localStorage.getItem('statedoku_cache_gen') === CACHE_GEN) return;
      const toDel = [];
      for (let i = 0; i < localStorage.length; i++) {
        const k = localStorage.key(i);
        if (k && k.includes('_puzzle_')) toDel.push(k);
      }
      toDel.forEach(k => localStorage.removeItem(k));
      localStorage.setItem('statedoku_cache_gen', CACHE_GEN);
    } catch(e) {}
  })();

  // PRELAUNCH PREVIEW 
  // Until launch day, every date returns the same fixed "preview" puzzle.
  // This way the / page still works (something to play with) but doesn't
  // burn through the daily content before the public launch.
  const LAUNCH_DATE = '2026-06-01';
  const PREVIEW_PUZZLE = {
    rows: ['statehood_1900s', 'sub_new_england', 'sub_deep_south'],
    cols: ['borders_few', 'pop_5m10m', 'double_letter'],
    solution: [['AK','AZ','HI'], ['ME','MA','CT'], ['FL','SC','MS']],
  };

  async function _buildPreviewPuzzle(dateStr) {
    return _withDataFor(dateStr, await loadStates(), states => _previewFrom(dateStr, states));
  }

  function _previewFrom(dateStr, states) {
    const cells = PREVIEW_PUZZLE.rows.map(rc =>
      PREVIEW_PUZZLE.cols.map(cc =>
        states.filter(s => matches(s, rc) && matches(s, cc)).map(s => s.id)
      )
    );
    const preview = {
      date: dateStr,
      rows: PREVIEW_PUZZLE.rows,
      cols: PREVIEW_PUZZLE.cols,
      solution: PREVIEW_PUZZLE.solution,
      cells,
      _preview: true,
    };
    preview.goldenState = _findGoldenState(preview, states);
    return preview;
  }

  function _liveConstraintsReady() {
    if (typeof PENDING_CONSTRAINTS !== 'undefined' || typeof document === 'undefined') return Promise.resolve();
    const tag = document.querySelector('script[src*="constraints-live.js"]');
    if (!tag) return Promise.resolve();
    return new Promise(resolve => {
      const done = () => resolve();
      tag.addEventListener('load', done, { once: true });
      tag.addEventListener('error', done, { once: true });
      // Belt and braces: the load event may already have fired.
      const t = setInterval(() => { if (typeof PENDING_CONSTRAINTS !== 'undefined') { clearInterval(t); done(); } }, 50);
      setTimeout(() => { clearInterval(t); done(); }, 15000);
    });
  }

  async function getPuzzle(dateStr) {
    // PREVIEW mode: lock to a single puzzle until LAUNCH_DATE
    if (dateStr < LAUNCH_DATE) {
      if (_puzzleCache[dateStr]) return _puzzleCache[dateStr];
      const p = await _buildPreviewPuzzle(dateStr);
      _puzzleCache[dateStr] = p;
      return p;
    }

    if (_puzzleCache[dateStr]) return _puzzleCache[dateStr];

    // The pop-culture clues arrive in constraints-live.js, injected without
    // anything waiting for it. A grid generated before it lands is built from
    // a smaller pool and differs from everyone else's, so wait for it.
    await _liveConstraintsReady();

    const storageKey = CONFIG.STORAGE_KEY + '_puzzle_' + dateStr;
    const cached = localStorage.getItem(storageKey);
    if (cached) {
      try {
        const parsed = JSON.parse(cached);
        _puzzleCache[dateStr] = parsed;
        return parsed;
      } catch(e) {}
    }

    const states = await loadStates();
    const puzzle = generatePuzzle(dateStr, states);
    if (puzzle) {
      localStorage.setItem(storageKey, JSON.stringify(puzzle));
      _puzzleCache[dateStr] = puzzle;
    }
    return puzzle;
  }

  // constraint_help glosses describe the corrected data. On a grid dated
  // before the latest cut-over a clue whose answer set changed would be
  // glossed with a rule its own cell contradicts, so it carries no gloss there.
  function helpFitsDate(cid, dateStr) {
    if (!dateStr || dateStr >= DATA_FIX2_FROM || !_states) return true;
    const ids = d => _withDataFor(d, _states, st => st.filter(s => matches(s, cid)).map(s => s.id).join());
    try { return ids(dateStr) === ids(DATA_FIX2_FROM); } catch (e) { return false; }
  }

  function getTodayStr() {
    const d = new Date();
    const y = d.getFullYear();
    const m = String(d.getMonth() + 1).padStart(2, '0');
    const day = String(d.getDate()).padStart(2, '0');
    return `${y}-${m}-${day}`;
  }

  // Pending constraints (approved by admin via /admin/constraints/) 
  function _getApprovedPending() {
    try { return new Set(JSON.parse(localStorage.getItem('statedoku_approved_pending') || '[]')); }
    catch { return new Set(); }
  }

  function _approvedPendingList() {
    if (typeof PENDING_CONSTRAINTS === 'undefined') return [];
    // Merge two sources of truth, with the static repo file as the baseline
    // (shared with all players) and per-device localStorage as a local override
    // (admin can stage additional approvals before promoting them to the repo).
    const fromRepo = (typeof APPROVED_PENDING !== 'undefined') ? APPROVED_PENDING : [];
    const fromLocal = _getApprovedPending();
    const approved = new Set([...fromRepo, ...fromLocal]);
    return PENDING_CONSTRAINTS.filter(c => approved.has(c.id)).map(c => c.id);
  }

  // Public API 
  function getAllConstraints() {
    // Merge built-in pool with admin-approved pending candidates
    return [...ALL_CONSTRAINTS, ..._approvedPendingList()];
  }
  function getAllRowGroups()   { return MUTEX_ROW_GROUPS.map(g => g.slice()); }
  function getDisabled()       { return [..._getDisabled()]; }
  function setDisabled(arr)    {
    _setDisabled(new Set(arr));
    // Wipe all cached puzzles in localStorage so the change takes effect
    Object.keys(localStorage)
      .filter(k => k.startsWith(CONFIG.STORAGE_KEY + '_puzzle_'))
      .forEach(k => localStorage.removeItem(k));
  }
  function countMatching(constraintId, states) {
    return states.filter(s => matches(s, constraintId)).length;
  }

  // For scripts/build-puzzle-schedule.cjs only.
  const _v3 = { ids: V3_IDS, alphabet: V3_ALPHABET, from: DATA_FIX3_FROM, pool: V3_POOL,
    sets: _v3Sets, candidates: _v3Candidates, grid: _v3Grid, withData: _withDataFor };
  return { _v3, getPuzzle, getTodayStr, loadStates, matches, helpFitsDate,
           getAllConstraints, getAllRowGroups, getDisabled, setDisabled, countMatching };
})();
