# Banlist Backups

EasyAdmin backs up your ban list automatically, and you can create or restore a backup at any time. Backups are saved as JSON files in the `backups/` folder inside the EasyAdmin resource.

Each backup file is a copy of the whole ban list as it looked when the backup was taken. It does not contain action history, admin notes or statistics, so back those up separately if you need them.

## Automatic Backups

| Convar | Default | Description |
|--------|---------|-------------|
| `ea_backupFrequency` | `72` | Hours between automatic backups. Set to `0` to disable automatic backups |
| `ea_maxBackupCount` | `10` | Maximum number of backups to keep. When a new backup pushes the total over this number, the oldest backup is deleted |

Example:

```
set ea_backupFrequency 24
set ea_maxBackupCount 30
```

EasyAdmin checks the timer every few minutes and takes the backup as soon as it is due. Automatic backups run on the server, whether or not an admin is online.

Backup files are named with the format `banlist_HH_MM_DD_MM_YYYY.json` (hour, minute, day, month, year), e.g. `banlist_14_30_15_06_2025.json`.

## Manual Backup

Use the `ea_createBackup` command to create a backup immediately:

```
ea_createBackup
```

## Restore from Backup

1. Open the `backups/` folder and find the file you want, for example `banlist_14_30_15_06_2025.json`.
2. Run `ea_loadBackup` with that file name.

```
ea_loadBackup banlist_14_30_15_06_2025.json
```

Use the file name only, not a path. A name that does not match a file in the folder is ignored, and your ban list stays as it is.

Restoring replaces your current ban list with the contents of the backup. The change applies immediately, is saved straight away, and stays in place after a restart. Bans that had already expired in the backup are dropped while restoring. Players who are already connected are not disconnected.

Both commands require the `easyadmin.server` permission. They can always be run from the server console.

## Custom Banlist Integration

If another resource tracks your bans, enable this convar:

```
set ea_custombanlist "true"
```

Default: `false`

Restoring a backup then fires an `ea_data:addBan` event for every ban in the backup, so your other resources can sync with the restored list. Editing an existing ban normally fires `ea_data:updateBan`; restoring a backup does not.

`ea_custombanlist` is not listed in the txAdmin convar editor, so add it to `server.cfg` yourself. Once set, you can also change it in-game from the Server Settings page.

## Backup Storage

Backups are stored in the `backups/` folder in the EasyAdmin resource directory:

| File | Description |
|------|-------------|
| `banlist_*.json` | The backups. These are the files you pass to `ea_loadBackup` |
| `_backups.json` | EasyAdmin's own index of your backups, including when the last backup ran and which files to remove once the limit is reached. It is not a backup — do not pass it to `ea_loadBackup`, and leave it in place |

Ensure your server has read and write permissions for this folder. If EasyAdmin cannot write there, it reports this in the server console and no backup is created. On managed hosting platforms, you may need to adjust FTP or file permissions.

## See Also

- [Ban List](../../features/ban-list) — Managing bans and custom banlist events
- [Convar Reference](../../reference/convar-reference) — All EasyAdmin convars
