
if (GetConvar("ea_botToken", "") != "" && GetConvar('ea_botStatusChannel', "") != "") {
    var statusMessage = undefined
    var botStatusChannel = GetConvar('ea_botStatusChannel', '')


    async function getServerStatus(why) {
        var embed = new Discord.MessageEmbed()
            .setColor((65280))
            .setTimestamp()


        var joinURL = GetConvar('web_baseUrl', '')

        if(joinURL.indexOf('cfx.re' != -1)) {
            embed.setURL(`https://${joinURL}`)
        }

        embed.addField('Server Name', `**${GetConvar('sv_projectName', GetConvar('sv_hostname', 'default FXServer'))}** ${GetConvar('sv_projectDesc', '')}`)


        var serverId = joinURL.substring(joinURL.lastIndexOf('-')+1,joinURL.indexOf('.users.cfx.re'))

        try {
            var response = await exports[EasyAdmin].HTTPRequest(`https://servers-frontend.fivem.net/api/servers/single/${serverId}`)
            response = JSON.parse(response).Data
            embed.addField(`Upvotes`, `${response.upvotePower} (${response.burstPower} Bursts)`, true)
            
            embed.setAuthor({name: `${GetConvar('sv_projectName', GetConvar('sv_hostname', 'default FXServer'))}`, iconURL: response.ownerAvatar, url: `https://${joinURL}`})

        } catch (error) {
            console.error(error)

        }

        /* this is broken, no idea why.
        var icon = GetConvar('sv_icon', '')
        if(icon != '') {
            const iconBuffer = Buffer.from(icon, "base64")
            var attachment = await new MessageAttachment(iconBuffer, 'icon.png');
            embed.setAuthor({ name: "blah", iconURL: 'attachment://icon.png'})
        }
        */

        embed.addField('Players Online', `${getPlayers().length}/${GetConvar('sv_maxClients', '')}`, true)
        embed.addField('Admins Online', `${Object.values(exports[EasyAdmin].GetOnlineAdmins()).length}`, true)
        embed.addField('Spawned Vehicles', `${GetAllVehicles().length}`, true)
        embed.addField('Spawned Peds', `${GetAllPeds().length}`, true)
        embed.addField('Spawned Objects', `${GetAllObjects().length}`, true)


        if (why) {
            embed.addField('Last Update', why)
        }

        return embed


    }

    async function updateServerStatus(why) {
        var channel = await client.channels.fetch(botStatusChannel)

        const embed = await getServerStatus(why)

        if (!statusMessage) {
            var messagesToDelete = []
            var messages = await channel.messages.fetch({ limit: 10 })
            for (var message of messages.values()) {
                if (messages.size == 1 && message.author.id == client.user.id) {
                    statusMessage = message
                    break
                } else {
                    messagesToDelete.push(message.id)
                }
            }
            try {
                if (statusMessage) {
                    updateServerStatus()
                    return
                }
                await channel.bulkDelete(messagesToDelete)
            } catch {
                console.log("Could not bulk-delete messages in this channel.")
            }
            statusMessage = await channel.send({embeds: [embed]})
        } else {
            statusMessage.edit({embeds: [embed]})
        }


    }

    client.on('messageCreate', async msg => {
        if (!msg.member || msg.author.bot) { return } // message-sender is a webhook
        if(msg.author.id == userID) {
            return
        }
        if(!msg.channel) { return }
        if (msg.channel.id == GetConvar('ea_botStatusChannel', "")) {
            msg.delete()
            updateServerStatus('manual')
        }

    })
    setTimeout(updateServerStatus, 10000)
    setInterval(updateServerStatus, 300000);
    


}
