#!/usr/bin/env python3
"""
Deterministic SEO fixes across the whole site. Runs in one pass:

  1. Trim <title> when > 65 chars (drop repeated brand suffix, trim after
     last natural break, keep "| Statedoku" if we can fit it).
  2. Trim <meta description> when > 165 chars (cut at last sentence
     boundary before 160 chars, add ellipsis).
  3. Expand <meta description> when < 100 chars (append a topical suffix
     using page category + year).
  4. Inject <script type="application/ld+json"> BreadcrumbList before
     </head> when the page has no JSON-LD at all. Breadcrumb chain is
     derived from the URL structure. Multilingual paths respect their
     lang for label localization.

Idempotent — safe to re-run. Logs a per-fix count summary.
"""
import os
import re
import json
import sys
from collections import Counter
from html.parser import HTMLParser

ROOT = os.path.dirname(os.path.dirname(os.path.abspath(__file__)))
BASE = 'https://statedoku.com'
SKIP = ('/node_modules/', '/.git/', '/tmp/', '/admin/', '/functions/', '/bot/', '/marketing/', '/press/screenshots/')

# ─── Localized crumb labels ──────────────────────────────────────────────
LABELS = {
    'en': {'Home': 'Home', 'Learn': 'Learn', 'Play': 'Play & Learn', 'States': 'States',
            'Cities': 'Cities', 'Regions': 'Regions', 'Widgets': 'Widgets'},
    'fr': {'Home': 'Accueil', 'Learn': 'Apprendre', 'Play': 'Jouer', 'States': 'États',
            'Cities': 'Villes', 'Regions': 'Régions', 'Widgets': 'Widgets'},
    'es': {'Home': 'Inicio', 'Learn': 'Aprender', 'Play': 'Jugar', 'States': 'Estados',
            'Cities': 'Ciudades', 'Regions': 'Regiones', 'Widgets': 'Widgets'},
}

# ─── Utilities ──────────────────────────────────────────────────────────
def rel(p):
    return os.path.relpath(p, ROOT)


def should_skip(path):
    p = path.replace(os.sep, '/')
    return any(s in p for s in SKIP)


def slug_to_title(s):
    """`state-abbreviations` → `State Abbreviations`."""
    return ' '.join(w.capitalize() for w in s.replace('-', ' ').split())


def path_url(rel_path):
    # rel_path is a repo path ending in index.html. Convert to URL path.
    p = '/' + rel_path.replace('index.html', '').replace(os.sep, '/')
    return p


def derive_lang(rel_path):
    parts = rel_path.split(os.sep)
    if parts and parts[0] in ('fr', 'es'):
        return parts[0]
    return 'en'


def derive_breadcrumb(rel_path):
    """Return list of (name, url) crumb items for a page's URL structure."""
    lang = derive_lang(rel_path)
    L = LABELS[lang]
    parts = rel_path.replace(os.sep, '/').split('/')
    if parts[-1] == 'index.html':
        parts = parts[:-1]
    # strip lang prefix
    if parts and parts[0] in ('fr', 'es'):
        home_url = f'{BASE}/{parts[0]}/'
        parts = parts[1:]
    else:
        home_url = f'{BASE}/'
    chain = [(L['Home'], home_url)]
    if not parts:
        return chain
    section = parts[0]
    if section == 'learn':
        chain.append((L['Learn'], home_url + 'learn/'))
        if len(parts) > 1:
            chain.append((slug_to_title(parts[1]), home_url + f'learn/{parts[1]}/'))
    elif section == 'play':
        chain.append((L['Play'], home_url + 'play/'))
        if len(parts) > 1:
            chain.append((slug_to_title(parts[1]), home_url + f'play/{parts[1]}/'))
            if len(parts) > 2 and parts[2] in ('guide', 'printable'):
                chain.append((slug_to_title(parts[2]), home_url + f'play/{parts[1]}/{parts[2]}/'))
    elif section == 'states':
        chain.append((L['States'], home_url + 'states/'))
        if len(parts) > 1:
            chain.append((slug_to_title(parts[1]), home_url + f'states/{parts[1]}/'))
            if len(parts) > 2:
                chain.append((slug_to_title(parts[2]), home_url + f'states/{parts[1]}/{parts[2]}/'))
    elif section == 'cities':
        chain.append((L['Cities'], home_url + 'cities/'))
        if len(parts) > 1:
            chain.append((slug_to_title(parts[1]), home_url + f'cities/{parts[1]}/'))
    elif section == 'regions':
        chain.append((L['Regions'], home_url + 'regions/'))
        if len(parts) > 1:
            chain.append((slug_to_title(parts[1]), home_url + f'regions/{parts[1]}/'))
    elif section == 'widgets':
        chain.append((L['Widgets'], home_url + 'widgets/'))
    else:
        chain.append((slug_to_title(section), home_url + f'{section}/'))
    return chain


def build_breadcrumb_jsonld(rel_path):
    chain = derive_breadcrumb(rel_path)
    items = []
    for i, (name, url) in enumerate(chain, start=1):
        items.append({'@type': 'ListItem', 'position': i, 'name': name, 'item': url})
    payload = {'@context': 'https://schema.org', '@type': 'BreadcrumbList', 'itemListElement': items}
    # compact one-liner
    return '<script type="application/ld+json">' + json.dumps(payload, ensure_ascii=False, separators=(',', ':')) + '</script>'


# ─── Title trim ─────────────────────────────────────────────────────────
def trim_title(title):
    """Shorten a title to <= 65 chars, preserving the brand suffix if possible."""
    max_len = 65
    if len(title) <= max_len:
        return title
    # Split off known brand suffixes (case-insensitive)
    brand_suffixes = [' | Statedoku', ' — Statedoku', ' - Statedoku']
    brand = ''
    core = title
    for suf in brand_suffixes:
        if title.endswith(suf):
            brand = suf
            core = title[: -len(suf)]
            break
    room = max_len - len(brand)
    if len(core) <= room:
        return core + brand
    # Cut at last natural break before `room`.
    cut = core[:room]
    for sep in [' — ', ' – ', ' - ', ': ', ' | ', ', ']:
        pos = cut.rfind(sep)
        if pos > room * 0.5:
            cut = core[:pos]
            break
    # If still too long, hard cut
    if len(cut) > room:
        cut = cut[: room - 1].rstrip() + '…'
    return cut.rstrip(' —–-:|,') + brand


# ─── Description trim / expand ──────────────────────────────────────────
def trim_description(desc):
    if len(desc) <= 165:
        return desc
    cut = desc[:160]
    # last sentence boundary
    for sep in ['. ', '! ', '? ']:
        pos = cut.rfind(sep)
        if pos > 80:
            return cut[: pos + 1].strip()
    # else last comma
    pos = cut.rfind(',')
    if pos > 80:
        return cut[:pos].rstrip() + '.'
    return cut.rstrip() + '…'


def expand_description(desc, rel_path):
    """Grow a too-short description with a targeted, non-spammy suffix."""
    if len(desc) >= 100:
        return desc
    lang = derive_lang(rel_path)
    section = rel_path.replace(os.sep, '/').split('/')[1 if lang != 'en' else 0]
    year = '2026'
    suffix = {
        'en': {
            'learn':   f' Full 50-state breakdown with data, maps, and updates for {year}.',
            'play':    f' Free browser game, no signup, playable in under a minute. Updated for {year}.',
            'states':  f' Overview of the state with capital, region, symbols, and quick facts for {year}.',
            'default': f' Free interactive US geography resource, updated for {year}.',
        },
        'fr': {
            'learn':   f' Guide complet 50 États avec données, cartes et mises à jour {year}.',
            'play':    f' Jeu gratuit dans le navigateur, sans inscription, jouable en une minute. Mis à jour {year}.',
            'states':  f' Aperçu de l\'État avec capitale, région, symboles et faits rapides {year}.',
            'default': f' Ressource interactive gratuite sur la géographie américaine, {year}.',
        },
        'es': {
            'learn':   f' Guía completa de los 50 estados con datos, mapas y actualizaciones {year}.',
            'play':    f' Juego gratuito en el navegador, sin registro, jugable en un minuto. Actualizado {year}.',
            'states':  f' Vista general del estado con capital, región, símbolos y datos rápidos {year}.',
            'default': f' Recurso interactivo gratuito sobre geografía estadounidense, {year}.',
        },
    }
    key = section if section in ('learn', 'play', 'states') else 'default'
    add = suffix[lang][key]
    result = desc.rstrip('. ') + '.' + add
    # If overshoots 165, trim.
    if len(result) > 165:
        result = trim_description(result)
    return result


# ─── HTML mutation helpers ──────────────────────────────────────────────
TITLE_RE = re.compile(r'(<title[^>]*>)(.*?)(</title>)', re.DOTALL | re.IGNORECASE)
DESC_RE = re.compile(r'(<meta\s+name=["\']description["\']\s+content=["\'])([^"\']*?)(["\'])', re.IGNORECASE)


def has_any_jsonld(html):
    return re.search(r'<script[^>]+type=["\']application/ld\+json["\']', html, re.IGNORECASE) is not None


def inject_jsonld_before_head_close(html, jsonld):
    m = re.search(r'</head>', html, re.IGNORECASE)
    if not m:
        return html, False
    idx = m.start()
    return html[:idx] + '  ' + jsonld + '\n' + html[idx:], True


# ─── Main pass ──────────────────────────────────────────────────────────
def process(path, counts):
    with open(path, 'r', encoding='utf-8', errors='ignore') as f:
        html = f.read()
    original = html

    # 1. Title
    m = TITLE_RE.search(html)
    if m:
        old = m.group(2).strip()
        new = trim_title(old) if len(old) > 65 else old
        if new != old:
            html = html[:m.start(2)] + new + html[m.end(2):]
            counts['title_trimmed'] += 1

    # 2 & 3. Description
    m = DESC_RE.search(html)
    if m:
        old = m.group(2)
        new = old
        if len(new) < 100:
            new = expand_description(new, rel(path))
            if new != old:
                counts['desc_expanded'] += 1
        elif len(new) > 165:
            new = trim_description(new)
            counts['desc_trimmed'] += 1
        if new != old:
            html = html[:m.start(2)] + new + html[m.end(2):]

    # 4. JSON-LD BreadcrumbList
    if not has_any_jsonld(html):
        jsonld = build_breadcrumb_jsonld(rel(path))
        html, ok = inject_jsonld_before_head_close(html, jsonld)
        if ok:
            counts['jsonld_added'] += 1

    if html != original:
        with open(path, 'w', encoding='utf-8') as f:
            f.write(html)
        counts['files_touched'] += 1


def main():
    counts = Counter()
    scanned = 0
    for dirpath, dirs, files in os.walk(ROOT):
        dirs[:] = [d for d in dirs if d not in ('node_modules', '.git', 'tmp')]
        for fn in files:
            if fn != 'index.html':
                continue
            full = os.path.join(dirpath, fn)
            if should_skip(full):
                continue
            scanned += 1
            try:
                process(full, counts)
            except Exception as e:
                print(f'  !! {rel(full)}: {e}', file=sys.stderr)
                counts['errors'] += 1
    print(f'\n✅ scanned={scanned}')
    for k, v in counts.most_common():
        print(f'   {k}={v}')


if __name__ == '__main__':
    main()
