// IMPORTS - loads tools for reading and writing local JSON files.
const fs = require('fs');
const path = require('path');

// DATA PATH - points to the file where case and coin data is saved.
const dataPath = path.join(__dirname, 'economy', 'caseData.json');

// DEFAULT DATA - creates the starting save-file structure.
function createDefaultData() {
    return {
        users: {},
    };
}

// DATA FILE SETUP - creates the economy folder and save file if they do not exist.
function ensureDataFile() {
    const dataDirectory = path.dirname(dataPath);

    if (!fs.existsSync(dataDirectory)) {
        fs.mkdirSync(dataDirectory, { recursive: true });
    }

    if (!fs.existsSync(dataPath)) {
        fs.writeFileSync(dataPath, JSON.stringify(createDefaultData(), null, 2));
    }
}

// READ DATA - loads saved user data from the JSON file.
function readData() {
    ensureDataFile();

    try {
        return JSON.parse(fs.readFileSync(dataPath, 'utf8'));
    } catch (error) {
        console.error('Failed to read case economy data:', error);
        return createDefaultData();
    }
}

// WRITE DATA - saves updated user data back into the JSON file.
function writeData(data) {
    ensureDataFile();
    fs.writeFileSync(dataPath, JSON.stringify(data, null, 2));
}

// USER DATA - returns an existing user record or creates a new one.
function getUser(data, userId) {
    if (!data.users[userId]) {
        data.users[userId] = {
            coins: 0,
            cases: {},
        };
    }

    return data.users[userId];
}

// ADD CASE - adds one owned case to a user.
function addCase(userId, caseName) {
    const data = readData();
    const user = getUser(data, userId);

    user.cases[caseName] = (user.cases[caseName] || 0) + 1;
    writeData(data);

    return user.cases[caseName];
}

// REMOVE CASE - removes one owned case from a user.
function removeCase(userId, caseName) {
    const data = readData();
    const user = getUser(data, userId);
    const amount = user.cases[caseName] || 0;

    if (amount <= 0) {
        return 0;
    }

    user.cases[caseName] = amount - 1;
    writeData(data);

    return user.cases[caseName];
}

// CASE AMOUNT - checks how many of one case a user owns.
function getCaseAmount(userId, caseName) {
    const data = readData();
    const user = getUser(data, userId);

    return user.cases[caseName] || 0;
}

// ADD COINS - adds coin rewards to a user's balance.
function addCoins(userId, amount) {
    const data = readData();
    const user = getUser(data, userId);

    user.coins += amount;
    writeData(data);

    return user.coins;
}

// EXPORTS - shares storage functions with command files.
module.exports = {
    addCase,
    removeCase,
    getCaseAmount,
    addCoins,
};
