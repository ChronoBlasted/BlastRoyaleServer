// region Setup 

interface PvEBattleData extends BattleData {


    player1Items: Item[];

    indexProgression: number;
    blastDefeated: number;
    blastCatched: number;

    offerTurnStateData: OfferTurnStateData;
}

interface OfferTurnStateData {
    offerOne: Reward;
    offerTwo: Reward;
    offerThree: Reward;
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
        winner: WinnerEnum.None,

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
                type: RewardType.None,
            },
            offerTwo: {
                type: RewardType.None,
            },
            offerThree: {
                type: RewardType.None,
            }
        },

        turnStateData: {
            p1TurnPriority: false,

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
        tickRate: 5, // 1 tick per second = 1 MatchLoop func invocations per second
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

            state.meteo = getRandomMeteo();


            const StartData: StartStateData = {
                newBlastSquad: state.p2Blasts,
                opponentName: "Wild Blast",
                meteo: state.meteo,
                turnDelay: 0,
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

                state.turnStateData.p1TurnData = {
                    type: TurnType.None,
                    index: 0,
                    moveDamage: 0,
                    moveEffects: [],
                }

                let p2Index = getRandomUsableMove(getMovesByIds(state.p2Blasts![state.p2Index].activeMoveset!), state.p2Blasts![state.p2Index].mana, state.player2Platform);

                if (p2Index == -1) {
                    state.turnStateData.p2TurnData = {
                        type: TurnType.Wait,
                        index: 0,
                        moveDamage: 0,
                        moveEffects: [],
                    }
                } else {
                    state.turnStateData.p2TurnData = {
                        type: TurnType.Attack,
                        index: p2Index,
                        moveDamage: 0,
                        moveEffects: [],
                    }
                }

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

                let actionType: TurnType = parseEnum(parsed.type.toString(), TurnType);
                state.turnStateData.p1TurnData.type = actionType;

                actionType === TurnType.Item ? (state.turnStateData.p1TurnData.itemUse = parsed.data) : (state.turnStateData.p1TurnData.index = parsed.data ?? 0);

                if (message.opCode == OpCodes.PLAYER_LEAVE) {
                    PvEPlayerLeave(nk, state, logger);

                    const endDataWinner: EndStateData = {
                        win: true,
                        trophyRewards: 0,
                    };

                    dispatcher.broadcastMessage(OpCodes.MATCH_END, JSON.stringify(endDataWinner));

                    return null;
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
                    let p1Move = getMoveById(state.p1Blasts[state.p1Index]!.activeMoveset![state.turnStateData.p1TurnData.index]);
                    let p2Move = getMoveById(state.p2Blasts[state.p2Index]!.activeMoveset![state.turnStateData.p2TurnData.index]);

                    if (p1Move == null) {
                        ErrorFunc(state, "Player 1 move null", dispatcher, BattleState.Ready);
                        break;
                    }

                    if (p2Move == null && state.turnStateData.p2TurnData.type == TurnType.Attack) {
                        ErrorFunc(state, "Player 2 move null", dispatcher, BattleState.Ready);
                        break;
                    }

                    let moveIndex = state.turnStateData.p2TurnData.index;
                    if (moveIndex === -1) {
                        state.p2Blasts![state.p2Index].mana = calculateManaRecovery(getMaxMana(state.p2Blasts![state.p2Index]), state.p2Blasts![state.p2Index].mana, true);
                        state.turnStateData.p2TurnData.type = TurnType.Wait;

                        executePlayerAttack(true, state, logger, nk, dispatcher);

                    } else {
                        state.turnStateData.p2TurnData.type = TurnType.Attack;

                        performAttackSequence(state, dispatcher, nk, logger);
                    }

                    break;
                //region Player Use Item
                case TurnType.Item:

                    let msgItem = {} as ItemUseJSON;
                    msgItem = state.turnStateData.p1TurnData.itemUse!;
                    msgItem.index_item = clamp(msgItem.index_item, 0, state.player1Items.length - 1)
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
                            state.p1Blasts[msgItem.index_blast] = healStatusBlast(state.p1Blasts[msgItem.index_blast], itemData.status!);
                            break;
                        case ITEM_BEHAVIOUR.Catch:
                            var wildBlastCaptured = false;

                            wildBlastCaptured = isBlastCaptured(state.p2Blasts![state.p2Index].hp, getMaxHp(state.p2Blasts![state.p2Index]), getBlastDataById(state.p2Blasts![state.p2Index].data_id).catchRate, itemData.catchRate!, 1) // TODO Get status bonus

                            if (wildBlastCaptured) {
                                logger.debug('Wild blast Captured !', wildBlastCaptured);

                                state.battleState = BattleState.End;
                            }

                            state.turnStateData.catched = wildBlastCaptured;
                            break;
                        default:
                            break;
                    }

                    if (state.turnStateData.p2TurnData.index === -1) {
                        state.p2Blasts![state.p2Index].mana = calculateManaRecovery(getMaxMana(state.p2Blasts![state.p2Index]), state.p2Blasts![state.p2Index].mana, true);
                        state.turnStateData.p2TurnData.type = TurnType.Wait;
                    } else {
                        state.turnStateData.p2TurnData.type = TurnType.Attack;
                        executePlayerAttack(false, state, logger, nk, dispatcher);
                    }
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

                    if (state.turnStateData.p2TurnData.index === -1) {
                        state.p2Blasts![state.p2Index].mana = calculateManaRecovery(getMaxMana(state.p2Blasts![state.p2Index]), state.p2Blasts![state.p2Index].mana, true);
                        state.turnStateData.p2TurnData.type = TurnType.Wait;
                    } else {
                        state.turnStateData.p2TurnData.type = TurnType.Attack;
                        executePlayerAttack(false, state, logger, nk, dispatcher);
                    } break;
                // region Player Wait
                case TurnType.Wait:
                    state.p1Blasts[state.p1Index]!.mana = calculateManaRecovery(getMaxMana(state.p1Blasts![state.p1Index]), state.p1Blasts[state.p1Index]!.mana, true);

                    if (state.turnStateData.p2TurnData.index === -1) {
                        state.p2Blasts![state.p2Index].mana = calculateManaRecovery(getMaxMana(state.p2Blasts![state.p2Index]), state.p2Blasts![state.p2Index].mana, true);
                        state.turnStateData.p2TurnData.type = TurnType.Wait;
                    } else {
                        state.turnStateData.p2TurnData.type = TurnType.Attack;
                        executePlayerAttack(false, state, logger, nk, dispatcher);
                    } break;
            }

            // region End turn Logic
            
            applyStatusEffectAtEndOfTurn(state.p1Blasts[state.p1Index], state.p2Blasts![state.p2Index], logger);
            applyStatusEffectAtEndOfTurn(state.p2Blasts![state.p2Index], state.p1Blasts[state.p1Index], logger);

            checkIfMatchContinue(state);

            if (isBlastAlive(state.p1Blasts[state.p1Index]!)) state.p1Blasts[state.p1Index]!.mana = calculateManaRecovery(getMaxMana(state.p1Blasts![state.p1Index]), state.p1Blasts[state.p1Index]!.mana, false);
            if (isBlastAlive(state.p2Blasts![state.p2Index])) state.p2Blasts![state.p2Index].mana = calculateManaRecovery(getMaxMana(state.p2Blasts![state.p2Index]), state.p2Blasts![state.p2Index].mana, false);

            if (state.battleState == BattleState.End) {
                dispatcher.broadcastMessage(OpCodes.NEW_BATTLE_TURN, JSON.stringify(state.turnStateData));
            }
            else {
                state.battleState = BattleState.Waiting;

                dispatcher.broadcastMessage(OpCodes.NEW_BATTLE_TURN, JSON.stringify(state.turnStateData));
            }

            EndLoopDebug(logger, state);

            break;
        // region WAIT_FOR_PLAYER_SWAP
        case BattleState.ResolvePlayerSwap:

            messages.forEach(function (message) {

                const validOpCodes = [
                    OpCodes.PLAYER_CHANGE_BLAST,
                ];

                if (!validOpCodes.includes(message.opCode)) {
                    ErrorFunc(state, "OP CODE NOT VALID", dispatcher, BattleState.ResolvePlayerSwap);
                    return;
                }

                logger.debug('______________ PLAYER SWAP BLAST ______________');

                message.data == null ? logger.debug('Receive Op code : %d', message.opCode) : logger.debug('Receive Op code : %d, with data : %e', message.opCode, JSON.parse(nk.binaryToString(message.data)));

                const parsed = JSON.parse(nk.binaryToString(message.data));

                const action: PlayerActionData = {
                    type: parsed.type,
                    data: parsed.data,
                };

                state.turnStateData.p1TurnData.type = action.type;

                if (message.opCode == OpCodes.PLAYER_CHANGE_BLAST) {

                    state.player1State = PlayerState.Busy;

                    var msgChangeBlast = clamp(action.data, 0, state.p1Blasts.length - 1);

                    if (state.p1Index == msgChangeBlast) {
                        ErrorFunc(state, "Cannot change actual blast with actual blast", dispatcher, BattleState.ResolvePlayerSwap);
                        return;
                    }

                    if (!isBlastAlive(state.p1Blasts[msgChangeBlast])) {
                        ErrorFunc(state, "Cannot change actual blast with dead blast", dispatcher, BattleState.ResolvePlayerSwap);
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
                    ErrorFunc(state, "OP CODE NOT VALID", dispatcher, BattleState.WaitForPlayerChooseOffer);
                    return;
                }

                logger.debug('______________ PLAYER CHOOSE OFFER ______________');

                message.data == null ? logger.debug('Receive Op code : %d', message.opCode) : logger.debug('Receive Op code : %d, with data : %e', message.opCode, JSON.parse(nk.binaryToString(message.data)));

                if (message.opCode == OpCodes.PLAYER_CHOOSE_OFFER) {
                    state.indexProgression++;

                    state.player1State = PlayerState.Busy;

                    var indexChooseOffer = clamp(JSON.parse(nk.binaryToString(message.data)), 0, 2);

                    let currentOffer: Reward = {
                        type: RewardType.None,
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
                        case RewardType.Blast:
                            addBlast(nk, logger, state.player1Id, currentOffer.blast!);
                            break;
                        case RewardType.Item:
                            addItem(nk, logger, state.player1Id, currentOffer.item!);
                            break;
                        case RewardType.Coin:
                            updateWalletWithCurrency(nk, state.player1Id, Currency.Coins, currentOffer.amount!, logger);

                            if (getMetadataStat(nk, state.player1Id, "pveBattleButtonAds")) updateWalletWithCurrency(nk, state.player1Id, Currency.Coins, currentOffer.amount! / 2, logger)
                            break;
                        case RewardType.Gem:
                            updateWalletWithCurrency(nk, state.player1Id, Currency.Gems, currentOffer.amount!, logger);

                            if (getMetadataStat(nk, state.player1Id, "pveBattleButtonAds")) updateWalletWithCurrency(nk, state.player1Id, Currency.Gems, currentOffer.amount! / 2, logger)
                            break;
                        case RewardType.None:
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


            if (state.winner == WinnerEnum.Player1 || state.turnStateData.catched) {

                state.indexProgression++;

                if (state.turnStateData.catched) {
                    state.blastCatched++;

                    incrementQuest(state.player1Id, QuestType.CatchBlast, 1, nk, logger);

                    addBlast(nk, logger, state.player1Id, state.p2Blasts![state.p2Index]);
                }
                else {
                    state.blastDefeated++;

                    incrementQuest(state.player1Id, QuestType.DefeatBlast, 1, nk, logger);
                }

                if (state.indexProgression % 5 == 0 && state.indexProgression % 10 != 0) {
                    let items: OfferTurnStateData = {
                        offerOne: getRandomReward(nk, state, logger),
                        offerTwo: getRandomReward(nk, state, logger),
                        offerThree: getRandomReward(nk, state, logger),
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
            else if (state.winner == WinnerEnum.Player2) {
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

        updateWalletWithCurrency(nk, state.player1Id, Currency.Coins, totalCoins, logger);

        if (bonusAds) updateWalletWithCurrency(nk, state.player1Id, Currency.Coins, totalCoins / 2, logger);

        writeBestRecordLeaderboard(nk, logger, state.player1Id, LeaderboardBestStageAreaId + getMetadataStat(nk, state.player1Id, "area"), state.indexProgression - 1);
    }

    if (bonusAds) {
        setMetadataStat(nk, state.player1Id, "pveBattleButtonAds", false);
    }
}

function GetNewWildBlast(state: PvEBattleData, nk: nkruntime.Nakama, logger: nkruntime.Logger): Blast {
    return getRandomBlastWithAreaId(state.player1Id, nk, Math.floor(state.indexProgression / 5), state.indexProgression % 10 == 0, logger);
}




// region Offer Turn Logic
function getRandomReward(nk: nkruntime.Nakama, state: PvEBattleData, logger: nkruntime.Logger): Reward {
    let reward: Reward = {
        type: RewardType.None,
    };

    const random = Math.floor(Math.random() * 4);
    switch (random) {
        case 0:
            reward.type = RewardType.Blast;
            var newBlast = GetNewWildBlast(state, nk, logger);
            reward.blast = newBlast;
            break;
        case 1:
            reward.type = RewardType.Item;
            reward.item = getRandomItem(5);
            break;
        case 2:
            reward.type = RewardType.Coin;
            reward.amount = Math.floor(Math.random() * 1000) + 1;
            break;
        case 3:
            reward.type = RewardType.Gem;
            reward.amount = Math.floor(Math.random() * 10) + 1;
            break;
    }

    return reward;
}

