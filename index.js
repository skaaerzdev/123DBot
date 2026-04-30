// ENV SETUP - loads values from .env into process.env.
require('dotenv').config();

// NODE IMPORTS - loads local file and path helpers.
const fs = require('fs');
const path = require('path');

// APP PATHS - anchors folders to this file so Linux hosts do not depend on the launch directory.
const ROOT_DIR = __dirname;
const COMMANDS_DIR = process.env.COMMANDS_DIR
    ? path.resolve(process.env.COMMANDS_DIR)
    : path.join(ROOT_DIR, 'commands');

// REQUIRED ENV - stops the bot if an important .env value is missing.
function requireEnv(name) {
    if (!process.env[name]) {
        throw new Error(`Missing required environment variable: ${name}`);
    }
}

// DISCORD ID CHECK - makes sure configured Discord IDs look valid.
function validateSnowflake(name, required = true) {
    const value = process.env[name];

    if (!value && !required) {
        return;
    }

    if (!value || !/^\d{17,20}$/.test(value)) {
        throw new Error(`${name} must be a Discord ID with 17 to 20 digits.`);
    }
}

// COMMAND DIRECTORY CHECK - gives a useful hosting error instead of a raw ENOENT stack.
function getCommandFiles() {
    if (!fs.existsSync(COMMANDS_DIR)) {
        throw new Error(
            `Command folder not found at ${COMMANDS_DIR}. ` +
            'On Pebble Host, upload the whole project including the commands folder, ' +
            'or set COMMANDS_DIR to the folder that contains your command .js files.'
        );
    }

    const commandFiles = fs.readdirSync(COMMANDS_DIR)
        .filter(file => file.endsWith('.js'));

    if (commandFiles.length === 0) {
        throw new Error(`No command .js files found in ${COMMANDS_DIR}.`);
    }

    return commandFiles;
}

// COMMAND IMPORT - loads one command module by file name.
function loadCommandFile(file) {
    return require(path.join(COMMANDS_DIR, file));
}

// SLASH COMMAND IMPORTS - loads Discord REST tools for command registration.
const { REST, Routes } = require('discord.js');

// DEPLOY COMMANDS - sends all slash command definitions to Discord.
const deployCommands = async () => {
    try {
        // COMMAND LIST - collects command definitions from the commands folder.
        const commands = [];

        const commandFiles = getCommandFiles();

        for (const file of commandFiles) {
            const command = loadCommandFile(file);
            if ('data' in command && 'execute' in command) {
                const commandData = command.data.toJSON();
                commands.push(commandData);
                console.log(`Prepared slash command: /${commandData.name}`);
            } else {
                console.log(`WARNING: Command at ${file} is missing a required 'data' or 'execute' property`)
            }
        }

        // REST CLIENT - authenticates command deployment with the bot token.
        const rest = new REST().setToken(process.env.BOT_TOKEN);

        // DEPLOY TARGET - uses guild commands during development or global commands otherwise.
        const isGuildRegistration = Boolean(process.env.GUILD_ID);
        const route = isGuildRegistration
            ? Routes.applicationGuildCommands(process.env.CLIENT_ID, process.env.GUILD_ID)
            : Routes.applicationCommands(process.env.CLIENT_ID);

        console.log(`Started refreshing ${commands.length} application slash commands (${isGuildRegistration ? `guild ${process.env.GUILD_ID}` : 'global'})`);

        // DISCORD UPDATE - replaces Discord's slash commands with the local command list.
        await rest.put(route, { body: commands });

        console.log(`Successfully reloaded commands`);
    } catch (error) {
        console.error(`Error deploying command`, error);
    }

}

// DISCORD CLIENT IMPORTS - loads the client, intents, events, and helper classes.
const {
    Client,
    GatewayIntentBits,
    Partials,
    Collection,
    ActivityType,
    PresenceUpdateStatus,
    Events,
} = require('discord.js');

// CLIENT SETUP - creates the bot client and enables needed Discord events.
const client = new Client({
    intents: [
        GatewayIntentBits.Guilds,
        GatewayIntentBits.GuildMessages,
        GatewayIntentBits.MessageContent,
        GatewayIntentBits.GuildMembers
    ],
    partials: [
        Partials.Channel,
        Partials.Message,
        Partials.User,
        Partials.GuildMember
    ]
});

// COMMAND CACHE - stores loaded command files by command name.
client.commands = new Collection();

// COMMAND FILES - finds every JavaScript command file in the commands folder.
const commandsFiles = getCommandFiles();

// COMMAND LOADER - requires each command file and adds it to the command cache.
for (const file of commandsFiles) {
    const filePath = path.join(COMMANDS_DIR, file);
    const command = loadCommandFile(file);

    if ('data' in command && 'execute' in command) {
        const commandData = command.data.toJSON();
        // COMMAND REGISTER - saves the command so slash and prefix handlers can run it.
        client.commands.set(commandData.name, command)
        console.log(`Loaded command: ${commandData.name}`);
    } else {
        console.log(`The command ${filePath} is missing a required "data" or "execute" property`)
    }
}

// ENV VALIDATION - checks important .env values before logging in.
requireEnv('BOT_TOKEN');
validateSnowflake('CLIENT_ID');
validateSnowflake('GUILD_ID', false);

// ERROR LOGGING - prints async errors that would otherwise be hard to see.
process.on('unhandledRejection', error => {
    console.error('Unhandled promise rejection:', error);
});

// ERROR LOGGING - prints unexpected crashes before the process exits.
process.on('uncaughtException', error => {
    console.error('Uncaught exception:', error);
});

// READY EVENT - runs once after Discord confirms the bot is online.
client.once(Events.ClientReady, async () => {
    console.log(`Ready! Logged in as ${client.user.tag}`)

    // SLASH DEPLOY - refreshes slash commands when the bot starts.
    await deployCommands();
    console.log('Commands deployed!');

    // PRESENCE CONFIG - reads status and activity text from .env.
    const statusType = (process.env.BOT_STATUS || 'online').toLowerCase();
    const activityType = (process.env.ACTIVITY_TYPE || 'PLAYING').toUpperCase();
    const activityName = process.env.ACTIVITY_NAME || 'Economy';

    // ACTIVITY MAP - converts readable activity names into Discord constants.
    const activityTypeMap = {
        'PLAYING': ActivityType.Playing,
        'WATCHING': ActivityType.Watching,
        'LISTENING': ActivityType.Listening,
        'STREAMING': ActivityType.Streaming,
        'COMPETING': ActivityType.Competing
    };

    // STATUS MAP - converts readable status names into Discord constants.
    const statusMap = {
        'online': PresenceUpdateStatus.Online,
        'idle': PresenceUpdateStatus.Idle,
        'dnd': PresenceUpdateStatus.DoNotDisturb,
        'invisible': PresenceUpdateStatus.Invisible
    };

    // PRESENCE UPDATE - sets the bot's online status and activity.
    client.user.setPresence({
        status: statusMap[statusType],
        activities: [{
            name: activityName,
            type: activityTypeMap[activityType]
        }]
    });

    console.log(`Bot Status set to: ${statusType}`);
    console.log(`Activity set to: ${activityType} ${activityName}`)
    console.log(`Listening for prefix commands: ${PREFIXES.join(', ')}`);

});

// PREFIX CONFIG - controls which prefix starts text commands.
const PREFIXES = ['!'];

// SLASH HANDLER - runs slash commands from Discord interactions.
client.on(Events.InteractionCreate, async interaction => {
    if (!interaction.isChatInputCommand()) return;

    // COMMAND FINDER - gets the command file matching the slash command name.
    const command = client.commands.get(interaction.commandName);

    if (!command) {
        return;
    }

    // COMMAND EXECUTION - runs the slash command and catches errors.
    try {
        await command.execute(interaction);
    } catch (error) {
        console.error(error);
        if (interaction.replied || interaction.deferred) {
            await interaction.followUp({ content: 'There was an error whilst executing this command!', ephemeral: true})
        } else {
            await interaction.reply({content: 'There was an error while executing this command', ephemeral: true})
        }
    }
});

// PREFIX HANDLER - runs commands from normal messages like !roll case1.
client.on(Events.MessageCreate, async message => {
    if (message.author.bot) return;
    // PREFIX CHECK - ignores messages that do not start with an allowed prefix.
    const prefix = PREFIXES.find(currentPrefix => message.content.startsWith(currentPrefix));

    if (!prefix) return;

    // ARGUMENT PARSING - splits the command name from the rest of the message.
    const args = message.content.slice(prefix.length).trim().split(/\s+/);
    const commandName = args.shift().toLowerCase();
    // COMMAND FINDER - gets the command file matching the prefix command name.
    const command = client.commands.get(commandName);

    if (!command) {
        console.log(`Unknown prefix command: ${commandName}`);
        return;
    }

    // COMMAND EXECUTION - runs the prefix command and replies if it fails.
    try {
        await command.execute(message, args);
    } catch (error) {
        console.error(error);
        try {
            await message.reply({ content: 'There was an error while executing this command' });
        } catch (replyError) {
            console.error('Failed to send error message for prefix command:', replyError);
        }
    }
});

// BOT LOGIN - connects the bot to Discord.
client.login(process.env.BOT_TOKEN).catch(error => {
    console.error('Failed to log in to Discord:', error);
});
