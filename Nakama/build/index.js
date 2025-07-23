"use strict";
let InitModule = function (ctx, logger, nk, initializer) {
    createLeaderboard(nk, logger, LeaderboardTrophyId, "best" /* nkruntime.Operator.BEST */);
    createLeaderboard(nk, logger, LeaderboardTotalBlastDefeatedId, "increment" /* nkruntime.Operator.INCREMENTAL */);
    createAreaLeaderboards(nk, logger, ctx);
    // Set up hooks.
    initializer.registerAfterAuthenticateDevice(afterAuthenticate);
    initializer.registerAfterAuthenticateEmail(afterAuthenticate);
    // DailyReward
    initializer.registerRpc('canClaimDailyReward', rpcCanClaimDailyReward);
    initializer.registerRpc('claimDailyReward', rpcClaimDailyReward);
    initializer.registerRpc('loadAllDailyReward', rpcLoadAllDailyReward);
    // Blast
    initializer.registerRpc('loadUserBlast', rpcLoadUserBlast);
    initializer.registerRpc('swapStoredToDeckBlast', rpcSwapStoredToDeckBlast);
    initializer.registerRpc('swapDeckToDeckBlast', rpcSwapDeckToDeckBlast);
    initializer.registerRpc('evolveBlast', rpcEvolveBlast);
    initializer.registerRpc('swapMove', rpcSwapBlastMove);
    // Bag
    initializer.registerRpc('loadUserItem', rpcLoadUserItems);
    initializer.registerRpc('swapStoredToDeckItem', rpcSwapStoredToDeckItem);
    initializer.registerRpc('swapDeckToDeckItem', rpcSwapDeckToDeckItem);
    // Store
    initializer.registerRpc('loadBlastTrapOffer', rpcLoadBlastTrapOffer);
    initializer.registerRpc('buyTrapOffer', rpcBuyTrapOffer);
    initializer.registerRpc('loadGemOffer', rpcLoadGemsOffer);
    initializer.registerRpc('buyGemOffer', rpcBuyGemOffer);
    initializer.registerRpc('loadCoinOffer', rpcLoadCoinsOffer);
    initializer.registerRpc('buyCoinOffer', rpcBuyCoinOffer);
    initializer.registerRpc('canClaimDailyShop', rpcCanClaimDailyShop);
    initializer.registerRpc('claimDailyShop', rpcGetDailyShopOffer);
    initializer.registerRpc('buyDailyShopOffer', rpcBuyDailyShopOffer);
    // Ads  
    initializer.registerRpc('watchPvEBattleAds', rpcWatchPvEBattleAds);
    initializer.registerRpc('watchPvPBattleAds', rpcWatchPvPBattleAds);
    initializer.registerRpc('watchRefreshShopAds', rpcWatchRefreshShopAds);
    // Area
    initializer.registerRpc('selectArea', rpcSelectArea);
    // Quest
    initializer.registerRpc('loadDailyQuest', rpcGetDailyQuests);
    initializer.registerRpc('claimDailyQuest', rpcClaimDailyQuestReward);
    initializer.registerRpc('claimAdQuest', rpcWatchQuestAds);
    initializer.registerRpc('loadDailyQuestRewards', rpcGetDailyQuestRewards);
    // Blast Tracker 
    initializer.registerRpc('loadBlastTracker', rpcGetAllBlastTrackerData);
    initializer.registerRpc('claimFirstCatch', rpcClaimFirstCaptureReward);
    // Others
    initializer.registerRpc('loadBlastPedia', rpcLoadBlastPedia);
    initializer.registerRpc('loadItemPedia', rpcLoadItemPedia);
    initializer.registerRpc('loadMovePedia', rpcLoadMovePedia);
    initializer.registerRpc('loadAllArea', rpcLoadAllArea);
    // PvE Battle
    initializer.registerRpc('findPvEBattle', rpcCreatePvEBattle);
    initializer.registerMatch('PvEBattle', {
        matchInit: PvEinitMatch,
        matchJoinAttempt: PvEmatchJoinAttempt,
        matchJoin: PvEmatchJoin,
        matchLeave: PvEmatchLeave,
        matchLoop: PvEmatchLoop,
        matchSignal: PvEmatchSignal,
        matchTerminate: PvEmatchTerminate
    });
    // PvP Battle
    initializer.registerRpc('findPvPBattle', rpcFindOrCreatePvPBattle);
    initializer.registerMatch('PvPBattle', {
        matchInit: PvPinitMatch,
        matchJoinAttempt: PvPmatchJoinAttempt,
        matchJoin: PvPmatchJoin,
        matchLeave: PvPmatchLeave,
        matchLoop: PvPmatchLoop,
        matchSignal: PvPmatchSignal,
        matchTerminate: PvPmatchTerminate
    });
    // User
    initializer.registerRpc('updateNicknameStatus', rpcUpdateNicknameStatus);
    initializer.registerRpc('deleteAccount', rpcDeleteAccount);
    // Tests
    initializer.registerRpc('calculateAttackDamage', rpcCalculateAttackDamage);
    initializer.registerRpc('calculateExpGain', rpcCalculateExpGain);
    initializer.registerRpc('calculateLevelFromExp', rpcCalculateLevelFromExp);
    initializer.registerRpc('calculateExpFromLevel', rpcCalculateExpFromLevel);
    initializer.registerRpc('calculateBlastStat', rpcCalculateBlastStat);
    initializer.registerRpc('calculateBlastHP', rpcCalculateBlastHP);
    initializer.registerRpc('calculateBlastMana', rpcCalculateBlastMana);
    logger.info('XXXXXXXXXXXXXXXXXXXX - Blast Royale TypeScript loaded - XXXXXXXXXXXXXXXXXXXX');
};
//#region ENUM
var Status;
(function (Status) {
    Status[Status["None"] = 0] = "None";
    Status[Status["Burn"] = 1] = "Burn";
    Status[Status["Seeded"] = 2] = "Seeded";
    Status[Status["Wet"] = 3] = "Wet";
    Status[Status["All"] = 4] = "All";
})(Status || (Status = {}));
;
var Rarity;
(function (Rarity) {
    Rarity[Rarity["None"] = 0] = "None";
    Rarity[Rarity["Common"] = 1] = "Common";
    Rarity[Rarity["Uncommon"] = 2] = "Uncommon";
    Rarity[Rarity["Rare"] = 3] = "Rare";
    Rarity[Rarity["Epic"] = 4] = "Epic";
    Rarity[Rarity["Legendary"] = 5] = "Legendary";
    Rarity[Rarity["Ultimate"] = 6] = "Ultimate";
    Rarity[Rarity["Unique"] = 7] = "Unique";
})(Rarity || (Rarity = {}));
var Type;
(function (Type) {
    Type[Type["Normal"] = 0] = "Normal";
    Type[Type["Fire"] = 1] = "Fire";
    Type[Type["Water"] = 2] = "Water";
    Type[Type["Grass"] = 3] = "Grass";
    Type[Type["Ground"] = 4] = "Ground";
    Type[Type["Fly"] = 5] = "Fly";
    Type[Type["Electric"] = 6] = "Electric";
    Type[Type["Light"] = 7] = "Light";
    Type[Type["Dark"] = 8] = "Dark";
})(Type || (Type = {}));
var Meteo;
(function (Meteo) {
    Meteo[Meteo["None"] = 0] = "None";
    Meteo[Meteo["Sun"] = 1] = "Sun";
    Meteo[Meteo["Rain"] = 2] = "Rain";
    Meteo[Meteo["Leaves"] = 3] = "Leaves";
})(Meteo || (Meteo = {}));
var Stats;
(function (Stats) {
    Stats[Stats["None"] = 0] = "None";
    Stats[Stats["Attack"] = 422] = "Attack";
    Stats[Stats["Defense"] = 423] = "Defense";
    Stats[Stats["Speed"] = 424] = "Speed";
})(Stats || (Stats = {}));
//#endregion
const pveBattleButtonAds = 'pveBattleButtonAds';
const pvpBattleButtonAds = 'pvpBattleButtonAds';
function rpcWatchPvEBattleAds(context, logger, nk, payload) {
    const userId = context.userId;
    setMetadataStat(nk, userId, pveBattleButtonAds, true);
}
function rpcWatchPvPBattleAds(context, logger, nk, payload) {
    const userId = context.userId;
    setMetadataStat(nk, userId, pvpBattleButtonAds, true);
}
function rpcWatchRefreshShopAds(context, logger, nk, payload) {
    if (!context.userId) {
        throw Error('No user ID in context');
    }
    const newShop = generateRandomDailyShop(nk, context.userId, logger);
    const dailyShop = {
        lastClaimUnix: msecToSec(Date.now()),
        lastDailyShop: newShop,
    };
    const write = {
        collection: DailyShopCollectionName,
        key: DailyShopCollectionKey,
        permissionRead: DailyShopPermissionRead,
        permissionWrite: DailyShopPermissionWrite,
        value: dailyShop,
        userId: context.userId,
    };
    try {
        nk.storageWrite([write]);
    }
    catch (error) {
        logger.error('storageWrite error: %q', error);
        throw error;
    }
    return JSON.stringify(dailyShop);
}
function rpcWatchQuestAds(context, logger, nk, payload) {
    if (!context.userId) {
        throw Error('No user ID in context');
    }
    incrementQuest(context.userId, QuestIds.WATCH_AD, 1, nk, logger);
}
const SYSTEM_USER_ID = "00000000-0000-0000-0000-000000000000";
const FRIEND_CODE_COLLECTION = "system";
const FRIEND_CODE_KEY = "friend_code_counter";
const DefaultMetadata = {
    battle_pass: false,
    updated_nickname: false,
    area: 0,
    win: 0,
    loose: 0,
    blast_catched: 0,
    blast_defeated: 0,
    pveBattleButtonAds: false,
    pvpBattleButtonAds: false,
};
function afterAuthenticate(ctx, logger, nk, data) {
    createDailyQuestStorageIfNeeded(ctx.userId, nk, logger);
    incrementQuest(ctx.userId, QuestIds.LOGIN, 1, nk, logger);
    if (!data.created) {
        logger.info('User with id: %s account data already existing', ctx.userId);
        return;
    }
    let user_id = ctx.userId;
    let username = "Player_" + generateFriendCode(nk);
    try {
        nk.accountUpdateId(user_id, username, null, null, null, null, null, DefaultMetadata);
    }
    catch (error) {
        logger.error('Error init update account : %s', error);
    }
    storeUserWallet(nk, user_id, DefaultWallet, logger);
    const writeBlasts = {
        collection: DeckCollectionName,
        key: DeckCollectionKey,
        permissionRead: DeckPermissionRead,
        permissionWrite: DeckPermissionWrite,
        value: defaultBlastCollection(nk, logger, ctx.userId),
        userId: ctx.userId,
    };
    try {
        nk.storageWrite([writeBlasts]);
    }
    catch (error) {
        logger.error('storageWrite error: %q', error);
        throw error;
    }
    const writeItems = {
        collection: BagCollectionName,
        key: BagCollectionKey,
        permissionRead: BagPermissionRead,
        permissionWrite: BagPermissionWrite,
        value: defaultItemsCollection(nk, logger, ctx.userId),
        userId: ctx.userId,
    };
    try {
        nk.storageWrite([writeItems]);
    }
    catch (error) {
        logger.error('storageWrite error: %q', error);
        throw error;
    }
    initializeBlastTrackerData(ctx.userId, nk, logger);
    markMonsterCaptured(ctx.userId, Lizzy.id.toString(), 1, nk, logger);
    markMonsterCaptured(ctx.userId, Punchball.id.toString(), 1, nk, logger);
    markMonsterCaptured(ctx.userId, Jellys.id.toString(), 1, nk, logger);
    logger.debug('new user id: %s account data initialised', ctx.userId);
}
function rpcDeleteAccount(ctx, logger, nk) {
    if (!ctx.userId) {
        throw new Error("Authentication required.");
    }
    nk.accountDeleteId(ctx.userId);
    return JSON.stringify({ success: true, message: "Account deleted." });
}
;
// region Metadata
function rpcUpdateNicknameStatus(ctx, logger, nk) {
    const account = nk.accountGetId(ctx.userId);
    const metadata = account.user.metadata;
    metadata.updated_nickname = true;
    nk.accountUpdateId(ctx.userId, null, null, null, null, null, null, metadata);
    try {
        const leaderboardsList = nk.leaderboardList(100);
        if (leaderboardsList.leaderboards && Array.isArray(leaderboardsList.leaderboards)) {
            for (const lb of leaderboardsList.leaderboards) {
                nk.leaderboardRecordWrite(lb.id, ctx.userId, account.user.username, 0, // score
                0, // subscore
                undefined, "set" /* nkruntime.OverrideOperator.SET */);
            }
        }
    }
    catch (e) {
        logger.error("Failed to write initial leaderboard scores: %s", e);
    }
}
function incrementMetadataStat(nk, userId, statKey, increment) {
    const account = nk.accountGetId(userId);
    const metadata = account.user.metadata;
    metadata[statKey] = metadata[statKey] + increment;
    nk.accountUpdateId(userId, "", null, null, null, null, null, metadata);
}
function setMetadataStat(nk, userId, statKey, value) {
    const account = nk.accountGetId(userId);
    const metadata = account.user.metadata;
    metadata[statKey] = value;
    nk.accountUpdateId(userId, "", null, null, null, null, null, metadata);
}
function getMetadataStat(nk, userId, statKey) {
    const account = nk.accountGetId(userId);
    const metadata = account.user.metadata;
    return metadata[statKey];
}
// endregion Metadata
function generateFriendCode(nk) {
    let counter = 1;
    try {
        const result = nk.storageRead([
            {
                collection: FRIEND_CODE_COLLECTION,
                key: FRIEND_CODE_KEY,
                userId: SYSTEM_USER_ID
            }
        ]);
        if (result.length > 0) {
            counter = parseInt(result[0].value.counter) + 1;
        }
    }
    catch (e) {
        counter = 1;
    }
    nk.storageWrite([
        {
            collection: FRIEND_CODE_COLLECTION,
            key: FRIEND_CODE_KEY,
            userId: SYSTEM_USER_ID,
            value: { counter: counter },
            permissionRead: 0,
            permissionWrite: 0
        }
    ]);
    const friendCode = counter.toString().padStart(8, "0");
    return friendCode;
}
function rpcCalculateAttackDamage(context, logger, nk, payload) {
    const userId = context.userId;
    if (!userId) {
        throw new Error("User not authenticated");
    }
    const raw = JSON.parse(payload);
    const params = {
        attackerLevel: raw.attackerLevel,
        attackerAttack: raw.attackerAttack,
        defenderDefense: raw.defenderDefense,
        attackType: parseEnum(raw.attackType, Type),
        defenderType: parseEnum(raw.defenderType, Type),
        movePower: raw.movePower,
        meteo: parseEnum(raw.meteo, Meteo),
    };
    var result = calculateDamage(params.attackerLevel, params.attackerAttack, params.defenderDefense, params.attackType, params.defenderType, params.movePower, params.meteo, logger);
    return JSON.stringify(result);
}
function rpcCalculateExpGain(context, logger, nk, payload) {
    const userId = context.userId;
    if (!userId) {
        throw new Error("User not authenticated");
    }
    const raw = JSON.parse(payload);
    const params = {
        expYield: raw.expYield,
        enemyLevel: raw.enemyLevel,
        yourLevel: raw.yourLevel,
    };
    var result = calculateExperienceGain(params.expYield, params.enemyLevel, params.yourLevel);
    return JSON.stringify(result);
}
function rpcCalculateLevelFromExp(context, logger, nk, payload) {
    const userId = context.userId;
    if (!userId) {
        throw new Error("User not authenticated");
    }
    const raw = JSON.parse(payload);
    var result = calculateLevelFromExperience(raw);
    return JSON.stringify(result);
}
function rpcCalculateExpFromLevel(context, logger, nk, payload) {
    const userId = context.userId;
    if (!userId) {
        throw new Error("User not authenticated");
    }
    const raw = JSON.parse(payload);
    var result = calculateExperienceFromLevel(raw);
    return JSON.stringify(result);
}
function rpcCalculateBlastStat(context, logger, nk, payload) {
    const userId = context.userId;
    if (!userId) {
        throw new Error("User not authenticated");
    }
    const raw = JSON.parse(payload);
    const params = {
        baseStat: raw.baseStat,
        iv: raw.iv,
        level: raw.level,
    };
    var result = calculateBlastStat(params.baseStat, params.iv, params.level);
    return JSON.stringify(result);
}
function rpcCalculateBlastHP(context, logger, nk, payload) {
    const userId = context.userId;
    if (!userId) {
        throw new Error("User not authenticated");
    }
    const raw = JSON.parse(payload);
    const params = {
        baseStat: raw.baseStat,
        iv: raw.iv,
        level: raw.level,
    };
    var result = calculateBlastHp(params.baseStat, params.iv, params.level);
    return JSON.stringify(result);
}
function rpcCalculateBlastMana(context, logger, nk, payload) {
    const userId = context.userId;
    if (!userId) {
        throw new Error("User not authenticated");
    }
    const raw = JSON.parse(payload);
    const params = {
        baseStat: raw.baseStat,
        iv: raw.iv,
        level: raw.level,
    };
    var result = calculateBlastMana(params.baseStat, params.iv, params.level);
    return JSON.stringify(result);
}
function calculateBlastStat(baseStat, iv, level) {
    return Math.floor(((baseStat + iv) * level) / 100) + 5;
}
function calculateBlastHp(baseHp, iv, level) {
    return Math.floor(((baseHp + iv) * level) / 100) + level + 10;
}
function calculateBlastMana(baseMana, iv, level) {
    return Math.floor(((baseMana + iv) * level) / 100) + 10;
}
function calculateLevelFromExperience(experience) {
    if (experience < 0) {
        throw new Error("L'expérience totale ne peut pas être négative.");
    }
    return Math.floor(Math.cbrt(experience));
}
function calculateExperienceFromLevel(level) {
    if (level < 1 || level > 100) {
        throw new Error("Le niveau doit être compris entre 1 et 100. Le level : " + level);
    }
    return Math.pow(level, 3);
}
function calculateExperienceGain(expYield, enemyLevel, yourLevel) {
    const experience = Math.floor(((expYield * enemyLevel / 7) * ((2 * enemyLevel + 10) / (enemyLevel + yourLevel + 10)) + 1));
    return experience;
}
function getRandomActiveMoveset(blastData, exp) {
    const availableMoves = blastData.movepool
        .filter(m => calculateLevelFromExperience(exp) >= m.levelMin)
        .map(m => m.move_id);
    const shuffledMoves = shuffleArray(availableMoves);
    const randomMoveset = shuffledMoves.slice(0, 4);
    return randomMoveset;
}
function ConvertBlastToBlastEntity(blast) {
    const blastEntity = new BlastEntity(blast.uuid, blast.data_id, blast.exp, blast.iv, blast.boss, blast.shiny, blast.activeMoveset);
    return blastEntity;
}
// region Utils
function clamp(value, min, max) {
    return Math.min(Math.max(value, min), max);
}
function getRandomNumber(min, max) {
    const minCeiled = Math.ceil(min);
    const maxFloored = Math.floor(max);
    return Math.floor(Math.random() * (maxFloored - minCeiled + 1)) + minCeiled;
}
function randomElement(array) {
    const randomIndex = Math.floor(Math.random() * array.length);
    return array[randomIndex];
}
function shuffleArray(array) {
    for (let i = array.length - 1; i > 0; i--) {
        const j = Math.floor(Math.random() * (i + 1));
        [array[i], array[j]] = [array[j], array[i]];
    }
    return array;
}
function msecToSec(n) {
    return Math.floor(n / 1000);
}
function isDailyResetDue(lastResetUnix) {
    if (!lastResetUnix)
        lastResetUnix = 0;
    const now = new Date();
    now.setHours(0, 0, 0, 0);
    return lastResetUnix < msecToSec(now.getTime());
}
function getBlastVersion(blast) {
    if (blast.shiny) {
        return 3;
    }
    else if (blast.boss) {
        return 2;
    }
    else {
        return 1;
    }
}
function parseEnum(value, enumObj) {
    const enumValue = enumObj[value];
    if (typeof enumValue === "number")
        return enumValue;
    throw new Error(`Invalid enum value '${value}' for enum ${JSON.stringify(enumObj)}`);
}
var Currency;
(function (Currency) {
    Currency[Currency["None"] = 0] = "None";
    Currency["Coins"] = "Coins";
    Currency["Gems"] = "Gems";
    Currency["Trophies"] = "Trophies";
    Currency["Hard"] = "Hard";
})(Currency || (Currency = {}));
;
var notificationOpCodes;
(function (notificationOpCodes) {
    notificationOpCodes[notificationOpCodes["CURENCY"] = 1000] = "CURENCY";
    notificationOpCodes[notificationOpCodes["BLAST"] = 1010] = "BLAST";
    notificationOpCodes[notificationOpCodes["ITEM"] = 1020] = "ITEM";
})(notificationOpCodes || (notificationOpCodes = {}));
let DefaultWallet = {
    [Currency.Coins]: 1000,
    [Currency.Gems]: 100,
    [Currency.Trophies]: 0,
};
function storeUserWallet(nk, user_id, changeset, logger) {
    try {
        nk.walletUpdate(user_id, changeset);
    }
    catch (error) {
        logger.error('Error storing wallet of player : %s', user_id);
    }
}
function updateWalletWithCurrency(nk, userId, currencyKeyName, amount) {
    const changeset = {
        [currencyKeyName]: amount,
    };
    let result = nk.walletUpdate(userId, changeset);
    return result;
}
function getCurrencyInWallet(nk, userId, currencyKeyName) {
    var amountToReturn = 0;
    try {
        let results = nk.walletLedgerList(userId);
        switch (currencyKeyName) {
            case Currency.Coins:
                amountToReturn = results.items[0].changeset[Currency.Coins];
                break;
            case Currency.Gems:
                amountToReturn = results.items[0].changeset[Currency.Gems];
                break;
            case Currency.Trophies:
                amountToReturn = results.items[0].changeset[Currency.Trophies];
                break;
        }
        return amountToReturn;
    }
    catch (error) {
        // Handle error
    }
    return amountToReturn;
}
var AttackType;
(function (AttackType) {
    AttackType[AttackType["None"] = 0] = "None";
    AttackType[AttackType["Normal"] = 1] = "Normal";
    AttackType[AttackType["Status"] = 2] = "Status";
    AttackType[AttackType["Special"] = 3] = "Special";
})(AttackType || (AttackType = {}));
var Target;
(function (Target) {
    Target[Target["None"] = 0] = "None";
    Target[Target["Opponent"] = 1] = "Opponent";
    Target[Target["Self"] = 2] = "Self";
})(Target || (Target = {}));
var MoveEffect;
(function (MoveEffect) {
    MoveEffect[MoveEffect["None"] = 0] = "None";
    MoveEffect[MoveEffect["Burn"] = 460] = "Burn";
    MoveEffect[MoveEffect["Seeded"] = 461] = "Seeded";
    MoveEffect[MoveEffect["Wet"] = 462] = "Wet";
    MoveEffect[MoveEffect["ManaExplosion"] = 463] = "ManaExplosion";
    MoveEffect[MoveEffect["HpExplosion"] = 464] = "HpExplosion";
    MoveEffect[MoveEffect["ManaRestore"] = 465] = "ManaRestore";
    MoveEffect[MoveEffect["HpRestore"] = 466] = "HpRestore";
    MoveEffect[MoveEffect["AttackBoost"] = 467] = "AttackBoost";
    MoveEffect[MoveEffect["DefenseBoost"] = 468] = "DefenseBoost";
    MoveEffect[MoveEffect["SpeedBoost"] = 469] = "SpeedBoost";
    MoveEffect[MoveEffect["AttackReduce"] = 470] = "AttackReduce";
    MoveEffect[MoveEffect["DefenseReduce"] = 471] = "DefenseReduce";
    MoveEffect[MoveEffect["SpeedReduce"] = 472] = "SpeedReduce";
    MoveEffect[MoveEffect["Cleanse"] = 473] = "Cleanse";
    MoveEffect[MoveEffect["Combo"] = 474] = "Combo";
})(MoveEffect || (MoveEffect = {}));
//#region Normal
const Tackle = {
    id: 1,
    type: Type.Normal,
    attackType: AttackType.Normal,
    target: Target.Opponent,
    power: 40,
    cost: 7,
    priority: 0,
    effects: [],
};
const Punch = {
    id: 2,
    type: Type.Normal,
    attackType: AttackType.Normal,
    target: Target.Opponent,
    power: 50,
    cost: 10,
    priority: 0,
    effects: [],
};
const Stomp = {
    id: 3,
    type: Type.Normal,
    attackType: AttackType.Normal,
    target: Target.Opponent,
    power: 65,
    cost: 15,
    priority: 0,
    effects: [],
};
const Slam = {
    id: 4,
    type: Type.Normal,
    attackType: AttackType.Special,
    target: Target.Opponent,
    power: 80,
    cost: 1,
    priority: 0,
    effects: [
        { effect: MoveEffect.HpExplosion, effectModifier: 0, effectTarget: Target.Opponent },
    ],
};
const Claw = {
    id: 5,
    type: Type.Normal,
    attackType: AttackType.Normal,
    target: Target.Opponent,
    power: 30,
    cost: 5,
    priority: 0,
    effects: [],
};
const ClawCombo = {
    id: 6,
    type: Type.Normal,
    attackType: AttackType.Normal,
    target: Target.Opponent,
    power: 20,
    cost: 7,
    priority: 0,
    effects: [
        { effect: MoveEffect.Combo, effectModifier: 0, effectTarget: Target.Opponent },
    ],
};
const Slash = {
    id: 7,
    type: Type.Normal,
    attackType: AttackType.Normal,
    target: Target.Opponent,
    power: 60,
    cost: 10,
    priority: 0,
    effects: [],
};
const Cut = {
    id: 8,
    type: Type.Normal,
    attackType: AttackType.Normal,
    target: Target.Opponent,
    power: 80,
    cost: 13,
    priority: 0,
    effects: [],
};
const QuickAttack = {
    id: 9,
    type: Type.Normal,
    attackType: AttackType.Normal,
    target: Target.Opponent,
    power: 30,
    cost: 6,
    priority: 2,
    effects: [],
};
const Growl = {
    id: 10,
    type: Type.Normal,
    attackType: AttackType.Status,
    target: Target.Opponent,
    power: 0,
    cost: 5,
    priority: 0,
    effects: [
        { effect: MoveEffect.AttackReduce, effectModifier: 1, effectTarget: Target.Opponent },
    ],
};
const Harden = {
    id: 11,
    type: Type.Normal,
    attackType: AttackType.Status,
    target: Target.Self,
    power: 0,
    cost: 6,
    priority: 0,
    effects: [
        { effect: MoveEffect.DefenseBoost, effectModifier: 2, effectTarget: Target.Self },
    ],
};
const WarmUp = {
    id: 12,
    type: Type.Normal,
    attackType: AttackType.Status,
    target: Target.Self,
    power: 0,
    cost: 10,
    priority: 0,
    effects: [
        { effect: MoveEffect.SpeedBoost, effectModifier: 2, effectTarget: Target.Self },
    ],
};
const Taunt = {
    id: 13,
    type: Type.Normal,
    attackType: AttackType.Status,
    target: Target.Opponent,
    power: 0,
    cost: 10,
    priority: 0,
    effects: [
        { effect: MoveEffect.AttackBoost, effectModifier: 1, effectTarget: Target.Opponent },
        { effect: MoveEffect.DefenseReduce, effectModifier: 1, effectTarget: Target.Opponent },
    ],
};
const Cleanse = {
    id: 14,
    type: Type.Normal,
    attackType: AttackType.Status,
    target: Target.Self,
    power: 0,
    cost: 0,
    priority: 0,
    effects: [
        { effect: MoveEffect.Cleanse, effectModifier: 0, effectTarget: Target.Self },
    ],
};
const Focus = {
    id: 15,
    type: Type.Normal,
    attackType: AttackType.Status,
    target: Target.Self,
    power: 0,
    cost: 0,
    priority: 0,
    effects: [
        { effect: MoveEffect.AttackBoost, effectModifier: 2, effectTarget: Target.Self },
    ],
};
//#region Fire
const Ember = {
    id: 101,
    type: Type.Fire,
    attackType: AttackType.Normal,
    target: Target.Opponent,
    power: 50,
    cost: 5,
    priority: 0,
    effects: [
        { effect: MoveEffect.Burn, effectModifier: 0, effectTarget: Target.Opponent },
    ],
};
const FirePunch = {
    id: 102,
    type: Type.Fire,
    attackType: AttackType.Normal,
    target: Target.Opponent,
    power: 70,
    cost: 7,
    priority: 0,
    effects: [],
};
const Flamethrower = {
    id: 103,
    type: Type.Fire,
    attackType: AttackType.Special,
    target: Target.Opponent,
    power: 80,
    cost: 1,
    priority: 0,
    effects: [
        { effect: MoveEffect.AttackReduce, effectModifier: 1, effectTarget: Target.Opponent },
    ],
};
const FireBlast = {
    id: 104,
    type: Type.Fire,
    attackType: AttackType.Special,
    target: Target.Opponent,
    power: 110,
    cost: 2,
    priority: 0,
    effects: [
        { effect: MoveEffect.Burn, effectModifier: 0, effectTarget: Target.Opponent },
    ],
};
const FireWheel = {
    id: 105,
    type: Type.Fire,
    attackType: AttackType.Normal,
    target: Target.Opponent,
    power: 50,
    cost: 7,
    priority: 0,
    effects: [
        { effect: MoveEffect.Burn, effectModifier: 0, effectTarget: Target.Opponent },
    ],
};
const Nitro = {
    id: 106,
    type: Type.Fire,
    attackType: AttackType.Normal,
    target: Target.Opponent,
    power: 60,
    cost: 12,
    priority: 1,
    effects: [
        { effect: MoveEffect.SpeedBoost, effectModifier: 1, effectTarget: Target.Self },
    ],
};
const Scald = {
    id: 107,
    type: Type.Fire,
    attackType: AttackType.Special,
    target: Target.Opponent,
    power: 80,
    cost: 1,
    priority: 0,
    effects: [
        { effect: MoveEffect.Burn, effectModifier: 0, effectTarget: Target.Opponent },
    ],
};
const FlareBlitz = {
    id: 108,
    type: Type.Fire,
    attackType: AttackType.Special,
    target: Target.Opponent,
    power: 110,
    cost: 2,
    priority: 0,
    effects: [
        { effect: MoveEffect.Burn, effectModifier: 0, effectTarget: Target.Opponent },
    ],
};
const FireClaw = {
    id: 109,
    type: Type.Fire,
    attackType: AttackType.Normal,
    target: Target.Opponent,
    power: 100,
    cost: 15,
    priority: 0,
    effects: [
        { effect: MoveEffect.AttackBoost, effectModifier: 1, effectTarget: Target.Self },
    ],
};
const OverHeat = {
    id: 110,
    type: Type.Fire,
    attackType: AttackType.Status,
    target: Target.Self,
    power: 0,
    cost: 10,
    priority: 0,
    effects: [
        { effect: MoveEffect.AttackBoost, effectModifier: 2, effectTarget: Target.Self },
    ],
};
const Heatwave = {
    id: 111,
    type: Type.Fire,
    attackType: AttackType.Status,
    target: Target.Self,
    power: 0,
    cost: 10,
    priority: 0,
    effects: [
        { effect: MoveEffect.DefenseReduce, effectModifier: 2, effectTarget: Target.Opponent },
    ],
};
const Combustion = {
    id: 112,
    type: Type.Fire,
    attackType: AttackType.Status,
    target: Target.Self,
    power: 0,
    cost: 10,
    priority: 0,
    effects: [
        { effect: MoveEffect.SpeedBoost, effectModifier: 2, effectTarget: Target.Self },
    ],
};
//#region Water
const AquaJet = {
    id: 201,
    type: Type.Water,
    attackType: AttackType.Normal,
    target: Target.Opponent,
    power: 50,
    cost: 6,
    priority: 0,
    effects: [
        { effect: MoveEffect.SpeedBoost, effectModifier: 1, effectTarget: Target.Self },
    ],
};
const HydroTail = {
    id: 202,
    type: Type.Water,
    attackType: AttackType.Normal,
    target: Target.Opponent,
    power: 65,
    cost: 8,
    priority: 0,
    effects: [],
};
const Waterfall = {
    id: 203,
    type: Type.Water,
    attackType: AttackType.Special,
    target: Target.Opponent,
    power: 80,
    cost: 1,
    priority: 0,
    effects: [
        { effect: MoveEffect.SpeedBoost, effectModifier: 1, effectTarget: Target.Self },
    ],
};
const HydroBlast = {
    id: 204,
    type: Type.Water,
    attackType: AttackType.Special,
    target: Target.Opponent,
    power: 110,
    cost: 2,
    priority: 0,
    effects: [
        { effect: MoveEffect.Wet, effectModifier: 0, effectTarget: Target.Opponent },
    ],
};
const Bubble = {
    id: 205,
    type: Type.Water,
    attackType: AttackType.Normal,
    target: Target.Opponent,
    power: 50,
    cost: 6,
    priority: 0,
    effects: [],
};
const BubbleBeam = {
    id: 206,
    type: Type.Water,
    attackType: AttackType.Normal,
    target: Target.Opponent,
    power: 65,
    cost: 10,
    priority: 0,
    effects: [],
};
const Surf = {
    id: 207,
    type: Type.Water,
    attackType: AttackType.Special,
    target: Target.Opponent,
    power: 80,
    cost: 1,
    priority: 0,
    effects: [
        { effect: MoveEffect.SpeedBoost, effectModifier: 1, effectTarget: Target.Self },
    ],
};
const HydroCannon = {
    id: 208,
    type: Type.Water,
    attackType: AttackType.Special,
    target: Target.Opponent,
    power: 110,
    cost: 2,
    priority: 0,
    effects: [
        { effect: MoveEffect.Wet, effectModifier: 0, effectTarget: Target.Opponent },
    ],
};
const AquaClaw = {
    id: 209,
    type: Type.Water,
    attackType: AttackType.Normal,
    target: Target.Opponent,
    power: 100,
    cost: 15,
    priority: 0,
    effects: [
        { effect: MoveEffect.SpeedBoost, effectModifier: 1, effectTarget: Target.Self },
    ],
};
const AquaBoost = {
    id: 210,
    type: Type.Water,
    attackType: AttackType.Status,
    target: Target.Self,
    power: 0,
    cost: 10,
    priority: 0,
    effects: [
        { effect: MoveEffect.AttackBoost, effectModifier: 2, effectTarget: Target.Self },
    ],
};
const AquaWall = {
    id: 211,
    type: Type.Water,
    attackType: AttackType.Status,
    target: Target.Self,
    power: 0,
    cost: 10,
    priority: 0,
    effects: [
        { effect: MoveEffect.DefenseBoost, effectModifier: 2, effectTarget: Target.Self },
    ],
};
const Splash = {
    id: 212,
    type: Type.Water,
    attackType: AttackType.Status,
    target: Target.Self,
    power: 0,
    cost: 10,
    priority: 0,
    effects: [
        { effect: MoveEffect.SpeedReduce, effectModifier: 2, effectTarget: Target.Opponent },
    ],
};
const Aquagym = {
    id: 213,
    type: Type.Water,
    attackType: AttackType.Status,
    target: Target.Self,
    power: 0,
    cost: 10,
    priority: 0,
    effects: [
        { effect: MoveEffect.SpeedBoost, effectModifier: 2, effectTarget: Target.Self },
    ],
};
//#region Grass
const Leafs = {
    id: 301,
    type: Type.Grass,
    attackType: AttackType.Normal,
    target: Target.Opponent,
    power: 50,
    cost: 4,
    priority: 0,
    effects: [
        { effect: MoveEffect.Seeded, effectModifier: 0, effectTarget: Target.Opponent },
    ],
};
const RazorLeaf = {
    id: 302,
    type: Type.Grass,
    attackType: AttackType.Normal,
    target: Target.Opponent,
    power: 75,
    cost: 7,
    priority: 0,
    effects: [
        { effect: MoveEffect.DefenseReduce, effectModifier: 1, effectTarget: Target.Opponent },
    ],
};
const VineWhip = {
    id: 303,
    type: Type.Grass,
    attackType: AttackType.Special,
    target: Target.Opponent,
    power: 75,
    cost: 1,
    priority: 0,
    effects: [
        { effect: MoveEffect.Seeded, effectModifier: 0, effectTarget: Target.Opponent },
    ],
};
const GrassKnot = {
    id: 304,
    type: Type.Grass,
    attackType: AttackType.Special,
    target: Target.Opponent,
    power: 100,
    cost: 2,
    priority: 0,
    effects: [
        { effect: MoveEffect.SpeedReduce, effectModifier: 2, effectTarget: Target.Opponent },
    ],
};
const FlowerStorm = {
    id: 305,
    type: Type.Grass,
    attackType: AttackType.Special,
    target: Target.Opponent,
    power: 150,
    cost: 3,
    priority: 0,
    effects: [
        { effect: MoveEffect.None, effectModifier: 0, effectTarget: Target.None },
    ],
};
const GreenTempest = {
    id: 306,
    type: Type.Grass,
    attackType: AttackType.Special,
    target: Target.Opponent,
    power: 50,
    cost: 3,
    priority: 0,
    effects: [
        { effect: MoveEffect.Combo, effectModifier: 0, effectTarget: Target.Opponent },
    ],
};
const MagikLeafs = {
    id: 307,
    type: Type.Grass,
    attackType: AttackType.Normal,
    target: Target.Opponent,
    power: 50,
    cost: 7,
    priority: 0,
    effects: [
        { effect: MoveEffect.Seeded, effectModifier: 0, effectTarget: Target.Opponent },
    ],
};
const EcoSphere = {
    id: 308,
    type: Type.Grass,
    attackType: AttackType.Special,
    target: Target.Opponent,
    power: 80,
    cost: 1,
    priority: 0,
    effects: [
        { effect: MoveEffect.DefenseBoost, effectModifier: 1, effectTarget: Target.Self },
    ],
};
const SolarBeam = {
    id: 309,
    type: Type.Grass,
    attackType: AttackType.Special,
    target: Target.Opponent,
    power: 120,
    cost: 2,
    priority: 0,
    effects: [
        { effect: MoveEffect.Seeded, effectModifier: 0, effectTarget: Target.Opponent },
    ],
};
const GrassClaw = {
    id: 310,
    type: Type.Grass,
    attackType: AttackType.Normal,
    target: Target.Opponent,
    power: 100,
    cost: 15,
    priority: 0,
    effects: [
        { effect: MoveEffect.DefenseBoost, effectModifier: 1, effectTarget: Target.Self },
    ],
};
const Growth = {
    id: 311,
    type: Type.Grass,
    attackType: AttackType.Status,
    target: Target.Self,
    power: 0,
    cost: 10,
    priority: 0,
    effects: [
        { effect: MoveEffect.AttackBoost, effectModifier: 2, effectTarget: Target.Self },
    ],
};
const Roots = {
    id: 312,
    type: Type.Grass,
    attackType: AttackType.Status,
    target: Target.Self,
    power: 0,
    cost: 10,
    priority: 0,
    effects: [
        { effect: MoveEffect.DefenseBoost, effectModifier: 2, effectTarget: Target.Self },
    ],
};
const Spore = {
    id: 313,
    type: Type.Grass,
    attackType: AttackType.Status,
    target: Target.Opponent,
    power: 0,
    cost: 10,
    priority: 0,
    effects: [
        { effect: MoveEffect.DefenseReduce, effectModifier: 2, effectTarget: Target.Opponent },
    ],
};
function getMoveById(id) {
    const move = movePedia.find((move) => move.id === id);
    if (!move) {
        throw new Error(`No Move found with ID: ${id}`);
    }
    return move;
}
function getMovesByIds(ids) {
    return ids.map(id => getMoveById(id));
}
const movePedia = [
    Tackle, Punch, Stomp, Slam,
    Claw, ClawCombo, Slash, Cut,
    QuickAttack,
    Growl, Harden, Focus, WarmUp, Taunt, Cleanse,
    Ember, FirePunch, Flamethrower, FireBlast,
    FireWheel, Nitro, Scald, FlareBlitz,
    FireClaw,
    OverHeat, Heatwave, Combustion,
    AquaJet, HydroTail, Waterfall, HydroBlast,
    Bubble, BubbleBeam, Surf, HydroCannon,
    AquaClaw,
    AquaBoost, AquaWall, Splash, Aquagym,
    Leafs, RazorLeaf, VineWhip, GrassKnot, FlowerStorm, GreenTempest,
    MagikLeafs, EcoSphere, SolarBeam,
    GrassClaw,
    Growth, Roots, Spore,
];
const rpcLoadMovePedia = function (ctx, logger, nk) {
    return JSON.stringify(movePedia);
};
var ITEM_BEHAVIOUR;
(function (ITEM_BEHAVIOUR) {
    ITEM_BEHAVIOUR[ITEM_BEHAVIOUR["None"] = 0] = "None";
    ITEM_BEHAVIOUR[ITEM_BEHAVIOUR["Heal"] = 1] = "Heal";
    ITEM_BEHAVIOUR[ITEM_BEHAVIOUR["Mana"] = 2] = "Mana";
    ITEM_BEHAVIOUR[ITEM_BEHAVIOUR["Status"] = 3] = "Status";
    ITEM_BEHAVIOUR[ITEM_BEHAVIOUR["Catch"] = 4] = "Catch";
})(ITEM_BEHAVIOUR || (ITEM_BEHAVIOUR = {}));
;
const potionData = {
    id: 0,
    behaviour: ITEM_BEHAVIOUR.Heal,
    gain_amount: 20,
    rarity: Rarity.Common,
};
const superPotionData = {
    id: 1,
    behaviour: ITEM_BEHAVIOUR.Heal,
    gain_amount: 50,
    rarity: Rarity.Uncommon,
};
const hyperPotionData = {
    id: 2,
    behaviour: ITEM_BEHAVIOUR.Heal,
    gain_amount: 200,
    rarity: Rarity.Rare,
};
const elixirData = {
    id: 3,
    behaviour: ITEM_BEHAVIOUR.Mana,
    gain_amount: 10,
    rarity: Rarity.Common,
};
const superElixirData = {
    id: 4,
    behaviour: ITEM_BEHAVIOUR.Mana,
    gain_amount: 25,
    rarity: Rarity.Uncommon,
};
const hyperElixirData = {
    id: 5,
    behaviour: ITEM_BEHAVIOUR.Mana,
    gain_amount: 50,
    rarity: Rarity.Rare,
};
const blastTrapData = {
    id: 6,
    behaviour: ITEM_BEHAVIOUR.Catch,
    gain_amount: 0,
    catchRate: 1,
    rarity: Rarity.Common,
};
const superBlastTrapData = {
    id: 7,
    behaviour: ITEM_BEHAVIOUR.Catch,
    gain_amount: 0,
    catchRate: 1.5,
    rarity: Rarity.Common,
};
const hyperBlastTrapData = {
    id: 8,
    behaviour: ITEM_BEHAVIOUR.Catch,
    gain_amount: 0,
    catchRate: 2,
    rarity: Rarity.Common,
};
const AntiBurnData = {
    id: 9,
    behaviour: ITEM_BEHAVIOUR.Status,
    gain_amount: 0,
    status: Status.Burn,
    rarity: Rarity.Common,
};
const AntiSeededData = {
    id: 10,
    behaviour: ITEM_BEHAVIOUR.Status,
    gain_amount: 0,
    status: Status.Seeded,
    rarity: Rarity.Common,
};
const AntiWetData = {
    id: 11,
    behaviour: ITEM_BEHAVIOUR.Status,
    gain_amount: 0,
    status: Status.Wet,
    rarity: Rarity.Common,
};
const itemPedia = [
    potionData,
    superPotionData,
    hyperPotionData,
    elixirData,
    superElixirData,
    hyperElixirData,
    blastTrapData,
    superBlastTrapData,
    hyperBlastTrapData,
];
function getItemDataById(id) {
    const item = itemPedia.find((item) => item.id === id);
    if (!item) {
        throw new Error(`No Item found with ID: ${id}`);
    }
    return item;
}
const rpcLoadItemPedia = function (ctx, logger, nk) {
    return JSON.stringify(itemPedia);
};
function getRandomItem(amount) {
    const randomIndex = Math.floor(Math.random() * itemPedia.length);
    let newItem = {
        data_id: itemPedia[randomIndex].id,
        amount: amount,
    };
    return newItem;
}
function getDeckItem(nk, logger, userId) {
    let userCards;
    userCards = loadUserItems(nk, logger, userId);
    return userCards.deckItems;
}
const MinIV = 1;
const MaxIV = 31;
class BlastEntity {
    constructor(uuid, data_id, exp, iv, boss, shiny, moveset) {
        this.uuid = uuid;
        this.data_id = data_id;
        this.exp = exp;
        this.iv = iv;
        this.boss = boss;
        this.shiny = shiny;
        this.activeMoveset = moveset;
        this.modifiers = [];
        this.status = Status.None;
        this.level = calculateLevelFromExperience(this.exp);
        this.maxHp = calculateBlastHp(getBlastDataById(this.data_id).hp, this.iv, this.level);
        this.hp = this.maxHp;
        this.maxMana = calculateBlastMana(getBlastDataById(this.data_id).mana, this.iv, this.level);
        this.mana = this.maxMana;
        this.attack = calculateBlastStat(getBlastDataById(this.data_id).attack, this.iv, this.level);
        this.defense = calculateBlastStat(getBlastDataById(this.data_id).defense, this.iv, this.level);
        this.speed = calculateBlastStat(getBlastDataById(this.data_id).speed, this.iv, this.level);
    }
}
// BlastData
const Pantin = {
    id: 0,
    type: Type.Normal,
    hp: 80, mana: 75, attack: 70, defense: 65, speed: 60,
    movepool: [
        { move_id: Tackle.id, levelMin: 0 },
        { move_id: Punch.id, levelMin: 3 },
        { move_id: Stomp.id, levelMin: 6 },
        { move_id: Slam.id, levelMin: 9 },
        { move_id: Claw.id, levelMin: 12 },
        { move_id: ClawCombo.id, levelMin: 15 },
        { move_id: Slash.id, levelMin: 18 },
        { move_id: Cut.id, levelMin: 21 },
    ],
    nextEvolution: null, catchRate: 30, expYield: 64, rarity: Rarity.Common,
};
const Lizzy = {
    id: 1,
    type: Type.Grass,
    hp: 70, mana: 80, attack: 75, defense: 70, speed: 65,
    movepool: [
        { move_id: Claw.id, levelMin: 0 },
        { move_id: Leafs.id, levelMin: 2 },
        { move_id: Growth.id, levelMin: 4 },
        { move_id: RazorLeaf.id, levelMin: 6 },
        { move_id: VineWhip.id, levelMin: 8 },
        { move_id: Roots.id, levelMin: 10 },
        { move_id: GrassKnot.id, levelMin: 12 },
        { move_id: FlowerStorm.id, levelMin: 16 },
        { move_id: GreenTempest.id, levelMin: 20 },
        { move_id: MagikLeafs.id, levelMin: 24 },
        { move_id: EcoSphere.id, levelMin: 28 },
        { move_id: SolarBeam.id, levelMin: 32 },
    ],
    nextEvolution: null, catchRate: 35, expYield: 128, rarity: Rarity.Rare,
};
const Punchball = {
    id: 2,
    type: Type.Fire,
    hp: 85, mana: 70, attack: 80, defense: 75, speed: 60,
    movepool: [
        { move_id: Ember.id, levelMin: 0 },
        { move_id: OverHeat.id, levelMin: 2 },
        { move_id: FirePunch.id, levelMin: 4 },
        { move_id: Flamethrower.id, levelMin: 8 },
        { move_id: FireBlast.id, levelMin: 12 },
        { move_id: FireWheel.id, levelMin: 16 },
        { move_id: Nitro.id, levelMin: 20 },
        { move_id: Scald.id, levelMin: 24 },
        { move_id: FlareBlitz.id, levelMin: 28 },
        { move_id: FireClaw.id, levelMin: 32 },
    ],
    nextEvolution: null, catchRate: 40, expYield: 128, rarity: Rarity.Rare,
};
const Jellys = {
    id: 3,
    type: Type.Water,
    hp: 75, mana: 85, attack: 70, defense: 65, speed: 80,
    movepool: [
        { move_id: AquaJet.id, levelMin: 0 },
        { move_id: AquaBoost.id, levelMin: 2 },
        { move_id: HydroTail.id, levelMin: 4 },
        { move_id: Waterfall.id, levelMin: 8 },
        { move_id: Aquagym.id, levelMin: 10 },
        { move_id: HydroBlast.id, levelMin: 12 },
        { move_id: Bubble.id, levelMin: 16 },
        { move_id: BubbleBeam.id, levelMin: 20 },
        { move_id: Surf.id, levelMin: 24 },
        { move_id: HydroCannon.id, levelMin: 28 },
    ],
    nextEvolution: null, catchRate: 25, expYield: 128, rarity: Rarity.Rare,
};
const Kitchi = {
    id: 4,
    type: Type.Normal,
    hp: 55, mana: 70, attack: 75, defense: 65, speed: 80,
    movepool: [
        { move_id: Claw.id, levelMin: 0 },
        { move_id: QuickAttack.id, levelMin: 2 },
        { move_id: Growl.id, levelMin: 4 },
        { move_id: Harden.id, levelMin: 6 },
        { move_id: ClawCombo.id, levelMin: 8 },
        { move_id: Cleanse.id, levelMin: 10 },
        { move_id: Slash.id, levelMin: 14 },
        { move_id: Cut.id, levelMin: 16 },
    ],
    nextEvolution: { id: 5, levelRequired: 7 }, catchRate: 30, expYield: 64, rarity: Rarity.Common,
};
const Kenchi = {
    id: 5,
    type: Type.Normal,
    hp: 50, mana: 70, attack: 80, defense: 70, speed: 65,
    movepool: [
        { move_id: Claw.id, levelMin: 0 },
        { move_id: QuickAttack.id, levelMin: 2 },
        { move_id: Growl.id, levelMin: 4 },
        { move_id: Harden.id, levelMin: 6 },
        { move_id: Cleanse.id, levelMin: 8 },
        { move_id: ClawCombo.id, levelMin: 12 },
        { move_id: Slash.id, levelMin: 14 },
        { move_id: Cut.id, levelMin: 16 },
    ],
    nextEvolution: null, catchRate: 35, expYield: 96, rarity: Rarity.Uncommon,
};
const Mousy = {
    id: 6,
    type: Type.Normal,
    hp: 50, mana: 75, attack: 75, defense: 70, speed: 80,
    movepool: [
        { move_id: Claw.id, levelMin: 0 },
        { move_id: QuickAttack.id, levelMin: 2 },
        { move_id: Growl.id, levelMin: 4 },
        { move_id: Harden.id, levelMin: 6 },
        { move_id: Cleanse.id, levelMin: 8 },
        { move_id: ClawCombo.id, levelMin: 12 },
        { move_id: Slash.id, levelMin: 14 },
        { move_id: Cut.id, levelMin: 16 },
    ],
    nextEvolution: null, catchRate: 40, expYield: 128, rarity: Rarity.Common,
};
const Clawball = {
    id: 7,
    type: Type.Ground,
    hp: 47, mana: 70, attack: 75, defense: 80, speed: 65,
    movepool: [
        { move_id: Claw.id, levelMin: 0 },
        { move_id: QuickAttack.id, levelMin: 2 },
        { move_id: Growl.id, levelMin: 4 },
        { move_id: Harden.id, levelMin: 6 },
        { move_id: Cleanse.id, levelMin: 8 },
        { move_id: ClawCombo.id, levelMin: 12 },
        { move_id: Slash.id, levelMin: 14 },
        { move_id: Cut.id, levelMin: 16 },
        { move_id: Stomp.id, levelMin: 20 },
        { move_id: Slam.id, levelMin: 22 },
        { move_id: Harden.id, levelMin: 26 },
        { move_id: Cleanse.id, levelMin: 32 },
    ],
    nextEvolution: null, catchRate: 45, expYield: 90, rarity: Rarity.Uncommon,
};
const Balt = {
    id: 8,
    type: Type.Fly,
    hp: 70, mana: 80, attack: 75, defense: 70, speed: 85,
    movepool: [
        { move_id: Tackle.id, levelMin: 0 },
        { move_id: QuickAttack.id, levelMin: 4 },
        { move_id: Stomp.id, levelMin: 8 },
        { move_id: Harden.id, levelMin: 12 },
    ],
    nextEvolution: null, catchRate: 50, expYield: 96, rarity: Rarity.Common,
};
const Stagpan = {
    id: 9,
    type: Type.Normal,
    hp: 75, mana: 70, attack: 80, defense: 65, speed: 70,
    movepool: [
        { move_id: Punch.id, levelMin: 0 },
        { move_id: Stomp.id, levelMin: 4 },
        { move_id: Slam.id, levelMin: 8 },
        { move_id: QuickAttack.id, levelMin: 12 },
    ],
    nextEvolution: null, catchRate: 30, expYield: 64, rarity: Rarity.Common,
};
const Botte = {
    id: 10,
    type: Type.Ground,
    hp: 80, mana: 75, attack: 70, defense: 85, speed: 65,
    movepool: [
        { move_id: Growl.id, levelMin: 0 },
        { move_id: Harden.id, levelMin: 4 },
        { move_id: Cleanse.id, levelMin: 8 },
        { move_id: Tackle.id, levelMin: 12 },
    ],
    nextEvolution: null, catchRate: 35, expYield: 128, rarity: Rarity.Rare,
};
const Booh = {
    id: 11,
    type: Type.Normal,
    hp: 70, mana: 75, attack: 65, defense: 70, speed: 80,
    movepool: [
        { move_id: Slash.id, levelMin: 0 },
        { move_id: Cut.id, levelMin: 4 },
        { move_id: Claw.id, levelMin: 8 },
        { move_id: ClawCombo.id, levelMin: 12 },
    ],
    nextEvolution: null, catchRate: 40, expYield: 128, rarity: Rarity.Uncommon,
};
const Ghoosto = {
    id: 12,
    type: Type.Normal,
    hp: 75, mana: 70, attack: 80, defense: 65, speed: 70,
    movepool: [
        { move_id: Punch.id, levelMin: 0 },
        { move_id: Slam.id, levelMin: 4 },
        { move_id: QuickAttack.id, levelMin: 8 },
        { move_id: Growl.id, levelMin: 12 },
    ],
    nextEvolution: null, catchRate: 45, expYield: 160, rarity: Rarity.Rare,
};
const Goblin = {
    id: 13,
    type: Type.Normal,
    hp: 70, mana: 75, attack: 75, defense: 70, speed: 80,
    movepool: [
        { move_id: Stomp.id, levelMin: 0 },
        { move_id: Harden.id, levelMin: 4 },
        { move_id: Cleanse.id, levelMin: 8 },
        { move_id: Tackle.id, levelMin: 12 },
    ],
    nextEvolution: null, catchRate: 35, expYield: 256, rarity: Rarity.Common,
};
const MiniDevil = {
    id: 14,
    type: Type.Normal,
    hp: 75, mana: 70, attack: 80, defense: 65, speed: 70,
    movepool: [
        { move_id: Slash.id, levelMin: 0 },
        { move_id: Cut.id, levelMin: 4 },
        { move_id: Claw.id, levelMin: 8 },
        { move_id: ClawCombo.id, levelMin: 12 },
    ],
    nextEvolution: null, catchRate: 40, expYield: 96, rarity: Rarity.Uncommon,
};
const DevilDare = {
    id: 15,
    type: Type.Normal,
    hp: 80,
    mana: 75,
    attack: 70,
    defense: 85,
    speed: 65,
    movepool: [
        { move_id: Slam.id, levelMin: 0 },
        { move_id: Growl.id, levelMin: 5 },
        { move_id: FireBlast.id, levelMin: 10 },
    ],
    nextEvolution: null,
    catchRate: 45,
    expYield: 128,
    rarity: Rarity.Rare,
};
const Masks = {
    id: 16,
    type: Type.Normal,
    hp: 70,
    mana: 75,
    attack: 65,
    defense: 70,
    speed: 80,
    movepool: [
        { move_id: QuickAttack.id, levelMin: 0 },
        { move_id: Harden.id, levelMin: 5 },
    ],
    nextEvolution: null,
    catchRate: 50,
    expYield: 128,
    rarity: Rarity.Rare,
};
const Luckun = {
    id: 17,
    type: Type.Normal,
    hp: 75,
    mana: 70,
    attack: 80,
    defense: 65,
    speed: 70,
    movepool: [
        { move_id: Punch.id, levelMin: 0 },
        { move_id: Growl.id, levelMin: 5 },
    ],
    nextEvolution: null,
    catchRate: 30,
    expYield: 256,
    rarity: Rarity.Rare,
};
const MiniHam = {
    id: 18,
    type: Type.Normal,
    hp: 70,
    mana: 75,
    attack: 65,
    defense: 70,
    speed: 80,
    movepool: [
        { move_id: Tackle.id, levelMin: 0 },
        { move_id: Harden.id, levelMin: 5 },
        { move_id: Slam.id, levelMin: 10 },
    ],
    nextEvolution: null,
    catchRate: 35,
    expYield: 64,
    rarity: Rarity.Uncommon,
};
const SadHam = {
    id: 19,
    type: Type.Normal,
    hp: 75,
    mana: 70,
    attack: 80,
    defense: 65,
    speed: 70,
    movepool: [
        { move_id: Punch.id, levelMin: 0 },
        { move_id: Growl.id, levelMin: 5 },
    ],
    nextEvolution: null,
    catchRate: 40,
    expYield: 128,
    rarity: Rarity.Rare,
};
const MoiHam = {
    id: 20,
    type: Type.Normal,
    hp: 80,
    mana: 75,
    attack: 70,
    defense: 85,
    speed: 65,
    movepool: [
        { move_id: Stomp.id, levelMin: 0 },
        { move_id: Harden.id, levelMin: 5 },
    ],
    nextEvolution: null,
    catchRate: 45,
    expYield: 256,
    rarity: Rarity.Epic,
};
const Bearos = {
    id: 21,
    type: Type.Normal,
    hp: 70,
    mana: 75,
    attack: 65,
    defense: 70,
    speed: 80,
    movepool: [
        { move_id: Slam.id, levelMin: 0 },
        { move_id: Growl.id, levelMin: 5 },
    ],
    nextEvolution: null,
    catchRate: 50,
    expYield: 160,
    rarity: Rarity.Rare,
};
const Treex = {
    id: 22,
    type: Type.Normal,
    hp: 75,
    mana: 70,
    attack: 80,
    defense: 65,
    speed: 70,
    movepool: [
        { move_id: Punch.id, levelMin: 0 },
        { move_id: Harden.id, levelMin: 5 },
    ],
    nextEvolution: null,
    catchRate: 30,
    expYield: 192,
    rarity: Rarity.Rare,
};
const Moutmout = {
    id: 23,
    type: Type.Normal,
    hp: 70,
    mana: 75,
    attack: 65,
    defense: 70,
    speed: 80,
    movepool: [
        { move_id: QuickAttack.id, levelMin: 0 },
        { move_id: Growl.id, levelMin: 5 },
    ],
    nextEvolution: null,
    catchRate: 35,
    expYield: 128,
    rarity: Rarity.Uncommon,
};
const Piggy = {
    id: 24,
    type: Type.Normal,
    hp: 75,
    mana: 70,
    attack: 80,
    defense: 65,
    speed: 70,
    movepool: [
        { move_id: Punch.id, levelMin: 0 },
        { move_id: Harden.id, levelMin: 5 },
    ],
    nextEvolution: null,
    catchRate: 40,
    expYield: 160,
    rarity: Rarity.Uncommon,
};
const Bleaub = {
    id: 25,
    type: Type.Normal,
    hp: 70,
    mana: 75,
    attack: 65,
    defense: 70,
    speed: 80,
    movepool: [
        { move_id: Stomp.id, levelMin: 0 },
        { move_id: Growl.id, levelMin: 5 },
    ],
    nextEvolution: null,
    catchRate: 45,
    expYield: 80,
    rarity: Rarity.Common,
};
const Shroom = {
    id: 26,
    type: Type.Normal,
    hp: 75,
    mana: 70,
    attack: 80,
    defense: 65,
    speed: 70,
    movepool: [
        { move_id: Punch.id, levelMin: 0 },
        { move_id: Harden.id, levelMin: 5 },
    ],
    nextEvolution: null,
    catchRate: 50,
    expYield: 96,
    rarity: Rarity.Common,
};
const Lantern = {
    id: 27,
    type: Type.Water,
    hp: 70,
    mana: 75,
    attack: 65,
    defense: 70,
    speed: 80,
    movepool: [
        { move_id: AquaJet.id, levelMin: 0 },
        { move_id: Waterfall.id, levelMin: 5 },
        { move_id: HydroBlast.id, levelMin: 10 },
    ],
    nextEvolution: null,
    catchRate: 30,
    expYield: 112,
    rarity: Rarity.Common,
};
const Droplet = {
    id: 28,
    type: Type.Water,
    hp: 75,
    mana: 70,
    attack: 80,
    defense: 65,
    speed: 70,
    movepool: [
        { move_id: AquaJet.id, levelMin: 0 },
        { move_id: HydroTail.id, levelMin: 5 },
        { move_id: HydroBlast.id, levelMin: 10 },
    ],
    nextEvolution: null,
    catchRate: 35,
    expYield: 150,
    rarity: Rarity.Epic,
};
const Fireball = {
    id: 29,
    type: Type.Fire,
    hp: 80,
    mana: 60,
    attack: 90,
    defense: 50,
    speed: 70,
    movepool: [
        { move_id: Ember.id, levelMin: 0 },
        { move_id: FirePunch.id, levelMin: 5 },
        { move_id: Flamethrower.id, levelMin: 10 },
    ],
    nextEvolution: null,
    catchRate: 40,
    expYield: 150,
    rarity: Rarity.Epic,
};
const Mystical = {
    id: 30,
    type: Type.Light,
    hp: 75,
    mana: 65,
    attack: 85,
    defense: 55,
    speed: 75,
    movepool: [
        { move_id: QuickAttack.id, levelMin: 0 },
        { move_id: Harden.id, levelMin: 5 },
    ],
    nextEvolution: null,
    catchRate: 45,
    expYield: 150,
    rarity: Rarity.Epic,
};
const Clover = {
    id: 31,
    type: Type.Dark,
    hp: 70,
    mana: 70,
    attack: 80,
    defense: 60,
    speed: 70,
    movepool: [
        { move_id: Punch.id, levelMin: 0 },
        { move_id: Growl.id, levelMin: 5 },
    ],
    nextEvolution: null,
    catchRate: 50,
    expYield: 112,
    rarity: Rarity.Rare,
};
const Scorlov = {
    id: 32,
    type: Type.Dark,
    hp: 85,
    mana: 55,
    attack: 75,
    defense: 65,
    speed: 70,
    movepool: [
        { move_id: Stomp.id, levelMin: 0 },
        { move_id: Harden.id, levelMin: 5 },
        { move_id: FirePunch.id, levelMin: 10 },
    ],
    nextEvolution: null,
    catchRate: 30,
    expYield: 128,
    rarity: Rarity.Rare,
};
const Wormie = {
    id: 33,
    type: Type.Grass,
    hp: 60,
    mana: 80,
    attack: 70,
    defense: 70,
    speed: 70,
    movepool: [
        { move_id: Punch.id, levelMin: 0 },
        { move_id: Growl.id, levelMin: 5 },
        { move_id: Leafs.id, levelMin: 8 },
        { move_id: RazorLeaf.id, levelMin: 12 },
        { move_id: VineWhip.id, levelMin: 16 },
    ],
    nextEvolution: null,
    catchRate: 35,
    expYield: 99,
    rarity: Rarity.Common,
};
const Skel = {
    id: 34,
    type: Type.Dark,
    hp: 70,
    mana: 70,
    attack: 70,
    defense: 70,
    speed: 70,
    movepool: [
        { move_id: QuickAttack.id, levelMin: 0 },
        { move_id: Harden.id, levelMin: 5 },
        { move_id: Slam.id, levelMin: 10 },
    ],
    nextEvolution: null,
    catchRate: 40,
    expYield: 77,
    rarity: Rarity.Common,
};
const Frederic = {
    id: 35,
    type: Type.Light,
    hp: 75,
    mana: 65,
    attack: 85,
    defense: 55,
    speed: 75,
    movepool: [
        { move_id: Punch.id, levelMin: 0 },
        { move_id: Growl.id, levelMin: 5 },
        { move_id: QuickAttack.id, levelMin: 10 },
        { move_id: Cleanse.id, levelMin: 15 },
    ],
    nextEvolution: null,
    catchRate: 45,
    expYield: 69,
    rarity: Rarity.Uncommon,
};
const Smoky = {
    id: 36,
    type: Type.Water,
    hp: 80,
    mana: 60,
    attack: 90,
    defense: 50,
    speed: 70,
    movepool: [
        { move_id: Punch.id, levelMin: 0 },
        { move_id: Growl.id, levelMin: 5 },
        { move_id: AquaJet.id, levelMin: 8 },
        { move_id: Waterfall.id, levelMin: 12 },
        { move_id: HydroBlast.id, levelMin: 16 },
    ],
    nextEvolution: null,
    catchRate: 45,
    expYield: 130,
    rarity: Rarity.Uncommon,
};
const Forty = {
    id: 37,
    type: Type.Ground,
    hp: 100,
    mana: 55,
    attack: 45,
    defense: 100,
    speed: 45,
    movepool: [
        { move_id: Stomp.id, levelMin: 0 },
        { move_id: Harden.id, levelMin: 5 },
        { move_id: Slam.id, levelMin: 10 },
    ],
    nextEvolution: null,
    catchRate: 50,
    expYield: 212,
    rarity: Rarity.Rare,
};
const Bud = {
    id: 38,
    type: Type.Dark,
    hp: 60,
    mana: 80,
    attack: 70,
    defense: 70,
    speed: 70,
    movepool: [
        { move_id: Punch.id, levelMin: 0 },
        { move_id: Growl.id, levelMin: 5 },
        { move_id: Slam.id, levelMin: 10 },
    ],
    nextEvolution: null,
    catchRate: 30,
    expYield: 169,
    rarity: Rarity.Uncommon,
};
const Hiboo = {
    id: 39,
    type: Type.Normal,
    hp: 90,
    mana: 100,
    attack: 80,
    defense: 90,
    speed: 100,
    movepool: [
        { move_id: QuickAttack.id, levelMin: 0 },
        { move_id: Stomp.id, levelMin: 5 },
    ],
    nextEvolution: null,
    catchRate: 35,
    expYield: 222,
    rarity: Rarity.Legendary,
};
const Eggy = {
    id: 40,
    type: Type.Ground,
    hp: 100,
    mana: 40,
    attack: 30,
    defense: 70,
    speed: 20,
    movepool: [
        { move_id: Punch.id, levelMin: 0 },
        { move_id: FirePunch.id, levelMin: 10 },
    ],
    nextEvolution: null,
    catchRate: 40,
    expYield: 118,
    rarity: Rarity.Epic,
};
const Dracoblast = {
    id: 41,
    type: Type.Fly,
    hp: 90,
    mana: 90,
    attack: 90,
    defense: 90,
    speed: 100,
    movepool: [
        { move_id: Stomp.id, levelMin: 0 },
        { move_id: Ember.id, levelMin: 5 },
        { move_id: QuickAttack.id, levelMin: 8 },
        { move_id: Flamethrower.id, levelMin: 12 },
        { move_id: Cleanse.id, levelMin: 15 },
    ],
    nextEvolution: null,
    catchRate: 45,
    expYield: 255,
    rarity: Rarity.Legendary,
};
const Cerberus = {
    id: 42,
    type: Type.Fire,
    hp: 100,
    mana: 80,
    attack: 100,
    defense: 80,
    speed: 100,
    movepool: [
        { move_id: Stomp.id, levelMin: 0 },
        { move_id: Ember.id, levelMin: 5 },
        { move_id: FirePunch.id, levelMin: 10 },
        { move_id: FireBlast.id, levelMin: 15 },
        { move_id: FlareBlitz.id, levelMin: 20 },
        { move_id: Cleanse.id, levelMin: 25 },
    ],
    nextEvolution: null,
    catchRate: 45,
    expYield: 255,
    rarity: Rarity.Legendary,
};
const blastPedia = [
    Lizzy,
    Punchball,
    Jellys,
    Kitchi,
    Kenchi,
    Mousy,
    Clawball,
    Balt,
    Stagpan,
    Botte,
    Booh,
    Ghoosto,
    Goblin,
    MiniDevil,
    DevilDare,
    Masks,
    Luckun,
    MiniHam,
    SadHam,
    MoiHam,
    Bearos,
    Treex,
    Moutmout,
    Piggy,
    Bleaub,
    Shroom,
    Lantern,
    Droplet,
    Fireball,
    Mystical,
    Clover,
    Scorlov,
    Wormie,
    Skel,
    Frederic,
    Smoky,
    Forty,
    Bud,
    Hiboo,
    Eggy,
    Dracoblast,
    Cerberus,
];
function getBlastDataById(id) {
    const blast = blastPedia.find((blast) => blast.id === id);
    if (!blast) {
        throw new Error(`No Blast found with ID: ${id}`);
    }
    return blast;
}
const rpcLoadBlastPedia = function (ctkx, logger, nk) {
    return JSON.stringify(blastPedia);
};
const BagPermissionRead = 2;
const BagPermissionWrite = 0;
const BagCollectionName = 'item_collection';
const BagCollectionKey = 'user_items';
const DefaultDeckItems = [
    {
        data_id: potionData.id,
        amount: 5,
    },
    {
        data_id: elixirData.id,
        amount: 5,
    },
    {
        data_id: blastTrapData.id,
        amount: 10,
    },
];
const rpcSwapStoredToDeckItem = function (ctx, logger, nk, payload) {
    const request = JSON.parse(payload);
    const userItems = loadUserItems(nk, logger, ctx.userId);
    if (userItems.deckItems[request.outIndex] == null) {
        throw Error('invalid out item (deck)');
    }
    if (userItems.storedItems[request.inIndex] == null) {
        throw Error('invalid in item (stored)');
    }
    const outItem = userItems.deckItems[request.outIndex];
    const inItem = userItems.storedItems[request.inIndex];
    userItems.deckItems[request.outIndex] = inItem;
    userItems.storedItems[request.inIndex] = outItem;
    storeUserItems(nk, logger, ctx.userId, userItems);
    logger.debug("user '%s' swapped STORED item '%d' with DECK item at index %d", ctx.userId, request.inIndex, request.outIndex);
    return JSON.stringify(userItems);
};
const rpcSwapDeckToDeckItem = function (ctx, logger, nk, payload) {
    const request = JSON.parse(payload);
    const userItems = loadUserItems(nk, logger, ctx.userId);
    if (userItems.deckItems[request.outIndex] == null || userItems.deckItems[request.inIndex] == null) {
        throw Error('invalid deck item index');
    }
    const outItem = userItems.deckItems[request.outIndex];
    const inItem = userItems.deckItems[request.inIndex];
    userItems.deckItems[request.outIndex] = inItem;
    userItems.deckItems[request.inIndex] = outItem;
    storeUserItems(nk, logger, ctx.userId, userItems);
    logger.debug("user '%s' swapped DECK item '%d' with DECK item at index %d", ctx.userId, request.inIndex, request.outIndex);
    return JSON.stringify(userItems);
};
const rpcLoadUserItems = function (ctx, logger, nk, payload) {
    return JSON.stringify(loadUserItems(nk, logger, ctx.userId));
};
function addItem(nk, logger, userId, newItemToAdd) {
    let userItems;
    try {
        userItems = loadUserItems(nk, logger, userId);
    }
    catch (error) {
        logger.error('error loading user cards: %s', error);
        throw Error('Internal server error');
    }
    var continueScan = true;
    if (continueScan) {
        for (let i = 0; i < userItems.deckItems.length; i++) {
            if (userItems.deckItems[i].data_id == newItemToAdd.data_id) {
                userItems.deckItems[i].amount += newItemToAdd.amount;
                continueScan = false;
            }
        }
    }
    if (continueScan) {
        for (let i = 0; i < userItems.storedItems.length; i++) {
            if (userItems.storedItems[i].data_id == newItemToAdd.data_id) {
                userItems.storedItems[i].amount += newItemToAdd.amount;
                continueScan = false;
            }
        }
    }
    if (continueScan) {
        if (userItems.deckItems.length < 3) {
            userItems.deckItems[userItems.deckItems.length] = newItemToAdd;
        }
        else {
            userItems.storedItems[userItems.storedItems.length] = newItemToAdd;
        }
    }
    try {
        storeUserItems(nk, logger, userId, userItems);
    }
    catch (error) {
        logger.error('error buying card: %s', error);
        throw error;
    }
    return userItems;
}
function useItem(nk, logger, userId, itemToUse) {
    let userItems;
    userItems = loadUserItems(nk, logger, userId);
    for (let i = 0; i < userItems.deckItems.length; i++) {
        if (userItems.deckItems[i].data_id == itemToUse.data_id) {
            userItems.deckItems[i].amount--;
            if (userItems.deckItems[i].amount < 0) {
                userItems.deckItems[i].amount = 0;
            }
        }
    }
    storeUserItems(nk, logger, userId, userItems);
    logger.debug('user %s successfully use item', userId);
    return userItems;
}
function loadUserItems(nk, logger, userId) {
    let storageReadReq = {
        key: BagCollectionKey,
        collection: BagCollectionName,
        userId: userId,
    };
    let objects;
    try {
        objects = nk.storageRead([storageReadReq]);
    }
    catch (error) {
        logger.error('storageRead error: %s', error);
        throw error;
    }
    if (objects.length === 0) {
        throw Error('user cards storage object not found');
    }
    let storedItemCollection = objects[0].value;
    return storedItemCollection;
}
function storeUserItems(nk, logger, userId, cards) {
    try {
        nk.storageWrite([
            {
                key: BagCollectionKey,
                collection: BagCollectionName,
                userId: userId,
                value: cards,
                permissionRead: BagPermissionRead,
                permissionWrite: BagPermissionWrite,
            }
        ]);
    }
    catch (error) {
        logger.error('storageWrite error: %s', error);
        throw error;
    }
}
function defaultItemsCollection(nk, logger, userId) {
    let cards = {
        deckItems: DefaultDeckItems,
        storedItems: [],
    };
    storeUserItems(nk, logger, userId, cards);
    return {
        deckItems: DefaultDeckItems,
        storedItems: [],
    };
}
const thePlains = {
    id: 0,
    trophyRequired: 0,
    blastIds: [Kitchi.id, Kenchi.id, Mousy.id, Clawball.id],
    blastLevels: [1, 3]
};
const theDarkCaves = {
    id: 1,
    trophyRequired: 200,
    blastIds: [Balt.id, Stagpan.id, Botte.id, Booh.id, Ghoosto.id],
    blastLevels: [2, 6]
};
const theMiniHell = {
    id: 2,
    trophyRequired: 500,
    blastIds: [Goblin.id, MiniDevil.id, DevilDare.id, Masks.id, Luckun.id, MiniHam.id, SadHam.id],
    blastLevels: [5, 9]
};
const theWildForest = {
    id: 3,
    trophyRequired: 800,
    blastIds: [Bearos.id, Treex.id, Moutmout.id, Piggy.id, Bleaub.id, Shroom.id],
    blastLevels: [8, 12]
};
const theWideOcean = {
    id: 4,
    trophyRequired: 1100,
    blastIds: [Lantern.id, Droplet.id, Fireball.id, Mystical.id, Wormie.id, Smoky.id],
    blastLevels: [12, 15]
};
const theGloryCastle = {
    id: 5,
    trophyRequired: 1400,
    blastIds: [Clover.id, Scorlov.id, Skel.id, Frederic.id, Bud.id],
    blastLevels: [16, 20]
};
const theElusiveMount = {
    id: 6,
    trophyRequired: 2000,
    blastIds: [Forty.id, Hiboo.id, Eggy.id, Dracoblast.id, Cerberus.id],
    blastLevels: [19, 30]
};
const allArea = [
    thePlains,
    theDarkCaves,
    theMiniHell,
    theWildForest,
    theWideOcean,
    theGloryCastle,
    theElusiveMount
];
const rpcLoadAllArea = function () {
    return JSON.stringify(allArea);
};
const rpcSelectArea = function (ctx, logger, nk, payload) {
    const areaID = JSON.parse(payload);
    setMetadataStat(nk, ctx.userId, "area", areaID);
    // TODO Check si il peut
    logger.debug("user '%s' select area '%s'", ctx.userId, areaID);
};
function getRandomBlastWithAreaId(userId, nk, extraLevel, isBoss, logger) {
    try {
        let areaId = clamp(getMetadataStat(nk, userId, "area"), 0, allArea.length);
        let randomBlastId = getRandomBlastIdWithAreaId(areaId);
        let blastData = getBlastDataById(randomBlastId);
        let randomLevel = getRandomLevelInArea(areaId) + extraLevel;
        let randomIv = getRandomNumber(MinIV, MaxIV);
        let newBlast = getNewBlast(nk, randomBlastId, randomIv, blastData, randomLevel, isBoss);
        return newBlast;
    }
    catch (error) {
        logger.error('storageRead error: %s', error);
        throw error;
    }
}
function getRandomBlastEntityInAllPlayerArea(userId, nk, isBoss) {
    let randomBlastId = getRandomBlastIdInPlayerAreaWithTrophy(getCurrencyInWallet(nk, userId, Currency.Trophies));
    let randomData = getBlastDataById(randomBlastId);
    let randomlevel = getRandomLevelInArea(getMetadataStat(nk, userId, "area")); // TODO Do get max area the player reaches
    let randomIv = getRandomNumber(MinIV, MaxIV);
    let newBlast = getNewBlast(nk, randomBlastId, randomIv, randomData, randomlevel, isBoss);
    return newBlast;
}
function getRandomBlastIdInPlayerAreaWithTrophy(amountOfTrophy) {
    const allAreaUnderTrophy = getAllAreaUnderTrophy(amountOfTrophy);
    const randomAreaIndex = Math.floor(Math.random() * (allAreaUnderTrophy.length - 1));
    const randomBlastId = getRandomBlastIdWithAreaId(allAreaUnderTrophy[randomAreaIndex].id);
    return randomBlastId;
}
function getAllAreaUnderTrophy(amountOfTrophy) {
    const areaUnderTrophy = [];
    for (const area of allArea) {
        if (area.trophyRequired <= amountOfTrophy) {
            areaUnderTrophy.push(area);
        }
    }
    return areaUnderTrophy;
}
function getNewBlast(nk, randomBlastId, randomIv, randomData, level, isBoss) {
    return {
        uuid: nk.uuidv4(),
        data_id: randomBlastId,
        exp: calculateExperienceFromLevel(level),
        iv: randomIv,
        boss: isBoss,
        shiny: isShiny(),
        activeMoveset: getRandomActiveMoveset(randomData, calculateExperienceFromLevel(level)),
    };
}
function getRandomBlastIdWithAreaId(id) {
    const area = allArea.find((area) => area.id === id);
    if (area && area.blastIds.length > 0) {
        const randomIndex = Math.floor(Math.random() * area.blastIds.length);
        return area.blastIds[randomIndex];
    }
    return 0;
}
function getRandomLevelInArea(id) {
    const area = allArea.find((area) => area.id === id);
    if (area) {
        const [minLevel, maxLevel] = area.blastLevels;
        const randomLevel = getRandomNumber(minLevel, maxLevel);
        return randomLevel;
    }
    return 0;
}
const DeckPermissionRead = 2;
const DeckPermissionWrite = 0;
const DefaultBlastLevel = 5;
const DeckCollectionName = 'blasts_collection';
const DeckCollectionKey = 'user_blasts';
function getRandomIV(min = MinIV, max = MaxIV) {
    return Math.floor(Math.random() * (max - min + 1)) + min;
}
function generateUUID() {
    let uuid = '', i, random;
    for (i = 0; i < 36; i++) {
        if (i === 8 || i === 13 || i === 18 || i === 23) {
            uuid += '-';
        }
        else if (i === 14) {
            uuid += '4'; // Le 14e caractère est toujours "4" pour un UUID v4
        }
        else {
            random = Math.random() * 16 | 0;
            if (i === 19) {
                uuid += (random & 0x3 | 0x8).toString(16); // Le 19e caractère est limité à 8, 9, A, ou B
            }
            else {
                uuid += random.toString(16);
            }
        }
    }
    return uuid;
}
const DefaultDeckBlast = [
    (() => {
        const iv = getRandomIV(10, MaxIV);
        const exp = calculateExperienceFromLevel(DefaultBlastLevel);
        const blast = {
            uuid: generateUUID(),
            data_id: Lizzy.id,
            exp,
            iv,
            boss: false,
            shiny: isShiny(),
            activeMoveset: getRandomActiveMoveset(Lizzy, exp),
        };
        return blast;
    })(),
    (() => {
        const iv = getRandomIV(10, MaxIV);
        const exp = calculateExperienceFromLevel(DefaultBlastLevel);
        const blast = {
            uuid: generateUUID(),
            data_id: Punchball.id,
            exp,
            iv,
            boss: false,
            shiny: isShiny(),
            activeMoveset: getRandomActiveMoveset(Punchball, exp),
        };
        return blast;
    })(),
    (() => {
        const iv = getRandomIV(10, MaxIV);
        const exp = calculateExperienceFromLevel(DefaultBlastLevel);
        const blast = {
            uuid: generateUUID(),
            data_id: Jellys.id,
            exp,
            iv,
            boss: false,
            shiny: isShiny(),
            activeMoveset: getRandomActiveMoveset(Jellys, exp),
        };
        return blast;
    })()
];
const rpcLoadUserBlast = function (ctx, logger, nk, payload) {
    return JSON.stringify(loadUserBlast(nk, logger, ctx.userId));
};
const rpcSwapBlastMove = function (ctx, logger, nk, payload) {
    const request = JSON.parse(payload);
    const userCards = loadUserBlast(nk, logger, ctx.userId);
    let selectedBlast = userCards.deckBlasts.find(blast => blast.uuid === request.uuidBlast) || userCards.storedBlasts.find(blast => blast.uuid === request.uuidBlast);
    if (!selectedBlast) {
        throw Error("Blast not found.");
    }
    const blastData = getBlastDataById(selectedBlast.data_id);
    const newMove = blastData.movepool[request.newMoveIndex];
    if (!newMove) {
        throw Error("Invalid new move index.");
    }
    const newMoveId = getMoveById(newMove.move_id).id;
    const activeMoveset = selectedBlast.activeMoveset;
    const currentIndex = activeMoveset.indexOf(newMoveId);
    if (currentIndex !== -1) {
        if (currentIndex === request.outMoveIndex) {
            throw Error("Cannot swap a move with itself.");
        }
        const temp = activeMoveset[request.outMoveIndex];
        activeMoveset[request.outMoveIndex] = activeMoveset[currentIndex];
        activeMoveset[currentIndex] = temp;
    }
    else {
        activeMoveset[request.outMoveIndex] = newMoveId;
    }
    storeUserBlasts(nk, logger, ctx.userId, userCards);
    return JSON.stringify(userCards);
};
const rpcSwapStoredToDeckBlast = function (ctx, logger, nk, payload) {
    const request = JSON.parse(payload);
    const userBlasts = loadUserBlast(nk, logger, ctx.userId);
    if (userBlasts.deckBlasts[request.outIndex] == null) {
        throw Error('invalid out card (deck)');
    }
    if (userBlasts.storedBlasts[request.inIndex] == null) {
        throw Error('invalid in card (stored)');
    }
    const outCard = userBlasts.deckBlasts[request.outIndex];
    const inCard = userBlasts.storedBlasts[request.inIndex];
    userBlasts.deckBlasts[request.outIndex] = inCard;
    userBlasts.storedBlasts[request.inIndex] = outCard;
    storeUserBlasts(nk, logger, ctx.userId, userBlasts);
    logger.debug("user '%s' swapped STORED card '%d' with DECK card at index %d", ctx.userId, request.inIndex, request.outIndex);
    return JSON.stringify(userBlasts);
};
const rpcSwapDeckToDeckBlast = function (ctx, logger, nk, payload) {
    const request = JSON.parse(payload);
    const userBlasts = loadUserBlast(nk, logger, ctx.userId);
    if (userBlasts.deckBlasts[request.outIndex] == null || userBlasts.deckBlasts[request.inIndex] == null) {
        throw Error('invalid deck card index');
    }
    const outCard = userBlasts.deckBlasts[request.outIndex];
    const inCard = userBlasts.deckBlasts[request.inIndex];
    userBlasts.deckBlasts[request.outIndex] = inCard;
    userBlasts.deckBlasts[request.inIndex] = outCard;
    storeUserBlasts(nk, logger, ctx.userId, userBlasts);
    logger.debug("user '%s' swapped DECK card '%d' with DECK card at index %d", ctx.userId, request.inIndex, request.outIndex);
    return JSON.stringify(userBlasts);
};
const rpcEvolveBlast = function (ctx, logger, nk, payload) {
    var _a, _b;
    const uuid = JSON.parse(payload);
    let userCards;
    userCards = loadUserBlast(nk, logger, ctx.userId);
    let isInDeck = false;
    let selectedBlast = {
        uuid: "",
        data_id: 0,
        exp: 0,
        iv: 0,
        boss: false,
        shiny: false,
        activeMoveset: [],
    };
    if (userCards.deckBlasts.find(blast => blast.uuid === uuid) != null) {
        selectedBlast = userCards.deckBlasts.find(blast => blast.uuid === uuid);
        isInDeck = true;
    }
    else if (userCards.storedBlasts.find(blast => blast.uuid === uuid) != null) {
        selectedBlast = userCards.storedBlasts.find(blast => blast.uuid === uuid);
        isInDeck = false;
    }
    let blastdata = getBlastDataById(selectedBlast.data_id);
    if (isInDeck) {
        if (blastdata.nextEvolution !== null) {
            if (((_a = blastdata.nextEvolution) === null || _a === void 0 ? void 0 : _a.levelRequired) >= calculateLevelFromExperience(selectedBlast.exp)) {
                // Check si assez d'argent
                // If true check if assez d'argent par rapport rareté + ratio IV de base
                userCards.deckBlasts.find(blast => blast.uuid === uuid).data_id = getBlastDataById(blastdata.nextEvolution.id).id;
            }
        }
    }
    else {
        if (blastdata.nextEvolution != null) {
            if (((_b = blastdata.nextEvolution) === null || _b === void 0 ? void 0 : _b.levelRequired) >= calculateLevelFromExperience(selectedBlast.exp)) {
                // Check si assez d'argent
                // If true check if assez d'argent par rapport rareté + ratio IV de base
                userCards.storedBlasts.find(blast => blast.uuid === uuid).data_id = getBlastDataById(blastdata.nextEvolution.id).id;
            }
        }
    }
    storeUserBlasts(nk, logger, ctx.userId, userCards);
    logger.debug("user '%s' upgraded card '%s'", ctx.userId, selectedBlast.uuid);
    return JSON.stringify(userCards);
};
function addBlast(nk, logger, userId, newBlastToAdd) {
    let userCards;
    userCards = loadUserBlast(nk, logger, userId);
    if (userCards.deckBlasts.length < 3) {
        userCards.deckBlasts[userCards.deckBlasts.length] = newBlastToAdd;
    }
    else {
        userCards.storedBlasts[userCards.storedBlasts.length] = newBlastToAdd;
    }
    let version = getBlastVersion(newBlastToAdd);
    markMonsterCaptured(userId, newBlastToAdd.data_id.toString(), version, nk, logger);
    storeUserBlasts(nk, logger, userId, userCards);
    logger.debug("user '%s' succesfully add blast with id '%s'", userId, newBlastToAdd.data_id);
    return userCards;
}
function addExpOnBlast(nk, logger, userId, uuid, expToAdd) {
    const userCards = loadUserBlast(nk, logger, userId);
    let blast = userCards.deckBlasts.find(b => b.uuid === uuid);
    if (!blast)
        blast = userCards.storedBlasts.find(b => b.uuid === uuid);
    if (!blast) {
        logger.error(`Blast with UUID '${uuid}' not found for user '${userId}'`);
        return userCards.deckBlasts;
    }
    const oldLevel = calculateLevelFromExperience(blast.exp);
    blast.exp += expToAdd;
    const newLevel = calculateLevelFromExperience(blast.exp);
    // Si level up et moveset incomplet, tenter d’ajouter un move
    if (newLevel > oldLevel && blast.activeMoveset.length < 4) {
        const blastData = getBlastDataById(blast.data_id);
        const newMoves = blastData.movepool
            .filter(m => m.levelMin <= newLevel)
            .map(m => m.move_id)
            .filter(moveId => !blast.activeMoveset.includes(moveId));
        if (newMoves.length > 0) {
            blast.activeMoveset.push(newMoves[0]);
            logger.debug(`Blast '${uuid}' gained new move '${newMoves[0]}' at level ${newLevel}`);
        }
    }
    storeUserBlasts(nk, logger, userId, userCards);
    logger.debug("User '%s' successfully added exp on blast with uuid '%s'", userId, uuid);
    return userCards.deckBlasts;
}
function getDeckBlast(nk, logger, userId) {
    let userCards;
    userCards = loadUserBlast(nk, logger, userId);
    let deckBlasts = [];
    for (let i = 0; i < userCards.deckBlasts.length; i++) {
        var blast = ConvertBlastToBlastEntity(userCards.deckBlasts[i]);
        deckBlasts.push(blast);
    }
    logger.debug("user '%s' successfully get deck blast", userId);
    return deckBlasts;
}
function loadUserBlast(nk, logger, userId) {
    let storageReadReq = {
        key: DeckCollectionKey,
        collection: DeckCollectionName,
        userId: userId,
    };
    let objects;
    try {
        objects = nk.storageRead([storageReadReq]);
    }
    catch (error) {
        logger.error('storageRead error: %s', error);
        throw error;
    }
    if (objects.length === 0) {
        throw Error('user cards storage object not found');
    }
    let BlastCollection = objects[0].value;
    return BlastCollection;
}
function storeUserBlasts(nk, logger, userId, cards) {
    try {
        nk.storageWrite([
            {
                key: DeckCollectionKey,
                collection: DeckCollectionName,
                userId: userId,
                value: cards,
                permissionRead: DeckPermissionRead,
                permissionWrite: DeckPermissionWrite,
            }
        ]);
    }
    catch (error) {
        logger.error('storageWrite error: %s', error);
        throw error;
    }
}
function defaultBlastCollection(nk, logger, userId) {
    let cards = {
        deckBlasts: DefaultDeckBlast,
        storedBlasts: [],
    };
    storeUserBlasts(nk, logger, userId, cards);
    return {
        deckBlasts: DefaultDeckBlast,
        storedBlasts: [],
    };
}
var OfferType;
(function (OfferType) {
    OfferType[OfferType["None"] = 0] = "None";
    OfferType[OfferType["Coin"] = 1] = "Coin";
    OfferType[OfferType["Gem"] = 2] = "Gem";
    OfferType[OfferType["Blast"] = 3] = "Blast";
    OfferType[OfferType["Item"] = 4] = "Item";
})(OfferType || (OfferType = {}));
//#region BlastTrap Offer
const blastTrap = {
    data_id: blastTrapData.id,
    amount: 1,
};
const blastTrapOffer = {
    offer_id: 1,
    offer: {
        type: OfferType.Item,
        coinsAmount: 0,
        gemsAmount: 0,
        blast: null,
        item: blastTrap,
    },
    currency: Currency.Coins,
    price: 100,
    isAlreadyBuyed: false,
};
const superBlastTrap = {
    data_id: superBlastTrapData.id,
    amount: 1,
};
const superBlastTrapOffer = {
    offer_id: 2,
    offer: {
        type: OfferType.Item,
        coinsAmount: 0,
        gemsAmount: 0,
        blast: null,
        item: superBlastTrap,
    },
    currency: Currency.Coins,
    price: 250,
    isAlreadyBuyed: false,
};
const hyperBlastTrap = {
    data_id: hyperBlastTrapData.id,
    amount: 1,
};
const hyperBlastTrapOffer = {
    offer_id: 3,
    offer: {
        type: OfferType.Item,
        coinsAmount: 0,
        gemsAmount: 0,
        blast: null,
        item: hyperBlastTrap,
    },
    currency: Currency.Coins,
    price: 500,
    isAlreadyBuyed: false,
};
const blastTrapOffers = [
    blastTrapOffer,
    superBlastTrapOffer,
    hyperBlastTrapOffer,
];
const rpcLoadBlastTrapOffer = function (ctx, logger, nk) {
    return JSON.stringify(blastTrapOffers);
};
const rpcBuyTrapOffer = function (ctx, logger, nk, payload) {
    var indexOffer = JSON.parse(payload);
    var storeOffer = blastTrapOffers[indexOffer];
    try {
        nk.walletUpdate(ctx.userId, { [storeOffer.currency]: -storeOffer.price });
    }
    catch (error) {
        logger.error('error buying blast trap: %s', error);
        throw error;
    }
    addItem(nk, logger, ctx.userId, storeOffer.offer.item);
    // return playerWallet and Wallets
};
//#endregion
//#region Coins Offer
const coinsOffer1 = {
    offer_id: 4,
    offer: {
        type: OfferType.Coin,
        coinsAmount: 20000,
        gemsAmount: 0,
        blast: null,
        item: null,
    },
    currency: Currency.Gems,
    price: 100,
    isAlreadyBuyed: false,
};
const coinsOffer2 = {
    offer_id: 5,
    offer: {
        type: OfferType.Coin,
        coinsAmount: 65000,
        gemsAmount: 0,
        blast: null,
        item: null,
    },
    currency: Currency.Gems,
    price: 300,
    isAlreadyBuyed: false,
};
const coinsOffer3 = {
    offer_id: 6,
    offer: {
        type: OfferType.Coin,
        coinsAmount: 140000,
        gemsAmount: 0,
        blast: null,
        item: null,
    },
    currency: Currency.Gems,
    price: 600,
    isAlreadyBuyed: false,
};
const coinsOffer = [
    coinsOffer1,
    coinsOffer2,
    coinsOffer3,
];
const rpcLoadCoinsOffer = function (ctx, logger, nk) {
    return JSON.stringify(coinsOffer);
};
const rpcBuyCoinOffer = function (ctx, logger, nk, payload) {
    var indexOffer = JSON.parse(payload);
    var storeOffer = coinsOffer[indexOffer];
    try {
        nk.walletUpdate(ctx.userId, { [storeOffer.currency]: -storeOffer.price });
        nk.walletUpdate(ctx.userId, { [Currency.Coins]: storeOffer.offer.coinsAmount });
    }
    catch (error) {
        logger.error('error buying blast trap: %s', error);
        throw error;
    }
};
//#endregion
//#region Gems Offer
const gemsOffer1 = {
    offer_id: 7,
    offer: {
        type: OfferType.Gem,
        coinsAmount: 0,
        gemsAmount: 160,
        blast: null,
        item: null,
    },
    currency: Currency.Hard,
    price: 0,
    isAlreadyBuyed: false,
};
const gemsOffer2 = {
    offer_id: 8,
    offer: {
        type: OfferType.Gem,
        coinsAmount: 0,
        gemsAmount: 500,
        blast: null,
        item: null,
    },
    currency: Currency.Hard,
    price: 0,
    isAlreadyBuyed: false,
};
const gemsOffer3 = {
    offer_id: 9,
    offer: {
        type: OfferType.Gem,
        coinsAmount: 0,
        gemsAmount: 1200,
        blast: null,
        item: null,
    },
    currency: Currency.Hard,
    price: 0,
    isAlreadyBuyed: false,
};
const gemsOffer4 = {
    offer_id: 10,
    offer: {
        type: OfferType.Gem,
        coinsAmount: 0,
        gemsAmount: 2500,
        blast: null,
        item: null,
    },
    currency: Currency.Hard,
    price: 0,
    isAlreadyBuyed: false,
};
const gemsOffer5 = {
    offer_id: 11,
    offer: {
        type: OfferType.Gem,
        coinsAmount: 0,
        gemsAmount: 6500,
        blast: null,
        item: null,
    },
    currency: Currency.Hard,
    price: 0,
    isAlreadyBuyed: false,
};
const gemsOffer6 = {
    offer_id: 12,
    offer: {
        type: OfferType.Gem,
        coinsAmount: 0,
        gemsAmount: 14000,
        blast: null,
        item: null,
    },
    currency: Currency.Hard,
    price: 0,
    isAlreadyBuyed: false,
};
const gemsOffer = [
    gemsOffer1,
    gemsOffer2,
    gemsOffer3,
    gemsOffer4,
    gemsOffer5,
    gemsOffer6,
];
const rpcLoadGemsOffer = function (ctx, logger, nk) {
    return JSON.stringify(gemsOffer);
};
const rpcBuyGemOffer = function (ctx, logger, nk, payload) {
    var indexOffer = JSON.parse(payload);
    var storeOffer = gemsOffer[indexOffer];
    try {
        // Verif
        // Achat in app
        nk.walletUpdate(ctx.userId, { [Currency.Gems]: storeOffer.offer.gemsAmount });
    }
    catch (error) {
        logger.error('error buying blast trap: %s', error);
        throw error;
    }
};
//#endregion
const DailyShopPermissionRead = 2;
const DailyShopPermissionWrite = 0;
const DailyShopCollectionName = 'shop';
const DailyShopCollectionKey = 'daily';
function getLastDailyShopObject(context, logger, nk) {
    if (!context.userId) {
        throw Error('No user ID in context');
    }
    var objectId = {
        collection: DailyShopCollectionName,
        key: DailyShopCollectionKey,
        userId: context.userId,
    };
    var objects;
    try {
        objects = nk.storageRead([objectId]);
    }
    catch (error) {
        logger.error('storageRead error: %s', error);
        throw error;
    }
    var dailyShop = {
        lastClaimUnix: 0,
        lastDailyShop: generateRandomDailyShop(nk, context.userId, logger),
    };
    objects.forEach(function (object) {
        if (object.key == DailyShopCollectionKey) {
            dailyShop = object.value;
        }
    });
    return dailyShop;
}
function canUserClaimDailyShop(dailyShop) {
    if (!dailyShop.lastClaimUnix) {
        dailyShop.lastClaimUnix = 0;
    }
    var d = new Date();
    d.setHours(0, 0, 0, 0);
    return dailyShop.lastClaimUnix < msecToSec(d.getTime());
}
function rpcCanClaimDailyShop(context, logger, nk, payload) {
    var dailyShop = getLastDailyShopObject(context, logger, nk);
    var response = {
        canClaimDailyShop: canUserClaimDailyShop(dailyShop),
        lastDailyShop: dailyShop.lastDailyShop,
    };
    var result = JSON.stringify(response);
    return result;
}
function rpcGetDailyShopOffer(context, logger, nk, payload) {
    var dailyShop = getLastDailyShopObject(context, logger, nk);
    if (canUserClaimDailyShop(dailyShop)) {
        var newShop = generateRandomDailyShop(nk, context.userId, logger);
        dailyShop.lastClaimUnix = msecToSec(Date.now());
        dailyShop.lastDailyShop = newShop;
        var write = {
            collection: DailyShopCollectionName,
            key: DailyShopCollectionKey,
            permissionRead: DailyShopPermissionRead,
            permissionWrite: DailyShopPermissionWrite,
            value: dailyShop,
            userId: context.userId,
        };
        if (dailyShop.version) {
            // Use OCC to prevent concurrent writes.
            write.version = dailyShop.version;
        }
        // Update daily reward storage object for user.
        try {
            nk.storageWrite([write]);
        }
        catch (error) {
            logger.error('storageWrite error: %q', error);
            throw error;
        }
    }
    var result = JSON.stringify(dailyShop);
    return result;
}
function rpcBuyDailyShopOffer(context, logger, nk, payload) {
    var dailyShop = getLastDailyShopObject(context, logger, nk);
    var indexOffer = JSON.parse(payload);
    if (dailyShop.lastDailyShop[indexOffer].isAlreadyBuyed == true) {
        throw Error('Daily shop offer already buyed');
    }
    try {
        nk.walletUpdate(context.userId, { [dailyShop.lastDailyShop[indexOffer].currency]: -dailyShop.lastDailyShop[indexOffer].price });
    }
    catch (error) {
        logger.error('error buying blast trap: %s', error);
        throw error;
    }
    dailyShop.lastDailyShop[indexOffer].isAlreadyBuyed = true;
    var write = {
        collection: DailyShopCollectionName,
        key: DailyShopCollectionKey,
        permissionRead: DailyShopPermissionRead,
        permissionWrite: DailyShopPermissionWrite,
        value: dailyShop,
        userId: context.userId,
    };
    // Update daily reward storage object for user.
    try {
        nk.storageWrite([write]);
    }
    catch (error) {
        logger.error('storageWrite error: %q', error);
        throw error;
    }
    if (dailyShop.lastDailyShop[indexOffer].offer.blast != null) {
        addBlast(nk, logger, context.userId, dailyShop.lastDailyShop[indexOffer].offer.blast);
    }
    if (dailyShop.lastDailyShop[indexOffer].offer.item != null) {
        addItem(nk, logger, context.userId, dailyShop.lastDailyShop[indexOffer].offer.item);
    }
    var result = JSON.stringify(dailyShop);
    logger.debug('Succefuly buy daily shop offer response: %q', result);
    return result;
}
function generateRandomDailyShop(nk, userId, logger) {
    var dailyShop;
    dailyShop = [
        getRandomStoreOffer(nk, userId, logger),
        getRandomStoreOffer(nk, userId, logger),
        getRandomStoreOffer(nk, userId, logger),
        getRandomStoreOffer(nk, userId, logger),
        getRandomStoreOffer(nk, userId, logger),
        getRandomStoreOffer(nk, userId, logger),
    ];
    return dailyShop;
}
function getRandomOfferType() {
    const offerTypeValues = Object.values(OfferType);
    const randomIndex = Math.floor(Math.random() * offerTypeValues.length);
    return offerTypeValues[randomIndex];
}
function getRandomStoreOffer(nk, userId, logger) {
    let storeOffer = {
        offer_id: -1,
        offer: {
            type: OfferType.None,
            coinsAmount: 0,
            gemsAmount: 0,
            blast: null,
            item: null,
        },
        price: 0,
        currency: Currency.Coins,
        isAlreadyBuyed: false,
    };
    if (Math.random() < 0.5) {
        storeOffer.offer.type = OfferType.Blast;
        storeOffer.offer.blast = getRandomBlastEntityInAllPlayerArea(userId, nk, false);
        storeOffer.price = getBlastPrice(storeOffer.offer.blast);
        storeOffer.currency = Currency.Coins;
    }
    else {
        storeOffer.offer.type = OfferType.Item;
        storeOffer.offer.item = getRandomItem(1 + Math.floor(Math.random() * 10));
        storeOffer.price = getItemPrice(storeOffer.offer.item) * storeOffer.offer.item.amount;
        storeOffer.currency = Currency.Coins;
    }
    return storeOffer;
}
function getBlastPrice(blast) {
    var coeffRarity = 1;
    switch (getBlastDataById(blast.data_id).rarity) {
        case Rarity.Common:
            coeffRarity = 1;
            break;
        case Rarity.Uncommon:
            coeffRarity = 1.5;
            break;
        case Rarity.Rare:
            coeffRarity = 2;
            break;
        case Rarity.Epic:
            coeffRarity = 3;
            break;
        case Rarity.Legendary:
            coeffRarity = 10;
            break;
        case Rarity.Unique:
            coeffRarity = 5;
            break;
    }
    return Math.round(200 * coeffRarity * calculateLevelFromExperience(blast.exp));
}
function getItemPrice(item) {
    var coeffRarity = 1;
    var itemData = getItemDataById(item.data_id);
    switch (itemData.rarity) {
        case Rarity.Common:
            coeffRarity = 1;
            break;
        case Rarity.Uncommon:
            coeffRarity = 1.5;
            break;
        case Rarity.Rare:
            coeffRarity = 2;
            break;
        case Rarity.Epic:
            coeffRarity = 3;
            break;
        case Rarity.Legendary:
            coeffRarity = 10;
            break;
        case Rarity.Unique:
            coeffRarity = 5;
            break;
    }
    return Math.round(100 * coeffRarity * item.amount);
}
const DailyQuestPermissionRead = 2;
const DailyQuestPermissionWrite = 0;
const DailyQuestCollectionName = "daily_quests";
const DailyQuestStorageKey = "daily_quests_key";
var QuestIds;
(function (QuestIds) {
    QuestIds["LOGIN"] = "login";
    QuestIds["DEFEAT_BLAST"] = "defeat_blast";
    QuestIds["CATCH_BLAST"] = "catch_blast";
    QuestIds["WATCH_AD"] = "watch_ad";
})(QuestIds || (QuestIds = {}));
const QuestDefinitions = {
    [QuestIds.LOGIN]: { goal: 1 },
    [QuestIds.DEFEAT_BLAST]: { goal: 5 },
    [QuestIds.CATCH_BLAST]: { goal: 2 },
    [QuestIds.WATCH_AD]: { goal: 1 },
};
function generateDailyQuests() {
    return {
        quests: Object.entries(QuestDefinitions).map(([id, def]) => ({
            id: id,
            goal: def.goal,
            progress: 0,
        })),
        lastReset: Date.now(),
        rewardCount: 0
    };
}
function createDailyQuestStorageIfNeeded(userId, nk, logger) {
    const records = nk.storageRead([{
            collection: DailyQuestCollectionName,
            key: DailyQuestStorageKey,
            userId
        }]);
    if (records.length === 0) {
        const dailyData = generateDailyQuests();
        nk.storageWrite([{
                collection: DailyQuestCollectionName,
                key: DailyQuestStorageKey,
                userId,
                value: dailyData,
                permissionRead: DailyQuestPermissionRead,
                permissionWrite: DailyQuestPermissionWrite
            }]);
        logger.debug(`createDailyQuestStorageIfNeeded: Created daily quest storage for userId=${userId}`);
    }
    else {
        logger.debug(`createDailyQuestStorageIfNeeded: Storage already exists for userId=${userId}`);
    }
}
function rpcGetDailyQuests(context, logger, nk, payload) {
    const userId = context.userId;
    if (!userId) {
        throw new Error("User not authenticated.");
    }
    const records = nk.storageRead([{
            collection: DailyQuestCollectionName,
            key: DailyQuestStorageKey,
            userId
        }]);
    let dailyData;
    dailyData = records[0].value;
    if (isDailyResetDue(dailyData.lastReset)) {
        dailyData = generateDailyQuests();
        nk.storageWrite([{
                collection: DailyQuestCollectionName,
                key: DailyQuestStorageKey,
                userId,
                value: dailyData,
                permissionRead: DailyQuestPermissionRead,
                permissionWrite: DailyQuestPermissionWrite
            }]);
        logger.debug(`rpcGetDailyQuests: Reset daily quest storage for userId=${userId}`);
    }
    const result = JSON.stringify(dailyData.quests);
    logger.debug("rpcGetDailyQuests response: %q", result);
    return result;
}
function incrementQuest(userId, questId, amount, nk, logger) {
    const records = nk.storageRead([{
            collection: DailyQuestCollectionName,
            key: DailyQuestStorageKey,
            userId
        }]);
    if (!records.length) {
        logger.debug(`incrementQuest: No daily quest record found for userId=${userId}`);
        return;
    }
    const record = records[0];
    const data = record.value;
    const version = record.version;
    const quest = data.quests.find((q) => q.id === questId);
    if (!quest) {
        logger.debug(`incrementQuest: Quest with id=${questId} not found for userId=${userId}`);
        return;
    }
    const oldProgress = quest.progress;
    quest.progress = Math.min(quest.goal, quest.progress + amount);
    logger.debug(`incrementQuest: Updated quest '${questId}' for userId=${userId} from progress=${oldProgress} to progress=${quest.progress} (goal=${quest.goal})`);
    const writeRequest = {
        collection: DailyQuestCollectionName,
        key: DailyQuestStorageKey,
        userId: userId,
        value: data,
        version: version,
        permissionRead: DailyQuestPermissionRead,
        permissionWrite: DailyQuestPermissionWrite,
    };
    try {
        nk.storageWrite([writeRequest]);
        logger.debug(`incrementQuest: Successfully wrote updated quest data for userId=${userId}`);
    }
    catch (error) {
        logger.error("incrementQuest storageWrite error: %q", error);
        throw error;
    }
}
function rpcClaimDailyQuestReward(context, logger, nk, payload) {
    const records = nk.storageRead([{ collection: DailyQuestCollectionName, key: DailyQuestStorageKey, userId: context.userId }]);
    if (!records.length)
        throw new Error("No daily quests foundddd");
    const data = records[0].value;
    const version = records[0].version;
    const finishedCount = data.quests.filter(q => q.progress >= q.goal).length;
    if (finishedCount <= data.rewardCount) {
        throw new Error("No rewards to claim");
    }
    const reward = rewardList[data.rewardCount];
    if (reward.coinsReceived != 0) {
        updateWalletWithCurrency(nk, context.userId, Currency.Coins, reward.coinsReceived);
    }
    if (reward.gemsReceived != 0) {
        updateWalletWithCurrency(nk, context.userId, Currency.Gems, reward.gemsReceived);
    }
    data.rewardCount++;
    try {
        nk.storageWrite([{
                collection: DailyQuestCollectionName,
                key: DailyQuestStorageKey,
                userId: context.userId,
                value: data,
                version,
                permissionRead: DailyQuestPermissionRead,
                permissionWrite: DailyQuestPermissionWrite,
            }]);
    }
    catch (error) {
        logger.error("claimReward storageWrite error: %q", error);
        throw error;
    }
    return JSON.stringify(reward);
}
function rpcGetDailyQuestRewards(context, logger, nk, payload) {
    const userId = context.userId;
    if (!userId)
        throw new Error("User not authenticated.");
    const records = nk.storageRead([{
            collection: DailyQuestCollectionName,
            key: DailyQuestStorageKey,
            userId
        }]);
    if (!records.length)
        throw new Error("No daily quest record found for userId=" + userId);
    const data = records[0].value;
    const response = {
        rewards: rewardList,
        rewardCount: data.rewardCount
    };
    logger.debug(`rpcGetDailyQuestRewards: userId=${userId} rewardCount=${data.rewardCount}`);
    return JSON.stringify(response);
}
const rewardList = [
    { coinsReceived: 0, gemsReceived: 2, blastReceived: null, itemReceived: null },
    { coinsReceived: 2000, gemsReceived: 0, blastReceived: null, itemReceived: null },
    { coinsReceived: 10000, gemsReceived: 0, blastReceived: null, itemReceived: null },
    { coinsReceived: 0, gemsReceived: 10, blastReceived: null, itemReceived: null },
];
const DailyRewardPermissionRead = 2;
const DailyRewardPermissionWrite = 0;
const DailyRewardCollectionName = 'reward';
const DailyRewardCollectionKey = 'daily';
function getLastDailyRewardObject(context, logger, nk, payload) {
    if (!context.userId) {
        throw Error('No user ID in context');
    }
    if (payload) {
        throw Error('No input allowed');
    }
    var objectId = {
        collection: DailyRewardCollectionName,
        key: DailyRewardCollectionKey,
        userId: context.userId,
    };
    var objects;
    try {
        objects = nk.storageRead([objectId]);
    }
    catch (error) {
        logger.error('storageRead error: %s', error);
        throw error;
    }
    var dailyReward = {
        lastClaimUnix: 0,
        totalDay: 0,
    };
    objects.forEach(function (object) {
        if (object.key == DailyRewardCollectionKey) {
            dailyReward = object.value;
        }
    });
    return dailyReward;
}
function getTotalDayConnected(dailyReward) {
    if (!dailyReward.totalDay) {
        dailyReward.totalDay = 0;
    }
    return dailyReward.totalDay;
}
function rpcCanClaimDailyReward(context, logger, nk, payload) {
    var dailyReward = getLastDailyRewardObject(context, logger, nk, payload);
    var response = {
        canClaimDailyReward: isDailyResetDue(dailyReward.lastClaimUnix),
        totalDayConnected: dailyReward.totalDay,
    };
    var result = JSON.stringify(response);
    logger.debug('rpcCanClaimDailyReward response: %q', result);
    return result;
}
function rpcClaimDailyReward(context, logger, nk, payload) {
    var reward = {
        coinsReceived: 0,
        gemsReceived: 0,
        blastReceived: null,
        itemReceived: null,
    };
    var dailyReward = getLastDailyRewardObject(context, logger, nk, payload);
    if (isDailyResetDue(dailyReward.lastClaimUnix)) {
        var totalDay = getTotalDayConnected(dailyReward);
        reward = getDayReward(totalDay);
        var notification = {
            code: notificationOpCodes.CURENCY,
            content: reward,
            persistent: false,
            subject: "You've received a new item",
            userId: context.userId,
        };
        if (reward.coinsReceived != 0) {
            updateWalletWithCurrency(nk, context.userId, Currency.Coins, reward.coinsReceived);
            notification = {
                code: notificationOpCodes.CURENCY,
                content: reward,
                persistent: false,
                subject: "You've received a new currency",
                userId: context.userId,
            };
            try {
                nk.notificationsSend([notification]);
            }
            catch (error) {
                logger.error('notificationsSend error: %q', error);
                throw error;
            }
        }
        if (reward.gemsReceived != 0) {
            updateWalletWithCurrency(nk, context.userId, Currency.Gems, reward.gemsReceived);
            notification = {
                code: notificationOpCodes.CURENCY,
                content: reward,
                persistent: false,
                subject: "You've received a new currency",
                userId: context.userId,
            };
            try {
                nk.notificationsSend([notification]);
            }
            catch (error) {
                logger.error('notificationsSend error: %q', error);
                throw error;
            }
        }
        if (reward.blastReceived != null) {
            addBlast(nk, logger, context.userId, reward.blastReceived);
        }
        if (reward.itemReceived != null) {
            addItem(nk, logger, context.userId, reward.itemReceived);
        }
        dailyReward.lastClaimUnix = msecToSec(Date.now());
        dailyReward.totalDay = totalDay + 1;
        var write = {
            collection: DailyRewardCollectionName,
            key: DailyRewardCollectionKey,
            permissionRead: DailyRewardPermissionRead,
            permissionWrite: DailyRewardPermissionWrite,
            value: dailyReward,
            userId: context.userId,
        };
        if (dailyReward.version) {
            write.version = dailyReward.version;
        }
        // Update daily reward storage object for user.
        try {
            nk.storageWrite([write]);
        }
        catch (error) {
            logger.error('storageWrite error: %q', error);
            throw error;
        }
    }
    var result = JSON.stringify(reward);
    logger.debug('rpcClaimDailyReward response: %q', result);
    return result;
}
function getDayReward(totalDay) {
    return allReward[totalDay % allReward.length];
}
// Data
const allReward = [
    { coinsReceived: 0, gemsReceived: 5, blastReceived: null, itemReceived: null },
    { coinsReceived: 750, gemsReceived: 0, blastReceived: null, itemReceived: null },
    { coinsReceived: 0, gemsReceived: 15, blastReceived: null, itemReceived: null },
    { coinsReceived: 2000, gemsReceived: 0, blastReceived: null, itemReceived: null },
    { coinsReceived: 0, gemsReceived: 30, blastReceived: null, itemReceived: null },
    { coinsReceived: 5000, gemsReceived: 0, blastReceived: null, itemReceived: null },
    {
        coinsReceived: 0, gemsReceived: 0, blastReceived: {
            uuid: generateUUID(),
            data_id: Clawball.id,
            exp: calculateExperienceFromLevel(10),
            iv: getRandomIV(),
            boss: false,
            shiny: true,
            activeMoveset: getRandomActiveMoveset(Clawball, calculateExperienceFromLevel(10))
        }, itemReceived: null
    },
];
const rpcLoadAllDailyReward = function () {
    return JSON.stringify(allReward);
};
const LeaderboardTrophyId = "leaderboard_trophy";
const LeaderboardTotalBlastDefeatedId = "leaderboard_blast_defeated";
const LeaderboardBlastDefeatedAreaId = "leaderboard_blast_defeated_area_";
const LeaderboardBestStageAreaId = "leaderboard_best_stage_area_";
function createAreaLeaderboards(nk, logger, ctx) {
    for (const area of allArea) {
        // Leaderboard pour les meilleurs stages dans la zone
        const bestStageLeaderboardId = `${LeaderboardBestStageAreaId}${area.id}`;
        createLeaderboard(nk, logger, bestStageLeaderboardId, "best" /* nkruntime.Operator.BEST */);
        // Leaderboard pour les blasts vaincus dans la zone
        const blastDefeatedLeaderboardId = `${LeaderboardBlastDefeatedAreaId}${area.id}`;
        createLeaderboard(nk, logger, blastDefeatedLeaderboardId, "increment" /* nkruntime.Operator.INCREMENTAL */);
    }
}
function createLeaderboard(nk, logger, id, operator) {
    const authoritative = true;
    const sort = "descending" /* nkruntime.SortOrder.DESCENDING */;
    const reset = '0 0 1 * *';
    try {
        nk.leaderboardCreate(id, authoritative, sort, operator, reset, undefined);
        logger.info(`Leaderboard '${id}' created successfully.`);
    }
    catch (error) {
        logger.error(`Failed to create leaderboard '${id}': ${error}`);
    }
}
let leaderboardReset = function (ctx, logger, nk, leaderboard, reset) {
    if (leaderboard.id !== LeaderboardTrophyId) {
        return;
    }
    let result = nk.leaderboardRecordsList(leaderboard.id, undefined, undefined, undefined, reset);
    // If leaderboard is top tier and has 10 or more players, relegate bottom 3 players
    result.records.forEach(function (r) {
        // Enlever /2 au dessus de 400 tr
        // nk.leaderboardRecordWrite(bottomTierId, r.ownerId, r.username, r.score, r.subscore, null, null);
        // nk.leaderboardRecordDelete(topTierId, r.ownerId);
    });
};
function writeRecordLeaderboard(nk, logger, userId, leaderboardId, score, operator) {
    try {
        nk.leaderboardsGetId([leaderboardId]);
    }
    catch (error) {
        logger.error("Leaderboard dont exist error: %s", JSON.stringify(error));
    }
    const username = nk.accountGetId(userId).user.username;
    try {
        nk.leaderboardRecordWrite(leaderboardId, userId, username, score, 0, undefined, operator);
    }
    catch (error) {
        logger.error("Leaderboard write error: %s", JSON.stringify(error));
    }
}
function writeIncrementalRecordLeaderboard(nk, logger, userId, leaderboardId, score) {
    const incrementType = score > 0 ? "increment" /* nkruntime.OverrideOperator.INCREMENTAL */ : "decrement" /* nkruntime.OverrideOperator.DECREMENTAL */;
    writeRecordLeaderboard(nk, logger, userId, leaderboardId, score, incrementType);
}
function writeBestRecordLeaderboard(nk, logger, userId, leaderboardId, score) {
    writeRecordLeaderboard(nk, logger, userId, leaderboardId, score, "best" /* nkruntime.OverrideOperator.BEST */);
}
const BlastTrackerCollection = "blasts_tracker_collection";
const BlastTrackerKey = "blasts_tracker_collection_key";
const PermissionRead = 2;
const PermissionWrite = 0;
function initializeBlastTrackerData(userId, nk, logger) {
    const records = nk.storageRead([{ collection: BlastTrackerCollection, key: BlastTrackerKey, userId }]);
    if (records.length === 0) {
        const initialData = {};
        for (const blast of blastPedia) {
            initialData[blast.id] = { versions: {
                    1: { catched: false, rewardClaimed: false },
                    2: { catched: false, rewardClaimed: false },
                    3: { catched: false, rewardClaimed: false }
                } };
        }
        try {
            nk.storageWrite([{
                    collection: BlastTrackerCollection,
                    key: BlastTrackerKey,
                    userId,
                    value: initialData,
                    permissionRead: PermissionRead,
                    permissionWrite: PermissionWrite,
                }]);
        }
        catch (e) {
            logger.error("initializePlayerBlastData storageWrite error: %q", e);
            throw e;
        }
    }
}
function markMonsterCaptured(userId, monsterId, version, nk, logger) {
    var _a;
    const records = nk.storageRead([{ collection: BlastTrackerCollection, key: BlastTrackerKey, userId }]);
    if (records.length === 0) {
        throw new Error("No monster capture data found for user");
    }
    const playerData = records[0].value;
    const versionData = (_a = playerData[monsterId]) === null || _a === void 0 ? void 0 : _a.versions;
    if (!versionData) {
        throw new Error("Monster data not found");
    }
    if (!versionData[version]) {
        versionData[version] = { catched: false, rewardClaimed: false };
    }
    if (versionData[version].catched) {
        return;
    }
    versionData[version].catched = true;
    try {
        nk.storageWrite([{
                collection: BlastTrackerCollection,
                key: BlastTrackerKey,
                userId,
                value: playerData,
                version: records[0].version,
                permissionRead: PermissionRead,
                permissionWrite: PermissionWrite,
            }]);
    }
    catch (e) {
        logger.error("markMonsterCaptured storageWrite error: %q", e);
        throw e;
    }
}
function rpcGetAllBlastTrackerData(context, logger, nk, payload) {
    const userId = context.userId;
    if (!userId) {
        throw new Error("User not authenticated");
    }
    const records = nk.storageRead([{ collection: BlastTrackerCollection, key: BlastTrackerKey, userId }]);
    if (records.length === 0) {
        throw new Error("No monster capture data found");
    }
    return JSON.stringify(records[0].value);
}
function rpcClaimFirstCaptureReward(context, logger, nk, payload) {
    const userId = context.userId;
    if (!userId) {
        throw new Error("User not authenticated");
    }
    const dataInput = JSON.parse(payload);
    if (!dataInput.monsterId || dataInput.version === undefined) {
        throw new Error("Invalid input");
    }
    const records = nk.storageRead([{ collection: BlastTrackerCollection, key: BlastTrackerKey, userId }]);
    if (records.length === 0) {
        throw new Error("No monster capture data found");
    }
    const playerData = records[0].value;
    if (!playerData[dataInput.monsterId] || !playerData[dataInput.monsterId].versions) {
        throw new Error("Monster data not found");
    }
    const monsterVersions = playerData[dataInput.monsterId].versions;
    if (!monsterVersions[dataInput.version] || !monsterVersions[dataInput.version].catched) {
        throw new Error("Monster/version not captured");
    }
    if (monsterVersions[dataInput.version].rewardClaimed) {
        throw new Error("Reward already claimed for this monster/version");
    }
    monsterVersions[dataInput.version].rewardClaimed = true;
    try {
        nk.storageWrite([{
                collection: BlastTrackerCollection,
                key: BlastTrackerKey,
                userId: userId,
                value: playerData,
                version: records[0].version,
                permissionRead: PermissionRead,
                permissionWrite: PermissionWrite,
            }]);
    }
    catch (e) {
        logger.error("storageWrite error: %q", e);
        throw e;
    }
    const reward = getRewardForMonsterVersion(dataInput.version);
    return JSON.stringify({ success: true, reward });
}
function getRewardForMonsterVersion(version) {
    switch (version) {
        case 1:
            return {
                coinsReceived: 200,
                gemsReceived: 0,
                blastReceived: null,
                itemReceived: null,
            };
        case 2:
            return {
                coinsReceived: 1000,
                gemsReceived: 0,
                blastReceived: null,
                itemReceived: null,
            };
        case 3:
            return {
                coinsReceived: 0,
                gemsReceived: 10,
                blastReceived: null,
                itemReceived: null,
            };
        default:
            return {
                coinsReceived: 0,
                gemsReceived: 0,
                blastReceived: null,
                itemReceived: null,
            };
    }
}
var OpCodes;
(function (OpCodes) {
    OpCodes[OpCodes["MATCH_START"] = 10] = "MATCH_START";
    OpCodes[OpCodes["PLAYER_WAIT"] = 15] = "PLAYER_WAIT";
    OpCodes[OpCodes["PLAYER_ATTACK"] = 20] = "PLAYER_ATTACK";
    OpCodes[OpCodes["PLAYER_USE_ITEM"] = 30] = "PLAYER_USE_ITEM";
    OpCodes[OpCodes["PLAYER_CHANGE_BLAST"] = 40] = "PLAYER_CHANGE_BLAST";
    OpCodes[OpCodes["PLAYER_READY"] = 50] = "PLAYER_READY";
    OpCodes[OpCodes["PLAYER_LEAVE"] = 51] = "PLAYER_LEAVE";
    OpCodes[OpCodes["ENEMY_READY"] = 55] = "ENEMY_READY";
    OpCodes[OpCodes["NEW_BATTLE_TURN"] = 60] = "NEW_BATTLE_TURN";
    OpCodes[OpCodes["PLAYER_MUST_CHANGE_BLAST"] = 61] = "PLAYER_MUST_CHANGE_BLAST";
    OpCodes[OpCodes["NEW_OFFER_TURN"] = 80] = "NEW_OFFER_TURN";
    OpCodes[OpCodes["PLAYER_CHOOSE_OFFER"] = 81] = "PLAYER_CHOOSE_OFFER";
    OpCodes[OpCodes["NEW_BLAST"] = 90] = "NEW_BLAST";
    OpCodes[OpCodes["MATCH_END"] = 100] = "MATCH_END";
    OpCodes[OpCodes["ERROR_SERV"] = 404] = "ERROR_SERV";
    OpCodes[OpCodes["DEBUG"] = 500] = "DEBUG";
})(OpCodes || (OpCodes = {}));
const healManaPerRound = 20;
const healManaPerWait = 50;
var BattleState;
(function (BattleState) {
    BattleState[BattleState["None"] = 0] = "None";
    BattleState[BattleState["Start"] = 1] = "Start";
    BattleState[BattleState["Waiting"] = 2] = "Waiting";
    BattleState[BattleState["Ready"] = 3] = "Ready";
    BattleState[BattleState["ResolveTurn"] = 4] = "ResolveTurn";
    BattleState[BattleState["WaitForPlayerSwap"] = 5] = "WaitForPlayerSwap";
    BattleState[BattleState["WaitForPlayerChooseOffer"] = 6] = "WaitForPlayerChooseOffer";
    BattleState[BattleState["End"] = 7] = "End";
})(BattleState || (BattleState = {}));
var PlayerState;
(function (PlayerState) {
    PlayerState[PlayerState["None"] = 0] = "None";
    PlayerState[PlayerState["Busy"] = 1] = "Busy";
    PlayerState[PlayerState["Ready"] = 2] = "Ready";
})(PlayerState || (PlayerState = {}));
var TurnType;
(function (TurnType) {
    TurnType[TurnType["None"] = 0] = "None";
    TurnType[TurnType["Attack"] = 1] = "Attack";
    TurnType[TurnType["Item"] = 2] = "Item";
    TurnType[TurnType["Swap"] = 3] = "Swap";
    TurnType[TurnType["Wait"] = 4] = "Wait";
    TurnType[TurnType["Status"] = 5] = "Status";
})(TurnType || (TurnType = {}));
//#region Damage Calculation
function calculateDamage(attackerLevel, attackerAttack, defenderDefense, attackType, defenderType, movePower, meteo, logger) {
    const weatherModifier = calculateWeatherModifier(meteo, attackType);
    const typeMultiplier = getTypeMultiplier(attackType, defenderType, logger);
    const baseDamage = ((2 * attackerLevel / 5 + 2) * movePower * (attackerAttack / defenderDefense)) / 50;
    const damage = baseDamage * typeMultiplier * weatherModifier;
    return Math.floor(damage);
}
function getTypeMultiplier(moveType, defenderType, logger) {
    switch (moveType) {
        case Type.Fire:
            switch (defenderType) {
                case Type.Grass:
                    return 2;
                case Type.Water:
                    return 0.5;
                default:
                    return 1;
            }
        case Type.Water:
            switch (defenderType) {
                case Type.Fire:
                    return 2;
                case Type.Grass:
                    return 0.5;
                default:
                    return 1;
            }
        case Type.Grass:
            switch (defenderType) {
                case Type.Water:
                    return 2;
                case Type.Fire:
                    return 0.5;
                default:
                    return 1;
            }
        case Type.Normal:
            switch (defenderType) {
                case Type.Light:
                    return 0.5;
                case Type.Dark:
                    return 0.5;
                default:
                    return 1;
            }
        case Type.Ground:
            switch (defenderType) {
                case Type.Electric:
                    return 2;
                case Type.Fly:
                    return 0;
                default:
                    return 1;
            }
        case Type.Fly:
            switch (defenderType) {
                case Type.Electric:
                    return 0;
                case Type.Ground:
                    return 2;
                default:
                    return 1;
            }
        case Type.Electric:
            switch (defenderType) {
                case Type.Ground:
                    return 0;
                case Type.Fly:
                    return 2;
                default:
                    return 1;
            }
        case Type.Light:
            switch (defenderType) {
                case Type.Dark:
                    return 2;
                case Type.Normal:
                    return 2;
                case Type.Light:
                    return 0.5;
                default:
                    return 1;
            }
        case Type.Dark:
            switch (defenderType) {
                case Type.Light:
                    return 2;
                case Type.Normal:
                    return 2;
                case Type.Dark:
                    return 0.5;
                default:
                    return 1;
            }
        default:
            return 1;
    }
}
function calculateWeatherModifier(weather, moveType) {
    let modifier = 1.0;
    switch (weather) {
        case Meteo.Sun:
            if (moveType === Type.Fire) {
                modifier = 1.5;
            }
            break;
        case Meteo.Rain:
            if (moveType === Type.Water) {
                modifier = 1.5;
            }
            break;
        case Meteo.Leaves:
            if (moveType === Type.Grass) {
                modifier = 1.5;
            }
            break;
        case Meteo.None:
            break;
    }
    return modifier;
}
function calculateEffectWithProbability(blast, move, effectData) {
    const statusEffectProbabilities = {
        [MoveEffect.Burn]: 0.1,
        [MoveEffect.Seeded]: 0.1,
        [MoveEffect.Wet]: 0.1,
        [MoveEffect.ManaExplosion]: 0.2,
        [MoveEffect.HpExplosion]: 0.2,
        [MoveEffect.ManaRestore]: 0.2,
        [MoveEffect.HpRestore]: 0.2,
        [MoveEffect.AttackBoost]: 0.5,
        [MoveEffect.DefenseBoost]: 0.5,
        [MoveEffect.SpeedBoost]: 0.5,
        [MoveEffect.AttackReduce]: 0.5,
        [MoveEffect.DefenseReduce]: 0.5,
        [MoveEffect.SpeedReduce]: 0.5,
        [MoveEffect.Cleanse]: 0.5,
    };
    const effectProbability = statusEffectProbabilities[effectData.effect];
    if (Math.random() < effectProbability) {
        return { blast: applyEffect(blast, move, effectData), moveEffect: effectData };
    }
    return { blast, moveEffect: { effect: MoveEffect.None, effectModifier: 0, effectTarget: Target.None } };
}
function applyEffect(blast, move, effectData) {
    var isStatusMove = move.attackType === AttackType.Status;
    switch (effectData.effect) {
        case MoveEffect.Burn:
            blast.status = Status.Burn;
            break;
        case MoveEffect.Seeded:
            blast.status = Status.Seeded;
            break;
        case MoveEffect.Wet:
            blast.status = Status.Wet;
            break;
        case MoveEffect.ManaExplosion:
            const manaDmg = Math.floor(blast.maxMana / 2);
            blast.hp = Math.max(0, blast.hp - manaDmg);
            blast.mana = Math.floor(blast.mana / 2);
            break;
        case MoveEffect.HpExplosion:
            const hpCost = Math.floor(blast.maxHp / 3);
            blast.hp = Math.max(0, blast.hp - hpCost);
            break;
        case MoveEffect.ManaRestore:
            blast.mana = Math.min(blast.maxMana, blast.mana + move.power);
            break;
        case MoveEffect.HpRestore:
            blast.hp = Math.min(blast.maxHp, blast.hp + move.power);
            break;
        case MoveEffect.AttackBoost:
            blast.modifiers = updateStatModifier(blast.modifiers, Stats.Attack, isStatusMove ? effectData.effectModifier : 1);
            break;
        case MoveEffect.DefenseBoost:
            blast.modifiers = updateStatModifier(blast.modifiers, Stats.Defense, isStatusMove ? effectData.effectModifier : 1);
            break;
        case MoveEffect.SpeedBoost:
            blast.modifiers = updateStatModifier(blast.modifiers, Stats.Speed, isStatusMove ? effectData.effectModifier : 1);
            break;
        case MoveEffect.AttackReduce:
            blast.modifiers = updateStatModifier(blast.modifiers, Stats.Attack, isStatusMove ? -effectData.effectModifier : -1);
            break;
        case MoveEffect.DefenseReduce:
            blast.modifiers = updateStatModifier(blast.modifiers, Stats.Defense, isStatusMove ? -effectData.effectModifier : -1);
            break;
        case MoveEffect.SpeedReduce:
            blast.modifiers = updateStatModifier(blast.modifiers, Stats.Speed, isStatusMove ? -effectData.effectModifier : -1);
            break;
        case MoveEffect.Cleanse:
            blast.status = Status.None;
            break;
    }
    return blast;
}
function getStatModifier(stat, modifiers) {
    var modifier = modifiers.find(m => m.stats === stat);
    if (!modifier)
        return 1;
    const amount = modifier.amount;
    if (amount > 0) {
        if (amount === 1)
            return 1.5;
        if (amount === 2)
            return 2;
        return 3;
    }
    else if (amount < 0) {
        if (amount === -1)
            return 0.8;
        if (amount === -2)
            return 0.6;
        return 0.2;
    }
    return 1;
}
function updateStatModifier(mods, stat, delta) {
    const index = mods.findIndex((m) => m.stats === stat);
    if (index >= 0) {
        mods[index].amount += delta;
        if (mods[index].amount <= 0)
            mods.splice(index, 1);
    }
    else if (delta > 0) {
        mods.push({ stats: stat, amount: delta });
    }
    return mods;
}
function applyStatusEffectAtEndOfTurn(blast, otherBlast) {
    switch (blast.status) {
        case Status.Burn:
            blast.hp = Math.max(0, blast.hp - Math.floor(blast.maxHp / 16));
            break;
        case Status.Seeded:
            const healAmount = Math.floor(blast.maxHp / 16);
            blast.hp = Math.max(0, blast.hp - healAmount);
            otherBlast.hp = Math.min(otherBlast.maxHp, otherBlast.hp + healAmount);
            break;
        case Status.Wet:
            blast.mana = Math.max(0, blast.mana - Math.floor(blast.maxMana / 32));
            break;
        default:
            break;
    }
    return { blast, otherBlast };
}
function addPlatformType(p_platform, newType) {
    if (p_platform.length < 3) {
        p_platform.push(newType);
    }
    else {
        p_platform.shift();
        p_platform.push(newType);
    }
    return p_platform;
}
function getAmountOfPlatformTypeByType(p_platform, typeToCount) {
    return p_platform.filter(type => type === typeToCount).length;
}
function removePlatformTypeByType(p_platform, typeToRemove, numberToRemove) {
    let removedCount = 0;
    for (let i = p_platform.length - 1; i >= 0 && removedCount < numberToRemove; i--) {
        if (p_platform[i] === typeToRemove) {
            p_platform.splice(i, 1);
            removedCount++;
        }
    }
    return p_platform;
}
//#region Health and Mana and Status
function isAllBlastDead(allPlayerBlasts) {
    return allPlayerBlasts.every((blast) => blast.hp === 0);
}
function isBlastAlive(blast) {
    return blast.hp > 0;
}
function calculateManaRecovery(maxMana, currentMana, useWait = false) {
    const normalRecovery = Math.floor(maxMana * 0.2);
    const waitRecovery = Math.floor(maxMana * 0.5);
    let recoveredMana = currentMana + (useWait ? waitRecovery : normalRecovery);
    if (recoveredMana > maxMana) {
        recoveredMana = maxMana;
    }
    return recoveredMana;
}
function healHealthBlast(blast, amount) {
    blast.hp += amount;
    if (blast.hp > blast.maxHp)
        blast.hp = blast.maxHp;
    return blast;
}
function healManaBlast(blast, amount) {
    blast.mana += amount;
    if (blast.mana > blast.maxMana)
        blast.mana = blast.maxMana;
    return blast;
}
function healStatusBlast(blast, status) {
    if (blast.status == status || status == Status.All)
        blast.status = Status.None;
    return blast;
}
// #region round logic
function getFasterBlast(blast1, blast2) {
    return blast1.speed > blast2.speed;
}
function getRandomMeteo() {
    const values = Object.values(Meteo).filter(value => typeof value === "number");
    return randomElement(values);
}
function getRandomUsableMove(allMoves, currentMana, currentPlatformTypes) {
    const usableMoves = [];
    for (const move of allMoves) {
        switch (move.attackType) {
            case AttackType.Normal:
            case AttackType.Status:
                if (currentMana < move.cost)
                    continue;
                break;
            case AttackType.Special: {
                const energyCount = getAmountOfPlatformTypeByType(currentPlatformTypes, move.type);
                if (energyCount < move.cost)
                    continue;
                break;
            }
        }
        usableMoves.push(move);
    }
    if (usableMoves.length === 0) {
        return -1;
    }
    const randomIndex = Math.floor(Math.random() * usableMoves.length);
    return allMoves.indexOf(usableMoves[randomIndex]);
}
function compareActionPriorities(p1ActionType, p2ActionType) {
    const p1Priority = getActionPriority(p1ActionType);
    const p2Priority = getActionPriority(p2ActionType);
    return p1Priority >= p2Priority;
}
function getActionPriority(turnType) {
    switch (turnType) {
        case TurnType.Attack:
            return 2;
        case TurnType.Swap:
            return 4;
        case TurnType.Item:
            return 3;
        case TurnType.Wait:
            return 1;
        default:
            return 0;
    }
}
function performAttackSequence(state, dispatcher, nk, logger) {
    const p1Blast = state.p1Blasts[state.p1Index];
    const p2Blast = state.p2Blasts[state.p2Index];
    const p1Move = getMoveById(p1Blast.activeMoveset[state.turnStateData.p1TurnData.index]);
    const p2Move = getMoveById(p2Blast.activeMoveset[state.turnStateData.p2TurnData.index]);
    const p1First = p1Move.priority > p2Move.priority ||
        (p1Move.priority === p2Move.priority && getFasterBlast(p1Blast, p2Blast));
    logger.debug("P1 Move: %s, P2 Move: %s, P1 First: %s", p1Move.id, p2Move.id, p1First);
    if (p1First) {
        executePlayerAttack(true, state, logger, dispatcher);
        if (state.battleState === BattleState.ResolveTurn) {
            executePlayerAttack(false, state, logger, dispatcher);
        }
    }
    else {
        executePlayerAttack(false, state, logger, dispatcher);
        if (state.battleState === BattleState.ResolveTurn) {
            executePlayerAttack(true, state, logger, dispatcher);
        }
    }
    return state;
}
function executePlayerAttack(isP1, state, logger, dispatcher) {
    const p1Blast = state.p1Blasts[state.p1Index];
    const p2Blast = state.p2Blasts[state.p2Index];
    const p1Move = getMoveById(p1Blast.activeMoveset[state.turnStateData.p1TurnData.index]);
    const p2Move = getMoveById(p2Blast.activeMoveset[state.turnStateData.p2TurnData.index]);
    const move = isP1 ? p1Move : p2Move;
    const attacker = isP1 ? p1Blast : p2Blast;
    const defender = isP1 ? p2Blast : p1Blast;
    const attackerPlatform = isP1 ? state.player1Platform : state.player2Platform;
    const setAttacker = (b) => {
        if (isP1)
            state.p1Blasts[state.p1Index] = b;
        else
            state.p2Blasts[state.p2Index] = b;
    };
    const setDefender = (b) => {
        if (isP1)
            state.p2Blasts[state.p2Index] = b;
        else
            state.p1Blasts[state.p1Index] = b;
    };
    const turnData = isP1 ? state.turnStateData.p1TurnData : state.turnStateData.p2TurnData;
    ExecuteAttack({
        move,
        attacker,
        defender,
        attackerPlatforms: attackerPlatform,
        setAttacker,
        setDefender,
        getTurnData: () => turnData,
        setMoveDamage: dmg => turnData.moveDamage = dmg,
        setMoveEffect: eff => turnData.moveEffects = eff,
        meteo: state.meteo,
        dispatcher
    }, logger);
    state = checkIfMatchContinue(state);
    return state;
}
function checkIfMatchContinue(state) {
    const playerBlast = state.p1Blasts[state.p1Index];
    const opponentBlast = state.p2Blasts[state.p2Index];
    const opponentAlive = isBlastAlive(opponentBlast);
    const playerAlive = isBlastAlive(playerBlast);
    const allPlayerDead = isAllBlastDead(state.p1Blasts);
    const allOpponentDead = isAllBlastDead(state.p2Blasts);
    if (allOpponentDead) {
        state.battleState = BattleState.End;
    }
    else if (!opponentAlive) {
        state.battleState = BattleState.WaitForPlayerSwap;
    }
    else if (allPlayerDead) {
        state.battleState = BattleState.End;
    }
    else if (!playerAlive) {
        state.battleState = BattleState.WaitForPlayerSwap;
    }
    return state;
}
function trySwapBlast(currentIndex, turnData, blasts, updateIndex, state, dispatcher) {
    if (turnData.type !== TurnType.Swap)
        return false;
    const targetIndex = clamp(turnData.index, 0, blasts.length - 1);
    if (currentIndex === targetIndex) {
        ErrorFunc(state, "Cannot change actual blast with actual blast", dispatcher, BattleState.Ready);
        return true;
    }
    if (!isBlastAlive(blasts[targetIndex])) {
        ErrorFunc(state, "Cannot change actual blast with dead blast in Ready", dispatcher, BattleState.Ready);
        return true;
    }
    updateIndex(targetIndex);
    return false;
}
// #region Others
function addExpOnBlastInGame(nk, logger, playerId, currentPlayerBlast, enemyBlast) {
    let expToAdd = calculateExperienceGain(getBlastDataById(currentPlayerBlast.data_id).expYield, calculateLevelFromExperience(enemyBlast.exp), calculateLevelFromExperience(currentPlayerBlast.exp));
    addExpOnBlast(nk, logger, playerId, currentPlayerBlast.uuid, expToAdd);
}
function calculateCaptureProbability(currentHP, maxHP, catchRate, trapBonus, statusBonus) {
    const hpFactor = (3 * maxHP - 2 * currentHP) / (3 * maxHP);
    const baseProbability = catchRate * hpFactor * trapBonus * statusBonus;
    const captureProbability = Math.min(Math.max(baseProbability, 0), 1);
    return captureProbability;
}
function isBlastCaptured(currentHP, maxHP, catchRate, trapBonus, statusBonus) {
    const captureProbability = calculateCaptureProbability(currentHP, maxHP, catchRate, trapBonus, statusBonus) * 100;
    const randomValue = Math.random() * 100;
    return randomValue <= captureProbability;
}
function isShiny(probability = 1 / 1024) {
    return Math.random() < probability;
}
function EndLoopDebug(logger, state) {
    var _a, _b, _c, _d;
    logger.debug('______________ END LOOP BATTLE ______________');
    logger.debug('Wild blast HP : %h, Mana : %m', (_a = state.p2Blasts) === null || _a === void 0 ? void 0 : _a[state.p2Index].hp, (_b = state.p2Blasts) === null || _b === void 0 ? void 0 : _b[state.p2Index].mana);
    logger.debug('Player blast HP : %h, Mana : %m', (_c = state.p1Blasts[state.p1Index]) === null || _c === void 0 ? void 0 : _c.hp, (_d = state.p1Blasts[state.p1Index]) === null || _d === void 0 ? void 0 : _d.mana);
}
// region Setup 
function rpcCreatePvEBattle(context, logger, nk) {
    var matchId = nk.matchCreate('PvEBattle', {});
    return JSON.stringify(matchId);
}
const PvEinitMatch = function (ctx, logger, nk, params) {
    const PvEBattleData = {
        emptyTicks: 0,
        presences: {},
        battleState: BattleState.Start,
        player1State: PlayerState.Busy,
        player1Id: "",
        player2State: PlayerState.Busy,
        player2Id: "",
        p1Index: 0,
        p1Blasts: [],
        player1Items: [],
        player1Platform: [],
        p2Index: 0,
        p2Blasts: [],
        player2Platform: [],
        indexProgression: 1,
        blastDefeated: 0,
        blastCatched: 0,
        meteo: Meteo.None,
        offerTurnStateData: {
            offerOne: {
                type: OfferType.None,
                coinsAmount: 0,
                gemsAmount: 0,
                blast: null,
                item: null,
            },
            offerTwo: {
                type: OfferType.None,
                coinsAmount: 0,
                gemsAmount: 0,
                blast: null,
                item: null,
            },
            offerThree: {
                type: OfferType.None,
                coinsAmount: 0,
                gemsAmount: 0,
                blast: null,
                item: null,
            }
        },
        turnStateData: {
            p1TurnData: {
                type: TurnType.None,
                index: 0,
                moveDamage: 0,
                moveEffects: [],
            },
            p2TurnData: {
                type: TurnType.None,
                index: 0,
                moveDamage: 0,
                moveEffects: [],
            },
            catched: false
        }
    };
    return {
        state: PvEBattleData,
        tickRate: 2,
        label: ''
    };
};
const PvEmatchJoinAttempt = function (ctx, logger, nk, dispatcher, tick, state, presence, metadata) {
    logger.debug('%q attempted to join PvP match', ctx.userId);
    const playerCount = Object.keys(state.presences).length;
    if (playerCount >= 1) {
        return { state, accept: false, rejectMessage: "Match already full" };
    }
    return { state, accept: true };
};
const PvEmatchJoin = function (ctx, logger, nk, dispatcher, tick, state, presences) {
    for (const presence of presences) {
        state.emptyTicks = 0;
        state.presences[presence.userId] = presence;
    }
    return {
        state
    };
};
const PvEmatchLeave = function (ctx, logger, nk, dispatcher, tick, state, presences) {
    for (let presence of presences) {
        logger.info("Player: %s left match: %s.", presence.userId, ctx.matchId);
        if (state.player1Id == presence.userId) {
            PvEPlayerLeave(nk, state, logger);
            dispatcher.broadcastMessage(OpCodes.MATCH_END, JSON.stringify(true));
        }
        if (state.player2Id == presence.userId) {
            PvEPlayerLeave(nk, state, logger);
            dispatcher.broadcastMessage(OpCodes.MATCH_END, JSON.stringify(true));
        }
        state.presences[presence.userId] = null;
    }
    for (let userID in state.presences) {
        if (state.presences[userID] === null) {
            delete state.presences[userID];
        }
    }
    if (ConnectedPlayers(state) === 0) {
        return null;
    }
    return {
        state
    };
};
// region MatchLoop 
const PvEmatchLoop = function (ctx, logger, nk, dispatcher, tick, state, messages) {
    var _a;
    switch (state.battleState) {
        case BattleState.Start:
            logger.debug('______________ START BATTLE ______________');
            const keys = Object.keys(state.presences);
            const player1_presence = state.presences[keys[0]];
            state.player1Id = player1_presence.userId;
            var allPlayer1BlastInBattle = getDeckBlast(nk, logger, state.player1Id);
            state.p1Index = 0;
            state.p1Blasts = allPlayer1BlastInBattle;
            var allPlayer1Items = getDeckItem(nk, logger, state.player1Id);
            state.player1Items = allPlayer1Items;
            logger.debug('______________ CREAT NEW BLAST ______________');
            var newBlast = GetNewWildBlast(state, nk, logger);
            state.p2Index = 0;
            state.p2Blasts = [ConvertBlastToBlastEntity(newBlast)];
            const newWildBlast = {
                id: state.p2Blasts[state.p2Index].data_id,
                exp: state.p2Blasts[state.p2Index].exp,
                iv: state.p2Blasts[state.p2Index].iv,
                boss: state.p2Blasts[state.p2Index].boss,
                shiny: state.p2Blasts[state.p2Index].shiny,
                activeMoveset: state.p2Blasts[state.p2Index].activeMoveset,
                status: Status.None
            };
            state.meteo = getRandomMeteo();
            const StartData = {
                newBlastData: newWildBlast,
                meteo: state.meteo,
                turnDelay: 0,
            };
            logger.debug('Random blast with id: %d, lvl: %l appeared', state.p2Blasts[state.p2Index].data_id, calculateLevelFromExperience(state.p2Blasts[state.p2Index].exp));
            state.battleState = BattleState.Waiting;
            dispatcher.broadcastMessage(OpCodes.MATCH_START, JSON.stringify(StartData));
            logger.debug('______________ END START BATTLE ______________');
            break;
        case BattleState.Waiting:
            messages.forEach(function (message) {
                switch (message.opCode) {
                    case OpCodes.PLAYER_READY:
                        state.player1State = PlayerState.Ready;
                        logger.debug('______________ PLAYER 1 READY ______________');
                        break;
                }
            });
            if (state.player1State == PlayerState.Ready) {
                dispatcher.broadcastMessage(OpCodes.ENEMY_READY);
                state.battleState = BattleState.Ready;
                state.turnStateData.p1TurnData = {
                    type: TurnType.None,
                    index: 0,
                    moveDamage: 0,
                    moveEffects: [],
                };
                state.turnStateData.p2TurnData = {
                    type: TurnType.None,
                    index: getRandomUsableMove(getMovesByIds(state.p2Blasts[state.p2Index].activeMoveset), state.p2Blasts[state.p2Index].mana, state.player2Platform),
                    moveDamage: 0,
                    moveEffects: [],
                };
                state.turnStateData.catched = false;
                logger.debug('______________ EVERYONE"S READY ______________');
            }
            break;
        case BattleState.Ready:
            for (const message of messages) {
                const validOpCodes = [
                    OpCodes.PLAYER_ATTACK,
                    OpCodes.PLAYER_USE_ITEM,
                    OpCodes.PLAYER_CHANGE_BLAST,
                    OpCodes.PLAYER_WAIT,
                    OpCodes.PLAYER_LEAVE,
                ];
                if (!validOpCodes.includes(message.opCode)) {
                    ErrorFunc(state, "OP CODE NOT VALID", dispatcher, BattleState.Ready);
                    break;
                }
                const parsed = JSON.parse(nk.binaryToString(message.data));
                logger.debug('Receive Op code : %d, with data : %e', message.opCode, parsed);
                let actionType = parseEnum(parsed.type.toString(), TurnType);
                state.turnStateData.p1TurnData.type = actionType;
                actionType === TurnType.Item ? (state.turnStateData.p1TurnData.itemUse = parsed.data) : (state.turnStateData.p1TurnData.index = (_a = parsed.data) !== null && _a !== void 0 ? _a : 0);
                if (message.opCode == OpCodes.PLAYER_LEAVE) {
                    PvEPlayerLeave(nk, state, logger);
                    dispatcher.broadcastMessage(OpCodes.MATCH_END, JSON.stringify(true));
                }
            }
            const p1Played = state.turnStateData.p1TurnData.type !== TurnType.None;
            if (p1Played) {
                state.player1State = PlayerState.Busy;
                state.player2State = PlayerState.Busy;
                state.battleState = BattleState.ResolveTurn;
            }
            break;
        case BattleState.ResolveTurn:
            switch (state.turnStateData.p1TurnData.type) {
                // region Attack
                case TurnType.Attack:
                    state.turnStateData.p1TurnData.index = clamp(state.turnStateData.p1TurnData.index, 0, 3);
                    let move = getMoveById(state.p1Blasts[state.p1Index].activeMoveset[state.turnStateData.p1TurnData.index]);
                    if (move == null) {
                        ErrorFunc(state, "Player 1 move null", dispatcher, BattleState.Ready);
                        break;
                    }
                    performAttackSequence(state, dispatcher, nk, logger);
                    break;
                //region Player Use Item
                case TurnType.Item:
                    let msgItem = {};
                    msgItem = state.turnStateData.p1TurnData.itemUse;
                    msgItem.index_item = clamp(msgItem.index_item, 0, state.player1Items.length - 1);
                    let item = state.player1Items[msgItem.index_item];
                    if (item == null) {
                        ErrorFunc(state, "Item to use is null", dispatcher, BattleState.Ready);
                        break;
                    }
                    if (item.amount <= 0) {
                        ErrorFunc(state, "U don't have enough item", dispatcher, BattleState.Ready);
                        break;
                    }
                    useItem(nk, logger, state.player1Id, item);
                    var itemData = getItemDataById(item.data_id);
                    switch (itemData.behaviour) {
                        case ITEM_BEHAVIOUR.Heal:
                            state.p1Blasts[msgItem.index_blast] = healHealthBlast(state.p1Blasts[msgItem.index_blast], itemData.gain_amount);
                            break;
                        case ITEM_BEHAVIOUR.Mana:
                            state.p1Blasts[msgItem.index_blast] = healManaBlast(state.p1Blasts[msgItem.index_blast], itemData.gain_amount);
                            break;
                        case ITEM_BEHAVIOUR.Status:
                            state.p1Blasts[msgItem.index_blast] = healStatusBlast(state.p1Blasts[msgItem.index_blast], itemData.status);
                            break;
                        case ITEM_BEHAVIOUR.Catch:
                            var wildBlastCaptured = false;
                            wildBlastCaptured = isBlastCaptured(state.p2Blasts[state.p2Index].hp, state.p2Blasts[state.p2Index].maxHp, getBlastDataById(state.p2Blasts[state.p2Index].data_id).catchRate, itemData.catchRate, 1); // TODO Get status bonus
                            if (wildBlastCaptured) {
                                logger.debug('Wild blast Captured !', wildBlastCaptured);
                                state.battleState = BattleState.End;
                            }
                            state.turnStateData.catched = wildBlastCaptured;
                            break;
                        default:
                    }
                    state.turnStateData.p1TurnData.type = TurnType.Item;
                    executePlayerAttack(false, state, logger, dispatcher);
                    break;
                // region Player Change
                case TurnType.Swap:
                    var msgChangeBlast = clamp(state.turnStateData.p1TurnData.index, 0, state.p1Blasts.length - 1);
                    if (state.p1Index == msgChangeBlast) {
                        ErrorFunc(state, "Cannot change actual blast with actual blast", dispatcher, BattleState.Ready);
                        break;
                    }
                    if (!isBlastAlive(state.p1Blasts[msgChangeBlast])) {
                        ErrorFunc(state, "Cannot change actual blast with dead blast in Ready", dispatcher, BattleState.Ready);
                        break;
                    }
                    state.p1Index = msgChangeBlast;
                    executePlayerAttack(false, state, logger, dispatcher);
                    break;
                // region Player Wait
                case TurnType.Wait:
                    state.p1Blasts[state.p1Index].mana = calculateManaRecovery(state.p1Blasts[state.p1Index].maxMana, state.p1Blasts[state.p1Index].mana, true);
                    executePlayerAttack(false, state, logger, dispatcher);
                    break;
            }
            // region End turn Logic
            ({ blast: state.p1Blasts[state.p1Index], otherBlast: state.p2Blasts[state.p2Index] } = applyStatusEffectAtEndOfTurn(state.p1Blasts[state.p1Index], state.p2Blasts[state.p2Index]));
            ({ blast: state.p2Blasts[state.p2Index], otherBlast: state.p1Blasts[state.p1Index] } = applyStatusEffectAtEndOfTurn(state.p2Blasts[state.p2Index], state.p1Blasts[state.p1Index]));
            checkIfMatchContinue(state);
            if (state.battleState == BattleState.End) {
                if (isBlastAlive(state.p2Blasts[state.p2Index]))
                    state.p2Blasts[state.p2Index].mana = calculateManaRecovery(state.p2Blasts[state.p2Index].maxMana, state.p2Blasts[state.p2Index].mana, false);
                if (isBlastAlive(state.p1Blasts[state.p1Index]))
                    state.p1Blasts[state.p1Index].mana = calculateManaRecovery(state.p1Blasts[state.p1Index].maxMana, state.p1Blasts[state.p1Index].mana, false);
                dispatcher.broadcastMessage(OpCodes.NEW_BATTLE_TURN, JSON.stringify(state.turnStateData));
                break;
            }
            else if (state.battleState === BattleState.WaitForPlayerSwap) {
                state.p2Blasts[state.p2Index].mana = calculateManaRecovery(state.p2Blasts[state.p2Index].maxMana, state.p2Blasts[state.p2Index].mana, false);
                dispatcher.broadcastMessage(OpCodes.NEW_BATTLE_TURN, JSON.stringify(state.turnStateData));
                EndLoopDebug(logger, state);
                break;
            }
            else {
                state.battleState = BattleState.Waiting;
                state.p1Blasts[state.p1Index].mana = calculateManaRecovery(state.p1Blasts[state.p1Index].maxMana, state.p1Blasts[state.p1Index].mana, false);
                state.p2Blasts[state.p2Index].mana = calculateManaRecovery(state.p2Blasts[state.p2Index].maxMana, state.p2Blasts[state.p2Index].mana, false);
                //Send matchTurn
                dispatcher.broadcastMessage(OpCodes.NEW_BATTLE_TURN, JSON.stringify(state.turnStateData));
            }
            EndLoopDebug(logger, state);
            break;
        // region WAIT_FOR_PLAYER_SWAP
        case BattleState.WaitForPlayerSwap:
            messages.forEach(function (message) {
                var _a, _b;
                const validOpCodes = [
                    OpCodes.PLAYER_CHANGE_BLAST,
                ];
                if (!validOpCodes.includes(message.opCode)) {
                    ErrorFunc(state, "OP CODE NOT VALID", dispatcher, BattleState.WaitForPlayerSwap);
                    return;
                }
                logger.debug('______________ PLAYER SWAP BLAST ______________');
                message.data == null ? logger.debug('Receive Op code : %d', message.opCode) : logger.debug('Receive Op code : %d, with data : %e', message.opCode, JSON.parse(nk.binaryToString(message.data)));
                const parsed = JSON.parse(nk.binaryToString(message.data));
                const action = {
                    type: parsed.type,
                    data: parsed.data,
                };
                state.turnStateData.p1TurnData.type = action.type;
                if (message.opCode == OpCodes.PLAYER_CHANGE_BLAST) {
                    state.player1State = PlayerState.Busy;
                    var msgChangeBlast = clamp(action.data, 0, state.p1Blasts.length - 1);
                    if (state.p1Index == msgChangeBlast) {
                        ErrorFunc(state, "Cannot change actual blast with actual blast", dispatcher, BattleState.WaitForPlayerSwap);
                        return;
                    }
                    if (!isBlastAlive(state.p1Blasts[msgChangeBlast])) {
                        ErrorFunc(state, "Cannot change actual blast with dead blast", dispatcher, BattleState.WaitForPlayerSwap);
                        return;
                    }
                    state.p1Index = msgChangeBlast;
                }
                state.battleState = BattleState.Waiting;
                logger.debug('______________ END PLAYER SWAP BLAST ______________');
                logger.debug('Wild blast HP : %h, Mana : %m', state.p2Blasts[state.p2Index].hp, state.p2Blasts[state.p2Index].mana);
                logger.debug('Player blast HP : %h, Mana : %m', (_a = state.p1Blasts[state.p1Index]) === null || _a === void 0 ? void 0 : _a.hp, (_b = state.p1Blasts[state.p1Index]) === null || _b === void 0 ? void 0 : _b.mana);
            });
            break;
        //region CHOOSE OFFER
        case BattleState.WaitForPlayerChooseOffer:
            messages.forEach(function (message) {
                var _a, _b;
                const validOpCodes = [
                    OpCodes.PLAYER_CHOOSE_OFFER,
                ];
                if (!validOpCodes.includes(message.opCode)) {
                    ErrorFunc(state, "OP CODE NOT VALID", dispatcher, BattleState.WaitForPlayerChooseOffer);
                    return;
                }
                logger.debug('______________ PLAYER CHOOSE OFFER ______________');
                message.data == null ? logger.debug('Receive Op code : %d', message.opCode) : logger.debug('Receive Op code : %d, with data : %e', message.opCode, JSON.parse(nk.binaryToString(message.data)));
                if (message.opCode == OpCodes.PLAYER_CHOOSE_OFFER) {
                    state.indexProgression++;
                    state.player1State = PlayerState.Busy;
                    var indexChooseOffer = clamp(JSON.parse(nk.binaryToString(message.data)), 0, 2);
                    let currentOffer = {
                        type: OfferType.None,
                        coinsAmount: 0,
                        gemsAmount: 0,
                        blast: null,
                        item: null,
                    };
                    switch (indexChooseOffer) {
                        case 0:
                            currentOffer = state.offerTurnStateData.offerOne;
                            break;
                        case 1:
                            currentOffer = state.offerTurnStateData.offerTwo;
                            break;
                        case 2:
                            currentOffer = state.offerTurnStateData.offerThree;
                            break;
                    }
                    switch (currentOffer.type) {
                        case OfferType.Blast:
                            addBlast(nk, logger, state.player1Id, currentOffer.blast);
                            break;
                        case OfferType.Item:
                            addItem(nk, logger, state.player1Id, currentOffer.item);
                            break;
                        case OfferType.Coin:
                            updateWalletWithCurrency(nk, state.player1Id, Currency.Coins, currentOffer.coinsAmount);
                            if (getMetadataStat(nk, state.player1Id, "pveBattleButtonAds"))
                                updateWalletWithCurrency(nk, state.player1Id, Currency.Coins, currentOffer.coinsAmount / 2);
                            break;
                        case OfferType.Gem:
                            updateWalletWithCurrency(nk, state.player1Id, Currency.Gems, currentOffer.gemsAmount);
                            if (getMetadataStat(nk, state.player1Id, "pveBattleButtonAds"))
                                updateWalletWithCurrency(nk, state.player1Id, Currency.Gems, currentOffer.gemsAmount / 2);
                            break;
                        case OfferType.None:
                            break;
                    }
                    var newBlast = GetNewWildBlast(state, nk, logger);
                    state.p2Blasts = [ConvertBlastToBlastEntity(newBlast)];
                    const newWildBlast = {
                        id: state.p2Blasts[state.p2Index].data_id,
                        exp: state.p2Blasts[state.p2Index].exp,
                        iv: state.p2Blasts[state.p2Index].iv,
                        boss: state.p2Blasts[state.p2Index].boss,
                        shiny: state.p2Blasts[state.p2Index].shiny,
                        activeMoveset: state.p2Blasts[state.p2Index].activeMoveset,
                        status: Status.None
                    };
                    dispatcher.broadcastMessage(OpCodes.NEW_BLAST, JSON.stringify(newWildBlast));
                }
                state.battleState = BattleState.Waiting;
                logger.debug('______________ END PLAYER CHOOSE OFFER ______________');
                logger.debug('Player blast HP : %h, Mana : %m', (_a = state.p1Blasts[state.p1Index]) === null || _a === void 0 ? void 0 : _a.hp, (_b = state.p1Blasts[state.p1Index]) === null || _b === void 0 ? void 0 : _b.mana);
            });
            break;
        // region END BATTLE
        case BattleState.End:
            const p1_blast = state.p1Blasts[state.p1Index];
            const wildBlast = state.p2Blasts;
            const allPlayerBlastFainted = isAllBlastDead(state.p1Blasts);
            const wildAlive = isBlastAlive(wildBlast[state.p2Index]);
            if (wildAlive == false || state.turnStateData.catched) {
                state.indexProgression++;
                addExpOnBlastInGame(nk, logger, state.player1Id, p1_blast, wildBlast[state.p2Index]);
                if (state.turnStateData.catched) {
                    state.blastCatched++;
                    incrementQuest(state.player1Id, QuestIds.CATCH_BLAST, 1, nk, logger);
                    addBlast(nk, logger, state.player1Id, state.p2Blasts[state.p2Index]);
                }
                else {
                    state.blastDefeated++;
                    incrementQuest(state.player1Id, QuestIds.DEFEAT_BLAST, 1, nk, logger);
                }
                if (state.indexProgression % 5 == 0 && state.indexProgression % 10 != 0) {
                    let items = {
                        offerOne: getRandomOffer(nk, state, logger),
                        offerTwo: getRandomOffer(nk, state, logger),
                        offerThree: getRandomOffer(nk, state, logger),
                    };
                    state.offerTurnStateData = items;
                    dispatcher.broadcastMessage(OpCodes.NEW_OFFER_TURN, JSON.stringify(items));
                    state.battleState = BattleState.WaitForPlayerChooseOffer;
                }
                else {
                    var newBlast = GetNewWildBlast(state, nk, logger);
                    if (state.indexProgression % 10 == 0) {
                        newBlast.exp = calculateExperienceFromLevel(state.indexProgression / 2);
                        newBlast.iv = MaxIV;
                    }
                    ;
                    state.p2Blasts = [ConvertBlastToBlastEntity(newBlast)];
                    const newWildBlast = {
                        id: state.p2Blasts[state.p2Index].data_id,
                        exp: state.p2Blasts[state.p2Index].exp,
                        iv: state.p2Blasts[state.p2Index].iv,
                        boss: state.p2Blasts[state.p2Index].boss,
                        shiny: state.p2Blasts[state.p2Index].shiny,
                        activeMoveset: state.p2Blasts[state.p2Index].activeMoveset,
                        status: Status.None
                    };
                    dispatcher.broadcastMessage(OpCodes.NEW_BLAST, JSON.stringify(newWildBlast));
                    state.battleState = BattleState.Waiting;
                }
                EndLoopDebug(logger, state);
            }
            else if (allPlayerBlastFainted) {
                dispatcher.broadcastMessage(OpCodes.MATCH_END, JSON.stringify(false));
                PvEPlayerLeave(nk, state, logger);
                return null;
            }
            logger.debug('______________ END BATTLE ______________');
            break;
    }
    if (ConnectedPlayers(state) === 0) {
        logger.debug('Running empty ticks: %d', state.emptyTicks);
        state.emptyTicks++;
    }
    if (state.emptyTicks > 100) {
        return null;
    }
    return {
        state
    };
};
const PvEmatchSignal = function (ctx, logger, nk, dispatcher, tick, state, data) {
    logger.debug('Lobby match signal received: ' + data);
    return {
        state,
        data: "Lobby match signal received: " + data
    };
};
const PvEmatchTerminate = function (ctx, logger, nk, dispatcher, tick, state, graceSeconds) {
    logger.debug('Lobby match terminated');
    return {
        state
    };
};
function PvEPlayerLeave(nk, state, logger) {
    let bonusAds = getMetadataStat(nk, state.player1Id, "pveBattleButtonAds");
    if (state.blastCatched > 0) {
        incrementMetadataStat(nk, state.player1Id, "blast_catched", state.blastCatched);
    }
    if (state.blastDefeated > 0) {
        incrementMetadataStat(nk, state.player1Id, "blast_defeated", state.blastDefeated);
        writeIncrementalRecordLeaderboard(nk, logger, state.player1Id, LeaderboardTotalBlastDefeatedId, state.blastDefeated);
        writeIncrementalRecordLeaderboard(nk, logger, state.player1Id, LeaderboardBlastDefeatedAreaId + getMetadataStat(nk, state.player1Id, "area"), state.blastDefeated);
    }
    if (state.indexProgression > 1) {
        let totalCoins = 200 * (state.indexProgression - 1);
        updateWalletWithCurrency(nk, state.player1Id, Currency.Coins, totalCoins);
        if (bonusAds)
            updateWalletWithCurrency(nk, state.player1Id, Currency.Coins, totalCoins / 2);
        writeBestRecordLeaderboard(nk, logger, state.player1Id, LeaderboardBestStageAreaId + getMetadataStat(nk, state.player1Id, "area"), state.indexProgression - 1);
    }
    if (bonusAds) {
        setMetadataStat(nk, state.player1Id, "pveBattleButtonAds", false);
    }
}
function GetNewWildBlast(state, nk, logger) {
    return getRandomBlastWithAreaId(state.player1Id, nk, Math.floor(state.indexProgression / 5), state.indexProgression % 10 == 0, logger);
}
function ErrorFunc(state, error, dispatcher, currentBattleState) {
    state.battleState = currentBattleState;
    state.player1State = PlayerState.Ready;
    dispatcher.broadcastMessage(OpCodes.ERROR_SERV, JSON.stringify(error));
    return { state };
}
function ConnectedPlayers(s) {
    let count = 0;
    for (const p of Object.keys(s.presences)) {
        if (s.presences[p] !== null) {
            count++;
        }
    }
    return count;
}
//#region  Attack Logic
function ApplyBlastAttack(attacker, defender, move, meteo, logger) {
    let damage = calculateDamage(calculateLevelFromExperience(attacker.exp), attacker.attack * getStatModifier(Stats.Attack, attacker.modifiers), defender.defense * getStatModifier(Stats.Defense, defender.modifiers), move.type, getBlastDataById(defender.data_id).type, move.power, meteo, logger);
    defender.hp = clamp(defender.hp - damage, 0, Number.POSITIVE_INFINITY);
    return damage;
}
function ExecuteAttack(ctx, logger) {
    // Gestion mana/plateforme
    switch (ctx.move.attackType) {
        case AttackType.Normal:
        case AttackType.Status:
            if (ctx.attacker.mana < ctx.move.cost)
                return;
            ctx.attacker.mana = clamp(ctx.attacker.mana - ctx.move.cost, 0, Number.POSITIVE_INFINITY);
            ctx.attackerPlatforms = addPlatformType(ctx.attackerPlatforms, ctx.move.type);
            if (calculateWeatherModifier(ctx.meteo, ctx.move.type) > 1) {
                ctx.attackerPlatforms = addPlatformType(ctx.attackerPlatforms, ctx.move.type);
            }
            break;
        case AttackType.Special: {
            const platformCount = getAmountOfPlatformTypeByType(ctx.attackerPlatforms, ctx.move.type);
            if (platformCount < ctx.move.cost)
                return;
            ctx.attackerPlatforms = removePlatformTypeByType(ctx.attackerPlatforms, ctx.move.type, ctx.move.cost);
            break;
        }
    }
    // Application des effets
    const effects = ApplyMoveEffects(ctx.move, () => ctx.defender, ctx.setDefender, () => ctx.attacker, ctx.setAttacker);
    ctx.setMoveEffect(effects);
    let damage = 0;
    // Application des dégâts
    if (ctx.move.target === Target.Opponent) {
        damage = ApplyBlastAttack(ctx.attacker, ctx.defender, ctx.move, ctx.meteo, logger);
        ctx.setMoveDamage(damage);
    }
    return;
}
function ApplyMoveEffects(move, getTargetBlast, setTargetBlast, getAttacker, setAttacker) {
    if (!move.effects || move.effects.length === 0)
        return [];
    const effectsThisTurn = [];
    for (const effectData of move.effects) {
        if (effectData.effect === MoveEffect.None)
            continue;
        let getTarget;
        let setTarget;
        if (effectData.effectTarget === Target.Self) {
            getTarget = getAttacker;
            setTarget = setAttacker;
        }
        else {
            getTarget = getTargetBlast;
            setTarget = setTargetBlast;
        }
        if (move.attackType === AttackType.Special || move.attackType === AttackType.Status) {
            const updated = applyEffect(getTarget(), move, effectData);
            setTarget(updated);
            effectsThisTurn.push(effectData);
        }
        else {
            const result = calculateEffectWithProbability(getTarget(), move, effectData);
            setTarget(result.blast);
            effectsThisTurn.push(result.moveEffect);
        }
    }
    return effectsThisTurn;
}
//#endregion
// region Offer Turn Logic
function getRandomOffer(nk, state, logger) {
    let offer = {
        type: OfferType.Item,
        coinsAmount: 0,
        gemsAmount: 0,
        blast: null,
        item: null,
    };
    const random = Math.floor(Math.random() * 4);
    switch (random) {
        case 0:
            offer.type = OfferType.Blast;
            var newBlast = GetNewWildBlast(state, nk, logger);
            offer.blast = newBlast;
            break;
        case 1:
            offer.type = OfferType.Item;
            offer.item = getRandomItem(5);
            break;
        case 2:
            offer.type = OfferType.Coin;
            offer.coinsAmount = Math.floor(Math.random() * 1000) + 1;
            break;
        case 3:
            offer.type = OfferType.Gem;
            offer.gemsAmount = Math.floor(Math.random() * 10) + 1;
            break;
    }
    return offer;
}
function rpcFindOrCreatePvPBattle(context, logger, nk) {
    const limit = 10;
    const isAuthoritative = true;
    const label = "PvPBattle"; // ← Doit correspondre au label défini dans matchInit
    const minSize = 1;
    const maxSize = 2;
    const matches = nk.matchList(limit, isAuthoritative, label, minSize, maxSize, "");
    if (matches.length > 0) {
        matches.sort((a, b) => b.size - a.size);
        logger.info("Match existant trouvé : " + matches[0].matchId);
        return JSON.stringify(matches[0].matchId);
    }
    const matchId = nk.matchCreate("PvPBattle", {});
    logger.info("Aucun match trouvé, création d'un nouveau : " + matchId);
    return JSON.stringify(matchId);
}
const PvPinitMatch = function (ctx, logger, nk, params) {
    const PvPBattleData = {
        emptyTicks: 0,
        presences: {},
        battleState: BattleState.None,
        player1State: PlayerState.Busy,
        player1Id: "",
        player2State: PlayerState.Busy,
        player2Id: "",
        p1Index: 0,
        p1Blasts: [],
        player1Platform: [],
        p2Index: 0,
        p2Blasts: [],
        player2Platform: [],
        meteo: Meteo.None,
        turnDelay: 3000,
        turnTimer: null,
        turnStateData: {
            p1TurnData: {
                type: TurnType.None,
                index: 0,
                moveDamage: 0,
                moveEffects: [],
            },
            p2TurnData: {
                type: TurnType.None,
                index: 0,
                moveDamage: 0,
                moveEffects: [],
            },
            catched: false
        }
    };
    return {
        state: PvPBattleData,
        tickRate: 1,
        label: ''
    };
};
const PvPmatchJoinAttempt = function (ctx, logger, nk, dispatcher, tick, state, presence, metadata) {
    logger.debug('%q attempted to join PvP match', ctx.userId);
    const playerCount = Object.keys(state.presences).length;
    if (playerCount >= 2) {
        return { state, accept: false, rejectMessage: "Match already full" };
    }
    return { state, accept: true };
};
const PvPmatchJoin = function (ctx, logger, nk, dispatcher, tick, state, presences) {
    for (const presence of presences) {
        state.emptyTicks = 0;
        state.presences[presence.userId] = presence;
        if (!state.player1Id) {
            state.player1Id = presence.userId;
        }
        else if (!state.player2Id) {
            state.player2Id = presence.userId;
        }
    }
    if (Object.keys(state.presences).length === 2) {
        state.battleState = BattleState.Start;
    }
    return { state };
};
const PvPmatchLeave = function (ctx, logger, nk, dispatcher, tick, state, presences) {
    for (let presence of presences) {
        logger.info("Player: %s left match: %s.", presence.userId, ctx.matchId);
        if (state.player1Id == presence.userId) {
            PvPPlayerLeave(nk, state, logger);
            dispatcher.broadcastMessage(OpCodes.MATCH_END, JSON.stringify(true));
        }
        if (state.player2Id == presence.userId) {
            PvPPlayerLeave(nk, state, logger);
            dispatcher.broadcastMessage(OpCodes.MATCH_END, JSON.stringify(true));
        }
        state.presences[presence.userId] = null;
    }
    for (let userID in state.presences) {
        if (state.presences[userID] === null) {
            delete state.presences[userID];
        }
    }
    if (ConnectedPlayers(state) === 0) {
        return null;
    }
    return {
        state
    };
};
const PvPmatchLoop = function (ctx, logger, nk, dispatcher, tick, state, messages) {
    var _a;
    switch (state.battleState) {
        case BattleState.Start:
            logger.debug('______________ START BATTLE ______________');
            const keys = Object.keys(state.presences);
            const player1_presence = state.presences[keys[0]];
            const player2_presence = state.presences[keys[1]];
            state.player1Id = player1_presence.userId;
            state.player2Id = player2_presence.userId;
            state.p1Index = 0;
            state.p2Index = 0;
            state.p1Blasts = getDeckBlast(nk, logger, state.player1Id);
            state.p2Blasts = getDeckBlast(nk, logger, state.player2Id);
            state.meteo = getRandomMeteo();
            const p1_enemyBlast = {
                id: state.p2Blasts[state.p2Index].data_id,
                exp: state.p2Blasts[state.p2Index].exp,
                iv: state.p2Blasts[state.p2Index].iv,
                boss: state.p2Blasts[state.p2Index].boss,
                shiny: state.p2Blasts[state.p2Index].shiny,
                activeMoveset: state.p2Blasts[state.p2Index].activeMoveset,
                status: Status.None,
            };
            const p2_enemyBlast = {
                id: state.p1Blasts[state.p1Index].data_id,
                exp: state.p1Blasts[state.p1Index].exp,
                iv: state.p1Blasts[state.p1Index].iv,
                boss: state.p1Blasts[state.p1Index].boss,
                shiny: state.p1Blasts[state.p1Index].shiny,
                activeMoveset: state.p1Blasts[state.p1Index].activeMoveset,
                status: Status.None,
            };
            const startDataP1 = {
                newBlastData: p1_enemyBlast,
                meteo: state.meteo,
                turnDelay: state.turnDelay,
            };
            const startDataP2 = {
                newBlastData: p2_enemyBlast,
                meteo: state.meteo,
                turnDelay: state.turnDelay,
            };
            dispatcher.broadcastMessage(OpCodes.MATCH_START, JSON.stringify(startDataP1), [player1_presence]);
            dispatcher.broadcastMessage(OpCodes.MATCH_START, JSON.stringify(startDataP2), [player2_presence]);
            state.battleState = BattleState.Waiting;
            logger.debug('______________ END START BATTLE ______________');
            break;
        case BattleState.Waiting:
            messages.forEach(function (message) {
                switch (message.opCode) {
                    case OpCodes.PLAYER_READY:
                        const userId = message.sender.userId;
                        if (userId === state.player1Id) {
                            state.player1State = PlayerState.Ready;
                            logger.debug("P1 Ready");
                        }
                        else if (userId === state.player2Id) {
                            state.player2State = PlayerState.Ready;
                            logger.debug("P2 Ready");
                        }
                        break;
                }
            });
            if (state.player1State === PlayerState.Ready && state.player2State === PlayerState.Ready) {
                dispatcher.broadcastMessage(OpCodes.ENEMY_READY);
                state.battleState = BattleState.Ready;
                state.player1State = PlayerState.Busy;
                state.player2State = PlayerState.Busy;
                state.turnStateData.p1TurnData = {
                    type: TurnType.None,
                    index: 0,
                    moveDamage: 0,
                    moveEffects: [],
                };
                state.turnStateData.p2TurnData = {
                    type: TurnType.None,
                    index: 0,
                    moveDamage: 0,
                    moveEffects: [],
                };
            }
            break;
        case BattleState.Ready:
            const now = Date.now();
            for (const message of messages) {
                const userId = message.sender.userId;
                const parsed = JSON.parse(nk.binaryToString(message.data));
                const action = {
                    type: parsed.type,
                    data: (_a = parsed.data) !== null && _a !== void 0 ? _a : 0,
                };
                if (userId === state.player1Id) {
                    state.turnStateData.p1TurnData.type = parseEnum(action.type.toString(), TurnType);
                    state.turnStateData.p1TurnData.index = action.data;
                }
                if (userId === state.player2Id) {
                    state.turnStateData.p2TurnData.type = parseEnum(action.type.toString(), TurnType);
                    state.turnStateData.p2TurnData.index = action.data;
                }
            }
            if (!state.turnTimer) {
                state.turnTimer = now + state.turnDelay;
            }
            const p1Played = state.turnStateData.p1TurnData.type !== TurnType.None;
            const p2Played = state.turnStateData.p2TurnData.type !== TurnType.None;
            if ((p1Played && p2Played) || now >= state.turnTimer) {
                if (!p1Played) {
                    logger.debug("Joueur 1 a dépassé le temps, action = WAIT");
                    state.turnStateData.p1TurnData.type = TurnType.Wait;
                }
                if (!p2Played) {
                    logger.debug("Joueur 2 a dépassé le temps, action = WAIT");
                    state.turnStateData.p2TurnData.type = TurnType.Wait;
                }
                state.player1State = PlayerState.Busy;
                state.player2State = PlayerState.Busy;
                state.battleState = BattleState.ResolveTurn;
                state.turnTimer = null;
            }
            break;
        case BattleState.ResolveTurn:
            logger.debug("Resolving turn: P1 Action: %s, P2 Action: %s", state.turnStateData.p1TurnData.type, state.turnStateData.p2TurnData.type);
            const p1 = state.turnStateData.p1TurnData;
            const p2 = state.turnStateData.p2TurnData;
            if (p1.type === TurnType.Swap) {
                if (trySwapBlast(state.p1Index, p1, state.p1Blasts, i => state.p1Index = i, state, dispatcher))
                    break;
            }
            if (p2.type === TurnType.Swap) {
                if (trySwapBlast(state.p2Index, p2, state.p2Blasts, i => state.p2Index = i, state, dispatcher))
                    break;
            }
            if (p1.type === TurnType.Attack) {
                p1.index = clamp(p1.index, 0, 3);
                const move = getMoveById(state.p1Blasts[state.p1Index].activeMoveset[p1.index]);
                if (!move) {
                    ErrorFunc(state, "Player 1 move null", dispatcher, BattleState.Ready);
                    break;
                }
            }
            if (p2.type === TurnType.Attack) {
                p2.index = clamp(p2.index, 0, 3);
                const move = getMoveById(state.p2Blasts[state.p2Index].activeMoveset[p2.index]);
                if (!move) {
                    ErrorFunc(state, "Player 2 move null", dispatcher, BattleState.Ready);
                    break;
                }
            }
            if (p1.type === TurnType.Attack && p2.type === TurnType.Attack) {
                performAttackSequence(state, dispatcher, nk, logger);
            }
            else if (p1.type === TurnType.Attack) {
                executePlayerAttack(true, state, logger, dispatcher);
            }
            else if (p2.type === TurnType.Attack) {
                executePlayerAttack(false, state, logger, dispatcher);
            }
            if (p1.type === TurnType.Wait) {
                state.p1Blasts[state.p1Index].mana = calculateManaRecovery(state.p1Blasts[state.p1Index].maxMana, state.p1Blasts[state.p1Index].mana, true);
            }
            if (p2.type === TurnType.Wait) {
                state.p2Blasts[state.p2Index].mana = calculateManaRecovery(state.p2Blasts[state.p2Index].maxMana, state.p2Blasts[state.p2Index].mana, true);
            }
            ({ blast: state.p1Blasts[state.p1Index], otherBlast: state.p2Blasts[state.p2Index] } = applyStatusEffectAtEndOfTurn(state.p1Blasts[state.p1Index], state.p2Blasts[state.p2Index]));
            ({ blast: state.p2Blasts[state.p2Index], otherBlast: state.p1Blasts[state.p1Index] } = applyStatusEffectAtEndOfTurn(state.p2Blasts[state.p2Index], state.p1Blasts[state.p1Index]));
            checkIfMatchContinue(state);
            if (isBlastAlive(state.p2Blasts[state.p2Index]))
                state.p2Blasts[state.p2Index].mana = calculateManaRecovery(state.p2Blasts[state.p2Index].maxMana, state.p2Blasts[state.p2Index].mana, false);
            if (isBlastAlive(state.p1Blasts[state.p1Index]))
                state.p1Blasts[state.p1Index].mana = calculateManaRecovery(state.p1Blasts[state.p1Index].maxMana, state.p1Blasts[state.p1Index].mana, false);
            EndLoopDebug(logger, state);
            // Send turn data to both players
            dispatcher.broadcastMessage(OpCodes.NEW_BATTLE_TURN, JSON.stringify(state.turnStateData), [state.presences[state.player1Id]]);
            const reversedTurnStateData = {
                p1TurnData: state.turnStateData.p2TurnData,
                p2TurnData: state.turnStateData.p1TurnData,
                catched: state.turnStateData.catched
            };
            dispatcher.broadcastMessage(OpCodes.NEW_BATTLE_TURN, JSON.stringify(reversedTurnStateData), [state.presences[state.player2Id]]);
            state.battleState = BattleState.Waiting;
            break;
        case BattleState.WaitForPlayerSwap:
            logger.debug("Waiting for player swap");
            break;
        case BattleState.End:
            const allP1BlastFainted = isAllBlastDead(state.p1Blasts);
            const allP2BlastFainted = isAllBlastDead(state.p2Blasts);
            if (allP1BlastFainted && allP2BlastFainted) {
                dispatcher.broadcastMessage(OpCodes.MATCH_END, JSON.stringify(false), [
                    state.presences[state.player1Id],
                    state.presences[state.player2Id]
                ]);
                return null;
            }
            if (allP1BlastFainted) {
                dispatcher.broadcastMessage(OpCodes.MATCH_END, JSON.stringify(false), [state.presences[state.player1Id]]);
                dispatcher.broadcastMessage(OpCodes.MATCH_END, JSON.stringify(true), [state.presences[state.player2Id]]);
                updateWalletWithCurrency(nk, state.player1Id, Currency.Trophies, -20);
                updateWalletWithCurrency(nk, state.player2Id, Currency.Trophies, 20);
                return null;
            }
            if (allP2BlastFainted) {
                dispatcher.broadcastMessage(OpCodes.MATCH_END, JSON.stringify(true), [state.presences[state.player1Id]]);
                dispatcher.broadcastMessage(OpCodes.MATCH_END, JSON.stringify(false), [state.presences[state.player2Id]]);
                updateWalletWithCurrency(nk, state.player1Id, Currency.Trophies, 20);
                updateWalletWithCurrency(nk, state.player2Id, Currency.Trophies, -20);
                return null;
            }
            logger.debug('______________ END BATTLE ______________');
    }
    if (ConnectedPlayers(state) === 0) {
        logger.debug('Running empty ticks: %d', state.emptyTicks);
        state.emptyTicks++;
    }
    if (state.emptyTicks > 100) {
        return null;
    }
    return {
        state
    };
};
const PvPmatchSignal = function (ctx, logger, nk, dispatcher, tick, state, data) {
    logger.debug('Lobby match signal received: ' + data);
    return {
        state,
        data: "Lobby match signal received: " + data
    };
};
const PvPmatchTerminate = function (ctx, logger, nk, dispatcher, tick, state, graceSeconds) {
    logger.debug('Lobby match terminated');
    return {
        state
    };
};
function PvPPlayerLeave(nk, state, logger) {
    let bonusAds = getMetadataStat(nk, state.player1Id, "pvpBattleButtonAds");
    updateWalletWithCurrency(nk, state.player1Id, Currency.Trophies, -20);
    updateWalletWithCurrency(nk, state.player1Id, Currency.Coins, 1000);
    if (bonusAds) {
        updateWalletWithCurrency(nk, state.player1Id, Currency.Coins, 1000 / 2);
        setMetadataStat(nk, state.player1Id, "pvpBattleButtonAds", false);
    }
}
