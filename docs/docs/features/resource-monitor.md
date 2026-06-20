# Resource Monitor

The Resource Monitor lists all running resources and provides controls to start, stop, and restart them.

## Permissions

| Permission | Description |
|------------|-------------|
| `easyadmin.server.resources.start` | Start server resources |
| `easyadmin.server.resources.stop` | Stop server resources |

## Actions

| Action | Permission Required |
|--------|---------------------|
| Start resource | `easyadmin.server.resources.start` |
| Stop resource | `easyadmin.server.resources.stop` |
| Restart resource | Both start and stop permissions |

## Resource List

The resource list displays:

- Resource name
- Current state (started, stopped, stopped, error)
- Start type (auto, manual, critical)
- Memory usage
