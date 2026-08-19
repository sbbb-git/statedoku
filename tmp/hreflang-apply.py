#!/usr/bin/env python3
"""Apply the pairwise hreflang repair computed by hreflang-plan.py.

Adds the missing return tag on the target, and drops a forward claim where the
slot is already held by another page. Pairwise on purpose: rebuilding whole
clusters from the transitive closure would have merged genuinely distinct pages,
because several clusters already contain two pages of the same language.
"""
import json, pathlib, re, sys

ROOT = pathlib.Path('.'); SITE = 'https://statedoku.com'
plan = json.load(open('tmp/hreflang-plan.json'))
ALT = re.compile(r'[ \t]*<link[^>]+rel=["\']alternate["\'][^>]*>\n?', re.I)

def path_of(url):
    rel = url[len(SITE):].strip('/')
    return ROOT / (rel + '/index.html' if rel else 'index.html')

added = dropped = 0
touched = set()

# 1. add the missing return tags
for target, langs in plan['adds'].items():
    p = path_of(target)
    if not p.is_file():
        print('skip, no file:', target); continue
    s = p.read_text(encoding='utf-8')
    tags = list(ALT.finditer(s))
    if not tags:
        print('skip, no alternate block to extend:', target); continue
    ins = tags[-1].end()
    new = ''
    for lg, src in sorted(langs.items()):
        if re.search(rf'hreflang=["\']{re.escape(lg)}["\'][^>]*href=["\']{re.escape(src)}["\']', s, re.I):
            continue
        new += f'  <link rel="alternate" hreflang="{lg}" href="{src}">\n'
        added += 1
    if new:
        p.write_text(s[:ins] + new + s[ins:], encoding='utf-8')
        touched.add(p)

# 2. drop forward claims whose slot belongs to another page
for src, langs in plan['drops'].items():
    p = path_of(src)
    if not p.is_file(): continue
    s = orig = p.read_text(encoding='utf-8')
    for lg in langs:
        s, n = re.subn(
            rf'[ \t]*<link[^>]+rel=["\']alternate["\'][^>]*hreflang=["\']{re.escape(lg)}["\'][^>]*>\n?',
            '', s, flags=re.I)
        dropped += n
    if s != orig:
        p.write_text(s, encoding='utf-8'); touched.add(p)

print(f'{added} return tags added, {dropped} forward claims dropped, {len(touched)} files changed')
