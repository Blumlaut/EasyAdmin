if (GetConvar("ea_botToken", "") != "") {

    on('playerJoining', function () {
        const player = global.source
        
        exports[EasyAdmin].syncDiscordRoles(player)

        if (GetConvar("ea_botToken", "") != "" && GetConvar("ea_botLogChannel", "") != "") {
            var msg = `Player **${exports[EasyAdmin].getName(player,true,true)}** with id **${player}** joined the Server!`
            LogDiscordMessage(msg, "joinleave")
        }
    })


    on("playerDropped", (reason) => {
        var player = global.source

        if (GetConvar('ea_botChatBridge', "") != "") { 
            knownAvatars[player] = undefined
         }

        if (GetConvar("ea_botToken", "") != "" && GetConvar("ea_botLogChannel", "") != "") {
            var msg = `Player **${exports[EasyAdmin].getName(player,true,true)}** left the server!`
            LogDiscordMessage(msg, "joinleave")
        }
    });

}

