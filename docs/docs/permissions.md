# Permissions

You can manage permissions in your server configuration file using **ACE (Access Control Entry)** commands.

Each permission can be assigned an `allow` value. Permissions **not assigned** are considered **denied**.

> ❗ **Important:**  
> Do **not** use `deny` to deny permissions — it doesn't work.

---

## Example: Limiting a Moderator Group

Here's an example of how to grant a "moderator" group only specific permissions like kick, spectate, teleport, slap, and freeze:

```plaintext
add_ace group.moderator easyadmin.player.kick allow
add_ace group.moderator easyadmin.player.spectate allow
add_ace group.moderator easyadmin.player.teleport allow
add_ace group.moderator easyadmin.player.slap allow
add_ace group.moderator easyadmin.player.freeze allow
```

---

## Granting Full Access

If you want a group (like "admin") to have all permissions, you can allow the full `easyadmin` category:

```plaintext
add_ace group.admin easyadmin allow
```

> ⚠️ **Warning:**  
> This also grants the `easyadmin.immune` permission, meaning the user cannot be kicked or banned.  
> ⚠️ **Only the server owner should have full admin access**, as it includes potentially destructive functions.

---

# Available Permissions

Here is a list of all available permissions and what they do:

| Permission | Description |
|------------|-------------|
| `easyadmin.player.ban.temporary` | Allows temporarily banning users |
| `easyadmin.player.ban.permanent` | Allows permanently banning users |
| `easyadmin.player.ban.view` | Allows viewing the ban list |
| `easyadmin.player.ban.edit` | Allows editing ban entries |
| `easyadmin.player.ban.remove` | Allows unbanning users |
| `easyadmin.player.kick` | Allows kicking users |
| `easyadmin.player.spectate` | Allows spectating users |
| `easyadmin.player.teleport.single` | Allows teleporting to or from a player |
| `easyadmin.player.teleport.everyone` | Allows teleporting *everyone* at once |
| `easyadmin.player.slap` | Allows slapping users (removing health) |
| `easyadmin.player.freeze` | Allows freezing players in place |
| `easyadmin.player.mute` | Allows muting players in chat |
| `easyadmin.player.warn` | Allows warning players |
| `easyadmin.player.screenshot` | Allows taking screenshots of users (uploaded via configured service) |
| `easyadmin.player.reports.view` | Allows viewing user reports |
| `easyadmin.player.reports.claim` | Allows claiming user reports |
| `easyadmin.player.reports.process` | Allows deleting user reports |
| `easyadmin.player.allowlist` | Allows joining the server even when allowlist is enabled |
| `easyadmin.server.shortcut.add` | Allows using the `ea_addShortcut` command (non-persistent) |
| `easyadmin.server.reminder.add` | Allows using the `ea_addReminder` command (non-persistent) |
| `easyadmin.server.permissions.read` | Allows viewing all ACE and principal permissions |
| `easyadmin.server.permissions.write` | Allows editing and deleting ACE and principal permissions |
| `easyadmin.server.cleanup.cars` | Allows cleaning up all vehicles not in use |
| `easyadmin.server.cleanup.props` | Allows cleaning up all props (excluding map props) |
| `easyadmin.server.cleanup.peds` | Allows cleaning up all NPCs (peds) |
| `easyadmin.server.announce` | Allows sending announcements to all players |
| `easyadmin.server.convars` | Allows editing server convars (use with caution) |
| `easyadmin.server.resources.start` | Allows starting server resources |
| `easyadmin.server.resources.stop` | Allows stopping server resources |
| `easyadmin.server.chat` | Allows using the admin-only chat channel |
| `easyadmin.immune` | Prevents being kicked or banned by other admins |
| `easyadmin.anon` | Allows hiding admin username in logs and actions |
| `easyadmin.bot.(command name)` | Allows a Discord user access to a specific bot command (replace `(command name)` with the actual command) |
| `easyadmin.player.bucket.join` | Allows joining another player's routing bucket (if enabled) |
| `easyadmin.player.bucket.force` | Allows forcing a player into a different routing bucket (if enabled) |

---

Let me know if you want this converted into a downloadable file or formatted for a specific platform like GitHub or a wiki.