#!/usr/bin/env python3
"""Give the three homepages their Open Graph and Twitter card tags.

They had none at all. Every share of statedoku.com on X, WhatsApp, Slack,
Facebook or iMessage rendered as a bare link with no title card and no image, on
a game whose growth depends on people sharing their grid. The images already
existed at og/home-<lang>.png and were simply never declared.

Values are taken from each page's own title and description, so the card says
what the page says.
"""
import pathlib, re, html, sys

PAGES = {'.': ('en', 'en_US'), 'fr': ('fr', 'fr_FR'), 'es': ('es', 'es_ES')}
SITE = 'https://statedoku.com'

for slug, (lang, locale) in PAGES.items():
    p = pathlib.Path(slug) / 'index.html'
    s = p.read_text(encoding='utf-8')
    if 'property="og:title"' in s[:16000]:
        print(f'  /{slug}/ already has og tags'); continue

    tm = re.search(r'<title>(.*?)</title>', s, re.S)
    dm = re.search(r'<meta[^>]*name="description"[^>]*content="([^"]*)"', s, re.I)
    if not tm or not dm: sys.exit(f'no title or description in {p}')
    title = html.unescape(re.sub(r'\s+', ' ', tm.group(1))).strip()
    desc = html.unescape(dm.group(1)).strip()
    url = f'{SITE}/' if slug == '.' else f'{SITE}/{slug}/'
    img = f'{SITE}/og/home-{lang}.png'
    if not pathlib.Path(f'og/home-{lang}.png').is_file():
        img = f'{SITE}/og-image.png'

    esc = lambda t: t.replace('&', '&amp;').replace('"', '&quot;')
    block = (
      f'  <meta property="og:type" content="website">\n'
      f'  <meta property="og:site_name" content="Statedoku">\n'
      f'  <meta property="og:title" content="{esc(title)}">\n'
      f'  <meta property="og:description" content="{esc(desc)}">\n'
      f'  <meta property="og:url" content="{url}">\n'
      f'  <meta property="og:image" content="{img}">\n'
      f'  <meta property="og:image:width" content="1200">\n'
      f'  <meta property="og:image:height" content="630">\n'
      f'  <meta property="og:locale" content="{locale}">\n'
      f'  <meta name="twitter:card" content="summary_large_image">\n'
      f'  <meta name="twitter:title" content="{esc(title)}">\n'
      f'  <meta name="twitter:description" content="{esc(desc)}">\n'
      f'  <meta name="twitter:image" content="{img}">\n')

    m = re.search(r'[ \t]*<link[^>]+rel="canonical"[^>]*>\n', s)
    if not m: sys.exit(f'no canonical anchor in {p}')
    p.write_text(s[:m.end()] + block + s[m.end():], encoding='utf-8')
    print(f'  /{slug}/  og + twitter card ajoutes, image {img.split("/")[-1]}')
