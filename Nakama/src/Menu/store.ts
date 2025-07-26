enum RewardType {
    None,
    Coin,
    Gem,
    Trophy,
    Blast,
    Item,
}

interface StoreOffer {
    offer_id: number
    offer: Reward
    price: number
    currency: Currency
    isAlreadyBuyed: boolean
}

//#region BlastTrap Offer

const blastTrap: Item = {
    data_id: blastTrapData.id,
    amount: 1,
};

const blastTrapOffer: StoreOffer = {
    offer_id: 1,
    offer: {
        type: RewardType.Item,
        item: blastTrap,
    },

    currency: Currency.Coins,
    price: 100,
    isAlreadyBuyed: false,
};

const superBlastTrap: Item = {
    data_id: superBlastTrapData.id,
    amount: 1,
};

const superBlastTrapOffer: StoreOffer = {
    offer_id: 2,
    offer: {
        type: RewardType.Item,
        item: superBlastTrap,
    },
    currency: Currency.Coins,
    price: 250,
    isAlreadyBuyed: false,
};

const hyperBlastTrap: Item = {
    data_id: hyperBlastTrapData.id,
    amount: 1,
};

const hyperBlastTrapOffer: StoreOffer = {
    offer_id: 3,
    offer: {
        type: RewardType.Item,
        item: hyperBlastTrap,
    },

    currency: Currency.Coins,
    price: 500,
    isAlreadyBuyed: false,
};

const blastTrapOffers: StoreOffer[] = [
    blastTrapOffer,
    superBlastTrapOffer,
    hyperBlastTrapOffer,
];

const rpcLoadBlastTrapOffer: nkruntime.RpcFunction =
    function (ctx: nkruntime.Context, logger: nkruntime.Logger, nk: nkruntime.Nakama): string {
        return JSON.stringify(blastTrapOffers);
    }

const rpcBuyTrapOffer: nkruntime.RpcFunction =
    function (ctx: nkruntime.Context, logger: nkruntime.Logger, nk: nkruntime.Nakama, payload: string) {
        var indexOffer = JSON.parse(payload);

        var storeOffer = blastTrapOffers[indexOffer];

        try {
            nk.walletUpdate(ctx.userId, { [storeOffer.currency]: -storeOffer.price });
        } catch (error) {
            logger.error('error buying blast trap: %s', error);
            throw error;
        }

        addItem(nk, logger, ctx.userId, storeOffer.offer.item!)

        // return playerWallet and Wallets
    }

//#endregion

//#region Coins Offer

const coinsOffer1: StoreOffer = {
    offer_id: 4,
    offer: {
        type: RewardType.Coin,

        amount: 20000,
    },

    currency: Currency.Gems,
    price: 100,
    isAlreadyBuyed: false,
};

const coinsOffer2: StoreOffer = {
    offer_id: 5,
    offer: {
        type: RewardType.Coin,
        amount: 65000,
    },

    currency: Currency.Gems,
    price: 300,
    isAlreadyBuyed: false,
};

const coinsOffer3: StoreOffer = {
    offer_id: 6,
    offer: {
        type: RewardType.Coin,
        amount: 140000,
    },

    currency: Currency.Gems,
    price: 600,
    isAlreadyBuyed: false,
};

const coinsOffer: StoreOffer[] = [
    coinsOffer1,
    coinsOffer2,
    coinsOffer3,
];

const rpcLoadCoinsOffer: nkruntime.RpcFunction =
    function (ctx: nkruntime.Context, logger: nkruntime.Logger, nk: nkruntime.Nakama): string {
        return JSON.stringify(coinsOffer);
    }

const rpcBuyCoinOffer: nkruntime.RpcFunction =
    function (ctx: nkruntime.Context, logger: nkruntime.Logger, nk: nkruntime.Nakama, payload: string) {
        var indexOffer = JSON.parse(payload);

        var storeOffer = coinsOffer[indexOffer];

        try {
            nk.walletUpdate(ctx.userId, { [storeOffer.currency]: -storeOffer.price });

            nk.walletUpdate(ctx.userId, { [Currency.Coins]: storeOffer.offer.amount! });
        } catch (error) {
            logger.error('error buying blast trap: %s', error);
            throw error;
        }
    }

//#endregion

//#region Gems Offer

const gemsOffer1: StoreOffer = {
    offer_id: 7,
    offer: {
        type: RewardType.Gem,
        amount: 160,
    },
    currency: Currency.Hard,
    price: 0,
    isAlreadyBuyed: false,
};

const gemsOffer2: StoreOffer = {
    offer_id: 8,
    offer: {
        type: RewardType.Gem,
        amount: 500,
    },
    currency: Currency.Hard,
    price: 0,
    isAlreadyBuyed: false,
};

const gemsOffer3: StoreOffer = {
    offer_id: 9,
    offer: {
        type: RewardType.Gem,
        amount: 1200,
    },
    currency: Currency.Hard,
    price: 0,
    isAlreadyBuyed: false,
};

const gemsOffer4: StoreOffer = {
    offer_id: 10,
    offer: {
        type: RewardType.Gem,
        amount: 2500,
    },
    currency: Currency.Hard,
    price: 0,
    isAlreadyBuyed: false,
};

const gemsOffer5: StoreOffer = {
    offer_id: 11,
    offer: {
        type: RewardType.Gem,
        amount: 6500,
    },
    currency: Currency.Hard,
    price: 0,
    isAlreadyBuyed: false,
};

const gemsOffer6: StoreOffer = {
    offer_id: 12,
    offer: {
        type: RewardType.Gem,
        amount: 14000,
    },
    currency: Currency.Hard,

    price: 0,
    isAlreadyBuyed: false,
};

const gemsOffer: StoreOffer[] = [
    gemsOffer1,
    gemsOffer2,
    gemsOffer3,
    gemsOffer4,
    gemsOffer5,
    gemsOffer6,
];

const rpcLoadGemsOffer: nkruntime.RpcFunction =
    function (ctx: nkruntime.Context, logger: nkruntime.Logger, nk: nkruntime.Nakama): string {
        return JSON.stringify(gemsOffer);
    }

const rpcBuyGemOffer: nkruntime.RpcFunction =
    function (ctx: nkruntime.Context, logger: nkruntime.Logger, nk: nkruntime.Nakama, payload: string) {
        var indexOffer = JSON.parse(payload);

        var storeOffer = gemsOffer[indexOffer];

        try {
            // Verif
            // Achat in app

            nk.walletUpdate(ctx.userId, { [Currency.Gems]: storeOffer.offer.amount! });
        } catch (error) {
            logger.error('error buying blast trap: %s', error);
            throw error;
        }
    }

//#endregion