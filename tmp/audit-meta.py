#!/usr/bin/env python3
"""Measure meta descriptions correctly.

An attribute delimited by double quotes may contain apostrophes, which French
and Spanish copy is full of. A character class of [^"']* stops at the first
apostrophe and reports "L'histoire..." as one character long.
"""
import re, pathlib, html

SKIP = {'node_modules', '.git', 'tmp', 'admin', 'api', 'logos'}
SITE = 'https://statedoku.com'
DESC = re.compile(r'<meta[^>]*?name="description"[^>]*?content="([^"]*)"', re.I)
DESC_ALT = re.compile(r"<meta[^>]*?name='description'[^>]*?content='([^']*)'", re.I)

def url_of(p):
    d = str(p.parent).replace('\\','/')
    return SITE + '/' if d == '.' else f'{SITE}/{d}/'

long_, short_, none_ = [], [], []
for p in pathlib.Path('.').rglob('index.html'):
    if any(s in p.parts for s in SKIP): continue
    s = p.read_text(encoding='utf-8', errors='ignore')
    head = s[:12000]
    if 'content="noindex' in head: continue
    m = DESC.search(head) or DESC_ALT.search(head)
    if not m: none_.append(url_of(p)); continue
    d = html.unescape(m.group(1)).strip()
    n = len(d)
    if n > 160: long_.append((n, url_of(p), d))
    elif n < 70: short_.append((n, url_of(p), d))

print(f'too long  (>160): {len(long_)}')
for n,u,d in sorted(long_, reverse=True): print(f'  {n:4}  {u}\n        {d[:120]}...')
print(f'\ntoo short (<70) : {len(short_)}')
for n,u,d in sorted(short_): print(f'  {n:4}  {u}\n        {d}')
print(f'\nmissing         : {len(none_)}')
for u in none_[:10]: print('   ', u)
