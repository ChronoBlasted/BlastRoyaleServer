interface PvPBattleData extends BattleData {
    turn_timer: number,
    turn_timer_current: number,


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

        turn_timer: 5,
        turn_timer_current: 0,

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
        state: PvPBattleData,
        tickRate: 1, // 1 tick per second = 1 MatchLoop func invocations per second
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

            const p1_enemyBlast: NewBlastData = {
                id: state.p2Blasts[state.p2Index].data_id,
                exp: state.p2Blasts[state.p2Index].exp,
                iv: state.p2Blasts[state.p2Index].iv,
                boss: state.p2Blasts[state.p2Index].boss,
                shiny: state.p2Blasts[state.p2Index].shiny,
                activeMoveset: state.p2Blasts[state.p2Index].activeMoveset,
                status: Status.None,
            };

            const p2_enemyBlast: NewBlastData = {
                id: state.p1Blasts[state.p1Index].data_id,
                exp: state.p1Blasts[state.p1Index].exp,
                iv: state.p1Blasts[state.p1Index].iv,
                boss: state.p1Blasts[state.p1Index].boss,
                shiny: state.p1Blasts[state.p1Index].shiny,
                activeMoveset: state.p1Blasts[state.p1Index].activeMoveset,
                status: Status.None,
            };

            const startDataP1: StartStateData = {
                newBlastData: p1_enemyBlast,
                meteo: state.meteo,
            };

            const startDataP2: StartStateData = {
                newBlastData: p2_enemyBlast,
                meteo: state.meteo,
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
                        } else if (userId === state.player2Id) {
                            state.player2State = PlayerState.Ready;
                            logger.debug("P2 Ready");
                        }
                        break;
                }
            });

            if (state.player1State === PlayerState.Ready && state.player2State === PlayerState.Ready) {
                dispatcher.broadcastMessage(OpCodes.ENEMY_READY);

                state.turn_timer_current = state.turn_timer;

                state.battleState = BattleState.Ready;
            }
            break;
        case BattleState.Ready:
            for (const message of messages) {
                const userId = message.sender.userId;

                const parsed = JSON.parse(nk.binaryToString(message.data));

                const action: PlayerActionData = {
                    type: parsed.type,
                    data: parsed.data,
                };

                if (userId === state.player1Id) {
                    state.turnStateData.p1TurnData.type = action.type;

                }

                if (userId === state.player2Id) {
                    state.turnStateData.p2TurnData.type = action.type;
                }
            }

            state.turn_timer--;

            const p1Played = state.turnStateData.p1TurnData.type !== TurnType.None;
            const p2Played = state.turnStateData.p2TurnData.type !== TurnType.None;

            if ((p1Played && p2Played) || state.turn_timer <= 0) {
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

                dispatcher.broadcastMessage(OpCodes.NEW_BATTLE_TURN, JSON.stringify(state.turnStateData.p2TurnData), [state.presences[state.player1Id]!]);
                dispatcher.broadcastMessage(OpCodes.NEW_BATTLE_TURN, JSON.stringify(state.turnStateData.p1TurnData), [state.presences[state.player2Id]!]);
            }
            break;
        case BattleState.ResolveTurn:

            if (state.turnStateData.p1TurnData.type === TurnType.Wait && state.turnStateData.p2TurnData.type === TurnType.Wait) {
                logger.debug("Both players waited, resolving turn...");
            }

            state.battleState = BattleState.Waiting;

            break;
        case BattleState.WaitForPlayerSwap:
            break;
        case BattleState.End:

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

function PvPPlayerLeave(nk: nkruntime.Nakama, state: PvPBattleData, logger: nkruntime.Logger) {
    let bonusAds = getMetadataStat(nk, state.player1Id, "pvpBattleButtonAds");

    updateWalletWithCurrency(nk, state.player1Id, Currency.Trophies, -20);
    updateWalletWithCurrency(nk, state.player1Id, Currency.Coins, 1000);

    if (bonusAds) {
        updateWalletWithCurrency(nk, state.player1Id, Currency.Coins, 1000 / 2);
        setMetadataStat(nk, state.player1Id, "pvpBattleButtonAds", false);
    }
}