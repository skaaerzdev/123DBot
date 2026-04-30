// IMPORTS - loads Discord tools and case config.
const { EmbedBuilder, PermissionsBitField, SlashCommandBuilder } = require('discord.js');
const { getCase, getCaseChoices } = require('../caseConfig');

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

// ROLE LOOKUP - finds a Discord role by ID first, then by name.
function resolveRole(guild, roleId, roleName) {
    if (roleId) {
        return guild.roles.cache.get(roleId);
    }

    return guild.roles.cache.find(role => role.name.toLowerCase() === roleName.toLowerCase());
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
function createRollEmbed(caseInfo, item, rewardText) {
    return new EmbedBuilder()
        .setTitle(`${caseInfo.displayName} Roll`)
        .setColor(item.type === 'role' ? 0xc2aa50 : 0x00AE86)
        .addFields(
            { name: 'Reward', value: rewardText, inline: false },
            { name: 'Rarity', value: item.rarity, inline: true },
            { name: 'Chance', value: `${item.chance}%`, inline: true },
        )
        .setTimestamp();
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
            const message = 'That case does not exist. Try `!roll case1`, `!roll case2`, or `!roll case3`.';
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

        // COIN REWARD - shows the result without saving coins to the user's balance.
        if (item.type === 'coins') {
            const embed = createRollEmbed(caseInfo, item, item.name);

            return sendResult(interactionOrMessage, isInteraction, embed);
        }

        // ROLE REWARD LOOKUP - finds the role prize the user won.
        const role = resolveRole(interactionOrMessage.guild, item.roleId, item.roleName);

        // MISSING PRIZE ROLE - warns if the reward role is not configured correctly.
        if (!role) {
            const message = `You rolled ${caseInfo.displayName} and won **${item.name}**, but I could not find that role to give it to you.`;
            return isInteraction
                ? interactionOrMessage.reply({ content: message })
                : interactionOrMessage.channel.send(message);
        }

        // ROLE REWARD - gives the prize role and sends the result embed.
        await member.roles.add(role);
        const embed = createRollEmbed(caseInfo, item, role.toString());

        return sendResult(interactionOrMessage, isInteraction, embed);
    },
};
