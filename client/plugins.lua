plugins = {}

---Adds a new plugin to the plugins list
---@param data table @The plugin data to add
function addPlugin(data)
    -- DEPRECATED: The old NativeUI plugin system is no longer supported.
    --
    -- The NUI (React) UI uses a runtime plugin system instead. External
    -- resources register via exports['easyadmin']:RegisterPlugin(config) and
    -- provide schema trees that EasyAdmin renders using its built-in components.
    --
    -- @see docs/nui-plugins.md
    if data then
        print(("[EasyAdmin] addPlugin(%q) is deprecated and a no-op. "..
               "Migrate to the runtime plugin system — see docs/nui-plugins.md."):format(tostring(data.name)))
    end
end
