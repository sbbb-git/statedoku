#!/usr/bin/env python3
"""Link orphaned pages from their own language hub.

An indexable page with no incoming internal link gets almost no crawl priority
and receives no internal PageRank. 18 of these are the substantial World Cup
pages, which are orphaned because /learn/ has no World Cup section at all.

Cards reuse the existing markup on each hub so nothing looks bolted on.
"""
import json, pathlib, re, html

CARD = ('<a href="{href}" style="display:block;padding:10px 12px;border:1px solid var(--border);'
        'border-radius:8px;color:var(--navy);text-decoration:none;font-weight:600;font-size:.9rem;">'
        '&rarr; {label}</a>')
GRID = ('<div style="display:grid;grid-template-columns:repeat(auto-fit, minmax(220px,1fr));'
        'gap:8px;margin:10px 0 20px;">\n{cards}\n</div>')

HUBS = {'': ('learn/index.html', 'World Cup 2026', 'More US geography'),
        'fr': ('fr/learn/index.html', 'Coupe du monde 2026', 'Plus de guides'),
        'es': ('es/learn/index.html', 'Mundial 2026', 'Mas guias')}

def title_of(p):
    s = pathlib.Path(p).read_text(encoding='utf-8', errors='ignore')[:9000]
    m = re.search(r'<title>(.*?)</title>', s, re.S)
    t = html.unescape(re.sub(r'\s+', ' ', m.group(1))).strip() if m else ''
    return re.sub(r'\s*[|]\s*Statedoku\s*$', '', t)

orphans = [u.replace('https://statedoku.com/', '').rstrip('/')
           for u in json.load(open('tmp/audit-local.json'))['orphans']]

buckets = {'': {'wc': [], 'other': []}, 'fr': {'wc': [], 'other': []}, 'es': {'wc': [], 'other': []}}
leftover = []
for o in orphans:
    parts = o.split('/')
    lang = parts[0] if parts[0] in ('fr', 'es') else ''
    rest = parts[1:] if lang else parts
    if rest and rest[0] == 'learn' and len(rest) == 2:
        wc = bool(re.search(r'world-cup|mondial|coupe-du-monde|mundial|azteca|metlife|sofi', o))
        buckets[lang]['wc' if wc else 'other'].append(o)
    else:
        leftover.append(o)

added = 0
for lang, (hub, wc_title, other_title) in HUBS.items():
    f = pathlib.Path(hub)
    if not f.is_file():
        print('no hub:', hub); continue
    s = f.read_text(encoding='utf-8')
    blocks = ''
    for key, heading in (('wc', wc_title), ('other', other_title)):
        items = sorted(buckets[lang][key])
        if not items: continue
        cards = '\n'.join(CARD.format(href='/' + i + '/', label=title_of(i + '/index.html')[:62])
                          for i in items)
        blocks += f'\n<h3 style="margin-top:14px">{heading}</h3>\n' + GRID.format(cards=cards) + '\n'
        added += len(items)
    if not blocks: continue
    # append after the last guide grid so it joins the existing "More guides" area
    idx = s.rfind('</div>', 0, s.rfind('</main>') if '</main>' in s else len(s))
    if idx == -1:
        print('no insertion point in', hub); continue
    s = s[:idx + 6] + blocks + s[idx + 6:]
    f.write_text(s, encoding='utf-8')
    print(f'{hub}: +{len(buckets[lang]["wc"])} world cup, +{len(buckets[lang]["other"])} other')

print(f'\n{added} links added to hubs')
print(f'{len(leftover)} orphans not in a learn tree, handled separately:')
for l in leftover: print('   ', l)
