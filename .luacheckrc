stds.cfx = {
    read_globals = {
        Citizen = {
            fields = {
                "Wait", "CreateThread", "SetTimeout", "Await", "Trace",
                "InvokeNative"
            }
        },
        exports = { other_fields = true },
        GlobalState = { other_fields = true },
        "Player",
        "Vehicle",
        "Wait",
        "CreateThread",
        "SetTimeout",
        "Await",
        "Trace",
        "quat",
        "vec",
        "vector2", "vec2",
        "vector3", "vec3",
        "vector4", "vec4",
        "AddEventHandler",
        "RegisterNetEvent",
        "TriggerEvent",
        "RemoveEventHandler",
        json = { fields = {"encode", "decode"} },
        %%SHARED_GLOBALS%%
    }
}

stds.cfx_sv = {
    globals = {"GlobalState"},
    read_globals = {
        "source",
        "TriggerClientEvent",
        "TriggerLatentClientEvent",
        "RegisterServerEvent",
        "GetPlayerIdentifiers",
        "GetPlayers",
        "PerformHttpRequest",
        "CreateVehicle",
        %%SERVER_GLOBALS%%
    }
}

stds.cfx_cl = {
    read_globals = {
        "TriggerServerEvent",
        "RegisterNUICallback",
        "SendNUIMessage",
        "GlobalState",
        %%CLIENT_GLOBALS%%
    }
}

stds.cfx_manifest = {
    read_globals = {
        "author", "description", "repository", "version",
        "rdr3_warning", "fx_version", 
        "games", "game", "authors", "author",
        "server_scripts", "server_script",
        "client_scripts", "client_script",
        "shared_scripts", "shared_script",
        "ui_page", "files", "file",
        "export", "exports", "replace_level_meta", 
        "data_file", "this_is_a_map", "server_only",
        "loadscreen", "dependency", "dependencies",
        "provide", "lua54", "disable_lazy_natives",
        "clr_disable_task_scheduler", "my_data",
        "ui_page_preload", "loadscreen_manual_shutdown",
    },
}

stds.esx_legacy = {
    read_globals = {
        MySQL = {
            fields = {
                "ready",
                "insert",
                "update",
                "scalar",
                "single",
                "prepare",
                "query",
            }
        }
    }
}

-- manifest
files["**/fxmanifest.lua"].std = "max+cfx_manifest"
files["**/__resource.lua"].std = "max+cfx_manifest"
files["**/fxmanifest.lua"].ignore = {'113', '611', '111', '614'}
files["**/__resource.lua"].ignore = {'113', '611', '111', '614'}
-- clients
files["**/client.lua"].std = "max+cfx+cfx_cl%%EXTRA%%"
files["**/cl_*.lua"].std = "max+cfx+cfx_cl%%EXTRA%%"
files["**/client/**/*.lua"].std = "max+cfx+cfx_cl%%EXTRA%%"
-- server
files["**/server.lua"].std = "max+cfx+cfx_sv%%EXTRA%%"
files["**/sv_*.lua"].std = "max+cfx+cfx_sv%%EXTRA%%"
files["**/server/**/*.lua"].std = "max+cfx+cfx_sv%%EXTRA%%"
-- shared
files["**/shared.lua"].std="max+cfx+cfx_sv+cfx_cl%%EXTRA%%"
files["**/shared/**/*.lua"].std="max+cfx+cfx_sv+cfx_cl%%EXTRA%%"
-- default
max_line_length = 140
max_cyclomatic_complexity = 100
color = true
ignore = {'611', '111', '614'}
std = "max+cfx+cfx_sv+cfx_cl%%EXTRA%%"