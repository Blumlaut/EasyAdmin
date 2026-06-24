# Permissions Overview

EasyAdmin uses FiveM's ACE (Access Control Entry) permission system. Permissions are granted using `add_ace` commands in `server.cfg`.

## How Permissions Work

Each permission can be assigned an `allow` value. Permissions not assigned are considered **denied**.

```
add_ace group.moderator easyadmin.player.kick allow
```

To grant all permissions to a group:

```
add_ace group.admin easyadmin allow
```

> **Warning:** Granting `easyadmin` (without a suffix) grants **all** permissions, including `easyadmin.immune`. This prevents other admins from kicking or banning the user. Only the server owner should have full admin access.

## Permission Categories

Permissions are organized into categories:

| Category | Prefix | Description |
|----------|--------|-------------|
| Player actions | `player.*` | Actions against players (kick, ban, mute, etc.) |
| Bot commands | `bot.*` | Discord bot command access |
| Server management | `server.*` | Server-level actions (cleanup, resources, convars) |
| Special | `immune`, `anon` | Special permissions (immunity, anonymity) |

The `easyadmin.` prefix is added automatically. When you see `easyadmin.player.kick` in documentation, the actual ACE entry is:

```
add_ace group.moderator easyadmin.player.kick allow
```

## Checking Permissions

### Server-side

```lua
DoesPlayerHavePermission(src, "player.kick")
```

### Client-side

```lua
DoesPlayerHavePermission(-1, "player.kick")
```

### Category check

```lua
DoesPlayerHavePermissionForCategory(-1, "player")
```

Checks if the player has any permission starting with `easyadmin.player.`

## Immunity

The `easyadmin.immune` permission prevents a player from being kicked or banned by other admins. This is granted automatically when `easyadmin` (all permissions) is assigned.

To grant immunity without other permissions:

```
add_ace identifier.steam:1100001018c7433 easyadmin.immune allow
```

## Anonymity

The `easyadmin.anon` permission allows an admin to hide their username in logs and webhook notifications. Toggle anonymity in the NUI Settings page.

## Group Structure Example

A typical permission setup uses groups to organize roles:

```cfg
# Admin group - full access
add_ace group.admin easyadmin allow

# Moderator group - limited access
add_ace group.moderator easyadmin.player.kick allow
add_ace group.moderator easyadmin.player.spectate allow
add_ace group.moderator easyadmin.player.teleport.single allow
add_ace group.moderator easyadmin.player.slap allow
add_ace group.moderator easyadmin.player.freeze allow
add_ace group.moderator easyadmin.player.ban.temporary allow
add_ace group.moderator easyadmin.player.ban.view allow
add_ace group.moderator easyadmin.player.warn allow
add_ace group.moderator easyadmin.player.reports.view allow
add_ace group.moderator easyadmin.player.reports.claim allow
add_ace group.moderator easyadmin.player.reports.process allow

# Assign players to groups
add_principal identifier.steam:1100001018c7433 group.admin
add_principal identifier.steam:2200002029d8544 group.moderator
```

## See Also

- [Player Permissions](player-permissions) — Detailed list of player action permissions
- [Server Permissions](server-permissions) — Detailed list of server management permissions
- [Bot Permissions](bot-permissions) — Discord bot command permissions
- [Installation](../install) — Set up admin access during installation
- [Discord ACE](../discord/discord-ace) — Map Discord roles to ACE permissions
