let InitModule: nkruntime.InitModule = function (ctx: nkruntime.Context, logger: nkruntime.Logger, nk: nkruntime.Nakama, initializer: nkruntime.Initializer) {

    createLeaderboard(nk, logger, LeaderboardTrophyId, nkruntime.Operator.BEST);
    createLeaderboard(nk, logger, LeaderboardTotalBlastDefeatedId, nkruntime.Operator.INCREMENTAL);
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
    initializer.registerRpc('swapDeckToDeckItem', rpcSwapDeckToDeckItem)

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
    initializer.registerRpc('watchWildBattleAds', rpcWatchWildBattleAds);
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

    // Wild Battle
    initializer.registerRpc('findWildBattle', rpcFindOrCreateWildBattle);
    initializer.registerRpc('updateNicknameStatus', rpcUpdateNicknameStatus);

    initializer.registerMatch('wildBattle', {
        matchInit,
        matchJoinAttempt,
        matchJoin,
        matchLeave,
        matchLoop,
        matchSignal,
        matchTerminate
    });

    // User
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
}

//#region ENUM

enum Status {
    None,
    Burn,
    Seeded,
    Wet,
    All,
};

enum Rarity {
    None,
    Common,
    Uncommon,
    Rare,
    Epic,
    Legendary,
    Ultimate,
    Unique,
}

enum Type {
    Normal = 0,
    Fire = 1,
    Water = 2,
    Grass = 3,
    Ground = 4,
    Fly = 5,
    Electric = 6,
    Light = 7,
    Dark = 8
}

enum Meteo {
    None,
    Sun,
    Rain,
    Leaves,
}

enum Stats {
    None,
    Attack = 422,
    Defense = 423,
    Speed = 424,
}

//#endregion