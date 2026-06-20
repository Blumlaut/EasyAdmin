# Custom Permissions

Custom permissions for plugins are currently not available. The plugin system is disabled pending a rewrite.

## Previous System (v1)

The v1 plugin system allowed plugins to define custom permissions in their `_shared.lua` file:

```lua
Citizen.CreateThread(function()
    permissions["plugin.example"] = false
end)
```

This would register `easyadmin.plugin.example` as a checkable permission.

## Current Status

Custom permissions must use the standard EasyAdmin permission system defined in `shared/permissions.lua`. New permissions can be added there and assigned via ACE in `server.cfg`.
