// CASE CONFIG - stores every case users can view and roll.
const cases = {
    // CASE 1 - defines the command name, display name, required role, and rewards.
    case1: {
        name: 'case1',
        displayName: 'Insect Haven',
        requiredRoleId: process.env.CASE1_REQUIRED_ROLE_ID,
        requiredRoleName: process.env.CASE1_REQUIRED_ROLE_NAME || 'Case 1',
        // CASE ITEMS - each item is one possible reward with its own chance.
        items: [
            { name: '<@&1496651860193312929>', type: 'role', rarity: 'Mythic', chance: 2, roleId: process.env.CASE1_GRADIENT_ROLE_1_ID, roleName: 'Ladybug Luck' },
            { name: '<@&1496657634080587956>', type: 'role', rarity: 'Mythic', chance: 2, roleId: process.env.CASE1_GRADIENT_ROLE_2_ID, roleName: 'HoneyComb' },
            { name: '50,000 Coins', type: 'coins', rarity: 'Epic', chance: 5 },
            { name: 'Coin Boost', type: 'coins', rarity: 'Epic', chance: 5 },
            { name: '30,000 Coins', type: 'coins', rarity: 'Rare', chance: 8 },
            { name: 'Nothing', type: 'coins', rarity: 'Rare', chance: 8 },
            { name: 'XP Boost', type: 'coins', rarity: 'Uncommon', chance: 20 },
            { name: '5,000 Coins', type: 'coins', rarity: 'Uncommon', chance: 20 },
            { name: 'Nothing', type: 'coins', rarity: 'Common', chance: 15 },
            { name: '1,000 Coins', type: 'coins', rarity: 'Common', chance: 15 },
        ],
    },
    // CASE 2 - another case entry that can be edited or renamed later.
    case2: {
        name: 'case2',
        displayName: 'Promise of Spring',
        requiredRoleId: process.env.CASE2_REQUIRED_ROLE_ID,
        requiredRoleName: process.env.CASE2_REQUIRED_ROLE_NAME || 'Case 2',
        // CASE ITEMS - role rewards give Discord roles, coin rewards are shown only.
        items: [
            { name: '<@&ROLEID>', type: 'role', rarity: 'Mythic', chance: 2, roleId: process.env.CASE2_GRADIENT_ROLE_1_ID, roleName: 'Ember Gradient' },
            { name: '<@&ROLEID>', type: 'role', rarity: 'Mythic', chance: 2, roleId: process.env.CASE2_GRADIENT_ROLE_2_ID, roleName: 'Frost Gradient' },
            { name: '20,000 Coins', type: 'coins', rarity: 'Common', chance: 18 },
            { name: '25,000 Coins', type: 'coins', rarity: 'Common', chance: 18 },
            { name: '30,000 Coins', type: 'coins', rarity: 'Uncommon', chance: 16 },
            { name: '35,000 Coins', type: 'coins', rarity: 'Uncommon', chance: 14 },
            { name: '40,000 Coins', type: 'coins', rarity: 'Rare', chance: 12 },
            { name: '50,000 Coins', type: 'coins', rarity: 'Epic', chance: 12 },
        ],
    },
    // CASE 3 - another case entry that uses the same structure as case1.
    case3: {
        name: 'case3',
        displayName: 'Floral Bloom',
        requiredRoleId: process.env.CASE3_REQUIRED_ROLE_ID,
        requiredRoleName: process.env.CASE3_REQUIRED_ROLE_NAME || 'Case 3',
        // CASE ITEMS - chance values act as weighted odds for the roll.
        items: [
            { name: '<@&ROLEID>', type: 'role', rarity: 'Mythic', chance: 2, roleId: process.env.CASE3_GRADIENT_ROLE_1_ID, roleName: 'Crystal Gradient' },
            { name: '<@&ROLEID>', type: 'role', rarity: 'Mythic', chance: 2, roleId: process.env.CASE3_GRADIENT_ROLE_2_ID, roleName: 'Shadow Gradient' },
            { name: '20,000 Coins', type: 'coins', rarity: 'Common', chance: 18 },
            { name: '25,000 Coins', type: 'coins', rarity: 'Common', chance: 18 },
            { name: '30,000 Coins', type: 'coins', rarity: 'Uncommon', chance: 16 },
            { name: '35,000 Coins', type: 'coins', rarity: 'Uncommon', chance: 14 },
            { name: '40,000 Coins', type: 'coins', rarity: 'Rare', chance: 12 },
            { name: '50,000 Coins', type: 'coins', rarity: 'Epic', chance: 12 },
        ],
    },
    // CASE 4 - placeholder case entry for another event case.
    case4: {
        name: 'case4',
        displayName: 'Berries & Blossoms',
        requiredRoleId: process.env.CASE4_REQUIRED_ROLE_ID,
        requiredRoleName: process.env.CASE4_REQUIRED_ROLE_NAME || 'Case 4',
        // CASE ITEMS - edit names, role IDs, rarities, and chances here.
        items: [
            { name: '<@&ROLEID>', type: 'role', rarity: 'Mythic', chance: 2, roleId: process.env.CASE3_GRADIENT_ROLE_1_ID, roleName: 'Crystal Gradient' },
            { name: '<@&ROLEID>', type: 'role', rarity: 'Mythic', chance: 2, roleId: process.env.CASE3_GRADIENT_ROLE_2_ID, roleName: 'Shadow Gradient' },
            { name: '20,000 Coins', type: 'coins', rarity: 'Common', chance: 18 },
            { name: '25,000 Coins', type: 'coins', rarity: 'Common', chance: 18 },
            { name: '30,000 Coins', type: 'coins', rarity: 'Uncommon', chance: 16 },
            { name: '35,000 Coins', type: 'coins', rarity: 'Uncommon', chance: 14 },
            { name: '40,000 Coins', type: 'coins', rarity: 'Rare', chance: 12 },
            { name: '50,000 Coins', type: 'coins', rarity: 'Epic', chance: 12 },
        ],
    },
    // CASE 5 - placeholder case entry for another event case.
    case5: {
        name: 'case5',
        displayName: 'Pond Life',
        requiredRoleId: process.env.CASE5_REQUIRED_ROLE_ID,
        requiredRoleName: process.env.CASE5_REQUIRED_ROLE_NAME || 'Case 5',
        // CASE ITEMS - this reward list is used by view and roll commands.
        items: [
            { name: '<@&ROLEID>', type: 'role', rarity: 'Mythic', chance: 2, roleId: process.env.CASE3_GRADIENT_ROLE_1_ID, roleName: 'Crystal Gradient' },
            { name: '<@&ROLEID>', type: 'role', rarity: 'Mythic', chance: 2, roleId: process.env.CASE3_GRADIENT_ROLE_2_ID, roleName: 'Shadow Gradient' },
            { name: '20,000 Coins', type: 'coins', rarity: 'Common', chance: 18 },
            { name: '25,000 Coins', type: 'coins', rarity: 'Common', chance: 18 },
            { name: '30,000 Coins', type: 'coins', rarity: 'Uncommon', chance: 16 },
            { name: '35,000 Coins', type: 'coins', rarity: 'Uncommon', chance: 14 },
            { name: '40,000 Coins', type: 'coins', rarity: 'Rare', chance: 12 },
            { name: '50,000 Coins', type: 'coins', rarity: 'Epic', chance: 12 },
        ],
    },
    // CASE 6 - placeholder case entry for another event case.
    case6: {
        name: 'case6',
        displayName: 'Pond Life',
        requiredRoleId: process.env.CASE5_REQUIRED_ROLE_ID,
        requiredRoleName: process.env.CASE5_REQUIRED_ROLE_NAME || 'Case 6',
        // CASE ITEMS - keep chances adding to 100 if you want exact percentages.
        items: [
            { name: '<@&ROLEID>', type: 'role', rarity: 'Mythic', chance: 2, roleId: process.env.CASE3_GRADIENT_ROLE_1_ID, roleName: 'Crystal Gradient' },
            { name: '<@&ROLEID>', type: 'role', rarity: 'Mythic', chance: 2, roleId: process.env.CASE3_GRADIENT_ROLE_2_ID, roleName: 'Shadow Gradient' },
            { name: '20,000 Coins', type: 'coins', rarity: 'Common', chance: 18 },
            { name: '25,000 Coins', type: 'coins', rarity: 'Common', chance: 18 },
            { name: '30,000 Coins', type: 'coins', rarity: 'Uncommon', chance: 16 },
            { name: '35,000 Coins', type: 'coins', rarity: 'Uncommon', chance: 14 },
            { name: '40,000 Coins', type: 'coins', rarity: 'Rare', chance: 12 },
            { name: '50,000 Coins', type: 'coins', rarity: 'Epic', chance: 12 },
        ],
    },
    // CASE 7 - placeholder case entry for another event case.
    case7: {
        name: 'case7',
        displayName: 'Pond Life',
        requiredRoleId: process.env.CASE5_REQUIRED_ROLE_ID,
        requiredRoleName: process.env.CASE5_REQUIRED_ROLE_NAME || 'Case 7',
        // CASE ITEMS - every object here is one possible roll result.
        items: [
            { name: '<@&ROLEID>', type: 'role', rarity: 'Mythic', chance: 2, roleId: process.env.CASE3_GRADIENT_ROLE_1_ID, roleName: 'Crystal Gradient' },
            { name: '<@&ROLEID>', type: 'role', rarity: 'Mythic', chance: 2, roleId: process.env.CASE3_GRADIENT_ROLE_2_ID, roleName: 'Shadow Gradient' },
            { name: '20,000 Coins', type: 'coins', rarity: 'Common', chance: 18 },
            { name: '25,000 Coins', type: 'coins', rarity: 'Common', chance: 18 },
            { name: '30,000 Coins', type: 'coins', rarity: 'Uncommon', chance: 16 },
            { name: '35,000 Coins', type: 'coins', rarity: 'Uncommon', chance: 14 },
            { name: '40,000 Coins', type: 'coins', rarity: 'Rare', chance: 12 },
            { name: '50,000 Coins', type: 'coins', rarity: 'Epic', chance: 12 },
        ],
    },
};

// GET CASE - retrieves case configuration by case name.
function getCase(caseName) {
    if (!caseName) return null;
    const normalizedName = caseName.toLowerCase().replace(/^\[|\]$/g, '');

    return cases[normalizedName];
}

// GET CASE CHOICES - returns available case choices for slash command menus.
function getCaseChoices() {
    return Object.values(cases).map(caseInfo => ({
        name: caseInfo.displayName,
        value: caseInfo.name,
    }));
}

// EXPORTS - shares case data and helper functions with command files.
module.exports = {
    cases,
    getCase,
    getCaseChoices,
};
