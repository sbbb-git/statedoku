#!/usr/bin/env python3
"""Clicks from the homepages to every indexable page, and who links to whom.

audit-local.py proves no indexable page is an orphan, which is a weaker claim
than it sounds: on 24 September 2026 it read zero while 277 indexable pages
sat 4 to 10 clicks deep and 5 could not be reached from any homepage at all,
because they only linked to one another. The 245 state subpages had never
been linked from their own state page.

This walks real <a href> links breadth-first from /, /fr/ and /es/ and prints
the depth distribution, the pages at depth 4 or more, and each learn hub's
coverage of its own section. Depth 3 or less for everything is the target.
"""
import collections, pathlib, re, sys

ROOT = pathlib.Path(__file__).resolve().parent.parent
SITE = 'https://statedoku.com'
SKIP = {'tmp', 'admin', 'node_modules', '.git', 'bot', 'marketing', 'logos',
        'email-worker', 'scripts', 'seo-snapshots', 'audience-snapshots'}
NOINDEX = re.compile(r'name="robots" content="[^"]*noindex')
CANON = re.compile(r'rel="canonical" href="([^"]*)"')

pages, indexable = {}, set()
for p in ROOT.rglob('index.html'):
    rel = p.relative_to(ROOT)
    if SKIP & set(rel.parts): continue
    h = p.read_text(encoding='utf-8', errors='ignore')
    d = rel.parent.as_posix()
    u = '/' if d == '.' else f'/{d}/'
    pages[u] = h
    if NOINDEX.search(h) or 'http-equiv="refresh"' in h.lower(): continue
    c = CANON.search(h)
    if not c or c.group(1).replace(SITE, '') == u: indexable.add(u)

def links(h):
    out = set()
    for href in re.findall(r'<a\s[^>]*href="([^"#?]*)', h):
        href = href.replace(SITE, '')
        if not href.startswith('/') or href.startswith('//'): continue
        if not href.endswith('/') and '.' not in href.rsplit('/', 1)[-1]: href += '/'
        out.add(href)
    return out

graph = {u: links(h) for u, h in pages.items()}
depth, queue = {}, collections.deque()
for home in ('/', '/fr/', '/es/'):
    depth[home] = 0; queue.append(home)
while queue:
    u = queue.popleft()
    for v in graph.get(u, ()):
        if v in pages and v not in depth:
            depth[v] = depth[u] + 1; queue.append(v)

dist = collections.Counter(depth.get(u, -1) for u in indexable)
print(f'indexable pages walked: {len(indexable)}')
print('click depth (-1 = unreachable):', dict(sorted(dist.items())))
deep = sorted((depth.get(u, -1), u) for u in indexable if depth.get(u, -1) < 0 or depth[u] >= 4)
print(f'[{"ERROR" if deep else "OK   "}] indexable pages at depth >= 4 or unreachable: {len(deep)}')
for d, u in deep[:30]: print(f'    {d:3d}  {u}')

for lang in ('', 'fr/', 'es/'):
    hub = f'/{lang}learn/'
    section = {u for u in indexable if u.startswith(hub) and u != hub}
    covered = section & graph.get(hub, set())
    print(f'[{"OK   " if covered == section else "WARN "}] {hub} links {len(covered)} of its {len(section)} indexable pages')
    for u in sorted(section - covered)[:10]: print('    missing', u)
sys.exit(1 if deep else 0)
