#!/usr/bin/env python3
"""Every state highpoint elevation on the site agrees with scripts/data/highpoints/highpoints.json.

The table is one figure per peak (NAVD 88; Mauna Kea on local mean sea level),
each row checked by an independent pass on 4 November 2026 against NGS
datasheets, USGS 3DEP lidar and NCAT. This reads every page, the data files
and the llms files, attributes each figure with a unit to the nearest peak
named before it on the same line (within 160 characters), or to the peak in
the parenthesis right after it ("807 feet (Woodall Mountain)"), and flags a figure that is close to the table's (within 3%) but
not equal: an old survey or a typo. Figures far from the table are other
things (prominence, a city, a range) and are left alone, so are round
hundreds ("about 12,800 feet", "over 14,000 feet") and the few figures in
OTHER, which belong to another peak or are quoted as a former value. Delaware's high point is "about 450 feet", near
the Ebright Azimuth marker. Prints how many figures it checked.

    python3 scripts/check-highpoints.py         # exit 1 on a mismatch
"""
import glob, json, os, re, sys

ROOT = os.path.dirname(os.path.dirname(os.path.abspath(__file__)))
os.chdir(ROOT)
T = {r['usps']: r for r in json.load(open('scripts/data/highpoints/highpoints.json', encoding='utf-8'))}
ALIAS = {
    'AL': ['Cheaha'], 'AK': ['Denali', 'McKinley'], 'AZ': ['Humphreys'], 'AR': ['Magazine'], 'CA': ['Whitney'],
    'CO': ['Elbert'], 'CT': ['Frissell'], 'DE': ['Ebright'], 'FL': ['Britton'], 'GA': ['Brasstown'],
    'HI': ['Mauna Kea', 'Mauna Kea'], 'ID': ['Borah'], 'IL': ['Charles Mound'], 'IN': ['Hoosier Hill'],
    'IA': ['Hawkeye'], 'KS': ['Sunflower'], 'KY': ['Black Mountain', 'Black Mtn'], 'LA': ['Driskill'],
    'ME': ['Katahdin'], 'MD': ['Hoye', 'Backbone'], 'MA': ['Greylock'], 'MI': ['Arvon'],
    'MN': ['Eagle Mountain', 'Eagle Mtn'], 'MS': ['Woodall'], 'MO': ['Taum Sauk'], 'MT': ['Granite Peak'],
    'NE': ['Panorama'], 'NV': ['Boundary Peak'], 'NH': ['Washington</', 'Mount Washington', 'Mt Washington', 'Mont Washington', 'Monte Washington'],
    'NJ': ['High Point'], 'NM': ['Wheeler'], 'NY': ['Marcy'], 'NC': ['Mitchell'], 'ND': ['White Butte'],
    'OH': ['Campbell Hill'], 'OK': ['Black Mesa'], 'OR': ['Hood'], 'PA': ['Mount Davis', 'Mt Davis', 'Mont Davis', 'Monte Davis'],
    'RI': ['Jerimoth'], 'SC': ['Sassafras'], 'SD': ['Black Elk', 'Harney'], 'TN': ['Kuwohi', 'Clingmans'],
    'TX': ['Guadalupe Peak', 'Pico Guadalupe', 'Pic Guadalupe'], 'UT': ['Kings Peak'], 'VT': ['Mansfield'],
    'VA': ['Rogers'], 'WA': ['Rainier'], 'WV': ['Spruce Knob'], 'WI': ['Timms'], 'WY': ['Gannett'],
}
NUM = r'(\d{1,3}(?:(?:,|\.|\s|&nbsp;| | )\d{3})+|\d{3,5})(?:[.,]\d+)?'
UNIT = r'(?:\s|&nbsp;| | |-)?(feet|foot|ft\b|pies|pieds|m\b|mètres|metros|meters|metres)'
FIG = re.compile(r'(?<![\d.,])' + NUM + UNIT)
TD = re.compile(r'<td>(\d{1,2}[\s  ]?\d{3}|\d{3})</td>')  # the French metres table
# Peaks that sit next to a state highpoint in the copy; naming them keeps their
# figures from being read as the highpoint's.
NEUTRAL = ['Montgomery Peak', 'Bear Mountain', 'fourteener']
# (state, figure) quoted on purpose: Nevada's own Wheeler Peak (13,065 ft, not
# New Mexico's), Denali's figure before the 2015 survey (20,320 ft).
OTHER = {('NM', 13065), ('AK', 20320)}
names = sorted([(a, None) for a in NEUTRAL] + [(a, st) for st, al in ALIAS.items() for a in al], key=lambda x: -len(x[0]))
files = [f for f in glob.glob('**/*.html', recursive=True) if not f.startswith(('tmp/', 'marketing/', 'node_modules/', 'scripts/'))]
files += glob.glob('data/*.json') + ['llms.txt', 'llms-full.txt']
checked = 0; bad = []
for f in files:
    try: lines = open(f, encoding='utf-8').read().split('\n')
    except (UnicodeDecodeError, FileNotFoundError): continue
    metres_table = 'montagne-plus-haute-par-etat' in f
    for i, l in enumerate(lines, 1):
        marks = sorted((m.start(), st) for a, st in names for m in re.finditer(re.escape(a), l))
        if not marks: continue
        figs = [(m.start(), m.end(), m.group(1), m.group(2)) for m in FIG.finditer(l)]
        if metres_table: figs += [(m.start(), m.end(), m.group(1), 'm') for m in TD.finditer(l)]
        for pos, end, raw, unit in figs:
            after = [st for p, st in marks if p > end and re.fullmatch(r'\s*\(', l[end:p])]
            before = [st for p, st in marks if p < pos and pos - p <= 160]
            st = after[0] if after else (before[-1] if before else None)
            if st is None: continue
            n = int(re.sub(r'\D', '', raw))
            if n % 100 == 0 or (st, n) in OTHER: continue
            want = T[st]['m'] if unit in ('m', 'mètres', 'metros', 'meters', 'metres') else T[st]['ft']
            if abs(n - want) > max(25, want * 0.03): continue
            checked += 1
            if n != want: bad.append((f, i, st, raw + ' ' + unit, want))
print(f'{len(files)} files read, {checked} highpoint figures checked against the table, {len(bad)} differ')
for b in bad: print('  %s:%d %s has %s, table %s' % b)
sys.exit(1 if bad else 0)
