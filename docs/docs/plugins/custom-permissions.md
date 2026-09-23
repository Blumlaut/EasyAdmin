# Custom Permissions

Plugins can gate their own UI contributions behind custom permissions, so only
authorized admins see them.

## Declaring permissions

List every permission your plugin uses in the `permissions` array of your
plugin config:

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

**Every permission you use as a gate must appear in this array.** A `permission`
field that names an undeclared permission hides that contribution from every
admin, with no warning — the menu only knows the permissions your plugin
declared.

Declaring a permission does not grant it. Admins receive it through an ACE in
`server.cfg`, written as `easyadmin.<key>`:

```cfg
add_ace group.admin easyadmin.plugin.my-plugin allow
add_ace group.admin easyadmin.plugin.my-plugin.advanced allow
```

Both steps are required: declare the permission so the menu can see it, and
grant the ACE so the admin actually holds it. An ACE without a declaration
does nothing for the UI, and a declaration without an ACE stays hidden.

Permissions are removed when your plugin resource stops, so do not reuse a
plugin's permission keys in another resource.

## Gating contributions

### Entire plugin

The top-level `permission` field hides all contributions when the admin lacks
that permission:

```lua
exports.EasyAdmin:RegisterPlugin({
  id = 'my-plugin',
  permission = 'plugin.my-plugin',
  -- navItems, pages, etc. — all hidden without this perm
})
```

### Individual nav items

Set `permission` on a nav item or on a child of a category to hide just that
entry:

```lua
navItems = {
  { id = 'plugin:my-plugin', label = 'My Plugin', icon = 'box' },
  { id = 'plugin:my-plugin:admin', label = 'Admin', icon = 'shield',
    permission = 'plugin.my-plugin.advanced' },
},
```

### Individual player tab

```lua
playerDetailTabs = {
  { id = 'public', label = 'Info', renderAction = 'renderInfo' },
  { id = 'admin', label = 'Admin', permission = 'plugin.my-plugin.advanced', renderAction = 'renderAdmin' },
},
```

Gating only controls what the menu renders. It is not a security boundary —
always check the permission again in the handler that does the work.

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

Every server handler must check its own permission — the bridge does not check
it for you.

To accept any permission in a group, use
`DoesPlayerHavePermissionForCategory(source, 'plugin.my-plugin')`. It returns
true when the admin holds at least one permission starting with that string,
which is useful for deciding whether to allow a whole section.

## Guarding client handlers

Use `-1` as the player id to check the current client's permissions:

```lua
AddEventHandler('EasyAdmin:Plugin:action:my-plugin:renderPage', function(data, cb)
  if not exports.EasyAdmin:DoesPlayerHavePermission(-1, 'plugin.my-plugin.advanced') then
    return cb({ { type = 'text', text = 'Limited view', variant = 'muted' } })
  end
  cb({ { type = 'heading', text = 'Full access', level = 2 } })
end)
```

This only changes what the admin's own menu renders. It is a convenience, not
a security boundary — the data may already have been fetched.

## Permission changes and reloads

Permissions reach the menu when the admin session starts. If your plugin is
started after an admin has the menu open, its gated contributions stay hidden
until that admin refreshes permissions (menu → **Settings** → **Refresh
permissions**) or reconnects. The same refresh applies after you change ACEs in
`server.cfg`.
