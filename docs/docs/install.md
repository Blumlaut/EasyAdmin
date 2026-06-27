# Installation

## Requirements

- FiveM server build 12913 or higher
- OneSync Infinity enabled (`+onesync infinity` as a server start parameter)

## Installation

1. Download the latest release from [GitHub](https://github.com/Blumlaut/EasyAdmin/releases/latest).
2. Extract the folder into your server's `resources` directory.
3. Rename the extracted folder to `EasyAdmin`.

## Starting EasyAdmin

Add the following line to your `server.cfg`:

```
ensure EasyAdmin
```

Then add the required ACE permissions:

```
add_ace group.admin easyadmin allow
add_ace resource.EasyAdmin command allow
```

The first line grants all EasyAdmin permissions to the `group.admin` group. The second line allows the resource to execute commands.

Restart your server after adding these lines.

## Adding an Admin

After starting the server, connect and find your identifier by running this in the server console:

```lua
ea_printIdentifiers 1
```

Replace `1` with your player ID. This prints all identifiers for the specified player. The output looks like:

```
identifier.steam:1100001018c7433
identifier.discord:123456789012345678
identifier.license:ABCD1234EFGH5678
```

Add one of these identifiers to the `group.admin` group in your `server.cfg`:

```
add_principal identifier.steam:1100001018c7433 group.admin
```

Replace `steam` with your preferred identifier type (`discord`, `license`, `xbl`, etc.) and use your actual identifier value.

## Opening the Menu

### FiveM

The menu key is configured through the FiveM settings UI. Press F1 to open FiveM settings, go to Key Bindings, find "Open EasyAdmin", and assign a key.

Alternatively, type `/easyadmin` or `/ea` in the chat to open the menu.

### RedM

Set the menu key in your `server.cfg`:

```
setr ea_defaultKey "F2"
```

Use a standard GTA V key name (e.g., `F2`, `K`, `LCTRL`). You can also use the `/easyadmin` chat command as a fallback.

## See Also

- [Configuration](../configuration/basic) — Set up webhooks, Discord bot, and other options
- [Permissions](../permissions) — Set up granular permissions for moderators and admins
- [Troubleshooting](../troubleshooting) — Common issues and solutions
- [Updating](../updates/updating) — How to update EasyAdmin
