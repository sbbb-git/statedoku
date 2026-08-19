#!/usr/bin/env python3
"""Repoint or unwrap every internal link that resolves to nothing.

Two kinds of fix:
  MAP     the destination exists under a different slug, so repoint it
  UNWRAP  nothing valid to point at, so drop the anchor and keep the text

Every MAP target is checked to exist and to be indexable before a single file is
touched. Pointing a link at a noindexed page is not a fix.
"""
import pathlib, re, sys

ROOT = pathlib.Path('.')

MAP = {
    # Spanish pages linking to English slugs inside their own tree
    '/es/learn/us-regions/':        '/es/learn/regiones-de-eeuu/',
    '/es/learn/state-flags/':       '/es/learn/banderas-de-estados/',
    '/es/learn/us-cultural-belts/': '/es/learn/regiones-de-eeuu/',
    # no Spanish version of these, English is better than a 404
    '/es/facts/':                   '/facts/',
    '/es/quiz/':                    '/quiz/',
    # the game is called state-capitals-match
    '/play/state-capitals/':        '/play/state-capitals-match/',
}

# District of Columbia is not a state and never gets a /states/ page.
# The other slugs are Spanish capital pages that were never written.
UNWRAP = [
    '/states/dc/',
    '/es/learn/abreviaturas-estados/',
] + [f'/es/learn/estado-capital-{c}/' for c in (
    'albany', 'baton-rouge', 'boston', 'concord', 'juneau', 'montpelier',
    'oklahoma-city', 'olympia', 'phoenix', 'salem', 'santa-fe')]


def check(path):
    f = ROOT / path.strip('/') / 'index.html'
    if not f.is_file():
        return 'missing'
    if 'content="noindex' in f.read_text(encoding='utf-8', errors='ignore')[:9000]:
        return 'noindex'
    return 'ok'


print('MAP targets:')
bad = False
for src, dst in MAP.items():
    st = check(dst)
    print(f'  {src:34} -> {dst:36} {st}')
    bad |= st != 'ok'
if bad:
    sys.exit('refusing to rewrite: a replacement target is missing or noindexed')

print('\nUNWRAP (link removed, text kept):')
for u in UNWRAP:
    print(f'  {u:44} {check(u)}')

files = [p for p in ROOT.rglob('index.html')
         if not any(s in p.parts for s in ('node_modules', '.git', 'tmp'))]

mapped = unwrapped = 0
touched = set()
for p in files:
    s = orig = p.read_text(encoding='utf-8', errors='ignore')
    for a, b in MAP.items():
        if f'"{a}"' in s:
            mapped += s.count(f'"{a}"')
            s = s.replace(f'"{a}"', f'"{b}"')
    for u in UNWRAP:
        rx = re.compile(r'<a\b[^>]*href="' + re.escape(u) + r'"[^>]*>(.*?)</a>', re.S)
        s, n = rx.subn(lambda m: m.group(1), s)
        unwrapped += n
    if s != orig:
        p.write_text(s, encoding='utf-8')
        touched.add(p)

print(f'\n{mapped} links repointed, {unwrapped} anchors unwrapped, {len(touched)} files changed')
