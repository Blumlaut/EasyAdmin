# Update Guide

This guide provides instructions for updating EasyAdmin between versions.

---

## Updating to 7.5

**EasyAdmin 7.5** removes the Permission Editor due to a new security feature by FiveM.

To update you must delete the following folders before updating EasyAdmin:

```
src/
dist/
```

This ensures that the Discord Commands are properly updated.

## Updating to 7.4

**EasyAdmin 7.4** brings major structural changes to the resource and introduces a completely rewritten Discord Bot system. Dependencies are no longer installed via `yarn`; they are now included directly with the EasyAdmin package.

### Before Updating

Make sure to delete the following files and folders from your EasyAdmin installation:

```
server/bot/
package.json
```

### Requirements

- **FiveM Server Version**: 12913 or higher
- **Onesync**: Required

---

## Updating to 7.3

- The **v1 Plugin API** has been completely removed. If your plugins were using the v1 API, you must update them. See the [Porting Docs](plugins.md#porting-plugins-to-68) for help.
- EasyAdmin **no longer automatically assigns permissions** via the `server.cfg`. You must now manually add this line to your `server.cfg`:

```cfg
add_ace resource.EasyAdmin command allow
```

---

## Updating to 6.8 & 6.81

- `ea_logIdentifier` now accepts a **list of identifiers**, separated by commas.

Example:

```diff
- setr ea_logIdentifier "discord"
+ setr ea_logIdentifier "discord,steam,license"
```

- EasyAdmin Plugins have undergone **significant changes**. If you're a developer, refer to the [Porting Docs](plugins.md#porting-plugins-to-68) to update your plugins.

---

## Updating to 6.6

- This version requires a **recent version of `yarn`** from [cfx-server-data](https://github.com/citizenfx/cfx-server-data). Make sure you're using the latest version.

---

## Updating to 6.5

### `ea_defaultKey` Removal

- `ea_defaultKey` has been **removed** due to confusion over its purpose. It is now empty by default and must be set **manually via FiveM Settings**.
- **RedM is not affected** by this change.

---

## Updating to 6.3

### `ea_MenuButton` → `ea_defaultKey`

- `ea_MenuButton` has been renamed to `ea_defaultKey`. The syntax remains the same.

```diff
- setr ea_MenuButton "F2"
+ setr ea_defaultKey "F2"
```

---

### Ban Permission Change

- The `player.ban` permission has been updated to include `.view`, `.edit`, and `.remove`.

```diff
- add_ace group.admin easyadmin.unban allow
+ add_ace group.admin easyadmin.ban.remove allow
```

> Note: Granting `easyadmin.ban` now also grants the ability to edit and unban players.

---

### Reports 'claim' Permission

- Reports can now be claimed using the `.claim` permission.

```cfg
add_ace group.moderator easyadmin.player.reports.claim
```

---

## Updating to 6.2

### Major Permission Changes

- Permissions have been restructured into **categories** (e.g., `player`, `server`) and new permissions have been added.
- The `manageserver` permission is **no longer available**.
- `teleport.player` has been renamed to `player.teleport.single`.

#### Example of Permission Change

```diff
- add_ace group.moderator easyadmin.kick allow
+ add_ace group.moderator easyadmin.player.kick allow
```

#### Permission List (All prefixed with `easyadmin.`)

```
player.ban.temporary
player.ban.permanent
player.kick
player.spectate
player.unban
player.teleport.single
player.teleport.everyone
player.slap
player.freeze
player.screenshot
player.mute
player.warn
player.reports.view
player.reports.process
server.cleanup.cars
server.cleanup.props
server.cleanup.peds
server.permissions.read
server.permissions.write
server.shortcut.add
server.reminder.add
server.convars
server.resources.start
server.resources.stop
immune
anon
```

---

### FiveM Keybinds

- `ea_MenuButton` now requires a **string representation of a key**, as per [FiveM docs](https://docs.fivem.net/docs/game-references/input-mapper-parameter-ids/keyboard/).

Example:

```diff
- setr ea_MenuButton "289"
+ setr ea_MenuButton "f2"
```

> ⚠️ This change is **one-time only**. Once a player joins with the keybind set, they must change it manually in their FiveM settings. This does **not apply to RedM**.
