const { SlashCommandBuilder, EmbedBuilder, ActionRowBuilder, ButtonBuilder, ButtonStyle } = require('discord.js');
const { getBossCooldown, setBossCooldown, addCoins } = require('../caseStore');

const BOSS_NAME = 'Skaaerz';
const BOSS_MAX_HEALTH = 70;
const PLAYER_MAX_HEALTH = 100;
const TOTAL_ROUNDS = 5;
const ROUND_DAMAGE = 20;
const PLAYER_DAMAGE = 25;
const REWARD_COINS = 50000;
const COOLDOWN_MS = 30 * 60 * 60 * 1000;
const ACTIVE_GAMES = new Map();

function formatCoins(amount) {
    return amount.toLocaleString('en-US');
}

function formatTime(ms) {
    const totalSeconds = Math.max(0, Math.ceil(ms / 1000));
    const hours = Math.floor(totalSeconds / 3600);
    const minutes = Math.floor((totalSeconds % 3600) / 60);
    const seconds = totalSeconds % 60;

    if (hours > 0) {
        return `${hours}h ${minutes}m`;
    }

    if (minutes > 0) {
        return `${minutes}m ${seconds}s`;
    }

    return `${seconds}s`;
}

function createHealthBar(currentHealth, maxHealth, segmentSize = 10) {
    const segments = Math.max(1, Math.ceil(maxHealth / segmentSize));
    const filledSegments = Math.max(0, Math.min(segments, Math.ceil(Math.max(0, currentHealth) / segmentSize)));
    const emptySegments = segments - filledSegments;

    return `${'🟩'.repeat(filledSegments)}${'⬜'.repeat(emptySegments)}`;
}

function getActionName(action) {
    return action === 'hit' ? 'Hit' : action === 'block' ? 'Block' : 'Dodge';
}

function getCounterAction(action) {
    return action === 'hit' ? 'block' : action === 'block' ? 'dodge' : 'hit';
}

function getBossAction(previousPlayerAction) {
    const actions = ['hit', 'block', 'dodge'];

    if (!previousPlayerAction) {
        return Math.random() < 0.5 ? 'block' : actions[Math.floor(Math.random() * actions.length)];
    }

    const counterAction = getCounterAction(previousPlayerAction);

    if (Math.random() < 0.6) {
        return counterAction;
    }

    const fallbackActions = actions.filter(action => action !== counterAction);
    return fallbackActions[Math.floor(Math.random() * fallbackActions.length)];
}

function getRoundResult(playerAction, bossAction) {
    if (playerAction === bossAction) {
        return 'draw';
    }

    const winMap = {
        hit: 'dodge',
        block: 'hit',
        dodge: 'block',
    };

    return winMap[playerAction] === bossAction ? 'win' : 'lose';
}

function getOutcomeText(playerAction, bossAction, result) {
    const playerName = getActionName(playerAction);
    const bossName = getActionName(bossAction);

    if (result === 'win') {
        return `${playerName} beats ${bossName.toLowerCase()}.`;
    }

    if (result === 'lose') {
        return `${bossName} beats ${playerName.toLowerCase()}.`;
    }

    return `Both chose ${playerName.toLowerCase()}.`;
}

function buildActionRow() {
    return new ActionRowBuilder()
        .addComponents(
            new ButtonBuilder()
                .setCustomId('skaaerz:hit')
                .setLabel('Hit')
                .setStyle(ButtonStyle.Danger),
            new ButtonBuilder()
                .setCustomId('skaaerz:block')
                .setLabel('Block')
                .setStyle(ButtonStyle.Primary),
            new ButtonBuilder()
                .setCustomId('skaaerz:dodge')
                .setLabel('Dodge')
                .setStyle(ButtonStyle.Success),
        );
}

function buildDisabledRow() {
    return new ActionRowBuilder()
        .addComponents(
            new ButtonBuilder()
                .setCustomId('skaaerz:disabled')
                .setLabel('Fight Ended')
                .setStyle(ButtonStyle.Secondary)
                .setDisabled(true),
        );
}

function buildEmbed(game, statusText) {
    const bossHealthBar = createHealthBar(game.bossHealth, BOSS_MAX_HEALTH);
    const playerHealthBar = createHealthBar(game.userHealth, PLAYER_MAX_HEALTH);
    let title = `${BOSS_NAME} is still standing`;
    let color = '#ff4d4d';

    if (game.bossHealth <= 0) {
        title = `${BOSS_NAME} has been defeated!`;
        color = '#47b36b';
    } else if (game.userHealth <= 0) {
        title = 'You were defeated by Skaaerz';
        color = '#8b0000';
    }

    return new EmbedBuilder()
        .setTitle(title)
        .setColor(color)
        .setDescription(statusText)
        .addFields(
            { name: 'Boss Health', value: `${bossHealthBar} ${game.bossHealth}/${BOSS_MAX_HEALTH}`, inline: false },
            { name: 'Your Health', value: `${playerHealthBar} ${game.userHealth}/${PLAYER_MAX_HEALTH}`, inline: false },
            { name: 'Round', value: `${game.round}/${TOTAL_ROUNDS}`, inline: true },
            { name: 'Reward', value: `${formatCoins(REWARD_COINS)} coins`, inline: true },
            { name: 'Rules', value: 'Hit beats Dodge • Block beats Hit • Dodge beats Block', inline: false },
        );
}

async function sendGameMessage(target, isInteraction, initialContent) {
    if (isInteraction) {
        await target.reply(initialContent);
        return target.fetchReply();
    }

    return target.channel.send(initialContent);
}

module.exports = {
    data: new SlashCommandBuilder()
        .setName('skaaerz')
        .setDescription('Fight Skaaerz in a three-round boss battle'),

    async execute(interactionOrMessage) {
        const isInteraction = typeof interactionOrMessage.isChatInputCommand === 'function'
            && interactionOrMessage.isChatInputCommand();
        const user = isInteraction ? interactionOrMessage.user : interactionOrMessage.author;
        const now = Date.now();
        const cooldownUntil = getBossCooldown(user.id) || 0;

        if (cooldownUntil > now) {
            const remaining = cooldownUntil - now;
            const message = `You can fight ${BOSS_NAME} again in **${formatTime(remaining)}**.`;

            return isInteraction
                ? interactionOrMessage.reply({ content: message, ephemeral: true })
                : interactionOrMessage.reply(message);
        }

        setBossCooldown(user.id, now + COOLDOWN_MS);

        const game = {
            userId: user.id,
            bossHealth: BOSS_MAX_HEALTH,
            userHealth: PLAYER_MAX_HEALTH,
            round: 1,
            lastPlayerAction: null,
            completed: false,
            reward: REWARD_COINS,
        };

        const initialEmbed = buildEmbed(game, `Choose your move for round ${game.round}.`);
        const initialMessage = await sendGameMessage(interactionOrMessage, isInteraction, {
            embeds: [initialEmbed],
            components: [buildActionRow()],
        });

        ACTIVE_GAMES.set(initialMessage.id, game);

        const collector = initialMessage.createMessageComponentCollector({ time: 60000 * 5 });

        collector.on('collect', async buttonInteraction => {
            if (buttonInteraction.user.id !== game.userId) {
                await buttonInteraction.reply({ content: 'Only the challenger can make choices in this fight.', ephemeral: true });
                return;
            }

            if (game.completed) {
                return;
            }

            const [, action] = buttonInteraction.customId.split(':');
            const bossAction = getBossAction(game.lastPlayerAction);
            const result = getRoundResult(action, bossAction);

            if (result === 'win') {
                game.bossHealth = Math.max(0, game.bossHealth - ROUND_DAMAGE);
            } else if (result === 'lose') {
                game.userHealth = Math.max(0, game.userHealth - PLAYER_DAMAGE);
            }

            game.lastPlayerAction = action;
            game.round += 1;

            const statusText = `You chose **${getActionName(action)}** and ${BOSS_NAME} chose **${getActionName(bossAction)}**. ${getOutcomeText(action, bossAction, result)}`;

            if (game.bossHealth <= 0) {
                game.completed = true;
                addCoins(game.userId, REWARD_COINS);
                const winEmbed = buildEmbed(game, `${statusText}\n\nYou defeated ${BOSS_NAME}!`);
                await buttonInteraction.update({ embeds: [winEmbed], components: [buildDisabledRow()] });
                ACTIVE_GAMES.delete(initialMessage.id);
                collector.stop();
                return;
            }

            if (game.userHealth <= 0) {
                game.completed = true;
                const loseEmbed = buildEmbed(game, `${statusText}\n\n${BOSS_NAME} overwhelmed you. No coins were lost.`);
                await buttonInteraction.update({ embeds: [loseEmbed], components: [buildDisabledRow()] });
                ACTIVE_GAMES.delete(initialMessage.id);
                collector.stop();
                return;
            }

            if (game.round > TOTAL_ROUNDS) {
                game.completed = true;
                const loseEmbed = buildEmbed(game, `${statusText}\n\n${BOSS_NAME} survived the fight.`);
                await buttonInteraction.update({ embeds: [loseEmbed], components: [buildDisabledRow()] });
                ACTIVE_GAMES.delete(initialMessage.id);
                collector.stop();
                return;
            }

            const nextEmbed = buildEmbed(game, `${statusText}\n\nChoose your move for round ${game.round}.`);
            await buttonInteraction.update({ embeds: [nextEmbed], components: [buildActionRow()] });
        });

        collector.on('end', async () => {
            if (!ACTIVE_GAMES.has(initialMessage.id)) {
                return;
            }

            const endedGame = ACTIVE_GAMES.get(initialMessage.id);
            if (endedGame?.completed) {
                return;
            }

            ACTIVE_GAMES.delete(initialMessage.id);
            const timeoutEmbed = buildEmbed(endedGame, `${BOSS_NAME} waited too long. The fight is over.`);
            try {
                await initialMessage.edit({ embeds: [timeoutEmbed], components: [buildDisabledRow()] });
            } catch (error) {
                console.error('Failed to update boss fight timeout message:', error);
            }
        });
    },
};
