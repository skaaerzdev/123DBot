// CASE CONFIG - stores every case users can view and roll.
const cases = {
    // CASE 1 - defines the command name, display name, required role, and rewards.
    case1: {
        name: 'case1',
        displayName: 'Insect Haven Case',
        embedColor: '#b80103',
        imageUrl: '',
        requiredRoleId: process.env.CASE1_REQUIRED_ROLE_ID,
        requiredRoleName: process.env.CASE1_REQUIRED_ROLE_NAME || 'Case 1',
        // CASE ITEMS - set icon to a Discord emoji like '<:name:123>' or an image link.
        items: [
            { icon: '<:GodIsGood:1370500908458311681>', name: '<@&1500503360242057306>', type: 'role', chance: 0.01, roleId: process.env.CASE1_GRADIENT_ROLE_1_ID, roleName: 'Big Dawg' },
            { icon: ':lady_beetle:', name: '<@&1496651860193312929>', type: 'role', chance: 2, roleId: process.env.CASE1_GRADIENT_ROLE_2_ID, roleName: 'Ladybug Luck' },
            { icon: ':honey_pot:', name: '<@&1496657634080587956>', type: 'role', chance: 2, roleId: process.env.CASE1_GRADIENT_ROLE_3_ID, roleName: 'HoneyComb' },
            { icon: '<:123dcoin:1342698565780242475>', name: '100,000 Coins', type: 'coins', chance: 1 },
            { icon: '<:123dcoin:1342698565780242475>', name: '62,500 Coins', type: 'coins', chance: 3 },
            { icon: '<:123dcoin:1342698565780242475>', name: '50,000 Coins', type: 'coins', chance: 6 },
            { icon: '<:123dcoin:1342698565780242475>', name: '37,500 Coins', type: 'coins', chance: 12 },
            { icon: '<:123dcoin:1342698565780242475>', name: '25,000 Coins', type: 'coins', chance: 22 },
            { icon: '<:123dcoin:1342698565780242475>', name: '17,500 Coins', type: 'coins', chance: 30 },
            { name: '😔 Nothing', type: 'coins', chance: 21.99 },
        ],
    },
    // CASE 2 - another case entry that can be edited or renamed later.
    case2: {
        name: 'case2',
        displayName: 'Promise of Spring Case',
        embedColor: '#c2aa50',
        imageUrl: '',
        requiredRoleId: process.env.CASE2_REQUIRED_ROLE_ID,
        requiredRoleName: process.env.CASE2_REQUIRED_ROLE_NAME || 'Case 2',
        // CASE ITEMS - role rewards give Discord roles, coin rewards are shown only.
        items: [
            { icon: '<:GodIsGood:1370500908458311681>', name: '<@&1500503360242057306>', type: 'role', chance: 0.01, roleId: process.env.CASE1_GRADIENT_ROLE_1_ID, roleName: 'Big Dawg' },
            { icon: ':diamonds:', name: '<@&1342954216087486527>', type: 'role', chance: 1, roleId: process.env.CASE2_GRADIENT_ROLE_3_ID, roleName: 'Professional Gambler' },
            { icon: ':sun_with_face:', name: '<@&1494727348795347095>', type: 'role', chance: 2, roleId: process.env.CASE2_GRADIENT_ROLE_1_ID, roleName: 'Morning Hatch' },
            { icon: ':four_leaf_clover:', name: '<@&1498678123317694485>', type: 'role', chance: 2, roleId: process.env.CASE2_GRADIENT_ROLE_2_ID, roleName: '4 Leaf Blessing' },
            { icon: '<:123dcoin:1342698565780242475>',name: '100,000 Coins', type: 'coins', chance: 1 },
            { icon: '<:123dcoin:1342698565780242475>',name: '62,500 Coins', type: 'coins', chance: 3 },
            { icon: '<:123dcoin:1342698565780242475>',name: '50,000 Coins', type: 'coins', chance: 6 },
            { icon: '<:123dcoin:1342698565780242475>',name: '37,500 Coins', type: 'coins', chance: 12 },
            { icon: '<:123dcoin:1342698565780242475>',name: '25,000 Coins', type: 'coins', chance: 22 },
            { icon: '<:123dcoin:1342698565780242475>',name: '17,500 Coins', type: 'coins', chance: 30 },
            { icon: '<:123dcoin:1342698565780242475>',name: '😔 Nothing', type: 'coins', chance: 20.99 },
        ],
    },
    // CASE 3 - another case entry that uses the same structure as case1.
    case3: {
        name: 'case3',
        displayName: 'Floral Bloom Case',
        embedColor: '#8890ff',
        imageUrl: '',
        requiredRoleId: process.env.CASE3_REQUIRED_ROLE_ID,
        requiredRoleName: process.env.CASE3_REQUIRED_ROLE_NAME || 'Case 3',
        // CASE ITEMS - chance values act as weighted odds for the roll.
        items: [
            { icon: '<:GodIsGood:1370500908458311681>', name: '<@&1500503360242057306>', type: 'role', chance: 0.01, roleId: process.env.CASE1_GRADIENT_ROLE_1_ID, roleName: 'Big Dawg' },
            { icon: ':large_blue_diamond:', name: '<@&1494727072743166073>', type: 'role', chance: 2, roleId: process.env.CASE3_GRADIENT_ROLE_1_ID, roleName: 'Bluebell Bliss' },
            { icon: ':tulip:', name: '<@&1494726606487425024>', type: 'role', chance: 2, roleId: process.env.CASE3_GRADIENT_ROLE_2_ID, roleName: 'Tranquil Tulips' },
            { icon: '<:123dcoin:1342698565780242475>',name: '100,000 Coins', type: 'coins', chance: 1 },
            { icon: '<:123dcoin:1342698565780242475>',name: '62,500 Coins', type: 'coins', chance: 3 },
            { icon: '<:123dcoin:1342698565780242475>',name: '50,000 Coins', type: 'coins', chance: 6 },
            { icon: '<:123dcoin:1342698565780242475>',name: '37,500 Coins', type: 'coins', chance: 12 },
            { icon: '<:123dcoin:1342698565780242475>',name: '25,000 Coins', type: 'coins', chance: 22 },
            { icon: '<:123dcoin:1342698565780242475>',name: '17,500 Coins', type: 'coins', chance: 30 },
            { icon: '<:123dcoin:1342698565780242475>',name: '😔 Nothing', type: 'coins', chance: 21.99 },
        ],
    },
    // CASE 4 - placeholder case entry for another event case.
    case4: {
        name: 'case4',
        displayName: 'Berries & Blossoms Case',
        embedColor: '#ff89ba',
        imageUrl: '',
        requiredRoleId: process.env.CASE4_REQUIRED_ROLE_ID,
        requiredRoleName: process.env.CASE4_REQUIRED_ROLE_NAME || 'Case 4',
        // CASE ITEMS - edit names, role IDs and chances here.
        items: [
            { icon: '<:GodIsGood:1370500908458311681>', name: '<@&1500503360242057306>', type: 'role', chance: 0.01, roleId: process.env.CASE1_GRADIENT_ROLE_1_ID, roleName: 'Big Dawg' },
            { icon: ':diamonds:', name: '<@&1342954216087486527>', type: 'role', chance: 1, roleId: process.env.CASE2_GRADIENT_ROLE_3_ID, roleName: 'Professional Gambler' },
            { icon: ':cherry_blossom:', name: '<@&1498691469731696691>', type: 'role', chance: 2, roleId: process.env.CASE4_GRADIENT_ROLE_1_ID, roleName: 'Cherry Blossom' },
            { icon: ':strawberry:', name: '<@&1499064164226695178>', type: 'role', chance: 2, roleId: process.env.CASE4_GRADIENT_ROLE_2_ID, roleName: 'Verry Grove' },
            { icon: '<:123dcoin:1342698565780242475>',name: '100,000 Coins', type: 'coins', chance: 1 },
            { icon: '<:123dcoin:1342698565780242475>',name: '62,500 Coins', type: 'coins', chance: 3 },
            { icon: '<:123dcoin:1342698565780242475>',name: '50,000 Coins', type: 'coins', chance: 6 },
            { icon: '<:123dcoin:1342698565780242475>',name: '37,500 Coins', type: 'coins', chance: 12 },
            { icon: '<:123dcoin:1342698565780242475>',name: '25,000 Coins', type: 'coins', chance: 22 },
            { icon: '<:123dcoin:1342698565780242475>', name: '17,500 Coins', type: 'coins', chance: 30 },
            { icon: '<:123dcoin:1342698565780242475>', name: '😔 Nothing', type: 'coins', chance: 20.99 },
        ],
    },
    // CASE 5 - placeholder case entry for another event case.
    case5: {
        name: 'case5',
        displayName: 'Pond Life Case',
        embedColor: '#3e88aa',
        imageUrl: '',
        requiredRoleId: process.env.CASE5_REQUIRED_ROLE_ID,
        requiredRoleName: process.env.CASE5_REQUIRED_ROLE_NAME || 'Case 5',
        // CASE ITEMS - this reward list is used by view and roll commands.
        items: [
            { icon: '<:GodIsGood:1370500908458311681>', name: '<@&1500503360242057306>', type: 'role', chance: 0.01, roleId: process.env.CASE1_GRADIENT_ROLE_1_ID, roleName: 'Big Dawg' },
            { icon: ':lotus:', name: '<@&1499038962059051248>', type: 'role', chance: 2, roleId: process.env.CASE5_GRADIENT_ROLE_1_ID, roleName: 'Eternal Lotus' },
            { icon: ':ocean:', name: '<@&1498712051751850136>', type: 'role', chance: 2, roleId: process.env.CASE5_GRADIENT_ROLE_2_ID, roleName: 'Calm Waters' },
            { icon: '<:123dcoin:1342698565780242475>', name: '100,000 Coins', type: 'coins', chance: 1 },
            { icon: '<:123dcoin:1342698565780242475>', name: '62,500 Coins', type: 'coins', chance: 3 },
            { icon: '<:123dcoin:1342698565780242475>', name: '50,000 Coins', type: 'coins', chance: 6 },
            { icon: '<:123dcoin:1342698565780242475>', name: '37,500 Coins', type: 'coins', chance: 12 },
            { icon: '<:123dcoin:1342698565780242475>', name: '25,000 Coins', type: 'coins', chance: 22 },
            { icon: '<:123dcoin:1342698565780242475>', name: '17,500 Coins', type: 'coins', chance: 30 },
            { icon: '<:123dcoin:1342698565780242475>', name: '😔 Nothing', type: 'coins', chance: 21.99 },
        ],
    },
    // CASE 6 - placeholder case entry for another event case.
    case6: {
        name: 'case6',
        displayName: 'Free Case',
        embedColor: '#c2aa50',
        imageUrl: '',
        requiredRoleId: process.env.CASE6_REQUIRED_ROLE_ID,
        requiredRoleName: process.env.CASE6_REQUIRED_ROLE_NAME || 'Case 6',
        // CASE ITEMS - keep chances adding to 100 if you want exact percentages.
        items: [
            { icon: '<:GodIsGood:1370500908458311681>', name: '<@&1500503360242057306>', type: 'role', chance: 0.01, roleId: process.env.CASE1_GRADIENT_ROLE_1_ID, roleName: 'Big Dawg' },
            { icon: '<:123dcoin:1342698565780242475>',name: '50,000 Coins', type: 'coins', chance: 0.5, },
            { icon: '<:123dcoin:1342698565780242475>',name: '12,500 Coins', type: 'coins', chance: 1.5,},
            { icon: '<:123dcoin:1342698565780242475>',name: '5,000 Coins', type: 'coins', chance: 3 },
            { icon: '<:123dcoin:1342698565780242475>',name: '3,500 Coins', type: 'coins', chance: 5 },
            { icon: '<:123dcoin:1342698565780242475>',name: '2,750 Coins', type: 'coins', chance: 8 },
            { icon: '<:123dcoin:1342698565780242475>',name: '2,250 Coins', type: 'coins', chance: 10 },
            { icon: '<:123dcoin:1342698565780242475>',name: '1,750 Coins', type: 'coins', chance: 17 },
            { icon: '<:123dcoin:1342698565780242475>',name: '1,250 Coins', type: 'coins', chance: 25 },
            { icon: '<:123dcoin:1342698565780242475>',name: '750 Coins', type: 'coins', chance: 29.99 },
        ],
    },
    // CASE 7 - placeholder case entry for another event case.
    case7: {
        name: 'case7',
        displayName: 'Random Case',
        embedColor: '#c2aa50',
        imageUrl: '',
        requiredRoleId: process.env.CASE7_REQUIRED_ROLE_ID,
        requiredRoleName: process.env.CASE7_REQUIRED_ROLE_NAME || 'Case 7',
        // CASE ITEMS - every object here is one possible roll result.
        items: [
            { icon: '<:GodIsGood:1370500908458311681>', name: '<@&1500503360242057306>', type: 'role', chance: 0.01, roleId: process.env.CASE1_GRADIENT_ROLE_1_ID, roleName: 'Big Dawg' },
            { name: '<@&1404608744523956307>', type: 'role', chance: 19.99, roleId: process.env.CASE7_GRADIENT_ROLE_1_ID, roleName: 'Insect Haven  (!roll case1)'},
            { name: '<@&1404608746986016779>', type: 'role', chance: 20, roleId: process.env.CASE7_GRADIENT_ROLE_2_ID, roleName: 'Promise of Spring (!roll case2)'},
            { name: '<@&1404608749754253354>', type: 'role', chance: 20, roleId: process.env.CASE7_GRADIENT_ROLE_3_ID, roleName: 'Floral Bloom (!roll case3)'},
            { name: '<@&1404610728400261201>', type: 'role', chance: 20, roleId: process.env.CASE7_GRADIENT_ROLE_4_ID, roleName: 'Berries and Blossoms (!roll case4)'},
            { name: '<@&1404610805583839395>', type: 'role', chance: 20, roleId: process.env.CASE7_GRADIENT_ROLE_5_ID, roleName: 'Pond Life (!roll case5)'},
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
