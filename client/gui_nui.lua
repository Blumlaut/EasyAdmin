------------------------------------
-- EasyAdmin NUI bootstrap
-- Registers commands; all callbacks are self-registered by each module
-- (client/nui/*.lua files load before this via fxmanifest)
------------------------------------

-- NUI is the primary (and only) interface.
RegisterCommand('easyadmin', function(_source, _args)
  NuiToggle()
end, false)

-- Alias for easyadmin.
RegisterCommand('ea', function(_source, _args)
  NuiToggle()
end, false)
