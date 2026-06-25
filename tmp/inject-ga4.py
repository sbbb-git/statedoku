#!/usr/bin/env python3
"""Inject Google Analytics 4 (gtag.js) snippet right after <head> on every .html file.

Idempotent: skips files that already contain the GA ID.
"""
import os
import re
from pathlib import Path

ROOT = Path('/Users/sacha/Desktop/Statoku')
GA_ID = 'G-P7ZBQNYLS4'

GA_SNIPPET = '''
  <!-- Google tag (gtag.js) -->
  <script async src="https://www.googletagmanager.com/gtag/js?id=G-P7ZBQNYLS4"></script>
  <script>
    window.dataLayer = window.dataLayer || [];
    function gtag(){dataLayer.push(arguments);}
    gtag('js', new Date());
    gtag('config', 'G-P7ZBQNYLS4');
  </script>
'''

SKIP_DIRS = {'node_modules', '.git', '.wrangler', 'tmp'}

def walk_html(root):
    for dirpath, dirnames, filenames in os.walk(root):
        dirnames[:] = [d for d in dirnames if d not in SKIP_DIRS]
        for fn in filenames:
            if fn.endswith('.html'):
                yield Path(dirpath) / fn

# Matches: <head>  or  <head ...attr>
HEAD_RE = re.compile(r'(<head\b[^>]*>)', re.IGNORECASE)

patched = 0
skipped_already = 0
skipped_nohead = 0

for f in walk_html(ROOT):
    try:
        c = f.read_text(encoding='utf-8')
    except Exception as e:
        continue
    if GA_ID in c:
        skipped_already += 1
        continue
    m = HEAD_RE.search(c)
    if not m:
        skipped_nohead += 1
        continue
    new_c = HEAD_RE.sub(m.group(1) + GA_SNIPPET, c, count=1)
    f.write_text(new_c, encoding='utf-8')
    patched += 1

print(f'✅ Patched: {patched}')
print(f'⏭️  Already had GA: {skipped_already}')
print(f'⚠️  No <head> tag: {skipped_nohead}')
