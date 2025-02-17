// bot/commands/add_ace.js
module.exports = {
  data: new SlashCommandBuilder().setName("add_ace").setDescription("Adds a permission to a group, saves into easyadmin_permissions.cfg"),
  async execute(interaction, exports2) {
    var timestamp = Date.now();
    const modal = new ModalBuilder().setCustomId("addaceModal" + timestamp).setTitle("Add ACE");
    const groupName = new TextInputBuilder().setCustomId("groupName").setLabel("Group Name").setStyle(TextInputStyle.Short).setRequired(true).setMaxLength(120).setPlaceholder("group.admin");
    const permission = new TextInputBuilder().setCustomId("permission").setLabel("Permission").setStyle(TextInputStyle.Short).setRequired(true).setMaxLength(120).setPlaceholder("easyadmin.bot.playerlist");
    const firstActionRow = new ActionRowBuilder().addComponents(groupName);
    const secondActionRow = new ActionRowBuilder().addComponents(permission);
    modal.addComponents(firstActionRow, secondActionRow);
    interaction.showModal(modal);
    const filter = (interaction2) => interaction2.customId === "addaceModal" + timestamp;
    interaction.awaitModalSubmit({ filter, time: 12e4 }).then(async (interaction2) => {
      var group = interaction2.fields.getTextInputValue("groupName");
      var permission2 = interaction2.fields.getTextInputValue("permission");
      var query = `add_ace ${group} ${permission2} allow`;
      exports2[EasyAdmin].AddToFile("easyadmin_permissions.cfg", query);
      ExecuteCommand(query);
      interaction2.reply(`\`${query}\` has been executed and saved.`);
    }).catch(async () => {
    });
  }
};
