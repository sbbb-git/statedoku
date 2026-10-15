#!/usr/bin/env python3
"""Tell IndexNow which indexable pages a deploy changed.

ChatGPT search and Copilot answer from Bing's index. Bing heard about each URL
once, the first time submit-bing-urls.mjs sent it, and never about a correction
after that: on 5 October 2026 more than 600 fixes went live and nothing told
Bing to come back. IndexNow is the protocol Bing (and Yandex, Seznam, Naver)
reads for exactly that, with no quota worth the name.

Only real changes are sent. A cache-bust pass rewrites 2,000 pages without
changing a word, and announcing them all teaches Bing to ignore the pings, so
each changed index.html is compared through build-sitemap-lastmod.py's
reader_text, the same test that dates the sitemap. A page that left the index
in this push (noindexed or deleted) is sent too, so Bing drops it sooner.

The key is public by design: IndexNow verifies ownership by fetching
https://statedoku.com/<key>.txt, whose content is the key.

Usage: python3 scripts/indexnow.py BEFORE_SHA AFTER_SHA [--dry]
Warns and exits 0 on any failure: a missed ping is not worth a red deploy.
"""
import importlib.util, json, pathlib, re, subprocess, sys, urllib.request

ROOT = pathlib.Path(__file__).resolve().parent.parent
HOST = 'statedoku.com'
ENDPOINT = 'https://api.indexnow.org/indexnow'

spec = importlib.util.spec_from_file_location('lastmod', ROOT / 'scripts' / 'build-sitemap-lastmod.py')
lastmod = importlib.util.module_from_spec(spec)
spec.loader.exec_module(lastmod)


def git(*args):
    r = subprocess.run(['git', *args], cwd=ROOT, capture_output=True, text=True)
    return r.stdout if r.returncode == 0 else None


def indexable_at(sha):
    src = git('show', f'{sha}:functions/_sitemap-lastmod.js')
    return set(re.findall(r'"(/[^"]*)": "\d{4}-\d{2}-\d{2}"', src or ''))


def url_of(rel):
    d = rel[:-len('index.html')].rstrip('/')
    return '/' if not d else f'/{d}/'


def key():
    keys = [p for p in ROOT.glob('*.txt')
            if re.fullmatch(r'[0-9a-f]{32}\.txt', p.name) and p.read_text().strip() == p.stem]
    if len(keys) != 1:
        raise RuntimeError(f'expected one IndexNow key file at the root, found {len(keys)}')
    return keys[0].stem


def main():
    args = [a for a in sys.argv[1:] if not a.startswith('--')]
    dry = '--dry' in sys.argv
    if len(args) != 2 or not args[0].strip('0') or git('cat-file', '-e', args[0]) is None:
        print('[indexnow] no usable previous commit (first push, manual run or shallow clone), nothing sent')
        return
    before, after = args
    now, then = indexable_at(after), indexable_at(before)
    if not now:
        raise RuntimeError('the lastmod map at the new commit lists no page')
    changed = (git('diff', '--name-only', before, after, '--', '*index.html') or '').split()
    urls, checked = set(), 0
    for rel in changed:
        url = url_of(rel)
        if url in now:
            checked += 1
            old, new = git('show', f'{before}:{rel}'), git('show', f'{after}:{rel}')
            if old is None or lastmod.reader_text(old) != lastmod.reader_text(new or ''):
                urls.add(url)
        elif url in then:
            urls.add(url)          # left the index in this push
    urls = sorted(f'https://{HOST}{u}' for u in urls)
    # Always say how much was looked at, including when nothing is sent.
    print(f'[indexnow] {len(changed)} pages changed, {checked} of them indexable, '
          f'{len(urls)} with a change a reader sees or leaving the index')
    if not urls:
        return
    k = key()
    body = {'host': HOST, 'key': k, 'keyLocation': f'https://{HOST}/{k}.txt', 'urlList': urls[:10000]}
    if dry:
        print('[indexnow] dry run, first few:', ', '.join(urls[:5]))
        return
    req = urllib.request.Request(ENDPOINT, data=json.dumps(body).encode(), method='POST',
                                 headers={'content-type': 'application/json; charset=utf-8'})
    with urllib.request.urlopen(req, timeout=30) as r:
        print(f'[indexnow] sent {len(body["urlList"])}, HTTP {r.status}')


if __name__ == '__main__':
    try:
        main()
    except Exception as e:  # noqa: BLE001
        print(f'::warning::IndexNow not notified: {type(e).__name__}: {e}')
