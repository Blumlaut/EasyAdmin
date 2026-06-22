#!/usr/bin/env node

/**
 * Find potentially untranslated hardcoded English strings in NUI source.
 *
 * Scans nui/src/ (excluding tests) for:
 *   - aria-label="..." with capitalized English text
 *   - title="..." with capitalized English text
 *   - placeholder="..." with capitalized English text
 *   - Bare string children in <span>, <p>, <label>, <option>, <th>, <button>, <h1>-<h6>
 *   - notify("...") with hardcoded strings
 *
 * This is a heuristic scanner — it will produce false positives for things like
 * CSS class names, variable references, or intentionally hardcoded strings.
 * Always review results manually.
 */

import fs from 'fs'
import path from 'path'
import { fileURLToPath } from 'url'

const __dirname = path.dirname(fileURLToPath(import.meta.url))
const root = path.resolve(__dirname, '..')
const srcDir = path.resolve(root, 'src')

/**
 * Recursively read all .tsx files (excluding tests and node_modules).
 */
function readTsxFiles(dir) {
  const results = []
  if (!fs.existsSync(dir)) return results

  for (const entry of fs.readdirSync(dir, { withFileTypes: true })) {
    const fullPath = path.join(dir, entry.name)
    if (entry.isDirectory()) {
      if (entry.name === 'node_modules') continue
      results.push(...readTsxFiles(fullPath))
    } else if (entry.name.endsWith('.tsx') && !entry.name.includes('.test.')) {
      results.push(fullPath)
    }
  }
  return results
}

/**
 * Relative path from root for cleaner output.
 */
function relPath(filePath) {
  return path.relative(path.resolve(root, '..'), filePath)
}

/**
 * Check if a string looks like user-facing English text:
 * - Starts with a capital letter
 * - Is at least 3 characters
 * - Contains only printable ASCII (no template literals, no code-like patterns)
 */
function looksLikeEnglishText(str) {
  if (str.length < 3) return false
  if (!/^[A-Z]/.test(str)) return false
  // Exclude things that look like CSS classes, HTML entities, or code
  if (/^(https?:|www\.|class|id|data-|role|type|method|GET|POST|PUT|DELETE|PATCH|HTTP|JSON|XML|HTML|CSS|JS|TS|React|Node|CEF|NUI|ID|URL|API|HTTP|TCP|UDP|IPv|DNS|UDP|TCP|UDP|UDP)/i.test(str)) return false
  return true
}

const findings = []

// --- Pattern 1: Hardcoded aria-label ---
const ariaLabelPattern = /aria-label="([^"]+)"/g

// --- Pattern 2: Hardcoded title ---
const titlePattern = /title="([^"]+)"/g

// --- Pattern 3: Hardcoded placeholder ---
const placeholderPattern = /placeholder="([^"]+)"/g

// --- Pattern 4: Bare text in common UI elements ---
// Matches <tag>Text</tag> where Text starts with capital letter (no nested JSX)
const textChildrenPattern = /<(span|p|label|option|th|button|h[1-6])[^>]*>([^<]{3,})<\/\1>/g

// --- Pattern 5: notify() with hardcoded strings ---
const notifyPattern = /notify\(\s*"([^"]+)"/g

const patterns = [
  { regex: ariaLabelPattern, label: 'aria-label' },
  { regex: titlePattern, label: 'title' },
  { regex: placeholderPattern, label: 'placeholder' },
  { regex: textChildrenPattern, label: 'text child', groupIndex: 2 },
  { regex: notifyPattern, label: 'notify()' },
]

for (const file of readTsxFiles(srcDir)) {
  const content = fs.readFileSync(file, 'utf-8')
  const lines = content.split('\n')

  for (const { regex, label, groupIndex = 1 } of patterns) {
    // Reset regex state for each file
    const freshRegex = new RegExp(regex.source, 'g')
    let match

    while ((match = freshRegex.exec(content)) !== null) {
      const value = match[groupIndex]
      if (looksLikeEnglishText(value)) {
        // Find line number
        const lineNum = content.substring(0, match.index).split('\n').length
        const lineContent = lines[lineNum - 1]?.trim() || ''

        findings.push({
          file: relPath(file),
          line: lineNum,
          pattern: label,
          value: value,
          context: lineContent,
        })
      }
    }
  }
}

// --- Output ---
if (findings.length === 0) {
  console.log('\n✓ No untranslated hardcoded strings found.\n')
} else {
  console.log(`\nFound ${findings.length} potentially untranslated string(s):\n`)

  // Group by file
  const byFile = {}
  for (const f of findings) {
    if (!byFile[f.file]) byFile[f.file] = []
    byFile[f.file].push(f)
  }

  for (const [file, items] of Object.entries(byFile).sort()) {
    console.log(`\n  ${file}:`)
    for (const item of items) {
      console.log(`    L${item.line.toString().padStart(4)}  [${item.pattern.padEnd(12)}]  "${item.value}"`)
      console.log(`           ${item.context}`)
    }
  }

  console.log(`\n  Note: These are heuristic matches — review each one manually.`)
  console.log(`  False positives include: CSS class names, variable refs, component names, etc.\n`)
}
