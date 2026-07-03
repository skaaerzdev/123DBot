// IMPORTS - loads Discord command tools, case rewards, and owed coin storage.
const { EmbedBuilder, PermissionsBitField, SlashCommandBuilder } = require('discord.js');
const { cases } = require('../caseConfig');
const { addCoins } = require('../caseStore');

const BIG_DAWG_VALUE = 250000;
const DEFAULT_ROLE_VALUE = 50000;
const EXCLUDED_ROLE_NAMES = new Set(['professional gambler']);

function formatCoins(amount) {
    return amount.toLocaleString('en-US');
}

function normalizeName(name) {
    return (name || '').toLowerCase().replace(/^@/, '').trim();
}

function getMentionedRoleId(value) {
    const match = typeof value === 'string' ? value.match(/^<@&(\d+)>$/) : null;

    return match ? match[1] : null;
}

function getRoleValue(roleName) {
    return normalizeName(roleName) === 'big dawg' ? BIG_DAWG_VALUE : DEFAULT_ROLE_VALUE;
}

function getSellableRoles() {
    const sellableRoles = new Map();

    for (const caseInfo of Object.values(cases)) {
        for (const item of caseInfo.items) {
            if (item.type !== 'role') continue;
            if (EXCLUDED_ROLE_NAMES.has(normalizeName(item.roleName))) continue;

            const roleIds = [
                item.roleId,
                item.roleID,
                getMentionedRoleId(item.name),
            ].filter(Boolean);
            const roleName = item.roleName || item.name;

            if (roleIds.length === 0 && !roleName) continue;

            const saleInfo = {
                roleId: roleIds[0] || null,
                roleName,
                value: getRoleValue(roleName),
            };

            for (const roleId of roleIds) {
                sellableRoles.set(`id:${roleId}`, saleInfo);
            }

            if (roleName) {
                sellableRoles.set(`name:${normalizeName(roleName)}`, saleInfo);
            }
        }
    }

    return sellableRoles;
}

function findSaleInfo(role, inputName) {
    const sellableRoles = getSellableRoles();

    if (role) {
        return sellableRoles.get(`id:${role.id}`) || sellableRoles.get(`name:${normalizeName(role.name)}`) || null;
    }

    return sellableRoles.get(`name:${normalizeName(inputName)}`) || null;
}

function findRoleByInput(guild, message, args, isInteraction) {
    if (isInteraction) {
        return {
            role: message.options.getRole('role'),
            inputName: null,
        };
    }

    const mentionedRole = message.mentions.roles.first();

    if (mentionedRole) {
        return {
            role: mentionedRole,
            inputName: mentionedRole.name,
        };
    }

    const input = args.join(' ').trim();

    if (!input) {
        return {
            role: null,
            inputName: null,
        };
    }

    const roleId = input.replace(/[<@&>]/g, '');
    const role = guild.roles.cache.get(roleId)
        || guild.roles.cache.find(currentRole => normalizeName(currentRole.name) === normalizeName(input));

    return {
        role: role || null,
        inputName: input,
    };
}

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

// SELL COMMAND - lets users sell case reward roles for owed coins.
module.exports = {
    data: new SlashCommandBuilder()
        .setName('sell')
        .setDescription('Sells a case reward role for owed coins')
        .addRoleOption(option =>
            option
                .setName('role')
                .setDescription('The case reward role to sell')
                .setRequired(true),
        ),

    async execute(interactionOrMessage, args = []) {
        const isInteraction = typeof interactionOrMessage.isChatInputCommand === 'function'
            && interactionOrMessage.isChatInputCommand();
        const guild = interactionOrMessage.guild;
        const member = interactionOrMessage.member;
        const { role, inputName } = findRoleByInput(guild, interactionOrMessage, args, isInteraction);

        if (!role) {
            const message = 'Usage: `!sell @role`';

            return isInteraction
                ? interactionOrMessage.reply({ content: message, ephemeral: true })
                : interactionOrMessage.reply(message);
        }

        const saleInfo = findSaleInfo(role, inputName);

        if (!saleInfo) {
            const message = `**${role.name}** cannot be sold.`;

            return isInteraction
                ? interactionOrMessage.reply({ content: message, ephemeral: true })
                : interactionOrMessage.reply(message);
        }

        if (!member.roles.cache.has(role.id)) {
            const message = `You do not have **${role.name}**, so you cannot sell it.`;

            return isInteraction
                ? interactionOrMessage.reply({ content: message, ephemeral: true })
                : interactionOrMessage.reply(message);
        }

        const botMember = guild.members.me || await guild.members.fetchMe();
        const roleCheck = canManageRole(botMember, role);

        if (!roleCheck.allowed) {
            const message = `${roleCheck.reason}\nMove my bot role above **${role.name}** in Server Settings > Roles, then try again.`;

            return isInteraction
                ? interactionOrMessage.reply({ content: message, ephemeral: true })
                : interactionOrMessage.reply(message);
        }

        try {
            await member.roles.remove(role);
        } catch (error) {
            console.error(`Failed to remove sold role ${role.id} from ${member.id}:`, error);
            const message = `I could not remove **${role.name}**. Make sure I have **Manage Roles** and my bot role is above that role.`;

            return isInteraction
                ? interactionOrMessage.reply({ content: message, ephemeral: true })
                : interactionOrMessage.reply(message);
        }

        const owedCoins = addCoins(member.id, saleInfo.value);
        const embed = new EmbedBuilder()
            .setTitle('Role Sold')
            .setColor('#47b36b')
            .addFields(
                { name: 'Role', value: `${role}`, inline: true },
                { name: 'Sale Value', value: `${formatCoins(saleInfo.value)} coins`, inline: true },
                { name: 'Total Owed', value: `${formatCoins(owedCoins)} coins`, inline: false },
            );

        return interactionOrMessage.reply({ embeds: [embed] });
    },
};
