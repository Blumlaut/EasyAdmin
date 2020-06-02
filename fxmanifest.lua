fx_version 'bodacious' 
games { 'gta5' } 
 
description 'EasyAdmin 5.21'
author ' Bluethefurry'

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