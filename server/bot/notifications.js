

if (GetConvar("ea_botToken", "") != "" && GetConvar("ea_botLogChannel", "") != "") {
    
    onNet("playerJoining", async () => {
        var src = source
        
        var msg = `Player **${exports[EasyAdmin].getName(src,true,true)}** with id **${src}** joined the Server!`
        LogDiscordMessage(msg, "joinleave")
    })
    
    on("playerDropped", (reason) => {
        var src = global.source
        
        var msg = `Player **${exports[EasyAdmin].getName(src,true,true)}** left the server!`
        LogDiscordMessage(msg, "joinleave")
    });
}
