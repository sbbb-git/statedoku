#!/usr/bin/env python3
"""
Repair titles that an earlier trimming pass cut mid-word.

That pass enforced a 62-character ceiling by slicing the string, which left
half-words and unclosed parentheses in front of the " | Statedoku" suffix,
for example:

    Quizzes EE. UU. para Incrustar (Iframes Gratis para P | Statedoku
    Every State Flag Ranked Best to Worst by Vexillologis | Statedoku

The og:title on the same page usually still holds the untruncated string, so
that is the recovery source. Where it does not, the title is trimmed back to
the last clean word boundary and any dangling opening bracket is dropped.

    python3 tmp/fix-truncated-titles.py [--dry-run]
"""
import os
import re
import sys
from collections import Counter

ROOT = os.path.dirname(os.path.dirname(os.path.abspath(__file__)))
DRY = '--dry-run' in sys.argv
MAX = 62
SUFFIX = ' | Statedoku'
SKIP = ('/node_modules/', '/.git/', '/tmp/', '/admin/', '/functions/',
        '/bot/', '/marketing/', '/press/screenshots/')

TITLE_RE = re.compile(r'<title>(.*?)</title>', re.DOTALL)
OG_RE = re.compile(r'<meta\s+property="og:title"\s+content="([^"]*)"', re.IGNORECASE)


def core(t):
    """Strip the brand suffix so the real title can be inspected."""
    return re.sub(r'\s*\|\s*Statedoku\s*$', '', t).strip()


def looks_truncated(t):
    c = core(t)
    if not c:
        return False
    if c.count('(') > c.count(')') or c.count('«') > c.count('»'):
        return True
    if c.endswith(('-', ',', ':', ';')):
        return True
    # A trailing fragment of a longer word: last token is 1-3 chars and the
    # title sits right at the ceiling, which is the signature of a hard slice.
    parts = c.split()
    if len(parts) > 2 and len(t) >= MAX - 4:
        last = parts[-1].strip('.,)!?»"\'')
        if 0 < len(last) <= 3 and last.isalpha() and last.lower() not in {
            'us', 'usa', 'ai', 'dc', 'nyc', 'la', 'pib', 'gdp', 'a', 'to',
            'of', 'in', 'by', 'z', 'de', 'du', 'en', 'et', 'y', 'los', 'las',
        }:
            return True
    return False


# Words that must not be the last word of a title. Cutting after one of these
# leaves a phrase that reads as unfinished, which is worse for click-through
# than a shorter but complete title.
DANGLING = {
    # en
    'the', 'a', 'an', 'and', 'or', 'of', 'in', 'on', 'at', 'to', 'for', 'by',
    'with', 'from', 'every', 'all', 'its', 'their', 'his', 'her', 'that',
    'this', 'these', 'those', 'is', 'are', 'was', 'were', 'plus',
    # fr
    'le', 'la', 'les', 'un', 'une', 'des', 'du', 'de', 'et', 'ou', 'dans',
    'sur', 'pour', 'par', 'avec', 'aux', 'au', 'ses', 'leur', 'leurs',
    # es
    'el', 'los', 'las', 'una', 'unos', 'unas', 'y', 'o', 'en', 'con', 'por',
    'para', 'del', 'sus', 'su',
}


def shorten(text):
    """Trim to MAX chars including the suffix, ending on a complete phrase."""
    c = core(text)
    room = MAX - len(SUFFIX)
    if len(c) <= room:
        return c + SUFFIX
    cut = c[:room]
    if ' ' in cut:
        cut = cut[:cut.rfind(' ')]

    # Drop a bracket the cut left open.
    if cut.count('(') > cut.count(')'):
        cut = cut[:cut.rfind('(')].rstrip()
    if cut.count('«') > cut.count('»'):
        cut = cut[:cut.rfind('«')].rstrip()

    # Peel trailing connectors and dangling function words until the last
    # token can actually end a phrase.
    while True:
        cut = cut.rstrip(' ,:;-–—+&/·|')
        parts = cut.split()
        if len(parts) > 2 and parts[-1].lower().strip('.,') in DANGLING:
            cut = ' '.join(parts[:-1])
            continue
        break

    return cut + SUFFIX


def main():
    stats = Counter()
    examples = []
    for dirpath, dirs, files in os.walk(ROOT):
        dirs[:] = [d for d in dirs if d not in ('node_modules', '.git', 'tmp')]
        for fn in files:
            if fn not in ('index.html', '404.html'):
                continue
            p = os.path.join(dirpath, fn)
            if any(s in p.replace(os.sep, '/') for s in SKIP):
                continue
            with open(p, 'r', encoding='utf-8', errors='ignore') as f:
                html = f.read()
            m = TITLE_RE.search(html)
            if not m:
                continue
            old = m.group(1).strip()
            if not looks_truncated(old):
                stats['ok'] += 1
                continue

            og = OG_RE.search(html)
            source = old
            if og and len(core(og.group(1))) > len(core(old)):
                source = og.group(1)
                stats['recovered_from_og'] += 1
            else:
                stats['trimmed_in_place'] += 1

            new = shorten(source)
            if new == old:
                stats['unchanged'] += 1
                continue
            if len(examples) < 12:
                examples.append((os.path.relpath(p, ROOT), old, new))
            if not DRY:
                with open(p, 'w', encoding='utf-8') as f:
                    f.write(html[:m.start()] + f'<title>{new}</title>' + html[m.end():])
            stats['fixed'] += 1

    print('DRY RUN\n' if DRY else '')
    for path, old, new in examples:
        print(f'  {path}')
        print(f'    - {old}')
        print(f'    + {new}')
    print('\n', dict(stats))


if __name__ == '__main__':
    main()
