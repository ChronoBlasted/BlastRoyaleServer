// region Setup 

interface PvEBattleData extends BattleData {


    player1Items: Item[];

    indexProgression: number;
    blastDefeated: number;
    blastCatched: number;

    offerTurnStateData: OfferTurnStateData;
}

interface OfferTurnStateData {
    offerOne: Offer;
    offerTwo: Offer;
    offerThree: Offer;
}


function rpcCreatePvEBattle(context: nkruntime.Context, logger: nkruntime.Logger, nk: nkruntime.Nakama): string {
    var matchId = nk.matchCreate('PvEBattle', {});
    return JSON.stringify(matchId);
}

const PvEinitMatch = function (ctx: nkruntime.Context, logger: nkruntime.Logger, nk: nkruntime.Nakama, params: { [key: string]: string }): { state: PvEBattleData, tickRate: number, label: string } {

    const PvEBattleData: PvEBattleData = {
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
                moveIndex: 0,
                moveDamage: 0,
                moveEffects: [],
            },

            p2TurnData: {
                type: TurnType.None,
                moveIndex: 0,
                moveDamage: 0,
                moveEffects: [],
            },

            catched: false
        }
    };

    return {
        state: PvEBattleData,
        tickRate: 2, // 1 tick per second = 1 MatchLoop func invocations per second
        label: ''
    };
};


const PvEmatchJoinAttempt = function (ctx: nkruntime.Context, logger: nkruntime.Logger, nk: nkruntime.Nakama, dispatcher: nkruntime.MatchDispatcher, tick: number, state: PvEBattleData, presence: nkruntime.Presence, metadata: { [key: string]: any }): { state: PvEBattleData, accept: boolean, rejectMessage?: string | undefined } | null {
    logger.debug('%q attempted to join PvP match', ctx.userId);

    const playerCount = Object.keys(state.presences).length;

    if (playerCount >= 1) {
        return { state, accept: false, rejectMessage: "Match already full" };
    }

    return { state, accept: true };
}

const PvEmatchJoin = function (ctx: nkruntime.Context, logger: nkruntime.Logger, nk: nkruntime.Nakama, dispatcher: nkruntime.MatchDispatcher, tick: number, state: PvEBattleData, presences: nkruntime.Presence[]): { state: PvEBattleData } | null {
    for (const presence of presences) {
        state.emptyTicks = 0;
        state.presences[presence.userId] = presence;
    }

    return {
        state
    };
}

const PvEmatchLeave = function (ctx: nkruntime.Context, logger: nkruntime.Logger, nk: nkruntime.Nakama, dispatcher: nkruntime.MatchDispatcher, tick: number, state: PvEBattleData, presences: nkruntime.Presence[]): { state: PvEBattleData } | null {
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
}

// region MatchLoop 

const PvEmatchLoop = function (ctx: nkruntime.Context, logger: nkruntime.Logger, nk: nkruntime.Nakama, dispatcher: nkruntime.MatchDispatcher, tick: number, state: PvEBattleData, messages: nkruntime.MatchMessage[]): { state: PvEBattleData } | null {

    switch (state.battleState) {
        case BattleState.Start:

            logger.debug('______________ START BATTLE ______________');

            const keys = Object.keys(state.presences);
            const player1_presence = state.presences[keys[0]]!;

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

            const newWildBlast: NewBlastData = {
                id: state.p2Blasts[state.p2Index].data_id,
                exp: state.p2Blasts[state.p2Index].exp,
                iv: state.p2Blasts[state.p2Index].iv,
                boss: state.p2Blasts[state.p2Index].boss,
                shiny: state.p2Blasts[state.p2Index].shiny,
                activeMoveset: state.p2Blasts[state.p2Index].activeMoveset,
                status: Status.None
            }

            state.meteo = getRandomMeteo();

            const StartData: StartStateData = {
                newBlastData: newWildBlast,
                meteo: state.meteo,
            }

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

                logger.debug('______________ EVERYONE"S READY ______________');
            }

            break;
        case BattleState.Ready:

            messages.forEach(function (message) {

                const validOpCodes = [
                    OpCodes.PLAYER_ATTACK,
                    OpCodes.PLAYER_USE_ITEM,
                    OpCodes.PLAYER_CHANGE_BLAST,
                    OpCodes.PLAYER_WAIT,
                    OpCodes.PLAYER_LEAVE,
                ];

                if (!validOpCodes.includes(message.opCode)) {
                    ({ state } = ErrorFunc(state, "OP CODE NOT VALID", dispatcher, BattleState.Ready));
                    return;
                }

                logger.debug('______________ LOOP BATTLE ______________');

                message.data == null ? logger.debug('Receive Op code : %d', message.opCode) : logger.debug('Receive Op code : %d, with data : %e', message.opCode, JSON.parse(nk.binaryToString(message.data)));

                state.player1State = PlayerState.Busy;

                state.turnStateData.p1TurnData = {
                    type: TurnType.None,
                    moveIndex: 0,
                    moveDamage: 0,
                    moveEffects: [],
                }

                state.turnStateData.p2TurnData = {
                    type: TurnType.None,
                    moveIndex: getRandomUsableMove(getMovesByIds(state.p2Blasts![state.p2Index].activeMoveset!), state.p2Blasts![state.p2Index].mana, state.player2Platform),
                    moveDamage: 0,
                    moveEffects: [],
                }

                state.turnStateData.catched = false;


                switch (message.opCode) {
                    // region Attack
                    case OpCodes.PLAYER_ATTACK:
                        let attackIndex = clamp(JSON.parse(nk.binaryToString(message.data)), 0, 3);
                        let move = getMoveById(state.p1Blasts[state.p1Index]!.activeMoveset![attackIndex]);

                        if (move == null) {
                            ({ state } = ErrorFunc(state, "Player 1 move null", dispatcher, BattleState.Ready));
                            return;
                        }

                        state = performAttackSequence(state, move, dispatcher, nk, logger);
                        state.turnStateData.p1TurnData.moveIndex = attackIndex;

                        break;
                    // region Player Use Item
                    case OpCodes.PLAYER_USE_ITEM:
                        let msgItem = {} as ItemUseJSON;
                        msgItem = JSON.parse(nk.binaryToString(message.data));
                        msgItem.index_item = clamp(msgItem.index_item, 0, state.player1Items.length - 1)
                        let item = state.player1Items[msgItem.index_item];

                        if (item == null) {
                            ({ state } = ErrorFunc(state, "Item to use is null", dispatcher, BattleState.Ready));
                            return;
                        }

                        if (item.amount <= 0) {
                            ({ state } = ErrorFunc(state, "U don't have enough item", dispatcher, BattleState.Ready));
                            return;
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
                                state.p1Blasts[msgItem.index_blast] = healStatusBlast(state.p1Blasts[msgItem.index_blast], itemData.status!);
                                break;
                            case ITEM_BEHAVIOUR.Catch:
                                var wildBlastCaptured = false;

                                wildBlastCaptured = isBlastCaptured(state.p2Blasts![state.p2Index].hp, state.p2Blasts![state.p2Index].maxHp, getBlastDataById(state.p2Blasts![state.p2Index].data_id).catchRate, itemData.catchRate!, 1) // TODO Get status bonus

                                if (wildBlastCaptured) {
                                    logger.debug('Wild blast Captured !', wildBlastCaptured);

                                    state.battleState = BattleState.End;
                                }

                                state.turnStateData.catched = wildBlastCaptured;
                                break;
                            default:
                        }

                        state.turnStateData.p1TurnData.type = TurnType.Item;

                        ({ state } = executeWildBlastAttack(state, dispatcher, logger));
                        break;
                    // region Player Change
                    case OpCodes.PLAYER_CHANGE_BLAST:
                        var msgChangeBlast = clamp(JSON.parse(nk.binaryToString(message.data)), 0, state.p1Blasts.length - 1);

                        if (state.p1Index == msgChangeBlast) {
                            ErrorFunc(state, "Cannot change actual blast with actual blast", dispatcher, BattleState.Ready);
                            return;
                        }

                        if (!isBlastAlive(state.p1Blasts[msgChangeBlast])) {
                            ({ state } = ErrorFunc(state, "Cannot change actual blast with dead blast in Ready", dispatcher, BattleState.Ready));
                            return;
                        }

                        state.p1Index = msgChangeBlast;

                        state.turnStateData.p1TurnData.type = TurnType.Swap;

                        ({ state } = executeWildBlastAttack(state, dispatcher, logger));
                        break;
                    // region Player Wait
                    case OpCodes.PLAYER_WAIT:
                        state.player1State = PlayerState.Busy;

                        state.p1Blasts[state.p1Index]!.mana = calculateManaRecovery(state.p1Blasts[state.p1Index]!.maxMana, state.p1Blasts[state.p1Index]!.mana, true);

                        state.turnStateData.p1TurnData.type = TurnType.Wait;

                        ({ state } = executeWildBlastAttack(state, dispatcher, logger));
                        break;

                    case OpCodes.PLAYER_LEAVE:
                        PvEPlayerLeave(nk, state, logger);
                        dispatcher.broadcastMessage(OpCodes.MATCH_END, JSON.stringify(true));

                        return null;
                }

                // region End turn Logic

                ({ blast: state.p1Blasts[state.p1Index]!, otherBlast: state.p2Blasts![state.p2Index] } = applyStatusEffectAtEndOfTurn(state.p1Blasts[state.p1Index]!, state.p2Blasts![state.p2Index]));
                ({ blast: state.p2Blasts![state.p2Index], otherBlast: state.p1Blasts[state.p1Index]! } = applyStatusEffectAtEndOfTurn(state.p2Blasts![state.p2Index], state.p1Blasts[state.p1Index]!));

                state = checkIfMatchContinue(state);

                if (state.battleState == BattleState.End) {
                    if (isBlastAlive(state.p2Blasts![state.p2Index])) state.p2Blasts![state.p2Index].mana = calculateManaRecovery(state.p2Blasts![state.p2Index].maxMana, state.p2Blasts![state.p2Index].mana, false);
                    if (isBlastAlive(state.p1Blasts[state.p1Index]!)) state.p1Blasts[state.p1Index]!.mana = calculateManaRecovery(state.p1Blasts[state.p1Index]!.maxMana, state.p1Blasts[state.p1Index]!.mana, false);

                    dispatcher.broadcastMessage(OpCodes.NEW_BATTLE_TURN, JSON.stringify(state.turnStateData));

                    return;
                }
                else if (state.battleState == BattleState.WaitForPlayerSwap) {
                    state.p2Blasts![state.p2Index].mana = calculateManaRecovery(state.p2Blasts![state.p2Index].maxMana, state.p2Blasts![state.p2Index].mana, false);

                    dispatcher.broadcastMessage(OpCodes.NEW_BATTLE_TURN, JSON.stringify(state.turnStateData));

                    EndLoopDebug(logger, state);

                    return;
                }
                else {
                    state.battleState = BattleState.Waiting;

                    state.p1Blasts[state.p1Index]!.mana = calculateManaRecovery(state.p1Blasts[state.p1Index]!.maxMana, state.p1Blasts[state.p1Index]!.mana, false);
                    state.p2Blasts![state.p2Index].mana = calculateManaRecovery(state.p2Blasts![state.p2Index].maxMana, state.p2Blasts![state.p2Index].mana, false);

                    //Send matchTurn
                    dispatcher.broadcastMessage(OpCodes.NEW_BATTLE_TURN, JSON.stringify(state.turnStateData));
                }

                EndLoopDebug(logger, state);
            });
            break;
        // region WAIT_FOR_PLAYER_SWAP
        case BattleState.WaitForPlayerSwap:

            messages.forEach(function (message) {

                const validOpCodes = [
                    OpCodes.PLAYER_CHANGE_BLAST,
                ];

                if (!validOpCodes.includes(message.opCode)) {
                    ({ state } = ErrorFunc(state, "OP CODE NOT VALID", dispatcher, BattleState.WaitForPlayerSwap));
                    return;
                }

                logger.debug('______________ PLAYER SWAP BLAST ______________');

                message.data == null ? logger.debug('Receive Op code : %d', message.opCode) : logger.debug('Receive Op code : %d, with data : %e', message.opCode, JSON.parse(nk.binaryToString(message.data)));

                if (message.opCode == OpCodes.PLAYER_CHANGE_BLAST) {

                    state.player1State = PlayerState.Busy;

                    var msgChangeBlast = clamp(JSON.parse(nk.binaryToString(message.data)), 0, state.p1Blasts.length - 1);

                    if (state.p1Index == msgChangeBlast) {
                        ErrorFunc(state, "Cannot change actual blast with actual blast", dispatcher, BattleState.WaitForPlayerSwap);
                        return;
                    }

                    if (!isBlastAlive(state.p1Blasts[msgChangeBlast])) {
                        ({ state } = ErrorFunc(state, "Cannot change actual blast with dead blast", dispatcher, BattleState.WaitForPlayerSwap));
                        return;
                    }

                    state.p1Index = msgChangeBlast;
                }

                state.battleState = BattleState.Waiting;

                logger.debug('______________ END PLAYER SWAP BLAST ______________');
                logger.debug('Wild blast HP : %h, Mana : %m', state.p2Blasts![state.p2Index].hp, state.p2Blasts![state.p2Index].mana);
                logger.debug('Player blast HP : %h, Mana : %m', state.p1Blasts[state.p1Index]?.hp, state.p1Blasts[state.p1Index]?.mana);
            });
            break;
        //region CHOOSE OFFER
        case BattleState.WaitForPlayerChooseOffer:
            messages.forEach(function (message) {

                const validOpCodes = [
                    OpCodes.PLAYER_CHOOSE_OFFER,
                ];

                if (!validOpCodes.includes(message.opCode)) {
                    ({ state } = ErrorFunc(state, "OP CODE NOT VALID", dispatcher, BattleState.WaitForPlayerChooseOffer));
                    return;
                }

                logger.debug('______________ PLAYER CHOOSE OFFER ______________');

                message.data == null ? logger.debug('Receive Op code : %d', message.opCode) : logger.debug('Receive Op code : %d, with data : %e', message.opCode, JSON.parse(nk.binaryToString(message.data)));

                if (message.opCode == OpCodes.PLAYER_CHOOSE_OFFER) {
                    state.indexProgression++;

                    state.player1State = PlayerState.Busy;

                    var indexChooseOffer = clamp(JSON.parse(nk.binaryToString(message.data)), 0, 2);

                    let currentOffer: Offer = {
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
                            addBlast(nk, logger, state.player1Id, currentOffer.blast!);
                            break;
                        case OfferType.Item:
                            addItem(nk, logger, state.player1Id, currentOffer.item!);
                            break;
                        case OfferType.Coin:
                            updateWalletWithCurrency(nk, state.player1Id, Currency.Coins, currentOffer.coinsAmount);

                            if (getMetadataStat(nk, state.player1Id, "pveBattleButtonAds")) updateWalletWithCurrency(nk, state.player1Id, Currency.Coins, currentOffer.coinsAmount / 2)
                            break;
                        case OfferType.Gem:
                            updateWalletWithCurrency(nk, state.player1Id, Currency.Gems, currentOffer.gemsAmount);

                            if (getMetadataStat(nk, state.player1Id, "pveBattleButtonAds")) updateWalletWithCurrency(nk, state.player1Id, Currency.Gems, currentOffer.gemsAmount / 2)
                            break;
                        case OfferType.None:
                            break;
                    }

                    var newBlast = GetNewWildBlast(state, nk, logger);

                    state.p2Blasts = [ConvertBlastToBlastEntity(newBlast)];

                    const newWildBlast: NewBlastData = {
                        id: state.p2Blasts[state.p2Index].data_id,
                        exp: state.p2Blasts[state.p2Index].exp,
                        iv: state.p2Blasts[state.p2Index].iv,
                        boss: state.p2Blasts[state.p2Index].boss,
                        shiny: state.p2Blasts[state.p2Index].shiny,
                        activeMoveset: state.p2Blasts[state.p2Index].activeMoveset,
                        status: Status.None
                    }

                    dispatcher.broadcastMessage(OpCodes.NEW_BLAST, JSON.stringify(newWildBlast));
                }

                state.battleState = BattleState.Waiting;

                logger.debug('______________ END PLAYER CHOOSE OFFER ______________');
                logger.debug('Player blast HP : %h, Mana : %m', state.p1Blasts[state.p1Index]?.hp, state.p1Blasts[state.p1Index]?.mana);
            });
            break;
        // region END BATTLE
        case BattleState.End:

            const p1_blast = state.p1Blasts[state.p1Index]!;
            const wildBlast = state.p2Blasts!;
            const allPlayerBlastFainted = isAllBlastDead(state.p1Blasts);

            const wildAlive = isBlastAlive(wildBlast[state.p2Index]);

            if (wildAlive == false || state.turnStateData.catched) {

                state.indexProgression++;

                addExpOnBlastInGame(nk, logger, state.player1Id, p1_blast, wildBlast[state.p2Index]);

                if (state.turnStateData.catched) {
                    state.blastCatched++;

                    incrementQuest(state.player1Id, QuestIds.CATCH_BLAST, 1, nk, logger);

                    addBlast(nk, logger, state.player1Id, state.p2Blasts![state.p2Index]);
                }
                else {
                    state.blastDefeated++;

                    incrementQuest(state.player1Id, QuestIds.DEFEAT_BLAST, 1, nk, logger);
                }

                if (state.indexProgression % 5 == 0 && state.indexProgression % 10 != 0) {
                    let items: OfferTurnStateData = {
                        offerOne: getRandomOffer(nk, state, logger),
                        offerTwo: getRandomOffer(nk, state, logger),
                        offerThree: getRandomOffer(nk, state, logger),
                    }

                    state.offerTurnStateData = items;

                    dispatcher.broadcastMessage(OpCodes.NEW_OFFER_TURN, JSON.stringify(items));

                    state.battleState = BattleState.WaitForPlayerChooseOffer;

                } else {

                    var newBlast = GetNewWildBlast(state, nk, logger);


                    if (state.indexProgression % 10 == 0) {
                        newBlast.exp = calculateExperienceFromLevel(state.indexProgression / 2);
                        newBlast.iv = MaxIV;
                    };

                    state.p2Blasts = [ConvertBlastToBlastEntity(newBlast)];

                    const newWildBlast: NewBlastData = {
                        id: state.p2Blasts[state.p2Index].data_id,
                        exp: state.p2Blasts[state.p2Index].exp,
                        iv: state.p2Blasts[state.p2Index].iv,
                        boss: state.p2Blasts[state.p2Index].boss,
                        shiny: state.p2Blasts[state.p2Index].shiny,
                        activeMoveset: state.p2Blasts[state.p2Index].activeMoveset,
                        status: Status.None
                    }

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
}

const PvEmatchSignal = function (ctx: nkruntime.Context, logger: nkruntime.Logger, nk: nkruntime.Nakama, dispatcher: nkruntime.MatchDispatcher, tick: number, state: PvEBattleData, data: string): { state: PvEBattleData, data?: string } | null {
    logger.debug('Lobby match signal received: ' + data);

    return {
        state,
        data: "Lobby match signal received: " + data
    };
}

const PvEmatchTerminate = function (ctx: nkruntime.Context, logger: nkruntime.Logger, nk: nkruntime.Nakama, dispatcher: nkruntime.MatchDispatcher, tick: number, state: PvEBattleData, graceSeconds: number): { state: PvEBattleData } | null {
    logger.debug('Lobby match terminated');

    return {
        state
    };
}


function PvEPlayerLeave(nk: nkruntime.Nakama, state: PvEBattleData, logger: nkruntime.Logger) {
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

        if (bonusAds) updateWalletWithCurrency(nk, state.player1Id, Currency.Coins, totalCoins / 2);

        writeBestRecordLeaderboard(nk, logger, state.player1Id, LeaderboardBestStageAreaId + getMetadataStat(nk, state.player1Id, "area"), state.indexProgression - 1);
    }

    if (bonusAds) {
        setMetadataStat(nk, state.player1Id, "pveBattleButtonAds", false);
    }
}

function GetNewWildBlast(state: PvEBattleData, nk: nkruntime.Nakama, logger: nkruntime.Logger): Blast {
    return getRandomBlastWithAreaId(state.player1Id, nk, Math.floor(state.indexProgression / 5), state.indexProgression % 10 == 0, logger);
}


function ErrorFunc(state: PvEBattleData, error: string, dispatcher: nkruntime.MatchDispatcher, currentBattleState: BattleState) {
    state.battleState = currentBattleState;
    state.player1State = PlayerState.Ready;

    dispatcher.broadcastMessage(OpCodes.ERROR_SERV, JSON.stringify(error));

    return { state };
}

function ConnectedPlayers(s: BattleData): number {
    let count = 0;
    for (const p of Object.keys(s.presences)) {
        if (s.presences[p] !== null) {
            count++;
        }
    }
    return count;
}

//#region  Attack Logic
function ApplyBlastAttack(attacker: BlastEntity, defender: BlastEntity, move: Move, meteo: Meteo, logger: nkruntime.Logger): number {
    let damage = calculateDamage(
        calculateLevelFromExperience(attacker.exp),
        attacker.attack * getStatModifier(Stats.Attack, attacker.modifiers),
        defender.defense * getStatModifier(Stats.Defense, defender.modifiers),
        move.type,
        getBlastDataById(defender.data_id!).type,
        move.power,
        meteo,
        logger
    );

    defender.hp = clamp(defender.hp - damage, 0, Number.POSITIVE_INFINITY);

    return damage;
}

interface AttackContext {
    move: Move;
    attacker: BlastEntity;
    defender: BlastEntity;
    attackerPlatforms: Type[];
    setAttacker: (b: BlastEntity) => void;
    setDefender: (b: BlastEntity) => void;
    getTurnData: () => PlayerTurnData;
    setMoveDamage: (dmg: number) => void;
    setMoveEffect: (effects: MoveEffectData[]) => void;
    meteo: Meteo;
    dispatcher: nkruntime.MatchDispatcher;
    isPlayer: boolean;
}

function ExecuteAttack(ctx: AttackContext, logger: nkruntime.Logger): void {
    // Gestion mana/plateforme
    switch (ctx.move.attackType) {
        case AttackType.Normal:
        case AttackType.Status:
            if (ctx.attacker.mana < ctx.move.cost) return;
            ctx.attacker.mana = clamp(ctx.attacker.mana - ctx.move.cost, 0, Number.POSITIVE_INFINITY);
            ctx.attackerPlatforms = addPlatformType(ctx.attackerPlatforms, ctx.move.type);
            if (calculateWeatherModifier(ctx.meteo, ctx.move.type) > 1) {
                ctx.attackerPlatforms = addPlatformType(ctx.attackerPlatforms, ctx.move.type);
            }
            break;
        case AttackType.Special: {
            const platformCount = getAmountOfPlatformTypeByType(ctx.attackerPlatforms, ctx.move.type);
            if (platformCount < ctx.move.cost) return;
            ctx.attackerPlatforms = removePlatformTypeByType(ctx.attackerPlatforms, ctx.move.type, ctx.move.cost);
            break;
        }
    }

    // Application des effets
    const effects = ApplyMoveEffects(
        ctx.move,
        () => ctx.defender,
        ctx.setDefender,
        () => ctx.attacker,
        ctx.setAttacker
    );
    ctx.setMoveEffect(effects);

    let damage = 0;

    // Application des dégâts
    if (ctx.move.target === Target.Opponent) {
        damage = ApplyBlastAttack(
            ctx.attacker,
            ctx.defender,
            ctx.move,
            ctx.meteo,
            logger
        );
        ctx.setMoveDamage(damage);
    }

    return;
}


function executePlayerAttack(
    state: PvEBattleData,
    move: Move,
    dispatcher: nkruntime.MatchDispatcher,
    logger: nkruntime.Logger
): { state: PvEBattleData } {
    const player1Index = state.p1Index;
    const player2Index = state.p2Index;

    ExecuteAttack({
        move,
        attacker: state.p1Blasts[player1Index]!,
        defender: state.p2Blasts![player2Index],
        attackerPlatforms: state.player1Platform,
        setAttacker: b => state.p1Blasts[player1Index] = b,
        setDefender: b => state.p2Blasts[player2Index] = b,
        getTurnData: () => state.turnStateData.p1TurnData,
        setMoveDamage: dmg => state.turnStateData.p1TurnData.moveDamage = dmg,
        setMoveEffect: eff => state.turnStateData.p1TurnData.moveEffects = eff,
        meteo: state.meteo,
        dispatcher,
        isPlayer: true,
    }, logger);

    state.turnStateData.p1TurnData.type = TurnType.Attack;
    return { state };
}


function ApplyMoveEffects(
    move: Move,
    getTargetBlast: () => BlastEntity,
    setTargetBlast: (blast: BlastEntity) => void,
    getAttacker: () => BlastEntity,
    setAttacker: (blast: BlastEntity) => void
): MoveEffectData[] {
    if (!move.effects || move.effects.length === 0) return [];

    const effectsThisTurn: MoveEffectData[] = [];

    for (const effectData of move.effects) {
        if (effectData.effect === MoveEffect.None) continue;

        let getTarget: () => BlastEntity;
        let setTarget: (b: BlastEntity) => void;

        if (effectData.effectTarget === Target.Self) {
            getTarget = getAttacker;
            setTarget = setAttacker;
        } else {
            getTarget = getTargetBlast;
            setTarget = setTargetBlast;
        }

        if (move.attackType === AttackType.Special || move.attackType === AttackType.Status) {
            const updated = applyEffect(getTarget(), move, effectData);
            setTarget(updated);
            effectsThisTurn.push(effectData);
        } else {
            const result = calculateEffectWithProbability(getTarget(), move, effectData);
            setTarget(result.blast);
            effectsThisTurn.push(result.moveEffect);
        }
    }

    return effectsThisTurn;
}

function executeWildBlastAttack(
    state: PvEBattleData,
    dispatcher: nkruntime.MatchDispatcher,
    logger: nkruntime.Logger
): { state: PvEBattleData } {

    const moveIndex = state.turnStateData.p2TurnData.moveIndex;
    if (moveIndex === -1) {
        state.p2Blasts![state.p2Index].mana = calculateManaRecovery(
            state.p2Blasts![state.p2Index].maxMana,
            state.p2Blasts![state.p2Index].mana,
            true
        );
        state.turnStateData.p2TurnData.type = TurnType.Wait;
        return { state };
    }

    const move = getMoveById(state.p2Blasts![state.p2Index].activeMoveset![moveIndex]);

    ExecuteAttack({
        move,
        attacker: state.p2Blasts![state.p2Index],
        defender: state.p1Blasts[state.p1Index]!,
        attackerPlatforms: state.player2Platform,
        setAttacker: b => state.p2Blasts![state.p2Index] = b,
        setDefender: b => state.p1Blasts[state.p1Index] = b,
        getTurnData: () => state.turnStateData.p2TurnData,
        setMoveDamage: dmg => state.turnStateData.p2TurnData.moveDamage = dmg,
        setMoveEffect: eff => state.turnStateData.p2TurnData.moveEffects = eff,
        meteo: state.meteo,
        dispatcher,
        isPlayer: false,
    }, logger);
    state.turnStateData.p2TurnData.type = TurnType.Attack;
    return { state };
}

function handleAttackTurn(isPlayerFaster: boolean, state: PvEBattleData, move: Move, dispatcher: nkruntime.MatchDispatcher, nk: nkruntime.Nakama, logger: nkruntime.Logger): { state: PvEBattleData } {
    ({ state } = isPlayerFaster ? executePlayerAttack(state, move, dispatcher, logger) : executeWildBlastAttack(state, dispatcher, logger));

    state = checkIfMatchContinue(state);

    return { state };
}

function performAttackSequence(state: PvEBattleData, playerMove: Move, dispatcher: nkruntime.MatchDispatcher, nk: nkruntime.Nakama, logger: nkruntime.Logger): PvEBattleData {

    let firstIsPlayer: boolean;

    if (state.turnStateData.p2TurnData.moveIndex >= 0) {
        const wildMoveId = state.p2Blasts![state.p2Index].activeMoveset![state.turnStateData.p2TurnData.moveIndex];
        const wildMove = getMoveById(wildMoveId);

        if (playerMove.priority == wildMove.priority) {
            firstIsPlayer = getFasterBlast(state.p1Blasts[state.p1Index]!, state.p2Blasts![state.p2Index]);
        } else {
            firstIsPlayer = playerMove.priority > wildMove.priority;
        }

    } else {
        firstIsPlayer = true;
    }

    ({ state } = handleAttackTurn(firstIsPlayer, state, playerMove, dispatcher, nk, logger));

    if (state.battleState === BattleState.Ready) {
        ({ state } = handleAttackTurn(!firstIsPlayer, state, playerMove, dispatcher, nk, logger));
    }

    return state;
}

function checkIfMatchContinue(state: PvEBattleData): PvEBattleData {

    const playerBlast = state.p1Blasts[state.p1Index]!;
    const wildBlast = state.p2Blasts![state.p2Index];

    const wildAlive = isBlastAlive(wildBlast);
    const playerAlive = isBlastAlive(playerBlast);
    const allPlayerDead = isAllBlastDead(state.p1Blasts);

    if (!wildAlive) {
        state.battleState = BattleState.End;
    } else if (allPlayerDead) {
        state.battleState = BattleState.End;
    } else if (!playerAlive) {
        state.battleState = BattleState.WaitForPlayerSwap;
    }

    return state;
}


//#endregion

// region Offer Turn Logic
function getRandomOffer(nk: nkruntime.Nakama, state: PvEBattleData, logger: nkruntime.Logger): Offer {
    let offer: Offer = {
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

