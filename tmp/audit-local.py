#!/usr/bin/env python3
"""Reproduce the locally-determinable half of the Ahrefs audit against the repo."""
import re, json, pathlib, collections, sys

ROOT = pathlib.Path('.')
SKIP = {'node_modules', '.git', 'tmp', 'admin', 'logos', 'api'}
SITE = 'https://statedoku.com'

def pages():
    for p in ROOT.rglob('index.html'):
        if any(s in p.parts for s in SKIP): continue
        yield p
    for p in ROOT.glob('*.html'):
        if p.name != 'index.html': yield p

def url_of(p):
    d = str(p.parent).replace('\\', '/')
    if p.name != 'index.html':
        return f"{SITE}/{p.name}" if d == '.' else f"{SITE}/{d}/{p.name}"
    return SITE + '/' if d == '.' else f"{SITE}/{d}/"

docs = {}
for p in pages():
    try: docs[p] = p.read_text(encoding='utf-8', errors='ignore')
    except Exception: pass

print(f"pages scanned: {len(docs)}")

# ---- hreflang reciprocity -------------------------------------------------
HREF = re.compile(r'<link[^>]+rel=["\']alternate["\'][^>]*>', re.I)
def alts(html):
    out = {}
    for tag in HREF.findall(html):
        lg = re.search(r'hreflang=["\']([^"\']+)["\']', tag, re.I)
        hr = re.search(r'href=["\']([^"\']+)["\']', tag, re.I)
        if lg and hr: out[lg.group(1).lower()] = hr.group(1).strip()
    return out

declared = {}
for p, html in docs.items():
    a = alts(html)
    if a: declared[url_of(p)] = a

by_url = {url_of(p): p for p in docs}
FILE_EXT = re.compile(r'\.(png|jpg|jpeg|svg|xml|json|txt|css|js|webp|ico|pdf|csv)$', re.I)
def norm(u):
    if not u.startswith('http'): return u
    return u if FILE_EXT.search(u) else u.rstrip('/') + '/'
# /api/* and /sitemap.xml are Cloudflare Pages Functions: they answer at runtime
# but have no index.html on disk, so a filesystem check calls them broken.
FUNCTIONS = re.compile(r'^https://statedoku\.com/(api/|sitemap|robots\.txt|indexnow)')

missing_return = []
for src, a in declared.items():
    for lg, target in a.items():
        if lg == 'x-default': continue
        t = norm(target)
        if t not in {norm(u) for u in declared}:
            missing_return.append((src, lg, target, 'target declares no hreflang at all'))
            continue
        tgt_key = next(u for u in declared if norm(u) == t)
        back = {norm(v) for v in declared[tgt_key].values()}
        if norm(src) not in back:
            missing_return.append((src, lg, target, 'target does not point back'))

print(f"\n[ERROR] hreflang without return tag: {len(missing_return)} declarations")
pages_aff = len({m[0] for m in missing_return})
print(f"        across {pages_aff} pages")
for m in missing_return[:5]: print('   ', m[0], '->', m[2], f'({m[3]})')

# ---- sitemap vs canonical -------------------------------------------------
CANON = re.compile(r'<link[^>]+rel=["\']canonical["\'][^>]*href=["\']([^"\']+)', re.I)
noindex = set(); canon = {}
for p, html in docs.items():
    head = html[:9000]
    if re.search(r'content=["\'][^"\']*noindex', head, re.I): noindex.add(url_of(p))
    m = CANON.search(head)
    if m: canon[url_of(p)] = m.group(1).strip()

selfref = [u for u, c in canon.items() if norm(c) != norm(u)]
print(f"\n[INFO ] pages whose canonical points elsewhere: {len(selfref)}")
print(f"[INFO ] noindex pages: {len(noindex)}")

# ---- internal link graph: orphans + broken --------------------------------
A = re.compile(r'<a\b[^>]*href=["\']([^"\']+)["\']', re.I)
incoming = collections.Counter(); outgoing = collections.defaultdict(set)
existing = {norm(u) for u in by_url}
broken = collections.defaultdict(set)

for p, html in docs.items():
    src = url_of(p)
    # strip script/style: template literals in JS are not links
    html = re.sub(r'<(script|style)\b.*?</\1>', '', html, flags=re.S|re.I)
    for href in A.findall(html):
        if href.startswith(('mailto:', 'tel:', '#', 'javascript:')): continue
        if href.startswith('http') and not href.startswith(SITE): continue
        tgt = href if href.startswith('http') else (SITE + href if href.startswith('/') else None)
        if not tgt: continue
        tgt = norm(tgt.split('#')[0].split('?')[0])
        if tgt == norm(src): continue
        outgoing[src].add(tgt)
        if tgt in existing: incoming[tgt] += 1
        elif not FILE_EXT.search(tgt) and not FUNCTIONS.match(tgt):
            broken[src].add(tgt)

indexable = [u for u in by_url if u not in noindex and norm(canon.get(u, u)) == norm(u)]
orphans = [u for u in indexable if incoming[norm(u)] == 0]
print(f"\n[ERROR] indexable pages with 0 incoming internal links: {len(orphans)}")
for u in orphans[:10]: print('   ', u)

print(f"\n[ERROR] pages linking to a path that does not exist: {len(broken)}")
for s, ts in list(broken.items())[:6]:
    print('   ', s); [print('        ->', t) for t in list(ts)[:3]]

# ---- meta descriptions ----------------------------------------------------
# a double-quoted attribute may contain apostrophes, which French and Spanish
# copy is full of; [^"\']* would report "L\'histoire..." as one character long
MD = re.compile(r'<meta[^>]*?name="description"[^>]*?content="([^"]*)"', re.I)
long_d, short_d, none_d = [], [], []
for p, html in docs.items():
    if url_of(p) in noindex: continue
    m = MD.search(html[:9000])
    if not m: none_d.append(url_of(p)); continue
    n = len(m.group(1))
    if n > 160: long_d.append((url_of(p), n))
    elif n < 70: short_d.append((url_of(p), n))
print(f"\n[WARN ] meta description > 160 chars: {len(long_d)}")
for u, n in long_d[:6]: print(f'    {n:4}  {u}')
print(f"[WARN ] meta description < 70 chars: {len(short_d)}")
for u, n in short_d[:6]: print(f'    {n:4}  {u}')
print(f"[WARN ] no meta description: {len(none_d)}")
for u in none_d[:5]: print('   ', u)

# ---- open graph -----------------------------------------------------------
need = ['og:title', 'og:description', 'og:image', 'og:url']
incomplete = []
for p, html in docs.items():
    if url_of(p) in noindex: continue
    head = html[:9000]
    miss = [t for t in need if f'property="{t}"' not in head and f"property='{t}'" not in head]
    if miss: incomplete.append((url_of(p), miss))
print(f"\n[WARN ] incomplete Open Graph: {len(incomplete)}")
for u, m in incomplete[:6]: print('   ', u, 'missing', ','.join(m))

json.dump({
  'hreflang_missing_return': missing_return,
  'orphans': orphans,
  'broken': {k: sorted(v) for k, v in broken.items()},
  'meta_long': long_d, 'meta_short': short_d, 'meta_none': none_d,
  'og_incomplete': incomplete,
}, open('tmp/audit-local.json', 'w'), indent=1)
print("\nfull detail -> tmp/audit-local.json")
