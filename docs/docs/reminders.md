# Chat Reminders

EasyAdmin supports **Chat Reminders**, which are messages automatically sent in the chat at regular intervals defined by the `ea_chatReminderTime` setting (in minutes).

## How to Use

- The command `ea_addReminder` is used to define a reminder.
- This command **must be placed after EasyAdmin has started** in your `server.cfg` file.

## Available Placeholders

You can use the following placeholders in your reminder messages:

| Placeholder | Description |
|-------------|-------------|
| `@admins` | Shows all online admins in chat. If no admins are online, it will just show `@admins` |
| `@bancount` | Shows the number of bans in the banlist |
| `@time` | Displays the current time |
| `@date` | Displays the current date |

## Colours

You can also use color codes like `^1` to `^9` to style your messages.

---

## Example Usage

```plaintext
ea_addReminder "This Server is watched by ^3@admins^7"
ea_addReminder "Current Time: ^5@time^7."
ea_addReminder "Our Banlist has @bancount Entries!"
```

---
