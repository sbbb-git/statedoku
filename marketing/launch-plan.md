# Statedoku — Launch plan (May 18 → 25, 2026)

> **Reality check first.** You'll likely have 0–10 visits per day during the first
> week. That's normal. The point of this week is not traffic — it's to seed
> credibility, capture early followers, and have your accounts/posts ready so
> that **launch day** (May 25) compounds into something.

---

## 📅 Daily orders

### Mon May 18 — D-7 · Soft teaser
- **9:00 ET**: Bot auto-posts (✅ already configured, no action)
- **Manual action (5 min)**: Follow 30 niche accounts from `strategic-accounts.md`. Like 5 of their recent tweets.
- **Goal**: 0–5 followers. That's success.

### Tue May 19 — D-6 · Format viral test
- **9:00 ET**: Bot auto-posts
- **Manual action (5 min)**: Post manually a hand-crafted emoji-grid screenshot, **no link**, just `Statedoku 🗺️ 19/05 🟩🟩🟩 🟩🟥🟩 🟩🟩🟩`. Reply to any comment with "May 25 ↗".
- **Goal**: Spark curiosity. 1 reply = win.

### Wed May 20 — D-5 · Build-in-public
- **9:00 ET**: Bot auto-posts (will be in "PRELAUNCH_NEAR" tone — hints we're days away)
- **Manual action (20 min)**: Post a 6-tweet **thread** on Twitter:
  - Hook: "I built a daily puzzle from 0→1 in 6 weeks. Here's what I learned 🧵"
  - Idea / market gap
  - Tech stack (Cloudflare + Claude bot)
  - Constraints design (100+ curated)
  - Privacy stance (no tracking)
  - "Drops Monday May 25. statedoku.com"
- Cross-post the thread to LinkedIn.
- **Goal**: 5–15 followers. 1 inbound DM = great.

### Thu May 21 — D-4 · Reddit beta (manual, no automation)
- **9:00 ET**: Bot auto-posts
- **Manual action (45 min)**: Post the **3 hand-crafted Reddit drafts** (`reddit-drafts.md`):
  - 1 post in **r/SideProject** ("I shipped a daily US states puzzle")
  - 1 post in **r/geography** ("I made a Sudoku-style US states puzzle")
  - 1 post in **r/wordle** (only if you have karma there; otherwise skip)
- **Stagger** posts 3 hours apart.
- **Reply** to the first 5 comments on each within the first hour. This is the #1 lever for Reddit reach.
- **Goal**: 20–100 visits if a single post catches fire. Otherwise 0. Both are fine.

### Fri May 22 — D-3 · Beta DMs
- **9:00 ET**: Bot auto-posts (now in countdown tone)
- **Manual action (15 min)**: DM every account that liked/replied to your posts this week. Just: *"Hey — beta is live this week if you want to try before everyone. statedoku.com. Honest feedback welcome."*
- **Goal**: 10 DMs out, 3 plays back, 1 piece of feedback.

### Sat May 23 — D-2 · Visual proof
- **9:00 ET**: Bot auto-posts
- **Manual action (10 min)**: Post a side-by-side: "Constraint of the day: borders Mexico × Pacific coast = California". Just one constraint pair with a satisfying solve image. Tag @geoguessr if you dare.
- **Goal**: 1 quote-tweet from a geography micro-influencer would be huge.

### Sun May 24 — D-1 · Countdown + Hacker News prep
- **9:00 ET**: Bot auto-posts ("LAUNCH TOMORROW")
- **Manual action (30 min)**:
  - Draft your **Show HN post** in a doc (title: `Show HN: Statedoku – daily US states puzzle`)
  - Draft your **Product Hunt submission** (title: `Statedoku — Daily US states puzzle`)
  - Both stay in draft. Don't submit yet.
  - Verify Twitter Card with `https://cards-dev.twitter.com/validator` — your OG image should render
- **Goal**: All assets ready to fire in one hour Monday morning.

### Mon May 25 — D-0 · LAUNCH 🚀

**8:00 ET** — Flip the bot to launch phase:
```bash
cd bot
# Edit src/worker.js → change PHASE = 'launch'
wrangler deploy
```

**8:30 ET** — Submit **Show HN** post to Hacker News
**8:30 ET** — Submit to **Product Hunt** (it goes live 00:01 PT but submit before)
**8:45 ET** — Post the launch tweet thread (see `tweets.html`)
**9:00 ET** — Post your **3 Reddit launch posts** (different from D-4 ones, see `reddit-drafts.md`)
**10:00 ET** — Reply to every comment, tweet, DM as it comes in
**13:00 ET** — Check stats. Bot will have posted its first launch tweet at 13:00 UTC.
**18:00 ET** — Post a "thanks for the day, here's the Day 2 puzzle" tweet
**22:00 ET** — Bot evening tweet (NO — actually launch phase = 1/day, you flip cron in `wrangler.toml`)

**Goals (realistic)**:
- 100–500 page visits
- 20–100 puzzles completed
- 3–10 emoji-grid shares on Twitter
- 5–20 email subscribers

---

## ⚙️ Setup checklist (do BEFORE May 18)

- [ ] **Bot Twitter deployed** with `PHASE = 'prelaunch'` (✅ already set in `bot/src/worker.js`)
- [ ] **Bot cron**: 2 posts/day in prelaunch (`0 13 * * *` + `0 23 * * *`). Already in `bot/wrangler.toml`
- [ ] **Test a bot post manually** before Mon May 18:
   ```bash
   curl "https://statedoku-twitter-bot.YOUR_ACCOUNT.workers.dev/?key=YOUR_KEY"
   ```
- [ ] **Email worker deployed** (✅ done — daily reminder at noon NY)
- [ ] **Resend domain verified** (DKIM + SPF) (✅ if mail testing worked)
- [ ] **Domain SSL** active on statedoku.com (✅ Cloudflare)
- [ ] **OG image** renders in Twitter Card Validator + Facebook Sharing Debugger
- [ ] **Search Console** has your sitemap submitted, no indexing errors
- [ ] **Spawn-test the May 25 puzzle** locally to make sure it's playable (✅ verified — TZ × border_mexico, accessible)

---

## 🎯 What NOT to do

- ❌ Don't run paid ads. You're not ready to convert and the targeting cost is huge for this niche.
- ❌ Don't post the same exact text on 3 subreddits — Reddit shadowbans for that.
- ❌ Don't tag huge accounts (>1M followers) hoping for retweets. You'll get ignored and look thirsty.
- ❌ Don't measure with any obsession during the first week. Look at numbers once per day at end of day, then close the tab.
- ❌ Don't change the puzzle algorithm during launch week. Whatever ships May 18 = what ships May 25.

---

## 📊 Honest expectations

| Day | Realistic visits | Realistic followers gained | Realistic plays |
|---|---|---|---|
| May 18 | 0–5 | 0–3 | 0 |
| May 19 | 0–10 | 0–5 | 0 |
| May 20 | 5–30 | 2–10 | 0–5 |
| May 21 | 10–200 *if Reddit hits* | 5–30 | 5–50 |
| May 22 | 5–30 | 2–10 | 5–20 |
| May 23 | 10–50 | 5–15 | 10–30 |
| May 24 | 20–80 | 10–25 | 20–60 |
| May 25 LAUNCH | 100–1000 *if HN hits* | 30–200 | 50–500 |

**The honest truth**: most projects get nothing. Yours has a clean product, a real angle, and pre-built infrastructure. That puts you in the top 20% of indie launches. But it still might land flat — and that's not a failure, it's the median outcome.

Plan for 30 days, not 1 day. Day 1 traction matters less than whether you keep posting on day 30.
