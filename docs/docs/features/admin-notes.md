# Admin Notes

Admin notes allow moderators to leave persistent notes on player profiles. Notes are visible in the NUI player detail page and persist across server restarts.

## Permissions

| Permission | Description |
|------------|-------------|
| `easyadmin.player.adminnotes.view` | View admin notes on a player |
| `easyadmin.player.adminnotes.add` | Add admin notes to a player |
| `easyadmin.player.adminnotes.delete` | Delete admin notes from a player |

## Usage

Admins with the appropriate permissions can add, view, and delete notes from the NUI player detail page. Note content is limited to 512 characters.

Notes are attached to the player's identifiers, so they follow a player across name changes and reconnects. A note is shown for a player when it shares **any** identifier with them — one match is enough.

Notes can also be read from Discord with `/notes`, which requires the `easyadmin.bot.notes` permission.

## Configuration

| Convar | Default | Description |
|--------|---------|-------------|
| `ea_enableAdminNotes` | `true` | Reserved. EasyAdmin does not use this setting yet, so changing it has no effect |

## Storage

Notes are stored in `resources/EasyAdmin/data/notes.json`. On first load, a legacy `notes.json` in the resource root is migrated to the new path automatically.

Each note contains:

| Field | Description |
|-------|-------------|
| `time` | When the note was created, formatted as `DD/MM/YYYY HH:MM` |
| `id` | Unique note ID |
| `content` | Note text |
| `idents` | Player identifiers the note is attached to |
| `moderator` | Name of the admin who created the note |
| `moderatorIdents` | Identifiers of the admin who created the note |

## See Also

- [Action History](../action-history) — Moderation actions recorded for a player
- [Action History and Admin Notes](../../configuration/action-history) — Convar and permission reference
- [Discord Bot Commands](../../discord/bot-commands) — `/notes`
