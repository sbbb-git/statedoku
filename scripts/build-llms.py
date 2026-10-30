#!/usr/bin/env python3
"""Build llms.txt and llms-full.txt from the site itself.

Both files used to be typed by hand in May 2026 and drifted from the site
they describe. By October they said three mistakes in one place and five in
another, midnight UTC and midnight local time, that a fitting state could be
"gently rejected" by a solvability check that had been removed weeks earlier,
and they carried a list of state facts nobody had checked (Iowa producing 13
billion bushels of corn, about five times the real figure). Answer engines
quote these files, so a wrong line here is repeated to people as fact.

So everything that can come from data does:
  - the state table and every list come from data/states.json, which holds
    the corrected values, and each list is asserted against the count the
    site's own pages state;
  - the games come from the ItemList on /play/, their descriptions and their
    French and Spanish addresses from each game page;
  - every linked page must exist, be indexable and be self-canonical, and its
    description is read from the page.

Hand-written prose is limited to what the rules and the About page already
say. No unicode dash may reach either file.

Usage: python3 scripts/build-llms.py           write both files
       python3 scripts/build-llms.py --check   exit 1 if either is stale
"""
import datetime, html, json, pathlib, re, sys

ROOT = pathlib.Path(__file__).resolve().parent.parent
BASE = 'https://statedoku.com'
STATES = json.loads((ROOT / 'data' / 'states.json').read_text(encoding='utf-8'))
LASTMOD = dict(re.findall(r'"(/[^"]*)": "(\d{4}-\d{2}-\d{2})"',
                          (ROOT / 'functions' / '_sitemap-lastmod.js').read_text(encoding='utf-8')))
DASHES = re.compile('[‐‑‒–—―−]')
GAME_SUFFIX = re.compile(r'\s*Free browser game, no signup, playable in under a minute\.(\s*Updated for \d{4}\.)?\s*$')


def fail(msg):
    sys.exit(f'build-llms: {msg}')


def page(path):
    """Title and description of an indexable, self-canonical page."""
    f = ROOT / ('index.html' if path == '/' else path.strip('/') + '/index.html')
    if not f.is_file():
        fail(f'{path} does not exist')
    s = f.read_text(encoding='utf-8')
    if re.search(r'<meta name="robots" content="[^"]*noindex', s):
        fail(f'{path} is noindex; an answer engine should not be sent to it')
    can = re.search(r'<link rel="canonical" href="([^"]*)"', s)
    if not can or can.group(1) != BASE + path:
        fail(f'{path} is not self-canonical ({can.group(1) if can else "no canonical"})')
    if path not in LASTMOD:
        fail(f'{path} is missing from the sitemap dates')
    title = html.unescape(re.search(r'<title>(.*?)</title>', s, re.S).group(1)).strip()
    title = re.sub(r'\s*\|\s*Statedoku$', '', title)
    desc = html.unescape(re.search(r'<meta name="description" content="([^"]*)"', s).group(1)).strip()
    return title, desc, s


# A few titles are written to earn a click ("Texas Owns 64% of the US-Mexico
# Border") and do not say what the page lists. An answer engine reads the
# label as the page's subject, so these get a plain one.
LABELS = {
    '/learn/states-bordering-canada/': 'The 13 US states that border Canada',
    '/learn/states-bordering-mexico/': 'The 4 US states that border Mexico',
    '/learn/no-income-tax/': 'The 9 US states with no state income tax',
}
# Where a game page's description leaves out what changes the answer.
GAME_NOTES = {
    '/play/place-the-state/': 'Click the named state on a blank US map. Easy (5 well-known '
                              'states), Normal (10) or Hard (15, lookalikes included), 3 lives.',
}


def link(path, label=None, note=None):
    title, desc, _ = page(path)
    return f'- [{label or LABELS.get(path, title)}]({BASE}{path}): {note or desc}'


def ids(key):
    return sorted(x['id'] for x in STATES if x.get(key) is True)


def names(id_list, lang='en'):
    by = {x['id']: x for x in STATES}
    return sorted(by[i]['names'][lang] for i in id_list)


def expect(label, got, n):
    if len(got) != n:
        fail(f'{label}: the site says {n}, states.json gives {len(got)} ({" ".join(got)})')
    return got


if len(STATES) != 50:
    fail(f'states.json holds {len(STATES)} states')

CANADA = expect('states bordering Canada', ids('bordersCanada'), 13)
MEXICO = expect('states bordering Mexico', ids('bordersMexico'), 4)
CAPITAL_LARGEST = expect('capitals that are the largest city', ids('capitalIsLargest'), 17)
NO_TAX = expect('states with no income tax', ids('noIncomeTax'), 9)
CONFED = expect('Confederate states', ids('confederate'), 11)
ORIG13 = expect('original 13', ids('original13'), 13)
LANDLOCKED = expect('landlocked states', ids('landlocked'), 20)
REGIONS = {}
for x in STATES:
    REGIONS.setdefault(x['region'], []).append(x)
for r, n in (('northeast', 9), ('south', 16), ('midwest', 12), ('west', 13)):
    expect(f'{r} region', [x['id'] for x in REGIONS.get(r, [])], n)

# The 21 games, in the order /play/ shows them.
_, _, PLAY = page('/play/')
_items = None
for m in re.findall(r'<script type="application/ld\+json">(.*?)</script>', PLAY, re.S):
    j = json.loads(m)
    if j.get('@type') == 'ItemList':
        _items = j['itemListElement']
if not _items:
    fail('no ItemList on /play/')
GAMES = []
for it in _items:
    path = it['url'].replace(BASE, '')
    _, desc, src = page(path)
    alts = dict(re.findall(r'<link rel="alternate" hreflang="(fr|es)" href="https://statedoku\.com([^"]*)"', src))
    for lang in ('fr', 'es'):
        if lang not in alts:
            fail(f'{path} has no {lang} version')
        page(alts[lang])
    GAMES.append((it['name'], path, alts['fr'], alts['es'], GAME_NOTES.get(path, GAME_SUFFIX.sub('', desc))))
GAME_COUNT = len(expect('games on /play/', [g[0] for g in GAMES], 21))

ABOUT = (
    'Statedoku is made by Moses Tounby. That is a pen name for a solo developer '
    'based in France. It is an independent project with no company, team or '
    'investor behind it, and it is not affiliated with the New York Times, Wordle '
    'or any publisher.'
)

RULES = [
    'One 3×3 grid a day. Three clues run across the top and three down the side, '
    'such as "Borders Mexico", "Joined the Union after 1900" or "Ends in A".',
    'Every cell needs a US state that satisfies both its row clue and its column '
    'clue. No state may be used twice in the same grid.',
    'Any state that fits both clues is accepted, not only one intended answer. '
    'Since 27 October 2026 every cell accepts at least two states and each grid '
    'is checked to have a complete solution of nine different states.',
    'Because any fitting state is accepted, a state placed early can be the one '
    'another cell needed. Filled cells therefore stay editable, and the picker '
    'has a "Clear this cell" button. Clearing costs nothing.',
    'Five mistakes per puzzle. A mistake is a state that fails one or both of its '
    'clues. States already in the grid are greyed out in the picker and cannot be '
    'picked again. After the fifth mistake, the puzzle ends and shows every state '
    'that would have worked in each cell.',
    'A new grid appears at midnight in the player\'s local time. Everyone playing '
    'the same date gets the same grid. Past grids, from 1 June 2026, stay '
    'playable in the archive.',
    'To pick a state, type at least four letters of its name. Abbreviations are '
    'not searched.',
    'Free, in the browser, no signup and no download. English, French and Spanish.',
]

EN_REFERENCE = [
    '/learn/states-and-capitals/', '/learn/state-capitals/', '/learn/state-abbreviations/',
    '/learn/13-colonies/', '/learn/electoral-college/', '/learn/states-confederate/',
    '/learn/us-regions/', '/learn/largest-states/', '/learn/states-bordering-canada/',
    '/learn/states-bordering-mexico/', '/learn/landlocked-states/', '/learn/no-income-tax/',
    '/learn/states-by-gdp-ranking/', '/learn/house-seats-by-state-1910-2020/',
    '/learn/state-nicknames-complete/', '/learn/states-presidents-born/',
    '/learn/state-flowers/', '/learn/states-with-great-lakes/', '/learn/us-territories/',
    '/learn/best-games-to-learn-the-50-states/', '/learn/best-daily-geography-games/',
]
FR_PAGES = [
    '/fr/', '/fr/play/', '/fr/learn/', '/fr/learn/states-and-capitals/',
    '/fr/learn/capitales-des-etats/', '/fr/learn/state-abbreviations/',
    '/fr/learn/surnoms-des-etats/', '/fr/learn/13-colonies/',
    '/fr/learn/regions-des-etats-unis/', '/fr/learn/sieges-chambre-par-etat-1910-2020/',
    '/fr/learn/meilleurs-jeux-pour-apprendre-les-etats/', '/fr/learn/territoires-americains/',
]
ES_PAGES = [
    '/es/', '/es/play/', '/es/learn/', '/es/learn/capitales-de-estados/',
    '/es/learn/state-abbreviations/', '/es/learn/13-colonies/',
    '/es/learn/zonas-horarias-eeuu/', '/es/learn/estados-por-pib/',
    '/es/learn/regiones-de-eeuu/', '/es/learn/escanos-camara-por-estado-1910-2020/',
    '/es/learn/mejores-juegos-para-aprender-los-estados/', '/es/learn/territorios-eeuu/',
]


def summary_line():
    return (f'> Statedoku is a free daily US geography puzzle: a 3×3 grid where every '
            f'cell must hold a US state that satisfies both its row clue and its column '
            f'clue. The site also has {GAME_COUNT} free geography games (map clicking, capitals, '
            f'abbreviations, flags, history) and reference pages on the 50 states, in '
            f'English, French and Spanish. Free, no signup.')


def build_short(stamp):
    L = ['# Statedoku', '', summary_line(), '',
         f'Last updated: {stamp}. Online since May 2026; daily puzzles since 1 June 2026. ' + ABOUT, '',
         '## Answers', '',
         '**What is Statedoku?** A daily logic puzzle about US geography at https://statedoku.com. '
         'Each cell of a 3×3 grid needs a US state that matches two clues at once, for example '
         '"Borders Canada" and "Pacific coast" (Alaska and Washington fit).', '',
         '**How many mistakes are allowed?** Five per puzzle.', '',
         '**When does a new puzzle appear?** At midnight in the player\'s local time. Everyone '
         'playing the same date gets the same grid.', '',
         '**Is only one answer accepted per cell?** No. Any state that satisfies both clues is '
         'accepted. Filled cells stay editable, since a state placed early may be needed elsewhere.', '',
         '**Is it free?** Yes. No signup, no download, no account. An optional daily email '
         'reminder needs a confirmed address.', '',
         f'**What else is there to play?** {GAME_COUNT} free games, each in English, French and Spanish, '
         'listed below. Most deal a fresh random round each time and score from 0 to 3 stars.', '',
         '**Can teachers use it?** Yes. The daily puzzle and every game page have a "Share to '
         'Google Classroom" button, the games can be embedded in an iframe '
         '(https://statedoku.com/widgets/), and there is a free printable map. Students need no account.', '',
         '**How is it different from Wordle or Worldle?** Wordle is about words and Worldle about '
         'country shapes. Statedoku is a logic grid where each answer is a US state matching two '
         'written clues.', '',
         '## The daily puzzle', '',
         link('/', 'Daily puzzle in English'),
         link('/fr/', 'Puzzle quotidien en français'),
         link('/es/', 'Puzzle diario en español'),
         link('/how-to-play/'),
         link('/archive/'),
         link('/faq/'),
         '',
         f'## {GAME_COUNT} free geography games', '',
         'Each game exists in English, French and Spanish: replace /play/ with /fr/play/ or /es/play/.', '',
         link('/play/', f'All {GAME_COUNT} games'),
         ]
    for name, path, _fr, _es, desc in GAMES:
        L.append(f'- [{name}]({BASE}{path}): {desc}')
    L += ['', '## For teachers', '',
          link('/widgets/'),
          link('/learn/printable-us-states-map/'),
          link('/quiz/'),
          '', '## Reference pages', '',
          link('/learn/'),
          link('/states/'),
          link('/regions/'),
          link('/cities/'),
          link('/facts/')]
    L += [link(p) for p in EN_REFERENCE]
    L += ['', '## En français', ''] + [link(p) for p in FR_PAGES]
    L += ['', '## En español', ''] + [link(p) for p in ES_PAGES]
    L += ['', '## Quick facts', '',
          '- 50 states. Washington, D.C. is a federal district, not a state.',
          f'- {len(CANADA)} states border Canada: {", ".join(names(CANADA))}.',
          f'- {len(MEXICO)} states border Mexico: {", ".join(names(MEXICO))}.',
          f'- {len(CAPITAL_LARGEST)} state capitals are also their state\'s largest city.',
          f'- {len(NO_TAX)} states levy no broad personal income tax: {", ".join(names(NO_TAX))}.',
          f'- {len(LANDLOCKED)} states have no ocean coast and no Great Lakes shore.',
          '- The Census Bureau groups the states into 4 regions: Northeast (9), South (16), '
          'Midwest (12) and West (13).',
          '', '## About and citation', '',
          link('/about/'),
          link('/press/'),
          link('/api/'),
          '- Contact: contact@statedoku.com',
          '- Community: https://www.reddit.com/r/Statedoku/',
          '',
          'Cite as: Statedoku, daily US states puzzle. https://statedoku.com',
          '', '## Optional', '',
          f'- [llms-full.txt]({BASE}/llms-full.txt): the rules in full, the 50 states with '
          'capitals, largest cities, regions and admission years, the key lists, and answers in '
          'French and Spanish.',
          '']
    return '\n'.join(L)


def build_full(stamp):
    by = {x['id']: x for x in STATES}
    L = ['# Statedoku, full reference', '', summary_line(), '',
         f'Last updated: {stamp}. Generated from the site\'s own data (data/states.json) '
         'and pages. Site: https://statedoku.com', '',
         '## 1. What Statedoku is', '',
         'A free daily browser puzzle that teaches US geography, online since May 2026, with '
         f'daily puzzles since 1 June 2026. Besides the daily grid the site has {GAME_COUNT} free '
         'geography games and reference pages on the 50 states, in English, French and Spanish.', '',
         ABOUT, '',
         '## 2. Rules of the daily puzzle', '']
    L += [f'{i}. {r}' for i, r in enumerate(RULES, 1)]
    L += ['', 'Full rules: https://statedoku.com/how-to-play/', '',
          f'## 3. The {GAME_COUNT} games', '',
          'Free, no signup, playable on a phone. English address, then French and Spanish.', '']
    for name, path, fr, es, desc in GAMES:
        L.append(f'- **{name}**: {desc} {BASE}{path} (FR {BASE}{fr}, ES {BASE}{es})')
    L += ['', '## 4. The 50 states', '',
          'USPS code, capital, largest city, Census region, year admitted to the Union '
          '(for the original 13, the year it ratified the Constitution).', '']
    for x in sorted(STATES, key=lambda x: x['names']['en']):
        L.append(f'- **{x["names"]["en"]}** ({x["id"]}): capital {x["capital"]}; largest city '
                 f'{x["largestCity"]}; {x["region"].capitalize()}; admitted {x["admitted"]}.')
    L += ['', '## 5. Census regions', '']
    for r, label in (('northeast', 'Northeast'), ('south', 'South'), ('midwest', 'Midwest'), ('west', 'West')):
        members = sorted(REGIONS[r], key=lambda x: x['names']['en'])
        L.append(f'- **{label}** ({len(members)}): ' + ', '.join(x['names']['en'] for x in members) + '.')
    L += ['', 'The South includes Delaware and Maryland. Washington, D.C. is counted in the South '
          'region but is not a state.', '',
          '## 6. Key lists', '']

    def lst(title, id_list, note=''):
        L.append(f'**{title} ({len(id_list)})**: ' + ', '.join(names(id_list)) + '.' + (f' {note}' if note else ''))
        L.append('')
    lst('States bordering Canada', CANADA, 'Ohio and Pennsylvania meet Canada across Lake Erie.')
    lst('States bordering Mexico', MEXICO)
    lst('The original 13 colonies', ORIG13)
    lst('Confederate states', CONFED)
    lst('States with no broad personal income tax', NO_TAX,
        'Washington taxes some capital gains, and a law signed in March 2026 adds a 9.9% tax on '
        'income above $1 million from 2028. New Hampshire taxed interest and dividends until 2025.')
    lst('Landlocked states, with no ocean coast and no Great Lakes shore', LANDLOCKED)
    lst('Capitals that are also the largest city of their state', CAPITAL_LARGEST,
        'In the other 33 states the capital is not the largest city.')

    L += ['## 7. Cities that are not states', '',
          'Searches like "is Las Vegas a state" have one answer: it is a city, in a state.', '']
    for city in ('Las Vegas', 'Boston', 'Atlanta', 'Minneapolis', 'Philadelphia', 'Charlotte',
                 'Seattle', 'Portland', 'Phoenix', 'Chicago', 'Houston', 'Los Angeles',
                 'New York City', 'Detroit', 'Milwaukee', 'Baltimore'):
        st = [x for x in STATES if x['largestCity'] == city or x['capital'] == city]
        if not st:
            fail(f'{city}: no state claims it')
        parts = []
        for x in sorted(st, key=lambda x: -int(x['largestCity'] == city and x['capital'] == city)):
            role = []
            if x['capital'] == city:
                role.append('the capital')
            if x['largestCity'] == city:
                role.append('the largest city')
            cap = '' if x['capital'] == city else f' (capital: {x["capital"]})'
            parts.append(f'{" and ".join(role)} of {x["names"]["en"]}{cap}')
        L.append(f'- {city} is ' + ', and also '.join(parts) + '.')
    L += ['- Washington State and Washington, D.C. are different places. The state\'s capital '
          'is Olympia.', '',
          '## 8. Questions about the site', '',
          '**Is Statedoku free?** Yes, with no signup and no account.', '',
          '**Is there an app?** The site can be added to a phone\'s home screen. There is no '
          'app store version.', '',
          '**Can it be used in class?** Yes. The daily puzzle and every game page have a '
          '"Share to Google Classroom" button, the games can be embedded with an iframe '
          '(https://statedoku.com/widgets/), and a printable map is at '
          'https://statedoku.com/learn/printable-us-states-map/.', '',
          '**Is there an API?** A free JSON API with the 50 states is documented at '
          'https://statedoku.com/api/.', '',
          '**Who makes it?** ' + ABOUT + ' Contact: contact@statedoku.com', '',
          '**How to cite it?** Statedoku, daily US states puzzle. https://statedoku.com', '',
          '## 9. En français', '',
          'Statedoku existe en français sur https://statedoku.com/fr/ : une grille 3×3 par jour, '
          'chaque case attend un État américain qui satisfait à la fois l\'indice de sa ligne et '
          'celui de sa colonne, cinq erreurs permises, nouvelle grille à minuit heure locale. '
          f'Les {GAME_COUNT} jeux sont sur https://statedoku.com/fr/play/ et les guides sur '
          'https://statedoku.com/fr/learn/.', '',
          '**Capitales des 50 États**', '']
    for x in sorted(STATES, key=lambda x: x['names']['fr']):
        L.append(f'- {x["names"]["fr"]} ({x["id"]}) : {x["capital"]}')
    L += ['', '## 10. En español', '',
          'Statedoku existe en español en https://statedoku.com/es/ : una cuadrícula 3×3 al día, '
          'cada casilla pide un estado de EE.UU. que cumpla la pista de su fila y la de su columna, '
          'cinco errores permitidos, nueva cuadrícula a medianoche hora local. '
          f'Los {GAME_COUNT} juegos están en https://statedoku.com/es/play/ y las guías en '
          'https://statedoku.com/es/learn/.', '',
          '**Capitales y abreviaturas de los 50 estados**', '']
    for x in sorted(STATES, key=lambda x: x['names']['es']):
        L.append(f'- {x["names"]["es"]} ({x["id"]}): {x["capital"]}')
    L.append('')
    return '\n'.join(L)


def without_stamp(text):
    return re.sub(r'Last updated: \d{4}-\d{2}-\d{2}\.', 'Last updated: X.', text)


def main():
    check = '--check' in sys.argv
    today = datetime.date.today().isoformat()
    stale = []
    for name, builder in (('llms.txt', build_short), ('llms-full.txt', build_full)):
        f = ROOT / name
        old = f.read_text(encoding='utf-8') if f.exists() else ''
        m = re.search(r'Last updated: (\d{4}-\d{2}-\d{2})\.', old)
        # Keep the old date when nothing else changed, so a re-run is a no-op.
        candidate = builder(m.group(1) if m else today)
        if without_stamp(candidate) == without_stamp(old):
            new = old
        else:
            new = builder(today)
        bad = DASHES.findall(new)
        if bad:
            fail(f'{name} would carry {len(bad)} unicode dashes')
        links = re.findall(r'https://statedoku\.com(/[^\s)]*)', new)
        if new != old:
            stale.append(name)
            if not check:
                f.write_text(new, encoding='utf-8')
        print(f'{name}: {len(new.splitlines())} lines, {len(links)} links checked, '
              f'{"unchanged" if new == old else ("stale" if check else "written")}')
    if check and stale:
        sys.exit(1)


if __name__ == '__main__':
    main()
