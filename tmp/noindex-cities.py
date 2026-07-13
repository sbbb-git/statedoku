#!/usr/bin/env python3
"""
Noindex all /cities/<city>/ pages. GSC shows they rank pos 55-70 for
big tourism queries (Las Vegas, Charlotte, Saint Paul...) where
Wikipedia/TripAdvisor/travel sites dominate. We eat crawl budget for
zero clicks.

The hub /cities/ (index) stays indexed. Only the 100 per-city pages
get noindex,follow.

Idempotent via marker <!-- noindex-cities -->.
"""
import os
import re
import sys

ROOT = os.path.dirname(os.path.dirname(os.path.abspath(__file__)))
MARKER = '<!-- noindex-cities -->'
NEW_META = '<meta name="robots" content="noindex,follow">'

def is_target(rel):
    p = rel.replace(os.sep, '/')
    # /cities/<slug>/index.html BUT NOT /cities/index.html
    return p.startswith('cities/') and p != 'cities/index.html' and p.endswith('/index.html')

ROBOTS_RE = re.compile(r'<meta\s+name=["\']robots["\']\s+content=["\'][^"\']*["\']\s*/?>', re.IGNORECASE)

def process(path):
    with open(path, 'r', encoding='utf-8', errors='ignore') as f:
        html = f.read()
    if MARKER in html:
        return 'skip'
    replacement = MARKER + '\n  ' + NEW_META
    if ROBOTS_RE.search(html):
        new_html = ROBOTS_RE.sub(replacement, html, count=1)
    else:
        m = re.search(r'</head>', html, re.IGNORECASE)
        if not m:
            return 'nohead'
        new_html = html[:m.start()] + '  ' + replacement + '\n' + html[m.start():]
    with open(path, 'w', encoding='utf-8') as f:
        f.write(new_html)
    return 'edited'

from collections import Counter
c = Counter()
for dirpath, dirs, files in os.walk(ROOT):
    dirs[:] = [d for d in dirs if d not in ('node_modules', '.git', 'tmp')]
    for fn in files:
        if fn != 'index.html':
            continue
        full = os.path.join(dirpath, fn)
        rel = os.path.relpath(full, ROOT)
        if is_target(rel):
            c[process(full)] += 1

print(f'✅ noindex cities pass')
for k, v in c.most_common():
    print(f'   {k}={v}')
