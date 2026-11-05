# Pack TikTok Statedoku

Tout ce qu'il faut pour ouvrir et alimenter le compte TikTok @statedoku. Les
vidéos sont en anglais (public américain), comme sur X.

## 1. Le compte

| Champ | Valeur |
|---|---|
| E-mail | `contact@statedoku.com` |
| Nom d'utilisateur | `statedoku` (sinon `statedokugame`, puis `playstatedoku`) |
| Nom affiché | `Statedoku` |
| Photo | `scripts/video/tiktok/profile-photo.png` (1080 x 1080, le S au drapeau, il tient dans le rond) |
| Type | Compte Entreprise, catégorie Éducation (voir plus bas) |
| Lien | `https://statedoku.com/?utm_source=tiktok&utm_medium=social` |

Bio, 80 caractères au plus (au choix) :

1. `Learn the 50 states, one 60-second quiz at a time. Daily US map puzzle:` (71)
2. `Daily US geography quizzes. Capitals, maps, the 50 states. Free puzzle:` (71)
3. `Can you name all 50 states? A new map quiz every day. Play free:` (64)

**Compte Entreprise ou personnel.** Buffer accepte les deux. Le compte
Entreprise donne les statistiques et, selon TikTok, le lien cliquable en bio
sans minimum d'abonnés ; il limite la musique à la bibliothèque commerciale,
ce qui ne change rien ici : les vidéos ont leur propre voix. À vérifier dans
l'appli au moment de l'inscription, les règles du lien en bio varient.

Le site compte les visites arrivées par ce lien comme « social » dans ses
statistiques (`utm_source=tiktok`, depuis le 5 novembre 2026).

## 2. Les vidéos

Utiliser **les versions TikTok**, `media/videos/tiktok/<slug>.mp4`, en ligne à
`https://statedoku.com/media/videos/tiktok/<slug>.mp4`. TikTok recouvre le bas
de l'écran (légende, nom du compte) et le bord droit (boutons) ; dans les
versions d'origine les sous-titres passent dessous. Ici l'image est réduite à
85 % et remontée, les sous-titres restent visibles (script :
`scripts/video/make-tiktok-videos.sh`). Elles conviennent aussi aux YouTube
Shorts.

Légendes : `captions.csv`, une par vidéo (numéro, série, titre, légende, URL de
la vidéo d'origine). Sans lien (un lien dans une légende TikTok n'est pas
cliquable), un renvoi vers la bio, quatre hashtags au plus, en rotation.
Régénérer après un changement de `data/videos.json` :
`python3 scripts/video/make-tiktok-captions.py`.

## 3. Réglages de chaque publication

- **Contenu généré par l'IA : activé.** La voix est synthétique ; TikTok demande
  d'étiqueter le contenu réaliste généré par IA, c'est le choix sûr.
- Commentaires, Duo et Collage : activés (les quiz appellent les réponses en
  commentaire).
- Divulgation de contenu commercial : « Votre marque » si TikTok la demande
  (c'est le site lui-même, pas un partenariat) ; pas de « Contenu de marque ».
- Couverture : l'image de titre du début.

## 4. Rythme

- Une vidéo par jour, dans l'ordre de `captions.csv`, à partir de la n° 1.
- Heure : 23 h 00 UTC (minuit à Paris l'hiver, 18 h à New York), la fin
  d'après-midi du public américain.
- Épingler trois vidéos de séries différentes : n° 1 (Guess the state), n° 2
  (Name the capital), n° 4 (Map challenge).
- Ne pas supprimer puis republier une vidéo qui démarre mal : TikTok lit ça
  comme du contenu en double.

## 5. Publication

Le canal TikTok est connecté au compte Buffer Statedoku (contrôle du bot du
5 novembre 2026 : 1 canal X, 1 canal TikTok). Le bot ne publie pour l'instant
que sur X. Deux façons :

- **À la main dans Buffer** : nouveau post sur le canal TikTok, importer la
  vidéo, coller la légende, programmer. La formule gratuite garde 10 posts en
  file par canal.
- **Par le bot** : il peut publier la vidéo du jour sur TikTok aussi, avec la
  légende de ce fichier, sans rien faire à la main. À brancher dans `bot/`
  puis à redéployer (workflow « Posting bot (Buffer) », mode deploy).

Buffer publie seul les vidéos qui respectent les règles de TikTok ; sinon il
envoie une notification pour finir la publication dans l'appli.

## 6. À vérifier la première semaine

- La première vidéo est bien publiée par Buffer, son et sous-titres lisibles
  sur un téléphone.
- Le lien de la bio ouvre le jeu.
- Dans les statistiques du site, des visites `social` arrivent les jours de
  publication.
