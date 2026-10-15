#!/usr/bin/env python3
"""Write each indexable page's dates on the page itself.

The sitemap has carried an honest lastmod since September (see
build-sitemap-lastmod.py), but on 15 October 2026 only 8 of the 640 indexable
pages declared a dateModified and none showed a date a reader could see.
Answer engines (ChatGPT search, Perplexity, Copilot) weigh freshness, read the
page rather than the sitemap, and quote what is visible. So every page gets:

  - a JSON-LD WebPage block, marked data-page-dates, with datePublished (the
    file's first commit), dateModified (its sitemap lastmod), the author's pen
    name linking to /about/, and the publisher;
  - a visible "Last updated" line at the end of <main>, in the page's language;
  - an existing Article dateModified brought into line with the same date.

Both blocks are excluded from build-sitemap-lastmod.py's reader_text, and so is
any dateModified value, so stamping never re-dates a page and a re-run changes
nothing. Run it after build-sitemap-lastmod.py, which calls it.

Skipped: the three homepages and archives (game screens, where a date reads as
the puzzle's date), and the about, privacy, terms and legal pages, which carry
their own dated notice and are not edited during the AdSense review.
"""
import html, json, pathlib, re, subprocess, sys

ROOT = pathlib.Path(__file__).resolve().parent.parent
BASE = 'https://statedoku.com'
SKIP = re.compile(r'^/((fr|es)/)?((about|privacy|terms|legal|mentions-legales|aviso-legal|archive)/)?$')
LD = re.compile(r'\s*<script type="application/ld\+json" data-page-dates>.*?</script>', re.S)
VISIBLE = re.compile(r'\s*<p class="page-updated">.*?</p>', re.S)
MONTHS = {
    'en': ['January', 'February', 'March', 'April', 'May', 'June', 'July', 'August',
           'September', 'October', 'November', 'December'],
    'fr': ['janvier', 'février', 'mars', 'avril', 'mai', 'juin', 'juillet', 'août',
           'septembre', 'octobre', 'novembre', 'décembre'],
    'es': ['enero', 'febrero', 'marzo', 'abril', 'mayo', 'junio', 'julio', 'agosto',
           'septiembre', 'octubre', 'noviembre', 'diciembre'],
}
AUTHOR = {'@type': 'Person', 'name': 'Moses Tounby', 'url': f'{BASE}/about/'}
PUBLISHER = {'@type': 'Organization', 'name': 'Statedoku', 'url': f'{BASE}/',
             'logo': {'@type': 'ImageObject', 'url': f'{BASE}/apple-touch-icon.png',
                      'width': 180, 'height': 180}}


def lastmod():
    src = (ROOT / 'functions' / '_sitemap-lastmod.js').read_text(encoding='utf-8')
    out = dict(re.findall(r'"(/[^"]*)": "(\d{4}-\d{2}-\d{2})"', src))
    if not out:
        sys.exit('stamp-page-dates: the lastmod map is empty, refusing to stamp nothing')
    return out


def first_commit(rel):
    log = subprocess.run(['git', 'log', '--format=%cs', '--', rel], cwd=ROOT,
                         capture_output=True, text=True).stdout.split()
    return log[-1] if log else None


def human(date, lang):
    y, m, d = (int(x) for x in date.split('-'))
    month = MONTHS[lang][m - 1]
    if lang == 'fr':
        return f'Mis à jour le <time datetime="{date}">{"1er" if d == 1 else d} {month} {y}</time>'
    if lang == 'es':
        return f'Actualizado el <time datetime="{date}">{d} de {month} de {y}</time>'
    return f'Last updated: <time datetime="{date}">{month} {d}, {y}</time>'


def stamp(url, modified, check):
    rel = 'index.html' if url == '/' else url.strip('/') + '/index.html'
    f = ROOT / rel
    s = f.read_text(encoding='utf-8')
    lang = re.search(r'<html lang="([a-z]{2})', s).group(1)
    published = first_commit(rel) or modified
    if published > modified:
        published = modified
    title = html.unescape(re.search(r'<title>(.*?)</title>', s, re.S).group(1)).strip()
    title = re.sub(r'\s*\|\s*Statedoku$', '', title)
    desc = re.search(r'<meta name="description" content="([^"]*)"', s)
    block = {
        '@context': 'https://schema.org', '@type': 'WebPage', '@id': f'{BASE}{url}#webpage',
        'url': f'{BASE}{url}', 'name': title, 'inLanguage': lang,
        'datePublished': published, 'dateModified': modified,
        'author': AUTHOR, 'publisher': PUBLISHER,
        'isPartOf': {'@type': 'WebSite', 'name': 'Statedoku', 'url': f'{BASE}/'},
    }
    if desc:
        block['description'] = html.unescape(desc.group(1))
    ld = ('\n  <script type="application/ld+json" data-page-dates>'
          + json.dumps(block, ensure_ascii=False).replace('</', '<\\/') + '</script>')
    new = LD.sub('', s)
    new = new.replace('</head>', ld + '\n</head>', 1)
    new = VISIBLE.sub('', new)
    if new.count('</main>') != 1:
        sys.exit(f'stamp-page-dates: {rel} has {new.count("</main>")} </main>, expected one')
    new = new.replace('</main>', f'\n  <p class="page-updated">{human(modified, lang)}</p>\n</main>', 1)
    # An Article block already on the page must not contradict the WebPage one.
    new = re.sub(r'("@type"\s*:\s*"Article"[^<]*?"dateModified"\s*:\s*")[^"]*(")',
                 lambda m: m.group(1) + modified + m.group(2), new)
    if new == s:
        return False
    if not check:
        f.write_text(new, encoding='utf-8')
    return True


def main():
    check = '--check' in sys.argv
    lm = lastmod()
    todo = [(u, d) for u, d in sorted(lm.items()) if not SKIP.match(u)]
    changed = sum(stamp(u, d, check) for u, d in todo)
    print(f'stamp-page-dates: {len(lm)} indexable, {len(lm) - len(todo)} skipped, '
          f'{len(todo)} stamped, {changed} {"stale" if check else "changed"}')
    if check and changed:
        sys.exit(1)


if __name__ == '__main__':
    main()
