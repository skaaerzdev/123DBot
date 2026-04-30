// IMPORTS - loads Discord command builder.
const { SlashCommandBuilder } = require('discord.js');

// AUTHOR ID - gets the user ID from either a slash command or prefix message.
function getAuthorId(interactionOrMessage, isInteraction) {
    return isInteraction ? interactionOrMessage.user.id : interactionOrMessage.author.id;
}

// RESTART COMMAND - lets only the configured owner restart the bot.
module.exports = {
    // COMMAND DATA - registers /restart.
    data: new SlashCommandBuilder()
        .setName('restart')
        .setDescription('Restarts the bot'),

    // COMMAND RUNNER - checks permission, starts a new bot, then exits this one.
    async execute(interactionOrMessage) {
        const isInteraction = typeof interactionOrMessage.isChatInputCommand === 'function'
            && interactionOrMessage.isChatInputCommand();
        // OWNER CHECK - reads the allowed Discord user ID from .env.
        const allowedUserId = process.env.RESTART_USER_ID || process.env.OWNER_USER_ID;
        const authorId = getAuthorId(interactionOrMessage, isInteraction);

        // CONFIG CHECK - blocks restart if no owner ID is configured.
        if (!allowedUserId) {
            const message = 'Restart is not configured. Add `RESTART_USER_ID=your_discord_user_id` to `.env`.';
            return isInteraction
                ? interactionOrMessage.reply({ content: message, ephemeral: true })
                : interactionOrMessage.reply(message);
        }

        // PERMISSION CHECK - blocks anyone except the configured owner.
        if (authorId !== allowedUserId) {
            const message = 'Only the bot owner can use this command.';
            return isInteraction
                ? interactionOrMessage.reply({ content: message, ephemeral: true })
                : interactionOrMessage.reply(message);
        }

        // USER FEEDBACK - tells Discord the restart has started.
        const message = 'Restarting...';

        if (isInteraction) {
            await interactionOrMessage.reply({ content: message, ephemeral: true });
        } else {
            await interactionOrMessage.channel.send(message);
        }

        // PROCESS EXIT - lets Pebble Host or another process manager start the bot again.
        setTimeout(() => {
            interactionOrMessage.client.destroy();
            process.exit(Number(process.env.RESTART_EXIT_CODE || 0));
        }, 1000);
    },
};
