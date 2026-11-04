# Content queue

Read by the daily content session (`scripts/content/DAILY.md`), first `todo`
first. Evidence is Bing (weekly impressions from `bing-keywords-2026-10-31.json`,
page figures from `bing-2026-10-31.json`), the only engine sending traffic:
Bing, Yahoo, DuckDuckGo and Ecosia, all on Bing's index, made 4,120 of the
4,509 organic sessions in the 28 days to 30 October; Google made 57.

Status: `todo`, `done YYYY-MM-DD <commit>`, `dropped (<reason>)`.

## Current

Timely units (DAILY.md, "Current events"). An "update until" item takes
priority over the rest of the queue while it runs.

C1. `running` **2026 midterm elections**, `/learn/2026-midterm-elections/`,
    `/fr/learn/elections-mi-mandat-2026/`, `/es/learn/elecciones-intermedias-2026/`,
    published 4 November 2026 the day after the vote. Update until every Senate
    and governor race is called, then once more after the states certify
    (December) and when the new Congress is sworn in (3 January 2027). Each
    update: re-check every `not_called` row and the House counts (AP calls as
    reported by AP articles, NBC News, CNN or the state's election office, read
    normally, see DAILY.md), change only rows AP has called, with a second
    outlet in `sources`, move `as_of_utc`, rebuild, run the fact-checker on the
    changed rows. On 4 November at 08:27 UTC: Senate AK, MS, NE and governors
    AK, KS, NV, OR not called; House 81 seats not called (80 counting, Louisiana
    5th to a runoff). An independent winner would be counted apart from both
    caucuses until he or she says which one to join.
    Update 4 November, data read 09:18 UTC (736f50d2c): Nebraska Senate
    (Ricketts, R) and Oregon governor (Kotek, D) called by AP. Still not called:
    Senate AK, MS; governors AK, KS, NV (Alaska goes to ranked-choice tabulation
    on 18 November). The House tally stays dated 08:27 UTC: AP's JSON refuses
    automated reads (403) and no other page gave AP's count; the builder now
    prints the House date apart (`house_control.as_of_utc`). Next update: find an
    AP House count (AP wire copy, or NBC/CNN pages that state AP's numbers),
    then the five open races.
C2. `todo` (late December 2026) **Census Bureau state population estimates
    (Vintage 2026)**: update the population rankings on
    `/learn/states-by-population/` and its translations
    (`/learn/most-populous-states/` is retired, noindex, since 4 November) the week the release is out. Check the date on census.gov.
C3. `todo` (3 January 2027) **The 120th Congress**: the House and Senate
    delegations by state as sworn in, on the midterms pages.
C4. `todo` (January 2027) **New governors take office**: inauguration dates
    by state on the midterms pages.
C5. `todo` (before 14 March 2027) **Daylight saving time starts**: the states
    and territories that do not change, on the time zone pages.

Refill this section from the calendar: a dated official release or event
about the states, two to four weeks ahead, one at a time.

## Maps the titles already promise

Three ranking pages say "map" in their title and carry none. These come first:
the pages are already shown, the queries already exist, nothing new competes.

1. `todo` **13 colonies map** on `/learn/13-colonies/`, then `/fr/learn/13-colonies/`
   and `/es/learn/13-colonies/`. Title "13 Original Colonies in Order: Full List,
   Map, Dates", no map on the page. Demand: "13 colonies" 12,411, "13 colonies
   map" 10,035. Page: 3,231 impressions a week, position 6, 31 clicks. Map of the
   13 on modern outlines, with a plain note on what differs (Maine inside
   Massachusetts, Vermont claimed by New York and New Hampshire, the western
   claims), and the three regional groups (New England, Middle, Southern).
2. `todo` **US time zone map** on `/learn/states-by-time-zone/`, then
   `/fr/learn/fuseaux-horaires-etats-unis/` and `/es/learn/zonas-horarias-eeuu/`.
   Demand: "time zone map" 28,598, "time zones" 27,197, "us time zones" 12,538,
   "us time zone map" 7,954, "time zone map usa" 7,146, and per state "arizona
   time zone" 10,238, "california" 9,919, "texas" 9,912, "central time zone"
   9,350, "eastern time zone" 9,243, "chicago" 8,425, "ohio" 7,702, "michigan"
   6,743, "colorado" 6,291, "indiana" 6,174, "pacific" 5,679, "florida" 5,420,
   "hawaii" 5,386, "utah" 5,271. Map coloured by zone with the 14 split states
   marked, and one table row per state answering "what time zone is X in"
   (split states named with the part on each side). One page, not 50.
3. `todo` **Interactive map of the 50 states** on `/states/` (and `/es/states/`).
   Title "All 50 States in the USA (Map, Capitals, Facts)", 322 words, no map.
   Demand: "us map" 139,654, "us map of states" 49,989, "interactive us map"
   14,861, "us state map" 11,946, "map of us states" 7,398, "50 states map"
   5,340. The hub is weak on Bing (2,769 impressions, 8 clicks in 4 weeks). A
   map where each state links to its page, with name, code and capital, plus
   a lead that answers "how many states" and the regions. The head terms are
   out of reach; the long tail ("us map with states", "interactive") is not.

## New pages with demand and no page

4. `todo` **Mississippi River states**, new, EN then FR and ES. "Which states
   does the Mississippi River border?" The ten states (Minnesota, Wisconsin,
   Iowa, Illinois, Missouri, Kentucky, Tennessee, Arkansas, Mississippi,
   Louisiana), which bank each is on, source and mouth, length, the main
   tributaries, the river as a state border. Demand: "mississippi river" 11,485.
   It is also a clue of the daily grid (`on_mississippi`): link the game.
   Check `/learn/longest-rivers-in-each-state/` first; it has one section on the
   river and must link to the new page, not compete with it.
5. `todo` **The US flag**, new, EN then FR and ES. Why 50 stars and 13 stripes,
   the 27 versions and the state whose admission added each star, the 1818
   Flag Act, the current flag since 4 July 1960. Demand: "us flag" 9,986,
   "flag of the united states" 6,994. `/learn/state-flags/` covers the 50 state
   flags; link both ways, do not repeat it.
6. `todo` **Colorado River states**, new, EN. The seven basin states, the upper
   and lower basins, the 1922 compact, Hoover and Glen Canyon dams, the river
   reaching Mexico. Demand: "colorado river" 5,708. Same check against the
   rivers page as item 4.

## Deepen what already ranks

7. `todo` **Great Lakes map** on `/learn/states-with-great-lakes/`: the eight
   states and which lakes each touches, on a map. Demand: "great lakes map" 6,572.
8. `todo` **National parks map** on `/learn/national-parks-by-state/`: parks per
   state on a map. Demand: "national parks map" 5,336.
9. `todo` **French pages Google crawled and refused.** Google indexes 4 of the 33
   indexable `fr/learn/` pages (gsc-index-2026-10-31). Take the French pages
   marked "Crawled, currently not indexed", most impressions first, and give
   each a direct answer in its first paragraph and a section the English page
   does not have. One page per unit.
10. `todo` **Next step from `/es/learn/state-abbreviations/`**: 269 entrances in
    28 days, 7% go on to a second page (behavior-2026-10-31). Put the matching
    Spanish game and the daily grid before the first table, as was done on the
    four English articles on 17 October.

## From the full review of 4 November 2026

Verified by the three review passes of that day; the clear factual errors were
fixed the same day (Las Vegas, French Electoral College heading, Texas state
tree, Wyoming women's vote, Lake of the Woods, the Jackson marker sentence).
Take these as deepening units, one a day, fact-checker on each:

R1. `todo, table verified` (4 November: `scripts/data/highpoints/highpoints.json`
    is one figure per peak, every row checked by a second, independent pass
    against NGS datasheets, USGS 3DEP lidar and NCAT; 10 rows of the first
    draft were wrong and are corrected there: AL, CT, DE, ME, MN, NE, ND, SC,
    VA, WV). Before applying: `inventory.json` lists only the figures that
    differed from the first draft, so re-scan the pages for the 10 corrected
    states (e.g. Mount Rogers 5,729 is on pages and is wrong, 5,711), recompute
    the relief figures in `derived.json`, write Delaware as "about 450 feet"
    with the marker a few feet lower, and reword the French table caption
    ("chiffres officiels USGS"). Then `python3 scripts/apply-highpoints.py`,
    fact-checker on the diff.
    **Highpoint elevations disagree between pages**: Mount Hood 11,239
    vs 11,249 ft, Borah Peak 12,668 vs 12,662, Humphreys 12,633 vs 12,637,
    Wheeler 13,167 vs 13,161, Black Mesa 4,975 vs 4,973, Mansfield 4,395 vs
    4,393, Hawkeye Point 1,671 vs 1,670, Boundary Peak and Black Elk Peak in
    metres. One survey (USGS / NGS), one figure per peak, on every page and in
    the three languages (`learn/highest-mountain-in-each-state/`,
    `learn/states-with-mountains/`, the state pages, FR and ES equivalents).
R2. `done 2026-11-04 3ac26f54a` **Andrew Jackson's birth state**: the FR and ES presidents pages count
    him for North Carolina as settled; make all three say it is disputed, as
    `/states/south-carolina/people/` does, and check the counts that follow.
R3. `done 2026-11-04 5d2e6f6ef` (region lists and quiz traps; the
    interactive map stays item 3) **Thin hubs Google has indexed**: `/quiz/` (166 words), `/states/`
    (316) and `/es/states/` (246). A real intro that leads with the answer
    (the 50 states by region, how many, what each page holds). Pair with Q3.
R4. `done 2026-11-04 f18ef35bb` **French and Spanish copy a native reader would notice**: "Tous les
    états" (18 pages, États), "streak conservé entre les jours" (18 play pages),
    "Mid-Atlantic" and "au lieu de Mountain" left in English, "3 branches"
    (trois pouvoirs), "Un grizzly (espèce éteinte)" (sous-espèce disparue),
    straight quotes; Spanish "en lugar de Mountain", "Guerra Revolucionaria"
    (Guerra de Independencia), "3 ramas" (3 poderes), "oso pardo (extinguido)";
    "New Hampshire" against "Nouveau-Hampshire" / "Nuevo Hampshire".
R5. `done 2026-11-04 7fbcf5cd7` **Duplicates Google crawled and refused**: `fr/learn/fleuves-des-etats-unis/`
    (duplicates `fleuves-par-etat-americain`), `fr/learn/montagnes-des-etats-unis/`,
    `es/learn/montanas-mas-altas-eeuu/`, `learn/most-populous-states/` (same
    intent as `states-by-population`): noindex and point their links to the
    page that covers the intent, the way the 5 October retirements were done.
R6. `dropped (false alarm: data/states.json holds the corrected values;
    STATE_FIXES in js/puzzle.js keep the old ones for grids dated before the
    cut-overs, so /api/states already serves corrected data)` **The public API serves the raw data**: `/api/states` reads
    `data/states.json`, which keeps the pre-correction values for old grids
    (CLAUDE.md, Facts on the page). Apply the `STATE_FIXES` corrections there,
    or document that it is the game's raw file.
R7. `done 2026-11-04 b044b1789` (security, small) Rate-limit `/api/stats` and the admin endpoints
    like `/api/admin/verify`; send the address in the body when deleting a
    subscriber (it is in the URL); clamp `limit`; refuse cross-origin posts to
    `/api/events`.

## Done

(none yet)
