#!/usr/bin/env python3
"""Remove hreflang annotations from noindexed pages.

Google ignores noindexed pages when resolving an hreflang cluster: a page that
will never appear in results cannot be a useful alternate for one that will. So
1,325 noindexed pages were carrying 8,412 alternate tags that do nothing.

They are not harmless. Ahrefs crawled 932 of them for the first time on 1
September and reported 322 pages missing a return tag, up 199. Every indexable
page's hreflang is reciprocal (scripts/audit-local.py reads zero), and no
annotation crosses between the indexable and noindexed sets, so the failures can
only be inside the noindexed subgraph, where the crawler reached one end of a
pair and not the other.

Indexable pages are untouched.
"""
import pathlib, re, sys

SKIP = {'node_modules', '.git', 'tmp', 'scripts', 'admin', 'api'}
ALT = re.compile(r'[ \t]*<link[^>]+rel="alternate"[^>]*hreflang="[^"]*"[^>]*>\n?', re.I)

changed = tags = 0
touched_indexable = []
for p in pathlib.Path('.').rglob('index.html'):
    if any(s in p.parts for s in SKIP): continue
    s = p.read_text(encoding='utf-8')
    head = s[:12000]
    if 'content="noindex' not in head or 'rel="alternate"' not in head:
        continue
    new, n = ALT.subn('', s)
    if not n:
        continue
    # a page that is somehow indexable must never be touched
    if 'content="noindex' not in new[:12000]:
        touched_indexable.append(str(p)); continue
    p.write_text(new, encoding='utf-8')
    changed += 1; tags += n

if touched_indexable:
    sys.exit(f'refusing: would have stripped an indexable page: {touched_indexable[:3]}')
print(f'{tags} alternate tags removed from {changed} noindexed pages')
