# Player Permissions

These permissions control actions that can be performed against players on your server.

## How to Grant

Add the permission to a group in your `server.cfg`:

```cfg
add_ace group.moderator easyadmin.player.kick allow
```

Or grant a whole category at once with a wildcard:

```cfg
# Grants all player.* permissions
add_ace group.moderator easyadmin.player allow
```

## Ban Management

| Permission | What It Does |
|------------|-------------|
| `easyadmin.player.ban.temporary` | Temporarily ban players |
| `easyadmin.player.ban.permanent` | Permanently ban players |
| `easyadmin.player.ban.view` | View the ban list |
| `easyadmin.player.ban.edit` | Edit ban entries (reason, identifiers) |
| `easyadmin.player.ban.remove` | Unban players |

Granting `easyadmin.player.ban.view` is required for moderators to access the ban list page.

## Player Actions

| Permission | What It Does |
|------------|-------------|
| `easyadmin.player.kick` | Kick players from the server |
| `easyadmin.player.spectate` | Spectate (follow) players |
| `easyadmin.player.teleport.single` | Teleport to or from a single player |
| `easyadmin.player.teleport.everyone` | Teleport all players at once |
| `easyadmin.player.slap` | Slap players (remove health) |
| `easyadmin.player.freeze` | Freeze or unfreeze players in place |
| `easyadmin.player.mute` | Mute or unmute players in chat |
| `easyadmin.player.warn` | Issue warnings to players |
| `easyadmin.player.screenshot` | Take screenshots of player screens |

## Routing Buckets

| Permission | What It Does |
|------------|-------------|
| `easyadmin.player.bucket.join` | Join another player's routing bucket |
| `easyadmin.player.bucket.force` | Force a player into a different routing bucket |

Routing buckets control which players can see each other in OneSync. These permissions allow admins to manage bucket assignments for spectating or other purposes.

## Reports

| Permission | What It Does |
|------------|-------------|
| `easyadmin.player.reports.view` | View player reports |
| `easyadmin.player.reports.claim` | Claim unclaimed reports |
| `easyadmin.player.reports.process` | Delete/close reports |

## Action History

| Permission | What It Does |
|------------|-------------|
| `easyadmin.player.actionhistory.view` | View a player's action history |
| `easyadmin.player.actionhistory.add` | Add entries to a player's action history |
| `easyadmin.player.actionhistory.delete` | Delete entries from a player's action history |

## Admin Notes

| Permission | What It Does |
|------------|-------------|
| `easyadmin.player.adminnotes.view` | View admin notes on a player |
| `easyadmin.player.adminnotes.add` | Add admin notes to a player |
| `easyadmin.player.adminnotes.delete` | Delete admin notes from a player |

## Name History

| Permission | What It Does |
|------------|-------------|
| `easyadmin.player.namehistory.view` | View a player's name history |

## Aliases

| Permission | What It Does |
|------------|-------------|
| `easyadmin.player.aliases.add` | Add aliases to a player |
| `easyadmin.player.aliases.delete` | Delete aliases from a player |

## Allowlist

| Permission | What It Does |
|------------|-------------|
| `easyadmin.player.allowlist` | Allow joining the server when allowlist is enabled |
