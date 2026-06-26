# EasyAdmin Documentation

EasyAdmin is an administration system for FiveM and RedM servers. It provides a graphical interface for managing players, bans, reports, server resources, and more.

---

## Quick Start

If you are setting up EasyAdmin for the first time, follow these steps in order:

1. [Install EasyAdmin](install) -- Download, extract, and start the resource
2. [Add yourself as an admin](install#adding-an-admin) -- Grant your identifier admin access
3. [Set your keybind](configuration/basic#menu-keybind) -- Choose a key to open the menu
4. [Configure webhooks](configuration/webhooks) -- Set up Discord notifications
5. [Set up the Discord bot](discord/bot-setup) -- Optional, for remote management

Each step links to a detailed guide.

---

## I Am a...

### Server Owner

You want full control over your server, including moderation tools, Discord integration, and server management.

<div class="card-grid">

<a class="card" href="install">
<div class="card-icon">&#x1F4E5;</div>
<div class="card-title">Installation</div>
<div class="card-desc">Set up EasyAdmin on your server in minutes.</div>
</a>

<a class="card" href="permissions">
<div class="card-icon">&#x1F512;</div>
<div class="card-title">Permissions</div>
<div class="card-desc">Configure admin roles and access levels.</div>
</a>

<a class="card" href="configuration/basic">
<div class="card-icon">&#x2699;</div>
<div class="card-title">Configuration</div>
<div class="card-desc">Set up webhooks, ban screens, and core options.</div>
</a>

<a class="card" href="discord/bot-setup">
<div class="card-icon">&#x1F4E6;</div>
<div class="card-title">Discord Bot</div>
<div class="card-desc">Manage your server from Discord.</div>
</a>

</div>

### Moderator

You need to manage players, handle reports, and monitor server activity.

<div class="card-grid">

<a class="card" href="nui/pages">
<div class="card-icon">&#x1F465;</div>
<div class="card-title">Player Management</div>
<div class="card-desc">Kick, ban, mute, freeze, and spectate players.</div>
</a>

<a class="card" href="features/ban-list">
<div class="card-icon">&#x1F6AB;</div>
<div class="card-title">Ban List</div>
<div class="card-desc">Search, edit, and manage bans.</div>
</a>

<a class="card" href="features/reports">
<div class="card-icon">&#x1F6A9;</div>
<div class="card-title">Reports</div>
<div class="card-desc">Review and process player reports.</div>
</a>

<a class="card" href="features/action-history">
<div class="card-icon">&#x23F2;</div>
<div class="card-title">Action History</div>
<div class="card-desc">View moderation history for any player.</div>
</a>

</div>

### Developer

You want to extend EasyAdmin with custom plugins, integrations, or exports.

<div class="card-grid">

<a class="card" href="plugins/plugin-api">
<div class="card-icon">&#x1F527;</div>
<div class="card-title">Plugin API</div>
<div class="card-desc">Build runtime plugins that extend the NUI with schema-driven UI.</div>
</a>

<a class="card" href="nui/design-system">
<div class="card-icon">&#x1F4BB;</div>
<div class="card-title">NUI Architecture</div>
<div class="card-desc">React/TypeScript SPA, communication with Lua, design system.</div>
</a>

<a class="card" href="reference/convar-reference">
<div class="card-icon">&#x1F4DD;</div>
<div class="card-title">Convar Reference</div>
<div class="card-desc">All configuration variables with defaults and types.</div>
</a>

<a class="card" href="i18n/translating">
<div class="card-icon">&#x1F310;</div>
<div class="card-title">Translating</div>
<div class="card-desc">Add or update language files.</div>
</a>

</div>

---

## Common Tasks

Find what you need by task:

| Task | Guide |
|------|-------|
| Ban a player | [Ban List](features/ban-list) |
| Set up Discord notifications | [Webhooks](configuration/webhooks) |
| Add a Discord bot | [Bot Setup](discord/bot-setup) |
| Configure permissions | [Permissions Overview](permissions/index) |
| Edit a ban | [Editing Bans](features/ban-list#editing-bans) |
| Unban a player | [Unbanning](features/ban-list#unbanning) |
| Handle player reports | [Reports](features/reports) |
| Set up chat reminders | [Reminders](features/reminders-and-shortcuts#chat-reminders) |
| Add reason shortcuts | [Shortcuts](features/reminders-and-shortcuts#reason-shortcuts) |
| Enable the allowlist | [Allowlist](features/allowlist) |
| Change the menu key | [Keybind](configuration/basic#menu-keybind) |
| Monitor server resources | [Resource Monitor](features/resource-monitor) |
| View player statistics | [Player Statistics](features/player-statistics) |
| Check network stats | [Network Monitor](features/network-monitor) |
| Update EasyAdmin | [Updating](updates/updating) |

---

## Documentation Structure

| Section | Contents |
|---------|----------|
| **Getting Started** | Installation, basic configuration, permissions setup |
| **Discord Integration** | Bot setup, commands, logging, chat bridge, server status |
| **Configuration** | Webhooks, commands, action history, backups, shortcuts, advanced options |
| **Features** | Ban list, reports, screenshots, reminders, statistics, monitoring tools |
| **NUI** | Design system, page descriptions, known issues |
| **Plugins** | Runtime plugin system — schema-driven UI extensions |
| **Reference** | Complete convar, permission, and command listings |
| **Updates** | How to update EasyAdmin and handle breaking changes |
| **Troubleshooting** | Common issues and solutions |

---

## Need Help?

- [GitHub Issues](https://github.com/Blumlaut/EasyAdmin/issues) -- Report bugs or request features
- [Troubleshooting](troubleshooting) -- Common problems and solutions
- [Discord Community](https://discord.gg/easyadmin) -- Get help from the community
