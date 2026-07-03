#!/usr/bin/env python3
"""Print FULL list (not top 40) of specific issues we care about."""
import sys
sys.path.insert(0, '/Users/sacha/Desktop/Statoku/tmp')
from seo_audit import audit_page, ROOT, should_skip  # type: ignore
import os
import json

# Re-run using the same logic and get every page.
pages = []
for dirpath, dirs, files in os.walk(ROOT):
    dirs[:] = [d for d in dirs if d not in ('node_modules', '.git', 'tmp')]
    for fn in files:
        if fn != 'index.html':
            continue
        full = os.path.join(dirpath, fn)
        if should_skip(full):
            continue
        try:
            pages.append(audit_page(full))
        except Exception as e:
            print(f'  !! error {full}: {e}', file=sys.stderr)

buckets = {
    'title_too_long': [],
    'title_too_short': [],
    'description_too_short': [],
    'description_too_long': [],
    'no_jsonld': [],
    'thin_content': [],
    'duplicate_title': [],
    'multiple_h1s': [],
    'missing_h1': [],
    'img_missing_alt': [],
    'missing_ga4': [],
    'missing_adsense': [],
}
for p in pages:
    for k, v in p['issues']:
        if k in buckets:
            buckets[k].append({'path': p['path'], 'v': v, 'title': p.get('title', '')[:100]})

out = {
    'total_scanned': len(pages),
    'counts': {k: len(v) for k, v in buckets.items()},
    'buckets': buckets,
}
print(json.dumps(out, indent=2))
