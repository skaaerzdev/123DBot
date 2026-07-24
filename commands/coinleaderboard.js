// IMPORTS - loads Discord embed, button tools and coin storage.
const { SlashCommandBuilder, EmbedBuilder, ActionRowBuilder, ButtonBuilder, ButtonStyle } = require('discord.js');
const { readData } = require('../caseStore');

function formatCoins(amount) {
    return amount.toLocaleString('en-US');
}

// BUILD LEADERBOARD - reads all users and sorts by coin balance descending.
function buildLeaderboard() {
    const data = readData();
    const entries = [];

    if (!data || !data.users) {
        return entries;
    }

    for (const [userId, userData] of Object.entries(data.users)) {
        if (userData && typeof userData.coins === 'number' && userData.coins > 0) {
            entries.push({ userId, coins: userData.coins });
        }
    }

    entries.sort((a, b) => b.coins - a.coins || a.userId.localeCompare(b.userId));

    return entries;
}

// CREATE EMBED - renders one page of the coin leaderboard.
function createLeaderboardEmbed(entries, page, totalPages, guild) {
    const start = (page - 1) * 10;
    const pageEntries = entries.slice(start, start + 10);

    const description = pageEntries.length === 0
        ? 'No users have any coins yet.'
        : pageEntries.map((entry, index) => {
            const rank = start + index + 1;
            const member = guild?.members?.cache?.get(entry.userId);
            const displayName = member?.user?.username || member?.displayName || entry.userId;

            return `**${rank}.** ${displayName} — **${formatCoins(entry.coins)}** coins`;
        }).join('\n');

    return new EmbedBuilder()
        .setTitle('💰 Coin Leaderboard')
        .setColor('#f1c40f')
        .setDescription(description)
        .setFooter({ text: `Page ${page} / ${totalPages} • Top ${entries.length} users` });
}

// CREATE PAGINATION ROW - builds Prev / Next buttons for the current page.
function createPaginationRow(page, totalPages) {
    return new ActionRowBuilder().addComponents(
        new ButtonBuilder()
            .setCustomId('prev')
            .setLabel('◀ Prev')
            .setStyle(ButtonStyle.Primary)
            .setDisabled(page <= 1),
        new ButtonBuilder()
            .setCustomId('page')
            .setLabel(`Page ${page} / ${totalPages}`)
            .setStyle(ButtonStyle.Secondary)
            .setDisabled(true),
        new ButtonBuilder()
            .setCustomId('next')
            .setLabel('Next ▶')
            .setStyle(ButtonStyle.Primary)
            .setDisabled(page >= totalPages),
    );
}

// COIN LEADERBOARD COMMAND - shows who has the most owed coins.
module.exports = {
    data: new SlashCommandBuilder()
        .setName('coinslb')
        .setDescription('Shows the coin leaderboard (top users by owed coins)'),

    async execute(interactionOrMessage, args = []) {
        const isInteraction = typeof interactionOrMessage.isChatInputCommand === 'function'
            && interactionOrMessage.isChatInputCommand();

        // GUILD CHECK - needed for member display name lookups (optional).
        const guild = interactionOrMessage.guild || null;

        // BUILD LEADERBOARD DATA - sort users by coin balance descending.
        const entries = buildLeaderboard();

        if (entries.length === 0) {
            const message = 'No users have any coins yet.';
            return isInteraction
                ? interactionOrMessage.reply({ content: message, ephemeral: true })
                : interactionOrMessage.reply(message);
        }

        // PAGINATION SETUP - calculate total pages and start on page 1.
        const totalPages = Math.max(1, Math.ceil(entries.length / 10));
        let currentPage = 1;

        // BUILD INITIAL EMBED AND BUTTONS.
        const embed = createLeaderboardEmbed(entries, currentPage, totalPages, guild);
        const row = createPaginationRow(currentPage, totalPages);

        // REPLY - send the embed with pagination buttons.
        const reply = isInteraction
            ? await interactionOrMessage.reply({ embeds: [embed], components: [row], fetchReply: true })
            : await interactionOrMessage.reply({ embeds: [embed], components: [row] });

        // COLLECTOR - handles button clicks for pagination.
        const collector = reply.createMessageComponentCollector({ time: 120000 });

        collector.on('collect', async (buttonInteraction) => {
            // OWNER CHECK - only the command user can change pages.
            const userId = isInteraction
                ? interactionOrMessage.user.id
                : interactionOrMessage.author.id;

            if (buttonInteraction.user.id !== userId) {
                await buttonInteraction.reply({ content: 'Only the person who ran this command can change pages.', ephemeral: true });
                return;
            }

            // PAGE CHANGE - update current page based on which button was pressed.
            if (buttonInteraction.customId === 'prev' && currentPage > 1) {
                currentPage--;
            } else if (buttonInteraction.customId === 'next' && currentPage < totalPages) {
                currentPage++;
            } else {
                await buttonInteraction.deferUpdate();
                return;
            }

            // UPDATE EMBED - refresh the embed and buttons for the new page.
            const newEmbed = createLeaderboardEmbed(entries, currentPage, totalPages, guild);
            const newRow = createPaginationRow(currentPage, totalPages);

            await buttonInteraction.update({ embeds: [newEmbed], components: [newRow] });
        });

        collector.on('end', async () => {
            const disabledRow = createPaginationRow(currentPage, totalPages);
            disabledRow.components.forEach(button => button.setDisabled(true));

            try {
                if (isInteraction) {
                    await interactionOrMessage.editReply({ components: [disabledRow] });
                } else {
                    await reply.edit({ components: [disabledRow] });
                }
            } catch {
                // Message may have been deleted, ignore.
            }
        });
    },
};

