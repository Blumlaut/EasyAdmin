# Troubleshooting

## The menu does not open

- Ensure you have the required ACE permissions. Add `add_ace group.admin easyadmin allow` to your `server.cfg`.
- On FiveM, set the keybind through the FiveM settings UI (F1 > Key Bindings > Open EasyAdmin).
- Try the `/easyadmin` or `/ea` chat command as an alternative.
- Check the server console for errors related to EasyAdmin.

## Cannot open the menu after granting permissions

Enable debug logging to diagnose permission issues:

```
setr ea_logLevel 3
```

Restart and reconnect. Check the server console for permission check results. If all permissions return false, verify your ACE entries in `server.cfg`.

Ensure these lines are present:

```
add_ace group.admin easyadmin allow
add_ace resource.EasyAdmin command allow
```

## Banlist loading fails

If EasyAdmin fails to load the banlist on startup, the banlist file may have a formatting error. This often happens after manual edits.

1. Open `resources/EasyAdmin/banlist.json` in a text editor.
2. Validate the JSON using a tool like [JSONLint](https://jsonlint.com/).
3. Fix any syntax errors (missing commas, unclosed brackets, invalid characters).
4. Restart EasyAdmin.

## Ban screen shows incorrectly

- Ensure `ea_banMessageServerName` and other ban message convars are set correctly.
- If using another deferral resource (e.g., adaptive cards), disable EasyAdmin's progress display:

```
set ea_presentDeferral "false"
```

## Screenshot upload fails

- Check that `ea_screenshoturl` points to a valid upload endpoint.
- Ensure the endpoint accepts POST requests with image data.
- Increase the timeout by checking server latency — screenshots have a 25-second timeout.
- Verify the target player's client is responsive (not frozen or disconnected).

## Discord bot does not connect

- Verify the bot token is correct and not expired.
- Ensure **Privileged Gateway Intents** are enabled (Guild Members Intent and Message Content Intent).
- Check the server console for error messages about invalid tokens or missing intents.

## Webhook notifications do not send

- Verify the webhook URL is correct and the channel still exists.
- If `ea_botLogChannel` is set, webhooks are disabled in favor of bot logging.
- Check that the feature is not excluded via `ea_excludeWebhookFeature`.
- Test with `ea_testWebhook`.

## Backup creation fails

- Ensure EasyAdmin has write permissions to the `backups/` directory.
- On managed hosting, check FTP/file permissions for the EasyAdmin resource directory.

## NUI appears blank or unresponsive

- The NUI runs in FiveM's CEF browser. Ensure your server's CEF version is up to date.
- Check for JavaScript errors in the FiveM console (F8 in-game).
- Verify the NUI files are present in `resources/EasyAdmin/nui/dist/`.

## Keybind requires holding the key

On FiveM, delete any manual keybind entries for EasyAdmin:

```
%appdata%/CitizenCLI/fivem/fivem.cfg
```

Remove any lines mentioning `EasyAdmin`, then restart the client and set the keybind through the FiveM settings UI.

## OneSync required

EasyAdmin requires OneSync Infinity. Add it as a server start parameter:

```
+onesync infinity
```

## Server build requirement

EasyAdmin requires FiveM server build 12913 or higher. Update your FXServer if you see compatibility errors.

## See Also

- [Updating](../updates/updating) — How to update EasyAdmin
- [Configuration](../configuration/advanced) — Debug logging and advanced options
- [NUI Known Issues](../nui/known-issues) — CEF rendering limitations

## Getting More Help

- [GitHub Issues](https://github.com/Blumlaut/EasyAdmin/issues) — Bug reports and feature requests
- [Documentation](https://easyadmin.readthedocs.io/) — Online documentation
