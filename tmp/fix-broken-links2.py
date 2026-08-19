#!/usr/bin/env python3
"""Second pass: the 14 one-off dead links left after the bulk Spanish fix."""
import pathlib, re, sys

ROOT = pathlib.Path('.')

MAP = {
    '/learn/states-by-gdp/':        '/learn/states-by-gdp-ranking/',
    '/learn/richest-states/':       '/learn/states-by-gdp-ranking/',
    '/learn/states-by-area/':       '/learn/largest-states/',
    '/learn/highest-lowest-states/': '/learn/highest-mountain-in-each-state/',
    '/learn/state-symbols/':        '/facts/',
    '/learn/four-corners-states/':  '/facts/',
    '/learn/mexican-cession/':      '/learn/states-by-statehood-year/',
    # no French state pages exist, the English one is the real destination
    '/fr/states/new-jersey/':       '/states/new-jersey/',
}

# Nothing sensible to point at. DC has no state page and never will; the four
# city pages were never written.
UNWRAP = [
    '/states/dc/travel/', '/states/dc/map/',
    '/learn/is-baltimore-a-state/', '/learn/is-durham-a-state/',
    '/learn/is-milwaukee-a-state/', '/learn/is-pittsburgh-a-state/',
]

def check(path):
    f = ROOT / path.strip('/') / 'index.html'
    if not f.is_file(): return 'missing'
    if 'content="noindex' in f.read_text(encoding='utf-8', errors='ignore')[:9000]: return 'noindex'
    return 'ok'

bad = False
for a, b in MAP.items():
    st = check(b); bad |= st != 'ok'
    print(f'  {a:32} -> {b:42} {st}')
if bad: sys.exit('refusing to rewrite: a replacement target is missing or noindexed')

files = [p for p in ROOT.rglob('index.html')
         if not any(s in p.parts for s in ('node_modules', '.git', 'tmp'))]
mapped = unwrapped = 0; touched = set()
for p in files:
    s = orig = p.read_text(encoding='utf-8', errors='ignore')
    for a, b in MAP.items():
        if f'"{a}"' in s:
            mapped += s.count(f'"{a}"'); s = s.replace(f'"{a}"', f'"{b}"')
    for u in UNWRAP:
        s, n = re.subn(r'<a\b[^>]*href="' + re.escape(u) + r'"[^>]*>(.*?)</a>', r'\1', s, flags=re.S)
        unwrapped += n
    if s != orig:
        p.write_text(s, encoding='utf-8'); touched.add(p)
print(f'\n{mapped} repointed, {unwrapped} unwrapped, {len(touched)} files')
