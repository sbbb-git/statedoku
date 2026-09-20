# Search performance readings

One JSON file per engine per week, written by `.github/workflows/seo-snapshot.yml`
and committed automatically. Nothing here is served: the directory is listed in
`.deployignore`, checked by the deploy guard, and excluded from the deploy
trigger so archiving a reading never republishes the site.

    gsc-YYYY-MM-DD.json     Google Search Console, dated by the end of its window
    bing-YYYY-MM-DD.json    Bing Webmaster Tools, dated by the collection day

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
included. Create a service account in Google Cloud with the Search Console API
enabled and **no project role at all**, then add its `client_email` under
Search Console, Settings, Users and permissions. The permission comes from
Search Console, not from the Cloud project, and that is the step people miss.

**`BING_API_KEY`** comes from Bing Webmaster Tools, Settings, API Access. The
key belongs to the account rather than to one site, so it opens every verified
site: worth remembering if it ever leaks.
