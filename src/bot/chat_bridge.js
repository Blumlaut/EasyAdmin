
try {
	knownAvatars = {}
	exports['chat'].registerMessageHook(async function(source, outMessage) {
		if (GetConvar('ea_botChatBridge', '') == '') { return }

		const user = await exports[EasyAdmin].getCachedPlayer(source)

		if (!user) {
			return
		}

		var userInfo = {name: outMessage.args[0]}

		if (knownAvatars[source] == undefined) {
			userInfo.iconURL = await fetchAndCacheAvatar(source, user.identifiers)
		} else {
			userInfo.iconURL = knownAvatars[source]
		}

		if (knownAvatars[source] == false) {
			userInfo.iconURL = undefined
		}

		var embed = await prepareGenericEmbed(undefined, undefined, 55555, undefined, undefined, userInfo, outMessage.args[1], false)
		client.channels.cache.get(GetConvar('ea_botChatBridge', '')).send({ embeds: [embed] })
	})


} catch {
	if (GetConvar('ea_botChatBridge', '') != '') {
		console.error('Registering Chat Bridge failed, you will need to update your chat resource from https://github.com/citizenfx/cfx-server-data to use it.')
	}
}

async function fetchAndCacheAvatar(source, identifiers) {
	var fivemAccount = findFivemAccount(identifiers)

	if (fivemAccount) {
		return await fetchDiscourseAvatar(source, fivemAccount)
	}

	knownAvatars[source] = false
	return false
}

function findFivemAccount(identifiers) {
	for (let identifier of identifiers) {
		if (identifier.search('fivem:') != -1) {
			return identifier.substring(identifier.indexOf(':') + 1)
		}
	}
	return false
}

async function fetchDiscourseAvatar(source, fivemAccount) {
	var response = await exports[EasyAdmin].HTTPRequest(`https://policy-live.fivem.net/api/getUserInfo/${fivemAccount}`)

	try {
		response = JSON.parse(response)
		if (response.avatar_template) {
			var avatarURL = formatAvatarURL(response.avatar_template)
			knownAvatars[source] = avatarURL
			return avatarURL
		}

		knownAvatars[source] = false
		return false
	} catch {
		knownAvatars[source] = false
		return false
	}
}

function formatAvatarURL(avatarTemplate) {
	var avatarURL = avatarTemplate.replace('{size}', '96')

	if (avatarURL.indexOf('http') == -1) {
		avatarURL = `https://forum.cfx.re${avatarURL}`
	}

	return avatarURL
}

client.on('messageCreate', async msg => {
	if (GetConvar('ea_botChatBridge', '') == '') { return }
	if (!msg.member || msg.author.bot) { return } // message-sender is a webhook
	if(msg.author.id == userID) {
		return
	}
	if(!msg.channel) { return }
	if (msg.channel.id == GetConvar('ea_botChatBridge', '')) {
		exports['chat'].addMessage(-1, { args: [msg.member.user.tag, msg.cleanContent]})
	}
    
})

on('playerDropped', (source) => {
	if (GetConvar('ea_botChatBridge', '') == '') { return }
	knownAvatars[source] = undefined
})

