
if (GetConvar("ea_botToken", "") != "" && GetConvar('ea_botChatBridge', "") != "") {
    try {

        var knownAvatars = {} 


        exports["chat"].registerMessageHook(async function(source, outMessage, hookRef) {

            const user = await exports[EasyAdmin].getCachedPlayer(source)

            if (!user) { 
                return // chat message wasnt sent by a user, we don't care.
            }


            var userInfo = {name: outMessage.args[0]}

            if (knownAvatars[source] == undefined) {
                var fivemAccount = false
                for (let identifier of user.identifiers) {
                    if (identifier.search("fivem:") != -1) {
                        fivemAccount = identifier.substring(identifier.indexOf(":") + 1)
                    }
                }

                if (fivemAccount) {
                    var response = await exports[EasyAdmin].HTTPRequest(`https://policy-live.fivem.net/api/getUserInfo/${fivemAccount}`)
                    try {
                        response = JSON.parse(response)
                        if (response.avatar_template) {
                            var avatarURL = response.avatar_template.replace("{size}", "96")
                            if (avatarURL.indexOf('http') == -1) {
                                avatarURL = `https://forum.cfx.re${avatarURL}`
                            }
                            userInfo.iconURL = avatarURL
                            knownAvatars[source] = avatarURL // we dont need to resolve the avatar every time.
                        } else {
                            knownAvatars[source] = false // avatar missing.
                        }
                    } catch {
                        knownAvatars[source] = false // something broke while trying to get discourse avatar, dont try again.

                    }
                } else {
                    knownAvatars[source] = false // no fivem identifier
                }
            } else {
                userInfo.iconURL = knownAvatars[source]
            }
            if (knownAvatars[source] == false) {
                userInfo.iconURL = undefined // dont send anything to discord, assume something went wrong
            }

            var embed = await prepareGenericEmbed(undefined, undefined, "5a5a5a", undefined, undefined, userInfo, outMessage.args[1], false)
            client.channels.cache.get(GetConvar('ea_botChatBridge', "")).send({ embeds: [embed] })
        })


    } catch(error) {
        console.log("tried registering chat bridge, but failed.")
    }

    client.on('messageCreate', async msg => {
        if (!msg.member || msg.author.bot) { return } // message-sender is a webhook
        if(msg.author.id == userID) {
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
