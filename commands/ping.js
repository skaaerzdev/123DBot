// IMPORTS - loads Discord command and embed builders.
const { SlashCommandBuilder, EmbedBuilder } = require('discord.js');

// PING COMMAND - checks bot and Discord API latency.
module.exports = {
    // COMMAND DATA - registers /ping.
    data: new SlashCommandBuilder()
        .setName('ping')
        .setDescription('Replies with Pong and latency(ms)'),
    // COMMAND RUNNER - handles both slash command and !ping prefix usage.
    async execute(interactionOrMessage, args) {
        const isInteraction = typeof interactionOrMessage.isChatInputCommand === 'function'
            && interactionOrMessage.isChatInputCommand();

        // LATENCY - calculates how long the bot took to receive the command.
        const pingTime = Date.now() - interactionOrMessage.createdTimestamp;
        // RESPONSE EMBED - shows bot latency and Discord websocket latency.
        const embed = new EmbedBuilder()
            .setTitle('Pong!')
            .setColor(0xc2aa50)
            .addFields(
                { name: 'Bot Latency', value: `${pingTime}ms`, inline: true },
                { name: 'API Latency', value: `${Math.round(interactionOrMessage.client.ws.ping)}ms`, inline: true }
            )
            .setTimestamp();

        await interactionOrMessage.reply({ embeds: [embed] });
    },
}
