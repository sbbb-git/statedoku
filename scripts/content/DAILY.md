# Daily content session

One content unit a day, Sunday to Friday (Saturday belongs to the weekly SEO
reading). Set up on 4 November 2026 at the owner's request ("programme du
nouveau contenu pour everyday"). The queue is `scripts/content/QUEUE.md`.

A content unit is either a new page that measured demand calls for, or a real
deepening of a page that already ranks (a map its title promises, a section
answering queries it is shown for). Never filler. The site was refused by
AdSense for "contenu à faible valeur informative" and is under review again:
one thin page costs more than a week without one. A day where a gate fails
ships nothing, and says so in the journal. That is a valid outcome.

## 0. Repository

    test -f .git/shallow && git fetch --unshallow origin || git fetch origin
    git checkout -B main origin/main
    git status --porcelain | wc -l
    git push --dry-run origin main

The first line matters: `build-sitemap-lastmod.py` reads the history of every
file and answers wrong on a shallow clone. If the dry run fails, stop and say
so in two lines with the exact message. You work and push on `main` only.

Read `CLAUDE.md` in full, every time. It wins over this file.

## 1. Pick the unit

Open `QUEUE.md` and take the first item marked `todo`. Before writing:

- Check its demand still holds in the newest `seo-snapshots/bing-keywords-*.json`
  and that the target query is on the site's subject (US geography).
- Check no existing page already answers it (grep titles, H1 and the
  `learn/` hubs in the three languages). If one does, the unit becomes a
  deepening of that page, or is marked `dropped` with the reason. Two pages
  fighting over one query is worse than one.
- New pages this week (Sunday to Friday) must stay at three or fewer. Count
  the `done` lines dated this week. Past three, take the next deepening item.

Not allowed, whatever the demand says: a series of near-identical pages (one
template per state, per city or per code: 114 such pages were retired on
5 October), pages off the subject (sports, news, lotteries), lookups that Bing
answers in a box (the 18 `what-state-is-*` pages had 35,094 impressions and
27 clicks in four weeks), and anything on `/privacy/`, `/about/`, `/terms/`,
`/legal/` or ad code.

### Current events (owner's request of 4 November 2026)

"Essaie d'avoir du contenu actuel régulièrement": at least one unit a week is
timely, from the "Current" section of `QUEUE.md`. Current means a fact about
the 50 states that changed or is being decided now (elections, a census
release, a new national park, a state law or symbol taking effect, a time
change), never news for its own sake and never off the subject.

- Facts only from primary or reference sources (AP race calls, state election
  offices, Census Bureau, NPS, state legislatures), each dated. Every page says
  "as of" when its facts can still move.
- Neutral: results and rules, no adjective about a party, a candidate or an
  outcome, no forecast.
- A timely page is built to stay true after the event: results by state, not
  "tonight". The midterms pages are generated from
  `scripts/data/midterms-2026.json` by `scripts/build-midterms-page.py`;
  update the JSON (only races AP has called, each with a second source), never
  the HTML, and re-run.
- Read sources the normal way. Never spoof a user agent or a referer, never
  get around a block or a paywall: when a site refuses automated reads (AP's
  pages do), use one that does not (NBC News, CNN, CBS News results pages,
  AP articles found by search, the state's own election office).
- Maintenance comes before novelty: while a "Current" item says "update until",
  its update is that day's unit (it counts as a deepening, not a new page).
  When the event is settled, the item moves to Done with its final date.

## 2. Write

- Lead with the answer: the first paragraph settles the query.
- Every figure from a primary or reference source. Rankings "of the 50 states"
  over the 50 states. No "the only" or "the first" without a source.
- English first. French and Spanish when the item says so: same facts, same
  figures, self-canonical, hreflang reciprocal across the three, linked from
  their own `learn/` hub. French uses non-breaking spaces before `: ; ? ! %`.
- No unicode dash (em, en, figure) in anything a reader sees. No decorative
  emoji. Attribute regexes use `[^"]*`, never `[^"']`.
- New article pages copy the template of their sibling articles in the same
  section and language, nothing more. No ad code on game pages, noindexed
  pages or utility screens.
- Maps: never inline `data/us-map.svg` (218 KB). Either colour it in the
  browser after a `fetch`, as the play pages do, or generate a static SVG file
  with rounded coordinates under `img/maps/` and reference it with `<img>`
  and a real `alt`. A map must work at 390 px.
- Any edit to `style.css`, `game.js`, `puzzle.js`, `i18n.js` or `config.js`
  bumps `?v=N` on every page that loads it.

## 3. Check, before any push

1. Run the `fact-checker` agent on the diff. Fix every WRONG. Remove or
   soften every UNVERIFIABLE. Re-run it if the fixes changed claims.
2. `python3 scripts/audit-local.py`, `python3 scripts/audit-click-depth.py`,
   `node scripts/audit-sitemap.mjs`: all zero, sitemap count equal to the
   indexable count. A new page needs its entry in `functions/sitemap.xml.js`
   and a link from its hub.
3. `node scripts/test-puzzles.cjs` if anything under `js/` or `data/` moved.
4. Open the changed pages in Chromium at 390 and 1280 px: no horizontal
   overflow, no console error, every JSON-LD block parses, the map draws.
5. Commit, then `python3 scripts/build-sitemap-lastmod.py`, and
   `python3 scripts/build-llms.py` when a listed page changed title or
   description. Commit those.

## 4. Ship and verify

`git push origin main` deploys. Watch the deploy run until it completes (the
workflow runs the puzzle tests before the upload and the production check
after). Then fetch the changed pages live and check the new content is there.
A green tick is not a verification.

## 5. Record

- In `QUEUE.md`: the item becomes `done YYYY-MM-DD <commit>`, or `dropped`
  with the reason. When fewer than five `todo` items remain, add new ones from
  the latest keyword reading: on-topic terms of 5,000 weekly impressions or
  more with no page covering them, and pages already ranking 5 to 15 on Bing
  whose title promises something the page lacks. Write the evidence on the
  line.
- One line in `seo-snapshots/JOURNAL.md`, tagged `(daily content)`: what
  shipped, the demand behind it, the commit, the fact-check count, or why
  nothing shipped.

## 6. Report

Two to five lines in French for the owner: what went live and why, or why
nothing did, plus anything that needs the owner's decision. The owner does not
read figures; do not paste readings. Keep turns short: this session serves every day.
