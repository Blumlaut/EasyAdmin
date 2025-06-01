# Commands

EasyAdmin supports a variety of **console and in-game commands** that can be used as an alternative to the graphical menu. These commands allow admins to perform actions quickly and efficiently.

> ⚠️ **Important Note:**  
> These commands are not officially supported and may behave unexpectedly in certain situations. Use them at your own risk and always test before using in a live environment.

---

## List of Commands

| **Command** | **Description** |
|-------------|------------------|
| `easyadmin` | Opens the EasyAdmin menu. |
| `kick [playerid] [reason]` | Kicks a player from the server. |
| `ban [playerid] [reason]` | Bans a player. |
| `spectate [playerid]` | Switches to spectator mode and follows the specified player. |
| `slap [playerid] [hp]` | Deals a specified amount of damage to a player. |
| `freeze [playerid] [true/false]` | Freezes or unfreezes a player. |
| `report [playerid] [reason]` | Reports a player. Must be enabled in settings. |
| `calladmin [reason]` | Sends a report-style message to admins to request assistance. |
| `unban [ban id]` | Removes a specific ban by ID. |
| `ea_printIdentifiers [id]` | *(Console only)* Prints all identifiers for a user. |
| `ea_addShortcut [Shortcut] [Text]` | Adds a custom shortcut for commonly used reason text. |
| `ea_addReminder [Text]` | Adds a periodic reminder message to the chat. |
| `ea_testWebhook` | Sends test messages to configured webhooks to verify they are working. |
| `ea_createBackup` | Creates a backup of the banlist. |
| `ea_loadBackup [backupname]` | Loads a previously created banlist backup. |
