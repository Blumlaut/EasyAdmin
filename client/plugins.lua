plugins = {}

---Adds a new plugin to the plugins list
---@param data table @The plugin data to add
function addPlugin(data)
    -- DEPRECATED: The old NativeUI plugin system is no longer supported.
    -- The new NUI (React) UI uses a TypeScript plugin system instead.
    --
    -- To extend the UI, write an NUI plugin in nui/src/plugins/<name>/
    -- and register it in nui/src/plugins/manifest.ts.
    -- Lua-side logic goes in plugins/<name>/*_{shared,client,server}.lua
    -- and uses RegisterEasyAdminPluginHandler / RegisterEasyAdminPluginServerHandler.
    --
    -- @see docs/nui-plugins.md
    if data then
        print(("[EasyAdmin] addPlugin(%q) is deprecated and a no-op. "..
               "Migrate to the NUI plugin system — see docs/nui-plugins.md."):format(tostring(data.name)))
    end
end
