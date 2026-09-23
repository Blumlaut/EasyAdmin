# Server Permissions

These permissions control server-level management actions.

## How to Grant

Add the permission to a group in your `server.cfg`:

```cfg
add_ace group.admin easyadmin.server.announce allow
```

Or grant a whole category at once:

```cfg
# Grants all server.* permissions
add_ace group.admin easyadmin.server allow
```

## Entity Cleanup

| Permission | What It Does |
|------------|-------------|
| `easyadmin.server.cleanup.cars` | Remove vehicles that no player is driving |
| `easyadmin.server.cleanup.props` | Remove props (objects) |
| `easyadmin.server.cleanup.peds` | Remove NPCs (peds) |

Cleanup removes the matching entities from the world, either server-wide or within a radius around you. Players themselves are never removed. EasyAdmin already requires OneSync, which cleanup relies on.

Use with caution on populated servers.

## Resource Management

| Permission | What It Does |
|------------|-------------|
| `easyadmin.server.resources.start` | Start resources |
| `easyadmin.server.resources.stop` | Stop resources |
| `easyadmin.server.resources.monitor` | Open the Profiler page and see CPU and memory use per resource |

## Server Administration

| Permission | What It Does |
|------------|-------------|
| `easyadmin.server.announce` | Send an announcement to all players |
| `easyadmin.server.convars` | View and change server settings from the Server page |
| `easyadmin.server.chat` | Use the admin-only chat channel |
| `easyadmin.server.mute.global` | Turn Emergency Mode (server-wide chat mute) on or off, and keep chatting while it is active |

The admin chat channel comes from the `chat` resource. It only works when that resource is running and `ea_enableChat` is `true` (the default). See [Chat Bridge](../../discord/chat-bridge).

## Shortcuts and Reminders

| Permission | What It Does |
|------------|-------------|
| `easyadmin.server.shortcut.add` | Add a reason shortcut with `/ea_addShortcut` (not saved across restarts) |
| `easyadmin.server.reminder.add` | Add a periodic chat reminder with `/ea_addReminder` (not saved across restarts) |

## Statistics and Monitoring

| Permission | What It Does |
|------------|-------------|
| `easyadmin.server.statistics.view` | Open the Player Statistics page |
| `easyadmin.server.network.monitor` | Open the Network Monitor page |
| `easyadmin.server.map.view` | Open the live Map page |

## Special Permissions

| Permission | What It Does |
|------------|-------------|
| `easyadmin.immune` | Other admins cannot kick, ban, warn, mute, freeze, slap, teleport, watch your screen or move you to another bucket |
| `easyadmin.anon` | Show your actions as "Anonymous Admin" instead of your name |

Immunity is not absolute: while `ea_dangerousDevMode` is enabled, admins can act on immune players. That setting is for development only — never turn it on for a live server.

## New in 8.0

These permissions did not exist in 7.x, so ACE entries copied from an older setup will not include them:

- `easyadmin.server.statistics.view`
- `easyadmin.server.map.view`
- `easyadmin.server.resources.monitor`
- `easyadmin.server.network.monitor`
- `easyadmin.server.mute.global`
