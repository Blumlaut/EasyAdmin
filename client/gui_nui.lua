------------------------------------
-- EasyAdmin NUI bootstrap
-- Registers commands; all callbacks are self-registered by each module
-- (client/nui/*.lua files load before this via fxmanifest)
------------------------------------

-- Dedicated NUI toggle command.
RegisterCommand('ea_nui', function()
  NuiToggle()
end, false)

-- NUI is the primary (and only) interface.
RegisterCommand('easyadmin', function(_source, _args)
  if not IsNuiEnabled() then return end
  NuiToggle()
end, false)
