
if (GetConvar('ea_botChatBridge', "") != "") {
    try {

        var knownAvatars = {} 


        exports["chat"].registerMessageHook(async function(source, outMessage, hookRef) {

            const user = await exports[EasyAdmin].getCachedPlayer(source)

            if (!user) { 
                return // chat message wasnt sent by a user, we don't care.
            }


            var userInfo = {name: outMessage.args[0]}


            if (!knownAvatars[source]) {
                var fivemAccount = false
                for (let identifier of user.identifiers) {
                    if (identifier.search("fivem:") != -1) {
                        fivemAccount = identifier.substring(identifier.indexOf(":") + 1)
                    }
                }

                if (fivemAccount) {
                    var response = await exports[EasyAdmin].HTTPRequest("https://policy-live.fivem.net/api/getUserInfo/"+fivemAccount)
                    response = JSON.parse(response)
                    var avatarURL = response.avatar_template.replace("{size}", "96")
                    if (avatarURL.indexOf('http') == -1) {
                        avatarURL = "https://forum.cfx.re"+avatarURL
                    }
                    userInfo.iconURL = avatarURL
                    knownAvatars[source] = avatarURL // we dont need to resolve the avatar every time.
                }
            } else {
                userInfo.iconURL = knownAvatars[source]
            }
            var embed = await prepareGenericEmbed(undefined, undefined, "5a5a5a", undefined, undefined, userInfo, outMessage.args[1], false)
            client.channels.cache.get(GetConvar('ea_botChatBridge', "")).send({ embeds: [embed] })
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

    on("playerDropped", (reason) => {
        knownAvatars[global.source] = undefined
    });
    
}
