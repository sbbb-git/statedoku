#!/usr/bin/env python3
"""Generate functions/_sitemap-lastmod.js from real git history.

The sitemap carried no lastmod at all, and lastmod is the main signal Google
uses to decide what to re-crawl. The index reading of 20 September 2026 showed
why that matters here: 277 of 757 pages had never been crawled and 231 had not
been seen since July.

The date has to be honest or Google ignores it. The last commit that touched a
file is the wrong answer on this repo: a cache-bust pass rewrites the ?v=N query
string on 2,000 pages at once without changing a word anyone reads, and stamping
all of them as freshly modified is exactly the noise that gets lastmod
discounted. So walk each file's history newest first and take the first commit
whose diff for that file changes something other than an asset version.
"""
import json, pathlib, re, subprocess, sys

ROOT = pathlib.Path(__file__).resolve().parent.parent
SKIP = {'node_modules', '.git', 'tmp', 'marketing', 'scripts', 'admin', 'seo-snapshots'}
OUT = ROOT / 'functions' / '_sitemap-lastmod.js'
# No cap on the walk. With one, a page whose last dozen commits were all
# cache-busts fell back to the newest commit and was stamped with today's
# date: on 15 October 2026 that re-dated /api/ and six region pages, none of
# which had changed a word since August. The file's first commit always
# counts, so the walk always ends on a real date.

ROBOTS = re.compile(r'<meta[^>]*name="robots"[^>]*content="([^"]*)"', re.I)
# Boilerplate that changes on every page at once without changing a word a
# reader reads: asset versions, script tags added or removed, the footer, the
# Share to Classroom block. A commit that only touches these is walked past.
# On 7 October 2026, removing an unused script tag from 696 pages and
# versioning config.js on 1,957 would otherwise have re-dated 572 pages.
VERSION = re.compile(r'\?v=\d+')
SCRIPT_LINE = re.compile(r'^\s*<script\b[^>]*\bsrc="[^"]*"[^>]*>\s*</script>\s*$', re.M)
FOOTER = re.compile(r'<footer\b.*?</footer>', re.S)
GC_SHARE = re.compile(r'<div class="gc-share-wrap">.*?</div>', re.S)
# Instrumentation blocks added to every game page: the GA4 funnel listener and
# the end-of-game offer. Not other inline scripts: a game's questions live in
# its inline code, and a deck correction is a real content change.
INSTRUMENTATION = re.compile(r'<script>\s*// (?:GA4 funnel for this game|End of a game: offer the next game).*?</script>', re.S)
TEMPLATE = re.compile(r'<template id="next-game-tpl">.*?</template>', re.S)
# The dates stamp-page-dates.py writes from this very map. Left in, stamping a
# page would count as a change to it and re-date it on the next run.
PAGE_DATES = re.compile(r'<script type="application/ld\+json" data-page-dates>.*?</script>', re.S)
PAGE_UPDATED = re.compile(r'<p class="page-updated">.*?</p>', re.S)
DATE_MODIFIED = re.compile(r'"dateModified"\s*:\s*"[^"]*"')
# The state abbreviation moved from a span inside the H1 to a data-abbr
# attribute drawn by CSS on 22 October 2026. The heading reads the same, so
# both forms reduce to the bare <h1> and the move dates no page.
H1_BADGE_OLD = re.compile(r'(<h1>)<span class="(?:abbr-badge|badge)"[^>]*>[A-Z]{2}</span>')
H1_BADGE_NEW = re.compile(r'<h1 data-abbr="[A-Z]{2}"(?: style="--abbr-bg:[^"]*")?>')


def reader_text(html):
    """The page minus boilerplate, whitespace collapsed."""
    html = VERSION.sub('', html)
    html = SCRIPT_LINE.sub('', html)
    html = FOOTER.sub('', html)
    html = GC_SHARE.sub('', html)
    html = INSTRUMENTATION.sub('', html)
    html = TEMPLATE.sub('', html)
    html = PAGE_DATES.sub('', html)
    html = PAGE_UPDATED.sub('', html)
    html = DATE_MODIFIED.sub('', html)
    html = H1_BADGE_OLD.sub(r'\1', html)
    html = H1_BADGE_NEW.sub('<h1>', html)
    return re.sub(r'\s+', ' ', html).strip()


def git(*args):
    return subprocess.run(['git', *args], cwd=ROOT, capture_output=True, text=True).stdout


def meaningful_date(rel):
    """Newest commit touching this file that changed what a reader reads."""
    log = git('log', '--format=%H %cs', '--', rel).strip().splitlines()
    if not log:
        return None
    for line in log:
        sha, date = line.split(' ', 1)
        after = git('show', f'{sha}:{rel}')
        before = git('show', f'{sha}^:{rel}')
        if before and reader_text(before) == reader_text(after):
            continue          # boilerplate only, keep walking back
        return date
    return log[-1].split(' ', 1)[1]


def main():
    pages = []
    for p in sorted(ROOT.rglob('index.html')):
        if any(s in p.parts for s in SKIP):
            continue
        html = p.read_text(encoding='utf-8', errors='ignore')
        if any('noindex' in v.lower() for v in ROBOTS.findall(html)):
            continue
        d = str(p.parent.relative_to(ROOT)).replace('\\', '/')
        pages.append(('/' if d == '.' else f'/{d}/', str(p.relative_to(ROOT))))

    if not pages:
        sys.exit('Found no indexable page. A generator that writes an empty map and reports '
                 'success has checked nothing, so this stops instead.')

    out, bumped_only = {}, 0
    for i, (url, rel) in enumerate(pages, 1):
        d = meaningful_date(rel)
        if d:
            out[url] = d
        newest = git('log', '-1', '--format=%cs', '--', rel).strip()
        if newest and d and newest != d:
            bumped_only += 1
        if i % 150 == 0:
            print(f'  {i}/{len(pages)}')

    body = ',\n'.join(f'  {json.dumps(k)}: {json.dumps(v)}' for k, v in sorted(out.items()))
    OUT.write_text(
        '// Generated by scripts/build-sitemap-lastmod.py. Do not edit by hand.\n'
        '//\n'
        '// Last date each indexable page changed in a way a reader would notice.\n'
        '// Commits that only move an asset ?v=N are walked past on purpose: a\n'
        '// cache-bust pass rewrites 2,000 pages without changing a word, and\n'
        '// stamping them all as fresh is what gets lastmod discounted.\n'
        f'export const LASTMOD = {{\n{body},\n}};\n', encoding='utf-8')

    # Always report the counts. A generator that says "done" over zero pages
    # reads exactly like one that worked.
    print(f'{len(out)} indexable pages dated, out of {len(pages)} scanned')
    print(f'{bumped_only} would have been stamped today by a naive "last commit" read')
    print(f'wrote {OUT.relative_to(ROOT)}')

    # The pages show the same dates, so they move with the map.
    subprocess.run([sys.executable, str(ROOT / 'scripts' / 'stamp-page-dates.py')], cwd=ROOT, check=True)


if __name__ == '__main__':
    main()
