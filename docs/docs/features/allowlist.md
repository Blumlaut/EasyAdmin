# Allowlist

The allowlist system blocks all players from joining the server unless they have the `easyadmin.player.allowlist` permission. This provides an additional layer of access control beyond the ban list.

## Enabling

Enable the allowlist:

```
set ea_enableAllowlist "true"
```

Default: `false`

## Behavior

When enabled, players are checked for the `easyadmin.player.allowlist` permission during the connection deferral process. Players without this permission are denied connection with a message.

## Granting Access

Grant allowlist access to a player:

```
add_ace identifier.steam:1100001018c7433 easyadmin.player.allowlist allow
```

Or add them to a group with the permission:

```
add_ace group.moderator easyadmin.player.allowlist allow
add_principal identifier.steam:1100001018c7433 group.moderator
```
