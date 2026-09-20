# Search performance readings

One JSON file per engine per week, written by `.github/workflows/seo-snapshot.yml`
and committed automatically. Nothing here is served: the directory is listed in
`.deployignore`, checked by the deploy guard, and excluded from the deploy
trigger so archiving a reading never republishes the site.

    gsc-YYYY-MM-DD.json           Google performance, dated by the end of its window
    gsc-index-YYYY-MM-DD.json     Google index coverage, one row per sitemap URL
    bing-YYYY-MM-DD.json          Bing performance and crawl anomalies
    bing-keywords-YYYY-MM-DD.json Keyword demand, independent of this site
    bing-submitted.json           Register of URLs already pushed to Bing

## Reading them

`gsc-*.json` holds six cuts per property under `data.<property>`: `by_date`,
`by_query`, `by_page`, `by_query_page`, `by_country`, `by_device`. The window is
28 days ending three days before collection, because Search Console data lags
two to three days and asking up to today returns empty days that read as a
collapse.

`by_query_page` is the one that earns its place. It says which page Google
actually serves for which query, so it shows cannibalisation and pages that
should rank but do not. The manual CSV export does not contain it.

`properties_visible` lists every property the service account can see. It is
recorded on purpose: this site has had readings from more than one property,
and the totals are not comparable between them.

`bing-*.json` holds `GetRankAndTrafficStats`, `GetQueryStats`, `GetPageStats`,
`GetCrawlStats`, `GetCrawlIssues` and `GetUrlSubmissionQuota` per site. Crawl
anomalies and the URL submission quota are the two things Bing reports and
Google does not. Dates arrive in the legacy .NET form and are converted to ISO
at collection, so weeks stay comparable.

## Index coverage

`gsc-index-*.json` is the reading almost nobody takes and the one that says
whether a page can rank at all. Performance data cannot tell a page that ranks
badly from a page Google never indexed: both simply never appear.

One row per sitemap URL, carrying `verdict`, `coverageState`, `robotsTxtState`,
`pageFetchState`, `googleCanonical` and `userCanonical`. When Google's chosen
canonical differs from the declared one it is always a real defect, and it
cannot be seen from the page itself.

Quota is 2,000 inspections per day per site, 600 per minute. This site publishes
757 URLs, so a full weekly pass costs about 37% of one day. Concurrency stays at
four: nothing presses, and a 429 would cost the whole reading.

## Keyword demand

`bing-keywords-*.json` is what stops the whole arrangement being a closed loop.
Performance data only ever reports queries the site already appears on, so on
its own it can improve what exists and can never find demand nobody serves. A
site that appears on nothing learns nothing from its own performance data.

`GetKeyword` and `GetRelatedKeywords` take no `siteUrl`: they return the volume
of any term, which makes this free keyword research with the key already in
place. Seeds are derived from `data/states.json` and the `learn/` topic slugs,
never from a hand-written list that would go stale, and the collector fails
rather than write a reading over an empty seed list.

## Two cautions

The totals within one engine do not reconcile, and that is normal: Google masks
rare queries, so the query table always sums to less than the date table.

The two engines do not compare at all. Bing counts an impression far more
loosely. Over the same summer quarter Bing reported 486,250 impressions against
Google's 882.

## Setting up the credentials

Both steps skip with a warning when their secret is absent, so the workflow is
harmless until they are set.

**`GSC_SERVICE_ACCOUNT_JSON`** is the whole downloaded key file, braces
included. `GOOGLE_SERVICE_ACCOUNT_JSON` and a few other names work too: GitHub
offers no way to list the secrets on a repository, so the workflow passes
several and the collector takes the first one filled, logging which name it
used and never the value. Create a service account in Google Cloud with the Search Console API
enabled and **no project role at all**, then add its `client_email` under
Search Console, Settings, Users and permissions. The permission comes from
Search Console, not from the Cloud project, and that is the step people miss.

**`BING_API_KEY`** comes from Bing Webmaster Tools, Settings, API Access. The
key belongs to the account rather than to one site, so it opens every verified
site on it.

That last point is not theoretical. The first run of this workflow looped over
everything the key could reach and committed 3 MB of search data for nine
sites, eight of them unrelated projects, into this public repo. Both collectors
now take one site by default, statedoku.com, and record a count of the
properties they can see rather than their names. Collecting more needs an
explicit `BING_ALL_SITES=true` or `GSC_ALL_SITES=true`.
