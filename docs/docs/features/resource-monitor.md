# Resource Monitor

The Resource Monitor lists the resources on your server and lets you start, stop and restart them. It also shows each resource's version and tells you when a newer release is available on GitHub.

## Resource List

Each resource has its own row:

| Item | Description |
|------|-------------|
| State | Coloured dot showing the resource's current state |
| Resource name | The resource's name |
| Version | The version the resource declares |
| Description | The description the resource declares |
| Repository | A button that copies the resource's repository URL |

The dot colours are:

| Colour | State |
|--------|-------|
| Green | Started |
| Red | Stopped |
| Orange | Starting or stopping |
| Grey | Unknown |

Above the list you see how many resources are started and how many are stopped. The search box filters the list by resource name or description, and **Refresh** reloads the list.

Select a resource to open its detail page.

## Actions

| Action | Permission Required |
|--------|---------------------|
| Start resource | `easyadmin.server.resources.start` |
| Stop resource | `easyadmin.server.resources.stop` |
| Restart resource | Both — a restart stops the resource and then starts it again |

Buttons for the actions you are allowed to perform appear on each row. Every action asks for confirmation first.

## Resource Detail

Selecting a resource opens its detail page, which shows:

- the resource's state, name, version and description
- a button that copies its repository URL
- Start, Stop and Ensure (restart) buttons
- a table of everything the resource declares about itself, such as its author, dependencies and scripts

## Update Checking

EasyAdmin compares the version a resource declares with the latest release on GitHub. This only works for resources that declare both a version and a GitHub repository URL.

- EasyAdmin checks in the background at most once a day and remembers the results.
- **Updates**, next to the search box, checks on demand. It reports how many resources have updates, or that everything is up to date.
- A resource with an update available shows an arrow on its version badge, and the number of outdated resources is shown on the **Updates** button.
- A warning at the top of the list names each outdated resource and the version it can be updated to. The Dashboard shows the same warning. Select an entry to open that resource's detail page.

## EasyAdmin Itself

EasyAdmin cannot stop or restart itself. Its row has no action buttons, and the server refuses the request. Every other resource can be started, stopped and restarted normally.

## Permissions

| Permission | Description |
|------------|-------------|
| `easyadmin.server.resources.start` | Start server resources |
| `easyadmin.server.resources.stop` | Stop server resources |

You need at least one of these permissions to see the resource list. The Profiler is a separate page with its own permission — see [Profiler](../profiler).
