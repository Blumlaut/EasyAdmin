import fs from 'fs'
import path from 'path'

/**
 * Load translations from a language JSON file.
 * @param lang - Language code (e.g. "en", "de")
 * @returns Translation strings
 */
export function loadTranslations(lang: string): Record<string, string> {
	const file = path.join(__dirname, '../../language', `${lang}.json`)
	const raw = fs.readFileSync(file, 'utf-8')
	return JSON.parse(raw)
}
