// IMPORTS - loads Discord embed tools and case data.
const { SlashCommandBuilder, EmbedBuilder } = require('discord.js');
const { cases } = require('../caseConfig');

const ALLOWED_USER_ID = '650722302534615091';

// ITEM FORMATTER - turns one reward into display text for the embed.
function formatIcon(icon) {
    if (!icon) return '';
    if (/^https?:\/\//i.test(icon)) return `[image](${icon})`;

    return icon;
}

function formatChance(chance) {
    return Number.isInteger(chance)
        ? `${chance}%`
        : `${chance.toFixed(2).replace(/\.?0+$/, '')}%`;
}

function formatItem(item) {
    const icon = formatIcon(item.icon);
    const itemName = icon ? `${icon} ${item.name}` : item.name;

    return `- ${formatChance(item.chance)} : ${itemName}`;
}

function createCaseEmbed(caseInfo) {
    const embed = new EmbedBuilder()
        .setTitle(caseInfo.displayName)
        .setColor(caseInfo.embedColor || '#c2aa50')
        .setDescription(caseInfo.items.map(formatItem).join('\n'));

    if (caseInfo.imageUrl) {
        embed.setImage(caseInfo.imageUrl);
    }

    return embed;
}

// LISTCASES COMMAND - sends each case as its own embed in one message.
module.exports = {
    data: new SlashCommandBuilder()
        .setName('listcases')
        .setDescription('Shows every case and its rewards'),

    async execute(interactionOrMessage) {
        const isInteraction = typeof interactionOrMessage.isChatInputCommand === 'function'
            && interactionOrMessage.isChatInputCommand();
        const userId = isInteraction
            ? interactionOrMessage.user.id
            : interactionOrMessage.author.id;

        if (userId !== ALLOWED_USER_ID) {
            const message = 'Only the bot owner can use this command.';

            return isInteraction
                ? interactionOrMessage.reply({ content: message, ephemeral: true })
                : interactionOrMessage.reply(message);
        }

        const embeds = Object.values(cases).map(createCaseEmbed);

        return interactionOrMessage.reply({ embeds });
    },
};
