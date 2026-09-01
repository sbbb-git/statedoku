#!/usr/bin/env python3
"""Give every Game node an image, and every WebPage node a name.

Ahrefs reported 132 pages with a schema.org validation error, up 128, after
crawling far deeper than before. 813 Game nodes across 816 pages declare no
image. It is a recommended property on Game, so validators flag its absence, and
without it the markup cannot produce a rich result.

Each page already carries an og:image, so the value is reused rather than
invented. Blocks are parsed and re-serialised, never patched textually, so a
malformed edit cannot slip through.
"""
import pathlib, re, json, sys

SKIP = {'node_modules', '.git', 'tmp', 'scripts', 'admin', 'api'}
OG = re.compile(r'<meta[^>]*property="og:image"[^>]*content="([^"]+)"', re.I)
OG_ALT = re.compile(r'<meta[^>]*content="([^"]+)"[^>]*property="og:image"', re.I)
BLOCK = re.compile(r'(<script[^>]+application/ld\+json[^>]*>)(.*?)(</script>)', re.S)

def og_image(html):
    m = OG.search(html[:16000]) or OG_ALT.search(html[:16000])
    return m.group(1) if m else None

def walk(node, img, title, counters):
    if isinstance(node, list):
        for x in node: walk(x, img, title, counters)
        return
    if not isinstance(node, dict): return
    t = node.get('@type')
    if isinstance(t, list): t = t[0] if t else None
    if t in ('Game', 'VideoGame') and 'image' not in node and img:
        node['image'] = img; counters['game'] += 1
    if t == 'WebPage' and 'name' not in node and title:
        node['name'] = title; counters['webpage'] += 1
    for v in node.values(): walk(v, img, title, counters)

counters = {'game': 0, 'webpage': 0}
files = 0
for p in pathlib.Path('.').rglob('index.html'):
    if any(s in p.parts for s in SKIP): continue
    s = p.read_text(encoding='utf-8')
    if '"Game"' not in s and '"WebPage"' not in s: continue
    img = og_image(s)
    tm = re.search(r'<title>(.*?)</title>', s, re.S)
    title = re.sub(r'\s+', ' ', tm.group(1)).strip() if tm else None
    changed = False

    def repl(m):
        global changed
        try: d = json.loads(m.group(2))
        except Exception: return m.group(0)
        before = json.dumps(d, sort_keys=True)
        walk(d, img, title, counters)
        after = json.dumps(d, sort_keys=True)
        if before == after: return m.group(0)
        changed = True
        return m.group(1) + json.dumps(d, ensure_ascii=False, indent=2) + m.group(3)

    new = BLOCK.sub(repl, s)
    if changed:
        # never write a file whose JSON-LD stopped parsing
        for mm in BLOCK.finditer(new):
            try: json.loads(mm.group(2))
            except Exception: sys.exit(f'refusing: broke JSON-LD in {p}')
        p.write_text(new, encoding='utf-8'); files += 1

print(f"{counters['game']} Game nodes given an image")
print(f"{counters['webpage']} WebPage nodes given a name")
print(f'{files} files rewritten')
