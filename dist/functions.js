// bot/functions.js
global.prepareGenericEmbed = async function(message, feature, colour, title, image, customAuthor, description, timestamp) {
  if (feature && await exports[EasyAdmin].isWebhookFeatureExcluded(feature)) {
    return;
  }
  const embed = new EmbedBuilder().setColor(colour || 16777214);
  if (timestamp != false) {
    embed.setTimestamp();
  }
  if (message) {
    embed.addFields([{ name: `**${title || "EasyAdmin"}**`, value: message }]);
  }
  if (description) {
    embed.setDescription(description);
  }
  if (customAuthor) {
    embed.setAuthor(customAuthor);
  }
  if (image) {
    embed.setImage(image);
  }
  return embed;
};
global.findPlayerFromUserInput = async function(input) {
  var user;
  var players = await exports[EasyAdmin].getCachedPlayers();
  Object.keys(players).forEach(function(key) {
    var player = players[key];
    var name = player.name;
    if (!isNaN(input)) {
      if (player.id == input) {
        user = player;
      }
    } else {
      if (name.search(input) != -1) {
        user = player;
      }
    }
  });
  return user;
};
global.DoesGuildMemberHavePermission = async function(member, object) {
  if (!member || !object) {
    return false;
  }
  var memberId = member.id;
  if (!memberId) {
    return false;
  }
  if (object.search("easyadmin.") == -1) {
    object = `easyadmin.${object}`;
  }
  if (member.guild.ownerId === memberId) {
    return true;
  }
  var allowed = IsPrincipalAceAllowed(`identifier.discord:${memberId}`, object);
  return allowed;
};
global.getDiscordAccountFromPlayer = async function(user) {
  var discordAccount = false;
  if (!isNaN(user)) {
    user = await exports[EasyAdmin].getCachedPlayer(user);
  }
  for (let identifier of user.identifiers) {
    if (identifier.search("discord:") != -1) {
      discordAccount = await client.users.fetch(identifier.substring(identifier.indexOf(":") + 1));
    }
  }
  return discordAccount;
};
global.getPlayerFromDiscordAccount = async function(user) {
  var id = user.id;
  var players = await exports[EasyAdmin].getCachedPlayers();
  for (let [index, player] of Object.values(players).entries()) {
    for (let identifier of player.identifiers) {
      if (identifier == `discord:${id}`) {
        return player;
      }
    }
  }
  return false;
};
global.refreshRolesForMember = async function(member) {
  var roles = await member.roles.cache.keys();
  for (var role of roles) {
    emit("debug", `role sync for ${member.user.tag} add_principal identifier.discord:${member.id} role:${role}`);
    ExecuteCommand(`add_principal identifier.discord:${member.id} role:${role}`);
  }
  emit("debug", `roles synced for ${member.user.tag}`);
};
global.refreshRolesForUser = async function(user, roles) {
  for (var role of roles) {
    emit("debug", `role sync for ${user.tag} add_principal identifier.discord:${user.id} role:${role}`);
    ExecuteCommand(`add_principal identifier.discord:${user.id} role:${role}`);
  }
  emit("debug", `roles synced for ${user.tag}`);
};
global.format = function(str, ...args) {
  let formatted = str.replace(/%s/g, function() {
    return args.shift();
  });
  return formatted;
};
