
if (GetConvar("ea_botToken", "") != "" && GetConvar('ea_botStatusChannel', "") != "") {
    var statusMessage = undefined
    var botStatusChannel = GetConvar('ea_botStatusChannel', '')
    var startTimestamp = new Date()


    async function getServerStatus(why) {
        var embed = new Embed()
            .setColor(Util.resolveColor(65280))
            .setTimestamp()


        var joinURL = GetConvar('web_baseUrl', '')
        var buttonRow = false

        if(joinURL.indexOf('cfx.re' != -1)) {
            embed.setURL(`https://${joinURL}`)
            buttonRow = new ActionRow()
            var button = new ButtonComponent()
                .setURL(`https://${joinURL}`)
                .setLabel(`Join Server`)
                .setStyle(ButtonStyle.Link)


            buttonRow.addComponents(button)
        }

        embed.addFields({name: 'Server Name', value: `\`\`\`${GetConvar('sv_projectName', GetConvar('sv_hostname', 'default FXServer'))} ${GetConvar('sv_projectDesc', '')}\`\`\``})

        /* this is broken, no idea why.
        var icon = GetConvar('sv_icon', '')
        if(icon != '') {
            const iconBuffer = Buffer.from(icon, "base64")
            var attachment = await new MessageAttachment(iconBuffer, 'icon.png');
            embed.setAuthor({ name: "blah", iconURL: 'attachment://icon.png'})
        }
        */

        var reports = await exports[EasyAdmin].getAllReports()
        var activeReports = 0
        var claimedReports = 0
        for (let [i, report] of Object.values(reports).entries()) {
            activeReports+=1
            if (report.claimed) {
                claimedReports+=1
            }
        }

        // TODO: move this into a single addFields call
        embed.addFields({ name: 'Players Online', value: `\`\`\`${getPlayers().length}/${GetConvar('sv_maxClients', '')}\`\`\``, inline: true})
        embed.addFields({ name: 'Admins Online', value: `\`\`\`${Object.values(exports[EasyAdmin].GetOnlineAdmins()).length}\`\`\``, inline: true})
        embed.addFields({ name: 'Reports', value: `\`\`\`${activeReports} (${claimedReports} claimed)\`\`\``, inline: true})

        embed.addFields({ name: 'Active Vehicles', value: `\`\`\`${GetAllVehicles().length}\`\`\``, inline: true})
        embed.addFields({ name: 'Active Peds', value: `\`\`\`${GetAllPeds().length}\`\`\``, inline: true})
        embed.addFields({ name: 'Active Objects', value: `\`\`\`${GetAllObjects().length}\`\`\``, inline: true})

        try {
            let serverId = joinURL.substring(joinURL.lastIndexOf('-')+1,joinURL.indexOf('.users.cfx.re'))
            let response = await exports[EasyAdmin].HTTPRequest(`https://servers-frontend.fivem.net/api/servers/single/${serverId}`)
            response = JSON.parse(response).Data
            embed.addFields({ name: `Upvotes`, value: `\`\`\`${response.upvotePower} Upvotes, ${response.burstPower} Bursts\`\`\``, inline: false})
            
            embed.setAuthor({ name: `${GetConvar('sv_projectName', GetConvar('sv_hostname', 'default FXServer'))}`, iconURL: response.ownerAvatar, url: `https://${joinURL}`})

        } catch (error) {
            console.error(error)
        }
        embed.addFields({ name: 'Uptime', value: `\`\`\`${prettyMilliseconds(new Date()-startTimestamp, {verbose: true, secondsDecimalDigits: 0})}\`\`\``, inline: false})
        


        if (why) {
            embed.addFields({name: 'Last Update', value: why})
        }

        if (buttonRow) {
            return {embeds: [embed], components: [buttonRow] }
        } else {
            return {embeds: [embed] }
        }
        


    }

    async function updateServerStatus(why) {
        var channel = await client.channels.fetch(botStatusChannel)

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
            let embed = await prepareGenericEmbed("Fetching Server Infos..")
            statusMessage = await channel.send({ embeds: [embed] })
        }
        const embed = await getServerStatus(why)
        statusMessage.edit(embed)

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
    setInterval(updateServerStatus, 180000);
    


}
