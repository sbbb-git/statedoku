#!/usr/bin/env python3
"""Builds data/elections/president.json, the data of the presidential election
map (learn/presidential-election-maps/ and its FR and ES versions) and of the
"How <state> voted" section of the state pages.

Sources, both in scripts/elections/sources/:
- nara-electoral-votes-1804-2024.json: electoral votes for President by state
  and candidate, parsed from the National Archives pages (parse-nara.py).
  Public domain.
- medsl-president-1976-2024.csv: popular vote by state and candidate, MIT
  Election Data and Science Lab, "U.S. President 1976-2024",
  doi:10.7910/DVN/42MVDX, CC0.

Every figure the pages show comes from here. The script asserts the national
electoral vote totals against the Archives' own header, the popular vote
winner of each state against its electoral votes (Maine and Nebraska split
theirs by district, a few electors broke ranks), and prints how many things it
checked.

    python3 scripts/elections/build-election-data.py
"""
import csv, json, os, re, sys
from collections import defaultdict

HERE = os.path.dirname(os.path.abspath(__file__))
ROOT = os.path.dirname(os.path.dirname(HERE))
NARA = json.load(open(os.path.join(HERE, 'sources', 'nara-electoral-votes-1804-2024.json')))
CODE = {"Alabama": "AL", "Alaska": "AK", "Arizona": "AZ", "Arkansas": "AR", "California": "CA", "Colorado": "CO", "Connecticut": "CT",
        "Delaware": "DE", "Florida": "FL", "Georgia": "GA", "Hawaii": "HI", "Idaho": "ID", "Illinois": "IL", "Indiana": "IN", "Iowa": "IA",
        "Kansas": "KS", "Kentucky": "KY", "Louisiana": "LA", "Maine": "ME", "Maryland": "MD", "Massachusetts": "MA", "Michigan": "MI",
        "Minnesota": "MN", "Mississippi": "MS", "Missouri": "MO", "Montana": "MT", "Nebraska": "NE", "Nevada": "NV", "New Hampshire": "NH",
        "New Jersey": "NJ", "New Mexico": "NM", "New York": "NY", "North Carolina": "NC", "North Dakota": "ND", "Ohio": "OH", "Oklahoma": "OK",
        "Oregon": "OR", "Pennsylvania": "PA", "Rhode Island": "RI", "South Carolina": "SC", "South Dakota": "SD", "Tennessee": "TN", "Texas": "TX",
        "Utah": "UT", "Vermont": "VT", "Virginia": "VA", "Washington": "WA", "West Virginia": "WV", "Wisconsin": "WI", "Wyoming": "WY",
        "District of Columbia": "DC"}

# Party of the candidates who carried a state but whose party the Archives page
# does not print next to the name (it prints it for the winner and the main
# opponent only). Standard reference facts, checked by the fact-checker agent.
THIRD = {
    (1824, 'Crawford'): 'Democratic-Republican', (1824, 'Clay'): 'Democratic-Republican',
    (1832, 'Floyd'): 'Nullifier', (1832, 'Wirt'): 'Anti-Masonic',
    (1836, 'White'): 'Whig', (1836, 'Webster'): 'Whig', (1836, 'Mangum'): 'Whig',
    (1860, 'Breckinridge'): 'Southern Democratic', (1860, 'Bell'): 'Constitutional Union',
    (1872, 'Hendricks'): 'Democratic', (1872, 'Brown'): 'Liberal Republican',
    (1892, 'Weaver'): 'Populist', (1912, 'Taft'): 'Republican', (1924, 'Follette'): 'Progressive',
    (1948, 'Thurmond'): "States' Rights Democratic", (1960, 'Byrd'): 'Unpledged electors and one faithless elector',
    (1968, 'Wallace'): 'American Independent',
}
ABBR = {'D': 'Democratic', 'R': 'Republican', 'F': 'Federalist', 'P': 'Progressive', 'D-R': 'Democratic-Republican', 'D-P': 'Democratic'}
# Archives notes that change who a state's votes went to, or why some are missing.
OVERRIDE = {(1868, 'GA'): {'Horatio Seymour': 9}}
# Archives notes, in the three languages of the pages.
NOTE = {
    (1868, 'GA'): ('contested: Congress did not agree whether to count these votes', "contestés : le Congrès ne s'est pas accordé sur leur décompte", 'impugnados: el Congreso no se puso de acuerdo sobre si contarlos'),
    (1872, 'GA'): ('three votes cast for Horace Greeley, who had died, were not counted', "trois voix pour Horace Greeley, mort entre-temps, n'ont pas été comptées", 'no se contaron tres votos para Horace Greeley, que había muerto'),
    (1808, 'KY'): ('one elector did not vote', "un grand électeur n'a pas voté", 'un elector no votó'),
    (1816, 'DE'): ('one elector did not vote', "un grand électeur n'a pas voté", 'un elector no votó'),
    (1816, 'MD'): ('three electors did not vote', "trois grands électeurs n'ont pas voté", 'tres electores no votaron'),
    (1820, 'MS'): ('one elector had died', 'un grand électeur était mort', 'un elector había muerto'),
    (1820, 'PA'): ('one elector had died', 'un grand électeur était mort', 'un elector había muerto'),
    (1820, 'TN'): ('one elector had died', 'un grand électeur était mort', 'un elector había muerto'),
    (1832, 'MD'): ('two electors did not vote', "deux grands électeurs n'ont pas voté", 'dos electores no votaron'),
    (2000, 'DC'): ('one elector did not vote', "un grand électeur n'a pas voté", 'un elector no votó'),
}
NOT_COUNTED = {
    1824: ('No candidate won a majority of the electoral votes: the House of Representatives chose John Quincy Adams.',
           "Aucun candidat n'a obtenu la majorité des grands électeurs : la Chambre des représentants a choisi John Quincy Adams.",
           'Ningún candidato obtuvo la mayoría de los votos electorales: la Cámara de Representantes eligió a John Quincy Adams.'),
    1864: ('States that had seceded did not take part.', "Les États sécessionnistes n'ont pas pris part au vote.", 'Los estados que se habían separado no participaron.'),
    1868: ('Mississippi, Texas and Virginia had not yet been readmitted and did not take part.', "Le Mississippi, le Texas et la Virginie, pas encore réadmis, n'ont pas pris part au vote.", 'Misisipi, Texas y Virginia aún no habían sido readmitidos y no participaron.'),
    1872: ('Arkansas and Louisiana could not certify their results; their votes were not counted.', "L'Arkansas et la Louisiane n'ont pas pu certifier leurs résultats ; leurs voix n'ont pas été comptées.", 'Arkansas y Luisiana no pudieron certificar sus resultados; sus votos no se contaron.'),
}


def party_of(year, name, parties):
    last = name.replace('*', '').replace(', Jr.', '').split()[-1]
    for k, v in parties.items():
        if k.replace(', Jr.', '').split()[-1] == last:
            return ABBR.get(v, v)
    return THIRD.get((year, last))


def canon(name):
    n = name.replace('*', '').strip()
    return {'Robert Dole': 'Bob Dole', 'Donald Trump': 'Donald J. Trump', 'George McGovern': 'George S. McGovern'}.get(n, n)


checks = 0
years = {}
for ys, v in sorted(NARA.items(), key=lambda kv: int(kv[0])):
    y = int(ys)
    ev_by = defaultdict(int)
    states = {}
    for st, x in v['states'].items():
        c = CODE[st]
        pres = {canon(k): n for k, n in (OVERRIDE.get((y, c)) or x['pres']).items()}
        if not pres: continue
        for k, n in pres.items(): ev_by[k] += n
        states[c] = {'ev': pres}
        if (y, c) in NOTE: states[c]['note'] = dict(zip(('en', 'fr', 'es'), NOTE[(y, c)]))
    cands = sorted(ev_by, key=lambda k: -ev_by[k])
    info = []
    for k in cands:
        p = party_of(y, k, v['parties'])
        if p is None and any(max(s['ev'], key=s['ev'].get) == k for s in states.values()):
            sys.exit(f'{y}: no party for {k}, who carried a state')
        info.append({'name': k, 'party': p, 'ev': ev_by[k]})
    # the header's winner total must match
    hdr = re.search(r'Winner: (\d+)', ' '.join(map(str, v.get('totals') or [])))
    years[y] = {'candidates': info, 'states': states}
    if y in NOT_COUNTED: years[y]['note'] = dict(zip(('en', 'fr', 'es'), NOT_COUNTED[y]))

# Known national totals (Archives header, "Winner: N"), asserted.
WINNER_EV = {1804: 162, 1860: 180, 1876: 185, 1912: 435, 1936: 523, 1960: 303, 1968: 301, 1984: 525, 2000: 271, 2016: 304, 2020: 306, 2024: 312}
for y, n in WINNER_EV.items():
    assert years[y]['candidates'][0]['ev'] == n, (y, years[y]['candidates'][0])
    checks += 1

# Popular vote 1976-2024.
pv = defaultdict(lambda: defaultdict(lambda: {'D': 0, 'R': 0, 'O': 0, 'T': 0}))
rows = list(csv.DictReader(open(os.path.join(HERE, 'sources', 'medsl-president-1976-2024.csv'))))
# A candidate's votes on every line count for him (New York's fusion ballot:
# Reagan's 1980 votes on the Conservative line, Clinton's on the Working
# Families line...), so the side is set by name, from the major-party lines.
side = defaultdict(dict)
for r in rows:
    k = {'DEMOCRAT': 'D', 'REPUBLICAN': 'R'}.get(r['party_simplified'])
    if k and r['candidate']: side[int(r['year'])][r['candidate']] = k
for r in rows:
    y, c = int(r['year']), r['state_po']
    k = side[y].get(r['candidate'], 'O') if r['candidate'] else 'O'
    pv[y][c][k] += int(r['candidatevotes'] or 0)
    pv[y][c]['T'] = int(r['totalvotes'])
for y in sorted(pv):
    for c, t in pv[y].items():
        T = t['T'] or (t['D'] + t['R'] + t['O'])
        d, r_ = round(100 * t['D'] / T, 1), round(100 * t['R'] / T, 1)
        years[y]['states'][c]['pv'] = [d, r_, round(100 - d - r_, 1)]
        # The popular vote winner of the state got its electoral votes, except
        # where Maine and Nebraska split them or an elector broke ranks.
        ev = years[y]['states'][c]['ev']
        top = max(ev, key=ev.get)
        party = next(x['party'] for x in years[y]['candidates'] if x['name'] == top)
        expect = 'Democratic' if t['D'] > t['R'] else 'Republican'
        assert party == expect, (y, c, ev, t)
        checks += 1

# Colours: one per party, stable across the years.
COLOR = {'Democratic': '#2563EB', 'Republican': '#DC2626', 'Whig': '#D97706', 'Federalist': '#7C3AED', 'Democratic-Republican': '#059669',
         'National Republican': '#EA580C', 'Southern Democratic': '#0891B2', 'Constitutional Union': '#A16207', 'Progressive': '#16A34A',
         'Populist': '#65A30D', "States' Rights Democratic": '#0E7490', 'American Independent': '#9333EA', 'Unpledged electors and one faithless elector': '#64748B',
         'Nullifier': '#BE185D', 'Anti-Masonic': '#78716C', 'Liberal Republican': '#B45309', 'Whig-American': '#CA8A04', 'Independent': '#64748B',
         'Independent D-R': '#0D9488', 'Federalist/Independent D-R': '#7C3AED'}
used = set()
for y in years.values():
    for c in y['candidates']:
        if c['party']: c['color'] = COLOR.get(c['party'], '#64748B'); used.add(c['party'])
missing = [p for p in used if p not in COLOR]
assert not missing, missing

out = {'note': 'Built by scripts/elections/build-election-data.py from the National Archives (electoral votes, 1804 to 2024) and MIT Election Lab (popular vote by state, 1976 to 2024, CC0). ev: electoral votes by candidate; pv: Democratic, Republican and other share of the popular vote, percent.',
       'years': years}
os.makedirs(os.path.join(ROOT, 'data', 'elections'), exist_ok=True)
path = os.path.join(ROOT, 'data', 'elections', 'president.json')
s = json.dumps(out, ensure_ascii=False, separators=(',', ':'))
assert not re.search('[‐-―−]', s), 'unicode dash'
open(path, 'w').write(s + '\n')
print(f'{len(years)} elections, {sum(len(y["states"]) for y in years.values())} state results, {checks} checks passed, {len(s) // 1024} KB -> {os.path.relpath(path, ROOT)}')
