// ─────────────────────────────────────────────────────────────────────────
// Statedoku — Approved pending constraints (committed to the repo)
//
// These are pending-constraint IDs that have been admin-reviewed in
// /admin/constraints/ and accepted as part of the live pool. Promoted here
// from localStorage so all players (not just the admin) get the expanded
// pool of column constraints.
//
// To update: in Safari console on /admin/constraints/, run
//   prompt('copy:', localStorage.statedoku_approved_pending)
// Then replace the array below.
// ─────────────────────────────────────────────────────────────────────────

const APPROVED_PENDING = [
  "pc_publix",
  "pc_ikea",
  "pc_in_n_out_present",
  "pc_super_bowl_host",
  "pc_pro_team_animal_name",
  "pc_big12_school",
  "pc_olympics_host_any",
  "pc_real_housewives_franchise",
  "pc_stephen_king_setting",
  "pc_marvel_mcu_us_setting",
  "pc_pixar_film_setting",
  "pc_tarantino_setting",
  "pc_six_flags_park",
  "pc_top10_engineering_uni",
  "pc_top10_law_school",
  "pc_top10_med_school",
  "pc_nasa_facility",
  "pc_major_cruise_port",
  "pc_ivy_league_home",
  "pc_top_business_school",
  "pc_top_liberal_arts",
  "pc_iconic_cocktail",
  "pc_disaster_movie_set",
  "pc_cop_show_setting",
  "pc_medical_drama_set",
  "pc_long_river_state",
  "pc_underground_subway",
  "pc_movie_spielberg",
  "pc_movie_scorsese",
  "pc_movie_anderson_wes",
  "pc_movie_eastwood",
  "pc_movie_marvel_loc",
  "pc_movie_pixar_inspo",
  "pc_music_taylor_swift",
  "pc_music_beyonce_tour",
  "pc_music_dylan_song",
  "pc_born_president_post60",
  "pc_born_first_lady",
  "pc_volcano_active",
  "pc_amusement_park_top",
  "pc_hist_spanish_colonial",
  "pc_hist_french_colonial",
  "pc_red_state_consistent",
  "pc_blue_state_consistent",
  "pc_christopher_nolan_us",
  "pc_largest_state_area",
  "pc_smallest_state_area",
  "pc_top_population_2",
  "pc_lowest_population",
  "pc_state_capital_small",
  "pc_contains_k",
  "pc_contains_w",
  "pc_contains_h",
  "pc_contains_y",
  "pc_contains_double_a",
  "pc_contains_substring_an",
  "pc_contains_substring_or",
  "pc_contains_substring_in",
  "pc_contains_substring_is",
  "pc_letters_12_plus",
  "pc_two_syllables",
  "pc_borders_canada",
  "pc_great_lakes_2",
  "pc_sea_level_low",
  "pc_thirteen_colonies",
  "pc_admitted_before_1800",
  "pc_admitted_20th_century",
  "pc_named_after_person",
  "pc_named_after_river",
  "pc_named_native_tribe",
  "pc_french_origin_name",
  "pc_capital_is_largest",
  "pc_capital_under_50k",
  "pc_eastern_time",
  "pc_central_time",
  "pc_mountain_time",
  "pc_multiple_time_zones"
];

if (typeof window !== 'undefined') {
  window.APPROVED_PENDING = APPROVED_PENDING;
}
