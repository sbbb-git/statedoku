#!/usr/bin/env python3
"""
Render FAQPage structured data into the visible page body.

Many pages carry FAQPage JSON-LD whose questions and answers appear nowhere
on the page. Google's structured data policy requires FAQ markup to reflect
content the user can actually see, and markup-only FAQ is the specific
pattern that draws a spammy-structured-markup manual action. With an AdSense
low-value-content review already open, that is a second, independent strike.

The content already exists inside the JSON-LD, so this needs no rewriting:
parse the schema, emit a matching <details> accordion before the closing
</main>, and the markup becomes truthful. It also adds 150 to 250 words of
real content per page, which lifts a good share of the thin pages over the
line as a side effect.

    python3 tmp/render-faq-blocks.py [--dry-run]

Idempotent via a marker. Skips pages that already show their FAQ.
"""
import os
import re
import sys
import json
import html as html_mod
from collections import Counter

ROOT = os.path.dirname(os.path.dirname(os.path.abspath(__file__)))
DRY = '--dry-run' in sys.argv
MARKER = '<!-- faq-rendered -->'
SKIP = ('/node_modules/', '/.git/', '/tmp/', '/admin/', '/functions/',
        '/bot/', '/marketing/', '/press/screenshots/')

LD_RE = re.compile(r'<script type="application/ld\+json">(.*?)</script>', re.DOTALL)
MAIN_CLOSE = re.compile(r'</main>', re.IGNORECASE)
NOINDEX_RE = re.compile(r'name=["\']robots["\'][^>]*noindex', re.IGNORECASE)

HEADING = {
    'en': 'Frequently asked questions',
    'fr': 'Questions fréquentes',
    'es': 'Preguntas frecuentes',
}


def lang_of(rel):
    p = rel.replace(os.sep, '/')
    if p.startswith('fr/'):
        return 'fr'
    if p.startswith('es/'):
        return 'es'
    return 'en'


def extract_faq(page_html):
    """Return [(question, answer_html)] from the first FAQPage block."""
    for m in LD_RE.finditer(page_html):
        raw = m.group(1).strip()
        if '"FAQPage"' not in raw:
            continue
        try:
            data = json.loads(raw)
        except json.JSONDecodeError:
            continue
        items = data.get('mainEntity')
        if not isinstance(items, list):
            continue
        out = []
        for it in items:
            if not isinstance(it, dict):
                continue
            q = (it.get('name') or '').strip()
            ans = it.get('acceptedAnswer') or {}
            a = (ans.get('text') or '').strip() if isinstance(ans, dict) else ''
            if q and a:
                out.append((q, a))
        if out:
            return out
    return []


def already_visible(page_html, pairs):
    """True if the page body already shows these questions."""
    m = re.search(r'<main.*?</main>', page_html, re.DOTALL | re.IGNORECASE)
    body = m.group(0) if m else page_html
    body = LD_RE.sub('', body)
    if '<details' in body.lower() or 'faq-block' in body:
        return True
    # Fall back to checking whether the first question's text is present.
    probe = html_mod.unescape(pairs[0][0])[:45]
    return probe and probe in html_mod.unescape(body)


STYLE = (
    '<style>'
    '.faq-rendered{margin:34px 0 10px}'
    '.faq-rendered h2{font-size:1.3rem;font-weight:800;margin:0 0 12px}'
    '.faq-rendered details{border:1px solid var(--border,#E2E8F0);border-radius:10px;'
    'margin-bottom:8px;padding:12px 16px;background:#fff}'
    '.faq-rendered summary{cursor:pointer;font-weight:700;color:var(--navy,#0F2147);'
    'list-style:none}'
    '.faq-rendered summary::-webkit-details-marker{display:none}'
    '.faq-rendered summary::after{content:"+";float:right;font-weight:800;color:var(--gold,#F59E0B)}'
    '.faq-rendered details[open] summary::after{content:"\\2013"}'
    '.faq-rendered details[open] summary{margin-bottom:8px}'
    '.faq-rendered p{margin:0;color:var(--text-2,#475569);line-height:1.6;font-size:.95rem}'
    '</style>'
)


def build_block(pairs, lang, needs_style):
    rows = []
    for q, a in pairs:
        qe = html_mod.escape(q, quote=False)
        ae = html_mod.escape(a, quote=False)
        rows.append(f'    <details>\n      <summary>{qe}</summary>\n      <p>{ae}</p>\n    </details>')
    body = '\n'.join(rows)
    style = STYLE if needs_style else ''
    return (f'  {MARKER}\n  <section class="faq-rendered">\n'
            f'    <h2>{HEADING[lang]}</h2>\n{body}\n  </section>\n{style}\n')


def main():
    stats = Counter()
    for dirpath, dirs, files in os.walk(ROOT):
        dirs[:] = [d for d in dirs if d not in ('node_modules', '.git', 'tmp')]
        for fn in files:
            if fn != 'index.html':
                continue
            p = os.path.join(dirpath, fn)
            if any(s in p.replace(os.sep, '/') for s in SKIP):
                continue
            with open(p, 'r', encoding='utf-8', errors='ignore') as f:
                page = f.read()

            if MARKER in page:
                stats['already_rendered'] += 1
                continue
            if '"FAQPage"' not in page:
                continue
            if NOINDEX_RE.search(page):
                stats['skipped_noindex'] += 1
                continue

            pairs = extract_faq(page)
            if not pairs:
                stats['unparseable'] += 1
                continue
            if already_visible(page, pairs):
                stats['already_visible'] += 1
                continue

            m = MAIN_CLOSE.search(page)
            if not m:
                stats['no_main'] += 1
                continue

            rel = os.path.relpath(p, ROOT)
            block = build_block(pairs, lang_of(rel), 'faq-rendered{' not in page)
            new = page[:m.start()] + block + page[m.start():]
            if not DRY:
                with open(p, 'w', encoding='utf-8') as f:
                    f.write(new)
            stats['rendered'] += 1
            stats['_questions'] += len(pairs)

    print('DRY RUN\n' if DRY else '')
    for k, v in stats.most_common():
        print(f'   {k}={v}')
    if stats['rendered']:
        print(f"\n   avg questions per page: {stats['_questions'] / stats['rendered']:.1f}")


if __name__ == '__main__':
    main()
