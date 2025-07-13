interface PvPBattleData extends BattleData {
    turnStateData: TurnStateData;
}

function rpcFindOrCreatePvPBattle(context: nkruntime.Context, logger: nkruntime.Logger, nk: nkruntime.Nakama): string {
    var matchId = nk.matchCreate('playerVersusPlayer', {});
    return JSON.stringify(matchId);
}

const PvPinitMatch = function (ctx: nkruntime.Context, logger: nkruntime.Logger, nk: nkruntime.Nakama, params: { [key: string]: string }): { state: PvPBattleData, tickRate: number, label: string } {

    const PvPBattleData: PvPBattleData = {
        emptyTicks: 0,
        presences: {},
        battle_state: BattleState.START,

        player1_state: PlayerState.BUSY,
        player1_id: "",

        player2_state: PlayerState.BUSY,
        player2_id: "",

        p1_index: 0,
        p1_blasts: [],
        player1_items: [],
        player1_platform: [],

        p2_index: 0,
        p2_blasts: [],
        player2_items: [],
        player2_platform: [],

        meteo: Meteo.None,

        turnStateData: {
            p1_move_damage: 0,
            p1_move_effects: [],

            p2_turn_type: TurnType.NONE,
            p2_move_index: 0,
            p2_move_damage: 0,
            p2_move_effects: [],
        },
    };

    return {
        state: PvPBattleData,
        tickRate: 2, // 1 tick per second = 1 MatchLoop func invocations per second
        label: ''
    };
};


const PvPmatchJoinAttempt = function (ctx: nkruntime.Context, logger: nkruntime.Logger, nk: nkruntime.Nakama, dispatcher: nkruntime.MatchDispatcher, tick: number, state: PvPBattleData, presence: nkruntime.Presence, metadata: { [key: string]: any }): { state: PvPBattleData, accept: boolean, rejectMessage?: string | undefined } | null {
    logger.debug('%q attempted to join Lobby match', ctx.userId);

    return {
        state,
        accept: true
    };
}

const PvPmatchJoin = function (ctx: nkruntime.Context, logger: nkruntime.Logger, nk: nkruntime.Nakama, dispatcher: nkruntime.MatchDispatcher, tick: number, state: PvPBattleData, presences: nkruntime.Presence[]): { state: PvPBattleData } | null {
    for (const presence of presences) {
        state.emptyTicks = 0;
        state.presences[presence.userId] = presence;
    }

    return {
        state
    };
}

const PvPmatchLeave = function (ctx: nkruntime.Context, logger: nkruntime.Logger, nk: nkruntime.Nakama, dispatcher: nkruntime.MatchDispatcher, tick: number, state: PvPBattleData, presences: nkruntime.Presence[]): { state: PvPBattleData } | null {
    for (let presence of presences) {
        logger.info("Player: %s left match: %s.", presence.userId, ctx.matchId);

        if (state.player1_id == presence.userId) {
            PvPPlayerLeave(nk, state, logger);
            dispatcher.broadcastMessage(OpCodes.MATCH_END, JSON.stringify(true));
        }

        if (state.player2_id == presence.userId) {
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

    switch (state.battle_state) {
        case BattleState.START:
            break;
        case BattleState.WAITING:
            break;
        case BattleState.READY:
            break;
        case BattleState.WAITFORPLAYERSWAP:
            break;
        case BattleState.END:
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
    let bonusAds = getMetadataStat(nk, state.player1_id, "pvpBattleButtonAds");

    updateWalletWithCurrency(nk, state.player1_id, Currency.Trophies, -20);

    updateWalletWithCurrency(nk, state.player1_id, Currency.Coins, 1000);

    if (bonusAds) {
        updateWalletWithCurrency(nk, state.player1_id, Currency.Coins, 1000 / 2);
        setMetadataStat(nk, state.player1_id, "pvpBattleButtonAds", false);
    }
}