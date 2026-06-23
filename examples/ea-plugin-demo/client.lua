-- ea-plugin-demo client script
-- Registers the plugin with EasyAdmin and handles all client-side render actions.

-- ---------------------------------------------------------------------------
-- Plugin registration
-- ---------------------------------------------------------------------------

exports['easyadmin']:RegisterPlugin({
  id = 'ea-plugin-demo',
  name = 'Plugin Demo',
  version = '1.0.0',
  icon = 'box',

  -- Permissions:
  --   plugin.demo          — gates the entire plugin (optional)
  --   plugin.demo.advanced — gates the "Advanced" player tab + server handler
  --
  -- The `permission` field on the plugin config hides ALL contributions if
  -- the admin lacks it. Uncomment below to test that:
  -- permission = 'plugin.demo',

  navItems = {
    -- Single-page entry: opens the main demo page
    { id = 'plugin:ea-plugin-demo', label = 'Demo', icon = 'box' },

    -- Multi-page entry: opens the stats page
    { id = 'plugin:ea-plugin-demo:stats', label = 'Stats', icon = 'chart-bar' },

    -- Multi-page entry: opens the actions page
    { id = 'plugin:ea-plugin-demo:actions', label = 'Actions', icon = 'zap' },
  },

  pages = {
    { view = 'plugin:ea-plugin-demo', renderAction = 'renderMainPage' },
    { view = 'plugin:ea-plugin-demo:stats', renderAction = 'renderStatsPage' },
    { view = 'plugin:ea-plugin-demo:actions', renderAction = 'renderActionsPage' },
  },

  playerDetailTabs = {
    -- Public tab: visible to anyone who can open the player detail
    { id = 'demo-public', label = 'Demo', icon = 'box', renderAction = 'renderPlayerTab' },

    -- Advanced tab: only visible if admin has the permission
    {
      id = 'demo-advanced',
      label = 'Advanced',
      icon = 'shield',
      permission = 'plugin.demo.advanced',
      renderAction = 'renderPlayerAdvancedTab',
    },
  },

  dashboardWidgets = {
    -- Order 150 places it after the default widgets (which use order 100)
    { id = 'demo-widget', renderAction = 'renderWidget', order = 150 },
  },
})

-- ---------------------------------------------------------------------------
-- Client handlers
-- ---------------------------------------------------------------------------

-- Main page: exercises every schema component type
exports['easyadmin']:RegisterPluginHandler('ea-plugin-demo', 'renderMainPage', function(data)
  local players = GetActivePlayers()
  local playerCount = #players
  local fps = math.floor(1.0 / GetFrameTime())

  return {
    -- Heading
    {
      type = 'heading',
      text = 'Plugin Demo',
      level = 2,
    },

    -- Subtitle text
    {
      type = 'text',
      text = 'This page demonstrates all available schema components.',
      variant = 'muted',
    },

    -- Alert banner
    {
      type = 'alert',
      variant = 'info',
      title = 'Info',
      children = {
        {
          type = 'text',
          text = 'This plugin is fully standalone — no TypeScript, no React, no compilation. Just Lua exports.',
        },
      },
    },

    -- Stat cards row
    {
      type = 'row',
      gap = 3,
      children = {
        {
          type = 'stat-card',
          label = 'Players',
          value = tostring(playerCount),
          icon = 'users',
          iconColor = 'var(--accent-green)',
          bgColor = 'var(--bg-green)',
        },
        {
          type = 'stat-card',
          label = 'FPS',
          value = tostring(fps),
          icon = 'gauge',
          iconColor = 'var(--accent-orange)',
          bgColor = 'var(--bg-orange)',
        },
        {
          type = 'stat-card',
          label = 'Uptime',
          value = '0d',
          icon = 'clock',
          iconColor = 'var(--accent-blue)',
          bgColor = 'var(--bg-blue)',
        },
      },
    },

    -- Divider
    { type = 'divider' },

    -- Key-value table
    {
      type = 'key-value-table',
      rows = {
        { key = 'Plugin ID', value = 'ea-plugin-demo' },
        { key = 'Version', value = '1.0.0' },
        { key = 'Resource', value = GetInvokingResource() or 'ea-plugin-demo' },
        {
          key = 'License',
          value = '1234567890abcdef',
          mono = true,
          action = 'copyLicense',
          actionLabel = 'Copy',
        },
      },
    },

    -- Divider
    { type = 'divider' },

    -- Buttons section
    {
      type = 'card',
      children = {
        {
          type = 'heading',
          text = 'Actions',
          level = 4,
        },
        {
          type = 'text',
          text = 'Click these buttons to trigger Lua handlers.',
          variant = 'muted',
        },
        {
          type = 'row',
          gap = 2,
          children = {
            {
              type = 'button',
              label = 'Refresh',
              action = 'refresh',
              icon = 'refresh',
              variant = 'primary',
              size = 'sm',
            },
            {
              type = 'button',
              label = 'Toggle Badge',
              action = 'toggle',
              icon = 'zap',
              variant = 'secondary',
              size = 'sm',
            },
            {
              type = 'button',
              label = 'Push Update',
              action = 'pushUpdate',
              icon = 'download',
              variant = 'ghost',
              size = 'sm',
            },
            {
              type = 'button',
              label = 'Get Server Data',
              action = 'getServerData',
              server = true,
              icon = 'server',
              variant = 'danger',
              size = 'sm',
            },
          },
        },
      },
    },

    -- Badges section
    {
      type = 'card',
      children = {
        {
          type = 'heading',
          text = 'Badges',
          level = 4,
        },
        {
          type = 'row',
          gap = 2,
          children = {
            { type = 'badge', text = 'Default', variant = 'default' },
            { type = 'badge', text = 'Online', variant = 'online', icon = 'check-circle' },
            { type = 'badge', text = 'Offline', variant = 'offline' },
            { type = 'badge', text = 'Admin', variant = 'admin', icon = 'shield' },
            { type = 'badge', text = 'Warning', variant = 'warning', icon = 'alert-triangle' },
          },
        },
      },
    },

    -- Icons section
    {
      type = 'card',
      children = {
        {
          type = 'heading',
          text = 'Icons',
          level = 4,
        },
        {
          type = 'row',
          gap = 3,
          children = {
            { type = 'icon', name = 'users', size = 'lg' },
            { type = 'icon', name = 'shield', size = 'lg' },
            { type = 'icon', name = 'server', size = 'lg' },
            { type = 'icon', name = 'gauge', size = 'lg' },
            { type = 'icon', name = 'box', size = 'lg' },
          },
        },
      },
    },

    -- Tooltip section
    {
      type = 'card',
      children = {
        {
          type = 'heading',
          text = 'Tooltips',
          level = 4,
        },
        {
          type = 'row',
          gap = 2,
          children = {
            {
              type = 'tooltip',
              content = 'This is a stat card with a tooltip!',
              children = {
                {
                  type = 'stat-card',
                  label = 'Hover Me',
                  value = '123',
                  icon = 'users',
                  iconColor = 'var(--accent-blue)',
                  bgColor = 'var(--bg-blue)',
                },
              },
            },
          },
        },
      },
    },

    -- Timeline section
    {
      type = 'card',
      children = {
        {
          type = 'heading',
          text = 'Timeline',
          level = 4,
        },
        {
          type = 'timeline-entry',
          title = 'Plugin registered',
          time = 'Just now',
          footer = 'System',
          children = {
            {
              type = 'text',
              text = 'This plugin registered via exports and rendered its schema dynamically.',
              variant = 'muted',
            },
          },
        },
      },
    },

    -- Skeleton loading example
    {
      type = 'card',
      children = {
        {
          type = 'heading',
          text = 'Loading State',
          level = 4,
        },
        {
          type = 'row',
          gap = 2,
          children = {
            { type = 'skeleton', height = 24, width = '100%' },
            { type = 'skeleton', height = 24, width = '100%' },
            { type = 'skeleton', height = 24, width = '60%' },
          },
        },
      },
    },

    -- Copy button section
    {
      type = 'card',
      children = {
        {
          type = 'heading',
          text = 'Copy Button',
          level = 4,
        },
        {
          type = 'copy-button',
          value = 'exports["easyadmin"]:RegisterPlugin({ id = "my-plugin" })',
          label = 'Copy Registration Code',
        },
      },
    },
  }
end)

-- Stats page: demonstrates bar chart
exports['easyadmin']:RegisterPluginHandler('ea-plugin-demo', 'renderStatsPage', function(data)
  return {
    {
      type = 'heading',
      text = 'Server Stats',
      level = 2,
    },
    {
      type = 'text',
      text = 'This page demonstrates the bar chart component.',
      variant = 'muted',
    },
    {
      type = 'card',
      children = {
        {
          type = 'heading',
          text = 'Player Activity (Last 7 Days)',
          level = 4,
        },
        {
          type = 'bar-chart',
          items = {
            { label = 'Mon', value = 12 },
            { label = 'Tue', value = 8, color = 'var(--accent-orange)' },
            { label = 'Wed', value = 15 },
            { label = 'Thu', value = 22 },
            { label = 'Fri', value = 30 },
            { label = 'Sat', value = 45 },
            { label = 'Sun', value = 38 },
          },
        },
      },
    },
    {
      type = 'card',
      children = {
        {
          type = 'heading',
          text = 'Resource Usage',
          level = 4,
        },
        {
          type = 'bar-chart',
          items = {
            { label = 'CPU', value = 65 },
            { label = 'RAM', value = 45, color = 'var(--accent-blue)' },
            { label = 'GPU', value = 30 },
            { label = 'Network', value = 20 },
          },
        },
      },
    },
  }
end)

-- Actions page: demonstrates nested layout with col/row
exports['easyadmin']:RegisterPluginHandler('ea-plugin-demo', 'renderActionsPage', function(data)
  return {
    {
      type = 'heading',
      text = 'Actions',
      level = 2,
    },
    {
      type = 'col',
      gap = 3,
      children = {
        {
          type = 'card',
          children = {
            {
              type = 'heading',
              text = 'Client Actions',
              level = 4,
            },
            {
              type = 'row',
              gap = 2,
              children = {
                {
                  type = 'button',
                  label = 'Refresh',
                  action = 'refresh',
                  icon = 'refresh',
                  variant = 'primary',
                  size = 'sm',
                },
                {
                  type = 'button',
                  label = 'Push Update',
                  action = 'pushUpdate',
                  icon = 'download',
                  variant = 'secondary',
                  size = 'sm',
                },
              },
            },
          },
        },
        {
          type = 'card',
          children = {
            {
              type = 'heading',
              text = 'Server Actions',
              level = 4,
            },
            {
              type = 'row',
              gap = 2,
              children = {
                {
                  type = 'button',
                  label = 'Get Server Data',
                  action = 'getServerData',
                  server = true,
                  icon = 'server',
                  variant = 'danger',
                  size = 'sm',
                },
              },
            },
          },
        },
      },
    },
  }
end)

-- Player detail tab: shows player-specific info
exports['easyadmin']:RegisterPluginHandler('ea-plugin-demo', 'renderPlayerTab', function(data)
  local playerId = data.context.playerId

  -- Get player info
  local name = 'Unknown'
  local license = 'N/A'
  local identifiers = {}
  if playerId and playerId > 0 then
    name = GetPlayerName(playerId)
    license = GetPlayerIdentifierByType(playerId, 'license') or 'N/A'
    local idCount = GetNumPlayerIdentifiers(playerId)
    for i = 0, idCount - 1 do
      local id = GetPlayerIdentifier(playerId, i)
      if id then
        table.insert(identifiers, id)
      end
    end
  end

  return {
    {
      type = 'heading',
      text = 'Demo Tab',
      level = 3,
    },
    {
      type = 'text',
      text = 'This tab is injected into the player detail page.',
      variant = 'muted',
    },
    {
      type = 'key-value-table',
      rows = {
        { key = 'Player ID', value = playerId and tostring(playerId) or 'N/A' },
        { key = 'Name', value = name },
        { key = 'License', value = license, mono = true },
      },
    },
    {
      type = 'card',
      children = {
        {
          type = 'heading',
          text = 'Identifiers',
          level = 4,
        },
        {
          type = 'text',
          text = #identifiers > 0 and table.concat(identifiers, ', ') or 'No identifiers found',
          variant = 'muted',
        },
      },
    },
  }
end)

-- Advanced player tab: requires permission
exports['easyadmin']:RegisterPluginHandler('ea-plugin-demo', 'renderPlayerAdvancedTab', function(data)
  local playerId = data.context.playerId
  local state = GetPlayerState(playerId)
  local ping = GetPlayerPing(playerId)

  return {
    {
      type = 'heading',
      text = 'Advanced',
      level = 3,
    },
    {
      type = 'alert',
      variant = 'warning',
      title = 'Advanced View',
      children = {
        {
          type = 'text',
          text = 'This tab requires the "plugin.demo.advanced" permission.',
          variant = 'muted',
        },
      },
    },
    {
      type = 'key-value-table',
      rows = {
        { key = 'State', value = tostring(state) },
        { key = 'Ping', value = tostring(ping) .. 'ms' },
        { key = 'Permission', value = 'plugin.demo.advanced' },
      },
    },
  }
end)

-- Dashboard widget
exports['easyadmin']:RegisterPluginHandler('ea-plugin-demo', 'renderWidget', function(data)
  return {
    {
      type = 'card',
      children = {
        {
          type = 'row',
          gap = 2,
          children = {
            { type = 'icon', name = 'check-circle', size = 'md' },
            {
              type = 'col',
              gap = 0,
              children = {
                { type = 'text', text = 'Plugin Demo', variant = 'small' },
                { type = 'text', text = 'Online', variant = 'muted' },
              },
            },
          },
        },
      },
    },
  }
end)

-- Action: refresh — returns a new schema to re-render the page
exports['easyadmin']:RegisterPluginHandler('ea-plugin-demo', 'refresh', function(data)
  local players = GetActivePlayers()
  local playerCount = #players
  local fps = math.floor(1.0 / GetFrameTime())

  return {
    {
      type = 'heading',
      text = 'Plugin Demo',
      level = 2,
    },
    {
      type = 'text',
      text = 'Refreshed at ' .. os.date('%H:%M:%S'),
      variant = 'muted',
    },
    {
      type = 'row',
      gap = 3,
      children = {
        {
          type = 'stat-card',
          label = 'Players',
          value = tostring(playerCount),
          icon = 'users',
          iconColor = 'var(--accent-green)',
          bgColor = 'var(--bg-green)',
        },
        {
          type = 'stat-card',
          label = 'FPS',
          value = tostring(fps),
          icon = 'gauge',
          iconColor = 'var(--accent-orange)',
          bgColor = 'var(--bg-orange)',
        },
      },
    },
    {
      type = 'badge',
      text = 'Refreshed!',
      variant = 'online',
      icon = 'check-circle',
    },
  }
end)

-- Action: toggle — demonstrates sending data with the action
exports['easyadmin']:RegisterPluginHandler('ea-plugin-demo', 'toggle', function(data)
  -- Toggle a counter stored in a global variable
  _G._demoToggleCount = (_G._demoToggleCount or 0) + 1
  local count = _G._demoToggleCount

  return {
    {
      type = 'heading',
      text = 'Toggle Count',
      level = 2,
    },
    {
      type = 'stat-card',
      label = 'Toggles',
      value = tostring(count),
      icon = 'zap',
      iconColor = 'var(--accent-orange)',
      bgColor = 'var(--bg-orange)',
    },
    {
      type = 'badge',
      text = count % 2 == 0 and 'Even' or 'Odd',
      variant = count % 2 == 0 and 'online' or 'warning',
    },
  }
end)

-- Action: pushUpdate — triggers a live update via SendNUIMessage
exports['easyadmin']:RegisterPluginHandler('ea-plugin-demo', 'pushUpdate', function(data)
  -- Push a live update to the NUI. The NUI will re-fetch the current
  -- render action since we don't return a schema here.
  SendNUIMessage({ action = 'plugin:ea-plugin-demo:update' })
  return { ok = true }
end)
