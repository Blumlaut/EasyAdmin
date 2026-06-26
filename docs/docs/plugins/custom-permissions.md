# Custom Permissions

Plugins can gate their UI contributions behind custom permissions so only
authorized admins see them.

## Declaring permissions

Add a `permissions` array to your plugin config. EasyAdmin registers each
entry and makes it available to `exports.EasyAdmin:DoesPlayerHavePermission()`:

```lua
exports.EasyAdmin:RegisterPlugin({
  id = 'my-plugin',
  name = 'My Plugin',
  version = '1.0.0',
  permissions = {
    'plugin.my-plugin',          -- basic access
    'plugin.my-plugin.advanced', -- elevated access
  },
  -- ...
})
```

Grant ACEs in your `server.cfg` or via Discord:

```cfg
add_ace group.admin easyadmin.plugin.my-plugin allow
add_ace group.admin easyadmin.plugin.my-plugin.advanced allow
```

## Gating contributions

### Entire plugin

The top-level `permission` field hides all contributions when the admin
lacks that permission:

```lua
exports.EasyAdmin:RegisterPlugin({
  id = 'my-plugin',
  permission = 'plugin.my-plugin',
  -- navItems, pages, etc. — all hidden without this perm
})
```

### Individual player tab

```lua
playerDetailTabs = {
  { id = 'public', label = 'Info', renderAction = 'renderInfo' },
  { id = 'admin', label = 'Admin', permission = 'plugin.my-plugin.advanced', renderAction = 'renderAdmin' },
},
```

## Guarding server handlers

Check permissions inside server handlers before performing actions:

```lua
AddEventHandler('EasyAdmin:Plugin:serverAction:my-plugin:doAction', function(source, data, cb)
  if not exports.EasyAdmin:DoesPlayerHavePermission(source, 'plugin.my-plugin.advanced') then
    return cb({ ok = false, error = 'permission denied' })
  end
  cb({ ok = true })
end)
```

## Guarding client handlers

Use the client-side permission check (`player = -1`) to return a limited
schema when the admin lacks a permission:

```lua
AddEventHandler('EasyAdmin:Plugin:action:my-plugin:renderPage', function(data, cb)
  if not exports.EasyAdmin:DoesPlayerHavePermission(-1, 'plugin.my-plugin.advanced') then
    return cb({ { type = 'text', text = 'Limited view', variant = 'muted' } })
  end
  cb({ { type = 'heading', text = 'Full access', level = 2 } })
end)
```
