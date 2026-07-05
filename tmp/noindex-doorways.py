#!/usr/bin/env python3
"""
AdSense flagged 'low-value content' — the 750 per-state launcher pages
and 63 printable worksheets are template-generated doorways. Google's
own guidelines say those should be noindexed.

This script:
  1. Adds `<meta name="robots" content="noindex,follow">` to the <head>
     of every page under /play/<game>/state/<slug>/ (launchers) and
     /play/<game>/printable/ (worksheets), across all 3 langs.
  2. Marks them so the sitemap regenerator excludes them.

The pages remain reachable via internal navigation so users still find
them. Google just stops counting them toward site-wide content quality.

Idempotent via marker `<!-- noindex-doorway -->`.
"""
import os
import re
import sys

ROOT = os.path.dirname(os.path.dirname(os.path.abspath(__file__)))

MARKER = '<!-- noindex-doorway -->'
NEW_META = '<meta name="robots" content="noindex,follow">'

# Any file whose repo path contains one of these tokens gets noindexed.
# /state/ (per-state launcher) + /printable/ (classroom worksheet)
DOORWAY_TOKENS = ('/state/', '/printable/')

# Only under /play/, /fr/play/, /es/play/
DOORWAY_ROOTS = ('play/', 'fr/play/', 'es/play/')


def is_doorway_page(rel_path):
    rp = rel_path.replace(os.sep, '/')
    if not any(rp.startswith(r) for r in DOORWAY_ROOTS):
        return False
    if not any(t in rp for t in DOORWAY_TOKENS):
        return False
    return True


# Match an existing <meta name="robots" ...> tag if any.
ROBOTS_RE = re.compile(r'<meta\s+name=["\']robots["\']\s+content=["\'][^"\']*["\']\s*/?>', re.IGNORECASE)


def process(path):
    with open(path, 'r', encoding='utf-8', errors='ignore') as f:
        html = f.read()

    if MARKER in html:
        return 'skip-marked'

    replacement = MARKER + '\n  ' + NEW_META

    if ROBOTS_RE.search(html):
        # Replace the existing robots tag with our noindex version.
        new_html = ROBOTS_RE.sub(replacement, html, count=1)
        change = 'replaced-existing'
    else:
        # Inject before </head> (or after <head> if </head> missing).
        m = re.search(r'</head>', html, re.IGNORECASE)
        if not m:
            return 'no-head'
        new_html = html[:m.start()] + '  ' + replacement + '\n' + html[m.start():]
        change = 'injected'

    if new_html == html:
        return 'no-change'

    with open(path, 'w', encoding='utf-8') as f:
        f.write(new_html)
    return change


def main():
    from collections import Counter
    c = Counter()
    hits = []
    for dirpath, dirs, files in os.walk(ROOT):
        dirs[:] = [d for d in dirs if d not in ('node_modules', '.git', 'tmp')]
        for fn in files:
            if fn != 'index.html':
                continue
            full = os.path.join(dirpath, fn)
            rel = os.path.relpath(full, ROOT).replace(os.sep, '/')
            if not is_doorway_page(rel):
                continue
            hits.append(rel)
            try:
                r = process(full)
                c[r] += 1
            except Exception as e:
                print(f'  !! {rel}: {e}', file=sys.stderr)
                c['error'] += 1

    print(f'\n✅ matched {len(hits)} doorway pages')
    for k, v in c.most_common():
        print(f'   {k}={v}')


if __name__ == '__main__':
    main()
