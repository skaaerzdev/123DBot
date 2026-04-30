// IMPORTS - loads Discord command builder and case choices.
const { SlashCommandBuilder } = require('discord.js');
const { getCaseChoices } = require('../caseConfig');

// BUY COMMAND - keeps old buy command available but redirects users to roll.
module.exports = {
    // COMMAND DATA - registers /buy and its optional case argument.
    data: new SlashCommandBuilder()
        .setName('buy')
        .setDescription('Shows how to buy and open a case')
        .addStringOption(option =>
            option
                .setName('case')
                .setDescription('The case to open')
                .setRequired(false)
                .addChoices(...getCaseChoices()),
        ),

    // COMMAND RUNNER - replies with the new buy-and-open instruction.
    async execute(interactionOrMessage) {
        const isInteraction = typeof interactionOrMessage.isChatInputCommand === 'function'
            && interactionOrMessage.isChatInputCommand();
        const message = 'Cases are now bought and opened with `!roll [case]`.';

        return isInteraction
            ? interactionOrMessage.reply({ content: message })
            : interactionOrMessage.channel.send(message);
    },
};
