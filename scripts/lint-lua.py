#!/usr/bin/env python3
"""FiveM Lua linter for EasyAdmin-style resources.

Checks for dead code, missing files, orphaned events, and other common issues
in FiveM Lua resources.

Usage:
    python3 scripts/lint-lua.py /path/to/resource
    python3 scripts/lint-lua.py /path/to/resource --config /path/to/lint-lua.toml

Config file (lint-lua.toml, auto-detected from resource root or parents):
    [paths]
    exclude = ["tests/**", "examples/**"]

    [allowlist]
    functions = ["MyPluginApiFunc"]

Exit code 0 = clean, 1 = issues found, 2 = usage error.
"""
import argparse
import re
import sys
import tomllib
from pathlib import Path

# ---------------------------------------------------------------------------
# Colour helpers (disabled when stdout is not a tty)
# ---------------------------------------------------------------------------

_use_colour = sys.stdout.isatty()

def _c(code: str, text: str) -> str:
    if _use_colour:
        return f"\033[{code}m{text}\033[0m"
    return text

def red(t: str) -> str:   return _c("1;31", t)
def yellow(t: str) -> str: return _c("1;33", t)
def green(t: str) -> str: return _c("1;32", t)
def cyan(t: str) -> str:  return _c("1;36", t)
def dim(t: str) -> str:   return _c("2", t)


# ---------------------------------------------------------------------------
# Config file (lint-lua.toml)
# ---------------------------------------------------------------------------

_DEFAULT_CONFIG_NAME = "lint-lua.toml"


def _load_config(root: Path) -> dict:
    """Load lint-lua.toml from the resource root or any parent directory.

    Returns a dict with keys: exclude (list[str]), allowlist (dict), checks (dict).
    """
    # Check resource root first, then walk up parent directories
    config_path = root / _DEFAULT_CONFIG_NAME
    if config_path.is_file():
        try:
            with open(config_path, "rb") as f:
                return tomllib.load(f)
        except Exception as e:
            print(f"  {yellow('WARN')} failed to parse {config_path}: {e}", file=sys.stderr)

    for parent in root.parents:
        config_path = parent / _DEFAULT_CONFIG_NAME
        if config_path.is_file():
            try:
                with open(config_path, "rb") as f:
                    return tomllib.load(f)
            except Exception as e:
                print(f"  {yellow('WARN')} failed to parse {config_path}: {e}", file=sys.stderr)
            break
    return {}


def _should_exclude(rel_path: str, exclude_patterns: list[str]) -> bool:
    """Check if a relative path matches any exclusion glob pattern."""
    import fnmatch
    for pattern in exclude_patterns:
        if fnmatch.fnmatch(rel_path, pattern):
            return True
    return False


# ---------------------------------------------------------------------------
# fxmanifest.lua parser
# ---------------------------------------------------------------------------

# Matches a single quoted string (single or double quotes)
_QUOTED_RE = re.compile(r"""['"](.*?)['"]""")

# Known script keys and their context
_CONTEXT_KEYS = {
    "shared_script": "shared",
    "shared_scripts": "shared",
    "client_script": "client",
    "client_scripts": "client",
    "server_script": "server",
    "server_scripts": "server",
}


def parse_fxmanifest(path: Path) -> tuple[list[tuple[str, str]], list[str]]:
    """Parse fxmanifest.lua and return (file_entries, ui_pages).

    file_entries: list of (glob_pattern, context) where context is
                  'client', 'server', or 'shared'
    ui_pages: list of ui_page paths
    """
    text = path.read_text(encoding="utf-8")
    entries: list[tuple[str, str]] = []
    ui_pages: list[str] = []

    in_block = False
    block_key = ""
    block_content = ""

    for line_no, line in enumerate(text.splitlines(), 1):
        stripped = line.strip()

        if in_block:
            if "}" in stripped:
                block_content += stripped.split("}")[0]
                patterns = _QUOTED_RE.findall(block_content)
                ctx = _CONTEXT_KEYS.get(block_key, "server")
                for p in patterns:
                    entries.append((p, ctx))
                in_block = False
                block_content = ""
            else:
                block_content += stripped
            continue

        # Multi-line block start
        block_start = re.match(
            r"""^(shared_script|shared_scripts|client_script|client_scripts|
                   server_script|server_scripts)\s*\{\s*$""",
            stripped, re.VERBOSE,
        )
        if block_start:
            in_block = True
            block_key = block_start.group(1)
            block_content = ""
            continue

        # Single-line block: key { "a", "b" }
        single_block = re.match(
            r"""^(shared_script|shared_scripts|client_script|client_scripts|
                   server_script|server_scripts)\s*\{([^}]*)\}""",
            stripped, re.VERBOSE,
        )
        if single_block:
            ctx = _CONTEXT_KEYS.get(single_block.group(1), "server")
            for p in _QUOTED_RE.findall(single_block.group(2)):
                entries.append((p, ctx))
            continue

        # Single-value form: key 'file.lua'
        single = re.match(
            r"""^(shared_script|client_script|server_script)\s+""",
            stripped,
        )
        if single:
            ctx = _CONTEXT_KEYS.get(single.group(1), "server")
            m = _QUOTED_RE.search(stripped)
            if m:
                entries.append((m.group(1), ctx))
            continue

        # ui_page
        ui_page = re.match(r"""^ui_page\s+['"](.*?)['"]""", stripped)
        if ui_page:
            ui_pages.append(ui_page.group(1))
            continue

    return entries, ui_pages


# ---------------------------------------------------------------------------
# Lua source parser (regex-based, good enough for EasyAdmin-style code)
# ---------------------------------------------------------------------------

# Strip single-line comments (but not strings containing --)
_COMMENT_RE = re.compile(r"--.*")
# Strip multi-line comments
_MLCOMMENT_RE = re.compile(r"--\[\[.*?\]\]", re.DOTALL)
# Strip string literals (replace with empty to avoid false matches)
_STRING_RE = re.compile(r'"[^"\\]*(?:\\.[^"\\]*)*"|\'[^\'\\]*(?:\\.[^\'\\]*)*\'')

# Function definitions
_LOCAL_FUNC_RE = re.compile(
    r"^local\s+function\s+([A-Za-z_][A-Za-z0-9_]*)\s*\(",
    re.MULTILINE,
)
# Table-qualified global functions: function Table.Method(
_TABLED_FUNC_RE = re.compile(
    r"^function\s+([A-Za-z_][A-Za-z0-9_]*)\.([A-Za-z_][A-Za-z0-9_]*)\s*\(",
    re.MULTILINE,
)
# Plain global functions: function Name(
_GLOBAL_FUNC_RE = re.compile(
    r"^function\s+([A-Za-z_][A-Za-z0-9_]*)\s*\(",
    re.MULTILINE,
)

# Local variable declarations (simple form: local name = ...)
_LOCAL_VAR_RE = re.compile(
    r"^local\s+([A-Za-z_][A-Za-z0-9_]*(?:\s*,\s*[A-Za-z_][A-Za-z0-9_]*)*)",
    re.MULTILINE,
)

# Global variable assignments (simple form: Name = ..., not inside a function)
# We detect these at module level only
_GLOBAL_VAR_RE = re.compile(
    r"^([A-Za-z_][A-Za-z0-9_]*)\s*=[^=]",
    re.MULTILINE,
)

# Event registrations
_REGISTER_NETEVENT_RE = re.compile(
    r"""RegisterNetEvent\s*\(\s*['"](.*?)['"]""",
)
_REGISTER_SERVEREVENT_RE = re.compile(
    r"""RegisterServerEvent\s*\(\s*['"](.*?)['"]""",
)
_REGISTER_CLIENTEVENT_RE = re.compile(
    r"""RegisterClientEvent\s*\(\s*['"](.*?)['"]""",
)
_REGISTER_NUICALLBACK_RE = re.compile(
    r"""RegisterNUICallback\s*\(\s*['"](.*?)['"]""",
)

# Event triggers
_TRIGGER_NETEVENT_RE = re.compile(
    r"""TriggerEvent\s*\(\s*['"](.*?)['"]""",
)
_TRIGGER_SERVEREVENT_RE = re.compile(
    r"""TriggerServerEvent\s*\(\s*['"](.*?)['"]""",
)
_TRIGGER_CLIENTEVENT_RE = re.compile(
    r"""TriggerClientEvent\s*\(\s*['"](.*?)['"]""",
)

# exports
_EXPORT_RE = re.compile(
    r"""exports\s*\(\s*['"](.*?)['"]""",
)

# FiveM native calls (known patterns that should be excluded)
_FIVEM_EVENT_NAMES = {
    # Standard FiveM lifecycle events
    "playerConnecting", "playerConnected", "playerDropped",
    "playerConnectingDeferred",
    "onResourceStart", "onResourceStop", "onResourceStopping",
    "onServerResourceStart", "onServerResourceStop",
    "cron",
    # Chat framework events (provided by chat resource)
    "chat:addMessage", "chat:addSuggestion", "chat:removeSuggestion",
    "chatMessage",
    # BaseEvents
    "baseevents:playerRegisteredFiveMIdentifier",
    # Spawn events
    "playerSpawned", "spawnReady",
}

# Cross-resource event prefix patterns (events that are meant for other resources)
_CROSS_RESOURCE_PREFIXES = (
    "EasyAdmin:",
    "ea_data:",
    "ox:",
    "esx:",
    "qbx:",
    "qb:",
    "nd:",
    "ox_inventory:",
    "ox_target:",
)


def _strip_comments_and_strings(source: str) -> str:
    """Remove comments and string literals from Lua source for analysis."""
    # Remove multi-line comments first
    text = _MLCOMMENT_RE.sub(" ", source)
    # Remove single-line comments
    text = _COMMENT_RE.sub(" ", text)
    # Remove string literals (replace with space to preserve word boundaries)
    text = _STRING_RE.sub(" ", text)
    return text


def _find_line_for_match(text: str, pos: int) -> int:
    """Find the 1-based line number for a character position in text.

    The pos must be a position within the same text string.
    """
    return text[:pos].count("\n") + 1


class FunctionDef:
    """A function definition found in a Lua file."""
    __slots__ = ("name", "is_local", "table", "line", "file")

    def __init__(self, name: str, is_local: bool, table: str | None, line: int, file: Path):
        self.name = name
        self.is_local = is_local
        self.table = table  # e.g. "Storage" in "function Storage.Get()"
        self.line = line
        self.file = file


class EventDef:
    """An event registration or trigger found in a Lua file."""
    __slots__ = ("name", "kind", "line", "file")

    def __init__(self, name: str, kind: str, line: int, file: Path):
        self.name = name
        self.kind = kind  # 'register' or 'trigger'
        self.line = line
        self.file = file


def _get_lines_excluding_defs(clean: str, functions: list[FunctionDef]) -> str:
    """Return clean source with function definition lines removed.

    This prevents the function name in the definition from being counted
    as a reference to itself.
    """
    # Build a set of line numbers that contain function definitions
    def_lines: set[int] = set()
    for func in functions:
        def_lines.add(func.line)

    lines = clean.splitlines(keepends=True)
    filtered = []
    for i, line in enumerate(lines, 1):
        if i not in def_lines:
            filtered.append(line)
    return "".join(filtered)


def parse_lua_file(path: Path) -> dict:
    """Parse a Lua file and extract function definitions, events, and variable references."""
    source = path.read_text(encoding="utf-8", errors="replace")
    clean = _strip_comments_and_strings(source)

    functions: list[FunctionDef] = []
    events: list[EventDef] = []
    exports: list[tuple[str, int]] = []

    # Collect table-qualified function lines to skip them in global scan
    table_func_lines: set[int] = set()

    # Local functions (matched against clean source)
    for m in _LOCAL_FUNC_RE.finditer(clean):
        name = m.group(1)
        line = _find_line_for_match(clean, m.start())
        functions.append(FunctionDef(name, True, None, line, path))

    # Table-qualified global functions: function Table.Method(
    for m in _TABLED_FUNC_RE.finditer(clean):
        table_name = m.group(1)
        method_name = m.group(2)
        line = _find_line_for_match(clean, m.start())
        table_func_lines.add(line)
        functions.append(FunctionDef(method_name, False, table_name, line, path))

    # Plain global functions (not local, not table-qualified)
    for m in _GLOBAL_FUNC_RE.finditer(clean):
        name = m.group(1)
        line = _find_line_for_match(clean, m.start())
        # Skip if this is a table-qualified function (already captured above)
        if line in table_func_lines:
            continue
        functions.append(FunctionDef(name, False, None, line, path))

    # Event registrations
    for pattern in [_REGISTER_NETEVENT_RE, _REGISTER_SERVEREVENT_RE, _REGISTER_CLIENTEVENT_RE]:
        for m in pattern.finditer(source):
            line = _find_line_for_match(source, m.start())
            events.append(EventDef(m.group(1), "register", line, path))

    for m in _REGISTER_NUICALLBACK_RE.finditer(source):
        line = _find_line_for_match(source, m.start())
        events.append(EventDef(m.group(1), "nui_callback", line, path))

    # Event triggers
    for pattern in [_TRIGGER_NETEVENT_RE, _TRIGGER_SERVEREVENT_RE, _TRIGGER_CLIENTEVENT_RE]:
        for m in pattern.finditer(source):
            line = _find_line_for_match(source, m.start())
            events.append(EventDef(m.group(1), "trigger", line, path))

    # Exports
    for m in _EXPORT_RE.finditer(source):
        line = _find_line_for_match(source, m.start())
        exports.append((m.group(1), line))

    # Collect all identifier references from lines that are NOT function definitions
    # This prevents the function name in its own definition from counting as a reference
    clean_no_defs = _get_lines_excluding_defs(clean, functions)
    references = set(re.findall(r"[A-Za-z_][A-Za-z0-9_]*", clean_no_defs))

    return {
        "functions": functions,
        "events": events,
        "exports": exports,
        "references": references,
        "source": source,
        "clean": clean,
    }


# ---------------------------------------------------------------------------
# Check: Files in fxmanifest that don't exist
# ---------------------------------------------------------------------------

def check_missing_files(root: Path, entries: list[tuple[str, str]]) -> list[str]:
    """Find files referenced in fxmanifest that don't exist on disk."""
    issues: list[str] = []
    for glob_pattern, context in entries:
        matched = list(root.glob(glob_pattern))
        if not matched:
            issues.append(
                f"  {red('MISSING')} {cyan(glob_pattern)} "
                f"({dim(context)}) — no files match this glob"
            )
    return issues


# ---------------------------------------------------------------------------
# Check: Lua files on disk not listed in fxmanifest
# ---------------------------------------------------------------------------

def check_unlisted_files(
    root: Path,
    entries: list[tuple[str, str]],
    exclude_patterns: list[str] | None = None,
) -> list[str]:
    """Find .lua files on disk that aren't covered by any fxmanifest glob."""
    exclude_patterns = exclude_patterns or []

    # Resolve all globs to actual files
    covered: set[Path] = set()
    for glob_pattern, _ in entries:
        for f in root.glob(glob_pattern):
            if f.is_file():
                covered.add(f)

    issues: list[str] = []
    for lua_file in sorted(root.rglob("*.lua")):
        # Skip fxmanifest itself
        if lua_file.name == "fxmanifest.lua":
            continue
        rel = str(lua_file.relative_to(root))
        if _should_exclude(rel, exclude_patterns):
            continue
        if lua_file not in covered:
            issues.append(
                f"  {yellow('UNLISTED')} {cyan(rel)} — "
                f"exists on disk but not referenced in fxmanifest.lua"
            )
    return issues


# ---------------------------------------------------------------------------
# Check: Unused local functions
# ---------------------------------------------------------------------------

def check_unused_local_functions(
    file_path: Path,
    parsed: dict,
    all_references: dict[str, set[str]],
) -> list[str]:
    """Find local functions that are never called within their file."""
    issues: list[str] = []
    rel = file_path.name

    for func in parsed["functions"]:
        if not func.is_local:
            continue

        # Check if the function name appears as a reference in the same file's clean source
        # (excluding the definition line itself)
        if func.name not in parsed["references"]:
            issues.append(
                f"  {yellow('UNUSED')} {cyan(f'{func.name}()')} "
                f"in {dim(rel)}:{func.line} — "
                f"local function never called"
            )
    return issues


# ---------------------------------------------------------------------------
# Check: Unused global functions
# ---------------------------------------------------------------------------

def check_unused_global_functions(
    context: str,
    context_files: dict[Path, dict],
    all_context_references: set[str],
    known_exports: set[str],
    known_plugin_apis: set[str],
) -> list[str]:
    """Find global functions in a context that are never referenced anywhere in that context."""
    issues: list[str] = []

    # Collect all global functions in this context
    for file_path, parsed in context_files.items():
        for func in parsed["functions"]:
            if func.is_local:
                continue

            name = func.name
            rel = str(file_path.relative_to(file_path.parents[1]))  # relative to resource root

            # Skip if it's exported (another resource may call it)
            if name in known_exports:
                continue

            # Skip known plugin API entry points
            if name in known_plugin_apis:
                continue

            # Check if this function name is referenced anywhere in the context
            if name not in all_context_references:
                issues.append(
                    f"  {yellow('UNUSED')} {cyan(f'{name}()')} "
                    f"in {dim(rel)}:{func.line} — "
                    f"global function never called in {context} context"
                )

    return issues


# ---------------------------------------------------------------------------
# Check: Orphaned event triggers
# ---------------------------------------------------------------------------

def _is_cross_resource_event(name: str) -> bool:
    """Check if an event name looks like it's meant for another resource."""
    for prefix in _CROSS_RESOURCE_PREFIXES:
        if name.startswith(prefix):
            return True
    return False


def check_orphaned_triggers(
    context: str,
    all_events: list[EventDef],
) -> list[str]:
    """Find Trigger*Event calls with no matching Register*Event in the resource."""
    issues: list[str] = []

    # Build set of registered event names (across all contexts)
    registered: set[str] = {
        e.name for e in all_events if e.kind == "register"
    }

    # Also include standard FiveM events
    registered |= _FIVEM_EVENT_NAMES

    for event in all_events:
        if event.kind != "trigger":
            continue

        # Skip cross-resource events
        if _is_cross_resource_event(event.name):
            continue

        if event.name not in registered:
            rel = str(event.file.relative_to(event.file.parents[1]))
            issues.append(
                f"  {red('ORPHANED')} {cyan(event.name)} "
                f"triggered in {dim(rel)}:{event.line} — "
                f"no matching RegisterNetEvent/RegisterServerEvent found"
            )

    return issues


# ---------------------------------------------------------------------------
# Check: Unused NUICallbacks
# ---------------------------------------------------------------------------

def check_unused_nui_callbacks(
    nui_callbacks: list[EventDef],
    nui_root: Path | None,
) -> list[str]:
    """Find RegisterNUICallback entries not called from the NUI TypeScript."""
    issues: list[str] = []

    if not nui_root or not nui_root.is_dir():
        return issues  # Can't check without NUI source

    # Scan TypeScript files for NUI callback references
    callback_names: set[str] = set()
    # Note: rglob doesn't support brace expansion, so we do two passes
    for ts_file in list(nui_root.rglob("*.ts")) + list(nui_root.rglob("*.tsx")):
        content = ts_file.read_text(encoding="utf-8", errors="replace")
        # callLua('actionName', data) or callLua<Type>('actionName', data)
        # The generic type parameter may contain nested <> (e.g. Array<{foo: string}>)
        # Non-greedy .+? works because the rest of the pattern forces backtracking
        for m in re.finditer(r"""callLua(?:<.+?>)?\s*\(\s*['"](.*?)['"]""", content):
            callback_names.add(m.group(1))
        # fetch('/actionName') — generic pattern
        for m in re.finditer(r"""fetch\s*\(\s*['"]/(.*?)['"]""", content):
            callback_names.add(m.group(1))
        # sendNuiMessage('actionName', ...) — alternative pattern
        for m in re.finditer(r"""sendNuiMessage\s*\(\s*['"](.*?)['"]""", content):
            callback_names.add(m.group(1))

    for event in nui_callbacks:
        if event.name not in callback_names:
            rel = str(event.file.relative_to(event.file.parents[1]))
            issues.append(
                f"  {yellow('UNUSED')} NUICallback {cyan(event.name)} "
                f"in {dim(rel)}:{event.line} — "
                f"not called from NUI TypeScript"
            )

    return issues


# ---------------------------------------------------------------------------
# Known plugin API / export allowlists
# ---------------------------------------------------------------------------

# Functions that are entry points for the plugin system — always considered "used"
_PLUGIN_API_FUNCTIONS = {
    # Server plugin hooks
    "OnPlayerBan",
    "OnPlayerUnban",
    "OnPlayerWarn",
    "OnPlayerKick",
    "OnPlayerMute",
    "OnPlayerFreeze",
    "OnPlayerSpectate",
    "OnAdminAction",
    "OnResourceStart",
    "OnResourceStop",
    # Client plugin hooks
    "OnNuiReady",
    "OnMenuOpen",
    "OnMenuClose",
    # These are exported for other resources
    "IsDangerousDevModeEnabled",
    "CanBypassSelfAndImmunityChecks",
    "CanTargetPlayerForModeration",
    "DoesPlayerHavePermission",
    "DoesPlayerHavePermissionForCategory",
    "GetLocalisedText",
    "GetResourceUptime",
}


# ---------------------------------------------------------------------------
# Main
# ---------------------------------------------------------------------------

def lint_resource(root: Path, config_path: Path | None = None) -> int:
    """Run all checks on a FiveM resource. Returns exit code."""
    manifest = root / "fxmanifest.lua"
    if not manifest.is_file():
        print(f"Error: {manifest} not found", file=sys.stderr)
        return 2

    # Load config (lint-lua.toml from resource root or parent)
    config = _load_config(root) if config_path is None else {}
    if config_path:
        try:
            with open(config_path, "rb") as f:
                config = tomllib.load(f)
        except Exception as e:
            print(f"Error: failed to parse {config_path}: {e}", file=sys.stderr)
            return 2

    exclude_patterns: list[str] = config.get("exclude", [])
    extra_allowlist: set[str] = set(config.get("allowlist", {}).get("functions", []))

    # Merge config allowlist with built-in allowlist
    plugin_apis = _PLUGIN_API_FUNCTIONS | extra_allowlist

    print(f"\n{cyan('Linting')} {dim(str(root))}\n")
    if exclude_patterns:
        print(f"  {dim('Excluded:')} {', '.join(exclude_patterns)}\n")

    all_issues: list[str] = []

    # Parse fxmanifest
    entries, ui_pages = parse_fxmanifest(manifest)

    # --- Check 1: Missing files ---
    print(f"{dim('--- Files ---')}")
    missing = check_missing_files(root, entries)
    if missing:
        all_issues.extend(missing)
        for issue in missing:
            print(issue)
    else:
        print(f"  {green('OK')} all fxmanifest entries resolve to existing files")

    # --- Check 2: Unlisted files ---
    unlisted = check_unlisted_files(root, entries, exclude_patterns)
    if unlisted:
        all_issues.extend(unlisted)
        for issue in unlisted:
            print(issue)
    else:
        print(f"  {green('OK')} all .lua files are referenced in fxmanifest")

    # Resolve globs to actual files with their contexts
    context_files: dict[str, dict[Path, dict]] = {"client": {}, "server": {}, "shared": {}}

    for glob_pattern, context in entries:
        for f in root.glob(glob_pattern):
            if f.is_file() and f.suffix == ".lua":
                rel = str(f.relative_to(root))
                if _should_exclude(rel, exclude_patterns):
                    continue
                parsed = parse_lua_file(f)
                context_files[context][f] = parsed

    # Collect all references per context (shared → both client and server)
    shared_refs: set[str] = set()
    for parsed in context_files["shared"].values():
        shared_refs |= parsed["references"]

    # Collect ALL references across every context (for shared function checks)
    all_refs_global: set[str] = shared_refs.copy()
    for ctx_files in context_files.values():
        for parsed in ctx_files.values():
            all_refs_global |= parsed["references"]

    # Collect exports
    all_exports: set[str] = set()
    for ctx_files in context_files.values():
        for parsed in ctx_files.values():
            for name, _ in parsed["exports"]:
                all_exports.add(name)

    # --- Check 3: Unused local functions ---
    print(f"\n{dim('--- Unused Local Functions ---')}")
    local_issues: list[str] = []
    for ctx_name, ctx_files in context_files.items():
        for file_path, parsed in ctx_files.items():
            issues = check_unused_local_functions(file_path, parsed, {})
            if issues:
                local_issues.extend(issues)
    if local_issues:
        all_issues.extend(local_issues)
        for issue in local_issues:
            print(issue)
    else:
        print(f"  {green('OK')} no unused local functions")

    # --- Check 4: Unused global functions ---
    print(f"\n{dim('--- Unused Global Functions ---')}")
    global_issues: list[str] = []
    for ctx_name in ("client", "server", "shared"):
        ctx_files = context_files[ctx_name]
        if not ctx_files:
            continue

        # Shared functions are visible to ALL contexts, so check against all refs
        if ctx_name == "shared":
            all_refs = all_refs_global
        else:
            # Client/server functions are visible within their context + shared
            all_refs = shared_refs.copy()
            for parsed in ctx_files.values():
                all_refs |= parsed["references"]

        issues = check_unused_global_functions(
            ctx_name, ctx_files, all_refs, all_exports, plugin_apis
        )
        if issues:
            global_issues.extend(issues)
    if global_issues:
        all_issues.extend(global_issues)
        for issue in global_issues:
            print(issue)
    else:
        print(f"  {green('OK')} no unused global functions")

    # --- Check 5: Orphaned event triggers ---
    print(f"\n{dim('--- Orphaned Event Triggers ---')}")
    all_events: list[EventDef] = []
    for ctx_files in context_files.values():
        for parsed in ctx_files.values():
            all_events.extend(parsed["events"])

    orphaned = check_orphaned_triggers("all", all_events)
    if orphaned:
        all_issues.extend(orphaned)
        for issue in orphaned:
            print(issue)
    else:
        print(f"  {green('OK')} all triggered events have matching registrations")

    # --- Check 6: Unused NUICallbacks ---
    nui_root = root / "nui" / "src"
    nui_issues = check_unused_nui_callbacks(
        [e for e in all_events if e.kind == "nui_callback"],
        nui_root,
    )
    if nui_issues:
        print(f"\n{dim('--- Unused NUICallbacks ---')}")
        all_issues.extend(nui_issues)
        for issue in nui_issues:
            print(issue)

    # --- Summary ---
    print()
    if all_issues:
        print(f"  {red(f'{len(all_issues)} issue(s) found')}\n")
        return 1
    else:
        print(f"  {green('All checks passed!')}\n")
        return 0


def main():
    parser = argparse.ArgumentParser(
        description="FiveM Lua linter — checks for dead code, missing files, orphaned events"
    )
    parser.add_argument(
        "resource",
        type=Path,
        help="Path to the FiveM resource root (must contain fxmanifest.lua)",
    )
    parser.add_argument(
        "--config",
        type=Path,
        default=None,
        help="Path to lint-lua.toml config file (auto-detected from resource root if omitted)",
    )
    args = parser.parse_args()

    root = args.resource.resolve()
    if not root.is_dir():
        print(f"Error: {root} is not a directory", file=sys.stderr)
        sys.exit(2)

    sys.exit(lint_resource(root, args.config))


if __name__ == "__main__":
    main()
