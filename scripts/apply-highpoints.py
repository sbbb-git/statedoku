"""Apply one canonical highpoint figure per peak (queue item R1). NOT YET APPLIED: the
table awaits its independent fact-check. Decided: Rainier 14,411 ft / 4,392 m, Hood
11,249 / 3,429, Gannett 13,809 / 4,209 (pass them as overrides). Line numbers in
inventory.json date from 4 November 2026: run --check first.
overrides: {"WA": {"ft":14411,"m":4392}, ...} on top of highpoints.json."""
import json, re, sys
import os
P = os.path.join(os.path.dirname(os.path.abspath(__file__)), 'data', 'highpoints') + '/'
ROOT = os.path.dirname(os.path.dirname(os.path.abspath(__file__))) + '/'
check = '--check' in sys.argv
args = [a for a in sys.argv[1:] if not a.startswith('--')]
H = {x['usps']: dict(x) for x in json.load(open(P + 'highpoints.json'))}
if args and not check:
    for k, v in json.load(open(args[0])).items(): H[k].update(v)
inv = json.load(open(P + 'inventory.json')); der = json.load(open(P + 'derived.json'))
NUM = re.compile(r'\d{1,3}(?:[ ,.  ]\d{3})+(?:[.,]\d+)?|\d+(?:[.,]\d+)?')
def fmt(n, like):
    m = re.search(r'\d([ ,.  ])\d{3}(?!\d)', like)
    s = str(n)
    if len(s) > 3:
        sep = m.group(1) if m else (',' if ',' in like or not re.search(r'\d', like) else ',')
        if not m:  # plain 4-digit old figure (e.g. 4039): keep plain unless the page groups
            sep = ''
        s = s[:-3] + sep + s[-3:]
    return s
def unit_is_m(e):
    o = e['old']
    if re.search(r'\bm\b', o): return True
    if o.startswith('<td>'): return True          # the French metres table
    return False
def usps(e): return re.search(r'\(([A-Z]{2})\)\s*$', e['peak']).group(1)
out = []; diff = 0
for e in inv:
    st = usps(e); n = H[st]['m'] if unit_is_m(e) else H[st]['ft']
    num = NUM.search(e['old']).group(0)
    new = e['old'].replace(num, fmt(n, num), 1)
    if check and new != e['new']: diff += 1; print('DIFF', e['file'], e['line'], e['old'], 'mine', new, 'agent', e['new'])
    out.append((e['file'], e['line'], e['old'], new))
for e in der:
    note = e['note']; m = re.match(r'([A-Z]{2}) relief [\d,]+ - ([\d,]+)', note) or re.match(r'([A-Z]{2}) [\d,]+ - (?:[A-Za-z ]+ )?([\d,]+)', note)
    st, low = m.group(1), int(m.group(2).replace(',', ''))
    n = H[st]['ft'] - low
    num = NUM.search(e['old']).group(0)
    new = e['old'].replace(num, fmt(n, num), 1)
    if check and new != e['new']: diff += 1; print('DIFF', e['file'], e['line'], e['old'], 'mine', new, 'agent', e['new'])
    out.append((e['file'], e['line'], e['old'], new))
if check: print('entries', len(out), 'differences from the agent', diff); sys.exit()
files = {}
changed = 0
for f, ln, old, new in out:
    if old == new: continue
    L = files.setdefault(f, open(ROOT + f, encoding='utf-8').read().split('\n'))
    assert L[ln - 1].count(old) == 1, (f, ln, old)
    L[ln - 1] = L[ln - 1].replace(old, new); changed += 1
for f, L in files.items(): open(ROOT + f, 'w', encoding='utf-8').write('\n'.join(L))
print('figures changed', changed, 'in', len(files), 'files;', sum(1 for o in out if o[2] == o[3]), 'already right')
