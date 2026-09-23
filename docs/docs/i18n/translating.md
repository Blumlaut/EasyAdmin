# Translating

EasyAdmin can display its menu and messages in several languages. Each language is a single JSON file in the resource's `language` folder, and translations come from the community.

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

## Setting the Language

Set the language for your whole server:

```
set ea_LanguageName "de"
```

Default: `en` (English). This is a server-wide setting — individual players cannot pick their own language.

## How Translation Files Work

`language/en.json` is the master file. Every piece of text EasyAdmin shows is a key in that file, and the English wording is also its value. To translate, you replace the values and leave the keys exactly as they are:

```json
{
  "Kick Player": "Spieler kicken",
  "You have been warned, Reason: {reason}": "Du wurdest verwarnt, Grund: {reason}"
}
```

Two rules matter:

- **Keep the keys unchanged.** They are how EasyAdmin finds the right text. Translating a key breaks the lookup.
- **Keep `{placeholders}` intact.** EasyAdmin replaces them with real values, such as a player name or a reason.

If a key is missing from a language file, EasyAdmin simply shows the English text. A partial translation is fine, and keys you have not translated yet can be left out.

## Adding a New Language

1. Copy `language/en.json` to a new file named after the language code, for example `language/pt.json`.
2. Replace the values with your translations, keeping every key as it is.
3. Save the file as valid JSON.
4. Select it on the server with `set ea_LanguageName "pt"`.

## Keeping a Language Up to Date

When EasyAdmin is updated, new text is added to `language/en.json`. To see what is missing from your language:

1. Run the extractor from the EasyAdmin folder — it reads the strings used in the code and adds anything new:

   ```
   node tools/extract-i18n.mjs
   ```

2. Newly added entries are marked `"<< untranslated >>"`. Replace that marker with your translation.

Entries you leave as `"<< untranslated >>"` will show that text in the menu, so it is worth clearing them before putting a language into use.

## Contributing a Translation

Translations are welcome. Open a pull request against the EasyAdmin repository with your language file, and mention which language you have translated and whether it is complete.
