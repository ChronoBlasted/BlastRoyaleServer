
enum ITEM_BEHAVIOUR {
    None,
    Heal,
    Mana,
    Status,
    Catch,
};

interface Item {
    data_id: number
    amount: number
}

interface ItemData {
    id: number;
    behaviour: ITEM_BEHAVIOUR;
    gain_amount: number
    rarity:Rarity;
    status?: Status;
    catchRate?: number;
}

interface ItemUseJSON {
    index_item: number
    index_blast: number
}

const potionData: ItemData = { // healthPotionData
    id: 0,
    behaviour: ITEM_BEHAVIOUR.Heal,
    gain_amount: 20,
    rarity: Rarity.Common,
};

const superPotionData: ItemData = { // superHealthPotionData
    id: 1,
    behaviour: ITEM_BEHAVIOUR.Heal,
    gain_amount: 50,
    rarity:Rarity.Uncommon,
};

const hyperPotionData: ItemData = { // hyperHealthPotionData
    id: 2,
    behaviour: ITEM_BEHAVIOUR.Heal,
    gain_amount: 200,
    rarity:Rarity.Rare,
};

const elixirData: ItemData = { // manaPotionData
    id: 3,
    behaviour: ITEM_BEHAVIOUR.Mana,
    gain_amount: 10,
    rarity:Rarity.Common,
};

const superElixirData: ItemData = { // superManaPotionData
    id: 4,
    behaviour: ITEM_BEHAVIOUR.Mana,
    gain_amount: 25,
    rarity:Rarity.Uncommon,
};

const hyperElixirData: ItemData = { // hyperManaPotionData
    id: 5,
    behaviour: ITEM_BEHAVIOUR.Mana,
    gain_amount: 50,
    rarity:Rarity.Rare,
};

const blastTrapData: ItemData = { // blastTrapData
    id: 6,
    behaviour: ITEM_BEHAVIOUR.Catch,
    gain_amount: 0,
    catchRate: 1,
    rarity:Rarity.Common,
};

const superBlastTrapData: ItemData = { // superBlastTrapData
    id: 7,
    behaviour: ITEM_BEHAVIOUR.Catch,
    gain_amount: 0,
    catchRate: 1.5,
    rarity:Rarity.Common,
};

const hyperBlastTrapData: ItemData = { // hyperBlastTrapData
    id: 8,
    behaviour: ITEM_BEHAVIOUR.Catch,
    gain_amount: 0,
    catchRate: 2,
    rarity:Rarity.Common,
};

const AntiBurnData: ItemData = { // hyperBlastTrapData
    id: 9,
    behaviour: ITEM_BEHAVIOUR.Status,
    gain_amount: 0,
    status: Status.Burn,
    rarity:Rarity.Common,
};

const AntiSeededData: ItemData = { // hyperBlastTrapData
    id: 10,
    behaviour: ITEM_BEHAVIOUR.Status,
    gain_amount: 0,
    status: Status.Seeded,
    rarity:Rarity.Common,
};

const AntiWetData: ItemData = { // hyperBlastTrapData
    id: 11,
    behaviour: ITEM_BEHAVIOUR.Status,
    gain_amount: 0,
    status: Status.Wet,
    rarity:Rarity.Common,
};

const itemPedia: ItemData[] = [
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

function getItemDataById(id: number): ItemData {
    const item = itemPedia.find((item) => item.id === id);
    if (!item) {
        throw new Error(`No Item found with ID: ${id}`);
    }
    return item;
}

const rpcLoadItemPedia: nkruntime.RpcFunction =
    function (ctx: nkruntime.Context, logger: nkruntime.Logger, nk: nkruntime.Nakama): string {
        return JSON.stringify(itemPedia);
    }


function getRandomItem(amount: number): Item {

    const randomIndex = Math.floor(Math.random() * itemPedia.length);

    let newItem: Item = {
        data_id: itemPedia[randomIndex].id,
        amount: amount,
    }

    return newItem;
}

function getDeckItem(nk: nkruntime.Nakama, logger: nkruntime.Logger, userId: string): Item[] {

    let userCards: ItemCollection;
    userCards = loadUserItems(nk, logger, userId);

    return userCards.deckItems;
}