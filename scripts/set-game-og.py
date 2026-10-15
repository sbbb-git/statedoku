#!/usr/bin/env python3
"""Point each play page at its own preview image.

The 21 games and the /play/ hub, in three languages, all used
og-learn-state-capitals.png. scripts/build-game-og.cjs renders one card per
page as og/og-play-<slug>-<lang>.jpg; this sets og:image, twitter:image and
the Game JSON-LD image to it, and declares the size. Idempotent.
"""
import pathlib, re, sys

ROOT = pathlib.Path(__file__).resolve().parent.parent
BASE = 'https://statedoku.com'
LANGS = {'en': '', 'fr': 'fr/', 'es': 'es/'}

done = 0
for lang, pre in LANGS.items():
    pages = sorted((ROOT / pre / 'play').glob('*/index.html')) + [ROOT / pre / 'play' / 'index.html']
    pages = [p for p in pages if (p.parent.name == 'play') or
             (ROOT / 'og' / f'og-play-{p.parent.name}-{lang}.jpg').exists()]
    for p in pages:
        slug = 'hub' if p.parent.name == 'play' else p.parent.name
        img = f'{BASE}/og/og-play-{slug}-{lang}.jpg'
        if not (ROOT / 'og' / f'og-play-{slug}-{lang}.jpg').exists():
            sys.exit(f'missing og/og-play-{slug}-{lang}.jpg; run scripts/build-game-og.cjs first')
        s = p.read_text(encoding='utf-8')
        n = re.sub(r'(<meta property="og:image" content=")[^"]*(")', rf'\g<1>{img}\g<2>', s)
        n = re.sub(r'(<meta name="twitter:image" content=")[^"]*(")', rf'\g<1>{img}\g<2>', n)
        n = re.sub(r'("image"\s*:\s*")https://statedoku\.com/og/[^"]*(")', rf'\g<1>{img}\g<2>', n)
        n = re.sub(r'\n\s*<meta property="og:image:(width|height|type)" content="[^"]*">', '', n)
        n = re.sub(r'(<meta property="og:image" content="[^"]*">)',
                   r'\1\n  <meta property="og:image:type" content="image/jpeg">'
                   r'\n  <meta property="og:image:width" content="1200">'
                   r'\n  <meta property="og:image:height" content="630">', n, count=1)
        if img not in n:
            sys.exit(f'{p.relative_to(ROOT)} has no og:image to point at {img}')
        if n != s:
            p.write_text(n, encoding='utf-8')
            done += 1
print(f'set-game-og: {done} pages updated')
