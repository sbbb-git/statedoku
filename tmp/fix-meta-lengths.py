#!/usr/bin/env python3
"""Rewrite three truncated descriptions and trim the ones over 160 characters.

The three short ones were cut at an apostrophe by the same naive regex that
spliced the boilerplate: "Texas 'Lone Star'" lost everything from the quote on.

Trimming cuts at the last sentence end that fits, falling back to the last word
boundary, and never leaves a dangling article or preposition at the end.
"""
import pathlib, re, html

DESC = re.compile(r'(<meta[^>]*?name="description"[^>]*?content=")([^"]*)(")', re.I)

REWRITE = {
 'fr/learn/surnoms-des-etats':
   "Les surnoms officiels des 50 Etats americains : Lone Star pour le Texas, Golden State pour la Californie, Sunshine State pour la Floride. La liste et leur origine.",
 'es/learn/apodos-de-estados':
   "Los apodos oficiales de los 50 estados: Lone Star para Texas, Golden State para California, Sunshine State para Florida. La lista completa y su origen.",
 'regions/west-south-central':
   "West South Central is one of the nine US Census divisions, inside the South: Arkansas, Louisiana, Oklahoma and Texas. Map, population and state by state facts.",
}

DANGLING = {'the','a','an','and','or','of','in','on','for','to','with','by','from','at','plus',
            'le','la','les','de','du','des','et','ou','un','une','pour','dans','avec','sur',
            'el','los','las','y','o','del','por','con','para','en'}

def trim(text, limit=160):
    if len(text) <= limit: return text
    cut = text[:limit]
    # prefer ending on a complete sentence
    for end in ('. ', '! ', '? '):
        i = cut.rfind(end)
        if i > limit * 0.55:
            return cut[:i + 1].strip()
    # otherwise the last whole word, minus any dangling function word
    words = cut.rsplit(' ', 1)[0].split()
    while words and words[-1].strip('.,;:').lower() in DANGLING:
        words.pop()
    return (' '.join(words)).rstrip(' ,;:') + '.'

changed = 0
for f in sorted(pathlib.Path('.').rglob('index.html')):
    if any(s in f.parts for s in ('node_modules', '.git', 'tmp')): continue
    head_probe = f.read_text(encoding='utf-8', errors='ignore')
    if 'content="noindex' in head_probe[:12000]: continue
    m = DESC.search(head_probe[:12000])
    if not m: continue
    slug = str(f.parent).replace('\\', '/')
    cur = html.unescape(m.group(2))
    new = REWRITE.get(slug) or (trim(cur) if len(cur) > 160 else None)
    if not new or new == cur or '"' in new: continue
    s = head_probe[:m.start(2)] + new + head_probe[m.end(2):]
    f.write_text(s, encoding='utf-8')
    print(f'  {len(cur):3} -> {len(new):3}  /{slug}/')
    print(f'        {new}')
    changed += 1
print(f'\n{changed} descriptions rewritten or trimmed')
