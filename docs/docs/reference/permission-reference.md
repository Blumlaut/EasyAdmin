# Permission Reference

Every EasyAdmin permission, grouped by category. For guidance on setting up roles, see [Setting Up Admin Roles](../../permissions).

## Bot

These permissions control the Discord bot's slash commands. Granting `easyadmin.bot` grants all of them.

| Permission | What It Does |
|------------|-------------|
| `easyadmin.bot.announce` | Use the `/announce` bot command |
| `easyadmin.bot.ban` | Use the `/ban` bot command |
| `easyadmin.bot.baninfo` | Use the `/baninfo` bot command |
| `easyadmin.bot.cleanup` | Use the `/cleanup` bot command |
| `easyadmin.bot.freeze` | Use the `/freeze` bot command |
| `easyadmin.bot.history` | Use the `/history` bot command |
| `easyadmin.bot.kick` | Use the `/kick` bot command |
| `easyadmin.bot.mute` | Use the `/mute` bot command |
| `easyadmin.bot.notes` | Use the `/notes` bot command |
| `easyadmin.bot.playerinfo` | Use the `/playerinfo` bot command |
| `easyadmin.bot.playerlist` | Use the `/playerlist` bot command |
| `easyadmin.bot.refreshperms` | Use `/refreshperms` on another user |
| `easyadmin.bot.screenshot` | Use the `/screenshot` bot command |
| `easyadmin.bot.slap` | Use the `/slap` bot command |
| `easyadmin.bot.unban` | Use the `/unban` bot command |
| `easyadmin.bot.unfreeze` | Use the `/unfreeze` bot command |
| `easyadmin.bot.unmute` | Use the `/unmute` bot command |
| `easyadmin.bot.warn` | Use the `/warn` bot command |

`/ban` also needs `easyadmin.player.ban.temporary` for a timed ban or `easyadmin.player.ban.permanent` for a permanent ban. `/refreshperms` with no user option needs no permission.

## Player

| Permission | What It Does |
|------------|-------------|
| `easyadmin.player.actionhistory.add` | Not used yet — has no effect |
| `easyadmin.player.actionhistory.delete` | Delete entries from a player's action history |
| `easyadmin.player.actionhistory.view` | View a player's action history |
| `easyadmin.player.adminnotes.add` | Add admin notes to a player |
| `easyadmin.player.adminnotes.delete` | Delete admin notes from a player |
| `easyadmin.player.adminnotes.view` | View admin notes on a player |
| `easyadmin.player.allowlist` | Join the server while the allowlist is enabled |
| `easyadmin.player.ban.edit` | Edit ban entries |
| `easyadmin.player.ban.permanent` | Ban players permanently |
| `easyadmin.player.ban.remove` | Unban players |
| `easyadmin.player.ban.temporary` | Ban players for a set time |
| `easyadmin.player.ban.view` | View the ban list |
| `easyadmin.player.bucket.force` | Move a player into your own routing bucket |
| `easyadmin.player.bucket.join` | Move yourself into another player's routing bucket |
| `easyadmin.player.freeze` | Freeze or unfreeze players in place |
| `easyadmin.player.kick` | Kick players |
| `easyadmin.player.mute` | Mute or unmute players |
| `easyadmin.player.namehistory.view` | View the names a player has used |
| `easyadmin.player.reports.claim` | Claim unclaimed reports |
| `easyadmin.player.reports.process` | Close reports |
| `easyadmin.player.reports.view` | View player reports |
| `easyadmin.player.screenshot` | Take screenshots of a player, and watch their screen live |
| `easyadmin.player.slap` | Slap players |
| `easyadmin.player.spectate` | Spectate players |
| `easyadmin.player.teleport.everyone` | Teleport all players to you (also needs `easyadmin.player.teleport.single`) |
| `easyadmin.player.teleport.single` | Teleport to a player, or bring a player to you |
| `easyadmin.player.warn` | Warn players |

## Server

| Permission | What It Does |
|------------|-------------|
| `easyadmin.server.announce` | Send an announcement to all players |
| `easyadmin.server.chat` | Use the admin-only chat channel |
| `easyadmin.server.cleanup.cars` | Remove vehicles no player is driving |
| `easyadmin.server.cleanup.peds` | Remove NPCs |
| `easyadmin.server.cleanup.props` | Remove props |
| `easyadmin.server.convars` | View and change server settings |
| `easyadmin.server.map.view` | Open the Map page |
| `easyadmin.server.mute.global` | Turn Emergency Mode (server-wide chat mute) on or off, and keep chatting while it is active |
| `easyadmin.server.network.monitor` | Open the Network Monitor page |
| `easyadmin.server.reminder.add` | Add a reminder with `/ea_addReminder` (not saved across restarts) |
| `easyadmin.server.resources.monitor` | Open the Profiler page |
| `easyadmin.server.resources.start` | Start server resources |
| `easyadmin.server.resources.stop` | Stop server resources |
| `easyadmin.server.shortcut.add` | Add a reason shortcut with `/ea_addShortcut` (not saved across restarts) |
| `easyadmin.server.statistics.view` | Open the Player Statistics page |

## Special

| Permission | What It Does |
|------------|-------------|
| `easyadmin.anon` | Show your actions as "Anonymous Admin" instead of your name |
| `easyadmin.immune` | Other admins cannot kick, ban, warn, mute, freeze, slap, teleport or watch you |
