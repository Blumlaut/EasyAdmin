const { SlashCommandBuilder } = require('@discordjs/builders');


function generatePaginatorRow(idFields, curPage, embedTimestamp) {
	const row = new MessageActionRow()
	var button = new MessageButton()
		.setCustomId(`prevpage${embedTimestamp}`)
		.setLabel(`Previous`)
		.setStyle('PRIMARY')
		if (!idFields[curPage-1]) {
			button.setDisabled(true)
		}

	row.addComponents(button)

	var button = new MessageButton()
		.setCustomId('unused')
		.setLabel(`Current Page: ${curPage+1}`)
		.setStyle('SECONDARY')
		.setDisabled(true)
	row.addComponents(button)


	var button = new MessageButton()
		.setCustomId(`nextpage${embedTimestamp}`)
		.setLabel('Next Page')
		.setStyle('PRIMARY')
		if (!idFields[curPage+1]) {
			button.setDisabled(true)
		}
	row.addComponents(button)

	return row
}


function generateEmbedFields(embed, idFields,usernameFields,discordnamefields, curPage) {
	embed.addFields({
		name: 'Id',
		value: idFields[curPage],
		inline: true
	}, {
		name: 'Name',
		value: usernameFields[curPage],
		inline: true
	}, {
		name: 'Discord',
		value: discordnamefields[curPage],
		inline: true
	})
}


module.exports = {
    data: new SlashCommandBuilder()
        .setName('playerlist')
        .setDescription('Shows a list of all Players'),
    async execute(interaction, exports) {


        var tempReply = await prepareGenericEmbed(`\`\`\`Processing Playerlist..\`\`\``);
        await interaction.reply({
            embeds: [tempReply]
        })

        var players = await exports[EasyAdmin].getCachedPlayers()
        var embedTimestamp = Date.now();

        const embed = new Discord.MessageEmbed()
            .setColor((65280))
            .setTimestamp()

        var idFields = []
        var usernameFields = []
        var discordnamefields = []
        var ids = ``
        var usernames = ``
        var discordnames = ``
        var curPage = 0
		var row = undefined


        if (getPlayers().length != 0) {
            for (let [index, player] of Object.values(players).entries()) {
                if (!player.dropped) {

                    if (ids.length >= 500 || usernames.length >= 500 || discordnames.length >= 500) {
                        idFields.push(ids)
                        usernameFields.push(usernames)
                        discordnamefields.push(discordnames)
                        ids = ``
                        usernames = ``
                        discordnames = ``
                    }

                    var discordAccount = await getDiscordAccountFromPlayer(player)
                    if (discordAccount) {
                        discordAccount = discordAccount.tag
                    } else {
                        discordAccount = "N/A"
                    }

                    ids += `\n${player.id}`
                    usernames += `\n${player.name}`
                    discordnames += `\n${discordAccount}`
                }
            }
            idFields.push(ids)
            usernameFields.push(usernames)
            discordnamefields.push(discordnames)


			generateEmbedFields(embed,idFields,usernameFields,discordnamefields,0)

			row = generatePaginatorRow(idFields, curPage, embedTimestamp)
            if (idFields.length > 1) {

                const filter = i => (i.customId === `prevpage${embedTimestamp}` || i.customId === `nextpage${embedTimestamp}`);

                const collector = interaction.channel.createMessageComponentCollector({
                    filter,
                    time: 120000
                });

                collector.on('collect', async i => {
                    const embed = new Discord.MessageEmbed()
                        .setColor((65280))
                        .setTimestamp()
                    if (i.customId === `nextpage${embedTimestamp}`) {
                        curPage += 1
                    } else if (i.customId === `prevpage${embedTimestamp}`) {
                        curPage += -1
                    }
					generateEmbedFields(embed,idFields,usernameFields,discordnamefields,curPage)


					const row = generatePaginatorRow(idFields, curPage, embedTimestamp)

                    await interaction.editReply({
                        embeds: [embed],
                        components: [row]
                    });
                    await i.deferUpdate()
                });
            }
        } else {
            embed = new Discord.MessageEmbed()
                .setColor((65280))
                .setTimestamp()
                .addField('\u200b', "There are no players on the server!")
        }

        await interaction.editReply({
            embeds: [embed],
            components: [row]
        });
    },
};