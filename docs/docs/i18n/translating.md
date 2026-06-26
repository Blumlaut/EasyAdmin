# Translating

EasyAdmin supports multiple languages. Translation files are JSON files stored in the `language/` directory.

## Supported Languages

| Code | Language |
|------|----------|
| `de` | German |
| `en` | English |
| `es` | Spanish |
| `fr` | French |
| `it` | Italian |
| `nl` | Dutch |
| `pl` | Polish |

## Setting Language

Set the language via convar:

```
set ea_LanguageName "de"
```

Default: `en` (English)

## Translation File Format

Translation files are JSON arrays containing key-value pairs. Each file represents one language.

Example from `en.json`:

```json
[{
    "translator": "EasyAdmin",
    "language": "en",
    "on": "On",
    "off": "Off",
    "spectatingUser": "Spectating ~b~<C>%s</C>.",
    "kickplayer": "Kick Player",
    "banplayer": "Ban Player",
    "reason": "Reason",
    "time": "Time"
}]
```

The file must be a JSON array with a single object containing:

- `translator` — Translator or team name
- `language` — Language code (matches the filename)
- All translation key-value pairs

## Adding a New Language

1. Copy `language/en.json` to `language/xx.json` (replace `xx` with the language code).
2. Translate all string values to the target language.
3. Update the `translator` and `language` fields.
4. Keep all keys unchanged.
5. Do not modify the JSON structure or escape sequences.

### Escape Sequences

Some strings contain formatting codes:

- `~b~` — Blue text color
- `<C>` — Cyan text color (HTML-like tag)
- `%s` — String placeholder for dynamic values

Preserve these codes exactly as they appear in the English file.

## Updating Existing Languages

To update an existing language file:

1. Open the corresponding `language/xx.json` file.
2. Compare keys with `language/en.json` to find missing entries.
3. Update or add translations as needed.
4. Keep the JSON array structure intact.

## Adding New Translation Keys

When new UI strings are added to EasyAdmin, they must be registered in `shared/util_shared.lua` and added to all language files. Contributors adding new strings should:

1. Add the English string to `language/en.json`.
2. Use `GetLocalisedText("key_name")` in Lua code to reference the string.
3. Notify translators to add the new key to their language files.
