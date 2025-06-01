# Using Discord as a Screenshot Uploader

> **⚠️ Security Warning:**  
> If you use this method, your **Discord webhook URL will be visible to players** through the game's console or scripts. If you're concerned about webhook security, it's not recommended to use this method.

---

## Overview

By default, EasyAdmin uses `wew.wtf` as the screenshot image uploader. However, since this service is no longer available, you'll need an alternative.

EasyAdmin supports using **Discord** as a screenshot uploader. This means screenshots will be uploaded directly to a Discord channel via a **webhook**.

---

## Configuration

To set up Discord as your screenshot uploader, follow these steps:

1. **Obtain a Discord Webhook URL**  
   Follow [this guide](webhook.md) to create and retrieve your Discord webhook URL.

2. **Edit Your Server Configuration File**  
   Add the following two lines to your server configuration file (usually `server.cfg` or similar):

   ```ini
   setr ea_screenshoturl "https://discordapp.com/api/webhooks/YOUR_WEBHOOK/URL"
   setr ea_screenshotfield "files[]"
   ```

   - Replace `YOUR_WEBHOOK/URL` with your full Discord webhook URL.
   - The `ea_screenshotfield` value should remain as `"files[]"` unless you're using a custom setup.

3. **Restart Your Server**  
   After saving the configuration, restart your server for the changes to take effect.

---

## Result

Once configured, screenshots taken in-game should now be uploaded to the Discord channel associated with your webhook. 
