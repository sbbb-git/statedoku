# 🤖 Statedoku Twitter Bot

Cloudflare Worker that auto-tweets the daily Statedoku announcement at midnight UTC.

## Quick start

### 1. Get Twitter API credentials

1. Go to [developer.twitter.com](https://developer.twitter.com), create a Project + App.
2. In the App settings, enable **User authentication** with read+write permissions.
3. Copy the 4 keys you'll need:
   - **API Key** (consumer key)
   - **API Key Secret** (consumer secret)
   - **Access Token**
   - **Access Token Secret**

### 2. Deploy the Worker

```bash
cd bot
npm install -g wrangler                # if not already installed
wrangler login                          # one-time browser auth

# Set the 4 Twitter secrets (paste each value when prompted):
wrangler secret put TWITTER_API_KEY
wrangler secret put TWITTER_API_SECRET
wrangler secret put TWITTER_ACCESS_TOKEN
wrangler secret put TWITTER_ACCESS_TOKEN_SECRET

# Set a random string used to manually trigger the bot (for testing):
wrangler secret put MANUAL_TRIGGER_KEY   # e.g. "ax7Bz9k2NpMq4WrLeXfHy"

# Deploy:
wrangler deploy
```

That's it. The cron will fire daily at 14:00 UTC.

### 3. Test manually

After deploy, get your Worker URL (something like `https://statedoku-twitter-bot.YOUR_ACCOUNT.workers.dev`).

```bash
# Dry-run preview (no actual post):
curl "https://statedoku-twitter-bot.YOUR_ACCOUNT.workers.dev/?key=YOUR_MANUAL_TRIGGER_KEY&dry=1"

# Actually post the tweet now:
curl "https://statedoku-twitter-bot.YOUR_ACCOUNT.workers.dev/?key=YOUR_MANUAL_TRIGGER_KEY"
```

## Customize

- **Posting time**: edit `crons` in `wrangler.toml` (Cron syntax). `0 14 * * *` = 14:00 UTC daily.
- **Tweet templates**: edit `ANNOUNCEMENTS` array in `src/worker.js`. Each function takes a date string and returns a tweet.
- **Multiple tweets per day**: add more cron lines, e.g. `"0 14 * * *"` and `"0 22 * * *"`.

## Twitter API tier requirements

The bot only uses **POST /2/tweets** (1 call per day). This is available on the **Free** tier of Twitter API (max 17 posts/24h). No paid plan needed for this bot.

If you want to add reading mentions / replying / liking, you'll need at least the **Basic** tier ($200/mo).

## Logs

```bash
wrangler tail            # live log stream
```

You'll see lines like `[Statedoku Bot] ✓ posted 201 …` for each daily run.
