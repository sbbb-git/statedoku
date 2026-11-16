#!/usr/bin/env python3
"""Consolidates the noindexed thin pages into their best indexable equivalent
(17 November 2026, the owner: "supprime et adapte tout ce que tu veux, juste
vérifie bien qu'il n'y ait pas de 404").

For every noindexed page left after the deletion of 17 November (except the
admin screens and logos), it picks a target that exists and is indexable,
deletes the page, writes a 301 in _redirects (with and without the trailing
slash) and points every internal link at the target. The 1,000 pages deleted
earlier the same day get pattern rules, so none of them answers 404 either.
Fails if a target is missing or noindexed, or if a page has no rule.

    python3 scripts/consolidate-thin-pages.py          # dry run: prints the plan
    python3 scripts/consolidate-thin-pages.py --apply
"""
import json, os, re, sys, shutil, subprocess
from collections import Counter

ROOT = os.path.dirname(os.path.dirname(os.path.abspath(__file__)))
os.chdir(ROOT)
APPLY = '--apply' in sys.argv
SKIP_DIRS = ('./node_modules', './.git', './scripts', './seo-snapshots', './audience-snapshots', './bot', './email-worker', './tmp', './marketing')


def pages():
    for root, _, files in os.walk('.'):
        if root.startswith(SKIP_DIRS): continue
        if 'index.html' in files:
            yield ('/' + root[2:] + '/') if root != '.' else '/', os.path.join(root, 'index.html')


def is_noindex(f):
    return bool(re.search(r'name="robots" content="noindex', open(f, encoding='utf-8', errors='ignore').read(5000)))


ALL = dict(pages())
NOINDEX = {u for u, f in ALL.items() if is_noindex(f)}
STATES = json.load(open('data/states.json', encoding='utf-8'))
slug = lambda n: re.sub(r'[^a-z0-9]+', '-', n.lower().encode('ascii', 'ignore').decode()).strip('-')
ES_SLUG = {}
for s in STATES:
    en = slug(s['names']['en']); ES_SLUG[en] = en; ES_SLUG[slug(s['names']['es'])] = en
WC = re.compile(r'(world-cup|coupe-du-monde|mondial|mundial|copa|soccer|estadio-azteca|mexico-vs-eeuu)')
CROSSWORD = re.compile(r'(\d-letras|estado-capital-|estado-cuya-capital|estado-eeuu-2-letras)')
FIXED = {
    '/es/learn/colonias-originales/': '/es/learn/13-colonies/',
    '/es/learn/montanas-mas-altas-eeuu/': '/es/learn/montana-mas-alta-por-estado/',
    '/fr/learn/fleuves-des-etats-unis/': '/fr/learn/fleuves-par-etat-americain/',
    '/fr/learn/montagnes-des-etats-unis/': '/fr/learn/montagne-plus-haute-par-etat/',
    '/learn/most-populous-states/': '/learn/states-by-population/',
    '/cities/washington/': '/learn/states-and-capitals/',
}


def target(u):
    if u in FIXED: return FIXED[u]
    lang = u.split('/')[1] if u.startswith(('/fr/', '/es/')) else ''
    pre = f'/{lang}' if lang else ''
    m = re.match(r'^/states/([^/]+)/(map|sports)/$', u)
    if m: return f'/states/{m.group(1)}/'
    m = re.match(r'^(/(?:fr/|es/)?play/[^/]+/)printable/$', u)
    if m: return m.group(1)
    if re.match(r'^/cities/[^/]+/$', u):
        st = re.findall(r'href="/states/([a-z-]+)/"', open(ALL[u], encoding='utf-8').read())
        return f'/states/{Counter(st).most_common(1)[0][0]}/' if st else None
    m = re.match(r'^/es/learn/capital-de-([a-z-]+)/$', u)
    if m and m.group(1) in ES_SLUG: return f'/es/states/{ES_SLUG[m.group(1)]}/'
    if re.match(r'^/learn/capital-of-[^/]+/$', u): return '/learn/states-and-capitals/'
    if re.match(r'^/es/learn/[^/]+-es-un-estado/$', u): return '/es/learn/capitales-de-estados/'
    if re.match(r'^/es/learn/[^/]+/$', u) and CROSSWORD.search(u): return '/es/learn/crucigrama-estados/'
    if re.match(r'^/(fr/|es/)?learn/[^/]+/$', u) and WC.search(u): return f'{pre}/learn/'
    return None


KEEP = re.compile(r'^/(admin|logos)/')
plan, unmapped = {}, []
for u in sorted(NOINDEX):
    if KEEP.match(u): continue
    t = target(u)
    if not t: unmapped.append(u); continue
    assert t in ALL and t not in NOINDEX, (u, t, 'target missing or noindexed')
    plan[u] = t
print(f'{len(NOINDEX)} noindexed pages, {len(plan)} to consolidate, {len(unmapped)} without a rule:', unmapped[:20])
print(Counter(re.sub(r'[a-z0-9-]+-?(\d-letras)?', '*', re.sub(r'^/(fr|es)/', r'\1:', k)) for k in plan).most_common(12))
if unmapped: sys.exit('every page needs a rule; add one or keep it on purpose')

# Pattern rules for the 1,000 pages deleted earlier the same day.
DYNAMIC = []
for pre in ('', '/fr', '/es'):
    DYNAMIC.append((f'{pre}/play/:game/state/:state/', f'{pre}/play/:game/'))
for sub in ('travel', 'food', 'elections', 'weather', 'economy'):
    DYNAMIC.append((f'/states/:state/{sub}/', '/states/:state/'))

if not APPLY:
    for k in list(plan)[:8]: print(' ', k, '->', plan[k])
    sys.exit(0)

# 1. Delete the pages.
for u in plan:
    shutil.rmtree('.' + u)
# 2. Point internal links at the targets, in every remaining page and data file.
rx = re.compile(r'(href="|https://statedoku\.com)(' + '|'.join(re.escape(k[:-1]) for k in sorted(plan, key=len, reverse=True)) + r')/?(?=["#?])')
changed = 0
for root, _, files in os.walk('.'):
    if root.startswith(SKIP_DIRS): continue
    for f in files:
        if not f.endswith(('.html', '.json', '.js', '.txt', '.xml')): continue
        p = os.path.join(root, f)
        s = open(p, encoding='utf-8', errors='ignore').read()
        n = rx.sub(lambda m: m.group(1) + plan[m.group(2) + '/'], s)
        if n != s: open(p, 'w', encoding='utf-8').write(n); changed += 1
# 3. The redirects.
lines = ['', '# 17 November 2026: thin noindexed pages folded into their best indexable equivalent',
         '# (scripts/consolidate-thin-pages.py). Both spellings, with and without the trailing slash.']
for a, b in DYNAMIC:
    lines += [f'{a} {b} 301', f'{a.rstrip("/")} {b} 301']
for a, b in sorted(plan.items()):
    lines += [f'{a} {b} 301', f'{a.rstrip("/")} {b} 301']
open('_redirects', 'a').write('\n'.join(lines) + '\n')
static = sum(1 for l in open('_redirects') if l.strip() and not l.startswith('#') and ':' not in l.split()[0] and '*' not in l)
dynamic = sum(1 for l in open('_redirects') if l.strip() and not l.startswith('#') and (':' in l.split()[0] or '*' in l))
assert static <= 2000 and dynamic <= 100, (static, dynamic)
print(f'deleted {len(plan)} pages, rewrote links in {changed} files, _redirects: {static} static and {dynamic} dynamic rules')
