// bot/commands/unban.js
module.exports = {
  data: new SlashCommandBuilder().setName("unban").setDescription("unbans a User").addIntegerOption((option) => option.setName("banid").setDescription("Ban ID").setRequired(true)),
  async execute(interaction, exports2) {
    const banId = interaction.options.getInteger("banid");
    var ret = await exports2[EasyAdmin].unbanPlayer(banId);
    if (ret == true) {
      let embed = await prepareGenericEmbed(`Successfully removed Ban **#${banId}**.`);
      await interaction.reply({ embeds: [embed] });
    } else {
      let embed = await prepareGenericEmbed(`Failed to remove ban **#${banId}**, make sure the ID is valid.`);
      await interaction.reply({ embeds: [embed] });
    }
  }
};
