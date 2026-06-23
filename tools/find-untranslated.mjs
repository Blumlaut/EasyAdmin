#!/usr/bin/env node

/**
 * Find potentially untranslated hardcoded English strings in source code.
 *
 * Scans:
 *   - nui/src/ (.tsx) — aria-label, title, placeholder, bare text children, notify("...")
 *   - client/ server/ shared/ (.lua) — hardcoded strings in user-facing contexts
 *   - src/bot/ (.js) — hardcoded strings in user-facing contexts
 *
 * This is a heuristic scanner — it will produce false positives for things like
 * CSS class names, variable references, or intentionally hardcoded strings.
 * Always review results manually.
 */

import fs from 'fs'
import path from 'path'
import { fileURLToPath } from 'url'

const __dirname = path.dirname(fileURLToPath(import.meta.url))
const root = path.resolve(__dirname, '..')  // resource root (EasyAdmin/)

/**
 * Recursively read all files matching given extensions.
 */
function readFiles(dir, extensions) {
  const results = []
  if (!fs.existsSync(dir)) return results

  for (const entry of fs.readdirSync(dir, { withFileTypes: true })) {
    const fullPath = path.join(dir, entry.name)
    if (entry.isDirectory()) {
      if (entry.name === 'node_modules') continue
      results.push(...readFiles(fullPath, extensions))
    } else if (extensions.some((ext) => entry.name.endsWith(ext))) {
      results.push(fullPath)
    }
  }
  return results
}

/**
 * Relative path from root for cleaner output.
 */
function relPath(filePath) {
  return path.relative(root, filePath)
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

// ============================================================
// NUI (TypeScript/TSX) patterns
// ============================================================

const ariaLabelPattern = /aria-label="([^"]+)"/g
const titlePattern = /title="([^"]+)"/g
const placeholderPattern = /placeholder="([^"]+)"/g
const textChildrenPattern = /<(span|p|label|option|th|button|h[1-6])[^>]*>([^<]{3,})<\/\1>/g
const notifyPattern = /notify\(\s*"([^"]+)"/g

const nuiPatterns = [
  { regex: ariaLabelPattern, label: 'aria-label' },
  { regex: titlePattern, label: 'title' },
  { regex: placeholderPattern, label: 'placeholder' },
  { regex: textChildrenPattern, label: 'text child', groupIndex: 2 },
  { regex: notifyPattern, label: 'notify()' },
]

for (const file of readFiles(path.resolve(root, 'nui', 'src'), ['.tsx'])) {
  if (file.includes('.test.')) continue
  const content = fs.readFileSync(file, 'utf-8')
  const lines = content.split('\n')

  for (const { regex, label, groupIndex = 1 } of nuiPatterns) {
    const freshRegex = new RegExp(regex.source, 'g')
    let match

    while ((match = freshRegex.exec(content)) !== null) {
      const value = match[groupIndex]
      if (looksLikeEnglishText(value)) {
        const lineNum = content.substring(0, match.index).split('\n').length
        const lineContent = lines[lineNum - 1]?.trim() || ''

        // Skip lines that are comments
        if (lineContent.startsWith('//') || lineContent.startsWith('/*') || lineContent.startsWith('*')) continue

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

// ============================================================
// Lua patterns (client/, server/, shared/)
// ============================================================

/**
 * Match Lua string literals: "..." or '...'
 * We look for strings assigned to variables or passed to user-facing functions.
 */

// Strings in common user-facing Lua function calls
const luaUserFacingCalls = [
  { regex: /ShowNotification\(\s*"([^"]+)"/g, label: 'ShowNotification("' },
  { regex: /ShowNotification\(\s*'([^']+)'/g, label: "ShowNotification(')" },
  { regex: /TriggerEvent\(\s*"EasyAdmin:showNotification"\s*,\s*"([^"]+)"/g, label: 'TriggerEvent(showNotification, "' },
  { regex: /TriggerEvent\(\s*"EasyAdmin:showNotification"\s*,\s*'([^']+)'/g, label: "TriggerEvent(showNotification, ')" },
  { regex: /TriggerClientEvent\(\s*"EasyAdmin:showNotification"\s*,[^,]+,\s*"([^"]+)"/g, label: 'TriggerClientEvent(showNotification, "' },
  { regex: /TriggerClientEvent\(\s*"EasyAdmin:showNotification"\s*,[^,]+,\s*'([^']+)'/g, label: "TriggerClientEvent(showNotification, ')" },
  { regex: /AddTextComponentString\(\s*"([^"]+)"/g, label: 'AddTextComponentString("' },
  { regex: /AddTextComponentString\(\s*'([^']+)'/g, label: "AddTextComponentString(')" },
  { regex: /displayKeyboardInput\(\s*"([^"]+)"/g, label: 'displayKeyboardInput("' },
  { regex: /displayKeyboardInput\(\s*'([^']+)'/g, label: "displayKeyboardInput(')" },
  { regex: /SendNUIMessage\(\s*\{[^}]*action\s*=\s*['"]open['"][^}]*title\s*=\s*label[^}]*default\s*=\s*(['"])([^'"]+)\1/g, label: 'SendNUIMessage keyboard default', groupIndex: 2 },
]

/**
 * Check if a line is inside a GetLocalisedText() call (skip those).
 */
function isInsideLocalisedText(line) {
  return /GetLocalisedText\s*\(/.test(line)
}

for (const dir of ['client', 'server', 'shared', 'plugins']) {
  for (const file of readFiles(path.resolve(root, dir), ['.lua'])) {
    const content = fs.readFileSync(file, 'utf-8')
    const lines = content.split('\n')

    for (const { regex, label, groupIndex = 1 } of luaUserFacingCalls) {
      const freshRegex = new RegExp(regex.source, 'g')
      let match

      while ((match = freshRegex.exec(content)) !== null) {
        const value = match[groupIndex]
        const lineNum = content.substring(0, match.index).split('\n').length
        const lineContent = lines[lineNum - 1]?.trim() || ''

        // Skip lines that are Lua comments
        if (lineContent.startsWith('--')) continue
        // Skip if the string is already inside GetLocalisedText()
        if (isInsideLocalisedText(lineContent)) continue

        if (looksLikeEnglishText(value)) {
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
}

// ============================================================
// Bot patterns (src/bot/)
// ============================================================

/**
 * Bot-specific patterns for hardcoded English in user-facing messages.
 * Skips strings already inside t() or GetLocalisedText() calls.
 */
const botPatterns = [
  { regex: /\.send\(\s*"([^"]+)"/g, label: '.send("' },
  { regex: /\.send\(\s*'([^']+)'/g, label: ".send(')" },
  { regex: /\.reply\(\s*"([^"]+)"/g, label: '.reply("' },
  { regex: /\.reply\(\s*'([^']+)'/g, label: ".reply(')" },
  { regex: /setContent\(\s*"([^"]+)"/g, label: '.setContent("' },
  { regex: /setContent\(\s*'([^']+)'/g, label: ".setContent(')" },
  { regex: /setTitle\(\s*"([^"]+)"/g, label: '.setTitle("' },
  { regex: /setTitle\(\s*'([^']+)'/g, label: ".setTitle(')" },
  { regex: /setDescription\(\s*"([^"]+)"/g, label: '.setDescription("' },
  { regex: /setDescription\(\s*'([^']+)'/g, label: ".setDescription(')" },
  { regex: /setFooter\(\s*\{[^}]*text\s*:\s*"([^"]+)"/g, label: '.setFooter text("' },
  { regex: /setFooter\(\s*\{[^}]*text\s*:\s*'([^']+)'/g, label: ".setFooter text(')" },
  { regex: /setAuthor\(\s*\{[^}]*name\s*:\s*"([^"]+)"/g, label: '.setAuthor name("' },
  { regex: /setAuthor\(\s*\{[^}]*name\s*:\s*'([^']+)'/g, label: ".setAuthor name(')" },
  { regex: /addFields\(\s*\{[^}]*name\s*:\s*"([^"]+)"/g, label: '.addField name("' },
  { regex: /addFields\(\s*\{[^}]*name\s*:\s*'([^']+)'/g, label: ".addField name(')" },
  { regex: /addFields\(\s*\{[^}]*value\s*:\s*"([^"]+)"/g, label: '.addField value("' },
  { regex: /addFields\(\s*\{[^}]*value\s*:\s*'([^']+)'/g, label: ".addField value(')" },
]

for (const file of readFiles(path.resolve(root, 'src', 'bot'), ['.js'])) {
  const content = fs.readFileSync(file, 'utf-8')
  const lines = content.split('\n')

  for (const { regex, label, groupIndex = 1 } of botPatterns) {
    const freshRegex = new RegExp(regex.source, 'g')
    let match

    while ((match = freshRegex.exec(content)) !== null) {
      const value = match[groupIndex]
      const lineNum = content.substring(0, match.index).split('\n').length
      const lineContent = lines[lineNum - 1]?.trim() || ''

      // Skip lines that are comments
      if (lineContent.startsWith('//') || lineContent.startsWith('/*') || lineContent.startsWith('*')) continue
      // Skip if inside t() or GetLocalisedText()
      if (/t\s*\(/.test(lineContent) || /GetLocalisedText\s*\(/.test(lineContent)) continue

      if (looksLikeEnglishText(value)) {
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

// ============================================================
// Output
// ============================================================

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
      console.log(`    L${item.line.toString().padStart(4)}  [${item.pattern.padEnd(35)}]  "${item.value}"`)
      console.log(`           ${item.context}`)
    }
  }

  console.log(`\n  Note: These are heuristic matches — review each one manually.`)
  console.log(`  False positives include: CSS class names, variable refs, component names, etc.\n`)
}
