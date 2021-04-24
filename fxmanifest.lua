fx_version "adamant"

games {"rdr3","gta5"}

rdr3_warning 'I acknowledge that this is a prerelease build of RedM, and I am aware my resources *will* become incompatible once RedM ships.'

server_scripts {
	"util_shared.lua",
	"admin_server.lua",
}

client_scripts {
	"dependencies/NativeUI.lua",
	"dependencies/NativeUI-rdr3.lua",
	"dependencies/Controls.lua",
	"util_shared.lua",
	"admin_client.lua",
	"gui_c.lua",
}
