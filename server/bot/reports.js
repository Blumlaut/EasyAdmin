
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
        embed.addFields([{name:"Player Report", value: `**${report.reporterName}** reported **${report.reportedName}**!`}])
    } else {
        embed.addFields([{name:"Admin Call", value: `**${report.reporterName}** called for an Admin!`}])
    }
    
    embed.addFields([
        {name:"Reason", value: `\`\`\`\n${report.reason}\`\`\``},
        {name:"Report ID", value: `#${report.id}`, inline: true},
        {name:"Claimed by", value:`${(report.claimedName || "Noone")}`, inline: true}])

    return {embeds: [embed]}
    
}
    
async function logNewReport(report) {
    if (GetConvar("ea_botToken", "") != "") {
        var reportId = report.id
        reports[reportId] = report
        var reportMessage = generateReportEmbed(report)
        var channel = await client.channels.cache.get(GetConvar("ea_botLogChannel", ""))
        if (report.type == 1 && botLogForwards["report"]) {
            channel = await client.channels.cache.get(botLogForwards["report"])
        } else if (report.type == 0 && botLogForwards["calladmin"]) {
            channel = await client.channels.cache.get(botLogForwards["calladmin"])
        }

        var msg = await channel.send(reportMessage)
        reports[reportId].msg = msg
    } else {
        return false
    }
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
