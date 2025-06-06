# Reason Shortcuts

Starting with **EasyAdmin version 6.02**, you can use **shortcuts** for commonly used moderation reasons. This makes it faster to fill in reasons in the GUI without having to type full sentences each time.

For example, instead of typing out:

> "RDMing is not allowed, please read our Rules! (/rules)"

You can simply use the shortcut:

> `rdm`

---

## How to Set Up Shortcuts

To create a shortcut, use the `ea_addShortcut` command in your server's configuration file. The command format is:

```
ea_addShortcut <shortcut> <full reason>
```

Here are some examples:

| Command | Shortcut | Displayed Reason |
|--------|----------|------------------|
| `ea_addShortcut mod Modding&Cheating is not tolerated on this Server.` | `mod` | Modding & Cheating is not tolerated on this Server |
| `ea_addShortcut rdm RDMing is not allowed, please read our Rules! (/rules)` | `rdm` | RDMing is not allowed, please read our Rules! (/rules) |
| `ea_addShortcut stfu Please be respectful in Voice&Text Chat! (/rules)` | `stfu` | Please be respectful in Voice & Text Chat! (/rules) |

---

## Where to Add the Commands

These commands **must be added to the server's config file**. You should do this **after EasyAdmin has started**.

---

## Usage

Once set up, these shortcuts will work **in every "reason" field** in the EasyAdmin GUI. Just type the shortcut and it will be replaced with the full reason automatically.
