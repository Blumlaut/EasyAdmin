# Banlist Backups

EasyAdmin automatically creates backups of the banlist at configurable intervals. Backups are stored in the `backups/` directory as JSON files.

## Automatic Backups

| Convar | Default | Description |
|--------|---------|-------------|
| `ea_backupFrequency` | `72` | Hours between automatic backups. Set to `0` to disable automatic backups |
| `ea_maxBackupCount` | `10` | Maximum number of backups to retain. Oldest backups are deleted when this limit is reached |

Example:

```
set ea_backupFrequency 24
set ea_maxBackupCount 30
```

Backup files are named with the format `banlist_HH_MM_DD_MM_YYYY.json` (e.g., `banlist_14_30_15_06_2025.json`).

## Manual Backup

Use the `ea_createBackup` command to create a backup immediately. Requires server-level permissions.

```
ea_createBackup
```

## Restore from Backup

Use the `ea_loadBackup` command followed by the backup filename to restore a previous banlist state. This replaces the current banlist entirely. Requires server-level permissions.

```
ea_loadBackup banlist_14_30_15_06_2025.json
```

List available backups in the `backups/` directory to find the correct filename.

## Custom Banlist Integration

When `ea_custombanlist` is enabled, EasyAdmin triggers `ea_data:addBan` and `ea_data:updateBan` events when ban entries are added or updated during backup restoration. This allows other resources to sync with EasyAdmin's banlist.

```
set ea_custombanlist "true"
```

Default: `false`

## Backup Storage

Backups are stored in the EasyAdmin resource directory under `backups/`. Ensure your server has read and write permissions for this directory. On managed hosting platforms, you may need to adjust FTP or file permissions.
