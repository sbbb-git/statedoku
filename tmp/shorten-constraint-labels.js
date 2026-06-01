#!/usr/bin/env node
/**
 * Shorten constraint labels >28 chars so they fit in a 3×3 grid cell label.
 *
 *   • Core constraints → patch data/translations.json
 *   • Pending candidates → patch js/constraints-pending.js (per-line add() calls)
 *
 * Idempotent: a label is only rewritten if the current value matches the
 * "old" text. If the file already has the shorter version, this is a no-op.
 */
const fs = require('fs');
const path = require('path');
const ROOT = path.resolve(__dirname, '..');

// Map: id → { lang: [oldLabel, newLabel] }
// Each entry: only listed (lang, old) pairs are rewritten. Others left untouched.
const REWRITES = {
  // ── core (translations.json) ──
  name_royalty_origin: {
    en: ['Named after a king, queen or noble', 'Named after royalty'],
    fr: ["Nommé d'après un roi, une reine ou un noble", "Nommé d'après un noble"],
    es: ['Nombrado por un rey, reina o noble', 'Nombre de la realeza'],
  },
  name_native_origin: {
    en: ['Named from a Native American language', 'Native American name'],
    es: ['Nombre de origen nativo americano', 'Nombre nativo americano'],
  },
  has_million_city: {
    fr: ["Ville d'un million d'habitants", "Ville d'un million d'hab"],
  },
  capital_named_after_president: {
    en: ['Capital named after a president', 'Capital named for a president'],
    fr: ["Capitale au nom d'un président", "Capitale du nom d'un président"],
    es: ['Capital con nombre de presidente', 'Capital con nombre presidencial'],
  },
  starts_and_ends_vowel: {
    fr: ['Commence et finit par voyelle', 'Voyelle: début + fin'],
  },
  two_word_starts_n: {
    en: ['Two-word name starting with N', 'Two words, starts with N'],
  },

  // ── pending (constraints-pending.js) ──
  pc_born_president_post60: {
    en: ['🏛️ Birth state of a post-1960 US president', '🏛️ Born a post-1960 US president'],
    fr: ['Naissance président post-1960', 'Né: président post-1960'],
    es: ['Cuna presidente post-1960', 'Cuna: presidente post-1960'],
  },
  pc_capital_is_largest: {
    en: ['🏛️ Capital is also the largest city', '🏛️ Capital = largest city'],
  },
  pc_iconic_cocktail: {
    en: ['🍹 Has a signature cocktail named after it', '🍹 Has a signature cocktail'],
  },
  pc_movie_pixar_inspo: {
    en: ['🎬 Visual inspiration for a Pixar film', '🎬 Inspired a Pixar film'],
  },
  pc_state_capital_small: {
    en: ['🏛️ State capital is small (<100k pop)', '🏛️ Capital under 100k pop'],
  },
  pc_sea_level_low: {
    en: ['🏖️ Lowest point near/below sea level', '🏖️ Low point near sea level'],
  },
  pc_music_beyonce_tour: {
    en: ['🎤 Beyoncé Renaissance Tour US stops', '🎤 Beyoncé Renaissance stop'],
  },
  pc_movie_eastwood: {
    en: ['🎬 Setting of a Clint Eastwood film', '🎬 Clint Eastwood film setting'],
  },
  pc_real_housewives_franchise: {
    en: ['📺 Has a Real Housewives franchise', '📺 Real Housewives city'],
    fr: ['Une franchise des Real Housewives', 'Ville Real Housewives'],
    es: ['Una franquicia de Real Housewives', 'Ciudad Real Housewives'],
  },
  pc_stephen_king_setting: {
    en: ['👻 Setting of a Stephen King novel', '👻 Stephen King novel setting'],
  },
  pc_thirteen_colonies: {
    en: ['📜 One of the 13 original colonies', '📜 One of the 13 colonies'],
  },
  pc_pro_team_animal_name: {
    en: ['🦅 Pro team named after an animal', '🦅 Pro team animal name'],
    es: ['Equipo pro con nombre de animal', 'Equipo pro: nombre animal'],
  },
  pc_movie_anderson_wes: {
    en: ['🎬 Setting of a Wes Anderson film', '🎬 Wes Anderson film setting'],
  },
  pc_movie_marvel_loc: {
    en: ['🦸 Filmed at major Marvel studios', '🦸 Marvel filming location'],
  },
  pc_marvel_mcu_us_setting: {
    en: ['🦸 MCU film location in the US', '🦸 MCU US filming location'],
  },
  pc_tarantino_setting: {
    en: ['🎬 Setting of a Tarantino film', '🎬 Tarantino film setting'],
  },
  pc_top10_engineering_uni: {
    en: ['🔧 Top-10 engineering university', '🔧 Top engineering university'],
  },
  pc_top_business_school: {
    en: ['🎓 Has a top-10 business school', '🎓 Top-10 business school'],
  },
  pc_top_liberal_arts: {
    en: ['🎓 Has a top-10 liberal arts college', '🎓 Top liberal arts college'],
    fr: ['Top 10 colleges arts libéraux', 'Top collège arts libéraux'],
    es: ['Top 10 universidad de artes liberales', 'Top universidad artes lib.'],
  },
  pc_disaster_movie_set: {
    es: ['Escenario de película catástrofe', 'Escenario peli catástrofe'],
  },
  pc_cop_show_setting: {
    en: ['🚓 Setting of a major cop show', '🚓 Cop show setting'],
  },
  pc_medical_drama_set: {
    en: ['🏥 Setting of a medical TV drama', '🏥 Medical drama setting'],
  },
  pc_long_river_state: {
    en: ['🏞️ Bordered by major US river', '🏞️ On a major US river'],
  },
  pc_underground_subway: {
    en: ['🚇 Has a subway / metro system', '🚇 Has a subway/metro'],
  },
  pc_movie_spielberg: {
    en: ['🎬 Setting of a Spielberg film', '🎬 Spielberg film setting'],
  },
  pc_movie_scorsese: {
    en: ['🎬 Setting of a Scorsese film', '🎬 Scorsese film setting'],
  },
  pc_christopher_nolan_us: {
    en: ['🎬 US setting in a Nolan film', '🎬 Nolan film US setting'],
  },
  pc_music_dylan_song: {
    en: ['🎤 Subject of a Bob Dylan song', '🎤 Bob Dylan song subject'],
  },
  pc_music_taylor_swift: {
    en: ['🎤 Subject of a Taylor Swift song', '🎤 Taylor Swift song subject'],
  },
};

// ── 1. Patch translations.json ────────────────────────────────────────────
const transPath = path.join(ROOT, 'data/translations.json');
const trans = JSON.parse(fs.readFileSync(transPath, 'utf8'));
let coreUpdated = 0;
for (const [id, byLang] of Object.entries(REWRITES)) {
  if (id.startsWith('pc_')) continue;
  for (const [lang, [oldVal, newVal]] of Object.entries(byLang)) {
    if (trans[lang]?.constraints?.[id] === oldVal) {
      trans[lang].constraints[id] = newVal;
      coreUpdated++;
      console.log(`  CORE  ${id} [${lang}]: ${oldVal.length}→${newVal.length}`);
    } else if (trans[lang]?.constraints?.[id] === newVal) {
      // already updated
    } else {
      console.log(`  ⚠️  CORE  ${id} [${lang}]: current="${trans[lang]?.constraints?.[id]}" (expected old="${oldVal}")`);
    }
  }
}
fs.writeFileSync(transPath, JSON.stringify(trans, null, 2) + '\n');

// ── 2. Patch constraints-pending.js ──────────────────────────────────────
const pendPath = path.join(ROOT, 'js/constraints-pending.js');
let pend = fs.readFileSync(pendPath, 'utf8');
let pcUpdated = 0;
for (const [id, byLang] of Object.entries(REWRITES)) {
  if (!id.startsWith('pc_')) continue;
  for (const [lang, [oldVal, newVal]] of Object.entries(byLang)) {
    // Escape regex special chars in oldVal
    const esc = oldVal.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');
    // Pattern: a string literal containing exactly oldVal (handle ' escaping in file by accepting either ' or \\')
    const escWithJsApos = esc.replace(/'/g, "\\\\?'");
    const re = new RegExp(`'${escWithJsApos}'`, 'g');
    const before = pend;
    pend = pend.replace(re, `'${newVal.replace(/'/g, "\\'")}'`);
    if (pend !== before) {
      pcUpdated++;
      console.log(`  PEND  ${id} [${lang}]: ${oldVal.length}→${newVal.length}`);
    } else {
      // Check if already at new value
      const newEsc = newVal.replace(/[.*+?^${}()|[\]\\]/g, '\\$&').replace(/'/g, "\\\\?'");
      if (new RegExp(`'${newEsc}'`).test(pend)) {
        // already updated
      } else {
        console.log(`  ⚠️  PEND  ${id} [${lang}]: pattern not found (label may differ)`);
      }
    }
  }
}
fs.writeFileSync(pendPath, pend);

console.log(`\n✅ ${coreUpdated} core + ${pcUpdated} pending labels shortened.`);
