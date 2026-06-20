# Bot Permissions

Discord bot permissions control which Discord users can execute bot commands. These are granted using `easyadmin.bot` prefixed permissions.

## Bot Command Permissions

| Permission | Description |
|------------|-------------|
| `easyadmin.bot.history` | Use the `/history` command (view player action history) |
| `easyadmin.bot.notes` | Use the `/notes` command (view admin notes) |

## Granting Bot Access

Grant bot access to a Discord user or role:

```
# Grant to a specific Discord user
add_ace discord:123456789012345678 easyadmin.bot.history allow
add_ace discord:123456789012345678 easyadmin.bot.notes allow

# Grant to a Discord role
add_ace role:604749064436711444 easyadmin.bot.history allow
add_ace role:604749064436711444 easyadmin.bot.notes allow
```

## Full Bot Access

To grant all bot commands to a group:

```
add_ace group.admin easyadmin.bot allow
```

## Server Owner

The server owner (the Discord user associated with the bot token) has all bot permissions by default.
