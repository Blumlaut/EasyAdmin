# Discord Webhook

**Note:** The Discord Webhook is not active when Bot Logging is configured.

EasyAdmin Supports Monitoring of Admin Actions by using Discord's Webhook feature, this can be enabled by adding

```
set ea_moderationNotification "false"
```

To your server's config file, then you need to create a discord webhook, like this:

![](https://blumlaut.me/s/MteHc7YXnpZgc9W/preview)

Once the webhook has been created, copy the webhook url and paste it where "false" is in the config file, so it looks like this:

```
set ea_moderationNotification "https://discordapp.com/api/webhooks/fas4fsa65gs489sdg23bcv44htjh546"
```

Then just restart your server and kick yourself to see if the notification works correctly.
If it works correctly, a message detailing the kick should now appear in the discord channel.


## Disabling Specific Alerts

See [ea_excludeWebhookFeature](config.md)


## Seperate Webhook Channels

As of 5.81 EasyAdmin Supports 3 different Webhooks which can be used. `ea_moderationNotification` for general Notifications, `ea_reportNotification` for Reports and `ea_detailNotification` for Convar/Settings Changes and Freezing/Spectating Notifications.

These are set the same as ea_moderationNotification, if they are not configured then moderationNotification will be used instead.

