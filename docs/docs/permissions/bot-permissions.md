# Bot Permissions

Bot permissions control which Discord users can run EasyAdmin's bot commands. They use the same ACE system as in-game permissions — grant them with `add_ace` in your `server.cfg`.

## How It Works

When a member joins your Discord server, or when their roles change, EasyAdmin syncs their Discord roles to FiveM. Every role the member has becomes usable as a `role:<role id>` principal, so permissions you grant to a role apply to everyone who holds it.

Because roles are synced rather than read live, a newly granted permission can take a moment to apply. Ask the member to run `/refreshperms` in Discord, then try again.

Discord users are matched by their Discord ID, so always use the `identifier.discord:` form.

## How to Grant

Grant to a specific Discord user:

```cfg
add_ace identifier.discord:123456789012345678 easyadmin.bot.history allow
```

Grant to a Discord role:

```cfg
add_ace role:604749064436711444 easyadmin.bot.history allow
```

Grant all bot commands to a group:

```cfg
add_ace group.admin easyadmin.bot allow
```

These permissions are checked by the Discord bot only.

## Bot Commands

Every bot command needs its own permission, `easyadmin.bot.<command>`. Granting `easyadmin.bot` grants all of them.

| Permission | Command |
|------------|---------|
| `easyadmin.bot.announce` | `/announce` |
| `easyadmin.bot.ban` | `/ban` |
| `easyadmin.bot.baninfo` | `/baninfo` |
| `easyadmin.bot.cleanup` | `/cleanup` |
| `easyadmin.bot.freeze` | `/freeze` |
| `easyadmin.bot.history` | `/history` |
| `easyadmin.bot.kick` | `/kick` |
| `easyadmin.bot.mute` | `/mute` |
| `easyadmin.bot.notes` | `/notes` |
| `easyadmin.bot.playerinfo` | `/playerinfo` |
| `easyadmin.bot.playerlist` | `/playerlist` |
| `easyadmin.bot.refreshperms` | `/refreshperms` for another user |
| `easyadmin.bot.screenshot` | `/screenshot` |
| `easyadmin.bot.slap` | `/slap` |
| `easyadmin.bot.unban` | `/unban` |
| `easyadmin.bot.unfreeze` | `/unfreeze` |
| `easyadmin.bot.unmute` | `/unmute` |
| `easyadmin.bot.warn` | `/warn` |

Two commands have extra rules:

- `/ban` also needs `easyadmin.player.ban.temporary` for a timed ban, or `easyadmin.player.ban.permanent` for a permanent ban.
- `/refreshperms` with no options needs no permission — any member can refresh their own roles. Using the optional user option, even on yourself, needs `easyadmin.bot.refreshperms`.

## Server Owner

The owner of the Discord server the bot runs on gets every bot permission automatically. You never need to grant them anything.
