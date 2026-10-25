# Statedoku

Daily US-geography puzzle at statedoku.com. Static site, no backend, no build
step: the HTML in this repo is what ships. Trilingual EN / FR / ES.

Solo project. Ship carefully, there is no staging and no one else to catch it.

## Deploy

`git push` on `main` triggers `.github/workflows/deploy.yml`, which runs
`wrangler pages deploy` against the Cloudflare Pages project `statedoku`.
Cloudflare is **not** connected to the repo directly; the workflow is the
pipeline. Live about a minute after the push.

The Twitter bot in `bot/` is **not** in the site deploy. It is deployed from
the Actions tab, workflow "Posting bot (Buffer)" (`.github/workflows/bot.yml`):
`check` validates the `BUFFER_TOKEN` GitHub secret against Buffer, finds the X
channel and lists the worker's secret names without changing anything;
`deploy` also deploys `bot/` and copies `BUFFER_TOKEN` and the X channel id
into the worker's Cloudflare secrets. The worker reads Cloudflare secrets only,
which is why a key stored on GitHub does nothing until this runs. Logs are
public: `bot/buffer-check.mjs` prints counts, never a key or an id. By hand
still works: `cd bot && npx wrangler deploy`.

## History was rewritten on 8 October 2026

At the owner's request, `git filter-repo` removed `marketing/` and `tmp/` from
every commit (126 journalists' addresses), a third party's address and first
name, the owner's personal address and Mac paths, and his real name everywhere
except the three privacy pages, which carry it on purpose as data controller.
Authors became `sbbb-git <279963133+sbbb-git@users.noreply.github.com>`. The
final tree was byte-identical before and after. A clone older than that date
holds the old history: never pull, merge or push from it, re-clone or
`git fetch && git reset --hard origin/main`. Keep it that way: no personal
address, real name or third party in any commit, message or file.

## What ships and what does not

The repo holds more than the website. `wrangler pages deploy` has no exclude
flag, so the workflow copies the tree into a staging directory with
`--exclude-from=.deployignore` and deploys that. Anything listed there stays out
of statedoku.com.

This exists because it was not always so: `tmp/`, `marketing/`, `bot/` and
`email-worker/` were all served publicly, and `marketing/outreach-batch-3.md`
put 71 journalists' email addresses on the open web. robots.txt only asks
crawlers not to look, it does not stop anyone fetching the file.

The list is exclude-based on purpose. A new content directory ships by default;
only what is named is held back. The workflow fails the build if an excluded
directory reaches the deploy folder anyway.

`marketing/` and `tmp/` are gitignored and local-only. Reusable tooling goes in
`scripts/`, which stays in the repo but never deploys.

## The puzzle rule, which is not obvious

A cell is correct when the state **satisfies both visible clues**. Not when it
equals some intended answer. `js/game.js` calls `_isValidForCell(r, c, state)`
everywhere for this, and every place that judges correctness must use it:
scoring, cell rendering, the share grid, the share image, and the reload scrub
in `_loadProgress`.

Grids dated before 27 October 2026 have exactly one solution. From that date
(`DATA_FIX3_FROM`, see Facts on the page) every cell accepts at least two
states and a grid has at least one full solution, so several complete grids
can win. Either way the test is the same: both clues, nine different states.
An earlier version ran a solvability gate and rejected valid answers with a
"conflicts elsewhere" toast that could never be true. It refused 24.9% of
valid answers. Do not reintroduce it.

Because any valid answer is accepted, a player can spend a state another cell
needed. Filled cells are therefore editable and the picker has a Clear button.
Removing either brings back the dead end.

## Rules that bite

**Ads stay off.** `CONFIG.ADS_ENABLED` is `false` and stays false until AdSense
approves. Do not touch ad code, `/privacy/`, `/about/` or `/terms/` during a
review.

**Ad code lives only on pages with real content.** AdSense refused the site on
3 October 2026 (site state `NEEDS_ATTENTION`, no page-level policy issue). At
that point all 1,326 noindexed thin pages (play state launchers, state food,
economy, weather, travel, elections, map and sports pages, city stubs) loaded
`adsbygoogle.js` and most carried ad slots, and 760 links from indexable pages
led straight to them. `noindex` hides a page from Search, not from an AdSense
reviewer. So: a noindexed page carries no AdSense script and no `ad-slot`, an
indexable page never links to a noindexed one, and utility screens (archive,
widgets) carry no ads either. A new page that is not worth indexing is not
worth an ad.

On 5 October AdSense named the reason: "Contenu à faible valeur informative".
114 indexable pages were then retired the same way (noindex, no ads, out of the
sitemap, no inbound link): 44 World Cup 2026 pages in three languages, about an
event already over and off the site's subject; 50 `es/learn/capital-de-*`
pages, one template per state; 7 `learn/capital-of-<city>` pages answering a
question that has no answer; 7 Spanish crossword pages and 6 "X es un estado".
Together they had earned 14 Bing clicks since launch and none from Google.
Do not bring a family like these back to fill the hubs or chase a query.
The 71 indexable game pages under `play/`, `fr/play/` and `es/play/` carry no
ad code either, since 5 October: a game screen is the "screen without
publisher content" the AdSense policy names, ads must sit 150 px from a game,
and Google had indexed none of them. Ads belong on the articles and state
pages, never on a page whose main content is the game.
The three homepages are game screens too: since 7 October they carry no
`ad-slot` (two used to sit inside the solved and game-over banners). They keep
the `adsbygoogle.js` tag and the `google-adsense-account` meta in the head,
which is how AdSense verifies the site; if Auto ads are ever switched on,
exclude the homepages and `play/` in the AdSense console.
Nine more followed the same day, missed by the first filter because their slugs
said "mondial" or did not name the tournament: six French World Cup 2026 pages,
the Estadio Azteca history and the two USA-Mexico soccer rivalry pages, 6 Bing
clicks between them. The site is about US geography; soccer is off its subject.

**The site is signed with a pen name.** The About page, press kit and
`llms.txt` say Statedoku is made by Moses Tounby and say plainly that it is a
pen name for a solo developer based in France. The owner does not want his real
name on the site; only the privacy policies carry it, as the data controller.
Never present the pen name as a separate real person: no invented biography, no
photo, no nationality, no credentials.

**The legal notice depends on whether ads run.** `/legal/`,
`/fr/mentions-legales/` and `/es/aviso-legal/` (linked from every footer) use
the non-professional regime of LCEN article 1-1, II: pen name, contact address
and the hosting provider's details, the publisher's identity having been given
to the host. That holds only while no ad is served. A site showing ads counts
as published professionally, which requires article 1-1, I: real name,
address, telephone and a director of publication on the page. Before
`ADS_ENABLED` turns true, ask the owner for those details (he may use a
domiciliation address); never invent them, and never switch ads on without
the notice updated.

**Cloudflare Bot Fight Mode stays off.** It has blocked Google's ad crawlers
(Mediapartners-Google, Google-Display-Ads-Bot) on other sites during AdSense
review. The owner confirmed it off on 5 October 2026, and the three Google
user agents get a 200. `.github/workflows/cf-bot-check.yml` reports the zone
settings, but the deploy token cannot read the bot setting itself.

**The X API is never called.** It is pay-per-use with no free tier, and a post
containing a link costs 0.20 USD against 0.015. Two link-posts a day is about
12 USD a month. The worker posts through Buffer, which publishes to X on its own
approved app for free. The paid path additionally requires `X_PAID_ENABLED` to
be the string `true`, so leftover `TWITTER_*` secrets cannot silently bill.

**Never scrape or browser-automate X.** Its Developer Guidelines list non-API
automation under "There are no exceptions", penalty "permanent suspension",
extended to associated accounts.

**Cache-bust every asset edit.** `style.css`, `game.js`, `puzzle.js`, `i18n.js`
and `config.js` are loaded with `?v=N` on 2,000+ pages. Bump the number on
**every** page, not just the one you were looking at. Versions once drifted so
far that French and Spanish players kept a `game.js` from before the puzzle fix
and went on being told their correct answers were wrong. The JSON under `/data/`
is fetched at runtime and versioned by `CONFIG.DATA_VERSION`; bump that when you
edit `translations.json` or `states.json`.

Cloudflare's zone Browser Cache TTL overrides the `no-cache` in `_headers`
(JS and CSS were served `max-age=14400`), so the `?v=` bump is what actually
reaches returning players. Every page now versions `config.js` too.

**No unicode dashes in anything a human reads.** No em dash, en dash or figure
dash in page copy, JSON-LD, JS strings, tweets or meta descriptions. Use a comma
or rewrite. Ordinary hyphens are fine. Code comments are exempt.

**Attribute regexes must not use `[^"']`.** A double-quoted attribute contains
apostrophes all the time in French and Spanish. That class stops at the first
one. It has already spliced boilerplate into the middle of twelve descriptions
and truncated others mid-word. Match `content="([^"]*)"` instead.

## SEO invariants

Re-check these after any bulk edit, and after every change to the script that
made it. Three audits, all must pass: `scripts/audit-local.py` (reads zero),
`scripts/audit-click-depth.py` (nothing deeper than 3 clicks, every learn hub
covers its section) and `node scripts/audit-sitemap.mjs` (sitemap equals the
indexable set). On 5 October a regex fix was shipped after the first two had
passed on the earlier version, and 79 pages went unreachable for a day.

- **hreflang is reciprocal.** If A declares B, B declares A. Repair pairwise,
  never by rebuilding clusters: the graph already contains clusters holding two
  pages of the same language, and a cluster rebuild would make both claim the
  same `hreflang`, which is invalid.
- **Translations are self-canonical.** A French or Spanish page with real
  content must never canonicalise to the English one. Google honours the
  canonical and drops the translation.
- **hreflang lives on the pages, not in the sitemap.** The sitemap used to
  annotate ten entries, eight of them differently from the page; it emits none
  now. Do not add `alternates` back.
- **The sitemap lists only indexable, self-canonical pages.** It is a Pages
  Function built from hardcoded entries in `functions/sitemap.xml.js` and cannot
  check the filesystem at runtime, so entries must be removed at source when a
  page is noindexed.
- **No orphans.** An indexable page needs at least one incoming internal link,
  usually from its own language hub.
- **No internal link to a path that does not exist.** Where nothing valid exists
  to point at, drop the anchor and keep the text rather than inventing a page.
- **Meta descriptions 70 to 160 characters**, balanced parentheses and quotes.

640 pages are indexable and 1,450 are deliberately noindexed. Thin or
near-duplicate pages are noindexed on purpose, not deleted. Adding thin pages to
fix a broken link is a bad trade while AdSense is judging the site.

## Answer engines (GEO)

ChatGPT is the best-engaged source of visitors (54 engaged sessions out of 80
in the 13 October 2026 reading), and it sends them to the games: `/play/` and
`/play/place-the-state/` first. ChatGPT search and Copilot answer from Bing's
index, so what Bing knows is what they can cite.

- **llms.txt and llms-full.txt are generated.** `python3 scripts/build-llms.py`
  builds both from `data/states.json`, the ItemList on `/play/` and the listed
  pages' own titles and descriptions. It fails on a noindexed, missing or
  non-self-canonical link, on a list whose count differs from what the site
  says, and on a unicode dash. Never edit the two files by hand: the typed
  versions said three mistakes and five, midnight UTC and local, and carried
  invented state facts. Re-run after changing states.json, a game, or a listed
  page's title or description. The deploy warns when they are stale.
- **Every indexable page shows its date.** `scripts/stamp-page-dates.py`, which
  `build-sitemap-lastmod.py` runs at the end, writes a `data-page-dates` WebPage
  JSON-LD (datePublished from the first commit, dateModified from the sitemap
  lastmod, author the pen name linking to /about/) and a visible "Last updated"
  line before `</main>`, on 622 pages. Skipped: the homepages and archives
  (game screens), about, privacy, terms and legal. The stamp, and any
  dateModified value, are excluded from `reader_text`, so stamping never
  re-dates a page. After a content change: commit, run
  `python3 scripts/build-sitemap-lastmod.py`, commit the dates. The deploy
  warns when the stamps lag.
- **IndexNow runs on every deploy.** `scripts/indexnow.py` sends the indexable
  pages whose reader text changed in the push (and pages that left the index),
  never a cache-bust. The key file `a7844e0c0770e4f1a297158b783450d7.txt` at the
  root must keep deploying; it is public by design. A failed ping warns, it
  does not fail the deploy.
- **robots.txt names the AI crawlers inside the `*` group.** A named group does
  not inherit from `*`; giving a bot its own group would let it into `/api/`.
  On 15 October 2026 every one of them got a 200 from the edge.
- **Each play page previews as itself.** The 21 games and the hub, in three
  languages, used to share a "Memorize the 50 State Capitals" card. Now
  `scripts/build-game-og.cjs` renders `og/og-play-<slug>-<lang>.jpg` (title
  and first sentence from the page, the US map, the answer set lit for the five
  map games) and `scripts/set-game-og.py` points og:image, twitter:image and
  the Game JSON-LD at it. Re-run both after renaming a game or changing its
  answer set.
- **Lead with the answer.** The pages that earn clicks open with a direct,
  checkable answer (states and capitals, 13 colonies, electoral college,
  abbreviations). A new reference page does the same.

## Facts on the page

Rankings "of the 50 states" are computed over the 50 states. The Census files
also rank DC and Puerto Rico, and a density rank taken straight from them once
told readers Alaska was "the 52nd most densely populated" of 50.

Data articles are generated, not hand-typed. `scripts/build-house-seats-page.py`
builds the three House-seats pages from the Census apportionment file in
`scripts/data/` and asserts every figure its prose quotes; edit the script, not
the HTML, and re-run it after the 2030 census.

On 5 October about 300 errors were corrected on the state subpages and 333 in
the learn articles, each one confirmed by a second, independent check before
it was applied. New copy gets the same treatment: a claim of "the only" or
"the first" is the most common way these pages were wrong.

`data/states.json` drives the game. On 5 October an audit of every clue against
its label found about 50 wrong values (Salt Lake City missing from "capital
starts with S", Arizona still credited with an NHL team, New Hampshire a swing
state, Tennessee on Eastern time...) and 30 pop-culture clues whose answer set
no list can make complete (film settings, "has islands"). Correcting the data
would have changed every grid already played, so `js/puzzle.js` carries a
cut-over: `DATA_FIX_FROM` is 2026-10-07, `STATE_FIXES`, `LIST_FIXES` and
`PC_FIXES` hold both the old and the corrected values, and `RETIRED_FROM_FIX`
takes the open-ended clues out of the pool from that date. Grids dated before
it come out byte for byte as they were; this was checked on every date from
1 June 2026 to 31 March 2027, and the later grids were checked for a unique
solution and for cells that match the corrected data.

Glosses (`constraint_help`) describe the corrected data. On a grid dated
before the cut-over, `Puzzle.helpFitsDate` hides the gloss of any clue whose
answer set changed, so an archive grid never contradicts its own `?`.

The pop-culture clues load from `constraints-live.js`, injected by a script
tag. `getPuzzle` waits for it: a grid generated before it lands is built from a
smaller pool, differs from everyone else's and used to be cached that way.

`DATA_FIX2_FROM` (2026-10-24) is the second cut-over, in `STATE_FIXES2`:
Minnesota joined "double letter", and the day before a grid, whose row group
is avoided, is computed in UTC. It used to be local midnight, so east of UTC
(France, Spain) 23 of 304 grids differed from the Americas'. Before the date
every time zone keeps the grid it was shown; from it all zones share one.
`DATA_FIX3_FROM` (2026-10-27) changed how grids are made, at the owner's
request ("je suis pas fan du puzzle du jour"). The old pool of 150 clues held
fuzzy ones (Sun Belt, Deep South, swing state), trivia (Taylor Swift tour,
birthplace of two presidents) and disputed ones (name origins), and 65% of
cells accepted a single state. `V3_POOL` keeps 61 clues that a map, a list or
the name itself settles, in families (regions, time zones, population,
coasts, borders, rivers, statehood eras, capitals, names), with at most two
name clues a grid, every cell between two and nine answers, and a full grid of
nine different states. The grids come from `V3_SCHEDULE`, six characters a
day for two years, built by `node scripts/build-puzzle-schedule.cjs` with the
whole history in view: no set of six clues ever repeats, no clue of yesterday
is in today's grid, every clue's turn comes round. Past the schedule's end
(26 October 2028) a generator from the date takes over; rebuild before then.
Clues are only ever appended to `V3_POOL`: the schedule indexes it.
The next correction needs a fourth cut-over date, not an edit to these:
any change to states.json, `LIST_CONSTRAINTS` or constraints-live.js without
recording the old value for earlier dates rewrites grids people have played.

Name clues (starts with, letter counts, "New", double letter...) read the
English name, so their French and Spanish labels say "(en anglais)" /
"(en inglés)": read on "Dakota du Nord" or "Nueva York", 29 of 55 French and
40 of 55 Spanish grids had a cell whose answers changed.

## Endpoints and keys

The repo is public, so nothing here may depend on an address or a key being
unknown.

- **Email sign-up is double opt-in.** `/api/subscribe` stores a new address
  inactive and mails a link to `/api/confirm`; only that turns it on. An active
  address is never changed by a new sign-up and an unsubscribed one never
  switches back on without a fresh confirmation, so nobody can subscribe a
  third party. The endpoint only takes `application/json`, which forces a CORS
  preflight. Unsubscribe deletes the row (erasure, not a flag), and both confirm
  and unsubscribe need a POST from a button, because mail scanners follow GET
  links. **Confirmation only happens when `RESEND_API_KEY` is set on the Pages
  project**, which it was not on 23 October 2026 (the reminder worker has its
  own key): until it is, a new address is switched on directly and no mail is
  sent. Refusing instead (503) turned every sign-up away, so do not.
- **Keys travel in headers, never in a URL.** `/api/stats` and the admin API
  read `x-admin-key`, the two workers read `x-trigger-key`, all compared in
  constant time (`functions/_shared/auth.js`). A key in a query string ends up
  in logs and browser history.
- **Admin pages keep the key in `sessionStorage`** and escape every value they
  render: a subscriber row is attacker-controlled text.
- **Click tracking names nobody in code.** The addresses whose email clicks are
  recorded come from the `CLICK_TRACK_EMAILS` secret (comma separated), in both
  the email worker and `/api/track/email-click`. Unset means none.
- **`ADMIN_HASH` in config.js is public.** It only toggles the dev panel in the
  browser; the password behind it must never be reused anywhere.
- **Error bodies are generic.** Never return `e.message` from a function.
- **Workflow actions are pinned to a commit SHA**, with the tag in a comment.

## Weight

Do not inline the US map. `/data/us-map.svg` is 218 KB; inlined it cannot be
cached and is re-downloaded on every navigation. The 21 play pages fetch it and
build their game once it lands. That took them from 243 KB to 25 KB each.

## Layout

- `index.html`, `fr/`, `es/` are the three homepages, each running the daily game.
- `states/` 651 pages, `learn/` 147, `play/` 298, `cities/` 102, `regions/` 14.
- `js/` game logic: `game.js` loop, `puzzle.js` generation, `i18n.js`,
  `constraints-pending.js` and `constraints-approved.js` for the pop-culture pool,
  `play-a11y.js` shared by the 63 game pages (keyboard access to map states and
  tiles, live feedback, taps in the water next to the smallest states).
- `data/` `states.json`, `translations.json`, `tweets.json`, `us-map.svg`.
- `functions/` Cloudflare Pages Functions, including the sitemap.
- `bot/` the posting worker, `email-worker/` the reminder worker.
- `tmp/` and `marketing/` local only, gitignored, and absent from the whole history.

## Design

Navy `#0F2147`, red `#DC2626`, gold `#F59E0B`, green `#059669`, Inter
throughout. The grid follows Metrodoku: separated cards with a 10px gap and a
2px border each, flat fills rather than gradients, state carried on the border.
Not a bordered table.

On 25 October 2026 the owner found the site "trop AI slop" and asked for the
homepage to hold the game only, after metrodoku.fr. So: the three homepages
are a light page (`body.home`), the name in lower case, four plain links
(how to play, archive, games, stats) and the languages, the day's title and
date, the grid with square cards, and under it "Give up and see the answers"
and the mistakes as five circles. The rules open once on a first visit. The
end of a game is a plain card under the grid, no confetti. Below, one sentence
about the game and a row of links (they also keep every hub one click from
the homepage, which the click-depth audit needs). No email banner, no card
list, no "how it works" essay: do not bring them back.
Site-wide the header is a white bar with the lower-case name, no navy band,
no flag; decorative emoji in labels and arrows at the ends of links were taken
out of every page (`reader_text` ignores them, so that dated no page). Keep it
that way: no emoji to decorate a heading, a chip or a link.

Constraints that do not explain themselves carry a `?` opening a plain-language
gloss, from `constraint_help` in `translations.json`. Constraints like "Starts
with M" carry none, so the affordance means something when it appears. A gloss
must never name the states that satisfy a constraint, and the game must never
announce how many answers a cell accepts.

## Tweets

`data/tweets.json` is a two-slot bank, version 2. The 13:00 UTC run posts from
`game` and links to the puzzle; the 23:00 run posts from `page` and links to the
page that tweet is about. 200 and 400 entries, indexed by day number, advancing
independently so a missed run cannot desynchronise them. Rebuild with
`python3 scripts/rebuild-tweet-bank.py`.

X forbids duplicative posts, which is why the bank has no repeated text.

Every tweet carries one or two hashtags, in a rotation per angle rather than one
fixed block, which X reads as a spam signal when it repeats across hundreds of
scheduled posts. `scripts/add-tweet-hashtags.py` is idempotent and must be
re-run after a bank rebuild, which would otherwise drop the tags.

## Search performance readings

`.github/workflows/seo-snapshot.yml` runs every Saturday at 01:17 UTC and commits
raw JSON to `seo-snapshots/`. Read the committed file; do not ask for a live API
call.

The weekly SEO routine reads it on **Saturday at 09:00 UTC**, eight hours
later, running on Opus 5.5 in a persistent host session that carries the repo
(a routine that spawns a fresh session gets no repo and no push rights). It
appends a line to `seo-snapshots/JOURNAL.md` every week: the scheduler reports
success on delivery of the wake-up, not on the work, so the journal is the proof.

### The order of priorities

Without this order in mind you will build something that measures very well what
does not move. It is the trap of this kind of arrangement.

1. **Authority**, meaning inbound links from other sites. The dominant factor
   and the ceiling on almost any young site. You cannot lift it and must not
   try: no buying, no directories, no artificial exchanges. Say it once to the
   owner, clearly, then work on the rest.
2. **Indexation.** A page missing from the index cannot rank, however good the
   work done on it. It is measurable and almost nobody measures it, which is why
   `scripts/collect-gsc-index.mjs` exists.
3. **Depth on commercial intent.** Pages that answer an intent to act, not
   pages that inform.
4. **Trust signals.** About page, named author, complete legal notices. Never
   fill that gap by inventing a person, a background or a figure. Ask for the
   material.
5. **Technical and on-page.** Usually already done, and what one flogs out of
   habit because it is the easy part.

### What the readings hold

- `gsc-*.json` performance, six cuts including **query x page**, the one that
  says which page Google actually serves for a query. Cannibalisation and wrong
  internal targeting live there, and the manual CSV export does not contain it.
- `gsc-index-*.json` index coverage, one row per sitemap URL: verdict, coverage
  state, robots state, fetch state, and both canonicals. **Google's chosen
  canonical differing from the declared one is always a real defect** and is
  invisible from the page itself.
- `bing-*.json` performance and crawl anomalies, which Google does not report.
- `bing-keywords-*.json` keyword demand, independent of this site. Without it
  the analysis is a closed loop: performance data only ever reports queries the
  site already appears on, so it can improve what exists and can never find
  demand nobody serves.
- `bing-submitted.json` the register of URLs already pushed to Bing. Re-sending
  the same list burns the quota and teaches Bing nothing.

Collection is deliberately separate from analysis. The keys live as GitHub
secrets, readable by that action and nothing else, so a session that analyses
the data cannot leak a credential into a transcript or an error body. It also
turns the history into git: Search Console keeps sixteen months and only shows
deltas in its own UI, so once a week is archived, comparing two periods is a
diff.

`seo-snapshots/` is in `.deployignore` and in the deploy guard, and the deploy
trigger ignores it, so a weekly reading never republishes 2,000 pages. The same
three places hold `audience-snapshots/` back.

### Audience readings

Visitor paths (source, landing page, time, next page, exits, game funnels) are
summarised every Saturday in `audience-snapshots/behavior-*.md` by
`scripts/report-behavior.py`; the README there says how exits are estimated.
Microsoft Clarity (session replays, heatmaps) loads from `config.js`, now on
every page except the 63 print versions, the 3 widget pages, `admin/constraints`,
`api/` and `logos/`.

The behaviour report counts entries, not views: every game's "Play again"
reloads the page, which GA4 records as a view whose referrer is the page
itself. On 13 October 2026 those replays were 427 of 2,620 transition views,
almost all on game pages, and had made every game look like a one-view exit.

**The visitor-path report is for the weekly routine, not for the owner.** He
said on 13 October 2026 that he will not read it: it exists so the Saturday
session uses it to decide what to change on the site. Every Saturday, after the
search readings, read this week's `behavior-*.md` and last week's, and weigh
what they show alongside the SEO findings when choosing the week's change. The
change can be behaviour-driven rather than SEO-driven when the data supports
it better. Where to look:

- **Pages with many entrances and a high exit rate** are where a reader needs a
  better next step (the capitals page: 86% left without a second page).
- **Games with many starts and few finishes** need their difficulty or
  interface looked at; **finishes with no next-game click** mean the
  end-of-game offer is not working.
- **The capitals quick quiz**: started and finished against page views.
- **The daily game**: started, won, lost, and the win rate week on week.
- **Sources with high engagement** (Classroom, Listdle, ChatGPT so far) and the
  page each one lands on: what to strengthen for them.

Week-on-week deltas only, and under about 20 events a figure is noise. Write
in `seo-snapshots/JOURNAL.md` which reading led to which change. Do not send
the owner these figures as a report.

Event start dates, so a jump on that day is not mistaken for a trend:
`play_start`, `puzzle_start/solve/lost` and `classroom_share` from 12 October
2026; `capitals_teaser_*` and `next_game_click` from 13 October 2026. `puzzle_first_move` from
24 October 2026: `puzzle_start` fires when the grid renders, so it counts
everyone who saw it; the first pick, right or wrong, is what says someone
played. On 17 to 23 October 207 grids rendered and 48 games ended. Before 12
October the five map games and States Connections sent `play_complete` once per
click after a game ended, so earlier finish counts there are inflated.

Search data cannot say whether anyone played. A click on a reference page and a
solved puzzle are the same row to Search Console, which is how the site reached
roughly 600 Bing clicks a week with 70% landing on `learn/` and thirteen on the
homepage, where the game is. `scripts/collect-audience.mjs` closes that by
reading the site's own admin endpoints into `audience-snapshots/`, described in
its README.

**It writes counts and never a person.** `/api/admin/subscribers` returns the
subscriber table with addresses in it and this repo is public, so the collector
strips `email`, `token`, `subscribers` and `rows` at any depth, then re-reads
the finished payload and refuses to write it if an address survived. Keep both
checks: the first trusts the endpoint's shape and shapes change. Never add a
field to that file without asking whether it identifies somebody, and never
commit the subscriber list here whatever the reason.

Every collector warns and exits 0 when its secret is missing. That is on
purpose: a red cross every week stops being read.

### What to look at, in this order

- **Pages entering or leaving the index.** A page leaving is urgent.
- **query x page.** Which page is served, is it the right one, are two pages
  fighting over one query.
- **Queries between position 8 and 20.** The only band where work on a page
  moves anything. Past 30, position is noise.
- **A chosen canonical differing from the declared one.**
- **Bing crawl anomalies.**
- **The keyword reading**, to decide what to write from measured demand rather
  than intuition.
- **The visitor-path report** (`audience-snapshots/behavior-*.md`), to decide
  what to change for the people already arriving. See Audience readings.

Week-on-week deltas, never absolute values.

**Two things that turn this routine into commentary instead of work.** An
impression or two is noise; signal is a pattern repeated across several
queries. And a young site takes three to six months to settle. The routine
exists so nothing is missed and work keeps shipping, not to hurry Google.

**Do the work, do not propose it.** A routine that files a report every week and
never changes anything costs money and produces nothing.

**A check that finds nothing has verified nothing.** A regex matching no line,
then a loop announcing "all clear" over zero items, is false assurance. Always
print how many items were checked.

**Never conclude from an incomplete search.** Claiming a thing does not exist
requires having looked everywhere it could be.

**The two engines are not comparable.** A Bing impression is counted far more
loosely than a Google one, and partly artifactually: one query showed 42,844
impressions for 15 clicks. Judge Bing on clicks and position. Never put a Bing
total and a Google total in one sentence.

## Verify, do not assume

This site has 2,000+ pages and most bugs here are systematic. Measure before and
after, on the whole tree, not on the file you happened to open. When a change is
visible in a browser, open it and use it: play the game, click the wrong answer,
reload and check the state survived. Several bugs in this repo passed a code
reading and failed the first real click.
