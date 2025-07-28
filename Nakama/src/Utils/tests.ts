function rpcCalculateAttackDamage(context: nkruntime.Context, logger: nkruntime.Logger, nk: nkruntime.Nakama, payload: string): string {
    const userId = context.userId;
    if (!userId) {
        throw new Error("User not authenticated");
    }

    const raw = JSON.parse(payload);

    const params: CalculateDamageParams = {
        attackerLevel: raw.attackerLevel,
        attackerAttack: raw.attackerAttack,
        defenderDefense: raw.defenderDefense,
        attackType: parseEnum<Type>(raw.attackType, Type),
        defenderType: parseEnum<Type>(raw.defenderType, Type),
        movePower: raw.movePower,
        meteo: parseEnum<Meteo>(raw.meteo, Meteo),
    };

    var result = calculateDamage(
        params.attackerLevel,
        params.attackerAttack,
        params.defenderDefense,
        params.attackType,
        params.defenderType,
        params.movePower,
        params.meteo,
        logger
    );

    return JSON.stringify(result);
}

interface CalculateDamageParams {
    attackerLevel: number;
    attackerAttack: number;
    defenderDefense: number;
    attackType: Type;
    defenderType: Type;
    movePower: number;
    meteo: Meteo;
}

function rpcCalculateExpGain(context: nkruntime.Context, logger: nkruntime.Logger, nk: nkruntime.Nakama, payload: string): string {
    const userId = context.userId;
    if (!userId) {
        throw new Error("User not authenticated");
    }

    const raw = JSON.parse(payload);

    const params: ExpGainParams = {
        expYield: raw.expYield,
        enemyLevel: raw.enemyLevel,
        yourLevel: raw.yourLevel,
    };

    var result = calculateExperienceGain(
        params.expYield,
        params.yourLevel,
        params.enemyLevel,

    );

    return JSON.stringify(result);
}

interface ExpGainParams {
    expYield: number;
    enemyLevel: number;
    yourLevel: number;
}

function rpcCalculateLevelFromExp(context: nkruntime.Context, logger: nkruntime.Logger, nk: nkruntime.Nakama, payload: string): string {
    const userId = context.userId;
    if (!userId) {
        throw new Error("User not authenticated");
    }

    const raw: number = JSON.parse(payload);

    var result = calculateLevelFromExperience(raw);

    return JSON.stringify(result);
}

function rpcCalculateExpFromLevel(context: nkruntime.Context, logger: nkruntime.Logger, nk: nkruntime.Nakama, payload: string): string {
    const userId = context.userId;
    if (!userId) {
        throw new Error("User not authenticated");
    }

    const raw: number = JSON.parse(payload);

    var result = calculateExperienceFromLevel(raw);

    return JSON.stringify(result);
}



function rpcCalculateBlastStat(context: nkruntime.Context, logger: nkruntime.Logger, nk: nkruntime.Nakama, payload: string): string {
    const userId = context.userId;
    if (!userId) {
        throw new Error("User not authenticated");
    }

    const raw = JSON.parse(payload);

    const params: BaseStats = {
        baseStat: raw.baseStat,
        iv: raw.iv,
        level: raw.level,
    };

    var result = calculateBlastStat(params.baseStat, params.iv, params.level);

    return JSON.stringify(result);
}

function rpcCalculateBlastHP(context: nkruntime.Context, logger: nkruntime.Logger, nk: nkruntime.Nakama, payload: string): string {
    const userId = context.userId;
    if (!userId) {
        throw new Error("User not authenticated");
    }

    const raw = JSON.parse(payload);

    const params: BaseStats = {
        baseStat: raw.baseStat,
        iv: raw.iv,
        level: raw.level,
    };

    var result = calculateBlastHp(params.baseStat, params.iv, params.level);

    return JSON.stringify(result);
}

function rpcCalculateBlastMana(context: nkruntime.Context, logger: nkruntime.Logger, nk: nkruntime.Nakama, payload: string): string {
    const userId = context.userId;
    if (!userId) {
        throw new Error("User not authenticated");
    }

    const raw = JSON.parse(payload);

    const params: BaseStats = {
        baseStat: raw.baseStat,
        iv: raw.iv,
        level: raw.level,
    };

    var result = calculateBlastMana(params.baseStat, params.iv, params.level);

    return JSON.stringify(result);
}


interface BaseStats {
    baseStat: number;
    iv: number;
    level: number;
}
