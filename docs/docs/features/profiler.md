# Profiler

The Profiler page captures a snapshot of how much time each resource spends running on the server. Use it to find the scripts that are using the most CPU and to see which parts of their code are responsible.

## Capturing a profile

1. Choose how many server frames to record (20, 50, 100 or 200 — more frames give a longer, steadier sample).
2. Select **Start Profile**.
3. Wait for the capture to finish. The page shows its progress, and a capture usually takes a few seconds.

Only one capture can run at a time. Profiling adds a small amount of overhead while it runs, so avoid capturing on a busy server unless you need to.

## Data Source

EasyAdmin records the profile using the built-in server profiler, then reads the results back. It works out the server endpoint automatically — from the connected client, or from the port that worked last time — so in most cases you do not need to configure anything. Profiling is unavailable if the endpoint cannot be determined.

If the automatic lookup fails, set the endpoint manually:

```
set ea_profilerEndpoint "127.0.0.1:30120"
```

## Metrics

After a capture finishes, the page shows a summary and a breakdown per resource.

| Metric | Description |
|--------|-------------|
| Frames | Number of frames recorded in this capture |
| Avg Frame | Average server frame time, in milliseconds |
| FPS | Server frame rate during the capture |
| Total Tick | Average total time spent in resource ticks per frame, in microseconds (μs) |

The **Resource Tick Times** list then breaks that total down per resource:

| Column | Description |
|--------|-------------|
| Bar | Relative amount of server time the resource uses |
| Average tick | Time the resource takes per tick, in microseconds (μs) |
| Percent | Share of the total server tick time the resource accounts for |

Resources are sorted with the heaviest first. Hover a resource to see its tick count and its slowest and fastest tick.

Expand a resource to see the individual code blocks that ran during the capture, each with the time it took. Selecting a block opens the matching source so you can find the slow line directly.

Tick times are shown in microseconds (μs), not milliseconds — 1,000 μs equals 1 ms. A resource in the tens of microseconds is normal; one in the hundreds is worth a look.

## Permissions

| Permission | Description |
|------------|-------------|
| `easyadmin.server.resources.monitor` | Access the Profiler page |

## Configuration

| Convar | Default | Description |
|--------|---------|-------------|
| `ea_profilerEndpoint` | `""` (unset — endpoint is detected automatically) | Override the profiler HTTP endpoint. Format: `host:port` |
