// IMPORTS - loads Discord command and embed builders.
const { SlashCommandBuilder, EmbedBuilder } = require('discord.js');

// INFO COMMAND - lists every command loaded by the bot.
module.exports = {
    // COMMAND DATA - registers /info.
    data: new SlashCommandBuilder()
        .setName('info')
        .setDescription('Shows all commands'),
    // COMMAND RUNNER - handles both slash command and !info prefix usage.
    async execute(interactionOrMessage) {
        const isInteraction = typeof interactionOrMessage.isChatInputCommand === 'function'
            && interactionOrMessage.isChatInputCommand();

        // COMMAND COLLECTION - gets every loaded command from the Discord client.
        const { commands } = interactionOrMessage.client;

        // COMMAND LIST - turns command names into prefix examples.
        const commandList = Array.from(commands.values())
            .map(cmd => `!${cmd.data.name}`)
            .join('\n');

        // RESPONSE EMBED - shows the commands in Discord.
        const embed = new EmbedBuilder()
            .setTitle('Commands')
            .setColor(0xc2aa50)
            .setDescription(`\`${commandList}\``);

        if (isInteraction) {
            await interactionOrMessage.reply({ embeds: [embed] });
        } else {
            await interactionOrMessage.channel.send({ embeds: [embed] });
        }
    },
};
