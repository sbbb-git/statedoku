# 📊 Statedoku — D1 Analytics Setup

Server-side game stats stored in Cloudflare D1 (SQLite at the edge).
The code is already deployed. You just need to **create the database** and **bind it**.

## 1. Create the D1 database

```bash
cd <repo root>
wrangler d1 create statedoku-stats
```

You'll get output like:
```
✅ Successfully created DB 'statedoku-stats'

[[d1_databases]]
binding = "STATS_DB"
database_name = "statedoku-stats"
database_id = "abcd-1234-…"
```

**Copy the `database_id`** — you need it next.

## 2. Apply the schema

```bash
wrangler d1 execute statedoku-stats --remote --file=bot/d1-schema.sql
```

This creates the `events` table.

## 3. Bind D1 to Cloudflare Pages

Go to:
👉 https://dash.cloudflare.com/?to=/:account/pages/view/statedoku/settings/functions

Scroll to **"D1 database bindings"** → click **"Add binding"**:
- Variable name: `STATS_DB`
- D1 database: select `statedoku-stats`

Click **Save**.

## 4. Set the admin key (env var)

In the same page, scroll to **"Environment variables"** → click **"Add variable"** under "Production":
- Variable name: `STATS_ADMIN_KEY`
- Value: any long random string, e.g. `aX9b7Q3kR2sP8mZ5vN4tL6wH1yU0eF`
- **Encrypted: yes** (toggle on)

Click **Save**.

## 5. Trigger a redeploy

Push any commit (or just re-run a deploy from Pages dashboard) so the binding takes effect:

```bash
git commit --allow-empty -m "Trigger redeploy for D1 binding" && git push
```

Wait ~30s for the deploy.

## 6. Test

### Send a fake event
```bash
curl -X POST https://statedoku.com/api/events \
  -H 'Content-Type: application/json' \
  -d '{"event_type":"puzzle_solve","puzzle_date":"2026-05-13","lang":"en","time_seconds":42,"mistakes":1}'
```

Should return `204 No Content`. (If 400/500, check the bindings.)

### Read stats
```bash
curl -H "X-Admin-Key: YOUR_STATS_ADMIN_KEY" "https://statedoku.com/api/stats"
```

Should return JSON with totals, daily, countries, langs, mistakes_dist.

## 7. View stats in the admin dashboard

Open https://statedoku.com/admin/dashboard/ → section "📈 Server-side game stats (D1)" → paste your `STATS_ADMIN_KEY` → click "Load stats".

## Privacy notes

- We store `country` (2-letter code from Cloudflare's edge, no IP).
- We store `lang`, `time_seconds`, `mistakes`, `puzzle_date`, `timestamp`. No personal data.
- Admin sessions are excluded from tracking (see `/js/analytics.js`).
- Events are sent via `navigator.sendBeacon` — fire-and-forget, doesn't block gameplay.
- Each event is deduped per device per puzzle_date so reloading doesn't inflate counts.

## Troubleshooting

- **`STATS_DB binding missing`** → step 3 not done or redeploy not yet triggered (wait 30s).
- **403 Forbidden on /api/stats** → wrong `STATS_ADMIN_KEY` in the X-Admin-Key header, or env var not set on Pages.
- **No events showing up** → check browser DevTools → Network → look for `POST /api/events`. If they don't fire, ad blocker may be intercepting (unlikely since same-origin).
- **Country always null** → Cloudflare's `cf-ipcountry` header missing. This happens on localhost. On the live site it should always be present.
