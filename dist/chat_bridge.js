// bot/chat_bridge.js
try {
  knownAvatars = {};
  exports["chat"].registerMessageHook(async function(source, outMessage) {
    if (GetConvar("ea_botChatBridge", "") == "") {
      return;
    }
    const user = await exports[EasyAdmin].getCachedPlayer(source);
    if (!user) {
      return;
    }
    var userInfo = { name: outMessage.args[0] };
    if (knownAvatars[source] == void 0) {
      var fivemAccount = false;
      for (let identifier of user.identifiers) {
        if (identifier.search("fivem:") != -1) {
          fivemAccount = identifier.substring(identifier.indexOf(":") + 1);
        }
      }
      if (fivemAccount) {
        var response = await exports[EasyAdmin].HTTPRequest(`https://policy-live.fivem.net/api/getUserInfo/${fivemAccount}`);
        try {
          response = JSON.parse(response);
          if (response.avatar_template) {
            var avatarURL = response.avatar_template.replace("{size}", "96");
            if (avatarURL.indexOf("http") == -1) {
              avatarURL = `https://forum.cfx.re${avatarURL}`;
            }
            userInfo.iconURL = avatarURL;
            knownAvatars[source] = avatarURL;
          } else {
            knownAvatars[source] = false;
          }
        } catch {
          knownAvatars[source] = false;
        }
      } else {
        knownAvatars[source] = false;
      }
    } else {
      userInfo.iconURL = knownAvatars[source];
    }
    if (knownAvatars[source] == false) {
      userInfo.iconURL = void 0;
    }
    var embed = await prepareGenericEmbed(void 0, void 0, 55555, void 0, void 0, userInfo, outMessage.args[1], false);
    client.channels.cache.get(GetConvar("ea_botChatBridge", "")).send({ embeds: [embed] });
  });
} catch (error) {
  if (GetConvar("ea_botChatBridge", "") != "") {
    console.error("Registering Chat Bridge failed, you will need to update your chat resource from https://github.com/citizenfx/cfx-server-data to use it.");
  }
}
client.on("messageCreate", async (msg) => {
  if (GetConvar("ea_botChatBridge", "") == "") {
    return;
  }
  if (!msg.member || msg.author.bot) {
    return;
  }
  if (msg.author.id == userID) {
    return;
  }
  if (!msg.channel) {
    return;
  }
  if (msg.channel.id == GetConvar("ea_botChatBridge", "")) {
    exports["chat"].addMessage(-1, { args: [msg.member.user.tag, msg.cleanContent] });
  }
});
on("playerDropped", () => {
  if (GetConvar("ea_botChatBridge", "") == "") {
    return;
  }
  knownAvatars[global.source] = void 0;
});
