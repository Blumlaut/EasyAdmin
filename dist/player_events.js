// bot/player_events.js
if (GetConvar("ea_botToken", "") != "") {
  on("playerJoining", function() {
    const player = global.source;
    if (GetConvar("ea_botToken", "") != "" && GetConvar("ea_botLogChannel", "") != "") {
      var msg = `Player **${exports[EasyAdmin].getName(player, true, true)}** with id **${player}** joined the Server!`;
      LogDiscordMessage(msg, "joinleave");
    }
  });
  on("playerConnecting", function() {
    if (GetConvar("ea_botToken", "") == "") return;
    const player = global.source;
    exports[EasyAdmin].syncDiscordRoles(player);
  });
  on("playerDropped", () => {
    if (GetConvar("ea_botToken", "") == "") return;
    var player = global.source;
    if (GetConvar("ea_botChatBridge", "") != "") {
      knownAvatars[player] = void 0;
    }
    if (GetConvar("ea_botLogChannel", "") != "") {
      var msg = `Player **${exports[EasyAdmin].getName(player, true, true)}** left the server!`;
      global.LogDiscordMessage(msg, "joinleave");
    }
  });
}
