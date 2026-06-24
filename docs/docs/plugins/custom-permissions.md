# Custom Permissions

Plugins can define custom permissions and use them to gate their UI
contributions.

## Registering a Permission

In your resource's shared script (runs on both client and server):

```lua
Citizen.CreateThread(function()
  -- Wait for EasyAdmin's permissions table to be available
  while permissions == nil do
    Citizen.Wait(50)
  end
  permissions['plugin.my-plugin'] = false
end)
```

This adds `plugin.my-plugin` to EasyAdmin's permissions table. The
`easyadmin.` prefix is added automatically by `DoesPlayerHavePermission()`.

Grant the `easyadmin.plugin.my-plugin` ACE to admins who should have access:

```cfg
add_ace group.admin easyadmin.plugin.my-plugin allow
```

## Gating Contributions

### Entire plugin

```lua
exports.EasyAdmin:RegisterPlugin({
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
AddEventHandler('EasyAdmin:Plugin:serverAction:my-plugin:doAction', function(source, data, cb)
  if not DoesPlayerHavePermission(source, 'plugin.my-plugin.admin') then
    return cb({ ok = false, error = 'permission denied' })
  end
  -- ...
  cb({ ok = true })
end)
```

## Checking Permissions in Client Handlers

```lua
AddEventHandler('EasyAdmin:Plugin:action:my-plugin:renderPage', function(data, cb)
  if not DoesPlayerHavePermission(-1, 'plugin.my-plugin.admin') then
    -- Return a limited schema
    return cb({ { type = 'text', text = 'No access', variant = 'muted' } })
  end
  -- Return full schema
  cb({ { type = 'heading', text = 'Full Access', level = 2 } })
end)
```
