// Known expensive FiveM patterns. Shown as IDE-style hover tooltips in code snippets.

export interface SnippetHint {
  pattern: RegExp
  label: string
  description: string
}

export const KNOWN_PATTERNS: SnippetHint[] = [
  // Network events
  {
    pattern: /\bTriggerServerEvent\b/,
    label: 'TriggerServerEvent',
    description:
          'Sends a message from a player to the server. Every call converts the arguments into a data packet and sends it over the network. If you call this in a loop or send large amounts of data, the server will spend a lot of time processing those messages. Try to batch multiple updates into a single call, or add a delay between calls.',
  },
  {
    pattern: /\bTriggerClientEvent\b/,
    label: 'TriggerClientEvent',
    description:
          'Sends a message from the server to one or all players. Each player receives a separate copy of the message, so the cost grows with the number of players connected. If you only need to reach a specific player, always target them directly instead of broadcasting to everyone.',
  },
  {
    pattern: /\bTriggerEvent\b/,
    label: 'TriggerEvent',
    description:
          'Fires an event within the same context, either client to client or server to server. This is faster than sending messages across the network, but it still requires the server to route the event to its handlers. Avoid calling this inside loops that run every frame.',
  },
  {
    pattern: /\bRegisterServerEvent\b/,
    label: 'RegisterServerEvent',
    description:
          'Defines a function that runs when a player sends an event to the server. The function runs on the main server thread, so slow code here will delay every other resource. If many players can trigger this at once, consider limiting how often it runs or storing results so you do not need to recalculate them.',
  },
  {
    pattern: /\bRegisterClientEvent\b/,
    label: 'RegisterClientEvent',
    description:
          'Defines a function that runs when the server sends an event to a player. The function runs on the player rendering thread, so expensive operations here can cause visible stutter or frame drops.',
  },
  {
    pattern: /\bRegisterNetEvent\b/,
    label: 'RegisterNetEvent',
    description:
          'A generic name for RegisterServerEvent and RegisterClientEvent. The server picks the right one based on which side the code runs. The same performance rules apply.',
  },
  {
    pattern: /\bRegisterNUICallback\b/,
    label: 'RegisterNUICallback',
    description:
          'Handles requests from the in-game interface to Lua code. Each request crosses a bridge between the browser and the game engine, which adds overhead. Keep the code inside these handlers short and fast. Move heavy work to background tasks instead.',
  },
  {
    pattern: /\bSendNUIMessage\b/,
    label: 'SendNUIMessage',
    description:
          'Sends data from Lua to the in-game interface. The data is converted to a text format before it crosses the bridge to the browser. Avoid sending large amounts of data or calling this in tight loops.',
  },
  {
    pattern: /\bSendNUIMessageAndWait\b/,
    label: 'SendNUIMessageAndWait',
    description:
          'Like SendNUIMessage, but the script pauses and waits for the interface to respond before continuing. This can stall the server tick if the response takes too long. Use this only when the result is needed immediately.',
  },

  // HTTP
  {
    pattern: /\bPerformHttpRequest\b/,
    label: 'PerformHttpRequest',
    description:
          'Makes a web request to an external URL. The request runs in the background, but the response handler runs on the main server thread. Large responses or many requests at once will slow down the server while it processes the data.',
  },

  // JSON
  {
    pattern: /\bjson\.encode\b/,
    label: 'json.encode',
    description:
          'Converts a Lua table into a JSON string. The time it takes depends on the size and depth of the table. Avoid encoding large tables on every server tick.',
  },
  {
    pattern: /\bjson\.decode\b/,
    label: 'json.decode',
    description:
          'Converts a JSON string back into a Lua table. Longer strings take more time to parse. Repeatedly decoding large strings in performance-sensitive code will show up in the profiler.',
  },

  // Player lookups
  {
    pattern: /\bGetPlayerFromServerId\b/,
    label: 'GetPlayerFromServerId',
    description:
          'Converts a player seat number into a network identifier. Fast by itself, but calling it many times in a loop adds up quickly.',
  },
  {
    pattern: /\bGetPlayerIdentifier\b/,
    label: 'GetPlayerIdentifier',
    description:
          'Retrieves a unique identifier for a player, such as their license or Steam ID. This allocates a new string each time it is called. Store the identifier in a variable if you need it more than once.',
  },
  {
    pattern: /\bGetPlayerName\b/,
    label: 'GetPlayerName',
    description:
          'Returns the display name of a player. Each call creates a new string in memory. Cache the name if you use it frequently.',
  },
  {
    pattern: /\bGetPlayerPed\b/,
    label: 'GetPlayerPed',
    description:
          'Returns the game character handle for a player. Very fast by itself, but it is often used together with other functions that check positions or distances, which can be expensive.',
  },

  // Entity and world queries
  {
    pattern: /\bGetEntityCoords\b/,
    label: 'GetEntityCoords',
    description:
          'Returns the world position of an object, character, or vehicle. Fast for a single entity, but calling it on thousands of entities every tick will slow the server down.',
  },
  {
    pattern: /\bGetDistanceBetweenCoords\b/,
    label: 'GetDistanceBetweenCoords',
    description:
          'Calculates the flat distance between two points in the world. The calculation itself is fast, but it becomes a bottleneck when you call it inside nested loops that check many entities against many positions.',
  },
  {
    pattern: /\bGetClosestPlayer\b/,
    label: 'GetClosestPlayer',
    description:
          'Checks every connected player to find the one closest to a given position. The work grows with the number of players, so avoid calling this every frame or inside loops.',
  },
  {
    pattern: /\bGetPlayers\b/,
    label: 'GetPlayers',
    description:
          'Returns a list of all connected player identifiers. A new list is created each time this function is called. If you need to loop through the players multiple times, store the list in a variable first.',
  },
  {
    pattern: /\bGetAllVehicles\b/,
    label: 'GetAllVehicles',
    description:
          'Returns every vehicle currently loaded in the world. This can return hundreds of entries. Looping through all of them and running checks on each one is a common cause of high server load.',
  },
  {
    pattern: /\bGetAllPeds\b/,
    label: 'GetAllPeds',
    description:
          'Returns every character currently loaded in the world, including NPCs. Similar to GetAllVehicles, this is very expensive when you combine it with per-character logic in a loop that runs every tick.',
  },
  {
    pattern: /\bGetNumberOfPlayers\b/,
    label: 'GetNumberOfPlayers',
    description:
          'Returns how many players are currently connected. Very fast and safe to call as often as you need.',
  },

  // File access
  {
    pattern: /\bLoadResourceFile\b/,
    label: 'LoadResourceFile',
    description:
          'Reads the contents of a file from a resource folder. This blocks the script while the file is being read. For files you access often, load them once and store the result in a variable.',
  },
  {
    pattern: /\bGetResourceState\b/,
    label: 'GetResourceState',
    description:
          'Checks whether a resource is running or stopped. Very fast and safe to call frequently.',
  },

  // Timers and scheduling
  {
    pattern: /\bSetTimeout\b/,
    label: 'SetTimeout',
    description:
          'Schedules a function to run once after a delay. The function runs on the main server thread when the time is up. Having too many overlapping timeouts can add noticeable overhead.',
  },
  {
    pattern: /\bSetInterval\b/,
    label: 'SetInterval',
    description:
          'Repeats a function at a fixed interval. Each run happens on the main server thread. Intervals that run often or take a long time to finish are a common source of server lag.',
  },
  {
    pattern: /\bCitizen\.Wait\b/,
    label: 'Citizen.Wait',
    description:
          'Pauses the current script for a set amount of time without blocking other scripts. This is the correct way to add delays in loops. Using busy waiting or long calculations instead will freeze the script.',
  },

  // Common Lua patterns
  {
    pattern: /\bpairs\s*\(\b/,
    label: 'pairs()',
    description:
          'Loops through every entry in a table. The time it takes depends on how many entries are left in the table. If you use this inside a loop that runs every tick, large tables will consume most of the CPU time.',
  },
  {
    pattern: /\bipairs\s*\(\b/,
    label: 'ipairs()',
    description:
          'Loops through numbered entries in a table, stopping at the first empty slot. Like pairs, the cost grows with the size of the table.',
  },
  {
    pattern: /\bstring\.gmatch\b/,
    label: 'string.gmatch',
    description:
          'Searches a string for all matches of a pattern. Each match creates a small object in memory. Using this repeatedly in performance-sensitive code can cause the garbage collector to run more often.',
  },
  {
    pattern: /\btable\.insert\b/,
    label: 'table.insert',
    description:
          'Adds an item to a table. Adding to the end is fast. Adding at the beginning is slow because every existing item must shift over by one. Always add to the end when you can.',
  },
]
