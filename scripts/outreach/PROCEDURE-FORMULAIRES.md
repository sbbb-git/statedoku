# Procédure agentique : trouver, inspecter et remplir des formulaires de soumission en ligne

Procédure suivie pour Statedoku le 28 octobre 2026, réutilisable sur un autre
projet (jeu, outil, site éducatif). Elle est écrite pour un agent (Claude Code
ou équivalent) qui dispose d'un navigateur headless (Playwright), d'un accès web
et, en option, d'un connecteur Gmail pour préparer des brouillons.

Le but : être listé sur les sites qui recensent ce type de projet (annuaires de
jeux quotidiens, listes de ressources pour enseignants, blogs qui invitent les
suggestions), un site à la fois, avec un message juste et personnalisé.

---

## 1. Garde-fous (à lire avant tout)

Ces règles ne se négocient pas, même si le propriétaire dit « pas de limite ».

1. **Pertinence avant volume.** Uniquement des sites dont la page liste déjà des
   projets du même genre et qui invitent les suggestions. Un même message envoyé
   à des dizaines de formulaires de contact pris au hasard, c'est du spam : le
   domaine finit marqué indésirable et cela ne rapporte aucun lien.
2. **Une soumission par site.** Si un formulaire est utilisé, supprimer le
   brouillon d'e-mail prévu pour le même site.
3. **Jamais de captcha contourné.** reCAPTCHA, hCaptcha, Cloudflare Turnstile
   (« Verify you are human ») : on s'arrête et on laisse le formulaire à un
   humain.
4. **Jamais d'option payante.** Beaucoup d'annuaires proposent une « priorité »
   ou une mise en avant payante après l'envoi : on l'ignore, file gratuite seulement.
5. **Pas de création de compte** sans accord explicite du propriétaire (cela
   implique un mot de passe et une boîte mail à vérifier).
6. **Identité du projet, jamais de la personne.** Nom = nom du projet, e-mail =
   adresse de contact du projet. Jamais le nom réel du propriétaire, jamais son
   téléphone, jamais son adresse personnelle. Un champ téléphone obligatoire =
   formulaire sauté.
7. **Honnêteté.** Répondre vrai à toutes les questions. Si le site refuse les
   contenus produits par IA générative et que le projet a été fait avec une IA,
   le dire dans le champ commentaire (ou ne pas soumettre).
8. **Champs pièges (honeypot).** Un champ caché ou hors écran nommé `website`,
   `url2`, `company`... ne doit jamais être rempli.
9. **Cases newsletter / partenaires** : laissées décochées.
10. **Rien de personnel dans un dépôt public.** Les adresses des destinataires
    restent dans la boîte mail ou un fichier local ignoré par git.

---

## 2. Préparer la fiche projet (une fois)

À rédiger avant de toucher un formulaire, dans les langues visées :

| Élément | Exemple Statedoku |
|---|---|
| Nom | Statedoku |
| URL principale | https://statedoku.com/ (jeu quotidien) |
| URL secondaire | https://statedoku.com/play/ (21 jeux), /fr/play/, /es/play/ |
| Adresse de contact du projet | contact@statedoku.com |
| Nom à afficher | « Statedoku » (jamais un nom de personne) |
| Catégorie | Geography (sinon Logic / Education) |
| Relation | « I'm the maker » / « I created it » |
| Une ligne (< 140 car.) | A daily 3x3 logic grid on the US states: each square needs a state that fits two clues. |
| Description (≈ 70 mots) | voir ci-dessous |
| Réponses factuelles | gratuit, sans compte, sans pub, dans le navigateur, une grille par jour, archives disponibles, langues EN/FR/ES |
| Mention IA | « Built alone with the help of an AI coding assistant, which also helped draft the clue texts; every fact was checked by hand. » |

Description type (EN) :

> Statedoku is a free daily logic puzzle on the 50 US states. Each day brings a
> new 3x3 grid: every square needs a state that fits both its row clue and its
> column clue, like "Borders Canada" and "On the Oregon Trail". Most squares
> accept several states, and the clues that are not obvious come with a short
> explanation. It plays in the browser with no account, in English, French and
> Spanish, with 21 more free geography games at https://statedoku.com/play/.

Vérifier chaque affirmation sur le site en ligne avant de l'écrire (une page
qui n'existe pas ou une fonction annoncée à tort ruine la crédibilité).

---

## 3. Trouver les cibles (agent de recherche)

Lancer un agent de recherche en arrière-plan avec un brief précis. Modèle :

```
Find legitimate places to submit <PROJET>, <description en une phrase>.
Contact: <adresse du projet>. Never use a personal name or phone number.
Wanted: sites whose purpose is to list <type de projet> and that have a FREE
submission form or a published submission email for exactly that purpose.
Audiences: <ex. daily-game aggregators; teachers; geography fans; Spanish-speaking (Mexico)>.
Exclude: paid listings, SEO/link directories, link exchanges, Reddit/forums/social,
sites asking money, sites that refuse pitches, and these already covered: <liste>.
VERIFY each by loading it: live in 2025/2026, submission URL works, free,
account needed (y/n), captcha visible (y/n), not already listing the project.
Do NOT submit anything, do not create accounts, do not write files.
Output: table (name, submission URL, kind, account, captcha, language, fit, confidence)
plus rejected candidates with reasons.
```

Plusieurs agents en parallèle, un par audience, chacun avec la liste des sites
déjà couverts pour éviter les doublons.

---

## 4. Inspecter chaque formulaire

`inspect-forms.cjs` (même dossier) ouvre chaque page, liste les champs visibles
(type, nom, libellé, obligatoire), les options des listes déroulantes, les
boutons, et signale un captcha. Il enregistre une capture `in-<tag>.png`.

```bash
node inspect-forms.cjs "dles|https://tally.so/r/xxxx" "alldle|https://alldle.net/submit"
```

À lire dans la sortie :
- `captcha: true` : on s'arrête là pour ce site ;
- un champ téléphone obligatoire, un compte obligatoire : site sauté ;
- un champ `website` hors de la section visible : probablement un piège, à laisser vide ;
- les libellés exacts, pour cibler les champs par `name`, `id`, `placeholder` ou libellé.

Attention : certains captchas n'apparaissent qu'après le remplissage
(Cloudflare Turnstile sur DLES.gg). Il faut donc revérifier juste avant l'envoi.

---

## 5. Remplir à blanc, regarder, puis envoyer

`fill-forms.example.cjs` (même dossier) donne le gabarit : une fonction
`run(tag, url, remplir, boutonEnvoi)` par site.

1. **Remplissage à blanc** (`node fill-forms.cjs`) : remplit, attend, enregistre
   `filled-<tag>.png`, n'envoie rien.
2. **Regarder chaque capture** : bon champ dans la bonne case, bonne catégorie,
   bouton radio « je suis le créateur », aucune case newsletter cochée, aucun
   champ en double (sur Alldle le nom s'est retrouvé écrit deux fois :
   « StatedokuStatedoku »).
3. **Envoi** (`node fill-forms.cjs --submit --only=tag1,tag2`) : le script
   revérifie l'absence de captcha, clique, attend, enregistre `sent-<tag>.png`.
4. **Confirmer à l'œil sur `sent-<tag>.png`**, pas sur une expression régulière :
   une page qui contient « review » ou « thanks » dans son texte normal donne un
   faux positif. Chercher le vrai message (« Thanks, got it! », « Your submission
   is saved », URL `/thank-you`).

Cas rencontrés et parades :
- **Bannière cookies qui intercepte le clic** : chercher le bouton de refus
  (« Rechazar », « Reject all », « Continuer sans accepter »). Si le site impose
  d'accepter le pistage publicitaire ou de payer (mur cookies), passer par
  l'adresse e-mail presse publiée sur la même page plutôt que le formulaire.
- **Liste déroulante désactivée** (champ optionnel replié) : `selectOption(...,
  { timeout: 2500 }).catch(...)`, on la laisse vide plutôt que de bloquer.
- **Upsell payant après envoi** (dailydle : 39 $ ou 129 $) : ignorer, la
  soumission gratuite est déjà enregistrée.
- **Formulaire de contact sans formulaire visible** (chargé dans une iframe ou
  par un module tiers) : sauter, ou e-mail si une adresse est publiée pour ça.

---

## 6. E-mails : brouillons, pas d'envois automatiques

Pour les sites qui publient une adresse (rédaction, presse, « suggest a
resource ») :

- créer un **brouillon** par site dans Gmail (connecteur `create_draft`), en
  plain text, personnalisé : la page précise du site, ce qui manque sur cette
  page, pourquoi le projet y a sa place, le lien adapté à la langue ;
- signature = nom du projet + adresse de contact du projet ;
- vérifier **quel compte Gmail** est connecté (la réponse de l'outil le donne
  dans `viewUrl`, `authuser=...`) : envoyé tel quel, le message part de ce
  compte, avec le nom qui lui est associé. Mieux : ajouter l'adresse du projet
  comme alias d'envoi (« Envoyer des e-mails en tant que », SMTP du fournisseur
  d'envoi du domaine) et choisir cet expéditeur avant d'envoyer ;
- le propriétaire relit et envoie lui-même, étalé sur quelques jours.

Langues : écrire dans la langue du site (FR, EN, ES) et donner le lien vers la
version du projet dans cette langue.

---

## 7. Tenir un journal

Une ligne par site, dans un fichier local hors du dépôt public :

| Date | Site | Voie (formulaire / e-mail) | Statut | Note |
|---|---|---|---|---|
| 2026-10-28 | Playlin | formulaire | envoyé, confirmé (/thank-you) | file lente jusqu'en décembre |
| 2026-10-28 | DLES.gg | formulaire | non envoyé : captcha | à faire à la main |

Statuts : envoyé et confirmé, brouillon prêt, sauté (captcha / compte /
téléphone / payant / mur cookies), déjà listé.

Relance : jamais avant trois semaines, une seule fois.

---

## 8. Checklist avant chaque envoi

- [ ] Le site liste déjà des projets du même genre et invite les suggestions
- [ ] Pas déjà listé, pas déjà contacté par une autre voie
- [ ] Pas de captcha, pas de compte, pas de téléphone, pas de paiement
- [ ] Nom = projet, e-mail = adresse du projet, aucune donnée personnelle
- [ ] Champs pièges vides, newsletters décochées
- [ ] Capture `filled-` relue
- [ ] Réponses honnêtes (IA, créateur, gratuité)
- [ ] Confirmation lue sur la capture `sent-`
- [ ] Journal mis à jour
