# Twitter playbook — Statedoku launch (May 25 → June 1)

> Tous les tweets prêts-à-coller. Le bot fait 90% du boulot automatiquement. Toi tu copies-colles ces drafts à des moments clés et tu réponds aux interactions.

---

## 🤖 Ce que le bot fait tout seul (rien à toucher)

Le bot poste automatiquement **2 tweets/jour** du 25 mai au 31 mai :
- **9h ET** (15h Paris) — morning slot
- **19h ET** (1h Paris) — evening slot

Le ton escalade tout seul :
- 25–28 mai : mystérieux (`PRELAUNCH_FAR` styles)
- 29 mai : "presque là" (`PRELAUNCH_NEAR`)
- 30–31 mai : countdown avec date explicite + lien `/launch/`

**À faire avant le 25 mai** :
```bash
cd /Users/sacha/Desktop/Statoku/bot
wrangler deploy
```

Puis vérifier qu'il a posté correctement après le premier cron (15h Paris le 25 mai).

---

## ✋ Ce que TOI tu fais (manuel)

### 📅 Lundi 25 mai — D-7

**16h Paris** (= 10h ET, après le bot du matin) — quick action :
- Follow les 30 comptes de `strategic-accounts.md`
- Like 5 tweets de chacun (sincèrement, sur leurs derniers posts)

**Tweet manuel à poster vers 20h Paris** :
```
Quietly building something for people who genuinely love US geography. 🇺🇸

If you can name 5 states by their two-letter abbreviation alone, you're going to want to be here in a week.
```

---

### 📅 Mardi 26 mai — D-6 · Format viral

**Tweet manuel à 18h Paris** :
```
Statedoku 🗺️ 26/05
🟩🟩🟩
🟩🟥🟩
🟩🟩🟩

8/9. One mistake. 🇺🇸
```

(Pas de lien. Juste l'emoji grid. Les gens vont demander "wtf is this" en commentaires.)

**Réponse à toute question dans les commentaires** :
```
June 1. 👀
```

---

### 📅 Mercredi 27 mai — D-5 · Engagement bait

**Tweet manuel à 17h Paris** :
```
Quick test 🇺🇸

Without thinking too hard: name the 4 US states that border Mexico.

Reply with your answer (no Googling).
```

Réponds à chaque tentative avec un emoji 🟢 (correct) ou 🟡 (partial — par exemple si quelqu'un dit "Texas, California, Arizona, et puis euh…").

Cette tactique remplit ton ratio "engagement" sur l'algo Twitter.

---

### 📅 Jeudi 28 mai — D-4 · Hint reveal

**Tweet manuel à 18h Paris** :
```
Here's what we've been cooking 🇺🇸

A daily 3×3 grid where each cell must hold a US state that satisfies its row AND column constraint.

Example:
"Pacific coast" × "Borders Mexico" = California.

Drops Monday June 1.
👉 statedoku.com/launch
```

C'est le **premier reveal explicite**. Le bot va aussi escalader son ton ce jour-là.

---

### 📅 Vendredi 29 mai — D-3 · Social proof

**Tweet manuel à 16h Paris** :
```
The waitlist is live and the early signups are rolling in 🇺🇸

If you've ever rage-quit a Sudoku, ever spent an hour on Google Maps for no reason, or ever yelled at the TV during Jeopardy! geography questions — June 1 is your day.

statedoku.com/launch
```

---

### 📅 Samedi 30 mai — D-2 · Constraint showcase

**Tweet manuel à 17h Paris** :
```
A taste of tomorrow 🇺🇸

100+ rotating constraints. Some examples:
• Pacific coast
• Original 13 colonies
• Borders Mexico  
• On Route 66
• Named after royalty
• Has an NBA team

48 hours. statedoku.com/launch
```

---

### 📅 Dimanche 31 mai — D-1 · Final push

**Tweet manuel à 19h Paris** :
```
24 hours.

Day #1 of @Statedoku drops Monday 9am ET 🇺🇸

Bookmark statedoku.com or get Day #1 in your inbox: statedoku.com/launch
```

---

### 🚀 Lundi 1 juin — D-0 · LAUNCH

**8h ET = 14h Paris** — Avant tout le reste, flip le bot :
```bash
cd /Users/sacha/Desktop/Statoku/bot
# Edit src/worker.js → change PHASE = 'launch'
wrangler deploy
```

**14h30 Paris** — Tweet de launch (ne pas faire de thread, faire un tweet propre et net) :
```
Day #1 of Statedoku is live 🇺🇸

A daily 3×3 puzzle where each cell holds a US state matching row + column constraints.

Free. No signup. New puzzle every day at midnight.

statedoku.com
```

**Dans les 15 minutes qui suivent** :
- Quote-tweet ce tweet depuis ton compte personnel
- DM-le à 5 amis avec une demande de RT
- Like + reply à chaque interaction qui arrive

**Tweet d'engagement** à 16h Paris :
```
Today's grid (no spoilers): 
- Rows: Central time / Mountain time / Pacific time
- Cols: Borders Mexico / Contains W / Swing state

Reply with your time and mistakes once you've solved it 🇺🇸

statedoku.com
```

**Tweet du soir** à 22h Paris (récap de la journée) :
```
Day #1 stats so far:
👥 X players
🟩 Y solved on first try
💌 Z signed up for daily email

Thank you to everyone who jumped in.

Day #2 drops at midnight 🇺🇸
```

(Remplis X/Y/Z avec tes vrais chiffres, même si c'est petit. Honnêteté = trust.)

---

## 🎯 Engagement playbook (5 min/jour, tout au long)

### 1. Reply hunt (les 30 premiers commentaires sont OR)

Sur **tous** tes tweets, réponds à **TOUS** les commentaires/questions dans la **première heure**. L'algo Twitter regarde le ratio reply en 60 min. C'est ce qui distingue un tweet à 200 vues vs 20k vues.

### 2. Quote-RT stratégique

Quand un compte de `strategic-accounts.md` poste un truc bien, **quote-RT** avec une réaction sincère (PAS "this is great"). Genre :

> Quote-RT de @metrodoku qui poste un grid emoji
> "Le format emoji-grid est devenu un genre à part entière depuis Wordle. C'est ouf comme métrique"

Ça te visibilise auprès de leur audience sans être agressif.

### 3. Reply guy game

Sur les comptes de `strategic-accounts.md`, écris **1 reply substantielle** par jour sur un de leurs tweets. Pas spam, pas "great post" — quelque chose qui prolonge l'idée.

### 4. Like-bombing les early supporters

Quand quelqu'un te suit, like ses 2 derniers tweets. C'est gratuit, ça crée de la reciprocité.

### 5. NE PAS faire

- ❌ Suivre 200 comptes en une journée (= bot signal pour Twitter)
- ❌ Tweet en hashtag-spam (`#Wordle #DailyGame #USA #Trivia #Puzzle #Games`)
- ❌ DMs froids avec pitch direct (= report spam)
- ❌ Acheter des followers (= shadow-ban)
- ❌ Tagger des comptes >1M followers ("@elonmusk look at this")

---

## 📊 KPIs honnêtes à viser

| Jour | Followers cumulés | Email signups cumulés |
|---|---|---|
| Mer 27 mai | 5–15 | 0–5 |
| Sam 30 mai | 20–50 | 5–25 |
| Lun 1 juin (launch) | 30–200 | 10–80 |
| Lun 8 juin (J+7) | 50–500 | 30–300 |

Si tu hit 50 followers J+7 et 30 emails, **c'est un launch réussi** pour un compte parti de zéro.

---

## 🛠️ Outils utiles (gratuits)

- **Twitter Analytics** (`twitter.com/i/analytics`) — voir tes vrais chiffres d'impressions/engagement
- **TweetDeck** (X Pro maintenant) — programme les tweets manuels à l'avance
- **Threadhunter.io** — trouve les tweets viraux dans ta niche pour t'inspirer
- **Followerwonk** — analyse les comptes que tu follows pour comprendre leurs heures d'activité

---

## 💡 Conseil final

Le tweet le plus performant que tu vas faire ne sera **pas planifié**. Ce sera une réaction spontanée à quelque chose (un event, un meme du moment, un fail) que tu twist sur Statedoku.

**Reste alerte, lis Twitter quotidiennement, et quand tu vois une occasion → tweet dans les 30 minutes**.

Exemple type :
> Twitter trends "geography quiz" parce qu'un politicien a confondu Hungary et Hong Kong
> Tu post : "*This is exactly why Statedoku exists. Daily geography drill, 3 mistakes max. statedoku.com 🇺🇸*"

C'est ce genre de timing qui transforme un launch.

Bon launch 🤙
