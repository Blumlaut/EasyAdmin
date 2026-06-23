# EasyAdmin NUI Plugins

Extend the EasyAdmin UI with your own sidebar items, pages, player tabs, and
dashboard widgets — backed by Lua handlers on the client or server.

> The old NativeUI plugin system (`addPlugin`) is deprecated and a no-op.

---

## Installing a plugin

1. Put your plugin package in `nui/src/plugins/<your-plugin>/`
2. Register it in `nui/src/plugins/manifest.ts`:

```ts
import { registerPlugin } from './registry'
import myPlugin from './my-plugin'

registerPlugin(myPlugin)
```

3. Rebuild the NUI (`npm run build`).

Lua handlers go in `plugins/<your-plugin>/` and are loaded automatically by
`fxmanifest.lua` (`*_shared.lua`, `*_client.lua`, `*_server.lua`).

---

## Plugin definition

The default export of your plugin's `index.ts`:

```ts
import './my-plugin.css'
import type { EasyAdminPlugin } from '../index'
import { MyPage } from './MyPage'
import { MyTab } from './MyTab'
import { MyWidget } from './MyWidget'

const VIEW = 'plugin:my-plugin'

const myPlugin: EasyAdminPlugin = {
  id: 'my-plugin',          // kebab-case, must be unique
  name: 'My Plugin',
  version: '1.0.0',
  author: 'Your Name',
  description: 'What it does.',

  navItems: [
    { id: VIEW, view: VIEW, label: 'My Plugin', icon: 'box' },
  ],
  pages: [
    { view: VIEW, component: MyPage },
  ],
  playerDetailTabs: [
    { id: 'info', label: 'My Tab', icon: 'info', component: MyTab },
  ],
  dashboardWidgets: [
    { id: 'status', component: MyWidget, order: 150 },
  ],

  onActivate(ctx) {
    const unsub = ctx.on<{ msg: string }>('my-plugin:event', (d) => ctx.notify(d.msg))
    return unsub
  },
}

export default myPlugin
```

`id` must be kebab-case. `name` and `version` are required. Everything else is optional.

---

## The plugin API

Inside any plugin component, call `usePluginApi(pluginId)`:

```tsx
import { usePluginApi } from '../index'
import type { PluginPageProps } from '../index'

function MyPage({ pluginId }: PluginPageProps) {
  const api = usePluginApi(pluginId)

  const [info, setInfo] = useState(null)

  useEffect(() => {
    api.callLua('getInfo').then(setInfo)
  }, [api])

  return (
    <div className="page-container">
      <h3>{api.t('My Plugin')}</h3>
      <button onClick={() => api.notify('Done!', 'success')}>
        {api.t('Notify')}
      </button>
    </div>
  )
}
```

### `callLua(action, data?, server?)`

Calls a Lua handler. Returns a promise with whatever the handler returns.

```ts
// Client handler
const info = await api.callLua<ServerInfo>('getServerInfo')

// Client handler with data
const notes = await api.callLua<Note[]>('getPlayerNotes', { playerId: 42 })

// Server handler — pass true as the third arg
const count = await api.callLua<{ count: number }>('getPlayerCount', undefined, true)
```

### `on(action, handler)`

Subscribes to a message pushed from Lua via `SendNUIMessage`. Returns an unsubscribe function.

```ts
const unsub = api.on<{ message: string }>('my-plugin:broadcast', (data) => {
  api.notify(data.message, 'info')
})
// later: unsub()
```

Push from Lua:

```lua
SendNUIMessage({ action = 'my-plugin:broadcast', data = { message = 'Hello!' } })
```

### `hasPermission(perm)`

Checks the current admin's permissions (no `easyadmin.` prefix):

```ts
if (api.hasPermission('plugin.my-plugin.admin')) {
  // show admin-only UI
}
```

### `t(key, params?)`

Translates a string. Falls back to the key if no translation exists.

```ts
api.t('Hello')                              // → "Hello"
api.t('Welcome, {name}', { name: 'Alice' }) // → "Welcome, Alice"
```

### `notify(message, type?)`

Shows a native in-game notification.

```ts
api.notify('Saved!', 'success')
api.notify('Something went wrong', 'error')
```

---

## Lua handlers

### Client handlers

Register with `RegisterEasyAdminPluginHandler(pluginId, action, fn)`.
The handler receives the data payload; its return value goes back to the NUI.

```lua
-- plugins/my-plugin/my-plugin_client.lua

RegisterEasyAdminPluginHandler("my-plugin", "getInfo", function(data)
  return {
    ok = true,
    name = GetPlayerName(PlayerId()),
    ping = GetPlayerPing(PlayerId()),
  }
end)

RegisterEasyAdminPluginHandler("my-plugin", "getPlayerNotes", function(data)
  return {
    ok = true,
    { text = "Note for player " .. tostring(data.playerId), author = "Me", timestamp = os.time() },
  }
end)
```

### Server handlers

Register with `RegisterEasyAdminPluginServerHandler(pluginId, action, fn)`.
The handler receives `(source, data)` — `source` is the requesting player's
server ID. Reach it from the NUI with `api.callLua(action, data, true)`.

```lua
-- plugins/my-plugin/my-plugin_server.lua

RegisterEasyAdminPluginServerHandler("my-plugin", "getPlayerCount", function(source, data)
  -- Always permission-guard server handlers!
  if not DoesPlayerHavePermission(source, "plugin.my-plugin.view") then
    return { ok = false, error = "permission denied" }
  end

  return { ok = true, count = #GetPlayers(), requestedBy = source }
end)
```

---

## Permissions

Register a plugin permission in your `*_shared.lua`:

```lua
Citizen.CreateThread(function()
  permissions["plugin.my-plugin"] = false
end)
```

Grant the `easyadmin.plugin.my-plugin` ACE to admins who should see it.

Gate the entire plugin:

```ts
const myPlugin: EasyAdminPlugin = {
  id: 'my-plugin',
  name: 'My Plugin',
  version: '1.0.0',
  permission: 'plugin.my-plugin',  // hides everything if admin lacks this
  // ...
}
```

Gate a single player tab:

```ts
playerDetailTabs: [
  { id: 'public', label: 'Info', component: InfoTab },
  { id: 'admin', label: 'Admin', permission: 'plugin.my-plugin.admin', component: AdminTab },
],
```

---

## Contribution examples

### Nav item with a dropdown

```ts
navItems: [
  {
    id: 'plugin:my-plugin',
    label: 'My Plugin',
    icon: 'box',
    children: [
      { id: 'plugin:my-plugin:page1', label: 'Page 1', icon: 'file' },
      { id: 'plugin:my-plugin:page2', label: 'Page 2', icon: 'settings' },
    ],
  },
],
```

### Multi-page plugin

Each page's `view` must match a nav item's `id` (or `view`):

```ts
navItems: [
  { id: 'plugin:my-plugin:main', label: 'Main', icon: 'box' },
  { id: 'plugin:my-plugin:settings', label: 'Settings', icon: 'settings' },
],
pages: [
  { view: 'plugin:my-plugin:main', component: MainPage },
  { view: 'plugin:my-plugin:settings', component: SettingsPage },
],
```

### Player-detail tab

```tsx
import { usePluginApi } from '../index'
import type { PlayerDetailTabProps } from '../index'

function MyTab({ player, permissions }: PlayerDetailTabProps) {
  const api = usePluginApi('my-plugin')
  const [data, setData] = useState(null)

  useEffect(() => {
    api.callLua('getPlayerData', { playerId: player.id }).then(setData)
  }, [api, player.id])

  return <div className="card p-3">{JSON.stringify(data)}</div>
}

// In your plugin definition:
playerDetailTabs: [
  { id: 'info', label: 'My Tab', icon: 'info', component: MyTab },
],
```

### Dashboard widget

```tsx
import { usePluginApi } from '../index'
import type { DashboardWidgetProps } from '../index'

function MyWidget({ pluginId }: DashboardWidgetProps) {
  const api = usePluginApi(pluginId)
  const [status, setStatus] = useState(null)

  useEffect(() => {
    api.callLua('getStatus').then(setStatus)
  }, [api])

  return (
    <div className="card dashboard-card-sm p-3">
      <span className="badge badge-online">Online</span>
    </div>
  )
}

// In your plugin definition (lower order = renders first, default 100):
dashboardWidgets: [
  { id: 'status', component: MyWidget, order: 150 },
],
```

### Lifecycle hook

Runs once when the menu first opens. Return a cleanup function if needed.

```ts
onActivate(ctx) {
  const unsub = ctx.on<{ count: number }>('my-plugin:update', (data) => {
    ctx.notify(`Count: ${data.count}`, 'info')
  })
  return unsub
},
```

---

## Styling

Import a CSS file in your plugin's `index.ts` and use design tokens
(`var(--...)`) from `tokens.css` — no raw hex/px values. Prefix classes with
your plugin id to avoid collisions.

```css
/* plugins/my-plugin/my-plugin.css */
.myplugin-card {
  background: var(--bg-card);
  border-radius: var(--radius-md);
  padding: var(--space-3);
}
```

Use existing EasyAdmin components (`Icon`, `Skeleton`, `CopyButton`, etc.)
from `../../components/`. Available icon names are in `../../components/icons.tsx`.

---

## Browser dev mode

`npm run dev:browser` runs outside FiveM. Add mock responses for your plugin
in `nui/src/mock/domains/plugins.mock.ts`:

```ts
if (pluginId === 'my-plugin' && action === 'getInfo') {
  return Promise.resolve(jsonResponse({ ok: true, name: 'Mock' }))
}
```

---

## ESLint rule

The `nui/no-plugin-internals` rule blocks plugin packages from importing
private EasyAdmin internals (`App`, `useAppData`, `useAppNavigation`,
`ModalContext`, etc.). Use the SDK (`../index`) and public shared modules
(`../../components/*`, `../../lib/*`, `../../types`, `../../fivem`) instead.

---

## Example plugin

The **EasyInfo** plugin (`nui/src/plugins/example/` + `plugins/easyinfo/`)
demonstrates everything above:

- **Server Info page** — sidebar item + page calling client and server Lua handlers
- **Plugin Notes tab** — injected into the player detail page
- **Status widget** — dashboard card
- **`onActivate`** — subscribes to a broadcast event
- **Permission registration** — `plugin.easyinfo` in `easyinfo_shared.lua`

Try it: `npm run dev:browser` (mock data) or build and run in-game (real Lua handlers).
