# Server Permissions

These permissions control server-level management actions.

## How to Grant

Add the permission to a group in your `server.cfg`:

```cfg
add_ace group.admin easyadmin.server.announce allow
```

Or grant a whole category at once:

```cfg
# Grants all server.* permissions
add_ace group.admin easyadmin.server allow
```

## Entity Cleanup

| Permission | What It Does |
|------------|-------------|
| `easyadmin.server.cleanup.cars` | Clean up vehicles not in use |
| `easyadmin.server.cleanup.props` | Clean up props (excluding map props) |
| `easyadmin.server.cleanup.peds` | Clean up NPCs (peds) |

Cleanup removes spawned entities from the world. Use with caution on populated servers.

## Resource Management

| Permission | What It Does |
|------------|-------------|
| `easyadmin.server.resources.start` | Start server resources |
| `easyadmin.server.resources.stop` | Stop server resources |
| `easyadmin.server.resources.monitor` | Access the Profiler page and view resource monitoring data |

## Server Administration

| Permission | What It Does |
|------------|-------------|
| `easyadmin.server.announce` | Send announcements to all players |
| `easyadmin.server.convars` | Edit server convars through the NUI |
| `easyadmin.server.chat` | Use the admin-only chat channel |

## Shortcuts and Reminders

| Permission | What It Does |
|------------|-------------|
| `easyadmin.server.shortcut.add` | Use the `ea_addShortcut` command (non-persistent) |
| `easyadmin.server.reminder.add` | Use the `ea_addReminder` command (non-persistent) |

## Statistics and Monitoring

| Permission | What It Does |
|------------|-------------|
| `easyadmin.server.statistics.view` | Access the Player Statistics page |
| `easyadmin.server.network.monitor` | Access the Network Monitor page |

## Special Permissions

| Permission | What It Does |
|------------|-------------|
| `easyadmin.immune` | Prevent being kicked or banned by other admins |
| `easyadmin.anon` | Hide admin username in logs and actions |
