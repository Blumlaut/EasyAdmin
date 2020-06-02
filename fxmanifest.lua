fx_version 'bodacious' 
games { 'gta5' } 
 
description 'EasyAdmin 5.21'
author ' Bluethefurry'
note 'this does not cause problems for end user fyi'
reason 'We are not trying to mess up your contribution graph fyi, we want things to be done right'
icymi 'https://i.imgur.com/OPzg6s8.png'
ps 'i love the easyadmin'

server_scripts {
    "util_shared.lua",
    "admin_server.lua",
    "webadmin_server.lua",
}

client_scripts {
    "dependencies/NativeUI.lua",
    "util_shared.lua",
    "admin_client.lua",
    "gui_c.lua",
}

convar_json "settings.json"
