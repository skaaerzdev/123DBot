const { addCoins, getDropState, setDropState } = require('../caseStore');

const DROP_CHANNEL_ID = '1402858046325264436';
const claimedDropIds = new Set();

async function getEconomyChannel(client) {
    const cachedChannel = client.channels.cache.get(DROP_CHANNEL_ID);

    if (cachedChannel && cachedChannel.isTextBased?.()) {
        return cachedChannel;
    }

    try {
        const fetchedChannel = await client.channels.fetch(DROP_CHANNEL_ID);
        return fetchedChannel && fetchedChannel.isTextBased?.() ? fetchedChannel : null;
    } catch (error) {
        return null;
    }
}

async function sendRandomDrop(client) {
    const channel = await getEconomyChannel(client);

    if (!channel) {
        return;
    }

    const now = Date.now();
    const state = getDropState();
    const nextDropAt = state.nextDropAt || now + 30 * 60 * 1000;
    const nextBigDropAt = state.nextBigDropAt || now + 2 * 60 * 60 * 1000;

    let isBigDrop = false;

    if (now >= nextBigDropAt) {
        isBigDrop = true;
    } else if (now < nextDropAt) {
        return;
    }

    const amount = isBigDrop
        ? Math.floor(Math.random() * 50000) + 1
        : Math.floor(Math.random() * 10000) + 1;

    const updatedState = {
        nextDropAt: now + 30 * 60 * 1000,
        nextBigDropAt: isBigDrop ? now + 2 * 60 * 60 * 1000 : nextBigDropAt,
    };

    setDropState(updatedState);

    const dropMessages = [
        'Skaaerz dropped his money',
        'A shady trader dropped his money',
        'A lucky goblin dropped a pile of coins',
        'The boss dropped a bag of cash',
    ];
    const dropMessage = dropMessages[Math.floor(Math.random() * dropMessages.length)];

    try {
        await channel.send({
            content: `${dropMessage}. Be first to claim **${amount.toLocaleString('en-US')}** coins!`,
            components: [
                {
                    type: 1,
                    components: [
                        {
                            type: 2,
                            custom_id: `claim:${Date.now()}:${amount}`,
                            style: 3,
                            label: `Claim ${amount.toLocaleString('en-US')} coins`,
                        },
                    ],
                },
            ],
        });
    } catch (error) {
        console.error('Failed to send random drop:', error);
    }
}

function startDropScheduler(client) {
    const state = getDropState();

    if (!state.nextDropAt) {
        state.nextDropAt = Date.now() + 30 * 60 * 1000;
    }

    if (!state.nextBigDropAt) {
        state.nextBigDropAt = Date.now() + 2 * 60 * 60 * 1000;
    }

    setDropState(state);

    setInterval(() => {
        sendRandomDrop(client).catch(error => {
            console.error('Random drop scheduler error:', error);
        });
    }, 60 * 1000);
}

async function handleClaimButton(interaction) {
    if (!interaction.isButton() || !interaction.customId.startsWith('claim:')) {
        return false;
    }

    const parts = interaction.customId.split(':');
    const dropId = parts[1];
    const amount = Number(parts[2] || 0);

    if (claimedDropIds.has(dropId)) {
        await interaction.reply({ content: 'This drop has already been claimed.', ephemeral: true });
        return true;
    }

    claimedDropIds.add(dropId);
    addCoins(interaction.user.id, amount);

    await interaction.update({
        content: `${interaction.user} claimed the drop and won **${amount.toLocaleString('en-US')}** coins!`,
        components: [],
    });
    return true;
}

module.exports = {
    startDropScheduler,
    handleClaimButton,
};
