# 🟠 r/statedoku — Kit de lancement community

Tout le texte ready-to-copy. Suis l'ordre. Ne saute pas d'étape.

---

## 📋 1. SETUP TECHNIQUE (10 min — fais ça d'abord)

### A. Subreddit Settings → Community details

**Public description (le texte qui apparaît dans la sidebar et sur Google)** :
```
The daily 3×3 puzzle for US geography. Fill nine US states matching row + column constraints. New puzzle every day at midnight UTC. Free, no signup. Play at statedoku.com 🇺🇸
```
(300 caractères max — le texte ci-dessus = 198)

**Display name** :
```
Statedoku — Daily US Geography Puzzle
```

**Topics** (Reddit te fait choisir 3) :
- `Trivia & Word Games`
- `Education`
- `Games`

### B. Type & Region

- **Type** : Public
- **Region** : US (même si tu es en FR — c'est le pays du contenu)
- **Country** : United States
- **NSFW** : non
- **Discoverable** : oui (active "Show in search results")

### C. Visual identity (5 min)

**Icon (subreddit icon, 256×256)** :
- Upload `logo-mark-512.png` depuis `/Users/sacha/Desktop/Statoku/`

**Banner (subreddit banner, 4000×128 ou plus large)** :
- Use `og/home-en.png` cropped to banner ratio, OR
- Use `press/screenshots/press-solved-1920x1280.png` as background with text "r/statedoku — daily US geography puzzle"

**Color scheme** :
- Header / accent : `#0F2147` (navy)
- Highlight : `#F59E0B` (gold)

---

## 📜 2. RULES (community rules — copy-paste exact)

Aller dans Mod Tools → Rules → Add Rule pour chacune :

**Rule 1: Be respectful**
> No personal attacks, slurs, or harassment. Discuss the puzzle, not the people.

**Rule 2: Spoilers — use the spoiler tag for today's puzzle**
> Don't reveal today's puzzle solution in titles. Use the `>!spoiler!<` tag for state names and clue reveals in comments. Past puzzles (archive) — no spoiler tag needed.

**Rule 3: No self-promotion of other games/sites without context**
> Mention of similar puzzles (Wordle, Worldle, Tradle, Connections) in conversation is welcome. Posting your own product without contributing to discussion is not.

**Rule 4: Constructive feedback on the puzzle is encouraged**
> Found a constraint that feels unfair, a state that should match a clue but doesn't, a UX bug, or a translation issue? Post it. The dev (u/[your_username]) reads everything.

**Rule 5: No low-effort posts**
> "Day X — what was your time?" daily threads are pinned. Posts copying that format outside the thread will be removed. Original strategy posts, screenshots of cool grids, or meta-discussion are welcome.

**Rule 6: English, French, Spanish — all welcome**
> Statedoku is multilingual. Post in any of the three. Use flair to mark the language if it helps.

---

## 🏷️ 3. POST FLAIRS (Mod Tools → Post Flair)

Crée ces 7 flairs :
- **🎯 Daily Puzzle** (navy)
- **💡 Strategy** (gold)
- **🧠 Trivia** (red)
- **🐛 Bug Report** (gray)
- **💬 Meta / Suggestion** (blue)
- **🗺️ Geography Fact** (green)
- **📣 Announcement** (purple — restricted to mods)

---

## 📌 4. WELCOME POST (PIN THIS FIRST — copy entire block)

### Title
```
Welcome to r/statedoku 👋 — the daily 3×3 US geography puzzle community
```

### Flair
`📣 Announcement`

### Body
```
Hey everyone,

I'm Sacha, the dev behind Statedoku — a daily 3×3 puzzle where you fill nine US 
states matching two constraints per cell (e.g. "borders Canada" × "no income tax"). 
Free, no signup, multilingual.

I made this subreddit to:

1. **Share daily strategies** — I'll pin a daily discussion thread every day at 
00:00 UTC so we can compare times, lucky guesses, and missed states.

2. **Hear what's broken** — if a constraint feels unfair, a state should match 
a clue but doesn't, or you found a bug, drop it here. I'm the only dev so I 
fix things fast.

3. **Geography nerds welcome** — random US state facts, map shares, "did you 
know" trivia all fit here. The sub is geography-friendly, not just puzzle-focused.

**Quick start:**
- 🇺🇸 Today's puzzle: https://statedoku.com
- 📖 How it works (60 seconds): https://statedoku.com/how-to-play/
- 📅 Past puzzles archive: https://statedoku.com/archive/
- ❓ FAQ: https://statedoku.com/faq/

**Rules in 6 words**: be kind, spoiler-tag answers, post in EN/FR/ES.

**Daily thread** will be pinned every morning. Strategy posts, meta-discussion, 
state trivia, anything geo-curious — go for it.

Cheers,
Sacha 🇺🇸
```

→ **PIN this post** (Mod Tools → Pin)

---

## 📅 5. DAILY DISCUSSION THREAD (template — pin a new one each day)

### Title
```
Daily discussion thread — Puzzle #[N] · [Monday, June 1 2026]
```

### Flair
`🎯 Daily Puzzle`

### Body
```
Today's puzzle: https://statedoku.com (no spoilers in title, please)

**This thread is for**:
- Sharing your time + mistakes
- Comparing strategies
- Hints (use spoiler tags for state names: `>!Texas!<`)
- Feedback on today's clues

**Quick reminder**: solution doesn't have to match a single canonical answer. 
Any state that satisfies both clues for a cell is accepted (since the May 25 
fix). If you found a state that should fit but got rejected — drop it as 
a comment, I'll check.

Have fun 🇺🇸
```

→ Pin this each morning. Unpin the previous day's. Reddit allows 2 pins max.

**Pro tip** : automatise via Reddit's "AutoModerator" config so the thread posts itself daily at 00:00 UTC. See section 8 below.

---

## 🌱 6. SEED POSTS (post these in the first week to make the sub feel alive)

**Post these YOURSELF, spaced out over 5 days.** Don't dump all 7 on day 1.

### Day 1 — Welcome post + Daily thread

(already covered above)

### Day 2 — Strategy share

**Title**:
```
Strategy: how I solve in under 90 seconds — start with the rarest constraint
```

**Flair**: `💡 Strategy`

**Body**:
```
After playing every puzzle since launch, here's the heuristic that drops my 
time from ~3min to ~90s:

**Look at all 6 clues. Find the rarest constraint.** Usually it's something 
like "has a volcano" (4 states), "four corners" (4 states), or "borders 
Mexico" (4 states). 

Find the row OR column with the rarest constraint. Now you've narrowed 3 of 
your 9 cells to a pool of just 4-5 states. The cells in that row/column 
become forced — only one of those 4-5 will satisfy the OTHER constraint too.

After that row/column is filled, the rest cascades.

Anyone else have a faster method? Curious to hear yours.

— Sacha (the dev)
```

### Day 3 — Geography fact

**Title**:
```
TIL: only 17 of 50 state capitals are the largest city in their state
```

**Flair**: `🗺️ Geography Fact`

**Body**:
```
Was building a clue around "capital is the largest city" and the data 
surprised me:

- New York → Albany (NYC is bigger)
- California → Sacramento (LA + SF are bigger)
- Texas → Austin (Houston + Dallas + San Antonio are bigger)
- Illinois → Springfield (Chicago is massive)
- Florida → Tallahassee (Miami, Orlando, Tampa all bigger)

The ones where capital = largest city: Atlanta, Boston, Denver, Honolulu, 
Indianapolis, Little Rock, OKC, Phoenix, Providence, Salt Lake City...

It's actually a pretty good Statedoku constraint because it eliminates the 
"obvious" guesses for NY/CA/TX.

Full list: https://statedoku.com/learn/states-without-capital-largest/
```

### Day 4 — Open question / meta

**Title**:
```
What constraints would you add? — I'm building the next batch
```

**Flair**: `💬 Meta / Suggestion`

**Body**:
```
The puzzle pool has 100+ constraints right now (regions, borders, history, 
economy, name origin, geography, sports, etc.) but I'm always looking to add 
more.

Some that I'm considering for the next batch:
- "Has a national park named after it" (Yosemite, Olympic, etc.)
- "State with a city named Springfield" (~30 of them, lol)
- "Where Friends was set" (just NY, would only work paired)
- "Borders the Mississippi River"
- "Hosts a Formula 1 race" (FL, TX, NV)

What constraints would YOU want to see? Bonus points if you can name 5+ 
states that match it.

(I read every comment — if a suggestion lands well, it'll be in the puzzle 
pool within 2 weeks.)

— Sacha
```

### Day 5 — Bug report invitation

**Title**:
```
Found a state that should fit a clue but the puzzle rejected it? Read this.
```

**Flair**: `🐛 Bug Report`

**Body**:
```
On May 25 I shipped a fix for the unfair validation logic — the puzzle now 
accepts ANY state that satisfies both clues for a cell, not just the 
"canonical" answer. Big improvement, but possibly a regression risk somewhere.

If you played a puzzle and felt "this state should work but it said wrong" 
since May 25, please report it here.

**Bug report template**:
- Puzzle date:
- Row clue × column clue:
- State you tried:
- Why you think it should fit:
- Browser + device:

I'll triage every report and fix data issues within 24h.

(Pre-launch is the right time to find these — much harder once the player 
base grows.)
```

### Day 6 — Skip (let the sub breathe)

### Day 7 — Recap / community moment

**Title**:
```
End of week 1 — what we've shared so far + 3 thank-yous
```

**Flair**: `📣 Announcement` (lock comments to keep it as a digest)

**Body**:
```
Quick recap of the first week of r/statedoku:

- 🎯 [number] daily threads
- 💡 strategy: "rarest constraint first" (link)
- 🗺️ 17/50 capital trap (link)
- 💬 [N] constraint suggestions, [M] are getting built

Thanks to:
- @u/[username1] for the [thing] suggestion
- @u/[username2] for catching the [bug]
- Everyone who upvoted the welcome post

Tomorrow: daily thread at midnight UTC as usual. Have a good Sunday.

— Sacha
```

---

## 🚀 7. LAUNCH SEQUENCE — WHEN TO POST WHAT, WHERE

### T-0 (today, sub created)
- ✅ Set description, rules, flairs, icon, banner
- ✅ Post welcome post → pin it
- ✅ Make YOUR account the mod (you already are)
- 🚫 **DO NOT** advertise yet to other subs. Reddit auto-flags new subs that 
  promote themselves in the first 7 days.

### T+1 to T+7 (this week)
- Post 1 seed post per day (template above)
- Reply to ANY comment within 2h (community signals to Reddit)
- Add yourself as a contributor/member 5+ times manually (post + upvote = 
  Reddit considers the sub "active")

### T+7 to T+14 (semaine 2)
- Cross-promote CAREFULLY:
  - r/Wordle — comment on a "wordle alternatives" thread, mention r/statedoku
  - r/dailygames — post "New community: r/statedoku" with link
  - r/InternetIsBeautiful — post Statedoku itself (NOT the sub)
- Mention r/statedoku in your bio on Twitter, GitHub, etc.

### T+14 (semaine 3+)
- Coordinate with the bot:
  - The Twitter bot can include "join r/statedoku" in 1 of every 5 tweets
  - Add "Discuss daily puzzles at r/statedoku" to the email reminder

### T+30 (1 mois)
- Reach out to mods of r/geography to ask if they'll allow ONE crosspost
- Submit r/statedoku to https://www.reddit.com/r/findareddit/ as a 
  "small but active community"

---

## 🤖 8. AUTOMOD — auto-post the daily thread

Reddit's AutoModerator can post threads on a schedule. Settings → Mod Tools → 
AutoModerator → Edit the wiki.

Add this YAML block:

```yaml
---
type: submission
title (regex): "^Daily discussion thread"
action: sticky
sticky: 2  # second pin slot, welcome post stays in slot 1
```

For the **scheduled creation** itself, Reddit's native scheduling is at:
Subreddit → Mod Tools → Scheduled Posts → Create

Schedule one at:
- **Time**: 00:00 UTC daily
- **Title**: `Daily discussion thread — Puzzle #{{N}} · {{date}}`
- **Body**: (paste the daily thread template above)
- **Recurring**: yes, every day

Reddit will auto-post + auto-sticky.

---

## 📈 9. METRICS TO TRACK

| Métrique | T+7 cible | T+30 cible | T+90 cible |
|---|---|---|---|
| Subscribers | 30 | 200 | 1500 |
| Daily thread comments | 2 | 10 | 40 |
| Posts/week | 5 (you) | 8 (you + 3 community) | 20 (mostly community) |
| Active users (24h) | 5 | 25 | 100 |

Reddit subs grow SLOW. The trick is consistency, not virality.

---

## 🛡️ 10. DO / DON'T pour les premiers mois

### ✅ DO
- Réponds à TOUS les commentaires dans les 2h les 30 premiers jours
- Pin un Daily Thread chaque jour, même si peu d'engagement
- Quand un user propose une constraint qui rentre dans le jeu, REMERCIE-LE 
  publiquement et tague-le quand elle est live
- Tape "Sacha · dev/founder" dans ton user flair → ça rassure
- Croisette les bons posts vers Twitter/HN/PH (avec la permission de l'auteur)

### ❌ DON'T
- Spam pas r/Wordle ou r/geography la 1ère semaine — tu te fais shadowbanner
- Pose pas de pub directe ("come check out my subreddit!") — Reddit déteste
- Supprime pas les critiques (sauf insultes) — la transparence builds trust
- Achète pas d'upvotes ou de members — Reddit détecte et ban
- Cherche pas la viralité — t'as déjà HN/PH/Product Hunt pour ça

---

## 🎯 TL;DR — fais ça maintenant

1. **5 min** — set description, rules, flairs, icon, banner (templates above)
2. **2 min** — copy-paste le Welcome post, pin it
3. **2 min** — schedule le Daily thread (recurring 00:00 UTC)
4. **10 min** — prep mentalement les 5 seed posts (Day 2-5-7 templates)

→ Tu reviens demain (Day 2) et tu postes le 1er seed post (strategy).

C'est tout. **Ne dis à PERSONNE que le sub existe avant 7 jours.** Laisse Reddit l'indexer et le découvrir naturellement. Le 1er juin tu pourras le mentionner dans les launch threads HN/PH.

Bonne nuit 🌙
