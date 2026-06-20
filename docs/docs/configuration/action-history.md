# Action History and Admin Notes

EasyAdmin tracks moderation actions and allows admins to leave persistent notes on players.

## Action History

Action history records moderation actions (bans, kicks, warnings, mutes, etc.) against each player. It is viewable in-game through the player detail page and accessible via the Discord bot `/history` command.

| Convar | Default | Description |
|--------|---------|-------------|
| `ea_enableActionHistory` | `true` | Enable or disable action history tracking |
| `ea_actionHistoryExpiry` | `30` | Number of days to keep action history entries before automatic cleanup |

Actions are logged for:
- Bans (permanent and temporary)
- Kicks (including auto-kick from warnings)
- Warnings
- Mutes
- Screenshots
- Teleports
- Freezes
- Slaps
- Spectate
- Report claims and closes
- Permission edits

Entries are stored in `data/action_history.json` and pruned automatically based on the expiry setting.

## Admin Notes

Admin notes are persistent, timestamped messages that admins can leave on players. They are visible in-game on the player detail page and accessible via the Discord bot `/notes` command.

| Convar | Default | Description |
|--------|---------|-------------|
| `ea_enableAdminNotes` | `true` | Enable or disable admin notes |

Notes are stored in `data/admin_notes.json`. Each note includes the timestamp, content, moderator name, and moderator identifiers.

### Permissions

| Permission | Description |
|------------|-------------|
| `easyadmin.player.actionhistory.view` | View a player's action history |
| `easyadmin.player.actionhistory.add` | Add entries to a player's action history |
| `easyadmin.player.actionhistory.delete` | Delete entries from a player's action history |
| `easyadmin.player.adminnotes.view` | View admin notes on a player |
| `easyadmin.player.adminnotes.add` | Add admin notes to a player |
| `easyadmin.player.adminnotes.delete` | Delete admin notes from a player |
