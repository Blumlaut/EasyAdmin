------------------------------------
-- EasyAdmin NUI bootstrap
-- Loads modular NUI handlers and wires the toggle command
------------------------------------

local core = require('nui.core')
local players = require('nui.players')
local bans = require('nui.bans')
local reports = require('nui.reports')
local server = require('nui.server')
local settings = require('nui.settings')
local events = require('nui.events')

-- Register all NUI callbacks defined in the modules.
local modules = { core, players, bans, reports, server, settings }
for _, mod in ipairs(modules) do
  for name, handler in pairs(mod.callbacks or {}) do
    RegisterNUICallback(name, handler)
  end
end

-- Dedicated NUI toggle command.
RegisterCommand('ea_nui', function()
  core.toggle()
end, false)

-- If NUI mode is enabled, also intercept the main easyadmin command.
if core.isNuiEnabled() then
  RegisterCommand('easyadmin', function(_source, _args)
    CreateThread(function()
      core.toggle()
      if _menuPool and _menuPool:IsAnyMenuOpen() then
        Wait(500)
        if core.isVisible() then
          _menuPool:Remove()
          _menuPool = nil
        end
      end
    end)
  end, false)
end

-- Send initial settings/easter eggs to the NUI when the menu opens.
-- This is wired into the menuToggle event by core.toggle(); the bootstrap
-- stays focused on loading modules.
