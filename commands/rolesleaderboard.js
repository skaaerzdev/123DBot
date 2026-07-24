// IMPORTS - loads Discord embed, button tools and case configurations.
const { SlashCommandBuilder, EmbedBuilder, ActionRowBuilder, ButtonBuilder, ButtonStyle } = require('discord.js');
const { cases } = require('../caseConfig');

// EXCLUDED ROLES - these role names are skipped when counting case roles.
const EXCLUDED_ROLE_NAMES = ['Big Dawg', 'Professional Gambler'];

// COLLECT TRACKED ROLES - gathers all case reward role IDs (type: 'role'), excluding certain roles.
function getTrackedRoleIds() {
    const roleIds = new Set();

    for (const caseKey of Object.keys(cases)) {
        const caseInfo = cases[caseKey];

        if (!caseInfo || !Array.isArray(caseInfo.items)) continue;

        for (const item of caseInfo.items) {
            if (item.type !== 'role') continue;
            if (EXCLUDED_ROLE_NAMES.includes(item.roleName)) continue;

            const roleId = item.roleId || item.roleID || null;

            if (roleId) {
                roleIds.add(roleId);
            }
        }
    }

    return roleIds;
}


function buildLeaderboard(members, trackedRoleIds) {
    const entries = [];

    for (const member of members.values()) {
        let count = 0;

        for (const roleId of trackedRoleIds) {
            if (member.roles.cache.has(roleId)) {
                count++;
            }
        }

        if (count > 0) {
            entries.push({ userId: member.id, displayName: member.user.displayName, count });
        }
    }

    entries.sort((a, b) => b.count - a.count || a.displayName.localeCompare(b.displayName));

    return entries;
}

// CREATE EMBED - renders one page of the leaderboard.
function createLeaderboardEmbed(entries, page, totalPages) {
    const start = (page - 1) * 10;
    const pageEntries = entries.slice(start, start + 10);

    const description = pageEntries.length === 0
        ? 'No users have earned case roles yet.'
        : pageEntries.map((entry, index) => {
            const rank = start + index + 1;
            return `**${rank}.** <@${entry.userId}> — ${entry.count} role${entry.count !== 1 ? 's' : ''}`;
        }).join('\n');

    return new EmbedBuilder()
        .setTitle('🏆 Case Role Leaderboard')
        .setColor('#f1c40f')
        .setDescription(description)
        .setFooter({ text: `Page ${page} / ${totalPages} • Showing top ${entries.length} members` });
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

// ROLE LEADERBOARD COMMAND - shows who has the most case roles (excluding Big Dawg and Professional Gambler).
module.exports = {
    data: new SlashCommandBuilder()
        .setName('rolelb')
        .setDescription('Shows the case role leaderboard (excludes Big Dawg & Professional Gambler)'),

    async execute(interactionOrMessage, args = []) {
        const isInteraction = typeof interactionOrMessage.isChatInputCommand === 'function'
            && interactionOrMessage.isChatInputCommand();

        // GUILD CHECK - needed for member role lookups.
        const guild = interactionOrMessage.guild;

        if (!guild) {
            const message = 'This command can only be used in a server.';
            return isInteraction
                ? interactionOrMessage.reply({ content: message, ephemeral: true })
                : interactionOrMessage.reply(message);
        }

        // COLLECT TRACKED ROLE IDS - get all case reward role IDs excluding specified roles.
        const trackedRoleIds = getTrackedRoleIds();

        if (trackedRoleIds.size === 0) {
            const message = 'No case reward roles found in the configuration.';
            return isInteraction
                ? interactionOrMessage.reply({ content: message, ephemeral: true })
                : interactionOrMessage.reply(message);
        }

        // BUILD LEADERBOARD DATA - fetch all members from Discord API, then sort by tracked role count.
        const allMembers = await guild.members.fetch();
        const entries = buildLeaderboard(allMembers, trackedRoleIds);

        if (entries.length === 0) {
            const message = 'No members have earned any case roles yet.';
            return isInteraction
                ? interactionOrMessage.reply({ content: message, ephemeral: true })
                : interactionOrMessage.reply(message);
        }

        // PAGINATION SETUP - calculate total pages and start on page 1.
        const totalPages = Math.max(1, Math.ceil(entries.length / 10));
        let currentPage = 1;

        // BUILD INITIAL EMBED AND BUTTONS.
        const embed = createLeaderboardEmbed(entries, currentPage, totalPages);
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
            const newEmbed = createLeaderboardEmbed(entries, currentPage, totalPages);
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

