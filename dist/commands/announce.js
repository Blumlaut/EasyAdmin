// bot/commands/announce.js
module.exports = {
  data: new SlashCommandBuilder().setName("announce").setDescription("send a announcement to the server").addStringOption((option) => option.setName("reason").setDescription("Reason Text").setRequired(true)),
  async execute(interaction, exports2) {
    var reason = exports2[EasyAdmin].formatShortcuts(interaction.options.getString("reason"));
    var ret = await exports2[EasyAdmin].announce(reason);
    if (ret) {
      let embed = await prepareGenericEmbed(`Succesfully sent an announcement 
reason: ${reason}`);
      await interaction.reply({ embeds: [embed] });
    } else {
      let embed = await prepareGenericEmbed("Could not send an annoucement.");
      await interaction.reply({ embeds: [embed] });
    }
  }
};
