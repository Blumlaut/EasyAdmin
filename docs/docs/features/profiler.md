# Profiler

The Profiler page displays real-time performance data for all running resources, including CPU tick usage and memory consumption.

## Data Source

The Profiler reads data from the FiveM server profiler endpoint. By default, EasyAdmin attempts to auto-detect the endpoint using `GetCurrentServerEndpoint()` or common ports (30120, 30121, etc.).

If auto-detection fails, override the endpoint:

```
set ea_profilerEndpoint "127.0.0.1:30120"
```

## Metrics

| Metric | Description |
|--------|-------------|
| CPU Tick | CPU time used by the resource (milliseconds) |
| Memory | Memory consumed by the resource |
| Status | Current running state |

## Permissions

| Permission | Description |
|------------|-------------|
| `easyadmin.server.resources.monitor` | Access the Profiler page |

## Configuration

| Convar | Default | Description |
|--------|---------|-------------|
| `ea_profilerEndpoint` | (auto-detect) | Override the profiler HTTP endpoint. Format: `host:port` |
