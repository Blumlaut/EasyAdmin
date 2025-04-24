# Frequent Issues, Questions & Answers

### I'm getting yarn build errors!

Update to EasyAdmin 7.4 or higher.

### How can i change the menu key?

[Click](keybind.md)

### EasyAdmins deferral is conflicting with my adaptive card!

If your EasyAdmin is conflicting with another adaptive card resource, you can try adding
```
set ea_presentDeferral "false"
```
to your server config, this will disable the progress display after EasyAdmin defers the connection and hopefully fix the flicker.

### My EasyAdmin only opens if i press and hold the menu key.

Most likely one of your keybinds are messed up, delete any lines mentioning `EasyAdmin` in this file: `%appdata%/CitizenFX/fivem.cfg`

### I can't connect, EasyAdmin says to contact an administrator , what do i do?

Your Banlist has an error, most likely due to an edit that broke the formatting, use a JSON Validator and fix the Formatting inside the file, or remove any broken bans.


### I found a bug, where do i report it?

https://github.com/Blumlaut/EasyAdmin/issues

### I gave myself Admin Permissions, but i cant open the menu

Add `setr ea_logLevel 3` to your server config and restart the Server, then try connecting, EasyAdmin will show which permissions it's aware of, if your permissions all return `false` then you did something wrong, double check your configured permissions.

## I'm getting "Access denied" errors when someone joins the server!
Make sure the following lines are present in your server.cfg:
```
add_ace group.admin easyadmin allow
add_ace resource.EasyAdmin command allow
```

## Getting a different problem? Join the [Support Discord](https://discord.gg/qq82ZU36XZ)! 
