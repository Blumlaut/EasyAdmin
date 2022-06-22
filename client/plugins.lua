plugins = {}

function addPlugin(data)
    table.insert(plugins, data)
    -- sort plugins table by name (alphabetically)
    table.sort(plugins, function(a, b) return a.name < b.name end)

    TriggerEvent('EasyAdmin:pluginAdded', data.name)
    PrintDebugMessage("Added Plugin "..data.name, 4)
end