#!/usr/bin/env python3
"""Check for broken internal links in the docs.

Simulates MkDocs URL resolution: each .md file at path a/b/c.md becomes
URL a/b/c/ (with a trailing slash). Relative links are resolved against
that URL path, not the filesystem directory.

Also validates every .md path referenced in the MkDocs nav/sidebar against
the actual files on disk.

Usage:
    python3 scripts/check-docs-links.py          # check docs/docs/
    python3 scripts/check-docs-links.py docs/     # check a different root

Exit code 0 = all links valid, 1 = broken links found.
"""
import re
import sys
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
    if len(sys.argv) > 1:
        docs_dir = Path(sys.argv[1])
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

    if broken:
        print(f"Found {len(broken)} broken internal link(s) in {docs_dir}/:\n")
        for rel, url, resolved, base_url in broken:
            print(f"  {rel}  (page URL: {base_url or '(root)'})")
            print(f"    -> {url}  (resolves to: {resolved}/)")
        print()
        sys.exit(1)
    else:
        print(f"All internal links in {docs_dir}/ are valid.")
        sys.exit(0)


if __name__ == "__main__":
    main()
