#!/usr/bin/env python3
"""
Strip the auto-generated thin FAQ blocks from /states/<state>/<topic>/
pages that Bing Webmaster Tools flagged for low-quality structured data.

The FAQ has filler answers like "Yes, California has produced notable
musicians" — which Google's FAQ schema guidelines explicitly forbid
("Question and answer content created for the sole purpose of SEO,
especially if it includes irrelevant or repetitive content").

Two things to remove per page:
  1. <script type="application/ld+json">…@type":"FAQPage"…</script>
  2. <h2 id="faq">…</h2> followed by <div class="faq-block">…</div>

Idempotent. Logs each modification.
"""
import os
import re
import sys

ROOT = os.path.dirname(os.path.dirname(os.path.abspath(__file__)))

TOPICS = ['people', 'history', 'geography', 'sports', 'map']

FAQ_JSONLD = re.compile(
    r'\s*<script type="application/ld\+json">\s*\{"@context":"https://schema\.org","@type":"FAQPage".*?</script>',
    re.DOTALL,
)
FAQ_VISIBLE = re.compile(
    r'\s*<h2 id="faq">[^<]*</h2>\s*<div class="faq-block">.*?</div>\s*\n',
    re.DOTALL,
)


def find_state_slugs():
    states_dir = os.path.join(ROOT, 'states')
    slugs = []
    for d in sorted(os.listdir(states_dir)):
        full = os.path.join(states_dir, d)
        if os.path.isdir(full):
            slugs.append(d)
    return slugs


def main():
    edited = 0
    skipped_clean = 0
    no_match = 0
    missing = 0
    slugs = find_state_slugs()
    for slug in slugs:
        for topic in TOPICS:
            path = os.path.join(ROOT, 'states', slug, topic, 'index.html')
            if not os.path.isfile(path):
                missing += 1
                continue
            with open(path, 'r', encoding='utf-8') as f:
                src = f.read()
            new = src
            new, n_json = FAQ_JSONLD.subn('', new)
            new, n_html = FAQ_VISIBLE.subn('', new)
            if n_json == 0 and n_html == 0:
                if 'FAQPage' not in src and 'id="faq"' not in src:
                    skipped_clean += 1
                else:
                    no_match += 1
                    print(f"  ! pattern miss: {os.path.relpath(path, ROOT)}", file=sys.stderr)
                continue
            with open(path, 'w', encoding='utf-8') as f:
                f.write(new)
            edited += 1
    print(f"\n✅ edited={edited}  already-clean={skipped_clean}  pattern-miss={no_match}  missing-file={missing}")


if __name__ == '__main__':
    main()
