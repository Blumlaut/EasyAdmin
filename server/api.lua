-- EasyAdmin API, allows you to query user info and execute EasyAdmin functions using a Web UI, requires a valid API Key (set using ea_apiKey convar) and a valid identifier (received via the post requests, checked via ACE)

SetHttpHandler(function(request, response)

    local function handleRequest()

        -- compare API Bearer Token with ea_apiKey
        if not request.headers['Authorization'] or string.sub(request.headers['Authorization'], 1, 7) ~= 'Bearer ' then
            response.writeHead(401, { ['Content-Type'] = 'application/json' })
            response.send(json.encode({ error = "Unauthorized" }))
            return
        end
        if string.sub(request.headers['Authorization'], 8) ~= GetConvar('ea_apiKey', '') then
            response.writeHead(401, { ['Content-Type'] = 'application/json' })
            response.send(json.encode({ error = "Unauthorized" }))
            return
        end

        -- check if passed identifier has ACE permission to use EasyAdmin API
        if not IsPrincipalAceAllowed(request.headers['X-User-Identifier'], 'easyadmin.api') then
            response.writeHead(403, { ['Content-Type'] = 'application/json' })
            response.send(json.encode({ error = "Forbidden" }))
            return
        end

        if request.method == 'GET' and request.path == '/players' then
            -- Example: Get online players (stub)
            response.writeHead(200, { ['Content-Type'] = 'application/json' })
            response.send(json.encode(CachedPlayers))

        -- get player live location
        if request.method == 'GET' and request.path == '/player/location' then
            -- requires a target player id
            local body = json.decode(request.data)
            local target = tonumber(body.target)
            if not target or target ~= 'number' then
                response.writeHead(400, {
                    ['Content-Type'] = 'application/json'
                })
                response.send(json.encode({ error = "Invalid target" }))
                return
            end
            if not CachedPlayers[target] then
                response.writeHead(400, {
                    ['Content-Type'] = 'application/json'
                })
                response.send(json.encode({ error = "Invalid target" }))
                return
            end
            local location = GetEntityCoords(GetPlayerPed(target)
            local location = { x=location.x, y=location.y, z=location.z }
            response.writeHead(200, {
                ['Content-Type'] = 'application/json'
                })
            response.send(json.encode(location))
            return


        elseif request.method == 'POST' then
            request.setDataHandler(function(data)
                local body = json.decode(data)
                local target = tonumber(body.target)

                if request.path == '/admin/kick' then
                    -- TODO: Logic
                end

                response.writeHead(200)
                response.send("Action completed")
            end)
        else
            response.writeHead(404)
            response.send()
        end
    end

    handleRequest()
end)
