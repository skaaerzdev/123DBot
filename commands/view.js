// IMPORTS - loads Discord embed tools and case helpers.
const { SlashCommandBuilder, EmbedBuilder } = require('discord.js');
const { getCase, getCaseChoices } = require('../caseConfig');

// ITEM FORMATTER - turns one reward into display text for the embed.
function formatIcon(icon) {
    if (!icon) return '';
    if (/^https?:\/\//i.test(icon)) return `[image](${icon})`;

    return icon;
}

function formatItem(item, index) {
    const icon = formatIcon(item.icon);
    const itemName = icon ? `${icon} ${item.name}` : item.name;

    return `${index + 1}. ${item.chance}% : ${itemName}`;
}

// VIEW COMMAND - shows the rewards inside one case.
module.exports = {
    // COMMAND DATA - registers /view with a required case argument.
    data: new SlashCommandBuilder()
        .setName('view')
        .setDescription('Shows the items inside a case')
        .addStringOption(option =>
            option
                .setName('case')
                .setDescription('The case to view')
                .setRequired(true)
                .addChoices(...getCaseChoices()),
        ),

    // COMMAND RUNNER - handles both slash command and !view prefix usage.
    async execute(interactionOrMessage, args = []) {
        const isInteraction = typeof interactionOrMessage.isChatInputCommand === 'function'
            && interactionOrMessage.isChatInputCommand();
        // CASE LOOKUP - reads the case name and finds its config.
        const caseName = isInteraction
            ? interactionOrMessage.options.getString('case')
            : args[0];
        const caseInfo = getCase(caseName);

        // INVALID CASE - tells the user if the requested case does not exist.
        if (!caseInfo) {
            const message = 'That case does not exist. Try `!view case1`, `!view case2`, or `!view case3`.';
            return isInteraction
                ? interactionOrMessage.reply({ content: message, ephemeral: true })
                : interactionOrMessage.reply(message);
        }

        // RESPONSE EMBED - lists every item inside the selected case.
        const embed = new EmbedBuilder()
            .setTitle(caseInfo.displayName)
            .setColor(caseInfo.embedColor || '#c2aa50')
            .setDescription(caseInfo.items.map(formatItem).join('\n'));

        if (caseInfo.imageUrl) {
            embed.setImage(caseInfo.imageUrl);
        }

        return isInteraction
            ? interactionOrMessage.reply({ embeds: [embed] })
            : interactionOrMessage.channel.send({ embeds: [embed] });
    },
};
