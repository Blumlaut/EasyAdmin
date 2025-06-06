# Installing EasyAdmin

## Requirements

EasyAdmin is a standalone resource. It does **not** require any additional libraries or dependencies to work.

## Installation

Choose one of the following installation methods based on your setup.

=== "Manually (FTP)"

	1. Go to the [latest release page](https://github.com/Blumlaut/EasyAdmin/releases/latest) and download the source code.
	2. Extract the downloaded folder (it will be named something like `EasyAdmin-*version*`).
	3. Rename the folder to `EasyAdmin`.
	4. Upload the folder to your FiveM server's `resources` directory using FTP.

	Then continue with the rest of the setup guide.

=== "Manually on Linux (CLI)"

	1. Install the required packages:

	```
	tar jq curl wget
	```

	2. Navigate to your FiveM server's `resources` folder using the terminal:

	```bash
	cd /path/to/your/resources
	```

	3. Run the following script to download and install EasyAdmin:

	```bash
	dl=$(curl -sSL https://api.github.com/repos/Blumlaut/EasyAdmin/releases/latest | jq -r .tarball_url )
	mkdir EasyAdmin
	wget $dl -O easyadmin.tar.gz
	tar xf easyadmin.tar.gz && rm easyadmin.tar.gz
	cp -Rfv *Blumlaut-EasyAdmin*/* ./EasyAdmin
	rm -rf *Blumlaut-EasyAdmin*
	```

	> This script can also be used to update EasyAdmin. Always check the [changelog](https://github.com/Blumlaut/EasyAdmin/releases) before updating.

=== "Manually on Windows (GUI)"

	1. Go to the [latest release page](https://github.com/Blumlaut/EasyAdmin/releases/latest) and download the source code.
	2. Extract the folder (named something like `EasyAdmin-*version*`) into your `resources` folder.
	3. Rename the extracted folder to `EasyAdmin`.

=== "ZAP-Hosting Webinterface"

	> ⚠️ If you're using **txAdmin**, skip this tab and use the "Manually (FTP)" or "Manually on Linux (CLI)" guides.

	1. Log in to your ZAP-Hosting dashboard.
	2. Go to the **Resources** tab.
	3. Search for **EasyAdmin** and click the **Install** button.

---

## Getting Started

To start using EasyAdmin, add the following to your `server.cfg` file and restart your server:

```cfg
ensure EasyAdmin

add_ace group.admin easyadmin allow
add_ace resource.EasyAdmin command allow
```

All available configuration options are in the [Config Guide](config.md).

If you want to set a key to open EasyAdmin in-game, see the [Keybind Guide](keybind.md).

---

## Adding an Admin

Choose your method based on your hosting environment.

=== "Manually"

	1. Use this template to assign admin access:

	```
	add_principal identifier.IDENTIFIERNAME:IDENTIFIER group.admin
	```

	2. Replace `IDENTIFIERNAME` with the type of identifier you're using (e.g., `steam`, `discord`, `license`).
	3. Replace `IDENTIFIER` with the actual identifier value.

	> To get your identifier:
	> - Start the server and connect to it.
	> - In the **server console**, run:
	>
	>   ```lua
	>   ea_printIdentifiers 1
	>   ```
	>   (Replace `1` with your in-game ID.)

	> Example output:
	>
	> ```
	> identifier.steam:1100001018c7433
	> identifier.discord:123456789012345678
	> identifier.license:ABCD1234EFGH5678
	> ```

	> To use **Steam IDs**, you need a **Steam WebAPIKey**. Follow this [guide](steamapikey.md) to get one.

	You can also use other identifiers like `discord`, `xbl`, `license`, etc.

	Example (using Steam):

	```cfg
	add_principal identifier.steam:1100001018c7433 group.admin
	```

=== "ZAP-Hosting"

	> 📌 This method **only works** for ZAP-Hosting's FiveM Linux/Windows servers. For txAdmin, use the "Manually" tab.

	1. Go to the **Settings** page in your ZAP-Hosting dashboard.
	2. Under the **Admins** section, enter your **Steam ID (64-bit, not Hex)**.
	3. Add a new line for each admin.

=== "Discord ACE Permissions"

	EasyAdmin includes support for Discord ACE permissions by default.

	1. Set up the [Discord Bot](discordbot.md) first.
	2. Once the bot is running, follow [this guide](https://easyadmin.readthedocs.io/en/latest/discordbot/#discord-ace-permissions) to configure Discord ACE permissions.
