
var reports = []

function generateReportEmbed(report, disabled, closed) {
    var reportId = report.id
    
    var embed = new EmbedBuilder()
    .setTimestamp()
    
    if (closed) {
        embed.setColor(808080)
    } else {
        embed.setColor(65280)
    }
    
    if (report.type == 1) {
        embed.addFields({name:"Player Report", value: `**${report.reporterName}** reported **${report.reportedName}**!`})
    } else {
        embed.addFields({name:"Admin Call", value: `**${report.reporterName}** called for an Admin!`})
    }
    
    embed.addFields(
        {name:"Reason", value: `\`\`\`\n${report.reason}\`\`\``},
        {name:"Report ID", value: `#${report.id}`, inline: true},
        {name:"Claimed by", value:`${(report.claimedName || "Noone")}`, inline: true})
        
        
        
        /* 
        const row = new ActionRow()
        
        var button = new ButtonComponent()
        
        button.setCustomId(`report_close${reportId}`)
        button.setLabel('Close Report')
        
        if (disabled) {
            button.setDisabled(true)
        }
        
        row.addComponents(button)
        */
        
    return {embeds: [embed], /* components: [row] */}
    
}
    
async function logNewReport(report) {
    var reportId = report.id
    reports[reportId] = report
    
    
    
    var reportMessage = generateReportEmbed(report)
    
    
    var msg = await client.channels.cache.get(GetConvar("ea_botLogChannel", "")).send(reportMessage)
    reports[reportId].msg = msg
    
    
    /*
    const filter = i => (i.customId === `report_close${reportId}`);
    
    const collector = interaction.channel.createMessageComponentCollector({
        filter,
        time: 240000
    });
    
    collector.on('collect', async i => {
        if (i.customId === `report_close${reportId}` && await DoesGuildMemberHavePermission(i.member, "player.reports.process")) {
            var reportMessage = generateReportEmbed(report, true, true)
            
            msg.edit(reportMessage)
        }
        await i.deferUpdate()
    });
    */
    
}


on('EasyAdmin:reportAdded', async function(reportdata) {
    logNewReport(reportdata)
})

on('EasyAdmin:reportClaimed', async function (reportdata) {
    var reportId = reportdata.id
    if(reports[reportId]) {
        reports[reportId].claimed = reportdata.claimed
        reports[reportId].claimedName = reportdata.claimedName
        let reportMessage = generateReportEmbed(reports[reportId], true)
        reports[reportId].msg.edit(reportMessage)
    }
})

on("EasyAdmin:reportRemoved", async function(reportdata) {
    var reportId = reportdata.id
    if(reports[reportId]) {
        var reportMessage = generateReportEmbed(reports[reportId], true, true)
        reports[reportId].msg.edit(reportMessage)
        reports[reportId] = undefined
    }
})
