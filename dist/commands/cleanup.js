// bot/commands/cleanup.js
module.exports = {
  data: new SlashCommandBuilder().setName("cleanup").setDescription("Cleans up area of type").addStringOption((option) => option.setName("type").setDescription("Type of Entity to clean up.").setRequired(true).addChoices(
    { name: "Vehicles", value: "cars" },
    { name: "Peds", value: "peds" },
    { name: "Props", value: "props" }
  )),
  async execute(interaction, exports2) {
    const type = interaction.options.getString("type");
    var ret = exports2[EasyAdmin].cleanupArea(type);
    if (ret) {
      let embed = await prepareGenericEmbed(`Cleaned up **${type}**.`);
      await interaction.reply({ embeds: [embed] });
    } else {
      let embed = await prepareGenericEmbed(`Could not cleanup **${type}**.`);
      await interaction.reply({ embeds: [embed] });
    }
  }
};
