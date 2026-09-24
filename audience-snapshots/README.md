# Audience readings

One JSON file per week, written by `.github/workflows/seo-snapshot.yml` and
committed automatically. Nothing here is served: the directory is listed in
`.deployignore`, checked by the deploy guard, and excluded from the deploy
trigger so archiving a reading never republishes the site.

    audience-YYYY-MM-DD.json

## Why this exists

The search collectors measure arrivals from search engines and can say nothing
about use. To Search Console a click on `/learn/states-and-capitals/` and a
solved puzzle look identical, so the site could grow to roughly 600 Bing clicks
a week with nobody able to tell whether the game was being played at all. On 22
September 2026 the page-level Bing reading showed 70% of clicks landing on
`learn/` and thirteen on the homepage, where the daily game lives. That is a
question about the product, and only this reading answers it.

## What a file holds

`gameplay` is the whole of `GET /api/stats`: event totals by type, a thirty day
daily breakdown with starts, solves, losses and average solve time, top
countries and languages, the mistakes distribution, and the count of distinct
puzzles played.

`subscribers` holds only `summary` (total, active, inactive, distinct languages
and countries) and `breakdowns` (by language, by send hour, by country).

## What a file never holds, and how that is enforced

`GET /api/admin/subscribers` returns the `email_subscribers` table itself,
addresses included. **This repository is public.** Those addresses belong to
people who subscribed to a puzzle reminder and never agreed to appear in a git
history, and a git history is not something you can take back: an earlier
exposure here needed a rewrite of `main` and the objects stayed fetchable by
SHA afterwards.

So `scripts/collect-audience.mjs` does two separate things. It drops `email`,
`token`, `subscribers` and `rows` at any depth, and it then re-reads the
finished payload and refuses to write the file at all if anything matching an
email address survived. The second check exists because the first trusts the
endpoint's current shape, and shapes change.

Both are tested by making them fail: the guard is verified against an address
planted where the stripper does not look.

## Setting up the credentials

The collector warns and exits 0 when both secrets are absent, so the workflow
is harmless until they are set. Add them as GitHub repository secrets, under
Settings, Secrets and variables, Actions:

**`STATS_ADMIN_KEY`** is the value already set as `STATS_ADMIN_KEY` on the
Cloudflare Pages project. It gates `GET /api/stats?key=...`, which returns
aggregates only.

**`ADMIN_API_KEY`** is the value already set as `ADMIN_API_KEY` on the Pages
project, the one the admin page asks for. It is sent as the `X-Admin-Key`
header.

Set either one alone and the collector gathers that half and says which half is
missing. Neither key is ever printed, and neither leaves the Actions runner.

## AdSense status

`adsense-YYYY-MM-DD.json`, from `scripts/collect-adsense.mjs`, says whether
statedoku.com is approved (`sites[].state`: `REQUIRES_REVIEW`, `GETTING_READY`,
`READY`, `NEEDS_ATTENTION`), whether Auto ads is on, the account's alerts, and
any policy issue Google has raised on a statedoku.com page.

It never holds earnings: reports and payments are not called. An AdSense
account covers every site its owner has added, so other sites are counted, not
named, the account display name is dropped, and the collector re-reads the
finished file and refuses to write it if any host other than statedoku.com (or
Google's own) or any email address survived. File names such as `ads.txt` are
not mistaken for hosts; that is tested.

Auth is OAuth with a refresh token, because the AdSense Management API does not
accept service accounts. Three repository secrets: `ADSENSE_CLIENT_ID`,
`ADSENSE_CLIENT_SECRET`, `ADSENSE_REFRESH_TOKEN`. If the OAuth app is left in
"Testing", Google expires its refresh tokens after 7 days; set it to "In
production". An `invalid_grant` in the log means the token needs issuing again.
