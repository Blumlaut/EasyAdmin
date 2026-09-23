# Network Monitor

The Network Monitor shows how well each player is connected to your server. It displays the latest readings recorded by the server alongside a chart of how connection quality has changed over time. The chart plots average and worst ping, average jitter, and average packet loss.

## Summary Cards

At the top of the page you get an overview of the latest reading:

| Card | Description |
|------|-------------|
| Players Tracked | Number of players in the latest reading |
| Avg Ping | Average ping across those players (milliseconds) |
| Worst Ping | Highest ping of any player in the reading (milliseconds) |
| Avg Packet Loss | Average packet loss across those players (percent) |

## Metrics

| Metric | Description |
|--------|-------------|
| Ping | Round-trip time to the server (milliseconds) |
| Jitter | Variation in ping times (milliseconds) |
| Last RTT | Round-trip time of the most recent packet (milliseconds) |
| Packet Loss | Percentage of lost packets |

## Player List

The player list shows one row per player:

| Column | Description |
|--------|-------------|
| Player | Player name, or "Offline" if they have disconnected since the last reading |
| Ping | Average round-trip time (milliseconds) |
| Jitter | Variation in ping times (milliseconds) |
| Last RTT | Round-trip time of the most recent packet (milliseconds) |
| Loss | Percentage of packets lost |

Rows are sorted by ping, worst first. Click the Player, Ping, or Loss column heading to sort by that column, and click it again to reverse the order.

Click a player row to expand a chart of that player's own history, and click it again to close it. You can also expand an offline player to review their recorded history.

## Color Thresholds

| Status | Ping | Packet Loss |
|--------|------|-------------|
| Good | 0-60 ms | 0-1% |
| Warning | 61-120 ms | 1-5% |
| Bad | 121+ ms | 5%+ |

## Time Ranges

Charts display data for the following time ranges:

- 1 hour
- 6 hours
- 24 hours (default)
- 7 days

The range buttons sit above the server chart. Use the refresh button next to them to reload the latest readings.

## Data Collection

The server records a network reading every 5 minutes and keeps the results for 120 days. Data is stored in `data/statistics/network.json`.

Current values come from the most recent reading, so they can be up to 5 minutes old. Only the connections measured at that moment are listed.

## Permissions

| Permission | Description |
|------------|-------------|
| `easyadmin.server.network.monitor` | Access the Network Monitor page |
