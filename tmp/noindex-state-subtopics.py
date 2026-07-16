#!/usr/bin/env python3
"""
Second AdSense fix. Google flagged 'low-value content' again after
the first noindex sweep (doorway launchers + printables). Analysis
shows the 12 /states/<state>/<subtopic>/ pages have 37-64% shared
5-grams across states = programmatic content.

Noindex all 600 subtopic pages (12 × 50). Keep the 50 main
/states/<state>/ hub pages indexable (they're actual state overviews).

Idempotent via marker <!-- noindex-subtopic -->.
"""
import os
import re
import sys
from collections import Counter

ROOT = os.path.dirname(os.path.dirname(os.path.abspath(__file__)))
MARKER = '<!-- noindex-subtopic -->'
NEW_META = '<meta name="robots" content="noindex,follow">'

SUBTOPICS = {'history', 'geography', 'map', 'people', 'sports', 'elections',
             'travel', 'weather', 'symbols', 'fun-facts', 'economy', 'food'}

def is_target(rel):
    p = rel.replace(os.sep, '/')
    # /states/<state>/<subtopic>/index.html — 4 segments before index.html
    parts = p.split('/')
    if len(parts) != 4:
        return False
    if parts[0] != 'states':
        return False
    if parts[3] != 'index.html':
        return False
    return parts[2] in SUBTOPICS

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

print(f'✅ subtopic noindex pass')
for k, v in c.most_common():
    print(f'   {k}={v}')
