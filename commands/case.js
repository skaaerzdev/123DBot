// IMPORTS - loads Discord embed tools and case helpers.
const { SlashCommandBuilder, EmbedBuilder } = require('discord.js');
const { getCase, getCaseChoices } = require('../caseConfig');

// CASE COMMAND - shows case information and quick examples.
module.exports = {
    // COMMAND DATA - registers /case with an optional case argument.
    data: new SlashCommandBuilder()
        .setName('case')
        .setDescription('Shows case commands')
        .addStringOption(option =>
            option
                .setName('case')
                .setDescription('The case to show')
                .setRequired(false)
                .addChoices(...getCaseChoices()),
        ),

    // COMMAND RUNNER - handles both slash command and !case prefix usage.
    async execute(interactionOrMessage, args = []) {
        const isInteraction = typeof interactionOrMessage.isChatInputCommand === 'function'
            && interactionOrMessage.isChatInputCommand();
        // CASE LOOKUP - reads the selected case from slash options or prefix text.
        const caseName = isInteraction
            ? interactionOrMessage.options.getString('case')
            : args[0];
        const caseInfo = getCase(caseName);

        // CASE 1 TEST EMBED - shows a temporary test embed for !case case1.
        if (caseInfo?.name === 'case1') {
            const embed = new EmbedBuilder()
                .setTitle(caseInfo.displayName)
                .setColor(caseInfo.embedColor || '#c2aa50')
                .setDescription('testing case1');

            if (caseInfo.imageUrl) {
                embed.setImage(caseInfo.imageUrl);
            }

            return isInteraction
                ? interactionOrMessage.reply({ embeds: [embed] })
                : interactionOrMessage.channel.send({ embeds: [embed] });
        }

        // CASE LIST - builds the list of all available cases.
        const caseList = getCaseChoices()
            .map(choice => `\`${choice.value}\` - ${choice.name}`)
            .join('\n');

        // RESPONSE EMBED - shows available case commands to the user.
        const embed = new EmbedBuilder()
            .setTitle('Cases')
            .setColor(0xc2aa50)
            .setDescription(caseList)
            .addFields(
                { name: 'View items', value: '`!view case1`', inline: true },
                { name: 'Open a case', value: '`!roll case1`', inline: true },
            );

        return isInteraction
            ? interactionOrMessage.reply({ embeds: [embed] })
            : interactionOrMessage.channel.send({ embeds: [embed] });
    },
};
