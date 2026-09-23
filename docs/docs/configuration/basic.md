# Basic Configuration

These convars control core behavior: language, ban screen appearance, keybinds, and connection deferral. Add them to your `server.cfg`.

## Language

Sets the language used across the EasyAdmin menu and messages. Language files live in the `language/` folder of the resource.

```
set ea_LanguageName "en"
```

Available languages: `de` (German), `en` (English), `es` (Spanish), `fr` (French), `it` (Italian), `nl` (Dutch), `pl` (Polish).

Default: `en`

## Menu Keybind

### FiveM

The menu key is set through the FiveM settings UI. In game, open the FiveM settings, go to Key Bindings, find "Open EasyAdmin", and assign a key. The `/easyadmin` or `/ea` chat commands always work as a fallback.

### RedM

RedM has no menu key. Open the menu by typing `/easyadmin` or `/ea` in the chat.

## Ban Screen

When a banned player tries to connect, they see a custom ban screen. Configure the appearance:

| Convar | Default | Description |
|--------|---------|-------------|
| `ea_banMessageTitleColour` | `#354557` | Hex color for the server name title |
| `ea_banMessageServerName` | `sv_projectName` | Server name shown on the ban screen |
| `ea_banMessageShowStaff` | `true` | Show the name of the staff member who issued the ban |
| `ea_banMessageFooter` | `You can appeal this by ban by visiting our discord.` | Footer text with appeal instructions |
| `ea_banMessageSubHeader` | `You have been banned from this server.` | Subheader message |
| `ea_banMessageWatermark` | (embedded EasyAdmin logo) | URL to a logo image (transparent background recommended). Can also be a base64 data URI |

Example:

```
set ea_banMessageServerName "My Server"
set ea_banMessageFooter "Appeal on Discord: https://discord.gg/myserver"
set ea_banMessageWatermark "https://myserver.com/logo.png"
```

## Connection Deferral

When a player connects, EasyAdmin checks the ban list before allowing entry. This happens during the connection deferral period.

```
set ea_presentDeferral "true"
```

When `true`, a progress bar is shown during the banlist check. Set to `false` if using another deferral resource (e.g., adaptive cards) to avoid conflicts.

Default: `true`

## Startup Splash

Controls whether ASCII art with the version number is printed to the server console on startup.

```
set ea_enableSplash "true"
```

Default: `true`

## Minimum Identifier Matches

When banning a player, EasyAdmin checks if the player's identifiers match any identifier stored in the ban entry. This convar sets the minimum number of matching identifiers required to consider a player banned.

```
set ea_minIdentifierMatches 2
```

Increase this value by 1 for each proxy layer between the server and players. For example, if using a proxy that strips one identifier, set this to `3`.

Default: `2`

## See Also

- [Webhooks](../webhooks) — Set up Discord notifications
- [Commands](../commands) — Configure report and calladmin commands
- [Permissions](../../permissions) — Set up granular access control
- [NUI Settings](../nui-settings) — Font size, contrast, sidebar layout
