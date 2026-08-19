#!/usr/bin/env python3
"""Make real translations self-canonical.

Nine pages carry genuine translated content (lang="fr"/"es", 550-600 words) but
declare rel=canonical pointing at the English page. Google honours the canonical
and drops the translation, so the page can never rank in its own language. Two
of them are worse still: they point at a URL that does not exist at all.

Pages that really are duplicates keep their canonical and are excluded from the
sitemap instead.
"""
import pathlib, re, sys

SITE = 'https://statedoku.com'
SELF = [
    'fr/play/state-silhouettes', 'fr/play/states-connections', 'fr/play/thirteen-colonies',
    'fr/play/state-nicknames', 'fr/play/state-symbols', 'fr/play/time-zones', 'fr/play/swing-states',
    'es/learn/regiones-de-eeuu', 'es/learn/banderas-de-estados',
]

changed = 0
for slug in SELF:
    f = pathlib.Path(slug) / 'index.html'
    if not f.is_file():
        sys.exit(f'missing: {f}')
    s = f.read_text(encoding='utf-8')
    want = f'{SITE}/{slug}/'
    m = re.search(r'(<link[^>]*rel="canonical"[^>]*href=")([^"]+)(")', s, re.I)
    if not m:
        sys.exit(f'no canonical tag in {f}')
    if m.group(2).rstrip('/') + '/' == want:
        print(f'  already self-canonical: /{slug}/'); continue
    print(f'  /{slug}/\n      {m.group(2)}  ->  {want}')
    s = s[:m.start(2)] + want + s[m.end(2):]
    # og:url must agree with the canonical or the two signals fight
    s = re.sub(r'(<meta[^>]*property="og:url"[^>]*content=")([^"]+)(")',
               lambda mm: mm.group(1) + want + mm.group(3), s, count=1, flags=re.I)
    f.write_text(s, encoding='utf-8')
    changed += 1
print(f'\n{changed} pages made self-canonical')
