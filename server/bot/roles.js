
if (GetConvar("ea_botToken", "") != "") {
    
    
    async function syncDiscordRoles(player) {
        if (!EasyAdmin) {return} // bot is down
        var user = undefined


        try {
            var identifiers = await exports[EasyAdmin].getAllPlayerIdentifiers(player)
            for (let identifier of identifiers) {
                if (identifier.search("discord:") != -1) {
                    user = await client.users.fetch(identifier.substring(identifier.indexOf(":") + 1))
                }
            }
            if (!user) {
                return false
            }
        } catch (error) {
            return
        }
        
        var roles = []
        for (const id of client.guilds.cache.keys()) {
            const guild = client.guilds.cache.get(id)
            var guildMember = await guild.members.fetch(user.id)
            if (guildMember) {
                roles.push(...guildMember.roles.cache.keys())
            }
        }
        refreshRolesForUser(user, roles)
    }
    exports('syncDiscordRoles', syncDiscordRoles)
    
    client.on("guildMemberUpdate", async function(oldMember, newMember){
        oldRoles = await oldMember.roles.cache.keys()
        newRoles = await newMember.roles.cache.keys()

        for (var role of oldRoles) {
            ExecuteCommand(`remove_principal identifier.discord:${oldMember.id} role:${role}`)
        }
        
        for (var role of newRoles) {
            ExecuteCommand(`add_principal identifier.discord:${newMember.id} role:${role}`)
        }
    });
}
