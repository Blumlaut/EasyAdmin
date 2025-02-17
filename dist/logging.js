// bot/logging.js
botLogForwards = [];
global.addBotLogForwarding = async function(source, args) {
  var player = source;
  if (await exports[GetCurrentResourceName()].DoesPlayerHavePermission(player, "server")) {
    var feature = args[0];
    var channel = args[1];
    if (!feature || !parseInt(channel)) {
      console.error("Invalid Usage! ea_addBotLogForwarding feature channelId");
      return false;
    }
    console.log(`Added log fwd ${feature} => ${channel}`);
    botLogForwards[feature] = channel;
    return true;
  }
};
RegisterCommand("ea_addBotLogForwarding", global.addBotLogForwarding);
global.LogDiscordMessage = async function(text, feature, colour) {
  if (!EasyAdmin) {
    return;
  }
  if (GetConvar("ea_botLogChannel", "") == "") {
    return;
  }
  if (feature == "report" || feature == "calladmin") {
    return;
  }
  const embed = await prepareGenericEmbed(text, void 0, colour);
  var channel = await client.channels.cache.get(botLogForwards[feature] || GetConvar("ea_botLogChannel", ""));
  if (channel) {
    channel.send({ embeds: [embed] }).catch((error) => {
      console.error("^7Failed to log message, please make sure you gave the bot permission to write in the log channel!\n\n");
      console.error(error);
    });
  } else {
    console.error("^7Failed to log message, please make sure you gave the bot permission to write in the log channel!\n\n");
  }
};
exports("LogDiscordMessage", global.LogDiscordMessage);
