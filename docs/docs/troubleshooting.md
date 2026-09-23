# Troubleshooting

## The menu does not open

- Check that you have the required ACE permission. Add `add_ace group.admin easyadmin allow` to your `server.cfg`.
- On FiveM, assign a key to the menu in the FiveM settings, under Key Bindings. Find "Open EasyAdmin" and set a key.
- Use the `/easyadmin` or `/ea` chat command instead. It always opens the menu.
- Check the server console for errors related to EasyAdmin.

## Cannot open the menu after granting permissions

Enable debug logging to diagnose permission issues:

```
setr ea_logLevel 3
```

Restart and reconnect. The server console then logs the result of every permission check. If all of them return false, verify your ACE entries in `server.cfg`.

Ensure these two lines are present:

```
add_ace group.admin easyadmin allow
add_ace resource.EasyAdmin command allow
```

## Banlist loading fails

If EasyAdmin cannot read the banlist on startup, the file may have a formatting error. This usually happens after manual edits.

1. Open `resources/EasyAdmin/banlist.json` in a text editor.
2. Validate the JSON using a tool like [JSONLint](https://jsonlint.com/).
3. Fix any syntax errors (missing commas, unclosed brackets, invalid characters).
4. Restart EasyAdmin.

EasyAdmin writes a red error to the server console when a data file cannot be read, and starts with an empty list. Keep a backup of the file: if it stays unreadable, the next save replaces it with an empty one. The same applies to the notes, action history and statistics files.

## Ban screen shows incorrectly

- Check that `ea_banMessageServerName` and the other ban message convars are set correctly.
- If another resource draws the connection screen (for example, adaptive cards), turn off EasyAdmin's progress display:

```
set ea_presentDeferral "false"
```

## Screenshot upload fails

- Check that `ea_screenshoturl` points to a valid upload endpoint.
- Make sure the endpoint accepts POST requests with image data, using the field name set in `ea_screenshotfield`.
- Screenshots are captured by EasyAdmin itself, so no separate screenshot resource is needed.
- The capture gives up after 25 seconds, and this limit cannot be changed. Slow uploads often look like timeouts — lower `ea_screenshotMaxResolution` and `ea_screenshotQuality` to send smaller images.
- Check that the target player's client is responsive (not frozen or disconnected).

## Discord bot does not connect

- Verify the bot token is correct and not expired.
- Ensure **Privileged Gateway Intents** are enabled (Guild Members Intent and Message Content Intent).
- Check the server console for error messages about invalid tokens or missing intents.

## Webhook notifications do not send

- Verify the webhook URL is correct and the channel still exists.
- If `ea_botLogChannel` is set, notifications go to the bot log channel instead of webhooks.
- Check that the feature is not excluded with the `ea_excludeWebhookFeature` console command.
- Run `ea_testWebhook` in the server console to send a test notification.

## Backup creation fails

- Ensure EasyAdmin can write to the `backups/` directory.
- On managed hosting, check the file permissions of the EasyAdmin resource folder in your FTP client or file manager.

## Changes are not saved

Bans, admin notes, action history and statistics are saved to files inside the EasyAdmin folder. If they disappear after a restart, EasyAdmin was not able to write those files.

- Look for a red error in the server console saying that saving failed or that a file could not be written. Online admins also get a notification.
- These files and folders must be writable by the server: `banlist.json`, `data/actions.json`, `data/notes.json`, `data/statistics/` and `backups/`.
- On managed hosting, fix this with the file permissions in your FTP client or file manager.
- On GTA V Enhanced, the server can block these writes. Add the following line to your `server.cfg`, then restart:

```
add_filesystem_permission EasyAdmin write EasyAdmin
```

If a data file was edited by hand and is no longer valid JSON, it is ignored and an empty one is used instead. See [Banlist loading fails](#banlist-loading-fails).

## NUI appears blank or unresponsive

- The NUI runs in the browser built into your FiveM or RedM client, so update the client first.
- Check for JavaScript errors in the FiveM console (F8 in-game).
- Verify the NUI files are present in `resources/EasyAdmin/nui/dist/`.

## Keybind requires holding the key

On FiveM, delete any manual keybind entries for EasyAdmin from your client config file:

- FiveM: `%AppData%\CitizenFX\fivem.cfg`
- RedM: `%AppData%\CitizenFX\redm.cfg`

Remove any lines mentioning `EasyAdmin`, then restart the client and set the keybind through the FiveM settings UI.

## OneSync required

EasyAdmin requires OneSync. Enable it in your `server.cfg`:

```
set onesync on
```

Infinity is enabled by default. Only add `set onesync_enableInfinity true` if your server turns it off.

## Server build requirement

EasyAdmin requires FiveM or RedM server build 12913 or higher. Update your server artifacts if you see compatibility errors.

## See Also

- [Updating](../updates/updating) — How to update EasyAdmin
- [Configuration](../configuration/advanced) — Debug logging and advanced options
- [NUI Known Issues](../nui/known-issues) — CEF rendering limitations

## Getting More Help

- [GitHub Issues](https://github.com/Blumlaut/EasyAdmin/issues) — Bug reports and feature requests
- [Documentation](https://easyadmin.readthedocs.io/) — Online documentation
