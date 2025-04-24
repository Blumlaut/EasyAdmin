
# Installing EasyAdmin


## Requirements

EasyAdmin is standalone, it does not require any other resoruces to function.

## Installation

=== "Manually (FTP)"

	Download the latest source code from [here](https://github.com/Blumlaut/EasyAdmin/releases/latest)

	Extract the EasyAdmin-*version* folder onto your workspace, rename the folder to `EasyAdmin` and upload it to your FiveM Server's `resources` folder using FTP, then follow the rest of the Guide.

=== "Manually on Linux (CLI)"

	First, we install the required packages using our preferred package manager, you will need the following packages:
	```
	tar jq curl wget
	```

	Once these packages are installed, `cd` into your server's `resources` folder and run the following bash script:

	```bash
	dl=$(curl -sSL https://api.github.com/repos/Blumlaut/EasyAdmin/releases/latest | jq -r .tarball_url )
	mkdir EasyAdmin
	wget $dl -O easyadmin.tar.gz
	tar xf easyadmin.tar.gz && rm easyadmin.tar.gz
	cp -Rfv *Blumlaut-EasyAdmin*/* ./EasyAdmin
	rm -rf *Blumlaut-EasyAdmin*
	```

	This script can also be used to update EasyAdmin, however, reading changelogs is always recommended.


=== "Manually on Windows (GUI)"

	Download the latest source code from [here](https://github.com/Blumlaut/EasyAdmin/releases/latest)

	Extract the EasyAdmin-*version* folder into your resources, then rename the folder to `EasyAdmin`.



=== "ZAP-Hosting Webinterface"
	
	> If you are using txAdmin, then please follow the "Manually (FTP)" or "Manually on Linux (CLI)" Guides.

	Open the "Resources" tab in your ZAP-Hosting Dashboard, search for EasyAdmin and click the install button.



## Getting Started

To get started with EasyAdmin, copypaste this template into your `server.cfg` file and restart your server.

```
ensure EasyAdmin

add_ace group.admin easyadmin allow
add_ace resource.EasyAdmin command allow
```

All available configuration options can be found [here](config.md).

To configure a key to open EasyAdmin with, see [Keybind](keybind.md).

## Adding an Admin


=== "Manually"

	You can use this template to fill out your desired Values

	```
	add_principal identifier.IDENTIFIERNAME:IDENTIFIER group.admin
	```


	You can use any Identifier available in FiveM for this, however, in this example we will describe how to use your Steam ID.

	After installing EasyAdmin, start EasyAdmin and join your Server, once you are connected enter `ea_printIdentifiers 1` in your Server Console, 1 represents your ingame ID, so make sure you use the correct id, EasyAdmin will then print a list of your identifiers:
 
	![grafik](https://user-images.githubusercontent.com/13604413/139588546-a64da751-7f1c-41ae-8abd-f6c7e7b0735e.png)

	we can now fill out the value described above, it will look like this:

	```
	add_principal identifier.steam:1100001018c7433 group.admin
	```

	> To use Steam IDs as an identifier, a Steam WebAPIKey needs to be set up. Follow this [guide](steamapikey.md) to create one.

	You can also use other identifiers, as EasyAdmin is not specifically limited to SteamIDs, all available identifiers can be used, such as `discord`, `xbl` or `license`, to name a few examples.

=== "ZAP-Hosting"

    > Note: This **only** works for ZAP-Hosting's FiveM Windows or Linux Server see the "Manually" Tab for txAdmin
    
    Enter your Steam ID (64, not Hex) in the Settings Page under Admins, add a new line for each SteamId.

=== "Discord ACE Permissions"

	EasyAdmin ships with a Discord Permission implementation by default, to use this, the [Discord Bot](discordbot.md) has to be configured.

	Once the bot has been configured, follow [this guide](https://easyadmin.readthedocs.io/en/latest/discordbot/#discord-ace-permissions) to set it up.
