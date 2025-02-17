// bot/commands/remove_ace.js
module.exports = {
  data: new SlashCommandBuilder().setName("remove_ace").setDescription("Removes a permission from a group, saves into easyadmin_permissions.cfg"),
  async execute(interaction, exports2) {
    var timestamp = Date.now();
    const modal = new ModalBuilder().setCustomId("removeaceModal" + timestamp).setTitle("Remove ACE");
    const groupName = new TextInputBuilder().setCustomId("groupName").setLabel("Group Name").setStyle(TextInputStyle.Short).setRequired(true).setMaxLength(120).setPlaceholder("group.admin");
    const permission = new TextInputBuilder().setCustomId("permission").setLabel("Permission").setStyle(TextInputStyle.Short).setRequired(true).setMaxLength(120).setPlaceholder("easyadmin.bot.playerlist");
    const firstActionRow = new ActionRowBuilder().addComponents(groupName);
    const secondActionRow = new ActionRowBuilder().addComponents(permission);
    modal.addComponents(firstActionRow, secondActionRow);
    interaction.showModal(modal);
    const filter = (interaction2) => interaction2.customId === "removeaceModal" + timestamp;
    interaction.awaitModalSubmit({ filter, time: 12e4 }).then(async (interaction2) => {
      var group = interaction2.fields.getTextInputValue("groupName");
      var permission2 = interaction2.fields.getTextInputValue("permission");
      var query = `remove_ace ${group} ${permission2} allow`;
      exports2[EasyAdmin].RemoveFromFile("easyadmin_permissions.cfg", `add_ace ${group} ${permission2} allow`);
      ExecuteCommand(query);
      interaction2.reply(`\`${query}\` has been executed and saved.`);
    }).catch(async () => {
    });
  }
};
