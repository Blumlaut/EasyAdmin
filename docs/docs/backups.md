# Backups

Starting with **EasyAdmin v5.6**, backups of your banlist are automatically created and saved in the `backup` folder inside your EasyAdmin directory.

By default:
- A new backup is created **every 3 days**.
- Old backups are kept for **30 days** before being deleted to make space for new ones.

---

## Configuring Backups

You can change how backups are created by editing the following **Convars** in your server config file:

```plaintext
ea_backupFrequency 72    # How often (in hours) a new backup should be created
ea_maxBackupCount 10     # Maximum number of backups to keep
```

### Example: For High-Traffic Servers

If your server bans players frequently (e.g., hourly), you might want to use this configuration:

```plaintext
ea_backupFrequency 6      # Create a backup every 6 hours
ea_maxBackupCount 128     # Keep up to 128 backups (about 1 month of daily backups)
```

This setup ensures you always have a recent backup if needed.

You can also **create a backup manually** at any time using the command:

```plaintext
ea_createBackup
```

---

## Restoring from a Backup

EasyAdmin allows you to restore your banlist from a backup file.

1. **Find the backup file** you want to use.  
   It will be in the `backups` folder, and will look something like:
   ```
   banlist_12_37_16_12_2077.json
   ```

2. **Use the command** to load the backup:
   ```plaintext
   ea_loadBackup banlist_12_37_16_12_2077.json
   ```

> ⚠️ Make sure to **replace `banlist_12_37_16_12_2077.json`** with the actual name of the backup file you want to load.

---

### Summary

| Task | How to Do It |
|------|---------------|
| Create automatic backups | Use `ea_backupFrequency` and `ea_maxBackupCount` in config |
| Create a manual backup | Run `ea_createBackup` in-game or via console |
| Restore from backup | Run `ea_loadBackup <filename.json>` with the correct file name |

---
