// IMPORTS - loads Discord command tools and owed coin storage.
const { SlashCommandBuilder, EmbedBuilder } = require('discord.js');
const { clearCoins, getCoins } = require('../caseStore');

function formatCoins(amount) {
    return amount.toLocaleString('en-US');
}

function hasStaffRole(member) {
    const staffRoleId = process.env.STAFF_ROLE_ID;

    return Boolean(staffRoleId && member?.roles?.cache?.has(staffRoleId));
}

async function getTargetUser(interactionOrMessage, args, isInteraction) {
    if (isInteraction) {
        return interactionOrMessage.options.getUser('user');
    }

    const userArg = args[0];

    if (!userArg) {
        return null;
    }

    const userId = userArg.replace(/[<@!>]/g, '');
    const member = await interactionOrMessage.guild.members.fetch(userId);

    return member.user;
}

// CLEARCOINS COMMAND - lets staff clear a user's owed coins after paying them.
module.exports = {
    data: new SlashCommandBuilder()
        .setName('clearcoins')
        .setDescription('Clears a user owed coin balance after staff pay it')
        .addUserOption(option =>
            option
                .setName('user')
                .setDescription('The user whose owed coins should be cleared')
                .setRequired(true),
        ),

    async execute(interactionOrMessage, args = []) {
        const isInteraction = typeof interactionOrMessage.isChatInputCommand === 'function'
            && interactionOrMessage.isChatInputCommand();

        if (!hasStaffRole(interactionOrMessage.member)) {
            const message = 'Only staff members can clear owed coins.';

            return isInteraction
                ? interactionOrMessage.reply({ content: message, ephemeral: true })
                : interactionOrMessage.reply(message);
        }

        let targetUser;

        try {
            targetUser = await getTargetUser(interactionOrMessage, args, isInteraction);
        } catch (error) {
            targetUser = null;
        }

        if (!targetUser) {
            const message = 'Usage: `!clearcoins @user`';

            return isInteraction
                ? interactionOrMessage.reply({ content: message, ephemeral: true })
                : interactionOrMessage.reply(message);
        }

        const owedCoins = getCoins(targetUser.id);

        if (owedCoins <= 0) {
            const message = `${targetUser} is not owed any coins.`;

            return isInteraction
                ? interactionOrMessage.reply({ content: message, ephemeral: true })
                : interactionOrMessage.reply(message);
        }

        const clearedCoins = clearCoins(targetUser.id);
        const executor = isInteraction ? interactionOrMessage.user : interactionOrMessage.author;
        const embed = new EmbedBuilder()
            .setTitle('Owed Coins Cleared')
            .setColor('#47b36b')
            .addFields(
                { name: 'User', value: `${targetUser}`, inline: true },
                { name: 'Cleared Amount', value: `${formatCoins(clearedCoins)} coins`, inline: true },
                { name: 'Cleared By', value: `${executor}`, inline: false },
            )
            .setTimestamp();

        return interactionOrMessage.reply({ embeds: [embed] });
    },
};
