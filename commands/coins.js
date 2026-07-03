// IMPORTS - loads Discord embed tools and owed coin storage.
const { SlashCommandBuilder, EmbedBuilder } = require('discord.js');
const { getCoins } = require('../caseStore');

function formatCoins(amount) {
    return amount.toLocaleString('en-US');
}

function getRequester(interactionOrMessage, isInteraction) {
    return isInteraction ? interactionOrMessage.user : interactionOrMessage.author;
}

// COINS COMMAND - shows how many UnbelievaBoat coins the bot owes a user.
module.exports = {
    data: new SlashCommandBuilder()
        .setName('coins')
        .setDescription('Shows how many coins you are owed from case rewards'),

    async execute(interactionOrMessage) {
        const isInteraction = typeof interactionOrMessage.isChatInputCommand === 'function'
            && interactionOrMessage.isChatInputCommand();
        const user = getRequester(interactionOrMessage, isInteraction);
        const owedCoins = getCoins(user.id);

        const embed = new EmbedBuilder()
            .setTitle('Owed Coins')
            .setColor('#47b36b')
            .setDescription(`${user} is owed **${formatCoins(owedCoins)}** coins.`)
            .setFooter({ text: 'A moderator can pay this through UnbelievaBoat, then run !clearcoins @user.' });

        return interactionOrMessage.reply({ embeds: [embed] });
    },
};
