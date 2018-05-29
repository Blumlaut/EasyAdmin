resource_manifest_version "44febabe-d386-4d18-afbe-5e627f4af937"

dependency 'NativeUI'

server_scripts {
	"admin_server.lua",
	"version",
}

client_scripts {
	"@NativeUI/NativeUI.lua",
	"admin_client.lua",
	"gui_c.lua",
}
