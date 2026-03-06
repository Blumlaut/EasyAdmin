// bot/commands/warn.js
module.exports = {
  data: new SlashCommandBuilder().setName("warn").setDescription("Warn a User").addStringOption((option) => option.setName("user").setDescription("Username or ID").setRequired(true)).addStringOption((option) => option.setName("reason").setDescription("Reason Text").setRequired(true)),
  async execute(interaction, exports2) {
    const userOrId = interaction.options.getString("user");
    const reason = exports2[EasyAdmin].formatShortcuts(interaction.options.getString("reason"));
    const user = await findPlayerFromUserInput(userOrId);
    if (!user || user.dropped) {
      interaction.reply({ content: "Sorry, i couldn't find any user with the infos you provided.", ephemeral: true });
      return;
    }
    var src = interaction.member.user.tag;
    var ret = await exports2[EasyAdmin].warnPlayer(src, user.id, reason);
    var embed;
    if (ret) {
      embed = await prepareGenericEmbed(`Successfully warned **${user.name}** for **${reason}**`);
    } else {
      embed = await prepareGenericEmbed("Could not warn this user. (Maybe this user is immune)");
    }
    await interaction.reply({ embeds: [embed] });
  }
};
