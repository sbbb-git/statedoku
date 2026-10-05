#!/usr/bin/env python3
"""Build the three "House seats by state, 1910 to 2020" articles from Census data.

Source: the Census Bureau's historical apportionment file, saved unchanged in
scripts/data/census-apportionment-1910-2020.csv from
https://www2.census.gov/programs-surveys/decennial/2020/data/apportionment/apportionment.csv

Every number on the pages is computed here from that file, and the figures the
prose quotes are asserted against it, so a wrong sentence fails the build
instead of shipping. After the 2030 census, add its rows and re-run.

    python3 scripts/build-house-seats-page.py
"""
import csv, html, json, pathlib

ROOT = pathlib.Path(__file__).resolve().parent.parent
CSV = ROOT / 'scripts' / 'data' / 'census-apportionment-1910-2020.csv'
SRC = 'https://www2.census.gov/programs-surveys/decennial/2020/data/apportionment/apportionment.csv'
BASE = 'https://statedoku.com'
PATHS = {'en': '/learn/house-seats-by-state-1910-2020/',
         'fr': '/fr/learn/sieges-chambre-par-etat-1910-2020/',
         'es': '/es/learn/escanos-camara-por-estado-1910-2020/'}

# --------------------------------------------------------------------------
# Data
# --------------------------------------------------------------------------
num = lambda x: float(x.replace(',', '')) if x.strip() else None
rows = [r for r in csv.DictReader(open(CSV, encoding='utf-8'))
        if r['Geography Type'] == 'State' and r['Name'] not in ('District of Columbia', 'Puerto Rico')]
D = {}
for r in rows:
    D.setdefault(r['Name'], {})[int(r['Year'])] = r
STATES = sorted(D)
assert len(STATES) == 50
# 1920 produced no reapportionment: the file repeats the 1910 seats (plus the
# Arizona and New Mexico seats of 1912). It is left out of every series.
YEARS = [1910] + list(range(1930, 2030, 10))


def seats(n, y):
    v = num(D[n][y]['Number of Representatives'])
    return int(v) if v else None


def pop(n, y):
    return int(num(D[n][y]['Resident Population']))


def first(n):
    """First apportioned seats: 1910, or 1912 for AZ and NM, or 1960 for AK and HI."""
    if seats(n, 1910):
        return 1910, seats(n, 1910)
    if seats(n, 1920):
        return 1912, seats(n, 1920)
    return 1960, seats(n, 1960)


REGION = {}
for r, ss in {'NE': 'Connecticut,Maine,Massachusetts,New Hampshire,Rhode Island,Vermont,New Jersey,New York,Pennsylvania',
              'MW': 'Illinois,Indiana,Michigan,Ohio,Wisconsin,Iowa,Kansas,Minnesota,Missouri,Nebraska,North Dakota,South Dakota',
              'S': 'Delaware,Florida,Georgia,Maryland,North Carolina,South Carolina,Virginia,West Virginia,Alabama,Kentucky,Mississippi,Tennessee,Arkansas,Louisiana,Oklahoma,Texas',
              'W': 'Arizona,Colorado,Idaho,Montana,Nevada,New Mexico,Utah,Wyoming,Alaska,California,Hawaii,Oregon,Washington'}.items():
    for s in ss.split(','):
        REGION[s] = r
assert set(REGION) == set(STATES)


def region_seats(r, y):
    return sum(seats(n, y) or 0 for n in STATES if REGION[n] == r)


def region_share(r, y):
    return 100 * sum(pop(n, y) for n in STATES if REGION[n] == r) / sum(pop(n, y) for n in STATES)


REG = {r: [region_seats(r, y) for y in YEARS] for r in ('NE', 'MW', 'S', 'W')}
NORTH = [REG['NE'][i] + REG['MW'][i] for i in range(len(YEARS))]
SUNW = [REG['S'][i] + REG['W'][i] for i in range(len(YEARS))]


def moves(y):
    prev = YEARS[YEARS.index(y) - 1]
    ch = {}
    for n in STATES:
        a, b = seats(n, prev) or 0, seats(n, y) or 0
        if prev == 1910 and n in ('Arizona', 'New Mexico'):
            a = seats(n, 1920)
        if b != a:
            ch[n] = b - a
    return ch


def streak(n):
    seq = [seats(n, y) for y in YEARS if seats(n, y)]
    diffs = [seq[i] - seq[i - 1] for i in range(1, len(seq))]
    k = 0
    for d in reversed(diffs):
        if d == 0 or (k and (d > 0) != (k > 0)):
            break
        k += 1 if d > 0 else -1
    return k


def peak(n):
    vals = [(y, seats(n, y)) for y in YEARS if seats(n, y)]
    p = max(v for _, v in vals)
    return p, [y for y, v in vals if v == p], len(vals)


# Every figure the prose quotes, checked against the file.
assert (first('California')[1], seats('California', 2020)) == (11, 52)
assert (seats('Pennsylvania', 1910), seats('Pennsylvania', 2020)) == (36, 17)
assert (seats('New York', 1910), peak('New York')[:2], seats('New York', 2020)) == (43, (45, [1930, 1940]), 26)
assert (seats('Florida', 1910), seats('Florida', 2020), streak('Florida')) == (4, 28, 10)
assert streak('Pennsylvania') == -10 and streak('New York') == -8 and streak('Texas') == 8
assert streak('Ohio') == -6 and streak('Illinois') == -5 and streak('Michigan') == -5
assert (seats('Texas', 1910), seats('Texas', 2020)) == (18, 38)
assert (first('Arizona'), seats('Arizona', 2020)) == ((1912, 1), 9)
assert (seats('Michigan', 1910), peak('Michigan')[:2], seats('Michigan', 2020)) == (13, (19, [1960, 1970]), 13)
assert (seats('West Virginia', 1910), seats('West Virginia', 2020)) == (6, 2)
assert peak('California')[:2] == (53, [2000, 2010])
assert (NORTH[0], SUNW[0], NORTH[-1], SUNW[-1]) == (266, 167, 167, 268)
assert (REG['NE'][0], REG['NE'][-1], REG['MW'][0], REG['MW'][-1]) == (123, 76, 143, 91)
assert (REG['W'][0], REG['W'][-1], REG['S'][0], REG['S'][-1]) == (31, 104, 136, 164)
assert all(REG['NE'][i] < REG['NE'][i - 1] and REG['MW'][i] < REG['MW'][i - 1] and REG['W'][i] > REG['W'][i - 1]
           for i in range(1, len(YEARS)))
assert REG['W'][YEARS.index(1990)] > REG['NE'][YEARS.index(1990)] and REG['W'][YEARS.index(1980)] < REG['NE'][YEARS.index(1980)]
assert sum(-v for v in moves(1930).values() if v < 0) == 27 and moves(1930)['California'] == 9
assert moves(1980)['New York'] == -5 and min(v for y in YEARS[1:] for v in moves(y).values()) == -5
assert moves(2010)['Texas'] == 4
assert [n for n in STATES if len({seats(n, y) for y in YEARS if seats(n, y)}) == 1] == \
    ['Alaska', 'Delaware', 'Hawaii', 'Idaho', 'New Hampshire', 'Wyoming']
assert [seats('Montana', y) for y in (1980, 1990, 2010, 2020)] == [2, 1, 1, 2]
assert [n for n in STATES if num(D[n][2020]['Percent Change in Resident Population']) < 0] == ['Illinois', 'Mississippi', 'West Virginia']
assert round(region_share('W', 1910), 1) == 7.7 and round(region_share('W', 2020), 1) == 23.8
avg = {n: int(num(D[n][2020]['Average Apportionment Population Per Representative'])) for n in STATES}
assert min(avg, key=avg.get) == 'Montana' and avg['Montana'] == 542704
assert max(avg, key=avg.get) == 'Delaware' and avg['Delaware'] == 990837
assert (pop('Florida', 1910), pop('Florida', 2020)) == (752619, 21538187)
assert sum(pop(n, 2020) for n in STATES) == 330759736

GROWTH = sorted(((pop(n, 2020) / pop(n, 1910), n) for n in STATES), reverse=True)

# --------------------------------------------------------------------------
# Text
# --------------------------------------------------------------------------
NAMES = {s['names']['en']: s['names'] for s in json.load(open(ROOT / 'data' / 'states.json', encoding='utf-8'))}
SLUG = {n: n.lower().replace(' ', '-') for n in STATES}


def fmt(lang, n, dec=None):
    s = f'{n:,.{dec}f}' if dec is not None else f'{n:,}'
    if lang == 'fr':
        return s.replace(',', ' ').replace('.', ',')
    if lang == 'es':
        return s.replace(',', '#').replace('.', ',').replace('#', '.')
    return s


def signed(v):
    return f'+{v}' if v > 0 else str(v)


T = {}
T['en'] = dict(
    lang='en', home='/', learn='/learn/', home_name='Home', learn_name='Learn', back='← Home',
    title='House Seats by State, 1910 to 2020 | Statedoku',
    og_title='House seats by state, 1910 to 2020',
    desc='Every state\'s US House seats at each census from 1910 to 2020, from Census Bureau data: who gained, who lost, and how the South and West overtook the North.',
    h1='How House seats moved between the states, 1910 to 2020',
    sub='A century of reapportionment, census by census and state by state, computed from the Census Bureau\'s own figures.',
    crumb='House seats by state, 1910 to 2020',
    intro=(
        '<p>The US House of Representatives has had 435 seats since 1913, and after every census they are shared out again '
        'in proportion to each state\'s population. Over a century that quiet arithmetic has moved more political weight than '
        'almost any election. In 1910 the <strong>Northeast and the Midwest held 266 seats</strong> and the <strong>South and the West 167</strong>. '
        'After the 2020 census the figures were 167 and 268, almost exactly the reverse.</p>'
        '<p>This page follows that shift census by census and state by state. Every number comes from the apportionment file the '
        'Census Bureau publishes for the censuses of 1910 to 2020, and the tables below are computed from it.</p>'),
    key_h='The century in four numbers',
    keys=[('+41', 'seats for California, from 11 in 1910 to 52 today, the largest gain of any state'),
          ('-19', 'seats for Pennsylvania, from 36 to 17, the largest loss'),
          ('27', 'seats changed states after the 1930 census, the biggest reshuffle, because the 1920 census never produced one'),
          ('104', 'seats in the West, against 31 in 1910 (33 once Arizona and New Mexico joined in 1912)')],
    how_h='How the seats are shared out',
    how=(
        '<p>The Constitution orders a count of the population every ten years and gives every state at least one representative. '
        'The Apportionment Act of 1911 set the House at 433 members, with one more seat each for Arizona and New Mexico on their '
        'admission in 1912, which brought the total to 435.</p>'
        '<p>The 1920 census is the only one in American history that was never followed by a reapportionment. It was the first to '
        'find more Americans living in urban areas than in rural ones, rural members of Congress resisted the shift, and the 1910 '
        'allocation stayed in force for twenty years. The Reapportionment Act of 1929 ended the stalemate: it fixed the House at '
        '435 and made the process automatic after each census. That is why this page skips from 1910 to 1930.</p>'
        '<p>Since the 1940 census the seats have been divided by the <strong>method of equal proportions</strong>, written into law '
        'in 1941. The House grew to 437 for a few years after Alaska and Hawaii joined in 1959, and went back to 435 with the '
        'apportionment of the 1960 census. New seat counts take effect at the House elections two years after the census, so the '
        '2020 count governs the elections of 2022 to 2030 and sets each state\'s electoral votes for the 2024 and 2028 presidential '
        'elections.</p>'),
    chart_h='North against South and West',
    chart_note='Seats held after each census by the Northeast and Midwest together, and by the South and West together. Hover or use the arrow keys for the values; the table below lists them by region.',
    s_north='Northeast + Midwest', s_south='South + West', axis='seats',
    reg_h='Seats by Census region after each census',
    reg_cols=['Census', 'Northeast', 'Midwest', 'South', 'West', 'West share of US population'],
    reg_after=(
        '<p>The Northeast lost seats at every census from 1930 on, falling from 123 to 76, and the Midwest did the same, from 143 to 91. '
        'The South held between 133 and 136 seats for half a century, then gained at every census from 1970, reaching 164. '
        'The West gained at every census, from 31 seats to 104, and has had more seats than the Northeast since 1990. '
        'Its share of the country\'s population rose from 7.7% to 23.8%.</p>'),
    all_h='Every state, 1910 to 2020',
    all_intro='Seats after selected censuses, the change since the state\'s first apportionment in the period, and its peak. Arizona and New Mexico start from their admission in 1912, Alaska and Hawaii from 1960.',
    all_cols=['State', '1910', '1950', '1980', '2020', 'Change', 'Peak'],
    not_yet='not yet', every='every census',
    win_h='The biggest winners',
    win=(
        '<p><strong>California</strong> had 11 seats in 1910 and has 52 today. It gained at every census from 1930 to 2000, including '
        'nine seats in 1930 alone, held 53 after 2000 and 2010, and lost one in 2020, the first loss in its history as a state. '
        'Its population went from 2.4 million to 39.5 million.</p>'
        '<p><strong>Florida</strong> is the steadiest climber of all: it gained seats at ten censuses in a row, every one from 1930 to '
        '2020, going from 4 to 28. Its population was 752,619 in 1910 and 21,538,187 in 2020, 28.6 times as many.</p>'
        '<p><strong>Texas</strong> went from 18 seats to 38, with a gain at every census since 1950, eight in a row, including four '
        'seats after 2010. <strong>Arizona</strong> entered the Union in 1912 with one seat and has nine. Further down the list, '
        'Washington doubled from 5 to 10, Colorado from 4 to 8, and Nevada went from 1 to 4.</p>'),
    lose_h='The biggest losers',
    lose=(
        '<p><strong>Pennsylvania</strong> lost seats at ten censuses in a row, every one from 1930 to 2020, falling from 36 to 17. '
        'No state has lost more.</p>'
        '<p><strong>New York</strong> peaked at 45 seats after the 1930 and 1940 censuses, a delegation no state matched until '
        'California reached 52 in 1990. It has lost seats at eight censuses in a row since 1950, including five at once after 1980, '
        'the largest single loss of the century, and has 26.</p>'
        '<p>The Midwest shrank across the board. Illinois went from 27 seats to 17, Missouri from 16 to 8 and Iowa from 11 to 4. '
        'Ohio held 24 seats from 1930 to 1960 and has 15 after six losses in a row. <strong>Michigan</strong> rose from 13 to 19 '
        'with the car industry, peaking in 1960 and 1970, and is back at 13 after five losses in a row. <strong>West Virginia</strong> '
        'went from 6 seats to 2, and was one of three states, with Illinois and Mississippi, whose population fell between 2010 and 2020.</p>'),
    same_h='The states that never moved',
    same=(
        '<p>Delaware and Wyoming have had one seat after every census in the period, and Idaho and New Hampshire two. Alaska (one seat) '
        'and Hawaii (two) have not changed since their first apportionment in 1960. Montana came close: two seats until the 1990 census '
        'took one away, then its second seat back in 2020.</p>'),
    moves_h='How many seats moved at each census',
    moves_cols=['Census', 'Seats that changed state', 'Largest gain', 'Largest loss'],
    moves_note='1960 includes the three seats Alaska and Hawaii received on their first apportionment.',
    states_word='states', each='each',
    grow_h='Where Americans moved: population 1910 and 2020',
    grow_intro='The seats follow the people. These are the six fastest and the six slowest growing states over the 110 years.',
    grow_cols=['State', '1910', '2020', 'Growth'],
    grow_fast='Fastest growing', grow_slow='Slowest growing', times='×',
    seat_h='How many people one seat represents',
    seat=(
        '<p>In 1910 the House had one member for roughly every 212,000 residents. After the 2020 census the Census Bureau\'s average '
        'was 761,169 people per seat. Because seats come whole, the gap between states is wide: <strong>Montana\'s</strong> two seats '
        'average 542,704 people each, the fewest, while <strong>Delaware\'s</strong> single seat covers 990,837, the most.</p>'),
    full_h='The full table: seats after every census',
    full_note='1920 is left out because no reapportionment followed it.',
    src_h='Source and method',
    src=(
        '<p>All figures come from the Census Bureau\'s historical apportionment file (<a href="' + SRC + '" rel="noopener">apportionment.csv</a>), '
        'which gives the resident population and the number of representatives of every state at each census from 1910 to 2020. '
        'Regions are the four Census Bureau regions. Seat counts are the ones apportioned at each census, not the number of members '
        'sitting on a given day. The page is rebuilt from that file by a script, and each figure quoted in the text is checked against it.</p>'),
    faq_h='Frequently asked questions',
    faq=[('Which state has gained the most House seats since 1910?',
          'California, from 11 seats in 1910 to 52 after the 2020 census, a gain of 41. Florida grew the most in proportion, from 4 seats to 28.'),
         ('Which state has lost the most House seats?',
          'Pennsylvania, from 36 seats in 1910 to 17 after the 2020 census, a loss of 19. New York lost 17 over the same period, from 43 to 26, after a peak of 45.'),
         ('Why were House seats not reapportioned after the 1920 census?',
          'Congress never passed a reapportionment law for the 1920 census, the first to show more Americans in urban areas than rural ones. The 1910 allocation stayed in force until the Reapportionment Act of 1929 made the process automatic from the 1930 census on.'),
         ('Why does the House have 435 members?',
          'The Apportionment Act of 1911 set 433 seats plus one each for Arizona and New Mexico on admission, making 435, and the Reapportionment Act of 1929 fixed that number. The House briefly had 437 members after Alaska and Hawaii joined in 1959, until the 1960 census apportionment.'),
         ('Which states have never gained or lost a seat since 1910?',
          'Delaware and Wyoming, with one seat each, and Idaho and New Hampshire, with two. Alaska and Hawaii have not changed since their first apportionment in 1960.'),
         ('When will House seats change next?',
          'After the 2030 census. The Census Bureau must deliver the state counts within nine months of census day, and the new seat numbers apply from the 2032 elections, including that year\'s presidential election.')],
    cta_h='Test yourself on the electoral map', cta_p='Which states have the most electoral votes? The quiz takes two minutes.',
    cta_a='Play the quiz →', cta_url='/play/electoral-college/',
    rel_h='Related guides',
    related=[('/learn/electoral-college/', 'Electoral college votes by state'), ('/learn/states-by-population/', 'States by population'),
             ('/learn/swing-states/', 'Swing states'), ('/learn/us-regions/', 'The 4 US regions'),
             ('/learn/states-by-statehood-year/', 'States by statehood year'), ('/states/', 'All 50 state pages')],
    footer='<a href="/about/">About</a> &nbsp;·&nbsp; <a href="/learn/">Learn</a> &nbsp;·&nbsp; <a href="/states/">States</a> &nbsp;·&nbsp; <a href="/quiz/">Quiz</a> &nbsp;·&nbsp; <a href="/facts/">Facts</a>',
    state_link=lambda n: f'/states/{SLUG[n]}/',
)

T['fr'] = dict(
    lang='fr', home='/fr/', learn='/fr/learn/', home_name='Accueil', learn_name='Apprendre', back='← Apprendre',
    title='Sièges à la Chambre par État, 1910 à 2020 | Statedoku',
    og_title='Les sièges à la Chambre par État, de 1910 à 2020',
    desc='Les sièges de chaque État à la Chambre des représentants à chaque recensement de 1910 à 2020, d\'après le Census Bureau : gains, pertes et bascule vers le Sud.',
    h1='Comment les sièges de la Chambre ont changé d\'État, de 1910 à 2020',
    sub='Un siècle de répartition, recensement par recensement et État par État, calculé à partir des chiffres du Census Bureau.',
    crumb='Sièges à la Chambre par État, 1910 à 2020',
    intro=(
        '<p>La Chambre des représentants des États-Unis compte 435 sièges depuis 1913, et après chaque recensement ils sont '
        'redistribués selon la population de chaque État. En un siècle, cette arithmétique discrète a déplacé plus de poids politique '
        'que presque n\'importe quelle élection. En 1910, le <strong>Nord-Est et le Midwest détenaient 266 sièges</strong>, le '
        '<strong>Sud et l\'Ouest 167</strong>. Après le recensement de 2020, c\'était 167 et 268 : presque exactement l\'inverse.</p>'
        '<p>Cette page suit ce basculement recensement par recensement et État par État. Chaque chiffre vient du fichier de répartition '
        'que publie le Census Bureau pour les recensements de 1910 à 2020, et les tableaux sont calculés à partir de lui.</p>'),
    key_h='Le siècle en quatre chiffres',
    keys=[('+41', 'sièges pour la Californie, de 11 en 1910 à 52 aujourd\'hui, le plus fort gain'),
          ('-19', 'sièges pour la Pennsylvanie, de 36 à 17, la plus forte perte'),
          ('27', 'sièges ont changé d\'État après le recensement de 1930, le plus grand remaniement, parce que celui de 1920 n\'en a produit aucun'),
          ('104', 'sièges pour l\'Ouest, contre 31 en 1910 (33 après l\'entrée de l\'Arizona et du Nouveau-Mexique en 1912)')],
    how_h='Comment les sièges sont répartis',
    how=(
        '<p>La Constitution impose un recensement tous les dix ans et garantit au moins un représentant à chaque État. La loi de '
        'répartition de 1911 a fixé la Chambre à 433 membres, plus un siège chacun pour l\'Arizona et le Nouveau-Mexique à leur '
        'admission en 1912, soit 435 au total.</p>'
        '<p>Le recensement de 1920 est le seul de l\'histoire américaine à n\'avoir été suivi d\'aucune nouvelle répartition. Il était '
        'le premier à trouver plus d\'Américains en zone urbaine qu\'en zone rurale, les élus ruraux du Congrès ont résisté, et la '
        'répartition de 1910 est restée en vigueur vingt ans. La loi de 1929 a mis fin au blocage : elle a fixé la Chambre à 435 sièges '
        'et rendu la répartition automatique après chaque recensement. C\'est pourquoi cette page passe directement de 1910 à 1930.</p>'
        '<p>Depuis le recensement de 1940, les sièges sont répartis selon la <strong>méthode des proportions égales</strong>, inscrite '
        'dans la loi en 1941. La Chambre est passée à 437 membres pendant quelques années après l\'entrée de l\'Alaska et d\'Hawaï en '
        '1959, puis est revenue à 435 avec la répartition du recensement de 1960. Les nouveaux sièges s\'appliquent aux élections de la '
        'Chambre deux ans après le recensement : le décompte de 2020 vaut pour les élections de 2022 à 2030 et fixe le nombre de grands '
        'électeurs de chaque État pour les présidentielles de 2024 et 2028.</p>'),
    chart_h='Le Nord face au Sud et à l\'Ouest',
    chart_note='Sièges détenus après chaque recensement par le Nord-Est et le Midwest réunis, et par le Sud et l\'Ouest réunis. Survolez le graphique ou utilisez les flèches du clavier pour lire les valeurs ; le tableau ci-dessous les donne par région.',
    s_north='Nord-Est + Midwest', s_south='Sud + Ouest', axis='sièges',
    reg_h='Sièges par région du Census après chaque recensement',
    reg_cols=['Recensement', 'Nord-Est', 'Midwest', 'Sud', 'Ouest', 'Part de l\'Ouest dans la population'],
    reg_after=(
        '<p>Le Nord-Est a perdu des sièges à chaque recensement depuis 1930, passant de 123 à 76, et le Midwest aussi, de 143 à 91. '
        'Le Sud est resté entre 133 et 136 sièges pendant un demi-siècle, puis a progressé à chaque recensement depuis 1970 pour '
        'atteindre 164. L\'Ouest a gagné des sièges à chaque recensement, de 31 à 104, et en compte plus que le Nord-Est depuis 1990. '
        'Sa part de la population du pays est passée de 7,7 % à 23,8 %.</p>'),
    all_h='Chaque État, de 1910 à 2020',
    all_intro='Sièges après quelques recensements, variation depuis la première répartition de l\'État sur la période, et maximum atteint. L\'Arizona et le Nouveau-Mexique partent de leur admission en 1912, l\'Alaska et Hawaï de 1960.',
    all_cols=['État', '1910', '1950', '1980', '2020', 'Variation', 'Maximum'],
    not_yet='pas encore', every='chaque recensement',
    win_h='Les grands gagnants',
    win=(
        '<p>La <strong>Californie</strong> avait 11 sièges en 1910 et en a 52 aujourd\'hui. Elle a progressé à chaque recensement de '
        '1930 à 2000, dont neuf sièges d\'un coup en 1930, en a détenu 53 après 2000 et 2010, puis en a perdu un en 2020, la première '
        'perte de son histoire. Sa population est passée de 2,4 à 39,5 millions d\'habitants.</p>'
        '<p>La <strong>Floride</strong> est la plus régulière : elle a gagné des sièges à dix recensements consécutifs, tous ceux de '
        '1930 à 2020, passant de 4 à 28. Elle comptait 752 619 habitants en 1910 et 21 538 187 en 2020, 28,6 fois plus.</p>'
        '<p>Le <strong>Texas</strong> est passé de 18 à 38 sièges, avec un gain à chaque recensement depuis 1950, huit d\'affilée, dont '
        'quatre sièges après 2010. L\'<strong>Arizona</strong> est entré dans l\'Union en 1912 avec un siège et en compte neuf. Plus loin, '
        'l\'État de Washington a doublé de 5 à 10, le Colorado de 4 à 8, et le Nevada est passé de 1 à 4.</p>'),
    lose_h='Les grands perdants',
    lose=(
        '<p>La <strong>Pennsylvanie</strong> a perdu des sièges à dix recensements consécutifs, tous ceux de 1930 à 2020, tombant de '
        '36 à 17. Aucun État n\'a perdu davantage.</p>'
        '<p>L\'<strong>État de New York</strong> a culminé à 45 sièges après les recensements de 1930 et 1940, une délégation qu\'aucun '
        'État n\'a égalée avant que la Californie n\'atteigne 52 en 1990. Il a perdu des sièges à huit recensements d\'affilée depuis '
        '1950, dont cinq d\'un coup après 1980, la plus forte perte du siècle, et en compte 26.</p>'
        '<p>Le Midwest a reculé partout. L\'Illinois est passé de 27 sièges à 17, le Missouri de 16 à 8 et l\'Iowa de 11 à 4. L\'Ohio a '
        'gardé 24 sièges de 1930 à 1960 et en a 15 après six pertes d\'affilée. Le <strong>Michigan</strong> est monté de 13 à 19 avec '
        'l\'industrie automobile, son maximum en 1960 et 1970, et est revenu à 13 après cinq pertes consécutives. La <strong>Virginie-Occidentale</strong> '
        'est passée de 6 sièges à 2, et fait partie des trois États, avec l\'Illinois et le Mississippi, dont la population a baissé entre 2010 et 2020.</p>'),
    same_h='Les États qui n\'ont jamais bougé',
    same=(
        '<p>Le Delaware et le Wyoming ont eu un siège après chaque recensement de la période, l\'Idaho et le New Hampshire deux. L\'Alaska '
        '(un siège) et Hawaï (deux) n\'ont pas changé depuis leur première répartition en 1960. Le Montana a failli en faire partie : '
        'deux sièges jusqu\'au recensement de 1990, qui lui en a retiré un, puis son second siège retrouvé en 2020.</p>'),
    moves_h='Combien de sièges ont bougé à chaque recensement',
    moves_cols=['Recensement', 'Sièges qui ont changé d\'État', 'Plus fort gain', 'Plus forte perte'],
    moves_note='1960 inclut les trois sièges reçus par l\'Alaska et Hawaï lors de leur première répartition.',
    states_word='États', each='chacun',
    grow_h='Où sont partis les Américains : population en 1910 et en 2020',
    grow_intro='Les sièges suivent les habitants. Voici les six États à la croissance la plus rapide et les six à la plus lente sur 110 ans.',
    grow_cols=['État', '1910', '2020', 'Croissance'],
    grow_fast='Croissance la plus rapide', grow_slow='Croissance la plus lente', times='×',
    seat_h='Combien d\'habitants pour un siège',
    seat=(
        '<p>En 1910, la Chambre comptait un membre pour environ 212 000 habitants. Après le recensement de 2020, la moyenne du '
        'Census Bureau était de 761 169 personnes par siège. Comme les sièges ne se divisent pas, l\'écart entre États est large : les '
        'deux sièges du <strong>Montana</strong> représentent 542 704 personnes chacun, le plus petit chiffre, et le siège unique du '
        '<strong>Delaware</strong> en couvre 990 837, le plus grand.</p>'),
    full_h='Le tableau complet : sièges après chaque recensement',
    full_note='1920 n\'y figure pas, faute de nouvelle répartition cette année-là.',
    src_h='Source et méthode',
    src=(
        '<p>Tous les chiffres viennent du fichier historique de répartition du Census Bureau (<a href="' + SRC + '" rel="noopener">apportionment.csv</a>), '
        'qui donne la population résidente et le nombre de représentants de chaque État à chaque recensement de 1910 à 2020. Les régions '
        'sont les quatre régions du Census Bureau. Les sièges sont ceux attribués à chaque recensement, pas le nombre d\'élus en fonction '
        'un jour donné. La page est reconstruite à partir de ce fichier par un script, qui vérifie chaque chiffre cité dans le texte.</p>'),
    faq_h='Questions fréquentes',
    faq=[('Quel État a gagné le plus de sièges à la Chambre depuis 1910 ?',
          'La Californie, passée de 11 sièges en 1910 à 52 après le recensement de 2020, soit 41 de plus. La Floride a le plus progressé en proportion, de 4 sièges à 28.'),
         ('Quel État a perdu le plus de sièges ?',
          'La Pennsylvanie, de 36 sièges en 1910 à 17 après le recensement de 2020, soit 19 de moins. L\'État de New York en a perdu 17 sur la même période, de 43 à 26, après un maximum de 45.'),
         ('Pourquoi les sièges n\'ont-ils pas été redistribués après le recensement de 1920 ?',
          'Le Congrès n\'a jamais voté de répartition pour le recensement de 1920, le premier à compter plus d\'Américains en ville qu\'à la campagne. La répartition de 1910 est restée en vigueur jusqu\'à la loi de 1929, qui a rendu le processus automatique à partir du recensement de 1930.'),
         ('Pourquoi la Chambre compte-t-elle 435 membres ?',
          'La loi de 1911 a fixé 433 sièges plus un chacun pour l\'Arizona et le Nouveau-Mexique à leur admission, soit 435, et la loi de 1929 a figé ce nombre. La Chambre a brièvement compté 437 membres après l\'entrée de l\'Alaska et d\'Hawaï en 1959, jusqu\'à la répartition du recensement de 1960.'),
         ('Quels États n\'ont jamais gagné ni perdu de siège depuis 1910 ?',
          'Le Delaware et le Wyoming, avec un siège chacun, et l\'Idaho et le New Hampshire, avec deux. L\'Alaska et Hawaï n\'ont pas changé depuis leur première répartition en 1960.'),
         ('Quand les sièges changeront-ils la prochaine fois ?',
          'Après le recensement de 2030. Le Census Bureau doit transmettre les chiffres des États dans les neuf mois suivant le jour du recensement, et les nouveaux sièges s\'appliqueront à partir des élections de 2032, présidentielle comprise.')],
    cta_h='Testez-vous sur la carte électorale', cta_p='Quels États ont le plus de grands électeurs ? Le quiz prend deux minutes.',
    cta_a='Jouer au quiz →', cta_url='/fr/play/electoral-college/',
    rel_h='Guides associés',
    related=[('/fr/learn/college-electoral/', 'Le Collège électoral'), ('/fr/learn/regions-des-etats-unis/', 'Les 4 régions des États-Unis'),
             ('/fr/learn/liste-des-50-etats/', 'La liste des 50 États'), ('/fr/learn/systeme-federal-americain/', 'Le système fédéral américain'),
             ('/fr/learn/13-colonies/', 'Les 13 colonies'), ('/fr/learn/', 'Apprendre les 50 États')],
    footer='<a href="/fr/about/">À propos</a> &nbsp;·&nbsp; <a href="/fr/learn/">Apprendre</a> &nbsp;·&nbsp; <a href="/states/">Tous les états</a> &nbsp;·&nbsp; <a href="/quiz/">Quiz</a> &nbsp;·&nbsp; <a href="/fr/faq/">FAQ</a>',
    state_link=None,
)

T['es'] = dict(
    lang='es', home='/es/', learn='/es/learn/', home_name='Inicio', learn_name='Aprender', back='← Aprender',
    title='Escaños de la Cámara por estado, 1910 a 2020 | Statedoku',
    og_title='Escaños de la Cámara por estado, de 1910 a 2020',
    desc='Los escaños de cada estado en la Cámara de Representantes en cada censo de 1910 a 2020, según el Census Bureau: quién ganó, quién perdió y el giro al Sur.',
    h1='Cómo se movieron los escaños de la Cámara entre estados, de 1910 a 2020',
    sub='Un siglo de reparto, censo por censo y estado por estado, calculado con las cifras del Census Bureau.',
    crumb='Escaños de la Cámara por estado, 1910 a 2020',
    intro=(
        '<p>La Cámara de Representantes de Estados Unidos tiene 435 escaños desde 1913, y después de cada censo se reparten de nuevo '
        'según la población de cada estado. En un siglo, esa aritmética silenciosa ha movido más peso político que casi cualquier '
        'elección. En 1910 el <strong>Noreste y el Medio Oeste tenían 266 escaños</strong> y el <strong>Sur y el Oeste 167</strong>. '
        'Tras el censo de 2020 las cifras eran 167 y 268: casi exactamente al revés.</p>'
        '<p>Esta página sigue ese cambio censo por censo y estado por estado. Cada cifra procede del archivo de reparto que publica el '
        'Census Bureau para los censos de 1910 a 2020, y las tablas se calculan a partir de él.</p>'),
    key_h='El siglo en cuatro cifras',
    keys=[('+41', 'escaños para California, de 11 en 1910 a 52 hoy, la mayor ganancia de cualquier estado'),
          ('-19', 'escaños para Pensilvania, de 36 a 17, la mayor pérdida'),
          ('27', 'escaños cambiaron de estado tras el censo de 1930, el mayor reajuste, porque el de 1920 no produjo ninguno'),
          ('104', 'escaños en el Oeste, frente a 31 en 1910 (33 tras la entrada de Arizona y Nuevo México en 1912)')],
    how_h='Cómo se reparten los escaños',
    how=(
        '<p>La Constitución ordena contar la población cada diez años y garantiza al menos un representante a cada estado. La Ley de '
        'Reparto de 1911 fijó la Cámara en 433 miembros, más un escaño para Arizona y otro para Nuevo México al ser admitidos en 1912, '
        'con lo que el total llegó a 435.</p>'
        '<p>El censo de 1920 es el único de la historia estadounidense que no fue seguido de un nuevo reparto. Fue el primero en encontrar '
        'más estadounidenses en zonas urbanas que en zonas rurales, los congresistas rurales se resistieron y el reparto de 1910 siguió en '
        'vigor veinte años. La Ley de 1929 acabó con el bloqueo: fijó la Cámara en 435 escaños e hizo el reparto automático después de '
        'cada censo. Por eso esta página salta de 1910 a 1930.</p>'
        '<p>Desde el censo de 1940 los escaños se reparten por el <strong>método de proporciones iguales</strong>, fijado por ley en 1941. '
        'La Cámara tuvo 437 miembros durante unos años tras la entrada de Alaska y Hawái en 1959, y volvió a 435 con el reparto del censo '
        'de 1960. Los nuevos escaños rigen en las elecciones a la Cámara dos años después del censo: el recuento de 2020 vale para las '
        'elecciones de 2022 a 2030 y fija los votos electorales de cada estado para las presidenciales de 2024 y 2028.</p>'),
    chart_h='El Norte frente al Sur y el Oeste',
    chart_note='Escaños tras cada censo del Noreste y el Medio Oeste juntos, y del Sur y el Oeste juntos. Pase el cursor o use las flechas del teclado para ver los valores; la tabla de abajo los da por región.',
    s_north='Noreste + Medio Oeste', s_south='Sur + Oeste', axis='escaños',
    reg_h='Escaños por región del censo tras cada censo',
    reg_cols=['Censo', 'Noreste', 'Medio Oeste', 'Sur', 'Oeste', 'Peso del Oeste en la población'],
    reg_after=(
        '<p>El Noreste perdió escaños en todos los censos desde 1930, de 123 a 76, y el Medio Oeste también, de 143 a 91. El Sur se '
        'mantuvo entre 133 y 136 escaños durante medio siglo y después ganó en cada censo desde 1970 hasta llegar a 164. El Oeste ganó '
        'en todos los censos, de 31 escaños a 104, y desde 1990 tiene más que el Noreste. Su peso en la población del país pasó del '
        '7,7 % al 23,8 %.</p>'),
    all_h='Cada estado, de 1910 a 2020',
    all_intro='Escaños tras algunos censos, cambio desde el primer reparto del estado en el periodo, y máximo alcanzado. Arizona y Nuevo México parten de su admisión en 1912, Alaska y Hawái de 1960.',
    all_cols=['Estado', '1910', '1950', '1980', '2020', 'Cambio', 'Máximo'],
    not_yet='aún no', every='todos los censos',
    win_h='Los grandes ganadores',
    win=(
        '<p><strong>California</strong> tenía 11 escaños en 1910 y hoy tiene 52. Ganó en cada censo de 1930 a 2000, nueve escaños de '
        'una vez en 1930, tuvo 53 tras los censos de 2000 y 2010 y perdió uno en 2020, la primera pérdida de su historia. Su población '
        'pasó de 2,4 a 39,5 millones de habitantes.</p>'
        '<p><strong>Florida</strong> es la más constante: ganó escaños en diez censos seguidos, todos los de 1930 a 2020, y pasó de 4 '
        'a 28. Tenía 752.619 habitantes en 1910 y 21.538.187 en 2020, 28,6 veces más.</p>'
        '<p><strong>Texas</strong> pasó de 18 escaños a 38, con una ganancia en cada censo desde 1950, ocho seguidas, entre ellas cuatro '
        'escaños tras 2010. <strong>Arizona</strong> entró en la Unión en 1912 con un escaño y hoy tiene nueve. Más abajo, Washington '
        'duplicó de 5 a 10, Colorado de 4 a 8, y Nevada pasó de 1 a 4.</p>'),
    lose_h='Los grandes perdedores',
    lose=(
        '<p><strong>Pensilvania</strong> perdió escaños en diez censos seguidos, todos los de 1930 a 2020, y bajó de 36 a 17. Ningún '
        'estado ha perdido más.</p>'
        '<p><strong>Nueva York</strong> llegó a 45 escaños tras los censos de 1930 y 1940, una delegación que ningún estado igualó hasta '
        'que California alcanzó 52 en 1990. Ha perdido escaños en ocho censos seguidos desde 1950, cinco de una vez tras 1980, la mayor '
        'pérdida del siglo, y hoy tiene 26.</p>'
        '<p>El Medio Oeste retrocedió en todas partes. Illinois pasó de 27 escaños a 17, Misuri de 16 a 8 e Iowa de 11 a 4. Ohio mantuvo '
        '24 escaños de 1930 a 1960 y tiene 15 tras seis pérdidas seguidas. <strong>Míchigan</strong> subió de 13 a 19 con la industria '
        'del automóvil, su máximo en 1960 y 1970, y ha vuelto a 13 tras cinco pérdidas seguidas. <strong>Virginia Occidental</strong> pasó '
        'de 6 escaños a 2, y es uno de los tres estados, con Illinois y Misisipi, cuya población bajó entre 2010 y 2020.</p>'),
    same_h='Los estados que nunca cambiaron',
    same=(
        '<p>Delaware y Wyoming han tenido un escaño tras cada censo del periodo, e Idaho y Nuevo Hampshire dos. Alaska (un escaño) y '
        'Hawái (dos) no han cambiado desde su primer reparto en 1960. Montana estuvo cerca: dos escaños hasta que el censo de 1990 le '
        'quitó uno, y recuperó el segundo en 2020.</p>'),
    moves_h='Cuántos escaños se movieron en cada censo',
    moves_cols=['Censo', 'Escaños que cambiaron de estado', 'Mayor ganancia', 'Mayor pérdida'],
    moves_note='1960 incluye los tres escaños que recibieron Alaska y Hawái en su primer reparto.',
    states_word='estados', each='cada uno',
    grow_h='Adónde se mudaron los estadounidenses: población en 1910 y en 2020',
    grow_intro='Los escaños siguen a la gente. Estos son los seis estados que más crecieron y los seis que menos en 110 años.',
    grow_cols=['Estado', '1910', '2020', 'Crecimiento'],
    grow_fast='Mayor crecimiento', grow_slow='Menor crecimiento', times='×',
    seat_h='Cuántas personas representa un escaño',
    seat=(
        '<p>En 1910 la Cámara tenía un miembro por cada 212.000 residentes aproximadamente. Tras el censo de 2020, la media del Census '
        'Bureau era de 761.169 personas por escaño. Como los escaños no se dividen, la diferencia entre estados es grande: los dos escaños '
        'de <strong>Montana</strong> representan 542.704 personas cada uno, la cifra más baja, y el único escaño de <strong>Delaware</strong> '
        'cubre 990.837, la más alta.</p>'),
    full_h='La tabla completa: escaños tras cada censo',
    full_note='1920 no aparece porque no hubo reparto tras ese censo.',
    src_h='Fuente y método',
    src=(
        '<p>Todas las cifras proceden del archivo histórico de reparto del Census Bureau (<a href="' + SRC + '" rel="noopener">apportionment.csv</a>), '
        'que da la población residente y el número de representantes de cada estado en cada censo de 1910 a 2020. Las regiones son las '
        'cuatro regiones del Census Bureau. Los escaños son los asignados en cada censo, no el número de miembros en un día concreto. '
        'Un script reconstruye la página a partir de ese archivo y comprueba cada cifra citada en el texto.</p>'),
    faq_h='Preguntas frecuentes',
    faq=[('¿Qué estado ha ganado más escaños en la Cámara desde 1910?',
          'California, que pasó de 11 escaños en 1910 a 52 tras el censo de 2020, 41 más. Florida es la que más creció en proporción, de 4 escaños a 28.'),
         ('¿Qué estado ha perdido más escaños?',
          'Pensilvania, de 36 escaños en 1910 a 17 tras el censo de 2020, 19 menos. Nueva York perdió 17 en el mismo periodo, de 43 a 26, después de un máximo de 45.'),
         ('¿Por qué no se repartieron los escaños tras el censo de 1920?',
          'El Congreso nunca aprobó un reparto para el censo de 1920, el primero que mostró más estadounidenses en zonas urbanas que rurales. El reparto de 1910 siguió en vigor hasta la Ley de 1929, que hizo el proceso automático a partir del censo de 1930.'),
         ('¿Por qué la Cámara tiene 435 miembros?',
          'La Ley de 1911 fijó 433 escaños más uno para Arizona y otro para Nuevo México al ser admitidos, en total 435, y la Ley de 1929 congeló esa cifra. La Cámara tuvo brevemente 437 miembros tras la entrada de Alaska y Hawái en 1959, hasta el reparto del censo de 1960.'),
         ('¿Qué estados nunca han ganado ni perdido escaños desde 1910?',
          'Delaware y Wyoming, con un escaño cada uno, e Idaho y Nuevo Hampshire, con dos. Alaska y Hawái no han cambiado desde su primer reparto en 1960.'),
         ('¿Cuándo cambiarán los escaños la próxima vez?',
          'Tras el censo de 2030. El Census Bureau debe entregar las cifras por estado en los nueve meses siguientes al día del censo, y los nuevos escaños regirán desde las elecciones de 2032, incluida la presidencial.')],
    cta_h='Ponte a prueba con el mapa electoral', cta_p='¿Qué estados tienen más votos electorales? El quiz dura dos minutos.',
    cta_a='Jugar el quiz →', cta_url='/es/play/electoral-college/',
    rel_h='Guías relacionadas',
    related=[('/es/learn/colegio-electoral/', 'El Colegio Electoral'), ('/es/learn/estados-mas-poblados/', 'Los estados más poblados'),
             ('/es/learn/estados-bisagra/', 'Los estados bisagra'), ('/es/learn/regiones-de-eeuu/', 'Las regiones de EE. UU.'),
             ('/es/learn/sistema-federal-eeuu/', 'El sistema federal'), ('/es/learn/', 'Aprender los 50 estados')],
    footer='<a href="/es/about/">Acerca</a> &nbsp;·&nbsp; <a href="/es/learn/">Aprender</a> &nbsp;·&nbsp; <a href="/states/">Todos los estados</a> &nbsp;·&nbsp; <a href="/quiz/">Quiz</a> &nbsp;·&nbsp; <a href="/es/faq/">FAQ</a>',
    state_link=lambda n: f'/es/states/{SLUG[n]}/',
)

# --------------------------------------------------------------------------
# Rendering
# --------------------------------------------------------------------------
esc = lambda s: html.escape(s, quote=False).replace('"', '&quot;')


def sname(lang, n):
    return NAMES[n][lang]


def cell_state(t, n):
    name = esc(sname(t['lang'], n))
    return f'<a href="{t["state_link"](n)}">{name}</a>' if t['state_link'] else name


def years_txt(t, ys, nvals):
    if len(ys) == nvals:
        return t['every']
    return ', '.join(str(y) for y in ys)


def table(head, body, cls='tbl', num_from=1, num_to=99):
    nc = lambda i: ' class="n"' if num_from <= i <= num_to else ''
    th = ''.join(f'<th{nc(i)}>{esc(h)}</th>' for i, h in enumerate(head))
    trs = ''.join('<tr>' + ''.join(f'<td{nc(i)}>{c}</td>' for i, c in enumerate(r)) + '</tr>\n'
                  for r in body)
    return f'<div class="tbl-wrap"><table class="{cls}"><thead><tr>{th}</tr></thead><tbody>\n{trs}</tbody></table></div>'


def chart(t):
    W, H, L, R, TOP, B = 640, 300, 48, 150, 18, 34
    lo, hi = 140, 280
    xs = [L + i * (W - L - R) / (len(YEARS) - 1) for i in range(len(YEARS))]
    y = lambda v: TOP + (hi - v) * (H - TOP - B) / (hi - lo)
    grid = ''.join(f'<line x1="{L}" x2="{W - R}" y1="{y(v):.1f}" y2="{y(v):.1f}" class="g"/>'
                   f'<text x="{L - 8}" y="{y(v) + 4:.1f}" class="ax" text-anchor="end">{v}</text>' for v in range(140, 281, 40))
    xl = ''.join(f'<text x="{x:.1f}" y="{H - 12}" class="ax{"" if yr in (1910, 1950, 1990, 2020) else " minor"}" text-anchor="middle">{yr}</text>'
                 for x, yr in zip(xs, YEARS) if yr in (1910, 1930, 1950, 1970, 1990, 2020))
    def series(vals, cls):
        pts = ' '.join(f'{x:.1f},{y(v):.1f}' for x, v in zip(xs, vals))
        dots = ''.join(f'<circle cx="{x:.1f}" cy="{y(v):.1f}" r="4" class="{cls}"/>' for x, v in zip(xs, vals))
        return f'<polyline points="{pts}" class="{cls}"/>{dots}'
    def label(v, name):
        a, b = name.split(' + ')
        x0 = xs[-1] + 12
        return (f'<text x="{x0:.1f}" y="{y(v) - 6:.1f}" class="dl"><tspan class="dv">{v}</tspan>'
                f'<tspan x="{x0:.1f}" dy="1.25em">{esc(a)} +</tspan><tspan x="{x0:.1f}" dy="1.2em">{esc(b)}</tspan></text>')
    lab = label(SUNW[-1], t['s_south']) + label(NORTH[-1], t['s_north'])
    data = json.dumps({'x': [round(x, 1) for x in xs], 'years': YEARS, 'a': SUNW, 'b': NORTH})
    return f'''<figure class="viz" aria-labelledby="viz-cap">
      <div class="viz-legend"><span><i class="k ka"></i>{esc(t["s_south"])}</span><span><i class="k kb"></i>{esc(t["s_north"])}</span></div>
      <div class="viz-box">
        <svg viewBox="0 0 {W} {H}" role="img" tabindex="0" aria-label="{esc(t["chart_h"])}: {esc(t["s_north"])} {NORTH[0]} ({YEARS[0]}) {NORTH[-1]} ({YEARS[-1]}); {esc(t["s_south"])} {SUNW[0]} ({YEARS[0]}) {SUNW[-1]} ({YEARS[-1]})">
          {grid}{xl}
          <line class="xh" x1="0" x2="0" y1="{TOP}" y2="{H - B}" style="display:none"/>
          {series(NORTH, 'sb')}{series(SUNW, 'sa')}{lab}
          <rect x="{L}" y="{TOP}" width="{W - L - R}" height="{H - TOP - B}" fill="transparent" class="hit"/>
        </svg>
        <div class="viz-tip" role="status" aria-live="polite" hidden></div>
      </div>
      <figcaption id="viz-cap">{esc(t["chart_note"])}</figcaption>
      <script type="application/json" class="viz-data">{data}</script>
    </figure>'''


VIZ_JS = '''<script>
(function(){
  var f=document.querySelector('.viz');if(!f)return;
  var d=JSON.parse(f.querySelector('.viz-data').textContent);
  var svg=f.querySelector('svg'),xh=svg.querySelector('.xh'),tip=f.querySelector('.viz-tip'),hit=svg.querySelector('.hit');
  var na=f.querySelector('.ka').parentNode.textContent,nb=f.querySelector('.kb').parentNode.textContent,cur=-1;
  function row(cls,v,n){var r=document.createElement('div');var k=document.createElement('i');k.className='k '+cls;
    var b=document.createElement('strong');b.textContent=v;var s=document.createElement('span');s.textContent=' '+n;
    r.appendChild(k);r.appendChild(b);r.appendChild(s);return r;}
  function show(i){cur=i;var x=d.x[i];xh.setAttribute('x1',x);xh.setAttribute('x2',x);xh.style.display='';
    tip.textContent='';var h=document.createElement('div');h.className='th';h.textContent=d.years[i];tip.appendChild(h);
    tip.appendChild(row('ka',d.a[i],na));tip.appendChild(row('kb',d.b[i],nb));tip.hidden=false;
    var bx=svg.getBoundingClientRect(),px=x/640*bx.width;tip.style.left=Math.min(Math.max(px-70,0),bx.width-150)+'px';}
  function hide(){xh.style.display='none';tip.hidden=true;cur=-1;}
  function near(e){var bx=svg.getBoundingClientRect(),x=(e.clientX-bx.left)/bx.width*640,b=0;
    for(var i=1;i<d.x.length;i++)if(Math.abs(d.x[i]-x)<Math.abs(d.x[b]-x))b=i;return b;}
  hit.addEventListener('pointermove',function(e){show(near(e));});
  hit.addEventListener('pointerdown',function(e){show(near(e));});
  svg.addEventListener('pointerleave',hide);
  svg.addEventListener('focus',function(){show(cur<0?d.x.length-1:cur);});
  svg.addEventListener('blur',hide);
  svg.addEventListener('keydown',function(e){if(e.key==='ArrowLeft'&&cur>0){show(cur-1);e.preventDefault();}
    if(e.key==='ArrowRight'&&cur<d.x.length-1){show(cur+1);e.preventDefault();}});
})();
</script>'''

CSS = '''
    .hp-hero { max-width: 900px; margin: 28px auto 14px; padding: 0 16px; text-align: center; }
    .hp-hero .crumb { font-size: .8rem; color: var(--text-3); margin-bottom: 8px; }
    .hp-hero .crumb a { color: var(--text-2); text-decoration: none; }
    .hp-hero h1 { font-size: clamp(1.7rem, 5.5vw, 2.4rem); font-weight: 900; letter-spacing: -0.025em; margin: 4px 0 8px; }
    .hp-hero .meta { color: var(--text-2); font-size: 1rem; }
    .hp-main { max-width: 760px; margin: 0 auto; padding: 18px 16px 60px; line-height: 1.65; }
    .hp-main h2 { margin-top: 32px; margin-bottom: 10px; font-size: 1.3rem; font-weight: 800; letter-spacing: -0.015em; }
    .keys { display: grid; grid-template-columns: repeat(auto-fit, minmax(160px, 1fr)); gap: 10px; margin: 14px 0 6px; padding: 0; list-style: none; }
    .keys li { border: 2px solid var(--border); border-radius: 12px; padding: 12px 14px; background: #fff; font-size: .88rem; color: var(--text-2); line-height: 1.45; }
    .keys b { display: block; font-size: 1.7rem; font-weight: 900; color: var(--navy); letter-spacing: -0.02em; margin-bottom: 2px; font-variant-numeric: tabular-nums; }
    .tbl-wrap { overflow-x: auto; -webkit-overflow-scrolling: touch; margin: 12px 0 22px; }
    table.tbl { width: 100%; border-collapse: collapse; font-size: .9rem; }
    table.tbl th, table.tbl td { padding: 7px 10px; border-bottom: 1px solid var(--border); text-align: left; white-space: nowrap; }
    table.tbl th { background: #F8FAFC; font-weight: 700; color: var(--navy); font-size: .78rem; text-transform: uppercase; letter-spacing: .03em; }
    table.tbl .n { text-align: right; font-variant-numeric: tabular-nums; }
    table.tbl a { color: var(--navy); font-weight: 700; text-decoration: none; }
    table.tbl a:hover { text-decoration: underline; }
    table.tbl.dense { font-size: .82rem; }
    table.tbl.dense th, table.tbl.dense td { padding: 5px 7px; }
    .note { font-size: .85rem; color: var(--text-3); margin-top: -12px; }
    .viz { margin: 16px 0 24px; }
    .viz-legend { display: flex; gap: 16px; flex-wrap: wrap; font-size: .85rem; color: var(--text-2); margin-bottom: 6px; }
    .viz-legend span { display: inline-flex; align-items: center; gap: 6px; }
    .k { display: inline-block; width: 16px; height: 2px; border-radius: 1px; vertical-align: middle; }
    .ka { background: #eb6834; } .kb { background: #2a78d6; }
    .viz-box { position: relative; }
    .viz svg { width: 100%; height: auto; display: block; overflow: visible; }
    .viz svg:focus { outline: 2px solid var(--navy); outline-offset: 4px; border-radius: 4px; }
    .viz .g { stroke: #E5E7EB; stroke-width: 1; }
    .viz .ax { fill: #6B6B6B; font-size: 11px; font-family: inherit; }
    .viz polyline { fill: none; stroke-width: 2; stroke-linejoin: round; stroke-linecap: round; }
    .viz polyline.sa { stroke: #eb6834; } .viz polyline.sb { stroke: #2a78d6; }
    .viz circle { stroke: #fff; stroke-width: 2; } .viz circle.sa { fill: #eb6834; } .viz circle.sb { fill: #2a78d6; }
    .viz .dl { font-size: 12px; fill: #475569; font-family: inherit; } .viz .dv { font-weight: 800; fill: #0F2147; }
    .viz .xh { stroke: #94A3B8; stroke-width: 1; }
    .viz-tip { position: absolute; top: 0; min-width: 150px; background: #fff; border: 1px solid var(--border); border-radius: 8px; padding: 8px 10px; font-size: .82rem; box-shadow: 0 4px 14px rgba(15,33,71,.12); pointer-events: none; }
    .viz-tip .th { font-weight: 700; color: var(--text-3); margin-bottom: 4px; }
    .viz-tip div { white-space: nowrap; } .viz-tip strong { color: var(--navy); margin-left: 6px; font-variant-numeric: tabular-nums; } .viz-tip span { color: var(--text-2); }
    .viz figcaption { font-size: .85rem; color: var(--text-3); margin-top: 6px; }
    @media (max-width: 560px) { .viz .ax { font-size: 19px; } .viz .ax.minor { display: none; } .viz .dl { font-size: 19px; } .viz circle { r: 6px; } .viz polyline { stroke-width: 3; } }
    .cta-card { background: linear-gradient(135deg, var(--navy), var(--navy-soft)); color: #fff; padding: 22px; border-radius: 14px; margin: 28px 0; text-align: center; }
    .cta-card h3 { color: #fff; margin: 0 0 8px; }
    .cta-card p { margin: 0 0 12px; color: rgba(255,255,255,0.85); }
    .cta-card a { display: inline-block; background: var(--gold); color: var(--navy); padding: 10px 22px; border-radius: 999px; font-weight: 800; text-decoration: none; font-size: .92rem; }
    .related-grid { display: grid; grid-template-columns: repeat(auto-fit, minmax(220px, 1fr)); gap: 8px; margin: 14px 0; }
    .related-grid a { display: block; padding: 10px 12px; border: 1px solid var(--border); border-radius: 8px; color: var(--navy); text-decoration: none; font-weight: 600; font-size: .9rem; }
    .related-grid a:hover { background: #F8FAFC; border-color: var(--navy); }
    .faq-rendered details { border: 1px solid var(--border); border-radius: 10px; margin-bottom: 8px; padding: 12px 16px; background: #fff; }
    .faq-rendered summary { cursor: pointer; font-weight: 700; color: var(--navy); }
    .faq-rendered details p { margin: 8px 0 0; color: var(--text-2); }'''


def page(lang):
    t = T[lang]
    url = BASE + PATHS[lang]
    alts = ''.join(f'  <link rel="alternate" hreflang="{l}" href="{BASE + p}">\n' for l, p in PATHS.items())
    alts += f'  <link rel="alternate" hreflang="x-default" href="{BASE + PATHS["en"]}">\n'
    L = lambda n: sname(lang, n)
    f = lambda n, d=None: fmt(lang, n, d)

    keys = ''.join(f'<li><b>{k}</b>{esc(v)}</li>' for k, v in t['keys'])

    reg_rows = [[str(y), str(REG['NE'][i]), str(REG['MW'][i]), str(REG['S'][i]), str(REG['W'][i]),
                 f(round(region_share('W', y), 1), 1) + (' %' if lang != 'en' else '%')]
                for i, y in enumerate(YEARS)]

    all_rows = []
    for n in STATES:
        fy, fs = first(n)
        p, pys, nv = peak(n)
        def at(y):
            if y == 1910 and fy == 1912:
                return f'{fs} (1912)'
            v = seats(n, y)
            return str(v) if v else t['not_yet']
        all_rows.append([cell_state(t, n), at(1910), at(1950), at(1980), str(seats(n, 2020)),
                         signed(seats(n, 2020) - fs) if seats(n, 2020) != fs else '0',
                         f'{p} ({years_txt(t, pys, nv)})'])

    mv_rows = []
    for y in YEARS[1:]:
        ch = moves(y)
        lost = sum(-v for v in ch.values() if v < 0)
        g = max(ch.values()); l = min(ch.values())
        def who(val):
            ns = [L(n) for n in sorted(ch, key=L) if ch[n] == val]
            if len(ns) > 2:
                return f'{len(ns)} {t["states_word"]}, {signed(val)} {t["each"]}'
            return ', '.join(f'{esc(x)} {signed(val)}' for x in ns)
        mv_rows.append([str(y), str(lost), who(g), who(l)])

    def grow_rows(items):
        return [[cell_state(t, n), f(pop(n, 1910)), f(pop(n, 2020)), f(round(m, 1), 1) + t['times']] for m, n in items]
    grow = (f'<h3>{esc(t["grow_fast"])}</h3>' + table(t['grow_cols'], grow_rows(GROWTH[:6])) +
            f'<h3>{esc(t["grow_slow"])}</h3>' + table(t['grow_cols'], grow_rows(sorted(GROWTH[-6:]))))

    full_rows = [[cell_state(t, n)] + [str(seats(n, y)) if seats(n, y) else '' for y in YEARS] for n in STATES]
    full = table([t['all_cols'][0]] + [str(y) for y in YEARS], full_rows, cls='tbl dense')

    faq_html = ''.join(f'<details><summary>{esc(q)}</summary><p>{esc(a)}</p></details>\n' for q, a in t['faq'])
    faq_ld = json.dumps({'@context': 'https://schema.org', '@type': 'FAQPage', 'mainEntity': [
        {'@type': 'Question', 'name': q, 'acceptedAnswer': {'@type': 'Answer', 'text': a}} for q, a in t['faq']]}, ensure_ascii=False)
    crumbs = json.dumps({'@context': 'https://schema.org', '@type': 'BreadcrumbList', 'itemListElement': [
        {'@type': 'ListItem', 'position': 1, 'name': t['home_name'], 'item': BASE + t['home']},
        {'@type': 'ListItem', 'position': 2, 'name': t['learn_name'], 'item': BASE + t['learn']},
        {'@type': 'ListItem', 'position': 3, 'name': t['crumb'], 'item': url}]}, ensure_ascii=False)
    article = json.dumps({'@context': 'https://schema.org', '@type': 'Article', 'headline': t['h1'], 'description': t['desc'],
                          'inLanguage': lang, 'url': url, 'datePublished': '2026-10-05', 'dateModified': '2026-10-05',
                          'author': {'@type': 'Person', 'name': 'Moses Tounby', 'url': BASE + '/about/'},
                          'publisher': {'@type': 'Organization', 'name': 'Statedoku', 'url': BASE + '/'},
                          'isBasedOn': {'@type': 'Dataset', 'name': 'Historical Apportionment Data (1910-2020)',
                                        'url': SRC, 'creator': {'@type': 'Organization', 'name': 'U.S. Census Bureau'}},
                          'image': BASE + '/og-image.png?v=2'}, ensure_ascii=False)
    related = ''.join(f'<a href="{u}">→ {esc(n)}</a>' for u, n in t['related'])

    return f'''<!DOCTYPE html>
<html lang="{lang}">
<head>
  <!-- Google tag (gtag.js) -->
  <script async src="https://www.googletagmanager.com/gtag/js?id=G-P7ZBQNYLS4"></script>
  <!-- adsense-head -->
<script async src="https://pagead2.googlesyndication.com/pagead/js/adsbygoogle.js?client=ca-pub-1481624152917622"
     crossorigin="anonymous"></script>
  <script>
    window.dataLayer = window.dataLayer || [];
    function gtag(){{dataLayer.push(arguments);}}
    gtag('js', new Date());
    gtag('config', 'G-P7ZBQNYLS4');
  </script>

  <meta charset="UTF-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0, viewport-fit=cover">
  <meta name="theme-color" content="#0F2147">
  <meta name="color-scheme" content="light">
  <title>{esc(t["title"])}</title>
  <meta name="description" content="{esc(t["desc"])}">
  <meta name="robots" content="index, follow, max-image-preview:large">
  <link rel="canonical" href="{url}">
{alts}  <link rel="icon" type="image/svg+xml" href="/favicon.svg?v=5">
  <link rel="stylesheet" href="/css/style.css?v=27">
  <meta property="og:type" content="article">
  <meta property="og:title" content="{esc(t["og_title"])}">
  <meta property="og:description" content="{esc(t["desc"])}">
  <meta property="og:url" content="{url}">
  <meta property="og:image" content="{BASE}/og-image.png?v=2">
  <meta name="twitter:card" content="summary_large_image">
  <meta name="twitter:title" content="{esc(t["og_title"])}">
  <meta name="twitter:description" content="{esc(t["desc"])}">
  <meta name="twitter:image" content="{BASE}/og-image.png?v=2">
  <style>{CSS}
  </style>
  <script type="application/ld+json">{crumbs}</script>
  <script type="application/ld+json">{article}</script>
  <script type="application/ld+json">{faq_ld}</script>
</head>
<body class="legal-body">

<header>
  <a href="{t["home"]}" class="logo">State<em>doku</em> <span class="logo-flag">🇺🇸</span></a>
  <nav class="nav-actions"><a href="{t["learn"] if lang != "en" else "/"}" style="color:var(--text-2);text-decoration:none;font-weight:700;font-size:.88rem;">{t["back"]}</a></nav>
</header><main>
  <section class="hp-hero">
    <p class="crumb"><a href="{t["home"]}">{esc(t["home_name"])}</a> · <a href="{t["learn"]}">{esc(t["learn_name"])}</a> · {esc(t["crumb"])}</p>
    <h1>{esc(t["h1"])}</h1>
    <p class="meta">{esc(t["sub"])}</p>
  </section>
  <div class="hp-main">
    {t["intro"]}

    <h2>{esc(t["key_h"])}</h2>
    <ul class="keys">{keys}</ul>

    <h2>{esc(t["how_h"])}</h2>
    {t["how"]}

    <h2>{esc(t["chart_h"])}</h2>
    {chart(t)}

    <h2>{esc(t["reg_h"])}</h2>
    {table(t["reg_cols"], reg_rows)}
    {t["reg_after"]}

    <div class="ad-slot" data-ad-slot="PLACEHOLDER_LEARN_MID" data-ad-format="auto"></div>

    <h2>{esc(t["win_h"])}</h2>
    {t["win"]}

    <h2>{esc(t["lose_h"])}</h2>
    {t["lose"]}

    <h2>{esc(t["same_h"])}</h2>
    {t["same"]}

    <h2>{esc(t["all_h"])}</h2>
    <p>{esc(t["all_intro"])}</p>
    {table(t["all_cols"], all_rows, num_to=5)}

    <h2>{esc(t["moves_h"])}</h2>
    {table(t["moves_cols"], mv_rows, num_from=1, num_to=1)}
    <p class="note">{esc(t["moves_note"])}</p>

    <h2>{esc(t["grow_h"])}</h2>
    <p>{esc(t["grow_intro"])}</p>
    {grow}

    <h2>{esc(t["seat_h"])}</h2>
    {t["seat"]}

    <h2>{esc(t["full_h"])}</h2>
    {full}
    <p class="note">{esc(t["full_note"])}</p>

    <h2>{esc(t["src_h"])}</h2>
    {t["src"]}

    <div class="cta-card">
      <h3>{esc(t["cta_h"])}</h3>
      <p>{esc(t["cta_p"])}</p>
      <a href="{t["cta_url"]}">{esc(t["cta_a"])}</a>
    </div>

    <section class="faq-rendered">
    <h2>{esc(t["faq_h"])}</h2>
    {faq_html}    </section>

    <h2>{esc(t["rel_h"])}</h2>
    <div class="related-grid">{related}</div>
  </div>
</main><footer>
  <p>Statedoku &copy; 2026 &nbsp;·&nbsp; <a href="https://www.reddit.com/r/Statedoku/" rel="noopener" target="_blank">💬 Reddit</a> &nbsp;·&nbsp; {t["footer"]}</p>
</footer>
{VIZ_JS}
<script src="/config.js"></script>
<script src="/js/admin.js"></script>
<script src="/js/ads.js?v=1"></script>
</body>
</html>
'''


DASHES = '‒–—'
for lang in PATHS:
    t = T[lang]
    assert 70 <= len(t['desc']) <= 160, (lang, len(t['desc']))
    out = page(lang)
    bad = [c for c in DASHES if c in out]
    assert not bad, (lang, bad)
    p = ROOT / PATHS[lang].strip('/') / 'index.html'
    p.parent.mkdir(parents=True, exist_ok=True)
    p.write_text(out, encoding='utf-8')
    print(f'{p.relative_to(ROOT)}  {len(out):,} bytes')
