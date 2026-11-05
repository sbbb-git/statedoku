# Pack YouTube Statedoku

La chaîne YouTube @statedoku, pour publier les 100 vidéos en Shorts. Contenu
en anglais (public américain), comme sur X et TikTok.

## 1. La chaîne

Créer la chaîne depuis un compte Google ouvert avec `contact@statedoku.com`
(compte de marque, nom « Statedoku »).

| Champ | Valeur |
|---|---|
| Nom | `Statedoku` |
| Identifiant | `@statedoku` (sinon `@statedokugame`) |
| Photo | `scripts/video/tiktok/profile-photo.png` (1080 x 1080, YouTube la réduit) |
| Bannière | `scripts/video/youtube/banner.png` (2560 x 1440 ; logo, nom et accroche tiennent dans la zone visible sur mobile, 1546 x 423) |
| Lien | `Play the daily puzzle` vers `https://statedoku.com/?utm_source=youtube&utm_medium=social` |
| Pays | France (là où est l'éditeur) |
| Langue des vidéos | Anglais |

Description de la chaîne (à coller telle quelle) :

```
Short US geography quizzes, one a day: guess the state from its shape, name
the capital, find it on the map, spot the odd one out, which state joined the
Union first. Every fact comes from the same checked data as Statedoku, the
free daily US map puzzle at statedoku.com: a 3x3 grid where each square needs
a state that fits both clues.

Good for students, teachers and anyone learning the 50 states. Comment your
score, and play today's puzzle at statedoku.com (no sign-up).
```

Le site compte les visites arrivées par ce lien comme « social »
(`utm_source=youtube`, depuis le 5 novembre 2026).

## 2. Les Shorts

Vidéos : les versions sous `media/videos/tiktok/`, en ligne à
`https://statedoku.com/media/videos/tiktok/<slug>.mp4`. Les Shorts recouvrent
le bas de l'écran et le bord droit comme TikTok ; dans ces versions les
sous-titres restent visibles.

`shorts.csv`, une ligne par vidéo : titre (100 caractères au plus), description,
tags, playlist et URL de la vidéo. Généré par
`python3 scripts/video/make-youtube-shorts.py` à partir des textes vérifiés de
`data/videos.json`. Dans un Short le lien de la description n'est pas
cliquable : la description nomme le site et renvoie à la page de la chaîne,
dont les liens le sont. Les trois premiers hashtags s'affichent au-dessus du
titre.

Playlists à créer (8), une par série, pour que les vidéos s'enchaînent et
remontent dans la recherche : Guess the State by Its Shape, State Capitals
Quiz, US Map Challenges, Odd One Out: US States, Which State Came First?,
Bigger or Smaller? US States, State Abbreviations Quiz, US States Top Lists.

## 3. Réglages par défaut (Studio, Paramètres, Valeurs par défaut des mises en ligne)

- Catégorie : Éducation. Langue : anglais. Licence YouTube standard.
- Commentaires : autorisés (les quiz demandent le score en commentaire), avec
  le filtrage des commentaires inappropriés.
- **Public : « conçu pour les enfants » ou non.** C'est une déclaration légale
  (règles COPPA), à faire en connaissance de cause. YouTube demande « oui »
  quand les enfants de moins de 13 ans sont le public principal, ou quand le
  contenu est fait pour eux (personnages, thèmes, ton). Ces quiz visent un
  public général, élèves et adultes compris : la réponse attendue est « non ».
  « Oui » couperait les commentaires, les notifications et la mise en avant.
- **Contenu modifié ou synthétique** : YouTube ne demande de le signaler que
  pour un contenu réaliste qui pourrait tromper (une vraie personne, un vrai
  lieu ou un événement inventés). Des diapositives animées et une voix de
  synthèse générique qui n'imite personne n'en font pas partie.

## 4. Rythme

- Un Short par jour, dans l'ordre de `shorts.csv`, à partir du n° 1.
- 23 h 00 UTC (18 h à New York), comme TikTok.
- Page de la chaîne : mettre en avant l'onglet Shorts, puis les playlists.

## 5. Publication

- **Buffer** : connecter la chaîne au compte Buffer Statedoku (qui a déjà X et
  TikTok). Le nombre de canaux de la formule gratuite est limité, à vérifier
  dans Buffer.
- **À la main** : YouTube Studio, Créer, importer la vidéo, coller titre,
  description et tags, choisir la playlist, programmer.
- **Par le bot** : il peut publier la vidéo du jour sur YouTube aussi, avec
  le titre et la description de ce fichier. À brancher dans `bot/` puis à
  redéployer.

## 6. À vérifier la première semaine

- Le Short apparaît dans l'onglet Shorts (vertical et moins de 3 minutes :
  toutes nos vidéos le sont).
- Le lien de la chaîne ouvre le jeu.
- Des visites `social` arrivent dans les statistiques du site les jours de
  publication.
