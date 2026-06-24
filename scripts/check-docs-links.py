#!/usr/bin/env python3
"""Check for broken internal links in the docs.

Usage:
    python3 scripts/check-docs-links.py          # check docs/docs/
    python3 scripts/check-docs-links.py docs/     # check a different root

Exit code 0 = all links valid, 1 = broken links found.
"""
import re
import sys
from pathlib import Path


def find_docs_dir(base: Path) -> Path:
    """Find the docs root directory (docs/docs/)."""
    candidate = base / "docs" / "docs"
    if candidate.is_dir() and (candidate / "index.md").exists():
        return candidate
    # Fallback: check if base itself is the docs root
    if (base / "index.md").exists():
        return base
    return base


def collect_valid_files(docs_dir: Path) -> set[str]:
    """Collect all valid .md file paths (without .md extension)."""
    valid = set()
    for md_file in docs_dir.rglob("*.md"):
        rel = md_file.relative_to(docs_dir)
        # Without .md extension
        valid.add(str(rel.with_suffix("")))
        # Index pages are also valid
        valid.add(str(rel.with_suffix("")) + "/index")
    return valid


def resolve_link(source_file: Path, link: str, docs_dir: Path) -> str:
    """Resolve a markdown link relative to the source file."""
    # Strip fragment
    link = link.split("#")[0]
    # Strip .md if present
    if link.endswith(".md"):
        link = link[:-3]

    if not link:
        return ""

    source_dir = source_file.parent
    target = (source_dir / link).resolve()

    try:
        return str(target.relative_to(docs_dir.resolve()))
    except ValueError:
        return link


def extract_links(content: str) -> list[tuple[str, str]]:
    """Extract all markdown link targets from content.

    Returns list of (link_text, url) tuples.
    Skips image links ![text](url).
    """
    links = []
    for m in re.finditer(r"(?<!!)\[([^\]]+)\]\(([^)]+)\)", content):
        links.append((m.group(1), m.group(2)))
    return links


def check_links(docs_dir: Path) -> list[tuple[str, str, str]]:
    """Check all internal links in markdown files under docs_dir.

    Returns list of (file, link_target, resolved_path) for broken links.
    """
    valid_files = collect_valid_files(docs_dir)
    broken = []

    for md_file in sorted(docs_dir.rglob("*.md")):
        content = md_file.read_text(encoding="utf-8", errors="replace")
        rel = str(md_file.relative_to(docs_dir))

        for _text, url in extract_links(content):
            # Skip external links
            if url.startswith(("http://", "https://", "#", "mailto:", "/")):
                continue

            resolved = resolve_link(md_file, url, docs_dir)

            if resolved not in valid_files:
                broken.append((rel, url, resolved))

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

    if broken:
        print(f"Found {len(broken)} broken internal link(s) in {docs_dir}/:\n")
        for rel, url, resolved in broken:
            print(f"  {rel}")
            print(f"    -> {url}  (resolved: {resolved})")
        print()
        sys.exit(1)
    else:
        print(f"All internal links in {docs_dir}/ are valid.")
        sys.exit(0)


if __name__ == "__main__":
    main()
