// IMPORTS - loads Discord button tools and owed coin storage.
const {
    ActionRowBuilder,
    ButtonBuilder,
    ButtonStyle,
    ComponentType,
    EmbedBuilder,
    SlashCommandBuilder,
} = require('discord.js');
const { addCoins, removeCoins } = require('../caseStore');

const BOARD_SIZE = 16;
const ROW_SIZE = 4;
const MINE_COUNT = 4;
const MAX_SAFE_PICKS = 7;
const COOLDOWN_MS = 60 * 60 * 1000;
const GAME_MS = 2 * 60 * 1000;
const PAYOUTS = [0, 5000, 10000, 20000, 35000, 55000, 80000, 100000];
const cooldowns = new Map();

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

function createMines() {
    const mines = new Set();

    while (mines.size < MINE_COUNT) {
        mines.add(Math.floor(Math.random() * BOARD_SIZE));
    }

    return mines;
}

function getPayout(safePicks) {
    return PAYOUTS[Math.min(safePicks, PAYOUTS.length - 1)];
}

function createEmbed(user, state) {
    const payout = getPayout(state.safePicks);
    const embed = new EmbedBuilder()
        .setTitle('Mines')
        .setColor(state.ended && !state.won ? '#d94f4f' : '#47b36b')
        .setDescription(`${user}, reveal safe tiles and cash out before hitting a mine.`)
        .addFields(
            { name: 'Safe Picks', value: `${state.safePicks}/${MAX_SAFE_PICKS}`, inline: true },
            { name: 'Current Cashout', value: `${formatCoins(payout)} coins`, inline: true },
            { name: 'Mines', value: `${MINE_COUNT}`, inline: true },
        );

    if (state.ended) {
        embed.addFields({
            name: 'Result',
            value: state.won
                ? `Cashed out for **${formatCoins(state.finalPayout)}** coins.`
                : `You hit a mine and lost **${formatCoins(state.lossAmount || 0)}** coins.`,
            inline: false,
        });
    }

    return embed;
}

function createComponents(state, gameId) {
    const rows = [];

    for (let rowIndex = 0; rowIndex < BOARD_SIZE / ROW_SIZE; rowIndex += 1) {
        const row = new ActionRowBuilder();

        for (let columnIndex = 0; columnIndex < ROW_SIZE; columnIndex += 1) {
            const tileIndex = rowIndex * ROW_SIZE + columnIndex;
            const isRevealed = state.revealed.has(tileIndex);
            const isMine = state.mines.has(tileIndex);
            const showMine = state.ended && isMine;
            const label = showMine ? 'X' : isRevealed ? 'OK' : '?';
            const style = showMine
                ? ButtonStyle.Danger
                : isRevealed
                    ? ButtonStyle.Success
                    : ButtonStyle.Secondary;

            row.addComponents(
                new ButtonBuilder()
                    .setCustomId(`mines:${gameId}:tile:${tileIndex}`)
                    .setLabel(label)
                    .setStyle(style)
                    .setDisabled(state.ended || isRevealed),
            );
        }

        rows.push(row);
    }

    rows.push(
        new ActionRowBuilder().addComponents(
            new ButtonBuilder()
                .setCustomId(`mines:${gameId}:cashout`)
                .setLabel('Cash Out')
                .setStyle(ButtonStyle.Primary)
                .setDisabled(state.ended || state.safePicks <= 0),
        ),
    );

    return rows;
}

async function sendGameMessage(interactionOrMessage, isInteraction, payload) {
    if (isInteraction) {
        return interactionOrMessage.reply({ ...payload, fetchReply: true });
    }

    return interactionOrMessage.reply(payload);
}

module.exports = {
    data: new SlashCommandBuilder()
        .setName('mines')
        .setDescription('Play mines for owed coins'),

    async execute(interactionOrMessage) {
        const isInteraction = typeof interactionOrMessage.isChatInputCommand === 'function'
            && interactionOrMessage.isChatInputCommand();
        const user = getUser(interactionOrMessage, isInteraction);
        const now = Date.now();
        const availableAt = cooldowns.get(user.id) || 0;

        if (availableAt > now) {
            const message = `You can play mines again in **${getCooldownText(availableAt - now)}**.`;

            return isInteraction
                ? interactionOrMessage.reply({ content: message, ephemeral: true })
                : interactionOrMessage.reply(message);
        }

        cooldowns.set(user.id, now + COOLDOWN_MS);

        const gameId = `${Date.now().toString(36)}${Math.random().toString(36).slice(2, 8)}`;
        const state = {
            mines: createMines(),
            revealed: new Set(),
            safePicks: 0,
            ended: false,
            won: false,
            finalPayout: 0,
            lossAmount: 0,
        };

        const gameMessage = await sendGameMessage(interactionOrMessage, isInteraction, {
            embeds: [createEmbed(user, state)],
            components: createComponents(state, gameId),
        });

        const collector = gameMessage.createMessageComponentCollector({
            componentType: ComponentType.Button,
            time: GAME_MS,
        });

        collector.on('collect', async interaction => {
            if (!interaction.customId.startsWith(`mines:${gameId}:`)) return;

            if (interaction.user.id !== user.id) {
                return interaction.reply({ content: 'This is not your mines game.', ephemeral: true });
            }

            const action = interaction.customId.split(':')[2];

            if (action === 'cashout') {
                state.ended = true;
                state.won = true;
                state.finalPayout = getPayout(state.safePicks);
                addCoins(user.id, state.finalPayout);
                collector.stop('cashout');

                return interaction.update({
                    embeds: [createEmbed(user, state)],
                    components: createComponents(state, gameId),
                });
            }

            const tileIndex = Number(interaction.customId.split(':')[3]);

            if (!Number.isInteger(tileIndex) || state.revealed.has(tileIndex)) {
                return interaction.deferUpdate();
            }

            if (state.mines.has(tileIndex)) {
                state.ended = true;
                state.won = false;
                state.lossAmount = getPayout(state.safePicks);
                removeCoins(user.id, state.lossAmount);
                collector.stop('mine');

                return interaction.update({
                    embeds: [createEmbed(user, state)],
                    components: createComponents(state, gameId),
                });
            }

            state.revealed.add(tileIndex);
            state.safePicks += 1;

            if (state.safePicks >= MAX_SAFE_PICKS) {
                state.ended = true;
                state.won = true;
                state.finalPayout = getPayout(state.safePicks);
                addCoins(user.id, state.finalPayout);
                collector.stop('max');
            }

            return interaction.update({
                embeds: [createEmbed(user, state)],
                components: createComponents(state, gameId),
            });
        });

        collector.on('end', async () => {
            if (state.ended) return;

            state.ended = true;

            try {
                await gameMessage.edit({
                    embeds: [createEmbed(user, state).setFooter({ text: 'Game expired.' })],
                    components: createComponents(state, gameId),
                });
            } catch (error) {
                console.error('Failed to expire mines game:', error);
            }
        });
    },
};
