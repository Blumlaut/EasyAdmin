// bot/commands/screenshot.js
module.exports = {
  data: new SlashCommandBuilder().setName("screenshot").setDescription("Takes a screenshot of the player's screen").addStringOption((option) => option.setName("user").setDescription("Username or ID").setRequired(true)),
  async execute(interaction, exports2) {
    const userOrId = interaction.options.getString("user");
    var embed = await prepareGenericEmbed("Taking Screenshot, please wait.");
    await interaction.reply({ embeds: [embed] });
    var inProgress = await exports2[EasyAdmin].isScreenshotInProgress();
    if (inProgress) {
      let embed2 = await prepareGenericEmbed("A screenshot is already in progress! Please try again later.");
      interaction.editReply({ embeds: [embed2] });
      return;
    }
    const user = await findPlayerFromUserInput(userOrId);
    if (!user || user.dropped) {
      interaction.editReply({ content: "Sorry, i couldn't find any user with the infos you provided.", ephemeral: true });
      return;
    }
    emit("EasyAdmin:TakeScreenshot", user.id);
    const screenshotHandler = async function(result) {
      if (result == "ERROR") {
        return;
      }
      var screenshotUrl = await exports2[EasyAdmin].matchURL(result.toString());
      RemoveEventHandler("EasyAdmin:TookScreenshot", screenshotHandler);
      clearTimeout(failedTimeout);
      let embed2 = await prepareGenericEmbed(`Screenshot of **${user.name}**'s game taken.`, void 0, void 0, void 0, screenshotUrl);
      await interaction.editReply({ embeds: [embed2] });
    };
    onNet("EasyAdmin:TookScreenshot", screenshotHandler);
    var failedTimeout = setTimeout(async function() {
      RemoveEventHandler("EasyAdmin:TookScreenshot", screenshotHandler);
      let embed2 = await prepareGenericEmbed(`Screenshot of **${user.name}**'s game failed!`, void 0, 16711680);
      await interaction.editReply({ embeds: [embed2] });
    }, 25e3);
  }
};
