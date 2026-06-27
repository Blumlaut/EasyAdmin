/**
 * Load translations from a language JSON file.
 * @param lang - Language code (e.g. "en", "de")
 * @returns Translation strings
 */
export function loadTranslations(lang: string): Record<string, string> {
	const raw = LoadResourceFile(GetCurrentResourceName(), `language/${lang}.json`)
	return JSON.parse(raw)
}
