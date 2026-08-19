#!/usr/bin/env python3
"""Decide, per failing pair, whether to add a back-link or drop the forward one."""
import re, json, pathlib, collections

ROOT=pathlib.Path('.'); SITE='https://statedoku.com'
SKIP={'node_modules','.git','tmp','admin','api'}
norm=lambda u:u.rstrip('/')+'/'
def url_of(p):
    d=str(p.parent).replace('\\','/')
    return SITE+'/' if d=='.' else f'{SITE}/{d}/'
def lang(u):
    p=u[len(SITE):]
    return 'fr' if p.startswith('/fr/') else 'es' if p.startswith('/es/') else 'en'

docs={}
for p in ROOT.rglob('index.html'):
    if any(s in p.parts for s in SKIP): continue
    docs[norm(url_of(p))]=p

HREF=re.compile(r'<link[^>]+rel=["\']alternate["\'][^>]*>',re.I)
decl={}; canon={}
for u,p in docs.items():
    h=p.read_text(encoding='utf-8',errors='ignore')
    head=h[:12000]
    a={}
    for tag in HREF.findall(head):
        lg=re.search(r'hreflang=["\']([^"\']+)["\']',tag,re.I)
        hr=re.search(r'href=["\']([^"\']+)["\']',tag,re.I)
        if lg and hr: a[lg.group(1).lower()]=norm(hr.group(1).strip())
    if a: decl[u]=a
    m=re.search(r'rel=["\']canonical["\'][^>]*href=["\']([^"\']+)',head,re.I)
    if m: canon[u]=norm(m.group(1).strip())

adds=collections.defaultdict(dict)   # target -> {lang: src}
drops=collections.defaultdict(set)   # src -> {lang}
conflicts=[]

for src,a in decl.items():
    for lg,t in a.items():
        if lg=='x-default': continue
        if t not in decl: continue
        if any(norm(v)==src for v in decl[t].values()): continue   # already reciprocal
        sl=lang(src)
        existing=decl[t].get(sl)
        if existing and norm(existing)!=src:
            # target already names a different page for our language
            src_canon = canon.get(src,src)==src
            other_canon = canon.get(norm(existing),norm(existing))==norm(existing)
            if src_canon and not other_canon:
                adds[t][sl]=src           # we are the canonical one, take the slot
                conflicts.append((src,t,sl,existing,'we are canonical, other is not'))
            else:
                drops[src].add(lg)        # not our slot, stop claiming it
                conflicts.append((src,t,sl,existing,'slot taken, dropping our forward claim'))
        else:
            adds[t][sl]=src

n_add=sum(len(v) for v in adds.values())
n_drop=sum(len(v) for v in drops.values())
print(f'back-links to ADD    : {n_add}  on {len(adds)} pages')
print(f'forward claims to DROP: {n_drop}  on {len(drops)} pages')
print(f'conflicts encountered : {len(conflicts)}')
for c in conflicts[:10]:
    print(f'   {c[4]}\n      src {c[0]}\n      tgt {c[1]}  already has {c[2]} -> {c[3]}')
json.dump({'adds':{k:v for k,v in adds.items()},'drops':{k:sorted(v) for k,v in drops.items()}},
          open('tmp/hreflang-plan.json','w'),indent=1)
print('\n-> tmp/hreflang-plan.json')
