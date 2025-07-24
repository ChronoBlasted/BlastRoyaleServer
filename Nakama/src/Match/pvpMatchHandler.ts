interface PvPBattleData extends BattleData {
    turnDelay: number, // Délai entre les tours en 1 000ms pour 1 seconde
    turnTimer: number | null, // Timer pour le tour actuel
}

function rpcFindOrCreatePvPBattle(
    context: nkruntime.Context,
    logger: nkruntime.Logger,
    nk: nkruntime.Nakama
): string {
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



const PvPinitMatch = function (ctx: nkruntime.Context, logger: nkruntime.Logger, nk: nkruntime.Nakama, params: { [key: string]: string }): { state: PvPBattleData, tickRate: number, label: string } {

    const PvPBattleData: PvPBattleData = {
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

        turnDelay: 5000,
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
        tickRate: 2, // 1 tick per second = 1 MatchLoop func invocations per second
        label: ''
    };
};


const PvPmatchJoinAttempt = function (ctx: nkruntime.Context, logger: nkruntime.Logger, nk: nkruntime.Nakama, dispatcher: nkruntime.MatchDispatcher, tick: number, state: PvPBattleData, presence: nkruntime.Presence, metadata: { [key: string]: any }): { state: PvPBattleData, accept: boolean, rejectMessage?: string | undefined } | null {
    logger.debug('%q attempted to join PvP match', ctx.userId);

    const playerCount = Object.keys(state.presences).length;

    if (playerCount >= 2) {
        return { state, accept: false, rejectMessage: "Match already full" };
    }

    return { state, accept: true };
}

const PvPmatchJoin = function (ctx: nkruntime.Context, logger: nkruntime.Logger, nk: nkruntime.Nakama, dispatcher: nkruntime.MatchDispatcher, tick: number, state: PvPBattleData, presences: nkruntime.Presence[]): { state: PvPBattleData } | null {

    for (const presence of presences) {
        state.emptyTicks = 0;
        state.presences[presence.userId] = presence;

        if (!state.player1Id) {
            state.player1Id = presence.userId;
        } else if (!state.player2Id) {
            state.player2Id = presence.userId;
        }
    }

    if (Object.keys(state.presences).length === 2) {
        state.battleState = BattleState.Start;
    }

    return { state };
};


const PvPmatchLeave = function (ctx: nkruntime.Context, logger: nkruntime.Logger, nk: nkruntime.Nakama, dispatcher: nkruntime.MatchDispatcher, tick: number, state: PvPBattleData, presences: nkruntime.Presence[]): { state: PvPBattleData } | null {
    for (let presence of presences) {
        logger.info("Player: %s left match: %s.", presence.userId, ctx.matchId);

        if (state.player1Id == presence.userId) {
            PvPPlayerLeave(false, nk, state, logger);
            dispatcher.broadcastMessage(OpCodes.MATCH_END, JSON.stringify(true)); // faire un autre OpCodes
        }

        if (state.player2Id == presence.userId) {
            PvPPlayerLeave(true, nk, state, logger);
            dispatcher.broadcastMessage(OpCodes.MATCH_END, JSON.stringify(true)); // faire un autre OpCodes
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

const PvPmatchLoop = function (ctx: nkruntime.Context, logger: nkruntime.Logger, nk: nkruntime.Nakama, dispatcher: nkruntime.MatchDispatcher, tick: number, state: PvPBattleData, messages: nkruntime.MatchMessage[]): { state: PvPBattleData } | null {

    switch (state.battleState) {
        case BattleState.Start:
            logger.debug('______________ START BATTLE ______________');

            const keys = Object.keys(state.presences);
            const player1_presence = state.presences[keys[0]]!;
            const player2_presence = state.presences[keys[1]]!;

            state.player1Id = player1_presence.userId;
            state.player2Id = player2_presence.userId;

            state.p1Index = 0;
            state.p2Index = 0;

            state.p1Blasts = getDeckBlast(nk, logger, state.player1Id);
            state.p2Blasts = getDeckBlast(nk, logger, state.player2Id);

            state.meteo = getRandomMeteo();

            const p1Account = nk.accountGetId(state.player1Id);
            const p2Account = nk.accountGetId(state.player2Id);
            const p1Stat = p1Account.user.metadata.playerStat as PlayerStat;
            const p2Stat = p2Account.user.metadata.playerStat as PlayerStat;


            const startDataP1: StartStateData = {
                newBlastSquad: state.p2Blasts,
                opponentName: p2Account.user.username,
                opponentTrophy: getCurrencyInWallet(nk, state.player1Id, Currency.Trophies),
                opponentStats: p2Stat,
                meteo: state.meteo,
                turnDelay: state.turnDelay,
            };

            const startDataP2: StartStateData = {
                newBlastSquad: state.p1Blasts,
                opponentName: p1Account.user.username,
                opponentTrophy: getCurrencyInWallet(nk, state.player2Id, Currency.Trophies),
                opponentStats: p1Stat,
                meteo: state.meteo,
                turnDelay: state.turnDelay,
            };

            dispatcher.broadcastMessage(
                OpCodes.MATCH_START,
                JSON.stringify(startDataP1),
                [player1_presence]
            );

            dispatcher.broadcastMessage(
                OpCodes.MATCH_START,
                JSON.stringify(startDataP2),
                [player2_presence]
            );

            state.battleState = BattleState.Waiting;
            break;

        case BattleState.Waiting:
            logger.debug('______________ START WAITING ______________');

            messages.forEach(function (message) {
                switch (message.opCode) {
                    case OpCodes.PLAYER_READY:
                        const userId = message.sender.userId;

                        if (userId === state.player1Id) {
                            state.player1State = PlayerState.Ready;
                            logger.debug("P1 Ready");
                        } else if (userId === state.player2Id) {
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
                }

                state.turnStateData.p2TurnData = {
                    type: TurnType.None,
                    index: 0,
                    moveDamage: 0,
                    moveEffects: [],
                }
            }
            break;
        case BattleState.Ready:

            logger.debug('______________ START READY ______________');

            const now = Date.now();

            for (const message of messages) {
                const userId = message.sender.userId;

                const parsed = JSON.parse(nk.binaryToString(message.data));

                const action: PlayerActionData = {
                    type: parsed.type,
                    data: parsed.data ?? 0,
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

                if (!isBlastAlive(state.p1Blasts[state.p1Index]) || !isBlastAlive(state.p2Blasts[state.p2Index])) {
                    state.battleState = BattleState.ResolvePlayerSwap;
                } else {
                    state.battleState = BattleState.ResolveTurn;
                }

                state.turnTimer = null;
            }
            break;

        case BattleState.ResolveTurn: {
            logger.debug('______________ START RESOLVE TURN ______________');
            logger.debug("Resolving turn: P1 Action: %s, P2 Action: %s", state.turnStateData.p1TurnData.type, state.turnStateData.p2TurnData.type);

            const p1 = state.turnStateData.p1TurnData;
            const p2 = state.turnStateData.p2TurnData;

            if (p1.type === TurnType.Swap) {
                if (trySwapBlast(state.p1Index, p1, state.p1Blasts, i => state.p1Index = i, state, dispatcher)) break;
            }

            if (p2.type === TurnType.Swap) {
                if (trySwapBlast(state.p2Index, p2, state.p2Blasts, i => state.p2Index = i, state, dispatcher)) break;
            }

            if (p1.type === TurnType.Attack) {
                p1.index = clamp(p1.index, 0, 3);
                const move = getMoveById(state.p1Blasts[state.p1Index]!.activeMoveset![p1.index]);
                if (!move) {
                    ErrorFunc(state, "Player 1 move null", dispatcher, BattleState.Ready);
                    break;
                }
            }

            if (p2.type === TurnType.Attack) {
                p2.index = clamp(p2.index, 0, 3);
                const move = getMoveById(state.p2Blasts[state.p2Index]!.activeMoveset![p2.index]);
                if (!move) {
                    ErrorFunc(state, "Player 2 move null", dispatcher, BattleState.Ready);
                    break;
                }
            }

            if (p1.type === TurnType.Attack && p2.type === TurnType.Attack) {
                performAttackSequence(state, dispatcher, nk, logger);
            } else if (p1.type === TurnType.Attack) {
                executePlayerAttack(true, state, logger, dispatcher);
            } else if (p2.type === TurnType.Attack) {
                executePlayerAttack(false, state, logger, dispatcher);
            }

            if (p1.type === TurnType.Wait) {
                state.p1Blasts[state.p1Index]!.mana = calculateManaRecovery(state.p1Blasts[state.p1Index]!.maxMana, state.p1Blasts[state.p1Index]!.mana, true);
            }

            if (p2.type === TurnType.Wait) {
                state.p2Blasts[state.p2Index]!.mana = calculateManaRecovery(state.p2Blasts[state.p2Index]!.maxMana, state.p2Blasts[state.p2Index]!.mana, true);
            }

            ({ blast: state.p1Blasts[state.p1Index]!, otherBlast: state.p2Blasts![state.p2Index] } = applyStatusEffectAtEndOfTurn(state.p1Blasts[state.p1Index]!, state.p2Blasts![state.p2Index]));
            ({ blast: state.p2Blasts![state.p2Index], otherBlast: state.p1Blasts[state.p1Index]! } = applyStatusEffectAtEndOfTurn(state.p2Blasts![state.p2Index], state.p1Blasts[state.p1Index]!));

            checkIfMatchContinue(state);

            if (isBlastAlive(state.p2Blasts![state.p2Index])) {
                state.p2Blasts![state.p2Index].mana = calculateManaRecovery(state.p2Blasts![state.p2Index].maxMana, state.p2Blasts![state.p2Index].mana, false);
            }

            if (isBlastAlive(state.p1Blasts[state.p1Index]!)) {
                state.p1Blasts[state.p1Index]!.mana = calculateManaRecovery(state.p1Blasts[state.p1Index]!.maxMana, state.p1Blasts[state.p1Index]!.mana, false);
            }

            SendTurnState(dispatcher, state, OpCodes.NEW_BATTLE_TURN);

            if ((state.battleState as BattleState) !== BattleState.End && (state.battleState as BattleState) !== BattleState.WaitingForPlayerSwap) { state.battleState = BattleState.Waiting; }


            EndLoopDebug(logger, state);

            break;
        }

        case BattleState.WaitingForPlayerSwap:
            logger.debug('______________ START WAITING FOR PLAYER SWAP ______________');

            messages.forEach(function (message) {
                switch (message.opCode) {
                    case OpCodes.PLAYER_READY:
                        const userId = message.sender.userId;

                        if (userId === state.player1Id) {
                            state.player1State = PlayerState.Ready;
                            logger.debug("P1 Ready");
                        } else if (userId === state.player2Id) {
                            state.player2State = PlayerState.Ready;
                            logger.debug("P2 Ready");
                        }
                        break;
                }
            });

            if (state.player1State === PlayerState.Ready && state.player2State === PlayerState.Ready) {
                dispatcher.broadcastMessage(OpCodes.PLAYER_READY_MUST_CHANGE);

                state.battleState = BattleState.ReadyForPlayerSwap;

                state.player1State = PlayerState.Busy;
                state.player2State = PlayerState.Busy;

                state.turnStateData.p1TurnData = {
                    type: TurnType.None,
                    index: 0,
                    moveDamage: 0,
                    moveEffects: [],
                }

                state.turnStateData.p2TurnData = {
                    type: TurnType.None,
                    index: 0,
                    moveDamage: 0,
                    moveEffects: [],
                }
            }
            break;

        case BattleState.ReadyForPlayerSwap: {
            logger.debug('______________ START READY FOR PLAYER SWAP ______________');

            const now = Date.now();

            for (const message of messages) {

                const validOpCodes = [
                    OpCodes.PLAYER_CHANGE_BLAST,
                ];

                if (!validOpCodes.includes(message.opCode)) {
                    ErrorFunc(state, "OP CODE NOT VALID", dispatcher, BattleState.ResolvePlayerSwap);
                    break;
                }

                const userId = message.sender.userId;

                const parsed = JSON.parse(nk.binaryToString(message.data));

                const action: PlayerActionData = {
                    type: parseEnum(parsed.type.toString(), TurnType),
                    data: parsed.data ?? 0,
                };

                if (userId === state.player1Id) {

                    if (isBlastAlive(state.p1Blasts[state.p1Index])) {
                        ErrorFunc(state, "Your blast is alive", dispatcher, BattleState.ReadyForPlayerSwap);
                        break;
                    }

                    state.turnStateData.p1TurnData.type = action.type;
                    state.turnStateData.p1TurnData.index = action.data;
                }

                if (userId === state.player2Id) {

                    if (isBlastAlive(state.p2Blasts[state.p2Index])) {
                        ErrorFunc(state, "Your blast is alive", dispatcher, BattleState.ReadyForPlayerSwap);
                        break;
                    }

                    state.turnStateData.p2TurnData.type = action.type;
                    state.turnStateData.p2TurnData.index = action.data;
                }
            }

            if (!state.turnTimer) {
                state.turnTimer = now + state.turnDelay;
            }

            const p1Ready = isBlastAlive(state.p1Blasts[state.p1Index]) || state.turnStateData.p1TurnData.type === TurnType.Swap;
            const p2Ready = isBlastAlive(state.p2Blasts[state.p2Index]) || state.turnStateData.p2TurnData.type === TurnType.Swap;

            if (now >= state.turnTimer || (p1Ready && p2Ready)) {

                let firstIndex = 0;

                if (!isBlastAlive(state.p1Blasts[state.p1Index]) && state.turnStateData.p1TurnData.type != TurnType.Swap) {
                    state.turnStateData.p1TurnData.type = TurnType.Swap;
                    state.player1State = PlayerState.Busy;
                    firstIndex = getFirstAliveBlastIndex(state.p1Blasts);
                    state.turnStateData.p1TurnData.index = firstIndex;
                }

                if (!isBlastAlive(state.p2Blasts[state.p2Index]) && state.turnStateData.p2TurnData.type != TurnType.Swap) {
                    state.turnStateData.p2TurnData.type = TurnType.Swap;
                    state.player2State = PlayerState.Busy;
                    firstIndex = getFirstAliveBlastIndex(state.p2Blasts);
                    state.turnStateData.p2TurnData.index = firstIndex;
                }

                state.battleState = BattleState.ResolvePlayerSwap;
                state.turnTimer = null;
            }

            break;
        }
        case BattleState.ResolvePlayerSwap: {
            logger.debug('______________ START WAIT FOR PLAYER SWAP ______________');

            const p1 = state.turnStateData.p1TurnData;
            const p2 = state.turnStateData.p2TurnData;

            if (p1.type === TurnType.Swap) {
                if (trySwapBlast(state.p1Index, p1, state.p1Blasts, i => state.p1Index = i, state, dispatcher)) break;
            }

            if (p2.type === TurnType.Swap) {
                if (trySwapBlast(state.p2Index, p2, state.p2Blasts, i => state.p2Index = i, state, dispatcher)) break;
            }

            SendTurnState(dispatcher, state, OpCodes.PLAYER_MUST_CHANGE_BLAST);

            state.battleState = BattleState.Waiting;

            break;
        }
        case BattleState.End:
            logger.debug('______________ START END ______________');

            const allP1BlastFainted = isAllBlastDead(state.p1Blasts);
            const allP2BlastFainted = isAllBlastDead(state.p2Blasts);

            if (allP1BlastFainted && allP2BlastFainted) {

                dispatcher.broadcastMessage(OpCodes.MATCH_END, JSON.stringify(false), [
                    state.presences[state.player1Id]!,
                    state.presences[state.player2Id]!
                ]);

                return null;
            }

            if (allP1BlastFainted) {

                dispatcher.broadcastMessage(OpCodes.MATCH_END, JSON.stringify(false), [state.presences[state.player1Id]!]);
                dispatcher.broadcastMessage(OpCodes.MATCH_END, JSON.stringify(true), [state.presences[state.player2Id]!]);

                updateWalletWithCurrency(nk, state.player1Id, Currency.Trophies, -20);
                updateWalletWithCurrency(nk, state.player2Id, Currency.Trophies, 20);


                return null;
            }

            if (allP2BlastFainted) {
                dispatcher.broadcastMessage(OpCodes.MATCH_END, JSON.stringify(true), [state.presences[state.player1Id]!]);
                dispatcher.broadcastMessage(OpCodes.MATCH_END, JSON.stringify(false), [state.presences[state.player2Id]!]);

                updateWalletWithCurrency(nk, state.player1Id, Currency.Trophies, 20);
                updateWalletWithCurrency(nk, state.player2Id, Currency.Trophies, -20);

                return null;
            }
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

const PvPmatchSignal = function (ctx: nkruntime.Context, logger: nkruntime.Logger, nk: nkruntime.Nakama, dispatcher: nkruntime.MatchDispatcher, tick: number, state: PvPBattleData, data: string): { state: PvPBattleData, data?: string } | null {
    logger.debug('Lobby match signal received: ' + data);

    return {
        state,
        data: "Lobby match signal received: " + data
    };
}

const PvPmatchTerminate = function (ctx: nkruntime.Context, logger: nkruntime.Logger, nk: nkruntime.Nakama, dispatcher: nkruntime.MatchDispatcher, tick: number, state: PvPBattleData, graceSeconds: number): { state: PvPBattleData } | null {
    logger.debug('Lobby match terminated');

    return {
        state
    };
}

function SendTurnState(dispatcher: nkruntime.MatchDispatcher, state: PvPBattleData, OpCodes: OpCodes) {
    dispatcher.broadcastMessage(OpCodes, JSON.stringify(state.turnStateData), [state.presences[state.player1Id]!]);

    const reversedTurnStateData = {
        p1TurnData: state.turnStateData.p2TurnData,
        p2TurnData: state.turnStateData.p1TurnData,
        catched: state.turnStateData.catched
    };

    dispatcher.broadcastMessage(OpCodes, JSON.stringify(reversedTurnStateData), [state.presences[state.player2Id]!]);
}

function PvPPlayerLeave(p1Win: boolean, nk: nkruntime.Nakama, state: PvPBattleData, logger: nkruntime.Logger) {

    if (p1Win) {
        incrementMetadataStat(nk, state.player1Id, "win", 1);
        incrementMetadataStat(nk, state.player2Id, "loose", 1);

        updateWalletWithCurrency(nk, state.player1Id, Currency.Trophies, 20);
        updateWalletWithCurrency(nk, state.player2Id, Currency.Trophies, -20);

        updateWalletWithCurrency(nk, state.player1Id, Currency.Coins, 1000);
    }
    else {
        incrementMetadataStat(nk, state.player2Id, "win", 1);
        incrementMetadataStat(nk, state.player1Id, "loose", 1);

        updateWalletWithCurrency(nk, state.player2Id, Currency.Trophies, 20);
        updateWalletWithCurrency(nk, state.player1Id, Currency.Trophies, -20);

        updateWalletWithCurrency(nk, state.player2Id, Currency.Coins, 1000);
    }

    let bonusP1Ads = getMetadataStat(nk, state.player1Id, "pvpBattleButtonAds");
    let bonusP2Ads = getMetadataStat(nk, state.player2Id, "pvpBattleButtonAds");

    if (bonusP1Ads) {
        updateWalletWithCurrency(nk, state.player1Id, Currency.Coins, 1000 / 2);
        setMetadataStat(nk, state.player1Id, "pvpBattleButtonAds", false);
    }

    if (bonusP2Ads) {
        updateWalletWithCurrency(nk, state.player2Id, Currency.Coins, 1000 / 2);
        setMetadataStat(nk, state.player2Id, "pvpBattleButtonAds", false);
    }
}
