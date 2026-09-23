# Advanced Configuration

## Logging

Control the verbosity of EasyAdmin's server console output.

| Convar | Default | Description |
|--------|---------|-------------|
| `ea_logLevel` | `1` | Logging verbosity: `1` (errors only), `2` (warnings), `3` (info), `4` (debug) |

Use higher log levels for troubleshooting. Set to `4` for maximum debug output.

```
setr ea_logLevel 3
```

## Player Cache

Disconnected players stay in EasyAdmin's cache for a while so their data can still be matched for bans and reports.

```
set ea_playerCacheExpiryTime 1800
```

Time in seconds before cached player data is cleared.

Default: `1800` (30 minutes)

## Identifier Handling

### Token Identifiers

When enabled, EasyAdmin uses FiveM's token identifiers for ban matching in addition to traditional identifiers.

```
set ea_useTokenIdentifiers "true"
```

Disable this if multiple servers share the same banlist but have different token configurations.

Default: `true`

### IP Privacy

Hides IP addresses in the EasyAdmin NUI player list and detail views.

```
set ea_IpPrivacy "true"
```

Default: `true`

## Admin Cooldown

Set a cooldown in seconds between uses of a moderation action by the same admin. This prevents rapid repeated actions.

```
set ea_adminCooldown:ban 60
set ea_adminCooldown:kick 30
set ea_adminCooldown:warn 10
```

Replace `ban`, `kick`, `warn`, etc. with the action name. Set to `0` to disable the cooldown for that action.

Available actions: `ban`, `unban`, `kick`, `warn`, `slap`, `freeze`, `mute`, `teleport`, `spectate`, `screenshot`

Each action has its own convar. They are not part of EasyAdmin's convar options, so add them to your server config by hand.

## Dangerous Dev Mode

Enables developer-only features that should never be used on a production server. This includes allowing admins to ban themselves.

```
set ea_dangerousDevMode "false"
```

Default: `false`

**Never enable this on a live server.**

## Profiler Endpoint Override

Override the profiler address used by the Profiler page. Format: `host:port`.

```
set ea_profilerEndpoint "127.0.0.1:30120"
```

EasyAdmin tries to work out the address on its own, and remembers the last one that worked. Set this convar if the Profiler page cannot reach the server.
