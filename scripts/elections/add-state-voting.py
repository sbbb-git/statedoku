#!/usr/bin/env python3
"""Adds a "How <state> voted in presidential elections" section to the 50
English state pages (states/<slug>/) and the 50 Spanish ones (es/states/<slug>/),
before their FAQ, from data/elections/president.json. Idempotent: the section
sits between <!-- state-voting --> markers and is rewritten on every run.

It holds a sentence of computed facts, the strip of every election (drawn by
js/election-map.js, each square linking to that year on the map page), and a
table of the popular vote since 2000. Every figure comes from the data.

    python3 scripts/elections/add-state-voting.py
"""
import html, json, re
from pathlib import Path

ROOT = Path(__file__).resolve().parents[2]
D = json.load(open(ROOT / 'data/elections/president.json', encoding='utf-8'))['years']
YS = sorted(D, key=int)
STATES = json.load(open(ROOT / 'data/states.json', encoding='utf-8'))
MAP = {'en': '/learn/presidential-election-maps/', 'es': '/es/learn/mapas-elecciones-presidenciales/'}
esc = html.escape
PARTY_ES = {'Democratic': 'demócrata', 'Republican': 'republicano', 'Whig': 'whig', 'Federalist': 'federalista', 'Democratic-Republican': 'demócrata-republicano'}


def won(y, c):
    st = D[y]['states'].get(c)
    if not st: return None, None
    w = max(st['ev'], key=st['ev'].get)
    return w, next(x['party'] for x in D[y]['candidates'] if x['name'] == w)


def section(lang, s):
    c, name = s['id'], s['names'][lang]
    voted = [y for y in YS if c in D[y]['states']]
    r76 = [y for y in YS if int(y) >= 1976]
    d76 = sum(won(y, c)[1] == 'Democratic' for y in r76)
    r_76 = sum(won(y, c)[1] == 'Republican' for y in r76)
    assert d76 + r_76 == len(r76), (c, d76, r_76)
    lastD = max((y for y in voted if won(y, c)[1] == 'Democratic'), default=None, key=int)
    lastR = max((y for y in voted if won(y, c)[1] == 'Republican'), default=None, key=int)
    nat = sum(won(y, c)[1] == D[y]['candidates'][0]['party'] for y in r76)
    rows = ''.join(f'<tr><td><a href="{MAP[lang]}?year={y}#map">{y}</a></td><td>{esc(won(y, c)[0])}</td><td>{D[y]["states"][c]["pv"][0]}%</td><td>{D[y]["states"][c]["pv"][1]}%</td></tr>'
                   for y in reversed([y for y in YS if int(y) >= 2000]))
    if lang == 'en':
        since = f'{name} has voted in {len(voted)} presidential elections, from {voted[0]} to {voted[-1]}' if voted[0] != '1804' else f'{name} has voted in all {len(voted)} presidential elections on this map, from 1804 to {voted[-1]}'
        last = []
        if lastD: last.append(f'a Democrat in {lastD}')
        if lastR: last.append(f'a Republican in {lastR}')
        txt = (f'{since}. Since 1976 it has voted {d76} times for the Democratic candidate and {r_76} times for the Republican, and it backed the national winner {nat} times out of {len(r76)}. '
               f'It last voted for {" and for ".join(last)}.')
        h, cap, th = f'How {name} voted in presidential elections', f'Every election in {name}: tap a year to see that map.', ('Year', 'Won the state', 'Democratic', 'Republican')
    else:
        since = f'{name} ha votado en {len(voted)} elecciones presidenciales, de {voted[0]} a {voted[-1]}' if voted[0] != '1804' else f'{name} ha votado en las {len(voted)} elecciones presidenciales de este mapa, de 1804 a {voted[-1]}'
        last = []
        if lastD: last.append(f'por un demócrata en {lastD}')
        if lastR: last.append(f'por un republicano en {lastR}')
        txt = (f'{since}. Desde 1976 votó {d76} veces por el candidato demócrata y {r_76} por el republicano, y respaldó al ganador nacional {nat} veces de {len(r76)}. '
               f'Votó por última vez {" y ".join(last)}.')
        h, cap, th = f'Cómo votó {name} en las elecciones presidenciales', f'Todas las elecciones en {name}: toca un año para ver ese mapa.', ('Año', 'Ganó el estado', 'Demócrata', 'Republicano')
    tbl = f'<table class="tbl em-vt"><thead><tr>' + ''.join(f'<th>{x}</th>' for x in th) + f'</tr></thead><tbody>{rows}</tbody></table>'
    return (f'<!-- state-voting -->\n    <h2 id="presidential-elections">{esc(h)}</h2>\n    <p>{esc(txt)}</p>\n'
            f'    <div data-election-strip="{c}" data-href="{MAP[lang]}" data-lang="{lang}" aria-label="{esc(cap)}"></div>\n'
            f'    <p style="font-size:.85rem;color:var(--text-2)">{esc(cap)}</p>\n    {tbl}\n    <!-- /state-voting -->\n    ')


n = 0
for lang, prefix in (('en', 'states'), ('es', 'es/states')):
    for s in STATES:
        slug = s['names']['en'].lower().replace(' ', '-')
        p = ROOT / prefix / slug / 'index.html'
        h = p.read_text(encoding='utf-8')
        h = re.sub(r'<!-- state-voting -->.*?<!-- /state-voting -->\n    ', '', h, flags=re.S)
        i = h.find('<h2 id="faq"')
        assert i > 0, p
        h = h[:i] + section(lang, s) + h[i:]
        if 'js/election-map.js' not in h:
            h = h.replace('</body>', '<script src="/js/election-map.js?v=2" defer></script>\n</body>', 1)
        assert not re.search('[‐-―−]', re.sub(r'<(script|style)\b.*?</\1>', '', h, flags=re.S)), p
        p.write_text(h, encoding='utf-8'); n += 1
print(n, 'state pages updated')
