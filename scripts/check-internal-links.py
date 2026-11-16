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
redir = {l.split()[0] for l in open('_redirects') if l.strip() and not l.startswith('#')}
dyn = [re.compile('^' + re.sub(r':\w+', '[^/]+', s.rstrip('/')) + '/?$') for s in redir if ':' in s]
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
