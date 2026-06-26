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

Cached players (recently disconnected players whose data is retained for ban matching) expire after a configurable time.

```
set ea_playerCacheExpiryTime 900
```

Time in seconds before cached player data is cleared.

Default: `900` (15 minutes)

## Identifier Handling

### Token Identifiers

When enabled, EasyAdmin uses FiveM's token identifiers (`identifier.token:*`) for ban matching in addition to traditional identifiers.

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

Set a cooldown in seconds between uses of specific moderation actions. This prevents rapid repeated actions by the same admin.

```
set ea_adminCooldown:ban 60
set ea_adminCooldown:kick 30
set ea_adminCooldown:warn 10
```

Replace `ban`, `kick`, `warn`, etc. with the action name. Set to `0` to disable cooldown for that action.

Available actions: `ban`, `kick`, `warn`, `slap`, `freeze`, `mute`, `teleport`, `spectate`, `screenshot`

## Dangerous Dev Mode

Enables developer-only features that should never be used on a production server. This includes allowing admins to ban themselves.

```
set ea_dangerousDevMode "false"
```

Default: `false`

**Never enable this on a live server.**

## Routing Bucket Options

Registers convars for routing bucket permissions (`player.bucket.join`, `player.bucket.force`). Note: this convar is registered in the manifest but the actual permission gating is controlled by the `player.bucket.join` and `player.bucket.force` permissions.

```
set ea_routingBucketOptions "false"
```

Default: `false`

## Profiler Endpoint Override

Override the profiler HTTP endpoint used by the Profiler page. Format: `host:port`.

```
set ea_profilerEndpoint "127.0.0.1:30120"
```

By default, EasyAdmin attempts to auto-detect the profiler endpoint using `GetCurrentServerEndpoint()` or common ports (30120, 30121, etc.). Use this convar if auto-detection fails.
