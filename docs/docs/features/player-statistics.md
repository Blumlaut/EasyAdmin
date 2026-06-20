# Player Statistics

Player statistics tracks and displays metrics about player engagement and server population over time.

## Tracked Metrics

- Player join and leave events
- Daily peak player count
- Player session durations
- Connection frequency per player

## Storage

Statistics are stored in `data/statistics/` as JSON files. Data is retained for 120 days.

## Permissions

| Permission | Description |
|------------|-------------|
| `easyadmin.server.statistics.view` | Access the Player Statistics page |

## API

| Export | Description |
|--------|-------------|
| `EasyAdmin:requestPlayerStats()` | Request current player statistics |

## Events

| Event | Description |
|-------|-------------|
| `EasyAdmin:playerStats` | Triggered with player statistics data |
