#!/usr/bin/env python3
"""Repair meta descriptions that had boilerplate spliced into them.

An earlier expansion pass matched attribute content with a [^"']* class, which
stops at the first apostrophe. On "Every US state's 2-letter postal code" it
captured up to "state", appended a full stop and the boilerplate, then left the
rest of the original dangling after it:

  Every US state. Full 50-state breakdown with data, maps, and updates for 2026.'s 2-letter postal code ...

The French copy hit this before and was fixed; the English pages were missed
because the same naive regex was used to find them.

og:description escaped the splice, so it is the recovery source wherever it is
intact. Where og was truncated too, the description is rewritten from the page's
own h1 and opening paragraph.
"""
import pathlib, re, html, sys

BOILER = "Full 50-state breakdown with data, maps, and updates for 2026."
DESC = re.compile(r'(<meta[^>]*?name="description"[^>]*?content=")([^"]*)(")', re.I)
OG   = re.compile(r'<meta[^>]*?property="og:description"[^>]*?content="([^"]*)"', re.I)

# og was truncated on these too, so they get written from the page content
REWRITE = {
 'learn/landlocked-states':
   "The 20 landlocked US states, with no ocean coast and no Great Lakes shore. Full list with capitals, regions, an interactive map, and the one doubly landlocked state.",
 'learn/state-abbreviations':
   "All 50 US state abbreviations in one alphabetical list, each with its capital. Plus a memory trick and the handful of two-letter codes people mix up most often.",
 'learn/states-by-region-list':
   "The US Census Bureau's official four-region split: Northeast, South, Midwest and West. Which states sit in each, broken down by their nine subregions.",
 'learn/team-base-camps-world-cup-2026':
   "Where the 48 World Cup 2026 teams train between matches. How base camps are chosen, and the main training sites across the US, Canada and Mexico.",
 'learn/usa-vs-mexico-soccer-history':
   "USA against Mexico, the biggest rivalry in CONCACAF. Head-to-head record, the matches that defined it, and where the Dos a Cero tradition came from.",
}

fixed_og = fixed_rw = 0
for f in sorted(pathlib.Path('.').rglob('index.html')):
    if any(s in f.parts for s in ('node_modules', '.git', 'tmp')): continue
    s = f.read_text(encoding='utf-8', errors='ignore')
    m = DESC.search(s[:12000])
    if not m or BOILER not in m.group(2): continue

    slug = str(f.parent).replace('\\', '/')
    if slug in REWRITE:
        new = REWRITE[slug]; fixed_rw += 1
    else:
        o = OG.search(s[:12000])
        if not o:
            print('no og to recover from, skipped:', slug); continue
        new = html.unescape(o.group(1)).strip()
        fixed_og += 1

    if len(new) > 160 or len(new) < 70:
        print(f'  length {len(new)} out of range, skipped: {slug}')
        continue
    if '"' in new:
        print(f'  quote in replacement, skipped: {slug}'); continue

    s = s[:m.start(2)] + new + s[m.end(2):]
    f.write_text(s, encoding='utf-8')
    print(f'  {len(new):3}  /{slug}/  {new[:70]}...')

print(f'\n{fixed_og} recovered from og:description, {fixed_rw} rewritten from page content')
