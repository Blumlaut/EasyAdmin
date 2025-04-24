# Updating Instructions

This page outlines instructions on how to update EasyAdmin between versions.

## To 7.4

EasyAdmin 7.4 majorly restructures the resource and completely changes how the Discord Bot works, dependencies are no longer installed through yarn but are shipped with EasyAdmin directly.

Before updating EasyAdmin, you should delete the following files and folders in your EasyAdmin:

```
server/bot/
package.json
```

EasyAdmin 7.4 requires FiveM Server version **12913 or higher** and **Onesync**.

## To 7.3

The v1 Plugin API has been removed entirely, if plugins were still using the v1 API, refer to the [Porting Docs](plugins.md#porting-plugins-to-68).

EasyAdmin will no longer attempt to give itself permissions using the server.cfg file, this must now be done manually by adding the following line to the server.cfg:

```
add_ace resource.EasyAdmin command allow
```


## To 6.8 & 6.81

`ea_logIdentifier` has been changed to accept a list of identifiers, comma seperated

```diff
- setr ea_logIdentifier "discord"
+ setr ea_logIdentifier "discord,steam,license"
```

EasyAdmin Plugins have been changed significantly and should be updated to the new Plugin System, check the [Porting Docs](plugins.md#porting-plugins-to-68) if you are a Developer.

## To 6.6

EasyAdmin 6.6 requires a recent version of `yarn` from [cfx-server-data](https://github.com/citizenfx/cfx-server-data).

## To 6.5

### ea_defaultKey removal

Due to continued confusion about what `ea_defaultKey` actually does, it has been **removed** in version 6.5, the key is now registered as empty by default and [has to be set through the FiveM Settings individually](keybind.md).

RedM is not affected by this change.


## To 6.3

### ea_MenuButton to ea_defaultKey

`ea_MenuButton` has been renamed to `ea_defaultKey`, syntax has been kept, so the change is as simple as the following in your server config:

```diff
- setr ea_MenuButton "F2"
+ setr ea_defaultKey "F2"
```


### Ban Permission Change

The `player.ban` permission has been changed and now also includes `.view`, `.edit` and `.remove`

```diff
- add_ace group.admin easyadmin.unban allow
+ add_ace group.admin easyadmin.ban.remove allow
```

Do note that giving a group `easyadmin.ban` permissions will now also give them permission to edit/unban players.


### Reports 'claim' permission

Reports can now be claimed with the `.claim` permission:

```diff
+ add_ace group.moderator easyadmin.player.reports.claim
```



## To 6.2

### Permissions change

Permissions have been changed majorly from 5.* to 6.2 and above, Permissions now have a "category" they belong to, there have also been new permissions added for existing features.

As an example:

```diff
- add_ace group.moderator easyadmin.kick allow
+ add_ace group.moderator easyadmin.player.kick allow
```

Existing Permissions now have either "player" or "server" as a prefix, here is a list of Permissions as of 6.2, do note that they should all be prefixed with `easyadmin.`

Important to note is that `manageserver` no longer exists, and `teleport.player` has been renamed to `player.teleport.single`, implying the ability to teleport a single player at once.


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

___

### FiveM Keybinds

The ea_MenuButton convar has been changed and now requires a string for a key, as per [this docs entry](https://docs.fivem.net/docs/game-references/input-mapper-parameter-ids/keyboard/), as an example:

```diff
- setr ea_MenuButton "289"
+ setr ea_MenuButton "f2"
```

**Note:** This is a one-time action, once a player joins with that Keybind set they will have to change it from their Control Settings inside of FiveM, FiveM currently does not provide any way to override this for all players.

This **does not** apply to RedM.
