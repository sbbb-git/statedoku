#!/usr/bin/env python3
"""Every internal link of every page must reach a file that ships: a page
(<path>/index.html), an asset, or a path a Pages Function serves. A link that
only works through _redirects is reported too, so it can be pointed at its
target. Prints how many links it checked.

    python3 scripts/check-internal-links.py
"""
import os, re, sys
from urllib.parse import unquote
ROOT = os.path.dirname(os.path.dirname(os.path.abspath(__file__)))
os.chdir(ROOT)
SKIP = tuple('./' + d for d in open('.deployignore').read().split() if d and not d.startswith('#')) + ('./.git', './node_modules')
FUNCS = ('/api/', '/sitemap.xml')
rules = [l.split()[0] for l in open('_redirects') if l.strip() and not l.startswith('#')]
redir = set(rules)
dyn = [re.compile('^' + re.sub(r':\w+', '[^/]+', s.rstrip('/')) + '/?$') for s in redir if ':' in s]
# Cloudflare Pages counts every rule after the first dynamic one (a :placeholder
# or a *) as dynamic, and skips everything past 100 dynamic rules. On 17 November
# 2026 that silently dropped 822 rules, which answered 404. So: static first.
first_dyn = next((i for i, s in enumerate(rules) if re.search(r'[:*]', s)), len(rules))
late = [s for s in rules[first_dyn:] if not re.search(r'[:*]', s)]
n_dyn = len(rules) - first_dyn
print(f'_redirects: {len(rules)} rules, {first_dyn} static, {n_dyn} counted as dynamic (limits 2000 and 100)')
if late or first_dyn > 2000 or n_dyn > 100:
    sys.exit(f'_redirects: {len(late)} static rules after a dynamic one (first: {late[:3]}); Cloudflare would skip rules')
links = broken = via = 0
bad, red = [], []
for root, _, files in os.walk('.'):
    if root.startswith(SKIP): continue
    for f in files:
        if not f.endswith('.html'): continue
        p = os.path.join(root, f)
        s = open(p, encoding='utf-8', errors='ignore').read()
        s = re.sub(r'<script\b(?![^>]*application/ld\+json).*?</script>', '', s, flags=re.S)
        for h in re.findall(r'(?:href|src)="(/[^"#?]*)', s):
            if h.startswith('//') or h.startswith(FUNCS): continue
            links += 1
            path = unquote(h)
            ok = os.path.isfile('.' + path) or os.path.isfile('.' + path.rstrip('/') + '/index.html') or path == '/'
            if ok: continue
            if path in redir or path.rstrip('/') in redir or any(r.match(path) for r in dyn):
                via += 1; red.append((p, h)); continue
            broken += 1; bad.append((p, h))
print(f'{links} internal links checked: {broken} broken, {via} only through a redirect')
for x in bad[:30]: print('  BROKEN', x)
for x in red[:15]: print('  REDIRECT', x)
sys.exit(1 if broken else 0)
