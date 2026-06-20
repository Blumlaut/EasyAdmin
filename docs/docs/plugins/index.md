# Plugins

The EasyAdmin plugin system is currently disabled. It will be re-implemented in a future release.

## Current Status

The previous plugin system (v1) was removed in EasyAdmin 7.3. A new plugin API is under development.

## What to Expect

When the new plugin system is released, it will support:

- Custom permissions
- Server-side event handlers
- Client-side UI extensions
- Data storage hooks
- Export overrides

## Alternative Approaches

While the plugin system is unavailable, you can extend EasyAdmin using:

- **Server events** — Listen to events like `EasyAdmin:reportAdded`, `EasyAdmin:addBan`, `EasyAdmin:LogAction`
- **Exports** — Use `EasyAdmin:addBan`, `EasyAdmin:unbanPlayer`, `EasyAdmin:getActionHistory`, etc.
- **Custom convars** — Configure existing features via convars
- **Discord bot** — Extend moderation via the Discord bot and its events

## Tracking Progress

Follow the [GitHub repository](https://github.com/Blumlaut/EasyAdmin) for updates on the new plugin system.
