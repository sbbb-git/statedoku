# Reddit drafts — Manual posting (NOT automated)

> **Rules of engagement**: post manually, stagger 3+ hours, reply to first 5 comments within the hour, never copy-paste same text across subs.

---

## D-4 (Thursday May 21) — Pre-launch awareness

### r/SideProject (~120k members, indie-friendly)

**Title**:
`After 6 weeks of nights and weekends — a daily US-states puzzle (Wordle for geography). Launch May 25.`

**Body**:
```
Hi r/SideProject —

I've been building a small daily game called Statedoku for the past 6 weeks.
It's a 3×3 grid where each cell must hold a US state that satisfies both
the row and column constraints (e.g. "Pacific coast × borders Mexico = California").
Sudoku rules — each state used at most once. 3 mistakes allowed.

It's been a fun build:
- Vanilla JS, no framework
- Hosted on Cloudflare Pages (free tier, sub-100ms globally)
- Cloudflare D1 for analytics, Worker cron for the Twitter bot
- 100+ hand-curated constraints (regions, borders, name origin, sports, etc.)
- Multilingual: EN / FR / ES
- No accounts, no tracking, no ads. Just the puzzle.

The official launch is **Monday May 25** but the site is live now if you want
to give Day 0 a spin: https://statedoku.com

Happy to chat about the technical side, the constraint-design hell, or
the marketing strategy I'm trying. Honest feedback welcome.
```

---

### r/geography (~1.2M members, geography enthusiasts)

**Title**:
`I built a daily US-states puzzle inspired by Wordle — testing this week before official launch`

**Body**:
```
Hey r/geography —

Made a small daily game called Statedoku. It's a 3×3 grid where each cell
must contain a US state that satisfies both its row and column constraint.

Examples of constraints:
- Pacific coast / borders Mexico / starts with M / Original 13 colonies
- Has an NBA team / Named after royalty / On the Mississippi
- Mountain time zone / Republican-leaning / etc.

Each state used at most once. 3 mistakes allowed. The puzzle is the same
for everyone in the world that day.

Looking for feedback from the geo crowd before official launch May 25:
1. Are the constraints fair? (I curated ~100 — no obscure trivia)
2. Anything missing? (e.g. constraint types you'd love to see)

Site: https://statedoku.com

It's free, no signup, runs in the browser.
```

---

### r/wordle (~1M members, daily-game enthusiasts) — *only if you have ≥100 karma there*

**Title**:
`Daily US states puzzle — same vibe as Wordle, same emoji-share format`

**Body**:
```
Big Wordle player here — built something I've been wanting for a while:
a daily puzzle that uses US geography instead of word letters.

3×3 grid, fill each cell with a US state that satisfies both its row
and column constraint. 3 mistakes allowed. Emoji grid share at the end:

Statedoku 🗺️ 21/05
🟩🟩🟩
🟩🟥🟩
🟩🟩🟩

Same daily ritual feel. Different brain muscle (geography knowledge instead
of vocabulary). Looking for early players to break it.

https://statedoku.com — free, no signup. Daily reset at midnight.
```

---

## D-0 (Monday May 25) — Launch day

### r/SideProject (do NOT repost the D-4 one — make this a launch update)

**Title**:
`Launched my daily US-states puzzle today (Statedoku). 6 weeks indie build, AMA on the tech.`

**Body**:
```
6 weeks ago I started building a daily puzzle (Statedoku) — Wordle for
US geography. Today's the official launch day with Day #1 of the daily series.

Stack rundown if anyone's curious:
- Cloudflare Pages (static site, no backend code in the main app)
- Cloudflare D1 + Pages Functions for analytics
- Cloudflare Worker (Twitter bot, Resend for daily email reminders)
- Anthropic Claude API for the Twitter bot's daily tweet content
- Total cost: ~$0.30/month at current traffic

Some technical choices I'd love feedback on:
1. Puzzle generator runs entirely client-side, deterministic from the date
2. Hard cap on "dominant states" (CA/NY/TX) — max 2 per puzzle solution
3. ~100 curated constraints + 87 active, hand-tuned for fairness

What I learned about indie launching, top regret, what surprised me — happy
to share in comments.

https://statedoku.com
```

---

### r/dailygames (~15k members, super niche)

**Title**:
`Day #1 of Statedoku — daily US-states puzzle launches today`

**Body**:
```
For the daily-puzzle nerds — Statedoku launches today. Day #1 of the
daily series, same rules every day, same puzzle for everyone in the world.

3×3 grid, fill each cell with a US state that satisfies both row and
column constraints. Emoji-grid share, midnight reset, free.

https://statedoku.com

Looking for the kind of feedback you only get from people who do 5
daily games every morning. What works, what's weird.
```

---

### r/geography (D-0 launch update)

**Title**:
`Statedoku — daily US geography puzzle officially launches today (Day #1)`

**Body**:
```
Got positive feedback from this sub on the beta last week. Today is the
official Day #1 launch.

Today's constraints if you want to dive in:
- Rows: Central time / Mountain time / Pacific time
- Cols: Borders Mexico / Contains the letter W / Swing state

[do NOT spoil the solution — let people work it out]

https://statedoku.com

Thanks for the early feedback. Adjusted the constraint pool based on what
you flagged as "too obscure".
```

---

## 🎯 Comment-response templates

Common comments + suggested replies (so you don't freeze when they roll in):

| Comment type | Suggested reply |
|---|---|
| "Cool, but it's US-only" | "Yeah — picked US states because the constraint space is rich and well-known. Eurodoku and Asiadoku are on my list once US version finds an audience." |
| "Why no app?" | "PWA — works installed on iOS / Android home screen. Skipped the App Store to avoid the 30% fee + review bullshit." |
| "Hard mode?" | "On the roadmap. Currently working on a single difficulty that's accessible but not trivial. Hard mode will probably mean fewer hints + more obscure constraints." |
| "Multilingual?" | "Yes — English, French, Spanish. State names + all 87 active constraints translated." |
| "How do you pick constraints?" | "Hand-curated. About 200 candidates went through review, 87 ended up in the active pool. No demographic / subjective ones — only factual / geographic / historical." |
| Negative comment about constraint X | "Fair — noting it. The pool is intentionally curated and I tweak based on feedback like this. Thanks." |

---

## 🚫 What to NOT do

- ❌ Don't open a thread saying "please upvote 🙏". Reddit bans for this.
- ❌ Don't post on r/programming or r/webdev unless you have a real technical angle. Wrong audience.
- ❌ Don't post the same title verbatim across subs.
- ❌ Don't reply with "thanks!" — reply with actual content.
- ❌ Don't argue with downvoters. Move on.
