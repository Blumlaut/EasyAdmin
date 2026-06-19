#!/usr/bin/env node
// audit-permissions.mjs
//
// Scans server-side Lua for RegisterNetEvent / RegisterServerEvent / RegisterCommand
// handlers that lack a permission guard.
//
// Usage:  node tools/audit-permissions.mjs [paths...]
//   Defaults to server/ and plugins/ relative to the repo root.
//
// Exit 0 = clean, exit 1 = violations found.

import { readFileSync, readdirSync, statSync } from "node:fs";
import { join, relative, dirname } from "node:path";
import { fileURLToPath } from "node:url";

// ---------------------------------------------------------------------------
// Config
// ---------------------------------------------------------------------------

const __dirname = dirname(fileURLToPath(import.meta.url));
const ROOT = join(__dirname, "..");

// Directories to scan (relative to repo root)
const DEFAULT_DIRS = ["server", "plugins"];

// Event names that are explicitly exempt (server-internal lifecycle / callbacks).
// These are NOT player-facing net events — they fire from the framework or
// server code only, so no permission gate is needed.
const EXEMPT_EVENTS = new Set([
  // FiveM lifecycle
  "playerDropped",
  "playerConnecting",
  "playerConnect",
  "onServerResourceStop",
  "onServerResourceStart",
  "chatMessage",
  "banCheater",

  // EasyAdmin internal (TriggerEvent, not TriggerServerEvent)
  "EasyAdmin:LogAction",
  "EasyAdmin:addBan",
  "EasyAdmin:GetVersion",
  "EasyAdmin:reportClaimed",

  // Callbacks from server-initiated client requests (the server triggered the
  // client action, so the callback is trusted)
  "EasyAdmin:TookScreenshot",

  // Session bookkeeping (every player fires this on load — gating would break tracking)
  "EasyAdmin:sessionStart",

  // The permission handshake itself (iterates permissions to build the client set)
  "EasyAdmin:amiadmin",
]);

// ---------------------------------------------------------------------------
// Patterns
// ---------------------------------------------------------------------------

// Matches: RegisterNetEvent("name", function(...)  or  RegisterServerEvent('name', function(...)
const EVENT_RE =
  /^\s*(?:RegisterNetEvent|RegisterServerEvent)\s*\(\s*["']([^"']+)["']\s*,\s*(?:function|function\s*\()/;

// Matches: RegisterCommand("name", function(source, ...)
const COMMAND_RE =
  /^\s*RegisterCommand\s*\(\s*["']([^"']+)["']\s*,\s*(?:function|function\s*\()/;

// Permission guard patterns (any of these inside a handler body = guarded)
const GUARD_PATTERNS = [
  // DoesPlayerHavePermission(src, "perm")
  /DoesPlayerHavePermission\s*\(/,
  // DoesPlayerHavePermissionForCategory(...)
  /DoesPlayerHavePermissionForCategory\s*\(/,
  // IsPlayerAdmin(...) — checks if player has ANY EasyAdmin permission (valid gate)
  /IsPlayerAdmin\s*\(/,
  // source == 0 — console-only guard
  /source\s*==\s*0\b/,
  // CheckAdminCooldown(...) — only meaningful after a perm check, but often paired
  /CheckAdminCooldown\s*\(/,
  // CanTargetPlayerForModeration(...) — moderation targeting guard
  /CanTargetPlayerForModeration\s*\(/,
];

// Known helper functions that internally call permission checks.
// The scanner treats calls to these as valid guards.
const GUARD_HELPERS = new Set([
  "canManageResources",
  "canStartResources",
  "canStopResources",
  "canProfile",
  "canModerateBanTarget",
]);

// Exemption comment: -- @ea-audit:exempt [reason]
// Placed on the same line as the event or on the line immediately before.
const EXEMPT_COMMENT_RE = /@ea-audit:exempt\b/;

// ---------------------------------------------------------------------------
// Helpers
// ---------------------------------------------------------------------------

/**
 * Skip over strings and comments, yielding only "code" characters.
 * Returns an iterator of { line, col, ch } for non-string, non-comment chars.
 */
function* codeChars(lines, startLine) {
  let inString = false;
  let stringChar = null;
  let inComment = false;
  let inBlockComment = false;

  for (let i = startLine; i < lines.length; i++) {
    const line = lines[i];
    // -- comments are single-line; reset at each new line (unless in --[[ block ]])
    if (!inBlockComment) inComment = false;

    for (let j = 0; j < line.length; j++) {
      const ch = line[j];
      const next = line[j + 1] || "";

      // Block comments (-- ...)
      if (!inString && ch == "-" && next == "-") {
        // Check for long block comment --[[ ... ]]
        if (line[j + 2] == "[") {
          const closeIdx = line.indexOf("]]", j + 4);
          if (closeIdx !== -1) {
            j = closeIdx + 1;
            continue;
          }
          inBlockComment = true;
          inComment = true;
          j += 2;
          continue;
        }
        inComment = true;
        j++;
        continue;
      }
      if (inComment) continue;

      // End of long block comment
      if (inBlockComment && ch == "]" && next == "]") {
        inBlockComment = false;
        inComment = false;
        j++;
        continue;
      }

      // Strings
      if (!inComment && (ch == '"' || ch == "'") && line[j - 1] != "\\") {
        if (!inString) {
          inString = true;
          stringChar = ch;
        } else if (ch === stringChar) {
          inString = false;
        }
        continue;
      }
      if (inString) continue;

      yield { line: i, col: j, ch };
    }
  }
}

/**
 * Extract the handler body from `startLine` (0-indexed).
 * Handles both `{ ... }` and `function(...) ... end` patterns.
 * Returns { body, endLine } where endLine is exclusive.
 */
function extractHandlerBody(lines, startLine) {
  const firstLine = lines[startLine];
  const usesBraces = firstLine.includes("{");

  if (usesBraces) {
    // Brace-delimited: match { ... }
    let depth = 0;
    let started = false;
    for (const { line, ch } of codeChars(lines, startLine)) {
      if (ch == "{") {
        depth++;
        started = true;
      } else if (ch == "}") {
        depth--;
        if (started && depth <= 0) {
          return { body: lines.slice(startLine, line + 1).join("\n"), endLine: line + 1 };
        }
      }
    }
  } else {
    // Keyword-delimited: function(...) ... end
    // Track ALL block openers (function, if, for, while, do, repeat) and their closers.
    // The handler body ends when nesting returns to 0.
    const OPENERS = new Set(["function", "if", "for", "while", "do", "repeat"]);
    let depth = 0;
    let started = false;

    for (const { line, col, ch } of codeChars(lines, startLine)) {
      const word = extractWord(lines[line], col);

      if (OPENERS.has(word)) {
        depth++;
        started = true;
      } else if (word === "until") {
        // repeat ... until (no 'end')
        if (depth > 0) depth--;
      } else if (word === "end" && started) {
        depth--;
        if (depth <= 0) {
          return { body: lines.slice(startLine, line + 1).join("\n"), endLine: line + 1 };
        }
      }
    }
  }

  // Fallback: couldn't find closing delimiter — take next 30 lines
  const fallbackEnd = Math.min(startLine + 30, lines.length);
  return { body: lines.slice(startLine, fallbackEnd).join("\n"), endLine: fallbackEnd };
}

/**
 * Extract a Lua identifier word starting at position `col` in `line`.
 */
function extractWord(line, col) {
  let end = col;
  while (end < line.length && /[a-zA-Z_\d]/.test(line[end])) {
    end++;
  }
  return line.substring(col, end);
}

/**
 * Check if a handler body contains a permission guard.
 */
function hasGuard(body) {
  // Direct guard patterns
  for (const pattern of GUARD_PATTERNS) {
    if (pattern.test(body)) return true;
  }

  // Helper function calls
  for (const helper of GUARD_HELPERS) {
    // Match helper(src) or helper(source) or helper(source, ...)
    const re = new RegExp(`${helper}\\s*\\(`);
    if (re.test(body)) return true;
  }

  return false;
}

/**
 * Check if a line or its predecessor has an exemption comment.
 */
function isExempt(lines, lineIndex) {
  const currentLine = lines[lineIndex] || "";
  const prevLine = lines[lineIndex - 1] || "";
  return EXEMPT_COMMENT_RE.test(currentLine) || EXEMPT_COMMENT_RE.test(prevLine);
}

// ---------------------------------------------------------------------------
// Main
// ---------------------------------------------------------------------------

function scanFile(filePath) {
  const content = readFileSync(filePath, "utf-8");
  const lines = content.split("\n");
  const violations = [];

  for (let i = 0; i < lines.length; i++) {
    let match = lines[i].match(EVENT_RE);
    if (!match) {
      match = lines[i].match(COMMAND_RE);
    }
    if (!match) continue;

    const eventName = match[1];
    const eventType = lines[i].match(COMMAND_RE) ? "command" : "event";

    // Skip exempt events
    if (EXEMPT_EVENTS.has(eventName)) continue;

    // Skip exempted-by-comment
    if (isExempt(lines, i)) continue;

    // Extract handler body
    const { body, endLine } = extractHandlerBody(lines, i);

    // Check for guard
    if (!hasGuard(body)) {
      violations.push({
        file: relative(ROOT, filePath),
        line: i + 1,
        event: eventName,
        type: eventType,
        snippet: lines[i].trim(),
      });
    }
  }

  return violations;
}

function scanPath(path) {
  let violations = [];
  const stat = statSync(path);

  if (stat.isFile() && path.endsWith(".lua")) {
    return scanFile(path);
  }

  if (!stat.isDirectory()) return violations;

  const entries = readdirSync(path, { withFileTypes: true });

  for (const entry of entries) {
    const fullPath = join(path, entry.name);
    if (entry.isDirectory()) {
      violations = violations.concat(scanPath(fullPath));
    } else if (entry.name.endsWith(".lua")) {
      violations = violations.concat(scanFile(fullPath));
    }
  }

  return violations;
}

// ---------------------------------------------------------------------------
// Entry point
// ---------------------------------------------------------------------------

const dirs = process.argv.slice(2).filter((a) => !a.startsWith("-"));
const scanPaths = dirs.length
  ? dirs.map((d) => join(ROOT, d))
  : DEFAULT_DIRS.map((d) => join(ROOT, d));

let allViolations = [];
for (const path of scanPaths) {
  allViolations = allViolations.concat(scanPath(path));
}

// Sort by file then line
allViolations.sort((a, b) => {
  if (a.file < b.file) return -1;
  if (a.file > b.file) return 1;
  return a.line - b.line;
});

if (allViolations.length === 0) {
  console.log("✅ No permission guard violations found.\n");
  process.exit(0);
}

// Print results
console.log(
  `\n❌ Found ${allViolations.length} handler(s) without permission guard(s):\n`
);

for (const v of allViolations) {
  console.log(`  ${v.file}:${v.line}  [${v.type}] ${v.event}`);
  console.log(`    ${v.snippet}`);
}

console.log(
  "\nTo exempt a handler, add `-- @ea-audit:exempt [reason]` on the line above or on the same line.\n"
);

process.exit(1);
