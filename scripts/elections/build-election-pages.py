#!/usr/bin/env python3
"""Builds the presidential election map page in English, French and Spanish
from data/elections/president.json (build-election-data.py):

  learn/presidential-election-maps/
  fr/learn/cartes-elections-presidentielles/
  es/learn/mapas-elecciones-presidenciales/

The interactive map is js/election-map.js. Every number in the prose is
computed from the data here and asserted, so a rebuild after the 2028 election
cannot leave a stale figure. Header and footer are taken from the 2026
midterms page of the same language, so the chrome matches the site.

    python3 scripts/elections/build-election-pages.py
"""
import html, json, re
from pathlib import Path

ROOT = Path(__file__).resolve().parents[2]
BASE = 'https://statedoku.com'
D = json.load(open(ROOT / 'data/elections/president.json', encoding='utf-8'))['years']
YS = sorted(D, key=int)
PATHS = {'en': '/learn/presidential-election-maps/', 'fr': '/fr/learn/cartes-elections-presidentielles/', 'es': '/es/learn/mapas-elecciones-presidenciales/'}
CHROME = {'en': 'learn/2026-midterm-elections/index.html', 'fr': 'fr/learn/elections-mi-mandat-2026/index.html', 'es': 'es/learn/elecciones-intermedias-2026/index.html'}
NAMES = {s['id']: s['names'] for s in json.load(open(ROOT / 'data/states.json', encoding='utf-8'))}
NAMES['DC'] = {'en': 'District of Columbia', 'fr': 'district de Columbia', 'es': 'Distrito de Columbia'}
esc = html.escape


def win(y, c):
    st = D[y]['states'].get(c)
    if not st: return None
    w = max(st['ev'], key=st['ev'].get)
    return next(x['party'] for x in D[y]['candidates'] if x['name'] == w)


codes = sorted({c for y in YS for c in D[y]['states']})
R76 = [y for y in YS if int(y) >= 1976]
R00 = [y for y in YS if int(y) >= 2000]
same76 = {c: win(R76[0], c) for c in codes if len({win(y, c) for y in R76}) == 1}
same00 = {c: win(R00[0], c) for c in codes if len({win(y, c) for y in R00}) == 1}
dc_first = next(y for y in YS if 'DC' in D[y]['states'])
assert {win(y, 'DC') for y in YS if 'DC' in D[y]['states']} == {'Democratic'}
nat = {y: D[y]['candidates'][0]['party'] for y in R76}
bell = sorted(((sum(win(y, c) == nat[y] for y in R76), c) for c in codes if c != 'DC'), reverse=True)
flips = [c for c in codes if win(R00[-2], c) != win(R00[-1], c)]
last = YS[-1]
assert (len(YS), YS[0], last) == (56, '1804', '2024')
assert bell[0] == (12, 'OH') and bell[1][0] < 12, bell[:3]
assert same76.get('MN') == 'Democratic'
F = {'n': len(YS), 'n76': len(R76), 'same76': len(same76), 'same76_d': sorted(c for c, p in same76.items() if p == 'Democratic'),
     'same00': len(same00), 'flips': flips, 'last': last, 'prev': R00[-2], 'dc': dc_first}


def names(lang, cs):
    n = [NAMES[c][lang] for c in cs]
    j = {'en': ' and ', 'fr': ' et ', 'es': ' y '}[lang]
    return n[0] if len(n) == 1 else ', '.join(n[:-1]) + j + n[-1]


PARTY = {'fr': {'Democratic': 'démocrate', 'Republican': 'républicain', 'Whig': 'whig', 'Federalist': 'fédéraliste', 'Democratic-Republican': 'démocrate-républicain', 'National Republican': 'national-républicain'},
         'es': {'Democratic': 'demócrata', 'Republican': 'republicano', 'Whig': 'whig', 'Federalist': 'federalista', 'Democratic-Republican': 'demócrata-republicano', 'National Republican': 'nacional republicano'}}


def party(lang, p):
    return (PARTY.get(lang, {}).get(p) or p or '').strip()


def table(lang):
    h = {'en': ('Year', 'Most electoral votes', 'Runner-up'), 'fr': ('Année', 'Le plus de grands électeurs', 'Deuxième'), 'es': ('Año', 'Más votos electorales', 'Segundo')}[lang]
    rows = []
    for y in reversed(YS):
        c = D[y]['candidates']
        a = f'{esc(c[0]["name"])} <small>({esc(party(lang, c[0]["party"]))})</small>, {c[0]["ev"]}'
        b = f'{esc(c[1]["name"])} <small>({esc(party(lang, c[1]["party"]))})</small>, {c[1]["ev"]}' if len(c) > 1 else ''
        if y == '1824': a += ' *'
        rows.append(f'<tr><td><a href="?year={y}#map">{y}</a></td><td><i style="background:{c[0].get("color", "#64748B")}"></i>{a}</td><td>{b}</td></tr>')
    return (f'<table class="tbl em-tbl"><thead><tr><th>{h[0]}</th><th>{h[1]}</th><th>{h[2]}</th></tr></thead><tbody>' + ''.join(rows) + '</tbody></table>')


T = {
 'en': dict(
   title='US Presidential Election Maps by State, 1804 to 2024 | Statedoku',
   desc='Every US presidential election on one interactive map, 1804 to 2024: who won each state, electoral votes, and the popular vote by state since 1976.',
   h1='US presidential election maps by state, 1804 to 2024', crumb='Presidential election maps',
   sub='Pick a year to see which candidate won each state, and tap a state for its whole voting history.',
   lead=f'<p>This map shows all {F["n"]} presidential elections from 1804 to {F["last"]}, state by state: each state takes the colour of the candidate who won its electoral votes. From 1976 it also gives the share of the popular vote each state gave the Democratic and Republican candidates.</p>',
   map_h='The map, election by election',
   facts_h='What the maps show',
   facts=[f'Since 1976 ({F["n76"]} elections), {F["same76"]} of the 50 states and DC have voted for the same party every time. Two of them always went Democratic: {names("en", F["same76_d"])}, which has backed every Democratic candidate since 1976, Walter Mondale in 1984 included. The others all went Republican every time.',
          f'From 2000 to {F["last"]}, {F["same00"]} of the 51 voted for the same party in all seven elections. The presidency was decided in the rest.',
          f'Ohio voted for the winner in 12 of the {F["n76"]} elections since 1976, more often than any other state; it missed in 2020.',
          f'Between {F["prev"]} and {F["last"]}, {len(F["flips"])} states changed sides: {names("en", F["flips"])}.',
          f'The District of Columbia has voted in presidential elections since {F["dc"]}, when the 23rd Amendment gave it three electors, and has gone Democratic every time.'],
   table_h='Every election since 1804',
   table_note='* In 1824 no candidate won a majority of the electoral votes, and the House of Representatives chose John Quincy Adams.',
   read_h='How to read the map',
   read=['<p>A state takes the colour of the candidate who won most of its electoral votes. Maine (since 1972) and Nebraska (since 1992) give two votes to the statewide winner and one per congressional district, so they can split: tap them to see the split.</p>',
         '<p>The map starts in 1804, the first election under the 12th Amendment. Before it, each elector cast two votes for President and the runner-up became Vice President, so a state had no single winner. Grey states had not yet joined the Union; a darker grey marks a state that did not take part, like the seceded states in 1864.</p>',
         '<p>A few electors over the years did not vote or voted for someone else than their state chose; the totals here are the votes as counted by Congress, from the National Archives.</p>'],
   src_h='Sources',
   src='Electoral votes by state: the National Archives, Office of the Federal Register, which publishes the certified results of every election. Popular vote by state since 1976: MIT Election Data and Science Lab, U.S. President 1976 to 2024 (public domain, CC0).',
   rel_h='Related', related=[('/learn/electoral-college/', 'Electoral college votes by state'), ('/learn/swing-states/', 'US swing states'), ('/learn/2026-midterm-elections/', '2026 midterm election results'), ('/learn/house-seats-by-state-1910-2020/', 'House seats by state, 1910 to 2020'), ('/states/', 'All 50 states')],
   faq_h='Questions', faq=[
     ('Which states have voted the same way in every election since 1976?', f'{F["same76"]} of the 50 states and DC: {names("en", sorted(same76))}. {names("en", F["same76_d"])} went Democratic every time, the others Republican.'),
     ('Which state has picked the winner most often since 1976?', f'Ohio, in 12 of the {F["n76"]} elections; the only miss was 2020.'),
     (f'Which states changed sides between {F["prev"]} and {F["last"]}?', f'{names("en", F["flips"])}, all from the Democratic to the Republican candidate.')]),
 'fr': dict(
   title='Cartes des élections présidentielles américaines par État, 1804 à 2024 | Statedoku',
   desc="Toutes les présidentielles américaines sur une carte interactive, de 1804 à 2024 : qui a gagné chaque État, les grands électeurs et le vote populaire.",
   h1='Les élections présidentielles américaines État par État, de 1804 à 2024', crumb='Cartes des présidentielles',
   sub="Choisissez une année pour voir qui a gagné chaque État, et touchez un État pour tout son historique.",
   lead=f"<p>Cette carte montre les {F['n']} élections présidentielles américaines de 1804 à {F['last']}, État par État : chaque État prend la couleur du candidat qui a remporté ses grands électeurs. Depuis 1976, elle donne aussi la part du vote populaire de chaque État pour les candidats démocrate et républicain.</p>",
   map_h='La carte, élection par élection', facts_h='Ce que montrent les cartes',
   facts=[f"Depuis 1976 ({F['n76']} élections), {F['same76']} des 50 États et le district de Columbia ont voté pour le même parti à chaque fois. Deux ont toujours voté démocrate : {names('fr', F['same76_d'])}, fidèle à chaque candidat démocrate depuis 1976, Walter Mondale en 1984 compris. Tous les autres ont toujours voté républicain.",
          f"De 2000 à {F['last']}, {F['same00']} des 51 ont voté pour le même parti aux sept élections. La présidence s'est jouée dans les autres.",
          f"L'Ohio a voté pour le vainqueur à 12 des {F['n76']} élections depuis 1976, plus souvent que tout autre État ; il s'est trompé en 2020.",
          f"Entre {F['prev']} et {F['last']}, {len(F['flips'])} États ont changé de camp : {names('fr', F['flips'])}.",
          f"Le district de Columbia vote à la présidentielle depuis {F['dc']}, quand le 23e amendement lui a donné trois grands électeurs, et a voté démocrate à chaque fois."],
   table_h='Toutes les élections depuis 1804',
   table_note="* En 1824, aucun candidat n'a obtenu la majorité des grands électeurs et la Chambre des représentants a choisi John Quincy Adams.",
   read_h='Comment lire la carte',
   read=["<p>Un État prend la couleur du candidat qui a remporté la plupart de ses grands électeurs. Le Maine (depuis 1972) et le Nebraska (depuis 1992) donnent deux voix au vainqueur de l'État et une par circonscription : ils peuvent donc se partager. Touchez-les pour voir le partage.</p>",
         "<p>La carte commence en 1804, première élection sous le 12e amendement. Avant, chaque grand électeur votait deux fois pour la présidence et le deuxième devenait vice-président : un État n'avait pas de vainqueur unique. Les États en gris clair n'avaient pas encore rejoint l'Union ; un gris plus foncé marque un État qui n'a pas voté, comme les États sécessionnistes en 1864.</p>",
         "<p>Au fil des années, quelques grands électeurs n'ont pas voté ou ont voté pour un autre que le choix de leur État ; les totaux sont ceux comptés par le Congrès, d'après les Archives nationales américaines.</p>"],
   src_h='Sources',
   src="Grands électeurs par État : Archives nationales américaines (Office of the Federal Register), qui publient les résultats certifiés de chaque élection. Vote populaire par État depuis 1976 : MIT Election Data and Science Lab, U.S. President 1976 to 2024 (domaine public, CC0).",
   rel_h='À lire aussi', related=[('/fr/learn/college-electoral/', 'Le collège électoral'), ('/fr/learn/elections-mi-mandat-2026/', 'Élections de mi-mandat 2026'), ('/fr/learn/sieges-chambre-par-etat-1910-2020/', 'Sièges à la Chambre par État, 1910 à 2020'), ('/fr/learn/', 'Apprendre')],
   faq_h='Questions', faq=[
     ('Quels États ont voté de la même façon à chaque élection depuis 1976 ?', f"{F['same76']} des 50 États et le district de Columbia : {names('fr', sorted(same76))}. {names('fr', F['same76_d'])} ont toujours voté démocrate, les autres républicain."),
     ('Quel État a le plus souvent voté pour le vainqueur depuis 1976 ?', f"L'Ohio, à 12 des {F['n76']} élections ; la seule erreur est 2020."),
     (f"Quels États ont changé de camp entre {F['prev']} et {F['last']} ?", f"{names('fr', F['flips'])}, tous passés du candidat démocrate au candidat républicain.")]),
 'es': dict(
   title='Mapas de las elecciones presidenciales de EE. UU. por estado, 1804 a 2024 | Statedoku',
   desc='Todas las elecciones presidenciales de EE. UU. en un mapa interactivo, de 1804 a 2024: quién ganó cada estado, votos electorales y voto popular.',
   h1='Elecciones presidenciales de EE. UU. estado por estado, de 1804 a 2024', crumb='Mapas de las presidenciales',
   sub='Elige un año para ver quién ganó cada estado y toca un estado para ver todo su historial.',
   lead=f"<p>Este mapa muestra las {F['n']} elecciones presidenciales de 1804 a {F['last']}, estado por estado: cada estado toma el color del candidato que ganó sus votos electorales. Desde 1976 también da el porcentaje del voto popular de cada estado para los candidatos demócrata y republicano.</p>",
   map_h='El mapa, elección por elección', facts_h='Lo que muestran los mapas',
   facts=[f"Desde 1976 ({F['n76']} elecciones), {F['same76']} de los 50 estados y el Distrito de Columbia votaron siempre por el mismo partido. Dos votaron siempre demócrata: {names('es', F['same76_d'])}, fiel a cada candidato demócrata desde 1976, incluido Walter Mondale en 1984. Todos los demás votaron siempre republicano.",
          f"De 2000 a {F['last']}, {F['same00']} de los 51 votaron por el mismo partido en las siete elecciones. La presidencia se decidió en el resto.",
          f"Ohio votó por el ganador en 12 de las {F['n76']} elecciones desde 1976, más que ningún otro estado; falló en 2020.",
          f"Entre {F['prev']} y {F['last']}, {len(F['flips'])} estados cambiaron de bando: {names('es', F['flips'])}.",
          f"El Distrito de Columbia vota en las presidenciales desde {F['dc']}, cuando la Enmienda 23 le dio tres electores, y siempre ha votado demócrata."],
   table_h='Todas las elecciones desde 1804',
   table_note='* En 1824 ningún candidato obtuvo la mayoría de los votos electorales y la Cámara de Representantes eligió a John Quincy Adams.',
   read_h='Cómo leer el mapa',
   read=['<p>Un estado toma el color del candidato que ganó la mayoría de sus votos electorales. Maine (desde 1972) y Nebraska (desde 1992) dan dos votos al ganador estatal y uno por distrito, así que pueden repartirse: tócalos para ver el reparto.</p>',
         '<p>El mapa empieza en 1804, la primera elección bajo la Enmienda 12. Antes, cada elector votaba dos veces para presidente y el segundo pasaba a vicepresidente, así que un estado no tenía un único ganador. Los estados en gris claro aún no formaban parte de la Unión; un gris más oscuro marca un estado que no participó, como los estados separados en 1864.</p>',
         '<p>Con los años, algunos electores no votaron o votaron por otra persona que la elegida por su estado; los totales son los contados por el Congreso, según los Archivos Nacionales de EE. UU.</p>'],
   src_h='Fuentes',
   src='Votos electorales por estado: Archivos Nacionales de EE. UU. (Office of the Federal Register), que publican los resultados certificados de cada elección. Voto popular por estado desde 1976: MIT Election Data and Science Lab, U.S. President 1976 to 2024 (dominio público, CC0).',
   rel_h='Más para leer', related=[('/es/learn/colegio-electoral/', 'El Colegio Electoral'), ('/es/learn/escanos-camara-por-estado-1910-2020/', 'Escaños en la Cámara por estado, 1910 a 2020'), ('/es/states/', 'Los 50 estados'), ('/es/learn/', 'Aprender')],
   faq_h='Preguntas', faq=[
     ('¿Qué estados votaron igual en todas las elecciones desde 1976?', f"{F['same76']} de los 50 estados y el Distrito de Columbia: {names('es', sorted(same76))}. {names('es', F['same76_d'])} votaron siempre demócrata; los demás, republicano."),
     ('¿Qué estado acertó más veces con el ganador desde 1976?', f"Ohio, en 12 de las {F['n76']} elecciones; solo falló en 2020."),
     (f"¿Qué estados cambiaron de bando entre {F['prev']} y {F['last']}?", f"{names('es', F['flips'])}, todos del candidato demócrata al republicano.")]),
}
assert all(win(F['prev'], c) == 'Democratic' and win(F['last'], c) == 'Republican' for c in F['flips'])

CSS = '''
    .hp-hero { max-width: 900px; margin: 28px auto 14px; padding: 0 18px; text-align: center; }
    .hp-hero .crumb { font-size: .8rem; color: var(--text-3); margin-bottom: 8px; }
    .hp-hero .crumb a { color: var(--text-2); text-decoration: none; }
    .hp-hero h1 { font-size: clamp(1.7rem, 5vw, 2.4rem); font-weight: 900; letter-spacing: -0.025em; margin: 4px 0 8px; }
    .hp-hero .meta { color: var(--text-2); font-size: 1rem; }
    .hp-main { max-width: 760px; margin: 0 auto; padding: 18px 18px 60px; line-height: 1.65; }
    .hp-main h2 { margin-top: 30px; margin-bottom: 10px; font-size: 1.3rem; font-weight: 800; letter-spacing: -0.015em; }
    .hp-main ul { padding-left: 22px; margin-bottom: 12px; } .hp-main ul li { margin-bottom: 6px; }
    .answer { border-left: 4px solid var(--gold); padding: 4px 0 4px 14px; margin: 6px 0 14px; }
    .related-grid { display: grid; grid-template-columns: repeat(auto-fit, minmax(220px, 1fr)); gap: 8px; margin: 14px 0; }
    .related-grid a { display: block; padding: 10px 12px; border: 1px solid var(--border); border-radius: 8px; color: var(--navy); text-decoration: none; font-weight: 600; font-size: .9rem; }
    table.tbl { width:100%; border-collapse: collapse; margin:12px 0 8px; font-size:.9rem; }
    table.tbl th, table.tbl td { padding:7px 10px; border-bottom: 1px solid var(--border); text-align:left; vertical-align: top; }
    table.tbl th { background: #F8FAFC; font-weight:700; color: var(--navy); font-size:.8rem; text-transform: uppercase; letter-spacing:.03em; }
    table.tbl a { color: var(--navy); font-weight: 800; }
    .em-tbl i { display:inline-block; width:10px; height:10px; border-radius:3px; margin-right:6px; }
    .em-tbl small { color: var(--text-2); }
    .faq-rendered details { border:1px solid var(--border); border-radius:10px; margin-bottom:8px; padding:12px 16px; background:#fff }
    .faq-rendered summary { cursor:pointer; font-weight:700; color:var(--navy) }'''


def chrome(lang):
    s = (ROOT / CHROME[lang]).read_text(encoding='utf-8')
    head_end = s.index('<header>')
    header = s[head_end:s.index('<main>')]
    footer = s[s.index('</main>') + len('</main>'):]
    footer = re.sub(r'<script>\s*\(function.*?</script>\s*', '', footer, flags=re.S)   # the midterms map script
    footer = re.sub(r'<script>[^<]*mt-map.*?</script>\s*', '', footer, flags=re.S)
    assert 'mt-map' not in footer and '<footer>' in footer, lang
    return s[:s.index('<meta charset')], header, footer


def page(lang):
    t, url = T[lang], BASE + PATHS[lang]
    pre, header, footer = chrome(lang)
    alts = ''.join(f'  <link rel="alternate" hreflang="{l}" href="{BASE + p}">\n' for l, p in PATHS.items())
    alts += f'  <link rel="alternate" hreflang="x-default" href="{BASE + PATHS["en"]}">\n'
    home, learn = {'en': ('/', '/learn/'), 'fr': ('/fr/', '/fr/learn/'), 'es': ('/es/', '/es/learn/')}[lang]
    hn, ln = {'en': ('Home', 'Learn'), 'fr': ('Accueil', 'Apprendre'), 'es': ('Inicio', 'Aprender')}[lang]
    crumbs = json.dumps({'@context': 'https://schema.org', '@type': 'BreadcrumbList', 'itemListElement': [
        {'@type': 'ListItem', 'position': 1, 'name': hn, 'item': BASE + home}, {'@type': 'ListItem', 'position': 2, 'name': ln, 'item': BASE + learn},
        {'@type': 'ListItem', 'position': 3, 'name': t['crumb'], 'item': url}]}, ensure_ascii=False)
    faq_ld = json.dumps({'@context': 'https://schema.org', '@type': 'FAQPage', 'mainEntity': [
        {'@type': 'Question', 'name': q, 'acceptedAnswer': {'@type': 'Answer', 'text': a}} for q, a in t['faq']]}, ensure_ascii=False)
    ds = json.dumps({'@context': 'https://schema.org', '@type': 'Dataset', 'name': t['h1'], 'description': t['desc'], 'url': url,
                     'temporalCoverage': f'1804/{F["last"]}', 'spatialCoverage': 'United States', 'license': 'https://creativecommons.org/publicdomain/zero/1.0/',
                     'creator': {'@type': 'Organization', 'name': 'Statedoku', 'url': BASE + '/'}}, ensure_ascii=False)
    facts = ''.join(f'<li>{esc(x)}</li>' for x in t['facts'])
    faq = ''.join(f'<details><summary>{esc(q)}</summary><p>{esc(a)}</p></details>\n' for q, a in t['faq'])
    rel = ''.join(f'<a href="{u}">{esc(n)}</a>' for u, n in t['related'])
    return f'''{pre}<meta charset="UTF-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0, viewport-fit=cover">
  <meta name="theme-color" content="#FFFFFF">
  <meta name="color-scheme" content="light">
  <title>{esc(t["title"])}</title>
  <meta name="description" content="{esc(t["desc"])}">
  <meta name="robots" content="index, follow, max-image-preview:large">
  <link rel="canonical" href="{url}">
{alts}  <link rel="icon" type="image/svg+xml" href="/favicon.svg?v=5">
  <link rel="stylesheet" href="/css/style.css?v=36">
  <meta property="og:type" content="article">
  <meta property="og:title" content="{esc(t["h1"])}">
  <meta property="og:description" content="{esc(t["desc"])}">
  <meta property="og:url" content="{url}">
  <meta property="og:image" content="{BASE}/og-image.png?v=2">
  <meta name="twitter:card" content="summary_large_image">
  <meta name="twitter:title" content="{esc(t["h1"])}">
  <meta name="twitter:description" content="{esc(t["desc"])}">
  <meta name="twitter:image" content="{BASE}/og-image.png?v=2">
  <style>{CSS}
  </style>
  <script type="application/ld+json">{crumbs}</script>
  <script type="application/ld+json">{faq_ld}</script>
  <script type="application/ld+json">{ds}</script>
</head>
<body class="legal-body">

{header}<main>
  <section class="hp-hero">
    <p class="crumb"><a href="{home}">{hn}</a> · <a href="{learn}">{ln}</a> · {esc(t["crumb"])}</p>
    <h1>{esc(t["h1"])}</h1>
    <p class="meta">{esc(t["sub"])}</p>
  </section>
  <div class="hp-main">
    <div class="answer">{t["lead"]}</div>
    <h2 id="map">{esc(t["map_h"])}</h2>
    <div data-election-map data-lang="{lang}"></div>

    <h2>{esc(t["facts_h"])}</h2>
    <ul>{facts}</ul>

    <div class="ad-slot" data-ad-slot="PLACEHOLDER_LEARN_MID" data-ad-format="auto"></div>

    <h2>{esc(t["table_h"])}</h2>
    {table(lang)}
    <p class="em-small">{esc(t["table_note"])}</p>

    <h2>{esc(t["read_h"])}</h2>
    {''.join(t["read"])}

    <section class="faq-rendered">
    <h2>{esc(t["faq_h"])}</h2>
    {faq}    </section>

    <h2>{esc(t["src_h"])}</h2>
    <p>{esc(t["src"])}</p>

    <h2>{esc(t["rel_h"])}</h2>
    <div class="related-grid">{rel}</div>
  </div>
  <div class="ad-slot ad-slot-inline" data-ad-slot="PLACEHOLDER_LEARN_BOTTOM" data-ad-format="auto"></div>
</main>{footer.replace("</body>", '<script src="/js/election-map.js?v=1" defer></script>' + chr(10) + "</body>", 1)}'''


DASHES = re.compile('[‐-―−]')
NB = ' '
for lang in PATHS:
    assert 70 <= len(T[lang]['desc']) <= 160, (lang, len(T[lang]['desc']))
    out = page(lang)
    visible = re.sub(r'<(script|style)\b.*?</\1>', '', out, flags=re.S)
    assert not DASHES.search(visible), (lang, DASHES.findall(visible)[:3])
    if lang == 'fr':
        parts = re.split(r'(<script(?! type="application/ld\+json").*?</script>|<style.*?</style>|<[^>]+>)', out, flags=re.S)
        out = ''.join(p if i % 2 else re.sub(r' ([:;?!%»])', NB + r'\1', p).replace('« ', '«' + NB) for i, p in enumerate(parts))
    p = ROOT / PATHS[lang].strip('/') / 'index.html'
    p.parent.mkdir(parents=True, exist_ok=True)
    p.write_text(out, encoding='utf-8')
    print(f'{p.relative_to(ROOT)}  {len(out):,} bytes')
print('facts:', {k: v for k, v in F.items()})
