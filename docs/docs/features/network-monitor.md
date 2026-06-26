# Network Monitor

The Network Monitor displays real-time and historical network statistics for all connected players, including ping, jitter, and packet loss.

## Metrics

| Metric | Description |
|--------|-------------|
| Ping | Round-trip time to the server (milliseconds) |
| Jitter | Variation in ping times (milliseconds) |
| Packet Loss | Percentage of lost packets |

## Color Thresholds

| Status | Ping | Packet Loss |
|--------|------|-------------|
| Good | 0-60 ms | 0-1% |
| Warning | 61-120 ms | 1-5% |
| Bad | 121+ ms | 5%+ |

## Time Ranges

The Network Monitor displays data for the following time ranges:

- 1 hour
- 6 hours
- 24 hours
- 7 days

## Data Collection

Network statistics are collected every 15 minutes and retained for 120 days. Data is stored in `data/statistics/network.json`.

## Permissions

| Permission | Description |
|------------|-------------|
| `easyadmin.server.network.monitor` | Access the Network Monitor page |

## API

| Export | Description |
|--------|-------------|
| `EasyAdmin:getCurrentNetworkStats()` | Get current network statistics for all players |

## Events

| Event | Description |
|-------|-------------|
| `EasyAdmin:requestNetworkStats` | Request current network statistics |
