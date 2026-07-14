#!/usr/bin/env python3
"""
Fix meta descriptions mangled by an earlier expand_description() pass
that spliced in a boilerplate suffix at the first period found in the
description, which sometimes cut through French apostrophe-elided words
(d'États became d. <junk>. 'États).

Two junk fragments to remove wherever they appear MID-STRING:
  " Ressource interactive gratuite sur la géographie américaine, 2026."
  " Free interactive US geography resource, updated for 2026."

Also fix common broken joins that leave orphan "d. " / "L. " / "n. "
before an apostrophe.
"""
import os
import re
import sys
from collections import Counter

ROOT = os.path.dirname(os.path.dirname(os.path.abspath(__file__)))

JUNK_PATTERNS = [
    # Order matters — long first
    r"\.\s*Ressource interactive gratuite sur la géographie américaine,\s*2026\.\s*",
    r"\.\s*Free interactive US geography resource,\s*updated for 2026\.\s*",
]

# Also cleanup any leftover orphan sequences like "d.'" or "L.'" that
# might remain after the junk removal.
ORPHAN_JOIN = re.compile(r"(\b[A-Za-zLln])\.'")


def fix_description(text):
    orig = text
    for pat in JUNK_PATTERNS:
        # Replace with just the apostrophe-friendly join char (space or nothing)
        # The junk always sat at a natural break, so removing it and joining
        # with an apostrophe restores the intended word.
        text = re.sub(pat, ".", text)
    # Try to fix "d.'États" → "d'États", "L.'histoire" → "L'histoire" etc.
    text = re.sub(r"(\b[A-Za-zLln])\.'", r"\1'", text)
    text = re.sub(r"(\b[A-Za-zLln])\. ('[a-zA-Zà-ÿ])", r"\1\2", text)
    return text


META_RE = re.compile(r'(<meta\s+(?:name|property)=["\'](?:description|og:description|twitter:description)["\']\s+content=["\'])([^"\']*?)(["\'])', re.IGNORECASE)


def process(path):
    with open(path, 'r', encoding='utf-8', errors='ignore') as f:
        src = f.read()
    new = META_RE.sub(lambda m: m.group(1) + fix_description(m.group(2)) + m.group(3), src)
    if new == src:
        return 'skip'
    with open(path, 'w', encoding='utf-8') as f:
        f.write(new)
    return 'edited'


c = Counter()
for dirpath, dirs, files in os.walk(ROOT):
    dirs[:] = [d for d in dirs if d not in ('node_modules', '.git', 'tmp')]
    for fn in files:
        if fn != 'index.html':
            continue
        full = os.path.join(dirpath, fn)
        if any(s in full for s in ('/admin/', '/bot/', '/marketing/', '/functions/')):
            continue
        try:
            c[process(full)] += 1
        except Exception as e:
            print(f'  !! {os.path.relpath(full, ROOT)}: {e}', file=sys.stderr)
            c['error'] += 1

for k, v in c.most_common():
    print(f'   {k}={v}')
