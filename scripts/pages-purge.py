#!/usr/bin/env python3
"""Delete the Cloudflare Pages deployments created before a cutoff.

Every deployment Cloudflare Pages has ever made stays reachable at its own
<hash>.statedoku.pages.dev address. On 22 October 2026 one from August still
served marketing/outreach-batch-3.md, 71 journalists' addresses, plus bot/,
email-worker/ and constraints.csv; the history rewrite of 8 October and the
.deployignore of 19 August only changed what was deployed afterwards. The
owner approved deleting every deployment made before the rewrite.

Run by .github/workflows/pages-purge.yml with MODE=list (counts only) or
MODE=delete. The current production deployment is never touched. Nothing here
prints a deployment URL or alias: these logs are public.

Env: CF_TOKEN, CF_ACCOUNT, MODE (list|delete), BEFORE (ISO UTC, exclusive).
"""
import collections, json, os, sys, time, urllib.error, urllib.request

API = 'https://api.cloudflare.com/client/v4'
PROJECT = 'statedoku'
TOKEN = os.environ.get('CF_TOKEN', '')
ACCOUNT = os.environ.get('CF_ACCOUNT', '')
MODE = os.environ.get('MODE', 'list')
BEFORE = os.environ.get('BEFORE', '2026-10-08T12:20:00Z')


def call(method, path):
    req = urllib.request.Request(API + path, method=method, headers={'Authorization': 'Bearer ' + TOKEN})
    for attempt in range(4):
        try:
            with urllib.request.urlopen(req, timeout=60) as r:
                return json.load(r)
        except urllib.error.HTTPError as e:
            if e.code == 429 and attempt < 3:
                time.sleep(5 * (attempt + 1))
                continue
            try:
                body = json.load(e)
            except Exception:
                body = {}
            return {'success': False, 'status': e.code, 'codes': [x.get('code') for x in body.get('errors', [])]}
    return {'success': False, 'status': 429, 'codes': []}


def deployments():
    out, page = [], 1
    while True:
        r = call('GET', f'/accounts/{ACCOUNT}/pages/projects/{PROJECT}/deployments?page={page}&per_page=25')
        if not r.get('success'):
            sys.exit(f'listing deployments failed: HTTP {r.get("status")} codes {r.get("codes")}')
        batch = r.get('result') or []
        out += batch
        info = r.get('result_info') or {}
        if not batch or page >= int(info.get('total_pages') or page):
            return out
        page += 1


def main():
    if not TOKEN or not ACCOUNT:
        sys.exit('CF_TOKEN and CF_ACCOUNT are required')
    proj = call('GET', f'/accounts/{ACCOUNT}/pages/projects/{PROJECT}')
    if not proj.get('success'):
        sys.exit(f'reading the project failed: HTTP {proj.get("status")} codes {proj.get("codes")}')
    keep = {(proj['result'].get('canonical_deployment') or {}).get('id'),
            (proj['result'].get('latest_deployment') or {}).get('id')} - {None}
    deps = deployments()
    old = [d for d in deps if d.get('created_on', '') < BEFORE and d.get('id') not in keep]
    by_month = collections.Counter(d['created_on'][:7] for d in old)
    by_env = collections.Counter(d.get('environment') for d in old)
    # Always say how much was looked at.
    print(f'{len(deps)} deployments in the project, {len(keep)} kept as current, '
          f'{len(old)} created before {BEFORE}')
    if old:
        print('  by month: ' + ', '.join(f'{m} {n}' for m, n in sorted(by_month.items())))
        print('  by environment: ' + ', '.join(f'{e} {n}' for e, n in by_env.items()))
    if MODE != 'delete':
        print('list mode: nothing deleted')
        return
    ok, failed = 0, collections.Counter()
    for d in old:
        r = call('DELETE', f'/accounts/{ACCOUNT}/pages/projects/{PROJECT}/deployments/{d["id"]}?force=true')
        if r.get('success'):
            ok += 1
        else:
            failed[(r.get('status'), tuple(r.get('codes') or []))] += 1
        time.sleep(0.25)
    print(f'deleted {ok} of {len(old)}')
    for (status, codes), n in failed.items():
        print(f'  failed {n}: HTTP {status} codes {list(codes)}')
    left = [d for d in deployments() if d.get('created_on', '') < BEFORE and d.get('id') not in keep]
    print(f'{len(left)} deployments older than the cutoff remain')
    if left:
        sys.exit(1)


if __name__ == '__main__':
    main()
