# Chat Reminders


EasyAdmin Supports Chat Reminders, these get Sent in the Chat according to `ea_chatReminderTime` (in minutes).

`ea_addReminder` is a command, so it needs to be put AFTER EasyAdmin starts in your server.cfg

Following placeholders can be used:

```
@admins - Shows all Online Admins in chat, if no admins are online, it just prints @admins
@bancount - Shows the amount of Bans in the Banlist
@time - Shows the Current Time
@date - Shows the Current Date
```

This also supports colour codes from ^1-^9.

Example of reminders would be:

```
ea_addReminder "This Server is watched by ^3@admins^7"
ea_addReminder "Current Time: ^5@time^7."
ea_addReminder "Our Banlist has @bancount Entries!"
```
