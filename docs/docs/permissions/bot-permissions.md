# Bot Permissions

Discord bot permissions control which users can execute bot commands. These work the same way as in-game permissions — grant them via `add_ace` in your `server.cfg`.

## How to Grant

Grant to a specific Discord user:

```cfg
add_ace discord:123456789012345678 easyadmin.bot.history allow
```

Grant to a Discord role:

```cfg
add_ace role:604749064436711444 easyadmin.bot.history allow
```

Grant all bot commands to a group:

```cfg
add_ace group.admin easyadmin.bot allow
```

## Bot Commands

| Permission | What It Does |
|------------|-------------|
| `easyadmin.bot.history` | Use the `/history` command (view player action history) |
| `easyadmin.bot.notes` | Use the `/notes` command (view admin notes) |

## Server Owner

The server owner (the Discord user associated with the bot token) has all bot permissions by default and does not need to be granted them explicitly.
