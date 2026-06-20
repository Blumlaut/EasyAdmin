# Permission Reference

Complete reference of all EasyAdmin permissions, sorted alphabetically. The `easyadmin.` prefix is added automatically.

## Bot Permissions

| Permission | Description |
|------------|-------------|
| `easyadmin.bot.history` | Use the `/history` bot command |
| `easyadmin.bot.notes` | Use the `/notes` bot command |

## Player Permissions

| Permission | Description |
|------------|-------------|
| `easyadmin.player.actionhistory.add` | Add entries to a player's action history |
| `easyadmin.player.actionhistory.delete` | Delete entries from a player's action history |
| `easyadmin.player.actionhistory.view` | View a player's action history |
| `easyadmin.player.adminnotes.add` | Add admin notes to a player |
| `easyadmin.player.adminnotes.delete` | Delete admin notes from a player |
| `easyadmin.player.adminnotes.view` | View admin notes on a player |
| `easyadmin.player.aliases.add` | Add aliases to a player |
| `easyadmin.player.aliases.delete` | Delete aliases from a player |
| `easyadmin.player.allowlist` | Join the server when allowlist is enabled |
| `easyadmin.player.ban.edit` | Edit ban entries |
| `easyadmin.player.ban.permanent` | Permanently ban players |
| `easyadmin.player.ban.remove` | Unban players |
| `easyadmin.player.ban.temporary` | Temporarily ban players |
| `easyadmin.player.ban.view` | View the ban list |
| `easyadmin.player.bucket.force` | Force a player into a different routing bucket |
| `easyadmin.player.bucket.join` | Join another player's routing bucket |
| `easyadmin.player.freeze` | Freeze or unfreeze players |
| `easyadmin.player.kick` | Kick players |
| `easyadmin.player.mute` | Mute or unmute players |
| `easyadmin.player.namehistory.view` | View a player's name history |
| `easyadmin.player.reports.claim` | Claim unclaimed reports |
| `easyadmin.player.reports.process` | Delete/close reports |
| `easyadmin.player.reports.view` | View player reports |
| `easyadmin.player.slap` | Slap players |
| `easyadmin.player.spectate` | Spectate players |
| `easyadmin.player.screenshot` | Take screenshots of players |
| `easyadmin.player.teleport.everyone` | Teleport all players |
| `easyadmin.player.teleport.single` | Teleport to/from a single player |
| `easyadmin.player.warn` | Issue warnings to players |

## Server Permissions

| Permission | Description |
|------------|-------------|
| `easyadmin.server.announce` | Send announcements to all players |
| `easyadmin.server.chat` | Use the admin-only chat channel |
| `easyadmin.server.cleanup.cars` | Clean up vehicles |
| `easyadmin.server.cleanup.peds` | Clean up NPCs |
| `easyadmin.server.cleanup.props` | Clean up props |
| `easyadmin.server.convars` | Edit server convars |
| `easyadmin.server.network.monitor` | Access the Network Monitor page |
| `easyadmin.server.permissions.read` | View ACE permissions |
| `easyadmin.server.permissions.write` | Edit ACE permissions |
| `easyadmin.server.reminder.add` | Add reminders (non-persistent) |
| `easyadmin.server.resources.monitor` | Access the Profiler page |
| `easyadmin.server.resources.start` | Start server resources |
| `easyadmin.server.resources.stop` | Stop server resources |
| `easyadmin.server.shortcut.add` | Add shortcuts (non-persistent) |
| `easyadmin.server.statistics.view` | Access the Player Statistics page |

## Special Permissions

| Permission | Description |
|------------|-------------|
| `easyadmin.anon` | Hide admin username in logs and actions |
| `easyadmin.immune` | Prevent being kicked or banned by other admins |

## See Also

- [Permissions Overview](permissions/index.md) — How permissions work, group structure
- [Player Permissions](permissions/player-permissions.md) — Detailed player action permissions
- [Server Permissions](permissions/server-permissions.md) — Detailed server management permissions
- [Bot Permissions](permissions/bot-permissions.md) — Discord bot command permissions
- [Discord ACE](discord/discord-ace.md) — Map Discord roles to ACE permissions
