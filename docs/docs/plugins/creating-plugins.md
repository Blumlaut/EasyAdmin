# Creating Plugins

The plugin system is currently disabled. This page will be updated when the new plugin API is released.

## Previous Plugin System (v1)

The v1 plugin system supported:

- **Shared files** (`*_shared.lua`) — Permissions and shared code
- **Server files** (`*_server.lua`) — Server-side logic
- **Client files** (`*_client.lua`) — UI extensions via NativeUI

Plugins were loaded from the `plugins/` directory with the naming convention:

```
plugins/myplugin/myplugin_shared.lua
plugins/myplugin/myplugin_server.lua
plugins/myplugin/myplugin_client.lua
```

## Current Status

The plugin system is disabled pending a complete rewrite. Use server events and exports as an alternative for extending EasyAdmin functionality.
