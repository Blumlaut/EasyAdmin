# Discord Webhook Integration

> **Note:** The Discord Webhook is disabled when Bot Logging is enabled.

EasyAdmin allows you to monitor admin actions using Discord's Webhook feature. This can be enabled by modifying your server's configuration file.

---


## Creating a Webhook

### Create the Webhook

1. Go to the Discord channel you want to use.
2. Right-click the channel name again.
3. Click **Edit Channel**.
4. Scroll down and click **Webhooks**.
5. Click the **Create Webhook** button.
6. Fill in a name and optionally select an avatar.
7. Click **Create**.

---

### Copy the Webhook URL

1. After creating the webhook, you'll see a **URL** under the webhook name.
2. Click **Copy** to copy the full URL.

> 🔒 Keep this URL safe. Anyone with it can post messages to your channel.

## Enabling the Webhook

To enable the webhook:

1. Open your server's configuration file.
2. Find and change this line:
   ```text
   set ea_moderationNotification "false"
   ```
   to:
   ```text
   set ea_moderationNotification "https://discordapp.com/api/webhooks/fas4fsa65gs489sdg23bcv44htjh546"
   ```
3. Replace the `false` value with your **actual Discord webhook URL**.
4. Save the file and **restart your server**.

To test if it's working, you can **kick yourself** and check if a notification appears in your Discord channel.

---

## Disabling Specific Alerts

If you want to disable specific types of alerts, refer to the `ea_excludeWebhookFeature` configuration option in the configuration guide:

- [ea_excludeWebhookFeature](config.md)

---

## Separate Webhook Channels (Version 5.81+)

Starting from version **5.81**, EasyAdmin supports **three different webhooks**, allowing you to send notifications to separate Discord channels:

| Webhook Variable              | Purpose                                           |
|-------------------------------|---------------------------------------------------|
| `ea_moderationNotification`   | General moderation notifications (e.g., kicks)    |
| `ea_reportNotification`       | Notifications for player reports                  |
| `ea_detailNotification`       | Notifications for convar/settings changes and spectator/freezing events |

Each webhook is set in the same way as `ea_moderationNotification`. If a specific webhook is not configured, EasyAdmin will fall back to using `ea_moderationNotification`.
