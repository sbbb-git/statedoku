#!/usr/bin/env python3
"""
Inject the AdSense site-tag <script> into <head> of every HTML page.

AdSense told us:
  ads.txt introuvable -> we ship /ads.txt
  Snippet must be on every page in <head> -> we inject below

Idempotent via marker comment `<!-- adsense-head -->`.
"""
import os
import re
import sys

ROOT = os.path.dirname(os.path.dirname(os.path.abspath(__file__)))
PUB = "ca-pub-1481624152917622"

SNIPPET = (
    f'<!-- adsense-head -->\n'
    f'<script async src="https://pagead2.googlesyndication.com/pagead/js/adsbygoogle.js?client={PUB}"\n'
    f'     crossorigin="anonymous"></script>'
)

MARKER = "<!-- adsense-head -->"
ALREADY = "pagead2.googlesyndication.com/pagead/js/adsbygoogle.js?client=" + PUB

# Skip dev/scaffolding paths
SKIP_PATTERNS = (
    "/node_modules/",
    "/.git/",
    "/tmp/",
    "/admin/",
)


def should_skip(path: str) -> bool:
    p = path.replace(os.sep, "/")
    return any(s in p for s in SKIP_PATTERNS)


def inject(html: str) -> tuple[str, str]:
    """Return (new_html, reason). reason in {written, already-snippet, already-marker, no-head}."""
    if MARKER in html:
        return html, "already-marker"
    if ALREADY in html:
        # Snippet present but unmarked (homepages from commit 2217c55) — add the marker silently
        return html, "already-snippet"

    # Try GA4 anchor first — paste right after the GA4 closing </script>
    ga_pattern = re.compile(
        r"(<script[^>]*googletagmanager\.com/gtag/js[^<]*</script>)",
        re.IGNORECASE,
    )
    m = ga_pattern.search(html)
    if m:
        end = m.end()
        new = html[:end] + "\n  " + SNIPPET + html[end:]
        return new, "written"

    # Fallback: paste right after <head> opening tag
    head_pattern = re.compile(r"(<head[^>]*>)", re.IGNORECASE)
    m = head_pattern.search(html)
    if m:
        end = m.end()
        new = html[:end] + "\n  " + SNIPPET + html[end:]
        return new, "written"

    return html, "no-head"


def main():
    written = 0
    already_marker = 0
    already_snippet = 0
    no_head = 0
    skipped = 0
    for dirpath, dirnames, filenames in os.walk(ROOT):
        dirnames[:] = [d for d in dirnames if d not in ("node_modules", ".git", "tmp")]
        for fn in filenames:
            if fn != "index.html":
                continue
            path = os.path.join(dirpath, fn)
            if should_skip(path):
                skipped += 1
                continue
            try:
                with open(path, "r", encoding="utf-8") as f:
                    src = f.read()
            except (OSError, UnicodeDecodeError) as e:
                print(f"  ! skip {path}: {e}", file=sys.stderr)
                continue
            new, reason = inject(src)
            if reason == "already-marker":
                already_marker += 1
            elif reason == "already-snippet":
                already_snippet += 1
            elif reason == "no-head":
                no_head += 1
                print(f"  ! no-head: {os.path.relpath(path, ROOT)}", file=sys.stderr)
            elif reason == "written":
                with open(path, "w", encoding="utf-8") as f:
                    f.write(new)
                written += 1

    print(
        f"\n✅ written={written}  already-marker={already_marker}  "
        f"already-snippet={already_snippet}  no-head={no_head}  skipped={skipped}"
    )


if __name__ == "__main__":
    main()
