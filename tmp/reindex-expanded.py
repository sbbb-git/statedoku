#!/usr/bin/env python3
"""
Re-index the subtopic pages once their bodies have actually been expanded.

Run after the symbols / fun-facts expansion workflows. Only flips a page
back to index if it now clears the word-count bar, so a stalled or partial
agent run can never put a thin page back in front of the AdSense reviewer.

Usage:
    python3 tmp/reindex-expanded.py symbols fun-facts
    python3 tmp/reindex-expanded.py symbols --min-words 600 --dry-run
"""
import os
import re
import sys
import glob
from collections import Counter

ROOT = os.path.dirname(os.path.dirname(os.path.abspath(__file__)))
MARKER = '<!-- noindex-subtopic -->'
GOOD_ROBOTS = '<meta name="robots" content="index, follow, max-image-preview:large">'

BLOCK_RE = re.compile(
    re.escape(MARKER) + r'\s*<meta\s+name=["\']robots["\']\s+content=["\']noindex,\s*follow["\']\s*/?>',
    re.IGNORECASE,
)

SCRIPT_RE = re.compile(r'<script.*?</script>', re.DOTALL | re.IGNORECASE)
STYLE_RE = re.compile(r'<style.*?</style>', re.DOTALL | re.IGNORECASE)
COMMENT_RE = re.compile(r'<!--.*?-->', re.DOTALL)


def body_words(html):
    t = SCRIPT_RE.sub(' ', html)
    t = STYLE_RE.sub(' ', t)
    t = COMMENT_RE.sub(' ', t)
    t = re.sub(r'<[^>]+>', ' ', t)
    return len(t.split())


def body_text(html):
    t = SCRIPT_RE.sub(' ', html)
    t = STYLE_RE.sub(' ', t)
    t = COMMENT_RE.sub(' ', t)
    t = re.sub(r'<[^>]+>', ' ', t)
    return re.sub(r'\s+', ' ', t).strip()


def ngrams(text, n=5):
    w = text.split()
    return set(' '.join(w[i:i + n]) for i in range(len(w) - n + 1))


def median_overlap(texts, sample=40, seed=7):
    """Median pairwise 5-gram overlap across a topic, as a percentage.

    This is the check that actually matters. Word count alone is what misled
    the earlier pass: /states/*/history/ averaged 1,063 words and still shared
    61% of its 5-grams across states, which is the pattern that triggered the
    AdSense low-value-content flag in the first place. Expanded /symbols/
    pages measure 8%, so the bar below is set to reject anything near the
    old template level.
    """
    import itertools
    import random
    keys = sorted(texts)
    if len(keys) < 2:
        return 0.0
    pairs = list(itertools.combinations(keys, 2))
    random.Random(seed).shuffle(pairs)
    sims = []
    for a, b in pairs[:sample]:
        na, nb = ngrams(texts[a]), ngrams(texts[b])
        if not na or not nb:
            continue
        sims.append(len(na & nb) / min(len(na), len(nb)) * 100)
    if not sims:
        return 0.0
    sims.sort()
    return sims[len(sims) // 2]


def main():
    args = [a for a in sys.argv[1:] if not a.startswith('--')]
    dry = '--dry-run' in sys.argv
    min_words = 600
    if '--min-words' in sys.argv:
        min_words = int(sys.argv[sys.argv.index('--min-words') + 1])
    max_overlap = 25.0
    if '--max-overlap' in sys.argv:
        max_overlap = float(sys.argv[sys.argv.index('--max-overlap') + 1])
    if not args:
        print('usage: reindex-expanded.py <subtopic>... [--min-words N] [--max-overlap P] [--dry-run]')
        return 1

    grand = Counter()
    blocked = []
    for topic in args:
        paths = sorted(glob.glob(os.path.join(ROOT, 'states', '*', topic, 'index.html')))
        pages = {}
        for p in paths:
            with open(p, 'r', encoding='utf-8', errors='ignore') as f:
                pages[p] = f.read()

        # Gate 1, applied to the whole topic: uniqueness. A topic that is still
        # templated must not be re-indexed even if every page is long enough.
        texts = {p: body_text(h) for p, h in pages.items()}
        overlap = median_overlap(texts)
        if overlap > max_overlap:
            print(f'{topic}: BLOCKED, median 5-gram overlap {overlap:.1f}% exceeds {max_overlap:.0f}%')
            print(f'   {len(paths)} pages left noindexed. Rewrite for uniqueness before re-indexing.')
            blocked.append(topic)
            grand['blocked-pages'] += len(paths)
            continue

        # Gate 2, per page: length.
        c = Counter()
        too_thin = []
        for path, html in pages.items():
            if MARKER not in html:
                c['already-indexed'] += 1
                continue
            wc = len(texts[path].split())
            if wc < min_words:
                c['still-too-thin'] += 1
                too_thin.append((os.path.relpath(path, ROOT), wc))
                continue
            if dry:
                c['would-restore'] += 1
                continue
            new = BLOCK_RE.sub(GOOD_ROBOTS, html, count=1)
            if new == html:
                c['pattern-miss'] += 1
                continue
            with open(path, 'w', encoding='utf-8') as f:
                f.write(new)
            c['restored'] += 1

        print(f'{topic}: overlap {overlap:.1f}% OK')
        for k, v in c.most_common():
            print(f'   {k}={v}')
        for p, wc in too_thin[:5]:
            print(f'   thin: {p} ({wc}w)')
        if len(too_thin) > 5:
            print(f'   ... +{len(too_thin)-5} more under {min_words}w')
        grand.update(c)

    print('\ntotal:', dict(grand))
    if blocked:
        print('blocked topics:', ', '.join(blocked))
    return 0


if __name__ == '__main__':
    sys.exit(main())
