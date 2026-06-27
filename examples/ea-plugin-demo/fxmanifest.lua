fx_version 'cerulean'
game 'gta5'

-- This example must start AFTER EasyAdmin.
-- Adding it as a dependency ensures correct load order.
dependencies { 'EasyAdmin' }

author 'EasyAdmin Team'
description 'Example plugin demonstrating the EasyAdmin NUI runtime plugin system'
version '1.0.0'

client_scripts { 'client.lua' }
server_scripts { 'server.lua' }
