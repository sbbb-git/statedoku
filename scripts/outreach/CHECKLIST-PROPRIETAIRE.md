# Checklist du propriétaire : référencement et prospection Statedoku

État au 10 novembre 2026. Les adresses des destinataires ne sont pas recopiées
ici (dépôt public) : elles sont dans la page d'envoi `outbox.html`, un fichier
local transmis dans la conversation, et dans la feuille Google « Statedoku,
prospection » du Drive, jamais dans le dépôt.

## Demain matin (11 novembre) : les 10 actions, 30 minutes en tout

1. [ ] **Lancer l'envoi automatique** (5 minutes, une fois). L'alias
       contact@statedoku.com est en place depuis le 10 novembre (un test est
       bien parti de « Statedoku <contact@statedoku.com> »). Connecté au compte
       Gmail qui porte cet alias, ouvrir la feuille « Statedoku, prospection »
       (elle lui est partagée), Extensions, Apps Script, coller
       `scripts/outreach/envoi-statedoku.gs`, exécuter `essai` puis `demarrer`.
       20 e-mails partent tout de suite, puis 20 chaque heure entre 13 h et
       22 h (heure de Paris), jusqu'à 100 par jour, le plafond de Google pour un
       compte gratuit : les 754 partent en 8 jours environ, sans rien faire.
2. [ ] OAGEE, professeurs de géographie de l'Ontario : https://oagee.org/contact-us/
3. [ ] Canadian Geographic Education : https://cangeoeducation.ca/en/contact-us/
4. [ ] TeachersFirst : https://teachersfirst.org/contact.cfm
5. [ ] TESOL-SPAIN : https://www.tesol-spain.org/en/contact.html
6. [ ] APHG nationale : https://www.aphg.fr/contact/
7. [ ] Can@bae, académie de Lyon : https://canabae.enseigne.ac-lyon.fr/spip/spip.php?page=contact
8. [ ] Goldles : https://www.goldles.com/suggest (« Submit for free », question anti-spam : 42)
9. [ ] GitHub, Awesome Daily Minigames (section 5 ci-dessous)
10. [ ] Adresse postale : si tu as une domiciliation, me la donner ; je l'ajoute
        sous la signature (lois américaine et canadienne sur la prospection). Le
        lot Canada de la feuille attend cette adresse (Statut « attente adresse
        postale »).

Les textes des formulaires 2 à 8 sont prêts à copier dans le lot 6 de la page
d'envoi. Tout le reste (envois de formulaires sans captcha, rédaction), je le
fais.

## 1. Brancher contact@statedoku.com dans Gmail (une seule fois)

- [ ] Compte Google : activer la validation en deux étapes, puis créer un
      « mot de passe d'application » (Sécurité, Mots de passe des applications).
- [ ] Gmail, Paramètres, Comptes, « Envoyer des e-mails en tant que »,
      Ajouter une adresse : nom **Statedoku** (jamais ton nom), adresse
      contact@statedoku.com. Serveur SMTP `smtp.gmail.com`, port 587, TLS,
      identifiant = l'adresse Gmail, mot de passe = le mot de passe d'application.
      Gmail envoie un code à contact@statedoku.com (renvoyé vers ta boîte par le
      routage d'e-mails de Cloudflare) : le saisir.
- **Pas le SMTP de Resend.** Le règlement de Resend interdit la prospection
  (« unsolicited messages of any kind, including cold outreach ») et prévoit la
  fermeture du compte sans préavis, ce qui couperait aussi les rappels
  quotidiens. La consigne du 28 octobre qui disait l'inverse était fausse.
  Le SPF de statedoku.com autorise déjà Google.

## 2. Les e-mails

- Envoi normal : automatique, par la feuille Google « Statedoku, prospection »
  et le script `envoi-statedoku.gs` (action 1 ci-dessus), jusqu'à 100 par jour,
  dans l'ordre des lots, en sautant les lignes dont le Statut n'est pas vide
  (« stop », « attente adresse postale », « à vérifier »).
- À la main si besoin : `outbox.html`. Pour chaque message : « Ouvrir dans
  Gmail » (tout est rempli), choisir **De : contact@statedoku.com**, Envoyer,
  cocher « envoyé ». E-mails personnalisés, en anglais, français ou espagnol,
  avec emoji, signés « Statedoku🇺🇸 », en 5 lots :
  - [ ] Lot 1, États-Unis (240) : en premier, car ils annoncent la Geography
        Awareness Week (16 au 20 novembre) pour « la semaine prochaine ».
  - [ ] Lot 2, Mexique, Amérique latine, Espagne (419).
  - [ ] Lot 3, France, Suisse, Belgique (47).
  - [ ] Lot 4, médias et annuaires (22) : les brouillons du 28 octobre, corrigés,
        plus DleNow et une demande de correction à DlesList.
  - [ ] Lot 5, Canada (26) : la loi canadienne anti-pourriel demande une adresse
        postale dans ce type de message. À envoyer seulement avec une adresse
        (une domiciliation suffit) sous la signature.
- [ ] Une seule relance, pas avant le 18 novembre, et seulement sans réponse.
- Les 23 brouillons Gmail du 28 octobre ont été supprimés le 10 novembre : leurs
  liens étaient enregistrés sous forme de redirection Google
  (`google.com/url?q=...`), ce que fait le connecteur Gmail à chaque brouillon
  créé. Leur texte corrigé est dans le lot 4.

## 3. Formulaires avec captcha (2 minutes chacun)

Le texte de chacun est prêt dans le lot 6 de la page d'envoi (objet et message
à copier). Nom « Statedoku », e-mail contact@statedoku.com, jamais de nom ni de
téléphone personnel.

- Annuaires de jeux :
  - [ ] Goldles : https://www.goldles.com/suggest (« Submit for free », pas
        l'option payante ; la question anti-spam attend « 42 »)
  - [ ] DLE Arena : https://dlearena.com/submit-a-game/ (gratuit pendant leur
        lancement ; catégorie « Geography games »)
  - [ ] BestDle : l'envoi du 28 octobre n'a jamais été confirmé et le jeu n'y
        figure pas ; le renvoyer à la main si le formulaire est revenu
  - [ ] DLES.gg : https://dles.gg/submit-game (catégorie Geography, « I'm the maker »)
  - [ ] Indielisted : https://indielisted.com/submit/
- États-Unis :
  - [ ] TeachersFirst : https://teachersfirst.org/contact.cfm
  - [ ] Arizona Council for the Social Studies : https://acssaz.org/about-acss-2/contact-us/
  - [ ] Indiana Council for the Social Studies : https://indianasocialstudies.com/contact-us/
  - [ ] North Carolina Council for the Social Studies : https://nccss.squarespace.com/contact
  - [ ] Pennsylvania Council for the Social Studies : https://pcssonline.org/contact/
  - [ ] ATLAS ABE (Minnesota) : https://atlasabe.org/contact/
  - [ ] We Are Teachers : https://www.weareteachers.com/contact-weareteachers/
  - [ ] Cathy Duffy Reviews : https://cathyduffyreviews.com/contact-us
  - [ ] LINCS (U.S. Department of Education) : https://lincs.ed.gov/node/add/resource_request
  - [ ] Brilliant Maps : https://brilliantmaps.com/contact/
  - [ ] Freedom Homeschooling : https://www.freedomhomeschooling.com/submit-free-resource/
        (ils demandent si l'IA a été utilisée : répondre honnêtement)
  - [ ] Larry Ferlazzo, Websites of the Day : https://larryferlazzo.edublogs.org/contact-me/
  - [ ] OTAN (California adult education) : https://otan.us/AboutUs/Contact
  - [ ] Spanish Playground : https://www.spanishplayground.net/contact/
- France, Belgique, Suisse :
  - [ ] Can@bae, HG académie de Lyon (rubrique « Jeux sérieux ») :
        https://canabae.enseigne.ac-lyon.fr/spip/spip.php?page=contact ; notre envoi
        automatique a été refusé trois fois par le site, essayer depuis ton navigateur
  - [ ] HG académie de Besançon : https://hg.ac-besancon.fr/contact/
  - [ ] HG académie de Lille : https://pedagogie.ac-lille.fr/histoire-geographie/
        (lien « Contacter le webmestre » du menu ; le site bloque nos serveurs)
  - [ ] HG-EMC académie de Toulouse : https://pedagogie.ac-toulouse.fr/hgemc/contact
  - [ ] Portail Langues (anglais), académie de Besançon : https://langues.ac-besancon.fr/contact/
  - [ ] APHG nationale : https://www.aphg.fr/contact/
  - [ ] FEGEPRO (Belgique) : https://www.fegepro.be/contact/
  - [ ] Tice-education : https://www.tice-education.fr/nous-ecrire/contact
  - [ ] VousNousIls : https://www.vousnousils.fr/contact
  - [ ] VSGG-ASEG-ASIG (Suisse) : https://vsgg-aseg-asig.ch/fr/contact/
  - [ ] Géoconfluences : https://geoconfluences.ens-lyon.fr/geoconfluences/contact-info
  - [ ] Cahiers pédagogiques : https://www.cahiers-pedagogiques.com/nous-contacter
  - [ ] Les Clionautes : https://www.clionautes.org/contactez-vous (destinataire Clio-Carto)
- Canada (même réserve que le lot 5) :
  - [ ] OAGEE, professeurs de géographie de l'Ontario (page « Call for Lessons
        and Resources ») : https://oagee.org/contact-us/
  - [ ] Canadian Geographic Education : https://cangeoeducation.ca/en/contact-us/
  - [ ] OHASSTA-AESHO (Ontario) : https://ohassta-aesho.education/contact-us/
  - [ ] SKTEAL (Saskatchewan) : https://www.skteal.com/contact-us/
- Amérique latine, Espagne :
  - [ ] TESOL-SPAIN : https://www.tesol-spain.org/en/contact.html
  - [ ] SURICANA (Argentine) : http://suricana.com.ar/contacto/
  - [ ] Centro Colombo Americano Pereira : https://www.colombopereira.com/es/formulario-de-contacto
  - [ ] El Cultural, Trujillo (Pérou) : https://www.elcultural.com.pe/american_spaces/
  - [ ] CCBEU Franca (Brésil) : https://www.ccbeufranca.com.br/contato
  - [ ] educarchile (Chili) : https://www.educarchile.cl/contact
  - [ ] Xataka México : https://www.xataka.com.mx/contacto

## 4. Sites qui demandent un compte (gratuit)

- [ ] DLEs.io : https://dles.io/submit-game
- [ ] dle.games : https://dle.games/submit (inscription : utiliser le nom du
      projet, jamais ton nom)
- [ ] 1 Jour 1 Jeu : https://1jour1jeu.com/proposer
- [ ] browse.games : https://browse.games/submit
- [ ] AlternativeTo : proposer Statedoku comme alternative à Metrodoku et Seterra
- [ ] MERLOT : https://www.merlot.org/merlot/addMaterial.htm
- [ ] INTEF Procomún (Espagne) : https://procomun.intef.es/
- [ ] IGDB (alimente BrowserCraft) : connexion par Twitch

## 5. GitHub, depuis ton compte

- [ ] Awesome Daily Games (github.com/taquanx1/awesome-daily-games) : une issue
      ou une pull request, selon leur CONTRIBUTING.md
- [ ] WordleWeb (github.com/rarelygoeshere/WordleWeb) : une pull request
- [ ] Awesome Daily Minigames (github.com/guilyx/awesome-daily-minigames) :
      une entrée dans `data/games.yml`, et seulement ce fichier :
      `name: Statedoku`, `url: https://statedoku.com/`, `category: geography`,
      `platform: web`, description : `Fill a 3x3 grid with US states that match both their row clue and their column clue.`
- [ ] Awesome Browser Games (github.com/typekcz/awesome-browser-games) : une
      ligne, à sa place alphabétique :
      ``[Statedoku](https://statedoku.com/) `Puzzle` `Geography` `Daily` - Daily 3x3 grid of US states, each matching its row and column clue.``

## 6. Plus long

- [ ] Prix AASL Best Digital Tools (bibliothécaires scolaires américains),
      formulaire https://forms.gle/yHd2dtfuHVJg61n38, **avant le 1er février 2027**.
      Il demande un lien vers la politique de confidentialité et une déclaration
      sur l'IA. Demander à Claude de préparer les réponses.
- [ ] Listdle (premier site qui envoie des visiteurs) : demander à figurer dans
      leur newsletter du lundi.

## 7. Côté site

- [ ] Bing Webmaster Tools : outil « Site Move » de www.statedoku.com vers
      statedoku.com (70 % des clics Bing vont encore aux anciennes adresses www).
- [ ] Après la décision AdSense : corriger la page À propos (EN, FR, ES), qui
      décrit encore des grilles à solution unique.
- [ ] Optionnel : secret `RESEND_API_KEY` sur le projet Cloudflare Pages
      (Workers & Pages, statedoku, Settings, Variables and Secrets), de
      préférence une clé à part de celle du worker des rappels. Il active l'e-mail
      de confirmation à l'inscription aux rappels. Puis redéployer.

## Déjà fait

- **10 novembre 2026, bilan** : 31 formulaires envoyés et confirmés par le
  site (ci-dessous), 2 probables (HG Corse, Hillel Academy en Jamaïque), et
  754 e-mails personnalisés dans la feuille « Statedoku, prospection » (États-Unis
  240, Amérique latine et Espagne 419, France, Suisse et Belgique 47, médias et
  annuaires 22, Canada 26 en attente d'une adresse postale). Familles couvertes :
  alliances géographiques et councils for the social studies, départements de
  l'éducation (responsables sciences sociales), 129 grands districts scolaires,
  associations de homeschooling, écoles américaines d'Amérique latine et des
  Caraïbes et leurs associations (AMISA, Tri-Association, ASOMEX), centres
  binationaux et American Spaces, associations de professeurs d'anglais (TESOL),
  sites académiques et régionales de l'APHG, centres de formation des
  professeurs en Espagne, écoles normales mexicaines, instituts argentins de
  formation des professeurs, olympiades et sociétés de géographie.
- **10 novembre, 2e et 3e vagues, formulaires confirmés** (15) : Illinois
  Christian Home Educators, Homeschoolers of Maine, MassHOPE, Vermont Home
  Education Network, West Virginia Home Educators Association, Homeschool
  Alabama, Homeschool South Dakota, Tri-State Homeschool (Delaware), East Idaho
  Home Educators, Colegio de Geógrafos (Andalousie), Carol Morgan School
  (République dominicaine), Union School (Haïti), Las Morochas et International
  School of Monagas (Venezuela), Escuela Normal Superior de Querétaro.
- **10 novembre 2026, 1re vague, formulaires envoyés et confirmés par le site** (16) :
  Arizona Geographic Alliance, California Geographic Alliance, Oklahoma Alliance
  for Geographic Education, Washington State Council for the Social Studies,
  Terre Ouverte (HG Aix-Marseille), site d'anglais de l'académie d'Aix-Marseille,
  groupe Jeux numériques de la DRANE Aix-Marseille et Nice, Lexilogos, BDRP
  (HEP Vaud), SATE (Suisse), ARICANA (Rosario), ALICANA (Argentine), FAAPI
  (Argentine), CCBEU Sorocaba (Brésil), Instituto Chileno Norteamericano Curicó,
  Best Daily Games (annuaire). Probable, sans message de confirmation : HG
  académie de Corse.
- **Annuaires, état au 10 novembre** : listé chez Alldle, 0x9 dles, Dle Hunt,
  MapGame, DlesList (sa fiche dit encore « single solution », correction
  demandée dans le lot 4), Dailies.games, Seekdle, Listdle, Wordleverse et
  Today's Dailies. En attente : Playlin (file gratuite lente, jusqu'en
  décembre), Daily Dles, dailydle, DleList. The Dles n'ajoute pas les jeux
  « avec du contenu généré par IA ». Daily Game Central : à vérifier à la main,
  le site bloque les vérifications automatiques.
- **28 octobre 2026** : formulaires envoyés et confirmés chez The Dles, Alldle,
  Playlin, Daily Dles, dailydle, Daily Game Central, DleList et 0x9 dles ;
  envoyé sans confirmation visible : BestDle. Déjà listé avant : Dle Hunt,
  MapGame, DlesList, Dailies.games, Seekdle, Listdle, Wordleverse.
