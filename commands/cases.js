// IMPORTS - loads Discord embed tools and case choices.
const { SlashCommandBuilder, EmbedBuilder } = require('discord.js');
const { getCaseChoices } = require('../caseConfig');

// CASES COMMAND - shows all event cases in one embed.
module.exports = {
    // COMMAND DATA - registers /cases.
    data: new SlashCommandBuilder()
        .setName('cases')
        .setDescription('Shows Event Cases'),
    // COMMAND RUNNER - handles both slash command and !cases prefix usage.
    async execute(interactionOrMessage) {
        // CASE LIST - formats every configured case for display.
        const caseList = getCaseChoices()
            .map(choice => `\`${choice.value}\` - ${choice.name}`)
            .join('\n');

        // RESPONSE EMBED - sends the case list and example commands.
        const embed = new EmbedBuilder()
            .setTitle('Eco Season Cases')
            .setColor(0x00AE86)
            .setDescription(caseList)
            .addFields(
                { name: 'View', value: '`!view case1`', inline: true },
                { name: 'Open', value: '`!roll case1`', inline: true },
            )
            .setTimestamp();

        await interactionOrMessage.reply({ embeds: [embed] });
    },
};
