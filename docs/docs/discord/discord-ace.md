# Discord ACE Permissions

EasyAdmin supports mapping Discord roles to FiveM ACE permission groups. This allows Discord roles to grant server permissions automatically.

## How It Works

When a player connects to the server, EasyAdmin reads their Discord roles and applies the matching ACE permissions. Permissions sync:

- When a player connects to the server (before they spawn)
- When a member runs `/refreshperms` in Discord
- When a member's Discord roles change

This needs the Discord bot to be set up (`ea_botToken`) and present in the same Discord server as the member. See [Bot Setup](../bot-setup).

## Granting Permissions

Use `add_ace` with the `role:` principal type:

```
# Grant all permissions to a Discord role
add_ace role:604749064436711444 easyadmin allow

# Grant only player permissions to a Discord role
add_ace role:604752112227844129 easyadmin.player allow

# Grant specific permissions
add_ace role:604749064436711444 easyadmin.player.kick allow
add_ace role:604749064436711444 easyadmin.player.ban.temporary allow
```

Replace the role ID with the actual Discord role ID (right-click the role in Discord, **Copy Role ID**).

## Inheriting from Groups

To make a Discord role inherit from an existing FiveM group:

```
add_principal role:604749064436711444 group.admin
```

This makes the Discord role behave as if the player is a member of `group.admin`, inheriting all permissions assigned to that group.

## Migrating from Other ACE Resources

If you previously used a third-party ACE resource like `DiscordAcePerms`, replace the old format:

```json
{655500055000, "group.moderator"}
```

With the EasyAdmin format in `server.cfg`:

```
add_principal role:655500055000 group.moderator
```

## Getting Role IDs

1. In Discord, enable Developer Mode (User Settings > Advanced > Developer Mode).
2. Right-click the role and select **Copy Role ID**.

## Permission Priority

FiveM's ACE system follows two rules:

- **A `deny` always wins.** If any `allow` and any `deny` apply to a permission, it is denied.
- **A parent permission covers everything below it.** Granting `easyadmin.player` also grants `easyadmin.player.kick`, and denying `easyadmin.player` denies `easyadmin.player.kick` too.

Because a `deny` on a broad permission blocks all of its children, a narrower `allow` cannot win it back:

```
# Kicking is allowed...
add_ace group.trialadmin easyadmin.player.kick allow

# ...but this deny blocks every EasyAdmin permission, kicking included
add_ace group.trialadmin easyadmin deny
```
