-- EasyAdmin REST Api

-- Authentication
local function authenticateRequest(request, response)
    if not request.headers['Authorization'] or string.sub(request.headers['Authorization'], 1, 7) ~= 'Bearer ' then
        response.writeHead(401, { ['Content-Type'] = 'application/json' })
        response.send(json.encode({ error = "Unauthorized" }))
        return false
    end

    local providedToken = string.sub(request.headers['Authorization'], 9)
    local expectedToken = GetConvar('ea_apiKey', '')

    if providedToken ~= expectedToken then
        response.writeHead(401, { ['Content-Type'] = 'application/json' })
        response.send(json.encode({ error = "Unauthorized" }))
        return false
    end

    if not IsPrincipalAceAllowed(request.headers['X-User-Identifier'], 'easyadmin.api') then
        response.writeHead(403, { ['Content-Type'] = 'application/json' })
        response.send(json.encode({ error = "Forbidden" }))
        return false
    end

    return true
end

-- Route Table
local routes = {
    ['GET', '/players'] = function(request, response)
        response.writeHead(200, { ['Content-Type'] = 'application/json' })
        local allPlayers = {}
        for k,v in pairs(CachedPlayers) do
            local playerData = {
                id = v.id,
                name = v.name,
                health = GetEntityHealth(GetPlayerPed(v.id)),
                armor = GetPedArmour(GetPlayerPed(v.id)),
                identifiers = v.identifiers,
                immune = v.immune,
                position = GetEntityCoords(GetPlayerPed(v.id))
            }
            table.insert(allPlayers, playerData)
        end
        response.send(json.encode(allPlayers))
    end,
    ['POST', '/admin/teleport'] = function(request, response)
        local body = json.decode(request.data)
        local target = tonumber(body.target)
        if not target or type(target) ~= 'number' or not CachedPlayers[target] then
            response.writeHead(400, { ['Content-Type'] = 'application/json' })
            response.send(json.encode({ error = "Invalid target" }))
            return
        end
        local x,y,z = body.x, body.y, body.z
        SetEntityCoords(GetPlayerPed(target), x,y,z)
        response.send("Teleported player to coordinates.")
    end,
    ['POST', '/admin/kick'] = function (request, response)
        local body = json.decode(request.data)
        local target = tonumber(body.target)

        if not target or type(target) ~= 'number' then
            response.writeHead(400, { ['Content-Type'] = 'application/json' })
            response.send(json.encode({ error = "Invalid target" }))
            return
        end

        if not CachedPlayers[target] then
            response.writeHead(400, { ['Content-Type'] = 'application/json' })
            response.send(json.encode({ error = "Invalid target" }))
            return
        end

        -- TODO: Implement actual kick
        -- DropPlayer(target, "Kicked by EasyAdmin API")

        response.writeHead(200)
        response.send("Action completed")
    end,
    ['POST', '/admin/ban'] = function (request, response)
        local body = json.decode(request.data)
        local target = tonumber(body.target)
        local reason = body.reason or "No reason provided
        local duration = body.duration or 3600 -- Default to 1 hour in seconds
        if not target or type(target) ~= 'number' or not reason then
            response.writeHead(400, { ['Content-Type'] = 'application/json' })
            response.send(json.encode({ error = "Invalid target or reason" }))
            return
        end
        -- TODO: Implement actual ban
        response.writeHead(200)
        response.send("Action completed")
    end,
}

-- Main HTTP handler
SetHttpHandler(function(request, response)
    if not authenticateRequest(request, response) then
        return
    end

    local method = request.method
    local path = request.path
    local handler = routes[method and path]

    if not handler then
        response.writeHead(404)
        response.send("Not found")
        return
    end

    if method == 'POST' then
        request.setDataHandler(function(data)
            handler(request, response)
        end)
    else
        handler(request, response)
    end
end)