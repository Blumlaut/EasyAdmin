#!/usr/bin/env python3
"""Check for broken internal links in the docs.

Simulates MkDocs URL resolution: each .md file at path a/b/c.md becomes
URL a/b/c/ (with a trailing slash). Relative links are resolved against
that URL path, not the filesystem directory.

Also validates every .md path referenced in the MkDocs nav/sidebar against
the actual files on disk.

Usage:
    python3 scripts/check-docs-links.py           # check docs/docs/
    python3 scripts/check-docs-links.py docs/     # check a different root
    python3 scripts/check-docs-links.py --external  # also check http(s) links

External links are not checked by default: that needs network access, is slow
and can fail for reasons unrelated to the docs. CI runs them on a schedule via
.github/workflows/check-docs-external-links.yml.

Exit code 0 = all links valid, 1 = broken links found.
"""
import argparse
import re
import sys
import urllib.error
import urllib.request
from concurrent.futures import ThreadPoolExecutor
from pathlib import Path

try:
    import yaml
    HAS_YAML = True
except ImportError:
    HAS_YAML = False


def find_docs_dir(base: Path) -> Path:
    """Find the docs root directory (docs/docs/)."""
    candidate = base / "docs" / "docs"
    if candidate.is_dir() and (candidate / "index.md").exists():
        return candidate
    if (base / "index.md").exists():
        return base
    return base


def file_to_url(rel_path: str) -> str:
    """Convert a file path (relative to docs root) to an MkDocs URL.

    MkDocs treats each .md file as a page with a trailing-slash URL:
        plugins/plugin-api.md  ->  plugins/plugin-api/
        index.md               ->  (root)
    """
    # Strip .md
    url = rel_path.replace(".md", "")
    # index.md at root becomes ""
    if url == "index":
        return ""
    # sub/index.md becomes sub/ (MkDocs convention)
    if url.endswith("/index"):
        return url[:-6]
    return url


def resolve_url_link(base_url: str, link: str) -> str:
    """Resolve a relative link against a base URL path.

    MkDocs serves each page at a trailing-slash URL, so relative links
    are resolved from that directory using standard URL resolution.
    """
    from urllib.parse import urljoin

    # MkDocs serves pages at trailing-slash URLs
    if base_url:
        base = f"https://example.com/{base_url}/"
    else:
        base = "https://example.com/"

    resolved = urljoin(base, link)
    return resolved.replace("https://example.com/", "")


def check_links(docs_dir: Path) -> list[tuple[str, str, str, str]]:
    """Check all internal links using MkDocs URL resolution.

    Returns list of (file, link_target, expected_url, actual_url) for broken links.
    """
    # Build a set of valid URL paths
    valid_urls = set()
    for md_file in docs_dir.rglob("*.md"):
        rel = str(md_file.relative_to(docs_dir))
        url = file_to_url(rel)
        valid_urls.add(url)

    broken = []
    for md_file in sorted(docs_dir.rglob("*.md")):
        content = md_file.read_text(encoding="utf-8", errors="replace")
        rel = str(md_file.relative_to(docs_dir))
        base_url = file_to_url(rel)

        for m in re.finditer(r"(?<!!)\[([^\]]+)\]\(([^)]+)\)", content):
            url = m.group(2)

            # Skip external links
            if url.startswith(("http://", "https://", "#", "mailto:", "/")):
                continue

            # Strip fragment
            link = url.split("#")[0]
            if not link:
                continue

            # Strip .md if present (some authors add it explicitly)
            if link.endswith(".md"):
                link = link[:-3]

            resolved = resolve_url_link(base_url, link)

            if resolved not in valid_urls:
                broken.append((rel, url, resolved, base_url))

    return broken


# Hosts and URL shapes used as placeholders in the docs. They are not real
# destinations, so checking them would only produce noise.
PLACEHOLDER_HOSTS = {
    "example.com",
    "www.example.com",
    "img.example.com",
    "myserver.com",
}

# Hosts that block automated requests (bot walls, logins) so a status code from
# them says nothing about whether the link works for a human.
UNCHECKABLE_HOSTS = {
    "dash.cloudflare.com",
    "discord.com",
    "discord.gg",
}

# Statuses that mean "a human can probably still use this" rather than "gone".
UNVERIFIABLE_STATUSES = {401, 403, 405, 429, 503}

ANCHOR_RE = re.compile(r"\[([^\]]+)\]\(([^)]+)\)")


def is_checkable_external(url: str) -> bool:
    """Whether an external URL is worth sending a request to."""
    if "{" in url or "}" in url:
        return False
    # Placeholder values like YOUR_BOT_ID or YOUR_WORKER_NAME
    if re.search(r"YOUR_[A-Z_]+", url):
        return False

    from urllib.parse import urlsplit

    host = urlsplit(url).hostname or ""
    if host in PLACEHOLDER_HOSTS or host in UNCHECKABLE_HOSTS:
        return False
    return True


def fetch_external(url: str, timeout: float, retries: int) -> tuple[int | None, str]:
    """Request a URL, returning (status, note).

    A status of None means the request never got an answer (DNS, TLS, timeout).
    """
    last_error = ""
    for _ in range(retries + 1):
        try:
            request = urllib.request.Request(
                url,
                headers={
                    "User-Agent": "EasyAdminDocsLinkCheck/1.0 (+https://github.com/Blumlaut/EasyAdmin)",
                    "Accept": "text/html,application/xhtml+xml",
                },
            )
            with urllib.request.urlopen(request, timeout=timeout) as response:
                return response.status, ""
        except urllib.error.HTTPError as e:
            return e.code, ""
        except Exception as e:  # noqa: BLE001 - network errors are all just "unreachable"
            last_error = f"{type(e).__name__}: {e}"
    return None, last_error


def check_external_links(
    docs_dir: Path, timeout: float = 15.0, retries: int = 2, workers: int = 8
) -> tuple[list[tuple[str, str, str]], list[tuple[str, str, str]]]:
    """Check every external link in the docs.

    Returns (broken, skipped) lists of (file, url, reason).
    """
    targets: dict[str, list[str]] = {}
    skipped = []
    for md_file in sorted(docs_dir.rglob("*.md")):
        content = md_file.read_text(encoding="utf-8", errors="replace")
        rel = str(md_file.relative_to(docs_dir))
        for m in ANCHOR_RE.finditer(content):
            url = m.group(2)
            if not url.startswith(("http://", "https://")):
                continue
            # Markdown image sources are checked the same way; docs often link assets.
            if is_checkable_external(url):
                targets.setdefault(url, []).append(rel)
            else:
                skipped.append((rel, url, "placeholder or bot-walled host"))

    broken = []
    if not targets:
        return broken, skipped

    def work(url: str) -> tuple[str, int | None, str]:
        status, note = fetch_external(url, timeout, retries)
        return url, status, note

    with ThreadPoolExecutor(max_workers=workers) as pool:
        results = list(pool.map(work, targets))

    for url, status, note in results:
        files = targets[url]
        if status is None:
            broken.append((files[0], url, f"unreachable ({note})"))
        elif status in UNVERIFIABLE_STATUSES:
            skipped.append((files[0], url, f"HTTP {status} - blocked for bots"))
        elif status >= 400:
            broken.append((files[0], url, f"HTTP {status}"))

    return broken, skipped


def extract_nav_paths(nav) -> list[str]:
    """Recursively extract all .md paths from a MkDocs nav structure."""
    paths = []
    if not isinstance(nav, list):
        return paths
    for item in nav:
        if isinstance(item, str):
            # Bare path like "discord/bot-setup.md"
            if item.endswith(".md"):
                paths.append(item)
        elif isinstance(item, dict):
            for value in item.values():
                if isinstance(value, str) and value.endswith(".md"):
                    paths.append(value)
                else:
                    paths.extend(extract_nav_paths(value))
    return paths


def check_nav_links(mkdocs_config: Path, docs_dir: Path) -> list[tuple[str, str]]:
    """Check all .md paths in the MkDocs nav/sidebar against disk.

    Returns list of (path, reason) for missing or invalid entries.
    """
    if not HAS_YAML:
        return []

    try:
        config = yaml.safe_load(mkdocs_config.read_text(encoding="utf-8"))
    except Exception as e:
        return [(mkdocs_config.name, f"Failed to parse YAML: {e}")]

    if not isinstance(config, dict):
        return []

    nav = config.get("nav")
    if not nav:
        return []

    # Determine the actual docs root (mkdocs.yml docs_dir may differ from filesystem root)
    docs_root = docs_dir
    docs_dir_config = config.get("docs_dir")
    if docs_dir_config:
        docs_root = mkdocs_config.parent / docs_dir_config

    # Build set of existing files (relative to docs root)
    existing = set()
    for md_file in docs_root.rglob("*.md"):
        existing.add(str(md_file.relative_to(docs_root)))

    nav_paths = extract_nav_paths(nav)
    broken = []
    for path in nav_paths:
        if path not in existing:
            broken.append((path, f"File not found at {docs_root}/{path}"))

    return broken


def main():
    parser = argparse.ArgumentParser(description="Check the EasyAdmin docs for broken links.")
    parser.add_argument(
        "docs_dir",
        nargs="?",
        help="docs root to check (default: docs/docs/)",
    )
    parser.add_argument(
        "--external",
        action="store_true",
        help="also request every external http(s) link (slow, needs network)",
    )
    parser.add_argument("--timeout", type=float, default=15.0, help="per-request timeout in seconds")
    parser.add_argument("--retries", type=int, default=2, help="retries per external link")
    args = parser.parse_args()

    if args.docs_dir:
        docs_dir = Path(args.docs_dir)
    else:
        docs_dir = find_docs_dir(Path(__file__).resolve().parent.parent)

    if not docs_dir.is_dir():
        print(f"Error: {docs_dir} is not a directory", file=sys.stderr)
        sys.exit(2)

    broken = check_links(docs_dir)

    # Also check nav/sidebar links from mkdocs.yml
    mkdocs_config = docs_dir.parent / "mkdocs.yml"
    if mkdocs_config.exists():
        nav_broken = check_nav_links(mkdocs_config, docs_dir)
        if nav_broken:
            print(f"Found {len(nav_broken)} broken nav/sidebar link(s) in {mkdocs_config}:\n")
            for path, reason in nav_broken:
                print(f"  nav: {path}")
                print(f"    -> {reason}")
            print()
            broken.extend([("mkdocs.yml", path, path, "") for path, _ in nav_broken])
    elif HAS_YAML:
        print(f"Warning: {mkdocs_config} not found — skipping nav/link check.", file=sys.stderr)

    external_broken: list[tuple[str, str, str]] = []
    if args.external:
        external_broken, external_skipped = check_external_links(
            docs_dir, timeout=args.timeout, retries=args.retries
        )
        if external_skipped:
            print(f"Skipped {len(external_skipped)} external link(s) that cannot be verified:\n")
            for rel, url, reason in external_skipped:
                print(f"  {rel}: {url}  ({reason})")
            print()
        if external_broken:
            print(f"Found {len(external_broken)} broken external link(s) in {docs_dir}/:\n")
            for rel, url, reason in external_broken:
                print(f"  {rel}")
                print(f"    -> {url}  ({reason})")
            print()

    if broken:
        print(f"Found {len(broken)} broken internal link(s) in {docs_dir}/:\n")
        for rel, url, resolved, base_url in broken:
            print(f"  {rel}  (page URL: {base_url or '(root)'})")
            print(f"    -> {url}  (resolves to: {resolved}/)")
        print()

    if broken or external_broken:
        sys.exit(1)

    if args.external:
        print(f"All internal and external links in {docs_dir}/ are valid.")
    else:
        print(f"All internal links in {docs_dir}/ are valid.")
    sys.exit(0)


if __name__ == "__main__":
    main()
