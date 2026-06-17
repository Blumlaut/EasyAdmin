# Profiler Integration — Design Document

**Status:** Draft  
**Target:** EasyAdmin 8.x (React NUI)

---

## FiveM References

| Topic | Documentation |
|-------|---------------|
| Profiler | [Using the Profiler](https://docs.fivem.net/docs/scripting-manual/debugging/using-profiler/) |
| ExecuteCommand | Server-side console command execution (Lua native) |
| PerformHttpRequest | [PerformHttpRequest](https://docs.fivem.net/docs/scripting-reference/runtimes/lua/functions/PerformHttpRequest/) |
| Resource manifest | [Resource Manifest Reference](https://docs.fivem.net/docs/scripting-reference/resource-manifest/) |
| NUI callbacks | [NUI Callbacks](https://docs.fivem.net/docs/scripting-manual/nui-development/nui-callbacks/) |
| SendNUIMessage | [SendNUIMessage](https://docs.fivem.net/docs/scripting-reference/runtimes/lua/functions/SendNUIMessage/) |

### Key FiveM Constraints

- **`profiler record <frames>`** — Starts recording. Blocks until recording begins, then returns. The recording runs asynchronously across the specified number of frames.
- **`profiler status`** — Returns current profiler state (recording/idle) and frame count. Can be polled to check progress.
- **`profiler view`** — Generates the profile output. On the server, this creates a `profileData.json` endpoint accessible via HTTP at `http://<server_endpoint>/profileData.json`.
- **`profiler saveJSON <filename>`** — Saves profile to disk. **PoC confirmed: Lua `io` is fully sandboxed** and cannot read files outside the resource directory. This approach is not viable.
- **`ExecuteCommand`** — Server-side only. Executes a console command from Lua. Available in server context. Output is printed to server logs but **cannot be captured or polled programmatically** (PoC confirmed: `profiler status` output is visible in logs but not accessible from Lua).
- **`PerformHttpRequest`** — The **only viable method** for retrieving profiler data. After `profiler view`, the server exposes `profileData.json` on its HTTP endpoint. PoC confirmed that `io.open()` cannot read any server data files, so HTTP fetch is mandatory.
- **`GetCurrentServerEndpoint()`** — Client-side native. Returns the server's public endpoint as a string in `ip:port` format (e.g. `"192.168.178.23:30120"`). This is the primary mechanism for discovering the profiler HTTP endpoint.
- **Profiler data format** — Chrome DevTools tracing format. The JSON is an **object with a `traceEvents` key**: `{"traceEvents": [...]}`. Each event has `name`, `ph` (phase: `B`=begin, `E`=end, `I`=instant, `M`=metadata, `O`=other), `ts` (relative timestamp in microseconds), `pid`, `tid`, and optional `args`.
- **`PerformHttpRequest` to `http://127.0.0.1:<port>/profileData.json`** — **PoC confirmed working** from server-side Lua. Returns 200 OK with valid JSON. 3 seconds after `profiler view` is sufficient for the file to be ready.

---

## Problem Statement

Server admins need to identify which resources are causing performance issues (hitches, slow ticks). The FiveM profiler provides per-resource tick times and per-thread breakdowns with exact file paths and line numbers, but its output is only viewable in Chrome DevTools — a manual, developer-oriented workflow.

EasyAdmin should expose this data in an accessible, self-explanatory UI that any server admin can use, regardless of technical expertise.

---

## Profiler Data Schema

### Raw Format (Chrome Tracing)

The profiler outputs a JSON object with a `traceEvents` key. **PoC confirmed**: the structure is `{"traceEvents": [...]}` (NOT a top-level array).

```typescript
interface ProfilerRawJSON {
  traceEvents: TraceEvent[]
}

interface TraceEvent {
  // Event name — resource ticks follow this pattern:
  //   "tick (resourceName)"        — per-resource tick boundary
  //   "thread @resource/file.lua[10..25]" — per-thread execution
  //   "Resource Manager Tick"      — entire resource tick block boundary
  //   "BeginFrame" / "DrawFrame"   — frame boundaries
  //   "process_name" / "thread_name" — metadata events (ph="M")
  //   "TracingStartedInBrowser"    — tracing start marker (ph="I")
  name: string

  // Phase: 'B' = begin, 'E' = end, 'I' = instant, 'M' = metadata
  // Other phases exist but are not relevant for resource profiling
  ph: 'B' | 'E' | 'I' | 'M' | 'O' | 'S' | 'T' | 'C' | 'R' | 'N' | 'X' | 'F' | 'G' | 'P' | 'U' | 'Q'

  // Relative timestamp in microseconds (from profile start)
  ts: number

  // Process and thread IDs
  pid: number
  tid: number

  // Optional arguments (metadata events use args.name for process/thread names)
  args?: Record<string, unknown>
  cat?: string   // Category, e.g. "__metadata", "blink.user_timing"
}
```

### Parsed Schema (what EasyAdmin extracts and displays)

```typescript
// --- Top-level profile summary ---

interface ProfileSummary {
  framesCaptured: number         // Total frames recorded
  frameTimes: {                  // Frame-to-frame timing
    avgMs: number                // Average frame time in ms
    minMs: number
    maxMs: number
    fps: number                  // Derived: 1000 / avgMs
  }
  totalTickTime: {               // Sum of all resource ticks per frame (avg)
    avgUs: number                // Average total tick time per frame in microseconds
    maxUs: number
  }
}

// --- Per-resource tick data ---

interface ResourceTickData {
  name: string                   // Resource name (e.g. "EasyAdmin")
  tickCount: number              // Number of ticks across all frames
  totalUs: number                // Total time spent in ticks (μs)
  avgUs: number                  // Average tick time (μs)
  maxUs: number                  // Worst single tick (μs)
  minUs: number                  // Best single tick (μs)
  pctOfTotal: number             // Percentage of total tick time (0-100)
  threads: ThreadTickData[]      // Thread-level breakdown (only if profiler captured them)
}

// --- Per-thread tick data ---

interface ThreadTickData {
  label: string                  // Full label: "thread @resource/file.lua[10..25]"
  resource: string               // Extracted resource name
  filePath: string               // Extracted file path (e.g. "server/admin_server.lua")
  lineRange: string              // Extracted line range (e.g. "10..25")
  durationUs: number             // This thread's execution time in μs
}

// --- Complete parsed profile ---

interface ParsedProfile {
  summary: ProfileSummary
  resources: ResourceTickData[]  // Sorted by totalUs descending
  capturedAt: number             // Unix timestamp (ms) when profile was captured
}
```

### Parsing Rules

1. **Resource tick pairing**: For each `tick (name)` event with `ph: 'B'`, find the next `tick (name)` with `ph: 'E'` for the same resource. Duration = `E.ts - B.ts`. Resources can tick multiple times per frame (e.g., `monitor` ticks twice in some frames).

2. **Thread extraction**: Events named `thread @resource/file.lua[start..end]` are parsed with regex `/^thread @([^\/]+)\/(.+)\[(\d+)\.\.(\d+)\]$/`. Groups: [full match, resource, file, startLine, endLine].

3. **Frame times**: `BeginFrame` events mark frame starts. Frame time = difference between consecutive `BeginFrame` timestamps. FPS = `1000 / avgFrameTimeMs`.

4. **Percentage of total**: For each resource, `pctOfTotal = (resource.totalUs / totalTickTimePerFrame * frameCount) * 100`. This shows what fraction of total server tick budget each resource consumes.

5. **Sorting**: Resources sorted by `totalUs` descending (highest CPU consumers first).

---

## Endpoint Discovery

### The Problem

The profiler's `profileData.json` is served on the server's HTTP endpoint. We need the full `ip:port` to construct the URL `http://<ip>:<port>/profileData.json`.

### Primary: `GetCurrentServerEndpoint()` (client-side native) → extract port → use `127.0.0.1`

**`GetCurrentServerEndpoint()`** is a client-side Lua native that returns the server's public endpoint as a string in `ip:port` format (e.g., `"192.168.178.23:30120"`). We extract the **port** from this and construct `http://127.0.0.1:<port>/profileData.json` on the server side.

**Why `127.0.0.1` and not the public IP?** PoC confirmed that `http://127.0.0.1:30120/profileData.json` works from server-side `PerformHttpRequest`. The profiler's HTTP endpoint listens on localhost.

**Flow:**
1. NUI calls `callLua('startProfiler', { frames: 50 })`
2. Client Lua calls `GetCurrentServerEndpoint()` → `"192.168.178.23:30120"`
3. Client extracts port: `tonumber(string.match(endpoint, ':(%d+)'))` → `30120`
4. Client sends to server: `TriggerServerEvent('EasyAdmin:startProfiler', { frames: 50, port: 30120 })`
5. Server constructs: `http://127.0.0.1:30120/profileData.json`
6. After `profiler view` + 3s wait, server fetches from that URL

**Client-side implementation:**
```lua
-- client/nui/profiler.lua
RegisterNUICallback('startProfiler', function(data, cb)
  cb({ ok = true })
  local endpoint = GetCurrentServerEndpoint()  -- "192.168.178.23:30120"
  local port = nil
  if endpoint and endpoint ~= '' then
    port = tonumber(string.match(endpoint, ':(%d+)'))
  end
  TriggerServerEvent('EasyAdmin:startProfiler', {
    frames = data.frames or 50,
    port = port  -- nil if GetCurrentServerEndpoint failed
  })
end)
```

### Fallback 1: Common port probing (server-side)

If `GetCurrentServerEndpoint()` returns nil/empty (shouldn't happen in normal operation), the server probes common FiveM ports on `127.0.0.1`. PoC confirmed that `http://127.0.0.1:30120/profileData.json` works reliably.

```lua
local function probePort(port, cb)
  PerformHttpRequest('http://127.0.0.1:' .. port .. '/info.json', function(errorCode) 
    cb(errorCode == 200)
  end, 'GET')
end
```

Probing order: 30120, 30121, 30122, 30110, 30111, 30130, 30140. Sequential async calls — first 200 response wins.

### Fallback 2: Convar override (`$ea_profilerEndpoint`)

If both methods fail, check for a hardcoded convar:

```lua
local convarEndpoint = GetConvar('ea_profilerEndpoint', '')
-- Expected format: "127.0.0.1:30120" or "0.0.0.0:30120"
```

This is set in `server.cfg`: `set ea_profilerEndpoint "127.0.0.1:30120"`

### Failure handling

If ALL methods fail, the profiler button is disabled and an error banner is shown at the top of the page instructing the user to set `$ea_profilerEndpoint` in `server.cfg`. No manual input field — the admin must fix it in config.

---

## Architecture

### Data Flow

```
[NUI: ProfilerPage]
    │
    │  callLua('startProfiler', { frames: 50 })
    ▼
[Lua: client/nui/profiler.lua]  ── RegisterNUICallback ──►
    │
    │  GetCurrentServerEndpoint() → "192.168.178.23:30120"
    │  TriggerServerEvent('EasyAdmin:startProfiler', { frames, endpoint })
    ▼
[Lua: server/profiler.lua]      ── RegisterServerEvent ──►
    │
    │  1. Resolve endpoint (use client value, or probe, or convar)
    │  2. ExecuteCommand('profiler record <frames>')
    │  3. Poll ExecuteCommand('profiler status') until done
    │  4. ExecuteCommand('profiler view')
    │  5. PerformHttpRequest to http://<endpoint>/profileData.json
    │  6. Parse trace events → ParsedProfile
    │  7. TriggerClientEvent('EasyAdmin:profilerResult', src, parsedProfile, detectionResult)
    ▼
[Lua: client/nui/profiler.lua]  ── SendNUIMessage ──►
    │
    │  { action: 'profilerResult', data: { profile, detection } }
    │  { action: 'profilerProgress', data: { phase, message } }
    ▼
[NUI: ProfilerPage]
    │
    │  on('profilerResult', handler) → set profile state → render
    │  on('profilerProgress', handler) → update progress indicator
    │  detection.warning → show warning banner if present
```

### File Structure

```
server/
  profiler.lua                    # New: profiler orchestration + parsing

client/
  nui/
    profiler.lua                  # New: NUI callbacks + event relay

nui/src/
  pages/
    Profiler/
      ProfilerPage.tsx            # New: main profiler page component
      components/
        ResourceTickBar.tsx       # New: horizontal bar chart per resource
        ThreadDetailRow.tsx       # New: expandable thread detail row
        ProfileSummary.tsx        # New: summary stats cards
        ProfilerEmptyState.tsx    # New: initial state / no profile yet
        EndpointWarning.tsx       # New: warning banner + manual endpoint input
```

---

## UI Design

### Navigation Changes

The "Resources" nav item becomes a **dropdown** (using the existing `NavItem.children` pattern from `Navigation.tsx`):

```typescript
{
  id: 'resources',
  label: 'Resources',
  icon: 'layers',
  children: [
    { id: 'resources', label: 'Resource List', icon: 'layers' },
    { id: 'profiler', label: 'Profiler', icon: 'activity' },
  ],
}
```

This mirrors the existing "Statistics" dropdown pattern. The dropdown auto-expands when a child is active.

### Page Layout

The Profiler page has four states:

#### State 0: Endpoint unavailable (error)

Shown when all endpoint discovery methods fail. The profile button is disabled.

```
┌─────────────────────────────────────────────────────┐
│  Profiler                                            │
│  Server-side resource performance analysis           │
│                                                      │
│  ┌─ Error ─────────────────────────────────────────┐ │
│  │  ⚠️ Could not determine the server endpoint.    │ │
│  │     Profiling is unavailable.                    │ │
│  │                                                  │ │
│  │     Add this to your server.cfg:                 │ │
│  │     set ea_profilerEndpoint "127.0.0.1:30120"   │ │
│  │                                                  │ │
│  │     Replace 30120 with your actual server port.  │ │
│  └──────────────────────────────────────────────────┘ │
└─────────────────────────────────────────────────────┘
```

#### State 1: Empty (no profile captured)

```
┌─────────────────────────────────────────────────────┐
│  Profiler                                            │
│  Server-side resource performance analysis           │
│                                                      │
│  ┌─────────────────────────────────────────────────┐ │
│  │  ⚡  Profile your server                        │ │
│  │                                                 │ │
│  │  Capture a snapshot of resource tick times to   │ │
│  │  identify which scripts are using the most      │ │
│  │  server CPU.                                    │ │
│  │                                                 │ │
│  │  ┌────────────────┐  ┌────────────────┐        │ │
│  │  │ Frames: [50 ▼] │  │  ▶ Start       │        │ │
│  │  │                │  │  Profile       │        │ │
│  │  └────────────────┘  └────────────────┘        │ │
│  │                                                 │ │
│  │  ⓘ Captures 50 server frames (~3 seconds).     │ │
│  │     Profiling adds slight overhead during       │ │
│  │     the capture window.                        │ │
│  └─────────────────────────────────────────────────┘ │
└─────────────────────────────────────────────────────┘
```

**Hover hints** (via CSS `title` attribute or a custom tooltip component):
- "Frames" dropdown: "Number of server frames to record. More frames = more accurate averages but longer capture time."
- Start button: "Triggers a server-side profiler recording. Results appear below when complete."

#### State 2: Recording (progress)

```
┌─────────────────────────────────────────────────────┐
│  Profiler                                            │
│                                                      │
│  ┌─────────────────────────────────────────────────┐ │
│  │  ⏳ Profiling in progress...                    │ │
│  │                                                 │ │
│  │  Phase: Recording frames (12/50)               │ │
│  │  ███████████████████░░░░░░░░░░░░░░░░░░░░  24%  │ │
│  │                                                 │ │
│  │  ⓘ This typically takes 2-5 seconds.           │ │
│  └─────────────────────────────────────────────────┘ │
└─────────────────────────────────────────────────────┘
```

#### State 3: Results

```
┌─────────────────────────────────────────────────────┐
│  Profiler                                            │
│                                                      │
│  ┌─ Summary ──────────────────────────────────────┐ │
│  │  50 frames  │  avg 62.2ms  │  16.1 FPS        │ │
│  │  total tick: 7404μs/frame                      │ │
│  │                        [▶ New Profile]          │ │
│  └─────────────────────────────────────────────────┘ │
│                                                      │
│  ┌─ Resource Tick Times ─────────────────────────┐ │
│  │  ⓘ Time each resource spends executing per    │ │
│  │     server frame. Higher = more CPU usage.    │ │
│  │                                               │ │
│  │  monitor        ████████████░░░░░░░  43.7μs   │ │
│  │                    33% of total                │ │
│  │    ▼ thread @monitor/sv_main.lua[484..489] 89μs│ │
│  │    ▼ thread @monitor/sv_playerlist.lua[..] 57μs│ │
│  │                                               │ │
│  │  EasyAdmin      ██████░░░░░░░░░░░  30.9μs    │ │
│  │                    23% of total                │ │
│  │    ▼ thread @EasyAdmin/admin_server.lua[..] 17μs│ │
│  │                                               │ │
│  │  yarn           █████░░░░░░░░░░░░  28.5μs    │ │
│  │                    22% of total                │ │
│  │                                               │ │
│  │  runcode        ████░░░░░░░░░░░░░  16.5μs    │ │
│  │                    9% of total                 │ │
│  │                                               │ │
│  │  webpack        ████░░░░░░░░░░░░░  16.2μs    │ │
│  │                    9% of total                 │ │
│  └─────────────────────────────────────────────────┘ │
└─────────────────────────────────────────────────────┘
```

### Component Details

#### ResourceTickBar

Each resource renders as a horizontal bar row:

```
┌─ ResourceTickBar ─────────────────────────────────┐
│  [resource name]  [bar]  [avg μs]  [badge: %]     │
│  [▼ expand threads]                                │
│  ┌─ ThreadDetailRow ───────────────────────────┐  │
│  │  📄 sv_main.lua:484-489      89μs           │  │
│  │  📄 sv_playerlist.lua:112-134  57μs         │  │
│  └─────────────────────────────────────────────┘  │
└────────────────────────────────────────────────────┘
```

- **Bar width**: proportional to `avgUs` relative to the highest `avgUs` resource (100% = widest)
- **Color coding**:
  - `< 20μs` → `--accent-green` (healthy)
  - `20-50μs` → `--accent-blue` (normal)
  - `50-100μs` → `--accent-orange` (elevated)
  - `> 100μs` → `--accent-red` (hot — likely causing hitches)
- **Expand/collapse**: click the resource row to toggle thread details
- **Hover hints**:
  - Resource name: "Total ticks: N, Max: Xμs, Min: Yμs"
  - Percentage badge: "This resource uses X% of total server tick time"
  - Thread row: "This code block ran for Xμs. File: resource/file.lua, lines Y-Z"

#### ProfileSummary

Compact stat cards showing:
- Frames captured
- Average frame time (ms) + FPS
- Total tick time per frame (μs)
- "Captured at" timestamp
- "New Profile" button

#### ProfilerErrorBanner

Shown only when ALL endpoint discovery methods fail (State 0). Displays the `ea_profilerEndpoint` convar instruction. No interactive input — the admin must fix it in `server.cfg`.
```

---

## Implementation Plan

### Phase 1: Client-side NUI relay (endpoint discovery entry point)

**File:** `client/nui/profiler.lua`

1. `RegisterNUICallback('startProfiler', ...)` → call `GetCurrentServerEndpoint()` → extract port → forward `{ frames, port }` to server
2. Event handlers for `EasyAdmin:profilerProgress` and `EasyAdmin:profilerResult` → `SendNUIMessage`

### Phase 2: Server-side profiler module

**File:** `server/profiler.lua`

1. **Endpoint resolution** (`resolveEndpoint(clientPort)`):
   - If `clientPort` from `GetCurrentServerEndpoint()` is provided → use `127.0.0.1:<port>`
   - If nil → probe common ports (30120, 30121, 30122, 30110, 30111, 30130, 30140) via `PerformHttpRequest` to `/info.json`
   - If probing fails → check `GetConvar('ea_profilerEndpoint', '')`
   - If all fails → return `nil` (triggers error state in UI)
   - Cache successful port in module-level variable

2. **Profile capture** (`captureProfile(frames, port, cb)`):
   - Resolve port: use client-provided port from `GetCurrentServerEndpoint()`, or probe fallback
   - Construct URL: `http://127.0.0.1:<port>/profileData.json`
   - `ExecuteCommand('profiler record ' .. frames)`
   - **Cannot poll `profiler status`** — output goes to server logs, not capturable from Lua (PoC confirmed)
   - Use `SetTimeout` with estimated wait: `frames * 50ms` (at 20Hz), minimum 1000ms. PoC confirmed 20 frames complete in <1s.
   - Send progress updates at 500ms intervals so the UI shows activity
   - When timeout elapses: `ExecuteCommand('profiler view')`
   - Wait 3000ms for `profileData.json` to be generated (PoC confirmed 3s is sufficient)
   - `PerformHttpRequest` to `http://127.0.0.1:<port>/profileData.json`
   - Parse JSON: response is `{"traceEvents": [...]}`, extract `traceEvents` array → call `parseProfile(traceEvents)`

3. **Parser** (`parseProfile(traceEvents)`):
   - Extract `tick (name)` B/E pairs → `ResourceTickData[]`
   - Extract `thread @...` B/E pairs → `ThreadTickData[]`
   - Extract `BeginFrame` timestamps → frame times
   - Compute summary statistics
   - Return `ParsedProfile`

4. **Server event handler**:
   - `RegisterServerEvent('EasyAdmin:startProfiler', function(data))`
   - Permission check: `server.resources.monitor`
   - Resolve endpoint using client-provided value + fallback chain
   - Progress updates via `TriggerClientEvent('EasyAdmin:profilerProgress', src, ...)`
   - Final result via `TriggerClientEvent('EasyAdmin:profilerResult', src, { profile, detection })`

### Phase 3: NUI types

**File:** `nui/src/types.ts` (append)

Add the TypeScript interfaces matching the parsed schema above.

### Phase 4: NUI components

**Files:** `nui/src/pages/Profiler/`

1. `ProfilerPage.tsx` — Main page with state management (empty/recording/results)
2. `ProfileSummary.tsx` — Summary stat cards
3. `ResourceTickBar.tsx` — Per-resource bar chart with expandable threads
4. `ThreadDetailRow.tsx` — Thread-level detail row
5. `ProfilerEmptyState.tsx` — Initial state with controls
6. `ProfilerErrorBanner.tsx` — Error banner shown when endpoint discovery fails

### Phase 5: Navigation integration

**Files:** `nui/src/hooks/useAppNavigation.ts`, `nui/src/App.tsx`, `nui/src/types.ts`

1. Add `'profiler'` to `View` type union
2. Convert `resources` nav item to dropdown with `children: [{ resources }, { profiler }]`
3. Add `profiler` to `viewMap` in `App.tsx`
4. Wire up `ProfilerPage` render in `App.tsx`
5. Add permission gating: `server.resources.monitor`

### Phase 6: CSS

**File:** `nui/src/styles/pages/profiler.css`

- Tick bar track/fill styles (reusing dashboard bar patterns)
- Thread detail row indentation
- Color coding for tick time thresholds
- Progress bar styles
- Empty state layout

---

## Edge Cases & Error Handling

| Scenario | Handling |
|----------|----------|
| `GetCurrentServerEndpoint()` returns nil | Fall back to port probing → convar → error state |
| Profiler not available (old FiveM) | `ExecuteCommand('profiler status')` returns error → show "Profiler not available on this server version" |
| `profileData.json` not found after `profiler view` | Retry 3 times with 500ms delays. If still fails, show error toast + endpoint warning. |
| Profile JSON parse failure | Show "Failed to parse profiler data" with raw error. |
| No tick events in profile | Show "No resource tick data found. The server may have been idle during profiling." |
| Endpoint from client is LAN IP but server fetches via 127.0.0.1 | If `PerformHttpRequest` to client endpoint fails, retry with `127.0.0.1:<port>` as fallback |
| Profiler already recording | `profiler status` shows recording → wait for completion instead of error. |
| Server has 0 players | Profiler still works (server-side only). No special handling needed. |
| Resource ticks multiple times per frame | All ticks are counted individually. `tickCount` reflects total ticks, not frames. |
| Very large profile (1000+ frames) | JSON may be large. Use streaming parse or limit to 200 frames max. |

---

## Performance Considerations

- **Profiler overhead**: The profiler adds measurement overhead during recording. A 50-frame sample (~3 seconds at 20Hz) is the sweet spot — enough for averages, minimal disruption.
- **JSON size**: A 50-frame profile is ~100-200KB. A 200-frame profile can be 500KB+. Cap at 200 frames to keep `PerformHttpRequest` manageable.
- **Parsing**: The parser runs synchronously on the server. For 50 frames with ~5 resources, parsing takes <10ms. No async needed.
- **Port probing**: Probing 4 ports with 1-second timeouts = 4s worst case. Only done once at first profile attempt, then cached.

---

## Permissions

The profiler feature requires the permission:
- `server.resources.monitor`

This is a distinct permission from `server.resources.start`/`server.resources.stop`, allowing admins to grant profiling access without granting resource start/stop access. This is consistent with profiling being a read-only observability operation.

---

## Testing Checklist

- [ ] `GetCurrentServerEndpoint()` returns valid `ip:port` and profiling works
- [ ] Fallback port probing works when `GetCurrentServerEndpoint()` returns nil
- [ ] Convar `$ea_profilerEndpoint` works as last resort
- [ ] Error banner shows when all detection fails, with `ea_profilerEndpoint` instruction
- [ ] Profiler recording completes and returns valid data
- [ ] Profile with 0 resources (fresh server) — graceful empty state
- [ ] Profile with many resources (50+) — sorting and rendering
- [ ] Profile with resources that tick multiple times per frame
- [ ] Thread-level data displays correctly with file/line info
- [ ] Color coding thresholds are visually distinguishable
- [ ] Hover hints appear and contain correct info
- [ ] Progress indicator updates during recording
- [ ] "New Profile" button triggers fresh recording
- [ ] Dropdown navigation auto-expands when Profiler is active
- [ ] Permission gating hides Profiler from non-admins
- [ ] Error states show meaningful messages (port fail, parse fail, etc.)
- [ ] High contrast mode renders correctly
- [ ] Font size scaling (80%-150%) renders correctly
- [ ] CEF rendering: no `transform` in animations, no large box-shadows
