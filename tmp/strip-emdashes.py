#!/usr/bin/env python3
"""
Strip em-dashes and en-dashes from every HTML page site-wide.

Em-dashes are the biggest AI-writing tell. This pass replaces them with
commas in VISIBLE TEXT only. Content inside <script>, <style>, and HTML
comments is preserved as-is (JSON-LD schema validity + code safety).

Replacements:
    "—"   (U+2014 em-dash)         → ","
    "–"   (U+2013 en-dash)         → ","
    "‒"   (U+2012 figure dash)     → ","
    "―"   (U+2015 horizontal bar)  → ","
    " - " (spaced-hyphen pause)    → ","

Cleanup after replacement:
    double comma, comma-before-punct, leading/trailing spaces, etc.

Skips: /bot/, /tmp/, /admin/, /functions/, /node_modules/, /.git/
"""
import os
import re
import sys
from collections import Counter

ROOT = os.path.dirname(os.path.dirname(os.path.abspath(__file__)))
SKIP = ('/node_modules/', '/.git/', '/tmp/', '/admin/', '/functions/',
        '/bot/', '/marketing/', '/press/screenshots/')


def should_skip(path):
    p = path.replace(os.sep, '/')
    return any(s in p for s in SKIP)


DASHES = ['—', '–', '‒', '―', '−']

# Match <script>…</script>, <style>…</style>, and HTML comments.
# DOTALL so they span newlines. Non-greedy so nested tags work.
SCRIPT_RE  = re.compile(r'<script\b[^>]*>.*?</script>', re.DOTALL | re.IGNORECASE)
STYLE_RE   = re.compile(r'<style\b[^>]*>.*?</style>',   re.DOTALL | re.IGNORECASE)
COMMENT_RE = re.compile(r'<!--.*?-->',                  re.DOTALL)


def strip_dashes(html):
    """Return (new_html, replacements_made)."""
    # 1. Save all script/style/comment blocks under placeholders
    saved = []

    def stash(m):
        saved.append(m.group(0))
        return f'\x00STASH{len(saved) - 1}\x00'

    tmp = SCRIPT_RE.sub(stash, html)
    tmp = STYLE_RE.sub(stash, tmp)
    tmp = COMMENT_RE.sub(stash, tmp)

    # 2. Replace unicode dashes with commas
    count = 0
    for d in DASHES:
        c = tmp.count(d)
        if c:
            tmp = tmp.replace(d, ',')
            count += c

    # 3. Replace ' - ' (spaced-hyphen pause). Careful: not "-" inside words
    #    or in dates like "2024-06-01". The " - " with spaces on both sides
    #    is safe to swap.
    c = tmp.count(' - ')
    if c:
        tmp = tmp.replace(' - ', ', ')
        count += c

    # 4. Cleanup — LINE-LOCAL only, do NOT touch line-leading whitespace
    #    (that would reformat all HTML indentation).
    def scrub_line(line):
        # Preserve leading whitespace exactly
        stripped = line.lstrip(' \t')
        lead = line[: len(line) - len(stripped)]
        # Now safe to apply inline fixes to `stripped`
        stripped = re.sub(r', *,', ',', stripped)          # double comma
        stripped = re.sub(r' +,', ',', stripped)           # " ,"  → ","
        stripped = re.sub(r',([.!?])', r'\1', stripped)    # ", ." → "."
        # comma directly followed by letter → comma+space+letter
        stripped = re.sub(r',([A-Za-zÀ-ÿ])', r', \1', stripped)
        # collapse doubled spaces INSIDE the line (not leading)
        stripped = re.sub(r'  +', ' ', stripped)
        return lead + stripped

    tmp = '\n'.join(scrub_line(ln) for ln in tmp.split('\n'))

    # 5. Restore stashed blocks
    def unstash(m):
        idx = int(m.group(1))
        return saved[idx]

    tmp = re.sub(r'\x00STASH(\d+)\x00', unstash, tmp)

    return tmp, count


def main():
    stats = Counter()
    files_touched = 0
    total_replacements = 0

    for dirpath, dirs, files in os.walk(ROOT):
        dirs[:] = [d for d in dirs if d not in ('node_modules', '.git', 'tmp')]
        for fn in files:
            if not fn.endswith('.html'):
                continue
            full = os.path.join(dirpath, fn)
            if should_skip(full):
                stats['skipped'] += 1
                continue
            try:
                with open(full, 'r', encoding='utf-8', errors='ignore') as f:
                    src = f.read()
                new, n = strip_dashes(src)
                if n == 0:
                    stats['already-clean'] += 1
                    continue
                if new != src:
                    with open(full, 'w', encoding='utf-8') as f:
                        f.write(new)
                    files_touched += 1
                    total_replacements += n
                    stats['edited'] += 1
            except Exception as e:
                print(f'  !! {os.path.relpath(full, ROOT)}: {e}', file=sys.stderr)
                stats['error'] += 1

    print(f'\n✅ files_touched={files_touched}  total_replacements={total_replacements}')
    for k, v in stats.most_common():
        print(f'   {k}={v}')


if __name__ == '__main__':
    main()
