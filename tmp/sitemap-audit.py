#!/usr/bin/env python3
"""
Reconcile the filesystem against the served sitemap.

After a large content pass it is easy to ship pages that are indexable but
absent from the sitemap, or to leave sitemap entries pointing at pages that
have since been noindexed. Both are silent failures. This walks every
index.html, reads its robots meta, asks the live sitemap function what it
emits, and prints the two-way diff.

    python3 tmp/sitemap-audit.py

Exit code 1 if any discrepancy is found, so it can gate a commit.
"""
import os
import re
import subprocess
import sys

ROOT = os.path.dirname(os.path.dirname(os.path.abspath(__file__)))
BASE = 'https://statedoku.com'

# Directories that are never meant to be in the sitemap.
SKIP_PARTS = ('/node_modules/', '/.git/', '/tmp/', '/admin/', '/functions/',
              '/bot/', '/marketing/', '/press/screenshots/', '/og/')

NOINDEX_RE = re.compile(r'<meta\s+name=["\']robots["\']\s+content=["\'][^"\']*noindex', re.IGNORECASE)


def path_to_url(rel):
    p = rel.replace(os.sep, '/')
    if p.endswith('/index.html'):
        p = p[: -len('index.html')]
    elif p == 'index.html':
        p = ''
    return BASE + '/' + p


def scan_filesystem():
    """Return (indexable_urls, noindexed_urls)."""
    indexable, noindexed = set(), set()
    for dirpath, dirs, files in os.walk(ROOT):
        dirs[:] = [d for d in dirs if d not in ('node_modules', '.git', 'tmp')]
        for fn in files:
            if fn != 'index.html':
                continue
            full = os.path.join(dirpath, fn)
            if any(s in full.replace(os.sep, '/') for s in SKIP_PARTS):
                continue
            rel = os.path.relpath(full, ROOT)
            try:
                with open(full, 'r', encoding='utf-8', errors='ignore') as f:
                    head = f.read(6000)
            except OSError:
                continue
            (noindexed if NOINDEX_RE.search(head) else indexable).add(path_to_url(rel))
    return indexable, noindexed


def sitemap_urls():
    js = (
        "const m=require('./functions/sitemap.xml.js');"
        "m.onRequestGet({request:{}}).then(r=>r.text()).then(t=>{"
        "const u=[...t.matchAll(/<loc>([^<]+)<\\/loc>/g)].map(x=>x[1]);"
        "console.log(u.join('\\n'));});"
    )
    out = subprocess.run(['node', '-e', js], cwd=ROOT, capture_output=True, text=True, timeout=120)
    if out.returncode != 0:
        print('!! could not evaluate sitemap function:', out.stderr[:400], file=sys.stderr)
        return None
    return set(l.strip() for l in out.stdout.splitlines() if l.strip())


def group(urls):
    """Bucket URLs by their first two path segments so output stays readable."""
    buckets = {}
    for u in urls:
        parts = u.replace(BASE + '/', '').strip('/').split('/')
        key = '/'.join(parts[:2]) if len(parts) > 1 else (parts[0] or '<root>')
        buckets.setdefault(key, []).append(u)
    return buckets


def main():
    indexable, noindexed = scan_filesystem()
    sm = sitemap_urls()
    if sm is None:
        return 2

    missing = indexable - sm          # indexable on disk, absent from sitemap
    stale = sm & noindexed            # in sitemap but noindexed on disk
    orphan = sm - indexable - noindexed  # in sitemap, no such file

    print(f'filesystem: {len(indexable)} indexable, {len(noindexed)} noindexed')
    print(f'sitemap:    {len(sm)} urls')
    print()

    problems = 0

    if missing:
        problems += len(missing)
        print(f'MISSING FROM SITEMAP ({len(missing)} indexable pages not listed)')
        for k, v in sorted(group(missing).items(), key=lambda kv: -len(kv[1])):
            print(f'   {len(v):>4}  {k}/')
            for u in sorted(v)[:3]:
                print(f'         {u}')
            if len(v) > 3:
                print(f'         ... +{len(v)-3} more')
        print()

    if stale:
        problems += len(stale)
        print(f'STALE IN SITEMAP ({len(stale)} listed but noindexed on disk)')
        for k, v in sorted(group(stale).items(), key=lambda kv: -len(kv[1])):
            print(f'   {len(v):>4}  {k}/')
        print()

    if orphan:
        print(f'NOTE: {len(orphan)} sitemap urls have no index.html on disk.')
        print('      Expected for function-served routes. Sample:')
        for u in sorted(orphan)[:6]:
            print(f'         {u}')
        print()

    if not problems:
        print('OK: sitemap and filesystem agree.')
        return 0
    print(f'{problems} discrepancies to resolve.')
    return 1


if __name__ == '__main__':
    sys.exit(main())
