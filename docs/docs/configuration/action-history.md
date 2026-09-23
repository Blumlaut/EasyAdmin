# Action History and Admin Notes

EasyAdmin keeps two kinds of player records: an automatic action history of moderation actions, and admin notes written by hand. Both are stored as JSON files in the resource's `data/` folder and are shown on the player detail page in the menu.

## Action History

Action history records selected moderation actions against a player. It can be viewed on the player detail page and through the Discord bot `/history` command. See [Action History](../../features/action-history) for what is recorded and how entries are matched to players.

| Convar | Default | Description |
|--------|---------|-------------|
| `ea_enableActionHistory` | `true` | Record new action history entries |
| `ea_actionHistoryExpiry` | `120` | Days to keep entries before they are deleted automatically |

```
set ea_enableActionHistory "true"
set ea_actionHistoryExpiry 120
```

EasyAdmin records bans (permanent, temporary and offline), kicks and warnings. Other actions, such as mutes and teleports, are not recorded.

Entries are stored in `resources/EasyAdmin/data/actions.json` and survive restarts. Entries older than the expiry are removed automatically.

Setting `ea_enableActionHistory` to `false` only stops new entries from being recorded — entries already stored stay visible.

## Admin Notes

Admin notes are timestamped messages admins can leave on a player's profile. They are visible on the player detail page and through the Discord bot `/notes` command.

Notes are always available; access is controlled by the permissions below.

| Convar | Default | Description |
|--------|---------|-------------|
| `ea_enableAdminNotes` | `true` | Reserved. EasyAdmin does not use this setting yet, so changing it has no effect |

Notes are stored in `resources/EasyAdmin/data/notes.json`. Each note keeps its content, timestamp, and the name and identifiers of the admin who wrote it.

### Permissions

| Permission | Description |
|------------|-------------|
| `easyadmin.player.actionhistory.view` | View a player's action history |
| `easyadmin.player.actionhistory.add` | Currently unused by EasyAdmin |
| `easyadmin.player.actionhistory.delete` | Delete individual action history entries |
| `easyadmin.player.adminnotes.view` | View a player's admin notes |
| `easyadmin.player.adminnotes.add` | Add admin notes to a player |
| `easyadmin.player.adminnotes.delete` | Delete admin notes from a player |
