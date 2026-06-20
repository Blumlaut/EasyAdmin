# Plugin API

The plugin API is currently disabled. This page will be updated when the new plugin API is released.

## Available Exports

The following EasyAdmin exports are available for use in other resources:

### Ban Management

| Export | Parameters | Description |
|--------|-----------|-------------|
| `EasyAdmin:addBan` | `playerId, reason, expires, banner` | Add a new ban |
| `EasyAdmin:unbanPlayer` | `banId` | Remove a ban by ID |
| `EasyAdmin:fetchBan` | `banId` | Fetch a ban entry |
| `EasyAdmin:GetFreshBanId` | (none) | Get the next available ban ID |
| `EasyAdmin:IsIdentifierBanned` | `identifier` | Check if an identifier is banned |

### Action History

| Export | Parameters | Description |
|--------|-----------|-------------|
| `EasyAdmin:getActionHistory` | `identifiers` | Get action history for identifiers |

### Screenshots

| Export | Parameters | Description |
|--------|-----------|-------------|
| `EasyAdmin:isScreenshotInProgress` | (none) | Check if a screenshot is in progress |

### Reports

| Export | Parameters | Description |
|--------|-----------|-------------|
| `EasyAdmin:getAllReports` | (none) | Get all active reports |

## Events

Listen for these events in your resource:

| Event | Description |
|-------|-------------|
| `EasyAdmin:reportAdded` | Triggered when a report is filed |
| `EasyAdmin:reportClaimed` | Triggered when a report is claimed |
| `EasyAdmin:reportRemoved` | Triggered when a report is closed |
| `EasyAdmin:addBan` | Triggered when a ban is added |
| `EasyAdmin:LogAction` | Triggered when an action is logged |

## Example Usage

```lua
AddEventHandler('EasyAdmin:reportAdded', function(report)
    print('New report filed: ' .. report.reason)
end)

-- Add a ban programmatically
exports.EasyAdmin:addBan(playerId, 'Cheating detected', os.time() + 3600, 'AdminName')
```
