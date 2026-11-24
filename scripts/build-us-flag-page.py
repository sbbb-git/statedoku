#!/usr/bin/env python3
"""Build /learn/us-flag/ and /fr/learn/drapeau-americain/: the 50-star flag and its 27 versions.

The table of versions is computed, not typed: from the admission date of each
state and the Flag Act of 1818 (a new star on the 4th of July after a state's
admission), plus the two flags before it (13 stars from 14 June 1777, 15 from
1 May 1795). Asserts 27 versions, 50 stars, and every admission year equal to
data/states.json. Re-run after editing the copy here, never edit the HTML.
"""
import datetime as dt
import html
import json
import os

ROOT = os.path.dirname(os.path.dirname(os.path.abspath(__file__)))
OUT = os.path.join(ROOT, 'learn', 'us-flag', 'index.html')

# Admission dates of the 37 states admitted after the original 13 (Vermont and
# Kentucky are the two stars of the 1795 flag).
ADMITTED = [
    ('VT', '1791-03-04'), ('KY', '1792-06-01'), ('TN', '1796-06-01'), ('OH', '1803-03-01'),
    ('LA', '1812-04-30'), ('IN', '1816-12-11'), ('MS', '1817-12-10'), ('IL', '1818-12-03'),
    ('AL', '1819-12-14'), ('ME', '1820-03-15'), ('MO', '1821-08-10'), ('AR', '1836-06-15'),
    ('MI', '1837-01-26'), ('FL', '1845-03-03'), ('TX', '1845-12-29'), ('IA', '1846-12-28'),
    ('WI', '1848-05-29'), ('CA', '1850-09-09'), ('MN', '1858-05-11'), ('OR', '1859-02-14'),
    ('KS', '1861-01-29'), ('WV', '1863-06-20'), ('NV', '1864-10-31'), ('NE', '1867-03-01'),
    ('CO', '1876-08-01'), ('ND', '1889-11-02'), ('SD', '1889-11-02'), ('MT', '1889-11-08'),
    ('WA', '1889-11-11'), ('ID', '1890-07-03'), ('WY', '1890-07-10'), ('UT', '1896-01-04'),
    ('OK', '1907-11-16'), ('NM', '1912-01-06'), ('AZ', '1912-02-14'), ('AK', '1959-01-03'),
    ('HI', '1959-08-21'),
]

states = json.load(open(os.path.join(ROOT, 'data', 'states.json'), encoding='utf-8'))
BY = {s['id']: s for s in states}
assert len(BY) == 50
ADM = {k: dt.date.fromisoformat(v) for k, v in ADMITTED}
for k, d in ADM.items():
    assert BY[k]['admitted'] == d.year, (k, BY[k]['admitted'], d.year)
assert len(ADM) == 37
assert sum(1 for s in states if s.get('original13')) == 13
assert not set(ADM) & {s['id'] for s in states if s.get('original13')}


def name(k):
    return BY[k]['names']['en']


def slug(k):
    return name(k).lower().replace(' ', '-')


# Versions: (stars, official from, states whose stars it added)
versions = [(13, dt.date(1777, 6, 14), []), (15, dt.date(1795, 5, 1), ['VT', 'KY'])]
counted = {'VT', 'KY'}
for year in range(1818, 2027):
    july4 = dt.date(year, 7, 4)
    new = sorted((k for k, d in ADM.items() if d < july4 and k not in counted), key=lambda k: (ADM[k], name(k)))
    if new:
        counted |= set(new)
        versions.append((13 + len(counted), july4, new))
assert len(versions) == 27, len(versions)
assert versions[-1][0] == 50 and versions[-1][1] == dt.date(1960, 7, 4)
assert [v[0] for v in versions][:4] == [13, 15, 20, 21]
v48 = next(v for v in versions if v[0] == 48)
assert v48[1] == dt.date(1912, 7, 4)
years48 = 1959 - 1912
today = dt.date(2026, 11, 23)
years50 = today.year - 1960 - (1 if (today.month, today.day) < (7, 4) else 0)
assert years50 > years48


def fmt(d):
    return d.strftime('%B ') + str(d.day) + ', ' + str(d.year)


def link(k):
    return f'<a href="/states/{slug(k)}/">{html.escape(name(k))}</a>'


def joined(items):
    items = list(items)
    if len(items) <= 1:
        return ''.join(items)
    return ', '.join(items[:-1]) + ' and ' + items[-1]


rows = []
for i, (n, d, new) in enumerate(versions):
    if n == 13:
        added = 'The 13 original states'
    elif n == 20:
        added = joined(link(k) for k in new) + ' (stars held back until the Flag Act of 1818)'
    else:
        added = joined(link(k) for k in new)
    end = versions[i + 1][1].year if i + 1 < len(versions) else None
    span = f'{d.year} to {end}' if end else f'{d.year} to today'
    rows.append(f'        <tr><td><strong>{n}</strong></td><td>{fmt(d)}</td><td>{span}</td><td>{added}</td></tr>')
TABLE = '\n'.join(rows)

TITLE = 'US Flag: Why 50 Stars and 13 Stripes, and Its 27 Versions'
DESC = ('The US flag has 50 stars, one per state, and 13 stripes for the original colonies. '
        'All 27 versions since 1777 and the state behind each new star.')
assert 70 <= len(DESC) <= 160, len(DESC)
URL = 'https://statedoku.com/learn/us-flag/'
URL_FR = 'https://statedoku.com/fr/learn/drapeau-americain/'

FAQ = [
    ('How many stars and stripes are on the US flag?',
     'Fifty stars, one for each state, and 13 stripes, 7 red and 6 white, one for each of the original 13 colonies.'),
    ('When did the US flag get 50 stars?',
     'On July 4, 1960, the first Fourth of July after Hawaii was admitted as the 50th state on August 21, 1959.'),
    ('How many versions of the US flag have there been?',
     f'{len(versions)}, from the 13-star flag of 1777 to the 50-star flag of 1960. The number of stars changed each time; the 13 stripes have been the rule since 1818.'),
    ('When is a new star added to the flag?',
     'Under the Flag Act of 1818, still in the US Code (4 U.S.C. section 2), a new star is added on the Fourth of July after a state is admitted.'),
]
for q, a in FAQ:
    assert '—' not in a + q and '–' not in a + q

faq_ld = json.dumps({'@context': 'https://schema.org', '@type': 'FAQPage', 'mainEntity': [
    {'@type': 'Question', 'name': q, 'acceptedAnswer': {'@type': 'Answer', 'text': a}} for q, a in FAQ]}, ensure_ascii=False)
crumb_ld = json.dumps({'@context': 'https://schema.org', '@type': 'BreadcrumbList', 'itemListElement': [
    {'@type': 'ListItem', 'position': 1, 'name': 'Home', 'item': 'https://statedoku.com/'},
    {'@type': 'ListItem', 'position': 2, 'name': 'Learn', 'item': 'https://statedoku.com/learn/'},
    {'@type': 'ListItem', 'position': 3, 'name': 'The US flag', 'item': URL}]}, ensure_ascii=False)
faq_html = '\n'.join(f'    <details><summary><strong>{html.escape(q)}</strong></summary><p>{html.escape(a)}</p></details>' for q, a in FAQ)

tmpl = open(os.path.join(ROOT, 'learn', 'mississippi-river-states', 'index.html'), encoding='utf-8').read()
head_top = tmpl[:tmpl.index('  <title>')]
style = tmpl[tmpl.index('  <style>'):tmpl.index('  </style>') + len('  </style>\n')]
header = tmpl[tmpl.index('<body'):tmpl.index('<main>')]
footer = tmpl[tmpl.index('</main><footer>'):]

page = f'''{head_top}  <title>{TITLE} | Statedoku</title>
  <meta name="description" content="{DESC}">
  <meta name="keywords" content="us flag, flag of the united states, united states flag, american flag, 50 stars, 13 stripes, flag history">
  <meta name="robots" content="index, follow, max-image-preview:large">
  <link rel="canonical" href="{URL}">
  <link rel="alternate" hreflang="en" href="{URL}">
  <link rel="alternate" hreflang="fr" href="{URL_FR}">
  <link rel="alternate" hreflang="x-default" href="{URL}">
  <link rel="icon" type="image/svg+xml" href="/favicon.svg?v=5">
  <link rel="stylesheet" href="/css/style.css?v=37">
  <meta property="og:type" content="article">
  <meta property="og:title" content="The US flag: 50 stars, 13 stripes, 27 versions">
  <meta property="og:description" content="{DESC}">
  <meta property="og:url" content="{URL}">
  <meta property="og:image" content="https://statedoku.com/og-image.png?v=2">
  <meta name="twitter:card" content="summary_large_image">
  <meta name="twitter:title" content="The US flag: 50 stars, 13 stripes, 27 versions">
  <meta name="twitter:description" content="{DESC}">
  <meta name="twitter:image" content="https://statedoku.com/og-image.png?v=2">

{style}  <script type="application/ld+json">{crumb_ld}</script>
  <script type="application/ld+json">{faq_ld}</script>
</head>
{header}<main>
  <section class="hp-hero">
    <p class="crumb"><a href="/">Home</a> · <a href="/learn/">Learn</a> · The US flag</p>
    <h1>The US flag: why 50 stars and 13 stripes</h1>
    <p class="meta">One star per state, one stripe per original colony, {len(versions)} versions since 1777.</p>
  </section>
  <div class="hp-main">
    <p><strong>The flag of the United States has 50 white stars on a blue field, one for each state, and 13 horizontal stripes, 7 red and 6 white, one for each of the original 13 colonies.</strong> The 50-star version has been the official flag since July 4, 1960, after Hawaii became the 50th state. It is the {len(versions)}th version of the flag: the number of stars grew as new states joined, and the stripes have stayed at 13 since 1818.</p>

    <figure style="margin:18px 0 8px;">
      <img src="/flag-us.svg" width="190" height="100" alt="The 50-star flag of the United States: 13 red and white stripes and a blue canton with 50 white stars in nine rows." style="display:block;width:100%;max-width:380px;height:auto;margin:0 auto;border:1px solid var(--border);">
      <figcaption style="max-width:380px;margin:10px auto 0;font-size:.9rem;color:#475569;text-align:center;">The 50-star flag, in the proportions set in 1959: 19 units wide for 10 high.</figcaption>
    </figure>

    <h2>Why 13 stripes and 50 stars</h2>
    <p>On June 14, 1777, the Second Continental Congress resolved that the flag of the United States be 13 stripes, alternate red and white, and that the union be 13 stars, white in a blue field, "representing a new constellation". June 14 is Flag Day for that reason.</p>
    <p>When Vermont and Kentucky joined, the Flag Act of 1794 gave the flag 15 stars and 15 stripes from May 1, 1795. That is the flag that flew over Fort McHenry in 1814 and inspired "The Star-Spangled Banner". Adding a stripe for every state could not last, so the Flag Act of April 4, 1818 went back to 13 stripes for good and set the rule still in the US Code today: one star for each state, and a new star added on the Fourth of July after a state is admitted.</p>

    <h2>The {len(versions)} versions of the flag</h2>
    <p>Each row is a flag that became official. States admitted between two Fourths of July shared one new flag; five states admitted between 1796 and 1817 waited for the 1818 law to get their stars.</p>
    <div class="ad-slot" data-ad-slot="PLACEHOLDER_LEARN_MID" data-ad-format="auto"></div>
    <div style="overflow-x:auto;">
    <table class="tbl">
      <thead><tr><th>Stars</th><th>Official from</th><th>In use</th><th>New stars for</th></tr></thead>
      <tbody>
{TABLE}
      </tbody>
    </table>
    </div>
    <p>The 48-star flag flew for {years48} years, from 1912 to 1959. The 50-star flag passed that mark on July 4, 2007, and has been in use longer than any other version since.</p>

    <h2>Proportions and layout</h2>
    <p>The flag's design is fixed by Executive Order 10834, signed by President Eisenhower on August 21, 1959, the day Hawaii was admitted. The flag is 1.9 times as wide as it is high, the blue union covers the top seven stripes, and the 50 stars sit in nine rows that alternate six and five stars.</p>

    <h2>What the colors mean</h2>
    <p>No law gives the colors a meaning. The explanation most often quoted is Charles Thomson's, written in 1782 for the same three colors on the Great Seal of the United States: white for purity and innocence, red for hardiness and valor, and blue for vigilance, perseverance and justice.</p>

    <section class="cta-card">
      <h3>Put the stars in order</h3>
      <p>The admission order game asks you to sort the states by the year they joined the Union.</p>
      <a href="/play/state-admission-order/">Play the admission order game</a>
    </section>

    <h2>Frequently asked questions</h2>
{faq_html}

    <h2>Related guides</h2>
    <div class="related-grid">
      <a href="/learn/state-flags/">Every state flag ranked</a>
      <a href="/learn/states-by-statehood-year/">States by statehood year</a>
      <a href="/learn/13-colonies/">The 13 colonies</a>
      <a href="/states/">All 50 state pages</a>
      <a href="/learn/">Learn hub</a>
    </div>
  </div>
    <div class="ad-slot ad-slot-inline" data-ad-slot="PLACEHOLDER_LEARN_BOTTOM" data-ad-format="auto"></div>

{footer}'''
def write_page(out, page, skip):
    for bad in ('\u2014', '\u2013', '\u2012'):
        assert bad not in page.replace(skip, ''), bad
    os.makedirs(os.path.dirname(out), exist_ok=True)
    old = open(out, encoding='utf-8').read() if os.path.exists(out) else None
    # Keep the date stamps written by stamp-page-dates.py across rebuilds.
    if old and 'data-page-dates' in old:
        i = old.index('  <script type="application/ld+json" data-page-dates>')
        ld = old[i:old.index('</script>', i) + len('</script>\n')]
        page = page.replace('</head>', ld + '</head>', 1)
        j = old.find('  <p class="page-updated">')
        if j >= 0:
            stamp = old[j:old.index('</p>', j) + len('</p>\n')]
            page = page.replace('</main>', stamp + '</main>', 1)
    open(out, 'w', encoding='utf-8').write(page)
    print(f'{out}: {len(page):,} bytes')


write_page(OUT, page, head_top)
print(f'{len(versions)} versions, 50-star flag {years50} years, 48-star {years48}')

# ---- French: /fr/learn/drapeau-americain/ ----
OUT_FR = os.path.join(ROOT, 'fr', 'learn', 'drapeau-americain', 'index.html')
MOIS = ['janvier', 'février', 'mars', 'avril', 'mai', 'juin', 'juillet', 'août',
        'septembre', 'octobre', 'novembre', 'décembre']


def nb(t):
    """French typography: a no-break space before : ; ? ! and %."""
    for p in (' :', ' ;', ' ?', ' !', ' %'):
        t = t.replace(p, '\u00a0' + p[1])
    return t.replace('« ', '«\u00a0').replace(' »', '\u00a0»')


def fmt_fr(d):
    return f'{"1er" if d.day == 1 else d.day} {MOIS[d.month - 1]} {d.year}'


def joined_fr(items):
    items = list(items)
    if len(items) <= 1:
        return ''.join(items)
    return ', '.join(items[:-1]) + ' et ' + items[-1]


def name_fr(k):
    return html.escape(BY[k]['names']['fr'])


rows_fr = []
for i, (n, d, new) in enumerate(versions):
    if n == 13:
        added = 'Les 13 États fondateurs'
    elif n == 20:
        added = joined_fr(name_fr(k) for k in new) + ' (étoiles en attente jusqu’à la loi de 1818)'
    else:
        added = joined_fr(name_fr(k) for k in new)
    end = versions[i + 1][1].year if i + 1 < len(versions) else None
    span = f'{d.year} à {end}' if end else f'depuis {d.year}'
    rows_fr.append(f'        <tr><td><strong>{n}</strong></td><td>{fmt_fr(d)}</td><td>{span}</td><td>{added}</td></tr>')
TABLE_FR = '\n'.join(rows_fr)

TITLE_FR = 'Drapeau américain : 50 étoiles, 13 bandes et 27 versions'
DESC_FR = nb('Le drapeau des États-Unis compte 50 étoiles, une par État, et 13 bandes pour les colonies d’origine. '
             'Ses 27 versions depuis 1777 et l’État de chaque étoile.')
assert 70 <= len(DESC_FR) <= 160, len(DESC_FR)

FAQ_FR = [
    ('Combien d’étoiles et de bandes compte le drapeau américain ?',
     'Cinquante étoiles, une par État, et 13 bandes, 7 rouges et 6 blanches, une pour chacune des 13 colonies d’origine.'),
    ('Depuis quand le drapeau américain a-t-il 50 étoiles ?',
     'Depuis le 4 juillet 1960, premier 4 juillet après l’admission d’Hawaï comme 50e État, le 21 août 1959.'),
    ('Combien de versions du drapeau américain y a-t-il eu ?',
     f'{len(versions)}, du drapeau à 13 étoiles de 1777 à celui à 50 étoiles de 1960. Le nombre d’étoiles a changé à chaque fois ; les 13 bandes sont la règle depuis 1818.'),
    ('Quand ajoute-t-on une étoile au drapeau ?',
     'Selon la loi sur le drapeau de 1818, toujours inscrite dans le Code des États-Unis (titre 4, section 2), une nouvelle étoile est ajoutée le 4 juillet qui suit l’admission d’un État.'),
]
FAQ_FR = [(nb(q), nb(a)) for q, a in FAQ_FR]

faq_ld_fr = json.dumps({'@context': 'https://schema.org', '@type': 'FAQPage', 'mainEntity': [
    {'@type': 'Question', 'name': q, 'acceptedAnswer': {'@type': 'Answer', 'text': a}} for q, a in FAQ_FR]}, ensure_ascii=False)
crumb_ld_fr = json.dumps({'@context': 'https://schema.org', '@type': 'BreadcrumbList', 'itemListElement': [
    {'@type': 'ListItem', 'position': 1, 'name': 'Accueil', 'item': 'https://statedoku.com/fr/'},
    {'@type': 'ListItem', 'position': 2, 'name': 'Apprendre', 'item': 'https://statedoku.com/fr/learn/'},
    {'@type': 'ListItem', 'position': 3, 'name': 'Le drapeau américain', 'item': URL_FR}]}, ensure_ascii=False)
faq_html_fr = '\n'.join(f'    <details><summary><strong>{html.escape(q)}</strong></summary><p>{html.escape(a)}</p></details>' for q, a in FAQ_FR)

tf = open(os.path.join(ROOT, 'fr', 'learn', 'etats-du-mississippi', 'index.html'), encoding='utf-8').read()
head_top_fr = tf[:tf.index('  <title>')]
style_fr = tf[tf.index('  <style>'):tf.index('</style>') + len('</style>\n')]
header_fr = tf[tf.index('<body'):tf.index('</header>') + len('</header>\n')]
footer_fr = tf[tf.index('</main>'):]

body_fr = nb(f'''  <section class="lt-hero">
    <h1>Le drapeau américain : pourquoi 50 étoiles et 13 bandes</h1>
    <p class="sub">Une étoile par État, une bande par colonie d’origine, {len(versions)} versions depuis 1777.</p>
  </section>

  <article class="lt-main">
    <p><strong>Le drapeau des États-Unis porte 50 étoiles blanches sur fond bleu, une pour chaque État, et 13 bandes horizontales, 7 rouges et 6 blanches, une pour chacune des 13 colonies d’origine.</strong> La version à 50 étoiles est le drapeau officiel depuis le 4 juillet 1960, après l’entrée d’Hawaï comme 50e État. C’est la {len(versions)}e version du drapeau : le nombre d’étoiles a augmenté à mesure que de nouveaux États rejoignaient l’Union, et les bandes sont restées au nombre de 13 depuis 1818.</p>

    <figure style="margin:18px 0 8px;">
      <img src="/flag-us.svg" width="190" height="100" alt="Le drapeau des États-Unis à 50 étoiles : 13 bandes rouges et blanches et un canton bleu de 50 étoiles blanches sur neuf rangées." style="display:block;width:100%;max-width:380px;height:auto;margin:0 auto;border:1px solid var(--border);">
      <figcaption style="max-width:380px;margin:10px auto 0;font-size:.9rem;color:#475569;text-align:center;">Le drapeau à 50 étoiles, aux proportions fixées en 1959 : 19 unités de large pour 10 de haut.</figcaption>
    </figure>

    <h2>Pourquoi 13 bandes et 50 étoiles</h2>
    <p>Le 14 juin 1777, le deuxième Congrès continental décide que le drapeau des États-Unis aura 13 bandes, alternativement rouges et blanches, et que le canton portera 13 étoiles blanches sur fond bleu, « représentant une nouvelle constellation ». C’est pour cela que le 14 juin est le Flag Day, le jour du drapeau.</p>
    <p>Après l’entrée du Vermont et du Kentucky, la loi sur le drapeau de 1794 lui donne 15 étoiles et 15 bandes à partir du 1er mai 1795. C’est ce drapeau qui flottait sur le fort McHenry en 1814 et qui a inspiré « The Star-Spangled Banner », l’hymne national. Ajouter une bande par État ne pouvait pas durer : la loi du 4 avril 1818 revient définitivement à 13 bandes et fixe la règle toujours inscrite dans le Code des États-Unis : une étoile par État, et une nouvelle étoile ajoutée le 4 juillet qui suit l’admission d’un État.</p>

    <h2>Les {len(versions)} versions du drapeau</h2>
    <p>Chaque ligne est un drapeau devenu officiel. Les États admis entre deux 4 juillet partagent un même nouveau drapeau ; cinq États admis entre 1796 et 1817 ont attendu la loi de 1818 pour recevoir leur étoile.</p>
    <div class="ad-slot" data-ad-slot="PLACEHOLDER_LEARN_MID" data-ad-format="auto"></div>
    <div style="overflow-x:auto;">
    <table class="lt">
      <thead><tr><th>Étoiles</th><th>Officiel le</th><th>En usage</th><th>Nouvelles étoiles</th></tr></thead>
      <tbody>
{TABLE_FR}
      </tbody>
    </table>
    </div>
    <p>Le drapeau à 48 étoiles a flotté {years48} ans, de 1912 à 1959. Le drapeau à 50 étoiles a dépassé cette durée le 4 juillet 2007 et il est depuis la version restée le plus longtemps en usage.</p>

    <h2>Proportions et disposition</h2>
    <p>Le dessin du drapeau est fixé par le décret présidentiel 10834 (Executive Order 10834), signé par le président Eisenhower le 21 août 1959, le jour de l’admission d’Hawaï. Le drapeau est 1,9 fois plus large que haut, le canton bleu couvre les sept bandes du haut et les 50 étoiles sont disposées sur neuf rangées qui alternent six et cinq étoiles.</p>

    <h2>Ce que signifient les couleurs</h2>
    <p>Aucune loi ne donne de sens aux couleurs. L’explication la plus souvent citée est celle de Charles Thomson, écrite en 1782 pour les trois mêmes couleurs du grand sceau des États-Unis : le blanc pour la pureté et l’innocence, le rouge pour la robustesse et la vaillance, le bleu pour la vigilance, la persévérance et la justice.</p>

    <section class="cta-card">
      <h3>Remettez les étoiles dans l’ordre</h3>
      <p>Le jeu de l’ordre d’admission vous demande de classer les États selon l’année de leur entrée dans l’Union.</p>
      <a href="/fr/play/state-admission-order/">Jouer à l’ordre d’admission</a>
    </section>

    <h2>Questions fréquentes</h2>
''') + faq_html_fr + '''

    <h2>Guides associés</h2>
    <div class="related-grid">
      <a href="/fr/learn/drapeaux-des-etats/">Les drapeaux des 50 États</a>
      <a href="/fr/learn/13-colonies/">Les 13 colonies</a>
      <a href="/fr/learn/">Apprendre les 50 États</a>
    </div>
  </article>
    <div class="ad-slot ad-slot-inline" data-ad-slot="PLACEHOLDER_LEARN_BOTTOM" data-ad-format="auto"></div>

'''

page_fr = f'''{head_top_fr}  <title>{nb(TITLE_FR)} | Statedoku</title>
  <meta name="description" content="{DESC_FR}">
  <meta name="keywords" content="drapeau américain, drapeau des États-Unis, 50 étoiles, 13 bandes, histoire du drapeau">
  <meta name="robots" content="index, follow, max-image-preview:large">

  <link rel="canonical" href="{URL_FR}">
  <link rel="alternate" hreflang="en" href="{URL}">
  <link rel="alternate" hreflang="fr" href="{URL_FR}">
  <link rel="alternate" hreflang="x-default" href="{URL}">
  <link rel="icon" type="image/svg+xml" href="/favicon.svg?v=5">
  <link rel="stylesheet" href="/css/style.css?v=37">

  <meta property="og:type" content="article">
  <meta property="og:title" content="{nb('Le drapeau américain : 50 étoiles, 13 bandes, 27 versions')}">
  <meta property="og:description" content="{DESC_FR}">
  <meta property="og:url" content="{URL_FR}">
  <meta property="og:image" content="https://statedoku.com/og-image.png?v=2">
  <meta property="og:locale" content="fr_FR">
  <meta name="twitter:card" content="summary_large_image">
  <meta name="twitter:title" content="{nb('Le drapeau américain : 50 étoiles, 13 bandes, 27 versions')}">
  <meta name="twitter:description" content="{DESC_FR}">
  <meta name="twitter:image" content="https://statedoku.com/og-image.png?v=2">

{style_fr}<script type="application/ld+json">{crumb_ld_fr}</script>
<script type="application/ld+json">{faq_ld_fr}</script>
</head>
{header_fr}<main>
{body_fr}{footer_fr}'''
write_page(OUT_FR, page_fr, head_top_fr)
