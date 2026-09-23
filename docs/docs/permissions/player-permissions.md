# Player Permissions

These permissions control the actions your staff can perform against players on your server.

An admin needs at least one `easyadmin.player.*` permission before the player list and player details are shown at all. Without one, the menu opens with an empty player list.

## How to Grant

Add permissions to a group in your `server.cfg`:

```cfg
add_ace group.moderator easyadmin.player.kick allow
```

You can also grant a whole group of permissions at once by leaving off the last part of the name:

```cfg
# Grants every easyadmin.player.* permission
add_ace group.moderator easyadmin.player allow
```

This shortcut also grants powerful permissions such as `easyadmin.player.ban.permanent`, `easyadmin.player.ban.edit`, `easyadmin.player.ban.remove`, `easyadmin.player.teleport.everyone` and `easyadmin.player.bucket.force`. List permissions one by one if you want a more limited role.

## Ban Management

| Permission | What It Does |
|------------|-------------|
| `easyadmin.player.ban.temporary` | Ban players for a set time |
| `easyadmin.player.ban.permanent` | Ban players permanently |
| `easyadmin.player.ban.view` | View the ban list |
| `easyadmin.player.ban.edit` | Edit ban entries (reason, name, banner, expiry and identifiers) |
| `easyadmin.player.ban.remove` | Unban players |

`easyadmin.player.ban.view` is also required before staff can open the ban list page.

## Player Actions

| Permission | What It Does |
|------------|-------------|
| `easyadmin.player.kick` | Kick players from the server |
| `easyadmin.player.spectate` | Spectate (follow) players |
| `easyadmin.player.teleport.single` | Teleport yourself to a player, or bring a player to you |
| `easyadmin.player.teleport.everyone` | Teleport all players to you (also needs `easyadmin.player.teleport.single`) |
| `easyadmin.player.slap` | Slap players (remove health) |
| `easyadmin.player.freeze` | Freeze or unfreeze players in place |
| `easyadmin.player.mute` | Mute or unmute players in chat and voice |
| `easyadmin.player.warn` | Warn players |
| `easyadmin.player.screenshot` | Take screenshots of a player's screen, and watch their screen live |

## Routing Buckets

| Permission | What It Does |
|------------|-------------|
| `easyadmin.player.bucket.join` | Move yourself into another player's routing bucket |
| `easyadmin.player.bucket.force` | Move a player into your own routing bucket |

Routing buckets control which players can see each other in OneSync. These permissions allow admins to manage bucket assignments for spectating or other purposes.

## Reports

| Permission | What It Does |
|------------|-------------|
| `easyadmin.player.reports.view` | View player reports |
| `easyadmin.player.reports.claim` | Claim unclaimed reports |
| `easyadmin.player.reports.process` | Close reports |

## Action History

| Permission | What It Does |
|------------|-------------|
| `easyadmin.player.actionhistory.view` | View a player's action history |
| `easyadmin.player.actionhistory.add` | Not used yet — has no effect |
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

## Allowlist

| Permission | What It Does |
|------------|-------------|
| `easyadmin.player.allowlist` | Let a player join while the server allowlist is enabled |
