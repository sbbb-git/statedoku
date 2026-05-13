# 🤖 Statedoku Twitter Bot (Claude-powered)

Cloudflare Worker that posts a daily tweet on X (@Statedoku) every day at 14:00 UTC.
Tweet content is **generated fresh by Claude API** (no repetition).

## Architecture

```
Daily cron (14:00 UTC)
     ↓
Worker wakes up
     ↓
Calls Anthropic Claude API ($0.001 per tweet)
     ↓
Generates a unique tweet (rotates 7 styles by day-of-year)
     ↓
Posts via Twitter API v2 (OAuth 1.0a)
```

## Setup (one-time, ~15 min)

### 1. Twitter Developer Portal

1. Go to https://developer.twitter.com → Sign up for Free tier ($0)
2. Create a Project + App with name "Statedoku Bot"
3. In **User authentication settings**: enable OAuth 1.0a with read+write permissions
4. From **Keys and tokens** copy these 4 values:
   - API Key (consumer key)
   - API Key Secret (consumer secret)
   - Access Token
   - Access Token Secret

### 2. Anthropic API Key

1. Go to https://console.anthropic.com → Sign up
2. Add ~$5 credits (lasts ~3 years at 1 tweet/day with Haiku model)
3. Create an API key in **Settings → API Keys**
4. Copy the key (starts with `sk-ant-…`)

### 3. Deploy the Worker

```bash
cd <repo root>/bot
npm install -g wrangler         # if you don't already have it
wrangler login                   # opens browser to authenticate

# Paste each secret when prompted:
wrangler secret put TWITTER_API_KEY
wrangler secret put TWITTER_API_SECRET
wrangler secret put TWITTER_ACCESS_TOKEN
wrangler secret put TWITTER_ACCESS_TOKEN_SECRET
wrangler secret put ANTHROPIC_API_KEY
wrangler secret put MANUAL_TRIGGER_KEY      # any random string for manual testing

# Deploy:
wrangler deploy
```

That's it. The cron schedule in `wrangler.toml` will fire automatically every day at 14:00 UTC.

### 4. Test manually (dry-run, no actual post)

After deploy, Wrangler gives you a URL like `https://statedoku-twitter-bot.YOUR_ACCOUNT.workers.dev`.

```bash
# Preview what Claude generates (does NOT post)
curl "https://statedoku-twitter-bot.YOUR_ACCOUNT.workers.dev/?key=YOUR_MANUAL_TRIGGER_KEY&dry=1"

# Actually post a tweet right now
curl "https://statedoku-twitter-bot.YOUR_ACCOUNT.workers.dev/?key=YOUR_MANUAL_TRIGGER_KEY"
```

## How tweet variety works

The bot rotates through **7 styles** based on day-of-year:
1. Daily reminder
2. Geography "did you know"
3. Engagement poll / question
4. Single-state spotlight
5. Wordle/Connections comparison
6. Meme-y playful post
7. Streak / brag invitation

Claude sees the date, the style of the day, and gameplay context. It writes a fresh, on-brand tweet under 270 chars with a hashtag + URL.

**Result**: 365 unique tweets a year, never the exact same thing twice.

## Cost

| Item | Per tweet | Per month | Per year |
|---|---|---|---|
| Anthropic Claude Haiku | ~$0.0008 | $0.024 | $0.30 |
| Cloudflare Workers | $0 (free tier) | $0 | $0 |
| Twitter API Free | $0 | $0 | $0 |
| **TOTAL** | **~$0.001** | **~$0.02** | **~$0.30** |

So: **~30 cents per year** to run the bot. Yes really.

## Customize

- **Posting time**: edit `crons` in `wrangler.toml` (Cron syntax). `0 14 * * *` = 14:00 UTC daily.
- **Tweet styles**: edit the `STYLES` array in `src/worker.js`.
- **Prompt**: edit `generateTweetText` for tone/format changes.
- **Multiple tweets per day**: add more cron lines.

## Logs

```bash
wrangler tail     # live log stream
```

You'll see `[Statedoku Bot] ✓ 201 <tweet text>` for each successful daily run.

## Fallback

If Claude API is unavailable for any reason (rate limit, network, etc.), the bot falls back to a simple hardcoded daily-reminder tweet. The bot won't miss a day.
