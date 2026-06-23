# Custom Permissions

Plugins can define custom permissions and use them to gate their UI
contributions.

## Registering a permission

In your resource's shared script (runs on both client and server):

```lua
Citizen.CreateThread(function()
  permissions["plugin.my-plugin"] = false
end)
```

This adds `plugin.my-plugin` to EasyAdmin's permissions table. The
`easyadmin.` prefix is added automatically by `DoesPlayerHavePermission()`.

Grant the `easyadmin.plugin.my-plugin` ACE to admins who should have access:

```cfg
add_ace group.admin easyadmin.plugin.my-plugin allow
```

## Gating contributions

### Entire plugin

```lua
exports['easyadmin']:RegisterPlugin({
  id = 'my-plugin',
  permission = 'plugin.my-plugin',
  -- All contributions hidden if admin lacks this
})
```

### Individual player tab

```lua
playerDetailTabs = {
  { id = 'public', label = 'Info', renderAction = 'renderInfo' },
  { id = 'admin', label = 'Admin', permission = 'plugin.my-plugin.admin', renderAction = 'renderAdmin' },
},
```

### Server handlers

Always permission-guard server handlers manually:

```lua
exports['easyadmin']:RegisterPluginServerHandler('my-plugin', 'doAction', function(source, data)
  if not DoesPlayerHavePermission(source, 'plugin.my-plugin.admin') then
    return { ok = false, error = 'permission denied' }
  end
  -- ...
end)
```

## Checking permissions in client handlers

```lua
exports['easyadmin']:RegisterPluginHandler('my-plugin', 'renderPage', function(data)
  if not DoesPlayerHavePermission(-1, 'plugin.my-plugin.admin') then
    -- Return a limited schema
    return { { type = 'text', text = 'No access', variant = 'muted' } }
  end
  -- Return full schema
end)
```
