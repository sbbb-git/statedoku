# Statedoku — pack backlinks (5 plateformes, ~30 min total)

Ordre recommandé : itch.io d'abord (impact garanti, 5 min), puis Reddit (le plus viral si ça marche), puis les 3 education (les plus longs à indexer mais autorité massive).

Files déjà prêts dans le repo :
- `tmp/statedoku-itch.zip` (bundle HTML5, 33 KB)
- `tmp/itch-bundle/cover.png` (cover 630×500)
- `tmp/itch-submission.md` (backup si tu perds ce doc)

---

## 1. itch.io (5 min · DA 88 · action MAINTENANT)

**Étape 1 — Compte**
Va sur https://itch.io/register
- Username : `statedoku` (si dispo) ou `sbbb-statedoku`
- Email : `contact@statedoku.com`
- Cocher "I am at least 18 years old"
- Confirme l'email dans ta boîte

**Étape 2 — Nouveau projet**
Une fois connecté, va sur https://itch.io/game/new

Remplis dans cet ordre :

| Champ | Valeur à coller |
|---|---|
| Title | `Statedoku` |
| Project URL | (auto, laisse tel quel) |
| Short description or tagline | `A daily 3x3 grid puzzle where Sudoku meets US geography. Free, no signup.` |
| Classification | `Games` |
| Kind of project | `HTML` (à droite) |
| Release status | `Released` |
| Pricing | Sélectionne `$0 or donate` → dans Suggested donation : laisse vide ou mets `$3` |

**Étape 3 — Uploads (dans la section "Uploads")**
- Clique "Upload files"
- Sélectionne `tmp/statedoku-itch.zip`
- Une fois uploadé, coche **"This file will be played in the browser"**
- Viewport dimensions : `800` × `700` px
- Coche "Enable Fullscreen button"
- Décoche "Enable scrollbars"
- Coche "Mobile friendly" → Orientation : `any`

**Étape 4 — Description (bloc long, markdown accepté)**

Copie-colle exactement ceci :

```markdown
**Statedoku** is a daily puzzle game where Sudoku meets US geography.

You fill a 3×3 grid with US states that satisfy row + column constraints like "Pacific Coast × Borders Mexico = California". Three mistakes allowed. A fresh puzzle drops every day at midnight ET.

### Features

- 🇺🇸 All 50 states + DC in play
- 🆓 Free, no signup, no ads
- 🌍 English, French, Spanish
- 📚 21 mini-games in the archive (capitals, flags, silhouettes, abbreviations, electoral votes…)
- 🖨 Printable classroom worksheets with answer keys
- 📱 Touch-friendly, works on phones

### Full version

The full site with daily puzzle archive, leaderboard and 300+ geography articles lives at [statedoku.com](https://statedoku.com). This itch page samples the core game in your browser.

### Credits

Built solo by Sacha Bitoun. Geographic data from US Census, USGS, USPS. Feedback welcome at contact@statedoku.com.
```

**Étape 5 — Cover image**
Dans la section "Cover image (required)":
- Clique "Upload image"
- Sélectionne `tmp/itch-bundle/cover.png`

**Étape 6 — Genre + tags**
- Genre : `Puzzle`
- Tags (max 10, tape et sélectionne un par un dans le picker) :
  `puzzle`, `educational`, `geography`, `daily`, `trivia`, `casual`, `sudoku`, `browser`, `2d`, `singleplayer`

**Étape 7 — Metadata (optionnel mais boost discovery)**
- Has multiplayer features : `No — Singleplayer`
- Average session length : `A few minutes`
- Inputs : coche `Mouse`, `Touchscreen`, `Keyboard`
- Accessibility : coche `Color-blind friendly`, `Configurable difficulty`
- Languages : `English`, `French`, `Spanish`

**Étape 8 — Visibility**
- **Visibility & access**: laisse sur `Draft` d'abord
- Clique **"Save"** (pas Publish)
- Ouvre l'URL du draft dans un onglet incognito
- Joue 30 secondes → vérifie que l'iframe charge bien
- Si OK : reviens sur la page d'admin → change Visibility en `Public` → Save

**Étape 9 — Post-publication**
- Copie l'URL finale (format `https://<toi>.itch.io/statedoku`)
- Ajoute-la dans `/press/` sur statedoku.com dans la section "Where to play"

---

## 2. r/SideProject (10 min · Reddit best-fit · lundi soir US)

Avant tout : **r/geography a une règle explicite anti-self-promo pour les comptes < 30 jours ou avec < 100 karma.** Post d'abord sur r/SideProject (accueille les builders sans karma), r/webdev et r/IndieDev. Puis tu tenteras r/geography quand tu auras un peu d'historique.

**Étape 1 — Compte Reddit**
Si tu n'en as pas : reddit.com/register. Utilise un pseudo neutre style `sacha_b` ou ton vrai pseudo, PAS `statedoku_official`.

**Étape 2 — Ouvre https://reddit.com/r/SideProject/submit**

| Champ | Valeur |
|---|---|
| Post type | Post |
| Title | `I built Statedoku: a daily 3x3 puzzle where Sudoku meets US geography` |
| Flair | `Just Launched` ou `Feedback Request` |
| Community rules | Coche "I agree" |

**Étape 3 — Body (texte du post)**

```
Hey r/sideproject,

Been working on this for 6 weeks and it's now live at https://statedoku.com

The premise: you fill a 3×3 grid with US states that satisfy row + column constraints, e.g. "Pacific Coast" × "Borders Mexico" = California. Three mistakes allowed. One fresh puzzle a day.

Built with:
- Vanilla JS, no framework
- Cloudflare Pages for hosting
- Cloudflare D1 for the subscriber list
- Claude for the daily Twitter bot

Stack cost: about $5/month all-in.

Some numbers 6 weeks in:
- 2,047 pages indexed
- ~4k impressions/day on search
- Getting picked up by dev podcast aggregators (shoptalkshow.com etc)
- Bing traffic > Google traffic (new-domain sandbox)

Would love feedback on:
1. The onboarding — do you get what to do without reading rules?
2. Difficulty curve — first constraint often trips people
3. Anything obvious I'm missing on mobile

Try it: https://statedoku.com

Thanks for looking.
```

**Étape 4 — Publier**
- Clique `Post`
- Épingle l'URL pour suivre les commentaires
- Réponds à CHAQUE commentaire dans les 24h (critical pour la traction)

**Étape 5 — Follow-up 3 jours après**
- Poste la même chose adaptée sur `r/webdev` (angle technique)
- Puis `r/IndieDev` (angle indie)
- Espace de 3-5 jours entre chaque sub

---

## 3. Common Sense Education (15 min · DA 90 · long shot mais massif si review)

**Note**: Common Sense n'accepte pas les submissions directes de développeurs. Il faut passer par leur système "Nominate a tool for review".

**Étape 1** — Va sur https://www.commonsense.org/education/tools

**Étape 2 — Cherche "Nominate a tool"** dans le footer, ou va direct sur https://www.commonsense.org/education/contact-us

**Étape 3 — Formulaire de contact**

| Champ | Valeur |
|---|---|
| Your name | `Sacha Bitoun` |
| Your email | `contact@statedoku.com` |
| Your role | `Developer / EdTech creator` |
| Subject | `Nominate Statedoku for review — free US geography daily puzzle` |
| Message | (bloc ci-dessous) |

Message :
```
Hi Common Sense Education team,

I'd like to nominate Statedoku for review by your editors.

Statedoku is a free daily puzzle game that teaches US geography through a Sudoku-inspired 3×3 grid. Players fill the grid with US states satisfying row and column constraints like "Pacific Coast × Borders Mexico = California". Three mistakes allowed, fresh puzzle every day.

Why it fits Common Sense Education:
- 100% free, no signup, no ads, no personal data collection
- 300+ supporting learn articles on US geography (states, capitals, regions, electoral college, symbols…)
- 21 classroom-ready mini-games
- Printable worksheets with answer keys for every game (PDF-ready via @media print)
- English, French, Spanish
- COPPA/GDPR-friendly privacy policy
- No login, no accounts, no tracking beyond aggregated Cloudflare Web Analytics

Try it: https://statedoku.com
Printable worksheets: https://statedoku.com/play/place-the-state/printable/
Press kit: https://statedoku.com/press/

I'd be happy to answer any questions or provide additional materials.

Thanks for considering,
Sacha Bitoun
Developer, Statedoku
```

**Étape 4** — Envoie. Review peut prendre 4-8 semaines. Ils publient les reviews sur commonsense.org/education/website qui a DA 90.

---

## 4. Share My Lesson (10 min · AFT · DA 80 · teachers)

**Étape 1** — Compte gratuit sur https://sharemylesson.com/user/register
- Role : `Other education professional`
- Grade levels: coche `3-5`, `6-8`, `9-12`
- Subject areas: coche `Social Studies`, `Geography`

**Étape 2 — Confirme l'email**

**Étape 3 — Upload une resource** : https://sharemylesson.com/add/lesson-plan

| Champ | Valeur |
|---|---|
| Title | `US States Geography — Interactive Daily Puzzle + Printable Worksheets` |
| Grade | `3-5`, `6-8`, `9-12` (coche les 3) |
| Subject | `Social Studies` → `Geography` |
| Resource type | `Activity` |
| Duration | `15 minutes` |
| Standards alignment | Cherche et coche : `Common Core: Grade 3-5 Geography`, `NCSS: People, Places, Environments` |

**Description** (paste) :

```
Statedoku is a free daily puzzle game that reinforces US state geography.

Students fill a 3×3 grid with US states that satisfy row and column constraints — for example, "Pacific Coast × Borders Mexico" = California. The puzzle mechanics require deeper thinking than a straight capital-city quiz: students must combine two attributes (region, borders, population, admission year, etc.).

Includes:
- 1 fresh interactive puzzle per day at statedoku.com
- 21 supporting mini-games (state capitals, flags, silhouettes, abbreviations…)
- Free printable PDF worksheets for every game, with answer keys
- English, French, Spanish
- Works on Chromebooks, iPads, phones
- No login, no ads

Best used as: bell-ringer, sub plan filler, class warm-up, homework.

Free, no signup: https://statedoku.com
Printable worksheets index: https://statedoku.com/widgets/
```

**Étape 4 — Attachments**
- Upload 2-3 printable PDFs : va sur statedoku.com/play/place-the-state/printable/ , clique "Print" , save as PDF, upload
- Fais pareil pour /play/state-capitals-typing/printable/ et /play/state-flags/printable/

**Étape 5 — Publish**

---

## 5. PBS LearningMedia (20 min · DA 92 · le plus long shot mais si accepté = énorme)

**Étape 1** — Va sur https://www.pbslearningmedia.org/help/contribute/

**Étape 2** — Cherche le formulaire "Content Partner Inquiry" (ou email direct partners@pbslearningmedia.org)

**Étape 3 — Email content**

Objet : `Statedoku — free US geography daily puzzle, partnership inquiry`

```
Dear PBS LearningMedia partnerships team,

I'm reaching out about the possibility of listing Statedoku, a free educational puzzle game for US geography, as a partner resource on PBS LearningMedia.

About Statedoku:
- Daily 3×3 grid puzzle mixing Sudoku logic with US states
- Fresh puzzle every day, plus 21 mini-games for targeted practice
- 300+ learn articles covering state capitals, regions, symbols, US history
- Printable classroom worksheets with answer keys for every game
- Free, no signup, no ads, no data collection
- English, French, Spanish

Alignment with PBS educational standards:
- Grade 3-12 Social Studies
- NCSS themes: People/Places/Environments, Civic Ideals & Practices
- Common Core: Reading Informational Text, Speaking & Listening

Technical:
- Runs in any modern browser (Chromebook, iPad, phone)
- No installation, no login
- Accessible: keyboard navigation, color-blind palette, configurable difficulty
- WCAG AA compliant

Try it: https://statedoku.com
Sample printable: https://statedoku.com/play/place-the-state/printable/
Press kit + logos: https://statedoku.com/press/

I'd love to explore how Statedoku could serve PBS teachers and students. Available for a call at your convenience.

Best,
Sacha Bitoun
Founder, Statedoku
contact@statedoku.com
```

**Étape 4** — Envoie. Réponse typique en 2-4 semaines. La barrière est haute mais un simple "listed as recommended resource" fait 5+ positions Google d'un coup.

---

## Trackeur

Après chaque submission, ajoute une ligne dans un doc perso :

| Plateforme | Date submit | Status | Live URL | Backlink live? |
|---|---|---|---|---|
| itch.io | 2026-07-13 | Draft/Live | ... | ✓ |
| r/SideProject | | | | |
| Common Sense | | | | |
| Share My Lesson | | | | |
| PBS Learning | | | | |

Une fois live sur itch.io, tag @itchio sur Twitter en linkant le tweet vers le repo GitHub pour signal boost.

---

## Ordre de priorité si tu as 10 min ce soir

1. **itch.io draft + save** (7 min) — instant backlink DA 88, le plus haut ROI
2. Demain matin : **r/SideProject post** (10 min de rédaction + réponses aux commentaires pendant la journée)
3. Ce week-end : **Common Sense + Share My Lesson** (30 min combinés)
4. Semaine prochaine : **PBS** quand tu as l'énergie de rédiger un email plus long

Un backlink sur 5 qui prend = ~5-15 positions Google gagnées sur toutes tes pages en 4-8 semaines.
