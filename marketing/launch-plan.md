# Statedoku — Launch plan (May 25 → June 1, 2026)

> **Channels** : Twitter (90% du jus) + Hacker News + Product Hunt le jour J.
> **Reddit** : skipped — trop de risque ban pour un compte neuf, ROI faible.

---

## 🎯 Les deux pages

- **`/launch/`** — coming-soon page avec email signup. Bot tweete + tweets manuels linkent là pendant la semaine.
- **`/`** — full game (live + en mode preview locké jusqu'au 1er juin). Switch auto vers la génération quotidienne le 1er juin à minuit UTC.

---

## 📅 Daily orders (résumé)

| Jour | Action principale | Temps |
|---|---|---|
| **Lun 25 mai** D-7 | Follow 30 comptes niche + 1 tweet manuel le soir | 15 min |
| **Mar 26 mai** D-6 | 1 emoji-grid tweet (viral format) + reply aux questions | 10 min |
| **Mer 27 mai** D-5 | 1 engagement-bait tweet ("Name 4 states bordering Mexico") | 10 min |
| **Jeu 28 mai** D-4 | First reveal tweet avec lien `/launch/` | 10 min |
| **Ven 29 mai** D-3 | Social proof tweet | 5 min |
| **Sam 30 mai** D-2 | Constraint showcase tweet | 5 min |
| **Dim 31 mai** D-1 | Final countdown + draft HN + PH submissions | 20 min |
| **Lun 1 juin** D-0 | LAUNCH (HN + PH + Twitter blitz) | 1-2h |

**Détail complet + drafts ready-to-paste** : voir `marketing/twitter-playbook.md`

---

## 🤖 Le bot fait le gros du boulot

Le bot Twitter @Statedoku poste **2x/jour** automatiquement (9h ET + 19h ET) pendant la semaine de prelaunch. Le ton escalade tout seul (mystérieux → countdown).

**Action requise une seule fois avant le 25 mai** :
```bash
cd bot
wrangler deploy
```

**Action requise le 1er juin matin** :
```bash
cd bot
# Edit src/worker.js → PHASE = 'launch'
wrangler deploy
```

---

## ⚙️ Setup checklist (do BEFORE May 25)

- [ ] **Bot Twitter** redéployé avec `LAUNCH_DATE='2026-06-01'` (✅ code prêt)
- [ ] **`/launch/` page** live et formulaire testé (envoie-toi un mail) (✅ code prêt)
- [ ] **Email worker** déployé et envoie à midi NYC chaque jour (✅ done)
- [ ] **30 comptes Twitter niches** identifiés dans `strategic-accounts.md` (✅)
- [ ] **Hacker News compte** créé (juste un account, pas besoin de karma préalable pour Show HN)
- [ ] **Product Hunt compte** créé + page produit en draft (peut être soumis 24h avant)
- [ ] **OG image** vérifiée dans Twitter Card Validator pour `/` et `/launch/`
- [ ] **Search Console** indexed, sitemap submitted

---

## 🚀 Jour J (Lundi 1er juin)

### Timeline ET (heure US Est)

```
07:00 ET  → Wake up. Coffee. Verify site loads.
08:00 ET  → Flip bot to launch (wrangler deploy)
08:30 ET  → Submit Show HN post (titre: "Show HN: Statedoku – daily US states puzzle")
08:30 ET  → Submit to Product Hunt
08:45 ET  → Manual launch tweet (voir twitter-playbook.md)
09:00 ET  → Reply à tous les commentaires HN dans les 15 min (CRITIQUE)
10:00 ET  → Continue à reply, quote-tweet les early supporters
13:00 ET  → Bot tweete son premier "launch" tweet automatiquement
16:00 ET  → Constraint-showcase tweet (engagement bait)
22:00 ET  → Recap tweet (X players, Y solved, Z signups)
```

### Si HN hits front page

- Reply à TOUS les commentaires dans l'heure (HN aime les founders réactifs)
- Tweet une mise à jour : "Hit #X on HN, blown away by the response"
- Garde ton site monitoring (Cloudflare Analytics) ouvert

### Si HN flop

C'est OK. Re-soumets dans 30 jours avec un meilleur titre + un angle "growth update" ("Statedoku - 1000 daily players after 1 month").

---

## 📊 Expectations honnêtes

| Day | Visits | Email signups | Followers cumulés |
|---|---|---|---|
| 25 mai | 0–5 | 0–2 | 0–5 |
| 27 mai | 5–20 | 1–5 | 5–15 |
| 30 mai | 10–50 | 3–15 | 15–40 |
| 31 mai | 20–80 | 5–25 | 25–60 |
| **1 juin LAUNCH** | **100–10000** *si HN hits* | 10–200 | 50–500 |

**Le pire scenario** : 200 visites, 5 signups, 10 followers. **C'est normal et c'est OK.** La majorité des indie launches font ça. Le truc c'est de continuer Day 2, Day 3, Day 30.

---

## 🎯 What NOT to do

- ❌ **Pas de Reddit** (ban risk élevé, ROI faible pour un compte neuf)
- ❌ **Pas de paid ads** (mauvaise targeting pour la niche)
- ❌ **Pas de thread "I built this in 6 weeks"** — lead with product, pas avec le journey indie hacker
- ❌ **Pas de tagging compte >1M followers** (cringe + ignored)
- ❌ **Pas de DMs froids** pour pousser ton site (= spam reports)
- ❌ **Pas de pause de communication** entre J0 et J+7. Continue à poster.

---

## 📚 Fichiers à consulter

| Fichier | Quand |
|---|---|
| `marketing/twitter-playbook.md` | **Tous les jours** — drafts ready-to-paste + engagement tactics |
| `marketing/strategic-accounts.md` | Avant le 25 mai pour follow les comptes |
| `bot/src/worker.js` | Le 1er juin pour flip PHASE='launch' |

Pas de Reddit. Pas de stress. Just Twitter + HN + PH + email. Plan resserré, exécutable.
