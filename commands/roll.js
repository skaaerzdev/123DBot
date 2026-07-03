// IMPORTS - loads Discord tools and case config.
const { EmbedBuilder, PermissionsBitField, SlashCommandBuilder } = require('discord.js');
const { getCase, getCaseChoices } = require('../caseConfig');
const { addCoins } = require('../caseStore');

// CASE RANDOMISER - picks one reward using chance values as weighted odds.
function pickItem(items) {
    const totalChance = items.reduce((total, item) => total + item.chance, 0);
    let roll = Math.random() * totalChance;

    for (const item of items) {
        roll -= item.chance;
        if (roll <= 0) {
            return item;
        }
    }

    return items[items.length - 1];
}

function getTotalChance(items) {
    return items.reduce((total, item) => total + item.chance, 0);
}

function formatChance(chance) {
    return Number.isInteger(chance) ? `${chance}%` : `${chance.toFixed(2).replace(/\.?0+$/, '')}%`;
}

function parseCoinAmount(name) {
    const match = typeof name === 'string' ? name.match(/([\d,]+)\s*Coins/i) : null;

    return match ? Number(match[1].replace(/,/g, '')) : 0;
}

function formatCoins(amount) {
    return amount.toLocaleString('en-US');
}

function getMentionedRoleId(value) {
    const match = typeof value === 'string' ? value.match(/^<@&(\d+)>$/) : null;

    return match ? match[1] : null;
}

// ROLE LOOKUP - finds a Discord role by ID first, then falls back to name.
function resolveRole(guild, roleId, roleName) {
    if (roleId) {
        const role = guild.roles.cache.get(roleId);

        if (role) return role;
    }

    if (!roleName) return null;

    return guild.roles.cache.find(role => role.name.toLowerCase() === roleName.toLowerCase());
}

// ITEM ROLE LOOKUP - accepts roleId, legacy roleID, role mentions, or roleName.
function resolveItemRole(guild, item) {
    return resolveRole(
        guild,
        item.roleId || item.roleID || getMentionedRoleId(item.name),
        item.roleName,
    );
}

// ROLE PERMISSION CHECK - makes sure the bot can remove the required role.
function canManageRole(botMember, role) {
    if (!botMember.permissions.has(PermissionsBitField.Flags.ManageRoles)) {
        return {
            allowed: false,
            reason: 'I need the **Manage Roles** permission to remove that role.',
        };
    }

    if (role.managed) {
        return {
            allowed: false,
            reason: `I cannot remove **${role.name}** because it is managed by an integration or bot.`,
        };
    }

    if (role.position >= botMember.roles.highest.position) {
        return {
            allowed: false,
            reason: `I cannot remove **${role.name}** because it is higher than, or equal to, my highest role.`,
        };
    }

    return {
        allowed: true,
        reason: null,
    };
}

// ROLL EMBED - builds the reward result embed.
function formatIcon(icon) {
    if (!icon) return '';
    if (/^https?:\/\//i.test(icon)) return `[image](${icon})`;

    return icon;
}

function formatRewardText(item, rewardText) {
    const icon = formatIcon(item.icon);

    return icon ? `${icon} ${rewardText}` : rewardText;
}

function createRollEmbed(caseInfo, item, rewardText, chanceText = formatChance(item.chance)) {
    const embed = new EmbedBuilder()
        .setTitle(`🔑 ${caseInfo.displayName} Case Roll`)
        .setColor(caseInfo.embedColor || '#c2aa50')
        .addFields(
            { name: 'Reward', value: formatRewardText(item, rewardText), inline: false },
            { name: 'Chance', value: chanceText, inline: false },
        )

    if (caseInfo.imageUrl) {
        embed.setImage(caseInfo.imageUrl);
    }

    return embed;
}

// SEND RESULT - replies to slash commands or prefix messages with the embed.
function sendResult(interactionOrMessage, isInteraction, embed) {
    return isInteraction
        ? interactionOrMessage.reply({ embeds: [embed] })
        : interactionOrMessage.reply({ embeds: [embed] });
}

// ROLL COMMAND - buys and opens a case in one command.
module.exports = {
    // COMMAND DATA - registers /roll with a required case argument.
    data: new SlashCommandBuilder()
        .setName('roll')
        .setDescription('Opens one of your cases')
        .addStringOption(option =>
            option
                .setName('case')
                .setDescription('The case to roll')
                .setRequired(true)
                .addChoices(...getCaseChoices()),
        ),

    // COMMAND RUNNER - handles both slash command and !roll prefix usage.
    async execute(interactionOrMessage, args = []) {
        const isInteraction = typeof interactionOrMessage.isChatInputCommand === 'function'
            && interactionOrMessage.isChatInputCommand();
        // CASE LOOKUP - reads the selected case from slash options or prefix text.
        const caseName = isInteraction
            ? interactionOrMessage.options.getString('case')
            : args[0];
        const caseInfo = getCase(caseName);

        // INVALID CASE - stops if the requested case does not exist.
        if (!caseInfo) {
            const message = 'That case does not exist. Try: \n `!roll case1`, `!roll case2`, `!roll case3`, `!roll case4`, `!roll case5`, `!roll case6`, `!roll case7`, `!roll case8`';
            return isInteraction
                ? interactionOrMessage.reply({ content: message, ephemeral: true })
                : interactionOrMessage.reply(message);
        }

        // REQUIRED ROLE - finds the role used as the price for this case.
        const guild = interactionOrMessage.guild;
        const member = interactionOrMessage.member;
        const requiredRole = resolveRole(guild, caseInfo.requiredRoleId, caseInfo.requiredRoleName);

        // MISSING ROLE CONFIG - stops if the required role cannot be found.
        if (!requiredRole) {
            const message = `I could not find the required role for ${caseInfo.displayName}. Check the role ID or role name in the case config.`;
            return isInteraction
                ? interactionOrMessage.reply({ content: message, ephemeral: true })
                : interactionOrMessage.reply(message);
        }

        // USER ROLE CHECK - stops if the user does not have the required role.
        if (!member.roles.cache.has(requiredRole.id)) {
            const message = `You need the \`${requiredRole.name}\` role to roll ${caseInfo.displayName}.`;
            return isInteraction
                ? interactionOrMessage.reply({ content: message, ephemeral: true })
                : interactionOrMessage.reply(message);
        }

        // BOT ROLE CHECK - stops if the bot cannot remove the required role.
        const botMember = guild.members.me || await guild.members.fetchMe();
        const roleCheck = canManageRole(botMember, requiredRole);

        if (!roleCheck.allowed) {
            const message = `${roleCheck.reason}\nMove my bot role above **${requiredRole.name}** in Server Settings > Roles, then try again.`;
            return isInteraction
                ? interactionOrMessage.reply({ content: message, ephemeral: true })
                : interactionOrMessage.reply(message);
        }

        // ROLE REMOVAL - removes the required role as payment for the roll.
        try {
            await member.roles.remove(requiredRole);
        } catch (error) {
            console.error(`Failed to remove role ${requiredRole.id} from ${member.id}:`, error);
            const message = `I could not remove **${requiredRole.name}**. Make sure I have **Manage Roles** and my bot role is above that role.`;

            return isInteraction
                ? interactionOrMessage.reply({ content: message, ephemeral: true })
                : interactionOrMessage.reply(message);
        }

        // REWARD ROLL - chooses the item the user wins.
        const item = pickItem(caseInfo.items);
        const actualChance = item.chance / getTotalChance(caseInfo.items) * 100;
        const chanceText = formatChance(actualChance);

        // COIN REWARD - stores owed coins so staff can pay them through UnbelievaBoat later.
        if (item.type === 'coins') {
            const coinAmount = parseCoinAmount(item.name);
            const embed = createRollEmbed(caseInfo, item, item.name, chanceText);

            if (coinAmount > 0) {
                const owedCoins = addCoins(member.id, coinAmount);
                embed.addFields({
                    name: 'Owed Coins',
                    value: `Added **${formatCoins(coinAmount)}** coins to your owed balance.\nTotal owed: **${formatCoins(owedCoins)}** coins.\nUse \`!coins\` to check this later.`,
                    inline: false,
                });
            } else {
                embed.setFooter({ text: 'No coins were added to your owed balance.' });
            }

            return sendResult(interactionOrMessage, isInteraction, embed);
        }

        // ROLE REWARD LOOKUP - finds the role prize the user won.
        const role = resolveItemRole(interactionOrMessage.guild, item);

        // MISSING PRIZE ROLE - warns if the reward role is not configured correctly.
        if (!role) {
            const message = `You rolled ${caseInfo.displayName} and won **${item.name}**, but I could not find that role to give it to you.`;
            return isInteraction
                ? interactionOrMessage.reply({ content: message })
                : interactionOrMessage.channel.send(message);
        }

        // ROLE REWARD - gives the prize role and sends the result embed.
        await member.roles.add(role);
        const embed = createRollEmbed(caseInfo, item, role.toString(), chanceText);

        return sendResult(interactionOrMessage, isInteraction, embed);
    },
};
