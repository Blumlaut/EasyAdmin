
process.on('uncaughtException', function(err) {
    console.log('Caught exception: ', err.stack);
});
process.on('unhandledRejection', function(err) {
    console.log('Caught exception: ', err.stack);
});

Discord = require("discord.js")
AsciiTable = require('ascii-table')
sprintf = require('sprintf-js').sprintf
juration = require('juration');
const prettyMilliseconds = require('pretty-ms');
const { MessageAttachment, Collection, Intents, MessageActionRow, MessageButton, MessageSelectMenu, Guild } = require('discord.js');
const { SlashCommandBuilder } = require('@discordjs/builders');


client = new Discord.Client({
    partials: ['GUILD_MEMBER', 'USER', 'MESSAGE', 'CHANNEL', 'REACTION'],
    intents: [Intents.FLAGS.GUILDS, Intents.FLAGS.GUILD_MESSAGES, Intents.FLAGS.GUILD_MEMBERS]
});
client.commands = new Collection();

if (GetConvar("ea_botToken", "") != "") {

    client.on('ready', async () => {
        console.log(`Logged in as ${client.user.tag}!`);
        client.user.setPresence({ activities: [{ name: `${GetConvar('sv_projectName', GetConvar('sv_hostname', 'default FXServer'))}`, type: 'WATCHING' }], status: 'online' })
        console.log(`Bot is in beta! Please report any bugs at https://github.com/Blumlaut/EasyAdmin/issues`)
        userID = client.user.id;
        resourcePath = GetResourcePath(GetCurrentResourceName()) // absolute resource path, needed for FS
        guild = GetConvar("ea_botGuild", "")

        EasyAdmin = GetCurrentResourceName() // fetch our Resource name and claim we're called EasyAdmin, this just makes exports easier.

        currentVersion = await exports[EasyAdmin].GetVersion()[0]
        latestVersionInfo = await exports[EasyAdmin].getLatestVersion()


        RegisterClientCommands(client.user.id, guild)
        var startupMessage = `**EasyAdmin ${currentVersion}** has started.`
        if (currentVersion != latestVersionInfo[0]) {
            startupMessage+=`\nVersion ${latestVersionInfo[0]} is Available!\n Download it from ${latestVersionInfo[1]}`
        }
        LogDiscordMessage(startupMessage)
    });

    client.on("debug", function(info){
        if (GetConvarInt('ea_logLevel', 1) >= 4 ) {
            console.log(`${info}`);
        }
    });




    async function RegisterClientCommands(clientId,guildId) {
        const { REST } = require('@discordjs/rest');
        const { Routes } = require('discord-api-types/v10');
        const fs = require('fs');
    
        const commands = [];
        const commandFiles = fs.readdirSync(`${resourcePath}/server/bot/commands`).filter(file => file.endsWith('.js'));
        
        
        for (const file of commandFiles) {
            const command = require(`${resourcePath}/server/bot/commands/${file}`);
            commands.push(command.data.toJSON());
            client.commands.set(command.data.name, command);
        }
        
        const rest = new REST({ version: '10' }).setToken(GetConvar("ea_botToken", ""));
        
        rest.put(Routes.applicationGuildCommands(clientId, guildId), { body: commands })
        .catch(console.error);

        client.on('interactionCreate', async interaction => {
            if (!interaction.isCommand()) return;
        
            const command = client.commands.get(interaction.commandName);
        
            if (!command) return;
        
            if (!await DoesGuildMemberHavePermission(interaction.member, `bot.${interaction.commandName}`)) {
                await interaction.reply({ content: 'You don\'t have permission to run this command!', ephemeral: true });
                return false
            }
            try {
                await command.execute(interaction, exports); // we need to pass exports here, otherwise we won't be able to access them inside the command
            } catch (error) {
                console.error(error);
                var errorContent = { content: `There was an error while executing this command, please report the following stack trace here: <https://github.com/Blumlaut/EasyAdmin/issues> \`\`\`js\n${error.stack}\`\`\``, ephemeral: true }
                if (interaction.replied) {
                    interaction.followUp(errorContent)

                } else {
                    interaction.reply(errorContent)
                }
            }
        });
    }

    



    client.login(GetConvar("ea_botToken", ""));
}

