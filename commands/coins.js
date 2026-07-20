// IMPORTS - loads Discord embed tools and owed coin storage.
const { SlashCommandBuilder, EmbedBuilder, ActionRowBuilder, ButtonBuilder, ButtonStyle } = require('discord.js');
const { getCoins, getDropState, setDropState, addCoins } = require('../caseStore');

function formatCoins(amount) {
    return amount.toLocaleString('en-US');
}

function getRequester(interactionOrMessage, isInteraction) {
    return isInteraction ? interactionOrMessage.user : interactionOrMessage.author;
}

function hasStaffRole(member) {
    const staffRoleId = process.env.STAFF_ROLE_ID;

    return Boolean(staffRoleId && member?.roles?.cache?.has(staffRoleId));
}

function getTargetUser(interactionOrMessage, args, isInteraction) {
    if (isInteraction) {
        return interactionOrMessage.options.getUser('user') || null;
    }

    const userArg = args[0];

    if (!userArg) {
        return null;
    }

    const userId = userArg.replace(/[<@!>]/g, '');
    return interactionOrMessage.guild?.members?.cache?.get(userId)?.user || null;
}

function buildDropButton(messageId, amount) {
    return new ActionRowBuilder().addComponents(
        new ButtonBuilder()
            .setCustomId(`claim:${messageId}`)
            .setLabel(`Claim ${formatCoins(amount)} coins`)
            .setStyle(ButtonStyle.Success),
    );
}

async function maybeCreateDrop(channel) {
    if (!channel || !channel.isTextBased?.()) {
        return;
    }

    const now = Date.now();
    const dropState = getDropState();
    const isBigDrop = now >= (dropState.nextBigDropAt || 0);
    const nextDropAt = isBigDrop ? now + 2 * 60 * 60 * 1000 : now + 30 * 60 * 1000;
    const nextBigDropAt = isBigDrop ? now + 2 * 60 * 60 * 1000 : (dropState.nextBigDropAt || now + 2 * 60 * 60 * 1000);
    const amount = isBigDrop ? Math.floor(Math.random() * 50001) + 1 : Math.floor(Math.random() * 10001) + 1000;

    setDropState({
        nextDropAt,
        nextBigDropAt,
    });

    const dropMessage = await channel.send({
        content: `@everyone ${channel.client?.user?.username || 'The bot'} dropped **${formatCoins(amount)}** coins! Be first to claim it!`,
        components: [buildDropButton('pending', amount)],
    });

    const collector = dropMessage.createMessageComponentCollector({ time: 60000 * 2 });
    const claimedUsers = new Set();

    collector.on('collect', async interaction => {
        if (claimedUsers.has(interaction.user.id)) {
            await interaction.reply({ content: 'You already claimed this drop.', ephemeral: true });
            return;
        }

        claimedUsers.add(interaction.user.id);
        addCoins(interaction.user.id, amount);
        await interaction.update({ content: `${interaction.user} claimed the drop and won **${formatCoins(amount)}** coins!`, components: [] });
        collector.stop();
    });
}

// COINS COMMAND - shows how many UnbelievaBoat coins the bot owes a user.
module.exports = {
    data: new SlashCommandBuilder()
        .setName('coins')
        .setDescription('Shows how many coins you are owed from case rewards')
        .addUserOption(option =>
            option
                .setName('user')
                .setDescription('Optional user to inspect')
                .setRequired(false),
        ),

    async execute(interactionOrMessage, args = []) {
        const isInteraction = typeof interactionOrMessage.isChatInputCommand === 'function'
            && interactionOrMessage.isChatInputCommand();
        const requester = getRequester(interactionOrMessage, isInteraction);
        const targetUser = isInteraction ? interactionOrMessage.options.getUser('user') : getTargetUser(interactionOrMessage, args, isInteraction);
        const member = interactionOrMessage.member || null;
        const isModeratorLookup = Boolean(targetUser && hasStaffRole(member));

        if (targetUser && !isModeratorLookup) {
            return isInteraction
                ? interactionOrMessage.reply({ content: 'Only staff members can inspect another user balance.', ephemeral: true })
                : interactionOrMessage.reply('Only staff members can inspect another user balance.');
        }

        const user = targetUser || requester;
        const owedCoins = getCoins(user.id);
        const embed = new EmbedBuilder()
            .setTitle(targetUser ? 'User Balance' : 'Owed Coins')
            .setColor('#47b36b')
            .setDescription(`${user} has **${formatCoins(owedCoins)}** coins.`)
            .setFooter({ text: 'A moderator can pay this through UnbelievaBoat, then run !clearcoins @user.' });

        return interactionOrMessage.reply({ embeds: [embed] });
    },
};
