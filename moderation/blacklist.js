// IMPORTS - loads Discord command and embed builders.
const { SlashCommandBuilder, EmbedBuilder } = require('discord.js');

// BLACKLIST COMMAND - removes a role and adds a blacklist role to a user
module.exports = {
    // COMMAND DATA - registers /blacklist slash command
    data: new SlashCommandBuilder()
        .setName('blacklist')
        .setDescription('Blacklist a user by removing their access role and adding blacklist role')
        .addUserOption(option =>
            option.setName('user')
                .setDescription('User to blacklist')
                .setRequired(true))
        .addStringOption(option =>
            option.setName('reason')
                .setDescription('Reason for blacklisting')
                .setRequired(true)),
    
    // COMMAND RUNNER - handles both slash command and !blacklist prefix usage
    async execute(interactionOrMessage, args) {
        const isInteraction = typeof interactionOrMessage.isChatInputCommand === 'function'
            && interactionOrMessage.isChatInputCommand();

        // Check if user has staff permissions
        const staffRoleId = process.env.STAFF_ROLE_ID;
        const member = interactionOrMessage.member;
        
        if (!staffRoleId || !member.roles.cache.has(staffRoleId)) {
            const errorMsg = 'Only staff members can use this command.';
            if (isInteraction) {
                return interactionOrMessage.reply({ content: errorMsg, ephemeral: true });
            } else {
                return interactionOrMessage.reply(errorMsg);
            }
        }

        // Get user and reason from arguments
        let targetUser;
        let reason;

        if (isInteraction) {
            targetUser = interactionOrMessage.options.getUser('user');
            reason = interactionOrMessage.options.getString('reason');
        } else {
            const userMention = args[0];
            reason = args.slice(1).join(' ');

            if (!userMention || !reason) {
                return interactionOrMessage.reply('Usage: !blacklist [user] [reason]\nExample: !blacklist @User Sharking');
            }

            try {
                const userIdMatch = userMention.replace(/[<@!>]/g, '');
                targetUser = await interactionOrMessage.guild.members.fetch(userIdMatch);
                targetUser = targetUser.user;
            } catch (error) {
                return interactionOrMessage.reply('Could not find that user.');
            }
        }

        // Prevent blacklisting the bot or themselves
        const executor = isInteraction ? interactionOrMessage.user : interactionOrMessage.author;

        if (targetUser.bot) {
            const errorMsg = 'You cannot blacklist a bot.';
            if (isInteraction) {
                return interactionOrMessage.reply({ content: errorMsg, ephemeral: true });
            } else {
                return interactionOrMessage.reply(errorMsg);
            }
        }

        if (targetUser.id === executor.id) {
            const errorMsg = 'You cannot blacklist yourself.';
            if (isInteraction) {
                return interactionOrMessage.reply({ content: errorMsg, ephemeral: true });
            } else {
                return interactionOrMessage.reply(errorMsg);
            }
        }

        try {
            // Get role IDs from environment variables
            const roleToRemoveId = process.env.BLACKLIST_ROLE_REMOVE_ID;
            const blacklistRoleId = process.env.BLACKLIST_ROLE_ADD_ID;
            const logChannelId = process.env.BLACKLIST_LOG_CHANNEL_ID;

            if (!roleToRemoveId || !blacklistRoleId || !logChannelId) {
                const errorMsg = 'Blacklist system is not properly configured. Please contact an administrator.';
                if (isInteraction) {
                    return interactionOrMessage.reply({ content: errorMsg, ephemeral: true });
                } else {
                    return interactionOrMessage.reply(errorMsg);
                }
            }

            const guild = interactionOrMessage.guild;
            const roleToRemove = guild.roles.cache.get(roleToRemoveId);
            const blacklistRole = guild.roles.cache.get(blacklistRoleId);
            const logChannel = guild.channels.cache.get(logChannelId);

            if (!roleToRemove || !blacklistRole || !logChannel) {
                const errorMsg = 'Required roles or log channel not found. Please contact an administrator.';
                if (isInteraction) {
                    return interactionOrMessage.reply({ content: errorMsg, ephemeral: true });
                } else {
                    return interactionOrMessage.reply(errorMsg);
                }
            }

            // Get target member for role management
            let targetMember;
            if (isInteraction) {
                targetMember = await guild.members.fetch(targetUser.id);
            } else {
                const userIdMatch = args[0].replace(/[<@!>]/g, '');
                targetMember = await guild.members.fetch(userIdMatch);
            }

            // Remove role and add blacklist role
            await targetMember.roles.remove(roleToRemove).catch(err => {
                console.error('Error removing role:', err);
            });
            await targetMember.roles.add(blacklistRole);

            // Create log embed
            const logEmbed = new EmbedBuilder()
                .setColor('#FF0000')
                .setTitle('⛔ User Blacklisted')
                .addFields(
                    { name: 'Blacklisted User', value: `${targetUser.username} (${targetUser.id})`, inline: false },
                    { name: 'Blacklisted By', value: `${executor.username} (${executor.id})`, inline: false },
                    { name: 'Reason', value: reason || 'No reason provided', inline: false },
                    { name: 'Timestamp', value: new Date().toLocaleString(), inline: false }
                )
                .setThumbnail(targetUser.displayAvatarURL({ dynamic: true }));

            // Send log message and create thread
            const logMessage = await logChannel.send({ embeds: [logEmbed] });
            const thread = await logMessage.startThread({
                name: `Blacklist: ${targetUser.username}`,
                autoArchiveDuration: 1440, // 24 hours
            });

            // Send initial message in thread
            await thread.send(`**Blacklist Case Thread**\n**User:** ${targetUser.username}\n**Reason:** ${reason}`);

            // Confirm action
            const successMsg = `✅ ${targetUser.username} has been blacklisted.`;
            if (isInteraction) {
                await interactionOrMessage.reply({ content: successMsg, ephemeral: true });
            } else {
                await interactionOrMessage.reply(successMsg);
            }

        } catch (error) {
            console.error('Error executing blacklist command:', error);
            const errorMsg = 'An error occurred while executing the blacklist command.';
            if (isInteraction) {
                await interactionOrMessage.reply({ content: errorMsg, ephemeral: true });
            } else {
                await interactionOrMessage.reply(errorMsg);
            }
        }
    },
};
