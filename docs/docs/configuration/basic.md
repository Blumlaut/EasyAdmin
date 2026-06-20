# Basic Configuration

These convars control core behavior: language, ban screen appearance, keybinds, and connection deferral.

## Language

Sets the UI language for EasyAdmin. Language files are stored in the `language/` directory.

```
setr ea_LanguageName "en"
```

Available languages: `de` (German), `en` (English), `es` (Spanish), `fr` (French), `it` (Italian), `nl` (Dutch), `pl` (Polish).

Default: `en`

Use `setr` so the language persists client-side.

## Menu Keybind

### FiveM

On FiveM, the menu key is set through the FiveM settings UI. Press F1 in-game, go to Key Bindings, find "Open EasyAdmin", and assign a key. The `/easyadmin` or `/ea` chat commands always work as a fallback.

### RedM

On RedM, set the key in your `server.cfg`:

```
setr ea_defaultKey "F2"
```

Use a standard GTA V key name such as `F2`, `K`, or `LCTRL`. If not set, the menu can only be opened via the `/easyadmin` command.

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
