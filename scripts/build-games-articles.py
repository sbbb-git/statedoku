#!/usr/bin/env python3
"""Build the two "best games" articles in English, French and Spanish.

  /learn/best-games-to-learn-the-50-states/            and its FR, ES versions
  /learn/best-daily-geography-games/                   and its FR, ES versions

Written on 22 October 2026 from a fact sheet checked that day on each game's
own site (rules, prices, ads, account). Every figure about another site is
typed once in GAMES below and reused by the three languages, so the versions
cannot drift apart. Prices and play counts move: re-check them on the sites
before editing, and keep the "October 2026" wording next to any price.

The pages are honest comparisons: Statedoku publishes them and says so, lists
its own games last with their limits, and links every other game it names.

The build fails on: a title over 65 characters, a description outside 70 to
160, a unicode dash anywhere in the output, an internal link to a missing or
noindexed page, or hreflang that is not reciprocal between the three files.

Usage: python3 scripts/build-games-articles.py
Then:  python3 scripts/build-sitemap-lastmod.py (after committing), and
       python3 scripts/build-llms.py
"""
import html, json, pathlib, re, sys

ROOT = pathlib.Path(__file__).resolve().parent.parent
BASE = 'https://statedoku.com'
PUBLISHED = '2026-10-22'
DASHES = re.compile('[‒–—―−]')

SLUGS = {
    'learn': {'en': '/learn/best-games-to-learn-the-50-states/',
              'fr': '/fr/learn/meilleurs-jeux-pour-apprendre-les-etats/',
              'es': '/es/learn/mejores-juegos-para-aprender-los-estados/'},
    'daily': {'en': '/learn/best-daily-geography-games/',
              'fr': '/fr/learn/meilleurs-jeux-de-geographie-quotidiens/',
              'es': '/es/learn/mejores-juegos-diarios-de-geografia/'},
}
HUB = {'en': '/learn/', 'fr': '/fr/learn/', 'es': '/es/learn/'}
PLAY = {'en': '/play/', 'fr': '/fr/play/', 'es': '/es/play/'}
HOME = {'en': '/', 'fr': '/fr/', 'es': '/es/'}
REF = {'en': 'learn/states-confederate/index.html',
       'fr': 'fr/learn/13-colonies/index.html',
       'es': 'es/learn/13-colonies/index.html'}
CRUMB = {'en': ('Home', 'Learn'), 'fr': ('Accueil', 'Apprendre'), 'es': ('Inicio', 'Aprender')}
UPDATED = {'en': 'Facts about other sites checked on their own pages on October 22, 2026.',
           'fr': 'Informations sur les autres sites vérifiées sur leurs propres pages le 22 octobre 2026.',
           'es': 'Datos de los otros sitios comprobados en sus propias páginas el 22 de octubre de 2026.'}

# External pages, checked on 22 October 2026.
URL = {
    'seterra': 'https://www.geoguessr.com/l/usa',
    'sporcle': 'https://www.sporcle.com/games/g/states',
    'lizard': 'https://lizardpoint.com/geography/usa-quiz.php',
    'sheppard': 'https://www.sheppardsoftware.com/web_games.htm',
    'mappr': 'https://www.mappr.co/quiz/us-states-by-shape-quiz/',
    'purpose': 'https://www.purposegames.com/game/states-of-the-usa-quiz',
    'stack': 'https://apps.apple.com/us/app/stack-the-states/id381342267',
    'worldle': 'https://worldle.teuteuf.fr/',
    'globle': 'https://globle-game.com/',
    'travle': 'https://travle.earth/',
    'travleusa': 'https://travle.earth/usa',
    'flagle': 'https://www.flagle.io/',
    'tradle': 'https://games.oec.world/en/tradle/',
    'geogrid': 'https://www.geogridgame.com/',
    'countryle': 'https://countryle.com/',
    'statele': 'https://statele.teuteuf.fr/',
    'wheretaken': 'https://wheretakenusa.teuteuf.fr/',
    'statle': 'https://statle.us/',
    'statedle': 'https://statedle.com/',
    'mapprdaily': 'https://www.mappr.co/games/guess-the-state-game/',
    'listdle': 'https://listdle.com/',
    'wordleverse': 'https://wordleverse.net/',
}


def a(key, label):
    return f'<a href="{URL[key]}" rel="noopener">{label}</a>'


def own(lang, path, label):
    return f'<a href="{path}">{label}</a>'


# ─── Article 1: games to learn the 50 states ────────────────────────────
def learn_article(L):
    p = PLAY[L]
    if L == 'en':
        return dict(
            title='Best Free Games to Learn the 50 US States (2026)',
            desc='Free games and quizzes to learn the 50 US states and capitals, compared: Seterra, Sporcle, Lizard Point, Sheppard Software and more.',
            h1='The best free games to learn the 50 US states',
            sub='Map drills, typing quizzes, games for kids and daily puzzles, compared on what they teach, what they cost and whether they need an account.',
            answer=('<strong>Short answer.</strong> To learn where each state sits, drill a click-the-map quiz such as Seterra or Lizard Point. '
                    'To test your recall against the clock, use Sporcle\'s typing quiz. For children, Sheppard Software builds up level by level. '
                    'To keep it up, a daily puzzle takes five minutes. Every free web game below opens in the browser with no sign-up, and most show ads that a paid plan removes.'),
            disclosure=('<strong>A note on bias.</strong> Statedoku publishes this page and makes some of the games in it. Ours are listed last, with their limits. '
                        'Facts about the other games were checked on their own sites on October 22, 2026. Prices and features change, so check before paying for anything.'),
            table_head=['Game', 'Best for', 'Price', 'Account to play', 'Ads'],
            table=[
                ['Seterra (GeoGuessr)', 'Clicking states on a map, then capitals, flags, counties', 'Free; Pro from $3.99 a month removes ads', 'No (log in to save scores)', 'Yes, on the web'],
                ['Sporcle', 'Typing all 50 from memory against a timer', 'Free; Orange $3.99 a month removes ads', 'No', 'Yes'],
                ['Lizard Point', 'Step-by-step study with hints', 'Free', 'No', 'Yes'],
                ['Sheppard Software', 'Young children, level by level', 'Free', 'No', 'Yes'],
                ['Mappr shape quiz', 'State outlines, with a daily round of six shapes', 'Free', 'No', 'None inside the quiz, says the site'],
                ['PurposeGames', 'User-made click-the-map quizzes', 'Free', 'No', 'Yes'],
                ['Stack the States', 'Kids on a phone or tablet', '$2.99 app, iOS and Android', 'No', 'None listed'],
                ['Statedoku (ours)', 'A daily logic puzzle and 21 short games, in three languages', 'Free', 'No', 'None on the game pages'],
            ],
            sections=[
                ('Learn the map', [
                    ('Seterra', URL['seterra'], [
                        f'Seterra is a long-running map quiz site that has been part of GeoGuessr since 2022. Its {a("seterra", "USA list")} holds 110 map quizzes: the 50 states, abbreviations, capitals, flags, the 13 colonies, territories, rivers, major cities and the counties of each state.',
                        'On "The U.S.: 50 States" you either click each named state (Pin) or type the name of the highlighted one (Type). A guided Learn mode is kept for paying accounts. The web version is free with ads, and GeoGuessr Pro, from $3.99 a month in October 2026, removes them. The free iOS and Android apps list no ads or in-app purchases.',
                        '<em>Best for:</em> building the mental map, then moving on to capitals and counties.']),
                    ('Lizard Point', URL['lizard'], [
                        f'Lizard Point is a small family-run site from Ontario that has offered free geography quizzes since 1997. Its {a("lizard", "US states quiz")} has four modes: Study, Practice (three tries per state, with hints), Test, and Strict test (one try).',
                        'Fifteen US quizzes cover the states and capitals, each also split into East and West, plus cities, rivers, flags and airport codes. It is ad-supported and web only. The teacher and student accounts it used to offer were discontinued in March 2023.',
                        '<em>Best for:</em> learners who want hints and a gentle ramp rather than a timer.']),
                    ('Mappr US States by Shape', URL['mappr'], [
                        f'Mappr\'s {a("mappr", "shape quiz")} shows a state outline and asks which state it is, as multiple choice or typed. It adds a speed round, a find-the-state map mode, a learn mode and a daily challenge in which everyone gets the same six shapes.',
                        'It is free with no sign-up, and the site says the quiz itself carries no ads.',
                        '<em>Best for:</em> recognizing states by shape, the skill silhouette games test.']),
                ]),
                ('Test your memory', [
                    ('Sporcle', URL['sporcle'], [
                        f'Sporcle\'s {a("sporcle", "US States Quiz")} asks you to type all 50 names in ten minutes. With close to 40 million plays it is a common benchmark, and a Practice mode removes the timer. The US Capitals Quiz works the same way.',
                        'Most of Sporcle\'s catalog is made by its users, so quality varies beyond the main quizzes. Free play shows ads; Sporcle Orange, $3.99 a month or $43.99 a year in October 2026, removes them.',
                        '<em>Best for:</em> recall. Typing a name from memory is harder than picking it from a list, which makes it a good test once the map feels familiar.']),
                    ('PurposeGames', URL['purpose'], [
                        f'PurposeGames hosts quizzes made by its users, among them a 50-question {a("purpose", "States of the USA Quiz")} played more than 11 million times. Anyone can play without an account. The site is funded by advertising alone and asks players to allow ads.',
                        '<em>Best for:</em> variety, once the basics are in place.']),
                ]),
                ('For children', [
                    ('Sheppard Software', URL['sheppard'], [
                        f'Sheppard Software has a {a("sheppard", "US geography track")} for younger players: a tutorial, then US States levels 1 to 7, US Capitals levels 1 to 3, regions, rivers and lakes, postal abbreviations and a five-mode USA jigsaw. Players identify states, drag them onto the map, or type the first three letters.',
                        'It is free and ad-supported, and the newer levels play on tablets and phones.',
                        '<em>Best for:</em> children, and anyone who wants to start with drag and drop.']),
                    ('Stack the States', URL['stack'], [
                        f'{a("stack", "Stack the States")} and Stack the States 2 by Freecloud Design are paid apps, $2.99 each on iOS and Android. Children answer questions on capitals, shapes, abbreviations, borders, nicknames and flags to win states, then stack them on screen. The iOS listings show no in-app purchases.',
                        '<em>Best for:</em> a one-time purchase for a child\'s tablet.']),
                ]),
                ('Our games', [
                    ('Statedoku', HOME[L], [
                        f'Statedoku is this site. The {own(L, HOME[L], "daily puzzle")} is a 3×3 grid in which each cell needs a state that fits both its row clue and its column clue, such as "Borders Canada" and "Pacific coast". You get five mistakes, and everyone gets the same grid each day.',
                        f'Next to it, {own(L, p, "21 short games")} cover the map ({own(L, p + "place-the-state/", "Place the State")}, with Easy, Normal and Hard levels), capitals, abbreviations, silhouettes, flags, the 13 colonies, time zones and more, each in English, French and Spanish. There is no account, no ad on the game pages, and a Share to Google Classroom button on each.',
                        '<em>Limits:</em> there is no app, and there are fewer specialist quizzes, such as counties or rivers, than on Seterra.']),
                ]),
            ],
            method_h='How to learn the states with games',
            method=[
                f'<strong>Start with the map.</strong> Use a click-the-map quiz until you can place every state, one region at a time. Our {own(L, HUB[L], "region-by-region method")} splits the 50 into four groups.',
                '<strong>Then recall the names.</strong> Switch to a typing quiz: naming a state from memory is a harder test than clicking it.',
                f'<strong>Add capitals, then abbreviations.</strong> Our {own(L, "/learn/states-and-capitals/", "states and capitals list")} and {own(L, "/learn/state-abbreviations/", "abbreviations guide")} give the full lists to check against.',
                '<strong>Keep it short and regular.</strong> Ten minutes a day is easier to keep up than a long session once a week. A daily puzzle gives you a reason to come back.',
            ],
            faq=[
                ('What is the best free game to learn the 50 states?',
                 'It depends on the step. To learn where states are, a click-the-map quiz such as Seterra or Lizard Point. To check recall, Sporcle\'s typing quiz. For young children, Sheppard Software. To keep practicing every day, a daily puzzle such as Statedoku or Statele.'),
                ('Is Seterra still free?',
                 'Yes. Seterra\'s quizzes are free on the web, with ads. It has been part of GeoGuessr since 2022, and GeoGuessr\'s paid Pro plan, from $3.99 a month in October 2026, removes the ads. The guided Learn mode also needs a paid account.'),
                ('Do I need an account to play these games?',
                 'No, none of the free games on this page asks for one before you play. Seterra and Sporcle ask you to log in only to save your scores.'),
                ('Which of these games work in a classroom?',
                 'All the web games run in a browser without student accounts. Statedoku\'s games have a Share to Google Classroom button and can be embedded in a class page. Lizard Point discontinued its teacher accounts in March 2023.'),
                ('Are there games for the state capitals too?',
                 'Yes. Seterra and Lizard Point have capitals map quizzes, Sporcle has a US Capitals typing quiz, and Statedoku has State Capitals Match and a capitals typing quiz.'),
            ],
            related=[(HUB[L], 'How to learn the 50 states'), ('/learn/states-and-capitals/', 'All 50 states and capitals'),
                     ('/learn/state-capitals/', 'Memorize the capitals'), (PLAY[L], 'Our 21 free games'),
                     (SLUGS['daily'][L], 'Best daily geography games'), ('/learn/printable-us-states-map/', 'Printable US map')],
            related_h='Related guides',
            play_h='Try it now', play_p='Click the right state on a blank map: three levels, three lives.',
            play_cta=('Play Place the State', p + 'place-the-state/'), daily_cta=("Today's Statedoku puzzle", HOME[L]),
        )
    if L == 'fr':
        return dict(
            title='Meilleurs jeux gratuits pour apprendre les 50 États',
            desc='Jeux et quiz gratuits pour apprendre les 50 États américains et leurs capitales, comparés : Seterra, Sporcle, Lizard Point, Sheppard Software.',
            h1='Les meilleurs jeux gratuits pour apprendre les 50 États américains',
            sub='Cartes à cliquer, quiz à taper, jeux pour enfants et puzzles quotidiens, comparés sur ce qu\'ils apprennent, ce qu\'ils coûtent et s\'il faut un compte.',
            answer=('<strong>En bref.</strong> Pour apprendre où se trouve chaque État, entraînez-vous sur une carte à cliquer comme Seterra ou Lizard Point. '
                    'Pour tester votre mémoire contre la montre, le quiz à taper de Sporcle. Pour les enfants, Sheppard Software progresse niveau par niveau. '
                    'Pour tenir dans la durée, un puzzle quotidien prend cinq minutes. Tous les jeux web gratuits ci-dessous s\'ouvrent dans le navigateur sans inscription, et la plupart affichent des publicités qu\'un abonnement retire.'),
            disclosure=('<strong>Transparence.</strong> Statedoku publie cette page et fait certains des jeux cités. Les nôtres sont présentés en dernier, avec leurs limites. '
                        'Les informations sur les autres jeux ont été vérifiées sur leurs propres sites le 22 octobre 2026. Prix et fonctions évoluent : vérifiez avant de payer quoi que ce soit.'),
            table_head=['Jeu', 'Idéal pour', 'Prix', 'Compte pour jouer', 'Publicité'],
            table=[
                ['Seterra (GeoGuessr)', 'Placer les États sur la carte, puis capitales, drapeaux, comtés', 'Gratuit ; Pro dès 3,99 $ par mois sans pub', 'Non (connexion pour garder ses scores)', 'Oui, sur le web'],
                ['Sporcle', 'Taper les 50 de mémoire contre la montre', 'Gratuit ; Orange 3,99 $ par mois sans pub', 'Non', 'Oui'],
                ['Lizard Point', 'Apprendre pas à pas avec des indices', 'Gratuit', 'Non', 'Oui'],
                ['Sheppard Software', 'Jeunes enfants, niveau par niveau', 'Gratuit', 'Non', 'Oui'],
                ['Quiz des formes Mappr', 'Silhouettes des États, avec six formes par jour', 'Gratuit', 'Non', 'Aucune dans le quiz, selon le site'],
                ['PurposeGames', 'Cartes à cliquer créées par les joueurs', 'Gratuit', 'Non', 'Oui'],
                ['Stack the States', 'Enfants sur téléphone ou tablette', 'Appli à 2,99 $, iOS et Android', 'Non', 'Aucune indiquée'],
                ['Statedoku (le nôtre)', 'Un puzzle logique quotidien et 21 jeux courts, en trois langues', 'Gratuit', 'Non', 'Aucune sur les pages de jeu'],
            ],
            sections=[
                ('Apprendre la carte', [
                    ('Seterra', URL['seterra'], [
                        f'Seterra est un site de quiz de cartes de longue date, intégré à GeoGuessr depuis 2022. Sa {a("seterra", "liste USA")} compte 110 quiz : les 50 États, les abréviations, les capitales, les drapeaux, les 13 colonies, les territoires, les fleuves, les grandes villes et les comtés de chaque État.',
                        'Sur « The U.S.: 50 States », on clique sur l\'État demandé (Pin) ou on tape le nom de l\'État surligné (Type). Un mode Learn guidé est réservé aux comptes payants. La version web est gratuite avec publicité, et GeoGuessr Pro, dès 3,99 $ par mois en octobre 2026, la retire. Les applis gratuites iOS et Android n\'annoncent ni publicité ni achat intégré.',
                        '<em>Idéal pour :</em> construire la carte mentale, puis passer aux capitales et aux comtés.']),
                    ('Lizard Point', URL['lizard'], [
                        f'Lizard Point est un petit site familial de l\'Ontario qui propose des quiz de géographie gratuits depuis 1997. Son {a("lizard", "quiz des États")} a quatre modes : Study, Practice (trois essais par État, avec indices), Test et Strict test (un seul essai).',
                        'Quinze quiz américains couvrent les États et les capitales, chacun aussi découpé en Est et Ouest, ainsi que les villes, les fleuves, les drapeaux et les codes d\'aéroport. Le site vit de la publicité et n\'existe que sur le web. Ses comptes enseignant et élève ont été arrêtés en mars 2023.',
                        '<em>Idéal pour :</em> apprendre avec des indices et une progression douce plutôt qu\'un chrono.']),
                    ('Quiz des formes Mappr', URL['mappr'], [
                        f'Le {a("mappr", "quiz des formes")} de Mappr montre la silhouette d\'un État et demande lequel c\'est, en choix multiple ou à taper. Il ajoute un mode rapide, un mode carte, un mode apprentissage et un défi quotidien où tout le monde reçoit les six mêmes formes.',
                        'Il est gratuit et sans inscription, et le site indique que le quiz lui-même n\'affiche pas de publicité.',
                        '<em>Idéal pour :</em> reconnaître les États à leur forme, ce que testent les jeux de silhouettes.']),
                ]),
                ('Tester sa mémoire', [
                    ('Sporcle', URL['sporcle'], [
                        f'Le {a("sporcle", "US States Quiz")} de Sporcle demande de taper les 50 noms en dix minutes. Avec près de 40 millions de parties, c\'est une référence, et un mode Practice retire le chrono. Le US Capitals Quiz fonctionne de la même façon.',
                        'L\'essentiel du catalogue de Sporcle est créé par ses utilisateurs : la qualité varie au-delà des quiz principaux. Le jeu gratuit affiche de la publicité ; Sporcle Orange, 3,99 $ par mois ou 43,99 $ par an en octobre 2026, la retire.',
                        '<em>Idéal pour :</em> la mémoire. Taper un nom sans aide est plus dur que le choisir dans une liste, ce qui en fait un bon test une fois la carte familière.']),
                    ('PurposeGames', URL['purpose'], [
                        f'PurposeGames héberge des quiz créés par ses utilisateurs, dont un {a("purpose", "States of the USA Quiz")} de 50 questions joué plus de 11 millions de fois. On peut jouer sans compte. Le site vit uniquement de la publicité et demande de l\'autoriser pour jouer.',
                        '<em>Idéal pour :</em> varier, une fois les bases acquises.']),
                ]),
                ('Pour les enfants', [
                    ('Sheppard Software', URL['sheppard'], [
                        f'Sheppard Software propose un {a("sheppard", "parcours de géographie américaine")} pour les plus jeunes : un tutoriel, puis les niveaux 1 à 7 des États, 1 à 3 des capitales, les régions, les fleuves et lacs, les abréviations postales et un puzzle des États-Unis en cinq modes. On identifie les États, on les glisse sur la carte, ou on tape les trois premières lettres.',
                        'C\'est gratuit, financé par la publicité, et les niveaux récents fonctionnent sur tablette et téléphone.',
                        '<em>Idéal pour :</em> les enfants, et tous ceux qui veulent commencer par le glisser-déposer.']),
                    ('Stack the States', URL['stack'], [
                        f'{a("stack", "Stack the States")} et Stack the States 2, de Freecloud Design, sont des applis payantes à 2,99 $ chacune sur iOS et Android. L\'enfant répond à des questions sur les capitales, les formes, les abréviations, les frontières, les surnoms et les drapeaux pour gagner des États, puis les empile à l\'écran. Les fiches iOS n\'indiquent aucun achat intégré.',
                        '<em>Idéal pour :</em> un achat unique pour la tablette d\'un enfant.']),
                ]),
                ('Nos jeux', [
                    ('Statedoku', HOME[L], [
                        f'Statedoku, c\'est ce site. Le {own(L, HOME[L], "puzzle quotidien")} est une grille 3×3 où chaque case attend un État qui respecte à la fois l\'indice de sa ligne et celui de sa colonne, par exemple « Frontière Canada » et « Côte Pacifique ». Cinq erreurs sont permises, et tout le monde a la même grille chaque jour.',
                        f'À côté, {own(L, p, "21 jeux courts")} couvrent la carte ({own(L, p + "place-the-state/", "Placer l’État")}, en niveaux Facile, Normal et Difficile), les capitales, les abréviations, les silhouettes, les drapeaux, les 13 colonies, les fuseaux horaires et plus, chacun en français, anglais et espagnol. Pas de compte, pas de publicité sur les pages de jeu, et un bouton Partager sur Google Classroom sur chacune.',
                        '<em>Limites :</em> pas d\'appli, et moins de quiz spécialisés, comme les comtés ou les fleuves, que sur Seterra.']),
                ]),
            ],
            method_h='Comment apprendre les États avec des jeux',
            method=[
                f'<strong>Commencez par la carte.</strong> Utilisez une carte à cliquer jusqu\'à savoir placer chaque État, une région à la fois. Notre {own(L, HUB[L], "méthode région par région")} découpe les 50 en quatre groupes.',
                '<strong>Puis retrouvez les noms.</strong> Passez à un quiz à taper : nommer un État de mémoire est un test plus dur que cliquer dessus.',
                f'<strong>Ajoutez les capitales, puis les abréviations.</strong> Notre {own(L, "/fr/learn/states-and-capitals/", "liste des États et capitales")} et notre {own(L, "/fr/learn/state-abbreviations/", "liste des abréviations")} servent de référence.',
                '<strong>Court et régulier.</strong> Dix minutes par jour se tiennent mieux qu\'une longue séance par semaine. Un puzzle quotidien donne une raison de revenir.',
            ],
            faq=[
                ('Quel est le meilleur jeu gratuit pour apprendre les 50 États ?',
                 'Cela dépend de l\'étape. Pour savoir où sont les États, une carte à cliquer comme Seterra ou Lizard Point. Pour tester sa mémoire, le quiz à taper de Sporcle. Pour les jeunes enfants, Sheppard Software. Pour s\'entraîner chaque jour, un puzzle quotidien comme Statedoku ou Statele.'),
                ('Seterra est-il toujours gratuit ?',
                 'Oui. Les quiz de Seterra sont gratuits sur le web, avec publicité. Le site fait partie de GeoGuessr depuis 2022, et l\'abonnement Pro de GeoGuessr, dès 3,99 $ par mois en octobre 2026, retire la publicité. Le mode Learn guidé demande aussi un compte payant.'),
                ('Faut-il un compte pour jouer ?',
                 'Non, aucun des jeux gratuits de cette page n\'en demande avant de jouer. Seterra et Sporcle proposent de se connecter seulement pour garder ses scores.'),
                ('Lesquels fonctionnent en classe ?',
                 'Tous les jeux web tournent dans un navigateur sans compte élève. Les jeux de Statedoku ont un bouton Partager sur Google Classroom et s\'intègrent dans une page de classe. Lizard Point a arrêté ses comptes enseignant en mars 2023.'),
                ('Existe-t-il des jeux pour les capitales ?',
                 'Oui. Seterra et Lizard Point ont des quiz de capitales sur carte, Sporcle un US Capitals Quiz à taper, et Statedoku un jeu d\'association et un quiz à taper.'),
            ],
            related=[(HUB[L], 'Apprendre les 50 États'), ('/fr/learn/states-and-capitals/', 'Les 50 États et leurs capitales'),
                     ('/fr/learn/capitales-des-etats/', 'Les 50 capitales'), (PLAY[L], 'Nos 21 jeux gratuits'),
                     (SLUGS['daily'][L], 'Jeux de géographie quotidiens'), ('/learn/printable-us-states-map/', 'Carte imprimable (EN)')],
            related_h='Guides liés',
            play_h='Essayez maintenant', play_p='Cliquez sur le bon État sur une carte vierge : trois niveaux, trois vies.',
            play_cta=('Jouer à Placer l’État', p + 'place-the-state/'), daily_cta=('Le puzzle Statedoku du jour', HOME[L]),
        )
    return dict(
        title='Mejores juegos gratis para aprender los 50 estados',
        desc='Juegos y quizzes gratis para aprender los 50 estados de EE.UU. y sus capitales, comparados: Seterra, Sporcle, Lizard Point, Sheppard Software.',
        h1='Los mejores juegos gratis para aprender los 50 estados de EE.UU.',
        sub='Mapas para hacer clic, quizzes para escribir, juegos para niños y puzzles diarios, comparados por lo que enseñan, lo que cuestan y si piden cuenta.',
        answer=('<strong>En resumen.</strong> Para aprender dónde está cada estado, practica con un mapa para hacer clic como Seterra o Lizard Point. '
                'Para poner a prueba la memoria contra el reloj, el quiz para escribir de Sporcle. Para niños, Sheppard Software avanza nivel a nivel. '
                'Para mantener el hábito, un puzzle diario lleva cinco minutos. Todos los juegos web gratis de abajo se abren en el navegador sin registro, y la mayoría muestra anuncios que un plan de pago quita.'),
        disclosure=('<strong>Transparencia.</strong> Statedoku publica esta página y hace algunos de los juegos que aparecen. Los nuestros van al final, con sus límites. '
                    'Los datos de los otros juegos se comprobaron en sus propios sitios el 22 de octubre de 2026. Los precios y funciones cambian: compruébalos antes de pagar.'),
        table_head=['Juego', 'Ideal para', 'Precio', 'Cuenta para jugar', 'Anuncios'],
        table=[
            ['Seterra (GeoGuessr)', 'Ubicar estados en el mapa, luego capitales, banderas, condados', 'Gratis; Pro desde 3,99 $ al mes sin anuncios', 'No (inicio de sesión para guardar puntuaciones)', 'Sí, en la web'],
            ['Sporcle', 'Escribir los 50 de memoria contra el reloj', 'Gratis; Orange 3,99 $ al mes sin anuncios', 'No', 'Sí'],
            ['Lizard Point', 'Estudio paso a paso con pistas', 'Gratis', 'No', 'Sí'],
            ['Sheppard Software', 'Niños pequeños, nivel a nivel', 'Gratis', 'No', 'Sí'],
            ['Quiz de formas de Mappr', 'Siluetas de los estados, con seis formas al día', 'Gratis', 'No', 'Ninguno en el quiz, según el sitio'],
            ['PurposeGames', 'Mapas para hacer clic creados por usuarios', 'Gratis', 'No', 'Sí'],
            ['Stack the States', 'Niños en móvil o tableta', 'App de 2,99 $, iOS y Android', 'No', 'Ninguno indicado'],
            ['Statedoku (el nuestro)', 'Un puzzle lógico diario y 21 juegos cortos, en tres idiomas', 'Gratis', 'No', 'Ninguno en las páginas de juego'],
        ],
        sections=[
            ('Aprender el mapa', [
                ('Seterra', URL['seterra'], [
                    f'Seterra es un sitio veterano de quizzes de mapas que forma parte de GeoGuessr desde 2022. Su {a("seterra", "lista de EE.UU.")} reúne 110 quizzes: los 50 estados, las abreviaturas, las capitales, las banderas, las 13 colonias, los territorios, los ríos, las grandes ciudades y los condados de cada estado.',
                    'En «The U.S.: 50 States» haces clic en el estado pedido (Pin) o escribes el nombre del estado resaltado (Type). Un modo Learn guiado queda para las cuentas de pago. La versión web es gratis con anuncios, y GeoGuessr Pro, desde 3,99 $ al mes en octubre de 2026, los quita. Las apps gratis de iOS y Android no indican anuncios ni compras dentro de la app.',
                    '<em>Ideal para:</em> construir el mapa mental y luego pasar a capitales y condados.']),
                ('Lizard Point', URL['lizard'], [
                    f'Lizard Point es un pequeño sitio familiar de Ontario que ofrece quizzes de geografía gratis desde 1997. Su {a("lizard", "quiz de los estados")} tiene cuatro modos: Study, Practice (tres intentos por estado, con pistas), Test y Strict test (un solo intento).',
                    'Quince quizzes de EE.UU. cubren los estados y las capitales, cada uno también dividido en Este y Oeste, además de ciudades, ríos, banderas y códigos de aeropuerto. Se financia con anuncios y solo existe en la web. Las cuentas de docente y alumno que ofrecía se suspendieron en marzo de 2023.',
                    '<em>Ideal para:</em> aprender con pistas y un avance suave, sin reloj.']),
                ('Quiz de formas de Mappr', URL['mappr'], [
                    f'El {a("mappr", "quiz de formas")} de Mappr muestra la silueta de un estado y pregunta cuál es, con opciones o escribiendo. Añade una ronda rápida, un modo de mapa, un modo de aprendizaje y un reto diario en el que todos reciben las mismas seis formas.',
                    'Es gratis y sin registro, y el sitio indica que el quiz en sí no tiene anuncios.',
                    '<em>Ideal para:</em> reconocer los estados por su forma, lo que ponen a prueba los juegos de siluetas.']),
            ]),
            ('Poner a prueba la memoria', [
                ('Sporcle', URL['sporcle'], [
                    f'El {a("sporcle", "US States Quiz")} de Sporcle pide escribir los 50 nombres en diez minutos. Con cerca de 40 millones de partidas es una referencia, y un modo Practice quita el reloj. El US Capitals Quiz funciona igual.',
                    'La mayor parte del catálogo de Sporcle la crean sus usuarios, así que la calidad varía fuera de los quizzes principales. El juego gratis muestra anuncios; Sporcle Orange, 3,99 $ al mes o 43,99 $ al año en octubre de 2026, los quita.',
                    '<em>Ideal para:</em> la memoria. Escribir un nombre sin ayuda es más difícil que elegirlo de una lista, por eso es una buena prueba cuando el mapa ya resulta familiar.']),
                ('PurposeGames', URL['purpose'], [
                    f'PurposeGames aloja quizzes creados por sus usuarios, entre ellos un {a("purpose", "States of the USA Quiz")} de 50 preguntas jugado más de 11 millones de veces. Se puede jugar sin cuenta. El sitio se financia solo con publicidad y pide permitir los anuncios para jugar.',
                    '<em>Ideal para:</em> variar, una vez dominadas las bases.']),
            ]),
            ('Para niños', [
                ('Sheppard Software', URL['sheppard'], [
                    f'Sheppard Software tiene un {a("sheppard", "recorrido de geografía de EE.UU.")} para los más pequeños: un tutorial, luego los niveles 1 a 7 de estados, 1 a 3 de capitales, regiones, ríos y lagos, abreviaturas postales y un rompecabezas de EE.UU. con cinco modos. Se identifican los estados, se arrastran al mapa o se escriben sus tres primeras letras.',
                    'Es gratis, con anuncios, y los niveles nuevos funcionan en tabletas y móviles.',
                    '<em>Ideal para:</em> niños, y para quien quiera empezar arrastrando y soltando.']),
                ('Stack the States', URL['stack'], [
                    f'{a("stack", "Stack the States")} y Stack the States 2, de Freecloud Design, son apps de pago, 2,99 $ cada una en iOS y Android. Los niños responden preguntas sobre capitales, formas, abreviaturas, fronteras, apodos y banderas para ganar estados y apilarlos en pantalla. Las fichas de iOS no indican compras dentro de la app.',
                    '<em>Ideal para:</em> una compra única para la tableta de un niño.']),
            ]),
            ('Nuestros juegos', [
                ('Statedoku', HOME[L], [
                    f'Statedoku es este sitio. El {own(L, HOME[L], "puzzle diario")} es una cuadrícula 3×3 en la que cada casilla pide un estado que cumpla a la vez la pista de su fila y la de su columna, por ejemplo «Frontera con Canadá» y «Costa Pacífica». Se permiten cinco errores, y todos reciben la misma cuadrícula cada día.',
                    f'Junto a él, {own(L, p, "21 juegos cortos")} cubren el mapa ({own(L, p + "place-the-state/", "Coloca el Estado")}, con niveles Fácil, Normal y Difícil), las capitales, las abreviaturas, las siluetas, las banderas, las 13 colonias, los husos horarios y más, cada uno en español, inglés y francés. Sin cuenta, sin anuncios en las páginas de juego y con un botón Compartir en Google Classroom en cada una.',
                    '<em>Límites:</em> no hay app, y hay menos quizzes especializados, como condados o ríos, que en Seterra.']),
            ]),
        ],
        method_h='Cómo aprender los estados con juegos',
        method=[
            f'<strong>Empieza por el mapa.</strong> Usa un mapa para hacer clic hasta ubicar cada estado, una región cada vez. Nuestro {own(L, HUB[L], "método región por región")} divide los 50 en cuatro grupos.',
            '<strong>Luego recuerda los nombres.</strong> Pasa a un quiz para escribir: nombrar un estado de memoria es una prueba más difícil que hacer clic en él.',
            f'<strong>Añade las capitales y luego las abreviaturas.</strong> Nuestra {own(L, "/es/learn/capitales-de-estados/", "lista de capitales")} y nuestra {own(L, "/es/learn/state-abbreviations/", "lista de abreviaturas")} sirven de referencia.',
            '<strong>Corto y constante.</strong> Diez minutos al día se mantienen mejor que una sesión larga a la semana. Un puzzle diario da un motivo para volver.',
        ],
        faq=[
            ('¿Cuál es el mejor juego gratis para aprender los 50 estados?',
             'Depende de la etapa. Para saber dónde están los estados, un mapa para hacer clic como Seterra o Lizard Point. Para poner a prueba la memoria, el quiz para escribir de Sporcle. Para niños pequeños, Sheppard Software. Para practicar cada día, un puzzle diario como Statedoku o Statele.'),
            ('¿Seterra sigue siendo gratis?',
             'Sí. Los quizzes de Seterra son gratis en la web, con anuncios. El sitio forma parte de GeoGuessr desde 2022, y el plan Pro de GeoGuessr, desde 3,99 $ al mes en octubre de 2026, quita los anuncios. El modo Learn guiado también requiere una cuenta de pago.'),
            ('¿Hace falta una cuenta para jugar?',
             'No, ninguno de los juegos gratis de esta página la pide para jugar. Seterra y Sporcle ofrecen iniciar sesión solo para guardar las puntuaciones.'),
            ('¿Cuáles funcionan en clase?',
             'Todos los juegos web funcionan en un navegador sin cuentas de alumno. Los juegos de Statedoku tienen un botón Compartir en Google Classroom y se pueden insertar en una página de clase. Lizard Point suspendió sus cuentas de docente en marzo de 2023.'),
            ('¿Hay juegos para las capitales?',
             'Sí. Seterra y Lizard Point tienen quizzes de capitales en el mapa, Sporcle un US Capitals Quiz para escribir, y Statedoku un juego de emparejar y un quiz para escribir.'),
        ],
        related=[(HUB[L], 'Aprender los 50 estados'), ('/es/learn/capitales-de-estados/', 'Las 50 capitales'),
                 ('/es/learn/state-abbreviations/', 'Las 50 abreviaturas'), (PLAY[L], 'Nuestros 21 juegos gratis'),
                 (SLUGS['daily'][L], 'Juegos diarios de geografía'), ('/learn/printable-us-states-map/', 'Mapa imprimible (EN)')],
        related_h='Guías relacionadas',
        play_h='Pruébalo ahora', play_p='Haz clic en el estado correcto en un mapa en blanco: tres niveles, tres vidas.',
        play_cta=('Jugar a Coloca el Estado', p + 'place-the-state/'), daily_cta=('El puzzle Statedoku de hoy', HOME[L]),
    )


# ─── Article 2: daily geography games ───────────────────────────────────
def daily_article(L):
    if L == 'en':
        return dict(
            title='Best Daily Geography Games Like Wordle (2026)',
            desc='Daily geography games like Wordle, compared: Worldle, Globle, Travle, Flagle, GeoGrid and US-states dailies such as Statele. Rules, tries, cost.',
            h1='The best daily geography games like Wordle',
            sub='One puzzle a day, the same for everyone: what each game asks you to guess, how many tries you get, and what it costs.',
            answer=('<strong>Short answer.</strong> For the world, start with Worldle (a country from its outline, six attempts), Globle (a country found by how warm each guess is on a globe) and Travle (the countries on the shortest route between two). '
                    'For US states, Statele and Travle USA do the same for states. Grid puzzles such as GeoGrid, for countries, and Statedoku, for states, ask for answers that fit two clues at once. The daily round of every game here is free; most show ads.'),
            disclosure=('<strong>A note on bias.</strong> Statedoku publishes this page and is one of the games in it, listed last. '
                        'Rules and prices of the other games were checked on their own sites on October 22, 2026.'),
            table_head=['Game', 'You guess', 'Tries', 'Feedback', 'Scope'],
            table=[
                ['Worldle', 'A country from its silhouette', '6', 'Distance, direction, proximity', 'World'],
                ['Globle', 'A mystery country', 'No limit stated', 'Colors on a globe, warmer when closer', 'World'],
                ['Travle', 'The countries on the shortest route between two', 'Route length plus 4 to 8', 'A rating per guess, 3 hints', 'World, and a USA version'],
                ['Flagle', 'A country from its flag, revealed tile by tile', '6', 'Distance, direction, proximity', 'World'],
                ['Tradle', 'A country from a chart of its exports', '6', 'Distance, direction, proximity', 'World'],
                ['GeoGrid', '9 countries that fit row and column categories', '10', 'Rarer answers score better', 'World'],
                ['Countryle', 'A country from its attributes', 'No limit stated', 'Colors and arrows per attribute', 'World'],
                ['Statele', 'A US state from its outline', '6', 'Distance, proximity', 'US'],
                ['WhereTaken USA', 'The state where a photo was taken', 'Not stated', 'Distance and direction', 'US'],
                ['Statle', 'A state from towns inside it', '6', 'Neighboring states shown in yellow', 'US'],
                ['Statedle', 'A US city from six clues', '10', 'Clues, distance and direction', 'US'],
                ['Statedoku (ours)', '9 states that fit row and column clues', '5 mistakes', 'Each pick checked against both clues', 'US'],
            ],
            sections=[
                ('World geography dailies', [
                    ('Worldle', URL['worldle'], [
                        f'{a("worldle", "Worldle")} shows the silhouette of a country or territory and gives you six attempts. Each wrong guess shows the distance, an arrow toward the answer and a proximity percentage, then bonus rounds ask about neighbors, the capital and the flag. It resets at midnight local time.',
                        'It was created by French developer Antoine Teuf and is now run by Teuteuf Games. The daily game is free with ads; a Premium membership removes ads and opens the archive.']),
                    ('Globle', URL['globle'], [
                        f'In {a("globle", "Globle")} you name any country and it is colored on a globe: the hotter the color, the closer you are, measured between land borders. No guess limit is stated; the aim is as few guesses as possible. It resets at midnight in your time zone.',
                        'Globle is made by Trainwreck Labs. It is free with ads, and the Trainwreck Club, $5 a month in October 2026, removes them.']),
                    ('Travle', URL['travle'], [
                        f'{a("travle", "Travle")} gives two countries and asks for the ones on the shortest land route between them. You get the route length plus 4 to 8 extra guesses, each rated by how useful it was, and three hints. There is a weekly challenge and a {a("travleusa", "USA version")} that works with states.',
                        'It is a Teuteuf game created by Oisín Carroll, free with ads; Premium removes them.']),
                    ('Flagle', URL['flagle'], [
                        f'{a("flagle", "Flagle")} reveals a flag one tile per guess, six guesses in all, with distance and direction after each, then bonus rounds on shape, capital and borders. It is a Teuteuf game, free with ads.']),
                    ('Tradle', URL['tradle'], [
                        f'{a("tradle", "Tradle")}, from the Observatory of Economic Complexity, shows a chart of one country\'s exports. You get six guesses with distance, direction and proximity. It is free, with ads.']),
                    ('GeoGrid', URL['geogrid'], [
                        f'{a("geogrid", "GeoGrid")} is a 3×3 grid: each cell needs a country that fits its row and its column, for example a category about flags crossed with one about population. You get ten guesses, and rarer correct answers score better. It resets at midnight local time, is free with ads, and has been supported by Teuteuf Games since 2024.']),
                    ('Countryle', URL['countryle'], [
                        f'{a("countryle", "Countryle")} asks for a hidden country and answers each guess with its continent, hemisphere, population, area, temperature and direction, each colored and marked with an arrow up or down. No guess limit is stated. It is free with ads.']),
                ]),
                ('US states dailies', [
                    ('Statele', URL['statele'], [
                        f'{a("statele", "Statele")} is the US-states counterpart of Worldle, from Teuteuf Games: guess a state from its outline in six tries, with distance and proximity after each, then bonus rounds on neighbors and the capital. It is free with ads. Note that an iOS app with the same name comes from a different developer.']),
                    ('Travle USA', URL['travleusa'], [
                        f'{a("travleusa", "Travle USA")} uses the Travle rules with states: name the states on the shortest route between two of them.']),
                    ('WhereTaken USA', URL['wheretaken'], [
                        f'{a("wheretaken", "WhereTaken USA")} shows a photograph and asks which state it was taken in, with distance and direction after a wrong guess, then four bonus rounds on facts, a landmark, the capital and a city. It is a Teuteuf game, free with ads.']),
                    ('Statle', URL['statle'], [
                        f'In {a("statle", "Statle")} you see a town and guess its state; each wrong guess brings another town, and a neighboring state lights up yellow. Six tries, same puzzle for everyone each day, free with ads.']),
                    ('Statedle', URL['statedle'], [
                        f'{a("statedle", "Statedle")} is about cities rather than states: guess a mystery US city in ten tries from six clues, such as population, county, land area and interstate access, plus distance and direction.']),
                    ('Mappr Guess the State', URL['mapprdaily'], [
                        f'Mappr\'s {a("mapprdaily", "Guess the State")} gives one mystery state outline a day, the same worldwide, with six guesses and distance, an arrow and a proximity percentage after each. No login is needed.']),
                    ('Statedoku', HOME[L], [
                        f'{own(L, HOME[L], "Statedoku")} is ours. Like GeoGrid, it is a 3×3 grid, but with US states: each cell needs a state that fits both its row clue and its column clue, such as "Borders Mexico" and "Name ends in A". Any state that fits is accepted, not one hidden answer, each grid is checked to have a complete solution, and you get five mistakes. It resets at midnight local time, in English, French or Spanish, with no account and no ads on the game.']),
                ]),
            ],
            method_h='Where to find more daily games',
            method=[
                f'{a("listdle", "Listdle")} is a curated list of daily games like Wordle, with a geography section. Its editor says every game is played and checked before it is added. Statedoku is listed there.',
                f'{a("wordleverse", "Wordleverse")} catalogs more than 2,000 Wordle-like games, with a large geography category.',
            ],
            faq=[
                ('What is the geography version of Wordle?',
                 'Worldle is the closest match: one mystery country a day, six attempts, and after each guess the distance and direction to the answer. It was created by French developer Antoine Teuf.'),
                ('Is there a Wordle for US states?',
                 'Yes, several. Statele asks for a state from its outline, Travle USA for the states on a route, WhereTaken USA for the state where a photo was taken, Statle for a state from its towns, and Statedoku for nine states that fit a grid of clues.'),
                ('Are daily geography games free?',
                 'The daily round of every game on this page is free. Most show ads, and paid plans remove them or open the archive, for example Teuteuf Premium for Worldle, Travle, Flagle, GeoGrid and Statele, or the Trainwreck Club for Globle.'),
                ('When does a new puzzle come out?',
                 'Worldle, Globle and GeoGrid reset at midnight on your device\'s local time, and so does Statedoku. Everyone playing on the same date gets the same puzzle.'),
                ('Where can I find more games like these?',
                 'Listdle and Wordleverse both catalog daily games like Wordle and have geography sections.'),
            ],
            related=[(HOME[L], "Today's Statedoku puzzle"), (SLUGS['learn'][L], 'Best games to learn the 50 states'),
                     (PLAY[L], 'Our 21 free games'), ('/how-to-play/', 'How to play Statedoku'),
                     ('/archive/', 'Past Statedoku puzzles'), (HUB[L], 'How to learn the 50 states')],
            related_h='Related',
            play_h='Play today', play_p='Fill a 3×3 grid with US states that fit both clues. Five mistakes, one grid a day for everyone.',
            play_cta=("Play today's Statedoku", HOME[L]), daily_cta=('All 21 games', PLAY[L]),
        )
    if L == 'fr':
        return dict(
            title='Meilleurs jeux de géographie quotidiens type Wordle',
            desc='Jeux de géographie quotidiens type Wordle, comparés : Worldle, Globle, Travle, Flagle, GeoGrid et jeux des États comme Statele. Règles, essais, prix.',
            h1='Les meilleurs jeux de géographie quotidiens, façon Wordle',
            sub='Un puzzle par jour, le même pour tous : ce que chaque jeu fait deviner, combien d\'essais il donne, et ce qu\'il coûte.',
            answer=('<strong>En bref.</strong> Pour le monde, commencez par Worldle (un pays d\'après sa silhouette, six essais), Globle (un pays trouvé selon la couleur de chaque essai sur un globe) et Travle (les pays sur le plus court chemin entre deux). '
                    'Pour les États américains, Statele et Travle USA font la même chose avec les États. Les grilles comme GeoGrid, pour les pays, et Statedoku, pour les États, demandent des réponses qui respectent deux indices à la fois. La partie du jour de chaque jeu est gratuite ; la plupart affichent de la publicité.'),
            disclosure=('<strong>Transparence.</strong> Statedoku publie cette page et fait partie des jeux présentés, en dernier. '
                        'Les règles et les prix des autres jeux ont été vérifiés sur leurs propres sites le 22 octobre 2026.'),
            table_head=['Jeu', 'À deviner', 'Essais', 'Indications', 'Portée'],
            table=[
                ['Worldle', 'Un pays d\'après sa silhouette', '6', 'Distance, direction, proximité', 'Monde'],
                ['Globle', 'Un pays mystère', 'Pas de limite indiquée', 'Couleurs sur un globe, plus chaudes si proche', 'Monde'],
                ['Travle', 'Les pays du plus court chemin entre deux', 'Longueur du trajet plus 4 à 8', 'Une note par essai, 3 indices', 'Monde, et une version USA'],
                ['Flagle', 'Un pays d\'après son drapeau, dévoilé case par case', '6', 'Distance, direction, proximité', 'Monde'],
                ['Tradle', 'Un pays d\'après le graphique de ses exportations', '6', 'Distance, direction, proximité', 'Monde'],
                ['GeoGrid', '9 pays qui respectent catégories de ligne et de colonne', '10', 'Les réponses rares rapportent plus', 'Monde'],
                ['Countryle', 'Un pays d\'après ses caractéristiques', 'Pas de limite indiquée', 'Couleurs et flèches par critère', 'Monde'],
                ['Statele', 'Un État américain d\'après sa silhouette', '6', 'Distance, proximité', 'États-Unis'],
                ['WhereTaken USA', 'L\'État où une photo a été prise', 'Non indiqué', 'Distance et direction', 'États-Unis'],
                ['Statle', 'Un État d\'après des villes qu\'il contient', '6', 'États voisins en jaune', 'États-Unis'],
                ['Statedle', 'Une ville américaine d\'après six indices', '10', 'Indices, distance et direction', 'États-Unis'],
                ['Statedoku (le nôtre)', '9 États qui respectent indices de ligne et de colonne', '5 erreurs', 'Chaque choix vérifié sur les deux indices', 'États-Unis'],
            ],
            sections=[
                ('Jeux quotidiens sur le monde', [
                    ('Worldle', URL['worldle'], [
                        f'{a("worldle", "Worldle")} montre la silhouette d\'un pays ou d\'un territoire et donne six essais. Chaque mauvaise réponse affiche la distance, une flèche vers la solution et un pourcentage de proximité, puis des manches bonus portent sur les voisins, la capitale et le drapeau. Nouvelle partie à minuit, heure locale.',
                        'Il a été créé par le développeur français Antoine Teuf et il est aujourd\'hui édité par Teuteuf Games. La partie du jour est gratuite avec publicité ; un abonnement Premium la retire et ouvre les archives.']),
                    ('Globle', URL['globle'], [
                        f'Dans {a("globle", "Globle")}, on propose n\'importe quel pays et il se colore sur un globe : plus la couleur est chaude, plus on est proche, la distance étant mesurée entre frontières terrestres. Aucune limite d\'essais n\'est indiquée ; le but est d\'en faire le moins possible. Nouvelle partie à minuit dans votre fuseau horaire.',
                        'Globle est édité par Trainwreck Labs. Il est gratuit avec publicité, et le Trainwreck Club, à 5 $ par mois en octobre 2026, la retire.']),
                    ('Travle', URL['travle'], [
                        f'{a("travle", "Travle")} donne deux pays et demande ceux qui se trouvent sur le plus court trajet terrestre entre eux. On dispose de la longueur du trajet plus 4 à 8 essais, chacun noté selon son utilité, et de trois indices. Il existe un défi hebdomadaire et une {a("travleusa", "version USA")} avec les États.',
                        'C\'est un jeu Teuteuf créé par Oisín Carroll, gratuit avec publicité ; Premium la retire.']),
                    ('Flagle', URL['flagle'], [
                        f'{a("flagle", "Flagle")} dévoile un drapeau case par case, six essais en tout, avec distance et direction après chacun, puis des manches bonus sur la forme, la capitale et les frontières. C\'est un jeu Teuteuf, gratuit avec publicité.']),
                    ('Tradle', URL['tradle'], [
                        f'{a("tradle", "Tradle")}, de l\'Observatory of Economic Complexity, montre le graphique des exportations d\'un pays. Six essais, avec distance, direction et proximité. Gratuit, avec publicité.']),
                    ('GeoGrid', URL['geogrid'], [
                        f'{a("geogrid", "GeoGrid")} est une grille 3×3 : chaque case attend un pays qui respecte sa ligne et sa colonne, par exemple une catégorie sur les drapeaux croisée avec une autre sur la population. Dix essais, et les bonnes réponses rares rapportent plus. Nouvelle grille à minuit, heure locale, gratuite avec publicité, soutenue par Teuteuf Games depuis 2024.']),
                    ('Countryle', URL['countryle'], [
                        f'{a("countryle", "Countryle")} fait deviner un pays caché et répond à chaque essai par son continent, son hémisphère, sa population, sa superficie, sa température et sa direction, chaque critère coloré et accompagné d\'une flèche vers le haut ou le bas. Aucune limite d\'essais n\'est indiquée. Gratuit avec publicité.']),
                ]),
                ('Jeux quotidiens sur les États américains', [
                    ('Statele', URL['statele'], [
                        f'{a("statele", "Statele")} est l\'équivalent de Worldle pour les États américains, chez Teuteuf Games : deviner un État d\'après sa silhouette en six essais, avec distance et proximité après chacun, puis des manches bonus sur les voisins et la capitale. Gratuit avec publicité. Attention, une appli iOS du même nom vient d\'un autre développeur.']),
                    ('Travle USA', URL['travleusa'], [
                        f'{a("travleusa", "Travle USA")} reprend les règles de Travle avec les États : nommer les États sur le plus court trajet entre deux d\'entre eux.']),
                    ('WhereTaken USA', URL['wheretaken'], [
                        f'{a("wheretaken", "WhereTaken USA")} montre une photo et demande dans quel État elle a été prise, avec distance et direction après une erreur, puis quatre manches bonus sur des anecdotes, un monument, la capitale et une ville. Jeu Teuteuf, gratuit avec publicité.']),
                    ('Statle', URL['statle'], [
                        f'Dans {a("statle", "Statle")}, on voit une ville et on devine son État ; chaque erreur révèle une autre ville, et un État voisin s\'affiche en jaune. Six essais, la même partie pour tous chaque jour, gratuit avec publicité.']),
                    ('Statedle', URL['statedle'], [
                        f'{a("statedle", "Statedle")} porte sur les villes plutôt que les États : deviner une ville américaine mystère en dix essais à partir de six indices, comme la population, le comté, la superficie et l\'accès autoroutier, plus distance et direction.']),
                    ('Mappr Guess the State', URL['mapprdaily'], [
                        f'Le {a("mapprdaily", "Guess the State")} de Mappr propose une silhouette d\'État mystère par jour, la même dans le monde entier, avec six essais et, après chacun, distance, flèche et pourcentage de proximité. Pas de connexion nécessaire.']),
                    ('Statedoku', HOME[L], [
                        f'{own(L, HOME[L], "Statedoku")} est le nôtre. Comme GeoGrid, c\'est une grille 3×3, mais avec les États américains : chaque case attend un État qui respecte à la fois l\'indice de sa ligne et celui de sa colonne, par exemple « Frontière Mexique » et « Nom finissant par A ». Tout État qui convient est accepté, pas une seule réponse cachée, chaque grille est vérifiée pour avoir une solution complète, et on a droit à cinq erreurs. Nouvelle grille à minuit heure locale, en français, anglais ou espagnol, sans compte et sans publicité sur le jeu.']),
                ]),
            ],
            method_h='Où trouver d\'autres jeux quotidiens',
            method=[
                f'{a("listdle", "Listdle")} est une liste sélectionnée de jeux quotidiens type Wordle, avec une rubrique géographie. Son auteur indique tester chaque jeu avant de l\'ajouter. Statedoku y figure.',
                f'{a("wordleverse", "Wordleverse")} recense plus de 2 000 jeux type Wordle, avec une large catégorie géographie.',
            ],
            faq=[
                ('Quel est le Wordle de la géographie ?',
                 'Worldle est le plus proche : un pays mystère par jour, six essais, et après chaque essai la distance et la direction de la solution. Il a été créé par le développeur français Antoine Teuf.'),
                ('Existe-t-il un Wordle des États américains ?',
                 'Oui, plusieurs. Statele fait deviner un État d\'après sa silhouette, Travle USA les États d\'un trajet, WhereTaken USA l\'État d\'une photo, Statle un État d\'après ses villes, et Statedoku neuf États qui respectent une grille d\'indices.'),
                ('Les jeux de géographie quotidiens sont-ils gratuits ?',
                 'La partie du jour de chaque jeu de cette page est gratuite. La plupart affichent de la publicité, et des abonnements la retirent ou ouvrent les archives, par exemple Teuteuf Premium pour Worldle, Travle, Flagle, GeoGrid et Statele, ou le Trainwreck Club pour Globle.'),
                ('À quelle heure sort le nouveau puzzle ?',
                 'Worldle, Globle et GeoGrid changent à minuit, heure locale de votre appareil, comme Statedoku. Tous ceux qui jouent à la même date ont le même puzzle.'),
                ('Où trouver d\'autres jeux de ce genre ?',
                 'Listdle et Wordleverse recensent tous deux des jeux quotidiens type Wordle et ont une rubrique géographie.'),
            ],
            related=[(HOME[L], 'Le puzzle Statedoku du jour'), (SLUGS['learn'][L], 'Meilleurs jeux pour apprendre les États'),
                     (PLAY[L], 'Nos 21 jeux gratuits'), ('/fr/archive/', 'Les puzzles passés'),
                     (HUB[L], 'Apprendre les 50 États'), ('/fr/learn/states-and-capitals/', 'Les États et leurs capitales')],
            related_h='À voir aussi',
            play_h='Jouez aujourd\'hui', play_p='Remplissez une grille 3×3 d\'États qui respectent les deux indices. Cinq erreurs, une grille par jour pour tous.',
            play_cta=('Jouer au Statedoku du jour', HOME[L]), daily_cta=('Les 21 jeux', PLAY[L]),
        )
    return dict(
        title='Mejores juegos diarios de geografía tipo Wordle',
        desc='Juegos diarios de geografía tipo Wordle, comparados: Worldle, Globle, Travle, Flagle, GeoGrid y juegos de estados como Statele. Reglas, intentos, precio.',
        h1='Los mejores juegos diarios de geografía al estilo Wordle',
        sub='Un puzzle al día, el mismo para todos: qué hace adivinar cada juego, cuántos intentos da y cuánto cuesta.',
        answer=('<strong>En resumen.</strong> Para el mundo, empieza por Worldle (un país por su silueta, seis intentos), Globle (un país que se encuentra por el color de cada intento en un globo) y Travle (los países en la ruta más corta entre dos). '
                'Para los estados de EE.UU., Statele y Travle USA hacen lo mismo con los estados. Las cuadrículas como GeoGrid, para países, y Statedoku, para estados, piden respuestas que cumplan dos pistas a la vez. La partida del día de cada juego es gratis; la mayoría muestra anuncios.'),
        disclosure=('<strong>Transparencia.</strong> Statedoku publica esta página y es uno de los juegos que aparecen, al final. '
                    'Las reglas y los precios de los otros juegos se comprobaron en sus propios sitios el 22 de octubre de 2026.'),
        table_head=['Juego', 'Qué adivinas', 'Intentos', 'Pistas', 'Alcance'],
        table=[
            ['Worldle', 'Un país por su silueta', '6', 'Distancia, dirección, proximidad', 'Mundo'],
            ['Globle', 'Un país misterioso', 'Sin límite indicado', 'Colores en un globo, más cálidos al acercarse', 'Mundo'],
            ['Travle', 'Los países de la ruta más corta entre dos', 'Largo de la ruta más 4 a 8', 'Una nota por intento, 3 pistas', 'Mundo, y una versión USA'],
            ['Flagle', 'Un país por su bandera, revelada por casillas', '6', 'Distancia, dirección, proximidad', 'Mundo'],
            ['Tradle', 'Un país por el gráfico de sus exportaciones', '6', 'Distancia, dirección, proximidad', 'Mundo'],
            ['GeoGrid', '9 países que cumplan categorías de fila y columna', '10', 'Las respuestas raras puntúan mejor', 'Mundo'],
            ['Countryle', 'Un país por sus características', 'Sin límite indicado', 'Colores y flechas por dato', 'Mundo'],
            ['Statele', 'Un estado de EE.UU. por su silueta', '6', 'Distancia, proximidad', 'EE.UU.'],
            ['WhereTaken USA', 'El estado donde se tomó una foto', 'No indicado', 'Distancia y dirección', 'EE.UU.'],
            ['Statle', 'Un estado por pueblos que contiene', '6', 'Estados vecinos en amarillo', 'EE.UU.'],
            ['Statedle', 'Una ciudad de EE.UU. por seis pistas', '10', 'Pistas, distancia y dirección', 'EE.UU.'],
            ['Statedoku (el nuestro)', '9 estados que cumplan pistas de fila y columna', '5 errores', 'Cada elección se comprueba con las dos pistas', 'EE.UU.'],
        ],
        sections=[
            ('Juegos diarios sobre el mundo', [
                ('Worldle', URL['worldle'], [
                    f'{a("worldle", "Worldle")} muestra la silueta de un país o territorio y da seis intentos. Cada fallo indica la distancia, una flecha hacia la respuesta y un porcentaje de proximidad, y luego llegan rondas extra sobre los vecinos, la capital y la bandera. Nueva partida a medianoche, hora local.',
                    'Lo creó el desarrollador francés Antoine Teuf y hoy lo publica Teuteuf Games. La partida del día es gratis con anuncios; una suscripción Premium los quita y abre el archivo.']),
                ('Globle', URL['globle'], [
                    f'En {a("globle", "Globle")} propones cualquier país y se colorea en un globo: cuanto más cálido el color, más cerca estás, con la distancia medida entre fronteras terrestres. No se indica límite de intentos; el objetivo es usar los menos posibles. Nueva partida a medianoche en tu zona horaria.',
                    'Globle lo hace Trainwreck Labs. Es gratis con anuncios, y el Trainwreck Club, 5 $ al mes en octubre de 2026, los quita.']),
                ('Travle', URL['travle'], [
                    f'{a("travle", "Travle")} da dos países y pide los que están en la ruta terrestre más corta entre ellos. Tienes el largo de la ruta más 4 a 8 intentos, cada uno valorado según su utilidad, y tres pistas. Hay un reto semanal y una {a("travleusa", "versión USA")} con estados.',
                    'Es un juego de Teuteuf creado por Oisín Carroll, gratis con anuncios; Premium los quita.']),
                ('Flagle', URL['flagle'], [
                    f'{a("flagle", "Flagle")} revela una bandera casilla a casilla, seis intentos en total, con distancia y dirección tras cada uno, y luego rondas extra sobre la forma, la capital y las fronteras. Es un juego de Teuteuf, gratis con anuncios.']),
                ('Tradle', URL['tradle'], [
                    f'{a("tradle", "Tradle")}, del Observatory of Economic Complexity, muestra el gráfico de las exportaciones de un país. Seis intentos, con distancia, dirección y proximidad. Gratis, con anuncios.']),
                ('GeoGrid', URL['geogrid'], [
                    f'{a("geogrid", "GeoGrid")} es una cuadrícula 3×3: cada casilla pide un país que cumpla su fila y su columna, por ejemplo una categoría sobre banderas cruzada con otra sobre población. Diez intentos, y las respuestas correctas raras puntúan mejor. Nueva cuadrícula a medianoche, hora local, gratis con anuncios, con el apoyo de Teuteuf Games desde 2024.']),
                ('Countryle', URL['countryle'], [
                    f'{a("countryle", "Countryle")} hace adivinar un país oculto y responde a cada intento con su continente, hemisferio, población, superficie, temperatura y dirección, cada dato coloreado y con una flecha hacia arriba o hacia abajo. No se indica límite de intentos. Gratis con anuncios.']),
            ]),
            ('Juegos diarios sobre los estados de EE.UU.', [
                ('Statele', URL['statele'], [
                    f'{a("statele", "Statele")} es el equivalente de Worldle para los estados de EE.UU., de Teuteuf Games: adivinar un estado por su silueta en seis intentos, con distancia y proximidad tras cada uno, y luego rondas extra sobre los vecinos y la capital. Gratis con anuncios. Ojo: una app de iOS con el mismo nombre es de otro desarrollador.']),
                ('Travle USA', URL['travleusa'], [
                    f'{a("travleusa", "Travle USA")} usa las reglas de Travle con estados: nombrar los estados en la ruta más corta entre dos de ellos.']),
                ('WhereTaken USA', URL['wheretaken'], [
                    f'{a("wheretaken", "WhereTaken USA")} muestra una foto y pregunta en qué estado se tomó, con distancia y dirección tras un fallo, y luego cuatro rondas extra sobre datos, un monumento, la capital y una ciudad. Juego de Teuteuf, gratis con anuncios.']),
                ('Statle', URL['statle'], [
                    f'En {a("statle", "Statle")} ves un pueblo y adivinas su estado; cada fallo muestra otro pueblo, y un estado vecino se ilumina en amarillo. Seis intentos, la misma partida para todos cada día, gratis con anuncios.']),
                ('Statedle', URL['statedle'], [
                    f'{a("statedle", "Statedle")} trata de ciudades, no de estados: adivinar una ciudad misteriosa de EE.UU. en diez intentos a partir de seis pistas, como la población, el condado, la superficie y el acceso a autopistas, más distancia y dirección.']),
                ('Mappr Guess the State', URL['mapprdaily'], [
                    f'El {a("mapprdaily", "Guess the State")} de Mappr propone una silueta de estado misteriosa al día, la misma en todo el mundo, con seis intentos y, tras cada uno, distancia, flecha y porcentaje de proximidad. No hace falta iniciar sesión.']),
                ('Statedoku', HOME[L], [
                    f'{own(L, HOME[L], "Statedoku")} es el nuestro. Como GeoGrid, es una cuadrícula 3×3, pero con estados de EE.UU.: cada casilla pide un estado que cumpla a la vez la pista de su fila y la de su columna, por ejemplo «Frontera con México» y «Nombre termina en A». Se acepta cualquier estado que encaje, no una sola respuesta oculta, cada cuadrícula se comprueba para que tenga solución completa, y se permiten cinco errores. Nueva cuadrícula a medianoche hora local, en español, inglés o francés, sin cuenta y sin anuncios en el juego.']),
            ]),
        ],
        method_h='Dónde encontrar más juegos diarios',
        method=[
            f'{a("listdle", "Listdle")} es una lista seleccionada de juegos diarios tipo Wordle, con una sección de geografía. Su autor dice que prueba cada juego antes de añadirlo. Statedoku aparece en ella.',
            f'{a("wordleverse", "Wordleverse")} reúne más de 2.000 juegos tipo Wordle, con una amplia categoría de geografía.',
        ],
        faq=[
            ('¿Cuál es el Wordle de la geografía?',
             'Worldle es el más parecido: un país misterioso al día, seis intentos y, tras cada intento, la distancia y la dirección hasta la respuesta. Lo creó el desarrollador francés Antoine Teuf.'),
            ('¿Hay un Wordle de los estados de EE.UU.?',
             'Sí, varios. Statele pide un estado por su silueta, Travle USA los estados de una ruta, WhereTaken USA el estado de una foto, Statle un estado por sus pueblos, y Statedoku nueve estados que cumplan una cuadrícula de pistas.'),
            ('¿Los juegos diarios de geografía son gratis?',
             'La partida del día de cada juego de esta página es gratis. La mayoría muestra anuncios, y los planes de pago los quitan o abren el archivo, por ejemplo Teuteuf Premium para Worldle, Travle, Flagle, GeoGrid y Statele, o el Trainwreck Club para Globle.'),
            ('¿A qué hora sale el nuevo puzzle?',
             'Worldle, Globle y GeoGrid cambian a medianoche, hora local de tu dispositivo, igual que Statedoku. Todos los que juegan en la misma fecha reciben el mismo puzzle.'),
            ('¿Dónde encuentro más juegos así?',
             'Listdle y Wordleverse reúnen juegos diarios tipo Wordle y tienen secciones de geografía.'),
        ],
        related=[(HOME[L], 'El puzzle Statedoku de hoy'), (SLUGS['learn'][L], 'Mejores juegos para aprender los estados'),
                 (PLAY[L], 'Nuestros 21 juegos gratis'), ('/es/archive/', 'Puzzles anteriores'),
                 (HUB[L], 'Aprender los 50 estados'), ('/es/learn/capitales-de-estados/', 'Las 50 capitales')],
        related_h='Ver también',
        play_h='Juega hoy', play_p='Rellena una cuadrícula 3×3 con estados que cumplan las dos pistas. Cinco errores, una cuadrícula al día para todos.',
        play_cta=('Jugar al Statedoku de hoy', HOME[L]), daily_cta=('Los 21 juegos', PLAY[L]),
    )


# ─── Rendering ───────────────────────────────────────────────────────────
def strip(s):
    return html.unescape(re.sub(r'<[^>]+>', '', s))


def ref_parts(L):
    s = (ROOT / REF[L]).read_text(encoding='utf-8')
    head_scripts = s[s.index('<head>') + len('<head>'):s.index('<meta charset')]
    style = re.search(r'<style>.*?</style>', s, re.S).group(0)
    header = s[s.index('<header>'):s.index('</header>') + len('</header>')]
    footer = s[s.index('<footer>'):s.index('</footer>') + len('</footer>')]
    return head_scripts, style, header, footer


def render(kind, L, d):
    head_scripts, style, header, footer = ref_parts(L)
    path = SLUGS[kind][L]
    url = BASE + path
    img = f'{BASE}/og/og-play-hub-{L}.jpg'
    alts = ''.join(f'  <link rel="alternate" hreflang="{l}" href="{BASE}{SLUGS[kind][l]}">\n' for l in ('en', 'fr', 'es'))
    alts += f'  <link rel="alternate" hreflang="x-default" href="{BASE}{SLUGS[kind]["en"]}">\n'
    home_l, learn_l = CRUMB[L]
    crumb_name = re.sub(r'\s*\(2026\)$', '', d['title'])
    items = [e for _, entries in d['sections'] for e in entries]
    ld = [
        {'@context': 'https://schema.org', '@type': 'BreadcrumbList', 'itemListElement': [
            {'@type': 'ListItem', 'position': 1, 'name': home_l, 'item': BASE + HOME[L]},
            {'@type': 'ListItem', 'position': 2, 'name': learn_l, 'item': BASE + HUB[L]},
            {'@type': 'ListItem', 'position': 3, 'name': crumb_name, 'item': url}]},
        {'@context': 'https://schema.org', '@type': 'Article', 'headline': d['h1'], 'description': d['desc'],
         'inLanguage': L, 'image': img, 'datePublished': PUBLISHED, 'dateModified': PUBLISHED,
         'author': {'@type': 'Person', 'name': 'Moses Tounby', 'url': f'{BASE}/about/'},
         'publisher': {'@type': 'Organization', 'name': 'Statedoku', 'url': f'{BASE}/',
                       'logo': {'@type': 'ImageObject', 'url': f'{BASE}/apple-touch-icon.png'}},
         'mainEntityOfPage': url},
        {'@context': 'https://schema.org', '@type': 'ItemList', 'name': d['h1'], 'numberOfItems': len(items),
         'itemListElement': [{'@type': 'ListItem', 'position': i + 1, 'name': n,
                              'url': (u if u.startswith('http') else BASE + u)} for i, (n, u, _) in enumerate(items)]},
        {'@context': 'https://schema.org', '@type': 'FAQPage', 'mainEntity': [
            {'@type': 'Question', 'name': q, 'acceptedAnswer': {'@type': 'Answer', 'text': strip(ans)}} for q, ans in d['faq']]},
    ]
    ld_html = ''.join('  <script type="application/ld+json">' + json.dumps(o, ensure_ascii=False).replace('</', '<\\/') + '</script>\n' for o in ld)
    th = ''.join(f'<th>{c}</th>' for c in d['table_head'])
    tr = ''.join('<tr>' + ''.join(f'<td>{c}</td>' for c in row) + '</tr>\n' for row in d['table'])
    secs = ''
    for h2, entries in d['sections']:
        secs += f'    <h2>{h2}</h2>\n'
        for name, _u, paras in entries:
            secs += f'    <h3>{name}</h3>\n' + ''.join(f'    <p>{p}</p>\n' for p in paras)
    method = ''.join(f'      <li>{m}</li>\n' for m in d['method'])
    faq = ''.join(f'    <details><summary><strong>{q}</strong></summary><p>{ans}</p></details>\n' for q, ans in d['faq'])
    rel = ''.join(f'      <a href="{u}">→ {t}</a>\n' for u, t in d['related'])
    faq_h = {'en': 'Frequently asked questions', 'fr': 'Questions fréquentes', 'es': 'Preguntas frecuentes'}[L]
    ext = '<script src="/config.js?v=11"></script>\n<script src="/js/admin.js"></script>\n<script src="/js/ads.js?v=1"></script>\n'
    page = f'''<!DOCTYPE html>
<html lang="{L}">
<head>{head_scripts}<meta charset="UTF-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0, viewport-fit=cover">
  <meta name="theme-color" content="#0F2147">
  <meta name="color-scheme" content="light">
  <title>{html.escape(d['title'], quote=False)} | Statedoku</title>
  <meta name="description" content="{html.escape(d['desc'])}">
  <meta name="robots" content="index, follow, max-image-preview:large">
  <link rel="canonical" href="{url}">
{alts}  <link rel="icon" type="image/svg+xml" href="/favicon.svg?v=5">
  <link rel="stylesheet" href="/css/style.css?v=31">
  <meta property="og:type" content="article">
  <meta property="og:title" content="{html.escape(d['title'])}">
  <meta property="og:description" content="{html.escape(d['desc'])}">
  <meta property="og:url" content="{url}">
  <meta property="og:image" content="{img}">
  <meta property="og:image:type" content="image/jpeg">
  <meta property="og:image:width" content="1200">
  <meta property="og:image:height" content="630">
  <meta name="twitter:card" content="summary_large_image">
  <meta name="twitter:title" content="{html.escape(d['title'])}">
  <meta name="twitter:description" content="{html.escape(d['desc'])}">
  <meta name="twitter:image" content="{img}">

  {style}
  <style>
    .quick-answer {{ background:#F8FAFC; border-left:4px solid #F59E0B; padding:16px 20px; border-radius:0 10px 10px 0; margin:0 0 18px; }}
    .quick-answer p {{ margin:0; font-size:1.02rem; }}
    .disclosure {{ font-size:.9rem; color:var(--text-2); margin:0 0 18px; }}
    .tbl-wrap {{ overflow-x:auto; margin:12px 0 22px; }}
    .tbl-wrap table.tbl {{ margin:0; min-width:560px; }}
    .hp-main h3 a, .hp-main p a {{ color:var(--navy); font-weight:600; }}
  </style>
{ld_html}</head>
<body class="legal-body">

{header}<main>
  <section class="hp-hero">
    <p class="crumb"><a href="{HOME[L]}">{home_l}</a> · <a href="{HUB[L]}">{learn_l}</a> · {crumb_name}</p>
    <h1>{d['h1']}</h1>
    <p class="meta">{d['sub']}</p>
  </section>
  <div class="hp-main">
    <section class="quick-answer"><p>{d['answer']}</p></section>
    <p class="disclosure">{d['disclosure']}</p>

    <section class="game-play" aria-label="{strip(d['play_h'])}" style="border:2px solid #0F2147;border-radius:12px;padding:16px 20px;margin:18px 0 22px;background:#fff;">
      <p style="margin:0 0 4px;font-weight:800;color:#0F2147;font-size:1.05rem;">{d['play_h']}</p>
      <p style="margin:0 0 10px;color:var(--text-2);font-size:.95rem;">{d['play_p']}</p>
      <div style="display:flex;flex-wrap:wrap;gap:10px;">
        <a href="{d['play_cta'][1]}" style="display:inline-block;background:#F59E0B;color:#0F2147;padding:9px 18px;border-radius:999px;font-weight:800;text-decoration:none;font-size:.92rem;">{d['play_cta'][0]} →</a>
        <a href="{d['daily_cta'][1]}" style="display:inline-block;border:2px solid #0F2147;color:#0F2147;padding:7px 16px;border-radius:999px;font-weight:700;text-decoration:none;font-size:.92rem;">{d['daily_cta'][0]}</a>
      </div>
    </section>

    <div class="tbl-wrap"><table class="tbl">
      <thead><tr>{th}</tr></thead>
      <tbody>
{tr}      </tbody>
    </table></div>
    <div class="ad-slot" data-ad-slot="PLACEHOLDER_LEARN_MID" data-ad-format="auto"></div>

{secs}
    <h2>{d['method_h']}</h2>
    <ul>
{method}    </ul>

    <h2>{faq_h}</h2>
{faq}
    <p class="disclosure">{UPDATED[L]}</p>

    <h2>{d['related_h']}</h2>
    <div class="related-grid">
{rel}    </div>
  </div>
  <div class="ad-slot ad-slot-inline" data-ad-slot="PLACEHOLDER_LEARN_BOTTOM" data-ad-format="auto"></div>
</main>{footer}
{ext}</body>
</html>
'''
    return path, page


def page_status(path):
    f = ROOT / ('index.html' if path == '/' else path.strip('/') + '/index.html')
    if not f.is_file():
        return 'missing'
    head = f.read_text(encoding='utf-8').split('</head>')[0]
    return 'noindex' if re.search(r'<meta name="robots" content="[^"]*noindex', head) else 'ok'


def main():
    built = {}
    for kind, fn in (('learn', learn_article), ('daily', daily_article)):
        for L in ('en', 'fr', 'es'):
            d = fn(L)
            if len(d['title']) > 65:
                sys.exit(f'{kind}/{L}: title is {len(d["title"])} characters')
            if not 70 <= len(d['desc']) <= 160:
                sys.exit(f'{kind}/{L}: description is {len(d["desc"])} characters')
            path, page = render(kind, L, d)
            bad = DASHES.findall(re.sub(r'<style>.*?</style>', '', page, flags=re.S))
            if bad:
                sys.exit(f'{path}: {len(bad)} unicode dash(es)')
            built[path] = page
    # Internal links must reach an existing, indexable page (the new ones count).
    problems, checked = [], 0
    for path, page in built.items():
        for href in re.findall(r'href="(/[^"#]*)"', page):
            if href.startswith(('/css/', '/js/', '/og/', '/favicon')):
                continue
            checked += 1
            if href in built:
                continue
            st = page_status(href)
            if st != 'ok':
                problems.append(f'{path} -> {href} ({st})')
    if problems:
        sys.exit('internal links failing:\n  ' + '\n  '.join(problems))
    for path, page in built.items():
        f = ROOT / path.strip('/') / 'index.html'
        f.parent.mkdir(parents=True, exist_ok=True)
        old = f.read_text(encoding='utf-8') if f.exists() else None
        # Keep the dates stamp-page-dates.py writes, so a rebuild is not a change.
        if old:
            for rx in (r'\n  <script type="application/ld\+json" data-page-dates>.*?</script>',
                       r'\n  <p class="page-updated">.*?</p>'):
                m = re.search(rx, old, re.S)
                if m and m.group(0) not in page:
                    anchor = '\n</head>' if 'data-page-dates' in rx else '\n</main>'
                    page = page.replace(anchor, m.group(0) + anchor, 1)
        if page != old:
            f.write_text(page, encoding='utf-8')
        print(f'{path}: {len(strip(page.split("<main>")[1].split("</main>")[0]).split())} words')
    print(f'{len(built)} pages, {checked} internal links checked')


if __name__ == '__main__':
    main()
