import re, html, json, sys
# Reads the National Archives (Office of the Federal Register) results pages,
# https://www.archives.gov/electoral-college/<year>, saved as nara<year>.html in
# the folder given as argv[1], and writes sources/nara-electoral-votes-1804-2024.json:
# electoral votes for President by state and candidate, from 1804 (the first
# election under the 12th Amendment; before it each elector cast two votes for
# President). Every year is checked against the page's own totals; the
# differences left are electors who did not vote and the contested votes of
# 1868 and 1872, handled in build-election-data.py.
import os
DL = sys.argv[1].rstrip('/') + '/'
STATES = ["Alabama","Alaska","Arizona","Arkansas","California","Colorado","Connecticut","Delaware","Florida","Georgia","Hawaii","Idaho","Illinois","Indiana","Iowa","Kansas","Kentucky","Louisiana","Maine","Maryland","Massachusetts","Michigan","Minnesota","Mississippi","Missouri","Montana","Nebraska","Nevada","New Hampshire","New Jersey","New Mexico","New York","North Carolina","North Dakota","Ohio","Oklahoma","Oregon","Pennsylvania","Rhode Island","South Carolina","South Dakota","Tennessee","Texas","Utah","Vermont","Virginia","Washington","West Virginia","Wisconsin","Wyoming","District of Columbia"]
def txt(c): return re.sub(r'\s+', ' ', html.unescape(re.sub(r'<[^>]+>', ' ', c))).strip()
def cells(r): return [(a, txt(b)) for a, b in re.findall(r'(<t[hd][^>]*>)(.*?)</t[hd]>', r, re.S)]
def cs(a): m = re.search(r'colspan="?(\d+)', a); return int(m.group(1)) if m else 1
out, problems = {}, []
for y in [1804 + 4 * i for i in range(56)]:
    if y > 2024: break
    s = open(f'{DL}nara{y}.html', encoding='utf-8', errors='ignore').read()
    t = re.findall(r'<table.*?</table>', s, re.S)
    head = [cells(r) for r in re.findall(r'<tr.*?</tr>', t[0], re.S)]
    parties = {}
    for row in head:
        for _, v in row[1:]:
            for nm, p in re.findall(r'([A-Z][\w.,\' ]+?) \[([^\]]+)\]', v): parties[nm.strip().rstrip(',')] = p
    rows = [cells(r) for r in re.findall(r'<tr.*?</tr>', t[1], re.S)]
    P = cs(rows[0][2][0]); names = [v for _, v in rows[1]][:P]
    names = [re.sub(r',? of [A-Z].*$', '', n).strip() for n in names]
    notes = ' '.join(v for r in rows if r and r[0][1] == 'Notes' for _, v in r[1:])
    per, tot_row = {}, None
    for r in rows[2:]:
        if not r: continue
        st = r[0][1]
        if st.startswith('Totals'): tot_row = [v for _, v in r]; continue
        base = re.sub(r'[\d*\s]+$', '', st).strip()
        if base not in STATES: continue
        vals = [v for _, v in r[1:]]
        # 2012 repeats the state and its vote count in the third and fourth columns
        if len(vals) > 1 and re.sub(r'[\d*\s]+$', '', vals[1]).strip() == base: vals = [vals[0]] + vals[3:]
        ev = int(re.sub(r'\D', '', vals[0]) or 0) if re.search(r'\d', vals[0]) else 0
        d = {}
        for k, n in enumerate(names):
            v = vals[1 + k] if 1 + k < len(vals) else '-'
            if n.startswith('Others') or not re.fullmatch(r'\d+', v.split(' ')[0] or '-'):
                continue
            d[n] = int(v.split(' ')[0])
        # others from footnotes: "<State> cast N votes for NAME as President"
        NAME = r'([A-Z][a-zA-Z.]*(?: [A-Z][a-zA-Z.]*){0,3})'
        for m in re.finditer(r'(?<![\w])' + re.escape(base) + r'(?: also)? cast (\d+) (?:electoral )?votes? for ' + NAME + r' (?:as|for) President', notes):
            d[m.group(2).strip()] = d.get(m.group(2).strip(), 0) + int(m.group(1))
        m0 = re.search(r'(?<![\w])' + re.escape(base) + r' also cast (\d+) votes for ' + NAME + r' and (\d+) for ' + NAME + r' as President', notes)
        if m0: d[m0.group(2)] = d.get(m0.group(2), 0) + int(m0.group(1)); d[m0.group(4)] = d.get(m0.group(4), 0) + int(m0.group(3))
        seg = re.search(r'In ' + re.escape(base) + r', (.*?)(?=\d+ In [A-Z]|$)', notes)
        if seg:
            for nm, n in re.findall(NAME + r' received (\d+) electoral votes? for [Pp]resident(?!, but these were not counted)', seg.group(1)):
                d[nm] = d.get(nm, 0) + int(n)
        per[base] = {'ev': ev, 'pres': d}
    full = set(names) | set(parties) | set(re.findall(r'([A-Z][a-zA-Z.]*(?: [A-Z][a-zA-Z.]*){1,3}), of [A-Z]', notes))
    full = {f for f in full if not f.startswith('Others')}
    def canon(n):
        if n in full: return n
        c = [f for f in full if f.split()[-1] == n.split()[-1] or f.endswith(' ' + n)]
        return c[0] if len(c) == 1 else n
    for v in per.values(): v['pres'] = {canon(k): x for k, x in v['pres'].items()}
    # header check: the winner's and main opponent's totals as printed above the table
    htxt = ' '.join(v for row in head for _, v in row)
    hw = re.search(r'Winner: (\d+)', htxt); ho = re.search(r'Main Opponent: (\d+)', htxt)
    tot = {}
    for v in per.values():
        for k, n in v['pres'].items(): tot[k] = tot.get(k, 0) + n
    ranked = sorted(tot.values(), reverse=True)
    if hw and ranked and ranked[0] != int(hw.group(1)): problems.append((y, 'header winner', int(hw.group(1)), ranked[:3]))
    if ho and len(ranked) > 1 and int(ho.group(1)) not in ranked: problems.append((y, 'header opponent', int(ho.group(1)), ranked[:3]))
    out[y] = {'parties': parties, 'candidates': names, 'states': per, 'totals': tot_row}
    # checks: named-candidate totals
    for k, n in enumerate(names):
        if n.startswith('Others') or not tot_row: continue
        tv = tot_row[2 + k] if 2 + k < len(tot_row) else ''
        m = re.match(r'\d+', tv)
        got = sum(st['pres'].get(n, 0) for st in per.values())
        if m and int(m.group()) != got: problems.append((y, 'total', n, int(m.group()), got))
    for st, v in per.items():
        if v['ev'] and sum(v['pres'].values()) != v['ev']: problems.append((y, 'state', st, v['ev'], v['pres']))
json.dump(out, open(os.path.join(os.path.dirname(os.path.abspath(__file__)), 'sources', 'nara-electoral-votes-1804-2024.json'), 'w'), indent=1)
print(len(out), 'years;', len(problems), 'problems')
for p in problems: print(p)
