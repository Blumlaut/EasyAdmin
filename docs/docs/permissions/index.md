# Setting Up Admin Roles

EasyAdmin uses FiveM's ACE permission system to control who can do what. This guide walks you through creating roles and assigning permissions to your staff.

## Quick Start: Grant Full Admin Access

The fastest way to make someone an admin is to grant them all permissions:

```cfg
# Grant all EasyAdmin permissions to a group
add_ace group.admin easyadmin allow

# Assign a player to the group
add_principal identifier.steam:1100001018c7433 group.admin
```

Replace the identifier with your own (see [Installation](../install#adding-an-admin) for how to find it).

> **Warning:** Granting `easyadmin` (without a suffix) grants everything below it: every EasyAdmin permission, including `easyadmin.immune` and any permissions added by future updates. Reserve full access for the server owner only.

## Creating a Moderator Role

Most servers need a moderator role with limited permissions. Here is a ready-to-use template:

```cfg
# Moderator group — player management only
add_ace group.moderator easyadmin.player.kick allow
add_ace group.moderator easyadmin.player.spectate allow
add_ace group.moderator easyadmin.player.freeze allow
add_ace group.moderator easyadmin.player.mute allow
add_ace group.moderator easyadmin.player.ban.temporary allow
add_ace group.moderator easyadmin.player.ban.view allow
add_ace group.moderator easyadmin.player.warn allow
add_ace group.moderator easyadmin.player.reports.view allow
add_ace group.moderator easyadmin.player.reports.claim allow
add_ace group.moderator easyadmin.player.reports.process allow

# Assign moderators
add_principal identifier.steam:2200002029d8544 group.moderator
```

Copy this into your `server.cfg` and replace the identifiers with your moderators' identifiers.

## How Permissions Work

- Permissions are granted with `add_ace` in your `server.cfg`.
- Each permission must be explicitly allowed — anything not granted is denied.
- Granting a parent also grants everything below it, so `easyadmin.player` covers `easyadmin.player.kick` and so on.
- You can grant permissions to **groups** (recommended) or directly to **identifiers**.
- Groups let you manage permissions in one place and assign multiple players at once.
- Plugins can add their own permissions. Grant them the same way, using the name the plugin documents — see [Custom Permissions](../plugins/custom-permissions).

### Granting to a Group

```cfg
# Define what the group can do
add_ace group.moderator easyadmin.player.kick allow

# Add players to the group
add_principal identifier.steam:1100001018c7433 group.moderator
```

### Granting Directly to a Player

```cfg
add_ace identifier.steam:1100001018c7433 easyadmin.player.kick allow
```

This works but is harder to manage when you have many staff members. Groups are recommended.

### Refreshing Permission Changes

Changes apply to admin actions straight away, but the menu loads its own copy of an admin's permissions when it opens. An admin who is already connected will not see a new page or button until they refresh that copy: open the menu, go to **Settings**, and click **Refresh permissions** in the **Data** section. Someone who has never been an admin before picks up their new permissions the next time they open the menu.

## Permission Categories

Permissions are grouped by what they control. Browse the sub-pages to see what each permission does and pick the ones you need:

| Category | What It Controls |
|----------|-----------------|
| [Player Permissions](player-permissions) | Actions against players: kicking, banning, muting, spectating, teleporting, warning, action history and notes |
| [Server Permissions](server-permissions) | Server management: resources, announcements, cleanup, statistics, monitoring and chat |
| [Bot Permissions](bot-permissions) | Discord bot commands for remote management |

## New in EasyAdmin 8

If you are coming from EasyAdmin 7, these permission groups are new. Grant them to your existing admin groups where needed:

| Permission | What It Adds |
|------------|--------------|
| `easyadmin.player.actionhistory.*` | A record of bans, kicks and warnings for each player — see [Action History](../features/action-history) |
| `easyadmin.player.adminnotes.*` | Private staff notes on a player — see [Admin Notes](../features/admin-notes) |
| `easyadmin.player.namehistory.view` | The names a player has used |
| `easyadmin.server.statistics.view` | Player and server statistics — see [Player Statistics](../features/player-statistics) |
| `easyadmin.server.map.view` | Live player positions on the map — see [Map](../features/map) |
| `easyadmin.server.network.monitor` | Player ping, jitter and packet loss — see [Network Monitor](../features/network-monitor) |
| `easyadmin.server.resources.monitor` | CPU and memory use per resource in the Profiler — see [Profiler](../features/profiler) |
| `easyadmin.server.mute.global` | Emergency Mode: mute all player chat server-wide |
| `easyadmin.bot.history`, `easyadmin.bot.notes` | Action history and notes from Discord — see [Bot Permissions](bot-permissions) |

## Special Permissions

### Immunity

The `easyadmin.immune` permission stops other admins from taking moderation action against that player. Immune players cannot be kicked, banned, warned, slapped, frozen, muted, teleported, screenshotted, force-moved into another routing bucket, or watched through the live stream viewer. The admin attempting the action is told that the target is immune.

It is granted automatically when you give someone full `easyadmin` access, and it is applied when a player joins the server — a player who is already connected must reconnect after you grant or remove it.

If you run your server with `ea_dangerousDevMode` enabled, admins can ignore immunity and act on themselves. Only enable that on a test server, never in production.

To grant immunity without other permissions:

```cfg
add_ace identifier.steam:1100001018c7433 easyadmin.immune allow
```

### Anonymity

The `easyadmin.anon` permission lets an admin hide their username in logs and webhook notifications. It can be toggled on/off from the NUI Settings page.

```cfg
add_ace group.admin easyadmin.anon allow
```

## Discord Role Mapping

You can map Discord roles to FiveM permissions so staff get access automatically when they join the server. See [Discord ACE](../discord/discord-ace) for details.

## See Also

- [Player Permissions](player-permissions) — Detailed list of player action permissions
- [Server Permissions](server-permissions) — Detailed list of server management permissions
- [Bot Permissions](bot-permissions) — Discord bot command permissions
- [Installation](../install) — Set up admin access during installation
- [Discord ACE](../discord/discord-ace) — Map Discord roles to ACE permissions
- [Permission Reference](../reference/permission-reference) — Complete alphabetical listing of all permissions
