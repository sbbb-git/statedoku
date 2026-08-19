#!/usr/bin/env python3
"""Map the hreflang graph and show why reciprocity fails."""
import re, pathlib, collections, json

ROOT = pathlib.Path('.'); SITE = 'https://statedoku.com'
SKIP = {'node_modules', '.git', 'tmp', 'admin', 'api'}
FILE_EXT = re.compile(r'\.(png|jpg|svg|xml|json|txt|css|js|webp|ico)$', re.I)
norm = lambda u: u if FILE_EXT.search(u) else u.rstrip('/') + '/'

def url_of(p):
    d = str(p.parent).replace('\\','/')
    return SITE + '/' if d == '.' else f'{SITE}/{d}/'

docs = {}
for p in ROOT.rglob('index.html'):
    if any(s in p.parts for s in SKIP): continue
    docs[url_of(p)] = p

HREF = re.compile(r'<link[^>]+rel=["\']alternate["\'][^>]*>', re.I)
def alts(html):
    out = {}
    for tag in HREF.findall(html[:12000]):
        lg = re.search(r'hreflang=["\']([^"\']+)["\']', tag, re.I)
        hr = re.search(r'href=["\']([^"\']+)["\']', tag, re.I)
        if lg and hr: out[lg.group(1).lower()] = norm(hr.group(1).strip())
    return out

decl = {}
for u, p in docs.items():
    a = alts(p.read_text(encoding='utf-8', errors='ignore'))
    if a: decl[norm(u)] = a

print(f'pages on disk: {len(docs)}')
print(f'pages declaring hreflang: {len(decl)}')

# language of a URL by path
def lang_of(u):
    path = u[len(SITE):]
    if path.startswith('/fr/'): return 'fr'
    if path.startswith('/es/'): return 'es'
    return 'en'

# union-find over every hreflang edge
parent = {}
def find(x):
    parent.setdefault(x, x)
    while parent[x] != x: parent[x] = parent[parent[x]]; x = parent[x]
    return x
def union(a, b):
    ra, rb = find(a), find(b)
    if ra != rb: parent[ra] = rb

targets_off_site = collections.Counter()
for src, a in decl.items():
    for lg, t in a.items():
        if lg == 'x-default': continue
        if t not in docs and norm(t) not in {norm(k) for k in docs}:
            targets_off_site[t] += 1
            continue
        union(src, norm(t))

clusters = collections.defaultdict(set)
for u in list(parent): clusters[find(u)].add(u)

print(f'\nclusters formed: {len(clusters)}')
sizes = collections.Counter(len(v) for v in clusters.values())
print('cluster sizes:', dict(sorted(sizes.items())))

print(f'\nhreflang targets that are not a page on disk: {len(targets_off_site)}')
for t, n in targets_off_site.most_common(8): print(f'  {n:3}  {t}')

# reciprocity failures
fails = []
for src, a in decl.items():
    for lg, t in a.items():
        if lg == 'x-default': continue
        tt = norm(t)
        if tt not in decl:
            fails.append((src, lg, tt, 'target declares nothing')); continue
        if not any(norm(v) == src for v in decl[tt].values()):
            fails.append((src, lg, tt, 'target omits us'))
print(f'\nreciprocity failures: {len(fails)} across {len({f[0] for f in fails})} source pages')
print('by reason:', dict(collections.Counter(f[3] for f in fails)))

# which languages are missing inside each cluster
missing_self = []
for root, members in clusters.items():
    langs = {lang_of(m) for m in members}
    for m in members:
        d = decl.get(m, {})
        have = {k for k in d if k != 'x-default'}
        want = langs
        if have != want:
            missing_self.append((m, sorted(want - have), sorted(have - want)))
print(f'\npages whose declared set differs from its cluster: {len(missing_self)}')
for m, miss, extra in missing_self[:8]:
    print(f'  {m}\n      missing {miss}  extra {extra}')

json.dump({'clusters': {k: sorted(v) for k, v in clusters.items()},
           'fails': fails, 'off_site': dict(targets_off_site)},
          open('scripts/hreflang-map.json','w'), indent=1)
print('\n-> scripts/hreflang-map.json')
