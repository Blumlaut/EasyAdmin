# Updating EasyAdmin

## General Update Process

1. Stop your server.
2. Download the latest release from [GitHub](https://github.com/Blumlaut/EasyAdmin/releases/latest).
3. Delete any files/folders listed below for your target version.
4. Replace the EasyAdmin folder in your `resources/` directory with the new version.
5. Start your server.

## Breaking Changes

### Plugin API Changes

When the Plugin API changes between major versions, existing plugins may need updates. Check the [Plugin API](plugins/plugin-api) documentation for the latest API reference.

### Discord Bot

The Discord bot is bundled with EasyAdmin. After updating, restart your server to load the latest bot version. No manual steps are required.

### NUI Rewrite

EasyAdmin uses a React-based NUI. After updating, the NUI files in `nui/dist/` are replaced automatically with the release. No manual rebuild is needed.

## Previous Version Notes

### Version 7.53

**This is a major structural refactor.** Many files have been reorganised into subdirectories and the bot has been converted from JavaScript to TypeScript.

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

### Version 7.53

- The old NativeUI plugin system (`addPlugin`, `plugins/` directory) has been **removed**. The `plugins/` folder is no longer loaded.
- A new **runtime NUI plugin system** has been added. External resources register via `exports['easyadmin']:RegisterPlugin(config)` and provide schema trees rendered by EasyAdmin's built-in components. See [Plugins](plugins/index).

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

- [Troubleshooting](troubleshooting) — Issues that may arise after updating
- [NUI Known Issues](nui/known-issues) — CEF rendering limitations
- [Plugin API](plugins/plugin-api) — Plugin compatibility after updates
