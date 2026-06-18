// bot/commands/notes.js
module.exports = {
  data: new SlashCommandBuilder().setName("notes").setDescription("View admin notes for a player").addStringOption((option) => option.setName("user").setDescription("Username or ID").setRequired(true)),
  async execute(interaction, exports2) {
    const userOrId = interaction.options.getString("user");
    const user = await findPlayerFromUserInput(userOrId);
    if (!user) {
      interaction.reply({ content: "Sorry, I couldn't find any user with the info you provided. If they have recently left, try using their ID instead of username.", ephemeral: true });
      return;
    }
    const notes = await exports2[EasyAdmin].getAdminNotes(user.identifiers);
    if (!notes || notes.length === 0) {
      let embed2 = await prepareGenericEmbed(`No admin notes found for **${user.name}**.`);
      return interaction.reply({ embeds: [embed2] });
    }
    const embed = new EmbedBuilder().setColor(16777214).setTimestamp();
    embed.addFields([{ name: "Admin Notes", value: `Showing last ${Math.min(notes.length, 10)} of ${notes.length} note(s) for **${user.name}**` }]);
    const entries = notes.slice(-10).reverse();
    for (const entry of entries) {
      const moderator = entry.moderator || "Unknown";
      embed.addFields([{
        name: `[#${entry.id}] ${entry.time} \u2014 ${moderator}`,
        value: entry.content.substring(0, 1020),
        inline: false
      }]);
    }
    await interaction.reply({ embeds: [embed] });
  }
};
