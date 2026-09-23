# Allowlist

The allowlist stops players from joining your server unless they have the `easyadmin.player.allowlist` permission. It works alongside the ban list as an extra layer of access control.

## Enabling

Enable the allowlist in your `server.cfg`:

```cfg
set ea_enableAllowlist "true"
```

Default: `false`

## Behavior

When the allowlist is enabled, every connecting player is checked. Players with the permission join normally, everyone else is denied with the message "You are not allowlisted on this server".

Banned players still see their ban message, since the ban check runs first.

A broader permission also lets a player in: anyone with `easyadmin` or `easyadmin.player` passes the allowlist check, so your existing admins will not be locked out.

## Granting Access

Grant the permission with an ACE in `server.cfg`, the same way as any other EasyAdmin permission. There is no in-game command or menu for adding someone to the allowlist.

Grant it to a single player:

```cfg
add_ace identifier.steam:1100001018c7433 easyadmin.player.allowlist allow
```

Replace the identifier with your own (see [Adding an Admin](../../install#adding-an-admin) for how to find it).

Or add them to a group that has the permission:

```cfg
add_ace group.moderator easyadmin.player.allowlist allow
add_principal identifier.steam:1100001018c7433 group.moderator
```

Players are checked when they connect, so permission changes apply the next time they join.
