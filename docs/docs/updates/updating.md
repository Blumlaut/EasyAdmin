# Updating EasyAdmin

## General Update Process

1. Stop your server.
2. Back up `banlist.json` and the `data` folder — they hold your ban list, action history, admin notes and statistics.
3. Download the release zip:
   - **Latest**: [GitHub Releases](https://github.com/Blumlaut/EasyAdmin/releases/latest)
   - **Specific version**: `https://github.com/Blumlaut/EasyAdmin/releases/download/{version}/EasyAdmin-{version}.zip`
     (e.g. `https://github.com/Blumlaut/EasyAdmin/releases/download/8.0a1/EasyAdmin-8.0a1.zip`)
4. Delete any files/folders listed below for your target version.
5. Replace the EasyAdmin folder in your `resources/` directory with the new version.
6. Start your server.

## Breaking Changes

### Plugin API Changes

When the Plugin API changes between major versions, existing plugins may need updates. Check the [Plugin API](../../plugins/plugin-api) documentation for the latest API reference. Version 8.0 replaced the plugin system completely — see below.

### Discord Bot

The Discord bot is bundled with EasyAdmin. After updating, restart your server to load the latest bot version. No manual steps are required.

### NUI Rewrite

EasyAdmin uses a React-based NUI. After updating, the NUI files in `nui/dist/` are replaced automatically with the release. No manual rebuild is needed.

## Version History

### Version 8.0

**This is a major release with extensive changes over 7.53.** The resource was reorganised into new folders, the Discord bot was rewritten in TypeScript, and the plugin system was replaced.

Before updating, **delete the following folders entirely** from your EasyAdmin installation:

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

> **Do NOT delete** `banlist.json` or the `data` folder — they hold your ban list, action history, admin notes and statistics. Old `actions.json` and `notes.json` files in the resource root are imported automatically the first time you start 8.0, so keep those too.

#### New Plugin System

- The old plugin system (the `plugins` folder) has been removed. Plugins written for 7.x stop working until they are updated.
- Plugins are now separate resources that register themselves at runtime with `exports.EasyAdmin:RegisterPlugin(config)`. See [Plugins](../../plugins) for how to write one, and `examples/ea-plugin-demo` in the download for a working example.

#### Screenshots and Streaming

Screenshots and live player streaming are built into EasyAdmin, so `screenshot-basic` is no longer needed. Your upload settings (`ea_screenshoturl`, `ea_screenshotfield`) work as before.

#### Filesystem Permission (GTA V Enhanced)

If you are running **GTA V Enhanced**, add the following line to your `server.cfg` for EasyAdmin to function properly:

```
add_filesystem_permission EasyAdmin write EasyAdmin
```

This grants the resource permission to read and write its own data files.

#### New Permissions (8.0)

8.0 adds 14 permissions. Grant the ones your staff need, for example:

```
add_ace group.moderator easyadmin.server.map.view allow
```

| Permission | Description |
|---|---|
| `easyadmin.player.actionhistory.view` | View player action history |
| `easyadmin.player.actionhistory.add` | Add entries to action history |
| `easyadmin.player.actionhistory.delete` | Delete action history entries |
| `easyadmin.player.adminnotes.view` | View admin notes on players |
| `easyadmin.player.adminnotes.add` | Add admin notes to players |
| `easyadmin.player.adminnotes.delete` | Delete admin notes |
| `easyadmin.player.namehistory.view` | View player name history |
| `easyadmin.bot.history` | View Discord bot action history |
| `easyadmin.bot.notes` | Manage notes via Discord bot |
| `easyadmin.server.statistics.view` | View server statistics |
| `easyadmin.server.map.view` | View the live server map |
| `easyadmin.server.resources.monitor` | Monitor resource status |
| `easyadmin.server.network.monitor` | Monitor network state |
| `easyadmin.server.mute.global` | Mute the global chat |

Admins with full `easyadmin` access already have all of these. See the [Permission Reference](../../reference/permission-reference) for the complete list.

#### Changed Options (8.0)

- `ea_screenshotOptions` and `ea_alwaysShowButtons` no longer exist. Remove them from your `server.cfg`. Screenshot sizing is now handled by `ea_screenshotMaxResolution` and `ea_screenshotQuality`.
- Screenshots: `ea_screenshotMaxResolution` (`1280`), `ea_screenshotQuality` (`0.8`)
- Live streaming: `ea_streamMaxResolution` (`640`), `ea_streamTargetFps` (`8`), `ea_streamStunServers`, `ea_streamTurnServers`, `ea_streamTurnUser`, `ea_streamTurnPassword`
- Action history: `ea_enableActionHistory` (`true`), `ea_actionHistoryExpiry` (`120` days)
- Admin notes: `ea_enableAdminNotes` (`true`)
- Developer tools: `ea_dangerousDevMode` (`false`), `ea_profilerEndpoint`

Defaults are shown in brackets. See the [Convar Reference](../../reference/convar-reference) for details.

### Version 7.5

- The Permission Editor was removed after a FiveM security change. Manage admin access with ACE permissions in `server.cfg` instead.

### Version 7.4

- Major structural changes. The Discord bot was rewritten and dependencies are now bundled. Delete `server/bot/` and `package.json` from your installation before updating.
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
