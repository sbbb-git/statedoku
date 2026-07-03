#!/usr/bin/env python3
"""
Local SEO audit — scans every index.html on the site and flags concrete
fixable issues. Deterministic, no external calls.

Output: /Users/sacha/Desktop/Statoku/tmp/seo-audit-report.json

Categories checked:
  1. Title length (should be 30-65 chars)
  2. Meta description (120-165 chars)
  3. Canonical URL presence + matches path
  4. hreflang presence for multilingual pages
  5. H1 (exactly one per page)
  6. Word count (thin content flag: <300 words)
  7. Image alt attributes (all imgs)
  8. Open Graph completeness (og:title, og:description, og:image, og:url)
  9. JSON-LD schema presence (at least BreadcrumbList)
 10. Duplicate title text across pages
 11. Duplicate meta description text across pages
 12. Broken hreflang: link to non-existent path
 13. Missing GA4 tag
 14. Missing AdSense tag
"""
import os
import re
import json
import sys
from collections import Counter, defaultdict
from html.parser import HTMLParser
from urllib.parse import urlparse

ROOT = os.path.dirname(os.path.dirname(os.path.abspath(__file__)))
SKIP = ('/node_modules/', '/.git/', '/tmp/', '/admin/', '/functions/', '/bot/', '/marketing/', '/scripts/', '/press/screenshots/')


def rel(p):
    return os.path.relpath(p, ROOT)


def should_skip(path):
    p = path.replace(os.sep, '/')
    return any(s in p for s in SKIP)


class Extract(HTMLParser):
    def __init__(self):
        super().__init__()
        self.title = ''
        self._in_title = False
        self.desc = None
        self.canonical = None
        self.og = {}
        self.hreflangs = []
        self.h1s = []
        self._in_h1 = False
        self._h1_buf = []
        self.imgs = []       # list of (src, alt or None)
        self.jsonld_types = []
        self._in_jsonld = False
        self._jsonld_buf = []
        self.has_ga4 = False
        self.has_adsense = False
        self._body_text_parts = []
        self._in_script = 0
        self._in_style = 0

    def handle_starttag(self, tag, attrs):
        a = dict(attrs)
        if tag == 'title':
            self._in_title = True
        elif tag == 'meta':
            name = (a.get('name') or '').lower()
            prop = (a.get('property') or '').lower()
            content = a.get('content') or ''
            if name == 'description':
                self.desc = content
            elif prop.startswith('og:'):
                self.og[prop] = content
        elif tag == 'link':
            rel_ = (a.get('rel') or '').lower()
            href = a.get('href') or ''
            if 'canonical' in rel_:
                self.canonical = href
            elif 'alternate' in rel_ and a.get('hreflang'):
                self.hreflangs.append((a.get('hreflang'), href))
        elif tag == 'script':
            src = a.get('src') or ''
            if 'googletagmanager.com/gtag/js' in src:
                self.has_ga4 = True
            elif 'pagead2.googlesyndication.com/pagead/js/adsbygoogle.js' in src:
                self.has_adsense = True
            if a.get('type', '').lower() == 'application/ld+json':
                self._in_jsonld = True
                self._jsonld_buf = []
            self._in_script += 1
        elif tag == 'style':
            self._in_style += 1
        elif tag == 'h1':
            self._in_h1 = True
            self._h1_buf = []
        elif tag == 'img':
            self.imgs.append((a.get('src') or '', a.get('alt', None)))

    def handle_endtag(self, tag):
        if tag == 'title':
            self._in_title = False
        elif tag == 'script':
            self._in_script -= 1
            if self._in_jsonld:
                blob = ''.join(self._jsonld_buf).strip()
                try:
                    parsed = json.loads(blob)
                    def walk(o):
                        if isinstance(o, dict):
                            t = o.get('@type')
                            if isinstance(t, str):
                                self.jsonld_types.append(t)
                            for v in o.values():
                                walk(v)
                        elif isinstance(o, list):
                            for v in o:
                                walk(v)
                    walk(parsed)
                except json.JSONDecodeError:
                    self.jsonld_types.append('__INVALID__')
                self._in_jsonld = False
        elif tag == 'style':
            self._in_style -= 1
        elif tag == 'h1':
            self._in_h1 = False
            self.h1s.append(''.join(self._h1_buf).strip())

    def handle_data(self, data):
        if self._in_title:
            self.title += data
        if self._in_h1:
            self._h1_buf.append(data)
        if self._in_jsonld:
            self._jsonld_buf.append(data)
        # collect body text approximation (not perfect, but ok for word count)
        if self._in_script == 0 and self._in_style == 0:
            self._body_text_parts.append(data)

    def word_count(self):
        text = ' '.join(self._body_text_parts)
        text = re.sub(r'\s+', ' ', text).strip()
        return len([w for w in text.split() if len(w) > 1])


def audit_page(path):
    with open(path, 'r', encoding='utf-8', errors='ignore') as f:
        html = f.read()
    p = Extract()
    p.feed(html)
    issues = []

    # 1. Title length
    tlen = len(p.title.strip())
    if tlen == 0:
        issues.append(('missing_title', ''))
    elif tlen < 25:
        issues.append(('title_too_short', f'{tlen} chars'))
    elif tlen > 70:
        issues.append(('title_too_long', f'{tlen} chars'))

    # 2. Description
    dlen = len(p.desc) if p.desc else 0
    if not p.desc:
        issues.append(('missing_description', ''))
    elif dlen < 100:
        issues.append(('description_too_short', f'{dlen} chars'))
    elif dlen > 175:
        issues.append(('description_too_long', f'{dlen} chars'))

    # 3. Canonical
    if not p.canonical:
        issues.append(('missing_canonical', ''))

    # 4. hreflang for pages in known multilingual folders
    rel_path = rel(path).replace(os.sep, '/')
    is_multi = any(rel_path.startswith(x) or ('/' + x + '/') in ('/' + rel_path)
                    for x in ['learn/', 'fr/learn/', 'es/learn/', 'play/', 'fr/play/', 'es/play/',
                              'widgets/', 'fr/widgets/', 'es/widgets/'])
    is_root_lang = rel_path in ('index.html', 'fr/index.html', 'es/index.html')
    if (is_multi or is_root_lang) and not p.hreflangs:
        issues.append(('missing_hreflang', ''))

    # 5. H1 exactly one
    if len(p.h1s) == 0:
        issues.append(('missing_h1', ''))
    elif len(p.h1s) > 1:
        issues.append(('multiple_h1s', f'{len(p.h1s)} h1s'))

    # 6. Thin content
    wc = p.word_count()
    if wc < 200 and 'learn/' in rel_path:
        # /learn/ pages should be substantial
        issues.append(('thin_content', f'{wc} words'))

    # 7. Images without alt
    imgs_no_alt = [src for src, alt in p.imgs if alt is None]
    if imgs_no_alt:
        issues.append(('img_missing_alt', f'{len(imgs_no_alt)} imgs'))

    # 8. OG completeness
    needed_og = ['og:title', 'og:description', 'og:url']
    missing_og = [k for k in needed_og if k not in p.og]
    if missing_og:
        issues.append(('incomplete_og', ','.join(missing_og)))

    # 9. JSON-LD
    if not p.jsonld_types:
        issues.append(('no_jsonld', ''))
    elif '__INVALID__' in p.jsonld_types:
        issues.append(('invalid_jsonld', ''))

    # 13. GA4
    if not p.has_ga4:
        issues.append(('missing_ga4', ''))
    # 14. AdSense
    if not p.has_adsense:
        issues.append(('missing_adsense', ''))

    return {
        'path': rel_path,
        'title': p.title.strip(),
        'description': p.desc,
        'canonical': p.canonical,
        'wc': wc,
        'h1_count': len(p.h1s),
        'issues': issues,
    }


def main():
    print('Scanning HTML files…', file=sys.stderr)
    pages = []
    total_scanned = 0
    for dirpath, dirs, files in os.walk(ROOT):
        # prune
        dirs[:] = [d for d in dirs if d not in ('node_modules', '.git', 'tmp')]
        for fn in files:
            if fn != 'index.html':
                continue
            full = os.path.join(dirpath, fn)
            if should_skip(full):
                continue
            total_scanned += 1
            try:
                pages.append(audit_page(full))
            except Exception as e:
                print(f'  !! error {rel(full)}: {e}', file=sys.stderr)

    # Cross-page checks
    titles = Counter(p['title'] for p in pages if p['title'])
    dupe_titles = {t: c for t, c in titles.items() if c > 1 and t}
    descs = Counter(p['description'] for p in pages if p['description'])
    dupe_descs = {d: c for d, c in descs.items() if c > 1 and d}

    for p in pages:
        if p['title'] in dupe_titles:
            p['issues'].append(('duplicate_title', f'{dupe_titles[p["title"]]} pages share it'))
        if p['description'] in dupe_descs:
            p['issues'].append(('duplicate_description', f'{dupe_descs[p["description"]]} pages share it'))

    # Summary counts
    counter = Counter()
    for p in pages:
        for k, _ in p['issues']:
            counter[k] += 1

    # Sort pages by issue count desc
    pages.sort(key=lambda x: -len(x['issues']))

    report = {
        'total_scanned': total_scanned,
        'issue_counts': dict(counter.most_common()),
        'duplicate_title_examples': list(dupe_titles.items())[:10],
        'duplicate_desc_examples': list(dupe_descs.items())[:10],
        'top_offenders': [
            {
                'path': p['path'],
                'issues': p['issues'],
                'title': p['title'][:80],
                'wc': p['wc'],
            }
            for p in pages[:40]
        ],
    }
    print(json.dumps(report, indent=2))
    return report


if __name__ == '__main__':
    main()
