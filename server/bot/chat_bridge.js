
if (GetConvar('ea_botChatBridge', "") != "") {
    try {
        exports["chat"].registerMessageHook(function(source, outMessage, hookRef) {
            client.channels.cache.get(GetConvar('ea_botChatBridge', "")).send({ content: '**'+outMessage.args[0]+'**: '+outMessage.args[1] })
        })
    } catch(error) {
        console.log("tried registering chat bridge, but failed.")
    }

    client.on('messageCreate', async msg => {
        if(msg.member.user.id == userID) {
            return
        }
        if(!msg.channel) { return }
        if (msg.channel.id == GetConvar('ea_botChatBridge', "")) {
            exports["chat"].addMessage(-1, { args: [msg.member.user.tag, msg.cleanContent]})
        }

    })
    
}
