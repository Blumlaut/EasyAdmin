# Server Permissions

These permissions control server-level management actions.

## Cleanup Permissions

| Permission | Description |
|------------|-------------|
| `easyadmin.server.cleanup.cars` | Clean up vehicles not in use |
| `easyadmin.server.cleanup.props` | Clean up props (excluding map props) |
| `easyadmin.server.cleanup.peds` | Clean up NPCs (peds) |

Cleanup removes spawned entities from the world. Use with caution on populated servers.

## Resource Management Permissions

| Permission | Description |
|------------|-------------|
| `easyadmin.server.resources.start` | Start server resources |
| `easyadmin.server.resources.stop` | Stop server resources |
| `easyadmin.server.resources.monitor` | Access the Profiler page and view resource monitoring data |

## Server Administration Permissions

| Permission | Description |
|------------|-------------|
| `easyadmin.server.announce` | Send announcements to all players |
| `easyadmin.server.convars` | Edit server convars through the NUI |
| `easyadmin.server.chat` | Use the admin-only chat channel |

## Shortcut and Reminder Permissions

| Permission | Description |
|------------|-------------|
| `easyadmin.server.shortcut.add` | Use the `ea_addShortcut` command (non-persistent) |
| `easyadmin.server.reminder.add` | Use the `ea_addReminder` command (non-persistent) |

## Statistics Permissions

| Permission | Description |
|------------|-------------|
| `easyadmin.server.statistics.view` | Access the Player Statistics page |
| `easyadmin.server.network.monitor` | Access the Network Monitor page |

## Special Permissions

| Permission | Description |
|------------|-------------|
| `easyadmin.immune` | Prevent being kicked or banned by other admins |
| `easyadmin.anon` | Hide admin username in logs and actions |
