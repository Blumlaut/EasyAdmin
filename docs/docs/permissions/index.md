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

> **Warning:** Granting `easyadmin` (without a suffix) also grants `easyadmin.immune`, which prevents other admins from kicking or banning that user. Reserve full access for the server owner only.

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
- You can grant permissions to **groups** (recommended) or directly to **identifiers**.
- Groups let you manage permissions in one place and assign multiple players at once.

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

## Permission Categories

Permissions are grouped by what they control. Browse the sub-pages to see what each permission does and pick the ones you need:

| Category | What It Controls |
|----------|-----------------|
| [Player Permissions](player-permissions) | Kicking, banning, muting, spectating, and other actions against players |
| [Server Permissions](server-permissions) | Server management: resources, announcements, cleanup, statistics |
| [Bot Permissions](bot-permissions) | Discord bot commands for remote management |

## Special Permissions

### Immunity

The `easyadmin.immune` permission prevents a player from being kicked or banned by other admins. It is granted automatically when you give someone full `easyadmin` access.

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
- [Permission Reference](../../reference/permission-reference) — Complete alphabetical listing of all permissions
