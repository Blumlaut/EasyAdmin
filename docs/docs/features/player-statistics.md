# Player Statistics

Player Statistics shows long-term analytics about your players: how many are online, when your server peaks, and how much time each player spends playing. It is one of two pages under the Statistics menu, alongside [Network Monitor](../network-monitor).

## Time Range

Choose how far back the page looks:

- 7 days
- 30 days (default)
- 90 days
- 120 days

The charts, top-player lists and player registry all follow the selected range.

## Summary Cards

Six cards at the top of the page give an at-a-glance overview:

| Card | What it shows |
|------|---------------|
| Unique Players | How many different players have been tracked |
| New Players | Players connecting for the first time |
| Returning Players | Players who have connected more than once, with the retention rate |
| Avg Session | Average session length, plus the median and the shortest and longest sessions |
| Total Sessions | Total number of connections recorded |
| Total Playtime | Combined playtime across all players |

## Player Activity Chart

The main chart plots player counts across the selected range.

- For the 7-day range it shows every 15-minute reading, with a dotted average ping line.
- For 30, 90 and 120 days it shows one point per day, plotting the highest, average and lowest player counts for that day, again with average ping.

The dotted ping line is hidden when no ping data is available for the range.

## Top Players

Two bar charts list the five players with the most sessions and the most total playtime (in minutes) for the selected range.

## Player Registry

A searchable, sortable table of tracked players:

| Column | What it shows |
|--------|---------------|
| Player | Player name |
| First Seen | Date the player first connected |
| Last Seen | Date the player most recently connected |
| Sessions | Number of times the player has connected |
| Total Playtime | Total time the player has spent on the server |
| Avg Session | Average length of one session |

Type in the search box to find a player by name, or click a column heading to sort. The table shows 20 players per page and lists players first seen within the selected time range.

## Storage

Statistics are saved as JSON files in `data/statistics/`:

- `players.json` — player count readings and the player registry
- `network.json` — network data for the Network Monitor
- `world.json` — entity and world data

Entries older than 120 days are removed automatically.

## Permissions

| Permission | Description |
|------------|-------------|
| `easyadmin.server.statistics.view` | Open the Player Statistics page |
