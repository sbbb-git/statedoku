#!/usr/bin/env python3
"""Remove noindexed URLs from the sitemap generator.

The generator is a Pages Function assembled from hardcoded entries, so it cannot
read the filesystem to check for a noindex meta at request time. Submitting a URL
and then telling Google not to index it is the contradiction Search Console
reports as "Submitted URL marked noindex", so the entries come out of the source.

Entries look like:  [`${BASE}/learn/atlanta-world-cup-2026/`, { priority: 0.9 }],
so the match is on the path, not on a bare slug.
"""
import pathlib, re, sys

GEN = pathlib.Path('functions/sitemap.xml.js')
paths = sorted({l.strip() for l in
    open('/private/tmp/claude-501/-Users-sacha-Desktop-Statoku/8a3c3adb-a85b-42cb-9c63-c7002ff12df9/scratchpad/noindex-in-sitemap.txt')
    if l.strip()})

lines = GEN.read_text(encoding='utf-8').splitlines(keepends=True)
want = {'/' + p + '/' for p in paths}

kept, dropped = [], []
for ln in lines:
    m = re.search(r'\$\{BASE\}(/[^`\'"]*/)', ln)
    if m and m.group(1) in want and re.match(r'\s*\[', ln):
        dropped.append(m.group(1))
    else:
        kept.append(ln)

GEN.write_text(''.join(kept), encoding='utf-8')
print(f'{len(dropped)} noindexed entries removed from the generator')
missing = want - set(dropped)
if missing:
    print(f'{len(missing)} noindexed URLs were not hardcoded entries:')
    for m in sorted(missing)[:12]: print('   ', m)
