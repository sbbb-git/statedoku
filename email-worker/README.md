# Statedoku — Email Reminders Worker

Sends a daily puzzle reminder to subscribers. Free, unlimited, via Cloudflare's
MailChannels integration. No SaaS bill.

## Setup (one-time, ~10 min)

### 1. D1 schema
```bash
cd /Users/sacha/Desktop/Statoku
wrangler d1 execute statedoku-stats --remote --file=bot/d1-schema-email.sql
```

### 2. Find your D1 id and paste it in `wrangler.toml`
```bash
wrangler d1 list
```
Copy the UUID and replace `REPLACE_WITH_D1_ID` in `email-worker/wrangler.toml`.

### 3. MailChannels domain lockdown (security, required)
Add this **TXT record** in Cloudflare DNS for `statedoku.com`:

| Name | Type | Content |
|---|---|---|
| `_mailchannels` | TXT | `v=mc1 cfid=YOUR_ACCOUNT_ID.workers.dev` |

Replace `YOUR_ACCOUNT_ID` with your Cloudflare account id (visible in dashboard).

This locks down MailChannels so only YOUR Worker can send from
`reminders@statedoku.com`. Without it, anyone could spoof your domain.

### 4. (Recommended) SPF record
Add a TXT record on `statedoku.com`:
```
v=spf1 a mx include:relay.mailchannels.net ~all
```
If you already have an SPF record, merge `include:relay.mailchannels.net` into it.

### 5. Set the manual trigger secret
```bash
cd email-worker
wrangler secret put MANUAL_TRIGGER_KEY     # any random string
```

### 6. Deploy
```bash
cd email-worker
wrangler deploy
```

That's it. The cron fires every hour at `:05` and emails subscribers whose
`hour_utc` matches the current UTC hour.

## Manual test
After deploy, Wrangler gives you a URL like
`https://statedoku-email-reminders.YOUR_ACCOUNT.workers.dev`.

```bash
curl "https://statedoku-email-reminders.YOUR_ACCOUNT.workers.dev/?key=YOUR_MANUAL_TRIGGER_KEY"
```
Returns JSON `{ ok, fail, total }` — the count of subscribers processed this run.

## Cost
- Cloudflare Worker (with cron): free (well within the 100k req/day free tier)
- MailChannels send: **free, unlimited**
- D1: free up to 5M rows
- Net cost: $0/month

## Logs
```bash
cd email-worker
wrangler tail
```
