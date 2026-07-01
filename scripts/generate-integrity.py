#!/usr/bin/env python3
"""Generate an integrity hash file for EasyAdmin releases.

Parses all file globs from fxmanifest.lua, computes SHA-256 hashes,
and writes a compact JSON file (.ea_integrity.json) that the server
verifies on startup.

Usage:
    python3 scripts/generate-integrity.py          # writes to resource root
    python3 scripts/generate-integrity.py /path/to/resource  # custom root
    python3 scripts/generate-integrity.py --verify  # verify existing hash file

Exit code 0 = success, 1 = verification failure, 2 = usage error.
"""
import hashlib
import json
import re
import sys
from pathlib import Path

# ---------------------------------------------------------------------------
# fxmanifest.lua parser (lightweight — no Lua runtime needed)
# ---------------------------------------------------------------------------

# Matches a single quoted string (single or double quotes).
_QUOTED_RE = re.compile(r"""['"](.*?)['"]""")

def parse_fxmanifest(path: Path) -> list[str]:
    """Extract all file glob patterns from fxmanifest.lua.

    Handles both single-line (shared_script 'file.lua') and
    multi-line block forms (server_scripts { ... }).

    Returns a list of relative glob strings (no quotes).
    """
    text = path.read_text(encoding="utf-8")
    globs: list[str] = []

    # State machine for multi-line blocks
    in_block = False
    block_content = ""

    for line in text.splitlines():
        stripped = line.strip()

        if in_block:
            if "}" in stripped:
                # End of block — collect everything before the closing brace
                block_content += stripped.split("}")[0]
                globs.extend(_QUOTED_RE.findall(block_content))
                in_block = False
                block_content = ""
            else:
                block_content += stripped
            continue

        # Check for block start: key { ...
        block_start = re.match(
            r"""^
                (shared_script|server_script|server_scripts|client_script|client_scripts|ui_page|file|files)
                \s*\{\s*$""",
            stripped,
            re.VERBOSE,
        )
        if block_start:
            in_block = True
            block_content = ""
            continue

        # Single-line block: key { "a", "b" }
        single_block = re.match(
            r"""^
                (shared_script|server_script|server_scripts|client_script|client_scripts|ui_page|file|files)
                \s*\{([^}]*)\}""",
            stripped,
            re.VERBOSE,
        )
        if single_block:
            globs.extend(_QUOTED_RE.findall(single_block.group(2)))
            continue

        # Single-value form: key 'file.lua'
        single = re.match(
            r"""^
                (shared_script|server_script|server_scripts|client_script|client_scripts|ui_page|file|files)
                \s+""",
            stripped,
            re.VERBOSE,
        )
        if single:
            m = _QUOTED_RE.search(stripped)
            if m:
                globs.append(m.group(1))

    return globs


# ---------------------------------------------------------------------------
# Hash computation
# ---------------------------------------------------------------------------

def sha256_file(path: Path) -> str:
    """Compute SHA-256 hex digest of a file."""
    h = hashlib.sha256()
    with open(path, "rb") as f:
        for chunk in iter(lambda: f.read(8192), b""):
            h.update(chunk)
    return h.hexdigest()


def resolve_globs(root: Path, globs: list[str]) -> list[Path]:
    """Resolve all glob patterns to actual files.

    Skips patterns that match no files (e.g. build artifacts that
    haven't been built yet).
    """
    found: list[Path] = []
    for glob in globs:
        matched = sorted(root.glob(glob))
        found.extend(p for p in matched if p.is_file())
    return found


# ---------------------------------------------------------------------------
# Main
# ---------------------------------------------------------------------------

def generate(root: Path) -> Path:
    """Generate the integrity hash file. Returns the output path."""
    manifest = root / "fxmanifest.lua"
    if not manifest.is_file():
        print(f"Error: {manifest} not found", file=sys.stderr)
        sys.exit(2)

    globs = parse_fxmanifest(manifest)
    files = resolve_globs(root, globs)

    if not files:
        print("Error: no files matched any globs", file=sys.stderr)
        sys.exit(2)

    hashes: dict[str, str] = {}
    for f in files:
        rel = str(f.relative_to(root))
        hashes[rel] = sha256_file(f)

    output = root / ".ea_integrity.json"
    # Compact JSON: sorted keys, no extra whitespace
    output.write_text(
        json.dumps({"version": "1", "files": hashes}, sort_keys=True, separators=(",", ":")),
        encoding="utf-8",
    )

    print(f"Generated {output} — {len(hashes)} file(s) hashed")
    return output


def verify(root: Path) -> bool:
    """Verify files against the existing integrity hash file.

    Returns True if all hashes match. Prints details on mismatch.
    """
    integrity_file = root / ".ea_integrity.json"
    if not integrity_file.is_file():
        print(f"Warning: {integrity_file} not found — skipping integrity check")
        return True  # Missing file is a warning, not a failure

    data = json.loads(integrity_file.read_text(encoding="utf-8"))
    expected = data.get("files", {})

    if not expected:
        print("Warning: integrity file is empty — skipping check")
        return True

    mismatches: list[str] = []
    missing: list[str] = []

    for rel, expected_hash in sorted(expected.items()):
        fpath = root / rel
        if not fpath.is_file():
            missing.append(rel)
            continue
        actual = sha256_file(fpath)
        if actual != expected_hash:
            mismatches.append(rel)

    # Also check for extra files not in the hash list
    globs = parse_fxmanifest(root / "fxmanifest.lua")
    current_files = {str(f.relative_to(root)) for f in resolve_globs(root, globs)}
    extra = sorted(current_files - set(expected.keys()))

    ok = True
    if missing:
        ok = False
        print(f"^1Integrity check FAILED: {len(missing)} file(s) missing:^7")
        for f in missing:
            print(f"  ^1-^7 {f}")

    if mismatches:
        ok = False
        print(f"^1Integrity check FAILED: {len(mismatches)} file(s) modified:^7")
        for f in mismatches:
            print(f"  ^1-^7 {f}")

    if extra:
        # Extra files are informational only (plugins may add files)
        print(f"^3Note: {len(extra)} file(s) not in hash list (may be OK):^7")
        for f in extra:
            print(f"  ^3-^7 {f}")

    if ok:
        print(f"^2Integrity check passed — {len(expected)} file(s) verified^7")

    return ok


def main():
    if len(sys.argv) > 2:
        print("Usage: python3 scripts/generate-integrity.py [--verify] [resource-root]", file=sys.stderr)
        sys.exit(2)

    verify_mode = "--verify" in sys.argv
    root_arg = sys.argv[-1] if len(sys.argv) > 1 and sys.argv[-1] != "--verify" else None

    if root_arg:
        root = Path(root_arg)
    else:
        root = Path(__file__).resolve().parent.parent

    if verify_mode:
        ok = verify(root)
        sys.exit(0 if ok else 1)
    else:
        generate(root)


if __name__ == "__main__":
    main()
