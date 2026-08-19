# Statedoku

Daily US-geography puzzle at statedoku.com. Static site, no backend, no build
step: the HTML in this repo is what ships. Trilingual EN / FR / ES.

Solo project. Ship carefully, there is no staging and no one else to catch it.

## Deploy

`git push` on `main` triggers `.github/workflows/deploy.yml`, which runs
`wrangler pages deploy` against the Cloudflare Pages project `statedoku`.
Cloudflare is **not** connected to the repo directly; the workflow is the
pipeline. Live about a minute after the push.

The Twitter bot in `bot/` is **not** in CI. Deploy it by hand:
`cd bot && npx wrangler deploy`.

## The puzzle rule, which is not obvious

A cell is correct when the state **satisfies both visible clues**. Not when it
equals some intended answer. `js/game.js` calls `_isValidForCell(r, c, state)`
everywhere for this, and every place that judges correctness must use it:
scoring, cell rendering, the share grid, the share image, and the reload scrub
in `_loadProgress`.

This is safe because `js/puzzle.js` only ships grids where `hasUniqueSolution`
holds, so "keeps the grid solvable" and "equals the canonical answer" are the
same test. An earlier version ran a solvability gate and rejected valid answers
with a "conflicts elsewhere" toast that could never be true. It refused 24.9% of
valid answers. Do not reintroduce it.

Because any valid answer is accepted, a player can spend a state another cell
needed. Filled cells are therefore editable and the picker has a Clear button.
Removing either brings back the dead end.

## Rules that bite

**Ads stay off.** `CONFIG.ADS_ENABLED` is `false` and stays false until AdSense
approves. Do not touch ad code, `/privacy/`, `/about/` or `/terms/` during a
review.

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

**No unicode dashes in anything a human reads.** No em dash, en dash or figure
dash in page copy, JSON-LD, JS strings, tweets or meta descriptions. Use a comma
or rewrite. Ordinary hyphens are fine. Code comments are exempt.

**Attribute regexes must not use `[^"']`.** A double-quoted attribute contains
apostrophes all the time in French and Spanish. That class stops at the first
one. It has already spliced boilerplate into the middle of twelve descriptions
and truncated others mid-word. Match `content="([^"]*)"` instead.

## SEO invariants

Re-check these after any bulk edit. `tmp/audit-local.py` measures all of them
and should read zero.

- **hreflang is reciprocal.** If A declares B, B declares A. Repair pairwise,
  never by rebuilding clusters: the graph already contains clusters holding two
  pages of the same language, and a cluster rebuild would make both claim the
  same `hreflang`, which is invalid.
- **Translations are self-canonical.** A French or Spanish page with real
  content must never canonicalise to the English one. Google honours the
  canonical and drops the translation.
- **The sitemap lists only indexable, self-canonical pages.** It is a Pages
  Function built from hardcoded entries in `functions/sitemap.xml.js` and cannot
  check the filesystem at runtime, so entries must be removed at source when a
  page is noindexed.
- **No orphans.** An indexable page needs at least one incoming internal link,
  usually from its own language hub.
- **No internal link to a path that does not exist.** Where nothing valid exists
  to point at, drop the anchor and keep the text rather than inventing a page.
- **Meta descriptions 70 to 160 characters**, balanced parentheses and quotes.

758 pages are indexable and 1,330 are deliberately noindexed. Thin or
near-duplicate pages are noindexed on purpose, not deleted. Adding thin pages to
fix a broken link is a bad trade while AdSense is judging the site.

## Weight

Do not inline the US map. `/data/us-map.svg` is 218 KB; inlined it cannot be
cached and is re-downloaded on every navigation. The 21 play pages fetch it and
build their game once it lands. That took them from 243 KB to 25 KB each.

## Layout

- `index.html`, `fr/`, `es/` are the three homepages, each running the daily game.
- `states/` 651 pages, `learn/` 146, `play/` 298, `cities/` 102, `regions/` 14.
- `js/` game logic: `game.js` loop, `puzzle.js` generation, `i18n.js`,
  `constraints-pending.js` and `constraints-approved.js` for the pop-culture pool.
- `data/` `states.json`, `translations.json`, `tweets.json`, `us-map.svg`.
- `functions/` Cloudflare Pages Functions, including the sitemap.
- `bot/` the posting worker, `email-worker/` the reminder worker.
- `tmp/` throwaway scripts. Committed today, which it should not be.

## Design

Navy `#0F2147`, red `#DC2626`, gold `#F59E0B`, green `#059669`, Inter
throughout. The grid follows Metrodoku: separated cards with a 10px gap and a
2px border each, flat fills rather than gradients, state carried on the border.
Not a bordered table.

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
`python3 tmp/rebuild-tweet-bank.py`.

X forbids duplicative posts, which is why the bank has no repeated text.

## Verify, do not assume

This site has 2,000+ pages and most bugs here are systematic. Measure before and
after, on the whole tree, not on the file you happened to open. When a change is
visible in a browser, open it and use it: play the game, click the wrong answer,
reload and check the state survived. Several bugs in this repo passed a code
reading and failed the first real click.
