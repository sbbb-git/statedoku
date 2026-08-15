# Statedoku posting bot

Two posts a day, no LLM at runtime, no X API bill.

- **13:00 UTC** posts from the `game` slot and links to the puzzle.
- **23:00 UTC** posts from the `page` slot and links to the page that tweet is about.

Text comes from `data/tweets.json`, a pre-generated bank served from the site.
The `game` list holds 200 tweets and the `page` list 400, indexed by day number,
so the game side repeats after 200 days and the page side after 400. The two
advance independently, so a missed run cannot desynchronise them.

Rebuild the bank with `python3 tmp/rebuild-tweet-bank.py`.

## Why it does not go through the X API any more

X has been pay-per-use since February 2026. There is no free tier, and a post
that contains a URL is billed at 0.20 USD against 0.015 USD for a plain one.
Both of our daily posts carry a link by design, so the X API route costs about
12 USD a month. That is what the bill was.

Buffer publishes to X through its own approved X app. No X developer account,
no per-post charge, and the Buffer free plan covers a single X channel. That is
the route the worker uses when `BUFFER_TOKEN` and `BUFFER_CHANNEL_ID` are set.

Buffer's free plan caps a channel queue at 10 scheduled posts, which we never
approach: each cron run schedules one post three minutes out and Buffer
publishes it, so queue depth stays at 1.

## Setup

Everything is a Cloudflare secret. A network switches on when its secrets are
present, so changing route means adding or deleting secrets, never editing code.

```bash
wrangler secret put MANUAL_TRIGGER_KEY
```

### Buffer, the free route to X

Deployed at <https://statedoku-twitter-bot.sachabitoun17.workers.dev>.

1. Connect the X account at <https://publish.buffer.com> on the free plan.
2. Create an API key at <https://publish.buffer.com/settings/api>. It looks like
   `buf_...` and acts on your whole account.
3. `npx wrangler secret put BUFFER_TOKEN`, then paste the key at the prompt.
4. Find the channel id, straight from Buffer, no deploy needed:

   ```bash
   node bot/buffer-channels.mjs buf_your_key_here
   ```

   It prints every channel with its service and id, and points at the X one.
   The same thing is available through the worker if you prefer:
   `curl "https://statedoku-twitter-bot.sachabitoun17.workers.dev/?key=<MANUAL_TRIGGER_KEY>&buffer_channels=1"`
5. `npx wrangler secret put BUFFER_CHANNEL_ID`, then paste the id.

Nothing posts to X until both are set. Until then the worker runs and posts
nowhere, which is the safe state.

### Bluesky, free

App password from Settings > App Passwords, not the account password.

```bash
wrangler secret put BLUESKY_HANDLE          # statedoku.bsky.social
wrangler secret put BLUESKY_APP_PASSWORD
```

Bluesky does not linkify URLs on its own. The worker computes rich-text facets
over the UTF-8 bytes of the post, which matters because the tweets contain
emoji: using JS string indices puts every link in the wrong place.

### Mastodon, free

Token from Preferences > Development > New application, scope `write:statuses`.

```bash
wrangler secret put MASTODON_HOST           # https://mastodon.social
wrangler secret put MASTODON_TOKEN
```

### X directly, paid

Only if you decide the 12 USD a month is worth it.

The four `TWITTER_*` secrets are not enough on their own. The paid path also
needs `X_PAID_ENABLED` set to the string `true`, so that leftover credentials
from an earlier setup can never quietly start billing at 0.20 USD a post:

```bash
wrangler secret put TWITTER_API_KEY
wrangler secret put TWITTER_API_SECRET
wrangler secret put TWITTER_ACCESS_TOKEN
wrangler secret put TWITTER_ACCESS_TOKEN_SECRET
wrangler secret put X_PAID_ENABLED          # the literal string: true
```

Buffer takes precedence over this, so having both live never double-posts.

To stop paying, deleting `X_PAID_ENABLED` is enough. The credentials can stay.

`ANTHROPIC_API_KEY` is no longer used at all. Delete it with
`wrangler secret delete ANTHROPIC_API_KEY`.

## Testing

```bash
curl "https://<worker>/?key=<MANUAL_TRIGGER_KEY>&dry=1"
```

Shows the tweet that would go out, which slot it came from, and which networks
are configured, without posting anything.

## If you would rather not automate at all

`python3 tmp/export-tweet-schedule.py 2026-09-01 90` writes
`bot/exports/statedoku-schedule.csv`, a dated list of every post. X's own
composer has a free scheduler (the calendar icon), so pasting a month of posts
in one sitting costs nothing and depends on no third party. The export resolves
the same rotation the worker uses, so both routes send the same tweet on the
same day.

## What not to do

X's Developer Guidelines state that non-API automation, meaning scraping or
browser automation, results in permanent suspension. There is no version of
that shortcut worth the account.

X also disallows duplicate posts. The bank has no repeated text and 200 days of
runway on the shorter list, so this only becomes a concern once it wraps.

## Dependency worth knowing

The worker reads the bank from <https://statedoku.com/data/tweets.json> and
requires the two-slot v2 shape. If the site has not been deployed since the bank
was rebuilt, production still serves v1, the worker cannot find its slots, and
it falls back to a single generic tweet. Push the site before expecting the two
daily posts to be correct.

Check which version is live:

```bash
curl -s https://statedoku.com/data/tweets.json | head -c 40
```
