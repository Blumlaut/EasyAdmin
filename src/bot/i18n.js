const fs = require('fs')
const path = require('path')

/**
 * Load translations from a language JSON file.
 * @param {string} lang - Language code (e.g. "en", "de")
 * @returns {Record<string, string>}
 */
function loadTranslations(lang) {
  const file = path.join(__dirname, '../../language', `${lang}.json`)
  const raw = fs.readFileSync(file, 'utf-8')
  return JSON.parse(raw)
}

/**
 * Resolve a translation key and replace named placeholders.
 * @param {Record<string, string>} strings - The loaded translations object
 * @param {string} key - The English text to look up
 * @param {Record<string, string | number>} [params] - Named placeholder values
 * @returns {string}
 */
function t(strings, key, params) {
  const template = strings?.[key] ?? key
  if (!params || Object.keys(params).length === 0) return template
  return template.replace(/\{(\w+)\}/g, (_, param) => String(params[param] ?? `{${param}}`))
}

module.exports = { loadTranslations, t }
