// IMPORTS - loads Discord embed tools and owed coin storage.
const { SlashCommandBuilder, EmbedBuilder } = require('discord.js');
const { addCoins } = require('../caseStore');

const COOLDOWN_MS = 10 * 60 * 1000;
const cooldowns = new Map();

const SYMBOLS = ['7', '$', '*', '#', '+'];
const PAYOUTS = {
    3: 5000,
    4: 10000,
    5: 20000,
    6: 30000,
    7: 40000,
    8: 50000,
    9: 100000,
};

function formatCoins(amount) {
    return amount.toLocaleString('en-US');
}

function getUser(interactionOrMessage, isInteraction) {
    return isInteraction ? interactionOrMessage.user : interactionOrMessage.author;
}

function getCooldownText(ms) {
    const minutes = Math.ceil(ms / 60000);

    return `${minutes} minute${minutes === 1 ? '' : 's'}`;
}

function createCard() {
    return Array.from({ length: 9 }, () => SYMBOLS[Math.floor(Math.random() * SYMBOLS.length)]);
}

function getBestMatch(card) {
    const counts = new Map();

    for (const symbol of card) {
        counts.set(symbol, (counts.get(symbol) || 0) + 1);
    }

    return Math.max(...counts.values());
}

function formatCard(card) {
    return [
        card.slice(0, 3).join(' | '),
        card.slice(3, 6).join(' | '),
        card.slice(6, 9).join(' | '),
    ].join('\n');
}

module.exports = {
    data: new SlashCommandBuilder()
        .setName('scratchcard')
        .setDescription('Scratch a card for owed coins'),

    async execute(interactionOrMessage) {
        const isInteraction = typeof interactionOrMessage.isChatInputCommand === 'function'
            && interactionOrMessage.isChatInputCommand();
        const user = getUser(interactionOrMessage, isInteraction);
        const now = Date.now();
        const availableAt = cooldowns.get(user.id) || 0;

        if (availableAt > now) {
            const message = `You can scratch another card in **${getCooldownText(availableAt - now)}**.`;

            return isInteraction
                ? interactionOrMessage.reply({ content: message, ephemeral: true })
                : interactionOrMessage.reply(message);
        }

        cooldowns.set(user.id, now + COOLDOWN_MS);

        const card = createCard();
        const bestMatch = getBestMatch(card);
        const prize = PAYOUTS[bestMatch] || 0;
        const embed = new EmbedBuilder()
            .setTitle('Scratchcard')
            .setColor('#47b36b')
            .addFields(
                { name: 'Card', value: `\`\`\`\n${formatCard(card)}\n\`\`\``, inline: false },
                { name: 'Best Match', value: `${bestMatch} matching symbol${bestMatch === 1 ? '' : 's'}`, inline: false },
            );

        if (prize > 0) {
            const owedCoins = addCoins(user.id, prize);
            embed.addFields({
                name: 'Owed Coins',
                value: `Added **${formatCoins(prize)}** coins.\nTotal owed: **${formatCoins(owedCoins)}** coins.`,
                inline: false,
            });
        } else {
            embed.setFooter({ text: 'No coins were added this time.' });
        }

        return interactionOrMessage.reply({ embeds: [embed] });
    },
};
