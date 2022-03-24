if (GetConvar("ea_botToken", "") != "") {
    on('playerJoining', function () {
        const player = global.source
        
        syncDiscordRoles(player)

        if (GetConvar("ea_botToken", "") != "" && GetConvar("ea_botLogChannel", "") != "") {
            var msg = `Player **${exports[EasyAdmin].getName(src,true,true)}** with id **${src}** joined the Server!`
            LogDiscordMessage(msg, "joinleave")
        }
    })


    on("playerDropped", (reason) => {
        var src = global.source

        if (GetConvar('ea_botChatBridge', "") != "") { 
            knownAvatars[src] = undefined
         }

        if (GetConvar("ea_botToken", "") != "" && GetConvar("ea_botLogChannel", "") != "") {
            var msg = `Player **${exports[EasyAdmin].getName(src,true,true)}** left the server!`
            LogDiscordMessage(msg, "joinleave")
        }
    });

}

