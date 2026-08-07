#!/usr/bin/env python3
"""
REVERT part of yesterday's AdSense noindex sweep.

Yesterday I noindexed all 600 /states/<state>/<subtopic>/ pages to answer
Google's 'low-value content' flag. The Aug 7 data shows that was too broad:
those pages are the site's AI-citation engine and carry real Google demand.

Evidence (Aug 7 exports):
  - "minnesota geography"  987 AI citations + 797 Bing impressions at pos 6.6
  - "maine geography"      197 AI citations + 206 impressions at pos 6.0
  - "wyoming geography"    254 impressions at pos 7.5
  - "famous people from arkansas" 152 citations, colorado 114, virginia 78...
  - "louisiana symbols" 60 citations, tennessee 36, oklahoma 30, delaware 21
  - "michigan fun facts" 64, florida 54, georgia 51, nebraska 40
  - 6,670 Google impressions sit on pages I noindexed

Split by measured body depth (median across CA/TX/WY samples):
  RESTORE  history 1063w · people 880w · geography 842w · map 751w · sports 706w
  HOLD     symbols 210w · fun-facts 218w   (restore after content expansion)
  KEEP     economy 138w · food 138w · weather 182w · travel 201w · elections 237w

Restoring 250 substantial pages. Keeping 350 noindexed for now, which is
still a defensible answer to the AdSense reviewer: nothing indexed is thin.
"""
import os
import re
import sys
from collections import Counter

ROOT = os.path.dirname(os.path.dirname(os.path.abspath(__file__)))

# Subtopics to bring back into the index (all 700+ words of unique per-state prose)
RESTORE = {'history', 'people', 'geography', 'map', 'sports'}

MARKER = '<!-- noindex-subtopic -->'
GOOD_ROBOTS = '<meta name="robots" content="index, follow, max-image-preview:large">'

# Matches the marker + the noindex meta that follows it (with any whitespace)
BLOCK_RE = re.compile(
    re.escape(MARKER) + r'\s*<meta\s+name=["\']robots["\']\s+content=["\']noindex,\s*follow["\']\s*/?>',
    re.IGNORECASE,
)


def is_target(rel):
    parts = rel.replace(os.sep, '/').split('/')
    return (len(parts) == 4 and parts[0] == 'states'
            and parts[3] == 'index.html' and parts[2] in RESTORE)


def process(path):
    with open(path, 'r', encoding='utf-8', errors='ignore') as f:
        html = f.read()
    if MARKER not in html:
        return 'already-indexed'
    new = BLOCK_RE.sub(GOOD_ROBOTS, html, count=1)
    if new == html:
        # Marker present but pattern didn't match — report so it's visible
        return 'pattern-miss'
    with open(path, 'w', encoding='utf-8') as f:
        f.write(new)
    return 'restored'


c = Counter()
misses = []
for dirpath, dirs, files in os.walk(os.path.join(ROOT, 'states')):
    dirs[:] = [d for d in dirs if d not in ('node_modules', '.git')]
    for fn in files:
        if fn != 'index.html':
            continue
        full = os.path.join(dirpath, fn)
        rel = os.path.relpath(full, ROOT)
        if not is_target(rel):
            continue
        r = process(full)
        c[r] += 1
        if r == 'pattern-miss':
            misses.append(rel)

print('restore pass (history, people, geography, map, sports)')
for k, v in c.most_common():
    print(f'   {k}={v}')
for m in misses[:5]:
    print(f'   ! miss: {m}', file=sys.stderr)
