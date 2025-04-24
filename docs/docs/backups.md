# Backups

EasyAdmin, since Version 5.6, automatically creates backup of your banlist in the "backup" folder, inside EasyAdmin, by default, Backups are created every 3 Days and kept for 30 Days before being overwritten by newer Backups.


## Creating Backups

You can change the configuration options for Backups using the following Convars in your Server Config

```
ea_backupFrequency 72 # In hours, how often a backup should be created
ea_maxBackupCount 10 # how many backups should be created, at max.
```

Backups can also be created manually using the `ea_createBackup` Command.

A recommended config for popular Servers, which bans on an hourly basis, would be:

```
ea_backupFrequency 6
ea_maxBackupCount 128
```

This will create a backup every 6 hours, and keep them for 1 month.

## Loading Backups

EasyAdmin natively supports loading of backup files, you will need to check which banlist file you want to load in the "backups" folder, then use the following command to load it:

```
ea_loadBackup banlistFile.json
```

**Make sure to replace banlistFile.json with your banlist file, for example, `banlist_12_37_16_12_2077.json`**
