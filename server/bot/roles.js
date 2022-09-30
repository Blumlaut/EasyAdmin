
if (GetConvar("ea_botToken", "") != "") {
    
    
    async function syncDiscordRoles(player) {
        if (!EasyAdmin) {return} // bot is down
        var src = player
        var member = undefined
        try {
            var botGuild = await client.guilds.cache.get(guild)
            var identifiers = await exports[EasyAdmin].getAllPlayerIdentifiers(player)
            var user = false 
            for (let identifier of identifiers) {
                if (identifier.search("discord:") != -1) {
                    user = await client.users.fetch(identifier.substring(identifier.indexOf(":") + 1))
                }
            }
            if (user) {
                member = await botGuild.members.fetch(user)
            } else {
                return false
            }
        } catch (error) {
            return
        }
        
        var roles = undefined 
        try {
            roles = await member.roles.cache.keys()
        } catch (error) {
            console.error("failed to fetch member roles, despite having fetched the member, please report the following stack trace to https://github.com/Blumlaut/EasyAdmin/issues")
            console.error(`member: ${member.toJSON()}`)
            console.error(error)
            return
        }
        
        refreshRolesForMember(member)
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
