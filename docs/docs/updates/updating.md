# Updating EasyAdmin

## General Update Process

1. Stop your server.
2. Download the release zip:
   - **Latest**: [GitHub Releases](https://github.com/Blumlaut/EasyAdmin/releases/latest)
   - **Specific version**: `https://github.com/Blumlaut/EasyAdmin/releases/download/{version}/EasyAdmin-{version}.zip`
     (e.g. `https://github.com/Blumlaut/EasyAdmin/releases/download/8.0a1/EasyAdmin-8.0a1.zip`)
3. Delete any files/folders listed below for your target version.
4. Replace the EasyAdmin folder in your `resources/` directory with the new version.
5. Start your server.

## Breaking Changes

### Plugin API Changes

When the Plugin API changes between major versions, existing plugins may need updates. Check the [Plugin API](../../plugins/plugin-api) documentation for the latest API reference.

### Discord Bot

The Discord bot is bundled with EasyAdmin. After updating, restart your server to load the latest bot version. No manual steps are required.

### NUI Rewrite

EasyAdmin uses a React-based NUI. After updating, the NUI files in `nui/dist/` are replaced automatically with the release. No manual rebuild is needed.

## Version History

### Version 8.0

**This is a major release with extensive changes over 7.53.** Before updating, **delete the following folders entirely** from your EasyAdmin installation:

```
client/
dependencies/
dist/
docs/
plugins/
server/
shared/
src/
```

> **Do NOT delete** `banlist.json` — your ban list will be preserved.

#### New Permissions (8.0)

After updating, you may need to grant the following new permissions to your admin groups via ACL:

| Permission | Description |
|---|---|
| `player.actionhistory.view` | View player action history |
| `player.actionhistory.add` | Add entries to action history |
| `player.actionhistory.delete` | Delete action history entries |
| `player.adminnotes.view` | View admin notes on players |
| `player.adminnotes.add` | Add admin notes to players |
| `player.adminnotes.delete` | Delete admin notes |
| `player.namehistory.view` | View player name history |
| `bot.history` | View Discord bot action history |
| `bot.notes` | Manage notes via Discord bot |
| `server.statistics.view` | View server statistics |
| `server.resources.monitor` | Monitor resource status |
| `server.network.monitor` | Monitor network state |
| `server.mute.global` | Mute the global chat |

### Version 7.53

**Major structural refactor.** Many files were reorganised into subdirectories and the bot was converted from JavaScript to TypeScript.

Before updating, **delete the following folders entirely** from your EasyAdmin installation:

```
src/
dist/
client/
server/
nui/src/
dependencies/
language/
```

> **Do NOT delete** `banlist.json` or `data/` — these contain your ban list and server data (actions, notes, statistics).

- The old NativeUI plugin system (`addPlugin`, `plugins/` directory) has been **removed**. The `plugins/` folder is no longer loaded.
- A new **runtime NUI plugin system** has been added. External resources register via `exports['easyadmin']:RegisterPlugin(config)` and provide schema trees rendered by EasyAdmin's built-in components. See [Plugins](../../plugins).

### Version 7.52

- The client-local `DoesPlayerHavePermission` in `client/admin_client.lua` was removed. The function is available from `shared/util_shared.lua` on both client and server. Plugins relying on the old location should use the shared version.

### Version 7.5

- The Permission Editor was removed due to a FiveM security change. If upgrading from before 7.5, delete the `bot/` folder before installing the new version.

### Version 7.4

- Major structural changes. The Discord bot system was rewritten and dependencies are now bundled. Delete `server/bot/` and `package.json` from your installation before updating.
- FiveM server build 12913+ is required.
- OneSync Infinity is required.

### Version 7.3

- The v1 Plugin API was removed. Plugins using the v1 API must be updated.
- EasyAdmin no longer automatically assigns `add_ace resource.EasyAdmin command allow` to `server.cfg`. Add this line manually if missing.

## Migration Guides

For detailed migration instructions from older versions, see the [GitHub Releases page](https://github.com/Blumlaut/EasyAdmin/releases). Each release notes contain breaking changes and migration steps.

## See Also

- [Troubleshooting](../../troubleshooting) — Issues that may arise after updating
- [NUI Known Issues](../../nui/known-issues) — CEF rendering limitations
- [Plugin API](../../plugins/plugin-api) — Plugin compatibility after updates
