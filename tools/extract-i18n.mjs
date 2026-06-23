#!/usr/bin/env node

/**
 * Extract all i18n string keys from source code and generate language files.
 *
 * Scans:
 *   - nui/src/ for t("...") calls (only in files importing from i18n)
 *   - client/ server/ shared/ for GetLocalisedText("...") calls
 *   - bot/ for t("...") and GetLocalisedText("...") calls
 *
 * Outputs:
 *   - language/en.json (master, identity map)
 *   - language/*.json (preserves existing translations, adds new keys with sentinel)
 */

import fs from 'fs'
import path from 'path'
import { fileURLToPath } from 'url'

const __dirname = path.dirname(fileURLToPath(import.meta.url))
const root = path.resolve(__dirname, '..')  // resource root (EasyAdmin/)
const languageDir = path.resolve(root, 'language')

/**
 * Extract string keys from t("...") calls.
 * Uses a more robust approach: finds all t( then extracts the string arg.
 */
const TS_PATTERN = /\bt\(\s*(?:"([^"]*)"|'([^']*)')/g

/**
 * Extract string keys from GetLocalisedText("...") calls.
 */
const LUA_PATTERN = /GetLocalisedText\(\s*(?:"([^"]*)"|'([^']*)')/g

const MIN_KEY_LENGTH = 3

/**
 * Recursively read all files matching given extensions.
 */
function readFiles(dir, extensions) {
  const results = []
  if (!fs.existsSync(dir)) return results

  for (const entry of fs.readdirSync(dir, { withFileTypes: true })) {
    const fullPath = path.join(dir, entry.name)
    if (entry.isDirectory()) {
      results.push(...readFiles(fullPath, extensions))
    } else if (extensions.some((ext) => entry.name.endsWith(ext))) {
      results.push(fullPath)
    }
  }
  return results
}

/**
 * Check if a TypeScript file imports from the i18n module.
 */
function importsI18n(content) {
  return /from\s+['"].*i18n['"]/.test(content)
}

/**
 * Extract all i18n keys from a single file using given patterns.
 */
function extractKeysFromFile(filePath, patterns) {
  try {
    const content = fs.readFileSync(filePath, 'utf-8')
    const keys = new Set()
    for (const pattern of patterns) {
      const regex = new RegExp(pattern.source, 'g')
      let match
      while ((match = regex.exec(content)) !== null) {
        // Group 1 = double-quoted, Group 2 = single-quoted
        const key = match[1] ?? match[2]
        if (key && key.length >= MIN_KEY_LENGTH) {
          keys.add(key)
        }
      }
    }
    return keys
  } catch {
    return new Set()
  }
}

/**
 * Collect all keys from all source directories.
 */
function collectAllKeys() {
  const allKeys = new Set()

  // NUI: TypeScript/TSX files (only if they import from i18n)
  const nuiSrc = path.resolve(root, 'nui', 'src')
  for (const file of readFiles(nuiSrc, ['.ts', '.tsx'])) {
    if (file.includes('node_modules') || file.includes('.test.')) continue
    try {
      const content = fs.readFileSync(file, 'utf-8')
      if (importsI18n(content)) {
        for (const key of extractKeysFromFile(file, [TS_PATTERN])) {
          allKeys.add(key)
        }
      }
    } catch { /* skip */ }
  }

  // Lua: client, server, shared, plugins
  for (const dir of ['client', 'server', 'shared', 'plugins']) {
    const dirPath = path.resolve(root, dir)
    for (const file of readFiles(dirPath, ['.lua'])) {
      for (const key of extractKeysFromFile(file, [LUA_PATTERN])) {
        allKeys.add(key)
      }
    }
  }

  // Bot: JavaScript files (uses global t() and GetLocalisedText)
  const botDir = path.resolve(root, 'bot')
  for (const file of readFiles(botDir, ['.js'])) {
    if (file.includes('node_modules')) continue
    for (const key of extractKeysFromFile(file, [TS_PATTERN, LUA_PATTERN])) {
      allKeys.add(key)
    }
  }

  return allKeys
}

/**
 * Generate en.json (identity map: key = value).
 */
function generateEnglishFile(keys) {
  const obj = {}
  for (const key of [...keys].sort()) {
    obj[key] = key
  }
  return obj
}

/**
 * Update a non-English language file:
 * - Preserve existing translations
 * - Add new keys with << untranslated >> sentinel
 * - Remove keys no longer in source
 */
function updateLanguageFile(existing, newKeys) {
  const updated = {}
  for (const key of [...newKeys].sort()) {
    if (existing[key] && existing[key] !== '<< untranslated >>') {
      updated[key] = existing[key]
    } else {
      updated[key] = '<< untranslated >>'
    }
  }
  return updated
}

/**
 * Write a JSON object to a language file.
 */
function writeLanguageFile(lang, data) {
  const filePath = path.join(languageDir, `${lang}.json`)
  fs.writeFileSync(filePath, JSON.stringify(data, null, 2) + '\n', 'utf-8')
  console.log(`  ${lang}.json: ${Object.keys(data).length} keys`)
}

// --- Main ---

console.log('Extracting i18n strings...\n')

const keys = collectAllKeys()
console.log(`Found ${keys.size} unique string keys\n`)

if (keys.size === 0) {
  console.log('No keys found. Make sure your source uses t("...") or GetLocalisedText("...") calls.')
  console.log('For NUI files, the extraction only scans files that import from the i18n module.')
  process.exit(1)
}

// Generate en.json
console.log('Generating language files:')
const enData = generateEnglishFile(keys)
writeLanguageFile('en', enData)

// Update other language files
const existingFiles = fs.readdirSync(languageDir)
  .filter((f) => f.endsWith('.json') && f !== 'en.json')
  .map((f) => f.replace('.json', ''))

for (const lang of existingFiles) {
  const filePath = path.join(languageDir, `${lang}.json`)
  let existing = {}
  try {
    existing = JSON.parse(fs.readFileSync(filePath, 'utf-8'))
  } catch {
    console.warn(`  Warning: Could not parse ${lang}.json, starting fresh`)
  }
  const updated = updateLanguageFile(existing, keys)
  writeLanguageFile(lang, updated)
}

// Count untranslated entries
for (const lang of existingFiles) {
  const data = JSON.parse(fs.readFileSync(path.join(languageDir, `${lang}.json`), 'utf-8'))
  const untranslated = Object.values(data).filter((v) => v === '<< untranslated >>').length
  if (untranslated > 0) {
    console.log(`  ${lang}: ${untranslated} untranslated`)
  }
}

console.log('\nDone.')
