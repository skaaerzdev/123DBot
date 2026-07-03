// IMPORTS - loads Discord embed tools and owed coin storage.
const { SlashCommandBuilder, EmbedBuilder } = require('discord.js');
const { addCoins } = require('../caseStore');

const COOLDOWN_MS = 60 * 60 * 1000;
const cooldowns = new Map();

const WHEEL_PRIZES = [
    { label: 'Nothing', amount: 0, weight: 50 },
    { label: '1,000 Coins', amount: 1000, weight: 24 },
    { label: '2,000 Coins', amount: 2000, weight: 14 },
    { label: '5,000 Coins', amount: 5000, weight: 7 },
    { label: '7,000 Coins', amount: 7000, weight: 4 },
    { label: '10,000 Coins', amount: 10000, weight: 1 },
];

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

function pickWeighted(items) {
    const totalWeight = items.reduce((total, item) => total + item.weight, 0);
    let roll = Math.random() * totalWeight;

    for (const item of items) {
        roll -= item.weight;
        if (roll <= 0) return item;
    }

    return items[items.length - 1];
}

module.exports = {
    data: new SlashCommandBuilder()
        .setName('wheel')
        .setDescription('Spin the prize wheel for owed coins'),

    async execute(interactionOrMessage) {
        const isInteraction = typeof interactionOrMessage.isChatInputCommand === 'function'
            && interactionOrMessage.isChatInputCommand();
        const user = getUser(interactionOrMessage, isInteraction);
        const now = Date.now();
        const availableAt = cooldowns.get(user.id) || 0;

        if (availableAt > now) {
            const message = `You can spin the wheel again in **${getCooldownText(availableAt - now)}**.`;

            return isInteraction
                ? interactionOrMessage.reply({ content: message, ephemeral: true })
                : interactionOrMessage.reply(message);
        }

        cooldowns.set(user.id, now + COOLDOWN_MS);

        const prize = pickWeighted(WHEEL_PRIZES);
        const embed = new EmbedBuilder()
            .setTitle('Prize Wheel')
            .setColor('#47b36b')
            .addFields({ name: 'Result', value: `You spun **${prize.label}**.`, inline: false });

        if (prize.amount > 0) {
            const owedCoins = addCoins(user.id, prize.amount);
            embed.addFields({
                name: 'Owed Coins',
                value: `Added **${formatCoins(prize.amount)}** coins.\nTotal owed: **${formatCoins(owedCoins)}** coins.`,
                inline: false,
            });
        } else {
            embed.setFooter({ text: 'No coins were added this time.' });
        }

        return interactionOrMessage.reply({ embeds: [embed] });
    },
};
