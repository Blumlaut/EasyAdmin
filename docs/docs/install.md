# Installation

## Requirements

- FiveM or RedM server build 12913 or higher
- OneSync enabled (`set onesync on` in your `server.cfg`)

## Installation

1. Download the latest release from [GitHub](https://github.com/Blumlaut/EasyAdmin/releases/latest).
2. Extract the folder into your server's `resources` directory.
3. Rename the extracted folder to `EasyAdmin`.

The release download is ready to run. If you install from the source code instead, install Node.js and build the frontend and bot once before starting your server:

```
npm run install:all
npm run build
```

EasyAdmin will not start if these builds are missing.

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

### Filesystem Permission (GTA V Enhanced)

On GTA V Enhanced, the server may block EasyAdmin from saving its own data files. If the console reports that EasyAdmin could not save a file, add the following line to your `server.cfg`:

```
add_filesystem_permission EasyAdmin write EasyAdmin
```

This grants the resource permission to write its own data files.

Restart your server after adding these lines.

## Adding an Admin

After starting the server, connect and find your identifier by running this in the server console:

```
ea_printIdentifiers 1
```

Replace `1` with your player ID. This prints all identifiers for the specified player as a list, for example:

```
["steam:1100001018c7433","license:ABCD1234EFGH5678","discord:123456789012345678","live:9f2c8a1b..."]
```

Add one of these values to the `group.admin` group in your `server.cfg`, with an `identifier.` prefix:

```
add_principal identifier.steam:1100001018c7433 group.admin
```

Replace `steam` with your preferred identifier type (`discord`, `license`, `xbl`, etc.) and use your actual identifier value.

## Opening the Menu

### FiveM

The menu key is configured through the FiveM settings UI. In game, open the FiveM settings, go to Key Bindings, find "Open EasyAdmin", and assign a key.

Alternatively, type `/easyadmin` or `/ea` in the chat to open the menu.

### RedM

RedM has no menu key. Open the menu by typing `/easyadmin` or `/ea` in the chat.

The `ea_defaultKey` setting has no effect in EasyAdmin 8.

## See Also

- [Configuration](../configuration/basic) — Set up webhooks, Discord bot, and other options
- [Permissions](../permissions) — Set up granular permissions for moderators and admins
- [Troubleshooting](../troubleshooting) — Common issues and solutions
- [Updating](../updates/updating) — How to update EasyAdmin
