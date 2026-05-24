# 🚀 Launch playbook — Hacker News + Product Hunt
**Launch day: Monday June 1, 2026**

---

## 📋 Pre-launch checklist (DO BEFORE June 1)

| When | Task | Why |
|---|---|---|
| **NOW** | Verify `/press/` page is live + screenshots load | HN/PH readers click through |
| **NOW** | Set up email forwarding `sacha@statedoku.com` → your Gmail | People will email after seeing the post |
| **NOW** | Make sure SPF/DKIM/DMARC are passing | Outgoing replies don't go to spam |
| **NOW** | Set `ADMIN_NOTIFY_EMAIL` on Cloudflare Pages env | Get pinged when someone signs up |
| **Wed May 28** | Create a Product Hunt account if you don't have one | Need 5+ days of "warming up" before posting |
| **Thu May 29** | Create the PH draft (private) — fill all fields | Reviewing your own draft 24h before is essential |
| **Fri May 30** | Test the live site under load — refresh 50× | Cloudflare cache should warm up |
| **Sat May 31** | Final QA: play full puzzle on iOS Safari + Chrome Android | HN/PH traffic is 60%+ mobile |
| **Sun May 31, 22h FR** | Schedule HN post for Mon 9h ET via browser tab open | HN doesn't have native scheduling |
| **Mon June 1, 9h ET (15h FR)** | Submit HN + publish PH | The two simultaneously |

---

# 1️⃣ Hacker News — Show HN post

## ⏰ When to post
**Monday June 1, 9:00 AM Eastern Time = 15:00 Paris time = 06:00 California time.**

Why this time:
- Most HN voters are US-based
- 9h ET = US East coast starts their day, West coast still asleep
- Monday morning = best traffic day on HN
- 9h ET specifically is the "new front-page" cycle window

⚠️ **Don't post a few hours earlier "just in case"** — late-night submissions die fast.

## 📝 The post

### Title
```
Show HN: Statedoku – Daily 3x3 puzzle to learn US geography
```

**Why this title** :
- "Show HN:" prefix is required (it's a labeled section)
- Mention the format ("3x3 puzzle") for immediate recognition
- "Daily" signals it's not a one-shot
- "Learn US geography" adds educational angle (HN likes pedagogy)
- Use `3x3` not `3×3` — HN strips unicode in titles sometimes
- 60 chars, well under 80 char limit

### URL field
```
https://statedoku.com/
```
⚠️ NO UTM tags in HN URL. HN strips them anyway, and untagged looks cleaner.

### Body (text field — optional but RECOMMENDED for Show HN)

```
Hi HN,

I built Statedoku to scratch my own itch: a daily geography puzzle that's actually 
learning-shaped, not just trivia. Wordle is great but doesn't really teach you 
anything; I wanted something that would.

The mechanic is a 3×3 grid where each cell must be a US state that satisfies both 
its row constraint and its column constraint — like "borders Canada" × "no income 
tax" (answer: AK, WA, or NH). 100+ rotating constraints across geography, history, 
economy, and borders. Every puzzle has exactly one solution, no guessing required.

Technical bits some of you might find interesting:

- Puzzle generator is a deterministic seeded solver — given a date, it picks 6 
  constraints (3 rows + 3 columns) and proves there's exactly one assignment of 
  9 states that satisfies all 6 constraints. Constraint propagation + backtracking 
  + uniqueness check. Took some doing to keep difficulty balanced.
- Stack is intentionally boring: vanilla JS (no framework), Cloudflare Pages 
  for hosting, D1 (SQLite at the edge) for analytics + email reminders, 
  Cloudflare Workers for the Twitter bot and the email cron.
- Privacy-first: Cloudflare Web Analytics only (no GA4, no cookies, no 
  consent banner needed). Total tracker count: 0.
- Multilingual: EN, FR, ES (~50% of users so far are non-US — French and Spanish 
  speakers learning American geography turns out to be a thing).
- Free public JSON API at /api/ — return data on all 50 states with no auth, 
  CORS-enabled. Built for whoever wants to build on top.

Free, no signup, no ads. I'd love feedback — especially on the constraint 
difficulty curve (it's the part that's hardest to tune objectively).

Quick links if it helps:
- Play: https://statedoku.com
- How it works (mechanic + constraints): https://statedoku.com/how-to-play/
- API: https://statedoku.com/api/
- Source code: not open-sourced yet (might do it post-launch if there's interest)
```

**Length:** ~340 words. HN sweet spot is 200-400.

**Why this body** :
- Opens with "the itch" — HN respects scratching one's own itch
- Quickly admits Wordle isn't enough (positions vs competitor without bashing)
- Lists THREE technical concrete details — HN votes on technical depth
- Mentions "boring stack" → HN loves admitting you don't need React
- Open data API → developer-friendly signal
- Closes asking for specific feedback (difficulty curve) → invites engagement

---

## 💬 Your first comment (post within 5 minutes of the submission)

After you submit, IMMEDIATELY post this as a top-level comment from your own HN account:

```
Author here, happy to answer questions.

A few things I learned that surprised me building this:

1. Most US-state quizzes online assume you grew up in the US — they show outlines 
   of states with no context. This excludes basically the entire world. So I built 
   Statedoku around verbal constraints ("borders Canada", "named after a king") 
   instead of shape recognition.

2. Only 17 of 50 state capitals are the largest city of their state. Try guessing 
   the capital of Texas, California, or New York from memory — most people get 
   them wrong. There's a deep-dive page about this if you're curious: 
   /learn/states-without-capital-largest/

3. The hardest constraints to write were the FALSE ones. "Not bordering Canada" 
   is technically a valid constraint but unbearably boring. Took multiple passes 
   to get the constraint pool to read like trivia rather than logic exercises.

The constraint catalog is at /admin/constraints/ (read-only public view: 
/learn/state-abbreviations/ has a related table).

Roadmap: weekly themed puzzles (e.g. "the original 13 colonies week"), an iOS PWA 
push reminder, and maybe a multiplayer mode if launch goes well.
```

**Why this comment** :
- Establishes you're the author and active
- Gives THREE substantive anecdotes (numbered) — HN loves "things I learned"
- Each anecdote has a link to a Statedoku page (drives clicks)
- Ends with roadmap → signals you're not abandoning the project

---

## 🗳️ Upvote strategy (within HN guidelines)

✅ **OK**:
- Tell 3-5 close dev friends in advance: "I'm posting on HN Mon 9 ET, would mean a lot if you upvoted naturally"
- Post in your personal Twitter/LinkedIn at 9:05 ET with the HN link
- Share in 2-3 indie Slacks/Discords you're in

❌ **NOT OK** (will get you flagged and banned):
- Asking strangers to upvote
- Buying upvotes
- Creating sock-puppet accounts
- Posting in r/HackerNews or similar to organize voting
- Asking >10 people to upvote (HN detects unusual vote velocity)

## 🎯 Reply playbook (next 6 hours after posting)

Stay AT YOUR KEYBOARD for 4-6 hours after posting. Reply to every top-level comment within 20 minutes. HN voters watch author engagement.

### If someone says "great idea, I'd play this"
```
Thanks! Curious to hear how you find the difficulty — most feedback so far says 
the first 3 constraints feel obvious and the last 3 ramp hard. Would love to know 
where you found the inflection.
```

### If someone says "what about Geoguessr / Worldle / Tradle?"
```
Geoguessr is street-view recognition (excellent but very different). Worldle is 
country-shape — Statedoku is the US-state equivalent in spirit but with verbal 
constraints instead of visual. Tradle is closest in audience but uses export-data 
clues only. The closest comparison is probably crossword puzzles, just constrained 
to geography.
```

### If someone says "why not open-source it?"
```
Fair question. The puzzle generator and constraint catalog took most of the build 
time — I'd want to open-source the static data first (the constraint definitions, 
which would be a useful CSV), then maybe the solver. Not opposed to it. What part 
would you want to see?
```

### If someone says "the difficulty curve is off"
```
Yeah, I'm aware. Curious what threw you — was it a specific constraint, or the 
density of "obscure" constraints? Working on a per-puzzle difficulty score so the 
calendar shows easier vs harder days.
```

### If someone says "doesn't work on mobile"
```
Yikes — what device + browser? Site is built mobile-first and tested on iOS 
Safari, Chrome Android, but if you hit something I want to fix it today. DM 
or email contact@statedoku.com with a screenshot if you can.
```

### If someone says "great game" (low-value comment)
```
Thanks for trying it!
```
(Then move on — don't waste cycles on low-engagement replies.)

---

## 📈 Success metrics

| Metric | Floor | Target | Ceiling |
|---|---|---|---|
| Karma on the post | 30 | 100 | 500+ |
| Comments | 5 | 30 | 100+ |
| Hours on front page | 0 | 4 | 12+ |
| Click-through to site | 100 | 5,000 | 50,000 |
| Email signups same day | 5 | 50 | 500 |

If you hit "Target" column: bumps DA by 3-5 points overnight + 10+ backlinks in 24h.

---

# 2️⃣ Product Hunt — Launch fiche

## ⏰ When to launch
**Monday June 1, 12:01 AM PST = 09:01 Paris time = 03:01 New York.**

PH "Day" = 24h starting at midnight Pacific. If you launch at noon PST you waste half the day.

## 🏗️ Setting up the PH fiche (do this BEFORE launch day)

### 1. Account setup (TODAY)
- Create account at https://www.producthunt.com/
- Add a real headshot + Twitter/LinkedIn
- Comment thoughtfully on 5-10 other products this week (warm up your account)

### 2. Create the draft (Fri May 29 evening)
Go to https://www.producthunt.com/posts/new

### Product name
```
Statedoku
```

### Tagline (60 chars max, this is the BIG ONE — A/B test these)

**Option A (Recommended)** — focuses on what it does:
```
Daily 3×3 grid puzzle to learn US geography
```
(43 chars)

**Option B** — focuses on Wordle audience:
```
Wordle for US states. Daily 3×3 logic puzzle.
```
(46 chars)

**Option C** — quirky:
```
Sudoku × Wordle × US geography. Plays in 2 min.
```
(48 chars)

**Option D** — direct value:
```
Learn US states by playing 2 minutes a day
```
(43 chars)

**Option E** — promise-based:
```
The daily puzzle that teaches you US geography
```
(47 chars)

→ I'd ship A. It's the clearest and ranks for "US geography" in PH search.

### Description (260 chars max)
```
Statedoku is a free daily puzzle: fill a 3×3 grid with US states, where each cell 
must match its row and column constraint (borders Canada × no income tax, etc.). 
100+ rotating clues. No signup, no ads. Multilingual (EN/FR/ES).
```
(257 chars)

### First comment (auto-posted as you, the "Maker", on launch)

```
Hey Hunters 👋

I'm Sacha, the dev behind Statedoku. I built it because I wanted a daily geography 
puzzle that actually taught me something — Wordle is fun but doesn't help me know 
anything I didn't know before.

The mechanic: 3×3 grid where each cell must be a US state matching two constraints 
(its row clue × its column clue). For example, the cell at row "borders Canada" × 
column "no income tax" can only be Alaska, Washington, or New Hampshire.

100+ rotating constraints across borders, regions, history, economy. Every puzzle 
has exactly ONE solution — no guessing.

What's different vs other Wordle clones:
✅ Logic + geography, not word-guessing
✅ Forgiving (3 mistakes allowed)
✅ Free, no signup, no ads, no tracking
✅ Multilingual (EN/FR/ES — ~50% of users so far are non-US)
✅ Free public JSON API for developers

The full press kit (logos, screenshots, factsheet) is at statedoku.com/press/

Would love your honest feedback — especially on difficulty calibration. And happy 
to answer any questions about the puzzle generation algorithm or the tech stack 
(vanilla JS + Cloudflare Pages + D1).

Cheers,
Sacha
```

### Topics (pick 4)
- Education
- Productivity
- Games (CORE — gives you category visibility)
- Travel
(Optionally: Open Source, Free)

### Gallery images (4-5 screenshots — order matters!)

**Slot 1 (most important — this is the thumbnail)** :
`/press/screenshots/press-solved-1920x1280.png` — the WIN state is the most clickable thumbnail.

**Slot 2** :
`/press/screenshots/press-intro-1920x1280.png` — empty grid showing the mechanic.

**Slot 3** :
`/press/screenshots/press-mid-1920x1280.png` — mid-game with the warning banner. Shows there's actual gameplay tension.

**Slot 4** (custom — make in Figma or similar):
Mockup showing "100+ constraints" — a 3-column grid of constraint examples: "Borders Canada", "Named after a king", "Has Yellowstone", etc.

**Slot 5** (optional GIF):
6-second screen recording of solving a puzzle. Record on your phone via QuickTime + iPhone mirror or `xcrun simctl io recordVideo`.

### Links to fill in
- Website: `https://statedoku.com/?utm_source=producthunt&utm_medium=referral&utm_campaign=launch-2026-06-01`
- Twitter: `@statedoku` (if you don't have one yet, register it BEFORE launch)
- (Optional) Made with: Cloudflare Pages
- (Optional) Pricing: Free

### Maker
Add yourself as the Maker. If you have any collaborators (designer, copywriter, even your barber who suggested the name), add them as Hunter/Maker — every collaborator gets their network notified.

---

## 🗳️ PH upvote strategy

### Build a "launch squad" list THIS WEEK
Write a Google Doc with names + how you know them + best way to reach them. Target: 30 names.

### Send at T-3 days (Friday May 29)
A simple message to each:
```
Subject: Quick favor — I'm launching Statedoku on Product Hunt Monday

Hey [Name],

Quick ask: I'm launching Statedoku (daily US geography puzzle I built) on 
Product Hunt next Monday June 1. The first 4 hours are crucial for the ranking.

Would you be up for upvoting + dropping a 1-line comment around 10am PST 
(7pm Paris) on Monday? Takes 30 seconds.

I'll send you the link Monday morning.

No worries if you can't — really appreciate you reading this either way.

[Your name]
```

### Send the link on launch day at 9:00 AM PST
```
Subject: Statedoku is LIVE on Product Hunt — link inside

[Name],

🚀 https://www.producthunt.com/posts/statedoku

If you have 60 seconds, upvote + drop a comment ("Played 3 puzzles, fun!" 
is plenty). Comments matter more than upvotes for the algorithm.

Thank you 🙏
[Your name]
```

⚠️ **Don't ask for upvotes IN THE COMMENT** (PH removes comments that say "please upvote"). Comments should be genuine reactions.

## 📈 PH success metrics

| Metric | Floor | Target | Ceiling |
|---|---|---|---|
| Upvotes | 50 | 200 | 800+ |
| Comments | 5 | 30 | 100+ |
| Day rank | Top 20 | Top 5 | #1 Product of the Day |
| Followers acquired | 5 | 30 | 200 |
| Click-through to site | 500 | 2,000 | 15,000 |

Hitting "Product of the Day" = badge on your PH page forever + featured in PH newsletter (~100k subs).

---

## 🚨 The two hardest mistakes to avoid

1. **Posting too early on HN** — anything before 8 AM ET = dead by 9 AM ET. Wait for the actual window.
2. **Asking for upvotes openly on PH** — gets the comment hidden + can mark your launch as inauthentic. Always ask via DM/email/Slack, never on the public PH page.

---

## ✅ Day-of execution checklist

| Time (Paris) | Action |
|---|---|
| 08:30 | Coffee. Open laptop. |
| 08:55 | Open HN tab + Show HN form. PH already in draft. |
| 09:00 | PH: click "Publish". Take screenshot for backup. |
| 09:01 | PH: post your "Maker comment" (template above). |
| 09:05 | Email your launch squad with PH link. |
| 14:30 | Lunch. Stay near laptop. |
| 15:00 | HN: submit the Show HN post. |
| 15:02 | HN: post your first comment (template above). |
| 15:05 | Tweet from @statedoku linking BOTH posts. |
| 15:05 | Tweet personal account "I just launched Statedoku, would mean a lot if you played 1 puzzle". |
| 15:05-21:00 | Reply to every HN + PH comment within 20 min. |
| 21:00 | Close laptop. You earned it. |
| 22:00 | Check rankings, plan tomorrow's followup post if Top 5 PH. |

---

## 📊 Tomorrow (Tuesday June 2)

If launch went well:
- Write a "thank you" post on PH comments + new HN comment with day-1 stats
- Email anyone who emailed/DM'd you to thank them
- Submit to the smaller daily-game aggregators (use the spare momentum)
- Send the 15 outreach mails (you'll have a "we just launched yesterday" angle to add)

If launch was middling:
- Don't repost. PH and HN both ban reposts. The first launch is your shot.
- Pivot to the slow-burn: outreach mails + content SEO + Twitter warming.

---

You've got this. 🇺🇸🇫🇷🇪🇸
