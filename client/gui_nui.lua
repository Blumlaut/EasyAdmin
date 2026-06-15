------------------------------------
-- EasyAdmin NUI bootstrap
-- Registers commands; all callbacks are self-registered by each module
-- (client/nui/*.lua files load before this via fxmanifest)
------------------------------------

-- Dedicated NUI toggle command.
RegisterCommand('ea_nui', function()
  NuiToggle()
end, false)

-- NUI is the primary interface; always register the main easyadmin command.
-- When ea_useNUI is false, gui_c.lua handles it instead.
RegisterCommand('easyadmin', function(_source, _args)
  if not IsNuiEnabled() then return end
  CreateThread(function()
    NuiToggle()
    if _menuPool and _menuPool:IsAnyMenuOpen() then
      Wait(500)
      if IsNuiVisible() then
        _menuPool:Remove()
        _menuPool = nil
      end
    end
  end)
end, false)
