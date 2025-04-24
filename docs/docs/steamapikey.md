# Creating a Steam API Key

When using Steam as an Identifier, a Steam WebAPIKey is required.

If you are using ZAP-Hosting (non-txAdmin), then the Steam WebAPIKey is already configured in the "Settings" Page of your server, you do not have to follow this guide then.

**Note: you will need a full steam account to be able to do this, it'll require purchasing a game of £5+ to change your account from limited to full access**

To create your SteamWebAPI Key head over to [steamcommunity.com](https://steamcommunity.com/dev/apikey) and log in with your account.

When creating a new Key, enter your Server's IP Address (without Port) in the `Domain Name` field.

Then agree to the Terms of Use and click Register.

Next, open your server.cfg and scroll down until you see a `steam_WebApiKey` line, then copy the key you just generated and paste it between the quotes.

If no `steam_WebApiKey` line exists then it can simply be added.

for example,
```
steam_WebApiKey "ECBB82291CEF372F0CBC66DD11D66DA5"
```

> If you're hosting your server on your local machine (your PC) then you can enter `localhost` into the Domain Name field.

