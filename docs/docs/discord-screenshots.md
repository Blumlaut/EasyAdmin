# Discord as Screenshot Uploader

### Security Notice: Using this _will_ expose your webhook to players in form of code, if you are concerned about security for your webhook this method is not recommended.

By Default, wew.wtf is configured as the standard image uploader, as this service no longer exists an alternative will have to be set, EasyAdmin supports setting Discord as an uploader, this will upload the image to a Discord channel using webhooks.

Configuring the Screenshot Uploader is easy, simply paste the following in your server config file:

```
setr ea_screenshoturl "https://discordapp.com/api/webhooks/YOUR_WEBHOOK/URL"
setr ea_screenshotfield "files[]"
```

Make sure to enter your full webhook URL in `ea_screenshoturl`.

How to create your own Discord webhook is outlined in [this guide](webhook.md).

After a server restart, screenshots should show as follows:

![](https://blumlaut.me/s/WQHwnJ2PWW2nsCe/preview)