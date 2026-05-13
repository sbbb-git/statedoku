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
  //     at least one globally-unique puzzle. ---
  const MUTEX_ROW_GROUPS = [
    // Population brackets (verified)
    ['pop_1m5m', 'pop_5m10m', 'pop_gt10m'],
    // Timezones (verified)
    ['tz_central', 'tz_mountain', 'tz_pacific'],
    // Subregion combos (cleaned — only valid ones)
    ['sub_mid_atlantic', 'sub_deep_south', 'sub_pacific'],
    ['sub_deep_south', 'sub_mountain', 'sub_pacific'],
    ['sub_plains', 'sub_mountain', 'sub_pacific'],
    ['sub_new_england', 'sub_deep_south', 'sub_mountain'],
    // Four Corners cultural cluster
    ['four_corners', 'sub_new_england', 'sub_deep_south'],
    // Borders (disjoint: no state borders both Canada AND Mexico)
    ['border_canada', 'border_mexico', 'coast_gulf'],
    // Letter-initial groups (kept compact)
    ['starts_a', 'starts_c', 'starts_w'],
    ['starts_a', 'starts_w', 'has_new'],
    ['starts_m', 'starts_a', 'starts_w'],
    ['starts_m', 'starts_w', 'has_new'],
    ['starts_n', 'starts_a', 'starts_w'],
    // Border + letter combos
    ['border_mexico', 'starts_m', 'starts_w'],
    ['pop_lt1m', 'border_mexico', 'letters_8'],
    // Coastal combos
    ['coast_gulf', 'starts_w', 'has_new'],
    ['coast_gulf', 'starts_c', 'has_new'],
    ['coast_gulf', 'tz_pacific', 'has_new'],
    ['tz_pacific', 'starts_a', 'has_new'],
    // Northeast + geographic combos
    ['region_northeast', 'coast_gulf', 'tz_mountain'],
    ['region_northeast', 'tz_mountain', 'tz_pacific'],
    ['region_northeast', 'tz_pacific', 'on_mississippi'],
    ['region_northeast', 'border_mexico', 'on_mississippi'],
    // New England combos
    ['sub_new_england', 'coast_gulf', 'tz_mountain'],
    ['sub_new_england', 'tz_mountain', 'tz_pacific'],

    // ──────────── EXPANDED GROUPS (objective only) ────────────
    // Cultural belt combos
    ['sun_belt', 'snow_belt', 'pacific_northwest'],
    ['bible_belt', 'rust_belt', 'pacific_northwest'],
    ['bible_belt', 'sub_new_england', 'sub_pacific'],
    ['corn_belt', 'sub_new_england', 'sub_mountain'],
    ['black_belt', 'sub_new_england', 'sub_pacific'],
    // Natural hazard combos
    ['tornado_alley', 'sub_new_england', 'sub_pacific'],
    ['hurricane_zone', 'sub_new_england', 'sub_mountain'],
    ['earthquake_zone', 'sub_new_england', 'sub_deep_south'],
    // Food / agriculture combos
    ['dairy_state', 'sub_deep_south', 'sub_mountain'],
    ['citrus_state', 'sub_new_england', 'sub_plains'],
    ['lobster_state', 'sub_deep_south', 'sub_pacific'],
    ['tobacco_state', 'sub_new_england', 'sub_pacific'],
    ['cotton_belt', 'sub_new_england', 'sub_pacific'],
    // Politics
    ['blue_wall', 'sub_new_england', 'sub_deep_south'],
    ['swing_state_2024', 'sub_new_england', 'sub_pacific'],
    // Geography
    ['has_yellowstone', 'sub_new_england', 'sub_deep_south'],
    ['has_volcano', 'sub_new_england', 'sub_deep_south'],
    ['on_appalachian_trail', 'sub_pacific', 'sub_plains'],
    ['high_elevation', 'sub_new_england', 'sub_deep_south'],
    // History
    ['statehood_pre_1800', 'statehood_1900s', 'sub_plains'],
    ['underground_railroad', 'sub_deep_south', 'sub_pacific'],
    // Industry (factual)
    ['coal_state', 'sub_new_england', 'sub_pacific'],
    ['nasa_facility', 'sub_new_england', 'sub_plains'],
  ];

  const ALL_CONSTRAINTS = [
    // Regions
    'region_west', 'region_south', 'region_midwest', 'region_northeast',
    // Subregions (kept core ones; upland_south + midwest_rust removed)
    'sub_new_england', 'sub_mid_atlantic', 'sub_deep_south',
    'sub_plains', 'sub_mountain', 'sub_pacific',
    // Population
    'pop_lt1m', 'pop_1m5m', 'pop_5m10m', 'pop_gt10m',
    // Coastline / borders
    'coast_atlantic', 'coast_pacific', 'coast_gulf', 'coast_great_lakes',
    'landlocked', 'border_canada', 'border_mexico',
    // Politics (recent elections only — older ones too memory-heavy)
    'political_red', 'political_blue', 'political_swing',
    'trump_2024', 'biden_2020',
    // Timezones
    'tz_eastern', 'tz_central', 'tz_mountain', 'tz_pacific',
    // History (iconic only)
    'original_13', 'confederate',
    // Geography & landscape
    'on_mississippi', 'mt_rockies', 'mt_appalachians',
    'desert_state', 'four_corners', 'great_plains', 'appalachian',
    // Culture / belts
    'bible_belt', 'rust_belt', 'route_66',
    // Cities & size
    'has_million_city', 'largest_state', 'smallest_state',
    // Pro sports (borderline — kept all per user request)
    'has_nba', 'has_nfl', 'has_mlb', 'has_nhl', 'no_pro_team',
    // Name properties (cleaned)
    'two_word_name', 'ends_in_vowel', 'double_letter',
    'vowel_start', 'consonant_start',
    'letters_5', 'letters_8',
    'starts_a', 'starts_c', 'starts_m', 'starts_n', 'starts_w',
    'has_new',

    // ──────────── EXPANDED CONSTRAINTS (objective only) ────────────
    // Regional belts / zones — all are well-defined geo-cultural concepts
    'sun_belt', 'snow_belt', 'corn_belt', 'wheat_belt', 'cotton_belt',
    'black_belt', 'dust_bowl', 'pacific_northwest', 'mason_dixon',
    // Natural hazards & geographic features (factual)
    'tornado_alley', 'hurricane_zone', 'earthquake_zone',
    'has_volcano', 'has_glaciers', 'has_fourteener', 'has_islands',
    'has_yellowstone', 'on_appalachian_trail', 'on_pacific_crest_trail',
    'on_continental_divide', 'has_caves', 'high_elevation', 'low_elevation',
    'multi_timezone',
    // Agriculture / food — factual top-producer states
    'dairy_state', 'wine_country', 'apple_state', 'peach_state', 'citrus_state',
    'cranberry_state', 'maple_syrup_state', 'lobster_state', 'peanut_state',
    'tobacco_state', 'potato_state', 'cheese_state', 'corn_state',
    // Pop culture — only factual (legalized casinos)
    'casino_state',
    // Sports — factual presence of a team / venue
    'has_mls', 'has_wnba', 'nascar_speedway',
    // History — factual
    'statehood_pre_1800', 'statehood_1900s', 'trail_of_tears',
    'underground_railroad', 'civil_war_major_battle',
    // Politics — factual
    'swing_state_2024', 'blue_wall', 'early_primary',
    'capital_named_after_president', 'capital_starts_with_s',
    // Industry — only factual presences (coal production, NASA site)
    'coal_state', 'nasa_facility',
    // Travel — only factual (count of national parks)
    'multiple_natl_parks',
    // Geographic relationships (factual: count of bordering states)
    'borders_6_plus', 'borders_few',
    // Name properties extra (computed, all objective)
    'ends_in_a', 'ends_in_o', 'ends_in_e', 'ends_in_n', 'ends_in_s',
    'starts_and_ends_vowel', 'contains_letter_k', 'contains_letter_w',
    'short_name', 'long_name', 'double_s', 'two_word_starts_n',
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
      case 'sub_mountain':    return state.subregion === 'southwest';
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
      case 'trump_2024':       return state.elections && state.elections['2024'] === 'r';
      case 'biden_2020':       return state.elections && state.elections['2020'] === 'd';
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
      case 'mt_appalachians': return Array.isArray(state.mountainRange) && state.mountainRange.includes('appalachians');
      case 'desert_state':    return !!state.desertState;
      case 'four_corners':    return !!state.fourCorners;
      case 'great_plains':    return !!state.greatPlains;
      case 'appalachian':     return !!state.appalachian;
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
      case 'has_nfl': return !!state.nflTeam;
      case 'has_mlb': return !!state.mlbTeam;
      case 'has_nhl': return !!state.nhlTeam;
      case 'no_pro_team': return !state.nbaTeam && !state.nflTeam && !state.mlbTeam && !state.nhlTeam;
      // Name
      case 'two_word_name':  return state.wordCount === 2;
      case 'ends_in_vowel':  return !!state.endsInVowel;
      case 'double_letter':  return !!state.doubleLetter;
      case 'vowel_start':    return 'AEIOU'.includes(state.startsWith);
      case 'consonant_start':return !'AEIOU'.includes(state.startsWith);
      case 'has_new':   return state.names.en.includes('New');
      case 'has_north': return state.names.en.includes('North');
      case 'has_south': return state.names.en.includes('South');

      // ───────── 100 NEW CONSTRAINTS ─────────
      // Regional belts / zones
      case 'sun_belt':          return !!state.sunBelt;
      case 'snow_belt':         return !!state.snowBelt;
      case 'corn_belt':         return !!state.cornBelt;
      case 'wheat_belt':        return !!state.wheatBelt;
      case 'cotton_belt':       return !!state.cottonBelt;
      case 'black_belt':        return !!state.blackBelt;
      case 'dust_bowl':         return !!state.dustBowl;
      case 'pacific_northwest': return !!state.pacificNorthwest;
      case 'heartland':         return !!state.heartland;
      case 'mason_dixon':       return !!state.masonDixon;
      // Natural hazards & features
      case 'tornado_alley':         return !!state.tornadoAlley;
      case 'hurricane_zone':        return !!state.hurricaneZone;
      case 'earthquake_zone':       return !!state.earthquakeZone;
      case 'has_volcano':           return !!state.hasVolcano;
      case 'has_glaciers':          return !!state.hasGlaciers;
      case 'has_fourteener':        return !!state.hasFourteener;
      case 'has_islands':           return !!state.hasIslands;
      case 'has_yellowstone':       return !!state.hasYellowstone;
      case 'on_appalachian_trail':  return !!state.appalachianTrail;
      case 'on_pacific_crest_trail':return !!state.pacificCrestTrail;
      case 'on_continental_divide': return !!state.continentalDivide;
      case 'has_caves':             return !!state.hasCaves;
      case 'high_elevation':        return !!state.highElevation;
      case 'low_elevation':         return !!state.lowElevation;
      case 'multi_timezone':        return !!state.multiTimezone;
      // Agriculture / food
      case 'dairy_state':       return !!state.dairyState;
      case 'wine_country':      return !!state.wineCountry;
      case 'apple_state':       return !!state.appleState;
      case 'peach_state':       return !!state.peachState;
      case 'citrus_state':      return !!state.citrusState;
      case 'cranberry_state':   return !!state.cranberryState;
      case 'maple_syrup_state': return !!state.mapleSyrupState;
      case 'lobster_state':     return !!state.lobsterState;
      case 'peanut_state':      return !!state.peanutState;
      case 'tobacco_state':     return !!state.tobaccoState;
      case 'potato_state':      return !!state.potatoState;
      case 'bbq_tradition':     return !!state.bbqTradition;
      case 'craft_beer_hub':    return !!state.craftBeerHub;
      case 'cheese_state':      return !!state.cheeseState;
      case 'corn_state':        return !!state.cornState;
      // Music / pop culture
      case 'country_music':  return !!state.countryMusic;
      case 'blues_state':    return !!state.bluesState;
      case 'jazz_state':     return !!state.jazzState;
      case 'hollywood_film': return !!state.hollywoodFilm;
      case 'casino_state':   return !!state.casinoState;
      // Sports new
      case 'has_mls':         return !!state.hasMls;
      case 'has_wnba':        return !!state.hasWnba;
      case 'ski_state':       return !!state.skiState;
      case 'nascar_speedway': return !!state.nascarSpeedway;
      case 'golf_destination':return !!state.golfDestination;
      // History
      case 'statehood_pre_1800':   return !!state.statehoodPre1800;
      case 'statehood_1900s':      return !!state.statehood1900s;
      case 'trail_of_tears':       return !!state.trailOfTears;
      case 'underground_railroad': return !!state.undergroundRailroad;
      case 'civil_war_major_battle': return !!state.civilWarMajorBattle;
      // Politics new
      case 'swing_state_2024':            return !!state.swingState2024;
      case 'blue_wall':                   return !!state.blueWall;
      case 'early_primary':               return !!state.earlyPrimary;
      case 'capital_named_after_president': return !!state.capitalNamedAfterPresident;
      case 'capital_starts_with_s':       return !!state.capitalStartsWithS;
      // Demographics
      case 'high_hispanic':         return !!state.highHispanic;
      case 'high_black_pop':        return !!state.highBlackPop;
      case 'high_asian_pop':        return !!state.highAsianPop;
      case 'high_native_pop':       return !!state.highNativePop;
      case 'urban_state':           return !!state.urbanState;
      case 'rural_state':           return !!state.ruralState;
      case 'fast_growing':          return !!state.fastGrowing;
      case 'population_decline':    return !!state.populationDecline;
      case 'retirement_destination':return !!state.retirementDestination;
      case 'high_college_pct':      return !!state.highCollegePct;
      // Economy
      case 'tech_hub':             return !!state.techHub;
      case 'auto_industry':        return !!state.autoIndustry;
      case 'coal_state':           return !!state.coalState;
      case 'nasa_facility':        return !!state.nasaFacility;
      case 'military_heavy':       return !!state.militaryHeavy;
      case 'fossil_fuel_dominant': return !!state.fossilFuelDominant;
      case 'wind_energy_leader':   return !!state.windEnergyLeader;
      case 'financial_hub':        return !!state.financialHub;
      // Travel
      case 'major_theme_park':    return !!state.majorThemePark;
      case 'cruise_port':         return !!state.cruisePort;
      case 'multiple_natl_parks': return !!state.multipleNatlParks;
      // Geographic relationships
      case 'borders_6_plus':  return !!state.borders6Plus;
      case 'borders_few':     return !!state.bordersFew;
      // Name properties extra (computed)
      case 'ends_in_a':              return state.endsWith === 'A';
      case 'ends_in_o':              return state.endsWith === 'O';
      case 'ends_in_e':              return state.endsWith === 'E';
      case 'ends_in_n':              return state.endsWith === 'N';
      case 'ends_in_s':              return state.endsWith === 'S';
      case 'starts_and_ends_vowel':  return 'AEIOU'.includes(state.startsWith) && state.endsInVowel;
      case 'contains_letter_k':      return state.names.en.toUpperCase().includes('K');
      case 'contains_letter_w':      return state.names.en.toUpperCase().includes('W');
      case 'short_name':             return state.letterCount <= 5;
      case 'long_name':              return state.letterCount >= 10;
      case 'double_s':               return /SS/i.test(state.names.en);
      case 'two_word_starts_n':      return state.wordCount === 2 && state.startsWith === 'N';

      default: return false;
    }
  }

  function getEligible(states, rowC, colC) {
    return states.filter(s => matches(s, rowC) && matches(s, colC));
  }

  // Check if a 3×3 grid has exactly 1 valid assignment (global backtracking)
  function hasUniqueSolution(grid) {
    const used = new Set();
    let count = 0;
    function bt(idx) {
      if (count > 1) return;
      if (idx === 9) { count++; return; }
      const r = Math.floor(idx / 3), c = idx % 3;
      for (const s of grid[r][c]) {
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
    // Geographic features with cultural weight
    'on_mississippi', 'four_corners',
    'mt_rockies', 'mt_appalachians',
    'desert_state', 'route_66',
    // Cultural regions
    'sub_new_england', 'sub_deep_south', 'sub_mid_atlantic', 'sub_mountain',
    'rust_belt', 'bible_belt',
    // Misc
    'great_plains', 'appalachian', 'two_word_name',
    // Expanded culturally weighted (objective only)
    'sun_belt', 'snow_belt', 'corn_belt', 'wheat_belt', 'cotton_belt',
    'black_belt', 'dust_bowl', 'pacific_northwest', 'mason_dixon',
    'tornado_alley', 'hurricane_zone', 'has_volcano', 'has_yellowstone',
    'on_appalachian_trail', 'wine_country',
    'trail_of_tears', 'underground_railroad',
    'civil_war_major_battle', 'statehood_pre_1800', 'statehood_1900s',
    'casino_state', 'blue_wall',
  ]);
  const SCORE1 = new Set([
    'coast_gulf', 'coast_atlantic', 'coast_pacific', 'coast_great_lakes',
    'border_mexico', 'border_canada', 'landlocked',
    'political_swing', 'political_red', 'political_blue',
    'trump_2024', 'biden_2020',
    'has_million_city', 'largest_state', 'smallest_state',
    'has_nba', 'has_nfl', 'has_mlb', 'has_nhl', 'no_pro_team',
    'has_new', 'has_north', 'has_south',
    'double_letter', 'ends_in_vowel',
    // Expanded lighter weight (objective only)
    'earthquake_zone', 'has_glaciers', 'has_fourteener', 'has_islands',
    'high_elevation', 'low_elevation', 'multi_timezone',
    'dairy_state', 'apple_state', 'peach_state', 'citrus_state',
    'maple_syrup_state', 'lobster_state', 'peanut_state', 'tobacco_state',
    'potato_state', 'cheese_state', 'corn_state',
    'has_mls', 'has_wnba', 'nascar_speedway',
    'swing_state_2024', 'early_primary',
    'coal_state', 'nasa_facility', 'multiple_natl_parks',
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
    // Cap at 22 to bound the C(n,3) search cost while still exploring widely.
    const availableCols = colPool.filter(c => {
      if (usedRowIds.has(c)) return false;
      return rowStateSets.every(rs => rs.some(s => matches(s, c)));
    }).slice(0, 22);

    const found = [];
    for (let i = 0; i < availableCols.length - 2; i++) {
      for (let j = i + 1; j < availableCols.length - 1; j++) {
        for (let k = j + 1; k < availableCols.length; k++) {
          const cols = [availableCols[i], availableCols[j], availableCols[k]];

          const grid = rowStateSets.map(rs =>
            cols.map(cc => rs.filter(s => matches(s, cc)))
          );

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

  // Score a puzzle: cultural/historical constraints = 2pts, geographic/political = 1pt
  function _score(puzzle) {
    let s = 0;
    for (const c of [...puzzle.rows, ...puzzle.cols]) {
      if (SCORE2.has(c)) s += 2;
      else if (SCORE1.has(c)) s += 1;
    }
    return s;
  }

  // Row constraints that are "boring" (pure letter/count properties).
  // Groups where ALL rows are boring are deprioritised — used only as fallback.
  const BORING_ROW = new Set([
    'letters_5','letters_8',
    'vowel_start','consonant_start',
    'starts_a','starts_c','starts_m','starts_n','starts_s','starts_w',
    'ends_in_a','ends_in_o','ends_in_e','ends_in_n','ends_in_s',
    'starts_and_ends_vowel','contains_letter_k','contains_letter_w',
    'short_name','long_name','double_s','two_word_starts_n',
  ]);

  function _generateForSeed(baseSeed, states, excludeGroup) {
    // Use the active (non-disabled) row groups + column constraints
    const activeGroups = _activeRowGroups();
    const activeCols = _activeConstraints();
    const n = activeGroups.length;
    if (n === 0) return null;
    const startGi = Math.floor(mulberry32(baseSeed)() * n);

    const interestingOrder = [];
    const boringOrder = [];
    for (let offset = 0; offset < n; offset++) {
      const gi = (startGi + offset) % n;
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
      const options = _tryRowGroup(activeGroups[gi], colPool, states, 8);
      if (options.length === 0) continue;

      const maxGroupScore = Math.max(...options.map(_score));
      const topGroupTier = options.filter(o => _score(o) >= maxGroupScore - 1);
      const best = topGroupTier[Math.floor(selectRng() * topGroupTier.length)];
      return { date: null, ...best, _activeGroupIdx: gi };
    }
    return null;
  }

  function generatePuzzle(dateStr, states) {
    const baseSeed = dateToSeed(dateStr);

    // Compute yesterday's row group to avoid same-group repeats.
    const [y, m, d] = dateStr.split('-').map(Number);
    const prevDate = new Date(y, m - 1, d - 1);
    const prevStr = prevDate.toISOString().slice(0, 10);
    const prevSeed = dateToSeed(prevStr);
    const prevPuzzle = _generateForSeed(prevSeed, states, -1);
    const activeGroups = _activeRowGroups();
    const prevGroupIdx = prevPuzzle
      ? activeGroups.findIndex(g => g.join() === prevPuzzle.rows.join())
      : -1;

    const result = _generateForSeed(baseSeed, states, prevGroupIdx);
    if (result) { const { _activeGroupIdx, ...rest } = result; return { ...rest, date: dateStr }; }

    // Absolute fallback — should never be reached
    return generatePuzzleRelaxed(dateStr, states, mulberry32(baseSeed));
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

  // ── Disabled constraints (dev panel) ────────────────────────────────────
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
    return ALL_CONSTRAINTS.filter(c => !dis.has(c));
  }
  function _activeRowGroups() {
    const dis = _getDisabled();
    return MUTEX_ROW_GROUPS.filter(g => !g.some(c => dis.has(c)));
  }

  async function loadStates() {
    if (_states) return _states;
    const base = location.pathname.includes('/fr/') || location.pathname.includes('/es/')
      ? '../data/states.json' : 'data/states.json';
    const res = await fetch(base);
    _states = await res.json();
    return _states;
  }

  async function getPuzzle(dateStr) {
    if (_puzzleCache[dateStr]) return _puzzleCache[dateStr];

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

  function getTodayStr() {
    const d = new Date();
    const y = d.getFullYear();
    const m = String(d.getMonth() + 1).padStart(2, '0');
    const day = String(d.getDate()).padStart(2, '0');
    return `${y}-${m}-${day}`;
  }

  // ── Public API ──────────────────────────────────────────────────────────
  function getAllConstraints() { return ALL_CONSTRAINTS.slice(); }
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

  return { getPuzzle, getTodayStr, loadStates, matches,
           getAllConstraints, getAllRowGroups, getDisabled, setDisabled, countMatching };
})();
