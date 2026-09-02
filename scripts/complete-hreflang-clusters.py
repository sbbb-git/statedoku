#!/usr/bin/env python3
"""Complete hreflang clusters that are missing a member.

The earlier repair was pairwise: it added a return tag wherever a declaration
lacked one. That cannot see a link absent from both ends. On the GDP cluster the
French page declared en, es and fr, while the English page never declared es and
the Spanish page never declared en, so reciprocity was perfect and the cluster
was still broken.

This walks the connected components of the hreflang graph and writes the full
language set into every member, plus x-default.

It refuses to touch a cluster where one language maps to two different URLs.
Those exist: /learn/state-capitals/ and /learn/states-and-capitals/ are distinct
pages that reference each other, and forcing a shared set would make both claim
hreflang="es", which is invalid. Those are reported, not guessed at.

Noindexed pages carry no hreflang any more and are skipped.
"""
import pathlib, re, sys, collections

SITE = 'https://statedoku.com'
SKIP = {'node_modules', '.git', 'tmp', 'scripts', 'admin', 'api'}
norm = lambda u: u.rstrip('/') + '/'
ALT = re.compile(r'<link[^>]+rel="alternate"[^>]*>', re.I)
ALT_LINE = re.compile(r'[ \t]*<link[^>]+rel="alternate"[^>]*>\n?', re.I)

def url_of(p):
    d = str(p.parent).replace('\\', '/')
    return SITE + '/' if d == '.' else f'{SITE}/{d}/'

pages, decl = {}, {}
for p in pathlib.Path('.').rglob('index.html'):
    if any(s in p.parts for s in SKIP): continue
    h = p.read_text(encoding='utf-8', errors='ignore')
    if 'content="noindex' in h[:12000]: continue
    u = norm(url_of(p)); pages[u] = p
    a = {}
    for t in ALT.findall(h[:12000]):
        lg = re.search(r'hreflang="([^"]+)"', t, re.I)
        hr = re.search(r'href="([^"]+)"', t, re.I)
        if lg and hr: a[lg.group(1).lower()] = norm(hr.group(1).strip())
    if a: decl[u] = a

parent = {}
def find(x):
    parent.setdefault(x, x)
    while parent[x] != x: parent[x] = parent[parent[x]]; x = parent[x]
    return x
def union(a, b):
    ra, rb = find(a), find(b)
    if ra != rb: parent[ra] = rb

# x-default is a fallback pointer, not a translation edge, so it must not join
# two pages into a cluster. Including it did: unrelated clusters share an
# x-default target, and the transitive closure collapsed 121 pages into one
# component. Every language in that blob then mapped to many URLs, the conflict
# guard below refused the whole thing, and the clusters inside it were never
# repaired. Dropping it takes the largest component from 121 pages to 4 and the
# refused count from 3 clusters to 1, the genuinely ambiguous one.
for src, a in decl.items():
    for lg, t in a.items():
        if lg == 'x-default': continue
        if t in pages: union(src, t)

clusters = collections.defaultdict(set)
for u in list(parent): clusters[find(u)].add(u)

written = skipped = conflicted = 0
conflicts = []
for members in clusters.values():
    if len(members) < 2: continue
    langs = collections.defaultdict(set)
    for m in members:
        for lg, t in decl.get(m, {}).items():
            if lg != 'x-default' and t in pages: langs[lg].add(t)
    bad = {lg: sorted(v) for lg, v in langs.items() if len(v) > 1}
    if bad:
        conflicted += 1; conflicts.append((sorted(members)[0], bad)); continue

    full = {lg: next(iter(v)) for lg, v in langs.items()}
    if not full: continue
    xdef = full.get('en') or full.get('en-us') or sorted(full.values())[0]

    block = ''.join(f'  <link rel="alternate" hreflang="{lg}" href="{full[lg]}">\n'
                    for lg in sorted(full))
    block += f'  <link rel="alternate" hreflang="x-default" href="{xdef}">\n'

    for m in members:
        p = pages[m]
        s = p.read_text(encoding='utf-8')
        tags = list(ALT_LINE.finditer(s))
        if not tags: skipped += 1; continue
        start, end = tags[0].start(), tags[-1].end()
        if s[start:end] == block: continue
        p.write_text(s[:start] + block + s[end:], encoding='utf-8')
        written += 1

print(f'{written} pages rewritten with their complete cluster set')
print(f'{conflicted} clusters skipped for a language mapping to two URLs')
for root, bad in conflicts[:6]:
    print(f'   {root}')
    for lg, urls in bad.items(): print(f'      {lg}: {urls}')
if skipped: print(f'{skipped} pages had no alternate block to replace')
