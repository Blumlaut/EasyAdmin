
# Common Issues, Questions & Answers

Below are some frequently asked questions and known issues related to **EasyAdmin**. If your issue isn't listed here, feel free to join the [Support Discord](https://discord.gg/qq82ZU36XZ) for help.

---

## 🔧 I'm getting `yarn build` errors!

**Fix:**  
Update to **EasyAdmin 7.4 or higher**.

---

## 🔑 How can I change the menu key?

**Answer:**  
[Read more about changing keybinds here](keybind.md)

---

## ⚠️ EasyAdmin's deferral is conflicting with my adaptive card!

**Fix:**  
If EasyAdmin is causing flickering or conflicts with another adaptive card resource, try adding this line to your server config (`server.cfg`):

```cfg
set ea_presentDeferral "false"
```

This disables the progress display after EasyAdmin defers the connection, which should resolve the flickering issue.

---

## 🕹 My EasyAdmin only opens if I press and hold the menu key.

**Fix:**  
This is likely due to an incorrect keybind setup. Delete any lines mentioning `EasyAdmin` in the following file:

```
%appdata%/CitizenFX/fivem.cfg
```

Then restart your client.

---

## ❌ I can't connect, and EasyAdmin says to contact an administrator. What do I do?

**Fix:**  
Your **banlist** file has a formatting error. This often happens after manual edits. To fix:

1. Use a [JSON Validator](https://jsonlint.com/) to check the file.
2. Correct any syntax errors.
3. If unsure, remove any recently added or broken bans.

---

## 🐞 I found a bug, where do I report it?

**Answer:**  
Report it on the [EasyAdmin GitHub Issues page](https://github.com/Blumlaut/EasyAdmin/issues).

---

## 🔐 I gave myself admin permissions, but I can't open the menu.

**Fix:**  
Add the following line to your `server.cfg` and restart the server:

```cfg
setr ea_logLevel 3
```

This enables detailed logging. After reconnecting, check the console to see which permissions EasyAdmin recognizes.

- If all permissions return `false`, you may have misconfigured them.
- Double-check your `server.cfg` and permission setup.

---

## 🚫 I'm getting "Access denied" errors when someone joins the server!

**Fix:**  
Make sure the following lines are in your `server.cfg`:

```cfg
add_ace group.admin easyadmin allow
add_ace resource.EasyAdmin command allow
```

These lines grant necessary permissions for the admin group to use EasyAdmin.

---

## 📁 Saving banlist backup failed! Please check if EasyAdmin has permission to write in the backups folder!

**Fix:**  
EasyAdmin can't write to the `backups` folder because it lacks permissions.

- Ensure your server has **read and write access** to the `backups` folder inside the EasyAdmin directory.
- If you're on **ZAP-Hosting**, use the **"Set FTP Permissions"** button in your control panel.

---

## 🤷‍♂️ Getting a different problem?

Join the [EasyAdmin Support Discord](https://discord.gg/qq82ZU36XZ) for real-time help from the community and developers.