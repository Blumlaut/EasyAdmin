// bot/commands/configure.js
async function configForward(interaction, exports2) {
  var embed = await prepareGenericEmbed("Alright! Now please write the type of log to forward (see <https://easyadmin.readthedocs.io/en/latest/config/> for examples)");
  if (!interaction.replied) {
    await interaction.reply({ embeds: [embed] });
  } else {
    await interaction.followUp({ embeds: [embed] });
  }
  const filter = (m) => m.author.id == interaction.member.id && m.channel.id == interaction.channel.id;
  const collector = interaction.channel.createMessageCollector({ filter, time: 1e4, max: 1 });
  collector.on("collect", async (m) => {
    await m.fetch();
    let embed2 = await prepareGenericEmbed(`Great! Now please tag the channel you want me to log this in (like this: <#${interaction.channel.id}>).`);
    await interaction.followUp({ embeds: [embed2] });
    const filter2 = (m2) => m2.author.id == interaction.member.id && m2.channel.id == interaction.channel.id;
    const collector2 = interaction.channel.createMessageCollector({ filter: filter2, time: 1e4, max: 1 });
    collector2.on("collect", async (message) => {
      await message.fetch();
      let channel = message.mentions.channels.first().id;
      exports2[EasyAdmin].RemoveFromFile("easyadmin_permissions.cfg", `ea_addBotLogForwarding ${m.cleanContent}`, true);
      exports2[EasyAdmin].AddToFile("easyadmin_permissions.cfg", `ea_addBotLogForwarding ${m.cleanContent} ${channel}`);
      addBotLogForwarding("", [m.cleanContent, channel]);
      interaction.followUp("Done! Result has been saved into `easyadmin_permissions.cfg`.");
    });
  });
}
async function configBridge(interaction, exports2) {
  var embed = await prepareGenericEmbed(`Alright! Please tag the channel you want me to bridge (like this: <#${interaction.channel.id}>).`);
  if (!interaction.replied) {
    await interaction.reply({ embeds: [embed] });
  } else {
    await interaction.followUp({ embeds: [embed] });
  }
  const filter = (m) => m.author.id == interaction.member.id && m.channel.id == interaction.channel.id;
  const collector = interaction.channel.createMessageCollector({ filter, time: 1e4, max: 1 });
  collector.on("collect", async (m) => {
    await m.fetch();
    let channel = m.mentions.channels.first().id;
    exports2[EasyAdmin].RemoveFromFile("easyadmin_permissions.cfg", "set ea_botChatBridge", true);
    exports2[EasyAdmin].AddToFile("easyadmin_permissions.cfg", `set ea_botChatBridge ${channel}`);
    SetConvar("ea_botChatBridge", `${channel}`);
    interaction.followUp("Done! Result has been saved into `easyadmin_permissions.cfg`.");
  });
}
async function configLiveStatus(interaction, exports2) {
  var embed = await prepareGenericEmbed(`Alright! Please tag the channel you want me to post the live status in, make sure its empty and that normal people can't write there! (like this: <#${interaction.channel.id}>).`);
  if (!interaction.replied) {
    await interaction.reply({ embeds: [embed] });
  } else {
    await interaction.followUp({ embeds: [embed] });
  }
  const filter = (m) => m.author.id == interaction.member.id && m.channel.id == interaction.channel.id;
  const collector = interaction.channel.createMessageCollector({ filter, time: 1e4, max: 1 });
  collector.on("collect", async (m) => {
    await m.fetch();
    let channel = m.mentions.channels.first().id;
    exports2[EasyAdmin].RemoveFromFile("easyadmin_permissions.cfg", "set ea_botStatusChannel", true);
    exports2[EasyAdmin].AddToFile("easyadmin_permissions.cfg", `set ea_botStatusChannel ${channel}`);
    SetConvar("ea_botStatusChannel", `${channel}`);
    interaction.followUp("Done! Result has been saved into `easyadmin_permissions.cfg`.");
  });
}
module.exports = {
  data: new SlashCommandBuilder().setName("configure").setDescription("Configure various easyadmin features").addStringOption((option) => option.setName("setting").setDescription("The setting to change").setRequired(true).addChoices(
    { name: "Log Forwarding", value: "logfwd" },
    { name: "Chat Bridge", value: "chatbridge" },
    { name: "Live Server Status", value: "serverstatus" }
  )),
  async execute(interaction, exports2) {
    const setting = interaction.options.getString("setting");
    if (setting == "logfwd") {
      configForward(interaction, exports2);
    } else if (setting == "chatbridge") {
      configBridge(interaction, exports2);
    } else if (setting == "serverstatus") {
      configLiveStatus(interaction, exports2);
    }
  }
};
