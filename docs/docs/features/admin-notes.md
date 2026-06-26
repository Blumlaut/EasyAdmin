# Admin Notes

Admin notes allow moderators to leave persistent notes on player profiles. Notes are visible in the NUI player detail page and persist across server restarts.

## Permissions

| Permission | Description |
|------------|-------------|
| `easyadmin.player.adminnotes.view` | View admin notes on a player |
| `easyadmin.player.adminnotes.add` | Add admin notes to a player |
| `easyadmin.player.adminnotes.delete` | Delete admin notes from a player |

## Usage

Admins with the appropriate permissions can add, view, and delete notes from the NUI player detail page. Notes are associated with the player's identifiers and persist even if the player changes their display name.

## Storage

Notes are stored in `resources/EasyAdmin/admin_notes.json`. Each note contains:

| Field | Description |
|-------|-------------|
| `id` | Unique note ID |
| `playerIdentifiers` | Player identifiers the note is attached to |
| `author` | Name of the admin who created the note |
| `authorIdentifiers` | Identifiers of the author |
| `text` | Note content |
| `timestamp` | Unix timestamp of creation |
