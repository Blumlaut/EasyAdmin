# Permissions


You can modify Permissions by using ACE in your server config file, each permission can be have an `allow` value or be denied by not including permission at all, you can add infinite groups, just make sure to add permissions for each group. 

**Note:** Do NOT deny permissions using `deny` this is broken and will not work.

Here is a set of example permissions that limit users in the "moderator" group to only kick, spectate, teleport, slap and freeze permissions:
```
add_ace group.moderator easyadmin.player.kick allow
add_ace group.moderator easyadmin.player.spectate allow
add_ace group.moderator easyadmin.player.teleport allow
add_ace group.moderator easyadmin.player.slap allow
add_ace group.moderator easyadmin.player.freeze allow
```

You can also allow all permissions by allowing the entire `easyadmin` category.

**This is heavily discouraged for anyone but the server owner, as it gives access to potentially destructive functions which only trusted people should have.**

```
add_ace group.admin easyadmin allow
```

**Note:** This will also make you immune from being kicked/banned as it grants you the `easyadmin.immune` permission.




# Available permission

|         Permission          |                                                  Description                                                   |
|-----------------------------|----------------------------------------------------------------------------------------------------------------|
| easyadmin.player.ban.temporary | Allows to Temporarily Ban Users |
| easyadmin.player.ban.permanent | Allows to Permanently Ban Users |
| easyadmin.player.ban.view | Allows to View Banlist |
| easyadmin.player.ban.edit | Allows to Edit Bans |
| easyadmin.player.ban.remove | Allows to Unban Users |
| easyadmin.player.kick | Allows to Kick Users |
| easyadmin.player.spectate | Allows to Spectate Users |
| easyadmin.player.teleport.single | Allows to Teleport To/From Players |
| easyadmin.player.teleport.everyone | Allows to Teleport *everyone* at once. |
| easyadmin.player.slap | Allows Slapping of Users (take away hp) |
| easyadmin.player.freeze | Allows to Freeze Players in place |
| easyadmin.player.mute | Allows to "Mute" other Players from chat activity. |
| easyadmin.player.warn | Allows to "Warn" other Players. |
| easyadmin.player.screenshot | Allows to Create Screenshots of users, these will be generated and uploaded to your Configured Uploader |
| easyadmin.player.reports.view | Allows Admins to View Reports made by Users |
| easyadmin.player.reports.claim | Allows Admins to Claim Reports made by Users |
| easyadmin.player.reports.process | Allows to Delete Reports made by Users |
| easyadmin.player.allowlist | Allows to join server while Allowlist is enabled |
| easyadmin.server.shortcut.add | Allows to use the ea_addShortcut command, however, these are not persistant |
| easyadmin.server.reminder.add | Allows to use the ea_addReminder command, these are also not persistan |
| easyadmin.server.permissions.read | Allows to view all (add_ace & add_principal) Permissions the server has configured |
| easyadmin.server.permissions.write | Allows to edit and delete (add_ace & add_principal) Permissions |
| easyadmin.server.cleanup.cars | Allows to cleanup all Vehicles on the Server, except ones currently occupied by players |
| easyadmin.server.cleanup.props | Allows to cleanup all Props on the Server, including ones spawned by resources or hacks, does not include maps |
| easyadmin.server.cleanup.peds | Allows to cleanup all Peds on the Server |
| easyadmin.server.announce | Allows to send an announcement to all players |
| easyadmin.server.convars | Allows to edit Server Convars, this is a dangerous permission, only assign to people you trust! |
| easyadmin.server.resources.start | Allows to start Resources on the Server |
| easyadmin.server.resources.stop | Allows to stop Resources on the Server |
| easyadmin.server.chat | allows to use the "Admin Chat" Channel |
| easyadmin.immune | Prevents from being kicked/banned by other admins. |
| easyadmin.anon | Allows the "Anonymous Admin" Feature, will hide Username in Kicks/Bans/Admin Logs |
| easyadmin.bot.(command name) | Allows Discord User access to a specific bot command, replace (command name) with the actual name |
| easyadmin.player.bucket.join | Allows to join another player's bucket, given `ea_routingBucketOptions` is enabled |
| easyadmin.player.bucket.force | Allows to change another player's bucket, given `ea_routingBucketOptions` is enabled |