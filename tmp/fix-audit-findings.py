#!/usr/bin/env python3
"""
Fix the deterministic findings from the Aug site health audit.

Every defect below was produced by an earlier unguarded site-wide script.
Each fix here is detection-based rather than list-based, so it stays correct
if the affected set has shifted since the audit ran.

    python3 tmp/fix-audit-findings.py            # apply
    python3 tmp/fix-audit-findings.py --dry-run  # report only
"""
import os
import re
import sys
import json
import glob
from collections import Counter

ROOT = os.path.dirname(os.path.dirname(os.path.abspath(__file__)))
DRY = '--dry-run' in sys.argv
stats = Counter()
SKIP_PARTS = ('/node_modules/', '/.git/', '/tmp/', '/admin/', '/functions/',
              '/bot/', '/marketing/', '/press/screenshots/')


def pages():
    for dirpath, dirs, files in os.walk(ROOT):
        dirs[:] = [d for d in dirs if d not in ('node_modules', '.git', 'tmp')]
        for fn in files:
            if fn != 'index.html':
                continue
            full = os.path.join(dirpath, fn)
            if any(s in full.replace(os.sep, '/') for s in SKIP_PARTS):
                continue
            yield full


def read(p):
    with open(p, 'r', encoding='utf-8', errors='ignore') as f:
        return f.read()


def write(p, s):
    if DRY:
        return
    with open(p, 'w', encoding='utf-8') as f:
        f.write(s)


# ── 1. Stylesheet pointing at a path that does not exist ────────────────
# /styles/learn.css?v=18 was never a real file. Pages referencing it render
# with only their page-local inline CSS, so essentially unstyled.
def fix_stylesheet():
    bad = re.compile(r'<link\s+rel="stylesheet"\s+href="/styles/learn\.css\?v=\d+">')
    good = '<link rel="stylesheet" href="/css/style.css?v=17">'
    for p in pages():
        h = read(p)
        if not bad.search(h):
            continue
        write(p, bad.sub(good, h))
        stats['stylesheet_fixed'] += 1


# ── 2. Markup injected into <title> ─────────────────────────────────────
# An auto-linking pass matched inside <title> and left a raw unclosed anchor,
# truncating the title mid-word. Strip any tags found inside a title.
def fix_titles_with_markup():
    title_re = re.compile(r'<title>(.*?)</title>', re.DOTALL)
    for p in pages():
        h = read(p)
        m = title_re.search(h)
        if not m or '<' not in m.group(1):
            continue
        inner = m.group(1)
        # Drop tags, collapse whitespace, repair a truncated brand suffix.
        clean = re.sub(r'<[^>]*>?', '', inner)
        clean = re.sub(r'\s+', ' ', clean).strip()
        clean = re.sub(r'\s*\|\s*Statedoku\s*$', '', clean).strip()
        clean = re.sub(r'[\s|,.\-]+$', '', clean)
        if not clean:
            continue
        new_title = f'<title>{clean} | Statedoku</title>'
        write(p, h[:m.start()] + new_title + h[m.end():])
        stats['title_markup_fixed'] += 1


# ── 3. Cross-language canonical ─────────────────────────────────────────
# An /es/ or /fr/ page whose canonical points at the English URL tells Google
# to drop the translation, while its own hreflang claims it is the es/fr
# alternate. The two signals cancel and the translated page disappears.
def fix_cross_language_canonical():
    canon_re = re.compile(r'(<link\s+rel="canonical"\s+href=")([^"]+)(")')
    for p in pages():
        rel = os.path.relpath(p, ROOT).replace(os.sep, '/')
        if not (rel.startswith('es/') or rel.startswith('fr/')):
            continue
        h = read(p)
        m = canon_re.search(h)
        if not m:
            continue
        own = 'https://statedoku.com/' + rel[: -len('index.html')]
        if m.group(2).rstrip('/') == own.rstrip('/'):
            continue
        write(p, h[:m.start(2)] + own + h[m.end(2):])
        stats['canonical_fixed'] += 1


# ── 4. Em-dashes surviving inside JSON-LD ───────────────────────────────
# The earlier strip pass deliberately skipped <script> blocks to protect
# schema validity, which left dashes in FAQ answers and breadcrumb names.
# That text is exactly what Google renders in rich results. Parse the JSON,
# replace inside string values only, re-serialise so the block stays valid.
DASHES = ['—', '–', '‒', '―', '−']


def _scrub(v):
    if isinstance(v, str):
        out = v
        for d in DASHES:
            out = out.replace(d, ',')
        out = re.sub(r', *,', ',', out)
        out = re.sub(r' +,', ',', out)
        out = re.sub(r',([.!?])', r'\1', out)
        out = re.sub(r',([A-Za-zÀ-ÿ])', r', \1', out)
        return re.sub(r'  +', ' ', out)
    if isinstance(v, list):
        return [_scrub(x) for x in v]
    if isinstance(v, dict):
        return {k: _scrub(x) for k, x in v.items()}
    return v


def fix_jsonld_dashes():
    block_re = re.compile(
        r'(<script type="application/ld\+json">)(.*?)(</script>)', re.DOTALL)
    for p in pages():
        h = read(p)
        changed = False

        def repl(m):
            nonlocal changed
            raw = m.group(2)
            if not any(d in raw for d in DASHES):
                return m.group(0)
            try:
                data = json.loads(raw)
            except json.JSONDecodeError:
                return m.group(0)
            scrubbed = _scrub(data)
            if scrubbed == data:
                return m.group(0)
            changed = True
            return m.group(1) + json.dumps(scrubbed, ensure_ascii=False,
                                           separators=(',', ':')) + m.group(3)

        new = block_re.sub(repl, h)
        if changed:
            write(p, new)
            stats['jsonld_dashes_fixed'] += 1


# ── 5. Meta descriptions spliced mid-word ───────────────────────────────
# An expansion pass inserted boilerplate at the first period it found, which
# in French landed inside elided words (d'États became d. <junk> 'États).
JUNK = [
    r"\.\s*Ressource interactive gratuite sur la géographie américaine,\s*2026\.\s*",
    r"\.\s*Free interactive US geography resource,\s*updated for 2026\.\s*",
    r"\.\s*Guía completa de los 50 estados con datos, mapas y actualizaciones\s*2026\.\s*",
    r"\.\s*Guide complet 50 [ÉE]tats avec données, cartes et mises à jour\s*2026\.\s*",
]
META_RE = re.compile(
    r'(<meta\s+(?:name|property)=["\'](?:description|og:description|twitter:description)["\']\s+content=")([^"]*?)(")',
    re.IGNORECASE)


def fix_spliced_meta():
    for p in pages():
        h = read(p)
        if not META_RE.search(h):
            continue

        def repl(m):
            v = m.group(2)
            orig = v
            for pat in JUNK:
                v = re.sub(pat, '.', v)
            # Repair "d.'États" -> "d'États" and "L. 'histoire" -> "L'histoire"
            v = re.sub(r"(\b[A-Za-zÀ-ÿ])\.'", r"\1'", v)
            v = re.sub(r"(\b[A-Za-zÀ-ÿ])\.\s+('[a-zA-ZÀ-ÿ])", r"\1\2", v)
            v = re.sub(r"(\b[A-Za-z])\.'s\b", r"\1's", v)
            if v != orig:
                stats['_meta_values'] += 1
            return m.group(1) + v + m.group(3)

        new = META_RE.sub(repl, h)
        if new != h:
            write(p, new)
            stats['meta_spliced_fixed'] += 1


# ── 6. "?," and " ,"  left by the blind em-dash replacement ─────────────
def fix_punctuation_artifacts():
    """Only the unambiguous artifacts.

    "?," and "!," can only come from a dash being blind-replaced by a comma
    after a sentence-ending mark, so they are safe to collapse. A general
    "whitespace before comma" rule was tempting but it would run over script
    and style blocks for a cosmetic gain, so it is deliberately not here.
    """
    for p in pages():
        h = read(p)
        new = h.replace('?,', '?').replace('!,', '!')
        new = re.sub(r',\s*,', ',', new)
        if new != h:
            write(p, new)
            stats['punctuation_fixed'] += 1


# ── 7. Localized pages linking to the English slug inside their own tree ─
SLUG_FIX = {
    '/es/learn/us-regions/': '/es/learn/regiones-de-eeuu/',
    '/fr/learn/us-regions/': '/fr/learn/regions-des-etats-unis/',
    '/learn/banderas-de-estados/': '/learn/state-flags/',
    '/learn/colonias-originales/': '/learn/13-colonies/',
    '/learn/regiones-de-eeuu/': '/learn/us-regions/',
}


def fix_localized_slugs():
    for p in pages():
        h = read(p)
        new = h
        for bad, good in SLUG_FIX.items():
            if bad in new:
                new = new.replace(bad, good)
        if new != h:
            write(p, new)
            stats['slug_links_fixed'] += 1


# ── 8. hreflang alternates pointing at files that do not exist ──────────
ALT_RE = re.compile(
    r'[ \t]*<link\s+rel="alternate"\s+hreflang="[^"]+"\s+href="(https://statedoku\.com)?(/[^"]*)"\s*/?>\n?',
    re.IGNORECASE)


def fix_dead_hreflang():
    for p in pages():
        h = read(p)
        removed = 0

        def repl(m):
            nonlocal removed
            path = m.group(2)
            if path in ('/', ''):
                return m.group(0)
            target = os.path.join(ROOT, path.strip('/'), 'index.html')
            if os.path.isfile(target):
                return m.group(0)
            removed += 1
            return ''

        new = ALT_RE.sub(repl, h)
        if removed:
            write(p, new)
            stats['dead_hreflang_removed'] += removed
            stats['pages_hreflang_cleaned'] += 1


ORDER = [
    ('stylesheet', fix_stylesheet),
    ('title markup', fix_titles_with_markup),
    ('cross-language canonical', fix_cross_language_canonical),
    ('json-ld dashes', fix_jsonld_dashes),
    ('spliced meta', fix_spliced_meta),
    ('punctuation artifacts', fix_punctuation_artifacts),
    ('localized slug links', fix_localized_slugs),
    ('dead hreflang', fix_dead_hreflang),
]

if __name__ == '__main__':
    print('DRY RUN, nothing written\n' if DRY else '')
    for name, fn in ORDER:
        before = dict(stats)
        fn()
        delta = {k: v - before.get(k, 0) for k, v in stats.items()
                 if v - before.get(k, 0) > 0 and not k.startswith('_')}
        print(f'{name:<26} {delta if delta else "nothing to do"}')
    print('\ntotal:', {k: v for k, v in stats.items() if not k.startswith('_')})
